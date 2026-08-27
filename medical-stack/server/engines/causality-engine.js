/**
 * 命理宝鉴·医道 · 因果归因引擎 v1.0
 * 症状→方剂→疗效 三段式因果链
 */
const CAUSALITY_KB = {
  // 路径
  paths: [
    {
      syndrome: '心脾两虚',
      symptom_chain: ['失眠','心悸','健忘','纳呆'],
      mechanism: '心血不足+脾气虚弱 → 心神失养',
      formula: '归脾汤',
      action_chain: '黄芪+党参 → 补气健脾 → 当归+龙眼肉 → 养血安神 → 酸枣仁+远志 → 安神定志',
      evidence_pmid: '27035928',
      expected_effect: '1-2周改善睡眠·2-4周改善心悸·总有效率92.5%'
    },
    {
      syndrome: '风寒表证',
      symptom_chain: ['恶寒','发热','头痛','无汗'],
      mechanism: '风寒袭表 → 卫阳被遏 → 营卫失调',
      formula: '桂枝汤',
      action_chain: '桂枝+生姜 → 解肌散寒 → 芍药+甘草 → 调和营卫 → 大枣 → 培土固中',
      evidence_pmid: '25888117',
      expected_effect: '1-3剂缓解·恶寒/头痛消失·体温回归'
    },
    {
      syndrome: '肝郁气滞',
      symptom_chain: ['胁胀','易怒','叹气','月经不调'],
      mechanism: '情志不遂 → 肝失疏泄 → 气机郁滞',
      formula: '柴胡疏肝散',
      action_chain: '柴胡 → 疏肝解郁 → 香附+川芎 → 行气活血 → 白芍+枳壳 → 柔肝理气',
      evidence_pmid: null,
      expected_effect: '1周改善胁胀·2周情绪稳定'
    },
    {
      syndrome: '阴虚火旺',
      symptom_chain: ['潮热','盗汗','口干','舌红少苔'],
      mechanism: '阴液亏虚 → 虚火内生 → 灼伤津液',
      formula: '知柏地黄丸',
      action_chain: '知母+黄柏 → 清虚热 → 熟地+山药 → 滋肾阴 → 丹皮+泽泻 → 泄浊',
      evidence_pmid: null,
      expected_effect: '2-4周改善潮热·盗汗减少'
    },
    {
      syndrome: '血瘀',
      symptom_chain: ['刺痛','舌紫','月经血块'],
      mechanism: '气滞/寒凝/外伤 → 血行不畅 → 瘀阻脉络',
      formula: '血府逐瘀汤',
      action_chain: '桃仁+红花 → 活血化瘀 → 当归+川芎 → 养血行气 → 牛膝 → 引瘀下行',
      evidence_pmid: '30539862',
      expected_effect: '1-2周改善刺痛·月经血块减少'
    }
  ]
};

function tracePath(syndrome) {
  return CAUSALITY_KB.paths.find(p => p.syndrome === syndrome) || null;
}

function traceBySymptom(symptoms) {
  const matches = [];
  for (const path of CAUSALITY_KB.paths) {
    const hits = path.symptom_chain.filter(s => symptoms.some(sym => sym.includes(s) || s.includes(sym)));
    if (hits.length > 0) {
      matches.push({ ...path, match_score: hits.length / path.symptom_chain.length, matched: hits });
    }
  }
  return matches.sort((a,b) => b.match_score - a.match_score);
}

module.exports = { CAUSALITY_KB, tracePath, traceBySymptom };
