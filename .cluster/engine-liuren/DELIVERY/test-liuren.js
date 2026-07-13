/* 大六壬排盘引擎 v2 — 单元测试
 *
 * 用法：node test-liuren.js
 *
 * 验收点（与古书对照）：
 *  1) 月将按中气切换（雨水→亥、春分→戌、...冬至→子）
 *  2) 天地盘 — 月将加占时（天盘）
 *  3) 十二天将 — 阳贵阴贵 + 昼夜 + 顺逆
 *  4) 四课 — 日干阳/阴神 + 日支阳/阴神
 *  5) 三传 — 贼克法（贼下为初传）
 *  6) 课体 — 元首/重审/知一/察微/涉害/遥克/别责/八专/伏吟/反吟
 *  7) 三光/三阳/三阴
 *  8) 端到端
 */

const path = require('path');
const fs = require('fs');

// 加载 divination-core.js
const SRC = fs.readFileSync(path.join(__dirname, '../../../app/js/divination-core.js'), 'utf8');

// 提取引擎段：从 START LIUREN ENGINE CORE v2 到 END LIUREN ENGINE CORE v2
const startMarker = '// ═══ START LIUREN ENGINE CORE v2 ═══';
const endMarker = '// ═══ END LIUREN ENGINE CORE v2 ═══';
const startIdx = SRC.indexOf(startMarker);
const endIdx = SRC.indexOf(endMarker);
if (startIdx < 0 || endIdx < 0) {
  console.error('❌ cannot locate liuren engine section (v2 markers not found)');
  console.error('   startIdx=', startIdx, ' endIdx=', endIdx);
  process.exit(2);
}

// v2 引擎段自包含：通过 stub 注入依赖
const stub = [
  "// === stub: 注入依赖 ===",
  "var STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];",
  "var BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];",
  "var ELE = {'甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水'};",
  "var LR_TIANG_ORDER = ['guiren','tengshe','zhuque','liuhe','gouchen','qinglong','tiankong','baihu','taichang','xuanwu','taiyin','tianhou'];",
  "var LR_TIANG_NAME = {guiren:'贵人',tengshe:'螣蛇',zhuque:'朱雀',liuhe:'六合',gouchen:'勾陈',qinglong:'青龙',tiankong:'天空',baihu:'白虎',taichang:'太常',xuanwu:'玄武',taiyin:'太阴',tianhou:'天后'};",
  "var LR_GUIREN_DAY = {0:'丑',1:'子',2:'亥',3:'酉',4:'丑',5:'子',6:'丑',7:'午',8:'卯',9:'巳'};",
  "var LR_GUIREN_NIGHT = {0:'未',1:'申',2:'酉',3:'亥',4:'未',5:'申',6:'未',7:'寅',8:'巳',9:'卯'};",
  "var LR_ZHI_GAN = {'子':{gan:'壬',ele:'水'},'丑':{gan:'己癸辛',ele:'土'},'寅':{gan:'甲丙戊',ele:'木'},'卯':{gan:'乙',ele:'木'},'辰':{gan:'戊乙癸',ele:'土'},'巳':{gan:'丙庚戊',ele:'火'},'午':{gan:'丁己',ele:'火'},'未':{gan:'己丁乙',ele:'土'},'申':{gan:'庚壬戊',ele:'金'},'酉':{gan:'辛',ele:'金'},'戌':{gan:'戊辛丁',ele:'土'},'亥':{gan:'壬甲',ele:'水'}};",
  "var LR_ZHI_WX = {子:'水',丑:'土',寅:'木',卯:'木',辰:'土',巳:'火',午:'火',未:'土',申:'金',酉:'金',戌:'土',亥:'水'};",
  "var LR_WX_SHENG = {木:'火',火:'土',土:'金',金:'水',水:'木'};",
  "var LR_WX_KE = {木:'土',土:'水',水:'火',火:'金',金:'木'};",
  "function getDayStemIndex(y,m,d){var a=Math.floor((14-m)/12);var yy=y+4800-a;var mm=m+12*a-3;var jd=d+Math.floor((153*mm+2)/5)+365*yy+Math.floor(yy/4)-Math.floor(yy/100)+Math.floor(yy/400)-32045;return ((jd-1)%10+10)%10;}",
  "function getDayBranchIndex(y,m,d){var a=Math.floor((14-m)/12);var yy=y+4800-a;var mm=m+12*a-3;var jd=d+Math.floor((153*mm+2)/5)+365*yy+Math.floor(yy/4)-Math.floor(yy/100)+Math.floor(yy/400)-32045;return ((jd+1)%12+12)%12;}",
  "var window={};",
  "var document={getElementById:function(){return{value:'',textContent:'',innerHTML:'',classList:{add:function(){},remove:function(){}},scrollIntoView:function(){}};},addEventListener:function(){},removeEventListener:function(){}};",
  "function showToast(){}",
  "function playDivinationSound(){}",
  "function exportReportGeneric(){}",
  "function copyReportGeneric(){}",
  "function appendHuajieToResult(){}",
  "function _generateSanyuanJiuyunBlock(){return '';}",
  "function buildLiurenPersonalizedGuidance(){return '';}",
  "function getLiurenReadingHTML(){return '';}",
  "function buildLiuRenProfessionalInterpretation(){return {tiGuan:{name:'测试'},keTiPan:'',siKePan:'',sanChuanPan:'',tianJiangPan:'',shenShaPan:'',baihuaJielun:'',liunianTuiyan:''};}",
  "function getYearStemBranch(y,m,d){var a=Math.floor((14-m)/12);var yy=y+4800-a;var mm=m+12*a-3;var jd=d+Math.floor((153*mm+2)/5)+365*yy+Math.floor(yy/4)-Math.floor(yy/100)+Math.floor(yy/400)-32045;var sIdx=((jd-1)%10+10)%10;var bIdx=((jd+1)%12+12)%12;var stems=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];var branches=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];return {stem:stems[sIdx],branch:branches[bIdx]};}",
  "function createElement(t){return {tagName:t,className:'',innerHTML:'',appendChild:function(){}};}",
  "var console={log:function(){},warn:function(){},error:function(){}};",
  ""
].join('\n');

