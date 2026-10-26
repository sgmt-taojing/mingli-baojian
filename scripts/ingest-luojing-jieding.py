#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# P1 · 罗经解定 卷一（括言+天池）入库（module: luojing-jieding）
# 文本源：corpus/luojing-jieding/luojing-jieding-juan1-transcript.md（AI 目视转录·预留人工校验）
# 条目标记：<!--ENTRY:tag|title|trust-->
import sqlite3, hashlib, datetime, re, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
DB = str(ROOT / 'server/database/yidao.db')
MD = ROOT / 'corpus/luojing-jieding/luojing-jieding-juan1-transcript.md'
MODULE = 'luojing-jieding'
CATEGORY = '阳宅-罗经'
NOW = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')

raw = MD.read_text(encoding='utf-8')
pat = re.compile(r'<!--ENTRY:([^|]+)\|([^|]+)\|([\d.]+)-->')
marks = list(pat.finditer(raw))
assert marks, '未发现 ENTRY 标记'
entries = []
for i, m in enumerate(marks):
    body = raw[m.end(): marks[i+1].start() if i+1 < len(marks) else len(raw)].strip()
    assert body, f'条目 {m.group(1)} 内容为空'
    entries.append(dict(tag=m.group(1).strip(), title=m.group(2).strip(),
                        trust=float(m.group(3)), content=body))
print(f'解析 {len(entries)} 条：' + '、'.join(e['tag'] for e in entries))

def eid(tag):
    return 'KB-LJ-' + hashlib.md5(tag.encode()).hexdigest()[:12]

import subprocess
from lib.kb_ingest import KBIngestor
from yidao_safe import safe_close

db = sqlite3.connect(DB, timeout=120)
c = db.cursor()
ing = KBIngestor(db)
SRC = 'luojing-jieding:NLC511-13056616-69088上冊(AI目視轉錄·預留人工校驗)'
n = len(entries)
for e in entries:
    kw = e['content'].split('關鍵詞：')[-1].strip() if '關鍵詞：' in e['content'] else ''
    ing.upsert(entry_id=eid(e['tag']), module=MODULE, title=e['title'],
               content=e['content'], src_id=SRC, category=CATEGORY,
               keywords=kw, tags=kw, trust=e['trust'], source='corpus-rebuild')
c.execute("""INSERT INTO kb_module_registry (module, std_group, display_name, domain, entry_count, note, updated_at)
  VALUES (?,?,?,?,?,?,?) ON CONFLICT(module) DO UPDATE SET entry_count=excluded.entry_count, note=excluded.note, updated_at=excluded.updated_at""",
  (MODULE, '阳宅', '罗经解定', 'mingli', n,
   '清胡国桢罗盘学专著；卷一括言+天池章全录；AI目视转录trust0.75预留人工校验；余卷OCR挂账', NOW))
c.execute("INSERT OR REPLACE INTO kb_src_registry (src_id, description, level, avg_trust, entry_count, created_at) VALUES (?,?,?,?,?,?)",
  ('SRC-LUOJING-20261021', '罗经解定卷一：NLC511上册AI目视转录（括言+天池章）', 'classic', 0.77, n, NOW))
ing.commit()
db.commit()
safe_close(db)
subprocess.run([sys.executable, str(ROOT / 'scripts/kb-sync-guard.py'), '--sync', '1'], cwd=ROOT, check=True)
print(f'可重入语料 {n} 条，module={MODULE}；{ing.stats()}')
db = sqlite3.connect(DB, timeout=120)
try:
    print('formal:', db.execute('SELECT COUNT(*) FROM kb_formal WHERE module=?', (MODULE,)).fetchone()[0])
    print('fts5:', db.execute('SELECT COUNT(*) FROM kb_fts5 WHERE module=?', (MODULE,)).fetchone()[0])
finally:
    safe_close(db)
