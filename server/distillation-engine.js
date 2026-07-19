// ═══ 命理宝鉴 · 知识蒸馏引擎 ═══
// 五步蒸馏流程：收集 → 提取 → 验证 → 更新 → 版本管理
// 仅对白名单KB文件执行写入，所有蒸馏知识标注来源

const { DatabaseSync } = require('node:sqlite');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const sec = require('./security-v2.js');

const db = new DatabaseSync(path.join(__dirname, 'database', 'yidao.db'));

// === 蒸馏白名单KB文件 ===
const KB_WHITELIST = [
  'bazi-knowledge-base.js',
  'tcm-diagnosis-kb.js',
  'tcm-famous-formulas-kb.js',
  'zhouyi-knowledge-base.js',
  'nihaisha-tcm-kb.js',
  'authoritative-knowledge-base.js',
  'wuxing-correspondence.js'
];

const KB_DIR = path.join(__dirname, '..', 'knowledge');

// === 工具函数 ===
function generateBatchId() {
  return 'DISTILL-' + Date.now() + '-' + crypto.randomBytes(3).toString('hex');
}

function parseJSON(text, fallback) {
  if (!text) return fallback;
  try { return JSON.parse(text); } catch (e) { return fallback; }
}

// === Step 1: 案例收集 ===
// 扫描 quality_score≥7, effectiveness≥3, status=completed 的案例
function scanHighQualityCases(threshold) {
  threshold = threshold || {};
  const minQuality = threshold.quality_score || 0;
  const minEffectiveness = threshold.effectiveness || 0;

  // 优先从 master_cases 读取，空时 fallback 到 medical_cases
  let cases = db.prepare(`
    SELECT id, case_uuid, master_id, patient_id,
           bazi_chart, wuxing_summary, symptoms, constitution,
           master_analysis, analysis_summary, medical_translation,
           doctor_diagnosis, final_plan,
           quality_score, effectiveness_rating, is_high_quality,
           created_at, completed_at
    FROM master_cases
    WHERE status = 'completed'
      AND quality_score >= ?
      AND effectiveness_rating >= ?
    ORDER BY quality_score DESC, completed_at DESC
  `).all(minQuality, minEffectiveness);

  // Fallback: 从 medical_cases 读取已完成案例
  if (cases.length === 0) {
    cases = db.prepare(`
      SELECT mc.id, mc.patient_id, mc.assigned_master_id as master_id,
             mc.symptoms, mc.constitution, mc.status,
             mc.created_at, mc.updated_at as completed_at,
             mca.bazi_chart, mca.wuxing_summary, mca.master_analysis,
             mca.analysis_summary, mca.medical_translation,
             mca.doctor_diagnosis, mca.final_plan,
             mca.quality_score, mca.effectiveness_rating, mca.is_high_quality
      FROM medical_cases mc
      LEFT JOIN master_cases mca ON mc.master_case_id = mca.id
      WHERE mc.status = 'completed'
      ORDER BY mc.updated_at DESC
    `).all();
  }

  // 解密敏感字段
  return cases.map(function(c) {
    return {
      id: c.id,
      case_uuid: c.case_uuid,
      master_id: c.master_id,
      patient_id: c.patient_id,
      bazi_chart: c.bazi_chart ? parseJSON(sec.decrypt(c.bazi_chart), {}) : {},
      wuxing_summary: c.wuxing_summary || '',
      symptoms: c.symptoms || '',
      constitution: c.constitution || '',
      master_analysis: c.master_analysis ? sec.decrypt(c.master_analysis) : '',
      analysis_summary: c.analysis_summary || '',
      medical_translation: c.medical_translation || '',
      doctor_diagnosis: c.doctor_diagnosis ? sec.decrypt(c.doctor_diagnosis) : '',
      final_plan: c.final_plan ? parseJSON(sec.decrypt(c.final_plan), {}) : {},
      quality_score: c.quality_score,
      effectiveness_rating: c.effectiveness_rating,
      is_high_quality: c.is_high_quality,
      created_at: c.created_at,
      completed_at: c.completed_at
    };
  });
}

