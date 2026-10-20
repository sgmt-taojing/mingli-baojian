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
    // 列出所有属性
    const attrs = {};
    for (let i = 0; i < sel.attributes.length; i++) {
      const a = sel.attributes[i];
      attrs[a.name] = a.value;
    }
    // 检查是否有 aria-label
    const hasLabel = sel.hasAttribute('aria-label');
    const label = sel.getAttribute('aria-label');
    return {
      exists: true,
      hasAriaLabel: hasLabel,
      ariaLabelValue: label,
      allAttrs: attrs,
      hasLabelProp: 'aria-label' in sel,
      ariaLabelDescriptor: Object.getOwnPropertyDescriptor(sel.constructor.prototype, 'aria-label')
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
