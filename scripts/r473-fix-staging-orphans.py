#!/usr/bin/env python3
# [R112-ARCHIVED-REF] 本脚本引用的 knowledge/yidao.db 已于 R110 归档到 data/backups/legacy-kb-202608/
# 如需重跑：先把 DB 路径改为 server/database/yidao.db（唯一权威库）。本脚本为一次性历史任务，保留仅作审计。
"""R473 · staging→formal 批量修复
628 条 promoted staging（倪海厦/中医蒸馏）→ formal_knowledge + kb_fts5 sync
"""

import sqlite3, sys, json
from datetime import datetime

DB = '/Users/tom/kimi/projects/mingli-baojian/knowledge/yidao.db'

def main():
    conn = sqlite3.connect(DB)
    cur = conn.cursor()
    now = datetime.now().isoformat()

    # 1. 找出 promoted 但不在 formal 的条目
    orphans = cur.execute("""
        SELECT s.entry_id, s.module, s.content, s.summary, s.tags,
               s.source_ids, s.category, s.confidence, s.version, s.created_at
        FROM staging_knowledge s
        LEFT JOIN formal_knowledge f ON s.entry_id = f.entry_id
        WHERE s.status = 'promoted' AND f.entry_id IS NULL
        ORDER BY s.module
    """).fetchall()

    if not orphans:
        print("✅ 无缺口")
        conn.close()
        return

    print(f"🔍 发现 {len(orphans)} 条缺口")

    # 2. 按模块统计
    mods = {}
    for r in orphans:
        mods[r[1]] = mods.get(r[1], 0) + 1
    for m, n in sorted(mods.items(), key=lambda x: -x[1]):
        print(f"   {m:30s}: {n:>4d} 条")

    # 3. 逐条 INSERT 到 formal（fetchall 避免 cursor 迭代中断）
    inserted, skipped = 0, 0
    fts5_rows = []

    for row in orphans:
        eid, mod, content, summary, tags, src, cat, conf, ver, created = row

        # 安全检查：content 长度
        if not content or len(content) < 20:
            print(f"  ⚠️ 跳过 {eid}: content 太短 ({len(content)} chars)")
            skipped += 1
            continue

        try:
            cur.execute("""
                INSERT INTO formal_knowledge
                (entry_id, module, content, summary, tags, source_ids, category,
                 confidence, status, version, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'formal', ?, ?)
            """, (eid, mod, content, summary, tags, src, cat, conf,
                  ver or 1, created or now))

            # FTS5 sync 行
            fts5_rows.append((eid, mod, summary or '', content, tags or '', cat or ''))
            inserted += 1
        except Exception as e:
            print(f"  ❌ {eid}: {e}")
            skipped += 1

    conn.commit()
    print(f"\n✅ formal: {inserted} 条已写入 · ⚠️ {skipped} 跳过")

    # 4. FTS5 sync
    fts5_done = 0
    for eid, mod, title, content, keywords, category in fts5_rows:
        try:
            existing = cur.execute("SELECT 1 FROM kb_fts5 WHERE entry_id=?", (eid,)).fetchone()
            if existing:
                cur.execute("""
                    UPDATE kb_fts5 SET module=?, title=?, content=?, keywords=?, category=?
                    WHERE entry_id=?
                """, (mod, title, content, keywords, category, eid))
            else:
                cur.execute("""
                    INSERT INTO kb_fts5 (entry_id, module, title, content, keywords, category)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (eid, mod, title, content, keywords, category))
            fts5_done += 1
        except Exception as e:
            print(f"  ❌ FTS5 {eid}: {e}")

    conn.commit()
    print(f"✅ kb_fts5: {fts5_done} 条已 sync")

    # 5. 验证
    for m, n in sorted(mods.items(), key=lambda x: -x[1]):
        f_cnt = cur.execute(
            "SELECT COUNT(*) FROM formal_knowledge WHERE module=?", (m,)).fetchone()[0]
        print(f"   verify {m:30s}: formal={f_cnt:>4d} · target={n:>4d} "
              f"{'✅' if f_cnt >= n else '❌'}")

    # 6. 新统计
    total = cur.execute("SELECT COUNT(*) FROM formal_knowledge").fetchone()[0]
    modules = cur.execute(
        "SELECT COUNT(DISTINCT module) FROM formal_knowledge").fetchone()[0]
    print(f"\n📊 formal_knowledge: {total} 条 · {modules} 模块")

    conn.close()

if __name__ == '__main__':
    main()
