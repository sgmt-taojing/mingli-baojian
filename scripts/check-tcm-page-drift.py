#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
check-tcm-page-drift.py — G18 防线：tcm 源页面「未补丁化本地差异」守卫

背景事故（2026-09-02 ×2）：OTA 重放链按 tcm 基线重放页面，把未补丁化的本地改动
整体抹掉；其中一次正发生在「验证通过 → git add」窗口期，导致提交进去的是被抹版本。
机制含义：medical-stack/app 下 tcm 源页面 = 基线 + 补丁，工作区与重放产物不一致
即为漂移（drift）——要么本地改动没补丁化（事故苗子），要么基线增量待重放（正常）。

双模式：
  默认（链上审计，挂 tcm-import-and-follow.sh 链 2a，先于重放跑）：
    全量 --check，漂移页逐页判定 baseline_changed（tcm 仓该页 24h 内有提交=基线增量，
    正常；否则=疑似未补丁化本地改动，事件级），落 DELIVERY/patch-drift-<date>.json。
    疑似本地改动 → rc=2（链非零即告警）；纯基线增量 → rc=0（重放器随后自动追平）。
  --staged（pre-commit 钩子模式）：
    只看 git staged 的 medical-stack/app/*.html 与漂移页的交集，有交集即 rc=1 拦截，
    打印处置指引（补丁化 or 先跑 reapply 追平再提交）。
"""
from __future__ import annotations

import json
import subprocess
import sys
import time
from pathlib import Path

WS = Path.home() / ".openclaw-autoclaw" / "workspace"
PROJ = WS / "projects" / "mingli-baojian"
TCM = WS / "projects" / "tcm-agent"
DELIVERY = PROJ / "DELIVERY"


def drift_pages() -> list[str]:
    r = subprocess.run(
        [sys.executable, str(PROJ / "scripts" / "reapply-patches.py"), "--check"],
        capture_output=True, text=True, timeout=120)
    try:
        d = json.loads(r.stdout.strip().splitlines()[-1])
    except Exception:
        print(f"[drift-guard] reapply --check 输出不可解析: rc={r.returncode} out={r.stdout[:200]}", file=sys.stderr)
        return []
    return d.get("replayed_pages", [])


def baseline_changed_recently(page: str, hours: int = 24) -> bool:
    """漂移源自 tcm 基线（正常追平场景）：该页 hours 内有提交，或 tcm 工作区有未提交改动"""
    try:
        r = subprocess.run(
            ["git", "-C", str(TCM), "log", "-1", "--format=%ct", "--", f"app/{page}.html"],
            capture_output=True, text=True, timeout=15)
        ts = int(r.stdout.strip() or "0")
        if ts > 0 and (time.time() - ts) < hours * 3600:
            return True
        # tcm 侧未提交的工作区改动同样算基线来源（tcm 会话开发中常态）
        r2 = subprocess.run(
            ["git", "-C", str(TCM), "status", "--porcelain", "--", f"app/{page}.html"],
            capture_output=True, text=True, timeout=15)
        if r2.stdout.strip():
            return True
    except Exception:
        pass
    return False


def staged_ms_pages() -> list[str]:
    r = subprocess.run(["git", "-C", str(PROJ), "diff", "--cached", "--name-only"],
                       capture_output=True, text=True, timeout=15)
    return [l.strip().split("/", 2)[-1][:-5] for l in r.stdout.splitlines()
            if l.startswith("medical-stack/app/") and l.endswith(".html")]


# ── js 层（共享 js 登记册单一真源：medical-stack/patches/js-adapt-registry.json）──
def js_registry() -> tuple[dict, dict]:
    try:
        reg = json.loads((PROJ / "medical-stack" / "patches" / "js-adapt-registry.json").read_text(encoding="utf-8"))
        return dict(reg.get("known_adapt", {})), dict(reg.get("ms_own", {}))
    except Exception:
        return {}, {}


def staged_ms_js() -> list[str]:
    """staged 的 medical-stack/app/js/**.js → 相对 app/js 的路径（含 vendor/ 子目录）"""
    r = subprocess.run(["git", "-C", str(PROJ), "diff", "--cached", "--name-only"],
                       capture_output=True, text=True, timeout=15)
    out = []
    for l in r.stdout.splitlines():
        l = l.strip()
        if l.startswith("medical-stack/app/js/") and l.endswith(".js"):
            out.append(l[len("medical-stack/app/js/"):])
    return out


def check_js_staged() -> list[tuple[str, str]]:
    """返回 [(rel, 原因)] 违规清单；空=放行"""
    import hashlib
    known_adapt, ms_own = js_registry()
    bad = []
    for rel in staged_ms_js():
        if rel in ms_own:
            continue
        tcm_f = TCM / "app" / "js" / rel
        ms_f = PROJ / "medical-stack" / "app" / "js" / rel
        if not tcm_f.exists():
            bad.append((rel, "tcm 无此 js（新文件须登记 js-adapt-registry.json ms_own）"))
            continue
        th = hashlib.sha256(tcm_f.read_bytes()).hexdigest()
        mh = hashlib.sha256(ms_f.read_bytes()).hexdigest()
        if th == mh:
            continue
        if rel not in known_adapt:
            bad.append((rel, "与 tcm 哈希不一致且未登记 known_adapt（有意适配须登记，否则应对齐 tcm）"))
    return bad


def main() -> int:
    staged_mode = "--staged" in sys.argv
    drift = drift_pages()

    if staged_mode:
        staged = set(staged_ms_pages())
        hit = [p for p in drift if p in staged]
        js_bad = check_js_staged()
        if not hit and not js_bad:
            return 0
        print("╔══ G18 防线：tcm 源页面/共享js 漂移拦截 ══", file=sys.stderr)
        for p in hit:
            kind = "基线增量待重放" if baseline_changed_recently(p) else "本地改动疑似未补丁化"
            print(f"  ✗ 页面 {p}（{kind}）", file=sys.stderr)
        for rel, why in js_bad:
            print(f"  ✗ js {rel}（{why}）", file=sys.stderr)
        print("处置：① 页面本地改动 → 转 patches/{brand,disclaimer,mingli-view}/ 补丁后跑 scripts/reapply-patches.py；", file=sys.stderr)
        print("      ② 基线待重放 → 先跑 scripts/reapply-patches.py 追平再提交；", file=sys.stderr)
        print("      ③ js 有意适配/自有 → 登记 medical-stack/patches/js-adapt-registry.json。", file=sys.stderr)
        print("      （tcm 源页面 = 基线+补丁，共享 js = tcm 同源+登记豁免，禁止直改提交）", file=sys.stderr)
        return 1

    # 链上审计模式
    if not drift:
        return 0
    events = []
    suspect = []
    for p in drift:
        base = baseline_changed_recently(p)
        events.append({"page": p, "baseline_changed": base})
        if not base:
            suspect.append(p)
    DELIVERY.mkdir(exist_ok=True)
    ledger_path = DELIVERY / f"patch-drift-{time.strftime('%Y%m%d')}.json"
    try:
        ledger = json.loads(ledger_path.read_text(encoding="utf-8"))
    except Exception:
        ledger = {"ledger": "patch-drift", "runs": []}
    ledger["runs"].append({"ts": time.strftime("%Y-%m-%dT%H:%M:%S"), "events": events})
    ledger_path.write_text(json.dumps(ledger, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"drift": len(drift), "baseline_updates": len(drift) - len(suspect),
                      "suspect_local_edits": suspect}, ensure_ascii=False))
    # 疑似未补丁化本地改动（重放器下一步就会把它抹掉）→ 非零告警转人工
    return 2 if suspect else 0


if __name__ == "__main__":
    raise SystemExit(main())
