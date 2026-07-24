#!/usr/bin/env node
/**
 * 将 nihaisha-structured-kb.js 的 118 条结构化条目导入 kb_formal 表
 * 模块名: nihaisha-structured
 * 来源: knowledge/nihaisha-structured-kb.js (window.NIHAISHA_STRUCTURED_KB)
 */

const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

// 1. 加载 KB 文件（用 eval 提取 window.NIHAISHA_STRUCTURED_KB）
const kbPath = path.join(__dirname, '..', 'knowledge', 'nihaisha-structured-kb.js');
const kbCode = fs.readFileSync(kbPath, 'utf8');

// 模拟 window 对象
const window = {};
eval(kbCode.replace(/window\./g, 'window.'));
const KB = window.NIHAISHA_STRUCTURED_KB;

if (!KB || typeof KB !== 'object') {
  console.error('ERROR: NIHAISHA_STRUCTURED_KB not found or invalid');
  process.exit(1);
}

const entries = Object.values(KB);
console.log(`Loaded ${entries.length} structured entries`);

// 2. 连接数据库
const dbPath = path.join(__dirname, '..', 'server', 'database', 'yidao.db');
const db = new DatabaseSync(dbPath);

// 3. 清理旧数据（如果有）
const deleted = db.prepare("DELETE FROM kb_formal WHERE module='nihaisha-structured'").run();
console.log(`Deleted ${deleted.changes} old entries`);

// 4. 插入
const insert = db.prepare(`
  INSERT INTO kb_formal
  (entry_id, module, title, content, keywords, tags, source_ids, category, difficulty, status, version, trust_score, promoted_at, promoted_from, reviewed_by, hit_count)
  VALUES (?, 'nihaisha-structured', ?, ?, ?, ?, ?, ?, ?, 'formal', 1, 0.9, CURRENT_TIMESTAMP, 'auto-promoted', 'seed-script', 0)
`);

let inserted = 0;
for (const entry of entries) {
  try {
    const keywords = (entry.name || '') + ' ' + (entry.source || '');
    const tags = JSON.stringify(entry.refs || []);
    const sourceIds = JSON.stringify([entry.source || '倪海厦']);
    const category = entry.category || '中医课程';
    const difficulty = entry.difficulty || '📘 实践';

    insert.run(
      entry.id,
      entry.name,
      (entry.content || '').slice(0, 4000),  // kb_formal.content 限制长度
      keywords,
      tags,
      sourceIds,
      category,
      difficulty
    );
    inserted++;
  } catch (e) {
    console.error(`FAIL ${entry.id}: ${e.message}`);
  }
}

console.log(`Inserted ${inserted}/${entries.length} entries`);

// 5. 验证
const count = db.prepare("SELECT COUNT(*) as cnt FROM kb_formal WHERE module='nihaisha-structured'").get();
console.log(`Verify: kb_formal module='nihaisha-structured' has ${count.cnt} entries`);

// 6. 样本
const sample = db.prepare("SELECT entry_id, title, length(content) as clen FROM kb_formal WHERE module='nihaisha-structured' LIMIT 5").all();
sample.forEach(r => console.log(`  ${r.entry_id}: ${r.title} (${r.clen} chars)`));

db.close();
