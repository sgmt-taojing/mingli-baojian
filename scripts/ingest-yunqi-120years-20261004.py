#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""KB-YQ-021 五运六气双甲子速查入库（R-YQ-120 · 2026-10-04 Kimi）
读 training/yunqi-120years.json（gen-yunqi-60jiazi-20261004.js 引擎同源产物）入 kb_formal。
指纹幂等可复跑。用法：/usr/bin/python3 scripts/ingest-yunqi-120years-20261004.py
"""
import json, sqlite3, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from lib.kb_ingest import KBIngestor

ROOT = Path(__file__).resolve().parent.parent
d = json.load(open(ROOT / 'training' / 'yunqi-120years.json', encoding='utf-8'))
conn = sqlite3.connect(ROOT / 'server' / 'database' / 'yidao.db')
ing = KBIngestor(conn, batch_size=10)
ok, why = ing.insert(
    entry_id=f"KB-YQ-021|yunqi|120years",
    module='yunqi', title=d['title'], content=d['content'], category='yunqi',
    keywords='["五运六气","岁运","司天","在泉","天符","岁会","太乙天符","速查"]',
    src_id='computed-verifiable', domain='mingli', trust=0.90,
    source='kimi-gen-yunqi-120years-20261004')
ing.commit()
print(f'KB-YQ-021 入库: ok={ok} why={why}')
conn.close()
