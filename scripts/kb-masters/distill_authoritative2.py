# -*- coding: utf-8 -*-
"""authoritative-knowledge-base.js 深度蒸馏 Round2: 纳音/64卦/神煞/六爻/风水"""
import re, sqlite3, hashlib

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

# ═══ 1. 纳音五行（60甲子 30组）═══
m = re.search(r'nayin:\s*\[(.*?)\n\s*\],', src, re.DOTALL)
if m:
    items = re.findall(r'\{\s*group:\s*\d+,\s*ganzhi:\s*"([^"]+)",\s*nayin:\s*"([^"]+)",\s*meaning:\s*"([^"]+)"\s*\}', m.group(1))
    print(f"纳音: {len(items)} 组")
    for ganzhi, nayin, meaning in items:
        # 去掉重复的【实战要点】模板文字（只保留第一句）
        meaning_clean = meaning.split('【实战要点】')[0].strip()
        content = f"【纳音·{nayin}】（{ganzhi}）\n\n{meaning_clean}"
        insert("bazi", f"权威·纳音五行·{nayin}（{ganzhi}）", content, f"纳音,{nayin},{ganzhi},五行,六十甲子", 0.92)
    print(f"  纳音后: +{total}")

# ═══ 2. 64卦详解 ═══
m = re.search(r'liushisigua:\s*\{(.*?)\n\s*\},?\n\s*(?:bagua|wuxing|shishen)', src, re.DOTALL)
if m:
    # 找卦数组
    gua_items = re.findall(r'\{\s*name:\s*"([^"]+)",\s*guaci:\s*"([^"]+)",\s*meaning:\s*"([^"]+)"', m.group(1))
    print(f"64卦: {len(gua_items)}")
    for name, guaci, meaning in gua_items:
        content = f"【六十四卦·{name}】\n\n卦辞：{guaci}\n\n卦义详解：{meaning}"
        insert("yijing", f"权威·六十四卦·{name}", content, f"六十四卦,{name},易经,卦辞", 0.92)
    print(f"  64卦后: +{total}")

# ═══ 3. 神煞 ═══
m = re.search(r'shensha:\s*\{(.*?)\n\s*\},?\n\s*(?:hechong|ziwei|qimen)', src, re.DOTALL)
if m:
    items = re.findall(r'["\']?(\w+)["\']?\s*:\s*\{[^}]*?name:\s*"([^"]+)",\s*(?:desc|meaning):\s*"([^"]{100,1500})"', m.group(1))
    print(f"神煞: {len(items)}")
    for key, name, desc in items:
        insert("bazi", f"权威·神煞·{name}", f"【神煞·{name}】\n\n{desc}", f"神煞,{name},八字", 0.9)
    print(f"  神煞后: +{total}")

# ═══ 4. 合冲 ═══
m = re.search(r'hechong:\s*\{(.*?)\n\s*\},?\n\s*(?:ziwei|qimen)', src, re.DOTALL)
if m:
    items = re.findall(r'["\']?(\w+)["\']?\s*:\s*\{[^}]*?name:\s*"([^"]+)",\s*(?:desc|meaning|detail):\s*"([^"]{100,1500})"', m.group(1))
    print(f"合冲: {len(items)}")
    for key, name, desc in items:
        insert("bazi", f"权威·合冲·{name}", f"【合冲关系·{name}】\n\n{desc}", f"合冲,{name},地支,八字", 0.9)
    print(f"  合冲后: +{total}")

# FTS5
cur.execute("DELETE FROM kb_fts5")
cur.execute("INSERT INTO kb_fts5 SELECT DISTINCT entry_id, module, title, COALESCE(content,''), COALESCE(keywords,''), COALESCE(category,'') FROM kb_formal WHERE entry_id IS NOT NULL AND length(content) > 0")
db.commit()
cur.execute("SELECT COUNT(*) FROM kb_formal"); kb = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM kb_fts5"); f = cur.fetchone()[0]
print(f"\n✅ Round2 共新增 {total} 条 | KB={kb} FTS5={f} {'同步' if kb==f else '❌'}")
db.close()
