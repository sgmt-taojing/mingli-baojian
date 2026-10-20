#!/usr/bin/env python3
"""
generate-feedback-driven-sft.py · 反馈驱动 SFT Case 生成器

从 kb_hit_log 中的高频低命中查询提取训练 Case。
这些查询代表了用户真实需求但 KB 覆盖不足的领域。

用法：python3 scripts/generate-feedback-driven-sft.py
输出：training-data/sft-gold-cases/0005-feedback-driven.jsonl
"""

import sqlite3
import json
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent.parent
DB_PATH = PROJECT_DIR / 'server' / 'database' / 'yidao.db'
OUT_DIR = PROJECT_DIR / 'training-data' / 'sft-gold-cases'

FORBIDDEN = ['一定', '绝对', '命中注定', '必死', '必灾', '必凶', '癌症', '肿瘤', '死刑', '死期']

def main():
    if not DB_PATH.exists():
        print(f"[ERROR] DB not found: {DB_PATH}")
        return
    
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    
    # 1. 从 kb_hit_log 提取高频低命中查询
    rows = cur.execute("""
        SELECT 
            TRIM(query) as q,
            COUNT(*) as cnt,
            AVG(hits) as avg_hits,
            module
        FROM kb_hit_log
        WHERE LENGTH(TRIM(query)) >= 2
          AND TRIM(query) NOT LIKE '%test%'
          AND TRIM(query) NOT LIKE '%session%'
          AND TRIM(query) NOT LIKE '%supertest%'
          AND TRIM(query) NOT LIKE '%hi%'
        GROUP BY TRIM(query)
        HAVING cnt >= 2
        ORDER BY cnt DESC
        LIMIT 200
    """).fetchall()
    
    print(f"[feedback] 高频查询提取：{len(rows)} 条")
    
    cases = []
    stats = {'exact_match': 0, 'partial_match': 0, 'no_match': 0}
    
    for row in rows:
        query = row['q']
        module = row['module'] or ''
        cnt = row['cnt']
        
        # 跳过无意义查询
        if len(query) < 2 or query.lower() in ('test', 'hi', 'ok', 'test session_id e2e'):
            continue
        
        # 2. 尝试从 KB 检索匹配条目
        # 先精确匹配 title
        kb = cur.execute(
            "SELECT entry_id, title, content, module, src_id FROM kb_formal WHERE title LIKE ? AND length(content)>30 LIMIT 3",
            (f'%{query}%',)
        ).fetchall()
        
        if not kb:
            # 模糊匹配 keywords
            kb = cur.execute(
                "SELECT entry_id, title, content, module, src_id FROM kb_formal WHERE keywords LIKE ? AND length(content)>30 LIMIT 3",
                (f'%{query}%',)
            ).fetchall()
        
        if not kb:
            # 内容模糊匹配
            kb = cur.execute(
                "SELECT entry_id, title, content, module, src_id FROM kb_formal WHERE content LIKE ? AND length(content)>30 LIMIT 2",
                (f'%{query}%',)
            ).fetchall()
        
        if not kb:
            stats['no_match'] += 1
            # 无 KB 匹配：生成「知识缺口提醒」类 Case
            # 这些是真正需要补充知识的领域
            cases.append({
                'src_id': f'feedback-gap-{query[:20]}',
                'module': module,
                'scene': '知识缺口',
                'depth': '中',
                'messages': [
                    {'role': 'system', 'content': '你是一个专业的命理与中医知识助手。对于不确定的内容要诚实说明，不做编造。'},
                    {'role': 'user', 'content': query},
                    {'role': 'assistant', 'content': f'关于「{query}」，目前知识库中的相关资料还不够充分。建议您：\n\n• 提供更多背景信息（如出生时间、具体问题场景）\n• 咨询专业的命理师或中医师获取个性化分析\n\n> 本平台持续学习中，会逐步补充相关内容。'},
                ]
            })
            continue
        
        stats['exact_match' if len(kb) >= 2 else 'partial_match'] += 1
        
        # 3. 有 KB 匹配：生成深度问答 Case
        for kb_row in kb[:2]:  # 每个查询最多取 2 条 KB
            title = kb_row['title'] or query
            content = kb_row['content'] or ''
            eid = kb_row['entry_id'] or 'unknown'
            
            if len(content) > 400:
                cut = content[:400]
                last_p = max(cut.rfind('。'), cut.rfind('；'))
                content = cut[:last_p + 1] if last_p > 200 else cut + '...'
            
            # 合规清洗
            for w in FORBIDDEN:
                content = content.replace(w, {'一定':'通常','绝对':'一般'}.get(w, ''))
            
            cases.append({
                'src_id': f'feedback-{query[:15]}-{eid[:8]}',
                'module': kb_row['module'],
                'scene': '高频问答',
                'depth': '深',
                'messages': [
                    {'role': 'system', 'content': '你是一个专业的命理与中医知识助手，回答基于知识库内容，客观中立，不做绝对判断。'},
                    {'role': 'user', 'content': query},
                    {'role': 'assistant', 'content': f'## {title}\n\n{content}\n\n> 以上内容来自知识库，仅供学习参考。如需个性化分析，请提供详细信息。'},
                ]
            })
    
    conn.close()
    
    # 去重
    seen = set()
    unique = []
    for c in cases:
        if c['src_id'] not in seen:
            seen.add(c['src_id'])
            unique.append(c)
    
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_file = OUT_DIR / '0005-feedback-driven.jsonl'
    
    with out_file.open('w') as f:
        for c in unique:
            f.write(json.dumps(c, ensure_ascii=False) + '\n')
    
    print(f"[feedback] === 汇总 ===")
    print(f"[feedback] 总生成：{len(unique)} 条")
    print(f"[feedback] 匹配统计：精确/模糊 {stats['exact_match']} / {stats['partial_match']} · 缺口 {stats['no_match']}")
    print(f"[feedback] 输出：{out_file}")


if __name__ == '__main__':
    main()
