/**
 * 命理宝鉴·医道 · 舌面诊内生引擎 v1.0
 * 不依赖 GLM-4V；自建 5 维特征 + KB 模式匹配
 * 标杆: 中医舌诊专家系统 / 上海中医药大学舌诊仪
 * 
 * 5 维特征向量:
 *   - 舌色 (color): 淡白/淡红/红/绛/紫暗
 *   - 舌形 (shape): 胖/瘦/齿痕/裂纹/芒刺
 *   - 苔色 (coating_color): 白/黄/灰黑
 *   - 苔质 (coating_quality): 薄/厚/腻/燥/剥
 *   - 湿度 (moisture): 润/干/滑
 */

// 5 维特征到证型映射
const TONGUE_SYNDR_MAP = {
  // 舌色
  '淡白': ['气血虚', '阳虚', '脾虚'],
  '淡红': ['正常', '平和'],
  '红': ['热证', '阴虚火旺', '心火旺'],
  '绛': ['热入营血', '阴虚火旺'],
  '紫暗': ['血瘀', '气滞血瘀'],
  // 舌形
  '胖': ['气虚', '阳虚', '痰湿'],
  '瘦': ['阴虚', '血虚'],
  '齿痕': ['气虚', '脾虚'],
  '裂纹': ['阴虚', '血虚'],
  '芒刺': ['热盛'],
  // 苔色
  '白苔': ['表证', '寒证', '湿证'],
  '黄苔': ['里热', '湿热'],
  '灰黑苔': ['里寒重', '热极', '肾虚'],
  // 苔质
  '薄苔': ['表证', '正常'],
  '厚苔': ['里证', '痰湿', '食积'],
  '腻苔': ['湿浊', '痰饮', '食积'],
  '燥苔': ['津伤', '阴虚', '热盛'],
  '剥苔': ['胃阴虚', '肾阴虚'],
  // 湿度
  '润': ['正常', '津液未伤'],
  '干': ['津伤', '阴虚', '热盛'],
  '滑': ['水湿内停', '阳虚']
};

// 证型 → 推荐方剂
const SYNDROME_FORMULA = {
  '阴虚': ['六味地黄丸', '左归丸', '大补阴丸'],
  '气血虚': ['归脾汤', '八珍汤', '十全大补汤'],
  '阳虚': ['金匮肾气丸', '右归丸', '理中汤'],
  '脾虚': ['四君子汤', '参苓白术散', '六君子汤'],
  '阴虚火旺': ['六味地黄丸', '知柏地黄丸', '大补阴丸'],
  '心火旺': ['导赤散', '泻心汤'],
  '血瘀': ['血府逐瘀汤', '桃红四物汤'],
  '气滞血瘀': ['柴胡疏肝散', '血府逐瘀汤'],
  '热证': ['黄连解毒汤', '白虎汤'],
  '热入营血': ['清营汤', '犀角地黄汤'],
  '痰湿': ['二陈汤', '温胆汤', '苓桂术甘汤'],
  '湿热': ['龙胆泻肝汤', '三仁汤', '茵陈蒿汤'],
  '气虚': ['四君子汤', '补中益气汤', '参苓白术散'],
  '血虚': ['四物汤', '当归补血汤'],
  '表证': ['桂枝汤', '银翘散', '荆防败毒散'],
  '寒证': ['麻黄汤', '桂枝汤', '理中汤'],
  '湿证': ['平胃散', '藿香正气散'],
  '里热': ['白虎汤', '黄连解毒汤'],
  '里寒重': ['四逆汤', '附子理中汤'],
  '热极': ['黄连解毒汤', '清瘟败毒饮'],
  '肾虚': ['六味地黄丸', '金匮肾气丸'],
  '津伤': ['沙参麦冬汤', '增液汤'],
  '热盛': ['白虎汤', '黄连解毒汤'],
  '胃阴虚': ['益胃汤', '沙参麦冬汤'],
  '肾阴虚': ['六味地黄丸', '左归丸'],
  '水湿内停': ['五苓散', '苓桂术甘汤'],
  '食积': ['保和丸', '枳实导滞丸'],
  '痰饮': ['二陈汤', '苓桂术甘汤'],
  '湿浊': ['平胃散', '三仁汤'],
  '津液未伤': ['无需调理'],
  '正常': ['无需调理'],
  '平和': ['无需调理']
};

