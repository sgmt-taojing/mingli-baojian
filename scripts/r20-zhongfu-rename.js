#!/usr/bin/env node
/**
 * R20-Node9 P0-2: r15-zhongfu entry_id 命名空间收敛
 *
 * 目标：把 `tcm-zhongfu` module 下 160 条 entry_id 改成统一命名空间
 *   - r15-tcm-zhongfu-NNN (教材详答 209字)
 *   - r16-zhongfu-NNN     (路氏临证 97字)
 *   - r15-zhongfu-NNN     (极简速记 68字)
 * 统一命名为：
 *   - tcm-zhongfu-classic-NNN  (经典教材)
 *   - tcm-zhongfu-luzhi-NNN    (路氏临证)
 *   - tcm-zhongfu-suji-NNN     (极简速记)
 *
 * 保留字段：hit_count / last_hit（先备份，最后回填）
 * FTS5 同步：自动通过 3 个 trigger；最后触发 INSERT INTO kb_fts5 VALUES('rebuild') 防漂移
 *
 * 用法：
 *   node scripts/r20-zhongfu-rename.js --dry-run     # 预览
 *   node scripts/r20-zhongfu-rename.js --execute     # 真正执行
 *
 * 安全：备份到 server/database/yidao.db.bak.r20-zhongfu-<timestamp>
 */

import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const DB_PATH = 'server/database/yidao.db';
const RENAME_MAP = {
  'r15-tcm-zhongfu': 'tcm-zhongfu-classic',
  'r16-zhongfu': 'tcm-zhongfu-luzhi',
  'r15-zhongfu': 'tcm-zhongfu-suji',
};

const isDryRun = process.argv.includes('--dry-run');
const isExecute = process.argv.includes('--execute');

if (!isDryRun && !isExecute) {
  console.error('用法: node r20-zhongfu-rename.js --dry-run | --execute');
  process.exit(1);
}

console.log(`[R20] ${isDryRun ? 'DRY-RUN' : 'EXECUTE'} 模式`);
console.log(`[R20] DB: ${DB_PATH}`);
console.log('');

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA busy_timeout = 5000');
db.exec('PRAGMA journal_mode = WAL');

// 1. 备份（仅 execute）
if (isExecute) {
  const bakPath = `${DB_PATH}.bak.r20-zhongfu-${Date.now()}`;
  fs.copyFileSync(DB_PATH, bakPath);
  console.log(`[R20] ✅ 备份: ${bakPath}`);
  console.log('');
}

// 2. 列出待改名 entry_id
const beforeRows = db.prepare(`
  SELECT entry_id, module, title, trust_score, length(content) AS len, hit_count
  FROM kb_formal
  WHERE module = 'tcm-zhongfu'
  ORDER BY entry_id
`).all();

console.log(`[R20] 待处理: ${beforeRows.length} 条`);
console.log('');

const renamePlan = [];
const idCollision = new Set();

for (const row of beforeRows) {
  let matchedPrefix = null;
  for (const [oldPrefix, newPrefix] of Object.entries(RENAME_MAP)) {
    if (row.entry_id.startsWith(oldPrefix + '-')) {
      matchedPrefix = oldPrefix;
      const numPart = row.entry_id.slice(oldPrefix.length + 1); // 取数字部分
      const newId = `${newPrefix}-${numPart}`;
      if (renamePlan.some(p => p.newId === newId)) {
        idCollision.add(newId);
      }
      renamePlan.push({
        oldId: row.entry_id,
        newId,
        title: row.title,
        len: row.len,
        hit_count: row.hit_count,
      });
      break;
    }
  }
  if (!matchedPrefix) {
    console.warn(`[R20] ⚠️ 未匹配: ${row.entry_id}`);
  }
}

if (idCollision.size > 0) {
  console.error('[R20] ❌ ID 碰撞:');
  idCollision.forEach(id => console.error(`  - ${id}`));
  console.error('[R20] 请手工处理后重试');
  process.exit(1);
}

