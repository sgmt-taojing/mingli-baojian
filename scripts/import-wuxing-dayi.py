#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""五行大义（维基文库净本 · 隋·萧吉）入库
切块：== 章节 == 标题 + ¶ 段界 ≤3000 字；KBIngestor 幂等；trust=0.95。
module=wuxing / category=五行大义 / src_id=wikisource:wuxing-dayi / domain=mingli（门类 八字·五行底层理论）"""
import re, sys, time, sqlite3
from pathlib import Path
sys.path.insert(0, 'scripts')
from lib.kb_ingest import KBIngestor

SRC = Path('corpus/wuxing-dayi')
DB = 'server/database/yidao.db'
CN = ['', '一', '二', '三', '四', '五']

def clean(txt):
    txt = re.sub(r'={2,}\s*([^=]+?)\s*={2,}', r'\n\1\n', txt)  # == 节题 == → 行
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
            for f in sorted(SRC.glob('juan*.txt')):
                juan = int(f.stem.replace('juan', ''))
                jc = f'卷{CN[juan]}'
                body = clean(f.read_text(encoding='utf-8'))
                if len(body) < 50: continue
                for ci, ck in enumerate(chunks(body), 1):
                    head = re.sub(r'\s', '', ck)[:18]
                    ok, why = ing.insert(
                        entry_id=f'WSWXDY|wuxing|{juan:02d}|{ci:03d}',
                        module='wuxing', title=f'原典·五行大义·{jc}（{head}…）', content=ck,
                        category='五行大义',
                        keywords=f'五行大义 五行 古籍原文 {jc} 萧吉 八字',
                        summary=re.sub(r'\s+', ' ', ck)[:100],
                        src_id='wikisource:wuxing-dayi',
                        tags=['五行大义', '五行', '古籍原文'], domain='mingli',
                        trust=0.95, source='wikisource')
                    if ok: n += 1
            ing.conn.commit(); con.commit()
            c = con.execute("SELECT COUNT(*) FROM kb_formal WHERE category='五行大义'").fetchone()[0]
            print(f'入库 {n} 条（幂等跳过 {ing.duplicates}）；category=五行大义 累计 {c}')
            con.close()
            sys.exit(0)
        except sqlite3.OperationalError as e:
            print(f'[{attempt+1}/12] 锁库等待… {e}', flush=True); time.sleep(60)
    print('12 次重试仍锁'); sys.exit(1)

if __name__ == '__main__':
    main()
