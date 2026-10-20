// r25-p0-1-stats-bar-targeted.js
// 精准截 stats bar
const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 500 });

  await page.goto('http://127.0.0.1:8914/app/ai-assistant.html', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 1500));

  // 直接打点 + 刷新
  await page.evaluate(() => {
    const mods = ['bazi', 'fengshui', 'zhongyi', 'liuyao', 'qimen', 'wuxing', 'bazi', 'shiye'];
    for (let i = 0; i < 8; i++) window.recordKbHit(mods[i], 0.85, true);
    for (let i = 0; i < 2; i++) window.recordKbHit('caiyun', 0.32, false);
    window.refreshKbStatsBar();
  });
  await new Promise(r => setTimeout(r, 400));

  // 截整页顶部 + 单独截 stats bar 元素
  await page.screenshot({ path: '.openclaw/tmp/r25-p0-1-top.png', fullPage: false });

  const elBox = await page.evaluate(() => {
    const el = document.getElementById('kbStatsBar');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height, txt: el.innerText };
  });
  console.log('stats bar box:', elBox);

  if (elBox && elBox.h > 0) {
    await page.screenshot({
      path: '.openclaw/tmp/r25-p0-1-statsbar-only.png',
      clip: { x: Math.max(0, elBox.x - 10), y: Math.max(0, elBox.y - 10), width: Math.min(1400, elBox.w + 20), height: elBox.h + 20 }
    });
    console.log('saved statsbar-only screenshot');
  }

  await browser.close();
})();