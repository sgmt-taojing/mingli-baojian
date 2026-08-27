/**
 * KB Bridge — 知识库模式匹配桥梁
 * V1.0 - 轻量本地启发式（无外部依赖）
 * 用于实时四诊分析中的证型/方剂快速匹配
 */

const KB_PATTERNS = [
  // ========== 舌诊 (10 patterns) ==========
  { match: ['淡白', '白', '薄'], syndrome: '气血两虚', formula: '八珍汤', herbs: ['党参','白术','当归','熟地'], advice: '补益气血', confidence: 0.85, category: 'tongue', ref: 't01' },
  { match: ['淡白', '白', '厚', '腻', '滑'], syndrome: '脾虚湿盛', formula: '参苓白方散', herbs: ['党参','茯苓','白方','山药'], advice: '健脾化湿', confidence: 0.82, category: 'tongue', ref: 't02' },
  { match: ['红', '黄', '薄', '燥'], syndrome: '肺热壅盛', formula: '桑菊饮', herbs: ['桑叶','菊花','杏仁','连翘'], advice: '清热宣肺', confidence: 0.88, category: 'tongue', ref: 't03' },
  { match: ['红', '黄', '厚', '腻', '燥'], syndrome: '脾胃湿热', formula: '黄连温胆汤', herbs: ['黄连','半夏','竹茹','枳实'], advice: '清热化湿', confidence: 0.86, category: 'tongue', ref: 't04' },
  { match: ['绛', '黑', '干燥', '燥'], syndrome: '热入营血', formula: '清营汤', herbs: ['水牛角','生地','玄参','竹叶'], advice: '清营凉血', confidence: 0.92, category: 'tongue', ref: 't05' },
  { match: ['紫暗', '白', '薄', '润'], syndrome: '瘀血内阻', formula: '血府逐瘀汤', herbs: ['桃仁','红花','当归','川芎'], advice: '活血化瘀', confidence: 0.89, category: 'tongue', ref: 't06' },
  { match: ['淡红', '白', '薄', '润'], syndrome: '健康', formula: '无', herbs: [], advice: '舌象常色，脾胃健运', confidence: 0.95, category: 'tongue', ref: 't07' },
  { match: ['淡', '白', '少', '燥'], syndrome: '阴虚内热', formula: '知柏地黄丸', herbs: ['知母','黄柏','熟地','山药'], advice: '滋阴清热', confidence: 0.84, category: 'tongue', ref: 't08' },
  { match: ['胖大', '白', '腻', '滑'], syndrome: '脾阳虚水停', formula: '实脾散', herbs: ['附子','白术','茯苓','厚朴'], advice: '温阳利水', confidence: 0.81, category: 'tongue', ref: 't09' },
  { match: ['齿痕', '白', '薄', '润'], syndrome: '脾气虚', formula: '四君子汤', herbs: ['党参','白术','茯苓','甘草'], advice: '健脾益气', confidence: 0.83, category: 'tongue', ref: 't10' },
  // ========== 面诊 (6 patterns) ==========
  { match: ['潮红', '颊红'], syndrome: '肝阳上亢', formula: '天麻钩藤饮', herbs: ['天麻','钩藤','石决明','牛膝'], advice: '平肝潜阳', confidence: 0.86, category: 'face', ref: 'f01' },
  { match: ['苍白', '唇色淡白'], syndrome: '血虚', formula: '四物汤', herbs: ['当归','熟地','白芍','川芎'], advice: '补血养血', confidence: 0.84, category: 'face', ref: 'f02' },
  { match: ['萎黄', '鼻黄'], syndrome: '脾虚湿困', formula: '香砂六君丸', herbs: ['木香','砂仁','党参','白术'], advice: '健脾化湿', confidence: 0.82, category: 'face', ref: 'f03' },
  { match: ['黧黑', '下巴黑'], syndrome: '肾阳虚', formula: '金匮肾气丸', herbs: ['附子','肉桂','熟地','山药'], advice: '温补肾阳', confidence: 0.88, category: 'face', ref: 'f04' },
  { match: ['晦暗', '印堂暗'], syndrome: '气滞血瘀', formula: '柴胡疏肝散', herbs: ['柴胡','香附','川芎','枳壳'], advice: '疏肝理气活血', confidence: 0.80, category: 'face', ref: 'f05' },
  { match: ['明润'], syndrome: '健康', formula: '无', herbs: [], advice: '面色常色，五脏安和', confidence: 0.95, category: 'face', ref: 'f06' },
  // ========== 眼诊 (5 patterns) ==========
  { match: ['黄染', '淡红'], syndrome: '肝胆湿热', formula: '茵陈蒿汤', herbs: ['茵陈','栀子','大黄'], advice: '清热利湿退黄', confidence: 0.90, category: 'eye', ref: 'e01' },
  { match: ['粗红', '红'], syndrome: '心火亢盛', formula: '导赤散', herbs: ['生地','木通','竹叶','甘草'], advice: '清心泻火', confidence: 0.85, category: 'eye', ref: 'e02' },
  { match: ['青蓝', '暗'], syndrome: '肝风内动', formula: '镇肝熄风汤', herbs: ['怀牛膝','生赭石','生龙骨','生牡蛎'], advice: '镇肝熄风', confidence: 0.87, category: 'eye', ref: 'e03' },
  { match: ['浮肿', '色黑'], syndrome: '脾肾两虚水停', formula: '济生肾气丸', herbs: ['附子','肉桂','牛膝','车前子'], advice: '温肾利水', confidence: 0.83, category: 'eye', ref: 'e04' },
  { match: ['白净', '淡红', '润'], syndrome: '健康', formula: '无', herbs: [], advice: '眼象常色，五轮安和', confidence: 0.95, category: 'eye', ref: 'e05' },
  // ========== 唇诊 (6 patterns) ==========
  { match: ['淡白', '润'], syndrome: '血虚', formula: '四物汤', herbs: ['当归','熟地','白芍','川芎'], advice: '补血养血', confidence: 0.86, category: 'lip', ref: 'l01' },
  { match: ['樱红', '润'], syndrome: '一氧化碳中毒（紧急！）', formula: '急就医', herbs: [], advice: '⚠️ 可能一氧化碳中毒，立即开窗通风，急送医！', confidence: 0.92, category: 'lip', ref: 'l02', urgent: true },
  { match: ['青紫', '润'], syndrome: '血瘀/心阳虚', formula: '桃红四物汤', herbs: ['桃仁','红花','当归','川芎'], advice: '活血化瘀', confidence: 0.88, category: 'lip', ref: 'l03' },
  { match: ['红绛', '干'], syndrome: '热盛伤津', formula: '白虎汤', herbs: ['石膏','知母','粳米','甘草'], advice: '清热生津', confidence: 0.84, category: 'lip', ref: 'l04' },
  { match: ['淡红', '润'], syndrome: '健康', formula: '无', herbs: [], advice: '唇色常色，脾胃健运', confidence: 0.95, category: 'lip', ref: 'l05' },
  { match: ['干裂', '红'], syndrome: '津液亏损', formula: '增液汤', herbs: ['玄参','麦冬','生地'], advice: '增液润燥', confidence: 0.81, category: 'lip', ref: 'l06' },
  // ========== 手诊 (5 patterns) ==========
  { match: ['苍白', '甲色苍白'], syndrome: '气血两虚', formula: '八珍汤', herbs: ['党参','白术','当归','熟地'], advice: '补益气血', confidence: 0.85, category: 'hand', ref: 'h01' },
  { match: ['潮红', '热'], syndrome: '阴虚内热', formula: '知柏地黄丸', herbs: ['知母','黄柏','熟地','山药'], advice: '滋阴清热', confidence: 0.83, category: 'hand', ref: 'h02' },
  { match: ['青紫', '紫暗'], syndrome: '心肺气虚血瘀', formula: '丹参饮', herbs: ['丹参','檀香','砂仁'], advice: '活血祛瘀行气', confidence: 0.86, category: 'hand', ref: 'h03' },
  { match: ['汗出'], syndrome: '气虚自汗', formula: '玉屏风散', herbs: ['黄芪','白术','防风'], advice: '益气固表止汗', confidence: 0.82, category: 'hand', ref: 'h04' },
  { match: ['淡红', '甲色淡红'], syndrome: '健康', formula: '无', herbs: [], advice: '手象常色，气血调和', confidence: 0.95, category: 'hand', ref: 'h05' },
  // ========== 问诊补充 (8 patterns) ==========
  { match: ['失眠', '多梦', '心悸'], syndrome: '心脾两虚', formula: '归脾汤', herbs: ['黄芪','党参','当归','酸枣仁'], advice: '补益心脾', confidence: 0.83, category: 'inquiry', ref: 'q01' },
  { match: ['盗汗', '口干', '烦热'], syndrome: '阴虚火旺', formula: '知柏地黄丸', herbs: ['知母','黄柏','熟地','山药'], advice: '滋阴降火', confidence: 0.85, category: 'inquiry', ref: 'q02' },
  { match: ['畏寒', '四肢凉', '便溏'], syndrome: '脾肾阳虚', formula: '附子理中丸', herbs: ['附子','干姜','党参','白术'], advice: '温阳散寒', confidence: 0.84, category: 'inquiry', ref: 'q03' },
  { match: ['咳嗽', '痰白', '气短'], syndrome: '肺气虚', formula: '补肺汤', herbs: ['黄芪','党参','五味子','紫菀'], advice: '补益肺气', confidence: 0.81, category: 'inquiry', ref: 'q04' },
  { match: ['头晕', '乏力', '萎黄'], syndrome: '气血两虚', formula: '八珍汤', herbs: ['党参','白术','当归','熟地'], advice: '益气补血', confidence: 0.82, category: 'inquiry', ref: 'q05' },
  { match: ['红', '黄', '苔厚'], syndrome: '脾胃湿热', formula: '黄连温胆汤', herbs: ['黄连','半夏','竹茹','枳实'], advice: '清热化湿', confidence: 0.82, category: 'inquiry', ref: 'q06' },
  { match: ['紫暗', '瘀斑'], syndrome: '血瘀', formula: '血府逐瘀汤', herbs: ['桃仁','红花','当归','川芎'], advice: '活血化瘀', confidence: 0.80, category: 'inquiry', ref: 'q07' },
  { match: ['淡白', '胖大'], syndrome: '脾气虚', formula: '四君子汤', herbs: ['党参','白术','茯苓','甘草'], advice: '健脾益气', confidence: 0.85, category: 'inquiry', ref: 'q08' },
];

