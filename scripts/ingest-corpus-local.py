#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""本地 corpus 原典入库（2026-09-28 · 知识密度翻倍计划 Phase A）

口径：R-INGEST-SPEC-20260927（KBIngestor：指纹幂等 / status=formal / domain=mingli / trust 0.95 原典）
红线：原典原文不改写（仅清洗 wikisource/kanripo 模板标记）；>9000 字均分切片（批16 规约）。
用法：python3 ingest-corpus-local.py            # dry-run
      python3 ingest-corpus-local.py --apply
"""
import os, re, sys, sqlite3, hashlib
from pathlib import Path

ROOT = Path('/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian')
DB = ROOT / 'server' / 'database' / 'yidao.db'
C = ROOT / 'corpus'
sys.path.insert(0, str(ROOT / 'scripts'))
from lib.kb_ingest import KBIngestor

APPLY = '--apply' in sys.argv
CAP = 9000

# (目录/文件, 书名, 模块, 标签) — 已对账：零重叠或仅引用级重叠
JOBS = [
    # Phase A-1 零重叠全量
    ('liuren-daqquan/卷*.txt',       '大六壬大全',   'liuren',  ['六壬', '大六壬大全', '原典']),
    ('qimen/qimen-yuanling-jing.txt','奇门元灵经',   'qimen',   ['奇门', '元灵经', '原典']),
    ('yangzhai/yangzhai-chanyao.txt','阳宅阐要',     'yangzhai',['阳宅', '风水', '原典']),
    ('yangzhai/yangzhai-zhinan.txt', '阳宅指南',     'yangzhai',['阳宅', '风水', '原典']),
    ('jieqi/月令七十二候集解.txt',   '月令七十二候集解','zeri', ['月令', '七十二候', '节气', '原典']),
    ('taisui/KR5g0097_*.txt',        '元辰章醮立成历', 'taisui', ['太岁', '元辰', '道藏', '原典']),
    ('taisui/KR5g0098_*.txt',        '六十甲子本命元辰历','taisui', ['太岁', '本命元辰', '道藏', '原典']),
    ('yijing/周易參同契發揮.txt',    '周易参同契发挥','yijing', ['参同契', '丹道', '原典']),
    ('yijing/周易參同契分章通真義.txt','周易参同契分章通真义','yijing', ['参同契', '丹道', '原典']),
    ('yijing/周易參同契解.txt',      '周易参同契解', 'yijing',  ['参同契', '丹道', '原典']),
    ('yijing/周易參同契註 (陰長生).txt','周易参同契注(阴长生)','yijing', ['参同契', '丹道', '原典']),
    ('yijing/周易啓蒙翼傳 (四庫全書本)_外篇.txt','周易启蒙翼传·外篇','yijing', ['易学', '启蒙翼传', '原典']),
    ('yijing/周易本義*.txt',         '周易本义',     'yijing',  ['易学', '本义', '朱熹', '原典']),
    ('yijing/周易象辭*.txt',         '周易象辞',     'yijing',  ['易学', '象辞', '原典']),
    ('yijing/周易鄭康成註.txt',      '周易郑康成注', 'yijing',  ['易学', '郑玄', '原典']),
    ('yijing/周易闡真*.txt',         '周易阐真',     'yijing',  ['易学', '阐真', '刘一明', '原典']),
    ('yijing/周易乾鑿度 (四庫全書本).txt','周易乾凿度','yijing', ['易学', '纬书', '原典']),
    ('yijing/繫辭傳.txt',            '系辞传',       'yijing',  ['易学', '系辞', '原典']),
    ('yijing/周易正義_*.txt',        '周易正义',     'yijing',  ['易学', '正义', '孔颖达', '原典']),
    # Phase A-2 互补全本（库内仅有注解/引用，无原典全文）
    ('qiongtong-baojian/full.txt',   '穷通宝鉴(栏江网)','bazi', ['八字', '穷通宝鉴', '调候', '原典']),
    ('meihua-yishu/juan*.txt',       '梅花易数',     'meihua',  ['梅花易数', '邵雍', '原典']),
    ('yijing/周易_*.txt',            '周易·卦爻辞',  'yijing',  ['易经', '卦爻辞', '原典']),
    # Phase B 扛鼎补本（2026-09-28 Kanripo KR3g0042 文渊阁四库本）
    ('sanming-tonghui/KR3g0042_*.txt','三命通会',    'bazi',    ['八字', '三命通会', '万民英', '原典']),
]

SKIP_NAMES = {'周易.txt', '周易正義.txt', '周易注疏 (四庫全書本).txt', '_titles.json'}  # 门户/索引/空壳

def clean(raw: str) -> str:
    """洗去 wikisource/kanripo 模板标记，不动原文文字。"""
    raw = re.sub(r'\{\{[^{}]*\}\}', '', raw)          # {{header2...}} 等模板
    raw = re.sub(r'\{\{[^{}]*\}\}', '', raw)          # 嵌套再洗一遍
    raw = re.sub(r'<[^>\n]*>', '', raw)               # mandoku <pb:...> 等标记
    lines = []
    for l in raw.split('\n'):
        if l.startswith('#'):                         # mandoku/wikisource 头信息行
            continue
        l = re.sub(r'^[;:*#]+\s?', '', l)             # 列表/定义符
        l = re.sub(r"'''?", '', l)                    # 粗体标记
        lines.append(l.rstrip())
    text = '\n'.join(lines)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

def chunks(text: str):
    if len(text) <= CAP:
        return [text]
    n = (len(text) + CAP - 1) // CAP
    size = (len(text) + n - 1) // n
    return [text[i*size:(i+1)*size] for i in range(n)]

def main():
    con = sqlite3.connect(DB, timeout=60)
    con.execute("PRAGMA busy_timeout=60000")
    ing = KBIngestor(con)
    plan = []
    for pattern, book, module, tags in JOBS:
        files = sorted(C.glob(pattern))
        if not files:
            print(f'!! 未命中: {pattern} ({book})')
            continue
        for f in files:
            if f.name in SKIP_NAMES or f.stat().st_size < 300:
                continue
            raw = clean(f.read_text(encoding='utf-8', errors='replace'))
            if len(raw) < 200:
                continue
            stem = re.sub(r'\.txt$', '', f.name)
            parts = chunks(raw)
            for i, part in enumerate(parts):
                suffix = stem if len(parts) == 1 else f'{stem}·{i+1}'
                eid = 'COR|' + module + '|' + book + '|' + suffix + '|' + hashlib.sha256(part.encode()).hexdigest()[:6]
                plan.append((eid, module, f'原典·{book}·{suffix}', part, book, tags))
    print(f'{"APPLY" if APPLY else "DRY-RUN"} · 计划入库 {len(plan)} 条')
    from collections import Counter
    for k, v in sorted(Counter(p[1] + "/" + p[4] for p in plan).items(), key=lambda x: -x[1]):
        print(f'  {k:<44}{v:>4} 条')
    if APPLY:
        for eid, module, title, part, book, tags in plan:
            ing.insert(entry_id=eid, module=module, title=title, content=part,
                       category=module, keywords='·'.join(tags[:3]),
                       summary=f'{book}原典（本地 corpus 全本入库）',
                       tags=tags, domain='mingli', trust=0.95, source='corpus-local')
        ing.commit()
        print(ing.stats())
    con.close()

if __name__ == '__main__':
    main()
