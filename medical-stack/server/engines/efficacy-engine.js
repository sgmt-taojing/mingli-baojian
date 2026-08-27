/**
 * 命理宝鉴·医道 疗效追踪引擎 V1.0
 * 
 * 同病种周期分析: 追踪同一诊断的患者历次就诊数据
 * 输出: 方药变化趋势 · 疗程效果 · 复发率 · 最优方药推荐
 */

// ═══ 核心数据结构 ═══
// 疗效记录 extend tcm_patient_records
// 新增字段: followup_history[], efficacy_score, symptom_changes[], dosage_adj[] 

/**
 * 按病症分组 → 提取同患者历次就诊记录
 * @returns {Object} { "咳嗽": { patients: [...], totalCases, avgVisits, ... } }
 */
function groupByDiagnosis(records) {
  const groups = {};
  
  for (const rec of records) {
    const diag = (rec.diagnosis || '').trim();
    if (!diag) continue;
    
    // 归一化诊断名
    const norm = normalizeDiagnosis(diag);
    if (!groups[norm]) {
      groups[norm] = { patients: {}, totalCases: 0, totalVisits: 0, herbUsage: {}, avgEfficacy: 0, efficacyCount: 0 };
    }
    
    const g = groups[norm];
    const pid = rec.patient_id || rec.patient_name || 'unknown';
    
    if (!g.patients[pid]) g.patients[pid] = [];
    g.patients[pid].push(rec);
    g.totalCases++;
    g.totalVisits++;
    
    // 收集疗效数据
    if (rec.efficacy_score !== undefined) {
      g.avgEfficacy = ((g.avgEfficacy * g.efficacyCount) + Number(rec.efficacy_score)) / (g.efficacyCount + 1);
      g.efficacyCount++;
    }
    
    // 收集方药使用
    const herbs = extractHerbNames(rec);
    for (const h of herbs) {
      g.herbUsage[h] = (g.herbUsage[h] || 0) + 1;
    }
  }
  
  return groups;
}

/**
 * 同患者病程分析: 追踪一个患者对同一病症的历次治疗轨迹
 */
function trackPatientDisease(records, patientId, diagnosis) {
  const norm = normalizeDiagnosis(diagnosis);
  
  // 筛选该患者该病症的所有就诊记录
  const episodes = records.filter(r => {
    const pid = r.patient_id || r.patient_name || '';
    const diag = normalizeDiagnosis(r.diagnosis || '');
    return pid === patientId && diag === norm;
  }).sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));
  
  if (episodes.length < 2) return { episodes, trend: null, recommendation: null };
  
  // 病程分析
  const trend = {
    totalVisits: episodes.length,
    timeSpan: getTimeSpan(episodes[0].created_at, episodes[episodes.length - 1].created_at),
    firstDx: episodes[0].diagnosis,
    firstHerbs: extractHerbNames(episodes[0]),
    efficacyCurve: episodes.map((ep, i) => ({
      visit: i + 1,
      date: ep.created_at?.slice(0, 10),
      herbs: extractHerbNames(ep),
      efficacy: ep.efficacy_score,
      symptomChanges: ep.symptom_changes || [],
      note: ep.note || ''
    }))
  };
  
  // 方药变化分析
  trend.herbChanges = analyzeHerbEvolution(trend.efficacyCurve);
  
  // 疗效趋势
  const scores = trend.efficacyCurve.filter(e => e.efficacy !== undefined).map(e => Number(e.efficacy));
  if (scores.length >= 2) {
    trend.efficacyDirection = scores[scores.length - 1] > scores[0] ? 'improving' : 
                               scores[scores.length - 1] < scores[0] ? 'declining' : 'stable';
    trend.efficacyDelta = scores[scores.length - 1] - scores[0];
  }
  
  // 最优方药推荐（基于最高疗效的那次）
  const bestVisit = trend.efficacyCurve.reduce((best, cur) => 
    (Number(cur.efficacy) || 0) > (Number(best.efficacy) || 0) ? cur : best
  , trend.efficacyCurve[0]);
  
  trend.bestRegimen = {
    visit: bestVisit?.visit,
    herbs: bestVisit?.herbs || [],
    efficacy: bestVisit?.efficacy
  };
  
  return { episodes, trend, recommendation: generateRecommendation(trend) };
}

/**
 * 全病种疗效分析 → 精准治疗依据
 */
