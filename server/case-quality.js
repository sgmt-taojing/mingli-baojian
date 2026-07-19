// ═══ 命理宝鉴 · 案例质量评分模块 ═══
// 自动评分：完整度 + 分析深度 + 疗效评级 → quality_score(1-10)
// 高质量标记：quality_score≥7 → is_high_quality=1

const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const sec = require('./security-v2.js');

const db = new DatabaseSync(path.join(__dirname, 'database', 'yidao.db'));

// === 评分维度权重 ===
const WEIGHTS = {
  completeness: 3.0,   // 案例完整度 (0-3)
  analysis_depth: 4.0, // 分析深度 (0-4)
  effectiveness: 3.0   // 疗效评级 (0-3)
};

// === 评分函数 ===
// 根据案例完整度、分析深度、疗效评级计算 quality_score(1-10)
function scoreCase(caseId) {
  let c = db.prepare('SELECT * FROM master_cases WHERE id = ?').get(caseId);
  if (!c) return { error: '案例不存在', score: 0 };

  // --- 维度1: 案例完整度 (0-3分) ---
  let completenessScore = 0;
  let completenessDetails = [];

  // 基本字段存在性检查
  if (c.bazi_chart) { completenessScore += 0.5; completenessDetails.push('排盘数据(0.5)'); }
  if (c.wuxing_summary) { completenessScore += 0.5; completenessDetails.push('五行总结(0.5)'); }
  if (c.symptoms) { completenessScore += 0.5; completenessDetails.push('症状(0.5)'); }
  if (c.constitution) { completenessScore += 0.5; completenessDetails.push('体质(0.5)'); }
  if (c.master_analysis) { completenessScore += 0.5; completenessDetails.push('大师分析(0.5)'); }
  if (c.doctor_diagnosis) { completenessScore += 0.5; completenessDetails.push('医生诊断(0.5)'); }
  completenessScore = Math.min(completenessScore, WEIGHTS.completeness);

  // --- 维度2: 分析深度 (0-4分) ---
  let analysisScore = 0;
  let analysisDetails = [];

  let masterAnalysis = c.master_analysis ? sec.decrypt(c.master_analysis) : '';
  let analysisSummary = c.analysis_summary || '';
  let medicalTranslation = c.medical_translation || '';
  let doctorDiagnosis = c.doctor_diagnosis ? sec.decrypt(c.doctor_diagnosis) : '';
  let finalPlan = c.final_plan ? sec.decrypt(c.final_plan) : '{}';

  let finalPlanObj = {};
  try { finalPlanObj = JSON.parse(finalPlan); } catch (e) {}

  // 大师分析深度
  if (masterAnalysis) {
    if (masterAnalysis.length > 200) { analysisScore += 0.5; analysisDetails.push('分析详尽(0.5)'); }
    if (masterAnalysis.length > 500) { analysisScore += 0.5; analysisDetails.push('分析深入(0.5)'); }
    // 包含五行分析
    if (/[木火土金水]/.test(masterAnalysis)) { analysisScore += 0.5; analysisDetails.push('五行分析(0.5)'); }
    // 包含脏腑论述
    if (/[肝心脾肺肾胆胃肠膀胱]/.test(masterAnalysis)) { analysisScore += 0.5; analysisDetails.push('脏腑论述(0.5)'); }
  }

  // 医学翻译存在且有意义
  if (medicalTranslation && medicalTranslation.length > 50) {
    analysisScore += 0.5; analysisDetails.push('医学翻译(0.5)');
  }

  // 医生诊断深度
  if (finalPlanObj.syndrome) { analysisScore += 0.5; analysisDetails.push('证候明确(0.5)'); }
  if (finalPlanObj.formula) { analysisScore += 0.5; analysisDetails.push('方剂明确(0.5)'); }
  if (finalPlanObj.acupoints && finalPlanObj.acupoints.length > 0) {
    analysisScore += 0.5; analysisDetails.push('穴位明确(0.5)');
  }

  analysisScore = Math.min(analysisScore, WEIGHTS.analysis_depth);

  // --- 维度3: 疗效评级 (0-3分) ---
  let effectivenessScore = 0;
  let effectivenessDetails = [];

  let eff = c.effectiveness_rating || 0;
  // effectiveness_rating: 0=未评估, 1=无效, 2=改善, 3=显著改善, 4=痊愈, 5=痊愈且随访
  if (eff >= 5) { effectivenessScore = 3.0; effectivenessDetails.push('痊愈且随访(3.0)'); }
  else if (eff >= 4) { effectivenessScore = 2.5; effectivenessDetails.push('痊愈(2.5)'); }
  else if (eff >= 3) { effectivenessScore = 2.0; effectivenessDetails.push('显著改善(2.0)'); }
  else if (eff >= 2) { effectivenessScore = 1.0; effectivenessDetails.push('改善(1.0)'); }
  else if (eff >= 1) { effectivenessScore = 0.5; effectivenessDetails.push('无效(0.5)'); }
  else { effectivenessDetails.push('未评估(0)'); }

  effectivenessScore = Math.min(effectivenessScore, WEIGHTS.effectiveness);

  // --- 总分 ---
  let totalScore = Math.round((completenessScore + analysisScore + effectivenessScore) * 10) / 10;
  // 确保在1-10范围
  totalScore = Math.max(1, Math.min(10, totalScore));
  let isHighQuality = totalScore >= 7 ? 1 : 0;

  // --- 写入数据库 ---
  db.prepare(`
    UPDATE master_cases SET
      quality_score = ?,
      is_high_quality = ?
    WHERE id = ?
  `).run(Math.round(totalScore), isHighQuality, caseId);

  return {
    case_id: caseId,
    quality_score: totalScore,
    is_high_quality: isHighQuality === 1,
    breakdown: {
      completeness: { score: completenessScore, max: WEIGHTS.completeness, details: completenessDetails },
      analysis_depth: { score: analysisScore, max: WEIGHTS.analysis_depth, details: analysisDetails },
      effectiveness: { score: effectivenessScore, max: WEIGHTS.effectiveness, details: effectivenessDetails }
    }
  };
}

