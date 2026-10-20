#!/bin/bash
# v8.1 训练后收尾：fuse adapter → 重启 MLX 推理 → 30 题评估
# 用法: bash scripts/v81-posttrain.sh
set -e

PROJ=/Users/tom/kimi/projects/mingli-baojian
CKPT=$PROJ/training/mlx-checkpoints/mingli-sft-v8-7b
FUSED=$PROJ/training/mlx-models/mingli-sft-v8.1-7b
BASE=/Users/tom/.cache/models/mlx-community--Qwen2.5-7B-Instruct-4bit/snapshots/master

cd "$PROJ"

# ── 1. 检查训练完成（iter 300 + adapter 权重存在）─────────────────
echo "══ 1. 检查训练状态 ══"
if [ ! -f "$CKPT/adapter_model.safetensors" ]; then
  echo "❌ adapter 权重不存在: $CKPT/adapter_model.safetensors"
  echo "   训练可能还没跑到 save_every (50)，或训练已崩"
  tail -5 "$CKPT.train.log" 2>/dev/null || true
  exit 1
fi
echo "✅ adapter 权重存在"

# ── 2. fuse adapter 到 base 模型 ─────────────────────────────
echo "══ 2. Fuse adapter → v8.1 模型 ══"
mkdir -p "$(dirname "$FUSED")"
if [ -d "$FUSED" ] && [ -f "$FUSED/config.json" ]; then
  echo "⚠️  $FUSED 已存在，先备份再重新 fuse"
  mv "$FUSED" "${FUSED}.bak.$(date +%H%M%S)"
fi
.venv-mlx/bin/python -m mlx_lm.fuse \
  --model "$BASE" \
  --adapter-path "$CKPT" \
  --save-path "$FUSED" 2>&1 | tail -5
echo "✅ fuse 完成: $FUSED"

# ── 3. 重启 MLX 推理服务（加载 v8.1）──────────────────────────
echo "══ 3. 重启 MLX 推理服务 → v8.1 ══"
# 杀掉旧 inference server
OLD_PID=$(lsof -ti tcp:8960 2>/dev/null || true)
if [ -n "$OLD_PID" ]; then
  echo "杀掉旧 inference server PID=$OLD_PID"
  kill "$OLD_PID" 2>/dev/null || true
  sleep 3
fi

# 启动新 server（加载 v8.1 模型）
MODEL_DIR="$FUSED" nohup .venv-mlx/bin/python scripts/mlx-inference-server.py \
  > /tmp/mlx-v81-server.log 2>&1 &
SERVER_PID=$!
echo "新 server PID=$SERVER_PID，等待启动..."
for i in $(seq 1 30); do
  sleep 2
  if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8960/v1/models | grep -q 200; then
    echo "✅ server 已启动 (等待 $((i*2))s)"
    break
  fi
done

# 验证确实加载 v8.1
MODELS_JSON=$(curl -s http://127.0.0.1:8960/v1/models 2>/dev/null || echo '{}')
echo "加载的模型: $MODELS_JSON" | head -2
if ! echo "$MODELS_JSON" | grep -q "v8"; then
  echo "⚠️  无法确认 v8.1 已加载，检查 /tmp/mlx-v81-server.log"
fi

# ── 4. 30 题评估（走 API 全链路）────────────────────────────────
echo "══ 4. 30 题评估 ══"
sleep 5
.venv-mlx/bin/python scripts/eval-v8-r718-30q.py v8.1-postR718 2>&1 | tail -15
mv -f eval-results-v8-r718-30q.json eval-results-v81-30q.json 2>/dev/null || true
echo ""
echo "═══════════════════════════════════════════"
echo "🎯 v8.1 全流程完成"
echo "   评估结果: $PROJ/training/eval-results-v81-30q.json"
echo "════════ restart 记录 ══════════"
# 推理服务由 launchd 不托管，手动启动，记录 PID
echo $SERVER_PID > /tmp/mlx-v81-server.pid
echo "server PID 已记录: /tmp/mlx-v81-server.pid"
