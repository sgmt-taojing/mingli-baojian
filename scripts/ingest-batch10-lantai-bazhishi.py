#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""批10 · 兰台妙选/八字知识 入库（BUILD-SPEC T1 批10 · 2026-09-23 Kimi · 源头再蒸馏波次）

源（公有领域/公开整理本）：
  《兰台妙选》西窗老人（明，纳音格局经典）53KB/452 行：上中下三篇 + 格局名短行分节
  《八字知识》公开整理本 138KB/2125 行：markdown ## 章节 30 节（现代白话入门体系）
字段：module=bazi, category=<slug>, trust=0.95（兰台原典）/0.8（八字知识为现代整理本）,
      src_id=<slug>, 指纹幂等, domain=mingli, tags 带写。原文不改写。
说明：滴天髓原文本批不入——《滴天髓阐微》58 章已含原文逐句+任注，单入原文属冗余（如实标注）。
"""
import sqlite3, json, hashlib, re, time
from pathlib import Path

BASE = Path('/Volumes/模型训练数据/cold-storage/ml-training/archive/mingli-db-backups-20260819/workspace-tmp/giant-shoulders/fatecat/domains/fate-analysis/data-products/classics')
DB = Path(__file__).resolve().parent.parent / 'server' / 'database' / 'yidao.db'
NOW = time.strftime('%Y-%m-%d %H:%M:%S')

def fp(p, s): return p + '|' + hashlib.sha1(s.encode('utf-8')).hexdigest()[:16]

def parse_lantai(path):
    lines = [l.strip() for l in path.read_text(encoding='utf-8').split('\n')]
    META = re.compile(r'^来源章节：|^整理说明：|^来源：https?://|^抓取范围：|^ctext|^作者：|^##')
    pian_re = re.compile(r'^[上中下]篇$')
    ge_re = re.compile(r'^[\u4e00-\u9fa5]{2,6}$')
    entries, pian, cur_t, cur_b, started = [], None, None, [], False
    def flush():
        nonlocal cur_t, cur_b
        if cur_t and cur_b:
            c = '\n'.join(cur_b).strip()
            if len(c) >= 40:
                entries.append((f'{pian}·{cur_t}' if pian else cur_t, c))
        cur_t, cur_b = None, []
    for l in lines:
        if META.match(l) or not l:
            continue
        if pian_re.match(l):
            flush()
            pian = l
            started = True
            continue
        if not started:
            continue
        if ge_re.match(l) and not pian_re.match(l):
            flush()
            cur_t = l
            continue
        if cur_t:
            cur_b.append(l)
        else:
            cur_t, cur_b = '总起', [l]
    flush()
    return entries

def parse_bazhishi(path):
    lines = [l.rstrip() for l in path.read_text(encoding='utf-8').split('\n')]
    h2 = re.compile(r'^##\s+\*{0,2}(.+?)\*{0,2}\s*$')
    entries, cur_t, cur_b = [], None, []
    def flush():
        nonlocal cur_t, cur_b
        if cur_t and cur_b:
            c = '\n'.join(cur_b).strip()
            if len(c) >= 100:
                entries.append((cur_t, c))
        cur_t, cur_b = None, []
    for l in lines:
        m = h2.match(l)
        if m:
            flush()
            cur_t = m.group(1).strip()
            continue
        if cur_t and l.strip():
            cur_b.append(l)
    flush()
    return entries

conn = sqlite3.connect(DB, timeout=120)
conn.execute('PRAGMA busy_timeout=120000')
JOBS = [
    ('兰台妙选 - 西窗老人.txt', '兰台妙选', 'lantai-miaoxuan', '西窗老人', 'LT', 0.95, parse_lantai),
    ('八字知识.txt', '八字知识', 'bazi-zhishi', '公开整理本', 'BZ', 0.8, parse_bazhishi),
]
for fname, book, slug, author, pfx, trust, parser in JOBS:
    entries = parser(BASE / fname)
    ins = skip = 0
    for title, content in entries:
        kb_title = f'原典·{book}·{title}' if trust >= 0.9 else f'{book}·{title}'
        eid = f'KB-{pfx}-' + hashlib.md5(kb_title.encode()).hexdigest()[:10]
        if conn.execute('SELECT 1 FROM kb_formal WHERE entry_id=? OR title=?', (eid, kb_title)).fetchone():
            skip += 1
            continue
        full = f'【{book}·{title}】（{author}）\n\n' + content
        conn.execute("""INSERT INTO kb_formal
            (entry_id, module, title, content, src_id, category, keywords, summary,
             trust_score, version, promoted_at, promoted_from, status, fingerprint, domain, tags)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (eid, 'bazi', kb_title, full, slug, slug,
             json.dumps([book, title.split('·')[-1]], ensure_ascii=False),
             content[:80], trust, '1.0', NOW, f'kimi-t1-batch10-{slug}', 'formal', fp(pfx, full), 'mingli',
             json.dumps(['原典' if trust >= 0.9 else '整理本', book], ensure_ascii=False)))
        ins += 1
    conn.commit()
    print(f'[{book}] 解析 {len(entries)} / 入库 {ins} / 跳过 {skip}')
conn.close()
