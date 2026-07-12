const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname);
const htmlPath = path.join(projectRoot, 'app/divination-hub.html');
const html = fs.readFileSync(htmlPath, 'utf8');

// Load all JS files
const jsDir1 = path.join(projectRoot, 'app/js');
const jsDir2 = path.join(projectRoot, 'app/knowledge');

const allDefinedFuncs = new Set();

// Extract from HTML inline
const inlineFuncRegex = /function\s+(\w+)\s*\(/g;
let m;
while ((m = inlineFuncRegex.exec(html)) !== null) {
  allDefinedFuncs.add(m[1]);
}
// Arrow functions in HTML
const arrowRegex = /(?:const|let|var)\s+(\w+)\s*=\s*(?:function|\([^)]*\)\s*=>)/g;
while ((m = arrowRegex.exec(html)) !== null) {
  allDefinedFuncs.add(m[1]);
}

// Load all JS files
function loadJS(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  files.forEach(f => {
    if (f.endsWith('.js') && !f.includes('.bak')) {
      const content = fs.readFileSync(path.join(dir, f), 'utf8');
      let m2;
      const r1 = /function\s+(\w+)\s*\(/g;
      while ((m2 = r1.exec(content)) !== null) allDefinedFuncs.add(m2[1]);
      const r2 = /(?:const|let|var)\s+(\w+)\s*=\s*(?:function|\([^)]*\)\s*=>)/g;
      while ((m2 = r2.exec(content)) !== null) allDefinedFuncs.add(m2[1]);
      // Also check for window.xxx = function
      const r3 = /window\.(\w+)\s*=\s*(?:function|\()/g;
      while ((m2 = r3.exec(content)) !== null) allDefinedFuncs.add(m2[1]);
    }
  });
}

loadJS(jsDir1);
loadJS(jsDir2);

// Also load the extra JS file
const extraPath = path.join(projectRoot, 'app/divination-hub-extra.js');
if (fs.existsSync(extraPath)) {
  const content = fs.readFileSync(extraPath, 'utf8');
  let m2;
  const r1 = /function\s+(\w+)\s*\(/g;
  while ((m2 = r1.exec(content)) !== null) allDefinedFuncs.add(m2[1]);
}

console.log('Total defined functions:', allDefinedFuncs.size);

// Extract all onclick handler functions
const onclickRegex = /onclick="([^"]+)"/g;
const allCalledFuncs = new Set();
let match2;
while ((match2 = onclickRegex.exec(html)) !== null) {
  const handler = match2[1];
  // Extract function names
  const callRegex = /(\w+)\s*\(/g;
  let m3;
  while ((m3 = callRegex.exec(handler)) !== null) {
    const fn = m3[1];
    // Skip built-ins and DOM methods
    if (!['event', 'document', 'window', 'if', 'var', 'confirm', 'prompt', 'alert',
          'stopPropagation', 'getElementById', 'querySelector', 'querySelectorAll',
          'scrollTo', 'scrollIntoView', 'click', 'toggle', 'setTimeout'
    ].includes(fn)) {
      allCalledFuncs.add(fn);
    }
  }
}

console.log('\n=== Functions called in onclick but NOT defined anywhere ===');
const missing = [];
allCalledFuncs.forEach(fn => {
  if (!allDefinedFuncs.has(fn)) {
    console.log(`  ❌ ${fn}`);
    missing.push(fn);
  }
});

if (missing.length === 0) {
  console.log('  (none - all functions are defined!)');
}

// Now check section content
console.log('\n=== Section content check ===');
const allIds = new Set();
const idRegex = /id="([^"]+)"/g;
let m4;
while ((m4 = idRegex.exec(html)) !== null) {
  allIds.add(m4[1]);
}

// Check showSection targets
const sections = ['hero','bazi','zhanbu','fengshui','xingming','yanzhi','jiuri','more','user','masters','tizhi'];
sections.forEach(s => {
  const id = `section-${s}`;
  const exists = allIds.has(id);
  console.log(`  ${exists ? '✅' : '❌'} section-${s}`);
});

// Check morePanel targets
console.log('\n=== More Panel check ===');
const modules = ['knowledge','almanac','tizhi','faith','koujue','vip','shop'];
modules.forEach(s => {
  const id = `morePanel-${s}`;
  const exists = allIds.has(id);
  console.log(`  ${exists ? '✅' : '❌'} morePanel-${s}`);
});

// Check zhanbuSub targets
console.log('\n=== Zhanbu Sub check ===');
['yijing','meihua','qimen','liuren','ziwei','cezi'].forEach(s => {
  const id = `zhanbuSub-${s}`;
  const exists = allIds.has(id);
  console.log(`  ${exists ? '✅' : '❌'} zhanbuSub-${s}`);
});

// Check xingmingSub targets
console.log('\n=== Xingming Sub check ===');
['rename','company','mobile'].forEach(s => {
  const id = `xingmingSub-${s}`;
  const exists = allIds.has(id);
  console.log(`  ${exists ? '✅' : '❌'} xingmingSub-${s}`);
});

// Check fengshuiSub targets
console.log('\n=== Fengshui Sub check ===');
['fengshui-content','luopan-content'].forEach(s => {
  const exists = allIds.has(s);
  console.log(`  ${exists ? '✅' : '❌'} id="${s}"`);
});

// Check knowledge detail targets
console.log('\n=== Knowledge Detail check (kd-xxx inline divs) ===');
const kdTargets = ['bagua','liushisigua','bazi','qimen','wuxing','fengshui','shishen','nayin','shensha','hechong','liuyao','xingming',
  'shengxiao','constellation','yangzhai','ziwei','meihua','liuren','tizhi','rujia','daojia','fojia','zeji','huxing','cezi',
  'jingdian','fanyin','meirikoujue','gongde','zhishitupu','yangsheng','daochang','jiazinayin','jieqi','zhouyi','yanzhi'];
kdTargets.forEach(s => {
  const id = `kd-${s}`;
  const exists = allIds.has(id);
  // Also check if it's in KNOWLEDGE_DETAILS
  console.log(`  ${exists ? '✅(inline)' : '⚠️(JS)'} kd-${s}`);
});

// Check mastersPanel targets
console.log('\n=== Masters Panel check ===');
['taoist','buddhist','tcm','precepts'].forEach(s => {
  const id = `mastersPanel-${s}`;
  const exists = allIds.has(id);
  console.log(`  ${exists ? '✅' : '❌'} mastersPanel-${s}`);
});

// Now check which tool-card onclicks lead to broken sections
console.log('\n=== Tool-card onclick check ===');
const toolCardRegex = /class="tool-card"[^>]*onclick="([^"]+)"/g;
let m5;
while ((m5 = toolCardRegex.exec(html)) !== null) {
  const handler = m5[1];
  console.log(`  ${handler}`);
}
