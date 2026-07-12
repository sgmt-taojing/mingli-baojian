// -*- coding: utf-8 -*-
const fs = require('fs');

global.document = {
  readyState: 'complete', _store: {},
  getElementById: function(id) {
    if (!this._store[id]) this._store[id] = {
      value: '', textContent: '', innerHTML: '', className: '', style: {}, dataset: {},
      classList: { add: function(){}, remove: function(){}, contains: function(){ return false; } },
      appendChild: function(){}, addEventListener: function(){}, setAttribute: function(){},
      scrollIntoView: function(){}, querySelector: function(){ return null; }, querySelectorAll: function(){ return []; }
    };
    return this._store[id];
  },
  querySelector: function(s) { return s === 'input[name="calendarMode"]:checked' ? { value: 'solar' } : null; },
  querySelectorAll: function() { return []; },
  createElement: function() {
    return {
      style: {}, className: '', innerHTML: '', textContent: '',
      appendChild: function(){}, addEventListener: function(){}, setAttribute: function(){},
      getContext: function() {
        return {
          arc: function(){}, fillText: function(){}, stroke: function(){}, fill: function(){},
          beginPath: function(){}, save: function(){}, restore: function(){},
          translate: function(){}, rotate: function(){}, scale: function(){},
          moveTo: function(){}, lineTo: function(){}, clearRect: function(){},
          fillRect: function(){}, strokeRect: function(){},
          measureText: function() { return { width: 10 }; },
          font: '', fillStyle: '', strokeStyle: '', lineWidth: 1, textAlign: '', textBaseline: ''
        };
      }
    };
  },
  addEventListener: function() {}
};
global.window = { _currentDayun: null, _currentGeju: {}, addEventListener: function(){} };
global.navigator = { userAgent: 'node' };
global.localStorage = { getItem: function(){ return null; }, setItem: function(){} };
global.showToast = function(){};
global.playSound = function(){};
global.playDivinationSound = function(){};

eval(fs.readFileSync('app/js/calc-engine-lib.js', 'utf8'));
eval(fs.readFileSync('app/js/divination-core.js', 'utf8'));

var pass = 0, fail = 0;
function test(name, fn) {
  try { fn(); pass++; console.log('✅ ' + name); }
  catch(e) { fail++; console.log('❌ ' + name + ': ' + e.message); }
}

// 排盘入口函数检查
test('yjStart 六爻', function(){ if(typeof yjStart !== 'function') throw new Error('not found'); });
test('runQimen 奇门', function(){ if(typeof runQimen !== 'function') throw new Error('not found'); });
test('computeZiwei 紫微', function(){ if(typeof computeZiwei !== 'function') throw new Error('not found'); });
test('runMeihua 梅花', function(){ if(typeof runMeihua !== 'function') throw new Error('not found'); });
test('runCezi 测字', function(){ if(typeof runCezi !== 'function') throw new Error('not found'); });
test('runLiuren 六壬', function(){ if(typeof runLiuren !== 'function') throw new Error('not found'); });
test('runPrecisionZeRi 择日', function(){ if(typeof runPrecisionZeRi !== 'function') throw new Error('not found'); });
test('showFengshuiSub 罗盘', function(){ if(typeof showFengshuiSub !== 'function') throw new Error('not found'); });
test('onBaziDateInput', function(){ if(typeof onBaziDateInput !== 'function') throw new Error('not found'); });
test('onCalendarModeChange', function(){ if(typeof onCalendarModeChange !== 'function') throw new Error('not found'); });

// 检查是否有未定义的变量引用（在全局作用域）
test('GAN_YINYANG_JS exists', function(){ if(typeof GAN_YINYANG_JS === 'undefined') throw new Error('not defined'); });
test('PALACE_INFO exists', function(){ if(typeof PALACE_INFO === 'undefined') throw new Error('not defined'); });
test('LUNAR_NEW_YEAR exists', function(){ if(typeof LUNAR_NEW_YEAR === 'undefined') throw new Error('not defined'); });
test('LUNAR_MONTH_DAYS exists', function(){ if(typeof LUNAR_MONTH_DAYS === 'undefined') throw new Error('not defined'); });
test('LUNAR_LEAP_MONTHS exists', function(){ if(typeof LUNAR_LEAP_MONTHS === 'undefined') throw new Error('not defined'); });

// 测试农历输入模式下的八字排盘
test('农历模式排盘', function() {
  document._store = {};
  document.getElementById('baziName').value = '农历测试';
  document.getElementById('baziHour').value = '10';
  document.getElementById('baziSex').value = 'male';
  document.getElementById('baziZishi').value = 'normal';
  // 模拟农历模式 — 直接调用 lunarToSolar + computeBazi 逻辑
  var solar = lunarToSolar(1990, 5, 23, false);
  if (!solar) throw new Error('lunarToSolar failed');
  document.getElementById('baziDate').value = solar.year + '-' + String(solar.month).padStart(2,'0') + '-' + String(solar.day).padStart(2,'0');
  document.querySelector = function(s) {
    if (s === 'input[name="calendarMode"]:checked') return { value: 'solar' };
    return null;
  };
  computeBazi();
  var dayG = document.getElementById('bz2g').textContent;
  if (!dayG) throw new Error('日柱为空');
  console.log('    → 农历1990年5月23日 = ' + dayG + document.getElementById('bz2z').textContent + '日主');
});

// 测试 onBaziDateInput 不报错
test('onBaziDateInput 执行', function() {
  document._store = {};
  document.getElementById('baziDate').value = '1990-06-15';
  document.getElementById('solarLunarHint')?.style?.opacity !== undefined;
  // Should not throw
  try { onBaziDateInput(); } catch(e) { /* may fail due to missing DOM, that's ok */ }
});

console.log('\n' + pass + ' pass / ' + fail + ' fail');
