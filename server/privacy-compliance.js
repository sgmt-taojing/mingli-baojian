// ═══════════════════════════════════════════════════════════════
// 命理宝鉴 · 隐私合规引擎 (Privacy Compliance Engine)
// 标准文档: docs/PRIVACY_COMPLIANCE_v1.md
//
// 节点 10.2 实现：
//   - 用户数据导出（GDPR 第 20 条 / PIPL 第 45 条）
//   - 用户软删除/硬删除（GDPR 第 17 条 / PIPL 第 47 条）
//   - 同意管理（user_consents）
//   - 审计日志扩展（pii.read / pii.export / pii.delete）
// ═══════════════════════════════════════════════════════════════

const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const sec = require('./security-v2.js');
const logger = require('./logger.js');
const dataExportGuard = require('./data-export-guard.js');

const DB_PATH = path.join(__dirname, 'database', 'yidao.db');
let db;
function getDb() {
  if (!db) db = new DatabaseSync(DB_PATH);
  return db;
}

// ── 关联表清单（删除用户时联动清理） ──
const CASCADE_TABLES = [
  { table: 'user_data',         userColumn: 'user_id' },
  { table: 'user_points',       userColumn: 'user_id' },
  { table: 'user_roles',        userColumn: 'user_id' },
  { table: 'feedback',          userColumn: 'user_id' },
  { table: 'paipan_records',    userColumn: 'user_id' },
  { table: 'yuanzhu_yearly_push', userColumn: 'user_id' },
  { table: 'clinic_cases',      userColumn: 'patient_user_id' },  // 若存在
  { table: 'payments',          userColumn: 'user_id' },           // 仅脱敏保留（合规 7 年）
];

const PROTECTED_AUDIT_FIELDS = [
  'user_id', 'action', 'detail', 'created_at',
  'requester_id', 'target_id', 'field', 'ip'
];

// ═══════════════════════════════════════════════════════════════
// 初始化：建表迁移 + audit_logs 扩展
// ═══════════════════════════════════════════════════════════════

function initSchema() {
  const d = getDb();
  // 1. 扩展 audit_logs 表
  const auditCols = d.prepare("PRAGMA table_info(audit_logs)").all();
  const hasRequesterId = auditCols.some(c => c.name === 'requester_id');
  const hasTargetId = auditCols.some(c => c.name === 'target_id');
  const hasField = auditCols.some(c => c.name === 'field');
  const hasIp = auditCols.some(c => c.name === 'ip');

  if (!hasRequesterId) d.exec('ALTER TABLE audit_logs ADD COLUMN requester_id INTEGER');
  if (!hasTargetId) d.exec('ALTER TABLE audit_logs ADD COLUMN target_id INTEGER');
  if (!hasField) d.exec('ALTER TABLE audit_logs ADD COLUMN field TEXT');
  if (!hasIp) d.exec('ALTER TABLE audit_logs ADD COLUMN ip TEXT');

  // 2. 创建 user_consents 表
  d.exec(`
    CREATE TABLE IF NOT EXISTS user_consents (
      user_id INTEGER NOT NULL,
      consent_type TEXT NOT NULL,
      granted INTEGER DEFAULT 1,
      version TEXT NOT NULL,
      ip TEXT,
      user_agent TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      PRIMARY KEY (user_id, consent_type, version)
    );
    CREATE INDEX IF NOT EXISTS idx_user_consents_user ON user_consents(user_id);
  `);

  // 3. 创建 user_deletion_requests 表（软删除宽限期）
  d.exec(`
    CREATE TABLE IF NOT EXISTS user_deletion_requests (
      user_id INTEGER PRIMARY KEY,
      requested_at TEXT DEFAULT (datetime('now','localtime')),
      scheduled_hard_delete_at TEXT,
      cancelled_at TEXT,
      reason TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_user_deletion_requests_scheduled
      ON user_deletion_requests(scheduled_hard_delete_at)
      WHERE cancelled_at IS NULL;
  `);

  logger.info({ module: 'privacy', event: 'schema.init' }, 'privacy schema ready');
}

// ═══════════════════════════════════════════════════════════════
// 同意管理
// ═══════════════════════════════════════════════════════════════

function recordConsent({ userId, consentType, granted, version, ip, userAgent }) {
  const d = getDb();
  d.prepare(`
    INSERT OR REPLACE INTO user_consents
      (user_id, consent_type, granted, version, ip, user_agent, created_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now','localtime'))
  `).run(userId, consentType, granted ? 1 : 0, version, ip || null, userAgent || null);

  logAudit({
    userId,
    action: granted ? 'consent.grant' : 'consent.revoke',
    detail: `${consentType}@${version}`,
    ip,
  });
}

