#!/usr/bin/env python3
"""kb-keywords-clean.py — 清洗历史 keywords 噪声（n-gram 碎片 + 格式混用）。

规则（确定性、零幻觉）：
  保留元素 iff 命中任一白名单规则：
    1. 领域词典（命理+中医，与 kb-keywords-fill.py 同源）
    2. 来源/书名人名白名单（倪师、太清神鉴、三命通会…）
    3. 卷数标记（卷10/卷六）
    4. 纯 ASCII 模块标签（nihaisha-tcm、bazi）
    5. 出现于标题（≥2 字）
    6. 《...》书名形态
  清洗后不足 3 个 → 用词典提取补齐；上限 8 个。
  全部输出统一为 JSON 数组字符串。

用法：
  python3 scripts/kb-keywords-clean.py --dry-run
  python3 scripts/kb-keywords-clean.py            # 备份受影响行后正式执行
"""
import argparse
import json
import re
import sqlite3
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT / "server" / "database" / "yidao.db"
DELIVERY = ROOT / "DELIVERY"

TCM_TERMS = """
阴阳 五行 八纲 脏腑 气血 津液 经络 六经 卫气营血 三焦 四诊 望诊 闻诊 问诊 切诊
舌诊 脉诊 面诊 目诊 耳诊 腹诊 手诊 辨证 论治 治则 治法 汗法 吐法 下法 和法
温法 清法 补法 消法 解表 清热 泻下 和解 温里 补益 理气 活血 止血 化痰 祛湿
安神 开窍 息风 收涩 脏腑辨证 六经辨证 卫气营血辨证 三焦辨证 八纲辨证
气血津液辨证 病因辨证 七情 六淫 风寒 风热 风湿 寒湿 湿热 燥热 痰饮 瘀血
气滞 气虚 血虚 阴虚 阳虚 阴阳两虚 肝郁 脾虚 肾虚 心火 肺热 胃火 肝阳上亢
肝肾阴虚 脾肾阳虚 心脾两虚 心肾不交 肝胃不和 少阳 阳明 厥阴
桂枝汤 麻黄汤 小柴胡汤 大柴胡汤 白虎汤 承气汤 四逆汤 四君子汤 四物汤
六味地黄丸 金匮肾气丸 逍遥散 归脾汤 补中益气汤 血府逐瘀汤 温胆汤 半夏泻心汤
黄连解毒汤 龙胆泻肝汤 平胃散 藿香正气散 银翘散 桑菊饮 真武汤 苓桂术甘汤
针刺 艾灸 推拿 拔罐 刮痧 穴位 腧穴 任脉 督脉 十二经脉 奇经八脉 五输穴
原穴 络穴 郄穴 募穴 俞穴 八会穴 下合穴 望舌 舌质 舌苔 舌下 脉象
浮脉 沉脉 迟脉 数脉 滑脉 涩脉 弦脉 细脉 洪脉 濡脉 结脉 代脉 五色
五轮 八廓 囟门 山根 印堂 人中 肿瘤 发热 咳嗽 头痛 眩晕 失眠 心悸
胸痹 胃痛 腹痛 泄泻 便秘 黄疸 水肿 消渴 痹证 痿证 中风 感冒 哮喘
痢疾 疟疾 月经不调 痛经 闭经 带下 妊娠 产后 疳积 惊风 麻疹 温病
瘟疫 伤寒 杂病 金匮 素问 灵枢 难经 伤寒论 金匮要略 温病条辨 脾胃论
医宗金鉴 本草纲目 景岳全书 类经 濒湖脉学 针灸甲乙经 针灸大成 药性赋
汤头歌诀 望诊遵经 倪海厦 经方 时方 验方 医案 病案 药对 炮炙 性味
归经 升降浮沉 君臣佐使 十八反 十九畏 妊娠禁忌 煎服法 儿科 妇科 男科
五官科 皮肤科 骨伤科 肿瘤科 急诊科 养生 食疗 药膳 导引 气功 太极
""".split()

