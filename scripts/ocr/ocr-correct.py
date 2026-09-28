#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ocr-correct.py — OCR 后校正（本地 MLX mingli-sft 模型，逐列单行模式）

输入 ocr-page.py 的逐列文本，逐行（列）送 MLX 校形近/音近错字。
红线：仅修明显 OCR 错字，不改写原典；□（未识别）保留不猜；
      校正稿与 raw 双份输出，raw 留档备审计。
用法: python3 ocr-correct.py <ocr.txt> [corrected.txt]
"""
import sys, json, re, urllib.request

MLX = 'http://127.0.0.1:8960/v1/chat/completions'
MODEL = 'mingli-sft-v9.2-7b'

PROMPT = """下面是紫微斗数古籍 OCR 识别的一列文字，有错别字。请只修改明显的 OCR 错字（形近/音近），保留「。」和「□」，不增字不删字不解释，直接输出修改后的这一列：

%s"""


def clean(resp):
    """剥模型输出里的代码块/json/引号等杂质"""
    resp = resp.strip()
    resp = re.sub(r'^```[a-z]*\n?|```$', '', resp, flags=re.M).strip()
    for line in resp.splitlines():
        line = line.strip().strip('"').strip()
        if line and not line.startswith(('{', '}', '[')):
            return line
    return resp


def correct_line(line):
    body = json.dumps({
        'model': MODEL,
        'messages': [{'role': 'user', 'content': PROMPT % line}],
        'temperature': 0.0,
        'max_tokens': 512,
    }).encode()
    req = urllib.request.Request(MLX, data=body, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=120) as r:
        return clean(json.load(r)['choices'][0]['message']['content'])


def main():
    src = sys.argv[1]
    lines = open(src, encoding='utf-8').read().splitlines()
    fixed = []
    for i, ln in enumerate(lines):
        if not ln.strip() or ln.strip() in ('□', '。'):
            fixed.append(ln)
            continue
        try:
            out = correct_line(ln.strip())
            # 兜底：输出长度偏离原文 ±50% 视为失控，保留原行
            if not out or abs(len(out) - len(ln.strip())) > max(6, len(ln.strip()) * 0.5):
                out = ln
            fixed.append(out)
        except Exception as e:
            print(f'第 {i + 1} 列校正失败，保留原文: {e}', file=sys.stderr)
            fixed.append(ln)
    out_path = sys.argv[2] if len(sys.argv) > 2 else src.replace('.txt', '') + '.corrected.txt'
    open(out_path, 'w', encoding='utf-8').write('\n'.join(fixed) + '\n')
    print(f'已写 {out_path}（{len(fixed)} 列）', file=sys.stderr)


if __name__ == '__main__':
    main()
