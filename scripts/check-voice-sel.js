const puppeteer = require('puppeteer');
const path = require('path');
const APP = path.resolve('./app');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const tab = await browser.newPage();
  await tab.goto('file://' + path.join(APP, 'divination-hub.html'));
  await new Promise(r => setTimeout(r, 10000));
  const info = await tab.evaluate(() => {
    const sel = document.getElementById('voiceSelector');
    if (!sel) return { exists: false };
    return {
      exists: true,
      ariaLabel: sel.getAttribute('aria-label'),
      attrs: Array.from(sel.attributes).map(a => `${a.name}="${a.value}"`).join(' '),
      html: sel.outerHTML.slice(0, 300)
    };
  });
  console.log('voiceSelector state:', JSON.stringify(info, null, 2));
  await browser.close();
})();
