#!/usr/bin/env python3
"""R-cron · 桌面流年班第12课「十喻歌/强宫弱宫/星耀喜忌」+ 第14课「宫星拓展/墓桃花四马」蒸馏入库
- 主题 slide 合并，每条 ≥300 字
- 写入 kb_formal（kb_fts5 由触发器自动同步）
- 路总亲授 · trust=0.85 · module=ziwei
"""
import sqlite3, re, hashlib
from datetime import datetime

DB = '/Users/tom/kimi/projects/mingli-baojian/server/database/yidao.db'
NOW = datetime.now().isoformat()
LECTURER = '路总亲授'
TRUST = 0.85
MODULE = 'ziwei'

def load_slides(path):
    with open(path, 'r', encoding='utf-8') as f:
        raw = f.read()
    slide_pattern = re.compile(r'=== Slide (\d+) ===\n(.*?)(?=\n=== Slide |\Z)', re.DOTALL)
    slides = {}
    for m in slide_pattern.finditer(raw):
        slides[int(m.group(1))] = m.group(2).strip()
    return slides

def build_body(slides, agg, exclude=None):
    exclude = exclude or []
    parts = []
    for sd in agg:
        if sd in slides:
            c = slides[sd]
            if len(c) > 25 and not any(p in c for p in exclude):
                parts.append(f'[Slide {sd}] {c}')
    body = '\n\n'.join(parts).strip()
    body = re.sub(r'\n{3,}', '\n\n', body)
    return body

# ---------- 第十二课 ----------
slides12 = load_slides('/Users/tom/kimi/projects/mingli-baojian/.openclaw/tmp/desktop-extract/流年班第十二课_十喻歌强宫弱宫星耀喜忌.txt')

sections12 = [
    {'title': '十喻歌总诀：本对合邻十种吉凶轻重',
     'tag': '十喻歌',
     'agg': [5, 6]},
    {'title': '十喻歌术语：本宫对宫三合邻宫（坐守踞/照冲/会拱/辅夹）',
     'tag': '本对合邻',
     'agg': [7]},
    {'title': '四面楚歌与千祥云集：六煞忌星汇集 vs 六吉禄权科（含强格无煞弊端与鲶鱼效应）',
     'tag': '四面楚歌千祥云集',
     'agg': [8, 10]},
    {'title': '强宫强格与弱宫弱格判定标准（含煞星数量界限/四煞守命/羊驼夹忌）',
     'tag': '强宫弱宫',
     'agg': [16, 17, 18, 22, 23]},
    {'title': '强格格局：三奇加会与紫府朝垣（紫府朝垣贪禄万钟成格条件）',
     'tag': '三奇加会紫府朝垣',
     'agg': [19, 20, 21]},
    {'title': '十四主星星曜喜忌总表（紫微天府天机天梁天同太阴巨门太阳武曲七杀破军廉贞天相贪狼）',
     'tag': '星曜喜忌',
     'agg': [27]},
]

# ---------- 第十四课 ----------
slides14 = load_slides('/Users/tom/kimi/projects/mingli-baojian/.openclaw/tmp/desktop-extract/流年班第十四课_宫星拓展墓桃花四马.txt')

