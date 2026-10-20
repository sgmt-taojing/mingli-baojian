#!/usr/bin/env python3
"""
R710 v6 DPO 修真 — 修复缺失 prompt
921 条有 chosen/rejected 但缺 prompt，根据 metadata 里的 title/keywords 反推 prompt
"""
import json, re
from pathlib import Path

BASE = Path('/Users/tom/kimi/projects/mingli-baojian')
SRC = BASE / 'data' / 'mingli_dpo_train.json'
DST_TRAIN = BASE / 'training' / 'dpo_train.jsonl'
DST_VAL = BASE / 'training' / 'dpo_val.jsonl'

d = json.load(open(SRC))

# 问法模板（多角度触发不同知识）
Q_TEMPLATES = [
    "请详细介绍「{title}」",
    "「{title}」是什么意思？请详细解释",
    "什么是「{title}」？",
    "请说说「{title}」的原理和应用",
    "请解释「{title}」相关知识",
    "「{title}」具体指什么？",
    "能否系统讲解「{title}」？",
    "请说明「{title}」的概念",
    "想了解「{title}」",
    "请教「{title}」的相关内容",
]

# 模块专属问法
MODULE_Q = {
    'bazi': ['请解读八字中的「{title}」', '八字命理中「{title}」代表什么？'],
    'ziwei': ['紫微斗数里「{title}」代表什么含义？', '紫微命盘中「{title}」有何作用？'],
    'qimen': ['奇门遁甲中「{title}」怎么用？', '奇门盘里「{title}」的含义？'],
    'liuyao': ['六爻预测中「{title}」的用法？', '六爻卦象里「{title}」什么意思？'],
    'meihua': ['梅花易数里「{title}」怎么断？', '梅花易数中「{title}」的原理？'],
    'liuren': ['大六壬中「{title}」怎么判断？', '六壬课式中「{title}」的用法？'],
    'fengshui': ['风水学里「{title}」怎么布局？', '风水调整中「{title}」的作用？'],
    'tcm': ['中医里「{title}」怎么理解？', '中医理论中「{title}」的含义？'],
    'shanghan-lun': ['伤寒论中「{title}」如何辨证？', '张仲景讲的「{title}」是什么意思？'],
    'huangdi-neijing': ['黄帝内经里「{title}」讲的什么？', '内经中「{title}」的医理？'],
    'shennong-bencao': ['神农本草里「{title}」有什么功效？'],
    'nihaisha-tcm': ['倪海厦老师讲的「{title}」是什么意思？'],
    'wuxing': ['五行学说中「{title}」怎么解释？', '「{title}」在五行里指什么？'],
    'taichi': ['太极图中「{title}」代表什么？'],
    'liuji': ['周易六爻里「{title}」的象意？'],
    'yijing': ['易经中「{title}」的卦象含义？', '易经讲「{title}」指什么？'],
    'shensha': ['命理神煞中「{title}」的作用？'],
    'taiyi': ['太乙神数里「{title}」的含义？'],
    'mingli': ['命理学中「{title}」怎么理解？'],
    'jiazi': ['六十甲子中「{title}」是什么？'],
    'jieqi': ['二十四节气里「{title}」的特点？'],
    'tcm-acupuncture': ['中医针灸中「{title}」穴位的主治？'],
    'tcm-fangji': ['中医方剂里「{title}」的组成和功效？'],
    'tcm-diagnosis': ['中医诊断学中「{title}」怎么辨别？'],
    'tcm-classical': ['中医经典中「{title}」讲什么？'],
}

fixed_train, fixed_val = [], []
for i, item in enumerate(d):
    convs = item.get('conversations') or []
    prompt = ''
    for c in convs:
        if c.get('from') == 'human':
            prompt = c.get('value', '').strip()
            break
    if not prompt:
        # 从 metadata 反推
        meta = item.get('metadata') or {}
        title = (meta.get('title') or '').strip()
        module = meta.get('module') or meta.get('domain') or ''
        if not title:
            continue
        # 选一个合适问法模板
        templates = MODULE_Q.get(module, []) + Q_TEMPLATES
        prompt = templates[i % len(templates)].format(title=title)
    chosen_raw = item.get('chosen') or ''
    rejected_raw = item.get('rejected') or ''
    # 兼容 dict 格式 {'role':'assistant','content':'...'}
    if isinstance(chosen_raw, dict):
        chosen_raw = chosen_raw.get('content', '')
    if isinstance(rejected_raw, dict):
        rejected_raw = rejected_raw.get('content', '')
    chosen = chosen_raw.strip()
    rejected = rejected_raw.strip()
    if not chosen or not rejected:
        continue
    obj = {'prompt': prompt, 'chosen': chosen, 'rejected': rejected}
    if i % 10 == 0:
        fixed_val.append(obj)
    else:
        fixed_train.append(obj)

# 写入
with open(DST_TRAIN, 'w') as f:
    for o in fixed_train:
        f.write(json.dumps(o, ensure_ascii=False) + '\n')
with open(DST_VAL, 'w') as f:
    for o in fixed_val:
        f.write(json.dumps(o, ensure_ascii=False) + '\n')

print(f'✅ R710 v6 DPO prompt 修真完成')
print(f'   train={len(fixed_train)} | val={len(fixed_val)} | total={len(fixed_train)+len(fixed_val)}')
print(f'   输出: training/dpo_train.jsonl + dpo_val.jsonl')
print(f'   示例 train[0].prompt: {fixed_train[0]["prompt"][:80]}')
