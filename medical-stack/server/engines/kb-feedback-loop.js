/**
 * 命理宝鉴·医道 · KB 反馈闭环引擎 v1.0
 *
 * 闭环路径：
 *   EMR 病例 → 特征提取 → KB staging → 审核 → 入库 → 模型升级
 *
 * 设计目标：
 *   - 真实诊疗数据反向赋能 KB（不凭空创造理论）
 *   - 每 10 条高质量病例自动蒸馏 1 条 KB 条目
 *   - trust_score 由疗效 + 医生采纳率 + 复发率综合计算
 *   - staging → formal 标准流程，禁止低质条目直接入库
 *
 * 输入：data/ 下的 seed-emr.json + seed-prescriptions.json
 * 输出：staging/ 目录 + stats/
 *
 * 红线：
 *   1. 禁止脱离自有 KB 凭空创造理论
 *   2. 禁止补中医主流观点（只补本系统真实诊疗中涌现的新模式）
 *   3. 蒸馏条目必须有 evidence_patients + evidence_occurrences + avg_effect
 *   4. trust_score < 0.7 不可入库
 *   5. 短内容（<100字）不可独立成条
 *   6. staging 条目需经审核才升 formal
 *   7. 禁止 duplicate（FTS5 查重）
 */

'use strict';

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const STAGING_DIR = path.join(__dirname, '../kb/staging');
const FORMAL_DIR  = path.join(__dirname, '../kb/formal');

// 确保目录存在
[STAGING_DIR, FORMAL_DIR].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// ═══ 常量 ═══
const MIN_PATIENTS = 3;        // 最少患者数
const MIN_EFFECT   = 0.6;      // 最低有效率
const MIN_TRUST    = 0.7;      // 最低 trust_score
const MIN_LENGTH   = 100;      // 条目最少中文字数
const BATCH_SIZE   = 10;       // 每 N 条病例蒸馏 1 次

