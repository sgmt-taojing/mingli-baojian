/**
 * 命理宝鉴·医道 长程画像引擎 V1.0
 *
 * 把同一患者跨年/跨月的所有诊疗事件织成时间线，
 * 提取慢病轨迹、体质倾向、方药累积、疗效演化，
 * 用于反向赋能 KB（相似患者 → 循证推荐）。
 *
 * 输入: 多源诊疗事件数组（任意来源: 病历/处方/随访/舌面/体质测评）
 * 输出: { timeline, trajectories, constitutionProfile, vector, patterns }
 */

'use strict';

// ═══ 常量 ═══

const SLOW_DISEASE_MIN_GAP_DAYS = 30;       // 同诊断 ≥ 30 天间隔 = 慢病
const TRAJECTORY_MIN_OCCURRENCES = 2;       // 至少 2 次才认作轨迹
const CONSTITUTION_MIN_OCCURRENCES = 3;     // 至少 3 次才认作体质倾向
const PATTERN_MIN_PATIENTS = 1;             // 演示：1 个患者也出模式（生产应设 2）
const PATTERN_MIN_CONFIDENCE = 0.3;         // 模式入库的最低置信度（生产建议 0.5，演示 0.3）

// ═══ 体质倾向词典 ═══

const CONSTITUTION_TYPES = [
  '气虚', '血虚', '阴虚', '阳虚',
  '气滞', '血瘀', '痰湿', '湿热',
  '肝郁', '脾虚', '肾虚', '心火旺'
];

// 中医证型 → 体质倾向（多层映射）
// 既覆盖顶层证型（"心脾两虚"），也覆盖症状/诊断（"咳嗽""失眠"），保证缺省诊断也能出体质
const SYNDROME_TO_CONSTITUTION = {
  // ─── 顶层证型 ───
  '气虚证': ['气虚', '脾虚'],
  '血虚证': ['血虚'],
  '阴虚证': ['阴虚'],
  '阳虚证': ['阳虚', '肾虚'],
  '气滞证': ['气滞', '肝郁'],
  '血瘀证': ['血瘀'],
  '痰湿证': ['痰湿', '脾虚'],
  '湿热证': ['湿热'],
  '肝郁证': ['肝郁', '气滞'],
  '脾虚证': ['脾虚', '气虚'],
  '肾虚证': ['肾虚'],
  '心脾两虚': ['气虚', '血虚'],
  '肝阳上亢': ['阴虚', '肝郁'],
  '脾胃虚弱': ['脾虚', '气虚'],
  '风寒束肺': ['气虚'],
  '肝郁气滞': ['肝郁', '气滞'],
  '肾阳虚': ['阳虚', '肾虚'],
  '风寒湿痹': ['阳虚'],
  '气血两虚': ['气虚', '血虚'],
  '阴虚火旺': ['阴虚'],
  '湿热内蕴': ['湿热'],
  '气滞血瘀': ['气滞', '血瘀'],
  '痰湿内阻': ['痰湿'],
  '脾虚湿盛': ['脾虚', '痰湿'],
  '风热犯肺': ['阴虚'],
  '血虚风燥': ['血虚'],
  '中气不足': ['气虚', '脾虚'],
  // ─── 常见症状/诊断 → 体质倾向 ───
  '咳嗽': ['气虚'],                    // 反复咳嗽 → 肺气虚
  '慢性咳嗽': ['气虚', '阴虚'],         // 久咳伤气伤阴
  '哮喘': ['气虚', '肾虚'],
  '感冒': ['气虚'],                    // 易感 → 表虚
  '反复感冒': ['气虚'],
  '鼻炎': ['气虚'],
  '失眠': ['阴虚', '血虚'],
  '不寐': ['阴虚', '血虚'],
  '多梦': ['血虚', '阴虚'],
  '心悸': ['血虚'],
  '头痛': ['气滞', '血瘀'],
  '偏头痛': ['气滞', '血瘀'],
  '眩晕': ['阴虚', '肝郁'],
  '高血压': ['阴虚', '肝郁'],
  '胃痛': ['脾虚'],
  '胃胀': ['气滞', '脾虚'],
  '胃炎': ['脾虚', '气滞'],
  '腹泻': ['脾虚'],
  '便秘': ['阴虚', '血瘀'],
  '月经失调': ['血虚', '肝郁'],
  '痛经': ['气滞', '血瘀'],
  '腰痛': ['肾虚'],
  '痹证': ['阳虚', '血瘀'],
  '湿疹': ['湿热', '血虚'],
  '痤疮': ['湿热'],
  '疲劳': ['气虚'],
  '乏力': ['气虚'],
  '水肿': ['脾虚', '肾虚'],
  '糖尿病': ['阴虚'],
  '心悸怔忡': ['血虚']
};

