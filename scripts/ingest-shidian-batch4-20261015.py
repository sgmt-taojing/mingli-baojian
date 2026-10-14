#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""ingest-shidian-batch4-20261015.py — 识典残部三部入库：三白宝海钩玄/人子须知/永乐大典引火珠林

源：training/shidian-fetch/{sanbai-baohai,renzi-xuzhi,huozhulin-yled}
口径：识典古籍 OCR/AI整理，trust=0.85，原文不删改，tags 带 OCR未校/待校勘。
"""
import glob
import os
import re
import sqlite3
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib.kb_ingest import KBIngestor, fingerprint_of  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB = os.path.join(ROOT, "server", "database", "yidao.db")
SRC = os.path.join(ROOT, "training", "shidian-fetch")

CHUNK = 2400


def read_entry(path):
    raw = open(path, encoding="utf-8").read()
    m = re.match(r"^=== (.*?) ===\n", raw)
    title = m.group(1).strip() if m else os.path.basename(path)
    body = raw[m.end():].strip() if m else raw.strip()
    return title, body


def chunks_of(body):
    lines = [l.strip() for l in body.split("\n") if l.strip()]
    chunks, buf, blen = [], [], 0
    for l in lines:
        buf.append(l)
        blen += len(l)
        if blen >= CHUNK:
            chunks.append("\n".join(buf))
            buf, blen = [], 0
    if buf:
        chunks.append("\n".join(buf))
    return [c for c in chunks if len(c) >= 30]


conn = sqlite3.connect(DB)
ing = KBIngestor(conn)
grand = 0

# ── 三白宝海钩玄（五要奇书·康熙三十九年古歙丰南吴氏重刊本）──
nb = 0
for path in sorted(glob.glob(os.path.join(SRC, "sanbai-baohai", "sb-*.txt"))):
    title, body = read_entry(path)
    sec = re.sub(r"[\\/:*?\"<>|]", "", title)[:40]
    content = "【三白宝海钩玄·%s】（识典《五要奇书》康熙三十九年吴氏重刊本·机器OCR未校）\n\n%s\n\n关键词：三白宝海,三元紫白,阳宅,幕讲禅师,江之栋" % (sec, body)
    eid = "SDG|yangzhai|sanbai-baohai|%s|%s" % (sec, fingerprint_of(content)[:8])
    ok, why = ing.insert(
        entry_id=eid, module="yangzhai",
        title="三白宝海钩玄·%s" % sec, content=content, category="三白宝海",
        keywords="三白宝海,三元紫白,阳宅,%s" % sec,
        summary="《三白宝海钩玄》%s（识典·五要奇书本·OCR未校）" % sec,
        tags=["三白宝海", "阳宅", "识典古籍", "五要奇书", "OCR未校", "待校勘", "残部补全20261015"],
        domain="mingli", trust=0.85, source="shidianguji")
    if ok:
        nb += 1
    elif why != "duplicate":
        raise RuntimeError(why)
    if nb % 20 == 0:
        ing.commit()
ing.commit()
grand += nb
print("三白宝海钩玄 -> %d 条" % nb, flush=True)

# ── 人子须知（重刊人子须知资孝地理心学统宗·万历刊本·识典AI整理）──
nb = 0
for path in sorted(glob.glob(os.path.join(SRC, "renzi-xuzhi", "rz-*.txt"))):
    title, body = read_entry(path)
    if title == "?" or not title:
        title = os.path.basename(path).replace(".txt", "")
    for k, c in enumerate(chunks_of(body), 1):
        sec = "%s%s" % (title, "（之%d）" % k if k > 1 else "")
        note = "；卷末疑有残缺" if "rz-06" in path else ""
        content = "【人子须知·%s】（识典·万历刊本AI整理·机器OCR未校%s）\n\n%s\n\n关键词：人子须知,徐善继,徐善述,堪舆,形法,资孝地理心学统宗" % (sec, note, c)
        eid = "SDG|yangzhai|renzi-xuzhi|%s|%s" % (re.sub(r"[\\/:*?\"<>|（）()]", "", sec)[:40], fingerprint_of(content)[:8])
        ok, why = ing.insert(
            entry_id=eid, module="yangzhai",
            title="人子须知·%s" % sec, content=content, category="人子须知",
            keywords="人子须知,堪舆,形法,%s" % title,
            summary="《重刊人子须知资孝地理心学统宗》%s（识典·万历刊本AI整理·OCR未校%s）" % (sec, note),
            tags=["人子须知", "阳宅", "堪舆", "识典古籍", "万历刊本", "OCR未校", "待校勘", "残部补全20261015"],
            domain="mingli", trust=0.85, source="shidianguji")
        if ok:
            nb += 1
        elif why != "duplicate":
            raise RuntimeError(why)
ing.commit()
grand += nb
print("人子须知 -> %d 条" % nb, flush=True)

# ── 永乐大典引火珠林（辑佚残篇）──
nb = 0
for path in sorted(glob.glob(os.path.join(SRC, "huozhulin-yled", "hzl-*.txt"))):
    title, body = read_entry(path)
    fn = os.path.basename(path).replace(".txt", "")
    for k, c in enumerate(chunks_of(body), 1):
        sec = "%s%s" % (fn, "（之%d）" % k if k > 1 else "")
        content = "【永乐大典引火珠林·%s】（《永乐大典》残卷引《火珠林》辑佚·含占筮上下文·机器OCR未校）\n\n%s\n\n关键词：火珠林,永乐大典,辑佚,纳甲,六爻,占筮" % (sec, c)
        eid = "SDG|yizhan|huozhulin-yled|%s|%s" % (sec, fingerprint_of(content)[:8])
        ok, why = ing.insert(
            entry_id=eid, module="yizhan",
            title="永乐大典引火珠林·%s" % sec, content=content, category="火珠林",
            keywords="火珠林,永乐大典,辑佚,纳甲,占筮",
            summary="《永乐大典》残卷引《火珠林》辑佚片段 %s（识典·OCR未校）" % sec,
            tags=["火珠林", "易卦", "辑佚残篇", "识典古籍", "永乐大典", "OCR未校", "待校勘", "残部补全20261015"],
            domain="mingli", trust=0.8, source="shidianguji")
        if ok:
            nb += 1
        elif why != "duplicate":
            raise RuntimeError(why)
ing.commit()
grand += nb
print("永乐大典引火珠林 -> %d 条" % nb, flush=True)

conn.close()
print("DONE total=%d dup=%d" % (grand, ing.duplicates))
