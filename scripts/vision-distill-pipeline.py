#!/usr/bin/env python3
"""
vision-distill-pipeline.py — 扫描件 PDF 视觉蒸馏流水线（R119 · 2026-08-16）

流程：PDF 分页渲染 → PNG → upload-mix 上传 → autoglm 识别 → 文本分块 → kb_formal 入库
记账：.openclaw/tmp/vision-distill-log.jsonl（防重 + 断点续跑）
用法：
  python3 scripts/vision-distill-pipeline.py <pdf路径> [--pages N] [--dry-run]
  python3 scripts/vision-distill-pipeline.py --dir ~/Desktop/周易-中医 --match "流年班*" --pages 1
"""
import os, sys, json, hashlib, sqlite3, glob, subprocess, tempfile, argparse
from datetime import datetime

ROOT = '/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian'
DB_PATH = f'{ROOT}/server/database/yidao.db'
LOG_PATH = f'{ROOT}/.openclaw/tmp/vision-distill-log.jsonl'
SKILL_DIR = '/Users/tom/.openclaw-autoclaw/skills/autoglm-image-recognition'
SRC_DIR = os.path.expanduser('~/Desktop/周易-中医')

def log_load():
    if not os.path.exists(LOG_PATH): return {}
    d = {}
    for line in open(LOG_PATH):
        try:
            r = json.loads(line)
            d[r['key']] = r
        except: pass
    return d

def log_append(r):
    with open(LOG_PATH, 'a') as f:
        f.write(json.dumps(r, ensure_ascii=False) + '\n')

def render_pdf(pdf, out_dir, max_pages):
    import fitz
    doc = fitz.open(pdf)
    n = min(max_pages or len(doc), len(doc))
    paths = []
    for i in range(n):
        pix = doc[i].get_pixmap(dpi=150)
        p = os.path.join(out_dir, f'p{i+1:03d}.png')
        pix.save(p)
        paths.append((i + 1, p))
    doc.close()
    return paths

def upload(url_path):
    r = subprocess.run(['python3', 'upload-mix.py', url_path], capture_output=True, text=True, cwd=SKILL_DIR, timeout=120)
    d = json.loads(r.stdout)
    return d['data']['oss_info'][0]['oss_url']

def recognize(oss_url, prompt):
    r = subprocess.run(['python3', 'image-recognition.py', oss_url, prompt], capture_output=True, text=True, cwd=SKILL_DIR, timeout=300)
    d = json.loads(r.stdout)
    return d['data']['text']

def classify(text, fname):
    t = (fname + ' ' + text[:300])
    if any(k in t for k in ('流年班', '命盘', '紫微', '大限', '四化', '宫位')):
        if any(k in t for k in ('癌', '病', '抑郁症', '不孕', '疾厄', '断病')):
            return 'ziwei-case'
        return 'ziwei'
    if any(k in t for k in ('中医', '望诊', '舌', '面诊', '医院', '神志')):
        return 'tcm-wangzhen'
    if any(k in t for k in ('六壬', '大六壬')):
        return 'liuren'
    if any(k in t for k in ('风水', '龙脉', '阴宅', '撼龙', '葬书')):
        return 'fengshui'
    if any(k in t for k in ('相术', '相学')):
        return 'xiangshu'
    if any(k in t for k in ('一掌经', '玉匣记')):
        return 'yijing'
    return 'yijing'

