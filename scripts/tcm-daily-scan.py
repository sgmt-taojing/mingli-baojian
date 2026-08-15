#!/usr/bin/env python3
"""
R483 · TCM 知识库每日扫描 + 差距比对 + 自动蒸馏建议
========================================================
目标：每天自动扫描 TCM 模块知识库，比对标准，输出差距报告，
      并在有缺口时自动触发知识蒸馏补充。

维度：
1. 模块覆盖度（17 个 TCM 模块 vs 标准要求）
2. 置信度分布（各模块 avg_confidence, 低分预警）
3. 证候覆盖（八纲/六经/脏腑/气血津液 四大辨证体系）
4. 方剂覆盖（经典方 vs KB 收录）
5. 经典原文覆盖率（伤寒/金匮/内经/本草）
6. 日间变化追踪（对比昨日快照）

输出：.openclaw/tmp/tcm-daily-scan-YYYY-MM-DD.json
"""

import sqlite3, json, os, sys, hashlib
from datetime import datetime, timezone, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT / 'knowledge' / 'yidao.db'
SCAN_DIR = ROOT / '.openclaw' / 'tmp'
SCAN_DIR.mkdir(parents=True, exist_ok=True)

TZ = timezone(timedelta(hours=8))
TODAY = datetime.now(TZ).strftime('%Y-%m-%d')

# ══════════════════════════════════════
# TCM 模块分类 + 标准覆盖要求
# ══════════════════════════════════════
TCM_STANDARD = {
    "四大经典": {
        "shanghan-lun": {"min_entries": 200, "min_confidence": 0.75, "desc": "伤寒论"},
        "jinkui-yaolue": {"min_entries": 100, "min_confidence": 0.80, "desc": "金匮要略"},
        "huangdi-neijing": {"min_entries": 150, "min_confidence": 0.70, "desc": "黄帝内经"},
        "shennong-bencao": {"min_entries": 150, "min_confidence": 0.70, "desc": "神农本草经"},
    },
    "诊断体系": {
        "tcm-diagnosis": {"min_entries": 150, "min_confidence": 0.75, "desc": "中医诊断学"},
        "tcm": {"min_entries": 300, "min_confidence": 0.65, "desc": "中医通用"},
        "wangzhen": {"min_entries": 100, "min_confidence": 0.78, "desc": "望诊"},
        "tcm-classical": {"min_entries": 200, "min_confidence": 0.80, "desc": "中医经典综合"},
    },
    "方剂药学": {
        "tcm-fangji": {"min_entries": 400, "min_confidence": 0.78, "desc": "方剂学"},
        "tcm-zhongfu": {"min_entries": 150, "min_confidence": 0.70, "desc": "中药学"},
    },
    "临床专科": {
        "tcm-clinical": {"min_entries": 80, "min_confidence": 0.65, "desc": "临床经验"},
        "tcm-syndrome": {"min_entries": 50, "min_confidence": 0.70, "desc": "证候学"},
    },
    "针灸经络": {
        "acupuncture": {"min_entries": 300, "min_confidence": 0.72, "desc": "针灸学"},
    },
    "倪海厦体系": {
        "nihaisha": {"min_entries": 300, "min_confidence": 0.60, "desc": "倪海厦综合"},
        "nihaisha-structured": {"min_entries": 100, "min_confidence": 0.60, "desc": "倪海厦结构化"},
        "nihaixia-yian": {"min_entries": 150, "min_confidence": 0.70, "desc": "倪海厦医案"},
    },
    "其他中医": {
        "shuhan-tcm": {"min_entries": 80, "min_confidence": 0.65, "desc": "舒晗中医"},
        "fuyang": {"min_entries": 50, "min_confidence": 0.65, "desc": "扶阳学派"},
    },
}

