#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""批4 · 三命神煞入库（BUILD-SPEC T1 批4 · 2026-09-21 Kimi · WO-003 切片）

源：《三命通会》万明英（明，公有领域）
本地净本：cold-storage/.../classics/三命通会 - 万明英.txt（606KB 全本）

解析粒度：卷二/卷三神煞专论 28 节（节头 = 行首「○论…」）：
  卷二：将星华盖 / 咸池 / 六害 / 三刑 / 冲击
  卷三：十干禄 / 金舆 / 驿马 / 总论禄马 / 天乙贵人 / 三奇 / 天月德 / 太极贵 /
        学堂词馆 / 正印 / 德秀 / 劫煞亡神 / 羊刃 / 空亡 / 元辰 / 暗金的煞 /
        灾煞 / 六厄 / 勾绞 / 孤辰寡宿 / 天罗地网 / 十恶大败 / 总论诸神煞
字段：module=bazi, category=sanming-shensha, trust=0.95（原典）, status=formal,
      src_id=sanming-tonghui, fingerprint 幂等, domain=mingli, tags 写入（批3 教训：
      漏写 tags 产生 148 行 NULL，本批起入库脚本必带 tags）。
红线：原典原文不改写（白话化归报告引擎）；禁二手拼接（单一净本来源）。
"""
import sqlite3, json, hashlib, re, time
from pathlib import Path

SRC = Path('/Volumes/模型训练数据/cold-storage/ml-training/archive/mingli-db-backups-20260819/workspace-tmp/giant-shoulders/fatecat/domains/fate-analysis/data-products/classics/三命通会 - 万明英.txt')
DB = Path(__file__).resolve().parent.parent / 'server' / 'database' / 'yidao.db'
NOW = time.strftime('%Y-%m-%d %H:%M:%S')

# 目标 28 节（节头去「○论」前缀后的规范名）
TARGETS = [
    '将星华盖', '咸池', '六害', '三刑', '冲击',
    '十干禄', '金舆', '驿马', '总论禄马', '天乙贵人', '三奇', '天月德',
    '太极贵', '学堂词馆', '正印', '德秀', '劫煞亡神', '羊刃', '空亡',
    '元辰', '暗金的煞', '灾煞', '六厄', '勾绞', '孤辰寡宿', '天罗地网',
    '十恶大败', '总论诸神煞',
]
# 检索关键词映射（白话别名，利于命中）
ALIAS = {
    '咸池': ['桃花', '咸池'], '将星华盖': ['将星', '华盖'], '天乙贵人': ['天乙贵人', '贵人'],
    '驿马': ['驿马'], '羊刃': ['羊刃', '阳刃'], '空亡': ['空亡', '旬空'],
    '孤辰寡宿': ['孤辰', '寡宿'], '天罗地网': ['天罗', '地网'], '十恶大败': ['十恶大败'],
    '劫煞亡神': ['劫煞', '亡神'], '天月德': ['天德', '月德'], '三奇': ['三奇贵人'],
    '学堂词馆': ['学堂', '词馆'], '金舆': ['金舆'], '元辰': ['元辰'],
    '六害': ['六害', '相害'], '三刑': ['三刑', '相刑'], '冲击': ['相冲', '六冲'],
}

def fp(s): return 'SM|' + hashlib.sha1(s.encode('utf-8')).hexdigest()[:16]

text = SRC.read_text(encoding='utf-8')
lines = [l.strip() for l in text.split('\n')]

hdr_re = re.compile(r'^○(?:论)?(.+?)\s*$')
sections = []  # (title, [body_lines])
cur_title, cur_body, capture = None, [], False
def flush():
    global cur_title, cur_body, capture
    if capture and cur_title and cur_body:
        sections.append((cur_title, cur_body[:]))
    cur_title, cur_body, capture = None, [], False

for l in lines:
    if not l:
        continue
    if l.startswith('卷'):  # 卷界强切
        flush()
        continue
    m = hdr_re.match(l)
    if m and l.startswith('○'):
        flush()
        name = m.group(1)
        if name in TARGETS:
            cur_title, capture = name, True
        continue
    if capture:
        cur_body.append(l)
flush()

# 归并同名节（同题多处合一）
merged = {}
for t, body in sections:
    merged.setdefault(t, []).extend(body)

entries = []
for t in TARGETS:  # 按 TARGETS 顺序产出，缺失即报
    body = merged.get(t)
    if not body:
        print(f'[WARN] 未解析到节：{t}')
        continue
    content = '\n'.join(body).strip()
    if len(content) < 30:
        print(f'[WARN] 节内容过短：{t}（{len(content)}字）')
        continue
    entries.append((t, content))

print(f'解析出 {len(entries)} / 目标 {len(TARGETS)} 节')
assert len(entries) >= 25, f'节数异常偏少（{len(entries)}），解析规则需复核'

conn = sqlite3.connect(DB, timeout=60)
conn.execute('PRAGMA busy_timeout=60000')
ins = skip = 0
for title, content in entries:
    eid = 'KB-SM-' + hashlib.md5(title.encode()).hexdigest()[:10]
    if conn.execute('SELECT 1 FROM kb_formal WHERE entry_id=?', (eid,)).fetchone():
        skip += 1
        continue
    full = f'【三命通会·论{title}】（公有领域原典）\n\n' + content
    kw = ['三命通会', '神煞'] + ALIAS.get(title, [title])
    conn.execute("""INSERT INTO kb_formal
        (entry_id, module, title, content, src_id, category, keywords, summary,
         trust_score, version, promoted_at, promoted_from, status, fingerprint, domain, tags)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (eid, 'bazi', f'三命通会·论{title}', full, 'sanming-tonghui', 'sanming-shensha',
         json.dumps(kw, ensure_ascii=False),
         content[:80], 0.95, '1.0', NOW, 'kimi-t1-batch4-sanming-shensha', 'formal', fp(full), 'mingli',
         json.dumps(['原典', '神煞', '三命通会'], ensure_ascii=False)))
    ins += 1
conn.commit()
print(f'入库 {ins} / 跳过 {skip}')
sizes = sorted(((len(c), t) for t, c in entries), reverse=True)
print('最长三节:', ', '.join(f'{t}({n}字)' for n, t in sizes[:3]))
print('最短三节:', ', '.join(f'{t}({n}字)' for n, t in sizes[-3:]))
conn.close()
