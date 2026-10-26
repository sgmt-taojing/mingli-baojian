#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""P5/P11 · 科仪补缺可重入入库：三教源流搜神大全／灵宝领教济度金书。

只写 kb_formal；FTS 统一交 scripts/kb-sync-guard.py 维护。
P11 新增《灵宝领教济度金书》卷139《周天灯仪》识典源页十二节正文。
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
              'corpus/jidu-jinshu/jidu-jinshu-juan139-transcript.md',
              'corpus/jidu-jinshu/jidu-jinshu-juan140-transcript.md'], expected=20,
         src='jidu-jinshu:daoinfo提要+道藏目錄詳註+識典DZ0466卷139-140(網絡轉錄)',
         src_id='SRC-JIDU-JINSHU-20261024',
         src_desc='灵宝领教济度金书：书目版本、顺星礼斗卷次指引及卷139-140周天灯仪、紫府送星醮仪识典转录',
         display='灵宝领教济度金书',
         note='宁全真授林灵真编320卷；目录3条+卷139正文12节+卷140正文5节，共20条；网络转录预留书影校验，其余灯仪醮仪挂账',
         probes={'overview': '"靈寶東華派"', 'shunxing-zhiyin': '"度星齋"', 'sources': '"涵芬樓"',
                 'juan139-kaiyi': '"碧霧浮空"', 'juan139-sanyuan': '"玄象垂光"',
                 'juan139-riyue': '"陽精陰粹"', 'juan139-wude': '"五靈列位"',
                 'juan139-siyu': '"炁回四七"', 'juan139-nanbeidou': '"維北有斗"',
                 'juan139-dongfang': '"東獸蒼龍"', 'juan139-nanfang': '"三鶉流披"',
                 'juan139-xifang': '"獸標白虎"', 'juan139-beifang': '"精明玄武"',
                 'juan139-shierchen': '"列舍周羅"', 'juan139-shouyi': '"並巳周圓"',
                 'juan140-kaiyi': '"五星高耀"', 'juan140-chuxian': '"臣聞函三"',
                 'juan140-yaxian': '"伏聞紫微拱"', 'juan140-zhongxian': '"觚稜月淡"',
                 'juan140-songsheng': '"幽顯沾恩"'}),
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
