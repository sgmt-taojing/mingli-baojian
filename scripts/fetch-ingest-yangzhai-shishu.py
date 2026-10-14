#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""fetch-ingest-yangzhai-shishu.py — 常先易《阳宅十书》图书集成本十篇抓取入库

源：changxianyi.com/guji/yangzhai/ws-text-20260928/part-01..10（CC BY-SA 4.0 电子整理）
清洗：只剥网页 UI 行（书签/复制出处/段落号等），原文与〈〉夹注原样保留。
口径：module=fengshui，category=阳宅十书，domain=mingli，trust=0.85（今人整理）。
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
OUT_DIR = os.path.join(ROOT, "training", "shidian-fetch", "yangzhai-shishu")
os.makedirs(OUT_DIR, exist_ok=True)

BASE = "https://changxianyi.com/guji/yangzhai/ws-text-20260928/part-%02d/"
PIAN = ["论宅外形第一", "论福元第二", "论大游年第三", "论穿宫九星第四", "论元空装卦诀第五",
        "论开门修造门第六", "论放水第七", "论宅内形第八", "论选择第九", "论符镇第十"]

JUNK = {"书签", "复制出处", "生成分享卡", "复制段落链接", "下一章 →", "上一章 →", "提交勘误",
        "讲课模式", "阅读设置", "目录", "查找章节", "部分章节", "书籍介绍与来源 →",
        "图书集成本 · 十篇", "图书集成本 · 十篇文字参考", "原文 · 释义", "只看原文", "简体", "原貌"}
JUNK_RE = re.compile(r"^(勘误说明|网站|本章原文来源|CC BY-SA|常先|版本、来源|发现错字|请注明段落|提交勘误需要"
                     r"|简体阅读|当前显示|本章暂未|原文阅读|上一章|下一章)"
                     r"| › |^\d+章$|^阳宅十书 / |^.{0,24}·\s*\d+段\s*·|^所据《")


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    return urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "ignore")


def extract(html_text, pian_title):
    i = html_text.find("entry-content")
    j = html_text.find("</main>", i)
    seg = html_text[i:j if j > i else len(html_text)]
    seg = re.sub(r"<(script|style)[^>]*>.*?</\1>", "", seg, flags=re.S)
    txt = re.sub(r"<[^>]+>", "\n", seg)
    txt = html.unescape(txt)
    lines = [l.strip() for l in txt.split("\n") if l.strip()]
    # 正文起点：前 80 行内最后一次出现篇名（前面是面包屑与目录）之后
    start = 0
    for k, l in enumerate(lines[:80]):
        if pian_title in l:
            start = k + 1
    out = []
    for l in lines[start:]:
        if l in JUNK or JUNK_RE.match(l) or re.fullmatch(r"\d{1,4}", l):
            continue
        out.append(l)
    return out


def main():
    conn = sqlite3.connect(DB)
    ing = KBIngestor(conn)
    for idx in range(1, 11):
        url = BASE % idx
        try:
            h = fetch(url)
        except Exception as e:
            print("part-%02d FETCH FAIL %s" % (idx, e), flush=True)
            continue
        lines = extract(h, PIAN[idx - 1])
        text = "\n".join(lines)
        raw_path = os.path.join(OUT_DIR, "pian-%02d.txt" % idx)
        open(raw_path, "w", encoding="utf-8").write(text)
        # 篇内过长则按行累积切片（≤2400）
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
            title = "阳宅十书·%s" % PIAN[idx - 1] + ("（之%d）" % k if len(chunks) > 1 else "")
            ok, why = ing.insert(
                entry_id="CXY|fengshui|yangzhai-shishu|pian%02d|%02d" % (idx, k),
                module="fengshui", title=title, content=c,
                category="阳宅十书",
                keywords="阳宅十书,阳宅,堪舆,%s" % PIAN[idx - 1],
                summary="《阳宅十书》%s（常先易·图书集成本录文·CC BY-SA 4.0）" % PIAN[idx - 1],
                tags=["阳宅十书", "阳宅", "图书集成本", "常先易整理", "王君荣"],
                domain="mingli", trust=0.85, source="changxianyi",
            )
            if ok:
                n += 1
        print("part-%02d %s -> %d 行 %d 字 %d 条" % (idx, PIAN[idx - 1], len(lines), len(text), n), flush=True)
        time.sleep(1.5)
    ing.commit()
    conn.close()
    print("DONE inserted=%d dup=%d" % (ing.inserted, ing.duplicates))


if __name__ == "__main__":
    main()
