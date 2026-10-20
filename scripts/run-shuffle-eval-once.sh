#!/bin/bash
# run-shuffle-eval-once.sh — v92-shuffle-new100 一次性全量复跑（R-BQA-DEBIAS 验证）
# 跑完自我卸载（launchd 无原生一次性日历任务，wrapper 兜底防重复执行）
set -uo pipefail
ROOT="/Users/tom/kimi/projects/mingli-baojian"
LABEL="com.mingli-baojian.baziqa-shuffle"
cd "$ROOT" || exit 1
# 双连跑：①纯乱序（量化 A 锚定） ②乱序+干支辅助（生产仿真·推理层净实力）
/usr/bin/python3 training/eval-baziqa.py --tag v92-shuffle-new100 --shuffle \
  --data training/baziqa/data/celebrity-new100_zh.json
RC=$?
/usr/bin/python3 training/eval-baziqa.py --tag v92-shuffle-assist-new100 --shuffle --assist \
  --data training/baziqa/data/celebrity-new100_zh.json
RC2=$?
launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null
mv "$HOME/Library/LaunchAgents/$LABEL.plist" "$HOME/Library/LaunchAgents/$LABEL.plist.done-$(date +%Y%m%d)" 2>/dev/null
exit $((RC != 0 ? RC : RC2))
