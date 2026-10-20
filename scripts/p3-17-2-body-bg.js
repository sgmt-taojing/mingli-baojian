#!/usr/bin/env node
const puppeteer = require('puppeteer');
const path = require('path');
(async () => {
  const url = 'file://' + path.resolve('app/divination-hub.html');
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const tab = await browser.newPage();
  await tab.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 4000));
  const info = await tab.evaluate(() => {
    const b = document.body;
    const cs = getComputedStyle(b);
    return {
      bodyBg: cs.backgroundColor,
      bodyClass: b.className,
      dataTheme: b.getAttribute('data-theme'),
      hero: getComputedStyle(document.querySelector('.hero')).backgroundColor,
      section: getComputedStyle(document.querySelector('.section.active')).backgroundColor,
      htmlBg: getComputedStyle(document.documentElement).backgroundColor,
      cssVars: {
        ink: getComputedStyle(document.documentElement).getPropertyValue('--ink'),
        paper: getComputedStyle(document.documentElement).getPropertyValue('--paper'),
        paper2: getComputedStyle(document.documentElement).getPropertyValue('--paper2'),
      }
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
