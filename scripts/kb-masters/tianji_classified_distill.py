# -*- coding: utf-8 -*-
"""天纪分类版字幕 → KB 蒸馏（按主题模块: 紫微/易经/堪舆/四柱/六壬/开篇）"""
import os, re, sqlite3, hashlib

SUBS = "/Volumes/data2/nishi-materials/subs-tianji-classified"
DB = "/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/server/database/yidao.db"

def detect_module(fname):
    if '紫微' in fname: return 'ziwei'
    if '易经' in fname: return 'yijing'
    if '堪舆' in fname: return 'fengshui'
    if '四柱' in fname: return 'bazi'
    if '六壬' in fname: return 'liuren'
    if '开篇' in fname: return 'yijing'
    return 'yijing'

NOISE = ["古流芳", "普濟天", "渶軓醫學", "普济天", "海古流芳", "瀋陽", "焦經"]

def is_noise(line):
    content = re.sub(r'^\[\d+s\]\s*', '', line).strip()
    if len(content) < 3:
        return True
    wm = sum(1 for frag in NOISE if frag in content)
    if wm >= 1 and len(content) <= 15:
        return True
    chars = set(content.replace(' ', ''))
    if len(chars) <= 4 and len(content) > 8:
        return True
    return False

def clean_text(raw):
    lines = raw.split('\n')
    cleaned = []
    prev = ""
    for line in lines:
        if not line.strip():
            continue
        content = re.sub(r'^\[\d+s\]\s*', '', line).strip()
        if is_noise(line):
            continue
        if prev and (content in prev or prev in content):
            continue
        cleaned.append(content)
        prev = content
    return '\n'.join(cleaned)

def main():
    db = sqlite3.connect(DB)
    cur = db.cursor()
    total = 0

    files = sorted([f for f in os.listdir(SUBS) if f.endswith('.txt') and f not in ('progress.log', 'run.log')])
    print(f"天纪分类版字幕: {len(files)}")

    for fname in files:
        path = os.path.join(SUBS, fname)
        with open(path) as f:
            raw = f.read()
        text = clean_text(raw)
        if len(text) < 800:
            continue
        module = detect_module(fname)
        title = fname.replace('.txt', '').replace('_new', '').replace('(1)', '').strip()[:40]

        # 分段 2500 字符
        segs = []
        cur_seg = []
        cur_len = 0
        for line in text.split('\n'):
            cur_seg.append(line)
            cur_len += len(line)
            if cur_len >= 2500:
                segs.append('\n'.join(cur_seg))
                cur_seg = []
                cur_len = 0
        if cur_seg:
            segs.append('\n'.join(cur_seg))

        inserted = 0
        for i, seg in enumerate(segs):
            if len(seg) < 300:
                continue
            eid = "KB-TJCLS-" + hashlib.md5(f"{fname}-{i}".encode()).hexdigest()[:8]
            exists = cur.execute("SELECT 1 FROM kb_formal WHERE entry_id=?", (eid,)).fetchone()
            if exists:
                continue
            cur.execute("""INSERT INTO kb_formal 
                (entry_id,module,title,content,category,keywords,trust_score,status,audit_status,hit_count)
                VALUES(?,?,?,?,?,?,?,'active','approved',0)""",
                (eid, module, f"倪师天纪分类·{title}·第{i+1}段",
                 f"来源：倪师智慧结晶天纪分类版视频字幕（《{title}》画面烧录字幕 OCR 提取，倪海厦讲课原文）。\n\n{seg[:4500]}",
                 module, f"倪海厦,天纪,{title},视频字幕,讲课", 0.85))
            inserted += 1
        total += inserted
        if inserted:
            print(f"  ✅ {title}: +{inserted}")

    # FTS5 增量
    cur.execute("DELETE FROM kb_fts5 WHERE entry_id LIKE 'KB-TJCLS-%'")
    cur.execute("""INSERT INTO kb_fts5 
        SELECT entry_id, module, title, COALESCE(content,''), COALESCE(keywords,''), COALESCE(category,'') 
        FROM kb_formal WHERE entry_id LIKE 'KB-TJCLS-%'""")
    db.commit()
    cur.execute("SELECT COUNT(*) FROM kb_formal"); kb = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM kb_fts5"); f = cur.fetchone()[0]
    print(f"\n✅ 新增 {total} 条 | KB={kb} FTS5={f} {'同步' if kb==f else '❌'}")
    db.close()

if __name__ == "__main__":
    main()
