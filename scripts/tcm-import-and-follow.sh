#!/bin/bash
# tcm-import-and-follow.sh — 15min 轮询包装器（G1 · ADR-007 链3+链4 联动）
# 1) import-tcm-kb.py：主镜像 → mingli 自有 yidao.db（链3，mtime 幂等）
# 2) medical-stack-kb-follow.py：主镜像 → medical-stack 内化快照（链4，mtime 幂等）
# 两脚本各自幂等，镜像未变时均秒退；镜像更新时先入自有库、再刷内化快照。
set -uo pipefail
BASE="/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/scripts"
/usr/bin/python3 "$BASE/import-tcm-kb.py"
IMPORT_RC=$?
/usr/bin/python3 "$BASE/medical-stack-kb-follow.py"
FOLLOW_RC=$?
# 任一失败以非零退出，launchd 日志可查
[ $IMPORT_RC -eq 0 ] && [ $FOLLOW_RC -eq 0 ]
