#!/usr/bin/env python3
"""
generate-gold-cases.py · SFT 黄金 Case 批量生成器

从 KB + master_cases + consulting_records + paipan_records 四源提取高质量训练数据
目标：将 SFT 黄金 Case 从 11 条扩充到 200+ 条

输出格式对齐 sft-gold-cases/0001-hub-cases.jsonl
"""

import sqlite3
import json
import random
from pathlib import Path
from datetime import datetime

PROJECT_DIR = Path(__file__).resolve().parent.parent
DB_PATH = PROJECT_DIR / 'server' / 'database' / 'yidao.db'
OUT_DIR = PROJECT_DIR / 'training-data' / 'sft-gold-cases'

random.seed(42)  # 确定性

# ========== 模块 → 问题模板 ==========
MODULE_TEMPLATES = {
    'bazi': [
        ('八字中{keyword}是什么意思？', 'explain'),
        ('请解释八字中的{keyword}', 'explain'),
        ('{keyword}在八字命理中代表什么？', 'explain'),
        ('男命，日主{keyword}，事业运势如何？', 'apply'),
        ('女命，八字带{keyword}，对婚姻有什么影响？', 'apply'),
    ],
    'ziwei': [
        ('紫微斗数中{keyword}是什么？', 'explain'),
        ('紫微{keyword}入命宫代表什么？', 'apply'),
        ('请解释紫微斗数的{keyword}', 'explain'),
    ],
    'qimen': [
        ('奇门遁甲中{keyword}是什么意思？', 'explain'),
        ('奇门{keyword}的吉凶如何判断？', 'apply'),
    ],
    'fengshui': [
        ('风水中{keyword}是什么意思？', 'explain'),
        ('家居风水{keyword}如何化解？', 'apply'),
    ],
    'liuyao': [
        ('六爻预测中{keyword}代表什么？', 'explain'),
        ('六爻{keyword}的断卦要点是什么？', 'apply'),
    ],
    'meihua': [
        ('梅花易数中{keyword}如何理解？', 'explain'),
        ('梅花{keyword}的体用关系怎么分析？', 'apply'),
    ],
    'liuren': [
        ('大六壬中{keyword}是什么意思？', 'explain'),
        ('六壬{keyword}的课格如何判断？', 'apply'),
    ],
    'tcm': [
        ('中医{keyword}是什么意思？', 'explain'),
        ('{keyword}的中医辨证要点是什么？', 'apply'),
    ],
    'tcm-diagnosis': [
        ('中医诊断中{keyword}如何判断？', 'explain'),
        ('{keyword}在舌诊中代表什么？', 'apply'),
    ],
    'tcm-fangji': [
        ('{keyword}这个方剂的组成和功效是什么？', 'explain'),
        ('{keyword}适用于什么症状？', 'apply'),
    ],
    'huangdi-neijing': [
        ('《黄帝内经》中{keyword}的核心思想是什么？', 'explain'),
        ('《内经》如何论述{keyword}？', 'explain'),
    ],
    'shanghan-lun': [
        ('《伤寒论》中{keyword}的辨证要点是什么？', 'explain'),
        ('伤寒论{keyword}方如何运用？', 'apply'),
    ],
    'huangli': [
        ('黄历中{keyword}是什么意思？', 'explain'),
        ('{keyword}日适合做什么？', 'apply'),
    ],
    'taisui': [
        ('太岁{keyword}是什么意思？', 'explain'),
        ('犯太岁{keyword}如何化解？', 'apply'),
    ],
    'wuxing': [
        ('五行中{keyword}的特性是什么？', 'explain'),
        ('{keyword}在五行生克中代表什么？', 'explain'),
    ],
    'xingming': [
        ('姓名学中{keyword}有什么讲究？', 'explain'),
        ('起名时{keyword}如何运用？', 'apply'),
    ],
    'zeri': [
        ('择日中{keyword}如何判断？', 'explain'),
        ('{keyword}日适合做什么？', 'apply'),
    ],
    'yanzhi': [
        ('面相中{keyword}代表什么？', 'explain'),
        ('{keyword}的面相特征如何解读？', 'apply'),
    ],
    'faith': [
        ('佛教中{keyword}是什么意思？', 'explain'),
        ('{keyword}在修行中的意义是什么？', 'apply'),
    ],
    'mantra': [
        ('{keyword}咒语的功德是什么？', 'explain'),
        ('如何修持{keyword}？', 'apply'),
    ],
    'classics': [
        ('{keyword}出自哪部典籍？核心内容是什么？', 'explain'),
    ],
    'yijing': [
        ('《易经》中{keyword}是什么意思？', 'explain'),
        ('{keyword}卦的象义如何理解？', 'apply'),
    ],
    'shuhan': [
        ('舒涵老师说{keyword}是什么意思？', 'explain'),
        ('请解读舒涵命理中的{keyword}', 'explain'),
        ('舒涵案例中{keyword}的命理含义是什么？', 'apply'),
    ],
    'acupuncture': [
        ('{keyword}穴位的定位和功效是什么？', 'explain'),
        ('针灸{keyword}适用于什么症状？', 'apply'),
        ('请介绍针灸中{keyword}的配伍方法', 'explain'),
    ],
    'koujue-daily': [
        ('命理口诀中{keyword}怎么理解？', 'explain'),
        ('{keyword}这口诀在实战中怎么用？', 'apply'),
        ('请解释口诀{keyword}的核心要点', 'explain'),
    ],
    'tcm-classical': [
        ('中医经典中{keyword}的核心论述是什么？', 'explain'),
        ('{keyword}在中医经典中如何阐述？', 'explain'),
        ('经典中{keyword}对临床的指导意义是什么？', 'apply'),
    ],
    'nihaixia-yian': [
        ('倪海厦医案中{keyword}的诊治思路是什么？', 'explain'),
        ('倪师{keyword}医案的辨证要点是什么？', 'apply'),
        ('请解读倪海厦{keyword}医案', 'explain'),
    ],
    'wangzhen': [
        ('望诊中{keyword}有什么表现特征？', 'explain'),
        ('{keyword}在望诊中如何判断？', 'apply'),
        ('中医望诊的{keyword}怎么看？', 'explain'),
    ],
    'jinkui-yaolue': [
        ('《金匮要略》中{keyword}怎么论述？', 'explain'),
        ('金匮{keyword}的辨证要点是什么？', 'apply'),
        ('请解释《金匮要略》中{keyword}的方证', 'explain'),
    ],
    'zodiac': [
        ('{keyword}生肖今年的运势如何？', 'explain'),
        ('生肖{keyword}在命理中代表什么？', 'explain'),
        ('{keyword}生肖的人事业运怎样？', 'apply'),
    ],
    'shennong-bencao': [
        ('神农本草经中{keyword}的药性是什么？', 'explain'),
        ('{keyword}在本草经中如何记载？', 'explain'),
        ('神农本草经中{keyword}的临床应用是什么？', 'apply'),
    ],
    'tianji-jiangjie': [
        ('天机讲解中{keyword}的核心内容是什么？', 'explain'),
        ('{keyword}在天机体系中如何理解？', 'explain'),
        ('请解读天机{keyword}的命理含义', 'apply'),
    ],
    'tianji-mingli': [
        ('天机命理中{keyword}怎么看？', 'explain'),
        ('{keyword}在天机命理中的吉凶如何判断？', 'apply'),
        ('请解释天机命理{keyword}的原理', 'explain'),
    ],
    'lifeplan': [
        ('人生规划中{keyword}阶段应该注意什么？', 'explain'),
        ('{keyword}在人生规划中如何安排？', 'apply'),
        ('命理角度看{keyword}的人生规划建议', 'explain'),
    ],
}

