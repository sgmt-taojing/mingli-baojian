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
# R754 修真（2026-09-14）：rc=3 = 镜像写入后扫描窗口期 EPERM 优雅跳过，视为通过（下轮 mtime 幂等自动补）；
# 各步 rc 显式回显，结尾打印 CHAIN_RESULT 行供 launchd 日志/巡检取证。
set -uo pipefail
BASE="/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/scripts"
ok() { [ "$1" -eq 0 ] || [ "$1" -eq 3 ]; }
/usr/bin/python3 "$BASE/import-tcm-kb.py"
IMPORT_RC=$?
echo "[chain] import rc=$IMPORT_RC"
/usr/bin/python3 "$BASE/medical-stack-kb-follow.py"
FOLLOW_RC=$?
echo "[chain] follow rc=$FOLLOW_RC"
/usr/bin/python3 "$BASE/check-tcm-page-drift.py"
DRIFT_RC=$?
echo "[chain] drift rc=$DRIFT_RC"
/usr/bin/python3 "$BASE/reapply-patches.py"
PAGE_RC=$?
echo "[chain] page rc=$PAGE_RC"
/usr/bin/python3 "$BASE/sync-kb-assets.py"
ASSETS_RC=$?
echo "[chain] assets rc=$ASSETS_RC"
/usr/bin/python3 "$BASE/medical-stack-parity-check.py" --write-state
PARITY_RC=$?
echo "[chain] parity rc=$PARITY_RC"
/usr/bin/python3 "$BASE/tcm-capability-diff.py"
DIFF_RC=$?
echo "[chain] diff rc=$DIFF_RC"
FINAL=0
ok $IMPORT_RC || { echo "[chain] FAIL import rc=$IMPORT_RC"; FINAL=1; }
ok $FOLLOW_RC || { echo "[chain] FAIL follow rc=$FOLLOW_RC"; FINAL=1; }
ok $DRIFT_RC || { echo "[chain] FAIL drift rc=$DRIFT_RC"; FINAL=1; }
ok $PAGE_RC  || { echo "[chain] FAIL page rc=$PAGE_RC"; FINAL=1; }
ok $ASSETS_RC || { echo "[chain] FAIL assets rc=$ASSETS_RC"; FINAL=1; }
ok $PARITY_RC || { echo "[chain] FAIL parity rc=$PARITY_RC（移植保真破窗，当日处置）"; FINAL=1; }
ok $DIFF_RC  || { echo "[chain] FAIL diff rc=$DIFF_RC"; FINAL=1; }
echo "CHAIN_RESULT rc=$FINAL import=$IMPORT_RC follow=$FOLLOW_RC drift=$DRIFT_RC page=$PAGE_RC assets=$ASSETS_RC parity=$PARITY_RC diff=$DIFF_RC"
exit $FINAL
