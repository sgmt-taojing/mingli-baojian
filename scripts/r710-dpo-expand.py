#!/usr/bin/env python3
"""
R710 v6 DPO 扩充 — KB 蒸馏生成 chosen/rejected 对
选 KB 高 trust_score 条目，构造：
  chosen = KB 原文（准确、全面）
  rejected = 回避/遗漏/超纲回答（模拟常见AI问题）
"""
import json, random, sqlite3, hashlib, time, sys
from pathlib import Path

BASE = Path('/Users/tom/kimi/projects/mingli-baojian')
DB = BASE / 'server' / 'database' / 'yidao.db'

# 输出路径
SFT_TRAIN = BASE / 'data' / 'mingli_sft_train.json'
DPO_TRAIN = BASE / 'data' / 'mingli_dpo_train.json'

random.seed(20260811)

# ---- 1. 从 KB 选高 trust 条目，按模块采样 ----
conn = sqlite3.connect(str(DB))
conn.row_factory = sqlite3.Row

# 选 trust_score >= 0.8 且 content 长度 200-3000 字
rows = conn.execute('''
    SELECT entry_id, module, title, content, trust_score, keywords, tags
    FROM kb_formal
    WHERE trust_score >= 0.8
      AND LENGTH(content) BETWEEN 200 AND 3000
      AND status = 'active'
    ORDER BY trust_score DESC, hit_count DESC
''').fetchall()

# 按模块采样，每模块最多取 15 条（避免集中）
by_module = {}
for r in rows:
    mod = r['module'] or 'other'
    by_module.setdefault(mod, []).append(dict(r))

samples = []
for mod, items in by_module.items():
    pick = items[:15]  # 每模块取前 15 条（按 trust_score 排序）
    samples.extend(pick)

print(f'KB 高 trust 条目: {len(rows)} 条 → 采样 {len(samples)} 条 / {len(by_module)} 模块')

# ---- 2. 构造 question + chosen + rejected ----
# chosen 模板：基于 KB content 直接引用
# rejected 模板：模拟AI常见问题（遗漏关键词、超纲、回避）

BAD_TEMPLATES = [
    "抱歉，这个内容比较复杂，我建议您查阅相关典籍后再自行理解。",
    "关于这个问题，涉及很多专业知识，建议您咨询专业老师。",
    "这个需要结合个人命盘具体分析，无法给出一般性结论。",
    "不同流派说法不同，这里就不做具体解释了。",
    "这个问题超出了我能准确回答的范围，建议您参考权威资料。",
    "命理/中医相关内容请以正规渠道为准，我提供的仅供参考。",
    "这涉及较为专业的知识点，需要系统学习才能理解。",
    "不好意思，这个需要看具体排盘结果，无法笼统回答。",
    "这个问题的回答依赖于具体条件，不宜一概而论。",
    "建议您带着具体问题去咨询有经验的专业人士。",
]

MODULE_TO_DOMAIN = {
    'tcm': '中医', 'huangdi-neijing': '黄帝内经', 'ziwei': '紫微斗数',
    'qimen': '奇门遁甲', 'liuyao': '六爻', 'meihua': '梅花易数',
    'liuren': '六壬', 'fengshui': '风水', 'shanghan-lun': '伤寒论',
    'shennong-bencao': '神农本草', 'bazi': '八字', 'authoritative': '经典',
    'nihaisha-tcm': '倪海厦中医', 'classics': '典籍', 'wuxing': '五行',
    'r45_palace_ext': '紫微', 'r45_huajie_ext': '化解',
    'tcm-classical': '中医经典', 'tcm-fangji': '方剂',
}

def make_question(title, module, keywords):
    """从 KB 条目标题构造问题"""
    domain = MODULE_TO_DOMAIN.get(module, module)
    # 多种问法
    templates = [
        f"请详细介绍{title}",
        f"什么是{title}？请详细解释",
        f"关于{domain}中的「{title}」，请系统说明",
        f"{title}的含义和用法是什么？",
        f"请解释{domain}中的{title}",
    ]
    return random.choice(templates)

dpo_new = []
seen = set()
for s in samples:
    q = make_question(s['title'], s['module'], s.get('keywords',''))
    chosen = s['content'].strip()
    if not chosen or len(chosen) < 100:
        continue
    # 去重
    key = hashlib.md5((q + chosen[:50]).encode()).hexdigest()
    if key in seen:
        continue
    seen.add(key)
    rejected = random.choice(BAD_TEMPLATES)
    dpo_new.append({
        'question': q,
        'chosen': chosen,
        'rejected': rejected,
        'module': s['module'],
        'title': s['title'],
        'trust_score': s['trust_score'],
    })

print(f'生成 DPO 对: {len(dpo_new)} 条')

# 分配 train/val (90/10)
random.shuffle(dpo_new)
n_val = max(1, int(len(dpo_new) * 0.1))
dpo_val = dpo_new[:n_val]
dpo_train = dpo_new[n_val:]
print(f'DPO 分配: train={len(dpo_train)} val={len(dpo_val)}')

# ---- 3. 追加到现有 DPO 文件 ----
DPO_VAL = BASE / 'data' / 'mingli_dpo_val.json'
existing_train = json.loads(DPO_TRAIN.read_text()) if DPO_TRAIN.exists() else []
existing_val = json.loads(DPO_VAL.read_text()) if DPO_VAL.exists() else []

def convert_chatml(dpo_list):
    """转为 ChatML 格式"""
    out = []
    for d in dpo_list:
        msgs = [
            {'role': 'system', 'content': '你是命理宝鉴AI助手，专注于周易、八字、紫微斗数、奇门遁甲、六爻、梅花易数、大六壬、风水、中医、黄历、姓名学等传统文化领域的知识问答。所有回答仅供学习参考，不构成专业建议。'},
            {'role': 'user', 'content': d['question']},
            {'role': 'assistant', 'content': d['chosen']},
        ]
        out.append({
            'messages': msgs,
            'chosen': {'role': 'assistant', 'content': d['chosen']},
            'rejected': {'role': 'assistant', 'content': d['rejected']},
            'metadata': {
                'module': d['module'],
                'title': d['title'],
                'trust_score': d['trust_score'],
                'source': 'r710-kb-distill',
            },
        })
    return out

final_train = existing_train + convert_chatml(dpo_train)
final_val = existing_val + convert_chatml(dpo_val)

with open(str(DPO_TRAIN), 'w') as f:
    json.dump(final_train, f, ensure_ascii=False, indent=2)
with open(str(DPO_VAL), 'w') as f:
    json.dump(final_val, f, ensure_ascii=False, indent=2)

print(f'\n✅ DPO 文件已更新:')
print(f'   train: {len(existing_train)} + {len(dpo_train)} = {len(final_train)}')
print(f'   val:   {len(existing_val)} + {len(dpo_val)} = {len(final_val)}')

# ---- 4. 模块分布统计 ----
from collections import Counter
mods = Counter(d['module'] for d in dpo_new)
print(f'\nDPO 模块分布（新增）:')
for m, n in mods.most_common(20):
    print(f'  {m}: {n}')