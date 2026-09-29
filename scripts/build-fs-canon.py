#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""build-fs-canon.py · R-FS-CANON（2026-09-30）
从 KB 原典条目（宅经/葬书/青囊序，四库文渊阁本/维基文库公有领域）按锚点截取 verbatim 段落，
生成 server/data/fs-canon.json——玄空风水报告/排盘页的「原典引证」数据层。
铁律：只做锚点截取，逐段断言锚点命中；取不到即报错退出，绝不手打原文。
"""
import json, re, sqlite3, sys
from pathlib import Path

DB = Path(__file__).parent.parent / 'server' / 'database' / 'yidao.db'
OUT = Path(__file__).parent.parent / 'server' / 'data' / 'fs-canon.json'


def load(title):
    db = sqlite3.connect(f'file:{DB}?mode=ro', uri=True)
    row = db.execute('SELECT content FROM kb_formal WHERE title=?', (title,)).fetchone()
    db.close()
    if not row:
        print(f'[FATAL] KB 无此条目: {title}'); sys.exit(1)
    return row[0]


def norm(s):
    """原典截取后统一去空白换行（Kanripo/维基本行内换行无实义）"""
    return re.sub(r'\s+', '', s)


def excerpt(content, start_anchor, end_anchor=None, length=None, strip_punct=False):
    """锚点截取：start 起，到 end_anchor 止（含）或定长。找不到即 FATAL。"""
    flat = norm(content)
    i = flat.find(norm(start_anchor))
    if i < 0:
        print(f'[FATAL] 锚点未命中: {start_anchor[:20]}…'); sys.exit(1)
    if end_anchor:
        j = flat.find(norm(end_anchor), i)
        if j < 0:
            print(f'[FATAL] 尾锚未命中: {end_anchor[:20]}…'); sys.exit(1)
        seg = flat[i:j + len(norm(end_anchor))]
    else:
        seg = flat[i:i + (length or 120)]
    if strip_punct:
        seg = re.sub(r'[，。：；、？！「」『』（）\(\)\[\]]', '', seg)
    return seg


def main():
    zhaijing = load('原典·宅经·卷上')
    zangshu = load('原典·葬书·內篇')
    qingnang = load('原典·青囊序·青囊序')

    table = {
        # 阳宅总纲：凡宅皆引
        'zonggang': {
            'source': '黄帝宅经·卷上（四库文渊阁本）',
            'quote': excerpt(zhaijing, '故宅者人之本', '若不安即門族衰微'),
        },
        # 风水定义：葬书內篇二
        'dingyi': {
            'source': '葬书·內篇（维基文库公有领域本）',
            'quote': excerpt(zangshu, '氣乘風則散', '藏風次之'),
        },
        # 山水分司：旺山旺向/上山下水局势引证（青囊序核心诀）
        'longshen': {
            'source': '青囊序（四库文渊阁本·唐曾文辿撰）',
            'quote': excerpt(qingnang, '山上龍神不下水', '百里江山一餉間', strip_punct=True),
        },
        # 山管人丁水管财：断旺衰所主
        'dingcai': {
            'source': '青囊序（四库文渊阁本）',
            'quote': excerpt(qingnang, '水是山家血脉精', '水主財禄山人丁', strip_punct=True),
        },
    }

    # 断言：四段非空且长度合理
    for k, v in table.items():
        q = v['quote']
        assert 8 <= len(q) <= 200, f'{k} 长度异常: {len(q)}'
        print(f'✓ {k}: {q[:38]}… ({len(q)}字)')

    OUT.write_text(json.dumps({
        'meta': {'built': '2026-09-30', 'rule': 'KB原典锚点截取，未作改写', 'count': len(table)},
        'table': table,
    }, ensure_ascii=False, indent=1), 'utf-8')
    print(f'[fs-canon] 落盘 {OUT} · {len(table)} 段')


if __name__ == '__main__':
    main()