/**
 * 动态加载 formal KB（蒸馏闭环：审核案例 → 推理可用）
 * 惰性加载 + 60s mtime 缓存，避免每次调用扫描磁盘
 */
let FORMAL_PATTERNS = [];
let FORMAL_SCAN_AT = 0;
function invalidateCache() { FORMAL_PATTERNS = []; FORMAL_SCAN_AT = 0; }
function loadFormalPatterns() {
  const now = Date.now();
  if (now - FORMAL_SCAN_AT < 60000 && FORMAL_SCAN_AT > 0) return FORMAL_PATTERNS;
  FORMAL_SCAN_AT = now;
  try {
    const fs = require('fs');
    const path = require('path');
    const dir = path.join(__dirname, '..', 'kb', 'formal');
    if (!fs.existsSync(dir)) { FORMAL_PATTERNS = []; return FORMAL_PATTERNS; }
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
    const patterns = [];
    for (const f of files) {
      try {
        const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
        let syndrome = d.syndrome || (d.diagnosis && d.diagnosis.syndrome) || '';
        // emr 蒸馏结构（stg-*）：无 syndrome 字段，从 title '症状 · 方药 方' 解析
        let formula = d.formula || '';
        if (!syndrome && d.title && typeof d.title === 'string') {
          const parts = String(d.title).split('·').map(s => s.trim()).filter(Boolean);
          if (parts.length >= 1) syndrome = parts[0].slice(0, 20);
          if (parts.length >= 2) formula = parts[1].replace(/方$/, '').replace(/[+＋]/g, '、').slice(0, 50);
        }
        if (!syndrome) continue;
        // 症状关键词：symptoms[] + tags[] + complaint 分词
        const match = [];
        if (Array.isArray(d.symptoms)) match.push(...d.symptoms);
        if (Array.isArray(d.tags)) match.push(...d.tags.filter(t => typeof t === 'string' && !syndrome.includes(t)));
        if (d.complaint && typeof d.complaint === 'string') {
          // 主诉按标点拆词，取 2-6 字片段
          d.complaint.split(/[，。；、\s]+/).filter(Boolean).slice(0, 4).forEach(w => match.push(w));
        }
        if (match.length === 0) continue;
        // 方剂：formula 或 herbs 列表（emr 已从 title 解析）
        if (!formula && Array.isArray(d.herbs)) {
          formula = d.herbs.map(h => typeof h === 'string' ? h : (h.name || '')).filter(Boolean).join('、');
        }
        patterns.push({
          match: match.slice(0, 12),
          syndrome,
          formula,
          herbs: Array.isArray(d.herbs) ? d.herbs.map(h => typeof h === 'string' ? h : (h.name || '')).filter(Boolean) : [],
          advice: (d.review && d.review.advice) || d.advice || '医生审核方案，请遵医嘱',
          confidence: Math.min(0.9, 0.6 + (d.trust_score || 0.7) * 0.3),
          category: 'formal',
          source: d.source || 'formal',
          evidence_patients: d.evidence_patients || 1
        });
      } catch (e) { /* 跳过坏文件 */ }
    }
    FORMAL_PATTERNS = patterns;
  } catch (e) {
    FORMAL_PATTERNS = [];
  }
  return FORMAL_PATTERNS;
}

