#!/usr/bin/env python3
"""
distill-tcm-agent-engines.py V2 — 从 tcm-agent 蒸馏医学能力到 mingli-baojian

提取策略：
  1. 直接 require() 引擎模块获取数据对象
  2. 正则提取 engine 代码中的知识常量
  3. 合成 ChatML 训练对

蒸馏范围：tcm-agent 全部 32 个引擎中的知识型数据
输出：training-data/sft-tcm-engine-distill.jsonl
"""

import json, re, os, sys, subprocess
from pathlib import Path

TCM_AGENT = Path(__file__).resolve().parent.parent.parent / 'tcm-agent'
MBJ = Path(__file__).resolve().parent.parent.parent / 'mingli-baojian'
OUT = MBJ / 'training-data' / 'sft-tcm-engine-distill.jsonl'

TCM_SYSTEM = """你是中医辅助诊疗智能体，依托中医经典知识库（伤寒论、金匮要略、黄帝内经、神农本草经、倪海厦人纪等）与现代医学知识融合，为执业中医师提供辅助参考。
最高合规铁律：所有分析仅为AI辅助参考，绝对不能等同于执业医师临床诊断，不允许独立确诊疾病、不擅自开具药物与治疗方案。出现危重体征优先提示寻求专业医疗救助。"""

TCM_SYSTEM_SAFE = TCM_SYSTEM + "\n【安全边界】处方禁忌校验、剂量安全、人群禁忌均为AI辅助参考，必须由执业医师审核确认。"

def node_eval(expr, cwd):
    """Run a node expression and return stdout"""
    try:
        r = subprocess.run(
            ['node', '-e', expr],
            cwd=cwd, capture_output=True, text=True, timeout=10
        )
        return r.stdout.strip()
    except Exception as e:
        return f"ERROR: {e}"

def make_chat(system, user, assistant, module="tcm_engines"):
    return {
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
            {"role": "assistant", "content": assistant}
        ],
        "source": "distill-tcm-agent-v2",
        "module": module,
        "distilled_at": "2026-08-09"
    }

pairs = []

# ═══════════════════════════════════════════
# 1. SYNDROME ENGINE — 多流派辨证
# ═══════════════════════════════════════════
SYSTEM_SYNDROME = """你是中医辨证推理专家。基于四诊信息，运用伤寒派、温病派、扶阳派、脾胃派、火神派五流派并列辨证，给出方证对应。所有分析仅为AI辅助参考，不等同于执业医师诊断。"""

# Extract CLASSICS from syndrome-engine
syndrome_code = (TCM_AGENT / 'server/engines/syndrome-engine.js').read_text()
classics_m = re.search(r'const CLASSICS\s*=\s*(\{[\s\S]*?\n\});', syndrome_code)
if classics_m:
    try:
        classics = json.loads(classics_m.group(1))
        for school, info in classics.items():
            keywords = ', '.join(info.get('keywords', []))
            pairs.append(make_chat(
                SYSTEM_SYNDROME,
                f"请介绍{school}派的核心辨证要点和代表性方剂。",
                f"【{info['name']}】（{info['author']}）\n"
                f"辨证关键词：{keywords}\n"
                f"权重系数：{info['weight']}\n"
                f"核心思路：{info['name']}以{info['keywords'][0]}为核心辨证纲领，"
                f"通过{', '.join(info['keywords'][:3])}等维度进行辨证分型，指导方剂选择与剂量调整。",
                module="syndrome-engine"
            ))
    except json.JSONDecodeError as e:
        print(f"  [warn] CLASSICS parse failed: {e}")

# Extract CONTRAINDICATION_RULES
ci_m = re.search(r'CONTRAINDICATION_RULES\s*=\s*(\{[\s\S]*?\n\};)', syndrome_code)
if ci_m:
    try:
        ci = json.loads(ci_m.group(1))
        pairs.append(make_chat(
            SYSTEM_SYNDROME + "\n\n【禁忌规则】处方时必须交叉校验禁忌，发现禁忌立即标注。",
            "处方前需要校验哪些禁忌？请列出禁忌检查清单。",
            "处方禁忌校验清单（必须逐项检查）：\n"
            + "\n".join([f"- {k}: {', '.join(v)}" for k, v in ci.items()]),
            module="syndrome-engine"
        ))
    except:
        pass

