#!/usr/bin/env python3
"""C 方案：KB 字符质量审计 + 标记 deprecated（不删，按 KB 规范打标签）
- 严重乱码（导图占位/CSS代码污染）：deprecated
- 真梵音/真音韵字符：保留（mantra/faith/nihaisha 的 · 梵音）
- URL 路径污染：deprecated
"""
import sqlite3, re, json, sys, sys
DB = "./server/database/yidao.db"
con = sqlite3.connect(DB)
cur = con.cursor()

# 取所有条目
cur.execute("SELECT entry_id, module, content, source_ids FROM kb_formal")
all_rows = cur.fetchall()
print(f"total: {len(all_rows)}")

def classify(content):
    if not content:
        return "empty"
    n = len(content)
    chinese = len(re.findall(r'[\u4e00-\u9fff]', content))
    cn_ratio = chinese / n if n > 0 else 0
    latin1 = len(re.findall(r'[\u0080-\u00ff]', content))
    latin1_ratio = latin1 / n if n > 0 else 0
    suspicious = len(re.findall(r'[^\u4e00-\u9fff\u3000-\u303f\uff00-\uffefa-zA-Z0-9\s\.,;:()，。；：、（）《》！？""\'\'""''「」『』【】·…—/\-_+\[\]\{\}\\\\]', content))
    suspicious_ratio = suspicious / n if n > 0 else 0
    url_encoded = len(re.findall(r'%[0-9A-Fa-f]{2}', content))
    has_path_marker = '路径:' in content or ' 路径:' in content
    has_eq_pages = '页数:' in content or '页码:' in content
    is_pure_ascii = not re.search(r'[\u4e00-\u9fff]', content)
    has_css = ('background:rgba' in content or 'font-size:' in content 
               or 'border-radius:' in content or 'padding:' in content 
               or 'cursor:' in content)
    
    # 严重乱码：CSS代码 或 导图占位 或 URL路径
    if has_css and is_pure_ascii:
        return "🔴CSS污染"
    if has_path_marker and url_encoded > 10:
        return "🔴URL路径污染"
    if has_eq_pages and ('====' in content or 'PAGE BREAK' in content):
        return "🔴导图占位"
    if suspicious_ratio > 0.4:
        return "🔴乱码严重"
    if latin1_ratio > 0.3:
        return "🟠Latin-1杂字符"
    if suspicious_ratio > 0.15 and n > 100:
        return "🟡可疑字符"
    return "✅正常"

# 按模块统计 + 标记 deprecated
to_deprecate = []
buckets = {}
samples = {}
for eid, mod, content, src_ids in all_rows:
    label = classify(content)
    buckets[(mod, label)] = buckets.get((mod, label), 0) + 1
    if label.startswith("🔴"):
        to_deprecate.append((eid, mod, label, content[:100]))

print(f"\n=== 准备标记 deprecated: {len(to_deprecate)} 条 ===")
for eid, mod, label, content in to_deprecate[:30]:
    print(f"  {label} | {eid} [{mod}]")
    print(f"    {content!r}")

# 只标记 🔴 CSS污染 / 🔴 URL路径污染 / 🔴 导图占位（不删，打 deprecated）
# 严重乱码但非占位的也标记（防止误伤真梵音）
NOW = "2026-07-23 01:10:00"
cur.execute("SELECT COUNT(*) FROM kb_formal WHERE status='deprecated'")
print(f"\n已有 deprecated: {cur.fetchone()[0]} 条")

# 写入一个标记表（用 status='deprecated' + tags 加 [质量异常] 标签）
# 因为 kb_formal 表无 deprecated_at 字段，我们用 tags 来标记
print(f"\n=== 执行标记 ===")
marked = 0
for eid, mod, label, content in to_deprecate:
    cur.execute("SELECT tags, source_ids FROM kb_formal WHERE entry_id=?", (eid,))
    row = cur.fetchone()
    if not row:
        continue
    old_tags, src_ids = row
    try:
        tags = json.loads(old_tags) if old_tags else []
    except:
        tags = []
    if not isinstance(tags, list):
        tags = []
    if "质量异常" not in tags:
        tags.append("质量异常")
    if label not in tags:
        tags.append(f"质量异常-{label}")
    # 同时降低 confidence
    cur.execute("UPDATE kb_formal SET tags=?, confidence=0.3 WHERE entry_id=?",
                (json.dumps(tags, ensure_ascii=False), eid))
    marked += 1

con.commit()
print(f"\n标记完成: {marked} 条")
cur.execute("SELECT COUNT(*) FROM kb_formal WHERE tags LIKE '%质量异常%'")
print(f"现状质量异常条目: {cur.fetchone()[0]}")

# 输出模块级别汇总
print("\n=== 各模块质量分布（统计）===")
print(f"{'模块':<25} {'🔴CSS污染':<12} {'🔴URL路径':<12} {'🔴导图占位':<12} {'🔴乱码严重':<12} {'🟠Latin1':<10} {'🟡可疑':<10} {'✅正常':<10}")
for mod in sorted(set(k[0] for k in buckets.keys())):
    css = buckets.get((mod, '🔴CSS污染'), 0)
    url = buckets.get((mod, '🔴URL路径污染'), 0)
    daotu = buckets.get((mod, '🔴导图占位'), 0)
    bad = buckets.get((mod, '🔴乱码严重'), 0)
    lat = buckets.get((mod, '🟠Latin-1杂字符'), 0)
    sus = buckets.get((mod, '🟡可疑字符'), 0)
    ok = buckets.get((mod, '✅正常'), 0)
    print(f"{mod:<25} {css:<12} {url:<12} {daotu:<12} {bad:<12} {lat:<10} {sus:<10} {ok:<10}")
con.close()