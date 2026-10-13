#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""R793 · KB 同步守卫——kb_fts5 的唯一合法维护入口

子命令：
  --sync [N]     增量同步：把主表最近 N 小时变更的条目同步到 fts5（默认 24h）
  --full         全量对齐：清冗余行 + 全表同步（红1 违规时用，约 5-10 分钟）
  --dedup        同文去重：删 (module, content) 冗余行（每组保留有 entry_id 的最老行）
  --fix-mojibake 尝试修复未标记乱码（latin1→gbk 链），失败打标降权
  --normalize    NULL 键规整（entry_id 空=删除待审、tags/summary NULL→''）
  --purge-empty  空壳行清除（title/content 为空的 PDF 残渣行，主表+fts5 双删，审计留证 logs/kb-purge-empty-audit.jsonl）
  --drop-legacy-triggers  摘除历史 fts5 三触发器（唯一写入口红线防复发，R-FTS5-TRIG）

红线（docs/KB-QUALITY-RULES.md 一）：除本脚本外，任何代码不得写 kb_fts5。
"""
import sqlite3
import sys
import time
import re
import json
from pathlib import Path

DB = Path(__file__).resolve().parent.parent / 'server' / 'database' / 'yidao.db'


def connect():
    conn = sqlite3.connect(DB, timeout=60)
    conn.text_factory = str
    conn.execute('PRAGMA busy_timeout=60000')
    return conn


# ── R827 · fts5 影子索引（2026-10-13）：fts5 内容列无索引，
#    sync 的 entry_id IN (...) 存在性检查退化为全表扫（322k×全文=50min 持锁病灶）。
#    idmap 表一次性轻量建成（仅 entry_id,rowid 两列），存在性检查降为 O(1) 主键查。──
def ensure_idmap(conn):
    conn.execute("CREATE TABLE IF NOT EXISTS kb_fts5_idmap(entry_id TEXT PRIMARY KEY, rid INTEGER)")
    n = conn.execute("SELECT COUNT(*) FROM kb_fts5_idmap").fetchone()[0]
    if n == 0:
        t0 = time.time()
        rows = conn.execute("SELECT entry_id, rowid FROM kb_fts5 WHERE entry_id IS NOT NULL AND entry_id != ''").fetchall()
        conn.executemany("INSERT OR REPLACE INTO kb_fts5_idmap(entry_id, rid) VALUES(?,?)", rows)
        conn.commit()
        print(f'idmap 建成 {len(rows)} 行（{time.time()-t0:.0f}s）')
    return conn


def sync_incremental(hours=24):
    conn = connect()
    ensure_idmap(conn)
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
    # 走 idmap 主键查，不再 fts5 全表扫
    existing = {r[0]: r[1] for r in conn.execute(f"SELECT entry_id, rid FROM kb_fts5_idmap WHERE entry_id IN ({ph})", eids)}
    upd = [(r[1], r[2], r[3], r[4], r[5], existing[r[0]]) for r in valid if r[0] in existing]
    ins = [r for r in valid if r[0] not in existing]
    conn.executemany("UPDATE kb_fts5 SET module=?,summary=?,content=?,tags=?,category=? WHERE rowid=?", upd)
    for e, m, s, c, t, g in ins:
        cur = conn.execute("INSERT INTO kb_fts5(entry_id,module,summary,content,tags,category) VALUES(?,?,?,?,?,?)",
                           (e, m, s, c, t, g))
        conn.execute("INSERT OR REPLACE INTO kb_fts5_idmap(entry_id, rid) VALUES(?,?)", (e, cur.lastrowid))
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
    # 2) 删同 entry 重复行（留最小 rowid）+ 空 entry_id 残行（R826：曾致 fts5 恒多 1 行的暗差）
    conn.execute("""
        DELETE FROM kb_fts5 WHERE rowid NOT IN (
          SELECT MIN(rowid) FROM kb_fts5 GROUP BY entry_id)""")
    conn.execute("DELETE FROM kb_fts5 WHERE entry_id IS NULL OR entry_id=''")
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
    # 全量对齐有删行，idmap 影子索引重建防陈旧（R827）
    conn.execute("DROP TABLE IF EXISTS kb_fts5_idmap")
    conn.commit()
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
        WHERE (title GLOB '*ÿ*' OR title GLOB '*Ã*' OR content GLOB '*ÿÿ*'
               OR title LIKE '%�%' OR content LIKE '%�%'
               OR title LIKE '%￿%' OR content LIKE '%￿%')
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


def purge_empty():
    """R797：空壳行清除——title 或 content 为空的 PDF 首页残渣行（巡检红线2b 捕获后走本通道，主表+fts5 双删并留证）"""
    conn = connect()
    rows = conn.execute("""SELECT entry_id, module, promoted_from FROM kb_formal
        WHERE (title IS NULL OR title='') OR (content IS NULL OR content='')""").fetchall()
    if not rows:
        print('空壳行：0，无需清除')
        conn.close()
        return
    log = []
    for eid, mod, src in rows:
        log.append({'entry_id': eid, 'module': mod, 'promoted_from': src})
        conn.execute('DELETE FROM kb_formal WHERE entry_id=?', (eid,))
        conn.execute('DELETE FROM kb_fts5 WHERE entry_id=?', (eid,))
    conn.commit()
    # 处置留证：写 JSONL 审计文件（与蒸馏留证同风格，可追溯）
    from datetime import datetime
    audit_path = Path(__file__).resolve().parent.parent / 'logs' / 'kb-purge-empty-audit.jsonl'
    with open(audit_path, 'a', encoding='utf-8') as f:
        for item in log:
            item['purged_at'] = datetime.now().isoformat(timespec='seconds')
            f.write(json.dumps(item, ensure_ascii=False) + '\n')
    m = conn.execute('SELECT COUNT(*) FROM kb_formal').fetchone()[0]
    f = conn.execute('SELECT COUNT(*) FROM kb_fts5').fetchone()[0]
    conn.close()
    print(f'空壳行清除：{len(rows)} 条（审计留证 logs/kb-purge-empty-audit.jsonl）；主表 {m} / fts5 {f}')
    if m != f:
        print('⚠️ 主表与 fts5 不一致，请跑 --full 对齐')


def _run_with_lock_retry(fn, *a, retries=10, wait=30):
    """写锁竞争重试（OCR 批/回填任务持锁时不再一次崩溃 exit 1）"""
    import time as _t
    for i in range(retries):
        try:
            return fn(*a)
        except sqlite3.OperationalError as e:
            if 'locked' not in str(e).lower():
                raise
            print(f'写锁被占（{e}），{wait}s 后第 {i+2}/{retries} 次重试…', flush=True)
            _t.sleep(wait)
    raise SystemExit('FATAL: 重试耗尽仍被锁')


def drop_legacy_triggers():
    """R-FTS5-TRIG（2026-10-08）：摘除 fts5 三触发器（kb_fts5_insert/delete/update）。
    根因：历史一次性脚本（r16-d-fts5/fix-fts5-unicode61）建的 AFTER INSERT/UPDATE 触发器
    绕过唯一写入口红线直写 fts5，叠加蒸馏脚本重跑形成同 entry 多行（828 组×5 副本）。
    摘除后 fts5 只经本脚本 --sync/--full 同步；G24 kb_formal_reference_guard 与
    hit_count_default 触发器不动。"""
    conn = connect()
    dropped = []
    for name in ('kb_fts5_insert', 'kb_fts5_delete', 'kb_fts5_update'):
        cur = conn.execute(f"DROP TRIGGER IF EXISTS {name}")
        if cur.rowcount != 0 or True:
            dropped.append(name)
    conn.commit()
    left = [r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='trigger'")]
    conn.close()
    print(f'摘除 fts5 触发器: {dropped}；现存触发器: {left}')


if __name__ == '__main__':
    args = sys.argv[1:]
    if '--sync' in args:
        h = int(args[args.index('--sync') + 1]) if len(args) > args.index('--sync') + 1 and args[args.index('--sync') + 1].isdigit() else 24
        _run_with_lock_retry(sync_incremental, h)
    elif '--full' in args:
        _run_with_lock_retry(sync_full)
    elif '--dedup' in args:
        _run_with_lock_retry(dedup)
    elif '--fix-mojibake' in args:
        fix_mojibake()
    elif '--normalize' in args:
        _run_with_lock_retry(normalize)
    elif '--purge-empty' in args:
        _run_with_lock_retry(purge_empty)
    elif '--drop-legacy-triggers' in args:
        _run_with_lock_retry(drop_legacy_triggers)
    elif '--build-idmap' in args:
        conn = connect()
        conn.execute("DROP TABLE IF EXISTS kb_fts5_idmap")
        conn.commit()
        ensure_idmap(conn)
        conn.close()
    else:
        print(__doc__)
        sys.exit(2)
