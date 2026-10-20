#!/usr/bin/env python3
"""
v8.2 P0 — internal-tag 泄漏根治 · 反向 SFT 数据生成器

根因诊断（来自 v8.1 30 题复评 idx=27）：
  - 输入：「请详细介绍「[EPB设备]」」
  - 模型：「根据系统记录，[EPB设备]是用于数据采集和分析的专业工具。
          它能够帮助我们更好地理解和应用传统术数知识，但请注意其仅供学习参考，
          并不替代专业医疗或决策建议。——L1」
  - 触雷：内部 L1/L2 模板标签泄漏 + 套话开篇（"根据系统记录"）

修真思路（反向 SFT）：
  当用户问题里出现 [xxx] 占位符时，模型应识别为「待补全的输入」/「模板标签」，
  不假装它是真实概念，不"根据系统记录"地编造解释，不输出内部模板标签
  (——L1 / ——L2 / [系统提示] / [内部] / #REF! 等)。

  生成 N 条覆盖：
    - 单占位符（[EPB设备] / [八字术语] / [卦象名称] / [诊断结果] …）
    - 占位符在句中（"请帮我分析 [出生时辰] 这几个字"）
    - 占位符在标题位（"## [标题]"）
    - 嵌套占位符（"[[变量]]"）
    - 占位符伪装成方括号引用（用户真实意图是引用，但用了 [xxx] 形式）
    - 中英文占位符（[user_input] / [未填字段]）

输出：
  training/mlx-r105-data/train.tagleak.jsonl  (反向 SFT 数据)
  training/mlx-r105-data/train.v82.jsonl      (clean3 + tagleak 合并)

使用：python3 scripts/gen-v82-tag-leak-sft.py [--count N] [--clean3 path]
"""

import argparse
import json
import os
import random
import sys
from pathlib import Path

random.seed(42)

# 禁止的内部标签 / 套话开头
FORBIDDEN_PATTERNS = [
    "——L1", "——L2", "——L3",
    "[系统提示]", "[内部]", "[系统记录]",
    "#REF!", "#NULL!", "#VALUE!",
    "根据系统记录",
    "我是AI助手",
    "作为AI",
    "我很抱歉",
]