# Extract DIAGNOSIS_FORMULA_WEIGHTS
dfw_m = re.search(r'DIAGNOSIS_FORMULA_WEIGHTS\s*=\s*(\{[\s\S]*?\n\};)', syndrome_code)
if dfw_m:
    try:
        dfw = json.loads(dfw_m.group(1))
        pairs.append(make_chat(
            SYSTEM_SYNDROME,
            "不同证型的方剂权重如何计算？",
            "方剂权重计算规则：\n"
            + "\n".join([f"- {k}: 权重 {v}" for k, v in dfw.items()]),
            module="syndrome-engine"
        ))
    except:
        pass

print(f"  syndrome-engine: {len([p for p in pairs if p['module']=='syndrome-engine'])} pairs")

# ═══════════════════════════════════════════
# 2. CLASSICS ENGINE — 经典引用
# ═══════════════════════════════════════════
SYSTEM_CLASSICS = """你是中医典籍引用专家。准确引用《伤寒论》《金匮要略》《黄帝内经》《神农本草经》《温病条辨》《脾胃论》等经典原文，标注出处、篇章、置信度。所有分析仅为AI辅助参考。"""

classics_code = (TCM_AGENT / 'server/engines/classics-engine.js').read_text()
ckb_m = re.search(r'CLASSICS_KB\s*=\s*(\{[\s\S]*?\n\});', classics_code)
if ckb_m:
    try:
        ckb = json.loads(ckb_m.group(1))
        formulas = ckb.get('formulas', {})
        syndromes = ckb.get('syndromes', {})
        herbs = ckb.get('herbs', {})
        
        for name, info in formulas.items():
            pairs.append(make_chat(
                SYSTEM_CLASSICS,
                f"请引用{name}的经典出处和原文。",
                f"【{name}】\n出处：{info['source']}\n原文：{info['text']}\n注：AI 仅作为知识检索工具，不替您下诊断。",
                module="classics-engine"
            ))
        
        for name, info in syndromes.items():
            pairs.append(make_chat(
                SYSTEM_CLASSICS,
                f"请介绍{name}的辨证要点和经典出处。",
                f"【{name}】\n出处：{info.get('source', '经典')}\n特征：{info.get('description', info.get('text', ''))}\n鉴别要点：{', '.join(info.get('distinguishing_features', info.get('distinguish', [])))}",
                module="classics-engine"
            ))
        
        for name, info in list(herbs.items())[:15]:
            pairs.append(make_chat(
                SYSTEM_CLASSICS,
                f"请介绍中药{name}的性味归经和功效。",
                f"【{name}】\n出处：{info.get('source', '本草')}\n性味：{info.get('nature', '')} {info.get('flavor', '')}\n归经：{info.get('meridian', '')}\n功效：{info.get('effect', info.get('efficacy', ''))}\n用法用量：{info.get('dosage', '')}",
                module="classics-engine"
            ))
    except json.JSONDecodeError as e:
        print(f"  [warn] CLASSICS_KB parse failed: {e}")

print(f"  classics-engine: {len([p for p in pairs if p['module']=='classics-engine'])} pairs")

# ═══════════════════════════════════════════
# 3. DRUG SAFETY ENGINE — 用药安全
# ═══════════════════════════════════════════
SYSTEM_SAFETY = """你是中药用药安全专家。掌握十八反、十九畏、妊娠禁忌、证候禁忌、用量警戒、人群禁忌。处方前必须完成禁忌校验，发现冲突立即标注。所有分析仅为AI辅助参考。"""

