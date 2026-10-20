#!/usr/bin/env node
// P3-17.6 回归扫描：检查剩余 div onclick / span onclick / a href=javascript 假按钮
const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, '..', '..', 'app');
const htmlFiles = fs.readdirSync(appDir).filter(f => f.endsWith('.html') && !f.startsWith('_'));

const stats = {
  totalFiles: htmlFiles.length,
  divOnclick: 0,
  spanOnclick: 0,
  aHrefJavascript: 0,
  byFile: {},
  patterns: { divOnclick: [], spanOnclick: [], aHrefJavascript: [] }
};

const SKIP_FILES = new Set(['index.html', 'knowledge-panel.html']);

for (const f of htmlFiles) {
  if (SKIP_FILES.has(f)) continue;
  const filePath = path.join(appDir, f);
  const content = fs.readFileSync(filePath, 'utf8');
  const divOC = (content.match(/<div\s[^>]*onclick=/gi) || []).length;
  const spanOC = (content.match(/<span\s[^>]*onclick=/gi) || []).length;
  const aJS = (content.match(/<a\s[^>]*href\s*=\s*["']javascript:/gi) || []).length;
  
  stats.divOnclick += divOC;
  stats.spanOnclick += spanOC;
  stats.aHrefJavascript += aJS;
  
  if (divOC + spanOC + aJS > 0) {
    stats.byFile[f] = { divOnclick: divOC, spanOnclick: spanOC, aHrefJavascript: aJS, total: divOC + spanOC + aJS };
  }
}

stats.totalViolations = stats.divOnclick + stats.spanOnclick + stats.aHrefJavascript;
stats.byFileSorted = Object.entries(stats.byFile).sort((a,b) => b[1].total - a[1].total);

console.log(JSON.stringify(stats, null, 2));
