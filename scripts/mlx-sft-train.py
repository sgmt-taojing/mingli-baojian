#!/usr/bin/env python3
"""
R458: MLX SFT 训练脚本（Mac M4 Apple Silicon）
使用 MLX-LM 框架对 Qwen2.5-7B-Instruct 进行 LoRA 微调

使用方法:
  conda activate mingli-train
  python scripts/mlx-sft-train.py

依赖:
  - mlx-lm >= 0.20
  - datasets
  - transformers (仅用于 tokenizer)
"""

import json
import os
import sys
import time
from pathlib import Path

# 路径配置
PROJECT_DIR = Path(__file__).resolve().parent.parent
SFT_TRAIN = PROJECT_DIR / "data" / "mingli_sft_train.json"
SFT_VAL = PROJECT_DIR / "data" / "mingli_sft_val.json"
CHECKPOINT_DIR = PROJECT_DIR / "training" / "mlx-checkpoints" / "mingli-sft-v1"
LOG_DIR = PROJECT_DIR / "training" / "logs"

# 训练超参数（对应设计文档 §3.2）
CONFIG = {
    "model": "Qwen/Qwen2.5-7B-Instruct",
    "train_file": str(SFT_TRAIN),
    "val_file": str(SFT_VAL),
    "output_dir": str(CHECKPOINT_DIR),
    "num_epochs": 3,
    "batch_size": 4,
    "gradient_accumulation_steps": 4,  # 有效 batch = 16
    "learning_rate": 2e-4,
    "warmup_ratio": 0.1,
    "lr_scheduler": "cosine",
    "max_seq_length": 2048,
    "lora_r": 16,
    "lora_alpha": 32,
    "lora_dropout": 0.05,
    "save_strategy": "epoch",
    "eval_strategy": "epoch",
    "logging_steps": 10,
}

def load_sft_data(path: str) -> list:
    """加载 SFT JSON 数据，转换为 MLX-LM 对话格式"""
    with open(path) as f:
        raw = json.load(f)
    
    samples = []
    for item in raw:
        messages = item.get("messages", [])
        if len(messages) < 2:
            continue
        # MLX-LM 期望格式: {"text": "..."} 或 {"messages": [...]}
        samples.append({"messages": messages})
    return samples

def validate_data(samples: list, name: str) -> bool:
    """验证数据格式"""
    if not samples:
        print(f"❌ {name}: 0 条数据")
        return False
    # 检查第一条
    first = samples[0]
    if "messages" not in first:
        print(f"❌ {name}: 缺少 messages 字段")
        return False
    msgs = first["messages"]
    roles = [m.get("role") for m in msgs]
    if "user" not in roles or "assistant" not in roles:
        print(f"❌ {name}: messages 缺少 user/assistant")
        return False
    print(f"✅ {name}: {len(samples)} 条数据，格式验证通过")
    return True

def main():
    print("=" * 60)
    print("R459: MLX SFT 训练 - 命理宝鉴")
    print("=" * 60)
    print(f"模型: {CONFIG['model']}")
    print(f"训练数据: {CONFIG['train_file']}")
    print(f"验证数据: {CONFIG['val_file']}")
    print(f"输出目录: {CONFIG['output_dir']}")
    print(f"Epochs: {CONFIG['num_epochs']}")
    print(f"有效 Batch Size: {CONFIG['batch_size'] * CONFIG['gradient_accumulation_steps']}")
    print(f"Learning Rate: {CONFIG['learning_rate']}")
    print(f"LoRA: r={CONFIG['lora_r']}, alpha={CONFIG['lora_alpha']}")
    print("=" * 60)
    
    # 1. 加载并验证数据
    print("\n[1/4] 加载训练数据...")
    train_data = load_sft_data(CONFIG["train_file"])
    val_data = load_sft_data(CONFIG["val_file"])
    
    if not validate_data(train_data, "train"):
        sys.exit(1)
    if not validate_data(val_data, "val"):
        sys.exit(1)
    
    # 2. 写入临时 JSONL（MLX-LM 可读取）
    print("\n[2/4] 准备 JSONL 数据文件...")
    train_jsonl = PROJECT_DIR / "training" / "train.jsonl"
    val_jsonl = PROJECT_DIR / "training" / "val.jsonl"
    
    with open(train_jsonl, "w") as f:
        for s in train_data:
            f.write(json.dumps(s, ensure_ascii=False) + "\n")
    with open(val_jsonl, "w") as f:
        for s in val_data:
            f.write(json.dumps(s, ensure_ascii=False) + "\n")
    
    print(f"  → {train_jsonl} ({len(train_data)} 条)")
    print(f"  → {val_jsonl} ({len(val_data)} 条)")
    
    # 3. 构造 MLX-LM 训练命令
    print("\n[3/4] 构造训练命令...")
    print("""
    训练命令（需在 mingli-train 环境中执行）:

    mlx_lm.lora \\
      --model {model} \\
      --train \\
      --data {data_dir} \\
      --fine-tune-type lora \\
      --batch-size {batch_size} \\
      --num-epochs {num_epochs} \\
      --learning-rate {lr} \\
      --lora-r {lora_r} \\
      --lora-alpha {lora_alpha} \\
      --lora-dropout {lora_dropout} \\
      --iters {iters} \\
      --steps-per-report {log_steps} \\
      --steps-per-eval {eval_steps} \\
      --save-path {output_dir} \\
      --max-seq-length {max_seq}

    """.format(
        model=CONFIG["model"],
        data_dir=str(PROJECT_DIR / "training"),
        batch_size=CONFIG["batch_size"],
        num_epochs=CONFIG["num_epochs"],
        lr=CONFIG["learning_rate"],
        lora_r=CONFIG["lora_r"],
        lora_alpha=CONFIG["lora_alpha"],
        lora_dropout=CONFIG["lora_dropout"],
        iters=len(train_data) * CONFIG["num_epochs"] // (CONFIG["batch_size"] * CONFIG["gradient_accumulation_steps"]),
        log_steps=CONFIG["logging_steps"],
        eval_steps=len(train_data) // (CONFIG["batch_size"] * 4),
        output_dir=CONFIG["output_dir"],
        max_seq=CONFIG["max_seq_length"],
    ))
    
    # 4. 输出预估
    print("[4/4] 训练预估:")
    # M4 统一内存 16GB，7B LoRA ~16GB 刚好够
    total_steps = len(train_data) * CONFIG["num_epochs"] // (CONFIG["batch_size"] * CONFIG["gradient_accumulation_steps"])
    est_time_per_step = 3.0  # M4 经验值 ~3s/step
    est_total_min = total_steps * est_time_per_step / 60
    print(f"  总步数: ~{total_steps}")
    print(f"  预估时间: ~{est_total_min:.0f} 分钟 ({est_total_min/60:.1f}h)")
    print(f"  显存需求: ~16GB (LoRA r=16)")
    print(f"  ⚠️ M4 16GB 统一内存可能不足，建议用 Qwen2.5-3B 或 QLoRA")
    
    # 写入配置文件供训练使用
    config_path = PROJECT_DIR / "training" / "mlx_train_config.json"
    with open(config_path, "w") as f:
        json.dump(CONFIG, f, indent=2, ensure_ascii=False)
    print(f"\n  → 配置已写入: {config_path}")
    
    print("\n✅ 训练准备完成，执行上述训练命令开始 SFT")
    print("⚠️ 注意: 首次运行会下载模型 (~15GB)，请确保网络和磁盘空间充足")

if __name__ == "__main__":
    main()
