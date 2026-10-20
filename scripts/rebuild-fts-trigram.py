#!/usr/bin/env python3
"""
rebuild-fts-trigram.py · 重建 kb_formal_fts 为 trigram 分词器

系统设计（ai-stream-engine.js / agent-tools.js）要求 kb_formal_fts 使用
trigram 分词器：中文 ≥3 字符子串匹配，2 字符查询走 LIKE 兜底。

之前误用 unicode61 重建，现恢复 trigram 并与 kb_formal 保持一致。
"""

import sqlite3
import time
from pathlib import Path

DB = Path('/Users/tom/kimi/projects/mingli-baojian/server/database/yidao.db')

def main():
    conn = sqlite3.connect(str(DB), timeout=30)
    conn.execute("PRAGMA busy_timeout = 30000")
    cur = conn.cursor()
    
    # 检查当前分词器
    try:
        cur.execute("SELECT sql FROM sqlite_master WHERE name='kb_formal_fts'")
        row = cur.fetchone()
        print(f"[rebuild] 当前: {row[0][:120] if row else '无表'}")
    except Exception as e:
        print(f"[rebuild] 检查失败: {e}")
        conn.close()
        return
    
    # DROP 旧表（含影子表）
    for t in ['kb_formal_fts', 'kb_formal_fts_data', 'kb_formal_fts_idx',
              'kb_formal_fts_docsize', 'kb_formal_fts_config']:
        try:
            cur.execute(f"DROP TABLE IF EXISTS {t}")
        except:
            pass
    
    # 重建为 trigram（与原系统设计一致：content 单字段 + 外部内容表）
    cur.execute("""
        CREATE VIRTUAL TABLE kb_formal_fts USING fts5(
            content,
            content='kb_formal',
            content_rowid='rowid',
            tokenize='trigram'
        )
    """)
    
    # 批量填充（trigram 索引构建较慢，分块提交）
    total = cur.execute("SELECT COUNT(*) FROM kb_formal").fetchone()[0]
    print(f"[rebuild] 开始填充 {total} 条（trigram）…")
    
    # 注意：外部内容表 + FTS5 需要先插入数据再 rebuild，或直接用 'rebuild' 命令
    # 对 content='kb_formal' 的外部内容表，执行 INSERT 会同步索引
    # 更快方式：先建表，然后 INSERT INTO kb_formal_fts(kb_formal_fts) VALUES('rebuild')
    # 但 rebuild 要求表已有关联——先插入 rowid 空行再 rebuild 会失败
    # 标准做法：INSERT INTO kb_formal_fts(rowid, content) SELECT rowid, content FROM kb_formal
    t0 = time.time()
    batch = 5000
    offset = 0
    while True:
        rows = cur.execute(
            "SELECT rowid, content FROM kb_formal LIMIT ? OFFSET ?", (batch, offset)
        ).fetchall()
        if not rows:
            break
        conn.execute("BEGIN")
        for rowid, content in rows:
            cur.execute(
                "INSERT INTO kb_formal_fts(rowid, content) VALUES (?, ?)",
                (rowid, content or '')
            )
        conn.execute("COMMIT")
        offset += len(rows)
        elapsed = time.time() - t0
        print(f"[rebuild] {offset}/{total} ({elapsed:.0f}s)")
    
    # 验证
    n = cur.execute("SELECT COUNT(*) FROM kb_formal_fts").fetchone()[0]
    print(f"[rebuild] FTS5 数据量: {n}/{total}")
    
    # 验证 trigram 搜索
    tests = ['应爻', '九课', '桂枝汤', '肝郁气滞']
    print(f"[rebuild] === trigram 搜索验证 ===")
    for term in tests:
        try:
            # trigram 要求查询 ≥3 字符；2 字符会报错（符合系统设计，走 LIKE 兜底）
            if len(term) >= 3:
                r = cur.execute(
                    "SELECT COUNT(*) FROM kb_formal_fts WHERE kb_formal_fts MATCH ?",
                    (f'"{term}"',)
                ).fetchone()[0]
            else:
                r = '2字→走LIKE兜底'
        except Exception as e:
            r = f'MATCH错误(预期): {str(e)[:50]}'
        print(f"  {term}: {r}")
    
    conn.commit()
    conn.close()
    print(f"[rebuild] 完成 ✅ ({time.time()-t0:.0f}s)")

if __name__ == '__main__':
    main()
