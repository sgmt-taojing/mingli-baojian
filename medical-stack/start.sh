#!/bin/bash
# start.sh — 命理宝鉴·医学栈 一键启动（API :8972 + 静态 :8973 + 批注旁路 :8974）
# 依赖：NODE_PATH 复用 tcm-agent node_modules（express/better-sqlite3 等）
set -u
cd "$(dirname "$0")"
TCM_NODE=~/.openclaw-autoclaw/workspace/projects/tcm-agent/node_modules
LOG_DIR=data/logs
mkdir -p "$LOG_DIR"

start_one() { # name port-env port script
  local name="$1" envar="$2" port="$3" script="$4"
  if lsof -i ":$port" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "[skip] $name 已在 :$port 运行"
    return 0
  fi
  if [ ! -f "$script" ]; then
    echo "[miss] $script 不存在，跳过 $name"
    return 0
  fi
  NODE_PATH="$TCM_NODE" env "$envar=$port" nohup node "$script" > "$LOG_DIR/$name.log" 2>&1 &
  echo "[up] $name :$port pid=$!"
}

start_one medical-api    TCM_PORT 8972 server/api-server.js
start_one medical-static PORT     8973 server/static-server.js
start_one medical-extra  ML_EXTRA_PORT 8974 medical-extra.js

echo "---"
echo "健康检查："
sleep 4
curl -s -m 5 http://127.0.0.1:8972/api/tcm/health && echo
curl -s -m 5 -o /dev/null -w "static :8973 -> %{http_code}\n" http://127.0.0.1:8973/
curl -s -m 5 http://127.0.0.1:8974/api/annotation-queue 2>/dev/null | head -c 120 && echo
