#!/usr/bin/env python3
"""quarantine 桶：general 模块 260 条乱码隔离（ADR-024 补遗裁决申请配套脚本）

用法：
  python3 scripts/kb_quarantine_general.py            # dry-run 预览（默认，不写库）
  python3 scripts/kb_quarantine_general.py --apply    # 批复后执行

动作：general 模块空域标乱码行 → kb_quarantine（reason 标注）+ kb_formal 删除
留证：DELIVERY/kb-quarantine-general-<时间戳>.jsonl（全行留证，kb_quarantine.content 存整行 JSON）
先例：09-18 R51 测试数据隔离（kb_quarantine 现存 27 条）
"""
import sqlite3, json, datetime, sys

ROOT = "/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian"
DB = f"{ROOT}/server/database/yidao.db"
APPLY = "--apply" in sys.argv
REASON = "乱码入库-二进制碎片无知识价值-20260928审计"

con = sqlite3.connect(DB)
con.row_factory = sqlite3.Row
rows = con.execute(
    "SELECT * FROM kb_formal WHERE module='general' AND (domain IS NULL OR domain='')").fetchall()

print(f"{'APPLY' if APPLY else 'DRY-RUN'} · general 空域标命中 {len(rows)} 条")
for r in rows[:5]:
    print("  样例:", r["entry_id"], repr((r["title"] or "")[:40]))

if APPLY:
    ts = datetime.datetime.now()
    now = ts.strftime("%Y-%m-%d %H:%M:%S")
    audit = f"{ROOT}/DELIVERY/kb-quarantine-general-{ts.strftime('%Y%m%d-%H%M%S')}.jsonl"
    n = 0
    with open(audit, "w", encoding="utf-8") as f:
        for r in rows:
            d = dict(r)
            for k, v in d.items():  # bytes → utf-8 兜底
                if isinstance(v, bytes):
                    d[k] = v.decode("utf-8", errors="replace")
            f.write(json.dumps({"action": "quarantine", "row": d, "at": now}, ensure_ascii=False) + "\n")
            con.execute(
                "INSERT OR REPLACE INTO kb_quarantine (entry_id, reason, quarantined_at, content) VALUES (?,?,?,?)",
                (r["entry_id"], REASON, now, json.dumps(d, ensure_ascii=False)))
            con.execute("DELETE FROM kb_formal WHERE entry_id=?", (r["entry_id"],))
            n += 1
    con.commit()
    left = con.execute("SELECT COUNT(*) FROM kb_formal WHERE module='general' AND (domain IS NULL OR domain='')").fetchone()[0]
    quar = con.execute("SELECT COUNT(*) FROM kb_quarantine WHERE reason=?", (REASON,)).fetchone()[0]
    print(json.dumps({"quarantined": n, "left_in_formal": left,
                      "in_quarantine_table": quar, "audit": audit}, ensure_ascii=False, indent=1))
else:
    print("\n确认无误后执行：python3 scripts/kb_quarantine_general.py --apply")
con.close()
