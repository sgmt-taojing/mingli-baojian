#!/usr/bin/env python3
# mingtu_to_kb.py — 康节本卷四命图 JSONL → kb_formal（module=ziwei-mingtu, domain=mingli）
# trust：engine_check match 0.85 / mismatch 0.80（以图为准，差异注记保留）
import json, sqlite3, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from lib.kb_ingest import KBIngestor

ROOT = pathlib.Path(__file__).resolve().parent.parent
DB = ROOT / 'server/database/yidao.db'
JSONL = ROOT / 'training/mingtu/mingtu.jsonl'

def content_of(r):
    b = r['birth']
    parts = [
        f"【{r['title']}】{r['gender_yinyang']}，{b['gz_year']}年"
        f"{b.get('lunar_month','?')}月{b.get('lunar_day','?')}日{b.get('hour','?')}時生，{r['mingju']}。"
    ]
    if r.get('death'):
        d = r['death']
        parts.append(f"卒於{d.get('gz_year','?')}年，得年{d.get('age','?')}歲（{d.get('lunar','?')}）。")
    parts.append(f"斷語：{r['duanyu']}")
    if r.get('note'):
        parts.append(f"校注：{r['note']}")
    ec = r.get('engine_check', {})
    if ec.get('result') == 'mismatch':
        parts.append(f"復盘校記：{ec.get('note','')}")
    return '\n'.join(parts)

def main():
    conn = sqlite3.connect(str(DB))
    ing = KBIngestor(conn)
    skipped_mismatch = 0
    for line in JSONL.read_text(encoding='utf-8').splitlines():
        line = line.strip()
        if not line:
            continue
        r = json.loads(line)
        if r.get('_schema'):
            continue
        ec = r.get('engine_check', {})
        trust = 0.85 if ec.get('result') == 'match' else 0.80
        ok, why = ing.insert(
            entry_id=f"KJZW|ziwei-mingtu|卷四|{r['page']}|{r['pos']}",
            module='ziwei-mingtu',
            title=f"康节本卷四命图·{r['title']}（{r['page']}{r['pos']}）",
            content=content_of(r),
            category='ziwei-mingtu',
            keywords=f"紫微斗数,命图,{r['title']},{r['mingju']},{r['category']}",
            summary=r['duanyu'][:80],
            src_id=r['id'],
            tags=['紫微斗数', '命图', '康节本', '卷四', '校订本', r['category']],
            domain='mingli',
            trust=trust,
            source='kangjie-ziwei-n197-254',
        )
        if not ok and why != 'duplicate':
            print('FAIL', r['id'], why)
    ing.commit()
    print(ing.stats())
    conn.close()

if __name__ == '__main__':
    main()
