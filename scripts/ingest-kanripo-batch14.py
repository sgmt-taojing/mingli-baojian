#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""批14 · Kanripo 四库术数原典入库（2026-09-23 Kimi · 原典层补全第二波）

源：github.com/kanripo（四庫全書文淵閣版 WYG 底本，公有领域，gh api tarball 整仓拉取）
缘起：批14 原目标四书（卜筮正宗/紫微斗數全書/麻衣神相/神相全編）经查——
  四庫正目術數類 51 部（KR3g0001-0051）无此四书，ctext 被 Cloudflare 拦，
  维基文库仅残本 stub。按用户「源头干净、禁二手拼接」红线，改用四庫術數類
  净本补同域缺口：相术 3 部 / 命理 7 部 / 风水 7 部 / 易占 3 部 / 择日 2 部。
清洗：剥 mandoku 元数据行（# 开头）、<pb:...>¶ 页码标记与 ¶ 段符，其余原文不改写。
字段：沿用批13 规范（KB-KR- 前缀 / src_id=kanripo:<KRID> / trust 0.95 /
      domain=mingli / status=formal / 指纹幂等 / tags 必带 / >9000 字超帽均分）。
用法：python3 ingest-kanripo-batch14.py [slug ...]（无参全跑）
"""
import sqlite3, json, hashlib, re, time, sys
from pathlib import Path

DB = Path(__file__).resolve().parent.parent / 'server' / 'database' / 'yidao.db'
SRC = Path('/tmp/kr-books')
NOW = time.strftime('%Y-%m-%d %H:%M:%S')

# slug: (KRID, 简体书名, module)
BOOKS = {
    'yuguan':   ('KR3g0044', '玉管照神局', 'xiangshu'),
    'yuebo':    ('KR3g0043', '月波洞中记', 'xiangshu'),
    'renlun':   ('KR3g0046', '人伦大统赋', 'xiangshu'),
    'lixuzhong':('KR3g0033', '李虚中命书', 'bazi'),
    'yuzhao':   ('KR3g0034', '玉照定真经', 'bazi'),
    'luolu1':   ('KR3g0036', '珞琭子赋注', 'bazi'),
    'luolu2':   ('KR3g0037', '珞琭子三命消息赋注', 'bazi'),
    'zhimi':    ('KR3g0038', '三命指迷赋', 'bazi'),
    'xingmys':  ('KR3g0035', '星命溯源', 'bazi'),
    'xingmzk':  ('KR3g0039', '星命总括', 'bazi'),
    'zhaijing': ('KR3g0019', '宅经', 'fengshui'),
    'qingnangx':('KR3g0022', '青囊序', 'fengshui'),
    'qingnangy':('KR3g0023', '青囊奥语', 'fengshui'),
    'tianyu':   ('KR3g0024', '天玉经', 'fengshui'),
    'lingcheng':('KR3g0025', '灵城精义', 'fengshui'),
    'cuiguan':  ('KR3g0026', '催官篇', 'fengshui'),
    'fawei':    ('KR3g0027', '发微论', 'fengshui'),
    'jingshi':  ('KR3g0030', '京氏易传', 'liuyao'),
    'lingqi':   ('KR3g0028', '灵棋经', 'yizhan'),
    'bufa':     ('KR3g0032', '卜法详考', 'yizhan'),
    'xieji':    ('KR3g0051', '钦定协纪辨方书', 'zeri'),
    'xingli':   ('KR3g0050', '御定星历考原', 'zeri'),
}

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
        return m.group(1)
    return Path(fname).stem.split('_')[-1]

def fp(s):
    return 'KR|' + hashlib.sha1(s.encode('utf-8')).hexdigest()[:16]

def run_book(slug, conn):
    krid, cname, module = BOOKS[slug]
    d = SRC / krid
    files = sorted(d.glob('*.txt'))
    ins = skip = 0
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
            if conn.execute('SELECT 1 FROM kb_formal WHERE entry_id=? OR title=?', (eid, t2)).fetchone():
                skip += 1
                continue
            full = f'【{cname}·{sub}】（公有领域原典·四庫全書文淵閣版·Kanripo）\n\n' + c
            conn.execute("""INSERT INTO kb_formal
                (entry_id, module, title, content, src_id, category, keywords, summary,
                 trust_score, version, promoted_at, promoted_from, status, fingerprint, domain, tags)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                (eid, module, t2, full, f'kanripo:{krid}', f'kanripo-{slug}',
                 json.dumps([cname, sub[:12]], ensure_ascii=False),
                 c[:80], 0.95, '1.0', NOW, f'kimi-t1-batch14-{slug}', 'formal', fp(full), 'mingli',
                 json.dumps(['原典', cname, '四库全书', 'Kanripo'], ensure_ascii=False)))
            ins += 1
        conn.commit()
    print(f'[{cname}] 卷 {len(files)} → 入库 {ins} / 跳过 {skip}')

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
