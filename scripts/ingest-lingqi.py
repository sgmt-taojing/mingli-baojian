#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ingest-lingqi.py — 《灵棋经》入 kb_formal（2026-10-20 · 第三十七轮）
源：corpus/lingqi-jing/raw-ocr-542-637.txt（项目内《术数全书·上册》Vision OCR，灵棋经章节，
    汉东方朔撰·丛书集成本；仅依据项目内文献，不外采、不杜撰）。
结构：课目锚点「[X上][Y中][Z下] + 卦名卦 + XX之象」切分，每课含 象曰/颜曰/何曰/陈曰/刘曰/诗曰；
      卷首占仪（焚香捧棋仪制）单独成条；末课尾部目录信息裁除。
产出：
  1. corpus/lingqi-jing/lingqi-jing.md —— 清洗后全课存档（带出处头注）
  2. kb_formal module='lingqi'，trust=0.9（OCR 文本，低于净本 0.95），fingerprint='LQJ|' 幂等
  3. kb_fts5 批量同步（无触发器，手动 INSERT）
  4. kb_module_registry 注册 lingqi → 卜筮 group
已知残缺：全书 125 课，OCR 有效锚点 110 课，15 课 OCR 残损待校（绝不杜撰补齐）。
"""
import hashlib, re, sqlite3, subprocess, sys
from pathlib import Path
from lib.kb_ingest import KBIngestor
from yidao_safe import safe_close

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT / 'server' / 'database' / 'yidao.db'
RAW = ROOT / 'corpus' / 'lingqi-jing' / 'raw-ocr-542-637.txt'
OUT = ROOT / 'corpus' / 'lingqi-jing' / 'lingqi-jing.md'
SRC = 'shushu-quanshu:上册·灵棋经(VisionOCR)'
FP_PREFIX = 'LQJ|'

ANCHOR = re.compile(r'((?:[一二三四]上)?(?:[一二三四]中)?(?:[一二三四]下)?)\s*([一-鿿]{2,4}卦)\s*\n?\s*([一-鿿]{2,6}之象)')


def parse():
    t = RAW.read_text(encoding='utf-8')
    t = re.sub(r'=====.*?=====', '', t)
    t = re.sub(r'【第\d+页】', '\n', t)
    ms = list(ANCHOR.finditer(t))
    ke = []
    for m in ms:
        shape, name = m.group(1), m.group(2)
        if not re.search(r'[上中下]', shape):
            continue
        if re.search(r'月卦$', name) or name in ('合并成卦', '有直占倒卦'):
            continue
        ke.append(m)
    lessons = []
    for i, m in enumerate(ke):
        end = ke[i + 1].start() if i + 1 < len(ke) else len(t)
        seg = t[m.start():end].strip()
        lessons.append((m.group(1).strip(), m.group(2), m.group(3), seg))
    # 末课尾部裁除：目录/书目信息边界
    shape, name, xiang, seg = lessons[-1]
    cut = re.search(r'\n\s*(?:［General|书名\s*\n前言|明陈士元)', seg)
    if cut:
        lessons[-1] = (shape, name, xiang, seg[:cut.start()].strip())
    # 卷首：第一课之前为 占仪/序文
    front = t[:ke[0].start()].strip()
    return front, lessons


def main():
    front, lessons = parse()
    print(f'课目 {len(lessons)} 条 + 卷首仪制 {1 if front else 0} 条', flush=True)

    # 语料存档
    lines = ['# 灵棋经（术数全书·上册 · Vision OCR 净读稿）', '',
             '> 汉·东方朔撰。源：项目内《术数全书（上册）》PDF Vision OCR（SS号 11108352，中州古籍出版社 1994）。',
             '> 全书 125 课；本稿 OCR 有效课目 %d 课，15 课 OCR 残损待人工校补（不得杜撰）。' % len(lessons),
             '> 抽取时间：2026-10-20 第三十七轮。', '']
    if front:
        lines += ['§§ 卷首·占仪 §§', front, '']
    for i, (shape, name, xiang, seg) in enumerate(lessons):
        lines += [f'§§ 第{i+1}课 {shape} {name}（{xiang}） §§', seg, '']
    OUT.write_text('\n'.join(lines), encoding='utf-8')
    print(f'语料存档 {OUT} ({OUT.stat().st_size} bytes)', flush=True)

    conn = sqlite3.connect(str(DB), timeout=120)
    conn.execute('PRAGMA busy_timeout=120000')
    fps = {r[0] for r in conn.execute(
        "SELECT fingerprint FROM kb_formal WHERE fingerprint LIKE 'LQJ|%'")}

    entries = []
    if front and len(front) > 80:
        entries.append(('灵棋经·卷首占仪', front, '占仪,焚香,捧棋,仪制,灵棋经'))
    for i, (shape, name, xiang, seg) in enumerate(lessons):
        title = f'灵棋经·第{i+1}课 {name}'
        kw = f'灵棋经,{name[:-1]},{shape},{xiang.replace("之象","")},占卜,课占'
        entries.append((title, seg, kw))

    ing = KBIngestor(conn)
    try:
        conn.execute('BEGIN IMMEDIATE')
        for title, content, kw in entries:
            full = f'【灵棋经·{title}】（公有领域原典·汉东方朔·术数全书本·Vision OCR）\n\n{content}\n\n关键词：灵棋经 占卜 {title}'
            fp = FP_PREFIX + hashlib.md5(('lingqi' + full).encode()).hexdigest()[:12]
            ing.upsert(entry_id='KB-LQJ-' + fp[4:], module='lingqi',
                       title=f'原典·{title}', content=full, keywords=kw, tags=kw,
                       src_id=SRC, category='占卜', trust=0.9, source='corpus-rebuild')
        total = conn.execute("SELECT COUNT(*) FROM kb_formal WHERE module='lingqi'").fetchone()[0]
        ocr = conn.execute("SELECT COUNT(*) FROM kb_formal WHERE module='lingqi' AND entry_id LIKE 'KB-LQJ-%'").fetchone()[0]
        siku = conn.execute("SELECT COUNT(*) FROM kb_formal WHERE module='lingqi' AND entry_id LIKE 'KB-LQK-%'").fetchone()[0]
        wiki = conn.execute("SELECT COUNT(*) FROM kb_formal WHERE module='lingqi' AND entry_id LIKE 'KB-LQW-%'").fetchone()[0]
        note = (f'汉东方朔·三版本互校：OCR {ocr} 条、四库净本 {siku} 条、维基文库 {wiki} 条；'
                f'OCR有效{len(lessons)}课，残缺处不杜撰')
        conn.execute(
            """INSERT INTO kb_module_registry (module, std_group, display_name, domain, entry_count, note, updated_at)
               VALUES ('lingqi','卜筮','灵棋经','mingli',?,?,datetime('now','localtime'))
               ON CONFLICT(module) DO UPDATE SET entry_count=excluded.entry_count, note=excluded.note, updated_at=excluded.updated_at""",
            (total, note))
        ing.commit()
    except Exception:
        conn.rollback()
        safe_close(conn)
        raise
    safe_close(conn)
    print(ing.stats(), flush=True)
    subprocess.run([sys.executable, str(ROOT / 'scripts/kb-sync-guard.py'), '--sync', '1'],
                   cwd=ROOT, check=True)
    conn = sqlite3.connect(str(DB), timeout=120)
    try:
        n = conn.execute("SELECT COUNT(*) FROM kb_formal WHERE module='lingqi'").fetchone()[0]
        f = conn.execute("SELECT COUNT(*) FROM kb_fts5 WHERE module='lingqi'").fetchone()[0]
        assert n == f, (n, f)
        print(f'═══ lingqi 模块 kb_formal={n} 条，kb_fts5={f} 条')
    finally:
        safe_close(conn)


if __name__ == '__main__':
    main()
