#!/usr/bin/env node
/**
 * a11y-batch-inject.js · #9-a11y-page-layer 节点 2
 *
 * 对剩余 46 个 HTML 文件批量注入无障碍基础设施：
 *   1. <head> 末尾 → <link rel="stylesheet" href="css/a11y-fix.css">
 *   2. <body> 标签后 → <a class="skip-link" href="#main-content">跳到主内容</a>
 *   3. </body> 前 → <script src="js/a11y-divination-hub.js" defer></script>
 *
 * 特点：
 *   - 幂等：已注入的文件自动跳过
 *   - 正则容错：兼容 </style></head><body> 连写、多行 <body ...> 属性等
 *   - 安全：不动 onclick、不改业务逻辑、仅做 head/body 边界插入
 *   - 报告：输出注入 / 跳过 / 失败统计表
 *
 * 用法：
 *   node scripts/a11y-batch-inject.js [--dry-run] [--verbose]
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ─── 配置 ───
const APP_DIR = path.join(__dirname, '..', 'app');

// 节点 1 已处理的 12 页（跳过，不重复注入）
const SKIP_FILES = new Set([
  'admin.html',
  'ai-assistant.html',
  'divination-hub.html',
  'divination-integrated.html',
  'divination-membership.html',
  'kb-explorer.html',
  'login.html',
  'master-class.html',
  'merchant-dashboard.html',
  'my-yuanzhu.html',
  'tcm-clinic.html',
  'wechat-hub.html',
]);

// 待处理的 46 页
const TARGET_FILES = [
  'admin-glass-dashboard', 'admin-kb-batch', 'admin-kb-panel', 'admin-shop',
  'clear-cache', 'components-demo', 'disclaimer', 'divination-almanac',
  'divination-knowledge', 'divination-shop', 'divination-tools', 'doctor-elder',
  'export-guard', 'fengshui', 'glass-console', 'glass-history',
  'health-career-dashboard', 'im', 'index', 'kb-explore-submit',
  'knowledge-panel', 'koujue-gallery', 'lifeindex-detail', 'lifeplan-detail',
  'master-archive', 'master-disease', 'master-elder', 'master-zidise-illness',
  'merchant-apply', 'merit-system', 'monitor-dashboard', 'more-functions',
  'nihaisha-knowledge', 'nihaisha-learning', 'nihaisha-tool', 'report-config',
  'report-sample-bazi', 'shuhan-knowledge', 'tcm-symptom', 'test-parse-natural',
  'wechat-disclaimer', 'wechat-h5', 'yijing-oracle', 'yijing-qimen',
  'youthplan-detail', 'yuanzhu-inbox',
].map(name => `${name}.html`);

// 注入片段
const CSS_LINK = '<link rel="stylesheet" href="css/a11y-fix.css">';
const SKIP_LINK = '<a class="skip-link" href="#main-content">跳到主内容</a>';
const JS_SCRIPT = '<script src="js/a11y-divination-hub.js" defer></script>';

// ─── 标记常量（用于幂等检测）───
const CSS_MARKER = 'css/a11y-fix.css';
const SKIP_MARKER = 'class="skip-link"';
const JS_MARKER = 'js/a11y-divination-hub.js';

// ─── CLI 参数 ───
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const VERBOSE = args.includes('--verbose');

// ─── 统计 ───
const stats = {
  injected: [],   // 成功注入（至少一项）
  skipped: [],    // 已全部注入，跳过
  partial: [],    // 部分注入
  failed: [],     // 无 head/body，无法注入
  totalInjections: 0,
};

// ─── 正则：容错匹配 ───

// </head> 匹配（兼容 </style></head> 连写、多行）
const HEAD_CLOSE_RE = /<\/head>/i;

// <body ...> 匹配（兼容 <body>、<body class="...">、</style></head><body> 连写）
const BODY_OPEN_RE = /<body[^>]*>/i;

// </body> 匹配
const BODY_CLOSE_RE = /<\/body>/i;

/**
 * 注入 CSS link 到 </head> 前
 * @param {string} html - 原始 HTML
 * @returns {{html: string, injected: boolean, reason: string}}
 */