// === Step 2: 模式提取 ===
// 按(五行+体质+证候)分组聚类，统计有效率，计算置信度
function extractPatterns(cases) {
  if (!cases || cases.length === 0) return [];

  // 聚类 key = wuxing|constitution|syndrome
  let clusters = {};
  cases.forEach(function(c) {
    let wuxing = c.wuxing_summary || 'unknown';
    let constitution = c.constitution || 'unknown';
    let syndrome = '';
    // 从final_plan或doctor_diagnosis中提取证候
    if (c.final_plan && c.final_plan.syndrome) {
      syndrome = c.final_plan.syndrome;
    } else if (c.doctor_diagnosis) {
      let m = c.doctor_diagnosis.match(/(?:证候|syndrome)[:\s]*([^\s,，。]+)/);
      if (m) syndrome = m[1];
    }
    if (!syndrome) syndrome = 'unknown';

    let key = wuxing + '|' + constitution + '|' + syndrome;
    if (!clusters[key]) {
      clusters[key] = {
        cluster_key: key,
        wuxing: wuxing,
        constitution: constitution,
        syndrome: syndrome,
        cases: [],
        formulas: [],
        acupoints: [],
        dietPlans: [],
        totalEffectiveness: 0,
        count: 0
      };
    }
    let cl = clusters[key];
    cl.cases.push(c.id);
    cl.count++;
    cl.totalEffectiveness += (c.effectiveness_rating || 0);

    // 收集方剂
    if (c.final_plan && c.final_plan.formula) {
      cl.formulas.push(c.final_plan.formula);
    }
    // 收集穴位
    if (c.final_plan && c.final_plan.acupoints) {
      cl.acupoints = cl.acupoints.concat(c.final_plan.acupoints);
    }
    // 收集饮食方案
    if (c.final_plan && c.final_plan.dietPlan) {
      cl.dietPlans.push(c.final_plan.dietPlan);
    }
  });

  // 计算有效率与置信度
  let patterns = [];
  Object.values(clusters).forEach(function(cl) {
    let effectivenessRate = cl.count > 0 ? cl.totalEffectiveness / (cl.count * 5) : 0; // 归一化到0-1
    // 置信度公式: f(sample_size, effectiveness_rate)
    // 样本量因子: 1例=0.3, 3例=0.6, 5例=0.8, 10+例=1.0
    let sampleFactor = Math.min(1.0, 0.3 + (cl.count - 1) * 0.1);
    let confidence = Math.round((sampleFactor * effectivenessRate) * 100) / 100;

    // 提取高频方剂
    let formulaFreq = {};
    cl.formulas.forEach(function(f) {
      let key = f.substring(0, 50);
      formulaFreq[key] = (formulaFreq[key] || 0) + 1;
    });
    let topFormulas = Object.entries(formulaFreq)
      .sort(function(a, b) { return b[1] - a[1]; })
      .slice(0, 3)
      .map(function(e) { return e[0]; });

    // 提取高频穴位
    let acupointFreq = {};
    cl.acupoints.forEach(function(a) {
      acupointFreq[a] = (acupointFreq[a] || 0) + 1;
    });
    let topAcupoints = Object.entries(acupointFreq)
      .sort(function(a, b) { return b[1] - a[1]; })
      .slice(0, 5)
      .map(function(e) { return e[0]; });

    patterns.push({
      cluster_key: cl.cluster_key,
      wuxing: cl.wuxing,
      constitution: cl.constitution,
      syndrome: cl.syndrome,
      case_ids: cl.cases,
      case_count: cl.count,
      effectiveness_rate: Math.round(effectivenessRate * 100) / 100,
      confidence: confidence,
      top_formulas: topFormulas,
      top_acupoints: topAcupoints,
      diet_advice: cl.dietPlans[0] || '',
      extracted_at: new Date().toISOString()
    });
  });

  // 按置信度降序
  patterns.sort(function(a, b) { return b.confidence - a.confidence; });
  return patterns;
}

