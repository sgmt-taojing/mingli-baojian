#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
BaziQA 命理能力评估（命理宝鉴版）
评估 LLM 在八字命理推理的准确率（全量 488 题：50 名人 × ~10 题）

用法：
  python3 training/eval-baziqa.py                          # 默认 8960 生产
  python3 training/eval-baziqa.py --api http://127.0.0.1:8962/v1/chat/completions
  python3 training/eval-baziqa.py --tag v9.2 --limit 80   # 打标签 + 前 8 人抽样
输出：
  training/baziqa-results/<tag>-full<总题数>.log          # 逐题结果 + 汇总
"""
import argparse
import json
import os
import re
import sys
import urllib.request
from collections import Counter
from datetime import datetime

BASE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(BASE, 'baziqa', 'data', 'celebrity50_zh.json')
RESULTS_DIR = os.path.join(BASE, 'baziqa-results')


def ask(api, prompt, max_tokens=512):  # v2.2: 200→512（v9.2 起输出带完整选项辨析，200 会截断字母）
    body = json.dumps({
        'messages': [{'role': 'user', 'content': prompt}],
        'max_tokens': max_tokens,
        'temperature': 0.2,
    }).encode()
    req = urllib.request.Request(api, data=body, headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            d = json.loads(r.read().decode())
            return d['choices'][0]['message']['content']
    except Exception as e:
        return f'[ERR] {e}'


def build_prompt(person, q):
    prof = person.get('profile', {})
    birth = prof.get('birth', {})
    birth_str = f"{birth.get('year','?')}年{birth.get('month','?')}月{birth.get('day','?')}日 12时"
    gender = '男' if prof.get('gender') == 'male' else '女'
    place = birth.get('place', '')
    prompt = (f"以下是一位命主的出生信息：\n出生：{birth_str}\n性别：{gender}\n"
              f"出生地：{place}\n\n题目：{q['question']}\n")
    for opt in q.get('options', []):
        prompt += f"{opt}\n"
    prompt += "\n请选择最符合的选项。"
    return prompt


def extract_answer(text):
    """v2.1 五级提取：fence / leading / punct 全角 / keyword / lone"""
    if not text:
        return ''
    t = text.strip().replace('<s>', '').replace('</s>', '').strip()
    # 1) fence 格式: ```B``` 或 ```\nB\n```
    m = re.search(r'```\s*([A-E])\s*```', t)
    if m:
        return m.group(1)
    # 2) 开头字母: 'B' / 'B。xxx' / 'B xxx'
    if t and t[0] in 'ABCDE':
        return t[0]
    # 3) 括号（含全角）: (B) / （B）
    m = re.search(r'[（(]\s*([A-E])\s*[）)]', t)
    if m:
        return m.group(1)
    # 4a) 强信号：最终答案/答案是/选项是/选择项是/选择是/boxed{X}
    for pat in [
        r'最终答案\s*[是为：:\s]*([A-E])',
        r'(?:选项|选择项|选择)\s*[是为：:\s]*([A-E])',
        r'答案\s*[是为：:\s]*([A-E])',
        r'\\boxed\s*\{\s*([A-E])\s*\}',
    ]:
        m = re.search(pat, t)
        if m:
            return m.group(1)
    # 4b) 末兑：单纯"是" + X（限最后 1000 字，避免误伤选项列表）
    tail = t[-1000:]
    m = re.search(r'(?:是)\s*[为：:]?\s*([A-E])\b', tail)
    if m:
        return m.group(1)
    # 5) 孤立字母: '... B ...'（前后非字母数字）
    m = re.search(r'(?<![A-Za-z0-9])([A-E])(?![A-Za-z0-9])', tail)
    if m:
        return m.group(1)
    return ''


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--api', default='http://127.0.0.1:8960/v1/chat/completions')
    ap.add_argument('--tag', default=None, help='版本标签（如 v9.2），用于结果文件名')
    ap.add_argument('--limit', type=int, default=0, help='限制人数（0=全量 50 人）')
    args = ap.parse_args()

    people = json.load(open(DATA))
    if args.limit > 0:
        people = people[:args.limit]
    tag = args.tag or ('eval-' + datetime.now().strftime('%m%d%H%M'))
    out_path = os.path.join(RESULTS_DIR, f'{tag}-full488.log' if not args.limit else f'{tag}-sample{len(people)}.log')
    os.makedirs(RESULTS_DIR, exist_ok=True)

    total = correct = 0
    per_person = []
    model_dist, ans_dist, wrong_model_dist = Counter(), Counter(), Counter()
    log_lines = [f'BaziQA 评估 · {tag} · {datetime.now().isoformat()} · API={args.api}']
    for p in people:
        qs = p.get('questions', [])[:10]
        p_ok = 0
        for q in qs:
            ans = ask(args.api, build_prompt(p, q))
            letter = extract_answer(ans)
            ok = letter == q['answer']
            if ok:
                p_ok += 1
            total += 1
            correct += ok
            model_dist[letter] += 1
            ans_dist[q['answer']] += 1
            if not ok:
                wrong_model_dist[letter] += 1
            log_lines.append(f"  {'✅' if ok else '❌'} {q['question_id']} 模型={letter or '?'} 答案={q['answer']}")
        per_person.append((p['name'], p_ok, len(qs)))
        log_lines.append(f'→ {p["name"]}: {p_ok}/{len(qs)}')
        print(f'→ {p["name"]}: {p_ok}/{len(qs)}', flush=True)
        with open(out_path, 'w') as f:  # v2.4: 增量写盘，崩溃也可看进度
            f.write('\n'.join(log_lines) + '\n')

    rate = correct / max(total, 1) * 100
    log_lines.append('')
    log_lines.append(f'=== 结果: {correct}/{total} = {rate:.1f}% ===')
    log_lines.append(f'模型答案分布: {dict(sorted(model_dist.items()))}')
    log_lines.append(f'正确答案分布: {dict(sorted(ans_dist.items()))}')
    log_lines.append(f'错题中模型答案分布: {dict(sorted(wrong_model_dist.items()))}')
    with open(out_path, 'w') as f:
        f.write('\n'.join(log_lines) + '\n')
    print(f'=== 结果: {correct}/{total} = {rate:.1f}% ===')
    print(f'已写: {out_path}')
    return 0 if total else 1


if __name__ == '__main__':
    sys.exit(main())
