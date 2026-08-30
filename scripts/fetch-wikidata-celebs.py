#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
fetch-wikidata-celebs.py v2 — 批量版
- 逐国 SPARQL(中国/香港/台湾/新加坡/日本/韩国), sitelinks>30, 每国 LIMIT
- 中文维基 extract 批量取(50 titles/次)
- 事件正则抽自导语
用法: python3 fetch-wikidata-celebs.py [每国上限]
"""
import json, re, sqlite3, sys, time, urllib.parse, urllib.request

DB = "/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/server/database/yidao.db"
UA = {"User-Agent": "Mozilla/5.0 (Macintosh) mingli-corpus/1.0 (research)"}
PER_COUNTRY = int(sys.argv[1]) if len(sys.argv) > 1 else 150
COUNTRIES = [("Q148", "中国"), ("Q8646", "香港"), ("Q865", "台湾"), ("Q334", "新加坡"),
             ("Q17", "日本"), ("Q884", "韩国")]

EV_PAT = re.compile(r"((?:19|20)\d{2})\s*年[^。；;]{0,40}(结婚|嫁|娶|离婚|逝世|去世|病逝|出道|获[奖得]|荣获|当选|上任|就任|退役|移民|移居|创立|创办|确诊|患癌|入狱|被捕|破产|生子|诞下)")

def get(url, timeout=60):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8"))

def sparql(qid, limit):
    q = f"""SELECT ?person ?personLabel ?dob ?sitelinks WHERE {{
  ?person wdt:P31 wd:Q5; wdt:P569 ?dob; wikibase:sitelinks ?sitelinks; wdt:P27 wd:{qid}.
  FILTER(?sitelinks > 30)
  SERVICE wikibase:label {{ bd:serviceParam wikibase:language "zh". }}
}} ORDER BY DESC(?sitelinks) LIMIT {limit}"""
    u = "https://query.wikidata.org/sparql?format=json&query=" + urllib.parse.quote(q)
    return get(u, 90)["results"]["bindings"]

def batch_extract(titles):
    """50 个标题一批取中文维基导语, 返回 {title: extract}
    熔断：连续 2 批超时判定 wiki 链路不通，后续批次直接跳过（生辰数据不受影响）"""
    out = {}
    fail_streak = 0
    for i in range(0, len(titles), 50):
        if fail_streak >= 2:
            print(f"  [extract-skip] 维基链路不通，剩余 {len(titles)-i} 标题跳过（仅生辰入库）", file=sys.stderr)
            break
        chunk = titles[i:i + 50]
        u = ("https://zh.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1"
             "&explaintext=1&redirects=1&format=json&titles=" + urllib.parse.quote("|".join(chunk)))
        try:
            d = get(u, 30)
            for p in d.get("query", {}).get("pages", {}).values():
                if "extract" in p:
                    out[p["title"]] = p["extract"]
            fail_streak = 0
        except Exception as e:
            fail_streak += 1
            print(f"  [extract-fail] {e}", file=sys.stderr)
        time.sleep(0.3)
    return out

def main():
    db = sqlite3.connect(DB)
    cur = db.cursor()
    people = []
    for qid, cn in COUNTRIES:
        try:
            bs = sparql(qid, PER_COUNTRY)
            for b in bs:
                m = re.match(r"\+?(-?\d+)-(\d{2})-(\d{2})T", b["dob"]["value"])
                if not m:
                    continue
                y = int(m.group(1))
                if not (1900 <= y <= 2010):
                    continue
                people.append({
                    "qid": b["person"]["value"].rsplit("/", 1)[-1],
                    "name": b["personLabel"]["value"],
                    "y": y, "mo": int(m.group(2)), "da": int(m.group(3)),
                    "sitelinks": int(b["sitelinks"]["value"]), "country": cn})
            print(f"{cn}: {len(bs)} 人")
        except Exception as e:
            print(f"[sparql-fail] {cn}: {e}", file=sys.stderr)
        time.sleep(1)
    # 去重(多国籍)
    seen = set()
    uniq = []
    for p in people:
        if p["qid"] not in seen:
            seen.add(p["qid"])
            uniq.append(p)
    print(f"合计 {len(uniq)} 人(去重后), 批量取维基导语…")
    sys.stdout.flush()
    extracts = batch_extract([p["name"] for p in uniq])
    added = skipped = 0
    for p in uniq:
        pid = f"wd-{p['qid']}"
        if cur.execute("SELECT 1 FROM verification_corpus WHERE person_id=?", (pid,)).fetchone():
            skipped += 1
            continue
        ext = extracts.get(p["name"], "")
        events = [{"year": int(m.group(1)), "text": m.group(0)[:60]} for m in EV_PAT.finditer(ext)]
        birth = {"year": p["y"], "month": p["mo"], "day": p["da"], "hour": 12, "minute": 0,
                 "hour_placeholder": True, "approximate": False, "country": p["country"],
                 "raw": f"{p['y']}-{p['mo']:02d}-{p['da']:02d}"}
        facts = {"type": "wiki_intro_events", "sitelinks": p["sitelinks"],
                 "events": events,
                 "raw_text": ";".join(f"{e['year']}年{e['text']}" for e in events),
                 "intro": ext[:500]}
        cur.execute(
            "INSERT INTO verification_corpus(person_id,name,source,source_detail,birth_json,facts_json,"
            "verify_status,weight,created_at,updated_at) VALUES(?,?,?,?,?,?,'pending',1.0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)",
            (pid, p["name"], "Wikidata名人",
             f"Wikidata {p['qid']}({p['country']}) sitelinks={p['sitelinks']}; 事件摘自中文维基导语",
             json.dumps(birth, ensure_ascii=False), json.dumps(facts, ensure_ascii=False)))
        added += 1
    db.commit()
    tot = cur.execute("SELECT COUNT(*) FROM verification_corpus").fetchone()[0]
    ev = cur.execute("SELECT COUNT(*) FROM verification_corpus WHERE source='Wikidata名人' AND facts_json LIKE '%\"year\"%'").fetchone()[0]
    print(f"完成: 新增={added} 重复跳过={skipped} 其中带事件={ev} | 库总量={tot}")
    db.close()

if __name__ == "__main__":
    main()
