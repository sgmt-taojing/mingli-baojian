#!/usr/bin/env python3
"""名人回测引擎 v1 —— 用真实人生校验断法规则
数据：celebrity-corpus(42人排盘+大运流年) + baziqa(50人事件时间线)
用法：
  python3 backtest-engine.py --rule KB-RULE-career-religion  # 测某规则
  python3 backtest-engine.py --year 2011 --person cixi       # 测某年断语
"""
import json, glob, sys, argparse
from lunar_python import Lunar

def load_corpus():
    people = []
    for f in glob.glob('training/celebrity-corpus/*.json'):
        d = json.load(open(f))
        if d.get('pillars'): people.append(d)
    return people

def load_baziqa():
    return json.load(open('training/baziqa/data/celebrity50_zh.json'))

def backtest_rule(rule_id):
    """对全部名人盘跑指定断法规则，输出命中率"""
    # 规则注册表（持续扩充）
    RULES = {
        'KB-RULE-career-religion': lambda p: check_religion(p),
    }
    people = load_corpus()
    hits, total = 0, 0
    for p in people:
        result = RULES.get(rule_id, lambda x: None)(p)
        if result is not None:
            total += 1
            hits += 1 if result else 0
    return f'规则{rule_id}: 命中 {hits}/{total}'

def check_religion(p):
    """宗教路径检测回测：华盖刑冲/墓库/印星应期 → 名人中修行者是否被抓出"""
    # TODO: 全量实现——先跑通框架
    return None

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--rule'); ap.add_argument('--person'); ap.add_argument('--year', type=int)
    a = ap.parse_args()
    if a.rule: print(backtest_rule(a.rule))
