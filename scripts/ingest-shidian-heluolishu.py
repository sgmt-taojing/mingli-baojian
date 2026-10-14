#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""ingest-shidian-heluolishu.py — 识典《河洛理数》收割文本清洗入库

源：识典古籍 shidianguji.com book/NA09030（明崇祯五年刻本，日本内阁文库藏，机器 OCR 未校）
口径：KBIngestor 新五要素；module=shuzi（数字术数）；domain=mingli；
      trust=0.85（机器 OCR 未校，低于手校原典 0.95）；tags 标 OCR未校 待校勘。
切片：卷内按「短行标题」切节，合并至 ≥600 字、拆分 ≤2400 字，标题带卷次。
红线：不删改原文（OCR 讹字原样保留，靠 tags 标注），仅去收割残留空行。
"""
import glob
import os
import re
import sqlite3
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib.kb_ingest import KBIngestor  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(ROOT, "training", "shidian-fetch", "heluolishu")
DB = os.path.join(ROOT, "server", "database", "yidao.db")

# 文件序 -> (卷次名, 是否正文)
FILES = [
    ("heluolishu-01-juanshou.txt", "卷首"),
    ("heluolishu-02-mulu.txt", "目录"),
    ("heluolishu-03-qianxu.txt", "凡例"),
    ("heluolishu-04-juan1.txt", "卷一"),
    ("heluolishu-05-juan2a.txt", "卷二上"),
    ("heluolishu-06-juan2b.txt", "卷二下"),
    ("heluolishu-07-juan3.txt", "卷三"),
    ("heluolishu-08-juan4.txt", "卷四"),
    ("heluolishu-09-juan5.txt", "卷五"),
    ("heluolishu-10-juan6.txt", "卷六"),
    ("heluolishu-11-juan7.txt", "卷七"),
]

HEAD_RE = re.compile(
    r"^(论|释|起|定|详|假令|换|逢|遇|依|总取|广|八|六|五|推|看|先儒|厉潜夫|卦气|侯卦|节卦|日居|乾坤|坎离|年月|贵命|贱命|同年|三才|月令|大易|河|洛|周易|实序|五数|正对|演八字|小象|一刻|口).{0,20}[：:，,。]?$")

MIN_CHUNK, MAX_CHUNK = 600, 2400


def split_chapter(lines):
    """短行标题切节 -> 合并小节 -> 拆超长节。返回 [(标题, 正文)]。"""
    sections = []  # (head, [lines])
    cur_head, cur = "", []
    for ln in lines:
        if HEAD_RE.match(ln) and len(ln) <= 24 and cur and len("".join(cur)) >= 200:
            sections.append((cur_head, cur))
            cur_head, cur = ln.strip("：:，,。"), []
        else:
            cur.append(ln)
    if cur:
        sections.append((cur_head, cur))
    # 合并过小
    merged = []
    for head, body in sections:
        text = "\n".join(body)
        if merged and len(text) < MIN_CHUNK:
            ph, pb = merged[-1]
            merged[-1] = (ph, pb + [head] + body if head else pb + body)
        else:
            merged.append((head, body))
    # 拆分过大（按行累积）
    out = []
    for head, body in merged:
        buf, blen, part = [], 0, 1
        for ln in body:
            buf.append(ln)
            blen += len(ln)
            if blen >= MAX_CHUNK:
                out.append((head, "\n".join(buf), part))
                buf, blen, part = [], 0, part + 1
        if buf:
            out.append((head, "\n".join(buf), part if part > 1 else 0))
    return out


def main():
    conn = sqlite3.connect(DB)
    ing = KBIngestor(conn)
    total_entries = 0
    for fname, juan in FILES:
        path = os.path.join(SRC_DIR, fname)
        lines = [l.strip() for l in open(path, encoding="utf-8") if l.strip()]
        chunks = split_chapter(lines)
        n = 0
        for i, (head, text, part) in enumerate(chunks, 1):
            if len(text) < 30:
                continue
            title = "河洛理数·%s" % juan
            if head:
                title += "·" + head[:20]
            if part:
                title += "（之%d）" % part
            elif len(chunks) > 1 and not head:
                title += "·之%d" % i
            ok, why = ing.insert(
                entry_id="SDG|shuzi|heluolishu|%s|%03d" % (juan, i),
                module="shuzi",
                title=title,
                content=(head + "\n" + text) if head and not text.startswith(head) else text,
                category="河洛理数",
                keywords="河洛理数,数字术数,%s" % juan,
                summary="《河洛理数》%s（识典古籍·明崇祯五年刻本·机器OCR未校）" % juan,
                tags=["河洛理数", "数字术数", "识典古籍", "崇祯五年刻本", "OCR未校", "待校勘"],
                domain="mingli",
                trust=0.85,
                source="shidianguji",
            )
            if ok:
                n += 1
        total_entries += n
        print("%s %-4s -> %d 条（累计 %d）" % (fname, juan, n, total_entries), flush=True)
    ing.commit()
    conn.close()
    print("DONE inserted=%d dup=%d" % (ing.inserted, ing.duplicates))


if __name__ == "__main__":
    main()
