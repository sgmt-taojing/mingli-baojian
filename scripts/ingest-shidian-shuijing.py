#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""ingest-shidian-shuijing.py — 识典《水镜集》（范騋·康熙经纶堂刻本 OCR）入库"""
import os
import sqlite3
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib.kb_ingest import KBIngestor  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB = os.path.join(ROOT, "server", "database", "yidao.db")
SRC = os.path.join(ROOT, "training", "shidian-fetch", "shuijing")

FILES = [
    ("shuijing-01-juanshou.txt", "卷首"),
    ("shuijing-02-mulu.txt", "目录"),
    ("shuijing-03-juan1.txt", "卷一"),
    ("shuijing-04-juan2.txt", "卷二"),
    ("shuijing-05-juan3.txt", "卷三"),
    ("shuijing-06-juan4.txt", "卷四"),
]

conn = sqlite3.connect(DB)
ing = KBIngestor(conn)
total = 0
for fname, juan in FILES:
    path = os.path.join(SRC, fname)
    if not os.path.exists(path):
        print("MISSING", fname)
        continue
    lines = [l.strip() for l in open(path, encoding="utf-8") if l.strip()]
    chunks, buf, blen = [], [], 0
    for l in lines:
        buf.append(l)
        blen += len(l)
        if blen >= 2400:
            chunks.append("\n".join(buf))
            buf, blen = [], 0
    if buf:
        chunks.append("\n".join(buf))
    n = 0
    for k, c in enumerate(chunks, 1):
        if len(c) < 30:
            continue
        ok, why = ing.insert(
            entry_id="SDG|xiangshu|shuijingji|%s|%02d" % (juan, k),
            module="xiangshu",
            title="水镜集·%s%s" % (juan, "（之%d）" % k if len(chunks) > 1 else ""),
            content=c,
            category="水镜集",
            keywords="水镜集,相术,相法,范騋,右髻道人,%s" % juan,
            summary="《水镜集》%s（识典古籍·康熙经纶堂刻本·机器OCR未校）" % juan,
            tags=["水镜集", "相术", "识典古籍", "康熙经纶堂刻本", "OCR未校", "待校勘"],
            domain="mingli", trust=0.85, source="shidianguji",
        )
        if ok:
            n += 1
    total += n
    print("%s %-5s -> %d 条" % (fname, juan, n), flush=True)
ing.commit()
conn.close()
print("DONE inserted=%d dup=%d" % (ing.inserted, ing.duplicates))
