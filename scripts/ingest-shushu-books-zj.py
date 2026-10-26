#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ingest-shushu-books-zj.py — 《术数全书·中册》按部切分 + 珞禄子 Kanripo 净本入库（2026-10-20 · 第三十九轮）
源：classics 模块中册 OCR 块 + corpus/luoluzi/（KR3g0037 消息赋注 / KR3g0038 三命指迷赋，四库文渊阁版净本）。
    仅依据项目内文献，不外采、不杜撰。
分部（书眉+书名页双锚定）：
  乙巳占（唐李淳风·星占）        页 115-328 → module=yisi-zhan
  字触（清周亮工·测字）          页 329-444 → module=zichu
  麻衣道者正易心法（宋陈抟）     页 445-475 → module=zhengyi-xinfa
  景祐六壬神定经（宋杨维德）     页 575-614 → module=jingyou-liuren
  珞禄子三命消息赋注+三命指迷赋  Kanripo 净本 → module=luoluzi（trust 0.95）
跳过：梦占逸旨（mengzhan 已 2302 条专库）、珞禄子 OCR（净本优先）。
mandoku 清洗：去 # 头/<pb:>¶ 标记/¶ 符。
"""
import hashlib, re, sqlite3, subprocess, sys
from pathlib import Path
from lib.kb_ingest import KBIngestor
from yidao_safe import safe_close

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT / 'server' / 'database' / 'yidao.db'

OCR_BOOKS = [
    ('yisi-zhan', '乙巳占', '唐李淳风·星占', 115, 328, '星占'),
    ('zichu', '字触', '清周亮工·测字', 329, 444, '测字'),
    ('zhengyi-xinfa', '麻衣道者正易心法', '宋陈抟·易心法', 445, 475, '易心法'),
    ('jingyou-liuren', '景祐六壬神定经', '宋杨维德·六壬', 575, 614, '六壬'),
]


def get_blocks(conn):
    rows = conn.execute(
        "SELECT title, content FROM kb_formal WHERE module='classics' AND title LIKE '%术数全书·中%'").fetchall()
    out = []
    for title, content in rows:
        m = re.search(r'OCR第(\d+)', title)
        if m:
            out.append((int(m.group(1)), content))
    out.sort(key=lambda x: x[0])
    return out


HEADER_RE = re.compile(
    r'^(术数全书|中卷|上卷|下卷|乙[已巳巴]占|字触|正易心法|麻衣|珞禄子|珞琭子|神定经|景祐六壬|梦占逸旨|三命指迷|消息赋|目\s*录)*\s*\d{0,3}\s*(术数全书|中卷|乙[已巳巴]占|字触|正易心法|神定经|景祐六壬)*\s*$')


def clean_block(content):
    c = re.sub(r'^来源：[^\n]*\n', '', content)
    c = re.sub(r'【第\d+页】', '\n', c)
    lines = []
    for ln in c.split('\n'):
        s = ln.strip().strip('．.。·')
        if len(s) < 22 and HEADER_RE.match(s):
            continue
        lines.append(ln)
    return '\n'.join(lines).strip()


def chunk(text, size=2500, min_len=200):
    paras = [p for p in text.split('\n') if p.strip()]
    chunks, cur = [], ''
    for p in paras:
        if len(cur) + len(p) > size and len(cur) >= 600:
            chunks.append(cur.strip()); cur = ''
        cur += p + '\n'
    if cur.strip() and len(cur.strip()) >= min_len:
        chunks.append(cur.strip())
    elif cur.strip() and chunks:
        chunks[-1] += '\n' + cur.strip()
    return chunks


def clean_mandoku(text):
    lines = []
    for ln in text.split('\n'):
        if ln.startswith('#'):
            continue
        ln = re.sub(r'<pb:[^>]*>', '', ln)
        ln = ln.replace('¶', '').replace('<', '').strip()
        if ln:
            lines.append(ln)
    return '\n'.join(lines)


def main():
    conn = sqlite3.connect(str(DB), timeout=120)
    conn.execute('PRAGMA busy_timeout=120000')
    blocks = get_blocks(conn)
    fps = {r[0] for r in conn.execute(
        "SELECT fingerprint FROM kb_formal WHERE fingerprint LIKE 'SSZ|%'" )}

    entries = []  # (module, book, author, topic, title, content, trust, src, fp_prefix, category)

    for module, book, author, p0, p1, topic in OCR_BOOKS:
        text = '\n\n'.join(clean_block(c) for pg, c in blocks if p0 <= pg <= p1)
        cdir = ROOT / 'corpus' / module
        cdir.mkdir(parents=True, exist_ok=True)
        (cdir / f'{book}-ocr.md').write_text(
            f'# {book}（术数全书·中册 · Vision OCR）\n\n> {author}。源：项目内《术数全书（中册）》PDF Vision OCR。页 {p0}-{p1}。\n\n'
            + text, encoding='utf-8')
        chunks = chunk(text)
        for i, ch in enumerate(chunks):
            entries.append((module, book, author, topic, f'{book}·OCR第{i+1}/{len(chunks)}节', ch,
                            0.9, 'shushu-quanshu:中册·' + book, '术数全书分部'))
        print(f'{book}: {len(chunks)} 条（{len(text)} 字）', flush=True)

    # 珞禄子 Kanripo 净本
    luo = [
        ('珞琭子三命消息賦注·提要', 'KR3g0037_000.txt', '消息赋,提要'),
        ('珞琭子三命消息賦注·卷上', 'KR3g0037_001.txt', '消息赋,卷上'),
        ('珞琭子三命消息賦注·卷下', 'KR3g0037_002.txt', '消息赋,卷下'),
        ('三命指迷賦·提要', 'KR3g0038_000.txt', '指迷赋,提要'),
        ('三命指迷賦', 'KR3g0038_001.txt', '指迷赋'),
    ]
    for title, fn, kw in luo:
        raw = (ROOT / 'corpus' / 'luoluzi' / fn).read_text(encoding='utf-8')
        clean = clean_mandoku(raw)
        for i, ch in enumerate(chunk(clean, size=3000)):
            t = title if len(chunk(clean, 3000)) == 1 else f'{title}·{i+1}'
            entries.append(('luoluzi', title.split('·')[0], '宋徐子平注/珞禄子·命理', '命理', t, ch,
                            0.95, 'kanripo:' + fn, '四库净本'))
        print(f'{title}: 净字 {len(clean)}', flush=True)

    ing = KBIngestor(conn)
    try:
        conn.execute('BEGIN IMMEDIATE')
        for module, book, author, topic, title, ch, trust, src, cat in entries:
            full = f'【{book}·{title}】（公有领域原典·{author}）\n\n{ch}\n\n关键词：{book} {topic} {title}'
            eid = 'KB-SSZ-' + hashlib.md5((module + full).encode()).hexdigest()[:12]
            kw = f'{book},{topic}'
            ing.upsert(entry_id=eid, module=module, title=f'原典·{title}', content=full,
                       keywords=kw, tags=kw, src_id=src, category=cat,
                       trust=trust, source='corpus-rebuild')
        for module, book, author, p0, p1, topic in OCR_BOOKS + [
                ('luoluzi', '珞禄子（消息赋注+指迷赋）', '宋徐子平等·命理', 0, 0, '命理')]:
            n = conn.execute('SELECT COUNT(*) FROM kb_formal WHERE module=?', (module,)).fetchone()[0]
            conn.execute(
                """INSERT INTO kb_module_registry (module, std_group, display_name, domain, entry_count, note, updated_at)
                   VALUES (?,?,?,?,?,?,datetime('now','localtime'))
                   ON CONFLICT(module) DO UPDATE SET entry_count=excluded.entry_count, note=excluded.note, updated_at=excluded.updated_at""",
                (module, '典籍综合', book, 'mingli', n,
                 f'{author}；' + (f'术数全书中册 OCR 页{p0}-{p1}' if p0 else 'Kanripo 四库净本 corpus/luoluzi')))
        ing.commit()
    except Exception:
        conn.rollback()
        safe_close(conn)
        raise
    safe_close(conn)
    print(ing.stats(), flush=True)
    subprocess.run([sys.executable, str(ROOT / 'scripts/kb-sync-guard.py'), '--sync', '1'],
                   cwd=ROOT, check=True)
    print('═══ 注册表已更新 5 个模块')


if __name__ == '__main__':
    main()
