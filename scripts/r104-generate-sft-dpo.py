#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
R104-W2: 训练数据规模化扩容生成脚本
生成 1,500 条 SFT 黄金案例 + 200 条 DPO preference 对
覆盖模块: bazi / ziwei / liuyao / yijing / meihua / liuren / fengshui / qimen / wuxing
"""

import sqlite3
import json
import os
import random
import sys
from datetime import datetime

# ─── 路径常量 ───
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "server", "database", "yidao.db")
SFT_OUTPUT = os.path.join(BASE_DIR, "training-data", "sft-gold-cases", "0006-feedback-driven-r104.jsonl")
DPO_OUTPUT = os.path.join(BASE_DIR, "training-data", "preference", "0003-dpo-r104.jsonl")

# ─── 系统提示词 ───
SYSTEM_PROMPT = "你是一个专业的命理与中医知识助手，回答基于传统理论，客观中立，不做绝对判断。"

# ─── 模块定义 ───
MODULE_CONFIG = {
    "bazi": {
        "label": "八字",
        "db_modules": ["bazi", "bazi-teaching", "case_bazi", "shensha", "shishen", "nayin", "hechong"],
        "target_sft": 300,
        "target_dpo": 30,
        "topics": [
            "用神", "日主", "大运", "十神", "流年", "格局", "五行", "地支藏干",
            "天干合化", "空亡", "刑冲合害", "纳音", "神煞", "偏财", "正财",
            "正官", "七杀", "正印", "偏印", "食神", "伤官", "比肩", "劫财",
            "月令", "日柱", "时柱", "年柱", "胎元", "命宫", "身宫",
            "从格", "化格", "建禄", "月刃", "羊刃", "旺衰", "通关", "调候",
            "扶抑", "病药", "从强", "从弱", "三合局", "三会局", "六合", "六冲",
            "三刑", "伤官见官", "食神制杀", "财官印双全", "偏官", "偏财格",
            "正官格", "食神格", "印绶格", "杂气", "伤官格", "建禄格",
            "金白水清", "木火通明", "火土伤官", "金水相涵", "水木清华",
            "魁罡", "金舆", "将星", "华盖", "桃花", "驿马",
            "天乙贵人", "太极贵人", "文昌", "学堂", "词馆",
            "罗网", "孤辰寡宿", "阴差阳错", "十恶大败",
            "甲己合土", "乙庚合金", "丙辛合水", "丁壬合木", "戊癸合火",
            "子丑合", "寅亥合", "卯戌合", "辰酉合", "巳申合", "午未合",
            "子午冲", "丑未冲", "寅申冲", "卯酉冲", "辰戌冲", "巳亥冲",
            "寅巳申三刑", "丑戌未三刑", "子卯刑", "辰辰自刑",
            "食伤泄秀", "杀印相生", "财滋弱杀", "官星受伤", "印星被坏",
            "比劫夺财", "伤官配印", "寒暖燥湿", "清浊", "真假",
            "寒木向阳", "三冬无火", "炎上格", "润下格", "从革格", "稼穑格",
        ],
        "question_templates": [
            "请解释八字中「{topic}」的含义和作用",
            "八字命理中，{topic}是什么意思？请详细说明",
            "什么是{topic}？在八字分析中如何应用？",
            "请通俗易懂地讲解八字的{topic}",
            "在八字排盘中，{topic}起什么作用？",
            "{topic}对命局有什么影响？请举例说明",
            "如何判断命局中{topic}的强弱？",
            "请说明{topic}在实际断命中的用法",
            "八字中的{topic}有哪些注意事项？",
            "请从基础概念讲起，详细解释{topic}",
            "老师，能不能讲讲{topic}？我总是理解不了",
            "在八字实践中，{topic}的判断标准是什么？",
        ],
    },
    "ziwei": {
        "label": "紫微斗数",
        "db_modules": ["ziwei", "bazi/ziwei", "case_ziwei", "ziwei+fengshui", "ziwei+fengshui+qimen",
                        "ziwei,fengshui", "ziwei/health", "ziwei/career", "ziwei/relationship",
                        "ziwei/education", "ziwei/real-estate"],
        "target_sft": 250,
        "target_dpo": 30,
        "topics": [
            "命宫", "身宫", "四化", "化禄", "化权", "化科", "化忌",
            "三方四正", "夹宫", "紫微星", "天机星", "太阳星", "武曲星",
            "天同星", "廉贞星", "天府星", "太阴星", "贪狼星", "巨门星",
            "天相星", "天梁星", "七杀星", "破军星",
            "空宫", "借星", "大限", "小限",
            "十四主星", "辅星", "丙级星", "博士十二神", "长十二神",
            "财帛宫", "官禄宫", "夫妻宫", "福德宫",
            "田宅宫", "交友宫", "迁移宫", "疾厄宫", "子女宫", "兄弟宫",
            "父母宫", "紫府同宫", "机月同梁", "杀破狼", "日月并明", "日月反背",
            "石中隐玉", "英星入庙", "辅弼夹命", "坐贵向贵", "三奇嘉会",
            "火贪格", "铃贪格", "阳梁昌禄", "明珠出海", "贪武同行",
            "桃花犯主", "君臣庆会", "财荫夹印", "刑囚夹印", "马头带箭",
            "紫微斗数起源", "南北斗", "左辅", "右弼", "文昌", "文曲", "天魁", "天钺",
            "擎羊", "陀罗", "火星", "铃星", "地空", "地劫",
            "天马", "禄存", "天刑", "天姚", "红鸾", "天喜",
            "大耗", "天虚", "截路空亡", "旬空",
        ],
        "question_templates": [
            "请解释紫微斗数中「{topic}」的含义",
            "紫微斗数中，{topic}代表什么？请详细说明",
            "什么是{topic}？在紫微命盘中如何分析？",
            "请通俗易懂地讲解紫微斗数的{topic}",
            "在紫微排盘中，{topic}有什么作用？",
            "{topic}对紫微命盘有什么影响？",
            "如何判断紫微命盘中{topic}的吉凶？",
            "请说明{topic}在紫微斗数中的应用",
            "紫微斗数中的{topic}有哪些格局？",
            "请从基础讲起，详细解释紫微斗数的{topic}",
            "紫微斗数中{topic}星的特点是什么？",
            "在紫微斗数实践中，{topic}的判断要点是什么？",
        ],
    },
    "liuyao": {
        "label": "六爻",
        "db_modules": ["liuyao", "liuyao-basics", "case_liuyao", "liuyue"],
        "target_sft": 200,
        "target_dpo": 25,
        "topics": [
            "世爻", "应爻", "六亲", "原神", "用神", "忌神", "仇神",
            "进神", "退神", "伏神", "飞神", "爻位", "变卦", "互卦",
            "用卦", "体卦", "六神", "青龙", "朱雀", "勾陈", "螣蛇",
            "白虎", "玄武", "纳甲", "世应", "间爻", "归魂", "游魂",
            "六合卦", "六冲卦", "暗动", "日建", "月建", "日辰",
            "空亡", "墓库", "绝地", "长生", "帝旺", "临官", "沐浴",
            "冠带", "衰", "病", "死", "胎", "养",
            "妻财财爻", "兄弟兄爻", "官鬼官爻", "父母父爻",
            "伏吟", "反吟", "卦身", "世身", "月破", "日破",
            "三合局", "三会局", "半合", "冲中逢合", "合中逢冲",
            "动爻", "静爻", "变爻", "之卦", "错卦", "综卦",
            "大象", "体用", "断卦步骤", "取用神",
        ],
        "question_templates": [
            "请解释六爻预测中「{topic}」的含义",
            "六爻中，{topic}是什么意思？请详细说明",
            "什么是{topic}？在六爻断卦中如何应用？",
            "请通俗易懂地讲解六爻的{topic}",
            "在六爻排盘中，{topic}起什么作用？",
            "{topic}在六爻判断中有什么意义？",
            "如何判断六爻卦中{topic}的状态？",
            "请说明{topic}在六爻断卦中的用法",
            "六爻预测中{topic}的注意事项有哪些？",
            "请详细解释六爻中的{topic}概念",
            "老师，六爻里的{topic}怎么理解？",
            "在六爻实践断卦中，{topic}的分析方法是什么？",
        ],
    },
    "yijing": {
        "label": "易经",
        "db_modules": ["yijing", "bagua", "classics"],
        "target_sft": 150,
        "target_dpo": 20,
        "topics": [
            "卦象", "八卦", "六十四卦", "乾卦", "坤卦", "泰卦", "否卦",
            "既济卦", "未济卦", "承乘比应", "中正当位", "卦辞", "爻辞",
            "彖传", "象传", "系辞", "文言", "说卦", "序卦", "杂卦",
            "屯卦", "蒙卦", "需卦", "讼卦", "师卦", "比卦",
            "小畜", "履卦", "谦卦", "豫卦", "随卦", "蛊卦",
            "临卦", "观卦", "噬嗑", "贲卦", "剥卦", "复卦",
            "无妄", "大畜", "颐卦", "大过", "坎卦", "离卦",
            "咸卦", "恒卦", "遁卦", "大壮", "晋卦", "明夷",
            "阳爻", "阴爻", "初九", "九五", "上九", "六二", "六五",
            "当位", "不当位", "得中", "得正", "有应", "无应",
            "乘刚", "承柔", "互体", "变爻", "之卦",
            "先天八卦", "后天八卦", "河图", "洛书", "太极", "两仪",
            "四象", "五行", "天干地支", "二十四节气",
        ],
        "question_templates": [
            "请解释易经中「{topic}」的含义",
            "易经中，{topic}是什么意思？请详细说明",
            "什么是{topic}？在易经卦理中如何理解？",
            "请通俗易懂地讲解易经的{topic}",
            "在易经学习中，{topic}有什么重要性？",
            "{topic}在易经哲学中代表什么？",
            "如何理解易经中的{topic}？",
            "请说明{topic}在易经解读中的应用",
            "易经中关于{topic}有哪些经典论述？",
            "请从基础概念讲起，详细解释易经中的{topic}",
            "《易经》里「{topic}」怎么理解？",
            "学易经时，{topic}这个概念怎么把握？",
        ],
    },
    "meihua": {
        "label": "梅花易数",
        "db_modules": ["meihua", "梅花", "case_meihua"],
        "target_sft": 150,
        "target_dpo": 20,
        "topics": [
            "体卦", "用卦", "互卦", "变卦", "体生用", "用生体",
            "体克用", "用克体", "体用比和", "断卦", "时间起卦",
            "方位起卦", "数字起卦", "字划起卦", "声音起卦",
            "颜色起卦", "外应", "动静",
            "体用生克", "卦气旺衰", "断卦步骤", "应期",
            "梅花易数起源", "邵康节", "观梅数",
            "先天八卦数", "后天八卦方位", "乾一兑二", "离三震四",
            "巽五坎六", "艮七坤八", "本卦", "互卦变卦",
            "卦象吉凶", "体卦旺", "体卦衰", "用卦旺",
            "用卦衰", "比和卦", "生体之卦", "克体之卦",
            "错卦综卦",
            "心易", "万物皆数", "法无定法", "活变",
        ],
        "question_templates": [
            "请解释梅花易数中「{topic}」的含义",
            "梅花易数中，{topic}是什么意思？请详细说明",
            "什么是{topic}？在梅花易数断卦中如何应用？",
            "请通俗易懂地讲解梅花易数的{topic}",
            "在梅花易数中，{topic}有什么作用？",
            "{topic}对梅花易数断卦有什么影响？",
            "如何判断梅花易数中{topic}的吉凶？",
            "请说明{topic}在梅花易数中的应用方法",
            "梅花易数中的{topic}有哪些注意事项？",
            "请详细解释梅花易数中的{topic}概念",
            "梅花易数的{topic}怎么理解？请老师指点",
            "梅花易数实践中，{topic}如何运用？",
        ],
    },
    "liuren": {
        "label": "大六壬",
        "db_modules": ["liuren", "case_liuren", "qimen/liuren"],
        "target_sft": 150,
        "target_dpo": 20,
        "topics": [
            "天盘", "地盘", "人盘", "四课", "三传", "九课", "课体",
            "八门", "九星", "贵人", "螣蛇", "朱雀", "六合", "勾陈",
            "青龙", "天空", "白虎", "太常", "玄武", "太阴", "天后",
            "初传", "中传", "末传", "日辰", "上神", "下神",
            "贼克", "比用", "涉害", "遥克", "昴星", "别责", "八专",
            "伏吟", "返吟", "元首课", "重审课", "始入课",
            "知一课", "涉害课", "见机课", "察微课", "缀瑕课",
            "天将", "十二天将", "贵人旦暮", "十二神将",
            "克应", "断课", "月将", "月将加时",
            "天地盘", "四课三传", "大六壬大全",
            "六壬大全", "毕法赋", "指掌赋", "心印赋", "大六壬断法",
        ],
        "question_templates": [
            "请解释大六壬中「{topic}」的含义",
            "大六壬中，{topic}是什么意思？请详细说明",
            "什么是{topic}？在六壬课中如何应用？",
            "请通俗易懂地讲解大六壬的{topic}",
            "在大六壬排课中，{topic}起什么作用？",
            "{topic}对六壬断课有什么影响？",
            "如何判断六壬课中{topic}的状态？",
            "请说明{topic}在大六壬中的应用",
            "大六壬中的{topic}有哪些要点？",
            "请详细解释大六壬中的{topic}",
            "大六壬的{topic}怎么理解？",
            "六壬实践中，{topic}如何分析？",
        ],
    },
    "fengshui": {
        "label": "风水",
        "db_modules": ["fengshui", "case_fengshui", "yangzhai", "huajie", "taisui"],
        "target_sft": 150,
        "target_dpo": 20,
        "topics": [
            "阳宅", "阴宅", "罗盘", "二十四山", "玄空飞星", "八宅",
            "三元", "九运", "坐向", "明堂", "水口", "龙穴",
            "砂水", "青龙白虎", "朱雀玄武", "来龙去脉", "靠山",
            "门主灶", "财位",
            "文昌位", "桃花位", "五黄", "二黑", "三碧",
            "七星打劫", "城门诀", "到山到向", "上山下水",
            "反吟伏吟", "令星入囚", "收山出煞", "旺山旺向",
            "双星会坐", "双星会向", "天地人元龙",
            "一白水", "二黑土", "三碧木", "四绿木",
            "五黄土", "六白金", "七赤金", "八白土", "九紫火",
            "玄空大卦", "三合风水", "三合局", "四大水口",
            "杨公风水", "赖公风水", "峦头", "理气",
            "龙穴砂水向", "寻龙点穴", "喝形取象", "九星形体",
            "贪狼星", "巨门星", "禄存星", "文曲星", "廉贞星",
            "武曲星", "破军星", "左辅星", "右弼星",
            "向星", "山星", "运星", "流年飞星",
            "东四命", "西四命", "生气方", "天医方",
            "延年方", "伏位方", "绝命方", "五鬼方", "六煞方", "祸害方",
        ],
        "question_templates": [
            "请解释风水中「{topic}」的含义",
            "风水中，{topic}是什么意思？请详细说明",
            "什么是{topic}？在风水布局中如何应用？",
            "请通俗易懂地讲解风水的{topic}",
            "在风水堪舆中，{topic}有什么作用？",
            "{topic}对风水格局有什么影响？",
            "如何判断风水中的{topic}？",
            "请说明{topic}在风水实践中的应用",
            "风水中的{topic}有哪些注意事项？",
            "请详细解释风水中的{topic}概念",
            "老师，风水中的{topic}怎么理解？",
            "风水实践中，{topic}的分析方法是什么？",
        ],
    },
    "qimen": {
        "label": "奇门遁甲",
        "db_modules": ["qimen", "case_qimen", "qimen/shuihan-tcm"],
        "target_sft": 100,
        "target_dpo": 20,
        "topics": [
            "天盘", "地盘", "人盘", "八门", "九星", "八神",
            "三奇", "六仪", "值符", "值使", "直符", "直使",
            "节气", "置闰", "超神", "接气", "正授",
            "拆补", "无闰", "有闰", "定局",
            "开门", "休门", "生门", "伤门", "杜门", "景门",
            "死门", "惊门", "天蓬", "天芮", "天冲", "天辅",
            "天禽", "天心", "天柱", "天任", "天英",
            "螣蛇", "太阴", "六合", "白虎", "玄武",
            "九地", "九天",
            "甲子戊", "甲戌己", "甲申庚", "甲午辛", "甲辰壬", "甲寅癸",
            "乙奇", "丙奇", "丁奇",
            "三奇得使", "三诈", "五假",
            "吉格", "凶格", "青龙返首", "飞鸟跌穴",
            "玉女守门", "三诈五假",
            "太白入荧", "门迫",
            "伏吟", "反吟", "空亡", "墓迫",
            "天地人三盘", "奇门起局", "阳遁", "阴遁",
            "冬至阳遁", "夏至阴遁", "上元", "中元", "下元",
        ],
        "question_templates": [
            "请解释奇门遁甲中「{topic}」的含义",
            "奇门遁甲中，{topic}是什么意思？请详细说明",
            "什么是{topic}？在奇门排盘中如何应用？",
            "请通俗易懂地讲解奇门遁甲的{topic}",
            "在奇门遁甲中，{topic}起什么作用？",
            "{topic}对奇门格局有什么影响？",
            "如何判断奇门局中{topic}的吉凶？",
            "请说明{topic}在奇门遁甲中的应用",
            "奇门遁甲中的{topic}有哪些格局？",
            "请详细解释奇门遁甲中的{topic}",
            "奇门遁甲的{topic}怎么理解？",
            "奇门实践断局中，{topic}如何分析？",
        ],
    },
    "wuxing": {
        "label": "五行",
        "db_modules": ["wuxing", "bagua"],
        "target_sft": 50,
        "target_dpo": 15,
        "topics": [
            "金", "木", "水", "火", "土", "金生水", "水生木", "木生火",
            "火生土", "土生金", "金克木", "木克土", "土克水", "水克火", "火克金",
            "五行相生", "五行相克", "五行制化", "五行相侮", "五行相乘",
            "五行旺衰", "五行四时", "五行休王",
            "长生", "沐浴", "冠带", "临官", "帝旺", "衰", "病", "死",
            "墓", "绝", "胎", "养", "金白水清", "木火通明",
            "火土伤官", "金水相涵", "水木清华", "调候用神",
            "通关用神", "五行平匀", "五行偏枯", "曲直仁寿",
            "炎上", "从革", "稼穑", "润下",
            "天干化合", "地支会合", "三合木局", "三合火局",
            "三合金局", "三合水局", "半合局",
        ],
        "question_templates": [
            "请解释五行中「{topic}」的含义",
            "五行理论中，{topic}是什么意思？请详细说明",
            "什么是{topic}？在五行分析中如何应用？",
            "请通俗易懂地讲解五行的{topic}",
            "五行中的{topic}有什么作用？",
            "{topic}在五行生克中代表什么？",
            "如何判断五行中{topic}的强弱？",
            "请说明{topic}在命理五行中的应用",
            "五行理论中的{topic}有哪些注意事项？",
            "请详细解释五行中的{topic}",
        ],
    },
}

# ─── DPO rejected 模板 ───
DPO_REJECTED_TEMPLATES = [
    "这个问题很复杂，需要具体情况具体分析。建议找专业人士咨询。",
    "这个概念很重要，在命理中有很多作用。具体含义因人而异，不能一概而论。",
    "{topic}是命理学中的一个概念，它对人的命运有一定的影响。但命运掌握在自己手中，不必过于迷信。",
    "关于{topic}，这是一个比较深奥的话题。简单来说就是五行之间的相互作用，具体要看整体命局。",
    "命理学中的{topic}涉及很多方面，需要系统学习才能理解。建议多看相关书籍。",
    "这个问题很难简单回答。{topic}在不同的情况下有不同的含义，要灵活运用。",
    "{topic}嘛，就是命理学里一个说法。信则有不信则无，关键看你自己怎么理解。",
    "关于{topic}，可以说是仁者见仁智者见智。重要的是保持积极的心态面对生活。",
    "你问的{topic}属于命理学范畴，它可能对人生有一些影响，但不要过于依赖这些。",
    "{topic}是一个传统概念，现代社会我们应该更关注实际行动而非命理推测。",
    "这个问题嘛，其实命理学的很多概念都是相互关联的，不能孤立地看{topic}。",
    "关于{topic}，有很多不同的说法和解释。初学者不需要太纠结于细节，先打好基础再说。",
    "{topic}这个东西，我个人觉得主要还是要看你自己的理解。不同老师讲的可能都不一样。",
    "坦白说{topic}这种概念比较抽象，建议你多参考几本书，综合各家说法。",
    "命理这东西信三分就好。{topic}虽然有一定道理，但不要过度解读。",
    "{topic}嘛，没有标准答案。古人讲的是一种哲学智慧，不能用现代科学去硬套。",
]


# ═══════════════════════════════════════════════════════
#  KB 检索函数
# ═══════════════════════════════════════════════════════

def get_db_connection():
    """获取数据库连接"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def fts_search(conn, query, limit=5):
    """FTS5 全文检索"""
    try:
        rows = conn.execute(
            "SELECT k.entry_id, k.module, k.title, k.content, k.keywords, k.summary "
            "FROM kb_formal k "
            "WHERE rowid IN (SELECT rowid FROM kb_formal_fts WHERE kb_formal_fts MATCH ?) "
            "LIMIT ?",
            (query, limit)
        ).fetchall()
        if rows:
            return [dict(r) for r in rows]
    except Exception:
        pass
    return like_search(conn, query, limit)


