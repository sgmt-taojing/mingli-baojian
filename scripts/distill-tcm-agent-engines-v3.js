#!/usr/bin/env node
/**
 * distill-tcm-agent-engines-v3.js — 通过 Node 直接 require 引擎模块
 * 不依赖 JSON 解析（直接读取 JS 对象）
 */

const path = require('path');
const fs = require('fs');

const TCM_AGENT = path.resolve(__dirname, '../../tcm-agent');
const MBJ = path.resolve(__dirname, '../..');
const OUT = path.join(MBJ, 'training-data/sft-tcm-engine-distill.jsonl');

const TCM_SYSTEM = `你是中医辅助诊疗智能体，依托中医经典知识库（伤寒论、金匮要略、黄帝内经、神农本草经、倪海厦人纪等）与现代医学知识融合，为执业中医师提供辅助参考。
最高合规铁律：所有分析仅为AI辅助参考，绝对不能等同于执业医师临床诊断，不允许独立确诊疾病、不擅自开具药物与治疗方案。出现危重体征优先提示寻求专业医疗救助。`;

const pairs = [];

function makeChat(system, user, assistant, module) {
    return {
        messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
            { role: 'assistant', content: assistant }
        ],
        source: 'distill-tcm-agent-v3',
        module: module,
        distilled_at: '2026-08-09'
    };
}

let totalCount = 0;

// ═══════════════════════════════════════════
// 1. SYNDROME ENGINE
// ═══════════════════════════════════════════
try {
    const synd = require(path.join(TCM_AGENT, 'server/engines/syndrome-engine.js'));
    console.log('[syndrome-engine] exports:', Object.keys(synd).slice(0, 10));
    
    // Extract CLASSICS, CONTRAINDICATION_RULES, DIAGNOSIS_FORMULA_WEIGHTS
    const code = fs.readFileSync(path.join(TCM_AGENT, 'server/engines/syndrome-engine.js'), 'utf-8');
    
    // Use eval to access constants
    const constants = {};
    const constRegex = /const\s+([A-Z_]+)\s*=\s*([\s\S]*?)(?=\n\nexport|module\.exports|const \w+\s*=\s*$)/g;
    let m;
    while ((m = constRegex.exec(code))) {
        try {
            constants[m[1]] = eval('(' + m[2] + ')');
        } catch (e) {
            // skip
        }
    }
    
    console.log('  constants found:', Object.keys(constants));
    
    if (constants.CLASSICS) {
        for (const [school, info] of Object.entries(constants.CLASSICS)) {
            const keywords = (info.keywords || []).join(', ');
            pairs.push(makeChat(
                TCM_SYSTEM,
                `请介绍${school}派的核心辨证要点和代表性方剂。`,
                `【${info.name}】（${info.author}）\n辨证关键词：${keywords}\n权重系数：${info.weight}\n核心思路：${info.name}以${info.keywords[0]}为核心辨证纲领，通过${(info.keywords||[]).slice(0,3).join('、')}等维度进行辨证分型。`,
                'syndrome-engine'
            ));
        }
    }
    
    if (constants.CONTRAINDICATION_RULES) {
        pairs.push(makeChat(
            TCM_SYSTEM + '\n\n【禁忌规则】处方时必须交叉校验禁忌。',
            '处方前需要校验哪些禁忌？',
            '处方禁忌校验清单：\n' + Object.entries(constants.CONTRAINDICATION_RULES).map(([k,v]) => `- ${k}: ${v.join(', ')}`).join('\n'),
            'syndrome-engine'
        ));
    }
    
    if (constants.DIAGNOSIS_FORMULA_WEIGHTS) {
        pairs.push(makeChat(
            TCM_SYSTEM,
            '不同证型的方剂权重如何计算？',
            '方剂权重计算规则：\n' + Object.entries(constants.DIAGNOSIS_FORMULA_WEIGHTS).map(([k,v]) => `- ${k}: 权重 ${v}`).join('\n'),
            'syndrome-engine'
        ));
    }
    
    if (constants.URGENCY_LEVELS) {
        pairs.push(makeChat(
            TCM_SYSTEM + '\n\n【危重体征】发现必须立即提示就医。',
            '中医AI辅助诊疗中哪些情况属于危重？',
            '【危重等级分级】\n' + Object.entries(constants.URGENCY_LEVELS).map(([k,v]) => `- ${k}: ${v}`).join('\n') + '\n\n注：发现任何危重体征必须立即提示就医，由执业医师判断处置。',
            'syndrome-engine'
        ));
    }
    
    console.log(`  ✓ syndrome-engine: ${pairs.length - totalCount} pairs`);
    totalCount = pairs.length;
} catch (e) {
    console.error('[syndrome-engine] error:', e.message);
}

// ═══════════════════════════════════════════
// 2. CLASSICS ENGINE
// ═══════════════════════════════════════════
try {
    const classics = require(path.join(TCM_AGENT, 'server/engines/classics-engine.js'));
    const startCount = pairs.length;
    
    if (classics.CLASSICS_KB) {
        const ckb = classics.CLASSICS_KB;
        
        if (ckb.formulas) {
            for (const [name, info] of Object.entries(ckb.formulas)) {
                pairs.push(makeChat(
                    TCM_SYSTEM,
                    `请引用${name}的经典出处和原文。`,
                    `【${name}】\n出处：${info.source}\n原文：${info.text}\n注：AI 仅作为知识检索工具，不替您下诊断。`,
                    'classics-engine'
                ));
            }
        }
        
        if (ckb.syndromes) {
            for (const [name, info] of Object.entries(ckb.syndromes)) {
                pairs.push(makeChat(
                    TCM_SYSTEM,
                    `请介绍${name}的辨证要点和经典出处。`,
                    `【${name}】\n出处：${info.source || '经典'}\n特征：${info.description || info.text || ''}\n鉴别要点：${(info.distinguishing_features || info.distinguish || []).join(', ')}`,
                    'classics-engine'
                ));
            }
        }
        
        if (ckb.herbs) {
            let i = 0;
            for (const [name, info] of Object.entries(ckb.herbs)) {
                if (i++ >= 20) break;  // Limit herbs
                pairs.push(makeChat(
                    TCM_SYSTEM,
                    `请介绍中药${name}的性味归经和功效。`,
                    `【${name}】\n出处：${info.source || '本草'}\n性味：${info.nature || ''} ${info.flavor || ''}\n归经：${info.meridian || ''}\n功效：${info.effect || info.efficacy || ''}\n用法用量：${info.dosage || ''}`,
                    'classics-engine'
                ));
            }
        }
    }
    
    console.log(`  ✓ classics-engine: ${pairs.length - startCount} pairs`);
    totalCount = pairs.length;
} catch (e) {
    console.error('[classics-engine] error:', e.message);
}

// ═══════════════════════════════════════════
// 3. DRUG SAFETY ENGINE
// ═══════════════════════════════════════════
try {
    const drug = require(path.join(TCM_AGENT, 'server/engines/drug-safety-engine.js'));
    const startCount = pairs.length;
    
    if (drug.TCM_SAFETY) {
        const s = drug.TCM_SAFETY;
        
        if (s.eighteenAntagonism) {
            pairs.push(makeChat(
                TCM_SYSTEM + '\n\n【处方安全】必须校验十八反、十九畏、妊娠禁忌。',
                '中药十八反是什么？请完整列出所有相反配伍。',
                '【十八反】（相反配伍禁忌）：\n' + Object.entries(s.eighteenAntagonism).map(([k,v]) => `- ${k} 反 ${v.join(', ')}`).join('\n') + '\n\n注：处方时必须交叉校验十八反。',
                'drug-safety-engine'
            ));
        }
        
        if (s.nineteenFear) {
            pairs.push(makeChat(
                TCM_SYSTEM + '\n\n【处方安全】十九畏相畏配伍规则。',
                '中药十九畏是什么？请完整列出所有相畏配伍。',
                '【十九畏】（相畏配伍禁忌）：\n' + Object.entries(s.nineteenFear).map(([k,v]) => `- ${k} 畏 ${v.join(', ')}`).join('\n'),
                'drug-safety-engine'
            ));
        }
        
        if (s.pregnancyForbidden) {
            pairs.push(makeChat(
                TCM_SYSTEM + '\n\n【妊娠禁忌】孕妇禁用/慎用药物。',
                '哪些中药在妊娠期间禁用或慎用？',
                '【妊娠禁忌药物】：\n' + Object.entries(s.pregnancyForbidden).map(([k,v]) => `- ${k}: ${v.join(', ')}`).join('\n'),
                'drug-safety-engine'
            ));
        }
        
        if (s.toxicLimit) {
            pairs.push(makeChat(
                TCM_SYSTEM + '\n\n【用量警戒】毒性药物的安全剂量上限。',
                '中药毒性药物的用量警戒线是多少？',
                '【毒性药物用量警戒】：\n' + Object.entries(s.toxicLimit).map(([k,v]) => `- ${k}: ${v}`).join('\n'),
                'drug-safety-engine'
            ));
        }
        
        if (s.absolute) {
            pairs.push(makeChat(
                TCM_SYSTEM,
                '哪些情况是中药处方的绝对禁忌？',
                '【中药绝对禁忌】：\n' + Object.entries(s.absolute).map(([k,v]) => `- ${k}: ${v.join(', ')}`).join('\n'),
                'drug-safety-engine'
            ));
        }
        
        if (s.caution) {
            pairs.push(makeChat(
                TCM_SYSTEM,
                '哪些药物需要特别注意（慎用）？',
                '【中药慎用药物】：\n' + Object.entries(s.caution).map(([k,v]) => `- ${k}: ${v.join(', ')}`).join('\n'),
                'drug-safety-engine'
            ));
        }
        
        for (const [group, key] of [['老年人', 'elderlyCaution'], ['儿童', 'childrenCaution']]) {
            if (s[key]) {
                pairs.push(makeChat(
                    TCM_SYSTEM,
                    `给${group}开中药处方需要注意什么？`,
                    `【${group}用药注意】：\n` + Object.entries(s[key]).map(([k,v]) => `- ${k}: ${v.join(', ')}`).join('\n'),
                    'drug-safety-engine'
                ));
            }
        }
    }
    
    console.log(`  ✓ drug-safety-engine: ${pairs.length - startCount} pairs`);
    totalCount = pairs.length;
} catch (e) {
    console.error('[drug-safety-engine] error:', e.message);
}

// ═══════════════════════════════════════════
// 4. DOSAGE ENGINE
// ═══════════════════════════════════════════
try {
    const dos = require(path.join(TCM_AGENT, 'server/engines/dosage-engine.js'));
    const startCount = pairs.length;
    
    if (dos.ADULT_BASE && dos.CHILD_BASE) {
        pairs.push(makeChat(
            TCM_SYSTEM + '\n\n【剂量计算】根据患者情况计算个性化剂量。',
            '中药成人基准剂量和儿童剂量范围是多少？如何根据患者情况调整？',
            `【成人基准剂量】：${dos.ADULT_BASE.min}~${dos.ADULT_BASE.max}g/味\n` +
            `【儿童基准剂量】：${dos.CHILD_BASE.min}~${dos.CHILD_BASE.max}g/味\n\n` +
            '个性化剂量调整因素：\n' +
            '1. 体重：每增加10kg，剂量递增5%~10%\n' +
            '2. 体质：虚弱减量20%~30%\n' +
            '3. 年龄：儿童按体重折算，老年人减量15%~25%\n' +
            '4. 肝肾功能：异常者减量30%~50%\n' +
            '5. 合并症：调整活血/补益类药物剂量\n' +
            '6. 毒性药物：严格控制在安全范围内\n\n' +
            '注：AI 仅为辅助参考，实际剂量由执业医师确定。',
            'dosage-engine'
        ));
    }
    
    // Extract dosage function logic
    const code = fs.readFileSync(path.join(TCM_AGENT, 'server/engines/dosage-engine.js'), 'utf-8');
    const funcRegex = /function\s+(\w+)\s*\(([^)]*)\)\s*\{([\s\S]*?)(?=\n\s*function|module\.exports)/g;
    let m;
    let fnCount = 0;
    while ((m = funcRegex.exec(code)) && fnCount < 5) {
        const fname = m[1];
        const body = m[3].trim().substring(0, 500);
        pairs.push(makeChat(
            TCM_SYSTEM + '\n\n【剂量计算】',
            `中药剂量计算中，${fname} 函数的作用是什么？`,
            `【${fname} 剂量算法】\n逻辑：\n${body}\n\n注：此算法为AI辅助参考。`,
            'dosage-engine'
        ));
        fnCount++;
    }
    
    console.log(`  ✓ dosage-engine: ${pairs.length - startCount} pairs`);
    totalCount = pairs.length;
} catch (e) {
    console.error('[dosage-engine] error:', e.message);
}

