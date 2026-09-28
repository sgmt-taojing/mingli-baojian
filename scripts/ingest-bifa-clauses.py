#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ingest-bifa-clauses.py — 《六壬大全》畢法賦条款级提取 v2（2026-09-28 · R-INGEST-SPEC）

勘察结论（实证）：
  - corpus/liuren-daqquan/卷09 = 畢法賦上：完整 100 条口诀（首条在 anchor，后 99 条按 SK notes 第N 切）+ 前部注释
  - corpus/liuren-daqquan/卷10 = 畢法賦下：后部注释（条款名 anchor 与注释文 anchor 混杂）
切法：口诀只从卷09 取（100 条）；注释从两卷 anchor 段归并，按条款名精确匹配挂回。
"""
import re, sqlite3, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from lib.kb_ingest import KBIngestor, fingerprint_of

DB = Path(__file__).parent.parent / 'server' / 'database' / 'yidao.db'
CORPUS = Path(__file__).parent.parent / 'corpus' / 'liuren-daqquan'


def clean(t):
    t = re.sub(r'\{\{[^}]*\}\}', '', t)
    t = re.sub(r'\s+', ' ', t)
    return t.strip()


def parse_clauses():
    """从卷09 口诀区切 100 条"""
    t = (CORPUS / '卷09.txt').read_text(encoding='utf-8')
    anchors = [(m.start(), m.group(1)) for m in re.finditer(r'\{\{SK anchor\|([^}]+)\}\}', t)]
    first_clause = next(a for a in anchors if '卷' not in a[1])  # 前後引從陞遷吉
    second = t.find('{{SK anchor|' + first_clause[1] + '}}', first_clause[0] + 10)
    verse_region = t[:second]
    parts = re.split(r'\{\{SK (?:anchor|notes?)\|[^}]*\}\}', verse_region)
    clauses = [first_clause[1]]  # 第 1 条在 anchor 里
    for p in parts:
        p = clean(p)
        if p and '畢法賦' not in p and '欽定四庫全書' not in p and not p.startswith('六壬大全卷'):
            clauses.append(p)
    return clauses


def parse_commentary():
    """两卷注释区：anchor 名 → 注释文（条款名 anchor 才收）"""
    comm = {}
    for fn in ['卷09.txt', '卷10.txt']:
        t = (CORPUS / fn).read_text(encoding='utf-8')
        canchors = [(m.start(), m.group(1)) for m in re.finditer(r'\{\{SK anchor\|([^}]+)\}\}', t)]
        for i, (pos, name) in enumerate(canchors):
            if '卷' in name or len(name) > 12:
                continue
            end = canchors[i + 1][0] if i + 1 < len(canchors) else len(t)
            seg = re.sub(r'\{\{[^}]*\}\}', '', t[pos:end])
            seg = clean(seg)
            if seg.startswith(name):
                seg = seg[len(name):].strip()
            # 只收像注释的段（够长且不是口诀清单）
            if len(seg) > 40 and name not in comm:
                comm[name] = seg
    return comm


def main():
    clauses = parse_clauses()
    comm = parse_commentary()
    print(f'口诀 {len(clauses)} 条 · 注释块 {len(comm)} 块')
    if len(clauses) != 100:
        print('⚠️ 条数不为 100，打印首尾核查:', clauses[:2], clauses[-2:])

    conn = sqlite3.connect(str(DB))
    ing = KBIngestor(conn)
    matched = 0
    for num, verse in enumerate(clauses, 1):
        key = verse[:7]
        c = comm.get(key, '')
        if c:
            matched += 1
        content = (f'【六壬大全·畢法賦·第{num}条】（公有领域原典·四庫全書本）\n\n'
                   f'口诀：{verse}\n')
        if c:
            content += f'\n原注：{c[:1500]}\n'
        content += f'\n关键词：毕法赋 六壬 第{num}条 {key}'
        eid = f"BF|liuren|毕法赋|{num:03d}|{fingerprint_of(content)[:8]}"
        ok, why = ing.insert(
            entry_id=eid, module='liuren',
            title=f'原典·六壬大全·畢法賦·第{num}条 {key}',
            content=content, category='liuren',
            keywords=f'毕法赋,六壬,第{num}条,{key}',
            summary=f'毕法赋第{num}条：{key}',
            tags=['毕法赋', '六壬', '原典', '条款', f'第{num}条'],
            domain='mingli', trust=0.95, source='bifa-clause-extract')
        if not ok and why != 'duplicate':
            print(f'  ✗ 第{num}条: {why}')
    ing.commit()
    print(f'注释挂回 {matched}/100')
    try:
        conn.execute("INSERT INTO kb_formal_fts(kb_formal_fts) VALUES('rebuild')")
        conn.commit()
    except Exception as e:
        print('FTS rebuild:', e)
    f = conn.execute('SELECT COUNT(*) FROM kb_formal').fetchone()[0]
    t2 = conn.execute('SELECT COUNT(*) FROM kb_formal_fts').fetchone()[0]
    print(f'═══ {ing.stats()} · formal={f} fts={t2} 对齐={f == t2}')
    conn.close()


if __name__ == '__main__':
    main()
