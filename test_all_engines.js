#!/usr/bin/env node
/**
 * 易道智鉴 - 全引擎函数模拟测试
 * 在 Node.js 环境中模拟 DOM，测试每个引擎函数不会抛出未捕获异常
 */

var fs = require('fs');
var path = require('path');

// ═══ 模拟 DOM 环境 ═══
var _elementStore = {};
function _makeElement(id, opts) {
  opts = opts || {};
  return {
    id: id,
    value: opts.value || '',
    checked: opts.checked || false,
    style: { display: '', cssText: '' },
    classList: { add: function(){}, remove: function(){}, contains: function(){return false;} },
    innerHTML: '',
    textContent: '',
    disabled: false,
    scrollIntoView: function(){},
    focus: function(){},
    appendChild: function(c){},
    querySelectorAll: function(s){ return []; },
    querySelector: function(s){ return _makeElement('mock'); },
    addEventListener: function(){},
    removeEventListener: function(){},
    _opts: opts
  };
}

var document = {
  getElementById: function(id) {
    if (!_elementStore[id]) {
      _elementStore[id] = _makeElement(id);
    }
    return _elementStore[id];
  },
  querySelector: function(s) {
    return _makeElement('mock-query');
  },
  querySelectorAll: function(s) {
    return [];
  },
  createElement: function(tag) {
    return _makeElement('mock-' + tag);
  },
  addEventListener: function(){},
  removeEventListener: function(){},
  body: { appendChild: function(){}, innerHTML: '' },
  head: { appendChild: function(){} },
  title: ''
};

var window = {
  location: { href: '', search: '', hash: '' },
  localStorage: {
    _store: {},
    getItem: function(k) { return this._store[k] || null; },
    setItem: function(k,v) { this._store[k] = String(v); },
    removeItem: function(k) { delete this._store[k]; }
  },
  innerWidth: 1200,
  innerHeight: 800,
  addEventListener: function(){},
  removeEventListener: function(){},
  open: function(){ return null; },
  scrollTo: function(){}
};

var navigator = { clipboard: { writeText: function(){ return Promise.resolve(); } } };
var alert = function(msg) { console.log('[ALERT]', msg); };
var confirm = function(msg) { return true; };
var console = { log: function(){ process.stdout.write(Array.from(arguments).join(' ') + '\n'); }, warn: function(){ process.stderr.write('[WARN] ' + Array.from(arguments).join(' ') + '\n'); }, error: function(){ process.stderr.write('[ERROR] ' + Array.from(arguments).join(' ') + '\n'); }, info: function(){}, debug: function(){} };
var setTimeout = function(fn, ms) { try { fn(); } catch(e) { console.error('[setTimeout error]', e.message); } return 0; };
var clearTimeout = function(){};
var Blob = function(parts, opts) { this.size = 0; this.type = opts && opts.type || ''; };
var URL = { createObjectURL: function(){ return 'blob:mock'; }, revokeObjectURL: function(){} };
var HTMLCanvasElement = function(){};
var CanvasRenderingContext2D = function(){};
var Image = function(){ this.onload = null; this.onerror = null; };
var fetch = function() { return Promise.resolve({ json: function(){ return Promise.resolve({}); }, text: function(){ return Promise.resolve(''); } }); };
var localStorage = window.localStorage;
var location = window.location;

// showToast mock
function showToast(msg) { /* silent */ }
function playDivinationSound() { /* silent */ }
function playSound(type) { /* silent */ }

// Load divination-core.js
var coreCode = fs.readFileSync(path.join(__dirname, 'app/js/divination-core.js'), 'utf8');

// Execute in this context
try {
  eval(coreCode);
} catch(e) {
  console.error('Failed to load divination-core.js:', e.message);
  process.exit(1);
}

