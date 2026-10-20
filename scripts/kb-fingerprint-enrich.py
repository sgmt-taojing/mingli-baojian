# -*- coding: utf-8 -*-
"""
kb-fingerprint-enrich.py
========================
KB 6 维指纹补齐（L1 感知层 · evo-2026-08-04-kb-smart-four-layer-evolution）

6 维指纹：
  1. scene        — 适用场景（八字/紫微/中医/风水/化解/通用）
  2. trigger      — 触发词（用户哪些提问命中此条）
  3. rebuttal     — 反驳/反例（避免误用的边界）
  4. version      — 版本号（已有）
  5. confidence   — 置信度（已有）
  6. counter_ex   — 典型反例（什么情况下结论相反）

实现：
  - 在 formal_knowledge 表 ADD COLUMN fingerprint TEXT（JSON 字符串）
  - 12,995 条 KB 一次性扫描，按规则启发式生成 fingerprint
  - 可重复运行（已 enrich 的跳过，除非 --force）
  - 生成报告：scripts/.openclaw/tmp/kb-fingerprint-report.md

用法：
  python3 scripts/kb-fingerprint-enrich.py              # 增量补齐
  python3 scripts/kb-fingerprint-enrich.py --force      # 全量重补
"""

import sqlite3, json, os, sys, re, argparse
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'knowledge', 'yidao.db')

# 6 维指纹生成规则（按模块）
SCENE_MAP = {
    'bazi': '八字排盘',
    'ziwei': '紫微斗数',
    'qimen': '奇门遁甲',
    'liuyao': '六爻纳甲',
    'meihua': '梅花易数',
    'liuren': '大六壬',
    'fengshui': '风水堪舆',
    'tcm': '中医诊疗',
    'huajie': '化解指导',
    'naming': '命名学',
    'minsu': '民俗择吉',
    'music': '五行音乐',
    'lifeplan': '人生规划',
    'lifeindex': '人生指数',
    'cross': '跨体系',
    # r39 修真后的核心模块
    'r39_dual_core': '双核驱邪·中柱人格',
    'r39_career_core': '事业核心·官印财体系',
    'r39_health_core': '健康核心·五行脏腑',
    'r39_palace_12': '紫微十二宫·人事映射',
    'r39_lifeplan_stage': '人生阶段·十年大运',
}

# 触发词提取规则（从 tags + summary 抽取）
TRIGGER_PATTERNS = [
    (r'(八字|四柱|子平|命理)', 'bazi'),
    (r'(紫微|斗数|星曜|宫位)', 'ziwei'),
    (r'(奇门|遁甲|九星|八门|三奇)', 'qimen'),
    (r'(六爻|纳甲|卦象|六亲)', 'liuyao'),
    (r'(梅花|体用|互卦|变卦)', 'meihua'),
    (r'(六壬|壬课|大六壬|四课|三传)', 'liuren'),
    (r'(风水|峦头|理气|飞星|八宅|玄空)', 'fengshui'),
    (r'(中医|辨证|舌象|脉象|方剂|草药|针灸|经方)', 'tcm'),
    (r'(化解|冲克|太岁|煞星|拜忏|祈福)', 'huajie'),
    (r'(命名|起名|字辈|五格|三才)', 'naming'),
    (r'(择吉|黄历|宜忌|吉日|神煞)', 'minsu'),
    (r'(五行|天干|地支|十神|格局|大运|流年|日主|月令)', 'bazi'),
]

