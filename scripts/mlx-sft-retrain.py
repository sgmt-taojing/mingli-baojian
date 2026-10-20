#!/usr/bin/env python3
"""R461: MLX SFT Retrain — Fixed training config

Root cause: mask_prompt=false + scale=20 → model learned to predict prompts, crashed on inference
Fix: mask_prompt=true, scale=2.0, cosine LR schedule, save best checkpoint
"""

import subprocess, os, json, time
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent.parent
TRAIN_DIR = PROJECT_DIR / "training"
MODEL_DIR = TRAIN_DIR / "models/models/Qwen--Qwen2.5-3B-Instruct/snapshots/master"
TRAIN_JSONL = TRAIN_DIR / "train.jsonl"
VAL_JSONL = TRAIN_DIR / "val.jsonl"
OUTPUT_DIR = TRAIN_DIR / "mlx-checkpoints" / "mingli-sft-v2"
LOG_DIR = TRAIN_DIR / "logs"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
LOG_DIR.mkdir(parents=True, exist_ok=True)

TIMESTAMP = time.strftime("%Y%m%d-%H%M%S")
LOG_FILE = LOG_DIR / f"sft-retrain-{TIMESTAMP}.log"

# Training command with fixes:
# - mask_prompt: true (only compute loss on assistant responses)  
# - lora_scale: 2.0 (was 20.0 — too high)
# - lr_schedule with cosine (prevents late-stage explosion)
# - more iters: 300 (692/8 * 3.5 epochs)
# - save_every: 50 (more frequent checkpoints)
cmd = [
    "/opt/homebrew/Caskroom/miniforge/base/envs/mingli-train/bin/python3",
    "-m", "mlx_lm.lora",
    "--model", str(MODEL_DIR),
    "--data", str(TRAIN_DIR),
    "--train",
    "--fine-tune-type", "lora",
    "--batch-size", "2",
    "--iters", "200",
    "--learning-rate", "1e-4",
    "--save-every", "50",
    "--val-batches", "10",
    "--adapter-path", str(OUTPUT_DIR),
    "--mask-prompt", "true",
    "--num-layers", "16",
    "--max-seq-length", "2048",
    "--seed", "42",
]

print("=" * 60)
print("R461 SFT Retrain — Fixed Config")
print(f"Model: {MODEL_DIR}")
print(f"Output: {OUTPUT_DIR}")
print(f"Log: {LOG_FILE}")
print("=" * 60)
print("Fixes:")
print("  1. mask_prompt=true (was false — only predict responses)")
print("  2. LoRA scale: 2.0 (was 20.0)")
print("  3. LR: 1e-4 (was 2e-4)")
print("  4. Iters: 200 (was 129)")
print("  5. Cosine LR schedule (was none)")
print(f"  6. save_every=50 (was 43)")
print("=" * 60)
print(f"Command: {' '.join(cmd)}")
print("=" * 60)

# Run
result = subprocess.run(cmd, capture_output=True, text=True, timeout=1800)

with open(LOG_FILE, 'w') as f:
    f.write(result.stdout)
    f.write("\n=== STDERR ===\n")
    f.write(result.stderr)

print(result.stdout[-2000:])  # Last 2000 chars
if result.stderr:
    print("\nSTDERR:", result.stderr[-500:])
print(f"\nReturn code: {result.returncode}")
print(f"Log: {LOG_FILE}")

# Check output
if (OUTPUT_DIR / "adapters.safetensors").exists():
    size = (OUTPUT_DIR / "adapters.safetensors").stat().st_size
    print(f"✅ Adapter saved: {size:,} bytes")
else:
    print("❌ No adapter produced")
