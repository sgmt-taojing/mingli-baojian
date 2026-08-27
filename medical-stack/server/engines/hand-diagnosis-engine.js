/**
 * ═══════════════════════════════════════════════════════════════
 *  hand-diagnosis-engine.js — 手诊辨证规则引擎（R760 技能化）
 *  来源：手相手纹手诊（华龄出版社）381 页 OCR 蒸馏 · 多轮学习校正
 *  26 条 KB 知识 → 规则化映射（特征 → 证候/脏腑/建议）
 *
 *  能力：
 *   1. analyze(features) — 输入手诊特征（掌色/纹/甲/温），输出辨证结果
 *   2. match(featureText) — 单特征匹配（AI 助手问答用）
 *   3. getKnowledge() — 返回知识源清单
 *
 *  用法：
 *   const HandDiag = require('./hand-diagnosis-engine.js');
 *   HandDiag.analyze({ palmColor: '苍白', nailShape: '凹甲', lines: ['链状'] });
 * ═══════════════════════════════════════════════════════════════
 */
'use strict';

// ── 特征→证候 规则库（从 26 条蒸馏知识提炼）──

// 1. 掌色规则
const PALM_COLOR_RULES = [
  { feature: /苍白|淡白|惨白|萎白/, syndrome: '气血亏虚', dept: '内科', advice: '多见于贫血、低血压、气血不足；建议查血常规、补充营养' },
  { feature: /红赤|鲜红/, syndrome: '血热/内热', dept: '内科', advice: '多见于高血压、发热、内热亢盛；建议测量血压' },
  { feature: /发黄|黄/, syndrome: '湿热/黄疸', dept: '消化', advice: '提示肝胆湿热或黄疸可能；建议查肝功能' },
  { feature: /青紫|发青/, syndrome: '寒凝/血瘀', dept: '心血管', advice: '多见于循环障碍、寒凝经脉；建议查循环功能' },
  { feature: /紫暗|发紫/, syndrome: '血瘀/缺氧', dept: '心血管', advice: '提示血瘀或缺氧；建议查血氧和循环' },
  { feature: /发黑|黑/, syndrome: '肾虚/重证', dept: '肾科', advice: '多见于肾虚或危重病证；建议全面体检' },
];

// 2. 掌纹规则（主线/地纹/人纹）
const LINE_RULES = [
  { feature: /地纹.{0,4}(岛形|岛纹)/, syndrome: '脏腑功能减弱', dept: '内科', advice: '地纹岛形纹提示相应脏腑功能减弱或慢性消耗性疾病' },
  { feature: /地纹.{0,4}链状/, syndrome: '消化/免疫失调', dept: '消化', advice: '链状地纹提示消化吸收功能或免疫功能紊乱' },
  { feature: /地纹.{0,4}断续/, syndrome: '体质虚弱', dept: '内科', advice: '断续地纹提示体质虚弱或大病后恢复期' },
  { feature: /人纹.{0,4}(断续|蛇行)/, syndrome: '神经功能失调', dept: '神经', advice: '人纹异常提示神经系统功能失调，注意头痛失眠' },
  { feature: /人纹.{0,4}(短细|过短)/, syndrome: '先天禀赋不足', dept: '神经', advice: '短细人纹提示先天禀赋不足，注意神经系统保健' },
  { feature: /健康线.{0,4}断裂/, syndrome: '抵抗力下降', dept: '内科', advice: '健康线断裂提示抵抗力下降或疲劳过度' },
  { feature: /掌纹.{0,4}(凌乱|杂乱)/, syndrome: '脏腑功能失调', dept: '内科', advice: '掌纹凌乱提示多脏腑功能失调，建议系统调理' },
];

// 3. 指甲规则
const NAIL_RULES = [
  { feature: /凹甲|凹陷/, syndrome: '气血两虚', dept: '内科', advice: '凹甲提示气血两虚，常见于贫血、营养不良' },
  { feature: /纵裂甲|纵纹/, syndrome: '肝血不足', dept: '内科', advice: '纵裂甲提示肝血不足或过度疲劳，注意休息' },
  { feature: /横裂甲|横纹/, syndrome: '营养障碍', dept: '内科', advice: '横纹甲提示阶段性营养障碍或疾病消耗' },
  { feature: /勺形甲|匙状/, syndrome: '缺铁性贫血', dept: '内科', advice: '匙状甲（反甲）常见于缺铁性贫血，建议查血常规' },
  { feature: /杵状甲|鼓槌/, syndrome: '心肺疾患', dept: '呼吸', advice: '杵状甲提示慢性心肺疾患（如慢阻肺、先心病），建议心肺检查' },
  { feature: /半月弧.{0,3}(消失|缩小)/, syndrome: '气血不足', dept: '内科', advice: '半月弧消失或缩小提示气血不足、循环欠佳' },
  { feature: /半月弧.{0,3}过大/, syndrome: '内热/甲亢', dept: '内分泌', advice: '半月弧过大可见于甲状腺功能亢进或内热体质' },
];

