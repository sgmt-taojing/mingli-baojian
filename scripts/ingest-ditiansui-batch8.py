#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""批8 · 滴天髓阐微入库（BUILD-SPEC T1 批8 · 2026-09-23 Kimi · 命理知识源头再蒸馏波次）

源：《滴天髓阐微》刘基原著·任铁樵增注（清，公有领域；ctext.org 整理本）
本地净本：cold-storage/.../classics/滴天髓阐微 - 任铁樵.txt（397KB，5849 行）

解析粒度：通神论 34 章（天道~坎离）+ 六亲论 24 章（夫妻~贞元等）逐章成条目；
          章头 = ^中文数字+、+章名$；通神论/六亲论行切换部属。原注（任铁樵按语）随章保留。
清洗：剥 ctext 元数据行与书前目录区（75 行前的目录不入库）。
字段：module=bazi, category=ditiansui-chanwei, trust=0.95, src_id=ditiansui-chanwei,
      指纹幂等, domain=mingli, tags 带写。
"""
import sqlite3, json, hashlib, re, time
from pathlib import Path

SRC = Path('/Volumes/模型训练数据/cold-storage/ml-training/archive/mingli-db-backups-20260819/workspace-tmp/giant-shoulders/fatecat/domains/fate-analysis/data-products/classics/滴天髓阐微 - 任铁樵.txt')
DB = Path(__file__).resolve().parent.parent / 'server' / 'database' / 'yidao.db'
NOW = time.strftime('%Y-%m-%d %H:%M:%S')

def fp(s): return 'DT|' + hashlib.sha1(s.encode('utf-8')).hexdigest()[:16]

lines = [l.strip() for l in SRC.read_text(encoding='utf-8').split('\n')]
chap_re = re.compile(r'^[一二三四五六七八九十]{1,3}、([\u4e00-\u9fa5]{1,10})$')
META = re.compile(r'^来源章节：|^整理说明：|^来源：https?://|^抓取范围：|^ctext|^作者：|^##')

part, entries = None, []
cur_t, cur_b = None, []
started = False
def flush():
    global cur_t, cur_b
    if cur_t and cur_b:
        c = '\n'.join(cur_b).strip()
        if len(c) >= 50:
            entries.append((f'{part}·{cur_t}', c))
    cur_t, cur_b = None, []

for l in lines:
    if META.match(l):
        continue
    if l in ('通神论', '六亲论'):
        flush()
        part = l
        started = True
        continue
    if not started or not l:
        continue
    m = chap_re.match(l)
    if m and part:
        flush()
        cur_t = m.group(1)
        continue
    if cur_t:
        cur_b.append(l)
flush()

print(f'章数 {len(entries)}（通神论目标 34 + 六亲论目标 ~24）')
assert len(entries) >= 50, f'章数异常偏少（{len(entries)}），解析需复核'

conn = sqlite3.connect(DB, timeout=60)
conn.execute('PRAGMA busy_timeout=60000')
ins = skip = 0
for title, content in entries:
    kb_title = f'原典·滴天髓阐微·{title}'
    eid = 'KB-DT-' + hashlib.md5(kb_title.encode()).hexdigest()[:10]
    if conn.execute('SELECT 1 FROM kb_formal WHERE entry_id=? OR title=?', (eid, kb_title)).fetchone():
        skip += 1
        continue
    full = f'【滴天髓阐微·{title}】（公有领域原典·刘基原著/任铁樵注·ctext整理本）\n\n' + content
    conn.execute("""INSERT INTO kb_formal
        (entry_id, module, title, content, src_id, category, keywords, summary,
         trust_score, version, promoted_at, promoted_from, status, fingerprint, domain, tags)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (eid, 'bazi', kb_title, full, 'ditiansui-chanwei', 'ditiansui-chanwei',
         json.dumps(['滴天髓', '任铁樵', title.split('·')[-1]], ensure_ascii=False),
         content[:80], 0.95, '1.0', NOW, 'kimi-t1-batch8-ditiansui', 'formal', fp(full), 'mingli',
         json.dumps(['原典', '滴天髓', title.split('·')[0]], ensure_ascii=False)))
    ins += 1
conn.commit()
print(f'入库 {ins} / 跳过 {skip}')
sizes = sorted((len(c) for _, c in entries), reverse=True)
print(f'条目字数：最大 {sizes[0]} / 中位 {sizes[len(sizes)//2]} / 最小 {sizes[-1]}')
conn.close()
