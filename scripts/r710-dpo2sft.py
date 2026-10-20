#!/usr/bin/env python3
"""
R710: 把 DPO 对转成 SFT 数据，让 MLX 内置 LoRA 训练。
策略：只学 chosen，prompt 前置一个【优质回答示例】前缀让模型感知。
"""
import json
from pathlib import Path

BASE = Path('/Users/tom/kimi/projects/mingli-baojian')
TRAIN_IN = BASE / 'training/dpo_train.jsonl'
VAL_IN = BASE / 'training/dpo_val.jsonl'
TRAIN_OUT = BASE / 'data/mingli_dpo_sft_train.jsonl'
VAL_OUT = BASE / 'data/mingli_dpo_sft_val.jsonl'

def to_chatml(prompt, chosen):
    """转 ChatML 格式给 MLX 训练"""
    return {
        "messages": [
            {"role": "user", "content": prompt},
            {"role": "assistant", "content": chosen}
        ]
    }

def convert(in_path, out_path):
    n_ok = 0
    n_skip = 0
    with open(in_path) as fin, open(out_path, 'w') as fout:
        for line in fin:
            try:
                item = json.loads(line)
                prompt = item.get('prompt', '').strip()
                chosen_raw = item.get('chosen', '')
                if isinstance(chosen_raw, dict):
                    chosen = chosen_raw.get('content', '').strip()
                else:
                    chosen = chosen_raw.strip()
                if not prompt or not chosen:
                    n_skip += 1
                    continue
                # prompt 转为 ChatML（含学习指令前缀，让模型感知"知识库精确回答"）
                enhanced_prompt = (
                    f"【知识库精确回答模式】请依据命理/中医知识库严谨作答：\n\n{prompt}"
                )
                rec = to_chatml(enhanced_prompt, chosen)
                fout.write(json.dumps(rec, ensure_ascii=False) + '\n')
                n_ok += 1
            except Exception as e:
                n_skip += 1
    print(f"  ✅ {out_path.name}: {n_ok} 条 (跳过 {n_skip})")
    return n_ok

print("=== R710 DPO→SFT 转换 ===")
n_train = convert(TRAIN_IN, TRAIN_OUT)
n_val = convert(VAL_IN, VAL_OUT)
print(f"\n输出: {n_train} train + {n_val} val SFT 样本（从 921 DPO 对）")