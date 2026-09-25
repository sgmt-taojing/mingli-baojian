#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""穷通宝鉴净本入库（命理知识密度翻倍计划 · 2026-09-25 · 维基文库全本）

源：corpus/qiongtong-baojian/full.txt（zh.wikisource.org/wiki/窮通寶鑑 原文，
    FetchURL 抓取落盘，因 wikisource 直连不通，文本未改写，含命例 markdown 表）
书目：穷通宝鉴（栏江网/造化元钥，八字调候用神第一原典：五行总论+十干十二月用诀）
结构：按 16 个原书章节锚点切段（五行总论/五干总论/十干十二月），段内超帽均分
字段：module=bazi（调候归八字域），trust=0.95（PD 原典），src_id=wikisource:窮通寶鑑,
      status=formal, domain=mingli, 指纹幂等（entry_id/title 双查重）
用法：/usr/bin/python3 scripts/ingest-qiongtong-local.py
"""
import sqlite3, json, hashlib, time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT / 'server' / 'database' / 'yidao.db'
SRC = ROOT / 'corpus' / 'qiongtong-baojian' / 'full.txt'
NOW = time.strftime('%Y-%m-%d %H:%M:%S')

# (锚点=该节首句, 节名)——按原书顺序，首个匹配处切分
SECTIONS = [
    ('五行者，本乎天地之间而不穷者也', '五行总论'),
    ('木性腾上而无所止', '论木总论'),
    ('春月之木，渐有生长之象', '甲木十二月'),
    ('三春乙木，为芝兰蒿草之物', '乙木十二月'),
    ('炎炎真火，位镇南方', '论火总论'),
    ('三春丙火，秉象至威', '丙火十二月'),
    ('**正月丁火**', '丁火十二月'),
    ('五行之土，散冠四维', '论土总论'),
    ('三春戊土，无丙照暖', '戊土十二月'),
    ('**正月己土**', '己土十二月'),
    ('金以至阴为体', '论金总论'),
    ('**正月庚金**', '庚金十二月'),
    ('**正月辛金**', '辛金十二月'),
    ('天倾西北，亥为出水之方', '论水总论'),
    ('**正月壬水**', '壬水十二月'),
    ('**正月癸水**', '癸水十二月'),
]

def fp(s): return 'WS|' + hashlib.sha1(s.encode('utf-8')).hexdigest()[:16]

def split_sections(body):
    """按锚点首次出现位置顺序切段"""
    marks = []
    for anchor, name in SECTIONS:
        i = body.find(anchor)
        if i < 0:
            print(f'[warn] 锚点未命中: {name} ({anchor[:12]}…)'); continue
        marks.append((i, name))
    marks.sort()
    out = []
    for k, (pos, name) in enumerate(marks):
        end = marks[k + 1][0] if k + 1 < len(marks) else len(body)
        out.append((name, body[pos:end].strip()))
    return out

def main():
    body = SRC.read_text(encoding='utf-8')
    print(f'全文 {len(body)} 字符')
    conn = sqlite3.connect(DB, timeout=120)
    conn.execute('PRAGMA busy_timeout=120000')
    ins = skip = 0
    for sub, sec in split_sections(body):
        if len(sec) < 120:
            print(f'[skip] {sub} 过短 ({len(sec)})'); continue
        kb_title = f'原典·穷通宝鉴·{sub}'
        # 超帽均分（同批13逻辑）
        chunks = [sec]
        if len(sec) > 9000:
            ls, chunks, cb, cn = sec.split('\n'), [], [], 0
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
            full = f'【穷通宝鉴·{sub}】（公有领域原典·维基文库）\n\n' + c
            conn.execute("""INSERT INTO kb_formal
                (entry_id, module, title, content, src_id, category, keywords, summary,
                 trust_score, version, promoted_at, promoted_from, status, fingerprint, domain, tags)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                (eid, 'bazi', t2, full, 'wikisource:窮通寶鑑', 'wikisource-qiongtong',
                 json.dumps(['穷通宝鉴', '调候用神', sub[:12]], ensure_ascii=False),
                 c[:80], 0.95, '1.0', NOW, 'kimi-p03-qiongtong-local', 'formal', fp(full), 'mingli',
                 json.dumps(['原典', '穷通宝鉴', '维基文库'], ensure_ascii=False)))
            ins += 1
        print(f'[{sub}] {len(sec)} 字符 → {len(chunks)} 块，累计入库 {ins} / 跳过 {skip}')
    conn.commit()
    total = conn.execute("SELECT COUNT(*) FROM kb_formal WHERE status='formal'").fetchone()[0]
    print(f'✅ 穷通宝鉴入库 {ins} 条（跳过 {skip}），KB 总量 {total}')
    conn.close()

if __name__ == '__main__':
    main()
