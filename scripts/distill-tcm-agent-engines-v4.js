#!/usr/bin/env node
/**
 * distill-tcm-agent-engines-v4.js — 通过 require() 直接获取引擎模块导出
 * 策略：1) require 引擎获取 JS 对象 2) 从对象提取所有常量 3) 生成 ChatML
 */

const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

const TCM_AGENT = path.resolve(__dirname, '../../tcm-agent');
const OUT = path.join(__dirname, '../training-data/sft-tcm-engine-distill.jsonl');

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
        source: 'distill-tcm-agent-v4',
        module: module,
        distilled_at: '2026-08-09'
    };
}

// ═══════════════════════════════════════════
// 1. SYNDROME ENGINE — 多流派辨证
// ═══════════════════════════════════════════
try {
    const engine = require(path.join(TCM_AGENT, 'server/engines/syndrome-engine.js'));
    console.log('[syndrome] exports:', Object.keys(engine));
    
    // CLASSICS
    if (engine.CLASSICS) {
        for (const [key, info] of Object.entries(engine.CLASSICS)) {
            pairs.push(makeChat(
                TCM_SYSTEM,
                `请介绍${info.name}派的核心辨证要点和代表性方剂。`,
                `【${info.name}】（${info.author}）\n辨证关键词：${info.keywords.join(', ')}\n权重系数：${info.weight}\n核心思路：${info.name}以${info.keywords[0]}为核心辨证纲领，通过${info.keywords.slice(0,3).join('、')}等维度进行辨证分型，指导方剂选择与剂量调整。`,
                'syndrome-engine'
            ));
        }
    }
    
    // TONGUE_PATTERNS
    if (engine.TONGUE_PATTERNS) {
        const tp = engine.TONGUE_PATTERNS;
        for (const [tongue, refs] of Object.entries(tp)) {
            const refTexts = refs.map(r => `${r.classic}：${r.ref}`).join('\n');
            pairs.push(makeChat(
                TCM_SYSTEM,
                `舌象${tongue}的辨证意义是什么？请引用经典出处。`,
                `【舌象：${tongue}】\n经典辨证依据：\n${refTexts}`,
                'syndrome-engine'
            ));
        }
    }
    
    // FORMULA_SYNDROME_MAP
    if (engine.FORMULA_SYNDROME_MAP) {
        pairs.push(makeChat(
            TCM_SYSTEM,
            '请列出所有证型对应的方剂（formula-syndrome map）。',
            '【证型-方剂对应总表】：\n' + 
            Object.entries(engine.FORMULA_SYNDROME_MAP).map(([syndrome, info]) => 
                `- ${syndrome} → ${info.formula}（${info.source}）\n  主症：${info.symptoms?.join('、') || ''}`
            ).join('\n'),
            'syndrome-engine'
        ));
        
        // Each syndrome individually
        for (const [syndrome, info] of Object.entries(engine.FORMULA_SYNDROME_MAP)) {
            pairs.push(makeChat(
                TCM_SYSTEM,
                `证型"${syndrome}"如何辨证？代表方剂是哪个？加减法有哪些？`,
                `【${syndrome}】\n代表方剂：${info.formula}（${info.source}）\n主症：${(info.symptoms||[]).join('、')}\n舌象：${info.tongue||''}\n加减法：${info.modifications ? JSON.stringify(info.modifications) : '标准方'}`
            + '\n注：AI辅助参考，需执业医师结合四诊确认。',
                'syndrome-engine'
            ));
        }
    }
    
    console.log(`  ✓ syndrome-engine: +${pairs.length} total so far`);
} catch (e) {
    console.error('[syndrome] error:', e.message);
}

// ═══════════════════════════════════════════
// 2. CLASSICS ENGINE
// ═══════════════════════════════════════════
try {
    const engine = require(path.join(TCM_AGENT, 'server/engines/classics-engine.js'));
    const start = pairs.length;
    
    if (engine.CLASSICS_KB) {
        const ckb = engine.CLASSICS_KB;
        
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
                    `【${name}】\n出处：${info.source || '经典'}\n特征：${info.description || info.text || ''}\n鉴别要点：${(info.distinguishing_features || info.distinguish || []).join('、')}`,
                    'classics-engine'
                ));
            }
        }
        
        if (ckb.herbs) {
            for (const [name, info] of Object.entries(ckb.herbs)) {
                pairs.push(makeChat(
                    TCM_SYSTEM,
                    `请介绍中药${name}的性味归经和功效。`,
                    `【${name}】\n出处：${info.source || '本草'}\n性味：${info.nature || ''} ${info.flavor || ''}\n归经：${info.meridian || ''}\n功效：${info.effect || info.efficacy || ''}\n用法用量：${info.dosage || ''}`,
                    'classics-engine'
                ));
            }
        }
    }
    console.log(`  ✓ classics-engine: +${pairs.length - start}`);
} catch (e) {
    console.error('[classics] error:', e.message);
}

