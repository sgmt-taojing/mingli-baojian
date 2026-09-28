#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ingest-ziwei-daozang.py — 道藏版《紫微斗數》入库（KR5h0055 · 正統道藏本 · 2026-09-28）

与库内维基文库《紫微斗數全書》3 卷本**不同版本**：道藏本更早，含「論次序/看八字强弱」
等独有纲目。单文件三卷（卷一終@1165、卷二@1878、卷三終@2665）。
清洗 mandoku 标记（# 头/<pb:>/¶）后按卷切段，新口径入库。
"""
import re, sqlite3, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from lib.kb_ingest import KBIngestor, fingerprint_of

DB = Path(__file__).parent.parent / 'server' / 'database' / 'yidao.db'
SRC = Path('/tmp/kr5h0055.txt')
BOOK = '紫微斗數（正統道藏本）'


def clean(txt):
    txt = re.sub(r'^#.*\n', '', txt, flags=re.M)
    txt = re.sub(r'<[^>]+>', '', txt)
    txt = txt.replace('¶', '')
    txt = re.sub(r'\n{3,}', '\n\n', txt)
    return txt.strip()


def main():
    txt = clean(SRC.read_text(encoding='utf-8'))
    # 道藏本结构：卷标在卷尾（卷之一終@16181 / 卷之二@25346 / 卷之三終@35137），驅一/驅二/驅三对应三卷
    i1 = txt.find('紫微斗數卷之一終')
    i2 = txt.find('紫微斗數卷之二')
    i3 = txt.find('紫微斗數卷之三終')
    assert 0 < i1 < i2 < i3, f'卷锚点异常: {i1},{i2},{i3}'
    vol_texts = {
        '卷一': txt[:i1 + len('紫微斗數卷之一終')],
        '卷二': txt[i1 + len('紫微斗數卷之一終'):i2 + len('紫微斗數卷之二')],
        '卷三': txt[i2 + len('紫微斗數卷之二'):i3 + len('紫微斗數卷之三終')],
    }
    conn = sqlite3.connect(str(DB))
    ing = KBIngestor(conn)
    for vol, body in vol_texts.items():
        body = body.strip()
        if len(body) < 200:
            print(f'{vol}: 内容过短（{len(body)} 字）跳过'); continue
        content = (f'【{BOOK}·{vol}】（公有领域原典·Kanripo 正統道藏本 KR5h0055）\n\n{body}\n\n'
                   f'关键词：紫微斗数 道藏本 {vol} 安星 格局')
        eid = f"KR|ziwei|道藏紫微|{vol}|{fingerprint_of(content)[:8]}"
        ok, why = ing.insert(
            entry_id=eid, module='ziwei', title=f'原典·{BOOK}·{vol}',
            content=content, category='ziwei',
            keywords=f'紫微斗数,道藏本,{vol},安星,格局',
            summary=f'正統道藏本紫微斗數{vol}（与维基全書本不同版本）',
            tags=['紫微斗数', '道藏本', '原典', 'kanripo', vol],
            domain='mingli', trust=0.95, source='kanripo')
        print(f'{vol}: {"+" if ok else "✗ " + why}（{len(body)} 字）')
    ing.commit()
    try:
        conn.execute("INSERT INTO kb_formal_fts(kb_formal_fts) VALUES('rebuild')")
        conn.commit()
    except Exception as e:
        print('FTS rebuild:', e)
    f = conn.execute('SELECT COUNT(*) FROM kb_formal').fetchone()[0]
    t = conn.execute('SELECT COUNT(*) FROM kb_formal_fts').fetchone()[0]
    print(f'═══ {ing.stats()} · formal={f} fts={t} 对齐={f == t}')
    conn.close()


if __name__ == '__main__':
    main()
