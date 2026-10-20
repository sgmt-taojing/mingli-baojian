#!/usr/bin/env python3
"""
convert_chatml_to_mlx.py — 将 ChatML 格式 SFT 数据转换为 mlx-lm 训练格式

mlx-lm 的 load_local_dataset 期望一个目录，目录下包含 train.jsonl / valid.jsonl / test.jsonl，
每行一个 JSON 对象。支持的格式包括：
- {"text": "..."}  →  TextDataset（纯文本补全）
- {"messages": [...]}  →  ChatDataset（OpenAI ChatML 格式）★ 本项目使用此格式
- {"prompt": "...", "completion": "..."}  →  CompletionsDataset

本脚本将项目中的 JSON 数组文件（data/mingli_sft_*.json）转换为 JSONL 格式，
输出到 data/mlx_sft/ 目录，供 mlx_lm.lora 直接使用。

用法:
    # 转换全部三个数据集
    python scripts/convert_chatml_to_mlx.py

    # 自定义输入输出
    python scripts/convert_chatml_to_mlx.py \
        --train-in data/mingli_sft_train.json \
        --val-in data/mingli_sft_val.json \
        --test-in data/mingli_sft_test.json \
        --output-dir data/mlx_sft

    # 只转换训练集
    python scripts/convert_chatml_to_mlx.py --train-in data/mingli_sft_train.json

依赖: Python 标准库 (json, pathlib, argparse)
"""

import argparse
import json
import sys
from pathlib import Path

# 默认路径（相对于项目根目录）
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_INPUTS = {
    "train": PROJECT_ROOT / "data" / "mingli_sft_train.json",
    "val": PROJECT_ROOT / "data" / "mingli_sft_val.json",
    "test": PROJECT_ROOT / "data" / "mingli_sft_test.json",
}
DEFAULT_OUTPUT_DIR = PROJECT_ROOT / "data" / "mlx_sft"


