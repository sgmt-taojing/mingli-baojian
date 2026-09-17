#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""R793 · KB 同步守卫——kb_fts5 的唯一合法维护入口

子命令：
  --sync [N]     增量同步：把主表最近 N 小时变更的条目同步到 fts5（默认 24h）
  --full         全量对齐：清冗余行 + 全表同步（红1 违规时用，约 5-10 分钟）
  --dedup        同文去重：删 (module, content) 冗余行（每组保留有 entry_id 的最老行）
  --fix-mojibake 尝试修复未标记乱码（latin1→gbk 链），失败打标降权
  --normalize    NULL 键规整（entry_id 空=删除待审、tags/summary NULL→''）

红线（docs/KB-QUALITY-RULES.md 一）：除本脚本外，任何代码不得写 kb_fts5。
"""
import sqlite3
import sys
import time
import re
from pathlib import Path

DB = Path(__file__).resolve().parent.parent / 'server' / 'database' / 'yidao.db'


def connect():
    conn = sqlite3.connect(DB, timeout=60)
    conn.text_factory = str
    conn.execute('PRAGMA busy_timeout=60000')
    return conn


def sync_incremental(hours=24):
    conn = connect()
    since = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(time.time() - hours * 3600))
    # UNION 两腿各走索引（OR 会退化为全表 SCAN，25 万行实测 3 分钟+）
    rows = conn.execute("""
        SELECT entry_id, module, COALESCE(summary,''), content, COALESCE(tags,''), COALESCE(category,'') FROM kb_formal
        WHERE promoted_at >= ?
        UNION
        SELECT entry_id, module, COALESCE(summary,''), content, COALESCE(tags,''), COALESCE(category,'') FROM kb_formal
        WHERE updated_at >= ?
    """, (since, since)).fetchall()
    valid = [r for r in rows if r[0]]
    if not valid:
        print(f'增量同步 0 条（近 {hours}h）')
        conn.close()
        return
    eids = [r[0] for r in valid]
    ph = ','.join('?' * len(eids))
    existing = {r[0] for r in conn.execute(f"SELECT entry_id FROM kb_fts5 WHERE entry_id IN ({ph})", eids)}
    upd = [r for r in valid if r[0] in existing]
    ins = [r for r in valid if r[0] not in existing]
    conn.executemany("UPDATE kb_fts5 SET module=?,summary=?,content=?,tags=?,category=? WHERE entry_id=?",
                     [(m, s, c, t, g, e) for e, m, s, c, t, g in upd])
    conn.executemany("INSERT INTO kb_fts5(entry_id,module,summary,content,tags,category) VALUES(?,?,?,?,?,?)",
                     [(e, m, s, c, t, g) for e, m, s, c, t, g in ins])
    conn.commit()
    print(f'增量同步 {len(upd)} 更 / {len(ins)} 插（近 {hours}h）')
    conn.close()


def _has_cols(conn, cols):
    info = [r[1] for r in conn.execute("PRAGMA table_info(kb_formal)")]
    return all(c in info for c in cols)


def sync_full():
    conn = connect()
    print('全量对齐开始（清冗余 + 全表重灌快照字段）…')
    # 1) 删 fts5 中主表不存在的 entry
    conn.execute("""DELETE FROM kb_fts5 WHERE entry_id IS NOT NULL AND entry_id != ''
                    AND entry_id NOT IN (SELECT entry_id FROM kb_formal WHERE entry_id IS NOT NULL AND entry_id != '')""")
    # 2) 删同 entry 重复行（留最小 rowid）
    conn.execute("""
        DELETE FROM kb_fts5 WHERE rowid NOT IN (
          SELECT MIN(rowid) FROM kb_fts5 GROUP BY entry_id)""")
    conn.commit()
    # 3) 内容对齐（分批）
    ids = [r[0] for r in conn.execute("""
        SELECT f.rowid FROM kb_fts5 f JOIN kb_formal k ON f.entry_id = k.entry_id
        WHERE f.tags IS NOT k.tags OR f.content IS NOT k.content
        OR f.summary IS NOT k.summary OR f.module IS NOT k.module""").fetchall()]
    batch, done = 500, 0
    for i in range(0, len(ids), batch):
        chunk = ids[i:i + batch]
        ph = ','.join('?' * len(chunk))
        rows = conn.execute(f"""
            SELECT f.rowid, k.module, COALESCE(k.summary,''), COALESCE(k.content,''),
                   COALESCE(k.tags,''), COALESCE(k.category,'')
            FROM kb_fts5 f JOIN kb_formal k ON f.entry_id = k.entry_id
            WHERE f.rowid IN ({ph})""", chunk).fetchall()
        for rid, mod, summ, cont, tags, cat in rows:
            conn.execute("UPDATE kb_fts5 SET module=?,summary=?,content=?,tags=?,category=? WHERE rowid=?",
                         (mod, summ, cont, tags, cat, rid))
        conn.commit()
        done += len(chunk)
    print(f'全量对齐完成：对齐 {done} 行')
    conn.close()


def dedup():
    conn = connect()
    n = conn.execute("""
        DELETE FROM kb_formal WHERE rowid IN (
          SELECT rowid FROM (
            SELECT rowid, module, content,
              ROW_NUMBER() OVER (PARTITION BY module, content
                ORDER BY CASE WHEN entry_id IS NOT NULL AND entry_id != '' THEN 0 ELSE 1 END, rowid) rn
            FROM kb_formal WHERE content IS NOT NULL AND content != ''
          ) WHERE rn > 1
        ) AND (module, content) IN (
          SELECT module, content FROM kb_formal WHERE content IS NOT NULL AND content != ''
          GROUP BY module, content HAVING COUNT(*) > 1
        )""").rowcount
    conn.commit()
    print(f'同文去重：删 {n} 冗余行')
    conn.close()


def fix_mojibake():
    conn = connect()
    rows = conn.execute("""SELECT rowid, title, content FROM kb_formal
        WHERE (title GLOB '*ÿ*' OR title GLOB '*Ã*' OR content GLOB '*ÿÿ*')
        AND (tags IS NULL OR tags NOT LIKE '%mojibake%')""").fetchall()
    fixed, marked = 0, 0
    for rowid, title, content in rows:
        def fix(s):
            if not s:
                return s
            for a, b in (('latin1', 'gbk'), ('cp1252', 'gbk')):
                try:
                    return s.encode(a).decode(b)
                except Exception:
                    pass
            return None
        ft, fc = fix(title), fix(content)
        tags = conn.execute("SELECT COALESCE(tags,'') FROM kb_formal WHERE rowid=?", (rowid,)).fetchone()[0]
        if ft and fc:
            conn.execute("UPDATE kb_formal SET title=?,content=? WHERE rowid=?", (ft, fc, rowid))
            fixed += 1
        else:
            conn.execute("UPDATE kb_formal SET tags=?, trust_score=0.3 WHERE rowid=?",
                         ((tags + ',' if tags else '') + 'mojibake-unrecoverable', rowid))
            marked += 1
    conn.commit()
    print(f'乱码处置：修复 {fixed} / 标记降权 {marked}')
    conn.close()


def normalize():
    conn = connect()
    n1 = conn.execute("UPDATE kb_formal SET tags='' WHERE tags IS NULL").rowcount
    n2 = conn.execute("UPDATE kb_formal SET summary='' WHERE summary IS NULL").rowcount
    n3 = conn.execute("UPDATE kb_fts5 SET tags='' WHERE tags IS NULL").rowcount
    n4 = conn.execute("UPDATE kb_fts5 SET summary='' WHERE summary IS NULL").rowcount
    dead = conn.execute("""SELECT COUNT(*) FROM kb_formal WHERE entry_id IS NULL OR entry_id=''""").fetchone()[0]
    conn.commit()
    print(f'NULL 规整：主表 tags {n1} / summary {n2}；fts5 tags {n3} / summary {n4}；NULL entry 行 {dead}（人工确认后处理）')
    conn.close()


if __name__ == '__main__':
    args = sys.argv[1:]
    if '--sync' in args:
        h = int(args[args.index('--sync') + 1]) if len(args) > args.index('--sync') + 1 and args[args.index('--sync') + 1].isdigit() else 24
        sync_incremental(h)
    elif '--full' in args:
        sync_full()
    elif '--dedup' in args:
        dedup()
    elif '--fix-mojibake' in args:
        fix_mojibake()
    elif '--normalize' in args:
        normalize()
    else:
        print(__doc__)
        sys.exit(2)
