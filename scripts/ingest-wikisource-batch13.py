#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""批13 · 维基文库公有领域典籍入库（BUILD-SPEC T1 批13 · 2026-09-23 Kimi · 弱域补全波次）

源：zh.wikisource.org（公有领域原典，MediaWiki API 抓取，限流 2s/req 礼貌抓取）
书目（弱域定向）：
  yuxiaji     玉匣記（择日弱域）
  zengshan    增刪卜易（六爻弱域，34 子页）
  buzheng     卜筮正宗（六爻）
  huozhulin   火珠林（六爻）
  ziweids     紫微斗數全書（紫微原典）
  zangshu     葬書（风水原典，內/外/雜三篇）
  hanlong     撼龍經（风水原典，含疑龍經/葬法倒杖）
清洗：剥 wiki 标记（{{模板}}/[[链接]]→正文/<ref>/'''/==标题==保留语义/表格标记），
      仅入原文；正文 <120 字的索引/重定向子页跳过。
字段：module 按书定（zeri/liuyao/ziwei/fengshui），trust=0.95（PD 原典），
      src_id=wikisource:<书名>, status=formal, 指纹幂等, domain=mingli, tags 带写。
用法：python3 ingest-wikisource-batch13.py [slug ...]（无参全跑）
"""
import sqlite3, json, hashlib, re, time, sys, urllib.request, urllib.parse
from pathlib import Path

DB = Path(__file__).resolve().parent.parent / 'server' / 'database' / 'yidao.db'
NOW = time.strftime('%Y-%m-%d %H:%M:%S')
API = 'https://zh.wikisource.org/w/api.php'
UA = {'User-Agent': 'mingli-baojian-canon-ingest/1.0 (public-domain classics; contact: local)'}

BOOKS = {
    'yuxiaji':   ('玉匣記', 'zeri', '玉匣记'),
    'zengshan':  ('增刪卜易', 'liuyao', '增删卜易'),
    'buzheng':   ('卜筮正宗', 'liuyao', '卜筮正宗'),
    'huozhulin': ('火珠林', 'liuyao', '火珠林'),
    'ziweids':   ('紫微斗數全書', 'ziwei', '紫微斗数全书'),
    'zangshu':   ('葬書', 'fengshui', '葬书'),
    'hanlong':   ('撼龍經', 'fengshui', '撼龙经'),
}

def fetch(params, retries=3):
    url = API + '?' + urllib.parse.urlencode(params)
    for i in range(retries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
                return json.loads(r.read().decode('utf-8'))
        except Exception as e:
            time.sleep(3 * (i + 1))
    return None

def clean(wt):
    t = re.sub(r'<ref[^>]*>.*?</ref>', '', wt, flags=re.S)
    t = re.sub(r'<ref[^/]*/>', '', t)
    t = re.sub(r'\{\{[^{}]*(\{\{[^{}]*\}\}[^{}]*)*\}\}', '', t)  # 模板（两层嵌套）
    t = re.sub(r'\{\{[^{}]*\}\}', '', t)
    t = re.sub(r'\[\[(?:[^|\]]*\|)?([^\]]*)\]\]', r'\1', t)   # 链接→文本
    t = re.sub(r"'''", '', t)
    t = re.sub(r'<[^>]+>', '', t)
    t = re.sub(r'^\{\|.*^\|\}', '', t, flags=re.S | re.M)      # 表格
    t = re.sub(r'^[=\s]*==+\s*(.+?)\s*==+\s*$', r'\n【\1】\n', t, flags=re.M)  # 标题语义保留
    t = re.sub(r'\n{3,}', '\n\n', t)
    return t.strip()

def subpages(title):
    out, cont = [], ''
    while True:
        p = {'action': 'query', 'list': 'allpages', 'apprefix': title + '/', 'aplimit': '500', 'format': 'json'}
        if cont:
            p['apcontinue'] = cont
        d = fetch(p)
        if not d:
            break
        out += [x['title'] for x in d.get('query', {}).get('allpages', [])]
        cont = d.get('continue', {}).get('apcontinue')
        if not cont:
            break
        time.sleep(2)
    return out

def page_text(title):
    d = fetch({'action': 'parse', 'page': title, 'format': 'json', 'prop': 'wikitext', 'redirects': '1'})
    if not d or 'parse' not in d:
        return ''
    return d['parse'].get('wikitext', {}).get('*', '')

def fp(s): return 'WS|' + hashlib.sha1(s.encode('utf-8')).hexdigest()[:16]

def run_book(slug, conn):
    title, module, cname = BOOKS[slug]
    subs = subpages(title)
    if not subs:
        subs = [title]  # 无子页则单页
    # 主页面往往只是提要/目录，子页是正文；主页面也尝试（葬書提要本身有学术价值）
    pages = [title] + [s for s in subs if s != title]
    print(f'[{cname}] 页面 {len(pages)}')
    ins = skip = 0
    for p in pages:
        time.sleep(2)
        wt = page_text(p)
        body = clean(wt)
        if len(body) < 120:
            continue
        sub = p.split('/')[-1] if '/' in p else '提要'
        kb_title = f'原典·{cname}·{sub}'
        eid = 'KB-WS-' + hashlib.md5(kb_title.encode()).hexdigest()[:10]
        if conn.execute('SELECT 1 FROM kb_formal WHERE entry_id=? OR title=?', (eid, kb_title)).fetchone():
            skip += 1
            continue
        # 超帽均分
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
            eid2 = 'KB-WS-' + hashlib.md5(t2.encode()).hexdigest()[:10]
            if conn.execute('SELECT 1 FROM kb_formal WHERE entry_id=? OR title=?', (eid2, t2)).fetchone():
                skip += 1
                continue
            full = f'【{cname}·{sub}】（公有领域原典·维基文库）\n\n' + c
            conn.execute("""INSERT INTO kb_formal
                (entry_id, module, title, content, src_id, category, keywords, summary,
                 trust_score, version, promoted_at, promoted_from, status, fingerprint, domain, tags)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                (eid2, module, t2, full, f'wikisource:{title}', f'wikisource-{slug}',
                 json.dumps([cname, sub[:12]], ensure_ascii=False),
                 c[:80], 0.95, '1.0', NOW, f'kimi-t1-batch13-{slug}', 'formal', fp(full), 'mingli',
                 json.dumps(['原典', cname, '维基文库'], ensure_ascii=False)))
            ins += 1
        conn.commit()
    print(f'[{cname}] 入库 {ins} / 跳过 {skip}')

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
