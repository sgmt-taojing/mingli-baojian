#!/usr/bin/env node
/**
 * 命理宝鉴 · 隐私定期清理脚本
 * - 执行 scheduled_hard_delete_at ≤ now 的硬删除请求
 * - 清理 90 天前未活动的同意记录
 * - 清理 180 天前的 pii 审计日志
 *
 * 用法: node scripts/privacy-cleanup.js
 * 退出码: 0=成功 / 1=失败
 */
const path = require('path');
const privacy = require('../server/privacy-compliance.js');

let deletedCount = 0;
let errorCount = 0;
const startTime = Date.now();

console.log('[privacy-cleanup] 开始 ' + new Date().toISOString());

try {
  // 1. 执行到期硬删除
  const result = privacy.runScheduledHardDeletes();
  deletedCount += result.deleted || 0;
  console.log(`[privacy-cleanup] 硬删除: ${result.deleted || 0} 用户`);

  // 2. 清理过期同意记录（90 天未活动）
  const db = privacy.getDb ? privacy.getDb() : new (require('node:sqlite').DatabaseSync)(path.join(__dirname, '../server/database/yidao.db'));
  try {
    const consentResult = db.prepare(`
      DELETE FROM user_consents
      WHERE created_at < datetime('now', '-90 days')
    `).run();
    console.log(`[privacy-cleanup] 过期同意清理: ${consentResult.changes} 条`);
    deletedCount += consentResult.changes;
  } catch (e) {
    if (!String(e.message).includes('no such table')) throw e;
  }

  // 3. 清理过期审计日志（180 天）
  try {
    const auditResult = db.prepare(`
      DELETE FROM audit_log
      WHERE ts < datetime('now', '-180 days') AND action LIKE 'pii.%'
    `).run();
    console.log(`[privacy-cleanup] 过期 pii 审计清理: ${auditResult.changes} 条`);
    deletedCount += auditResult.changes;
  } catch (e) {
    if (!String(e.message).includes('no such table')) throw e;
  }
} catch (err) {
  console.error('[privacy-cleanup] 失败:', err.message);
  errorCount++;
}

const duration = Date.now() - startTime;
console.log(`[privacy-cleanup] 完成 · 清理 ${deletedCount} 条 · 错误 ${errorCount} · 耗时 ${duration}ms`);
process.exit(errorCount > 0 ? 1 : 0);