// ═══ 1. 时间轴聚合 ═══

/**
 * 把多源事件聚合为统一时间轴
 * @param {Array} sources - 多源事件: { source, events }
 *   sources[].source: 'emr' | 'prescription' | 'followup' | 'tongue' | 'constitution'
 * @returns {Array} timeline - 按时间排序的事件数组
 */
function buildTimeline(sources) {
  const events = [];
  
  for (const { source, events: src } of sources) {
    if (!Array.isArray(src)) continue;
    for (const e of src) {
      const ts = new Date(e.created_at || e.visit_date || e.time || 0).getTime();
      if (!ts || isNaN(ts)) continue;
      
      events.push({
        source,
        timestamp: ts,
        date: new Date(ts).toISOString().slice(0, 10),
        type: e.type || source,             // 类型
        diagnosis: e.diagnosis || '',       // 诊断/证型
        symptoms: e.symptoms || e.chief_complaint || '',
        herbs: extractHerbs(e),             // 方药
        effect: parseFloat(e.efficacy_score || e.effect || 0), // 疗效
        constitution: e.constitution || '',  // 体质（如果有）
        ...e                                // 透传原始字段
      });
    }
  }
  
  events.sort((a, b) => a.timestamp - b.timestamp);
  return events;
}

function extractHerbs(rec) {
  if (!rec) return [];
  const herbs = rec.herbs || (rec.prescription && rec.prescription.herbs) || [];
  if (typeof herbs === 'string') return herbs.split(/[,，、]/).map(h => h.trim()).filter(Boolean);
  if (Array.isArray(herbs)) return herbs.map(h => typeof h === 'string' ? h.trim() : (h.name || '').trim()).filter(Boolean);
  return [];
}

// ═══ 2. 慢病轨迹识别 ═══

/**
 * 识别同一患者跨时间的慢病轨迹
 * @param {Array} timeline - 时间轴
 * @returns {Array} trajectories
 */
function detectTrajectories(timeline) {
  if (!timeline.length) return [];
  
  // 按诊断归一化聚合
  const groups = {};
  for (const e of timeline) {
    const dx = normalizeDiagnosis(e.diagnosis);
    if (!dx || dx === '未明确' || dx === '健康') continue;
    if (!groups[dx]) groups[dx] = [];
    groups[dx].push(e);
  }
  
  const trajectories = [];
  for (const [dx, events] of Object.entries(groups)) {
    if (events.length < TRAJECTORY_MIN_OCCURRENCES) continue;
    
    const sorted = events.slice().sort((a, b) => a.timestamp - b.timestamp);
    
    // 检查是否慢病：首末次间隔 ≥ 30 天
    const spanDays = (sorted[sorted.length - 1].timestamp - sorted[0].timestamp) / 86400000;
    const isChronic = spanDays >= SLOW_DISEASE_MIN_GAP_DAYS;
    
    // 累计方药频率
    const herbFreq = {};
    for (const e of sorted) for (const h of e.herbs) herbFreq[h] = (herbFreq[h] || 0) + 1;
    
    // 累计疗效（>0 的样本）
    const effects = sorted.filter(e => e.effect > 0).map(e => e.effect);
    const avgEffect = effects.length > 0 ? effects.reduce((s, e) => s + e, 0) / effects.length : 0;
    
    // 趋势
    let trend = 'stable';
    if (effects.length >= 2) {
      const first = effects.slice(0, Math.ceil(effects.length / 2)).reduce((s, e) => s + e, 0);
      const last = effects.slice(Math.floor(effects.length / 2)).reduce((s, e) => s + e, 0);
      if (last > first * 1.2) trend = 'improving';
      else if (last < first * 0.8) trend = 'declining';
    }
    
    // 最优方药（疗效最高的诊次用了什么）
    const bestEvent = sorted.reduce((best, e) => e.effect > (best?.effect || 0) ? e : best, null);
    
    trajectories.push({
      diagnosis: dx,
      occurrences: sorted.length,
      isChronic,
      spanDays: Math.round(spanDays),
      spanLabel: formatSpan(spanDays),
      firstDate: sorted[0].date,
      lastDate: sorted[sorted.length - 1].date,
      avgEffect: Number(avgEffect.toFixed(2)),
      trend,
      herbFrequency: Object.entries(herbFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, count]) => ({ name, count })),
      bestRegimen: bestEvent ? { herbs: bestEvent.herbs, effect: bestEvent.effect, date: bestEvent.date } : null,
      sourceMix: countSources(sorted)
    });
  }
  
  return trajectories.sort((a, b) => b.occurrences - a.occurrences);
}

