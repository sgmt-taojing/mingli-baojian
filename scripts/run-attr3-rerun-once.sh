#!/bin/bash
# run-attr3-rerun-once.sh — 事件应期 36 道完全偏离错题定向复跑（R-BQA-ATTR3）
# bare 口径（同基线）+ --save-raw 落推理原文，供逐题逻辑断点分析
# 跑完自我卸载（与 run-shuffle-eval-once.sh 同一模式）
set -uo pipefail
ROOT="/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian"
LABEL="com.mingli-baojian.baziqa-attr3"
cd "$ROOT" || exit 1
/usr/bin/python3 training/eval-baziqa.py --tag v92-attr3-dev36 \
  --qids @training/baziqa-results/attr3-dev36-qids.txt \
  --save-raw training/baziqa-results/v92-attr3-dev36-raw.jsonl \
  --data training/baziqa/data/celebrity-new100_zh.json
RC=$?
launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null
mv "$HOME/Library/LaunchAgents/$LABEL.plist" "$HOME/Library/LaunchAgents/$LABEL.plist.done-$(date +%Y%m%d)" 2>/dev/null
exit $RC
