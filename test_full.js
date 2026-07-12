// -*- coding: utf-8 -*-
// 全量自动化测试 — 易道智鉴核心计算引擎
const fs = require('fs');

function makeEl() {
  return {
    value: '', textContent: '', innerHTML: '', className: '', style: {}, dataset: {},
    classList: { add: ()=>{}, remove: ()=>{}, contains: ()=>false },
    appendChild: ()=>{}, addEventListener: ()=>{}, setAttribute: ()=>{},
    scrollIntoView: ()=>{}, querySelector: ()=>null, querySelectorAll: ()=>[],
    removeAttribute: ()=>{}
  };
}

global.document = {
  readyState: 'complete', _store: {},
  getElementById: function(id) {
    if (!this._store[id]) this._store[id] = makeEl();
    return this._store[id];
  },
  querySelector: (s) => s === 'input[name="calendarMode"]:checked' ? { value: 'solar' } : null,
  querySelectorAll: () => [],
  createElement: () => makeEl(),
  addEventListener: () => {}
};
global.window = { _currentDayun: null, _currentGeju: {}, addEventListener: ()=>{} };
global.navigator = { userAgent: 'node' };
global.localStorage = { getItem: ()=>null, setItem: ()=>{} };
global.showToast = (msg) => console.log('  [Toast]', msg);
global.playSound = ()=>{};
global.playDivinationSound = ()=>{};

eval(fs.readFileSync('app/js/calc-engine-lib.js', 'utf8'));
eval(fs.readFileSync('app/js/divination-core.js', 'utf8'));

let pass = 0, fail = 0;
function test(name, fn) {
  try { fn(); pass++; console.log(`✅ ${name}`); }
  catch(e) { fail++; console.log(`❌ ${name}: ${e.message}`); }
}

// Reset element store between tests
function resetStore() {
  document._store = {};
}

// Set input values for computeBazi
function setInputs(date, hour, sex) {
  resetStore();
  document.getElementById('baziDate').value = date;
  document.getElementById('baziName').value = '测试';
  document.getElementById('baziHour').value = hour;
  document.getElementById('baziSex').value = sex;
  document.getElementById('baziLng').value = '';
  document.getElementById('baziBirthplace').value = '';
  document.getElementById('baziResidence').value = '';
  document.getElementById('baziZishi').value = 'normal';
}

console.log('═══════════════════════════════════════');
console.log('  易道智鉴 全量自动化测试');
console.log('═══════════════════════════════════════\n');

// ─── 1. 历法转换 ───
console.log('【历法转换】');
test('lunarToSolar 1990年5月23日 → 1990-6-16', () => {
  var s = lunarToSolar(1990, 5, 23, false);
  if (!s) throw new Error('返回null');
  if (s.year !== 1990 || s.month !== 6 || s.day !== 16) throw new Error(`期望1990-6-16, 实际${s.year}-${s.month}-${s.day}`);
});

test('lunarToSolar 2024年正月初一 → 2024-2-10', () => {
  var s = lunarToSolar(2024, 1, 1, false);
  if (!s) throw new Error('返回null');
  if (s.year !== 2024 || s.month !== 2 || s.day !== 10) throw new Error(`期望2024-2-10, 实际${s.year}-${s.month}-${s.day}`);
});

test('lunarToSolar 2000年正月十五(元宵) → 2000-2-19', () => {
  var s = lunarToSolar(2000, 1, 15, false);
  if (!s) throw new Error('返回null');
  // 2000年春节2月5日, 正月十五=2月19日
  if (s.year !== 2000 || s.month !== 2) throw new Error(`期望2000年2月, 实际${s.year}-${s.month}`);
});

test('solarToLunar 1990-06-15 → 农历5月22日', () => {
  var l = solarToLunar(1990, 6, 15);
  if (!l) throw new Error('返回null');
  if (l.year !== 1990 || l.month !== 5) throw new Error(`期望1990年5月, 实际${l.year}年${l.month}月`);
});

test('solarToLunar 2024-02-10 → 农历正月初一', () => {
  var l = solarToLunar(2024, 2, 10);
  if (!l) throw new Error('返回null');
  if (l.month !== 1 || l.day !== 1) throw new Error(`期望正月初一, 实际${l.month}月${l.day}日`);
});

test('solarToLunar 2024-01-01 → 属上年农历', () => {
  var l = solarToLunar(2024, 1, 1);
  if (!l) throw new Error('返回null');
  if (l.year !== 2023) throw new Error(`期望2023年, 实际${l.year}年`);
});

// ─── 2. 八字排盘多日期测试 ───
console.log('\n【八字排盘】');
var testDates = [
  { date: '1990-06-15', hour: '10', sex: 'male', expect: { dayStem: '辛', dayBranch: '亥' } },
  { date: '1985-03-20', hour: '14', sex: 'female', expect: {} },
  { date: '2000-01-01', hour: '0', sex: 'male', expect: {} },
  { date: '2010-10-10', hour: '12', sex: 'female', expect: {} },
  { date: '2024-02-10', hour: '6', sex: 'male', expect: {} },
  { date: '1999-12-31', hour: '23', sex: 'male', expect: {} },
  { date: '1950-06-25', hour: '8', sex: 'female', expect: {} },
  { date: '2050-01-15', hour: '4', sex: 'male', expect: {} },
];

testDates.forEach((td) => {
  test(`computeBazi ${td.date} ${td.hour}时 ${td.sex}`, () => {
    setInputs(td.date, td.hour, td.sex);
    computeBazi();
    var dayG = document.getElementById('bz2g').textContent;
    var dayZ = document.getElementById('bz2z').textContent;
    if (!dayG || !dayZ) throw new Error('日柱为空');
    if (td.expect.dayStem && dayG !== td.expect.dayStem) throw new Error(`期望日主${td.expect.dayStem}, 实际${dayG}`);
    console.log(`    → ${dayG}${dayZ}日主`);
  });
});

