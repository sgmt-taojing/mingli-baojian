#!/usr/bin/env python3
"""
kb-regression-test.py · KB 搜索修真前后回归测试

修真前：unicode61 分词器（中文 0 命中）
修真后：trigram 分词器 + LIKE 兜底（中文 ≥3 全量 + 2 字 LIKE 命中）

用法：python3 scripts/kb-regression-test.py
输出：training-data/kb-regression-test.json
"""

import sqlite3
import json
import time
from pathlib import Path

DB = Path('/Users/tom/kimi/projects/mingli-baojian/server/database/yidao.db')
OUT = Path('/Users/tom/kimi/projects/mingli-baojian/training-data/kb-regression-test.json')

# 从 kb_hit_log 抽取 top 100 真实用户查询
def get_user_queries(cur, limit=100):
    rows = cur.execute("""
        SELECT TRIM(query) as q, COUNT(*) as cnt, AVG(hits) as avg_hits, GROUP_CONCAT(DISTINCT module) as modules
        FROM kb_hit_log
        WHERE LENGTH(TRIM(query)) >= 2
          AND TRIM(query) NOT LIKE '%test%'
          AND TRIM(query) NOT LIKE '%session%'
          AND TRIM(query) NOT LIKE '%hi%'
          AND TRIM(query) NOT LIKE '%supertest%'
        GROUP BY TRIM(query)
        HAVING cnt >= 1
        ORDER BY cnt DESC
        LIMIT ?
    """, (limit,)).fetchall()
    return [{'query': r[0], 'count': r[1], 'old_avg_hits': r[2], 'modules': r[3]} for r in rows]

# 模拟 ai-stream-engine.js 的查询路径
def search_query(cur, query):
    """返回：(fts5_hits, like_hits, trust_formal_hits)"""
    # 1. FTS5 路径（≥3 字符才用 trigram）
    fts_hits = 0
    if len(query) >= 3:
        try:
            cur.execute("SAVEPOINT sp")
            rows = cur.execute(
                "SELECT COUNT(*) FROM kb_formal_fts WHERE kb_formal_fts MATCH ?",
                (f'"{query}"',)
            ).fetchone()
            fts_hits = rows[0] if rows else 0
            cur.execute("RELEASE sp")
        except Exception:
            cur.execute("RELEASE sp")
    
    # 2. LIKE 兜底路径（系统真实兜底逻辑）
    like_arg = f'%{query}%'
    rows = cur.execute("""
        SELECT COUNT(*) FROM kb_formal
        WHERE (title LIKE ? OR summary LIKE ? OR content LIKE ?)
          AND trust_score >= 0.4 AND status = 'formal'
    """, (like_arg, like_arg, like_arg)).fetchone()
    like_hits = rows[0] if rows else 0
    
    # 3. 全量 content LIKE（修真前的等价基线）
    rows = cur.execute("SELECT COUNT(*) FROM kb_formal WHERE content LIKE ?", (like_arg,)).fetchone()
    content_like_hits = rows[0] if rows else 0
    
    return {
        'fts_hits': fts_hits,
        'like_hits': like_hits,
        'content_like_hits': content_like_hits,
    }


def main():
    if not DB.exists():
        print(f'[ERROR] DB not found: {DB}')
        return
    
    conn = sqlite3.connect(str(DB), timeout=30)
    cur = conn.cursor()
    
    print(f'[regress] 抽取用户真实查询…')
    queries = get_user_queries(cur, limit=100)
    print(f'[regress] 抽取到 {len(queries)} 条查询')
    
    print(f'[regress] 修真前后对比测试…')
    results = []
    for i, q in enumerate(queries):
        query = q['query']
        t0 = time.time()
        try:
            search = search_query(cur, query)
        except Exception as e:
            search = {'fts_hits': 0, 'like_hits': 0, 'content_like_hits': 0, 'error': str(e)[:50]}
        elapsed = time.time() - t0
        
        # 修真前 = content_like_hits（无 FTS5、无 trust 过滤）
        # 修真后 = like_hits（LIKE 兜底 + trust ≥ 0.4 + formal 状态）
        results.append({
            'query': query,
            'search_count': q['count'],
            'old_avg_hits': q['old_avg_hits'],
            'modules': q['modules'],
            'before_content_like': search['content_like_hits'],
            'after_like_fallback': search['like_hits'],
            'after_fts_trigram': search['fts_hits'],
            'query_ms': round(elapsed * 1000, 2),
        })
        
        if (i + 1) % 20 == 0:
            print(f'[regress] {i+1}/{len(queries)}')
    
    # 统计
    total_queries = len(results)
    # 修真前平均命中（按用户实际查询次数加权）
    weighted_before = sum(r['before_content_like'] * r['search_count'] for r in results)
    weighted_after = sum(r['after_like_fallback'] * r['search_count'] for r in results)
    
    # 修真前用户实际 avg_hits
    user_avg_before = sum(r['old_avg_hits'] * r['search_count'] for r in results) / sum(r['search_count'] for r in results)
    
    # 修真后预期（取 max of FTS + LIKE 兜底）
    user_avg_after_est = sum(
        max(r['after_fts_trigram'], r['after_like_fallback']) * r['search_count']
        for r in results
    ) / sum(r['search_count'] for r in results)
    
    # 改善统计
    improved = sum(1 for r in results if r['after_fts_trigram'] + r['after_like_fallback'] > r['before_content_like'])
    degraded = sum(1 for r in results if r['after_fts_trigram'] + r['after_like_fallback'] < r['before_content_like'])
    stable = total_queries - improved - degraded
    
    # 修真前低命中查询修真后命中情况
    low_hit_queries = [r for r in results if r['old_avg_hits'] < 3]
    low_after_recovered = sum(1 for r in low_hit_queries if r['after_fts_trigram'] + r['after_like_fallback'] >= 3)
    
    summary = {
        'total_queries': total_queries,
        'user_avg_hits_before': round(user_avg_before, 2),
        'user_avg_hits_after_est': round(user_avg_after_est, 2),
        'improvement_pct': round((user_avg_after_est - user_avg_before) / max(user_avg_before, 0.1) * 100, 1),
        'improved_count': improved,
        'degraded_count': degraded,
        'stable_count': stable,
        'low_hit_queries_count': len(low_hit_queries),
        'low_hit_recovered_count': low_after_recovered,
        'low_hit_recovery_pct': round(low_after_recovered / max(len(low_hit_queries), 1) * 100, 1),
    }
    
    print(f'\n[regress] === 修真前后对比汇总 ===')
    print(f'  总查询: {total_queries}')
    print(f'  修真前用户实际 avg_hits: {summary["user_avg_hits_before"]}')
    print(f'  修真后预期 avg_hits: {summary["user_avg_hits_after_est"]}')
    print(f'  改善: {summary["improvement_pct"]}%')
    print(f'  修真前低命中查询 (avg_hits<3): {len(low_hit_queries)} 条')
    print(f'  其中修真后命中 ≥3: {low_after_recovered} 条 ({summary["low_hit_recovery_pct"]}%)')
    
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open('w') as f:
        json.dump({'summary': summary, 'queries': results}, f, ensure_ascii=False, indent=2)
    
    print(f'\n[regress] 详细结果: {OUT}')
    
    conn.close()


if __name__ == '__main__':
    main()