drug_code = (TCM_AGENT / 'server/engines/drug-safety-engine.js').read_text()
safety_m = re.search(r'const TCM_SAFETY\s*=\s*(\{[\s\S]*?\n\});', drug_code)
if safety_m:
    try:
        safety = json.loads(safety_m.group(1))
        
        # Eighteen Antagonism
        ea = safety.get('eighteenAntagonism', {})
        if ea:
            pairs.append(make_chat(
                SYSTEM_SAFETY,
                "中药十八反是什么？请完整列出所有相反配伍。",
                "【十八反】（相反配伍禁忌）：\n"
                + "\n".join([f"- {k} 反 {', '.join(v)}" for k, v in ea.items()])
                + "\n\n注：十八反为中药配伍禁忌核心规则，处方时必须交叉校验。",
                module="drug-safety-engine"
            ))
        
        # Nineteen Fear
        nf = safety.get('nineteenFear', {})
        if nf:
            pairs.append(make_chat(
                SYSTEM_SAFETY,
                "中药十九畏是什么？请完整列出所有相畏配伍。",
                "【十九畏】（相畏配伍禁忌）：\n"
                + "\n".join([f"- {k} 畏 {', '.join(v)}" for k, v in nf.items()])
                + "\n\n注：十九畏为中药相畏配伍规则，处方时需注意。",
                module="drug-safety-engine"
            ))
        
        # Pregnancy
        pg = safety.get('pregnancyForbidden', safety.get('pregnancyContraindications', {}))
        if pg:
            pairs.append(make_chat(
                SYSTEM_SAFETY + "\n\n【妊娠禁忌】孕妇禁用/慎用药物清单。",
                "哪些中药在妊娠期间禁用或慎用？",
                "【妊娠禁忌药物分类】：\n"
                + "\n".join([f"- {k}: {', '.join(v)}" for k, v in pg.items()])
                + "\n\n注：妊娠用药需格外谨慎，建议由执业中医师判断。",
                module="drug-safety-engine"
            ))
        
        # Toxic limits
        tl = safety.get('toxicLimit', {})
        if tl:
            pairs.append(make_chat(
                SYSTEM_SAFETY + "\n\n【用量警戒】毒性药物的安全剂量上限。",
                "中药毒性药物的用量警戒线是多少？",
                "【毒性药物用量警戒】\n"
                + "\n".join([f"- {k}: {v}" for k, v in tl.items()])
                + "\n\n注：超过警戒线必须由执业医师评估后方可使用。",
                module="drug-safety-engine"
            ))
        
        # Absolute contraindications
        abs_c = safety.get('absolute', {})
        if abs_c:
            pairs.append(make_chat(
                SYSTEM_SAFETY,
                "哪些情况是中药处方的绝对禁忌？",
                "【中药绝对禁忌】：\n"
                + "\n".join([f"- {k}: {', '.join(v)}" for k, v in abs_c.items()]),
                module="drug-safety-engine"
            ))
        
        # Caution drugs
        caution = safety.get('caution', {})
        if caution:
            pairs.append(make_chat(
                SYSTEM_SAFETY,
                "哪些药物需要特别注意（慎用）？",
                "【中药慎用药物】：\n"
                + "\n".join([f"- {k}: {', '.join(v)}" for k, v in caution.items()]),
                module="drug-safety-engine"
            ))
        
        # Elderly/children
        for group, key in [('老年人', 'elderlyCaution'), ('儿童', 'childrenCaution')]:
            gc = safety.get(key, {})
            if gc:
                pairs.append(make_chat(
                    SYSTEM_SAFETY,
                    f"给{group}开中药处方需要注意什么？",
                    f"【{group}用药注意】：\n"
                    + "\n".join([f"- {k}: {', '.join(v)}" for k, v in gc.items()]),
                    module="drug-safety-engine"
                ))
    except json.JSONDecodeError as e:
        print(f"  [warn] TCM_SAFETY parse failed: {e}")

print(f"  drug-safety-engine: {len([p for p in pairs if p['module']=='drug-safety-engine'])} pairs")

# ═══════════════════════════════════════════
# 4. DOSAGE ENGINE — 个性化剂量
# ═══════════════════════════════════════════
SYSTEM_DOSAGE = """你是中药剂量计算专家。根据患者体重、体质、年龄、肝肾功能、合并症等因素，计算个性化剂量。掌握成人基准剂量、儿童剂量调整、毒性药警戒线。所有分析仅为AI辅助参考。"""

dosage_code = (TCM_AGENT / 'server/engines/dosage-engine.js').read_text()

