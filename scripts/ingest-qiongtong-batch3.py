#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""批3 · 穷通调候入库（BUILD-SPEC T1 批3 · 2026-09-21 Kimi · WO-003 切片）

源：《穷通宝鉴》（原题《栏江网》，余春台编，佚名原著，公有领域）
本地净本：cold-storage/.../classics/穷通宝鉴 - 佚名.txt（95KB 全本）

解析粒度：
  - 五行总论 1 节 + 论木/火/土/金/水 5 节
  - 四季总论（三春甲木总论 等，有几节收几节）
  - 十干逐月调候（正月甲木…十二月癸水，目标 120 节，按原文实际节数）
字段：module=bazi, category=qiongtong-tiaohou, trust=0.95（原典）, status=formal,
      src_id=qiongtong-baojian, fingerprint 幂等, domain=mingli。
红线：原典原文不改写（白话化归报告引擎）；禁二手拼接（单一净本来源）。
"""
import sqlite3, json, hashlib, re, time
from pathlib import Path

SRC = Path('/Volumes/模型训练数据/cold-storage/ml-training/archive/mingli-db-backups-20260819/workspace-tmp/giant-shoulders/fatecat/domains/fate-analysis/data-products/classics/穷通宝鉴 - 佚名.txt')
DB = Path(__file__).resolve().parent.parent / 'server' / 'database' / 'yidao.db'
NOW = time.strftime('%Y-%m-%d %H:%M:%S')

def fp(s): return 'QT|' + hashlib.sha1(s.encode('utf-8')).hexdigest()[:16]

text = SRC.read_text(encoding='utf-8')
lines = [l.strip() for l in text.split('\n')]

# 章节头识别：五行总论 / 论木… / 三春甲木总论… / 正月甲木…（行首，全行≤14字防误判正文句首）
MONTH = '正一二三四五六七八九十'
STEM = '甲乙丙丁戊己庚辛壬癸'
hdr_re = re.compile(rf'^(五行总论|论[木火土金水]|三[春夏秋冬][{STEM}](?:总论)?|[{MONTH}]{{1,3}}月[{STEM}][木火土金水])[:：]?\s*$')
hdr_inline_re = re.compile(rf'^([{MONTH}]{{1,3}}月[{STEM}][木火土金水])(.+)')  # 「正月甲木，…」「四月甲木退气…」行首成节（可无踪点）

sections = []  # (title, [body_lines])
cur_title, cur_body = None, []
def flush():
    global cur_title, cur_body
    if cur_title and cur_body:
        sections.append((cur_title, cur_body[:]))
    cur_title, cur_body = None, []

for l in lines:
    if not l:
        continue
    if l == '穷通宝鉴':
        continue
    m = hdr_inline_re.match(l)
    if m:
        flush()
        cur_title = m.group(1)
        cur_body = [l]  # 原行完整保留为正文首行
        continue
    if hdr_re.match(l) and len(l) <= 14:
        flush()
        cur_title = l.rstrip('：:')
        continue
    if cur_title:
        cur_body.append(l)
flush()

# 归并：同一标题多段（如「二月甲木」两处）合为一节
merged = {}
for t, body in sections:
    merged.setdefault(t, []).extend(body)

entries = []
for t, body in merged.items():
    content = '\n'.join(body).strip()
    if len(content) < 30:
        continue
    entries.append((t, content))

print(f'解析出 {len(entries)} 节')
assert len(entries) >= 110, f'节数异常偏少（{len(entries)}），解析规则需复核'

conn = sqlite3.connect(DB, timeout=60)
conn.execute('PRAGMA busy_timeout=60000')
ins = skip = 0
for title, content in entries:
    eid = 'KB-QT-' + hashlib.md5(title.encode()).hexdigest()[:10]
    if conn.execute('SELECT 1 FROM kb_formal WHERE entry_id=?', (eid,)).fetchone():
        skip += 1
        continue
    full = f'【穷通宝鉴·{title}】（公有领域原典）\n\n' + content
    conn.execute("""INSERT INTO kb_formal
        (entry_id, module, title, content, src_id, category, keywords, summary,
         trust_score, version, promoted_at, promoted_from, status, fingerprint, domain)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (eid, 'bazi', f'穷通宝鉴·{title}', full, 'qiongtong-baojian', 'qiongtong-tiaohou',
         json.dumps(['穷通宝鉴', '调候', title[-2] if len(title) >= 2 and title[-2] in STEM else '总论'], ensure_ascii=False),
         content[:80], 0.95, '1.0', NOW, 'kimi-t1-batch3-qiongtong', 'formal', fp(full), 'mingli'))
    ins += 1
conn.commit()
print(f'入库 {ins} / 跳过 {skip}')
# 覆盖验证：十干×十二月应有节数
months = [t for t, _ in entries if re.match(rf'^[{MONTH}]{{1,3}}月[{STEM}]', t)]
print(f'月干节数: {len(months)}（目标 ~120）')
stems_cov = sorted({t[-1] for t in months})
print(f'十干覆盖: {"".join(stems_cov)}（{len(stems_cov)}/10）')
conn.close()
