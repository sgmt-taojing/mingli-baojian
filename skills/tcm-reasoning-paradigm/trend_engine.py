#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""长期预测引擎 v0.1（P2-7）：活体报告时序 → 趋势研判 → 预测性提示。

设计依据（四项目知识同步体系设计 §3C）：实时诊断 → 核定定稿 → 活体报告 → 长期预测。
同一引擎四方共用：家庭端按 member_id，命理/中医按受测者 subject_id。

规则引擎（不用 ML，v0.1 全部可审计）：
  信号：每份活体报告的命中条目（id/模块/分）
  持续信号：同一条目在最近 window 内出现 ≥persist_min 次 → 体质/格局的持续特征
  变化信号：首尾窗口对比，新出现 / 消失 / 分值升降
  预测性提示：只基于条目原文 indications 的外推 + 谨慎话术，不发明诊断；
             出现诊疗类持续信号 → 提示转介（L1 科普级，超边界转专业）

输出：结构化趋势报告（markdown + json），含数据充分性判断。
"""
import datetime
import glob
import json
import os

MIN_REPORTS = 3          # 数据充分性下限
PERSIST_MIN = 3          # 持续信号最少出现次数
WINDOW_DAYS = 30         # 默认观察窗
DISCLAIMER = "【标注】趋势研判仅基于历史交互记录与古籍条目外推，供健康/命理参考，不构成诊断或断定；持续不适请就医，重大事项请线下咨询专业人士。"


def load_series(root, member, days=WINDOW_DAYS):
    """读取成员活体报告时序（按 ts 升序）。"""
    d = os.path.join(root, member)
    files = sorted(glob.glob(os.path.join(d, "*.json")))
    cutoff = (datetime.datetime.now() - datetime.timedelta(days=days)).strftime("%Y-%m-%dT%H%M%S")
    series = []
    for f in files:
        try:
            rec = json.load(open(f, encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        if rec.get("ts", "") >= cutoff:
            series.append(rec)
    return series


def extract_signals(series):
    """每份报告 → {ts, signals: {entry_id: {title, module, score}}}"""
    out = []
    for rec in series:
        sig = {}
        for e in rec.get("entries") or []:
            sig[e["id"]] = {"title": e.get("title", ""), "module": e.get("module", ""),
                            "score": e.get("score_norm", 0)}
        out.append({"ts": rec.get("ts", ""), "signals": sig,
                    "no_record": rec.get("no_record", False)})
    return out


def detect_trends(signals):
    """持续 / 新增 / 消退 / 加强 / 减弱 五类趋势。"""
    if not signals:
        return {}
    count = {}
    first_half = signals[: max(1, len(signals) // 2)]
    second_half = signals[max(1, len(signals) // 2):]
    for s in signals:
        for eid in s["signals"]:
            count[eid] = count.get(eid, 0) + 1
    trends = {"persistent": [], "emerging": [], "fading": [], "strengthening": [], "weakening": []}
    meta = {}
    for eid, n in count.items():
        first = next((s["signals"][eid] for s in signals if eid in s["signals"]), {})
        meta[eid] = first
        in_1st = sum(1 for s in first_half if eid in s["signals"])
        in_2nd = sum(1 for s in second_half if eid in s["signals"])
        if n >= PERSIST_MIN:
            trends["persistent"].append(eid)
        if in_1st == 0 and in_2nd > 0:
            trends["emerging"].append(eid)
        if in_1st > 0 and in_2nd == 0:
            trends["fading"].append(eid)
        sc1 = [s["signals"][eid]["score"] for s in first_half if eid in s["signals"]]
        sc2 = [s["signals"][eid]["score"] for s in second_half if eid in s["signals"]]
        if sc1 and sc2:
            a1, a2 = sum(sc1) / len(sc1), sum(sc2) / len(sc2)
            if a2 - a1 >= 0.15:
                trends["strengthening"].append(eid)
            elif a1 - a2 >= 0.15:
                trends["weakening"].append(eid)
    return {"trends": trends, "meta": meta, "count": count}


def render_report(member, series, days=WINDOW_DAYS):
    signals = extract_signals(series)
    if len(series) < MIN_REPORTS:
        return {
            "ok": True, "member": member, "sufficient": False,
            "reports": len(series),
            "message": "数据积累中（%d/%d 份报告），达到 %d 份后开启趋势研判" % (len(series), MIN_REPORTS, MIN_REPORTS),
        }
    det = detect_trends(signals)
    trends, meta, count = det["trends"], det["meta"], det["count"]

    def line(eid):
        m = meta.get(eid, {})
        return "%s（%s，累计 %d 次）" % (m.get("title", eid), m.get("module", ""), count[eid])

    md = ["# 活体趋势研判报告", "",
          "成员：%s ｜ 观察窗：近 %d 天 ｜ 报告数：%d（%s → %s）" % (
              member, days, len(series), series[0].get("ts", "")[:10], series[-1].get("ts", "")[:10]), ""]
    if trends["persistent"]:
        md += ["## 持续信号（体质/格局的稳定特征）",
               *[("· " + line(e)) for e in trends["persistent"]], ""]
    if trends["emerging"]:
        md += ["## 新出现（近期交互中新增，值得留意）",
               *[("· " + line(e)) for e in trends["emerging"]], ""]
    if trends["fading"]:
        md += ["## 已消退（近期未再出现）",
               *[("· " + line(e)) for e in trends["fading"]], ""]
    if trends["strengthening"]:
        md += ["## 信号加强", *[("· " + line(e)) for e in trends["strengthening"]], ""]
    if trends["weakening"]:
        md += ["## 信号减弱", *[("· " + line(e)) for e in trends["weakening"]], ""]

    # 预测性提示：持续诊疗类信号 → 谨慎外推 + 转介
    hints = []
    for eid in trends["persistent"] + trends["strengthening"]:
        m = meta.get(eid, {})
        if m.get("module", "").startswith(("tcm", "av-")):
            hints.append("· %s 信号持续/加强：按条目所示方向注意调理；若伴明显不适，建议线下就医核实。" % m.get("title", eid))
        elif m.get("module", "").startswith(("ml-", "fh-")):
            hints.append("· %s 格局信号持续：可作近期行事参考，具体择断请结合完整命理服务。" % m.get("title", eid))
    if not any(trends.values()):
        hints.append("· 观察窗内信号平稳，未见持续或显著变化趋势。")
    md += ["## 趋势提示", *hints, "", DISCLAIMER]
    return {
        "ok": True, "member": member, "sufficient": True,
        "reports": len(series), "window_days": days,
        "trends": {k: [meta.get(e, {}).get("title", e) for e in v] for k, v in trends.items()},
        "report_markdown": "\n".join(md),
    }