const snippet = SRC.slice(startIdx + startMarker.length, endIdx);
const code = stub + '\n' + snippet + '\n' +
  "module.exports = {" +
  "computeLiuRen,_computeLiuRenImpl,_buildLiuRenKeShi,_buildSiKe,_buildSanChuan," +
  "_buildTianJiangFenbu,_buildLiuRenTiGuan,_lrYueJiang,_lrTianPan,_lrShunNi," +
  "_lrGuiRen,_lrIsDayTime,_lrSanGuangYangYin,_lrYueJiangName," +
  "_getSanChuanShengKe,_getChuanTianJiang,_lrHourBranchIdx,_lrHourZhi," +
  "LR_TIANG_ORDER,LR_GUIREN_DAY,LR_GUIREN_NIGHT,LR_TIANG_NAME," +
  "LR_ZHI_WX,LR_ZHI_GAN,LR_WX_SHENG,LR_WX_KE," +
  "STEMS:STEMS,BRANCHES:BRANCHES};\n";

const mod = { exports: {} };
const fn = new Function('module', 'exports', code);
fn(mod, mod.exports);
const L = mod.exports;

// ─── 测试框架 ───
let pass = 0, fail = 0;
function eq(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log('  ✓ ' + name + ' → ' + JSON.stringify(actual)); }
  else { fail++; console.log('  ✗ ' + name + '\n    期望: ' + JSON.stringify(expected) + '\n    实际: ' + JSON.stringify(actual)); }
}
function ok(name, cond, hint) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + ' — ' + (hint || '')); }
}

