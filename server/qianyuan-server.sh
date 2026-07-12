#!/bin/bash
# 乾元命理宝鉴 HTTP 服务管理脚本
# 端口: 8901
# 目录: /Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian

PORT=8910
DIR="/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian"
PID_FILE="/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/.qianyuan-server.pid"
LOG_FILE="/tmp/qianyuan-server.log"

start() {
    if [ -f "$PID_FILE" ] && kill -0 "$(cat $PID_FILE)" 2>/dev/null; then
        echo "Server already running (PID: $(cat $PID_FILE))"
        return 0
    fi
    cd "$DIR" && nohup python3 -m http.server $PORT > "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"
    sleep 1
    if kill -0 "$(cat $PID_FILE)" 2>/dev/null; then
        echo "Server started on port $PORT (PID: $(cat $PID_FILE))"
    else
        echo "Failed to start server"
        return 1
    fi
}

stop() {
    if [ -f "$PID_FILE" ]; then
        kill "$(cat $PID_FILE)" 2>/dev/null
        rm -f "$PID_FILE"
        echo "Server stopped"
    else
        echo "Server not running"
    fi
}

status() {
    if [ -f "$PID_FILE" ] && kill -0 "$(cat $PID_FILE)" 2>/dev/null; then
        echo "Running (PID: $(cat $PID_FILE), Port: $PORT)"
    else
        echo "Not running"
    fi
}

case "$1" in
    start) start ;;
    stop) stop ;;
    restart) stop; sleep 1; start ;;
    status) status ;;
    *) echo "Usage: $0 {start|stop|restart|status}"; exit 1 ;;
esac