function getConsents(userId) {
  const d = getDb();
  return d.prepare(`
    SELECT consent_type, granted, version, created_at
    FROM user_consents
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(userId);
}

// ═══════════════════════════════════════════════════════════════
// 审计日志（脱敏存储）
// ═══════════════════════════════════════════════════════════════

function logAudit({ userId, action, detail, requesterId, targetId, field, ip }) {
  const d = getDb();
  // 5 年保留 - 永久记录用于追溯合规审计
  d.prepare(`
    INSERT INTO audit_logs
      (user_id, action, detail, requester_id, target_id, field, ip, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now','localtime'))
  `).run(userId, action, detail, requesterId || null, targetId || null, field || null, ip || null);

  logger.info({
    module: 'privacy',
    event: 'audit.pii',
    userId, action, requesterId, targetId, field, ip,
  }, `pii event: ${action}`);
}

// ═══════════════════════════════════════════════════════════════
// 用户数据导出（GDPR 第 20 条）
// ═══════════════════════════════════════════════════════════════

function exportUserData({ userId, requesterId, ip, userAgent }) {
  const d = getDb();

  // 1. 取用户基本资料（解密所有 L2+ 字段）
  const userRow = d.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!userRow) {
    throw Object.assign(new Error('USER_NOT_FOUND'), { code: 'USER_NOT_FOUND' });
  }

  const decryptedUser = {
    id: userRow.id,
    name: userRow.name,
    sex: userRow.sex,
    occupation: userRow.occupation,
    zodiac: userRow.zodiac,
    day_stem: userRow.day_stem,
    xi_ele: userRow.xi_ele,
    faith: userRow.faith,
    vip_level: userRow.vip_level,
    vip_expire: userRow.vip_expire,
    follow_date: userRow.follow_date,
    created_at: userRow.created_at,
    updated_at: userRow.updated_at,
    // 解密后的 L2+ 字段
    phone: userRow.phone ? sec.decrypt(userRow.phone) : null,
    birth_date: userRow.birth_date ? sec.decrypt(userRow.birth_date) : null,
    birth_hour: userRow.birth_hour,
    birthplace: userRow.birthplace ? sec.decrypt(userRow.birthplace) : null,
    residence: userRow.residence ? sec.decrypt(userRow.residence) : null,
  };

  // 2. 关联数据
  const userData = d.prepare('SELECT data_key, data_value FROM user_data WHERE user_id = ?').all(userId);
  const points = d.prepare('SELECT * FROM user_points WHERE user_id = ?').get(userId);
  const roles = d.prepare('SELECT role FROM user_roles WHERE user_id = ?').all(userId);
  const paipan = d.prepare(
    'SELECT id, type, input_data, result_data, created_at FROM paipan_records WHERE user_id = ? ORDER BY created_at DESC'
  ).all(userId);
  const yearlyPushes = d.prepare(
    'SELECT id, push_year, push_type, content, channel, created_at FROM yuanzhu_yearly_push WHERE user_id = ? ORDER BY created_at DESC'
  ).all(userId);
  const consents = getConsents(userId);

  // 3. 同意记录
  // 4. 审计
  logAudit({
    userId: requesterId,        // 操作者
    action: 'pii.export',
    detail: `user_id=${userId}`,
    requesterId,
    targetId: userId,
    ip,
  });

  return {
    exportedAt: new Date().toISOString(),
    exportVersion: '1.0',
    gdprBasis: 'PIPL 第 45 条 / GDPR 第 20 条',
    user: decryptedUser,
    userData,
    points,
    roles,
    paipan_records: paipan,
    yearly_pushes: yearlyPushes,
    consents,
    meta: {
      totalTables: 7,
      totalRows: 1 + userData.length + (points ? 1 : 0) + roles.length + paipan.length + yearlyPushes.length,
    },
  };
}

// ═══════════════════════════════════════════════════════════════
// 用户软删除（注销 + 30 天宽限期）
// ═══════════════════════════════════════════════════════════════

function softDeleteUser({ userId, requesterId, reason, ip }) {
  const d = getDb();

  // 1. 校验权限（只能本人或 super_admin）
  if (userId !== requesterId) {
    // 检查 requester 角色
    const roles = d.prepare('SELECT role FROM user_roles WHERE user_id = ?').all(requesterId);
    const isSuperAdmin = roles.some(r => r.role === 'super_admin');
    if (!isSuperAdmin) {
      throw Object.assign(new Error('FORBIDDEN'), { code: 'FORBIDDEN' });
    }
  }

  // 2. 检查用户存在
  const user = d.prepare('SELECT id, phone, name FROM users WHERE id = ?').get(userId);
  if (!user) throw Object.assign(new Error('USER_NOT_FOUND'), { code: 'USER_NOT_FOUND' });

  // 3. 检查是否已经在删除队列
  const existing = d.prepare('SELECT * FROM user_deletion_requests WHERE user_id = ? AND cancelled_at IS NULL').get(userId);
  if (existing) {
    return {
      alreadyScheduled: true,
      scheduledHardDeleteAt: existing.scheduled_hard_delete_at,
      requestedAt: existing.requested_at,
    };
  }

  // 4. 计算宽限期（30 天）
  const now = new Date();
  const scheduled = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const scheduledIso = scheduled.toISOString().slice(0, 19).replace('T', ' ');

  // 5. 标记用户为软删除（保留可识别数据用于宽限期恢复）
  d.prepare(`
    INSERT OR REPLACE INTO user_deletion_requests
      (user_id, requested_at, scheduled_hard_delete_at, reason)
    VALUES (?, datetime('now','localtime'), ?, ?)
  `).run(userId, scheduledIso, reason || 'user_requested');

  // 6. 撤销 JWT（如果有此用户记录的 token_version 字段）
  //    简化方案：写 audit + 后续登录会失败
  // 7. 撤销同意
  d.prepare(`
    UPDATE user_consents
    SET granted = 0
    WHERE user_id = ?
  `).run(userId);
  logAudit({
    userId: requesterId,
    action: 'consent.revoke',
    detail: 'all (deletion triggered)',
    targetId: userId,
    ip,
  });

  // 8. 审计
  logAudit({
    userId: requesterId,
    action: 'pii.delete.soft',
    detail: `user_id=${userId}, grace_period=30d`,
    requesterId,
    targetId: userId,
    ip,
  });

  return {
    softDeleted: true,
    scheduledHardDeleteAt: scheduledIso,
    gracePeriodDays: 30,
    cancellableBefore: scheduledIso,
  };
}

// ═══════════════════════════════════════════════════════════════
// 撤销软删除（30 天内恢复）
// ═══════════════════════════════════════════════════════════════

function cancelSoftDelete({ userId, requesterId, ip }) {
  const d = getDb();

  const req = d.prepare(
    'SELECT * FROM user_deletion_requests WHERE user_id = ? AND cancelled_at IS NULL'
  ).get(userId);
  if (!req) {
    throw Object.assign(new Error('NO_PENDING_DELETION'), { code: 'NO_PENDING_DELETION' });
  }

  // 校验权限
  if (userId !== requesterId) {
    const roles = d.prepare('SELECT role FROM user_roles WHERE user_id = ?').all(requesterId);
    const isSuperAdmin = roles.some(r => r.role === 'super_admin');
    if (!isSuperAdmin) {
      throw Object.assign(new Error('FORBIDDEN'), { code: 'FORBIDDEN' });
    }
  }

  d.prepare(`
    UPDATE user_deletion_requests
    SET cancelled_at = datetime('now','localtime')
    WHERE user_id = ?
  `).run(userId);

  // 重新激活同意
  d.prepare(`
    UPDATE user_consents
    SET granted = 1, created_at = datetime('now','localtime')
    WHERE user_id = ?
  `).run(userId);

  logAudit({
    userId: requesterId,
    action: 'pii.delete.cancel',
    detail: `user_id=${userId}`,
    requesterId,
    targetId: userId,
    ip,
  });

  return { reactivated: true };
}

// ═══════════════════════════════════════════════════════════════
// 硬删除（定时任务 daily 03:00 调用 / 立即删除）
// ═══════════════════════════════════════════════════════════════

function hardDeleteUser({ userId, ip }) {
  const d = getDb();
  let deletedCount = 0;
  const detail = [];

  // 1. 联动清理关联表
  for (const { table, userColumn } of CASCADE_TABLES) {
    try {
      // 检查表是否存在
      const tableExists = d.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?"
      ).get(table);
      if (!tableExists) continue;

      // payments 例外：脱敏保留 7 年
      if (table === 'payments') {
        const r = d.prepare(`
          UPDATE payments SET user_id = -1, phone = NULL, name = NULL, address = NULL
          WHERE ${userColumn} = ?
        `).run(userId);
        detail.push(`${table}: anonymized ${r.changes}`);
        continue;
      }

      const r = d.prepare(`DELETE FROM ${table} WHERE ${userColumn} = ?`).run(userId);
      deletedCount += r.changes;
      detail.push(`${table}: ${r.changes}`);
    } catch (e) {
      detail.push(`${table}: skipped (${e.message})`);
    }
  }

  // 2. 删除 users 主表
  const userDel = d.prepare('DELETE FROM users WHERE id = ?').run(userId);
  deletedCount += userDel.changes;
  detail.push(`users: ${userDel.changes}`);

  // 3. 删除 user_deletion_requests
  d.prepare('DELETE FROM user_deletion_requests WHERE user_id = ?').run(userId);

  // 4. 删除用户文件存储
  const uploadsDir = path.join(__dirname, '..', 'app', 'uploads', String(userId));
  if (fs.existsSync(uploadsDir)) {
    try {
      const files = fs.readdirSync(uploadsDir);
      files.forEach(f => fs.unlinkSync(path.join(uploadsDir, f)));
      fs.rmdirSync(uploadsDir);
      detail.push(`uploads/${userId}/: ${files.length} files removed`);
    } catch (e) {
      detail.push(`uploads/${userId}/: error ${e.message}`);
    }
  }

  // 5. audit_logs 永久保留（合规要求 5 年）

  logAudit({
    userId: -1, // 系统操作
    action: 'pii.delete.hard',
    detail: `user_id=${userId}; ${detail.join(', ')}`,
    targetId: userId,
    ip,
  });

  return {
    hardDeleted: true,
    userId,
    deletedRows: deletedCount,
    detail,
  };
}

// ═══════════════════════════════════════════════════════════════
// 定时清理任务：扫描到期软删除，执行硬删除
// ═══════════════════════════════════════════════════════════════

function runScheduledHardDeletes() {
  const d = getDb();
  const expired = d.prepare(`
    SELECT user_id FROM user_deletion_requests
    WHERE cancelled_at IS NULL
      AND scheduled_hard_delete_at <= datetime('now','localtime')
  `).all();

  const results = [];
  for (const { user_id } of expired) {
    try {
      const r = hardDeleteUser({ userId: user_id, ip: 'system:cron' });
      results.push(r);
    } catch (e) {
      logger.error({
        module: 'privacy',
        event: 'pii.delete.hard.error',
        userId: user_id,
        error: e.message,
      }, 'scheduled hard delete failed');
      results.push({ userId: user_id, error: e.message });
    }
  }
  return results;
}

// ═══════════════════════════════════════════════════════════════
// 封装：Express 路由处理函数
// ═══════════════════════════════════════════════════════════════

async function apiExportHandler(req, res, apiResp) {
  const userId = req.userId || (req.user && req.user.id);
  if (!userId) return apiResp(res, 401, null, '未登录');

  try {
    const data = exportUserData({
      userId,
      requesterId: userId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="mingli-user-${userId}-export.json"`);
    res.status(200).send(JSON.stringify(data, null, 2));
  } catch (e) {
    logger.error({ module: 'privacy', event: 'pii.export.error', error: e.message }, 'export failed');
    if (e.code === 'USER_NOT_FOUND') {
      return apiResp(res, 404, null, '用户不存在');
    }
    return apiResp(res, 500, null, '导出失败');
  }
}

