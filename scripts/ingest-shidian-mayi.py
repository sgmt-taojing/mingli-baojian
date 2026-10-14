#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""ingest-shidian-mayi.py — 识典《新刊图相麻衣相法》（明刻本 OCR）入库"""
import os
import sqlite3
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib.kb_ingest import KBIngestor  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB = os.path.join(ROOT, "server", "database", "yidao.db")
DL = os.path.expanduser("~/Downloads")

FILES = [("mayixiangfa-01-shang.txt", "卷上"), ("mayixiangfa-02-xia.txt", "卷下")]

conn = sqlite3.connect(DB)
ing = KBIngestor(conn)
for fname, juan in FILES:
    lines = [l.strip() for l in open(os.path.join(DL, fname), encoding="utf-8") if l.strip()]
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
        ok, why = ing.insert(
            entry_id="SDG|xiangshu|mayixiangfa|%s|%02d" % (juan, k),
            module="xiangshu",
            title="麻衣相法·%s%s" % (juan, "（之%d）" % k if len(chunks) > 1 else ""),
            content=c,
            category="麻衣相法",
            keywords="麻衣相法,面相,相术,%s" % juan,
            summary="《新刊图相麻衣相法》%s（识典古籍·明刻本·机器OCR未校）" % juan,
            tags=["麻衣相法", "面相", "识典古籍", "明刻本", "OCR未校", "待校勘"],
            domain="mingli", trust=0.85, source="shidianguji",
        )
        if ok:
            n += 1
    print("%s -> %d 条" % (juan, n), flush=True)
ing.commit()
conn.close()
print("DONE inserted=%d dup=%d" % (ing.inserted, ing.duplicates))