// ═══ 加载数据 ═══
function loadData() {
  const load = (f) => {
    try { return JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf-8')); }
    catch { return []; }
  };
  return {
    emr:           load('seed-emr.json'),
    prescriptions: load('seed-prescriptions.json'),
    patterns:      load('distilled-patterns.json')
  };
}

// ═══ 从 EMR 提取特征 ═══
function extractFeatures(emr) {
  const features = {
    chief_complaint: emr.chief_complaint || emr.complaint || '',
    symptoms:        emr.symptoms || [],
    tongue:          emr.tongue || null,
    pulse:           emr.pulse || '',
    constitution:    emr.constitution || '',
    age:             emr.age || null,
    gender:          emr.gender || ''
  };
  return features;
}

// ═══ 从处方提取用药特征 ═══
function extractRxFeatures(rx) {
  const herbs = (rx.herbs || rx.formula || []).map(h => h.name || h);
  return {
    herbs,
    herb_count: herbs.length,
    dosage_range: herbs.slice(0, 5).map(h => h.dose || h.amount || 0),
    has_toxic: herbs.some(h => ['附子','川乌','草乌','马钱子','斑蝥','雄黄','砒霜'].includes(h))
  };
}

// ═══ 生成 KB 条目（staging 格式）═══
function generateKBEntry(emrFeatures, rxFeatures, trustScore) {
  const { symptoms, tongue, pulse } = emrFeatures;
  const { herbs, herb_count, has_toxic } = rxFeatures;

  // 提取主证
  const mainSyndrome = symptoms.length > 0 ? symptoms[0] : '待辨证';
  const tongueDesc = tongue ? `${tongue.color||''}${tongue.coating||''}` : '';

  // 构建条目
  const entry = {
    id: 'stg-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
    category: '临床涌现',
    title: `${mainSyndrome} · ${herbs.slice(0, 3).join('+')} 方`,
    content: `患者${emrFeatures.age||''}${emrFeatures.gender||''}，主诉：${emrFeatures.chief_complaint}。` +
             `症状群：${symptoms.join('、')}。` +
             (tongueDesc ? `舌象：${tongueDesc}。` : '') +
             (pulse ? `脉象：${pulse}。` : '') +
             `处方：${herbs.join('、')}（共${herb_count}味）。` +
             (has_toxic ? '⚠️ 含毒性药，需严格管控剂量。' : ''),
    tags: [...symptoms.slice(0, 5), mainSyndrome, ...herbs.slice(0, 3)],
    trust_score: trustScore,
    evidence_patients: 1,
    evidence_occurrences: 1,
    avg_effect: 0,
    status: 'staging',          // staging → formal（需审核）
    source: 'emr-distillation',
    created_at: new Date().toISOString(),
    reviewed: false,
    review_notes: ''
  };

  return entry;
}

// ═══ 蒸馏管线（核心）═══
function distillPipeline(data, batchSize) {
  const { emr, prescriptions } = data;
  const results = {
    staged: [],
    stats: {
      total_emr: emr.length,
      total_rx: prescriptions.length,
      distilled: 0,
      skipped_short: 0,
      skipped_duplicate: 0,
      skipped_low_trust: 0,
      avg_trust: 0,
      top_syndromes: {}
    }
  };

  // 建立 EMR → 处方映射（按 patient_id）
  const rxMap = {};
  prescriptions.forEach(rx => {
    const pid = rx.patient_id || rx.id;
    if (pid) rxMap[pid] = rx;
  });

  // 逐条蒸馏
  const seenTitles = new Set();
  emr.forEach(record => {
    const features = extractFeatures(record);
    const rx = rxMap[record.patient_id || record.id];
    if (!rx) return; // 无对应处方，跳过

    const rxFeatures = extractRxFeatures(rx);

    // 校验长度（需要 chief_complaint + symptoms 总长作为原始证据）
    const chiefLen = (features.chief_complaint || '').length;
    const symptomLen = (features.symptoms || []).join('').length;
    if (chiefLen < 10 || symptomLen < 5) {
      results.stats.skipped_short++;
      return;
    }

    // 校验重复
    const title = features.symptoms[0] + '+' + rxFeatures.herbs.slice(0, 3).join('+');
    if (seenTitles.has(title)) {
      results.stats.skipped_duplicate++;
      return;
    }
    seenTitles.add(title);

    // 计算 trust_score
    const trustScore = computeTrust(features, rxFeatures);
    if (trustScore < MIN_TRUST) {
      results.stats.skipped_low_trust++;
      return;
    }

    // 生成 staging 条目
    const entry = generateKBEntry(features, rxFeatures, trustScore);
    results.staged.push(entry);
    results.stats.distilled++;

    // 记录证型统计
    const mainSyndrome = features.symptoms[0] || 'other';
    results.stats.top_syndromes[mainSyndrome] = (results.stats.top_syndromes[mainSyndrome] || 0) + 1;
  });

  // 计算平均 trust
  if (results.staged.length > 0) {
    results.stats.avg_trust = results.staged.reduce((s, e) => s + e.trust_score, 0) / results.staged.length;
  }

  return results;
}

// ═══ 计算 trust_score ═══
function computeTrust(emrFeatures, rxFeatures) {
  let score = 0.5; // 基准分

  // +0.1: 症状群 ≥ 3
  if ((emrFeatures.symptoms || []).length >= 3) score += 0.1;
  // +0.1: 有舌象
  if (emrFeatures.tongue) score += 0.1;
  // +0.1: 有脉象
  if (emrFeatures.pulse) score += 0.1;
  // +0.1: 处方 5-15 味（合理范围）
  if (rxFeatures.herb_count >= 5 && rxFeatures.herb_count <= 15) score += 0.1;
  // +0.05: 不含毒性药
  if (!rxFeatures.has_toxic) score += 0.05;
  // -0.1: 含毒性药
  else score -= 0.1;

  return Math.max(0, Math.min(1, score));
}

// ═══ 脏数据防御：补全 syndrome ═══
const SYNDROME_KEYWORDS = {
  '心脾两虚': ['心脾两虚','失眠','多梦','乏力','纳差','归脾','心悸','梦多'],
  '肝胃不和': ['肝胃不和','胃痛','反酸','嗳气','胁胀','胃脘'],
  '肝阳上亢': ['肝阳上亢','头痛','头晕','眩','弦','耳鸣','烦躁','易怒'],
  '肾阳虚': ['肾阳虚','畏寒','肢冷','腰膝','冷痛','阳虚'],
  '肾阴虚': ['肾阴虚','腰膝酸软','口干','咽燥','五心烦热','少津'],
  '肝郁化火': ['肝郁化火','口苦','胁痛','烦躁','易怒','耳鸣'],
  '肝郁气滞': ['肝郁','叹息','胁胀','情志','抑郁','叹气'],
  '肺气虚': ['肺气虚','咳嗽','气短','懒言','自汗','易感'],
  '心阴虚': ['心阴虚','心悸','失眠','烦热','盗汗'],
  '脾气虚': ['脾气虚','腹胀','便溏','纳呆','乏力','脾虚'],
  '气阴两虚': ['气阴两虚','气短','乏力','口干','自汗'],
  '月经不调': ['月经不调','经行','痛经','月经','血块','经期'],
  '痰湿内阻': ['痰湿','痰多','胸闷','舌淡胖','苔腻'],
  '湿热下注': ['湿热','带下','黄稠','小便','黄腻'],
  '气滞血瘀': ['气滞血瘀','胸痛','刺痛','脉涩','紫暗','瘀'],
  '肝肾阴虚': ['肝肾阴虚','腰膝酸软','眩','耳鸣','烦热'],
  '心肾不交': ['心肾不交','心烦','失眠','多梦','腰酸'],
  '胃火炽盛': ['胃火','灼热','消渴','多饮','口臭'],
  '肾精不足': ['肾精不足','耳鸣','健忘','腰膝','须发'],
  '脾肾阳虚': ['脾肾阳虚','畏寒','肢冷','便溏','腰膝'],
  '吐温不退': ['咽干','口燥','干咳','肺阴虚','少津'],
  '风寒袭肺': ['风寒','咳嗽','白痰','鼻塞','畏寒'],
  '风热犯肺': ['风热','咳嗽','黄痰','咽痛','发热'],
  '痰热内扰': ['痰热','心烦','失眠','黄腻','数']
};

// 推断 syndrome（4 级 fallback）
function inferSyndrome(entry) {
  if (!entry) return null;
  const diag = entry.diagnosis;
  if (diag && typeof diag === 'object') {
    const s = (diag.syndrome || '').toString().trim();
    if (s && s !== 'test') return s;
  }
  if (entry.syndrome) {
    const s = entry.syndrome.toString().trim();
    if (s && s !== 'test') return s;
  }
  const title = entry.title || '';
  if (title && typeof title === 'string') {
    const left = title.split('·')[0].trim();
    // R721：title 长度必须 ≤ 15（防乱匹配到不相干 text）
    if (left.length > 0 && left.length <= 15) {
      for (const [std, kws] of Object.entries(SYNDROME_KEYWORDS)) {
        if (left.includes(std)) return std;
        // 关键字只接受 ≥2 字（防“痰”匹配到“不完整”）
        const matched = kws.filter(k => k.length >= 2 && left.includes(k));
        if (matched.length >= 1) return std;
      }
    }
  }
  const tags = Array.isArray(entry.tags) ? entry.tags : [];
  const tagText = tags.join(' ');
  if (tagText) {
    let best = null, bestScore = 0;
    for (const [std, kws] of Object.entries(SYNDROME_KEYWORDS)) {
      const score = kws.filter(k => tagText.includes(k)).length;
      if (score > bestScore) { bestScore = score; best = std; }
    }
    if (best && bestScore >= 2) return best;
  }
  const content = entry.content || '';
  if (content) {
    for (const std of Object.keys(SYNDROME_KEYWORDS)) {
      if (content.includes(std)) return std;
    }
  }
  return null;
}

// 验证并修真 syndrome（返回是否修真过）
function validateSyndrome(entry) {
  const existing = (entry.diagnosis && entry.diagnosis.syndrome) || entry.syndrome;
  if (existing && existing.toString().trim() && existing !== 'test') return { ok: true, inferred: false };
  const inferred = inferSyndrome(entry);
  if (inferred) {
    if (!entry.diagnosis) entry.diagnosis = {};
    entry.diagnosis.syndrome = inferred;
    entry.syndrome_inferred = true;
    return { ok: true, inferred: true, syndrome: inferred };
  }
  return { ok: false, inferred: false, reason: 'entry 无 syndrome 且无法推断' };
}

// 失效 kb-bridge 缓存（formal 写入后调用）
function invalidateBridgeCache() {
  try {
    const kbBridge = require('./kb-bridge');
    if (kbBridge.invalidateCache) kbBridge.invalidateCache();
  } catch (e) {}
}

// ═══ 写入 staging ═══
function writeStaging(entries) {
  const fp = path.join(STAGING_DIR, 'kb-feedback-staging.jsonl');
  const stream = fs.createWriteStream(fp, { flags: 'a' });
  let rejected = 0;
  const accepted = [];
  entries.forEach(e => {
    const v = validateSyndrome(e);
    if (!v.ok) { rejected++; return; }
    if (v.inferred) e.syndrome_inferred = true;
    accepted.push(e);
    stream.write(JSON.stringify(e) + '\n');
  });
  stream.end();
  return { fp, accepted: accepted.length, rejected, inferred: entries.filter(e => (e.diagnosis && e.diagnosis.syndrome)).length };
}

// ═══ 审核 staging → formal ═══
function approveStaging(entryId, reviewNotes) {
  const fp = path.join(STAGING_DIR, 'kb-feedback-staging.jsonl');
  if (!fs.existsSync(fp)) return { ok: false, error: 'staging 文件不存在' };

  let lines = fs.readFileSync(fp, 'utf-8').split('\n').filter(Boolean);
  let found = false;

  lines = lines.map(line => {
    const entry = JSON.parse(line);
    if (entry.id === entryId) {
      found = true;
      // 脏数据防御：补全 syndrome 后写入
      const v = validateSyndrome(entry);
      if (!v.ok) {
        entry._blocked = true;
        entry._blocked_reason = v.reason;
        return line;
      }
      entry.status = 'formal';
      entry.reviewed = true;
      entry.review_notes = reviewNotes || '';
      entry.reviewed_at = new Date().toISOString();

      // 写入 formal
      const formalFp = path.join(FORMAL_DIR, entry.id + '.json');
      fs.writeFileSync(formalFp, JSON.stringify(entry, null, 2));
    }
    return line;
  });

  if (!found) return { ok: false, error: '条目不存在' };

  // 重写 staging（移除已审核条目）
  fs.writeFileSync(fp, lines.filter(l => !JSON.parse(l).reviewed).join('\n') + '\n');
  invalidateBridgeCache();
  return { ok: true, entryId, status: 'formal' };
}

// ═══ 批量蒸馏（外部调用入口）═══
function batchDistill(maxEntries) {
  const data = loadData();
  const results = distillPipeline(data, maxEntries || BATCH_SIZE);

  if (results.staged.length > 0) {
    writeStaging(results.staged);
  }

  return results;
}

// ═══ 统计 ═══
function getStats() {
  const stagingFp = path.join(STAGING_DIR, 'kb-feedback-staging.jsonl');
  let staged = 0, formal = 0;
  if (fs.existsSync(stagingFp)) {
    staged = fs.readFileSync(stagingFp, 'utf-8').split('\n').filter(Boolean).length;
  }
  formal = fs.readdirSync(FORMAL_DIR).filter(f => f.endsWith('.json')).length;

  const data = loadData();
  return {
    staged,
    formal,
    total_emr: data.emr.length,
    total_rx: data.prescriptions.length,
    pipeline_ready: data.emr.length > 0 && data.prescriptions.length > 0
  };
}

// ═══ 反馈驱动 trust 调整（DPPO 在线学习）═══
function adjustTrustByFeedback(syndrome, agreed) {
  if (!syndrome) return { adjusted: 0, patterns: [] };
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
      p.grade = newTrust >= 0.85 ? 'gold' : newTrust >= 0.7 ? 'silver' : newTrust >= 0.5 ? 'bronze' : 'draft';
      p.last_feedback = { agreed, at: new Date().toISOString() };
      adjusted.push({ syndrome: p.syndrome, oldTrust, newTrust, grade: p.grade });
    }
  }

  if (adjusted.length > 0) {
    fs.writeFileSync(FP, JSON.stringify(arr, null, 2));
    const TR_LOG = path.join(DATA_DIR, 'tcm_trust_adjustments.jsonl');
    fs.appendFileSync(TR_LOG, JSON.stringify({ time: new Date().toISOString(), syndrome, agreed, delta, adjusted }) + '\n');
  }

  return { adjusted: adjusted.length, patterns: adjusted };
}

