#!/usr/bin/env python3
"""
命理宝鉴 · 诊疗经验蒸馏引擎 v1.1
从患者诊疗历史中提取有效经验，蒸馏为结构化知识条目，补充知识库。

蒸馏流程：
1. 扫描所有诊断历史（localStorage 导出的 JSON）
2. 按 脏腑×症状×方剂×体质×紫微命中 多维度聚类
3. 提取高频有效组合 → 生成候选知识条目
4. 写入 kb_staging 表（待审核）
5. 生成蒸馏报告

运行方式：
  python3 scripts/distill-clinical-experience.py [--input <导出JSON>] [--dry-run]

输出：
  - kb_staging 新增条目（source_type='clinical_distill'）
  - distill-report-YYYY-MM-DD.json 蒸馏报告
"""

import json
import sqlite3
import os
import sys
import re
from datetime import datetime, timedelta
from collections import defaultdict

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'server', 'database', 'yidao.db')
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'DELIVERY')

# 体质 → 脏腑映射
CONSTITUTION_ORGAN_MAP = {
    '阴虚质': ['肾', '肝'],
    '阳虚质': ['肾', '脾'],
    '气虚质': ['脾', '肺'],
    '痰湿质': ['脾', '肺'],
    '湿热质': ['脾', '肝'],
    '血瘀质': ['心', '肝'],
    '气郁质': ['肝', '心'],
    '特禀质': ['肺', '肾'],
    '土湿体质': ['脾', '胃'],
    '土湿': ['脾', '胃'],
    '火虚': ['心'],
    '金燥': ['肺'],
    '木郁': ['肝'],
}


def load_clinical_data(input_path=None):
    """加载诊疗数据"""
    if input_path:
        with open(input_path, 'r') as f:
            data = json.load(f)
        return data.get('patients', []), data.get('history', [])

    # 从 localStorage 导出文件加载
    export_files = []
    export_dir = os.path.join(os.path.dirname(__file__), '..', '.openclaw', 'tmp')
    if os.path.exists(export_dir):
        for f in os.listdir(export_dir):
            if f.startswith('patient_export') and f.endswith('.json'):
                export_files.append(os.path.join(export_dir, f))

    if export_files:
        latest = sorted(export_files)[-1]
        with open(latest, 'r') as f:
            data = json.load(f)
        return data.get('patients', []), data.get('history', [])

    return [], []


def extract_constitution_organs(text):
    """从文本中根据体质提取脏腑"""
    organs = []
    for constitution, org_list in CONSTITUTION_ORGAN_MAP.items():
        if constitution in text:
            organs.extend(org_list)
    five_phase = {'火': '心', '金': '肺', '土': '脾', '木': '肝', '水': '肾'}
    for phase, organ in five_phase.items():
        if phase + '虚' in text or phase + '燥' in text or phase + '湿' in text or phase + '郁' in text:
            organs.append(organ)
    return list(set(organs))


def extract_organ(text):
    """从诊断文本中提取脏腑（含体质映射 + 紫微星曜映射）"""
    organs = []
    organ_keywords = {
        '肝': ['肝', '目', '筋', '怒', '胆', '肝胆'],
        '心': ['心', '舌', '脉', '喜', '小肠', '心血管'],
        '脾': ['脾', '口', '肉', '思', '胃'],
        '肺': ['肺', '鼻', '皮', '悲', '大肠'],
        '肾': ['肾', '耳', '骨', '恐', '膀胱']
    }
    for organ, keywords in organ_keywords.items():
        if any(kw in text for kw in keywords):
            organs.append(organ)

    # 补充：通过体质映射
    constitution_organs = extract_constitution_organs(text)
    for o in constitution_organs:
        if o not in organs:
            organs.append(o)

    return organs


def extract_formula(text):
    """从文本中提取方剂名"""
    formulas = []
    common_formulas = [
        '逍遥散', '桂枝汤', '麻黄汤', '小柴胡汤', '六味地黄丸', '归脾汤',
        '四君子汤', '补中益气汤', '龙胆泻肝汤', '保和丸', '半夏泻心汤',
        '理中丸', '四逆汤', '真武汤', '黄连解毒汤', '白虎汤',
        '天王补心丹', '酸枣仁汤', '玉屏风散', '肾气丸',
        '血府逐瘀汤', '五苓散', '藿香正气散', '参苓白术散'
    ]
    for f in common_formulas:
        if f in text:
            formulas.append(f)
    return formulas


