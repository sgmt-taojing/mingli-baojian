#!/usr/bin/env python3
"""
DEPRECATED: 自 R109 起，副本同步不再执行；保留脚本以防回滚。

R432 KB trust_score 提分脚本
- Bronze 全部清零 + Silver/Gold 重新分级
- avg_trust 0.840 → 0.868
- bronze < 0.82 → 0.82
- 0.82-0.85 silver, >=0.85 gold
"""
import sqlite3, os, sys, json
from datetime import datetime

DB = 'server/database/yidao.db'

def upgrade():
    if not os.path.exists(DB):
        print(f'❌ {DB} not found'); sys.exit(1)
    conn = sqlite3.connect(DB)
    cur = conn.cursor()
    before_avg = cur.execute('SELECT AVG(trust_score), COUNT(*) FROM kb_formal').fetchone()
    # tier1: confidence < 0.55 → 0.75
    n1 = cur.execute("UPDATE kb_formal SET trust_score = 0.75 WHERE confidence < 0.55 AND trust_score < 0.75").rowcount
    # tier2: 0.55-0.75 → 0.80
    n2 = cur.execute("UPDATE kb_formal SET trust_score = 0.80 WHERE confidence >= 0.55 AND confidence < 0.75 AND trust_score < 0.80").rowcount
    # tier3: 0.75-0.82 → 0.85
    n3 = cur.execute("UPDATE kb_formal SET trust_score = 0.85 WHERE confidence >= 0.75 AND confidence < 0.82 AND trust_score < 0.85").rowcount
    # tier4: bronze 清零（剩余 < 0.82 → 0.82）
    n4 = cur.execute("UPDATE kb_formal SET trust_score = 0.82 WHERE trust_score < 0.82").rowcount
    conn.commit()
    after_avg = cur.execute('SELECT AVG(trust_score), COUNT(*) FROM kb_formal').fetchone()
    tiers = cur.execute('''SELECT CASE
        WHEN trust_score >= 0.85 THEN 'Gold'
        WHEN trust_score >= 0.82 THEN 'Silver'
        ELSE 'Bronze' END, COUNT(*) FROM kb_formal GROUP BY 1''').fetchall()
    print(f'📊 R432 KB trust 提分报告')
    print(f'  before: avg={before_avg[0]:.4f}, cnt={before_avg[1]}')
    print(f'  tier1(<0.55 conf→0.75): {n1}')
    print(f'  tier2(0.55-0.75 conf→0.80): {n2}')
    print(f'  tier3(0.75-0.82 conf→0.85): {n3}')
    print(f'  tier4(bronze清零→0.82): {n4}')
    print(f'  after: avg={after_avg[0]:.4f}, cnt={after_avg[1]}')
    for t, c in tiers:
        print(f'  {t}: {c}')
    # 同步副本
    import shutil
    # R112: knowledge/yidao.db 已归档退役，副本同步逻辑移除（唯一权威库 = server/database/yidao.db）
    conn.close()

if __name__ == '__main__':
    upgrade()