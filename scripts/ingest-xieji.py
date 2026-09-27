#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ingest-xieji.py — 《欽定協紀辨方書》36 卷净本入库 kb_formal（2026-09-27 · D类P1）
字段口径（对齐 ingest-batch10 惯例）：module=zeri, category=xieji-bianfang,
  src_id=wikisource:欽定協紀辨方書 (四庫全書本), trust=0.95（钦定四库本）, status='formal',
  domain='mingli', fingerprint='XJB|卷NN-NNN' 幂等, tags JSON, 时间戳 datetime('now','localtime')。
纪律：BEGIN IMMEDIATE + busy_timeout=120s + 200 条/批提交（避开守卫锁窗）；原文不改写。
"""
import sqlite3, json, re, sys, time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT / 'server' / 'database' / 'yidao.db'
SRC_DIR = ROOT / 'corpus' / 'xieji-bianfang'
SRC_ID = 'wikisource:欽定協紀辨方書 (四庫全書本)'
TAGS = json.dumps(['协纪辨方书', '择吉', '黄历', '择日', '神煞宜忌'], ensure_ascii=False)

NAV_RE = re.compile(r'^(←|→|卷[一二三四五六七八九十百〇零0-9]+\s*→|←\s*卷).{0,12}$')

def chunk_volume(vol, txt):
    """按段落聚合 400-700 字切片；剔除导航行与页码残渣"""
    paras = [p.strip() for p in re.split(r'\n{2,}', txt) if p.strip()]
    paras = [p for p in paras if not NAV_RE.match(p) and len(p) > 10]
    chunks, buf = [], ''
    for p in paras:
        if buf and len(buf) + len(p) > 700:
            chunks.append(buf); buf = p
        else:
            buf = (buf + '\n' + p) if buf else p
        if len(buf) >= 400 and buf.count('\n') >= 1 and len(buf) > 600:
            chunks.append(buf); buf = ''
    if buf and len(buf) >= 120:
        chunks.append(buf)
    out = []
    for i, c in enumerate(chunks, 1):
        first = c.split('\n')[0][:18]
        title = f'协纪辨方书·卷{vol:02d}（{first}…）' if len(c.split(chr(10))[0]) > 18 else f'协纪辨方书·卷{vol:02d}（{first}）'
        out.append((f'XJB|卷{vol:02d}-{i:03d}', title, c))
    return out

def main():
    conn = sqlite3.connect(str(DB), timeout=120)
    conn.execute('PRAGMA busy_timeout=120000')
    have = {r[0] for r in conn.execute("SELECT fingerprint FROM kb_formal WHERE fingerprint LIKE 'XJB|%'")}
    print(f'已有指纹 {len(have)} 条（幂等跳过）')
    total_new = 0
    batch = []
    def flush():
        nonlocal batch, total_new
        if not batch: return
        conn.execute('BEGIN IMMEDIATE')
        conn.executemany('''INSERT INTO kb_formal
            (entry_id, module, title, content, src_id, category, keywords, summary,
             trust_score, version, promoted_at, promoted_from, status, fingerprint, domain, tags,
             created_at, updated_at)
            VALUES (?,?,?,?,?,?,?,?,0.95,1,datetime('now','localtime'),'wikisource','formal',?, 'mingli', ?,
                    datetime('now','localtime'), datetime('now','localtime'))''', batch)
        conn.commit()
        total_new += len(batch)
        print(f'  入库 +{len(batch)}（累计 {total_new}）', flush=True)
        batch = []
    for vol in range(1, 37):
        f = SRC_DIR / f'卷{vol:02d}.txt'
        if not f.exists():
            print(f'卷{vol:02d}: 缺文件跳过'); continue
        txt = f.read_text(encoding='utf-8')
        for fp, title, content in chunk_volume(vol, txt):
            if fp in have: continue
            eid = 'kb-xjb-' + fp.split('|')[1].replace('卷', 'j').lower()
            batch.append((eid, 'zeri', title, content, SRC_ID, 'xieji-bianfang',
                          '协纪辨方书 择吉 黄历 神煞宜忌', content.split('\n')[0][:80], fp, TAGS))
            if len(batch) >= 200: flush()
    flush()
    c = conn.execute("SELECT COUNT(*) FROM kb_formal WHERE fingerprint LIKE 'XJB|%'").fetchone()[0]
    align = conn.execute("SELECT (SELECT COUNT(*) FROM kb_formal), (SELECT COUNT(*) FROM kb_fts5)").fetchone()
    print(f'XJB 总计 {c} 条；全库 formal={align[0]} fts={align[1]}')
    conn.close()

if __name__ == '__main__':
    main()
