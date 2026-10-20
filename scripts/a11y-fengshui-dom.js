#!/usr/bin/env node
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const AXE_SOURCE = fs.readFileSync(path.resolve(__dirname, '..', 'node_modules', 'axe-core', 'axe.min.js'), 'utf8');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] });
  const tab = await browser.newPage();
  await tab.goto('file://' + path.resolve(__dirname, '..', 'app', 'fengshui.html'), { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 4000));

  // 直接检查 DOM 中是否有 sh-items / fu-items
  const dom = await tab.evaluate(() => {
    const result = { shItems: null, fuItems: null, bodyHtml: null };
    const sh = document.querySelector('.sh-items');
    if (sh) {
      result.shItems = {
        tagName: sh.tagName,
        children: Array.from(sh.children).map(c => ({ tag: c.tagName, html: c.outerHTML.slice(0,80) })),
        firstChild: sh.firstChild && sh.firstChild.nodeName,
        firstChildContent: sh.firstChild && sh.firstChild.textContent.slice(0,100),
        innerHTML: sh.innerHTML.slice(0, 200),
      };
    }
    const fu = document.querySelector('.fu-items');
    if (fu) {
      result.fuItems = {
        tagName: fu.tagName,
        children: Array.from(fu.children).map(c => ({ tag: c.tagName, html: c.outerHTML.slice(0,80) })),
        firstChild: fu.firstChild && fu.firstChild.nodeName,
        firstChildContent: fu.firstChild && fu.firstChild.textContent.slice(0,100),
        innerHTML: fu.innerHTML.slice(0, 200),
      };
    }
    return result;
  });
  console.log(JSON.stringify(dom, null, 2));
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });