/**
 * 多流派辨证推理引擎 V1.0
 * 命理宝鉴·医道 核心引擎
 * 输入: 四诊标准化数据 (SZ_DIAGNOSIS_REPORT)
 * 输出: 5派并列辨证 + 方证对应 + 禁忌检测
 */

const { CONTRAINDICATION_RULES, DIAGNOSIS_FORMULA_WEIGHTS } = require('../schemas/formula-schema');
const { URGENCY_LEVELS } = require('../schemas/four-diagnosis-schema');

// ═══════════════════════════════════════════════
// 经典典籍引用库
// ═══════════════════════════════════════════════
const CLASSICS = {
  shanghan: {
    name: '伤寒论',
    author: '东汉·张仲景',
    keywords: ['六经辨证', '太阳病', '阳明病', '少阳病', '太阴病', '少阴病', '厥阴病'],
    weight: 1.0
  },
  jingui: {
    name: '金匮要略',
    author: '东汉·张仲景',
    keywords: ['脏腑经络', '杂病', '痰饮', '水气', '黄疸', '虚劳'],
    weight: 0.95
  },
  neijing: {
    name: '黄帝内经',
    author: '战国至秦汉',
    keywords: ['阴阳应象', '藏气法时', '经脉', '营卫生会'],
    weight: 1.0
  },
  bencao: {
    name: '神农本草经',
    author: '东汉',
    keywords: ['上品', '中品', '下品', '四气五味'],
    weight: 0.90
  },
  nanjing: {
    name: '难经',
    author: '战国·扁鹊',
    keywords: ['寸口脉法', '八十一难', '五邪'],
    weight: 0.85
  },
  wenbing: {
    name: '温病条辨',
    author: '清·吴瑭',
    keywords: ['三焦辨证', '卫气营血', '温邪上受'],
    weight: 0.85
  },
  piweilun: {
    name: '脾胃论',
    author: '金·李东垣',
    keywords: ['脾胃为后天之本', '升阳散火', '补中益气'],
    weight: 0.85
  },
  zhenjiu: {
    name: '针灸大成',
    author: '明·杨继洲',
    keywords: ['灵龟八法', '子午流注', '马丹阳天星十二穴'],
    weight: 0.90
  }
};

// ═══════════════════════════════════════════════
// 舌象→典籍映射
// ═══════════════════════════════════════════════
const TONGUE_PATTERNS = {
  '淡白舌': [
    { classic: 'shanghan', ref: '太阴病，腹满而吐', note: '太阴虚寒' },
    { classic: 'neijing', ref: '血气者，喜温而恶寒', note: '气血不足' },
    { classic: 'piweilun', ref: '脾胃虚则九窍不通', note: '脾虚失运' }
  ],
  '红舌': [
    { classic: 'wenbing', ref: '温邪上受，首先犯肺', note: '热入营血' },
    { classic: 'shanghan', ref: '阳明病，外证云何', note: '阳明热盛' }
  ],
  '绛舌': [
    { classic: 'wenbing', ref: '热入营分，舌色必绛', note: '营分热盛' }
  ],
  '紫暗舌': [
    { classic: 'shanghan', ref: '瘀热在里', note: '血瘀证' },
    { classic: 'neijing', ref: '血脉凝泣', note: '寒凝血瘀' }
  ],
  '胖大舌': [
    { classic: 'piweilun', ref: '脾虚湿困', note: '气虚水停' }
  ],
  '瘦薄舌': [
    { classic: 'neijing', ref: '阴虚则内热', note: '阴血不足' }
  ],
  '黄苔': [
    { classic: 'shanghan', ref: '阳明病，身热汗自出', note: '里热证' },
    { classic: 'wenbing', ref: '热在气分', note: '气分热盛' }
  ],
  '白腻苔': [
    { classic: 'shanghan', ref: '太阴病，腹满而吐', note: '寒湿内阻' },
    { classic: 'wenbing', ref: '湿重于热，苔白腻', note: '湿浊' }
  ]
};