MINGLI_TERMS = """
八字 四柱 紫微斗数 紫微 六爻 奇门遁甲 奇门 梅花易数 大六壬 小六壬 六壬
金口诀 太乙神数 风水 堪舆 玄空 飞星 九宫 洛书 河图 八卦 天干 地支
干支 十神 正官 七杀 正印 偏印 比肩 劫财 食神 伤官 正财 偏财 日主
日元 用神 忌神 喜神 仇神 大运 流年 太岁 命宫 身宫 十二宫 兄弟宫
夫妻宫 子女宫 财帛宫 疾厄宫 迁移宫 交友宫 官禄宫 田宅宫 福德宫 父母宫
星曜 紫微星 天机 武曲 天同 廉贞 天府 贪狼 巨门 天相 天梁 破军
左辅 右弼 文昌 文曲 天魁 天钺 禄存 天马 擎羊 陀罗 铃星 地空
地劫 化禄 化权 化科 化忌 四化 神煞 天乙贵人 桃花 驿马 华盖 羊刃
空亡 纳音 生克制化 合化 刑冲克害 三合 六合 三会 六冲 相刑 相害
排盘 命盘 卦象 爻辞 动爻 变卦 互卦 体用 应期 起卦 断卦 山向 罗盘
龙脉 砂水 明堂 阳宅 阴宅 峦头 理气 择日 择吉 黄历 姓名学 五格 三才
生肖 属相 面相 手相 痣相 骨相 称骨 灵签 解签 姻缘 财运 事业 学业
流年运势 化解 趋避 合婚 婚配 胎元 小限 大限 命主 身主 庙旺 落陷
得地 失陷 夹宫 三方四正 格局 富贵 贫贱 寿夭 六亲 相术
""".split()

# 来源/作者/书名白名单（词典未覆盖的）
SOURCE_WHITELIST = set("""
倪师 路总 舒晗 梁冬 王朴 邵雍 陈抟 徐子平 万民英 张景岳 李时珍 孙思邈
太清神鉴 麻衣神相 柳庄相法 神相全编 渊海子平 三命通会 滴天髓 穷通宝鉴
子平真诠 星平会海 紫微斗数全书 铁板神数 皇极经世 黄帝内经 神农本草经
备急千金要方 千金翼方 外台秘要 名医类案 丹溪心法 儒门事亲 兰室秘藏
温疫论 温热论 医林改错 傅青主女科 小儿药证直诀 脾胃论 格致余论
视频同步文稿 网盘PDF 原文朗读 图文 讲义 笔记 口传 秘传 白话解
""".split())

AMBIGUOUS = {"太阳", "火星", "太阴", "天机", "天府"}
DICT_TERMS = set(TCM_TERMS + MINGLI_TERMS) - AMBIGUOUS
DICT_SORTED = sorted(DICT_TERMS, key=len, reverse=True)

VOLUME_RE = re.compile(r"^卷[\d零一二三四五六七八九十百]+$")
ASCII_TAG_RE = re.compile(r"^[a-zA-Z][a-zA-Z0-9_-]{1,30}$")
BOOK_RE = re.compile(r"^《[^》]{1,20}》$")
BRACKET_RE = re.compile(r"【([^】]{2,30})】")
DASH_SPLIT_RE = re.compile(r"[-—–·:：]")
DATE_FRAG_RE = re.compile(r"^\d{1,4}$|^\d{1,2}月(\d{1,2}日)?$|^\d{4}年$")
ASCII_SLUG_RE = re.compile(r"^[a-zA-Z0-9 _-]+$")

MIN_KEEP = 3
MAX_KW = 8


def parse_elements(kw: str):
    """JSON 数组或逗号分隔字符串 → 元素列表。"""
    kw = (kw or "").strip()
    if not kw:
        return []
    if kw.startswith("["):
        try:
            v = json.loads(kw)
            if isinstance(v, list):
                return [str(x).strip() for x in v if str(x).strip()]
        except Exception:
            pass
    return [x.strip() for x in re.split(r"[,，;；]", kw) if x.strip()]


def keep_element(e: str, title: str):
    if DATE_FRAG_RE.match(e):
        return False  # 纯日期/数字碎片一律弃
    if e in DICT_TERMS or e in SOURCE_WHITELIST:
        return True
    if VOLUME_RE.match(e) or ASCII_TAG_RE.match(e) or BOOK_RE.match(e):
        return True
    # 标题回指：仅限短标题（长标题多为转写文本，回指会保住噪声碎片）
    if len(e) >= 2 and title and len(title) <= 30 and e in title:
        return True
    return False


