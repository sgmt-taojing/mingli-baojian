#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
rescan-direct.py — 横排书直扫重跑（ocr-vision-batch 逐页直扫，覆盖旧 txt）

适用：现代横排书（如康节说易全书）；竖排古籍仍走 ocr-page.py 切列管线。
输入：training/ocr-books/<book>/pages/nXXXX.jpg 已缓存页图
输出：覆盖 training/ocr-books/<book>/nXXXX.txt，关键词命中写 hits-direct.log
用法: python3 rescan-direct.py <book_dir>
"""
import os, sys, subprocess, tempfile, shutil

HERE = os.path.dirname(os.path.abspath(__file__))
BATCH = os.path.join(HERE, 'ocr-vision-batch')
KEYWORDS = ['卷之六', '卷之七', '批命活套', '批命', '活套', '卷四', '卷之五']


def main():
    book = sys.argv[1]
    pages_dir = os.path.join(book, 'pages')
    imgs = sorted(f for f in os.listdir(pages_dir) if f.endswith('.jpg'))
    hits = []
    with tempfile.TemporaryDirectory() as td:
        for i, f in enumerate(imgs):
            # 单页目录 → 批处理 → 读回
            one = os.path.join(td, 'one')
            shutil.rmtree(one, ignore_errors=True)
            os.makedirs(one)
            os.link(os.path.join(pages_dir, f), os.path.join(one, f))
            out = os.path.join(td, 'out')
            shutil.rmtree(out, ignore_errors=True)
            r = subprocess.run([BATCH, one, out], capture_output=True, text=True, timeout=300)
            txt_fp = os.path.join(out, f[:-4] + '.txt')
            body = open(txt_fp, encoding='utf-8').read() if os.path.exists(txt_fp) else ''
            n = f[1:-4]
            open(os.path.join(book, f'n{n}.txt'), 'w', encoding='utf-8').write(body)
            hit = [k for k in KEYWORDS if k in body]
            line = f'n{n}\t{len(body)}字' + (f'\t★{hit}' if hit else '')
            print(line, flush=True)
            if hit:
                hits.append(line)
    open(os.path.join(book, 'hits-direct.log'), 'w', encoding='utf-8').write('\n'.join(hits) + '\n')
    print(f'DONE {len(imgs)} 页, 命中 {len(hits)} 页', flush=True)


if __name__ == '__main__':
    main()
