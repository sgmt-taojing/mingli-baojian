#!/usr/bin/env python3
"""R16-D FTS5 全文索引 — 在 yidao.db 上创建 FTS5 虚拟表 + 触发器同步
走 INSERT...SELECT 模式（必须）
"""
import sqlite3, time
DB = '/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/server/database/yidao.db'

def build():
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    
    # 1. 备份现有索引（如果有）
    existed = c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='kb_fts5'").fetchone()
    if existed:
        print('kb_fts5 已存在，先删除重建')
        c.execute('DROP TABLE IF EXISTS kb_fts5')
        c.execute('DROP TRIGGER IF EXISTS kb_fts5_insert')
        c.execute('DROP TRIGGER IF EXISTS kb_fts5_delete')
        c.execute('DROP TRIGGER IF EXISTS kb_fts5_update')
    
    # 2. 创建 FTS5 虚拟表（外部内容 = kb_formal，避免数据冗余）
    print('1. 创建 kb_fts5 虚拟表...')
    c.execute("""
    CREATE VIRTUAL TABLE kb_fts5 USING fts5(
        entry_id UNINDEXED,
        module,
        title,
        content,
        keywords,
        category,
        tokenize='unicode61'
    )
    """)
    
    # 3. 用 INSERT...SELECT 一次性导入全部数据（12,626 条）
    print('2. INSERT...SELECT FROM kb_formal 全量导入...')
    t0 = time.time()
    c.execute("""
    INSERT INTO kb_fts5(entry_id, module, title, content, keywords, category)
    SELECT entry_id, module, title, content, keywords, category FROM kb_formal
    WHERE content IS NOT NULL AND length(content) > 0
    """)
    conn.commit()
    inserted = c.execute('SELECT count() FROM kb_fts5').fetchone()[0]
    print(f'   导入完成：{inserted} 条，耗时 {time.time()-t0:.2f}s')
    
    # 4. 创建触发器保证同步
    print('3. 创建 INSERT/UPDATE/DELETE 触发器...')
    c.execute("""
    CREATE TRIGGER kb_fts5_insert AFTER INSERT ON kb_formal BEGIN
      INSERT INTO kb_fts5(entry_id, module, title, content, keywords, category)
      VALUES (new.entry_id, new.module, new.title, new.content, new.keywords, new.category);
    END
    """)
    c.execute("""
    CREATE TRIGGER kb_fts5_delete AFTER DELETE ON kb_formal BEGIN
      DELETE FROM kb_fts5 WHERE entry_id = old.entry_id;
    END
    """)
    c.execute("""
    CREATE TRIGGER kb_fts5_update AFTER UPDATE ON kb_formal BEGIN
      DELETE FROM kb_fts5 WHERE entry_id = old.entry_id;
      INSERT INTO kb_fts5(entry_id, module, title, content, keywords, category)
      VALUES (new.entry_id, new.module, new.title, new.content, new.keywords, new.category);
    END
    """)
    conn.commit()
    
    # 5. 创建 snippet 辅助函数（高亮 snippet）
    print('4. snippet 测试（关键词搜）...')
    t0 = time.time()
    rows = c.execute("""
    SELECT entry_id, snippet(kb_fts5, 3, '<mark>', '</mark>', '…', 8) AS hl,
           bm25(kb_fts5) AS score
    FROM kb_fts5
    WHERE kb_fts5 MATCH '舌诊 OR 脏腑 OR 经方'
    ORDER BY bm25(kb_fts5)
    LIMIT 5
    """).fetchall()
    print(f'   bm25 搜索耗时 {time.time()-t0:.3f}s，返回 {len(rows)} 条:')
    for r in rows:
        print(f'     {r[0]:30s} score={r[2]:.2f}  hl={r[1][:60]}...')
    
    # 6. 索引体积
    size = c.execute("SELECT sum(pgsize) FROM dbstat WHERE name='kb_fts5'").fetchone()
    print(f'\\n5. kb_fts5 索引体积: {size[0]/1024:.1f} KB')
    
    # 7. 全表 count
    n = c.execute('SELECT count() FROM kb_fts5').fetchone()[0]
    print(f'6. kb_fts5 索引总条数: {n}')
    
    conn.close()

if __name__ == '__main__':
    build()