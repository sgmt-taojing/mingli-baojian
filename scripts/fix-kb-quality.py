#!/usr/bin/env python3

# ═══ LEGACY-INGEST-GUARD (R-INGEST-SPEC-20260927) ═══
# 本脚本为一次性历史批次脚本，入库口径已过时（无 fingerprint幂等/status='formal'/domain 新规范）。
# 新入库请使用 scripts/lib/kb_ingest.py；抓取请用改造后的 fetch-classics-kanripo.py / fetch-classics-wikisource.py。
# 确需原样重跑（极少数修复场景）：ALLOW_LEGACY_INGEST=1 python3 <本脚本>
import os as _lg_os, sys as _lg_sys
if _lg_os.environ.get('ALLOW_LEGACY_INGEST') != '1':
    _lg_sys.stderr.write('⛔ 旧口径入库脚本已禁用（R-INGEST-SPEC-20260927 防 KB 污染）。新口径见 scripts/lib/kb_ingest.py；确需重跑请设 ALLOW_LEGACY_INGEST=1\n')
    _lg_sys.exit(2)
# ═══ END GUARD ═══

"""KB 质量修复脚本 R365 — 修复空条目 + 补充缺失模块"""
import sqlite3, sys, os

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'server', 'database', 'yidao.db')

def fix_tianji_jiangjie(cur):
    """修复19条拼音截断的空条目"""
    fixes = {
        'tianji-jiangjie-feng-s%zhai': ('天纪·阳宅风水（八宅法）', '八宅法将住宅分为东四宅与西四宅，各有四吉四凶方位。东四命配东四宅，西四命配西四宅。'),
        'tianji-jiangjie-feng-shui-men-chuang': ('天纪·风水门窗要诀', '大门为气口，主纳气，宜明亮通畅。床位不压梁、不对门、不靠空。'),
        'tianji-jiangjie-mingli-da-yun': ('天纪·命理大运', '大运十年一运，从月柱起算。流年一年一运，以年柱定。大运看趋势，流年看应期。'),
        'tianji-jiangjie-mingli-yong-shen': ('天纪·命理用神', '取用神三法：扶抑、调候、专旺。用神为命局枢纽，定喜忌方向。'),
        'tianji-jiangjie-mingli-fei-xing': ('天纪·命理四化飞星', '化禄、化权、化科、化忌为四化飞星。禄随忌走。'),
        'tianji-jiangjie-mingli-sheng-xiao': ('天纪·命理生肖', '十二地支配生肖。生肖用于合婚、流年关系推断。'),
        'tianji-jiangjie-mingli-fu-yin': ('天纪·命理伏吟返吟', '伏吟主反复、停滞。反吟主反复折腾。两者均需外力冲破。'),
        'tianji-jiangjie-yuce-ji-zhu': ('天纪·预测·大六壬', '大六壬以天盘地盘重合推演，十二天将各司其职。'),
        'tianji-jiangjie-yuce-mei-hua': ('天纪·预测·梅花易数', '梅花易数万物皆数，以体用论为核心。'),
        'tianji-jiangjie-mian-xiang-guan-wei': ('天纪·面相·五官', '五官对应五脏：眼睛主肝、鼻子主肺、耳朵主肾、口舌主脾胃。'),
        'tianji-jiangjie-shou-xiang': ('天纪·手相·八卦丘', '手掌分八丘，各对应人事吉凶。'),
        'tianji-jiangjie-xing-ming-pai': ('天纪·姓名学·五格', '姓名学五格：天格、人格、地格、总格、外格。'),
        'tianji-jiangjie-yi-zhi-yuan': ('天纪·易之渊源', '河图洛书为易经之母。先天八卦体，后天八卦用。'),
        'tianji-jiangjie-yi-zi-shu': ('天纪·易之三义', '易有三义：变易、不易、简易。'),
        'tianji-jiangjie-zong-jie': ('天纪·总结·三才合一', '天、地、人三才合一。三者协调则事事顺遂。'),
        'tianji-jiangjie-yu-ren': ('天纪·观人术', '君子坦荡荡，小人长戚戚。'),
        'tianji-jiangjie-tian-ren-he-yi': ('天纪·天人合一', '天地人三才顺应自然。形神共养，性命双修。'),
        'tianji-jiangjie-yi-li-jing-ji': ('天纪·易理精义', '每卦六爻分三才：初二爻为地、三四爻为人、五上爻为天。'),
        'tianji-jiangjie-yi-jing-yi-sheng': ('天纪·易医同源', '阴阳同出于易。五行对应中医藏象。八卦配脏腑。'),
    }
    fixed = 0
    for pattern, (title, content) in fixes.items():
        if '%' in pattern:
            cur.execute("UPDATE kb_formal SET title=?, content=? WHERE entry_id LIKE ?", (title, content, pattern))
        else:
            cur.execute("UPDATE kb_formal SET title=?, content=? WHERE entry_id=?", (title, content, pattern))
        fixed += cur.rowcount
    return fixed

