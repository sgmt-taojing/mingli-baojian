/**
 * 命理宝鉴·医道 · 多模态融合引擎 v1.0
 * 整合: 舌面 + 脉诊 + 问诊 → 综合辨证
 * 标杆: Med-PaLM M / HuatuoGPT-Vision
 */
const TONGUE = require('./tongue-inhouse-engine.js');
const PULSE = require('./pulse-engine.js');
const INHOUSE = require('./inhouse-model.js');

/**
 * 多模态输入融合
 */
function fuse(modalities = {}) {
  const { tongue, pulse, inquiry } = modalities;
  const complaint = (modalities.complaint) || (inquiry && inquiry.complaint) || (Array.isArray(inquiry) ? inquiry.join(' ') : '');

  // 1. 各模态独立诊断
  const results = {
    tongue: tongue ? TONGUE.diagnose(tongue) : null,
    pulse: pulse ? PULSE.analyzePulse({ pulses: pulse.pulses || [pulse.type], cun: pulse.cun, guan: pulse.guan, chi: pulse.chi }) : null,
    inquiry: inquiry ? INHOUSE.diagnose(complaint, inquiry) : null
  };

  // 2. 提取各模态的主证
  const syndromes = [];
  const formulas = [];
  const evidences = [];
  const weights = [];

  if (results.tongue) {
    syndromes.push(results.tongue.diagnosis.primary_syndrome);
    formulas.push(...results.tongue.diagnosis.formulas);
    evidences.push(`舌象: ${results.tongue.diagnosis.classical_evidence}`);
    weights.push(0.35);  // 舌面权重 35%
  }

  if (results.pulse) {
    const matchedPulses = (results.pulse.pulses || []).map(p => (p.pulse || (typeof p === 'string' ? p : '未明')));
    // 28 脉对应证型可以从 PULSE_KB 静态映射
    const PULSE_SYNDROME = {'弦':['肝郁气滞','肝阳上亢'],'细':['血虚','阴虚','气虚'],'数':['热证','阴虚'],'迟':['寒证','阳虚'],'滑':['痰湿','食积'],'涩':['血瘀','气滞'],'沉':['里证','里虚'],'浮':['表证'],'洪':['热盛','阳明经热'],'弱':['气虚','血虚']};
    syndromes.push(...(results.pulse.likely_syndromes || []));
    matchedPulses.forEach(p => { if (PULSE_SYNDROME[p]) syndromes.push(...PULSE_SYNDROME[p]); });
    // 脉象草药 → 方剂映射
    const HERB_FORMULA = {'当归':'四物汤','熟地':'六味地黄丸','白芍':'四物汤','黄连':'黄连解毒汤','黄芩':'黄连解毒汤','栀子':'龙胆泻肝汤','柴胡':'柴胡疏肝散','白术':'四君子汤','茯苓':'四君子汤'};
    (results.pulse.recommended_herbs || []).forEach(h => { if (HERB_FORMULA[h]) formulas.push(HERB_FORMULA[h]); });
    evidences.push(`脉象: ${matchedPulses.join('+') || '未明'}`);
    weights.push(0.25);  // 脉诊权重 25%
  }

  if (results.inquiry) {
    syndromes.push(results.inquiry.primary_syndrome.syndrome);
    // 加上 differential 全部证型(减权)
    (results.inquiry.differential || []).slice(1, 3).forEach(d => { syndromes.push(d.syndrome + '*'); });
    formulas.push(results.inquiry.primary_formula.formula);
    formulas.push(...(results.inquiry.formula_options || []).slice(0, 2).map(f => f.formula));
    evidences.push(`问诊: ${results.inquiry.differential.map(d => d.syndrome).slice(0,2).join('+')}`);
    weights.push(0.40);  // 问诊权重 40%
  }

  // 3. 加权投票 — 每个证型累积其模态权重
  const syndromeScores = {};
  if (results.tongue) {
    const s = results.tongue.diagnosis.primary_syndrome;
    if (s) syndromeScores[s] = (syndromeScores[s] || 0) + 0.35;
  }
  if (results.pulse) {
    (results.pulse.likely_syndromes || []).forEach(s => {
      syndromeScores[s] = (syndromeScores[s] || 0) + 0.25;
    });
    const PULSE_SYNDROME = {'弦':['肝郁气滞','肝阳上亢'],'细':['血虚','阴虚','气虚'],'数':['热证','阴虚'],'迟':['寒证','阳虚'],'滑':['痰湿','食积'],'涩':['血瘀','气滞'],'沉':['里证','里虚'],'浮':['表证'],'洪':['热盛','阳明经热'],'弱':['气虚','血虚']};
    const matchedPulses = (results.pulse.pulses || []).map(p => (p.pulse || (typeof p === 'string' ? p : '')));
    matchedPulses.forEach(p => { (PULSE_SYNDROME[p] || []).forEach(s => { syndromeScores[s] = (syndromeScores[s] || 0) + 0.15; }); });
  }
  if (results.inquiry) {
    const s = results.inquiry.primary_syndrome.syndrome;
    if (s) syndromeScores[s] = (syndromeScores[s] || 0) + 0.40;
    (results.inquiry.differential || []).slice(1, 3).forEach(d => {
      syndromeScores[d.syndrome] = (syndromeScores[d.syndrome] || 0) + (d.confidence || 0) * 0.20;
    });
  }

  // 4. 综合辨证
  const sortedSyndromes = Object.entries(syndromeScores)
    .filter(([s, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([s, score]) => ({ syndrome: s, confidence: Math.min(1, score), weight: Math.round(score * 100) / 100 }));

  const formulaFreq = {};
  formulas.forEach(f => { formulaFreq[f] = (formulaFreq[f] || 0) + 1; });
  const topFormulas = Object.entries(formulaFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([f, count]) => ({ formula: f, freq: count }));

  // 5. 一致性评估
  const consistency = evaluateConsistency(sortedSyndromes);

  return {
    ok: true,
    model: 'multimodal-fusion-v1',
    modalities_used: Object.keys(modalities).filter(k => modalities[k]),
    fused_diagnosis: {
      primary_syndrome: sortedSyndromes[0],
      differential: sortedSyndromes.slice(0, 5),
      formulas: topFormulas,
      evidences,
      consistency_score: consistency
    },
    detail: results,
    confidence: (sortedSyndromes[0]?.confidence || 0).toFixed ? sortedSyndromes[0].confidence : 0,
    needs_doctor_review: consistency < 0.7
  };
}

// 高一致性→自动归档；低一致性→创建医审工单
function archive(result, patientId, doctorId) {
  if (!result || !result.ok) return { ok: false, error: '融合失败,不能归档' };
  const archDir = path.join(__dirname, '..', '..', 'data', 'multimodal-archive');
  if (!fs.existsSync(archDir)) fs.mkdirSync(archDir, { recursive: true });

  const id = 'MM-' + Date.now().toString(36).toUpperCase();
  const archive_record = {
    id, patientId, doctorId,
    fused_diagnosis: result.fused_diagnosis,
    modalities_used: result.modalities_used,
    confidence: result.confidence,
    consistency_score: result.fused_diagnosis.consistency_score,
    auto_archived: !result.needs_doctor_review,
    createdAt: new Date().toISOString()
  };
  fs.writeFileSync(path.join(archDir, id + '.json'), JSON.stringify(archive_record, null, 2));

  // 低一致性→联动医审工单
  if (result.needs_doctor_review) {
    try {
      const { createDraft } = require('./audit-engine.js');
      const draft = createDraft(archive_record, patientId, doctorId || 'auto-flagged');
      archive_record.audit_draft = draft.id;
      fs.writeFileSync(path.join(archDir, id + '.json'), JSON.stringify(archive_record, null, 2));
    } catch (e) { /* 医审引擎未加载则跳过 */ }
  }
  return archive_record;
}

function evaluateConsistency(sortedSyndromes) {
  if (!sortedSyndromes || sortedSyndromes.length === 0) return 0;
  const top = sortedSyndromes[0];
  const totalWeight = sortedSyndromes.reduce((s, x) => s + (Number(x.weight) || 0), 0);
  if (totalWeight === 0) return 0;
  return Math.min(1, (Number(top.weight) || 0) / totalWeight);
}

module.exports = { fuse, archive };
