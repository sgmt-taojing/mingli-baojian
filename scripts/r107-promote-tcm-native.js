#!/usr/bin/env node
/**
 * R107: tcm 原生条目人工审核 → promote（R106 遗留 #1）
 * 审核决策（2026-08-14，主线人工审核）：
 *   ✅ promote 11 条：KB-00185（祝由术+五运六气体系介绍，503字）+ KB-00189~198（tcm-basic 基础理论 10 条）
 *   ❌ reject 3 条：
 *      KB-00186 商业营销文案（含"四级差异化服务定价 年费2-10万"等定价敏感内容，非知识条目）
 *      KB-00187/188 经验碎片（51/53 字，知识密度不足）
 */
const path = require('path');
const { promoteToFormal } = require('../server/kb-management-engine');

const APPROVE = ['KB-00185', 'KB-00189', 'KB-00190', 'KB-00191', 'KB-00192', 'KB-00193',
  'KB-00194', 'KB-00195', 'KB-00196', 'KB-00197', 'KB-00198'];
const REJECT = {
  'KB-00186': '商业营销文案（含服务定价/产品附加值等内容），非中医知识条目',
  'KB-00187': '经验碎片（51字），知识密度不足，<300字不可独立成条',
  'KB-00188': '经验碎片（53字），知识密度不足，<300字不可独立成条',
};

const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync(path.resolve(__dirname, '../server/database/yidao.db'));
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA busy_timeout = 8000');
// 重试执行器：网关 8920 持有 WAL 连接，写锁瞬时竞争
function withRetry(fn, label, retries = 4) {
  for (let i = 1; i <= retries; i++) {
    try { return fn(); }
    catch (e) {
      if (i === retries) throw e;
      const ms = 500 * i;
      console.log(`  ⏳ ${label} 写锁竞争，${ms}ms 后重试 (${i}/${retries - 1})`);
      const t = Date.now(); while (Date.now() - t < ms) {}
    }
  }
}

// 1. promote 过审条目
let promoted = 0;
for (const eid of APPROVE) {
  const exists = db.prepare('SELECT 1 FROM kb_formal WHERE entry_id = ?').get(eid);
  if (exists) { console.log(`  ⏭ ${eid} 已在 kb_formal`); continue; }
  try {
    withRetry(() => promoteToFormal(eid), eid);
    promoted++;
    console.log(`  ✅ ${eid} → kb_formal`);
  } catch (e) {
    console.error(`  ❌ ${eid}: ${e.message.slice(0, 120)}`);
  }
}

// 2. 拒绝条目：标记 rejected + 审计记录
for (const [eid, reason] of Object.entries(REJECT)) {
  try {
    db.prepare(`UPDATE kb_staging SET status='rejected', audit_status='rejected',
      audit_notes=?, audit_at=CURRENT_TIMESTAMP, reviewed_by='r107-human-audit' WHERE entry_id=?`)
      .run(reason, eid);
    db.prepare(`INSERT INTO audit_logs (action, detail, created_at) VALUES ('kb-audit-rejected', ?, CURRENT_TIMESTAMP)`)
      .run(`${eid}: ${reason}`);
    console.log(`  🚫 ${eid} → rejected（${reason.slice(0, 30)}…）`);
  } catch (e) {
    console.error(`  ❌ ${eid} 拒绝标记失败: ${e.message.slice(0, 100)}`);
  }
}

// 3. 统计
const stats = db.prepare(`
  SELECT status, COUNT(*) AS n FROM kb_staging
  WHERE src_id LIKE 'SRC-TCM-AGENT-NATIVE-V1-%' GROUP BY status`).all();
console.log('\n最终状态：');
for (const s of stats) console.log(`  ${s.status}: ${s.n}`);
db.close();
console.log(`\n✅ 完成：promote ${promoted} 条，reject ${Object.keys(REJECT).length} 条`);
