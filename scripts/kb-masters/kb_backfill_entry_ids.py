# -*- coding: utf-8 -*-
"""kb_backfill_entry_ids.py — KB entry_id NULL 兜底修复（修真 R117 · 2026-08-28）
背景: 审计发现 401 条 tcm-syndrome 记录 entry_id=NULL，导致 FTS5 无法收录 → FTS5 不同步告警。
方案: 为 entry_id 为 NULL 且正文非空的记录，按全局最大 entry_id + rowid 偏移生成唯一 ID。
  - 偏移 = rowid - min(rowid of NULL set) + 1，保证确定性、幂等、无碰撞
  - 已有 entry_id 的记录一律不动
用法: python3 scripts/kb-masters/kb_backfill_entry_ids.py [--dry-run]
"""
import sqlite3, sys

DB = "/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/server/database/yidao.db"

def main():
    dry = "--dry-run" in sys.argv
    db = sqlite3.connect(DB)
    cur = db.cursor()

    # 1. 找 NULL 集合
    cur.execute("SELECT rowid FROM kb_formal WHERE entry_id IS NULL AND length(COALESCE(content,'')) > 0 ORDER BY rowid")
    rows = [r[0] for r in cur.fetchall()]
    if not rows:
        print("OK: 无 NULL entry_id 记录，无需修复")
        return

    # 2. 基准 ID
    cur.execute("SELECT MAX(CAST(entry_id AS INTEGER)) FROM kb_formal WHERE entry_id IS NOT NULL")
    base = cur.fetchone()[0] or 6574504246000000

    # 3. 生成确定性唯一 ID
    lo = rows[0]
    updates = [(str(base + (rid - lo) + 1), rid) for rid in rows]

    # 安全检查: 与现有 ID 无碰撞
    new_ids = [u[0] for u in updates]
    placeholders = ",".join("?" * len(new_ids))
    cur.execute(f"SELECT entry_id FROM kb_formal WHERE entry_id IN ({placeholders})", new_ids)
    clash = [r[0] for r in cur.fetchall()]
    if clash:
        print(f"ABORT: 生成 ID 与现有记录碰撞 {len(clash)} 个，需人工介入")
        sys.exit(1)

    if dry:
        print(f"[dry-run] 将修复 {len(updates)} 条: {new_ids[0]} .. {new_ids[-1]}")
        return

    cur.executemany("UPDATE kb_formal SET entry_id = ? WHERE rowid = ?", updates)
    db.commit()

    # 4. 同步 FTS5 增量
    cur.execute("SELECT COUNT(*) FROM kb_formal WHERE entry_id IS NULL")
    remain = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM kb_fts5")
    fts = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM kb_formal")
    total = cur.fetchone()[0]
    print(f"修复 {len(updates)} 条 | 剩余NULL={remain} | FTS5={fts}/{total}" + (" (FTS5 需重建，跑 full_kb_audit.py 自动触发)" if fts != total else " 已同步"))

if __name__ == "__main__":
    main()