# 反驳/边界（避免误用）
REBUTTAL_RULES = {
    'bazi': '适用于完整八字（年/月/日/时），时辰缺失则不能断大运/流年',
    'ziwei': '需精确到时辰 + 出生地（真太阳时校准），时辰缺失影响宫位判断',
    'tcm': 'AI 仅作知识检索工具，不替代执业医师诊断；处方须由医生审定',
    'fengshui': '基于宅基/朝向，办公室与住宅规则有别；城市高层需结合峦头',
    'qimen': '择吉/用事需考虑用神；求财/求官/求医 取用不同',
    'liuyao': '需有完整卦象（含变卦/动爻），不能凭单爻断',
    'meihua': '体用关系需明确；时间起卦与方位起卦算法不同',
    'liuren': '四课三传完整才可断；天盘地盘错位则结论相反',
    'huajie': '建议仅供参考，不构成专业决定；不涉及医疗/法律/金融',
    'naming': '须结合生辰八字喜用神；不可仅凭音律美感',
    'minsu': '黄历因地区/流派差异，结果可能不同；重要事项请理性综合考量',
    'lifeplan': '人生规划需结合当下实际；AI 建议不能替代专业人生导师',
    'cross': '跨体系结论需多源验证；单一体系判断可靠性下降',
    'music': '五行音乐调理为辅助手段，不替代医学治疗',
    'lifeindex': '人生指数为综合评分模型，仅作参考；不可作为唯一决策依据',
    'r39_dual_core': '双核驱邪理论为派系总结；实际调理需结合个案八字喜忌',
    'r39_career_core': '官印财体系为命理抽象；现实事业决策需结合个人兴趣与市场环境',
    'r39_health_core': '五行脏腑为中医抽象映射；具体诊疗需经中医辨证，不替代医学诊断',
    'r39_palace_12': '紫微十二宫映射为传统模型；现代人事关系多源，不能单凭宫位判断',
    'r39_lifeplan_stage': '十年大运阶段为命理节奏；现实节奏受个人努力与环境变化影响',
}


def infer_scene(module, content):
    """推断适用场景"""
    m = (module or '').lower()
    return SCENE_MAP.get(m, '通用')


def extract_triggers(content, summary, tags):
    """提取触发词"""
    text = f"{summary or ''} {content or ''} {tags or ''}"
    triggers = []
    for pat, label in TRIGGER_PATTERNS:
        m = re.search(pat, text)
        if m:
            kw = m.group(1)
            if kw not in triggers:
                triggers.append(kw)
    # 兜底：从未命中规则时，取前 3 个中文 2 字组合
    if not triggers and summary:
        zh = re.findall(r'[\u4e00-\u9fff]{2,4}', summary)
        triggers = zh[:3]
    return triggers[:5]  # 最多 5 个


def infer_rebuttal(module):
    """推断反驳/边界"""
    m = (module or '').lower()
    return REBUTTAL_RULES.get(m, '仅供参考，重要事项请理性综合考量；不可作为专业决策依据')


def infer_counter_ex(module, confidence):
    """推断典型反例（基于置信度反向生成）"""
    if confidence >= 0.9:
        return f'反例少（trust={confidence:.2f}）；经典原文条目，反例主要在流派分歧'
    elif confidence >= 0.7:
        return f'中等可靠（trust={confidence:.2f}）；个别案例可能因地域/流派差异而结论不同'
    else:
        return f'低置信度（trust={confidence:.2f}）；仅作参考，建议交叉验证'


def build_fingerprint(row):
    """构造 6 维指纹"""
    module = row['module']
    content = row['content'] or ''
    summary = row['summary'] or ''
    tags = row['tags'] or ''
    confidence = row['confidence'] or 0.5
    version = row['version'] or 1

    return {
        'scene': infer_scene(module, content),
        'trigger': extract_triggers(content, summary, tags),
        'rebuttal': infer_rebuttal(module),
        'version': version,
        'confidence': round(confidence, 3),
        'counter_ex': infer_counter_ex(module, confidence),
        'enriched_at': datetime.now().isoformat(timespec='seconds'),
    }


