#!/usr/bin/env python3
"""
fix-kb-keywords.py · KB 关键词覆盖修复 + FTS5 中文搜索优化

问题：
1. FTS5 默认不支持中文分词，「应爻」搜索返回 0 条（但 content LIKE 有 58 条）
2. keywords 字段 6.2% 为空
3. kb_hit_log 大量低命中查询

修复：
1. 重建 kb_formal_fts 使用 unicode61 分词器（支持中文二字组）
2. 为 keywords 空缺的条目从 title + content 自动提取关键词
3. 在 kb_formal_fts 中额外索引 title + keywords 字段
"""

import sqlite3
import re
import json
from pathlib import Path
from collections import Counter

DB = Path('/Users/tom/kimi/projects/mingli-baojian/server/database/yidao.db')

def extract_keywords(title, content, module, max_kw=10):
    """从标题和内容中提取关键词"""
    keywords = []
    
    # 1. 标题本身就是最好的关键词
    if title:
        # 标题分词：按标点分割，取有意义的片段
        parts = re.split(r'[·，。、：；（）()\[\]【】\s]+', title)
        keywords.extend([p.strip() for p in parts if len(p.strip()) >= 2 and len(p.strip()) <= 10])
    
    # 2. 从内容中提取高频二字组/三字组
    # 只提取命理/中医领域常见的组合
    DOMAIN_PATTERNS = [
        r'[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]',  # 天干地支
        r'[金木水火土][弱旺相死休囚]',  # 五行状态
        r'[十][神]',  # 十神
        r'[太阳太阴巨门天机天梁七杀破军左辅右弼文昌文曲廉贞天府天相贪狼武曲紫微]',  # 紫微星
        r'[应世][爻]',  # 六爻
        r'[用神忌神喜神仇神]',  # 用神体系
        r'[大运流年]',  # 运势
        r'[风寒暑湿燥火][\u4e00-\u9fff]{0,3}',  # 六淫
        r'[\u4e00-\u9fff]{2,4}[汤丸散丹膏]',  # 方剂名
        r'[肝心脾肺肾][\u4e00-\u9fff]{0,3}[虚实]',  # 脏腑虚实
        r'[\u4e00-\u9fff]{2,4}[穴]',  # 穴位名
    ]
    
    for pattern in DOMAIN_PATTERNS:
        matches = re.findall(pattern, content[:2000])
        keywords.extend(matches[:3])  # 每类取前 3 个
    
    # 3. 从内容首段提取关键名词
    first_para = content[:500]
    # 简单二字组频率统计
    bigrams = re.findall(r'[\u4e00-\u9fff]{2}', first_para)
    counter = Counter(bigrams)
    # 过滤过于通用的词
    STOPWORDS = {'的是', '在后', '为一', '表示', '这个', '就是', '可以', '因为', '所以', '如果'}
    for word, cnt in counter.most_common(15):
        if word not in STOPWORDS and cnt >= 2 and word not in keywords:
            keywords.append(word)
    
    # 去重 + 截取
    seen = set()
    unique = []
    for kw in keywords:
        if kw not in seen:
            seen.add(kw)
            unique.append(kw)
        if len(unique) >= max_kw:
            break
    
    return ', '.join(unique)


def main():
    if not DB.exists():
        print(f"[ERROR] DB not found: {DB}")
        return
    
    # 备份
    import shutil
    backup = DB.parent / f'yidao.db.bak-kw-fix-{__import__("datetime").datetime.now().strftime("%Y%m%d%H%M")}'
    shutil.copy2(str(DB), str(backup))
    print(f"[fix] 备份: {backup}")
    
    conn = sqlite3.connect(str(DB))
    cur = conn.cursor()
    
    # 1. 填充 keywords 空缺
    rows = cur.execute("SELECT rowid, entry_id, title, content, module, keywords FROM kb_formal WHERE keywords IS NULL OR keywords = ''").fetchall()
    print(f"[fix] keywords 空缺: {len(rows)} 条")
    
    updated = 0
    for rowid, entry_id, title, content, module, old_kw in rows:
        kw = extract_keywords(title or '', content or '', module or '')
        if kw:
            cur.execute("UPDATE kb_formal SET keywords = ? WHERE rowid = ?", (kw, rowid))
            updated += 1
    
    print(f"[fix] keywords 填充: {updated}/{len(rows)}")
    
    # 2. 重建 kb_formal_fts 支持 title + keywords + content
    # 先 DROP 旧的（只索引 content），重建为多字段
    try:
        cur.execute("DROP TABLE IF EXISTS kb_formal_fts")
        cur.execute("DROP TABLE IF EXISTS kb_formal_fts_data")
        cur.execute("DROP TABLE IF EXISTS kb_formal_fts_idx")
        cur.execute("DROP TABLE IF EXISTS kb_formal_fts_docsize")
        cur.execute("DROP TABLE IF EXISTS kb_formal_fts_config")
    except:
        pass
    
    # 用 unicode61 分词器（对中文按字分词，至少能做单字匹配）
    # 同时索引 title + keywords + content 到一个合并字段
    cur.execute("""
        CREATE VIRTUAL TABLE kb_formal_fts USING fts5(
            title,
            keywords,
            content,
            content='kb_formal',
            content_rowid='rowid',
            tokenize='unicode61'
        )
    """)
    
    # 填充 FTS5
    all_rows = cur.execute("SELECT rowid, title, keywords, content FROM kb_formal").fetchall()
    for rowid, title, keywords, content in all_rows:
        cur.execute(
            "INSERT INTO kb_formal_fts(rowid, title, keywords, content) VALUES (?, ?, ?, ?)",
            (rowid, title or '', keywords or '', content or '')
        )
    
    print(f"[fix] FTS5 重建: {len(all_rows)} 条（title + keywords + content 三字段）")
    
    # 3. 验证修复效果
    test_terms = ['应爻', '九课', '六亲', '肝郁气滞', '风寒表实', '桂枝汤']
    print(f"[fix] === 验证 ===")
    for term in test_terms:
        # FTS5 新搜索：跨 title + keywords + content
        n = cur.execute(
            "SELECT COUNT(*) FROM kb_formal_fts WHERE kb_formal_fts MATCH ?",
            (term,)
        ).fetchone()[0]
        # LIKE 对照
        n_like = cur.execute(
            "SELECT COUNT(*) FROM kb_formal WHERE content LIKE ?",
            (f'%{term}%',)
        ).fetchone()[0]
        print(f"  {term}: FTS5={n}  LIKE={n_like}")
    
    conn.commit()
    conn.close()
    
    print(f"[fix] 完成 ✅")


if __name__ == '__main__':
    main()