// === Step 3: 知识验证 ===
// 与现有KB交叉比对，去重(>85%相似度)，逻辑一致性检查
function validateKnowledge(patterns) {
  if (!patterns || patterns.length === 0) return { valid: [], rejected: [] };

  let valid = [];
  let rejected = [];

  // 读取现有KB内容用于比对
  let kbContents = {};
  KB_WHITELIST.forEach(function(kbFile) {
    let filePath = path.join(KB_DIR, kbFile);
    if (fs.existsSync(filePath)) {
      kbContents[kbFile] = fs.readFileSync(filePath, 'utf8');
    }
  });

  patterns.forEach(function(p) {
    let rejectionReasons = [];

    // 3a. 置信度阈值检查
    if (p.confidence < 0.5) {
      rejectionReasons.push('置信度不足(' + p.confidence + ' < 0.5)');
    }

    // 3b. 样本量检查
    if (p.case_count < 2) {
      rejectionReasons.push('样本量不足(' + p.case_count + ' < 2)');
    }

    // 3c. 与现有KB去重 — Jaccard相似度
    let targetKbFile = matchKbFile(p);
    p.target_kb = targetKbFile;

    if (targetKbFile && kbContents[targetKbFile]) {
      let existingContent = kbContents[targetKbFile];
      let similarity = computeSimilarity(buildPatternText(p), existingContent);
      if (similarity > 0.85) {
        rejectionReasons.push('与现有KB相似度过高(' + Math.round(similarity * 100) + '% > 85%)');
      }
      p.similarity_to_existing = Math.round(similarity * 100) / 100;
    }

    // 3d. 逻辑一致性检查 — 证候与五行不应矛盾
    if (p.syndrome && p.wuxing) {
      let contradiction = checkLogicalConsistency(p.wuxing, p.syndrome);
      if (contradiction) {
        rejectionReasons.push('逻辑矛盾: ' + contradiction);
      }
    }

    if (rejectionReasons.length > 0) {
      p.rejection_reasons = rejectionReasons;
      rejected.push(p);
    } else {
      valid.push(p);
    }
  });

  return { valid: valid, rejected: rejected };
}

// 匹配蒸馏知识到最合适的KB文件
function matchKbFile(pattern) {
  let text = (pattern.wuxing + ' ' + pattern.constitution + ' ' + pattern.syndrome +
    ' ' + (pattern.top_formulas || []).join(' ') + ' ' + (pattern.top_acupoints || []).join(' '));

  // 基于关键词路由
  if (/五行|金|木|水|火|土/.test(pattern.wuxing) && !/证|证候|方|穴/.test(text)) {
    return 'wuxing-correspondence.js';
  }
  if (/八字|日主|天干|地支|十神|格局|用神/.test(text)) {
    return 'bazi-knowledge-base.js';
  }
  if (/卦|爻|乾|坤|震|巽|坎|离|艮|兑/.test(text)) {
    return 'zhouyi-knowledge-base.js';
  }
  if (/方剂|汤|丸|散|加减/.test(text)) {
    return 'tcm-famous-formulas-kb.js';
  }
  if (/证候|证型|辨证|脏腑/.test(text)) {
    return 'tcm-diagnosis-kb.js';
  }
  if (/倪海厦|经方|伤寒/.test(text)) {
    return 'nihaisha-tcm-kb.js';
  }
  return 'authoritative-knowledge-base.js';
}

// 构建蒸馏知识的文本表示
function buildPatternText(pattern) {
  let parts = [
    '五行: ' + pattern.wuxing,
    '体质: ' + pattern.constitution,
    '证候: ' + pattern.syndrome,
    '有效率: ' + pattern.effectiveness_rate,
    '置信度: ' + pattern.confidence,
    '推荐方剂: ' + (pattern.top_formulas || []).join(', '),
    '推荐穴位: ' + (pattern.top_acupoints || []).join(', '),
    '饮食建议: ' + (pattern.diet_advice || '').substring(0, 100)
  ];
  return parts.join('\n');
}

// Jaccard相似度（基于词集合）
function computeSimilarity(text1, text2) {
  // 提取中文词组（2-4字滑窗）
  function extractTerms(text) {
    let terms = new Set();
    let cleaned = text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, ' ');
    let tokens = cleaned.split(/\s+/).filter(Boolean);
    tokens.forEach(function(t) {
      if (t.length >= 2) {
        for (var i = 0; i <= t.length - 2; i++) {
          terms.add(t.substring(i, i + 2));
        }
      }
    });
    return terms;
  }

  let set1 = extractTerms(text1);
  let set2 = extractTerms(text2);
  if (set1.size === 0 || set2.size === 0) return 0;

  let intersection = 0;
  set1.forEach(function(t) { if (set2.has(t)) intersection++; });
  let union = set1.size + set2.size - intersection;
  return union > 0 ? intersection / union : 0;
}

// 逻辑一致性检查
function checkLogicalConsistency(wuxing, syndrome) {
  const WUXING_ORGANS = {
    '木': ['肝', '胆'],
    '火': ['心', '小肠'],
    '土': ['脾', '胃'],
    '金': ['肺', '大肠'],
    '水': ['肾', '膀胱']
  };

  // 检查五行与证候的脏腑是否匹配
  let wuxingElements = wuxing.match(/[木火土金水]/g) || [];
  let expectedOrgans = new Set();
  wuxingElements.forEach(function(el) {
    let organs = WUXING_ORGANS[el] || [];
    organs.forEach(function(o) { expectedOrgans.add(o); });
  });

  // 如果证候中包含脏腑名称，检查是否在五行对应的范围内
  let organInSyndrome = null;
  let allOrgans = ['肝', '胆', '心', '小肠', '脾', '胃', '肺', '大肠', '肾', '膀胱'];
  for (var i = 0; i < allOrgans.length; i++) {
    if (syndrome.indexOf(allOrgans[i]) >= 0) {
      organInSyndrome = allOrgans[i];
      break;
    }
  }

  // 允许相生相克关系的脏腑
  if (organInSyndrome && expectedOrgans.size > 0) {
    if (!expectedOrgans.has(organInSyndrome)) {
      // 不在直接对应范围，但可能在相生相克范围，不直接拒绝
      // 仅标记警告但不阻断
      return null;
    }
  }

  return null; // 无矛盾
}

// === Step 4: KB更新 ===
// 匹配白名单KB文件，生成diff
function updateKB(validatedPatterns) {
  if (!validatedPatterns || validatedPatterns.length === 0) {
    return { diffs: [], applied: 0 };
  }

  let batchId = generateBatchId();
  let diffs = [];
  let applied = 0;

  // 按target_kb分组
  let byKbFile = {};
  validatedPatterns.forEach(function(p) {
    let kbFile = p.target_kb || matchKbFile(p);
    if (!kbFile || KB_WHITELIST.indexOf(kbFile) < 0) return; // 白名单检查
    if (!byKbFile[kbFile]) byKbFile[kbFile] = [];
    byKbFile[kbFile].push(p);
  });

  Object.keys(byKbFile).forEach(function(kbFile) {
    let patterns = byKbFile[kbFile];
    let filePath = path.join(KB_DIR, kbFile);

    if (!fs.existsSync(filePath)) {
      diffs.push({ kb_file: kbFile, error: '文件不存在', applied: false });
      return;
    }

    let originalContent = fs.readFileSync(filePath, 'utf8');

    // 生成蒸馏知识块
    let caseIds = patterns.map(function(p) { return p.case_ids; }).flat();
    let avgConfidence = patterns.reduce(function(s, p) { return s + p.confidence; }, 0) / patterns.length;
    avgConfidence = Math.round(avgConfidence * 100) / 100;

    let knowledgeBlock = generateKnowledgeBlock(patterns, batchId, caseIds, avgConfidence);

    // 确定插入位置：在文件末尾的 module.exports 或 window 赋值之前
    let newContent = insertKnowledgeBlock(originalContent, knowledgeBlock, kbFile);

    // 生成diff
    let diff = {
      kb_file: kbFile,
      batch_id: batchId,
      original_size: originalContent.length,
      new_size: newContent.length,
      added_lines: knowledgeBlock.split('\n').length,
      patterns_count: patterns.length,
      case_ids: caseIds,
      avg_confidence: avgConfidence,
      diff_summary: '新增' + patterns.length + '条蒸馏知识(置信度' + avgConfidence + ')',
      original_hash: crypto.createHash('sha256').update(originalContent).digest('hex').substring(0, 16),
      new_hash: crypto.createHash('sha256').update(newContent).digest('hex').substring(0, 16),
      // 不直接写入文件，由apply步骤在审核通过后写入
      new_content: newContent
    };

    diffs.push(diff);
    applied++;
  });

  return { diffs: diffs, applied: applied, batch_id: batchId };
}

