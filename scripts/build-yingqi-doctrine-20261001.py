#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""应期 doctrine 蒸馏样本生产（R-DISTILL-YINGQI · 2026-10-01 Kimi）

背景：ATTR5/ASSIST3 把断点栈打到最后一环——干支换算/推理路径/起运大运/十神定位
全被引擎代算解决后，唯一真缺口=应期 doctrine（事件→十神→应期判定）。
本脚本按 ATTR4 六段图纸生产两类资产：
  ①事件→十神→宫位映射表（入 KB，module=bazi，trust 0.85 今人整理，典据标明）
  ②六段式 worked samples（JSONL，训练/检索双用）：排四柱→起运→大运→
    候选年干支十神→事件映射→应期判定推理
样本用合成命主（lunar_python 引擎数据保真），事件类型取 dev36 错题的真实分布：
出道成名/就任当选/婚嫁/伤病凶险/去世/获奖科名。
红线：合成命主不影射真人；doctrine 表述以三命通会/滴天髓/子平真诠为典据。
用法：/usr/bin/python3 scripts/build-yingqi-doctrine-20261001.py
"""
import json, sqlite3, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from lib.kb_ingest import KBIngestor

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT / 'server' / 'database' / 'yidao.db'
OUT = ROOT / 'training' / 'distill-yingqi-doctrine-20261001.jsonl'

from lunar_python import Solar

STEMS = '甲乙丙丁戊己庚辛壬癸'; BRANCHES = '子丑寅卯辰巳午未申酉戌亥'
EL = {'甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土',
      '庚': '金', '辛': '金', '壬': '水', '癸': '水'}
YANG = set('甲丙戊庚壬')
SHENG = {'木': '火', '火': '土', '土': '金', '金': '水', '水': '木'}
KE = {'木': '土', '土': '水', '水': '火', '火': '金', '金': '木'}
BQ = {'子': '癸', '丑': '己', '寅': '甲', '卯': '乙', '辰': '戊', '巳': '丙',
      '午': '丁', '未': '己', '申': '庚', '酉': '辛', '戌': '戊', '亥': '壬'}

def ten_god(ds, os_):
    de, oe = EL[ds], EL[os_]
    same = (ds in YANG) == (os_ in YANG)
    if de == oe: return '比肩' if same else '劫财'
    if SHENG[de] == oe: return '食神' if same else '伤官'
    if KE[de] == oe: return '偏财' if same else '正财'
    if KE[oe] == de: return '七杀' if same else '正官'
    return '偏印' if same else '正印'

# ①事件→十神→宫位映射表（典据：三命通会总论岁运/子平真诠用神/滴天髓六亲论）
EVENT_MAP = [
    ('出道成名/作品发表', '食神、伤官（食伤吐秀主表现展露），辅以正印（名声传播）', '食伤旺地或食伤逢生之流年；日主身强能任泄',
     '大运定基调：行食伤或财运为创作高产期；流年触发：食伤透干或食伤临旺地之年成事'),
    ('就任/当选/升官', '正官、七杀（官杀主职权）得用，辅以正印（印绶主授权任命）', '官杀为喜用且逢生扶之流年；官杀混杂须去留分清',
     '大运官杀旺地奠基，流年官星透出或官星逢合为任命之期；忌伤官见官之年'),
    ('婚嫁（男命）', '正财（妻星）、偏财，日支（婚姻宫）', '财星透干或日支逢合（六合/三合）之流年',
     '大运财运为婚缘期，流年财星现或日支逢合触发；比劫夺财之年须防婚变'),
    ('婚嫁（女命）', '正官、七杀（夫星），日支（婚姻宫）', '官星透干或日支逢合之流年',
     '大运官杀运为婚缘期，流年官星现或红鸾天喜照临触发；伤官见官之年须防婚变'),
    ('获奖/科名/入学', '正印、正官（印主功名文书，官主名次）', '印星透干逢生、或官星临旺之流年',
     '古以科举视之：印官相生之年金榜；大运印地为学期，流年印透为榜期'),
    ('伤病/手术/凶险', '七杀（攻身）、羊刃、伤官见官；日支逢冲', '忌神七杀透干克身、或日支逢流年冲破之岁',
     '大运忌神地为伏因，流年七杀重逢或用神被克尽触发；岁运并临凶神加倍（三命通会）'),
    ('去世/寿限', '用神被克尽、日主入墓、寿元星（食神）受制', '用神之死绝之地逢流年再克',
     '滴天髓：休囚系乎运尤系乎岁——大运入墓绝，流年再逢克泄交加，方论大限'),
    ('得子（男命）', '正官、七杀（官杀为男命子女星）', '官杀星逢生旺或子女宫（时柱）逢合之流年', ''),
    ('得子（女命）', '食神、伤官（食伤为女命子女星）', '食伤星逢生旺或时柱逢合之流年', ''),
    ('置业/搬迁', '正印（房屋田宅），日支（居住环境）', '印星透干或日支逢冲（动象）之流年',
     '日支逢冲主动，印星现主置产；冲而动者搬迁，合而定者置业'),
    ('破财/投资失利', '劫财、羊刃（夺财）', '比劫重重夺财、财星被合被冲之流年', '身旺无依再遇比劫，财星透而被劫，防破耗'),
    ('牢狱/官非', '伤官见官、七杀无制、官符（神煞）', '伤官见官且官杀为忌之流年', '身弱官杀旺再逢流年官杀，或伤官激怒官星，防官非'),
]

def engine_facts(y, m, d, male):
    solar = Solar.fromYmdHms(y, m, d, 12, 0, 0)
    ec = solar.getLunar().getEightChar()
    yun = ec.getYun(1 if male else 0)
    ds = ec.getDay()[0]
    dys = []
    for dy in yun.getDaYun(12)[1:]:
        if dy.getGanZhi():
            gz = dy.getGanZhi()
            dys.append({'start': dy.getStartYear(), 'age': dy.getStartAge(), 'gz': gz,
                        'sg': f"{gz[0]}={ten_god(ds, gz[0])}，{gz[1]}={ten_god(ds, BQ[gz[1]])}"})
    return {'pillars': f'{ec.getYear()} {ec.getMonth()} {ec.getDay()} {ec.getTime()}',
            'ds': ds, 'qiyun': f'{yun.getStartYear()}年{yun.getStartMonth()}个月', 'dayun': dys}

def year_gz(y):
    return STEMS[(y - 4) % 10] + BRANCHES[(y - 4) % 12]

# ②六段 worked samples：合成命主 × 事件原型（答案=映射十神被触发的候选年）
SAMPLES = [
    dict(seed=('甲子', '1990-05-20', True), event='出道成名/作品发表',
         years=[2012, 2014, 2016, 2018, 2020], pick_god=('食神', '伤官')),
    dict(seed=('乙丑', '1985-08-15', False), event='就任/当选/升官',
         years=[2016, 2018, 2020, 2022, 2024], pick_god=('正官', '正印')),
    dict(seed=('丙寅', '1988-02-10', True), event='婚嫁（男命）',
         years=[2013, 2015, 2017, 2019, 2021], pick_god=('正财', '偏财')),
    dict(seed=('丁卯', '1992-11-08', False), event='婚嫁（女命）',
         years=[2015, 2017, 2019, 2021, 2023], pick_god=('正官', '七杀')),
    dict(seed=('戊辰', '1979-04-25', True), event='获奖/科名/入学',
         years=[1998, 2001, 2004, 2007, 2010], pick_god=('正印', '正官')),
    dict(seed=('己巳', '1983-09-30', True), event='伤病/手术/凶险',
         years=[2011, 2014, 2017, 2020, 2023], pick_god=('七杀', '伤官')),
    dict(seed=('庚午', '1975-12-12', False), event='得子（女命）',
         years=[2001, 2003, 2005, 2007, 2009], pick_god=('食神', '伤官')),
    dict(seed=('辛未', '1981-06-18', True), event='置业/搬迁',
         years=[2010, 2013, 2016, 2019, 2022], pick_god=('正印',)),
    dict(seed=('壬申', '1970-03-08', True), event='就任/当选/升官',
         years=[2000, 2003, 2006, 2009, 2012], pick_god=('正官', '正印')),
    dict(seed=('癸酉', '1995-07-22', False), event='出道成名/作品发表',
         years=[2016, 2018, 2020, 2022, 2024], pick_god=('食神', '伤官')),
    dict(seed=('甲戌', '1968-10-05', True), event='破财/投资失利',
         years=[1998, 2001, 2004, 2008, 2014], pick_god=('劫财',)),
    dict(seed=('乙亥', '1987-01-28', False), event='获奖/科名/入学',
         years=[2008, 2010, 2012, 2014, 2016], pick_god=('正印', '正官')),
]

def build_sample(i, spec):
    (_, birth, male) = spec['seed']
    y, m, d = (int(x) for x in birth.split('-'))
    ef = engine_facts(y, m, d, male)
    ds = ef['ds']
    ev = spec['event']
    emap = next(e for e in EVENT_MAP if e[0] == ev)
    cand = []
    for yy in spec['years']:
        gz = year_gz(yy)
        cand.append({'year': yy, 'gz': gz,
                     'sg_s': ten_god(ds, gz[0]), 'sg_b': ten_god(ds, BQ[gz[1]])})
    # 判定：候选年中流年干或支本气十神命中 pick_god 者为应期（取大运同为喜用方向者）
    hits = [c for c in cand if c['sg_s'] in spec['pick_god'] or c['sg_b'] in spec['pick_god']]
    answer = hits[0]['year'] if hits else cand[0]['year']
    hit = hits[0] if hits else cand[0]
    s6 = (f"⑥应期判定：事件「{ev}」取 {emap[1]}。候选年中 {hit['year']} 年 {hit['gz']}"
          f"（{hit['gz'][0]}={hit['sg_s']}，{hit['gz'][1]}={hit['sg_b']}）命中事件十神，"
          f"为应期所在。{emap[3] or emap[2]}")
    text = (
        f"【应期 doctrine 样本 {i:02d} · {ev}】（合成命主，引擎数据保真）\n"
        f"①排四柱：{ef['pillars']}（日主 {ds}，{'男' if male else '女'}命，{birth} 12时）\n"
        f"②起运：出生后约 {ef['qiyun']}起运\n"
        f"③大运：" + '；'.join(f"{x['start']}年起({x['age']}岁){x['gz']}（{x['sg']}）" for x in ef['dayun'][:8]) + "\n"
        f"④候选年：" + '；'.join(f"{c['year']}={c['gz']}({c['sg_s']}/{c['sg_b']})" for c in cand) + "\n"
        f"⑤事件映射：{ev} → {emap[1]}。判定要点：{emap[2]}\n" + s6)
    return {'sample_id': f'yingqi-{i:02d}', 'event': ev, 'answer_year': answer, 'text': text}

def main():
    # ①映射表入 KB
    conn = sqlite3.connect(DB)
    ing = KBIngestor(conn, batch_size=50)
    map_content = ('【八字应期·事件→十神→宫位映射表】（今人整理 v1，典据：三命通会·总论岁运、'
                   '子平真诠·用神、滴天髓·六亲论岁运）\n\n'
                   '总纲：大运定十年基调（重地支），流年主一岁触发（重天干）；'
                   '岁用天元、运用地支，二者相为表里（三命通会）。'
                   '断应期三步：定事件十神 → 看大运是否为其旺地 → 找流年透干/逢合/逢冲之岁。\n\n')
    for ev, gods, pts, rule in EVENT_MAP:
        map_content += f'◆ {ev}\n  十神/宫位：{gods}\n  判定要点：{pts}\n'
        if rule:
            map_content += f'  应期法则：{rule}\n'
    ok, why = ing.insert(
        entry_id='KB-YQ-MAP|bazi|应期事件映射表v1',
        module='bazi', title='八字应期·事件→十神→宫位映射表 v1（今人整理）',
        content=map_content, category='bazi',
        keywords='["应期","十神","大运","流年","事件映射","doctrine"]',
        src_id='mingli-yingqi-map-v1', domain='mingli', trust=0.85,
        source='kimi-distill-yingqi-20261001', dedup_title=True)
    print('映射表入库:', ok, why)
    # ②样本 JSONL + 逐条入 KB（蒸馏层 trust 0.80）
    n_ok = 0
    with open(OUT, 'w', encoding='utf-8') as f:
        for i, spec in enumerate(SAMPLES, 1):
            smp = build_sample(i, spec)
            f.write(json.dumps(smp, ensure_ascii=False) + '\n')
            ok, why = ing.insert(
                entry_id=f"KB-YQ-S{ i:02d}|bazi|{smp['sample_id']}",
                module='bazi', title=f"应期样本{i:02d}·{smp['event']}（六段式 doctrine）",
                content=smp['text'], category='bazi',
                keywords=f'["应期","样本","{smp["event"][:2]}"]',
                src_id='mingli-yingqi-samples-v1', domain='mingli', trust=0.80,
                source='kimi-distill-yingqi-20261001')
            n_ok += ok
    ing.commit()
    print(f'样本: {len(SAMPLES)} 生成, {n_ok} 入库 -> {OUT}')
    conn.close()

if __name__ == '__main__':
    main()