def extract_symptoms(text):
    """提取症状关键词"""
    symptoms = []
    symptom_list = [
        '头痛', '头晕', '失眠', '多梦', '耳鸣', '胸闷', '心悸',
        '胃胀', '腹痛', '便秘', '腹泻', '乏力', '怕冷', '怕热',
        '盗汗', '食欲差', '烦躁', '腰痛', '咳嗽', '面瘫', '口干',
        '面色苍白', '面色潮红', '面色萎黄', '面色晦暗',
        '心烦', '易怒', '反酸', '食欲不振', '痰多',
        '胃痛', '抑郁', '焦虑', '口干舌燥', '手心发热',
        '口苦', '尿黄', '大便干', '月经不调', '腰酸'
    ]
    for s in symptom_list:
        if s in text:
            symptoms.append(s)
    return symptoms


def extract_hits_patterns(text):
    """从紫微斗数命中文案中提取健康风险标签与星曜"""
    patterns = []
    # 化忌星曜
    m = re.search(r'化忌\s*(\S+)', text)
    if m:
        patterns.append(('化忌星曜', m.group(1)))
    # 健康命中标签
    for label in ['心血管', '肝胆', '脾胃', '肺', '肾', '失眠', '焦虑', '结节']:
        if label in text:
            patterns.append(('健康标签', label))
    return patterns


