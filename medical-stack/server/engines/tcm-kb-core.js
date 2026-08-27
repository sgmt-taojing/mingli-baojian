// 简易 KB 加载 - 兼容多路径
const fs = require('fs');
const path = require('path');

let patterns = [];
try {
  const p = path.join(__dirname, '../kb/distilled-patterns.json');
  if (fs.existsSync(p)) {
    patterns = JSON.parse(fs.readFileSync(p, 'utf-8'));
  }
} catch (e) {
  patterns = [];
}

module.exports = {
  patterns,
  classics: [],
  formulas: [],
  search(query) {
    return patterns.filter(p => 
      (p.syndrome || '').includes(query) || 
      (p.diagnosis || '').includes(query) ||
      (p.key || '').includes(query)
    ).slice(0, 10);
  }
};
