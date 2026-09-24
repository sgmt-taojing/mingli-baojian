#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""批11 · 天纪字幕差集补蒸馏（G26 多轮补蒸馏 · 2026-09-23 Kimi · 源头再蒸馏波次）

背景：天纪分类字幕 179 文件，既有蒸馏覆盖 141（旧脚本 tianji_classified_distill.py
      产出 696 条，但缺 src_id/fingerprint/domain/tags——巡警示警源头之一）。
      本批只补差集（对账检出未覆盖文件），且按现代字段规范入库。
清洗：沿用旧管线 clean_text（去水印词/短行/重复行），分段 2500 字与旧批一致。
字段：module 按文件名主题（紫微/易经/堪舆/四柱/六壬）, trust=0.85（字幕 OCR）,
      src_id=nishi-subs-tianji:<文件名>, status=formal, fingerprint 幂等,
      domain=mingli, tags 带写。entry_id 用 KB-TJ2- 前缀避撞旧批。
"""
import os, re, sqlite3, hashlib, json, time
from pathlib import Path

SUBS = Path('/Volumes/模型训练数据/training-corpus/nishi-materials/subs-tianji-classified')
DB = Path(__file__).resolve().parent.parent / 'server' / 'database' / 'yidao.db'
NOW = time.strftime('%Y-%m-%d %H:%M:%S')

NOISE = ["古流芳", "普濟天", "渶軓醫學", "普济天", "海古流芳", "瀋陽", "焦經"]

def is_noise(line):
    c = re.sub(r'^\[\d+s\]\s*', '', line).strip()
    if len(c) < 3:
        return True
    if sum(1 for f in NOISE if f in c) >= 1 and len(c) <= 15:
        return True
    if len(set(c.replace(' ', ''))) <= 4 and len(c) > 8:
        return True
    return False

def clean_text(raw):
    cleaned, prev = [], ''
    for line in raw.split('\n'):
        if not line.strip():
            continue
        c = re.sub(r'^\[\d+s\]\s*', '', line).strip()
        if is_noise(line):
            continue
        if prev and (c in prev or prev in c):
            continue
        cleaned.append(c)
        prev = c
    return '\n'.join(cleaned)

def detect_module(fname):
    for k, m in [('紫微', 'ziwei'), ('堪舆', 'fengshui'), ('四柱', 'bazi'),
                 ('六壬', 'liuren'), ('易经', 'yijing'), ('开篇', 'yijing')]:
        if k in fname:
            return m
    return 'yijing'

def norm(s):
    s = re.sub(r'\.txt$', '', s)
    s = re.sub(r'^nishi-subs:', '', s)
    s = re.sub(r'[\s，,。：:（）()【】\[\]、_-]', '', s)
    return s.lower()

conn = sqlite3.connect(DB, timeout=120)
conn.execute('PRAGMA busy_timeout=120000')

# 差集对账：文件名规范化后与既有 src_id 互含匹配
srcs = {r[0] for r in conn.execute(
    "SELECT DISTINCT src_id FROM kb_formal WHERE src_id LIKE '%subs%' OR src_id LIKE '%tianji%' OR module='nishi-transcripts'").fetchall()}
# 旧脚本无 src_id，需再用 title 对账（倪师天纪分类·<title>·第N段）
titles = {r[0] for r in conn.execute("SELECT DISTINCT title FROM kb_formal WHERE title LIKE '倪师天纪分类%'").fetchall()}
src_norm = {norm(s) for s in srcs if s}
title_norm = {norm(t) for t in titles if t}

files = sorted(f for f in os.listdir(SUBS) if f.endswith('.txt'))
todo = []
for f in files:
    nf = norm(f.replace('_new', '').replace('(new)', '').replace('(1)', ''))
    hit = any(len(s) > 4 and (nf in s or s in nf) for s in src_norm)
    if not hit:
        # title 对账：旧批 title 含文件名前 20 字
        hit = any(nf[:20] in t for t in title_norm)
    if not hit:
        todo.append(f)
print(f'天纪字幕 {len(files)} 文件，差集 {len(todo)}')

total_files = total_segs = 0
for fname in todo:
    text = clean_text((SUBS / fname).read_text(encoding='utf-8'))
    if len(text) < 300:
        print(f'[skip] {fname} 清洗后过短（{len(text)}字）')
        continue
    module = detect_module(fname)
    title = fname.replace('.txt', '').replace('_new', '').replace('(1)', '').strip()[:40]
    segs, cur, cl = [], [], 0
    for line in text.split('\n'):
        cur.append(line); cl += len(line)
        if cl >= 2500:
            segs.append('\n'.join(cur)); cur, cl = [], 0
    if cur:
        segs.append('\n'.join(cur))
    inserted = 0
    for i, seg in enumerate(segs):
        if len(seg) < 300:
            continue
        eid = 'KB-TJ2-' + hashlib.md5(f'{fname}-{i}'.encode()).hexdigest()[:8]
        if conn.execute('SELECT 1 FROM kb_formal WHERE entry_id=?', (eid,)).fetchone():
            continue
        content = f'来源：倪师智慧结晶天纪分类版视频字幕（《{title}》画面烧录字幕 OCR 提取，倪海厦讲课原文）。\n\n{seg[:4500]}'
        conn.execute("""INSERT INTO kb_formal
            (entry_id, module, title, content, src_id, category, keywords, summary,
             trust_score, version, promoted_at, promoted_from, status, fingerprint, domain, tags)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (eid, module, f'倪师天纪分类·{title}·第{i+1}段', content,
             f'nishi-subs-tianji:{fname}', module,
             json.dumps(['倪海厦', '天纪', title[:12]], ensure_ascii=False),
             seg[:80], 0.85, '1.0', NOW, 'kimi-g26-tianji-backfill', 'formal',
             'TJ2|' + hashlib.sha1(content.encode()).hexdigest()[:16], 'mingli',
             json.dumps(['倪师', '天纪', '字幕蒸馏'], ensure_ascii=False)))
        inserted += 1
    conn.commit()
    total_files += 1 if inserted else 0
    total_segs += inserted
    print(f'[{module}] {fname} → {inserted} 段')
print(f'合计：{total_files} 文件 / {total_segs} 段入库')
conn.close()
