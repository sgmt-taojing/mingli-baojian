# -*- coding: utf-8 -*-
"""
A族乱码（GBK-as-Latin1）生产修复脚本
用法: python3 _moji_repair.tmp.py dry   → 干跑只报告
      python3 _moji_repair.tmp.py run   → 备份+修复+FTS同步
铁律: 仅做确定性字节级还原，不改写语义；原条目先备份到 kb_mojibake_backup（可逆）
"""
import sqlite3, re, sys, datetime

DB = '/Users/tom/kimi/projects/mingli-baojian/server/database/yidao.db'
MODE = sys.argv[1] if len(sys.argv) > 1 else 'dry'

PINYIN_VOWELS = set('āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜĀÁǍÀĒÉĚÈĪÍǏÌŌÓǑÒŪÚǓÙǕǗǙǛêÊńňǹḿ')

def is_high(ch):
    o = ord(ch)
    if 0xA0 <= o <= 0xFF and ch not in '×÷·': return True   # 排除合法间隔号·(0xB7 目录点线高频)
    if 0x0100 <= o <= 0x017F and ch not in PINYIN_VOWELS: return True
    return False

def is_cjk(ch):
    return 0x4E00 <= ord(ch) <= 0x9FFF or 0x3400 <= ord(ch) <= 0x4DBF

# 可疑段：高位字符 + 空格/制表/ASCII数字标点（不允许CJK/ASCII字母混入）
RUN_RE = re.compile(r'[ -ÿĀ-ſ0-9 \t，。、；：？！""''（）《》〈〉【】…—·~～\-—/\\|<>《》「」『』%&*#@!?\.,;:\'"()\[\]{}+=_^$£¥€©®°±²³´µ¶·¸¹º»¼½¾¿\n]{4,}')

def high_count(s):
    return sum(1 for ch in s if is_high(ch))

def ascii_letter_ratio(s):
    letters = sum(1 for ch in s if ch.isascii() and ch.isalpha())
    return letters / max(1, len(s))

def decode_run(run):
    """整段严格 latin1->gb18030；失败则按空格分词逐词严格解码"""
    try:
        return run.encode('latin-1').decode('gb18030')
    except Exception:
        pass
    # 逐词（空格分隔）严格解码，解码失败的词保留原样
    out = []
    for tok in re.split(r'( +|\t+|\n+)', run):
        if not tok or tok.isspace():
            out.append(tok)
            continue
        try:
            out.append(tok.encode('latin-1').decode('gb18030'))
        except Exception:
            out.append(tok)
    return ''.join(out)

def repair_text(text):
    """分段修复，返回 (新文本, 修复段数)"""
    if not text:
        return text, 0
    fixed_runs = 0
    def repl(m):
        nonlocal fixed_runs
        run = m.group(0)
        if high_count(run) < 2:
            return run
        if ascii_letter_ratio(run) > 0.10:   # 拼音/英文段护栏
            return run
        before_h = high_count(run)
        decoded = decode_run(run)
        after_h = high_count(decoded)
        # 验收：高位字符消除>=80% 且 解码出至少1个CJK 或 段本来就很短
        if after_h <= before_h * 0.2 and (any(is_cjk(ch) for ch in decoded) or len(run) <= 6):
            fixed_runs += 1
            return decoded
        return run
    new = RUN_RE.sub(repl, text)
    return new, fixed_runs