// ═══════════════════════════════════════════
// 5. COMPLIANCE ENGINE
// ═══════════════════════════════════════════
try {
    const comp = require(path.join(TCM_AGENT, 'server/engines/compliance-engine.js'));
    const startCount = pairs.length;
    
    if (comp.REGULATIONS) {
        pairs.push(makeChat(
            TCM_SYSTEM + '\n\n【合规边界】AI辅助诊断的合规铁律。',
            '中医AI辅助诊断需要遵守哪些合规法规？',
            '【合规法规】\n' + Object.entries(comp.REGULATIONS).map(([k,v]) => `- ${k} (${v.name}): ${v.basis}`).join('\n') + '\n\n核心原则：知情同意+最小必要+可解释性+人工审核+数据安全。',
            'compliance-engine'
        ));
    }
    
    console.log(`  ✓ compliance-engine: ${pairs.length - startCount} pairs`);
    totalCount = pairs.length;
} catch (e) {
    console.error('[compliance-engine] error:', e.message);
}

// ═══════════════════════════════════════════
// 6. CHRONIC DISEASE ENGINE
// ═══════════════════════════════════════════
try {
    const chron = require(path.join(TCM_AGENT, 'server/engines/chronic-disease-engine.js'));
    const startCount = pairs.length;
    
    if (chron.CHRONIC_DISEASES) {
        for (const [code, disease] of Object.entries(chron.CHRONIC_DISEASES)) {
            const name = disease.name;
            const aliases = (disease.aliases || []).join(', ');
            const dept = disease.department || '';
            const patterns = disease.patternProfile || [];
            
            pairs.push(makeChat(
                TCM_SYSTEM + '\n\n【慢病管理】长期管理方案。',
                `${name}（${aliases}）的中医辨证要点和管理方案是什么？`,
                `【${name}】\n别名：${aliases}\n科室：${dept}\n辨证分型（共${patterns.length}型）：\n` + patterns.map((p, i) => `  ${i+1}. ${p.syndrome}（${p.formula||''}）`).join('\n'),
                'chronic-disease-engine'
            ));
            
            for (const p of patterns) {
                pairs.push(makeChat(
                    TCM_SYSTEM + '\n\n【慢病管理】',
                    `${name}的${p.syndrome}证型如何辨证？用什么方剂？`,
                    `【${name} → ${p.syndrome}证】\n主症：${(p.mainSymptoms||[]).join('、')}\n舌象：${p.tongue||''}\n脉象：${p.pulse||''}\n代表方剂：${p.formula||''}\n用药：${p.herbs||''}\n生活调护：${p.tcmAdvice||''}`,
                    'chronic-disease-engine'
                ));
            }
            
            // Med schedule
            if (disease.medSchedule && disease.medSchedule.length > 0) {
                pairs.push(makeChat(
                    TCM_SYSTEM + '\n\n【慢病管理】',
                    `${name}的用药时间安排和注意事项？`,
                    `【${name}用药时间表】\n` + disease.medSchedule.map(m => `- ${m.time}: ${m.drug} (${m.type}) - ${m.note}`).join('\n'),
                    'chronic-disease-engine'
                ));
            }
            
            // Lifestyle
            if (disease.lifestyleGuide) {
                const ls = disease.lifestyleGuide;
                if (ls.diet) {
                    pairs.push(makeChat(
                        TCM_SYSTEM + '\n\n【慢病管理】',
                        `${name}患者的饮食调护建议？`,
                        `【${name}饮食调护】\n原则：${ls.diet.principle||''}\n推荐：${(ls.diet.recommend||[]).join('、')}\n避免：${(ls.diet.avoid||[]).join('、')}`,
                        'chronic-disease-engine'
                    ));
                }
                if (ls.exercise) {
                    pairs.push(makeChat(
                        TCM_SYSTEM + '\n\n【慢病管理】',
                        `${name}患者的运动建议和注意事项？`,
                        `【${name}运动建议】\n原则：${ls.exercise.principle||''}\n推荐：${(ls.exercise.recommend||[]).join('、')}\n避免：${(ls.exercise.avoid||[]).join('、')}\n警告：${ls.exercise.warning||''}`,
                        'chronic-disease-engine'
                    ));
                }
            }
        }
    }
    
    console.log(`  ✓ chronic-disease-engine: ${pairs.length - startCount} pairs`);
    totalCount = pairs.length;
} catch (e) {
    console.error('[chronic-disease-engine] error:', e.message);
}

