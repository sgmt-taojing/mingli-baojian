#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
contest-answer-engine.py — BaziQA 大赛 200 题自动答题引擎
用 MLX 本地模型 (mingli-sft-v9.0-7b @8960) 基于排盘 JSON 答题, 对标准答案算准确率
输出: 每题对/错 + 分类统计 + 总准确率 → verification_corpus.verify_detail_json
"""
import json, re, sqlite3, sys, time, urllib.request

DB = "/Users/tom/kimi/projects/mingli-baojian/server/database/yidao.db"
MLX = "http://127.0.0.1:8960/v1/chat/completions"

SYS = """你是一位精通八字命理的命理师。请根据提供的排盘数据，从四个选项中选择最符合命理分析的一项。
只需回复一个字母：A、B、C 或 D。不要解释，不要输出其他内容。"""

def build_prompt(pp, question, options):
    """从排盘 JSON 提取关键信息构建答题 prompt"""
    p = pp.get("pillars", {})
    dm = pp.get("day_master", "")
    wx = pp.get("wuxing_count", {})
    wl = pp.get("wuxing_lack", [])
    ss = pp.get("shensha", [])
    if isinstance(ss, dict):
        ss = list(ss.keys())
    gs = pp.get("gan_shen", {})
    birth = pp.get("_birth_year", "")
    gender = pp.get("input", {}).get("gender", "")

    # 大运摘要
    dayun_str = ""
    for d in pp.get("dayun", [])[:8]:
        if d.get("ganzhi"):
            dayun_str += f"{d.get('start_age','?')}-{d.get('end_age','?')}岁 {d['ganzhi']}({d.get('gan_shen','')}) "

    # 流年摘要(近10年)
    liunian_str = ""
    for l in pp.get("liunian", [])[:10]:
        liunian_str += f"{l.get('year','?')}年{l.get('ganzhi','')}({l.get('gan_shen','')}) "

    prompt = f"""【排盘数据】
四柱: 年柱{p.get('年','')} 月柱{p.get('月','')} 日柱{p.get('日','')} 时柱{p.get('时','')}
日主: {dm} | 性别: {gender} | 出生年: {birth}
五行统计: {json.dumps(wx, ensure_ascii=False)} | 五行缺: {','.join(wl) if wl else '无'}
天干十神: {json.dumps(gs, ensure_ascii=False)}
神煞: {','.join(ss[:8])}
大运: {dayun_str}
近年流年: {liunian_str}

【题目】{question}

【选项】
{chr(10).join(options)}

请回复一个字母(A/B/C/D):"""
    return prompt

def ask_mlx(prompt, retries=2):
    for attempt in range(retries + 1):
        try:
            payload = {
                "model": "mingli-sft-v9.0-7b",
                "messages": [
                    {"role": "system", "content": SYS},
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": 16,
                "temperature": 0.1,
            }
            req = urllib.request.Request(
                MLX, data=json.dumps(payload).encode(),
                headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=60) as r:
                resp = json.loads(r.read().decode())
            text = resp["choices"][0]["message"]["content"].strip().upper()
            # 提取 ABCD
            m = re.search(r"[ABCD]", text)
            if m:
                return m.group(0)
            if attempt < retries:
                time.sleep(1)
        except Exception as e:
            if attempt < retries:
                time.sleep(2)
            else:
                print(f"  [mlx-fail] {e}", file=sys.stderr)
    return None

def main():
    db = sqlite3.connect(DB)
    db.row_factory = sqlite3.Row
    rows = db.execute(
        "SELECT person_id, name, facts_json, paipan_json FROM verification_corpus "
        "WHERE source='BaziQA大赛赛题' AND paipan_json IS NOT NULL AND paipan_json<>''").fetchall()
    print(f"大赛样本: {len(rows)} 人", flush=True)

    total_q = correct = answered = 0
    results = {}
    t0 = time.time()

    for row in rows:
        pid = row["person_id"]
        pp = json.loads(row["paipan_json"])
        facts = json.loads(row["facts_json"])
        questions = facts.get("questions", [])
        p_correct = 0
        p_total = len(questions)
        q_results = []

        for q in questions:
            total_q += 1
            prompt = build_prompt(pp, q["q"], q["options"])
            pred = ask_mlx(prompt)
            if pred:
                answered += 1
                hit = (pred == q["answer"])
                if hit:
                    correct += 1
                    p_correct += 1
                q_results.append({
                    "qid": q["qid"], "q": q["q"][:40],
                    "pred": pred, "answer": q["answer"], "hit": hit
                })
            else:
                q_results.append({
                    "qid": q["qid"], "q": q["q"][:40],
                    "pred": None, "answer": q["answer"], "hit": False
                })

        score = round(p_correct / p_total, 2) if p_total else 0
        results[pid] = {"name": row["name"], "score": score,
                        "correct": p_correct, "total": p_total}

        # 写回 verify 字段
        db.execute(
            "UPDATE verification_corpus SET verify_status='verified', verify_score=?, "
            "verify_detail_json=?, updated_at=CURRENT_TIMESTAMP WHERE person_id=?",
            (score, json.dumps({"mode": "contest_qa_mlx", "correct": p_correct,
                                "total": p_total, "questions": q_results},
                               ensure_ascii=False), pid))

        elapsed = time.time() - t0
        print(f"  [{pid}] {p_correct}/{p_total} = {score:.0%} "
              f"(累计 {correct}/{total_q} = {correct/total_q:.1%}, "
              f"{elapsed:.0f}s)", flush=True)

    db.commit()

    # 汇总
    print(f"\n{'='*50}")
    print(f"大赛答题完成: {answered}/{total_q} 题已作答")
    if total_q:
        acc = correct / total_q
        print(f"总准确率: {correct}/{total_q} = {acc:.1%}")
        # 分布
        bins = {"100%": 0, "80%": 0, "60%": 0, "40%": 0, "20%": 0, "0%": 0}
        for r in results.values():
            s = r["score"]
            if s >= 1.0: bins["100%"] += 1
            elif s >= 0.8: bins["80%"] += 1
            elif s >= 0.6: bins["60%"] += 1
            elif s >= 0.4: bins["40%"] += 1
            elif s >= 0.2: bins["20%"] += 1
            else: bins["0%"] += 1
        print(f"分数分布: {json.dumps(bins)}")
        # 随机基线 25%
        print(f"随机基线: 25.0% | 超基线: {'是' if acc > 0.25 else '否'}")

    db.close()

if __name__ == "__main__":
    main()