# 12 类反向 SFT 模板
TEMPLATES = [
    # === A. 单纯占位符作为"概念名" ===
    {
        "scenario": "占位符作为概念名",
        "question": "请详细介绍「[{slot}]」",
        "good": "您提到的「[{slot}]」看上去像是一个待填写的占位符或标签，而不是一个具体的术语概念。\n\n"
                 "方便的话，请您：\n"
                 "  · 把它替换成您真正想了解的具体术语（比如某种术数概念、某种中医证候、某个工具名）；\n"
                 "  · 或者告诉我这个标签原本想表达什么，我再帮您展开讲解。\n\n"
                 "这样我就能给您一份有内容、有依据的回答，而不是凭空猜测一个并不存在的概念。",
    },
    {
        "scenario": "占位符作为概念名",
        "question": "什么是[{slot}]？",
        "good": "「[{slot}]」看上去像是一个占位符或待填字段，而不是已有术语的标准名称。\n\n"
                 "我没办法凭一个空标签去定义一个真实存在的概念。如果您是在套用某个模板，"
                 "请把[{slot}]替换成您真正想知道的术语（例如某种命理概念、某种中医证候、"
                 "某种工具/设备的真实名称），我就可以详细解答。\n\n"
                 "如果是您自创的标签，也可以告诉我您想用它代表什么，我帮您厘清。",
    },
    {
        "scenario": "占位符作为概念名",
        "question": "请解释一下「[{slot}]」这个概念",
        "good": "「[{slot}]」这个写法更像是模板里的占位符，而不是一个真实可查的概念。\n\n"
                 "为了给您准确、有用的解释，能否请您：\n"
                 "  1. 把它替换成具体术语；或\n"
                 "  2. 描述一下这个标签背后的实际含义；\n"
                 "  3. 说明您是从哪个模板/表单里复制过来的。\n\n"
                 "这样我能避免凭空编造一个并不存在的概念，也能确保不遗漏您真正想了解的内容。",
    },

    # === B. 占位符在句中 ===
    {
        "scenario": "占位符在句中",
        "question": "请帮我分析「[{slot}]」这几个字的命理含义",
        "good": "「[{slot}]」这几个字符看起来是占位符或未填字段，并不是具体的汉字组合。\n\n"
                 "要做命理分析（不管是八字用神、卦象爻辞还是姓名学），需要您提供真实可分析的字、词或术语。\n\n"
                 "建议您：\n"
                 "  · 直接告诉我具体的字（如「华」「泽」「乾」）；\n"
                 "  · 或者告诉我您想取名/想分析的几个汉字；\n"
                 "  · 如果是从某份模板复制过来的，请把[{slot}]替换成实际内容。\n\n"
                 "拿到具体内容后，我会从五行、十神、卦象等多个角度给您分析。",
    },
    {
        "scenario": "占位符在句中",
        "question": "中医里「[{slot}]」是什么意思？",
        "good": "「[{slot}]」不是具体的中医术语，更像是模板里还没填上的字段。\n\n"
                 "中医体系里有证候（气虚、阴虚、湿热…）、病名（消渴、痹症、不寐…）、方剂（六味地黄丸、桂枝汤…）"
                 "等多个层面的术语，每个具体概念都有清晰的内涵。\n\n"
                 "如果您是中医爱好者，请把[{slot}]替换成您实际遇到的术语；"
                 "如果是填写健康问卷时复制过来的，把对应字段补全即可，我可以接着给您解释。",
    },
    {
        "scenario": "占位符在句中",
        "question": "请帮我看一下「[{slot}]」这个卦",
        "good": "「[{slot}]」看起来不是真实的卦名（卦象通常用「乾为天」「坎为水」「水火既济」这类六字名称，"
                 "或者直接用卦象符号 ☰☱☲ 等）。\n\n"
                 "如果您想让我解卦，请告诉我：\n"
                 "  · 完整的卦名（如「雷地豫」「山水蒙」）；\n"
                 "  · 或三个爻的阴阳组合（如「阴阴阴」）；\n"
                 "  · 或您是摇卦/起卦得到的具体卦象。\n\n"
                 "拿到真实卦象后，我会从卦辞、爻辞、变卦、之卦等角度给您完整分析。",
    },

    # === C. 占位符在标题位 ===
    {
        "scenario": "占位符在标题位",
        "question": "## [{slot}]\n\n请基于以上章节内容帮我总结要点",
        "good": "您发的「## [{slot}]」下面的章节内容是空的，所以没有可以总结的要点。\n\n"
                 "请把[{slot}]替换成实际的章节标题，并在下面补充具体内容，"
                 "我就能帮您提炼出关键结论、要点清单和潜在风险。\n\n"
                 "如果您是想让我帮忙拟章节大纲、或者先建立模板，"
                 "也可以直接告诉我主题（比如「命理基础」「中医体质辨识」「健康风险预测」），"
                 "我可以给您出一份完整的章节框架。",
    },
    {
        "scenario": "占位符在标题位",
        "question": "文章标题：[{slot}]\n\n请帮我润色一下",
        "good": "「[{slot}]」是占位符，不是真正的标题，所以没有可以润色的对象。\n\n"
                 "请把[{slot}]替换成您起草的标题（哪怕只是关键词或临时草稿），"
                 "我就可以帮您做：\n"
                 "  · 字数控制；\n"
                 "  · 节奏与对仗；\n"
                 "  · 关键词前置；\n"
                 "  · 受众适配（科普/专业/营销）。\n\n"
                 "或者您直接告诉我文章的主题与目标读者，我帮您从零拟标题。",
    },

    # === D. 嵌套占位符 ===
    {
        "scenario": "嵌套占位符",
        "question": "请把「[[{slot}]]」这段配置改写成 YAML 格式",
        "good": "「[[{slot}]]」是嵌套的占位符，里面其实没有任何配置内容，所以没法做格式转换。\n\n"
                 "请把 [[{slot}]] 替换成实际的配置内容（哪怕是 JSON / 键值对 / 自然语言描述都行），"
                 "我就可以帮您转成合规的 YAML，保留所有字段含义。\n\n"
                 "如果这是一份模板，让我帮您把模板本身转成 YAML 框架，请告诉我：\n"
                 "  · 这个配置用在什么系统里；\n"
                 "  · 有哪些必填字段；\n"
                 "  · 是否需要示例值。",
    },
    {
        "scenario": "嵌套占位符",
        "question": "请告诉我「[[变量]]」这个变量在我的八字里代表什么",
        "good": "「[[变量]]」是占位符写法，里面没有具体内容，没办法对应到您八字里的某个十神、用神或神煞。\n\n"
                 "八字分析里说的「变量」通常指：年干/月干/日干/时干、藏干、十神（比肩、劫财、食神、伤官、正官、七杀…）"
                 "等具体可推算的元素。\n\n"
                 "请把 [[变量]] 替换成您实际想看的具体位置（比如「日支」「时柱天干」「月令藏干」），"
                 "或者直接告诉我您的出生年月日时，我帮您排出八字后再具体分析。",
    },

    # === E. 占位符伪装成引用 ===
    {
        "scenario": "占位符伪装成引用",
        "question": "文献里提到「[{slot}]」这个方法，具体是怎么做的？",
        "good": "「[{slot}]」是占位符，不是文献里的具体方法名，所以我没办法基于真实出处去解释步骤。\n\n"
                 "为了帮您还原方法细节，方便的话请告诉我：\n"
                 "  · 文献标题或作者；\n"
                 "  · 章节/页码（哪怕大致位置）；\n"
                 "  · 或者把[{slot}]替换成您记得的方法关键词。\n\n"
                 "拿到真实文献信息后，我会按『原理 → 步骤 → 适用场景 → 注意事项 → 常见误区』的结构给您梳理。",
    },
    {
        "scenario": "占位符伪装成引用",
        "question": "古书里有一句话叫「[{slot}]」，请问怎么理解？",
        "good": "「[{slot}]」是占位符，不是真实存在的古文原句。\n\n"
                 "古籍里的原句通常是可查可考的固定表述（哪怕有不同版本）。如果这个占位符背后"
                 "是您记不全的某句话，可以告诉我：\n"
                 "  · 大致出处（《周易》《黄帝内经》《滴天髓》《子平真诠》…）；\n"
                 "  · 您记得的几个关键词；\n"
                 "  · 上下文场景。\n\n"
                 "我能帮您反查到原句并逐字疏解。",
    },

    # === F. 中英文混合占位符 ===
    {
        "scenario": "英文占位符",
        "question": "What is [{slot_english}] in bazi analysis?",
        "good": "「[{slot_english}]」looks like a placeholder rather than a real term in bazi (Four Pillars) analysis.\n\n"
                 "If you intended a specific concept, please replace the placeholder with the actual term "
                 "(e.g. 用神 / Ten Gods / 十二长生 / 纳音 / 神煞 etc.).\n\n"
                 "Once you give me the concrete term, I can walk you through its meaning, how it's derived, "
                 "and how it's applied in chart interpretation.",
    },
    {
        "scenario": "英文占位符",
        "question": "Please explain how to use [{slot_english}] in this Python script",
        "good": "「[{slot_english}]」is a placeholder, not an actual function/class/variable name in the script, "
                 "so I can't show you how to use it directly.\n\n"
                 "Please either:\n"
                 "  · Replace [{slot_english}] with the real symbol you want explained;\n"
                 "  · Or paste the relevant code snippet so I can read the actual definition.\n\n"
                 "With the real symbol or code, I can walk through its signature, parameters, return value, "
                 "and typical usage patterns.",
    },

    # === G. 多占位符 ===
    {
        "scenario": "多占位符",
        "question": "请帮我分析「[{slot_a}]」和「[{slot_b}]」这两个概念的异同",
        "good": "「[{slot_a}]」和「[{slot_b}]」都是占位符，并不是两个真实概念，所以没法做对比分析。\n\n"
                 "请把两个占位符都替换成您实际想对比的术语（哪怕只是草稿关键词），"
                 "我就能给您从定义、推导、适用场景、典型误区几个维度做横向对比。\n\n"
                 "如果您是想让我帮您搭建一份『概念对比模板』，告诉我主题（比如『中医证候 vs 西医病名』、"
                 "『命理十神 vs 卦象爻位』），我可以给您出一份可直接套用的对比框架。",
    },
    {
        "scenario": "多占位符",
        "question": "我出生在 [{slot_year}] 年 [{slot_month}] 月，请帮我排八字",
        "good": "您给的 [{slot_year}] 和 [{slot_month}] 都是占位符，不是真实的出生年份和月份，"
                 "所以没办法排出八字。\n\n"
                 "排八字需要至少四项真实信息：\n"
                 "  · 出生年（公历或农历皆可，但要标注）；\n"
                 "  · 出生月；\n"
                 "  · 出生日；\n"
                 "  · 出生时（最好精确到时辰，2 小时为一个时辰）。\n\n"
                 "请把占位符替换成具体数字，或者直接告诉我完整的公历出生年月日时，我帮您排出八字，"
                 "并解读五行强弱、用神喜忌、大运流年等关键信息。",
    },

    # === H. 占位符配指令词 ===
    {
        "scenario": "占位符配指令词",
        "question": "请总结[{slot}]这段文字",
        "good": "「[{slot}]」后面没有具体文字内容，没办法总结。请把[{slot}]替换成您想总结的段落，"
                 "或者直接把原文贴出来，我帮您做要点提炼、关键词提取、中心思想归纳。\n\n"
                 "如果是文档太长不方便贴，也可以告诉我文章主题和章节结构，我先帮您梳理总结框架。",
    },
    {
        "scenario": "占位符配指令词",
        "question": "请把[{slot}]翻译成英文",
        "good": "「[{slot}]」是占位符，没有可翻译的具体内容。请把它替换成您想翻译的词、句或段落，"
                 "我再帮您处理。\n\n"
                 "如果是术语，请告诉我它所在的领域（命理/中医/通用），不同领域我会采用不同的译法"
                 "（如「用神」一般用 yong-shen / useful god / favorable element 三种译法，视受众而定）。",
    },
]

