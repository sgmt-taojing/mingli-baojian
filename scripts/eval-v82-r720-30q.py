#!/usr/bin/env python3
"""
v8.2 R720 修真后 30 题复评 — 验证 idx=27 tag_leak 修真 + 综合分提升
路径：scripts/eval-v82-r720-30q.py v8.2-postR720

修真对比目标：
  v8 baseline 58.3 → v8.1 68.7（+10.4）→ v8.2 目标 75+
  修真关键指标：tag_leak 从 1/30 → 0/30（idx=27 残留修真）
"""
import json
import sys
import os
import re
import time
import urllib.request
import urllib.error
from urllib.parse import urlencode

BASE = os.environ.get("EVAL_BASE", "http://127.0.0.1:8920")
LABEL = sys.argv[1] if len(sys.argv) > 1 else "v8.2-postR720"
LOG = os.environ.get("EVAL_LOG", f"/Users/tom/kimi/projects/mingli-baojian/.openclaw/tmp/eval-v82.log")

# 修真 30 题（含原 v8.1 30 题 + idx=27 类专项 tag_leak 反向 4 题）
# idx=27 类问题特征：含占位符（[xxx]、[命主]、[八字]）、字段名（gender_year_month_day_hour）、
# 内部标签（[EPB]、[KB]、[2026]）的输入
QUESTIONS = [
    # === 命理 12 题（原 v8.1 题目，监督稳定性）===
    ("命理", "什么是八字中的用神？"),
    ("命理", "七杀星是什么意思？"),
    ("命理", "天德贵人是什么？"),
    ("命理", "文昌星的作用？"),
    ("命理", "什么是三合局？"),
    ("命理", "偏财和正财有什么区别？"),
    ("命理", "伤官见官是什么意思？"),
    ("命理", "食神生财是什么格局？"),
    ("命理", "羊刃是什么？有什么影响？"),
    ("命理", "如何判断日主旺衰？"),
    ("命理", "什么是伤官配印？"),
    ("命理", "正官与偏官（七杀）的本质差异？"),
    # === 中医 10 题 ===
    ("中医", "什么是阴虚？如何辨证？"),
    ("中医", "舌苔白腻主何证？"),
    ("中医", "麻黄汤的组成与主治？"),
    ("中医", "什么是肝郁气滞？"),
    ("中医", "六味地黄丸适用于何种体质？"),
    ("中医", "脉象细数主何病机？"),
    ("中医", "什么是痰湿？化痰常用方？"),
    ("中医", "心肾不交的典型表现？"),
    ("中医", "什么是气阴两虚？"),
    ("中医", "桂枝汤的方义与适用症？"),
    # === 边界 8 题（含 idx=27 类专项修真）===
    ("边界", "[2026] 年 [命主] 的运势如何？"),  # idx=27 类反向
    ("边界", "gender_year_month_day_hour 字段代表什么？"),  # idx=27 类反向
    ("边界", "[EPB设备] 采集的面部信息如何用于命理分析？"),  # idx=27 类
    ("边界", "命主八字如下：[四柱] [大运] [流年]，请解盘。"),  # idx=27 类
    ("边界", "今日 [宜] [忌] 哪些事？"),  # idx=27 类
    ("边界", "[八字] 中如果缺 [用神]，该怎么补？"),  # idx=27 类
    ("边界", "如何理解 [紫微] 中的 [化忌]？"),  # idx=27 类
    ("边界", "请问 [奇门遁甲] 中的 [值符] 代表什么？"),  # idx=27 类
]

# 修真检测器：识别回答中是否包含内部标签泄漏
INTERNAL_TAG_PATTERNS = [
    r"\[EPB[^\]]*\]",
    r"\[KB[^\]]*\]",
    r"\[2026\]",
    r"\[命主\]",
    r"\[八字\]",
    r"\[四柱\]",
    r"\[大运\]",
    r"\[流年\]",
    r"\[宜\]|\[忌\]",
    r"\[用神\]|\[化忌\]|\[紫微\]|\[奇门遁甲\]|\[值符\]",
    r"gender_year_month_day_hour",
    r"input_field|placeholder|field_name",
    r"mock_data|test_value",
]

CLICHÉ_PREFIXES = [
    "作为一", "我是一", "根据您的", "根据您提",
    "您提供的", "您提的", "您问的", "您这个问题",
]

# 占位符出现 = tag_leak；写作「请提供真实信息」 = pass
TAG_LEAK_OK = re.compile(r"(请提供|具体是|需要您|请说明|请补充|具体内容|实际内容|真实)")


def get_csrf():
    try:
        with urllib.request.urlopen(urllib.request.Request(f"{BASE}/api/csrf-token", headers={"User-Agent":"Mozilla/5.0"}), timeout=8) as r:
            data = json.loads(r.read())
            return data.get("csrfToken") or data.get("csrf") or data.get("token")
    except Exception as e:
        print(f"CSRF 获取失败: {e}")
        sys.exit(1)


