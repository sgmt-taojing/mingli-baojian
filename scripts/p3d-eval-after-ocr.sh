#!/bin/bash
# p3d-eval-after-ocr.sh — OCR 批跑结束后自动跑 P3-D 新题库评估（v9.4 基线，v9.5 路线依据）
set -u
cd "$(dirname "$0")/.."
LOCK=".openclaw/tmp/manuscript-ocr.lock"
LOG="logs/p3d-eval.log"
echo "[$(date '+%F %T')] 等待 OCR 批跑结束..." >> "$LOG"
for i in $(seq 1 720); do  # 最长等 6h
  if [ ! -f "$LOCK" ] || ! kill -0 "$(cat "$LOCK" 2>/dev/null)" 2>/dev/null; then
    break
  fi
  sleep 30
done
echo "[$(date '+%F %T')] OCR 已收口，启动 v9.4 × 新题库评估" >> "$LOG"
PY="$(cd "$(dirname "$0")/.." && pwd)/.venv-mlx/bin/python"
BAZIQA_DATA="$PWD/training/baziqa/data/celebrity-new60_zh.json" \
  "$PY" training/eval-baziqa-local.py \
  --model training/mlx-models/mingli-sft-v9.2-7b \
  --tag v92prod-masked --max-tokens 512 >> "$LOG" 2>&1
echo "[$(date '+%F %T')] 评估结束 rc=$?" >> "$LOG"
