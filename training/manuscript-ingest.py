#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""手稿蒸馏入库（校勘规范 v2.2 · 手稿校对规则 · Phase 2）
对象：reports/manuscript-collate-20261013.jsonl 中 verdict=手稿独有 且清洗后 ≥100 字
口径：KBIngestor 指纹幂等；trust=0.80（蒸馏草案上限）；audit_status='pending'（存疑待审不独断）；
      domain=mingli；category=手稿源文件名本体；content 清洗 OCR 脚手架（=== slideN === 等），
      原始转录稿保留在 knowledge/collected/manuscript-*.jsonl 不删。
收尾：跑 scripts/kb-sync-guard.py --sync 1 同步 fts5。"""
import sqlite3, json, glob, re, sys, datetime, time
sys.path.insert(0, 'scripts')
from lib.kb_ingest import KBIngestor

DB = 'server/database/yidao.db'
LEDGER = 'reports/manuscript-collate-20261013.jsonl'
SLIDE = re.compile(r'===\s*(slide|page)\s*\d+\s*===|===.*?===|---\s*PAGE BREAK\s*---', re.I)

def clean(t):
    return re.sub(r'\n{3,}', '\n\n', SLIDE.sub('', t or '')).strip()

def stem(src):
    s = re.sub(r'\.(pdf|pptx?|docx?|txt)$', '', src or '佚名手稿')
    return re.sub(r'\s+', '', s)[:30]

def main():
    ok_idx = set()
    for line in open(LEDGER, encoding='utf-8'):
        r = json.loads(line)
        if r['verdict'] == '手稿独有':
            ok_idx.add(r['idx'])
    entries = []
    for fp in sorted(glob.glob('knowledge/collected/manuscript-*.jsonl')):
        for line in open(fp, encoding='utf-8'):
            line = line.strip()
            if line:
                try: entries.append(json.loads(line))
                except Exception: pass

    for attempt in range(12):
        try:
            con = sqlite3.connect(DB, timeout=120)
            ing = KBIngestor(con, batch_size=300)
            n_skip_short = n_ing = 0
            seq = {}
            for i, e in enumerate(entries):
                if i not in ok_idx: continue
                body = clean(e.get('content') or '')
                if len(body) < 100:
                    n_skip_short += 1; continue
                st = stem(e.get('source'))
                seq[st] = seq.get(st, 0) + 1
                mod = e.get('module') or 'mingli'
                eid = f"MS|{mod}|{e.get('fingerprint') or (st + '-' + str(seq[st]))}"
                title = f"手稿·{st}·段{seq[st]}"
                kw = ' '.join(dict.fromkeys(['手稿转录', '活化蒸馏', mod, st] +
                            [k for k in (e.get('keywords') or '').replace(',', ' ').replace('、', ' ').split() if len(k) >= 2][:6]))
                ok, why = ing.insert(
                    entry_id=eid, module=mod, title=title, content=body,
                    category=st, keywords=kw, summary=body[:100].replace('\n', ' '),
                    src_id='manuscript:' + (e.get('source') or '')[:60],
                    tags=['手稿转录', mod], domain='mingli', trust=0.80,
                    source='manuscript-staging')
                if ok:
                    n_ing += 1
                    con.execute("UPDATE kb_formal SET audit_status='pending', audit_notes=? WHERE entry_id=?",
                                ('手稿转录对照蒸馏：KB 无古籍同源（独有），存疑待命理师审；原稿见 knowledge/collected', eid))
            ing.conn.commit()
            con.commit()
            print(f'入库 {n_ing} 条（短碎片跳过 {n_skip_short}，幂等去重 {ing.duplicates}）')
            c = con.execute("SELECT COUNT(*) FROM kb_formal WHERE promoted_from='manuscript-staging'").fetchone()[0]
            p = con.execute("SELECT COUNT(*) FROM kb_formal WHERE promoted_from='manuscript-staging' AND audit_status='pending'").fetchone()[0]
            print(f'库内手稿转录累计 {c} 条，其中 pending 待审 {p}')
            con.close()
            print('下一步：/usr/bin/python3 scripts/kb-sync-guard.py --sync 1')
            sys.exit(0)
        except sqlite3.OperationalError as ex:
            print(f'[{attempt+1}/12] 锁库等待… {ex}', flush=True); time.sleep(60)
    print('12 次重试仍锁，待下棒'); sys.exit(1)

if __name__ == '__main__':
    main()