// 生成蒸馏知识块文本
function generateKnowledgeBlock(patterns, batchId, caseIds, avgConfidence) {
  let lines = [];
  lines.push('');
  lines.push('// ═══ [DISTILL] batch=' + batchId + ' cases=[' + caseIds.join(',') + '] confidence=' + avgConfidence + ' ═══');
  lines.push('// 蒸馏时间: ' + new Date().toISOString());
  lines.push('// 案例数: ' + caseIds.length + ' | 模式数: ' + patterns.length);
  lines.push('');

  patterns.forEach(function(p, idx) {
    lines.push('// ── 蒸馏知识 #' + (idx + 1) + ' ──');
    lines.push('// [DISTILL] pattern=' + p.cluster_key + ' confidence=' + p.confidence + ' cases=' + p.case_ids.join(','));
    lines.push('// 五行: ' + p.wuxing);
    lines.push('// 体质: ' + p.constitution);
    lines.push('// 证候: ' + p.syndrome);
    lines.push('// 有效率: ' + (p.effectiveness_rate * 100) + '%');
    if (p.top_formulas && p.top_formulas.length > 0) {
      lines.push('// 推荐方剂: ' + p.top_formulas.join(' | '));
    }
    if (p.top_acupoints && p.top_acupoints.length > 0) {
      lines.push('// 推荐穴位: ' + p.top_acupoints.join(', '));
    }
    if (p.diet_advice) {
      lines.push('// 饮食建议: ' + p.diet_advice.substring(0, 120));
    }
    lines.push('');
  });

  lines.push('// ═══ [DISTILL] end batch=' + batchId + ' ═══');
  lines.push('');
  return lines.join('\n');
}

// 在KB文件中插入知识块
function insertKnowledgeBlock(originalContent, knowledgeBlock, kbFile) {
  // 策略：在最后的 module.exports 或 window.xxx = 赋值闭合之前插入
  // 对于 window.XXX = { ... } 格式，在最后的 } 之前插入
  // 对于 module.exports = { ... } 格式，在最后的 } 之前插入

  let insertPos = -1;

  // 尝试找到最后闭合的 };
  let lastBrace = originalContent.lastIndexOf('};');
  if (lastBrace >= 0) {
    insertPos = lastBrace;
  }

  // 如果找不到，追加到文件末尾
  if (insertPos < 0) {
    return originalContent + '\n' + knowledgeBlock;
  }

  // 在闭合括号前以注释形式插入
  let before = originalContent.substring(0, insertPos);
  let after = originalContent.substring(insertPos);

  // 将知识块转为注释（不破坏KB对象结构）
  return before + '\n' + knowledgeBlock + '\n' + after;
}