/**
 * 5 维特征提取 (模拟给真实舌照时的特征, 也可对接 PIL 启发式)
 */
function extractFeatures(imageFeatures) {
  return {
    color: imageFeatures.color || '淡红',
    shape: imageFeatures.shape || '正常',
    coating_color: imageFeatures.coating_color || '白苔',
    coating_quality: imageFeatures.coating_quality || '薄苔',
    moisture: imageFeatures.moisture || '润'
  };
}

/**
 * 5 维特征 → 候选证型 + 评分
 */
function featuresToSyndromes(features) {
  const syndromeScores = {};
  
  // 每维特征记为各种证型的票
  const allCues = [
    features.color, features.shape, 
    features.coating_color, features.coating_quality, features.moisture
  ];
  
  for (const cue of allCues) {
    const syndromes = TONGUE_SYNDR_MAP[cue] || [];
    for (const s of syndromes) {
      syndromeScores[s] = (syndromeScores[s] || 0) + 1;
    }
  }
  
  // 归一化: 满分 5 维
  const syndromes = Object.entries(syndromeScores)
    .map(([s, score]) => ({ syndrome: s, confidence: Math.min(1, score / 5), votes: score }))
    .sort((a, b) => b.votes - a.votes);
  
  return syndromes;
}

/**
 * 证型 → 方剂
 */
function syndromeToFormula(syndrome) {
  return SYNDROME_FORMULA[syndrome] || [];
}

/**
 * 主入口: 舌面诊
 * 接受两种入参:
 *   1) {features: {color, shape, ...}}: 直接给特征
 *   2) {imageBase64: '...'}: 自动 PIL 提取特征 (后续对接)
 */
function diagnose(input) {
  const features = extractFeatures(input.features || input);
  const syndromes = featuresToSyndromes(features);
  
  // 主证型 + 候选方剂
  const primary = syndromes[0] || { syndrome: '待定', confidence: 0 };
  const formulas = syndromeToFormula(primary.syndrome);
  
  // 5 维特征详细解读
  const interpretation = {
    color: `舌色 ${features.color}: ${describeColor(features.color)}`,
    shape: `舌形 ${features.shape}: ${describeShape(features.shape)}`,
    coating_color: `苔色 ${features.coating_color}: ${describeCoatingColor(features.coating_color)}`,
    coating_quality: `苔质 ${features.coating_quality}: ${describeCoatingQuality(features.coating_quality)}`,
    moisture: `湿度 ${features.moisture}: ${describeMoisture(features.moisture)}`
  };
  
  // 给出诊断建议
  const recommendation = {
    primary_syndrome: primary.syndrome,
    confidence: primary.confidence,
    differential: syndromes.slice(0, 5),
    formulas: formulas.slice(0, 3),
    suggestions: generateSuggestions(primary.syndrome, features),
    classical_evidence: getClassicalEvidence(primary.syndrome),
    needs_doctor_review: true
  };
  
  return {
    ok: true,
    model: 'tongue-inhouse-v1',
    features,
    feature_count: Object.keys(features).length,
    interpretation,
    diagnosis: recommendation,
    source: '自有 KB + 规则推理'
  };
}

function describeColor(c) {
  const map = {
    '淡白': '气血两虚,阳虚生寒',
    '淡红': '正常舌象',
    '红': '主热证, 阴虚火旺',
    '绛': '主热入营血或阴虚火旺',
    '紫暗': '主血瘀,气滞血瘀',
    '正常': '气血调和'
  };
  return map[c] || '未知';
}

function describeShape(s) {
  return { '胖': '脾虚湿盛', '瘦': '阴血不足', '齿痕': '脾虚湿困', '裂纹': '阴血亏虚', '芒刺': '热邪亢盛', '正常': '正常' }[s] || '未知';
}

function describeCoatingColor(c) {
  return { '白苔': '主表证寒证', '黄苔': '主里热', '灰黑苔': '主里寒重或热极', '正常': '正常' }[c] || '未知';
}

