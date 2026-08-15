# -*- coding: utf-8 -*-
"""ziwei-knowledge-base.js 全模块深度提取（stars/palaces/geju/cases 等结构）"""
import re, sqlite3, hashlib

DB = "/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/server/database/yidao.db"
SRC = "/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/knowledge/ziwei-knowledge-base.js"

db = sqlite3.connect(DB)
cur = db.cursor()
total = 0

def insert(mod, title, content, kw, trust=0.9):
    global total
    if len(content) < 150:
        return
    eid = "KB-ZW2-" + hashlib.md5((title + content[:80]).encode()).hexdigest()[:8]
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

# 提取所有模块块
blocks = re.findall(r'window\.ZIWEI_KB\.(\w+)\s*=\s*\{(.*?)\n  \};', src, re.DOTALL)

for key, body in blocks:
    title_m = re.search(r"title:\s*'([^']+)'", body)
    label = title_m.group(1) if title_m else key

    # ═══ stars 数组 ═══
    sm = re.search(r"stars:\s*\[(.*?)\n\s*\],", body, re.DOTALL)
    if sm:
        stars = re.findall(r"\{\s*name:\s*'([^']+)',\s*(?:palace|gong):\s*'([^']*)',\s*desc:\s*'([^']{30,1500})'", sm.group(1))
        if not stars:
            stars = re.findall(r"\{\s*name:\s*'([^']+)',\s*desc:\s*'([^']{30,1500})'", sm.group(1))
        if stars:
            parts = [f"【紫微·{label}·星曜详解】"]
            for s in stars:
                if len(s) == 3:
                    parts.append(f"◆ {s[0]}（{s[1]}）：{s[2]}")
                else:
                    parts.append(f"◆ {s[0]}：{s[1]}")
            insert('ziwei', f"紫微知识库·{label}·星曜", "\n\n".join(parts)[:4500], f"紫微,{label},星曜", 0.9)
            print(f"  ✅ {label}·星曜: {len(stars)}星")

    # ═══ palaces 数组（宫位详解）═══
    pm = re.search(r"palaces:\s*\[(.*?)\n\s*\],", body, re.DOTALL)
    if pm:
        palaces = re.findall(r"\{\s*name:\s*'([^']+)',\s*(?:desc|meaning):\s*'([^']{30,2000})'", pm.group(1))
        if palaces:
            parts = [f"【紫微·{label}·宫位详解】"]
            for name, desc in palaces:
                parts.append(f"◆ {name}：{desc}")
            insert('ziwei', f"紫微知识库·{label}·宫位", "\n\n".join(parts)[:4500], f"紫微,{label},宫位", 0.9)
            print(f"  ✅ {label}·宫位: {len(palaces)}宫")

    # ═══ geju 数组（格局）═══
    gm = re.search(r"geju:\s*\[(.*?)\n\s*\],", body, re.DOTALL)
    if not gm:
        gm = re.search(r"geju:\s*\{(.*?)\n\s*\},?", body, re.DOTALL)
    if gm:
        geju = re.findall(r"\{\s*name:\s*'([^']+)',\s*(?:desc|meaning):\s*'([^']{30,1500})'", gm.group(1))
        if not geju:
            geju = re.findall(r"['\"]?(\w+)['\"]?\s*:\s*'([^']{30,800})'", gm.group(1))
        if geju:
            parts = [f"【紫微·{label}·格局】"]
            for g in geju:
                parts.append(f"◆ {g[0]}：{g[1]}")
            insert('ziwei', f"紫微知识库·{label}·格局", "\n\n".join(parts)[:4500], f"紫微,{label},格局", 0.9)
            print(f"  ✅ {label}·格局: {len(geju)}格")

    # ═══ cases 数组（案例）═══
    cm = re.search(r"cases:\s*\[(.*?)\n\s*\],", body, re.DOTALL)
    if cm:
        cases = re.findall(r"\{\s*title:\s*'([^']+)',\s*(?:desc|detail|analysis):\s*'([^']{50,2000})'", cm.group(1))
        if cases:
            parts = [f"【紫微·{label}·实战案例】"]
            for t, d in cases:
                parts.append(f"◆ {t}：{d}")
            insert('ziwei', f"紫微知识库·{label}·案例", "\n\n".join(parts)[:4500], f"紫微,{label},案例", 0.9)
            print(f"  ✅ {label}·案例: {len(cases)}例")

    # ═══ sihua（四化）═══
    if key == 'sihua' or '四化' in label:
        items = re.findall(r"['\"]?(\w+)['\"]?\s*:\s*['\"]([^'\"]{20,500})['\"]", body)
        if items:
            parts = [f"【紫微·四化详解】"]
            for k, v in items:
                if k not in ('title',):
                    parts.append(f"◆ {k}：{v}")
            insert('ziwei', "紫微知识库·四化详解", "\n\n".join(parts)[:4500], f"紫微,四化,化禄,化权,化科,化忌", 0.9)
            print(f"  ✅ 四化: {len(items)}项")

    # ═══ koujue（口诀）═══
    if key == 'koujue':
        items = re.findall(r"['\"]?(\w+)['\"]?\s*:\s*['\"]([^'\"]{20,800})['\"]", body)
        if items:
            parts = [f"【紫微·口诀精要】"]
            for k, v in items:
                if k not in ('title',):
                    parts.append(f"◆ {k}：{v}")
            insert('ziwei', "紫微知识库·口诀精要", "\n\n".join(parts)[:4500], f"紫微,口诀,{label}", 0.9)
            print(f"  ✅ 口诀: {len(items)}项")

    # ═══ classicQuotes（经典引用）═══
    if key == 'classicQuotes':
        items = re.findall(r"\{\s*(?:quote|text|desc):\s*'([^']{30,1000})'", body)
        if not items:
            items = re.findall(r"'([^']{30,1000})'", body)
        if items:
            parts = [f"【紫微·经典文献引用】"]
            for q in items[:20]:
                parts.append(f"◆ {q}")
            insert('ziwei', "紫微知识库·经典文献引用", "\n\n".join(parts)[:4500], f"紫微,经典,太微赋,骨髓赋", 0.9)
            print(f"  ✅ 经典引用: {len(items)}条")

    # ═══ 其他通用: 长字符串片段 ═══
    if key in ('origin', 'fullPaipan', 'comparison', 'practical', 'anxing', 'xiaoxianDetail'):
        contents = re.findall(r"content:\s*\[(.*?)\]", body, re.DOTALL)
        if contents:
            texts = re.findall(r"'([^']{30,2000})'", contents[0])
            if texts:
                insert('ziwei', f"紫微知识库·{label}", f"【紫微·{label}】\n\n" + "\n".join(texts[:20])[:4500], f"紫微,{label}", 0.9)
                print(f"  ✅ {label}: {len(texts)}段")

# FTS5
cur.execute("DELETE FROM kb_fts5")
cur.execute("INSERT INTO kb_fts5 SELECT DISTINCT entry_id, module, title, COALESCE(content,''), COALESCE(keywords,''), COALESCE(category,'') FROM kb_formal WHERE entry_id IS NOT NULL AND length(content) > 0")
db.commit()
cur.execute("SELECT COUNT(*) FROM kb_formal"); kb = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM kb_fts5"); f = cur.fetchone()[0]
print(f"\n✅ 共新增 {total} 条 | KB={kb} FTS5={f} {'同步' if kb==f else '❌'}")
db.close()