# ========== 合规红线检查 ==========
COMPLIANCE_FORBIDDEN = [
    '一定', '绝对', '命中注定', '必死', '必灾', '必凶',
    '癌症', '肿瘤', '艾滋', '死刑', '死期',
    '你注定', '命中犯', '天煞孤星',
]

def check_compliance(response):
    """返回 (ok, violations)"""
    violations = []
    for word in COMPLIANCE_FORBIDDEN:
        if word in response:
            violations.append(word)
    return len(violations) == 0, violations

# ========== 模板化回复 ==========
def make_response_explain(entry):
    """知识解释型回复"""
    title = entry['title']
    content = entry['content']
    module = entry['module']
    src = entry.get('src_id', '典籍')
    
    # 截取前 300 字内容
    if len(content) > 300:
        content = content[:300] + '...'
    
    response = f"## {title}\n\n{content}\n\n## 来源\n\n此内容来自知识库条目（{src}），仅供学习参考，不构成专业建议。"
    
    # 合规检查
    response = response.replace('一定', '通常').replace('绝对', '一般')
    
    return response

def make_response_apply(entry):
    """应用指导型回复"""
    title = entry['title']
    content = entry['content']
    module = entry['module']
    
    if len(content) > 250:
        content = content[:250] + '...'
    
    response = f"## 分析\n\n根据{title}的原理：{content}\n\n## 建议\n\n1. 结合个人八字具体分析，不可一概而论\n2. 建议咨询专业命理师进行详细排盘\n3. 以上内容来自知识库，仅供学习参考\n\n## 注意\n\n命理分析需综合考虑全局，单一因素不能决定吉凶。重要事项请理性综合考量。"
    
    return response

