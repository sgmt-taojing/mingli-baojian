#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""由识典卷139源页快照生成无损分节转录稿；不校字、不补文。"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'corpus/jidu-jinshu/jidu-jinshu-juan139-source.md'
TARGET = ROOT / 'corpus/jidu-jinshu/jidu-jinshu-juan139-transcript.md'
raw = SOURCE.read_text(encoding='utf-8')
marker = '## 靈寶領教濟度金書卷之一百三十九\n\n'
assert raw.count(marker) == 1
text = raw.split(marker, 1)[1].strip()
sections = [
    ('juan139-kaiyi', '卷一百三十九·周天灯仪开仪祝香', '問七', '开仪 開儀 步虚 步虛 洒净 灑淨 祝香 星灯 星燈'),
    ('juan139-sanyuan', '卷一百三十九·三垣帝座与勾陈华盖', '衆等志心皈命無上玉虚天、紫微', '三垣 紫微 太微 天市 勾陈 勾陳 华盖 華蓋 帝座'),
    ('juan139-riyue', '卷一百三十九·太阳太阴二景', '衆等志心皈命無上玉虚天太陽', '太阳 太陽 太阴 太陰 郁仪 鬱儀 结璘 結璘 二景'),
    ('juan139-wude', '卷一百三十九·五方五德星君', '衆等志心皈命無上玉虚天，重華', '五方 五德 五星 岁星 歲星 荧惑 熒惑 太白 填星'),
    ('juan139-siyu', '卷一百三十九·四余四曜', '衆等志心皈命天一紫炁星君', '四余 四餘 四曜 紫炁 月孛 罗睺 羅㬋 计都 計都'),
    ('juan139-nanbeidou', '卷一百三十九·南辰六阙与北极九府', '衆等志心皈命南辰六闕', '南辰 南斗 六阙 六闕 北极 北極 九府 延生 延寿 延壽'),
    ('juan139-dongfang', '卷一百三十九·东方苍龙七宿', '衆等志心皈命東方蒼龍', '东方 東方 苍龙 蒼龍 角亢氐房心尾箕 七宿'),
    ('juan139-nanfang', '卷一百三十九·南方朱雀七宿', '衆等志心皈命南方朱雀', '南方 朱雀 井鬼柳星张翼轸 井鬼柳星張翼軫 七宿'),
    ('juan139-xifang', '卷一百三十九·西方白虎七宿', '衆等志心皈命西方白虎', '西方 白虎 奎娄胃昴毕觜参 奎婁胃昴畢觜參 七宿'),
    ('juan139-beifang', '卷一百三十九·北方玄武七宿', '衆等志心皈命北方玄武', '北方 玄武 斗牛女虚危室璧 斗牛女虚危室壁 七宿'),
    ('juan139-shierchen', '卷一百三十九·周天分野十二辰次', '衆等志心皈命周天分野', '周天 分野 十二辰 十二次 星君 躔次'),
    ('juan139-shouyi', '卷一百三十九·周天星灯收仪', '向來關祝周天星燈一座', '收仪 收儀 周天星灯 周天星燈 福生无量 福生無量 不可思议 不可思議'),
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
    '# 《灵宝领教济度金书》卷一百三十九转录稿（识典源页·无损分节）',
    '',
    '- 来源：识典古籍 DZ0466 卷一百三十九《周天灯仪》，2026-10-26 获取。',
    '- URL：https://www.shidianguji.com/zh/book/DZ0466/chapter/1lp28thly173c',
    '- 校勘边界：网络转录单源，trust=0.72，预留道藏书影人工校验；疑似 OCR、异体字与标点均照源页保留。',
    '- 结构校验：十二个自然仪节，按原顺序拼接必须逐字还原源页正文；不据搜索摘要或他卷补改。',
    '',
]
for (tag, title, start, words), chunk in zip(sections, chunks):
    lines.extend([
        f'<!--ENTRY:{tag}|原典·灵宝领教济度金书{title}（识典转录）|0.72-->',
        '【典籍來源】《靈寶領教濟度金書》，識典古籍 DZ0466。',
        '【卷次】卷之一百三十九，科儀立成品，祈禳通用，周天燈儀。',
        '【古注摘要】源頁未列另行古注，本條不補注、不發揮。',
        '【門類】科儀。',
        '【古例／占斷記錄】本節為周天燈儀儀文，非占斷古例；不作吉凶預測。',
        '【版本異文】僅據識典網頁轉錄，未與道藏書影逐字核對；原字形、標點及疑似 OCR 照源頁保留，待人工校驗。',
        '【原文】',
        chunk,
        '',
        f'關鍵詞：灵宝领教济度金书 靈寶領教濟度金書 卷一百三十九 周天灯仪 周天燈儀 祈禳 {words} 识典 識典 人工校验 人工校驗',
        '',
    ])
TARGET.write_text('\n'.join(lines), encoding='utf-8')
print(f'生成 {TARGET.relative_to(ROOT)}：{len(chunks)} 节；无损还原校验通过')
