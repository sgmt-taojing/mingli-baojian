#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════
 *  命理宝鉴 · Bundle 预算校验脚本（节点 5.1）
 *  规范: docs/PERFORMANCE_BUDGET.md（节点 5.1 输出）
 *  退出码: 0 = PASS / 1 = FAIL
 *  用法: node scripts/bundle-budget-check.js [--strict]
 * ═══════════════════════════════════════════════════════════════
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const APP = path.join(ROOT, 'app');

// ─────────────────────────────────────────────────────────────
// 1. 预算定义（与 docs/PERFORMANCE_BUDGET.md 同步）
// ─────────────────────────────────────────────────────────────
const BUDGETS = {
  // 单文件上限
  html: {
    singleWarnKB: 500,
    singleFailKB: 800,
    totalWarnKB: 4500,
    totalFailKB: 6000
  },
  js: {
    singleWarnKB: 300,
    singleFailKB: 500,
    totalWarnKB: 4500,
    totalFailKB: 5500
  },
  css: {
    singleWarnKB: 50,
    singleFailKB: 100,
    totalWarnKB: 200,
    totalFailKB: 350
  },
  // 全局 app/ 目录
  total: {
    warnKB: 10000,
    failKB: 13000
  },
  // 关键页面（首屏必须 < 1.5s 网络传输）
  critical: [
    'index.html',
    'divination-integrated.html',
    'ai-assistant.html',
    'my-yuanzhu.html'
  ]
};

// ─────────────────────────────────────────────────────────────
// 2. 文件扫描
// ─────────────────────────────────────────────────────────────
function listFiles(dir, ext) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith(ext))
    .map(f => {
      const fullPath = path.join(dir, f);
      const stat = fs.statSync(fullPath);
      return { name: f, path: fullPath, kb: Math.round(stat.size / 1024) };
    });
}

function listAllFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  function walk(d) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
        walk(full);
      } else if (entry.isFile()) {
        const stat = fs.statSync(full);
        results.push({
          name: path.relative(APP, full),
          kb: Math.round(stat.size / 1024)
        });
      }
    }
  }
  walk(dir);
  return results;
}

// ─────────────────────────────────────────────────────────────
// 3. 评估
// ─────────────────────────────────────────────────────────────
function assess(value, warn, fail) {
  if (value >= fail) return 'FAIL';
  if (value >= warn) return 'WARN';
  return 'PASS';
}

const issues = [];
const stats = {
  html: { files: 0, totalKB: 0 },
  js: { files: 0, totalKB: 0 },
  css: { files: 0, totalKB: 0 },
  all: { files: 0, totalKB: 0 }
};

function checkFiles(files, type, budget) {
  const section = stats[type];
  let total = 0;
  const offenders = [];
  for (const f of files) {
    section.files++;
    section.totalKB += f.kb;
    total += f.kb;
    const single = assess(f.kb, budget.singleWarnKB, budget.singleFailKB);
    if (single !== 'PASS') {
      offenders.push({ name: f.name, kb: f.kb, level: single });
      issues.push({
        level: single,
        type,
        file: f.name,
        kb: f.kb,
        limit: single === 'FAIL' ? budget.singleFailKB : budget.singleWarnKB
      });
    }
  }
  const totalLevel = assess(total, budget.totalWarnKB, budget.totalFailKB);
  if (totalLevel !== 'PASS') {
    issues.push({
      level: totalLevel,
      type,
      scope: 'total',
      kb: total,
      limit: totalLevel === 'FAIL' ? budget.totalFailKB : budget.totalWarnKB
    });
  }
  return { total, totalLevel, offenders };
}

// ─────────────────────────────────────────────────────────────
// 4. 执行
// ─────────────────────────────────────────────────────────────
const htmlFiles = listFiles(APP, '.html');
const jsFiles = listFiles(path.join(APP, 'js'), '.js');
const cssFiles = listFiles(path.join(APP, 'css'), '.css')
  .concat(listFiles(APP, '.css'));

const htmlResult = checkFiles(htmlFiles, 'html', BUDGETS.html);
const jsResult = checkFiles(jsFiles, 'js', BUDGETS.js);
const cssResult = checkFiles(cssFiles, 'css', BUDGETS.css);

// 全局
const allFiles = listAllFiles(APP);
const allTotalKB = allFiles.reduce((sum, f) => sum + f.kb, 0);
stats.all.files = allFiles.length;
stats.all.totalKB = allTotalKB;
const allLevel = assess(allTotalKB, BUDGETS.total.warnKB, BUDGETS.total.failKB);
if (allLevel !== 'PASS') {
  issues.push({ level: allLevel, scope: 'app-total', kb: allTotalKB,
    limit: allLevel === 'FAIL' ? BUDGETS.total.failKB : BUDGETS.total.warnKB });
}

