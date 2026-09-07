#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
monthly-cross-check.py — 月度互查 mingli 本侧编排（草案 v0.1 → 机制落地，2026-09-07）

依据 docs/monthly-cross-check-draft-20260905.md 三分野清单，把裁判采纳项
（A3 排盘指纹对拍 / B2 检索处理器哈希 / B5 排名漂移守护）与既有巡检资产
合并为一条月度链路，关闭 KANBAN 三个 P2 口头项。

检查项（mingli 本侧可自动化的 9 项）：
  A1 能力包漂移（capability-drift-check.js，rc=1 FAIL / rc=2 待接收 WARN）
  A3 排盘输出指纹对拍（5 固定用例打 8920 原始盘端点，与上月指纹文件比对）
  B1 L1 差集 clean（读 capability-diff-state.json：新鲜度 + missing_api=0）
  B2 L2.5 检索处理器特征哈希（同上：processor_drift/js_drift 空）
  B3 L2 同案对拍全量复跑（equiv-dual-run.py verdict=PASS）
  B4 L3-lite 知识一致性（双侧 KB total + Recall 相等；完整 L3 抽样 200 留在 G17 套件）
  B5 排名漂移守护（金案 B075 双侧 top1 一致）
  C1 话术分层抽查（院内页机构版话术在、消费者 120 话术不在）
  C2 L4 R745 阴性守卫（医学输出零命理词/批注不入诊断/tcm 拒收命理字段）
  C3 历法一致性（server/true-solar.js 与能力包副本 sha256 同源）

