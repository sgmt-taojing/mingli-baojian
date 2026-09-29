#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""build-zw-zhuxing.py — 紫微全书卷一·諸星問答論 → 主星引证表

源：KB kb_formal《原典·紫微斗数全书·卷一》（维基文库公有领域本），
节标 ===問紫微所主若何？===（简繁混排）。解析 14 主星 + 辅星若干。
产出 server/data/zw-zhuxing.json：{"source":..., "table": {"紫微": {"title":..., "quote":...}}}
断言：14 主星齐全，每条 quote ≥ 30 字。原文不改写（仅去折行空白）。
"""
import json, os, re, sqlite3, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB = os.path.join(ROOT, 'server', 'database', 'yidao.db')
OUT = os.path.join(ROOT, 'server', 'data', 'zw-zhuxing.json')

MAIN14 = ['紫微','天机','太阳','武曲','天同','廉贞','天府','太阴','贪狼','巨门','天相','天梁','七杀','破军']
T2S = {'機':'机','陽':'阳','陰':'阴','殺':'杀','軍':'军','輔':'辅','問':'问','若何':'若何','為':'为','何':'何','貞':'贞','貪':'贪','門':'门','悪':'恶','論':'论','運':'运','存':'存','鉞':'钺','魁':'魁'}
def t2s(s):
    return ''.join(T2S.get(c, c) for c in s)

def main():
    db = sqlite3.connect(DB)
    row = db.execute("SELECT content FROM kb_formal WHERE title='原典·紫微斗数全书·卷一'").fetchone()
    db.close()
    if not row:
        print('[FATAL] KB 未找到卷一条目'); sys.exit(1)
    content = row[0]
    # 节切分
    parts = re.split(r'===\s*([^=]{2,30}?)\s*===', content)
    # parts[0] 前言；其后 标题/正文 交替
    secs = {}
    for i in range(1, len(parts) - 1, 2):
        secs[parts[i].strip()] = parts[i + 1]
    table = {}
    for title, body in secs.items():
        m = re.match(r'[问問](\S+?)(?:星)?所主[若如为若何為何]{2,4}？?', title)
        if not m:
            continue
        star = t2s(m.group(1))
        quote = re.sub(r'\s+', '', body).lstrip('=')
        if len(quote) < 30:
            print(f'  [WARN] {star} 节文过短 {len(quote)} 字，跳过')
            continue
        if star in table:  # 同名后出者合并
            table[star]['quote'] += quote
        else:
            table[star] = {'title': title, 'quote': quote}
    miss = [s for s in MAIN14 if s not in table]
    if miss:
        print(f'[FATAL] 主星缺失: {miss}；已解析: {sorted(table.keys())}')
        sys.exit(1)
    out = {
        'source': '紫微斗数全书·卷一·諸星問答論（维基文库公有领域本）',
        'note': '命宫主星→诸星问答论原文引证·原文未改写（仅去折行空白）',
        'built': '2026-09-29',
        'table': table,
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    json.dump(out, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    print(f'OK 星条={len(table)} 主星14/14 其余={[k for k in table if k not in MAIN14]}')
    print('抽查 紫微:', table['紫微']['quote'][:60])
    print('抽查 破军:', table['破军']['quote'][:60])

if __name__ == '__main__':
    main()