function injectCSS(html) {
  if (html.includes(CSS_MARKER)) {
    return { html, injected: false, reason: '已存在' };
  }
  const match = HEAD_CLOSE_RE.exec(html);
  if (!match) {
    return { html, injected: false, reason: '未找到 </head>' };
  }
  const idx = match.index;
  const before = html.substring(0, idx);
  const after = html.substring(idx);
  // 保持缩进格式
  const insertion = `  ${CSS_LINK}\n`;
  return {
    html: before + insertion + after,
    injected: true,
    reason: 'OK',
  };
}

/**
 * 注入 skip-link 到 <body> 标签后
 * @param {string} html - 原始 HTML
 * @returns {{html: string, injected: boolean, reason: string}}
 */
function injectSkipLink(html) {
  if (html.includes(SKIP_MARKER)) {
    return { html, injected: false, reason: '已存在' };
  }
  const match = BODY_OPEN_RE.exec(html);
  if (!match) {
    return { html, injected: false, reason: '未找到 <body>' };
  }
  const endIdx = match.index + match[0].length;
  const before = html.substring(0, endIdx);
  const after = html.substring(endIdx);
  const insertion = `\n  ${SKIP_LINK}`;
  return {
    html: before + insertion + after,
    injected: true,
    reason: 'OK',
  };
}

/**
 * 注入 JS script 到 </body> 前
 * @param {string} html - 原始 HTML
 * @returns {{html: string, injected: boolean, reason: string}}
 */
function injectJS(html) {
  if (html.includes(JS_MARKER)) {
    return { html, injected: false, reason: '已存在' };
  }
  const match = BODY_CLOSE_RE.exec(html);
  if (!match) {
    return { html, injected: false, reason: '未找到 </body>' };
  }
  const idx = match.index;
  const before = html.substring(0, idx);
  const after = html.substring(idx);
  const insertion = `  ${JS_SCRIPT}\n  `;
  return {
    html: before + insertion + after,
    injected: true,
    reason: 'OK',
  };
}

/**
 * 处理单个文件
 */
function processFile(filename) {
  const filepath = path.join(APP_DIR, filename);
  if (!fs.existsSync(filepath)) {
    stats.failed.push({ file: filename, reason: '文件不存在' });
    return;
  }

  let html = fs.readFileSync(filepath, 'utf8');
  const results = [];

  // 执行三项注入
  const cssResult = injectCSS(html);
  html = cssResult.html;
  results.push({ type: 'CSS', ...cssResult });

  const skipResult = injectSkipLink(html);
  html = skipResult.html;
  results.push({ type: 'SkipLink', ...skipResult });

  const jsResult = injectJS(html);
  html = jsResult.html;
  results.push({ type: 'JS', ...jsResult });

  const injectedCount = results.filter(r => r.injected).length;

  if (injectedCount === 0) {
    // 检查是否因为已存在
    const allExist = results.every(r => r.reason === '已存在');
    if (allExist) {
      stats.skipped.push({ file: filename });
    } else {
      // 有失败原因
      const reasons = results.filter(r => r.reason !== '已存在').map(r => `${r.type}: ${r.reason}`);
      stats.failed.push({ file: filename, reason: reasons.join('; ') });
    }
  } else if (injectedCount < 3) {
    // 部分注入
    const details = results.map(r => `${r.type}=${r.injected ? '✓' : '✗(' + r.reason + ')'}`).join(' ');
    stats.partial.push({ file: filename, details, injectedCount });
    if (!DRY_RUN) {
      fs.writeFileSync(filepath, html, 'utf8');
    }
    stats.totalInjections += injectedCount;
  } else {
    // 全部注入成功
    stats.injected.push({ file: filename, count: injectedCount });
    if (!DRY_RUN) {
      fs.writeFileSync(filepath, html, 'utf8');
    }
    stats.totalInjections += injectedCount;
  }

  if (VERBOSE) {
    const status = injectedCount === 3 ? '✓✓✓' : injectedCount > 0 ? `partial(${injectedCount}/3)` : 'SKIP';
    console.log(`  [${status}] ${filename}`);
    results.forEach(r => {
      if (VERBOSE) console.log(`    ${r.type}: ${r.injected ? '✓ injected' : '✗ ' + r.reason}`);
    });
  }
}

