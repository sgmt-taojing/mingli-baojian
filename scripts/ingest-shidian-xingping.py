#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""ingest-shidian-xingping.py — 识典《增补星平会海命学全书》（道光八年天禄斋刻本 OCR）入库"""
import os
import sqlite3
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib.kb_ingest import KBIngestor  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB = os.path.join(ROOT, "server", "database", "yidao.db")
DL = os.path.expanduser("~/Downloads")

FILES = [
    ("xingping-01-juanshou.txt", "卷首"),
    ("xingping-02-mulu.txt", "目录"),
    ("xingping-03-juanzhishou.txt", "卷之首"),
    ("xingping-04-juan1.txt", "卷一"),
    ("xingping-05-juan2.txt", "卷二"),
    ("xingping-06-juan3.txt", "卷三"),
    ("xingping-07-juan4.txt", "卷四"),
    ("xingping-08-juan5.txt", "卷五"),
    ("xingping-09-juan6.txt", "卷六"),
    ("xingping-10-juan7.txt", "卷七"),
    ("xingping-11-juan8.txt", "卷八"),
]

conn = sqlite3.connect(DB)
ing = KBIngestor(conn)
total = 0
for fname, juan in FILES:
    path = os.path.join(DL, fname)
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
            entry_id="SDG|bazi|xingpinghuihai|%s|%02d" % (juan, k),
            module="bazi",
            title="星平会海·%s%s" % (juan, "（之%d）" % k if len(chunks) > 1 else ""),
            content=c,
            category="星平会海",
            keywords="星平会海,命学,五星,子平,%s" % juan,
            summary="《增补星平会海命学全书》%s（识典古籍·道光八年天禄斋刻本·机器OCR未校）" % juan,
            tags=["星平会海", "命理", "识典古籍", "道光八年天禄斋刻本", "OCR未校", "待校勘"],
            domain="mingli", trust=0.85, source="shidianguji",
        )
        if ok:
            n += 1
    total += n
    print("%s %-5s -> %d 条" % (fname, juan, n), flush=True)
ing.commit()
conn.close()
print("DONE inserted=%d dup=%d" % (ing.inserted, ing.duplicates))
