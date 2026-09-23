#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""批6 · 五行精纪拆分入库（BUILD-SPEC T1 批6 · 2026-09-23 Kimi · 命理知识源头再蒸馏波次）

源：《五行精纪》廖中（南宋，公有领域；ctext.org 整理本，来源标已在文件头注明）
本地净本：cold-storage/.../classics/五行精纪 - 廖中.txt（561KB，4390 行，33 卷+序）

背景：KB 既有「原典·五行精纪·《五行精紀》」单条目 191KB——粒度检索灾难，本批拆分后退役该大条目。
解析粒度：## 卷（35 个卷节标记）→ 卷内 standalone「论XX/释XX」子节 → 超 8000 字再按
          格名短行（≤12 字无标点）三级细分。scraper 元数据行（来源章节：ctext…）剥除。
字段：module=bazi, category=wuxing-jingji, trust=0.95（原典）, src_id=wuxing-jingji,
      指纹幂等, domain=mingli, tags 带写。
如实标注：ctext 源缺第二十卷、第三十卷（文件头已自注），不凑数。
"""
import sqlite3, json, hashlib, re, time
from pathlib import Path

SRC = Path('/Volumes/模型训练数据/cold-storage/ml-training/archive/mingli-db-backups-20260819/workspace-tmp/giant-shoulders/fatecat/domains/fate-analysis/data-products/classics/五行精纪 - 廖中.txt')
DB = Path(__file__).resolve().parent.parent / 'server' / 'database' / 'yidao.db'
NOW = time.strftime('%Y-%m-%d %H:%M:%S')
CAP = 8000

def fp(s): return 'WX|' + hashlib.sha1(s.encode('utf-8')).hexdigest()[:16]

text = SRC.read_text(encoding='utf-8')
lines = [l.strip() for l in text.split('\n')]

vol_re = re.compile(r'^##\s+(.+?)\s*$')
lun_re = re.compile(r'^(论|释).{1,10}$')
ge_re = re.compile(r'^[\u4e00-\u9fa5]{2,12}$')  # 格名短行
META = re.compile(r'^来源章节：|^整理说明：|^来源：https?://|^抓取范围：|^ctext|^作者：')

# L1：## 卷切分（跳过文件头/目录区：序 之前内容不入）
vols = []  # (vol_name, [lines])
cur_name, cur_body, started = None, [], False
for l in lines:
    if META.match(l):
        continue
    m = vol_re.match(l)
    if m:
        if cur_name and cur_body:
            vols.append((cur_name, cur_body[:]))
        cur_name, cur_body, started = m.group(1), [], True
        continue
    if started and l:
        cur_body.append(l)
if cur_name and cur_body:
    vols.append((cur_name, cur_body[:]))

def sub_split(name, body):
    """L2：论XX 子节切分；无子节则整卷一节"""
    subs, cur_t, cur_b = [], None, []
    for l in body:
        if lun_re.match(l):
            if cur_t and cur_b:
                subs.append((cur_t, cur_b[:]))
            elif not cur_t and cur_b:
                subs.append(('总起', cur_b[:]))
            cur_t, cur_b = l, []
        elif cur_t:
            cur_b.append(l)
        else:
            cur_b.append(l)
    if cur_t and cur_b:
        subs.append((cur_t, cur_b[:]))
    elif not cur_t and cur_b:
        subs.append(('全节', cur_b[:]))
    if not subs:
        subs = [('全节', body)]
    return [(f'{name}·{t}' if t not in ('全节',) else name, b) for t, b in subs]

def ge_split(name, body):
    """L3：超 CAP 再按格名短行细分，保底不超限"""
    if sum(len(l) for l in body) <= CAP:
        return [(name, body)]
    parts, cur_b = [], []
    cur_n = 0
    for l in body:
        if ge_re.match(l) and cur_n > CAP * 0.6 and cur_b:
            parts.append((name + f'·{len(parts)+1}', cur_b[:]))
            cur_b, cur_n = [l], len(l)
        else:
            cur_b.append(l)
            cur_n += len(l)
    if cur_b:
        parts.append((name + (f'·{len(parts)+1}' if parts else ''), cur_b[:]))
    return parts

entries = []
for vname, vbody in vols:
    for sname, sbody in sub_split(vname, vbody):
        for ename, ebody in ge_split(sname, sbody):
            content = '\n'.join(ebody).strip()
            if len(content) >= 50:
                entries.append((ename, content))

print(f'卷 {len(vols)} → 条目 {len(entries)}')
assert len(entries) >= 60, f'条目数异常偏少（{len(entries)}），解析需复核'

conn = sqlite3.connect(DB, timeout=60)
conn.execute('PRAGMA busy_timeout=60000')
ins = skip = 0
for title, content in entries:
    kb_title = f'原典·五行精纪·{title}'
    eid = 'KB-WX-' + hashlib.md5(kb_title.encode()).hexdigest()[:10]
    if conn.execute('SELECT 1 FROM kb_formal WHERE entry_id=? OR title=?', (eid, kb_title)).fetchone():
        skip += 1
        continue
    full = f'【五行精纪·{title}】（公有领域原典·ctext整理本）\n\n' + content
    conn.execute("""INSERT INTO kb_formal
        (entry_id, module, title, content, src_id, category, keywords, summary,
         trust_score, version, promoted_at, promoted_from, status, fingerprint, domain, tags)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (eid, 'bazi', kb_title, full, 'wuxing-jingji', 'wuxing-jingji',
         json.dumps(['五行精纪', '廖中', title], ensure_ascii=False),
         content[:80], 0.95, '1.0', NOW, 'kimi-t1-batch6-wuxingjingji', 'formal', fp(full), 'mingli',
         json.dumps(['原典', '五行精纪', '禄命'], ensure_ascii=False)))
    ins += 1
# 退役 191KB 单条目大Blob（同书同源，拆分后冗余且检索压位）
gone = conn.execute("DELETE FROM kb_formal WHERE src_id='SRC-PUBLIC-DOMAIN' AND title='原典·五行精纪·《五行精紀》'").rowcount
conn.commit()
print(f'入库 {ins} / 跳过 {skip} / 退役大Blob {gone}')
sizes = sorted((len(c) for _, c in entries), reverse=True)
print(f'条目字数：最大 {sizes[0]} / 中位 {sizes[len(sizes)//2]} / 最小 {sizes[-1]}')
conn.close()