// === 批量评分 ===
function scoreAllCases() {
  let cases = db.prepare('SELECT id FROM master_cases WHERE status = ?').all('completed');
  let results = [];
  cases.forEach(function(c) {
    let result = scoreCase(c.id);
    results.push(result);
  });
  return {
    total: results.length,
    scored: results.length,
    high_quality: results.filter(function(r) { return r.is_high_quality; }).length,
    results: results
  };
}

// === 更新疗效评级 ===
function updateEffectiveness(caseId, rating) {
  // rating: 0-5
  if (rating < 0 || rating > 5) return { error: '评级范围0-5' };

  db.prepare('UPDATE master_cases SET effectiveness_rating = ? WHERE id = ?').run(rating, caseId);

  // 重新计算质量评分
  let scoreResult = scoreCase(caseId);

  return {
    case_id: caseId,
    effectiveness_rating: rating,
    quality_score: scoreResult.quality_score,
    is_high_quality: scoreResult.is_high_quality
  };
}

// === 获取高质量案例统计 ===
function getQualityStats() {
  let total = db.prepare('SELECT COUNT(*) as count FROM master_cases').get().count;
  let completed = db.prepare('SELECT COUNT(*) as count FROM master_cases WHERE status = ?').get('completed').count;
  let highQuality = db.prepare('SELECT COUNT(*) as count FROM master_cases WHERE is_high_quality = 1').get().count;
  let avgScore = db.prepare('SELECT AVG(quality_score) as avg FROM master_cases WHERE quality_score > 0').get().avg;

  // 按分数段统计
  let distribution = db.prepare(`
    SELECT
      CASE
        WHEN quality_score >= 9 THEN '9-10'
        WHEN quality_score >= 7 THEN '7-8'
        WHEN quality_score >= 5 THEN '5-6'
        WHEN quality_score >= 3 THEN '3-4'
        ELSE '1-2'
      END as range,
      COUNT(*) as count
    FROM master_cases
    WHERE quality_score > 0
    GROUP BY range
    ORDER BY range DESC
  `).all();

  return {
    total_cases: total,
    completed_cases: completed,
    high_quality_cases: highQuality,
    avg_score: avgScore ? Math.round(avgScore * 10) / 10 : 0,
    score_distribution: distribution
  };
}

// === 定期疗效追踪 ===
// 扫描已完成但effectiveness_rating=0的案例，标记需要随访
function getCasesNeedingFollowUp() {
  return db.prepare(`
    SELECT id, case_uuid, completed_at, patient_id
    FROM master_cases
    WHERE status = 'completed'
      AND effectiveness_rating = 0
      AND completed_at < datetime('now', '-7 days')
    ORDER BY completed_at ASC
  `).all();
}

module.exports = {
  WEIGHTS,
  scoreCase,
  scoreAllCases,
  updateEffectiveness,
  getQualityStats,
  getCasesNeedingFollowUp
};
