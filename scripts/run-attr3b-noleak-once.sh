#!/bin/bash
# run-attr3b-noleak-once.sh — dev36 禁史实声明复跑（R-BQA-NOLEAK 验证）
# bare 口径（同基线）+ --save-raw 落推理原文，供逐题逻辑断点分析
# 跑完自我卸载（与 run-shuffle-eval-once.sh 同一模式）
set -uo pipefail
ROOT="/Users/tom/kimi/projects/mingli-baojian"
LABEL="com.mingli-baojian.baziqa-attr3b"
cd "$ROOT" || exit 1
/usr/bin/python3 training/eval-baziqa.py --tag v92-attr3b-noleak-dev36 --noleak \
  --qids @training/baziqa-results/attr3-dev36-qids.txt \
  --save-raw training/baziqa-results/v92-attr3b-noleak-dev36-raw.jsonl \
  --data training/baziqa/data/celebrity-new100_zh.json
RC=$?
launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null
mv "$HOME/Library/LaunchAgents/$LABEL.plist" "$HOME/Library/LaunchAgents/$LABEL.plist.done-$(date +%Y%m%d)" 2>/dev/null
exit $RC
