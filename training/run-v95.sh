#!/bin/bash
# v9.5 训练启动脚本：以 v9.2-fixed fused 为 base 增量训练
# 配方：v9.2 数据原样 1150 + 干支双向换算drills 300（尾挂不 shuffle，v9.1 教训）
# 教训：v9.1 shuffle 破坏关联 45.1%；v9.2 恢复 v9.0 数据 + 推理强化
cd /Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian

ADAPTER_DIR=training/mlx-checkpoints/mingli-sft-v92
rm -rf $ADAPTER_DIR
mkdir -p $ADAPTER_DIR

exec .venv-mlx/bin/python -u -m mlx_lm lora \
    --train \
    --model /Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/training/mlx-models/mingli-sft-v9.2-7b \
    --data training/mlx-r105-data-v95 \
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
