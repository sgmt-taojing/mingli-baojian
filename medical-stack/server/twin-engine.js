// 数字孪生服务端引擎 V2.0（D3 深化 · 契约 v1.3.2）
// 【吸收自 tcm-agent 2026-09-01 · HEAD 17dc1ce · 契约 v1.3.4 含 D5 风险召回】
// 按 TCM-ABSORPTION-SPEC 移植：逻辑原样、仅改头部标注；医学域不二次训练。
// 单一事实源：真实诊疗事件（病历签发/处方/随访完成）→ snapshot 落库 data/twin/<patient_id>.json
// 前端 app/js/digital-twin.js 保留为「假设演算（what-if · 不入档）」本地预览，不产生档案。
//
// 评分定位：辅助参考，不构成诊断结论（页面与 API 均带标注）。
// 体质判定口径：参照中华中医药学会《中医体质分类与判定》(ZYYXH/T157-2009) 转化分公式
//   转化分 = (原始分 − 条目数) / (条目数 × 4) × 100
//   条目数：平和 8 / 气虚 8 / 阳虚 7 / 阴虚 8 / 痰湿 8 / 湿热 7 / 血瘀 7 / 气郁 7 / 特禀 7
//   判定：偏颇体质转化分 ≥40 为「是」，30~39 为「倾向是」；平和质 ≥60 且其余 8 种均 <40。
//   注意：本系统无标准 60 题量表采集，原始分由舌/面/症状/脉象体征映射条目得出，结果标注「推断」。

const fs = require('fs');
const path = require('path');

const TWIN_DIR = path.join(__dirname, '..', 'data', 'twin');
const MAX_SNAPSHOTS = 200; // 每患者快照上限（超出裁最旧）

// ─── 体征提取：从真实病历字段解析舌色/面色/脉性 ───
const TONGUE_COLORS = ['淡红', '淡白', '红', '绛', '紫暗'];
const FACE_COMPLEXIONS = ['明润', '晦暗', '潮红', '苍白', '萎黄', '黧黑'];
const PULSE_TRAITS = { depth: ['浮', '沉'], speed: ['迟', '数'], strength: ['无力', '有力'] };

function joinText(v) {
  if (!v) return '';
  if (Array.isArray(v)) return v.join(' ');
  if (typeof v === 'object') return Object.values(v).join(' ');
  return String(v);
}

function extractFeatures(src) {
  // src: {chief, hpi, four, symptoms, tongue, pulse, syndrome}
  const tongueText = joinText(src.tongue) + ' ' + (src.four && src.four['望'] || '');
  const faceText = (src.four && src.four['望'] || '') + ' ' + joinText(src.face);
  const pulseText = joinText(src.pulse) + ' ' + (src.four && src.four['切'] || '');
  const complaint = [src.chief || '', src.hpi || '', (src.symptoms || []).join(' ')].join(' ');

  let tongueColor = null;
  // 「紫暗」先于「红」匹配，避免「紫暗」被「暗/红」子串误吞；「淡红」先于「红」
  for (const c of ['淡红', '淡白', '紫暗', '绛', '红']) {
    if (tongueText.includes(c)) { tongueColor = c === '红' && tongueText.includes('淡红') ? '淡红' : c; break; }
  }
  let complexion = null;
  for (const c of FACE_COMPLEXIONS) { if (faceText.includes(c)) { complexion = c; break; } }

  const pulse = {};
  for (const d of PULSE_TRAITS.depth) if (pulseText.includes(d + '脉') || pulseText.includes('脉' + d)) pulse.depth = d;
  for (const s of PULSE_TRAITS.speed) if (pulseText.includes(s)) pulse.speed = s;
  if (pulseText.includes('无力') || pulseText.includes('弱')) pulse.strength = '无力';
  if (pulseText.includes('弦')) pulse.shape = '弦';
  if (pulseText.includes('滑')) pulse.shape = (pulse.shape || '') + '滑';

  return { tongueColor, complexion, pulse, complaint };
}

