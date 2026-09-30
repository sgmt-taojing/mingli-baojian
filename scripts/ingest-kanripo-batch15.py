#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""批15 · 蒸馏季第一波：命理域原典缺口清零（2026-09-25 Kimi）

缺口审计结论（tags LIKE '%原典%' 实测）：
  奇门 0 / 六壬 0 / 易经 0 / 紫微全书 stub / 风水薄（34）
源：github.com/kanripo（公有领域，四库底本/SBCK，mandoku 格式）
  - KR3g0048 遁甲演义     → qimen   奇门原典 0 突破（四库唯一遁甲书）
  - KR1a0001 周易         → yijing  群经之首原文（经部）
  - KR3g0029 焦氏易林     → yizhan  易占源头（六爻 precursor）
  - KR3g0005 皇极经世书   → yijing  邵雍（梅花理论源头）
  - KR3g0045 太清神鉴     → xiangshu 相术四部之首
  - KR3g0041 星学大成     → ziwei   七政四余星命大部头
  - KR3g0047 太乙金镜式经 → taiyi   三式之太乙（知识储备）
  - KR3g0018 唐开元占经   → yizhan  占候集大成
  - KR3g0040 演禽通纂     → yizhan
  - KR3g0017 灵台秘苑     → yizhan
字段：沿用批13/14 规范（KB-KR- 前缀 / src_id=kanripo:<KRID> / trust 0.95 /
      domain=mingli / status=formal / 指纹幂等 / >9000 字超帽均分）
红线：原典原文不改写；禁二手拼接。
用法：python3 ingest-kanripo-batch15.py [slug ...]
"""
import sqlite3, json, hashlib, re, time, sys, subprocess, tarfile, io, urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from lib.kb_ingest import KBIngestor  # R-INGEST-SPEC-20260927：禁止手写 INSERT，统一走新口径

DB = Path(__file__).resolve().parent.parent / 'server' / 'database' / 'yidao.db'
SRC = Path('/tmp/kr-books15')

BOOKS = {
    'dunjia':  ('KR3g0048', '遁甲演义', 'qimen'),
    'zhouyi':  ('KR1a0001', '周易', 'yijing'),
    'jiaoshi': ('KR3g0029', '焦氏易林', 'yizhan'),
    'huangji': ('KR3g0005', '皇极经世书', 'yijing'),
    'taiqing': ('KR3g0045', '太清神鉴', 'xiangshu'),
    'xingxue': ('KR3g0041', '星学大成', 'ziwei'),
    'taiyi':   ('KR3g0047', '太乙金镜式经', 'taiyi'),
    'kaiyuan': ('KR3g0018', '唐开元占经', 'yizhan'),
    'yanqin':  ('KR3g0040', '演禽通纂', 'yizhan'),
    'lingtai': ('KR3g0017', '灵台秘苑', 'yizhan'),
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
                src_id=f'kanripo:{krid}', category=f'kanripo15-{slug}',
                keywords=f'{cname},{sub[:12]}', summary=c[:80], trust=0.95,
                source=f'kimi-batch15-{slug}', domain='mingli',
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
    conn.close()

if __name__ == '__main__':
    main()
