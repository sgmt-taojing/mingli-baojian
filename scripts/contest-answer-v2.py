#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""contest-answer-v2.py — 大赛答题引擎 v2(优化 prompt), 支持分批跑"""
import json, re, sqlite3, sys, time, urllib.request

DB = "/Users/tom/kimi/projects/mingli-baojian/server/database/yidao.db"
MLX = "http://127.0.0.1:8960/v1/chat/completions"
OFFSET = int(sys.argv[1]) if len(sys.argv) > 1 else 0
LIMIT = int(sys.argv[2]) if len(sys.argv) > 2 else 20

SYS = """你是精通八字命理的资深命理师。根据排盘数据选择最符合的一项。

核心规则:
- 男命:正财=妻子/正缘,偏财=情人/意外之财;女命:正官=丈夫/正缘,七杀=情人/压力
- 五行缺什么→对应领域弱(缺土=缺信/稳定,缺金=缺义/决断,缺水=缺智/灵活,缺木=缺仁/成长,缺火=缺礼/热情)
- 食神伤官=才华/子女/表达;正印偏印=学业/贵人/母亲
- 七杀=压力/官非/疾病;正官=事业/地位/丈夫(女命)
- 桃花+正财/正官→婚姻恋爱;驿马→迁移/出国
- 大运管十年基调,流年管具体年份

只回复一个字母A/B/C/D。"""

def build_prompt(pp, q, opts, gender):
    p = pp.get('pillars', {}); dm = pp.get('day_master', '')
    wx = pp.get('wuxing_count', {}); wl = pp.get('wuxing_lack', [])
    ss = pp.get('shensha', [])
    if isinstance(ss, dict): ss = list(ss.keys())
    gs = pp.get('gan_shen', {}); zs = pp.get('zhi_shen', {})
    dy = ' '.join(f"{d.get('start_age','?')}-{d.get('end_age','?')}岁{d['ganzhi']}({d.get('gan_shen','')})"
                  for d in pp.get('dayun', [])[1:7] if d.get('ganzhi'))
    ln = ' '.join(f"{l.get('year','')}{l.get('ganzhi','')}({l.get('gan_shen','')})"
                  for l in pp.get('liunian', [])[:8])
    return (f"四柱:{p.get('年','')} {p.get('月','')} {p.get('日','')} {p.get('时','')} "
            f"| 日主:{dm} | {'女命' if gender=='female' else '男命'} | 出生:{pp.get('_birth_year','')}\n"
            f"五行:{json.dumps(wx,ensure_ascii=False)} 缺:{','.join(wl) if wl else '无'}\n"
            f"天干十神:{json.dumps(gs,ensure_ascii=False)} | 地支十神:{json.dumps(zs,ensure_ascii=False) if zs else '无'}\n"
            f"神煞:{','.join(ss[:8])}\n大运:{dy}\n流年:{ln}\n\n{q}\n{chr(10).join(opts)}\n答:")

def ask(prompt):
    for att in range(3):
        try:
            payload = {'model': 'mingli-sft-v9.0-7b',
                       'messages': [{'role': 'system', 'content': SYS},
                                    {'role': 'user', 'content': prompt}],
                       'max_tokens': 8, 'temperature': 0.1}
            req = urllib.request.Request(MLX, data=json.dumps(payload).encode(),
                                         headers={'Content-Type': 'application/json'})
            with urllib.request.urlopen(req, timeout=30) as r:
                resp = json.loads(r.read().decode())
            m = re.search(r'[ABCD]', resp['choices'][0]['message']['content'].strip().upper())
            if m: return m.group(0)
            time.sleep(1)
        except Exception as e:
            if att == 2: print(f'  [fail] {e}', file=sys.stderr)
            else: time.sleep(2)
    return None

def main():
    db = sqlite3.connect(DB); db.row_factory = sqlite3.Row
    rows = db.execute(
        "SELECT person_id,birth_json,facts_json,paipan_json FROM verification_corpus "
        "WHERE source='BaziQA大赛赛题' AND paipan_json IS NOT NULL ORDER BY person_id "
        f"LIMIT {LIMIT} OFFSET {OFFSET}").fetchall()
    print(f'批次: OFFSET={OFFSET} LIMIT={LIMIT} → {len(rows)} 人', flush=True)
    tc = tt = 0
    for row in rows:
        pp = json.loads(row['paipan_json']); facts = json.loads(row['facts_json'])
        birth = json.loads(row['birth_json'])
        pc = 0; pt = len(facts.get('questions', [])); qr = []
        for q in facts.get('questions', []):
            tt += 1
            pred = ask(build_prompt(pp, q['q'], q['options'], birth.get('gender', 'male')))
            hit = pred is not None and pred == q['answer']
            if hit: tc += 1; pc += 1
            qr.append({'qid': q['qid'], 'q': q['q'][:40], 'pred': pred, 'answer': q['answer'], 'hit': hit})
        score = round(pc / pt, 2) if pt else 0
        db.execute("UPDATE verification_corpus SET verify_status='verified',verify_score=?,"
                   "verify_detail_json=?,updated_at=CURRENT_TIMESTAMP WHERE person_id=?",
                   (score, json.dumps({'mode': 'contest_qa_mlx_v2', 'correct': pc, 'total': pt,
                                       'questions': qr}, ensure_ascii=False), row['person_id']))
        db.commit()
        print(f'  [{row["person_id"][:35]}] {pc}/{pt}={score:.0%} 累计{tc}/{tt}={tc/tt:.0%}', flush=True)
    print(f'\n本批: {tc}/{tt} = {tc/tt:.1%}', flush=True)
    # 全量统计
    all_r = db.execute("SELECT verify_detail_json FROM verification_corpus "
                       "WHERE source='BaziQA大赛赛题' AND verify_detail_json LIKE '%contest_qa_mlx_v2%'").fetchall()
    ac = at = 0
    for r in all_r:
        d = json.loads(r[0]); ac += d['correct']; at += d['total']
    if at: print(f'v2全量: {ac}/{at} = {ac/at:.1%} ({len(all_r)}人已答)', flush=True)
    db.close()

if __name__ == '__main__':
    main()