产出：DELIVERY/monthly-cross-check-YYYYMM.json；任一 FAIL 退出码 1（供 health-patrol/人工捕获）。
"""
from __future__ import annotations

import glob
import hashlib
import json
import os
import subprocess
import sys
import time
import urllib.request
import urllib.error
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "DELIVERY"
MONTH = time.strftime("%Y%m")
TS = time.strftime("%Y-%m-%dT%H:%M:%S")

TCM = "http://127.0.0.1:8932"
MS = "http://127.0.0.1:8972"
API2 = "http://127.0.0.1:8920"
HDRS = {"X-Skip-Interceptor": "1", "User-Agent": "Mozilla/5.0",
        "Content-Type": "application/json"}
NODE = "/Applications/Kimi.app/Contents/Resources/resources/runtime/node"

MINGLI_KW = ['日主', '天干', '地支', '八字', '紫微', '命宫', '财帛宫', '大运', '流年',
             '四柱', '纳音', '食神', '伤官', '七杀', '正官', '偏财', '比肩', '劫财',
             '排盘', '命盘', '化忌']

# A3 固定用例（草案 v0.1 指定）：四盘 2026-08-27 20 时 + 紫微 1990-05-15 14:00
PAIPAN_CASES = [
    {"module": "qimen", "body": {"year": 2026, "month": 8, "day": 27, "hour": 20}},
    {"module": "liuyao", "body": {"year": 2026, "month": 8, "day": 27, "hour": 20}},
    {"module": "meihua", "body": {"year": 2026, "month": 8, "day": 27, "hour": 20}},
    {"module": "liuren", "body": {"year": 2026, "month": 8, "day": 27, "hour": 20}},
    {"module": "ziwei", "body": {"year": 1990, "month": 5, "day": 15, "hour": 14, "sex": "male"}},
]

report = {"ts": TS, "month": MONTH, "checks": {}, "verdict": "PASS"}


def rec(name, ok, note="", warn=False):
    status = "PASS" if ok else ("WARN" if warn else "FAIL")
    report["checks"][name] = {"status": status, "note": note}
    if not ok and not warn:
        report["verdict"] = "FAIL"
    return ok


def http_json(method, base, path, body=None, timeout=30):
    req = urllib.request.Request(
        base + path, method=method,
        data=json.dumps(body).encode() if body is not None else None, headers=HDRS)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, json.loads(r.read().decode("utf-8", "replace"))
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode("utf-8", "replace"))
        except Exception:
            return e.code, {}
    except Exception as e:
        return 0, {"_unreachable": str(e)}


def sha256_text(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


def sha256_file(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


def canon(obj) -> str:
    return json.dumps(obj, ensure_ascii=False, sort_keys=True)


# ── A1 能力包漂移 ──
try:
    r = subprocess.run([NODE, str(ROOT / "scripts" / "capability-drift-check.js")],
                       capture_output=True, text=True, timeout=120, cwd=str(ROOT))
    tail = (r.stdout or r.stderr).strip().splitlines()[-1][:150] if (r.stdout or r.stderr).strip() else ""
    if r.returncode == 1:
        rec("A1_drift", False, f"漂移 ERROR: {tail}")
    elif r.returncode == 2:
        rec("A1_drift", False, f"版本待接收（WARN 不判负）: {tail}", warn=True)
    else:
        rec("A1_drift", r.returncode == 0, f"rc={r.returncode} {tail}")
except Exception as e:
    rec("A1_drift", False, f"执行异常: {e}")

# ── A3 排盘输出指纹对拍 ──
try:
    fps = {}
    payloads = {}
    api_ok = True
    for c in PAIPAN_CASES:
        st, d = http_json("POST", API2, "/api/paipan/%s" % c["module"], c["body"], timeout=30)
        if st != 200 or not isinstance(d, dict) or d.get("ok") is False:
            api_ok = False
            fps[c["module"]] = "HTTP_%s" % st
            continue
        payloads[c["module"]] = d
        fps[c["module"]] = sha256_text(canon(d))
    fp_file = OUT / ("paipan-fingerprint-%s.json" % MONTH)
    prev = sorted(glob.glob(str(OUT / "paipan-fingerprint-*.json")))
    prev = [p for p in prev if not p.endswith("%s.json" % MONTH)]
    drift_note = ""
    if api_ok and prev:
        old = json.loads(open(prev[-1], encoding="utf-8").read())
        oldfps = old.get("fingerprints", {})
        diffs = [m for m, h in fps.items() if oldfps.get(m) and oldfps[m] != h]
        drift_note = "vs %s: %s" % (Path(prev[-1]).name, "一致" if not diffs else "漂移 %s" % diffs)
        rec("A3_paipan_fingerprint", not diffs, drift_note)
    elif api_ok:
        rec("A3_paipan_fingerprint", True, "首版基线（无上月对照件）")
    else:
        rec("A3_paipan_fingerprint", False, "排盘端点异常: %s" % canon(fps)[:150])
    if api_ok:
        fp_file.write_text(json.dumps(
            {"ts": TS, "cases": PAIPAN_CASES, "fingerprints": fps, "payloads": payloads},
            ensure_ascii=False, indent=1), encoding="utf-8")
except Exception as e:
    rec("A3_paipan_fingerprint", False, "执行异常: %s" % e)

# ── B1/B2 差集与处理器哈希（读链5 状态件，15min 节奏已保证新鲜） ──
try:
    st_file = ROOT / "medical-stack" / "capability-diff-state.json"
    st_raw = json.loads(st_file.read_text(encoding="utf-8"))
    st = st_raw.get("last", st_raw)  # 状态件结构 {digest, last:{...}}，兼容直写形态
    age_min = (time.time() - st_file.stat().st_mtime) / 60
    rec("B1_diff_clean",
        st.get("missing_api_count", -1) == 0 and age_min <= 70,
        "missing_api=%s age=%.0fmin page_gap=%s(L4已定性豁免)" % (
            st.get("missing_api_count"), age_min, st.get("page_gap_count")))
    rec("B2_processor_hash",
        not st.get("processor_drift") and not st.get("js_drift"),
        "processor_drift=%d js_drift=%d" % (
            len(st.get("processor_drift") or []), len(st.get("js_drift") or [])))
except Exception as e:
    rec("B1_diff_clean", False, "状态件读取异常: %s" % e)
    rec("B2_processor_hash", False, "同上")

# ── B3 同案对拍全量复跑 ──
try:
    r = subprocess.run([sys.executable, str(ROOT / "scripts" / "equiv-dual-run.py")],
                       capture_output=True, text=True, timeout=600, cwd=str(ROOT))
    d = json.loads(r.stdout.strip().splitlines()[-1] if r.stdout.strip().startswith("{") is False else r.stdout)
    rec("B3_equiv", d.get("verdict") == "PASS",
        "zero_diff=%s recall tcm=%s ms=%s Δ=%s" % (
            d.get("gate_checks", {}).get("zero_diff"),
            d.get("recall", {}).get("tcm"), d.get("recall", {}).get("ms"),
            d.get("recall", {}).get("delta")))
    report["checks"]["B3_equiv"]["evidence"] = canon(d)[:400]
except Exception as e:
    rec("B3_equiv", False, "执行异常: %s" % e)
    d = {}

# ── B4 L3-lite 知识一致性（双侧 total + Recall 相等） ──
try:
    _, kb_tcm = http_json("GET", TCM, "/api/tcm/kb", timeout=90)
    _, kb_ms = http_json("GET", MS, "/api/tcm/kb", timeout=90)
    t_total = (kb_tcm.get("total") or (kb_tcm.get("stats") or {}).get("total"))
    m_total = (kb_ms.get("total") or (kb_ms.get("stats") or {}).get("total"))
    rec_b3 = d.get("recall", {}) if isinstance(d, dict) else {}
    gap = abs((t_total or 0) - (m_total or 0))
    rec("B4_kb_consistency",
        t_total is not None and m_total is not None and gap <= max(50, int((t_total or 1) * 0.005))
        and rec_b3.get("tcm") == rec_b3.get("ms"),
        "tcm=%s ms=%s gap=%d（ms 快照滞后属正常时差） recall_equal=%s" % (
            t_total, m_total, gap, rec_b3.get("tcm") == rec_b3.get("ms")))
except Exception as e:
    rec("B4_kb_consistency", False, "执行异常: %s" % e)

# ── B5 排名漂移守护：金案 B075 双侧 top1 一致 ──
try:
    cases = json.loads((ROOT / "testdata" / "equiv-set-v2" / "kb-cases-36.json").read_text(encoding="utf-8"))["cases"]
    golden = [c for c in cases if c.get("id") == "B075"][0]
    q = urllib.parse.quote(golden["q"])
    tops = {}
    for name, base in (("tcm", TCM), ("ms", MS)):
        _, res = http_json("GET", base, "/api/tcm/kb/search?q=%s&limit=%d" % (q, golden.get("k", 10)), timeout=60)
        hits = res.get("results") or []
        tops[name] = (hits[0].get("title") if hits else None)
    rec("B5_golden_top1", tops["tcm"] is not None and tops["tcm"] == tops["ms"],
        "q=%s top1 tcm=%s ms=%s" % (golden["q"][:16], tops["tcm"], tops["ms"]))
except Exception as e:
    rec("B5_golden_top1", False, "执行异常: %s" % e)

# ── C1 话术分层抽查（ADR-009） ──
try:
    INST = "本系统为辅助诊疗工具"
    CONSUMER_120 = "立即拨打 120"
    c1_detail = []
    ok_all = True
    for page in ("app/integrated-clinic.html", "app/unified-consultation.html"):
        txt = (ROOT / page).read_text(encoding="utf-8", errors="replace")
        good = INST in txt and CONSUMER_120 not in txt
        ok_all = ok_all and good
        c1_detail.append("%s %s" % (page.split("/")[-1], "✓" if good else "✗机构版话术错位"))
    rec("C1_disclaimer_tiers", ok_all, "; ".join(c1_detail))
except Exception as e:
    rec("C1_disclaimer_tiers", False, "执行异常: %s" % e)

# ── C2 L4 R745 阴性守卫（三断言，与 G17 套件同口径） ──
try:
    _, diag_ms = http_json("POST", MS, "/api/tcm/diagnose",
                           {"symptoms": ["胃胀", "嗳气"], "patient_id": "MCC-C2-PROBE"}, timeout=60)
    txt = canon(diag_ms)
    c2a = not [w for w in MINGLI_KW if w in txt]
    c2b = "annotations" not in diag_ms and "mingli_features" not in diag_ms
    _, diag_tcm = http_json("POST", TCM, "/api/tcm/diagnose",
                            {"symptoms": ["胃胀"], "patient_id": "MCC-C2-PROBE",
                             "mingli": "甲木日主", "bazi": "甲子 乙丑", "命宫": "贪狼"}, timeout=60)
    c2c = not [w for w in MINGLI_KW if w in canon(diag_tcm)]
    rec("C2_r745_guards", c2a and c2b and c2c,
        "医学零命理词=%s 批注不入诊断=%s tcm拒收命理字段=%s" % (c2a, c2b, c2c))
except Exception as e:
    rec("C2_r745_guards", False, "执行异常: %s" % e)

# ── C3 历法一致性（true-solar.js 双侧同源） ──
try:
    local = sha256_file(ROOT / "server" / "true-solar.js")
    packs = sorted(glob.glob("/Users/tom/.openclaw-autoclaw/workspace/_shared/capability-outbox/capability-mingli-paipan-*/code/true-solar.js"))
    mism = [p for p in packs if sha256_file(Path(p)) != local]
    rec("C3_calendar_consistency", not mism,
        "local=%s… 能力包副本 %d 个%s" % (local[:12], len(packs), "，全同源" if not mism else "，异源: %s" % mism))
except Exception as e:
    rec("C3_calendar_consistency", False, "执行异常: %s" % e)

# ── 落盘与输出 ──
OUT.mkdir(exist_ok=True)
out_file = OUT / ("monthly-cross-check-%s.json" % MONTH)
out_file.write_text(json.dumps(report, ensure_ascii=False, indent=1), encoding="utf-8")

n_pass = sum(1 for c in report["checks"].values() if c["status"] == "PASS")
n_warn = sum(1 for c in report["checks"].values() if c["status"] == "WARN")
n_fail = sum(1 for c in report["checks"].values() if c["status"] == "FAIL")
print(json.dumps({"verdict": report["verdict"], "pass": n_pass, "warn": n_warn, "fail": n_fail,
                  "evidence": str(out_file)}, ensure_ascii=False))
for name, c in report["checks"].items():
    print("  %s %s — %s" % ({"PASS": "✅", "WARN": "⚠️", "FAIL": "❌"}[c["status"]], name, c["note"][:120]))
sys.exit(0 if report["verdict"] == "PASS" else 1)