# 候选占位符（slot 池子）—— 只包含明显的"占位符/标签/字段"特征词，
# 排除真实术语（用神/喜忌/卦象/十神/穴位 等），避免模型矫枉过正把真术语误判为占位符
SLOT_POOL_CN = [
    "EPB设备", "用户姓名", "用户手机", "出生城市",
    "章节标题", "文章正文", "原始数据", "配置项", "字段名",
    "自定义标签", "待填字段", "文档编号", "订单号",
    "占位文本", "示例词", "示例值", "样例名称",
    "产品名", "项目代号", "临时变量", "测试字段",
    "问卷内容", "表单字段", "返回数据", "接口响应",
]

SLOT_POOL_EN = [
    "user_input", "input_field", "variable_name", "function_name",
    "config_key", "default_value", "placeholder_text", "expected_output",
    "test_field", "sample_data", "form_value",
]


def expand_template(tmpl, count):
    """对一个模板生成 count 条变体（替换 slot）"""
    import re
    out = []
    # 从 question 里找出所有 {slot...} 占位 key
    slot_keys = re.findall(r"\{(slot\w*)\}", tmpl["question"])

    def pick_value(k, used):
        if "english" in k:
            return random.choice(SLOT_POOL_EN)
        if k.endswith("_year"):
            return "YYYY"
        if k.endswith("_month"):
            return "MM"
        if k.endswith("_day"):
            return "DD"
        if k.endswith("_hour"):
            return "HH"
        if k.endswith("_a"):
            return random.choice(SLOT_POOL_CN)
        if k.endswith("_b"):
            avail = [s for s in SLOT_POOL_CN if s not in used]
            return random.choice(avail) if avail else "另一概念"
        return random.choice(SLOT_POOL_CN)

    for i in range(count):
        q = tmpl["question"]
        a = tmpl["good"]
        used = set()
        for k in set(slot_keys):
            slot_val = pick_value(k, used)
            used.add(slot_val)
            q = q.replace("{" + k + "}", slot_val)
            a = a.replace("{" + k + "}", slot_val)
        # sanity check：移除模板中残留的 {xxx}
        q = re.sub(r"\{\w+\}", "占位符", q)
        a = re.sub(r"\{\w+\}", "占位符", a)
        out.append({
            "scenario": tmpl["scenario"],
            "prompt": q.strip(),
            "completion": a.strip(),
        })
    return out


