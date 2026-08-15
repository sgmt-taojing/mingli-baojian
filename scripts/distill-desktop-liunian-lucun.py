#!/usr/bin/env python3
"""R684 · 桌面流年班第10课「禄存+42颗杂耀」蒸馏入库(v3 · 主题合并)
- 把相邻主题 slide 合并,凑足 ≥300 字
- 同主题多星一条(减少条目碎片化)
"""
import sqlite3, re, hashlib
from datetime import datetime

DB = '/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/server/database/yidao.db'  # R112: 唯一权威库（knowledge/ 已归档）
SRC = '/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/.openclaw/tmp/desktop-extract/流年班第十课_——禄存，42颗杂耀.txt'

NOW = datetime.now().isoformat()
SOURCE_TAG = 'desktop:liunianban_l10_lucun_42'
LECTURER = '路总亲授'
TRUST = 0.85
MODULE = 'ziwei'

with open(SRC, 'r', encoding='utf-8') as f:
    raw = f.read()

slide_pattern = re.compile(r'=== Slide (\d+) ===\n(.*?)(?=\n=== Slide |\Z)', re.DOTALL)
slides = {}
for m in slide_pattern.finditer(raw):
    slides[int(m.group(1))] = m.group(2).strip()

# 主题合并策略:每条覆盖 1-2 个主题多 slide
sections = [
    # 主篇·禄存详解(5+6+7+8 共4页)合并+杂耀动星+喜气(10+11)→一条:禄存+动喜总论
    {'title': '禄存详解与动星喜气:禄存本质、格局、动星天马、红鸾天喜',
     'tag': '禄存动星喜气',
     'aggregate': [5, 6, 7, 8, 10, 11]},
    # 杂耀第二组·阴阳双星(12)→一条
    {'title': '阴阳双星:天刑天姚法则',
     'tag': '天刑天姚',
     'aggregate': [12]},
    # 杂耀第三组·贵星+阴煞劫煞天煞(14+15+16)→一条
    {'title': '贵星辅星与三凶星:恩光天贵、阴煞、劫煞、天煞',
     'tag': '贵星凶星',
     'aggregate': [14, 15, 16]},
    # 杂耀第四组·耗星+空亡(22+24)→一条
    {'title': '破耗与空亡:大耗小耗、截空旬空',
     'tag': '破耗空亡',
     'aggregate': [22, 24]},
    # 杂耀第五组·解神+台辅封浩(26+27)→一条
    {'title': '化解与辅佐:解神、台辅、封浩',
     'tag': '解神台辅封浩',
     'aggregate': [26, 27]},
    # 杂耀第六组·三台八座+天空(29+30)→一条
    {'title': '礼仪与空亡:三台八座、天空',
     'tag': '三台八座天空',
     'aggregate': [29, 30]},
    # 杂耀第七组·龙池凤阁+天官天福(31+33)→一条
    {'title': '艺术与官禄:龙池凤阁、天官天福',
     'tag': '龙池凤阁天官天福',
     'aggregate': [31, 33]},
    # 杂耀第八组·桃花+月德天德(34+35)→一条
    {'title': '桃花与解厄:咸池、月德天德',
     'tag': '咸池月德天德',
     'aggregate': [34, 35]},
    # 杂耀第九组·玄术+虚耗(36+37)→一条
    {'title': '玄术与虚耗:天巫天铖、天哭天虚',
     'tag': '天巫天铖天哭天虚',
     'aggregate': [36, 37]},
    # 杂耀第十组·寿元+病厄+小星+孤寡(38+39+40+41)→一条
    {'title': '寿元、病厄、小星、孤寡:天寿天才、天月天煞、小天机/天梁/天同、孤辰寡宿',
     'tag': '寿元病厄小星孤寡',
     'aggregate': [38, 39, 40, 41]},
]

conn = sqlite3.connect(DB)
cur = conn.cursor()

inserted = 0
skipped = 0
fail = 0

for idx, sec in enumerate(sections, start=1):
    text_parts = []
    for sd in sec['aggregate']:
        if sd in slides:
            content = slides[sd]
            if not any(p in content for p in ['休息十分钟', '格局案例']) or len(content) > 30:
                text_parts.append(f'[Slide {sd}] {content}')
    body = '\n\n'.join(text_parts).strip()
    body = re.sub(r'\n{3,}', '\n\n', body)

    if len(body) < 300:
        print(f'⏭️  [{idx:02d}] {sec["title"]} 内容{len(body)}字,跳过')
        skipped += 1
        continue

    final_content = f'【来源:桌面流年班第十课「禄存+42颗杂耀」 / 路总亲授】\n{body}'
    summary = sec['title']
    tags = ','.join([SOURCE_TAG, f'lecturer:{LECTURER}', '紫微斗数', '流年班', '杂耀', sec['tag']])
    eid = f'R684-ziwei-DSK-{idx:03d}'
    fp = hashlib.md5((eid + final_content).encode('utf-8')).hexdigest()
    source_ids = f'桌面蒸馏:{SOURCE_TAG};slide:{"+".join(str(s) for s in sec["aggregate"])}'

    try:
        cur.execute("""
            INSERT OR REPLACE INTO formal_knowledge
            (entry_id, module, content, summary, tags, source_ids, category,
             confidence, status, version, created_at, updated_at, fingerprint)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'formal', 1, ?, ?, ?)
        """, (eid, MODULE, final_content, summary, tags, source_ids,
              'liunian_lectures', TRUST, NOW, NOW, fp))

        cur.execute("""
            INSERT OR REPLACE INTO staging_knowledge
            (entry_id, module, content, summary, tags, source_ids, category,
             confidence, status, version, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'promoted', 1, ?, ?)
        """, (eid, MODULE, final_content, summary, tags, source_ids,
              'liunian_lectures', TRUST, NOW, NOW))

        cur.execute("DELETE FROM kb_fts5 WHERE entry_id=?", (eid,))
        cur.execute("""
            INSERT INTO kb_fts5 (entry_id, module, title, content, keywords, category)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (eid, MODULE, summary, final_content, tags.replace(',', ' '), 'liunian_lectures'))

        inserted += 1
        print(f'✅ [{idx:02d}] {eid} | {sec["title"]} | {len(body)}字')
    except Exception as e:
        print(f'❌ [{idx:02d}] {eid} | {e}')
        fail += 1
        conn.rollback()

conn.commit()

# 写 distill_log
try:
    batch_id = f'batch-liunian-lucun-{datetime.now().strftime("%Y%m%d-%H%M%S")}'
    cur.execute("""
        INSERT INTO kb_distill_log
        (batch_id, source_type, source_count, extract_count, validate_count, applied_count,
         started_at, completed_at, status, notes)
        VALUES (?, 'scheduled', ?, ?, ?, ?, ?, ?, 'completed', ?)
    """, (batch_id, len(sections), inserted, inserted, inserted,
          NOW, NOW, f'桌面流年班第十课禄存+42杂耀蒸馏 · {SOURCE_TAG} · 路总亲授 · trust={TRUST}'))
    conn.commit()
    print(f'\n📝 distill_log: {batch_id}')
except Exception as e:
    print(f'⚠️ distill_log 写入失败: {e}')

conn.close()

print(f'\n📊 汇总: 入库 {inserted} | 跳过 {skipped} | 失败 {fail}')
print(f'📂 来源: 桌面流年班第十课「禄存+42颗杂耀」 / 路总亲授')
print(f'🎯 模块: ziwei | 信任分: {TRUST} | entry_id: R684-ziwei-DSK-001 ~ {inserted:03d}')