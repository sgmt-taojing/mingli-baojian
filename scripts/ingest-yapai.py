#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ingest-yapai.py — 《牙牌神数》125课入 kb_formal（2026-10-20 · 第六十轮）
源：corpus/yapai-shenshu/yapai-125.json（终稿JSON）
    底本：華軒居士轉錄本（fateguide.com，2013初校/2018再校）
    校勘：台圖掃描本 NTL-9900014378（文明書局1925年11月版，Wikimedia Commons）
          抽校25頁，訂正殘字6處、錯簡1處（64/65解曰互換）、單字異文22處
结构：125課（5³檔次組合），每課：總評+簽詩四句+解曰+斷曰（含象注）；卷首（題詞/歌訣/開數/占法/解式）單獨成條。
产出：
  1. kb_formal module='yapai'，trust=0.9（轉錄本+掃描本校勘），fingerprint='YPJ|' 幂等
  2. kb_fts5 批量同步
  3. kb_module_registry 注册 yapai → 卜筮 group
"""
import hashlib, json, sqlite3, subprocess, sys
from pathlib import Path
from lib.kb_ingest import KBIngestor
from yidao_safe import safe_close

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT / 'server' / 'database' / 'yidao.db'
SRC_JSON = ROOT / 'corpus' / 'yapai-shenshu' / 'yapai-125.json'
SRC = 'yapai-shenshu:文明書局1925掃描本校勘本(NTL-9900014378+fateguide轉錄)'
FP_PREFIX = 'YPJ|'


def main():
    data = json.loads(SRC_JSON.read_text(encoding='utf-8'))
    meta, front, lessons = data['meta'], data['frontmatter'], data['lessons']
    assert len(lessons) == 125, f'lessons={len(lessons)}'

    entries = []
    fm_text = '\n'.join(f'【{k}】{v}' for k, v in front.items())
    entries.append((
        '牙牌神數·卷首（題詞·歌訣·開數·占法·解式）',
        fm_text,
        '牙牌神數,開數,占法,歌訣,天九牌,課占,占卜,岳慶山樵'))

    for L in lessons:
        title = f"牙牌神數·第{L['n']}課 {L['combo']} {L['motto'] or '（無總評）'}"
        body = (f"【牙牌神數·第{L['n']}課】{L['combo']}（{L['g1']}·{L['g2']}·{L['g3']}）\n"
                f"總評：{L['motto'] or '（本課無總評）'}\n\n"
                f"簽詩：\n{L['verse']}\n\n"
                f"【解曰】{L['jie']}\n\n"
                f"【斷曰】{L['duan']}")
        kw = f"牙牌神數,{L['g1']}{L['g2']}{L['g3']},{L['combo']},占卜,課占,簽詩,牙牌"
        entries.append((title, body, kw))

    conn = sqlite3.connect(str(DB), timeout=120)
    conn.execute('PRAGMA busy_timeout=120000')
    ing = KBIngestor(conn)
    try:
        conn.execute('BEGIN IMMEDIATE')
        for title, content, kw in entries:
            full = (f'【{title}】（公有领域原典·清岳慶山樵著·文明書局1925年版·'
                    f'台圖掃描本NTL-9900014378與華軒居士轉錄本互校·校勘28處）\n\n{content}\n\n'
                    f'关键词：牙牌神数 占卜 课占 {title}')
            fp = FP_PREFIX + hashlib.md5(('yapai' + full).encode()).hexdigest()[:12]
            ing.upsert(entry_id='KB-YPJ-' + fp[4:], module='yapai',
                       title='原典·' + title, content=full, keywords=kw, tags=kw,
                       src_id=SRC, category='占卜', trust=0.9, source='corpus-rebuild')
        note = ('清岳慶山樵·文明書局1925年版；125課全（5³檔次組合）+卷首開數占法；'
                '華軒居士轉錄本為底，台圖掃描本NTL-9900014378抽校25頁訂正28處')
        conn.execute(
            """INSERT INTO kb_module_registry (module, std_group, display_name, domain, entry_count, note, updated_at)
               VALUES ('yapai','卜筮','牙牌神数','mingli',?,?,datetime('now','localtime'))
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
        n = conn.execute("SELECT COUNT(*) FROM kb_formal WHERE module='yapai'").fetchone()[0]
        f = conn.execute("SELECT COUNT(*) FROM kb_fts5 WHERE module='yapai'").fetchone()[0]
        assert n == f == len(entries), (n, f, len(entries))
        print(f'═══ yapai 模块 kb_formal={n} 条，kb_fts5={f} 条')
    finally:
        safe_close(conn)


if __name__ == '__main__':
    main()
