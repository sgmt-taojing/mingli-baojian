#!/bin/bash
# v95-gate-eval.sh — v9.5 候选双库验收门：masked(≥53.2%) → 488(≥36.7%)
cd "$(dirname "$0")/.."
PY=.venv-mlx/bin/python
LOG=logs/v95-gate.log
echo "[$(date '+%F %T')] 门1: masked 库评估" >> "$LOG"
BAZIQA_DATA=training/baziqa/data/celebrity-new60_zh.json "$PY" training/eval-baziqa-local.py \
  --model training/mlx-models/mingli-sft-v9.5-cand-7b --tag v95cand-masked --max-tokens 512 >> "$LOG" 2>&1
echo "[$(date '+%F %T')] 门2: 488 旧库评估" >> "$LOG"
"$PY" training/eval-baziqa-local.py \
  --model training/mlx-models/mingli-sft-v9.5-cand-7b --tag v95cand-488 --max-tokens 512 >> "$LOG" 2>&1
echo "[$(date '+%F %T')] 双库评估完成" >> "$LOG"
