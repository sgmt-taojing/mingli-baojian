#!/usr/bin/env python3

# ═══ LEGACY-INGEST-GUARD (R-INGEST-SPEC-20260927) ═══
# 本脚本为一次性历史批次脚本，入库口径已过时（无 fingerprint幂等/status='formal'/domain 新规范）。
# 新入库请使用 scripts/lib/kb_ingest.py；抓取请用改造后的 fetch-classics-kanripo.py / fetch-classics-wikisource.py。
# 确需原样重跑（极少数修复场景）：ALLOW_LEGACY_INGEST=1 python3 <本脚本>
import os as _lg_os, sys as _lg_sys
if _lg_os.environ.get('ALLOW_LEGACY_INGEST') != '1':
    _lg_sys.stderr.write('⛔ 旧口径入库脚本已禁用（R-INGEST-SPEC-20260927 防 KB 污染）。新口径见 scripts/lib/kb_ingest.py；确需重跑请设 ALLOW_LEGACY_INGEST=1\n')
    _lg_sys.exit(2)
# ═══ END GUARD ═══

"""R658 · 舒晗奇门L31（择吉日）+ L32（调风水）深度蒸馏
- 来源:舒晗36节精品课 L31/L32 完整PPT+导图
- module=qimen, trust=0.85
- 短主题(<300字)不独立成条
"""
import sqlite3, hashlib
from datetime import datetime, timezone, timedelta

DB = '/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/server/database/yidao.db'
NOW = datetime.now().isoformat()
LOCAL_TZ = datetime.now(timezone(timedelta(hours=8))).strftime('%Y-%m-%d %H:%M:%S')
LECTURER = '舒晗亲授'
TRUST = 0.85
MODULE = 'qimen'

conn = sqlite3.connect(DB)
cur = conn.cursor()

def entry_id(prefix):
    h = hashlib.md5((prefix + NOW).encode()).hexdigest()[:10]
    return f"{prefix}-{h}"

def exists(src_id):
    cur.execute("SELECT COUNT(*) FROM kb_formal WHERE src_id=?", (src_id,))
    return cur.fetchone()[0] > 0

