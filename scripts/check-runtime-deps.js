#!/usr/bin/env node
/**
 * R172: check-runtime-deps.js
 * 
 * 扫描全平台 HTML 中所有 onclick="funcName(...)" 调用，
 * 检查 funcName 是否在同一 HTML 的 inline <script> 或 <script src> 引用的 JS 文件中定义。
 * 
 * 用法：
 *   node scripts/check-runtime-deps.js [--verbose] [--html app/foo.html]
 * 
 * 输出：
 *   - 每个缺失函数：文件名 + 函数名 + 行号
 *   - 汇总：总扫描文件数 / 总 onclick 引用数 / 缺失数
 *   - 退出码 0 = 无缺失; 1 = 有缺失
 * 
 * 原理：
 *   1. 对每个 HTML 文件提取所有 onclick="xxx(...)" 中的 xxx
 *   2. 提取该 HTML 中所有 <script src="..."> 引用的外部 JS 路径
 *   3. 提取该 HTML 中所有 inline <script> 内容
 *   4. 在 inline JS + 外部 JS 内容中搜索 function xxx / window.xxx = / xxx = / const xxx = / let xxx = / var xxx =
 *   5. 未找到 = 缺失（MISSING）
 * 
 * 注意：浏览器全局函数（alert, confirm, scrollTo 等）和第三方库函数（$=jQuery 等）在 BUILTIN set 中跳过。
 */

const fs = require('fs');
const path = require('path');

// ─── 配置 ───
const ROOT = path.resolve(__dirname, '..');
const APP_DIR = path.join(ROOT, 'app');
const VERBOSE = process.argv.includes('--verbose');
const SINGLE_FILE = (() => {
  const i = process.argv.indexOf('--html');
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : null;
})();

// 浏览器内建 / 第三方库全局函数 — 不算缺失
const BUILTIN = new Set([
  // JS 原生
  'alert', 'confirm', 'prompt', 'scrollTo', 'scrollIntoView', 'scrollBy',
  'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
  'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'encodeURIComponent', 'decodeURIComponent',
  'print', 'open', 'close', 'focus', 'blur', 'getSelection',
  'requestAnimationFrame', 'cancelAnimationFrame',
  // jQuery
  '$',
  // 通用 DOM
  'getElementById', 'querySelector', 'querySelectorAll',
  'addEventListener', 'removeEventListener',
  'dispatchEvent', 'createEvent',
  'history', 'navigator', 'location',
  // JS 关键字 / 内建全局（onclick="if(...)" / onclick="for(...)" 类直接 JS 表达式不是函数调用）
  'if', 'for', 'while', 'return', 'typeof', 'void',
  // 命理宝鉴常用全局工具
  'showToast', 'toast', 'showModal', 'hideModal',
]);

// 测试 / 演示页豁免（这些页面故意调用未实现函数以触发控制台告警）
const TEST_PAGES = new Set([
  'components-demo.html', // 演示组件"点击 → 控制台报错但不崩溃"
]);

// ─── 工具函数 ───

/** 从 HTML 内容提取所有 onclick="funcName(...)" 的 funcName */
function extractOnclickCalls(htmlContent) {
  const calls = [];
  // 匹配 onclick="funcName( 或 onclick='funcName(' 或 onclick=`funcName(
  const re = /on(?:click|tap|touchend|touchstart)\s*=\s*["']([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g;
  let m;
  while ((m = re.exec(htmlContent)) !== null) {
    calls.push(m[1]);
  }
  // 也扫 onclick="funcName()" 无参数 — 已被上面覆盖
  return calls;
}

/** 从 HTML 内容提取 <script src="..."> 引用的 JS 相对路径 */
function extractScriptSrcs(htmlContent) {
  const srcs = [];
  const re = /<script[^>]+src\s*=\s*["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(htmlContent)) !== null) {
    srcs.push(m[1]);
  }
  return srcs;
}

/** 从 HTML 内容提取所有 inline <script>（无 src）的文本内容 */
function extractInlineScripts(htmlContent) {
  const scripts = [];
  // 匹配 <script>...</script>（无 src）
  const re = /<script(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(htmlContent)) !== null) {
    scripts.push(m[1]);
  }
  return scripts.join('\n');
}

