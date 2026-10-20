#!/usr/bin/env python3
"""
命理宝鉴 · KB 反馈聚合引擎 v1.0
将 kb_feedback 原始反馈按 entry_id 聚合为 score_agg，写入 kb_fb_aggregate 表，
供 KB 检索时排序加权使用。

流程：
1. 扫描 kb_feedback（最近 30 天）
2. 按 (entry_id, module) 分组，统计 up / down / total / ratio
3. 写入 kb_fb_aggregate 表（覆盖式 upsert）
4. 输出聚合报告

运行方式：
  python3 scripts/kb-fb-aggregate.py [--days 30] [--dry-run]
"""

import json
import sqlite3
import os
import sys
import argparse
from datetime import datetime, timedelta
from collections import defaultdict

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'server', 'database', 'yidao.db')
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'DELIVERY')


def ensure_aggregate_table(db):
    """确保 kb_fb_aggregate 表存在"""
    db.execute('''
        CREATE TABLE IF NOT EXISTS kb_fb_aggregate (
            entry_id      TEXT PRIMARY KEY,
            module        TEXT,
            up_count      INTEGER DEFAULT 0,
            down_count    INTEGER DEFAULT 0,
            total_count   INTEGER DEFAULT 0,
            ratio         REAL DEFAULT 0.5,
            last_feedback TEXT,
            updated_at    TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    db.execute('CREATE INDEX IF NOT EXISTS idx_kb_fb_agg_mod ON kb_fb_aggregate(module)')
    db.execute('CREATE INDEX IF NOT EXISTS idx_kb_fb_agg_ratio ON kb_fb_aggregate(ratio)')
    db.commit()


def load_feedback(db, days=30):
    """加载最近 N 天反馈"""
    cutoff = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d %H:%M:%S')
    cur = db.execute('''
        SELECT entry_id, module, score, source, created_at
        FROM kb_feedback
        WHERE created_at >= ?
          AND entry_id IS NOT NULL
          AND entry_id != ''
        ORDER BY created_at DESC
    ''', (cutoff,))
    return cur.fetchall()


def aggregate(rows):
    """聚合：按 entry_id 分组"""
    agg = defaultdict(lambda: {'up': 0, 'down': 0, 'mod': '', 'last': ''})
    for entry_id, module, score, source, created_at in rows:
        # 跳过 None
        if not entry_id:
            continue
        key = entry_id
        a = agg[key]
        if score and score > 0:
            a['up'] += 1
        elif score and score < 0:
            a['down'] += 1
        if not a['mod']:
            a['mod'] = module or 'unknown'
        if not a['last'] or str(created_at) > str(a['last']):
            a['last'] = created_at
    return agg


def upsert(db, entry_id, data, dry_run=False):
    """写入聚合结果"""
    total = data['up'] + data['down']
    ratio = data['up'] / total if total > 0 else 0.5
    if dry_run:
        return ratio, total
    db.execute('''
        INSERT INTO kb_fb_aggregate (entry_id, module, up_count, down_count, total_count, ratio, last_feedback, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now','localtime'))
        ON CONFLICT(entry_id) DO UPDATE SET
            module=excluded.module,
            up_count=excluded.up_count,
            down_count=excluded.down_count,
            total_count=excluded.total_count,
            ratio=excluded.ratio,
            last_feedback=excluded.last_feedback,
            updated_at=excluded.updated_at
    ''', (entry_id, data['mod'], data['up'], data['down'], total, ratio, data['last']))
    return ratio, total


def report(agg_rows, dry_run=False):
    """输出聚合报告"""
    now = datetime.now().strftime('%Y%m%d-%H%M%S')
    out_path = os.path.join(OUTPUT_DIR, f'kb-fb-aggregate-{now}.json')
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR, exist_ok=True)

    summary = {
        'generated_at': now,
        'total_entries': len(agg_rows),
        'top_helpful': [],   # ratio 最高
        'top_unhelpful': [], # ratio 最低
        'coldest': []        # 无反馈的热门（KB 引用但用户没点反馈）
    }
    sorted_by_ratio = sorted(agg_rows, key=lambda x: x[1], reverse=True)
    summary['top_helpful'] = [
        {'entry_id': r[0], 'module': r[2], 'ratio': round(r[1], 3), 'total': r[3]}
        for r in sorted_by_ratio[:10] if r[3] >= 3
    ]
    summary['top_unhelpful'] = [
        {'entry_id': r[0], 'module': r[2], 'ratio': round(r[1], 3), 'total': r[3]}
        for r in sorted_by_ratio[-10:] if r[3] >= 3
    ][::-1]

    if not dry_run:
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)
    print(f'报告写入: {out_path}')
    return summary


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--days', type=int, default=30, help='回溯天数')
    p.add_argument('--dry-run', action='store_true')
    args = p.parse_args()

    db = sqlite3.connect(DB_PATH)
    ensure_aggregate_table(db)

    rows = load_feedback(db, args.days)
    print(f'加载反馈 {len(rows)} 条（{args.days} 天内）')
    if not rows:
        print('无反馈数据，跳过')
        return 0

    agg = aggregate(rows)
    print(f'聚合到 {len(agg)} 个唯一 entry_id')

    results = []
    for entry_id, data in agg.items():
        ratio, total = upsert(db, entry_id, data, dry_run=args.dry_run)
        results.append((entry_id, ratio, data['mod'], total))

    if not args.dry_run:
        db.commit()
    summary = report(results, dry_run=args.dry_run)
    print(f'  累计聚合: {summary["total_entries"]} 条')
    print(f'  高赞条目: {len(summary["top_helpful"])}')
    print(f'  低赞条目: {len(summary["top_unhelpful"])}')

    db.close()
    return 0


if __name__ == '__main__':
    sys.exit(main())