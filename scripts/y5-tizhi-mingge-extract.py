#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Y5 续 · 体质×命格薄带定向提取（R-INGEST-SPEC-20260927 新口径）

背景：薄带诊断结论——古籍说「血气/偏枯/疾厄/寿夭」，检索说「体质」，古今术语断桥。
      16:15 已做 498 条标签桥接（存量可达性）；本脚本做增量定向提取：
      从命理原典（三命/滴天髓/渊海/神峰/李虚中/星命等库内条目）提取「体质×命格」
      交叉主题段落，生成 91 条专题条目，module='tizhi'。

口径：原文照录（不改一字）+ 术语桥接表（古籍术语→现代体质语义映射，规则生成非 AI 杜撰）。
"""
import re, sqlite3, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from lib.kb_ingest import KBIngestor, fingerprint_of

DB = Path(__file__).parent.parent / 'server' / 'database' / 'yidao.db'
TARGET = 91

# 古籍体质术语 → 现代体质语义（桥接词典，只映射不解读）
TERM_BRIDGE = {
    '血气': '气血充盈度', '偏枯': '五行失衡体质', '疾厄': '疾病倾向',
    '寿夭': '先天禀赋强弱', '夭寿': '先天禀赋强弱', '痼疾': '慢性倾向',
    '羸弱': '虚弱体质', '寒暖': '寒热体质倾向', '燥湿': '燥湿体质倾向',
    '调候': '环境适应力', '中和': '平和体质', '旺衰': '元气盛衰',
    '病根': '体质短板', '病药': '体质调理方向', '康健': '正气充足',
}
CONSTITUTION_TERMS = list(TERM_BRIDGE.keys()) + ['疾病', '五行偏胜', '偏胜', '寿元']
FATE_TERMS = ['日主', '日元', '格局', '用神', '八字', '四柱', '五行', '命', '大运', '岁运']

SRC_MODULES = ('bazi', 'classics')


def extract_segments(content):
    """切段：按句号/段落边界，保留 60-800 字段落"""
    if isinstance(content, bytes):
        content = content.decode('utf-8', 'replace')
    parts = re.split(r'(?<=。)|\n\n+|\n', content)
    segs = []
    buf = ''
    for p in parts:
        buf += p
        if len(buf) >= 60:
            segs.append(buf.strip())
            buf = ''
    if buf.strip():
        segs.append(buf.strip())
    return [s for s in segs if 60 <= len(s) <= 800]


def score(seg):
    """必须双命中：体质术语 + 命理术语；按命中数计分"""
    ct = [t for t in CONSTITUTION_TERMS if t in seg]
    ft = [t for t in FATE_TERMS if t in seg]
    if not ct or not ft:
        return 0, [], []
    return len(ct) * 2 + len(ft), ct, ft


def main():
    conn = sqlite3.connect(str(DB))
    ing = KBIngestor(conn)
    # 铁律：只从原典条目提取（title '原典·%' 或今日古籍批次前缀），现代蒸馏/二手文本一律不取
    CLASSIC_PREFIXES = ('XJB|', 'YLY|', 'TXJ|', 'TYJ|', 'TSDZ|', 'YZH|', 'YL72|', 'KR|', 'WS|')
    prefix_clause = ' OR '.join(["entry_id LIKE ? || '%'" for _ in CLASSIC_PREFIXES])
    rows = conn.execute(f"""SELECT entry_id, title, content FROM kb_formal
        WHERE (title LIKE '原典·%' OR {prefix_clause})
        AND (content LIKE '%血气%' OR content LIKE '%偏枯%' OR content LIKE '%疾厄%'
             OR content LIKE '%寿夭%' OR content LIKE '%疾病%' OR content LIKE '%五行偏%'
             OR content LIKE '%病药%' OR content LIKE '%调候%' OR content LIKE '%羸弱%'
             OR content LIKE '%寿元%' OR content LIKE '%康健%')
        ORDER BY length(content) DESC""", CLASSIC_PREFIXES).fetchall()
    print(f'候选源条目 {len(rows)} 条')

    cands = []
    for eid, title, content in rows:
        book = title.replace('原典·', '').split('·')[0]
        for seg in extract_segments(content):
            sc, ct, ft = score(seg)
            if sc >= 3:  # 至少 1 体质词+1 命理词双命中
                cands.append((sc, book, title, seg, ct, ft))

    # 按强度排序，去重（同段落前缀近似去重）
    cands.sort(key=lambda x: -x[0])
    seen_prefix = set()
    picked = []
    for sc, book, title, seg, ct, ft in cands:
        key = seg[:40]
        if key in seen_prefix:
            continue
        seen_prefix.add(key)
        picked.append((sc, book, title, seg, ct, ft))
        if len(picked) >= TARGET:
            break
    print(f'提取候选 {len(cands)} 段 → 选定 {len(picked)} 段')

    for i, (sc, book, title, seg, ct, ft) in enumerate(picked, 1):
        bridge_lines = [f'· {t}（古籍）→ {TERM_BRIDGE[t]}（现代体质语义）'
                        for t in ct if t in TERM_BRIDGE]
        content = (f'【体质×命格 · 医命同参专题】\n\n'
                   f'出处：{title}（公有领域命理原典）\n\n'
                   f'原典原文：\n{seg}\n\n'
                   f'古今术语桥接：\n' + '\n'.join(bridge_lines) +
                   f'\n\n命理关联词：{"、".join(ft[:6])}\n'
                   f'（本条为原典段落的主题化整理，原文未改一字；白话解读由检索层/批注层按需生成）')
        eid = f"TZ|tizhi|{book}|{i:02d}|{fingerprint_of(content)[:8]}"
        ok, why = ing.insert(
            entry_id=eid, module='tizhi',
            title=f'体质×命格·{book}·{i:02d}', content=content,
            category='tizhi', keywords=f'体质,命格,医命同参,{book},{",".join(ct[:4])}',
            summary=f'{book}体质命格交叉段落·{ct[0] if ct else ""}主题',
            tags=['体质', '命格', '医命同参', 'Y5', book] + ct[:3],
            domain='mingli', trust=0.85, source='y5-tizhi-extract')
        if not ok and why != 'duplicate':
            print(f'  ✗ {eid}: {why}')
    ing.commit()

    # FTS 同步
    try:
        conn.execute("INSERT INTO kb_formal_fts(kb_formal_fts) VALUES('rebuild')")
        conn.commit()
    except Exception as e:
        print('FTS rebuild 失败:', e)
    f = conn.execute('SELECT COUNT(*) FROM kb_formal').fetchone()[0]
    t = conn.execute('SELECT COUNT(*) FROM kb_formal_fts').fetchone()[0]
    conn.close()
    print(f'═══ {ing.stats()} · formal={f} fts={t} 对齐={f == t}')


if __name__ == '__main__':
    main()
