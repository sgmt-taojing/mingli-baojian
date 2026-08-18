#!/usr/bin/env python3
"""scan-sample-index.py — 倪师扫描件抽样索引（R121）
每日最多 2 本 × 3 页视觉识别，建目录索引（成本控制）
记账：.openclaw/tmp/scan-sample-index.jsonl
"""
import os, json, fitz, glob, hashlib, sqlite3, subprocess
from datetime import datetime

BASE = '/Volumes/data1/training-materials/desktop-20260816/倪师智慧结晶'
DB = '/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/server/database/yidao.db'
LOG = '/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/.openclaw/tmp/scan-sample-index.jsonl'
SKILL = '/Users/tom/.openclaw-autoclaw/skills/autoglm-image-recognition'
MAX_BOOKS, MAX_PAGES = 2, 3

def classify(fname):
    t = fname
    if re_search(t, r'伤寒'): return 'shanghan-lun'
    if re_search(t, r'金匮|杂病'): return 'jinkui-yaolue'
    if re_search(t, r'内经|素问|灵枢'): return 'huangdi-neijing'
    if re_search(t, r'本草|神农'): return 'shennong-bencao'
    if re_search(t, r'针灸|经络'): return 'tcm-acupuncture'
    if re_search(t, r'相术|相学|麻衣|柳庄'): return 'xiangshu'
    if re_search(t, r'六壬'): return 'liuren'
    if re_search(t, r'风水|龙脉|葬书|撼龙'): return 'fengshui'
    return 'nihaisha-tcm'

def re_search(t, pat):
    import re
    return re.search(pat, t)

def upload(p):
    r = subprocess.run(['python3', 'upload-mix.py', p], capture_output=True, text=True, cwd=SKILL, timeout=120)
    return json.loads(r.stdout)['data']['oss_info'][0]['oss_url']

def recognize(url):
    r = subprocess.run(['python3', 'image-recognition.py', url, '识别全部文字（古籍目录页）'], capture_output=True, text=True, cwd=SKILL, timeout=240)
    return json.loads(r.stdout)['data']['text']

def main():
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
    # 只取扫描件（未处理过的），优先名字含关键词的
    todo = [p for p in pdfs if os.path.basename(p) not in done]
    if not todo:
        print(json.dumps({'status': 'no_new'})); return
    conn = sqlite3.connect(DB, timeout=30)
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    total = 0
    processed = 0
    for p in todo[:MAX_BOOKS]:
        fname = os.path.basename(p)
        module = classify(fname)
        src = f"SRC-NHSS-{hashlib.md5(fname.encode()).hexdigest()[:8]}"
        try:
            doc = fitz.open(p)
            n = min(MAX_PAGES, len(doc))
            for i in range(n):
                pix = doc[i].get_pixmap(dpi=150)
                img = f'/tmp/nhs-scan-{hashlib.md5(fname.encode()).hexdigest()[:6]}-p{i+1}.png'
                pix.save(img)
                try:
                    url = upload(img)
                    text = recognize(url)
                    if len(text) < 60:
                        continue
                    fp = hashlib.sha1(text.encode()).hexdigest()
                    eid = f"KB-NHSS-{fp[:8]}-{i+1:03d}"
                    cur = conn.execute(
                        """INSERT OR IGNORE INTO kb_formal
                           (entry_id,module,title,content,src_id,category,keywords,summary,trust_score,
                            version,promoted_at,promoted_from,reviewed_by,hit_count,last_hit,tags,
                            source_ids,confidence,access_level,difficulty,status,created_at,updated_at,
                            audit_status,audit_by,audit_at,audit_notes,model_id,fingerprint,authority)
                           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                        (eid, module, f'{os.path.splitext(fname)[0][:40]}·第{i+1}页', text[:4000], src, '倪师扫描件索引',
                         '倪师,' + module, text[:200], 0.75,
                         'v1', now, 'scan-index', 'auto-bot', 0, None, 'yijing|desktop',
                         src, 0.75, 'public', 'intermediate', 'active', now, now,
                         'auto-pending', 'vision-bot', now, 'scan sample', 'yidao-v8', fp, 'yijing-desktop'))
                    conn.commit()
                    if cur.rowcount > 0: total += 1
                except Exception as e:
                    print(f'  p{i+1} ERR: {str(e)[:50]}', flush=True)
            doc.close()
            processed += 1
            with open(LOG, 'a') as f:
                f.write(json.dumps({'key': fname, 'module': module, 'pages': n, 'ts': now}) + '\n')
        except Exception as e:
            with open(LOG, 'a') as f:
                f.write(json.dumps({'key': fname, 'error': str(e)[:80], 'ts': now}) + '\n')
    conn.close()
    print(json.dumps({'status': 'ok', 'books': processed, 'inserted': total}))

if __name__ == '__main__':
    main()