// 4. 小儿指纹规则
const PEDIATRIC_RULES = [
  { feature: /风关/, syndrome: '病邪在表', dept: '儿科', advice: '指纹达风关提示病邪在表，病情较轻' },
  { feature: /气关/, syndrome: '病邪在里', dept: '儿科', advice: '指纹达气关提示病邪入里，病情加重' },
  { feature: /命关/, syndrome: '病邪深重', dept: '儿科', advice: '指纹达命关提示病邪深重，需及时就医' },
  { feature: /透关射甲/, syndrome: '危重病证', dept: '儿科', advice: '透关射甲为小儿指纹危重征象，须立即就医' },
  { feature: /指纹.{0,4}(鲜红)/, syndrome: '外感风寒', dept: '儿科', advice: '指纹鲜红提示外感风寒' },
  { feature: /指纹.{0,4}(紫红)/, syndrome: '里热证', dept: '儿科', advice: '指纹紫红提示里热炽盛' },
  { feature: /指纹.{0,4}(淡白)/, syndrome: '气血虚', dept: '儿科', advice: '指纹淡白提示气血不足' },
];

// 5. 手型/温度/湿度规则
const OTHER_RULES = [
  { feature: /手.{0,3}(冰凉|冷)/, syndrome: '阳虚/末梢循环差', dept: '内科', advice: '手凉提示阳虚或末梢循环不良，注意保暖' },
  { feature: /手.{0,3}(发热|烫)/, syndrome: '阴虚/内热', dept: '内科', advice: '手热提示阴虚内热或发热，注意体温' },
  { feature: /手.{0,3}汗多/, syndrome: '气虚/湿热', dept: '内科', advice: '手汗多提示气虚不固或湿热内蕴' },
  { feature: /(并指|多指|短指)/, syndrome: '先天畸形', dept: '骨科', advice: '手部先天畸形建议专科评估' },
  { feature: /第二掌骨.{0,4}(压痛|敏感)/, syndrome: '相应脏腑失调', dept: '内科', advice: '第二掌骨桡侧压痛对应全息穴位，提示相应脏腑功能失调' },
  // R760 第6轮深化：地纹分叉/健康线/肺区/指纹白线等高频特征
  { feature: /地纹.{0,4}(分叉|叉)/, syndrome: '生殖/泌尿功能减退', dept: '肾科', advice: '地纹下段分叉提示生殖泌尿功能减退，注意补肾固本' },
  { feature: /健康线.{0,4}(断裂|断)/, syndrome: '抵抗力下降', dept: '内科', advice: '健康线断裂提示抵抗力下降或疲劳过度，注意劳逸结合' },
  { feature: /肺区.{0,4}(红白|红)/, syndrome: '肺热/上呼吸道炎症', dept: '呼吸', advice: '手诊肺区红白提示上呼吸道炎症或肺热，建议查肺功能' },
  { feature: /半月弧.{0,3}(过大|大)/, syndrome: '内热/甲亢倾向', dept: '内分泌', advice: '半月弧过大可见于甲状腺功能亢进或内热体质' },
  { feature: /(指纹|指嵴纹).{0,4}(白线|发育不良)/, syndrome: '体质偏弱', dept: '内科', advice: '指纹白线或嵴纹发育不良提示体质偏弱，注意增强免疫' },
];

// ── 核心 API ──

/** 多特征综合分析（视觉识别结果 → 辨证） */
function analyze(features) {
  features = features || {};
  const input = [
    features.palmColor || '', features.nailShape || '',
    (features.lines || []).join('、'), features.palmTemp || '',
    features.palmSweat || '', features.fingerprint || '',
    features.pediatricFingerprint || '', features.other || ''
  ].filter(Boolean).join(' ');
  return match(input);
}

/** 文本特征匹配（AI 助手问答 / 视觉特征词） */
function match(text) {
  if (!text || typeof text !== 'string') return { ok: false, matched: [] };
  const allRules = [...PALM_COLOR_RULES, ...LINE_RULES, ...NAIL_RULES, ...PEDIATRIC_RULES, ...OTHER_RULES];
  const matched = [];
  for (const r of allRules) {
    if (r.feature.test(text)) {
      matched.push({
        feature: r.feature.source,
        syndrome: r.syndrome,
        dept: r.dept,
        advice: r.advice
      });
    }
  }
  return { ok: matched.length > 0, matched, text, matchedCount: matched.length };
}

/** 知识源清单 */
function getKnowledge() {
  return {
    source: '手相手纹手诊(华龄出版社)OCR蒸馏·多轮校正',
    entries: 26,
    domains: ['掌色', '掌纹', '指甲', '小儿指纹', '手型', '手温手汗', '肤纹学', '九宫八卦', '全息穴位'],
    version: '1.0.0'
  };
}

module.exports = { analyze, match, getKnowledge, PALM_COLOR_RULES, LINE_RULES, NAIL_RULES, PEDIATRIC_RULES };