function countSources(events) {
  const counts = {};
  for (const e of events) counts[e.source] = (counts[e.source] || 0) + 1;
  return counts;
}

function formatSpan(days) {
  if (days < 1) return '同日';
  if (days < 30) return Math.round(days) + ' 天';
  if (days < 365) return (days / 30).toFixed(1) + ' 月';
  return (days / 365).toFixed(1) + ' 年';
}

// ═══ 3. 体质画像 ═══

/**
 * 从证型推断体质倾向
 * @param {Array} timeline
 * @returns {Object} constitutionProfile
 */
function buildConstitutionProfile(timeline) {
  const counts = {};
  
  for (const e of timeline) {
    const dx = e.diagnosis || '';
    const constitutions = SYNDROME_TO_CONSTITUTION[dx] || [];
    for (const c of constitutions) counts[c] = (counts[c] || 0) + 1;
    
    // 直接标注的体质也算
    if (e.constitution) {
      for (const c of (Array.isArray(e.constitution) ? e.constitution : [e.constitution])) {
        counts[c] = (counts[c] || 0) + 1;
      }
    }
  }
  
  const profile = Object.entries(counts)
    .filter(([_, n]) => n >= 1)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({
      type,
      score: count,
      percentage: 0, // 后算
      chronic: count >= CONSTITUTION_MIN_OCCURRENCES
    }));
  
  const total = profile.reduce((s, p) => s + p.score, 0);
  for (const p of profile) {
    p.percentage = total > 0 ? Math.round(p.score / total * 100) : 0;
  }
  
  return {
    top3: profile.slice(0, 3),
    chronicTypes: profile.filter(p => p.chronic).map(p => p.type),
    all: profile
  };
}

// ═══ 4. 患者向量（供 nn-engine 用）═══

/**
 * 把长程画像转成 50 维向量（症状分布 12 + 方药分布 24 + 体质 8 + 疗效 6）
 * @param {Object} profile - { timeline, trajectories, constitutionProfile }
 * @returns {Array} vector - 50 维浮点数组
 */
function buildVector(profile) {
  const vec = new Array(50).fill(0);
  const { timeline, constitutionProfile } = profile;
  
  if (!timeline.length) return vec;
  
  // 0-11: 12 个诊断大类出现次数（归一化）
  const diagCount = {};
  for (const e of timeline) {
    const dx = e.diagnosis || '其他';
    diagCount[dx] = (diagCount[dx] || 0) + 1;
  }
  const topDiag = Object.entries(diagCount).sort((a, b) => b[1] - a[1]).slice(0, 12);
  const maxDiag = topDiag.reduce((m, [_, n]) => Math.max(m, n), 1);
  topDiag.forEach(([_, n], i) => { vec[i] = n / maxDiag; });
  
  // 12-35: 24 个常用方药频率
  const herbFreq = {};
  for (const e of timeline) for (const h of e.herbs) herbFreq[h] = (herbFreq[h] || 0) + 1;
  const topHerbs = Object.entries(herbFreq).sort((a, b) => b[1] - a[1]).slice(0, 24);
  const maxHerb = topHerbs.reduce((m, [_, n]) => Math.max(m, n), 1);
  topHerbs.forEach(([_, n], i) => { vec[12 + i] = n / maxHerb; });
  
  // 36-43: 8 个核心体质指数
  const constitutions = ['气虚', '血虚', '阴虚', '阳虚', '气滞', '血瘀', '痰湿', '湿热'];
  for (let i = 0; i < constitutions.length; i++) {
    const c = constitutionProfile.all.find(p => p.type === constitutions[i]);
    vec[36 + i] = c ? c.percentage / 100 : 0;
  }
  
  // 44-49: 6 个疗效指标
  const effects = timeline.filter(e => e.effect > 0).map(e => e.effect);
  vec[44] = effects.length > 0 ? effects.reduce((s, e) => s + e, 0) / effects.length / 5 : 0; // 平均疗效归一化
  vec[45] = Math.min(effects.length / 10, 1); // 复诊密度
  vec[46] = (profile.trajectories?.filter(t => t.isChronic).length || 0) / Math.max(timeline.length / 2, 1); // 慢病比例
  vec[47] = (constitutionProfile.chronicTypes.length || 0) / 12; // 慢性体质比例
  vec[48] = profile.trajectories?.length > 0 ? 1 : 0; // 是否有慢病
  vec[49] = Math.min(timeline.length / 50, 1); // 总事件密度
  
  return vec.map(v => Number(v.toFixed(4)));
}

