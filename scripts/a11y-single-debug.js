#!/usr/bin/env node
/**
 * a11y-single-debug.js — 单页调试版，给 axe.run 单独超时
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const APP_DIR = path.resolve(__dirname, '..', 'app');

const pageArg = process.argv[2] || 'tcm-clinic';
const AXE_SOURCE = fs.readFileSync(
  path.resolve(__dirname, '..', 'node_modules', 'axe-core', 'axe.min.js'),
  'utf8'
);

(async () => {
  const startedAt = new Date().toISOString();
  console.log(`[a11y-debug] ${startedAt} start page=${pageArg}`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const tab = await browser.newPage();
  tab.setDefaultTimeout(90000);

  const url = 'file://' + path.join(APP_DIR, `${pageArg}.html`);
  console.log(`[goto] ${url}`);
  await tab.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

  await new Promise((r) => setTimeout(r, 5000));
  console.log('[post-wait 5s] starting scroll');

  await tab.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise((r) => setTimeout(r, 3000));
  await tab.evaluate(() => window.scrollTo(0, 0));
  await new Promise((r) => setTimeout(r, 1500));

  console.log('[inject-axe]');
  await tab.addScriptTag({ content: AXE_SOURCE });
  await new Promise((r) => setTimeout(r, 500));

  console.log('[axe-run] begin');
  const t0 = Date.now();
  const result = await Promise.race([
    tab.evaluate(async () => {
      return await window.axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
        resultTypes: ['violations'],
      });
    }),
    new Promise((_, rej) => setTimeout(() => rej(new Error('axe.run timeout 60s')), 60000)),
  ]);
  console.log(`[axe-run] done in ${Date.now() - t0}ms; violations=${result.violations.length}`);

  await browser.close();
  console.log(`[a11y-debug] done`);
})().catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
