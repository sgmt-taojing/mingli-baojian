// ═══════════════════════════════════════════════════════════════
// 命理宝鉴 · 数据安全导出 API 路由
// ═══════════════════════════════════════════════════════════════
//
// 4 个核心端点：
//   POST /api/export/csv       - 脱敏导出 CSV（admin/merchant/doctor）
//   POST /api/export/json      - 脱敏导出 JSON（带水印）
//   POST /api/export/archive   - 加密归档（super_admin，明文加密）
//   POST /api/export/unlock    - 申请解锁令牌（带审计）
// ═══════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const guard = require('./data-export-guard.js');
const { auth, adminAuth } = require('./rbac-middleware.js');

const db = new DatabaseSync(path.join(__dirname, 'database', 'yidao.db'));

// 允许导出的白名单表
const ALLOWED_TABLES = {
  users:        { module: '缘主档案',       require_admin: false,  require_master: false },
  merchants:    { module: '商户',           require_admin: true,   require_master: false },
  master_cases: { module: '大师病例',       require_admin: false,  require_master: true },
  tcm_reports:  { module: '中医报告',       require_admin: false,  require_master: true },
  feedback:     { module: '用户反馈',       require_admin: false,  require_master: false },
  medical_cases:{ module: '诊疗病例',       require_admin: false,  require_master: true }
};

