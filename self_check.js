const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app/divination-hub.html');
const html = fs.readFileSync(filePath, 'utf8');

// 1. Extract all onclick handlers
const onclickRegex = /onclick="([^"]+)"/g;
let match;
const handlers = [];
while ((match = onclickRegex.exec(html)) !== null) {
  handlers.push(match[1].trim());
}

// 2. Extract unique function names called
const funcCalls = new Set();
const funcCallRegex = /(\w+)\s*\(/g;
handlers.forEach(h => {
  let m;
  while ((m = funcCallRegex.exec(h)) !== null) {
    if (!['event', 'document', 'window', 'if', 'var', 'confirm', 'prompt', 'alert'].includes(m[1])) {
      funcCalls.add(m[1]);
    }
  }
});

// 3. Extract all function definitions (inline)
const funcDefRegex = /function\s+(\w+)\s*\(/g;
const definedFuncs = new Set();
while ((match = funcDefRegex.exec(html)) !== null) {
  definedFuncs.add(match[1]);
}

// Also check for arrow/const function assignments
const arrowFuncRegex = /(?:const|let|var)\s+(\w+)\s*=\s*(?:function|\([^)]*\)\s*=>)/g;
while ((match = arrowFuncRegex.exec(html)) !== null) {
  definedFuncs.add(match[1]);
}

// 4. Extract all element IDs
const idRegex = /id="([^"]+)"/g;
const allIds = new Set();
while ((match = idRegex.exec(html)) !== null) {
  allIds.add(match[1]);
}

