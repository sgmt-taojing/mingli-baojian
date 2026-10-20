#!/usr/bin/env node
/**
 * kb-hot-strip-screenshot.js — R31-A 截图验证
 * 截取 divination-hub.html @ 375px (mobile) + 1200px (desktop)
 * 确认 kb-hot-strip 渲染正常
 */
const puppeteer = require('puppeteer');
const path = require('path');

const APP_DIR = path.resolve(__dirname, '..', 'app');
const OUT_DIR = path.resolve(__dirname, '..', '.openclaw', 'tmp');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  
  for (const vp of [
    { name: 'mobile-375', w: 375, h: 667 },
    { name: 'desktop-1200', w: 1200, h: 800 }
  ]) {
    const tab = await browser.newPage();
    await tab.setViewport({ width: vp.w, height: vp.h });
    
    // 注入 localStorage 模拟 KB 命中数据
    await tab.evaluateOnNewDocument(() => {
      localStorage.setItem('_kb_hit_count/bazi', '12');
      localStorage.setItem('_kb_hit_count/tcm', '8');
      localStorage.setItem('_kb_hit_count/fengshui', '5');
    });
    
    await tab.goto('file://' + path.join(APP_DIR, 'divination-hub.html'), { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));
    
    const outFile = path.join(OUT_DIR, `kb-hot-strip-${vp.name}.png`);
    await tab.screenshot({ path: outFile, fullPage: false });
    console.log(`✅ ${vp.name}: ${outFile}`);
    
    // 检查 strip 可见性
    const stripVisible = await tab.evaluate(() => {
      const el = document.getElementById('kb-hot-strip');
      if (!el) return { found: false };
      const cs = window.getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        found: true,
        display: cs.display,
        visible: r.height > 0 && r.width > 0,
        height: Math.round(r.height),
        width: Math.round(r.width),
        childCount: el.children.length
      };
    });
    console.log(`   strip: ${JSON.stringify(stripVisible)}`);
    
    await tab.close();
  }
  
  await browser.close();
  console.log('Done');
})();
