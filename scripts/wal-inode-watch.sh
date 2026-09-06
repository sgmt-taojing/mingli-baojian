#!/bin/bash
# wal-inode-watch.sh — 分钟级 WAL inode 哨兵（R-WALF 取证层，2026-09-06）
# 背景：health-patrol 15 分钟粒度只能给「案发窗口」，无法锁定 unlink 方。
# 本哨兵每 60s 记录 yidao.db-wal inode 与 api-v2 pid，只在「变化」时落一行 JSONL，
# 案发即可秒级对撞 launchd 任务日志（tcm-import 等均有秒级时间戳）。
PROJECT_ROOT="/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian"
WAL="$PROJECT_ROOT/server/database/yidao.db-wal"
STATE_DIR="$PROJECT_ROOT/logs"
INODE_STATE="$STATE_DIR/.wal-inode-last"
PID_STATE="$STATE_DIR/.wal-watch-pid-last"
OUT="$STATE_DIR/wal-inode-watch.jsonl"
TS=$(date "+%Y-%m-%d %H:%M:%S")

CUR=$(stat -f '%i' "$WAL" 2>/dev/null || echo MISSING)
PID=$(pgrep -f 'api-server-v2.js' | head -1)
[ -z "$PID" ] && PID="none"

LAST_INODE=$(cat "$INODE_STATE" 2>/dev/null)
LAST_PID=$(cat "$PID_STATE" 2>/dev/null)

if [ -z "$LAST_INODE" ]; then
  echo "{\"ts\":\"$TS\",\"event\":\"init\",\"wal_inode\":\"$CUR\",\"api_pid\":\"$PID\"}" >> "$OUT"
elif [ "$CUR" != "$LAST_INODE" ]; then
  echo "{\"ts\":\"$TS\",\"event\":\"wal_inode_change\",\"from\":\"$LAST_INODE\",\"to\":\"$CUR\",\"api_pid\":\"$PID\"}" >> "$OUT"
fi
if [ -n "$LAST_PID" ] && [ "$PID" != "$LAST_PID" ]; then
  echo "{\"ts\":\"$TS\",\"event\":\"api_pid_change\",\"from\":\"$LAST_PID\",\"to\":\"$PID\",\"wal_inode\":\"$CUR\"}" >> "$OUT"
fi

echo "$CUR" > "$INODE_STATE"
echo "$PID" > "$PID_STATE"
