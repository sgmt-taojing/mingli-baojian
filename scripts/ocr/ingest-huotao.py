#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ingest-huotao.py — 批命活套 OCR 草案入库（康节说易全书·紫微斗数 n255-261）

来源：archive.org 20210924_20210924_0447（康节说易全书所收七卷本紫微斗数全书），
批命活套位于前四卷（南派）卷四末，n255-n261 共 7 页。
口径：OCR 草案 trust=0.80，tags 标「待审校」；原文不改写，页图留档备审计。
用法: python3 ingest-huotao.py [--dry-run]
"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from lib.kb_ingest import KBIngestor
import sqlite3

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
BOOK = os.path.join(ROOT, 'training/ocr-books/kangjie-ziwei')
DB = os.path.join(ROOT, 'server/database/yidao.db')
SRC = 'archive.org:20210924_20210924_0447'
PAGES = range(255, 262)  # n255-n261

HEADER = ('【批命活套·OCR草案】源：康节说易全书所收《新镌希夷陈先生紫微斗数全书》'
          '（七卷本，前四卷南派），本页为卷四末批命活套（页码 n%d）。'
          'OCR 未审校，错字以页图为准：training/ocr-books/kangjie-ziwei/pages/n%04d.jpg\n\n')


def main():
    dry = '--dry-run' in sys.argv
    entries = []
    for n in PAGES:
        fp = os.path.join(BOOK, f'n{n:04d}.txt')
        body = open(fp, encoding='utf-8').read().strip()
        # 清掉纯噪声行（□和标点凑不足 4 字的行）
        lines = [ln for ln in body.splitlines()
                 if len(ln.replace('□', '').replace('。', '').strip()) >= 4]
        content = HEADER % (n, n) + '\n'.join(lines)
        entries.append(dict(
            entry_id=f'ZW|ziwei|批命活套|n{n:04d}',
            module='ziwei',
            title=f'批命活套·页n{n}（康节本卷四末·OCR草案）',
            content=content,
            category='ziwei',
            keywords='批命活套,紫微斗数全书,康节说易全书,OCR草案',
            tags=['紫微', '批命活套', 'OCR草案', '待审校'],
        ))
    if dry:
        for e in entries:
            print(e['entry_id'], len(e['content']), '字')
        return
    conn = sqlite3.connect(DB)
    ing = KBIngestor(conn)
    for e in entries:
        ok, why = ing.insert(**e, source='ocr-archive', summary=e['title'])
        print(('OK ' if ok else f'SKIP({why}) ') + e['entry_id'])
    ing.commit()
    print(f'入库 {ing.inserted} 条，幂等跳过 {ing.duplicates} 条')
    conn.close()


if __name__ == '__main__':
    main()
