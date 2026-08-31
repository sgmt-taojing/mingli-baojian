#!/bin/bash
# absorb-activate-gate.sh — G18 吸收激活放行门（ADR-017）
# 用途：tcm 新能力移植进 medical-stack 后、声明「激活」前必跑。
# 流程：重启 8972 → 同案对拍（--gate absorb）→ PASS 才允许登记 KANBAN 激活；FAIL 即回滚不激活。
set -uo pipefail
BASE="/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian"
echo "[gate] 重启 medical-api(8972)…"
launchctl kickstart -k "gui/$(id -u)/com.mingli-baojian.medical-api" && sleep 4
echo "[gate] 同案对拍（端点零差异 + Recall@K 双侧差 ≤0.02）…"
/usr/bin/python3 "$BASE/scripts/equiv-dual-run.py" --gate absorb
RC=$?
if [ $RC -ne 0 ]; then
  echo "[gate] FAIL —— 按纪律回滚：git checkout 恢复 medical-stack 改动，不激活、不登记" >&2
  exit $RC
fi
echo "[gate] PASS —— 令牌已签发（30min 内可登记激活）"