def generate_cases_from_kb():
    """从 KB 生成黄金 Case（R475: fingerprint 去重 — 同 fp 只取 trust 最高条目）"""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    
    cases = []
    case_id = 3000  # 从 3000 开始避免和现有冲突
    seen_fps = set()  # R475: fingerprint 去重
    
    for module, templates in MODULE_TEMPLATES.items():
        cur.execute("""
            SELECT entry_id, module, title, content, src_id, trust_score, category, keywords,
                   fingerprint
            FROM kb_formal
            WHERE module = ? AND trust_score >= 0.7 AND status = 'formal'
            ORDER BY trust_score DESC, hit_count DESC
            LIMIT 40
        """, (module,))
        entries = cur.fetchall()
        
        if not entries:
            continue
        
        for entry in entries:
            entry = dict(entry)
            
            # R475: 同 fingerprint 只取第一条（trust 最高的）
            fp = entry.get('fingerprint', '')
            if fp and fp != '0|0|0|0|0|0|0':
                if fp in seen_fps:
                    continue
                seen_fps.add(fp)
            title = entry['title']
            
            # 跳过过短或加密内容
            if len(entry['content']) < 20 or entry['content'].startswith('enc:'):
                continue
            
            template, mode = random.choice(templates)
            instruction = template.format(keyword=title)
            
            if mode == 'explain':
                response = make_response_explain(entry)
            else:
                response = make_response_apply(entry)
            
            # 合规检查
            ok, violations = check_compliance(response)
            if not ok:
                continue
            
            # 解析 keywords
            try:
                tags = json.loads(entry.get('keywords', '[]'))
            except:
                tags = [module]
            tags = tags[:5]
            if module not in tags:
                tags.insert(0, module)
            
            case = {
                'id': f'sft-{case_id:04d}',
                'category': entry.get('category', module),
                'subcategory': title,
                'difficulty': random.choice(['简单', '中等']),
                'instruction': instruction,
                'context': f'KB source: {entry["entry_id"]}, trust: {entry["trust_score"]}',
                'response': response,
                'source': f'KB-{entry["entry_id"]}',
                'rating': 'gold',
                'tags': tags,
            }
            cases.append(case)
            case_id += 1
            
            if len(cases) >= 350:
                break
        if len(cases) >= 350:
            break
    
    conn.close()
    
    # R475: 输出 fingerprint 去重统计
    print(f"[R475] fingerprint \u53bb\u91cd\uff1a\u5df2\u7528 {len(seen_fps)} \u4e2a unique fp\uff0c\u751f\u6210 {len(cases)} \u6761 case")
    
    return cases