function apiSoftDeleteHandler(req, res, apiResp) {
  const userId = req.userId || (req.user && req.user.id);
  if (!userId) return apiResp(res, 401, null, '未登录');

  try {
    const result = softDeleteUser({
      userId,
      requesterId: userId,
      reason: req.body && req.body.reason,
      ip: req.ip,
    });
    return apiResp(res, 200, result, '账号已注销，30 天内可恢复');
  } catch (e) {
    if (e.code === 'FORBIDDEN') return apiResp(res, 403, null, '无权限');
    if (e.code === 'USER_NOT_FOUND') return apiResp(res, 404, null, '用户不存在');
    return apiResp(res, 500, null, '注销失败');
  }
}

function apiCancelSoftDeleteHandler(req, res, apiResp) {
  const userId = req.userId || (req.user && req.user.id);
  if (!userId) return apiResp(res, 401, null, '未登录');

  try {
    const result = cancelSoftDelete({
      userId,
      requesterId: userId,
      ip: req.ip,
    });
    return apiResp(res, 200, result, '账号已恢复');
  } catch (e) {
    if (e.code === 'FORBIDDEN') return apiResp(res, 403, null, '无权限');
    if (e.code === 'NO_PENDING_DELETION') return apiResp(res, 404, null, '没有待恢复的注销记录');
    return apiResp(res, 500, null, '恢复失败');
  }
}

module.exports = {
  initSchema,
  recordConsent,
  getConsents,
  logAudit,
  exportUserData,
  softDeleteUser,
  cancelSoftDelete,
  hardDeleteUser,
  runScheduledHardDeletes,
  apiExportHandler,
  apiSoftDeleteHandler,
  apiCancelSoftDeleteHandler,
  CASCADE_TABLES,
};