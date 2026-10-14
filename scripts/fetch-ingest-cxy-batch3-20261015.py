#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""fetch-ingest-cxy-batch3-20261015.py — 常先易三批：卜筮正宗 150 章 + 增删卜易 139 章全文（残部补全）

源：changxianyi.com/guji/bushi/wz-20260915/chapter-001..150
    changxianyi.com/guji/zengshan/wz-20260914/chapter-001..139
口径：电子文字待校，trust=0.85，原文不删改，只剥 UI 行。
"""
import html
import json
import os
import re
import sqlite3
import sys
import time
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib.kb_ingest import KBIngestor, fingerprint_of  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB = os.path.join(ROOT, "server", "database", "yidao.db")

JOBS = [
    ("卜筮正宗", "bushi", "yizhan", "卜筮正宗,王洪绪,六爻,纳甲,黄金策", "/tmp/cxy-bushi-urls.json"),
    ("增删卜易", "zengshan", "yizhan", "增删卜易,野鹤老人,六爻,占断,李文辉", "/tmp/cxy-zengshan-urls.json"),
]

JUNK = {"书签", "复制出处", "生成分享卡", "复制段落链接", "下一章 →", "上一章 →", "提交勘误",
        "讲课模式", "阅读设置", "目录", "查找章节", "查找图页", "简体", "原貌", "开始阅读", "书库"}
JUNK_RE = re.compile(r"^(勘误说明|网站|本章原文来源|CC BY-SA|常先|版本、来源|发现错字|请注明段落|提交勘误需要"
                     r"|简体阅读|当前显示|本章暂未|原文阅读|上一章|下一章|录文说明|古文选读|电子文字待校"
                     r"|跳至正文|添加到桌面|忘记上次|只清除|打开书架)"
                     r"| › |^\d+章$|^- |^·|^\d{1,4}$|^添加")


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    return urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "ignore")


def extract(html_text):
    m = re.search(r"<h1[^>]*>(.*?)</h1>", html_text, flags=re.S)
    title = re.sub(r"<[^>]+>", "", m.group(1)).strip() if m else ""
    title = html.unescape(title).split("｜")[0].strip()
    i = html_text.find("entry-content")
    j = html_text.find("</main>", i)
    seg = html_text[i:j if j > i else len(html_text)]
    seg = re.sub(r"<(script|style)[^>]*>.*?</\1>", "", seg, flags=re.S)
    txt = html.unescape(re.sub(r"<[^>]+>", "\n", seg))
    lines = [l.strip() for l in txt.split("\n") if l.strip()]
    start = 0
    for k, l in enumerate(lines[:60]):
        if title and title in l:
            start = k + 1
    out = [l for l in lines[start:] if l not in JUNK and not JUNK_RE.match(l)]
    return title, out


conn = sqlite3.connect(DB)
ing = KBIngestor(conn)
grand = 0
for book, slug, module, kw, urljson in JOBS:
    urls = json.load(open(urljson))
    outdir = os.path.join(ROOT, "training", "shidian-fetch", slug)
    os.makedirs(outdir, exist_ok=True)
    nb = 0
    for idx, url in enumerate(urls, 1):
        fpath = os.path.join(outdir, "%03d.txt" % idx)
        fetched = False
        if os.path.exists(fpath):
            raw = open(fpath, encoding="utf-8").read()
            title, _, body = raw.partition("\n")
            lines = body.split("\n")
        else:
            try:
                h = fetch(url)
            except Exception as e:
                print("FETCH-ERR", book, idx, e)
                continue
            fetched = True
            title, lines = extract(h)
            body = "\n".join(lines).strip()
            if len(body) >= 60:
                open(fpath, "w", encoding="utf-8").write(title + "\n" + body)
        body = "\n".join(lines).strip()
        if len(body) < 60:
            print("SKIP(thin)", book, idx, title, len(body))
            continue
        open(os.path.join(outdir, "%03d.txt" % idx), "w", encoding="utf-8").write(title + "\n" + body)
        sec = "%03d·%s" % (idx, title or "未名")
        content = "【%s·%s】（常先易电子文字·待校）\n\n%s\n\n关键词：%s %s" % (book, sec, body, book, kw)
        eid = "CXY|%s|%s|%s|%s" % (module, book, sec, fingerprint_of(content)[:8])
        ok, why = ing.insert(
            entry_id=eid, module=module, title="%s·%s" % (book, sec),
            content=content, category=book,
            keywords="%s,%s,%s" % (book, title, kw),
            summary="《%s》%s（常先易·电子文字待校）" % (book, sec),
            tags=[book, "常先易", "OCR未校", "待校勘", "残部补全20261015"],
            domain="mingli", trust=0.85, source="changxianyi")
        if ok:
            nb += 1
        elif why != "duplicate":
            raise RuntimeError(why)
        if idx % 25 == 0:
            ing.commit()
            print(book, idx, "/", len(urls), "(committed)", flush=True)
        if fetched:
            time.sleep(0.4)
    ing.commit()
    grand += nb
    print("%s -> 新入 %d / %d 章" % (book, nb, len(urls)), flush=True)
ing.commit()
conn.close()
print("DONE total=%d dup=%d" % (grand, ing.duplicates))