def like_search(conn, query, limit=5):
    """LIKE 模糊检索"""
    try:
        rows = conn.execute(
            "SELECT entry_id, module, title, content, keywords, summary "
            "FROM kb_formal "
            "WHERE title LIKE ? OR content LIKE ? OR keywords LIKE ? "
            "LIMIT ?",
            (f'%{query}%', f'%{query}%', f'%{query}%', limit)
        ).fetchall()
        return [dict(r) for r in rows]
    except Exception as e:
        print(f"  ⚠ LIKE 检索失败: {e}", file=sys.stderr)
        return []


def search_kb_for_module(conn, module_config, topic, limit=5):
    """针对模块检索 KB"""
    db_modules = module_config["db_modules"]
    placeholders = ",".join(["?"] * len(db_modules))

    # 先尝试精确 topic + module 检索
    try:
        rows = conn.execute(
            f"SELECT entry_id, module, title, content, keywords, summary "
            f"FROM kb_formal "
            f"WHERE module IN ({placeholders}) "
            f"AND (title LIKE ? OR keywords LIKE ? OR content LIKE ?) "
            f"LIMIT ?",
            (*db_modules, f'%{topic}%', f'%{topic}%', f'%{topic}%', limit)
        ).fetchall()
        results = [dict(r) for r in rows]
        if results:
            return results
    except Exception:
        pass

    # fallback: 全库搜索 topic
    return like_search(conn, topic, limit)


