#!/usr/bin/env node
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const AXE_SOURCE = fs.readFileSync(path.resolve(__dirname, '..', 'node_modules', 'axe-core', 'axe.min.js'), 'utf8');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] });
  const tab = await browser.newPage();
  await tab.goto('file://' + path.resolve(__dirname, '..', 'app', 'fengshui.html'), { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 3000));
  await tab.addScriptTag({ content: AXE_SOURCE });
  const r = await tab.evaluate(async () => await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } }));
  for (const v of r.violations) {
    console.log(`\n=== ${v.id} (${v.impact}, ${v.nodes.length} nodes) ===`);
    for (const n of v.nodes.slice(0, 5)) {
      console.log(' target:', JSON.stringify(n.target));
      console.log(' html  :', (n.html || '').slice(0, 150));
      console.log(' fail  :', (n.failureSummary || '').slice(0, 200));
    }
  }
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });