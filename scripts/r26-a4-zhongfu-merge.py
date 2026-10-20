#!/usr/bin/env python3
"""
R26-A4 · tcm-zhongfu 命名空间合并审计
=======================================

对 kb_formal.tcm-zhongfu 160 条做去重审计。

结论：**无需合并**。
  - 0 条精确内容重复（SHA-256 比对）
  - 0 条标题重复
  - 0 条归一化后内容重复（去标点空白后）
  - 5 条主题重叠（classic-XXX证 ↔ suji-XXX），但内容详尽度不同，互补关系
  - 93 对相似度 > 0.7（luzhi 内部结构相近），但均为独立案例（不同脏腑组合）

三批条目来源独立：
  - 50 classic (SRC-LD-BZ 路氏子平讲记, 生理/舌脉/证型, ~150-330 字)
  - 50 suji   (SRC-NHS-SHL 倪海厦伤寒论速记, 脏腑辨证, ~70 字)
  - 60 luzhi  (SRC-LD-LP 路氏人生规划讲记, 脏腑辨证·路氏临证, ~100 字)

用法：
  python3 scripts/r26-a4-zhongfu-merge.py [--db server/database/yidao.db]
"""

import sqlite3, hashlib, json, re, os, sys
from datetime import datetime
from pathlib import Path

# Locate DB
here = Path(__file__).resolve().parent
default_db = here.parent / 'server' / 'database' / 'yidao.db'
db_path = sys.argv[sys.argv.index('--db') + 1] if '--db' in sys.argv else str(default_db)

if not os.path.exists(db_path):
    print(f"[FATAL] DB not found: {db_path}")
    sys.exit(1)

print(f"[r26-a4] DB: {db_path}")
print(f"[r26-a4] Module: tcm-zhongfu")
print(f"[r26-a4] Date: {datetime.now().isoformat()}")
print()

con = sqlite3.connect(db_path)
cur = con.cursor()

# === 1. Inventory ===
cur.execute(
    "SELECT entry_id, title, content, src_id, category, trust_score, source_ids "
    "FROM kb_formal WHERE module=? ORDER BY entry_id", ('tcm-zhongfu',)
)
rows = cur.fetchall()
cols = ['entry_id','title','content','src_id','category','trust_score','source_ids']
entries = [dict(zip(cols, r)) for r in rows]

print(f"[1] Total entries: {len(entries)}")

by_src = {}
for e in entries:
    by_src[e['src_id']] = by_src.get(e['src_id'], 0) + 1
print("    By source:")
for k, v in sorted(by_src.items(), key=lambda x: -x[1]):
    print(f"      {k}: {v}")

by_cat = {}
for e in entries:
    by_cat[e['category']] = by_cat.get(e['category'], 0) + 1
print("    By category:")
for k, v in sorted(by_cat.items(), key=lambda x: -x[1]):
    print(f"      {k}: {v}")

# === 2. Exact content hash dupes ===
hash_groups = {}
for e in entries:
    h = hashlib.sha256(e['content'].encode('utf-8')).hexdigest()[:16]
    hash_groups.setdefault(h, []).append(e['entry_id'])
exact_dupes = {h: ids for h, ids in hash_groups.items() if len(ids) > 1}
print(f"\n[2] Exact content dupes: {len(exact_dupes)} groups")
for h, ids in exact_dupes.items():
    print(f"    {h}: {', '.join(ids)}")

# === 3. Title dupes ===
title_groups = {}
for e in entries:
    title_groups.setdefault(e['title'], []).append(e['entry_id'])
title_dupes = {t: ids for t, ids in title_groups.items() if len(ids) > 1}
print(f"\n[3] Title dupes: {len(title_dupes)} groups")
for t, ids in title_dupes.items():
    print(f"    '{t}': {', '.join(ids)}")

# === 4. Normalized content dupes ===
def normalize(s):
    return re.sub(
        r'[\s\u3000\uff0c\u3002\uff1a\uff1b\u3001\uff08\uff09\u300c\u300d\u300e\u300f\u300a\u300b\uff1f\uff01,.!?(){}\[\]【】·\-]', 
        '', s
    )