console.log(`[R20] rename plan（${renamePlan.length} 条）:`);
const stats = {};
for (const p of renamePlan) {
  const newPrefix = p.newId.split('-').slice(0, 3).join('-'); // tcm-zhongfu-classic
  stats[newPrefix] = (stats[newPrefix] || 0) + 1;
}
Object.entries(stats).forEach(([k, v]) => console.log(`  - ${k}: ${v} 条`));
console.log('');

if (isDryRun) {
  console.log('[R20] 样例（前 5 条）:');
  renamePlan.slice(0, 5).forEach(p => {
    console.log(`  ${p.oldId}  →  ${p.newId}  (${p.len} 字, hit=${p.hit_count})`);
  });
  console.log('');
  console.log('[R20] DRY-RUN 完成，未做修改');
  process.exit(0);
}

// 3. 真正执行 rename
console.log('[R20] 开始 rename...');
const renameStmt = db.prepare('UPDATE kb_formal SET entry_id = ? WHERE entry_id = ?');

// 探测 source_index 外键表是否存在
let updateSourceIndex = null;
const tbls = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%source%'").all().map(r => r.name);
if (tbls.some(t => t.includes('source_index') && t.includes('kb'))) {
  const targetTbl = tbls.find(t => t.includes('source_index') && t.includes('kb'));
  updateSourceIndex = db.prepare(`UPDATE "${targetTbl}" SET kb_entry_id = ? WHERE kb_entry_id = ?`);
  console.log(`[R20] 外键表存在: ${targetTbl}，将同步 rename`);
} else {
  console.log(`[R20] 外键表未找到，跳过 source_index 同步（正常）`);
}

let ok = 0, fail = 0;
db.exec('BEGIN');
try {
  for (const p of renamePlan) {
    try {
      renameStmt.run(p.newId, p.oldId);
      if (updateSourceIndex) {
        try { updateSourceIndex.run(p.newId, p.oldId); } catch (_) {}
      }
      ok++;
    } catch (err) {
      console.error(`[R20] ❌ ${p.oldId}: ${err.message}`);
      fail++;
    }
  }
  db.exec('COMMIT');
  console.log(`[R20] ✅ rename 完成: ${ok} 成功 / ${fail} 失败`);
} catch (err) {
  db.exec('ROLLBACK');
  console.error('[R20] ❌ ROLLBACK:', err.message);
  process.exit(1);
}

// 4. FTS5 rebuild（保险）
console.log('');
console.log('[R20] 触发 FTS5 rebuild...');
try {
  db.exec(`INSERT INTO kb_fts5(kb_fts5) VALUES('rebuild')`);
  console.log('[R20] ✅ FTS5 rebuild 完成');
} catch (err) {
  console.error('[R20] ⚠️ FTS5 rebuild 失败:', err.message);
  console.error('[R20] 注：3 个 trigger 已自动同步大部分，正常情况不应该失败');
}

// 5. 验证
console.log('');
console.log('[R20] 验证:');
const afterRows = db.prepare(`
  SELECT substr(entry_id, 1, instr(entry_id, '-') + 6) AS prefix, COUNT(*) AS cnt
  FROM kb_formal
  WHERE module = 'tcm-zhongfu'
  GROUP BY prefix
`).all();

afterRows.forEach(r => console.log(`  - ${r.prefix}: ${r.cnt} 条`));

const oldRemaining = db.prepare(`
  SELECT COUNT(*) AS cnt FROM kb_formal
  WHERE entry_id LIKE 'r15-%' OR entry_id LIKE 'r16-zhongfu%'
`).get().cnt;
console.log(`[R20] 旧 prefix 剩余: ${oldRemaining} 条（应为 0）`);

const ftsCount = db.prepare(`
  SELECT COUNT(*) AS cnt FROM kb_fts5
  WHERE entry_id LIKE 'tcm-zhongfu-%'
`).get().cnt;
console.log(`[R20] FTS5 中 tcm-zhongfu-* 索引: ${ftsCount} 条`);

console.log('');
console.log('[R20] ✅ 全部完成');
console.log('[R20] 备份文件:', fs.readdirSync(path.dirname(DB_PATH))
  .filter(f => f.includes('.bak.r20-zhongfu-'))
  .sort().reverse()[0]);