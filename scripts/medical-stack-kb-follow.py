#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
medical-stack-kb-follow.py — G1: medical-stack 内化快照自动跟随主镜像（ADR-007 链4）

触发方式：由 tcm-import-and-follow.sh 包装器在 15min 轮询 import-tcm-kb.py 之后调用，
也可独立运行（自身做 mtime 幂等判断）。

逻辑（复用 deploy-medical-stack.py 的「镜像解包内化」）：
  1. 主镜像 mtime <= 快照 mtime → 秒退（幂等）
  2. 解包镜像信封 {version, modules, data} → 裸模块映射，原子写入 medical-stack kb-store
  3. 验证写入条目数与镜像 total_entries 一致
  4. SEC-001 守卫核查：KB 刷新不触碰代码，但必须确认补丁标记仍在（防意外）
  5. 主动重建 SQLite 快路径索引（kb-sqlite-sync.js），避免首个请求走 126MB JSON 慢路径
  6. 热加载验证：8972 loadKbCache 按 mtime 自动失效，调 /api/tcm/kb 暖缓存并核对总数
  7. 状态落盘 medical-stack/kb-follow-state.json（watchdog 链4 读快照 mtime，此处附验证证据）

纪律：采集自 tcm 的医学能力只适配不再训练；本脚本只做数据搬运，不改任何代码。
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

WS = Path.home() / ".openclaw-autoclaw" / "workspace"
MINGLI = WS / "projects" / "mingli-baojian"
MIRROR = MINGLI / "server" / "kb-store" / "tcm-authoritative-full.json"
MS = MINGLI / "medical-stack"
SNAPSHOT = MS / "server" / "kb-store" / "tcm-synced-kb.json"
API_JS = MS / "server" / "api-server.js"
SQLITE_SYNC = MS / "scripts" / "kb-sqlite-sync.js"
STATE = MS / "kb-follow-state.json"
HEALTH_URL = "http://127.0.0.1:8972/api/tcm/health"
KB_URL = "http://127.0.0.1:8972/api/tcm/kb"

EXPECT_CAPS = ["tongue", "face", "hand", "inquiry", "syndrome", "formula", "acupoint"]


