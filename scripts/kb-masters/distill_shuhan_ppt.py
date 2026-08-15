# -*- coding: utf-8 -*-
"""shuhan-ppt-ocr.txt 全量蒸馏 — 舒晗奇门36课PPT OCR"""
import re, sqlite3, hashlib

DB = "/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/server/database/yidao.db"
SRC = "/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/knowledge/shuhan-ppt-ocr.txt"

db = sqlite3.connect(DB)
cur = db.cursor()
total = 0

def insert(mod, title, content, kw, trust=0.85):
    global total
    if len(content) < 300:
        return
    eid = "KB-SHPPT-" + hashlib.md5((title + content[:80]).encode()).hexdigest()[:8]
    exists = cur.execute("SELECT 1 FROM kb_formal WHERE entry_id=?", (eid,)).fetchone()
    if exists:
        return
    cur.execute("""INSERT INTO kb_formal 
        (entry_id,module,title,content,category,keywords,trust_score,status,audit_status,hit_count)
        VALUES(?,?,?,?,?,?,?,'active','approved',0)""",
        (eid, mod, title[:60], content[:4500], mod, kw, trust))
    total += 1

with open(SRC) as f:
    text = f.read()

# 按 PPT 文件分块
blocks = re.split(r'={20,}\n\[PPT\] ([^\n]+)\nOCR页数: \d+页\n={20,}', text)
# blocks[0] 是开头，之后是 [name, content, name, content...]
print(f"PPT 块数: {(len(blocks)-1)//2}")

for i in range(1, len(blocks), 2):
    name = blocks[i].strip()
    content = blocks[i+1] if i+1 < len(blocks) else ""
    # 去页标记
    pages = re.split(r'==PAGE_START==\d+\n|==PAGE_END==\d+', content)
    clean = "\n".join(p.strip() for p in pages if p.strip())
    if len(clean) < 300:
        continue
    
    # 检测模块
    if '奇门' in name or '奇门' in clean[:500]:
        mod = 'qimen'
    elif '面' in name or '相' in name:
        mod = 'wangzhen'
    elif '风水' in name:
        mod = 'fengshui'
    elif '八字' in name or '四柱' in name:
        mod = 'bazi'
    else:
        mod = 'qimen'
    
    title = name.replace('.pdf', '').replace('【', '').replace('】', '')
    # 分段 2500
    segs = []
    cur_seg = []
    cur_len = 0
    for line in clean.split('\n'):
        cur_seg.append(line)
        cur_len += len(line)
        if cur_len >= 2500:
            segs.append('\n'.join(cur_seg))
            cur_seg = []
            cur_len = 0
    if cur_seg:
        segs.append('\n'.join(cur_seg))
    
    for si, seg in enumerate(segs):
        if len(seg) < 300:
            continue
        insert(mod, f"舒晗奇门PPT·{title[:30]}({si+1}/{len(segs)})",
               f"来源：舒晗奇门36节精品课 PPT OCR 提取（{name}）。\n\n{seg[:4500]}",
               f"舒晗,奇门,PPT,{title[:20]},OCR", 0.85)
    print(f"  ✅ {title[:35]}: {len(segs)}段")

# FTS5
cur.execute("DELETE FROM kb_fts5")
cur.execute("INSERT INTO kb_fts5 SELECT DISTINCT entry_id, module, title, COALESCE(content,''), COALESCE(keywords,''), COALESCE(category,'') FROM kb_formal WHERE entry_id IS NOT NULL AND length(content) > 0")
db.commit()
cur.execute("SELECT COUNT(*) FROM kb_formal"); kb = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM kb_fts5"); f = cur.fetchone()[0]
print(f"\n✅ 共新增 {total} 条 | KB={kb} FTS5={f} {'同步' if kb==f else '❌'}")
db.close()