# ═══════════════════════════════════════════════════════
#  SFT 生成函数
# ═══════════════════════════════════════════════════════

def format_kb_answer(module_label, topic, kb_entries):
    """基于 KB 条目构造专业回答"""
    if not kb_entries:
        return None

    # 提取 KB 内容片段
    kb_parts = []
    for entry in kb_entries[:3]:
        title = (entry.get("title") or "").strip()
        content = (entry.get("content") or "").strip()
        if not content:
            continue
        if len(content) > 600:
            content = content[:600] + "…"
        # 移除标题中的重复表述
        if not title:
            title = "(知识条目)"
        kb_parts.append(f"【{title}】\n{content}")

    if not kb_parts:
        return None

    answer = f"关于{module_label}中「{topic}」的问题，结合知识库内容详细说明如下：\n\n"
    answer += "\n\n".join(kb_parts)
    answer += "\n\n实践要点：\n"
    answer += f"1. 「{topic}」需要结合整体命局综合判断，不可孤立看待。\n"
    answer += f"2. 不同流派对「{topic}」的论述可能有所出入，应融会贯通。\n"
    answer += f"3. 建议先扎实掌握基础概念，再通过实际案例加深理解。\n"
    answer += "\n> 以上内容仅供参考学习。命理分析需结合个人实际排盘综合判断。"

    return answer


