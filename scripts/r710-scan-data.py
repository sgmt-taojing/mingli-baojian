#!/usr/bin/env python3
"""扫描 ChatML 训练数据"""
import json
from collections import Counter

with open('data/mingli_sft_train.json') as f: sft = json.load(f)
with open('data/mingli_sft_val.json') as f: val = json.load(f)
with open('data/mingli_dpo_train.json') as f: dpo = json.load(f)
with open('data/mingli_dpo_val.json') as f: dval = json.load(f)

print(f'SFT train: {len(sft)} | val: {len(val)}')
print(f'DPO train: {len(dpo)} | val: {len(dval)}')

# 模块分布（关键词匹配）
mods = Counter()
tags = ['bazi','ziwei','qimen','liuyao','liuren','meihua','fengshui','tcm','shuhan','wuxing','bagua','hepan','mangpai','naming']
for d in sft:
    text = json.dumps(d, ensure_ascii=False).lower()
    hit = False
    for t in tags:
        if t in text:
            mods[t] += 1
            hit = True
            break
    if not hit:
        mods['其他'] += 1
print('SFT 模块分布:', dict(mods))

# 长度分布（用 content 累加）
lens = []
for d in sft:
    n = sum(len(m.get('content','') or '') for m in d.get('messages', []))
    lens.append(n)
lens.sort()
print(f'SFT 长度: min={lens[0]} | p50={lens[len(lens)//2]} | p90={lens[int(len(lens)*0.9)]} | max={lens[-1]} | avg={sum(lens)//len(lens)}')

# 类别（从 metadata 看）
cat_counter = Counter()
for d in sft:
    md = d.get('metadata', {})
    cat_counter[md.get('module', md.get('category', 'N/A'))] += 1
print(f'SFT metadata 类别: {dict(cat_counter.most_common(20))}')