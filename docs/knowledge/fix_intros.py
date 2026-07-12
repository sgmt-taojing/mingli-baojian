#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Fix bazi and liuyao intros in authoritative-knowledge-base.js"""
import codecs

def fix_file():
    with codecs.open('/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/authoritative-knowledge-base.js', 'r', 'utf-8') as f:
        content = f.read()

    lines = content.split('\n')

    # ==========================================================================
    # FIX BAZI: find and replace the multi-line intro
    # ==========================================================================
    for i, line in enumerate(lines):
        if line.strip().startswith('bazi: {'):
            bazi_start = i
            break

    # Find bazi intro start (line containing intro and bazi intro text)
    bazi_intro_start = None
    for i in range(bazi_start, bazi_start+20):
        if '"intro":' in lines[i] and '八字命理学是中国传统命理' in lines[i]:
            bazi_intro_start = i
            break

    # Find bazi intro end (line that ends with '",' and closes the intro)
    bazi_intro_end = None
    for i in range(bazi_intro_start+1, bazi_intro_start+15):
        stripped = lines[i].strip()
        if stripped == '},' or (stripped.endswith('",') and not stripped.startswith('//')):
            bazi_intro_end = i - 1
            break

    if bazi_intro_start is None or bazi_intro_end is None:
        print(f"BAZI: intro not found (start={bazi_intro_start}, end={bazi_intro_end})")
    else:
        print(f"BAZI: intro spans lines {bazi_intro_start+1} to {bazi_intro_end+1}")

        bazi_new_intro = (
            '八字命理学是中国传统命理的基石，也是华人世界最普及、最系统的人生预测学。它以一个人出生时的年月日时（"四柱"，每柱一个天干一个地支，共八个字，故称"八字"）为依据，结合阴阳五行的生克制化、十神的配置关系、大运流年的流转规律，综合推断一个人从生到死的命运轨迹。八字的核心逻辑是：出生那一刻，天地之气注入人体，形成先天的命局格局；这个格局决定了一个人性格的基调、才能的方向、人生际遇的起伏——何时顺利、何时坎坷、感情婚姻如何、事业财富几许、子女缘分深浅、健康寿夭几何，都可以从八字中看出端倪。\\n\\n'
            '学习八字命理有七大核心模块，环环相扣：第一，天干地支基础——十天干（甲乙丙丁戊己庚辛壬癸）和十二地支（子丑寅卯辰巳午未申酉戌亥）的阴阳五行属性、旺相休囚死状态、十天干生旺死绝表；第二，阴阳五行深化——五行相生（木生火、火生土、土生金、金生水、水生木）、相克（木克土、土克水、水克火、火克金、金克木）的具体应用；第三，十神体系——以日干为中心，根据生克关系划分正官、偏官、正印、偏印、比肩、劫财、食神、伤官、正财、偏财十种关系人；第四，格局判断——普通格局与特殊格局的识别标准；第五，用神选取——根据月令、整体气势、旺衰程度确定命局的药；第六，大运流年——十年一步大运，每年一个流年干支，形成时间轴上的运势起伏；第七，实战应用——综合以上所有元素，对具体人生议题作出判断。\\n\\n'
            '八字权威经典包括：宋代徐子平的《渊海子平》、明代万民英的《三命通会》、清代任铁樵的《滴天髓》、沈孝瞻的《子平真诠》、《穷通宝鉴》。现代易道智鉴在吸收传统精华的基础上，结合现代生活场景，提供更贴近当代人的解读。八字最核心的价值在于"知命"——不是宿命论，而是通过了解自己的先天特质和运势规律，做出更明智的人生选择。'
        )
        new_line = '      intro: "' + bazi_new_intro + '",\n'

        lines = lines[:bazi_intro_start] + [new_line] + lines[bazi_intro_end+1:]
        print(f"BAZI: fixed ({len(bazi_new_intro)} chars)")

    # ==========================================================================
    # FIX LIUYAO
    # ==========================================================================
    for i, line in enumerate(lines):
        if line.strip().startswith('liuyao: {'):
            liuyao_start = i
            break

    liuyao_intro_start = None
    for i in range(liuyao_start, liuyao_start+20):
        if '"intro":' in lines[i] and '六爻是中国历史最悠久' in lines[i]:
            liuyao_intro_start = i
            break

    liuyao_intro_end = None
    for i in range(liuyao_intro_start+1, liuyao_intro_start+15):
        stripped = lines[i].strip()
        if stripped == '},' or (stripped.endswith('",') and not stripped.startswith('//')):
            liuyao_intro_end = i - 1
            break

    if liuyao_intro_start is None or liuyao_intro_end is None:
        print(f"LIUYAO: intro not found (start={liuyao_intro_start}, end={liuyao_intro_end})")
    else:
        print(f"LIUYAO: intro spans lines {liuyao_intro_start+1} to {liuyao_intro_end+1}")

        liuyao_new_intro = (
            '六爻是中国历史最悠久、民间最普及的占卜体系，以铜钱摇卦为核心工具，通过六亲（父母、兄弟、子孙、妻财、官鬼）和六神（青龙、朱雀、勾陈、螣蛇、白虎、玄武）的配合，分析事情的起因、过程、结果与应期。六爻起源于西汉京房创立的"火珠林"法，经东晋郭璞、北宋麻衣道者、明代野鹤老人等历代大师不断完善，形成了以《火珠林》为源头、以《增删卜易》《卜筮正宗》为实践指南的完整体系。与八字命理的"命定论"不同，六爻是针对具体事项的"事定论"——你想问什么，就摇什么卦，针对性强、时效明确，是古人日常决策的重要工具。\\n\\n'
            '六爻起卦用三枚铜钱，心中默念所问之事，双手合拢摇六次，每次记录正面（字）还是背面（花），共得到六个爻——从下往上装卦，形成六爻卦象。初爻为底，上爻为顶，每一爻有阴阳之分，组合成六十四卦中的某一卦。下三爻为内卦，上三爻为外卦。摇卦后还要装上六亲（根据日干与卦中各爻的生克关系）、配上六神（按日期推算青龙等六神的位置），才算完成装卦。\\n\\n'
            '六爻的核心判断框架是五行生克和六亲关系：世爻代表自己，应爻代表对方或事件结果；官鬼爻代表官方、压力、丈夫；妻财爻代表钱财、妻子；父母爻代表父母、房子、车子、文书；子孙爻代表子女、快乐、医生；兄弟爻代表兄弟姐妹、竞争者。六神各有性格：青龙主喜庆，朱雀主口舌，勾陈主迟滞，螣蛇主惊吓，白虎主血光，玄武主暧昧。六爻判断的核心原则是：旺相休囚死定力量，生克冲合定关系，动变规则看变化，应期判断定时间。乾元六爻模块提供电子摇卦功能，模拟三枚铜钱随机生成卦象，随时随地起卦问事。'
        )
        new_line = '      intro: "' + liuyao_new_intro + '",\n'

        lines = lines[:liuyao_intro_start] + [new_line] + lines[liuyao_intro_end+1:]
        print(f"LIUYAO: fixed ({len(liuyao_new_intro)} chars)")

    # ==========================================================================
    # SAVE
    # ==========================================================================
    with codecs.open('/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/authoritative-knowledge-base.js', 'w', 'utf-8') as f:
        f.write('\n'.join(lines))

    print(f"\nSaved! Total lines: {len(lines)}")

if __name__ == '__main__':
    fix_file()
