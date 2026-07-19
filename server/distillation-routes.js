// ═══ 命理宝鉴 · 蒸馏API路由 ═══
// 知识蒸馏相关接口，需admin_b/super_admin权限

const express = require('express');
const router = express.Router();
const rbac = require('./rbac-middleware.js');
const sec = require('./security-v2.js');
const distillation = require('./distillation-engine.js');
const caseQuality = require('./case-quality.js');

// === POST /api/distill/scan — 扫描可蒸馏案例 ===
router.post('/scan', rbac.requirePermission('case:distill'), (req, res) => {
  try {
    let threshold = {
      quality_score: req.body.quality_score ?? 0,
      effectiveness: req.body.effectiveness ?? 0
    };
    let cases = distillation.scanHighQualityCases(threshold);
    res.json({
      ok: true,
      count: cases.length,
      threshold: threshold,
      cases: cases.map(function(c) {
        return {
          id: c.id,
          case_uuid: c.case_uuid,
          quality_score: c.quality_score,
          effectiveness_rating: c.effectiveness_rating,
          constitution: c.constitution,
          wuxing_summary: c.wuxing_summary,
          completed_at: c.completed_at
        };
      })
    });
  } catch (e) {
    console.error('蒸馏扫描错误:', e.message);
    res.status(500).json({ error: 'SERVER_ERROR', message: e.message });
  }
});

// === POST /api/distill/extract — 执行模式提取 ===
router.post('/extract', rbac.requirePermission('case:distill'), (req, res) => {
  try {
    let threshold = {
      quality_score: req.body.quality_score ?? 0,
      effectiveness: req.body.effectiveness ?? 0
    };
    let cases = distillation.scanHighQualityCases(threshold);
    if (cases.length === 0) {
      return res.json({ ok: false, message: '无可蒸馏案例' });
    }

    let patterns = distillation.extractPatterns(cases);
    let caseIds = cases.map(function(c) { return c.id; });
    let batch = distillation.createBatch(caseIds, patterns, { valid: patterns, rejected: [] });
    distillation.updateBatchStatus(batch.batch_id, 'extracted');

    res.json({
      ok: true,
      batch_id: batch.batch_id,
      scanned_cases: cases.length,
      extracted_patterns: patterns.length,
      patterns: patterns.map(function(p) {
        return {
          cluster_key: p.cluster_key,
          wuxing: p.wuxing,
          constitution: p.constitution,
          syndrome: p.syndrome,
          case_count: p.case_count,
          effectiveness_rate: p.effectiveness_rate,
          confidence: p.confidence,
          top_formulas: p.top_formulas,
          top_acupoints: p.top_acupoints
        };
      })
    });
  } catch (e) {
    console.error('模式提取错误:', e.message);
    res.status(500).json({ error: 'SERVER_ERROR', message: e.message });
  }
});

// === POST /api/distill/validate — 验证提取结果 ===
router.post('/validate', rbac.requirePermission('case:distill'), (req, res) => {
  try {
    let batchId = req.body.batch_id;
    if (!batchId) return res.json({ error: '缺少batch_id' });

    let batch = distillation.getBatchDetail(batchId);
    if (!batch) return res.json({ error: '批次不存在' });

    let patterns = batch.extracted_patterns || [];
    let validation = distillation.validateKnowledge(patterns);

    // 更新批次状态
    distillation.updateBatchStatus(batchId, 'validated');

    res.json({
      ok: true,
      batch_id: batchId,
      total_patterns: patterns.length,
      valid_patterns: validation.valid.length,
      rejected_patterns: validation.rejected.length,
      valid: validation.valid.map(function(p) {
        return {
          cluster_key: p.cluster_key,
          confidence: p.confidence,
          target_kb: p.target_kb,
          similarity_to_existing: p.similarity_to_existing
        };
      }),
      rejected: validation.rejected.map(function(p) {
        return {
          cluster_key: p.cluster_key,
          confidence: p.confidence,
          rejection_reasons: p.rejection_reasons
        };
      })
    });
  } catch (e) {
    console.error('验证错误:', e.message);
    res.status(500).json({ error: 'SERVER_ERROR', message: e.message });
  }
});

