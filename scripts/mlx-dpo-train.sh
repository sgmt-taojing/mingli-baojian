#!/bin/bash
# R460: DPO Training with MLX-LM LoRA
# Uses SFT adapter as base, trains DPO preference alignment on top

set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TRAIN_DIR="$PROJECT_DIR/training"
MODEL_NAME="Qwen/Qwen2.5-3B-Instruct"
SFT_ADAPTER="$TRAIN_DIR/mlx-checkpoints/mingli-sft-v1-3b/adapters.safetensors"
DPO_TRAIN="$TRAIN_DIR/dpo_train.jsonl"
DPO_VAL="$TRAIN_DIR/dpo_val.jsonl"
OUTPUT_DIR="$TRAIN_DIR/mlx-checkpoints/mingli-dpo-v1"
LOG_DIR="$TRAIN_DIR/logs"

mkdir -p "$OUTPUT_DIR" "$LOG_DIR"

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="$LOG_DIR/dpo-train-$TIMESTAMP.log"

echo "============================================" | tee "$LOG_FILE"
echo "R460 DPO Training" | tee -a "$LOG_FILE"
echo "Start: $(date)" | tee -a "$LOG_FILE"
echo "Model: $MODEL_NAME" | tee -a "$LOG_FILE"
echo "SFT Adapter: $SFT_ADAPTER" | tee -a "$LOG_FILE"
echo "DPO Train: $(wc -l < "$DPO_TRAIN") lines" | tee -a "$LOG_FILE"
echo "DPO Val: $(wc -l < "$DPO_VAL") lines" | tee -a "$LOG_FILE"
echo "Output: $OUTPUT_DIR" | tee -a "$LOG_FILE"
echo "============================================" | tee -a "$LOG_FILE"

# Use mlx_lm LoRA in DPO mode
/opt/homebrew/Caskroom/miniforge/base/envs/mingli-train/bin/python3 -m mlx_lm lora \
    --model "$MODEL_NAME" \
    --train \
    --data "$DPO_TRAIN" \
    --fine-tune-type lora \
    --batch-size 2 \
    --num-layers 16 \
    --iters 50 \
    --learning-rate 1e-4 \
    --save-every 10 \
    --val-batches 5 \
    --adapter-path "$SFT_ADAPTER" \
    --report-to "none" \
    2>&1 | tee -a "$LOG_FILE"

echo "============================================" | tee -a "$LOG_FILE"
echo "End: $(date)" | tee -a "$LOG_FILE"

# Copy final adapter
if [ -f adapters.safetensors ]; then
    cp adapters.safetensors "$OUTPUT_DIR/adapters.safetensors"
    cp adapter_config.json "$OUTPUT_DIR/adapter_config.json" 2>/dev/null || true
    echo "Adapters saved to $OUTPUT_DIR" | tee -a "$LOG_FILE"
fi
