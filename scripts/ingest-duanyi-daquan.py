#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""P10 · 《断易大全》版本与四卷目录级结构可重入入库。

只写 kb_formal；FTS 统一交 scripts/kb-sync-guard.py 维护。
文本源：corpus/duanyi-daquan/duanyi-daquan-transcript.md
条目标记：<!--ENTRY:tag|title|trust-->

边界：现有语料仅含版本、卷次、目录及求书路径，不含经验卦例十五条正文。
异本《鼎锲卜筮启蒙便读通玄断易大全》不得混署为余兴国四卷本原文。
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

JOB = dict(
    module='duanyi-daquan', prefix='DYDQ', category='易卦', std_group='易卦',
    md='corpus/duanyi-daquan/duanyi-daquan-transcript.md', expected=5,
    src='duanyi-daquan:國圖鮑國強新入藏古籍札記(版本)+2012校釋本館藏目錄(目錄級)',
    src_id='SRC-DUANYI-DAQUAN-20261024',
    src_desc='断易大全：余兴国四卷本版本、四卷结构、异本消歧与全文挂账',
    display='断易大全',
    note='清余兴国四卷；老二酉堂版本+四卷结构5条；目录级，正文及经验卦例十五条挂账',
)
PAT = re.compile(r'<!--ENTRY:([^|]+)\|([^|]+)\|([\d.]+)-->')


def eid(tag):
    return 'KB-DYDQ-' + hashlib.md5(tag.encode()).hexdigest()[:12]


def keywords(content):
    match = re.search(r'(?:關鍵詞|关键词)：([^\n]+)', content)
    assert match, '条目缺关键词'
    return match.group(1).strip()


raw = (ROOT / JOB['md']).read_text(encoding='utf-8')
marks = list(PAT.finditer(raw))
assert len(marks) == JOB['expected'], f"预期{JOB['expected']}条，实际{len(marks)}条"
entries = []
for i, mark in enumerate(marks):
    body = raw[mark.end():marks[i + 1].start() if i + 1 < len(marks) else len(raw)].strip()
    tag = mark.group(1).strip()
    assert body, f'条目 {tag} 内容为空'
    assert len(body) >= 100, f'条目 {tag} 低于100字'
    entries.append(dict(tag=tag, title=mark.group(2).strip(), trust=float(mark.group(3)),
                        content=body, keywords=keywords(body)))
ids = [eid(entry['tag']) for entry in entries]
assert len(ids) == len(set(ids)), '条目ID存在冲突'
avg = round(sum(entry['trust'] for entry in entries) / len(entries), 4)

from lib.kb_ingest import KBIngestor

db = sqlite3.connect(DB, timeout=120)
db.execute('PRAGMA busy_timeout=120000')
ing = KBIngestor(db)
try:
    db.execute('BEGIN IMMEDIATE')
    for entry in entries:
        ing.upsert(
            entry_id=eid(entry['tag']), module=JOB['module'], title=entry['title'],
            content=entry['content'], src_id=JOB['src'], category=JOB['category'],
            keywords=entry['keywords'], tags=entry['keywords'], trust=entry['trust'],
            source='corpus-rebuild')
    count = len(entries)
    db.execute("""INSERT INTO kb_module_registry
      (module,std_group,display_name,domain,entry_count,note,updated_at)
      VALUES (?,?,?,'mingli',?,?,?)
      ON CONFLICT(module) DO UPDATE SET std_group=excluded.std_group,
      display_name=excluded.display_name,domain='mingli',entry_count=excluded.entry_count,
      note=excluded.note,updated_at=excluded.updated_at""",
      (JOB['module'], JOB['std_group'], JOB['display'], count, JOB['note'], NOW))
    db.execute("""INSERT INTO kb_src_registry
      (src_id,description,level,avg_trust,entry_count,created_at)
      VALUES (?,?,'classic',?,?,?)
      ON CONFLICT(src_id) DO UPDATE SET description=excluded.description,
      level='classic',avg_trust=excluded.avg_trust,entry_count=excluded.entry_count""",
      (JOB['src_id'], JOB['src_desc'], avg, count, NOW))
    ing.commit()
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
    n = len(entries)
    formal = db.execute('SELECT COUNT(*) FROM kb_formal WHERE module=?', (JOB['module'],)).fetchone()[0]
    # FTS 的 module 无索引，直接 COUNT 会慢扫全库；由主表模块索引与 idmap 主键核对数量。
    fts = db.execute("""SELECT COUNT(*) FROM kb_formal f
                        JOIN kb_fts5_idmap m ON m.entry_id=f.entry_id
                        WHERE f.module=?""", (JOB['module'],)).fetchone()[0]
    registry = db.execute('SELECT entry_count FROM kb_module_registry WHERE module=?', (JOB['module'],)).fetchone()[0]
    src = db.execute('SELECT entry_count FROM kb_src_registry WHERE src_id=?', (JOB['src_id'],)).fetchone()[0]
    assert formal == fts == registry == src == n, (formal, fts, registry, src, n)
    for entry in entries:
        entry_id = eid(entry['tag'])
        formal_row = db.execute("""SELECT title,content,keywords,tags,promoted_at,updated_at
                                   FROM kb_formal WHERE entry_id=?""", (entry_id,)).fetchone()
        rid_row = db.execute('SELECT rid FROM kb_fts5_idmap WHERE entry_id=?', (entry_id,)).fetchone()
        assert formal_row and rid_row, f'主表或索引映射缺条目：{entry_id}'
        fts_row = db.execute('SELECT content,tags,category FROM kb_fts5 WHERE rowid=?',
                             (rid_row[0],)).fetchone()
        assert fts_row, f'FTS 缺条目：{entry_id}'
        assert formal_row[0] == entry['title'] and formal_row[1] == fts_row[0] == entry['content']
        assert formal_row[2] == formal_row[3] == fts_row[1] == entry['keywords']
        assert fts_row[2] == JOB['category']
        assert formal_row[4] and formal_row[5], f'同步时间缺失：{entry_id}'
    # 不把 entry_id 普通过滤与 MATCH 混写：33 万行 FTS 上会退化为慢扫。
    probe_ids = {row[0] for row in db.execute(
        "SELECT entry_id FROM kb_fts5 WHERE kb_fts5 MATCH ? LIMIT 20", ('"断易大全"',))}
    assert set(ids).issubset(probe_ids), f'检索探针未覆盖全部条目：{set(ids) - probe_ids}'
    print(f"{JOB['module']}: formal={formal} fts5={fts} registry={registry} src={src}；双表逐字一致；检索探针命中")
    # 全库 COUNT(kb_fts5) 同样是慢扫；专项验收不重复做全库扫描。
    print('主表与索引映射计数:', db.execute(
        'SELECT (SELECT COUNT(*) FROM kb_formal),(SELECT COUNT(*) FROM kb_fts5_idmap)').fetchone())
finally:
    safe_close(db)
