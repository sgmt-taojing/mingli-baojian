#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
v9.4 防遗忘回放数据集构建器（命理宝鉴）
根因：v93 训练集维度分布倾斜，v9.3 复测健康维 -11pp。
配方（2026-09-25 定，勿 reopen）：
  - 以 training/mlx-r105-data-v93/train.jsonl 为底，只加不删；
  - 题库 celebrity50_zh.json 中健康维问题追加 2 份变体副本、事业维追加 1 份；
  - 变体 = build_basic 同构，仅结尾指令换一种说法；禁止 shuffle 选项（v9.1 教训 -8.8pp）；
  - 输出 training/mlx-r105-data-v94/{train,valid}.jsonl（变体 95/5 切分，v93 原有切分保持不动）。
用法：/usr/bin/python3 scripts/build-v94-replay.py
"""
import json
import os
import random
import re
import sys

BASE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(BASE)
DATA = os.path.join(ROOT, 'training', 'baziqa', 'data', 'celebrity50_zh.json')
V93 = os.path.join(ROOT, 'training', 'mlx-r105-data-v93')
OUT = os.path.join(ROOT, 'training', 'mlx-r105-data-v94')

sys.path.insert(0, os.path.join(ROOT, 'training'))
import importlib.util  # noqa: E402
_spec = importlib.util.spec_from_file_location(
    'build_baziqa_sft', os.path.join(ROOT, 'training', 'build-baziqa-sft.py'))
_mod = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_mod)
build_basic = _mod.build_basic
cat_key = _mod.cat_key

VARIANT_SUFFIX = [
    '请选择最符合的选项，并说明命理依据。',
    '请选出最符合的一项，简述判断逻辑。',
]


def build_variant(person, q, suffix):
    prompt, comp = build_basic(person, q)
    assert prompt.endswith('请选择最符合的选项。'), 'build_basic 结尾契约变了，需同步'
    prompt = prompt[: -len('请选择最符合的选项。')] + suffix
    return {'messages': [{'role': 'user', 'content': prompt},
                         {'role': 'assistant', 'content': comp}],
            '_meta': {'source': 'baziqa-replay-v94', 'qid': q['question_id']}}


def dim_of(line):
    d = json.loads(line)
    u = d['messages'][0]['content']
    if '题目：' not in u:
        return ['自由问答']
    qtext = u.split('题目：', 1)[1].split('\n', 1)[0]
    return cat_key(qtext)


def main():
    people = json.load(open(DATA))
    train_base = open(os.path.join(V93, 'train.jsonl')).read().splitlines()
    valid_base = open(os.path.join(V93, 'valid.jsonl')).read().splitlines()

    variants = []
    n_health = n_career = 0
    for p in people:
        for q in p.get('questions', []):
            cats = cat_key(q['question'])
            if '健康' in cats:
                for sfx in VARIANT_SUFFIX:
                    variants.append(build_variant(p, q, sfx))
                n_health += 1
            if '事业' in cats:
                variants.append(build_variant(p, q, VARIANT_SUFFIX[0]))
                n_career += 1

    rng = random.Random(42)
    rng.shuffle(variants)
    n_v = max(int(len(variants) * 0.05), 1)
    v_valid, v_train = variants[:n_v], variants[n_v:]

    os.makedirs(OUT, exist_ok=True)
    train_out = train_base + [json.dumps(d, ensure_ascii=False) for d in v_train]
    valid_out = valid_base + [json.dumps(d, ensure_ascii=False) for d in v_valid]
    with open(os.path.join(OUT, 'train.jsonl'), 'w') as f:
        f.write('\n'.join(train_out) + '\n')
    with open(os.path.join(OUT, 'valid.jsonl'), 'w') as f:
        f.write('\n'.join(valid_out) + '\n')

    # 全量 JSON 校验 + 分布报告
    from collections import Counter
    c = Counter()
    for name, lines in [('train', train_out), ('valid', valid_out)]:
        for i, ln in enumerate(lines):
            json.loads(ln)  # 校验
        print(f'✅ {name}.jsonl: {len(lines)} 行，JSON 全量校验通过')
    for ln in train_out:
        for k in dim_of(ln):
            c[k] += 1
    q_total = sum(v for k, v in c.items() if k != '自由问答')
    print(f'变体追加: 健康题 {n_health}×2 + 事业题 {n_career}×1 = {len(variants)} 条（入 valid {n_v} 条）')
    print(f'v94 train 题面分布(多标签): {dict(c)}')
    for k in ['健康', '事业', '六亲', '感情', '财富']:
        print(f'  {k}: {c[k]} ({c[k]/max(q_total,1)*100:.1f}%)')


if __name__ == '__main__':
    main()