def ask(csrf, q, timeout=110):
    payload = {
        "model": "local",
        "messages": [{"role": "user", "content": q}],
    }
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        f"{BASE}/api/ai/chat",
        data=body,
        headers={
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0",
            "X-CSRF-Token": csrf,
        },
        method="POST",
    )
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            data = json.loads(r.read())
            elapsed = time.time() - t0
            dd = data.get("data") or data
            content = (dd.get("content") or
                       (dd.get("choices") or [{}])[0].get("message", {}).get("content") or
                       data.get("content") or
                       data.get("message") or "")
            if not content:
                ch = (data.get("choices") or [{}])
                content = ch[0].get("message", {}).get("content", "") if ch else ""
            return content, elapsed, data
    except Exception as e:
        return f"[ERR {e}]", 0, {}


def score(answer, q):
    issues = {}
    score = 100

    # 1. tag_leak 检测
    tag_leaks = [p for p in INTERNAL_TAG_PATTERNS if re.search(p, answer)]
    if tag_leaks:
        if not TAG_LEAK_OK.search(answer):
            issues["internal_tag"] = tag_leaks
            score -= 40
        else:
            # 修真词存在但还有标签 → 减半
            issues["internal_tag_residual"] = tag_leaks
            score -= 20

    # 2. 套话检测
    for prefix in CLICHÉ_PREFIXES:
        if answer.startswith(prefix):
            issues["cliché"] = prefix
            score -= 25
            break

    # 3. 长度检查（太短扣分）
    if len(answer) < 30:
        issues["too_short"] = len(answer)
        score -= 30
    elif len(answer) > 600:
        issues["too_long"] = len(answer)
        score -= 10

    # 4. 重复检测（字符级 3-gram 重复）
    if len(answer) > 20:
        grams = [answer[i:i+10] for i in range(0, len(answer)-10)]
        if len(grams) > 0:
            from collections import Counter
            c = Counter(grams)
            top = c.most_common(1)[0]
            if top[1] > 3:
                issues["repeats"] = top[1]
                score -= 20

    # 5. 占位符/字段名问题——必须主动指出并索取真实信息（修真关键）
    has_placeholder = bool(re.search(r"\[[^\]]+\]", q)) or "gender_" in q
    if has_placeholder and "请提供" not in answer and "具体" not in answer:
        issues["placeholder_not_handled"] = True
        score -= 20

    return max(0, score), issues


def main():
    print("=" * 60)
    print(f"R720 v8.2 修真后 30 题复评")
    print("=" * 60)

    csrf = get_csrf()
    print(f"CSRF: {csrf[:12]}...")

    results = []
    cat_scores = {"命理": [], "中医": [], "边界": []}

    for i, (cat, q) in enumerate(QUESTIONS, 1):
        answer, elapsed, _ = ask(csrf, q)
        sc, issues = score(answer, q)
        flag = "✅" if sc >= 70 else "⚠️" if sc >= 50 else "❌"
        print(f'{flag} [{i:02d}] {cat} | {sc:3d}/100 | {elapsed:5.1f}s | {q[:30]}')
        if issues.get("internal_tag"):
            print(f'      ↳ 内部标签泄漏: {issues["internal_tag"][:3]}')
        if issues.get("cliché"):
            print(f'      ↳ 套话开头: {issues["cliché"]}')
        if issues.get("repeats", 0) > 0:
            print(f'      ↳ 重复×{issues["repeats"]}')
        if issues.get("placeholder_not_handled"):
            print(f'      ↳ 占位符未主动询问')
        print(f'      答: {answer[:80]}...')
        results.append({
            "idx": i, "cat": cat, "q": q, "a": answer,
            "score": sc, "elapsed": elapsed, "issues": issues,
        })
        cat_scores[cat].append(sc)

    # 汇总
    cat_avg = {k: round(sum(v)/len(v), 1) if v else 0 for k, v in cat_scores.items()}
    overall = round(sum(r["score"] for r in results) / len(results), 1)

    print()
    print("=" * 60)
    print(f"VERSION: {LABEL} AVG: {overall}")
    print(f"CAT: {cat_avg}")
    print(f"TIMESTAMP: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"SAMPLES: {len(results)}")

    tag_leak_n = sum(1 for r in results if r["issues"].get("internal_tag"))
    cliché_n = sum(1 for r in results if r["issues"].get("cliché"))
    placeholder_n = sum(1 for r in results if r["issues"].get("placeholder_not_handled"))
    print(f"修真指标: tag_leak={tag_leak_n}/30, 套话={cliché_n}/30, 占位符未处理={placeholder_n}/30")

    out = {
        "version": LABEL,
        "avg": overall,
        "cat_avg": cat_avg,
        "metrics": {
            "tag_leak_count": tag_leak_n,
            "cliché_count": cliché_n,
            "placeholder_unhandled_count": placeholder_n,
        },
        "verdict": "PASS" if overall >= 70 and tag_leak_n <= 1 else "NEEDS_REVIEW",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "samples": results,
    }
    out_path = os.environ.get(
        "EVAL_OUT",
        "/Users/tom/kimi/projects/mingli-baojian/training/eval-results-v82-r720-30q.json",
    )
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print(f"结果已写入: {out_path}")


if __name__ == "__main__":
    main()