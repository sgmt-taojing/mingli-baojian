#!/bin/bash
# R104-W3: 一键启动/停止 5 个 ONNX 微服务
# 用法:
#   bash scripts/start-onnx-services.sh start   # 启动全部
#   bash scripts/start-onnx-services.sh stop    # 停止全部
#   bash scripts/start-onnx-services.sh status  # 查看状态
#   bash scripts/start-onnx-services.sh restart # 重启全部

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SVC_DIR="${PROJECT_DIR}/server/onnx-services"
PYTHON="/usr/bin/python3"
LOG_DIR="/tmp"

# 服务清单: name | file | port
SERVICES=(
  "face-diag-svc|face-diag-svc.py|8941"
  "tongue-diag-svc|tongue-diag-svc.py|8942"
  "eye-diag-svc|eye-diag-svc.py|8943"
  "hand-diag-svc|hand-diag-svc.py|8944"
  "vision-gateway-svc|vision-gateway-svc.py|8945"
)

start_service() {
  local name="$1" file="$2" port="$3"
  local pidfile="/tmp/onnx-${name}.pid"
  local logfile="${LOG_DIR}/onnx-${name}.log"

  # 检查端口是否已占用
  if lsof -i:"${port}" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "⚠️  ${name} (port ${port}) 已在运行，跳过"
    return 0
  fi

  echo "🚀 启动 ${name} (port ${port})..."
  cd "${SVC_DIR}"
  "${PYTHON}" "${file}" > "${logfile}" 2>&1 &
  local pid=$!
  echo "${pid}" > "${pidfile}"
  echo "   PID=${pid} → ${logfile}"

  # 等待服务就绪（最多 5 秒）
  for i in $(seq 1 10); do
    sleep 0.5
    if curl -sf "http://127.0.0.1:${port}/health" >/dev/null 2>&1; then
      echo "   ✅ 就绪"
      return 0
    fi
  done

  echo "   ❌ 启动超时（5s），检查日志: ${logfile}"
  return 1
}

stop_service() {
  local name="$1" port="$2"
  local pidfile="/tmp/onnx-${name}.pid"

  if [ -f "${pidfile}" ]; then
    local pid
    pid=$(cat "${pidfile}")
    if kill -0 "${pid}" 2>/dev/null; then
      echo "🛑 停止 ${name} (PID=${pid}, port=${port})"
      kill "${pid}" 2>/dev/null || true
    else
      echo "⚠️  ${name} PID=${pid} 已不存在"
    fi
    rm -f "${pidfile}"
  else
    # 尝试通过端口查找
    local pids
    pids=$(lsof -ti:"${port}" 2>/dev/null || true)
    if [ -n "${pids}" ]; then
      echo "🛑 停止 ${name} (通过端口 ${port}, PID=${pids})"
      kill ${pids} 2>/dev/null || true
    else
      echo "⚠️  ${name} 未在运行"
    fi
  fi
}

status_service() {
  local name="$1" port="$2"
  local health
  health=$(curl -sf "http://127.0.0.1:${port}/health" 2>/dev/null || echo "")
  if [ -n "${health}" ]; then
    local loaded onnx
    loaded=$(echo "${health}" | python3 -c "import sys,json;d=json.load(sys.stdin);print('loaded' if d.get('loaded') else 'lazy')" 2>/dev/null || echo "?")
    onnx=$(echo "${health}" | python3 -c "import sys,json;d=json.load(sys.stdin);print('✅' if d.get('onnx_available') else '❌')" 2>/dev/null || echo "?")
    echo "✅ ${name} :${port}  onnx=${onnx}  models=${loaded}"
  else
    echo "❌ ${name} :${port}  未运行"
  fi
}

case "${1:-start}" in
  start)
    echo "=========================================="
    echo "  ONNX 微服务启动 (5 services)"
    echo "=========================================="
    for svc in "${SERVICES[@]}"; do
      IFS='|' read -r name file port <<< "${svc}"
      start_service "${name}" "${file}" "${port}"
    done
    echo ""
    echo "=========================================="
    echo "  ✅ 全部启动完成"
    echo "=========================================="
    echo "  Gateway: http://127.0.0.1:8945"
    echo "  健康:    curl http://127.0.0.1:8945/health"
    echo "=========================================="
    ;;

  stop)
    echo "=========================================="
    echo "  ONNX 微服务停止 (5 services)"
    echo "=========================================="
    # 逆序停止（先停 gateway）
    for ((i=${#SERVICES[@]}-1; i>=0; i--)); do
      IFS='|' read -r name file port <<< "${SERVICES[$i]}"
      stop_service "${name}" "${port}"
    done
    echo "=========================================="
    echo "  ✅ 全部已停止"
    echo "=========================================="
    ;;

  status)
    echo "=========================================="
    echo "  ONNX 微服务状态"
    echo "=========================================="
    for svc in "${SERVICES[@]}"; do
      IFS='|' read -r name file port <<< "${svc}"
      status_service "${name}" "${port}"
    done
    echo "=========================================="
    ;;

  restart)
    "$0" stop
    sleep 2
    "$0" start
    ;;

  *)
    echo "用法: $0 {start|stop|status|restart}"
    exit 1
    ;;
esac
