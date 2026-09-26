#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
distill-backlog-ingest.py — 蒸馏落盘→入库的补账通道（R804 · 2026-09-18）

背景：夜间蒸馏落盘（training-data/kb-web-distill/distill-*.jsonl）与主表入库之间
存在断链——09-17 两批 28 条中 14 条从未入库（昨晨 R795 记「+20 走五红线入库 14 条」
只覆盖了当时的工作集，xingming 域整批 6 条与 09-17 bazi 1 条、09-18 全批 8 条滞留盘上）。

本脚本扫描近 N 天 distill jsonl，逐条按 KB-QUALITY-RULES 五红线全检后入库：
  红线2 entry_id 生成     红线3 内容指纹幂等（跨全库比对）
  红线4 经出处/来源标注    红线5 长度门槛（分域 60/100）+ 主题锚点
  红线1 不碰 fts5（交 kb-sync-guard --sync）
用法：python3 scripts/distill-backlog-ingest.py [--days 3]
"""
import sqlite3, hashlib, json, re, sys, argparse, glob
from datetime import datetime, timedelta

DB = 'server/database/yidao.db'
SRC_ID = 'SRC-WEB-DISTILL'
# 分域长度门槛（R796 校准口径）
LEN_BY_DOMAIN = {'yangsheng': 60, 'huangli': 60, 'mantra': 60, 'xingming': 60, '_default': 100}
# 主题锚点（按域给最小集合；命理/养生核心词）
ANCHOR = {
    'yangsheng': re.compile(r'养生|起居|饮食|阳气|阴气|润燥|收敛|进补|保暖|养肺|护阳|滋阴|平补|润肺'),
    'xingming': re.compile(r'姓名|五格|三才|数理|笔画|生辰|起名|名字|命宫|音律|字义'),
    'bazi': re.compile(r'八字|四柱|月令|格局|取格|用神|十神|大运|流年|日主|命理'),
    'huangli': re.compile(r'黄历|宜|忌|节气|干支|吉时|冲煞|黄道|黑道|建除|十二神|值日|择日|时辰|吉凶神煞'),
    # 2026-09-26 R-K1 校准：专域子题行话不含泛域词被误拦（月建/日辰/飞伏/进退 15 条假阴性实证）
    'liuyao': re.compile(r'六爻|纳甲|月建|日辰|世应|动爻|变爻|伏神|飞神|进神|退神|旬空|六亲|六神|用神|卦'),
    'meihua': re.compile(r'梅花|体用|互卦|变卦|起卦|卦气|外应|动爻'),
    'jieqi': re.compile(r'节气|物候|候应|七十二候|月令|三候|秋分|寒露|霜降|立春|雨水|惊蛰|春分|清明|谷雨|夏至|芒种'),
    'wuhou': re.compile(r'物候|候应|节气|七十二候|立秋|处暑|白露|秋分'),
    'ziwei': re.compile(r'紫微|命宫|星曜|四化|宫位|大限|流年|主星|迁移|财帛|官禄'),
    'qimen': re.compile(r'奇门|遁甲|九星|八门|八神|值符|值使|天盘|地盘'),
    'liuren': re.compile(r'六壬|三传|四课|天将|月将|占断|课体|神煞'),
    'fengshui': re.compile(r'风水|龙脉|峦头|理气|明堂|砂|穴|朝向|化煞|玄空|飞星'),
    '_default': re.compile(r'周易|命理|八字|紫微|六爻|奇门|风水|养生|中医|节气'),
}

def fp(content: str) -> str:
    return hashlib.sha256(content.strip().encode('utf-8', 'ignore')).hexdigest()

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--days', type=int, default=3)
    args = ap.parse_args()
    conn = sqlite3.connect(DB)
    conn.execute('PRAGMA busy_timeout=30000')
    cur = conn.cursor()
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    # 全库内容指纹集（红线3 幂等）
    lib_fps = set()
    for (c,) in cur.execute("SELECT CAST(content AS TEXT) FROM kb_formal"):
        if c: lib_fps.add(fp(str(c)))

    days = [(datetime.now()-timedelta(days=i)).strftime('%Y-%m-%d') for i in range(args.days)]
    files = [f for f in sorted(glob.glob('training-data/kb-web-distill/distill-*.jsonl'))
             if any(d in f for d in days)]
    inserted, skipped = [], []
    for path in files:
        for line in open(path, encoding='utf-8'):
            line = line.strip()
            if not line: continue
            try: r = json.loads(line)
            except json.JSONDecodeError: continue
            module = (r.get('module') or '').strip()
            title = (r.get('title') or '').strip()
            content = (r.get('content') or '').strip()
            if not module or not title or not content:
                skipped.append((title[:20], '字段缺失')); continue
            # 红线5：长度分域门槛
            lm = LEN_BY_DOMAIN.get(module, LEN_BY_DOMAIN['_default'])
            if len(content) < lm:
                skipped.append((title[:20], f'短<{lm}')); continue
            # 红线5：主题锚点
            an = ANCHOR.get(module, ANCHOR['_default'])
            if not an.search(title + content):
                skipped.append((title[:20], '无锚点')); continue
            # 红线3：指纹幂等
            f = fp(content)
            if f in lib_fps:
                skipped.append((title[:20], '指纹重复')); continue
            # 红线2/4：entry_id + 出处（web 蒸馏源已在 jsonl 带来源时沿用，否则标注蒸馏源）
            h = hashlib.sha256(f'{module}|{content}'.encode()).hexdigest()[:12]
            entry_id = f'KB-WD-{h}'
            src_note = r.get('source') or r.get('src') or ''
            if src_note and src_note not in content:
                content = f"{content}（来源：{src_note}）"
            # R805 修真(2026-09-26 裁判)：INSERT 列/值错位（12列13值）导致补账全败；
            # 补 status 列接原第13值，并按惯例落 domain（yangsheng 归空域，其余归 mingli）
            domain = '' if module == 'yangsheng' else 'mingli'
            try:
                cur.execute("""INSERT INTO kb_formal
                    (entry_id, module, title, content, src_id, category, keywords, summary,
                     trust_score, version, promoted_at, promoted_from, status, domain)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                    (entry_id, module, title, content, SRC_ID, module,
                     json.dumps([module], ensure_ascii=False), title[:80],
                     0.6, 1, now, 'web-distill-backlog', 'formal', domain))
                inserted.append((entry_id, module, title[:28]))
                lib_fps.add(f)
            except sqlite3.Error as e:
                skipped.append((title[:20], f'DB:{e}'))
    conn.commit()
    print(f'扫描 {len(files)} 个文件：入库 {len(inserted)} / 跳过 {len(skipped)}')
    for x in inserted: print('  +', x)
    from collections import Counter
    if skipped: print('  跳过分布:', dict(Counter(s[1] for s in skipped)))
    conn.close()
    sys.exit(0)

if __name__ == '__main__':
    main()