def main():
    import json, os
    PLAN_FILE = '/tmp/moji_plan_r59.json'
    db = sqlite3.connect(DB)

    if MODE == 'apply':
        # ── 快速执行阶段：读计划文件直接写入 ──
        plan = json.load(open(PLAN_FILE, encoding='utf-8'))
        print(f'[apply] 计划 {len(plan)} 条')
        ts = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        cur = db.cursor()
        cur.execute("""CREATE TABLE IF NOT EXISTS kb_mojibake_backup(
            entry_id TEXT PRIMARY KEY, module TEXT, title TEXT, content TEXT, backed_up_at TEXT)""")
        n_bak = n_upd = n_fts = 0
        cur.execute('BEGIN')
        try:
            for p in plan:
                cur.execute("INSERT OR REPLACE INTO kb_mojibake_backup(entry_id,module,title,content,backed_up_at) VALUES(?,?,?,?,?)",
                            (p['eid'], p['mod'], p['title'], p['content'], ts))
                n_bak += 1
                cur.execute("UPDATE kb_formal SET title=?, content=? WHERE entry_id=?", (p['new_title'], p['new_content'], p['eid']))
                n_upd += 1
                cur.execute("DELETE FROM kb_fts5 WHERE entry_id=?", (p['eid'],))
                row = cur.execute("SELECT module, summary, content, tags, category FROM kb_formal WHERE entry_id=?", (p['eid'],)).fetchone()
                if row:
                    cur.execute("INSERT INTO kb_fts5(entry_id,module,summary,content,tags,category) VALUES(?,?,?,?,?,?)",
                                (p['eid'], row[0], row[1] or '', row[2] or '', row[3] or '', row[4] or ''))
                    n_fts += 1
            cur.execute('COMMIT')
            print(f'[apply] 备份 {n_bak} · 修复 {n_upd} · FTS同步 {n_fts} · {ts}')
        except Exception as e:
            cur.execute('ROLLBACK')
            print('[apply] 失败已回滚:', e)
            raise
        return

    # ── 扫描阶段（dry/plan 共用）──
    rows = db.execute("SELECT entry_id, module, title, content FROM kb_formal").fetchall()
    cands = []
    for eid, mod, title, content in rows:
        t_title = title if isinstance(title, str) else ''
        t_content = content if isinstance(content, str) else ''
        text = t_title + '\n' + t_content
        h = high_count(text)
        if h >= 8 and ascii_letter_ratio(text) < 0.15:
            cands.append((eid, mod, t_title, t_content, h))
    print(f'A族候选: {len(cands)} 条')

    repaired, skipped, samples = 0, 0, []
    plan = []
    for eid, mod, title, content, h_before in cands:
        new_title, _ = repair_text(title)
        new_content, _ = repair_text(content)
        h_after = high_count(new_title + '\n' + new_content)
        if h_after <= h_before * 0.3 and h_before - h_after >= 6:
            repaired += 1
            plan.append({'eid': eid, 'mod': mod, 'title': title, 'content': content,
                         'new_title': new_title, 'new_content': new_content})
            if len(samples) < 8:
                samples.append((eid, mod, content[:90], new_content[:90]))
        else:
            skipped += 1
    print(f'可修复: {repaired} 条 · 验收不过跳过: {skipped} 条')
    print()
    for eid, mod, before, after in samples:
        print(f'--- {mod} | {eid[:60]}')
        print('  前:', repr(before))
        print('  后:', repr(after))

    if MODE == 'plan':
        json.dump(plan, open(PLAN_FILE, 'w', encoding='utf-8'), ensure_ascii=False)
        print(f'\n[plan] 计划已存 {PLAN_FILE}（{len(plan)} 条），下一步用 apply 执行。')
        return

    if MODE != 'run':
        print('\n[dry-run] 未写入。确认样本后用 plan + apply 执行。')
        return

if __name__ == '__main__':
    main()

# ═══ 执行记录（2026-10-20 R59）═══
# - A族修复 94 条（GBK-as-Latin1 全乱码，字节级可逆还原；原文备份 kb_mojibake_backup 表）
# - junk 标记 180 条（kb_corpus_tag，可逆）：
#     KJ-* 178 条  JS 源码被误当文本切片入库  signals=junk/js-source-pollution
#     MS|ziwei 2 条  A2 复合乱码（26 种编码管道穷举无解）signals=junk/mojibake-unrecoverable-a2
# - B族 1347 条（OCR 噪声型，70-85% 可读）保留不标，挂账待源文件重整
# - 跳过 563 条（保守策略：拼音段/混合段宁可不修不可错修）
# - DB 外部备份：/tmp/yidao.db.bak-r59（7.4GB，确认无回滚需求后可删）
