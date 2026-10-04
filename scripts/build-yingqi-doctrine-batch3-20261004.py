#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""应期 doctrine 蒸馏第三批：补 12 事件全覆盖 + 样本总量 46→54（R-DISTILL-YINGQI-B3 · 2026-10-04 Kimi）

衔接 batch2（34 条），本批 8 条：
  - 去世/寿限 ×2（EVENT_MAP 12 类中唯一未覆盖事件，含岁运并临特殊情形）
  - 破财/婚男/就任女/伤病/获奖/置业 ×1 补强梯度
合成命主不影射真人；指纹幂等可复跑。
用法：/usr/bin/python3 scripts/build-yingqi-doctrine-batch3-20261004.py
"""
import json, sqlite3, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from lib.kb_ingest import KBIngestor
import importlib.util
spec = importlib.util.spec_from_file_location(
    'b1', str(Path(__file__).parent / 'build-yingqi-doctrine-20261001.py'))
b1 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(b1)

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT / 'server' / 'database' / 'yidao.db'
OUT = ROOT / 'training' / 'distill-yingqi-doctrine-batch3-20261004.jsonl'

# (事件, 出生, 男?, 候选年, 命中十神, 难度, 进阶说明或None)
B3 = [
    # 去世/寿限 ×2（EVENT_MAP 末位事件首次覆盖）
    ('去世/寿限', '1940-03-12', True, [1988, 1994, 1999, 2005, 2011], ('七杀',), '高阶',
     '滴天髓：休囚系乎运尤系乎岁——须先定用神，大运入用神死绝之地、流年再逢克泄交加方论大限，不可一见七杀便断'),
    ('去世/寿限', '1935-09-08', False, [1980, 1987, 1993, 2000, 2008], ('七杀',), '特殊·岁运并临',
     '寿元星（食神）受制为本，岁运并临凶神加倍（三命通会）——先查候选年是否与所行大运同干支'),
    # 梯度补强 ×6
    ('破财/投资失利', '1992-06-15', True, [2016, 2019, 2022, 2025, 2028], ('劫财',), '基础', None),
    ('婚嫁（男命）', '1988-02-29', True, [2012, 2015, 2018, 2021, 2024], ('正财', '偏财'), '进阶',
     '财星透干之外，日支（婚姻宫）逢六合之年同论；比劫夺财之命须大运护财'),
    ('就任/当选/升官', '1975-11-03', False, [2005, 2009, 2013, 2017, 2021], ('正官', '正印'), '进阶',
     '女命官星兼主夫与权——官星透干之年须结合大运官杀地分判应事在婚还是在职'),
    ('伤病/手术/凶险', '1995-04-18', True, [2018, 2021, 2024, 2027, 2030], ('七杀', '伤官'), '基础', None),
    ('获奖/科名/入学', '1998-08-08', True, [2016, 2019, 2022, 2025, 2028], ('正印', '正官'), '基础', None),
    ('置业/搬迁', '1990-06-06', False, [2014, 2018, 2022, 2026, 2030], ('正印',), '进阶',
     '印星透干主置产，日支逢冲主动迁——冲与透分开判；冲而动者搬迁，合而定者置业'),
]

def build(i, spec):
    ev, birth, male, years, gods, diff, note = spec
    y, m, d = (int(x) for x in birth.split('-'))
    ef = b1.engine_facts(y, m, d, male)
    ds = ef['ds']
    emap = next(e for e in b1.EVENT_MAP if e[0] == ev)
    cand = [{'year': yy, 'gz': b1.year_gz(yy),
             'sg_s': b1.ten_god(ds, b1.year_gz(yy)[0]),
             'sg_b': b1.ten_god(ds, b1.BQ[b1.year_gz(yy)[1]])} for yy in years]
    hits = [c for c in cand if c['sg_s'] in gods or c['sg_b'] in gods]
    hit = hits[0] if hits else cand[0]
    rule = note or emap[3] or emap[2]
    text = (f"【应期 doctrine 样本 B3-{i:02d} · {ev} · {diff}】（合成命主，引擎数据保真）\n"
            f"①排四柱：{ef['pillars']}（日主 {ds}，{'男' if male else '女'}命，{birth} 12时）\n"
            f"②起运：出生后约 {ef['qiyun']}起运\n"
            f"③大运：" + '；'.join(f"{x['start']}年起({x['age']}岁){x['gz']}（{x['sg']}）" for x in ef['dayun'][:8]) + "\n"
            f"④候选年：" + '；'.join(f"{c['year']}={c['gz']}({c['sg_s']}/{c['sg_b']})" for c in cand) + "\n"
            f"⑤事件映射：{ev} → {emap[1]}。判定要点：{emap[2]}\n"
            f"⑥应期判定（{diff}）：{hit['year']} 年 {hit['gz']}（{hit['sg_s']}/{hit['sg_b']}）命中事件十神。{rule}")
    return {'sample_id': f'yingqi-b3-{i:02d}', 'event': ev, 'difficulty': diff,
            'answer_year': hit['year'], 'text': text}

def main():
    conn = sqlite3.connect(DB)
    ing = KBIngestor(conn, batch_size=50)
    n_ok = 0
    with open(OUT, 'w', encoding='utf-8') as f:
        for i, spec in enumerate(B3, 1):
            smp = build(i, spec)
            f.write(json.dumps(smp, ensure_ascii=False) + '\n')
            ok, why = ing.insert(
                entry_id=f"KB-YQ-B3-{i:02d}|bazi|{smp['sample_id']}",
                module='bazi',
                title=f"应期样本B3-{i:02d}·{smp['event']}·{smp['difficulty']}",
                content=smp['text'], category='bazi',
                keywords=f'["应期","样本","{smp["difficulty"]}"]',
                src_id='mingli-yingqi-samples-v3', domain='mingli', trust=0.80,
                source='kimi-distill-yingqi-b3-20261004')
            n_ok += ok
    ing.commit()
    print(f'第三批: {len(B3)} 生成, {n_ok} 入库 -> {OUT}')
    conn.close()

if __name__ == '__main__':
    main()
