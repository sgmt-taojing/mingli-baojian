/**
 * 命理宝鉴·医道 · 临床路径引擎 v1.0
 * 病种→路径→预期时间→疗效指标
 */
const PATHWAYS = {
  '高血压': {
    stages: [
      { day: 1, action: '首诊·四诊合参·评估分级', items: ['血压测量','辨证','风险评估'], output: '辨证结果+初步方案' },
      { day: 3, action: '复诊·调整方剂', items: ['血压复查','副作用评估'], output: '调整后处方' },
      { day: 7, action: '短期疗效评估', items: ['血压趋势','症状变化'], output: '疗效判定' },
      { day: 14, action: '中期评估', items: ['24h动态血压','肝肾功能'], output: '继续/调整' },
      { day: 30, action: '远期疗效', items: ['血压达标率','症状改善'], output: '标准化治疗' }
    ],
    expected_outcome: '4周血压达标率70%+',
    followup_interval: '14 days'
  },
  '失眠': {
    stages: [
      { day: 1, action: '首诊·辨证分型', items: ['睡眠日记','辨证','焦虑抑郁量表'], output: '辨证+基础方案' },
      { day: 7, action: '复诊', items: ['睡眠改善','副作用'], output: '调整方案' },
      { day: 14, action: '中期评估', items: ['PSQI评分','入睡时间'], output: '阶段性判定' },
      { day: 28, action: '月度评估', items: ['总有效率','复发率'], output: '继续/换方' }
    ],
    expected_outcome: '4周PSQI改善50%+',
    followup_interval: '7 days'
  },
  '慢性胃炎': {
    stages: [
      { day: 1, action: '首诊·辨证', items: ['胃镜','幽门螺杆菌','辨证'], output: '辨证+方案' },
      { day: 14, action: '症状评估', items: ['胃痛/反酸','饮食'], output: '调整方案' },
      { day: 30, action: '中期评估', items: ['症状评分','复查'], output: '继续/调整' },
      { day: 90, action: '疗程评估', items: ['胃镜复查','Hp'], output: '疗效判定' }
    ],
    expected_outcome: '3月有效率85%+',
    followup_interval: '14 days'
  }
};

function getPathway(disease) {
  return PATHWAYS[disease] || null;
}

function matchBySymptoms(symptoms) {
  const mapping = {
    '高血压': ['头痛','眩晕','心悸','耳鸣'],
    '失眠': ['失眠','心悸','健忘','多梦'],
    '慢性胃炎': ['胃痛','反酸','嗳气','腹胀']
  };
  const matches = [];
  for (const [disease, syms] of Object.entries(mapping)) {
    const hits = syms.filter(s => symptoms.some(x => x.includes(s) || s.includes(x)));
    if (hits.length > 0) matches.push({ disease, match_score: hits.length / syms.length, pathway: PATHWAYS[disease] });
  }
  return matches.sort((a,b)=>b.match_score-a.match_score);
}

module.exports = { PATHWAYS, getPathway, matchBySymptoms };
