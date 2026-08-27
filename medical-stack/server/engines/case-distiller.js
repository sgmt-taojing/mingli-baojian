/**
 * 命理宝鉴·医道 案例蒸馏器 V1.0
 *
 * 从真实诊疗事件中提取"症状群→辨证→方药→疗效"四元组，
 * 计算置信度，反向赋能 KB。
 *
 * 设计目标（用户要求）：
 *   - 不脱离自有 KB 凭空创造理论
 *   - 不补中医主流观点，只补本系统真实诊疗中涌现的新模式
 *   - 蒸馏出来的 KB 条目必须有 evidence_patients + evidence_occurrences + avg_effect
 *   - trust_score 由疗效 + 患者数 + 复发率综合计算（不用平均）
 *
 * 输入: data/ 下的 tcm_emr.json + tcm_prescriptions.json + tcm_followup_log.json
 * 输出: {
 *   patterns: [{...}],
 *   bySyndrome: { '肝郁脾虚': [{...}, ...] },
 *   byHerb: { '柴胡': [patientId,...], ... },
 *   stats: { totalEMRs, totalRx, totalFollowups, totalPatterns, avgTrust, topHerbs }
 * }
 */

'use strict';

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const KB_DIR = path.join(__dirname, '../kb');

// ═══ 常量 ═══

const MIN_PATIENTS = 2;            // 至少 2 个患者共享该模式
const MIN_OCCURRENCES = 3;         // 至少 3 次诊疗事件
const MIN_AVG_EFFECT = 3.0;        // 平均疗效至少 3.0（满分 5）
const HIGH_TRUST_EFFECT = 4.2;     // 平均疗效 ≥ 4.2 才能打 high trust
const HIGH_TRUST_MIN_PATIENTS = 5; // 至少 5 个患者 + 高疗效 = high trust
const LOW_TRUST_MAX_EFFECT = 2.5;  // 平均疗效 ≤ 2.5 = low trust（要被复审）

/**
 * 加载 3 个核心数据文件（带 fallback）
 */
function loadData() {
  const safeRead = (file, fallback) => {
    const fp = path.join(DATA_DIR, file);
    try {
      return JSON.parse(fs.readFileSync(fp, 'utf-8'));
    } catch (e) {
      console.warn(`[case-distiller] ${file} 读取失败: ${e.message}，使用 fallback`);
      return fallback;
    }
  };
  return {
    emrs: safeRead('tcm_emr.json', []),
    rxs: safeRead('tcm_prescriptions.json', []),
    followups: safeRead('tcm_followup_log.json', [])
  };
}

/**
 * 把 EMR + 处方 + 随访按患者+时间对齐
 */
function buildVisits(data) {
  const { emrs, rxs, followups } = data;
  const visitsByPatient = new Map(); // patientId -> [{time, emr, rx, followup}]

  // EMR 主导（兼容字段名: patientId/patient_id, diagnosisTime/created_at/time）
  for (const e of emrs) {
    const pid = e.patientId || e.patient_id;
    if (!pid) continue;
    if (!visitsByPatient.has(pid)) visitsByPatient.set(pid, []);
    visitsByPatient.get(pid).push({
      time: e.diagnosisTime || e.created_at || e.createdAt || e.time,
      emr: e,
      rx: null,
      followup: null
    });
  }

  // 处方挂到同患者同时间的 visit
  for (const r of rxs) {
    const pid = r.patientId || r.patient_id;
    const rTime = r.prescribedAt || r.created_at || r.createdAt || r.time;
    if (!pid || !visitsByPatient.has(pid)) continue;
    const visits = visitsByPatient.get(pid);
    let visit = visits.find(v => {
      if (!v.time) return false;
      const diffMs = Math.abs(new Date(v.time) - new Date(rTime));
      return diffMs < 24 * 60 * 60 * 1000; // 24h 内算同次就诊
    });
    if (!visit) {
      visit = { time: rTime, emr: null, rx: r, followup: null };
      visits.push(visit);
    } else {
      visit.rx = r;
    }
  }

  // 随访挂到下次 visit（或新建一条）
  for (const f of followups) {
    const pid = f.patientId || f.patient_id;
    const fTime = f.followupTime || f.visit_date || f.created_at || f.time;
    if (!pid || !visitsByPatient.has(pid)) continue;
    visitsByPatient.get(pid).push({
      time: fTime,
      emr: null,
      rx: null,
      followup: f
    });
  }

  // 排序
  for (const arr of visitsByPatient.values()) {
    arr.sort((a, b) => new Date(a.time) - new Date(b.time));
  }
  return visitsByPatient;
}