def generate_cases_from_master_cases():
    """从 master_cases 表生成实践型 Case"""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    
    cases = []
    case_id = 5000
    
    cur.execute("""
        SELECT case_number, bazi_chart, wuxing_summary, symptoms, constitution,
               master_analysis, analysis_summary, doctor_diagnosis, quality_score,
               is_high_quality, effectiveness_rating
        FROM master_cases
        WHERE status = 'completed' AND is_high_quality = 1
        LIMIT 20
    """)
    
    for row in cur.fetchall():
        row = dict(row)
        try:
            chart = json.loads(row['bazi_chart'])
        except:
            continue
        
        gender = '男命' if chart.get('gender') == 'male' else '女命'
        year = chart.get('year', '未知')
        
        instruction = f"{gender}{year}年生，体质：{row.get('constitution', '未知')}，症状：{row.get('symptoms', '未知')}，请分析。"
        
        # 构建回复
        summary = row.get('analysis_summary') or row.get('doctor_diagnosis') or row.get('wuxing_summary', '')
        if not summary or len(summary) < 10:
            continue
        
        response = f"## 体质分析\n\n{row.get('wuxing_summary', '未知')}\n\n## 症状\n\n{row.get('symptoms', '未知')}\n\n## 诊断思路\n\n{summary}\n\n## 调理建议\n\n1. 结合体质特征进行针对性调理\n2. 建议面诊专业中医师\n3. 以上分析来自案例库，仅供学习参考\n\n## 注意\n\n中医辨证需四诊合参，不可仅凭八字推断。"
        
        ok, _ = check_compliance(response)
        if not ok:
            continue
        
        case = {
            'id': f'sft-{case_id:04d}',
            'category': '中医辨证',
            'subcategory': row.get('constitution', '综合'),
            'difficulty': '中等',
            'instruction': instruction,
            'context': f'Case: {row["case_number"]}, quality: {row.get("quality_score", "N/A")}',
            'response': response,
            'source': f'master-case-{row["case_number"]}',
            'rating': 'gold',
            'tags': ['中医', '体质', row.get('constitution', '')],
        }
        cases.append(case)
        case_id += 1
    
    conn.close()
    return cases

def generate_cases_from_consulting():
    """从 consulting_records 生成案例型 Case"""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    
    cases = []
    case_id = 6000
    
    cur.execute("""
        SELECT guest_name, birth_year, birth_month, birth_day, birth_hour,
               gender, focus_area, risk_level, risk_score, hua_ji_star, hits_json
        FROM consulting_records
        LIMIT 20
    """)
    
    for row in cur.fetchall():
        row = dict(row)
        gender = '男' if row['gender'] == 'M' else '女'
        
        instruction = f"{row['birth_year']}年{row['birth_month']}月{row['birth_day']}日{row['birth_hour']}时出生的{gender}命，关注{row['focus_area']}方面，请分析。"
        
        # 构建回复
        try:
            hits = json.loads(row.get('hits_json', '[]'))
        except:
            hits = []
        
        hits_text = '；'.join([f"{h.get('name', '未知')}（{h.get('severity', '未知')}）" for h in hits]) if hits else '无明显风险信号'
        
        response = f"## 基本信息确认\n\n出生：{row['birth_year']}年{row['birth_month']}月{row['birth_day']}日{row['birth_hour']}时\n性别：{gender}\n关注：{row['focus_area']}\n\n## 风险评估\n\n风险等级：{row['risk_level']}\n化忌星：{row.get('hua_ji_star', '无')}\n关注领域：{hits_text}\n\n## 分析方向\n\n1. 结合八字四柱分析{row['focus_area']}领域的倾向\n2. 化忌星提示需要注意的方面\n3. 建议结合实际生活状况综合判断\n\n## 注意\n\n以上分析来自咨询记录库，仅供学习参考，不构成专业诊断。"
        
        ok, _ = check_compliance(response)
        if not ok:
            continue
        
        case = {
            'id': f'sft-{case_id:04d}',
            'category': '健康咨询',
            'subcategory': row['focus_area'],
            'difficulty': '中等',
            'instruction': instruction,
            'context': f'Guest: {row["guest_name"]}, risk: {row["risk_level"]}',
            'response': response,
            'source': f'consulting-{row["guest_name"]}',
            'rating': 'gold',
            'tags': ['咨询', row['focus_area'], row.get('hua_ji_star', '')],
        }
        cases.append(case)
        case_id += 1
    
    conn.close()
    return cases