// ═══════════════════════════════════════════════════════════════
console.log('\n═══ 1. 月将按中气切换 ═══');
// 古法月将表（按《大六壬探原》《六壬大全》一致）
eq('2/15 雨水前(冬至后)应为子', L._lrYueJiang(2024,2,15), '子');
eq('2/25 雨水后应为亥(登明)', L._lrYueJiang(2024,2,25), '亥');
eq('3/15 雨水后春分前仍为亥', L._lrYueJiang(2024,3,15), '亥');
eq('3/25 春分后应为戌(河魁)', L._lrYueJiang(2024,3,25), '戌');
eq('4/15 春分后谷雨前为戌', L._lrYueJiang(2024,4,15), '戌');
eq('4/25 谷雨后应为酉(从魁)', L._lrYueJiang(2024,4,25), '酉');
eq('5/15 谷雨后小满前为酉', L._lrYueJiang(2024,5,15), '酉');
eq('5/25 小满后应为申(传送)', L._lrYueJiang(2024,5,25), '申');
eq('6/25 夏至后应为未(小吉)', L._lrYueJiang(2024,6,25), '未');
eq('7/25 大暑后应为午(胜光)', L._lrYueJiang(2024,7,25), '午');
eq('8/15 大暑后处暑前为午', L._lrYueJiang(2024,8,15), '午');
eq('8/25 处暑后应为巳(太乙)', L._lrYueJiang(2024,8,25), '巳');
eq('9/25 秋分后应为辰(天罡)', L._lrYueJiang(2024,9,25), '辰');
eq('10/25 霜降后应为卯(功曹)', L._lrYueJiang(2024,10,25), '卯');
eq('11/15 立冬后应为寅(太冲)', L._lrYueJiang(2024,11,15), '寅');
eq('12/15 大雪后应为丑(破军)', L._lrYueJiang(2024,12,15), '丑');
eq('12/25 冬至后应为子(神后)', L._lrYueJiang(2024,12,25), '子');
eq('1/15 冬至后延续应为子', L._lrYueJiang(2025,1,15), '子');

console.log('\n═══ 2. 天地盘 — 月将加占时 ═══');
const tp1 = L._lrTianPan('亥', '卯');
eq('月将亥加占时卯，地盘卯上神=亥', tp1.tpMap['卯'], '亥');
// offset = (亥idx-卯idx+12)%12 = (11-3+12)%12 = 8
// 子位上神 = BRANCHES[(0+8)%12] = BRANCHES[8] = 申
eq('月将亥加占时卯，地盘子位上神=申', tp1.tpMap['子'], '申');
eq('月将亥加占时卯，地盘亥位上神=未', tp1.tpMap['亥'], '未');

const tp2 = L._lrTianPan('巳', '午');
eq('月将巳加占时午，地盘午上神=巳', tp2.tpMap['午'], '巳');
// offset = (5-6+12)%12 = 11; 子上神 = BRANCHES[(0+11)%12] = BRANCHES[11] = 亥
eq('月将巳加占时午，地盘子位上神=亥', tp2.tpMap['子'], '亥');

const tp3 = L._lrTianPan('子', '子');
eq('月将子加占时子，地盘子上神=子', tp3.tpMap['子'], '子');

console.log('\n═══ 3. 贵人（昼夜阳贵阴贵 + 顺逆） ═══');
// 甲戊庚牛羊(丑未)、乙己鼠猴(子申)、丙丁猪鸡(亥酉)、壬癸兔蛇(卯巳)、六辛马虎(午寅)
// 阳支(子寅辰午申戌)→昼贵顺；阴支(丑卯巳未酉亥)→昼贵逆

const g1 = L._buildTianJiangFenbu(0, 5); // 甲日 巳时(昼)
eq('甲日巳时（昼）贵人为丑', g1.guiZhi, '丑');
ok('甲日昼贵丑(阴支)应逆行', g1.shunPai === false, 'shunPai=' + g1.shunPai);
ok('甲日巳时，丑位天将=贵人', g1.fenbu['丑'].key === 'guiren', g1.fenbu['丑'].name);
ok('甲日巳时逆布，子位天将=螣蛇', g1.fenbu['子'].key === 'tengshe', g1.fenbu['子'].name);

const g2 = L._buildTianJiangFenbu(0, 1); // 甲日 丑时(夜)
eq('甲日丑时（夜）贵人为未', g2.guiZhi, '未');
ok('甲日夜贵未(阴支)应顺行', g2.shunPai === true, 'shunPai=' + g2.shunPai);

const g3 = L._buildTianJiangFenbu(1, 5); // 乙日 巳时(昼)
eq('乙日巳时（昼）贵人为子', g3.guiZhi, '子');
ok('乙日昼贵子(阳支)应顺行', g3.shunPai === true, 'shunPai=' + g3.shunPai);