// ═══════════════════════════════════════════
// 7. OTHER ENGINES (TCM knowledge)
// ═══════════════════════════════════════════
const otherEngines = [
    'pulse-engine.js',
    'constitution-engine.js', 
    'multimodal-fusion-engine.js',
    'clinical-reasoning-engine.js',
    'evidence-grading-engine.js',
    'patient-safety-engine.js',
    'herb-interaction-engine.js',
    'follow-up-engine.js'
];

for (const eng of otherEngines) {
    try {
        const mod = require(path.join(TCM_AGENT, 'server/engines', eng));
        const startCount = pairs.length;
        const keys = Object.keys(mod);
        console.log(`  [${eng}] exports:`, keys.slice(0, 5));
        // For these engines, extract any constants
        const code = fs.readFileSync(path.join(TCM_AGENT, 'server/engines', eng), 'utf-8');
        const constRegex = /const\s+([A-Z_]+)\s*=\s*([\s\S]*?)(?=\n\n\n|\n\nexport|\n\nfunction|\n\n\/\/)/g;
        let m;
        while ((m = constRegex.exec(code))) {
            try {
                const obj = eval('(' + m[2] + ')');
                if (typeof obj === 'object' && Object.keys(obj).length > 0) {
                    // Build a generic chat from this constant
                    const desc = Object.entries(obj).slice(0, 10).map(([k,v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v).substring(0, 200) : v}`).join('\n');
                    pairs.push(makeChat(
                        TCM_SYSTEM,
                        `请介绍 ${m[1]} 的内容。`,
                        `【${m[1]}】\n${desc}\n\n注：AI辅助参考。`,
                        eng.replace('.js', '')
                    ));
                }
            } catch (e) {
                // skip parse errors
            }
        }
        console.log(`  ✓ ${eng}: ${pairs.length - startCount} pairs`);
        totalCount = pairs.length;
    } catch (e) {
        // Engine file may not exist, skip
        // console.error(`[${eng}] error:`, e.message);
    }
}

// ═══════════════════════════════════════════
// ADDITIONAL: Pulse + Constitution + Multimodal (synthesized from TCM classic knowledge)
// ═══════════════════════════════════════════
pairs.push(makeChat(
    TCM_SYSTEM,
    '请介绍浮脉、沉脉、迟脉、数脉、滑脉、涩脉的特征和主病。',
    '【六纲脉象精要】\n\n' +
    '【浮脉】特征：轻取即得，重按稍减。主病：表证（外感风寒/风热）。\n鉴别：浮而有力为洪脉（热盛），浮而无力为虚脉（气虚）。\n\n' +
    '【沉脉】特征：轻取不应，重按始得。主病：里证（内伤、寒凝、气滞、血瘀）。\n鉴别：沉而有力为实（里实），沉而无力为虚（里虚）。\n\n' +
    '【迟脉】特征：脉来缓慢，一息三至（<60次/分）。主病：寒证。\n鉴别：迟而有力为冷积，迟而无力为阳虚。\n\n' +
    '【数脉】特征：脉来快速，一息六至（>90次/分）。主病：热证。\n鉴别：数而有力为实热，数而无力为虚热（阴虚内热）。\n\n' +
    '【滑脉】特征：往来流利，如珠走盘。主病：痰饮、食滞、实热、妊娠。\n\n' +
    '【涩脉】特征：往来艰涩，如轻刀刮竹。主病：精伤、血少、气滞血瘀。\n\n' +
    '注：脉诊需结合四诊合参，不可单独凭脉断病。',
    'pulse-engine-synthesized'
));

pairs.push(makeChat(
    TCM_SYSTEM,
    '请介绍九种体质的特征辨识要点和调理原则。',
    '【九种体质辨识精要】\n\n' +
    '1. 平和质：面色红润、精力充沛、舌淡红苔薄白 → 调理：保持均衡\n' +
    '2. 气虚质：语音低弱、容易疲劳、易出汗 → 调理：补气健脾（四君子汤）\n' +
    '3. 阳虚质：畏寒怕冷、手足不温、喜热饮食 → 调理：温阳补气（金匮肾气丸）\n' +
    '4. 阴虚质：口干咽燥、手足心热、潮热盗汗 → 调理：滋阴润燥（六味地黄丸）\n' +
    '5. 痰湿质：体形肥胖、腹部肥满、舌苔白腻 → 调理：化痰祛湿（二陈汤）\n' +
    '6. 湿热质：面垢油光、易生痤疮、舌红苔黄腻 → 调理：清热利湿（龙胆泻肝汤）\n' +
    '7. 血瘀质：面色晦暗、色素沉着、舌质暗有瘀斑 → 调理：活血化瘀（血府逐瘀汤）\n' +
    '8. 气郁质：情绪低落、胸胁胀痛、脉弦 → 调理：疏肝解郁（逍遥散）\n' +
    '9. 特禀质：过敏体质、易患哮喘荨麻疹 → 调理：益气固表（玉屏风散）\n\n' +
    '注：体质辨识需综合四诊信息。',
    'constitution-engine-synthesized'
));

pairs.push(makeChat(
    TCM_SYSTEM,
    '如何将舌诊、面诊、穿戴设备数据融合进行综合辨证？',
    '【中医多模态诊断融合规则】\n\n' +
    '1. 数据采集与标准化：\n' +
    '   - 舌诊：舌色/舌苔/舌形/津液/齿痕/瘀斑（标准化JSON输出）\n' +
    '   - 面诊：面色/唇色/气色/眼神/精神\n' +
    '   - 脉诊：浮沉迟数滑涩弦紧（28脉象数字化）\n' +
    '   - 穿戴设备：心率/血压/血氧/体温/睡眠/活动\n' +
    '   - 问诊：主诉/病史/用药/过敏/家族史\n\n' +
    '2. 权重优先级：危急生命体征 > 普通生理指标 > 舌面诊特征 > 脉诊 > 问诊\n\n' +
    '3. 交叉校验规则：\n' +
    '   - 多源异常一致 → 上调综合等级（高置信度）\n' +
    '   - 仅单源异常 → 标记"疑似异常，建议进一步复核"\n' +
    '   - 数据置信度低 → 标注可靠性风险\n' +
    '   - 舌面诊用于体质评估和证候参考，不可作为急危重症判断依据\n\n' +
    '4. 融合输出格式：{ syndrome, confidence, sources, risk_level, recommendation }\n\n' +
    '注：AI仅为辅助参考，最终辨证由执业医师确认。',
    'multimodal-fusion-synthesized'
));

// ═══════════════════════════════════════════
// 8. NIHAISHA 经典知识
// ═══════════════════════════════════════════
pairs.push(makeChat(
    TCM_SYSTEM,
    '倪海厦人纪体系的针灸五门十变是什么？',
    '【倪海厦 · 针灸五门十变】\n\n' +
    '五门十变是倪师针灸学核心体系，将十二正经与五输穴结合，形成10组对应的井荣俞经合：\n\n' +
    '1. 井木肝（大敦）→ 荣火心（少府）→ 俞土脾（太白）→ 经金肺（经渠）→ 合水肾（阴谷）\n' +
    '2. 胆（窍阴）→ 小肠（少泽）→ 胃（陷谷）→ 大肠（阳溪）→ 膀胱（委中）\n' +
    '3. 肝（大敦）→ 心包（劳宫）→ 三焦（中渚）→ 肺（太渊）→ 肾（复溜）\n' +
    '4. 胆（侠溪）→ 小肠（前谷）→ 胃（冲阳）→ 大肠（三间）→ 膀胱（昆仑）\n' +
    '5. 肝（行间）→ 小肠（后溪）→ 胃（解溪）→ 大肠（曲池）→ 膀胱（至阴）\n\n' +
    '应用：通过五门十变，可一针透多穴、一穴调多经。\n\n' +
    '注：此内容为倪海厦人纪针灸课程知识点。',
    'nihaisha-acupuncture'
));

pairs.push(makeChat(
    TCM_SYSTEM,
    '倪海厦讲授的伤寒论六经辨证核心框架是什么？',
    '【倪海厦 · 伤寒论六经辨证框架】\n\n' +
    '太阳经（足太阳膀胱/手太阳小肠）：\n' +
    '- 太阳病：脉浮、头项强痛、恶寒\n' +
    '- 太阳伤寒（麻黄汤证）：无汗、脉浮紧\n' +
    '- 太阳中风（桂枝汤证）：有汗、脉浮缓\n\n' +
    '阳明经（足阳明胃/手阳明大肠）：\n' +
    '- 阳明病：胃家实、身热汗出、不恶寒反恶热\n' +
    '- 白虎汤证：大热、大汗、大渴、脉洪大\n' +
    '- 承气汤证：潮热、谵语、腹满、大便硬\n\n' +
    '少阳经（足少阳胆/手少阳三焦）：\n' +
    '- 少阳病：口苦、咽干、目眩、往来寒热、胸胁苦满\n' +
    '- 小柴胡汤证：默默不欲饮食、心烦喜呕\n\n' +
    '太阴经（足太阴脾）：\n' +
    '- 太阴病：腹满而吐、食不下、自利益甚\n' +
    '- 理中汤证：畏寒、腹满、呕吐、泄泻\n\n' +
    '少阴经（足少阴肾）：\n' +
    '- 少阴病：脉微细、但欲寐\n' +
    '- 附子汤证（寒化）：畏寒、肢冷、下利清谷\n' +
    '- 黄连阿胶汤证（热化）：心烦不眠、舌红少苔\n\n' +
    '厥阴经（足厥阴肝）：\n' +
    '- 厥阴病：消渴、气上撞心、心中疼热、饥不欲食\n' +
    '- 乌梅丸证：寒热错杂、上热下寒\n\n' +
    '注：此为倪海厦人纪伤寒论课程框架，供学习参考。',
    'nihaisha-shanghanlun'
));

// ═══════════════════════════════════════════
// Write output
// ═══════════════════════════════════════════
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, pairs.map(p => JSON.stringify(p)).join('\n') + '\n');

console.log(`\n${'='.repeat(50)}`);
console.log(`Total distilled pairs: ${pairs.length}`);
console.log(`Output: ${OUT}`);
console.log(`${'='.repeat(50)}\n`);

const counts = {};
for (const p of pairs) {
    const m = p.module;
    counts[m] = (counts[m] || 0) + 1;
}
console.log('Breakdown by module:');
for (const [m, c] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${m}: ${c}`);
}
console.log(`\nTotal modules covered: ${Object.keys(counts).length}`);