#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""fetch-canbu-kanripo-20261014.py — A1 残部补全·Kanripo 全量四部
周易註疏 KR1a0007(42卷文) / 太乙金鏡式經 KR3g0047(10卷) / 大衍索隱 KR3g0014(3卷) / 遁甲演義 KR3g0048(4卷)
口径：公有领域原典·文渊阁四库全书本(WYG)；trust=0.95；指纹幂等；原文不删改（仅去 mandoku 标记）。
"""
import os, re, sqlite3, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib.kb_ingest import KBIngestor, fingerprint_of  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB = os.path.join(ROOT, 'server', 'database', 'yidao.db')

BOOKS = [
    # (目录, 仓号, 书名, module, 关键词)
    ('zhouyi-zhushu', 'KR1a0007', '周易註疏', 'yijing', '周易正义,孔颖达,王弼,韩康伯,卦爻辞,疏'),
    ('taiyi-jinjing', 'KR3g0047', '太乙金鏡式經', 'taiyi', '太乙,金镜,式经,术数,局数'),
    ('dayan-suoyin', 'KR3g0014', '大衍索隱', 'yijing', '大衍,揲蓍,索隐,丁易东,筮法'),
    ('dunjia-yanyi', 'KR3g0048', '遁甲演義', 'qimen', '奇门遁甲,符使,九宫,演义'),
]

def clean_kanripo(txt):
    txt = re.sub(r'^#.*\n', '', txt, flags=re.M)      # emacs mandoku 头
    txt = re.sub(r'<[^>]+>', '', txt)                  # <pb:...> 页码标记
    txt = txt.replace('¶', '')
    txt = re.sub(r'\n{3,}', '\n\n', txt)
    return txt.strip()

def juan_of(raw, fallback):
    m = re.search(r'^#\+PROPERTY: JUAN (.+)$', raw, flags=re.M)
    return m.group(1).strip() if m else fallback

conn = sqlite3.connect(DB)
ing = KBIngestor(conn)
grand = 0
for dirname, repo, book, module, kw in BOOKS:
    d = os.path.join(ROOT, 'corpus', dirname)
    files = sorted(f for f in os.listdir(d) if re.match(rf'{repo}_\d{{3}}\.txt$', f))
    nb = 0
    for fn in files:
        raw = open(os.path.join(d, fn), encoding='utf-8').read()
        num = fn.split('_')[1].split('.')[0]
        if num == '000':
            continue  # 目录册不入库
        sec = juan_of(raw, '卷' + str(int(num)))
        body = clean_kanripo(raw)
        if len(body) < 100:
            print('SKIP(short)', book, sec, len(body))
            continue
        # 超长分片（周易注疏单卷可达 60K 字）
        chunks = [body[i:i + 4000] for i in range(0, len(body), 4000)] if len(body) > 4500 else [body]
        for k, c in enumerate(chunks, 1):
            sec_name = sec if len(chunks) == 1 else '%s（之%d）' % (sec, k)
            content = '【%s·%s】（公有领域原典·Kanripo 漢籍全文·WYG 四库本）\n\n%s\n\n关键词：%s %s %s' % (
                book, sec_name, c, book, sec, kw.replace(',', ' '))
            eid = 'KR|%s|%s|%s|%s' % (module, book, sec_name, fingerprint_of(content)[:8])
            ok, why = ing.insert(
                entry_id=eid, module=module, title='原典·%s·%s' % (book, sec_name),
                content=content, category=module,
                keywords='%s,%s,%s' % (book, sec, kw),
                tags=[book, sec, '原典', 'kanripo', '残部补全20261014'],
                domain='mingli', trust=0.95, source='kanripo')
            if ok:
                nb += 1
            elif why != 'duplicate':
                raise RuntimeError(why)
    grand += nb
    print('%s %s -> 新入 %d 条（文件 %d）' % (book, repo, nb, len(files) - 1), flush=True)
ing.commit()

# 旧残条（kanripo15/16 部分收割）标记 superseded，不删原文
cur = conn.cursor()
for cat, book in [('kanripo15-taiyi', '太乙金鏡式經'), ('kanripo15-dunjia', '遁甲演義'), ('kanripo16-dayan', '大衍索隱')]:
    n = cur.execute(
        "UPDATE kb_formal SET status='superseded', audit_notes=COALESCE(audit_notes,'')||' [2026-10-14 全量重收 superseded]' "
        "WHERE category=? AND status IS NOT 'superseded'", (cat,)).rowcount
    print('superseded %-18s %d 条' % (cat, n))
conn.commit()
conn.close()
print('DONE total_new=%d inserted=%d dup=%d' % (grand, ing.inserted, ing.duplicates))
