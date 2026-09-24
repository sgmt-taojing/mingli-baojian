#!/bin/bash
# 命理宝鉴推送执行器（2026-09-24 · 接管 Qclaw 微信推送 · 方案C 企业微信）
# 用法: push-run.sh <模式:public|simple> [标题]
# 行为: 生成内容 → stdout（launchd 捕获到既有日志）→ 管道进 send-wecom.py 外发
# 生成失败/内容为空时不外发；发送器未配置 webhook 时自动 mock 落盘 data/push-outbox/
set -o pipefail
export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
ROOT="/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian"
NODE="/Users/tom/.local/bin/node"
PY="/usr/bin/python3"
MODE="${1:-public}"
TITLE="${2:-命理宝鉴每日推送}"
cd "$ROOT" || exit 1

case "$MODE" in
  public|simple)
    OUT=$("$NODE" daily_push.js "$MODE" 2>&1) ;;
  *)
    echo "[push-run] 未知模式: $MODE"; exit 1 ;;
esac
GEN_RC=$?

echo "$OUT"
if [ $GEN_RC -ne 0 ]; then
  echo "[push-run] 生成失败(rc=$GEN_RC)，不外发"
  exit $GEN_RC
fi
printf '%s\n' "$OUT" | "$PY" scripts/send-wecom.py --title "$TITLE"
