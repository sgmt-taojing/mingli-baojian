#!/bin/bash
# ═══════════════════════════════════════════════════════
# pipeline.sh — mingli-baojian 本地服务启动器（项目隔离版 2026-08-07）
#
# 用法: bash pipeline.sh [step]
#   all      - 启动本项目所有本地服务
#   capture  - 打开摄像头采集页
#   kb       - 打开 KB 知识图谱
#   status   - 查看各服务状态
#   stop     - 停止本项目服务
#   flow     - 打开全流程总览图
#
# ═══════════════════════════════════════════════════════
# 项目边界（永久生效）：
#   ✅ 本项目布控：已训练好的 ONNX 算法（ALG-070/071/072/080）
#   ❌ 本项目不做：训练/采集/标注/告警/EdgeBox/集成商
#   📂 训练采集归属：ai-vision-toolkit
#   📂 告警布控归属：video-ai-surveillance
# ═══════════════════════════════════════════════════════
set -euo pipefail

GREEN='\033[0;32m' BLUE='\033[0;34m' YELLOW='\033[1;33m' NC='\033[0m'

PROJ_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# 端口映射（本项目 + 推理端口）
declare -A PORTS=(
  [static]=8900   [api]=8920    [paipan]=8911
  [tts]=8912      [faceocr]=8913 [glass]=8914
  [messiah]=8930  [ollama]=11434
)

banner() {
  echo -e "\n${BLUE}════════════════════════════════════════${NC}"
  echo -e "${YELLOW}  $*${NC}"
  echo -e "${BLUE}════════════════════════════════════════${NC}"
}

check_port() {
  if lsof -ti:"$1" &>/dev/null; then
    echo -e "  ${GREEN}✓${NC} 端口 $1"
  else
    echo -e "  ${YELLOW}✗${NC} 端口 $1"
  fi
}

# ─── 启动 mingli-baojian 服务 ───
start_mingli() {
  banner "启动 mingli-baojian 服务"
  cd "$PROJ_DIR"

  # 静服 8900
  if ! lsof -ti:8900 &>/dev/null; then
    echo "  启动静服 :8900 ..."
    python3 -m http.server 8900 --directory app > /tmp/ml-static.log 2>&1 &
  fi

  # API 8920
  if ! lsof -ti:8920 &>/dev/null; then
    echo "  启动 API :8920 ..."
    node server/api-server-v2.js > /tmp/ml-api.log 2>&1 &
  fi

  # 排盘 8911
  if ! lsof -ti:8911 &>/dev/null; then
    echo "  启动 排盘 :8911 ..."
    python3 server/paipan.py > /tmp/ml-paipan.log 2>&1 &
  fi

  # TTS 8912
  if ! lsof -ti:8912 &>/dev/null; then
    echo "  启动 TTS :8912 ..."
    python3 server/edge-tts-server.py > /tmp/ml-tts.log 2>&1 &
  fi

  # face-ocr 8913 (推理部署)
  if ! lsof -ti:8913 &>/dev/null; then
    echo "  启动 face-ocr :8913 ..."
    python3 server/face-ocr-server.py > /tmp/ml-faceocr.log 2>&1 &
  fi

  # messiah 8930
  if ! lsof -ti:8930 &>/dev/null; then
    echo "  启动 messiah :8930 ..."
    python3 ../distillery/messiah.py --port 8930 > /tmp/ml-messiah.log 2>&1 &
  fi
}

# ─── 状态检查 ───
show_status() {
  banner "mingli-baojian 服务状态"
  for svc in static api paipan tts faceocr glass messiah ollama; do
    check_port "${PORTS[$svc]}"
  done
  echo ""
  echo -e "${GREEN}可用入口（本项目）:${NC}"
  echo "  📷 摄像头采集:  http://127.0.0.1:8900/camera-capture.html"
  echo "  🩺 临床问诊:    http://127.0.0.1:8900/clinic-consultation.html"
  echo "  🤖 AI 助手:     http://127.0.0.1:8900/ai-assistant.html"
  echo "  📡 布控中心:    http://127.0.0.1:8900/ai-deployment-center.html"
  echo "  📚 KB 图谱:     http://127.0.0.1:8900/kb-graph.html"
  echo "  🌿 TCM 辨证索引: http://127.0.0.1:8900/tcm-syndromes.html"
  echo ""
  echo -e "${YELLOW}归属说明:${NC}"
  echo "  ⚠️  采集/训练/标注 → ai-vision-toolkit"
  echo "  ⚠️  告警/布控指挥 → video-ai-surveillance"
  echo "  ✅  本项目 = 诊疗 + KB 辨证 + ONNX 推理部署"
}

# ─── 打开浏览器 ───
open_browser() {
  local url="$1"
  if command -v open &>/dev/null; then
    open "$url"
  elif command -v xdg-open &>/dev/null; then
    xdg-open "$url"
  fi
}

# ─── 停止 ───
stop_all() {
  banner "停止 mingli-baojian 服务"
  for port in 8900 8911 8912 8913 8914 8920 8930; do
    if lsof -ti:$port &>/dev/null; then
      kill $(lsof -ti:$port) 2>/dev/null && echo "  已停止 :$port"
    fi
  done
}

# ═══════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════
STEP="${1:-status}"

case "$STEP" in
  all)
    start_mingli
    show_status
    echo ""
    echo -e "${GREEN}✅ mingli-baojian 所有服务已启动。打开流程总览:${NC}"
    echo "   http://127.0.0.1:8900/../docs/PIPELINE_FLOWCHART.html"
    ;;

  capture)
    start_mingli
    echo "打开摄像头采集页..."
    open_browser "http://127.0.0.1:8900/camera-capture.html"
    ;;

  kb)
    start_mingli
    echo "打开 KB 知识图谱..."
    open_browser "http://127.0.0.1:8900/kb-graph.html"
    ;;

  status)
    show_status
    ;;

  stop)
    stop_all
    ;;

  flow)
    start_mingli
    echo "打开全流程总览图..."
    open_browser "$PROJ_DIR/docs/PIPELINE_FLOWCHART.html"
    ;;

  *)
    echo "用法: bash pipeline.sh [all|capture|kb|status|stop|flow]"
    echo ""
    echo "  all      - 启动本项目所有本地服务"
    echo "  capture  - 打开摄像头采集页"
    echo "  kb       - 打开 KB 知识图谱"
    echo "  status   - 查看各服务状态"
    echo "  stop     - 停止本项目服务"
    echo "  flow     - 打开全流程总览图"
    ;;
esac