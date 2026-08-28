#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
kb-stock-optimize.py — KB 存量优化专项（2026-08-28 · 看板观察项收口）
四项安全优化（全部可逆，先备份受影响行到 DELIVERY/kb-stock-backup-<ts>.json）：
  1. 注水桶清理：剔除万能废话尾缀「此知识点在传统命理/中医体系中有重要意义…」
  2. 纯元数据条目降权：content 以「来源：」开头且 <60 字（无知识正文）→ trust 0.2 + tags 标 meta-only
  3. r39 模板三模块降权：双核/健康/事业组合卡（模板批量生成，行动建议敷衍）→ trust 0.45
  4. tcm-formula 功效补齐：从库内其他模块交叉引用同方功效描述（有源可依才补）
用法：python3 scripts/kb-stock-optimize.py [--dry-run]
"""
import json, re, sqlite3, sys, time
from pathlib import Path

PROJ = Path(__file__).resolve().parent.parent
DB = PROJ / "server" / "database" / "yidao.db"
BACKUP = PROJ / "DELIVERY" / f"kb-stock-backup-{time.strftime('%Y%m%d-%H%M%S')}.json"

WATERMARK = "此知识点在传统命理/中医体系中有重要意义，需结合实际应用场景和个体差异综合分析，不可孤立理解。"
R39_MODS = ["r39_dual_core", "r39_health_core", "r39_career_core"]

dry = "--dry-run" in sys.argv
db = sqlite3.connect(str(DB), timeout=60)
db.execute("PRAGMA busy_timeout=60000")
c = db.cursor()
backup = {"ts": time.strftime("%Y-%m-%dT%H:%M:%S"), "ops": {}}
stats = {}

def backup_rows(where, params, tag):
    rows = c.execute(f"SELECT rowid, entry_id, module, title, content, trust_score, tags FROM kb_formal WHERE {where}", params).fetchall()
    backup["ops"][tag] = [
        {"rowid": r[0], "entry_id": r[1], "module": r[2], "title": r[3],
         "content": r[4], "trust_score": r[5], "tags": r[6]} for r in rows]
    return rows

# ═══ 1. 注水桶清理 ═══
rows = backup_rows("content LIKE ?", ("%" + WATERMARK + "%",), "watermark")
n = 0
for rowid, eid, mod, title, ct, trust, tags in [(r['rowid'], r['entry_id'], r['module'], r['title'], r['content'], r['trust_score'], r['tags']) for r in backup["ops"]["watermark"]]:
    cleaned = ct.replace(WATERMARK, "").strip()
    # 连同常见的附着空白/换行
    cleaned = re.sub(r"\s{2,}", " ", cleaned).strip()
    if cleaned != ct:
        if not dry:
            c.execute("UPDATE kb_formal SET content=?, updated_at=? WHERE rowid=?",
                      (cleaned, time.strftime("%Y-%m-%dT%H:%M:%S"), rowid))
            c.execute("UPDATE kb_fts5 SET content=? WHERE entry_id=?", (cleaned, eid))
        n += 1
stats["watermark_cleaned"] = n

# ═══ 2. 纯元数据条目降权 ═══
rows = backup_rows("content LIKE '来源：%' AND LENGTH(content) < 60 AND (tags IS NULL OR tags NOT LIKE '%meta-only%')", (), "meta_only")
n = 0
for r in backup["ops"]["meta_only"]:
    if not dry:
        tags = (r["tags"] or "")
        tags = (tags + ",meta-only").strip(",")
        c.execute("UPDATE kb_formal SET trust_score=0.2, tags=?, updated_at=? WHERE rowid=?",
                  (tags, time.strftime("%Y-%m-%dT%H:%M:%S"), r["rowid"]))
    n += 1
stats["meta_only_downgraded"] = n

# ═══ 3. r39 模板三模块降权 ═══
ph = ",".join("?" * len(R39_MODS))
rows = backup_rows(f"module IN ({ph}) AND trust_score > 0.45", R39_MODS, "r39_template")
n = 0
for r in backup["ops"]["r39_template"]:
    if not dry:
        c.execute("UPDATE kb_formal SET trust_score=0.45, audit_notes=?, updated_at=? WHERE rowid=?",
                  ("2026-08-28 存量优化：模板批量生成内容，降权防检索稀释", time.strftime("%Y-%m-%dT%H:%M:%S"), r["rowid"]))
    n += 1
stats["r39_downgraded"] = n

# ═══ 4. tcm-formula 功效补齐（交叉引用） ═══
lacking = c.execute("""SELECT rowid, entry_id, title, content FROM kb_formal
    WHERE module='tcm-formula' AND LENGTH(content) < 150 AND content NOT LIKE '%功效%'""").fetchall()
backup["ops"]["formula_efficacy"] = [
    {"rowid": r[0], "entry_id": r[1], "title": r[2], "content": r[3]} for r in lacking]
n = 0
for r in backup["ops"]["formula_efficacy"]:
    name = re.sub(r"[^\u4e00-\u9fff]", "", r["title"])[:10]
    if len(name) < 2:
        continue
    src_rows = c.execute("""SELECT content FROM kb_formal WHERE module != 'tcm-formula'
        AND content LIKE ? AND content LIKE '%功效%' LIMIT 3""", ("%" + name + "%",)).fetchall()
    eff = None
    for (sct,) in src_rows:
        m = re.search(r"功效[：:]([^。；\n]{2,40})", sct)
        if m:
            eff = m.group(1).strip()
            break
    if eff:
        new_ct = r["content"].rstrip() + f"\n功效：{eff}（交叉引自库内同方论述）"
        if not dry:
            c.execute("UPDATE kb_formal SET content=?, updated_at=? WHERE rowid=?",
                      (new_ct, time.strftime("%Y-%m-%dT%H:%M:%S"), r["rowid"]))
            c.execute("UPDATE kb_fts5 SET content=? WHERE entry_id=?", (new_ct, r["entry_id"]))
        n += 1
stats["formula_efficacy_filled"] = n

if not dry:
    db.commit()
db.close()

BACKUP.parent.mkdir(exist_ok=True)
BACKUP.write_text(json.dumps(backup, ensure_ascii=False), encoding="utf-8")
print(json.dumps({"dry_run": dry, "stats": stats, "backup": str(BACKUP)}, ensure_ascii=False, indent=2))
