const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({headless: 'new', args: ['--no-sandbox']});
  const page = await browser.newPage();
  await page.goto('file://' + process.cwd() + '/app/divination-hub.html', {waitUntil: 'domcontentloaded', timeout: 60000});
  await new Promise(r => setTimeout(r, 5000));
  const m = await page.metrics();
  const p = await page.evaluate(() => {
    const navEntry = performance.getEntriesByType('navigation')[0];
    const paintEntries = performance.getEntriesByType('paint');
    return {
      domNodes: document.querySelectorAll('*').length,
      fcp: paintEntries.find(e => e.name === 'first-contentful-paint')?.startTime,
      domContentLoaded: navEntry?.domContentLoadedEventEnd,
      loadComplete: navEntry?.loadEventEnd,
    };
  });
  console.log(JSON.stringify({...p, ...m}, null, 2));
  await browser.close();
})();
