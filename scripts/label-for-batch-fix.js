#!/usr/bin/env node
/**
 * P3-17.5a · label[for] 批量补全脚本
 *
 * 算法（同 PoC 验证版）：
 *   对每个没有 for 属性的 <label>：</ *   1. 找到 </label> 后 500 字符内的第一个 <input|select|textarea>
 *   2. 提取其 id 属性
 *   3. 追加 for="id" 到 label 开始标签
 *   4. 如果没有紧邻 input 或 input 无 id，跳过
 *
 * 用法：
 *   node scripts/label-for-batch-fix.js [file1] [file2] ...
 *   不传参数 → 扫描 app/*.html 全部
 *
 * 选项：
 *   --dry-run   只报告不写文件
 *   --verbose   输出每处修改详情
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const verbose = args.includes('--verbose');
const files = args.filter(a => !a.startsWith('--'));

const APP_DIR = path.join(__dirname, '..', 'app');

// 目标文件列表（排除已做 PoC 的 divination-shop / admin-shop / index redirect / knowledge-panel fragment）
const SKIP_FILES = new Set([
  'index.html',           // redirect
  'knowledge-panel.html', // fragment
  'divination-shop.html', // PoC 已完成
  'admin-shop.html',      // PoC 已完成
]);

function getTargetFiles() {
  if (files.length > 0) return files;
  const all = fs.readdirSync(APP_DIR).filter(f => f.endsWith('.html'));
  return all.filter(f => !SKIP_FILES.has(f)).map(f => path.join(APP_DIR, f));
}

/**
 * 在 HTML 内容中补全 label[for]
 * @returns {{ fixed: number, skipped: number, details: Array }}
 */
function fixLabelFor(html) {
  let fixed = 0;
  let skipped = 0;
  const details = [];

  // 匹配没有 for= 属性的 <label ...>...</label>
  const labelRegex = /<label(\s[^>]*)?>([\s\S]*?)<\/label>/gi;

  const result = html.replace(labelRegex, (fullMatch, attrs, inner) => {
    // 已有 for 属性 → 跳过
    if (attrs && /\bfor\s*=/i.test(attrs)) {
      return fullMatch;
    }

    // 在 </label> 后 500 字符内找第一个 input/select/textarea
    const afterLabel = html.slice(html.indexOf(fullMatch) + fullMatch.length, html.indexOf(fullMatch) + fullMatch.length + 500);
    const inputMatch = afterLabel.match(/<(input|select|textarea)\b[^>]*\bid\s*=\s*["']([^"']+)["'][^>]*>/i);

    if (!inputMatch) {
      // 尝试反向：label 内部包含 input
      const innerInput = inner.match(/<(input|select|textarea)\b[^>]*\bid\s*=\s*["']([^"']+)["'][^>]*>/i);
      if (!innerInput) {
        skipped++;
        if (verbose) details.push({ action: 'skip-no-input', label: inner.trim().slice(0, 40) });
        return fullMatch;
      }
      // label 包裹 input 的情况 → 也绑 for
      const id = innerInput[2];
      const newAttrs = (attrs || '') + ` for="${id}"`;
      fixed++;
      if (verbose) details.push({ action: 'fix-inner', id, label: inner.trim().slice(0, 40) });
      return `<label${newAttrs}>${inner}</label>`;
    }

    const id = inputMatch[2];
    const newAttrs = (attrs || '') + ` for="${id}"`;
    fixed++;
    if (verbose) details.push({ action: 'fix-adjacent', id, label: inner.trim().slice(0, 40) });
    return `<label${newAttrs}>${inner}</label>`;
  });

  return { fixed, skipped, details, result };
}

// Main
const targetFiles = getTargetFiles();
let totalFixed = 0;
let totalSkipped = 0;
const summary = [];

console.log(`\n📋 P3-17.5a label[for] 批量补全`);
console.log(`${dryRun ? '🔍 DRY RUN' : '✏️  WRITE'} | ${targetFiles.length} 文件\n`);

for (const filePath of targetFiles) {
  const absPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
  const relPath = path.relative(process.cwd(), absPath);

  if (!fs.existsSync(absPath)) {
    console.log(`⚠️  ${relPath} — 文件不存在`);
    continue;
  }

  const html = fs.readFileSync(absPath, 'utf8');

  // 统计修复前
  const beforeLabels = (html.match(/<label\b/gi) || []).length;
  const beforeFor = (html.match(/<label[^>]+\bfor\s*=/gi) || []).length;

  if (beforeLabels === 0) {
    console.log(`⏭  ${relPath} — 0 label，跳过`);
    continue;
  }

  const { fixed, skipped, details, result } = fixLabelFor(html);

  if (fixed > 0 && !dryRun) {
    fs.writeFileSync(absPath, result, 'utf8');
  }

  const afterFor = beforeFor + fixed;
  totalFixed += fixed;
  totalSkipped += skipped;

  console.log(`${fixed > 0 ? '✅' : '⏭'} ${relPath} — label ${beforeLabels} | had-for ${beforeFor} | +fixed ${fixed} | skipped ${skipped} | now-for ${afterFor}/${beforeLabels}`);

  if (verbose && details.length > 0) {
    for (const d of details.filter(x => x.action.startsWith('fix'))) {
      console.log(`   → for="${d.id}" ← ${d.label}`);
    }
  }

  summary.push({ file: relPath, labels: beforeLabels, hadFor: beforeFor, fixed, skipped });
}

console.log(`\n📊 汇总：${totalFixed} 个 label[for] 补全 | ${totalSkipped} 个跳过 | ${summary.filter(s => s.fixed > 0).length}/${targetFiles.length} 文件有修改`);

if (dryRun) {
  console.log('🔍 dry-run 模式 — 未写入文件。去掉 --dry-run 执行实际修改。');
}
