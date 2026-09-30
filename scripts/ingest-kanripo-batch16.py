#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""批16 · 蒸馏季第二波：易学象数与占候原典补全（2026-09-25 Kimi）

衔接批15（奇门/易经/星命缺口清零）与穷通宝鉴（调候）之后，补象数易与太玄/洪范数：
  - KR3g0001 太玄經       → taixuan  扬雄太玄八十一首（独立占断体系，新域）
  - KR3g0012 洪範皇極內篇 → yizhan   蔡沈皇极数（铁板神数理论源头之一）
  - KR3g0013 天原發微     → yijing   鲍云龙象数易（宋元易学）
  - KR3g0014 大衍索隱     → yijing   大衍筮法考索
  - KR3g0015 易象圖說     → yijing   张理象数图说
  - KR3g0016 三易洞璣     → yizhan   黄道周易象占候
字段：沿用批13/14/15 规范（KB-KR- 前缀 / src_id=kanripo:<KRID> / trust 0.95 /
      domain=mingli / status=formal / 指纹幂等 / >9000 字超帽均分）
红线：原典原文不改写；禁二手拼接。
用法：python3 ingest-kanripo-batch16.py [slug ...]
"""
import sqlite3, json, hashlib, re, time, sys, subprocess, tarfile, io, urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from lib.kb_ingest import KBIngestor  # R-INGEST-SPEC-20260927：禁止手写 INSERT，统一走新口径

DB = Path(__file__).resolve().parent.parent / 'server' / 'database' / 'yidao.db'
SRC = Path('/tmp/kr-books16')

BOOKS = {
    'taixuan':   ('KR3g0001', '太玄经', 'taixuan'),
    'hongfan':   ('KR3g0012', '洪范皇极内篇', 'yizhan'),
    'tianyuan':  ('KR3g0013', '天原发微', 'yijing'),
    'dayan':     ('KR3g0014', '大衍索隐', 'yijing'),
    'yixiang':   ('KR3g0015', '易象图说', 'yijing'),
    'sanyi':     ('KR3g0016', '三易洞玑', 'yizhan'),
}

def download(krid):
    d = SRC / krid
    if d.exists() and list(d.glob('*.txt')):
        return d
    d.mkdir(parents=True, exist_ok=True)
    url = f'https://codeload.github.com/kanripo/{krid}/tar.gz/refs/heads/master'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    blob = urllib.request.urlopen(req, timeout=120).read()
    with tarfile.open(fileobj=io.BytesIO(blob), mode='r:gz') as tf:
        for m in tf.getmembers():
            if m.name.endswith('.txt') and '/' in m.name:
                data = tf.extractfile(m).read()
                (d / Path(m.name).name).write_bytes(data)
    return d

def clean(raw):
    lines = []
    for l in raw.split('\n'):
        if l.startswith('#'):
            continue
        l = re.sub(r'<pb:[^>]*>', '', l)
        l = l.replace('¶', '')
        lines.append(l.rstrip())
    t = '\n'.join(lines)
    t = re.sub(r'\n{3,}', '\n\n', t)
    return t.strip()

def juan_name(fname, raw):
    m = re.search(r'^#\+PROPERTY: JUAN\s+(\S+)', raw, flags=re.M)
    if m:
        return '卷' + m.group(1)
    return Path(fname).stem.split('_')[-1]

def run_book(slug, conn):
    krid, cname, module = BOOKS[slug]
    print(f'== {cname} ({krid}) 下载…', flush=True)
    d = download(krid)
    files = sorted(d.glob('*.txt'))
    ins = skip = 0
    ing = KBIngestor(conn)
    for f in files:
        raw = f.read_text(encoding='utf-8')
        body = clean(raw)
        if len(body) < 120:
            continue
        sub = juan_name(f.name, raw)
        kb_title = f'原典·{cname}·{sub}'
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
            eid = 'KB-KR-' + hashlib.md5(t2.encode()).hexdigest()[:10]
            full = f'【{cname}·{sub}】（公有领域原典·Kanripo 四库全书）\n\n' + c
            ok, _why = ing.insert(
                entry_id=eid, module=module, title=t2, content=full,
                src_id=f'kanripo:{krid}', category=f'kanripo16-{slug}',
                keywords=f'{cname},{sub[:12]}', summary=c[:80], trust=0.95,
                source=f'kimi-batch16-{slug}', domain='mingli',
                tags=['原典', cname, '四库全书', 'Kanripo'], dedup_title=True)
            if ok:
                ins += 1
            else:
                skip += 1
        ing.commit()
    print(f'[{cname}] 卷 {len(files)} → 入库 {ins} / 跳过 {skip}', flush=True)

def main():
    conn = sqlite3.connect(DB, timeout=120)
    conn.execute('PRAGMA busy_timeout=120000')
    slugs = sys.argv[1:] or list(BOOKS.keys())
    for s in slugs:
        if s in BOOKS:
            run_book(s, conn)
    total = conn.execute("SELECT COUNT(*) FROM kb_formal").fetchone()[0]
    print(f'✅ 批16 完跑，KB 总量 {total}')
    conn.close()

if __name__ == '__main__':
    main()