def ensure_column(conn):
    """确保 fingerprint 列存在"""
    cols = [r[1] for r in conn.execute("PRAGMA table_info(formal_knowledge)").fetchall()]
    if 'fingerprint' not in cols:
        conn.execute("ALTER TABLE formal_knowledge ADD COLUMN fingerprint TEXT")
        conn.commit()
        print("✅ 新增 fingerprint 列")
    else:
        print("⏩ fingerprint 列已存在")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--force', action='store_true', help='强制重补已有 fingerprint')
    ap.add_argument('--limit', type=int, default=0, help='限制条数（测试用）')
    args = ap.parse_args()

    print(f"📚 KB 6 维指纹补齐（L1 感知层）")
    print(f"   数据库: {DB_PATH}")
    print(f"   模式: {'全量重补' if args.force else '增量补齐'}")
    print()

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    ensure_column(conn)

    # 拉取所有 KB 条目
    sql = "SELECT entry_id, module, content, summary, tags, confidence, version, fingerprint FROM formal_knowledge"
    if not args.force:
        sql += " WHERE fingerprint IS NULL OR fingerprint = ''"
    if args.limit:
        sql += f" LIMIT {args.limit}"

    rows = conn.execute(sql).fetchall()
    total = len(rows)
    print(f"📋 待补齐条目: {total}")

    if total == 0:
        print("✅ 全部条目已补齐指纹，无需操作")
        conn.close()
        return

    # 批量更新
    success = 0
    scene_counter = {}
    for row in rows:
        fp = build_fingerprint(row)
        try:
            conn.execute(
                "UPDATE formal_knowledge SET fingerprint = ? WHERE entry_id = ?",
                (json.dumps(fp, ensure_ascii=False), row['entry_id'])
            )
            success += 1
            s = fp['scene']
            scene_counter[s] = scene_counter.get(s, 0) + 1
        except Exception as e:
            print(f"  ❌ {row['entry_id']}: {e}")

    conn.commit()

    # 验证
    enriched_count = conn.execute("SELECT COUNT(*) FROM formal_knowledge WHERE fingerprint IS NOT NULL").fetchone()[0]
    total_count = conn.execute("SELECT COUNT(*) FROM formal_knowledge").fetchone()[0]
    print()
    print(f"✅ 补齐完成: {success}/{total}")
    print(f"📊 覆盖率: {enriched_count}/{total_count} = {enriched_count*100/total_count:.1f}%")
    print()
    print(f"📈 场景分布:")
    for scene, cnt in sorted(scene_counter.items(), key=lambda x: -x[1]):
        print(f"   {scene:12} : {cnt}")

    # 生成报告
    report_path = os.path.join(os.path.dirname(__file__), '.openclaw', 'tmp', 'kb-fingerprint-report.md')
    os.makedirs(os.path.dirname(report_path), exist_ok=True)
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(f"""# KB 6 维指纹补齐报告（L1 感知层）

- **生成时间**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
- **本轮补齐**: {success} 条
- **总覆盖率**: {enriched_count}/{total_count} = {enriched_count*100/total_count:.1f}%

## 6 维指纹定义

| 维度 | 字段 | 含义 |
|------|------|------|
| 1 | scene | 适用场景（八字/紫微/中医/风水/化解/通用） |
| 2 | trigger | 触发词（用户哪些提问命中此条） |
| 3 | rebuttal | 反驳/边界（避免误用） |
| 4 | version | 版本号 |
| 5 | confidence | 置信度 |
| 6 | counter_ex | 典型反例 |

## 场景分布

| 场景 | 条数 |
|------|------|
""")
        for scene, cnt in sorted(scene_counter.items(), key=lambda x: -x[1]):
            f.write(f"| {scene} | {cnt} |\n")

        # 抽样 5 条
        f.write("\n## 抽样示例（前 5 条）\n\n")
        samples = conn.execute(
            "SELECT entry_id, module, fingerprint FROM formal_knowledge WHERE fingerprint IS NOT NULL ORDER BY RANDOM() LIMIT 5"
        ).fetchall()
        for s in samples:
            fp = json.loads(s['fingerprint'])
            f.write(f"### {s['entry_id']} ({s['module']})\n")
            f.write(f"```json\n{json.dumps(fp, ensure_ascii=False, indent=2)}\n```\n\n")

    print(f"📄 报告已生成: {report_path}")

    conn.close()


if __name__ == '__main__':
    main()