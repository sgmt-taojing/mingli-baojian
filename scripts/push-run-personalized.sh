#!/bin/bash
# 信众个性化群发执行器（2026-09-28 · R-PUSH-P2）
# 用法: push-run-personalized.sh <模式:public> [标题] [--tomorrow]
# 行为: 遍历 data/subscribers.json 每个信众 → 按各自画像生成 → 定向入队（--to chatid）
# daemon（wecom-aibot）按 item.chatid 定向外发；未登记会话的信众自动跳过并告警。
set -o pipefail
export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
ROOT="/Users/tom/kimi/projects/mingli-baojian"
NODE="/Users/tom/.local/bin/node"
PY="/usr/bin/python3"
MODE="${1:-public}"
TITLE="${2:-命理宝鉴每日推送}"
EXTRA="${3:-}"
cd "$ROOT" || exit 1

CHATS="server/config/wecom-aibot-chats.local.json"
SUBS="data/subscribers.json"

# 信众清单：subscribers.json × 已登记会话 取交集
LIST=$("$PY" - <<'EOF'
import json
subs = json.load(open('data/subscribers.json', encoding='utf8')).get('subscribers', [])
try:
    chats = {c['chatid'] for c in json.load(open('server/config/wecom-aibot-chats.local.json', encoding='utf8')).get('chats', [])}
except Exception:
    chats = set()
for s in subs:
    cid = s.get('chatid', '')
    if cid and cid in chats:
        print(cid)
    elif cid:
        print(f"[personalized] 跳过未登记会话的信众: {cid}", flush=True)
EOF
)

if [ -z "$LIST" ]; then
  echo "[personalized] 无可送达信众，回退广播模式"
  exec bash scripts/push-run.sh "$MODE" "$TITLE" "$EXTRA"
fi

FAIL=0
while IFS= read -r CID; do
  case "$CID" in
    \[personalized\]*) echo "$CID"; continue ;;
  esac
  OUT=$("$NODE" daily_push.js "$MODE" --profile "$CID" $EXTRA 2>&1)
  GEN_RC=$?
  if [ $GEN_RC -ne 0 ]; then
    echo "[personalized] $CID 生成失败(rc=$GEN_RC)，90s 后重试一次…"
    sleep 90
    OUT=$("$NODE" daily_push.js "$MODE" --profile "$CID" $EXTRA 2>&1)
    GEN_RC=$?
  fi
  echo "════ 信众 $CID ════"
  echo "$OUT"
  if [ $GEN_RC -ne 0 ]; then
    echo "[personalized] $CID 生成失败，跳过不外发"
    FAIL=1
    continue
  fi
  printf '%s\n' "$OUT" | "$PY" scripts/push-queue-enqueue.py --title "$TITLE" --to "$CID" || FAIL=1
done <<< "$LIST"
exit $FAIL
