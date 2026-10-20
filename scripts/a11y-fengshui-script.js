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

  // 看是否 <script> 内的 JS 文本节点被 axe 当 ul 标签
  const dom = await tab.evaluate(() => {
    const uls = document.querySelectorAll('ul');
    return Array.from(uls).slice(0, 5).map(u => ({
      cls: u.className,
      parentTag: u.parentElement.tagName,
      grandParentTag: u.parentElement.parentElement.tagName,
      isInScript: !!u.closest('script'),
      children: Array.from(u.childNodes).map(c => c.nodeName + (c.nodeType === 3 ? ':' + c.textContent.slice(0, 30) : '')),
    }));
  });
  console.log('ULs in DOM:', JSON.stringify(dom, null, 2));
  // 看 script 标签是否被当 ul
  const scripts = await tab.evaluate(() => {
    const all = document.querySelectorAll('script');
    return Array.from(all).slice(0, 5).map(s => ({ type: s.type, len: s.textContent.length, containsUl: s.textContent.includes('sh-items') }));
  });
  console.log('Scripts:', JSON.stringify(scripts, null, 2));
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });