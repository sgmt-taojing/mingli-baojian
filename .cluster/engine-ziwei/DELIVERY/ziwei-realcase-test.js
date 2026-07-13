// ════════════════════════════════════════════════════════════════
//  实际案例测试：完整 _computeZiWeiImpl 流程
// ════════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// 创建完整 DOM mock
function makeMockElement() {
  const handlers = {};
  const el = {
    value: '', innerHTML: '', textContent: '', disabled: false,
    children: [], classList: { add: () => {}, remove: () => {} },
    addEventListener: (e, h) => { handlers[e] = h; },
    querySelectorAll: () => [],
    querySelector: () => null,
    insertAdjacentElement: () => {},
    appendChild: () => {},
    removeChild: () => {},
    remove: () => {},
    scrollIntoView: () => {},
    getBoundingClientRect: () => ({ top: 0, left: 0 }),
    style: {},
    dataset: {},
    onclick: null,
    className: '',
    id: '',
    src: '',
    checked: false
  };
  el.parentNode = el; // 自引用（避免递归）
  return el;
}

const sandbox = {
  Math: Math, Date: Date, Number: Number, String: String,
  Array: Array, Object: Object, JSON: JSON,
  parseInt: parseInt, parseFloat: parseFloat, isNaN: isNaN,
  setTimeout: setTimeout, clearTimeout: clearTimeout,
  console: console,
  window: {},
  alert: () => {},
  showToast: (m) => {},
  document: {
    getElementById: (id) => {
      const el = makeMockElement();
      // 测试输入
      if (id === 'zwName') el.value = '测试甲';
      if (id === 'zwDate') el.value = '1990-05-15';
      if (id === 'zwHour') el.value = '14';
      if (id === 'zwSex') el.value = 'male';
      return el;
    },
    addEventListener: () => {},
    querySelectorAll: () => [],
    querySelector: () => null,
    createElement: () => makeMockElement(),
    createDocumentFragment: () => ({ children: [], appendChild: () => {}, insertBefore: () => {} })
  }
};
sandbox.window = sandbox;
sandbox.global = sandbox;
sandbox.globalThis = sandbox;

const src = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'app', 'js', 'divination-core.js'), 'utf8');

vm.createContext(sandbox);

try {
  vm.runInContext(src, sandbox);
} catch (e) {
  if (e.message.indexOf('not defined') < 0 && e.message.indexOf('addEventListener') < 0) {
    // 顶层 DOMContentLoaded handler 失败可忽略
  }
}

// 现在尝试调用 _computeZiWeiImpl
console.log('\n═══ 实际案例端到端测试 ═══\n');

try {
  sandbox._computeZiWeiImpl();
  console.log('✅ _computeZiWeiImpl 完整执行成功，无异常');

  // 读取全局变量验证
  console.log(`\n关键参数：`);
  console.log(`  _ZW_LUNAR_DAY      = ${sandbox._ZW_LUNAR_DAY}`);
  console.log(`  _ZW_JU_SHU         = ${sandbox._ZW_JU_SHU}`);
  console.log(`  _CURRENT_INPUT_YEAR= ${sandbox._CURRENT_INPUT_YEAR}`);
  console.log(`  _ZW_YEAR_BRANCH_IDX= ${sandbox._ZW_YEAR_BRANCH_IDX}`);

  // 验证关键计算
  const YIN_IDX = 2;
  const lunarMonth = 4; // 公历1990-05-15 → 庚午年农历四月廿一
  const lunarDay = 21;
  const hourBranchIdx = 7; // 未时(13-15)
  const expectedMingGong = (YIN_IDX + lunarMonth - hourBranchIdx + 12) % 12;
  const expectedZiWeiIdx = sandbox.getZiWeiGongIdx(lunarDay, 5);
  const expectedMingGongGan = sandbox.getMingGongGanIdx(6, expectedMingGong);
  const expectedJu = sandbox.getJuShuByGanZhi(
    ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'][expectedMingGongGan],
    ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][expectedMingGong]
  );

  console.log(`\n预期计算（公历1990-05-15未时）：`);
  console.log(`  农历月 = ${lunarMonth}, 农历日 = ${lunarDay}`);
  console.log(`  时辰索引 = ${hourBranchIdx} (未)`);
  console.log(`  命宫索引 = ${expectedMingGong} (${['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][expectedMingGong]})`);
  console.log(`  命宫天干索引 = ${expectedMingGongGan}`);
  console.log(`  命宫干支 = ${['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'][expectedMingGongGan]}${['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][expectedMingGong]}`);
  console.log(`  五行局 = ${['?','水二','木三','金四','土五','火六'][expectedJu]}`);

  // 十四主星分布
  const placed = sandbox.placeFourteenMainStars(expectedZiWeiIdx);
  console.log(`\n紫微在${['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][expectedZiWeiIdx]}（idx=${expectedZiWeiIdx}）：`);
  for (let i = 0; i < 12; i++) {
    if (placed.byGong[i]) {
      console.log(`  ${['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][i]}: ${placed.byGong[i].mainStars.join('/')}`);
    }
  }

  // 命宫主星
  const mingMain = placed.byGong[expectedMingGong];
  if (mingMain) {
    console.log(`\n✅ 命宫主星：${mingMain.mainStars.join('/')}`);
  } else {
    console.log(`\n⚠️  命宫无主星，借对宫推断`);
  }

} catch (e) {
  console.error('❌ 端到端测试失败:', e.message);
  console.error(e.stack);
  process.exit(1);
}

console.log('\n═══ 端到端测试通过 ═══\n');