def convert_json_to_jsonl(
    src_path: Path,
    dst_path: Path,
    validate: bool = True,
) -> int:
    """
    将 JSON 数组文件转换为 JSONL 文件（一行一个 JSON 对象）。

    Args:
        src_path: 源 JSON 文件路径（数组格式，如 [{...}, {...}]）
        dst_path: 目标 JSONL 文件路径
        validate: 是否验证每条数据的 messages 字段

    Returns:
        int: 转换的样本数量

    Raises:
        FileNotFoundError: 源文件不存在
        ValueError: 数据格式无效
    """
    if not src_path.exists():
        raise FileNotFoundError(f"源文件不存在: {src_path}")

    with open(src_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    if not isinstance(data, list):
        raise ValueError(f"期望 JSON 数组，实际类型: {type(data).__name__}")

    if len(data) == 0:
        print(f"[警告] {src_path.name}: 空数据集，跳过")
        return 0

    # 验证第一条数据的格式
    sample = data[0]
    if "messages" not in sample:
        raise ValueError(
            f"数据缺少 'messages' 字段。mlx-lm ChatDataset 要求格式为 "
            f'{{"messages": [{{"role": "...", "content": "..."}}]}}'
        )

    # 检查 messages 结构
    messages = sample["messages"]
    if not isinstance(messages, list) or len(messages) < 2:
        raise ValueError(f"'messages' 必须是非空列表且至少包含 2 条消息")

    expected_roles = {"system", "user", "assistant"}
    for i, msg in enumerate(messages):
        if "role" not in msg or "content" not in msg:
            raise ValueError(f"messages[{i}] 缺少 'role' 或 'content' 字段")
        if validate and msg["role"] not in expected_roles:
            print(f"[警告] messages[{i}] 包含未知角色: {msg['role']}")

    # 写入 JSONL
    dst_path.parent.mkdir(parents=True, exist_ok=True)
    with open(dst_path, "w", encoding="utf-8") as f:
        for item in data:
            f.write(json.dumps(item, ensure_ascii=False) + "\n")

    return len(data)


def generate_dataset_info(output_dir: Path, stats: dict):
    """
    生成 dataset_info.json，记录数据集统计信息。

    Args:
        output_dir: 输出目录
        stats: 各数据集的样本数量，如 {"train": 692, "val": 86, "test": 87}
    """
    info_path = output_dir / "dataset_info.json"
    info = {
        "description": "命理宝鉴 SFT 训练数据（ChatML 格式）",
        "format": "chatml",
        "fields": ["messages", "metadata"],
        "splits": {
            name: {"count": count, "file": f"{name}.jsonl"}
            for name, count in stats.items()
            if count > 0
        },
        "total": sum(stats.values()),
        "categories": [
            "八字", "紫微斗数", "奇门遁甲", "六爻", "梅花易数",
            "风水", "中医", "姓名学", "五行", "周易",
        ],
    }
    with open(info_path, "w", encoding="utf-8") as f:
        json.dump(info, f, ensure_ascii=False, indent=2)
    print(f"[OK] dataset_info.json 已生成 → {info_path}")


def main():
    parser = argparse.ArgumentParser(
        description="将 ChatML JSON 数组转换为 mlx-lm JSONL 训练格式",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  %(prog)s
  %(prog)s --train-in data/mingli_sft_train.json --output-dir data/mlx_sft
  %(prog)s --train-in train.json --val-in val.json --output-dir /tmp/mlx_data
        """,
    )
    parser.add_argument(
        "--train-in",
        type=Path,
        default=DEFAULT_INPUTS["train"],
        help=f"训练集 JSON 文件（默认: {DEFAULT_INPUTS['train']}）",
    )
    parser.add_argument(
        "--val-in",
        type=Path,
        default=DEFAULT_INPUTS["val"],
        help=f"验证集 JSON 文件（默认: {DEFAULT_INPUTS['val']}）",
    )
    parser.add_argument(
        "--test-in",
        type=Path,
        default=DEFAULT_INPUTS["test"],
        help=f"测试集 JSON 文件（默认: {DEFAULT_INPUTS['test']}）",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=DEFAULT_OUTPUT_DIR,
        help=f"输出目录（默认: {DEFAULT_OUTPUT_DIR}）",
    )
    parser.add_argument(
        "--skip-train",
        action="store_true",
        help="跳过训练集转换",
    )
    parser.add_argument(
        "--skip-val",
        action="store_true",
        help="跳过验证集转换",
    )
    parser.add_argument(
        "--skip-test",
        action="store_true",
        help="跳过测试集转换",
    )
    parser.add_argument(
        "--no-validate",
        action="store_true",
        help="跳过数据格式验证",
    )

    args = parser.parse_args()

    # 定义转换任务
    tasks = []
    if not args.skip_train:
        tasks.append(("train", args.train_in))
    if not args.skip_val:
        tasks.append(("valid", args.val_in))
    if not args.skip_test:
        tasks.append(("test", args.test_in))

    if not tasks:
        print("[错误] 未指定任何转换任务（所有数据集均被跳过）")
        sys.exit(1)

    stats = {}
    errors = []

    for split_name, src_path in tasks:
        dst_path = args.output_dir / f"{split_name}.jsonl"
        print(f"[转换] {split_name}: {src_path} → {dst_path}")

        try:
            count = convert_json_to_jsonl(
                src_path,
                dst_path,
                validate=not args.no_validate,
            )
            stats[split_name] = count
            print(f"  → {count} 条样本")
        except (FileNotFoundError, ValueError, json.JSONDecodeError) as e:
            print(f"  [错误] {e}")
            errors.append((split_name, str(e)))
            stats[split_name] = 0

    # 生成 dataset_info.json
    generate_dataset_info(args.output_dir, stats)

    # 汇总
    total = sum(stats.values())
    print(f"\n{'='*60}")
    print(f"[完成] 输出目录: {args.output_dir}")
    print(f"  总样本数: {total}")
    for name in ("train", "valid", "test"):
        if name in stats:
            print(f"  {name}: {stats[name]} 条")
    if errors:
        print(f"\n[警告] {len(errors)} 个转换任务失败:")
        for name, err in errors:
            print(f"  - {name}: {err}")
        sys.exit(1)


if __name__ == "__main__":
    main()
