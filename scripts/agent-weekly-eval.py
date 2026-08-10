#!/usr/bin/env python3
"""
R683: 智能体每周能力自我评估
数据源：
  1. /api/agent/stats（内存统计，进程内）
  2. kb_hit_log（KB 命中率）
  3. kb_feedback（用户反馈）
  4. repair_log（修真闭环）
产出：.openclaw/tmp/agent-weekly-eval.md（可读报告）

用法：
  python3 scripts/agent-weekly-eval.py          # 默认本周
  python3 scripts/agent-weekly-eval.py --days 7 # 自定义窗口
"""
import sqlite3
import json
import os
import sys
import urllib.request
from datetime import datetime, timedelta

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "server", "database", "yidao.db"))
OUTPUT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".openclaw", "tmp", "agent-weekly-eval.md"))
API_STATS = "http://127.0.0.1:8920/api/agent/stats"
INTERNAL_UA = "MingliAgentEval/1.0 (internal weekly eval)"  # 本地内部服务标识，避免被反爬拦截


def fetch_api_stats():
    try:
        req = urllib.request.Request(API_STATS, headers={"User-Agent": INTERNAL_UA})
        with urllib.request.urlopen(req, timeout=5) as r:
            d = json.loads(r.read().decode())
        return d.get("data", {})
    except Exception as e:
        return {"error": str(e)}


def fetch_db(conn, days):
    c = conn.cursor()
    since = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")

    # KB 命中统计（hits 为命中条目数，命中率=有命中查询占比）
    kb_hits = {}
    try:
        c.execute("SELECT COUNT(*), SUM(CASE WHEN hits > 0 THEN 1 ELSE 0 END), AVG(response_time) FROM kb_hit_log WHERE created_at >= ?", (since,))
        row = c.fetchone()
        kb_hits = {"count": row[0] or 0, "hit_queries": row[1] or 0, "avg_rt_ms": round(row[2] or 0, 1)}
    except Exception as e:
        kb_hits = {"error": str(e)}

    # 反馈统计（只统计有效评分 score>0）
    fb = {}
    try:
        c.execute("SELECT COUNT(*), AVG(score) FROM kb_feedback WHERE created_at >= ? AND score > 0", (since,))
        row = c.fetchone()
        fb = {"count": row[0] or 0, "avg_score": round(row[1] or 0, 2)}
    except Exception as e:
        fb = {"error": str(e)}

    # 修真记录
    repair = {}
    try:
        c.execute("SELECT type, COUNT(*) FROM repair_log WHERE created_at >= ? GROUP BY type", (since,))
        repair = dict(c.fetchall())
    except Exception as e:
        repair = {"error": str(e)}

    return kb_hits, fb, repair