adult_m = re.search(r'ADULT_BASE\s*=\s*(\{[^}]+\})', dosage_code)
child_m = re.search(r'CHILD_BASE\s*=\s*(\{[^}]+\})', dosage_code)
if adult_m and child_m:
    try:
        adult = json.loads(adult_m.group(1))
        child = json.loads(child_m.group(1))
        pairs.append(make_chat(
            SYSTEM_DOSAGE,
            "中药成人基准剂量和儿童剂量范围是多少？如何根据患者情况调整？",
            f"【成人基准剂量】：{adult['min']}~{adult['max']}g/味\n"
            f"【儿童基准剂量】：{child['min']}~{child['max']}g/味\n\n"
            "个性化剂量调整因素（按优先级）：\n"
            "1. 体重：每增加10kg，剂量递增5%~10%（上限不超过成人基准）\n"
            "2. 体质：虚弱体质减量20%~30%，强壮体质可适当增量\n"
            "3. 年龄：儿童按体重/体表面积折算，老年人减量15%~25%\n"
            "4. 肝肾功能：异常者减量30%~50%，避免使用毒性药物\n"
            "5. 合并症：高血压/糖尿病等需调整活血/补益类药物剂量\n"
            "6. 毒性药物：如附子、乌头、马钱子等须严格控制在安全范围内\n\n"
            "注：AI 仅为辅助参考，实际剂量由执业医师根据临床判断决定。",
            module="dosage-engine"
        ))
    except:
        pass

# Extract dosage functions logic
func_pattern = re.findall(r'function\s+(\w+)\s*\(([^)]*)\)\s*\{([\s\S]*?)(?=\n\s*function|\n\s*\})', dosage_code)
for fname, params, body in func_pattern[:5]:
    body_clean = body.strip()[:500]
    pairs.append(make_chat(
        SYSTEM_DOSAGE,
        f"中药剂量计算中，{fname} 函数的作用是什么？如何计算？",
        f"【{fname} 剂量算法】\n"
        f"参数：{params or '无'}\n"
        f"算法逻辑：\n{body_clean}\n\n"
        f"注：此算法仅为AI辅助参考，实际处方剂量由执业医师确定。",
        module="dosage-engine"
    ))

print(f"  dosage-engine: {len([p for p in pairs if p['module']=='dosage-engine'])} pairs")

# ═══════════════════════════════════════════
# 5. COMPLIANCE ENGINE — 合规边界
# ═══════════════════════════════════════════
compliance_code = (TCM_AGENT / 'server/engines/compliance-engine.js').read_text()
reg_m = re.search(r'const REGULATIONS\s*=\s*(\{[\s\S]*?\n\});', compliance_code)
if reg_m:
    try:
        regs = json.loads(reg_m.group(1))
        reg_text = "\n".join([f"- {k} ({v['name']}): {v['basis']}" for k, v in regs.items()])
        pairs.append(make_chat(
            "你是中医AI合规专家。明确AI辅助诊断的边界：不可独立确诊、不可独立开处方、不可替代执业医师判断。必须标注AI辅助性质，发现危重体征立即提示就医。",
            "中医AI辅助诊断需要遵守哪些合规法规？",
            "【中医AI辅助诊断 — 合规法规】\n\n"
            "必须遵守的法规框架：\n"
            + reg_text
            + "\n\n核心原则：\n"
            "- 知情同意：患者须知悉AI参与诊疗过程\n"
            "- 最小必要：仅采集诊疗必需数据\n"
            "- 可解释性：AI建议须有依据可追溯\n"
            "- 人工审核：所有AI建议须经执业医师审核确认\n"
            "- 数据安全：健康数据须加密存储与传输\n\n"
            "注：AI辅助诊断不等于临床诊断，最终责任在执业医师。",
            module="compliance-engine"
        ))
    except:
        pass

# Extract compliance rules
func_matches = re.findall(r'function\s+(\w+)\s*\([^)]*\)\s*\{([\s\S]*?)(?=\n\s*function|\n\s*\})', compliance_code)
for fname, body in func_matches[:3]:
    pairs.append(make_chat(
        "你是中医AI合规专家。",
        f"compliance-engine 中的 {fname} 函数实现了什么合规检查？",
        f"【{fname} 合规检查】\n算法逻辑：\n{body.strip()[:400]}",
        module="compliance-engine"
    ))

