#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
medical-stack-page-follow.py — G16 后续：medical-stack 页面层重打包（ADR-007 链4 扩展）

背景：G1 看守只跟随 KB 数据层；页面层（medical-stack/app/*.html）停留在 08-27 内化快照，
tcm HEAD 已演进（含 R848 注入修复等安全改进）。本脚本执行「页面层重打包」：

  1. 取 tcm-agent/app/<page>.html（HEAD）
  2. 补丁重放（与 08-27 内化同规则）：
     a. canonical：sgmt-taojing.github.io/tcm-agent/ → sgmt-taojing.github.io/mingli-medical/
     b. 品牌：TCM-Agent → 命理宝鉴·医道；· 中医智能体 → · 命理宝鉴·医道（不动「中医标准智能体」
        以外的独立语义；页面内品牌位统一替换）
     c. seed-loader 注入：本侧现行版本含 js/seed-loader.js 的页面，在 ai-voice-assistant.js
        （或 global-search.js / nav.js / </body>）之后注入
  3. 校验：品牌词零残留；canonical 指向正确；ADR-009 消费者版话术扫描（发现即报告，不自动改）
  4. 原子写入（临时文件 + replace）
  5. 冒烟：8931 静态层逐页 GET 200 + 品牌标记抽查
  6. 状态落盘 medical-stack/page-follow-state.json

纪律：只做移植适配，不做二次训练；本脚本不碰 server/ 代码（SEC-001 在服务端）。
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
MS_APP = WS / "projects" / "mingli-baojian" / "medical-stack" / "app"
STATE = WS / "projects" / "mingli-baojian" / "medical-stack" / "page-follow-state.json"
STATIC_BASE = "http://127.0.0.1:8973"  # mingli 医道静态层（8931 被 tcm-agent 静态占用，勿混）

# 待重打包清单（tcm HEAD 新于本侧快照的页；G16-2 定性表第四节）
LAG_PAGES = ("acupuncture ai-diagnosis call-center chronic-care clinic-desk clinical "
             "digital-twin doctor-dashboard doctor-summary efficacy-analysis emergency emr "
             "finance flows followup health-archive home-tcm insurance-desk inventory "
             "med-tracker messages payment rbac recommend report-print rx-loop safety-check "
             "schedule server-monitor telemedicine therapy treatment-center wearable-monitor "
             "wellness").split()

SEED_LOADER = '<script src="js/seed-loader.js"></script>'
INJECT_ANCHORS = ['<script src="js/ai-voice-assistant.js"></script>',
                  '<script src="js/global-search.js"></script>',
                  '<script src="js/nav.js"></script>']

# ADR-009 消费者版话术（医院场景错位，出现即报告）
CONSUMER_PHRASES = ["本平台不能替代急救", "紧急情况请立即拨打 120 或前往最近急诊"]


def transform(name: str, text: str, had_seed_loader: bool) -> tuple[str, list[str]]:
    notes = []
    # a. canonical
    if "sgmt-taojing.github.io/tcm-agent/" in text:
        text = text.replace("sgmt-taojing.github.io/tcm-agent/",
                            "sgmt-taojing.github.io/mingli-medical/")
        notes.append("canonical")
    # b. 品牌
    if "TCM-Agent" in text:
        text = text.replace("TCM-Agent", "命理宝鉴·医道")
        notes.append("brand:TCM-Agent")
    if "中医智能体" in text:
        # 「中医标准智能体」是项目专名（出现在描述性文案），保留；其余品牌位替换
        text = text.replace("中医智能体", "命理宝鉴·医道")
        text = text.replace("命理宝鉴·医道 · 患者侧自助服务",
                            "中医标准智能体 · 患者侧自助服务")  # home-tcm 专名回退保护
        notes.append("brand:中医智能体")
    # c. seed-loader（保持本侧既有决策：原有才注入）
    if had_seed_loader and SEED_LOADER not in text:
        for anchor in INJECT_ANCHORS:
            if anchor in text:
                text = text.replace(anchor, anchor + "\n" + SEED_LOADER, 1)
                notes.append(f"seed-loader@{anchor.split('/')[1]}")
                break
        else:
            text = text.replace("</body>", SEED_LOADER + "\n</body>", 1)
            notes.append("seed-loader@</body>")
    return text, notes


def main() -> int:
    t0 = time.time()
    only_check = "--check" in sys.argv
    result = {"ts": time.strftime("%Y-%m-%dT%H:%M:%S"), "action": "page-follow",
              "pages": [], "warnings": []}

    # 自动侦察：tcm app 与本侧 app 的同名页全量比对，transform(src) != dst 即需重打包。
    # 幂等：无增量时秒退（只写心跳状态）。新增页（tcm 有、本侧无）不在此自动内化，
    # 仍由链5差集报告暴露，经定性后人工决策（G16-2 三分法）。
    shared = sorted(p.stem for p in TCM_APP.glob("*.html")
                    if (MS_APP / p.name).exists())
    result["shared_pages"] = len(shared)

    for name in shared:
        src = TCM_APP / f"{name}.html"
        dst = MS_APP / f"{name}.html"
        old = dst.read_text(encoding="utf-8")
        had_seed = SEED_LOADER in old
        text, notes = transform(name, src.read_text(encoding="utf-8"), had_seed)

        if text == old:
            continue  # 幂等：无增量

        # 校验
        problems = []
        for bad in ("TCM-Agent", "· 中医智能体"):
            if bad in text:
                problems.append(f"品牌残留:{bad}")
        for phrase in CONSUMER_PHRASES:
            if phrase in text:
                result["warnings"].append(f"{name}: ADR-009 消费者话术「{phrase}」")
        if problems:
            result["warnings"].append(f"{name}: {';'.join(problems)}")

        entry = {"page": name, "bytes": len(text.encode("utf-8")),
                 "patches": notes, "ok": not problems}
        if not only_check and not problems:
            tmp = dst.with_suffix(".html.tmp")
            tmp.write_text(text, encoding="utf-8")
            os.replace(tmp, dst)
            entry["written"] = True
        result["pages"].append(entry)

    # 冒烟：静态层逐页 GET
    if not only_check:
        smoke_ok = smoke_fail = 0
        for p in result["pages"]:
            if not p.get("written"):
                continue
            try:
                with urllib.request.urlopen(
                        f"{STATIC_BASE}/{p['page']}.html", timeout=10) as r:
                    body = r.read().decode("utf-8", "replace")
                good = r.status == 200 and "TCM-Agent" not in body and "tcm-agent/" not in body  # 负向判据：无 tcm 品牌/canonical 残留（覆盖无 canonical 页如 mobile-interact/insurance-desk）
                smoke_ok += good
                smoke_fail += (not good)
            except Exception as e:
                smoke_fail += 1
                result["warnings"].append(f"{p['page']}: 冒烟失败 {e}")
        result["smoke"] = {"ok": smoke_ok, "fail": smoke_fail}

    result["elapsed_s"] = round(time.time() - t0, 1)
    result["status"] = "ok" if not result["warnings"] else "ok_with_warnings"
    STATE.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"status": result["status"],
                      "shared": result["shared_pages"],
                      "changed": len(result["pages"]),
                      "written": sum(1 for p in result["pages"] if p.get("written")),
                      "smoke": result.get("smoke"),
                      "warnings": result["warnings"]}, ensure_ascii=False, indent=1))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
