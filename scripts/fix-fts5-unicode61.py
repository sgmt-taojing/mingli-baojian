#!/usr/bin/env python3
"""修复 FTS5 分词器：trigram → unicode61
解决双字中文词（用神、六爻、起名等）无法匹配的问题。"""
import sqlite3, shutil, time, os, sys

DB_PATH = '/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/server/database/yidao.db'
BACKUP_PATH = DB_PATH + '.fts5-fix-bak'

def main():
    if not os.path.exists(DB_PATH):
        print(f'❌ 数据库不存在: {DB_PATH}')
        sys.exit(1)

    print(f'1. 备份数据库 → {BACKUP_PATH}')
    shutil.copy2(DB_PATH, BACKUP_PATH)
    print(f'   备份完成 ({os.path.getsize(BACKUP_PATH)/1024/1024:.1f} MB)')

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    try:
        before_count = c.execute('SELECT COUNT(*) FROM kb_fts5').fetchone()[0]
        print(f'2. 重建前 kb_fts5 行数: {before_count}')

        print('3. 删除旧 kb_fts5 表 + 触发器...')
        # R111 防回归：先备份 kb_formal 上的非 FTS 触发器（如 kb_formal_hit_count_default），
        # 重建后恢复——防止 FTS 重建顺带吞掉业务触发器
        preserved = c.execute("""
            SELECT name, sql FROM sqlite_master
            WHERE type='trigger' AND tbl_name='kb_formal'
              AND name NOT IN ('kb_fts5_insert','kb_fts5_delete','kb_fts5_update')
        """).fetchall()
        if preserved:
            print(f'   [R111] 备份 {len(preserved)} 个非 FTS 触发器: {[r[0] for r in preserved]}')
        c.execute('DROP TABLE IF EXISTS kb_fts5')
        c.execute('DROP TRIGGER IF EXISTS kb_fts5_insert')
        c.execute('DROP TRIGGER IF EXISTS kb_fts5_delete')
        c.execute('DROP TRIGGER IF EXISTS kb_fts5_update')
        conn.commit()

        print('4. 创建 kb_fts5 (tokenize=unicode61)...')
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
        conn.commit()

        print('5. 从 kb_formal 全量导入...')
        t0 = time.time()
        c.execute("""
            INSERT INTO kb_fts5(entry_id, module, title, content, keywords, category)
            SELECT entry_id, module, title, content, keywords, category
            FROM kb_formal
            WHERE content IS NOT NULL AND length(content) > 0
        """)
        conn.commit()
        elapsed = time.time() - t0
        after_count = c.execute('SELECT COUNT(*) FROM kb_fts5').fetchone()[0]
        print(f'   导入完成: {after_count} 条, 耗时 {elapsed:.2f}s')

        print('6. 创建同步触发器...')
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

        # R111 防回归：恢复非 FTS 业务触发器
        for tname, tsql in preserved:
            c.execute(f'DROP TRIGGER IF EXISTS "{tname}"')
            c.execute(tsql)
            print(f'   [R111] 已恢复触发器: {tname}')
        conn.commit()

        print('7. 验证双字词搜索...')
        test_words = ['用神', '六爻', '起名', '财运', '婚姻', '风水', '八字', '排盘', '合婚', '塔罗']
        all_pass = True
        for w in test_words:
            rows = c.execute(
                "SELECT entry_id, module, substr(title,1,20) FROM kb_fts5 "
                "WHERE kb_fts5 MATCH ? LIMIT 3", (w,)
            ).fetchall()
            status = '✅' if len(rows) > 0 else '❌'
            if len(rows) == 0:
                all_pass = False
            print(f'   {status} "{w}" → {len(rows)} 条命中'
                  + (f' (首条: {rows[0][1]}/{rows[0][2]})' if rows else ''))

        if all_pass:
            print('\n✅ 修复完成！所有双字词验证通过。')
        else:
            print('\n⚠️  部分双字词未命中，可能该词在 KB 中确实不存在。')

    except Exception as e:
        print(f'\n❌ 修复失败: {e}')
        print('   正在回滚...')
        conn.close()
        shutil.copy2(BACKUP_PATH, DB_PATH)
        print(f'   已恢复备份。')
        sys.exit(1)
    finally:
        if 'conn' in dir():
            conn.close()

if __name__ == '__main__':
    main()
