#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# P3 · 玄空三件套入库：玄空秘旨 / 玉函通秘 / 传家阳宅得一录（书目挂账）
# 文本源：corpus/{xuankong-mizhi,yuhan-tongmi,deyilu}/*-transcript.md
# 条目标记：<!--ENTRY:tag|title|trust-->
import sqlite3, hashlib, datetime, re, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
DB = str(ROOT / 'server/database/yidao.db')
NOW = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')

JOBS = [
  dict(module='xuankong-mizhi', prefix='XM', category='阳宅-玄空',
       md='corpus/xuankong-mizhi/xuankong-mizhi-transcript.md',
       src='xuankong-mizhi:網絡流傳本三源互校(china95/GoogleSites/blogspot·預留人工校驗)',
       src_id='SRC-XUANKONG-MIZHI-20261021',
       src_desc='玄空秘旨全文：网络流传白文本三源互校（注本挂账）', avg=0.68,
       display='玄空秘旨',
       note='传宋吴景鸾撰（章仲山本题目讲僧）；全文三源互校trust0.65；原注/鲍注/章注挂账待原刻'),
  dict(module='yuhan-tongmi', prefix='YH', category='阳宅-玄空',
       md='corpus/yuhan-tongmi/yuhan-tongmi-transcript.md',
       src='yuhan-tongmi:搜狐陳炳聿按網絡流傳節本(單源·預留人工校驗)',
       src_id='SRC-YUHAN-TONGMI-20261021',
       src_desc='玉函通秘节本：九运天机+天玉经释+杂气节+下卦起星歌（网络流传单源）', avg=0.64,
       display='玉函通秘',
       note='清紫霞散人撰，玄空理气最早刊本；网络流传节本单源trust0.6，待清末原刻替换'),
  dict(module='deyilu', prefix='DY', category='阳宅-玄空',
       md='corpus/deyilu/deyilu-transcript.md',
       src='deyilu:書目著錄(loc.gov目錄+四秘全書+孔夫子嘉慶本)',
       src_id='SRC-DEYILU-20261021',
       src_desc='传家阳宅得一录：书目著录+求书路径（正文挂账）', avg=0.8,
       display='传家阳宅得一录',
       note='题蒋大鸿·尹一勺湘楚派；正文未获挂账，仅书目著录2条；求书路径已列'),
]

pat = re.compile(r'<!--ENTRY:([^|]+)\|([^|]+)\|([\d.]+)-->')

def eid(prefix, tag):
    return f'KB-{prefix}-' + hashlib.md5(tag.encode()).hexdigest()[:12]

import subprocess, sys
from lib.kb_ingest import KBIngestor
from yidao_safe import safe_close

db = sqlite3.connect(DB, timeout=120)
c = db.cursor()
ing = KBIngestor(db)
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
    n = len(entries)
    for e in entries:
        kw = e['content'].split('關鍵詞：')[-1].strip() if '關鍵詞：' in e['content'] else ''
        ing.upsert(entry_id=eid(job['prefix'], e['tag']), module=job['module'], title=e['title'],
                   content=e['content'], src_id=job['src'], category=job['category'],
                   keywords=kw, tags=kw, trust=e['trust'], source='corpus-rebuild')
    c.execute("""INSERT INTO kb_module_registry (module, std_group, display_name, domain, entry_count, note, updated_at)
      VALUES (?,?,?,?,?,?,?) ON CONFLICT(module) DO UPDATE SET entry_count=excluded.entry_count, note=excluded.note, updated_at=excluded.updated_at""",
      (job['module'], '阳宅', job['display'], 'mingli', n, job['note'], NOW))
    c.execute("INSERT OR REPLACE INTO kb_src_registry (src_id, description, level, avg_trust, entry_count, created_at) VALUES (?,?,?,?,?,?)",
      (job['src_id'], job['src_desc'], 'classic', job['avg'], n, NOW))
    print(f"{job['module']}: 可重入语料 {n} 条（{'、'.join(e['tag'] for e in entries)}）")
ing.commit()
db.commit()
safe_close(db)
subprocess.run([sys.executable, str(ROOT / 'scripts/kb-sync-guard.py'), '--sync', '1'], cwd=ROOT, check=True)
db = sqlite3.connect(DB, timeout=120)
try:
    for job in JOBS:
        f = db.execute('SELECT COUNT(*) FROM kb_formal WHERE module=?', (job['module'],)).fetchone()[0]
        t = db.execute('SELECT COUNT(*) FROM kb_fts5 WHERE module=?', (job['module'],)).fetchone()[0]
        print(f"{job['module']}: formal={f} fts5={t} {'OK' if f==t else 'MISMATCH!'}")
finally:
    safe_close(db)
