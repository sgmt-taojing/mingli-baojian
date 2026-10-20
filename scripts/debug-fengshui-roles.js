const puppeteer = require('puppeteer');
const path = require('path');
const APP = path.resolve('./app');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const tab = await browser.newPage();
  await tab.goto('file://' + path.join(APP, 'fengshui.html'));
  await new Promise(r => setTimeout(r, 3000));
  
  const info = await tab.evaluate(() => {
    // 找所有 sh-items 和 fu-items
    const shItems = document.querySelectorAll('.sh-items, .fu-items');
    const results = [];
    shItems.forEach(el => {
      const attrs = {};
      for (let i = 0; i < el.attributes.length; i++) {
        attrs[el.attributes[i].name] = el.attributes[i].value;
      }
      results.push({ tag: el.tagName, attrs, outerHTML: el.outerHTML.slice(0, 200) });
    });
    return results;
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
