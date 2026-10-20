#!/bin/bash
# api-v2 无响应看门狗：ping 连续 3 次超时（10s）→ kickstart 重启
# 背景：node:sqlite 同步驱动下个别未治理的 .all() 大查询会堵死事件循环，
# 根因逐个治理中，看门狗兜底保证服务可用性（2026-10-14）。
LOG="$HOME/kimi/projects/mingli-baojian/.openclaw/tmp/api-v2-watchdog.log"
FAIL_FILE="/tmp/mingli-8920-watchdog-fails"
fails=$(cat "$FAIL_FILE" 2>/dev/null || echo 0)
if curl -sS -m 10 -o /dev/null "http://127.0.0.1:8920/api/ping" 2>/dev/null; then
  [ "$fails" != "0" ] && echo "$(date '+%F %T') recovered after $fails fails" >> "$LOG"
  echo 0 > "$FAIL_FILE"
else
  fails=$((fails + 1))
  echo "$fails" > "$FAIL_FILE"
  echo "$(date '+%F %T') ping timeout ($fails/3)" >> "$LOG"
  if [ "$fails" -ge 3 ]; then
    echo "$(date '+%F %T') RESTART api-v2" >> "$LOG"
    launchctl kickstart -k "gui/$(id -u)/com.mingli-baojian.api-v2"
    echo 0 > "$FAIL_FILE"
  fi
fi
