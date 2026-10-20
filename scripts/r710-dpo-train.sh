#!/usr/bin/env bash
# R710: v6 DPO-SFT 训练（基于 v5 LoRA 继续微调 chosen-only）
# 829 train + 92 val, 250 iters @ batch 4 grad_accum 4 = effective batch 16
set -e
cd /Users/tom/kimi/projects/mingli-baojian

mkdir -p training/mlx-checkpoints/mingli-sft-v6 training/logs

echo "=== v6 DPO-SFT 训练（基于 v5 LoRA 继续微调 chosen-only）==="
echo "model: /Users/tom/.cache/qwen25-3b (3B)"
echo "data: data/mingli_dpo_sft (829 train / 92 val)"
echo "init adapter: training/mlx-checkpoints/mingli-sft-v5 (rank4 scale=4)"
echo "config: training/mlx_train_v6.yaml"
echo "output: training/mlx-checkpoints/mingli-sft-v6"
echo ""

VENV_PY=/Users/tom/kimi/projects/mingli-baojian/.venv-mlx/bin/python
$VENV_PY -m mlx_lm.lora \
  -c training/mlx_train_v6.yaml 2>&1 | tee training/logs/v6-dpo-sft.log

echo ""
echo "=== v6 训练完成 ==="
ls -la training/mlx-checkpoints/mingli-sft-v6/ 2>/dev/null | head -20