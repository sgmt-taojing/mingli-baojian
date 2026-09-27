#!/usr/bin/env python3
# kb-thin-module-remediate.py · 2026-09-27
# 稀薄模块整改：①混拼/拆分标签归并规范名 ②非知识条目移出命理域 ③空摘要回填
# 纪律：BEGIN IMMEDIATE + busy_timeout + datetime('now','localtime')；全程审计留证；幂等（按当前值匹配）
import sqlite3, json, os, time, sys

ROOT = "/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian"
DB = f"{ROOT}/server/database/yidao.db"
AUDIT = f"{ROOT}/logs/kb-thin-module-remediate-audit.jsonl"

# ① 标签归并映射（抽样核实过内容归属）
MERGE = {
    "bazi-teaching": "bazi",              # 日主强弱三维度评估法 → 八字主模块
    "liuyao-basics": "liuyao",            # 世应/六亲基础 → 六爻主模块
    "wuhou": "jieqi",                     # 七十二候物候 → 并入节气
    "bazi/ziwei": "classics",             # 看命一掌经古籍信息 → 典籍
    "qimen/liuren": "classics",           # 术数全书古籍信息 → 典籍
    "fengshui+yijing": "yijing",          # 地脉道/易之三义总论 → 易理
    "qimen/fengshui": "yangzhai",         # 缺角/穿堂煞 → 阳宅
    "ziwei+qimen+fengshui": "tianji-jiangjie",  # 倪师天纪总论 → 天纪讲解
    "ziwei/career": "ziwei", "ziwei/relationship": "ziwei",
    "ziwei/education": "ziwei", "ziwei/real-estate": "ziwei",
    "fengshui/zexu": "zeri",              # 择吉 → 择日
}
# ② 非命理知识移出命理域
TECH_OUT = {"xianzhi-lens": "tech"}       # 先知智镜 SDK 工程文档

def main():
    conn = sqlite3.connect(DB, timeout=60)
    conn.execute("PRAGMA busy_timeout=60000")
    log = open(AUDIT, "a")
    ts = time.strftime("%Y-%m-%d %H:%M:%S")
    cur = conn.cursor()
    cur.execute("BEGIN IMMEDIATE")
    try:
        n_merge = 0
        for old, new in MERGE.items():
            rows = cur.execute(
                "SELECT entry_id FROM kb_formal WHERE module=?", (old,)).fetchall()
            for (eid,) in rows:
                log.write(json.dumps({"ts": ts, "op": "module_merge",
                    "entry_id": eid, "old": old, "new": new}, ensure_ascii=False) + "\n")
            cur.execute(
                "UPDATE kb_formal SET module=?, updated_at=datetime('now','localtime') WHERE module=?",
                (new, old))
            n_merge += cur.rowcount
        n_tech = 0
        for mod, dom in TECH_OUT.items():
            rows = cur.execute(
                "SELECT entry_id FROM kb_formal WHERE module=? AND domain='mingli'", (mod,)).fetchall()
            for (eid,) in rows:
                log.write(json.dumps({"ts": ts, "op": "domain_move",
                    "entry_id": eid, "module": mod, "old_domain": "mingli", "new_domain": dom},
                    ensure_ascii=False) + "\n")
            cur.execute(
                "UPDATE kb_formal SET domain=?, updated_at=datetime('now','localtime') WHERE module=? AND domain='mingli'",
                (dom, mod))
            n_tech += cur.rowcount
        # ③ 空摘要回填（命理域）：取正文首 80 字去空白
        rows = cur.execute(
            "SELECT entry_id, content FROM kb_formal WHERE domain='mingli' AND (summary IS NULL OR trim(summary)='')").fetchall()
        n_sum = 0
        for eid, content in rows:
            c = (content or "").strip().replace("\n", " ")
            if not c:
                continue
            s = c[:80]
            cur.execute(
                "UPDATE kb_formal SET summary=?, updated_at=datetime('now','localtime') WHERE entry_id=?",
                (s, eid))
            n_sum += 1
        log.write(json.dumps({"ts": ts, "op": "summary_backfill", "count": n_sum}, ensure_ascii=False) + "\n")
        conn.commit()
        print(json.dumps({"merged": n_merge, "tech_out": n_tech, "summary_backfill": n_sum}, ensure_ascii=False))
    except Exception as e:
        conn.rollback()
        print(f"ROLLBACK: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        log.close(); conn.close()

if __name__ == "__main__":
    main()
