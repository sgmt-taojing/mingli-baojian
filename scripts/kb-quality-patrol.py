#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""R793 · KB 质量红线巡检（每日 06:00 随健康巡检运行）

五红线检测（对应 docs/KB-QUALITY-RULES.md）：
  1. fts5/主表行数差（>0 = 索引冗余或未同步）
  2. 同文重复组（module+content）
  3. 乱码残留（未打标的 mojibake 特征）
  4. 真无出处（未打标且无 src_id）
  5. staging 待审积压（pending+staged > 10）
退出码：0=全绿；1=有红线违规（供 health-patrol 接管告警）
"""
import sqlite3
import sys
from pathlib import Path

DB = Path(__file__).resolve().parent.parent / 'server' / 'database' / 'yidao.db'
CTRL_RE = None


def main() -> int:
    import re
    global CTRL_RE
    CTRL_RE = re.compile('[\x00-\x08\x0e-\x1f]')
    conn = sqlite3.connect(f'file:{DB}?mode=ro', uri=True, timeout=30)
    conn.text_factory = str
    issues = []

    # 红线1：fts5/主表行数对齐
    main_n = conn.execute("SELECT COUNT(*) FROM kb_formal").fetchone()[0]
    fts_n = conn.execute("SELECT COUNT(*) FROM kb_fts5").fetchone()[0]
    if fts_n != main_n:
        issues.append(f'红线1 fts5({fts_n}) != 主表({main_n})——索引冗余/未同步，跑 kb-sync-guard.py --full')
    # 重复索引行（同 entry 多行）
    dup_idx = conn.execute("SELECT COUNT(*) FROM (SELECT entry_id FROM kb_fts5 GROUP BY entry_id HAVING COUNT(*) > 1)").fetchone()[0]
    if dup_idx:
        issues.append(f'红线1 fts5 同 entry 重复行组 {dup_idx}——跑 kb-sync-guard.py --full')

    # 红线2：同文重复
    dup = conn.execute("""
        SELECT COUNT(*) FROM (
          SELECT module, content FROM kb_formal
          WHERE content IS NOT NULL AND content != ''
          GROUP BY module, content HAVING COUNT(*) > 1)""").fetchone()[0]
    if dup:
        issues.append(f'红线2 同文重复组 {dup}——跑 kb-sync-guard.py --dedup')

    # 红线3：未标记乱码
    moji = conn.execute("""
        SELECT COUNT(*) FROM kb_formal
        WHERE (title GLOB '*ÿ*' OR title GLOB '*Ã*' OR content GLOB '*ÿÿ*')
        AND (tags IS NULL OR tags NOT LIKE '%mojibake%')""").fetchone()[0]
    if moji:
        issues.append(f'红线3 未标记乱码 {moji} 条——跑 kb-sync-guard.py --fix-mojibake')

    # 红线4：真无出处
    nosrc = conn.execute("""
        SELECT COUNT(*) FROM kb_formal
        WHERE (src_id IS NULL OR src_id='') AND (source_ids IS NULL OR source_ids='' OR source_ids='[]')
        AND (tags IS NULL OR (tags NOT LIKE '%ocr-garbage%' AND tags NOT LIKE '%mojibake%'))""").fetchone()[0]
    if nosrc:
        issues.append(f'红线4 真无出处 {nosrc} 条——按 KB-QUALITY-RULES 五类映射补 src_id')

    # 红线5：staging 积压 + 垃圾候选
    pending = conn.execute("SELECT COUNT(*) FROM kb_staging WHERE status IN ('pending','staged')").fetchone()[0]
    if pending > 10:
        issues.append(f'红线5 staging 待审 {pending} 条积压（>10）')
    junk = conn.execute("""
        SELECT COUNT(*) FROM kb_staging
        WHERE status IN ('pending','staged') AND (entry_id IS NULL OR entry_id=''
        OR content LIKE '%原始查询: x%' OR LENGTH(content) < 100)""").fetchone()[0]
    if junk:
        issues.append(f'红线5 staging 垃圾候选 {junk} 条（占位/过短/无id）——直接 rejected')

    # NULL 键残留
    nulls = conn.execute("SELECT COUNT(*) FROM kb_formal WHERE entry_id IS NULL OR entry_id='' OR tags IS NULL").fetchone()[0]
    if nulls:
        issues.append(f'附检 NULL 键 {nulls} 行——跑 kb-sync-guard.py --normalize')

    conn.close()
    if issues:
        for i in issues:
            print(f'WARN KB质量: {i}')
        return 1
    print(f'OK KB质量五红线全绿（主表 {main_n} = fts5 {fts_n}）')
    return 0


if __name__ == '__main__':
    sys.exit(main())