def generate_sft(conn, module_key, module_config, target_count):
    """为指定模块生成 SFT 数据"""
    results = []
    topics = module_config["topics"]
    templates = module_config["question_templates"]
    module_label = module_config["label"]

    attempts = 0
    max_attempts = target_count * 4  # 最多尝试4倍次数

    # 重复 topics 直到达到目标数量
    extended_topics = []
    while len(extended_topics) < target_count * 3:
        extended_topics.extend(topics)
        random.shuffle(extended_topics)

    topic_idx = 0
    while len(results) < target_count and attempts < max_attempts:
        attempts += 1
        topic = extended_topics[topic_idx % len(extended_topics)]
        topic_idx += 1

        # 检索 KB
        kb_entries = search_kb_for_module(conn, module_config, topic, limit=4)
        if not kb_entries:
            continue

        answer = format_kb_answer(module_label, topic, kb_entries)
        if not answer:
            continue

        # 选择问题模板
        question = random.choice(templates).format(topic=topic)

        sft_item = {
            "src_id": f"r104-{module_key}-{len(results):04d}",
            "module": module_key,
            "scene": "知识科普",
            "depth": random.choice(["浅", "中", "深"]),
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": question},
                {"role": "assistant", "content": answer},
            ],
            "_kb_sources": [e.get("entry_id", "") for e in kb_entries[:3]],
        }
        results.append(sft_item)

    return results


