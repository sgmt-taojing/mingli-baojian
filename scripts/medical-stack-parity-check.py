#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
medical-stack-parity-check.py — 移植精准保障：medical-stack 与 tcm-agent 同案对拍

逻辑（简单三条）：
  1. 不训练：本脚本不含任何训练/蒸馏，只做同案请求与字段比对。
  2. 同案对拍：同一输入同时打 tcm 侧（8932）与 medical-stack 侧（8972），
     关键字段一致 → 移植保真；不一致 → 逐案列出差异，禁止静默通过。
  3. 留证：结果落 medical-stack/parity-check-state.json，watchdog 可读。

用法：python3 medical-stack-parity-check.py [--write-state]
"""
from __future__ import annotations

import json
import sys
import time
import urllib.request
from pathlib import Path

TCM = "http://127.0.0.1:8932"
MS = "http://127.0.0.1:8972"
STATE = Path(__file__).resolve().parent.parent / "medical-stack" / "parity-check-state.json"

# 金案：只选确定性读接口（写接口/随机因子不参与对拍）
CASES = [
    {"name": "tcm-health-七能力", "method": "GET", "path": "/api/tcm/health",
     "keys": ["ok", "capabilities"]},
    {"name": "clinic-links", "method": "GET", "path": "/api/public/clinic-links",
     "keys": ["ok"]},
    {"name": "词条即查-甘草", "method": "GET", "path": "/api/tcm/entry/info?name=%E7%94%98%E8%8D%89",
     "keys": ["ok"]},
    {"name": "方反查-胃胀嗳气", "method": "GET",
     "path": "/api/tcm/kb/formula-recall?symptoms=%E8%83%83%E8%83%80,%E5%97%B0%E6%B0%94",
     "keys": ["ok"]},
    {"name": "条目名清单", "method": "GET", "path": "/api/tcm/entry/names",
     "keys": ["ok"], "compare_len": ["names", "items", "list"]},
]


def http(method: str, url: str, body=None, timeout=30, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, method=method,
        data=json.dumps(body).encode() if body else None,
        headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, json.loads(r.read().decode("utf-8", "replace"))
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode("utf-8", "replace"))
        except Exception:
            return e.code, {}
    except Exception as e:
        return 0, {"_error": str(e)}


def pick(d: dict, keys: list[str]):
    return {k: d.get(k) for k in keys if k in d}


def _login_token(base: str) -> str:
    """登录拿 token（2026-09-15 修真：tcm 侧 clinical-auth-boundary 对非白名单 GET 也 401，
    裸探针会把「鉴权正常」误判为「移植保真破窗」→ parity 探针必须带凭据对拍）
    凭据从环境变量读：PARITY_USER / PARITY_PASS（默认 admin/admin123 仅限本机对拍）"""
    import os
    user = os.environ.get("PARITY_USER", "admin")
    pwd = os.environ.get("PARITY_PASS", "admin123")
    try:
        st, d = http("POST", base + "/api/auth/login", {"username": user, "password": pwd})
        if st == 200:
            tok = d.get("token") or (d.get("data") or {}).get("token") or ""
            return tok if isinstance(tok, str) else ""
    except Exception:
        pass
    return ""


def main() -> int:
    write_state = "--write-state" in sys.argv
    tcm_token = _login_token(TCM)
    ms_token = _login_token(MS)
    rows = []
    passed = failed = skipped = 0
    for c in CASES:
        ts, td = http(c["method"], TCM + c["path"], c.get("body"), token=tcm_token)
        ms, md = http(c["method"], MS + c["path"], c.get("body"), token=ms_token)
        row = {"case": c["name"], "tcm_status": ts, "ms_status": ms}
        if ts == 0 or ms == 0:
            row.update(result="skip", note=f"服务不可达 tcm={td.get('_error','-')} ms={md.get('_error','-')}")
            skipped += 1
        elif ts != ms:
            row.update(result="fail", note=f"HTTP 状态不一致 {ts} vs {ms}")
            failed += 1
        else:
            diffs = []
            for k in c["keys"]:
                tv, mv = td.get(k), md.get(k)
                if k == "capabilities" and isinstance(tv, list) and isinstance(mv, list):
                    if sorted(map(str, tv)) != sorted(map(str, mv)):
                        diffs.append(f"capabilities: {tv} vs {mv}")
                elif tv != mv:
                    diffs.append(f"{k}: {tv!r} vs {mv!r}")
            for lk in c.get("compare_len", []):
                if lk in td and lk in md and isinstance(td[lk], list):
                    if len(td[lk]) != len(md[lk]):
                        diffs.append(f"{lk}.len: {len(td[lk])} vs {len(md[lk])}")
                    break
            if diffs:
                row.update(result="fail", diffs=diffs)
                failed += 1
            else:
                row.update(result="pass", http=ts)
                passed += 1
        rows.append(row)

    verdict = "PASS" if failed == 0 and passed > 0 else ("DEGRADED" if failed == 0 else "FAIL")
    out = {"ts": time.strftime("%Y-%m-%dT%H:%M:%S"), "verdict": verdict,
           "pass": passed, "fail": failed, "skip": skipped, "rows": rows}
    if write_state:
        STATE.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(out, ensure_ascii=False, indent=1))
    return 0 if verdict == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