// === POST /api/distill/apply — 应用知识到KB（需三方审核通过） ===
router.post('/apply', rbac.requirePermission('case:distill'), (req, res) => {
  try {
    let batchId = req.body.batch_id;
    if (!batchId) return res.json({ error: '缺少batch_id' });

    let batch = distillation.getBatchDetail(batchId);
    if (!batch) return res.json({ error: '批次不存在' });

    // 检查三方审核状态
    if (!batch.verified_by_master || !batch.verified_by_doctor || !batch.verified_by_admin) {
      return res.json({
        error: '需三方审核通过后才能应用',
        verified_by_master: !!batch.verified_by_master,
        verified_by_doctor: !!batch.verified_by_doctor,
        verified_by_admin: !!batch.verified_by_admin
      });
    }

    let result = distillation.applyDistillation(batchId, req.userId);
    res.json(result);
  } catch (e) {
    console.error('应用蒸馏错误:', e.message);
    res.status(500).json({ error: 'SERVER_ERROR', message: e.message });
  }
});

// === POST /api/distill/verify/:batchId — 提交审核意见 ===
router.post('/verify/:batchId', rbac.requirePermission('clinic:collaborate'), (req, res) => {
  try {
    let batchId = req.params.batchId;
    let approve = req.body.approve !== false;
    let role = req.userRoles.find(function(r) {
      return ['master', 'doctor', 'admin_b', 'super_admin'].includes(r);
    });

    if (!role) return res.json({ error: '无审核权限' });

    let batch = distillation.getBatchDetail(batchId);
    if (!batch) return res.json({ error: '批次不存在' });

    if (approve) {
      distillation.updateBatchStatus(batchId, 'verified_' + role, { id: req.userId, role: role });

      // 检查是否三方都通过
      let updated = distillation.getBatchDetail(batchId);
      if (updated.verified_by_master && updated.verified_by_doctor && updated.verified_by_admin) {
        distillation.updateBatchStatus(batchId, 'approved');
      }

      res.json({ ok: true, message: '审核通过', role: role });
    } else {
      distillation.updateBatchStatus(batchId, 'rejected');
      res.json({ ok: true, message: '已拒绝', role: role });
    }
  } catch (e) {
    console.error('审核错误:', e.message);
    res.status(500).json({ error: 'SERVER_ERROR', message: e.message });
  }
});

// === POST /api/distill/run — 一键完整蒸馏流程 ===
router.post('/run', rbac.requirePermission('case:distill'), async (req, res) => {
  try {
    let threshold = {
      quality_score: req.body.quality_score ?? 0,
      effectiveness: req.body.effectiveness ?? 0
    };
    let result = await distillation.runFullDistillation(threshold);
    res.json(result);
  } catch (e) {
    console.error('蒸馏流程错误:', e.message);
    res.status(500).json({ error: 'SERVER_ERROR', message: e.message });
  }
});

// === GET /api/distill/batches — 查看蒸馏批次列表 ===
router.get('/batches', rbac.requirePermission('case:distill'), (req, res) => {
  try {
    let limit = parseInt(req.query.limit) || 50;
    let batches = distillation.getBatches(limit);
    res.json({ ok: true, batches: batches });
  } catch (e) {
    console.error('获取批次列表错误:', e.message);
    res.status(500).json({ error: 'SERVER_ERROR', message: e.message });
  }
});

// === GET /api/distill/batch/:id — 查看批次详情 ===
router.get('/batch/:id', rbac.requirePermission('case:distill'), (req, res) => {
  try {
    let batch = distillation.getBatchDetail(req.params.id);
    if (!batch) return res.json({ error: '批次不存在' });
    res.json({ ok: true, batch: batch });
  } catch (e) {
    console.error('获取批次详情错误:', e.message);
    res.status(500).json({ error: 'SERVER_ERROR', message: e.message });
  }
});

// === POST /api/distill/rollback/:versionId — 回滚KB版本 ===
router.post('/rollback/:versionId', rbac.requirePermission('system:super'), (req, res) => {
  try {
    let versionId = parseInt(req.params.versionId);
    let result = distillation.rollbackVersion(versionId);
    res.json(result);
  } catch (e) {
    console.error('回滚错误:', e.message);
    res.status(500).json({ error: 'SERVER_ERROR', message: e.message });
  }
});

