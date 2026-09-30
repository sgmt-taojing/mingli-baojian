#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""穷通宝鉴 · 十干十二月调候提要差集清零（G26 R2 补蒸馏 · 2026-09-30 Kimi）

背景：kimi-t1-batch3-qiongtong 已入 105/120 干月组合（原典全文切片 trust 0.95）。
覆盖审计发现 15 缺，其中 2 项（八月/九月丁火）由既有「八九月丁火」合论条目覆盖，
实缺 13：
  - 十二月乙木   —— 原文「乙木生于冬至之后」段（L267）
  - 十二月丁火   —— 原文「三冬丁火」合论段（L564-578）
  - 十一/十二月戊土 —— 原文「十一二月」合论段（L711-722）
  - 四月~十二月己土 9 条 —— 原文三夏/三秋/三冬己土合论段（L759-813）
口径：原典原文不改写，按月拆条，合论处在首行题注标明；
      module=bazi / src_id=qiongtong-baojian / trust 0.95 / domain=mingli /
      status=formal / 指纹幂等（KBIngestor 统一新口径 R-INGEST-SPEC-20260927）。
用法：/usr/bin/python3 scripts/ingest-qiongtong-gapfill-20260930.py
"""
import sqlite3, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from lib.kb_ingest import KBIngestor

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT / 'server' / 'database' / 'yidao.db'
TXT = ROOT / 'corpus' / 'qiongtong-baojian' / 'full.txt'

lines = TXT.read_text(encoding='utf-8').split('\n')

def span(start_anchor, end_anchor=None, start_occ=1):
    """按锚点切原文跨度（含首尾行）。end_anchor=None 取单行。"""
    si = ei = None
    occ = 0
    for i, l in enumerate(lines):
        if si is None and start_anchor in l:
            occ += 1
            if occ == start_occ:
                si = i
        elif si is not None and end_anchor and end_anchor in l:
            ei = i
            break
    assert si is not None, f'锚点未命中: {start_anchor}'
    if ei is None:
        assert end_anchor is None, f'尾锚点未命中: {end_anchor}'
        ei = si
    body = '\n'.join(l for l in lines[si:ei + 1] if l.strip() and not l.strip().startswith('|'))
    return body

# 原文跨度
SPAN_DONGZHI_YI = span('乙木生于冬至之后')                       # 十二月乙木
SPAN_SANDONG_DING = span('三冬丁火微寒', '癸戊权宜酌用可也')      # 十二月丁火
SPAN_DONG_WU = span('**十一二月** 严寒冰冻', '以金为妻、水为子')  # 十一二月戊土
SPAN_XIA_JI = span('三夏己土', '用癸者、金妻水子。用丙者，木妻火子')
SPAN_QIU_JI = span('三秋己土', '九月土盛，宜甲木疏之，余皆酌用')
SPAN_DONG_JI = span('三冬己土', '丙藏、富贵奇特之命')

ENTRIES = [
    ('十二月乙木', '乙', SPAN_DONGZHI_YI,
     '原书以「乙木生于冬至之后」段论腊月乙木，附于十一月乙木章末。'),
    ('十二月丁火', '丁', SPAN_SANDONG_DING,
     '原书三冬丁火合论（十月另见单章，十一月已入库），本段统论冬丁取用。'),
    ('十一月戊土', '戊', SPAN_DONG_WU,
     '原书十一二月戊土合论，腊月戊土同此取用。'),
    ('十二月戊土', '戊', SPAN_DONG_WU,
     '原书十一二月戊土合论，仲冬戊土同此取用。'),
    ('四月己土', '己', SPAN_XIA_JI, '原书三夏己土合论，四五六月同此取用。'),
    ('五月己土', '己', SPAN_XIA_JI, '原书三夏己土合论，四五六月同此取用。'),
    ('六月己土', '己', SPAN_XIA_JI, '原书三夏己土合论，四五六月同此取用。'),
    ('七月己土', '己', SPAN_QIU_JI, '原书三秋己土合论，七八九月同此取用。'),
    ('八月己土', '己', SPAN_QIU_JI, '原书三秋己土合论，七八九月同此取用；八月另有「支成金局」专论附后。'),
    ('九月己土', '己', SPAN_QIU_JI, '原书三秋己土合论，七八九月同此取用；九月土盛宜甲木疏之。'),
    ('十月己土', '己', SPAN_DONG_JI, '原书三冬己土合论，十十一十二月同此取用；初冬壬旺取戊制之。'),
    ('十一月己土', '己', SPAN_DONG_JI, '原书三冬己土合论，十十一十二月同此取用。'),
    ('十二月己土', '己', SPAN_DONG_JI, '原书三冬己土合论，十十一十二月同此取用。'),
]

def main():
    conn = sqlite3.connect(DB)
    ing = KBIngestor(conn, batch_size=50)
    for title_suffix, stem, body, note in ENTRIES:
        title = f'穷通宝鉴·{title_suffix}'
        content = f'【{title}】（公有领域原典）\n{note}\n\n{body}'
        ok, why = ing.insert(
            entry_id=f'KB-QT-GAP|bazi|{title_suffix}',
            module='bazi', title=title, content=content,
            category='bazi',
            keywords=f'["穷通宝鉴", "调候", "{stem}"]',
            src_id='qiongtong-baojian',
            domain='mingli', trust=0.95,
            source='kimi-g26-qiongtong-gapfill-20260930',
            dedup_title=True,
        )
        print(('OK ' if ok else 'SKIP ') + title, why)
    ing.commit()
    print(f'--- inserted={ing.inserted} duplicates={ing.duplicates}')
    conn.close()

if __name__ == '__main__':
    main()
