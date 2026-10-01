#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""红线4 无出处条目 src_id 回填（R-KB-SRCID · 2026-10-01 Kimi）

按 docs/KB-QUALITY-RULES.md 二·出处五类映射，对 kb_formal 中 src_id 空且未打标
排除的 423 条回填 src_id。只动 src_id 元数据，不改内容；逐条审计留证
logs/kb-srcid-backfill-audit.jsonl。幂等：已回填的自动跳过。
用法：/usr/bin/python3 scripts/kb-srcid-backfill-20261001.py [--apply]
      默认干跑；--apply 落库
"""
import json, sqlite3, sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT / 'server' / 'database' / 'yidao.db'
AUDIT = ROOT / 'logs' / 'kb-srcid-backfill-audit.jsonl'

TCM = {'tcm-formula', 'tcm-herb', 'tcm-acupuncture'}
INTERNAL = {'wuxing', 'huajie', 'mantra', 'yangsheng', 'huangli', 'koujue-daily'}

def classify(mod, title, c100):
    if mod in TCM:
        return 'SRC-CLASSIC-FORMULARY'
    if '维基文库' in (c100 or '') or (title or '').startswith('原典·'):
        return 'SRC-PUBLIC-DOMAIN'
    if ('OCR' in (title or '')) or ('原典' in (title or '')):
        return 'SRC-CLASSIC-ORIGINAL'
    head = (c100 or '')[:100]
    if '来源：' in head or '出处：' in head:
        return 'SRC-AUTHOR-ANNOTATED'
    if mod in INTERNAL:
        return 'SRC-INTERNAL-AUTHORED'
    return None

def main():
    apply_ = '--apply' in sys.argv
    conn = sqlite3.connect(DB, timeout=60)
    conn.execute('PRAGMA busy_timeout=60000')
    rows = conn.execute("""SELECT rowid, module, title, substr(content,1,120) FROM kb_formal
        WHERE (src_id IS NULL OR src_id='')
        AND COALESCE(tags,'') NOT LIKE '%pseudo-citation%'""").fetchall()
    plan = []
    for rid, mod, title, c100 in rows:
        src = classify(mod, title, c100)
        if src:
            plan.append((rid, src, title))
    print(f'干跑：{len(rows)} 无出处 → 可映射 {len(plan)} / 未命中 {len(rows)-len(plan)}')
    if not apply_:
        print('（干跑模式，--apply 落库）')
        return 0
    n = 0
    with open(AUDIT, 'a', encoding='utf-8') as f:
        for rid, src, title in plan:
            conn.execute('UPDATE kb_formal SET src_id=? WHERE rowid=? AND (src_id IS NULL OR src_id=\'\')', (src, rid))
            n += 1
            f.write(json.dumps({'rowid': rid, 'src_id': src, 'title': (title or '')[:60],
                                'at': datetime.now().isoformat(timespec='seconds')},
                               ensure_ascii=False) + '\n')
    conn.commit()
    print(f'落库 {n} 条（审计 {AUDIT}）')
    print('注意：fts5 快照不含 src_id 字段，无需重灌索引')
    conn.close()
    return 0

if __name__ == '__main__':
    sys.exit(main())