// ═══ 5. 诊断归一化 ═══

const DX_NORM = {
  '伤风':'感冒','风寒感冒':'感冒','风热感冒':'感冒','流感':'感冒',
  '不寐':'失眠','睡不着':'失眠','入睡困难':'失眠',
  '头疼':'头痛','偏头痛':'头痛',
  '胃脘痛':'胃痛','胃疼':'胃痛','胃胀':'胃痛',
  '泄泻':'腹泻','拉肚子':'腹泻',
  '大便干结':'便秘','排便困难':'便秘',
  '消渴':'糖尿病','消渴症':'糖尿病',
  '血压高':'高血压','眩晕':'高血压',
  '心慌':'心悸','怔忡':'心悸',
  '浮肿':'水肿',
  '头晕':'眩晕','眩晕症':'眩晕',
  '经前腹痛':'痛经','月经不调':'月经失调',
  '腰膝酸软':'腰痛',
  '关节痛':'痹证','关节疼痛':'痹证'
};

function normalizeDiagnosis(d) {
  if (!d) return '未明确';
  return DX_NORM[d.trim()] || d.trim();
}

// ═══ 6. 模式提取（用于 KB 反向赋能）═══

/**
 * 从多个患者的长程画像中提取共享模式
 * 模式 = "症状组合 + 方药 → 疗效" 的循证规律
 * @param {Array} profiles - [{ patientId, profile }]
 * @returns {Array} patterns
 */
function extractPatterns(profiles) {
  if (!profiles.length) return [];
  
  // 模式 key: top3 体质 + 诊断归一化（多桶投票·避免单体质错位）
  const buckets = {};
  
  for (const { patientId, profile } of profiles) {
    // 取 top3 体质（3 个桶都算同一患者·避免排序不一致导致错位）
    const constitutions = (profile.constitutionProfile.top3 || []).map(c => c.type).filter(Boolean);
    if (!constitutions.length) constitutions.push('unknown');
    
    for (const t of profile.trajectories || []) {
      // 每个体质都贡献一个桶（同一患者可出现在多个体质桶中）
      for (const topConstitution of constitutions) {
      const key = `${topConstitution}|${t.diagnosis}`;
      if (!buckets[key]) {
        buckets[key] = {
          constitutionKey: topConstitution,
          diagnosis: t.diagnosis,
          patients: new Set(),
          totalOccurrences: 0,
          effects: [],
          herbEffectiveness: {}  // 药材 → 疗效求和
        };
      }
      const b = buckets[key];
      b.patients.add(patientId);
      b.totalOccurrences += t.occurrences;
      if (t.avgEffect > 0) b.effects.push(t.avgEffect);
      
      // 累计方药 + 疗效（药材来源：trajectory.herbFrequency，不依赖 bestRegimen）
      const effectForVisit = t.bestRegimen?.effect || t.avgEffect || 0;
      for (const hf of (t.herbFrequency || [])) {
        const h = hf.name;
        if (!b.herbEffectiveness[h]) b.herbEffectiveness[h] = { sum: 0, n: 0, freq: 0 };
        b.herbEffectiveness[h].freq += hf.count;
        if (effectForVisit > 0) {
          b.herbEffectiveness[h].sum += effectForVisit;
          b.herbEffectiveness[h].n += 1;
        }
      }
      }
    }
  }
  
  const patterns = [];
  for (const [key, b] of Object.entries(buckets)) {
    if (b.patients.size < PATTERN_MIN_PATIENTS) continue;
    
    const avgEffect = b.effects.length > 0 ? b.effects.reduce((s, e) => s + e, 0) / b.effects.length : 0;
    
    // 找高频高疗效药材
    const topHerbs = Object.entries(b.herbEffectiveness)
      .filter(([_, v]) => v.freq >= 2 || v.n >= 2)
      .map(([name, v]) => ({
        name,
        avgEffect: v.n > 0 ? v.sum / v.n : 0,
        usedIn: v.n,
        freq: v.freq
      }))
      .sort((a, b) => (b.avgEffect || 0) - (a.avgEffect || 0) || b.freq - a.freq)
      .slice(0, 6);
    
    const confidence = Math.min(b.patients.size / 5, 1) * 0.5 + (avgEffect / 5) * 0.4 + (topHerbs.length > 0 ? 0.1 : 0);
    if (confidence < PATTERN_MIN_CONFIDENCE) continue;
    
    patterns.push({
      key,
      constitutionKey: b.constitutionKey,
      diagnosis: b.diagnosis,
      patientCount: b.patients.size,
      totalOccurrences: b.totalOccurrences,
      avgEffect: Number(avgEffect.toFixed(2)),
      confidence: Number(confidence.toFixed(3)),
      topHerbs,
      // 入库形态
      kbEntry: {
        type: 'patient_pattern',
        diagnosis: b.diagnosis,
        constitution: b.constitutionKey,
        evidence_patients: b.patients.size,
        evidence_occurrences: b.totalOccurrences,
        avg_effect: avgEffect,
        top_herbs: topHerbs.map(h => h.name),
        confidence,
        updated_at: new Date().toISOString()
      }
    });
  }
  
  return patterns.sort((a, b) => b.confidence - a.confidence);
}

