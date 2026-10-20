#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""周易集解（Kanripo KR1a0008 · 唐·李鼎祚）净本入库
范式同 import-kr3g0042-sanming.py：¶ 段界 ≤3000 字块，KBIngestor 幂等，trust=0.95。
module=yijing / category=周易集解 / src_id=kanripo:KR1a0008 / domain=mingli（门类标签 易卦）"""
import re, sys, time, sqlite3
from pathlib import Path
sys.path.insert(0, 'scripts')
from lib.kb_ingest import KBIngestor

SRC = Path('corpus/zhouyi-jijie')
DB = 'server/database/yidao.db'
CN = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
      '十一', '十二', '十三', '十四', '十五', '十六', '十七']

def clean(txt):
    txt = re.sub(r'(?m)^#.*$', '', txt)
    txt = re.sub(r'<pb:[^>]*>¶?', '', txt)
    txt = txt.replace('¶', '\n')
    return re.sub(r'\n{3,}', '\n\n', txt).strip()

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
            for f in sorted(SRC.glob('KR1a0008_*.txt')):
                juan = int(f.stem.split('_')[1])
                jc = '提要' if juan == 0 else f'卷{CN[juan]}'
                body = clean(f.read_text(encoding='utf-8'))
                if len(body) < 50: continue
                for ci, ck in enumerate(chunks(body), 1):
                    head = re.sub(r'\s', '', ck)[:18]
                    ok, why = ing.insert(
                        entry_id=f'KR1a0008|yijing|{juan:02d}|{ci:03d}',
                        module='yijing', title=f'原典·周易集解·{jc}（{head}…）', content=ck,
                        category='周易集解',
                        keywords=f'周易集解 易卦 古籍原文 {jc} 李鼎祚 易学',
                        summary=re.sub(r'\s+', ' ', ck)[:100],
                        src_id='kanripo:KR1a0008',
                        tags=['周易集解', '易卦', '古籍原文'], domain='mingli',
                        trust=0.95, source='kanripo')
                    if ok: n += 1
            ing.conn.commit(); con.commit()
            c = con.execute("SELECT COUNT(*) FROM kb_formal WHERE category='周易集解'").fetchone()[0]
            print(f'入库 {n} 条（幂等跳过 {ing.duplicates}）；category=周易集解 累计 {c}')
            con.close()
            sys.exit(0)
        except sqlite3.OperationalError as e:
            print(f'[{attempt+1}/12] 锁库等待… {e}', flush=True); time.sleep(60)
    print('12 次重试仍锁'); sys.exit(1)

if __name__ == '__main__':
    main()
