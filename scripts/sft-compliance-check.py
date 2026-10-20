#!/usr/bin/env python3
"""
sft-compliance-check.py · 扫描训练数据 AI response 中的违规表达
只扫 response/answer/chosen/rejected（AI 回答），不扫 prompt/query
"""
import re
import json
import sys
from pathlib import Path

ROOT = Path('training-data')
FORBIDDEN = [
    # === 文档 1.2 / 1.5 红线（V1.1 终版·12 条）===
    # 原 8 条
    ('未成年人-强制声明', r'未成年.{0,4}(不宜|不应|不可|禁止).{0,6}(算命|预测|占卜|论命)'),
    ('未成年人-负面定论', r'(小孩|儿童|宝宝|婴幼儿|学生|初中生|高中生).{0,8}(命不好|命硬|克)'),
    ('性别歧视-贬低女性', r'女人.{0,6}(命不好|就该|注定|一定).{0,6}(穷|苦|累|没出息)'),
    ('性别歧视-男性压力', r'男人.{0,4}(就该|必须|注定).{0,6}(买房|买车|养家|赚钱)'),
    ('生肖歧视-负面定论', r'属.{1,2}(的)?.{0,4}(人|命|生肖).{0,6}(不好|不行|差|倒霉|克)'),
    ('医疗诊断替代-吃了就好', r'吃了.{0,4}好'),
    ('医疗诊断替代-不用吃药', r'不用吃药'),
    ('保证承诺', r'(保证|一定|绝对).{0,4}(能|会|可以).{0,4}(升职|发财|生子|成婚)'),
    # 新增 4 条（V1.1 文档 1.5 全模块红线）
    # 注意：「自主辨证体质病机」需排除纯八字藏干论述场景（如「火少则心阳虚」），
    # 识别标准：是否对用户直接输出健康判断、或替执业医师下诊断。
    ('自主辨证体质病机-直接诊断', r'(您|你|该用户|该命主|缘主|此人).{0,8}(湿气重|气虚|阴虚火旺|肝郁|脾虚|肾虚|血瘀|痰湿|阳虚|气血不足|体寒|体热|上热下寒)'),
    ('预判生死灾祸重病', r'(必死|活不过|活不长|必死无疑|必有大祸|难逃一死|命不久矣|活不到|注定要死|必定死于)'),
    ('凭空创造术数理论', r'(我(自己|原创|发明)创造|独创理论|个人理论体系|新派观点认为|独家创立)'),
    ('舌面诊越权健康判断', r'(从(舌|面)象看(出|来|得))(.{0,8})(疾病|病症|病机|体质|健康状况)'),
]

def extract_responses(obj):
    """只扫 AI 输出（response/answer/chosen/rejected），跳过 prompt/query/instruction"""
    parts = []
    for key in ('response', 'answer', 'rejected_response'):
        v = obj.get(key)
        if isinstance(v, str):
            parts.append(v)
    for key in ('chosen', 'rejected'):
        v = obj.get(key)
        if isinstance(v, dict):
            r = v.get('response', '')
            if r: parts.append(r)
    return ' '.join(parts)

def check_file(p):
    issues = []
    case_count = 0
    with open(p, encoding='utf-8') as f:
        for i, line in enumerate(f, 1):
            if not line.strip(): continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError:
                issues.append((p.name, i, 'JSON 解析失败', line[:80]))
                continue
            case_count += 1
            text = extract_responses(obj)
            # 跳过 DPO 教学反例（rejected 故意犯合规错用于训练）
            rejected = obj.get('rejected', {})
            if isinstance(rejected, dict) and rejected.get('__compliance_intentional__'):
                continue
            # 医学案例转述豁免：response 复述真实临床案例书中的病人诊疗记录时
            # 出现“必死/活不过”等词描述的是“病人”，不是当前用户，不构成预判该用户生死
            medical_narration = bool(re.search(r'(病例|病人|患者|临床|倪师|倪海厦|案例|课例|病例云)', text))
            # “预言该用户”是出现在模块=命理 (非 tcm) 且 instruction 里有俞主身份 (命主/八字/阡子/生肖) 才说明是指向当前用户
            is_mingli = obj.get('module', '') in ('bazi', 'ziwei', 'qimen', 'liuyao', 'meihua', 'liuren', 'fengshui')
            target_user_in_instr = bool(re.search(r'(缘主|命主|此命|该人|本人|䓇主|八字|生肖|阡子|出生时辰)', obj.get('instruction', '')))
            pred_to_user = is_mingli and target_user_in_instr
            for label, pat in FORBIDDEN:
                if label.startswith('预判生死灾祸重病') and medical_narration and not pred_to_user:
                    continue
                m = re.search(pat, text)
                if m:
                    issues.append((p.name, i, label, m.group()))
    return issues, case_count

all_issues = []
total_cases = 0
files = list(ROOT.rglob('*.jsonl'))
for f in files:
    issues, cc = check_file(f)
    all_issues.extend(issues)
    total_cases += cc

print(f'[compliance] scanned {len(files)} files, {total_cases} cases')
if all_issues:
    print(f'[compliance] {len(all_issues)} issues:')
    for fn, ln, label, snippet in all_issues:
        print(f'  - {fn}:L{ln} [{label}] "{snippet}"')
    sys.exit(1)
else:
    print('[compliance] OK · 0 issues')