# ═══════════════════════════════════════════════════════
#  DPO 生成函数
# ═══════════════════════════════════════════════════════

def generate_dpo(conn, module_key, module_config, target_count):
    """为指定模块生成 DPO 数据"""
    results = []
    topics = module_config["topics"]
    module_label = module_config["label"]

    attempts = 0
    max_attempts = target_count * 4

    extended_topics = []
    while len(extended_topics) < target_count * 3:
        extended_topics.extend(topics)
        random.shuffle(extended_topics)

    topic_idx = 0
    while len(results) < target_count and attempts < max_attempts:
        attempts += 1
        topic = extended_topics[topic_idx % len(extended_topics)]
        topic_idx += 1

        kb_entries = search_kb_for_module(conn, module_config, topic, limit=2)
        if not kb_entries:
            continue

        # chosen: 基于 KB 的专业回答
        chosen = format_kb_answer(module_label, topic, kb_entries)
        if not chosen:
            continue

        # 简化 chosen 用于 DPO（避免过长）
        if len(chosen) > 800:
            chosen = chosen[:800] + "..."

        # rejected: 通用/模糊回答
        rejected_template = random.choice(DPO_REJECTED_TEMPLATES)
        rejected = rejected_template.format(topic=topic)

        prompt = f"请讲讲{module_label}中的「{topic}」是怎么回事？"

        dpo_item = {
            "id": f"dpo-r104-{module_key}-{len(results):03d}",
            "prompt": prompt,
            "chosen": {
                "response": chosen,
                "source": [e.get("entry_id", "") for e in kb_entries[:2]],
                "score": 1,
            },
            "rejected": {
                "response": rejected,
                "source": "generic-vague",
                "score": -1,
            },
            "reason": f"chosen 基于 KB 内容专业可信；rejected 为通用模糊回答，无具体概念引用",
            "module": module_key,
        }
        results.append(dpo_item)

    return results


