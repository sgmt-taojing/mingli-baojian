const puppeteer = require('puppeteer-core');
(async () => {
  const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 430, height: 932, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await page.goto('http://localhost:8900/person-center.html', { waitUntil: 'networkidle0', timeout: 20000 });
  await page.evaluate(() => {
    switchId('believer');
    document.querySelector('#qcPhone').value = '13800000099';
    loadMyQiuce(); loadMyEmr();
  });
  await new Promise(r => setTimeout(r, 2500));
  await page.evaluate(() => viewQiuce(1));
  await new Promise(r => setTimeout(r, 2500));
  const m = await page.evaluate(() => ({ vw: innerWidth, sw: document.documentElement.scrollWidth }));
  console.log('overflow check:', JSON.stringify(m));
  await page.screenshot({ path: 'DELIVERY/g11-pwa/g14-person-center-believer.png', fullPage: true });
  await browser.close();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