print(f"  compliance-engine: {len([p for p in pairs if p['module']=='compliance-engine'])} pairs")

# ═══════════════════════════════════════════
# 6. CHRONIC DISEASE ENGINE — 慢病管理
# ═══════════════════════════════════════════
SYSTEM_CHRONIC = """你是中医慢病管理专家。针对高血压、糖尿病、失眠、慢性阻塞性肺疾病，结合中医体质辨识与辨证论治，制定长期管理方案。所有建议仅为AI辅助参考。"""

chronic_code = (TCM_AGENT / 'server/engines/chronic-disease-engine.js').read_text()
cd_m = re.search(r'const CHRONIC_DISEASES\s*=\s*(\{[\s\S]*?\n\};)', chronic_code)
if cd_m:
    try:
        cd = json.loads(cd_m.group(1))
        for code, disease in cd.items():
            name = disease.get('name', code)
            aliases = ', '.join(disease.get('aliases', []))
            dept = disease.get('department', '')
            patterns = disease.get('patternProfile', [])
            med_schedule = disease.get('medSchedule', [])
            lifestyle = disease.get('lifestyleGuide', {})
            
            # Main disease overview
            pairs.append(make_chat(
                SYSTEM_CHRONIC,
                f"{name}（{aliases}）的中医辨证要点和管理方案是什么？",
                f"【{name} · 中医管理概览】\n"
                f"别名：{aliases}\n"
                f"科室：{dept}\n"
                f"辨证分型（共{len(patterns)}型）：\n"
                + "\n".join([f"  {i+1}. {p['syndrome']}（{p.get('formula','')}）" for i, p in enumerate(patterns)])
                + "\n\n注：具体辨证需执业医师结合四诊信息判断。",
                module="chronic-disease-engine"
            ))
            
            # Each pattern detail
            for p in patterns:
                pairs.append(make_chat(
                    SYSTEM_CHRONIC,
                    f"{name}的{p['syndrome']}证型如何辨证？用什么方剂？",
                    f"【{name} → {p['syndrome']}证】\n"
                    f"优先级：{p.get('priority', '?')}\n"
                    f"主症：{', '.join(p.get('mainSymptoms', []))}\n"
                    f"舌象：{p.get('tongue', '')}\n"
                    f"脉象：{p.get('pulse', '')}\n"
                    f"证候评分：{p.get('score', '?')}\n"
                    f"代表方剂：{p.get('formula', '')}\n"
                    f"用药：{p.get('herbs', '')}\n"
                    f"生活调护：{p.get('tcmAdvice', '')}",
                    module="chronic-disease-engine"
                ))
            
            # Med schedule
            if med_schedule:
                pairs.append(make_chat(
                    SYSTEM_CHRONIC,
                    f"{name}的用药时间安排和注意事项？",
                    f"【{name}用药时间表】\n"
                    + "\n".join([f"- {m['time']}：{m['drug']}（{m['type']}）\n  注意：{m['note']}" for m in med_schedule]),
                    module="chronic-disease-engine"
                ))
            
            # Lifestyle guide
            if lifestyle:
                diet = lifestyle.get('diet', {})
                exercise = lifestyle.get('exercise', {})
                sleep = lifestyle.get('sleep', {})
                
                if diet:
                    pairs.append(make_chat(
                        SYSTEM_CHRONIC,
                        f"{name}患者的饮食调护建议？",
                        f"【{name}饮食调护】\n"
                        f"原则：{diet.get('principle', '')}\n"
                        f"推荐：{', '.join(diet.get('recommend', []))}\n"
                        f"避免：{', '.join(diet.get('avoid', []))}",
                        module="chronic-disease-engine"
                    ))
                
                if exercise:
                    pairs.append(make_chat(
                        SYSTEM_CHRONIC,
                        f"{name}患者的运动建议和注意事项？",
                        f"【{name}运动建议】\n"
                        f"原则：{exercise.get('principle', '')}\n"
                        f"推荐：{', '.join(exercise.get('recommend', []))}\n"
                        f"避免：{', '.join(exercise.get('avoid', []))}\n"
                        f"警告：{exercise.get('warning', '')}",
                        module="chronic-disease-engine"
                    ))
                
                if sleep:
                    pairs.append(make_chat(
                        SYSTEM_CHRONIC,
                        f"{name}患者的睡眠调护建议？",
                        f"【{name}睡眠调护】\n"
                        f"原则：{sleep.get('principle', '')}\n"
                        f"推荐：{', '.join(sleep.get('recommend', []))}\n"
                        f"避免：{', '.join(sleep.get('avoid', []))}",
                        module="chronic-disease-engine"
                    ))
    except json.JSONDecodeError as e:
        print(f"  [warn] CHRONIC_DISEASES parse failed: {e}")