def add_missing_entries(cur):
    """补充六爻/梅花/起名/合婚缺失条目"""
    entries = [
        # 六爻 +10
        ('liuyao', '六爻·用神旺衰判断', '六爻', '用神旺衰看月令日辰。月建为万卜之提纲，日辰为六爻之主宰。', 'liuyao 用神 旺衰', 0.9),
        ('liuyao', '六爻·忌神与仇神', '六爻', '忌神为克用神之爻，仇神为生忌神之爻。', 'liuyao 忌神 仇神', 0.9),
        ('liuyao', '六爻·旬空与应期', '六爻', '旬空用神暂时无力，待冲空或填实之期应事。', 'liuyao 旬空 应期', 0.9),
        ('liuyao', '六爻·六冲六合卦', '六爻', '六冲卦主散主变，六合卦主合主聚。', 'liuyao 六冲 六合', 0.9),
        ('liuyao', '六爻·动爻变化吉凶', '六爻', '动爻化进神为吉，化退神为凶，化空为落空。', 'liuyao 动爻 化进 化退', 0.9),
        ('liuyao', '六爻·世应关系', '六爻', '世爻为自己，应爻为对方。世应相生则和，相克则争。', 'liuyao 世爻 应爻', 0.9),
        ('liuyao', '六爻·墓库与三合局', '六爻', '墓库为辰戌丑未，用神入墓则事停滞。三合局力量大增。', 'liuyao 墓库 三合局', 0.9),
        ('liuyao', '六爻·六亲取用详解', '六爻', '六亲：父母、兄弟、子孙、妻财、官鬼。各有所主。', 'liuyao 六亲', 0.9),
        ('liuyao', '六爻·断卦步骤', '六爻', '断卦七步：审卦→世应→用神→旺衰→忌原→动爻→应期。', 'liuyao 断卦 步骤', 0.9),
        ('liuyao', '六爻·反复测卦原则', '六爻', '初筮告，再三渎。同一事以第一卦为准。', 'liuyao 初筮 反复', 0.9),
        # 梅花 +10
        ('meihua', '梅花·体用生克关系详解', '梅花', '体卦为自身，用卦为外部。用生体吉，用克体凶。', 'meihua 体用 生克', 0.9),
        ('meihua', '梅花·互卦断中间过程', '梅花', '互卦看事情发展中间阶段。互卦生体则中途有助。', 'meihua 互卦 中间', 0.9),
        ('meihua', '梅花·变卦看结果', '梅花', '变卦为最终结果。变卦生体则结局好。', 'meihua 变卦 结果', 0.9),
        ('meihua', '梅花·八卦万物类象', '梅花', '乾为天为父为刚健，坤为地为母为柔顺。', 'meihua 八卦 类象', 0.9),
        ('meihua', '梅花·八卦五行旺衰', '梅花', '八卦五行：乾兑金、震巽木、坎水、离火、坤艮土。', 'meihua 八卦 五行 旺衰', 0.9),
        ('meihua', '梅花·起卦方法汇总', '梅花', '梅花起卦法：时间、数字、方位、声音、颜色、字数。', 'meihua 起卦 方法', 0.9),
        ('meihua', '梅花·断卦总则', '梅花', '断卦四步：体用→旺衰→互卦→变卦。', 'meihua 断卦 总则', 0.9),
        ('meihua', '梅花·应期判断', '梅花', '应期看卦气旺衰。体卦旺则应速。', 'meihua 应期 卦气', 0.9),
        ('meihua', '梅花·卦气与旺衰', '梅花', '卦气以月令为纲。旺相休囚死五档定强弱。', 'meihua 卦气 旺相休囚死', 0.9),
        ('meihua', '梅花·多爻动断法', '梅花', '多爻动以全卦变卦断。动爻多则变化大。', 'meihua 动爻 多爻', 0.9),
        # 起名 +5
        ('naming', '起名·五格剖象法基础', '起名', '五格：天格、人格、地格、总格、外格。81数理吉凶判断。', 'naming 五格 数理', 0.9),
        ('naming', '起名·八字用神配合', '起名', '起名需配合八字用神。五行缺补。', 'naming 八字 用神 五行', 0.9),
        ('naming', '起名·三才五格配置', '起名', '三才指天格、人格、地格五行配置。相生为吉。', 'naming 三才 配置', 0.9),
        ('naming', '起名·音韵字形禁忌', '起名', '避免生僻字、谐音不雅、笔画过多。', 'naming 禁忌 谐音', 0.9),
        ('naming', '起名·生肖喜忌用字', '起名', '生肖用字喜忌各不同。', 'naming 生肖 喜忌', 0.9),
        # 合婚 +5
        ('hehun', '合婚·八字合婚原则', '合婚', '八字合婚看五项：生肖、日柱、五行、用神、大运。', 'hehun 八字 生肖 日柱', 0.9),
        ('hehun', '合婚·生肖配对吉凶', '合婚', '六合三合为吉，六冲为忌。', 'hehun 生肖 六合 三合 六冲', 0.9),
        ('hehun', '合婚·日柱关系', '合婚', '日柱天合地合为上婚。', 'hehun 日柱 天合 地合', 0.9),
        ('hehun', '合婚·五行互补判断', '合婚', '五行互补：一方缺者另一方有之。', 'hehun 五行 互补', 0.9),
        ('hehun', '合婚·紫微合盘要点', '合婚', '紫微合盘看命宫、夫妻宫、大限、福德。', 'hehun 紫微 合盘', 0.9),
    ]
    inserted = 0
    for module, title, category, content, keywords, trust in entries:
        eid = f"{module}-kb-fix-{inserted+1}"
        try:
            cur.execute("SELECT 1 FROM kb_formal WHERE entry_id=?", (eid,))
            if cur.fetchone():
                continue
            cur.execute("""INSERT INTO kb_formal (entry_id, module, title, content, category, keywords, trust_score, status, audit_status, hit_count)
                           VALUES(?,?,?,?,?,?,?, 'active','approved',0)""", (eid, module, title, content, category, keywords, trust))
            inserted += 1
        except Exception as e:
            print(f"  跳过 {eid}: {e}")
    return inserted

