#!/bin/bash
# R104-W3: 安装 5 个 ONNX 微服务的 launchd plist
# 用法: bash scripts/install-onnx-services.sh [uninstall]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLIST_SRC="${SCRIPT_DIR}/launchd"
LAUNCHD_DIR="${HOME}/Library/LaunchAgents"

PLISTS=(
  "com.mingli-baojian.face-diag-svc.plist"
  "com.mingli-baojian.tongue-diag-svc.plist"
  "com.mingli-baojian.eye-diag-svc.plist"
  "com.mingli-baojian.hand-diag-svc.plist"
  "com.mingli-baojian.vision-gateway-svc.plist"
)

ACTION="${1:-install}"

case "${ACTION}" in
  install)
    mkdir -p "${LAUNCHD_DIR}"
    echo "=========================================="
    echo "  安装 ONNX 微服务 launchd 守护"
    echo "=========================================="
    # 启动顺序：先 4 个诊断服务，最后 gateway（依赖前 4 个）
    # 顺序启动以便依赖就绪
    for plist in "${PLISTS[@]}"; do
      src="${PLIST_SRC}/${plist}"
      dst="${LAUNCHD_DIR}/${plist}"
      if [ ! -f "${src}" ]; then
        echo "❌ 源文件不存在: ${src}"
        exit 1
      fi
      cp "${src}" "${dst}"
      # 先卸载（如果存在）
      launchctl unload "${dst}" 2>/dev/null || true
      # 启动依赖服务时，先单独启动以便就绪
      if [[ "${plist}" == *"vision-gateway"* ]]; then
        echo "⏳ 等待 3 秒让上游服务就绪..."
        sleep 3
      else
        sleep 1
      fi
      launchctl load -w "${dst}"
      echo "✅ ${plist} 已安装并启动"
    done
    echo "=========================================="
    echo "  ✅ 安装完成"
    echo "  查看状态: launchctl list | grep onnx"
    echo "  停止全部: bash scripts/start-onnx-services.sh stop"
    echo "=========================================="
    ;;

  uninstall)
    echo "=========================================="
    echo "  卸载 ONNX 微服务 launchd 守护"
    echo "=========================================="
    for plist in "${PLISTS[@]}"; do
      dst="${LAUNCHD_DIR}/${plist}"
      if [ -f "${dst}" ]; then
        launchctl unload "${dst}" 2>/dev/null || true
        rm -f "${dst}"
        echo "✅ ${plist} 已卸载"
      else
        echo "⚠️  ${plist} 未安装"
      fi
    done
    echo "=========================================="
    echo "  ✅ 卸载完成"
    echo "=========================================="
    ;;

  *)
    echo "用法: $0 [install|uninstall]"
    exit 1
    ;;
esac