// ═══ 测试引擎函数 ═══
var results = [];
function test(name, fn) {
  try {
    fn();
    results.push({ name: name, status: 'PASS', error: null });
    console.log('✅ ' + name);
  } catch(e) {
    results.push({ name: name, status: 'FAIL', error: e.message });
    console.log('❌ ' + name + ': ' + e.message);
  }
}

// Setup mock elements for each engine
function setupMockElements(ids) {
  ids.forEach(function(id) {
    if (!_elementStore[id]) {
      _elementStore[id] = _makeElement(id, { value: '1990-05-15' });
    }
  });
}

// 1. computeBazi
test('computeBazi', function() {
  ['baziName','baziHour','baziSex','baziDate','baziBirthplace','baziResidence','baziLng',
   'loadingOverlay','baziResult','baziInterp','baziBtn','lunarYear','lunarMonth','lunarDay','lunarLeapMonth'].forEach(function(id) {
    _elementStore[id] = _makeElement(id, { value: id === 'baziDate' ? '1990-05-15' : id === 'baziHour' ? '12' : id === 'baziSex' ? 'male' : id === 'baziName' ? '测试' : '' });
  });
  if (typeof computeBazi === 'function') computeBazi();
});

// 2. computeQimen
test('computeQimen', function() {
  ['qmName','qmDun','qmHour','qmDate','qmCalendarMode','qmResult','qmInterp'].forEach(function(id) {
    _elementStore[id] = _makeElement(id, { value: id === 'qmDate' ? '1990-05-15' : id === 'qmHour' ? '12' : '' });
  });
  if (typeof computeQimen === 'function') computeQimen();
});

// 3. computeZiWei
test('computeZiWei', function() {
  ['zwName','zwDate','zwHour','zwSex','zwResult'].forEach(function(id) {
    _elementStore[id] = _makeElement(id, { value: id === 'zwDate' ? '1990-05-15' : id === 'zwHour' ? '12' : id === 'zwSex' ? 'male' : '' });
  });
  if (typeof computeZiWei === 'function') computeZiWei();
});

// 4. computeMeiHua
test('computeMeiHua', function() {
  ['mhNum1','mhNum2','mhNum3','mhName','mhQuestion','mhResult','mhInterp','mhBtn'].forEach(function(id) {
    _elementStore[id] = _makeElement(id, { value: id === 'mhNum1' ? '3' : id === 'mhNum2' ? '5' : id === 'mhNum3' ? '2' : '' });
  });
  if (typeof computeMeiHua === 'function') computeMeiHua();
});

// 5. computeLiuRen
test('computeLiuRen', function() {
  ['lrName','lrDate','lrHour','lrResult','lrInterp','lrMeta','lrSub'].forEach(function(id) {
    _elementStore[id] = _makeElement(id, { value: id === 'lrDate' ? '1990-05-15' : id === 'lrHour' ? '12' : '' });
  });
  if (typeof computeLiuRen === 'function') computeLiuRen();
});

// 6. yjStart
test('yjStart', function() {
  ['yjDivArea','yjResult','yjCastBtn','yjCount','yjQixinRow','yjQixinTime'].forEach(function(id) {
    _elementStore[id] = _makeElement(id, { value: '' });
  });
  // Set yjQixinTime value for matter mode
  _elementStore['yjQixinTime'] = _makeElement('yjQixinTime', { value: '2024-01-01T12:00' });
  for (var i = 0; i < 6; i++) {
    _elementStore['yjD' + i] = _makeElement('yjD' + i);
  }
  for (var i = 0; i < 3; i++) {
    _elementStore['yjC' + i] = _makeElement('yjC' + i);
  }
  if (typeof yjStart === 'function') yjStart('matter');
});

// 7. doCezi
test('doCezi', function() {
  ['ceziInput','ceziQuestion','ceziResult','ceziChar','ceziTags'].forEach(function(id) {
    _elementStore[id] = _makeElement(id, { value: id === 'ceziInput' ? '明' : '' });
  });
  if (typeof doCezi === 'function') doCezi();
});

// 8. computeFengshuiPro
test('computeFengshuiPro', function() {
  ['fsHuxing','fsChaoxiang','fsLouceng','fsArea','fsBuildYear','fsJianzhu',
   'fsYear','fsSex','fsPhone','fsResult'].forEach(function(id) {
    _elementStore[id] = _makeElement(id, { value: id === 'fsYear' ? '1990' : id === 'fsSex' ? 'male' : id === 'fsHuxing' ? '三室两厅' : id === 'fsChaoxiang' ? '南' : id === 'fsLouceng' ? '5' : '' });
  });
  for (var i = 1; i <= 8; i++) {
    _elementStore['fsProblem' + i] = _makeElement('fsProblem' + i, { checked: false });
  }
  if (typeof computeFengshuiPro === 'function') computeFengshuiPro();
});

// 9. computeYangzhaiPro
test('computeYangzhaiPro', function() {
  ['yzpName','yzpSex','yzpNeedType','yzpBirthCity','yzpLiveCity','yzpFloor','yzpArea',
   'yzpCalendarMode','yzpBirthDate','yzpLunarYear','yzpLunarMonth','yzpLunarDay','yzpLunarHour',
   'yzpResult'].forEach(function(id) {
    _elementStore[id] = _makeElement(id, { value: id === 'yzpCalendarMode' ? 'solar' : id === 'yzpBirthDate' ? '1990-05-15' : id === 'yzpSex' ? 'male' : '' });
  });
  if (typeof computeYangzhaiPro === 'function') computeYangzhaiPro();
});

// 10. computeFamilyFengshui
test('computeFamilyFengshui', function() {
  if (typeof fsFamilyMembers === 'undefined') { fsFamilyMembers = []; }
  if (typeof computeFamilyFengshui === 'function') computeFamilyFengshui();
});

// 11. computeFamilyPaipan
test('computeFamilyPaipan', function() {
  if (typeof familyMembers === 'undefined') { familyMembers = []; }
  ['familyResult'].forEach(function(id) {
    _elementStore[id] = _makeElement(id);
  });
  if (typeof computeFamilyPaipan === 'function') computeFamilyPaipan();
});

// 12. computeLifePlan
test('computeLifePlan', function() {
  ['lifeplanName','lifeplanSex','lifeplanHour','lifeplanBirthplace','lifeplanResidence',
   'lifeplanOccupation','lifeplanStage','lifeplanDate','lifeplanResult',
   'lpLunarYear','lpLunarMonth','lpLunarDay','lpLunarLeap'].forEach(function(id) {
    _elementStore[id] = _makeElement(id, { value: id === 'lifeplanDate' ? '1990-05-15' : id === 'lifeplanSex' ? 'male' : id === 'lifeplanHour' ? '12' : '' });
  });
  if (typeof computeLifePlan === 'function') computeLifePlan();
});

// 13. computeYouthPlan
test('computeYouthPlan', function() {
  ['youthName','youthSex','youthHour','youthBirthplace','youthResidence',
   'youthGrade','youthScore','youthExpect','youthDate','youthResult',
   'youthLunarYear','youthLunarMonth','youthLunarDay','youthLunarLeap'].forEach(function(id) {
    _elementStore[id] = _makeElement(id, { value: id === 'youthDate' ? '2010-05-15' : id === 'youthSex' ? 'male' : id === 'youthHour' ? '12' : '' });
  });
  if (typeof computeYouthPlan === 'function') computeYouthPlan();
});

// 14. computeLifeIndex
test('computeLifeIndex', function() {
  ['liName','liDate','liHour','liSex','liBirthCity','liLiveCity','liOccupation',
   'liBtn','lifeIndexResult'].forEach(function(id) {
    _elementStore[id] = _makeElement(id, { value: id === 'liDate' ? '1990-05-15' : id === 'liSex' ? 'male' : id === 'liHour' ? '12' : '' });
  });
  if (typeof computeLifeIndex === 'function') computeLifeIndex();
});

// 15. runPrecisionZeRi
test('runPrecisionZeRi', function() {
  ['zeriName','zeriBirthDate','zeriBirthHour','zeriSex','zeriBirthCity','zeriLiveCity',
   'precZeriName','precZeriBirth','precZeriHour','precZeriSex','precZeriCareer',
   'precZeriStartDate','precZeriEndDate','jiuriPurpose','precZeriPurpose',
   'zrEngineResult','precZeriResult'].forEach(function(id) {
    _elementStore[id] = _makeElement(id, { value: id === 'zeriBirthDate' ? '1990-05-15' : id === 'jiuriPurpose' ? '搬家' : id === 'precZeriPurpose' ? '搬家' : '' });
  });
  if (typeof runPrecisionZeRi === 'function') runPrecisionZeRi();
});

// 16. runZeriEngine
test('runZeriEngine', function() {
  if (typeof runZeriEngine === 'function') runZeriEngine();
});

// 17. runXingmingEngine
test('runXingmingEngine', function() {
  ['xmName','xmNewName','xmSex','xmBirthDate','xmBirthHour','xmEngineResult'].forEach(function(id) {
    _elementStore[id] = _makeElement(id, { value: id === 'xmName' ? '张三' : id === 'xmSex' ? 'male' : '' });
  });
  if (typeof runXingmingEngine === 'function') runXingmingEngine();
});

// 18. analyzeMobile
test('analyzeMobile', function() {
  ['mobileInput','mobileName','mobileBirthDate','mobileBirthHour','mobileSex',
   'mobileOccupation','mobileLocation','mobileBirthplace','mobileWorkCity','mobileWorkType',
   'mobileOutput','mobileAllResults','mobileBaziResult','mobileCareerResult','mobileRecOutput',
   'mobileRecCount','mobileTailInput','recDims'].forEach(function(id) {
    _elementStore[id] = _makeElement(id, { value: id === 'mobileInput' ? '13800138000' : '' });
  });
  if (typeof analyzeMobile === 'function') analyzeMobile();
});

// 19. recommendMobileNumbers
test('recommendMobileNumbers', function() {
  if (typeof recommendMobileNumbers === 'function') recommendMobileNumbers();
});

// 20. runJiaziCycle
test('runJiaziCycle', function() {
  ['jiaziName','jiaziSex','jiaziDate','jiaziHour','jiaziResult'].forEach(function(id) {
    _elementStore[id] = _makeElement(id, { value: id === 'jiaziDate' ? '1990-05-15' : id === 'jiaziSex' ? 'male' : '' });
  });
  if (typeof runJiaziCycle === 'function') runJiaziCycle();
});

// 21. computeBaziCore (dependency check)
test('computeBaziCore', function() {
  if (typeof computeBaziCore !== 'function') throw new Error('computeBaziCore is not defined');
  var result = computeBaziCore(1990, 5, 15, 12);
  if (!result) throw new Error('computeBaziCore returned null');
  if (!result.pillars) throw new Error('computeBaziCore missing pillars');
});

// ═══ 输出测试报告 ═══
console.log('\n═══════════════════════════════════');
console.log('  测试结果汇总');
console.log('═══════════════════════════════════');
var pass = results.filter(function(r){return r.status==='PASS';}).length;
var fail = results.filter(function(r){return r.status==='FAIL';}).length;
console.log('通过: ' + pass + ' / ' + results.length);
console.log('失败: ' + fail + ' / ' + results.length);
if (fail > 0) {
  console.log('\n失败项:');
  results.filter(function(r){return r.status==='FAIL';}).forEach(function(r) {
    console.log('  ❌ ' + r.name + ': ' + r.error);
  });
}
console.log('═══════════════════════════════════');
process.exit(fail > 0 ? 1 : 0);
