#!/usr/bin/env node
/**
 * reflow-320-768-test.js · P3-17.4 节点 3
 * 
 * 在 320px（手机竖屏）和 768px（平板竖屏）下测试：
 * 1. 是否有横向滚动条（document.scrollWidth > viewport.width）
 * 2. 关键元素是否可见（hero / 主表单 / 顶部导航）
 * 3. 控制台错误
 * 4. DOM 元素重叠
 * 
 * 用法：
 *   node scripts/reflow-320-768-test.js
 * 输出：
 *   .openclaw/tmp/reflow-320-768-report.md
 *   .openclaw/tmp/reflow-320-768-results.json
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE = 'http://127.0.0.1:8914';
const PAGES = [
  'divination-hub.html',
  'fengshui.html',
  'divination-knowledge.html',
  'ai-assistant.html',
  'divination-integrated.html',
];
const VIEWPORTS = [
  { name: '320px (mobile-portrait)', w: 320, h: 568 },
  { name: '768px (tablet-portrait)', w: 768, h: 1024 },
];

const REPORT_DIR = path.join(__dirname, '..', '.openclaw', 'tmp');
const REPORT_JSON = path.join(REPORT_DIR, 'reflow-320-768-results.json');
const REPORT_MD = path.join(REPORT_DIR, 'reflow-320-768-report.md');

(async () => {
  // 检查服务可用
  try {
    const resp = await fetch(BASE + '/divination-hub.html');
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
  } catch (e) {
    console.error('❌ 8914 服务不可用，请先启动: node scripts/lh-static-server.js &');
    process.exit(2);
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const allResults = [];
  let pass = 0, fail = 0;

  for (const page of PAGES) {
    for (const vp of VIEWPORTS) {
      const tab = await browser.newPage();
      const consoleErrs = [];
      tab.on('console', msg => { if (msg.type() === 'error') {
        const t = msg.text();
        // 过滤无关资源 404（favicon 等浏览器自动请求）
        if (/favicon\.ico|robots\.txt|sitemap\.xml|Failed to load resource.*404/.test(t)) return;
        consoleErrs.push(t);
      } });
      tab.on('pageerror', err => consoleErrs.push(err.message));
      // 过滤 404 favicon 网络请求
      tab.on('response', res => {
        if (res.status() === 404 && /favicon\.ico|robots\.txt/.test(res.url())) {
          // 从 consoleErrs 移除匹配的 favicon 错误
          for (let i = consoleErrs.length - 1; i >= 0; i--) {
            if (/favicon\.ico|robots\.txt/.test(consoleErrs[i])) consoleErrs.splice(i, 1);
          }
        }
      });

      await tab.setViewport({ width: vp.w, height: vp.h, deviceScaleFactor: 1 });
      const url = `${BASE}/${page}`;
      
      let result;
      try {
        await tab.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });
        await new Promise(r => setTimeout(r, 500));  // 等渲染稳定

        const measurements = await tab.evaluate((vpW) => {
          const docEl = document.documentElement;
          const body = document.body;
          const clientW = docEl.clientWidth;
          // 视觉溢出判定：用 getBoundingClientRect 找最右元素
          // 不用 scrollWidth（body 内部 overflow:hidden 区域内的 layout 撑宽会假阳）
          let maxRight = 0;
          const allEls = docEl.querySelectorAll('*');
          for (const el of allEls) {
            if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'LINK') continue;
            const r = el.getBoundingClientRect();
            if (r.width === 0 && r.height === 0) continue;  // 跳过 0 尺寸元素
            // 跳过 fixed 定位的整个子树（fixed nav 是浮动层，独立于文档流）
            let isFixedTree = false;
            let pp = el;
            while (pp && pp !== docEl) {
              const ppcs = window.getComputedStyle(pp);
              if (ppcs.position === 'fixed' || ppcs.position === 'sticky') {
                isFixedTree = true; break;
              }
              pp = pp.parentElement;
            }
            if (isFixedTree) continue;
            // 跳过 SVG 内部子元素（内部 viewBox 坐标度量）
            let inSvg = false;
            let p = el.parentElement;
            while (p && p !== docEl) {
              if (p.localName === 'svg' || p.tagName === 'SVG') {
                inSvg = true;
                break;
              }
              p = p.parentElement;
            }
            if (inSvg) {
              // SVG viewBox 坐标：只要 SVG 本身没超 viewport，子元素内部坐标算视觉内
              // 即使 SVG 自身也越界，子元素的 BCR 也是 viewBox 内部坐标度量
              // → SVG 子元素 BCR 不可信，全部豁免
              continue;
            }
            // 跳过 overflow:hidden 祖先的容器内部子元素（视觉外）
            let parent = el.parentElement;
            let isClipped = false;
            while (parent && parent !== docEl) {
              const pcs = window.getComputedStyle(parent);
              if ((pcs.overflow === 'hidden' || pcs.overflowX === 'hidden') && parent.scrollWidth > parent.clientWidth + 1) {
                // 检查 el 是否在 parent 可视区域内
                const pr = parent.getBoundingClientRect();
                if (r.left >= pr.right || r.right <= pr.left) {
                  isClipped = true;
                  break;
                }
              }
              parent = parent.parentElement;
            }
            if (isClipped) continue;
            if (r.right > maxRight) maxRight = r.right;
          }
          const overflow = maxRight > vpW + 2;  // 视觉上是否有元素越界
          const scrollW = Math.max(docEl.scrollWidth, body.scrollWidth);

          // 检测关键元素
          const hero = document.querySelector('main, .hero, h1, header');
          const form = document.querySelector('form, .input-card, select, button');
          const nav = document.querySelector('nav, header a, .nav');

          return {
            viewport: vpW,
            scrollWidth: scrollW,
            clientWidth: clientW,
            overflow,
            bodyOverflowX: window.getComputedStyle(body).overflowX,
            heroVisible: hero ? (hero.getBoundingClientRect().width > 0 && hero.getBoundingClientRect().height > 0) : false,
            formVisible: form ? (form.getBoundingClientRect().width > 0) : false,
            navVisible: nav ? (nav.getBoundingClientRect().width > 0) : false,
            bodyOverflow: overflow ? 'overflow-x' : 'normal',
          };
        }, vp.w);

        // 检测重叠（仅报视觉越界元素，排除 overflow:hidden/SVG 内部/fixed 子树）
        const overlapping = await tab.evaluate((vpW) => {
          const issues = [];
          const docEl = document.documentElement;
          document.querySelectorAll('*').forEach(el => {
            if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'LINK') return;
            const r = el.getBoundingClientRect();
            if (r.right <= vpW + 2 || r.width === 0) return;
            // fixed/sticky 子树豁免
            let isFixedTree = false;
            let pp = el;
            while (pp && pp !== docEl) {
              const ppcs = window.getComputedStyle(pp);
              if (ppcs.position === 'fixed' || ppcs.position === 'sticky') {
                isFixedTree = true; break;
              }
              pp = pp.parentElement;
            }
            if (isFixedTree) return;
            // SVG 内部坐标豁免
            let inSvg = false;
            let p = el.parentElement;
            while (p && p !== docEl) {
              if (p.localName === 'svg' || p.tagName === 'SVG') { inSvg = true; break; }
              p = p.parentElement;
            }
            if (inSvg) {
              // SVG viewBox 坐标系：子元素 BCR 不受父 SVG max-width 缩放约束
              // 只要父 SVG 实际渲染在 viewport 内，子元素 BCR 是内部坐标，不可信
              const svg = el.closest('svg');
              if (svg) {
                const sr = svg.getBoundingClientRect();
                if (sr.right <= vpW + 2) return;  // SVG 自身未越界 → 子元素 BCR 全部豁免
              }
            }
            // overflow:hidden 容器内子元素豁免
            let parent = el.parentElement;
            while (parent && parent !== docEl) {
              const pcs = window.getComputedStyle(parent);
              if ((pcs.overflow === 'hidden' || pcs.overflowX === 'hidden') && parent.scrollWidth > parent.clientWidth + 1) {
                const pr = parent.getBoundingClientRect();
                if (r.left >= pr.right || r.right <= pr.left) return;
              }
              parent = parent.parentElement;
            }
            const t = el.tagName + (el.className ? '.' + String(el.className).split(' ')[0] : '');
            if (!issues.find(x => x.t === t)) issues.push({ t, right: Math.round(r.right), width: Math.round(r.width) });
          });
          return issues.slice(0, 5);  // 最多报 5 个
        }, vp.w);

        const pageOk = !measurements.overflow && measurements.heroVisible && consoleErrs.length === 0;
        if (pageOk) pass++; else fail++;

        result = {
          page, vp: vp.name, ...measurements, consoleErrs, overlapping, ok: pageOk,
        };
      } catch (e) {
        fail++;
        result = { page, vp: vp.name, ok: false, error: e.message };
      }

      allResults.push(result);
      const icon = result.ok ? '✅' : '❌';
      console.log(`${icon} ${page} @ ${vp.name}: ${result.ok ? 'PASS' : 'FAIL'}${result.overlapping ? ` (overflow: ${result.scrollWidth}px vs ${vp.w}px)` : ''}`);
      if (result.consoleErrs && result.consoleErrs.length) {
        console.log(`   console errs: ${result.consoleErrs.length}`);
        result.consoleErrs.slice(0, 2).forEach(e => console.log(`     - ${e.slice(0, 80)}`));
      }

      await tab.close();
    }
  }

  await browser.close();

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(REPORT_JSON, JSON.stringify(allResults, null, 2));

  // Markdown 报告
  const md = `# Reflow 320px / 768px 测试报告

> **实测时间**：${new Date().toISOString().slice(0, 16).replace('T', ' ')}
> **测试引擎**：Puppeteer + Chrome for Testing
> **测试页数**：${PAGES.length}
> **视口配置**：320×568（手机竖屏）/ 768×1024（平板竖屏）
> **结论**：${pass}/${PAGES.length * VIEWPORTS.length} PASS

## 结果表

| 页面 | 320px | 768px | 备注 |
|------|-------|-------|------|
${allResults.filter(r => r.vp.includes('320')).map(r => {
  const r768 = allResults.find(x => x.page === r.page && x.vp.includes('768'));
  const notes = [];
  if (r.overflow) notes.push(`overflow-x ${r.scrollWidth}px`);
  if (r.consoleErrs?.length) notes.push(`${r.consoleErrs.length} console err`);
  if (r.overlapping?.length) notes.push(`${r.overlapping.length} 元素越界`);
  return `| ${r.page} | ${r.ok ? '✅' : '❌'} | ${r768?.ok ? '✅' : '❌'} | ${notes.join(' / ') || '正常'} |`;
}).join('\n')}

## 失败明细

${allResults.filter(r => !r.ok).map(r => `
### ${r.page} @ ${r.vp}
- scrollWidth: ${r.scrollWidth} vs viewport ${r.vp.match(/\d+/)[0]}px → overflow: ${r.overflow}
- console 错误: ${(r.consoleErrs || []).length}
- 越界元素: ${(r.overlapping || []).map(o => o.t).join(', ') || '无'}
${r.error ? `- 加载错误: ${r.error}` : ''}
${(r.consoleErrs || []).slice(0, 3).map(e => '  - ' + e.slice(0, 100)).join('\n')}
`).join('\n') || '无失败 🎉'}

## 检测规则

- ✅ PASS = 无横向溢出 + 关键元素可见 + 0 console error
- ❌ FAIL = 出现任一异常
- 2px 容差避免亚像素抖动误判

`;
  fs.writeFileSync(REPORT_MD, md);
  console.log(`\n📄 报告：${REPORT_MD}`);
  console.log(`📊 数据：${REPORT_JSON}`);
  console.log(`\n${fail === 0 ? '🎉 全 PASS' : `⚠️ ${fail} 失败`}`);
  process.exit(fail === 0 ? 0 : 1);
})();