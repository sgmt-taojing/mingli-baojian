#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""康节本《紫微斗数全书》正文 OCR 净本入库（G26 紫微密度翻倍 · 2026-09-30 Kimi）

背景：training/ocr-books/kangjie-ziwei/ 402 页 OCR 净本（□>15% 乱码页 0，
低字数页 2，质量过关）。卷四命图 n197-254 已结构化入库（ziwei-mingtu 114 条），
其余 348 页正文（赋文/论/歌诀，含太微赋、形声赋、骨髓赋等）未入 KB——本脚本补齐。
口径：原文不改写（含 OCR 噪声，如实标注）；按页序拼接、段落边界切块（800-1600 字）；
      trust 0.85（OCR 整理本，非点校原典）；module=ziwei / domain=mingli /
      src_id=kangjie-ziwei / 指纹幂等（KBIngestor R-INGEST-SPEC-20260927）。
用法：/usr/bin/python3 scripts/ingest-kangjie-ziwei-fulltext-20260930.py
"""
import re, sqlite3, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from lib.kb_ingest import KBIngestor

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT / 'server' / 'database' / 'yidao.db'
SRC = ROOT / 'training' / 'ocr-books' / 'kangjie-ziwei'

RANGES = [(1, 196), (255, 402)]   # 命图区 197-254 已结构化，跳过
CHUNK_MIN, CHUNK_MAX = 800, 1600

# 已知赋/论名锚点（命中即写入 keywords 与标题后缀，便于检索命中）
ANCHORS = ['太微赋', '形声赋', '形性赋', '斗数骨髓赋', '骨髓赋', '女命赋', '女命骨髓赋',
           '定富赋', '定贵赋', '定贫贱赋', '定孤克赋', '准绳', '玄微论', '斗数准绳',
           '增补太微赋', '玉蟾发微', '起例', '安星', '诸星问答论', '全书']

def load_pages():
    pages = []
    for a, b in RANGES:
        for n in range(a, b + 1):
            f = SRC / f'n{n:04d}.txt'
            if f.exists():
                pages.append((n, f.read_text(encoding='utf-8', errors='ignore')))
    return pages

def chunk_pages(pages):
    """页序拼接，段落边界切块；块内保留页码锚点 [n0050]。"""
    chunks, buf, buf_pages = [], [], []
    def flush():
        if buf:
            chunks.append((buf_pages[:], '\n'.join(buf)))
            buf.clear(); buf_pages.clear()
    for n, text in pages:
        for para in re.split(r'\n\s*\n|\n(?=\S)', text):
            para = para.strip()
            if not para:
                continue
            if sum(len(x) for x in buf) + len(para) > CHUNK_MAX and sum(len(x) for x in buf) >= CHUNK_MIN:
                flush()
            buf.append(f'[n{n:04d}] {para}' if not buf or buf_pages[-1] != n else para)
            if not buf_pages or buf_pages[-1] != n:
                buf_pages.append(n)
    flush()
    return chunks

def main():
    pages = load_pages()
    chunks = chunk_pages(pages)
    print(f'pages={len(pages)} chunks={len(chunks)}')
    conn = sqlite3.connect(DB)
    ing = KBIngestor(conn, batch_size=100)
    for i, (pgs, body) in enumerate(chunks, 1):
        hits = [a for a in ANCHORS if a in body]
        tag = hits[0] if hits else '正文'
        prange = f'n{pgs[0]:04d}-{pgs[-1]:04d}'
        title = f'康节本紫微斗数全书·{tag}·{prange}'[:60]
        content = (f'【康节本《紫微斗数全书》OCR 净本】（公有领域原典，含 OCR 识别噪声，引用前请核对原书影像）\n'
                   f'页码范围 {prange}\n\n{body}')
        kw = ['紫微斗数', '康节本', 'OCR净本'] + hits
        ok, why = ing.insert(
            entry_id=f'KB-KJZW|ziwei|{prange}|c{i:03d}',
            module='ziwei', title=title, content=content,
            category='ziwei', keywords=str(kw).replace("'", '"'),
            src_id='kangjie-ziwei', domain='mingli', trust=0.85,
            source='kimi-g26-kangjie-fulltext-20260930', dedup_title=True)
        if not ok and why != 'duplicate':
            print('FAIL', title, why)
    ing.commit()
    print(f'--- inserted={ing.inserted} duplicates={ing.duplicates}')
    conn.close()

if __name__ == '__main__':
    main()
