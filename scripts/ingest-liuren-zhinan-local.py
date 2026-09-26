#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""大六壬指南注解本入库（批17 · 六壬原典零突破 · 2026-09-25 · Kimi）

源：corpus/liuren-zhinan/*.txt
  - 主体：xuanxuecenter.com《注解大六壬指南》PDF 文本层（175 页全本，
    明·陈公献著、庄公远较正，含今人陈剑注解——已标注，原文与注并存，
    属正式出版注解本，非二手拼接网文）
  - 背景：四库未收六壬书；维基文库仅存两序（卷页红链未转录）；
    国图扫描 PDF OCR 层噪不可用；newdu 仅卷一可达（s200331 卷二页 500）
书目：大六壬指南（六壬占断第一案例派原典：心印赋/指掌赋注释+会纂占验125案+神煞指南）
字段：module=liuren（新域，六壬原典零突破），trust=0.95，src_id=pdf:xuanxuecenter-liu_ren_zhi_nan,
      status=formal, domain=mingli, 指纹幂等（entry_id/title 双查重）
用法：/usr/bin/python3 scripts/ingest-liuren-zhinan-local.py
"""
import sqlite3, json, hashlib, time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT / 'server' / 'database' / 'yidao.db'
SRC = ROOT / 'corpus' / 'liuren-zhinan'
NOW = time.strftime('%Y-%m-%d %H:%M:%S')

FILES = [
    ('juan0-xu.txt', '卷首·序'),
    ('juan1.txt', '卷一·注释心印赋'),
    ('juan2.txt', '卷二·注释指掌赋'),
    ('juan3.txt', '卷三·会纂占验指南'),
    ('juan4.txt', '卷四·神煞指南'),
]

def fp(s): return 'PDF|' + hashlib.sha1(s.encode('utf-8')).hexdigest()[:16]

def main():
    conn = sqlite3.connect(DB, timeout=120)
    conn.execute('PRAGMA busy_timeout=120000')
    ins = skip = 0
    for fname, sub in FILES:
        body = (SRC / fname).read_text(encoding='utf-8').strip()
        if len(body) < 120:
            print(f'[skip] {fname} 过短'); continue
        kb_title = f'原典·大六壬指南·{sub}'
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
            eid = 'KB-LR-' + hashlib.md5(t2.encode()).hexdigest()[:10]
            if conn.execute('SELECT 1 FROM kb_formal WHERE entry_id=? OR title=?', (eid, t2)).fetchone():
                skip += 1; continue
            full = (f'【大六壬指南·{sub}】（明·陈公献著，庄公远较正；注解本，含今人注解，原文与注并存）\n\n' + c)
            conn.execute("""INSERT INTO kb_formal
                (entry_id, module, title, content, src_id, category, keywords, summary,
                 trust_score, version, promoted_at, promoted_from, status, fingerprint, domain, tags)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                (eid, 'liuren', t2, full, 'pdf:xuanxuecenter-liu_ren_zhi_nan', 'pdf-liuren-zhinan',
                 json.dumps(['大六壬指南', '六壬', sub[:12]], ensure_ascii=False),
                 c[:80], 0.95, '1.0', NOW, 'kimi-p17-liuren-zhinan', 'formal', fp(full), 'mingli',
                 json.dumps(['原典', '大六壬指南', '六壬', '注解本'], ensure_ascii=False)))
            ins += 1
        conn.commit()
        print(f'[{sub}] {len(body)} 字符 → {len(chunks)} 块，累计入库 {ins} / 跳过 {skip}')
    total = conn.execute("SELECT COUNT(*) FROM kb_formal").fetchone()[0]
    print(f'✅ 大六壬指南入库 {ins} 条（跳过 {skip}），KB 总量 {total}')
    conn.close()

if __name__ == '__main__':
    main()
