const puppeteer = require('puppeteer-core');
(async () => {
  const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 430, height: 932, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  for (const name of ['mobile-interact.html', 'mobile-capture.html']) {
    await page.goto('http://localhost:8900/' + name, { waitUntil: 'networkidle0', timeout: 20000 });
    await new Promise(r => setTimeout(r, 1200));
    const m = await page.evaluate(() => {
      const vw = window.innerWidth, sw = document.documentElement.scrollWidth;
      const bad = [];
      if (sw > vw) document.querySelectorAll('*').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.right > vw + 1) bad.push(el.tagName + '.' + (el.className||'').toString().slice(0,40) + ' right=' + Math.round(r.right));
      });
      return { vw, sw, bad: bad.slice(0, 8) };
    });
    console.log(name, JSON.stringify(m));
    await page.screenshot({ path: 'DELIVERY/g11-pwa/' + name.replace('.html', '') + '-430.png' });
  }
  await browser.close();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
