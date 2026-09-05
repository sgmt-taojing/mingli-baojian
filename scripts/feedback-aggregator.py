#!/usr/bin/env python3
"""
feedback-aggregator.py · 反馈流周聚合器

任务：每周一 06:00 跑一次
1. 从 yidao.db 的 feedback + kb_feedback + kb_hit_log 三表采集上周记录
2. 按 query 聚合 + 评分
3. 产出 JSONL 到 training-data/feedback-weekly/YYYY-WW.jsonl
4. 高质量条目标记为 SFT 黄金 case 候选
5. 零命中条目标记为 KB 缺口候选

用法：python3 scripts/feedback-aggregator.py [week_id]
"""

import sqlite3
from yidao_safe import safe_close  # R-WALF 预防：写完主动 checkpoint 再关闭
import json
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent.parent
DB_CANDIDATES = [
    'server/database/yidao.db',
    'data/mingli.db',
    'server/data/mingli.db',
    'data/yidao.db',
]
OUT_DIR = PROJECT_DIR / 'training-data' / 'feedback-weekly'


def iso_week(date=None):
    """ISO week number"""
    if date is None:
        date = datetime.now()
    iso = date.isocalendar()
    return f"{iso[0]}-W{iso[1]:02d}"


def find_db():
    for p in DB_CANDIDATES:
        full = PROJECT_DIR / p
        if full.exists() and full.stat().st_size > 0:
            return str(full)
    return None


