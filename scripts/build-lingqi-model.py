#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""从 kb_formal(lingqi) 生成 app/knowledge-models/lingqi-model.js 前端小模型。
格式对齐 liuren-model.js：window.ML_LINGQI_MODEL = {invertedIndex, items, search()} + window.LINGQI_KB 别名。
幂等：全量重读库重写文件。
"""
import json, re, sqlite3, datetime, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
DB = ROOT / 'server' / 'database' / 'yidao.db'
OUT = ROOT / 'app' / 'knowledge-models' / 'lingqi-model.js'

con = sqlite3.connect(str(DB))
rows = con.execute(
    "SELECT entry_id,title,content,keywords FROM kb_formal WHERE module='lingqi' "
    "ORDER BY CASE WHEN keywords LIKE '%四库净本%' THEN 0 ELSE 1 END, entry_id"
).fetchall()
con.close()
if not rows:
    sys.exit('lingqi module empty, abort')

items = []
inv = {}

def add_kw(kw, idx):
    kw = (kw or '').strip()
    if len(kw) < 2:
        return
    inv.setdefault(kw, [])
    if idx not in inv[kw]:
        inv[kw].append(idx)

for i, (eid, title, content, keywords) in enumerate(rows):
    kw_list = [k.strip() for k in (keywords or '').split(',') if k.strip()]
    items.append({
        'title': title or '',
        'kw': kw_list[0] if kw_list else '灵棋经',
        'summary': '',
        'content': content or '',
    })
    for k in kw_list:
        add_kw(k, i)
    # 卦名衍生词：大通卦→大通卦；课号：第一课 / 第1课
    m = re.search(r'(第[一二三四五六七八九十百零〇]+课)\s*([^\s（(]+卦)', title or '')
    if m:
        add_kw(m.group(1), i)
        add_kw(m.group(2), i)
    add_kw('灵棋', i)
    add_kw('灵棋经', i)

now = datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S.000Z')
model = {
    'module': 'lingqi',
    'version': 'v1',
    'count': len(items),
    'built_at': now,
    'invertedIndex': inv,
    'items': items,
}

header = """// ═══════════════════════════════════════════════════════════════
// 命理宝鉴 · lingqi 模块自动生成小模型（灵棋经 · OCR版+四库净本双版本）
// 生成时间: %(now)s
// 条目数: %(n)d
// 来源: kb_formal (lingqi) · scripts/build-lingqi-model.py
// ═══════════════════════════════════════════════════════════════

""" % {'now': now, 'n': len(items)}

search_fn = """
  // 检索函数
  search(query, limit) {
    const q = (query || '').replace(/[，。、；：""''！？《》（）s[]【】]/g, ' ').trim();
    const terms = q.split(' ').filter(w => w.length >= 2);
    if (terms.length === 0) return [];
    const scores = {};
    terms.forEach(term => {
      (this.invertedIndex[term] || []).forEach(idx => {
        scores[idx] = (scores[idx] || 0) + 1;
      });
    });
    return Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit || 5)
      .map(([idx, score]) => ({ ...this.items[parseInt(idx)], score }));
  }
};

console.debug('[ML model] lingqi loaded, %d entries');
"""

# 组装：module/version/count/built_at 用字面量，invertedIndex/items 用 JSON
out = header
out += "window.ML_LINGQI_MODEL = {\n"
out += "  module: 'lingqi',\n  version: 'v1',\n"
out += "  count: %d,\n" % len(items)
out += "  built_at: '%s',\n\n" % now
out += "  // 倒排索引：keyword -> [item_idx, ...]\n"
out += "  invertedIndex: " + json.dumps(inv, ensure_ascii=False, separators=(',', ':')) + ",\n\n"
out += "  // 全部条目列表\n"
out += "  items: " + json.dumps(items, ensure_ascii=False, separators=(',', ':')).replace('},{', '},\n{') + ",\n"
out += search_fn % len(items)
out += "\n\nwindow.LINGQI_KB = window.ML_LINGQI_MODEL;\n"

OUT.write_text(out, encoding='utf-8')
print('written', OUT, 'entries', len(items), 'keywords', len(inv), 'bytes', OUT.stat().st_size)