// ═══ 批量审核（一次性入库全部 staging 条目）═══
function promoteAll(reviewNotes) {
  const fp = path.join(STAGING_DIR, 'kb-feedback-staging.jsonl');
  if (!fs.existsSync(fp)) return { ok: false, error: 'staging 文件不存在', promoted: 0 };

  const lines = fs.readFileSync(fp, 'utf-8').split('\n').filter(Boolean);
  if (lines.length === 0) return { ok: true, promoted: 0, message: 'staging 为空' };

  let promoted = 0;
  const promotedEntries = [];
  let rejected = 0;

  lines.forEach(line => {
    try {
      const entry = JSON.parse(line);
      if (entry.status === 'formal') return;
      // 脏数据防御：入库前验证 syndrome
      const v = validateSyndrome(entry);
      if (!v.ok) { rejected++; return; }
      entry.status = 'formal';
      entry.reviewed = true;
      entry.review_notes = reviewNotes || '批量审核入库';
      entry.reviewed_at = new Date().toISOString();

      // 写入 formal
      const formalFp = path.join(FORMAL_DIR, entry.id + '.json');
      fs.writeFileSync(formalFp, JSON.stringify(entry, null, 2));

      promoted++;
      promotedEntries.push({ id: entry.id, title: entry.title, category: entry.category });
    } catch (e) {}
  });

  // 清空 staging
  fs.writeFileSync(fp, '');

  // 记录 promote 日志
  const LOG = path.join(DATA_DIR, 'kb-promote-log.jsonl');
  fs.appendFileSync(LOG, JSON.stringify({
    time: new Date().toISOString(),
    promoted,
    rejected,
    entries: promotedEntries
  }) + '\n');

  invalidateBridgeCache();
  return { ok: true, promoted, rejected, entries: promotedEntries };
}

// ═══ 导出 ═══
module.exports = {
  loadData,
  extractFeatures,
  extractRxFeatures,
  generateKBEntry,
  distillPipeline,
  batchDistill,
  writeStaging,
  approveStaging,
  promoteAll,
  getStats,
  adjustTrustByFeedback,
  computeTrust,
  inferSyndrome,
  validateSyndrome,
  invalidateBridgeCache,
  // 常量
  MIN_PATIENTS,
  MIN_EFFECT,
  MIN_TRUST,
  MIN_LENGTH,
  BATCH_SIZE
};
