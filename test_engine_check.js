/**
 * 引擎功能全面检查测试脚本
 * 使用 Node.js vm 模块隔离每个测试
 */
const vm = require('vm');
const fs = require('fs');
const path = require('path');

const PROJECT_DIR = '/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian';

// 读取核心引擎文件
const calcEngineCode = fs.readFileSync(path.join(PROJECT_DIR, 'app/js/calc-engine-lib.js'), 'utf8');
const divinationCode = fs.readFileSync(path.join(PROJECT_DIR, 'app/js/divination-core.js'), 'utf8');
const heigeCode = fs.readFileSync(path.join(PROJECT_DIR, 'app/js/heige-integration.js'), 'utf8');
const ceziDbCode = fs.readFileSync(path.join(PROJECT_DIR, 'app/js/cezi-database.js'), 'utf8');
const guideCode = fs.readFileSync(path.join(PROJECT_DIR, 'app/js/guide-features.js'), 'utf8');
const tizhiCode = fs.readFileSync(path.join(PROJECT_DIR, 'app/js/tizhi-module.js'), 'utf8');
const shopModCode = fs.readFileSync(path.join(PROJECT_DIR, 'app/js/shop-module.js'), 'utf8');
const shopCatCode = fs.readFileSync(path.join(PROJECT_DIR, 'app/js/shop-category.js'), 'utf8');

function createSandbox() {
  // 创建 DOM mock
  const elCache = {};
  function DOMEl(id) {
    this.id = id || '';
    this.style = {};
    this.value = '';
    this.textContent = '';
    this._innerHTML = '';
    this.checked = false;
    this.children = [];
    this.classList = {
      _s: new Set(),
      add(c) { this._s.add(c); },
      remove(c) { this._s.delete(c); },
      contains(c) { return this._s.has(c); },
      toggle(c) { this._s.toggle(c); }
    };
    this.dataset = {};
    this.appendChild = (c) => { if (this.children) this.children.push(c); };
    this.removeChild = (c) => {};
    this.remove = () => {};
    this.setAttribute = () => {};
    this.getAttribute = () => null;
    this.querySelectorAll = () => [];
    this.querySelector = () => null;
    this.scrollIntoView = () => {};
    this.addEventListener = () => {};
    this.removeEventListener = () => {};
  }
  Object.defineProperty(DOMEl.prototype, 'innerHTML', {
    get: function() { return this._innerHTML; },
    set: function(v) { this._innerHTML = String(v); }
  });

  function getEl(id) {
    if (!elCache[id]) elCache[id] = new DOMEl(id);
    elCache[id].id = id;
    return elCache[id];
  }

  const sandbox = {
    window: {
      addEventListener: () => {},
      removeEventListener: () => {},
      location: { hash: '', href: 'http://localhost:8910/app/divination-hub.html', reload: () => {} },
      localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
      sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
      navigator: { userAgent: 'Mozilla/5.0' },
      scrollTo: () => {},
      dispatchEvent: () => {},
      innerWidth: 1200,
      innerHeight: 800,
      fetch: () => Promise.reject(new Error('fetch not available in test')),
    },
    navigator: { userAgent: 'Mozilla/5.0' },
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    location: { hash: '', href: 'http://localhost:8910/app/divination-hub.html' },
    screen: { width: 1200, height: 800 },
    CustomEvent: class {
      constructor(t, o) { this.type = t; this.detail = o ? o.detail : null; }
    },
    requestAnimationFrame: (cb) => setTimeout(cb, 0),
    alert: (msg) => { sandbox._alerts.push(msg); },
    _alerts: [],
    document: {
      getElementById: getEl,
      querySelectorAll: () => [],
      querySelector: () => null,
      addEventListener: () => {},
      createElement: (t) => new DOMEl(t),
      body: { appendChild: () => {}, classList: { add: () => {} } },
      head: { appendChild: () => {} },
      readyState: 'complete',
      createTextNode: (t) => ({ textContent: t }),
    },
    console: { log: () => {}, warn: () => {}, error: () => {}, info: () => {} },
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    Promise,
    Error,
    TypeError,
    SyntaxError,
    ReferenceError,
    Date: class extends Date {
      getFullYear() { return super.getFullYear(); }
      getMonth() { return super.getMonth(); }
      getDate() { return super.getDate(); }
      getHours() { return super.getHours(); }
      getMinutes() { return super.getMinutes(); }
    },
    Math,
    JSON,
    parseInt,
    parseFloat,
    isNaN,
    Array,
    Object,
    String,
    Number,
    Boolean,
    RegExp,
    Map,
    Set,
    DOMEl,
    getEl,
    elCache,
  };

  // 让 window 引用自身
  sandbox.global = sandbox;
  sandbox.window.window = sandbox.window;
  sandbox.window.document = sandbox.document;
  sandbox.window.navigator = sandbox.window.navigator;
  sandbox.window.localStorage = sandbox.window.localStorage;
  sandbox.window.sessionStorage = sandbox.localStorage;

  return sandbox;
}

