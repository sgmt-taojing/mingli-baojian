#!/usr/bin/env node
// R470 · staging → formal auto-promote cron
// 每天 02:00 自动运行，promote 所有符合条件的 staging 条目
// 条件: audit_status='approved' + confidence>=0.85 + age>=7d + fingerprint非空

const { promoteToFormal } = require('../server/kb-management-engine');
const path = require('path');

const DB_PATH = path.resolve(__dirname, '..', 'server', 'database', 'yidao.db');
const { DatabaseSync } = require('node:sqlite');

function main() {
  const db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA journal_mode = WAL');

  const now = new Date().toISOString();

  const candidates = db.prepare(`
    SELECT entry_id, module, title, confidence, fingerprint,
           CAST(julianday('now') - julianday(created_at) AS INTEGER) AS days_old
    FROM kb_staging
    WHERE audit_status = 'approved'
      AND confidence >= 0.85
      AND julianday('now') - julianday(created_at) >= 7
      AND fingerprint IS NOT NULL AND fingerprint != ''
      AND (status = 'promoted' OR status = 'staging')
    ORDER BY confidence DESC, days_old DESC
  `).all();

  if (candidates.length === 0) {
    console.log(JSON.stringify({
      ts: now, action: 'r470-auto-promote',
      candidates: 0, promoted: 0, errors: 0,
      message: 'no eligible candidates'
    }));
    try { db.exec('PRAGMA wal_checkpoint(TRUNCATE)'); } catch (_) {}
    db.close();
    return;
  }

  let promoted = 0, errors = 0;
  const details = [];

  for (const c of candidates) {
    // 锁竞争重试兜底：busy_timeout(15s，见 kb-management-engine) 之外的第二道防线，
    // 覆盖超长写锁（备份/大批量蒸馏）；最多 3 次，间隔 2s/5s。
    let lastErr = null;
    for (const waitMs of [0, 2000, 5000]) {
      if (waitMs) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, waitMs);
      try {
        promoteToFormal(c.entry_id);
        lastErr = null;
        break;
      } catch (e) {
        lastErr = e;
        if (!/database is locked/i.test(e.message)) break; // 非锁错误不重试
      }
    }
    if (lastErr) {
      errors++;
      details.push({ entry_id: c.entry_id, error: lastErr.message.slice(0, 120) });
      console.error(`[r470] ${c.entry_id}: ${lastErr.message}`);
    } else {
      promoted++;
      details.push({ entry_id: c.entry_id, module: c.module, confidence: c.confidence, days_old: c.days_old });
    }
  }

  const summary = {
    ts: now, action: 'r470-auto-promote',
    candidates: candidates.length, promoted, errors,
    details: details.slice(0, 30),
    message: `promoted ${promoted}/${candidates.length} (${errors} errors)`
  };
  console.log(JSON.stringify(summary, null, 2));
  try { db.exec('PRAGMA wal_checkpoint(TRUNCATE)'); } catch (_) {}
    db.close();
  process.exit(errors > 0 ? 1 : 0);
}

main();