// ═══════════════════════════════════════════════
// 方证对应矩阵
// ═══════════════════════════════════════════════
const FORMULA_SYNDROME_MAP = {
  '外感风寒_表虚': {
    formula: '桂枝汤',
    source: '伤寒论',
    symptoms: ['恶风', '发热', '汗出', '头痛', '脉浮缓'],
    tongue: '苔白不渴',
    modifications: {
      '项背强': '桂枝加葛根汤',
      '喘': '桂枝加厚朴杏子汤',
      '汗漏不止': '桂枝加附子汤'
    }
  },
  '外感风寒_表实': {
    formula: '麻黄汤',
    source: '伤寒论',
    symptoms: ['恶寒', '发热', '无汗', '身痛', '脉浮紧'],
    tongue: '苔薄白'
  },
  '少阳证': {
    formula: '小柴胡汤',
    source: '伤寒论',
    symptoms: ['往来寒热', '胸胁苦满', '默默不欲饮食', '心烦喜呕'],
    tongue: '苔薄白',
    pulse: '脉弦'
  },
  '阳明经证': {
    formula: '白虎汤',
    source: '伤寒论',
    symptoms: ['大热', '大汗', '大渴', '脉洪大'],
    tongue: '苔黄燥'
  },
  '脾虚湿困': {
    formula: '参苓白术散',
    source: '太平惠民和剂局方',
    symptoms: ['食少', '便溏', '乏力', '面色萎黄'],
    tongue: '舌淡胖有齿痕，苔白腻',
    pulse: '脉濡缓'
  },
  '肝郁气滞': {
    formula: '逍遥散',
    source: '太平惠民和剂局方',
    symptoms: ['胁痛', '情绪抑郁', '月经不调', '乳房胀痛'],
    tongue: '苔薄白',
    pulse: '脉弦'
  },
  '气虚血瘀': {
    formula: '补阳还五汤',
    source: '医林改错',
    symptoms: ['半身不遂', '口眼歪斜', '语言謇涩'],
    tongue: '舌紫暗有瘀斑',
    pulse: '脉涩'
  },
  '阴虚火旺': {
    formula: '知柏地黄丸',
    source: '医宗金鉴',
    symptoms: ['五心烦热', '盗汗', '口干咽燥', '耳鸣'],
    tongue: '舌红少苔',
    pulse: '脉细数'
  },
  '阳虚水泛': {
    formula: '真武汤',
    source: '伤寒论',
    symptoms: ['畏寒', '水肿', '小便不利', '心悸'],
    tongue: '舌淡胖苔白滑',
    pulse: '脉沉细'
  },
  '风寒表证': {
    formula: '荆防败毒散',
    source: '摄生众妙方',
    symptoms: ['恶寒', '发热', '鼻塞', '咳嗽', '头身疼痛'],
    tongue: '苔薄白',
    pulse: '脉浮'
  },
  '肝胆湿热': {
    formula: '龙胆泻肝汤',
    source: '医方集解',
    symptoms: ['口苦', '口干', '小便黄', '胁痛', '目赤'],
    tongue: '舌红苔黄腻',
    pulse: '脉弦数'
  },
  '心脾两虚': {
    formula: '归脾汤',
    source: '济生方',
    symptoms: ['失眠', '多梦', '心悸', '乏力', '食少'],
    tongue: '舌淡苔薄白',
    pulse: '脉细弱'
  },
  '脾胃气虚': {
    formula: '四君子汤',
    source: '太平惠民和剂局方',
    symptoms: ['食少', '乏力', '腹胀', '便溏'],
    tongue: '舌淡苔白',
    pulse: '脉虚弱'
  },
  '气阴两虚': {
    formula: '生脉散',
    source: '内外伤辨惑论',
    symptoms: ['乏力', '口干', '自汗', '气短'],
    tongue: '舌红少苔',
    pulse: '脉虚细'
  },
  '湿热下注': {
    formula: '四妙散',
    source: '成方便读',
    symptoms: ['下肢痿软', '足膝红肿', '小便黄', '苔黄腻'],
    tongue: '舌红苔黄腻',
    pulse: '脉滑数'
  }
};