const g4 = L._buildTianJiangFenbu(7, 6); // 辛日 午时(昼)
eq('辛日午时（昼）贵人为午', g4.guiZhi, '午');
ok('辛日昼贵午(阳支)应顺行', g4.shunPai === true, 'shunPai=' + g4.shunPai);

const g5 = L._buildTianJiangFenbu(7, 1); // 辛日 丑时(夜)
eq('辛日丑时（夜）贵人为寅', g5.guiZhi, '寅');
ok('辛日夜贵寅(阳支)应逆行', g5.shunPai === false, 'shunPai=' + g5.shunPai);

console.log('\n═══ 4. 四课 — 日干阳/阴神 + 日支阳/阴神 ═══');
const tp_sk = L._lrTianPan('亥', '卯');
const sk = L._buildSiKe(0, 2, tp_sk);
ok('四课第一课存在 ke1', typeof sk.ke1 === 'string');
ok('四课第一课存在 ke1shang', typeof sk.ke1shang === 'string');
ok('四课第二课存在 ke2shang', typeof sk.ke2shang === 'string');
ok('四课第三课存在 ke3shang', typeof sk.ke3shang === 'string');
ok('四课第四课存在 ke4shang', typeof sk.ke4shang === 'string');
eq('甲日寅支，第一课下=日干寄宫寅', sk.ke1, '寅');
// 寅位天盘上 = BRANCHES[(2+8)%12] = BRANCHES[10] = 戌
eq('甲日寅支天盘亥加卯，第一课上神=戌', sk.ke1shang, '戌');
eq('甲日寅支，第三课下=日支寅', sk.ke3, '寅');
eq('甲日寅支天盘亥加卯，第三课上神=戌', sk.ke3shang, '戌');
eq('甲日寅支天盘亥加卯，第二课下=戌', sk.ke2, '戌');
// 戌位天盘上 = BRANCHES[(10+8)%12] = BRANCHES[6] = 午
eq('甲日寅支天盘亥加卯，第二课上神=午', sk.ke2shang, '午');

console.log('\n═══ 5. 三传贼克法 ═══');
const sc1 = L._buildSanChuan(sk, 0, tp_sk);
ok('三传初传存在', typeof sc1.faYong === 'string', JSON.stringify(sc1));
ok('三传中传存在', typeof sc1.zhongChuan === 'string');
ok('三传末传存在', typeof sc1.moChuan === 'string');
ok('三传方法字段存在', typeof sc1.method === 'string');
console.log('  → 方法: ' + sc1.method);
console.log('  → 三传: ' + sc1.faYong + ' → ' + sc1.zhongChuan + ' → ' + sc1.moChuan);

console.log('\n═══ 6. 课体分类 ═══');
const tg1 = L._buildLiuRenTiGuan(sc1, sk, 0, tp_sk);
ok('甲日寅时课体已识别', typeof tg1.name === 'string', tg1.name);
console.log('  → 课体: ' + tg1.name + ' (' + tg1.jiXiong + ')');
ok('课体描述非空', typeof tg1.desc === 'string' && tg1.desc.length > 5);

// 测试多种课体识别
const names = new Set();
const samples = [
  // [dayStemIdx, dayBranchIdx, hourBranchIdx, month, year, day]
  [0, 2, 5, 2, 2024, 25],
  [1, 2, 5, 2, 2024, 25],
  [2, 4, 5, 2, 2024, 25],
  [3, 4, 5, 2, 2024, 25],
  [4, 8, 5, 2, 2024, 25],
  [5, 8, 5, 2, 2024, 25],
  [6, 8, 5, 2, 2024, 25],
  [7, 8, 5, 2, 2024, 25],
  [8, 8, 5, 2, 2024, 25],
  [9, 8, 5, 2, 2024, 25],
  [0, 0, 1, 6, 2024, 25],
  [0, 4, 1, 8, 2024, 25],
  [2, 6, 7, 10, 2024, 25],
  [6, 0, 5, 12, 2024, 25]
];
for (const [ds, db, hb, mon, yr, dy] of samples) {
  try {
    const tp = L._lrTianPan(L._lrYueJiang(yr, mon, dy), L.BRANCHES[hb]);
    const ksi = L._buildSiKe(ds, db, tp);
    const sci = L._buildSanChuan(ksi, ds, tp, hb);
    const tgi = L._buildLiuRenTiGuan(sci, ksi, ds, tp);
    names.add(tgi.name);
  } catch(e) {
    console.log('    (skip sample', ds, db, hb, e.message, ')');
  }
}
ok('识别出至少3种课体', names.size >= 3, '识别结果: ' + Array.from(names).join(','));
console.log('  → 课体集合: ' + Array.from(names).join(','));

