#!/bin/bash
# v9.2 训练启动脚本（R739 修真版）：以 v9.0 fused 为 base 增量训练
# 配方：v9.0 原始数据原样 + 错题辨析强化 225（排除法推理，不 shuffle）
# 教训：v9.1 shuffle 破坏关联 45.1%；v9.2 恢复 v9.0 数据 + 推理强化
cd /Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian
source .venv-mlx/bin/activate

ADAPTER_DIR=training/mlx-checkpoints/mingli-sft-v92
rm -rf $ADAPTER_DIR
mkdir -p $ADAPTER_DIR

exec python -u -m mlx_lm lora \
    --train \
    --model /Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/training/mlx-models/mingli-sft-v9.0-7b \
    --data training/mlx-r105-data-v92 \
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
