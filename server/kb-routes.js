/**
 * KB 管理 API 路由
 * 暴露知识库管理的全部端点给前端 kb-explorer.html
 * 包含：来源索引、临时库、正式库、模型、追溯、推送、操作
 */

const express = require('express');
const router = express.Router();
const kb = require('./kb-management-engine');

// ─── 数据查询端点 ───

// 来源索引
router.get('/sources', (req, res) => {
  try {
    const rows = kb.db.prepare(`
      SELECT s.*,
        (SELECT COUNT(*) FROM knowledge_trace WHERE source_id = s.src_id) AS ref_count
      FROM source_index s
      ORDER BY s.created_at DESC
    `).all();
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 正式知识库
router.get('/formal', (req, res) => {
  try {
    const module = req.query.module;
    const sql = module
      ? `SELECT * FROM formal_knowledge WHERE module=? ORDER BY confidence DESC LIMIT 200`
      : `SELECT * FROM formal_knowledge ORDER BY confidence DESC LIMIT 200`;
    const rows = module ? kb.db.prepare(sql).all(module) : kb.db.prepare(sql).all();
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 临时库
router.get('/staging', (req, res) => {
  try {
    const rows = kb.db.prepare(`
      SELECT entry_id, module, summary, confidence, audit_status, audit_notes, category
      FROM staging_knowledge
      ORDER BY confidence DESC LIMIT 200
    `).all();
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 知识模型
router.get('/models', (req, res) => {
  try {
    const rows = kb.db.prepare(`SELECT * FROM knowledge_models ORDER BY built_at DESC`).all();
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 统计
router.get('/stats', (req, res) => {
  try {
    const stats = {
      source: kb.db.prepare('SELECT COUNT(*) as c FROM source_index').get().c,
      formal: kb.db.prepare('SELECT COUNT(*) as c FROM formal_knowledge').get().c,
      staging: {
        total: kb.db.prepare('SELECT COUNT(*) as c FROM staging_knowledge').get().c,
        pending: kb.db.prepare(`SELECT COUNT(*) as c FROM staging_knowledge WHERE audit_status='pending'`).get().c,
        approved: kb.db.prepare(`SELECT COUNT(*) as c FROM staging_knowledge WHERE audit_status='approved'`).get().c,
        rejected: kb.db.prepare(`SELECT COUNT(*) as c FROM staging_knowledge WHERE audit_status='rejected'`).get().c,
      },
      models: kb.db.prepare(`SELECT COUNT(*) as c FROM knowledge_models WHERE status='active'`).get().c,
      cases: kb.db.prepare(`SELECT COUNT(*) as c FROM master_cases WHERE status='completed'`).get().c,
    };
    res.json(stats);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 追溯统计
router.get('/trace-stats', (req, res) => {
  try {
    const total = kb.db.prepare(`SELECT COUNT(*) as c FROM knowledge_trace`).get().c;
    res.json({ trace: total });
  } catch (e) {
    res.json({ trace: 0 });
  }
});

// 推送统计
router.get('/push-stats', (req, res) => {
  try {
    const total = kb.db.prepare(`SELECT COUNT(*) as c FROM model_push_log`).get().c;
    res.json({ push: total });
  } catch (e) {
    res.json({ push: 0 });
  }
});

// 反向追溯
router.get('/trace', (req, res) => {
  try {
    const entryId = req.query.entry_id;
    if (!entryId) return res.status(400).json({ error: 'entry_id required' });

    const result = kb.traceFromApp(entryId);
    if (!result) return res.json({ not_found: true });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── 操作端点 ───

// 蒸馏案例
router.post('/distill-cases', (req, res) => {
  try {
    const opts = req.body || {};
    const result = kb.distillFromCases(opts);
    res.json({ success: true, extracted: result.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 批量审计
router.post('/audit-all', (req, res) => {
  try {
    const result = kb.auditAllPending();
    res.json({ success: true, audit: result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 重建模型
router.post('/rebuild-models', (req, res) => {
  try {
    const modules = req.body && req.body.modules;
    const targetModules = modules || ['bazi', 'tcm'];
    const results = [];
    for (const m of targetModules) {
      results.push(kb.buildModel(m));
    }
    res.json({ success: true, models: results });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 推送模型
router.post('/push-model', (req, res) => {
  try {
    const modelId = req.body.model_id;
    if (!modelId) return res.status(400).json({ error: 'model_id required' });
    const result = kb.pushModel(modelId);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