/**
 * 提取单次 visit 的四元组（兼容 EMR 自带 herbs/efficacy_score 的简化结构）
 */
function extractVisitSignature(visit) {
  if (!visit.emr) return null;
  const e = visit.emr;
  const r = visit.rx;

  // 症状群（EMR 可能用 chief_complaint 字符串或 symptoms 数组）
  const symptoms = Array.isArray(e.symptoms) ? e.symptoms.filter(Boolean) : [];
  const complaint = e.chief_complaint || e.chiefComplaint || e.complaint || '';

  // 辨证
  const syndrome = e.syndrome || e.diagnosis || e.syndromeName || '待辨证';

  // 舌脉
  const tongue = e.tongue || '';
  const pulse = e.pulse || '';

  // 方药：优先用 EMR 自带 herbs（简化结构），其次从处方 rx 取
  const emrHerbs = Array.isArray(e.herbs) ? e.herbs : [];
  const rxHerbs = r ? (Array.isArray(r.herbs) ? r.herbs : (r.medicines || []).map(h => typeof h === 'string' ? h : (h.name || h.herb || ''))) : [];
  const herbs = (emrHerbs.length > 0 ? emrHerbs : rxHerbs).filter(Boolean);
  const formula = r ? (r.formula || r.formulaName || '') : '';

  // 疗效：优先 EMR 的 efficacy_score，其次从随访取 effect
  let effect = null;
  if (e.efficacy_score != null) effect = parseFloat(e.efficacy_score);
  else if (visit.followup && visit.followup.effect != null) effect = parseFloat(visit.followup.effect);
  else if (visit.followup && visit.followup.effectScore != null) effect = parseFloat(visit.followup.effectScore);

  return {
    time: visit.time,
    symptoms,
    complaint,
    syndrome,
    tongue,
    pulse,
    herbs,
    formula,
    effect
  };
}

/**
 * 计算单条模式的 trust_score（不是平均，是综合）
 *
 * trust = 0.5*疗效比 + 0.3*患者数比 + 0.2*时间新鲜度
 */
function computeTrust(patients, occurrences, avgEffect, daysSinceLastVisit) {
  const effectRatio = Math.min(avgEffect / 5, 1);          // 疗效 0-1
  const patientRatio = Math.min(patients / HIGH_TRUST_MIN_PATIENTS, 1); // 患者数 0-1
  const freshness = Math.max(0, 1 - daysSinceLastVisit / 365); // 1年内新鲜
  return +(0.5 * effectRatio + 0.3 * patientRatio + 0.2 * freshness).toFixed(3);
}

/**
 * 主函数：蒸馏 KB 模式
 */
