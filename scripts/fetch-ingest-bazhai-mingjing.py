#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""fetch-ingest-bazhai-mingjing.py — 常先易《八宅明镜》宅法选读 43 章抓取入库（残部补全 2026-10-14）

源：changxianyi.com/guji/bazhai/selected-text-20260928/{preface,upper-01..10,lower-01..32}
清洗：只剥网页 UI 行，原文与古注原样保留（红线：不删改原文）。
口径：module=fengshui，category=八宅明镜，trust=0.85（电子整理待校），tags 带「OCR未校/待校勘」。
"""
import html
import os
import re
import sqlite3
import sys
import time
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib.kb_ingest import KBIngestor  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB = os.path.join(ROOT, "server", "database", "yidao.db")
OUT_DIR = os.path.join(ROOT, "training", "shidian-fetch", "bazhai-mingjing")
os.makedirs(OUT_DIR, exist_ok=True)

CHAPTERS = ["preface"] + ["upper-%02d" % i for i in range(1, 11)] + ["lower-%02d" % i for i in range(1, 33)]
BASE = "https://changxianyi.com/guji/bazhai/selected-text-20260928/%s/"

JUNK = {"书签", "复制出处", "生成分享卡", "复制段落链接", "下一章 →", "上一章 →", "提交勘误",
        "讲课模式", "阅读设置", "目录", "查找章节", "简体", "原貌"}
JUNK_RE = re.compile(r"^(勘误说明|网站|本章原文来源|CC BY-SA|常先|版本、来源|发现错字|请注明段落|提交勘误需要"
                     r"|简体阅读|当前显示|本章暂未|原文阅读|上一章|下一章|录文说明|古文选读|电子文字待校)"
                     r"| › |^\d+章$|^八宅明镜|^- |^·|^\d{1,4}$")


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    return urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "ignore")


def extract(html_text):
    m = re.search(r'<h1[^>]*>(.*?)</h1>', html_text, flags=re.S)
    title = re.sub(r"<[^>]+>", "", m.group(1)).strip() if m else ""
    title = html.unescape(title).split("｜")[0].strip()
    i = html_text.find("entry-content")
    j = html_text.find("</main>", i)
    seg = html_text[i:j if j > i else len(html_text)]
    seg = re.sub(r"<(script|style)[^>]*>.*?</\1>", "", seg, flags=re.S)
    txt = re.sub(r"<[^>]+>", "\n", seg)
    txt = html.unescape(txt)
    lines = [l.strip() for l in txt.split("\n") if l.strip()]
    # 正文起点：章题行之后
    start = 0
    for k, l in enumerate(lines[:60]):
        if title and title in l:
            start = k + 1
    out = []
    for l in lines[start:]:
        if l in JUNK or JUNK_RE.match(l):
            continue
        out.append(l)
    return title, out


conn = sqlite3.connect(DB)
ing = KBIngestor(conn)
total = 0
for ch in CHAPTERS:
    url = BASE % ch
    try:
        h = fetch(url)
    except Exception as e:
        print("FETCH-ERR", ch, e)
        continue
    title, lines = extract(h)
    body = "\n".join(lines).strip()
    if len(body) < 60:
        print("SKIP(thin)", ch, title, len(body))
        continue
    fn = os.path.join(OUT_DIR, "%s.txt" % ch)
    open(fn, "w", encoding="utf-8").write(title + "\n" + body)
    sec = "%s·%s" % (ch, title or "未名")
    content = "【八宅明镜·%s】（常先易电子文字·待校）\n\n%s\n\n关键词：八宅明镜 %s 阳宅 风水 东西四宅 大游年" % (sec, body, title)
    eid = "CXY|fengshui|八宅明镜|%s|%s" % (ch, __import__('lib.kb_ingest', fromlist=['fingerprint_of']).fingerprint_of(content)[:8])
    ok, why = ing.insert(
        entry_id=eid, module="fengshui", title="八宅明镜·%s" % sec,
        content=content, category="八宅明镜",
        keywords="八宅明镜,%s,阳宅,风水,箬冠道人,顾吾庐" % title,
        summary="《八宅明镜》%s（常先易·电子文字待校）" % sec,
        tags=["八宅明镜", "阳宅", "常先易", "OCR未校", "待校勘", "残部补全20261014"],
        domain="mingli", trust=0.85, source="changxianyi")
    if ok:
        total += 1
        print("%-10s %-20s %5d 字 入库" % (ch, title, len(body)), flush=True)
    elif why == "duplicate":
        print("%-10s dup" % ch)
    else:
        raise RuntimeError(why)
    time.sleep(0.6)
ing.commit()
conn.close()
print("DONE inserted=%d dup=%d" % (ing.inserted, ing.duplicates))
