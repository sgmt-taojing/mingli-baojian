#!/usr/bin/env python3
"""
R634: 反馈闭环 - 提升 KB trust 校准
"""
import sqlite3
import json
import os
from datetime import datetime

DB_PATH = "server/database/yidao.db"
OUTPUT = ".openclaw/tmp/trust_calibration.json"

def main():
    if not os.path.exists(DB_PATH):
        print(f"  ⚠️ DB not found: {DB_PATH}")
        return
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # 检查表结构
    tables = {}
    for table in ['kb_hit_log', 'kb_feedback', 'knowledge_base', 'kb_entries']:
        try:
            c.execute(f"PRAGMA table_info({table})")
            cols = [row[1] for row in c.fetchall()]
            tables[table] = cols
        except:
            pass
    
    print(f"  📋 表结构:")
    for t, cols in tables.items():
        print(f"    {t}: {cols}")
    
    # 根据实际列名查询
    high_hits = []
    high_ratings = []
    low_ratings = []
    
    if 'kb_hit_log' in tables:
        cols = tables['kb_hit_log']
        # 尝试不同列名
        for col_name in ['query', 'search_term', 'q', 'keyword']:
            if col_name in cols:
                q_col = col_name
                break
        else:
            q_col = cols[0] if cols else 'query'
        
        for count_col in ['hit_count', 'count', 'hits']:
            if count_col in cols:
                break
        else:
            count_col = '1'
        
        try:
            c.execute(f"""
                SELECT {q_col}, {count_col}
                FROM kb_hit_log
                WHERE {count_col} >= 5
                ORDER BY {count_col} DESC
                LIMIT 100
            """)
            high_hits = c.fetchall()
        except Exception as e:
            print(f"  ⚠️ kb_hit_log query failed: {e}")
    
    if 'kb_feedback' in tables:
        cols = tables['kb_feedback']
        kb_id_col = None
        for col in ['kb_id', 'entry_id', 'id']:
            if col in cols:
                kb_id_col = col
                break
        
        rating_col = None
        for col in ['rating', 'score', 'value']:
            if col in cols:
                rating_col = col
                break
        
        query_col = None
        for col in ['query', 'search_term', 'q']:
            if col in cols:
                query_col = col
                break
        
        if kb_id_col and rating_col:
            try:
                c.execute(f"""
                    SELECT {kb_id_col}, {query_col or 'query'}, {rating_col}
                    FROM kb_feedback
                    WHERE {rating_col} >= 4
                    ORDER BY rowid DESC
                    LIMIT 100
                """)
                high_ratings = c.fetchall()
                
                c.execute(f"""
                    SELECT {kb_id_col}, {query_col or 'query'}, {rating_col}
                    FROM kb_feedback
                    WHERE {rating_col} <= 2
                    ORDER BY rowid DESC
                    LIMIT 50
                """)
                low_ratings = c.fetchall()
            except Exception as e:
                print(f"  ⚠️ kb_feedback query failed: {e}")
    
    stats = {
        "timestamp": datetime.now().isoformat(),
        "tables_found": list(tables.keys()),
        "high_hits_count": len(high_hits),
        "high_ratings_count": len(high_ratings),
        "low_ratings_count": len(low_ratings),
        "trust_calibration": {
            "boost": [
                {"kb_id": str(row[0]), "query": str(row[1]) if len(row) > 1 else "", "delta": 0.05}
                for row in high_ratings if row[0]
            ],
            "demote": [
                {"kb_id": str(row[0]), "query": str(row[1]) if len(row) > 1 else "", "delta": -0.05}
                for row in low_ratings if row[0]
            ]
        }
    }
    
    os.makedirs(os.path.dirname(OUTPUT) or '.', exist_ok=True)
    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)
    
    print(f"  ✅ 高频命中: {len(high_hits)} 条")
    print(f"  ✅ 高评分反馈: {len(high_ratings)} 条")
    print(f"  ⚠️ 低评分反馈: {len(low_ratings)} 条")
    print(f"  📄 校准结果: {OUTPUT}")
    
    conn.close()

if __name__ == "__main__":
    main()
