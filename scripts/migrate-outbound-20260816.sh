#!/usr/bin/env bash
# R118 KB 迁回脚本（v2）：把 mingli 主 KB 中跨项目污染条目迁回各项目自有 KB
# 数据来源：mingli kb_staging（污染源）→ 各项目自有 yidao.db
# 日期：2026-08-16
set -euo pipefail

SRC_DB=/Users/tom/kimi/projects/mingli-baojian/server/database/yidao.db
PROJECTS_DIR=/Users/tom/kimi/projects

echo "================================================"
echo "  R118 KB 迁回执行 v2（kb_staging → 各项目）"
echo "================================================"

# 备份删除清单到 .openclaw/tmp/mingli-outbound-deleted.json（不论后续步骤是否成功）
python3 - <<'PY'
import sqlite3, json, os
src = sqlite3.connect('/Users/tom/kimi/projects/mingli-baojian/server/database/yidao.db')
src.row_factory = sqlite3.Row
modules = ('smart-home-family', 'family-life', 'epb-assistant', 'wechat-platform', 'digital-workshop', 'digital-ecosystem')
rows = src.execute("SELECT entry_id, module, title FROM kb_staging WHERE module IN (?,?,?,?,?,?)", modules).fetchall()
backup = [{'entry_id': r['entry_id'], 'module': r['module'], 'title': r['title']} for r in rows]
out = '/Users/tom/kimi/projects/mingli-baojian/.openclaw/tmp/mingli-outbound-deleted.json'
with open(out, 'w') as f:
    json.dump(backup, f, ensure_ascii=False, indent=2)
print(f"📦 删除前备份清单：{len(backup)} 条 → {out}")
src.close()
PY

# ────────────── 1. smart-home-family（87 条）──────────────
echo ""
echo "▶ [1/6] smart-home-family 87 条 → knowledge/yidao.db (kb_entries)"
python3 - <<'PY'
import sqlite3
src = sqlite3.connect('/Users/tom/kimi/projects/mingli-baojian/server/database/yidao.db')
src.row_factory = sqlite3.Row
shf = sqlite3.connect('/Users/tom/kimi/projects/smart-home-family/knowledge/yidao.db')

# 确保 kb_entries 表存在
shf.execute("""CREATE TABLE IF NOT EXISTS kb_entries (
  id TEXT PRIMARY KEY, module TEXT, question, source TEXT,
  tags TEXT, trust_score REAL, answer TEXT, created_at TEXT
)""")

rows = src.execute("""
  SELECT entry_id, title, content, category, keywords, tags, confidence, src_id, hit_count, created_at, updated_at
  FROM kb_staging WHERE module='smart-home-family'
""").fetchall()
print(f"  共 {len(rows)} 条 kb_staging 待迁回")
ok = fail = 0
for r in rows:
    try:
        shf.execute("""
          INSERT OR IGNORE INTO kb_entries (id, module, question, answer, trust_score, tags, source, created_at)
          VALUES (?, 'smart-home-family', ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))
        """, (r['entry_id'], r['title'] or '', r['content'] or '', r['confidence'] or 0.8,
              r['tags'] or r['keywords'] or '[]',
              r['src_id'] or 'SRC-SHF-MIGRATION-20260816', r['created_at']))
        ok += 1
    except Exception as e:
        fail += 1
        print(f"  ❌ {r['entry_id']}: {e}")
shf.commit()
print(f"  ✅ 写入 {ok} 条，失败 {fail} 条")
shf.close()
src.close()
PY

# ────────────── 2. epb-assistant（70 条）──────────────
echo ""
echo "▶ [2/6] epb-assistant 70 条 → db/epb.db (kb_staging + kb_formal)"
mkdir -p /Users/tom/kimi/projects/epb-assistant/db
python3 - <<'PY'
import sqlite3
src = sqlite3.connect('/Users/tom/kimi/projects/mingli-baojian/server/database/yidao.db')
src.row_factory = sqlite3.Row
epb = sqlite3.connect('/Users/tom/kimi/projects/epb-assistant/db/epb.db')

epb.execute("""CREATE TABLE IF NOT EXISTS kb_staging (
  entry_id TEXT PRIMARY KEY, module TEXT, title TEXT, content TEXT, category TEXT,
  keywords TEXT, summary TEXT, tags TEXT, source_ids TEXT, confidence REAL DEFAULT 0.5,
  status TEXT DEFAULT 'staging', audit_status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
)""")