// ─── 主流程 ───
function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  a11y-batch-inject.js · #9-a11y-page-layer 节点 2');
  console.log('  批量 ARIA 注入脚本（剩余 46 页）');
  console.log('═══════════════════════════════════════════════════');
  console.log();

  // 前置检查：确认 a11y-fix.css 和 a11y-divination-hub.js 存在
  const cssPath = path.join(APP_DIR, 'css', 'a11y-fix.css');
  const jsPath = path.join(APP_DIR, 'js', 'a11y-divination-hub.js');
  if (!fs.existsSync(cssPath)) {
    console.error('❌ app/css/a11y-fix.css 不存在，终止。');
    process.exit(1);
  }
  if (!fs.existsSync(jsPath)) {
    console.error('❌ app/js/a11y-divination-hub.js 不存在，终止。');
    process.exit(1);
  }
  console.log(`✅ 前置检查通过：a11y-fix.css (${fs.statSync(cssPath).size}B) + a11y-divination-hub.js (${fs.statSync(jsPath).size}B)`);
  console.log();

  // 确认不处理已完成的 12 页
  console.log(`ℹ️  跳过节点 1 已处理 ${SKIP_FILES.size} 页：${[...SKIP_FILES].join(', ')}`);
  console.log();

  if (DRY_RUN) {
    console.log('⚠️  DRY-RUN 模式：不写入文件\n');
  }

  console.log(`📋 待处理：${TARGET_FILES.length} 个文件\n`);

  // 逐文件处理
  TARGET_FILES.forEach(processFile);

  // 统计报告
  console.log();
  console.log('═══════════════════════════════════════════════════');
  console.log('  执行结果统计');
  console.log('═══════════════════════════════════════════════════');
  console.log();

  const total = TARGET_FILES.length;
  const ok = stats.injected.length;
  const partial = stats.partial.length;
  const skipped = stats.skipped.length;
  const failed = stats.failed.length;

  console.log(`  总文件数:     ${total}`);
  console.log(`  全量注入(3/3): ${ok}`);
  console.log(`  部分注入:     ${partial}`);
  console.log(`  已存在跳过:   ${skipped}`);
  console.log(`  失败/异常:    ${failed}`);
  console.log(`  总注入次数:   ${stats.totalInjections}`);
  console.log();

  // 成功率计算（成功+跳过 视为成功）
  const successRate = total > 0 ? ((ok + partial + skipped) / total * 100).toFixed(1) : '0.0';
  console.log(`  注入覆盖率:   ${successRate}% (${ok + partial + skipped}/${total})`);
  console.log();

  // 明细：部分注入
  if (stats.partial.length > 0) {
    console.log('─── 部分注入明细 ───');
    stats.partial.forEach(p => {
      console.log(`  ⚠️  ${p.file} (${p.injectedCount}/3): ${p.details}`);
    });
    console.log();
  }

  // 明细：失败
  if (stats.failed.length > 0) {
    console.log('─── 失败/跳过明细 ───');
    stats.failed.forEach(f => {
      console.log(`  ❌ ${f.file}: ${f.reason}`);
    });
    console.log();
  }

  // 注入成功列表（verbose 才逐行显示）
  if (VERBOSE && stats.injected.length > 0) {
    console.log('─── 全量注入成功 ───');
    stats.injected.forEach(p => {
      console.log(`  ✅ ${p.file} (${p.count}/3)`);
    });
    console.log();
  }

  // 退出码：覆盖率 ≥ 95% 视为成功
  const threshold = 95.0;
  const passed = parseFloat(successRate) >= threshold;
  console.log(passed ? `✅ 覆盖率 ${successRate}% ≥ ${threshold}% — 通过` : `❌ 覆盖率 ${successRate}% < ${threshold}% — 需检查`);
  process.exit(passed ? 0 : 1);
}

main();
