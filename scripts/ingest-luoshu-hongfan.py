#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# P7 · 数字术数：洛书数解题名待证 + 洪范九畴数解分书采录
# 条目标记：<!--ENTRY:tag|title|trust-->
# 两书独立模块、独立来源；单次事务入库，失败整体回滚。
import sqlite3, hashlib, datetime, re, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
DB = str(ROOT / 'server/database/yidao.db')
NOW = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
sys.path.insert(0, str(ROOT / 'scripts'))
from yidao_safe import safe_close

JOBS = [
    dict(
        module='luoshu-shujie', prefix='LSSJ', category='数字术数', std_group='数字术数',
        md='corpus/luoshu-shujie/luoshu-shujie-transcript.md', expected=3,
        src='luoshu-shujie:項目清單題名+庫內FTS與公開書目檢索台賬(2026-10-24)',
        src_id='SRC-LUOSHU-SHUJIE-20261024',
        src_desc='洛书数解：独立典籍题名待证、近名书消歧与续证条件',
        avg=0.8667, display='洛书数解（题名待证）',
        note='题名考据3条；未获独立典籍可靠著录，不等于不存在；不计有效典籍覆盖'
    ),
    dict(
        module='hongfan-jiuchou-shujie', prefix='HFJC', category='数字术数', std_group='数字术数',
        md='corpus/hongfan-jiuchou-shujie/hongfan-jiuchou-shujie-transcript.md', expected=5,
        src='hongfan-jiuchou-shujie:四庫總目卷110+國學大師書目+識典CADAL02055276(目錄/OCR)',
        src_id='SRC-HONGFAN-JIUCHOU-20261024',
        src_desc='洪范九畴数解：熊宗立书目、三卷八卷版本、八卷目录与卷二OCR节选',
        avg=0.84, display='洪范九畴数解',
        note='明熊宗立；书目2条+八卷目录1条+卷二OCR四段1条+来源1条；与洛书数解严格分书'
    ),
]
pat = re.compile(r'<!--ENTRY:([^|]+)\|([^|]+)\|([\d.]+)-->')

def eid(job, tag):
    return 'KB-' + job['prefix'] + '-' + hashlib.md5(tag.encode()).hexdigest()[:12]

for job in JOBS:
    raw = (ROOT / job['md']).read_text(encoding='utf-8')
    marks = list(pat.finditer(raw))
    assert len(marks) == job['expected'], f"{job['module']} 预期{job['expected']}条，实际{len(marks)}条"
    entries = []
    for i, m in enumerate(marks):
        body = raw[m.end(): marks[i + 1].start() if i + 1 < len(marks) else len(raw)].strip()
        tag = m.group(1).strip()
        assert body, f"{job['module']} 条目 {tag} 内容为空"
        entries.append(dict(tag=tag, title=m.group(2).strip(), trust=float(m.group(3)), content=body))
    job['entries'] = entries

all_ids = [eid(job, e['tag']) for job in JOBS for e in job['entries']]
assert len(all_ids) == len(set(all_ids)), '本轮生成的条目ID存在冲突'

db = sqlite3.connect(DB, timeout=120)
c = db.cursor()
try:
    for job in JOBS:
        module = job['module']
        assert c.execute('SELECT COUNT(*) FROM kb_formal WHERE module=?', (module,)).fetchone()[0] == 0, f'{module} 正式表已存在，停止重复入库'
        assert c.execute('SELECT COUNT(*) FROM kb_fts5 WHERE module=?', (module,)).fetchone()[0] == 0, f'{module} FTS已存在，停止重复入库'
        assert c.execute('SELECT COUNT(*) FROM kb_module_registry WHERE module=?', (module,)).fetchone()[0] == 0, f'{module} 注册表已存在'
        assert c.execute('SELECT COUNT(*) FROM kb_src_registry WHERE src_id=?', (job['src_id'],)).fetchone()[0] == 0, f"{job['src_id']} 来源已存在"
    for entry_id in all_ids:
        assert c.execute('SELECT COUNT(*) FROM kb_formal WHERE entry_id=?', (entry_id,)).fetchone()[0] == 0, f'条目ID全库冲突：{entry_id}'

    for job in JOBS:
        for e in job['entries']:
            entry_id = eid(job, e['tag'])
            fp = job['prefix'] + '|' + hashlib.md5(e['tag'].encode()).hexdigest()[:12]
            kw = e['content'].split('關鍵詞：')[-1].strip() if '關鍵詞：' in e['content'] else ''
            assert kw, f"{job['module']} 条目 {e['tag']} 缺关键词"
            c.execute("""INSERT INTO kb_formal
              (entry_id, module, title, content, src_id, category, keywords, summary, trust_score,
               hit_count, access_level, status, created_at, fingerprint, authority, domain)
              VALUES (?,?,?,?,?,?,?,?,?,0,'public','formal',?,?,'','mingli')""",
              (entry_id, job['module'], e['title'], e['content'], job['src'],
               job['category'], kw, '', e['trust'], NOW, fp))
            c.execute('INSERT INTO kb_fts5 (entry_id, module, summary, content, tags, category) VALUES (?,?,?,?,?,?)',
                      (entry_id, job['module'], '', e['content'], kw, job['category']))
        n = len(job['entries'])
        c.execute("""INSERT INTO kb_module_registry
          (module, std_group, display_name, domain, entry_count, note, updated_at)
          VALUES (?,?,?,?,?,?,?)""",
          (job['module'], job['std_group'], job['display'], 'mingli', n, job['note'], NOW))
        c.execute('INSERT INTO kb_src_registry (src_id, description, level, avg_trust, entry_count, created_at) VALUES (?,?,?,?,?,?)',
                  (job['src_id'], job['src_desc'], 'classic', job['avg'], n, NOW))
    db.commit()
except Exception:
    db.rollback()
    safe_close(db)
    raise

results = []
for job in JOBS:
    module = job['module']
    n = len(job['entries'])
    f = c.execute('SELECT COUNT(*) FROM kb_formal WHERE module=?', (module,)).fetchone()[0]
    t = c.execute('SELECT COUNT(*) FROM kb_fts5 WHERE module=?', (module,)).fetchone()[0]
    r = c.execute('SELECT entry_count FROM kb_module_registry WHERE module=?', (module,)).fetchone()[0]
    s = c.execute('SELECT entry_count FROM kb_src_registry WHERE src_id=?', (job['src_id'],)).fetchone()[0]
    assert f == t == r == s == n, f'{module} 双表或注册表计数不一致：formal={f} fts5={t} registry={r} src={s} expected={n}'
    results.append((module, n, f, t, r, s))
safe_close(db)
for module, n, f, t, r, s in results:
    print(f'{module}: 入库 {n} 条；formal={f} fts5={t} registry={r} src_registry={s}')
