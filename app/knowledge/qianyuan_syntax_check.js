const fs = require('fs');
const path = require('path');

const root = '/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian';
const html = fs.readFileSync(path.join(root, 'divination-hub.html'), 'utf8');

const errors = [];
const warnings = [];

// Extract inline script blocks
const scriptBlocks = [];
let inScript = false;
let currentScript = [];
let startLine = 0;
const lines = html.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('<script') && !line.includes('<script src')) {
    inScript = true;
    currentScript = [];
    startLine = idx + 1;
  }
  if (inScript) {
    currentScript.push(line);
    if (line.includes('</script>')) {
      inScript = false;
      const content = currentScript.join('\n').replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
      scriptBlocks.push({ line: startLine, content });
    }
  }
});

console.log(`发现 ${scriptBlocks.length} 个内联脚本块`);

scriptBlocks.forEach((block, i) => {
  try {
    // Wrap in a function to avoid strict top-level return issues
    new Function(block.content);
    console.log(`  ✅ 脚本块 ${i + 1} (line ${block.line}): 语法OK`);
  } catch (e) {
    console.log(`  ❌ 脚本块 ${i + 1} (line ${block.line}): ${e.message}`);
    errors.push({ block: i + 1, line: block.line, message: e.message });
  }
});

// Check external JS files for syntax errors
const jsFiles = [
  'authoritative-knowledge-base.js', 'knowledge-details.js', 'knowledge-details-extra.js',
  'zodiac-knowledge-base.js', 'faith-knowledge-base.js', 'koujue-database-full.js',
  'koujue-renderer.js', 'bazi-knowledge-base.js', 'ziwei-knowledge-base.js',
  'qimen-knowledge-base.js', 'meihua-knowledge-base.js', 'liuren-knowledge-base.js',
  'fengshui-knowledge-base.js', 'zhouyi-knowledge-base.js', 'yangzhai-knowledge-base.js',
  'shop-data.js', 'faith-content.js', 'knowledge-supplement.js', 'knowledge-supplement-1.js',
  'knowledge-supplement-2.js', 'knowledge-supplement-3.js', 'knowledge-supplement-4.js',
  'knowledge-supplement-5.js', 'knowledge-supplement-6.js'
];

jsFiles.forEach(file => {
  const filePath = path.join(root, file);
  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠️ 文件不存在: ${file}`);
    warnings.push({ file, message: '文件不存在' });
    return;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  try {
    new Function(content);
    console.log(`  ✅ ${file}: 语法OK`);
  } catch (e) {
    console.log(`  ❌ ${file}: ${e.message}`);
    errors.push({ file, message: e.message });
  }
});

fs.writeFileSync(path.join(root, 'qianyuan_syntax_report.json'), JSON.stringify({ errors, warnings }, null, 2));
console.log('\n语法检查报告已保存: qianyuan_syntax_report.json');