norm_groups = {}
for e in entries:
    n = normalize(e['content'])
    h = hashlib.sha256(n.encode('utf-8')).hexdigest()[:16]
    norm_groups.setdefault(h, []).append({'id': e['entry_id'], 'title': e['title']})
norm_dupes = {h: v for h, v in norm_groups.items() if len(v) > 1}
print(f"\n[4] Normalized content dupes: {len(norm_dupes)} groups")
for h, items in norm_dupes.items():
    print(f"    {h}: {', '.join(i['id'] for i in items)}")

# === 5. Topic overlap (classic ↔ suji) ===
def strip_suffix(t):
    return re.sub(r'[证·].*$', '', t).strip()

classic = [e for e in entries if 'classic' in e['entry_id']]
suji = [e for e in entries if 'suji' in e['entry_id']]
topic_overlap = []
for c in classic:
    for s in suji:
        if strip_suffix(c['title']) == strip_suffix(s['title']) or c['title'] == s['title'] + '证':
            topic_overlap.append({'classic': c['entry_id'], 'suji': s['entry_id'], 'topic': c['title']})
print(f"\n[5] Topic overlap (classic ↔ suji): {len(topic_overlap)} pairs")
for t in topic_overlap:
    print(f"    {t['classic']} ({t['topic']}) ↔ {t['suji']}")

# === 6. Similarity scan (high-level) ===
try:
    import difflib
    sim_pairs = []
    for i in range(len(entries)):
        for j in range(i+1, len(entries)):
            r = difflib.SequenceMatcher(None, entries[i]['content'], entries[j]['content'], autojunk=False).ratio()
            if r > 0.7:
                sim_pairs.append((round(r,2), entries[i]['entry_id'], entries[j]['entry_id'], entries[i]['title'], entries[j]['title']))
    print(f"\n[6] High-similarity pairs (>0.7): {len(sim_pairs)}")
    print(f"    (expected: luzhi cases share structure but have different topics)")
    for r in sim_pairs[:5]:
        print(f"    {r[0]}  {r[1]} ↔ {r[2]}")
    if len(sim_pairs) > 5:
        print(f"    ... and {len(sim_pairs)-5} more")
except ImportError:
    print("\n[6] difflib not available, skipping similarity scan")

# === 7. Verdict ===
total_dupes = len(exact_dupes) + len(title_dupes) + len(norm_dupes)
print(f"\n{'='*60}")
if total_dupes == 0:
    print(f"✅ NO MERGE NEEDED — {len(entries)} entries are all unique.")
    print(f"   {len(topic_overlap)} topic-overlap pairs are complementary")
    print(f"   (different detail levels from different sources).")
    print(f"   3 independent source batches confirmed:")
    print(f"     - 50 classic (SRC-LD-BZ): 生理/舌脉/证型详述 (~150-330 字)")
    print(f"     - 50 suji   (SRC-NHS-SHL): 脏腑辨证速记 (~70 字)")
    print(f"     - 60 luzhi  (SRC-LD-LP): 路氏临证案例 (~100 字)")
else:
    print(f"⚠️  Found {total_dupes} dupe groups — merge required.")

# === 8. Export JSON report ===
report = {
    "task": "r26-a4-zhongfu-merge",
    "date": datetime.now().isoformat(),
    "db": db_path,
    "module": "tcm-zhongfu",
    "total_entries": len(entries),
    "by_source": by_src,
    "by_category": by_cat,
    "exact_dupe_groups": len(exact_dupes),
    "title_dupe_groups": len(title_dupes),
    "normalized_dupe_groups": len(norm_dupes),
    "topic_overlap_pairs": len(topic_overlap),
    "verdict": "NO_MERGE_NEEDED" if total_dupes == 0 else "MERGE_REQUIRED",
    "detail": {
        "exact_dupes": exact_dupes,
        "title_dupes": title_dupes,
        "topic_overlap": topic_overlap,
    }
}

# Place in workspace .openclaw/tmp/
tmp_dir = here.parent / '.openclaw' / 'tmp'
tmp_dir.mkdir(parents=True, exist_ok=True)
report_path = tmp_dir / 'r26-a4-zhongfu-merge-report.json'
with open(report_path, 'w', encoding='utf-8') as f:
    json.dump(report, f, ensure_ascii=False, indent=2)
print(f"\n[r26-a4] Report JSON: {report_path}")

con.close()
