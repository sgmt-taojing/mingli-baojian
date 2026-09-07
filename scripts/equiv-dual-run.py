#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
equiv-dual-run.py — G18 同案对拍放行门（ADR-017）

同一输入分打 tcm 体系（8932）与本侧 medical-stack（8972）对应端点：
  A. 端点结构化 diff：递归比对 JSON，白名单键（timestamp/ts/id/trace/queue/
     latency/took/uptime/cache_at/elapsed/published_at 等运行态字段）之外零差异
  B. Recall@K 对跑：冻结对照集 testdata/equiv-set-v1/kb-cases-30.json 逐案打
     双侧 /api/tcm/kb/search，Recall@K 双侧差 ≤0.02

门槛：A 零差异 且 B 差值达标 → PASS，写放行令牌 medical-stack/data/equiv-gate-token.json
（TTL 30min）。FAIL 不写令牌 —— OTA 发布（medical-stack-patch 类）无令牌即拒绝，
吸收激活（--gate absorb）非零退出即回滚不激活。

用法：
  python3 equiv-dual-run.py --gate absorb   # 吸收激活前必过
  python3 equiv-dual-run.py --gate ota      # OTA 激活自测必过
  python3 equiv-dual-run.py                 # 裸跑（不写令牌）
"""
from __future__ import annotations

import argparse
import json
import secrets
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path

TCM = "http://127.0.0.1:8932"
MS = "http://127.0.0.1:8972"
ROOT = Path(__file__).resolve().parent.parent
EQUIV_SET_DEFAULT = ROOT / "testdata" / "equiv-set-v2" / "kb-cases-36.json"  # 最新冻结集（v2 = v1 30 例 + E11/E12/E15/E16 防回归 6 例）
TOKEN_FILE = ROOT / "medical-stack" / "data" / "equiv-gate-token.json"
TOKEN_TTL_S = 1800
RECALL_TOLERANCE = 0.02

WHITELIST_KEYS = {"timestamp", "ts", "id", "trace", "traceid", "trace_id", "queue",
                  "latency_ms", "took_ms", "uptime", "cache_at", "elapsed_ms", "service",  # service=品牌适配位
                  "elapsedMs", "published_at", "ran_at", "at", "date"}

# 端点对拍金案（确定性读接口；写接口不走对拍走冒烟边界码）
CASES = [
    {"name": "tcm-health", "path": "/api/tcm/health"},
    {"name": "clinic-links", "path": "/api/public/clinic-links"},
    {"name": "entry-info-甘草", "path": "/api/tcm/entry/info?name=%E7%94%98%E8%8D%89"},
    {"name": "entry-names", "path": "/api/tcm/entry/names"},
    {"name": "kb-search-小柴胡汤",
     "path": "/api/public/kb/realtime-search?q=%E5%B0%8F%E6%9F%B4%E8%83%A1%E6%B1%A4&limit=5"},
]


def http_json(base: str, path: str, timeout=30):
    req = urllib.request.Request(base + path)
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


def strip_volatile(x):
    """递归剥白名单键（运行态字段），返回可比对结构"""
    if isinstance(x, dict):
        return {k: strip_volatile(v) for k, v in x.items()
                if k.lower() not in WHITELIST_KEYS}
    if isinstance(x, list):
        return [strip_volatile(v) for v in x]
    return x


def diff_count(a, b) -> int:
    return 0 if strip_volatile(a) == strip_volatile(b) else 1


def recall_at_k(base: str, cases: list[dict]) -> tuple[float, int]:
    hits = 0
    for c in cases:
        q = urllib.parse.quote(c["q"])
        k = int(c.get("k", 5))
        st, d = http_json(base, f"/api/tcm/kb/search?q={q}&limit={k}")
        if st != 200:
            continue
        results = d.get("results") or []
        hay = json.dumps(results[:k], ensure_ascii=False)
        expects = (c.get("expect") or {}).get("title") or []
        if any(e in hay for e in expects):
            hits += 1
    return (hits / len(cases)) if cases else 0.0, hits


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--gate", choices=["absorb", "ota"], default=None)
    ap.add_argument("--set", dest="equiv_set", default=str(EQUIV_SET_DEFAULT),
                    help="冻结对照集 kb-cases JSON 路径（默认最新 v2；可指回 v1 做历史对照）")
    args = ap.parse_args()

    out = {"ts": time.strftime("%Y-%m-%dT%H:%M:%S"), "gate": args.gate,
           "endpoint_diffs": [], "recall": {}, "verdict": None}

    # A. 端点结构化 diff（白名单外零差异）
    for c in CASES:
        ts, td = http_json(TCM, c["path"])
        ms, md = http_json(MS, c["path"])
        if ts == 0 or ms == 0:
            out["endpoint_diffs"].append({"case": c["name"], "diff": "UNREACHABLE",
                                          "tcm": td.get("_unreachable"), "ms": md.get("_unreachable")})
            continue
        d = diff_count({"status": ts, "body": td}, {"status": ms, "body": md})
        if d:
            out["endpoint_diffs"].append({"case": c["name"], "diff": "MISMATCH",
                                          "tcm_head": json.dumps(strip_volatile(td), ensure_ascii=False)[:200],
                                          "ms_head": json.dumps(strip_volatile(md), ensure_ascii=False)[:200]})

    # B. Recall@K 双侧对跑
    cases = json.loads(Path(args.equiv_set).read_text(encoding="utf-8"))["cases"]
    out["equiv_set"] = str(args.equiv_set)
    rt, ht = recall_at_k(TCM, cases)
    rm, hm = recall_at_k(MS, cases)
    out["recall"] = {"k_cases": len(cases), "tcm": round(rt, 4), "ms": round(rm, 4),
                     "delta": round(abs(rt - rm), 4), "tolerance": RECALL_TOLERANCE,
                     "hits": {"tcm": ht, "ms": hm}}

    zero_diff = not out["endpoint_diffs"]
    recall_ok = out["recall"]["delta"] <= RECALL_TOLERANCE
    out["verdict"] = "PASS" if (zero_diff and recall_ok) else "FAIL"
    out["gate_checks"] = {"zero_diff": zero_diff, "recall_ok": recall_ok}

    if out["verdict"] == "PASS" and args.gate:
        TOKEN_FILE.parent.mkdir(parents=True, exist_ok=True)
        token = {"token": secrets.token_hex(16), "gate": args.gate,
                 "ts": time.time(), "ttl_s": TOKEN_TTL_S,
                 "evidence": out["ts"]}
        TOKEN_FILE.write_text(json.dumps(token, ensure_ascii=False, indent=1))
        out["gate_token"] = {"written": True, "ttl_s": TOKEN_TTL_S}

    print(json.dumps(out, ensure_ascii=False, indent=1))
    return 0 if out["verdict"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