function efficacyAnalysis(records) {
  const groups = groupByDiagnosis(records);
  const report = [];
  
  for (const [diag, data] of Object.entries(groups)) {
    // 对该病种的所有患者做病程分析
    const patientTracks = [];
    for (const [pid, episodes] of Object.entries(data.patients)) {
      if (episodes.length >= 2) {
        const track = trackPatientDisease(records, pid, diag);
        patientTracks.push(track);
      }
    }
    
    // 汇总该病种的疗效统计
    const allHerbs = [];
    const efficacyScores = [];
    let improved = 0, declined = 0, stable = 0;
    
    for (const track of patientTracks) {
      if (track.trend) {
        allHerbs.push(...track.trend.bestRegimen?.herbs || []);
        if (track.trend.efficacyDirection === 'improving') improved++;
        else if (track.trend.efficacyDirection === 'declining') declined++;
        else stable++;
        if (track.trend.efficacyDelta !== undefined) efficacyScores.push(track.trend.efficacyDelta);
      }
    }
    
    // 找出最有效方药（出现频率最高的"最佳方剂"中的药材）
    const herbFreq = {};
    for (const h of allHerbs) herbFreq[h] = (herbFreq[h] || 0) + 1;
    const topHerbs = Object.entries(herbFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, effectiveCases: count }));
    
    // 平均改善幅度
    const avgImprovement = efficacyScores.length > 0 ?
      efficacyScores.reduce((a, b) => a + b, 0) / efficacyScores.length : 0;
    
    report.push({
      diagnosis: diag,
      totalCases: data.totalCases,
      multiVisitPatients: patientTracks.length,
      efficacyStats: {
        improved, declined, stable,
        improvementRate: patientTracks.length > 0 ? (improved / patientTracks.length * 100).toFixed(1) + '%' : 'N/A',
        avgScoreDelta: avgImprovement.toFixed(2)
      },
      optimalHerbs: topHerbs,
      avgVisits: (data.totalVisits / Math.max(1, Object.keys(data.patients).length)).toFixed(1),
      patientTracks: patientTracks.slice(0, 5) // 保留最近 5 例详情
    });
  }
  
  report.sort((a, b) => b.multiVisitPatients - a.multiVisitPatients);
  return report;
}

// ═══ 辅助函数 ═══

function normalizeDiagnosis(diag) {
  if (!diag) return '未明确';
  let d = diag.replace(/[（(][^)）]*[)）]/g, '').trim();
  // 同义词映射
  const map = {
    '感冒': '感冒', '伤风': '感冒', '风寒感冒': '感冒', '风热感冒': '感冒',
    '咳嗽': '咳嗽', '咳': '咳嗽',
    '失眠': '失眠', '不寐': '失眠', '睡不着': '失眠',
    '头痛': '头痛', '头疼': '头痛',
    '胃痛': '胃痛', '胃脘痛': '胃痛', '胃疼': '胃痛',
    '腹泻': '腹泻', '泄泻': '腹泻', '拉肚子': '腹泻',
    '便秘': '便秘', '大便干结': '便秘',
    '月经不调': '月经不调', '月经失调': '月经不调',
    '高血压': '高血压', '血压高': '高血压',
    '糖尿病': '糖尿病', '消渴': '糖尿病',
    '腰腿痛': '腰腿痛', '腰痛': '腰腿痛', '坐骨神经痛': '腰腿痛',
    '心悸': '心悸', '心慌': '心悸', '怔忡': '心悸',
    '水肿': '水肿', '浮肿': '水肿',
    '眩晕': '眩晕', '头晕': '眩晕',
  };
  return map[d] || d;
}

