#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""attr3 推理原文分析器（R-BQA-ATTR3 · 2026-09-30）

读 v92-attr3-dev36-raw.jsonl，对 36 道完全偏离错题的模型推理文本做断点归类：
  A. 大运起算错（起运岁数/顺逆方向误判，后面全盘皆错）
  B. 十神定位错（把事件的十神取错，如婚灾取错配偶星）
  C. 流年干支本身算错（算术层，assist 可救的漏网）
  D. 逻辑链断裂（推理正确但末行选错，FMT 漏网）
  E. 胡乱断言（无论理直接给年份）
输出：每题一行分类 + 汇总计数 + 典型摘录，落 DELIVERY 供报告引用。
用法：/usr/bin/python3 scripts/analyze-attr3-raw.py
"""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / 'training' / 'baziqa-results' / 'v92-attr3-dev36-raw.jsonl'

def classify(resp):
    t = resp or ''
    if '[ERR]' in t:
        return 'X-请求失败', ''
    has_dayun = bool(re.search(r'大运|起运|顺行|逆行|阳男|阴男', t))
    has_shishen = bool(re.search(r'正官|七杀|正财|偏财|正印|偏印|食神|伤官|比肩|劫财|十神', t))
    has_liunian = bool(re.search(r'流年|太岁|\d{4}年.{0,4}(?:干支|年干)', t))
    # 推理里出现的年份集合
    years = re.findall(r'((?:19|20)\d{2})\s*年', t)
    if not has_dayun and not has_shishen and not has_liunian:
        return 'E-胡乱断言', '无论理关键词'
    if has_liunian and not has_dayun:
        return 'C-流年直断跳大运', f'推理中年份:{years[:6]}'
    if has_dayun and not has_shishen:
        return 'A-大运起算主导', f'推理中年份:{years[:6]}'
    return 'B-十神应期链', f'推理中年份:{years[:6]}'

def main():
    if not RAW.exists():
        print('raw 文件未生成:', RAW); return 1
    rows = [json.loads(l) for l in RAW.read_text(encoding='utf-8').splitlines() if l.strip()]
    print(f'共 {len(rows)} 题推理原文')
    from collections import Counter
    cnt = Counter()
    for r in rows:
        cls, note = classify(r['response'])
        cnt[cls] += 1
        print(f"{r['qid']} {r['person']} {'✅' if r['ok'] else '❌'} {cls} {note}")
    print('--- 汇总 ---')
    for k, v in cnt.most_common():
        print(f'{k}: {v}')

if __name__ == '__main__':
    sys.exit(main())
