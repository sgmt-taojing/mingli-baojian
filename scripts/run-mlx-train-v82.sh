#!/usr/bin/env bash
# MLX LoRA 训练守护脚本 — v8.2 专用（增量训练于 v8.1 fused）
# 用法：bash scripts/run-mlx-train-v82.sh [start|finish]
#   start  — 卸守护 + 启动训练（默认）
#   finish — fuse + 重启 inference 指向 v8.2 fused
set -e
cd /Users/tom/kimi/projects/mingli-baojian
source .venv-mlx/bin/activate
LOG=training/mlx-checkpoints/mingli-sft-v82-7b.train.log
PIDFILE=training/mlx-checkpoints/mingli-sft-v82-7b.train.pid
PLIST=~/Library/LaunchAgents/com.mingli-baojian.mlx-v8.plist
MODE="${1:-start}"

if [ "$MODE" = "start" ]; then
  # 1. 卸载 inference 守护（否则 GPU 被抢，训练假死）
  if launchctl list 2>/dev/null | grep -q "com.mingli-baojian.mlx-v8"; then
    echo "[guard] unload $PLIST"
    launchctl unload "$PLIST"
    sleep 2
    if lsof -nP -iTCP:8960 -sTCP:LISTEN >/dev/null 2>&1; then
      echo "[guard] 8960 仍被占用，强杀残留进程"
      lsof -nP -iTCP:8960 -sTCP:LISTEN -t | xargs kill -TERM 2>/dev/null || true
      sleep 3
    fi
  fi
  # 2. 清理旧训练残留
  if [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
    echo "[guard] 旧训练进程 $(cat "$PIDFILE") 仍在，先杀"
    kill -TERM "$(cat "$PIDFILE")" 2>/dev/null || true
    sleep 3
  fi
  # 3. 启动训练（v8.2 yaml）
  : > "$LOG"
  nohup python -m mlx_lm.lora --config training/mlx_train_v82.yaml \
    >"$LOG" 2>&1 < /dev/null &
  TPID=$!
  echo "$TPID" > "$PIDFILE"
  disown -h $TPID 2>/dev/null || true
  echo "[$(date '+%F %T')] v8.2 TPID=$TPID launched"
  echo "[$(date '+%F %T')] base = mingli-sft-v8.1-7b（v8.1 fused 之上增量）"
  exit 0
fi

if [ "$MODE" = "finish" ]; then
  echo "[finish] v8.2 训练完成，恢复 inference 守护（指向 v8.2 fused）"
  # A. fuse adapter 到 v8.1 fused base
  ADAPTER=training/mlx-checkpoints/mingli-sft-v82-7b
  FUSED=training/mlx-models/mingli-sft-v8.2-7b
  if [ -f "$ADAPTER/adapter_model.safetensors" ]; then
    echo "[finish] fusing $ADAPTER -> $FUSED"
    python -m mlx_lm.fuse --download-local-hub-model \
      --model /Users/tom/kimi/projects/mingli-baojian/training/mlx-models/mingli-sft-v8.1-7b \
      --save-path "$FUSED" \
      --adapter-path "$ADAPTER"
    echo "[finish] fuse 完成 -> $FUSED"
  else
    echo "[finish][WARN] $ADAPTER 无 adapter_model.safetensors，跳过 fuse"
  fi
  # B. 重新加载 launchd 守护
  if [ -f "$PLIST" ]; then
    echo "[finish] reloading $PLIST"
    launchctl load "$PLIST"
    sleep 3
    if lsof -nP -iTCP:8960 -sTCP:LISTEN >/dev/null 2>&1; then
      echo "[finish] OK 8960 inference 已恢复"
    else
      echo "[finish] FAIL 8960 未恢复，手动检查"
    fi
  fi
  echo "[$(date '+%F %T')] v8.2 finish 流程完毕"
  exit 0
fi

echo "用法: bash scripts/run-mlx-train-v82.sh [start|finish]"
exit 1