// === GET /api/distill/kb-versions — 查看KB版本历史 ===
router.get('/kb-versions', rbac.requirePermission('case:distill'), (req, res) => {
  try {
    let kbFile = req.query.kb_file;
    let versions = distillation.getKBVersions(kbFile);
    res.json({ ok: true, versions: versions });
  } catch (e) {
    console.error('获取版本历史错误:', e.message);
    res.status(500).json({ error: 'SERVER_ERROR', message: e.message });
  }
});

// === 案例质量评分接口 ===

// POST /api/distill/score/:caseId — 对单个案例评分
router.post('/score/:caseId', rbac.requirePermission('case:distill'), (req, res) => {
  try {
    let caseId = parseInt(req.params.caseId);
    let result = caseQuality.scoreCase(caseId);
    res.json(result);
  } catch (e) {
    console.error('案例评分错误:', e.message);
    res.status(500).json({ error: 'SERVER_ERROR', message: e.message });
  }
});

// POST /api/distill/score-all — 批量评分所有案例
router.post('/score-all', rbac.requirePermission('case:distill'), (req, res) => {
  try {
    let result = caseQuality.scoreAllCases();
    res.json(result);
  } catch (e) {
    console.error('批量评分错误:', e.message);
    res.status(500).json({ error: 'SERVER_ERROR', message: e.message });
  }
});

// POST /api/distill/effectiveness/:caseId — 更新疗效评级
router.post('/effectiveness/:caseId', rbac.requirePermission('clinic:collaborate'), (req, res) => {
  try {
    let caseId = parseInt(req.params.caseId);
    let rating = parseInt(req.body.rating);
    let result = caseQuality.updateEffectiveness(caseId, rating);
    res.json(result);
  } catch (e) {
    console.error('更新疗效评级错误:', e.message);
    res.status(500).json({ error: 'SERVER_ERROR', message: e.message });
  }
});

// GET /api/distill/quality-stats — 质量统计
router.get('/quality-stats', rbac.requirePermission('case:distill'), (req, res) => {
  try {
    let stats = caseQuality.getQualityStats();
    res.json({ ok: true, stats: stats });
  } catch (e) {
    console.error('质量统计错误:', e.message);
    res.status(500).json({ error: 'SERVER_ERROR', message: e.message });
  }
});

// GET /api/distill/follow-up — 获取需要随访的案例
router.get('/follow-up', rbac.requirePermission('clinic:collaborate'), (req, res) => {
  try {
    let cases = caseQuality.getCasesNeedingFollowUp();
    res.json({ ok: true, count: cases.length, cases: cases });
  } catch (e) {
    console.error('随访查询错误:', e.message);
    res.status(500).json({ error: 'SERVER_ERROR', message: e.message });
  }
});

// GET /api/distill/stats — 蒸馏概览统计
router.get('/stats', rbac.requirePermission('case:distill'), (req, res) => {
  try {
    const { DatabaseSync } = require('node:sqlite');
    const db = new DatabaseSync('server/database/yidao.db');
    const totalCases = db.prepare('SELECT COUNT(*) as c FROM medical_cases').get().c;
    const completedCases = db.prepare("SELECT COUNT(*) as c FROM medical_cases WHERE status = 'completed'").get().c;
    const totalBatches = db.prepare('SELECT COUNT(*) as c FROM distillation_batches').get().c;
    const totalReports = db.prepare('SELECT COUNT(*) as c FROM tcm_reports').get().c;
    const kbVersions = db.prepare('SELECT COUNT(*) as c FROM kb_versions').get().c;
    db.close();
    res.json({
      ok: true,
      stats: {
        total_cases: totalCases,
        completed_cases: completedCases,
        distillation_batches: totalBatches,
        tcm_reports: totalReports,
        kb_versions: kbVersions
      }
    });
  } catch (e) {
    console.error('蒸馏统计错误:', e.message);
    res.status(500).json({ error: 'SERVER_ERROR', message: e.message });
  }
});

module.exports = router;
