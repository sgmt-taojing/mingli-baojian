#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scan-book.py — archive.org 古籍整书 OCR 批处理驱动（可断点续跑）

逐页：下载页图(代理) → ocr-page.py → 逐页 .txt 落盘 → 关键词探测（卷次/批命活套）。
已存在的页输出自动跳过，可反复启动续跑。
用法: python3 scan-book.py <archive_id> <start_n> <end_n> <out_dir>
"""
import sys, os, subprocess, time

PY = sys.executable
HERE = os.path.dirname(os.path.abspath(__file__))
OCR_PAGE = os.path.join(HERE, 'ocr-page.py')
PROXY = 'http://127.0.0.1:7890'
KEYWORDS = ['卷之六', '卷之七', '批命活套', '卷六', '卷七']


def fetch_page(book_id, n, dest):
    url = f'https://archive.org/download/{book_id}/page/n{n}.jpg'
    r = subprocess.run(['curl', '-sL', '-x', PROXY, '-m', '120', '-o', dest, url],
                       capture_output=True)
    return r.returncode == 0 and os.path.exists(dest) and os.path.getsize(dest) > 20000


def main():
    book_id, n0, n1, out_dir = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
    img_dir = os.path.join(out_dir, 'pages')
    os.makedirs(img_dir, exist_ok=True)
    hits_path = os.path.join(out_dir, 'hits.log')
    for n in range(n0, n1 + 1):
        txt = os.path.join(out_dir, f'n{n:04d}.txt')
        if os.path.exists(txt):
            continue
        img = os.path.join(img_dir, f'n{n:04d}.jpg')
        if not os.path.exists(img) and not fetch_page(book_id, n, img):
            print(f'n{n} 下载失败，跳过', flush=True)
            continue
        t0 = time.time()
        r = subprocess.run([PY, OCR_PAGE, img, txt], capture_output=True, text=True, timeout=900)
        dt = time.time() - t0
        if r.returncode != 0:
            print(f'n{n} OCR 失败: {r.stderr[-200:]}', flush=True)
            continue
        body = open(txt, encoding='utf-8').read()
        hits = [k for k in KEYWORDS if k in body]
        line = f'n{n}\t{dt:.0f}s\t{len(body)}字' + (f'\t★ {hits}' if hits else '')
        print(line, flush=True)
        if hits:
            open(hits_path, 'a', encoding='utf-8').write(line + '\n')
    print('DONE', flush=True)


if __name__ == '__main__':
    main()