/**
 * 根据诊断特征匹配最可能的证型
 * 自动按特征字段推断诊断类型，优先在同类型 patterns 中匹配
 * @param {Object} features - 任意诊断特征对象
 * @returns {Object|null} { syndrome, formula, herbs, advice, confidence }
 */
function getKBMatch(features = {}) {
  if (!features) return null;
  const featureStr = JSON.stringify(features).toLowerCase();
  
  // 推断诊断类型（优先级：显式字段 > 特征词推断）
  let category = null;
  if (features.tongue_body || features.tongue_body_color || features.coating || features.coating_color) category = 'tongue';
  else if (features.complexion || features.face_features || features.regions) category = 'face';
  else if (features.sclera_color || features.sclera_vessels || features.eyelid_color || features.eyelid_lower || features.peri_eye_darkness) category = 'eye';
  else if (features.lip_color || features.color && (features.lip_moisture || features.moisture) && !features.tongue_body) category = 'lip';
  else if (features.palm_color || features.palm_temperature || features.palm_moisture || features.fingernails || features.fingernail_color) category = 'hand';
  else if (features.chills_fever || features.sleep || features.appetite || features.sweating) category = 'inquiry';
  
  // 按 category 优先匹配（同类型池子），次选全量；formal 案例作为补充池（蒸馏闭环）
  const formalPatterns = loadFormalPatterns();
  const sortedPatterns = category
    ? [...KB_PATTERNS.filter(p => !p.category || p.category === category), ...KB_PATTERNS.filter(p => p.category && p.category !== category), ...formalPatterns]
    : [...KB_PATTERNS, ...formalPatterns];
  
  let bestMatch = null;
  let bestScore = 0;
  
  for (const p of sortedPatterns) {
    const hits = p.match.filter(m => featureStr.includes(m)).length;
    if (hits === 0) continue;
    // formal 案例用命中计数评分（tags 池大，比例分过低）；内置 pattern 用比例分
    const score = p.category === 'formal' ? Math.min(1, hits / 3) : hits / p.match.length;
    // 同类型加成 0.15，跨类型诚罚 0.15；formal 案例按命中比例计分（同池竞争）
    const adjustedScore = category && p.category === category ? score + 0.15 : (p.category && p.category !== category ? score - 0.15 : score);
    if (adjustedScore > bestScore) {
      bestScore = adjustedScore;
      bestMatch = { ...p, score: adjustedScore, rawScore: score };
    }
  }
  
  if (!bestMatch || bestScore < 0.3) {
    return {
      syndrome: '待辨证',
      formula: '四诊合参',
      herbs: [],
      advice: '建议完善四诊信息',
      confidence: 0.4,
      evidence: 'KB 未匹配，请人工辨证'
    };
  }
  
  return {
    syndrome: bestMatch.syndrome,
    formula: bestMatch.formula,
    herbs: bestMatch.herbs,
    advice: bestMatch.advice,
    confidence: Math.min(0.95, bestMatch.confidence * (0.7 + bestScore * 0.3)),
    evidence: `KB 匹配 ${(bestScore * 100).toFixed(0)}%` + (bestMatch.ref ? ` · ${bestMatch.ref}` : ''),
    urgent: bestMatch.urgent || false
  };
}