def insert_entry(entry_id, module, title, content, src_id, keywords, summary):
    cur.execute("""INSERT INTO kb_formal
        (entry_id, module, title, content, src_id, category, keywords, summary, trust_score, version, promoted_at, hit_count, tags, confidence, access_level, difficulty, status, created_at, updated_at, authority)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (entry_id, module, title, content, src_id, '奇门36节精品课',
         keywords, summary, TRUST, '1.0', LOCAL_TZ, 0, f'奇门;{LECTURER};L31/32',
         0.85, 'public', 'intermediate', 'active', LOCAL_TZ, LOCAL_TZ, 'SHUHAN'))

# ============ L31 择吉日 ============
src_31 = 'SRC-SHUHAN-DAOTU-V13-L31-ZEJI-20260815-OPERATION'

l31_topics = [
    {
        'title': '奇门择吉日方法·五大原则+用神表（结婚/开业/搬家/出行/签约/考试）',
        'content': '''【L31 奇门择吉日方法·完整版】

一、择吉日定义
• 择吉日 = 选择有利的时间做重要的事情
• 奇门择吉原理：在特定时间起奇门盘，选择吉门吉星吉神当值的时间办事

二、择吉日五大基本原则
1. 避开冲本人日干日支的日子
2. 选择用神当令的日子（如求财选生门旺的日子）
3. 避开四废日（春庚辛、夏壬癸、秋甲乙、冬丙丁）
4. 避开月破日（与月支相冲的日子）
5. 选择黄道吉日（建除满平定执破危成收开闭十二建星）

三、奇门择吉五步具体方法
1. 明确要做的事情及对应用神（结婚→六合、开业→开门、搬家→生门等）
2. 在候选时间段起奇门盘
3. 选择用神落宫得吉门吉星吉神的时间
4. 避开用神落空亡击刑入墓门迫的时间
5. 选择日干与用神相生相合的日子

四、各事择吉用神速查表
• 结婚 → 六合
• 开业 → 开门+生门
• 搬家 → 生门+开门
• 出行 → 休门+九天
• 签约 → 六合+太阴
• 考试 → 天辅+景门
• 求职 → 开门
• 求医 → 天心+天芮

五、择吉三要素
• 择日：在选定吉日中选吉日
• 择时：在选定吉日中选吉时（用奇门盘分析时干落宫）
• 择方位：出行办事选择吉门所在方位出行

六、注意事项
• 择吉非万能，仅供参考
• 重大事项建议多维度综合判断
• 尊重客观规律，不迷信''',
        'keywords': '奇门择吉,择日,择时,择方位,四废日,月破日,黄道吉日,十二建星,空亡,击刑,入墓,门迫,六合催婚,开门催事业,生门催财',
        'summary': '舒晗奇门L31·择吉日方法完整版：五大原则（避冲日干/四废/月破+选黄道）+五步方法（明确用神→起盘→选吉门→避四害→选日干相生）+各事用神速查（结婚六合/开业开门生门/搬家生门开门/出行休门九天/签约六合太阴/考试天辅景门/求职开门/求医天心天芮）。'
    },
]

# ============ L32 调风水 ============
src_32 = 'SRC-SHUHAN-DAOTU-V13-L32-FENGSHUI-20260815-OPERATION'

l32_topics = [
    {
        'title': '奇门调风水方法·四步+九宫方位含义+缺角化解+定期维护',
        'content': '''【L32 奇门调风水方法·完整版】

一、奇门调风水定义
• 奇门调风水 = 用奇门盘指导居家环境布局调理
• 风水调理核心：以客厅或办公室中心为太极点，按九宫八卦方位布局

二、风水调理四步原则
1. 乾坤定位——增强本宫能量
2. 化四害——空亡击刑入墓门迫化解
3. 催旺用神——生门催财、开门催事业、六合催婚恋、天辅催学习
4. 通关化解——化解五行相克

三、居家风水九宫方位含义
• 西北乾宫 = 权力位/老父/靠山位 → 影响事业和男主
• 正北坎宫 = 智慧位/中男 → 影响学业和智慧
• 东北艮宫 = 少男 → 影响子孙
• 正东震宫 = 事业位/长男 → 影响事业
• 东南巽宫 = 财帛位/长女 → 影响财运
• 正南离宫 = 前途位/中女 → 影响前途
• 西南坤宫 = 老母 → 影响女主人
• 正西兑宫 = 口舌位/少女 → 影响口舌是非

四、风水调理六步
1. 起个人命盘找本宫方位
2. 找各用神落宫方位（生门/开门/六合/天辅/天芮等）
3. 在各方位放置对应事物（聚宝盆/金属马/碧玉如意/文昌塔等）
4. 化四害（空亡/击刑/入墓/门迫各自化解）
5. 通关化解五行相克
6. 定期维护更换（聚宝盆三年换、大米每月换等）

五、房屋缺角问题
• 缺角对应宫位方位的人事会受影响
• 太极点确定：以客厅或办公室中心为太极点，不是以整栋房子为准

六、各用神对应事物
• 生门催财 → 聚宝盆
• 开门催事业 → 金属马
• 六合催婚恋 → 碧玉如意
• 天辅催学习 → 文昌塔
• 天芮身体 → 葫芦/医物

七、注意事项
• 风水调理有作用但非绝对
• 尊重客观规律
• 提升认知、智慧、实力才是根本''',
        'keywords': '奇门调风水,太极点,九宫方位,乾坤定位,化四害,通关化解,缺角化解,聚宝盆,金属马,碧玉如意,文昌塔,催财,催事业,催婚恋,催学习',
        'summary': '舒晗奇门L32·调风水方法完整版：四步原则（乾坤定位+化四害+催用神+通关）+九宫方位含义（西北权力/北智慧/东事业/东南财帛/南前途/西口舌）+六步流程+各用神对应事物（聚宝盆/金属马/碧玉如意/文昌塔）+定期维护（聚宝盆三年换、大米每月换）。'
    },
]

# ============ 插入 ============
inserted = 0
for src_id, topics in [(src_31, l31_topics), (src_32, l32_topics)]:
    if exists(src_id):
        print(f"已存在 src_id={src_id}，跳过")
        continue
    prefix = 'SHUHAN-L31' if 'L31' in src_id else 'SHUHAN-L32'
    for i, t in enumerate(topics, 1):
        eid = entry_id(f"{prefix}-{i}")
        insert_entry(eid, MODULE, t['title'], t['content'], src_id, t['keywords'], t['summary'])
        inserted += 1
        print(f"  ✓ [{prefix}] 条{i}: {t['title'][:40]}...")

conn.commit()

# FTS5 重建
print("\n=== FTS5 重建 ===")
cur.execute("INSERT INTO kb_fts5(kb_fts5, rank) VALUES('rebuild', 0)")
conn.commit()

cur.execute("SELECT COUNT(*) FROM kb_formal WHERE src_id IN (?, ?)", (src_31, src_32))
print(f"\n本次新增 {inserted} 条")
print(f"src_id入库校验: {cur.fetchone()[0]} 条")
conn.close()

print("\n=== Done R658 · 舒晗L31/L32 深度蒸馏 ===")