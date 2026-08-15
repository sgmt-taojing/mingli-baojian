# -*- coding: utf-8 -*-
"""蒸馏 ziwei-new-sections.js + authoritative-knowledge-base.js + knowledge-details-extra.js"""
import re, json, sqlite3, hashlib, os

DB = "/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/server/database/yidao.db"
PREMIUM = "/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/server/kb-store/premium"

db = sqlite3.connect(DB)
cur = db.cursor()
total = 0

def insert(mod, title, content, kw, trust=0.88):
    global total
    if len(content) < 300:
        return
    eid = "KB-SYS-" + hashlib.md5((title + content[:80]).encode()).hexdigest()[:8]
    exists = cur.execute("SELECT 1 FROM kb_formal WHERE entry_id=?", (eid,)).fetchone()
    if exists:
        return
    cur.execute("""INSERT INTO kb_formal 
        (entry_id,module,title,content,category,keywords,trust_score,status,audit_status,hit_count)
        VALUES(?,?,?,?,?,?,?,'active','approved',0)""",
        (eid, mod, title[:60], content[:4500], mod, kw, trust))
    total += 1

# ═══ 1. ziwei-new-sections.js — 紫微双星组合详解 ═══
print("═══ 1. ziwei-new-sections.js ═══")
with open(f"{PREMIUM}/ziwei-new-sections.js") as f:
    zsrc = f.read()

# 提取双星组合
combo_blocks = re.findall(r"\{ name: '([^']+)', palaces: '([^']+)',\s*desc: '([^']+)',\s*minggong: '([^']+)',\s*caibo: '([^']+)',\s*shiye: '([^']+)',\s*fuqi: '([^']+)' \}", zsrc)
print(f"双星组合: {len(combo_blocks)} 组")
for name, palaces, desc, minggong, caibo, shiye, fuqi in combo_blocks:
    content = f"【{name}双星组合】宫位：{palaces}\n\n一、组合总论：{desc}\n\n二、命宫解读：{minggong}\n\n三、财帛宫解读：{caibo}\n\n四、官禄宫解读：{shiye}\n\n五、夫妻宫解读：{fuqi}"
    insert("ziwei", f"紫微双星·{name}组合", content, f"紫微,双星,{name},组合,命宫,财帛,官禄,夫妻", 0.9)
print(f"  双星组合入库: {total}")

# ═══ 2. authoritative-knowledge-base.js — 八字体系 ═══
print("\n═══ 2. authoritative-knowledge-base.js ═══")
with open(f"{PREMIUM}/authoritative-knowledge-base.js") as f:
    asrc = f.read()
print(f"文件大小: {len(asrc)/1024:.0f}KB")

# 找顶层 key（八字/紫微/奇门等）
top_keys = re.findall(r"^\s{2}(\w+):\s*\{", asrc, re.MULTILINE)
print(f"顶层模块: {top_keys}")

# 提取 overview/intro 等长文本
sections = re.findall(r"(\w+):\s*\{[^}]*?(?:title|intro|desc|content):\s*'([^']{200,3000})'", asrc)
print(f"长文本段: {len(sections)}")

# 天干详解
tiangan = re.findall(r"name: '([^']+)',\s*wuxing: '([^']+)',\s*yinyang: '([^']+)',\s*month_energy: '([^']+)',\s*natural: '([^']+)',\s*character: '([^']+)',\s*personality: '([^']+)',\s*strengths: \[([^\]]+)\],\s*weaknesses: \[([^\]]+)\],\s*career: '([^']+)',\s*health: '([^']+)',\s*like: '([^']+)',\s*dislike: '([^']+)'", asrc)
print(f"天干详解: {len(tiangan)} 个")
for t in tiangan[:12]:
    name, wx, yy, me, nat, ch, pers, st, wk, career, health, like, dislike = t
    st_c = re.findall(r"'([^']+)'", st)
    wk_c = re.findall(r"'([^']+)'", wk)
    content = f"【{name}】五行属{wx}，阴阳为{yy}，主{me}。\n\n自然意象：{nat}\n性格特质：{ch}\n人格描述：{pers}\n优势：{'、'.join(st_c)}\n劣势：{'、'.join(wk_c)}\n适合职业：{career}\n健康对应：{health}\n喜：{like}\n忌：{dislike}"
    insert("bazi", f"十天干详解·{name}", content, f"天干,{name},八字,五行,{wx}", 0.9)
print(f"  天干详解后总数: {total}")

# ═══ 3. knowledge-details-extra.js — 八卦/紫微详情 ═══
print("\n═══ 3. knowledge-details-extra.js ═══")
with open(f"{PREMIUM}/knowledge-details-extra.js") as f:
    ksrc = f.read()

# 提取 KNOWLEDGE_DETAILS 键值
detail_blocks = re.findall(r"KNOWLEDGE_DETAILS\['(\w+)'\]\s*=\s*`([^`]{500,8000})`", ksrc)
print(f"详情块: {len(detail_blocks)}")
for key, html in detail_blocks:
    # 去 HTML 标签
    text = re.sub(r'<[^>]+>', '\n', html)
    text = re.sub(r'\n{2,}', '\n', text).strip()
    mod = 'yijing' if key in ('bagua', 'zhouyi', 'yijing', 'liuyao') else ('ziwei' if 'ziwei' in key else 'general')
    insert(mod, f"易道知识详情·{key}", text, f"知识详情,{key},体系", 0.88)
print(f"  详情块入库后总数: {total}")

# FTS5 全量重建
cur.execute("DELETE FROM kb_fts5")
cur.execute("INSERT INTO kb_fts5 SELECT DISTINCT entry_id, module, title, COALESCE(content,''), COALESCE(keywords,''), COALESCE(category,'') FROM kb_formal WHERE entry_id IS NOT NULL AND length(content) > 0")
db.commit()
cur.execute("SELECT COUNT(*) FROM kb_formal"); kb = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM kb_fts5"); f = cur.fetchone()[0]
print(f"\n✅ 共新增 {total} 条 | KB={kb} FTS5={f} {'同步' if kb==f else '❌'}")
db.close()