function runInSandbox(sandbox, code, filename) {
  const script = new vm.Script(code, { filename });
  const ctx = vm.createContext(sandbox);
  script.runInContext(ctx);
}

function setTestInputs(getEl) {
  // 八字
  getEl('baziDate').value = '1990-06-15';
  getEl('baziHour').value = '12';
  getEl('baziName').value = '测试';
  getEl('baziSex').value = 'male';
  getEl('baziCalendarMode').value = 'solar';
  // 奇门
  getEl('qmDate').value = '1990-06-20';
  getEl('qmHour').value = '12';
  getEl('qmName').value = '测试';
  getEl('qmCalendarMode').value = 'solar';
  getEl('qmQuestion').value = '事业';
  getEl('qmDun').value = 'auto';
  getEl('qmJuMethod').value = 'chaibu';
  // 紫微
  getEl('zwDate').value = '1990-06-15';
  getEl('zwHour').value = '12';
  getEl('zwName').value = '测试';
  getEl('zwSex').value = 'male';
  getEl('zwCalendarMode').value = 'solar';
  // 梅花
  getEl('mhName').value = '测试';
  getEl('mhNum1').value = '5';
  getEl('mhNum2').value = '8';
  getEl('mhNum3').value = '3';
  // 六壬
  getEl('lrDate').value = '1990-06-15';
  getEl('lrHour').value = '12';
  getEl('lrName').value = '测试';
  getEl('lrCalendarMode').value = 'solar';
  getEl('lrQuestion').value = '综合';
  // 六爻
  getEl('yjName').value = '测试';
  // 测字
  getEl('ceziInput').value = '福';
  getEl('ceziQuestion').value = '事业';
  // 阳宅
  getEl('yzpBirthDate').value = '1990-06-15';
  getEl('yzpName').value = '测试';
  getEl('yzpSex').value = 'male';
  getEl('yzpNeedType').value = '购房选房';
  // 风水
  getEl('fsDirection').value = '南';
  getEl('fsBirthYear').value = '1990';
  // 择日
  getEl('zeriDate').value = '2026-07-01';
  getEl('zeriPurpose').value = '嫁娶';
  // 姓名
  getEl('xmCurrentName').value = '张三';
  getEl('xmNewName').value = '张明';
  getEl('xmSex').value = 'male';
  getEl('xmBirthDate').value = '1990-06-15';
}

function testEngine(name, fn, sandbox) {
  sandbox._alerts = [];
  const start = Date.now();
  let result = null;
  let error = null;
  let output = null;
  try {
    result = fn();
    output = result;
  } catch (e) {
    error = e.message || String(e);
  }
  const elapsed = Date.now() - start;
  return {
    name,
    success: error === null,
    error,
    elapsed,
    alerts: [...sandbox._alerts],
    output: output ? (typeof output === 'string' ? output.substring(0, 100) : JSON.stringify(output).substring(0, 100)) : null
  };
}

