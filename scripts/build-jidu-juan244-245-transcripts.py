#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""由识典卷244-245源页快照生成无损分节转录稿；不校字、不补文、不混异版。"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE = ROOT / 'corpus/jidu-jinshu'
CONFIGS = [
    dict(
        juan=244, label='二百四十四', marker='## 靈寶領教濟度金書卷之二百四十四育五\n\n',
        url='https://www.shidianguji.com/zh/book/DZ0466/chapter/1lp28wg79qu4v',
        ritual='祈壽三朝行道儀', count=14,
        sections=[
            ('juan244-zao-kaiyi', '祈寿早朝开仪宣词', '洞微高士開光救苦真人𡩋全真授', '祈寿 祈壽 早朝 开仪 開儀 宣词 宣詞 卫灵咒 衛靈咒'),
            ('juan244-zao-sannian', '祈寿早朝三捻上香', '以今早朝行道，', '早朝 三捻上香 道宝 道寶 经宝 經寶 师宝 師寶'),
            ('juan244-zao-qidao', '祈寿早朝重称法位祈祝', '具位某與臨壇官衆等，謹同誠上啓\n\n虚无自然元始天尊、無極太道', '早朝 重称法位 重稱法位 祈祝 灵椿 靈椿 蟠桃'),
            ('juan244-zao-fayuan', '祈寿早朝十念发愿', '一念爲道，四大合德齋主', '早朝 十念 发愿 發願 斋主 齋主'),
            ('juan244-zao-shoujie', '祈寿早朝收结', '香官使者、左右龍虎君、侍香諸靈官，當令臣建齋之所', '早朝 收结 收結 存神 烧香 焼香 出堂颂 出堂頌'),
            ('juan244-wu-kaiyi', '祈寿午朝开仪宣词', '丹靈朱火，炎霞激風。', '祈寿 祈壽 午朝 开仪 開儀 宣词 宣詞 丹灵朱火 丹靈朱火'),
            ('juan244-wu-sannian', '祈寿午朝三捻上香', '以今午朝行道，', '午朝 三捻上香 道宝 道寶 经宝 經寶 师宝 師寶'),
            ('juan244-wu-qidao', '祈寿午朝重称法位祈祝', '具位某與臨壇官衆等，謹同誠上啓\n\n虚无自然元始天尊、无極大道', '午朝 重称法位 重稱法位 祈祝 曰艾曰耆'),
            ('juan244-wu-fayuan', '祈寿午朝十二愿', '一願大道淡泊虚无', '午朝 十二愿 十二願 发愿 發願 大道 诸天 諸天'),
            ('juan244-wu-shoujie', '祈寿午朝收结', '香官使者、左右龍虎君、侍香諸靈官，當令建齋之所', '午朝 收结 收結 存神 烧香 焼香 出堂颂 出堂頌'),
            ('juan244-wan-kaiyi', '祈寿晚朝开仪宣词', '五星高耀，瑞炁飛浮。', '祈寿 祈壽 晚朝 开仪 開儀 宣词 宣詞 五星高耀'),
            ('juan244-wan-sannian', '祈寿晚朝三捻上香', '以今晚朝行道，', '晚朝 三捻上香 道宝 道寶 经宝 經寶 师宝 師寶'),
            ('juan244-wan-qidao', '祈寿晚朝重称法位祈祝', '具位某與臨壇官衆等謹同誠上啓', '晚朝 重称法位 重稱法位 祈祝 茹芝 餐柏'),
            ('juan244-wan-shouyi', '祈寿晚朝收仪', '香官使者、左右龍虎君、侍香諸靈官，當令臣建齋之所，自然生金液丹碧芝英、百靈衆真交會在此香火爐前，\n\n令學道得道，求仙得仙，\n\n齋主受福，幽顯沾恩，十方仙童玉女侍衛蘭煙，傳臣向來所啓', '晚朝 收仪 收儀 十二愿 十二願 存神 出堂颂 出堂頌'),
        ]),
    dict(
        juan=245, label='二百四十五', marker='## 靈寶領教濟度金書卷之二百四十五育六\n\n',
        url='https://www.shidianguji.com/zh/book/DZ0466/chapter/1lp28wgdixut0',
        ritual='祈壽醮儀、壽星醮儀', count=10,
        sections=[
            ('juan245-qishou-kaiyi', '祈寿醮仪开仪请圣', '洞微高士開光救苦真人𡩋全真授', '祈寿醮仪 祈壽醮儀 开仪 開儀 请圣 請聖 卫灵咒 衛靈咒'),
            ('juan245-qishou-chuxian', '祈寿醮仪初献宣词', '具位某與臨壇官衆等，謹重誠上啓\n\n太上无極大道、三清上聖', '祈寿醮仪 祈壽醮儀 初献 初獻 宣词 宣詞 延寿 延壽'),
            ('juan245-qishou-yaxian', '祈寿醮仪亚献', '詞文控露，玄監孔昭。', '祈寿醮仪 祈壽醮儀 亚献 亞獻 词文 詞文'),
            ('juan245-qishou-zhongxian', '祈寿醮仪终献', '具位某與臨壇官衆等，謹重誠上啓三清上聖', '祈寿醮仪 祈壽醮儀 终献 終獻 三官 五帝'),
            ('juan245-qishou-songsheng', '祈寿醮仪送圣收结', '具位某，謹重誠上啓三清上聖', '祈寿醮仪 祈壽醮儀 送圣 送聖 回軿颂 回軿頌'),
            ('juan245-shouxing-kaiyi', '寿星醮仪开仪请圣', '太上无極大道至真玉皇上帝御前。回軿頌焚燎回向壽星醮儀', '寿星醮仪 壽星醮儀 开仪 開儀 请圣 請聖 南极老人 南極老人'),
            ('juan245-shouxing-chuxian', '寿星醮仪初献', '具位某與臨壇官衆等，謹焚香上啓上清十一曜星君', '寿星醮仪 壽星醮儀 初献 初獻 十一曜 南斗 北斗'),
            ('juan245-shouxing-yaxian', '寿星醮仪亚献', '具位某與臨壇官衆等，謹重誠上啓\n\n周天列曜', '寿星醮仪 壽星醮儀 亚献 亞獻 五福 寿 壽'),
            ('juan245-shouxing-zhongxian', '寿星醮仪终献', '具位臣某與臨壇官衆等，謹焚香上啓', '寿星醮仪 壽星醮儀 终献 終獻 三寿 三壽'),
            ('juan245-shouxing-songsheng', '寿星醮仪送圣收结', '具位某與臨壇官衆等，謹焚香上啓\n\n周天列曜', '寿星醮仪 壽星醮儀 送圣 送聖 回軿颂 回軿頌'),
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

    lines = [
        f'# 《灵宝领教济度金书》卷{cfg["label"]}转录稿（识典源页·无损分节）',
        '',
        f'- 来源：识典古籍 DZ0466 卷{cfg["label"]}《{cfg["ritual"]}》，2026-10-26 获取。',
        f'- URL：{cfg["url"]}',
        '- 校勘边界：网络转录单源，trust=0.72，预留道藏书影人工校验；疑似 OCR、异体字与标点均照源页保留。',
        f'- 结构校验：{cfg["count"]}个自然仪节，按原顺序拼接必须逐字还原源页正文；不据搜索摘要、异版或他卷补改。',
        '',
    ]
    for (tag, title, start, words), chunk in zip(sections, chunks):
        lines.extend([
            f'<!--ENTRY:{tag}|原典·灵宝领教济度金书卷{cfg["label"]}·{title}（识典转录）|0.72-->',
            '【典籍來源】《靈寶領教濟度金書》，識典古籍 DZ0466。',
            f'【卷次】卷之{cfg["label"]}，科儀立成品，祈壽用，{cfg["ritual"]}。',
            '【古注摘要】源頁未列另行古注，本條不補注、不發揮。',
            '【門類】科儀。',
            '【古例／占斷記錄】本節為祈壽行道或醮儀儀文，非占斷古例；不作吉凶預測。',
            '【版本異文】僅據識典網頁轉錄，未與道藏書影逐字核對；原字形、標點及疑似 OCR 照源頁保留，待人工校驗。',
            '【原文】',
            chunk,
            '',
            f'關鍵詞：灵宝领教济度金书 靈寶領教濟度金書 卷{cfg["label"]} {cfg["ritual"]} 祈寿 祈壽 {words} 识典 識典 人工校验 人工校驗',
            '',
        ])
    target.write_text('\n'.join(lines), encoding='utf-8')
    print(f'生成 {target.relative_to(ROOT)}：{len(chunks)} 节；无损还原校验通过')
