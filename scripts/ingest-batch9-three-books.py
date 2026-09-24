#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""批9 · 千里命稿/子平真诠原本/子平真诠评注 三书入库（BUILD-SPEC T1 批9 · 2026-09-23 Kimi）

源（均公有领域）：
  《千里命稿》韦千里（民国，白话命学入门经典）313KB/7959 行
  《子平真诠原本》沈孝瞻（清）77KB/1010 行
  《子平真诠评注》沈孝瞻原著·徐乐吾评注 83KB/420 行
本地净本：cold-storage/.../classics/ 同名 txt

解析粒度：
  千里命稿：正文起于第 281 行（前为目录区），「XX篇」一级节 + 短行子节二级，
            剔除干支单字/五行单字伪标题，超 8000 字三级细分；
  子平真诠两版：^[一二三…]+[、．]章名$ 逐章成条目（评注版 ．分隔兼容）。
字段：module=bazi, category=<book-slug>, trust=0.95（原典）, src_id=<book-slug>,
      指纹幂等, domain=mingli, tags 带写。原文不改写。
"""
import sqlite3, json, hashlib, re, time
from pathlib import Path

BASE = Path('/Volumes/模型训练数据/cold-storage/ml-training/archive/mingli-db-backups-20260819/workspace-tmp/giant-shoulders/fatecat/domains/fate-analysis/data-products/classics')
DB = Path(__file__).resolve().parent.parent / 'server' / 'database' / 'yidao.db'
NOW = time.strftime('%Y-%m-%d %H:%M:%S')
CAP = 8000
GANZHI = set('甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥金木水火土')

def fp(p, s): return p + '|' + hashlib.sha1(s.encode('utf-8')).hexdigest()[:16]

def parse_qianli(path):
    lines = [l.strip() for l in path.read_text(encoding='utf-8').split('\n')]
    body = lines[280:]  # 281 行起为正文（前为目录区）
    pian_re = re.compile(r'^[\u4e00-\u9fa5]{2,12}篇$')
    sub_re = re.compile(r'^[\u4e00-\u9fa5·]{2,12}$')
    entries, cur_p, cur_t, cur_b = [], None, None, []
    def flush():
        nonlocal cur_p, cur_t, cur_b
        if cur_p and cur_t and cur_b:
            entries.append((f'{cur_p}·{cur_t}', '\n'.join(cur_b).strip()))
        elif cur_p and not cur_t and cur_b:
            entries.append((cur_p, '\n'.join(cur_b).strip()))
        cur_t, cur_b = None, []
    for l in body:
        if not l:
            continue
        if pian_re.match(l):
            if cur_p and cur_b and not cur_t:
                entries.append((cur_p + '·总起', '\n'.join(cur_b).strip()))
            elif cur_t or cur_b:
                flush()
            cur_p, cur_t, cur_b = l, None, []
            continue
        if cur_p and sub_re.match(l) and l not in GANZHI and len(l) >= 2 and not pian_re.match(l):
            flush()
            cur_t = l
            continue
        if cur_p:
            cur_b.append(l)
    if cur_p:
        flush()
    return entries

def parse_ziping(path):
    lines = [l.strip() for l in path.read_text(encoding='utf-8').split('\n')]
    chap_re = re.compile(r'^[一二三四五六七八九十]{1,3}[、．\uFF0E.]\s*([\u4e00-\u9fa5]{1,14})$')
    entries, cur_t, cur_b, started = [], None, [], False
    def flush():
        nonlocal cur_t, cur_b
        if cur_t and cur_b:
            c = '\n'.join(cur_b).strip()
            if len(c) >= 50:
                entries.append((cur_t, c))
        cur_t, cur_b = None, []
    for l in lines:
        if not l:
            continue
        m = chap_re.match(l)
        if m:
            flush()
            cur_t = m.group(1)
            started = True
            continue
        if started and cur_t:
            cur_b.append(l)
    flush()
    return entries

def cap_split(entries):
    """超帽条目按行均分为多段（保底）"""
    out = []
    for t, c in entries:
        if len(c) <= CAP:
            out.append((t, c))
            continue
        ls = c.split('\n')
        parts, cb, cn = [], [], 0
        for l in ls:
            if cn > CAP and cb:
                parts.append(cb); cb, cn = [], 0
            cb.append(l); cn += len(l)
        if cb:
            parts.append(cb)
        for i, p in enumerate(parts, 1):
            out.append((f'{t}·{i}' if len(parts) > 1 else t, '\n'.join(p).strip()))
    return [(t, c) for t, c in out if len(c) >= 50]

BOOKS = [
    ('千里命稿 - 韦千里.txt', '千里命稿', 'qianli-minggao', '韦千里', 'QL', parse_qianli),
    ('子平真诠原本 - 沈孝瞻.txt', '子平真诠原本', 'ziping-zhenquan-yb', '沈孝瞻', 'ZP', parse_ziping),
    ('子平真诠评注 - 沈孝瞻.txt', '子平真诠评注', 'ziping-zhenquan-pz', '沈孝瞻/徐乐吾评', 'ZP', parse_ziping),
]

conn = sqlite3.connect(DB, timeout=120)
conn.execute('PRAGMA busy_timeout=120000')
total_ins = total_skip = 0
for fname, book, slug, author, pfx, parser in BOOKS:
    entries = cap_split(parser(BASE / fname))
    print(f'[{book}] 解析 {len(entries)} 节')
    ins = skip = 0
    for title, content in entries:
        kb_title = f'原典·{book}·{title}'
        eid = f'KB-{pfx}-' + hashlib.md5(kb_title.encode()).hexdigest()[:10]
        if conn.execute('SELECT 1 FROM kb_formal WHERE entry_id=? OR title=?', (eid, kb_title)).fetchone():
            skip += 1
            continue
        full = f'【{book}·{title}】（公有领域原典·{author}）\n\n' + content
        conn.execute("""INSERT INTO kb_formal
            (entry_id, module, title, content, src_id, category, keywords, summary,
             trust_score, version, promoted_at, promoted_from, status, fingerprint, domain, tags)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (eid, 'bazi', kb_title, full, slug, slug,
             json.dumps([book, title.split('·')[0]], ensure_ascii=False),
             content[:80], 0.95, '1.0', NOW, f'kimi-t1-batch9-{slug}', 'formal', fp(pfx, full), 'mingli',
             json.dumps(['原典', book], ensure_ascii=False)))
        ins += 1
    conn.commit()
    print(f'[{book}] 入库 {ins} / 跳过 {skip}')
    total_ins += ins
    total_skip += skip
print(f'合计入库 {total_ins} / 跳过 {total_skip}')
conn.close()
