// 多轮追问收窄引擎: 基于首轮诊断 → 询问关键鉴别症状 → 输出收窄后的诊断
// 知识源: 自有 KB（distilled-patterns + tcm-classics）

const KB = require('./tcm-kb-core.js');

// 主流证型 → 鉴别症状映射（基于《中医内科学》《伤寒论》《中医诊断学》）
const REFINEMENT_QUESTIONS = {
  '心脾两虚': [
    { q: '是否伴有食欲不振？', options: ['明显减退', '稍有', '正常'] },
    { q: '大便是否溏薄？', options: ['经常', '偶尔', '正常'] }
  ],
  '肝阳上亢': [
    { q: '头痛是胀痛还是刺痛？', options: ['胀痛', '刺痛', '隐痛'] },
    { q: '是否面红目赤？', options: ['明显', '轻微', '不显'] }
  ],
  '肝胃不和': [
    { q: '胃痛与情绪关系？', options: ['明显', '略有', '无关'] },
    { q: '是否反酸嗳气？', options: ['频繁', '偶尔', '没有'] }
  ],
  '风寒咳嗽': [
    { q: '痰色？', options: ['白稀', '白黏', '黄黏'] },
    { q: '咽痒否？', options: ['明显', '轻微', '不痒'] }
  ],
  '心气虚': [
    { q: '活动后症状加重？', options: ['明显', '一般', '不变'] },
    { q: '是否自汗？', options: ['明显', '偶尔', '没有'] }
  ]
};

// 收窄规则: 主症状匹配 → 候选证型打分
function refine(complaint, initialSyndrome, refinementAnswers) {
  const patterns = KB.patterns || [];
  
  let candidateScores = {};
  // 基础分 = initialSyndrome
  candidateScores[initialSyndrome] = 1.0;
  
  // 从 distilled-patterns 找相似 pattern 提权
  const matches = patterns.filter(p => 
    p.syndrome === initialSyndrome && 
    p.evidence_patients >= 2
  );
  for (const m of matches.slice(0, 3)) {
    candidateScores[initialSyndrome] = Math.min(1.0, 
      candidateScores[initialSyndrome] + m.evidence_patients * 0.05
    );
  }
  
  // 答案映射: 收窄
  if (initialSyndrome === '心脾两虚' && refinementAnswers) {
    const [食欲, 大便] = refinementAnswers;
    if (食欲 === '明显减退' && 大便 === '经常') {
      candidateScores['心脾两虚'] = 0.95;
      // 提示鉴别
      candidateScores['脾气虚'] = 0.6;
    }
  }
  if (initialSyndrome === '肝阳上亢' && refinementAnswers) {
    const [头痛, 面红] = refinementAnswers;
    if (头痛 === '胀痛' && 面红 === '明显') {
      candidateScores['肝阳上亢'] = 0.95;
      candidateScores['肝火上炎'] = 0.5;
    }
  }
  if (initialSyndrome === '肝胃不和' && refinementAnswers) {
    const [情绪, 反酸] = refinementAnswers;
    if (情绪 === '明显' && 反酸 === '频繁') {
      candidateScores['肝胃不和'] = 0.95;
      candidateScores['脾胃湿热'] = 0.5;
    }
  }
  if (initialSyndrome === '风寒咳嗽' && refinementAnswers) {
    const [痰色, 咽痒] = refinementAnswers;
    if (痰色 === '白稀' && 咽痒 === '明显') {
      candidateScores['风寒咳嗽'] = 0.95;
      candidateScores['痰湿阻肺'] = 0.5;
    }
  }
  if (initialSyndrome === '心气虚' && refinementAnswers) {
    const [活动, 自汗] = refinementAnswers;
    if (活动 === '明显' && 自汗 === '明显') {
      candidateScores['心气虚'] = 0.95;
      candidateScores['心阳虚'] = 0.6;
    }
  }
  
  // 转数组
  const refined = Object.entries(candidateScores)
    .sort((a, b) => b[1] - a[1])
    .map(([syndrome, score]) => ({ syndrome, confidence: Math.round(score * 100) / 100 }));
  
  return { ok: true, complaint, initialSyndrome, refined, topSyndrome: refined[0].syndrome };
}

function getRefinementQuestions(syndrome) {
  return REFINEMENT_QUESTIONS[syndrome] || [];
}

module.exports = { refine, getRefinementQuestions };
