# -*- coding: utf-8 -*-
"""yanzhi-part2.js 命理部分蒸馏: 姓名学/测字/生肖/五行命名"""
import re, sqlite3, hashlib

DB = "/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/server/database/yidao.db"
SRC = "/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/knowledge/yanzhi-part2.js"

db = sqlite3.connect(DB)
cur = db.cursor()
total = 0

def insert(mod, title, content, kw, trust=0.88):
    global total
    if len(content) < 200:
        return
    eid = "KB-YZ2-" + hashlib.md5((title + content[:80]).encode()).hexdigest()[:8]
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

# ═══ 1. 各命理模块（对象形式）═══
MODULES = {
    'nameBazi': ('naming', '姓名与八字配合分析'),
    'shengxiao': ('naming', '生肖姓名学'),
    'wuxingName': ('naming', '五行命名法'),
    'companyName': ('naming', '公司起名学'),
    'brandName': ('naming', '品牌命名学'),
    'changeName': ('naming', '改名实战'),
    'nameExperts': ('naming', '姓名学名家观点'),
    'charDict': ('naming', '测字字典'),
    'namexuePractical': ('naming', '姓名学实战'),
    'ceshiMidie': ('naming', '测字秘牒精解'),
}

for key, (mod, label) in MODULES.items():
    mm = re.search(rf'YANZHI_KNOWLEDGE\.{key}\s*=\s*\{{(.*?)\n\}};', src, re.DOTALL)
    if not mm:
        # 尝试单行定义
        mm = re.search(rf'YANZHI_KNOWLEDGE\.{key}\s*=\s*\{{(.*?)\}};', src, re.DOTALL)
    if not mm:
        print(f"  ⚠️ {key}: 未找到")
        continue
    body = mm.group(1)
    # 提取字段
    title = re.search(r'title:\s*[\'"]([^\'"]+)[\'"]', body)
    desc = re.search(r'desc:\s*[\'"]([^\'"]+)[\'"]', body)
    # 提取 principles 数组
    pr = re.search(r'principles:\s*\[(.*?)\]', body, re.DOTALL)
    principles = re.findall(r'[\'"]([^\'"]{15,300})[\'"]', pr.group(1)) if pr else []
    # 提取 scenarios
    sc = re.search(r'scenarios:\s*\[(.*?)\]', body, re.DOTALL)
    scenarios = []
    if sc:
        for sm in re.finditer(r'situation:\s*[\'"]([^\'"]+)[\'"]', sc.group(1)):
            scenarios.append(sm.group(1))
    # 提取 theories
    th = re.search(r'theories:\s*\[(.*?)\]', body, re.DOTALL)
    theories = []
    if th:
        for tm in re.finditer(r'name:\s*[\'"]([^\'"]+)[\'"]', th.group(1)):
            theories.append(tm.group(1))

    content_parts = [f"【{label}】"]
    if title: content_parts.append(f"标题：{title.group(1)}")
    if desc: content_parts.append(f"概述：{desc.group(1)}")
    if principles:
        content_parts.append("核心原则：\n" + "\n".join(f"• {p}" for p in principles))
    if scenarios:
        content_parts.append("典型场景：\n" + "\n".join(f"• {s}" for s in scenarios[:8]))
    if theories:
        content_parts.append("理论体系：\n" + "\n".join(f"• {t}" for t in theories[:8]))

    content = "\n\n".join(content_parts)
    if len(content) > 250:
        insert(mod, f"言值·{label}", content, f"言值,{label},{key},姓名学", 0.88)
        print(f"  ✅ {label}: {len(content)}字符")

# ═══ 2. 测字字典条目（charDict 可能很大）═══
mm = re.search(r'YANZHI_KNOWLEDGE\.charDict\s*=\s*\{(.*?)\n\};', src, re.DOTALL)
if mm:
    # 找字典子项
    items = re.findall(r'[\'"]([\u4e00-\u9fff])[\'"]\s*:\s*\{', mm.group(1))
    print(f"测字字典字数: {len(items)}")
    # 提取每个字的详解
    for ch in items[:40]:
        cm = re.search(rf'[\'"]{ch}[\'"]\s*:\s*\{{(.*?)\n\s*\}}', mm.group(1), re.DOTALL)
        if cm:
            body2 = cm.group(1)
            meaning = re.search(r'(?:meaning|desc|explain):\s*[\'"]([^\'"]{50,800})[\'"]', body2)
            if meaning:
                insert('naming', f"测字字典·{ch}", f"【测字·{ch}】\n\n{meaning.group(1)}", f"测字,{ch},姓名学,字义", 0.88)
    print(f"  测字后: +{total}")

# FTS5
cur.execute("DELETE FROM kb_fts5")
cur.execute("INSERT INTO kb_fts5 SELECT DISTINCT entry_id, module, title, COALESCE(content,''), COALESCE(keywords,''), COALESCE(category,'') FROM kb_formal WHERE entry_id IS NOT NULL AND length(content) > 0")
db.commit()
cur.execute("SELECT COUNT(*) FROM kb_formal"); kb = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM kb_fts5"); f = cur.fetchone()[0]
print(f"\n✅ 共新增 {total} 条 | KB={kb} FTS5={f} {'同步' if kb==f else '❌'}")
db.close()
