#!/bin/bash
# ui-smoke-daily.sh — 问诊台双轨 UI 回归 · 每日定时包装器
# launchd: com.mingli-baojian.ui-smoke-daily（每日 21:17）
# 通过静默；失败写日志 + macOS 通知提醒。
set -uo pipefail
PROJ="/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian"
NODE="/Applications/Kimi.app/Contents/Resources/resources/runtime/node"
LOG="$PROJ/logs/ui-smoke-daily.log"
mkdir -p "$PROJ/logs"
{
  echo "===== $(date '+%Y-%m-%d %H:%M:%S') UI 回归开始 ====="
  "$NODE" "$PROJ/scripts/ui-smoke-consultation.js"
  RC=$?
  echo "===== 退出码 $RC ====="
} >> "$LOG" 2>&1
# 日志保留最近 500 行
tail -500 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"
if [ $RC -ne 0 ]; then
  /usr/bin/osascript -e 'display notification "问诊台双轨 UI 回归失败，详见 logs/ui-smoke-daily.log" with title "命理宝鉴 · 回归告警" sound name "Basso"' 2>/dev/null || true
fi
exit $RC
