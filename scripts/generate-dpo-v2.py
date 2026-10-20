#!/usr/bin/env python3
"""
DPO v2 偏好数据生成
═══════════════════════════════════════════════════════════════
版本: v2.0 (2026-08-08 R476)
从 SFT 中提取候选答案对，构造 chosen/rejected 偏好对。

策略:
- chosen: KB 直接命中 + 来源标注完整 + 长度适中
- rejected: 截断 + 来源不标注 + 含糊表述
"""
import sqlite3
import json
import os
import re
import random
from datetime import datetime

DB_PATH = 'server/database/yidao.db'
SFT_PATH = 'training-data/sft-v3-20260808.jsonl'
OUTPUT_PATH = 'training-data/dpo-v2-20260808.jsonl'

def load_sft_pairs():
    pairs = []
    with open(SFT_PATH, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line: continue
            try:
                pairs.append(json.loads(line))
            except:
                continue
    return pairs

def make_rejected_version(content):
    """生成劣质版本"""
    # 删除来源标注
    rejected = re.sub(r'来源：[^\n]+\n\n', '', content, flags=re.MULTILINE)
    # 截断到 200 字
    if len(rejected) > 200:
        rejected = rejected[:200] + '...'
    # 添加含糊表述
    rejected = "这个我不太确定，" + rejected.replace("。", "。具体需要结合实际情况。")
    return rejected

def generate_dpo(sft_pairs):
    dpo_pairs = []
    for pair in sft_pairs:
        msgs = pair['messages']
        if len(msgs) < 3: continue
        user_msg = msgs[1]['content']
        chosen = msgs[2]['content']
        rejected = make_rejected_version(chosen)
        
        dpo_pairs.append({
            "prompt": [{"role": "user", "content": user_msg}],
            "chosen": [{"role": "assistant", "content": chosen}],
            "rejected": [{"role": "assistant", "content": rejected}],
            "metadata": pair.get('metadata', {})
        })
    return dpo_pairs

def main():
    print("═══ DPO v2 偏好数据生成 ═══")
    sft_pairs = load_sft_pairs()
    print(f"  SFT 加载: {len(sft_pairs)} 对")
    dpo_pairs = generate_dpo(sft_pairs)
    print(f"  生成 DPO: {len(dpo_pairs)} 对")
    
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        for p in dpo_pairs:
            f.write(json.dumps(p, ensure_ascii=False) + '\n')
    
    size = os.path.getsize(OUTPUT_PATH)
    print(f"\n✅ {OUTPUT_PATH}")
    print(f"  size: {size//1024} KB")
    print(f"  pairs: {len(dpo_pairs)}")

if __name__ == '__main__':
    main()
