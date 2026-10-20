#!/usr/bin/env python3
"""
convert-sft-to-chatml.py · SFT 数据 → ChatML 转换器

将 training-data/ 下的 JSONL 转换为 LLaMA-Factory 兼容的 ChatML 格式
输出：data/mingli_sft.json + data/mingli_dpo.json

用法：python3 scripts/convert-sft-to-chatml.py
"""

import json
import os
import random
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent.parent
SFT_DIRS = [
    PROJECT_DIR / 'training-data' / 'sft-gold-cases',
    PROJECT_DIR / 'training-data' / 'sft-general',
    PROJECT_DIR / 'training-data' / 'sft-reasoning',
]
DPO_DIR = PROJECT_DIR / 'training-data' / 'preference'
OUT_DIR = PROJECT_DIR / 'data'

SYSTEM_PROMPT = (
    "你是命理宝鉴AI助手，专注于周易、八字、紫微斗数、奇门遁甲、六爻、梅花易数、"
    "大六壬、风水、中医、黄历、姓名学等传统文化领域的知识问答。"
    "回答必须基于知识库，遵循以下红线：\n"
    "1. 禁止自主辨证、判体质、断病机\n"
    "2. 禁止输出疾病诊断、药方、治疗方案\n"
    "3. 禁止预判生死灾祸\n"
    "4. 禁止脱离知识库凭空创造理论\n"
    "5. 禁止绝对化、宿命论结论\n"
    "6. 禁止对未成年人输出算命结论\n"
    "7. 禁止煽动性、恐吓式输出\n"
    "所有回答仅供学习参考，不构成专业建议。"
)

random.seed(42)


def load_sft_jsonl(filepath):
    """加载 SFT JSONL 文件（兼容 instruction/response 和 messages 格式）"""
    cases = []
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or not line.startswith('{'):
                continue
            try:
                d = json.loads(line)
                # 格式 1：instruction + response
                if 'instruction' in d and ('response' in d or 'answer' in d):
                    if 'response' not in d and 'answer' in d:
                        d['response'] = d['answer']
                    cases.append(d)
                # 格式 2：messages 格式（新组合爆炸/反馈脚本）
                elif 'messages' in d:
                    msgs = d['messages']
                    instruction = ''
                    response = ''
                    for msg in msgs:
                        if msg.get('role') == 'user':
                            instruction = msg.get('content', '')
                        elif msg.get('role') == 'assistant':
                            response = msg.get('content', '')
                    if instruction and response:
                        cases.append({
                            'instruction': instruction,
                            'response': response,
                            'src_id': d.get('src_id', ''),
                            'module': d.get('module', ''),
                        })
            except json.JSONDecodeError:
                continue
    return cases


def convert_sft_to_chatml(cases):
    """转换为 ChatML messages 格式"""
    converted = []
    for case in cases:
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": case['instruction']},
            {"role": "assistant", "content": case['response']},
        ]
        entry = {
            "messages": messages,
            "metadata": {
                "source": case.get('source', 'unknown'),
                "rating": case.get('rating', 'silver'),
                "category": case.get('category', ''),
                "subcategory": case.get('subcategory', ''),
                "difficulty": case.get('difficulty', ''),
                "tags": case.get('tags', []),
            }
        }
        converted.append(entry)
    return converted


def convert_dpo_to_chatml(pairs):
    """转换 DPO 为 preference 格式"""
    converted = []
    for pair in pairs:
        entry = {
            "conversations": [
                {"from": "human", "value": pair['prompt']},
            ],
            "chosen": {
                "from": "gpt",
                "value": pair['chosen']['response'],
            },
            "rejected": {
                "from": "gpt",
                "value": pair['rejected']['response'],
            },
            "metadata": {
                "source": pair.get('chosen', {}).get('source', 'unknown'),
                "reason": pair.get('reason', ''),
            }
        }
        converted.append(entry)
    return converted


