// R40-C KB formal SQL 生成 - 2108 条
const fs = require('fs');
const path = require('path');

const jsonPath = '/Users/tom/.openclaw-autoclaw/workspace/.openclaw/tmp/r39-kb-entries.json';
const sqlPath = '/Users/tom/.openclaw-autoclaw/workspace/.openclaw/tmp/r40-kb-insert.sql';

const entries = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
console.log('待生成 SQL:', entries.length);

function escapeSql(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/'/g, "''");
}

let sql = 'BEGIN TRANSACTION;\n';
entries.forEach(e => {
  const entryId = escapeSql(e.key);
  const module = escapeSql(e.model);
  const title = escapeSql(e.title);
  const content = escapeSql(e.content);
  const category = escapeSql(e.category);
  const keywords = escapeSql(JSON.stringify(e.tags || []));
  const summary = escapeSql((e.content || '').substring(0, 200));
  const tags = escapeSql(JSON.stringify(e.tags || []));
  const sourceIds = escapeSql(JSON.stringify(e.sources || []));
  const trust = (e.score || 80) / 100;
  
  sql += `INSERT OR REPLACE INTO kb_formal (entry_id, module, title, content, category, keywords, summary, trust_score, version, tags, source_ids, promoted_at) VALUES ('${entryId}', '${module}', '${title}', '${content}', '${category}', '${keywords}', '${summary}', ${trust}, 'v1', '${tags}', '${sourceIds}', CURRENT_TIMESTAMP);\n`;
});
sql += 'COMMIT;\n';

fs.writeFileSync(sqlPath, sql);
console.log('SQL 已生成:', sqlPath);
console.log('文件大小:', (fs.statSync(sqlPath).size / 1024).toFixed(2), 'KB');
console.log('SQL 条数:', entries.length);