module.exports = { getKBMatch, getFaceKBMatch, getEyeKBMatch, getLipKBMatch, invalidateCache, KB_PATTERNS };

// 面诊 KB 匹配（五脏配五色 + 印堂眉间）
// 优先走 KB_PATTERNS 精确匹配（能给出方剂），兜底走启发式规则
function getFaceKBMatch(features = {}) {
  const featureStr = JSON.stringify({ complexion: features.complexion || '', ...(features.regions || {}) }).toLowerCase();
  const facePatterns = KB_PATTERNS.filter(p => p.category === 'face');
  let bestMatch = null, bestScore = 0;
  for (const p of facePatterns) {
    const hits = p.match.filter(m => featureStr.includes(m.toLowerCase())).length;
    if (hits === 0) continue;
    const score = hits / p.match.length;
    if (score > bestScore) { bestScore = score; bestMatch = p; }
  }
  if (bestMatch && bestScore >= 0.5) {
    return {
      syndrome: bestMatch.syndrome,
      formula: bestMatch.formula,
      herbs: bestMatch.herbs,
      advice: bestMatch.advice,
      confidence: Math.min(0.95, bestMatch.confidence * (0.7 + bestScore * 0.3)),
      evidence: `KB 匹配 ${(bestScore * 100).toFixed(0)}% · ${bestMatch.ref}`,
      urgent: bestMatch.urgent || false
    };
  }
  // 兜底：启发式规则
  const complexion = features.complexion || '';
  const regions = features.regions || {};
  const findings = [];

  if (/晦暗|黧黑/.test(complexion)) findings.push('肾阳虚');
  if (/潮红|红/.test(complexion)) findings.push('阴虚阳亢');
  if (/苍白|淡白/.test(complexion)) findings.push('血虚');
  if (/萎黄|黄/.test(complexion)) findings.push('脾虚湿盛');
  if (/黧黑|黑/.test(complexion)) findings.push('肾虚');

  if (regions.left_cheek && /红|潮红/.test(regions.left_cheek)) findings.push('肝火旺');
  if (regions.right_cheek && /红|潮红/.test(regions.right_cheek)) findings.push('肺热');
  if (regions.forehead && /晦暗|黑/.test(regions.forehead)) findings.push('心阳不振');
  if (regions.nose && /萎黄|黄/.test(regions.nose)) findings.push('脾胃虚弱');
  if (regions.chin && /晦暗|黑/.test(regions.chin)) findings.push('肾虚');
  if (regions.between_eyes && /晦暗|青/.test(regions.between_eyes)) findings.push('心肺气虚');

  if (findings.length === 0) {
    return {
      syndrome: '面诊无异常',
      formula: '无',
      herbs: [],
      advice: '面色明润、含蓄不露，为常色，五脏安和',
      confidence: 0.6,
      evidence: '《中医诊断学》五脏配五色未见异常'
    };
  }

  return {
    syndrome: findings.join(' + '),
    formula: '四诊合参',
    herbs: [],
    advice: '建议结合舌诊/问诊进一步辨证',
    confidence: 0.7,
    evidence: `面诊辨证：${findings.join(' + ')}`
  };
}