def distill_experience(patients, history):
    """蒸馏诊疗经验（多维度聚类）"""
    organ_symptoms = defaultdict(set)
    organ_diagnosis_count = defaultdict(int)
    formula_usage = defaultdict(int)
    symptom_frequency = defaultdict(int)
    constitution_counts = defaultdict(int)
    hits_patterns = defaultdict(int)
    stars_seen = defaultdict(int)

    for h in history:
        diag_text = h.get('diagnosis_text', '') + ' ' + h.get('ai_analysis', '') + ' ' + h.get('voice_notes', '')

        organs = extract_organ(diag_text)
        symptoms = extract_symptoms(diag_text)
        formulas = extract_formula(diag_text)
        hits = extract_hits_patterns(diag_text)

        for organ in organs:
            organ_diagnosis_count[organ] += 1
            for symptom in symptoms:
                organ_symptoms[organ].add(symptom)

        for const in CONSTITUTION_ORGAN_MAP:
            if const in diag_text:
                constitution_counts[const] += 1

        for f in formulas:
            formula_usage[f] += 1

        for s in symptoms:
            symptom_frequency[s] += 1

        for hit_type, hit_val in hits:
            hits_patterns[f'{hit_type}:{hit_val}'] += 1
            if hit_type == '化忌星曜':
                stars_seen[hit_val] += 1

        # 直接从 snapshot_json 提取化忌星曜（兼容字段）
        try:
            snap = json.loads(h.get('snapshot_json', '{}'))
            if snap.get('huaJiStar'):
                stars_seen[snap['huaJiStar']] += 1
        except:
            pass

    # === 生成候选知识条目 ===
    candidates = []

    # 1. 脏腑-症状关联（不依赖方剂，症状聚类即可）
    for organ, symptoms in organ_symptoms.items():
        if not symptoms:
            continue
        symptom_str = '、'.join(sorted(symptoms))
        formula_hint = ''
        if organ_diagnosis_count[organ] >= 2:
            # 给出常见方剂建议
            organ_formula_hints = {
                '心': '天王补心丹、归脾汤',
                '肝': '逍遥散、龙胆泻肝汤',
                '脾': '归脾汤、参苓白术散',
                '肺': '玉屏风散、补中益气汤',
                '肾': '六味地黄丸、肾气丸',
            }
            hints = organ_formula_hints.get(organ, '')
            if hints:
                formula_hint = f'\n【常见方剂参考】{hints}'

        entry = {
            'entry_id': f'KB-DISTILL-ORGAN-{organ}-{datetime.now().strftime("%Y%m%d")}',
            'module': 'wangzhen',
            'title': f'{organ}系临床常见症状群',
            'content': (
                f'【蒸馏来源】{len(history)}条诊疗记录\n'
                f'【脏腑】{organ}\n'
                f'【临床症状】{symptom_str}\n'
                f'【统计】该脏腑相关记录{organ_diagnosis_count[organ]}条'
                f'{formula_hint}\n'
                f'【经验】{organ}系病变常见{symptom_str}等表现，临床需综合辨证。'
            ),
            'category': '临床经验',
            'keyword': f'{organ},{symptom_str}',
            'trust': min(0.5 + organ_diagnosis_count[organ] * 0.15, 0.9),
            'source_type': 'clinical_distill',
            'distill_date': datetime.now().isoformat()
        }
        candidates.append(entry)

    # 2. 体质分布统计
    if constitution_counts:
        for const, count in sorted(constitution_counts.items(), key=lambda x: -x[1]):
            organs = CONSTITUTION_ORGAN_MAP.get(const, [])
            entry = {
                'entry_id': f'KB-DISTILL-CONST-{const}-{datetime.now().strftime("%Y%m%d")}',
                'module': 'wangzhen',
                'title': f'体质「{const}」临床观察记录',
                'content': (
                    f'【蒸馏来源】{len(history)}条诊疗记录\n'
                    f'【体质类型】{const}\n'
                    f'【出现次数】{count}次\n'
                    f'【关联脏腑】{"、".join(organs)}\n'
                    f'【经验】{const}在临床中较多见，调理需从关联脏腑入手。'
                ),
                'category': '体质观察',
                'keyword': f'{const},体质',
                'trust': min(0.6 + count * 0.12, 0.9),
                'source_type': 'clinical_distill',
                'distill_date': datetime.now().isoformat()
            }
            candidates.append(entry)

    # 3. 紫微斗数化忌星曜→健康风险映射
    if stars_seen:
        star_rows = '\n'.join([f'{s}：{c}次' for s, c in sorted(stars_seen.items(), key=lambda x: -x[1])])
        entry = {
            'entry_id': f'KB-DISTILL-ZWDS-STARS-{datetime.now().strftime("%Y%m%d")}',
            'module': 'wangzhen',
            'title': '紫微斗数化忌星曜健康风险统计',
            'content': (
                f'【蒸馏来源】{len(history)}条诊疗记录\n'
                f'【化忌星曜分布】\n{star_rows}\n'
                f'【经验】紫微斗数命盘中星曜化忌常指向对应脏腑薄弱环节。'
                f'天机化忌→肝胆/神经系统、太阳化忌→心血管/循环系统、'
                f'太阴化忌→肾脏/内分泌、廉贞化忌→血液/免疫。'
            ),
            'category': '紫微健康',
            'keyword': '紫微斗数,化忌,健康风险',
            'trust': 0.85,
            'source_type': 'clinical_distill',
            'distill_date': datetime.now().isoformat()
        }
        candidates.append(entry)

    # 4. 高频症状统计
    top_symptoms = sorted(symptom_frequency.items(), key=lambda x: -x[1])[:10]
    if top_symptoms:
        symptom_rows = '\n'.join([f'{s}：{c}次' for s, c in top_symptoms])
        entry = {
            'entry_id': f'KB-DISTILL-SYMPTOMS-{datetime.now().strftime("%Y%m%d")}',
            'module': 'wangzhen',
            'title': '临床高频症状 TOP10',
            'content': (
                f'【蒸馏来源】{len(history)}条诊疗记录\n'
                f'【高频症状】\n{symptom_rows}\n'
                f'【经验】上述症状在临床出现频率最高，'
                f'建议在网诊问诊时重点关注并建立规范化评估流程。'
            ),
            'category': '症状统计',
            'keyword': '症状,高频,统计',
            'trust': 0.75,
            'source_type': 'clinical_distill',
            'distill_date': datetime.now().isoformat()
        }
        candidates.append(entry)

    # 5. 风险等级分布
    risk_levels = defaultdict(int)
    for p in patients:
        rl = p.get('risk_level', '未知')
        if rl:
            risk_levels[rl] += 1
    if risk_levels:
        risk_rows = '\n'.join([f'{k}：{v}人' for k, v in sorted(risk_levels.items(), key=lambda x: -x[1])])
        entry = {
            'entry_id': f'KB-DISTILL-RISK-{datetime.now().strftime("%Y%m%d")}',
            'module': 'wangzhen',
            'title': '患者风险等级分布',
            'content': (
                f'【蒸馏来源】{len(patients)}位患者\n'
                f'【风险分布】\n{risk_rows}\n'
                f'【经验】较高风险患者占比需重点关注，'
                f'建议对化忌星曜命中的患者增加随访频率。'
            ),
            'category': '风险管理',
            'keyword': '风险,等级,分布',
            'trust': 0.8,
            'source_type': 'clinical_distill',
            'distill_date': datetime.now().isoformat()
        }
        candidates.append(entry)

    # 6. 高频方剂统计
    for formula, count in sorted(formula_usage.items(), key=lambda x: -x[1])[:10]:
        if count < 2:
            continue
        entry = {
            'entry_id': f'KB-DISTILL-FORMULA-{formula}-{datetime.now().strftime("%Y%m%d")}',
            'module': 'wangzhen',
            'title': f'方剂「{formula}」临床使用统计',
            'content': (
                f'【蒸馏来源】{len(history)}条诊疗记录\n'
                f'【方剂】{formula}\n'
                f'【使用次数】{count}次\n'
                f'【使用率】{round(count / len(history) * 100, 1)}%\n'
                f'【经验】{formula}在临床中使用频率较高。'
            ),
            'category': '方剂统计',
            'keyword': formula,
            'trust': min(0.7 + count * 0.05, 0.95),
            'source_type': 'clinical_distill',
            'distill_date': datetime.now().isoformat()
        }
        candidates.append(entry)

    return candidates, {
        'total_patients': len(patients),
        'total_history': len(history),
        'organ_diagnosis_count': dict(organ_diagnosis_count),
        'formula_usage': dict(sorted(formula_usage.items(), key=lambda x: -x[1])),
        'symptom_frequency': dict(sorted(symptom_frequency.items(), key=lambda x: -x[1])),
        'constitution_counts': dict(constitution_counts),
        'stars_seen': dict(stars_seen),
        'candidates_generated': len(candidates)
    }