// 关键页校验
const criticalIssues = [];
for (const name of BUDGETS.critical) {
  const f = htmlFiles.find(x => x.name === name);
  if (!f) {
    criticalIssues.push({ name, status: 'NOT_FOUND' });
    continue;
  }
  // 关键页：单文件 < 300KB
  if (f.kb > 300) {
    criticalIssues.push({ name, kb: f.kb, status: 'FAIL', limit: 300 });
    issues.push({ level: 'FAIL', type: 'critical-html', file: name, kb: f.kb, limit: 300 });
  } else if (f.kb > 200) {
    criticalIssues.push({ name, kb: f.kb, status: 'WARN', limit: 200 });
  } else {
    criticalIssues.push({ name, kb: f.kb, status: 'PASS', limit: 200 });
  }
}

// ─────────────────────────────────────────────────────────────
// 5. 输出
// ─────────────────────────────────────────────────────────────
const strict = process.argv.includes('--strict');
const overallLevel = (() => {
  if (issues.some(i => i.level === 'FAIL')) return 'FAIL';
  if (strict && issues.some(i => i.level === 'WARN')) return 'FAIL';
  if (issues.some(i => i.level === 'WARN')) return 'WARN';
  return 'PASS';
})();

console.log('\n═══ 命理宝鉴 · Bundle 预算校验 ═══\n');
console.log(`总览: ${overallLevel}  |  HTML ${htmlFiles.length} 个 / ${htmlResult.total}KB  |  JS ${jsFiles.length} 个 / ${jsResult.total}KB  |  CSS ${cssFiles.length} 个 / ${cssResult.total}KB  |  全部 ${allFiles.length} 个 / ${allTotalKB}KB\n`);

// 各类预算
function section(title, result, type) {
  console.log(`${title}: ${result.totalLevel} (${result.total}KB)`);
  if (result.offenders.length > 0) {
    result.offenders
      .sort((a, b) => b.kb - a.kb)
      .slice(0, 5)
      .forEach(o => console.log(`  [${o.level}] ${o.name}  ${o.kb}KB`));
  }
  console.log();
}
section('HTML', htmlResult, 'html');
section('JS',   jsResult, 'js');
section('CSS',  cssResult, 'css');

// 关键页
console.log('关键页:');
criticalIssues.forEach(c => {
  if (c.status === 'NOT_FOUND') {
    console.log(`  ❓ ${c.name}  (NOT_FOUND)`);
  } else {
    const icon = c.status === 'PASS' ? '✅' : c.status === 'WARN' ? '⚠️ ' : '❌';
    console.log(`  ${icon} ${c.name.padEnd(36)} ${c.kb}KB / ${c.limit}KB  (${c.status})`);
  }
});
console.log();

// 完整排行
console.log('TOP 10 最大文件:');
allFiles
  .sort((a, b) => b.kb - a.kb)
  .slice(0, 10)
  .forEach(f => console.log(`  ${f.kb.toString().padStart(6)}KB  ${f.name}`));
console.log();

// 建议
if (overallLevel !== 'PASS') {
  console.log('═══ 修复建议 ═══');
  const htmlOvers = htmlFiles.filter(f => f.kb > BUDGETS.html.singleWarnKB);
  if (htmlOvers.length > 0) {
    console.log(`  HTML 大于 ${BUDGETS.html.singleWarnKB}KB: ${htmlOvers.length} 个`);
    console.log('    措施: 抽出内联 JS 到独立文件 / 拆分子页面 / 启用 gzip');
  }
  const jsOvers = jsFiles.filter(f => f.kb > BUDGETS.js.singleWarnKB);
  if (jsOvers.length > 0) {
    console.log(`  JS 大于 ${BUDGETS.js.singleWarnKB}KB: ${jsOvers.length} 个`);
    console.log('    措施: 代码分割 + 按需加载 + tree-shaking');
  }
  if (allTotalKB > BUDGETS.total.warnKB) {
    console.log(`  app/ 总计 ${allTotalKB}KB 超 ${BUDGETS.total.warnKB}KB`);
    console.log('    措施: 分页静态资源 + CDN 分发 + 图片压缩');
  }
  console.log();
}

process.exit(overallLevel === 'FAIL' ? 1 : 0);