#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""六壬断案入库（批17续 · 六壬原典零突破 · 2026-09-26 · Kimi）

源：corpus/liuren-duanan/*.txt
  - newdu.com 国学典籍网《邵彦和大六壬案例集》（即《大六壬断案》，
    宋·邵彦和占案、程铨爱圅辑评，陈镛朴整理本，元亨利贞四集全 222 案，
    含爱圅按语校勘——正式辑录本，非二手拼接网文）
  - 背景：四库未收六壬书；断案为六壬第一案例书，与指南并称六壬双璧
书目：大六壬断案（六壬占断第一案例原典：前程仕进/终身/流年/婚姻/胎产/
      财产/行人/疾病/六畜/亡盗/官讼/杂占十二门 222 案）
字段：module=liuren，trust=0.95，src_id=newdu:liuren-duanan,
      status=formal, domain=mingli, 指纹幂等（entry_id/title 双查重）
用法：/usr/bin/python3 scripts/ingest-liuren-duanan-local.py
"""
import sqlite3, json, hashlib, time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT / 'server' / 'database' / 'yidao.db'
SRC = ROOT / 'corpus' / 'liuren-duanan'
NOW = time.strftime('%Y-%m-%d %H:%M:%S')

FILES = [
    ('juan0-bianyan.txt', '卷首·弁言'),
    ('juan1-yuan.txt', '元集·前程仕进（一）'),
    ('juan2-heng.txt', '亨集·前程仕进（二）'),
    ('juan3-li.txt', '利集·终身流年婚姻胎产财产'),
    ('juan4-zhen.txt', '贞集·行人疾病亡盗官讼杂占'),
]

def fp(s): return 'NEW|' + hashlib.sha1(s.encode('utf-8')).hexdigest()[:16]

def main():
    conn = sqlite3.connect(DB, timeout=120)
    conn.execute('PRAGMA busy_timeout=120000')
    ins = skip = 0
    for fname, sub in FILES:
        body = (SRC / fname).read_text(encoding='utf-8').strip()
        if len(body) < 120:
            print(f'[skip] {fname} 过短'); continue
        kb_title = f'原典·六壬断案·{sub}'
        chunks = [body]
        if len(body) > 9000:
            ls, chunks, cb, cn = body.split('\n'), [], [], 0
            for l in ls:
                if cn > 8000 and cb:
                    chunks.append('\n'.join(cb)); cb, cn = [], 0
                cb.append(l); cn += len(l)
            if cb:
                chunks.append('\n'.join(cb))
        for i, c in enumerate(chunks, 1):
            t2 = kb_title + (f'·{i}' if len(chunks) > 1 else '')
            eid = 'KB-LR-' + hashlib.md5(t2.encode()).hexdigest()[:10]
            if conn.execute('SELECT 1 FROM kb_formal WHERE entry_id=? OR title=?', (eid, t2)).fetchone():
                skip += 1; continue
            full = (f'【六壬断案·{sub}】（宋·邵彦和占案，程铨爱圅辑评；六壬第一案例书，原文与按语并存）\n\n' + c)
            conn.execute("""INSERT INTO kb_formal
                (entry_id, module, title, content, src_id, category, keywords, summary,
                 trust_score, version, promoted_at, promoted_from, status, fingerprint, domain, tags)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                (eid, 'liuren', t2, full, 'newdu:liuren-duanan', 'newdu-liuren-duanan',
                 json.dumps(['六壬断案', '大六壬', '邵彦和', sub[:12]], ensure_ascii=False),
                 c[:80], 0.95, '1.0', NOW, 'kimi-p17-liuren-duanan', 'formal', fp(full), 'mingli',
                 json.dumps(['原典', '六壬断案', '六壬', '邵彦和'], ensure_ascii=False)))
            ins += 1
        conn.commit()
        print(f'[{sub}] {len(body)} 字符 → {len(chunks)} 块，累计入库 {ins} / 跳过 {skip}')
    total = conn.execute("SELECT COUNT(*) FROM kb_formal").fetchone()[0]
    print(f'✅ 六壬断案入库 {ins} 条（跳过 {skip}），KB 总量 {total}')
    conn.close()

if __name__ == '__main__':
    main()
