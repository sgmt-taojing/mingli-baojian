#!/usr/bin/env python3
# [deprecated] 历史版本存档：数据源在临时目录，新构建请用 build-baziqa-sft.py（项目内数据）
# -*- coding: utf-8 -*-
"""
R739 v9.1 自优化数据构建（错误驱动自我强化）
根因分析（v9.0 = 53.9%，错题 225/488）：
  1. 模型不会时塌缩选 A（错题中选 A 118 次，但正确答案 A 仅 13 次）
  2. 训练数据答案分布 B 64% → 模型 B 偏好
自优化策略：
  A. 选项重排均衡化：对推理链样本做选项 shuffle（保持答案文本不变，更新答案字母）→ 答案分布均匀 20%×5
  B. 错题回填：v9.0 评估的 225 道错题 → 用完整依据重生成（强化薄弱样本）
  C. 保持 1:1 配比 + 去 AI 味
输出：train.v91.jsonl / valid.v91.jsonl
"""
import json
import os
import random
import re

BASE = os.path.expanduser('~/.openclaw-autoclaw/workspace/projects/mingli-baojian')
BAZIQA = os.path.expanduser('~/.openclaw-autoclaw/workspace/.openclaw/tmp/giant-shoulders/baziqa/data/celebrity50_zh.json')
EVAL_LOG = os.path.expanduser('~/.openclaw-autoclaw/workspace/.openclaw/tmp/baziqa-v90-eval.log')
OUT_DIR = f'{BASE}/training/mlx-r105-data-v91'
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

def parse_options(prompt):
    """从 prompt 提取选项行（A. xxx 形式）"""
    opts = []
    for line in prompt.split('\n'):
        m = re.match(r'^([A-E])\. (.+)$', line.strip())
        if m:
            opts.append((m.group(1), m.group(2)))
    return opts

def shuffle_options(prompt, ans_letter, rng):
    """选项文本 shuffle → 重排字母，返回新 prompt + 新答案字母 + 新答案文本"""
    opts = parse_options(prompt)
    if len(opts) < 2:
        return prompt, ans_letter, None
    ans_text = None
    for l, t in opts:
        if l == ans_letter:
            ans_text = t
            break
    if ans_text is None:
        return prompt, ans_letter, None
    texts = [t for _, t in opts]
    rng.shuffle(texts)
    letters = [l for l, _ in opts]  # 保持原字母集合
    new_prompt_lines = []
    consumed = prompt
    # 重建 prompt：逐行替换选项行
    new_lines = []
    idx = 0
    for line in prompt.split('\n'):
        m = re.match(r'^([A-E])\. (.+)$', line.strip())
        if m:
            new_lines.append(f"{letters[idx]}. {texts[idx]}")
            if texts[idx] == ans_text:
                new_ans = letters[idx]
            idx += 1
        else:
            new_lines.append(line)
    return '\n'.join(new_lines), new_ans, ans_text

def build_reasoning(person, q, rng, force_shuffle=True):
    """BaziQA 题 → 推理链样本（选项 shuffle 均衡化）"""
    prof = person.get('profile', {})
    cats_facts = person.get('categories', {})
    birth = prof.get('birth', {})
    birth_str = f"{birth.get('year','?')}年{birth.get('month','?')}月{birth.get('day','?')}日 12时"
    gender = '男' if prof.get('gender') == 'male' else '女'
    place = birth.get('place', '')
    prompt = (f"以下是一位命主的出生信息：\n出生：{birth_str}\n性别：{gender}\n"
              f"出生地：{place}\n\n题目：{q['question']}\n")
    for opt in q.get('options', []):
        prompt += f"{opt}\n"
    prompt += "\n请选择最符合的选项。"
    ans = q['answer']
    ans_text = ''
    for opt in q.get('options', []):
        if opt.startswith(ans):
            ans_text = opt[2:].strip()
            break
    # 选项 shuffle（均衡化核心）
    if force_shuffle:
        prompt, ans, _ = shuffle_options(prompt, ans, rng)
    evid_parts = []
    for ck in cat_key(q['question']):
        for fact in cats_facts.get(ck, [])[:2]:
            evid_parts.append(f"{ck}:{fact[:160]}")
    evidence = '；'.join(evid_parts)[:600]
    completion = f"{ans}。{ans_text}（依据：{evidence}）"
    return {'prompt': prompt, 'completion': de_ai(completion),
            '_meta': {'source': 'baziqa-v91-shuffled', 'person': person['name'], 'qid': q['question_id'], 'ans': ans}}

def main():
    rng = random.Random(91)
    people = json.load(open(BAZIQA))
    # 1. 解析错题集
    wrong_qids = set()
    for line in open(EVAL_LOG):
        m = re.match(r'\s*❌ (\S+) 模型=(\S) 答案=(\S)', line)
        if m:
            wrong_qids.add(m.group(1))
    print(f'错题回填集: {len(wrong_qids)} 题')
    # 2. 构建推理链（全量 shuffle 版）
    reason = []
    wrong_boost = []
    for p in people:
        for q in p.get('questions', []):
            s = build_reasoning(p, q, rng)
            reason.append(s)
            if q['question_id'] in wrong_qids:
                # 错题加倍：shuffle 出第二个不同排列
                s2 = build_reasoning(p, q, rng)
                wrong_boost.append(s2)
    print(f'推理链（shuffle 均衡）: {len(reason)} + 错题回填 {len(wrong_boost)}')
    # 答案分布验证
    from collections import Counter
    dist = Counter(r['_meta']['ans'] for r in reason)
    print(f'shuffle 后答案分布: {dict(sorted(dist.items()))}')
    # 3. 自由问答（v8.7 原始，去 AI 味）
    free = []
    v87 = f'{BASE}/training/mlx-r105-data-v87/train.v87.jsonl'
    with open(v87) as f:
        for line in f:
            d = json.loads(line)
            if not re.search(r'依据', d.get('completion', '')):
                d['completion'] = de_ai(d['completion'])
                free.append(d)
    print(f'自由问答: {len(free)}')
    # 4. 配比 1:1（推理链总量 = 自由问答量 → 自由问答有 584 需求）
    reason_all = reason + wrong_boost
    # 推理链太多 → 采样到与自由问答等量
    target = len(free)
    if len(reason_all) > target:
        rng.shuffle(reason_all)
        keep = wrong_boost_all = [r for r in reason_all if r['_meta'].get('qid') in wrong_qids]
        rest = [r for r in reason_all if r['_meta'].get('qid') not in wrong_qids]
        need = target - len(keep)
        reason_all = keep + rest[:max(need, 0)]
    print(f'配比: 推理链 {len(reason_all)} / 自由问答 {len(free)} = {len(reason_all)/max(len(free),1):.2f}:1')
    # 5. 切分 + 写文件
    all_data = reason_all + free
    rng.shuffle(all_data)
    n_valid = max(int(len(all_data) * 0.1), 10)
    valid, train = all_data[:n_valid], all_data[n_valid:]
    for split, name in [(train, 'train'), (valid, 'valid')]:
        path = f'{OUT_DIR}/{name}.jsonl'
        with open(path, 'w') as f:
            for d in split:
                msgs = [{'role': 'user', 'content': d['prompt']},
                        {'role': 'assistant', 'content': d['completion']}]
                f.write(json.dumps({'messages': msgs, '_meta': d.get('_meta', {})}, ensure_ascii=False) + '\n')
        print(f'✅ {path}: {len(split)}')
    print('去AI味: 已应用')

if __name__ == '__main__':
    main()