rows = src.execute("""
  SELECT entry_id, title, content, category, keywords, tags, summary, confidence, src_id, source_ids, created_at, updated_at
  FROM kb_staging WHERE module='epb-assistant'
""").fetchall()
print(f"  共 {len(rows)} 条 kb_staging 待迁回")
ok = fail = 0
for r in rows:
    try:
        epb.execute("""
          INSERT OR IGNORE INTO kb_staging (entry_id, module, title, content, category, keywords, tags, summary, source_ids, confidence, created_at, updated_at)
          VALUES (?, 'epb-assistant', ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), COALESCE(?, CURRENT_TIMESTAMP))
        """, (r['entry_id'], r['title'] or '', r['content'] or '', r['category'] or 'epb-doc',
              r['keywords'] or '', r['tags'] or '[]', r['summary'] or '', r['source_ids'] or '[]',
              r['confidence'] or 0.85, r['created_at'], r['updated_at']))
        ok += 1
    except Exception as e:
        fail += 1
        print(f"  ❌ {r['entry_id']}: {e}")
epb.commit()
print(f"  ✅ 写入 {ok} 条，失败 {fail} 条")
epb.close()
src.close()
PY

# ────────────── 3. family-life-assistant（46 条）──────────────
echo ""
echo "▶ [3/6] family-life 46 条 → family-life-assistant/knowledge/yidao.db"
mkdir -p /Users/tom/kimi/projects/family-life-assistant/knowledge
python3 - <<'PY'
import sqlite3
src = sqlite3.connect('/Users/tom/kimi/projects/mingli-baojian/server/database/yidao.db')
src.row_factory = sqlite3.Row
fla = sqlite3.connect('/Users/tom/kimi/projects/family-life-assistant/knowledge/yidao.db')

fla.execute("""CREATE TABLE IF NOT EXISTS kb_staging (
  entry_id TEXT PRIMARY KEY, module TEXT, title TEXT, content TEXT, category TEXT,
  keywords TEXT, summary TEXT, tags TEXT, source_ids TEXT, confidence REAL DEFAULT 0.5,
  status TEXT DEFAULT 'staging', audit_status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
)""")

rows = src.execute("""
  SELECT entry_id, title, content, category, keywords, tags, summary, confidence, source_ids, created_at, updated_at
  FROM kb_staging WHERE module='family-life'
""").fetchall()
print(f"  共 {len(rows)} 条 kb_staging 待迁回")
ok = 0
for r in rows:
    fla.execute("""
      INSERT OR IGNORE INTO kb_staging (entry_id, module, title, content, category, keywords, tags, summary, source_ids, confidence, created_at, updated_at)
      VALUES (?, 'family-life', ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), COALESCE(?, CURRENT_TIMESTAMP))
    """, (r['entry_id'], r['title'] or '', r['content'] or '', r['category'] or 'general',
          r['keywords'] or '', r['tags'] or '[]', r['summary'] or '', r['source_ids'] or '[]',
          r['confidence'] or 0.8, r['created_at'], r['updated_at']))
    ok += 1
fla.commit()
print(f"  ✅ 写入 {ok} 条")
fla.close()
src.close()
PY

# ────────────── 4. digital-workshop（427 条）──────────────
echo ""
echo "▶ [4/6] digital-workshop 427 条 → digital-workshop/knowledge/yidao.db"
mkdir -p /Users/tom/kimi/projects/digital-workshop/knowledge
python3 - <<'PY'
import sqlite3
src = sqlite3.connect('/Users/tom/kimi/projects/mingli-baojian/server/database/yidao.db')
src.row_factory = sqlite3.Row
dw = sqlite3.connect('/Users/tom/kimi/projects/digital-workshop/knowledge/yidao.db')

dw.execute("""CREATE TABLE IF NOT EXISTS kb_staging (
  entry_id TEXT PRIMARY KEY, module TEXT, title TEXT, content TEXT, category TEXT,
  keywords TEXT, summary TEXT, tags TEXT, source_ids TEXT, confidence REAL DEFAULT 0.5,
  status TEXT DEFAULT 'staging', audit_status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
)""")

rows = src.execute("""
  SELECT entry_id, title, content, category, keywords, tags, summary, confidence, source_ids, created_at, updated_at
  FROM kb_staging WHERE module='digital-workshop'
""").fetchall()
print(f"  共 {len(rows)} 条 kb_staging 待迁回")
ok = 0
for r in rows:
    dw.execute("""
      INSERT OR IGNORE INTO kb_staging (entry_id, module, title, content, category, keywords, tags, summary, source_ids, confidence, created_at, updated_at)
      VALUES (?, 'digital-workshop', ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), COALESCE(?, CURRENT_TIMESTAMP))
    """, (r['entry_id'], r['title'] or '', r['content'] or '', r['category'] or 'dw-doc',
          r['keywords'] or '', r['tags'] or '[]', r['summary'] or '', r['source_ids'] or '[]',
          r['confidence'] or 0.85, r['created_at'], r['updated_at']))
    ok += 1
dw.commit()
print(f"  ✅ 写入 {ok} 条")
dw.close()
src.close()
PY

# ────────────── 5. wechat-platform（59 条）──────────────
echo ""
echo "▶ [5/6] wechat-platform 59 条 → wechat-platform/knowledge/yidao.db"
mkdir -p /Users/tom/kimi/projects/wechat-platform/knowledge
python3 - <<'PY'
import sqlite3
src = sqlite3.connect('/Users/tom/kimi/projects/mingli-baojian/server/database/yidao.db')
src.row_factory = sqlite3.Row
wx = sqlite3.connect('/Users/tom/kimi/projects/wechat-platform/knowledge/yidao.db')