def has_forbidden(text):
    for p in FORBIDDEN_PATTERNS:
        if p in text:
            return True, p
    return False, None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--count", type=int, default=8,
                    help="每个模板生成多少变体（默认 8）")
    ap.add_argument("--out", default="training/mlx-r105-data/train.tagleak.jsonl",
                    help="输出 jsonl 路径")
    ap.add_argument("--clean3", default="training/mlx-r105-data/train.clean3.jsonl",
                    help="clean3 训练数据路径（用于合并）")
    ap.add_argument("--v82-out", default="training/mlx-r105-data/train.v82.jsonl",
                    help="合并后的 v8.2 训练数据路径")
    args = ap.parse_args()

    print(f"📌 v8.2 P0 — internal-tag 泄漏根治 · 反向 SFT 数据生成")
    print(f"   模板数: {len(TEMPLATES)}")
    print(f"   每个模板变体数: {args.count}")
    print(f"   预计生成: {len(TEMPLATES) * args.count} 条")
    print()

    # 1) 生成
    rows = []
    for tmpl in TEMPLATES:
        expanded = expand_template(tmpl, args.count)
        rows.extend(expanded)

    print(f"✅ 已生成 {len(rows)} 条反向 SFT 数据")

    # 2) 自检：每条都必须不包含 forbidden patterns
    bad = []
    for r in rows:
        a = r["completion"]
        hit, p = has_forbidden(a)
        if hit:
            bad.append((r, p))
    if bad:
        print(f"❌ 自检失败: {len(bad)} 条反向 SFT 数据包含 forbidden pattern")
        for r, p in bad[:3]:
            print(f"   命中 [{p}]: {r['completion'][:80]}")
        sys.exit(1)
    print(f"✅ 自检通过: 0 条含 forbidden pattern")

    # 3) 自检：每条 prompt 都必须包含 [xxx] 占位符（确保是占位符场景）
    no_bracket = [r for r in rows if "[" not in r["prompt"] or "]" not in r["prompt"]]
    if no_bracket:
        print(f"❌ 自检失败: {len(no_bracket)} 条 prompt 不含方括号占位符")
        sys.exit(1)
    print(f"✅ 自检通过: 所有 prompt 都含 [...] 占位符")

    # 4) 写反向 SFT 文件
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps({"prompt": r["prompt"], "completion": r["completion"]},
                               ensure_ascii=False) + "\n")
    print(f"✅ 写出反向 SFT 数据: {out_path} ({len(rows)} 条)")

    # 5) 合并 clean3 + tagleak → v8.2 训练集
    clean3_path = Path(args.clean3)
    if not clean3_path.exists():
        print(f"⚠️ clean3 不存在 ({clean3_path})，跳过合并")
        return

    clean3_count = 0
    with open(args.v82_out, "w", encoding="utf-8") as fout:
        # 先 clean3
        with open(clean3_path, "r", encoding="utf-8") as f:
            for line in f:
                fout.write(line)
                clean3_count += 1
        # 再 tagleak
        for r in rows:
            fout.write(json.dumps({"prompt": r["prompt"], "completion": r["completion"]},
                                  ensure_ascii=False) + "\n")
    print(f"✅ 合并训练集: {args.v82_out}")
    print(f"   - clean3: {clean3_count} 条")
    print(f"   - tagleak: {len(rows)} 条")
    print(f"   - 合计: {clean3_count + len(rows)} 条")

    # 6) 场景分布统计
    from collections import Counter
    sc_counter = Counter(r["scenario"] for r in rows)
    print(f"\n📊 场景分布:")
    for sc, n in sc_counter.most_common():
        print(f"   · {sc}: {n} 条")

    print(f"\n🎯 下一步:")
    print(f"   1. 准备 valid.v82.jsonl（合并 valid.clean3 + 少量反向 SFT 验证）")
    print(f"   2. mlx_lm.lora 训练（基于 mingli-sft-v8.1）")
    print(f"   3. fuse 出 v8.2 fused 模型")
    print(f"   4. 重启 8960 + 30 题复评")


if __name__ == "__main__":
    main()