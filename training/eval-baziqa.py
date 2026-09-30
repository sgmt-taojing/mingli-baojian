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
import random
import re
import sys
import urllib.request
from collections import Counter
from datetime import datetime

BASE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(BASE, 'baziqa', 'data', 'celebrity50_zh.json')
RESULTS_DIR = os.path.join(BASE, 'baziqa-results')
LETTERS = 'ABCDE'


def shuffle_options(q, enable):
    """R-BQA-DEBIAS（2026-09-30）：选项乱序去 A 锚定偏差。
    返回 (展示选项, 正确答案展示字母, 展示字母→原字母映射)。乱序种子=qid，可复现。"""
    opts = q.get('options', [])
    if not enable or not opts:
        return opts, q['answer'], {}
    bodies = []
    for o in opts:
        m = re.match(r'^\s*([A-E])[.、．)]\s*(.*)$', o)
        bodies.append(m.group(2) if m else o)
    order = list(range(len(opts)))
    random.Random('debias:' + str(q.get('question_id', ''))).shuffle(order)
    orig_idx = LETTERS.index(q['answer']) if q['answer'] in LETTERS else -1
    disp, m2o, new_ans = [], {}, ''
    for di, oi in enumerate(order):
        disp.append(f'{LETTERS[di]}. {bodies[oi]}')
        m2o[LETTERS[di]] = LETTERS[oi]
        if oi == orig_idx:
            new_ans = LETTERS[di]
    return disp, new_ans, m2o


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


def build_prompt(person, q, disp_options=None, assist=False, noleak=False):
    prof = person.get('profile', {})
    birth = prof.get('birth', {})
    birth_str = f"{birth.get('year','?')}年{birth.get('month','?')}月{birth.get('day','?')}日 12时"
    gender = '男' if prof.get('gender') == 'male' else '女'
    place = birth.get('place', '')
    prompt = (f"以下是一位命主的出生信息：\n出生：{birth_str}\n性别：{gender}\n"
              f"出生地：{place}\n")
    # R-BQA-NOLEAK（2026-09-30）：ATTR3 实证 58% 完全偏离错题是模型把题当史实问答硬答
    # （题库人名/事件文本未脱敏的结构泄漏），声明禁史实知识把模型逼回排盘推理路径
    if noleak:
        prompt += ("重要：请严格仅凭命理推理作答（排盘→大运→流年→十神应期），"
                   "不得使用你对该人物生平、事件时间的任何既有知识；即使认出此人，也当作陌生人命盘推演。\n")
    # R-BQA-ASSIST（2026-09-30）：生产仿真——排盘引擎永远先给干支，纯算术不该占用推理层
    # 干支换算题 bare-LLM 错误率 76%（心算缺陷），辅助口径隔离出真正的推理能力
    if assist:
        try:
            y = int(birth.get('year'))
            gz = '甲乙丙丁戊己庚辛壬癸'[(y - 4) % 10] + '子丑寅卯辰巳午未申酉戌亥'[(y - 4) % 12]
            prompt += f"排盘参考：{y}年干支为{gz}年。\n"
        except (TypeError, ValueError):
            pass
    prompt += f"\n题目：{q['question']}\n"
    for opt in (disp_options if disp_options is not None else q.get('options', [])):
        prompt += f"{opt}\n"
    # R-BQA-FMT（2026-09-30）：末行格式强约束，救空白未答
    prompt += "\n请选择最符合的选项。最后一行只写：答案：X（X 为选项字母）。"
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
    # 6) R-BQA-FMT 兜底：尾部反向找最后一个孤立字母（模型先答后论述的场景）
    ms = re.findall(r'(?<![A-Za-z0-9])([A-E])(?![A-Za-z0-9])', t)
    if ms:
        return ms[-1]
    return ''


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--api', default='http://127.0.0.1:8960/v1/chat/completions')
    ap.add_argument('--tag', default=None, help='版本标签（如 v9.2），用于结果文件名')
    ap.add_argument('--limit', type=int, default=0, help='限制人数（0=全量 50 人）')
    ap.add_argument('--offset', type=int, default=0, help='起始人序号（分段跑用，0 起）')
    ap.add_argument('--data', default=DATA, help='题库 json 路径（默认 celebrity50_zh.json）')
    ap.add_argument('--shuffle', action='store_true', help='选项乱序去偏（R-BQA-DEBIAS，乱序种子=qid 可复现）')
    ap.add_argument('--assist', action='store_true', help='附出生年干支提示（R-BQA-ASSIST 生产仿真，隔离推理层）')
    ap.add_argument('--noleak', action='store_true', help='禁史实知识声明（R-BQA-NOLEAK，逼回排盘推理路径）')
    ap.add_argument('--qids', default=None, help='只跑指定题号（逗号分隔或 @文件路径，R-BQA-ATTR3 错题定向复跑）')
    ap.add_argument('--save-raw', default=None, help='逐题推理原文落 JSONL（qid/prompt/response/extracted/answer）')
    args = ap.parse_args()

    qid_filter = None
    if args.qids:
        src = open(args.qids[1:]).read() if args.qids.startswith('@') else args.qids
        qid_filter = set(x.strip().strip('"') for x in re.split(r'[,\s]+', src) if x.strip())

    raw_fp = open(args.save_raw, 'a', encoding='utf-8') if args.save_raw else None

    people = json.load(open(args.data))
    if args.offset > 0:
        people = people[args.offset:]
    if args.limit > 0:
        people = people[:args.limit]
    tag = args.tag or ('eval-' + datetime.now().strftime('%m%d%H%M'))
    if not args.limit and not args.offset:
        out_path = os.path.join(RESULTS_DIR, f'{tag}-full488.log')
    else:
        out_path = os.path.join(RESULTS_DIR, f'{tag}-p{args.offset + 1}-{args.offset + len(people)}.log')
    os.makedirs(RESULTS_DIR, exist_ok=True)

    total = correct = 0
    per_person = []
    model_dist, ans_dist, wrong_model_dist = Counter(), Counter(), Counter()
    log_lines = [f'BaziQA 评估 · {tag} · {datetime.now().isoformat()} · API={args.api}' + (' · shuffle=on' if args.shuffle else '') + (' · assist=on' if args.assist else '') + (' · noleak=on' if args.noleak else '')]
    for p in people:
        qs = p.get('questions', [])[:10]
        if qid_filter is not None:
            qs = [q for q in qs if q.get('question_id') in qid_filter]
            if not qs:
                continue
        p_ok = 0
        for q in qs:
            disp_opts, disp_ans, m2o = shuffle_options(q, args.shuffle)
            prompt = build_prompt(p, q, disp_opts, assist=args.assist, noleak=args.noleak)
            ans = ask(args.api, prompt)
            letter_raw = extract_answer(ans)
            letter = m2o.get(letter_raw, letter_raw) if args.shuffle else letter_raw  # 映射回原选项口径
            ok = letter == q['answer']
            if raw_fp:
                raw_fp.write(json.dumps({
                    'qid': q['question_id'], 'person': p['name'], 'ok': ok,
                    'extracted': letter, 'answer': q['answer'],
                    'prompt': prompt, 'response': ans,
                }, ensure_ascii=False) + '\n')
                raw_fp.flush()
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
