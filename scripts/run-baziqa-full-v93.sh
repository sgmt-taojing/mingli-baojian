#!/bin/bash
# BaziQA 全量 488 题分段跑（v9.3 微调后全量复测（对照 v92-fixed 36.7%） · 2026-09-24）
# 5 段 × 10 人，段间隔离，逐人增量写盘；失败段可单独重跑（--offset N --limit 10）
set -u
cd "$(dirname "$0")/.."
TAG="v93-full"
LOG=training/baziqa-results/${TAG}-runner.log
echo "=== $(date '+%F %T') 全量开跑 ===" >> "$LOG"
for OFF in 0 10 20 30 40; do
  echo "--- $(date '+%F %T') 段 p$((OFF+1))-$((OFF+10)) 开始 ---" >> "$LOG"
  python3 training/eval-baziqa.py --tag "$TAG" --offset $OFF --limit 10 >> "$LOG" 2>&1
  echo "--- $(date '+%F %T') 段 p$((OFF+1))-$((OFF+10)) 结束 rc=$? ---" >> "$LOG"
done
echo "=== $(date '+%F %T') 全量完跑 ===" >> "$LOG"
