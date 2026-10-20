#!/usr/bin/env node
/**
 * v5 loader — load v4 + v5 distill into KB staging
 * Aligns with v4's simpler exact-match compliance + correct DB path
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const INPUTS = [
  path.join(__dirname, '../training-data/sft-tcm-engine-distill.jsonl'),
  path.join(__dirname, '../training-data/sft-tcm-engine-distill-v5.jsonl'),
];
const KB_STAGING = path.resolve(__dirname, '../server/database/yidao.db');

// ═══════════════════════════════════════════
// Simple exact-match compliance (v4 approach)
// Only block dangerous advice patterns, NOT normal medical terminology
// ═══════════════════════════════════════════
const FORBIDDEN_TAGS = [
  '包治百病', '祖传秘方', '神药', '无证配方',
  '绝对有效', '100%治愈', '国家保证', '国家药监局认证',
  '听我的', '按我说的做', '我是医生',
];

const all = [];
for (const f of INPUTS) {
  if (!fs.existsSync(f)) { console.log(`skip: ${f}`); continue; }
  const lines = fs.readFileSync(f, 'utf-8').split('\n').filter(l => l.trim());
  for (const line of lines) {
    all.push(JSON.parse(line));
  }
}

let pass = 0, fail = 0;
const issues = [];
for (let i = 0; i < all.length; i++) {
  const item = all[i];
  const asst = item.messages.find(m => m.role === 'assistant');
  const text = asst ? asst.content : '';
  let bad = null;
  for (const tag of FORBIDDEN_TAGS) {
    if (text.includes(tag)) { bad = tag; break; }
  }
  if (bad) { fail++; issues.push({ idx: i + 1, module: item.module, tag: bad }); }
  else pass++;
}

console.log(`Compliance: ${pass}/${all.length} pass, ${fail} fail`);
if (issues.length) {
  console.log('Issues:');
  for (const x of issues.slice(0, 10)) console.log(`  [#${x.idx}] [${x.module}] "${x.tag}"`);
}

if (!fs.existsSync(KB_STAGING)) {
  console.error(`DB not found: ${KB_STAGING}`);
  process.exit(1);
}

const Database = require('better-sqlite3');
const db = new Database(KB_STAGING);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ═══════════════════════════════════════════
// Step 1: Register sources
// ═══════════════════════════════════════════
const MODULES = [...new Set(all.map(p => p.module))];
console.log(`\nRegistering ${MODULES.length} sources...`);
const srcStmt = db.prepare(`INSERT OR IGNORE INTO source_index 
    (src_id, src_type, title, author, url, publisher, publish_date, trust_score, tags, module, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`);

const srcMap = {};
for (const m of MODULES) {
  const srcId = `SRC-TCM-AGENT-DISTILL-V5-${m}`;
  srcStmt.run(srcId, 'distill-engine', `TCM Agent Engine Distill V5 — ${m}`, 'tcm-agent project',
    'https://internal/tcm-agent/distill-v5', 'tcm-agent internal', '2026-08-09', 0.90, `tcm,distill,${m}`, 'tcm');
  srcMap[m] = srcId;
}

// ═══════════════════════════════════════════
// Step 2: Insert entries into kb_staging
// ═══════════════════════════════════════════
console.log(`\nLoading ${all.length} entries...`);

const maxRow = db.prepare('SELECT MAX(CAST(SUBSTR(entry_id, 4) AS INTEGER)) AS m FROM kb_staging WHERE entry_id LIKE ?').get('KB-%');
let seq = (maxRow?.m || 0) + 1;
const insertEntry = db.prepare(`INSERT INTO kb_staging 
  (entry_id, module, title, content, src_id, category, keywords, summary, status, confidence, tags, version, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, 1, datetime('now'), datetime('now'))`);

const tx = db.transaction((items) => {
  let count = 0;
  for (const item of items) {
    const q = item.messages[0]?.content || '';
    const a = item.messages[1]?.content || '';
    const content = `Q: ${q}\n\nA: ${a}`;
    const contentMd5 = crypto.createHash('md5').update(content).digest('hex');
    const title = q.slice(0, 60);
    const tags = JSON.stringify(['tcm', 'distill-v5', item.module]);
    const srcId = srcMap[item.module];
    const entryId = `KB-${String(seq++).padStart(5, '0')}`;
    try {
      insertEntry.run(entryId, item.module, title, content, srcId, 'tcm', tags, title.slice(0, 80), 0.90, tags);
      count++;
    } catch (e) {
      console.error(`Skip ${entryId}: ${e.message}`);
    }
  }
  return count;
});

const written = tx(all);
db.close();

console.log(`✅ Loaded ${written} → KB staging (${new Set(all.map(a => a.module)).size} modules)`);

// Summary by module
const modCounts = {};
for (const item of all) {
  const m = item.module;
  modCounts[m] = (modCounts[m] || 0) + 1;
}
console.log('\nModule breakdown:');
for (const [mod, n] of Object.entries(modCounts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${mod}: ${n} pairs`);
}
console.log(`\nTotal v4+v5: ${all.length} pairs (v4=139 + v5=${all.length - 139})`);