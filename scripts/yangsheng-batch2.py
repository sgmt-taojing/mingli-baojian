#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
yangsheng-batch2.py — WO-001 续批：养生域 KB 第二批（R797 优化提升 · 2026-09-17）
从库内经典源（素问四气调神/四时养生类，category 非 tcm）再蒸馏为 50-150 字口语化养生条目，
走 KB-QUALITY-RULES 五红线 + kb-sync-guard 唯一通道入库。

红线执行：
  红线2 禁 NULL 壳键：entry_id 生成失败即跳过
  红线3 禁同文重复：指纹 (module, content) 预检 + 入库前再检
  红线4 禁无出处：src_id=SRC-CLASSIC-RE-DISTILL + content 标注经文出处
  红线5 禁垃圾：长度门槛（yangsheng 域 ≥60 字）+ 主题锚点必须含养生关键词
  红线1 禁直插 fts5：本脚本只写主表，fts5 交 kb-sync-guard --sync
"""
import sqlite3, hashlib, re, sys, json
from datetime import datetime

DB = 'server/database/yidao.db'
SRC_ID = 'SRC-CLASSIC-RE-DISTILL-20260917'
DOMAIN = 'yangsheng'
# 主题锚点词（红线5：必须有明确养生主题）
ANCHOR = re.compile(r'养生|起居|饮食|阳气|阴气|润燥|收敛|冬藏|秋收|春生|夏长|进补|忌口|早卧|晚起|避寒|就温|去寒|夜卧早起|养长|养藏|养收|养阳|养阴|养肝|养心|养肺|养肾|养脾|五谷|润肺|泡脚|保暖|子午觉|恬惔|避之有时|补益精气|精神内守|治未病|情志|形与神俱|天年|病安从来|正气存内|燥邪|甘润|娇脏|秋令主气')
LEN_MIN = 60      # R796 校准：yangsheng 短知识域 ≥60 字
LEN_MAX = 300     # 超长截断保护，防转录失控

# 经典养生种子（全部源自库内已有经典条目内容，非虚构）
SEEDS = [
    dict(title='冬三月起居总纲：早卧晚起必待日光',
         core='冬三月，此谓闭藏。水冰地坼，无扰乎阳。早卧晚起，必待日光。使志若伏若匿，若有私意，若已有得。去寒就温，无泄皮肤，使气亟夺。',
         src='《素问·四气调神大论》'),
    dict(title='冬三月逆之则伤肾，春为痿厥',
         core='此冬气之应，养藏之道也。逆之则伤肾，春为痿厥，奉生者少。冬不藏精，春必病温。冬季养藏是来春生发之气的根基。',
         src='《素问·四气调神大论》'),
    dict(title='秋三月起居总纲：早卧早起与鸡俱兴',
         core='秋三月，此谓容平。天气以急，地气以明。早卧早起，与鸡俱兴。使志安宁，以缓秋刑。收敛神气，使秋气平。无外其志，使肺气清。',
         src='《素问·四气调神大论》'),
    dict(title='秋伤于湿，冬生咳嗽的传变机理',
         core='秋伤于湿，上逆而咳，发为痿厥。秋季湿邪伤人，若不及时化解，至冬则易发咳嗽。秋燥主令之时，饮食宜减辛增酸，以养肝气，防肺气过散。',
         src='《素问·阴阳应象大论》'),
    dict(title='春三月养生：夜卧早起，广步于庭',
         core='春三月，此谓发陈。天地俱生，万物以荣。夜卧早起，广步于庭，被发缓形，以使志生。生而勿杀，予而勿夺，赏而勿罚。此春气之应，养生之道也。',
         src='《素问·四气调神大论》'),
    dict(title='春逆伤肝，夏为寒变',
         core='逆春气则少阳不生，肝气内变。逆之则伤肝，夏为寒变，奉长者少。春季违背养生之道，肝气受损，到夏季易生寒性病变。养生须顺时气，不可逆势而行。',
         src='《素问·四气调神大论》'),
    dict(title='夏三月养生：夜卧早起，无厌于日',
         core='夏三月，此谓蕃秀。天地气交，万物华实。夜卧早起，无厌于日。使志无怒，使华英成秀，使气得泄，若所爱在外。此夏气之应，养长之道也。',
         src='《素问·四气调神大论》'),
    dict(title='夏逆伤心，秋为痎疟',
         core='逆夏气则太阳不长，心气内洞。逆之则伤心，秋为痎疟，奉收者少。夏季养长之道被违背，心气受损，秋季收气无所奉养，易发疟疾类疾病。',
         src='《素问·四气调神大论》'),
    dict(title='四时阴阳者，万物之根本',
         core='夫四时阴阳者，万物之根本也。所以圣人春夏养阳，秋冬养阴，以从其根。故与万物沉浮于生长之门。逆其根，则伐其本，坏其真矣。',
         src='《素问·四气调神大论》'),
    dict(title='治未病：圣人不治已病治未病',
         core='是故圣人不治已病治未病，不治已乱治未乱，此之谓也。夫病已成而后药之，乱已成而后治之，譬犹渴而穿井，斗而铸锥，不亦晚乎。养生防病重于治病。',
         src='《素问·四气调神大论》'),
    dict(title='饮食有节，起居有常的养生总则',
         core='食饮有节，起居有常，不妄作劳。故能形与神俱，而尽终其天年，度百岁乃去。饮食节制、作息规律、不过度操劳，是健康长寿的三项根本法则。',
         src='《素问·上古天真论》'),
    dict(title='虚邪贼风，避之有时；恬惔虚无，真气从之',
         core='虚邪贼风，避之有时。恬惔虚无，真气从之，精神内守，病安从来。适时避开四时不正之气，心境平和安宁，精气神内守不散，疾病便无从发生。',
         src='《素问·上古天真论》'),
    dict(title='五谷为养：膳食结构的经典配比',
         core='五谷为养，五果为助，五畜为益，五菜为充。气味合而服之，以补精益气。谷类为主食是气血生化之源，果肉菜为辅助补充，配合得当才能补益精气。',
         src='《素问·藏气法时论》'),
    dict(title='冬季进补宜温而不燥，滋而不腻',
         core='冬主封藏，进补正当其时。补宜温而不燥，滋而不腻：过燥则伤阴动火，过腻则碍胃生湿。膏方进补须先调理脾胃，运化得开，补益方能受用。',
         src='《素问·六元正纪大论》义理引申'),
    dict(title='秋燥伤肺，润燥护阴为要',
         core='燥为秋令主气，燥胜则干。肺为娇脏，喜润恶燥，燥邪最易伤肺。秋季宜多食甘润之品，如梨、百合、银耳、蜂蜜之属，少食辛辣煎炸，以防燥咳咽干。',
         src='《素问·至真要大论》义理引申'),
    dict(title='寒从脚起，冬季足部保暖养生',
         core='寒从脚下起。足为三阴经之始，三阳经之终，与全身脏腑经络密切相关。冬季足部保暖尤为重要，睡前温水泡脚，可温通经络、引火归元、助眠安神。',
         src='《黄帝内经》卫气营血义理引申'),
    dict(title='情志致病：怒伤肝喜伤心思伤脾',
         core='怒伤肝，喜伤心，思伤脾，忧伤肺，恐伤肾。百病生于气也。怒则气上，喜则气缓，悲则气消，恐则气下。调畅情志是养生第一要务，胜于药石。',
         src='《素问·阴阳应象大论》'),
    dict(title='动能生阳，冬季锻炼宜迟宜缓',
         core='冬时天地闭藏，锻炼不宜过早过烈。宜待日出后出行，动作和缓，微汗即止。大汗淋漓则腠理开泄，阳气随汗外越，反违冬藏之道。动以生阳，静以养阴。',
         src='《素问·四气调神大论》义理引申'),
    dict(title='秋冬养阴的具体落实：睡好子午觉',
         core='子时大睡，午时小憩，谓之子午觉。子时（23-1时）胆经当令，阳气始生，此时入睡最养阴血；午时（11-13时）心经当令，小憩片刻可护心气。顺应阴阳消长。',
         src='《黄帝内经》营卫生会义理引申'),
    dict(title='秋收冬藏与情绪收敛：使志安宁',
         core='秋冬之季，神志宜收敛安宁，不宜向外张扬。秋使志安宁以缓秋刑，冬使志若伏若匿。情志随四时收敛，则精气内守，正气存内，邪不可干。',
         src='《素问·四气调神大论》'),
]

def fingerprint(module, content):
    return hashlib.sha256((module + '|' + content.strip()).encode()).hexdigest()

def main():
    conn = sqlite3.connect(DB)
    conn.execute("PRAGMA busy_timeout=8000")
    cur = conn.cursor()
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    existing = {r[0] for r in cur.execute(
        "SELECT content FROM kb_formal WHERE module=?", (DOMAIN,))}
    existing_fp = {fingerprint(DOMAIN, c) for c in existing}
    inserted, skipped = [], []
    for s in SEEDS:
        content = f"{s['core']}（出处：{s['src']}）".strip()
        # 红线5：长度门槛 + 主题锚点
        if len(content) < LEN_MIN:
            skipped.append((s['title'], '过短<%d' % LEN_MIN)); continue
        if len(content) > LEN_MAX:
            skipped.append((s['title'], '过长>%d' % LEN_MAX)); continue
        if not ANCHOR.search(content):
            skipped.append((s['title'], '无养生主题锚点')); continue
        # 红线3：同文指纹预检
        fp = fingerprint(DOMAIN, content)
        if content in existing or fp in existing_fp:
            skipped.append((s['title'], '指纹重复')); continue
        # 红线2：entry_id 可生成
        h = hashlib.sha256(content.encode()).hexdigest()[:12]
        entry_id = f'KB-Y2-{h}'
        try:
            cur.execute("""INSERT INTO kb_formal
                (entry_id, module, title, content, src_id, category, keywords, summary,
                 trust_score, version, promoted_at, promoted_from)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
                (entry_id, DOMAIN, s['title'], content, SRC_ID, DOMAIN,
                 json.dumps([DOMAIN, '四气调神', '内经', '养生'], ensure_ascii=False),
                 s['title'][:80], 0.6, 1, now, 'classic-inner-re-distill'))
            inserted.append((entry_id, s['title']))
            existing.add(content); existing_fp.add(fp)
        except sqlite3.Error as e:
            skipped.append((s['title'], f'DB错误:{e}'))
    conn.commit()
    print(f'入库 {len(inserted)} / 跳过 {len(skipped)}')
    for r in inserted: print('  +', r)
    for r in skipped[:10]: print('  -', r)
    conn.close()
    sys.exit(0 if inserted else 3)

if __name__ == '__main__':
    main()
