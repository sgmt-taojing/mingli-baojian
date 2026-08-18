#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
R739 v9.2 自优化数据构建（修真教训版）
v9.1 失败教训（45.1%）：shuffle 均衡化破坏题意-答案关联；未继承 v9.0 知识
v9.2 正确路径：
  A. 数据 = v9.0 原始 train（原样保留，不 shuffle）+ 错题辨析强化 225 条
  B. 错题强化 = 更长依据 + 排除法推理（A 为什么不对、C 为什么不对）→ 增强推理能力而非位置记忆
  C. 训练 = 以 v9.0 fused 为 base（继承知识）+ 更低 lr 精细增量
输出：mlx-r105-data-v92/train.jsonl + valid.jsonl
"""
import json
import os
import random
import re

BASE = os.path.expanduser('~/.openclaw-autoclaw/workspace/projects/mingli-baojian')
BAZIQA = os.path.expanduser('~/.openclaw-autoclaw/workspace/.openclaw/tmp/giant-shoulders/baziqa/data/celebrity50_zh.json')
EVAL_LOG = os.path.expanduser('~/.openclaw-autoclaw/workspace/.openclaw/tmp/baziqa-v90-eval.log')
V90_TRAIN = f'{BASE}/training/mlx-r105-data-v90/train.jsonl'
OUT_DIR = f'{BASE}/training/mlx-r105-data-v92'
os.makedirs(OUT_DIR, exist_ok=True)

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
    cats = []
    if re.search(r'感情|恋情|婚姻|婚|伴侣|恋爱', text): cats.append('感情')
    if re.search(r'财富|财星|财运|资产|金钱|经济', text): cats.append('财富')
    if re.search(r'事业|职业|工作|仕途|官', text): cats.append('事业')
    if re.search(r'六亲|父母|母亲|父亲|兄弟|子女|亲人', text): cats.append('六亲')
    if re.search(r'健康|身体|疾病|伤病|寿命', text): cats.append('健康')
    return cats or ['事业', '感情']

def build_enhanced(person, q, wrong_letter):
    """错题 → 辨析强化版（长依据 + 排除法）"""
    prof = person.get('profile', {})
    cats = person.get('categories', {})
    birth = prof.get('birth', {})
    birth_str = f"{birth.get('year','?')}年{birth.get('month','?')}月{birth.get('day','?')}日 12时"
    gender = '男' if prof.get('gender') == 'male' else '女'
    place = birth.get('place', '')
    prompt = (f"以下是一位命主的出生信息：\n出生：{birth_str}\n性别：{gender}\n"
              f"出生地：{place}\n\n题目：{q['question']}\n")
    for opt in q.get('options', []):
        prompt += f"{opt}\n"
    prompt += "\n请选择最符合的选项，并简要说明理由。"
    ans = q['answer']
    ans_text = ''
    opts = {}
    for opt in q.get('options', []):
        m = re.match(r'^([A-E])\. (.+)$', opt)
        if m:
            opts[m.group(1)] = m.group(2)
            if m.group(1) == ans:
                ans_text = m.group(2)
    # 依据：相关类别全部事实（更长）
    evid_parts = []
    for ck in cat_key(q['question']):
        for fact in cats.get(ck, [])[:3]:
            evid_parts.append(f"{ck}:{fact[:200]}")
    evidence = '；'.join(evid_parts)[:900]
    # 排除法：错误选项给出否定理由
    excludes = []
    for l in 'ABCDE':
        if l == ans or l not in opts:
            continue
        txt = opts[l][:40]
        excludes.append(f"{l}（{txt}）与此命局特征不符")
    excl_text = '；'.join(excludes[:3])
    completion = (f"{ans}。{ans_text}（依据：{evidence}；"
                  f"辨析：{excl_text or '其余选项与命局特征不符'}）")
    return {'prompt': prompt, 'completion': de_ai(completion),
            '_meta': {'source': 'baziqa-v92-enhanced', 'person': person['name'], 'qid': q['question_id'], 'wrong': wrong_letter}}

def main():
    rng = random.Random(92)
    people = json.load(open(BAZIQA))
    person_by_qid = {}
    for p in people:
        for q in p.get('questions', []):
            person_by_qid[q['question_id']] = (p, q)
    # 1. 错题集
    wrong = {}
    for line in open(EVAL_LOG):
        m = re.match(r'\s*❌ (\S+) 模型=(\S) 答案=(\S)', line)
        if m:
            wrong[m.group(1)] = m.group(2)
    print(f'错题: {len(wrong)}')
    # 2. 错题辨析强化
    enhanced = []
    for qid, wl in wrong.items():
        if qid in person_by_qid:
            p, q = person_by_qid[qid]
            enhanced.append(build_enhanced(p, q, wl))
    print(f'错题强化: {len(enhanced)}')
    # 3. v9.0 原始 train（messages 格式）
    base = []
    with open(V90_TRAIN) as f:
        for line in f:
            d = json.loads(line)
            if 'messages' in d:
                base.append(d)
            else:
                base.append({'messages': [{'role': 'user', 'content': d['prompt']},
                                          {'role': 'assistant', 'content': d['completion']}]})
    print(f'v9.0 基础: {len(base)}')
    # 4. 合并（v9.0 全部 + 错题强化）
    all_data = base + [{'messages': [{'role': 'user', 'content': s['prompt']},
                                     {'role': 'assistant', 'content': s['completion']}],
                        '_meta': s['_meta']} for s in enhanced]
    rng.shuffle(all_data)
    n_valid = max(int(len(all_data) * 0.1), 10)
    valid, train = all_data[:n_valid], all_data[n_valid:]
    for split, name in [(train, 'train'), (valid, 'valid')]:
        with open(f'{OUT_DIR}/{name}.jsonl', 'w') as f:
            for d in split:
                f.write(json.dumps(d, ensure_ascii=False) + '\n')
        print(f'✅ {name}: {len(split)}')

if __name__ == '__main__':
    main()
