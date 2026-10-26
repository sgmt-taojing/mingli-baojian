#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""由识典卷136-138源页快照生成无损分节转录稿；不校字、不补文、不混异版。"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE = ROOT / 'corpus/jidu-jinshu'

CONFIGS = [
    dict(
        juan=136, marker='## 靈寶領教濟度金書卷之一百三十六問五\n\n',
        url='https://www.shidianguji.com/zh/book/DZ0466/chapter/1lp28tew2jh8g',
        ritual='分燈儀、北斗燈儀', count=14,
        sections=[
            ('juan136-fendeng-kaiyi', '分灯仪开仪奏启', '洞微高士開光救苦真人寧全真授', '分灯 分燈 三宝 三寶 奏启 奏啓 灯光 燈光'),
            ('juan136-mingdeng-zhou', '分灯仪明灯咒', '法師，秉燈在手，宣明燈咒：', '明灯咒 明燈咒 元始开图 元始開圖 九阳 九陽'),
            ('juan136-fendeng-shouyi', '分灯仪分辉收仪', '祖炁凝華，運二儀而成象；', '分辉 分輝 点灯 點燈 流光法界 灯光普照 燈光普照'),
            ('juan136-beidou-kaiyi', '北斗灯仪开仪祝香', '稽首皈依無極大道，志心稱念燈光普照天尊', '北斗 开仪 開儀 祝香 九晨 紫微 北极 北極'),
            ('juan136-tanlang', '北斗贪狼阳明玉皇君', '衆等志心皈命中天大聖、北斗貪狼陽明玉皇君', '贪狼 貪狼 阳明 陽明 延生 天元'),
            ('juan136-jumen', '北斗巨门阴精玉皇君', '等志心皈命中天大聖北斗巨門陰精玉皇君', '巨门 巨門 阴精 陰精 度厄 地元'),
            ('juan136-lucun', '北斗禄存玉皇君', '衆等志心皈命中天大聖北斗禄存玉皇君', '禄存 禄存 保命 日元'),
            ('juan136-wenqu', '北斗文曲玄冥玉皇君', '衆等志心皈命中天大聖。北斗文曲玄冥玉皇君', '文曲 玄冥 益算 益筭 月元'),
            ('juan136-lianzhen', '北斗廉贞丹元玉皇君', '衆等志心皈命中天大聖北斗廉貞丹元玉皇君', '廉贞 廉貞 丹元 消灾 消災 江元'),
            ('juan136-wuqu', '北斗武曲北极玉皇君', '衆等志心皈命中天大聖北斗武曲北極玉皇君', '武曲 北极 北極 扶衰 河元'),
            ('juan136-pojun', '北斗破军天关玉皇君', '衆等，志心皈命中天大聖北斗破軍天關玉皇君', '破军 破軍 天关 天關 散祸 散禍 海元'),
            ('juan136-waifu', '北斗外辅洞元玉皇君', '衆等志心皈命中天大聖北斗外輔洞元玉皇君', '外辅 外輔 洞元 洞明'),
            ('juan136-neibi', '北斗内弼隐元玉皇君', '衆等志心皈命中天大聖北斗内弼隱元玉皇君', '内弼 内弼 隐元 隱元 紫微'),
            ('juan136-beidou-shouyi', '北斗星灯收仪', '向來關祝北斗星燈功德周圓。', '北斗 收仪 收儀 福生无量 福生無量 长生保命 長生保命'),
        ]),
    dict(
        juan=137, marker='## 靈寶領教濟度金書卷之一百三十七\n\n',
        url='https://www.shidianguji.com/zh/book/DZ0466/chapter/1lp28tff0atk8',
        ritual='南斗燈儀', count=9,
        sections=[
            ('juan137-kaiyi', '南斗灯仪开仪祝香', '問六洞微高士開光敕苦真人', '南斗 开仪 開儀 祝香 六司 南极 南極'),
            ('juan137-tianfu', '南斗天府司命真皇君', '衆等志心皈命南斗大聖、天府司命真皇君', '天府 司命 镇国 鎮國 天政'),
            ('juan137-tianxiang', '南斗天相司录真皇君', '衆等志心皈命南斗大聖、天相司録真皇君', '天相 司录 司録 镇岳 鎮嶽 地政'),
            ('juan137-tianliang', '南斗天梁延寿真皇君', '衆等志心皈命南斗大聖天梁延壽真皇君', '天梁 延寿 延壽 保命 春政'),
            ('juan137-tiantong', '南斗天同益算真皇君', '衆等，志心皈命南斗大聖天同益筭真皇君', '天同 益算 益筭 保生 夏政'),
            ('juan137-tianshu', '南斗天枢度厄真皇君', '衆等志心皈命南斗大聖、天樞度厄真皇君', '天枢 天樞 度厄 炼魂 鍊魂 秋政'),
            ('juan137-tianji', '南斗天机上行真皇君', '衆等志心皈命南斗大聖天機上生真皇君', '天机 天機 上行 上生 冬政'),
            ('juan137-dazhou', '南斗众诵大咒', '衆誦大咒，旋繞一帀，', '南斗 大咒 火宫 火宮 寿籍 壽籍'),
            ('juan137-shouyi', '南斗星灯收仪', '向來關祝南斗星燈功德周圓。', '南斗 收仪 收儀 福生无量 福生無量 不可思议 不可思議'),
        ]),
    dict(
        juan=138, marker='## 靈寶領教濟度金書卷之一百三十八\n\n',
        url='https://www.shidianguji.com/zh/book/DZ0466/chapter/1lp28thj1mbdu',
        ritual='十一列曜燈儀', count=13,
        sections=[
            ('juan138-kaiyi', '十一列曜灯仪开仪祝香', '洞微高士開光救苦真人寧全真授', '十一列曜 十一曜 开仪 開儀 祝香 七政 四余 四餘'),
            ('juan138-taiyang', '太阳郁仪帝君', '衆等志心皈命日宫大聖太陽鬱儀帝君', '太阳 太陽 郁仪 鬱儀 日宫 日宮'),
            ('juan138-taiyin', '太阴结璘皇君', '衆等，志心皈命月宫大聖太陰結璘皇君', '太阴 太陰 结璘 結璘 月宫 月宮'),
            ('juan138-suixing', '东方木德岁星重华真君', '衆等，志心皈命東方木德歲星重華真君', '岁星 歲星 木德 重华 重華 东方 東方'),
            ('juan138-yinghuo', '南方荧惑执法真君', '衆等，志心皈命南方熒惑執法真君', '荧惑 熒惑 火德 执法 執法 南方'),
            ('juan138-taibai', '西方金德太白天皓星君', '衆等志心皈命西方金德太白天皓星君', '太白 金德 天皓 西方'),
            ('juan138-chenxing', '北方水德辰星伺晨星君', '衆等志心皈命。北方水德辰門伺晨星君', '辰星 辰门 辰門 伺晨 水德 北方'),
            ('juan138-zhenxing', '中央土德镇星地𩛩星君', '衆等志心皈命中央土德鎮星、地𩛩星君', '镇星 鎮星 土德 中央 地𩛩'),
            ('juan138-luohou', '神首罗㬋建星真君', '衆等志心皈命神首羅㬋建星真君', '罗睺 羅㬋 神首 建星'),
            ('juan138-jidu', '神尾计都坠星真君', '衆等，志心皈命神尾計都墜星真君', '计都 計都 神尾 坠星 墜星'),
            ('juan138-ziqi', '天一紫炁星君', '衆等，志心皈命天一紫炁星君', '天一 紫炁 四余 四餘'),
            ('juan138-yuebei', '太乙月孛星君', '衆等，志心皈命太乙、月孛星君', '太乙 月孛 四余 四餘'),
            ('juan138-shouyi', '十一曜星灯收仪', '向來關祝十一曜星燈功德周圓：', '十一列曜 十一曜 收仪 收儀 七纬 七緯 四余 四餘'),
        ]),
]