// ═══ 7. 长程画像主入口 ═══

/**
 * 构建单个患者的长程画像
 * @param {String} patientId
 * @param {Object} sources - { emr, prescription, followup, tongue, constitution }
 * @returns {Object} profile
 */
function buildPatientProfile(patientId, sources) {
  const sourceArray = Object.entries(sources)
    .filter(([_, arr]) => Array.isArray(arr) && arr.length > 0)
    .map(([source, arr]) => {
      // 过滤该患者
      const filtered = arr.filter(e => 
        (e.patient_id || e.patientId) === patientId ||
        (!e.patient_id && e.patient_name && e.patient_name === patientId)
      );
      return { source, events: filtered };
    });
  
  const timeline = buildTimeline(sourceArray);
  const trajectories = detectTrajectories(timeline);
  const constitutionProfile = buildConstitutionProfile(timeline);
  
  const profile = {
    patientId,
    generatedAt: new Date().toISOString(),
    timelineCount: timeline.length,
    timeSpan: timeline.length > 1 ? {
      from: timeline[0].date,
      to: timeline[timeline.length - 1].date,
      days: Math.ceil((timeline[timeline.length - 1].timestamp - timeline[0].timestamp) / 86400000),
      label: formatSpan((timeline[timeline.length - 1].timestamp - timeline[0].timestamp) / 86400000)
    } : null,
    timeline,           // 完整时间轴（可能很长，按需访问）
    trajectories,       // 慢病轨迹
    constitutionProfile,
    summary: {
      diagnoses: [...new Set(timeline.map(e => normalizeDiagnosis(e.diagnosis)).filter(Boolean))],
      herbSet: [...new Set(timeline.flatMap(e => e.herbs))],
      eventBySource: countSources(timeline),
      chronicTrajectories: trajectories.filter(t => t.isChronic).length,
      totalHerbsUsed: [...new Set(timeline.flatMap(e => e.herbs))].length,
      totalDiagnoses: trajectories.length
    }
  };
  
  profile.vector = buildVector(profile);
  
  return profile;
}

// ═══ 8. 反向赋能（KB → 新患者推荐）═══

/**
 * 基于长程画像池，给新患者推荐循证依据
 * @param {Object} newProfile - 新患者的 profile（含 vector）
 * @param {Array} patternPool - extractPatterns() 的输出
 * @returns {Array} recommendations
 */
