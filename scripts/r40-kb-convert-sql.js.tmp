const fs = require('fs');
const path = require('path');

const sqlPath = path.join(process.cwd(), '.openclaw/tmp/r40-kb-insert.sql');
const outPath = path.join(process.cwd(), 'projects/mingli-baojian/scripts/r41-kb-insert.sql');
let sql = fs.readFileSync(sqlPath, 'utf-8');

// kb_formal → formal_knowledge 字段映射
// entry_id → entry_id ✓
// module → module ✓
// title → 忽略( content 已有内容 )
// content → content ✓
// category → category ✓
// keywords → 忽略( tags 已有 )
// summary → summary ✓
// trust_score → confidence (÷100 后已为 0-1 范围)
// version → version ✓ (v1 兼容)
// tags → tags ✓
// source_ids → source_ids ✓
// promoted_at → created_at

// 替换表名
sql = sql.replace(/INSERT OR REPLACE INTO kb_formal/g, 'INSERT OR REPLACE INTO formal_knowledge');

// 替换字段名
const cols = '(entry_id, module, content, summary, tags, source_ids, confidence, access_level, category, difficulty, status, audit_status, version, created_at, model_id, hit_count, last_hit)';

// 用正则提取 VALUES 并重建
const lines = sql.split('\n');
const newLines = [];
for (const line of lines) {
  if (line.startsWith('INSERT INTO formal_knowledge')) {
    // 提取 VALUES 部分
    const match = line.match(/VALUES \((.+)\);/s);
    if (match) {
      const valStr = match[1];
      // 简单替换: promoted_at CURRENT_TIMESTAMP → created_at CURRENT_TIMESTAMP
      // trust_score 已经是 0-1 映射到 confidence
      const newLine = line
        .replace('promoted_at', 'created_at')
        .replace('title', 'module'); // 双关: 跳过 title 字段
      newLines.push(newLine);
    } else {
      newLines.push(line);
    }
  } else {
    newLines.push(line);
  }
}

// 更简单的方法: 直接生成新 SQL
let newSql = 'BEGIN TRANSACTION;\n';
const entryRegex = /\('([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*([0-9.]+),\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*(CURRENT_TIMESTAMP)\);/g;

// 改用逐行解析
const origLines = sql.split('\n');
let count = 0;
for (const l of origLines) {
  if (!l.includes("INSERT INTO formal_knowledge")) { newSql += l + '\n'; continue; }
  const m = l.match(/VALUES \('([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*([0-9.]+),\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*(CURRENT_TIMESTAMP)\);/);
  if (!m) { newSql += l + '\n'; continue; }
  const [, entryId, module, title, content, category, keywords, summary, trust, version, tags, sourceIds, ts] = m;
  newSql += `INSERT OR REPLACE INTO formal_knowledge (entry_id, module, content, summary, tags, source_ids, confidence, access_level, category, difficulty, status, audit_status, version, created_at, model_id, hit_count, last_hit) VALUES ('${entryId}', '${module}', '${content}', '${summary}', '${tags}', '${sourceIds}', ${trust}, 'registered', '${category}', 'intermediate', 'formal', 'approved', '${version}', ${ts}, '${module}', 0, NULL);\n`;
  count++;
}
newSql += 'COMMIT;\n';
fs.writeFileSync(outPath, newSql);
console.log(`SQL 转换完成: ${count} 条 → ${outPath}`);
console.log(`文件大小: ${(fs.statSync(outPath).size/1024).toFixed(2)} KB`);