/**
 * 多流派辨证分析
 * @param {Object} diagnosis - 四诊标准数据
 * @returns {Object} 5派观点
 */
function multischoolAnalysis(diagnosis) {
  const { tongue, inquiry } = diagnosis.five_methods;
  const symptoms = (inquiry && inquiry.extracted_tcm_terms) || [];
  const chiefComplaint = (inquiry && inquiry.chief_complaint) || '';
  
  const result = {
    shanghan: { opinion: '', reference: '', confidence: 0 },
    wenbing: { opinion: '', reference: '', confidence: 0 },
    fuyang: { opinion: '', reference: '', confidence: 0 },
    piwei: { opinion: '', reference: '', confidence: 0 },
    jingfang: { opinion: '', reference: '', confidence: 0 }
  };

  if (!tongue || !tongue.tongue_features) return result;

  const tf = tongue.tongue_features;
  const bodyColor = tf.tongue_body ? tf.tongue_body.color : '';
  const coating = tf.tongue_coating ? tf.tongue_coating.color + tf.tongue_coating.texture : '';

  // ─── 伤寒派分析 ───
  const shanghanRefs = TONGUE_PATTERNS[bodyColor+'舌'] || [];
  const shRef = shanghanRefs.find(r => r.classic === 'shanghan');
  if (shRef) {
    result.shanghan = {
      opinion: `从六经辨证看，主病在${bodyColor.includes('淡') ? '太阴' : bodyColor.includes('红') ? '阳明' : bodyColor.includes('紫') ? '厥阴/少阴' : '太阳'}，${shRef.note}`,
      reference: `《伤寒论》"${shRef.ref}"`,
      confidence: 0.85
    };
  }

  // ─── 温病派分析 ───
  const wenbingRefs = TONGUE_PATTERNS[bodyColor+'舌'] || [];
  const wbRef = wenbingRefs.find(r => r.classic === 'wenbing');
  if (wbRef) {
    result.wenbing = {
      opinion: `从卫气营血看，${wbRef.note}，${coating.includes('黄') ? '气分有热' : '病在卫分或气分'}。`,
      reference: `《温病条辨》"${wbRef.ref}"`,
      confidence: 0.82
    };
  } else if (coating.includes('黄')) {
    result.wenbing = {
      opinion: '苔黄主热，从温病角度考虑热在气分，需进一步辨析表里。',
      reference: '《温病条辨·上焦篇》',
      confidence: 0.75
    };
  }

  // ─── 扶阳派分析 ───
  const isYangXu = bodyColor.includes('淡') || bodyColor.includes('白') || 
                   (inquiry && inquiry.structured && inquiry.structured.chills_fever && inquiry.structured.chills_fever.includes('寒'));
  if (isYangXu) {
    result.fuyang = {
      opinion: '从扶阳视角看，阳气不足为本，寒湿为标。治当温阳散寒为先，阳复则阴霾自散。',
      reference: '郑钦安《医理真传》"阳气者，若天与日"',
      confidence: 0.80
    };
  } else {
    result.fuyang = {
      opinion: '阳气尚可，但须注意时时顾护阳气，用药勿过用寒凉。',
      reference: '《医法圆通》"万病皆损于阳气"',
      confidence: 0.60
    };
  }

  // ─── 脾胃派分析 ───
  const hasDigestiveIssue = symptoms.some(s => s.includes('食') || s.includes('胃') || s.includes('便') || s.includes('腹'));
  if (hasDigestiveIssue || bodyColor.includes('淡') || tf.tongue_body && (tf.tongue_body.shape || '').includes('齿痕')) {
    result.piwei = {
      opinion: '脾胃为后天之本，当前脾胃运化功能减弱。治当健脾益气为先，脾胃健则气血生。',
      reference: '李东垣《脾胃论》"内伤脾胃，百病由生"',
      confidence: 0.88
    };
  } else {
    result.piwei = {
      opinion: '脾胃功能尚可，但治疗中须时时顾护胃气。',
      reference: '《脾胃论》"胃气一败，百药难施"',
      confidence: 0.55
    };
  }

  // ─── 经方派分析 ───
  result.jingfang = {
    opinion: '从经方角度，当以方证对应为核，有是证用是方。需结合四诊合参确定主证。',
    reference: '胡希恕《经方辨证》"方证是辨证的尖端"',
    confidence: 0.70
  };

  return result;
}

