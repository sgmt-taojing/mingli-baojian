#!/usr/bin/env node
/**
 * perf-defer-init.js
 *
 * 把 divination-hub.html 中非必须的 DOMContentLoaded init 函数延后到
 * requestIdleCallback（或 setTimeout 300ms 兜底），
 * 释放首次解析主线程，加速 TBT/LCP。
 *
 * 选择的 init 函数（基于文件分析）：
 *  - renderYijingGuaGrid       (384 卦网格，可延后)
 *  - renderQimenGong            (奇门宫位，可延后)
 *  - renderZiyiPalace           (紫微十四主星，可延后)
 *  - initUserCenter             (信众中心初始化，可延后)
 *  - initDailyWisdom            (每日智慧，依赖网络，可延后)
 *  - initFengshuiUpload         (户型图上传，非首次进入就需要，可延后)
 *  - initCompositeSections      (复合章节初始化，可延后)
 *  - renderLifeDashboardR36     (生活矩阵，仪表盘用到前可晚)
 *  - renderNewBaziModules       (新八字模块，可延后)
 *  - renderDH4Gong              (DH 四宫渲染，可延后)
 */
const fs = require('fs');
const path = require('path');

const FILE = path.resolve(__dirname, '..', 'app', 'divination-hub.html');
const html = fs.readFileSync(FILE, 'utf8');

// 必须保留同步（以登录态立即可见的需求）
const KEEP_SYNC = /RBAC|safeStorage|consent/i;

let patched = 0;
function deferCall(name) {
  // 匹配: document.addEventListener('DOMContentLoaded', renderXxx);
  // 或:    document.addEventListener('DOMContentLoaded', () => { renderXxx(); ... });
  const patterns = [
    {
      re: new RegExp(`document\\.addEventListener\\(\\s*'DOMContentLoaded',\\s*${name}\\s*\\)\\s*;`),
      rep: `(function idle(){\n  if ('requestIdleCallback' in window) requestIdleCallback(${name}, {timeout: 2000});\n  else setTimeout(${name}, 200);\n})(); // perf: defer to idle`
    },
    {
      re: new RegExp(`document\\.addEventListener\\(\\s*'DOMContentLoaded',\\s*\\(\\)\\s*=>\\s*\\{[\\s\\S]*?${name}\\([\\s\\S]*?\\}\\)\\s*;`, 'm'),
      rep: `(function idle(){\n  const ${name}Fn = () => { ${name}(); };\n  if ('requestIdleCallback' in window) requestIdleCallback(${name}Fn, {timeout: 2000});\n  else setTimeout(${name}Fn, 200);\n})(); // perf: defer to idle`
    }
  ];
  return patterns;
}

let out = html;
for (const fn of ['renderYijingGuaGrid', 'renderQimenGong', 'renderZiyiPalace', 'initUserCenter', 'initDailyWisdom', 'initFengshuiUpload', 'initCompositeSections', 'renderLifeDashboardR36', 'renderNewBaziModules', 'renderDH4Gong']) {
  const p1 = new RegExp(`document\\.addEventListener\\(\\s*'DOMContentLoaded',\\s*${fn}\\s*\\)\\s*;`);
  const m1 = out.match(p1);
  if (m1) {
    out = out.replace(p1, `(function idle(){ if ('requestIdleCallback' in window) requestIdleCallback(${fn}, {timeout: 2000}); else setTimeout(${fn}, 200); })(); // perf: defer to idle`);
    patched++;
    console.log(`[perf] deferred ${fn} (simple)`);
    continue;
  }
  // Also catch anonymous wrapper variants
  const p2 = new RegExp(`document\\.addEventListener\\(\\s*'DOMContentLoaded',\\s*\\(\\)\\s*=>\\s*\\{[\\s\\S]{0,300}?${fn}\\(\\)[\\s\\S]{0,400}?\\}\\)\\s*;`, 'm');
  const m2 = out.match(p2);
  if (m2) {
    const block = m2[0];
    const body = block.match(/=>\s*\{([\s\S]*)\}\)/)[1];
    out = out.replace(p2, `(function idle(){\n  const __idleFn = () => {${body}};\n  if ('requestIdleCallback' in window) requestIdleCallback(__idleFn, {timeout: 2000});\n  else setTimeout(__idleFn, 200);\n})(); // perf: defer to idle`);
    patched++;
    console.log(`[perf] deferred ${fn} (anon wrapper)`);
  }
}

if (patched > 0) {
  fs.writeFileSync(FILE, out, 'utf8');
  console.log(`[perf] patched ${patched} inits in divination-hub.html`);
} else {
  console.log('[perf] no inits matched (already deferred?)');
}
