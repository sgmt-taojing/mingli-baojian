#!/bin/bash
# g26-monthly-sop.sh · G26 命理知识补蒸馏 SOP 常态化（月度）
# R1 覆盖审计 → 有差集则 R2 补蒸馏 → R3 复扫 → 日志留痕；差集不清则非零退出（health-patrol 可捕）
set -uo pipefail
PROJ="/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian"
cd "$PROJ"
TS=$(date '+%F %T')
LOG="logs/g26-sop.log"
mkdir -p logs

echo "[$TS] ═══ G26 SOP 月度轮开始 ═══" >> "$LOG"

# R1
R1=$(/usr/bin/python3 scripts/g26-r1-coverage-audit.py 2>&1)
GAPS=$(/usr/bin/python3 -c "import sys,json,re; s='''$R1'''; m=re.search(r'\"gap_total\": (\d+)', s); print(m.group(1) if m else 'ERR')")
echo "[$TS] R1 差集=$GAPS" >> "$LOG"

if [ "$GAPS" = "ERR" ]; then
  echo "[$TS] R1 审计输出异常，终止" >> "$LOG"; exit 2
fi

if [ "$GAPS" != "0" ]; then
  # R2：密钥从 api-v2 plist 运行时读取（不落盘复制）
  export G2CLAW_API_KEY=$(/usr/libexec/PlistBuddy -c "Print :EnvironmentVariables:G2CLAW_API_KEY" \
    "$HOME/Library/LaunchAgents/com.mingli-baojian.api-v2.plist" 2>/dev/null)
  /usr/bin/python3 scripts/g26-r2-gap-distill.py --max-chunks 200 >> "$LOG" 2>&1
  # R3 复扫
  R3=$(/usr/bin/python3 scripts/g26-r1-coverage-audit.py 2>&1)
  GAPS3=$(/usr/bin/python3 -c "import re; m=re.search(r'\"gap_total\": (\d+)', '''$R3'''); print(m.group(1) if m else 'ERR')")
  echo "[$TS] R3 复扫差集=$GAPS3" >> "$LOG"
  [ "$GAPS3" != "0" ] && { echo "[$TS] 差集未收敛，需人工介入" >> "$LOG"; exit 1; }
  # 差集收敛后自动下发镜像（G21 纪律：知识增量走镜像通道）
  bash scripts/cron-distill-mingli-outbound.sh >> "$LOG" 2>&1
  echo "[$TS] 差集收敛，镜像已下发" >> "$LOG"
else
  echo "[$TS] 无差集，本轮仅审计" >> "$LOG"
fi
echo "[$TS] ═══ G26 SOP 月度轮完成 ═══" >> "$LOG"
exit 0