// ─── 健康值评分（移植自前端引擎，权重依据：面部20 舌象20 脉象15 问诊25 检验10 趋势10）───
function calcHealthScore(feat, extras) {
  const s = {};
  // 面色 0-20
  const faceMap = { '明润': 20, '潮红': 14, '晦暗': 12, '苍白': 10, '萎黄': 8, '黧黑': 5 };
  s.face = feat.complexion ? faceMap[feat.complexion] : 10;
  // 舌象 0-20
  if (feat.tongueColor) {
    const base = { '淡红': 18, '淡白': 12, '紫暗': 8, '绛': 6, '红': 13 }[feat.tongueColor] || 12;
    s.tongue = base;
  } else s.tongue = 10;
  // 脉象 0-15
  if (Object.keys(feat.pulse).length) {
    let p = 12;
    if (feat.pulse.depth) p -= 2;
    if (feat.pulse.speed) p -= 2;
    if (feat.pulse.strength === '无力') p -= 3;
    s.pulse = Math.max(5, Math.min(15, p));
  } else s.pulse = 8;
  // 问诊 0-25
  let inq = 12 + Math.min(8, (extras.symptomCount || 0) * 2);
  if (/剧烈|大出血|中风|瘫痪|休克/.test(feat.complaint)) inq -= 10;
  s.inquiry = Math.max(5, Math.min(25, inq));
  // 检验/穿戴 0-10（有检验数据即采信，异常项扣分）
  if (extras.labCount) {
    s.wearable = 8 - Math.min(3, extras.labAbnormal || 0);
  } else s.wearable = 5;
  // 趋势 0-10
  s.trend = extras.historyCount >= 3 ? 10 : 5;
  const total = s.face + s.tongue + s.pulse + s.inquiry + s.wearable + s.trend;
  return { total: Math.round(total), breakdown: s, grade: total >= 85 ? 'A' : total >= 70 ? 'B' : total >= 50 ? 'C' : 'D' };
}

// ─── 五脏评分（面部五区映射 + 舌象/症状调整）───
function calcOrganScores(feat) {
  const organs = {
    heart: { score: 70, label: '心' }, liver: { score: 70, label: '肝' },
    spleen: { score: 70, label: '脾' }, lung: { score: 70, label: '肺' },
    kidney: { score: 70, label: '肾' }
  };
  const tc = feat.tongueColor;
  if (tc === '淡白') { organs.heart.score -= 10; organs.spleen.score -= 10; }
  if (tc === '红' || tc === '绛') { organs.heart.score -= 15; organs.liver.score -= 10; }
  if (tc === '紫暗') { organs.heart.score -= 20; organs.liver.score -= 15; }
  const c = feat.complaint;
  if (/心悸|胸闷|心慌/.test(c)) organs.heart.score -= 15;
  if (/头晕|目眩|胁痛/.test(c)) organs.liver.score -= 15;
  if (/腹胀|食欲|没胃口|纳差/.test(c)) organs.spleen.score -= 15;
  if (/咳嗽|气喘|呼吸/.test(c)) organs.lung.score -= 15;
  if (/腰痛|耳鸣|怕冷|畏寒/.test(c)) organs.kidney.score -= 15;
  for (const k in organs) {
    organs[k].score = Math.max(10, Math.min(100, organs[k].score));
    organs[k].grade = organs[k].score >= 80 ? '优' : organs[k].score >= 60 ? '良' : organs[k].score >= 40 ? '中' : '差';
  }
  return organs;
}

// ─── 体质推断（D3-2：对齐 ZYYXH/T157-2009 转化分口径）───
// 每种体质的体征→条目映射；命中 1 条 = 原始分 +1（无量表应答，按「有一点」档计），
// 强体征（舌/面主症）按 2 条目权重计，原始分封顶 = 条目数 × 2。
const CONSTITUTION_ITEMS = { '平和质': 8, '气虚质': 8, '阳虚质': 7, '阴虚质': 8, '痰湿质': 8, '湿热质': 7, '血瘀质': 7, '气郁质': 7, '特禀质': 7 };

