const puppeteer = require('puppeteer-core');
(async () => {
  const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 430, height: 932, isMobile: true, hasTouch: true });

  // 1. 在线加载，等 SW 注册+安装完成
  await page.goto('http://localhost:8900/mobile-interact.html', { waitUntil: 'networkidle0', timeout: 20000 });
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => null));
  await new Promise(r => setTimeout(r, 1500));
  const swState = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    return reg ? { scope: reg.scope, active: !!reg.active } : null;
  });
  console.log('SW:', JSON.stringify(swState));

  // 2. 检查缓存内容：不应包含任何敏感 API 响应
  const cachesInfo = await page.evaluate(async () => {
    const keys = await caches.keys();
    const out = {};
    for (const k of keys) {
      const c = await caches.open(k);
      const reqs = await c.keys();
      out[k] = reqs.map(r => new URL(r.url).pathname);
    }
    return out;
  });
  const allCached = Object.values(cachesInfo).flat();
  const sensitive = allCached.filter(p => /emr|annotation|appoint|reflux|sms|patient|clinic|case|inbox/i.test(p) || p.startsWith('/api/'));
  console.log('缓存条目数:', allCached.length, '敏感/API缓存:', JSON.stringify(sensitive));

  // 3. 断网重载，验证壳可开
  await page.setOfflineMode(true);
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(e => console.log('reload err', e.message));
  await new Promise(r => setTimeout(r, 1500));
  const offline = await page.evaluate(() => ({
    title: document.title,
    h1: (document.querySelector('h1') || {}).innerText || '',
    bodyLen: document.body.innerText.length
  }));
  console.log('断网开壳:', JSON.stringify(offline));
  await page.screenshot({ path: 'DELIVERY/g11-pwa/mobile-interact-offline.png' });

  // 4. 断网开 mobile-capture
  await page.goto('http://localhost:8900/mobile-capture.html', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(e => console.log('goto err', e.message));
  await new Promise(r => setTimeout(r, 1200));
  const off2 = await page.evaluate(() => ({ title: document.title, bodyLen: document.body.innerText.length }));
  console.log('断网采集端:', JSON.stringify(off2));

  await browser.close();
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