def sync_fts5(cur):
    """同步 FTS5 索引"""
    cur.execute("""SELECT entry_id, module, title, content, keywords, category FROM kb_formal 
                   WHERE content IS NOT NULL AND length(content) >= 20 
                   AND entry_id NOT IN (SELECT entry_id FROM kb_fts5)""")
    missing = cur.fetchall()
    for eid, mod, title, content, kw, cat in missing:
        cur.execute("INSERT INTO kb_fts5(entry_id, module, title, content, keywords, category) VALUES(?,?,?,?,?,?)",
                    (eid, mod, title or '', content or '', kw or '', cat or ''))
    return len(missing)

if __name__ == '__main__':
    db = sqlite3.connect(DB_PATH)
    cur = db.cursor()
    fixed_tj = fix_tianji_jiangjie(cur)
    fixed_sn = fix_shennong_bencao(cur)
    deleted = cleanup_garbage(cur)
    added = add_missing_entries(cur)
    synced = sync_fts5(cur)
    db.commit()
    print(f"修复 tianji: {fixed_tj}")
    print(f"修复 shennong: {fixed_sn}")
    print(f"删除垃圾: {deleted}")
    print(f"新增条目: {added}")
    print(f"FTS5 同步: {synced}")
    cur.execute("SELECT COUNT(*) FROM kb_formal WHERE content IS NULL OR content = '' OR length(content) < 20")
    print(f"剩余空条目: {cur.fetchone()[0]}")
    db.close()

def fix_shennong_bencao(cur):
    """修复11条神农本草拼音截断条目"""
    fixes = {
        'shennong-bencao-bai-zhu': ('神农本草·白术', '白术，上品，苦甘温，归脾胃经。健脾燥湿要药。'),
        'shennong-bencao-huang-qi': ('神农本草·黄芪', '黄芪，上品，甘微温，归脾肺经。补气固表要药。'),
        'shennong-bencao-sheng-jiang': ('神农本草·生姜', '生姜，中品，辛微温，归肺脾胃经。呕家圣药。'),
        'shennong-bencao-fu-zi-pai-yao': ('神农本草·附子配伍', '附子配伍七法：附子+干姜+甘草为四逆汤。'),
        'shennong-bencao-duyao-guan-li': ('神农本草·毒药管理', '十种炮制法：先煎、后下、包煎、另煎、烊化、冲服。'),
        'shennong-bencao-shi-bing-ji': ('神农本草·十剂', '十剂：宣、通、补、泻、轻、重、滑、涩、燥、湿。'),
        'shennong-bencao-yong-yao-fa-ze': ('神农本草·用药法则', '辨证论治，配伍宜忌。十八反十九畏。'),
        'shennong-bencao-si-qi-lun-yong': ('神农本草·四气论用', '四气：寒热温凉。疗寒以热药，疗热以寒药。'),
        'shennong-bencao-yin-shu-li': ('神农本草·本草纲目', '本草纲目载药1892种，分16部60类。'),
        'shennong-bencao-dang-dai-fa-zhan': ('神农本草·当代发展', '青蒿素获诺贝尔奖。'),
        'shennong-bencao-zong-jie': ('神农本草·总结', '神农本草经为中药学之祖，载药365种。'),
    }
    fixed = 0
    for eid, (title, content) in fixes.items():
        cur.execute("UPDATE kb_formal SET title=?, content=? WHERE entry_id=?", (title, content, eid))
        fixed += cur.rowcount
    return fixed

def cleanup_garbage(cur):
    """删除垃圾条目"""
    cur.execute("""DELETE FROM kb_formal WHERE module IN ('nihaixia-yian', 'tcm-classical')
                   AND (content IS NULL OR content = '' OR length(content) < 5
                        OR content LIKE '%书书书%' OR content LIKE '%SC%Ñ%')""")
    d1 = cur.rowcount
    cur.execute("DELETE FROM kb_formal WHERE entry_id IN ('KB-USER-1784776410514-27ix9n', 'KB-USER-1784779534635-eq74al')")
    d2 = cur.rowcount
    cur.execute("DELETE FROM kb_formal WHERE entry_id = 'tcm-classical-full-1784773829-000370'")
    d3 = cur.rowcount
    return d1 + d2 + d3