for cfg in CONFIGS:
    juan = cfg['juan']
    source = BASE / f'jidu-jinshu-juan{juan}-source.md'
    target = BASE / f'jidu-jinshu-juan{juan}-transcript.md'
    raw = source.read_text(encoding='utf-8')
    assert raw.count(cfg['marker']) == 1, f'卷{juan}正文标识异常'
    text = raw.split(cfg['marker'], 1)[1].strip()
    sections = cfg['sections']
    assert len(sections) == cfg['count']
    positions = []
    for tag, title, start, words in sections:
        pos = text.find(start)
        assert pos >= 0, f'卷{juan}缺分节起点：{tag}'
        positions.append(pos)
    assert positions == sorted(positions), f'卷{juan}分节顺序异常'
    assert len(set(positions)) == len(positions), f'卷{juan}分节起点重复'
    chunks = []
    for i, (tag, title, start, words) in enumerate(sections):
        end = positions[i + 1] if i + 1 < len(sections) else len(text)
        chunk = text[positions[i]:end].strip()
        assert chunk.startswith(start) and len(chunk) >= 100, f'卷{juan}分节过短：{tag}'
        chunks.append(chunk)
    assert '\n\n'.join(chunks) == text, f'卷{juan}分节拼接未无损还原源页正文'

    label = {136: '三十六', 137: '三十七', 138: '三十八'}[juan]
    lines = [
        f'# 《灵宝领教济度金书》卷一百{label}转录稿（识典源页·无损分节）',
        '',
        f'- 来源：识典古籍 DZ0466 卷一百{label}《{cfg["ritual"]}》，2026-10-26 获取。',
        f'- URL：{cfg["url"]}',
        '- 校勘边界：网络转录单源，trust=0.72，预留道藏书影人工校验；疑似 OCR、异体字与标点均照源页保留。',
        f'- 结构校验：{cfg["count"]}个自然仪节，按原顺序拼接必须逐字还原源页正文；不据搜索摘要、异版或他卷补改。',
        '',
    ]
    for (tag, title, start, words), chunk in zip(sections, chunks):
        lines.extend([
            f'<!--ENTRY:{tag}|原典·灵宝领教济度金书卷一百{label}·{title}（识典转录）|0.72-->',
            '【典籍來源】《靈寶領教濟度金書》，識典古籍 DZ0466。',
            f'【卷次】卷之一百{label}，科儀立成品，祈禳通用，{cfg["ritual"]}。',
            '【古注摘要】源頁未列另行古注，本條不補注、不發揮。',
            '【門類】科儀。',
            '【古例／占斷記錄】本節為燈儀儀文，非占斷古例；不作吉凶預測。',
            '【版本異文】僅據識典網頁轉錄，未與道藏書影逐字核對；原字形、標點及疑似 OCR 照源頁保留，待人工校驗。',
            '【原文】',
            chunk,
            '',
            f'關鍵詞：灵宝领教济度金书 靈寶領教濟度金書 卷一百{label} {cfg["ritual"]} 祈禳 {words} 识典 識典 人工校验 人工校驗',
            '',
        ])
    target.write_text('\n'.join(lines), encoding='utf-8')
    print(f'生成 {target.relative_to(ROOT)}：{len(chunks)} 节；无损还原校验通过')
