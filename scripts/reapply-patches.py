#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
reapply-patches.py — G18 补丁重放器（ADR-017 · 废止整页重打包后的唯一页面产生器）

模型：medical-stack/app/<page>.html = tcm 源头基线 + patches/ 三类补丁重放
  执行顺序：brand → disclaimer → mingli-view
  锚点失配 / 替换零命中（非 optional）→ WARN 转人工，该页不写入，禁止静默跳过
  幂等：重放结果与现文件一致 → 不写盘
范围：tcm app 与本侧 app 的同名页（新增页不自动内化，走链5差集+人工定性）
台账：DELIVERY/patch-replay-<date>.json（每次运行追加一条 run 记录）
"""
from __future__ import annotations

import json
import os
import sys
import time
import urllib.request
from pathlib import Path

WS = Path.home() / ".openclaw-autoclaw" / "workspace"
TCM_APP = WS / "projects" / "tcm-agent" / "app"
MS = WS / "projects" / "mingli-baojian" / "medical-stack"
MS_APP = MS / "app"
PATCHES = MS / "patches"
DELIVERY = WS / "projects" / "mingli-baojian" / "DELIVERY"
STATIC_BASE = "http://127.0.0.1:8973"  # 命理宝鉴·医道静态层（8931 属 tcm 自有）

CLASS_ORDER = ["brand", "disclaimer", "mingli-view"]


def load_patches() -> list[dict]:
    patches = []
    for cls in CLASS_ORDER:
        d = PATCHES / cls
        if not d.exists():
            continue
        for f in sorted(d.glob("*.json")):
            p = json.loads(f.read_text(encoding="utf-8"))
            p["_file"] = f"{cls}/{f.name}"
            patches.append(p)
    return patches


def applies_to(patch: dict, page: str) -> bool:
    if patch.get("page") == "*":
        return True
    if patch.get("page") == page:
        return True
    if isinstance(patch.get("pages"), list) and page in patch["pages"]:
        return True
    return False


def apply_patch(text: str, patch: dict, page: str, warns: list[str]) -> str:
    for op in patch.get("ops", []):
        if op["type"] == "replace":
            cnt = text.count(op["from"])
            if cnt == 0:
                if not op.get("optional"):
                    warns.append(f"{page}: {patch['_file']} replace 零命中「{op['from'][:30]}」")
                continue
            text = text.replace(op["from"], op["to"])
        elif op["type"] == "inject":
            tpl = op["template"]
            if tpl in text:
                continue  # 幂等
            for anchor in op["anchors"]:
                if anchor in text:
                    text = text.replace(anchor, anchor + "\n" + tpl, 1)
                    break
            else:
                warns.append(f"{page}: {patch['_file']} inject 锚点全失配 {op['anchors']}")
    return text


def main() -> int:
    t0 = time.time()
    only_check = "--check" in sys.argv
    patches = load_patches()
    shared = sorted(p.stem for p in TCM_APP.glob("*.html") if (MS_APP / p.name).exists())

    run = {"ts": time.strftime("%Y-%m-%dT%H:%M:%S"), "patches": [p["_file"] for p in patches],
           "shared": len(shared), "replayed": [], "warns": []}

    for name in shared:
        src = (TCM_APP / f"{name}.html").read_text(encoding="utf-8")
        dst_path = MS_APP / f"{name}.html"
        old = dst_path.read_text(encoding="utf-8")
        text, page_warns = src, []
        for patch in patches:
            if applies_to(patch, name):
                text = apply_patch(text, patch, name, page_warns)
        if page_warns:
            run["warns"].extend(page_warns)  # 转人工：该页不写入
            continue
        if text != old:
            if not only_check:
                tmp = dst_path.with_suffix(".html.tmp")
                tmp.write_text(text, encoding="utf-8")
                os.replace(tmp, dst_path)
            run["replayed"].append(name)

    # 冒烟：仅对本轮重放页
    if not only_check and run["replayed"]:
        ok = fail = 0
        for name in run["replayed"]:
            try:
                with urllib.request.urlopen(f"{STATIC_BASE}/{name}.html", timeout=10) as r:
                    body = r.read().decode("utf-8", "replace")
                good = r.status == 200 and "TCM-Agent" not in body and "tcm-agent/" not in body
                ok += good
                fail += (not good)
            except Exception as e:
                fail += 1
                run["warns"].append(f"{name}: 冒烟失败 {e}")
        run["smoke"] = {"ok": ok, "fail": fail}

    run["elapsed_s"] = round(time.time() - t0, 1)
    run["status"] = "warn" if run["warns"] else "ok"

    # 台账：按日落 DELIVERY（追加 run）
    DELIVERY.mkdir(exist_ok=True)
    ledger_path = DELIVERY / f"patch-replay-{time.strftime('%Y%m%d')}.json"
    try:
        ledger = json.loads(ledger_path.read_text(encoding="utf-8"))
    except Exception:
        ledger = {"ledger": "patch-replay", "runs": []}
    ledger["runs"].append(run)
    if not only_check:
        ledger_path.write_text(json.dumps(ledger, ensure_ascii=False, indent=2), encoding="utf-8")

    print(json.dumps({"status": run["status"], "shared": run["shared"],
                      "replayed": len(run["replayed"]), "replayed_pages": run["replayed"],
                      "warns": run["warns"],
                      "smoke": run.get("smoke")}, ensure_ascii=False))
    return 0 if run["status"] == "ok" else 2  # WARN 以 rc=2 暴露（看守链非零即告警）


if __name__ == "__main__":
    raise SystemExit(main())
