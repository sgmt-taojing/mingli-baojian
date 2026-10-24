#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# P5 · 科仪补缺入库：三教源流搜神大全 / 灵宝领教济度金书
# 文本源：corpus/<module>/<module>-transcript.md
# 条目标记：<!--ENTRY:tag|title|trust-->
import sqlite3, hashlib, datetime, re, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
DB = str(ROOT / 'server/database/yidao.db')
NOW = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')

JOBS = [
  dict(module='sanjiao-soushen', prefix='SJ', category='科仪',
       md='corpus/sanjiao-soushen/sanjiao-soushen-transcript.md',
       src='sanjiao-soushen:維基文庫葉德輝翻刻本系統(卷五全文)+書格版本提要',
       src_id='SRC-SANJIAO-SOUSHEN-20261024',
       src_desc='三教源流搜神大全：七卷结构+卷五太岁殷元帅全文+元辰太岁参证', avg=0.8,
       display='三教源流搜神大全',
       note='七卷神谱，卷五太岁殷元帅全文+元辰太岁参证4条；余神目与六十元辰全表挂账'),
  dict(module='jidu-jinshu', prefix='JD', category='科仪',
       md='corpus/jidu-jinshu/jidu-jinshu-transcript.md',
       src='jidu-jinshu:daoinfo提要+識典DZ0465/0466目錄+道藏目錄詳註(wikisource四庫本)',
       src_id='SRC-JIDU-JINSHU-20261024',
       src_desc='灵宝领教济度金书：书目版本+顺星礼斗卷次指引（正文挂账）', avg=0.82,
       display='灵宝领教济度金书',
       note='宁全真授林灵真编320卷；顺星礼斗卷次指引（度星斋卷131-147等）3条；灯仪寿星醮仪原文挂账'),
]

pat = re.compile(r'<!--ENTRY:([^|]+)\|([^|]+)\|([\d.]+)-->')

def eid(prefix, tag):
    return f'KB-{prefix}-' + hashlib.md5(tag.encode()).hexdigest()[:12]

db = sqlite3.connect(DB, timeout=120)
c = db.cursor()
for job in JOBS:
    raw = (ROOT / job['md']).read_text(encoding='utf-8')
    marks = list(pat.finditer(raw))
    assert marks, f"{job['module']} 未发现 ENTRY 标记"
    entries = []
    for i, m in enumerate(marks):
        body = raw[m.end(): marks[i+1].start() if i+1 < len(marks) else len(raw)].strip()
        assert body, f"{job['module']} 条目 {m.group(1)} 内容为空"
        entries.append(dict(tag=m.group(1).strip(), title=m.group(2).strip(),
                            trust=float(m.group(3)), content=body))
    n = 0
    for e in entries:
        fp = job['prefix'] + '|' + hashlib.md5(e['tag'].encode()).hexdigest()[:12]
        kw = e['content'].split('關鍵詞：')[-1].strip() if '關鍵詞：' in e['content'] else ''
        c.execute("""INSERT INTO kb_formal
          (entry_id, module, title, content, src_id, category, keywords, summary, trust_score,
           hit_count, access_level, status, created_at, fingerprint, authority, domain)
          VALUES (?,?,?,?,?,?,?,?,?,0,'public','formal',?,?,'','mingli')""",
          (eid(job['prefix'], e['tag']), job['module'], e['title'], e['content'],
           job['src'], job['category'], kw, '', e['trust'], NOW, fp))
        c.execute("INSERT INTO kb_fts5 (entry_id, module, summary, content, tags, category) VALUES (?,?,?,?,?,?)",
                  (eid(job['prefix'], e['tag']), job['module'], '', e['content'], kw, job['category']))
        n += 1
    c.execute("""INSERT INTO kb_module_registry (module, std_group, display_name, domain, entry_count, note, updated_at)
      VALUES (?,?,?,?,?,?,?) ON CONFLICT(module) DO UPDATE SET entry_count=excluded.entry_count, note=excluded.note, updated_at=excluded.updated_at""",
      (job['module'], '科仪', job['display'], 'mingli', n, job['note'], NOW))
    c.execute("INSERT OR REPLACE INTO kb_src_registry (src_id, description, level, avg_trust, entry_count, created_at) VALUES (?,?,?,?,?,?)",
      (job['src_id'], job['src_desc'], 'classic', job['avg'], n, NOW))
    print(f"{job['module']}: 入库 {n} 条（{'、'.join(e['tag'] for e in entries)}）")
db.commit()
for job in JOBS:
    f = c.execute('SELECT COUNT(*) FROM kb_formal WHERE module=?', (job['module'],)).fetchone()[0]
    t = c.execute('SELECT COUNT(*) FROM kb_fts5 WHERE module=?', (job['module'],)).fetchone()[0]
    print(f"{job['module']}: formal={f} fts5={t} {'OK' if f==t else 'MISMATCH!'}")
db.close()
