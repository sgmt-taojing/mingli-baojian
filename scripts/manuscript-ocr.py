#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
manuscript-ocr.py — MB-K1 扫描件 OCR 提取管线（pipeline v2-ocr，2026-09-26）
主管线 manuscript-extract.py 的 OCR 补充模式：pypdf 文本层 <500 字的扫描件
→ PyMuPDF 逐页栅格化(300dpi) → tesseract(chi_sim+chi_tra；古籍竖排 _vert)
→ 同一 rules/g2 蒸馏链 + 五红线质量门 → kb_staging(pending) → 回执 v2-ocr。

纪律与主管线一致：蒸馏全灭不写回执留队；指纹 MS|md5 幂等（与 v1 部分提取不冲突）；
原件只读。回执 pipeline_version='v2-ocr' 覆盖 v1 假回执/薄回执。

用法：
  python3 manuscript-ocr.py --names 玉匣记              # 横排
  python3 manuscript-ocr.py --names 紫微 --vert          # 竖排古籍
  python3 manuscript-ocr.py --names 流年班 --max-pages 60 --start-page 0   # 分页段跑（超时控制）
环境：托管 python（pymupdf+pypdf）；tesseract=/opt/homebrew/bin/tesseract。
"""
import json, os, re, sys, sqlite3, hashlib, subprocess, argparse, importlib.util
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).resolve().parent.parent
TESS = '/opt/homebrew/bin/tesseract'
CACHE = ROOT / '.openclaw' / 'tmp' / 'ocr-cache'
OCR_VERSION = 'v2-ocr'

# 复用主管线（切块/蒸馏/质量门/回执/台账）
spec = importlib.util.spec_from_file_location('manuscript_extract', ROOT / 'scripts' / 'manuscript-extract.py')
me = importlib.util.module_from_spec(spec)
spec.loader.exec_module(me)


def log(*a):
    print(f"[{datetime.now():%H:%M:%S}]", *a, flush=True)


def ocr_pdf(src, sid8, lang, start, max_pages, dpi=300):
    """栅格化+tesseract，带页级缓存可断点续跑。返回 (text, note, total_pages, done_pages)
    自适应 dpi：像素长边限 12000（防巨页 OOM/tesseract 崩 stderr）；空文本页不算完成。"""
    import pymupdf
    CACHE.mkdir(parents=True, exist_ok=True)
    cache = CACHE / f'{sid8}.ocr.txt'
    done = set()
    if cache.exists():
        raw0 = cache.read_text(encoding='utf-8', errors='ignore')
        for m in re.finditer(r'\f<!--p(\d+)-->\n(.*?)(?=\f<!--p\d+-->|\Z)', raw0, re.S):
            if len(m.group(2).strip()) > 20:
                done.add(int(m.group(1)))
    doc = pymupdf.open(str(src))
    n = doc.page_count
    end = min(n, start + max_pages) if max_pages else n
    tmp = CACHE / f'{sid8}.page.png'
    with cache.open('a', encoding='utf-8') as f:
        for i in range(start, end):
            if i in done:
                continue
            pg = doc.load_page(i)
            long_pt = max(pg.rect.width, pg.rect.height)
            cap = int(12000 * 72 / long_pt) if long_pt > 0 else dpi
            pix = None
            for d in sorted({min(dpi, cap), 200, 150, 100, 72}, reverse=True):
                try:
                    pix = pg.get_pixmap(dpi=d)
                    break
                except Exception:
                    continue
            if pix is None:
                log(f'  ⚠ 第{i+1}页栅格化失败，跳过')
                continue
            pix.save(str(tmp))
            txt = ''
            for attempt in range(2):
                try:
                    r = subprocess.run([TESS, str(tmp), 'stdout', '-l', lang, '--psm', '6'],
                                       capture_output=True, text=True, errors='ignore', timeout=240)
                    txt = r.stdout.strip()
                    break
                except subprocess.TimeoutExpired:
                    log(f'  ⚠ 第{i+1}页 tesseract 超时（第{attempt+1}次）')
                    if attempt == 0:
                        try:
                            pg.get_pixmap(dpi=100).save(str(tmp))
                        except Exception:
                            pass
            if not txt:
                # 零字页兜底：思维导图/稀疏排版在 psm6 下整页漏识，换 psm11 稀疏模式重试
                try:
                    r = subprocess.run([TESS, str(tmp), 'stdout', '-l', lang, '--psm', '11'],
                                       capture_output=True, text=True, errors='ignore', timeout=240)
                    txt = r.stdout.strip()
                    if txt:
                        log(f'  ◎ 第{i+1}页 psm6 零字 → psm11 兜底命中 {len(txt)} 字')
                except subprocess.TimeoutExpired:
                    log(f'  ⚠ 第{i+1}页 psm11 兜底也超时')
            f.write(f'\f<!--p{i}-->\n{txt}\n')
            f.flush()
            if (i + 1) % 10 == 0 or i == end - 1:
                log(f'  …OCR {i+1}/{n} 页（末页 {len(txt)} 字）')
    doc.close()
    if tmp.exists():
        tmp.unlink()
    raw = cache.read_text(encoding='utf-8', errors='ignore')
    pages = re.split(r'\f<!--p\d+-->\n', raw)
    text = '\n'.join(p.strip() for p in pages if p.strip())
    done_pages = sum(1 for m in re.finditer(r'\f<!--p\d+-->\n(.*?)(?=\f<!--p\d+-->|\Z)', raw, re.S)
                     if len(m.group(1).strip()) > 20)
    return text, f'OCR {done_pages}/{n}页 {lang}', n, done_pages


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--names', nargs='+', required=True)
    ap.add_argument('--vert', action='store_true', help='古籍竖排（chi_tra_vert+chi_sim_vert）')
    ap.add_argument('--start-page', type=int, default=0)
    ap.add_argument('--max-pages', type=int, default=0)
    ap.add_argument('--backend', choices=['auto', 'g2', 'rules'], default='auto')
    ap.add_argument('--dry', action='store_true')
    ap.add_argument('--force', action='store_true', help='无视 v1 回执强制重提')
    args = ap.parse_args()
    lang = 'chi_tra_vert+chi_sim_vert' if args.vert else 'chi_sim+chi_tra'

    items = json.loads(me.QUEUE.read_text(encoding='utf-8'))
    sel = [it for it in items if any(n in it['name'] for n in args.names)]
    if not sel:
        log('无匹配材料'); return
    # 回执去重：v1 提取已达标的跳过；薄产物（<10 条）允许 v2 OCR 重提
    if not args.force and me.RECEIPTS.exists():
        try:
            done_ok = set()
            for r in json.loads(me.RECEIPTS.read_text(encoding='utf-8')):
                if not r.get('accepted'):
                    continue
                out = Path(r.get('output_path', ''))
                if out.exists() and sum(1 for _ in out.open(encoding='utf-8', errors='ignore')) >= 10:
                    done_ok.add(r['source_id'])
            skip = [it for it in sel if it['source_id'] in done_ok]
            for it in skip:
                log(f'  ⤼ 跳过（v1 已达标）：{it["name"]}')
            sel = [it for it in sel if it['source_id'] not in done_ok]
        except Exception:
            pass
    if not sel:
        log('全部已达标，无需 OCR'); return

    conn = None if args.dry else sqlite3.connect(str(me.DB))
    if conn:
        conn.execute('PRAGMA busy_timeout=30000')
        lib_fps = {r[0] for r in conn.execute("SELECT fingerprint FROM kb_formal WHERE fingerprint LIKE 'MS|%'")}
        lib_fps |= {r[0] for r in conn.execute("SELECT fingerprint FROM kb_staging WHERE fingerprint LIKE 'MS|%'") if r[0]}

    for it in sel:
        name, sid8 = it['name'], it['sha256'][:8]
        module, domain = me.mod_of(name)
        log(f'━━ OCR 提取 {name}（{it["bytes"]//1024}KB → {module}/{domain or "空域"}，{lang}）')
        text, note, total, done_p = ocr_pdf(it['archive_path'], sid8, lang, args.start_page, args.max_pages)
        log(f'  文本 {len(text)} 字（{note}）')
        if done_p < total:
            log(f'  ⏸ 页段未完（{done_p}/{total}），续跑：--start-page {done_p}')
            continue
        if len(text.strip()) < 300:
            log('  ✗ OCR 产出过薄，不写回执')
            continue
        if args.dry:
            continue
        entries, blocked, api_fail = [], 0, 0
        chs = list(me.chunks(text))
        used_backend = None
        for ci, ch in enumerate(chs):
            got, be = me.ai_distill(ch, name, args.backend, module)
            if be:
                used_backend = be
            elif not got:
                api_fail += 1
            for e in got:
                content = (e.get('content') or '').strip()
                title = (e.get('title') or '').strip()[:60]
                if len(content) < 300 or not title:
                    blocked += 1; continue
                if not me.MINGLI_ANCHOR.search(title + content):
                    blocked += 1; continue
                if me.MEDICAL_RX.search(content):
                    blocked += 1; continue
                fp = 'MS|' + hashlib.md5((module + content).encode()).hexdigest()
                if fp in lib_fps:
                    blocked += 1; continue
                lib_fps.add(fp)
                entries.append({'title': title, 'summary': (e.get('summary') or '')[:200],
                                'keywords': e.get('keywords') or '', 'content': content, 'fingerprint': fp})
            if (ci + 1) % 10 == 0:
                log(f'  …块 {ci+1}/{len(chs)} 累计 {len(entries)} 条')
        if not entries and len(chs) > 0:
            # 零产出一律不写回执（R2 漏洞修：rules 链零产出也曾误写回执致永久封盘）
            log(f'  ✗ 蒸馏零产出（块 {len(chs)} / API失败 {api_fail}），不写回执，留队待 AI 链复提')
            continue
        out_path = me.OUTDIR / f'manuscript-{sid8}.jsonl'
        with out_path.open('w', encoding='utf-8') as f:
            for e in entries:
                f.write(json.dumps({'ts': datetime.now().isoformat(), 'source': name, 'module': module,
                                    'domain': domain, **e}, ensure_ascii=False) + '\n')
        for e in entries:
            eid = 'KB-MS-' + hashlib.md5((module + e['content']).encode()).hexdigest()[:12]
            kw = [k.strip() for k in str(e['keywords']).split(',') if k.strip()]
            conn.execute(
                "INSERT OR IGNORE INTO kb_staging (entry_id, module, title, content, summary, keywords, tags, status, src_id, raw_metadata, fingerprint, created_at, updated_at) "
                "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
                (eid, module, e['title'], e['content'], e['summary'], json.dumps(kw, ensure_ascii=False),
                 json.dumps([domain] if domain else [], ensure_ascii=False), 'pending', 'SRC-BOSS-MANUSCRIPT',
                 json.dumps({'source_doc': name, 'source_id': it['source_id'], 'domain': domain, 'ocr': lang}, ensure_ascii=False),
                 e['fingerprint'], datetime.now().strftime('%Y-%m-%d %H:%M:%S'), datetime.now().strftime('%Y-%m-%d %H:%M:%S')))
        conn.commit()
        # 回执 v2-ocr（write_receipt 按 source_id 去重覆盖 v1）
        me.PIPELINE_VERSION = OCR_VERSION
        me.write_receipt(it, out_path)
        log(f'  ✅ OCR 蒸馏 {len(entries)} 条入 staging（拦 {blocked}，backend={used_backend}）→ {out_path.name}，回执 v2-ocr 已写')
        with me.LEDGER.open('a', encoding='utf-8') as f:
            f.write(f"| {datetime.now():%m-%d %H:%M} | {name} | {note} | {len(text)}字/{len(chs)}块 | {len(entries)+blocked} | {len(entries)} | {blocked} | {out_path.name} | ✅OCR({used_backend}) |\n")
    if conn:
        conn.close()
    log('OCR 全部完成')


if __name__ == '__main__':
    main()
