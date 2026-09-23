#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""批12 · 三命通会全卷差集入库（BUILD-SPEC T1 批12 · 2026-09-23 Kimi · 全面性补全波次）

背景：批4 只入了卷二/卷三神煞区 28 节，全书 606KB 还有卷一五行源流/卷四~卷十二
      格局女命六亲小儿等专论未入——本批全卷差集补全。
解析：节头 = 行首「○论…」（≤20 字），卷界强切；已在库节（批4 二十八煞 +
      既有 典籍精华·三命通会 覆盖题名）一律跳过防重复。
字段：module=bazi, category=sanming-tonghui, trust=0.95, src_id=sanming-tonghui,
      指纹幂等, domain=mingli, tags 带写。超 8000 字保底均分。
"""
import sqlite3, json, hashlib, re, time
from pathlib import Path

SRC = Path('/Volumes/模型训练数据/cold-storage/ml-training/archive/mingli-db-backups-20260819/workspace-tmp/giant-shoulders/fatecat/domains/fate-analysis/data-products/classics/三命通会 - 万明英.txt')
DB = Path(__file__).resolve().parent.parent / 'server' / 'database' / 'yidao.db'
NOW = time.strftime('%Y-%m-%d %H:%M:%S')
CAP = 8000

def fp(s): return 'SM|' + hashlib.sha1(s.encode('utf-8')).hexdigest()[:16]

lines = [l.strip() for l in SRC.read_text(encoding='utf-8').split('\n')]
hdr_re = re.compile(r'^○(.{1,20})$')
sections, cur_t, cur_b = [], None, []
def flush():
    global cur_t, cur_b
    if cur_t and cur_b:
        sections.append((cur_t, cur_b[:]))
    cur_t, cur_b = None, []
for l in lines:
    if not l:
        continue
    if l.startswith('卷'):
        flush()
        continue
    m = hdr_re.match(l)
    if m:
        flush()
        cur_t = m.group(1)
        continue
    if cur_t:
        cur_b.append(l)
flush()

merged = {}
for t, b in sections:
    merged.setdefault(t, []).extend(b)
entries = [(t, '\n'.join(b).strip()) for t, b in merged.items() if len('\n'.join(b).strip()) >= 30]
print(f'全书节数 {len(entries)}')

conn = sqlite3.connect(DB, timeout=120)
conn.execute('PRAGMA busy_timeout=120000')
have = {r[0] for r in conn.execute("SELECT title FROM kb_formal WHERE title LIKE '%三命通会%'").fetchall()}
def covered(t):
    for h in have:
        if t in h or h.endswith('·' + t) or ('论' + t) in h:
            return True
    return False

ins = skip = 0
for title, content in entries:
    if covered(title):
        skip += 1
        continue
    # 超帽均分
    chunks = [content]
    if len(content) > CAP:
        ls = content.split('\n')
        chunks, cb, cn = [], [], 0
        for l in ls:
            if cn > CAP and cb:
                chunks.append('\n'.join(cb)); cb, cn = [], 0
            cb.append(l); cn += len(l)
        if cb:
            chunks.append('\n'.join(cb))
    for i, c in enumerate(chunks, 1):
        t2 = f'{title}·{i}' if len(chunks) > 1 else title
        kb_title = f'三命通会·{t2}'
        eid = 'KB-SM-' + hashlib.md5(kb_title.encode()).hexdigest()[:10]
        if conn.execute('SELECT 1 FROM kb_formal WHERE entry_id=? OR title=?', (eid, kb_title)).fetchone():
            skip += 1
            continue
        full = f'【三命通会·{t2}】（公有领域原典）\n\n' + c
        conn.execute("""INSERT INTO kb_formal
            (entry_id, module, title, content, src_id, category, keywords, summary,
             trust_score, version, promoted_at, promoted_from, status, fingerprint, domain, tags)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (eid, 'bazi', kb_title, full, 'sanming-tonghui', 'sanming-tonghui',
             json.dumps(['三命通会', title[:12]], ensure_ascii=False),
             c[:80], 0.95, '1.0', NOW, 'kimi-t1-batch12-sanming-full', 'formal', fp(full), 'mingli',
             json.dumps(['原典', '三命通会'], ensure_ascii=False)))
        ins += 1
conn.commit()
print(f'入库 {ins} / 跳过已在库 {skip}')
print('新入样例:', '、'.join(t for t, _ in entries if not covered(t))[:200])
conn.close()
