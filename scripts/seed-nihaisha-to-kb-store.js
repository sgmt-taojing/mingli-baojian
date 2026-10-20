#!/usr/bin/env node
/**
 * 把 nihaisha-structured-entries.js 转换为 KB store 格式
 * 输出：server/kb-store/professional/nihaisha-structured-kb.js
 *
 * KB store 标准格式：
 * window.NIHAISHA_STRUCTURED_KB = {
 *   "条目id": { id, name, source, content, ... }
 * }
 */

const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'knowledge', 'nihaisha-structured-entries.js');
const OUT = path.join(__dirname, '..', 'server', 'kb-store', 'professional', 'nihaisha-structured-kb.js');

const src = fs.readFileSync(SRC, 'utf8');
const fixed = src.replace('window.NIHAISHA_STRUCTURED', 'global.NIHAISHA_STRUCTURED');
eval(fixed);
const entries = global.NIHAISHA_STRUCTURED;

// 转换为 KB store 格式（key=id）
const obj = {};
entries.forEach(e => {
  obj[e.id] = {
    id: e.id,
    name: e.name,
    source: e.source,
    level: e.level,
    content: e.content,
    refs: e.refs,
    category: e.category,
    difficulty: e.difficulty,
    module: e.module,
    chunkIndex: e.chunkIndex || 0,
    charCount: e.charCount,
    key: [e.category, e.source, e.difficulty, '倪海厦'],
    refs_zh: e.refs
  };
});

const output = `// 倪师知识库 - 结构化条目（自动生成，KB store 格式）
// 生成时间: ${new Date().toISOString()}
// 源文件: knowledge/nihaisha-structured-entries.js
// 条目数: ${entries.length}
// 用途: 通过 /api/kb/nihaisha-structured-kb.js 访问（professional 级别）
//
// 模块覆盖：伤寒论/金匮要略/黄帝内经/神农本草/针灸大成/八纲辨证/
//          仲景心法/扶阳论坛/易筋经/梁冬对话/斯坦福演讲/天纪/
//          临床医案/方剂方证/症状索引/六经辨证/课程地图等
//
// 切分策略：
// - 短模块（< 5000 chars）：整条入库
// - 长模块（> 5000 chars）：按段落切分为多条（每条 < 3000 chars）

window.NIHAISHA_STRUCTURED_KB = ${JSON.stringify(obj, null, 2)};
`;

fs.writeFileSync(OUT, output, 'utf8');
console.log(`✅ 已生成 KB store 文件: ${OUT}`);
console.log(`   条目数: ${entries.length}`);
console.log(`   文件大小: ${(fs.statSync(OUT).size / 1024).toFixed(1)} KB`);

// 同时更新 manifest
const manifestPath = path.join(__dirname, '..', 'server', 'kb-store', 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// 检查是否已存在
const existing = manifest.files.find(f => f.filename === 'nihaisha-structured-kb.js');
if (existing) {
  existing.md5 = require('crypto').createHash('md5').update(output).digest('hex');
  existing.size = fs.statSync(OUT).size;
  existing.desc = '倪海厦知识库结构化条目（118 条，自动从 nihaisha-kb.js 切分）';
  console.log('   ✓ 更新 manifest 现有条目');
} else {
  manifest.files.push({
    filename: 'nihaisha-structured-kb.js',
    level: 'professional',
    status: 'COPIED',
    desc: '倪海厦知识库结构化条目（118 条，自动从 nihaisha-kb.js 切分）',
    md5: require('crypto').createHash('md5').update(output).digest('hex'),
    size: fs.statSync(OUT).size,
    src: 'knowledge/nihaisha-structured-entries.js',
    dst: 'server/kb-store/professional/nihaisha-structured-kb.js'
  });
  manifest.summary.copied = manifest.files.length;
  console.log('   ✓ 添加 manifest 新条目');
}

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log(`   manifest 总文件数: ${manifest.summary.copied}`);