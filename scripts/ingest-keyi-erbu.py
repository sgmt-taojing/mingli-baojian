#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""P5/P11-P15 · 科仪补缺可重入入库：三教源流搜神大全／灵宝领教济度金书。

只写 kb_formal；FTS 统一交 scripts/kb-sync-guard.py 维护。
P14 补齐卷136-140及244-245七十七节；P15 续补卷271、274、316三十四节。
三卷各守独立文字底本，道藏08书影仅作定位与抽核，不冒充全卷逐字校毕。
"""
import datetime
import hashlib
import pathlib
import re
import sqlite3
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
DB = ROOT / 'server/database/yidao.db'
NOW = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
sys.path.insert(0, str(ROOT / 'scripts'))
from yidao_safe import safe_close

JOBS = [
    dict(module='sanjiao-soushen', prefix='SJ', category='科仪', std_group='科仪',
         mds=['corpus/sanjiao-soushen/sanjiao-soushen-transcript.md'], expected=4,
         src='sanjiao-soushen:維基文庫葉德輝翻刻本系統(卷五全文)+書格版本提要',
         src_id='SRC-SANJIAO-SOUSHEN-20261024',
         src_desc='三教源流搜神大全：七卷结构+卷五太岁殷元帅全文+元辰太岁参证',
         display='三教源流搜神大全',
         note='七卷神谱，卷五太岁殷元帅全文+元辰太岁参证4条；余神目与六十元辰全表挂账',
         probes={'overview': '"七卷結構"', 'yin-yuanshuai': '"太歲殷元帥"',
                 'yuanchen-kaozheng': '"王文卿"', 'sources': '"搜神廣記"'}),
    dict(module='jidu-jinshu', prefix='JD', category='科仪', std_group='科仪',
         mds=['corpus/jidu-jinshu/jidu-jinshu-transcript.md',
              'corpus/jidu-jinshu/jidu-jinshu-juan136-transcript.md',
              'corpus/jidu-jinshu/jidu-jinshu-juan137-transcript.md',
              'corpus/jidu-jinshu/jidu-jinshu-juan138-transcript.md',
              'corpus/jidu-jinshu/jidu-jinshu-juan139-transcript.md',
              'corpus/jidu-jinshu/jidu-jinshu-juan140-transcript.md',
              'corpus/jidu-jinshu/jidu-jinshu-juan244-transcript.md',
              'corpus/jidu-jinshu/jidu-jinshu-juan245-transcript.md',
              'corpus/jidu-jinshu/jidu-jinshu-juan271-transcript.md',
              'corpus/jidu-jinshu/jidu-jinshu-juan274-transcript.md',
              'corpus/jidu-jinshu/jidu-jinshu-juan316-transcript.md'], expected=114,
         src='jidu-jinshu:daoinfo提要+道藏目錄詳註+識典DZ0466+古文典籍網+讀點古籍+道藏08書影定位(網絡轉錄)',
         src_id='SRC-JIDU-JINSHU-20261024',
         src_desc='灵宝领教济度金书：书目版本、卷136-140及244-245灯仪醮仪、卷271/274/316符簡文檄正文；各卷独立来源并附道藏书影定位',
         display='灵宝领教济度金书',
         note='宁全真授林灵真编320卷；目录3条+卷136正文14节+卷137正文9节+卷138正文13节+卷139正文12节+卷140正文5节+卷244正文14节+卷245正文10节+卷271正文8节+卷274正文7节+卷316正文19节，共114条；网络转录预留书影逐页校验，其余灯仪醮仪与符檄文檄挂账',
         probes={'overview': '"靈寶東華派"', 'shunxing-zhiyin': '"度星齋"', 'sources': '"涵芬樓"',
                 'juan136-fendeng-kaiyi': '"非陶三景之靈芒"', 'juan136-mingdeng-zhou': '"元始開圖"',
                 'juan136-fendeng-shouyi': '"太上散十方"', 'juan136-beidou-kaiyi': '"圓方剖粹"',
                 'juan136-tanlang': '"北斗延生"', 'juan136-jumen': '"北斗度厄"',
                 'juan136-lucun': '"北斗保命"', 'juan136-wenqu': '"北斗益筭"',
                 'juan136-lianzhen': '"北斗消災"', 'juan136-wuqu': '"北斗扶衰"',
                 'juan136-pojun': '"北斗散禍"', 'juan136-waifu': '"北斗洞明"',
                 'juan136-neibi': '"北斗隱元"', 'juan136-beidou-shouyi': '"祈懺㫖宣於正一"',
                 'juan137-kaiyi': '"慶雲蒙藹"', 'juan137-tianfu': '"南斗司命"',
                 'juan137-tianxiang': '"南斗司録"', 'juan137-tianliang': '"南斗延壽"',
                 'juan137-tiantong': '"南斗益筭"', 'juan137-tianshu': '"南斗度厄天樞尊靈"',
                 'juan137-tianji': '"南斗上生"', 'juan137-dazhou': '"南斗火宫"',
                 'juan137-shouyi': '"圓十三義象之經營"',
                 'juan138-kaiyi': '"司天符而定十一之數"', 'juan138-taiyang': '"東望扶桑宫"',
                 'juan138-taiyin': '"仰望顧八表"', 'juan138-suixing': '"歲星乘木德"',
                 'juan138-yinghuo': '"芒角森龍鳳"', 'juan138-taibai': '"太白淩清漢"',
                 'juan138-chenxing': '"妙哉扶五炁"', 'juan138-zhenxing': '"高穹符戊已"',
                 'juan138-luohou': '"神首循黑道"', 'juan138-jidu': '"豹尾鎮星宫"',
                 'juan138-ziqi': '"授制宗元帝"', 'juan138-yuebei': '"太陰光玉緯"',
                 'juan138-shouyi': '"七緯四餘"',
                 'juan139-kaiyi': '"碧霧浮空"', 'juan139-sanyuan': '"玄象垂光"',
                 'juan139-riyue': '"陽精陰粹"', 'juan139-wude': '"五靈列位"',
                 'juan139-siyu': '"炁回四七"', 'juan139-nanbeidou': '"維北有斗"',
                 'juan139-dongfang': '"東獸蒼龍"', 'juan139-nanfang': '"三鶉流披"',
                 'juan139-xifang': '"獸標白虎"', 'juan139-beifang': '"精明玄武"',
                 'juan139-shierchen': '"列舍周羅"', 'juan139-shouyi': '"並巳周圓"',
                 'juan140-kaiyi': '"五星高耀"', 'juan140-chuxian': '"臣聞函三"',
                 'juan140-yaxian': '"伏聞紫微拱"', 'juan140-zhongxian': '"觚稜月淡"',
                 'juan140-songsheng': '"幽顯沾恩"',
                 'juan244-zao-kaiyi': '"無侮老成"', 'juan244-zao-sannian': '"箕翼齊天"',
                 'juan244-zao-qidao': '"八千歲爲春"', 'juan244-zao-fayuan': '"一念爲道"',
                 'juan244-zao-shoujie': '"傳向來所啓"', 'juan244-wu-kaiyi': '"次舍輻周"',
                 'juan244-wu-sannian': '"量契尊彝"', 'juan244-wu-qidao': '"曰艾曰耆"',
                 'juan244-wu-fayuan': '"一願大道淡泊"', 'juan244-wu-shoujie': '"傳向來所啓速達"',
                 'juan244-wan-kaiyi': '"疇原箕子"', 'juan244-wan-sannian': '"鼓吹百王"',
                 'juan244-wan-qidao': '"茹芝避世"', 'juan244-wan-shouyi': '"傳臣向來所啓"',
                 'juan245-qishou-kaiyi': '"蘋藻是陳"', 'juan245-qishou-chuxian': '"三洞流光"',
                 'juan245-qishou-yaxian': '"黍稷非馨"', 'juan245-qishou-zhongxian': '"衛武入相"',
                 'juan245-qishou-songsheng': '"萬帝臨軒"', 'juan245-shouxing-kaiyi': '"壽星醮儀法事如式"',
                 'juan245-shouxing-chuxian': '"九天妤生韓君"', 'juan245-shouxing-yaxian': '"五福一曰壽"',
                 'juan245-shouxing-zhongxian': '"視聽自民"', 'juan245-shouxing-songsheng': '"以實不以文"',
                 'juan271-chishu-dongfang': '"東山神咒"', 'juan271-chishu-nanfang': '"南河水帝"',
                 'juan271-chishu-zhongyang': '"黃上天元"', 'juan271-chishu-xifang': '"西山神咒"',
                 'juan271-chishu-beifang': '"北山神咒"', 'juan271-wufang-zhenwen': '"天皇禀炁"',
                 'juan271-zhuiyuan-zhufu': '"度六亲符"', 'juan271-shiyiyao-doufu': '"三十六步目"',
                 'juan274-xuanji-jiee': '"解三災厄符"', 'juan274-yuzi-chuandu': '"北斗天關正八方"',
                 'juan274-leiting-fuxi': '"虚精太華乾溟火文符"', 'juan274-leifa-fushi': '"神府散雲吐炁靂黑符"',
                 'juan274-leizhen-jiangli': '"雷陣左領將軍王佐"', 'juan274-leibu-qisi': '"換陰成陽生貴子符"',
                 'juan274-qilu-rangzai': '"右用桃板三尺"',
                 'juan316-baoming-touci': '"拜断瘟保病朱"', 'juan316-baoming-zou-san': '"东方青灵始老九炁天君"',
                 'juan316-baoming-santian': '"一臣切详某"', 'juan316-baoming-xuanshi-qiyao': '"太阳太丹炎光郁明上真道"',
                 'juan316-baoming-shen-bengming': '"分野缠次迎灾送难"', 'juan316-baoming-die-chenghuang': '"如修瘟疫斋"',
                 'juan316-qiyao-touci': '"致躔次之失序"', 'juan316-qiyao-zou-haotian': '"玉皇大天帝"',
                 'juan316-qiyao-santian': '"一臣取今月某日肃建斋坛"', 'juan316-qiyao-sansheng-taiyang': '"泰玄都省主三天大圣都天大法天师"',
                 'juan316-qiyao-liushi-bengming': '"九兹申请"', 'juan316-qiyao-sanshi-siyu': '"神首罗喉真君"',
                 'juan316-qiyao-die-chenghuang': '"专为斋主，迎迓嘉祥"', 'juan316-xuanling-touci': '"崇建玄灵游玑妙斋"',
                 'juan316-xuanling-beiji-jiuhuang': '"北斗汰尉阳明贪狼玉晨君"', 'juan316-xuanling-xuanshi-daode': '"斗申玄曹道德诸君"',
                 'juan316-xuanling-liushi-zhusi': '"申六十甲子官君"', 'juan316-xuanling-die-chenghuang': '"即俾运很和"',
                 'juan316-shejiao-shengmu': '"今具正筵"'}),
]
PAT = re.compile(r'<!--ENTRY:([^|]+)\|([^|]+)\|([\d.]+)-->')


def eid(job, tag):
    return 'KB-' + job['prefix'] + '-' + hashlib.md5(tag.encode()).hexdigest()[:12]


def keywords(content):
    match = re.search(r'(?:關鍵詞|关键词)：([^\n]+)', content)
    assert match, '条目缺关键词'
    return match.group(1).strip()


for job in JOBS:
    entries = []
    for md in job['mds']:
        raw = (ROOT / md).read_text(encoding='utf-8')
        marks = list(PAT.finditer(raw))
        for i, mark in enumerate(marks):
            body = raw[mark.end():marks[i + 1].start() if i + 1 < len(marks) else len(raw)].strip()
            tag = mark.group(1).strip()
            assert body, f"{job['module']} 条目 {tag} 内容为空"
            assert len(body) >= 100, f"{job['module']} 条目 {tag} 低于100字"
            entries.append(dict(tag=tag, title=mark.group(2).strip(), trust=float(mark.group(3)),
                                content=body, keywords=keywords(body)))
    assert len(entries) == job['expected'], f"{job['module']} 预期{job['expected']}条，实际{len(entries)}条"
    job['entries'] = entries
    job['avg'] = round(sum(entry['trust'] for entry in entries) / len(entries), 4)

all_ids = [eid(job, entry['tag']) for job in JOBS for entry in job['entries']]
assert len(all_ids) == len(set(all_ids)), '本轮生成的条目ID存在冲突'

db = sqlite3.connect(DB, timeout=120)
db.execute('PRAGMA busy_timeout=120000')
try:
    db.execute('BEGIN IMMEDIATE')
    for job in JOBS:
        for entry in job['entries']:
            entry_id = eid(job, entry['tag'])
            duplicate = db.execute(
                'SELECT entry_id FROM kb_formal WHERE module=? AND content=? AND entry_id<>?',
                (job['module'], entry['content'], entry_id)).fetchone()
            assert duplicate is None, f"同文重复：{entry_id} 与 {duplicate[0]}"
            fp = job['prefix'] + '|' + hashlib.md5(entry['tag'].encode()).hexdigest()[:12]
            db.execute("""INSERT INTO kb_formal
              (entry_id,module,title,content,src_id,category,keywords,summary,trust_score,
               hit_count,tags,access_level,status,created_at,promoted_at,updated_at,
               fingerprint,authority,domain)
              VALUES (?,?,?,?,?,?,?,?,?,0,?,'public','formal',?,?,?,?,'','mingli')
              ON CONFLICT(entry_id) DO UPDATE SET
               module=excluded.module,title=excluded.title,content=excluded.content,
               src_id=excluded.src_id,category=excluded.category,keywords=excluded.keywords,
               summary='',trust_score=excluded.trust_score,tags=excluded.tags,
               access_level='public',status='formal',promoted_at=excluded.promoted_at,
               updated_at=excluded.updated_at,fingerprint=excluded.fingerprint,domain='mingli'""",
              (entry_id, job['module'], entry['title'], entry['content'], job['src'],
               job['category'], entry['keywords'], '', entry['trust'], entry['keywords'],
               NOW, NOW, NOW, fp))
        count = len(job['entries'])
        db.execute("""INSERT INTO kb_module_registry
          (module,std_group,display_name,domain,entry_count,note,updated_at)
          VALUES (?,?,?,'mingli',?,?,?)
          ON CONFLICT(module) DO UPDATE SET std_group=excluded.std_group,
          display_name=excluded.display_name,domain='mingli',entry_count=excluded.entry_count,
          note=excluded.note,updated_at=excluded.updated_at""",
          (job['module'], job['std_group'], job['display'], count, job['note'], NOW))
        db.execute("""INSERT INTO kb_src_registry
          (src_id,description,level,avg_trust,entry_count,created_at)
          VALUES (?,?,'classic',?,?,?)
          ON CONFLICT(src_id) DO UPDATE SET description=excluded.description,
          level='classic',avg_trust=excluded.avg_trust,entry_count=excluded.entry_count""",
          (job['src_id'], job['src_desc'], job['avg'], count, NOW))
    db.commit()
except Exception:
    db.rollback()
    safe_close(db)
    raise
safe_close(db)

subprocess.run([sys.executable, str(ROOT / 'scripts/kb-sync-guard.py'), '--sync', '1'],
               cwd=ROOT, check=True)

db = sqlite3.connect(DB, timeout=120)
try:
    for job in JOBS:
        n = len(job['entries'])
        formal = db.execute('SELECT COUNT(*) FROM kb_formal WHERE module=?', (job['module'],)).fetchone()[0]
        fts = db.execute("""SELECT COUNT(*) FROM kb_formal f
                            JOIN kb_fts5_idmap m ON m.entry_id=f.entry_id
                            WHERE f.module=?""", (job['module'],)).fetchone()[0]
        registry = db.execute('SELECT entry_count FROM kb_module_registry WHERE module=?', (job['module'],)).fetchone()[0]
        src = db.execute('SELECT entry_count FROM kb_src_registry WHERE src_id=?', (job['src_id'],)).fetchone()[0]
        assert formal == fts == registry == src == n, (job['module'], formal, fts, registry, src, n)
        ids = []
        for entry in job['entries']:
            entry_id = eid(job, entry['tag'])
            ids.append(entry_id)
            formal_row = db.execute("""SELECT title,content,keywords,tags,promoted_at,updated_at
                                       FROM kb_formal WHERE entry_id=?""", (entry_id,)).fetchone()
            rid_row = db.execute('SELECT rid FROM kb_fts5_idmap WHERE entry_id=?', (entry_id,)).fetchone()
            assert formal_row and rid_row, f'主表或索引映射缺条目：{entry_id}'
            fts_row = db.execute('SELECT content,tags,category FROM kb_fts5 WHERE rowid=?',
                                 (rid_row[0],)).fetchone()
            assert fts_row, f'FTS 缺条目：{entry_id}'
            assert formal_row[0] == entry['title'] and formal_row[1] == fts_row[0] == entry['content']
            assert formal_row[2] == formal_row[3] == fts_row[1] == entry['keywords']
            assert fts_row[2] == job['category'] and formal_row[4] and formal_row[5]
            probe = job['probes'][entry['tag']]
            probe_ids = {row[0] for row in db.execute(
                'SELECT entry_id FROM kb_fts5 WHERE kb_fts5 MATCH ? LIMIT 20', (probe,))}
            assert entry_id in probe_ids, f"检索探针未命中：{entry_id} / {probe}"
        print(f"{job['module']}: formal={formal} fts5={fts} registry={registry} src={src}；双表逐字一致；{n}组探针命中")
    print('主表与索引映射计数:', db.execute(
        'SELECT (SELECT COUNT(*) FROM kb_formal),(SELECT COUNT(*) FROM kb_fts5_idmap)').fetchone())
finally:
    safe_close(db)