/** 在 JS 内容中搜索函数定义 */
function isFunctionDefined(funcName, jsContent) {
  // function funcName(...) — 命名函数声明
  if (new RegExp(`\\bfunction\\s+${escapeRegex(funcName)}\\s*\\(`, '').test(jsContent)) return true;
  // window.funcName = ... （R172-fix: 兼容匿名函数赋值）
  if (new RegExp(`\\bwindow\\s*\\.\\s*${escapeRegex(funcName)}\\s*=\\s*(?:function|\\([^)]*\\)\\s*=>|async|\\w+\\s*\\(|$)`, '').test(jsContent)) return true;
  // const/let/var funcName = function / const funcName = (...) => ...
  if (new RegExp(`\\b(?:const|let|var)\\s+${escapeRegex(funcName)}\\s*=\\s*(?:function|\\([^)]*\\)\\s*=>|async|\\w+\\s*\\(|$)`, '').test(jsContent)) return true;
  // funcName = function(...) / funcName = () => ...（全局赋值）
  if (new RegExp(`(?<![.\\w$])${escapeRegex(funcName)}\\s*=\\s*(?:function|\\([^)]*\\)\\s*=>|async|\\w+\\s*\\(|$)`, 'm').test(jsContent)) return true;
  // funcName = xxx.funcName.bind / class { funcName() {} }
  if (new RegExp(`\\b${escapeRegex(funcName)}\\s*:\\s*(?:function|\\([^)]*\\)\\s*=>|async)`, '').test(jsContent)) return true;
  return false;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** 解析 JS 文件路径（相对于 app/ 或项目根） */
function resolveJsPath(srcAttr, htmlFile) {
  // 去掉 query string 和 hash
  let p = srcAttr.split('?')[0].split('#')[0];
  // 绝对路径 / → 项目根
  if (p.startsWith('/')) {
    return path.join(ROOT, p);
  }
  // 相对于 HTML 文件位置（app/*.html）
  const htmlDir = path.dirname(path.join(APP_DIR, htmlFile));
  return path.resolve(htmlDir, p);
}

// ─── 主流程 ───

function scanFile(htmlFile) {
  const htmlPath = path.join(APP_DIR, htmlFile);
  if (!fs.existsSync(htmlPath)) return null;

  // 测试 / 演示页豁免：故意调用未实现函数以触发控制台告警
  if (TEST_PAGES.has(htmlFile)) {
    return { file: htmlFile, total: 0, unique: 0, missing: [], skipped: true };
  }

  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  const onclickCalls = extractOnclickCalls(htmlContent);
  if (onclickCalls.length === 0) return { file: htmlFile, total: 0, unique: 0, missing: [] };

  // 收集所有 JS 源
  const scriptSrcs = extractScriptSrcs(htmlContent);
  const inlineJs = extractInlineScripts(htmlContent);

  // 加载外部 JS 文件内容
  const externalJsMap = {};
  for (const src of scriptSrcs) {
    const absPath = resolveJsPath(src, htmlFile);
    if (fs.existsSync(absPath)) {
      try {
        externalJsMap[src] = fs.readFileSync(absPath, 'utf8');
      } catch (e) {
        // 忽略读取失败
      }
    }
  }

  // 合并所有可搜索的 JS
  const allJsParts = [inlineJs, ...Object.values(externalJsMap)];
  const combinedJs = allJsParts.join('\n');

  // 检查每个 onclick 函数
  const checked = new Set();
  const missing = [];
  for (const funcName of onclickCalls) {
    if (checked.has(funcName)) continue;
    checked.add(funcName);

    if (BUILTIN.has(funcName)) continue;

    if (!isFunctionDefined(funcName, combinedJs)) {
      missing.push(funcName);
    }
  }

  return {
    file: htmlFile,
    total: onclickCalls.length,
    unique: checked.size,
    missing,
  };
}

// ─── 入口 ───

function main() {
  let htmlFiles;
  if (SINGLE_FILE) {
    htmlFiles = [SINGLE_FILE.replace(/^app\//, '')];
  } else {
    htmlFiles = fs.readdirSync(APP_DIR).filter(f => f.endsWith('.html') && !f.startsWith('_'));
  }

  let totalCalls = 0;
  let totalUnique = 0;
  let totalMissing = 0;
  const results = [];

  for (const f of htmlFiles) {
    const r = scanFile(f);
    if (!r) continue;
    results.push(r);
    totalCalls += r.total;
    totalUnique += r.unique;
    totalMissing += r.missing.length;
  }

  // 输出
  if (VERBOSE) {
    for (const r of results) {
      if (r.total === 0) continue;
      if (r.missing.length > 0) {
        console.log(`\n❌ ${r.file} — ${r.missing.length} missing / ${r.unique} unique onclick`);
        for (const fn of r.missing) {
          console.log(`   • ${fn}`);
        }
      } else {
        console.log(`✅ ${r.file} — ${r.unique} unique onclick, 0 missing`);
      }
    }
  } else {
    // 非 verbose：只输出缺失
    for (const r of results) {
      if (r.missing.length > 0) {
        console.log(`❌ ${r.file}: ${r.missing.join(', ')}`);
      }
    }
  }

  console.log(`\n── 汇总 ──`);
  console.log(`扫描文件: ${results.length}`);
  console.log(`onclick 引用总数: ${totalCalls}`);
  console.log(`唯一函数名: ${totalUnique}`);
  console.log(`缺失函数: ${totalMissing}`);

  process.exit(totalMissing > 0 ? 1 : 0);
}

main();