function inferConstitution(feat) {
  const raw = { '平和质': 1, '气虚质': 0, '阳虚质': 0, '阴虚质': 0, '痰湿质': 0, '湿热质': 0, '血瘀质': 0, '气郁质': 0, '特禀质': 0 };
  const tc = feat.tongueColor, cx = feat.complexion, c = feat.complaint;
  if (tc === '淡白') { raw['气虚质'] += 2; raw['阳虚质'] += 2; }
  if (tc === '红' || tc === '绛') { raw['阴虚质'] += 2; raw['湿热质'] += 1; }
  if (tc === '紫暗') { raw['血瘀质'] += 3; }
  if (tc === '淡红') { raw['平和质'] += 2; }
  if (cx === '苍白') { raw['气虚质'] += 2; raw['阳虚质'] += 1; }
  if (cx === '潮红') { raw['阴虚质'] += 2; }
  if (cx === '萎黄') { raw['气虚质'] += 1; raw['痰湿质'] += 1; }
  if (cx === '晦暗') { raw['血瘀质'] += 1; raw['气郁质'] += 1; }
  if (cx === '明润') { raw['平和质'] += 3; }
  if (/乏力|疲劳|没精神|自汗|出汗/.test(c)) raw['气虚质'] += 1;
  if (/怕冷|手脚凉|畏寒|四肢凉/.test(c)) raw['阳虚质'] += 2;
  if (/口干|盗汗|五心烦热|咽干/.test(c)) raw['阴虚质'] += 2;
  if (/腹胀|痰多|困重|纳差|便溏|大便稀/.test(c)) raw['痰湿质'] += 2;
  if (/口苦|烦躁|湿疹|小便黄/.test(c)) raw['湿热质'] += 2;
  if (/刺痛|瘀斑|月经黑|色暗/.test(c)) raw['血瘀质'] += 2;
  if (/胸闷|胁痛|情绪|抑郁|叹气/.test(c)) raw['气郁质'] += 2;
  if (/过敏|喷嚏|哮喘|皮疹/.test(c)) raw['特禀质'] += 2;
  // 医师签发证型为强证据（证名直映体质）
  if (/气虚/.test(c)) raw['气虚质'] += 2;
  if (/阳虚|脾肾阳虚|命门火衰/.test(c)) raw['阳虚质'] += 2;
  if (/阴虚|肝肾阴虚|心阴/.test(c)) raw['阴虚质'] += 2;
  if (/痰湿|痰饮|脾虚湿/.test(c)) raw['痰湿质'] += 2;
  if (/湿热|湿温/.test(c)) raw['湿热质'] += 2;
  if (/血瘀|瘀血|气滞血瘀/.test(c)) raw['血瘀质'] += 2;
  if (/气郁|肝郁|肝气郁/.test(c)) raw['气郁质'] += 2;

  const conv = {};
  for (const k in raw) {
    const n = CONSTITUTION_ITEMS[k];
    // 转化分口径：原始分 = 条目数 + raw（无量表，命中 1 体征 = 1 条「有一点」档），
    // 即 转化分 = raw/(n×4)×100；无命中 = 0 分。推断保守为设计意图。
    conv[k] = raw[k] === 0 ? 0 : Math.round((raw[k] / (n * 4)) * 1000) / 10;
  }
  // 判定规则（标准口径）：平和 = ≥60 且其余均 <40；偏颇 ≥40「是」，30~39「倾向是」
  const others = Object.keys(conv).filter(k => k !== '平和质');
  const maxOther = Math.max(...others.map(k => conv[k]));
  const pinghe = conv['平和质'] >= 60 && maxOther < 40;
  const ranked = others.map(k => [k, conv[k]]).sort((a, b) => b[1] - a[1]);
  const top = ranked[0];

  let primary, judgement;
  if (pinghe) { primary = { name: '平和质', score: conv['平和质'] }; judgement = '平和质（基本是）'; }
  else if (top[1] >= 40) { primary = { name: top[0], score: top[1] }; judgement = top[0] + '（是）'; }
  else if (top[1] >= 30) { primary = { name: top[0], score: top[1] }; judgement = top[0] + '（倾向是）'; }
  else { primary = { name: '平和质', score: conv['平和质'] }; judgement = '未见明显偏颇（倾向平和）'; }
  return {
    primary, judgement,
    secondary: ranked[1] && ranked[1][1] >= 30 && primary.name !== ranked[1][0] ? { name: ranked[1][0], score: ranked[1][1] } : null,
    converted_scores: conv,
    basis: 'ZYYXH/T157-2009 转化分口径 · 体征映射推断（非量表作答），建议执业医师确认'
  };
}

