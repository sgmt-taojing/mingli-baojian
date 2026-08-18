#!/bin/bash
# v9.0 训练启动脚本（R739）：从 v8.7 fused 继续 LoRA 增量
# 数据：mlx-r105-data-v91（推理链:自由问答=1:1，去 AI 味）
cd /Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian
source .venv-mlx/bin/activate

ADAPTER_DIR=training/mlx-checkpoints/mingli-sft-v91
rm -rf $ADAPTER_DIR
mkdir -p $ADAPTER_DIR

exec python -u -m mlx_lm lora \
    --train \
    --model /Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/training/mlx-models/mingli-sft-v8.7-7b \
    --data training/mlx-r105-data-v91 \
    --fine-tune-type lora \
    --iters 300 \
    --batch-size 1 \
    --grad-accumulation-steps 4 \
    --learning-rate 5e-6 \
    --max-seq-length 1024 \
    --mask-prompt \
    --grad-checkpoint \
    --num-layers 20 \
    --adapter-path $ADAPTER_DIR \
    --save-every 50 \
    --steps-per-report 10 \
    --steps-per-eval 50 \
    --val-batches 20 \
    --seed 42
