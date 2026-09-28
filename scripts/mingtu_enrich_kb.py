#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""古今命图·命宫重建反哺 KB（2026-09-28）
读取 mingtu.jsonl 的 computed 字段，把命宫主星/复盘五行局追加进
kb_formal（module=ziwei-mingtu）既有条目的 content/keywords，
并同步重算指纹（与 R-INGEST-SPEC-20260927 指纹口径一致）。
幂等：已含「命宫重建」行的条目跳过。
用法：python3 scripts/mingtu_enrich_kb.py [--dry]
"""
import json, sqlite3, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from lib.kb_ingest import fingerprint_of

ROOT = Path(__file__).parent.parent
DB = ROOT / 'server' / 'database' / 'yidao.db'
JSONL = ROOT / 'training' / 'mingtu' / 'mingtu.jsonl'
DRY = '--dry' in sys.argv
POS_MAP = {'r': '右', 'l': '左'}

def main():
    conn = sqlite3.connect(str(DB))
    c = conn.cursor()
    updated = skipped = missing = 0
    for line in JSONL.read_text(encoding='utf-8').splitlines():
        if not line.strip():
            continue
        rec = json.loads(line)
        if rec.get('_schema'):
            continue
        comp = rec.get('computed')
        if not comp:
            continue
        pos = POS_MAP.get(rec['id'].rsplit('-', 1)[-1], '')
        eid = f"KJZW|ziwei-mingtu|卷四|{rec['page']}|{pos}"
        row = c.execute("SELECT content, keywords FROM kb_formal WHERE entry_id=?", (eid,)).fetchone()
        if not row:
            missing += 1
            print('  ✗ 未找到条目:', eid)
            continue
        content, keywords = row
        if '命宫重建' in content:
            skipped += 1
            continue
        stars = comp.get('mingStars') or []
        star_txt = '、'.join(stars) if stars else '无主星（借对宫论）'
        agree = '与原著相合' if comp.get('mingjuAgree') else f"原著作{rec.get('mingju','?')}"
        note = f"；{comp['note']}" if comp.get('note') else ''
        add = (f"\n命宫重建：命宫在{comp.get('mingGongZhi','?')}（{comp.get('mingGongGanZhi','?')}），"
               f"主星{star_txt}；生辰复盘{comp.get('computedMingju','?')}（{agree}，iztro 生辰复盘{note}）。")
        new_content = content + add
        kw = keywords or ''
        for s in stars + ['命宫' + (comp.get('mingGongZhi') or '')]:
            if s and s not in kw:
                kw += ',' + s
        fp = fingerprint_of(new_content)
        if not DRY:
            c.execute("UPDATE kb_formal SET content=?, keywords=?, fingerprint=?, updated_at=CURRENT_TIMESTAMP WHERE entry_id=?",
                      (new_content, kw, fp, eid))
        updated += 1
    if not DRY:
        conn.commit()
        try:
            c.execute("INSERT INTO kb_formal_fts(kb_formal_fts) VALUES('rebuild')")
            conn.commit()
        except Exception as e:
            print('FTS rebuild 失败:', e)
    conn.close()
    print(f'反哺 {updated} 条（跳过已反哺 {skipped}，缺条目 {missing}）{"（DRY）" if DRY else ""}')

if __name__ == '__main__':
    main()