// ─── 时序趋势 + 风险 + 证型轨迹 ───
function analyzeTrends(snaps) {
  const scored = snaps.filter(s => s.health_score && s.health_score.total != null);
  if (scored.length < 2) return { trend: 'insufficient', note: '需要至少 2 次诊疗事件' };
  const recent = scored.slice(-5).map(s => s.health_score.total);
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const half = Math.floor(recent.length / 2);
  const avg1 = recent.slice(0, half).reduce((a, b) => a + b, 0) / (half || 1);
  const avg2 = recent.slice(half).reduce((a, b) => a + b, 0) / (recent.length - half || 1);
  const slope = Math.round((avg2 - avg1) * 10) / 10;
  return {
    trend: slope > 5 ? 'improving' : slope < -5 ? 'declining' : 'stable',
    slope, average_score: Math.round(avg), data_points: snaps.length,
    last_visit: snaps[snaps.length - 1].timestamp
  };
}

function extractRiskFactors(snaps) {
  const risks = [];
  const scored = snaps.map(s => (s.health_score && s.health_score.total) || 50);
  if (scored.length >= 2 && scored[scored.length - 1] < 60 && scored[scored.length - 2] < 60)
    risks.push({ type: 'declining_health', level: 'high', detail: '连续两次健康评分低于 60 分', suggestion: '建议全面检查，复辨证治' });
  const tongueAbn = snaps.filter(s => s.features && s.features.tongueColor && s.features.tongueColor !== '淡红').length;
  if (snaps.length >= 2 && tongueAbn >= snaps.length * 0.7)
    risks.push({ type: 'persistent_tongue_abnormal', level: 'medium', detail: '舌象持续异常', suggestion: '建议内调，注意饮食起居' });
  const emrSnaps = snaps.filter(s => s.source === 'emr');
  if (emrSnaps.length >= 3) {
    const same = emrSnaps.filter(s => s.syndrome && s.syndrome === emrSnaps[emrSnaps.length - 1].syndrome).length;
    if (same >= 3)
      risks.push({ type: 'chronic_condition', level: 'high', detail: '同一证型连续 ' + same + ' 次未转化', suggestion: '建议调整治疗方案，考虑会诊' });
  }
  const worsened = snaps.filter(s => s.source === 'followup' && s.effect === 'worsened').length;
  if (worsened >= 1)
    risks.push({ type: 'followup_worsened', level: 'high', detail: '随访反馈加重 ' + worsened + ' 次', suggestion: '建议尽快复诊调方' });
  return risks;
}

// D3-2 证型演变轨迹：真实病历 syndrome 时序
function syndromeTrajectory(snaps) {
  return snaps.filter(s => s.source === 'emr' && s.syndrome)
    .map(s => ({ ts: s.timestamp, syndrome: s.syndrome, formula: s.formula || '', score: s.health_score ? s.health_score.total : null }));
}

// ─── 快照构造（三事件源）───
function snapshotFromCase(rec) {
  const feat = extractFeatures(rec);
  return {
    event_id: rec.caseId, source: 'emr', timestamp: rec.timestamp,
    chief: rec.chief || '', syndrome: rec.syndrome || '', formula: rec.formula || '',
    symptoms: rec.symptoms || [], labs_count: (rec.labs || []).length,
    features: feat
  };
}

function snapshotFromRx(rx) {
  const syndrome = (rx.diagnosis && rx.diagnosis.syndrome) || '';
  const herbs = (rx.herbs || []).map(h => (typeof h === 'string' ? h : h.name)).filter(Boolean);
  return {
    event_id: rx.rx_id, source: 'prescription', timestamp: rx.created_at,
    chief: '', syndrome, formula: '',
    herbs, symptom_score: null,
    features: extractFeatures({ chief: '', symptoms: [], tongue: [], pulse: [] })
  };
}

function snapshotFromFollowup(fu) {
  return {
    event_id: fu.id, source: 'followup', timestamp: fu.completed_at || fu.created_at,
    chief: fu.feedback || '', syndrome: fu.syndrome || '', formula: fu.formula || '',
    effect: fu.effect || null, symptom_score: fu.symptom_score != null ? fu.symptom_score : null,
    features: extractFeatures({ chief: fu.feedback || '', symptoms: [], tongue: [], pulse: [] })
  };
}

