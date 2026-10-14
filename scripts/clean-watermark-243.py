#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""clean-watermark-243.py — 水印型 243 条清洗管线（S3.5 衍生单 · 2026-10-14）

口径（校勘红线内）：
- 只剥广告水印：行内「公众号：XX」令牌、头尾广告行（主持/主讲/转文字组/微信/QQ群/扫码）、
  短小全广告行（<50 字且含联系方式词）。古籍/讲座正文一字不动，「学费」等正文词不单独剥。
- 全程 diff 留证：reports/watermark-clean-20261014.jsonl 记录每条 removed 片段。
- 更新重算 fingerprint（SHA256(content)[:16]），tags 追加「水印已清洗」，kb_audit 落账。
- 幂等：二次运行无变化即跳过。

用法：--dry-run 预览（默认） / --apply 实写
"""
import json
import os
import re
import sqlite3
import sys
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib.kb_ingest import fingerprint_of  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB = os.path.join(ROOT, "server", "database", "yidao.db")
LIST = os.path.join(ROOT, "reports", "kb-governance-watermark-20261014.json")
DIFF = os.path.join(ROOT, "reports", "watermark-clean-20261014.jsonl")

TOKEN = re.compile(r"公众号\s*[:：]\s*[^\s，。、；！？:「」『』【】]{0,16}")
# 无冒号变体（OCR 讹作逗号/空格）+ 微信号令牌；仅限已知水印词干，避免误伤项目文档里的「公众号」正当用词
STEMS = r"(?:善事三千|普事三千|善事三十|善事三|普事三干|普事一千|普果|齊班|岐黄圣贤智慧|岐黄传承道法自然|岐黄|善有|善事|普事|每事三|善新)"
TOKEN2 = re.compile(r"公众号\s*[，,]\s*" + STEMS + r"[^\s，。、；！？]{0,8}")
TOKEN3 = re.compile(r"微信学习群\s*[:：]\s*[A-Za-z0-9\-]{2,12}")
# 二遍扩展：独立词干（古籍正文绝不出现，OCR 广告专属）+ 讹写学习群
TOKEN4 = re.compile(r"(?:善事三千|普事三千|善事三十|普事三干|普事一千)")
TOKEN5 = re.compile(r"[微做]信?学习群\s*[:：]?\s*[A-Za-z0-9\-]{2,12}")
# 讲座转录头部水印前缀（只剥前缀，保留同行正文）
HEADER_PREFIX = re.compile(
    r"^(?:国学堂之《倪师讲座》\s*)?(?:主持\s*[:：]\s*[^\s]{0,6}\s*)?(?:主讲\s*[:：]\s*[^\s]{0,6}\s*)?"
    r"(?:国学堂)?_?音频转文字组\s*整理\s*-\s*\d+\s*-\s*")
# 整行广告（仅当整行就是广告且较短时才剥行）
HEADTAIL_AD = re.compile(r"(音频转文字组|国学堂之《倪师讲座》|微信\s*[:：]|QQ群|扫码|加群|整理\s*-\s*\d+\s*-)")
MID_AD = re.compile(r"(微信\s*[:：]|QQ群|扫码|加群|学费缴纳|报名联系)")
MAX_DROP_LINE = 50  # 超过此长度的行绝不整行剥除（防误伤正文）


def clean(text):
    """返回 (cleaned, removed_fragments)。保守三段：行内令牌→头部前缀→短小全广告行。"""
    removed = []

    def sub_token(m):
        removed.append(m.group(0))
        return ""

    lines = []
    for line in text.split("\n"):
        line = TOKEN.sub(sub_token, line)
        line = TOKEN2.sub(sub_token, line)
        line = TOKEN3.sub(sub_token, line)
        line = TOKEN4.sub(sub_token, line)
        line = TOKEN5.sub(sub_token, line)
        m = HEADER_PREFIX.match(line)
        if m:
            removed.append("[前缀]" + m.group(0).strip()[:60])
            line = line[m.end():]
        lines.append(line)

    # 头尾广告行（整行确是广告且短才剥）
    while lines and (not lines[0].strip() or (len(lines[0].strip()) <= MAX_DROP_LINE and HEADTAIL_AD.search(lines[0]))):
        if lines[0].strip():
            removed.append("[头]" + lines[0].strip()[:60])
        lines.pop(0)
    while lines and (not lines[-1].strip() or (len(lines[-1].strip()) <= MAX_DROP_LINE and HEADTAIL_AD.search(lines[-1]))):
        if lines[-1].strip():
            removed.append("[尾]" + lines[-1].strip()[:60])
        lines.pop()

    # 短小全广告行（中段）
    kept = []
    for line in lines:
        s = line.strip()
        if s and len(s) <= MAX_DROP_LINE and MID_AD.search(s):
            removed.append("[中]" + s[:60])
            continue
        kept.append(line)

    out = "\n".join(kept)
    out = re.sub(r"\n{3,}", "\n\n", out).strip()
    # 令牌剥除后的孤立标点收尾
    out = re.sub(r"[ \t]+\n", "\n", out)
    return out, removed


def main():
    apply = "--apply" in sys.argv
    sweep = "--sweep" in sys.argv
    conn = sqlite3.connect(DB)
    cur = conn.cursor()
    if sweep:
        # 全库二遍：词干锚定 LIKE 预筛（均为 OCR 广告专属词，项目文档不会命中）
        cur.execute("""SELECT entry_id, module FROM kb_formal
                       WHERE content LIKE '%善事三千%' OR content LIKE '%普事三千%'
                          OR content LIKE '%善事三十%' OR content LIKE '%普事三干%'
                          OR content LIKE '%学习群%' OR content LIKE '%音频转文字组%'""")
        items = [{"entry_id": r[0], "module": r[1], "hit": "sweep"} for r in cur.fetchall()]
    else:
        items = json.load(open(LIST, encoding="utf-8"))["watermark"]
    now = datetime.now().isoformat(timespec="seconds")
    n_changed = n_same = n_missing = 0
    diffout = open(DIFF, "a", encoding="utf-8") if apply else None
    for x in items:
        eid = x["entry_id"]
        cur.execute("SELECT content, title, tags FROM kb_formal WHERE entry_id=?", (eid,))
        row = cur.fetchone()
        if not row:
            n_missing += 1
            continue
        content, title, tags = row
        new_content, rem1 = clean(content or "")
        new_title, rem2 = clean(title or "")
        removed = rem1 + rem2
        if new_content == (content or "").strip() and new_title == (title or "").strip():
            n_same += 1
            continue
        n_changed += 1
        rec = {"entry_id": eid, "ts": now,
               "before_len": len(content or ""), "after_len": len(new_content),
               "removed": removed[:40]}
        if apply:
            try:
                taglist = json.loads(tags) if tags else []
            except Exception:
                taglist = []
            if "水印已清洗" not in taglist:
                taglist.append("水印已清洗")
            cur.execute(
                "UPDATE kb_formal SET content=?, title=?, fingerprint=?, tags=?, updated_at=? WHERE entry_id=?",
                (new_content, new_title, fingerprint_of(new_content), json.dumps(taglist, ensure_ascii=False), now, eid))
            cur.execute(
                "INSERT INTO kb_audit (entry_id, module, action, checks, score, reason, auditor, audited_at) VALUES (?,?,?,?,?,?,?,?)",
                (eid, x.get("module", ""), "watermark-clean",
                 json.dumps({"removed": len(removed)}, ensure_ascii=False), None,
                 "水印广告剥除（头尾行+行内公众号令牌），diff 见 reports/watermark-clean-20261014.jsonl",
                 "clean-watermark-243.py", now))
            diffout.write(json.dumps(rec, ensure_ascii=False) + "\n")
        else:
            if n_changed <= 5:
                print("DRY", eid, "removed:", removed[:6])
    if apply:
        conn.commit()
        diffout.close()
    conn.close()
    print("changed=%d unchanged=%d missing=%d mode=%s" % (n_changed, n_same, n_missing, "APPLY" if apply else "DRY"))


if __name__ == "__main__":
    main()
