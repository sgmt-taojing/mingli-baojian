#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""R15 伤寒论补强 part3: 条文精选 7 条 (139-145)"""
import sqlite3

DB = '/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/server/database/yidao.db'

DATA = [
("139","伤寒论条文：太阳病发热汗出恶风","条文","太阳病发热汗出恶风脉缓者名为中风。","SRC-CLASSIC-SHJ","太阳中风,条文,发热汗出恶风","条文：太阳中风主脉证",0.95,0.95),
("140","伤寒论条文：阳明病胃家实","条文","阳明之为病胃家实是也。","SRC-CLASSIC-SHJ","阳明病,条文,胃家实","条文：阳明病提纲",0.95,0.95),
("141","伤寒论条文：少阳病口苦咽干目眩","条文","少阳之为病口苦咽干目眩也。","SRC-CLASSIC-SHJ","少阳病,条文,口苦咽干目眩","条文：少阳病提纲",0.95,0.95),
("142","伤寒论条文：太阴病腹满吐利","条文","太阴之为病腹满而吐食不下自利益甚时腹自痛。","SRC-CLASSIC-SHJ","太阴病,条文,腹满吐利","条文：太阴病提纲",0.95,0.95),
("143","伤寒论条文：少阴病脉微细但欲寐","条文","少阴之为病脉微细但欲寐也。","SRC-CLASSIC-SHJ","少阴病,条文,脉微细但欲寐","条文：少阴病提纲",0.95,0.95),
("144","伤寒论条文：厥阴病消渴气上撞心","条文","厥阴之为病消渴气上撞心心中疼热饥而不欲食食则吐蛔。","SRC-CLASSIC-SHJ","厥阴病,条文,消渴气上撞心","条文：厥阴病提纲",0.95,0.95),
("145","伤寒论条文：少阴病下利脉微","条文","少阴病下利脉微者与白通汤。利不止厥逆无脉干呕烦者白通加猪胆汁汤主之。","SRC-CLASSIC-SHJ","少阴病,条文,下利脉微,白通汤","条文：少阴下利白通汤证",0.95,0.95),
]

conn = sqlite3.connect(DB)
cur = conn.cursor()
n = 0
for entry in DATA:
    idx, title, category, content, src, kw, summary, ts, conf = entry
    eid = f'r15-shanghan-lun-{idx}'
    sql = """
INSERT OR IGNORE INTO kb_formal (
  entry_id, module, title, content, src_id, category, keywords, summary,
  trust_score, version, promoted_at, promoted_from, reviewed_by,
  hit_count, last_hit, tags, source_ids, confidence, access_level, difficulty, status
) SELECT
  ?, 'shanghan-lun', ?, ?, ?, ?, ?, ?,
  ?, 'v1', CURRENT_TIMESTAMP, 'audit-auto', 'audit-auto',
  0, NULL, '[]', ?, ?, 'registered', 'intermediate', 'formal'
FROM (SELECT 1) WHERE NOT EXISTS (
  SELECT 1 FROM kb_formal WHERE entry_id = ?
);
"""
    kw_json = '["' + '","'.join(kw.split(',')) + '"]'
    cur.execute(sql, (eid, title, content, src, category, kw_json, summary, ts, f'["{src}"]', conf, eid))
conn.commit()
cur.execute("SELECT COUNT(*) FROM kb_formal WHERE module='shanghan-lun'")
final = cur.fetchone()[0]
print(f"PART3: inserted={len(DATA)}, total shanghan-lun = {final}")
conn.close()