def extract_dict_kw(title: str, content: str):
    text = (content or "")[:800]
    title = title or ""
    hits = []
    for term in DICT_SORTED:
        cnt = text.count(term)
        if cnt == 0 and term not in title:
            continue
        score = cnt + (3 if term in title else 0) + 0.1 * len(term)
        hits.append((score, term))
    hits.sort(key=lambda x: (-x[0], -len(x[1])))
    return [t for _, t in hits[:5]]


def extract_title_kw(title: str):
    if not title or ASCII_SLUG_RE.match(title.strip()):
        return []  # 纯英文 slug 不做标题头提取
    m = BRACKET_RE.search(title)
    if m:
        head = DASH_SPLIT_RE.split(m.group(1))[0].strip()
        if 2 <= len(head) <= 12 and not DATE_FRAG_RE.match(head) and not ASCII_SLUG_RE.match(head):
            return [head]
    t = DASH_SPLIT_RE.split(title.strip())[0].strip()
    if 2 <= len(t) <= 12 and not DATE_FRAG_RE.match(t) and not ASCII_SLUG_RE.match(t):
        return [t]
    return []


def clean_keywords(kw: str, title: str, content: str):
    """返回 (新列表, 是否有变化)。"""
    elems = parse_elements(kw)
    kept = []
    for e in elems:
        if keep_element(e, title or "") and e not in kept:
            kept.append(e)
    if len(kept) < MIN_KEEP:
        for t in extract_title_kw(title or "") + extract_dict_kw(title or "", content or ""):
            if t not in kept:
                kept.append(t)
            if len(kept) >= 5:
                break
    if not kept:
        kept = ["kb"]
    kept = kept[:MAX_KW]
    changed = kept != elems  # 纯字符串格式迁移也算 changed
    return kept, changed


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    db = sqlite3.connect(str(DB))
    cur = db.cursor()
    # 跳过本轮 fill 批次（已是干净 JSON）：updated_at 15:54 时间窗
    cur.execute(
        "SELECT entry_id, module, title, content, keywords FROM kb_formal "
        "WHERE keywords IS NOT NULL AND TRIM(keywords)!='' "
        "AND updated_at NOT LIKE '2026-08-28T15:5%'"
    )
    rows = cur.fetchall()
    print(f"scan: {len(rows)} entries with keywords (excluding today's fill batch)")

    plan = []
    dropped_total = 0
    for entry_id, module, title, content, kw in rows:
        new_kw, changed = clean_keywords(kw, title, content)
        if changed:
            plan.append((entry_id, kw, new_kw))
            dropped_total += len(parse_elements(kw)) - min(len(parse_elements(kw)), len(new_kw))

    print(f"will rewrite: {len(plan)}")
    print("--- samples (before -> after) ---")
    for entry_id, old, new in plan[:15]:
        print(f"{entry_id}\n  OLD: {old[:120]}\n  NEW: {json.dumps(new, ensure_ascii=False)}")

    if args.dry_run:
        db.close()
        return

    DELIVERY.mkdir(exist_ok=True)
    ts = time.strftime("%Y%m%d-%H%M%S")
    bak = DELIVERY / f"kb-keywords-clean-backup-{ts}.json"
    with open(bak, "w", encoding="utf-8") as f:
        json.dump([{"entry_id": e, "keywords_old": o} for e, o, _ in plan], f, ensure_ascii=False)
    print(f"backup -> {bak}")

    ts_iso = time.strftime("%Y-%m-%dT%H:%M:%S")
    for entry_id, _, new_kw in plan:
        cur.execute(
            "UPDATE kb_formal SET keywords=?, updated_at=? WHERE entry_id=?",
            (json.dumps(new_kw, ensure_ascii=False), ts_iso, entry_id),
        )
    db.commit()

    # 验证
    cur.execute("SELECT keywords FROM kb_formal")
    bad = sum(
        1 for (kw,) in cur.fetchall()
        if not (kw.strip().startswith("[") and kw.strip().endswith("]"))
    )
    cur.execute("SELECT COUNT(*) FROM kb_formal")
    total = cur.fetchone()[0]
    print(f"done. rows={total} non_json_keywords={bad}")
    db.close()


if __name__ == "__main__":
    sys.exit(main())
