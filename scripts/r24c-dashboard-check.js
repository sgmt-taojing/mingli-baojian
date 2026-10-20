// scripts/r24c-dashboard-check.js
// R24-C Dashboard 实拍 + a11y 入口验证
const puppeteer = require('puppeteer');
const fs = require('fs');

const BASE = 'http://localhost:8914';

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const results = [];

  for (const [name, path] of [
    ['dashboard', '/kb-hit-dashboard.html'],
    ['divination-hub-nav', '/divination-hub.html']
  ]) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });
    const url = BASE + path;

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await new Promise(r => setTimeout(r, 2500));

      const stats = await page.evaluate(() => {
        const sel = (s) => document.querySelectorAll(s).length;
        const hasDash = Array.from(document.querySelectorAll('a')).some(a =>
          (a.textContent || '').includes('KB命中') || (a.href || '').includes('kb-hit-dashboard')
        );
        const hasAiStats = (document.body.textContent || '').includes('KB 直答');
        return {
          title: document.title,
          charts: sel('svg.chart-svg, svg.pie-svg') + sel('polyline'),
          kbLinkFound: hasDash,
          kbStatsFound: hasAiStats,
          visibleH2: Array.from(document.querySelectorAll('h2, h3')).slice(0, 5).map(e => e.textContent.trim()),
          dashEntryOnHome: name === 'divination-hub-nav' ? hasDash : null
        };
      });

      const outFile = `.openclaw/tmp/r24c-${name}.png`;
      await page.screenshot({ path: outFile, fullPage: false });
      results.push({ name, url, outFile, ...stats });
    } catch (e) {
      results.push({ name, url, error: e.message });
    }
    await page.close();
  }

  await browser.close();
  console.log(JSON.stringify(results, null, 2));
  fs.writeFileSync('.openclaw/tmp/r24c-dashboard-check.json', JSON.stringify(results, null, 2));
})();