def main():
    week_id = sys.argv[1] if len(sys.argv) > 1 else iso_week()
    print(f"[feedback-aggregator] Week: {week_id}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_file = OUT_DIR / f"{week_id}.jsonl"

    db_path = find_db()
    if not db_path:
        print("[skip] yidao.db 不存在，写入空标记")
        with open(out_file, 'w', encoding='utf-8') as f:
            f.write(json.dumps({'week': week_id, 'status': 'empty',
                                'note': '本周无反馈数据或 yidao.db 不存在'},
                              ensure_ascii=False) + '\n')
        return

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # R108-E 修真:DB 时间戳为 UTC(CURRENT_TIMESTAMP 空格格式 与 JS toISOString 的 T 格式混存),
    # 原按本地时间(UTC+8)截断 → 窗口偏移 8h;且 T 格式与空格格式字符串比较不一致。
    # 统一:UTC now + REPLACE(created_at,'T',' ') 归一两种格式后比较。
    seven_days_ago = (datetime.now(timezone.utc) - timedelta(days=7)).strftime('%Y-%m-%d %H:%M:%S')

    # ---- 1. kb_feedback 表（AI 助手点赞/点踩）----
    feedback_items = []
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='kb_feedback'")
    if cur.fetchone():
        cur.execute("""
            SELECT query, entry_id, source, score, comment, module, created_at
            FROM kb_feedback
            WHERE REPLACE(created_at,'T',' ') >= ?
            ORDER BY created_at DESC
        """, (seven_days_ago,))
        for q, eid, src, score, cmt, mod, ts in cur.fetchall():
            feedback_items.append({
                'query': q, 'entry_id': eid, 'source': src or 'ai-assistant',
                'score': score, 'comment': cmt, 'module': mod,
                'created_at': ts, 'type': 'kb_feedback'
            })
    print(f"[feedback-aggregator] kb_feedback 记录：{len(feedback_items)} 条")

    # ---- 2. feedback 表（用户通用反馈）----
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='feedback'")
    if cur.fetchone():
        cur.execute("""
            SELECT id, user_id, type, target, content, created_at
            FROM feedback
            WHERE REPLACE(created_at,'T',' ') >= ?
            ORDER BY created_at DESC
        """, (seven_days_ago,))
        for fid, uid, ftype, target, content, ts in cur.fetchall():
            feedback_items.append({
                'query': content[:200], 'feedback_type': ftype, 'target': target,
                'user_id': uid, 'created_at': ts, 'type': 'user_feedback',
                'score': 1 if ftype == 'praise' else (-1 if ftype == 'bug' else 0)
            })
    print(f"[feedback-aggregator] feedback 表已合并")

    # ---- 3. kb_hit_log 零命中查询（KB 缺口信号）----
    kb_gaps = []
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='kb_hit_log'")
    if cur.fetchone():
        cur.execute("""
            SELECT query, hits, module, source, response_time, created_at
            FROM kb_hit_log
            WHERE REPLACE(created_at,'T',' ') >= ? AND hits = 0
            ORDER BY created_at DESC
        """, (seven_days_ago,))
        for q, hits, mod, src, rt, ts in cur.fetchall():
            kb_gaps.append({
                'query': q, 'hits': hits, 'module': mod or 'unknown',
                'source': src or 'unknown', 'created_at': ts, 'type': 'kb_gap'
            })
    print(f"[feedback-aggregator] KB 零命中查询：{len(kb_gaps)} 条")

    # ---- 4. kb_hit_log 正命中查询（高质量信号）----
    kb_hits = []
    if cur.fetchone() or True:  # 表已确认存在
        cur.execute("""
            SELECT query, hits, module, source, response_time, created_at
            FROM kb_hit_log
            WHERE REPLACE(created_at,'T',' ') >= ? AND hits > 0
            ORDER BY created_at DESC
        """, (seven_days_ago,))
        for q, hits, mod, src, rt, ts in cur.fetchall():
            kb_hits.append({
                'query': q, 'hits': hits, 'module': mod or 'unknown',
                'source': src, 'response_time': rt, 'created_at': ts,
                'type': 'kb_hit'
            })
    print(f"[feedback-aggregator] KB 正命中查询：{len(kb_hits)} 条")

    safe_close(conn)

    # ---- 5. 聚合 ----
    if not feedback_items and not kb_gaps and not kb_hits:
        with open(out_file, 'w', encoding='utf-8') as f:
            f.write(json.dumps({'week': week_id, 'status': 'no_data',
                                'note': '本周无反馈'}, ensure_ascii=False) + '\n')
        print("[feedback-aggregator] 本周无数据")
        return

    # 按 query 聚合反馈
    agg = {}
    for item in feedback_items:
        q = item['query']
        if q not in agg:
            agg[q] = {'query': q, 'positive': 0, 'negative': 0, 'neutral': 0,
                      'comments': [], 'modules': set(), 'entry_ids': set(),
                      'sources': set(), 'timestamps': []}
        score = item.get('score', 0)
        if score == 1:
            agg[q]['positive'] += 1
        elif score == -1:
            agg[q]['negative'] += 1
        else:
            agg[q]['neutral'] += 1
        if item.get('comment'):
            agg[q]['comments'].append(item['comment'])
        if item.get('module'):
            agg[q]['modules'].add(item['module'])
        if item.get('entry_id'):
            agg[q]['entry_ids'].add(item['entry_id'])
        if item.get('source'):
            agg[q]['sources'].add(item['source'])
        if item.get('feedback_type'):
            agg[q]['sources'].add(item['feedback_type'])
        agg[q]['timestamps'].append(item.get('created_at', ''))

    high_quality = 0
    with open(out_file, 'w', encoding='utf-8') as f:
        # 写聚合反馈
        for item in agg.values():
            total = item['positive'] + item['negative'] + item['neutral']
            score = (item['positive'] - item['negative']) / total if total else 0
            item['total'] = total
            item['score'] = round(score, 3)
            item['week'] = week_id
            item['modules'] = sorted(item['modules'])
            item['entry_ids'] = sorted(item['entry_ids'])
            item['sources'] = sorted(item['sources'])
            item['high_quality'] = item['positive'] >= 1 and score >= 0.5
            item['record_type'] = 'feedback_agg'
            if item['high_quality']:
                high_quality += 1
            f.write(json.dumps(item, ensure_ascii=False) + '\n')

        # 写 KB 缺口
        for gap in kb_gaps:
            gap['week'] = week_id
            gap['record_type'] = 'kb_gap'
            f.write(json.dumps(gap, ensure_ascii=False) + '\n')

        # 写 KB 命中统计
        for hit in kb_hits:
            hit['week'] = week_id
            hit['record_type'] = 'kb_hit'
            f.write(json.dumps(hit, ensure_ascii=False) + '\n')

    total_records = len(agg) + len(kb_gaps) + len(kb_hits)
    print(f"[feedback-aggregator] 聚合反馈 {len(agg)} 个 query")
    print(f"[feedback-aggregator] 高质量候选：{high_quality} 个")
    print(f"[feedback-aggregator] KB 缺口：{len(kb_gaps)} 个")
    print(f"[feedback-aggregator] KB 命中：{len(kb_hits)} 个")
    print(f"[feedback-aggregator] 总记录：{total_records} 条")
    print(f"[feedback-aggregator] 输出：{out_file}")


if __name__ == '__main__':
    main()
