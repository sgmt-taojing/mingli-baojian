#!/usr/bin/env python3
"""kb-keywords-fill.py — 为 kb_formal 中 keywords 缺失的条目规则法补齐关键词。

双通道提取（确定性、零幻觉、只写不删）：
  1. 标题通道：【...】括号头 / 短标题本身
  2. 词典通道：内置命理+中医领域术语词典在标题/正文中的命中（长词优先）

存储格式：JSON 数组字符串，与存量 ["bazi","ziwei"] 格式一致。
keywords 不在 kb_fts5 列内（entry_id/module/summary/content/tags/category），无需 FTS5 同步。

用法：
  python3 scripts/kb-keywords-fill.py --dry-run     # 只看规模和样例，不写库
  python3 scripts/kb-keywords-fill.py               # 先备份受影响行到 DELIVERY/，再正式执行
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

# ---------- 领域术语词典 ----------
TCM_TERMS = """
阴阳 五行 八纲 脏腑 气血 津液 经络 六经 卫气营血 三焦 四诊 望诊 闻诊 问诊 切诊
舌诊 脉诊 面诊 目诊 耳诊 腹诊 手诊 辨证 论治 治则 治法 汗法 吐法 下法 和法
温法 清法 补法 消法 解表 清热 泻下 和解 温里 补益 理气 活血 止血 化痰 祛湿
安神 开窍 息风 收涩 脏腑辨证 六经辨证 卫气营血辨证 三焦辨证 八纲辨证
气血津液辨证 病因辨证 七情 六淫 风寒 风热 风湿 寒湿 湿热 燥热 痰饮 瘀血
气滞 气虚 血虚 阴虚 阳虚 阴阳两虚 肝郁 脾虚 肾虚 心火 肺热 胃火 肝阳上亢
肝肾阴虚 脾肾阳虚 心脾两虚 心肾不交 肝胃不和 少阳 太阳 阳明 太阴 少阴 厥阴
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
星曜 紫微星 天机 武曲 天同 廉贞 天府 太阴 贪狼 巨门 天相 天梁 破军
左辅 右弼 文昌 文曲 天魁 天钺 禄存 天马 擎羊 陀罗 火星 铃星 地空
地劫 化禄 化权 化科 化忌 四化 神煞 天乙贵人 桃花 驿马 华盖 羊刃
空亡 纳音 生克制化 合化 刑冲克害 三合 六合 三会 六冲 相刑 相害
排盘 命盘 卦象 爻辞 动爻 变卦 互卦 体用 应期 起卦 断卦 山向 罗盘
龙脉 砂水 明堂 阳宅 阴宅 峦头 理气 择日 择吉 黄历 姓名学 五格 三才
生肖 属相 面相 手相 痣相 骨相 称骨 灵签 解签 姻缘 财运 事业 学业
流年运势 化解 趋避 合婚 婚配 胎元 小限 大限 命主 身主 庙旺 落陷
得地 失陷 夹宫 三方四正 格局 富贵 贫贱 寿夭 六亲 移宫 换宫
""".split()

# 长词优先，避免「太阳」这类歧义短词抢先（歧义词从命理词典剔除——太阳在中医语境为六经之一）
AMBIGUOUS = {"太阳", "火星", "太阴", "天机", "天府"}
DICT_TERMS = sorted(set(TCM_TERMS + MINGLI_TERMS) - AMBIGUOUS, key=len, reverse=True)

BRACKET_RE = re.compile(r"【([^】]{2,30})】")
DASH_SPLIT_RE = re.compile(r"[-—–·:：]")

MAX_KW = 6


def extract_title_kw(title: str):
    """标题通道：【X】括号头（去后缀），或短标题本身。"""
    out = []
    if not title:
        return out
    m = BRACKET_RE.search(title)
    if m:
        head = m.group(1)
        head = DASH_SPLIT_RE.split(head)[0].strip()
        if 2 <= len(head) <= 12:
            out.append(head)
    else:
        t = title.strip()
        t = DASH_SPLIT_RE.split(t)[0].strip()
        if 2 <= len(t) <= 12:
            out.append(t)
    return out


def extract_dict_kw(title: str, content: str):
    """词典通道：正文前 800 字命中计数，标题命中 +3 加权。"""
    text = (content or "")[:800]
    title = title or ""
    hits = []
    for term in DICT_TERMS:
        cnt = text.count(term)
        if cnt == 0 and term not in title:
            continue
        score = cnt + (3 if term in title else 0)
        # 长词（更具体）轻微加权
        score += 0.1 * len(term)
        hits.append((score, term))
    hits.sort(key=lambda x: (-x[0], -len(x[1])))
    return [t for _, t in hits[:5]]


def build_keywords(title: str, content: str):
    kws = []
    for k in extract_title_kw(title) + extract_dict_kw(title, content):
        if k not in kws:
            kws.append(k)
        if len(kws) >= MAX_KW:
            break
    return kws


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    db = sqlite3.connect(str(DB))
    cur = db.cursor()
    cur.execute(
        "SELECT entry_id, module, title, content FROM kb_formal "
        "WHERE keywords IS NULL OR TRIM(keywords)=''"
    )
    rows = cur.fetchall()
    print(f"missing keywords: {len(rows)}")

    plan = []  # (entry_id, kw_list)
    fallback = []
    for entry_id, module, title, content in rows:
        kws = build_keywords(title or "", content or "")
        if kws:
            plan.append((entry_id, kws))
        else:
            # 兜底：英文标题/OCR 乱码条目用模块名作唯一关键词，保证零缺失
            plan.append((entry_id, [module or "kb"]))
            fallback.append((entry_id, module, (title or "")[:60]))

    print(f"will fill: {len(plan)}  |  module-fallback: {len(fallback)}")
    if fallback:
        print("--- fallback samples ---")
        for r in fallback[:10]:
            print(r)

    # 样例抽检
    print("--- samples ---")
    for entry_id, kws in plan[:15]:
        print(entry_id, "->", kws)

    if args.dry_run:
        db.close()
        return

    # 备份受影响行
    DELIVERY.mkdir(exist_ok=True)
    ts = time.strftime("%Y%m%d-%H%M%S")
    bak = DELIVERY / f"kb-keywords-backup-{ts}.json"
    with open(bak, "w", encoding="utf-8") as f:
        json.dump(
            [{"entry_id": e, "keywords_old": None} for e, _ in plan],
            f, ensure_ascii=False,
        )
    print(f"backup -> {bak}")

    # 正式写入（只 UPDATE keywords，不动其他列）
    ts_iso = time.strftime("%Y-%m-%dT%H:%M:%S")
    for entry_id, kws in plan:
        cur.execute(
            "UPDATE kb_formal SET keywords=?, updated_at=? WHERE entry_id=?",
            (json.dumps(kws, ensure_ascii=False), ts_iso, entry_id),
        )
    db.commit()

    # 验证
    cur.execute("SELECT COUNT(*) FROM kb_formal WHERE keywords IS NULL OR TRIM(keywords)=''")
    remaining = cur.fetchone()[0]
    print(f"done. remaining missing: {remaining}")
    db.close()


if __name__ == "__main__":
    sys.exit(main())
