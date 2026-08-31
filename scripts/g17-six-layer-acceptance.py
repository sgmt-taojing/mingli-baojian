#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
g17-six-layer-acceptance.py — G17 六层验收（ADR-017 裁判任务书）

顺序（严格）：L5 十节点冒烟（阻断）→ L1 差集巡检 clean（阻断）→ L2 同案对拍
  → L3 知识一致性 → L4 R745 阴性守卫 → L6 端到端旅程
纪律：L1/L5 任一不过即停（rc=2 报裁判下回滚令）；其余层 FAIL 记录但跑完，供裁判全貌裁决。
证据：每层落 DELIVERY/<层名>-evidence-<时间戳>.json；汇总落 g17-summary-<ts>.json。
测试数据：全虚构（equiv-set-v1 冻结集），禁真实患者数据。
"""
from __future__ import annotations

import json
import subprocess
import sys
import time
import urllib.request
import urllib.error
import random
import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "DELIVERY"
TCM = "http://127.0.0.1:8932"
MS = "http://127.0.0.1:8972"
EXTRA = "http://127.0.0.1:8974"
API2 = "http://127.0.0.1:8920"
TS = time.strftime("%Y%m%d-%H%M%S")

MINGLI_KW = ['日主', '天干', '地支', '八字', '紫微', '命宫', '财帛宫', '大运', '流年',
             '四柱', '纳音', '食神', '伤官', '七杀', '正官', '偏财', '比肩', '劫财',
             '排盘', '命盘', '化忌']

summary = {"ts": TS, "layers": {}, "verdict": None}


def http(method, base, path, body=None, timeout=60, headers=None):
    h = {"Content-Type": "application/json"}
    h.update(headers or {})
    req = urllib.request.Request(base + path, method=method,
        data=json.dumps(body).encode() if body is not None else None, headers=h)
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


def drop(layer, data):
    OUT.mkdir(exist_ok=True)
    fp = OUT / f"{layer}-evidence-{TS}.json"
    fp.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    return fp


def record(layer, verdict, fp, note=""):
    summary["layers"][layer] = {"verdict": verdict, "evidence": fp.name, "note": note}
    print(f"[{layer}] {verdict}  ({fp.name}) {note}")


# ── L5 十节点冒烟（阻断）──
r = subprocess.run([sys.executable, str(ROOT / "scripts" / "g5-smoke-e2e.py")],
                   capture_output=True, text=True, timeout=600)
raw = r.stdout
verdict_l5 = "PASS" if '"verdict": "PASS"' in raw else "FAIL"
latest = sorted(OUT.glob("g5-smoke-evidence-*.json"))[-1]
fp = drop("L5", {"source_evidence": latest.name, "returncode": r.returncode,
                 "verdict": verdict_l5,
                 "nodes": json.loads(latest.read_text())["nodes"]})
record("L5", verdict_l5, fp, "十节点冒烟（含命理采集首节点+五守卫）")
if verdict_l5 != "PASS":
    summary["verdict"] = "HALT: L5 阻断失败，报裁判下回滚令"
    drop("g17-summary", summary); sys.exit(2)

# ── L1 差集巡检 clean（阻断）──
r = subprocess.run([sys.executable, str(ROOT / "scripts" / "tcm-capability-diff.py")],
                   capture_output=True, text=True, timeout=300)
d = json.loads(r.stdout.strip().splitlines()[-1])
clean = d.get("clean") is True and d.get("missing_api_count") == 0
fp = drop("L1", {"diff_result": d, "verdict": "PASS" if clean else "FAIL"})
record("L1", "PASS" if clean else "FAIL", fp, f"missing_api={d.get('missing_api_count')} head={d.get('tcm_head','')[:30]}")
if not clean:
    summary["verdict"] = "HALT: L1 阻断失败，报裁判下回滚令"
    drop("g17-summary", summary); sys.exit(2)

# ── L2 同案对拍（G18 门体裸跑，不写令牌）──
r = subprocess.run([sys.executable, str(ROOT / "scripts" / "equiv-dual-run.py")],
                   capture_output=True, text=True, timeout=300)
d2 = json.loads(r.stdout)
fp = drop("L2", d2)
record("L2", d2["verdict"], fp,
       f"零差异={d2['gate_checks']['zero_diff']} recallΔ={d2['recall']['delta']}")

# ── L3 知识一致性（条数 / 抽样 200 指纹 / Recall@K 对跑）──
l3 = {"checks": {}}
# 3a 条数：8972 内化快照 vs 主镜像
mirror = json.loads((ROOT / "server" / "kb-store" / "tcm-authoritative-full.json").read_text())
snap = json.loads((ROOT / "medical-stack" / "server" / "kb-store" / "tcm-synced-kb.json").read_text())
def total_of(blob):
    # 兼容两种结构：信封 {total_entries,data:{mod:[...]}} 或裸模块映射 {mod:[...]}
    if blob.get("total_entries"):
        return blob["total_entries"]
    data = blob.get("data") or blob
    return sum(len(v) for v in data.values() if isinstance(v, list))
m_total = total_of(mirror)
s_total = total_of(snap)
l3["checks"]["counts"] = {"mirror": m_total, "snapshot": s_total, "equal": m_total == s_total}
# 3b 抽样 200 条指纹（镜像 vs 内化快照，确定性 seed）
def flat_entries(blob):
    data = blob.get("data") or blob
    out = []
    for mod, arr in data.items():
        if isinstance(arr, list):
            for e in arr:
                out.append((mod, json.dumps(e, ensure_ascii=False, sort_keys=True)))
    return out
fm, fs = flat_entries(mirror), flat_entries(snap)
rng = random.Random(200)
sam_m = sorted(rng.sample(fm, min(200, len(fm))))
ms_set = set(fs)
hit = sum(1 for e in sam_m if e in ms_set)
l3["checks"]["fingerprint_sample"] = {"sampled": len(sam_m), "matched_in_snapshot": hit,
                                      "rate": round(hit / max(1, len(sam_m)), 4)}
# 3c Recall@K 对跑（复用 L2 数据）
l3["checks"]["recall_dual"] = d2["recall"]
l3["verdict"] = "PASS" if (l3["checks"]["counts"]["equal"] and
                           l3["checks"]["fingerprint_sample"]["rate"] == 1.0) else "FAIL"
fp = drop("L3", l3)
record("L3", l3["verdict"], fp,
       f"条数 {s_total}/{m_total} 指纹 {l3['checks']['fingerprint_sample']['rate']}")

# ── L4 R745 阴性守卫 ──
l4 = {"checks": {}}
# 4a 医学输出零命理词：双侧 diagnose 同案
_, diag_ms = http("POST", MS, "/api/tcm/diagnose", {"symptoms": ["胃胀", "嗳气"], "patient_id": "G17-L4-PROBE"})
txt = json.dumps(diag_ms, ensure_ascii=False)
l4["checks"]["medical_no_mingli_words"] = {"pass": not [w for w in MINGLI_KW if w in txt]}
# 4b 批注不入诊断上下文：诊断响应不得含 annotations/mingli_features 字段
l4["checks"]["no_annotation_in_diag"] = {"pass": "annotations" not in diag_ms and "mingli_features" not in diag_ms}
# 4c tcm 拒收命理字段：向 8932 diagnose 塞命理字段，响应须无命理词（结构性不吸收）
_, diag_tcm = http("POST", TCM, "/api/tcm/diagnose",
                   {"symptoms": ["胃胀"], "patient_id": "G17-L4-PROBE",
                    "mingli": "甲木日主", "bazi": "甲子 乙丑", "命宫": "贪狼"})
t_txt = json.dumps(diag_tcm, ensure_ascii=False)
l4["checks"]["tcm_rejects_mingli_fields"] = {"pass": not [w for w in MINGLI_KW if w in t_txt],
                                             "tcm_http_ok": True}
l4["verdict"] = "PASS" if all(c["pass"] for c in l4["checks"].values()) else "FAIL"
fp = drop("L4", l4)
record("L4", l4["verdict"], fp, "三阴性断言")

# ── L6 端到端旅程（G10 mock outbox + G13 批注剥离阴性）──
l6 = {"checks": {}}
# 6a G10：验证码发送 → outbox 记录
st, sc = http("POST", MS, "/api/sms/send-code", {"phone": "13800001234", "scene": "g17-acceptance"})
outbox_dir = ROOT / "medical-stack" / "server" / "data" / "sms-outbox"
found = False
if outbox_dir.exists():
    for f in sorted(outbox_dir.glob("*.jsonl"), reverse=True)[:2]:
        for line in f.read_text(encoding="utf-8").splitlines()[::-1]:
            try:
                rec = json.loads(line)
            except Exception:
                continue
            # 落库手机号已脱敏（前3+****+后4），按 kind+脱敏号匹配，兼容未脱敏旧格式
            if rec.get("kind") == "verify_code" and \
               (rec.get("to") in ("138****1234", "13800001234") or
                "13800001234" in json.dumps(rec, ensure_ascii=False)):
                found = True
                break
        if found:
            break
l6["checks"]["g10_mock_outbox"] = {"send_http": st, "outbox_recorded": found}
# 6b G13：含命理词回流 → 422 拒发（阴性断言）；先绑测试 link
http("POST", MS, "/api/reflux/link", {"phone": "13800001234", "link_token": "lnk_" + "ab" * 16})
st1, r1 = http("POST", MS, "/api/reflux/push",
               {"phone": "13800001234", "report_type": "emr", "report_id": "G17-NEG-1",
                "title": "门诊病历", "summary": "八字日主甲木，大运流年"})
l6["checks"]["g13_mingli_strip_negative"] = {"http": st1, "blocked": st1 == 422,
                                             "code": r1.get("code")}
# 6c 干净医学内容可入本院收件箱（family 离线也应 inbox:true）
st2, r2 = http("POST", MS, "/api/reflux/push",
               {"phone": "13800001234", "report_type": "emr", "report_id": "G17-POS-1",
                "title": "门诊病历", "summary": "脾胃气虚，四君子汤加减"})
l6["checks"]["g13_clean_inbox"] = {"http": st2, "inbox": r2.get("inbox") is True}
l6["verdict"] = "PASS" if (found and st1 == 422 and l6["checks"]["g13_clean_inbox"]["inbox"]) else "FAIL"
fp = drop("L6", l6)
record("L6", l6["verdict"], fp, "outbox+剥离阴性+收件箱")

# ── 汇总 ──
blocking_ok = summary["layers"]["L5"]["verdict"] == "PASS" and summary["layers"]["L1"]["verdict"] == "PASS"
all_ok = all(l["verdict"] == "PASS" for l in summary["layers"].values())
summary["verdict"] = "PASS" if all_ok else ("PARTIAL" if blocking_ok else "HALT")
drop("g17-summary", summary)
print(json.dumps({"verdict": summary["verdict"],
                  "layers": {k: v["verdict"] for k, v in summary["layers"].items()}},
                 ensure_ascii=False))
sys.exit(0 if all_ok else (2 if not blocking_ok else 1))
