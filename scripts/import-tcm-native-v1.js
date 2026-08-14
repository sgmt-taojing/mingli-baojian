#!/usr/bin/env node
/**
 * R106: tcm→mingli 反向流导入器（修真版）
 * 把 tcm-agent 出站导出的真 TCM 原生内容（aux-tcm.json）导入 mingli kb_staging
 * 修真点（vs load-tcm-distill-v5.js）：
 *   1. 输入 = aux-tcm.json（26 条真 TCM，source=tcm-agent，已过滤回流/低trust/空字段）
 *   2. 指纹去重：与 kb_formal + kb_staging 现有条目按 md5(content) 比对，防重复导入
 *   3. 合规过滤：沿用 FORBIDDEN_TAGS 精确匹配
 *   4. src_id 统一 SRC-TCM-AGENT-NATIVE-V1-{module}
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const INPUT = path.resolve(__dirname, '../server/kb-store/aux-tcm.json');
const KB_DB = path.resolve(__dirname, '../server/database/yidao.db');

const FORBIDDEN_TAGS = [
  '包治百病', '祖传秘方', '神药', '无证配方',
  '绝对有效', '100%治愈', '国家保证', '国家药监局认证',
  '听我的', '按我说的做', '我是医生',
];

if (!fs.existsSync(INPUT)) { console.error(`INPUT 不存在: ${INPUT}`); process.exit(1); }
const items = JSON.parse(fs.readFileSync(INPUT, 'utf-8'));
if (!Array.isArray(items) || !items.length) { console.error('空输入，退出'); process.exit(1); }
console.log(`输入: ${items.length} 条真 TCM 内容`);

// 合规检查
let pass = 0, fail = 0;
const issues = [];
for (const item of items) {
  const text = `${item.title || ''} ${item.content || ''}`;
  let bad = null;
  for (const tag of FORBIDDEN_TAGS) {
    if (text.includes(tag)) { bad = tag; break; }
  }
  if (bad) { fail++; issues.push({ title: item.title, tag: bad }); }
  else pass++;
}
console.log(`Compliance: ${pass}/${items.length} pass, ${fail} fail`);
for (const x of issues.slice(0, 10)) console.log(`  [违规] "${x.tag}" @ ${x.title}`);

const Database = require('better-sqlite3');
const db = new Database(KB_DB);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// 现有指纹（kb_formal + kb_staging）
const existing = new Set();
for (const row of db.prepare('SELECT content FROM kb_formal').all()) {
  if (row.content) existing.add(crypto.createHash('md5').update(String(row.content)).digest('hex'));
}
for (const row of db.prepare("SELECT content FROM kb_staging WHERE status='pending'").all()) {
  if (row.content) existing.add(crypto.createHash('md5').update(String(row.content)).digest('hex'));
}
console.log(`现有指纹: ${existing.size} 条`);

// source 注册
const MODULES = [...new Set(items.map(i => i.module || 'tcm'))];
const srcStmt = db.prepare(`INSERT OR IGNORE INTO source_index 
    (src_id, src_type, title, author, url, publisher, publish_date, trust_score, tags, module, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`);
for (const m of MODULES) {
  srcStmt.run(`SRC-TCM-AGENT-NATIVE-V1-${m}`, 'distill-native', `TCM Agent Native KB — ${m}`,
    'tcm-agent project', 'https://internal/tcm-agent/native', 'tcm-agent internal',
    '2026-08-14', 0.90, `tcm,native,${m}`, 'tcm');
}

const maxRow = db.prepare("SELECT MAX(CAST(SUBSTR(entry_id, 4) AS INTEGER)) AS m FROM kb_staging WHERE entry_id LIKE ?").get('KB-%');
let seq = (maxRow?.m || 0) + 1;
const insertEntry = db.prepare(`INSERT INTO kb_staging 
  (entry_id, module, title, content, src_id, category, keywords, summary, status, confidence, tags, version, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, 1, datetime('now'), datetime('now'))`);

const tx = db.transaction((list) => {
  let count = 0, dup = 0;
  for (const item of list) {
    const title = String(item.title || '').trim();
    const content = String(item.content || '').trim();
    if (!title || !content) continue;
    const fp = crypto.createHash('md5').update(content).digest('hex');
    if (existing.has(fp)) { dup++; continue; }
    existing.add(fp);
    const mod = item.module || 'tcm';
    const entryId = `KB-${String(seq++).padStart(5, '0')}`;
    const tags = JSON.stringify(['tcm', 'tcm-native-v1', mod]);
    try {
      insertEntry.run(entryId, mod, title, content, `SRC-TCM-AGENT-NATIVE-V1-${mod}`, 'tcm',
        JSON.stringify(item.keywords || ''), title.slice(0, 80), 0.90, tags);
      count++;
    } catch (e) {
      console.error(`Skip ${entryId}: ${e.message}`);
    }
  }
  return { count, dup };
});

const { count, dup } = tx(items);
db.close();
console.log(`✅ 导入 kb_staging: ${count} 条（去重跳过 ${dup}，合规拒绝 ${fail}）`);
console.log(`   src_id: SRC-TCM-AGENT-NATIVE-V1-* · status=pending 待审核 promote`);
console.log(`   promote 命令参考: scripts/promote-staging.js 或手动审核后 UPDATE kb_staging SET status='formal'`);
