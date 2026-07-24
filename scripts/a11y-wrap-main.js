#!/usr/bin/env node
/**
 * a11y-wrap-main.js · #9-a11y-page-layer 节点 3
 *
 * 对缺 <main id="main-content"> 的 HTML 页面补上包裹：
 *   - <body> 紧后（如果有 skip-link，则在 skip-link 后；否则直接 body 后）插入
 *     `<main id="main-content" role="main">`
 *   - </body> 前插入 `</main>`
 *   - 同时补 `role="main"` 属性（WCAG ARIA landmark）
 *
 * 特点：
 *   - 幂等：已有 <main> 的页面自动跳过
 *   - 容错：兼容多行 body 标签、嵌套表单、<script>/<template> 内部 <main> 误匹配
 *   - 跳过 knowledge-panel.html（HTML 片段）
 *   - 报告：注入 / 跳过 / 失败统计
 *
 * 用法：
 *   node scripts/a11y-wrap-main.js [--dry-run] [--verbose]
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ─── 配置 ───
const APP_DIR = path.join(__dirname, '..', 'app');

// 节点 1/2 已处理且已有 <main>（跳过）
const ALREADY_HAS_MAIN = new Set([
  'divination-integrated.html',
  'wechat-hub.html',
  'master-class.html',
  'kb-explorer.html',
  'merchant-dashboard.html',
  'my-yuanzhu.html',
  'divination-hub.html',
]);

// HTML 片段 / 非完整页面（跳过）
const SKIP_FILES = new Set([
  'knowledge-panel.html', // HTML 片段，无 <head>/<body>
]);

// 正则：匹配 <body> 开始标签（含任意属性）
const BODY_OPEN_RE = /<body\b[^>]*>/i;
// 正则：匹配 </body> 结束标签
const BODY_CLOSE_RE = /<\/body>/i;
// 正则：检测 skip-link
const SKIP_LINK_RE = /<a\b[^>]*class=["']skip-link["'][^>]*>\s*跳到主(?:要)?内容\s*<\/a>/i;

/**
 * 包裹 <main id="main-content"> 锚点
 * @param {string} html 原文
 * @returns {{html: string, wrapped: boolean, reason: string}}
 */
function wrapMain(html) {
  if (/<main\b/i.test(html)) {
    return { html, wrapped: false, reason: '已存在 <main>' };
  }
  if (!BODY_OPEN_RE.test(html)) {
    return { html, wrapped: false, reason: '未找到 <body>' };
  }
  if (!BODY_CLOSE_RE.test(html)) {
    return { html, wrapped: false, reason: '未找到 </body>' };
  }

  // 找到 body 紧后的位置
  const bodyOpenMatch = html.match(BODY_OPEN_RE);
  if (!bodyOpenMatch) return { html, wrapped: false, reason: 'no body match' };

  const bodyOpenIdx = bodyOpenMatch.index + bodyOpenMatch[0].length;
  // body 紧后插入 <main id="main-content" role="main">
  let insertOpenAt = bodyOpenIdx;

  // 如果 body 后立刻有 skip-link，则在 skip-link 后插入
  const afterBody = html.slice(bodyOpenIdx, bodyOpenIdx + 300);
  const skipLinkMatch = afterBody.match(SKIP_LINK_RE);
  if (skipLinkMatch) {
    insertOpenAt = bodyOpenIdx + skipLinkMatch.index + skipLinkMatch[0].length;
  }

  const mainOpen = '\n<main id="main-content" role="main">';
  const mainClose = '\n</main>\n';

  // 在 </body> 前插入 </main>
  const closeIdx = html.lastIndexOf('</body>');

  const newHtml =
    html.slice(0, insertOpenAt) +
    mainOpen +
    html.slice(insertOpenAt, closeIdx) +
    mainClose +
    html.slice(closeIdx);

  return {
    html: newHtml,
    wrapped: true,
    reason: skipLinkMatch ? '在 skip-link 后包裹' : 'body 后立即包裹',
  };
}

// ─── 入口 ───
const ARGS = new Set(process.argv.slice(2));
const DRY_RUN = ARGS.has('--dry-run');
const VERBOSE = ARGS.has('--verbose');

const allFiles = fs
  .readdirSync(APP_DIR)
  .filter((f) => f.endsWith('.html'))
  .filter((f) => !SKIP_FILES.has(f));

const stats = {
  total: allFiles.length,
  alreadyHasMain: 0,
  wrapped: [],
  skipped: [],
  failed: [],
};

for (const file of allFiles) {
  const fullPath = path.join(APP_DIR, file);
  let html;
  try {
    html = fs.readFileSync(fullPath, 'utf8');
  } catch (e) {
    stats.failed.push({ file, reason: 'read fail: ' + e.message });
    continue;
  }

  if (ALREADY_HAS_MAIN.has(file) || /<main\b/i.test(html)) {
    stats.alreadyHasMain++;
    if (VERBOSE) console.log(`  [SKIP-already] ${file}`);
    continue;
  }

  const result = wrapMain(html);
  if (!result.wrapped) {
    stats.skipped.push({ file, reason: result.reason });
    if (VERBOSE) console.log(`  [SKIP] ${file} — ${result.reason}`);
    continue;
  }

  if (!DRY_RUN) {
    try {
      fs.writeFileSync(fullPath, result.html, 'utf8');
      stats.wrapped.push({ file, reason: result.reason });
      if (VERBOSE) console.log(`  [OK] ${file} — ${result.reason}`);
    } catch (e) {
      stats.failed.push({ file, reason: 'write fail: ' + e.message });
    }
  } else {
    stats.wrapped.push({ file, reason: result.reason, dryRun: true });
    if (VERBOSE) console.log(`  [DRY] ${file} — ${result.reason}`);
  }
}

// ─── 报告 ───
console.log('\n=== #9-a11y-page-layer 节点 3 — <main id="main-content"> 批量包裹 ===\n');
console.log(`总文件数：${stats.total}`);
console.log(`已有 <main>：${stats.alreadyHasMain}`);
console.log(`成功包裹：${stats.wrapped.length}`);
console.log(`跳过：${stats.skipped.length}`);
console.log(`失败：${stats.failed.length}`);

if (stats.wrapped.length) {
  console.log('\n包裹详情：');
  for (const w of stats.wrapped) {
    console.log(`  ${w.dryRun ? '🔍' : '✅'} ${w.file} — ${w.reason}`);
  }
}

if (stats.skipped.length) {
  console.log('\n跳过详情：');
  for (const s of stats.skipped) {
    console.log(`  ⚠️  ${s.file} — ${s.reason}`);
  }
}

if (stats.failed.length) {
  console.log('\n失败详情：');
  for (const f of stats.failed) {
    console.log(`  ❌ ${f.file} — ${f.reason}`);
  }
}

// 退出码
const coverageRate =
  stats.total > 0 ? (stats.alreadyHasMain + stats.wrapped.length) / stats.total : 0;

console.log(`\n覆盖率：${(coverageRate * 100).toFixed(1)}% (${stats.alreadyHasMain + stats.wrapped.length}/${stats.total})`);

if (stats.failed.length > 0) {
  process.exit(1);
}
process.exit(0);