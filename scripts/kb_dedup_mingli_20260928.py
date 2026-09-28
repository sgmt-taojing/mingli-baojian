#!/usr/bin/env python3
"""命理域 KB 收敛：真实重复合并 + 旧粗指纹回填 sha16。
留证：DELIVERY/kb-dedup-audit-20260928.jsonl
"""
import sqlite3, hashlib, json, datetime, os, sys

ROOT = "/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian"
DB = f"{ROOT}/server/database/yidao.db"
AUDIT = f"{ROOT}/DELIVERY/kb-dedup-audit-20260928.jsonl"

LOSERS = ["KB-KR-f741a38b75", "kb-taiyi-卷07-005"]  # 保留 KR|fengshui|宅經|宅經|7ac60ab8 与 kb-yzh-zhaijing-xia-004

con = sqlite3.connect(DB)
con.row_factory = sqlite3.Row
now = datetime.datetime.now().isoformat(timespec="seconds")

# 1) 留证：loser 全行 + winner 摘要
with open(AUDIT, "w", encoding="utf-8") as f:
    for eid in LOSERS:
        r = con.execute("SELECT * FROM kb_formal WHERE entry_id=?", (eid,)).fetchone()
        if r:
            f.write(json.dumps({"action": "delete", "reason": "content-dup-merge",
                                "at": now, "row": dict(r)}, ensure_ascii=False) + "\n")
    for eid in ["KR|fengshui|宅經|宅經|7ac60ab8", "kb-yzh-zhaijing-xia-004"]:
        r = con.execute("SELECT entry_id,module,title,trust_score,created_at FROM kb_formal WHERE entry_id=?", (eid,)).fetchone()
        if r:
            f.write(json.dumps({"action": "keep", "at": now, "row": dict(r)}, ensure_ascii=False) + "\n")

# 2) 删除 loser（kb_fts5_delete 触发器自动清索引）
cur = con.execute("BEGIN")
for eid in LOSERS:
    con.execute("DELETE FROM kb_formal WHERE entry_id=?", (eid,))

# 3) 回填：domain='mingli' 且指纹非 sha16 的行 → sha256(content)[:16]
rows = con.execute("""SELECT entry_id, content FROM kb_formal
                      WHERE domain='mingli' AND (fingerprint IS NULL OR length(fingerprint)!=16
                      OR fingerprint GLOB '*[^0-9a-f]*')""").fetchall()
updated = 0
for r in rows:
    c = r["content"] or ""
    if isinstance(c, bytes):
        c = c.decode("utf-8", errors="replace")
    fp = hashlib.sha256(c.encode("utf-8")).hexdigest()[:16]
    con.execute("UPDATE kb_formal SET fingerprint=?, updated_at=? WHERE entry_id=?", (fp, now, r["entry_id"]))
    updated += 1
con.commit()

# 4) 验证
dup = con.execute("""SELECT COUNT(*) FROM (SELECT content FROM kb_formal WHERE domain='mingli'
                     GROUP BY content HAVING COUNT(*)>1)""").fetchone()[0]
legacy_left = con.execute("""SELECT COUNT(*) FROM kb_formal WHERE domain='mingli'
                             AND (fingerprint IS NULL OR length(fingerprint)!=16
                             OR fingerprint GLOB '*[^0-9a-f]*')""").fetchone()[0]
collision = con.execute("""SELECT COUNT(*) FROM (
    SELECT fingerprint FROM kb_formal WHERE domain='mingli' AND fingerprint IS NOT NULL
    GROUP BY fingerprint HAVING COUNT(DISTINCT content)>1)""").fetchone()[0]
total_mingli = con.execute("SELECT COUNT(*) FROM kb_formal WHERE domain='mingli'").fetchone()[0]
print(json.dumps({"deleted": len(LOSERS), "fp_backfilled": updated,
                  "mingli_total": total_mingli, "mingli_content_dups": dup,
                  "mingli_legacy_fp_left": legacy_left, "mingli_fp_collisions": collision,
                  "audit_file": AUDIT}, ensure_ascii=False, indent=1))
con.close()
