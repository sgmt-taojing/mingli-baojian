#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# P4 · 择日四通书入库：象吉备要通书 / 诹吉便览·宝镜图 / 选吉探原 / 择吉汇要
# 文本源：corpus/<module>/<module>-transcript.md
# 条目标记：<!--ENTRY:tag|title|trust-->
import sqlite3, hashlib, datetime, re, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
DB = str(ROOT / 'server/database/yidao.db')
NOW = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')

JOBS = [
  dict(module='xiangji-beiyao', prefix='XJ', category='择日',
       md='corpus/xiangji-beiyao/xiangji-beiyao-transcript.md',
       src='xiangji-beiyao:書目著錄(借書園/測海樓/文字獄檔)+現代影印本目錄(wsdoc/星易)',
       src_id='SRC-XIANGJI-BEIYAO-20261024',
       src_desc='象吉备要通书：书目版本+二十九卷结构（凡例与全文挂账）', avg=0.8,
       display='象吉备要通书',
       note='清魏鑑字明远纂二十九卷；书目+版本+结构3条；凡例原文与全文挂账，优先补卷五造命/卷六神煞相关卷'),
  dict(module='zouji-baojing', prefix='ZJ', category='择日',
       md='corpus/zouji-baojing/zouji-baojing-transcript.md',
       src='zouji-baojing:識典《增補諏吉寶鏡圖》SDZJ0506全文OCR(預留人工校驗)',
       src_id='SRC-ZOUJI-BAOJING-20261024',
       src_desc='诹吉便览·宝镜图：费滈序+凡例15条+宝镜图法诀全编（图表与逐日局挂账）', avg=0.74,
       display='诹吉便览·宝镜图',
       note='清俞荣宽纂便览二卷附宝镜图；序/凡例/清人评议+八门九星法诀14条；六十甲子逐日局与图表OCR未校挂账'),
  dict(module='xuanji-tanyuan', prefix='XT', category='择日',
       md='corpus/xuanji-tanyuan/xuanji-tanyuan-transcript.md',
       src='xuanji-tanyuan:潤德堂叢書提要+袁樹珊自撰題要(Wikimedia增訂命理探原書末)',
       src_id='SRC-XUANJI-TANYUAN-20261024',
       src_desc='选吉探原：书目版本+体例纲领+袁氏题要（正文挂账）', avg=0.82,
       display='选吉探原',
       note='袁树珊撰，以协纪辨方书删繁就简；干支衰旺为体、辅佐值事人本命为用；正文与诸表挂账'),
  dict(module='zeji-huiyao', prefix='ZH', category='择日',
       md='corpus/zeji-huiyao/zeji-huiyao-transcript.md',
       src='zeji-huiyao:清史稿藝文志+NTU學位論文+Hans論文(蔣庸奇序評/四卷細目)',
       src_id='SRC-ZEJI-HUIYAO-20261024',
       src_desc='择吉汇要（择吉会要）：书目消歧+四卷结构+蒋庸奇序评（正文挂账）', avg=0.82,
       display='择吉汇要（择吉会要）',
       note='清姚承舆撰四卷，道光己酉刊（一说道光二十七年）；禽要/会要、承恩/承舆异文并存；与梅菁门诹吉汇纂非一书'),
]

pat = re.compile(r'<!--ENTRY:([^|]+)\|([^|]+)\|([\d.]+)-->')

def eid(prefix, tag):
    return f'KB-{prefix}-' + hashlib.md5(tag.encode()).hexdigest()[:12]

db = sqlite3.connect(DB, timeout=120)
c = db.cursor()
for job in JOBS:
    raw = (ROOT / job['md']).read_text(encoding='utf-8')
    marks = list(pat.finditer(raw))
    assert marks, f"{job['module']} 未发现 ENTRY 标记"
    entries = []
    for i, m in enumerate(marks):
        body = raw[m.end(): marks[i+1].start() if i+1 < len(marks) else len(raw)].strip()
        assert body, f"{job['module']} 条目 {m.group(1)} 内容为空"
        entries.append(dict(tag=m.group(1).strip(), title=m.group(2).strip(),
                            trust=float(m.group(3)), content=body))
    n = 0
    for e in entries:
        fp = job['prefix'] + '|' + hashlib.md5(e['tag'].encode()).hexdigest()[:12]
        kw = e['content'].split('關鍵詞：')[-1].strip() if '關鍵詞：' in e['content'] else ''
        c.execute("""INSERT INTO kb_formal
          (entry_id, module, title, content, src_id, category, keywords, summary, trust_score,
           hit_count, access_level, status, created_at, fingerprint, authority, domain)
          VALUES (?,?,?,?,?,?,?,?,?,0,'public','formal',?,?,'','mingli')""",
          (eid(job['prefix'], e['tag']), job['module'], e['title'], e['content'],
           job['src'], job['category'], kw, '', e['trust'], NOW, fp))
        c.execute("INSERT INTO kb_fts5 (entry_id, module, summary, content, tags, category) VALUES (?,?,?,?,?,?)",
                  (eid(job['prefix'], e['tag']), job['module'], '', e['content'], kw, job['category']))
        n += 1
    c.execute("""INSERT INTO kb_module_registry (module, std_group, display_name, domain, entry_count, note, updated_at)
      VALUES (?,?,?,?,?,?,?) ON CONFLICT(module) DO UPDATE SET entry_count=excluded.entry_count, note=excluded.note, updated_at=excluded.updated_at""",
      (job['module'], '择日', job['display'], 'mingli', n, job['note'], NOW))
    c.execute("INSERT OR REPLACE INTO kb_src_registry (src_id, description, level, avg_trust, entry_count, created_at) VALUES (?,?,?,?,?,?)",
      (job['src_id'], job['src_desc'], 'classic', job['avg'], n, NOW))
    print(f"{job['module']}: 入库 {n} 条（{'、'.join(e['tag'] for e in entries)}）")
db.commit()
for job in JOBS:
    f = c.execute('SELECT COUNT(*) FROM kb_formal WHERE module=?', (job['module'],)).fetchone()[0]
    t = c.execute('SELECT COUNT(*) FROM kb_fts5 WHERE module=?', (job['module'],)).fetchone()[0]
    print(f"{job['module']}: formal={f} fts5={t} {'OK' if f==t else 'MISMATCH!'}")
db.close()
