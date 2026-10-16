#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""backfill-classics-20261016.py — W2-⑤ 厚本七字段批量回填（校勘规范 v2.2）

模板：docs/COLLATION-TEMPLATE-YUXIAJI.md（玉匣记 204 条示范）
红线：只动 category/src_id/keywords/updated_at；title/content/summary 一字不改。
用法：python3 training/backfill-classics-20261016.py [--apply]
"""
import datetime
import re
import sqlite3
import sys

NOW = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
APPLY = '--apply' in sys.argv
FROM = int(sys.argv[sys.argv.index('--from') + 1]) if '--from' in sys.argv else 0
TO = int(sys.argv[sys.argv.index('--to') + 1]) if '--to' in sys.argv else 999

# ── 场景映射（机械题录匹配，不涉断语）──
ZERI_SCENES = [
    ('嫁娶|娶送|納婿|冠筓|合帳|安床|翁姑|婚姻', '婚嫁'),
    ('入宅|蓋屋|修造|動土|上樑|平基|定磉|開鑿|穿井|作灶|作廁|門光|营建', '营建'),
    ('安葬|殯葬|乘凶|除靈|葬', '葬事'),
    ('出行|行船|入山|遠回', '出行'),
    ('開張|立契|出財|買田|買牛|買馬|買豬|納奴|納貓|收蜂|抱雞|造倉|起缸|造曲|安機|耕種|蠶官|求財|開市', '产业'),
    ('祈祀|禳解|禳鎮|禳造|進表|許真|法師|鎮諸怪|祭祀', '祈禳'),
    ('上官|襲爵|臨政|應試|入學|分家|分房|寫真|赴任', '人事'),
    ('占|神號|春牛|芒神|策牛|天文|鴉鳴|鵲噪', '占候'),
    ('太歲|年神|月忌|楊公|天赦|天德|四離|十惡|彭祖|黃黑|九星|三元|洛書|金符|力士|火星|天狗|太白|大遊|飛宮|鶴神|龍神|財神|喜神|人神|伏斷|上朔|上兀|九土|劫|神煞|值日|建除|黄道|黑道', '神煞宜忌'),
    ('治酸|合藥|看病|看陽|子息|小兒|男女|女命|男命|養浴|醫', '医药子息')]
BAZI_SCENES = [
    ('格局|月令|用神|相神|成格|敗格|救應', '格局'),
    ('調候|寒暖|燥濕|十干配|十二月|正月|二月|三月|四月|五月|六月|七月|八月|九月|十月|冬月|臘月', '调候'),
    ('正官|七殺|正財|偏財|正印|偏印|食神|傷官|比肩|劫財|十神', '十神'),
    ('神煞|貴人|驛馬|桃花|空亡|羊刃|魁罡|金神|天乙', '神煞'),
    ('六親|父母|兄弟|妻財|子孫|官鬼|子息|婚姻|女命|男命', '六亲人事'),
    ('歲運|大運|流年|小運|命宮|胎元|納音', '岁运'),
    ('論命|看命|批命|命例|造|貴賤|貧富|壽夭|性情|疾病|功名|科甲', '论命占验')]
YIZHAN_SCENES = [
    ('占斷|占法|斷易|黃金策|總斷', '占断'),
    ('用神|世應|原神|忌神|仇神|飛伏|進退|反吟|伏吟', '用神世应'),
    ('六親|六神|朱雀|青龍|白虎|玄武|勾陳|螣蛇', '六亲六神'),
    ('應期|旬空|月破|日辰|月建|暗動|獨發|六合|六沖|三合|三刑', '应期生克'),
    ('婚姻|求財|疾病|行人|官訟|失物|科舉|天時|宅舍|墳墓|胎產|出行|盜賊', '占类')]
LIUREN_SCENES = [
    ('課經|課體|元首|重審|涉害|遙克|昴星|別責|八專|伏吟|返吟', '课体'),
    ('天將|貴人|螣蛇|朱雀|六合|勾陳|青龍|天空|白虎|太常|玄武|太陰|天后|十二天將', '天将'),
    ('月將|神將|天乙|遁干|年命|行年', '神将'),
    ('天時|婚姻|胎產|疾病|出行|行人|求財|官訟|詞訟|失盜|逃亡|功名|科第|宅舍|墳墓|謁貴|交易|農桑|六畜', '占类')]
YANGZHAI_SCENES = [
    ('龍|穴|砂|水|向|山|形勢|來脈|明堂|水口', '形势'),
    ('門|主|灶|井|廁|路|房|床|宅命|東西四宅|遊年|大游年', '阳宅格局'),
    ('九星|貪狼|巨門|祿存|文曲|廉貞|武曲|破軍|輔弼|紫白|三元', '理气九星'),
    ('宜|忌|吉|凶|斷|訣|歌|賦|圖|起例|修造|遷移|擇日', '宜忌诀法')]
SUANSHU_SCENES = [
    ('河圖|洛書|先天|後天|卦數|策數|大衍|元會運世|皇極', '河洛象数'),
    ('太玄|三方|九州|二十七部|八十一家|七百二十九贊', '太玄'),
    ('起例|歌訣|斷|吉凶|占', '占断诀法')]
YIJING_SCENES = [
    ('卦辭|爻辭|彖|象|文言|繫辭|說卦|序卦|雜卦', '经传'),
    ('注|疏|正義|集解|正義曰|疏]', '古注'),
    ('林辭|之|變卦|互卦', '林辞变占')]
XIANGSHU_SCENES = [
    ('面相|五官|十二宮|氣色|紋|痣|骨|形|神|聲|手相|身相', '相法部位'),
    ('斷|訣|歌|賦|論', '断诀')]
WUXING_SCENES = [
    ('五行|五材|五德|相生|相剋|休王|旺相|十二支|天干|納音', '五行生克'),
    ('論|篇|章|卷', '理论')]

# ── 书目配置：(典籍名, 门类标签, WHERE SQL 片段, 参数, 场景映射, 附加标签, src_id) ─
BOOKS = [
    ('协纪辨方书', '择日', "category='协纪辨方书'", (), ZERI_SCENES, ['钦定'], 'xieji-bianfangshu'),
    ('六壬大全', '三式', "category='六壬大全'", (), LIUREN_SCENES, ['四库本'], 'liuren-daquan'),
    ('焦氏易林', '易卦', "category='焦氏易林'", (), YIJING_SCENES, ['林辞'], 'jiaoshi-yilin'),
    ('渊海子平', '八字', "category='渊海子平'", (), BAZI_SCENES, ['子平'], 'yuanhai-ziping'),
    ('穷通宝鉴', '八字', "category='穷通宝鉴'", (), BAZI_SCENES, ['调候', '栏江网'], 'qiongtong-baojian'),
    ('三命通会', '八字', "category='三命通会'", (), BAZI_SCENES, ['四库本', '万民英'], 'sanming-tonghui'),
    ('子平真诠', '八字', "category IN ('ziping-zhenquan-yb','ziping-zhenquan-pz')", (), BAZI_SCENES, ['沈孝瞻', '格局'], 'ziping-zhenquan'),
    ('滴天髓阐微', '八字', "category='ditiansui-chanwei'", (), BAZI_SCENES, ['任铁樵', '通神论'], 'ditiansui-chanwei'),
    ('神峰通考', '八字', "category='shenfeng-tongkao'", (), BAZI_SCENES, ['病药', '张楠'], 'shenfeng-tongkao'),
    ('千里命稿', '八字', "category='qianli-minggao'", (), BAZI_SCENES, ['韦千里', '命例'], 'qianli-minggao'),
    ('周易集解', '易卦', "category='周易集解'", (), YIJING_SCENES, ['李鼎祚'], 'zhouyi-jijie'),
    ('周易註疏', '易卦', "category='yijing' AND title LIKE '原典·周易註疏%'", (), YIJING_SCENES, ['王弼韩康伯注', '孔颖达疏'], 'zhouyi-zhushu'),
    ('卜筮正宗', '易卦', "category='卜筮正宗'", (), YIZHAN_SCENES, ['王洪绪', '纳甲'], 'bushi-zhengzong'),
    ('增删卜易', '易卦', "category='增删卜易'", (), YIZHAN_SCENES, ['野鹤老人', '占断'], 'zengshan-buyi'),
    ('河洛理数', '数字术数', "category='河洛理数'", (), SUANSHU_SCENES, ['陈抟', '邵雍'], 'heluo-lishu'),
    ('太玄经', '数字术数', "category IN ('kanripo16-taixuan','shuzi','jizhu-taixuanjing')", (), SUANSHU_SCENES, ['扬雄'], 'taixuan-jing'),
    ('皇极经世书', '数字术数', "category='kanripo15-huangji'", (), SUANSHU_SCENES, ['邵雍', '元会运世'], 'huangji-jingshi'),
    ('星平会海', '八字', "category='星平会海'", (), BAZI_SCENES, ['星命', '子平'], 'xingping-huihai'),
    ('水镜集', '相术', "category='水镜集'", (), XIANGSHU_SCENES, ['范騋', '右髻道人'], 'shuijing-ji'),
    ('阳宅三要', '阳宅', "category='阳宅三要'", (), YANGZHAI_SCENES, ['赵九峰', '门主灶'], 'yangzhai-sanyao'),
    ('八宅明镜', '阳宅', "category='八宅明镜'", (), YANGZHAI_SCENES, ['八宅', '游年'], 'bazhai-mingjing'),
    ('三白宝海', '阳宅', "category='三白宝海'", (), YANGZHAI_SCENES, ['三元紫白', '幕讲禅师'], 'sanbai-baohai'),
    ('人子须知', '阳宅', "category='人子须知'", (), YANGZHAI_SCENES, ['徐善继', '形法'], 'renzi-xuzhi'),
    ('黄帝宅经', '阳宅', "category IN ('zhaijing-shang','zhaijing-xia','黄帝宅经')", (), YANGZHAI_SCENES, ['宅经'], 'huangdi-zhaijing'),
    ('五行大义', '八字', "category='五行大义'", (), WUXING_SCENES, ['萧吉'], 'wuxing-dayi'),
    ('阳宅十书', '阳宅', "category='阳宅十书'", (), YANGZHAI_SCENES, ['王君荣'], 'yangzhai-shishu'),
]


def yi_ji_type(title, domain_tag):
    """宜忌分型（仅择日域）"""
    if domain_tag != '择日':
        return None
    if '吉日' in title or '宜' in title:
        return '吉日'
    if '忌' in title or '凶' in title:
        return '忌日'
    if title.startswith('占'):
        return '占法'
    return '宜忌'


def split_kw(kw):
    """keywords 两种历史格式（空格/逗号分隔）统一拆分"""
    return [k for k in re.split(r'[\s,，]+', kw or '') if k]


con = sqlite3.connect('server/database/yidao.db', timeout=120)
cur = con.cursor()
grand = 0
for bi, (book, dtag, where, params, scenes, extra, src) in enumerate(BOOKS):
    if not (FROM <= bi <= TO):
        continue
    rows = cur.execute(
        "SELECT entry_id, title, keywords FROM kb_formal WHERE %s" % where, params).fetchall()
    n = 0
    for eid, title, kw in rows:
        t = title or ''
        tags = set()
        for pat, sc in scenes:
            if re.search(pat, t):
                tags.add(sc)
        add = [book, dtag, '古籍原文'] + extra + sorted(tags)
        yi = yi_ji_type(t, dtag)
        if yi:
            add.append(yi)
        kws = split_kw(kw)
        before = len(kws)
        for a_ in add:
            if a_ not in kws:
                kws.append(a_)
        cur.execute(
            "UPDATE kb_formal SET category=?, src_id=COALESCE(NULLIF(src_id,''),?), keywords=?, updated_at=? WHERE entry_id=?",
            (book, src, ' '.join(kws), NOW, eid))
        n += 1
    grand += n
    print('%-10s %-6s 命中 %4d 条 %s' % (book, dtag, n, '' if APPLY else '（dry-run 未落库）'), flush=True)
if APPLY:
    con.commit()
    print('已提交。总计 %d 条' % grand)
else:
    con.rollback()
    print('DRY-RUN：未写库。加 --apply 落库。总计 %d 条' % grand)
con.close()
