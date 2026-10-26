#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ingest-zhuge.py — 《诸葛神数》384签入 kb_formal（2026-10-20 · 第六十一轮）
源：corpus/zhuge-shenshu/zhuge-384-final.json
    签诗+解签：世纪国学全文页（384/384 全）
    吉凶/宫位/解签二/详解：神巴巴（部分，105-384 因 403 封禁待补）
    签诗两源互校 29 处，8 处缺字补足，校记见 meta.collation 及各条 yiwen
产出：
  1. kb_formal module='zhuge'，trust=0.7（民俗传本·两站互校，非古籍原本），fingerprint='ZG|' 幂等
  2. kb_fts5 批量同步
  3. kb_module_registry 注册 zhuge → 卜筮 group
"""
import hashlib, json, sqlite3, subprocess, sys
from pathlib import Path
from lib.kb_ingest import KBIngestor
from yidao_safe import safe_close

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT / 'server' / 'database' / 'yidao.db'
SRC_JSON = ROOT / 'corpus' / 'zhuge-shenshu' / 'zhuge-384-final.json'
SRC = 'zhuge-shenshu:世纪国学+神巴巴两站互校(民俗传本)'
FP_PREFIX = 'ZG|'

OCCULT_METHOD = ('占法：焚香敬神後，隨意報出三個字（或寫三字），按繁體筆畫數，'
                 '每字取個位（十以上去十），組成三位數；超過384則累減384，'
                 '直至小於等於384，即為所得簽號。誠心求簽，一事一占。')


def main():
    data = json.loads(SRC_JSON.read_text(encoding='utf-8'))
    signs = data['signs']
    assert len(signs) == 384, f'signs={len(signs)}'

    entries = []
    entries.append((
        '諸葛神數·卷首（占法）',
        f'【諸葛神數·占法】{OCCULT_METHOD}\n\n全書384簽，照大易三百八十四爻之數。',
        '諸葛神數,占法,報字,測字,諸葛亮,384簽,占卜'))

    for s in signs:
        jx = f" {s['jixiong']}" if s['jixiong'] else ''
        gw = f"（{s['gongwei']}）" if s['gongwei'] else ''
        title = f"諸葛神數·第{s['n']}簽{jx}"
        parts = [f"【諸葛神數·第{s['n']}簽】{jx.strip()}{gw}",
                 f"\n簽詩：\n{s['verse']}",
                 f"\n【解簽】{s['jie1']}"]
        if s['jie2']:
            parts.append(f"\n【解簽二·古文斷語】{s['jie2']}")
        if s['xiangjie']:
            parts.append(f"\n【詳解】{s['xiangjie']}")
        if s.get('yiwen'):
            parts.append(f"\n【校記】{s['yiwen']}")
        body = ''.join(parts)
        kw = f"諸葛神數,第{s['n']}簽,{s['jixiong'] or '簽'},測字,占卜,簽詩,諸葛亮"
        entries.append((title, body, kw))

    conn = sqlite3.connect(str(DB), timeout=120)
    conn.execute('PRAGMA busy_timeout=120000')
    fps = {r[0] for r in conn.execute(
        "SELECT fingerprint FROM kb_formal WHERE fingerprint LIKE 'ZG|%'",)}

    ing = KBIngestor(conn)
    try:
        conn.execute('BEGIN IMMEDIATE')
        for title, content, kw in entries:
            full = (f'【{title}】（民俗傳本·諸葛神數384簽·'
                    f'世紀國學全文頁與神巴巴兩站互校·簽詩校勘29處）\n\n{content}\n\n'
                    f'关键词：诸葛神数 测字 占卜 {title}')
            fp = FP_PREFIX + hashlib.md5(('zhuge' + full).encode()).hexdigest()[:12]
            ing.upsert(entry_id='KB-ZG-' + fp[3:], module='zhuge',
                       title='傳本·' + title, content=full, keywords=kw, tags=kw,
                       src_id=SRC, category='占卜', trust=0.7, source='corpus-rebuild')
    except Exception:
        conn.rollback()
        safe_close(conn)
        raise
    print(ing.stats(), flush=True)

    note = ('民俗傳本（非古籍原本）；384簽全（簽詩+簡解384/384；吉凶/宮位/解簽二/詳解106/384待封禁解除後補）；'
            '世紀國學全文頁+神巴巴兩站互校，簽詩校勘29處')
    conn.execute(
        """INSERT INTO kb_module_registry (module, std_group, display_name, domain, entry_count, note, updated_at)
           VALUES ('zhuge','卜筮','诸葛神数','mingli',?,?,datetime('now','localtime'))
           ON CONFLICT(module) DO UPDATE SET entry_count=excluded.entry_count, note=excluded.note, updated_at=excluded.updated_at""",
        (len(entries), note))
    ing.commit()
    safe_close(conn)
    subprocess.run([sys.executable, str(ROOT / 'scripts/kb-sync-guard.py'), '--sync', '1'],
                   cwd=ROOT, check=True)
    conn = sqlite3.connect(str(DB), timeout=120)
    try:
        n = conn.execute("SELECT COUNT(*) FROM kb_formal WHERE module='zhuge'").fetchone()[0]
        f = conn.execute("SELECT COUNT(*) FROM kb_fts5 WHERE module='zhuge'").fetchone()[0]
        assert n == f == len(entries), (n, f, len(entries))
        print(f'═══ zhuge 模块 kb_formal={n} 条，kb_fts5={f} 条')
    finally:
        safe_close(conn)


if __name__ == '__main__':
    main()