def http_json(url: str, timeout: int = 60) -> dict:
    with urllib.request.urlopen(url, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8"))


def main() -> int:
    t0 = time.time()
    result = {"ts": time.strftime("%Y-%m-%dT%H:%M:%S"), "action": "kb-follow"}

    if not MIRROR.exists():
        result.update(status="error", reason=f"主镜像不存在: {MIRROR}")
        print(json.dumps(result, ensure_ascii=False))
        return 1

    mirror_mt = MIRROR.stat().st_mtime
    snap_mt = SNAPSHOT.stat().st_mtime if SNAPSHOT.exists() else 0
    result["mirror_mtime"] = mirror_mt
    result["snapshot_mtime_before"] = snap_mt

    # 1. 幂等：快照已不旧于镜像 → 秒退
    if snap_mt >= mirror_mt:
        result.update(status="skipped", reason="snapshot up-to-date",
                      lag_min=0.0)
        print(json.dumps(result, ensure_ascii=False))
        return 0

    lag_min = round((mirror_mt - snap_mt) / 60, 1)
    result["lag_min_before"] = lag_min

    # 2. 解包内化（与 deploy-medical-stack.py L96-106 同逻辑：信封 → 裸模块映射）
    with open(MIRROR, encoding="utf-8") as f:
        env = json.load(f)
    data = env.get("data", env)
    if not isinstance(data, dict):
        result.update(status="error", reason="镜像结构异常：data 非模块映射")
        print(json.dumps(result, ensure_ascii=False))
        return 1
    total = env.get("total_entries") or sum(len(v) for v in data.values() if isinstance(v, list))

    tmp = SNAPSHOT.with_suffix(".json.tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)
    os.replace(tmp, SNAPSHOT)  # 原子替换，8972 读不到半截文件

    # 3. 回读验证条目数
    with open(SNAPSHOT, encoding="utf-8") as f:
        written = json.load(f)
    written_total = sum(len(v) for v in written.values() if isinstance(v, list))
    result["entries"] = written_total
    if written_total != total:
        result.update(status="error", reason=f"条目数不一致: 写入 {written_total} != 镜像 {total}")
        print(json.dumps(result, ensure_ascii=False))
        return 1

    # 4. SEC-001 守卫核查（KB 刷新不动代码；标记缺失说明代码层被意外替换，须告警）
    try:
        api_src = open(API_JS, encoding="utf-8").read()
        sec001_ok = "SEC-001" in api_src
    except OSError:
        sec001_ok = False
    result["sec001_intact"] = sec001_ok
    if not sec001_ok:
        result.update(status="warn", reason="SEC-001 补丁标记缺失——代码层可能被意外覆盖，需人工核查")

    # 5. 主动重建 SQLite 快路径索引（异步，不阻塞）
    # launchd 环境 PATH 极简，裸 "node" 找不到——先 which，再回退 Kimi 运行时绝对路径
    if SQLITE_SYNC.exists():
        import shutil
        node_bin = shutil.which("node") or "/Applications/Kimi.app/Contents/Resources/resources/runtime/node"
        if not Path(node_bin).exists():
            result["sqlite_sync"] = "spawn failed: node 不可用（PATH 与回退路径均未命中）"
        else:
            try:
                subprocess.Popen(
                    [node_bin, str(SQLITE_SYNC)],
                    cwd=str(MS), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                    start_new_session=True,
                )
                result["sqlite_sync"] = "spawned"
            except Exception as e:  # noqa: BLE001
                result["sqlite_sync"] = f"spawn failed: {e}"
    else:
        result["sqlite_sync"] = "script missing (将走 JSON 慢路径并自愈)"

    # 6. 热加载验证：8972 mtime 失效机制会在下次请求自动重载；先暖缓存再核对
    # 注意：/api/tcm/kb 的 total 是 R756 命理黑名单过滤后的检索索引条数（约少 0.4%），
    # 判定阈值用 ≥95% 而非全等，过滤差额 = 守卫正在工作的证据
    warm_ok, warm_detail = False, ""
    for attempt in (0, 1, 2):  # 最多等 3 次：SQLite 重建可能抢跑
        try:
            if attempt:
                time.sleep(10 * attempt)
            kb = http_json(KB_URL, timeout=90)
            kb_total = (kb.get("total") or kb.get("data", {}).get("total")
                        or (kb.get("stats") or {}).get("total"))
            mods = kb.get("modules") or (kb.get("data", {}) or {}).get("modules")
            n_mods = len(mods) if isinstance(mods, (list, dict)) else None
            filtered = (written_total - kb_total) if isinstance(kb_total, int) else None
            warm_detail = f"total={kb_total} modules={n_mods} r756_filtered={filtered}"
            if isinstance(kb_total, int) and kb_total >= int(written_total * 0.95):
                warm_ok = True
                break
        except Exception as e:  # noqa: BLE001
            warm_detail = f"attempt{attempt}: {e}"
    result["warm_check"] = warm_detail

    # 7. 七能力健康验证
    try:
        health = http_json(HEALTH_URL, timeout=15)
        caps = health.get("capabilities") or []
        result["capabilities"] = caps
        result["caps_ok"] = all(c in caps for c in EXPECT_CAPS)
    except Exception as e:  # noqa: BLE001
        result["caps_ok"] = False
        result["caps_error"] = str(e)

    result["elapsed_sec"] = round(time.time() - t0, 1)
    if "status" not in result:
        result["status"] = "ok" if (warm_ok and result.get("caps_ok")) else "warn"

    # 8. 状态落盘（含验证证据，供 KANBAN/审计引用）
    state = {}
    try:
        state = json.loads(STATE.read_text(encoding="utf-8"))
    except Exception:
        pass
    state.update({"last_run": result["ts"], "last_result": result,
                  "snapshot_mtime": SNAPSHOT.stat().st_mtime})
    STATE.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")

    print(json.dumps(result, ensure_ascii=False))
    return 0 if result["status"] != "error" else 1


if __name__ == "__main__":
    sys.exit(main())
