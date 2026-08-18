#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
R739 训练数据去 AI 味清洗脚本
对 SFT 数据 response 字段应用 humanizer-zh 规则，去除 AI 生成痕迹。
规则：删填充短语/三段式连接词/总结升华/破折号堆砌/「不仅…而且…」等。
用法: python3 scripts/de-ai-flavor.py <输入.jsonl> [输出.jsonl]
      python3 scripts/de-ai-flavor.py --dry-run <输入.jsonl>  # 只统计不改写
"""
import json
import re
import sys

# 去 AI 味规则（humanizer-zh 核心模式）
PHRASES = [
    # 三段式连接词
    '首先，', '首先,', '其次，', '其次,', '最后，', '最后,', '再次，', '再次,',
    '第一，', '第二，', '第三，', '一方面，', '另一方面，',
    # 总结/过渡套话
    '此外，', '此外,', '综上所述，', '综上所述,', '总而言之，', '总而言之,',
    '总之，', '总之,', '值得一提的是，', '值得注意的是，', '需要注意的是，',
    '不难发现，', '由此可见，', '换句话说，', '也就是说，',
    # AI 自我指涉
    '仅供参考', '作为AI', '作为一个AI', '作为人工智能', '作为助手', '作为语言模型',
    # 客气结尾
    '希望以上', '希望这些', '相信以上', '如果还有问题', '如有其他问题', '欢迎继续提问',
    '期待为您', '祝您', '以上是关于', '以上就是',
]
# 「不仅…而且…」拆成两个短句的启发式：直接去掉「不仅」「而且」保留内容
DOUBLE_PATTERNS = [
    (re.compile(r'不仅(.{2,30}?)，而且(.{2,30}?)[。，]'), r'\1，也\2。'),
    (re.compile(r'不但(.{2,30}?)，而且(.{2,30}?)[。，]'), r'\1，也\2。'),
]
# 破折号堆砌：连续 2 个以上
DASH_STACK = re.compile(r'——[——]+')

def de_ai_flavor(text):
    """单条文本去 AI 味"""
    if not isinstance(text, str):
        return text
    t = text
    hits = 0
    # 1. 删固定短语
    for p in PHRASES:
        if p in t:
            hits += t.count(p)
            t = t.replace(p, '')
    # 2. 「不仅…而且…」→「…也…」
    for pat, repl in DOUBLE_PATTERNS:
        t, n = pat.subn(repl, t)
        hits += n
    # 3. 破折号堆砌
    t, n = DASH_STACK.subn('——', t)
    hits += n
    # 4. 清理因删词产生的多余逗号/空格
    t = re.sub(r'，\s*，', '，', t)
    t = re.sub(r'^\s*[，,]\s*', '', t)
    t = re.sub(r'\s{2,}', ' ', t)
    return t, hits

def process_file(inpath, outpath=None):
    total = 0
    changed = 0
    total_hits = 0
    lines = []
    with open(inpath, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                d = json.loads(line)
            except json.JSONDecodeError:
                lines.append(line)
                continue
            total += 1
            # 处理 response / output / completion 字段
            for key in ('response', 'output', 'completion'):
                if key in d and isinstance(d[key], str):
                    clean, hits = de_ai_flavor(d[key])
                    if hits > 0:
                        d[key] = clean
                        changed += 1
                        total_hits += hits
            # 处理 messages 格式
            if 'messages' in d and isinstance(d['messages'], list):
                for m in d['messages']:
                    if m.get('role') == 'assistant' and isinstance(m.get('content'), str):
                        clean, hits = de_ai_flavor(m['content'])
                        if hits > 0:
                            m['content'] = clean
                            changed += 1
                            total_hits += hits
            lines.append(json.dumps(d, ensure_ascii=False))
    if outpath:
        with open(outpath, 'w', encoding='utf-8') as f:
            f.write('\n'.join(lines) + '\n')
    return total, changed, total_hits

if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    dry = '--dry-run' in sys.argv
    if not args:
        print('用法: de-ai-flavor.py <输入.jsonl> [输出.jsonl] [--dry-run]')
        sys.exit(1)
    inpath = args[0]
    outpath = None if len(args) < 2 else args[1]
    if dry:
        outpath = None
    total, changed, hits = process_file(inpath, outpath)
    print(f'总行数: {total}')
    print(f'去 AI 味命中: {changed} 条 / {hits} 处')
    print(f'命中率: {changed/max(total,1)*100:.1f}%')
    if outpath:
        print(f'已写清洗后: {outpath}')
    elif dry:
        print('(dry-run 未改写)')
