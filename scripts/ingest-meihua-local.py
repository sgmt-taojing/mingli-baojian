#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""梅花易數净本入库（P0-3 · 2026-09-25 · 维基文库公有领域三卷全本）

源：corpus/meihua-yishu/*.txt（zh.wikisource.org 原文，FetchURL 抓取落盘，
    因 wikisource API 当前直连不通，文本已人工转储，内容未改写）
书目：梅花易數（托名邵雍，明清占书，梅花/观梅数唯一原典）
字段：module=meihua（新域），trust=0.95（PD 原典），src_id=wikisource:梅花易數,
      status=formal, domain=mingli, 指纹幂等（entry_id/title 双查重）
用法：/usr/bin/python3 scripts/ingest-meihua-local.py
"""
import sqlite3, json, hashlib, time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT / 'server' / 'database' / 'yidao.db'
SRC = ROOT / 'corpus' / 'meihua-yishu'
NOW = time.strftime('%Y-%m-%d %H:%M:%S')

FILES = [
    ('juan0-xu.txt', '序與邵雍傳'),
    ('juan1.txt', '卷一·象數易理'),
    ('juan1-wanwu.txt', '卷一·八卦萬物類象'),
    ('juan2.txt', '卷二·體用生克'),
    ('juan3-sanyao.txt', '卷三·三要靈應'),
    ('juan3-zazhan.txt', '卷三·斷占總訣與雜占'),
]

def fp(s): return 'WS|' + hashlib.sha1(s.encode('utf-8')).hexdigest()[:16]

def main():
    conn = sqlite3.connect(DB, timeout=120)
    conn.execute('PRAGMA busy_timeout=120000')
    ins = skip = 0
    for fname, sub in FILES:
        body = (SRC / fname).read_text(encoding='utf-8').strip()
        if len(body) < 120:
            print(f'[skip] {fname} 过短'); continue
        kb_title = f'原典·梅花易数·{sub}'
        # 超帽均分（同批13逻辑）
        chunks = [body]
        if len(body) > 9000:
            ls, chunks, cb, cn = body.split('\n'), [], [], 0
            for l in ls:
                if cn > 8000 and cb:
                    chunks.append('\n'.join(cb)); cb, cn = [], 0
                cb.append(l); cn += len(l)
            if cb:
                chunks.append('\n'.join(cb))
        for i, c in enumerate(chunks, 1):
            t2 = kb_title + (f'·{i}' if len(chunks) > 1 else '')
            eid = 'KB-WS-' + hashlib.md5(t2.encode()).hexdigest()[:10]
            if conn.execute('SELECT 1 FROM kb_formal WHERE entry_id=? OR title=?', (eid, t2)).fetchone():
                skip += 1; continue
            full = f'【梅花易数·{sub}】（公有领域原典·维基文库）\n\n' + c
            conn.execute("""INSERT INTO kb_formal
                (entry_id, module, title, content, src_id, category, keywords, summary,
                 trust_score, version, promoted_at, promoted_from, status, fingerprint, domain, tags)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                (eid, 'meihua', t2, full, 'wikisource:梅花易數', 'wikisource-meihua',
                 json.dumps(['梅花易数', sub[:12]], ensure_ascii=False),
                 c[:80], 0.95, '1.0', NOW, 'kimi-p03-meihua-local', 'formal', fp(full), 'mingli',
                 json.dumps(['原典', '梅花易数', '维基文库'], ensure_ascii=False)))
            ins += 1
        conn.commit()
        print(f'[{sub}] 累计入库 {ins} / 跳过 {skip}')
    total = conn.execute("SELECT COUNT(*) FROM kb_formal WHERE status='formal'").fetchone()[0]
    print(f'✅ 梅花易数入库 {ins} 条（跳过 {skip}），KB 总量 {total}')
    conn.close()

if __name__ == '__main__':
    main()
