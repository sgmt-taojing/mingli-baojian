# -*- coding: utf-8 -*-
"""nihaisha professional 系列全量蒸馏（tcm-kb 3MB + batch1-4 + classics + nishan）
43+ 模块完整内容 → KB"""
import re, sqlite3, hashlib, os

DB = "/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/server/database/yidao.db"
PRO = "/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/server/kb-store/professional"

db = sqlite3.connect(DB)
cur = db.cursor()
total = 0

def insert(mod, title, content, kw, trust=0.88):
    global total
    if len(content) < 300:
        return
    eid = "KB-NPRO-" + hashlib.md5((title + content[:80]).encode()).hexdigest()[:8]
    exists = cur.execute("SELECT 1 FROM kb_formal WHERE entry_id=?", (eid,)).fetchone()
    if exists:
        return
    cur.execute("""INSERT INTO kb_formal 
        (entry_id,module,title,content,category,keywords,trust_score,status,audit_status,hit_count)
        VALUES(?,?,?,?,?,?,?,'active','approved',0)""",
        (eid, mod, title[:60], content[:4500], mod, kw, trust))
    total += 1

def detect_module(name, text):
    n = name + text[:200]
    if any(w in n for w in ['伤寒']): return 'shanghan-lun'
    if any(w in n for w in ['金匮']): return 'tcm-fangji'
    if any(w in n for w in ['内经', '黄帝']): return 'tcm-classical'
    if any(w in n for w in ['本草', '神农']): return 'tcm-herb'
    if any(w in n for w in ['针灸']): return 'tcm-acupuncture'
    if any(w in n for w in ['天纪', '紫微', '易经', '堪舆', '四柱']): return 'ziwei'
    if any(w in n for w in ['医案', '临床']): return 'tcm-clinical'
    if any(w in n for w in ['辨证', '六经', '八纲']): return 'tcm-diagnosis'
    if any(w in n for w in ['方剂', '方证', '经方']): return 'tcm-fangji'
    return 'tcm'

# ═══ 1. nihaisha-tcm-kb.js (3MB) ═══
print("═══ nihaisha-tcm-kb.js ═══")
with open(f"{PRO}/nihaisha-tcm-kb.js") as f:
    src = f.read()
print(f"大小: {len(src)/1024/1024:.1f}MB")

# 顶层模块: "key": { title, source, keyPoints: [...], ... }
mods = re.findall(r'^\s*"(\w[\w-]*)":\s*\{', src, re.MULTILINE)
print(f"模块数: {len(mods)}")

for key in mods:
    # 提取模块块（到下一个 "xxx": { 或结尾）
    mm = re.search(rf'^\s*"{key}":\s*\{{(.*?)(?=^\s*"[^"]+":\s*\{{|\Z)', src, re.MULTILINE | re.DOTALL)
    if not mm:
        continue
    body = mm.group(1)
    title_m = re.search(r'title:\s*"([^"]+)"', body)
    title = title_m.group(1) if title_m else key
    
    # keyPoints / content / rawContent
    parts = []
    kp = re.search(r'keyPoints:\s*\[(.*?)\]', body, re.DOTALL)
    if kp:
        items = re.findall(r'"([^"]{20,800})"', kp.group(1))
        if items:
            parts.append("核心要点：\n" + "\n".join(f"• {i}" for i in items[:15]))
    
    rc = re.search(r'rawContent:\s*`([^`]{200,5000})`', body, re.DOTALL)
    if rc:
        parts.append(rc.group(1)[:3000])
    
    cc = re.search(r'content:\s*`([^`]{200,5000})`', body, re.DOTALL)
    if cc:
        parts.append(cc.group(1)[:3000])
    
    if not parts:
        # 通用文本提取
        texts = re.findall(r'"([^"]{40,1500})"', body)
        if texts:
            parts.append("\n".join(f"• {t}" for t in texts[:12]))
    
    if parts:
        mod = detect_module(key, title)
        insert(mod, f"倪师全量·{title[:40]}", f"来源：倪海厦中医知识库全量移植（{key}）。\n\n" + "\n\n".join(parts)[:4500], f"倪海厦,{title[:20]},{key},全量移植", 0.88)
        print(f"  ✅ {title[:35]}: {len(parts)}段")

print(f"  tcm-kb 新增: +{total}")

# ═══ 2. batch1-4 + classics + nishan ═══
for fname in ['nihaisha-batch1.js', 'nihaisha-batch2.js', 'nihaisha-batch3.js', 'nihaisha-batch4.js', 'nihaisha-classics-kb.js', 'nishan-knowledge.js']:
    print(f"\n═══ {fname} ═══")
    with open(f"{PRO}/{fname}") as f:
        src = f.read()
    print(f"大小: {len(src)/1024:.0f}KB")
    
    # 模块: 'key': { title, rawContent: `...` }
    mods2 = re.findall(r"^\s*'([\w\-\u4e00-\u9fff]+)':\s*\{", src, re.MULTILINE)
    if not mods2:
        mods2 = re.findall(r'^\s*"([\w\-\u4e00-\u9fff]+)":\s*\{', src, re.MULTILINE)
    print(f"模块数: {len(mods2)}")
    
    for key in mods2:
        mm = re.search(rf"['\"]{re.escape(key)}['\"]:\s*\{{(.*?)(?=^[\s]*['\"][^'\"]+['\"]:\s*\{{|\Z)", src, re.MULTILINE | re.DOTALL)
        if not mm:
            continue
        body = mm.group(1)
        title_m = re.search(r'title:\s*["\']([^"\']+)["\']', body)
        title = title_m.group(1) if title_m else key
        
        parts = []
        rc = re.search(r'rawContent:\s*`([^`]{300,6000})`', body, re.DOTALL)
        if rc:
            parts.append(rc.group(1)[:3500])
        cc = re.search(r'content:\s*`([^`]{300,6000})`', body, re.DOTALL)
        if cc:
            parts.append(cc.group(1)[:3500])
        kp = re.search(r'keyPoints:\s*\[(.*?)\]', body, re.DOTALL)
        if kp:
            items = re.findall(r'["\']([^"\']{20,800})["\']', kp.group(1))
            if items:
                parts.append("核心要点：\n" + "\n".join(f"• {i}" for i in items[:12]))
        
        if parts:
            mod = detect_module(key, title)
            insert(mod, f"倪师全量·{title[:40]}", f"来源：倪海厦知识库移植（{fname}/{key}）。\n\n" + "\n\n".join(parts)[:4500], f"倪海厦,{title[:20]},{key}", 0.88)
            print(f"  ✅ {title[:35]}")

print(f"\n  batch系列新增: +{total}")

# FTS5
cur.execute("DELETE FROM kb_fts5")
cur.execute("INSERT INTO kb_fts5 SELECT DISTINCT entry_id, module, title, COALESCE(content,''), COALESCE(keywords,''), COALESCE(category,'') FROM kb_formal WHERE entry_id IS NOT NULL AND length(content) > 0")
db.commit()
cur.execute("SELECT COUNT(*) FROM kb_formal"); kb = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM kb_fts5"); f = cur.fetchone()[0]
print(f"\n✅ 共新增 {total} 条 | KB={kb} FTS5={f} {'同步' if kb==f else '❌'}")
db.close()
