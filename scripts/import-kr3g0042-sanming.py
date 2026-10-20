#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""三命通会（Kanripo KR3g0042 · 文渊阁四库本）净本入库
切块：卷 → ¶ 段界 ≤3000 字块；title=原典·三命通会·卷NN（首句…）照协纪范式。
口径：KBIngestor 指纹幂等；trust=0.95 古典原典；category=三命通会；src_id=kanripo:KR3g0042。
收尾：scripts/kb-sync-guard.py --sync 1"""
import re, sys, time, sqlite3
from pathlib import Path
sys.path.insert(0, 'scripts')
from lib.kb_ingest import KBIngestor

SRC = Path('corpus/sanming-tonghui')
DB = 'server/database/yidao.db'
JUAN_CN = ['提要', '卷一', '卷二', '卷三', '卷四', '卷五', '卷六', '卷七', '卷八', '卷九', '卷十', '卷十一', '卷十二']

def clean(txt):
    txt = re.sub(r'(?m)^#.*$', '', txt)                 # mandoku 头
    txt = re.sub(r'<pb:[^>]*>¶?', '', txt)              # 页码锚
    txt = txt.replace('¶', '\n')
    txt = re.sub(r'\n{3,}', '\n\n', txt)
    return txt.strip()

def chunks(txt, lim=3000):
    paras = [p for p in txt.split('\n') if p.strip()]
    out, buf = [], ''
    for p in paras:
        if len(buf) + len(p) > lim and buf:
            out.append(buf); buf = p
        else:
            buf += ('\n' if buf else '') + p
    if buf: out.append(buf)
    return out

def main():
    for attempt in range(12):
        try:
            con = sqlite3.connect(DB, timeout=120)
            ing = KBIngestor(con, batch_size=300)
            n = 0
            for f in sorted(SRC.glob('KR3g0042_*.txt')):
                juan = int(f.stem.split('_')[1])
                jc = JUAN_CN[juan] if juan < len(JUAN_CN) else f'卷{juan}'
                body = clean(f.read_text(encoding='utf-8'))
                if len(body) < 50: continue
                for ci, ck in enumerate(chunks(body), 1):
                    head = re.sub(r'\s', '', ck)[:18]
                    title = f'原典·三命通会·{jc}（{head}…）' if juan else f'原典·三命通会·提要（{head}…）'
                    ok, why = ing.insert(
                        entry_id=f'KR3g0042|bazi|{juan:02d}|{ci:03d}',
                        module='bazi', title=title, content=ck,
                        category='三命通会',
                        keywords=f'三命通会 八字 古籍原文 {jc} 万民英 子平',
                        summary=re.sub(r'\s+', ' ', ck)[:100],
                        src_id='kanripo:KR3g0042',
                        tags=['三命通会', '八字', '古籍原文'], domain='mingli',
                        trust=0.95, source='kanripo')
                    if ok: n += 1
            ing.conn.commit(); con.commit()
            c = con.execute("SELECT COUNT(*) FROM kb_formal WHERE category='三命通会'").fetchone()[0]
            print(f'入库 {n} 条（幂等跳过 {ing.duplicates}）；category=三命通会 累计 {c}')
            con.close()
            print('下一步：/usr/bin/python3 scripts/kb-sync-guard.py --sync 1')
            sys.exit(0)
        except sqlite3.OperationalError as e:
            print(f'[{attempt+1}/12] 锁库等待… {e}', flush=True); time.sleep(60)
    print('12 次重试仍锁'); sys.exit(1)

if __name__ == '__main__':
    main()