/**
 * 方证对应匹配
 * @param {Object} diagnosis 
 * @returns {Object} 推荐方剂+置信度
 */
function formulaSyndromeMatch(diagnosis) {
  const { inquiry } = diagnosis.five_methods;
  const symptoms = (inquiry && inquiry.extracted_tcm_terms) || [];
  const chiefComplaint = (inquiry && inquiry.chief_complaint) || '';
  
  // ═══ 症状同义词归一化：口语 → 典籍术语 ═══
  const SYNONYM_MAP = {
    '口干': ['口干', '口干咽燥', '口渴', '咽干'],
    '口苦': ['口苦', '苦口'],
    '便秘': ['便秘', '大便干结', '大便难'],
    '小便黄': ['小便黄', '尿黄', '小便短赤'],
    '失眠': ['失眠', '不寐', '入睡困难', '多梦'],
    '乏力': ['乏力', '神疲', '倦怠', '疲乏无力'],
    '头晕': ['头晕', '眩晕', '头眩'],
    '胃痛': ['胃痛', '胃脘痛', '脘痛'],
    '腹胀': ['腹胀', '脘腹胀满', '腹胀满'],
    '咳嗽': ['咳嗽', '咳', '咳喘'],
    '畏寒': ['畏寒', '怕冷', '恶寒', '形寒'],
    '盗汗': ['盗汗', '夜间出汗'],
    '心悸': ['心悸', '心慌', '怔忡'],
    '月经不调': ['月经不调', '月经紊乱', '经期不调'],
    '胁痛': ['胁痛', '胁肋疼痛', '胸胁胀痛'],
    '水肿': ['水肿', '浮肿', '肢肿'],
    '耳鸣': ['耳鸣', '耳聋'],
    '烦躁': ['烦躁', '心烦', '易怒']
  };
  
  // 把用户输入展开成同义词集合
  const allTerms = symptoms.concat([chiefComplaint]);
  const expanded = new Set();
  for (const term of allTerms) {
    expanded.add(term);
    if (!term) continue;
    for (const canonical of Object.keys(SYNONYM_MAP)) {
      if (term.includes(canonical) || canonical.includes(term)) {
        SYNONYM_MAP[canonical].forEach(s => expanded.add(s));
      }
    }
    // 反向：同义词命中
    for (const canonical of Object.keys(SYNONYM_MAP)) {
      for (const s of SYNONYM_MAP[canonical]) {
        if (term.includes(s) || s.includes(term)) expanded.add(s);
      }
    }
  }
  
  let bestMatch = null;
  let bestScore = 0;

  for (const [syndrome, data] of Object.entries(FORMULA_SYNDROME_MAP)) {
    let score = 0;
    // 症状匹配（含同义词）
    for (const sym of data.symptoms) {
      if (chiefComplaint.includes(sym) || expanded.has(sym) || symptoms.includes(sym)) {
        score += DIAGNOSIS_FORMULA_WEIGHTS.chief_complaint * 100;
      }
    }
    // 舌象匹配
    if (diagnosis.five_methods.tongue) {
      const tf = diagnosis.five_methods.tongue.tongue_features;
      const tongueDesc = (tf.tongue_body ? tf.tongue_body.color + '舌' : '') + 
                        (tf.tongue_coating ? tf.tongue_coating.color + tf.tongue_coating.texture + '苔' : '');
      if (data.tongue && tongueDesc.includes(data.tongue.replace(/舌|苔/g, ''))) {
        score += DIAGNOSIS_FORMULA_WEIGHTS.tongue * 100;
      }
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = { syndrome, ...data, score };
    }
  }

  if (bestMatch && bestMatch.score >= 30) {
    return {
      formula: bestMatch.formula,
      source: bestMatch.source,
      confidence: Math.min(bestMatch.score / 100, 0.92),
      matched_syndrome: bestMatch.syndrome,
      modifications: bestMatch.modifications || {}
    };
  }

  return { formula: null, source: null, confidence: 0, matched_syndrome: null, note: '未找到匹配方剂，建议四诊合参后由执业医师辨证处方' };
}

