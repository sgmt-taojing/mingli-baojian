// 奇门遁甲 V2 排盘算法深度测试（严格依据古籍）
// STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸']
// BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']
// 索引：甲=0, 乙=1, 丙=2, 丁=3, 戊=4, 己=5, 庚=6, 辛=7, 壬=8, 癸=9
//     子=0, 丑=1, 寅=2, 卯=3, 辰=4, 巳=5, 午=6, 未=7, 申=8, 酉=9, 戌=10, 亥=11

const fs = require('fs');
const path = require('path');

global.window = global;
global.document = { getElementById: () => null, addEventListener: () => {}, removeEventListener: () => {}, readyState: 'complete' };
global.showToast = () => {};
global.playDivinationSound = () => {};
window.addEventListener = () => {};
window.removeEventListener = () => {};

const coreCode = fs.readFileSync(path.join(__dirname, 'app/js/divination-core.js'), 'utf8');

const startIdx = coreCode.indexOf('function _qimenPaiPanV2');
let depth = 0, endIdx = startIdx;
let inString = false, stringChar = '';
for (let i = startIdx; i < coreCode.length; i++) {
  const ch = coreCode[i];
  if (inString) {
    if (ch === stringChar && coreCode[i-1] !== '\\') inString = false;
    continue;
  }
  if (ch === '"' || ch === "'") { inString = true; stringChar = ch; continue; }
  if (ch === '{') depth++;
  else if (ch === '}') { depth--; if (depth === 0) { endIdx = i + 1; break; } }
}
const fnCode = coreCode.substring(startIdx, endIdx);
eval(fnCode);

const STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

// ============ 测试1：阳遁1局 戊子时（伏吟） ============
// 日干=甲(0)、日支=子(0)、时干=甲(0)、时支=子(0)
// 五子遁：甲己日起甲子时 → 甲(0)日,子时→甲子时
// 甲子旬首仪戊 → xunYi=戊 → 阳遁1局戊在1宫 → xunGong=1
// 子时对应1宫 → tianpan[1]=戊（伏吟：天盘=地盘）
console.log('\n========== 测试1：阳遁1局 甲子时（日干甲 日支子）==========');
const t1 = _qimenPaiPanV2(2024, 12, 22, 0, 0, 0, 0, 0, true, 1);
console.log('地盘:', t1.dipan);
console.log('天盘:', t1.tianpan);
console.log('xunYi:', t1.xunYi, 'xunGong:', t1.xunGong);
console.log('hourGzIdx:', t1.hourGzIdx);
console.log('验证: tianpan[1] 应为戊，实际:', t1.tianpan[1], t1.tianpan[1] === '戊' ? '✓' : '✗');

// ============ 测试2：阳遁1局 庚午时 ============
// 日干=甲(0)、日支=子(0)、时干=庚(6)、时支=午(6)
// 五子遁：甲日起子时为甲子时
// 子→0→甲(0), 丑→1→乙(1), 寅→2→丙(2), 卯→3→丁(3), 辰→4→戊(4)
// 巳→5→己(5), 午→6→庚(6) ✓
// hourGzIdx = (6*6+6)%60 = 42 → 甲辰旬(40-49), xunYi=壬
// 壬在地盘阳遁1局5宫 → xunGong=5
// 午时对应9宫 → tianpan[9] 应为 壬
console.log('\n========== 测试2：阳遁1局 甲午日 庚午时 ==========');
const t2 = _qimenPaiPanV2(2024, 12, 22, 12, 0, 0, 6, 6, true, 1);
console.log('地盘:', t2.dipan);
console.log('天盘:', t2.tianpan);
console.log('xunYi:', t2.xunYi, 'xunGong:', t2.xunGong);
console.log('hourGzIdx:', t2.hourGzIdx);
console.log('验证: tianpan[9] 应为壬，实际:', t2.tianpan[9], t2.tianpan[9] === '壬' ? '✓' : '✗');

