#!/bin/bash
# 易道智鉴服务器启动脚本
kill $(lsof -ti :8910) 2>/dev/null
sleep 1
cd "$(dirname "$0")"
python3 server.py &
echo "✅ 服务器已启动: http://127.0.0.1:8910/app/divination-hub.html"
