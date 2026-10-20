#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
staging-knowledge-adjudicate.py — MB-K1 staging_knowledge 265 条滞留清零（2026-09-26）
裁决规则（逐类书面化）：
  ①同 entry_id 已在 kb_formal → 拒（重复收录）；
  ②命理域非重复（舒晗奇门/路总紫微，confidence≥0.8）→ 晋升 kb_formal；
  ③医学域非重复 → 拒（医学能力由 tcm 栈供给，命理 KB 不新增医学条目，G24/ADR-024）；
  ④格式损坏（bazi JS 对象残片）→ 拒；⑤域外误入（digital-workshop/lowaltitude）→ 拒。
"""
import sqlite3, json, sys
from datetime import datetime
from pathlib import Path

DB = Path(__file__).resolve().parent.parent / 'server' / 'database' / 'yidao.db'
NOW = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
AUDIT_BY = 'kimi-mb-k1'
MINGLI_KEEP = {'qimen', 'ziwei'}

conn = sqlite3.connect(str(DB))
conn.execute('PRAGMA busy_timeout=30000')
conn.execute('PRAGMA journal_mode=WAL')

rows = conn.execute(
    "SELECT s.entry_id, s.module, s.content, s.summary, s.tags, s.source_ids, s.confidence, "
    "s.access_level, s.category, s.difficulty, (f.entry_id IS NOT NULL) AS dupe "
    "FROM staging_knowledge s LEFT JOIN kb_formal f ON f.entry_id = s.entry_id "
    "WHERE s.status='staging' OR s.audit_notes LIKE '晋升失败转拒%'").fetchall()
print(f'待裁决 {len(rows)} 条')

promoted = rejected_dupe = rejected_other = 0
reasons = {}
for eid, module, content, summary, tags, source_ids, conf, access, category, difficulty, dupe in rows:
    if dupe:
        verdict, note = 'rejected', '重复收录：同 entry_id 已在 kb_formal（MB-K1 滞留清零）'
    elif module in MINGLI_KEEP and (conf or 0) >= 0.8:
        title = (summary or content or '')[:40].replace('\n', ' ')
        try:
            conn.execute(
                "INSERT OR IGNORE INTO kb_formal (entry_id, module, title, content, src_id, category, keywords, summary, "
                "trust_score, version, promoted_at, promoted_from, reviewed_by, hit_count, tags, source_ids, confidence, "
                "access_level, difficulty, status, created_at, updated_at, audit_status, audit_by, audit_at, audit_notes, domain) "
                "VALUES (" + ",".join(["?"] * 13 + ["0"] + ["?"] * 13) + ")",
                (eid, module, title, content, 'SRC-STAGING-ADJUDICATE', category, tags, (summary or '')[:200],
                 0.8, '1', NOW, 'staging_knowledge', AUDIT_BY, tags, source_ids, conf,
                 access or 'registered', difficulty or 'intermediate', 'active', NOW, NOW,
                 'approved', AUDIT_BY, NOW, 'MB-K1 滞留清零：命理域优质条目晋升', 'mingli'))
            verdict, note = 'promoted', '晋升 kb_formal：命理域优质条目（MB-K1 滞留清零）'
            promoted += 1
        except Exception as e:
            verdict, note = 'rejected', f'晋升失败转拒：{str(e)[:80]}'
            rejected_other += 1
            reasons.setdefault(note, 0)
            conn.execute(
                "UPDATE staging_knowledge SET status=?, audit_status='rejected', audit_by=?, audit_at=?, audit_notes=?, updated_at=? WHERE entry_id=?",
                (verdict, AUDIT_BY, NOW, note, NOW, eid))
            continue
        conn.execute(
            "UPDATE staging_knowledge SET status='promoted', audit_status='approved', audit_by=?, audit_at=?, audit_notes=?, updated_at=? WHERE entry_id=?",
            (AUDIT_BY, NOW, note, NOW, eid))
        reasons.setdefault('晋升', 0)
        reasons['晋升'] += 1
        continue
    elif module in ('tcm', 'wangzhen', 'tcm/wangzhen', 'tcm/device', 'tcm-agent', 'nihaisha-nishi-tcm', 'acupuncture',
                    'huangdi-neijing', 'shanghan-lun', 'shennong-bencao'):
        verdict, note = 'rejected', '医学域条目：医学能力由 tcm 栈供给，命理 KB 不新增（G24/ADR-024，MB-K1 清零）'
    elif module == 'bazi':
        verdict, note = 'rejected', '格式损坏：content 为 JS 对象序列化残片，不可读（MB-K1 清零）'
    else:
        verdict, note = 'rejected', '域外误入：非命理非医学域（digital-workshop/lowaltitude 等，MB-K1 清零）'
    if verdict == 'rejected' and dupe:
        rejected_dupe += 1
    elif verdict == 'rejected':
        rejected_other += 1
    reasons.setdefault(note[:30], 0)
    reasons[note[:30]] += 1
    conn.execute(
        "UPDATE staging_knowledge SET status='rejected', audit_status='rejected', audit_by=?, audit_at=?, audit_notes=?, updated_at=? WHERE entry_id=?",
        (AUDIT_BY, NOW, note, NOW, eid))

conn.commit()
left = conn.execute("SELECT COUNT(*) FROM staging_knowledge WHERE status='staging'").fetchone()[0]
print(json.dumps({'晋升': promoted, '拒-重复': rejected_dupe, '拒-其他': rejected_other, '剩余staging': left},
                 ensure_ascii=False, indent=1))
for k, v in sorted(reasons.items(), key=lambda x: -x[1]):
    print(f'  {v:4d}  {k}')
conn.close()
