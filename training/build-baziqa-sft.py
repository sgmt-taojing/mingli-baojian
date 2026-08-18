#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
BaziQA SFT 数据通用构建器（命理宝鉴版）
从 celebrity50_zh.json 构建推理链 SFT 样本（答案 + 事实依据）。

用法：
  # 基础版（v9.0 配方：全量推理链）
  python3 training/build-baziqa-sft.py --out training/mlx-r105-data-vXX --mode basic

  # 错题强化版（v9.2 配方：基础 + 错题辨析排除法）
  python3 training/build-baziqa-sft.py --out training/mlx-r105-data-vXX \
      --mode enhanced --wrong-log training/baziqa-results/v9.0-full488.log

  # 附加自由问答保持 1:1 配比：--free-from training/mlx-r105-data-v87/train.v87.jsonl
修真教训（勿重复 v9.1 错误）：
  - 禁止选项 shuffle（破坏 3B 模型题意-答案关联，v9.1 实测 -8.8pp）
  - 增量训练 base 必须用上一版最优 fused（不是 v8.7）
"""
import argparse
import json
import os
import random
import re

BASE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(BASE, 'baziqa', 'data', 'celebrity50_zh.json')

PHRASES = ['首先，','首先,','其次，','其次,','最后，','最后,','此外，','此外,','综上所述，','综上所述,',
           '总而言之，','总而言之,','总之，','总之,','仅供参考','作为AI','作为一个AI','作为人工智能',
           '作为助手','作为语言模型','希望以上','相信以上','值得注意的是，','不难发现，']


def de_ai(t):
    if not t:
        return t
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


def evidence_for(person, q, max_facts=2, max_len=600):
    parts = []
    cats = person.get('categories', {})
    for ck in cat_key(q['question']):
        for fact in cats.get(ck, [])[:max_facts]:
            parts.append(f"{ck}:{fact[:200]}")
    return '；'.join(parts)[:max_len]


def build_basic(person, q):
    prof = person.get('profile', {})
    birth = prof.get('birth', {})
    prompt = (f"以下是一位命主的出生信息：\n出生：{birth.get('year','?')}年{birth.get('month','?')}月"
              f"{birth.get('day','?')}日 12时\n性别：{'男' if prof.get('gender') == 'male' else '女'}\n"
              f"出生地：{birth.get('place', '')}\n\n题目：{q['question']}\n")
    for opt in q.get('options', []):
        prompt += f"{opt}\n"
    prompt += "\n请选择最符合的选项。"
    ans, ans_text = q['answer'], ''
    for opt in q.get('options', []):
        if opt.startswith(ans):
            ans_text = opt[2:].strip()
            break
    ev = evidence_for(person, q)
    completion = f"{ans}。{ans_text}（依据：{ev}）"
    return prompt, de_ai(completion)


def build_enhanced(person, q):
    """错题辨析版：长依据 + 排除法（教推理而非位置记忆）"""
    prompt, base_comp = build_basic(person, q)
    opts = {}
    for opt in q.get('options', []):
        m = re.match(r'^([A-E])\. (.+)$', opt)
        if m:
            opts[m.group(1)] = m.group(2)
    ans = q['answer']
    excludes = [f"{l}（{opts[l][:40]}）与此命局特征不符" for l in 'ABCDE' if l != ans and l in opts]
    ev = evidence_for(person, q, max_facts=3, max_len=900)
    m = re.match(r'^([A-E])。 (.+?)（依据：', base_comp)
    ans_text = m.group(2) if m else ''
    completion = f"{ans}。{ans_text}（依据：{ev}；辨析：{'；'.join(excludes[:3]) or '其余选项与命局特征不符'}）"
    return prompt, de_ai(completion)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', required=True, help='输出目录')
    ap.add_argument('--mode', choices=['basic', 'enhanced'], default='basic')
    ap.add_argument('--wrong-log', default=None, help='错题评估日志（enhanced 模式必填）')
    ap.add_argument('--free-from', default=None, help='自由问答源 jsonl（保持 1:1 配比）')
    ap.add_argument('--seed', type=int, default=42)
    args = ap.parse_args()

    rng = random.Random(args.seed)
    people = json.load(open(DATA))
    os.makedirs(args.out, exist_ok=True)

    samples = []
    wrong_qids = set()
    if args.mode == 'enhanced':
        if not args.wrong_log or not os.path.exists(args.wrong_log):
            raise SystemExit('enhanced 模式需要 --wrong-log（历史评估日志）')
        for line in open(args.wrong_log):
            m = re.match(r'\s*❌ (\S+) 模型=(\S) 答案=(\S)', line)
            if m:
                wrong_qids.add(m.group(1))
        print(f'错题集: {len(wrong_qids)}')

    for p in people:
        for q in p.get('questions', []):
            if args.mode == 'enhanced' and q['question_id'] in wrong_qids:
                prompt, comp = build_enhanced(p, q)
            else:
                prompt, comp = build_basic(p, q)
            samples.append({'messages': [{'role': 'user', 'content': prompt},
                                         {'role': 'assistant', 'content': comp}],
                            '_meta': {'source': f'baziqa-{args.mode}', 'qid': q['question_id']}})

    if args.free_from:
        free = []
        with open(args.free_from) as f:
            for line in f:
                d = json.loads(line)
                comp = d.get('completion', '')
                if '依据' not in comp:
                    free.append({'messages': [{'role': 'user', 'content': d['prompt']},
                                              {'role': 'assistant', 'content': de_ai(comp)}],
                                 '_meta': {'source': 'free-qa'}})
        print(f'自由问答: {len(free)} / 推理链: {len(samples)} → 配比 {len(samples)/max(len(free),1):.2f}:1')
        samples += free

    rng.shuffle(samples)
    n_valid = max(int(len(samples) * 0.1), 10)
    valid, train = samples[:n_valid], samples[n_valid:]
    for split, name in [(train, 'train'), (valid, 'valid')]:
        with open(os.path.join(args.out, f'{name}.jsonl'), 'w') as f:
            for d in split:
                f.write(json.dumps(d, ensure_ascii=False) + '\n')
        print(f'✅ {name}: {len(split)}')


if __name__ == '__main__':
    main()
