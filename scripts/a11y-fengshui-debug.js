#!/usr/bin/env node
/**
 * a11y-fengshui-debug.js — fengshui 单独测试，最小化 wait
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const AXE_SOURCE = fs.readFileSync(
  path.resolve(__dirname, '..', 'node_modules', 'axe-core', 'axe.min.js'),
  'utf8'
);

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });
  const tab = await browser.newPage();
  tab.setDefaultTimeout(60000);

  const url = 'file://' + path.resolve(__dirname, '..', 'app', 'fengshui.html');
  console.log(`[goto] ${url}`);
  await tab.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // 不 scroll，只等短时间
  await new Promise((r) => setTimeout(r, 2000));

  console.log('[inject-axe]');
  await tab.addScriptTag({ content: AXE_SOURCE });
  await new Promise((r) => setTimeout(r, 200));

  console.log('[axe-run] begin');
  const t0 = Date.now();
  try {
    const result = await Promise.race([
      tab.evaluate(async () => {
        return await window.axe.run(document, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
          resultTypes: ['violations'],
        });
      }),
      new Promise((_, rej) => setTimeout(() => rej(new Error('axe.run timeout 45s')), 45000)),
    ]);
    console.log(`[axe-run] done in ${Date.now() - t0}ms; violations=${result.violations.length}`);
    for (const v of result.violations) {
      console.log(`  [${v.impact}] ${v.id}: ${v.nodes.length} nodes`);
    }
  } catch (e) {
    console.log(`[axe-run] FAILED: ${e.message}`);
  }

  await browser.close();
  console.log('done');
})().catch((e) => {
  console.error('FATAL:', e.message);
  process.exit(1);
});