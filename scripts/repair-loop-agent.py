#!/usr/bin/env python3
"""
R682: 修真闭环自动化
功能：
  1. repair_log 表初始化（修真记录自动入库）
  2. 修真记录登记（--add 模式：手工/脚本调用登记一次修真）
  3. 同类问题反向追溯（--trace 模式：全站扫描 8 类问题模式，与历史修真比对，
     输出「同类问题是否已清零 / 是否在别处复发」）
  4. 修真报告落盘（.openclaw/tmp/repair-trace-report.json）

用法：
  python3 scripts/repair-loop-agent.py --add --type xss --root "innerHTML拼接未转义" --files app/a.html --note "已替换为textContent"
  python3 scripts/repair-loop-agent.py --trace
  python3 scripts/repair-loop-agent.py --stats
"""
import sqlite3
import json
import os
import re
import sys
import argparse
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "server", "database", "yidao.db")
DB_PATH = os.path.abspath(DB_PATH)
OUTPUT = os.path.join(os.path.dirname(__file__), "..", ".openclaw", "tmp", "repair-trace-report.json")
OUTPUT = os.path.abspath(OUTPUT)

REPAIR_TYPES = [
    "xss",            # innerHTML 注入 / 未转义输出
    "alert",          # alert() 残留
    "console",        # console.log 残留
    "random",         # Math.random 滥用
    "div-balance",    # div 标签不平衡
    "a11y",           # aria-label / label / alt 缺失
    "ai-flavor",      # AI 味文案
    "cross-brand",    # 跨项目品牌词
    "crud-semantic",  # CRUD 语义（不存在返回错误）
    "timeout",        # 异步无超时
    "other",
]

# 8 类扫描模式（正则 + 说明 + 修复建议）
SCAN_PATTERNS = [
    {
        "type": "alert",
        "name": "alert() 残留",
        "regex": re.compile(r"alert\s*\("),
        "ext": [".html", ".js"],
        "fix": "替换为自定义模态框 / UI.toast()",
    },
    {
        "type": "console",
        "name": "console.log 残留",
        "regex": re.compile(r"console\.log\s*\("),
        "ext": [".html", ".js"],
        "fix": "移除或替换为错误上报",
    },
    {
        "type": "random",
        "name": "Math.random 滥用",
        "regex": re.compile(r"Math\.random\s*\("),
        "ext": [".html", ".js"],
        "fix": "业务逻辑禁止随机数，改用确定性算法",
    },
    {
        "type": "div-balance",
        "name": "div 标签不平衡",
        "regex": None,  # 自定义检查
        "ext": [".html"],
        "fix": "补齐 </div> 闭合标签",
    },
    {
        "type": "ai-flavor",
        "name": "AI 味文案",
        "regex": re.compile(r"AI驱动|智能分析|大模型|一站式|降本增效|AI智能|赋能"),
        "ext": [".html", ".js", ".md"],
        "fix": "替换为具体功能描述（去AI味词典）",
    },
    {
        "type": "cross-brand",
        "name": "跨项目品牌词",
        "regex": re.compile(r"共达地|EdgeBox|GDDI|低空平台|视频监控|算法超市|集成商"),
        "ext": [".html", ".js", ".md"],
        "fix": "功能性引用保留，品牌展示替换为中性表述",
    },
    {
        "type": "xss",
        "name": "innerHTML 直接拼接用户输入",
        "regex": re.compile(r"innerHTML\s*=\s*[`\"']?[^`\"']*\$\{"),
        "ext": [".html", ".js"],
        "fix": "先转义（escapeHtml）再拼接，或改用 textContent",
        # R693-R697 审计：以下文件中的 innerHTML 拼接均为受控数据（排盘计算/API 响应/已转义），
        # 非用户直接输入，审计通过后列入白名单不再报警
        "whitelist": [
            "app/kb-quality.html", "app/ziwei-chart.html", "app/fengshui-chart.html",
            "app/qimen-chart.html", "app/liuyao-chart.html", "app/liuren-chart.html",
            "app/kb-graph-r68.html", "app/monitor-dashboard.html", "app/patient-journey.html",
            "app/home-care.html", "app/js/divination-integrated-inline.js",
            "app/js/agent-ui.js", "app/js/master-elder-inline.js",
            "app/js/yijing-oracle-inline.js", "app/js/im-inline.js",
            "app/js/test-parse-natural-inline.js", "app/js/kb-search-engine.js",
            "app/js/divination-core.js", "app/js/yijing-qimen-inline.js",
            "app/collab-diagnosis.html",  # R695 已审计：_esc() 29处
            "app/voice-consult.html",      # R697 已审计：动态拼接均 escapeHtml，tags 静态词表
        ],
    },
]


def init_db(conn):
    """初始化 repair_log 表"""
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS repair_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            root TEXT NOT NULL,
            files TEXT,
            note TEXT,
            status TEXT DEFAULT 'fixed',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()


def add_repair(conn, rtype, root, files, note):
    """登记一次修真"""
    c = conn.cursor()
    c.execute(
        "INSERT INTO repair_log (type, root, files, note, status) VALUES (?, ?, ?, ?, 'fixed')",
        (rtype, root, files, note),
    )
    conn.commit()
    return c.lastrowid


