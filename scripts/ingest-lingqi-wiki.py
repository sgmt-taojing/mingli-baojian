#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ingest-lingqi-wiki.py — 《灵棋经》维基文库本 8 阙课入库（2026-10-20 · 第四十八轮 · 缘主裁决 A 通过）
源：corpus/lingqi-jing/wikisource-lingqi-jing.txt（公有领域·维基文库，草案 docs/LINGQI-QUEBU-DRAFT-20261020.md 已裁决）
定位：module='lingqi' 第三版本；category='版本异文·维基文库本'，trust=0.85，fingerprint='LQW|' 幂等；
      同步补齐 app/data/lingqi-125.json 的 wiki 版本块，全书 125 课圆满。
"""
import hashlib, json, re, sqlite3, subprocess, sys
from pathlib import Path
from lib.kb_ingest import KBIngestor
from yidao_safe import safe_close

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT / 'server' / 'database' / 'yidao.db'
SRC = 'wikisource:靈棋經'
FP_PREFIX = 'LQW|'

# 125 课形序铁律（第四十七轮验证：117 课落位零冲突）
SHAPES = ['%d-%d-%d' % (a, b, c) for a in range(1, 5) for b in range(1, 5) for c in range(1, 5)]
SHAPES += ['%d-%d-0' % (a, b) for a in range(1, 5) for b in range(1, 5)]
SHAPES += ['0-%d-%d' % (b, c) for b in range(1, 5) for c in range(1, 5)]
SHAPES += ['%d-0-%d' % (a, c) for a in range(1, 5) for c in range(1, 5)]
SHAPES += ['%d-0-0' % a for a in range(1, 5)]
SHAPES += ['0-%d-0' % b for b in range(1, 5)]
SHAPES += ['0-0-%d' % c for c in range(1, 5)]
SHAPES += ['0-0-0']

GAPS = {'1-0-1': 97, '2-0-1': 101, '3-0-4': 108, '4-0-0': 116,
        '0-3-0': 119, '0-4-0': 120, '0-0-1': 121, '0-0-0': 125}
CN_NUM = {97: '九十七', 101: '一百零一', 108: '一百零八', 116: '一百一十六',
          119: '一百一十九', 120: '一百二十', 121: '一百二十一', 125: '一百二十五'}
SIMP = {'微損卦': '微损', '空亡卦': '空亡', '遠襲卦': '远袭', '死象卦': '死象',
        '人事勢': '人事', '保身卦': '保身', '化育卦': '化育', '陰饅卦': '阴馒'}
CN_D = '零一二三四'
def shape_cn(s):
    a, b, c = (int(x) for x in s.split('-'))
    t = ''
    if a: t += CN_D[a] + '上'
    if b: t += CN_D[b] + '中'
    if c: t += CN_D[c] + '下'
    return t or '无字'


def parse_blocks():
    text = (ROOT / 'corpus' / 'lingqi-jing' / 'wikisource-lingqi-jing.txt').read_text(encoding='utf-8')
    start_re = re.compile(r'^(\S{2,5}?[卦勢教势])\s*[、，,]?\s*(\S{2,4}之象)\s*$')
    blocks, cur = [], None
    for ln in text.split('\n'):
        m = start_re.match(ln.strip())
        if m:
            if cur: blocks.append(cur)
            cur = {'name': m.group(1), 'xiang': m.group(2), 'body': []}
        elif cur is not None:
            cur['body'].append(ln)
    if cur: blocks.append(cur)
    assert len(blocks) == 125, len(blocks)
    return blocks


def main():
    blocks = parse_blocks()
    data_path = ROOT / 'app' / 'data' / 'lingqi-125.json'
    data = json.loads(data_path.read_text(encoding='utf-8'))

    wiki_entries = []   # (title, full, kw)
    json_add = {}
    for shape, pos in sorted(GAPS.items(), key=lambda x: x[1]):
        b = blocks[pos - 1]
        assert SHAPES[pos - 1] == shape, (shape, pos)
        body = '\n'.join(b['body']).strip('\n')
        # 宫位行（「二陽相隔 乾天西北」式），125 课无
        gong = ''
        body_lines = [l for l in body.split('\n')]
        if body_lines and re.match(r'^\S{2,6}\s+[乾坤巽震坎離艮兑兌]\S{2,4}$', body_lines[0].strip()):
            gong = body_lines.pop(0).strip().replace(' ', '/')
            body = '\n'.join(body_lines).strip('\n')
        m_x = re.search(r'象曰[:：]\s*([\s\S]*?)\s*詩曰[:：]\s*([\s\S]*)$', body)
        assert m_x, (shape, body[:80])
        xiangyue = re.sub(r'\s+', '', m_x.group(1))
        shiyue = re.sub(r'[ \u3000]+', '', m_x.group(2)).replace('\n', '')
        sc = shape_cn(shape)
        title = '原典·灵棋经·第%d课 %s（维基文库本）' % (pos, b['name'])
        kw = '灵棋经,%s,%s,%s,维基文库本,版本异文,占卜,课占' % (b['name'].rstrip('卦勢教势'), SIMP.get(b['name'], ''), sc)
        full = ('【灵棋经·灵棋经·第%d课 %s（维基文库本）】（公有领域原典·旧题汉东方朔·维基文库·与四库净本/术数全书本互校）\n\n'
                '第%s%s%s%s%s\n\n%s\n\n关键词：灵棋经 占卜 第%d课 %s（维基文库本）'
                % (pos, b['name'], CN_NUM[pos], b['name'],
                   '(' + gong.replace('/', '/') + ')' if gong else '', sc, b['xiang'],
                   body, pos, b['name']))
        wiki_entries.append((shape, pos, title, full, kw))
        json_add[shape] = {'wiki': {
            'n': pos, 'num': CN_NUM[pos], 'name': b['name'], 'xiang': b['xiang'],
            'gong': gong, 'shape': sc, 'xiangyue': xiangyue, 'cike': '', 'shiyue': shiyue,
            'full': '第%s%s（%s）%s %s\n\n%s' % (CN_NUM[pos], b['name'], gong, sc, b['xiang'], body)}}

    # ── DB 入库（幂等）──
    conn = sqlite3.connect(str(DB), timeout=120)
    conn.execute('PRAGMA busy_timeout=120000')
    fps = {r[0] for r in conn.execute("SELECT fingerprint FROM kb_formal WHERE fingerprint LIKE 'LQW|%'"
                                      )}
    ing = KBIngestor(conn)
    try:
        conn.execute('BEGIN IMMEDIATE')
        for shape, pos, title, full, kw in wiki_entries:
            fp = FP_PREFIX + hashlib.md5(('lingqi' + full).encode()).hexdigest()[:12]
            ing.upsert(entry_id='KB-LQW-' + fp[4:], module='lingqi',
                       title=title, content=full, keywords=kw, tags=kw,
                       src_id=SRC, category='版本异文·维基文库本', trust=0.85, source='corpus-rebuild')
        total = conn.execute("SELECT COUNT(*) FROM kb_formal WHERE module='lingqi'").fetchone()[0]
        ocr = conn.execute("SELECT COUNT(*) FROM kb_formal WHERE module='lingqi' AND entry_id LIKE 'KB-LQJ-%'").fetchone()[0]
        siku = conn.execute("SELECT COUNT(*) FROM kb_formal WHERE module='lingqi' AND entry_id LIKE 'KB-LQK-%'").fetchone()[0]
        wiki = conn.execute("SELECT COUNT(*) FROM kb_formal WHERE module='lingqi' AND entry_id LIKE 'KB-LQW-%'").fetchone()[0]
        note = ('汉东方朔。三版本互校：术数全书OCR版 %d 条（trust 0.9）；四库Kanripo净本 %d 条（trust 0.95）；'
                '维基文库本 %d 条（8 阙课校补，trust 0.85，2026-10-20 缘主裁决 A 通过）。'
                '全书 125 课圆满：课形序铁律锚定（docs/LINGQI-QUEBU-DRAFT-20261020.md）') % (ocr, siku, wiki)
        conn.execute(
            """UPDATE kb_module_registry SET entry_count=?, note=?, updated_at=datetime('now','localtime')
               WHERE module='lingqi'""", (total, note))
        ing.commit()
    except Exception:
        conn.rollback()
        safe_close(conn)
        raise
    safe_close(conn)
    print(ing.stats(), flush=True)
    subprocess.run([sys.executable, str(ROOT / 'scripts/kb-sync-guard.py'), '--sync', '1'],
                   cwd=ROOT, check=True)
    print('═══ lingqi 总量 %d（OCR %d + 净本 %d + 维基 %d）' % (total, ocr, siku, wiki), flush=True)

    # ── lingqi-125.json 补齐 ──
    added = 0
    for shape, blk in json_add.items():
        if shape not in data:
            data[shape] = blk
            added += 1
        elif 'wiki' not in data[shape]:
            data[shape]['wiki'] = blk['wiki']
            added += 1
    if added:
        data_path.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding='utf-8')
    print('JSON 补 wiki 版本 %d 课，现总量 %d/125' % (added, len(data)), flush=True)


if __name__ == '__main__':
    main()
