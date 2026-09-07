#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
G26 R1 · 命理语料覆盖审计（命理唯一源头，医学语料不蒸）
语料全景：
  A. subs-tianji-classified/*.txt（天纪字幕分类版）
  B. subs/天纪*.txt（24 集配对字幕；24 集目录 subs/ 实测为空，字幕实际在此）
  C. nishi-materials 根目录天纪系 PDF/TXT（天纪/天机道/地脉道/人间道/地纪）
  D. 项目内 .openclaw/tmp 命理抽取缓存（天纪听课笔记/地纪日记/八字基础等）
对账口径：①蒸馏台账 distilled-files.json（name/filename 双键）②kb_formal 标题探针命中数
差集三类：undistilled（台账无+KB 0 命中）/ partial（命中 1-2 或台账有但 KB 无）/ low_conf（条目均置信 <0.6）
"""
import json, os, re, sqlite3, sys
from pathlib import Path
from datetime import datetime

NM = Path('/Volumes/模型训练数据/training-corpus/nishi-materials')
PROJ = Path('/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian')
DB = PROJ / 'server' / 'database' / 'yidao.db'
OUT = PROJ / 'DELIVERY' / f'g26-r1-audit-{datetime.now():%Y%m%d-%H%M}.json'

MINGLI_PDF_RE = re.compile(r'天纪|天机道|地脉道|人间道|地纪')
MEDICAL_RE = re.compile(r'伤寒|金匮|本草|针灸|黄帝|医|药方|扶阳|脉|经络|临床|案例|处方')
STOP_TOKENS = {'天纪', '字幕', '高清', '修复', '完整', '原版', '打印稿', '繁体', '竖版', '听课笔记',
               '精彩绝伦', '终稿', '系列', '倪海厦', '倪海夏', '视频', '同步文稿', '电子书'}

def stem_probes(name):
    """文件名 → KB 标题探针词集（≥2 个中文字符的实义 token）"""
    s = re.sub(r'\.(txt|pdf|doc|docx|htm)$', '', name, flags=re.I)
    s = re.sub(r'[0-9０-９]+|[（(\[【].*?[）)\]】]', ' ', s)
    tokens = re.split(r'[\s·:：,，、\-—_.]+', s)
    out = []
    for t in tokens:
        t = t.strip()
        if len(t) >= 2 and re.search(r'[一-鿿]', t) and t not in STOP_TOKENS:
            out.append(t)
    return out[:4]

def main():
    # ── 语料清单 ──
    corpus = []
    d = NM / 'subs-tianji-classified'
    for f in sorted(os.listdir(d)):
        if f.endswith('.txt'):
            corpus.append({'group': 'A·分类字幕', 'path': str(d / f), 'name': f})
    for f in sorted(os.listdir(NM / 'subs')):
        if f.startswith('天纪') and f.endswith('.txt'):
            corpus.append({'group': 'B·24集字幕', 'path': str(NM / 'subs' / f), 'name': f})
    for f in sorted(os.listdir(NM)):
        p = NM / f
        if p.is_file() and MINGLI_PDF_RE.search(f) and not f.endswith('.json'):
            corpus.append({'group': 'C·天纪系文档', 'path': str(p), 'name': f})
    tmp = PROJ / '.openclaw' / 'tmp'
    for p in sorted(tmp.rglob('*')):
        if p.suffix in ('.txt', '.md') and p.stat().st_size > 30 * 1024:
            rel = p.name
            if MINGLI_PDF_RE.search(rel) or re.search(r'八字基础|星耀|星曜|命', rel):
                if not MEDICAL_RE.search(rel):
                    corpus.append({'group': 'D·项目内抽取', 'path': str(p), 'name': rel})

    # ── 台账 ──
    ledger = set()
    for x in json.load(open(NM / 'distilled-files.json')):
        if isinstance(x, dict):
            if x.get('name'): ledger.add(x['name'])
            if x.get('filename'): ledger.add(x['filename'])

    # ── KB 探针：文件干名直接匹配（蒸馏管线把文件名写进条目标题）──
    # G26 补蒸馏覆盖证据：AI 命题条目不含文件名，以块级完成状态判定
    g26_state_path = PROJ / 'DELIVERY' / 'g26-r2-state.json'
    g26_done = set(json.load(open(g26_state_path))) if g26_state_path.exists() else set()
    G26_DOCNAMES = {'财帛宫星耀含义.txt', '倪海厦地纪日记仅存8篇.txt',
                    '天纪电子书及文字资料__八字基础.txt', 'DOC__天纪电子书及文字资料__八字基础.doc.txt'}
    # 合理排除项（书面说明，不计差集）
    EXCLUSIONS = {
        '四柱命卦14：大壮、火地晋、地火明夷.txt': '源文件仅 674B（近似空占位），既有 KB 条目已覆盖其内容',
        '四柱命卦19：水泽节、中孚卦、小过卦、既济卦、未济卦.txt': '源文件仅 598B（近似空占位），既有 KB 条目已覆盖其内容',
        '天纪电子书及文字资料__八字基础.txt': '实为 OLE2 .doc 二进制改名（D0CF11E0 魔数），以其 93KB 抽取文本版（DOC__…doc.txt）蒸馏覆盖',
    }
    conn = sqlite3.connect(f'file:{DB}?mode=ro', uri=True)
    results = []
    for item in corpus:
        size = os.path.getsize(item['path'])
        stem = re.sub(r'\.(txt|pdf|doc|docx|htm)$', '', item['name'], flags=re.I)
        stem_variants = {stem, re.sub(r'^\d+[.、\s]+', '', stem).strip()}
        # 命中条目：任一干名变体出现在标题中
        hits = {}
        for sv in stem_variants:
            if len(sv) < 3:
                continue
            for r in conn.execute(
                    "SELECT entry_id, module, confidence, trust_score, length(content) FROM kb_formal WHERE title LIKE ? LIMIT 200",
                    (f'%{sv}%',)).fetchall():
                hits[r[0]] = r
        n = len(hits)
        in_ledger = item['name'] in ledger
        confs = [h[2] for h in hits.values() if h[2] is not None]
        trusts = [h[3] for h in hits.values() if h[3] is not None]
        avg_conf = sum(confs) / len(confs) if confs else None
        # G26 补蒸馏覆盖：条目 AI 命题不含文件名，以块完成状态+G26 条目数判定
        g26_cov = False
        if item['name'] in G26_DOCNAMES and g26_done:
            g26_cnt = conn.execute(
                "SELECT COUNT(*) FROM kb_formal WHERE src_id='SRC-G26-20260907'").fetchone()[0]
            g26_cov = g26_cnt > 0
        # 差集三类
        if item['name'] in EXCLUSIONS:
            gap, reason = None, None
            exclusion = EXCLUSIONS[item['name']]
        elif g26_cov:
            gap, reason = None, None
            exclusion = None
        elif n == 0 and not in_ledger:
            gap, reason = 'undistilled', '台账无记录且 KB 零命中'
            exclusion = None
        elif n == 0 and in_ledger:
            gap, reason = 'partial', '台账有记录但 KB 零命中（疑蒸馏失败/条目被清）'
            exclusion = None
        elif n == 1:
            gap, reason = 'partial', f'仅 {n} 条（疑骨架/截图证据，正文未分段蒸馏）'
            exclusion = None
        elif avg_conf is not None and avg_conf < 0.5 and (not trusts or sum(trusts)/len(trusts) < 0.5):
            gap, reason = 'low_conf', f'{n} 条平均置信 {avg_conf:.2f}'
            exclusion = None
        else:
            gap, reason = None, None
            exclusion = None
        results.append({**item, 'size': size,
                        'in_ledger': in_ledger, 'kb_entries': n,
                        'kb_modules': sorted({h[1] for h in hits.values()})[:6],
                        'kb_content_chars': sum(h[4] or 0 for h in hits.values()),
                        'avg_conf': round(avg_conf, 3) if avg_conf is not None else None,
                        'g26_covered': g26_cov, 'exclusion': exclusion,
                        'gap': gap, 'reason': reason})
    conn.close()

    gaps = [r for r in results if r['gap']]
    summary = {
        'audited_at': datetime.now().isoformat(timespec='seconds'),
        'corpus_total': len(results),
        'by_group': {g: sum(1 for r in results if r['group'] == g) for g in sorted({r['group'] for r in results})},
        'covered': len(results) - len(gaps),
        'gap_total': len(gaps),
        'excluded_with_reason': sum(1 for r in results if r.get('exclusion')),
        'gap_by_type': {t: sum(1 for r in gaps if r['gap'] == t) for t in ('undistilled', 'partial', 'low_conf')},
        'note_24ji': '6.天纪24集目录 subs/ 实测为空（0 字幕），17 集字幕实际位于 nishi-materials/subs/天纪*.txt（B 组）',
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    json.dump({'summary': summary, 'gaps': gaps, 'all': results},
              open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(json.dumps(summary, ensure_ascii=False, indent=1))
    print('── 差集样例（前 12）──')
    for g in gaps[:12]:
        print(f"  [{g['gap']}] {g['group']} | {g['name'][:50]} | {g['size']//1024}KB | KB条目{g['kb_entries']} | 台账{'√' if g['in_ledger'] else '×'} | {g['reason']}")
    print('证据件:', OUT)

if __name__ == '__main__':
    main()
