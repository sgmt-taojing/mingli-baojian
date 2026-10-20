#!/usr/bin/env python3
"""R481 批量 promote staging → formal
处理 7/25 累计未 promote 的高 confidence 条目
"""
import sqlite3, json, sys
from pathlib import Path

DB = 'server/database/yidao.db'
MIN_CONF = 0.65  # 最低 confidence 门槛
BATCH_LIMIT = 50  # 单次最多 promote 数量

def main():
    db = sqlite3.connect(DB)
    cur = db.cursor()

    # 1. 统计当前 staging 状态
    cur.execute("""SELECT COUNT(*) FROM kb_staging WHERE status='staging' AND confidence >= ?""", (MIN_CONF,))
    total = cur.fetchone()[0]
    print(f'📊 待 promote (confidence ≥ {MIN_CONF}): {total} 条')

    if total == 0:
        print('✅ 无需 promote')
        db.close()
        return

    # 2. 拉取候选
    cur.execute("""SELECT entry_id, module, title, content, src_id, category, keywords, summary,
      confidence, access_level, difficulty, tags, source_ids, fingerprint, version
      FROM kb_staging WHERE status='staging' AND confidence >= ? AND entry_id IS NOT NULL  -- R108-P2-3 修真：拒绝孤儿行晋升
      ORDER BY confidence DESC LIMIT ?""", (MIN_CONF, BATCH_LIMIT))
    candidates = cur.fetchall()
    print(f'📋 本批处理: {len(candidates)} 条')

    promoted, skipped = 0, 0
    for c in candidates:
        (eid, mod, title, content, src_id, cat, kw, summary,
         conf, access, diff, tags, src_ids, fp, ver) = c
        
        # 检查是否已在 kb_formal（用 entry_id 唯一索引）
        cur.execute("SELECT 1 FROM kb_formal WHERE entry_id = ?", (eid,))
        if cur.fetchone():
            # 已存在 → 标记为已 promote
            cur.execute("UPDATE kb_staging SET status='promoted', promoted_at=CURRENT_TIMESTAMP WHERE entry_id=?", (eid,))
            skipped += 1
            continue

        try:
            cur.execute("""INSERT INTO kb_formal 
              (entry_id, module, title, content, src_id, category, keywords, summary,
               trust_score, version, promoted_at, promoted_from, reviewed_by,
               tags, source_ids, confidence, access_level, difficulty,
               audit_status, fingerprint)
              VALUES (?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,'staging-batch','r481',
               ?,?,?,?,?,'promoted',?)""",
              (eid, mod, title, content, src_id, cat, kw, summary,
               conf, ver or 1, tags, src_ids, conf, access, diff, fp))
            cur.execute("UPDATE kb_staging SET status='promoted', promoted_at=CURRENT_TIMESTAMP WHERE entry_id=?", (eid,))
            promoted += 1
        except Exception as e:
            print(f'  ⚠️ {eid}: {e}')

    db.commit()

    # 3. 验证
    cur.execute("SELECT COUNT(*) FROM kb_formal")
    after = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM kb_staging WHERE status='staging'")
    remaining = cur.fetchone()[0]

    print(f'\n✅ promoted: {promoted} · skipped(已存在): {skipped}')
    print(f'📊 kb_formal: {after} (after) · kb_staging: {remaining} remaining')

    # 4. 报告
    report = {
        'ts': str(__import__("datetime").datetime.now()),
        'action': 'r481-staging-batch-promote',
        'min_conf': MIN_CONF,
        'candidates': len(candidates),
        'promoted': promoted,
        'skipped_existing': skipped,
        'kb_formal_after': after,
        'kb_staging_remaining': remaining,
    }
    out = f'.openclaw/tmp/r481-batch-report.json'
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    with open(out, 'w') as f: json.dump(report, f, ensure_ascii=False, indent=2)
    print(f'\n📄 报告: {out}')

    db.close()

if __name__ == '__main__':
    main()