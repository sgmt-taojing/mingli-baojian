#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# P2 · 雪心赋 全赋入库（module: xuexinfu）
# 文本源：corpus/xuexinfu/xuexinfu-transcript.md（机器OCR两本互校·预留人工校验）
# 条目标记：<!--ENTRY:tag|title|trust-->
import sqlite3, hashlib, datetime, re, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
DB = str(ROOT / 'server/database/yidao.db')
MD = ROOT / 'corpus/xuexinfu/xuexinfu-transcript.md'
MODULE = 'xuexinfu'
CATEGORY = '阳宅-形势'
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
    return 'KB-XX-' + hashlib.md5(tag.encode()).hexdigest()[:12]

import subprocess, sys
from lib.kb_ingest import KBIngestor
from yidao_safe import safe_close

db = sqlite3.connect(DB, timeout=120)
c = db.cursor()
ing = KBIngestor(db)
SRC = 'xuexinfu:SDZJ0175句解本+NGJ宅葬書本(機器OCR兩本互校·預留人工校驗)'
n = len(entries)
for e in entries:
    kw = e['content'].split('關鍵詞：')[-1].strip() if '關鍵詞：' in e['content'] else ''
    ing.upsert(entry_id=eid(e['tag']), module=MODULE, title=e['title'],
               content=e['content'], src_id=SRC, category=CATEGORY,
               keywords=kw, tags=kw, trust=e['trust'], source='corpus-rebuild')
c.execute("""INSERT INTO kb_module_registry (module, std_group, display_name, domain, entry_count, note, updated_at)
  VALUES (?,?,?,?,?,?,?) ON CONFLICT(module) DO UPDATE SET entry_count=excluded.entry_count, note=excluded.note, updated_at=excluded.updated_at""",
  (MODULE, '阳宅', '雪心赋', 'mingli', n,
   '唐卜应天（则巍）著·明谢子期句解；全赋二十章+序跋，机器OCR两本互校trust0.7-0.85预留人工校验；谢注全注挂账待校', NOW))
c.execute("INSERT OR REPLACE INTO kb_src_registry (src_id, description, level, avg_trust, entry_count, created_at) VALUES (?,?,?,?,?,?)",
  ('SRC-XUEXINFU-20261021', '雪心赋全赋：句解本SDZJ0175+宅葬書本NGJ机器OCR互校组装（二十章+序跋）', 'classic', 0.77, n, NOW))
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
