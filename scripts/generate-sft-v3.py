#!/usr/bin/env python3
"""
SFT v3 滚动生成器
═══════════════════════════════════════════════════════════════
版本: v3.0 (2026-08-08 R476)
输入: KB 热门查询 + KB 高质量条目
输出: SFT 训练对（messages 格式）

特性:
- 从 kb_hit_log 提取高频查询作为 user prompt
- 从 kb_formal 提取 ≥0.85 trust + 长度>300 的条目作为 assistant 答案
- 自动模板填充（4 套角色 system prompt）
- 自动格式化 + 去重
"""
import sqlite3
import json
import os
import sys
from collections import Counter, defaultdict
from datetime import datetime

DB_PATH = 'server/database/yidao.db'
OUTPUT_PATH = 'training-data/sft-v3-20260808.jsonl'
SYSTEM_PROMPTS = [
    "你是命理宝鉴的AI助手，基于知识库提供专业、准确的传统智慧解答。回答须标注知识来源和置信度。仅供参考，不构成专业建议。",
    "你是融合中医与周易的智能助手。请基于知识库回答，保持专业但通俗。所有内容仅供学习参考。",
    "你是一位资深命理师，擅长八字、紫微、奇门、六壬、梅花易数、玄空风水等传统数术。请给出专业分析，并注明出处。",
    "你是一位中医专家，精通《黄帝内经》《伤寒论》《金匮要略》《神农本草》等经典。请基于知识库给出严谨的辨证思路。",
]

def query_top_queries(limit=100):
    """从 kb_hit_log 取高频查询"""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    try:
        rows = cur.execute("""
            SELECT query, module, COUNT(*) as cnt
            FROM kb_hit_log
            GROUP BY query
            HAVING cnt >= 5
            ORDER BY cnt DESC
            LIMIT ?
        """, (limit,)).fetchall()
    except sqlite3.OperationalError:
        rows = []
    conn.close()
    return rows

def fetch_kb_entries(modules=None, min_trust=0.85, min_len=300, limit_per_module=20):
    """从 kb_formal 提取条目"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    
    entries = []
    if modules:
        for mod in modules:
            try:
                rows = cur.execute("""
                    SELECT entry_id, module, title, content, COALESCE(CAST(trust_score AS REAL), 0.85) as trust_score
                    FROM kb_formal
                    WHERE module = ?
                      AND COALESCE(CAST(trust_score AS REAL), 0.85) >= ?
                      AND length(content) >= ?
                    ORDER BY trust_score DESC, RANDOM()
                    LIMIT ?
                """, (mod, min_trust, min_len, limit_per_module)).fetchall()
            except sqlite3.OperationalError:
                continue
            entries.extend(rows)
    conn.close()
    return entries

def build_user_prompts(query, module):
    """基于查询生成多样化的 user prompt 模板"""
    base = query.strip()
    templates = [
        base,
        f"请解释「{base}」",
        f"在{module}体系中，{base}是什么意思？",
        f"什么是{base}？请详细说明",
        f"关于{base}，有什么需要注意的？",
        f"{base}的基本原理是什么？",
        f"请举例说明{base}",
        f"如何理解{base}？",
    ]
    return templates

def build_assistant_content(entry):
    """构建 assistant 答案（带来源标注）"""
    source = f"来源：{entry['title']}\n\n"
    content = entry['content']
    # 限制长度（避免过长答案）
    if len(content) > 1500:
        content = content[:1500] + "..."
    return source + content

def generate_sft_pairs(top_queries, kb_entries):
    """生成 SFT 对"""
    pairs = []
    seen_queries = set()
    
    # 按模块索引 KB
    kb_by_module = defaultdict(list)
    for e in kb_entries:
        kb_by_module[e['module']].append(e)
    
    for query, module, cnt in top_queries:
        if query in seen_queries:
            continue
        seen_queries.add(query)
        
        # 找该模块的最佳条目
        candidates = kb_by_module.get(module or '', [])
        if not candidates:
            # 模糊匹配
            for mod, entries in kb_by_module.items():
                if module and (module in mod or mod in module):
                    candidates = entries
                    break
        if not candidates:
            continue
        
        # 选 trust 最高的一条
        entry = max(candidates, key=lambda e: e['trust_score'])
        
        # 多样化 user prompt
        prompts = build_user_prompts(query, module)
        # 多样化 system prompt
        sys_idx = hash(query) % len(SYSTEM_PROMPTS)
        
        for user_msg in prompts[:4]:  # 每个 query 生成 4 个变体
            pair = {
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPTS[sys_idx]},
                    {"role": "user", "content": user_msg},
                    {"role": "assistant", "content": build_assistant_content(entry)},
                ],
                "metadata": {
                    "source_module": module,
                    "source_title": entry['title'],
                    "query_count": cnt,
                    "trust_score": entry['trust_score'],
                    "generated_at": datetime.now().isoformat(),
                }
            }
            pairs.append(pair)
    
    return pairs

def main():
    print("═══ SFT v3 滚动生成器 ═══")
    
    # 1. 取热门查询
    print("[1/4] 提取高频查询...")
    top_queries = query_top_queries(limit=150)
    print(f"  高频查询: {len(top_queries)} 个")
    if not top_queries:
        print("  ⚠️ kb_hit_log 为空，使用 KB 标题作为种子")
        # 从 KB 标题生成查询
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        rows = cur.execute("""
            SELECT DISTINCT title, module FROM kb_formal
            WHERE trust_score >= 0.85 AND length(content) >= 300
            ORDER BY RANDOM() LIMIT 100
        """).fetchall()
        top_queries = [(r['title'], r['module'], 1) for r in rows]
        conn.close()
        print(f"  KB 种子查询: {len(top_queries)} 个")
    
    # 2. 取 KB 条目（覆盖命中模块）
    print("[2/4] 提取 KB 条目...")
    modules = list(set(q[1] for q in top_queries))
    entries = fetch_kb_entries(modules=modules, min_trust=0.85, min_len=300, limit_per_module=15)
    print(f"  KB 条目: {len(entries)} 条（覆盖 {len(modules)} 模块）")
    
    if not entries:
        print("❌ 无 KB 条目，退出")
        return 1
    
    # 3. 生成 SFT 对
    print("[3/4] 生成 SFT 对...")
    pairs = generate_sft_pairs(top_queries, entries)
    print(f"  生成 SFT 对: {len(pairs)} 条")
    
    # 4. 写入文件
    print("[4/4] 写入文件...")
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        for p in pairs:
            f.write(json.dumps(p, ensure_ascii=False) + '\n')
    
    size = os.path.getsize(OUTPUT_PATH)
    print(f"\n✅ {OUTPUT_PATH}")
    print(f"  size: {size//1024} KB")
    print(f"  pairs: {len(pairs)}")
    print(f"  modules: {len(modules)}")
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