// ============ 测试3：阳遁9局 甲子时 ============
// 阳遁9局戊起9宫：戊9己1庚2辛3壬4癸5丁6丙7乙8
// 甲子时戊在9宫 → xunGong=9
// 子时对应1宫 → tianpan[1]=戊
console.log('\n========== 测试3：阳遁9局 甲子时 ==========');
const t3 = _qimenPaiPanV2(2024, 12, 22, 0, 0, 0, 0, 0, true, 9);
console.log('地盘:', t3.dipan);
console.log('天盘:', t3.tianpan);
console.log('xunYi:', t3.xunYi, 'xunGong:', t3.xunGong);
console.log('验证: tianpan[1] 应为戊，实际:', t3.tianpan[1], t3.tianpan[1] === '戊' ? '✓' : '✗');

// ============ 测试4：阴遁9局 甲子时 ============
// 阴遁9局戊起9宫逆布：戊9己8庚7辛6壬5癸4丁3丙2乙1
// 甲子时戊在9宫 → xunGong=9
// 子时对应1宫 → tianpan[1]=戊（伏吟）
console.log('\n========== 测试4：阴遁9局 甲子时 ==========');
const t4 = _qimenPaiPanV2(2024, 6, 22, 0, 0, 0, 0, 0, false, 9);
console.log('地盘:', t4.dipan);
console.log('天盘:', t4.tianpan);
console.log('xunYi:', t4.xunYi, 'xunGong:', t4.xunGong);
console.log('验证: tianpan[1] 应为戊，实际:', t4.tianpan[1], t4.tianpan[1] === '戊' ? '✓' : '✗');

// ============ 测试5：阴遁1局 甲子时 ============
// 阴遁1局戊起1宫逆布：戊1己9庚8辛7壬6癸5丁4丙3乙2
// 甲子时戊在1宫 → xunGong=1
// 子时对应1宫 → tianpan[1]=戊（伏吟）
console.log('\n========== 测试5：阴遁1局 甲子时 ==========');
const t5 = _qimenPaiPanV2(2024, 6, 22, 0, 0, 0, 0, 0, false, 1);
console.log('地盘:', t5.dipan);
console.log('天盘:', t5.tianpan);
console.log('xunYi:', t5.xunYi, 'xunGong:', t5.xunGong);
console.log('验证: tianpan[1] 应为戊，实际:', t5.tianpan[1], t5.tianpan[1] === '戊' ? '✓' : '✗');

// ============ 测试6：古籍案例 - 《烟波钓叟歌》"阳遁七局" ============
// 阳遁7局戊起7宫：戊7己8庚9辛1壬2癸3丁4丙5乙6
console.log('\n========== 测试6：阳遁7局 甲子时 ==========');
const t6 = _qimenPaiPanV2(2024, 12, 22, 0, 0, 0, 0, 0, true, 7);
console.log('地盘:', t6.dipan);
console.log('天盘:', t6.tianpan);
console.log('验证: 地盘7宫应为戊, 实际:', t6.dipan[7], t6.dipan[7] === '戊' ? '✓' : '✗');
console.log('验证: 地盘1宫应为辛, 实际:', t6.dipan[1], t6.dipan[1] === '辛' ? '✓' : '✗');

// ============ 完整性验证 ============
console.log('\n========== 三奇六仪完整性检查 ==========');
const liuSanExpected = ['戊','己','庚','辛','壬','癸','丁','丙','乙'];
[t1, t2, t3, t4, t5, t6].forEach((p, idx) => {
  const dipArr = [];
  const tianArr = [];
  for (let i=1; i<=9; i++) { dipArr.push(p.dipan[i]); tianArr.push(p.tianpan[i]); }
  const liuSanCopy1 = [...liuSanExpected];
  let dipOk = true;
  for (let i=0; i<dipArr.length; i++) {
    const id = liuSanCopy1.indexOf(dipArr[i]);
    if (id < 0) { dipOk = false; break; }
    liuSanCopy1.splice(id, 1);
  }
  const liuSanCopy2 = [...liuSanExpected];
  let tianOk = true;
  for (let i=0; i<tianArr.length; i++) {
    const id = liuSanCopy2.indexOf(tianArr[i]);
    if (id < 0) { tianOk = false; break; }
    liuSanCopy2.splice(id, 1);
  }
  console.log('测试'+(idx+1)+': 地盘'+(dipOk?'✓':'✗')+' 天盘'+(tianOk?'✓':'✗')+' (地盘8个/天盘9个)');
});

