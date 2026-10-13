#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""手稿 staging 对照蒸馏管线（校勘规范 v2.2 · 手稿校对规则）
流程：手稿清洗 → fts5 召回古籍候选 → 相似度分级 → 对照台账
分级：≥0.75 手稿印证（互证链）/ 0.35-0.75 参照相关（存疑不独断）/ <0.35 手稿独有（待入库候批）
红线：手稿与古籍相左只存疑标注（audit_status=pending），不删改古籍原文；本阶段只出台账不入库。
用法：/usr/bin/python3 training/manuscript-collate.py [--limit N] [--out reports/manuscript-collate-YYYYMMDD]"""
import sqlite3, json, glob, re, sys, datetime, difflib
from pathlib import Path

DB = 'server/database/yidao.db'
LIM = None
OUT = None
args = sys.argv[1:]
if '--limit' in args:
    LIM = int(args[args.index('--limit') + 1])
if '--out' in args:
    OUT = args[args.index('--out') + 1]
if not OUT:
    OUT = 'reports/manuscript-collate-' + datetime.date.today().strftime('%Y%m%d')

SLIDE = re.compile(r'===\s*(slide|page)\s*\d+\s*===|===.*?===|---\s*PAGE BREAK\s*---', re.I)
def clean(t):
    t = SLIDE.sub(' ', t or '')
    t = re.sub(r'\s+', '', t)
    return t

def keyterms(title, keywords, content):
    terms = []
    for k in (keywords or '').replace(',', ' ').replace('、', ' ').split():
        if len(k) >= 2: terms.append(k)
    # 从标题取中文 2-4 字特征词
    for m in re.findall(r'[一-龥]{2,4}', title or ''):
        if m not in terms: terms.append(m)
    # 内容前 200 字的高频词补充
    for m in re.findall(r'[一-龥]{3,4}', clean(content)[:200])[:6]:
        if m not in terms: terms.append(m)
    return terms[:8]

def main():
    con = sqlite3.connect(DB, timeout=60)
    con.execute('PRAGMA query_only=1')
    fts = con.cursor()
    meta = con.cursor()

    entries = []
    for fp in sorted(glob.glob('knowledge/collected/manuscript-*.jsonl')):
        for line in open(fp, encoding='utf-8'):
            line = line.strip()
            if not line: continue
            try: entries.append(json.loads(line))
            except Exception: pass
    if LIM: entries = entries[:LIM]
    print(f'手稿条目 {len(entries)} 条，开始对照…', flush=True)

    ledger = []
    stat = {'印证': 0, '参照': 0, '独有': 0}
    for i, e in enumerate(entries):
        title = e.get('title') or ''
        content = clean(e.get('content') or e.get('summary') or '')
        if len(content) < 20:
            ledger.append({'idx': i, 'title': title[:50], 'module': e.get('module'), 'verdict': '碎片跳过', 'sim': 0})
            continue
        terms = keyterms(title, e.get('keywords'), e.get('content'))
        tri = [t for t in terms if len(t) >= 3][:6]
        cands = []
        if tri:
            match = ' OR '.join(f'"{t}"' for t in tri)
            try:
                cands = fts.execute(
                    "SELECT entry_id, summary, content FROM kb_fts5 WHERE kb_fts5 MATCH ? ORDER BY rank LIMIT 5",
                    (match,)).fetchall()
            except Exception:
                cands = []
        best_sim, best_id, best_title = 0.0, None, ''
        probe = content[:400]
        for eid, summ, cont in cands:
            tgt = clean((summ or '') + (cont or ''))[:800]
            if not tgt: continue
            sim = difflib.SequenceMatcher(None, probe[:300], tgt[:600]).ratio()
            if sim > best_sim:
                best_sim, best_id = sim, eid
                r = meta.execute('SELECT title FROM kb_formal WHERE entry_id=?', (eid,)).fetchone()
                best_title = (r[0] if r else '')[:60]
        if best_sim >= 0.75: verdict = '手稿印证'
        elif best_sim >= 0.35: verdict = '参照相关'
        else: verdict = '手稿独有'
        stat[{'手稿印证': '印证', '参照相关': '参照', '手稿独有': '独有'}[verdict]] += 1
        ledger.append({'idx': i, 'title': title[:60], 'module': e.get('module'), 'source': e.get('source'),
                       'verdict': verdict, 'sim': round(best_sim, 3),
                       'ref_entry': best_id, 'ref_title': best_title,
                       'audit_status': 'ok' if verdict == '手稿印证' else 'pending'})
        if (i + 1) % 200 == 0:
            print(f'  进度 {i+1}/{len(entries)} 印证{stat["印证"]} 参照{stat["参照"]} 独有{stat["独有"]}', flush=True)

    Path('reports').mkdir(exist_ok=True)
    with open(OUT + '.jsonl', 'w', encoding='utf-8') as f:
        for r in ledger:
            f.write(json.dumps(r, ensure_ascii=False) + '\n')
    # 汇总 MD
    V2S = {'手稿印证': '印证', '参照相关': '参照', '手稿独有': '独有'}
    bymod = {}
    for r in ledger:
        bymod.setdefault(r.get('module') or '?', {'印证': 0, '参照': 0, '独有': 0, '碎片跳过': 0})
        bymod[r.get('module') or '?'][V2S.get(r['verdict'], '碎片跳过')] += 1
    lines = [f'# 手稿对照台账 · {datetime.date.today()}', '',
             f'总量 {len(ledger)}：印证 {stat["印证"]} / 参照相关 {stat["参照"]} / 手稿独有 {stat["独有"]}', '',
             '| module | 印证 | 参照 | 独有 | 碎片跳过 |', '|---|---|---|---|---|']
    for m, s in sorted(bymod.items(), key=lambda x: -sum(x[1].values())):
        lines.append(f'| {m} | {s["印证"]} | {s["参照"]} | {s["独有"]} | {s["碎片跳过"]} |')
    lines += ['', '## 手稿独有样例（待入库候批，audit_status=pending）', '']
    uniq = [r for r in ledger if r['verdict'] == '手稿独有'][:10]
    for r in uniq:
        lines.append(f"- [{r['module']}] {r['title']}（{r['source']}）")
    open(OUT + '.md', 'w', encoding='utf-8').write('\n'.join(lines))
    print(f'== 完成：印证 {stat["印证"]} / 参照 {stat["参照"]} / 独有 {stat["独有"]} ==')
    print(f'台账：{OUT}.jsonl / {OUT}.md')
    con.close()

if __name__ == '__main__':
    main()
