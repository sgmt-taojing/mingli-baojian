#!/bin/bash
# tcm-import-and-follow.sh — 15min 轮询包装器（G1 · ADR-007 链3+链4 联动 + 二阶段链5 能力差集巡检）
# 1) import-tcm-kb.py：主镜像 → mingli 自有 yidao.db（链3，mtime 幂等）
# 2) medical-stack-kb-follow.py：主镜像 → medical-stack 内化快照（链4，mtime 幂等）
# 2a) check-tcm-page-drift.py：G18 防线——重放前漂移审计（疑似未补丁化本地改动 rc=2 告警）
# 2b) reapply-patches.py：tcm 页面增量 → 补丁重放（G18 废止整页重打包；锚点失配 WARN 转人工）
# 2c) medical-stack-parity-check.py：同案对拍 tcm×medical-stack（精准保障，FAIL 即破窗）
# 2d) sync-kb-assets.py：KB 数据资产自动吸收（L2.6 七资产哈希幂等，变更即重启 8972+冒烟）
# 3) tcm-capability-diff.py：tcm 代码增量 → 四层差集巡检（链5，digest 幂等，差集不变不重写报告）
# 各脚本各自幂等，镜像/差集未变时秒退；有增量时先入自有库、再刷内化快照与页面层、再出差集报告。
set -uo pipefail
BASE="/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/scripts"
/usr/bin/python3 "$BASE/import-tcm-kb.py"
IMPORT_RC=$?
/usr/bin/python3 "$BASE/medical-stack-kb-follow.py"
FOLLOW_RC=$?
# 2a) check-tcm-page-drift.py：G18 防线——重放前先审计漂移（疑似未补丁化本地改动 rc=2 告警转人工；台账 DELIVERY/patch-drift-<date>.json）
/usr/bin/python3 "$BASE/check-tcm-page-drift.py"
DRIFT_RC=$?
/usr/bin/python3 "$BASE/reapply-patches.py"
PAGE_RC=$?
# 2d) sync-kb-assets.py：KB 数据资产自动吸收（L2.6 七资产哈希幂等；变更即重启 8972 + 金案冒烟）
/usr/bin/python3 "$BASE/sync-kb-assets.py"
ASSETS_RC=$?
/usr/bin/python3 "$BASE/medical-stack-parity-check.py" --write-state
PARITY_RC=$?
/usr/bin/python3 "$BASE/tcm-capability-diff.py"
DIFF_RC=$?
# 任一失败以非零退出，launchd 日志可查（parity FAIL 即移植保真破窗，须当日处置）
[ $IMPORT_RC -eq 0 ] && [ $FOLLOW_RC -eq 0 ] && [ $DRIFT_RC -eq 0 ] && [ $PAGE_RC -eq 0 ] && [ $ASSETS_RC -eq 0 ] && [ $PARITY_RC -eq 0 ] && [ $DIFF_RC -eq 0 ]
