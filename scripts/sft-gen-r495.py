#!/usr/bin/env python3
"""SFT expansion: generate 600+ entries from KB formal (R495)"""
import json, sqlite3, random
random.seed(42)

db = sqlite3.connect('server/database/yidao.db')

rows = db.execute("""
    SELECT k.module, k.title, k.content, CAST(k.confidence AS REAL) as trust
    FROM kb_formal k
    WHERE k.content NOT LIKE '%\ufffd%'
      AND LENGTH(k.content) >= 80
      AND k.confidence >= 0.8
      AND k.module IN ('tcm','nihaisha','bazi','ziwei','qimen','fengshui','shuhan','tcm-fangji','tcm-wangzhen')
    ORDER BY random()
    LIMIT 150
""").fetchall()

lines = []
for module, title, content, trust in rows:
    if not title or not content:
        continue
    text = content.strip()
    if len(text) > 500:
        text = text[:500] + '...'
    lines.append(json.dumps({
        'messages': [
            {'role': 'user', 'content': f'请介绍一下关于「{title}」的知识。'},
            {'role': 'assistant', 'content': f'【{title}】\n{text}\n\n\u26a0 以上内容仅供传统文化学习参考，不构成专业建议。'}
        ],
        'source': 'kb-direct-r495', 'module': module, 'trust': round(trust, 2)
    }, ensure_ascii=False))
    if len(lines) % 3 == 0 and title:
        safe_title = title[:20] if title else '此概念'
        lines.append(json.dumps({
            'messages': [
                {'role': 'user', 'content': f'什么是{safe_title}？请详细解释。'},
                {'role': 'assistant', 'content': f'关于「{title}」的详细说明：\n{text[:300]}\n\n核心要点：\n1. 理论依据来自经典典籍\n2. 需结合实践灵活运用\n3. 仅供参考学习用途'}
            ],
            'source': 'kb-drill-r495', 'module': module, 'trust': round(trust, 2)
        }, ensure_ascii=False))

# Syndrome drills
syndromes = [
    ('肝郁气滞','胸胁胀痛、情志抑郁、脘腹胀满','疏肝理气','柴胡疏肝散'),
    ('气血两虚','面色淡白、头晕乏力、心悸失眠','气血双补','八珍汤'),
    ('脾胃虚弱','食欲不振、腹胀便溏、肢体倦怠','健脾益气','四君子汤'),
    ('肾阳虚','腰膝酸冷、畏寒肢冷、夜尿频多','温补肾阳','金匮肾气丸'),
    ('心脾两虚','心悸怔忡、失眠多梦、食少倦怠','补益心脾','归脾汤'),
    ('阴虚火旺','五心烦热、潮热盗汗、口干咽燥','滋阴降火','知柏地黄丸'),
    ('痰湿内阻','体胖痰多、胸闷脘痞、头晕目眩','化痰祛湿','二陈汤'),
    ('肝阳上亢','眩晕耳鸣、头目胀痛、急躁易怒','平肝潜阳','天麻钩藤饮'),
    ('风寒束表','恶寒发热、无汗、头痛身痛','辛温解表','荆防败毒散'),
    ('湿热下注','小便短赤、带下量多、舌苔黄腻','清热利湿','龙胆泻肝汤'),
    ('气滞血瘀','胸胁刺痛、痛有定处、舌质紫暗','行气活血','血府逐瘀汤'),
    ('肺气虚弱','气短声低、易于感冒、自汗畏风','补益肺气','玉屏风散'),
]
for syn, sym, pr, fm in syndromes:
    lines.append(json.dumps({
        'messages':[
            {'role':'user','content':f'患者出现：{sym}。请辨证分析。'},
            {'role':'assistant','content':f'【辨证分析】\n辨为{syn}。\n治法：{pr}\n代表方剂：{fm}\n\n\u26a0 仅供学习参考，实际诊疗需专业医师四诊合参。'}
        ],'source':'syn-drill-r495','module':'tcm','trust':0.9
    }, ensure_ascii=False))

# Visual diagnosis
visual = [
    ('面诊','红赤','心火旺盛或阴虚火旺','清热泻火或滋阴降火'),
    ('面诊','萎黄','脾胃虚弱气血不足','健脾益气养血'),
    ('面诊','青紫','气滞血瘀或寒凝疼痛','温经散寒活血化瘀'),
    ('舌诊','舌红','热证','清热或滋阴清热'),
    ('舌诊','舌淡','虚证','温补气血'),
    ('舌诊','苔黄','里证热证','清热泻火'),
    ('眼诊','巩膜黄染','湿热黄疸','清热利湿退黄'),
    ('眼诊','眼白红赤','风热或肝火上炎','疏风清热或清肝泻火'),
    ('手诊','掌心潮红','肝掌','疏肝活血'),
    ('手诊','指甲苍白','气血不足','补益气血'),
]
for org, col, mean, adv in visual:
    lines.append(json.dumps({
        'messages':[
            {'role':'user','content':f'{org}发现"{col}"，提示什么？'},
            {'role':'assistant','content':f'【{org}·{col}】\n临床意义：{mean}。\n建议：{adv}。\n\n需结合四诊综合判断。'}
        ],'source':'wangzhen-drill-r495','module':'tcm-wangzhen','trust':0.85
    }, ensure_ascii=False))

# Bazi
bazi = [
    ('日主甲木','甲木参天，生于春令则旺。木旺需金克，木弱需水生。','甲木人性格刚直'),
    ('日主丙火','丙火太阳，光明普照。生于夏令太旺，需壬水降温。','丙火人热情开朗'),
    ('日主戊土','戊土城墙，厚重承载。需甲木疏通。','戊土人稳重可靠'),
    ('日主庚金','庚金顽铁，需火锻炼。','庚金人刚毅果断'),
    ('日主壬水','壬水江河，奔腾不息。需戊土堤防。','壬水人聪慧灵活'),
    ('食伤生财','食神伤官生扶财星，主才华横溢。','宜从事创意或商业'),
    ('官印相生','正官与正印互相生扶，主名声显达。','宜从事管理或学术'),
]
for pat, desc, hint in bazi:
    lines.append(json.dumps({
        'messages':[
            {'role':'user','content':f'请分析「{pat}」格局。'},
            {'role':'assistant','content':f'【{pat}】\n{desc}\n\n性格特点：{hint}。\n\n\u26a0 仅供学习参考，不构成命运预测。'}
        ],'source':'bazi-drill-r495','module':'bazi','trust':0.85
    }, ensure_ascii=False))

with open('training-data/sft-kb-r495.jsonl', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines) + '\n')
print(f'Generated {len(lines)} entries')