function describeCoatingQuality(q) {
  return { '薄苔': '表证或正常', '厚苔': '里证痰湿', '腻苔': '湿浊痰饮', '燥苔': '津伤热盛', '剥苔': '胃阴虚', '正常': '正常' }[q] || '未知';
}

function describeMoisture(m) {
  return { '润': '津液未伤', '干': '津伤阴虚', '滑': '水湿内停', '正常': '津液正常' }[m] || '未知';
}

function generateSuggestions(syndrome, features) {
  const tips = [];
  if (syndrome.includes('阳虚')) tips.push('温阳散寒·忌寒凉');
  if (syndrome.includes('阴虚')) tips.push('滋阴清热·忌辛辣');
  if (syndrome.includes('气虚')) tips.push('补气健脾·多休息');
  if (syndrome.includes('血虚')) tips.push('养血安神·多食红枣');
  if (syndrome.includes('湿热')) tips.push('清热利湿·忌油腻');
  if (syndrome.includes('痰湿')) tips.push('化痰祛湿·多运动');
  if (syndrome.includes('血瘀')) tips.push('活血化瘀·多运动');
  if (syndrome.includes('热')) tips.push('清热泻火·多饮温水');
  if (tips.length === 0) tips.push('调理脾胃·饮食有节');
  return tips;
}

function getClassicalEvidence(syndrome) {
  const cls = {
    '阴虚火旺': '《景岳全书》:"阴虚者,水亏也,火动也"',
  '阴虚': '《素问·阴阳应象大论》:"阴虚则内热"',
  '热证': '《伤寒论》阳明篇:"阳明之为病,胃家实是也"',
    '气虚': '《素问·通评虚实论》:"气虚者,肺虚也"',
    '血瘀': '《医林改错》:"血瘀之症,舌紫暗"',
    '阳虚': '《伤寒论》:"阳虚则外寒"',
    '痰湿': '《丹溪心法》:"痰湿之体,舌苔白腻"',
    '湿热': '《温病条辨》:"湿热内蕴,舌苔黄腻"'
  };
  return cls[syndrome] || '《中医诊断学》通用辨证';
}

/**
 * 从 PIL 启发式数据 → 5 维特征（桥接 offline-pil 引擎）
 */
function fromPILFeatures(pilOutput) {
  // pilOutput 形如 {tongue_color: 'red', brightness: 0.7, red_ratio: 0.3, ...}
  const features = {};
  
  // 舌色
  if (pilOutput.tongue_color === 'pale') features.color = '淡白';
  else if (pilOutput.tongue_color === 'light_red') features.color = '淡红';
  else if (pilOutput.tongue_color === 'red') features.color = '红';
  else if (pilOutput.tongue_color === 'purple') features.color = '紫暗';
  else if (pilOutput.tongue_color === 'dark_red') features.color = '绛';
  else features.color = '淡红';
  
  // 苔色
  if (pilOutput.coating_color === 'white') features.coating_color = '白苔';
  else if (pilOutput.coating_color === 'yellow') features.coating_color = '黄苔';
  else if (pilOutput.coating_color === 'gray') features.coating_color = '灰黑苔';
  else features.coating_color = '白苔';
  
  // 苔质 (基于厚度)
  if (pilOutput.coating_thickness === 'thin') features.coating_quality = '薄苔';
  else if (pilOutput.coating_thickness === 'thick') features.coating_quality = '厚苔';
  else if (pilOutput.coating_thickness === 'greasy') features.coating_quality = '腻苔';
  else features.coating_quality = '薄苔';
  
  // 湿度
  if (pilOutput.moisture === 'dry') features.moisture = '干';
  else if (pilOutput.moisture === 'wet') features.moisture = '滑';
  else features.moisture = '润';
  
  // 舌形 (基于纹理)
  features.shape = pilOutput.shape || '正常';
  
  return features;
}

module.exports = { diagnose, extractFeatures, featuresToSyndromes, fromPILFeatures, TONGUE_SYNDR_MAP, SYNDROME_FORMULA };