// 眼诊 KB 匹配（白睛+眼睑+眼眶）
function getEyeKBMatch(features = {}) {
  const featureStr = JSON.stringify({ sclera_color: features.sclera_color || '', sclera_vessels: features.sclera_vessels || '', eyelid_color: features.eyelid_color || features.eyelid_lower || '', peri_eye_darkness: features.peri_eye_darkness || '' }).toLowerCase();
  const eyePatterns = KB_PATTERNS.filter(p => p.category === 'eye');
  let bestMatch = null, bestScore = 0;
  for (const p of eyePatterns) {
    const hits = p.match.filter(m => featureStr.includes(m.toLowerCase())).length;
    if (hits === 0) continue;
    const score = hits / p.match.length;
    if (score > bestScore) { bestScore = score; bestMatch = p; }
  }
  if (bestMatch && bestScore >= 0.5) {
    return {
      syndrome: bestMatch.syndrome,
      formula: bestMatch.formula,
      herbs: bestMatch.herbs,
      advice: bestMatch.advice,
      confidence: Math.min(0.95, bestMatch.confidence * (0.7 + bestScore * 0.3)),
      evidence: `KB 匹配 ${(bestScore * 100).toFixed(0)}% · ${bestMatch.ref}`,
      urgent: bestMatch.urgent || false
    };
  }
  // 兜底
  const scleraColor = features.sclera_color || '';
  const eyelidLower = features.eyelid_lower || '';
  const periDarkness = features.peri_eye_darkness || '';
  const findings = [];

  if (/黄染|黄/.test(scleraColor)) findings.push('肝胆湿热');
  if (/红丝|充血/.test(scleraColor)) findings.push('肝火上炎');
  if (/浑浊|翳障/.test(scleraColor)) findings.push('肝肾阴虚');
  if (/浮肿|眼袋/.test(eyelidLower)) findings.push('脾虚湿盛');
  if (/暗沉|青紫/.test(eyelidLower)) findings.push('血瘀');
  if (/黑眼圈|青黑/.test(periDarkness)) findings.push('肾虚/血瘀');

  if (findings.length === 0) {
    return {
      syndrome: '眼诊无异常',
      formula: '无',
      herbs: [],
      advice: '白睛黑白分明，眼睑红润有泽，为常色',
      confidence: 0.6,
      evidence: '《中医眼诊学》五轮学说未见异常'
    };
  }

  return {
    syndrome: findings.join(' + '),
    formula: '四诊合参',
    herbs: [],
    advice: '建议结合问诊/舌诊进一步辨证',
    confidence: 0.7,
    evidence: `眼诊辨证：${findings.join(' + ')}`
  };
}