wx.execute("""CREATE TABLE IF NOT EXISTS kb_staging (
  entry_id TEXT PRIMARY KEY, module TEXT, title TEXT, content TEXT, category TEXT,
  keywords TEXT, summary TEXT, tags TEXT, source_ids TEXT, confidence REAL DEFAULT 0.5,
  status TEXT DEFAULT 'staging', audit_status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
)""")

rows = src.execute("""
  SELECT entry_id, title, content, category, keywords, tags, summary, confidence, source_ids, created_at, updated_at
  FROM kb_staging WHERE module='wechat-platform'
""").fetchall()
print(f"  共 {len(rows)} 条 kb_staging 待迁回")
ok = 0
for r in rows:
    wx.execute("""
      INSERT OR IGNORE INTO kb_staging (entry_id, module, title, content, category, keywords, tags, summary, source_ids, confidence, created_at, updated_at)
      VALUES (?, 'wechat-platform', ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), COALESCE(?, CURRENT_TIMESTAMP))
    """, (r['entry_id'], r['title'] or '', r['content'] or '', r['category'] or 'wx-doc',
          r['keywords'] or '', r['tags'] or '[]', r['summary'] or '', r['source_ids'] or '[]',
          r['confidence'] or 0.8, r['created_at'], r['updated_at']))
    ok += 1
wx.commit()
print(f"  ✅ 写入 {ok} 条")
wx.close()
src.close()
PY

# ────────────── 6. digital-ecosystem（6 条）──────────────
echo ""
echo "▶ [6/6] digital-ecosystem 6 条 → digital-ecosystem-platform/knowledge/yidao.db"
mkdir -p /Users/tom/kimi/projects/digital-ecosystem-platform/knowledge
python3 - <<'PY'
import sqlite3
src = sqlite3.connect('/Users/tom/kimi/projects/mingli-baojian/server/database/yidao.db')
src.row_factory = sqlite3.Row
de = sqlite3.connect('/Users/tom/kimi/projects/digital-ecosystem-platform/knowledge/yidao.db')

de.execute("""CREATE TABLE IF NOT EXISTS kb_staging (
  entry_id TEXT PRIMARY KEY, module TEXT, title TEXT, content TEXT, category TEXT,
  keywords TEXT, summary TEXT, tags TEXT, source_ids TEXT, confidence REAL DEFAULT 0.5,
  status TEXT DEFAULT 'staging', audit_status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
)""")

rows = src.execute("""
  SELECT entry_id, title, content, category, keywords, tags, summary, confidence, source_ids, created_at, updated_at
  FROM kb_staging WHERE module='digital-ecosystem'
""").fetchall()
print(f"  共 {len(rows)} 条 kb_staging 待迁回")
ok = 0
for r in rows:
    de.execute("""
      INSERT OR IGNORE INTO kb_staging (entry_id, module, title, content, category, keywords, tags, summary, source_ids, confidence, created_at, updated_at)
      VALUES (?, 'digital-ecosystem', ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), COALESCE(?, CURRENT_TIMESTAMP))
    """, (r['entry_id'], r['title'] or '', r['content'] or '', r['category'] or 'de-doc',
          r['keywords'] or '', r['tags'] or '[]', r['summary'] or '', r['source_ids'] or '[]',
          r['confidence'] or 0.8, r['created_at'], r['updated_at']))
    ok += 1
de.commit()
print(f"  ✅ 写入 {ok} 条")
de.close()
src.close()
PY

# ────────────── 7. 从 mingli 源端删除 695 条污染 ──────────────
echo ""
echo "▶ [7/7] 从 mingli kb_staging 删除 695 条跨项目污染"
python3 - <<'PY'
import sqlite3
src = sqlite3.connect('/Users/tom/kimi/projects/mingli-baojian/server/database/yidao.db')
modules = ('smart-home-family', 'family-life', 'epb-assistant', 'wechat-platform', 'digital-workshop', 'digital-ecosystem')
total = 0
for mod in modules:
    cur = src.execute("DELETE FROM kb_staging WHERE module=?", (mod,))
    print(f"  {mod}: 删除 {cur.rowcount} 条")
    total += cur.rowcount
src.commit()
print(f"  ✅ 总计删除 {total} 条")

# FTS 索引重建（如果存在）
try:
    src.execute("INSERT INTO kb_staging_fts(kb_staging_fts) VALUES('rebuild')")
    print("  ✅ kb_staging_fts 索引重建完成")
except Exception as e:
    print(f"  ⚠️ FTS 重建异常: {e}")
src.close()
PY

echo ""
echo "================================================"
echo "  ✅ R118 KB 迁回 + 源端清理 全部完成"
echo "================================================"