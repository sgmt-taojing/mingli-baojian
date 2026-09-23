#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""批9b · 子平真诠评注锚点切分（2026-09-23 Kimi · 源头再蒸馏波次）

问题：评注净本正文丢失章节头（爬虫合并），仅 68/367 两行残留，机械切只得 6 块。
方案：以已入库的《子平真诠原本》47 章首句为锚，在评注正文中定位章界——
      评注体例为「原文整段 + 徐乐吾评注」，原本章首句必出现于对应章开头。
      锚点命中即切分；未命中锚点顺延并入前一章（如实统计命中率）。
字段同批9：module=bazi, category=ziping-zhenquan-pz, trust=0.95, domain=mingli。
"""
import sqlite3, json, hashlib, re, time
from pathlib import Path

BASE = Path('/Volumes/模型训练数据/cold-storage/ml-training/archive/mingli-db-backups-20260819/workspace-tmp/giant-shoulders/fatecat/domains/fate-analysis/data-products/classics')
DB = Path(__file__).resolve().parent.parent / 'server' / 'database' / 'yidao.db'
NOW = time.strftime('%Y-%m-%d %H:%M:%S')

def fp(s): return 'ZP|' + hashlib.sha1(s.encode('utf-8')).hexdigest()[:16]

def chap_titles(path):
    lines = [l.strip() for l in path.read_text(encoding='utf-8').split('\n')]
    chap_re = re.compile(r'^[一二三四五六七八九十]{1,3}[、．\uFF0E.]\s*([\u4e00-\u9fa5]{1,14})$')
    out = []
    for l in lines:
        m = chap_re.match(l)
        if m:
            out.append(m.group(1))
    return out

# 原本 47 章（正文部，TOC 会重复——取带正文的）
yb_lines = [l.strip() for l in (BASE / '子平真诠原本 - 沈孝瞻.txt').read_text(encoding='utf-8').split('\n')]
chap_re = re.compile(r'^[一二三四五六七八九十]{1,3}[、．\uFF0E.]\s*([\u4e00-\u9fa5]{1,14})$')
yb_chaps = []  # (title, first_content_line)
cur_t, seen_body = None, False
for i, l in enumerate(yb_lines):
    m = chap_re.match(l)
    if m:
        # 找下一非空行作锚
        for j in range(i + 1, min(i + 6, len(yb_lines))):
            if yb_lines[j] and len(yb_lines[j]) >= 12:
                yb_chaps.append((m.group(1), yb_lines[j][:18]))
                break
# 去重（TOC 与正文各命中一次，保后者锚更稳——正文锚后面紧跟长文）
uniq = {}
for t, a in yb_chaps:
    uniq[t] = a  # 后写覆盖先写，正文锚赢
anchors = list(uniq.items())
print(f'原本锚点 {len(anchors)} 章')

pz_lines = [l.strip() for l in (BASE / '子平真诠评注 - 沈孝瞻.txt').read_text(encoding='utf-8').split('\n')]
# 正文起点：序结束后的「一、论十干十二支」行（68 行附近），之前的序/目录不入
start = next(i for i, l in enumerate(pz_lines) if l.startswith('一、论十干十二支'))
body = pz_lines[start:]

# 锚点定位：逐行查锚（首句前 18 字的前 12 字匹配，容忍版式差异）
marks = []  # (body_idx, title)
used = set()
for ai, (t, anchor) in enumerate(anchors):
    key = anchor[:12]
    for bi, l in enumerate(body):
        if bi in used:
            continue
        if key and key in l:
            marks.append((bi, t))
            used.add(bi)
            break
marks.sort()
print(f'锚点命中 {len(marks)}/47')

entries = []
for k, (bi, t) in enumerate(marks):
    end = marks[k + 1][0] if k + 1 < len(marks) else len(body)
    c = '\n'.join(x for x in body[bi:end] if x).strip()
    if len(c) >= 80:
        entries.append((t, c))
# 超大章保底均分
final = []
for t, c in entries:
    if len(c) <= 9000:
        final.append((t, c))
        continue
    ls = c.split('\n')
    parts, cb, cn = [], [], 0
    for l in ls:
        if cn > 8000 and cb:
            parts.append(cb); cb, cn = [], 0
        cb.append(l); cn += len(l)
    if cb:
        parts.append(cb)
    for i, p in enumerate(parts, 1):
        final.append((f'{t}·{i}' if len(parts) > 1 else t, '\n'.join(p).strip()))

print(f'评注条目 {len(final)}')
conn = sqlite3.connect(DB, timeout=120)
conn.execute('PRAGMA busy_timeout=120000')
ins = skip = 0
for title, content in final:
    kb_title = f'原典·子平真诠评注·{title}'
    eid = 'KB-ZP-' + hashlib.md5(('评注' + kb_title).encode()).hexdigest()[:10]
    if conn.execute('SELECT 1 FROM kb_formal WHERE entry_id=? OR title=?', (eid, kb_title)).fetchone():
        skip += 1
        continue
    full = f'【子平真诠评注·{title}】（公有领域原典·沈孝瞻原著/徐乐吾评注）\n\n' + content
    conn.execute("""INSERT INTO kb_formal
        (entry_id, module, title, content, src_id, category, keywords, summary,
         trust_score, version, promoted_at, promoted_from, status, fingerprint, domain, tags)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (eid, 'bazi', kb_title, full, 'ziping-zhenquan-pz', 'ziping-zhenquan-pz',
         json.dumps(['子平真诠', '徐乐吾', title], ensure_ascii=False),
         content[:80], 0.95, '1.0', NOW, 'kimi-t1-batch9b-pz-anchor', 'formal', fp(full), 'mingli',
         json.dumps(['原典', '子平真诠', '评注'], ensure_ascii=False)))
    ins += 1
conn.commit()
print(f'入库 {ins} / 跳过 {skip}')
conn.close()
