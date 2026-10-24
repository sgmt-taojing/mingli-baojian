#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""P8/P9 · 洪范正文深化：只写 kb_formal，FTS 统一交 kb-sync-guard.py。

按 entry_id 可重入更新；入库前做 (module, content) 查重。旧 P7 条目一并
补 promoted_at/updated_at/tags；P9 将蔡沈本扩至上中下全篇96条。
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
    dict(module='luoshu-shujie', prefix='LSSJ', category='数字术数', std_group='数字术数',
         md='corpus/luoshu-shujie/luoshu-shujie-transcript.md', expected=3,
         src='luoshu-shujie:項目清單題名+庫內FTS與公開書目檢索台賬(2026-10-24)',
         src_id='SRC-LUOSHU-SHUJIE-20261024',
         src_desc='洛书数解：独立典籍题名待证、近名书消歧与续证条件',
         display='洛书数解（题名待证）',
         note='题名考据3条；未获独立典籍可靠著录，不等于不存在；不计有效典籍覆盖'),
    dict(module='hongfan-jiuchou-shujie', prefix='HFJC', category='数字术数', std_group='数字术数',
         md='corpus/hongfan-jiuchou-shujie/hongfan-jiuchou-shujie-transcript.md', expected=6,
         src='hongfan-jiuchou-shujie:四庫總目卷110+國學大師書目+識典CADAL02055276(目錄/OCR)',
         src_id='SRC-HONGFAN-JIUCHOU-20261024',
         src_desc='洪范九畴数解：熊宗立书目、三卷八卷版本、八卷目录、卷二OCR节选与章界校勘台账',
         display='洪范九畴数解',
         note='明熊宗立；书目2条+八卷目录1条+卷二OCR四段1条+来源1条+卷二校勘台账1条；与蔡沈本、洛书数解严格分书'),
    dict(module='hongfan-huangji-neipian', prefix='HFNZ', category='数字术数', std_group='数字术数',
         md='corpus/hongfan-huangji-neipian/hongfan-huangji-neipian-transcript.md', expected=96,
         src='hongfan-huangji-neipian:維基文庫《性理大全書（四庫全書本）》卷二十四(網絡校錄)',
         src_id='SRC-HONGFAN-HUANGJI-NEIPIAN-20261024',
         src_desc='宋蔡沈《洪范皇极内篇》上中下：维基文库《性理大全书（四库全书本）》卷二十四网络校录，全篇96条，预留书影校验',
         display='洪范皇极内篇（蔡沈）',
         note='宋蔡沈；上中下各32条网络校录，trust=0.8；下篇3194字长段无损主题切片；疑字及图像替字留异文，不冒充书影定本；与熊宗立数解分书'),
]
PAT = re.compile(r'<!--ENTRY:([^|]+)\|([^|]+)\|([\d.]+)-->')


def eid(job, tag):
    return 'KB-' + job['prefix'] + '-' + hashlib.md5(tag.encode()).hexdigest()[:12]


def keywords(content):
    match = re.search(r'(?:關鍵詞|关键词)：([^\n]+)', content)
    assert match, '条目缺关键词'
    return match.group(1).strip()


for job in JOBS:
    raw = (ROOT / job['md']).read_text(encoding='utf-8')
    marks = list(PAT.finditer(raw))
    assert len(marks) == job['expected'], f"{job['module']} 预期{job['expected']}条，实际{len(marks)}条"
    entries = []
    for i, mark in enumerate(marks):
        body = raw[mark.end():marks[i + 1].start() if i + 1 < len(marks) else len(raw)].strip()
        tag = mark.group(1).strip()
        assert body, f"{job['module']} 条目 {tag} 内容为空"
        assert len(body) >= 100, f"{job['module']} 条目 {tag} 低于100字"
        entries.append(dict(tag=tag, title=mark.group(2).strip(), trust=float(mark.group(3)),
                            content=body, keywords=keywords(body)))
    job['entries'] = entries
    job['avg'] = round(sum(e['trust'] for e in entries) / len(entries), 4)

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
        fts = db.execute('SELECT COUNT(*) FROM kb_fts5 WHERE module=?', (job['module'],)).fetchone()[0]
        registry = db.execute('SELECT entry_count FROM kb_module_registry WHERE module=?', (job['module'],)).fetchone()[0]
        src = db.execute('SELECT entry_count FROM kb_src_registry WHERE src_id=?', (job['src_id'],)).fetchone()[0]
        assert formal == fts == registry == src == n, (job['module'], formal, fts, registry, src, n)
        print(f"{job['module']}: formal={formal} fts5={fts} registry={registry} src={src}")
    print('全库计数:', db.execute('SELECT (SELECT COUNT(*) FROM kb_formal),(SELECT COUNT(*) FROM kb_fts5),(SELECT COUNT(*) FROM kb_fts5_idmap)').fetchone())
finally:
    safe_close(db)
