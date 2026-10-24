#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""P8 目标语料质量门禁 + 全库同步客观巡检。

目标模块必须全绿；全库历史同文等问题只报客观值，不冒充本轮新增问题。
"""
import hashlib
import json
import re
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT / 'server/database/yidao.db'
PAT = re.compile(r'<!--ENTRY:([^|]+)\|([^|]+)\|([\d.]+)-->')
JOBS = [
    ('luoshu-shujie', 'LSSJ', 'corpus/luoshu-shujie/luoshu-shujie-transcript.md', 3, 'SRC-LUOSHU-SHUJIE-20261024'),
    ('hongfan-jiuchou-shujie', 'HFJC', 'corpus/hongfan-jiuchou-shujie/hongfan-jiuchou-shujie-transcript.md', 6, 'SRC-HONGFAN-JIUCHOU-20261024'),
    ('hongfan-huangji-neipian', 'HFNZ', 'corpus/hongfan-huangji-neipian/hongfan-huangji-neipian-transcript.md', 96, 'SRC-HONGFAN-HUANGJI-NEIPIAN-20261024'),
]
PROBES = [
    ('hongfan-huangji-neipian', '洪範皇極內篇上'),
    ('hongfan-huangji-neipian', '造化之為造化者'),
    ('hongfan-huangji-neipian', '昔者天錫禹洪範九疇'),
    ('hongfan-huangji-neipian', '鬼神者二氣之良能'),
    ('hongfan-huangji-neipian', '洪範皇極內篇下'),
    ('hongfan-huangji-neipian', '分天為九野'),
    ('hongfan-huangji-neipian', '九章命算'),
    ('hongfan-huangji-neipian', '筮者神之所為'),
    ('hongfan-huangji-neipian', '一吉而九凶'),
    ('hongfan-huangji-neipian', '洪範皇極內篇中'),
    ('hongfan-huangji-neipian', '河圖體圓而用方'),
    ('hongfan-huangji-neipian', '非九不生'),
    ('hongfan-huangji-neipian', '禮儀三百威儀三千'),
    ('hongfan-huangji-neipian', '五行二氣之分'),
    ('hongfan-huangji-neipian', '數終而復乎一'),
    ('hongfan-jiuchou-shujie', '凡三十七章'),
    ('hongfan-jiuchou-shujie', '三十五章界'),
    ('luoshu-shujie', '洛書數解'),
]


def parse(path, prefix):
    raw = (ROOT / path).read_text(encoding='utf-8')
    marks = list(PAT.finditer(raw))
    rows = {}
    for i, mark in enumerate(marks):
        tag = mark.group(1).strip()
        body = raw[mark.end():marks[i + 1].start() if i + 1 < len(marks) else len(raw)].strip()
        kw = re.search(r'(?:關鍵詞|关键词)：([^\n]+)', body)
        assert kw, f'{path} {tag} 缺关键词'
        entry_id = 'KB-' + prefix + '-' + hashlib.md5(tag.encode()).hexdigest()[:12]
        rows[entry_id] = {'title': mark.group(2).strip(), 'trust': float(mark.group(3)),
                          'content': body, 'keywords': kw.group(1).strip()}
    return rows


def main():
    failures = []
    report = {'target_modules': {}, 'global': {}, 'fts_probes': []}
    # 下篇首自然段的无损切片必须能按序还原，防止检索切片造成原文脱漏。
    transcript = (ROOT / 'corpus/hongfan-huangji-neipian/hongfan-huangji-neipian-transcript.md').read_text(encoding='utf-8')
    sliced = sorted((int(n), text) for n, text in re.findall(r'<!--ENTRY:xia-(\d+)\|.*?-->.*?原文：([^\n]+)', transcript, re.S) if int(n) <= 27)
    source = (ROOT / 'corpus/hongfan-huangji-neipian/hongfan-huangji-neipian-full-source.txt').read_text(encoding='utf-8')
    natural = source.split('洪範皇極內篇下\n\n', 1)[1].strip().split('\n\n')[0]
    lossless = len(sliced) == 27 and ''.join(text for _, text in sliced) == natural
    report['lower_long_segment_lossless'] = lossless
    if not lossless:
        failures.append('下篇首自然段27片无法逐字还原')
    db = sqlite3.connect(DB, timeout=120)
    db.execute('PRAGMA busy_timeout=120000')
    for module, prefix, path, expected, src_id in JOBS:
        entries = parse(path, prefix)
        if len(entries) != expected:
            failures.append(f'{module}: 语料 {len(entries)} != {expected}')
        formal = {r[0]: r for r in db.execute(
            'SELECT entry_id,module,title,content,category,keywords,tags,summary,trust_score,src_id,promoted_at,updated_at FROM kb_formal WHERE module=?', (module,))}
        fts = {r[0]: r for r in db.execute(
            'SELECT entry_id,module,content,category,tags,summary FROM kb_fts5 WHERE module=?', (module,))}
        if set(formal) != set(entries):
            failures.append(f'{module}: formal entry_id 与语料不一致')
        if set(fts) != set(entries):
            failures.append(f'{module}: FTS entry_id 与语料不一致')
        for entry_id, expected_row in entries.items():
            f = formal.get(entry_id)
            t = fts.get(entry_id)
            if not f or not t:
                continue
            if (f[2], f[3], f[5], f[6], f[7], f[8]) != (
                    expected_row['title'], expected_row['content'], expected_row['keywords'],
                    expected_row['keywords'], '', expected_row['trust']):
                failures.append(f'{module}/{entry_id}: formal 与语料字段不一致')
            if (t[1], t[2], t[3], t[4], t[5]) != (
                    module, expected_row['content'], '数字术数', expected_row['keywords'], ''):
                failures.append(f'{module}/{entry_id}: FTS 与语料字段不一致')
            if f[4] != '数字术数' or not f[9] or not f[10] or not f[11]:
                failures.append(f'{module}/{entry_id}: 分类、出处或同步时间缺失')
        registry = db.execute('SELECT entry_count FROM kb_module_registry WHERE module=?', (module,)).fetchone()
        source = db.execute('SELECT entry_count FROM kb_src_registry WHERE src_id=?', (src_id,)).fetchone()
        if not registry or registry[0] != expected or not source or source[0] != expected:
            failures.append(f'{module}: 注册表计数不一致')
        duplicates = db.execute('SELECT COUNT(*) FROM (SELECT content FROM kb_formal WHERE module=? GROUP BY content HAVING COUNT(*)>1)', (module,)).fetchone()[0]
        duplicate_fts = db.execute('SELECT COUNT(*) FROM (SELECT entry_id FROM kb_fts5 WHERE module=? GROUP BY entry_id HAVING COUNT(*)>1)', (module,)).fetchone()[0]
        if duplicates or duplicate_fts:
            failures.append(f'{module}: 同文或 FTS entry_id 重复')
        report['target_modules'][module] = {'expected': expected, 'formal': len(formal), 'fts5': len(fts),
                                           'duplicate_content_groups': duplicates, 'duplicate_fts_ids': duplicate_fts}

    for module, query in PROBES:
        count = db.execute('SELECT COUNT(*) FROM kb_fts5 WHERE kb_fts5 MATCH ? AND module=?', (query, module)).fetchone()[0]
        report['fts_probes'].append({'module': module, 'query': query, 'hits': count})
        if count < 1:
            failures.append(f'FTS 探针无命中：{module}/{query}')

    report['global'] = {
        'formal': db.execute('SELECT COUNT(*) FROM kb_formal').fetchone()[0],
        'fts5': db.execute('SELECT COUNT(*) FROM kb_fts5').fetchone()[0],
        'idmap': db.execute('SELECT COUNT(*) FROM kb_fts5_idmap').fetchone()[0],
        'formal_empty_entry_id': db.execute("SELECT COUNT(*) FROM kb_formal WHERE entry_id IS NULL OR entry_id=''").fetchone()[0],
        # FTS 普通列无索引；全库存在性检查经 idmap 主键完成，避免 329k×全文扫描。
        'fts_orphans': db.execute("SELECT COUNT(*) FROM kb_fts5_idmap m LEFT JOIN kb_formal k ON m.entry_id=k.entry_id WHERE k.entry_id IS NULL").fetchone()[0],
        'fts_missing': db.execute("SELECT COUNT(*) FROM kb_formal k LEFT JOIN kb_fts5_idmap m ON k.entry_id=m.entry_id WHERE k.entry_id IS NOT NULL AND k.entry_id!='' AND m.entry_id IS NULL").fetchone()[0],
        'idmap_orphans': db.execute('SELECT COUNT(*) FROM kb_fts5_idmap m LEFT JOIN kb_formal k ON m.entry_id=k.entry_id WHERE k.entry_id IS NULL').fetchone()[0],
    }
    g = report['global']
    if not (g['formal'] == g['fts5'] == g['idmap']):
        failures.append(f"全库计数不一致：{g['formal']}/{g['fts5']}/{g['idmap']}")
    for key in ('formal_empty_entry_id', 'fts_orphans', 'fts_missing', 'idmap_orphans'):
        if g[key]:
            failures.append(f'全库同步异常：{key}={g[key]}')
    db.close()
    report['status'] = 'PASS' if not failures else 'FAIL'
    report['failures'] = failures
    print(json.dumps(report, ensure_ascii=False, indent=2))
    raise SystemExit(1 if failures else 0)


if __name__ == '__main__':
    main()