function recommendByPattern(newProfile, patternPool, options = {}) {
  const k = options.k || 5;
  const minConfidence = options.minConfidence || 0.4;  // 降低默认阈值（蒸馏出来的模式普遍 0.5-0.7）
  
  if (!newProfile?.vector || !patternPool.length) {
    return {
      matched: [], matchedPatterns: [], matchedCount: 0,
      topHerbs: [], expectedEffect: 0,
      evidenceLevel: 'none', evidence: '暂无可循证模式（缺少患者画像或 KB 模式库）'
    };
  }
  
  // 余弦相似度计算（纯 JS，零依赖）
  function cosine(a, b) {
    if (a.length !== b.length) return 0;
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      na += a[i] * a[i];
      nb += b[i] * b[i];
    }
    return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-10);
  }
  
  // 找相似模式
  const scored = patternPool
    .filter(p => p.confidence >= minConfidence)
    .map(p => ({
      pattern: p,
      similarity: cosine(newProfile.vector, buildPatternVector(p))
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, k);
  
  return {
    matched: scored,
    matchedPatterns: scored,
    matchedCount: scored.length,
    topHerbs: scored.length > 0 ? (scored[0].pattern.topHerbs || scored[0].pattern.top_herbs || []).map(h => typeof h === 'string' ? h : (h.name || h.herb || '')) : [],
    expectedEffect: scored.length > 0 ? (scored[0].pattern.avgEffect || scored[0].pattern.avg_effect || 0) : 0,
    evidenceLevel: scored.length > 0 && scored[0].similarity > 0.85 ? 'strong' :
                   scored.length > 0 && scored[0].similarity > 0.6 ? 'moderate' :
                   scored.length > 0 ? 'weak' : 'none',
    evidence: scored.length > 0
      ? `与 ${scored[0].pattern.evidence_patients || scored[0].pattern.patientCount || 0} 位相似患者匹配（相似度 ${(scored[0].similarity * 100).toFixed(0)}%），循证平均疗效 ${(scored[0].pattern.avg_effect || scored[0].pattern.avgEffect || 0).toFixed(1)}/5`
      : '暂无可循证模式'
  };
}

// 模式 → 向量（与 buildVector 对齐，兼容 syndrome 和 constitutionKey）
function buildPatternVector(pattern) {
  const vec = new Array(50).fill(0);
  // 体质段 36-43
  const constitutions = ['气虚', '血虚', '阴虚', '阳虚', '气滞', '血瘀', '痰湿', '湿热'];
  const consts = (pattern.constitutionKey || pattern.constitution || '').split('+').filter(Boolean);
  // 如果 pattern 只有 syndrome 没有 constitution，从 syndrome 推断体质
  if (consts.length === 0 && pattern.syndrome) {
    if (pattern.syndrome.includes('虚')) {
      if (pattern.syndrome.includes('阴虚')) consts.push('阴虚');
      else if (pattern.syndrome.includes('阳虚')) consts.push('阳虚');
      else if (pattern.syndrome.includes('血虚')) consts.push('血虚');
      else consts.push('气虚');
    }
    if (pattern.syndrome.includes('热') || pattern.syndrome.includes('火')) consts.push('湿热');
    if (pattern.syndrome.includes('瘀')) consts.push('血瘀');
  }
  for (let i = 0; i < constitutions.length; i++) {
    if (consts.includes(constitutions[i])) vec[36 + i] = 0.5;
  }
  // 疗效段
  vec[44] = (pattern.avgEffect || pattern.avg_effect || 0) / 5;
  vec[46] = 0.3;  // 慢病倾向
  vec[48] = 1;    // 是模式
  return vec;
}

// ═══ 9. KB 注入器 ═══

/**
 * 把 patterns 注入 KB（轻量级，无需数据库）
 * 用 localStorage 模拟（生产环境替换为 KB API）
 * @param {Array} patterns - extractPatterns 输出
 * @returns {Object} { added, updated, total }
 */
function injectPatternsToKB(patterns) {
  if (typeof localStorage === 'undefined') return { added: 0, updated: 0, total: 0 };
  
  const key = 'tcm_kb_patient_patterns';
  const exist = JSON.parse(localStorage.getItem(key) || '[]');
  const existMap = new Map(exist.map(p => [p.key, p]));
  
  let added = 0, updated = 0;
  for (const p of patterns) {
    if (existMap.has(p.key)) {
      // 更新 evidence 和 confidence
      const old = existMap.get(p.key);
      old.evidence_patients = p.patientCount;
      old.evidence_occurrences = p.totalOccurrences;
      old.avg_effect = p.avgEffect;
      old.confidence = p.confidence;
      old.top_herbs = p.topHerbs.map(h => h.name);
      old.updated_at = new Date().toISOString();
      updated++;
    } else {
      exist.push(p.kbEntry);
      existMap.set(p.key, p.kbEntry);
      added++;
    }
  }
  
  localStorage.setItem(key, JSON.stringify(exist));
  return { added, updated, total: exist.length };
}

// ═══ 导出 ═══

module.exports = {
  // 核心
  buildPatientProfile,
  buildTimeline,
  detectTrajectories,
  buildConstitutionProfile,
  buildVector,
  normalizeDiagnosis,
  extractHerbs,
  // 反向赋能
  extractPatterns,
  recommendByPattern,
  injectPatternsToKB,
  // 常量
  CONSTITUTION_TYPES,
  SYNDROME_TO_CONSTITUTION,
  PATTERN_MIN_PATIENTS,
  PATTERN_MIN_CONFIDENCE
};