# ═══════════════════════════════════════════════════════
#  输出函数
# ═══════════════════════════════════════════════════════

def write_jsonl(filepath, data_list):
    """写入 JSONL 文件"""
    try:
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, "w", encoding="utf-8") as f:
            for item in data_list:
                f.write(json.dumps(item, ensure_ascii=False) + "\n")
        return True
    except Exception as e:
        print(f"  ✗ 写入失败 {filepath}: {e}", file=sys.stderr)
        return False


def verify_jsonl(filepath, expected_module_key=None):
    """验证 JSONL 文件"""
    if not os.path.exists(filepath):
        print(f"  ✗ 文件不存在: {filepath}")
        return 0, {}

    count = 0
    module_counter = {}

    try:
        with open(filepath, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    item = json.loads(line)
                    count += 1
                    mod = item.get("module", "unknown")
                    module_counter[mod] = module_counter.get(mod, 0) + 1
                except json.JSONDecodeError:
                    pass
    except Exception as e:
        print(f"  ✗ 读取失败: {e}")
        return 0, {}

    return count, module_counter


# ═══════════════════════════════════════════════════════
#  主流程
# ═══════════════════════════════════════════════════════

def main():
    print("=" * 70)
    print("R104-W2: 训练数据规模化扩容生成")
    print("=" * 70)
    print(f"目标: SFT ≥ 1,500 条, DPO ≥ 200 条")
    print(f"时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"DB:   {DB_PATH}")
    print(f"SFT:  {SFT_OUTPUT}")
    print(f"DPO:  {DPO_OUTPUT}")
    print("-" * 70)

    # 检查 DB
    if not os.path.exists(DB_PATH):
        print(f"✗ 数据库不存在: {DB_PATH}")
        sys.exit(1)

    conn = get_db_connection()
    print(f"✓ DB 连接成功")

    # 统计 KB
    kb_count = conn.execute("SELECT COUNT(*) FROM kb_formal").fetchone()[0]
    print(f"✓ KB 条目总数: {kb_count:,}")

    # ═══════ 生成 SFT ═══════
    print("\n" + "=" * 70)
    print("T1: 生成 SFT 黄金案例")
    print("=" * 70)

    all_sft = []
    sft_module_stats = {}

    for module_key, module_config in MODULE_CONFIG.items():
        target = module_config["target_sft"]
        label = module_config["label"]
        print(f"\n[{module_key}] {label} - 目标 {target} 条")
        results = generate_sft(conn, module_key, module_config, target)
        all_sft.extend(results)
        sft_module_stats[module_key] = len(results)
        print(f"  ✓ 生成 {len(results)} 条")

        if len(all_sft) % 200 < target:  # 每累计 200 条打印一次
            print(f"  → 累计 SFT: {len(all_sft)}")

    print(f"\n✓ SFT 总计: {len(all_sft)} 条")
    print(f"  模块分布: {json.dumps(sft_module_stats, ensure_ascii=False)}")

    # 写入 SFT
    ok = write_jsonl(SFT_OUTPUT, all_sft)
    if ok:
        print(f"✓ 已写入: {SFT_OUTPUT}")

    # ═══════ 生成 DPO ═══════
    print("\n" + "=" * 70)
    print("T2: 生成 DPO 偏好对")
    print("=" * 70)

    all_dpo = []
    dpo_module_stats = {}

    for module_key, module_config in MODULE_CONFIG.items():
        target = module_config["target_dpo"]
        label = module_config["label"]
        print(f"\n[{module_key}] {label} - 目标 {target} 条")
        results = generate_dpo(conn, module_key, module_config, target)
        all_dpo.extend(results)
        dpo_module_stats[module_key] = len(results)
        print(f"  ✓ 生成 {len(results)} 条")

    print(f"\n✓ DPO 总计: {len(all_dpo)} 条")
    print(f"  模块分布: {json.dumps(dpo_module_stats, ensure_ascii=False)}")

    # 写入 DPO
    ok = write_jsonl(DPO_OUTPUT, all_dpo)
    if ok:
        print(f"✓ 已写入: {DPO_OUTPUT}")

    conn.close()

    # ═══════ 验证 ═══════
    print("\n" + "=" * 70)
    print("T3: 验证输出")
    print("=" * 70)

    sft_count, sft_dist = verify_jsonl(SFT_OUTPUT)
    dpo_count, dpo_dist = verify_jsonl(DPO_OUTPUT)

    print(f"\n[SFT] {sft_count} 条")
    for mod, cnt in sorted(sft_dist.items(), key=lambda x: -x[1]):
        print(f"  {mod:15s}: {cnt:4d} 条 {'✓' if cnt >= 50 else '✗ (不足 50)'}")

    print(f"\n[DPO] {dpo_count} 条")
    for mod, cnt in sorted(dpo_dist.items(), key=lambda x: -x[1]):
        print(f"  {mod:15s}: {cnt:4d} 条 {'✓' if cnt >= 5 else '✗ (不足 5)'}")

    # 抽样验证
    print("\n" + "=" * 70)
    print("T4: 抽样验证")
    print("=" * 70)

    print("\n[SFT 抽样 5 条]")
    try:
        with open(SFT_OUTPUT, "r", encoding="utf-8") as f:
            lines = [l for l in f if l.strip()]
        sample_indices = random.sample(range(len(lines)), min(5, len(lines)))
        for idx in sample_indices:
            item = json.loads(lines[idx])
            msgs = item.get("messages", [])
            user_msg = next((m["content"] for m in msgs if m["role"] == "user"), "")
            asst_msg = next((m["content"] for m in msgs if m["role"] == "assistant"), "")
            print(f"\n  ── {item.get('module', '?')} ──")
            print(f"  Q: {user_msg[:80]}...")
            print(f"  A: {asst_msg[:120]}...")
    except Exception as e:
        print(f"  ✗ 抽样失败: {e}")

    print("\n[DPO 抽样 3 条]")
    try:
        with open(DPO_OUTPUT, "r", encoding="utf-8") as f:
            lines = [l for l in f if l.strip()]
        sample_indices = random.sample(range(len(lines)), min(3, len(lines)))
        for idx in sample_indices:
            item = json.loads(lines[idx])
            chosen = item.get("chosen", {}).get("response", "")
            rejected = item.get("rejected", {}).get("response", "")
            print(f"\n  ── {item.get('module', '?')} ──")
            print(f"  prompt: {item.get('prompt', '')[:80]}...")
            print(f"  chosen:  {chosen[:120]}...")
            print(f"  rejected: {rejected[:120]}...")
    except Exception as e:
        print(f"  ✗ 抽样失败: {e}")

    # 最终统计
    print("\n" + "=" * 70)
    print("最终统计")
    print("=" * 70)
    print(f"SFT 总数: {sft_count} (目标 ≥ 1,500) {'✓' if sft_count >= 1500 else '✗'}")
    print(f"DPO 总数: {dpo_count} (目标 ≥ 200) {'✓' if dpo_count >= 200 else '✗'}")

    sft_pass = all(cnt >= 50 for cnt in sft_dist.values())
    dpo_pass = all(cnt >= 5 for cnt in dpo_dist.values())
    print(f"SFT 模块覆盖 (每模块 ≥ 50): {'✓' if sft_pass else '✗'}")
    print(f"DPO 模块覆盖 (每模块 ≥ 5):  {'✓' if dpo_pass else '✗'}")

    print("\n" + "=" * 70)
    print("✓ 完成")
    print("=" * 70)


if __name__ == "__main__":
    random.seed(42)
    main()
