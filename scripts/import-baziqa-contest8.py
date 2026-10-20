#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
import-baziqa-contest8.py — BaziQA 全球命理师大赛 2021-2025 赛题入库 + 排盘
40 位真实命主(完整生辰+性别) + 200 道带赛会标准答案实战题
source='BaziQA大赛赛题', weight=1.5(带标准答案, 校验权重最高档)
"""
import json, glob, os, sqlite3, sys, urllib.request

DB = "/Users/tom/kimi/projects/mingli-baojian/server/database/yidao.db"
PAIPAN = "http://localhost:8911/paipan"
UA = {"Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) corpus-batch"}

def post(url, payload, timeout=60):
    req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8"))

def main():
    db = sqlite3.connect(DB)
    cur = db.cursor()
    added = skipped = paipan_ok = paipan_fail = 0
    for fp in sorted(glob.glob("/tmp/baziqa/contest8_*.json")):
        year_tag = os.path.basename(fp).replace("contest8_", "").replace(".json", "")
        for item in json.load(open(fp)):
            pid_raw = item.get("person_id")
            if not pid_raw:
                continue  # 跳过元信息块
            pid = f"baziqa-{year_tag}-{pid_raw}"
            if cur.execute("SELECT 1 FROM verification_corpus WHERE person_id=?", (pid,)).fetchone():
                skipped += 1
                continue
            prof = item["profile"]
            birth = dict(prof["birth"])
            birth["approximate"] = False
            birth["gender"] = prof.get("gender")
            questions = item.get("questions", [])
            facts = {
                "type": "contest_qa",
                "contest_year": year_tag,
                "questions": [{"qid": q["question_id"], "q": q["question"],
                               "options": q["options"], "answer": q["answer"]} for q in questions],
                "raw_text": ";".join(q["question"] for q in questions),
            }
            cur.execute(
                "INSERT INTO verification_corpus(person_id,name,source,source_detail,birth_json,facts_json,"
                "verify_status,weight,created_at,updated_at) VALUES(?,?,?,?,?,?,'pending',1.5,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)",
                (pid, item.get("name", pid_raw), "BaziQA大赛赛题",
                 f"BaziQA contest8_{year_tag}(MIT, github.com/ChenJiangxi/BaziQA) 全球命理师大赛真题带标准答案",
                 json.dumps(birth, ensure_ascii=False), json.dumps(facts, ensure_ascii=False)))
            added += 1
            # 立即排盘
            try:
                r = post(PAIPAN, {
                    "year": birth["year"], "month": birth["month"], "day": birth["day"],
                    "hour": birth.get("hour", 12), "minute": birth.get("minute", 0),
                    "sex": "female" if birth["gender"] == "female" else "male", "lunar": False,
                })
                if "pillars" not in r:
                    raise ValueError(str(r)[:120])
                cur.execute("UPDATE verification_corpus SET paipan_json=? WHERE person_id=?",
                            (json.dumps(r, ensure_ascii=False), pid))
                paipan_ok += 1
            except Exception as e:
                paipan_fail += 1
                print(f"[paipan-fail] {pid}: {e}", file=sys.stderr)
    db.commit()
    tot = cur.execute("SELECT COUNT(*) FROM verification_corpus").fetchone()[0]
    print(f"导入: 新增={added} 跳过={skipped} | 排盘 ok={paipan_ok} fail={paipan_fail} | 库总量={tot}")
    db.close()

if __name__ == "__main__":
    main()
