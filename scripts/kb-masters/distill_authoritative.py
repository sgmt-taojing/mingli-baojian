# -*- coding: utf-8 -*-
"""authoritative-knowledge-base.js 深度蒸馏 — 完整体系
覆盖: 天干10 / 地支12 / 十神 / 纳音 / 神煞 / 合冲 / 五行 / 64卦 / 六爻 / 风水 / 姓名 / 体质 / 紫微 / 奇门 / 梅花 / 六壬
"""
import re, sqlite3, hashlib, json

DB = "/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/server/database/yidao.db"
SRC = "/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/server/kb-store/premium/authoritative-knowledge-base.js"

db = sqlite3.connect(DB)
cur = db.cursor()
total = 0

def insert(mod, title, content, kw, trust=0.9):
    global total
    if len(content) < 200:
        return
    eid = "KB-AUTH-" + hashlib.md5((title + content[:80]).encode()).hexdigest()[:8]
    exists = cur.execute("SELECT 1 FROM kb_formal WHERE entry_id=?", (eid,)).fetchone()
    if exists:
        return
    cur.execute("""INSERT INTO kb_formal 
        (entry_id,module,title,content,category,keywords,trust_score,status,audit_status,hit_count)
        VALUES(?,?,?,?,?,?,?,'active','approved',0)""",
        (eid, mod, title[:60], content[:4500], mod, kw, trust))
    total += 1

with open(SRC) as f:
    src = f.read()
print(f"源文件: {len(src)/1024:.0f}KB")

# ═══ 1. 天干详解（10个）═══
m = re.search(r'tiangan:\s*\[(.*?)\n\s*\],', src, re.DOTALL)
if m:
    items = re.findall(r'\{\s*name:\s*"([^"]+)",(.*?)\n\s*\},?', m.group(1), re.DOTALL)
    for name, body in items:
        def g(key):
            mm = re.search(rf'{key}:\s*"([^"]*)"', body)
            return mm.group(1) if mm else ""
        def garr(key):
            mm = re.search(rf'{key}:\s*\[([^\]]+)\]', body)
            if not mm: return []
            return re.findall(r'"([^"]+)"', mm.group(1))
        content = f"【{name}详解】\n\n" \
                  f"五行：{g('wuxing')} 阴阳：{g('yinyang')} 时令：{g('month_energy')}\n" \
                  f"自然意象：{g('natural')}\n性格特质：{g('character')}\n" \
                  f"人格描述：{g('personality')}\n优势：{'、'.join(garr('strengths'))}\n" \
                  f"劣势：{'、'.join(garr('weaknesses'))}\n适合职业：{g('career')}\n" \
                  f"健康对应：{g('health')}\n喜：{g('like')}\n忌：{g('dislike')}\n" \
                  f"最佳搭配：{g('best')}\n避讳：{g('avoid')}\n" \
                  f"财运：{g('fortune')}\n幸运色：{g('lucky_color')} 幸运数：{g('lucky_number')}"
        insert("bazi", f"权威·天干详解·{name}", content, f"天干,{name},八字,权威知识库", 0.92)
    print(f"天干: +{total}")

# ═══ 2. 地支详解（12个）═══
m = re.search(r'dizhi:\s*\[(.*?)\n\s*\],', src, re.DOTALL)
if m:
    items = re.findall(r'\{\s*name:\s*"([^"]+)",(.*?)\n\s*\},?', m.group(1), re.DOTALL)
    for name, body in items:
        def g(key):
            mm = re.search(rf'{key}:\s*"([^"]*)"', body)
            return mm.group(1) if mm else ""
        def garr(key):
            mm = re.search(rf'{key}:\s*\[([^\]]+)\]', body)
            if not mm: return []
            return re.findall(r'"([^"]+)"', mm.group(1))
        content = f"【{name}详解】\n\n" \
                  f"五行：{g('wuxing')} 阴阳：{g('yinyang')} 时令：{g('month_energy')}\n" \
                  f"自然意象：{g('natural')}\n性格特质：{g('character')}\n" \
                  f"人格描述：{g('personality')}\n优势：{'、'.join(garr('strengths'))}\n" \
                  f"劣势：{'、'.join(garr('weaknesses'))}\n适合职业：{g('career')}\n" \
                  f"健康对应：{g('health')}\n喜：{g('like')}\n忌：{g('dislike')}\n" \
                  f"最佳搭配：{g('best')}\n避讳：{g('avoid')}"
        insert("bazi", f"权威·地支详解·{name}", content, f"地支,{name},八字,权威知识库", 0.92)
    print(f"地支: +{total}")

# ═══ 3. 十神详解 ═══
for shishen_name in ['正官', '七杀', '正印', '偏印', '比肩', '劫财', '食神', '伤官', '正财', '偏财']:
    # 找对应块
    mm = re.search(rf'["\']?{shishen_name}["\']?\s*:\s*\{{([^}}]{{100,2000}})\}}', src)
    if mm:
        body = mm.group(1)
        def g(key):
            m2 = re.search(rf'{key}:\s*"([^"]*)"', body)
            return m2.group(1) if m2 else ""
        content = f"【十神·{shishen_name}】\n\n{body[:1200]}\n\n核心定义：{g('definition')}\n性格：{g('character')}\n六亲：{g('six_relations') or g('family')}"
        insert("bazi", f"权威·十神·{shishen_name}", content, f"十神,{shishen_name},八字", 0.9)
print(f"十神扫描后: +{total}")

# ═══ 4. 其他顶层模块 overview ═══
for mod_key, mod_name in [('liuyao','六爻'), ('fengshui','风水'), ('xingming','姓名'), ('tizhi','体质'), ('ziwei','紫微'), ('qimen','奇门'), ('meihua','梅花'), ('liuren','六壬'), ('bagua','八卦'), ('wuxing','五行'), ('shishen','十神'), ('nayin','纳音'), ('shensha','神煞'), ('hechong','合冲')]:
    mm = re.search(rf'^\s*{mod_key}:\s*\{{', src, re.MULTILINE)
    if mm:
        # 提取该模块的 title/intro 字段
        title_m = re.search(rf'{mod_key}:\s*\{{[^}}]*?(?:title|intro|overview):\s*"([^"]{{50,2000}})"', src)
        if title_m:
            insert(mod_key, f"权威·{mod_name}·体系概述", title_m.group(1), f"{mod_name},权威知识库,概述", 0.88)
print(f"模块概述后: +{total}")

# FTS5
cur.execute("DELETE FROM kb_fts5")
cur.execute("INSERT INTO kb_fts5 SELECT DISTINCT entry_id, module, title, COALESCE(content,''), COALESCE(keywords,''), COALESCE(category,'') FROM kb_formal WHERE entry_id IS NOT NULL AND length(content) > 0")
db.commit()
cur.execute("SELECT COUNT(*) FROM kb_formal"); kb = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM kb_fts5"); f = cur.fetchone()[0]
print(f"\n✅ 共新增 {total} 条 | KB={kb} FTS5={f} {'同步' if kb==f else '❌'}")
db.close()
