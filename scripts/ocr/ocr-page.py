#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ocr-page.py — 古籍竖排扫描页 OCR（切列→切字→逐字 Vision→按列拼回）

原理：古籍竖排字是正的，列从右往左。Vision 横排单字识别可靠（实测），
      竖排整列不支持（实测 0 行）——所以逐字切图喂 Vision。
流程：二值化 → 垂直投影找列 → 列内水平投影切字 → 批量 Vision → 拼文本。
用法: python3 ocr-page.py <image> [out.txt]
"""
import sys, os, subprocess, tempfile
import cv2
import numpy as np

OCR_BIN = os.path.join(os.path.dirname(__file__), 'ocr-vision-batch')
MIN_COL_W = 20      # 列最小宽（px）
MIN_CHAR_H = 14     # 字框最小高
MAX_CHAR_H = 300    # 字框最大高（超过判为粘连，按均值强拆）


def binarize(img):
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if img.ndim == 3 else img
    return cv2.threshold(g, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]


def find_columns(bw):
    """垂直投影找列 x 区间，从右往左返回"""
    proj = bw.sum(axis=0) / 255
    ink = proj > proj.max() * 0.02
    cols, start = [], None
    for x, on in enumerate(ink):
        if on and start is None:
            start = x
        elif not on and start is not None:
            if x - start >= MIN_COL_W:
                cols.append((start, x))
            start = None
    if start is not None and len(ink) - start >= MIN_COL_W:
        cols.append((start, len(ink)))
    return list(reversed(cols))  # 从右往左


def find_chars(col_img):
    """列内水平投影切字；返回 [(y0,y1,is_punct)]——句读小框直接标标点不送 OCR"""
    proj = col_img.sum(axis=1) / 255
    ink = proj > max(proj.max() * 0.03, 1)
    raw, start = [], None
    for y, on in enumerate(ink):
        if on and start is None:
            start = y
        elif not on and start is not None:
            raw.append((start, y))
            start = None
    if start is not None:
        raw.append((start, len(ink)))
    hs = [b[1] - b[0] for b in raw]
    if not hs:
        return []
    med = sorted(hs)[len(hs) // 2]
    boxes = []
    for y0, y1 in raw:
        h = y1 - y0
        if h < max(MIN_CHAR_H, med * 0.45):
            boxes.append((y0, y1, True))    # 句读圈点
        elif h > MAX_CHAR_H and med > 0:    # 粘连强拆
            n = round(h / med * 1.2) or 1
            step = h / n
            boxes += [(int(y0 + i * step), int(y0 + (i + 1) * step), False) for i in range(n)]
        else:
            boxes.append((y0, y1, False))
    return boxes


def main():
    path = sys.argv[1]
    out_path = sys.argv[2] if len(sys.argv) > 2 else None
    img = cv2.imread(path, cv2.IMREAD_GRAYSCALE)
    if img is None:
        sys.exit(f'无法读取: {path}')
    bw = binarize(img)
    cols = find_columns(bw)
    print(f'检出 {len(cols)} 列', file=sys.stderr)

    with tempfile.TemporaryDirectory() as td:
        manifest = []
        for ci, (x0, x1) in enumerate(cols):
            col_bw = bw[:, x0:x1]
            for ri, (y0, y1, punct) in enumerate(find_chars(col_bw)):
                if punct:
                    manifest.append((ci, ri, None))  # 句读圈点，不送 OCR
                    continue
                fp = os.path.join(td, f'c{ci:03d}r{ri:03d}.png')
                # 留白边，Vision 对贴边字识别差
                pad = 6
                ch = img[max(0, y0 - pad):y1 + pad, max(0, x0 - pad):x1 + pad]
                cv2.imwrite(fp, ch)
                manifest.append((ci, ri, fp))
        print(f'切出 {len(manifest)} 字块，批量识别中…', file=sys.stderr)
        r = subprocess.run([OCR_BIN, td], capture_output=True, text=True, timeout=1800)
        results = {}
        for line in r.stdout.splitlines():
            if '\t' in line:
                fn, txt = line.split('\t', 1)
                results[fn] = txt.strip()
    # 拼回：按列序，列内按行序
    lines = []
    cur_col, buf = -1, []
    for ci, ri, fp in manifest:
        if ci != cur_col:
            if buf:
                lines.append(''.join(buf))
            cur_col, buf = ci, []
        buf.append('。' if fp is None else (results.get(os.path.basename(fp), '□') or '□'))
    if buf:
        lines.append(''.join(buf))
    text = '\n'.join(lines)
    if out_path:
        open(out_path, 'w', encoding='utf-8').write(text)
        print(f'已写 {out_path}（{len(lines)} 列）', file=sys.stderr)
    else:
        print(text)


if __name__ == '__main__':
    main()
