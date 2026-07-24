#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════
# 静态 gzip 服务启动脚本（端口 8914）
# 规范: docs/STATIC_GZIP_SERVICE_v1.md (节点 5.2)
# ═══════════════════════════════════════════════════════
set -e

PORT="${PORT:-8914}"
STATIC_DIR="${STATIC_DIR:-/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/app}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PY="${PYTHON_BIN:-/Library/Developer/CommandLineTools/Library/Frameworks/Python3.framework/Versions/3.9/Resources/Python.app/Contents/MacOS/Python}"
LOG="${LOG_FILE:-/tmp/static-gzip.log}"
PLIST_LABEL="com.mingli-baojian.static-gzip"

# 1. 释放端口
echo "[start] 释放端口 $PORT ..."
PIDS=$(lsof -nP -iTCP:$PORT -sTCP:LISTEN -t 2>/dev/null || true)
if [ -n "$PIDS" ]; then
  echo "[start] 杀掉: $PIDS"
  echo "$PIDS" | xargs kill -9 2>/dev/null || true
  sleep 1
fi

# 2. 启动
echo "[start] 启动端口 $PORT (目录 $STATIC_DIR) ..."
cd "$SCRIPT_DIR"
nohup env PORT=$PORT STATIC_DIR=$STATIC_DIR "$PY" "$SCRIPT_DIR/static-gzip.py" > "$LOG" 2>&1 &
PID=$!
echo "[start] PID=$PID, 日志: $LOG"

# 3. 健康检查
sleep 2
if curl -sf -o /dev/null "http://127.0.0.1:$PORT/"; then
  echo "[ok] 静态服务已就绪 http://127.0.0.1:$PORT/"
  echo "[ok] 进程: PID=$PID"
  echo ""
  echo "=== 验收 ==="
  echo "1. Server 头:"
  curl -sI "http://127.0.0.1:$PORT/" | head -3
  echo "2. gzip:"
  curl -sI -H "Accept-Encoding: gzip" "http://127.0.0.1:$PORT/js/divination-core.js" | grep -E "Content-Encoding|Content-Length"
  echo "3. Range:"
  curl -s -H "Range: bytes=0-99" -D - -o /dev/null "http://127.0.0.1:$PORT/divination-hub.html" | head -5
  echo ""
  echo "[完成] 静态 gzip 服务运行中（PORT=$PORT, PID=$PID）"
  echo "[下一步] 配置 launchd: cp $SCRIPT_DIR/${PLIST_LABEL}.plist ~/Library/LaunchAgents/ && launchctl load ~/Library/LaunchAgents/${PLIST_LABEL}.plist"
else
  echo "[fail] 服务未响应，查看日志: tail $LOG"
  tail -20 "$LOG"
  exit 1
fi
