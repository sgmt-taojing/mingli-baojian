#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
fill-wikidata-events.py — 维基名人库事件补齐（R-WIKI-FILL）
背景：08-30 扩容抓取时 zh.wikipedia 链路不通，603 条只有生辰没有导语事件。
本脚本只对存量缺事件行做 UPDATE（不重跑 SPARQL、不新增人）：
  - 批量取中文维基导语（50 标题/次），事件正则抽自导语
  - 熔断：连续 2 批超时判定链路仍不通，退出码 2（供看守任务识别"网络未恢复"）
  - 幂等：处理过的行 facts 里写 events_fetched=true，下次跳过
用法: python3 fill-wikidata-events.py          # 补全部缺事件行
退出码: 0=完成(或本批完成)  2=网络仍不通  1=其他错误
"""
import json, re, sqlite3, sys, time, urllib.parse, urllib.request

DB = "/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/server/database/yidao.db"
UA = {"User-Agent": "Mozilla/5.0 (Macintosh) mingli-corpus/1.0 (research)"}

EV_PAT = re.compile(r"((?:19|20)\d{2})\s*年[^。；;]{0,40}(结婚|嫁|娶|离婚|逝世|去世|病逝|出道|获[奖得]|荣获|当选|上任|就任|退役|移民|移居|创立|创办|确诊|患癌|入狱|被捕|破产|生子|诞下)")


def get(url, timeout=30):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8"))


def main():
    db = sqlite3.connect(DB)
    cur = db.cursor()
    rows = cur.execute(
        "SELECT person_id, name, facts_json FROM verification_corpus "
        "WHERE source='Wikidata名人' AND facts_json NOT LIKE '%\"year\"%' "
        "AND facts_json NOT LIKE '%events_fetched%'").fetchall()
    total = len(rows)
    print(f"待补事件: {total} 人")
    if not total:
        print("全部已带事件，无需补跑")
        db.close()
        return 0

    filled = 0
    attempted = 0
    fail_streak = 0
    BATCH = 50
    for i in range(0, total, BATCH):
        if fail_streak >= 2:
            print("[abort] 维基链路仍不通，已保留断点，下次继续", file=sys.stderr)
            db.commit()
            db.close()
            return 2
        chunk = rows[i:i + BATCH]
        titles = [r[1] for r in chunk]
        u = ("https://zh.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1"
             "&explaintext=1&redirects=1&format=json&titles=" + urllib.parse.quote("|".join(titles)))
        try:
            d = get(u, 30)
            pages = d.get("query", {}).get("pages", {})
            ext_by_title = {p["title"]: p["extract"] for p in pages.values() if "extract" in p}
            # redirects 后标题可能规范化，建 normalized→原名 映射
            norm_map = {}
            for rd in d.get("query", {}).get("redirects", []):
                norm_map[rd.get("to")] = rd.get("from")
            fail_streak = 0
        except Exception as e:
            fail_streak += 1
            print(f"  [batch-fail] {i}-{i+len(chunk)}: {e}", file=sys.stderr)
            time.sleep(2)
            continue

        for pid, name, facts_raw in chunk:
            ext = ext_by_title.get(name, "")
            if not ext:
                # 尝试 redirect 规范化标题反查
                for to_t, from_t in norm_map.items():
                    if from_t == name and to_t in ext_by_title:
                        ext = ext_by_title[to_t]
                        break
            try:
                facts = json.loads(facts_raw or "{}")
            except Exception:
                facts = {}
            events = [{"year": int(m.group(1)), "text": m.group(0)[:60]} for m in EV_PAT.finditer(ext)]
            facts.update({
                "type": "wiki_intro_events",
                "events": events,
                "raw_text": ";".join(f"{e['year']}年{e['text']}" for e in events),
                "intro": ext[:500],
                "events_fetched": True,
            })
            cur.execute("UPDATE verification_corpus SET facts_json=?, updated_at=CURRENT_TIMESTAMP WHERE person_id=?",
                        (json.dumps(facts, ensure_ascii=False), pid))
            attempted += 1
            if events:
                filled += 1
        print(f"  进度 {min(i + BATCH, total)}/{total} 本批带事件累计={filled}")
        sys.stdout.flush()
        db.commit()
        time.sleep(0.4)

    db.commit()
    db.close()
    print(f"补跑完成: 处理={attempted} 带事件={filled} / 待补总数={total}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