// ─── 存储：load / addSnapshot（event_id 幂等）/ save ───
function twinFile(patientId) { return path.join(TWIN_DIR, patientId + '.json'); }

function loadTwin(patientId) {
  try {
    const d = JSON.parse(fs.readFileSync(twinFile(patientId), 'utf8'));
    return d && Array.isArray(d.snapshots) ? d : null;
  } catch (e) { return null; }
}

function saveTwin(twin) {
  if (!fs.existsSync(TWIN_DIR)) fs.mkdirSync(TWIN_DIR, { recursive: true });
  const tmp = twinFile(twin.patient_id) + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(twin, null, 2));
  fs.renameSync(tmp, twinFile(twin.patient_id)); // 原子替换，防半截文件
}

// ─── D5 风险信号→主动召回（契约 v1.3.4）───
// 快照落库后评估风险，高危信号自动建复诊召回单入 revisits.json（医生待办承载面）。
// 覆盖面：chronic_condition（同证型连续不转化）、declining_health（健康值连续走低）。
// 不覆盖 followup_worsened——该信号 R719 已在随访完成链路直接建单，避免双份。
// 幂等：同患者同风险类型——pending/scheduled 单 14 天内不重复；已闭环单 7 天静默期（防每快照刷屏，逾期风险仍在则合理再召回）。
const REVISIT_FILE = path.join(__dirname, '..', 'data', 'revisits.json');
const ESCALATE_TYPES = { chronic_condition: 'high', declining_health: 'high', persistent_tongue_abnormal: 'medium' };

function escalateRisks(patientId, snaps) {
  const risks = extractRiskFactors(snaps).filter(r => ESCALATE_TYPES[r.type]);
  if (!risks.length) return { escalated: 0 };
  let list = [];
  try { list = JSON.parse(fs.readFileSync(REVISIT_FILE, 'utf8') || '[]'); } catch (e) { list = []; }
  const now = Date.now();
  let escalated = 0;
  for (const risk of risks) {
    const dup = list.some(r => {
      if (r.patient_id !== patientId || r.risk_type !== risk.type) return false;
      const age = now - new Date(r.created_at).getTime();
      if (['pending', 'scheduled'].includes(r.status)) return age < 14 * 86400000;
      if (r.status === 'completed') return age < 7 * 86400000; // 闭环后 7 天静默
      return false;
    });
    if (dup) continue;
    list.push({
      id: 'RV-TWIN-' + Date.now().toString(36).toUpperCase() + '-' + risk.type.replace(/_/g, '').slice(0, 8).toUpperCase(),
      followup_id: '', consult_id: '',
      patient_id: patientId,
      patient_name: patientId, // 孪生链路只持 patient_id，展示层经 EMPI 脱敏解析
      risk_type: risk.type, risk_level: risk.level,
      syndrome: '', formula: '',
      feedback: risk.detail,
      reason: '[孪生风险] ' + risk.detail + '；' + risk.suggestion,
      source: 'twin-risk',
      status: 'pending', priority: ESCALATE_TYPES[risk.type] === 'high' ? 'high' : 'normal',
      created_at: new Date().toISOString()
    });
    escalated++;
  }
  if (escalated) {
    if (!fs.existsSync(path.dirname(REVISIT_FILE))) fs.mkdirSync(path.dirname(REVISIT_FILE), { recursive: true });
    list = list.slice(-300);
    fs.writeFileSync(REVISIT_FILE, JSON.stringify(list, null, 2));
  }
  return { escalated };
}

