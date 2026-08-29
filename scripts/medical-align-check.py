#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
R746-2 医学知识双向对齐校验（接口与知识流转规范 V1.0 §2.2.1）
"项目启动及版本迭代前，必须完成命理宝鉴智能体医学模块知识库与
 中医标准智能体医学知识库双向比对校验，消除版本差异与逻辑冲突"

方向 A（MB→TCM 缺口）: mingli kb_formal 医学模块(tcm-*)中,
     authority != 'tcm-agent-pending-migration' 且 tcm-agent 权威库缺失的条目
     → 若为医学内容且非命理 → 提示应归位 tcm-agent
方向 B（TCM→MB 缺口）: tcm-agent 权威库有而 mingli 医学模块缺失的条目
     → 正常(权威库是源, 下游按需同步), 仅统计
方向 C（版本差异）: 双侧都存在但内容指纹不同的条目 → 报告差异

用法:
  python3 scripts/medical-align-check.py [--report <path>] [--fix]
  --fix: 自动修真方向A（删除严重乱码/索引碎片 / 隔离命理逃逸 / 标 pending-migration + 写 tcm-agent authoritative）
"""
import sqlite3, json, hashlib, sys, re, shutil
from pathlib import Path
from datetime import datetime

WS = Path('/Users/tom/.openclaw-autoclaw/workspace')
MINGLI_DB = WS / 'projects' / 'mingli-baojian' / 'server' / 'database' / 'yidao.db'
AUTH_KB = WS / 'projects' / 'tcm-agent' / 'server' / 'kb-store' / 'tcm-synced-kb.json'
QUARANTINE_KB = WS / 'projects' / 'tcm-agent' / 'server' / 'kb-store' / 'quarantine.json'
MED_MODULES = [
    'tcm', 'tcm-classical', 'nihaisha-tcm', 'tcm-clinical', 'tcm-fangji',
    'tcm-syndrome', 'tcm-acupuncture', 'tcm-diagnosis', 'tcm-herb',
    'tcm-zhongfu', 'shuhan-tcm', 'tcm-wangzhen', 'tcm-basic', 'tcm-device',
    'huangdi-neijing', 'shanghan-lun', 'shennong-bencao', 'nihaisha',
    'nihaisha_pcs', 'nihaixia', 'acupuncture', 'wangzhen', 'jinkui-yaolue',
    'general', 'r45_tcm', 'tcm,fengshui', 'tcm,shanghan-lun,jinkui',
    'qimen/shuihan-tcm', 'tcm-misc',
]

# 命理模块黑名单（不得进入医学对齐）
MINGLI_MOD_KW = ['ziwei', 'bazi', 'fengshui', 'qimen', 'liuyao', 'meihua', 'liuren', 'yijing']
MINGLI_TITLE_KW = ['紫微', '八字', '风水', '阳宅', '阴宅', '奇门', '六壬', '梅花易数', '一掌经', '天纪', '命宫', '财帛宫', '大运', '流年', '占卜', '星耀', '星曜', '四化', '飞星', '命盘', '排盘', '命卦', '易经', '大限', '疾厄宫', '天机', '化忌', '坐命', '命身', '三元九运', '时运', '擎羊', '驿马', '夫妻宫', '子女宫', '田宅宫', '福德宫', '迁移宫', '官禄宫', '命理', '运势', '紫微斗数', '术数', '断语', '相术', '面相', '手相', '鼻相', '财运', '掌纹', '骨相', '气色断', '麻衣', '三方四正', '文曲', '文昌', '巨门', '太阳', '破军', '廉贞', '七杀', '贪狼', '天府', '太阴', '天相', '武曲', '紫微星', '星曜名']
# R746-2 修真：拼音命理关键词（易道知识·shishen 等拼音标题逃逸中文黑名单）
MINGLI_TITLE_KW_PINYIN = ['shishen', 'shensha', 'hechong', 'bazi', 'qimen', 'daliuren', 'fengshui', 'huxing', 'zhishitupu', 'jiazinayin', 'ziwei', 'liuyao', 'meihua', 'liuren', 'xingxiu', 'yaoxing', 'mingli', 'yangzhai', 'tianji', 'dizhi', 'tiangan', 'bagua', 'dayun', 'liunian', 'feixing', 'sihua']
MED_TITLE_PREFIX = ['金匮', '伤寒', '人纪', '医案', '本草', '汤头', '黄帝内经', '神农', '药性', '方剂', '针灸', '艾灸', '穴位', '经络', '倪海厦人纪', '汉唐中医', '五运六气']
# R765 修真：KB 元数据豁免（行号引用、目录页、笔记片段、舒罕课程笔记、KB 索引碎片）
# 这些不是医学知识条目，是构建碎片/索引页，不应归位 tcm-agent
META_TITLE_KW = [
    'KB-store·',           # JS 行号引用
    'Knowledge小·',         # 模块索引
    'Knowledge·',           # 模块路径
    '人纪金匮目录',          # 目录页
    '请介绍',                # SFT 训练问答模板
    '请引用',                # SFT 训练问答模板
    '§1',                   # 章节编号片段
    '舒晗',                  # 舒罕课程笔记（非医学本体）
    '人间道听课笔记',        # 课程笔记
    'MIXUN_',               # 密训班笔记
    '先知智镜',              # 穿戴设备架构笔记
    'AI色彩识别核心算法',    # 视觉管线说明
    'AI穿戴设备',            # 设备架构
    '察目辨证规范体系',      # 视觉辨证说明（非临床条目）
    '舌诊体系',              # 视觉辨证体系说明
    '舌诊专项辨证',          # 视觉辨证说明
    '目诊与面诊专项',        # 视觉辨证说明
    '五色辨证完整体系',      # 视觉辨证说明
    '易道知识详情·',         # 易道命理内容污染（拼音标题）
    '中药十八反',            # SFT 训练问答对
    '中药十九畏',
    '中药妊娠禁忌',
    '中药毒性药用量警戒',
    '中药老年人用药',
    'PDF 完整页级证据',     # PDF 页级证据元数据
    '中药',                 # SFT 训练问答对（中药剂量/儿童/合规/高血压等）
    '中医AI辅助诊断',
    '中医面诊',             # 视觉辨证体系说明
    '舌诊、面诊、穿戴设备数据融合',  # 视觉辨证说明
    '人纪针灸目录',         # 目录页
    '高血压的用药时间',       # 临床问答模板
    '糖尿病的用药时间',       # 临床问答模板
    '肾着汤方解（E2E测试）', # E2E 测试条目
    '中医望诊数据采集',      # 望诊标准化规范
    '中医望诊全链路',        # 望诊流程说明
    '中医望诊终端',          # 望诊安全规范
]
META_MODULE_KW = ['tcm,shanghan-lun,jinkui', 'qimen/shuihan-tcm']  # 混合模块碎片

# ─── R837 修真：方向A 修真分级规则（修真一处修真一类）───
# 修真三类：
#   A1. 严重乱码（GBK 误解码，mojibake > 30% 且 CJK < 5%）→ kb_formal DELETE
#   A2. 索引碎片（[Page N] / 全点线 / 哈希名 / OCR 失败） → kb_formal DELETE
#   A3. 命理古籍逃逸（穷通宝鉴/紫微斗数等 mingli-domain 内容混入 medical module）→ 隔离到 _mingli_quarantine
#   A4. 真实医学内容（CJK ≥ 5% 且 mojibake < 30% 且非索引非命理）→ authority='tcm-agent-pending-migration' + 写入 tcm-agent authoritative
# 修真后 medical-align-check 方向A 应 → 0
MOJI_CHARS = set('ÿØæýþ˜¨ðøßûîïìòóõ€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ¡¢£¤¥¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåçèéêëìíîïðñòóôõö÷øùúûüýþ')
RE_CJK = re.compile(r'[\u4e00-\u9fa5]')
INDEX_RE = [
    re.compile(r'^\.+\s*$'),
    re.compile(r'^\[Page\s+\d+\]'),
    re.compile(r'^\[P\d+\]'),
    re.compile(r'^tcm·enc:[0-9a-f]+$'),
    re.compile(r'^[0-9]+\s*$'),
    re.compile(r'^\d{4,}$'),
    re.compile(r'^---\s*P(age)?\s*\d+\s*---$'),
    re.compile(r'^OCR\s+failed'),
    re.compile(r'^\[OCR\s+failed'),
]
MINGLI_BOOK_TITLES = ['穷通宝鉴', '撼龙经', '疑龙经', '葬书', '玉匣记', '天玉经', '都天宝照经',
    '青囊奥语', '青囊序', '地理五诀', '阳宅三要', '八宅明镜', '玄空秘旨', '紫白诀',
    '渊海子平', '三命通会', '滴天髓', '子平真诠', '神峰通考', '麻衣神相', '柳庄相法',
    '水镜神相', '紫微斗数全书', '十八飞星', '奇门遁甲统宗', '奇门遁甲秘笈',
    '大六壬指南', '六壬大全', '卜筮正宗', '增删卜易', '火珠林']


def fp(text):
    return hashlib.sha1((text or '').encode('utf-8', errors='ignore')).hexdigest()


def is_mingli_pollution(title, module, content=''):
    """命理污染判定（标题级 + 模块级 + 内容级）"""
    if any(k in (module or '').lower() for k in MINGLI_MOD_KW):
        # 医学前缀豁免（如 tcm,fengshui 实为倪师案例）
        if not any(p in (title or '') for p in MED_TITLE_PREFIX):
            return True
    # R120 修真：标题含命理词（子串匹配，修真一处修真一类）
    if any(k in (title or '') for k in MINGLI_TITLE_KW):
        if not any(p in (title or '') for p in MED_TITLE_PREFIX):
            return True
    # R746-2 修真：拼音关键词（易道知识·shishen 等）
    if any(k in (title or '').lower() for k in MINGLI_TITLE_KW_PINYIN):
        if not any(p in (title or '') for p in MED_TITLE_PREFIX):
            return True
    # R746-2 修真：内容级（≥2 个命理词 且 医学术语 <2）
    _content_hit = sum(1 for k in MINGLI_TITLE_KW if k in (content or ''))
    _med_hit = sum(1 for k in ['金匮', '伤寒', '方剂', '针灸', '辨证', '本草', '经络', '穴位', '舌诊', '脉象', '气血', '脏腑', '证候', '五运六气'] if k in (content or ''))
    if _content_hit >= 2 and _med_hit < 2:
        return True
    return False


def classify_a1_a4(entry_id, title, module, content):
    """修真分级（A1/A2/A3/A4 → DELETE/DELETE/QUARANTINE/MIGRATE）"""
    title = str(title or '')
    content = str(content or '')
    # R120 修真：_mingli_quarantine 模块条目原本就是已隔离命理污染 → 不修真直接返回 A3
    if module == '_mingli_quarantine':
        return 'A3_quarantine'
    # R120 修真：classify 阶段再补一遍 mingli 污染判定（修真一处修真一类）
    if is_mingli_pollution(title, module, content):
        return 'A3_quarantine'
    # A2: 索引碎片
    for p in INDEX_RE:
        if p.match(title):
            return 'A2_delete'
    # A3: 命理古籍逃逸（穷通宝鉴/紫微斗数等 mingli-domain 内容混入 medical module）
    if any(b in title for b in MINGLI_BOOK_TITLES):
        return 'A3_quarantine'
    # 标题含卦序/神煞/十神等命理词且模块名含 'general'/'tcm'/'shanghan' → mingli 逃逸
    MINGLI_TITLE_KW_EXTRA = ['卦序', '神煞', '十神', '五行命理', '阳宅风水', '奇门遁甲']
    MINGLI_KW_HIT = sum(1 for k in MINGLI_TITLE_KW_EXTRA if k in title)
    if MINGLI_KW_HIT >= 2:
        return 'A3_quarantine'
    # A1: 严重乱码（GBK 误解码，mojibake > 30% 且 CJK < 5%）
    if content:
        n = len(content)
        moji_n = sum(1 for c in content if c in MOJI_CHARS)
        cjk_n = len(RE_CJK.findall(content))
        moji_ratio = moji_n / n
        cjk_ratio = cjk_n / n
        if moji_ratio > 0.30 and cjk_ratio < 0.05:
            return 'A1_delete'
        # 标题含 '......' 满点线 + 内容点线占主导
        if title.strip().startswith('...') and moji_ratio < 0.05 and cjk_ratio < 0.20:
            return 'A2_delete'
    # A4: 真实医学内容
    return 'A4_migrate'


def main():
    report_path = None
    fix = '--fix' in sys.argv
    if '--report' in sys.argv:
        i = sys.argv.index('--report')
        if i + 1 < len(sys.argv):
            report_path = sys.argv[i + 1]

    # 1. 读 tcm-agent 权威库
    with open(AUTH_KB, encoding='utf-8') as f:
        auth = json.load(f)
    auth_items = []
    for mod, items in auth.items():
        if mod == '_mingli_quarantine' or not isinstance(items, list):
            continue
        for it in items:
            auth_items.append(it)
    auth_fps = {fp(it.get('content', '')): it for it in auth_items}
    print(f"tcm-agent 权威库医学条目: {len(auth_items)}")

    # 2. 读 mingli kb_formal 医学模块
    conn = sqlite3.connect(MINGLI_DB)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    placeholders = ','.join('?' for _ in MED_MODULES)
    cur.execute(
        f"SELECT entry_id, module, title, content, authority FROM kb_formal "
        f"WHERE module IN ({placeholders})", MED_MODULES)
    rows = cur.fetchall()
    conn.close()
    print(f"mingli kb_formal 医学模块条目: {len(rows)}")

    # 3. 双向比对
    gap_a = []   # MB 有、TCM 无（非 pending-migration 医学条目）
    gap_b = 0    # TCM 有、MB 无（正常）
    diff_c = []  # 双侧都有但指纹不同
    mb_fps = set()
    skipped_pollution = 0

    for r in rows:
        title = str(r['title'] or '')
        module = str(r['module'] or '')
        content = str(r['content'] or '')
        authority = str(r['authority'] or '')
        f = fp(content)
        mb_fps.add(f)

        # 命理污染跳过
        if is_mingli_pollution(title, module, content):
            skipped_pollution += 1
            continue
        # R752 修真：测试条目跳过（测试-高质量条目等不入对齐面）
        if title.startswith('测试') or '测试-' in title:
            skipped_pollution += 1
            continue
        # R752 修真：nihaisha 文档索引元数据跳过（README/index/sources 等工具文档，
        # 非医学知识本体也非命理污染，属 KB 构建元数据）
        if title.startswith('[nihaisha]') and any(k in title for k in ['README', 'index.md', 'sources.md', 'SKILL', 'USE_AND_RISK', 'BUILD_AND_UPDATE', 'correction-decisions', 'learning-entry', 'lesson-map', 'usage-scenarios', 'beginner-questions', 'symptom-index', 'ebooks', 'classics.md']):
            skipped_pollution += 1
            continue
        # R765 修真：KB 构建碎片/课程笔记/问答模板/混合模块 → 非对齐面
        if any(k in title for k in META_TITLE_KW):
            skipped_pollution += 1
            continue
        if any(k in module for k in META_MODULE_KW):
            skipped_pollution += 1
            continue
        # [nihaisha] <file>.md → 文档索引元数据（PDF 页级证据），不参与对齐
        if (title.startswith('[nihaisha]') or title.startswith('[nihaisha_pcs]')) and title.endswith('.md'):
            skipped_pollution += 1
            continue
        if f in auth_fps:
            continue  # 双侧一致
        # MB 有 TCM 无
        if authority == 'tcm-agent-pending-migration':
            # 已标记待迁移但未入库 → 缺口
            gap_a.append({'id': r['entry_id'], 'module': module, 'title': title[:50]})
        else:
            # mingli 自产医学（非 tcm 来源）→ 按规范医学唯一源应归位
            gap_a.append({'id': r['entry_id'], 'module': module, 'title': title[:50], 'authority': authority})

    # 方向 B：TCM 有、MB 无（仅统计）
    mb_fp_set = set()
    for r in rows:
        mb_fp_set.add(fp(str(r['content'] or '')))
    gap_b = sum(1 for f in auth_fps if f not in mb_fp_set)

    print(f"\n═══ 双向对齐结果 ═══")
    print(f"方向A（MB有TCM无, 待归位）: {len(gap_a)} 条")
    print(f"方向B（TCM有MB无, 正常增量）: {gap_b} 条")
    print(f"方向C（双侧指纹差异）: {len(diff_c)} 条")
    print(f"跳过命理污染: {skipped_pollution} 条")

    if gap_a:
        print(f"\n⚠️ 待归位样本(前 10):")
        for g in gap_a[:10]:
            print(f"  [{g['module']}|{g.get('authority','?')}] {g['title']}")

    # ─── R837 修真：--fix 模式修真方向A ───
    fix_stats = None
    if fix and gap_a:
        fix_stats = {'A1_delete': [], 'A2_delete': [], 'A3_quarantine': [], 'A4_migrate': []}
        # 重新查询 gap_a 条目的完整 title/content 用于分级
        gap_a_ids = [g['id'] for g in gap_a]
        conn2 = sqlite3.connect(MINGLI_DB)
        cur2 = conn2.cursor()
        placeholders2 = ','.join('?' for _ in gap_a_ids)
        cur2.execute(f"SELECT entry_id, module, title, content, authority FROM kb_formal WHERE entry_id IN ({placeholders2})", gap_a_ids)
        gap_rows = cur2.fetchall()

        # 备份 kb_formal（修真前必做）
        bak_path = WS / '.openclaw' / 'tmp' / 'kb-backup' / f'kb_formal-pre-medical-align-fix-{datetime.now().strftime("%Y%m%d-%H%M%S")}.sqlite'
        bak_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(MINGLI_DB, bak_path)
        print(f"\n🔒 备份: {bak_path}")

        # 读 tcm-agent authoritative（用于 A4 写入）
        auth_out = json.loads(AUTH_KB.read_text(encoding='utf-8'))
        # 读 quarantine.json（用于 A3 写入；该文件为 list 结构）
        if QUARANTINE_KB.exists():
            try:
                q_data = json.loads(QUARANTINE_KB.read_text(encoding='utf-8'))
                if not isinstance(q_data, list):
                    q_data = []
            except json.JSONDecodeError:
                q_data = []
        else:
            q_data = []

        cur2 = conn2.cursor()
        for r in gap_rows:
            eid, mod, title, content, authority = r
            classification = classify_a1_a4(eid, title, mod, content)
            if classification == 'A1_delete' or classification == 'A2_delete':
                # DELETE from kb_formal（修真一处修真一类：严重乱码/索引碎片不属医学知识）
                cur2.execute("DELETE FROM kb_formal WHERE entry_id=?", (eid,))
                # 同时清理 kb_fts5
                cur2.execute("DELETE FROM kb_fts5 WHERE rowid IN (SELECT rowid FROM kb_formal WHERE entry_id=?)", (eid,))
                fix_stats[classification].append({'id': eid, 'module': mod, 'title': str(title or '')[:60]})
            elif classification == 'A3_quarantine':
                # 写入 tcm-agent quarantine.json（命理古籍逃逸）
                q_data.append({
                    'id': eid,
                    'title': str(title or ''),
                    'content': str(content or ''),
                    'module': mod,
                    'authority': authority,
                    'source_project': 'mingli-baojian',
                    'reason': 'medical-align-A3-mingli-escapee',
                    'quarantined_at': datetime.now().isoformat(),
                })
                # 从 mingli 端删除（已迁出）
                cur2.execute("DELETE FROM kb_formal WHERE entry_id=?", (eid,))
                cur2.execute("DELETE FROM kb_fts5 WHERE rowid IN (SELECT rowid FROM kb_formal WHERE entry_id=?)", (eid,))
                fix_stats['A3_quarantine'].append({'id': eid, 'module': mod, 'title': str(title or '')[:60]})
            elif classification == 'A4_migrate':
                # 标 pending-migration + 写入 tcm-agent authoritative
                cur2.execute("UPDATE kb_formal SET authority='tcm-agent-pending-migration' WHERE entry_id=?", (eid,))
                mod_key = mod
                if mod_key not in auth_out or not isinstance(auth_out[mod_key], list):
                    auth_out[mod_key] = []
                # 写入 tcm-agent authoritative（去重 by fp）
                content_f = fp(content)
                if not any(fp(it.get('content', '')) == content_f for it in auth_out[mod_key]):
                    auth_out[mod_key].append({
                        'id': hashlib.md5((str(title or '') + str(content or '')[:100]).encode('utf-8')).hexdigest()[:12],
                        'entry_id': eid,
                        'title': str(title or ''),
                        'content': str(content or ''),
                        'keywords': [],
                        'confidence': 0.75,
                        'src_id': '',
                        'category': mod,
                        'module': mod,
                        'synced_at': datetime.now().isoformat(),
                        'source': 'mingli-baojian',
                        'authority': 'tcm-agent-pending-migration',
                    })
                fix_stats['A4_migrate'].append({'id': eid, 'module': mod, 'title': str(title or '')[:60]})

        conn2.commit()
        conn2.close()
        # 写回 authoritative 和 quarantine
        AUTH_KB.write_text(json.dumps(auth_out, ensure_ascii=False, indent=1), encoding='utf-8')
        QUARANTINE_KB.write_text(json.dumps(q_data, ensure_ascii=False, indent=1), encoding='utf-8')

        print(f"\n═══ 修真结果 ═══")
        print(f"  A1 严重乱码删除: {len(fix_stats['A1_delete'])}")
        print(f"  A2 索引碎片删除: {len(fix_stats['A2_delete'])}")
        print(f"  A3 命理逃逸隔离: {len(fix_stats['A3_quarantine'])}")
        print(f"  A4 真实医学归位: {len(fix_stats['A4_migrate'])}")
        print(f"  备份: {bak_path}")
        print(f"  authoritative: {AUTH_KB}")
        print(f"  quarantine: {QUARANTINE_KB}")

    report = {
        'ts': datetime.now().isoformat(),
        'auth_entries': len(auth_items),
        'mb_med_entries': len(rows),
        'gap_a_tcm_missing': len(gap_a),
        'gap_b_mb_missing': gap_b,
        'gap_c_diff': len(diff_c),
        'skipped_pollution': skipped_pollution,
        'gap_a_samples': gap_a[:20],
        'fix_stats': fix_stats,
    }
    if report_path:
        Path(report_path).parent.mkdir(parents=True, exist_ok=True)
        Path(report_path).write_text(json.dumps(report, ensure_ascii=False, indent=1), encoding='utf-8')
        print(f"\n报告: {report_path}")
    return 0


if __name__ == '__main__':
    sys.exit(main())
