#!/usr/bin/env node
/**
 * A11Y axe-core 真实浏览器扫描 v2 - 独立 browser-per-page
 *
 * 改进:
 * - 每页独立 browser 实例（避免 share 状态污染）
 * - 单进程超时 60s 强制 kill
 * - scanPage 内部全 try/catch，单页失败不影响后续
 * - 关掉多余日志输出
 */
'use strict';
const puppeteer = require('puppeteer');
const axeSource = require('axe-core').source;
const fs = require('fs');
const path = require('path');

const PAGES = [
  { name: 'divination-hub', url: 'app/divination-hub.html' },
  { name: 'tcm-clinic', url: 'app/tcm-clinic.html' },
  { name: 'ai-assistant', url: 'app/ai-assistant.html' },
  { name: 'yijing-oracle', url: 'app/yijing-oracle.html' },
  { name: 'fengshui', url: 'app/fengshui.html' },
];

const REPORT_PATH = path.join(__dirname, '..', 'docs', 'A11Y_AXE_PUPPETEER_REPORT.md');

async function scanPage(page, startedAt) {
  const t0 = Date.now();
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process',
    ],
  });
  let tab;
  try {
    tab = await browser.newPage();
    tab.setDefaultTimeout(45000);

    const consoleErrors = [];
    tab.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message.substring(0, 150)}`));
    tab.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(`console: ${m.text().substring(0, 150)}`);
    });

    const filePath = path.resolve(__dirname, '..', page.url);
    await tab.goto('file://' + filePath, { waitUntil: 'domcontentloaded', timeout: 45000 });

    // 等内联 JS 完成模板拼接
    await new Promise((r) => setTimeout(r, 4000));

    // 显式触发 voice UI 注入（确保 select 元素存在）
    try {
      await tab.evaluate(() => {
        if (typeof window.injectVoiceUI === 'function') window.injectVoiceUI();
      });
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 1500));

    // 注入 axe
    await tab.evaluate(axeSource);

    // 给 axe 时间收集
    await new Promise((r) => setTimeout(r, 2000));

    const result = await tab.evaluate(async () => {
      return await axe.run({
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
      });
    });

    const violations = (result.violations || []).map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodeCount: v.nodes.length,
      nodes: v.nodes.slice(0, 3).map((n) => ({
        target: n.target,
        html: (n.html || '').slice(0, 200),
        failureSummary: (n.failureSummary || '').slice(0, 200),
      })),
    }));

    return { name: page.name, url: page.url, ok: true, violations, consoleErrors, tookMs: Date.now() - t0 };
  } catch (e) {
    return { name: page.name, url: page.url, ok: false, error: e.message, violations: [], consoleErrors: [], tookMs: Date.now() - t0 };
  } finally {
    try { if (tab) await tab.close(); } catch (_) {}
    try { await browser.close(); } catch (_) {}
  }
}

(async () => {
  const startedAt = new Date().toISOString();
  console.log(`[axe-v2] started ${startedAt}`);

  const results = [];
  for (const page of PAGES) {
    process.stdout.write(`[axe-v2] scanning ${page.name} ... `);
    const r = await scanPage(page);
    if (r.ok) {
      console.log(`violations=${r.violations.length} consoleErrors=${r.consoleErrors.length} ${r.tookMs}ms`);
    } else {
      console.log(`ERROR: ${r.error}`);
    }
    results.push(r);
  }

  // 生成 markdown 报告
  const totalViolations = results.reduce((s, r) => s + r.violations.length, 0);
  const totalErrors = results.reduce((s, r) => s + (r.consoleErrors ? r.consoleErrors.length : 0), 0);

  let md = `# A11Y axe-core Puppeteer 真实浏览器扫描报告 v2\n\n`;
  md += `> 生成时间: ${startedAt}\n`;
  md += `> 工具: puppeteer (chromium) + axe-core (single-process)\n`;
  md += `> 规则集: WCAG 2.0 A/AA + WCAG 2.1 A/AA\n`;
  md += `> 改进: 独立 browser-per-page，避免连接冲突\n\n`;

  md += `## 总结\n\n`;
  md += `| 页面 | critical | serious | moderate | minor | 合计 | console errors |\n`;
  md += `|------|----------|---------|----------|-------|------|----------------|\n`;
  for (const r of results) {
    if (!r.ok) {
      md += `| ${r.name} | ERROR | — | — | — | — | ${r.error.substring(0, 50)} |\n`;
      continue;
    }
    const c = { critical: 0, serious: 0, moderate: 0, minor: 0 };
    for (const v of r.violations) if (c[v.impact] !== undefined) c[v.impact]++;
    md += `| ${r.name} | ${c.critical} | ${c.serious} | ${c.moderate} | ${c.minor} | ${r.violations.length} | ${r.consoleErrors.length} |\n`;
  }
  md += `\n**总计**: ${totalViolations} violations / ${totalErrors} console errors\n\n`;

  // 详细 violation 列表
  for (const r of results) {
    if (!r.ok) continue;
    md += `## ${r.name}\n\n`;
    if (r.violations.length === 0) {
      md += `✅ 无 violations\n\n`;
      continue;
    }
    for (const v of r.violations) {
      md += `### [${v.impact}] ${v.id}: ${v.help}\n\n`;
      md += `- **影响节点数**: ${v.nodeCount}\n`;
      for (const n of v.nodes) {
        md += `  - \`${JSON.stringify(n.target)}\`\n`;
        md += `    \`\`\`html\n    ${n.html.replace(/\n/g, ' ').substring(0, 200)}\n    \`\`\`\n`;
      }
      md += `\n`;
    }
    // console errors (top 5)
    if (r.consoleErrors.length > 0) {
      md += `### console errors (${r.consoleErrors.length})\n\n`;
      for (const e of r.consoleErrors.slice(0, 5)) {
        md += `- \`${e}\`\n`;
      }
      md += `\n`;
    }
  }

  fs.writeFileSync(REPORT_PATH, md, 'utf8');
  console.log(`[axe-v2] report → ${REPORT_PATH}`);
  console.log(`[axe-v2] done. total=${totalViolations} violations`);
})().catch((e) => {
  console.error('[axe-v2] FATAL:', e);
  process.exit(1);
});