def split_dataset(data, train_ratio=0.8, val_ratio=0.1):
    """划分数据集"""
    random.shuffle(data)
    n = len(data)
    train_end = int(n * train_ratio)
    val_end = int(n * (train_ratio + val_ratio))
    return {
        'train': data[:train_end],
        'val': data[train_end:val_end],
        'test': data[val_end:],
    }


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    # 1. 加载所有 SFT 数据
    all_sft = []
    for sft_dir in SFT_DIRS:
        if not sft_dir.exists():
            continue
        for filepath in sorted(sft_dir.glob('*.jsonl')):
            cases = load_sft_jsonl(filepath)
            print(f"[convert] {filepath.name}: {len(cases)} cases")
            all_sft.extend(cases)

    print(f"[convert] SFT 总计：{len(all_sft)} cases")

    # 2. 转换为 ChatML
    chatml_sft = convert_sft_to_chatml(all_sft)

    # 3. 划分数据集
    splits = split_dataset(chatml_sft)

    # 4. 写文件（LLaMA-Factory 格式）
    # train
    train_file = OUT_DIR / 'mingli_sft_train.json'
    with open(train_file, 'w', encoding='utf-8') as f:
        json.dump(splits['train'], f, ensure_ascii=False, indent=2)
    print(f"[convert] train: {len(splits['train'])} → {train_file}")

    # val
    val_file = OUT_DIR / 'mingli_sft_val.json'
    with open(val_file, 'w', encoding='utf-8') as f:
        json.dump(splits['val'], f, ensure_ascii=False, indent=2)
    print(f"[convert] val: {len(splits['val'])} → {val_file}")

    # test
    test_file = OUT_DIR / 'mingli_sft_test.json'
    with open(test_file, 'w', encoding='utf-8') as f:
        json.dump(splits['test'], f, ensure_ascii=False, indent=2)
    print(f"[convert] test: {len(splits['test'])} → {test_file}")

    # 5. 加载 DPO 数据
    all_dpo = []
    if DPO_DIR.exists():
        for filepath in sorted(DPO_DIR.glob('*.jsonl')):
            with open(filepath, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if not line or not line.startswith('{'):
                        continue
                    try:
                        d = json.loads(line)
                        if 'prompt' in d and 'chosen' in d and 'rejected' in d:
                            all_dpo.append(d)
                    except json.JSONDecodeError:
                        continue
            print(f"[convert] {filepath.name}: loaded")

    print(f"[convert] DPO 总计：{len(all_dpo)} pairs")

    if all_dpo:
        chatml_dpo = convert_dpo_to_chatml(all_dpo)
        dpo_splits = split_dataset(chatml_dpo, train_ratio=0.8, val_ratio=0.2)

        dpo_train_file = OUT_DIR / 'mingli_dpo_train.json'
        with open(dpo_train_file, 'w', encoding='utf-8') as f:
            json.dump(dpo_splits['train'], f, ensure_ascii=False, indent=2)
        print(f"[convert] DPO train: {len(dpo_splits['train'])} → {dpo_train_file}")

        dpo_val_file = OUT_DIR / 'mingli_dpo_val.json'
        with open(dpo_val_file, 'w', encoding='utf-8') as f:
            json.dump(dpo_splits['val'], f, ensure_ascii=False, indent=2)
        print(f"[convert] DPO val: {len(dpo_splits['val'])} → {dpo_val_file}")

    # 6. 生成 dataset_info.json（LLaMA-Factory 元数据）
    dataset_info = {
        "mingli_sft": {
            "file_name": "mingli_sft_train.json",
            "format": "chatml",
            "columns": {
                "messages": "messages"
            }
        },
        "mingli_sft_val": {
            "file_name": "mingli_sft_val.json",
            "format": "chatml",
            "columns": {
                "messages": "messages"
            }
        },
        "mingli_dpo": {
            "file_name": "mingli_dpo_train.json",
            "format": " preference",
            "columns": {
                "conversations": "conversations",
                "chosen": "chosen",
                "rejected": "rejected"
            }
        },
        "mingli_dpo_val": {
            "file_name": "mingli_dpo_val.json",
            "format": "preference",
            "columns": {
                "conversations": "conversations",
                "chosen": "chosen",
                "rejected": "rejected"
            }
        }
    }
    info_file = OUT_DIR / 'dataset_info.json'
    with open(info_file, 'w', encoding='utf-8') as f:
        json.dump(dataset_info, f, ensure_ascii=False, indent=2)
    print(f"[convert] dataset_info → {info_file}")

    # 7. 汇总
    print(f"\n[convert] === 汇总 ===")
    print(f"  SFT train: {len(splits['train'])}")
    print(f"  SFT val:   {len(splits['val'])}")
    print(f"  SFT test:  {len(splits['test'])}")
    if all_dpo:
        print(f"  DPO train: {len(dpo_splits['train'])}")
        print(f"  DPO val:   {len(dpo_splits['val'])}")
    print(f"  输出目录: {OUT_DIR}")


if __name__ == '__main__':
    main()
