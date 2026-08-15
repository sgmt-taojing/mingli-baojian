# -*- coding: utf-8 -*-
"""倪师视频字幕 → KB 蒸馏
- 去水印噪音行
- 按 2500 字符分段入库
- trust 0.85 (字幕OCR, 讲课原文)
"""
import os, re, sqlite3, hashlib, sys

SUBS = "/Volumes/data2/nishi-materials/subs"
DB = "/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/server/database/yidao.db"

# 水印/噪音行模式
NOISE_PATTERNS = [
    r'^\[\d+s\]\s*(焦|經|經|渶|軓|普|濟|天|心|离|古|流|芳|卍|世|荔|威|塑|驚|學|海|漢|唐|瀋|臨|傳|承|典|藏|版|集|第|節|課|錄|影|音|視|頻|源|騰|訊|愛|奇|藝|優|酷|嗶|哩|嗶|哩|釦|音|字|幕|組|壓|制|發|佈|修|復|高|清|带|字|幕|有|噪|音|這|集|$)', 
]
# 纯水印行: 字面重复的水印片段
WATERMARK_FRAGS = ["古流芳", "普濟天", "渶軓醫學", "普济天", "海古流芳", "瀋陽", "焦經", "焦 經", "威世荔"]

def is_noise(line):
    """判断是否为水印/噪音行"""
    # 去掉时间戳前缀
    content = re.sub(r'^\[\d+s\]\s*', '', line).strip()
    if len(content) < 3:
        return True
    # 水印关键词: 2个以上水印字
    wm_count = sum(1 for frag in WATERMARK_FRAGS if frag in content)
    if wm_count >= 1 and len(content) <= 15:
        return True
    # 全是单字重复 (水印特征)
    chars = set(content.replace(' ', ''))
    if len(chars) <= 4 and len(content) > 8:
        return True
    return False

def clean_text(raw):
    """清洗字幕文本"""
    lines = raw.split('\n')
    cleaned = []
    prev = ""
    for line in lines:
        if not line.strip():
            continue
        # 去时间戳
        content = re.sub(r'^\[\d+s\]\s*', '', line).strip()
        if is_noise(line):
            continue
        # 去重: 与上一行几乎相同 (OCR 重复)
        if prev and (content in prev or prev in content):
            continue
        cleaned.append(content)
        prev = content
    return '\n'.join(cleaned)

def detect_module(filename, text):
    if '针灸' in filename:
        return 'tcm-acupuncture'
    if '黄帝内经' in filename:
        return 'tcm-classical'
    if '神农本草' in filename:
        return 'tcm-herb'
    if '伤寒' in filename:
        return 'shanghan-lun'
    if '金匮' in filename:
        return 'tcm-fangji'
    if '天纪' in filename:
        return 'yijing'
    if '紫微' in filename:
        return 'ziwei'
    if '易经' in filename:
        return 'yijing'
    if '堪舆' in filename or '风水' in filename:
        return 'fengshui'
    if '四柱' in filename or '八字' in filename:
        return 'bazi'
    return 'tcm'

def main():
    db = sqlite3.connect(DB, timeout=30)
    db.execute("PRAGMA busy_timeout=30000")
    cur = db.cursor()
    total = 0

    files = sorted([f for f in os.listdir(SUBS) if f.endswith('.txt') and f != 'progress.log' and f != 'run.log'])
    print(f"字幕文件: {len(files)}")

    for fname in files:
        path = os.path.join(SUBS, fname)
        with open(path) as f:
            raw = f.read()
        text = clean_text(raw)
        if len(text) < 800:
            print(f"  ⏭️ {fname}: 内容太少 ({len(text)}字符)")
            continue

        module = detect_module(fname, text)
        title = fname.replace('.txt', '').replace('（这集有噪音）', '')

        # 按 2500 字符分段
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
            eid = "KB-NISHI-VID-" + hashlib.md5(f"{fname}-{i}".encode()).hexdigest()[:8]
            exists = cur.execute("SELECT 1 FROM kb_formal WHERE entry_id=?", (eid,)).fetchone()
            if not exists:
                cur.execute("""INSERT INTO kb_formal 
                    (entry_id,module,title,content,category,keywords,trust_score,status,audit_status,hit_count)
                    VALUES(?,?,?,?,?,?,?,'active','approved',0)""",
                    (eid, module, f"倪师·{title}·第{i+1}段",
                     f"来源：倪师智慧结晶视频字幕（《{title}》视频画面烧录字幕 OCR 提取，倪海厦讲课原文）。\n\n{seg[:4500]}",
                     module, f"倪海厦,{title},视频字幕,讲课,OCR", 0.85))
                inserted += 1
        total += inserted
        print(f"  ✅ {fname}: +{inserted} 条 ({len(text):,}字符 → {len(segs)}段)")

    # FTS5 增量同步（先删后插保证幂等，FTS5 无 UNIQUE 约束）
    # 仅在有新增 或 FTS 计数与主表不一致时才重建，避免无谓抢写锁（api-server-v2 持续写入并发）
    fts_cnt = cur.execute("SELECT COUNT(*) FROM kb_fts5 WHERE entry_id LIKE 'KB-NISHI-VID-%'").fetchone()[0]
    kb_cnt = cur.execute("SELECT COUNT(*) FROM kb_formal WHERE entry_id LIKE 'KB-NISHI-VID-%'").fetchone()[0]
    if total > 0 or fts_cnt != kb_cnt:
        print(f"  🔄 FTS5 同步: 新增{total} | fts={fts_cnt} kb={kb_cnt} → 重建")
        cur.execute("""DELETE FROM kb_fts5 WHERE entry_id LIKE 'KB-NISHI-VID-%'""")
        cur.execute("""INSERT INTO kb_fts5 
            SELECT entry_id, module, COALESCE(content,''), title, COALESCE(keywords,'') || ' ' || COALESCE(category,''), COALESCE(tags,'') 
            FROM kb_formal WHERE entry_id LIKE 'KB-NISHI-VID-%'""")
        db.commit()
    else:
        print(f"  ⏭️ FTS5 跳过: 无新增且计数一致 (fts={fts_cnt} kb={kb_cnt})")
    cur.execute("SELECT COUNT(*) FROM kb_formal")
    kb = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM kb_formal WHERE keywords LIKE '%倪海厦%'")
    nishi = cur.fetchone()[0]
    print(f"✅ 共插入 {total} 条 | KB={kb} | 倪师={nishi}")
    db.close()

if __name__ == "__main__":
    main()
