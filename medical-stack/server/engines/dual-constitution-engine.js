/**
 * 命理宝鉴·医道 · 双重/兼夹体质辨识引擎 v1.0
 * 标杆吸收: 云诊科技 兼夹体质 + 中医聪宝 智能医共体
 * 标准: ZYYXH/T157-2009 兼夹体质判定逻辑
 */
const {CONSTITUTIONS, assess} = require('./constitution-engine.js');

// 兼夹体质组合（基于临床常见组合 + 王琦兼夹体质理论）
const COMMON_COMBINATIONS = [
  { combo: ['气虚质', '阳虚质'], name: '气阳两虚', tendency: '易患寒证、免疫低下' },
  { combo: ['阴虚质', '气虚质'], name: '气阴两虚', tendency: '易患疲劳、糖尿病' },
  { combo: ['痰湿质', '气虚质'], name: '痰湿+气虚', tendency: '易患肥胖、代谢综合征' },
  { combo: ['湿热质', '阴虚质'], name: '阴虚湿热', tendency: '易患痤疮、口腔溃疡' },
  { combo: ['血瘀质', '气郁质'], name: '气滞血瘀', tendency: '易患痛经、乳腺增生' },
  { combo: ['阳虚质', '血瘀质'], name: '阳虚血瘀', tendency: '易患关节痛、心脑血管' },
  { combo: ['气郁质', '阴虚质'], name: '阴虚气郁', tendency: '易患失眠、焦虑' },
  { combo: ['特禀质', '气虚质'], name: '气虚特禀', tendency: '易过敏、易感冒' }
];

function dualAssess(answers) {
  const base = assess(answers);
  
  // 找出 ≥ 30 分的体质
  const significant = base.results.filter(r => r.transformed_score >= 30 && r.constitution !== '平和质');
  
  let primary = base.primary;
  let secondary = null;
  let combination = null;
  
  if (significant.length >= 2) {
    significant.sort((a, b) => b.transformed_score - a.transformed_score);
    primary = significant[0];
    secondary = significant[1];
    
    // 查找匹配组合
    const found = COMMON_COMBINATIONS.find(c => 
      c.combo.includes(primary.constitution) && c.combo.includes(secondary.constitution)
    );
    if (found) {
      combination = found;
    }
  }
  
  return {
    ok: true,
    primary,
    secondary: secondary || null,
    combination: combination || null,
    significant_constitutions: significant,
    healthy: primary.constitution === '平和质' && significant.length === 0,
    summary: combination 
      ? `主体质: ${primary.constitution}（${primary.transformed_score}分）+ 兼夹: ${secondary.constitution}（${secondary.transformed_score}分）→ 组合体质：${combination.name}（${combination.tendency}）`
      : secondary 
        ? `主体质: ${primary.constitution}（${primary.transformed_score}分）+ 倾向: ${secondary.constitution}（${secondary.transformed_score}分）`
        : base.summary
  };
}

module.exports = { dualAssess, COMMON_COMBINATIONS };
