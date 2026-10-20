#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ingest-shushu-books-xj.py — 《术数全书·下册》按部切分入库（2026-10-20 · 第四十轮）
源：kb_formal module='classics' 的 118 个 Vision OCR 块（术数全书·上册，项目内文献，不外采）。
分部（书眉锚定）：
  天步真原（泰西穆尼阁·星占）  页 ~16-150  → module=tianbu-zhenyuan  domain=mingli
  太清神鉴（后周王朴·相术）    页 ~151-266 → module=taiqing-shenjian  domain=mingli
  焦氏易林（汉焦延寿）         页 ~267-516 → 跳过（yishi 已有 162 条维基净本）
  春秋占筮书（清毛奇龄）       页 ~517-541 → module=chunqiu-zanshu    domain=mingli
  灵棋经                      页 542-637   → 已完成（第三十七轮）
切块：段落感知 ~2500 字/块；书眉行（仅书名/页码的行）剔除；trust=0.9（OCR）；
      fingerprint='SSS|部|md5' 幂等；kb_fts5 手动批量同步；kb_module_registry 注册。
"""
import hashlib, re, sqlite3, time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT / 'server' / 'database' / 'yidao.db'

BOOKS = [
    ('shuilong-jing', '秘传水龙经', '清蒋平阶·水法风水', 12, 138, '风水'),
    ('chuxing-baojing', '出行宝镜', '撰人不详·出行择吉', 139, 199, '择吉'),
    ('bingding-guijian', '丙丁龟鉴', '宋柴望辑·杂占', 313, 361, '杂占'),
    ('jirui', '稽瑞', '唐刘庚辑·祥瑞占', 362, 427, '杂占'),
    ('qianyuan-mizhi', '乾元秘旨', '清舒英·命理', 428, 447, '命理'),
    ('yuanbao', '元包数总义', '宋张行成·象数', 448, 469, '象数'),
    ('lixuzhong', '李虚中命书', '唐李虚中·命理', 470, 512, '命理'),
    ('wanbishu', '淮南万毕术', '汉刘安·杂术', 513, 600, '杂术'),
    ('xiangyu-shu', '相雨书', '唐黄子发·候雨', 601, 605, '杂占'),
]
FP_PREFIX = 'SSX|'


def get_blocks(conn):
    rows = conn.execute(
        "SELECT title, content FROM kb_formal WHERE module='classics' AND title LIKE '%术数全书·下%'").fetchall()
    out = []
    for title, content in rows:
        m = re.search(r'OCR第(\d+)', title)
        if m:
            out.append((int(m.group(1)), title, content))
    out.sort()
    return out


def clean_block(content):
    """去掉来源说明头与【第N页】标记；剔除纯书眉/页码行"""
    c = re.sub(r'^来源：[^\n]*\n', '', content)
    c = re.sub(r'【第\d+页】', '\n', c)
    lines = []
    for ln in c.split('\n'):
        s = ln.strip().strip('．.。·')
        # 纯书眉：只有书名+页码（如「太清神鉴 154」「术数全书 129」）
        if re.fullmatch(r'(术数全书|天步真原|天步眞原|太清神鉴|太淸神鉴|焦氏易林|春秋占筮书?|灵棋经|上卷|下卷|秘传水龙经|水龙经|出行宝镜|五行大义|丙丁龟鉴|稽瑞|乾元秘旨|元包数总义|元包|李虚中命书|李虚中|淮南万毕术|万毕术|相雨书)?\s*\d{0,3}\s*(术数全书|天步真原|天步眞原|太清神鉴|太淸神鉴|焦氏易林|春秋占筮书?|灵棋经|上卷|下卷|秘传水龙经|水龙经|出行宝镜|五行大义|丙丁龟鉴|稽瑞|乾元秘旨|元包数总义|元包|李虚中命书|李虚中|淮南万毕术|万毕术|相雨书)?\s*', s) and len(s) < 20:
            continue
        lines.append(ln)
    return '\n'.join(lines).strip()


def chunk(text, size=2500):
    paras = [p for p in text.split('\n') if p.strip()]
    chunks, cur = [], ''
    for p in paras:
        if len(cur) + len(p) > size and len(cur) >= 600:
            chunks.append(cur.strip()); cur = ''
        cur += p + '\n'
    if cur.strip() and len(cur.strip()) >= 200:
        chunks.append(cur.strip())
    elif cur.strip() and chunks:
        chunks[-1] += '\n' + cur.strip()
    return chunks


def main():
    conn = sqlite3.connect(str(DB), timeout=120)
    conn.execute('PRAGMA busy_timeout=120000')
    blocks = get_blocks(conn)
    fps = {r[0] for r in conn.execute(
        "SELECT fingerprint FROM kb_formal WHERE fingerprint LIKE 'SSS|%'" )}

    all_entries = []
    for module, book, author, p0, p1, topic in BOOKS:
        segs = [c for pg, t, c in blocks if p0 <= pg <= p1]
        text = '\n\n'.join(clean_block(c) for c in segs)
        # 语料存档
        cdir = ROOT / 'corpus' / module
        cdir.mkdir(parents=True, exist_ok=True)
        (cdir / f'{book}-ocr.md').write_text(
            f'# {book}（术数全书·下册 · Vision OCR）\n\n> {author}。源：项目内《术数全书（下册）》PDF Vision OCR。页 {p0}-{p1}。\n\n'
            + text, encoding='utf-8')
        chunks = chunk(text)
        for i, ch in enumerate(chunks):
            all_entries.append((module, book, author, topic, i + 1, len(chunks), ch))
        print(f'{book}: {len(segs)} 块 → {len(chunks)} 条（{len(text)} 字）', flush=True)

    ins = dup = 0
    new_rows = []
    for attempt in range(20):
        try:
            conn.execute('BEGIN IMMEDIATE')
            for module, book, author, topic, i, n, ch in all_entries:
                title = f'{book}·OCR第{i}/{n}节'
                full = f'【术数全书·下册·{book}·第{i}/{n}节】（公有领域原典·{author}·Vision OCR）\n\n{ch}\n\n关键词：{book} {topic} 术数全书'
                fp = FP_PREFIX + module + '|' + hashlib.md5(full.encode()).hexdigest()[:12]
                if fp in fps:
                    dup += 1
                    continue
                eid = 'KB-SSX-' + hashlib.md5((module + full).encode()).hexdigest()[:12]
                conn.execute(
                    """INSERT INTO kb_formal (entry_id, module, title, content, keywords, trust_score,
                       access_level, status, domain, src_id, fingerprint, category, created_at)
                       VALUES (?,?,?,?,?,0.9,'public','formal','mingli',?,?,'术数全书分部',datetime('now'))""",
                    (eid, module, f'原典·{title}', full, f'{book},{topic},术数全书', 'shushu-quanshu:下册·' + book, fp))
                fps.add(fp)
                new_rows.append((eid, module, title, full, topic))
                ins += 1
            conn.commit()
            break
        except sqlite3.OperationalError as e:
            conn.rollback()
            if 'locked' in str(e).lower():
                print(f'写锁被占，30s 后重试（{attempt+1}/20）…', flush=True)
                time.sleep(30)
            else:
                raise
    else:
        raise SystemExit('FATAL: 写锁重试耗尽')
    print(f'入库 {ins} 条，去重跳过 {dup} 条', flush=True)

    if new_rows:
        conn.execute('BEGIN IMMEDIATE')
        conn.executemany(
            "INSERT INTO kb_fts5 (entry_id, module, summary, content, tags, category) VALUES (?,?,?,?,?,?)",
            [(eid, m, t, full, topic, '术数全书分部') for eid, m, t, full, topic in new_rows])
        conn.commit()
        print(f'FTS 同步 {len(new_rows)} 条', flush=True)

    for module, book, author, p0, p1, topic in BOOKS:
        n = conn.execute('SELECT COUNT(*) FROM kb_formal WHERE module=?', (module,)).fetchone()[0]
        conn.execute(
            """INSERT INTO kb_module_registry (module, std_group, display_name, domain, entry_count, note, updated_at)
               VALUES (?,?,?,?,?,?,datetime('now','localtime'))
               ON CONFLICT(module) DO UPDATE SET entry_count=excluded.entry_count, note=excluded.note, updated_at=excluded.updated_at""",
            (module, '典籍综合', book, 'mingli', n,
             f'{author}；术数全书上册 Vision OCR 页{p0}-{p1} 分部切条；OCR 文本 trust 0.9'))
    conn.commit()
    print('═══ 注册表已更新：', ', '.join(b[0] for b in BOOKS))
    conn.close()


if __name__ == '__main__':
    main()
