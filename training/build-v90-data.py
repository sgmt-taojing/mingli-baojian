#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
R739 v9.0 训练数据构建
目标：v8.7 最优配比（推理链:自由问答≈1:1）+ 推理链全量扩量（BaziQA 488 题全部转推理链）+ 去 AI 味
数据源：
  1. BaziQA 488 题（celebrity50_zh.json）→ 推理链（答案+依据）
  2. v8.7 现有数据（train.v87.jsonl / valid.v87.jsonl）→ 基础（含自由问答）
输出：train.v90.jsonl / valid.v90.jsonl（ChatML messages 格式，mlx_lm 兼容）
"""
import json
import os
import random
import re

BASE = os.path.expanduser('~/.openclaw-autoclaw/workspace/projects/mingli-baojian')
BAZIQA = os.path.expanduser('~/.openclaw-autoclaw/workspace/.openclaw/tmp/giant-shoulders/baziqa/data/celebrity50_zh.json')
V87_TRAIN = f'{BASE}/training/mlx-r105-data-v87/train.v87.jsonl'
V87_VALID = f'{BASE}/training/mlx-r105-data-v87/valid.v87.jsonl'
OUT_DIR = f'{BASE}/training/mlx-r105-data-v90'
os.makedirs(OUT_DIR, exist_ok=True)

# 去 AI 味（humanizer-zh 核心规则）
PHRASES = ['首先，','首先,','其次，','其次,','最后，','最后,','此外，','此外,','综上所述，','综上所述,',
           '总而言之，','总而言之,','总之，','总之,','仅供参考','作为AI','作为一个AI','作为人工智能',
           '作为助手','作为语言模型','希望以上','相信以上','值得注意的是，','不难发现，']
def de_ai(t):
    if not t: return t
    for p in PHRASES:
        t = t.replace(p, '')
    t = re.sub(r'——[——]+', '——', t)
    t = re.sub(r'，\s*，', '，', t)
    t = re.sub(r'\s{2,}', ' ', t)
    return t.strip()

def cat_key(text):
    """题目 → 依据类别"""
    cats = []
    if re.search(r'感情|恋情|婚姻|婚|伴侣|恋爱', text): cats.append('感情')
    if re.search(r'财富|财星|财运|资产|金钱|经济', text): cats.append('财富')
    if re.search(r'事业|职业|工作|仕途|官', text): cats.append('事业')
    if re.search(r'六亲|父母|母亲|父亲|兄弟|子女|亲人', text): cats.append('六亲')
    if re.search(r'健康|身体|疾病|伤病|寿命', text): cats.append('健康')
    return cats or ['事业', '感情']  # 默认取事业+感情

def baziqa_reasoning_samples():
    """BaziQA 488 题 → 推理链样本"""
    d = json.load(open(BAZIQA))
    samples = []
    for p in d:
        prof = p.get('profile', {})
        cats = p.get('categories', {})
        birth = prof.get('birth', {})
        birth_str = f"{birth.get('year','?')}年{birth.get('month','?')}月{birth.get('day','?')}日 12时"
        gender = '男' if prof.get('gender') == 'male' else '女'
        place = birth.get('place', '')
        for q in p.get('questions', []):
            prompt = (f"以下是一位命主的出生信息：\n出生：{birth_str}\n性别：{gender}\n"
                      f"出生地：{place}\n\n题目：{q['question']}\n")
            for opt in q.get('options', []):
                prompt += f"{opt}\n"
            prompt += "\n请选择最符合的选项。"
            # 依据：从相关类别提取事实（每类最多 2 条，截断 200 字）
            ans = q['answer']
            ans_text = ''
            for opt in q.get('options', []):
                if opt.startswith(ans):
                    ans_text = opt[2:].strip()  # 去掉 "B. "
                    break
            evid_parts = []
            for ck in cat_key(q['question']):
                for fact in cats.get(ck, [])[:2]:
                    evid_parts.append(f"{ck}:{fact[:160]}")
            evidence = '；'.join(evid_parts)[:600]
            completion = f"{ans}。{ans_text}（依据：{evidence}）"
            samples.append({'prompt': prompt, 'completion': de_ai(completion),
                            '_meta': {'source': 'baziqa-v90', 'person': p['name'], 'qid': q['question_id']}})
    return samples

def to_messages(d):
    """prompt/completion → ChatML messages"""
    return [{'role': 'user', 'content': d['prompt']},
            {'role': 'assistant', 'content': d['completion']}]

def load_jsonl(path):
    out = []
    if os.path.exists(path):
        with open(path) as f:
            for line in f:
                line = line.strip()
                if line:
                    out.append(json.loads(line))
    return out

def main():
    random.seed(42)
    # 1. BaziQA 全量推理链（扩量核心）
    bz = baziqa_reasoning_samples()
    print(f'BaziQA 推理链: {len(bz)} 条')
    # 2. v8.7 基础数据（去 AI 味）
    v87_tr = load_jsonl(V87_TRAIN)
    v87_va = load_jsonl(V87_VALID)
    for d in v87_tr + v87_va:
        d['completion'] = de_ai(d['completion'])
    print(f'v8.7 基础: train {len(v87_tr)} + valid {len(v87_va)}')
    # 3. 推理链:自由问答配比 → 1:1
    reason_new = bz
    free_old = [d for d in v87_tr if not re.search(r'依据', d.get('completion', ''))]
    reason_old = [d for d in v87_tr if re.search(r'依据', d.get('completion', ''))]
    # 合并推理链（BaziQA 全量 + v8.7 已有推理链，按 prompt 去重）
    seen = set()
    reason_all = []
    for d in reason_new + reason_old:
        if d['prompt'] not in seen:
            seen.add(d['prompt'])
            reason_all.append(d)
    free_all = free_old
    print(f'推理链: {len(reason_all)} / 自由问答: {len(free_all)} / 比例 {len(reason_all)/max(len(free_all),1):.2f}:1')
    # 自由问答不足 → 用 v8.7 推理链降级为自由问答补足（去掉依据）
    if len(free_all) < len(reason_all):
        need = len(reason_all) - len(free_all)
        for d in reason_old:
            if need <= 0: break
            dd = dict(d)
            dd['completion'] = de_ai(re.sub(r'（依据：.*）', '', d['completion']))
            dd['_meta'] = {'source': 'reasoning-to-free-v90'}
            if dd['prompt'] not in {x['prompt'] for x in free_all}:
                free_all.append(dd)
                need -= 1
    print(f'配比修真后: 推理链 {len(reason_all)} / 自由问答 {len(free_all)} / 比例 {len(reason_all)/max(len(free_all),1):.2f}:1')
    # 4. 切分 train/valid（9:1）
    all_data = reason_all + free_all
    random.shuffle(all_data)
    n_valid = max(int(len(all_data) * 0.1), 10)
    valid, train = all_data[:n_valid], all_data[n_valid:]
    # 5. 写文件（messages 格式）
    with open(f'{OUT_DIR}/train.v90.jsonl', 'w') as f:
        for d in train:
            f.write(json.dumps({'messages': to_messages(d), '_meta': d.get('_meta', {})}, ensure_ascii=False) + '\n')
    with open(f'{OUT_DIR}/valid.v90.jsonl', 'w') as f:
        for d in valid:
            f.write(json.dumps({'messages': to_messages(d), '_meta': d.get('_meta', {})}, ensure_ascii=False) + '\n')
    print(f'✅ 写入: train {len(train)} / valid {len(valid)}')
    print(f'去AI味: 全部 completion 已应用 de-ai 规则')

if __name__ == '__main__':
    main()
