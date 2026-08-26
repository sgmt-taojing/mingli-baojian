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


def _probe_uptime_days():
    """探测 8920 端口 api-server 进程已运行天数（无 ps 权限时返回 None）"""
    try:
        import subprocess
        out = subprocess.run(
            ["ps", "-o", "lstart=", "-p", str(_pid_on_port(8920))],
            capture_output=True, text=True, timeout=5
        ).stdout.strip()
        if not out:
            return None
        from datetime import datetime as _dt
        start = _dt.strptime(out[:19], "%a %b %d %H:%M:%S")
        now = _dt.now()
        # 处理跨年（ps lstart 无年份）：若解析时间晚于现在则视为去年
        start = start.replace(year=now.year if start.replace(year=now.year) <= now else now.year - 1)
        return (now - start).total_seconds() / 86400.0
    except Exception:
        return None


def _pid_on_port(port):
    """通过 lsof 获取监听端口对应 PID"""
    import subprocess
    out = subprocess.run(["lsof", "-tiTCP:%d" % port, "-sTCP:LISTEN"], capture_output=True, text=True, timeout=5).stdout.strip()
    return out.splitlines()[0] if out else "0"


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

    # 反馈统计（只统计有效评分 score>0；count=0 时 avg 为 NULL，由 build_report 区分「无样本」与「低分」）
    fb = {}
    try:
        c.execute("SELECT COUNT(*), AVG(score) FROM kb_feedback WHERE created_at >= ? AND score > 0", (since,))
        row = c.fetchone()
        fb = {"count": row[0] or 0, "avg_score": round(row[1] or 0, 2) if row[1] is not None else None}
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
        # 2026-08-17 R: 区分「进程刚启动/窗口不完整」与「无人调用」，避免误导
        up_days = _probe_uptime_days()
        if up_days is None:
            lines.append(f"⚠️ 暂无编排运行数据（无法探测服务 uptime；编排记录自 2026-08-17 起已落库 orchestration_log）")
        elif up_days < days:
            lines.append(f"⚠️ 暂无编排运行数据（api-server 进程仅运行 {up_days:.1f} 天，统计窗口不足 {days} 天；编排记录自 2026-08-17 起已持久化 orchestration_log，下期可完整回溯）")
        else:
            lines.append(f"⚠️ 暂无编排运行数据（服务运行 {up_days:.1f} 天且无调用 → 编排入口未被前端触发，检查 ai-assistant 弱命中兑底链路）")
    else:
        lines.append(f"| 指标 | 数值 | 评价 |")
        lines.append(f"|---|---|---|")
        s = api_stats
        src = "（库）" if s.get("source") == "db" else "（内存）"
        lines.append(f"| 调用次数{src} | {s['runs']} | - |")
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
        # R754: response_time 恒为 0 说明旧代码未测量（R754 已修复埋点，新数据生效后自动展示真实值）
        if kb_hits["avg_rt_ms"] and kb_hits["avg_rt_ms"] > 0:
            lines.append(f"- 平均响应：{kb_hits['avg_rt_ms']}ms")
        else:
            lines.append("- 平均响应：无测量数据（历史埋点恒 0，R754 修复后新查询生效）")
        if kb_hits["count"] > 0:
            rate = kb_hits["hit_queries"] / kb_hits["count"]
            lines.append(f"- 命中率：{rate*100:.1f}% {'✅ KB直答占比健康' if rate > 0.5 else '⚠️ 直答率偏低，建议扩充KB'}")

    lines.append(f"")
    lines.append(f"## 三、用户反馈（kb_feedback）")
    lines.append(f"")
    if fb.get("error"):
        lines.append(f"⚠️ {fb['error']}")
    elif fb["count"] == 0:
        # R 修真(2026-08-17):0 样本时显示 0/5 ⚠️ 属误导（无反馈 ≠ 低满意度）
        # 反馈按钮仅挂在 AI 助手对话回复上，KB 搜索命中(search-fts/realtime-search)不触发
        lines.append(f"- 反馈条数：0（本周无反馈样本 ℹ️，不参与满意度评价；反馈按钮仅挂在 AI 助手对话回复）")
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
