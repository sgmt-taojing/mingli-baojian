#!/usr/bin/env node
// divhub smoke test - 找出卡死点
const puppeteer = require('puppeteer');
const path = require('path');

const URL = 'file://' + path.resolve(__dirname, '..', 'app', 'divination-hub.html');

(async () => {
  console.log('[smoke] launch');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const tab = await browser.newPage();

  let networkCount = 0;
  tab.on('request', (req) => { networkCount++; if (networkCount < 10) console.log(`  req ${networkCount}: ${req.url().slice(0, 80)}`); });

  tab.on('pageerror', (e) => console.log(`[pageerror] ${e.message.slice(0, 200)}`));
  tab.on('console', (m) => {
    if (m.type() === 'error') console.log(`[console.error] ${m.text().slice(0, 200)}`);
  });

  console.log(`[smoke] goto ${URL}`);
  try {
    await tab.goto(URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    console.log('[smoke] DOM ready');
  } catch (e) {
    console.log(`[smoke] goto ERR: ${e.message}`);
  }

  await new Promise((r) => setTimeout(r, 5000));
  const title = await tab.title().catch(() => 'N/A');
  console.log(`[smoke] title: ${title}`);

  const docLen = await tab.evaluate(() => document.body ? document.body.innerHTML.length : 0).catch(() => 0);
  console.log(`[smoke] document.body innerHTML length: ${docLen}`);

  await browser.close();
  console.log('[smoke] done');
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
