#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""从 corpus/meihua-yishu/juan2.txt（梅花易数·体用生克篇）抽取
体用总诀 5 关系断语 + 18 类分类占断语 → server/data/mh-tiyong.json。
逐条行首锚断言，原文不改写。"""
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'corpus/meihua-yishu/juan2.txt')
OUT = os.path.join(ROOT, 'server/data/mh-tiyong.json')

lines = open(SRC, encoding='utf-8').read().splitlines()

def line(n):
    return lines[n - 1].strip()

def grab(n, lead):
    t = line(n)
    assert t.startswith(lead), f'第{n}行锚错位: 期望「{lead}」实为「{t[:16]}」'
    return t

ZONGJU = grab(25, '體用之間，比和則吉')
ZONGGANG = '體卦為主，用卦為事，互卦為事之中間，刻應變卦為事之終。'
assert ZONGGANG in line(21), '总纲锚错位'

# 体用 5 关系断语（从总诀中精确切分并断言）
REL = {
    '体克用': '體克用，諸事吉',
    '用克体': '用克體，諸事凶',
    '体生用': '體生用，有耗失之患',
    '用生体': '用生體，有進益之喜',
    '比和':   '體用比和，則百事順遂',
}
for v in REL.values():
    assert v in ZONGJU, f'关系断语不在总诀: {v}'

CATS = {
    '天时': grab(59, '凡占天時'),
    '人事': grab(63, '人事之占'),
    '家宅': grab(67, '凡占家宅'),
    '屋舍': grab(69, '凡占屋舍'),
    '婚姻': grab(71, '占婚姻以體為主') + grab(73, '占婚，體為所占之家'),
    '生产': grab(77, '占生產'),
    '饮食': grab(79, '凡占飲食'),
    '求谋': grab(83, '占求謀'),
    '求名': grab(85, '凡占求名'),
    '求财': grab(87, '占求財'),
    '交易': grab(91, '占交易'),
    '出行': grab(93, '占出行'),
    '行人': grab(97, '占行人'),
    '谒见': grab(101, '占謁見'),
    '失物': grab(103, '占失物'),
    '疾病': grab(107, '凡占疾病'),
    '官讼': grab(113, '占官訟'),
    '坟墓': grab(115, '占墳墓'),
}
assert len(CATS) == 18

out = {
    'source': '梅花易数·体用生克篇（卷二）',
    'built': '2026-09-29',
    'zongGang': ZONGGANG,
    'zongJu': ZONGJU,
    'relations': REL,
    'categories': CATS,
}
os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump(out, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(f'OK {OUT} · 5 关系 + 18 类分类占')
print('  求财示例:', CATS['求财'][:50], '…')
