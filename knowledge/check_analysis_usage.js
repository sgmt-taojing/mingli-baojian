const fs = require('fs');
const path = require('path');

const root = '/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian';
const html = fs.readFileSync(path.join(root, 'divination-hub.html'), 'utf8');

const analysisFns = [
  'qimenAnalyze', 'meihuaAnalyze', 'liurenAnalyze', 'xingmingAnalyze', 'fengshuiAnalyze', 'zeriCalcFull'
];

console.log('=== 分析函数调用情况 ===');
analysisFns.forEach(fn => {
  const regex = new RegExp(`\\b${fn}\\s*\\(`, 'g');
  const matches = [...html.matchAll(regex)];
  console.log(`${fn}: ${matches.length} 次调用`);
});

// Check getBaziCalcData usage
const baziCalls = [...html.matchAll(/\bgetBaziCalcData\s*\(/g)];
console.log(`getBaziCalcData: ${baziCalls.length} 次调用`);

// Check if AI analysis functions are used
const aiFns = ['generateInterpretation', 'getBaziSummary', 'getBaziDimensionHTML'];
console.log('\n=== AI 解读函数 ===');
aiFns.forEach(fn => {
  const matches = [...html.matchAll(new RegExp(`\\b${fn}\\s*\\(`, 'g'))];
  console.log(`${fn}: ${matches.length} 次调用`);
});
