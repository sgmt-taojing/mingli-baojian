#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
batch-verify-corpus.py — 校正库批量排盘+校验
范围:
  A. 学术数据集 50 条(有精确年月日): 8911/paipan 排盘 → 填 paipan_json →
     把 facts.categories 拼成 raw_text → 调 8920 /api/verification/verify
  B. 倪师天纪命例 32 条(仅民国年+干支, approximate): 年柱一致性轻校验
     (solar_year_est 干支 == birth_json.year_ganzhi ?) → 写 verify_detail_json
"""
import json, re, sqlite3, sys, time, urllib.request

DB = "/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/server/database/yidao.db"
PAIPAN = "http://localhost:8911/paipan"
VERIFY = "http://localhost:8920/api/verification/verify"

GAN = "甲乙丙丁戊己庚辛壬癸"
ZHI = "子丑寅卯辰巳午未申酉戌亥"

def year_ganzhi(y):
    # 1984 = 甲子
    idx = (y - 1984) % 60
    return GAN[idx % 10] + ZHI[idx % 12]

def post(url, payload, timeout=30):
    req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"),
                                 headers={"Content-Type": "application/json",
                                          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) corpus-batch"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8"))

def main():
    db = sqlite3.connect(DB, isolation_level=None)  # autocommit：每条 UPDATE 立即提交，避免全程持锁卡死 8920 同步写
    db.execute('PRAGMA busy_timeout=8000')
    db.row_factory = sqlite3.Row
    cur = db.cursor()

    # ---- A. 学术数据集批量排盘 ----
    rows = cur.execute(
        "SELECT person_id, name, birth_json, facts_json FROM verification_corpus "
        "WHERE source IN ('学术数据集','Wikidata名人') AND (paipan_json IS NULL OR paipan_json='')").fetchall()
    paipan_ok = paipan_fail = verify_ok = verify_none = 0
    for row in rows:
        pid = row["person_id"]
        birth = json.loads(row["birth_json"] or "{}")
        if birth.get("approximate") or not birth.get("year"):
            continue
        # 1) 拼 raw_text (verify 端点只认 raw_text)
        facts = json.loads(row["facts_json"] or "{}")
        if not facts.get("raw_text") and facts.get("categories"):
            segs = []
            for cat, items in facts["categories"].items():
                for it in items:
                    segs.append(f"[{cat}]{it}")
            facts["raw_text"] = ";".join(segs)
            cur.execute("UPDATE verification_corpus SET facts_json=?, updated_at=CURRENT_TIMESTAMP WHERE person_id=?",
                        (json.dumps(facts, ensure_ascii=False), pid))
        # 2) 排盘 (时辰为 noon 占位, 无性别 → male 默认, 流年表不受影响)
        try:
            r = post(PAIPAN, {
                "year": birth["year"], "month": birth["month"], "day": birth["day"],
                "hour": birth.get("hour", 12), "minute": birth.get("minute", 0),
                "sex": "female" if birth.get("gender") == "female" else "male", "lunar": False,
            }, timeout=60)
            if r.get("ok") is False or "pillars" not in r:
                raise ValueError(str(r)[:120])
            cur.execute("UPDATE verification_corpus SET paipan_json=?, updated_at=CURRENT_TIMESTAMP WHERE person_id=?",
                        (json.dumps(r, ensure_ascii=False), pid))
            paipan_ok += 1
        except Exception as e:
            paipan_fail += 1
            print(f"[paipan-fail] {pid}: {e}", file=sys.stderr)
            continue
    print(f"A.学术数据集: 排盘ok={paipan_ok} fail={paipan_fail}")

    # ---- A2. 全量校验(所有有 paipan_json 且 pending 的学术数据集条目) ----
    vrows = cur.execute(
        "SELECT person_id, facts_json FROM verification_corpus "
        "WHERE source IN ('学术数据集','Wikidata名人') AND paipan_json IS NOT NULL AND paipan_json<>''").fetchall()
    for row in vrows:
        pid = row["person_id"]
        # 确保 raw_text 已拼好
        facts = json.loads(row["facts_json"] or "{}")
        if not facts.get("raw_text") and facts.get("categories"):
            segs = []
            for cat, items in facts["categories"].items():
                for it in items:
                    segs.append(f"[{cat}]{it}")
            facts["raw_text"] = ";".join(segs)
            cur.execute("UPDATE verification_corpus SET facts_json=?, updated_at=CURRENT_TIMESTAMP WHERE person_id=?",
                        (json.dumps(facts, ensure_ascii=False), pid))
        try:
            v = post(VERIFY, {"person_id": pid}, timeout=8)
            if v.get("ok"):
                verify_ok += 1
            else:
                verify_none += 1
        except Exception as e:
            print(f"[verify-fail] {pid}: {e}", file=sys.stderr)
        time.sleep(0.35)  # 8920 限流节流
    print(f"A2.校验: 有事件={verify_ok} 无事件={verify_none}")

    # ---- B. 天纪命例轻校验: 年柱干支 或 年干阴阳 vs yy ----
    YANG_GAN = set("甲丙戊庚壬")
    rows = cur.execute(
        "SELECT person_id, birth_json FROM verification_corpus WHERE source='倪师天纪命例'").fetchall()
    yp_hit = yp_miss = yp_skip = 0
    for pid, birth in pid_birth(rows):
        sy = birth.get("solar_year_est")
        if not sy:
            yp_skip += 1
            continue
        calc = year_ganzhi(int(sy))
        yg = birth.get("year_ganzhi")
        if yg:
            hit = (calc == yg)
            check = {"type": "year_pillar", "claimed": yg, "calc": calc, "hit": hit}
        elif birth.get("yy"):
            calc_yy = "yang" if calc[0] in YANG_GAN else "yin"
            hit = (calc_yy == birth["yy"])
            check = {"type": "year_gan_yy", "claimed_yy": birth["yy"], "calc": f"{calc}({calc_yy})", "hit": hit}
        else:
            yp_skip += 1
            continue
        detail = {"light_check": check, "note": "approximate 样本, 仅年柱级校验"}
        cur.execute("UPDATE verification_corpus SET verify_status=?, verify_score=?, verify_detail_json=?, updated_at=CURRENT_TIMESTAMP WHERE person_id=?",
                    ("verified" if hit else "mismatch", 1.0 if hit else 0.0,
                     json.dumps(detail, ensure_ascii=False), pid))
        yp_hit, yp_miss = yp_hit + hit, yp_miss + (not hit)
    print(f"B.天纪命例年柱/阴阳校验: 命中={yp_hit} 不符={yp_miss} 跳过={yp_skip}")

    # ---- C. 学术数据集深度事件校验(十神信号 vs 事件性质) ----
    WUXING = {"甲": ("木", 1), "乙": ("木", 0), "丙": ("火", 1), "丁": ("火", 0),
              "戊": ("土", 1), "己": ("土", 0), "庚": ("金", 1), "辛": ("金", 0),
              "壬": ("水", 1), "癸": ("水", 0)}
    SHENG = {"木": "火", "火": "土", "土": "金", "金": "水", "水": "木"}   # 我生
    KE = {"木": "土", "土": "水", "水": "火", "火": "金", "金": "木"}       # 我克

    def shishen(day_gan, year_gan):
        de, dy = WUXING[day_gan]
        ye, yy_ = WUXING[year_gan]
        same = (dy == yy_)
        if ye == de:
            return "比肩" if same else "劫财"
        if SHENG[de] == ye:
            return "食神" if same else "伤官"
        if KE[de] == ye:
            return "偏财" if same else "正财"
        if KE[ye] == de:
            return "七杀" if same else "正官"
        return "偏印" if same else "正印"  # SHENG[ye]==de

    # 事件类别 → 相合十神集合(启发式; 性别未知时财/官都算)
    CAT_SIGNAL = {
        "感情": {"正财", "正官", "偏财", "七杀"},
        "婚姻": {"正财", "正官"},
        "事业": {"正官", "正印", "食神", "七杀"},
        "成名": {"正官", "正印", "食神"},
        "获奖": {"正官", "正印", "食神"},
        "健康": {"七杀", "伤官", "劫财"},
        "患病": {"七杀", "伤官"},
        "去世": {"七杀", "伤官", "劫财"},
        "家庭": {"食神", "伤官", "正印"},
        "子女": {"食神", "伤官"},
        "争议": {"七杀", "劫财", "伤官"},
        "牢狱": {"七杀", "劫财"},
        "诉讼": {"七杀", "正官"},
        "财富": {"正财", "偏财"},
        "政治": {"正官", "七杀", "正印"},
    }

    def cat_of(text):
        for k in CAT_SIGNAL:
            if k in text:
                return k
        return None

    crows = cur.execute(
        "SELECT person_id, name, facts_json, paipan_json FROM verification_corpus "
        "WHERE source IN ('学术数据集','Wikidata名人') AND paipan_json IS NOT NULL AND paipan_json<>''").fetchall()
    deep_done = 0
    scores = []
    for row in crows:
        pid = row["person_id"]
        pp = json.loads(row["paipan_json"])
        dm = (pp.get("day_master") or "")[:1]  # "庚金"→"庚"
        if dm not in WUXING:
            continue
        facts = json.loads(row["facts_json"] or "{}")
        raw = facts.get("raw_text") or ""
        events = []
        for seg in raw.split(";"):
            m = re.search(r"(\d{4})", seg)
            if m:
                events.append((int(m.group(1)), seg))
        if not events:
            continue
        # ── deep_shishen_v2：地支主气十神 + 大运干支十神联动 + 性别区分（可得时）──
        ZHI_QI = {"子":"癸","丑":"己","寅":"甲","卯":"乙","辰":"戊","巳":"丙",
                  "午":"丁","未":"己","申":"庚","酉":"辛","戌":"戊","亥":"壬"}
        # 性别识别：facts.gender > paipan.gender > 事件文本线索（娶妻/丈夫等）
        gender = (facts.get("gender") or pp.get("gender") or "").lower()
        if gender not in ("m", "f", "male", "female"):
            if re.search(r"嫁给|丈夫|老公", raw): gender = "f"
            elif re.search(r"娶妻|娶.{0,3}为妻|妻子|老婆", raw): gender = "m"
            else: gender = ""
        is_m = gender in ("m", "male")
        is_f = gender in ("f", "female")
        dayun = pp.get("dayun", [])
        hits = 0
        detail = []
        for yr, txt in events:
            ygz = year_ganzhi(yr)
            cat = cat_of(txt)
            sig = set(CAT_SIGNAL.get(cat, set())) if cat else set()
            # 性别区分：感情/婚姻 男看财、女看官；性别不明保持财∪官并集
            if cat in ("感情", "婚姻"):
                if is_m: sig = {"正财", "偏财"}
                elif is_f: sig = {"正官", "七杀"}
            # 该年所在大运
            dy_hit = next((d for d in dayun if d.get("start_year") and
                           d["start_year"] <= yr < d["start_year"] + 10), None)
            dy_gz = (dy_hit or {}).get("ganzhi", "")
            # 信号通道：流年干 + 流年支主气 + 大运干 + 大运支主气
            ss_gan = shishen(dm, ygz[0])
            ss_zhi = shishen(dm, ZHI_QI[ygz[1]])
            channels = {"流年干": ss_gan, "流年支": ss_zhi}
            if dy_gz and len(dy_gz) >= 2:
                channels["大运干"] = shishen(dm, dy_gz[0])
                channels["大运支"] = shishen(dm, ZHI_QI.get(dy_gz[1], dy_gz[1]) if dy_gz[1] in ZHI_QI else dy_gz[1])
            hit_by = [k for k, v in channels.items() if v in sig] if sig else []
            hit = bool(hit_by)
            if hit:
                hits += 1
            detail.append({"year": yr, "liunian": ygz, "shishen": ss_gan,
                           "branch_shishen": ss_zhi, "dayun": dy_gz, "cat": cat,
                           "hit": hit, "hit_by": hit_by, "text": txt[:60]})
        score = round(hits / len(events), 2)
        scores.append(score)
        cur.execute("UPDATE verification_corpus SET verify_status='verified', verify_score=?, "
                    "verify_detail_json=?, updated_at=CURRENT_TIMESTAMP WHERE person_id=?",
                    (score, json.dumps({"mode": "deep_shishen_v2", "day_master": pp.get("day_master"),
                                        "gender": gender or "unknown",
                                        "hits": hits, "total": len(events),
                                        "events": detail}, ensure_ascii=False), pid))
        deep_done += 1
    if scores:
        avg = sum(scores) / len(scores)
        hi = sum(1 for s in scores if s >= 0.5)
        print(f"C.深度校验(v2): {deep_done}条 平均命中率={avg:.2f} ≥0.5者={hi}/{len(scores)}")
    else:
        print("C.深度校验: 无可校验样本")

    db.commit()
    # 汇总
    tot = cur.execute("SELECT verify_status, COUNT(*) FROM verification_corpus GROUP BY verify_status").fetchall()
    print("库校验状态分布:", dict(tot))
    db.close()

def pid_birth(rows):
    for r in rows:
        yield r["person_id"], json.loads(r["birth_json"] or "{}")

if __name__ == "__main__":
    main()