print(f"  chronic-disease-engine: {len([p for p in pairs if p['module']=='chronic-disease-engine'])} pairs")

# ═══════════════════════════════════════════
# 7. PULSE ENGINE — 脉诊知识
# ═══════════════════════════════════════════
pairs.append(make_chat(
    "你是中医脉诊专家。掌握28种脉象的特征、主病、鉴别要点。",
    "请介绍浮脉、沉脉、迟脉、数脉、滑脉、涩脉的特征和主病。",
    "【六纲脉象精要】\n\n"
    "【浮脉】特征：轻取即得，重按稍减。主病：表证（外感风寒/风热）。\n"
    "鉴别：浮而有力为洪脉（热盛），浮而无力为虚脉（气虚）。\n\n"
    "【沉脉】特征：轻取不应，重按始得。主病：里证（内伤、寒凝、气滞、血瘀）。\n"
    "鉴别：沉而有力为实（里实），沉而无力为虚（里虚）。\n\n"
    "【迟脉】特征：脉来缓慢，一息三至（每分钟<60次）。主病：寒证。\n"
    "鉴别：迟而有力为冷积（实证），迟而无力为阳虚（虚证）。\n\n"
    "【数脉】特征：脉来快速，一息六至（每分钟>90次）。主病：热证。\n"
    "鉴别：数而有力为实热，数而无力为虚热（阴虚内热）。\n\n"
    "【滑脉】特征：往来流利，如珠走盘。主病：痰饮、食滞、实热、妊娠。\n"
    "鉴别：滑而有力为实邪，滑而无力为正虚。\n\n"
    "【涩脉】特征：往来艰涩，如轻刀刮竹。主病：精伤、血少、气滞血瘀。\n"
    "鉴别：涩而无力为精伤血少，涩而有力为气滞血瘀。\n\n"
    "注：脉诊需结合四诊合参，不可单独凭脉断病。",
    module="pulse-engine"
))

# ═══════════════════════════════════════════
# 8. CONSTITUTION ENGINE — 体质辨识
# ═══════════════════════════════════════════
pairs.append(make_chat(
    "你是中医体质辨识专家。掌握九种体质（平和、气虚、阳虚、阴虚、痰湿、湿热、血瘀、气郁、特禀）的辨识要点和调理方案。",
    "请介绍九种体质的特征辨识要点和调理原则。",
    "【九种体质辨识精要】\n\n"
    "1. 平和质：面色红润、精力充沛、食欲良好、舌淡红苔薄白\n"
    "   → 调理：保持均衡，勿过偏\n\n"
    "2. 气虚质：语音低弱、容易疲劳、易出汗、舌淡苔白\n"
    "   → 调理：补气健脾（四君子汤）\n\n"
    "3. 阳虚质：畏寒怕冷、手足不温、喜热饮食、舌淡胖苔白滑\n"
    "   → 调理：温阳补气（金匮肾气丸）\n\n"
    "4. 阴虚质：口干咽燥、手足心热、潮热盗汗、舌红少苔\n"
    "   → 调理：滋阴润燥（六味地黄丸）\n\n"
    "5. 痰湿质：体形肥胖、腹部肥满、舌苔白腻\n"
    "   → 调理：化痰祛湿（二陈汤）\n\n"
    "6. 湿热质：面垢油光、易生痤疮、舌红苔黄腻\n"
    "   → 调理：清热利湿（龙胆泻肝汤）\n\n"
    "7. 血瘀质：面色晦暗、色素沉着、舌质暗有瘀斑\n"
    "   → 调理：活血化瘀（血府逐瘀汤）\n\n"
    "8. 气郁质：情绪低落、胸胁胀痛、脉弦\n"
    "   → 调理：疏肝解郁（逍遥散）\n\n"
    "9. 特禀质：过敏体质、易患哮喘荨麻疹\n"
    "   → 调理：益气固表（玉屏风散）\n\n"
    "注：体质辨识需综合四诊信息，建议执业中医师判断。",
    module="constitution-engine"
))