def generate_dpo_cases(sft_cases):
    """从 SFT Case 生成 DPO 偏好对"""
    dpo_cases = []
    dpo_id = 100
    
    # 选取前 30 个 case 生成 DPO
    for case in sft_cases[:30]:
        chosen_response = case['response']
        
        # 构造 rejected（常见错误模式）
        reject_patterns = [
            # 模式1：宿命论
            chosen_response[:50] + '这是命中注定的，无法改变。建议多烧香拜佛化解。',
            # 模式2：过度绝对
            chosen_response[:50] + '你一定会遇到大灾，必须立即化解，否则后果不堪设想。',
            # 模式3：缺乏依据
            chosen_response[:50] + '根据我的经验，这种情况就是不好，没什么好说的。',
        ]
        
        rejected_response = random.choice(reject_patterns)
        
        dpo = {
            'id': f'dpo-{dpo_id:04d}',
            'prompt': case['instruction'],
            'chosen': {
                'response': chosen_response[:200] + '...' if len(chosen_response) > 200 else chosen_response,
                'source': case['source'],
                'score': 1,
            },
            'rejected': {
                'response': rejected_response,
                'source': 'hallucinated-v2',
                'score': -1,
                '__compliance_intentional__': True,
            },
            'reason': 'chosen 引用 KB 有据可循；rejected 含禁止用语（宿命论/绝对化/无依据）',
        }
        dpo_cases.append(dpo)
        dpo_id += 1
    
    return dpo_cases


def main():
    print("[gold-cases] 开始生成 SFT 黄金 Case...")
    
    # 1. 从 KB 生成
    kb_cases = generate_cases_from_kb()
    print(f"[gold-cases] KB 来源：{len(kb_cases)} 条")
    
    # 2. 从 master_cases 生成
    mc_cases = generate_cases_from_master_cases()
    print(f"[gold-cases] master_cases 来源：{len(mc_cases)} 条")
    
    # 3. 从 consulting_records 生成
    cr_cases = generate_cases_from_consulting()
    print(f"[gold-cases] consulting_records 来源：{len(cr_cases)} 条")
    
    # 合并去重（按 instruction 去重）
    all_cases = kb_cases + mc_cases + cr_cases
    seen = set()
    unique_cases = []
    for c in all_cases:
        key = c['instruction'][:50]
        if key not in seen:
            seen.add(key)
            unique_cases.append(c)
    
    print(f"[gold-cases] 去重后：{len(unique_cases)} 条")
    
    # 4. 从 SFT 生成 DPO
    dpo_cases = generate_dpo_cases(unique_cases)
    print(f"[gold-cases] DPO 偏好对：{len(dpo_cases)} 条")
    
    # 5. 写文件
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # SFT 黄金 Case
    sft_file = OUT_DIR / '0003-kb-master-generated.jsonl'
    with open(sft_file, 'w', encoding='utf-8') as f:
        for case in unique_cases:
            f.write(json.dumps(case, ensure_ascii=False) + '\n')
    print(f"[gold-cases] SFT 输出：{sft_file} ({len(unique_cases)} 条)")
    
    # DPO
    dpo_file = PROJECT_DIR / 'training-data' / 'preference' / '0002-dpo-from-generated.jsonl'
    dpo_file.parent.mkdir(parents=True, exist_ok=True)
    with open(dpo_file, 'w', encoding='utf-8') as f:
        for case in dpo_cases:
            f.write(json.dumps(case, ensure_ascii=False) + '\n')
    print(f"[gold-cases] DPO 输出：{dpo_file} ({len(dpo_cases)} 条)")
    
    # 统计
    print(f"\n[gold-cases] === 汇总 ===")
    print(f"  SFT 黄金 Case（新增）：{len(unique_cases)} 条")
    print(f"  DPO 偏好对（新增）：{len(dpo_cases)} 条")
    print(f"  SFT 总计（含原有 11 + 261 + 232）：{11 + 261 + 232 + len(unique_cases)} 条")
    print(f"  DPO 总计（含原有 10）：{10 + len(dpo_cases)} 条")


if __name__ == '__main__':
    main()