def scan_dir(root_dir, patterns):
    """全站扫描问题模式，返回 {type: [files]}"""
    findings = {}
    for pat in patterns:
        findings[pat["type"]] = []

    for dirpath, dirnames, filenames in os.walk(root_dir):
        # 跳过不需要扫描的目录
        dirnames[:] = [d for d in dirnames if d not in (".git", "node_modules", ".openclaw", "DELIVERY", "docs", "tests", "training-data", "venv", "__pycache__")]
        for fn in filenames:
            ext = os.path.splitext(fn)[1].lower()
            fpath = os.path.join(dirpath, fn)
            try:
                with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
            except Exception:
                continue
            for pat in patterns:
                if pat["regex"] is None:
                    continue
                if ext not in pat["ext"]:
                    continue
                # R693: 白名单文件（已审计安全的受控数据拼接）跳过
                whitelist = pat.get("whitelist", [])
                rel_fpath = os.path.relpath(fpath, root_dir) if root_dir else fpath
                norm_fpath = fpath.replace(os.sep, "/")
                if whitelist and (rel_fpath in whitelist or norm_fpath in whitelist or os.path.basename(fpath) in whitelist):
                    continue
                # R736: console.log 排除调试守卫（if(window.__debug__) console.log / if(MiniCLawDebug) console.log）
                if pat["type"] == "console":
                    # 去掉 if(...) console.log(...) 守卫的再匹配
                    stripped = re.sub(r"if\s*\([^)]+\)\s*console\.log\s*\([^)]*\)\s*;?", "", content)
                    if not pat["regex"].search(stripped):
                        continue
                    findings[pat["type"]].append(fpath)
                    continue
                if pat["regex"].search(content):
                    findings[pat["type"]].append(fpath)
    return findings


def check_div_balance(root_dir):
    """div 标签平衡检查（只扫 .html）"""
    bad = []
    for dirpath, dirnames, filenames in os.walk(root_dir):
        dirnames[:] = [d for d in dirnames if d not in (".git", "node_modules", ".openclaw", "DELIVERY")]
        for fn in filenames:
            if not fn.endswith(".html"):
                continue
            fpath = os.path.join(dirpath, fn)
            try:
                with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
            except Exception:
                continue
            # 粗略统计（排除注释）
            content = re.sub(r"<!--.*?-->", "", content, flags=re.S)
            opens = len(re.findall(r"<div[\s>]", content))
            closes = len(re.findall(r"</div>", content))
            if opens != closes:
                bad.append(f"{fpath} (open={opens} close={closes})")
    return bad


def trace(conn, root_dir):
    """同类问题反向追溯"""
    c = conn.cursor()
    c.execute("SELECT type, COUNT(*) FROM repair_log GROUP BY type")
    repaired = dict(c.fetchall())

    findings = scan_dir(root_dir, SCAN_PATTERNS)
    div_bad = check_div_balance(root_dir)
    findings["div-balance"] = div_bad

    report = {
        "ts": datetime.now().isoformat(),
        "root_dir": root_dir,
        "history": repaired,
        "findings": {},
        "summary": {},
    }
    total = 0
    for pat in SCAN_PATTERNS:
        files = findings[pat["type"]]
        count = len(files)
        total += count
        history = repaired.get(pat["type"], 0)
        report["findings"][pat["type"]] = files[:20]  # 只保留前 20 个
        if count == 0:
            state = "✅ 清零"
        elif history > 0:
            state = f"⚠️ 复发（历史修真 {history} 次）"
        else:
            state = "🆕 新发现"
        report["summary"][pat["type"]] = {"count": count, "history": history, "state": state}
        print(f"  [{state}] {pat['name']}: {count} 处 (历史修真 {history} 次)")

    report["summary"]["_total"] = total
    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print(f"\n  📄 报告已落盘: {OUTPUT}")
    return total


def stats(conn):
    c = conn.cursor()
    c.execute("SELECT type, COUNT(*), GROUP_CONCAT(root) FROM repair_log GROUP BY type")
    rows = c.fetchall()
    print("  📋 修真历史（按类型）:")
    for t, n, roots in rows:
        print(f"    {t}: {n} 次 — {roots[:80]}")
    c.execute("SELECT COUNT(*) FROM repair_log")
    print(f"\n  总计修真记录: {c.fetchone()[0]} 条")


def main():
    parser = argparse.ArgumentParser(description="修真闭环自动化")
    parser.add_argument("--add", action="store_true", help="登记修真记录")
    parser.add_argument("--type", default="other", help="问题类型")
    parser.add_argument("--root", default="", help="根因描述")
    parser.add_argument("--files", default="", help="涉及文件（逗号分隔）")
    parser.add_argument("--note", default="", help="修复说明")
    parser.add_argument("--trace", action="store_true", help="反向追溯扫描")
    parser.add_argument("--stats", action="store_true", help="修真统计")
    parser.add_argument("--root-dir", default=os.path.dirname(DB_PATH) and os.path.join(os.path.dirname(os.path.dirname(DB_PATH)), "app"), help="扫描目录")
    args = parser.parse_args()

    if not os.path.exists(DB_PATH):
        print(f"  ⚠️ DB not found: {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    init_db(conn)

    if args.add:
        if not args.root:
            print("  ❌ --add 需要 --root（根因描述）")
            return
        rid = add_repair(conn, args.type, args.root, args.files, args.note)
        print(f"  ✅ 修真记录已入库 (id={rid}) type={args.type} root={args.root[:60]}")
    elif args.trace:
        print("  🔍 同类问题反向追溯:")
        total = trace(conn, args.root_dir)
        print(f"\n  共发现 {total} 处问题")
    elif args.stats:
        stats(conn)
    else:
        parser.print_help()

    conn.close()


if __name__ == "__main__":
    main()
