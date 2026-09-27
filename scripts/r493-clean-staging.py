#!/usr/bin/env python3

# ═══ LEGACY-INGEST-GUARD (R-INGEST-SPEC-20260927) ═══
# 本脚本为一次性历史批次脚本，入库口径已过时（无 fingerprint幂等/status='formal'/domain 新规范）。
# 新入库请使用 scripts/lib/kb_ingest.py；抓取请用改造后的 fetch-classics-kanripo.py / fetch-classics-wikisource.py。
# 确需原样重跑（极少数修复场景）：ALLOW_LEGACY_INGEST=1 python3 <本脚本>
import os as _lg_os, sys as _lg_sys
if _lg_os.environ.get('ALLOW_LEGACY_INGEST') != '1':
    _lg_sys.stderr.write('⛔ 旧口径入库脚本已禁用（R-INGEST-SPEC-20260927 防 KB 污染）。新口径见 scripts/lib/kb_ingest.py；确需重跑请设 ALLOW_LEGACY_INGEST=1\n')
    _lg_sys.exit(2)
# ═══ END GUARD ═══

"""R493 清理 kb_staging 无效条目 + 有效条目升 formal"""
import sqlite3, json, hashlib, time
DB = "server/database/yidao.db"

con = sqlite3.connect(DB)
cur = con.cursor()

# === 1. 空壳（0 bytes）===
cur.execute("SELECT entry_id, module, length(content) FROM kb_staging WHERE length(content) = 0 AND status IN ('pending','staging')")
empty = cur.fetchall()
print(f"[1] 空壳条目: {len(empty)}")
for eid, mod, _ in empty:
    cur.execute("DELETE FROM kb_staging WHERE entry_id = ?", (eid,))
    print(f"   删除 {eid} ({mod})")

# === 2. 测试数据 ===
cur.execute("SELECT entry_id, module, length(content) FROM kb_staging WHERE entry_id LIKE 'TEST_REUSE_%'")
tests = cur.fetchall()
print(f"[2] 测试条目: {len(tests)}")
for eid, mod, _ in tests:
    cur.execute("DELETE FROM kb_staging WHERE entry_id = ?", (eid,))
    print(f"   删除 {eid} ({mod})")

# === 3. 短内容 (<300 chars) — 合并入同模块已有条目或拒识 ===
cur.execute("SELECT entry_id, module, title, content, source_ids, confidence FROM kb_staging WHERE length(content) < 300 AND status IN ('pending','staging')")
short = cur.fetchall()
print(f"[3] 短内容条目: {len(short)}")
for eid, mod, title, content, src_ids, conf in short:
    # 检查同模块是否有近似条目可合并
    cur.execute("SELECT entry_id, title FROM kb_formal WHERE module = ? AND title LIKE ? LIMIT 1", (mod, f"%{title[:20]}%"))
    match = cur.fetchone()
    if match:
        # 合并：把短内容追加到匹配条目的 summary 中
        cur.execute("UPDATE kb_formal SET summary = COALESCE(summary,'') || '\n[蒸馏合并] ' || ?, updated_at = ? WHERE entry_id = ?",
                    (content[:200], time.strftime('%Y-%m-%d %H:%M'), match[0]))
        cur.execute("DELETE FROM kb_staging WHERE entry_id = ?", (eid,))
        print(f"   合并 {eid} → {match[0]} ({mod})")
    else:
        # 拒识：标记为 rejected
        cur.execute("UPDATE kb_staging SET status = 'rejected', audit_notes = '短内容(<300字)合并无匹配，拒识', updated_at = ? WHERE entry_id = ?",
                    (time.strftime('%Y-%m-%d %H:%M'), eid))
        print(f"   拒识 {eid} ({mod}, {len(content)}chars)")

# === 4. 有效条目升 formal ===
cur.execute("SELECT entry_id, module, title, content, source_ids, confidence, keywords, summary FROM kb_staging WHERE length(content) >= 300 AND status IN ('pending','staging') AND entry_id IS NOT NULL")  # R108-P2-3 修真：拒绝孤儿行晋升
valid = cur.fetchall()
print(f"[4] 有效条目: {len(valid)} → 升 formal")
for row in valid:
    eid, mod, title, content, src_ids, conf, kw, summary = row
    # 计算 fingerprint
    fp = hashlib.md5(content.encode('utf-8')).hexdigest()[:16]
    # 去重检查：同 module + 同 fingerprint 是否已在 formal
    cur.execute("SELECT COUNT(*) FROM kb_formal WHERE module = ? AND fingerprint = ?", (mod, fp))
    if cur.fetchone()[0] > 0:
        print(f"   跳过重复 {eid} ({mod}, fp={fp})")
        cur.execute("DELETE FROM kb_staging WHERE entry_id = ?", (eid,))
        continue
    # 插入 formal
    cur.execute("""INSERT INTO kb_formal (entry_id, module, title, content, src_id, category, keywords, summary,
        confidence, access_level, difficulty, tags, version, fingerprint, source_ids, created_at, updated_at, audit_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'registered', 'intermediate', '[]', 1, ?, ?, ?, ?, 'approved')""",
        (eid, mod, title, content, None, '基础', kw or '[]', summary or content[:120],
         conf or 0.7, fp, src_ids or '[]', time.strftime('%Y-%m-%d %H:%M'), time.strftime('%Y-%m-%d %H:%M')))
    # FTS5 由 trigger kb_fts5_insert 自动更新
    print(f"   升formal {eid} ({mod}, {len(content)}chars)")

con.commit()

# === 汇总 ===
cur.execute("SELECT status, COUNT(*) FROM kb_staging GROUP BY status")
print("\n=== staging 清理后 ===")
for row in cur.fetchall():
    print(f"  {row[0]}: {row[1]}")
cur.execute("SELECT COUNT(*) FROM kb_formal")
print(f"  formal 总数: {cur.fetchone()[0]}")
cur.execute("SELECT COUNT(*) FROM kb_fts5")
print(f"  FTS5 索引: {cur.fetchone()[0]}")

con.close()
