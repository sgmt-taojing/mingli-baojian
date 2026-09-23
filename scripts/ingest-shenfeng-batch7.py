#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""批7 · 神峰通考拆分入库（BUILD-SPEC T1 批7 · 2026-09-23 Kimi · 命理知识源头再蒸馏波次）

源：《神峰通考》张楠（明，公有领域；ctext.org 整理本）
本地净本：cold-storage/.../classics/神峰通考 - 张楠.txt（450KB，7 个 ## 章节块）

背景：KB 既有「原典·神峰通考·全录」单条目 156KB——检索压位，本批拆分后退役。
解析粒度：## 块按序编卷一~卷七 → 块内短行标题（≤16字无标点，说/类/篇/歌/赋/诀/论/
          辨/法/格/叙后缀，允许前导空格）二级分节 → 超 8000 字三级按格名短行细分。
清洗：剥 ctext 抓取元数据行（来源章节：…）。原文不改写。
字段：module=bazi, category=shenfeng-tongkao, trust=0.95, src_id=shenfeng-tongkao,
      指纹幂等, domain=mingli, tags 带写。
"""
import sqlite3, json, hashlib, re, time
from pathlib import Path

SRC = Path('/Volumes/模型训练数据/cold-storage/ml-training/archive/mingli-db-backups-20260819/workspace-tmp/giant-shoulders/fatecat/domains/fate-analysis/data-products/classics/神峰通考 - 张楠.txt')
DB = Path(__file__).resolve().parent.parent / 'server' / 'database' / 'yidao.db'
NOW = time.strftime('%Y-%m-%d %H:%M:%S')
CAP = 8000
CN = '一二三四五六七八九十'

def fp(s): return 'SF|' + hashlib.sha1(s.encode('utf-8')).hexdigest()[:16]

lines = [l.rstrip() for l in SRC.read_text(encoding='utf-8').split('\n')]

blk_re = re.compile(r'^##\s*神峰通考\s*$')
hdr_re = re.compile(r'^\s*([\u4e00-\u9fa5]{2,14}(?:说|类|篇|歌|赋|诀|论|辨|法|格|叙|序))\s*$')
META = re.compile(r'^来源章节：|^整理说明：|^来源：https?://|^抓取范围：|^ctext|^作者：')
BAD_HDR = {'神峰通考', '目录', '叙一'}

blocks = []
cur, started = [], False
for l in lines:
    if META.match(l.strip()):
        continue
    if blk_re.match(l):
        if cur:
            blocks.append(cur)
        cur, started = [], True
        continue
    if started and l.strip():
        cur.append(l)
if cur:
    blocks.append(cur)
print(f'## 块 {len(blocks)}')

entries = []
for bi, body in enumerate(blocks, 1):
    vol = f'卷{CN[bi-1]}'
    subs, cur_t, cur_b = [], None, []
    for l in body:
        s = l.strip()
        m = hdr_re.match(l)
        if m and s not in BAD_HDR and len(s) <= 14:
            if cur_t and cur_b:
                subs.append((cur_t, cur_b[:]))
            elif not cur_t and cur_b:
                subs.append(('总起', cur_b[:]))
            cur_t, cur_b = s, []
        elif cur_t:
            cur_b.append(s)
        else:
            cur_b.append(s)
    if cur_t and cur_b:
        subs.append((cur_t, cur_b[:]))
    elif not cur_t and cur_b:
        subs.append(('全节', cur_b[:]))
    for t, b in subs:
        content = '\n'.join(b).strip()
        if len(content) < 50:
            continue
        title = f'{vol}·{t}' if t != '全节' else vol
        # L3 超帽按格名短行细分
        if len(content) > CAP:
            parts, cb, cn = [], [], 0
            for l in b:
                if re.match(r'^[\u4e00-\u9fa5]{2,12}$', l) and cn > CAP * 0.6 and cb:
                    parts.append(cb[:]); cb, cn = [l], len(l)
                else:
                    cb.append(l); cn += len(l)
            if cb:
                parts.append(cb)
            for pi, pb in enumerate(parts, 1):
                c = '\n'.join(pb).strip()
                if len(c) >= 50:
                    entries.append((f'{title}·{pi}' if len(parts) > 1 else title, c))
        else:
            entries.append((title, content))

print(f'条目 {len(entries)}')
assert len(entries) >= 25, f'条目数异常偏少（{len(entries)}）'

conn = sqlite3.connect(DB, timeout=60)
conn.execute('PRAGMA busy_timeout=60000')
ins = skip = 0
for title, content in entries:
    kb_title = f'原典·神峰通考·{title}'
    eid = 'KB-SF-' + hashlib.md5(kb_title.encode()).hexdigest()[:10]
    if conn.execute('SELECT 1 FROM kb_formal WHERE entry_id=? OR title=?', (eid, kb_title)).fetchone():
        skip += 1
        continue
    full = f'【神峰通考·{title}】（公有领域原典·ctext整理本）\n\n' + content
    conn.execute("""INSERT INTO kb_formal
        (entry_id, module, title, content, src_id, category, keywords, summary,
         trust_score, version, promoted_at, promoted_from, status, fingerprint, domain, tags)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (eid, 'bazi', kb_title, full, 'shenfeng-tongkao', 'shenfeng-tongkao',
         json.dumps(['神峰通考', '张楠', title], ensure_ascii=False),
         content[:80], 0.95, '1.0', NOW, 'kimi-t1-batch7-shenfeng', 'formal', fp(full), 'mingli',
         json.dumps(['原典', '神峰通考', '病药说'], ensure_ascii=False)))
    ins += 1
gone = conn.execute("DELETE FROM kb_formal WHERE src_id='SRC-PUBLIC-DOMAIN' AND title='原典·神峰通考·全录'").rowcount
conn.commit()
print(f'入库 {ins} / 跳过 {skip} / 退役大Blob {gone}')
sizes = sorted((len(c) for _, c in entries), reverse=True)
print(f'条目字数：最大 {sizes[0]} / 中位 {sizes[len(sizes)//2]} / 最小 {sizes[-1]}')
print('样例:', '、'.join(t for t, _ in entries[:10]))
conn.close()
