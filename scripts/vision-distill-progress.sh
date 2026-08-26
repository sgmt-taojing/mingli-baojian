#!/bin/bash
# vision-distill-progress.sh — 古籍视觉识别进度检查（纯脚本版，R749 替代 30min agentTurn cron）
# 原 cron「古籍识别进度检查（每30分钟）」为 LLM agentTurn，180s 超时连败；本脚本零 LLM。
LOG="/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/.openclaw/tmp/vision-distill-log.jsonl"
OUT="/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/.openclaw/tmp/vision-distill-progress.log"
TS=$(date '+%F %T')
if [ ! -f "$LOG" ]; then
  echo "[$TS] vision-distill-log.jsonl 不存在（识别未启动）" >> "$OUT"
  exit 0
fi
TOTAL=$(wc -l < "$LOG" | tr -d ' ')
LAST=$(tail -1 "$LOG" 2>/dev/null | python3 -c "import sys,json
try:
    d=json.loads(sys.stdin.read() or '{}')
    print(f\"last={d.get('key','')[:40]} status={d.get('status','')} ts={d.get('ts',d.get('time',''))}\")
except Exception: print('last=parse-error')" 2>/dev/null)
echo "[$TS] total=$TOTAL $LAST" >> "$OUT"
# 保留最近 2000 行
[ "$(wc -l < "$OUT" 2>/dev/null || echo 0)" -gt 2000 ] && tail -1000 "$OUT" > "$OUT.tmp" && mv "$OUT.tmp" "$OUT"
exit 0