// ============ 八门九星八神完整性 ============
console.log('\n========== 八门九星八神完整性 ==========');
const jiMen = ['休','生','伤','杜','景','死','惊','开'];
const jiXing = ['蓬','芮','冲','辅','禽','心','柱','任','英'];
const jiShen = ['值符','腾蛇','太阴','六合','白虎','玄武','九地','九天'];

[t1, t2, t3, t4, t5, t6].forEach((p, idx) => {
  // 八门：8门1个为null（中5）
  const menArr = [];
  for (let i=1; i<=9; i++) if (p.men[i]) menArr.push(p.men[i]);
  const menSet = new Set(menArr);
  const menOk = menArr.length === 8 && jiMen.every(m => menSet.has(m));
  // 九星：9星
  const starsArr = [];
  for (let i=1; i<=9; i++) starsArr.push(p.stars[i]);
  const starsSet = new Set(starsArr);
  const starsOk = starsArr.length === 9 && jiXing.every(s => starsSet.has(s));
  // 八神：8神1个为null（中5）
  const shenArr = [];
  for (let i=1; i<=9; i++) if (p.shen[i]) shenArr.push(p.shen[i]);
  const shenSet = new Set(shenArr);
  const shenOk = shenArr.length === 8 && jiShen.every(s => shenSet.has(s));
  console.log('测试'+(idx+1)+': 八门'+(menOk?'✓':'✗')+' 九星'+(starsOk?'✓':'✗')+' 八神'+(shenOk?'✓':'✗'));
});

// ============ 八门随值符转动检查 ============
console.log('\n========== 八门值使转动验证 ==========');
// 阳遁1局戊子时值符戊在1宫,值使=休,甲子旬第0时辰 → 值使留在1宫
console.log('测试1 阳遁1局戊子时: 1宫=', t1.men[1], '(期望休:', t1.men[1] === '休' ? '✓' : '✗' + ')');
// 甲午时, 甲日（dayGanIdx=0）, hourIdx=6=午(0~11), hourGzIdx=6=庚午
// xunShou=Math.floor(6/10)*10=0=甲子(甲子旬), xunYi=戊
// 阳遁1局地盘戊在1宫→戊在地盘1宫→xunGong=1, 旬首本宫（戊子）
// 但t7构造xunYi/xunGong逻辑=查天盘...
const t7 = _qimenPaiPanV2(2024, 12, 22, 12, 0, 0, 0, 6, true, 1);
console.log('测试7 阳遁1局甲午时: xunYi=', t7.xunYi, 'xunGong=', t7.xunGong);
console.log('  天盘[9]应为戊(值符戊落午时9宫), 实际:', t7.tianpan[9], t7.tianpan[9] === '戊' ? '✓' : '✗');
console.log('  t7=', JSON.stringify(t7).slice(0,400));

// ============ 反吟测试 ============
// 反吟：天盘与地盘宫位互相对冲（六仪相冲：戊冲庚，己冲辛，庚冲戊，辛冲己，壬冲丙，癸冲丁，丁冲壬，丙冲癸，乙冲甲）
console.log('\n========== 反吟检查 ==========');
[t1, t2, t3, t4, t5, t6, t7].forEach((p, idx) => {
  const chongMap = {'戊':'庚','庚':'戊','己':'辛','辛':'己','壬':'丙','丙':'壬','癸':'丁','丁':'癸','乙':'甲'};
  let fanyinCount = 0;
  for (let i=1; i<=9; i++) {
    if (p.dipan[i] && p.tianpan[i] && chongMap[p.dipan[i]] === p.tianpan[i]) fanyinCount++;
  }
  console.log('测试'+(idx+1)+': 反吟格数='+fanyinCount);
});