#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ingest-lingqi-siku.py — 《灵棋经》四库净本（Kanripo）版本异文入库（2026-10-20 · 第三十七轮续）
源：kb_formal yizhan 模块既有 Kanripo 汉籍全文条目（KB-KR-4e80d7d3d6 卷上 / KB-KR-7e944c420a 卷下 /
    KB-KR-daff4ea0de 提要 / KB-KR-522ad0a1b4 後序），导出至 corpus/lingqi-jing/kanripo-*.txt。
    仅依据项目内文献，不外采、不杜撰。
结构：锚点「第[N][卦名]卦(宫位/方位)[卦形][XX之象]」；卷上 58 课 + 卷下 31 课 = 89 课
      （Kanripo 卷下文本止于第九十四荡覆卦，95-124 课原文阙如，不补）。
定位：module='lingqi' 与 OCR 版同库互校；category='版本异文·四库净本'，trust=0.95（净本），
      fingerprint='LQK|' 幂等；提要/後序单独成条。
"""
import hashlib, re, sqlite3, subprocess, sys
from pathlib import Path
from lib.kb_ingest import KBIngestor
from yidao_safe import safe_close

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT / 'server' / 'database' / 'yidao.db'
SRC = 'kanripo:欽定四庫全書·靈棋經'
FP_PREFIX = 'LQK|'
NUM = '一二三四五六七八九十百零〇'
ANCHOR = re.compile(
    r'第([' + NUM + r']+)([一-鿿]{2,3}卦)\(([^)]*)\)((?:[一二三四]上)?(?:[一二三四]中)?(?:[一二三四]下)?)([一-鿿]{2,6}之象)')


def slice_juan(path, juan):
    t = Path(path).read_text(encoding='utf-8')
    # 去掉打包时附加的出处头与关键词尾
    t = re.sub(r'^【[^】]*】[^\n]*\n', '', t)
    t = re.sub(r'\n*关键词：[^\n]*$', '', t)
    ms = [m for m in ANCHOR.finditer(t) if re.search(r'[上中下]', m.group(4))]
    out = []
    for i, m in enumerate(ms):
        end = ms[i + 1].start() if i + 1 < len(ms) else len(t)
        seg = t[m.start():end].strip()
        # 卷上末课尾部卷题裁除
        seg = re.sub(r'\n\s*靈棋經卷[上下]\s*$', '', seg).strip()
        out.append((juan, m.group(1), m.group(2), m.group(3), m.group(4), seg))
    return out


def main():
    lessons = slice_juan(ROOT / 'corpus/lingqi-jing/kanripo-juan-shang.txt', '卷上') + \
              slice_juan(ROOT / 'corpus/lingqi-jing/kanripo-juan-xia.txt', '卷下')
    print(f'四库净本课目 {len(lessons)} 条', flush=True)

    # 提要/後序
    th = (ROOT / 'corpus/lingqi-jing/kanripo-tiyao-houxu.txt').read_text(encoding='utf-8')
    extra = []
    m_t = re.search(r'(欽定四庫全書[\s\S]*?提要[\s\S]*?)(?=【灵棋经·後序】|$)', th)
    m_h = re.search(r'(靈棋經後序[\s\S]*?)(?:\n*关键词：|$)', th)
    if m_t:
        extra.append(('灵棋经·四库提要', m_t.group(1).strip(), '灵棋经,四库提要,版本源流'))
    if m_h:
        extra.append(('灵棋经·後序', m_h.group(1).strip(), '灵棋经,後序,灵棋之式,三经四纬'))

    conn = sqlite3.connect(str(DB), timeout=120)
    conn.execute('PRAGMA busy_timeout=120000')
    fps = {r[0] for r in conn.execute(
        "SELECT fingerprint FROM kb_formal WHERE fingerprint LIKE 'LQK|%'" )}

    entries = list(extra)
    for juan, num, name, gong, shape, seg in lessons:
        kw = f'灵棋经,{name[:-1]},{shape},四库净本,版本异文,占卜,课占'
        entries.append((f'灵棋经·{juan}第{num}课 {name}（四库净本）', seg, kw))

    ing = KBIngestor(conn)
    try:
        conn.execute('BEGIN IMMEDIATE')
        for title, content, kw in entries:
            full = f'【灵棋经·{title}】（公有领域原典·汉东方朔·欽定四庫全書文淵閣版·Kanripo 净本·与术数全书 OCR 版互校）\n\n{content}\n\n关键词：灵棋经 占卜 {title}'
            fp = FP_PREFIX + hashlib.md5(('lingqi' + full).encode()).hexdigest()[:12]
            ing.upsert(entry_id='KB-LQK-' + fp[4:], module='lingqi',
                       title=f'原典·{title}', content=full, keywords=kw, tags=kw,
                       src_id=SRC, category='版本异文·四库净本', trust=0.95, source='corpus-rebuild')
        total = conn.execute("SELECT COUNT(*) FROM kb_formal WHERE module='lingqi'").fetchone()[0]
        ocr = conn.execute("SELECT COUNT(*) FROM kb_formal WHERE module='lingqi' AND entry_id LIKE 'KB-LQJ-%'").fetchone()[0]
        siku = conn.execute("SELECT COUNT(*) FROM kb_formal WHERE module='lingqi' AND entry_id LIKE 'KB-LQK-%'").fetchone()[0]
        wiki = conn.execute("SELECT COUNT(*) FROM kb_formal WHERE module='lingqi' AND entry_id LIKE 'KB-LQW-%'").fetchone()[0]
        note = (f'汉东方朔·三版本互校：OCR {ocr} 条、四库净本 {siku} 条、维基文库 {wiki} 条；'
                '四库净本89课+提要/後序，阙如部分不杜撰')
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
    print(f'═══ lingqi 总量 {total}（OCR {ocr} + 四库净本 {siku} + 维基 {wiki}）')


if __name__ == '__main__':
    main()