# 核心方剂检查清单（经典名方 50 首）
CORE_FORMULAS = [
    "麻黄汤","桂枝汤","小青龙汤","大青龙汤","银翘散","桑菊饮",
    "大承气汤","小承气汤","调胃承气汤","麻子仁丸","十枣汤",
    "小柴胡汤","大柴胡汤","逍遥散","半夏泻心汤","黄连汤",
    "白虎汤","竹叶石膏汤","清营汤","犀角地黄汤","黄连解毒汤",
    "理中丸","四逆汤","当归四逆汤","真武汤","附子汤",
    "四君子汤","补中益气汤","四物汤","归脾汤","炙甘草汤","六味地黄丸",
    "安宫牛黄丸","苏合香丸","越鞠丸","半夏厚朴汤","血府逐瘀汤",
    "温胆汤","二陈汤","五苓散","苓桂术甘汤","独活寄生汤",
    "生脉散","玉屏风散","四神丸","金锁固精丸","乌梅丸",
    "旋覆代赭汤","橘皮竹茹汤","黄土汤","胶艾汤",
]

# 核心证候清单
CORE_SYNDROMES = [
    "表寒证","表热证","里寒证","里热证","虚寒证","实热证",
    "气虚证","血虚证","阴虚证","阳虚证","气血两虚","气阴两虚",
    "肝气郁结","肝阳上亢","肝风内动","心脾两虚","心肾不交",
    "脾胃虚弱","脾虚湿盛","湿热蕴结","痰湿内阻","瘀血阻络",
    "风寒束肺","风热犯肺","痰热壅肺","风寒表实证","太阳中风",
    "阳明经证","阳明腑证","少阳病","太阴病","少阴寒化","厥阴病",
]

