#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""由识典卷140源页快照生成无损分节转录稿；不校字、不补文。"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'corpus/jidu-jinshu/jidu-jinshu-juan140-source.md'
TARGET = ROOT / 'corpus/jidu-jinshu/jidu-jinshu-juan140-transcript.md'
raw = SOURCE.read_text(encoding='utf-8')
marker = '## 靈寶領教濟度金書卷之一百四十\n\n'
assert raw.count(marker) == 1
text = raw.split(marker, 1)[1].strip()
sections = [
    ('juan140-kaiyi', '卷一百四十·紫府送星醮仪开仪请圣', '洞微高士開光救苦真人', '开仪 開儀 卫灵咒 衛靈咒 请圣 請聖 紫府 送星'),
    ('juan140-chuxian', '卷一百四十·紫府送星醮仪初献', '具位臣某，謹重誠上啓三清上聖、十極高真、紫微帝君、周天星宰、醮筵内外一切真靈：臣聞函三', '初献 初獻 函三 五行 六甲 十精 东华 東華 南极 南極'),
    ('juan140-yaxian', '卷一百四十·紫府送星醮仪亚献', '具位臣某，謹重誠上啓三清上聖、十極高真、紫微帝君、周天星宰、醮筵内外一切真靈：伏聞紫微拱', '亚献 亞獻 列曜 太岁 太歲 九良 九煞 运限 運限 命身'),
    ('juan140-zhongxian', '卷一百四十·紫府送星醮仪终献告符', '具位臣某，謹重誠上啓\n\n太上無極大道', '终献 終獻 告符 行持 金符 玉烛 玉燭 奉送'),
    ('juan140-songsheng', '卷一百四十·紫府送星醮仪送圣收结', '香官使者、左右龍虎君', '送圣 送聖 香官使者 龙虎君 龍虎君 兰烟 蘭煙 收结 收結'),
]
positions = []
for tag, title, start, words in sections:
    pos = text.find(start)
    assert pos >= 0, f'缺分节起点：{tag}'
    positions.append(pos)
assert positions == sorted(positions), '分节顺序异常'
chunks = []
for i, (tag, title, start, words) in enumerate(sections):
    end = positions[i + 1] if i + 1 < len(sections) else len(text)
    chunk = text[positions[i]:end].strip()
    assert chunk.startswith(start) and len(chunk) >= 100
    chunks.append(chunk)
assert '\n\n'.join(chunks) == text, '分节拼接未无损还原源页正文'

lines = [
    '# 《灵宝领教济度金书》卷一百四十转录稿（识典源页·无损分节）',
    '',
    '- 来源：识典古籍 DZ0466 卷一百四十《紫府送星醮仪》，2026-10-26 获取。',
    '- URL：https://www.shidianguji.com/zh/book/DZ0466/chapter/1lp28tit542sj',
    '- 校勘边界：网络转录单源，trust=0.72，预留道藏书影人工校验；疑似 OCR、异体字与标点均照源页保留。',
    '- 结构校验：开仪请圣、初献、亚献、终献告符、送圣收结五节，拼接逐字还原源页正文。',
    '',
]
for (tag, title, start, words), chunk in zip(sections, chunks):
    lines.extend([
        f'<!--ENTRY:{tag}|原典·灵宝领教济度金书{title}（识典转录）|0.72-->',
        '【典籍來源】《靈寶領教濟度金書》，識典古籍 DZ0466。',
        '【卷次】卷之一百四十，科儀立成品，祈禳通用，紫府送星醮儀。',
        '【古注摘要】源頁未列另行古注，本條不補注、不發揮。',
        '【門類】科儀。',
        '【古例／占斷記錄】本節為紫府送星醮儀儀文，非占斷古例；不作吉凶預測。',
        '【版本異文】僅據識典網頁轉錄，未與道藏書影逐字核對；原字形、標點及疑似 OCR 照源頁保留，待人工校驗。',
        '【原文】',
        chunk,
        '',
        f'關鍵詞：灵宝领教济度金书 靈寶領教濟度金書 卷一百四十 紫府送星醮仪 紫府送星醮儀 祈禳 {words} 识典 識典 人工校验 人工校驗',
        '',
    ])
TARGET.write_text('\n'.join(lines), encoding='utf-8')
print(f'生成 {TARGET.relative_to(ROOT)}：{len(chunks)} 节；无损还原校验通过')
