#!/usr/bin/env python3
"""渲染指定 PDF 页并可选 OCR 辅助定位；OCR 不作为正式校录原文。"""
import argparse
from pathlib import Path
import subprocess
import pymupdf

ROOT = Path(__file__).resolve().parent.parent
PDF = ROOT / 'corpus/source-scans/duanyi-daquan/SSID-13319395-complete.pdf'
OUT = ROOT / 'corpus/source-scans/duanyi-daquan/pages'


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--start', type=int, required=True)
    parser.add_argument('--end', type=int, required=True)
    parser.add_argument('--scale', type=float, default=3.0)
    parser.add_argument('--ocr', action='store_true')
    args = parser.parse_args()
    if args.start < 1 or args.end < args.start:
        parser.error('页码范围无效')
    OUT.mkdir(parents=True, exist_ok=True)
    doc = pymupdf.open(PDF)
    if args.end > len(doc):
        parser.error(f'超出总页数 {len(doc)}')
    for number in range(args.start, args.end + 1):
        target = OUT / f'page-{number:03d}.png'
        pix = doc[number - 1].get_pixmap(matrix=pymupdf.Matrix(args.scale, args.scale), alpha=False)
        pix.save(target)
        print(f'渲染 PDF {number}: {target.name} {target.stat().st_size} bytes')
        if args.ocr:
            result = subprocess.run([
                'tesseract', str(target), 'stdout', '-l', 'chi_tra_vert', '--psm', '5',
            ], capture_output=True, text=True, timeout=60)
            text_path = OUT / f'page-{number:03d}.ocr.txt'
            text_path.write_text(result.stdout, encoding='utf-8')
            print(f'OCR PDF {number}: {len(result.stdout)} chars（仅定位，不作底本）')


if __name__ == '__main__':
    main()
