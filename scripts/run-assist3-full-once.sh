#!/bin/bash
# run-assist3-full-once.sh — new100 全量 181 题 noleak+assist3 净效果验证（R-BQA-ASSIST3-FULL）
set -uo pipefail
ROOT="/Users/tom/kimi/projects/mingli-baojian"
LABEL="com.mingli-baojian.baziqa-assist3-full"
cd "$ROOT" || exit 1
/usr/bin/python3 training/eval-baziqa.py --tag v92-noleak-assist3-new100 --noleak --assist3 \
  --save-raw training/baziqa-results/v92-noleak-assist3-new100-raw.jsonl \
  --data training/baziqa/data/celebrity-new100_zh.json
RC=$?
launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null
mv "$HOME/Library/LaunchAgents/$LABEL.plist" "$HOME/Library/LaunchAgents/$LABEL.plist.done-$(date +%Y%m%d)" 2>/dev/null
exit $RC
