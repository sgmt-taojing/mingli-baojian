/**
 * 命理宝鉴·医道 · 中医体质辨识引擎 v1.0
 * 标杆: 王琦九种体质 + 中华中医药学会《中医体质分类与判定》ZYYXH/T157-2009
 * 9 种基本体质: 平和/气虚/阳虚/阴虚/痰湿/湿热/血瘀/气郁/特禀
 * 数据源: 自有 KB - 患者体质记录 (KB.patients)
 */
const fs = require('fs');
const path = require('path');

const PATTERNS_FILE = path.join(__dirname, '..', 'kb', 'patient-patterns.json');

// 9 种体质特征表（基于 ZYYXH/T157-2009）
const CONSTITUTIONS = {
  '平和质': {
    name: '平和质', color: '#4CAF50',
    features: ['体态适中', '面色润泽', '精力充沛', '耐寒耐热', '睡眠良好', '二便正常'],
    tendency: '不易患病',
    care: '保持良好生活习惯即可'
  },
  '气虚质': {
    name: '气虚质', color: '#FF9800',
    features: ['容易疲劳', '说话少气无力', '容易感冒', '不耐劳累'],
    tendency: '易患感冒、内脏下垂',
    care: '避免过劳；补气食物如山药、黄芪'
  },
  '阳虚质': {
    name: '阳虚质', color: '#9C27B0',
    features: ['怕冷', '手脚凉', '喜热饮', '大便溏薄'],
    tendency: '易患寒证、关节痛',
    care: '温阳食物如羊肉、生姜；艾灸关元、命门'
  },
  '阴虚质': {
    name: '阴虚质', color: '#F44336',
    features: ['手足心热', '口干咽燥', '喜冷饮', '大便干燥'],
    tendency: '易患失眠、干燥综合征',
    care: '滋阴食物如银耳、百合；少熬夜'
  },
  '痰湿质': {
    name: '痰湿质', color: '#795548',
    features: ['体形肥胖', '面部油腻', '痰多', '舌苔厚腻'],
    tendency: '易患代谢综合征、肥胖',
    care: '化痰祛湿如薏米、冬瓜；运动'
  },
  '湿热质': {
    name: '湿热质', color: '#FF5722',
    features: ['面部油光', '口苦口黏', '烦躁', '小便黄'],
    tendency: '易患痤疮、湿疹、肝胆病',
    care: '清热利湿如绿豆、苦瓜；戒酒'
  },
  '血瘀质': {
    name: '血瘀质', color: '#E91E63',
    features: ['面色晦暗', '易瘀斑', '疼痛固定', '舌质紫暗'],
    tendency: '易患痛证、心脑血管病',
    care: '活血化瘀如山楂、玫瑰花'
  },
  '气郁质': {
    name: '气郁质', color: '#3F51B5',
    features: ['情绪低落', '胸闷叹气', '敏感多虑', '睡眠差'],
    tendency: '易患抑郁、乳腺增生',
    care: '疏肝理气如陈皮、玫瑰；运动旅游'
  },
  '特禀质': {
    name: '特禀质', color: '#00BCD4',
    features: ['过敏体质', '易哮喘', '易过敏', '易对药物/食物过敏'],
    tendency: '易过敏、哮喘、荨麻疹',
    care: '避过敏源；调理免疫如灵芝'
  }
};

// 体质量表（简化版，每条 1-5 分）
const QUESTIONS = [
  { id: 'q1', text: '您容易疲劳吗？', target: '气虚质' },
  { id: 'q2', text: '您怕冷吗（手脚凉）？', target: '阳虚质' },
  { id: 'q3', text: '您手脚心发热/口干吗？', target: '阴虚质' },
  { id: 'q4', text: '您体形偏胖/痰多吗？', target: '痰湿质' },
  { id: 'q5', text: '您面部油光/口苦吗？', target: '湿热质' },
  { id: 'q6', text: '您面色晦暗/有瘀斑吗？', target: '血瘀质' },
  { id: 'q7', text: '您情绪低落/胸闷叹气吗？', target: '气郁质' },
  { id: 'q8', text: '您容易过敏吗？', target: '特禀质' },
  { id: 'q9', text: '您精力充沛/睡眠良好吗？', target: '平和质' }
];

const SCORE_MAP = {
  '没有': 1, '很少': 2, '有时': 3, '经常': 4, '总是': 5
};

function getQuestions() {
  return QUESTIONS.map(q => ({
    id: q.id,
    text: q.text,
    target: q.target,
    options: Object.keys(SCORE_MAP)
  }));
}

function assess(answers) {
  // answers: { q1: '经常', q2: '很少', ... }
  const scores = {};
  for (const [qid, val] of Object.entries(answers)) {
    const q = QUESTIONS.find(x => x.id === qid);
    if (!q) continue;
    const num = SCORE_MAP[val] || 3;
    scores[q.target] = (scores[q.target] || 0) + num;
  }
  
  // 平和质特殊计算: 8 种偏颇体质均不显著 → 平和
  // q9 直接给平和分；偏颇体质得分越低，平和分越高
  const qx = scores['平和'] || 0;
  const biasedScores = Object.entries(scores).filter(([k]) => k !== '平和').map(([,v]) => v);
  const biasedAvg = biasedScores.length > 0 ? (biasedScores.reduce((s,v)=>s+v, 0) / biasedScores.length) : 3;
  // 平和分 = q9原分 + (3 - biasedAvg) * 2 = (5 - biasedAvg)
  const pingheRaw = Math.max(1, Math.min(5, qx + (3 - biasedAvg)));
  scores['平和'] = pingheRaw;

  // 计算转换分
  const results = Object.entries(CONSTITUTIONS).map(([key, c]) => {
    const raw = scores[key] || 0;
    // 单题转换: [(原始分-1)/4]×100
    const transformed = Math.max(0, Math.min(100, Math.round(((raw - 1) / 4) * 100)));
    let judgement = '';
    if (transformed >= 60) judgement = '是';
    else if (transformed >= 40) judgement = '倾向是';
    else judgement = '否';
    
    return {
      constitution: c.name,
      raw_score: raw,
      transformed_score: transformed,
      judgement,
      color: c.color,
      features: c.features,
      tendency: c.tendency,
      care: c.care
    };
  });
  
  results.sort((a, b) => {
    // 平和质排序: 偏颇体质 < 30 时，平和放第一；否则按真实分数排
    const aScore = a.constitution === '平和质' ? (Math.max(...results.filter(r => r.constitution !== '平和质').map(r => r.transformed_score)) < 30 ? a.transformed_score : -1) : a.transformed_score;
    const bScore = b.constitution === '平和质' ? (Math.max(...results.filter(r => r.constitution !== '平和质').map(r => r.transformed_score)) < 30 ? b.transformed_score : -1) : b.transformed_score;
    return bScore - aScore;
  });
  
  return {
    ok: true,
    results,
    primary: results[0],
    summary: `主要体质: ${results[0].constitution}（${results[0].judgement}，${results[0].transformed_score}分）；倾向: ${results.filter(r => r.judgement !== '否').slice(1, 4).map(r => r.constitution).join('、') || '无'}`,
    standard: 'ZYYXH/T157-2009'
  };
}

module.exports = { assess, getQuestions, CONSTITUTIONS };
