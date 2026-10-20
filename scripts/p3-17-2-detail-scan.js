#!/usr/bin/env node
/**
 * p3-17-2-detail-scan.js — P3-17.2 节点 3 详细诊断
 * 用 puppeteer 抓取 divination-hub 上 color-contrast 违规元素的 computed style
 * 输出: docs/P3_17_2_DETAIL_REPORT.md
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const APP_DIR = path.resolve(__dirname, '..', 'app');
const REPORT_PATH = path.resolve(__dirname, '..', 'docs', 'P3_17_2_DETAIL_REPORT.md');
const AXE_SOURCE = fs.readFileSync(
  path.resolve(__dirname, '..', 'node_modules', 'axe-core', 'axe.min.js'),
  'utf8'
);

(async () => {
  const url = 'file://' + path.join(APP_DIR, 'divination-hub.html');
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const tab = await browser.newPage();
  await tab.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise((r) => setTimeout(r, 4000));
  await tab.addScriptTag({ content: AXE_SOURCE });
  await new Promise((r) => setTimeout(r, 2000));

  const result = await tab.evaluate(async () => {
    const r = await axe.run({ runOnly: ['color-contrast'] });
    // 给每个节点计算 computed style
    const detailed = [];
    for (const v of r.violations) {
      for (const node of v.nodes.slice(0, 25)) { // 限制 25 个避免太多
        const el = document.querySelector(node.target.join(' '));
        if (el) {
          const cs = window.getComputedStyle(el);
          detailed.push({
            target: node.target.join(' '),
            text: el.textContent.trim().slice(0, 50),
            color: cs.color,
            backgroundColor: cs.backgroundColor,
            opacity: cs.opacity,
            fontSize: cs.fontSize,
            fontWeight: cs.fontWeight,
            parentBg: window.getComputedStyle(el.parentElement).backgroundColor,
            failureSummary: node.failureSummary,
          });
        }
      }
    }
    return detailed;
  });

  await browser.close();

  const report = [
    '# P3-17.2 divination-hub 详细诊断（节点 3 修复指南）',
    '',
    `> 生成时间: ${new Date().toISOString()}`,
    `> 工具: puppeteer + axe-core color-contrast runOnly`,
    `> 范围: divination-hub 前 25 个违规节点 computed style`,
    '',
    '## 1. 违规元素 computed style 表',
    '',
    '| 元素 | text | color | opacity | font-size | font-weight | failureSummary |',
    '|------|------|-------|---------|-----------|-------------|----------------|',
    ...result.map((n) => `| \`${n.target}\` | ${n.text} | ${n.color} | ${n.opacity} | ${n.fontSize} | ${n.fontWeight} | ${n.failureSummary.replace(/\n/g, ' ')} |`),
    '',
    `## 2. 节点数: ${result.length}`,
    '',
    '## 3. 修复方向',
    '',
    '- opacity 0.78 全部 → 0.88（divination-hub.css + divination-hub-inline.css 177 处）',
    '- opacity 0.75 全部 → 0.88（6 处）',
    '- font-weight:300 全部 → 400（24 处，与 opacity 叠加影响合成对比度）',
  ];
  fs.writeFileSync(REPORT_PATH, report.join('\n'));
  console.log(`[OK] ${REPORT_PATH}`);
  console.log(`[SUMMARY] ${result.length} nodes detail captured`);
})();
