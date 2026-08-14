#!/usr/bin/env bash
# MLX LoRA 训练守护脚本 v2（macOS 无 setsid）
# v2 修真（2026-08-14）：训练前必须先卸载 MLX inference 守护，独占 GPU
#   - launchd 的 com.mingli-baojian.mlx-v8 会 5s 内重新拉起 8960 inference server
#   - 两个 MLX 进程共抢 Metal GPU → 训练假死（0% CPU / 无日志推进）
#   - 本脚本：unload 守护 → 启动训练 → 训练完成后自动 load 恢复 inference
# 用法：bash scripts/run-mlx-train.sh [start|finish]
#   start  — 卸守护 + 启动训练（默认）
#   finish — 训练完成后：fuse + 重启 inference（需人工确认 adapter 已生成）
set -e
cd /Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian
source .venv-mlx/bin/activate
LOG=training/mlx-checkpoints/mingli-sft-v8-7b.train.log
PIDFILE=training/mlx-checkpoints/mingli-sft-v8-7b.train.pid
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
  # 2. 清理旧训练残留（上次训练中断的旧 adapter/日志）
  if [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
    echo "[guard] 旧训练进程 $(cat "$PIDFILE") 仍在，先杀"
    kill -TERM "$(cat "$PIDFILE")" 2>/dev/null || true
    sleep 3
  fi
  # 3. 启动训练（nohup + & + 完全 fd 重定向）
  : > "$LOG"
  nohup python -m mlx_lm.lora --config training/mlx_train_v8_7b.yaml \
    >"$LOG" 2>&1 < /dev/null &
  TPID=$!
  echo "$TPID" > "$PIDFILE"
  disown -h $TPID 2>/dev/null || true
  echo "[$(date '+%F %T')] TPID=$TPID launched, GPU 独占模式"
  exit 0
fi

if [ "$MODE" = "finish" ]; then
  echo "[finish] 训练完成，恢复 inference 守护"
  # A. fuse adapter 到 base（生成独立模型目录，供 inference server 加载）
  ADAPTER=training/mlx-checkpoints/mingli-sft-v8-7b
  FUSED=training/mlx-models/mingli-sft-v8.1-7b
  if [ -f "$ADAPTER/adapter_model.safetensors" ]; then
    echo "[finish] fusing $ADAPTER -> $FUSED"
    python -m mlx_lm.fuse --download-local-hub-model \
      --model /Users/tom/.cache/models/mlx-community--Qwen2.5-7B-Instruct-4bit/snapshots/master \
      --save-path "$FUSED" \
      --adapter-path "$ADAPTER"
    echo "[finish] fuse 完成 -> $FUSED"
  else
    weights_files=$(ls "$ADAPTER" 2>/dev/null | grep -c safetensors || true)
    echo "[finish][WARN] $ADAPTER 无 adapter_model.safetensors（$weights_files 个 safetensors），跳过 fuse"
    echo "[finish][WARN] inference server 将以 base 模型继续服务"
  fi
  # B. 重新加载 launchd 守护（inference server 自动重启并加载新模型）
  if [ -f "$PLIST" ]; then
    echo "[finish] reloading $PLIST"
    launchctl load "$PLIST"
    sleep 3
    if lsof -nP -iTCP:8960 -sTCP:LISTEN >/dev/null 2>&1; then
      echo "[finish] OK 8960 inference 已恢复"
    else
      echo "[finish] FAIL 8960 未恢复，手动检查：launchctl load $PLIST"
    fi
  fi
  echo "[$(date '+%F %T')] finish 流程完毕"
  exit 0
fi

echo "用法: bash scripts/run-mlx-train.sh [start|finish]"
exit 1