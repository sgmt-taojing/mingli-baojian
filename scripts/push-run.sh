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
EXTRA="${3:-}"  # R-PUSH-EVE：透传 --tomorrow 等附加参数（暮推=明日预告）
cd "$ROOT" || exit 1

case "$MODE" in
  public|simple)
    OUT=$("$NODE" daily_push.js "$MODE" $EXTRA 2>&1) ;;
  *)
    echo "[push-run] 未知模式: $MODE"; exit 1 ;;
esac
GEN_RC=$?

# P1-A（2026-09-26）：今晨 06:00 launchd 失败根因=bridge 在 KB 锁竞争时段静默失败。
# 生成失败时等 90s 重试一次（错开 KB 锁窗口），仍败才不外发。
if [ $GEN_RC -ne 0 ]; then
  echo "[push-run] 生成失败(rc=$GEN_RC)，90s 后重试一次…"
  sleep 90
  OUT=$("$NODE" daily_push.js "$MODE" $EXTRA 2>&1)
  GEN_RC=$?
fi

echo "$OUT"
if [ $GEN_RC -ne 0 ]; then
  echo "[push-run] 生成失败(rc=$GEN_RC)，不外发"
  exit $GEN_RC
fi
# 2026-09-26 裁判修：发送路径从 send-wecom.py（webhook 未配置→mock 落盘，从未真实外发）
# 改投 wecom-aibot daemon 的 push-queue（实测在线、09-25 起多条送达）。
# 分段纪律（ADR-027）：单段 ≤1800 字节（UTF-8），按行切分，段首标 (k/n)。
printf '%s\n' "$OUT" | "$PY" scripts/push-queue-enqueue.py --title "$TITLE"
