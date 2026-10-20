#!/usr/bin/env python3
"""
把 kb_fts5（被 /api/public/kb/search-fts 实际查询的 FTS5 表）从 unicode61 重建为 trigram。
- 与 kb_formal_fts 保持一致的设计（中文 ≥3 字符 trigram 命中 + 2 字 LIKE 兜底）
- 自动备份原表
- 自动从 kb_formal 重新填充
"""
import sqlite3
import sys
import time
from pathlib import Path

DB = Path(__file__).parent.parent / "server" / "database" / "yidao.db"


def main():
    conn = sqlite3.connect(DB)
    cur = conn.cursor()

    print("[rebuild-kb-fts5] 检查现状...")
    cur.execute("SELECT sql FROM sqlite_master WHERE name='kb_fts5'")
    row = cur.fetchone()
    if row:
        print(f"  当前定义: {row[0]}")

    cur.execute("SELECT COUNT(*) FROM kb_fts5")
    before = cur.fetchone()[0]
    print(f"  当前行数: {before}")

    # 备份原表
    print("[rebuild-kb-fts5] 备份...")
    for tbl in ["kb_fts5", "kb_fts5_data", "kb_fts5_idx", "kb_fts5_content", "kb_fts5_docsize", "kb_fts5_config"]:
        try:
            cur.execute(f"ALTER TABLE {tbl} RENAME TO {tbl}_unicode61_bak_20260811")
            print(f"  备份 {tbl}")
        except Exception as e:
            print(f"  {tbl}: {e}")

    # 新建 trigram 版（与 kb_formal_fts 设计一致）
    print("[rebuild-kb-fts5] 重建为 trigram...")
    cur.execute("""
        CREATE VIRTUAL TABLE kb_fts5 USING fts5(
            entry_id, module, summary, content, tags, category,
            tokenize='trigram'
        )
    """)

    # 填充（从 kb_formal）
    print("[rebuild-kb-fts5] 填充...")
    start = time.time()
    cur.execute("""
        INSERT INTO kb_fts5 (entry_id, module, summary, content, tags, category)
        SELECT entry_id, module, summary, content,
               COALESCE(keywords, ''),
               COALESCE(category, '')
        FROM kb_formal
        WHERE status = 'formal'
    """)
    conn.commit()
    elapsed = time.time() - start
    print(f"  填充完成: {elapsed:.1f}s")

    # 验证
    cur.execute("SELECT COUNT(*) FROM kb_fts5")
    after = cur.fetchone()[0]
    print(f"[rebuild-kb-fts5] 重建完成 {before} → {after}")

    # 验证 trigram 搜索
    print("\n[rebuild-kb-fts5] === trigram 验证 ===")
    tests = ["桂枝汤", "真武汤", "肾气丸", "桃核承气", "肝郁气滞", "应爻", "九课"]
    for q in tests:
        cur.execute(
            "SELECT COUNT(*) FROM kb_fts5 WHERE kb_fts5 MATCH ?",
            (f'"{q}"',)
        )
        fts_count = cur.fetchone()[0]
        # LIKE 兜底
        cur.execute(
            "SELECT COUNT(*) FROM kb_formal WHERE (title LIKE ? OR content LIKE ?) AND status='formal' AND trust_score>=0.5",
            (f'%{q}%', f'%{q}%')
        )
        like_count = cur.fetchone()[0]
        marker = "✓" if fts_count > 0 or like_count > 0 else "✗"
        print(f"  {marker} '{q}': FTS={fts_count} LIKE={like_count}")

    conn.close()
    print("\n[rebuild-kb-fts5] ✅ 完成")


if __name__ == "__main__":
    main()