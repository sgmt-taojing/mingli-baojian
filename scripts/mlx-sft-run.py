#!/usr/bin/env python3
"""
R459: MLX SFT 实际训练执行脚本
使用 Qwen2.5-3B-Instruct（适配 M4 16GB 统一内存）
"""

import json
import os
import sys
import subprocess
import time
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent.parent
TRAIN_DIR = PROJECT_DIR / "training"
LOG_DIR = TRAIN_DIR / "logs"
CHECKPOINT_DIR = TRAIN_DIR / "mlx-checkpoints" / "mingli-sft-v1"

LOG_DIR.mkdir(parents=True, exist_ok=True)
CHECKPOINT_DIR.mkdir(parents=True, exist_ok=True)

# 使用 3B 模型（16GB 安全）
MODEL = "Qwen/Qwen2.5-3B-Instruct"
TRAIN_JSONL = TRAIN_DIR / "train.jsonl"
VAL_JSONL = TRAIN_DIR / "val.jsonl"

# 训练参数
BATCH_SIZE = 4
NUM_EPOCHS = 3
LR = 2e-4
LORA_R = 16
LORA_ALPHA = 32
LORA_DROPOUT = 0.05
MAX_SEQ = 2048
LOG_STEPS = 10

# 计算迭代数
with open(TRAIN_JSONL) as f:
    train_count = sum(1 for _ in f)
ITERS = train_count * NUM_EPOCHS // BATCH_SIZE
EVAL_STEPS = max(ITERS // 3, 10)

def main():
    print(f"🚀 R459 SFT 训练启动")
    print(f"模型: {MODEL}")
    print(f"训练数据: {TRAIN_JSONL} ({train_count} 条)")
    print(f"验证数据: {VAL_JSONL}")
    print(f"迭代数: {ITERS}")
    print(f"Batch: {BATCH_SIZE}, Epochs: {NUM_EPOCHS}, LR: {LR}")
    print(f"LoRA: r={LORA_R}, alpha={LORA_ALPHA}")
    print(f"输出: {CHECKPOINT_DIR}")
    print(f"预估时间: ~{ITERS * 2 / 60:.0f} 分钟")
    print("=" * 60)
    
    # 使用 YAML 配置文件（mlx-lm 0.31.3 参数格式）
    config_yaml = TRAIN_DIR / "mlx_train_config.yaml"
    
    cmd = [
        "/opt/homebrew/Caskroom/miniforge/base/envs/mingli-train/bin/python",
        "-m", "mlx_lm", "lora",
        "--config", str(config_yaml),
    ]
    
    log_file = LOG_DIR / f"sft-train-{time.strftime('%Y%m%d-%H%M%S')}.log"
    print(f"训练日志: {log_file}")
    print("=" * 60)
    
    # 启动训练
    start = time.time()
    with open(log_file, "w") as lf:
        lf.write(f"训练开始: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
        lf.write(f"命令: {' '.join(cmd)}\n")
        lf.write("=" * 60 + "\n")
        lf.flush()
        
        result = subprocess.run(
            cmd,
            stdout=lf,
            stderr=subprocess.STDOUT,
            timeout=1800,  # 30 分钟超时
        )
        
        elapsed = time.time() - start
        lf.write("\n" + "=" * 60 + "\n")
        lf.write(f"训练结束: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
        lf.write(f"耗时: {elapsed/60:.1f} 分钟\n")
        lf.write(f"返回码: {result.returncode}\n")
    
    print(f"\n✅ 训练完成，耗时 {elapsed/60:.1f} 分钟")
    print(f"日志: {log_file}")
    print(f"检查点: {CHECKPOINT_DIR}")
    
    # 检查输出
    adapters = list(CHECKPOINT_DIR.glob("*.npz"))
    if adapters:
        print(f"✅ LoRA 适配器: {[a.name for a in adapters]}")
    else:
        print("⚠️ 未找到 .npz 适配器文件，检查日志")
    
    return result.returncode

if __name__ == "__main__":
    sys.exit(main())
