#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""批5 · 渊海子平差集入库（BUILD-SPEC T1 批5 · 2026-09-21 Kimi · WO-003 切片）

源：《渊海子平》徐子平（宋，公有领域）
本地净本：cold-storage/.../classics/渊海子平 - 徐子平.txt（161KB 全本，4713 行）

背景：KB 已有 SRC-PUBLIC-DOMAIN 渊海条目 35 节（卷首~女命总断歌），本批只补差集。
解析粒度：《篇目》独立行成节（允许行尾后缀如「《碧渊赋》捷驰千里马」并入正文），
          全书 47 篇目 - 已在库 17 篇目名 = 30 差集（论七杀=论偏官不重复入库）。
清洗：剥电子书水印（幸福的味道/QQ号/微信公众号，共 9 处）——非原文内容，剥除不改原文。
字段：module=bazi, category=yuanhai-canon, trust=0.95（原典）, status=formal,
      src_id=yuanhai-ziping, fingerprint 幂等, domain=mingli, tags 带写。
红线：原典正文不改写；已在库篇目一律跳过（防近重复条目）。
"""
import sqlite3, json, hashlib, re, time
from pathlib import Path

SRC = Path('/Volumes/模型训练数据/cold-storage/ml-training/archive/mingli-db-backups-20260819/workspace-tmp/giant-shoulders/fatecat/domains/fate-analysis/data-products/classics/渊海子平 - 徐子平.txt')
DB = Path(__file__).resolve().parent.parent / 'server' / 'database' / 'yidao.db'
NOW = time.strftime('%Y-%m-%d %H:%M:%S')

# 已在库篇目（含别名映射：论七杀 即 论偏官）——一律跳过
SKIP = {'论日为主', '论月令', '论太岁吉凶', '论征太岁', '论大运', '论疾病', '论伤官',
        '伤官说', '论食神', '论正财', '正官论', '论偏官', '论官星太过', '论印綬',
        '论劫财', '论阳刃', '论日刃', '论日贵', '论日德', '论魁罡', '论金神',
        '论父', '论母', '论兄弟姊妹', '论妻妾', '论子息', '论小儿', '论小儿关煞'}
WATERMARK = re.compile(r'幸福的味道|2338856113|微信公众号|加小编QQ|Table of Contents')

def fp(s): return 'YH|' + hashlib.sha1(s.encode('utf-8')).hexdigest()[:16]

text = SRC.read_text(encoding='utf-8')
lines = [l.strip() for l in text.split('\n')]

hdr_re = re.compile(r'^《(.{1,12}?)》(.*)$')
sections = []  # (title, [body])
cur_title, cur_body = None, []
def flush():
    global cur_title, cur_body
    if cur_title and cur_body:
        sections.append((cur_title, cur_body[:]))
    cur_title, cur_body = None, []

for l in lines:
    if not l or WATERMARK.search(l):
        continue
    m = hdr_re.match(l)
    if m:
        flush()
        cur_title = re.sub(r'[　\s]+', '', m.group(1))  # 《人　　鑑　　论》→人鑑论
        rest = m.group(2).strip()
        if rest:
            cur_body = [rest]  # 行尾后缀归正文（碧渊赋》捷驰千里马）
        continue
    if cur_title:
        cur_body.append(l)
flush()

merged = {}
for t, body in sections:
    merged.setdefault(t, []).extend(body)

entries, skipped = [], []
for t, body in merged.items():
    if t in SKIP:
        skipped.append(t)
        continue
    content = '\n'.join(body).strip()
    if len(content) < 30:
        print(f'[WARN] 节内容过短：{t}（{len(content)}字）')
        continue
    entries.append((t, content))

print(f'解析 {len(merged)} 篇目 / 跳过已在库 {len(skipped)} / 差集入库候选 {len(entries)}')
assert len(entries) >= 28, f'差集数异常（{len(entries)}），解析或 SKIP 需复核'

conn = sqlite3.connect(DB, timeout=60)
conn.execute('PRAGMA busy_timeout=60000')
ins = skip = 0
for title, content in entries:
    kb_title = f'原典·渊海子平·{title}'
    # 双保险：同题已在库（任何 src）即跳过
    if conn.execute('SELECT 1 FROM kb_formal WHERE title=?', (kb_title,)).fetchone():
        skip += 1
        continue
    eid = 'KB-YH-' + hashlib.md5(title.encode()).hexdigest()[:10]
    if conn.execute('SELECT 1 FROM kb_formal WHERE entry_id=?', (eid,)).fetchone():
        skip += 1
        continue
    full = f'【渊海子平·{title}】（公有领域原典）\n\n' + content
    conn.execute("""INSERT INTO kb_formal
        (entry_id, module, title, content, src_id, category, keywords, summary,
         trust_score, version, promoted_at, promoted_from, status, fingerprint, domain, tags)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (eid, 'bazi', kb_title, full, 'yuanhai-ziping', 'yuanhai-canon',
         json.dumps(['渊海子平', '子平', title], ensure_ascii=False),
         content[:80], 0.95, '1.0', NOW, 'kimi-t1-batch5-yuanhai', 'formal', fp(full), 'mingli',
         json.dumps(['原典', '渊海子平', '子平'], ensure_ascii=False)))
    ins += 1
conn.commit()
print(f'入库 {ins} / 跳过 {skip}')
print('差集篇目:', '、'.join(t for t, _ in entries))
conn.close()
