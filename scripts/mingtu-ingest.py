#!/usr/bin/env python3
"""mingtu-ingest.py — 把 mingtu-replay 的十二宫复盘布局写回 kb_formal（幂等）

- 99 条局对拍相合：标「与原著对拍相合」，trust_score→0.9
- 14 条局不符：标「校勘存疑」（含节气月替代解若有），trust_score→0.7
- 1 条生辰残缺（闕名）：不动
- 已含「十二宫复盘」块的条目先剥旧块再追加，保证幂等
"""
import json, re, sqlite3, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REPORT = ROOT / 'training' / 'mingtu-replay' / 'replay-report-2026-10-10.json'
DB = ROOT / 'server' / 'database' / 'yidao.db'

BLOCK_RE = re.compile(r'\n*【十二宫复盘布局】[\s\S]*?(?=\n【|$)')

def build_block(r):
    lines = []
    if r['ju_ok']:
        lines.append('【十二宫复盘布局】（iztro 引擎生辰复盘，五行局与原著对拍相合）')
    else:
        note = f"校勘存疑：原书作{r['ju_book']}，通行法复盘作{r['ju_replay']}"
        if r.get('alt'):
            a = r['alt']
            m = '月-1' if a['month_delta'] == -1 else '月+1'
            note += (f"；按{m}（节气月安命）复盘得{a['ju']}·命宫{a['mg_gz']}·{a['stars']}，"
                     f"与原书相合——此例康节本或以节气月安命")
        else:
            note += '，月±1 亦未合，疑原书刻误或安星流派差异'
        lines.append(f'【十二宫复盘布局】（{note}。下列为通行法复盘布局）')
    palaces = sorted(r['palaces'], key=lambda p: (not p['isMingGong'],))
    for p in palaces:
        stars = '、'.join(p['mainStars'] + p['auxStars'] + p['evilStars']) or '（无主星）'
        tag = '（身宫同此）' if p['isShenGong'] and p['isMingGong'] else ('（身宫）' if p['isShenGong'] else '')
        mark = '◎' if p['isMingGong'] else '·'
        lines.append(f"{mark}{p['name']} {p['ganZhi']}：{stars}{tag}")
    return '\n' + '\n'.join(lines)

def main():
    report = json.loads(REPORT.read_text(encoding='utf-8'))
    db = sqlite3.connect(DB)
    n_ok = n_suspect = n_skip = 0
    with db:
        for r in report['results']:
            if r.get('skipped') or r.get('error'):
                n_skip += 1
                continue
            row = db.execute("SELECT content FROM kb_formal WHERE entry_id=?", (r['entry_id'],)).fetchone()
            if not row:
                print('!! 条目不存在:', r['entry_id']); continue
            content = BLOCK_RE.sub('', row[0] or '')
            content += build_block(r)
            trust = 0.9 if r['ju_ok'] else 0.7
            db.execute("UPDATE kb_formal SET content=?, trust_score=?, updated_at=datetime('now','localtime') WHERE entry_id=?",
                       (content, trust, r['entry_id']))
            if r['ju_ok']: n_ok += 1
            else: n_suspect += 1
    print(f'入库完成: 对拍相合 {n_ok} 条(trust 0.9) | 校勘存疑 {n_suspect} 条(trust 0.7) | 跳过 {n_skip} 条')
    db.close()

if __name__ == '__main__':
    main()