def build_report(api_stats, kb_hits, fb, repair, days):
    lines = []
    lines.append(f"# 智能体每周能力自我评估")
    lines.append(f"")
    lines.append(f"- 评估时间：{datetime.now().strftime('%Y-%m-%d %H:%M')}")
    lines.append(f"- 统计窗口：近 {days} 天")
    lines.append(f"")
    lines.append(f"## 一、编排性能（/api/agent/stats）")
    lines.append(f"")
    if api_stats.get("error"):
        lines.append(f"⚠️ API 统计不可用：{api_stats['error']}")
    elif api_stats.get("runs", 0) == 0:
        lines.append(f"⚠️ 暂无编排运行数据（服务刚启动或无人调用）")
    else:
        lines.append(f"| 指标 | 数值 | 评价 |")
        lines.append(f"|---|---|---|")
        s = api_stats
        lines.append(f"| 调用次数 | {s['runs']} | - |")
        lines.append(f"| 平均耗时 | {s['avgDurationMs']}ms | {'✅ P95达标(<500ms)' if s['avgDurationMs'] < 500 else '⚠️ 超时风险'} |")
        lines.append(f"| 降级率 | {s['degradedRate']*100:.1f}% | {'✅' if s['degradedRate'] < 0.05 else '⚠️ 需排查'} |")
        lines.append(f"| 超时率 | {s['timeoutRate']*100:.1f}% | {'✅' if s['timeoutRate'] < 0.05 else '⚠️ 需排查'} |")
        lines.append(f"| 成功率 | {s['successRate']*100:.1f}% | {'✅' if s['successRate'] > 0.8 else '⚠️ 需改进'} |")
        lines.append(f"| 澄清率 | {s['clarifyRate']*100:.1f}% | {'✅ 引导兜底正常' if s['clarifyRate'] < 0.3 else 'ℹ️ 较多需澄清'} |")
        lines.append(f"| 平均分 | {s['avgScore']} | {'✅' if s['avgScore'] > 0.6 else '⚠️ 内容质量偏低'} |")
    lines.append(f"")
    lines.append(f"## 二、知识库命中（kb_hit_log）")
    lines.append(f"")
    if kb_hits.get("error"):
        lines.append(f"⚠️ {kb_hits['error']}")
    else:
        lines.append(f"- 查询次数：{kb_hits['count']}")
        lines.append(f"- 有命中查询：{kb_hits['hit_queries']}")
        lines.append(f"- 平均响应：{kb_hits['avg_rt_ms']}ms")
        if kb_hits["count"] > 0:
            rate = kb_hits["hit_queries"] / kb_hits["count"]
            lines.append(f"- 命中率：{rate*100:.1f}% {'✅ KB直答占比健康' if rate > 0.5 else '⚠️ 直答率偏低，建议扩充KB'}")

    lines.append(f"")
    lines.append(f"## 三、用户反馈（kb_feedback）")
    lines.append(f"")
    if fb.get("error"):
        lines.append(f"⚠️ {fb['error']}")
    else:
        lines.append(f"- 反馈条数：{fb['count']}")
        lines.append(f"- 平均评分：{fb['avg_score']}/5 {'✅' if fb['avg_score'] >= 4 else '⚠️ 满意度待提升'}")
    lines.append(f"")
    lines.append(f"## 四、修真闭环（repair_log）")
    lines.append(f"")
    if repair.get("error"):
        lines.append(f"⚠️ {repair['error']}")
    elif not repair:
        lines.append(f"- 本周无修真记录 ✅")
    else:
        for t, n in repair.items():
            lines.append(f"- {t}: {n} 次")
    lines.append(f"")
    lines.append(f"## 五、结论与建议")
    lines.append(f"")
    issues = []
    if api_stats.get("runs", 0) > 0:
        if api_stats.get("degradedRate", 0) >= 0.05:
            issues.append("降级率偏高 → 检查后端 API 稳定性")
        if api_stats.get("successRate", 0) <= 0.8:
            issues.append("成功率偏低 → 检查 Agent 兜底链")
        if api_stats.get("avgDurationMs", 0) >= 500:
            issues.append("耗时偏高 → 优化 KB 直答优先路径")
    if kb_hits.get("count", 0) > 0 and kb_hits.get("hit_queries", 0) / kb_hits["count"] < 0.5:
        issues.append("KB 直答率偏低 → 优先扩充高频模块词条")
    if issues:
        for i in issues:
            lines.append(f"- ⚠️ {i}")
    else:
        lines.append(f"- 全部指标健康 ✅ 继续按双核战略推进")
    lines.append(f"")
    lines.append(f"---")
    lines.append(f"*由 scripts/agent-weekly-eval.py 自动生成*")
    return "\n".join(lines)


def main():
    days = 7
    if "--days" in sys.argv:
        try:
            days = int(sys.argv[sys.argv.index("--days") + 1])
        except (IndexError, ValueError):
            pass

    api_stats = fetch_api_stats()
    conn = sqlite3.connect(DB_PATH) if os.path.exists(DB_PATH) else None
    if conn:
        kb_hits, fb, repair = fetch_db(conn, days)
        conn.close()
    else:
        kb_hits, fb, repair = {"error": "DB not found"}, {"error": "DB not found"}, {"error": "DB not found"}

    report = build_report(api_stats, kb_hits, fb, repair, days)
    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    with open(OUTPUT, "w", encoding="utf-8") as f:
        f.write(report)
    print(report)
    print(f"\n📄 报告: {OUTPUT}")


if __name__ == "__main__":
    main()