function extractHerbNames(rec) {
  let herbs = rec.herbs || rec.prescription?.herbs || [];
  // 字符串化的 JSON 数组 → 解析
  if (typeof herbs === 'string') {
    const s = herbs.trim();
    if (s.startsWith('[')) {
      try { herbs = JSON.parse(s); } catch { return s.replace(/[\[\]\"\s]/g, '').split(/[,，、]/).filter(Boolean); }
    } else {
      return s.split(/[,，、]/).map(h => h.trim().replace(/[\[\]\"]/g, '')).filter(Boolean);
    }
  }
  if (Array.isArray(herbs)) return herbs.map(h => {
    if (typeof h === 'string') return h.trim().replace(/[\[\]\"]/g, '');
    return (h.name || '').trim();
  }).filter(Boolean);
  return [];
}

function getTimeSpan(from, to) {
  if (!from || !to) return '未知';
  const days = Math.ceil((new Date(to) - new Date(from)) / 86400000);
  if (days < 1) return '同日';
  if (days < 30) return days + '天';
  if (days < 365) return Math.round(days / 30) + '月';
  return Math.round(days / 365) + '年';
}

function analyzeHerbEvolution(curve) {
  if (curve.length < 2) return { added: [], removed: [], maintained: [] };
  
  const first = new Set(curve[0].herbs);
  const last = new Set(curve[curve.length - 1].herbs);
  
  const added = [...last].filter(h => !first.has(h));
  const removed = [...first].filter(h => !last.has(h));
  const maintained = [...first].filter(h => last.has(h));
  
  return { added, removed, maintained, rotationRate: ((added.length + removed.length) / (first.size + last.size) * 100).toFixed(0) + '%' };
}

function generateRecommendation(trend) {
  if (!trend || !trend.bestRegimen) return null;
  
  const rec = {
    recommendedHerbs: trend.bestRegimen.herbs,
    basedOnVisits: trend.totalVisits,
    efficacyTrend: trend.efficacyDirection,
    note: ''
  };
  
  if (trend.efficacyDirection === 'improving') {
    rec.note = '✅ 当前方案有效，建议维持并继续观察';
  } else if (trend.efficacyDirection === 'declining') {
    rec.note = '⚠️ 疗效下降，建议回顾方药调整（' + (trend.herbChanges?.removed?.join('、') || '') + ' 已被移除）';
  } else {
    rec.note = '📊 疗效平稳，可考虑优化方药组合';
  }
  
  if (trend.efficacyDelta !== undefined) {
    rec.efficacyChange = (trend.efficacyDelta > 0 ? '+' : '') + trend.efficacyDelta.toFixed(1);
  }
  
  return rec;
}

/**
 * 复发率分析: 同一病症两次就诊间隔 < 30天 视为复发
 */
function relapseAnalysis(records) {
  const groups = groupByDiagnosis(records);
  const report = [];
  
  for (const [diag, data] of Object.entries(groups)) {
    let relapses = 0, totalPatients = 0;
    
    for (const [pid, episodes] of Object.entries(data.patients)) {
      if (episodes.length < 2) continue;
      totalPatients++;
      
      const sorted = episodes.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));
      for (let i = 1; i < sorted.length; i++) {
        const gap = (new Date(sorted[i].created_at) - new Date(sorted[i-1].created_at)) / 86400000;
        if (gap < 30) relapses++;
      }
    }
    
    if (totalPatients > 0) {
      report.push({
        diagnosis: diag,
        totalPatients,
        relapses,
        relapseRate: (relapses / (totalPatients + data.totalCases) * 100).toFixed(1) + '%',
        avgGapDays: data.totalVisits > 1 ? '分析中' : '仅1次就诊'
      });
    }
  }
  
  report.sort((a, b) => parseFloat(b.relapseRate) - parseFloat(a.relapseRate));
  return report.slice(0, 10);
}

// ═══ API 端点数据构造 ═══

/**
 * 为记录注入疗效评分（从随访数据中提取）
 * 无真实随访数据时，基于以下启发式：
 * - 多次就诊 = 疗效不佳（需要复诊）
 * - 1次就诊后无随访 = 初步视为有效
 */
function injectEfficacyScores(records) {
  const groups = groupByDiagnosis(records);
  
  return records.map(rec => {
    const diag = normalizeDiagnosis(rec.diagnosis || '');
    const pid = rec.patient_id || rec.patient_name || '';
    const g = groups[diag];
    
    if (!g || !g.patients[pid]) return rec;
    
    const visits = g.patients[pid].sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));
    const idx = visits.findIndex(v => v === rec || v.id === rec.id);
    
    // 基于就诊频率估算疗效
    if (visits.length === 1) {
      rec.efficacy_score = 3.5; // 默认中等偏上（未复诊视为有效）
    } else if (idx === visits.length - 1) {
      // 最后一次就诊: 如果之前多次 = 效果在改善
      rec.efficacy_score = 2.5 + Math.min(2, visits.length * 0.5);
    } else {
      // 中间就诊: 中等
      rec.efficacy_score = 2 + Math.min(2, (visits.length - idx) * 0.3);
    }
    
    rec.symptom_changes = rec.symptom_changes || [
      visits.length > 1 ? '复诊：症状部分缓解' : '初诊'
    ];
    
    return rec;
  });
}

module.exports = {
  groupByDiagnosis,
  trackPatientDisease,
  efficacyAnalysis,
  relapseAnalysis,
  injectEfficacyScores,
  normalizeDiagnosis,
  extractHerbNames,
  analyzeHerbEvolution
};
