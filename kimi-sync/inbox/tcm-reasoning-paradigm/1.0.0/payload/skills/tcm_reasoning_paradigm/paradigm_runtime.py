#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""paradigm_runtime.py — tcm_reasoning_paradigm 本机独立运行时（v1.0.0）

复刻中医标准推理范式，推理阶段不依赖源智能体：
  报文解析 → 检索规则(tcm-pd-001) → 研判(tcm-pd-002) → 三段式报告(tcm-pd-003/004)
后端：
  local_kb_api  消费方自有检索服务（如命理宝鉴 :8920 realtime-search）
  local_files   纯离线检索本机 OTA 已安装条目（versions/*.entries.jsonl）
诚信纪律：检索不可用 → degraded，绝不以记忆冒充召回；无召回 → 【文献无记载】。
"""
import argparse
import glob
import json
import os
import sys
import urllib.parse
import urllib.request

SCORE_THRESHOLD = 0.62
TOP_K = 4
RAW_PER_NORM = 6  # score_norm = min(1, raw/6)

NO_RECORD = "【文献无记载】"
DISCLAIMER = "【标注】本内容仅古籍研究参考记录。"

# 边界话术按消费方语境转译（tcm-pd-006）：默认拒答命理；消费方可覆盖
DEFAULT_BOUNDARY = {
    "fate_words": ["命理", "八字", "算命", "择日", "紫微", "斗数", "奇门", "六爻", "风水", "占卜", "排盘", "运势"],
    "fate_reply": "本窗口为中医专项服务，命理相关咨询请切换至命理宝鉴窗口。",
}


# ── tcm-pd-005 报文处理 ──────────────────────────────────────────────
def build_query(msg):
    """ASR 主诉(≤60字) + 图像标签(面/舌/手/眼/其他,各≤4) 合成检索串(≤80字)。"""
    parts = []
    if msg.get("asr_text"):
        parts.append(str(msg["asr_text"])[:60])
    tags = msg.get("image_tags") or {}
    for k in ("face", "tongue", "hand", "eye", "other"):
        arr = tags.get(k)
        if isinstance(arr, list):
            parts.extend(str(x) for x in arr[:4])
    return " ".join(parts).strip()[:80]


def detect_fate(text, boundary):
    return any(w in (text or "") for w in boundary["fate_words"])


# ── tcm-pd-001 检索规则：两种本机后端 ────────────────────────────────
def _bigram_score(query, text):
    """离线评分：双字滑窗命中计分（标题×2），与 tcm 口径同族。"""
    q = query.lower()
    hay = (text or "").lower()
    tokens = []
    for t in q.split():
        if len(t) > 2 and any("一" <= c <= "鿿" for c in t):
            tokens.extend(t[i:i + 2] for i in range(min(len(t) - 1, 14)))
        elif t:
            tokens.append(t)
    if not tokens and q:
        tokens = [q[i:i + 2] for i in range(len(q) - 1)] or [q]
    return sum(1 for t in set(tokens) if t and t in hay)


def search_local_files(query, kb_root, top_k=TOP_K, threshold=SCORE_THRESHOLD):
    """纯离线：检索本机 OTA 已安装条目（knowledge/*/versions/最新条目）。"""
    candidates = {}
    for f in glob.glob(os.path.join(kb_root, "*", "versions", "*.entries.jsonl")):
        pack = f.split(os.sep)[-3]
        ver = os.path.basename(f).split(".entries.jsonl")[0]
        if pack not in candidates or ver > candidates[pack][0]:
            candidates[pack] = (ver, f)
    hits = []
    for pack, (ver, path) in candidates.items():
        try:
            for line in open(path, encoding="utf-8"):
                line = line.strip()
                if not line:
                    continue
                e = json.loads(line)
                hay = " ".join(str(e.get(k) or "") for k in
                               ("term", "definition", "indications", "category"))
                raw = _bigram_score(query, hay)
                if raw > 0:
                    hits.append({
                        "id": e.get("entry_id", ""), "title": e.get("term", ""),
                        "module": pack, "content": e.get("definition", ""),
                        "score": raw, "_source_ref": e.get("source_ref"),
                    })
        except OSError:
            continue
    hits.sort(key=lambda h: -h["score"])
    top = hits[:12]
    for h in top:
        h["score_norm"] = min(1.0, h["score"] / RAW_PER_NORM)
    return [h for h in top if h["score_norm"] >= threshold][:top_k]


def search_local_kb_api(query, api_url, top_k=TOP_K, threshold=SCORE_THRESHOLD, timeout=90):
    """消费方自有检索服务（命理宝鉴 :8920 realtime-search，服务端命中分 0~1）。"""
    url = api_url + "?q=" + urllib.parse.quote(query) + "&limit=%d" % min(max(top_k * 2, 4), 20)
    req = urllib.request.Request(url, headers={"User-Agent": "paradigm-runtime/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        d = json.loads(r.read().decode("utf-8"))
    data = d.get("data") or {}
    hits = []
    for it in data.get("results", []):
        sc = float(it.get("score") or 0)
        if sc >= threshold:
            hits.append({
                "id": it.get("entry_id", ""), "title": it.get("title", ""),
                "module": it.get("module", ""), "content": (it.get("content") or "")[:600],
                "score": sc, "score_norm": min(1.0, sc),
                "_source_ref": None,
            })
    hits.sort(key=lambda h: -h["score_norm"])
    return hits[:top_k]


# ── tcm-pd-002 研判 + tcm-pd-003/004 三段式报告 ─────────────────────
def build_report(query, hits):
    if hits:
        cite = "\n\n".join(
            "%d. 《%s》（%s，相关度 %.2f）\n   %s" %
            (i + 1, h["title"], h["module"], h["score_norm"], h["content"])
            for i, h in enumerate(hits))
        plain = "\n".join(
            "%d. %s：%s……（要点转述，内容仅限召回原文）" %
            (i + 1, h["title"], (h["content"] or "")[:80])
            for i, h in enumerate(hits))
        voice = ("古籍检索到%d条相关记载，主要涉及%s，详情见报告，仅供古籍研究参考。" %
                 (len(hits), "、".join(h["title"] for h in hits[:2])))
    else:
        cite = NO_RECORD
        plain = "古籍库未检索到相关记载，不做推测。"
        voice = "古籍库中暂无相关记载，建议补充问诊信息后再检索。"
    return "\n".join(["#【参考报告】", "", "【原文引用区】", cite, "",
                      "【白话解读区】", plain, "", "【语音播报短句】", voice, "", DISCLAIMER])


def handle(msg, backend, kb_root=None, api_url=None, boundary=None):
    boundary = boundary or DEFAULT_BOUNDARY
    if msg.get("msg_type") and msg["msg_type"] != "MULTIMODAL_STD_INPUT":
        return {"ok": False, "error": "msg_type 须为 MULTIMODAL_STD_INPUT"}
    query = build_query(msg)
    if detect_fate(query, boundary):
        return {"ok": True, "boundary": "refused", "reply": boundary["fate_reply"]}
    if not query:
        return {"ok": False, "error": "报文无可用检索信息（asr_text/image_tags 均为空）"}
    try:
        if backend == "local_files":
            hits = search_local_files(query, kb_root or "knowledge")
        else:
            hits = search_local_kb_api(query, api_url or
                                       "http://127.0.0.1:8920/api/public/kb/realtime-search")
        degraded = False
    except Exception as e:
        hits, degraded = [], str(e)[:120]
    payload = {
        "ok": True, "query": query, "backend": backend,
        "entries": [{k: h[k] for k in ("id", "title", "module", "score_norm")} for h in hits],
        "no_record": len(hits) == 0, "degraded": degraded,
        "rule": "研判仅可引用 entries 所列原文；无来源不立项；冲突全列。",
    }
    if msg.get("report") is True and not degraded:
        payload["report_markdown"] = build_report(query, hits)
    return payload


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--backend", choices=["local_kb_api", "local_files"], required=True)
    ap.add_argument("--kb-root", default=None)
    ap.add_argument("--api-url", default=None)
    ap.add_argument("--msg", required=True, help="MULTIMODAL_STD_INPUT JSON 报文")
    ap.add_argument("--allow-fate", action="store_true",
                    help="消费方为命理主场时关闭命理拒答边界")
    args = ap.parse_args()
    msg = json.loads(args.msg)
    boundary = None if args.allow_fate else DEFAULT_BOUNDARY
    out = handle(msg, args.backend, kb_root=args.kb_root,
                 api_url=args.api_url, boundary=boundary)
    print(json.dumps(out, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
