#!/usr/bin/env python3
"""倪师电子书文本型批量蒸馏（R121）：431 本 → kb_formal
模块分类：伤寒/金匮/内经/本草/针灸/方剂/诊断/本草/一般
记账：.openclaw/tmp/nihaisha-text-distill.jsonl（断点续跑）"""
import os, re, fitz, json, hashlib, sqlite3, sys
from datetime import datetime

BASE = '/Volumes/data1/training-materials/desktop-20260816/倪师智慧结晶'
DB = '/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/server/database/yidao.db'
LOG = '/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/.openclaw/tmp/nihaisha-text-distill.jsonl'
MAX_PAGES = 120  # 每本最多 120 页（控制规模）

def classify(fname, text):
    t = fname + ' ' + (text or '')[:300]
    if re.search(r'伤寒|桂林古本|吴迁本', t): return 'shanghan-lun'
    if re.search(r'金匮|杂病论', t): return 'jinkui-yaolue'
    if re.search(r'黄帝内经|素问|灵枢', t): return 'huangdi-neijing'
    if re.search(r'本草|神农', t): return 'shennong-bencao'
    if re.search(r'针灸|经络|穴位', t): return 'tcm-acupuncture'
    if re.search(r'方剂|汤头|经方', t): return 'tcm-fangji'
    if re.search(r'诊断|辨证|望诊|脉诊', t): return 'tcm-diagnosis'
    return 'nihaisha-tcm'

def chunk_text(text, size=1200):
    paras = [p.strip() for p in text.split('\n') if p.strip()]
    blocks, buf = [], ''
    for p in paras:
        if len(buf) + len(p) > size:
            if len(buf) >= 200: blocks.append(buf)
            buf = p
        else:
            buf = (buf + '\n' + p).strip()
    if len(buf) >= 200: blocks.append(buf)
    return blocks

def main():
    # 已处理记账
    done = set()
    if os.path.exists(LOG):
        for line in open(LOG):
            try: done.add(json.loads(line)['key'])
            except: pass

    pdfs = []
    for root, dirs, files in os.walk(BASE):
        for f in files:
            if f.lower().endswith('.pdf'):
                pdfs.append(os.path.join(root, f))

    conn = sqlite3.connect(DB, timeout=30)
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    total_books = total_blocks = 0
    for p in pdfs:
        fname = os.path.basename(p)
        key = fname
        if key in done: continue
        try:
            doc = fitz.open(p)
            n = min(MAX_PAGES, len(doc))
            full = []
            for i in range(n):
                try:
                    t = doc[i].get_text().strip()
                    if t: full.append(f'[p{i+1}] {t}')
                except: pass
            doc.close()
            text = '\n'.join(full)
            if len(text) < 300:
                # 记账跳过（低文本）
                with open(LOG, 'a') as f:
                    f.write(json.dumps({'key': key, 'status': 'low_text', 'ts': now}) + '\n')
                continue
            module = classify(fname, text)
            src_id = f"SRC-NHS-{hashlib.md5(fname.encode()).hexdigest()[:8]}"
            title_base = os.path.splitext(fname)[0][:60]
            blocks = chunk_text(text)
            inserted = 0
            for bi, block in enumerate(blocks):
                fp = hashlib.sha1(block.encode()).hexdigest()
                eid = f"KB-NHST-{fp[:8]}-{bi:02d}"
                cur = conn.execute(
                    """INSERT OR IGNORE INTO kb_formal
                       (entry_id,module,title,content,src_id,category,keywords,summary,trust_score,
                        version,promoted_at,promoted_from,reviewed_by,hit_count,last_hit,tags,
                        source_ids,confidence,access_level,difficulty,status,created_at,updated_at,
                        audit_status,audit_by,audit_at,audit_notes,model_id,fingerprint,authority)
                       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                    (eid, module, f'{title_base}#{bi+1}', block[:4000], src_id, '倪师电子书文本',
                     '倪师,' + module, block[:200], 0.85,
                     'v1', now, 'data1-text', 'auto-bot', 0, None, 'yijing|desktop',
                     src_id, 0.85, 'public', 'intermediate', 'active', now, now,
                     'auto-pending', 'yzx-bot', now, 'text distill', 'yidao-v8', fp, 'yijing-desktop'))
                if cur.rowcount > 0: inserted += 1
            conn.commit()
            total_blocks += inserted
            total_books += 1
            with open(LOG, 'a') as f:
                f.write(json.dumps({'key': key, 'status': 'ok', 'module': module, 'inserted': inserted, 'ts': now}) + '\n')
            if total_books % 20 == 0:
                print(f'进度: {total_books} 本 / {total_blocks} 块', flush=True)
        except Exception as e:
            with open(LOG, 'a') as f:
                f.write(json.dumps({'key': key, 'status': 'error', 'error': str(e)[:80], 'ts': now}) + '\n')
    conn.close()
    print(f'完成: {total_books} 本 / {total_blocks} 块入库', flush=True)

if __name__ == '__main__':
    main()