def write_to_staging(candidates, dry_run=False):
    """写入 kb_staging 表"""
    if dry_run:
        print(f'[DRY RUN] 将写入 {len(candidates)} 条到 kb_staging')
        for c in candidates[:3]:
            print(f'  {c["entry_id"]} | {c["title"][:40]}')
        return 0

    if not os.path.exists(DB_PATH):
        print(f'⚠️ 数据库不存在: {DB_PATH}')
        return 0

    db = sqlite3.connect(DB_PATH)
    cur = db.cursor()

    written = 0
    for c in candidates:
        try:
            cur.execute('''
                INSERT OR IGNORE INTO kb_staging
                    (entry_id, module, title, content, category, keywords, confidence, src_id, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now','localtime'))
            ''', (
                c['entry_id'], c['module'], c['title'], c['content'],
                c.get('category', ''),
                c.get('keyword', ''),
                c.get('trust', 0.7),
                c.get('source_type', 'clinical_distill')
            ))
            if cur.rowcount > 0:
                written += 1
        except Exception as e:
            print(f'⚠️ 写入失败 {c["entry_id"]}: {e}')

    # 记录蒸馏日志
    batch_id = f'DISTILL-{datetime.now().strftime("%Y%m%d-%H%M%S")}'
    cur.execute('''
        INSERT OR IGNORE INTO kb_distill_log
            (batch_id, source_type, source_count, extract_count, started_at, status)
        VALUES (?, 'clinical_distill', ?, ?, datetime('now','localtime'), 'completed')
    ''', (batch_id, len(candidates), written))

    db.commit()
    db.close()
    print(f'✅ 写入 kb_staging: {written} 条 (批次: {batch_id})')
    return written


def generate_report(candidates, stats):
    """生成蒸馏报告"""
    report = {
        'report_date': datetime.now().isoformat(),
        'summary': {
            'total_patients': stats['total_patients'],
            'total_clinical_records': stats['total_history'],
            'candidates_generated': stats['candidates_generated']
        },
        'organ_distribution': stats.get('organ_diagnosis_count', {}),
        'formula_usage_ranking': stats.get('formula_usage', {}),
        'symptom_frequency_ranking': stats.get('symptom_frequency', {}),
        'constitution_counts': stats.get('constitution_counts', {}),
        'stars_seen': stats.get('stars_seen', {}),
        'candidates': candidates
    }

    report_path = os.path.join(OUTPUT_DIR, f'distill-report-{datetime.now().strftime("%Y-%m-%d")}.json')
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print(f'✅ 蒸馏报告: {report_path}')
    return report_path


def main():
    dry_run = '--dry-run' in sys.argv
    input_path = None
    for i, arg in enumerate(sys.argv):
        if arg == '--input' and i + 1 < len(sys.argv):
            input_path = sys.argv[i + 1]

    print('═' * 50)
    print('  命理宝鉴 · 诊疗经验蒸馏引擎 v1.1')
    print('═' * 50)

    # 1. 加载数据
    patients, history = load_clinical_data(input_path)
    print(f'📊 加载: {len(patients)} 位患者, {len(history)} 条诊疗记录')

    if len(history) == 0:
        print('⚠️ 无诊疗数据，请先从患者档案中心导出数据')
        print('   导出方式：患者档案中心 → 导出全部 → 保存到 .openclaw/tmp/')
        return

    # 2. 蒸馏
    candidates, stats = distill_experience(patients, history)
    print(f'🔬 蒸馏: 生成 {len(candidates)} 条候选知识')

    for c in candidates:
        print(f'  📝 {c["entry_id"]}: {c["title"]}')

    # 3. 写入 kb_staging
    written = write_to_staging(candidates, dry_run)

    # 4. 生成报告
    report_path = generate_report(candidates, stats)

    print('═' * 50)
    print(f'✅ 蒸馏完成: {written} 条写入待审核队列')
    print(f'   报告: {report_path}')
    print(f'   下一步: 在 KB 管理面板审核 → 通过后写入 kb_formal')
    print('═' * 50)


if __name__ == '__main__':
    main()
