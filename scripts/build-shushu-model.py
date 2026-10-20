#!/usr/bin/env python3
"""build-shushu-model.py — 术数全书新专库合并小模型（第五十一轮）
15 个新专库合并为单个 SHUSHU_KB：tianbu-zhenyuan / taiqing-shenjian /
chunqiu-zanshu / yisi-zhan / zichu / zhengyi-xinfa / jingyou-liuren /
luoluzi / shuilong-jing / chuxing-baojing / bingding-guijian / jirui /
qianyuan-mizhi / lixuzhong / wanbishu
规则：junk 排除；关键词取 keywords 字段 + 书名衍生键；正文直录不改字。
用法：python3 scripts/build-shushu-model.py
"""
import sqlite3, json, re, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT / 'server' / 'database' / 'yidao.db'
OUT = ROOT / 'app' / 'knowledge-models' / 'shushu-model.js'

MODULES = {
    'tianbu-zhenyuan':  '天步真原',   'taiqing-shenjian': '太清神鉴',
    'chunqiu-zanshu':   '春秋占筮',   'yisi-zhan':        '乙巳占',
    'zichu':            '字触',       'zhengyi-xinfa':    '正易心法',
    'jingyou-liuren':   '六壬神定经', 'luoluzi':          '珞琭子',
    'shuilong-jing':    '水龙经',     'chuxing-baojing':  '出行宝镜',
    'bingding-guijian': '丙丁龟鉴',   'jirui':            '稽瑞',
    'qianyuan-mizhi':   '乾元秘旨',   'lixuzhong':        '李虚中命书',
    'wanbishu':         '万毕术',
}

db = sqlite3.connect(DB)
ph = ','.join('?' * len(MODULES))
rows = db.execute(
    f"SELECT entry_id,module,title,content,keywords FROM kb_formal WHERE module IN ({ph}) "
    "AND entry_id NOT IN (SELECT entry_id FROM kb_corpus_tag WHERE tag='junk') "
    "ORDER BY module, entry_id", list(MODULES)).fetchall()

inv = {}
items = []

def add_kw(kw, idx):
    kw = (kw or '').strip()
    if len(kw) < 2:
        return
    inv.setdefault(kw, [])
    if idx not in inv[kw]:
        inv[kw].append(idx)

for i, (eid, mod, title, content, keywords) in enumerate(rows):
    book = MODULES.get(mod, mod)
    kw_list = [k.strip() for k in (keywords or '').split(',') if k.strip()]
    items.append({
        'title': title or '',
        'kw': kw_list[0] if kw_list else book,
        'mod': mod,
        'summary': '',
        # 内容截 800 字（三段式 sec1 上限 500 字足够），控制页面负载（全文仍在服务端 KB）
        'content': (content or '')[:800],
    })
    for k in kw_list:
        add_kw(k, i)
    # 书名键（繁简/别名）+ 课节号锚（OCR第N节/第N课）
    add_kw(book, i)
    m = re.search(r'第([0-9一二三四五六七八九十百]+)[课节]', title or '')
    if m:
        add_kw('第%s课' % m.group(1), i)
        add_kw('第%s节' % m.group(1), i)

now = datetime.datetime.now(datetime.UTC).strftime('%Y-%m-%dT%H:%M:%S.000Z')
model = {
    'module': 'shushu',
    'version': 'v1',
    'count': len(items),
    'built_at': now,
    'invertedIndex': inv,
    'items': items,
}
js = ('// ═══════════════════════════════════════════════════════════════\n'
      '// 命理宝鉴 · shushu 术数全书新专库合并小模型（15 部·自动生成）\n'
      f'// 生成时间: {now}\n// 条目数: {len(items)}\n'
      '// 来源: kb_formal（术数全书家族专库）· scripts/build-shushu-model.py\n'
      '// ═══════════════════════════════════════════════════════════════\n'
      'window.SHUSHU_KB = ' + json.dumps(model, ensure_ascii=False, indent=1) + ';\n')
OUT.write_text(js, encoding='utf-8')
print('written', OUT, 'entries', len(items), 'keywords', len(inv), 'bytes', OUT.stat().st_size)