function distillPatterns(opts = {}) {
  const minPatients = opts.minPatients ?? MIN_PATIENTS;
  const minOccurrences = opts.minOccurrences ?? MIN_OCCURRENCES;
  const minAvgEffect = opts.minAvgEffect ?? MIN_AVG_EFFECT;

  const data = loadData();
  const visitsByPatient = buildVisits(data);

  // 按 syndrome 分桶
  const syndromeBuckets = new Map(); // syndrome -> [{patientId, sig}]

  for (const [pid, visits] of visitsByPatient.entries()) {
    for (const v of visits) {
      const sig = extractVisitSignature(v);
      if (!sig || !sig.syndrome) continue;
      if (!syndromeBuckets.has(sig.syndrome)) syndromeBuckets.set(sig.syndrome, []);
      syndromeBuckets.get(sig.syndrome).push({ patientId: pid, sig });
    }
  }

  // 提取高频药材
  const herbFreq = new Map();
  for (const arr of syndromeBuckets.values()) {
    for (const { sig } of arr) {
      for (const h of sig.herbs) {
        if (!herbFreq.has(h)) herbFreq.set(h, { count: 0, totalEffect: 0, withEffect: 0 });
        const rec = herbFreq.get(h);
        rec.count++;
        if (sig.effect != null) {
          rec.totalEffect += sig.effect;
          rec.withEffect++;
        }
      }
    }
  }

  // 生成模式
  const patterns = [];
  const now = Date.now();

  for (const [syndrome, items] of syndromeBuckets.entries()) {
    const patientSet = new Set(items.map(i => i.patientId));
    const occurrences = items.length;
    if (patientSet.size < minPatients || occurrences < minOccurrences) continue;

    // 平均疗效
    const effects = items.map(i => i.sig.effect).filter(e => e != null);
    const avgEffect = effects.length > 0 ? +(effects.reduce((a, b) => a + b, 0) / effects.length).toFixed(2) : 0;
    if (avgEffect < minAvgEffect) continue;

    // 高频药材 top10
    const herbStats = new Map();
    for (const { sig } of items) {
      for (const h of sig.herbs) {
        if (!herbStats.has(h)) herbStats.set(h, { herb: h, count: 0, effectSum: 0, effectN: 0 });
        const rec = herbStats.get(h);
        rec.count++;
        if (sig.effect != null) { rec.effectSum += sig.effect; rec.effectN++; }
      }
    }
    const topHerbs = [...herbStats.values()]
      .filter(h => h.count >= 2)
      .map(h => ({
        herb: h.herb,
        count: h.count,
        avgEffect: h.effectN > 0 ? +(h.effectSum / h.effectN).toFixed(2) : null
      }))
      .sort((a, b) => b.count - a.count || (b.avgEffect || 0) - (a.avgEffect || 0))
      .slice(0, 10);

    // 时间新鲜度
    const latestTime = Math.max(...items.map(i => new Date(i.sig.time).getTime()));
    const daysSince = Math.floor((now - latestTime) / 86400000);

    // 信任分
    const trust = computeTrust(patientSet.size, occurrences, avgEffect, daysSince);

    // 高频症状 top5
    const symptomStats = new Map();
    for (const { sig } of items) {
      for (const s of [...sig.symptoms, ...(sig.complaint ? [sig.complaint] : [])]) {
        if (!symptomStats.has(s)) symptomStats.set(s, { symptom: s, count: 0 });
        symptomStats.get(s).count++;
      }
    }
    const topSymptoms = [...symptomStats.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(s => s.symptom);

    // KB 条目
    const pattern = {
      id: `patt_${syndrome}_${patientSet.size}p_${Date.now().toString(36)}`,
      type: 'distilled_syndrome',
      syndrome,
      evidence_patients: patientSet.size,
      evidence_occurrences: occurrences,
      avg_effect: avgEffect,
      top_herbs: topHerbs,
      top_symptoms: topSymptoms,
      confidence: trust,
      trust_score: trust,
      grade: trust >= 0.85 ? 'gold' : trust >= 0.7 ? 'silver' : trust >= 0.5 ? 'bronze' : 'draft',
      first_seen: new Date(Math.min(...items.map(i => new Date(i.sig.time).getTime()))).toISOString(),
      last_seen: new Date(latestTime).toISOString(),
      days_since_last: daysSince,
      updated_at: new Date().toISOString(),
      source: 'case-distiller v1.0',
      module: 'distilled_syndrome'
    };
    patterns.push(pattern);
  }

  // 按 confidence 降序
  patterns.sort((a, b) => b.confidence - a.confidence);

  return {
    patterns,
    bySyndrome: Object.fromEntries(syndromeBuckets.entries()),
    byHerb: Object.fromEntries(herbFreq.entries()),
    stats: {
      totalEMRs: data.emrs.length,
      totalRx: data.rxs.length,
      totalFollowups: data.followups.length,
      totalPatients: visitsByPatient.size,
      totalPatterns: patterns.length,
      avgTrust: patterns.length > 0 ? +(patterns.reduce((s, p) => s + p.confidence, 0) / patterns.length).toFixed(3) : 0,
      avgEffect: patterns.length > 0 ? +(patterns.reduce((s, p) => s + p.avg_effect, 0) / patterns.length).toFixed(2) : 0,
      topHerbs: [...herbFreq.entries()]
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10)
        .map(([herb, rec]) => ({ herb, count: rec.count }))
    }
  };
}

