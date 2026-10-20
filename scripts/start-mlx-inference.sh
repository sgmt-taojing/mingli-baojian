#!/bin/bash
# =============================================================================
# R461: MLX 命理 SFT 推理服务启动脚本
# 端口: 8930
# 模型: Qwen2.5-3B-Instruct + LoRA (mingli-sft-v1-3b)
# =============================================================================

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CONDA_ENV="mingli-train"
PYTHON="/opt/homebrew/Caskroom/miniforge/base/envs/${CONDA_ENV}/bin/python"
LOG_DIR="$PROJECT_DIR/logs"
LOG_FILE="$LOG_DIR/mlx-inference.log"
PID_FILE="$LOG_DIR/mlx-inference.pid"
PORT=8930

# Ensure log directory exists
mkdir -p "$LOG_DIR"

echo "============================================"
echo "  MLX SFT Inference Server"
echo "  Model: mingli-sft-v1-3b"
echo "  Port:  $PORT"
echo "  Log:   $LOG_FILE"
echo "============================================"

# Check if already running
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE" 2>/dev/null || true)
    if [ -n "$OLD_PID" ] && kill -0 "$OLD_PID" 2>/dev/null; then
        echo "⚠️  Server already running (PID $OLD_PID)"
        echo "   To restart: kill $OLD_PID && rm $PID_FILE"
        exit 1
    fi
    rm -f "$PID_FILE"
fi

# Check if conda env exists
if [ ! -f "$PYTHON" ]; then
    echo "❌ Python not found at $PYTHON"
    exit 1
fi

# Check if model and adapter exist
MODEL_DIR="$PROJECT_DIR/training/models/models/Qwen--Qwen2.5-3B-Instruct/snapshots/master"
ADAPTER_DIR="$PROJECT_DIR/training/mlx-checkpoints/mingli-sft-v1-3b"

if [ ! -d "$MODEL_DIR" ]; then
    echo "❌ Model not found at $MODEL_DIR"
    exit 1
fi
if [ ! -f "$ADAPTER_DIR/adapters.safetensors" ]; then
    echo "❌ Adapter not found at $ADAPTER_DIR/adapters.safetensors"
    exit 1
fi

echo "✅ Model and adapter verified"

# Start server (redirect both stdout and stderr to log)
echo "🚀 Starting MLX inference server..."
nohup "$PYTHON" "$PROJECT_DIR/server/mlx-inference-server.py" \
    --host 127.0.0.1 \
    --port "$PORT" \
    >> "$LOG_FILE" 2>&1 &

SERVER_PID=$!
echo "$SERVER_PID" > "$PID_FILE"

echo "✅ Server started (PID: $SERVER_PID)"
echo "   Health check: curl http://127.0.0.1:$PORT/health"
echo "   Log: tail -f $LOG_FILE"

# Wait for server to be ready (poll health endpoint, timeout 120s)
echo "⏳ Waiting for server to be ready..."
MAX_WAIT=120
ELAPSED=0
while [ $ELAPSED -lt $MAX_WAIT ]; do
    if ! kill -0 "$SERVER_PID" 2>/dev/null; then
        echo "❌ Server process died during startup"
        echo "   Last 20 lines of log:"
        tail -20 "$LOG_FILE"
        exit 1
    fi

    if curl -s "http://127.0.0.1:$PORT/health" > /dev/null 2>&1; then
        echo "✅ Server is ready! ($ELAPSED seconds)"
        echo ""
        echo "Health response:"
        curl -s "http://127.0.0.1:$PORT/health" | python3 -m json.tool 2>/dev/null || true
        exit 0
    fi

    sleep 3
    ELAPSED=$((ELAPSED + 3))
    echo "   ... waiting (${ELAPSED}s/${MAX_WAIT}s)"
done

echo "❌ Server did not become ready within ${MAX_WAIT}s"
echo "   Last 20 lines of log:"
tail -20 "$LOG_FILE"
exit 1
