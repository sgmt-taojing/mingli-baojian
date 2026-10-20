#!/bin/bash
# manuscript-batch.sh — MB-K1 老板稿件全量提取批处理（launchd 驱动）
# 后端：auto（g2 有额度走 g2，耗尽自动降级 mlx 8960 慢跑）
# 按优先级组 1→6 顺序消化增量队列；幂等：有效回执自动跳过已完成材料
set -uo pipefail
PROJ="/Users/tom/kimi/projects/mingli-baojian"
PY="/Users/tom/Library/Application Support/kimi-desktop/daimon-share/daimon/runtime/python/.venv/bin/python3"
LOG="$PROJ/logs/manuscript-extract.log"
LOCK="$PROJ/.openclaw/tmp/manuscript-extract.lock"
TS=$(date "+%Y-%m-%d %H:%M:%S")

# 单实例防重
if [ -f "$LOCK" ] && kill -0 "$(cat "$LOCK" 2>/dev/null)" 2>/dev/null; then
    echo "[$TS] 已有实例在跑（pid $(cat "$LOCK")），退出" >> "$LOG"
    exit 0
fi
echo $$ > "$LOCK"
trap 'rm -f "$LOCK"' EXIT

cd "$PROJ"
for g in 1 2 3 4 5 6 7; do
    echo "[$(date '+%F %T')] ══ 组 G$g 开始 ══" >> "$LOG"
    "$PY" scripts/manuscript-extract.py --group "$g" --backend auto >> "$LOG" 2>&1
    echo "[$(date '+%F %T')] ══ 组 G$g 结束 rc=$? ══" >> "$LOG"
done
echo "[$(date '+%F %T')] 全组批处理完成" >> "$LOG"
