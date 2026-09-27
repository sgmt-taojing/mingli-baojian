#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""ingest-yilin.py — 《焦氏易林》16 卷入庫 kb_formal（2026-09-27 · D类P1）
module=yishi, category=jiaoshi-yilin, fingerprint='YLY|卷NN-NNN' 幂等, trust=0.95, domain=mingli。"""
import sqlite3, json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
conn = sqlite3.connect(str(ROOT / 'server/database/yidao.db'), timeout=120)
conn.execute('PRAGMA busy_timeout=120000')
have = {r[0] for r in conn.execute("SELECT fingerprint FROM kb_formal WHERE fingerprint LIKE 'YLY|%'" )}
tags = json.dumps(['焦氏易林', '易林', '繇辞', '焦赣', '汉代'], ensure_ascii=False)
NAV = re.compile(r'^(←|→|.{0,4}卷第[一二三四五六七八九十]+\s*→|←\s*.{0,6})$')
total = 0
batch = []

def flush():
    global batch, total
    if not batch:
        return
    conn.execute('BEGIN IMMEDIATE')
    conn.executemany('''INSERT INTO kb_formal
      (entry_id, module, title, content, src_id, category, keywords, summary,
       trust_score, version, promoted_at, promoted_from, status, fingerprint, domain, tags,
       created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,0.95,1,datetime('now','localtime'),'wikisource','formal',?,'mingli',?,
              datetime('now','localtime'),datetime('now','localtime'))''', batch)
    conn.commit()
    total += len(batch)
    print(f'  +{len(batch)}（累计 {total}）', flush=True)
    batch = []

for vol in range(1, 17):
    txt = (ROOT / f'corpus/jiaoshi-yilin/卷{vol:02d}.txt').read_text(encoding='utf-8')
    paras = [p.strip() for p in re.split(r'\n{2,}', txt) if p.strip()]
    paras = [p for p in paras if not NAV.match(p) and len(p) > 10]
    chunks, buf = [], ''
    for p in paras:
        if buf and len(buf) + len(p) > 650:
            chunks.append(buf); buf = p
        else:
            buf = (buf + '\n' + p) if buf else p
    if buf and len(buf) >= 120:
        chunks.append(buf)
    for i, c in enumerate(chunks, 1):
        fp = f'YLY|卷{vol:02d}-{i:03d}'
        if fp in have:
            continue
        first = c.split('\n')[0][:16]
        batch.append((f'kb-yly-j{vol:02d}-{i:03d}', 'yishi', f'焦氏易林·卷{vol:02d}（{first}…）', c,
            'wikisource:焦氏易林 (四部叢刊本)', 'jiaoshi-yilin', '焦氏易林 繇辞 占候 焦赣',
            c.split('\n')[0][:80], fp, tags))
        if len(batch) >= 200:
            flush()
flush()
n = conn.execute("SELECT COUNT(*) FROM kb_formal WHERE fingerprint LIKE 'YLY|%'").fetchone()[0]
al = conn.execute("SELECT (SELECT COUNT(*) FROM kb_formal),(SELECT COUNT(*) FROM kb_fts5),(SELECT COUNT(*) FROM kb_formal WHERE module='yishi')").fetchone()
print(f'YLY 总计 {n} 条；formal={al[0]} fts={al[1]} yishi={al[2]}')
conn.close()