// ═══════════════════════════════════════════
// 3. DRUG SAFETY ENGINE — 顶级导出
// ═══════════════════════════════════════════
try {
    const engine = require(path.join(TCM_AGENT, 'server/engines/drug-safety-engine.js'));
    const start = pairs.length;
    
    const safetyKeys = [
        ['十八反', 'eighteenAntagonism'],
        ['十九畏', 'nineteenFear'],
        ['妊娠禁忌', 'pregnancyForbidden'],
        ['毒性药用量警戒', 'toxicLimit'],
        ['老年人用药注意', 'elderlyCaution'],
        ['儿童用药注意', 'childrenCaution'],
    ];
    
    for (const [label, key] of safetyKeys) {
        if (engine[key] && typeof engine[key] === 'object') {
            pairs.push(makeChat(
                TCM_SYSTEM + '\n\n【处方安全】必须校验禁忌。',
                `中药${label}是什么？请完整列出。`,
                `【${label}】：\n` + Object.entries(engine[key]).map(([k,v]) => `- ${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n') + '\n\n注：处方时必须交叉校验。',
                'drug-safety-engine'
            ));
        }
    }
    console.log(`  ✓ drug-safety-engine: +${pairs.length - start}`);
} catch (e) {
    console.error('[drug-safety] error:', e.message);
}

// ═══════════════════════════════════════════
// 4. DOSAGE ENGINE — 内嵌常量需提取源码
// ═══════════════════════════════════════════
try {
    const start = pairs.length;
    
    // 从源码提取 ADULT_BASE / CHILD_BASE
    const code = fs.readFileSync(path.join(TCM_AGENT, 'server/engines/dosage-engine.js'), 'utf-8');
    const adultM = code.match(/ADULT_BASE\s*=\s*\{([^}]+)\}/);
    const childM = code.match(/CHILD_BASE\s*=\s*\{([^}]+)\}/);
    
    if (adultM && childM) {
        pairs.push(makeChat(
            TCM_SYSTEM + '\n\n【剂量计算】根据患者情况计算个性化剂量。',
            '中药成人基准剂量和儿童剂量范围是多少？如何根据患者情况调整？',
            `【成人基准剂量】：${adultM[1].trim()}\n` +
            `【儿童基准剂量】：${childM[1].trim()}\n\n` +
            '个性化剂量调整因素：\n' +
            '1. 体重：每增加10kg，剂量递增5%~10%\n' +
            '2. 体质：虚弱减量20%~30%\n' +
            '3. 年龄：儿童按体重折算，老年人减量15%~25%\n' +
            '4. 肝肾功能：异常者减量30%~50%\n' +
            '5. 合并症：调整活血/补益类药物剂量\n' +
            '6. 毒性药物：严格控制在安全范围内\n\n注：AI 仅为辅助参考，实际剂量由执业医师确定。',
            'dosage-engine'
        ));
    }
    
    // Extract calcDosage function logic
    const funcMatch = code.match(/function\s+calcDosage\s*\([^)]*\)\s*\{([\s\S]*?)(?=\nfunction|\nmodule\.exports|$)/);
    if (funcMatch) {
        const body = funcMatch[1].trim().substring(0, 600);
        pairs.push(makeChat(
            TCM_SYSTEM + '\n\n【剂量计算】',
            '中药剂量计算的 calcDosage 函数的工作逻辑是什么？',
            `【calcDosage 剂量算法】：\n${body}\n\n注：此算法为AI辅助参考。`,
            'dosage-engine'
        ));
    }
    
    console.log(`  ✓ dosage-engine: +${pairs.length - start}`);
} catch (e) {
    console.error('[dosage] error:', e.message);
}

// ═══════════════════════════════════════════
// 5. COMPLIANCE ENGINE
// ═══════════════════════════════════════════
try {
    const engine = require(path.join(TCM_AGENT, 'server/engines/compliance-engine.js'));
    const start = pairs.length;
    
    if (engine.REGULATIONS) {
        pairs.push(makeChat(
            TCM_SYSTEM + '\n\n【合规边界】AI辅助诊断的合规铁律。',
            '中医AI辅助诊断需要遵守哪些合规法规？',
            '【合规法规】：\n' + Object.entries(engine.REGULATIONS).map(([k,v]) => `- ${k} (${v.name}): ${v.basis}`).join('\n') + '\n\n核心原则：知情同意+最小必要+可解释性+人工审核+数据安全。',
            'compliance-engine'
        ));
    }
    console.log(`  ✓ compliance-engine: +${pairs.length - start}`);
} catch (e) {
    console.error('[compliance] error:', e.message);
}

// ═══════════════════════════════════════════
// 6. CHRONIC DISEASE ENGINE
// ═══════════════════════════════════════════
try {
    const engine = require(path.join(TCM_AGENT, 'server/engines/chronic-disease-engine.js'));
    const start = pairs.length;
    
    if (engine.CHRONIC_DISEASES) {
        for (const [code, disease] of Object.entries(engine.CHRONIC_DISEASES)) {
            const name = disease.name;
            const aliases = (disease.aliases || []).join(', ');
            const patterns = disease.patternProfile || [];
            
            // Disease overview
            pairs.push(makeChat(
                TCM_SYSTEM + '\n\n【慢病管理】',
                `${name}（${aliases}）的中医辨证要点和管理方案是什么？`,
                `【${name}】\n别名：${aliases}\n科室：${disease.department || ''}\n辨证分型（共${patterns.length}型）：\n` + patterns.map((p, i) => `  ${i+1}. ${p.syndrome}（${p.formula||''}）`).join('\n'),
                'chronic-disease-engine'
            ));
            
            // Each pattern
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
                    `【${name}用药时间表】：\n` + disease.medSchedule.map(m => `- ${m.time}: ${m.drug} (${m.type}) - ${m.note}`).join('\n'),
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
                        `【${name}饮食调护】：\n原则：${ls.diet.principle||''}\n推荐：${(ls.diet.recommend||[]).join('、')}\n避免：${(ls.diet.avoid||[]).join('、')}`,
                        'chronic-disease-engine'
                    ));
                }
                if (ls.exercise) {
                    pairs.push(makeChat(
                        TCM_SYSTEM + '\n\n【慢病管理】',
                        `${name}患者的运动建议？`,
                        `【${name}运动建议】：\n原则：${ls.exercise.principle||''}\n推荐：${(ls.exercise.recommend||[]).join('、')}\n避免：${(ls.exercise.avoid||[]).join('、')}\n警告：${ls.exercise.warning||''}`,
                        'chronic-disease-engine'
                    ));
                }
                if (ls.sleep) {
                    pairs.push(makeChat(
                        TCM_SYSTEM + '\n\n【慢病管理】',
                        `${name}患者的睡眠调护建议？`,
                        `【${name}睡眠调护】：\n原则：${ls.sleep.principle||''}\n推荐：${(ls.sleep.recommend||[]).join('、')}\n避免：${(ls.sleep.avoid||[]).join('、')}`,
                        'chronic-disease-engine'
                    ));
                }
            }
        }
    }
    console.log(`  ✓ chronic-disease-engine: +${pairs.length - start}`);
} catch (e) {
    console.error('[chronic-disease] error:', e.message);
}

// ═══════════════════════════════════════════
// 7. PULSE ENGINE
// ═══════════════════════════════════════════
try {
    const engine = require(path.join(TCM_AGENT, 'server/engines/pulse-engine.js'));
    const start = pairs.length;
    
    if (engine.PULSE_KB) {
        const pkb = engine.PULSE_KB;
        if (pkb.pulses) {
            pairs.push(makeChat(
                TCM_SYSTEM + '\n\n【脉诊】28脉象辨识。',
                '请介绍28种脉象的特征和主病。',
                '【28脉象辨识】：\n' + Object.entries(pkb.pulses).map(([name, info]) => 
                    `- ${name}：${info.force || info.rateText || ''} | 主病：${info.scene || info.related?.join('、') || ''}`
                ).join('\n'),
                'pulse-engine'
            ));
            
            // Each pulse individually
            for (const [name, info] of Object.entries(pkb.pulses)) {
                pairs.push(makeChat(
                    TCM_SYSTEM + '\n\n【脉诊】',
                    `脉象"${name}"的特征、主病和鉴别要点是什么？`,
                    `【${name}脉象】：\n` + Object.entries(info).map(([k,v]) => `- ${k}: ${Array.isArray(v) ? v.join('、') : v}`).join('\n'),
                    'pulse-engine'
                ));
            }
        }
        if (pkb.positions) {
            pairs.push(makeChat(
                TCM_SYSTEM + '\n\n【脉诊】',
                '寸关尺三部脉诊的脏腑对应关系是什么？',
                '【寸关尺三部脉诊】：\n' + Object.entries(pkb.positions).map(([pos, organs]) => 
                    `${pos}（${organs.side || ''}）：${(organs.organs || []).join('、')}`
                ).join('\n'),
                'pulse-engine'
            ));
        }
    }
    console.log(`  ✓ pulse-engine: +${pairs.length - start}`);
} catch (e) {
    console.error('[pulse] error:', e.message);
}

// ═══════════════════════════════════════════
// 8. CONSTITUTION ENGINE
// ═══════════════════════════════════════════
try {
    const engine = require(path.join(TCM_AGENT, 'server/engines/constitution-engine.js'));
    const start = pairs.length;
    
    if (engine.CONSTITUTIONS) {
        for (const [key, info] of Object.entries(engine.CONSTITUTIONS)) {
            pairs.push(makeChat(
                TCM_SYSTEM + '\n\n【体质辨识】九种体质辨识。',
                `${info.name}体质的特征辨识要点和调理原则是什么？`,
                `【${info.name}体质】：\n特征：${(info.features||[]).join('、')}\n倾向：${info.tendency||''}\n调理：${info.care||''}`,
                'constitution-engine'
            ));
        }
    }
    console.log(`  ✓ constitution-engine: +${pairs.length - start}`);
} catch (e) {
    console.error('[constitution] error:', e.message);
}

// ═══════════════════════════════════════════
// 9. MULTIMODAL FUSION
// ═══════════════════════════════════════════
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
// 10. 倪海厦经典知识
// ═══════════════════════════════════════════
pairs.push(makeChat(
    TCM_SYSTEM,
    '倪海厦人纪体系的针灸五门十变是什么？',
    '【倪海厦 · 针灸五门十变】\n\n' +
    '五门十变是倪师针灸学的核心体系：\n\n' +
    '1. 井木肝（大敦）→ 荣火心（少府）→ 俞土脾（太白）→ 经金肺（经渠）→ 合水肾（阴谷）\n' +
    '2. 胆（窍阴）→ 小肠（少泽）→ 胃（陷谷）→ 大肠（阳溪）→ 膀胱（委中）\n' +
    '3. 肝（大敦）→ 心包（劳宫）→ 三焦（中渚）→ 肺（太渊）→ 肾（复溜）\n' +
    '4. 胆（侠溪）→ 小肠（前谷）→ 胃（冲阳）→ 大肠（三间）→ 膀胱（昆仑）\n' +
    '5. 肝（行间）→ 小肠（后溪）→ 胃（解溪）→ 大肠（曲池）→ 膀胱（至阴）\n\n' +
    '应用：通过五门十变，可一针透多穴、一穴调多经。',
    'nihaisha-acupuncture'
));

pairs.push(makeChat(
    TCM_SYSTEM,
    '倪海厦讲授的伤寒论六经辨证核心框架是什么？',
    '【倪海厦 · 伤寒论六经辨证框架】\n\n' +
    '太阳经：脉浮、头项强痛、恶寒；伤寒（麻黄汤证）/ 中风（桂枝汤证）\n\n' +
    '阳明经：胃家实、身热汗出、不恶寒反恶热；白虎汤证 / 承气汤证\n\n' +
    '少阳经：口苦、咽干、目眩、往来寒热、胸胁苦满；小柴胡汤证\n\n' +
    '太阴经：腹满而吐、食不下；理中汤证\n\n' +
    '少阴经：脉微细、但欲寐；附子汤证（寒化）/ 黄连阿胶汤证（热化）\n\n' +
    '厥阴经：消渴、气上撞心、心中疼热、饥不欲食；乌梅丸证\n\n' +
    '注：此为倪海厦人纪伤寒论课程框架，供学习参考。',
    'nihaisha-shanghanlun'
));

// ═══════════════════════════════════════════
// Write output
// ═══════════════════════════════════════════
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, pairs.map(p => JSON.stringify(p)).join('\n') + '\n');

console.log(`\n${'='.repeat(60)}`);
console.log(`Total distilled pairs: ${pairs.length}`);
console.log(`Output: ${OUT}`);
console.log(`${'='.repeat(60)}\n`);

const counts = {};
for (const p of pairs) {
    const m = p.module;
    counts[m] = (counts[m] || 0) + 1;
}
console.log('Breakdown by module:');
for (const [m, c] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${m}: ${c}`);
}
console.log(`\nTotal modules: ${Object.keys(counts).length}`);