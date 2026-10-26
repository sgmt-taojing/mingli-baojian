#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""P15：由卷271、274、316各自源页生成无损分节转录稿；不混底本、不补字。"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE = ROOT / 'corpus/jidu-jinshu'
CONFIGS = [
    dict(
        juan=271, label='二百七十一', marker='## 卷之二百七十一\n\n',
        source='古文典籍网（newdu.com）', source_key='古文典籍網',
        url='http://ab.newdu.com/book/ms210668.html',
        pages='PDF 第370—381页', ritual='五方赤书玉字、五方真文与祈禳诸符',
        category='符簡軌範品，祈禳通用',
        note='缺字符“□”“?”、异体字、标点及疑似 OCR 照源页保留；云篆与符图不猜写为汉字，待道藏书影逐页人工校验。',
        sections=[
            ('juan271-chishu-dongfang', '五方赤书玉字东方译文', '洞微高士开光救苦真人甯全真授', '五方赤书玉字 五方赤書玉字 东方 東方 岁星 歲星 东山神咒 東山神咒'),
            ('juan271-chishu-nanfang', '五方赤书玉字南方译文', '南方\n\n译文\n\n南方丹天', '南方 荧惑 熒惑 赤文命灵 赤文命靈 南河水帝'),
            ('juan271-chishu-zhongyang', '五方赤书玉字中央译文', '中央\n\n译文\n\n中央总灵', '中央 镇星 鎮星 中山神咒 黄上天元 黃上天元'),
            ('juan271-chishu-xifang', '五方赤书玉字西方译文', '西方\n\n译文\n\n西方素天', '西方 太白 西山神咒 白帝 赤书玉字 赤書玉字'),
            ('juan271-chishu-beifang', '五方赤书玉字北方译文', '北方\n\n译文\n\n北方玄天', '北方 北辰 北山神咒 九河 黑帝'),
            ('juan271-wufang-zhenwen', '预修黄箓五方真文', '预修黄籙斋用', '预修黄箓 預修黃籙 五方真文 山简 水简 土简'),
            ('juan271-zhuiyuan-zhufu', '追远炼神保命诸符目', '山简\n\n水简\n\n土简\n\n追远符', '追远符 追遠符 度六亲符 度六親符 落罪籍符 炼神符 煉神符 保命符 伏魔符'),
            ('juan271-shiyiyao-doufu', '十一曜南北斗与五斗符目', '十－曜符', '十一曜符 太阳符 太陽符 太阴符 太陰符 罗睺 计都 計都 紫炁 月孛 北斗符 南斗符 五斗符 断邪目 斷邪目 东斗主筭 東斗主筭 西斗纪名 西斗紀名 南斗上生 中斗大魁'),
        ]),
    dict(
        juan=274, label='二百七十四', marker='## 靈寶領教濟度金書卷之二百七十四首八\n\n',
        source='识典古籍 DZ0466', source_key='識典古籍 DZ0466',
        url='https://www.shidianguji.com/zh/book/DZ0466/chapter/1lp28xhb76nm7',
        pages='PDF 第406—416页', ritual='璇玑解厄、七曜玄灵、传度雷霆与祈禳诸符',
        category='符簡軌範品，璇璣齋、七曜齋、玄靈經懺、傳度及諸道場用',
        note='原字形、标点及疑似 OCR 照源页保留；卷尾作“卷之二百十四”，与卷首“二百七十四”并存，不静默改字；符图未转写为文字，待道藏书影逐页人工校验。',
        sections=[
            ('juan274-xuanji-jiee', '璇玑解厄七曜玄灵诸符目', '洞微高士開光救苦真人𡩋全真授', '璇玑斋 璇璣齋 解厄将军符 解厄將軍符 七曜斋 七曜齋 玄灵经忏 玄靈經懺'),
            ('juan274-yuzi-chuandu', '北斗消灾玉字与传度符劵', '北斗消灾内音玉字譯文', '北斗消灾 北斗消災 内音玉字 內音玉字 北斗天关 北斗天關 传度 傳度 仙诰符 仙誥符 版符 灵宝合同劵文 靈寶合同劵文 告盟劵 玉劵'),
            ('juan274-leiting-fuxi', '雷霆斋诸符檄目', '雷霆齋，用東方箕星檄', '雷霆斋 雷霆齋 箕星檄 借风雨檄 借風雨檄 驱龙铁符 驅龍鐵符 致雨 呼风 呼風 召雷'),
            ('juan274-leifa-fushi', '雷法名讳与雷火符使诀', '靈寶大法中有雷陣大將軍', '灵宝大法 靈寶大法 王文卿 五雷大法 雷火符使诀 雷火符使訣 雳黑符 靂黑符'),
            ('juan274-leizhen-jiangli', '雷阵霹雳将吏名讳', '雷陣左領將軍王佐', '雷阵 雷陣 霹雳 霹靂 将军 將軍 使者 功曹 王佐 冯维则 馮維則'),
            ('juan274-leibu-qisi', '雷部总述与祈嗣诸符', '此靈寶法中雷部', '雷部 玉清王府 东极紫微 東極紫微 祈嗣 保胎 生贵子 生貴子'),
            ('juan274-qilu-rangzai', '祈禄祈寿祈晴禳火禳蝗诸符及卷尾', '祈禄道場，用求官符', '祈禄 祈祿 求官符 进爵 進爵 祈寿 祈壽 延寿符 延壽符 落死籍符 延年符 祈晴 请晴符 請晴符 禳火 镇火符 鎮火符 禳蝗 驱蝗符 驅蝗符 桃板 雄黄 雄黃'),
        ]),
    dict(
        juan=316, label='三百一十六', marker='## 卷之三百一十六\n\n',
        source='读点古籍', source_key='讀點古籍',
        url='https://www.dudianguji.com/book/1397/296a9cacab960.html',
        pages='PDF 第779—789页', ritual='保命斋、七曜斋、玄灵游玑斋文檄',
        category='文檄發放品，保命齋、七曜齋、玄靈游璣齋用',
        note='原字形、标点、空格及疑似 OCR 照源页保留，包括“调t 理蛮限”与卷尾“济一度”等，不据他本静默补改，待道藏书影逐页人工校验。',
        sections=[
            ('juan316-baoming-touci', '保命斋投词与斋意', '洞微高士开光救苦真人甯全真授', '保命斋 保命齋 投词 投詞 斋意 齋意 北斗延生星灯 北斗延生星燈'),
            ('juan316-baoming-zou-san', '保命斋奏昊天北极五老', '奏昊天\n\n具位臣姓某，谨据斋意。至玄佑。除画一具奏', '奏昊天 奏北极 奏北極 奏五老 玉皇 紫微'),
            ('juan316-baoming-santian', '保命斋奏三天门下画一', '奏三天门下\n\n具位臣姓某，谨据斋意，恭按真科', '三天门下 三天門下 画一 畫一 断瘟保病 斷瘟保病 五瘟'),
            ('juan316-baoming-xuanshi-qiyao', '保命斋奏玄师申七曜', '奏三省同三天门下式', '奏玄师 奏玄師 玄中大法师 玄中大法師 申七曜 太阳 太陽 太阴 太陰'),
            ('juan316-baoming-shen-bengming', '保命斋申本命三师东岳', '申北斗天曹四圣三元驱邪院并同七曜状式', '申本命 本命元辰 灵宝三师 靈寶三師 申东岳 申東岳 三茅司命'),
            ('juan316-baoming-die-chenghuang', '保命斋牒城隍及立幕设斋', '申三茅司命同东岳式', '牒本州城隍司 城隍 司命六神 立幕 彻幕 徹幕 设斋 設齋'),
            ('juan316-qiyao-touci', '七曜斋投词与斋意', '七曜斋斋主投词', '七曜斋 七曜齋 投词 投詞 斋意 齋意 二景五星'),
            ('juan316-qiyao-zou-haotian', '七曜斋奏昊天北极', '奏昊天\n\n具位臣姓某，谨据斋意。玄佑。除画一具奏', '七曜斋 七曜齋 奏昊天 奏北极 奏北極 本命元辰'),
            ('juan316-qiyao-santian', '七曜斋奏三天门下画一', '奏天皇五老并同北极式。\n\n奏三天门下', '七曜斋 七曜齋 三天门下 三天門下 延生解厄朱章 紫府清醮'),
            ('juan316-qiyao-sansheng-taiyang', '七曜斋奏三省申太阳', '奏三省\n\n具位臣姓某，谨据斋意，次第修奉', '奏三省 泰玄枢机 泰玄樞機 申太阳 申太陽 正一天师 正一天師'),
            ('juan316-qiyao-liushi-bengming', '七曜斋申六十甲子本命元辰', '申太阴五星南斗北斗天曹四圣天官地官水官', '申六十甲子 六十甲子 本命元辰 十二宫 十二宮'),
            ('juan316-qiyao-sanshi-siyu', '七曜斋申三师四余', '申三师\n\n具位姓某，谨据斋意。除已具奏', '申三师 申三師 申四余 申四餘 紫气 紫氣 月孛 罗喉 罗睺 计都 計都'),
            ('juan316-qiyao-die-chenghuang', '七曜斋牒城隍关功曹', '牒本州城隍司\n\n上清灵宝行司', '七曜斋 七曜齋 牒本州城隍司 当境里域 當境里域 司命六神 关功曹 關功曹'),
            ('juan316-xuanling-touci', '玄灵游玑斋投词与斋意', '玄灵游玑斋合用投词', '玄灵游玑斋 玄靈游璣齋 投词 投詞 斋意 齋意 斗府清醮'),
            ('juan316-xuanling-beiji-jiuhuang', '玄灵游玑斋奏北极九皇', '奏北极\n\n具位臣姓某，谨据斋意除已具奏', '奏北极 奏北極 奏九皇 北斗九皇 贪狼 貪狼 巨门 巨門 禄存 祿存'),
            ('juan316-xuanling-xuanshi-daode', '玄灵游玑斋奏玄师申道德诸君', '奏玄师\n\n具位臣姓某，谨据斋意。除已具奏', '奏玄师 奏玄師 正一天师 正一天師 九皇夫人 九阴内妃 九陰內妃 道德诸君 道德諸君'),
            ('juan316-xuanling-liushi-zhusi', '玄灵游玑斋申六十甲子及诸司', '申六十甲子官君。', '申六十甲子 本命神将 本命神將 三官 本命元辰 三师度师 三師度師'),
            ('juan316-xuanling-die-chenghuang', '玄灵游玑斋牒城隍', '牒本牒城隍司上清灵宝行司', '玄灵游玑斋 玄靈游璣齋 牒本州城隍司 监临纠察 監臨糾察 司命六神'),
            ('juan316-shejiao-shengmu', '设醮申司与请圣目子式', '设醮一宗', '设醮 設醮 降圣司 降聖司 掌醮司 请圣目子式 請聖目子式 正筵 左班 右班'),
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
    positions = []
    cursor = 0
    for tag, title, start, words in sections:
        pos = text.find(start, cursor)
        assert pos >= 0, f'卷{juan}缺分节起点：{tag}'
        positions.append(pos)
        cursor = pos + len(start)
    assert len(set(positions)) == len(positions), f'卷{juan}分节起点重复'
    chunks = []
    raw_chunks = []
    for i, (tag, title, start, words) in enumerate(sections):
        end = positions[i + 1] if i + 1 < len(sections) else len(text)
        raw_chunk = text[positions[i]:end]
        chunk = raw_chunk.strip()
        assert chunk.startswith(start) and len(chunk) >= 100, f'卷{juan}分节过短：{tag}'
        raw_chunks.append(raw_chunk)
        chunks.append(chunk)
    assert ''.join(raw_chunks) == text, f'卷{juan}分节拼接未无损还原源页正文'

    lines = [
        f'# 《灵宝领教济度金书》卷{cfg["label"]}转录稿（独立源页·无损分节）',
        '',
        f'- 文字来源：{cfg["source"]}卷{cfg["label"]}《{cfg["ritual"]}》，2026-10-26 获取。',
        f'- URL：{cfg["url"]}',
        f'- 书影定位：三家本《道藏》第八册（Wikimedia《道藏08.pdf》），{cfg["pages"]}；仅作定位与抽核，不声称全卷逐字校毕。',
        '- 校勘边界：网络转录单源，trust=0.72；各卷独立保存底本，不与识典 LSDZ0468、其他网页或他卷文字混合。',
        f'- 版本异文：{cfg["note"]}',
        f'- 结构校验：{len(sections)}个自然单元，按原顺序拼接必须逐字还原源页正文。',
        '',
    ]
    for (tag, title, start, words), chunk in zip(sections, chunks):
        lines.extend([
            f'<!--ENTRY:{tag}|原典·灵宝领教济度金书卷{cfg["label"]}·{title}（网络转录）|0.72-->',
            f'【典籍來源】《靈寶領教濟度金書》，{cfg["source_key"]}。',
            f'【卷次】卷之{cfg["label"]}，{cfg["category"]}。',
            '【古注摘要】源頁未列另行古注；原頁「譯文」及符目附注照原文保存，本條不補注、不發揮。',
            '【門類】科儀。',
            '【古例／占斷記錄】本節為符簡或文檄儀文，非占斷古例；不作儀式指導或吉凶預測。',
            f'【版本異文】{cfg["note"]}',
            '【原文】',
            chunk,
            '',
            f'關鍵詞：灵宝领教济度金书 靈寶領教濟度金書 卷{cfg["label"]} {cfg["ritual"]} {words} 书影待校 書影待校 人工校验 人工校驗',
            '',
        ])
    target.write_text('\n'.join(lines), encoding='utf-8')
    print(f'生成 {target.relative_to(ROOT)}：{len(chunks)} 节；无损还原校验通过')
