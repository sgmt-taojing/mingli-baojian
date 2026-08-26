#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
import-tcm-kb.py — 命理宝鉴入库器：中医标准全量/增量医学知识 → 自有知识库（R747，2026-08-26）

架构定位：
  tcm-agent 是医学知识唯一源头；本脚本把同步文件（tcm-authoritative-full.json 全量镜像）
  增量入库到 mingli 自有 yidao.db 的 kb_formal，形成 mingli 的自有医学能力，按命理宝鉴
  项目定位对外服务。命理宝鉴不再向任何项目出口医学知识（出站已改纯命理，断回流环路）。

幂等/增量：
  - 状态文件记录镜像 mtime；未变化秒退（支撑 15 分钟轮询准实时）
  - 指纹去重：md5(去空白 content)，与 build-mingli-fp-index.py 同口径
  - 已入库条目标记 fingerprint='TCMFWD|<md5>'、authority='tcm-agent'、tags='tcm-forward'

用法：python3 scripts/import-tcm-kb.py [--force] [--dry-run]
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sqlite3
import sys
import time
from pathlib import Path

PROJ = Path(__file__).resolve().parent.parent
MIRROR = PROJ / "server" / "kb-store" / "tcm-authoritative-full.json"
DB = PROJ / "server" / "database" / "yidao.db"
STATE = PROJ / "server" / "kb-store" / ".tcm-import-state.json"
REPORT = PROJ / "server" / "kb-store" / "tcm-import-report.json"

FP_PREFIX = "TCMFWD|"


def fp(text: str) -> str:
    """与 build-mingli-fp-index.py 同口径：content 去全部空白后取 MD5"""
    return hashlib.md5(re.sub(r"\s+", "", str(text or "")).encode()).hexdigest()


def to_float(v, default=0.8) -> float:
    try:
        return float(v)
    except (TypeError, ValueError):
        return default


def load_state() -> dict:
    try:
        return json.loads(STATE.read_text(encoding="utf-8"))
    except Exception:
        return {}


def save_json(path: Path, data: dict) -> None:
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(path)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    if not MIRROR.exists():
        print(f"⚠ 镜像不存在: {MIRROR}", file=sys.stderr)
        return 1

    mt = MIRROR.stat().st_mtime
    state = load_state()
    if not args.force and state.get("mirror_mtime") == mt:
        print(json.dumps({"status": "skipped", "reason": "mirror unchanged"}))
        return 0

    t0 = time.time()
    with open(MIRROR, encoding="utf-8") as f:
        mirror = json.load(f)
    data = mirror.get("data") if isinstance(mirror, dict) else None
    if not isinstance(data, dict):
        print("⚠ 镜像结构异常", file=sys.stderr)
        return 1

    conn = sqlite3.connect(str(DB), timeout=30)
    conn.execute("PRAGMA busy_timeout=30000")
    cur = conn.cursor()

    # 全库指纹集（已有指纹列优先，缺失的现算 content 指纹）
    existing_fps = set()
    for r in cur.execute("SELECT content, fingerprint FROM kb_formal"):
        fpr = r[1] or ""
        if fpr.startswith(FP_PREFIX):
            existing_fps.add(fpr[len(FP_PREFIX):])
        elif fpr:
            # 旧格式 'R111|<md5>' 等，取尾段
            existing_fps.add(fpr.split("|")[-1])
        if r[0]:
            existing_fps.add(fp(r[0]))

    # entry_id 序列：KB-tcmfwd-NNNNN 续号
    row = cur.execute(
        "SELECT MAX(CAST(SUBSTR(entry_id, 11) AS INTEGER)) FROM kb_formal WHERE entry_id LIKE 'KB-tcmfwd-%'"
    ).fetchone()
    seq = (row[0] or 0) + 1

    now = time.strftime("%Y-%m-%dT%H:%M:%S")
    inserted, dup, skipped = 0, 0, 0
    per_module = {}
    batch = []
    for mod, items in data.items():
        if not isinstance(items, list):
            continue
        for e in items:
            if not isinstance(e, dict):
                continue
            title = str(e.get("title") or "").strip()
            content = str(e.get("content") or "").strip()
            if not title or len(content) < 30:
                skipped += 1
                continue
            f = fp(content)
            if f in existing_fps:
                dup += 1
                continue
            existing_fps.add(f)
            kw = e.get("keywords")
            kw_str = json.dumps(kw, ensure_ascii=False) if isinstance(kw, list) else str(kw or "")
            trust = to_float(e.get("confidence") or e.get("trust"), 0.8)
            batch.append((
                f"KB-tcmfwd-{seq:05d}", str(e.get("module") or mod), title, content,
                str(e.get("src_id") or ""), str(e.get("category") or ""), kw_str, "",
                trust,
                "v1", now, "tcm-agent-forward", "import-tcm-kb.py",
                0, None, "tcm-forward", None,
                trust,
                "internal", None, "formal", now, now,
                "auto", "import-tcm-kb.py", now, "R747 中医标准全量/增量同步入库",
                None, FP_PREFIX + f, "tcm-agent",
            ))
            per_module[mod] = per_module.get(mod, 0) + 1
            seq += 1
            inserted += 1

    if batch and not args.dry_run:
        cur.executemany(
            """INSERT INTO kb_formal
               (entry_id, module, title, content, src_id, category, keywords, summary,
                trust_score, version, promoted_at, promoted_from, reviewed_by,
                hit_count, last_hit, tags, source_ids, confidence, access_level,
                difficulty, status, created_at, updated_at,
                audit_status, audit_by, audit_at, audit_notes, model_id, fingerprint, authority)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            batch,
        )
        conn.commit()
    conn.close()

    report = {
        "ts": now,
        "mirror_mtime": mt,
        "mirror_total": mirror.get("total_entries"),
        "inserted": 0 if args.dry_run else inserted,
        "would_insert": inserted if args.dry_run else None,
        "duplicates": dup,
        "skipped_short": skipped,
        "per_module": dict(sorted(per_module.items(), key=lambda x: -x[1])),
        "elapsed_sec": round(time.time() - t0, 1),
        "dry_run": bool(args.dry_run),
    }
    state.update({"mirror_mtime": mt, "last_run": now,
                  "imported_total": (state.get("imported_total", 0) + (0 if args.dry_run else inserted))})
    if not args.dry_run:
        save_json(STATE, state)
    save_json(REPORT, report)
    print(json.dumps(report, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
