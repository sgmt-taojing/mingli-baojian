#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ingest-guanyin.py — 《观音灵签》100签入 kb_formal（2026-10-20 · 第六十一轮）
源：corpus/guanyin-lingqian/guanyin-100-final.json
    1-30/41-100：网易号全文页（签诗+吉凶+简注）
    31-40：观易堂单签页（签诗+诗意+解曰+断事）
    典故名：观易堂索引（100/100）
产出：kb_formal module='guanyin'，trust=0.7（民俗传本·两站互证），fingerprint='GY|' 幂等
      + kb_fts5 同步 + kb_module_registry 注册
"""
import hashlib, json, sqlite3, subprocess, sys
from pathlib import Path
from lib.kb_ingest import KBIngestor
from yidao_safe import safe_close

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT / 'server' / 'database' / 'yidao.db'
SRC_JSON = ROOT / 'corpus' / 'guanyin-lingqian' / 'guanyin-100-final.json'
SRC = 'guanyin-lingqian:网易全文+观易堂互证(民俗传本)'
FP_PREFIX = 'GY|'

RITUAL = ('求签仪轨：先定一事，静心默念事由；摇签筒待一签跃出（或随手拈一签号），'
          '记下签号，依次读签诗、解曰与典故。一事一问，不反复占同一事。')


def main():
    data = json.loads(SRC_JSON.read_text(encoding='utf-8'))
    signs = data['signs']
    assert len(signs) == 100, f'signs={len(signs)}'

    entries = []
    entries.append((
        '觀音靈籤·卷首（求籤儀軌）',
        f'【觀音靈籤·求籤儀軌】{RITUAL}\n\n全書100籤，每籤含吉凶、古人典故、籤詩、解曰。',
        '觀音靈籤,求籤,儀軌,觀音,靈籤,占卜'))

    for s in signs:
        gd = f"·{s['gudian']}" if s['gudian'] else ''
        title = f"觀音靈籤·第{s['n']}籤 {s['jixiong']}{gd}"
        body = (f"【觀音靈籤·第{s['n']}籤】{s['jixiong']}"
                + (f"（古人典故：{s['gudian']}）" if s['gudian'] else '')
                + f"\n\n籤詩：\n{s['verse']}\n\n【解】{s['jianzhu']}")
        kw = f"觀音靈籤,第{s['n']}籤,{s['jixiong']},{s['gudian'] or '靈籤'},求籤,占卜,觀音"
        entries.append((title, body, kw))

    conn = sqlite3.connect(str(DB), timeout=120)
    conn.execute('PRAGMA busy_timeout=120000')
    ing = KBIngestor(conn)
    try:
        conn.execute('BEGIN IMMEDIATE')
        for title, content, kw in entries:
            full = (f'【{title}】（民俗傳本·觀音靈籤100籤·'
                    f'網易全文頁與觀易堂兩站互證）\n\n{content}\n\n'
                    f'关键词：观音灵签 求签 占卜 {title}')
            fp = FP_PREFIX + hashlib.md5(('guanyin' + full).encode()).hexdigest()[:12]
            ing.upsert(entry_id='KB-GY-' + fp[3:], module='guanyin',
                       title='傳本·' + title, content=full, keywords=kw, tags=kw,
                       src_id=SRC, category='占卜', trust=0.7, source='corpus-rebuild')
        note = ('民俗傳本；100籤全（籤詩+吉凶+簡注+古人典故）；1-30/41-100網易全文頁、'
                '31-40觀易堂單籤頁（含詩意/解曰/斷事）、典故名觀易堂索引；兩站互證')
        conn.execute(
            """INSERT INTO kb_module_registry (module, std_group, display_name, domain, entry_count, note, updated_at)
               VALUES ('guanyin','卜筮','观音灵签','mingli',?,?,datetime('now','localtime'))
               ON CONFLICT(module) DO UPDATE SET entry_count=excluded.entry_count, note=excluded.note, updated_at=excluded.updated_at""",
            (len(entries), note))
        ing.commit()
    except Exception:
        conn.rollback()
        safe_close(conn)
        raise
    safe_close(conn)
    print(ing.stats(), flush=True)
    subprocess.run([sys.executable, str(ROOT / 'scripts/kb-sync-guard.py'), '--sync', '1'],
                   cwd=ROOT, check=True)
    conn = sqlite3.connect(str(DB), timeout=120)
    try:
        n = conn.execute("SELECT COUNT(*) FROM kb_formal WHERE module='guanyin'").fetchone()[0]
        f = conn.execute("SELECT COUNT(*) FROM kb_fts5 WHERE module='guanyin'").fetchone()[0]
        assert n == f == len(entries), (n, f, len(entries))
        print(f'═══ guanyin 模块 kb_formal={n} 条，kb_fts5={f} 条')
    finally:
        safe_close(conn)


if __name__ == '__main__':
    main()