// ── 1) CSV 导出 ──
router.post('/csv', auth, (req, res) => {
  try {
    const { table, purpose } = req.body || {};
    if (!table || !ALLOWED_TABLES[table]) {
      return res.status(400).json({ error: 'INVALID_TABLE', allowed: Object.keys(ALLOWED_TABLES) });
    }

    const cfg = ALLOWED_TABLES[table];
    const isAdmin = (req.userRoles || []).includes('super_admin') ||
                    (req.userRoles || []).includes('admin_a') ||
                    (req.userRoles || []).includes('admin_b');
    const isMaster = (req.userRoles || []).includes('master');

    if (cfg.require_admin && !isAdmin) {
      return res.status(403).json({ error: 'ADMIN_REQUIRED', message: `导出 ${cfg.module} 需要管理员权限` });
    }
    if (cfg.require_master && !isMaster && !isAdmin) {
      return res.status(403).json({ error: 'MASTER_REQUIRED', message: `导出 ${cfg.module} 需要大师或管理员权限` });
    }

    // 查询（按角色裁剪数据范围）
    let where = '';
    const params = [];
    if (!isAdmin && isMaster) {
      // 大师只看自己 master_id 的
      if (table === 'master_cases' || table === 'medical_cases' || table === 'tcm_reports') {
        where = ` WHERE ${table === 'master_cases' ? 'master_id' : table === 'tcm_reports' ? 'doctor_id' : 'assigned_master_id'} = ?`;
        params.push(req.userId);
      }
    } else if (!isAdmin && !isMaster) {
      // 普通用户只看自己
      if (table === 'users' || table === 'feedback') {
        where = ` WHERE id = ?`;
        params.push(req.userId);
      } else if (table === 'tcm_reports') {
        where = ` WHERE patient_id = ?`;
        params.push(req.userId);
      } else {
        return res.status(403).json({ error: 'NO_ACCESS', message: `无权导出 ${cfg.module}` });
      }
    }

    const rows = db.prepare(`SELECT * FROM ${table}${where}`).all(...params);
    const sanitized = guard.sanitizeRows(table, rows, req.userRoles || []);

    const watermark = guard.generateWatermark(req.userId, req.userRoles, table);
    const csv = guard.rowsToCSV(sanitized, table);

    const export_id = guard.logExport({
      user_id: req.userId, user_roles: req.userRoles,
      action: 'export_csv', target_table: table,
      target_ids: sanitized.slice(0, 10).map(r => r.id),
      rows_count: sanitized.length,
      ip: req.ip, user_agent: req.get('user-agent'),
      purpose: purpose || '未说明'
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${table}-${export_id}.csv"`);
    res.send('\uFEFF' + csv); // BOM 头，Excel 直接打开 UTF-8
  } catch (e) {
    console.error('[export/csv]', e);
    res.status(500).json({ error: e.message });
  }
});

// ── 2) JSON 导出（带水印） ──
router.post('/json', auth, (req, res) => {
  try {
    const { table, purpose } = req.body || {};
    if (!table || !ALLOWED_TABLES[table]) {
      return res.status(400).json({ error: 'INVALID_TABLE' });
    }
    const cfg = ALLOWED_TABLES[table];
    const isAdmin = (req.userRoles || []).some(r => r.includes('admin') || r === 'super_admin');
    const isMaster = (req.userRoles || []).includes('master');

    if (cfg.require_admin && !isAdmin) return res.status(403).json({ error: 'ADMIN_REQUIRED' });
    if (cfg.require_master && !isMaster && !isAdmin) return res.status(403).json({ error: 'MASTER_REQUIRED' });

    let where = '';
    const params = [];
    if (!isAdmin && isMaster && (table === 'master_cases' || table === 'medical_cases' || table === 'tcm_reports')) {
      where = ` WHERE ${table === 'master_cases' ? 'master_id' : table === 'tcm_reports' ? 'doctor_id' : 'assigned_master_id'} = ?`;
      params.push(req.userId);
    } else if (!isAdmin && !isMaster) {
      return res.status(403).json({ error: 'NO_ACCESS' });
    }

    const rows = db.prepare(`SELECT * FROM ${table}${where}`).all(...params);
    const sanitized = guard.sanitizeRows(table, rows, req.userRoles || []);
    const watermark = guard.generateWatermark(req.userId, req.userRoles, table);
    const json = guard.rowsToJSON(sanitized, watermark);

    const export_id = guard.logExport({
      user_id: req.userId, user_roles: req.userRoles,
      action: 'export_json', target_table: table,
      rows_count: sanitized.length,
      ip: req.ip, user_agent: req.get('user-agent'),
      purpose: purpose || '未说明'
    });

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${table}-${export_id}.json"`);
    res.send(json);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── 3) 加密归档（仅 super_admin，明文加密存数据库） ──
router.post('/archive', adminAuth, async (req, res) => {
  try {
    const { table, ids, reason } = req.body || {};
    if (!table || !ALLOWED_TABLES[table]) return res.status(400).json({ error: 'INVALID_TABLE' });
    if (!ids || !Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'IDS_REQUIRED' });
    if (!reason) return res.status(400).json({ error: 'REASON_REQUIRED', message: '归档必须说明原因（合规/法律/审计）' });

    const placeholders = ids.map(() => '?').join(',');
    const rows = db.prepare(`SELECT * FROM ${table} WHERE id IN (${placeholders})`).all(...ids);

    // 加密整个 JSON
    const archive_id = 'ARCH-' + Date.now();
    const encrypted = guard.encryptArchive(JSON.stringify(rows));

    db.prepare(`INSERT INTO audit_logs
      (user_id, action, detail, created_at)
      VALUES (?, ?, ?, ?)`).run(
      req.userId, 'export_archive',
      JSON.stringify({
        archive_id, table, ids, reason,
        encrypted_size: encrypted.length, original_count: rows.length
      }),
      new Date().toISOString()
    );

    res.json({
      success: true,
      archive_id,
      table,
      count: rows.length,
      encrypted_payload: encrypted,
      instruction: '请将 encrypted_payload 存入安全介质（如加密硬盘），需要解密时调用 /api/export/decrypt'
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── 4) 解密归档（仅 super_admin） ──
router.post('/decrypt', adminAuth, (req, res) => {
  try {
    const { encrypted_payload, reason } = req.body || {};
    if (!encrypted_payload) return res.status(400).json({ error: 'PAYLOAD_REQUIRED' });
    if (!reason) return res.status(400).json({ error: 'REASON_REQUIRED' });

    const decrypted = guard.decryptArchive(encrypted_payload);
    const data = JSON.parse(decrypted);

    db.prepare(`INSERT INTO audit_logs
      (user_id, action, detail, created_at)
      VALUES (?, ?, ?, ?)`).run(
      req.userId, 'export_decrypt',
      JSON.stringify({ reason, rows_count: data.length }),
      new Date().toISOString()
    );

    res.json({ success: true, count: data.length, data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── 5) 解锁令牌申请（高级字段临时解锁） ──
router.post('/unlock', auth, (req, res) => {
  try {
    const { table, target_ids, ttl_hours, reason } = req.body || {};
    const token = guard.generateUnlockToken(req.userId, table, target_ids, ttl_hours || 1);
    res.json({
      success: true,
      ...token,
      reason: reason || '',
      instruction: '解锁令牌仅在 TTL 内有效，过期需重新申请。审计已记录。'
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── 6) 审计日志查询（仅 super_admin） ──
router.get('/audit-log', adminAuth, (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const rows = db.prepare(`
      SELECT id, user_id, action, detail, created_at
      FROM audit_logs
      WHERE action LIKE 'export_%' OR action LIKE 'unlock_%'
      ORDER BY id DESC LIMIT ?
    `).all(limit);

    // 审计日志本身只给 super_admin 完整字段
    const result = rows.map(r => ({
      ...r,
      detail: (() => {
        try { return JSON.parse(r.detail); } catch (e) { return r.detail; }
      })()
    }));
    res.json({ success: true, count: result.length, log: result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── 7) 字段脱敏预览（仅 super_admin 可看完整规则） ──
router.get('/policy', adminAuth, (req, res) => {
  res.json({
    success: true,
    sensitive_fields: guard.SENSITIVE_FIELDS,
    role_levels: guard.ROLE_LEVELS,
    allowed_tables: ALLOWED_TABLES,
    standard_doc: '/docs/DATA_SECURITY_STANDARD.md'
  });
});

module.exports = router;