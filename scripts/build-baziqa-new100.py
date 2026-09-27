#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build-baziqa-new100.py — 题库扩容重建（2026-09-28 · R-WIKI-EXPAND 后可用池 236 人）
源：verification_corpus / Wikidata名人（603 人已抓事件，事件年份经维基可核）。
规则（防幻觉）：
  - 只取 events 非空且带年份者；题目答案只来自 facts_json 结构化字段；
  - 与 celebrity50_zh + celebrity-new60_zh 人名双零交集（防训练污染）；
  - 题型：事件年份反推（MCQ A-E，干扰项 ±1/2/3/7 年洗牌）+ 出生年反推；
  - 固定 seed 洗牌，可复现。
产出：training/baziqa/data/celebrity-new60_zh.json（60 人 × ≤6 题）。
"""
import json, random, sqlite3, re, sys

DB = 'server/database/yidao.db'
OUT = 'training/baziqa/data/celebrity-new100_zh.json'
N_PERSONS = 100
SEED = 20260928
rng = random.Random(SEED)

old = json.load(open('training/baziqa/data/celebrity50_zh.json', encoding='utf-8'))
mid = json.load(open('training/baziqa/data/celebrity-new60_zh.json', encoding='utf-8'))
old_names = {p['name'].strip().lower() for p in old} | {p['name'].strip().lower() for p in mid}

conn = sqlite3.connect(f'file:{DB}?mode=ro', uri=True)
rows = conn.execute(
    "SELECT person_id, name, birth_json, facts_json FROM verification_corpus "
    "WHERE source='Wikidata名人' AND facts_json LIKE '%events_fetched%'").fetchall()
conn.close()

cands = []
for pid, name, bj, fj in rows:
    if name.strip().lower() in old_names:
        continue
    try:
        birth, facts = json.loads(bj), json.loads(fj)
    except Exception:
        continue
    evs = [e for e in (facts.get('events') or []) if e.get('year') and 1800 < int(e['year']) <= 2026]
    if len(evs) < 1 or not birth.get('year'):
        continue
    cands.append({'person_id': pid, 'name': name, 'birth': birth, 'events': evs})

rng.shuffle(cands)
cands = cands[:N_PERSONS]

def year_options(ans, lo=1900, hi=2026):
    pool = sorted({ans + d for d in (-7, -3, -2, -1, 1, 2, 3, 7) if lo <= ans + d <= hi})
    rng.shuffle(pool)
    opts = pool[:4] + [ans]
    opts = sorted(set(opts))[:5]
    while len(opts) < 5:
        opts.append(opts[-1] + 4)
    opts = opts[:5]
    rng.shuffle(opts)
    labels = 'ABCDE'
    return [f'{labels[i]}. {y}年' for i, y in enumerate(opts)], labels[opts.index(ans)]

persons_out = []
for c in cands:
    qs = []
    b = c['birth']
    by = int(b['year'])
    opts, ans = year_options(by, 1880, 2010)
    qs.append({'question_id': f"{c['person_id']}-Q0",
               'question': f'命主（{c["name"]}）的出生年份是？（以排盘反推校验）',
               'options': opts, 'answer': ans})
    seen_years = {by}
    for e in c['events'][:5]:
        y = int(e['year'])
        if y in seen_years:
            continue
        seen_years.add(y)
        txt = re.sub(r'\s+', '', e.get('text', ''))[:40]
        # 脱敏：抹掉事件文本中的公元年份（防题干泄题，2026-09-27 实证 55/111 题自带答案）
        txt = re.sub(r'(19|20)\d{2}\s*年?', '某年', txt)
        opts, ans = year_options(y)
        qs.append({'question_id': f"{c['person_id']}-Q{len(qs)}",
                   'question': f'命主在「{txt}…」这一事件发生的年份是？',
                   'options': opts, 'answer': ans})
    if len(qs) < 3:
        # 补足：出生年干支题（规则可核）
        ganzhi = '甲子乙丑丙寅丁卯戊辰己巳庚午辛未壬申癸酉甲戌乙亥丙子丁丑戊寅己卯庚辰辛巳壬午癸未甲申乙酉丙戌丁亥戊子己丑庚寅辛卯壬辰癸巳甲午乙未丙申丁酉戊戌己亥庚子辛丑壬寅癸卯甲辰乙巳丙午丁未戊申己酉庚戌辛亥壬子癸丑甲寅乙卯丙辰丁巳戊午己未庚申辛酉壬戌癸亥'
        gzs = [ganzhi[i*2:i*2+2] for i in range(60)]
        correct = gzs[(by - 4) % 60]
        pool = [correct] + [gzs[(by - 4 + d) % 60] for d in (1, 2, 10, 37)]
        rng.shuffle(pool)
        labels = 'ABCDE'
        qs.append({'question_id': f"{c['person_id']}-Q{len(qs)}",
                   'question': f'命主出生年（{by}年）的干支是？',
                   'options': [f'{labels[i]}. {g}' for i, g in enumerate(pool)],
                   'answer': labels[pool.index(correct)]})
    if len(qs) >= 3:
        persons_out.append({'person_id': c['person_id'], 'name': c['name'],
                            'profile': {'birth': b, 'gender': 'unknown'},
                            'categories': ['事件反推', '年份校验'],
                            'questions': qs, 'source_file': 'verification_corpus/Wikidata名人'})

json.dump(persons_out, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
total_q = sum(len(p['questions']) for p in persons_out)
print(f'新题库 {len(persons_out)} 人 {total_q} 题 → {OUT}（seed={SEED}，与50/60两旧库零交集）')