/**
 * 把蒸馏结果写入 KB 文件（追加模式 + 去重）
 */
function injectToKB(patterns) {
  if (!fs.existsSync(KB_DIR)) fs.mkdirSync(KB_DIR, { recursive: true });
  const fp = path.join(KB_DIR, 'distilled-patterns.json');
  let existing = [];
  try { existing = JSON.parse(fs.readFileSync(fp, 'utf-8')); } catch (e) {}

  const byId = new Map(existing.map(p => [p.id, p]));
  let added = 0, updated = 0;
  for (const p of patterns) {
    if (byId.has(p.id)) {
      const old = byId.get(p.id);
      Object.assign(old, p);
      updated++;
    } else {
      byId.set(p.id, p);
      added++;
    }
  }
  const merged = [...byId.values()];
  fs.writeFileSync(fp, JSON.stringify(merged, null, 2));
  return { added, updated, total: merged.length, file: fp };
}

// ═══ 反馈驱动 trust 调整（DPPO 在线学习）═══════════════════════════
/**
 * 医生采纳 AI 辨证 → +trust；修正 → -trust
 * 按 syndrome 找所有匹配的 KB 模式，调整 trust 并同步到 distilled-patterns.json
 * 返回调整结果用于仪表盘反馈
 */
function adjustTrustByFeedback(syndrome, agreed) {
  if (!syndrome) return { adjusted: 0, patterns: [] };
  const path = require('path');
  const fs = require('fs');
  const FP = path.join(__dirname, '../kb/distilled-patterns.json');
  let arr = [];
  try { arr = JSON.parse(fs.readFileSync(FP, 'utf-8')); } catch (e) { arr = []; }
  const delta = agreed ? +0.05 : -0.05;
  const adjusted = [];
  for (const p of arr) {
    if (p.syndrome === syndrome || (p.syndrome && syndrome && (p.syndrome.includes(syndrome) || syndrome.includes(p.syndrome)))) {
      const oldTrust = p.confidence || 0.5;
      const newTrust = Math.max(0, Math.min(1, oldTrust + delta));
      p.confidence = newTrust;
      // 重算 grade
      p.grade = newTrust >= 0.85 ? 'gold' : newTrust >= 0.7 ? 'silver' : newTrust >= 0.5 ? 'bronze' : 'draft';
      p.last_feedback = { agreed, at: new Date().toISOString() };
      adjusted.push({ syndrome: p.syndrome, oldTrust, newTrust, grade: p.grade });
    }
  }
  if (adjusted.length > 0) {
    fs.writeFileSync(FP, JSON.stringify(arr, null, 2));
    // 记录调整到 JSONL（仅供溯源/仪表盘）
    const TR_LOG = path.join(__dirname, '../../data/tcm_trust_adjustments.jsonl');
    const entry = { time: new Date().toISOString(), syndrome, agreed, delta, adjusted };
    fs.appendFileSync(TR_LOG, JSON.stringify(entry) + '\n');
  }
  return { adjusted: adjusted.length, patterns: adjusted };
}

module.exports = {
  distillPatterns,
  injectToKB,
  loadData,
  buildVisits,
  extractVisitSignature,
  computeTrust,
  adjustTrustByFeedback,
  // 常量
  MIN_PATIENTS,
  MIN_OCCURRENCES,
  MIN_AVG_EFFECT
};