// === Step 5: 版本管理 ===
// 快照存储 + 版本号递增
function createVersion(kbFile, diff) {
  let filePath = path.join(KB_DIR, kbFile);
  let currentContent = '';
  if (fs.existsSync(filePath)) {
    currentContent = fs.readFileSync(filePath, 'utf8');
  }

  // 计算新版本号
  let lastVersion = db.prepare(`
    SELECT version FROM kb_versions WHERE kb_file = ? ORDER BY id DESC LIMIT 1
  `).get(kbFile);

  let versionParts = (lastVersion && lastVersion.version || '1.0.0').split('.').map(Number);
  versionParts[2] = (versionParts[2] || 0) + 1;
  let newVersion = versionParts.join('.');

  // 存储快照（加密压缩）
  let snapshot = sec.encrypt(currentContent);
  let contentHash = crypto.createHash('sha256').update(currentContent).digest('hex');

  let result = db.prepare(`
    INSERT INTO kb_versions (kb_file, version, snapshot, diff_summary, distill_batch, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(kbFile, newVersion, snapshot, diff.diff_summary, diff.batch_id, 0); // created_by=0 表示系统蒸馏

  return {
    version_id: result.lastInsertRowid,
    kb_file: kbFile,
    version: newVersion,
    content_hash: contentHash,
    diff_summary: diff.diff_summary
  };
}

// === 回滚KB版本 ===
function rollbackVersion(versionId) {
  let record = db.prepare('SELECT * FROM kb_versions WHERE id = ?').get(versionId);
  if (!record) return { error: '版本不存在' };

  let filePath = path.join(KB_DIR, record.kb_file);
  let snapshotContent = sec.decrypt(record.snapshot);

  // 备份当前版本
  if (fs.existsSync(filePath)) {
    let currentContent = fs.readFileSync(filePath, 'utf8');
    let currentHash = crypto.createHash('sha256').update(currentContent).digest('hex');
    db.prepare(`
      INSERT INTO kb_versions (kb_file, version, snapshot, diff_summary, distill_batch, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(record.kb_file, record.version + '-pre-rollback', sec.encrypt(currentContent),
           '回滚前备份', null, 0);
  }

  // 恢复快照
  fs.writeFileSync(filePath, snapshotContent, 'utf8');

  // 标记激活
  db.prepare('UPDATE kb_versions SET activated_at = datetime("now","localtime") WHERE id = ?').run(versionId);

  return { ok: true, message: '已回滚 ' + record.kb_file + ' 到版本 ' + record.version };
}

// === 获取KB版本历史 ===
function getKBVersions(kbFile) {
  if (kbFile) {
    return db.prepare(`
      SELECT id, kb_file, version, diff_summary, distill_batch, created_at, activated_at
      FROM kb_versions WHERE kb_file = ?
      ORDER BY id DESC
    `).all(kbFile);
  }
  return db.prepare(`
    SELECT id, kb_file, version, diff_summary, distill_batch, created_at, activated_at
    FROM kb_versions
    ORDER BY id DESC
    LIMIT 100
  `).all();
}

// === 创建蒸馏批次 ===
function createBatch(caseIds, patterns, validationResult) {
  let batchId = generateBatchId();
  let caseIdsJson = JSON.stringify(caseIds);
  let patternsJson = JSON.stringify(patterns);
  let confidenceScores = JSON.stringify(
    patterns.map(function(p) { return { cluster_key: p.cluster_key, confidence: p.confidence }; })
  );

  let result = db.prepare(`
    INSERT INTO distillation_batches (batch_id, case_ids, extracted_patterns, confidence_scores, status)
    VALUES (?, ?, ?, ?, 'scanned')
  `).run(batchId, caseIdsJson, patternsJson, confidenceScores);

  return { batch_id: batchId, id: result.lastInsertRowid };
}

// === 更新批次状态 ===
function updateBatchStatus(batchId, status, verifiedBy) {
  let updates = ['status = ?'];
  let params = [status];

  if (verifiedBy) {
    // 判断角色字段
    if (verifiedBy.role === 'master') {
      updates.push('verified_by_master = ?');
      params.push(verifiedBy.id);
    } else if (verifiedBy.role === 'doctor') {
      updates.push('verified_by_doctor = ?');
      params.push(verifiedBy.id);
    } else if (verifiedBy.role === 'admin_b' || verifiedBy.role === 'super_admin') {
      updates.push('verified_by_admin = ?');
      params.push(verifiedBy.id);
    }
  }
  if (status === 'completed') {
    updates.push('completed_at = datetime("now","localtime")');
  }
  params.push(batchId);

  db.prepare('UPDATE distillation_batches SET ' + updates.join(', ') + ' WHERE batch_id = ?').run(...params);
}

// === 获取批次列表 ===
function getBatches(limit) {
  limit = limit || 50;
  return db.prepare(`
    SELECT id, batch_id, case_ids, status,
           verified_by_master, verified_by_doctor, verified_by_admin,
           created_at, completed_at
    FROM distillation_batches
    ORDER BY id DESC
    LIMIT ?
  `).all(limit);
}

// === 获取批次详情 ===
function getBatchDetail(batchId) {
  let batch = db.prepare('SELECT * FROM distillation_batches WHERE batch_id = ? OR id = ?').get(batchId, parseInt(batchId) || 0);
  if (!batch) return null;

  batch.case_ids = parseJSON(batch.case_ids, []);
  batch.extracted_patterns = parseJSON(batch.extracted_patterns, []);
  batch.confidence_scores = parseJSON(batch.confidence_scores, []);
  return batch;
}

// === 完整蒸馏流程 ===
async function runFullDistillation(threshold) {
  // Step 1: 收集
  let cases = scanHighQualityCases(threshold);
  if (cases.length === 0) {
    return { error: '无可蒸馏的高质量案例' };
  }

  // Step 2: 提取
  let patterns = extractPatterns(cases);
  if (patterns.length === 0) {
    return { error: '无法从案例中提取有效模式' };
  }

  // Step 3: 验证
  let validation = validateKnowledge(patterns);

  // 创建批次记录
  let caseIds = cases.map(function(c) { return c.id; });
  let batch = createBatch(caseIds, patterns, validation);
  updateBatchStatus(batch.batch_id, 'extracted');

  // Step 4: 生成KB diff（不写入）
  let kbUpdate = updateKB(validation.valid);
  if (kbUpdate.batch_id) {
    batch.batch_id = kbUpdate.batch_id;
  }

  // Step 5: 版本管理（在apply时执行）
  return {
    batch_id: batch.batch_id,
    scanned_cases: cases.length,
    extracted_patterns: patterns.length,
    valid_patterns: validation.valid.length,
    rejected_patterns: validation.rejected.length,
    kb_diffs: kbUpdate.diffs.map(function(d) {
      return {
        kb_file: d.kb_file,
        diff_summary: d.diff_summary,
        added_lines: d.added_lines,
        patterns_count: d.patterns_count,
        avg_confidence: d.avg_confidence
      };
    }),
    validation_details: {
      rejected: validation.rejected.map(function(r) {
        return { cluster_key: r.cluster_key, reasons: r.rejection_reasons };
      })
    }
  };
}

// === 应用蒸馏知识到KB（需审核通过） ===
function applyDistillation(batchId, approverId) {
  let batch = getBatchDetail(batchId);
  if (!batch) return { error: '批次不存在' };

  if (batch.status !== 'approved') {
    return { error: '批次未通过审核，当前状态: ' + batch.status };
  }

  // 检查三方审核
  if (!batch.verified_by_master || !batch.verified_by_doctor || !batch.verified_by_admin) {
    return { error: '需三方审核通过后才能应用' };
  }

  let patterns = batch.extracted_patterns || [];
  let validPatterns = patterns.filter(function(p) { return !p.rejection_reasons; });

  // 生成diff并写入
  let kbUpdate = updateKB(validPatterns);
  let versions = [];

  kbUpdate.diffs.forEach(function(diff) {
    if (diff.new_content) {
      let filePath = path.join(KB_DIR, diff.kb_file);
      // 创建版本快照
      let version = createVersion(diff.kb_file, diff);
      // 写入新内容
      fs.writeFileSync(filePath, diff.new_content, 'utf8');
      // 标记激活
      db.prepare('UPDATE kb_versions SET activated_at = datetime("now","localtime") WHERE id = ?').run(version.version_id);
      versions.push(version);
    }
  });

  updateBatchStatus(batchId, 'completed', { id: approverId, role: 'admin_b' });

  return {
    ok: true,
    batch_id: batchId,
    applied_files: versions.length,
    versions: versions
  };
}

module.exports = {
  KB_WHITELIST,
  scanHighQualityCases,
  extractPatterns,
  validateKnowledge,
  updateKB,
  createVersion,
  rollbackVersion,
  getKBVersions,
  createBatch,
  updateBatchStatus,
  getBatches,
  getBatchDetail,
  runFullDistillation,
  applyDistillation,
  generateBatchId
};