sections14 = [
    {'title': '星曜定位人物：紫微看老板/天梁看长辈/天同看晚辈/天机看朋友（含四煞性质口诀）',
     'tag': '星曜定位人物',
     'agg': [4, 5, 6]},
    {'title': '双主星定位：紫破紫贪紫相武杀组合看人物关系（含擎羊叠加与第三者象）',
     'tag': '双主星',
     'agg': [7, 8]},
    {'title': '星曜能力表与星曜暗合（巨门口才至天梁长辈 + 五组永远暗合）',
     'tag': '星曜能力暗合',
     'agg': [10, 11]},
    {'title': '星曜互涉：五行生克的有情克与无情克（含天府克破军案例与女命三例）',
     'tag': '星曜互涉生克',
     'agg': [13, 14, 15, 16, 17]},
    {'title': '星曜互涉·制化组合与过宫论（廉杀廉相陀铃羊火 + 廉贞天同/武曲太阳/天相天梁大限流年案例）',
     'tag': '制化过宫论',
     'agg': [18, 20, 21, 22]},
    {'title': '四墓库：辰戌丑未五行库/天罗地网/性格住宅特征（含命财官三宫组合）',
     'tag': '四墓库天罗地网',
     'agg': [24, 29, 30, 31, 32, 33]},
    {'title': '四桃花地与四马地：子午卯酉/寅申巳亥 性格住宅特征（含命财官三宫组合）',
     'tag': '四桃花四马地',
     'agg': [25, 26, 27, 28, 30, 31, 32, 33]},
]

conn = sqlite3.connect(DB, timeout=30)
cur = conn.cursor()
inserted = 0
skipped = 0
fail = 0

def insert_entry(prefix, title, body, tag, src_id, extra_tags):
    global inserted, skipped, fail
    if len(body) < 300:
        print(f'⏭️  {title} 内容{len(body)}字,跳过')
        skipped += 1
        return
    final_content = f'【来源:桌面流年班课件 / {LECTURER}】\n{body}'
    tags = ','.join([x for x in ['路总', '流年班', '紫微斗数', tag] + extra_tags if x])
    eid = f'{prefix}-{hashlib.md5((title + src_id).encode("utf-8")).hexdigest()[:10]}'
    try:
        cur.execute("""
            INSERT OR REPLACE INTO kb_formal
            (entry_id, module, title, content, src_id, category, keywords, summary,
             trust_score, version, promoted_at, promoted_from, hit_count, last_hit,
             tags, source_ids, confidence, access_level, difficulty)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, 0, NULL, ?, ?, ?, 'public', 'intermediate')
        """, (eid, MODULE, title, final_content, src_id, '紫微斗数·流年班', tags, title,
              TRUST, NOW, 'desktop-distill', tags, f'desktop:{prefix};{src_id}', TRUST))
        inserted += 1
        print(f'✅ {eid} | {title} | {len(body)}字')
    except Exception as e:
        print(f'❌ {eid} | {e}')
        fail += 1
        conn.rollback()

for sec in sections12:
    body = build_body(slides12, sec['agg'], exclude=['休息十分钟'])
    insert_entry('LUTZ-L12', sec['title'], body, sec['tag'],
                 'luzong-desktop/流年班第十二课·十喻歌强宫弱宫星耀喜忌.pptx',
                 ['十喻歌', '强宫弱宫', '星曜喜忌'])

for sec in sections14:
    body = build_body(slides14, sec['agg'], exclude=['休息十分钟'])
    insert_entry('LUTZ-L14', sec['title'], body, sec['tag'],
                 'luzong-desktop/流年班第十四课·宫星拓展墓桃花四马.pptx',
                 ['宫星拓展', '墓桃花四马', '星曜互涉'])

conn.commit()

# distill_log
try:
    batch_id = f'batch-desktop-l12-l14-{datetime.now().strftime("%Y%m%d-%H%M%S")}'
    cur.execute("""
        INSERT INTO kb_distill_log
        (batch_id, source_type, source_count, extract_count, validate_count, applied_count,
         started_at, completed_at, status, notes)
        VALUES (?, 'scheduled', ?, ?, ?, ?, ?, ?, 'completed', ?)
    """, (batch_id, len(sections12) + len(sections14), inserted, inserted, inserted,
          NOW, NOW, f'桌面流年班第12/14课蒸馏 · 路总亲授 · trust={TRUST}'))
    conn.commit()
except Exception as e:
    print(f'⚠️ log: {e}')

conn.close()
print(f'\n完成: 插入{inserted} 跳过{skipped} 失败{fail}')
