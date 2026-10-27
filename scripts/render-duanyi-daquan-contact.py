#!/usr/bin/env python3
"""把《断易大全》完整书影渲染为带 PDF 页码的校勘联系图；不写知识库。"""
from pathlib import Path
import fitz
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
PDF = ROOT / 'corpus/source-scans/duanyi-daquan/SSID-13319395-complete.pdf'
OUT = ROOT / 'corpus/source-scans/duanyi-daquan/contact'
COLS = 4
ROWS = 4
PAGE_WIDTH = 400
LABEL_HEIGHT = 30


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(PDF)
    rendered = []
    for index, page in enumerate(doc):
        scale = PAGE_WIDTH / page.rect.width
        pix = page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
        image = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
        tile = Image.new('RGB', (PAGE_WIDTH, image.height + LABEL_HEIGHT), 'white')
        tile.paste(image, (0, LABEL_HEIGHT))
        ImageDraw.Draw(tile).text((8, 8), f'PDF {index + 1}', fill='black')
        rendered.append(tile)
    per_sheet = COLS * ROWS
    for start in range(0, len(rendered), per_sheet):
        group = rendered[start:start + per_sheet]
        cell_height = max(tile.height for tile in group)
        sheet = Image.new('RGB', (COLS * PAGE_WIDTH, ROWS * cell_height), '#d0d0d0')
        for offset, tile in enumerate(group):
            x = (offset % COLS) * PAGE_WIDTH
            y = (offset // COLS) * cell_height
            sheet.paste(tile, (x, y))
        end = min(start + per_sheet, len(rendered))
        target = OUT / f'pages-{start + 1:03d}-{end:03d}.jpg'
        sheet.save(target, quality=88, optimize=True)
        print(target.name, target.stat().st_size)


if __name__ == '__main__':
    main()