function addSnapshot(patientId, snap) {
  if (!patientId || !snap || !snap.event_id) return { ok: false, error: 'missing patient_id/event_id' };
  const twin = loadTwin(patientId) || { patient_id: patientId, created_at: snap.timestamp, snapshots: [] };
  if (twin.snapshots.some(s => s.event_id === snap.event_id)) return { ok: true, added: false, count: twin.snapshots.length };
  // 评分注入：历史计数用于趋势分
  const hist = twin.snapshots.length;
  snap.health_score = calcHealthScore(snap.features, {
    symptomCount: (snap.symptoms || []).length,
    labCount: snap.labs_count || 0,
    historyCount: hist
  });
  snap.organ_scores = calcOrganScores(snap.features);
  twin.snapshots.push(snap);
  twin.snapshots.sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)));
  if (twin.snapshots.length > MAX_SNAPSHOTS) twin.snapshots = twin.snapshots.slice(-MAX_SNAPSHOTS);
  twin.updated_at = new Date().toISOString();
  saveTwin(twin);
  // D5：风险信号 → 主动召回（失败不阻断主链）
  let esc = { escalated: 0 };
  try { esc = escalateRisks(patientId, twin.snapshots); } catch (e) { console.error('[twin] 风险召回失败:', e.message); }
  return { ok: true, added: true, count: twin.snapshots.length, escalated: esc.escalated };
}

// ─── 聚合模型（GET 出口）───
function computeModel(patientId) {
  const twin = loadTwin(patientId);
  if (!twin || !twin.snapshots.length) return null;
  const latest = twin.snapshots[twin.snapshots.length - 1];
  return {
    patient_id: patientId,
    snapshot_count: twin.snapshots.length,
    updated_at: twin.updated_at,
    health_score: latest.health_score,
    organ_scores: latest.organ_scores,
    constitution: inferConstitution(Object.assign({}, latest.features || {}, {
      complaint: ((latest.features && latest.features.complaint) || '') + ' ' + (latest.syndrome || '')
    })),
    trends: analyzeTrends(twin.snapshots),
    risk_factors: extractRiskFactors(twin.snapshots),
    syndrome_trajectory: syndromeTrajectory(twin.snapshots),
    timeline: twin.snapshots.slice(-30).reverse().map(s => ({
      ts: s.timestamp, source: s.source, chief: s.chief, syndrome: s.syndrome,
      formula: s.formula, effect: s.effect || null,
      score: s.health_score ? s.health_score.total : null, grade: s.health_score ? s.health_score.grade : null
    })),
    disclaimer: '辅助参考评分，不构成诊断结论；体质为体征映射推断（非量表作答）'
  };
}

// ─── 启动回填：扫描既有真实事件，幂等补建孪生体 ───
function backfillTwins(dataDir) {
  let added = 0, patients = 0;
  const seen = new Set();
  // ① 签发病历
  try {
    const ccDir = path.join(dataDir, 'confirmed-cases');
    if (fs.existsSync(ccDir)) {
      for (const f of fs.readdirSync(ccDir)) {
        if (!f.endsWith('.json')) continue;
        try {
          const c = JSON.parse(fs.readFileSync(path.join(ccDir, f), 'utf8'));
          const pid = c.patient && c.patient.patient_id;
          if (!pid) continue;
          const r = addSnapshot(pid, snapshotFromCase(c));
          if (r.added) added++;
          seen.add(pid);
        } catch (e) {}
      }
    }
  } catch (e) {}
  // ② 处方
  try {
    const rxFile = path.join(dataDir, 'prescriptions', 'records.jsonl');
    if (fs.existsSync(rxFile)) {
      for (const ln of fs.readFileSync(rxFile, 'utf8').split('\n').filter(Boolean)) {
        try {
          const rx = JSON.parse(ln);
          if (!rx.patient_id || !rx.rx_id) continue;
          const r = addSnapshot(rx.patient_id, snapshotFromRx(rx));
          if (r.added) added++;
          seen.add(rx.patient_id);
        } catch (e) {}
      }
    }
  } catch (e) {}
  // ③ 已完成随访
  try {
    const fuFile = path.join(dataDir, 'followups.json');
    if (fs.existsSync(fuFile)) {
      const list = JSON.parse(fs.readFileSync(fuFile, 'utf8') || '[]');
      for (const fu of list) {
        if (fu.status !== 'completed' || !fu.patient_id || !fu.id) continue;
        const r = addSnapshot(fu.patient_id, snapshotFromFollowup(fu));
        if (r.added) added++;
        seen.add(fu.patient_id);
      }
    }
  } catch (e) {}
  patients = seen.size;
  return { ok: true, added, patients };
}

module.exports = {
  addSnapshot, computeModel, backfillTwins,
  snapshotFromCase, snapshotFromRx, snapshotFromFollowup,
  calcHealthScore, calcOrganScores, inferConstitution, extractFeatures
};