def ingest(text, fname, page, src_id, module):
    blocks = []
    buf = ''
    for line in text.split('\n'):
        line = line.strip()
        if not line: continue
        if len(buf) + len(line) > 1500:
            if len(buf) >= 300: blocks.append(buf)
            buf = line
        else:
            buf = (buf + '\n' + line).strip()
    if len(buf) >= 300: blocks.append(buf)
    if not blocks:
        blocks = [text[:2000]] if len(text) >= 100 else []
    conn = sqlite3.connect(DB_PATH, timeout=30)
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    inserted = 0
    for bi, block in enumerate(blocks):
        fp = hashlib.sha1(block.encode()).hexdigest()
        eid = f"KB-VIS-{fp[:8]}-{page:03d}-{bi:02d}"
        cur = conn.execute(
            """INSERT OR IGNORE INTO kb_formal
               (entry_id,module,title,content,src_id,category,keywords,summary,trust_score,
                version,promoted_at,promoted_from,reviewed_by,hit_count,last_hit,tags,
                source_ids,confidence,access_level,difficulty,status,created_at,updated_at,
                audit_status,audit_by,audit_at,audit_notes,model_id,fingerprint,authority)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (eid, module, f'{fname}#p{page}#{bi+1}', block[:4000], src_id, '桌面扫描件',
             '桌面,扫描件,' + fname[:15], block[:200], 0.8,
             'v1', now, 'vision-pipeline', 'auto-bot', 0, None, 'yijing|desktop',
             src_id, 0.8, 'public', 'intermediate', 'active', now, now,
             'auto-pending', 'vision-bot', now, 'vision distill', 'yidao-v8', fp, 'yijing-desktop'))
        if cur.rowcount > 0:
            inserted += 1
    conn.commit()
    conn.close()
    return inserted

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('pdf', nargs='?')
    ap.add_argument('--dir', default=SRC_DIR)
    ap.add_argument('--match', default='*.pdf')
    ap.add_argument('--pages', type=int, default=1)
    ap.add_argument('--dry-run', action='store_true')
    args = ap.parse_args()

    files = [args.pdf] if args.pdf else sorted(glob.glob(os.path.join(args.dir, args.match)))
    if not files:
        print(json.dumps({'status': 'no_files'})); return
    log = log_load()
    print(f'待处理 {len(files)} 个文件')
    report = {'ok': [], 'skip': [], 'fail': []}
    for pdf in files:
        fname = os.path.basename(pdf)
        key = fname
        if key in log and log[key].get('status') == 'ok':
            report['skip'].append(fname); print(f'⏭ 已处理: {fname}'); continue
        if args.dry_run:
            print(f'🔍 dry-run: {fname}'); report['ok'].append(fname); continue
        try:
            with tempfile.TemporaryDirectory() as td:
                pages = render_pdf(pdf, td, args.pages)
                texts = []
                for pno, png in pages:
                    oss = upload(png)
                    txt = recognize(oss, '详细识别图片中的全部文字和内容，保留原文结构，这是命理/中医教学资料')
                    texts.append(f'[第{pno}页] {txt}')
                full = '\n'.join(texts)
                if len(full) < 80:
                    log_append({'key': key, 'ts': datetime.now().isoformat(), 'status': 'low_text', 'len': len(full)})
                    report['fail'].append(fname); print(f'⚠️ 低文本: {fname} ({len(full)}字)'); continue
                module = classify(full, fname)
                src_id = f"SRC-VISION-{hashlib.md5(fname.encode()).hexdigest()[:8]}"
                inserted = ingest(full, os.path.splitext(fname)[0][:40], 1, src_id, module)
                log_append({'key': key, 'ts': datetime.now().isoformat(), 'status': 'ok', 'module': module, 'inserted': inserted, 'pages': len(pages)})
                report['ok'].append(fname)
                print(f'✅ {fname[:36]}: {len(pages)}页 → {module} 入 {inserted} 条')
        except Exception as e:
            log_append({'key': key, 'ts': datetime.now().isoformat(), 'status': 'error', 'error': str(e)[:150]})
            report['fail'].append(fname)
            print(f'❌ {fname[:36]}: {str(e)[:80]}')
    # FTS rebuild
    try:
        conn = sqlite3.connect(DB_PATH, timeout=30)
        conn.execute("INSERT INTO kb_fts5(kb_fts5) VALUES('rebuild')")
        conn.commit(); conn.close()
        print('FTS5 rebuild ✅')
    except Exception as e:
        print(f'FTS5: {e}')
    print(json.dumps({'status': 'done', 'ok': len(report['ok']), 'skip': len(report['skip']), 'fail': len(report['fail'])}, ensure_ascii=False))

if __name__ == '__main__':
    main()