const results = [];

// 创建共享沙箱，加载所有引擎代码
const sandbox = createSandbox();
setTestInputs(sandbox.document.getElementById);

try {
  console.log('加载 calc-engine-lib.js...');
  runInSandbox(sandbox, calcEngineCode, 'calc-engine-lib.js');
  console.log('  OK');
} catch(e) {
  console.error('  FAILED:', e.message);
}

try {
  console.log('加载 heige-integration.js...');
  runInSandbox(sandbox, heigeCode, 'heige-integration.js');
  console.log('  OK');
} catch(e) {
  console.error('  FAILED:', e.message);
}

try {
  console.log('加载 cezi-database.js...');
  runInSandbox(sandbox, ceziDbCode, 'cezi-database.js');
  console.log('  OK');
} catch(e) {
  console.error('  FAILED:', e.message);
}

try {
  console.log('加载 divination-core.js...');
  runInSandbox(sandbox, divinationCode, 'divination-core.js');
  console.log('  OK');
} catch(e) {
  console.error('  FAILED:', e.message);
}

// 注意: divination-core.js 中定义了 wrapper runQimenEngine 等函数
// calc-engine-lib.js 加载在后，会覆盖这些 wrapper
// 但这里我们需要让 calc-engine-lib 的函数生效

console.log('\n========== 引擎测试 ==========\n');

// Test 1: computeBazi
results.push(testEngine('computeBazi()', () => sandbox.computeBazi(), sandbox));

// Test 2: computeQimen
results.push(testEngine('computeQimen()', () => sandbox.computeQimen(), sandbox));

// Test 3: runQimenEngine - 这是 calc-engine-lib.js 中的版本
results.push(testEngine('runQimenEngine()', () => sandbox.runQimenEngine(), sandbox));

// Test 4: computeZiWei
results.push(testEngine('computeZiWei()', () => sandbox.computeZiWei(), sandbox));

// Test 5: computeMeiHua
results.push(testEngine('computeMeiHua()', () => sandbox.computeMeiHua(), sandbox));

// Test 6: computeLiuRen
results.push(testEngine('computeLiuRen()', () => sandbox.computeLiuRen(), sandbox));

// Test 7: yjStart
results.push(testEngine('yjStart()', () => sandbox.yjStart('person'), sandbox));

// Test 8: doCezi
results.push(testEngine('doCezi()', () => sandbox.doCezi ? sandbox.doCezi() : null, sandbox));

// Test 9: computeYangzhaiPro
results.push(testEngine('computeYangzhaiPro()', () => sandbox.computeYangzhaiPro(), sandbox));

// Test 10: runFengshuiEngine (from calc-engine-lib.js)
results.push(testEngine('runFengshuiEngine()', () => sandbox.runFengshuiEngine(), sandbox));

// Test 11: runZeriEngine (from calc-engine-lib.js)
results.push(testEngine('runZeriEngine()', () => sandbox.runZeriEngine(), sandbox));

// Test 12: runXingmingEngine (from calc-engine-lib.js)
results.push(testEngine('runXingmingEngine()', () => sandbox.runXingmingEngine(), sandbox));

console.log('\n========== 测试结果汇总 ==========\n');
let passCount = 0;
let failCount = 0;
for (const r of results) {
  const status = r.success ? '✅ PASS' : '❌ FAIL';
  if (r.success) passCount++; else failCount++;
  console.log(`${status} | ${r.name} | ${r.elapsed}ms`);
  if (r.error) console.log(`       错误: ${r.error.substring(0, 200)}`);
  if (r.alerts.length > 0) console.log(`       Alerts: ${r.alerts.join('; ')}`);
}
console.log(`\n总计: ${passCount} 通过, ${failCount} 失败, ${results.length} 项`);