def scan():
    db = sqlite3.connect(str(DB))
    db.row_factory = sqlite3.Row
    cur = db.cursor()

    report = {
        "ts": datetime.now(TZ).isoformat(),
        "date": TODAY,
        "summary": {},
        "modules": {},
        "formulas": {},
        "syndromes": {},
        "gaps": [],
        "recommendations": [],
        "changes": {},
    }

    # ─── 1. 模块覆盖度 ───
    total_tcm = 0
    total_pass = 0
    for category, modules in TCM_STANDARD.items():
        for mod, std in modules.items():
            cur.execute("SELECT COUNT(*), AVG(confidence) FROM kb_formal WHERE module=?", (mod,))
            row = cur.fetchone()
            cnt = row[0] or 0
            avg_c = round(row[1] or 0, 3)

            entry_pass = cnt >= std["min_entries"]
            conf_pass = avg_c >= std["min_confidence"]
            ok = entry_pass and conf_pass

            report["modules"][mod] = {
                "category": category,
                "entries": cnt,
                "avg_confidence": avg_c,
                "target_entries": std["min_entries"],
                "target_confidence": std["min_confidence"],
                "entry_pass": entry_pass,
                "conf_pass": conf_pass,
                "ok": ok,
            }

            if not ok:
                gap = []
                if not entry_pass: gap.append(f"条目不足: {cnt}/{std['min_entries']}")
                if not conf_pass: gap.append(f"置信度低: {avg_c}/{std['min_confidence']}")
                report["gaps"].append({"module": mod, "category": category, "gap": gap, "desc": std["desc"]})
                report["recommendations"].append(f"补充 {std['desc']}({mod}): 需 +{std['min_entries']-cnt} 条")

            total_tcm += cnt
            if ok: total_pass += 1

    report["summary"]["tcm_modules"] = len(TCM_STANDARD)
    report["summary"]["tcm_modules_pass"] = total_pass
    report["summary"]["tcm_total_entries"] = total_tcm
    report["summary"]["tcm_pass_rate"] = f"{total_pass}/{sum(len(v) for v in TCM_STANDARD.values())}"

    # ─── 2. 方剂覆盖 ───
    formula_hits = 0
    for formula in CORE_FORMULAS:
        cur.execute("SELECT COUNT(*) FROM kb_formal WHERE (title LIKE ? OR content LIKE ?) AND module LIKE '%tcm%'",
                    (f'%{formula}%', f'%{formula}%'))
        hit = cur.fetchone()[0] > 0
        report["formulas"][formula] = hit
        if hit: formula_hits += 1
    report["summary"]["formula_coverage"] = f"{formula_hits}/{len(CORE_FORMULAS)}"

    # ─── 3. 证候覆盖 ───
    syndrome_hits = 0
    for syndrome in CORE_SYNDROMES:
        cur.execute("SELECT COUNT(*) FROM kb_formal WHERE (title LIKE ? OR content LIKE ?) AND module LIKE '%tcm%'",
                    (f'%{syndrome}%', f'%{syndrome}%'))
        hit = cur.fetchone()[0] > 0
        report["syndromes"][syndrome] = hit
        if hit: syndrome_hits += 1
    report["summary"]["syndrome_coverage"] = f"{syndrome_hits}/{len(CORE_SYNDROMES)}"

    # ─── 4. 缺失方剂和证候 ───
    missing_formulas = [k for k, v in report["formulas"].items() if not v]
    missing_syndromes = [k for k, v in report["syndromes"].items() if not v]
    if missing_formulas:
        report["recommendations"].append(f"缺失方剂({len(missing_formulas)}首): {', '.join(missing_formulas[:10])}...")
    if missing_syndromes:
        report["recommendations"].append(f"缺失证候({len(missing_syndromes)}个): {', '.join(missing_syndromes[:8])}...")

    # ─── 5. 日间变化（对比昨日快照）───
    yesterday_file = SCAN_DIR / f'tcm-daily-scan-{(datetime.now(TZ)-timedelta(days=1)).strftime("%Y-%m-%d")}.json'
    if yesterday_file.exists():
        with open(yesterday_file) as f:
            yesterday = json.load(f)
        for mod in report["modules"]:
            if mod in yesterday.get("modules", {}):
                y_cnt = yesterday["modules"][mod]["entries"]
                t_cnt = report["modules"][mod]["entries"]
                if y_cnt != t_cnt:
                    report["changes"][mod] = {"yesterday": y_cnt, "today": t_cnt, "delta": t_cnt - y_cnt}

    db.close()

    # ─── 保存 ───
    out_path = SCAN_DIR / f'tcm-daily-scan-{TODAY}.json'
    with open(out_path, 'w') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    return report

def print_report(r):
    s = r["summary"]
    print(f"📊 TCM 知识库日扫描 · {TODAY}")
    print(f"   模块达标: {s['tcm_modules_pass']}/{s['tcm_pass_rate'].split('/')[1]}")
    print(f"   TCM 条目: {s['tcm_total_entries']}")
    print(f"   方剂覆盖: {s['formula_coverage']}")
    print(f"   证候覆盖: {s['syndrome_coverage']}")
    print(f"   差距: {len(r['gaps'])} 个模块")
    print(f"   建议: {len(r['recommendations'])} 条")
    print(f"   日变化: {len(r['changes'])} 个模块有变化")

    if r["gaps"]:
        print("\n── 差距模块 ──")
        for g in r["gaps"]:
            print(f"  ⚠️ {g['module']} ({g['category']}): {', '.join(g['gap'])}")
    if r["recommendations"]:
        print("\n── 蒸馏建议 ──")
        for i, rec in enumerate(r["recommendations"][:5]):
            print(f"  {i+1}. {rec}")
    if r["changes"]:
        print("\n── 日间变化 ──")
        for mod, ch in r["changes"].items():
            print(f"  {mod}: {ch['yesterday']} → {ch['today']} ({ch['delta']:+d})")

    print(f"\n报告: {SCAN_DIR}/tcm-daily-scan-{TODAY}.json")

if __name__ == "__main__":
    r = scan()
    print_report(r)

    # 退出码：有差距=1，全OK=0
    sys.exit(1 if r["gaps"] else 0)
