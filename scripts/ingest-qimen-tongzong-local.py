#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""奇门遁甲统宗入库（S0.2 · 2026-09-26 · Kimi）

源：corpus/qimen-tongzong/qimen-tongzong.txt
  - xuanxuecenter.com 直下 PDF（files/qi_men_dun_jia_tong_zong.pdf，64 页），
    pypdf 提取净文本 48,374 字
  - 白下醉鹤老人鉴定本《奇门遁甲统宗》——注意：此本卷四至卷九原书标注「略」，
    实收卷首（序/源流/凡例）+ 卷一二三（起例/四十格/类神）+ 卷十至十二（玄机赋上中下）
  - 玄机赋为奇门占断核心歌赋，与烟波钓叟歌并称
书目：奇门遁甲统宗（残本七卷：起例格局类神三卷 + 玄机赋三卷 + 卷首）
字段：module=qimen，trust=0.95，src_id=xuanxue:qimen-tongzong,
      status=formal, domain=mingli, 指纹幂等（entry_id/title 双查重）
用法：/usr/bin/python3 scripts/ingest-qimen-tongzong-local.py
"""
import sqlite3, json, hashlib, time, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT / 'server' / 'database' / 'yidao.db'
SRC = ROOT / 'corpus' / 'qimen-tongzong' / 'qimen-tongzong.txt'
NOW = time.strftime('%Y-%m-%d %H:%M:%S')

def fp(s): return 'XUAN|' + hashlib.sha1(s.encode('utf-8')).hexdigest()[:16]

def split_juan(txt):
    """按卷标记切分；返回 [(卷名, 正文)]"""
    marks = list(re.finditer(r'奇门遁甲统宗卷之([一二三四五六七八九十]+)\n([^\n]*)', txt))
    # 剔除「卷之四～九（略）」这类省略标记行
    marks = [m for m in marks if '略' not in m.group(0)]
    parts = []
    front = txt[:marks[0].start()].strip()
    if front:
        parts.append(('卷首·序源流凡例', front))
    names = {'一': '卷一·秘诀总赋起例格局', '二': '卷二·妙秘赋八卦类神', '三': '卷三·天干类神',
             '十': '卷十·玄机赋上', '十一': '卷十一·玄机赋中', '十二': '卷十二·玄机赋下'}
    for i, m in enumerate(marks):
        end = marks[i + 1].start() if i + 1 < len(marks) else len(txt)
        body = txt[m.start():end].strip()
        parts.append((names.get(m.group(1), f'卷{m.group(1)}'), body))
    return parts

def main():
    conn = sqlite3.connect(DB, timeout=120)
    conn.execute('PRAGMA busy_timeout=120000')
    txt = SRC.read_text(encoding='utf-8')
    ins = skip = 0
    for sub, body in split_juan(txt):
        if len(body) < 120:
            print(f'[skip] {sub} 过短'); continue
        kb_title = f'原典·奇门遁甲统宗·{sub}'
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
            eid = 'KB-QM-' + hashlib.md5(t2.encode()).hexdigest()[:10]
            if conn.execute('SELECT 1 FROM kb_formal WHERE entry_id=? OR title=?', (eid, t2)).fetchone():
                skip += 1; continue
            full = (f'【奇门遁甲统宗·{sub}】（白下醉鹤老人鉴定本；奇门占断核心原典，'
                    f'玄机赋与烟波钓叟歌并称；此本卷四至九原书阙略）\n\n' + c)
            conn.execute("""INSERT INTO kb_formal
                (entry_id, module, title, content, src_id, category, keywords, summary,
                 trust_score, version, promoted_at, promoted_from, status, fingerprint, domain, tags)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                (eid, 'qimen', t2, full, 'xuanxue:qimen-tongzong', 'xuanxue-qimen-tongzong',
                 json.dumps(['奇门遁甲统宗', '奇门', '玄机赋', sub[:12]], ensure_ascii=False),
                 c[:80], 0.95, '1.0', NOW, 'kimi-s02-qimen-tongzong', 'formal', fp(full), 'mingli',
                 json.dumps(['原典', '奇门遁甲统宗', '奇门', '醉鹤老人'], ensure_ascii=False)))
            ins += 1
        print(f'[{sub}] {len(body)} 字符 → {len(chunks)} 块，累计入库 {ins} / 跳过 {skip}')
    conn.commit()
    total = conn.execute("SELECT COUNT(*) FROM kb_formal").fetchone()[0]
    print(f'✅ 奇门统宗入库 {ins} 条（跳过 {skip}），KB 总量 {total}')
    conn.close()

if __name__ == '__main__':
    main()
