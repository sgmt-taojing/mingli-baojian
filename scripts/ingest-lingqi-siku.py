#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ingest-lingqi-siku.py — 《灵棋经》四库净本（Kanripo）版本异文入库（2026-10-20 · 第三十七轮续）
源：kb_formal yizhan 模块既有 Kanripo 汉籍全文条目（KB-KR-4e80d7d3d6 卷上 / KB-KR-7e944c420a 卷下 /
    KB-KR-daff4ea0de 提要 / KB-KR-522ad0a1b4 後序），导出至 corpus/lingqi-jing/kanripo-*.txt。
    仅依据项目内文献，不外采、不杜撰。
结构：锚点「第[N][卦名]卦(宫位/方位)[卦形][XX之象]」；卷上 58 课 + 卷下 31 课 = 89 课
      （Kanripo 卷下文本止于第九十四荡覆卦，95-124 课原文阙如，不补）。
定位：module='lingqi' 与 OCR 版同库互校；category='版本异文·四库净本'，trust=0.95（净本），
      fingerprint='LQK|' 幂等；提要/後序单独成条。
"""
import hashlib, re, sqlite3, time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT / 'server' / 'database' / 'yidao.db'
SRC = 'kanripo:欽定四庫全書·靈棋經'
FP_PREFIX = 'LQK|'
NUM = '一二三四五六七八九十百零〇'
ANCHOR = re.compile(
    r'第([' + NUM + r']+)([一-鿿]{2,3}卦)\(([^)]*)\)((?:[一二三四]上)?(?:[一二三四]中)?(?:[一二三四]下)?)([一-鿿]{2,6}之象)')


def slice_juan(path, juan):
    t = Path(path).read_text(encoding='utf-8')
    # 去掉打包时附加的出处头与关键词尾
    t = re.sub(r'^【[^】]*】[^\n]*\n', '', t)
    t = re.sub(r'\n*关键词：[^\n]*$', '', t)
    ms = [m for m in ANCHOR.finditer(t) if re.search(r'[上中下]', m.group(4))]
    out = []
    for i, m in enumerate(ms):
        end = ms[i + 1].start() if i + 1 < len(ms) else len(t)
        seg = t[m.start():end].strip()
        # 卷上末课尾部卷题裁除
        seg = re.sub(r'\n\s*靈棋經卷[上下]\s*$', '', seg).strip()
        out.append((juan, m.group(1), m.group(2), m.group(3), m.group(4), seg))
    return out


def main():
    lessons = slice_juan(ROOT / 'corpus/lingqi-jing/kanripo-juan-shang.txt', '卷上') + \
              slice_juan(ROOT / 'corpus/lingqi-jing/kanripo-juan-xia.txt', '卷下')
    print(f'四库净本课目 {len(lessons)} 条', flush=True)

    # 提要/後序
    th = (ROOT / 'corpus/lingqi-jing/kanripo-tiyao-houxu.txt').read_text(encoding='utf-8')
    extra = []
    m_t = re.search(r'(欽定四庫全書[\s\S]*?提要[\s\S]*?)(?=【灵棋经·後序】|$)', th)
    m_h = re.search(r'(靈棋經後序[\s\S]*?)(?:\n*关键词：|$)', th)
    if m_t:
        extra.append(('灵棋经·四库提要', m_t.group(1).strip(), '灵棋经,四库提要,版本源流'))
    if m_h:
        extra.append(('灵棋经·後序', m_h.group(1).strip(), '灵棋经,後序,灵棋之式,三经四纬'))

    conn = sqlite3.connect(str(DB), timeout=120)
    conn.execute('PRAGMA busy_timeout=120000')
    fps = {r[0] for r in conn.execute(
        "SELECT fingerprint FROM kb_formal WHERE fingerprint LIKE 'LQK|%'" )}

    entries = list(extra)
    for juan, num, name, gong, shape, seg in lessons:
        kw = f'灵棋经,{name[:-1]},{shape},四库净本,版本异文,占卜,课占'
        entries.append((f'灵棋经·{juan}第{num}课 {name}（四库净本）', seg, kw))

    ins = dup = 0
    new_rows = []
    for attempt in range(20):
        try:
            conn.execute('BEGIN IMMEDIATE')
            for title, content, kw in entries:
                full = f'【灵棋经·{title}】（公有领域原典·汉东方朔·欽定四庫全書文淵閣版·Kanripo 净本·与术数全书 OCR 版互校）\n\n{content}\n\n关键词：灵棋经 占卜 {title}'
                fp = FP_PREFIX + hashlib.md5(('lingqi' + full).encode()).hexdigest()[:12]
                if fp in fps:
                    dup += 1
                    continue
                eid = 'KB-LQK-' + fp[4:]
                conn.execute(
                    """INSERT INTO kb_formal (entry_id, module, title, content, keywords, trust_score,
                       access_level, status, domain, src_id, fingerprint, category, created_at)
                       VALUES (?,?,?,?,?,0.95,'public','formal','mingli',?,?,'版本异文·四库净本',datetime('now'))""",
                    (eid, 'lingqi', f'原典·{title}', full, kw, SRC, fp))
                fps.add(fp)
                new_rows.append((eid, title, full, kw))
                ins += 1
            conn.commit()
            break
        except sqlite3.OperationalError as e:
            conn.rollback()
            if 'locked' in str(e).lower():
                print(f'写锁被占，30s 后重试（{attempt+1}/20）…', flush=True)
                time.sleep(30)
            else:
                raise
    else:
        raise SystemExit('FATAL: 写锁重试耗尽')
    print(f'入库 {ins} 条，指纹去重跳过 {dup} 条', flush=True)

    if new_rows:
        conn.execute('BEGIN IMMEDIATE')
        conn.executemany(
            "INSERT INTO kb_fts5 (entry_id, module, summary, content, tags, category) VALUES (?,?,?,?,?,?)",
            [(eid, 'lingqi', title, full, kw, '版本异文·四库净本') for eid, title, full, kw in new_rows])
        conn.commit()
        print(f'FTS 同步 {len(new_rows)} 条', flush=True)

    total = conn.execute("SELECT COUNT(*) FROM kb_formal WHERE module='lingqi'").fetchone()[0]
    ocr = conn.execute("SELECT COUNT(*) FROM kb_formal WHERE module='lingqi' AND fingerprint LIKE 'LQJ|%'").fetchone()[0]
    siku = conn.execute("SELECT COUNT(*) FROM kb_formal WHERE module='lingqi' AND fingerprint LIKE 'LQK|%'").fetchone()[0]
    note = (f'汉东方朔。双版本互校：术数全书OCR版 {ocr} 条（110课+占仪，trust 0.9）；'
            f'四库Kanripo净本 {siku} 条（89课+提要/後序，trust 0.95）。'
            f'全书125课：OCR缺15课、净本缺95-124课，阙如部分不杜撰，待缘主供源校补')
    conn.execute(
        """UPDATE kb_module_registry SET entry_count=?, note=?, updated_at=datetime('now','localtime')
           WHERE module='lingqi'""", (total, note))
    conn.commit()
    print(f'═══ lingqi 总量 {total}（OCR {ocr} + 四库净本 {siku}）')
    conn.close()


if __name__ == '__main__':
    main()
