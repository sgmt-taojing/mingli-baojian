# -*- coding: utf-8 -*-
"""shuhan-kb-combined.js 深度蒸馏 Round2: dimai(地脉)/renjian(人间)/xiangxue(相学)"""
import re, sqlite3, hashlib

DB = "/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/server/database/yidao.db"
SRC = "/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/knowledge/shuhan-kb-combined.js"

db = sqlite3.connect(DB)
cur = db.cursor()
total = 0

def insert(mod, title, content, kw, trust=0.85):
    global total
    if len(content) < 200:
        return
    eid = "KB-SHDP-" + hashlib.md5((title + content[:80]).encode()).hexdigest()[:8]
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

# ═══ 1. dimai 地脉道（风水）═══
print("═══ dimai 地脉道 ═══")
idx = src.find('dimai: {')
if idx >= 0:
    end = src.find('\n  renjian:', idx)
    if end < 0: end = idx + 50000
    body = src[idx:end]
    
    # 提取子模块
    subs = re.findall(r'^\s{4}"([^"]+)":\s*\{', body, re.MULTILINE)
    print(f"子模块: {subs}")
    
    for sub in subs:
        sm = re.search(rf'^\s{{4}}"{sub}":\s*\{{(.*?)(?=^\s{{4}}"[^"]+":\s*\{{|\Z)', body, re.MULTILINE | re.DOTALL)
        if not sm: continue
        sbody = sm.group(1)
        title_m = re.search(r'title:\s*"([^"]+)"', sbody)
        stitle = title_m.group(1) if title_m else sub
        
        # content 数组
        cm = re.search(r'content:\s*\[(.*?)\]', sbody, re.DOTALL)
        if cm:
            texts = re.findall(r'"([^"]{30,2000})"', cm.group(1))
            if texts:
                insert('fengshui', f"舒晗地脉·{stitle[:40]}",
                       f"来源：shuhan-kb-combined.js dimai（倪海厦天纪地脉道框架知识）。\n\n" + "\n".join(f"• {t}" for t in texts[:15])[:4500],
                       f"舒晗,地脉,风水,{stitle[:15]}", 0.85)
                print(f"  ✅ {stitle[:35]}: {len(texts)}条")
        
        # items 数组（含 gua/name/xiang 等）
        im = re.search(r'items:\s*\[(.*?)\]', sbody, re.DOTALL)
        if im:
            items = re.findall(r'\{([^}]{50,2000})\}', im.group(1))
            if items:
                parts = []
                for it in items[:20]:
                    vals = re.findall(r'"[^"]+":\s*"([^"]{5,500})"', it)
                    if vals:
                        parts.append("◆ " + " | ".join(vals[:4]))
                if parts:
                    insert('fengshui', f"舒晗地脉·{stitle[:40]}·详解",
                           f"来源：shuhan-kb-combined.js dimai。\n\n" + "\n".join(parts)[:4500],
                           f"舒晗,地脉,风水,{stitle[:15]}", 0.85)
                    print(f"  ✅ {stitle[:35]}·详解: {len(items)}项")

