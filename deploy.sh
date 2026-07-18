#!/bin/bash
# ═══ 命理宝鉴一键部署脚本 ═══
# 用法: ./deploy.sh [start|stop|restart|status|logs]

set -e
cd "$(dirname "$0")"

ACTION=${1:-start}

# 检查.env
if [ ! -f .env ]; then
    echo "📋 首次部署，从模板创建.env..."
    cp .env.example .env
    echo "⚠️  请编辑 .env 填入 API 密钥后重新运行"
    echo "   nano .env"
    exit 1
fi

# 检查docker
if ! command -v docker &> /dev/null; then
    echo "❌ 未安装Docker，请先安装:"
    echo "   curl -fsSL https://get.docker.com | sh"
    exit 1
fi

case $ACTION in
    start)
        echo "🚀 启动命理宝鉴..."
        docker-compose up -d --build
        echo ""
        echo "✅ 服务已启动！"
        echo "   📱 前端: http://localhost:8080/app/divination-hub.html"
        echo "   📱 移动端: http://localhost:8080/app/wechat-hub.html"
        echo "   🔌 AI API: http://localhost:8900"
        echo "   🔮 排盘: http://localhost:8911"
        echo "   🎤 TTS: http://localhost:8912"
        echo ""
        echo "   查看日志: ./deploy.sh logs"
        echo "   停止服务: ./deploy.sh stop"
        ;;
    stop)
        echo "🛑 停止命理宝鉴..."
        docker-compose down
        echo "✅ 已停止"
        ;;
    restart)
        echo "🔄 重启命理宝鉴..."
        docker-compose restart
        echo "✅ 已重启"
        ;;
    status)
        docker-compose ps
        ;;
    logs)
        SERVICE=${2:-web}
        docker-compose logs -f --tail=100 $SERVICE
        ;;
    *)
        echo "用法: $0 {start|stop|restart|status|logs [service]}"
        echo "  start  - 构建并启动所有服务"
        echo "  stop   - 停止所有服务"
        echo "  restart- 重启所有服务"
        echo "  status - 查看服务状态"
        echo "  logs   - 查看日志 (可指定服务名: web/api-proxy/paipan/tts)"
        exit 1
        ;;
esac
