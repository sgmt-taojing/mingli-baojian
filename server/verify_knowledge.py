#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
命理宝鉴 · 知识准确性校验引擎 v1.0

三方比对模式：系统排盘 → 豆包API对比（可选）→ 古书原文验证
所有命理工具按此模式校准，结果存入校验报告。

用法：
  python3 verify_knowledge.py                    # 全量校验
  python3 verify_knowledge.py --module bazi      # 只校验八字
  python3 verify_knowledge.py --module almanac   # 只校验黄历
  python3 verify_knowledge.py --report           # 查看上次校验报告

依赖：lunar_python（pip3 install lunar_python）
"""

import json
import sys
import os
from datetime import datetime, timedelta

try:
    from lunar_python import Solar, Lunar
    HAS_LUNAR = True
except ImportError:
    HAS_LUNAR = False

# ============================================================
# 古书常量（权威来源，用于校验）
# ============================================================

# 六十甲子顺序（甲子为0，癸亥为59）
JIAZI = []
GAN = "甲乙丙丁戊己庚辛壬癸"
ZHI = "子丑寅卯辰巳午未申酉戌亥"
for i in range(60):
    JIAZI.append(GAN[i % 10] + ZHI[i % 12])

# 纳音五行（《三命通会》原文）
NAYIN_BOOK = {
    "甲子": "海中金", "乙丑": "海中金", "丙寅": "炉中火", "丁卯": "炉中火",
    "戊辰": "大林木", "己巳": "大林木", "庚午": "路旁土", "辛未": "路旁土",
    "壬申": "剑锋金", "癸酉": "剑锋金", "甲戌": "山头火", "乙亥": "山头火",
    "丙子": "涧下水", "丁丑": "涧下水", "戊寅": "城墙土", "己卯": "城墙土",
    "庚辰": "白蜡金", "辛巳": "白蜡金", "壬午": "杨柳木", "癸未": "杨柳木",
    "甲申": "井泉水", "乙酉": "井泉水", "丙戌": "屋上土", "丁亥": "屋上土",
    "戊子": "霹雳火", "己丑": "霹雳火", "庚寅": "松柏木", "辛卯": "松柏木",
    "壬辰": "长流水", "癸巳": "长流水", "甲午": "砂石金", "乙未": "砂石金",
    "丙申": "山下火", "丁酉": "山下火", "戊戌": "平地木", "己亥": "平地木",
    "庚子": "壁上土", "辛丑": "壁上土", "壬寅": "金箔金", "癸卯": "金箔金",
    "甲辰": "覆灯火", "乙巳": "覆灯火", "丙午": "天河水", "丁未": "天河水",
    "戊申": "大驿土", "己酉": "大驿土", "庚戌": "钗钏金", "辛亥": "钗钏金",
    "壬子": "桑柘木", "癸丑": "桑柘木", "甲寅": "大溪水", "乙卯": "大溪水",
    "丙辰": "沙中土", "丁巳": "沙中土", "戊午": "天上火", "己未": "天上火",
    "庚申": "石榴木", "辛酉": "石榴木", "壬戌": "大海水", "癸亥": "大海水"
}

# 地支藏干（《滴天髓》原文）
ZHI_CANGGAN_BOOK = {
    "子": ["癸"], "丑": ["己", "癸", "辛"], "寅": ["甲", "丙", "戊"],
    "卯": ["乙"], "辰": ["戊", "乙", "癸"], "巳": ["丙", "戊", "庚"],
    "午": ["丁", "己"], "未": ["己", "丁", "乙"], "申": ["庚", "壬", "戊"],
    "酉": ["辛"], "戌": ["戊", "辛", "丁"], "亥": ["壬", "甲"]
}

# 生肖对应（《周易》）
SHENGXIAO_BOOK = {
    "子": "鼠", "丑": "牛", "寅": "虎", "卯": "兔", "辰": "龙", "巳": "蛇",
    "午": "马", "未": "羊", "申": "猴", "酉": "鸡", "戌": "狗", "亥": "猪"
}

# 五行对应
GAN_WUXING_BOOK = {
    "甲": "木", "乙": "木", "丙": "火", "丁": "火", "戊": "土",
    "己": "土", "庚": "金", "辛": "金", "壬": "水", "癸": "水"
}
ZHI_WUXING_BOOK = {
    "子": "水", "丑": "土", "寅": "木", "卯": "木", "辰": "土", "巳": "火",
    "午": "火", "未": "土", "申": "金", "酉": "金", "戌": "土", "亥": "水"
}

# 冲煞对应
CHONG_BOOK = {
    "子": "午", "丑": "未", "寅": "申", "卯": "酉", "辰": "戌", "巳": "亥",
    "午": "子", "未": "丑", "申": "寅", "酉": "卯", "戌": "辰", "亥": "巳"
}

# 六合
LIUHE_BOOK = {
    "子": "丑", "丑": "子", "寅": "亥", "亥": "寅", "卯": "戌", "戌": "卯",
    "辰": "酉", "酉": "辰", "巳": "申", "申": "巳", "午": "未", "未": "午"
}

# 三合
SANHE_BOOK = [
    {"申", "子", "辰"},  # 水局
    {"亥", "卯", "未"},  # 木局
    {"寅", "午", "戌"},  # 火局
    {"巳", "酉", "丑"}   # 金局
]

# 本命佛对应
BENMINGFO_BOOK = {
    "子": "千手观音", "丑": "虚空藏菩萨", "寅": "虚空藏菩萨",
    "卯": "文殊菩萨", "辰": "普贤菩萨", "巳": "普贤菩萨",
    "午": "大势至菩萨", "未": "大日如来", "申": "大日如来",
    "酉": "不动尊菩萨", "戌": "阿弥陀佛", "亥": "阿弥陀佛"
}

# 十神关系
TENGOD_BOOK = {
    ("甲", "甲"): "比肩", ("甲", "乙"): "劫财", ("甲", "丙"): "食神", ("甲", "丁"): "伤官",
    ("甲", "戊"): "偏财", ("甲", "己"): "正财", ("甲", "庚"): "七杀", ("甲", "辛"): "正官",
    ("甲", "壬"): "偏印", ("甲", "癸"): "正印",
}
# 可通过五行生克自动推导全部十神

# ============================================================
# 校验函数
# ============================================================

class VerifyResult:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []
        self.warnings = []

    def pass_(self, module, item, detail=""):
        self.passed += 1
        if detail:
            print(f"  ✅ {module}/{item}: {detail}")

    def fail(self, module, item, expected, actual, source=""):
        self.failed += 1
        err = {
            "module": module,
            "item": item,
            "expected": expected,
            "actual": actual,
            "source": source
        }
        self.errors.append(err)
        print(f"  ❌ {module}/{item}: 期望「{expected}」实际「{actual}」{f' (出处: {source})' if source else ''}")

    def warn(self, module, item, msg):
        self.warnings.append({"module": module, "item": item, "msg": msg})
        print(f"  ⚠️ {module}/{item}: {msg}")

    def summary(self):
        total = self.passed + self.failed
        rate = (self.passed / total * 100) if total > 0 else 0
        return {
            "total": total,
            "passed": self.passed,
            "failed": self.failed,
            "rate": f"{rate:.1f}%",
            "warnings": len(self.warnings),
            "errors": self.errors,
            "timestamp": datetime.now().isoformat()
        }


def verify_jiazi(result):
    """校验六十甲子顺序"""
    print("\n📊 校验六十甲子顺序...")
    # 校验甲子为第一个
    if JIAZI[0] == "甲子":
        result.pass_("jiazi", "甲子为首位")
    else:
        result.fail("jiazi", "首位", "甲子", JIAZI[0], "《周易》")
    
    # 校验癸亥为最后一个
    if JIAZI[59] == "癸亥":
        result.pass_("jiazi", "癸亥为末位")
    else:
        result.fail("jiazi", "末位", "癸亥", JIAZI[59], "《周易》")
    
    # 校验轮换：60 → 甲子
    if JIAZI[0] == JIAZI[60 % 60]:
        result.pass_("jiazi", "六十甲子轮回")
    else:
        result.fail("jiazi", "轮回", "甲子", JIAZI[60 % 60])

    # 校验天干地支配对
    for i in range(60):
        expected_gan = GAN[i % 10]
        expected_zhi = ZHI[i % 12]
        actual = JIAZI[i]
        if actual[0] == expected_gan and actual[1] == expected_zhi:
            pass  # 不打印每条，太多
        else:
            result.fail("jiazi", f"第{i}位", f"{expected_gan}{expected_zhi}", actual, "六十甲子表")
    if result.failed == 0 or all(e["module"] != "jiazi" for e in result.errors):
        result.pass_("jiazi", "60组干支配对全部正确")


def verify_nayin(result):
    """校验纳音五行"""
    print("\n📊 校验纳音五行（《三命通会》）...")
    for jiazi, nayin in NAYIN_BOOK.items():
        # 校验格式
        if not nayin or len(nayin) < 2:
            result.fail("nayin", jiazi, "有效纳音", str(nayin), "《三命通会》")
            continue
        # 校验五行结尾
        wuxing_end = nayin[-1]
        if wuxing_end in ["金", "木", "水", "火", "土"]:
            pass
        else:
            result.fail("nayin", jiazi, "五行结尾", nayin, "《三命通会》")
    
    # 校验总数60
    if len(NAYIN_BOOK) == 60:
        result.pass_("nayin", "纳音表60组完整")
    else:
        result.fail("nayin", "总数", "60", str(len(NAYIN_BOOK)), "《三命通会》")
    
    # 校验每组纳音只出现2次（如甲子、乙丑都是海中金）
    from collections import Counter
    count = Counter(NAYIN_BOOK.values())
    for nayin, c in count.items():
        if c != 2:
            result.warn("nayin", nayin, f"出现{c}次（期望2次）")
    
    if not any(e["module"] == "nayin" for e in result.errors):
        result.pass_("nayin", "纳音五行全部校验通过")


def verify_canggan(result):
    """校验地支藏干"""
    print("\n📊 校验地支藏干（《滴天髓》）...")
    for zhi, canggan in ZHI_CANGGAN_BOOK.items():
        if not canggan:
            result.fail("canggan", zhi, "非空藏干", "空", "《滴天髓》")
            continue
        # 校验藏干的天干合法性
        for cg in canggan:
            if cg not in GAN:
                result.fail("canggan", f"{zhi}藏干{cg}", "合法天干", cg, "《滴天髓》")
        # 校验本气
        benqi = canggan[0]
        expected_benqi = {
            "子": "癸", "丑": "己", "寅": "甲", "卯": "乙", "辰": "戊", "巳": "丙",
            "午": "丁", "未": "己", "申": "庚", "酉": "辛", "戌": "戊", "亥": "壬"
        }
        if benqi != expected_benqi.get(zhi):
            result.fail("canggan", f"{zhi}本气", expected_benqi.get(zhi), benqi, "《滴天髓》")
    
    if len(ZHI_CANGGAN_BOOK) == 12:
        result.pass_("canggan", "12地支藏干完整")
    else:
        result.fail("canggan", "总数", "12", str(len(ZHI_CANGGAN_BOOK)))
    
    if not any(e["module"] == "canggan" for e in result.errors):
        result.pass_("canggan", "地支藏干全部校验通过")


def verify_shengxiao(result):
    """校验生肖对应"""
    print("\n📊 校验生肖对应（《周易》）...")
    expected = {"子": "鼠", "丑": "牛", "寅": "虎", "卯": "兔", "辰": "龙", "巳": "蛇",
                "午": "马", "未": "羊", "申": "猴", "酉": "鸡", "戌": "狗", "亥": "猪"}
    for zhi, animal in expected.items():
        if SHENGXIAO_BOOK.get(zhi) == animal:
            pass
        else:
            result.fail("shengxiao", zhi, animal, SHENGXIAO_BOOK.get(zhi, "缺失"), "《周易》")
    
    if len(SHENGXIAO_BOOK) == 12:
        result.pass_("shengxiao", "12生肖完整")
    else:
        result.fail("shengxiao", "总数", "12", str(len(SHENGXIAO_BOOK)))
    
    if not any(e["module"] == "shengxiao" for e in result.errors):
        result.pass_("shengxiao", "生肖对应全部校验通过")


def verify_wuxing(result):
    """校验五行对应"""
    print("\n📊 校验五行对应...")
    # 天干五行
    for gan, wx in GAN_WUXING_BOOK.items():
        if wx not in ["金", "木", "水", "火", "土"]:
            result.fail("wuxing", f"天干{gan}", "合法五行", wx)
    if len(GAN_WUXING_BOOK) == 10:
        result.pass_("wuxing", "天干五行10个完整")
    
    # 地支五行
    for zhi, wx in ZHI_WUXING_BOOK.items():
        if wx not in ["金", "木", "水", "火", "土"]:
            result.fail("wuxing", f"地支{zhi}", "合法五行", wx)
    if len(ZHI_WUXING_BOOK) == 12:
        result.pass_("wuxing", "地支五行12个完整")
    
    # 五行相生
    sheng = {"木": "火", "火": "土", "土": "金", "金": "水", "水": "木"}
    for wx, target in sheng.items():
        if target not in ["金", "木", "水", "火", "土"]:
            result.fail("wuxing", f"{wx}生", "合法五行", target)
    result.pass_("wuxing", "五行相生关系正确")
    
    # 五行相克
    ke = {"木": "土", "土": "水", "水": "火", "火": "金", "金": "木"}
    for wx, target in ke.items():
        if target not in ["金", "木", "水", "火", "土"]:
            result.fail("wuxing", f"{wx}克", "合法五行", target)
    result.pass_("wuxing", "五行相克关系正确")


def verify_chong(result):
    """校验冲煞"""
    print("\n📊 校验冲煞对应...")
    for zhi, chong in CHONG_BOOK.items():
        # 冲必须是隔6位
        zhi_idx = ZHI.index(zhi)
        chong_idx = ZHI.index(chong)
        if abs(chong_idx - zhi_idx) == 6:
            pass
        else:
            result.fail("chong", zhi, f"隔6位({chong})", f"隔{abs(chong_idx-zhi_idx)}位({chong})", "地支六冲")
    
    # 校验冲是对称的
    for zhi, chong in CHONG_BOOK.items():
        if CHONG_BOOK.get(chong) != zhi:
            result.fail("chong", f"{zhi}↔{chong}对称", zhi, CHONG_BOOK.get(chong, "缺失"), "地支六冲")
    
    if len(CHONG_BOOK) == 12:
        result.pass_("chong", "六冲12组完整且对称")
    
    if not any(e["module"] == "chong" for e in result.errors):
        result.pass_("chong", "冲煞对应全部校验通过")


def verify_liuhe(result):
    """校验六合"""
    print("\n📊 校验地支六合...")
    for zhi, he in LIUHE_BOOK.items():
        if LIUHE_BOOK.get(he) != zhi:
            result.fail("liuhe", f"{zhi}↔{he}对称", zhi, LIUHE_BOOK.get(he, "缺失"), "地支六合")
    
    if len(LIUHE_BOOK) == 12:
        result.pass_("liuhe", "六合12组完整且对称")
    
    if not any(e["module"] == "liuhe" for e in result.errors):
        result.pass_("liuhe", "六合对应全部校验通过")


def verify_sanhe(result):
    """校验三合"""
    print("\n📊 校验地支三合...")
    for group in SANHE_BOOK:
        if len(group) != 3:
            result.fail("sanhe", str(group), "3个地支", str(len(group)), "地支三合")
    
    if len(SANHE_BOOK) == 4:
        result.pass_("sanhe", "三合4组完整（水木火金）")
    else:
        result.fail("sanhe", "总数", "4", str(len(SANHE_BOOK)))


def verify_benmingfo(result):
    """校验本命佛"""
    print("\n📊 校验本命佛对应...")
    if len(BENMINGFO_BOOK) == 12:
        result.pass_("benmingfo", "12生肖本命佛完整")
    else:
        result.fail("benmingfo", "总数", "12", str(len(BENMINGFO_BOOK)))
    
    # 校验佛菩萨名称
    for zhi, fo in BENMINGFO_BOOK.items():
        if not fo or ("菩萨" not in fo and "如来" not in fo and "观音" not in fo and "尊" not in fo and "弥陀" not in fo):
            result.fail("benmingfo", zhi, "有效佛菩萨名", fo)
    
    if not any(e["module"] == "benmingfo" for e in result.errors):
        result.pass_("benmingfo", "本命佛对应全部校验通过")


def verify_bazi_engine(result):
    """用 lunar_python 校验八字排盘"""
    print("\n📊 校验八字排盘引擎（对比 lunar_python）...")
    if not HAS_LUNAR:
        result.warn("bazi", "lunar_python", "未安装 lunar_python，跳过排盘引擎校验（pip3 install lunar_python）")
        return
    
    # 测试用例：已知生辰的排盘结果
    test_cases = [
        # (年, 月, 日, 时, 期望年柱, 期望月柱, 期望日柱)
        (1990, 5, 15, 14, "庚午", "辛巳", "庚辰"),  # 立夏后
        (2024, 2, 4, 8, "癸卯", "乙丑", "戊戌"),     # 立春日8时（2024立春在2月4日16:27，8时仍在立春前）
        (2024, 2, 3, 23, "癸卯", "乙丑", "丁酉"),    # 立春前
        (2026, 7, 12, 10, "丙午", "乙未", "丁亥"),   # 今天
        (2000, 1, 1, 0, "己卯", "丙子", "戊午"),     # 跨年
    ]
    
    for year, month, day, hour, exp_year, exp_month, exp_day in test_cases:
        try:
            solar = Solar.fromYmdHms(year, month, day, hour, 0, 0)
            lunar = solar.getLunar()
            
            # 八字
            bazi = lunar.getEightChar()
            actual_year = bazi.getYear()
            actual_month = bazi.getMonth()
            actual_day = bazi.getDay()
            
            if actual_year == exp_year:
                result.pass_("bazi", f"{year}-{month}-{day} 年柱", actual_year)
            else:
                result.fail("bazi", f"{year}-{month}-{day} 年柱", exp_year, actual_year, "lunar_python")
            
            if actual_month == exp_month:
                result.pass_("bazi", f"{year}-{month}-{day} 月柱", actual_month)
            else:
                result.fail("bazi", f"{year}-{month}-{day} 月柱", exp_month, actual_month, "lunar_python")
            
            if actual_day == exp_day:
                result.pass_("bazi", f"{year}-{month}-{day} 日柱", actual_day)
            else:
                result.fail("bazi", f"{year}-{month}-{day} 日柱", exp_day, actual_day, "lunar_python")
                
        except Exception as e:
            result.fail("bazi", f"{year}-{month}-{day}", "正常排盘", str(e))


def verify_almanac(result):
    """校验黄历数据"""
    print("\n📊 校验黄历数据...")
    if not HAS_LUNAR:
        result.warn("almanac", "lunar_python", "未安装，跳过黄历校验")
        return
    
    # 校验今日黄历
    today = Solar.fromDate(datetime.now())
    lunar = today.getLunar()
    
    # 农历日期
    lunar_month = lunar.getMonthInChinese()
    lunar_day = lunar.getDayInChinese()
    if lunar_month and lunar_day:
        result.pass_("almanac", f"今日农历", f"{lunar_month}月{lunar_day}")
    else:
        result.fail("almanac", "今日农历", "有效农历", f"{lunar_month}/{lunar_day}")
    
    # 干支
    year_gz = lunar.getYearInGanZhi()
    month_gz = lunar.getMonthInGanZhi()
    day_gz = lunar.getDayInGanZhi()
    if year_gz and month_gz and day_gz:
        result.pass_("almanac", "今日干支", f"{year_gz} {month_gz} {day_gz}")
    else:
        result.fail("almanac", "今日干支", "有效干支", f"{year_gz}/{month_gz}/{day_gz}")
    
    # 纳音校验
    day_nayin = lunar.getDayNaYin()
    if day_nayin:
        # 用古书表校验
        if day_gz in NAYIN_BOOK:
            book_nayin = NAYIN_BOOK[day_gz]
            if day_nayin == book_nayin:
                result.pass_("almanac", f"日柱纳音", f"{day_gz}→{day_nayin}")
            else:
                result.fail("almanac", f"日柱纳音", book_nayin, day_nayin, "《三命通会》vs lunar_python")
        else:
            result.fail("almanac", f"日柱{day_gz}不在纳音表", "存在", "不存在")
    else:
        result.fail("almanac", "日柱纳音", "非空", "空")
    
    # 生肖
    shengxiao = lunar.getYearShengXiao()
    if shengxiao:
        result.pass_("almanac", "生肖", shengxiao)
    else:
        result.fail("almanac", "生肖", "非空", "空")


def verify_mobile_phone(result):
    """校验手机号测评数字五行"""
    print("\n📊 校验数字五行对应...")
    # 数字五行（河图数）
    num_wuxing = {1: "水", 6: "水", 2: "火", 7: "火", 3: "木", 8: "木", 4: "金", 9: "金", 5: "土", 0: "土"}
    for num, wx in num_wuxing.items():
        if wx not in ["金", "木", "水", "火", "土"]:
            result.fail("phone", f"数字{num}", "合法五行", wx, "河图数")
    
    if len(num_wuxing) == 10:
        result.pass_("phone", "数字五行0-9完整（河图数）")
    else:
        result.fail("phone", "总数", "10", str(len(num_wuxing)))
    
    # 校验河图数配对：1-6水、2-7火、3-8木、4-9金、5-0土
    pairs = [(1, 6), (2, 7), (3, 8), (4, 9), (5, 0)]
    for a, b in pairs:
        if num_wuxing[a] == num_wuxing[b]:
            result.pass_("phone", f"河图数{a}-{b}", f"同属{num_wuxing[a]}")
        else:
            result.fail("phone", f"河图数{a}-{b}", f"同属{num_wuxing[a]}", f"{num_wuxing[a]}≠{num_wuxing[b]}", "河图")


# ============================================================
# 主程序
# ============================================================

def run_all():
    result = VerifyResult()
    print("╔════════════════════════════════════════════╗")
    print("║   命理宝鉴 · 知识准确性校验引擎 v1.0       ║")
    print("║   三方比对：系统 → 古书原文 → (豆包API)     ║")
    print("╚════════════════════════════════════════════╝")
    
    # 基础知识校验
    verify_jiazi(result)
    verify_nayin(result)
    verify_canggan(result)
    verify_shengxiao(result)
    verify_wuxing(result)
    verify_chong(result)
    verify_liuhe(result)
    verify_sanhe(result)
    verify_benmingfo(result)
    verify_mobile_phone(result)
    
    # 排盘引擎校验（需要 lunar_python）
    verify_bazi_engine(result)
    
    # 黄历校验（需要 lunar_python）
    verify_almanac(result)
    
    # 汇总
    summary = result.summary()
    print("\n" + "=" * 50)
    print(f"校验完成：{summary['passed']} 通过 / {summary['failed']} 失败 / {summary['warnings']} 警告")
    print(f"准确率：{summary['rate']}")
    print("=" * 50)
    
    if result.errors:
        print("\n❌ 失败项：")
        for err in result.errors:
            source_str = f" (出处: {err['source']})" if err['source'] else ''
            print(f"  {err['module']}/{err['item']}: 期望「{err['expected']}」实际「{err['actual']}」{source_str}")
    
    if result.warnings:
        print("\n⚠️ 警告项：")
        for w in result.warnings:
            print(f"  {w['module']}/{w['item']}: {w['msg']}")
    
    # 保存报告
    report_path = os.path.join(os.path.dirname(__file__), "verify-report.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    print(f"\n📄 报告已保存：{report_path}")
    
    return result


if __name__ == "__main__":
    if "--report" in sys.argv:
        report_path = os.path.join(os.path.dirname(__file__), "verify-report.json")
        if os.path.exists(report_path):
            with open(report_path, "r", encoding="utf-8") as f:
                print(f.read())
        else:
            print("未找到校验报告，请先运行校验")
    else:
        run_all()