/**
 * 禁忌检测
 * @param {Object} formulaMatch - 方证匹配结果
 * @param {Object} diagnosis - 四诊数据
 * @returns {Array} 警告列表
 */
function contraindicationCheck(formulaMatch, diagnosis) {
  const warnings = [];
  const herbs = formulaMatch.composition ? formulaMatch.composition.map(h => h.herb) : [];
  
  if (herbs.length === 0) return warnings;

  // 十八反检测
  for (const rule of CONTRAINDICATION_RULES.eighteen_antagonisms) {
    if (herbs.includes(rule.a)) {
      for (const antag of rule.antagonizes) {
        if (herbs.includes(antag)) {
          warnings.push({ level: 'CRITICAL', rule: '十八反', detail: `${rule.a}反${antag}，禁止同用` });
        }
      }
    }
  }

  // 十九畏检测
  for (const rule of CONTRAINDICATION_RULES.nineteen_incompatibilities) {
    if (herbs.includes(rule.herb)) {
      const fearedHerb = rule.fears;
      if (herbs.some(h => fearedHerb.includes(h))) {
        warnings.push({ level: 'CRITICAL', rule: '十九畏', detail: `${rule.herb}畏${rule.fears}` });
      }
    }
  }

  // 妊娠禁忌检测（如果有问诊中的妊娠信息）
  if (diagnosis && diagnosis.five_methods.inquiry && 
      diagnosis.five_methods.inquiry.structured && 
      diagnosis.five_methods.inquiry.structured.menstruation &&
      diagnosis.five_methods.inquiry.structured.menstruation.pregnant) {
    for (const h of herbs) {
      if (CONTRAINDICATION_RULES.pregnancy_contraindicated.includes(h)) {
        warnings.push({ level: 'CRITICAL', rule: '妊娠禁忌', detail: `${h}孕妇禁用` });
      }
      if (CONTRAINDICATION_RULES.pregnancy_caution.includes(h)) {
        warnings.push({ level: 'WARNING', rule: '妊娠慎用', detail: `${h}孕妇慎用` });
      }
    }
  }

  return warnings;
}

/**
 * 诊断分级
 */
function assessUrgency(diagnosis) {
  const { inquiry } = diagnosis.five_methods;
  const symptoms = (inquiry && inquiry.extracted_tcm_terms) || [];
  const complaint = (inquiry && inquiry.chief_complaint) || '';

  for (const trigger of URGENCY_LEVELS.P0_EMERGENCY.triggers) {
    if (complaint.includes(trigger) || symptoms.includes(trigger)) {
      return 'P0_EMERGENCY';
    }
  }

  for (const trigger of URGENCY_LEVELS.P1_SUGGEST_VISIT.triggers) {
    if (complaint.includes(trigger)) {
      return 'P1_SUGGEST_VISIT';
    }
  }

  if (diagnosis.five_methods.tongue && diagnosis.five_methods.tongue.rejection_reason) {
    return 'P2_HEALTH_TIP';
  }

  return symptoms.length > 0 ? 'P2_HEALTH_TIP' : 'P3_NORMAL';
}

module.exports = {
  CLASSICS,
  TONGUE_PATTERNS,
  FORMULA_SYNDROME_MAP,
  multischoolAnalysis,
  formulaSyndromeMatch,
  contraindicationCheck,
  assessUrgency
};