// 5. Check showSection targets
const showSectionRegex = /showSection\(['"](\w+)['"]\)/g;
const showSectionTargets = new Set();
while ((match = showSectionRegex.exec(html)) !== null) {
  showSectionTargets.add(match[1]);
}

// 6. Check showMoreModule targets
const showMoreModuleRegex = /showMoreModule\(['"](\w+)['"]/g;
const showMoreModuleTargets = new Set();
while ((match = showMoreModuleRegex.exec(html)) !== null) {
  showMoreModuleTargets.add(match[1]);
}

// 7. Check showZhanbuSub targets
const showZhanbuSubRegex = /showZhanbuSub\(['"](\w+)['"]\)/g;
const showZhanbuSubTargets = new Set();
while ((match = showZhanbuSubRegex.exec(html)) !== null) {
  showZhanbuSubTargets.add(match[1]);
}

// 8. Check showXingmingSub targets
const showXingmingSubRegex = /showXingmingSub\(['"](\w+)['"]\)/g;
const showXingmingSubTargets = new Set();
while ((match = showXingmingSubRegex.exec(html)) !== null) {
  showXingmingSubTargets.add(match[1]);
}

// 9. Check showFengshuiSub targets
const showFengshuiSubRegex = /showFengshuiSub\(['"](\w+)['"]\)/g;
const showFengshuiSubTargets = new Set();
while ((match = showFengshuiSubRegex.exec(html)) !== null) {
  showFengshuiSubTargets.add(match[1]);
}

// 10. Check showKnowledgeDetail targets
const showKnowledgeDetailRegex = /showKnowledgeDetail\(['"](\w+)['"]\)/g;
const showKnowledgeDetailTargets = new Set();
while ((match = showKnowledgeDetailRegex.exec(html)) !== null) {
  showKnowledgeDetailTargets.add(match[1]);
}

// 11. Check showMastersTab targets
const showMastersTabRegex = /showMastersTab\(['"](\w+)['"]/g;
const showMastersTabTargets = new Set();
while ((match = showMastersTabRegex.exec(html)) !== null) {
  showMastersTabTargets.add(match[1]);
}

// 12. Check section IDs (section-XXX pattern)
const sectionIds = new Set();
allIds.forEach(id => {
  if (id.startsWith('section-') || id === 'hero' || id.startsWith('hero-')) {
    sectionIds.add(id);
  }
});

// 13. Check moreModule panel IDs (more-XXX pattern)
const morePanelIds = new Set();
allIds.forEach(id => {
  if (id.startsWith('more-') || id.startsWith('morePanel-') || id.startsWith('moreContent-')) {
    morePanelIds.add(id);
  }
});

// 14. Check zhanbu sub panel IDs
const zhanbuSubIds = new Set();
allIds.forEach(id => {
  if (id.startsWith('zhanbu-') || id.startsWith('zb-')) {
    zhanbuSubIds.add(id);
  }
});

// 15. Check knowledge detail panel IDs
const kdIds = new Set();
allIds.forEach(id => {
  if (id.startsWith('kd-')) {
    kdIds.add(id);
  }
});

// 16. Check external JS files
const scriptSrcRegex = /<script\s+src="([^"]+)"/g;
const externalScripts = [];
while ((match = scriptSrcRegex.exec(html)) !== null) {
  externalScripts.push(match[1]);
}

// Load external JS files
const externalFuncs = new Set();
externalScripts.forEach(src => {
  const jsPath = src.startsWith('http') || src.startsWith('//') ? null : path.join(__dirname, 'app', src);
  if (jsPath && fs.existsSync(jsPath)) {
    const jsContent = fs.readFileSync(jsPath, 'utf8');
    let m;
    const defRegex = /function\s+(\w+)\s*\(/g;
    while ((m = defRegex.exec(jsContent)) !== null) {
      externalFuncs.add(m[1]);
    }
    const arrowRegex = /(?:const|let|var)\s+(\w+)\s*=\s*(?:function|\([^)]*\)\s*=>)/g;
    while ((m = arrowRegex.exec(jsContent)) !== null) {
      externalFuncs.add(m[1]);
    }
  }
});

// Combine all defined functions
const allDefinedFuncs = new Set([...definedFuncs, ...externalFuncs]);

// 17. Check for content in section elements
function checkSectionContent(sectionId) {
  // Find the section element and check if it has actual content
  const patterns = [
    `id="${sectionId}"`,
    `id='section-${sectionId}'`,
    `id="${sectionId}-content"`,
  ];
  
  for (const pattern of patterns) {
    const idx = html.indexOf(pattern);
    if (idx === -1) continue;
    
    // Find the closing tag
    const startIdx = html.lastIndexOf('<', idx);
    const tagMatch = html.substring(startIdx).match(/<(\w+)/);
    if (!tagMatch) continue;
    
    const tag = tagMatch[1];
    const closeTag = `</${tag}>`;
    
    // Find matching closing tag (handle nesting)
    let depth = 1;
    let pos = idx + pattern.length;
    while (depth > 0 && pos < html.length) {
      const openIdx = html.indexOf(`<${tag}`, pos);
      const closeIdx = html.indexOf(closeTag, pos);
      
      if (closeIdx === -1) break;
      
      if (openIdx !== -1 && openIdx < closeIdx) {
        depth++;
        pos = openIdx + 1;
      } else {
        depth--;
        pos = closeIdx + closeTag.length;
      }
    }
    
    const content = html.substring(idx + pattern.length, pos - closeTag.length);
    // Check if content has actual visible text (not just whitespace/empty tags)
    const textContent = content.replace(/<[^>]+>/g, '').replace(/\s+/g, '').trim();
    return textContent.length > 10;
  }
  return false;
}

// 18. Build report
const report = [];
const errors = [];

// Check showSection targets
console.log('\n=== showSection 目标检查 ===');
showSectionTargets.forEach(target => {
  const possibleIds = [target, `section-${target}`];
  let found = false;
  let hasContent = false;
  for (const id of possibleIds) {
    if (allIds.has(id)) {
      found = true;
      hasContent = checkSectionContent(id);
      break;
    }
  }
  const status = found && hasContent ? '✅正常' : (found ? '⚠️空内容' : '❌无元素');
  if (!found || !hasContent) errors.push({target, found, hasContent});
  report.push(`| showSection('${target}') | section-${target} | ${found ? '✅' : '❌'} | ${hasContent ? '✅' : '❌'} | ${status} |`);
});

// Check showMoreModule targets
console.log('\n=== showMoreModule 目标检查 ===');
showMoreModuleTargets.forEach(target => {
  const possibleIds = [`more-${target}`, `morePanel-${target}`, `moreContent-${target}`, `more-${target}-content`];
  let found = false;
  let hasContent = false;
  for (const id of possibleIds) {
    if (allIds.has(id)) {
      found = true;
      hasContent = checkSectionContent(id);
      break;
    }
  }
  // Also check if there's a moreModule div with data-module
  if (!found) {
    const moduleRegex = new RegExp(`data-module="${target}"|class="more-module[^"]*"[^>]*data-key="${target}"`);
    if (moduleRegex.test(html)) {
      found = true;
      hasContent = true; // assume content exists
    }
  }
  const status = found && hasContent ? '✅正常' : (found ? '⚠️空内容' : '❌无元素');
  if (!found || !hasContent) errors.push({target, found, hasContent});
  report.push(`| showMoreModule('${target}') | more-${target} | ${found ? '✅' : '❌'} | ${hasContent ? '✅' : '❌'} | ${status} |`);
});

// Check showZhanbuSub targets
console.log('\n=== showZhanbuSub 目标检查 ===');
showZhanbuSubTargets.forEach(target => {
  const possibleIds = [`zhanbu-${target}`, `zb-${target}`, `zhanbu-content-${target}`];
  let found = false;
  let hasContent = false;
  for (const id of possibleIds) {
    if (allIds.has(id)) {
      found = true;
      hasContent = checkSectionContent(id);
      break;
    }
  }
  const status = found && hasContent ? '✅正常' : (found ? '⚠️空内容' : '❌无元素');
  if (!found || !hasContent) errors.push({target, found, hasContent});
  report.push(`| showZhanbuSub('${target}') | zhanbu-${target} | ${found ? '✅' : '❌'} | ${hasContent ? '✅' : '❌'} | ${status} |`);
});

// Check showXingmingSub targets
console.log('\n=== showXingmingSub 目标检查 ===');
showXingmingSubTargets.forEach(target => {
  const possibleIds = [`xm-${target}`, `xingming-${target}`];
  let found = false;
  let hasContent = false;
  for (const id of possibleIds) {
    if (allIds.has(id)) {
      found = true;
      hasContent = checkSectionContent(id);
      break;
    }
  }
  const status = found && hasContent ? '✅正常' : (found ? '⚠️空内容' : '❌无元素');
  if (!found || !hasContent) errors.push({target, found, hasContent});
  report.push(`| showXingmingSub('${target}') | xm-${target} | ${found ? '✅' : '❌'} | ${hasContent ? '✅' : '❌'} | ${status} |`);
});

// Check showFengshuiSub targets
console.log('\n=== showFengshuiSub 目标检查 ===');
showFengshuiSubTargets.forEach(target => {
  const possibleIds = [`fengshui-${target}`, `fs-${target}`];
  let found = false;
  let hasContent = false;
  for (const id of possibleIds) {
    if (allIds.has(id)) {
      found = true;
      hasContent = checkSectionContent(id);
      break;
    }
  }
  const status = found && hasContent ? '✅正常' : (found ? '⚠️空内容' : '❌无元素');
  if (!found || !hasContent) errors.push({target, found, hasContent});
  report.push(`| showFengshuiSub('${target}') | fengshui-${target} | ${found ? '✅' : '❌'} | ${hasContent ? '✅' : '❌'} | ${status} |`);
});

// Check showKnowledgeDetail targets
console.log('\n=== showKnowledgeDetail 目标检查 ===');
showKnowledgeDetailTargets.forEach(target => {
  const possibleIds = [`kd-${target}`];
  let found = false;
  let hasContent = false;
  for (const id of possibleIds) {
    if (allIds.has(id)) {
      found = true;
      hasContent = checkSectionContent(id);
      break;
    }
  }
  const status = found && hasContent ? '✅正常' : (found ? '⚠️空内容' : '❌无元素');
  if (!found || !hasContent) errors.push({target, found, hasContent});
  report.push(`| showKnowledgeDetail('${target}') | kd-${target} | ${found ? '✅' : '❌'} | ${hasContent ? '✅' : '❌'} | ${status} |`);
});

// Check showMastersTab targets
console.log('\n=== showMastersTab 目标检查 ===');
showMastersTabTargets.forEach(target => {
  const possibleIds = [`masters-${target}`, `master-${target}`, `mastersTab-${target}`];
  let found = false;
  let hasContent = false;
  for (const id of possibleIds) {
    if (allIds.has(id)) {
      found = true;
      hasContent = checkSectionContent(id);
      break;
    }
  }
  const status = found && hasContent ? '✅正常' : (found ? '⚠️空内容' : '❌无元素');
  if (!found || !hasContent) errors.push({target, found, hasContent});
  report.push(`| showMastersTab('${target}') | masters-${target} | ${found ? '✅' : '❌'} | ${hasContent ? '✅' : '❌'} | ${status} |`);
});

// Check undefined functions
console.log('\n=== 未定义函数检查 ===');
const undefinedFuncs = [];
funcCalls.forEach(fn => {
  if (!allDefinedFuncs.has(fn)) {
    // Skip DOM built-in functions
    if (['showToast', 'closeMore', 'toggleMore', 'openAskModal', 'closeAskModal', 'submitAsk',
         'openAskModalWithMaster', 'toggleMasterCard', 'toggleDailyKnowledgeDetail',
         'switchMudra', 'selectFaith', 'switchMeritTab', 'meritBtn',
         'tzSwitchTab', 'tzAddMetricField', 'tzAnalyzeManualMetrics', 'tzCalculateResult',
         'tzGeneratePlan', 'tzAnalyzeBazi', 'tzSubmitCheckin',
         'filterShopProducts', 'toggleCartModal', 'closeShopDetail',
         'koujueSwitchCategory', 'koujueShowFavorites',
         'knowledgeCatFilter', 'knowledgeSchoolFilter',
         'showMastersKB', 'hideKnowledgeDetail', 'closeKnowledgeDetail',
         'closeAuthoritativePanel', 'toggleHexagramDetail',
         'showCaseLibrary', 'closeCaseLibrary', 'filterCaseLibrary', 'toggleCaseDetail',
         'exportHTML', 'exportPDF', 'exportCurrentSection',
         'handleScreenshotUpload', 'handleScreenshotDrop', 'showScreenshotPreview',
         'analyzeScreenshot', 'resetScreenshot', 'scrollToTop',
         'playSound', 'playDivinationSound', 'bindBazi'
    ].includes(fn)) {
      // These might be defined dynamically or in external scripts we couldn't read
      // Mark for manual check
      undefinedFuncs.push(fn);
    } else {
      undefinedFuncs.push(fn);
    }
  }
});

// Actually, let's properly check - any function called in onclick but not defined
console.log('Functions called but not found in definitions:');
funcCalls.forEach(fn => {
  if (!allDefinedFuncs.has(fn)) {
    console.log(`  ❌ ${fn}`);
  }
});

// Print showSection function definition to understand how it works
const showSectionDef = html.indexOf('function showSection');
if (showSectionDef !== -1) {
  console.log('\n=== showSection 函数定义 (前500字符) ===');
  console.log(html.substring(showSectionDef, showSectionDef + 500));
}

// Print showMoreModule function definition
const showMoreModuleDef = html.indexOf('function showMoreModule');
if (showMoreModuleDef !== -1) {
  console.log('\n=== showMoreModule 函数定义 (前500字符) ===');
  console.log(html.substring(showMoreModuleDef, showMoreModuleDef + 500));
}

// Print showZhanbuSub function definition
const showZhanbuSubDef = html.indexOf('function showZhanbuSub');
if (showZhanbuSubDef !== -1) {
  console.log('\n=== showZhanbuSub 函数定义 (前500字符) ===');
  console.log(html.substring(showZhanbuSubDef, showZhanbuSubDef + 500));
}

// Print showXingmingSub function definition
const showXingmingSubDef = html.indexOf('function showXingmingSub');
if (showXingmingSubDef !== -1) {
  console.log('\n=== showXingmingSub 函数定义 (前500字符) ===');
  console.log(html.substring(showXingmingSubDef, showXingmingSubDef + 500));
}

// Print showFengshuiSub function definition
const showFengshuiSubDef = html.indexOf('function showFengshuiSub');
if (showFengshuiSubDef !== -1) {
  console.log('\n=== showFengshuiSub 函数定义 (前500字符) ===');
  console.log(html.substring(showFengshuiSubDef, showFengshuiSubDef + 500));
}

// Print showKnowledgeDetail function definition
const showKnowledgeDetailDef = html.indexOf('function showKnowledgeDetail');
if (showKnowledgeDetailDef !== -1) {
  console.log('\n=== showKnowledgeDetail 函数定义 (前500字符) ===');
  console.log(html.substring(showKnowledgeDetailDef, showKnowledgeDetailDef + 500));
}

// Print showMastersTab function definition
const showMastersTabDef = html.indexOf('function showMastersTab');
if (showMastersTabDef !== -1) {
  console.log('\n=== showMastersTab 函数定义 (前500字符) ===');
  console.log(html.substring(showMastersTabDef, showMastersTabDef + 500));
}

console.log('\n\n=== 汇总 ===');
console.log('showSection targets:', [...showSectionTargets]);
console.log('showMoreModule targets:', [...showMoreModuleTargets]);
console.log('showZhanbuSub targets:', [...showZhanbuSubTargets]);
console.log('showXingmingSub targets:', [...showXingmingSubTargets]);
console.log('showFengshuiSub targets:', [...showFengshuiSubTargets]);
console.log('showKnowledgeDetail targets:', [...showKnowledgeDetailTargets]);
console.log('showMastersTab targets:', [...showMastersTabTargets]);
console.log('\nAll IDs starting with section-:', [...allIds].filter(id => id.startsWith('section-')));
console.log('\nAll IDs starting with more:', [...allIds].filter(id => id.startsWith('more') || id.startsWith('morePanel') || id.startsWith('moreContent')));
console.log('\nAll IDs starting with zhanbu or zb:', [...allIds].filter(id => id.startsWith('zhanbu') || id.startsWith('zb')));
console.log('\nAll IDs starting with xm or xingming:', [...allIds].filter(id => id.startsWith('xm-') || id.startsWith('xingming')));
console.log('\nAll IDs starting with fengshui or fs:', [...allIds].filter(id => id.startsWith('fengshui') || id.startsWith('fs-')));
console.log('\nAll IDs starting with kd:', [...allIds].filter(id => id.startsWith('kd-')));
console.log('\nAll IDs starting with master:', [...allIds].filter(id => id.startsWith('master')));
console.log('\nExternal scripts:', externalScripts);
console.log('\nExternal funcs:', [...externalFuncs]);

// Undefined functions
console.log('\n=== Undefined functions ===');
funcCalls.forEach(fn => {
  if (!allDefinedFuncs.has(fn)) {
    console.log(`  ❌ ${fn}`);
  }
});
