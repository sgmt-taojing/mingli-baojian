#!/bin/bash
# manuscript-ocr-batch.sh — MB-K1 OCR 批处理（26 份扫描件，全横排）
# 小件优先，大书殿后；页级缓存断点续跑；单实例锁。
set -u
cd "$(dirname "$0")/.."
PY="/Users/tom/Library/Application Support/kimi-desktop/daimon-share/daimon/runtime/python/.venv/bin/python3"
LOCK=".openclaw/tmp/manuscript-ocr.lock"
LOG="logs/manuscript-ocr.log"
mkdir -p logs .openclaw/tmp
if [ -f "$LOCK" ] && kill -0 "$(cat "$LOCK" 2>/dev/null)" 2>/dev/null; then
  echo "[$(date '+%F %T')] 已有 OCR 实例运行（pid $(cat "$LOCK")），退出" >> "$LOG"; exit 0
fi
echo $$ > "$LOCK"
trap 'rm -f "$LOCK"' EXIT

run() {
  echo "[$(date '+%F %T')] ══ OCR: $* ══" >> "$LOG"
  "$PY" scripts/manuscript-ocr.py --backend auto --names "$@" >> "$LOG" 2>&1
  echo "[$(date '+%F %T')] ══ 结束 rc=$? : $* ══" >> "$LOG"
}

# 第一梯队：流年班 9 份 + 天纪 4 份 + 紫微/玉匣记/一掌经/葬书
run "流年班不动产" "流年班健康疾病" "流年班分手离婚" "流年班合婚" "流年班开店成败" "流年班桃花" "流年班看学业" "流年班看盘步骤" "流年班职业规划"
run "天纪系列之天机道" "天纪人间道" "天纪 地脉道" "天机道（终稿）"
run "紫微斗数  上" "紫微斗数  下" "玉匣记" "一掌经" "图解葬书"
# 第二梯队：六部大书（3478 页）
run "术数全书" "御定六壬" "秘藏大六壬" "相术"
echo "[$(date '+%F %T')] OCR 全批完成" >> "$LOG"
