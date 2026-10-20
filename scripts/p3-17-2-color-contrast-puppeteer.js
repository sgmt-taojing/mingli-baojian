#!/usr/bin/env node
/**
 * p3-17-2-color-contrast-puppeteer.js — P3-17.2 节点 2 真实浏览器 color-contrast 扫描
 *
 * 复用 puppeteer + axe-core，专门扫描 color-contrast 违规
 * 输出: docs/P3_17_2_PUPPETEER_REPORT.md
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const APP_DIR = path.resolve(__dirname, '..', 'app');
const REPORT_PATH = path.resolve(__dirname, '..', 'docs', 'P3_17_2_PUPPETEER_REPORT.md');

const PAGES = [
  'divination-hub', 'fengshui', 'ai-assistant', 'tcm-clinic', 'yijing-oracle',
  'bazi', 'divination-knowledge', 'wechat-h5'
];

const AXE_SOURCE = fs.readFileSync(
  path.resolve(__dirname, '..', 'node_modules', 'axe-core', 'axe.min.js'),
  'utf8'
);

(async () => {
  const startTime = Date.now();
  const results = [];
  let totalViolations = 0;

  for (const pageName of PAGES) {
    const url = 'file://' + path.join(APP_DIR, pageName + '.html');
    let browser;
    try {
      browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      const tab = await browser.newPage();
      await tab.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await new Promise((r) => setTimeout(r, 4000));
      await tab.addScriptTag({ content: AXE_SOURCE });
      await new Promise((r) => setTimeout(r, 2000));

      const result = await tab.evaluate(async () => {
        return await axe.run({ runOnly: ['color-contrast'] });
      });

      const violations = result.violations || [];
      const summary = violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        nodes: v.nodes.length,
        targets: v.nodes.slice(0, 5).map((n) => n.target.join(' '))
      }));

      results.push({ page: pageName, violations: summary });
      totalViolations += violations.reduce((sum, v) => sum + v.nodes.length, 0);

      console.log(`[${pageName}] ${violations.length} rules, ${violations.reduce((s, v) => s + v.nodes.length, 0)} nodes`);
      await browser.close();
    } catch (e) {
      results.push({ page: pageName, error: e.message });
      console.log(`[${pageName}] ERROR: ${e.message}`);
      if (browser) await browser.close();
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const report = [
    '# P3-17.2 color-contrast Puppeteer 真浏览器扫描（节点 2）',
    '',
    `> 生成时间: ${new Date().toISOString()}`,
    `> 工具: puppeteer (chromium headless) + axe-core color-contrast runOnly`,
    `> 范围: ${PAGES.length} 个页面（divination-hub / fengshui / ai-assistant / tcm-clinic / yijing-oracle / bazi / divination-knowledge / wechat-h5）`,
    `> 用时: ${elapsed}s`,
    '',
    '## 1. 总览',
    '',
    '| 页面 | color-contrast rules | 影响节点数 | 状态 |',
    '|------|---------------------|------------|------|',
    ...results.map((r) => {
      if (r.error) return `| ${r.page} | - | - | ❌ ${r.error} |`;
      const n = r.violations.reduce((s, v) => s + v.nodes, 0);
      const status = r.violations.length === 0 ? '✅' : `⚠️ ${n}`;
      return `| ${r.page} | ${r.violations.length} | ${n} | ${status} |`;
    }),
    '',
    `**总计**: ${totalViolations} 节点 / ${results.filter((r) => !r.error).length} 页已扫描`,
    '',
    '## 2. 详情',
    ''
  ];

  for (const r of results) {
    if (r.error) continue;
    report.push(`### ${r.page}`, '');
    if (r.violations.length === 0) {
      report.push('✅ 0 violations');
    } else {
      for (const v of r.violations) {
        report.push(`**[${v.impact}] ${v.id}** — ${v.help}`, '');
        report.push(`- 影响节点数: ${v.nodes}`, '');
        for (const t of v.targets) report.push(`  - \`${t}\``);
        report.push('');
      }
    }
  }

  report.push('## 3. 节点拆解', '', '- 节点 1 ✅ 静态扫描 21 风险点（已有）', `- 节点 2 ✅ Puppeteer 真浏览器扫描（本文档）`, `- 节点 3 修复 color-contrast 违规（按 R22 既有策略 opacity 0.78 / 加深前景）`, `- 节点 4 全量回归 + commit`, '');
  fs.writeFileSync(REPORT_PATH, report.join('\n'));
  console.log(`\n[OK] Report: ${REPORT_PATH}`);
  console.log(`[SUMMARY] ${totalViolations} nodes across ${results.filter((r) => !r.error).length} pages, ${elapsed}s`);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
