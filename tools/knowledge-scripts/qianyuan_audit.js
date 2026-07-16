const fs = require('fs');
const path = require('path');

const root = '/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian';
const html = fs.readFileSync(path.join(root, 'divination-hub.html'), 'utf8');

const issues = [];
const warnings = [];
const info = [];

// 1. Extract all section IDs
const sectionIds = [...html.matchAll(/id=["'](section-[a-z0-9-]+)["']/g)].map(m => m[1]);
info.push(`总 section 数量: ${[...new Set(sectionIds)].length}`);
info.push(`Sections: ${[...new Set(sectionIds)].join(', ')}`);

// 2. Check duplicate IDs - only in static HTML (remove script blocks to avoid template literal false positives)
let htmlNoScripts = html;
htmlNoScripts = htmlNoScripts.replace(/<script[\s\S]*?<\/script>/gi, '');
const allIds = [...htmlNoScripts.matchAll(/<[^>]*\bid=["']([^"']+)["']/g)].map(m => m[1]);
const idCounts = {};
allIds.forEach(id => idCounts[id] = (idCounts[id] || 0) + 1);
const duplicates = Object.entries(idCounts).filter(([k, v]) => v > 1);
if (duplicates.length) {
  issues.push(`发现 ${duplicates.length} 个重复 ID: ${duplicates.slice(0, 20).map(([k, v]) => `${k}(${v}次)`).join(', ')}`);
} else {
  info.push('未在静态 HTML 中发现重复 ID');
}

// 3. Check navigation targets
const navTargets = [...html.matchAll(/showSection\(['"]([^'"]+)['"]\)/g)].map(m => m[1]);
const uniqueNavTargets = [...new Set(navTargets)];
info.push(`导航目标数量: ${uniqueNavTargets.length}`);
const missingSections = uniqueNavTargets.filter(t => !html.includes(`id="section-${t}"`) && !html.includes(`id='section-${t}'`));
if (missingSections.length) {
  issues.push(`导航目标缺少对应 section: ${missingSections.join(', ')}`);
}

// 4. Check external scripts exist
const scriptSrcs = [...html.matchAll(/<script src=["']([^"']+)["']/g)].map(m => m[1]);
const missingScripts = scriptSrcs.filter(src => !fs.existsSync(path.join(root, src)));
if (missingScripts.length) {
  issues.push(`缺少外部脚本: ${missingScripts.join(', ')}`);
} else {
  info.push(`所有 ${scriptSrcs.length} 个外部脚本文件都存在`);
}

// 5. Check function definitions vs HTML event handler calls
const funcDefs = [...html.matchAll(/(?:function|const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?:=\s*)?\(/g)].map(m => m[1]);
const windowFuncDefs = [...html.matchAll(/window\.([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*function/g)].map(m => m[1]);
const allFuncDefs = [...new Set([...funcDefs, ...windowFuncDefs])];
const funcDefSet = new Set(allFuncDefs);
const handlerCalls = [...html.matchAll(/(?:onclick|onchange|oninput|onload|onerror|onsubmit|onmouseover|onmouseout|onkeyup|onkeydown)\s*=\s*["']\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g)].map(m => m[1]);
const calledButNotDefined = [...new Set(handlerCalls)].filter(fn => !funcDefSet.has(fn) && fn.length > 1 && !['alert', 'confirm', 'prompt', 'if', 'for', 'while', 'return'].includes(fn));
if (calledButNotDefined.length) {
  warnings.push(`HTML 事件处理器中可能未定义的函数: ${calledButNotDefined.slice(0, 30).join(', ')}`);
} else {
  info.push('HTML 事件处理器引用的函数均已定义');
}

// 6. Check knowledge base keys used
const knowledgeKeys = [...html.matchAll(/showKnowledgeDetail\(['"]([^'"]+)['"]\)/g)].map(m => m[1]);
const uniqueKnowledgeKeys = [...new Set(knowledgeKeys)];
info.push(`知识库入口key数量: ${uniqueKnowledgeKeys.length}`);
info.push(`知识库keys: ${uniqueKnowledgeKeys.join(', ')}`);

// 7. Check for showKnowledgeDetail function
if (!funcDefSet.has('showKnowledgeDetail')) {
  issues.push('showKnowledgeDetail 函数未定义');
}

// 8. Check zhanbu sub-sections
const zhanbuSubs = ['yijing', 'qimen', 'ziwei', 'meihua', 'liuren'];
const zhanbuMissing = zhanbuSubs.filter(s => !html.includes(`id="section-${s}"`) && !html.includes(`showZhanbuSub('${s}'`));
if (zhanbuMissing.length) {
  issues.push(`占卜子模块缺失: ${zhanbuMissing.join(', ')}`);
}

// 9. Check xingming sub-sections
const xingmingSubs = ['rename', 'company', 'mobile'];
const xingmingMissing = xingmingSubs.filter(s => !html.includes(`id="section-${s}"`));
if (xingmingMissing.length) {
  issues.push(`姓名子模块缺失: ${xingmingMissing.join(', ')}`);
}

// 10. Check fengshui sub-sections
const fengshuiSubs = ['luopan', 'screenshot'];
const fengshuiMissing = fengshuiSubs.filter(s => !html.includes(`id="section-${s}"`));
if (fengshuiMissing.length) {
  issues.push(`风水子模块缺失: ${fengshuiMissing.join(', ')}`);
}

// 11. Check more sub-modules
const moreModules = ['knowledge', 'tizhi', 'faith', 'koujue', 'vip', 'shop'];
const moreMissing = moreModules.filter(m => !html.includes(`showMoreModule('${m}'`) && !html.includes(`showMoreModule("${m}"`));
if (moreMissing.length) {
  issues.push(`更多模块缺失: ${moreMissing.join(', ')}`);
}

// 12. Check important functions exist
const importantFunctions = [
  'getBaziCalcData', 'computeBazi', 'computeQimen', 'computeZiWei', 'computeMeiHua', 'computeLiuRen',
  'computeFengshui', 'computeFengshuiPro', 'computeBaZhai', 'computeXuanKong', 'jiuriShowDetail',
  'analyzeName', 'calculateWuge', 'computeRename', 'generateCompanyNames', 'analyzeMobile',
  'showSection', 'showZhanbuSub', 'showXingmingSub', 'toggleMore', 'showMoreModule', 'koujueSwitchCategory'
];
const missingImportant = importantFunctions.filter(fn => !funcDefSet.has(fn));
if (missingImportant.length) {
  issues.push(`重要函数缺失: ${missingImportant.join(', ')}`);
} else {
  info.push('所有重要函数均已定义');
}

// 13. Output
console.log('=== 易道智鉴 HTML 审计报告 ===\n');
console.log('【信息】');
info.forEach(i => console.log('  ' + i));
console.log('\n【问题】');
if (issues.length) issues.forEach(i => console.log('  ⚠️ ' + i));
else console.log('  未发现问题');
console.log('\n【警告】');
if (warnings.length) warnings.forEach(w => console.log('  ⚡ ' + w));
else console.log('  无警告');

// Save report
const report = {
  timestamp: new Date().toISOString(),
  info, issues, warnings,
  duplicateIds: duplicates.slice(0, 50),
  missingNavSections: missingSections,
  missingScripts,
  undefinedFunctions: calledButNotDefined.slice(0, 50),
  knowledgeKeys: uniqueKnowledgeKeys,
  missingImportantFunctions: missingImportant
};
fs.writeFileSync(path.join(root, 'qianyuan_audit_report.json'), JSON.stringify(report, null, 2));
console.log('\n审计报告已保存: qianyuan_audit_report.json');