# ═══════════════════════════════════════════
# 9. MULTIMODAL FUSION — 多模态融合
# ═══════════════════════════════════════════
pairs.append(make_chat(
    "你是中医多模态诊断融合专家。融合舌诊、面诊、脉诊、穿戴设备数据，进行综合辨证评估。",
    "如何将舌诊、面诊、穿戴设备数据融合进行综合辨证？",
    "【中医多模态诊断融合规则】\n\n"
    "1. 数据采集与标准化：\n"
    "   - 舌诊：舌色/舌苔/舌形/津液/齿痕/瘀斑（标准化JSON输出）\n"
    "   - 面诊：面色/唇色/气色/眼神/精神\n"
    "   - 脉诊：浮沉迟数滑涩弦紧（28脉象数字化）\n"
    "   - 穿戴设备：心率/血压/血氧/体温/睡眠/活动\n"
    "   - 问诊：主诉/病史/用药/过敏/家族史\n\n"
    "2. 权重优先级：\n"
    "   危急生命体征 > 普通生理指标 > 舌面诊特征 > 脉诊 > 问诊\n\n"
    "3. 交叉校验规则：\n"
    "   - 多源异常一致 → 上调综合等级（高置信度）\n"
    "   - 仅单源异常 → 标记'疑似异常，建议进一步复核'\n"
    "   - 数据置信度低 → 标注可靠性风险\n"
    "   - 舌面诊用于体质评估和证候参考，不可作为急危重症判断依据\n\n"
    "4. 融合输出格式：\n"
    "   { syndrome, confidence, sources, risk_level, recommendation }\n\n"
    "注：AI仅为辅助参考，最终辨证由执业医师确认。",
    module="multimodal-fusion-engine"
))

# ═══════════════════════════════════════════
# 10. ADDITIONAL — 辨证五派综合
# ═══════════════════════════════════════════
pairs.append(make_chat(
    SYSTEM_SYNDROME,
    "同一患者，伤寒派和温病派对感冒的辨证有何不同？",
    "【伤寒派 vs 温病派 · 感冒辨证对比】\n\n"
    "【伤寒派（张仲景）】\n"
    "核心：六经辨证（太阳、阳明、少阳、太阴、少阴、厥阴）\n"
    "感冒定位：太阳病（风寒/风热表证）\n"
    "鉴别要点：恶寒重/发热轻/无汗 = 风寒；发热重/恶寒轻/有汗 = 风热\n"
    "代表方：桂枝汤（风寒）/ 麻黄汤（表实）/ 银翘散（风热）\n\n"
    "【温病派（叶天士/吴鞠通）】\n"
    "核心：卫气营血辨证 + 三焦辨证\n"
    "感冒定位：卫分证（上焦肺卫）\n"
    "鉴别要点：发热为主、微恶风寒、咽痛、舌边尖红、脉浮数\n"
    "代表方：银翘散（卫分）/ 桑菊饮（卫分轻证）\n\n"
    "【五派并列】\n"
    "伤寒派重寒热虚实、六经传变；温病派重卫气营血、三焦传变；\n"
    "扶阳派重阳气盛衰、少阴寒化；脾胃派重中焦运化、气机升降；\n"
    "火神派重真阳、附子运用。\n\n"
    "注：五派并列辨证为AI辅助参考，最终辨证由执业医师确认。",
    module="syndrome-engine"
))