// 唇诊 KB 匹配（《中医诊断学》九版教材唇色标准）
// 优先走 KB_PATTERNS 精确匹配（含紧急 case），兜底走启发式规则
function getLipKBMatch(features = {}) {
  const color = features.color || '';
  const moisture = features.moisture || '';

  // Step 1: 精确匹配 KB_PATTERNS（lip category）
  const lipPatterns = KB_PATTERNS.filter(p => p.category === 'lip');
  const featureStr = JSON.stringify({ color, moisture }).toLowerCase();
  let bestMatch = null;
  let bestScore = 0;
  for (const p of lipPatterns) {
    const hits = p.match.filter(m => featureStr.includes(m.toLowerCase())).length;
    if (hits === 0) continue;
    const score = hits / p.match.length;
    if (score > bestScore) { bestScore = score; bestMatch = p; }
  }
  if (bestMatch && bestScore >= 0.5) {
    return {
      syndrome: bestMatch.syndrome,
      formula: bestMatch.formula,
      herbs: bestMatch.herbs,
      advice: bestMatch.advice,
      confidence: Math.min(0.95, bestMatch.confidence * (0.7 + bestScore * 0.3)),
      evidence: `KB 匹配 ${(bestScore * 100).toFixed(0)}% · ${bestMatch.ref}`,
      urgent: bestMatch.urgent || false
    };
  }

  // Step 2: 启发式规则（KB 未命中时兜底）
  const findings = [];

  // 润+淡红为常色，不报异常
  if (color === '淡红' && (moisture === '润' || moisture === '水润')) {
    return {
      syndrome: '唇诊无异常',
      formula: '无',
      herbs: [],
      advice: '唇色淡红润泽，为常色，脾胃健运',
      confidence: 0.6,
      evidence: '《中医诊断学》唇诊标准未见异常'
    };
  }

  if (/淡白|苍白/.test(color)) findings.push('血虚/失血');
  if (/绛/.test(color)) findings.push('热证');
  if (/紫|紫暗|青/.test(color)) findings.push('血瘀');
  if (/干裂|燥/.test(moisture)) findings.push('津液亏虚');
  if (/滑|湿/.test(moisture)) findings.push('脾虚湿盛');

  if (findings.length === 0) {
    return {
      syndrome: '唇诊无异常',
      formula: '无',
      herbs: [],
      advice: '唇色淡红润泽，为常色',
      confidence: 0.6,
      evidence: '《中医诊断学》唇诊标准未见异常'
    };
  }

  return {
    syndrome: findings.join(' + '),
    formula: '四诊合参',
    herbs: [],
    advice: '建议结合舌诊/问诊进一步辨证',
    confidence: 0.7,
    evidence: `唇诊辨证：${findings.join(' + ')}`
  };
}
