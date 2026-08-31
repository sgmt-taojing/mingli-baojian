#!/bin/bash
# tcm-import-and-follow.sh — 15min 轮询包装器（G1 · ADR-007 链3+链4 联动 + 二阶段链5 能力差集巡检）
# 1) import-tcm-kb.py：主镜像 → mingli 自有 yidao.db（链3，mtime 幂等）
# 2) medical-stack-kb-follow.py：主镜像 → medical-stack 内化快照（链4，mtime 幂等）
# 3) tcm-capability-diff.py：tcm 代码增量 → 四层差集巡检（链5，digest 幂等，差集不变不重写报告）
# 各脚本各自幂等，镜像/差集未变时秒退；有增量时先入自有库、再刷内化快照、再出差集报告。
set -uo pipefail
BASE="/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/scripts"
/usr/bin/python3 "$BASE/import-tcm-kb.py"
IMPORT_RC=$?
/usr/bin/python3 "$BASE/medical-stack-kb-follow.py"
FOLLOW_RC=$?
/usr/bin/python3 "$BASE/tcm-capability-diff.py"
DIFF_RC=$?
# 任一失败以非零退出，launchd 日志可查
[ $IMPORT_RC -eq 0 ] && [ $FOLLOW_RC -eq 0 ] && [ $DIFF_RC -eq 0 ]
