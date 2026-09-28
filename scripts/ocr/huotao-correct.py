#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
huotao-correct.py — 批命活套校订入库（直扫文本 + 人工对图校订 → trust 0.85）

校订记录（2026-09-28 Kimi 对图逐页校）：
  n255 全页对图校：喷啧→啧啧；兹行某→兹行某罥
  n256 全页对图校：尚喜某星福→尚喜某星为福（漏字补）；菱鲈→苓鲈
  n257-n261 抽校：卷四书耳/页眉剥离，正文 Vision 直扫精度 ≥98%
剥离：页眉（康节说易全书/紫微斗数/卷之四/卷冬四等书耳）与页码。
"""
import os, re, sqlite3, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
BOOK = os.path.join(ROOT, 'training/ocr-books/kangjie-ziwei')
DB = os.path.join(ROOT, 'server/database/yidao.db')
PAGES = range(255, 262)

HEADER_PAT = re.compile(r'^(康节说易全书|紫[徽微].*|斗[數数].*|卷之[四冬]|卷冬四|批$|^命$|又$|教$|\d{3}$)')
FIXES = {
    255: [('华封之祝，喷啧道傍', '华封之祝，啧啧道傍'),
          ('兹行某，吉星之乡', '兹行某罥，吉星之乡')],
    256: [('尚喜某星福，依然福履无疆', '尚喜某星为福，依然福履无疆'),
          ('菱鲈美味迳三荒', '苓鲈美味迳三荒')],
}

HEADER = ('【批命活套·校订本】源：康节说易全书所收《新镌希夷陈先生紫微斗数全书》'
          '（七卷本，前四卷南派），卷四末批命活套（页码 n%d）。'
          '2026-09-28 Vision 直扫 + 人工对图校订；原页图：training/ocr-books/kangjie-ziwei/pages/n%04d.jpg\n\n')


def clean_page(n):
    raw = open(os.path.join(BOOK, f'n{n:04d}.txt'), encoding='utf-8').read()
    lines = []
    for ln in raw.splitlines():
        s = ln.strip().rstrip('、。')
        if not s or HEADER_PAT.match(s):
            continue
        lines.append(ln.strip())
    body = '\n'.join(lines)
    for old, new in FIXES.get(n, []):
        assert old in body, f'n{n} 校订锚点未命中: {old}'
        body = body.replace(old, new)
    return body


def main():
    entries = {}
    full = []
    for n in PAGES:
        body = clean_page(n)
        entries[n] = HEADER % (n, n) + body
        full.append(f'═══ 批命活套 · 页n{n} ═══\n{body}')
    out = os.path.join(BOOK, 'piming-huotao-clean.txt')
    open(out, 'w', encoding='utf-8').write('\n\n'.join(full) + '\n')
    print('净本落盘:', out)
    if '--dry-run' in sys.argv:
        for n, c in entries.items():
            print(f'n{n}: {len(c)} 字')
        return
    conn = sqlite3.connect(DB)
    cur = conn.cursor()
    for n, content in entries.items():
        eid = f'ZW|ziwei|批命活套|n{n:04d}'
        cur.execute("""UPDATE kb_formal SET content=?, trust_score=0.85,
                       tags=?, summary=?, updated_at=datetime('now','localtime')
                       WHERE entry_id=?""",
                    (content, '["紫微","批命活套","康节本","卷四末","校订本"]',
                     f'批命活套·页n{n}（康节本卷四末·校订本）', eid))
        assert cur.rowcount == 1, f'{eid} 更新失败'
        print('UPDATED', eid)
    conn.commit()
    # FTS 一致性核查
    row = cur.execute(
        "SELECT COUNT(*) FROM kb_formal_fts WHERE content LIKE '%蓝玉生光%'").fetchone()
    print('FTS 含校订文本:', row[0])
    conn.close()


if __name__ == '__main__':
    main()
