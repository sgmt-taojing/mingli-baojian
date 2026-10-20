const puppeteer = require('puppeteer');
const path = require('path');
const APP = path.resolve('./app');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const tab = await browser.newPage();
  const consoleLogs = [];
  tab.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
  tab.on('pageerror', err => consoleLogs.push(`[pageerror] ${err.message}`));
  await tab.goto('file://' + path.join(APP, 'divination-hub.html'));
  await new Promise(r => setTimeout(r, 10000));
  
  // 试手动执行那段代码
  const manualResult = await tab.evaluate(() => {
    try {
      const sel = document.getElementById('voiceSelector');
      if (!sel) return { ok: false, msg: 'no voiceSelector element found' };
      sel.setAttribute('aria-label', '测试声线');
      return { ok: true, afterSet: sel.getAttribute('aria-label') };
    } catch (e) {
      return { ok: false, err: e.message };
    }
  });
  console.log('MANUAL:', JSON.stringify(manualResult));
  console.log('CONSOLE:');
  consoleLogs.forEach(l => console.log(' ', l));
  await browser.close();
})();