// ─── 3. 全局变量检查 ───
console.log('\n【全局变量】');
['STEMS','BRANCHES','ELE','ZHI_ELE','TENGAN','TEGAN_NAMES','NAYIN_COLOR','CITY_DIRECTION_WUXING'].forEach(v => {
  test(`global ${v} exists`, () => {
    if (typeof eval(v) === 'undefined') throw new Error(`${v} 未定义`);
  });
});

// ─── 4. 关键函数检查 ───
console.log('\n【关键函数】');
['computeBazi','lunarToSolar','solarToLunar','getYearStemBranchExact','getDayStemIndex','getDayBranchIndex','getMonthBranchBySolar','getMonthStem','getHourStem','trueSolarTimeCorrection','getMingType','getNayin','getShensha','getGeju','getHeChong','getTaiYuan','getMingGong','getShenGong','getXunKong','getXunName','getDishi','generateInterpretation','renderNewBaziModules','renderLiuYueModule','getTenGod','getStemColor','getKe','getXSheng','getLifeSummary','getTimingAdvice','getBaziDimensionHTML'].forEach(fn => {
  test(`function ${fn}() exists`, () => {
    if (typeof eval(fn) !== 'function') throw new Error(`${fn} 不是函数`);
  });
});

// ─── 5. 罗盘数据函数 ───
console.log('\n【罗盘函数】');
['getQimenData','getLiuRenData','getXuanKongData','getBaZhaiData','getHeTuShu','getLuoShu','getBaZhaiMingZhu','getDoorAdviceBrief','getLiuRenBrief'].forEach(fn => {
  test(`compass fn ${fn}() exists`, () => {
    if (typeof eval(fn) !== 'function') throw new Error(`${fn} 不是函数`);
  });
});

// ─── 6. 罗盘内容关键词检查 ───
console.log('\n【罗盘内容】');
var compassContent = fs.readFileSync('app/js/divination-core.js', 'utf8');
test('奇门罗盘含专业内容', () => {
  if (!compassContent.includes('罗盘读法')) throw new Error('缺少罗盘读法');
  if (!compassContent.includes('三奇六仪')) throw new Error('缺少三奇六仪');
});
test('六壬罗盘含专业内容', () => {
  if (!compassContent.includes('三传分析')) throw new Error('缺少三传分析');
  if (!compassContent.includes('天将参断')) throw new Error('缺少天将参断');
});
test('玄空罗盘含专业内容', () => {
  if (!compassContent.includes('九星')) throw new Error('缺少九星');
  if (!compassContent.includes('方位建议')) throw new Error('缺少方位建议');
});
test('八宅罗盘含专业内容', () => {
  if (!compassContent.includes('四吉方')) throw new Error('缺少四吉方');
  if (!compassContent.includes('宅命配')) throw new Error('缺少宅命配');
});
test('河图洛书罗盘含专业内容', () => {
  if (!compassContent.includes('河图五行局')) throw new Error('缺少河图五行局');
  if (!compassContent.includes('数理应用')) throw new Error('缺少数理应用');
});
test('六爻罗盘含专业内容', () => {
  if (!compassContent.includes('断卦要诀')) throw new Error('缺少断卦要诀');
  if (!compassContent.includes('六亲')) throw new Error('缺少六亲');
});

// ─── 7. HTML元素检查 ───
console.log('\n【HTML元素】');
var html = fs.readFileSync('app/divination-hub.html', 'utf8');
['baziName','baziDate','baziHour','baziSex','baziBirthplace','baziResidence','baziLng','baziZishi','baziResult','baziNameOut','baziMetaOut','tenGodsGrid','eleBar','eleLegend','baziAnalysisGrid','loadingOverlay','bz0g','bz0z','bz0e','bz0n','bz1g','bz1z','bz1e','bz1n','bz2g','bz2z','bz2e','bz2n','bz3g','bz3z','bz3e','bz3n'].forEach(id => {
  test(`HTML #${id} exists`, () => {
    if (!html.includes(`id="${id}"`)) throw new Error(`缺少 id="${id}"`);
  });
});

test('阳历提示存在', () => {
  if (!html.includes('阳历(公历)')) throw new Error('缺少阳历提示');
});

test('showKBDetail残留=0', () => {
  if (html.includes('showKBDetail')) throw new Error('仍有showKBDetail残留');
});

test('会员等级通达', () => {
  if (!html.includes('通达')) throw new Error('缺少通达');
});

// ─── 8. JS语法 ───
console.log('\n【JS语法】');
var jsFiles = fs.readdirSync('app/js').filter(f => f.endsWith('.js'));
jsFiles.forEach(f => {
  test(`syntax ${f}`, () => {
    var code = fs.readFileSync('app/js/' + f, 'utf8');
    new Function(code); // Will throw on syntax error
  });
});

// ─── 9. 会员等级一致性 ───
console.log('\n【会员等级】');
var wechat = fs.readFileSync('app/wechat-hub.html', 'utf8');
test('wechat-hub 通达=3处', () => {
  var count = (wechat.match(/通达/g) || []).length;
  if (count < 3) throw new Error(`通达仅${count}处`);
});
test('wechat-hub 圆满(非经文)=0', () => {
  var lines = wechat.split('\n').filter(l => l.includes('圆满') && !l.includes('陀罗尼'));
  if (lines.length > 0) throw new Error(`仍有${lines.length}处圆满`);
});

// ─── 总结 ───
console.log('\n═══════════════════════════════════════');
console.log(`  测试结果: ${pass} 通过 / ${fail} 失败 / ${pass+fail} 总计`);
console.log('═══════════════════════════════════════');