# ═══ 2. renjian 人间道（易经八卦）═══
print("\n═══ renjian 人间道 ═══")
idx = src.find('renjian: {')
if idx >= 0:
    end = src.find('\n  xiangxue:', idx)
    if end < 0: end = idx + 50000
    body = src[idx:end]
    
    subs = re.findall(r'^\s{4}"([^"]+)":\s*\{', body, re.MULTILINE)
    print(f"子模块: {subs}")
    
    for sub in subs:
        sm = re.search(rf'^\s{{4}}"{sub}":\s*\{{(.*?)(?=^\s{{4}}"[^"]+":\s*\{{|\Z)', body, re.MULTILINE | re.DOTALL)
        if not sm: continue
        sbody = sm.group(1)
        title_m = re.search(r'title:\s*"([^"]+)"', sbody)
        stitle = title_m.group(1) if title_m else sub
        
        # items: { gua, name, xiang, wuxing, de }
        im = re.search(r'items:\s*\[(.*?)\]', sbody, re.DOTALL)
        if im:
            items = re.findall(r'\{([^}]{50,2000})\}', im.group(1))
            print(f"  {stitle[:30]}: {len(items)}项")
            for it in items:
                gua = re.search(r'gua:\s*"([^"]+)"', it)
                name = re.search(r'name:\s*"([^"]+)"', it)
                xiang = re.search(r'xiang:\s*"([^"]+)"', it)
                wuxing = re.search(r'wuxing:\s*"([^"]+)"', it)
                de = re.search(r'de:\s*"([^"]+)"', it)
                if name and xiang:
                    content = f"【人间道·{name.group(1)}】{gua.group(1) if gua else ''}\n\n象意：{xiang.group(1)}\n五行：{wuxing.group(1) if wuxing else ''}\n德性：{de.group(1) if de else ''}"
                    insert('yijing', f"舒晗人间道·{name.group(1)}", content, f"舒晗,人间道,八卦,{name.group(1)}", 0.85)
        else:
            cm = re.search(r'content:\s*\[(.*?)\]', sbody, re.DOTALL)
            if cm:
                texts = re.findall(r'"([^"]{30,2000})"', cm.group(1))
                if texts:
                    insert('yijing', f"舒晗人间道·{stitle[:40]}",
                           f"来源：shuhan-kb-combined.js renjian。\n\n" + "\n".join(f"• {t}" for t in texts[:15])[:4500],
                           f"舒晗,人间道,易经,{stitle[:15]}", 0.85)
                    print(f"  ✅ {stitle[:35]}: {len(texts)}条")

# ═══ 3. xiangxue 相学 ═══
print("\n═══ xiangxue 相学 ═══")
idx = src.find('xiangxue: {')
if idx >= 0:
    end = src.find('\n  basicCourse:', idx)
    if end < 0: end = idx + 60000
    body = src[idx:end]
    
    subs = re.findall(r'^\s{4}"([^"]+)":\s*\{', body, re.MULTILINE)
    print(f"子模块: {subs}")
    
    for sub in subs:
        sm = re.search(rf'^\s{{4}}"{sub}":\s*\{{(.*?)(?=^\s{{4}}"[^"]+":\s*\{{|\Z)', body, re.MULTILINE | re.DOTALL)
        if not sm: continue
        sbody = sm.group(1)
        title_m = re.search(r'title:\s*"([^"]+)"', sbody)
        stitle = title_m.group(1) if title_m else sub
        
        im = re.search(r'items:\s*\[(.*?)\]', sbody, re.DOTALL)
        if im:
            items = re.findall(r'\{([^}]{50,2000})\}', im.group(1))
            print(f"  {stitle[:30]}: {len(items)}项")
            for it in items:
                name = re.search(r'name:\s*"([^"]+)"', it)
                guan = re.search(r'guan:\s*"([^"]+)"', it)
                xiang = re.search(r'xiang:\s*"([^"]+)"', it)
                if name and xiang:
                    content = f"【相学·{name.group(1)}】{guan.group(1) if guan else ''}\n\n{xiang.group(1)}"
                    insert('wangzhen', f"舒晗相学·{name.group(1)}", content, f"舒晗,相学,{name.group(1)}", 0.85)
            print(f"    入库: +{total}")
        else:
            cm = re.search(r'content:\s*\[(.*?)\]', sbody, re.DOTALL)
            if cm:
                texts = re.findall(r'"([^"]{30,2000})"', cm.group(1))
                if texts:
                    insert('wangzhen', f"舒晗相学·{stitle[:40]}",
                           f"来源：shuhan-kb-combined.js xiangxue。\n\n" + "\n".join(f"• {t}" for t in texts[:15])[:4500],
                           f"舒晗,相学,{stitle[:15]}", 0.85)
                    print(f"  ✅ {stitle[:35]}: {len(texts)}条")

# FTS5
cur.execute("DELETE FROM kb_fts5")
cur.execute("INSERT INTO kb_fts5 SELECT DISTINCT entry_id, module, title, COALESCE(content,''), COALESCE(keywords,''), COALESCE(category,'') FROM kb_formal WHERE entry_id IS NOT NULL AND length(content) > 0")
db.commit()
cur.execute("SELECT COUNT(*) FROM kb_formal"); kb = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM kb_fts5"); f = cur.fetchone()[0]
print(f"\n✅ 共新增 {total} 条 | KB={kb} FTS5={f} {'同步' if kb==f else '❌'}")
db.close()