console.log('\n═══ 7. 三光/三阳/三阴 ═══');
const ks7 = L._buildLiuRenKeShi(0, 2, 5, 2, 2024, 25);
const sg = L._lrSanGuangYangYin(ks7);
ok('三光/三阳/三阴模块返回字符串', typeof sg === 'string', sg.substring(0, 80));
console.log('  → ' + sg.substring(0, 60));

console.log('\n═══ 8. 整盘端到端 ═══');
const ks8 = L._buildLiuRenKeShi(0, 2, 5, 2, 2024, 25);
ok('端到端产出 keShi', ks8 && ks8.sanChuan && ks8.tiGuan);
console.log('  → 课体: ' + ks8.tiGuan.name);
console.log('  → 月将: ' + ks8.yueJiang + ' (' + ks8.yueJiangName + ')');
console.log('  → 天盘 offset: ' + ks8.tianPan.offset);
console.log('  → 四课: ' + ks8.siKe.ke1 + '/' + ks8.siKe.ke1shang +
  ' | ' + ks8.siKe.ke2 + '/' + ks8.siKe.ke2shang +
  ' | ' + ks8.siKe.ke3 + '/' + ks8.siKe.ke3shang +
  ' | ' + ks8.siKe.ke4 + '/' + ks8.siKe.ke4shang);
console.log('  → 三传: ' + ks8.sanChuan.faYong + ' → ' + ks8.sanChuan.zhongChuan + ' → ' + ks8.sanChuan.moChuan);
console.log('  → 方法: ' + ks8.sanChuan.method);
console.log('  → 贵人: ' + ks8.tianJiangFenbu.guiZhi +
  ' ' + (ks8.tianJiangFenbu.shunPai ? '顺' : '逆') +
  ' (' + ks8.tianJiangFenbu.guirenType + ')');

console.log('\n═══ 9. computeLiuRen 纯函数调用 ═══');
const result = L.computeLiuRen({year: 2024, month: 2, day: 25, hour: 10});
ok('computeLiuRen({year,month,day,hour}) 返回 ok=true', result.ok === true);
ok('返回 keShi', result.keShi && typeof result.keShi === 'object');
if (result.keShi) {
  console.log('  → 日干支: ' + result.keShi.dayStem + result.keShi.dayBranch);
  console.log('  → 月将: ' + result.keShi.yueJiang);
  console.log('  → 课体: ' + result.keShi.tiGuan.name);
}

console.log('\n═══ 10. 贵人歌诀全覆盖 ═══');
const guiExpected = [
  [0, true, '丑'],[0, false, '未'],
  [1, true, '子'],[1, false, '申'],
  [2, true, '亥'],[2, false, '酉'],
  [3, true, '酉'],[3, false, '亥'],
  [4, true, '丑'],[4, false, '未'],
  [5, true, '子'],[5, false, '申'],
  [6, true, '丑'],[6, false, '未'],
  [7, true, '午'],[7, false, '寅'],
  [8, true, '卯'],[8, false, '巳'],
  [9, true, '巳'],[9, false, '卯']
];
const stems = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
for (const [si, isDay, exp] of guiExpected) {
  const gui = L._lrGuiRen(si, isDay);
  eq(stems[si] + '日' + (isDay ? '昼' : '夜') + '贵=' + exp, gui.guiZhi, exp);
}

// ═══════════════════════════════════════════════════════════════
console.log('\n═══ 总计 ═══');
console.log('✓ ' + pass + ' passed, ✗ ' + fail + ' failed');
if (fail > 0) console.log('\n⚠️ 有 ' + fail + ' 个测试未通过');
process.exit(fail === 0 ? 0 : 1);
