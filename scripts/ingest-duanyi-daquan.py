#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# P6 · 易卦补缺：余兴国《断易大全》版本与四卷目录级结构
# 文本源：corpus/duanyi-daquan/duanyi-daquan-transcript.md
# 条目标记：<!--ENTRY:tag|title|trust-->
import sqlite3, hashlib, datetime, re, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
DB = str(ROOT / 'server/database/yidao.db')
NOW = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
JOB = dict(
    module='duanyi-daquan', prefix='DYDQ', category='易卦', std_group='易卦',
    md='corpus/duanyi-daquan/duanyi-daquan-transcript.md',
    src='duanyi-daquan:國圖鮑國強新入藏古籍札記(版本)+2012校釋本館藏目錄(目錄級)',
    src_id='SRC-DUANYI-DAQUAN-20261024',
    src_desc='断易大全：余兴国四卷本版本、四卷结构、异本消歧与全文挂账',
    avg=0.83, display='断易大全',
    note='清余兴国四卷；老二酉堂版本+四卷结构5条；目录级，正文及经验卦例十五条挂账'
)
pat = re.compile(r'<!--ENTRY:([^|]+)\|([^|]+)\|([\d.]+)-->')

def eid(tag):
    return 'KB-DYDQ-' + hashlib.md5(tag.encode()).hexdigest()[:12]

raw = (ROOT / JOB['md']).read_text(encoding='utf-8')
marks = list(pat.finditer(raw))
assert len(marks) == 5, f"预期5条，实际{len(marks)}条"
entries = []
for i, m in enumerate(marks):
    body = raw[m.end(): marks[i + 1].start() if i + 1 < len(marks) else len(raw)].strip()
    assert body, f"条目 {m.group(1)} 内容为空"
    entries.append(dict(tag=m.group(1).strip(), title=m.group(2).strip(),
                        trust=float(m.group(3)), content=body))

db = sqlite3.connect(DB, timeout=120)
c = db.cursor()
assert c.execute('SELECT COUNT(*) FROM kb_formal WHERE module=?', (JOB['module'],)).fetchone()[0] == 0, '目标模块已存在，停止重复入库'
try:
    for e in entries:
        fp = JOB['prefix'] + '|' + hashlib.md5(e['tag'].encode()).hexdigest()[:12]
        kw = e['content'].split('關鍵詞：')[-1].strip() if '關鍵詞：' in e['content'] else ''
        assert kw, f"条目 {e['tag']} 缺关键词"
        c.execute("""INSERT INTO kb_formal
          (entry_id, module, title, content, src_id, category, keywords, summary, trust_score,
           hit_count, access_level, status, created_at, fingerprint, authority, domain)
          VALUES (?,?,?,?,?,?,?,?,?,0,'public','formal',?,?,'','mingli')""",
          (eid(e['tag']), JOB['module'], e['title'], e['content'], JOB['src'],
           JOB['category'], kw, '', e['trust'], NOW, fp))
        c.execute('INSERT INTO kb_fts5 (entry_id, module, summary, content, tags, category) VALUES (?,?,?,?,?,?)',
                  (eid(e['tag']), JOB['module'], '', e['content'], kw, JOB['category']))
    n = len(entries)
    c.execute("""INSERT INTO kb_module_registry
      (module, std_group, display_name, domain, entry_count, note, updated_at)
      VALUES (?,?,?,?,?,?,?)""",
      (JOB['module'], JOB['std_group'], JOB['display'], 'mingli', n, JOB['note'], NOW))
    c.execute('INSERT INTO kb_src_registry (src_id, description, level, avg_trust, entry_count, created_at) VALUES (?,?,?,?,?,?)',
              (JOB['src_id'], JOB['src_desc'], 'classic', JOB['avg'], n, NOW))
    db.commit()
except Exception:
    db.rollback()
    raise
f = c.execute('SELECT COUNT(*) FROM kb_formal WHERE module=?', (JOB['module'],)).fetchone()[0]
t = c.execute('SELECT COUNT(*) FROM kb_fts5 WHERE module=?', (JOB['module'],)).fetchone()[0]
r = c.execute('SELECT entry_count FROM kb_module_registry WHERE module=?', (JOB['module'],)).fetchone()[0]
print(f"{JOB['module']}: 入库 {len(entries)} 条；formal={f} fts5={t} registry={r}")
assert f == t == r == len(entries)
db.close()