# ═══════════════════════════════════════════
# 11. 倪海厦经典知识
# ═══════════════════════════════════════════
pairs.append(make_chat(
    "你是倪海厦人纪体系的中医知识专家。掌握针灸、黄帝内经、神农本草经、伤寒论、金匮要略、天纪等模块。",
    "倪海厦人纪体系的针灸五门十变是什么？",
    "【倪海厦 · 针灸五门十变】\n\n"
    "五门十变是倪师针灸学的核心体系，将十二正经与五输穴结合，形成10组对应的井荣俞经合：\n\n"
    "1. 井木肝（大敦）→ 荣火心（少府）→ 俞土脾（太白）→ 经金肺（经渠）→ 合水肾（阴谷）\n"
    "2. 胆（窍阴）→ 小肠（少泽）→ 胃（陷谷）→ 大肠（阳溪）→ 膀胱（委中）\n"
    "3. 肝（大敦）→ 心包（劳宫）→ 三焦（中渚）→ 肺（太渊）→ 肾（复溜）\n"
    "4. 胆（侠溪）→ 小肠（前谷）→ 胃（冲阳）→ 大肠（三间）→ 膀胱（昆仑）\n"
    "5. 肝（行间）→ 小肠（后溪）→ 胃（解溪）→ 大肠（曲池）→ 膀胱（至阴）\n\n"
    "应用：通过五门十变，可一针透多穴、一穴调多经，大幅提升针灸疗效。\n\n"
    "注：此内容为倪海厦人纪针灸课程知识点。",
    module="nihaisha-acupuncture"
))

pairs.append(make_chat(
    "你是倪海厦人纪体系的中医知识专家。",
    "倪海厦讲授的伤寒论六经辨证核心框架是什么？",
    "【倪海厦 · 伤寒论六经辨证框架】\n\n"
    "太阳经（足太阳膀胱/手太阳小肠）：\n"
    "- 太阳病：脉浮、头项强痛、恶寒\n"
    "- 太阳伤寒（麻黄汤证）：无汗、脉浮紧\n"
    "- 太阳中风（桂枝汤证）：有汗、脉浮缓\n\n"
    "阳明经（足阳明胃/手阳明大肠）：\n"
    "- 阳明病：胃家实、身热汗出、不恶寒反恶热\n"
    "- 白虎汤证（气分热盛）：大热、大汗、大渴、脉洪大\n"
    "- 承气汤证（腑实）：潮热、谵语、腹满、大便硬\n\n"
    "少阳经（足少阳胆/手少阳三焦）：\n"
    "- 少阳病：口苦、咽干、目眩、往来寒热、胸胁苦满\n"
    "- 小柴胡汤证：默默不欲饮食、心烦喜呕\n\n"
    "太阴经（足太阴脾）：\n"
    "- 太阴病：腹满而吐、食不下、自利益甚\n"
    "- 理中汤证：畏寒、腹满、呕吐、泄泻\n\n"
    "少阴经（足少阴肾）：\n"
    "- 少阴病：脉微细、但欲寐\n"
    "- 附子汤证（寒化）：畏寒、肢冷、下利清谷\n"
    "- 黄连阿胶汤证（热化）：心烦不眠、舌红少苔\n\n"
    "厥阴经（足厥阴肝）：\n"
    "- 厥阴病：消渴、气上撞心、心中疼热、饥不欲食\n"
    "- 乌梅丸证：寒热错杂、上热下寒\n\n"
    "注：此为倪海厦人纪伤寒论课程框架，供学习参考。",
    module="nihaisha"
))

# ═══════════════════════════════════════════
# Write output
# ═══════════════════════════════════════════
OUT.parent.mkdir(parents=True, exist_ok=True)
with open(OUT, 'w', encoding='utf-8') as f:
    for pair in pairs:
        f.write(json.dumps(pair, ensure_ascii=False) + '\n')

print(f"\n{'='*50}")
print(f"Total distilled pairs: {len(pairs)}")
print(f"Output: {OUT}")
print(f"{'='*50}\n")

# Breakdown
counts = {}
for p in pairs:
    m = p.get('module', 'unknown')
    counts[m] = counts.get(m, 0) + 1
print("Breakdown by module:")
for m, c in sorted(counts.items(), key=lambda x: -x[1]):
    print(f"  {m}: {c}")
print(f"\nTotal modules covered: {len(counts)}")
