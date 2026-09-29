#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""从 corpus/liuren-daqquan/卷05.txt（四库本·袖中金）抽取九宗门课体歌诀
→ server/data/lr-keti.json。原典不改写，仅清洗版式标记。"""
import re, json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'corpus/liuren-daqquan/卷05.txt')
OUT = os.path.join(ROOT, 'server/data/lr-keti.json')

txt = open(SRC, encoding='utf-8').read()
parts = re.split(r'\{\{SK anchor\|([^}]*)\}\}', txt)
sections = []  # [(anchor, body)] 保序
for i in range(1, len(parts) - 1, 2):
    sections.append((parts[i], parts[i+1]))

def clean(body):
    t = re.sub(r'\{\{[^}]*\}\}', '', body)   # 去模板标记
    t = t.replace('¶', '').replace('&KR', '')
    t = re.sub(r'[　\s]+', '', t)            # 古籍连排，去空白
    return t.strip()

def grab(anchor_name, occurrence=0):
    hits = [b for a, b in sections if a == anchor_name]
    if len(hits) <= occurrence:
        return None
    return clean(hits[occurrence])

# 元首课无独立锚点：首节「袖中金」正文即元首课（起句「元首卦尊制卑」）
yuanshou = grab('袖中金', 0)
assert yuanshou and yuanshou.startswith('元首卦'), '元首课定位失败: %s' % (yuanshou or '')[:40]

TABLE = {
    '元首': yuanshou,
    '重审': grab('重審課'),
    '涉害': grab('渉害課'),
    '遥克': grab('遥克課'),
    '昴星': grab('昴星課'),
    '别责': grab('别責課'),
    '八专': grab('八專課'),
    '伏吟': grab('伏吟課'),
    '反吟': grab('返吟課'),
}

out = {}
for k, v in TABLE.items():
    assert v, f'{k} 抽取为空'
    # 截断：歌诀核心在前，限 800 字防 prompt 膨胀
    out[k] = {
        'title': k + '课',
        'source': '大六壬大全·卷五·袖中金（文渊阁四库本）',
        'text': v[:800],
    }

os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump(out, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(f'九宗门课体引证表落盘: {OUT}')
for k, v in out.items():
    print(f"  {k}: {len(v['text'])} 字 | {v['text'][:30]}…")
