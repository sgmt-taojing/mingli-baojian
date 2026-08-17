#!/usr/bin/env python3
"""
R119 医学 authority 标记更新（错峰执行脚本）
kb_formal: authority='tcm-agent-pending-migration' → 'tcm-agent-active'
分批 5000 条/批，短事务，容忍 api-server 写锁（timeout=15 重试 3 次）
幂等：已 active 的行不重复更新
"""
import sqlite3, sys, time

DB = '/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/server/database/yidao.db'
BATCH = 2000
MAX_RETRY = 3

def main():
    conn = sqlite3.connect(DB, timeout=15)
    conn.execute("PRAGMA busy_timeout = 15000")
    total = 0
    # R119 修真：渐进式 — 小批量 2000/批，总预算 90s，超时留给下一夜（cron 5 分钟窗口安全）
    import time as _t
    _budget_end = _t.time() + 90
    for batch_no in range(1, 200):
        if _t.time() > _budget_end:
            print(f"预算耗尽，本轮 {total} 条，剩余待下夜", flush=True)
            break
        for attempt in range(1, MAX_RETRY + 1):
            try:
                cur = conn.execute(
                    "UPDATE kb_formal SET authority='tcm-agent-active' "
                    "WHERE authority='tcm-agent-pending-migration' LIMIT ?", (BATCH,))
                conn.commit()
                n = cur.rowcount
                total += n
                print(f"批{batch_no}: +{n}（累计 {total}）", flush=True)
                if n == 0:
                    print(f"完成，共更新 {total} 条")
                    conn.close()
                    return 0
                break
            except sqlite3.OperationalError as e:
                if attempt == MAX_RETRY:
                    print(f"批{batch_no} 重试耗尽: {e}", file=sys.stderr)
                    conn.close()
                    return 1
                print(f"批{batch_no} 锁冲突，重试 {attempt}/{MAX_RETRY-1}...", flush=True)
                time.sleep(5 * attempt)
    print(f"达到批数上限，累计 {total} 条")
    conn.close()
    return 0

if __name__ == '__main__':
    sys.exit(main())
