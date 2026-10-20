#!/usr/bin/env python3
"""R105-P1 · 训练数据清洗脚本

用途：清理 DPO val / train / valid 中的非命理/非中医噪声条目
噪声特征：
- EPB 设备描述（[EPB设备]）
- shop-data 商品（Knowledge·shop-data·{）
- water_quality / M1163 / 聚光科技 等 IoT 关键词
- 完整四级定价体系（营销内容）
"""
import json, sys
from pathlib import Path

BASE = Path('/Users/tom/kimi/projects/mingli-baojian')
NOISE_KEYWORDS = [
    'EPB', 'shop-data', 'Knowledge·', 'M1163', 'water_quality',
    '聚光科技', '设备]', '甪庸堂', '四级定价', '产品线设计',
    'monitor', 'sensor', '环保', '水质',
]

MLL_KEYWORDS = [  # 命理/中医/民俗/中医经典
    '周易', '八字', '五行', '中医', '辨证', '方剂', '倪海厦', '天纪',
    '紫微', '奇门', '六爻', '六壬', '梅花', '风水', '生肖', '太岁',
    '命宫', '用神', '节气', '干支', '十神', '格局', '宫位', '四柱',
    '伤寒', '金匮', '黄帝内经', '神农', '本草', '舌诊', '面诊', '望闻问切',
    '肝', '心', '脾', '肺', '肾', '气血', '阴阳', '脏腑', '经络',
    '天干', '地支', '纳音', '六亲', '神煞', '大运', '流年', '起卦',
]

def is_noise(text: str) -> bool:
    """噪声判断：含 IoT/商品/营销关键词 且 不含明显命理中医术语"""
    has_noise = any(kw in text for kw in NOISE_KEYWORDS)
    has_mll = sum(1 for kw in MLL_KEYWORDS if kw in text) >= 1
    return has_noise and not has_mll


def clean_file(input_path: Path, output_path: Path, dry_run=False) -> dict:
    stats = {'input': 0, 'output': 0, 'removed': 0, 'noise_samples': []}
    with open(input_path, encoding='utf-8') as f:
        lines = [l for l in f if l.strip()]
    stats['input'] = len(lines)

    out_lines = []
    for line in lines:
        try:
            d = json.loads(line)
        except Exception:
            continue
        text = d.get('prompt', '') + d.get('chosen', '')
        if is_noise(text):
            stats['noise_samples'].append(d.get('prompt', '')[:60])
            stats['removed'] += 1
            continue
        out_lines.append(line)
    stats['output'] = len(out_lines)

    if not dry_run:
        with open(output_path, 'w', encoding='utf-8') as f:
            f.writelines(out_lines)

    return stats


def main():
    targets = [
        (BASE / 'training/dpo_val.jsonl', BASE / 'training/dpo_val.cleaned.jsonl'),
        (BASE / 'training/mlx-r105-data/train.jsonl', BASE / 'training/mlx-r105-data/train.cleaned.jsonl'),
        (BASE / 'training/mlx-r105-data/valid.jsonl', BASE / 'training/mlx-r105-data/valid.cleaned.jsonl'),
    ]
    dry_run = '--apply' not in sys.argv

    print(f"Mode: {'DRY-RUN' if dry_run else 'APPLY (write files)'}", flush=True)
    print("=" * 60)

    for inp, outp in targets:
        if not inp.exists():
            print(f"⚠️ {inp.name} 不存在，跳过")
            continue
        stats = clean_file(inp, outp, dry_run=dry_run)
        rate = stats['removed'] / max(1, stats['input']) * 100
        print(f"\n{inp.name}:")
        print(f"  输入 {stats['input']} 条 → 输出 {stats['output']} 条")
        print(f"  清洗 {stats['removed']} 条噪声 ({rate:.1f}%)")
        if stats['noise_samples'][:5]:
            print(f"  噪声样例（前 5）:")
            for s in stats['noise_samples'][:5]:
                print(f"    - {s}")

    if dry_run:
        print("\n" + "=" * 60)
        print("DRY-RUN 完成。如确认无误，加 --apply 真正写文件：")
        print("  python3 scripts/clean-mlx-train-data.py --apply")


if __name__ == '__main__':
    main()
