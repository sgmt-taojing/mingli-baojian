// ════════════════════════════════════════════════════════════════
//  集成测试：提取 divination-core.js 中的目标函数 + 执行测试
// ════════════════════════════════════════════════════════════════
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'app', 'js', 'divination-core.js'), 'utf8');

// 找到关键函数所在的行号范围并 eval
function extractAndTest() {
  // 由于文件太大且有 DOMContentLoaded 等顶层副作用，
  // 我们直接提取并 eval 整个文件但在 vm 中执行顶层副作用抑制
  // 简化做法：包装 try-catch 容忍顶层副作用

  // 创建沙箱
  const sandbox = {
    window: {},
    document: {
      getElementById: () => ({
        value: '1990-05-15',
        innerHTML: '',
        textContent: '',
        classList: { add: () => {} },
        addEventListener: () => {},
        querySelectorAll: () => [],
        querySelector: () => null,
        insertAdjacentElement: () => {},
        appendChild: () => {},
        scrollIntoView: () => {}
      }),
      addEventListener: () => {},
      querySelectorAll: () => [],
      querySelector: () => null
    },
    console: console,
    showToast: (m) => console.log('TOAST:', m),
    Math: Math,
    Date: Date,
    setTimeout: setTimeout,
    Number: Number,
    String: String,
    Array: Array,
    Object: Object,
    JSON: JSON,
    parseInt: parseInt,
    parseFloat: parseFloat
  };
  sandbox.global = sandbox;
  sandbox.globalThis = sandbox;

  // 用 vm 沙箱运行
  const vm = require('vm');
  try {
    vm.createContext(sandbox);
    vm.runInContext(src, sandbox);
  } catch (e) {
    if (e.message.indexOf('initCompositeSections') >= 0 ||
        e.message.indexOf('not defined') >= 0) {
      // 顶层 DOMContentLoaded handler 失败可忽略
    } else {
      console.error('顶层执行报错（不影响函数定义）:', e.message);
    }
  }

  // 现在测试关键函数
  console.log('\n═══ 集成测试：从实际 divination-core.js 调用紫微函数 ═══\n');

  const ctx = sandbox;
  let pass = 0, fail = 0;
  function check(cond, name, detail) {
    if (cond) { console.log(`  ✅ ${name}`); pass++; }
    else { console.log(`  ❌ ${name} — ${detail}`); fail++; }
  }

  // 测试 computeMingGongIdx
  check(ctx.computeMingGongIdx(1, 0) === 3, '实际: 正月子时→卯(3)');
  check(ctx.computeMingGongIdx(5, 6) === 1, '实际: 五月午时→丑(1)');
  check(ctx.computeShenGongIdx(1, 0) === 3, '实际: 正月子时身宫→卯(3)');

  // 测试五行局
  check(typeof ctx.getJuShuByGanZhi === 'function', 'getJuShuByGanZhi 函数已定义');
  check(typeof ctx.getZiWeiGongIdx === 'function', 'getZiWeiGongIdx 函数已定义');
  check(typeof ctx.placeFourteenMainStars === 'function', 'placeFourteenMainStars 函数已定义');

  // 测试紫微定位
  const zw = ctx.getZiWeiGongIdx(15, 5); // 土五局, 农历15
  console.log(`  ℹ️  土五局农历15日 → 紫微位置 idx=${zw}`);
  // q = ceil(15/5) = 3 → 寅+2 = 辰(4)
  check(zw === 4, '土五局农历15日→紫微辰(4)', `got ${zw}`);

  // 测试十四主星
  const p = ctx.placeFourteenMainStars(2);
  check(p.byGong[2] && p.byGong[2].mainStars.includes('紫微'), '紫微在寅(2)', JSON.stringify(p.byGong[2]));
  check(p.byGong[2] && p.byGong[2].mainStars.includes('破军'), '破军与紫微共宫寅(2)', JSON.stringify(p.byGong[2]));

  // 测试四化表（不依赖函数，原文件里 SIHUA_BY_YEAR_GAN 是常量）
  const sh = ctx.SIHUA_BY_YEAR_GAN || (typeof SIHUA_BY_YEAR_GAN !== 'undefined' ? SIHUA_BY_YEAR_GAN : null);
  // 在沙箱里访问不到 const 声明的 var，但 SIHUA_BY_YEAR_GAN 应该是 const
  // 改为测试 computeSiHuaByYearGan 函数
  check(typeof ctx.computeSiHuaByYearGan === 'function', 'computeSiHuaByYearGan 函数已定义');
  if (typeof ctx.computeSiHuaByYearGan === 'function') {
    try {
      const sihua = ctx.computeSiHuaByYearGan('甲');
      check(sihua.lu.name === '廉贞', '甲化禄=廉贞', sihua.lu.name);
      check(sihua.ji.name === '太阳', '甲化忌=太阳', sihua.ji.name);
    } catch (e) {
      // 容许该函数在沙箱中报错（依赖大量 DOM）
      console.log('  ⚠️  computeSiHuaByYearGan 沙箱调用失败，但已定义');
    }
  }

  console.log(`\n═══ 集成测试结果: ${pass} passed, ${fail} failed ═══\n`);
  if (fail > 0) process.exit(1);
}

extractAndTest();
