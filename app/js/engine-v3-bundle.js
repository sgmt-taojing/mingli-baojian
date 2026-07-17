/**
 * ════════════════════════════════════════════════════════════════
 *  命理宝鉴 · V3 引擎合并包 (Engine V3 Bundle)
 *  自动生成 — 请勿手动编辑
 *  生成日期: 2026-07-14 (QimenV3 added)
 * ════════════════════════════════════════════════════════════════
 *
 *  包含引擎:
 *    1. BaziV3      — 八字排盘引擎 V3
 *    2. FengshuiV3  — 风水分析引擎 V3
 *    3. LiuyaoV3    — 六爻占卜引擎 V3
 *    4. MeihuaV3    — 梅花易数引擎 V3
 *    5. LiurenV3    — 大六壬排盘引擎 V3
 *    6. ZiweiV3     — 紫微斗数排盘引擎 V3
 *    7. QimenV3     — 奇门遁甲排盘引擎 V3 (天文节气校准)
 *    7. ZiweiV3     — 紫微斗数排盘引擎 V3
 *
 *  每个引擎用 IIFE 隔离作用域，避免与 divination-core.js 的
 *  同名常量/函数冲突。通过 window.* 对象导出。
 * ════════════════════════════════════════════════════════════════
 */

// ════════════════════════════════════════════════════════════════
//  引擎 1/5: BaziV3
// ════════════════════════════════════════════════════════════════

(function() {
'use strict';

/**
 * ════════════════════════════════════════════════════════════════
 *  命理宝鉴 · 八字排盘引擎 V3
 *  Bazi Engine V3 — Optimized & Classical-Calibrated
 * ════════════════════════════════════════════════════════════════
 *
 *  优化要点:
 *    1. 节气边界精确到时分（天文太阳黄经算法）
 *    2. 月干计算（五虎遁: 甲己之年丙作首）
 *    3. 时干计算（五鼠遁: 甲己还加甲）
 *    4. 十神计算（同性为偏、异性为正）
 *    5. 大运起运岁数（3天=1岁，余数1天=4个月）
 *    6. 纳音五行（六十甲子纳音全表）
 *    7. 天乙贵人（甲戊庚牛羊...）
 *    8. 早子/晚子时处理
 *
 *  古籍参考:
 *    《渊海子平》「以日为主，以月为令。」
 *    《子平真诠》「格局以月令本气为主。」
 *    《滴天髓》「五阳皆阳丙为最，五阴皆阴癸为至。」
 *    《三命通会》「立春为岁首，交节为月始。」
 *    《穷通宝鉴》「调候为急，扶抑为本。」
 *
 *  (c) 2026 命理宝鉴项目 — V3 优化版
 * ════════════════════════════════════════════════════════════════
 */


// ════════════════════════════════════════════════════════════════
//  常量定义
// ════════════════════════════════════════════════════════════════

const STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

// 天干五行
const ELE = {甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水'};

// 地支五行
const ZHI_ELE = {子:'水',丑:'土',寅:'木',卯:'木',辰:'土',巳:'火',午:'火',未:'土',申:'金',酉:'金',戌:'土',亥:'水'};

// 五行相生: 木→火→土→金→水→木
const WUXING_SHENG = {'木':'火','火':'土','土':'金','金':'水','水':'木'};
// 五行相克: 木→土→水→火→金→木
const WUXING_KE = {'木':'土','土':'水','水':'火','火':'金','金':'木'};

// 天干阴阳
const GAN_YINYANG = {'甲':'阳','乙':'阴','丙':'阳','丁':'阴','戊':'阳','己':'阴','庚':'阳','辛':'阴','壬':'阳','癸':'阴'};

// 地支藏干 (本气/中气/余气)
// 《子平真诠》「支藏之干，以本气为主，中气次之，余气又次之。」
const ZHI_CANGGAN = {
  '子':['癸'],
  '丑':['己','癸','辛'],
  '寅':['甲','丙','戊'],
  '卯':['乙'],
  '辰':['戊','乙','癸'],
  '巳':['丙','庚','戊'],
  '午':['丁','己'],
  '未':['己','丁','乙'],
  '申':['庚','壬','戊'],
  '酉':['辛'],
  '戌':['戊','辛','丁'],
  '亥':['壬','甲']
};

// 六十甲子
const JIAZI = [
  '甲子','乙丑','丙寅','丁卯','戊辰','己巳','庚午','辛未','壬申','癸酉',
  '甲戌','乙亥','丙子','丁丑','戊寅','己卯','庚辰','辛巳','壬午','癸未',
  '甲申','乙酉','丙戌','丁亥','戊子','己丑','庚寅','辛卯','壬辰','癸巳',
  '甲午','乙未','丙申','丁酉','戊戌','己亥','庚子','辛丑','壬寅','癸卯',
  '甲辰','乙巳','丙午','丁未','戊申','己酉','庚戌','辛亥','壬子','癸丑',
  '甲寅','乙卯','丙辰','丁巳','戊午','己未','庚申','辛酉','壬戌','癸亥'
];

// ═══ 六十甲子纳音全表 ═══
// 《渊海子平》「甲子乙丑海中金，丙寅丁卯炉中火…」
const NAYIN_TABLE = [
  '海中金','海中金','炉中火','炉中火','大林木','大林木',
  '路旁土','路旁土','剑锋金','剑锋金','山头火','山头火',
  '涧下水','涧下水','城头土','城头土','白蜡金','白蜡金',
  '杨柳木','杨柳木','泉中水','泉中水','屋上土','屋上土',
  '霹雳火','霹雳火','松柏木','松柏木','长流水','长流水',
  '沙中金','沙中金','山下火','山下火','平地木','平地木',
  '壁上土','壁上土','金箔金','金箔金','覆灯火','覆灯火',
  '天河水','天河水','大驿土','大驿土','钗钏金','钗钏金',
  '桑柘木','桑柘木','大溪水','大溪水','沙中土','沙中土',
  '天上火','天上火','石榴木','石榴木','大海水','大海水'
];

// ═══ 十神关系表 — V3 修正版 ═══
// 《渊海子平》「以日干为主，以月支为令。生我者印，我生者食伤，克我者官杀，我克者财，同我者比劫。」
// 同性为偏: 比肩(同我同性)、食神(我生同性)、偏财(我克同性)、七杀(克我同性)、偏印(生我同性)
// 异性为正: 劫财(同我异性)、伤官(我生异性)、正财(我克异性)、正官(克我异性)、正印(生我异性)
// 键名缩写: 比=比肩, 劫=劫财, 食=食神, 伤=伤官, 财=正财, 才=偏财, 官=正官, 杀=七杀, 印=正印, 枭=偏印
const TENGAN = {
  甲:{比:'甲',劫:'乙',食:'丙',伤:'丁',才:'戊',财:'己',杀:'庚',官:'辛',枭:'壬',印:'癸'},
  乙:{比:'乙',劫:'甲',食:'丁',伤:'丙',才:'己',财:'戊',杀:'辛',官:'庚',枭:'癸',印:'壬'},
  丙:{比:'丙',劫:'丁',食:'戊',伤:'己',才:'庚',财:'辛',杀:'壬',官:'癸',枭:'甲',印:'乙'},
  丁:{比:'丁',劫:'丙',食:'己',伤:'戊',才:'辛',财:'庚',杀:'癸',官:'壬',枭:'乙',印:'甲'},
  戊:{比:'戊',劫:'己',食:'庚',伤:'辛',才:'壬',财:'癸',杀:'甲',官:'乙',枭:'丙',印:'丁'},
  己:{比:'己',劫:'戊',食:'辛',伤:'庚',才:'癸',财:'壬',杀:'乙',官:'甲',枭:'丁',印:'丙'},
  庚:{比:'庚',劫:'辛',食:'壬',伤:'癸',才:'甲',财:'乙',杀:'丙',官:'丁',枭:'戊',印:'己'},
  辛:{比:'辛',劫:'庚',食:'癸',伤:'壬',才:'乙',财:'甲',杀:'丁',官:'丙',枭:'己',印:'戊'},
  壬:{比:'壬',劫:'癸',食:'甲',伤:'乙',才:'丙',财:'丁',杀:'戊',官:'己',枭:'庚',印:'辛'},
  癸:{比:'癸',劫:'壬',食:'乙',伤:'甲',才:'丁',财:'丙',杀:'己',官:'戊',枭:'辛',印:'庚'}
};
const TEGAN_NAMES = {比:'比肩',劫:'劫财',食:'食神',伤:'伤官',财:'正财',才:'偏财',官:'正官',杀:'七杀',印:'正印',枭:'偏印'};

// 长生十二宫起点
// 《三命通会》「甲木长生在亥，丙戊长生在寅，庚金长生在巳，壬水长生在申。」
const CHANGSHENG_START = {
  '甲':'亥','丙':'寅','戊':'寅','庚':'巳','壬':'申',
  '乙':'午','丁':'酉','己':'酉','辛':'子','癸':'卯'
};
const CS_ORDER = ['长生','沐浴','冠带','临官','帝旺','衰','病','死','墓','绝','胎','养'];

// 旬空
const XUN_NAMES = ['甲子','甲戌','甲申','甲午','甲辰','甲寅'];

// ════════════════════════════════════════════════════════════════
//  1. 节气计算（天文太阳黄经算法）
// ════════════════════════════════════════════════════════════════

// 24节气太阳黄经目标值
const JIE_LONGITUDE = {
  '立春':315, '雨水':330, '惊蛰':345, '春分':0,
  '清明':15,  '谷雨':30,  '立夏':45,  '小满':60,
  '芒种':75,  '夏至':90,  '小暑':105, '大暑':120,
  '立秋':135, '处暑':150, '白露':165, '秋分':180,
  '寒露':195, '霜降':210, '立冬':225, '小雪':240,
  '大雪':255, '冬至':270, '小寒':285, '大寒':300
};

// 12节（非中气）对应月支
// 立春→寅, 惊蛰→卯, 清明→辰, 立夏→巳, 芒种→午, 小暑→未
// 立秋→申, 白露→酉, 寒露→戌, 立冬→亥, 大雪→子, 小寒→丑
const JIE_MONTH_MAP = [
  {name:'立春', branchIdx:2}, {name:'惊蛰', branchIdx:3}, {name:'清明', branchIdx:4},
  {name:'立夏', branchIdx:5}, {name:'芒种', branchIdx:6}, {name:'小暑', branchIdx:7},
  {name:'立秋', branchIdx:8}, {name:'白露', branchIdx:9}, {name:'寒露', branchIdx:10},
  {name:'立冬', branchIdx:11}, {name:'大雪', branchIdx:0}, {name:'小寒', branchIdx:1}
];

// 12节近似日期查找表 (1900-2050)
// 基准: [月份(0-based), 日期], 偏移: 0=基准, 1=+1天, a=-1天, 2=+2天
const JIE_DATES = {
  '立春': {base:[1,4], offsets:'001110111011100110011001100110011001100110011000100010001000100010001000100010001000000000000000000000000000000000000a000a000a000a000a000a000a000a000aa'},
  '惊蛰': {base:[2,6], offsets:'000100010001000000000000000000000000000000000000a000a000a000a000a000a000a000a000a000aa00aa00aa00aa00aa00aa00aa00aa00aaa0aaa0aaa0aaa0aaa0aaa0aaa0aaa0aaa'},
  '清明': {base:[3,5], offsets:'0011001100110001000100010001000100010001000100000000000000000000000000000000a000a000a000a000a000a000a000a000aa00aa00aa00aa00aa00aa00aa00aa00aaa0aaa0aaa'},
  '立夏': {base:[4,5], offsets:'1112111211121111111111111111111111111111111101110111011101110111011101110011001100110011001100110011001100010001000100010001000100010000000000000000000'},
  '芒种': {base:[5,6], offsets:'00110001000100010001000100010001000000000000000000000000000000000000a000a000a000a000a000a000a000aa00aa00aa00aa00aa00aa00aa00aaa0aaa0aaa0aaa0aaa0aaa0aaa'},
  '小暑': {base:[6,7], offsets:'011101110111011101110111011100110011001100110011001100110001000100010001000100010001000000000000000000000000000000000000a000a000a000a000a000a000a000aa0'},
  '立秋': {base:[7,8], offsets:'000100010001000000000000000000000000000000000000a000a000a000a000a000a000a000aa00aa00aa00aa00aa00aa00aa00aaa0aaa0aaa0aaa0aaa0aaa0aaa0aaaaaaaaaaaaaaaaaaa'},
  '白露': {base:[8,8], offsets:'000100010001000100010001000100000000000000000000000000000000a000a000a000a000a000a000a000aa00aa00aa00aa00aa00aa00aa00aa00aaa0aaa0aaa0aaa0aaa0aaa0aaa0aaa'},
  '寒露': {base:[9,8], offsets:'111111111111111101110111011101110111011101110011001100110011001100110011001100010001000100010001000100010001000000000000000000000000000000000000a000a00'},
  '立冬': {base:[10,7], offsets:'1111111111111111111111111111011101110111011101110111011101110011001100110011001100110011001100010001000100010001000100010001000000000000000000000000000'},
  '大雪': {base:[11,7], offsets:'0111011101110111011100110011001100110011001100110011000100010001000100010001000100010000000000000000000000000000000000000000a000a000a000a000a000a000a00'},
  '小寒': {base:[0,6], offsets:'0000100010001000000000000000000000000000000000000a000a000a000a000a000a000a000a000a000aa00aa00aa00aa00aa00aa00aa00aa00aaa0aaa0aaa0aaa0aaa0aaa0aaa0aaa0aa'}
};

/**
 * 获取某年某节的近似日期 (日级精度, 从查找表读取)
 * @param {number} year - 公历年份
 * @param {string} jieName - 节气名称
 * @returns {Date|null}
 */
function getJieDate(year, jieName) {
  var info = JIE_DATES[jieName];
  if (!info) return null;
  var idx = year - 1900;
  if (idx < 0 || idx >= info.offsets.length) return null;
  var ch = info.offsets[idx];
  var offset = 0;
  if (ch === 'a') offset = -1;
  else if (ch === '1') offset = 1;
  else if (ch === '2') offset = 2;
  return new Date(year, info.base[0], info.base[1] + offset);
}

/**
 * 太阳黄经计算 (基于 Jean Meeus《天文算法》VSOP87 截断级数)
 * 标准天文算法，截断至主要周期项，误差 < 0.01°, 对应时间误差 < 5分钟
 * @param {number} jd - 儒略日
 * @returns {number} 太阳黄经 (0-360度)
 */
function solarLongitudeJ2000(jd) {
  var T = (jd - 2451545.0) / 36525.0;
  var L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  var M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  var Mrad = M * Math.PI / 180;
  var C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mrad)
        + (0.019993 - 0.000101 * T) * Math.sin(2 * Mrad)
        + 0.000289 * Math.sin(3 * Mrad);
  var lambda = L0 + C;
  // 章动修正 (标准天文算法, 精度 sufficient for 节气判断)
  var omega = 125.04 - 1934.136 * T;
  lambda = lambda - 0.00569 - 0.00478 * Math.sin(omega * Math.PI / 180);
  return ((lambda % 360) + 360) % 360;
}

/**
 * 公历日期转儒略日
 * @param {Date} date
 * @returns {number}
 */
function jdFromDate(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

/**
 * 儒略日转公历日期
 * @param {number} jd
 * @returns {Date}
 */
function dateFromJd(jd) {
  return new Date((jd - 2440587.5) * 86400000);
}

/**
 * 获取某年某节的精确时刻 (天文算法, 分钟级精度)
 * 在近似日期前后3天内扫描太阳黄经, 二分法精确定位
 * @param {number} year
 * @param {string} jieName
 * @returns {Date|null}
 */
function getPreciseJieTime(year, jieName) {
  var targetLng = JIE_LONGITUDE[jieName];
  if (targetLng === undefined) return getJieDate(year, jieName);
  var approx = getJieDate(year, jieName);
  if (!approx) return null;
  // 在近似日期前后3天内扫描
  var jdStart = jdFromDate(new Date(approx.getTime() - 3 * 86400000));
  var jdEnd = jdFromDate(new Date(approx.getTime() + 3 * 86400000));
  var step = 0.02; // ~30 min
  var prevLng = solarLongitudeJ2000(jdStart);
  var prevJd = jdStart;
  for (var jd = jdStart + step; jd <= jdEnd; jd += step) {
    var lng = solarLongitudeJ2000(jd);
    var dPrev = ((targetLng - prevLng + 360) % 360);
    var dCurr = ((targetLng - lng + 360) % 360);
    // 检测跨越目标黄经 (太阳黄经递增, 正向越过)
    // 正向越过: dPrev 小(接近0) → dCurr 大(接近360, 即刚越过)
    // 也检测 0° 附近的环绕情况
    if ((dPrev < 60 && dCurr > 300) || (dPrev > 300 && dCurr < 60)) {
      // 二分法精确查找
      var lo = prevJd, hi = jd;
      for (var i = 0; i < 50; i++) {
        var mid = (lo + hi) / 2;
        var midLng = solarLongitudeJ2000(mid);
        var dMid = ((targetLng - midLng + 360) % 360);
        // 正向跨越: dMid > 180 表示已越过目标 (lng > target)
        if (dMid > 180) hi = mid; else lo = mid;
        if (hi - lo < 0.000001) break;
      }
      return dateFromJd((lo + hi) / 2);
    }
    prevLng = lng;
    prevJd = jd;
  }
  return approx; // 回退
}

// ════════════════════════════════════════════════════════════════
//  2. 日柱计算 (儒略日法)
// ════════════════════════════════════════════════════════════════

/**
 * 计算儒略日数 (Julian Day Number)
 * 《历代天文律历等通算》标准公式
 */
function toJDN(year, month, day) {
  var a = Math.floor((14 - month) / 12);
  var y = year + 4800 - a;
  var m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

/**
 * 日干索引 (0=甲, 基于 JDN)
 * 以 2024-04-30 (甲子日, JDN=2460431) 为参考点验证
 * 甲子日 JDN%10 应得 0(甲)
 *
 * 《渊海子平》「日柱者，命之主也，以子正交时为分界。」
 */
function getDayStemIndex(year, month, day) {
  var jdn = toJDN(year, month, day);
  // 2024-04-30 = 甲子日, jdn=2460431, 2460431%10=1 → (1-1)%10=0=甲 ✓
  return ((jdn - 1) % 10 + 10) % 10;
}

/**
 * 日支索引 (0=子, 基于 JDN)
 * 2024-04-30 = 甲子日, jdn=2460431, 2460431%12=7 → (7+1)%12=8? 
 * 修正: 2460431%12=7, 子=0 → (7+1)%12=8=申? 不对
 * 实际: jdn=2460431 → 2460431 % 12 = 7, 但子=0
 * 甲子日 n=0, jdn%12=7 → 需要 (7-7+0)%12=0? 
 * 正确公式: (jdn + 1) % 12 → 2460432%12 = 8? 
 * 验证: jdn=2460431, (2460431+1)%12 = 2460432%12 = 8 ≠ 0
 * 再验证: 2460431 % 12 = 7, 需要 0(子)
 * 所以公式: (jdn - 7) % 12? → 但7只对此日有效
 * 通用: 甲子日 jdn=2460431, n=0(六十甲子序)
 * n = (jdn - 2460431) mod 60, stemIdx = n%10, branchIdx = n%12
 */
function getDayBranchIndex(year, month, day) {
  var jdn = toJDN(year, month, day);
  // 以 2024-04-30 甲子日为基准
  var diff = jdn - 2460431;
  return ((diff % 12) + 12) % 12;
}

/**
 * 重写: 日干支索引 (统一基准, 消除歧义)
 * 基准: 2024-04-30 = 甲子 (六十甲子序=0)
 */
function getDayGanZhiIndex(year, month, day) {
  var jdn = toJDN(year, month, day);
  var diff = jdn - 2460431; // 2024-04-30 = 甲子
  return ((diff % 60) + 60) % 60;
}

function getDayStemIndexV3(year, month, day) {
  return getDayGanZhiIndex(year, month, day) % 10;
}

function getDayBranchIndexV3(year, month, day) {
  return getDayGanZhiIndex(year, month, day) % 12;
}

// ════════════════════════════════════════════════════════════════
//  3. 年柱计算 (以立春为界)
// ════════════════════════════════════════════════════════════════

/**
 * 年柱计算 — 精确到立春时刻
 *
 * 《三命通会》「立春为岁首，交节为月始。」
 * 《渊海子平》「年柱以立春为界，非以正月初一。」
 * 《子平真诠》「如正月初二立春，初一日仍作上年事。」
 *
 * 立春多在2月3-5日，精确时刻需天文计算。
 * 立春前出生者，年柱属上一年。
 *
 * @param {number} year - 公历年份
 * @param {number} month - 公历月份 (1-12)
 * @param {number} day - 公历日
 * @param {number} hour - 出生时辰 (0-23)
 * @param {number} minute - 出生分钟 (0-59)
 * @returns {{stemIdx, branchIdx, stem, branch}}
 */
function getYearStemBranchExact(year, month, day, hour, minute) {
  hour = hour || 12;
  minute = minute || 0;
  var birthDate = new Date(year, month - 1, day, hour, minute);

  // 获取当年和上年立春精确时刻
  var lichun = getPreciseJieTime(year, '立春');
  if (!lichun) {
    // 回退: 立春约在2月4日
    lichun = new Date(year, 1, 4, 12, 0);
  }

  // 立春前: 年柱属上一年
  var baseYear = (birthDate < lichun) ? year - 1 : year;

  // 以4年为甲子年基准: 4年=甲子, (year-4)%10=天干, (year-4)%12=地支
  var stemIdx = ((baseYear - 4) % 10 + 10) % 10;
  var branchIdx = ((baseYear - 4) % 12 + 12) % 12;

  return {
    stemIdx: stemIdx,
    branchIdx: branchIdx,
    stem: STEMS[stemIdx],
    branch: BRANCHES[branchIdx]
  };
}

// ════════════════════════════════════════════════════════════════
//  4. 月柱计算 (以节气定月支, 五虎遁定月干)
// ════════════════════════════════════════════════════════════════

/**
 * 月支计算 — 以12节为界
 *
 * 《渊海子平》「月支以节气为界，非以朔日为始。」
 * 寅月=立春~惊蛰, 卯月=惊蛰~清明, 辰月=清明~立夏...
 * 节气当天属于新的一月。
 *
 * @param {number} year
 * @param {number} month
 * @param {number} day
 * @param {number} hour
 * @param {number} minute
 * @returns {number} 月支索引 (0=子, 1=丑, 2=寅...)
 */
function getMonthBranchExact(year, month, day, hour, minute) {
  hour = hour || 12;
  minute = minute || 0;
  var birthDate = new Date(year, month - 1, day, hour, minute);

  // 12节按时间顺序排列 (从上年大雪开始)
  // 大雪(上年12月)→小寒(1月)→立春(2月)→惊蛰(3月)→清明(4月)→立夏(5月)→芒种(6月)
  // →小暑(7月)→立秋(8月)→白露(9月)→寒露(10月)→立冬(11月)→大雪(12月)
  var jieList = [
    {name:'大雪', branchIdx:0, yearOffset:-1},  // 上年12月
    {name:'小寒', branchIdx:1, yearOffset:0},   // 当年1月
    {name:'立春', branchIdx:2, yearOffset:0},   // 当年2月
    {name:'惊蛰', branchIdx:3, yearOffset:0},   // 当年3月
    {name:'清明', branchIdx:4, yearOffset:0},   // 当年4月
    {name:'立夏', branchIdx:5, yearOffset:0},   // 当年5月
    {name:'芒种', branchIdx:6, yearOffset:0},   // 当年6月
    {name:'小暑', branchIdx:7, yearOffset:0},   // 当年7月
    {name:'立秋', branchIdx:8, yearOffset:0},   // 当年8月
    {name:'白露', branchIdx:9, yearOffset:0},   // 当年9月
    {name:'寒露', branchIdx:10, yearOffset:0},  // 当年10月
    {name:'立冬', branchIdx:11, yearOffset:0},  // 当年11月
    {name:'大雪', branchIdx:0, yearOffset:0}    // 当年12月
  ];

  // 遍历所有节, 找最后一个 birthDate >= jieDate 的
  var monthIdx = 1; // 默认丑月(1月小寒前)
  for (var i = 0; i < jieList.length; i++) {
    var jq = jieList[i];
    var jieYear = year + (jq.yearOffset || 0);
    var jieDate = getPreciseJieTime(jieYear, jq.name);
    if (jieDate && birthDate >= jieDate) {
      monthIdx = jq.branchIdx;
    }
  }

  return monthIdx;
}

/**
 * 月干计算 — 五虎遁
 *
 * 《渊海子平》「五虎遁元歌:
 *   甲己之年丙作首, 乙庚之年戊为头,
 *   丙辛之岁寻庚上, 丁壬壬寅顺水流,
 *   戊癸甲寅好追求。」
 *
 * 即: 年干甲/己 → 寅月天干为丙(2)
 *     年干乙/庚 → 寅月天干为戊(4)
 *     年干丙/辛 → 寅月天干为庚(6)
 *     年干丁/壬 → 寅月天干为壬(8)
 *     年干戊/癸 → 寅月天干为甲(0)
 *
 * 公式: yinMonthGanIdx = (yearStemIdx * 2 + 2) % 10
 * 月干 = (yinMonthGanIdx + 月支序号相对寅的偏移) % 10
 *
 * @param {number} yearStemIdx - 年干索引
 * @param {number} monthBranchIdx - 月支索引 (0=子, 1=丑, 2=寅...)
 * @returns {number} 月干索引
 */
function getMonthStem(yearStemIdx, monthBranchIdx) {
  // 五虎遁: 寅月天干索引
  // 甲(0)己(5)→丙(2), 乙(1)庚(6)→戊(4), 丙(2)辛(7)→庚(6), 丁(3)壬(8)→壬(8), 戊(4)癸(9)→甲(0)
  // 公式: (yearStemIdx * 2 + 2) % 10
  var yinMonthGanIdx = (yearStemIdx * 2 + 2) % 10;

  // 月支相对寅的偏移: 寅=0, 卯=1, 辰=2, 巳=3, 午=4, 未=5, 申=6, 酉=7, 戌=8, 亥=9, 子=10, 丑=11
  var offsetFromYin = (monthBranchIdx - 2 + 12) % 12;

  return (yinMonthGanIdx + offsetFromYin) % 10;
}

/**
 * 月柱完整计算
 * @returns {{stemIdx, branchIdx, stem, branch}}
 */
function getMonthPillar(year, month, day, hour, minute, yearStemIdx) {
  var mBranchIdx = getMonthBranchExact(year, month, day, hour, minute);
  var mStemIdx = getMonthStem(yearStemIdx, mBranchIdx);
  return {
    stemIdx: mStemIdx,
    branchIdx: mBranchIdx,
    stem: STEMS[mStemIdx],
    branch: BRANCHES[mBranchIdx]
  };
}

// ════════════════════════════════════════════════════════════════
//  5. 时柱计算 (五鼠遁, 早子/晚子处理)
// ════════════════════════════════════════════════════════════════

/**
 * 时支索引 — 将小时转为地支索引
 *
 * 《渊海子平》「子时: 23:00-01:00, 丑时: 01:00-03:00...」
 *
 * 早子/晚子处理:
 *   - 早子时: 00:00-01:00 → 当日子时, 日柱不变
 *   - 晚子时: 23:00-24:00 → 当日子时(部分流派) 或 次日子时(换日派)
 *   - V3 采用: 晚子时换日 (23:00后日柱进一位)
 *
 * @param {number} hour - 0-23
 * @returns {number} 时支索引 (0=子)
 */
function getHourBranchIndex(hour) {
  // 子时(23,0)→0, 丑时(1,2)→1, 寅时(3,4)→2...
  // 23点归为子时
  if (hour === 23) return 0;
  return Math.floor((hour + 1) / 2) % 12;
}

/**
 * 时干计算 — 五鼠遁
 *
 * 《渊海子平》「五鼠遁元歌:
 *   甲己还加甲, 乙庚丙作初,
 *   丙辛从戊起, 丁壬庚子居,
 *   戊癸何方发, 壬子是真途。」
 *
 * 即: 日干甲/己 → 子时天干为甲(0)
 *     日干乙/庚 → 子时天干为丙(2)
 *     日干丙/辛 → 子时天干为戊(4)
 *     日干丁/壬 → 子时天干为庚(6)
 *     日干戊/癸 → 子时天干为壬(8)
 *
 * 公式: ziHourGanIdx = (dayStemIdx * 2) % 10
 * 时干 = (ziHourGanIdx + hourBranchIdx) % 10
 *
 * @param {number} dayStemIdx - 日干索引
 * @param {number} hourBranchIdx - 时支索引
 * @returns {number} 时干索引
 */
function getHourStem(dayStemIdx, hourBranchIdx) {
  // 五鼠遁: 子时天干 = (dayStemIdx * 2) % 10
  var ziHourGanIdx = (dayStemIdx * 2) % 10;
  return (ziHourGanIdx + hourBranchIdx) % 10;
}

/**
 * 时柱完整计算 (含晚子换日)
 *
 * 《三命通会》「子时分早子晚子, 23-1时为子时。
 *  晚子(23-24)属当夜, 早子(0-1)属次日。
 *  然古法以子正(0:00)为日界, 23-0时仍属当日, 0-1时属次日。
 *  另有以子初(23:00)为日界者, 23后即换日。」
 *
 * V3 默认采用子正换日(0:00换日), 即23-24时仍属当日。
 * 可通过 zishiMode 参数选择 'late' (子初换日) 或 'normal' (子正换日)。
 *
 * @param {number} year
 * @param {number} month
 * @param {number} day
 * @param {number} hour
 * @param {number} dayStemIdx - 当日日干索引
 * @param {string} zishiMode - 'normal'(子正换日) | 'late'(子初换日)
 * @returns {{stemIdx, branchIdx, stem, branch, dayShift}}
 */
function getHourPillar(year, month, day, hour, dayStemIdx, zishiMode) {
  zishiMode = zishiMode || 'normal';
  var dayShift = 0;

  // 晚子换日: 23点后日柱进一位
  if (zishiMode === 'late' && hour >= 23) {
    dayShift = 1;
    dayStemIdx = (dayStemIdx + 1) % 10;
  }

  var hBranchIdx = getHourBranchIndex(hour);
  var hStemIdx = getHourStem(dayStemIdx, hBranchIdx);

  return {
    stemIdx: hStemIdx,
    branchIdx: hBranchIdx,
    stem: STEMS[hStemIdx],
    branch: BRANCHES[hBranchIdx],
    dayShift: dayShift
  };
}

// ════════════════════════════════════════════════════════════════
//  6. 十神计算
// ════════════════════════════════════════════════════════════════

/**
 * 十神计算 — 以日主为基准
 *
 * 《渊海子平》「以日干为主，以月支为令。
 *   生我者正印/偏印，我生者食神/伤官，
 *   克我者正官/七杀，我克者正财/偏财，
 *   同我者比肩/劫财。」
 *
 * 同性为偏: 比肩(同我同性)、食神(我生同性)、偏财(我克同性)、七杀(克我同性)、偏印(生我同性)
 * 异性为正: 劫财(同我异性)、伤官(我生异性)、正财(我克异性)、正官(克我异性)、正印(生我异性)
 *
 * @param {string} stem - 待查天干
 * @param {string} dayStem - 日主天干
 * @returns {string} 十神名称
 */
function getTenGod(stem, dayStem) {
  if (!stem || !dayStem) return '';
  var tenGodMap = TENGAN[dayStem];
  if (!tenGodMap) return '';
  for (var rel in tenGodMap) {
    if (tenGodMap[rel] === stem) return TEGAN_NAMES[rel];
  }
  return '';
}

/**
 * 地支藏干十神 (取本气)
 * @param {string} branch - 地支
 * @param {string} dayStem - 日主
 * @returns {string} 本气十神
 */
function getBranchTenGod(branch, dayStem) {
  var canggan = ZHI_CANGGAN[branch] || [];
  if (canggan.length === 0) return '';
  return getTenGod(canggan[0], dayStem);
}

/**
 * 地支所有藏干十神列表
 * @returns {Array<{stem, god, isBen}>}
 */
function getBranchAllTenGods(branch, dayStem) {
  var canggan = ZHI_CANGGAN[branch] || [];
  var result = [];
  for (var i = 0; i < canggan.length; i++) {
    var god = getTenGod(canggan[i], dayStem);
    result.push({
      stem: canggan[i],
      god: god,
      isBen: i === 0
    });
  }
  return result;
}

// ════════════════════════════════════════════════════════════════
//  7. 大运计算
// ════════════════════════════════════════════════════════════════

/**
 * 大运计算 — 阳男阴女顺排, 阴男阳女逆排
 *
 * 《渊海子平》「大运从月柱起，阳男阴女顺行，阴男阳女逆行。」
 * 《子平真诠》「起运岁数: 三日折一岁, 一日折四个月, 一时折十天。」
 *
 * 起运岁数计算:
 *   - 顺行: 从出生时刻到下一个节的天数
 *   - 逆行: 从出生时刻到上一个节的天数
 *   - 3天 = 1年, 1天 = 4个月, 1时辰(2小时) = 10天
 *   - 即: 72小时 = 1年, 6小时 = 1月, 2小时 = 10天
 *
 * @param {Array} pillars - 四柱
 * @param {string} sex - 'male' | 'female'
 * @param {number} birthYear
 * @param {number} birthMonth
 * @param {number} birthDay
 * @param {number} birthHour
 * @param {number} dayStemIdx - 日干索引
 * @param {string} dayMasterEle - 日主五行
 * @returns {Array} 大运列表 (8步)
 */
function computeDayun(pillars, sex, birthYear, birthMonth, birthDay, birthHour, dayStemIdx, dayMasterEle) {
  var result = [];
  var startZhi = BRANCHES.indexOf(pillars[1].branch);
  var startGan = STEMS.indexOf(pillars[1].stem);

  // 起运方向: 阳男阴女顺行, 阴男阳女逆行
  var yearStemIdx = STEMS.indexOf(pillars[0].stem);
  var isYang = yearStemIdx % 2 === 0;
  var isMale = sex === 'male';
  var direction = (isYang && isMale) || (!isYang && !isMale) ? 1 : -1;

  // ═══ 精确起运年龄 (对标 lunar_python) ═══
  var qiyunAge = 0;
  var qiyunDetail = '';
  try {
    var birthDate = new Date(birthYear, birthMonth - 1, birthDay, birthHour || 12, 0);
    var JIE_12 = ['立春','惊蛰','清明','立夏','芒种','小暑','立秋','白露','寒露','立冬','大雪','小寒'];
    var targetJie = null;

    if (direction === 1) {
      // 顺行: 找出生时刻之后的下一个节
      for (var y = birthYear; y <= birthYear + 1; y++) {
        for (var j = 0; j < 12; j++) {
          var jieDate = getPreciseJieTime(y, JIE_12[j]);
          if (jieDate && jieDate > birthDate) { targetJie = jieDate; break; }
        }
        if (targetJie) break;
      }
    } else {
      // 逆行: 找出生时刻之前的上一个节
      for (var y2 = birthYear; y2 >= birthYear - 1; y2--) {
        for (var j2 = 11; j2 >= 0; j2--) {
          var jieDate2 = getPreciseJieTime(y2, JIE_12[j2]);
          if (jieDate2 && jieDate2 < birthDate) { targetJie = jieDate2; break; }
        }
        if (targetJie) break;
      }
    }

    if (targetJie) {
      var diffMs = Math.abs(targetJie - birthDate);
      var totalHours = diffMs / 3600000;
      // 3天=1年 → 72小时=1年
      // 1月=6小时, 1时辰(2小时)=10天
      var years = Math.floor(totalHours / 72);
      var rem = totalHours % 72;
      var months = Math.floor(rem / 6);
      var rem2 = rem % 6;
      var shichen = Math.floor(rem2 / 2);
      var days = shichen * 10;
      qiyunAge = years + months / 12 + days / 360;
      qiyunAge = Math.round(qiyunAge * 1000) / 1000;
      qiyunDetail = years + '岁' + months + '月' + days + '天';
    } else {
      qiyunAge = 1;
      qiyunDetail = '1岁(回退)';
    }
  } catch (e) {
    qiyunAge = 1;
    qiyunDetail = '1岁(异常回退)';
  }

  // 排8步大运
  for (var i = 0; i < 8; i++) {
    var zhiIdx = (startZhi + (i + 1) * direction + 120) % 12;
    var ganIdx = (startGan + (i + 1) * direction + 100) % 10;
    var gan = STEMS[ganIdx];
    var zhi = BRANCHES[zhiIdx];

    var ageStart = Math.round((qiyunAge + i * 10) * 10) / 10;
    var ageEnd = Math.round((qiyunAge + (i + 1) * 10) * 10) / 10;
    var yearStart = birthYear + Math.floor(ageStart);
    var yearEnd = birthYear + Math.floor(ageEnd);

    var ganEle = ELE[gan];
    var zhiEle = ZHI_ELE[zhi];

    // 天干十神
    var ganShen = getTenGod(gan, STEMS[dayStemIdx]);
    // 地支藏干十神
    var zhiCanggan = ZHI_CANGGAN[zhi] || [];
    var zhiShenList = zhiCanggan.map(function(cg) { return getTenGod(cg, STEMS[dayStemIdx]); });
    var zhiShen = zhiShenList.join('/');

    // 长生十二宫
    var dishi = getDishi(STEMS[dayStemIdx], zhi);

    // 喜忌判断
    var isXi = dayMasterEle && (ganEle === dayMasterEle || zhiEle === dayMasterEle);
    var isJi = dayMasterEle && (ganEle === getKeEle(dayMasterEle) || zhiEle === getKeEle(dayMasterEle));

    result.push({
      index: i + 1,
      gan: gan,
      zhi: zhi,
      ganEle: ganEle,
      zhiEle: zhiEle,
      ageStart: ageStart,
      ageEnd: ageEnd,
      yearStart: yearStart,
      yearEnd: yearEnd,
      ganShen: ganShen,
      zhiShen: zhiShen,
      dishi: dishi,
      isXi: isXi,
      isJi: isJi,
      qiyunAge: i === 0 ? qiyunAge : null,
      qiyunDetail: i === 0 ? qiyunDetail : null
    });
  }
  return result;
}

/**
 * 克我者的五行
 */
function getKeEle(ele) {
  for (var k in WUXING_KE) {
    if (WUXING_KE[k] === ele) return k;
  }
  return '';
}

// ════════════════════════════════════════════════════════════════
//  8. 纳音五行
// ════════════════════════════════════════════════════════════════

/**
 * 纳音五行计算
 *
 * 《渊海子平》「甲子乙丑海中金, 丙寅丁卯炉中火,
 *   戊辰己巳大林木, 庚午辛未路旁土…」
 *
 * 六十甲子每两对干支对应一个纳音, 共30种纳音。
 *
 * @param {number} stemIdx - 天干索引
 * @param {number} branchIdx - 地支索引
 * @returns {string} 纳音名称 (如「海中金」)
 */
function getNayin(stemIdx, branchIdx) {
  var ganzhi = STEMS[stemIdx] + BRANCHES[branchIdx];
  var idx = JIAZI.indexOf(ganzhi);
  if (idx < 0) return '';
  return NAYIN_TABLE[idx] || '';
}

/**
 * 纳音五行提取
 * @param {string} nayin - 纳音名称 (如「海中金」)
 * @returns {string} 五行 (如「金」)
 */
function getNayinElement(nayin) {
  if (!nayin) return '';
  var last = nayin.charAt(nayin.length - 1);
  if ('木火土金水'.indexOf(last) >= 0) return last;
  return '';
}

// ════════════════════════════════════════════════════════════════
//  9. 神煞计算
// ════════════════════════════════════════════════════════════════

/**
 * 天乙贵人
 *
 * 《渊海子平》「天乙贵人歌:
 *   甲戊庚牛羊, 乙己鼠猴乡,
 *   丙丁猪鸡位, 壬癸兔蛇藏,
 *   辛人逢虎马, 此是贵人方。」
 *
 * 即:
 *   甲(0)/戊(4)/庚(6) → 丑(1)/未(7)
 *   乙(1)/己(5)       → 子(0)/申(8)
 *   丙(2)/丁(3)       → 亥(11)/酉(9)
 *   壬(8)/癸(9)       → 卯(3)/巳(5)
 *   辛(7)             → 寅(2)/午(6)
 */
const TIANYI_MAP = {
  0:[1,7],  // 甲 → 丑、未
  4:[1,7],  // 戊 → 丑、未
  6:[1,7],  // 庚 → 丑、未
  1:[0,8],  // 乙 → 子、申
  5:[0,8],  // 己 → 子、申
  2:[11,9], // 丙 → 亥、酉
  3:[11,9], // 丁 → 亥、酉
  8:[3,5],  // 壬 → 卯、巳
  9:[3,5],  // 癸 → 卯、巳
  7:[2,6]   // 辛 → 寅、午
};

/**
 * 文昌贵人
 * 《三命通会》「甲见巳, 乙见午, 丙见申, 丁见酉, 戊见申,
 *   己见酉, 庚见亥, 辛见子, 壬见寅, 癸见卯。」
 */
const WENCHANG_MAP = {0:'巳',1:'午',2:'申',3:'酉',4:'申',5:'酉',6:'亥',7:'子',8:'寅',9:'卯'};

/**
 * 桃花 (年支/日支查)
 * 《渊海子平》「申子辰桃花在酉, 寅午戌桃花在卯,
 *   巳酉丑桃花在午, 亥卯未桃花在子。」
 */
const TAOHUA_MAP = {
  '寅':'卯','午':'卯','戌':'卯',
  '申':'酉','子':'酉','辰':'酉',
  '巳':'午','酉':'午','丑':'午',
  '亥':'子','卯':'子','未':'子'
};

/**
 * 驿马 (年支查)
 * 《渊海子平》「申子辰马在寅, 寅午戌马在申,
 *   巳酉丑马在亥, 亥卯未马在巳。」
 */
const YIMA_MAP = {
  '寅':'申','午':'申','戌':'申',
  '申':'寅','子':'寅','辰':'寅',
  '巳':'亥','酉':'亥','丑':'亥',
  '亥':'巳','卯':'巳','未':'巳'
};

/**
 * 华盖 (年支/日支查)
 * 《渊海子平》「申子辰华盖在辰, 寅午戌华盖在戌,
 *   巳酉丑华盖在丑, 亥卯未华盖在未。」
 */
const HUAGAI_MAP = {
  '寅':'戌','午':'戌','戌':'戌',
  '申':'辰','子':'辰','辰':'辰',
  '巳':'丑','酉':'丑','丑':'丑',
  '亥':'未','卯':'未','未':'未'
};

/**
 * 羊刃 (日干查)
 * 《渊海子平》「甲羊刃在卯, 乙在辰, 丙戊在午, 丁己在未,
 *   庚在酉, 辛在戌, 壬在子, 癸在丑。」
 */
const YANGREN_MAP = {0:'卯',1:'辰',2:'午',3:'未',4:'午',5:'未',6:'酉',7:'戌',8:'子',9:'丑'};

/**
 * 禄神 (日干查)
 * 《三命通会》「甲禄寅, 乙禄卯, 丙戊禄巳, 丁己禄午,
 *   庚禄申, 辛禄酉, 壬禄亥, 癸禄子。」
 */
const LUSHEN_MAP = {0:'寅',1:'卯',2:'巳',3:'午',4:'巳',5:'午',6:'申',7:'酉',8:'亥',9:'子'};

/**
 * 将星 (年支查)
 * 《三命通会》「申子辰将星在子, 寅午戌将星在午,
 *   巳酉丑将星在酉, 亥卯未将星在卯。」
 */
const JIANGXING_MAP = {
  '寅':'午','午':'午','戌':'午',
  '申':'子','子':'子','辰':'子',
  '巳':'酉','酉':'酉','丑':'酉',
  '亥':'卯','卯':'卯','未':'卯'
};

/**
 * 神煞判定
 * @param {Array} pillars - 四柱 [{stem, branch, stemIdx, branchIdx}...]
 * @param {number} dayStemIdx
 * @returns {Array} 神煞列表
 */
function getShensha(pillars, dayStemIdx) {
  var yBranch = pillars[0].branch;
  var mBranch = pillars[1].branch;
  var dBranch = pillars[2].branch;
  var hBranch = pillars[3].branch;
  var allBranches = [yBranch, mBranch, dBranch, hBranch];
  var dayStem = STEMS[dayStemIdx];
  var result = [];

  // 天乙贵人
  var tianyiIdxs = TIANYI_MAP[dayStemIdx] || [];
  var hasTianyi = false;
  for (var i = 0; i < allBranches.length; i++) {
    if (tianyiIdxs.indexOf(BRANCHES.indexOf(allBranches[i])) >= 0) { hasTianyi = true; break; }
  }
  if (hasTianyi) result.push({name:'天乙贵人', desc:'吉星高照，逢凶化吉，贵人多助。'});

  // 文昌贵人
  var wcTarget = WENCHANG_MAP[dayStemIdx];
  if (wcTarget && allBranches.indexOf(wcTarget) >= 0) {
    result.push({name:'文昌贵人', desc:'学业之星，利考试、学习、著述。'});
  }

  // 桃花 (年支/日支查)
  var taoTargets = [TAOHUA_MAP[yBranch], TAOHUA_MAP[dBranch]];
  var hasTao = false;
  for (var i2 = 0; i2 < allBranches.length; i2++) {
    if (taoTargets.indexOf(allBranches[i2]) >= 0) { hasTao = true; break; }
  }
  if (hasTao) result.push({name:'桃花', desc:'感情丰富，人缘佳，姻缘运强。'});

  // 驿马 (年支查)
  var maTarget = YIMA_MAP[yBranch];
  if (maTarget && [mBranch, dBranch, hBranch].indexOf(maTarget) >= 0) {
    result.push({name:'驿马', desc:'奔波走动之象，适合外出、调动。'});
  }

  // 华盖 (年支/日支查)
  var hgTargets = [HUAGAI_MAP[yBranch], HUAGAI_MAP[dBranch]];
  var hasHg = false;
  for (var i3 = 0; i3 < allBranches.length; i3++) {
    if (hgTargets.indexOf(allBranches[i3]) >= 0) { hasHg = true; break; }
  }
  if (hasHg) result.push({name:'华盖', desc:'艺术之星，利于学术研究，性情孤高。'});

  // 羊刃 (日干查, 月支为真刃)
  var yrTarget = YANGREN_MAP[dayStemIdx];
  if (yrTarget) {
    if (mBranch === yrTarget) result.push({name:'月刃（真羊刃）', desc:'刚暴之星在月令，慎防血光官非。'});
    else if (allBranches.indexOf(yrTarget) >= 0) result.push({name:'羊刃', desc:'刚毅果断，慎防血光。'});
  }

  // 将星 (年支查)
  var jiangTarget = JIANGXING_MAP[yBranch];
  if (jiangTarget && allBranches.indexOf(jiangTarget) >= 0) {
    result.push({name:'将星', desc:'掌权之星，利于军警、领导岗位。'});
  }

  // 禄神 (日干查)
  var lsTarget = LUSHEN_MAP[dayStemIdx];
  if (lsTarget && allBranches.indexOf(lsTarget) >= 0) {
    result.push({name:'禄神', desc:'食禄之星，主衣食无忧。'});
  }

  // 魁罡 (日柱为庚辰/庚戌/壬辰/戊戌)
  var kgDays = ['庚辰','庚戌','壬辰','戊戌'];
  var dayPillar = dayStem + dBranch;
  if (kgDays.indexOf(dayPillar) >= 0) {
    result.push({name:'魁罡', desc:'性格刚烈果断，聪敏有领导才能。'});
  }

  return result;
}

// ════════════════════════════════════════════════════════════════
//  10. 长生十二宫
// ════════════════════════════════════════════════════════════════

/**
 * 长生十二宫
 * 《三命通会》「甲木长生在亥, 丙戊长生在寅, 庚金长生在巳, 壬水长生在申。
 *   阴干逆行: 乙长生在午, 丁己长生在酉, 辛长生在子, 癸长生在卯。」
 *
 * @param {string} gan - 天干
 * @param {string} zhi - 地支
 * @returns {string} 长生十二宫阶段
 */
function getDishi(gan, zhi) {
  var start = CHANGSHENG_START[gan];
  if (!start) return '';
  var forward = (GAN_YINYANG[gan] === '阳');
  var si = BRANCHES.indexOf(start);
  var zi = BRANCHES.indexOf(zhi);
  var step = forward ? ((zi - si + 12) % 12) : ((si - zi + 12) % 12);
  return CS_ORDER[step];
}

// ════════════════════════════════════════════════════════════════
//  11. 旬空 / 胎元 / 命宫
// ════════════════════════════════════════════════════════════════

/**
 * 旬空计算
 * 《渊海子平》「旬空者，十日为一旬，旬中空亡二字地支。」
 * 甲子旬空戌亥, 甲戌旬空申酉, 甲申旬空午未...
 */
function getXunKong(dayStem, dayBranch) {
  var stemIdx = STEMS.indexOf(dayStem);
  var branchIdx = BRANCHES.indexOf(dayBranch);
  var n = -1;
  for (var i = 0; i < 60; i++) {
    if (i % 10 === stemIdx && i % 12 === branchIdx) { n = i; break; }
  }
  if (n < 0) return '';
  var xunIdx = Math.floor(n / 10);
  var kong1 = BRANCHES[(xunIdx * 10 + 10) % 12];
  var kong2 = BRANCHES[(xunIdx * 10 + 11) % 12];
  return kong1 + kong2;
}

/**
 * 旬名
 */
function getXunName(dayStem, dayBranch) {
  var stemIdx = STEMS.indexOf(dayStem);
  var branchIdx = BRANCHES.indexOf(dayBranch);
  for (var i = 0; i < 60; i++) {
    if (i % 10 === stemIdx && i % 12 === branchIdx) {
      return XUN_NAMES[Math.floor(i / 10)];
    }
  }
  return '';
}

/**
 * 胎元
 * 《渊海子平》「胎元: 月干进一位, 月支进三位。」
 */
function getTaiYuan(monthStem, monthBranch) {
  var si = STEMS.indexOf(monthStem);
  var bi = BRANCHES.indexOf(monthBranch);
  return STEMS[(si + 1) % 10] + BRANCHES[(bi + 3) % 12];
}

// ════════════════════════════════════════════════════════════════
//  12. 五行力量计算
// ════════════════════════════════════════════════════════════════

/**
 * 五行力量加权计算
 * 天干1.0 / 藏干本气1.0·中气0.5·余气0.2 / 月支司令×2.0
 *
 * 《滴天髓》「旺衰看月令，强弱看通根。」
 */
function computeWuxingStrength(pillars, dayStem) {
  var score = {'木':0, '火':0, '土':0, '金':0, '水':0};
  var weights = [1.0, 0.5, 0.2];

  for (var idx = 0; idx < pillars.length; idx++) {
    var p = pillars[idx];
    score[ELE[p.stem]] += 1.0;

    var mult = (idx === 1) ? 2.0 : 1.0; // 月支×2
    var canggan = ZHI_CANGGAN[p.branch] || [];
    for (var i = 0; i < canggan.length; i++) {
      var w = weights[i] || 0.2;
      score[ELE[canggan[i]]] += Math.round(w * mult * 1000) / 1000;
    }
  }

  for (var k in score) score[k] = Math.round(score[k] * 100) / 100;

  var dayEle = ELE[dayStem];
  var yinEle = null;
  for (var k2 in WUXING_SHENG) {
    if (WUXING_SHENG[k2] === dayEle) yinEle = k2;
  }

  var tong = Math.round((score[dayEle] + score[yinEle]) * 100) / 100;
  var shangEle = WUXING_SHENG[dayEle];
  var caiEle = WUXING_KE[dayEle];
  var guanEle = null;
  for (var k3 in WUXING_KE) {
    if (WUXING_KE[k3] === dayEle) guanEle = k3;
  }
  var yi = Math.round((score[shangEle] + score[caiEle] + score[guanEle]) * 100) / 100;

  var total = tong + yi;
  var ratio = total > 0 ? tong / total : 0;
  var tip = ratio > 0.55 ? '偏强' : (ratio < 0.45 ? '偏弱' : '均势(需细辨)');

  return {
    score: score,
    tong: tong,
    yi: yi,
    ratio: Math.round(ratio * 100) / 100,
    tip: tip,
    dayEle: dayEle,
    yinEle: yinEle,
    shangEle: shangEle,
    caiEle: caiEle,
    guanEle: guanEle
  };
}

// ════════════════════════════════════════════════════════════════
//  13. 格局判定
// ════════════════════════════════════════════════════════════════

/**
 * 格局判定 — 以月令本气为主
 *
 * 《子平真诠》「格局以月令本气为主。
 *   月令本气透干则格正, 不透则力弱。
 *   本气为比劫时(建禄/月刃), 另取透干之财官印食为格。」
 *
 * @param {string} monthBranch - 月支
 * @param {number} dayStemIdx - 日干索引
 * @param {Array} pillars - 四柱
 * @returns {{name, desc, shun, cheng, bai, xiangShen, jishen, geSource}}
 */
function getGeju(monthBranch, dayStemIdx, pillars) {
  // 地支藏干索引表
  var zangGan = {
    '子':[9],'丑':[5,9,7],'寅':[0,2,4],'卯':[1],
    '辰':[4,1,9],'巳':[2,6,4],'午':[3,5],'未':[5,3,1],
    '申':[6,8,4],'酉':[7],'戌':[4,7,3],'亥':[8,0]
  };

  var zang = zangGan[monthBranch] || [];
  var benQi = zang[0];
  var zhongQi = zang.length > 1 ? zang[1] : -1;
  var yuQi = zang.length > 2 ? zang[2] : -1;

  // 检查透干
  var tianGanIdx = pillars.map(function(p) { return STEMS.indexOf(p.stem); });
  var benQiTou = tianGanIdx.indexOf(benQi) >= 0;
  var zhongQiTou = zhongQi >= 0 && tianGanIdx.indexOf(zhongQi) >= 0;
  var yuQiTou = yuQi >= 0 && tianGanIdx.indexOf(yuQi) >= 0;

  var geStemIdx = benQi;
  var geSource = benQiTou ? '本气透干' : '本气（未透，力弱）';

  // 本气为比劫时, 另取透干格
  if (!benQiTou) {
    var dayStem = STEMS[dayStemIdx];
    var dayEle = ELE[dayStem];
    var benQiEle = ELE[STEMS[benQi]];
    if (benQiEle === dayEle) {
      if (zhongQiTou) { geStemIdx = zhongQi; geSource = '中气透干'; }
      else if (yuQiTou) { geStemIdx = yuQi; geSource = '余气透干'; }
    }
  }

  // 十神关系定格局名
  var geStem = STEMS[geStemIdx];
  var dayStemChar = STEMS[dayStemIdx];
  var geEle = ELE[geStem];
  var dayEle = ELE[dayStemChar];
  var sameYinYang = (geStemIdx % 2) === (dayStemIdx % 2);

  // 建禄/月刃检查
  var luMap = {'甲':'寅','乙':'卯','丙':'巳','丁':'午','戊':'巳','己':'午','庚':'申','辛':'酉','壬':'亥','癸':'子'};
  var renMap = {'甲':'卯','乙':'寅','丙':'午','丁':'巳','戊':'午','己':'巳','庚':'酉','辛':'申','壬':'子','癸':'亥'};

  if (geEle === dayEle) {
    if (sameYinYang) {
      return {name:'建禄格', desc:'日主得令，身旺之象。', geSource: geSource,
        cheng:'见财官有力则成格，身旺任财、名利双收。',
        bai:'身旺无泄无耗则破格，碌碌无为。'};
    } else {
      return {name:'月刃格', desc:'月令阳刃，日主帝旺。', geSource: geSource,
        cheng:'官杀制刃则成格，威权有魄力。',
        bai:'刃无制而冲提则破格，刚暴惹祸。'};
    }
  }
  if (WUXING_KE[geEle] === dayEle) { // 克我者
    if (sameYinYang) {
      return {name:'七杀格', desc:'七杀威权，敢于挑战。', geSource: geSource,
        cheng:'食神制杀、印星化杀则成格，掌权有魄力。',
        bai:'杀无制攻身则破格，灾厄官非。'};
    } else {
      return {name:'正官格', desc:'官星清透，责任心强。', geSource: geSource,
        cheng:'财生官、印护官则成格，仕途顺遂。',
        bai:'伤官克官则破格，仕途多阻。'};
    }
  }
  if (WUXING_SHENG[dayEle] === geEle) { // 我生者
    if (sameYinYang) {
      return {name:'食神格', desc:'食神福厚，人缘佳。', geSource: geSource,
        cheng:'身旺、食神生财则成格，福禄双全。',
        bai:'枭神夺食则破格，衣食不继。'};
    } else {
      return {name:'伤官格', desc:'伤官才华，敢于创新。', geSource: geSource,
        cheng:'伤官配印、伤官生财则成格，才华横溢。',
        bai:'伤官见官则破格，官非口舌。'};
    }
  }
  if (WUXING_KE[dayEle] === geEle) { // 我克者
    if (sameYinYang) {
      return {name:'偏财格', desc:'偏财机遇，投资运佳。', geSource: geSource,
        cheng:'食伤生财则成格，投资有道。',
        bai:'比劫夺财则破格，破财争夺。'};
    } else {
      return {name:'正财格', desc:'正财稳健，勤劳致富。', geSource: geSource,
        cheng:'食伤生财、官星护财则成格，家业兴旺。',
        bai:'比劫夺财则破格，财源不稳。'};
    }
  }
  if (WUXING_SHENG[geEle] === dayEle) { // 生我者
    if (sameYinYang) {
      return {name:'偏印格', desc:'偏印悟性，偏门学问。', geSource: geSource,
        cheng:'偏印得用则成格，学术有成。',
        bai:'枭神夺食则破格，孤独刑伤。'};
    } else {
      return {name:'正印格', desc:'正印慈祥，贵人运佳。', geSource: geSource,
        cheng:'印星生身则成格，学业顺利。',
        bai:'财破印则破格，学业受阻。'};
    }
  }

  return {name:'无格无局', desc:'月令本气不透，无明确格局。', geSource: geSource};
}

// ════════════════════════════════════════════════════════════════
//  14. 核心排盘入口函数
// ════════════════════════════════════════════════════════════════

/**
 * 八字排盘 — 核心函数 V3
 *
 * 《渊海子平》「以日为主，以月为令。」
 * 《子平真诠》「格局以月令本气为主。」
 *
 * @param {number} year - 公历年份
 * @param {number} month - 公历月份 (1-12)
 * @param {number} day - 公历日
 * @param {number} hour - 出生时辰 (0-23)
 * @param {string} sex - 'male' | 'female'
 * @param {object} options - {zishiMode: 'normal'|'late', lng: number}
 * @returns {object} 完整排盘结果
 */
function baziCalcV3(year, month, day, hour, sex, options) {
  options = options || {};
  var zishiMode = options.zishiMode || 'normal';

  // ═══ 1. 年柱 (立春为界) ═══
  var yearRes = getYearStemBranchExact(year, month, day, hour, 0);
  var ysIdx = yearRes.stemIdx;
  var ybIdx = yearRes.branchIdx;

  // ═══ 2. 日柱 (先算日柱, 因时柱可能换日) ═══
  var dayStemIdx = getDayStemIndexV3(year, month, day);
  var dayBranchIdx = getDayBranchIndexV3(year, month, day);
  var dayStem = STEMS[dayStemIdx];
  var dayBranch = BRANCHES[dayBranchIdx];

  // ═══ 3. 月柱 (节气定月支, 五虎遁定月干) ═══
  var mBranchIdx = getMonthBranchExact(year, month, day, hour, 0);
  var mStemIdx = getMonthStem(ysIdx, mBranchIdx);
  var monthStem = STEMS[mStemIdx];
  var monthBranch = BRANCHES[mBranchIdx];

  // ═══ 4. 时柱 (五鼠遁, 含晚子换日) ═══
  var hourRes = getHourPillar(year, month, day, hour, dayStemIdx, zishiMode);
  var hsIdx = hourRes.stemIdx;
  var hbIdx = hourRes.branchIdx;
  var hourStem = STEMS[hsIdx];
  var hourBranch = BRANCHES[hbIdx];

  // 如果晚子换日, 日柱需调整
  if (hourRes.dayShift === 1) {
    dayStemIdx = (dayStemIdx + 1) % 10;
    dayBranchIdx = (dayBranchIdx + 1) % 12;
    dayStem = STEMS[dayStemIdx];
    dayBranch = BRANCHES[dayBranchIdx];
  }

  // ═══ 四柱 ═══
  var pillars = [
    {stem: yearRes.stem, branch: yearRes.branch, stemIdx: ysIdx, branchIdx: ybIdx, name: '年柱'},
    {stem: monthStem, branch: monthBranch, stemIdx: mStemIdx, branchIdx: mBranchIdx, name: '月柱'},
    {stem: dayStem, branch: dayBranch, stemIdx: dayStemIdx, branchIdx: dayBranchIdx, name: '日柱'},
    {stem: hourStem, branch: hourBranch, stemIdx: hsIdx, branchIdx: hbIdx, name: '时柱'}
  ];

  // ═══ 五行统计 ═══
  var eleCount = {木:0, 火:0, 土:0, 金:0, 水:0};
  for (var pi = 0; pi < pillars.length; pi++) {
    eleCount[ELE[pillars[pi].stem]]++;
    eleCount[ZHI_ELE[pillars[pi].branch]]++;
  }

  // ═══ 十神 (年/月/时干支) ═══
  var tenGods = [];
  for (var ti = 0; ti < pillars.length; ti++) {
    if (ti === 2) continue;
    var stemGod = getTenGod(pillars[ti].stem, dayStem);
    var branchGod = getBranchTenGod(pillars[ti].branch, dayStem);
    tenGods.push({
      position: pillars[ti].name,
      stem: pillars[ti].stem,
      branch: pillars[ti].branch,
      stemGod: stemGod,
      branchGod: branchGod,
      branchAllGods: getBranchAllTenGods(pillars[ti].branch, dayStem)
    });
  }

  // ═══ 纳音 ═══
  var nayins = pillars.map(function(p) {
    return getNayin(p.stemIdx, p.branchIdx);
  });

  // ═══ 神煞 ═══
  var shensha = getShensha(pillars, dayStemIdx);

  // ═══ 格局 ═══
  var geju = getGeju(monthBranch, dayStemIdx, pillars);

  // ═══ 五行力量 ═══
  var wuxingStrength = computeWuxingStrength(pillars, dayStem);

  // ═══ 长生十二宫 (日干对四地支) ═══
  var dishi = pillars.map(function(p) {
    return getDishi(dayStem, p.branch);
  });

  // ═══ 胎元/旬空 ═══
  var taiYuan = getTaiYuan(monthStem, monthBranch);
  var xunKong = getXunKong(dayStem, dayBranch);
  var xunName = getXunName(dayStem, dayBranch);

  // ═══ 大运 ═══
  var dayun = computeDayun(pillars, sex, year, month, day, hour, dayStemIdx, ELE[dayStem]);

  // ═══ 返回完整结果 ═══
  return {
    // 基本信息
    birthInfo: {year: year, month: month, day: day, hour: hour, sex: sex},
    // 四柱
    pillars: pillars,
    dayStem: dayStem,
    dayBranch: dayBranch,
    dayStemIdx: dayStemIdx,
    dayBranchIdx: dayBranchIdx,
    dayMaster: ELE[dayStem] + (GAN_YINYANG[dayStem] === '阳' ? '阳' : '阴'),
    dayWuxing: ELE[dayStem],
    // 纳音
    nayins: nayins,
    // 十神
    tenGods: tenGods,
    // 五行统计
    eleCount: eleCount,
    wuxingStrength: wuxingStrength,
    // 格局
    geju: geju,
    // 神煞
    shensha: shensha,
    // 长生十二宫
    dishi: dishi,
    // 胎元/旬空
    taiYuan: taiYuan,
    xunKong: xunKong,
    xunName: xunName,
    // 大运
    dayun: dayun,
    // 排盘版本
    engineVersion: 'V3'
  };
}

// ════════════════════════════════════════════════════════════════
//  导出 (Node.js / 浏览器通用)
// ════════════════════════════════════════════════════════════════

if (typeof module !== 'undefined' && module.exports) {

window.BaziV3 = {
    // 常量
    STEMS: STEMS,
    BRANCHES: BRANCHES,
    ELE: ELE,
    ZHI_ELE: ZHI_ELE,
    JIAZI: JIAZI,
    NAYIN_TABLE: NAYIN_TABLE,
    // 节气
    getJieDate: getJieDate,
    getPreciseJieTime: getPreciseJieTime,
    solarLongitudeJ2000: solarLongitudeJ2000,
    // 日柱
    toJDN: toJDN,
    getDayStemIndex: getDayStemIndexV3,
    getDayBranchIndex: getDayBranchIndexV3,
    getDayGanZhiIndex: getDayGanZhiIndex,
    // 年柱
    getYearStemBranchExact: getYearStemBranchExact,
    // 月柱
    getMonthBranchExact: getMonthBranchExact,
    getMonthStem: getMonthStem,
    getMonthPillar: getMonthPillar,
    // 时柱
    getHourBranchIndex: getHourBranchIndex,
    getHourStem: getHourStem,
    getHourPillar: getHourPillar,
    // 十神
    getTenGod: getTenGod,
    getBranchTenGod: getBranchTenGod,
    getBranchAllTenGods: getBranchAllTenGods,
    // 大运
    computeDayun: computeDayun,
    // 纳音
    getNayin: getNayin,
    getNayinElement: getNayinElement,
    // 神煞
    getShensha: getShensha,
    // 长生十二宫
    getDishi: getDishi,
    // 旬空/胎元
    getXunKong: getXunKong,
    getXunName: getXunName,
    getTaiYuan: getTaiYuan,
    // 格局
    getGeju: getGeju,
    // 五行力量
    computeWuxingStrength: computeWuxingStrength,
    // 核心入口
    baziCalcV3: baziCalcV3
  };
};

})();

// ════════════════════════════════════════════════════════════════
//  引擎 2/5: FengshuiV3
// ════════════════════════════════════════════════════════════════

(function() {
'use strict';

/**
 * 风水分析引擎 v3.0 — 命理宝鉴
 * 
 * 基于以下古籍重写，纠正 v2 打分制之弊：
 *   - 《八宅明镜》    — 东四宅/西四宅、命卦、八游星
 *   - 《沈氏玄空学》  — 九宫飞星、旺山旺向
 *   - 《葬书》《青囊经》《青囊奥语》 — 形势派
 *
 * 核心改进：
 *   1. 命卦严格按《八宅明镜》男/女分式计算，遵循古制全量公式
 *   2. 八游星用卦爻翻变法，不再依赖硬编码 lookup table
 *   3. 玄空飞星按《沈氏玄空学》运星→山星→向星完整排盘
 *   4. 新增形势派分析，引《葬书》《青囊经》原文
 */

// ============================================================
// === A. 八宅派 — 按《八宅明镜》 ===
// ============================================================

/** 八卦数 → 卦名 → 三爻（下/中/上，1=阳爻，0=阴爻） */
const GUAS = {
  1: { name: '坎', trigram: [0, 1, 0], wuxing: '水', nature: '陷' },
  2: { name: '坤', trigram: [0, 0, 0], wuxing: '土', nature: '顺' },
  3: { name: '震', trigram: [1, 0, 0], wuxing: '木', nature: '动' },
  4: { name: '巽', trigram: [0, 1, 1], wuxing: '木', nature: '入' },
  6: { name: '乾', trigram: [1, 1, 1], wuxing: '金', nature: '健' },
  7: { name: '兑', trigram: [1, 1, 0], wuxing: '金', nature: '悦' },
  8: { name: '艮', trigram: [0, 0, 1], wuxing: '土', nature: '止' },
  9: { name: '离', trigram: [1, 0, 1], wuxing: '火', nature: '丽' },
};

/** 东四宅卦数（坎离震巽），西四宅卦数（乾坤艮兑） */
const DONG_SI_GUAS = new Set([1, 9, 3, 4]);
const XI_SI_GUAS   = new Set([6, 7, 8, 2]);

/** 后天八卦方位 → 卦数 */
const DIR_TO_GUA = { '北': 1, '西南': 2, '东': 3, '东南': 4, '中': 5, '西北': 6, '西': 7, '东北': 8, '南': 9 };
const GUA_TO_DIR = { 1: '北', 2: '西南', 3: '东', 4: '东南', 6: '西北', 7: '西', 8: '东北', 9: '南' };

// -----------------------------------------------------------
// A.1  命卦计算
// 《八宅明镜》原文：
//   "男命以一百减生年，以九除之余为卦数。中五寄坤。"
//   "女命以生年加五以九除之余为卦数。中五寄艮。"
//   女命亦可：(生年 - 4) % 9
// -----------------------------------------------------------
/**
 * computeMingGua(year, sex)
 * @param {number} year — 出生年份（公元）
 * @param {string} sex — 'male' | 'female'
 * @returns {{ gua, guaName, wuxing, trigram, isDong, type, dongSiFavDirs, xiSiFavDirs }}
 */
function computeMingGua(year, sex) {
  // 《八宅明镜》："上元甲子 男起七赤 女起八白"
  // 此处用通用命卦公式（1900 以后适用；古法需分上中下三元）
  const last2 = year % 100;
  let gua;

  if (sex === 'male') {
    // 男命：(100 - 生年后两位) ÷ 9，取余数
    gua = (100 - last2) % 9;
  } else {
    // 女命：(生年后两位 + 5) ÷ 9，取余数；等价于 (生年后两位 - 4) % 9
    gua = (last2 + 5) % 9;
  }

  // 余数为 0 → 离卦(9)
  if (gua === 0) gua = 9;

  // 《八宅明镜》："中五寄坤"（男） / "中五寄艮"（女）
  if (gua === 5) {
    gua = (sex === 'male') ? 2 : 8; // 男寄坤(2)，女寄艮(8)
  }

  const g = GUAS[gua];
  const isDong = DONG_SI_GUAS.has(gua);

  return {
    gua,                                    // 卦数 1-9（不含 5）
    guaName: g.name,                        // 卦名：坎/坤/震/巽/乾/兑/艮/离
    wuxing: g.wuxing,                       // 五行
    trigram: g.trigram,                     // 三爻
    isDong,                                 // 是否东四命
    type: isDong ? '东四命' : '西四命',      // 东四命/西四命
    dongSiFavDirs: isDong ? ['北', '东', '东南', '南'] : ['西北', '西', '西南', '东北'],
    xiSiFavDirs:  isDong ? ['西北', '西', '西南', '东北'] : ['北', '东', '东南', '南'],
  };
}

// -----------------------------------------------------------
// A.2  东四宅 / 西四宅 判断
// -----------------------------------------------------------
/**
 * computeDongXiSi(mingGua)
 * 返回命卦所属的东/西四宅详细分析
 */
function computeDongXiSi(mingGua) {
  const isDong = mingGua.isDong;
  return {
    category: isDong ? '东四命' : '西四命',
    guaNumbers: isDong ? [1, 3, 4, 9] : [6, 7, 8, 2],
    guaNames:   isDong ? ['坎', '震', '巽', '离'] : ['乾', '兑', '艮', '坤'],
    /**
     * 《八宅明镜》："东四命宜居东四宅，西四命宜居西四宅。
     *                  若居相反之宅，则宅不护命，人宅不调。"
     */
    compatibleHouses: isDong
      ? ['坎宅(坐北朝南)', '震宅(坐东朝西)', '巽宅(坐东南朝西北)', '离宅(坐南朝北)']
      : ['乾宅(坐西北朝东南)', '兑宅(坐西朝东)', '艮宅(坐东北朝西南)', '坤宅(坐西南朝东北)'],
    conflictHouses: isDong
      ? ['乾宅', '兑宅', '艮宅', '坤宅']
      : ['坎宅', '震宅', '巽宅', '离宅'],
    /**
     * 大门、主卧、厨房宜在吉方（生气/天医/延年）
     * 卫生间、储藏间宜在凶方（绝命/五鬼/六煞/祸害）
     */
    advice: isDong
      ? '择宅宜选东四宅（坎震巽离），忌西四宅。若已居西四宅，可在生气方位设大门或主卧以调和。'
      : '择宅宜选西四宅（乾坤艮兑），忌东四宅。若已居东四宅，可在延年方位设主卧以调和人宅关系。',
  };
}

// -----------------------------------------------------------
// A.3  八游星配九宫（大游年歌诀）
// 《八宅明镜》以卦爻翻变法推游星：
//   变上爻 → 生气
//   变中爻 → 五鬼
//   变下爻 → 延年
//   变中爻 → 六煞
//   变上爻 → 祸害
//   变中爻 → 天医
//   变下爻 → 绝命
// -----------------------------------------------------------
const STAR_NAME_MAP = {
  'fowei':  '伏位',
  'shengqi': '生气',
  'wugui':  '五鬼',
  'yannian': '延年',
  'liusha':  '六煞',
  'huohai':  '祸害',
  'tianyi':  '天医',
  'jueming': '绝命',
};

const STAR_JIXIONG = {
  '伏位': { level: '小吉', score: 2, element: '随本宫' },
  '生气': { level: '大吉', score: 5, element: '木', shengke: '水生木、木生火' },
  '天医': { level: '中吉', score: 4, element: '土', shengke: '火生土、土生金' },
  '延年': { level: '上吉', score: 4, element: '金', shengke: '土生金、金生水' },
  '祸害': { level: '小凶', score: -2, element: '土', shengke: '' },
  '六煞': { level: '中凶', score: -3, element: '水', shengke: '' },
  '五鬼': { level: '大凶', score: -4, element: '火', shengke: '' },
  '绝命': { level: '大凶', score: -5, element: '金', shengke: '' },
};

/**
 * 辅助：将三爻 [下,中,上] 映射回卦数 (1-9,不含5)
 */
function trigramToGua(trigram) {
  for (const [num, g] of Object.entries(GUAS)) {
    if (g.trigram[0] === trigram[0] &&
        g.trigram[1] === trigram[1] &&
        g.trigram[2] === trigram[2]) {
      return parseInt(num);
    }
  }
  return null; // 中宫5无对应
}

/**
 * 辅助：翻转某爻
 */
function flipYao(trigram, index) {
  // index: 0=下爻, 1=中爻, 2=上爻
  const flipped = [...trigram];
  flipped[index] = flipped[index] === 1 ? 0 : 1;
  return flipped;
}

/**
 * computeBaYouXing(mingGua)
 * 《八宅明镜》大游年歌诀，以卦爻翻变法推八游星
 *
 * @returns {Object}  { positions: { '北': '生气', ... }, details: [...] }
 */
function computeBaYouXing(mingGua) {
  const baseGua = mingGua.gua;
  const baseTrigram = mingGua.trigram;

  // 翻卦顺序：(起点)伏位 → 变上爻→生气 → 变中爻→五鬼 → 变下爻→延年
  //            → 变中爻→六煞 → 变上爻→祸害 → 变中爻→天医 → 变下爻→绝命
  const steps = [
    { name: 'shengqi', flipIdx: 2 },  // 变上爻
    { name: 'wugui',   flipIdx: 1 },  // 变中爻
    { name: 'yannian', flipIdx: 0 },  // 变下爻
    { name: 'liusha',  flipIdx: 1 },  // 变中爻
    { name: 'huohai',  flipIdx: 2 },  // 变上爻
    { name: 'tianyi',  flipIdx: 1 },  // 变中爻
    { name: 'jueming', flipIdx: 0 },  // 变下爻
  ];

  const positions = {};
  const details = [];

  // 伏位 = 本命卦所在方位
  const foweiDir = GUA_TO_DIR[baseGua];
  positions[foweiDir] = '伏位';

  let currentTrigram = baseTrigram;

  for (const step of steps) {
    currentTrigram = flipYao(currentTrigram, step.flipIdx);
    const guaNum = trigramToGua(currentTrigram);

    if (guaNum === null) {
      // 中宫（卦变结果落 5）→ 寄坤(2) 或 艮(8)
      // 实际上翻卦不会落在中宫，但安全起见
      continue;
    }

    const dir = GUA_TO_DIR[guaNum];
    const starName = STAR_NAME_MAP[step.name];
    positions[dir] = starName;

    details.push({
      starName,
      jixiong: STAR_JIXIONG[starName],
      direction: dir,
      guaNum,
      guaName: GUAS[guaNum].name,
      wuxing: GUAS[guaNum].wuxing,
    });
  }

  // 按方位整理结果
  const allDirs = ['北', '南', '东', '西', '东南', '西南', '西北', '东北'];
  const results = [];
  for (const dir of allDirs) {
    const star = positions[dir] || '伏位'; // 安全兜底
    const info = STAR_JIXIONG[star];
    results.push({
      direction: dir,
      starName: star,
      jixiong: info.level,
      element: info.element,
      score: info.score,
      guaNum: DIR_TO_GUA[dir],
      guaName: GUAS[DIR_TO_GUA[dir]].name,
      advice: starAdvice(star, dir),
    });
  }

  // 八宅游星宫位列表
  return {
    positions, // {'北':'伏位', '南':'延年', ...}
    details,   // [{starName, jixiong, direction, ...}, ...]
    results,   // 按方位排序的结果 + 建议
    /**
     * 《八宅明镜》："生气、天医、延年、伏位为四吉星。
     *                   绝命、五鬼、六煞、祸害为四凶星。"
     */
    jiFang: results.filter(r => r.score > 0).map(r => r.direction),
    xiongFang: results.filter(r => r.score < 0).map(r => r.direction),
    guMotto:
      '《八宅明镜》："吉方宜开门、安床、设灶；凶方宜作厕、储物以镇之。宅之吉凶，在门、主、灶三要。"',
  };
}

/**
 * 八游星方位建议
 */
function starAdvice(starName, dir) {
  const map = {
    '生气': `宜设主卧、书房、大门。宜摆放绿色植物、水晶洞。忌堆放杂物。`,
    '天医': `宜设卧室、疗养室。宜摆放葫芦、铜制摆件。忌放垃圾桶。`,
    '延年': `宜设主卧、客厅。宜摆放和合二仙、粉色水晶。忌放单数装饰。`,
    '伏位': `宜设书房、静室。宜摆放山水画、陶瓷。忌过于喧闹。`,
    '绝命': `宜设卫生间、储藏室。宜摆放五帝钱、铜葫芦化解。忌作主卧或大门。`,
    '五鬼': `宜设储藏室、衣帽间。宜摆放白水晶簇、铜铃化解。忌作厨房或卧室。`,
    '六煞': `宜设卫生间、洗衣房。宜摆放黑曜石球、盐灯化解。忌作主卧或财位。`,
    '祸害': `宜设杂物间、车库。宜摆放黄水晶球、陶瓷葫芦化解。忌作卧室或书房。`,
  };
  return map[starName] || '';
}


// ============================================================
// === B. 玄空飞星 — 按《沈氏玄空学》 ===
// ============================================================

/**
 * 九星
 * 《沈氏玄空学》："一白贪狼为吉星，主官贵；二黑巨门为病符；
 *                   三碧禄存主口舌；四绿文曲主文昌；五黄廉贞为大煞；
 *                   六白武曲主官财；七赤破军主口舌；八白左辅主正财；
 *                   九紫右弼主喜庆。"
 */
const NINE_STARS = {
  1: { name: '一白贪狼', wuxing: '水', jixiong: '吉',  desc: '官贵、人缘、桃花' },
  2: { name: '二黑巨门', wuxing: '土', jixiong: '凶',  desc: '病符、健康' },
  3: { name: '三碧禄存', wuxing: '木', jixiong: '凶',  desc: '口舌、是非、官非' },
  4: { name: '四绿文曲', wuxing: '木', jixiong: '吉',  desc: '文昌、学业、桃花' },
  5: { name: '五黄廉贞', wuxing: '土', jixiong: '大凶', desc: '灾祸、官灾、疾病' },
  6: { name: '六白武曲', wuxing: '金', jixiong: '吉',  desc: '官运、偏财、远行' },
  7: { name: '七赤破军', wuxing: '金', jixiong: '凶',  desc: '破财、争斗、口舌' },
  8: { name: '八白左辅', wuxing: '土', jixiong: '吉',  desc: '正财、置业、旺丁' },
  9: { name: '九紫右弼', wuxing: '火', jixiong: '吉',  desc: '喜庆、姻缘、添丁' },
};

/**
 * 三元九运表
 * 《沈氏玄空学》："上元一运甲子年起坎，中元四运甲子年起巽，下元七运甲子年起兑。"
 */
function computeYun(year) {
  // 1864 甲子年起始一运，每运 20 年
  const elapsed = year - 1864;
  if (elapsed < 0) {
    // 处理小于1864年的年份，逆推
    return { yun: 1, name: '上元一运', wangXing: 1, range: '1864-1883' };
  }
  let yun = Math.floor(elapsed / 20) + 1;
  yun = Math.min(yun, 9); // 九运之后归零，但目前只到九运

  const yunNames = {
    1: '上元一运', 2: '上元二运', 3: '上元三运',
    4: '中元四运', 5: '中元五运', 6: '中元六运',
    7: '下元七运', 8: '下元八运', 9: '下元九运',
  };

  const startYear = 1864 + (yun - 1) * 20;
  const endYear = startYear + 19;

  return {
    yun,
    name: yunNames[yun],
    wangXing: yun,           // 当运旺星
    shengXing: (yun % 9) + 1, // 生气星（未来旺星）
    tuiXing: ((yun + 7) % 9) + 1, // 退气星
    siXing: ((yun + 6) % 9) + 1,  // 死气星
    shaXing: ((yun + 5) % 9) + 1,  // 煞气星
    range: `${startYear}-${endYear}`,
  };
}

/**
 * 洛书飞星轨迹
 * 《沈氏玄空学》："飞星之序，由中宫起，入乾、入兑、入艮、入离、入坎、入坤、入震、入巽"
 * 洛书宫位代号：中5→乾6→兑7→艮8→离9→坎1→坤2→震3→巽4
 */
const LUOSHU_FEI_XU = [5, 6, 7, 8, 9, 1, 2, 3, 4];

/**
 * 将某星入中宫后，沿洛书轨迹铺满九宫
 * @returns {Object} { 宫位代码: 飞星数字 }
 */
function feiStar(centerStar) {
  const pan = {};
  for (let i = 0; i < 9; i++) {
    const star = ((centerStar - 1 + i) % 9) + 1;
    pan[LUOSHU_FEI_XU[i]] = star;
  }
  return pan;
}

/**
 * 反向：逆飞
 */
function feiStarReverse(centerStar) {
  const pan = {};
  // 逆飞轨迹：5→4→3→2→1→9→8→7→6
  // 对应洛书宫位：中(5)→巽(4)→震(3)→坤(2)→坎(1)→离(9)→艮(8)→兑(7)→乾(6)
  const niFeiGong = [5, 4, 3, 2, 1, 9, 8, 7, 6];
  for (let i = 0; i < 9; i++) {
    const star = ((centerStar - 1 + i) % 9) + 1;
    pan[niFeiGong[i]] = star;
  }
  return pan;
}

/**
 * 二十四山全量定义
 * 每方三山：北(壬子癸)、东北(丑艮寅)、东(甲卯乙)、东南(辰巽巳)、
 *           南(丙午丁)、西南(未坤申)、西(庚酉辛)、西北(戌乾亥)
 * 共24山 = 12地支 + 8天干 + 4卦（艮巽乾坤），符合古制
 *
 * 阴阳（用以判断顺飞/逆飞）：
 *   - 坎宫：壬阳 子阴 癸阴
 *   - 坤宫：未阴 坤阳 申阳
 *   - 震宫：甲阳 卯阴 乙阴
 *   - 巽宫：辰阴 巽阳 巳阳
 *   - 乾宫：戌阴 乾阳 亥阳
 *   - 兑宫：庚阳 酉阴 辛阴
 *   - 艮宫：丑阴 艮阳 寅阳
 *   - 离宫：丙阳 午阴 丁阴
 */
const MOUNTAINS_24 = {
  '北':   { gua: 1, shans: ['壬','子','癸'], yinyang: ['阳','阴','阴'] },
  '西南': { gua: 2, shans: ['未','坤','申'], yinyang: ['阴','阳','阳'] },
  '东':   { gua: 3, shans: ['甲','卯','乙'], yinyang: ['阳','阴','阴'] },
  '东南': { gua: 4, shans: ['辰','巽','巳'], yinyang: ['阴','阳','阳'] },
  '西北': { gua: 6, shans: ['戌','乾','亥'], yinyang: ['阴','阳','阳'] },
  '西':   { gua: 7, shans: ['庚','酉','辛'], yinyang: ['阳','阴','阴'] },
  '东北': { gua: 8, shans: ['丑','艮','寅'], yinyang: ['阴','阳','阳'] },
  '南':   { gua: 9, shans: ['丙','午','丁'], yinyang: ['阳','阴','阴'] },
};

/**
 * computeFeixing(yun, sitting, facing)
 *
 * 《沈氏玄空学》玄空飞星排盘
 *
 * @param {number} yun — 运数 (1-9)，通常由 computeYun(year) 获得
 * @param {string} sitting — 坐方（八字位），如 '北'
 * @param {string} facing  — 向方（八字位），如 '南'
 * @param {object} [shanOpts] — 可选：精确到二十四山，如 { sittingShan: '子', sittingYinYang: '阴', facingShan: '午', facingYinYang: '阴' }
 * @returns 完整的玄空飞星排盘
 */
function computeFeixing(yun, sitting, facing, shanOpts) {
  // 1. 运星盘：当运星入中宫
  const yunPan = feiStar(yun);

  // 2. 坐方与向方的九宫数字
  const sittingGua = DIR_TO_GUA[sitting];
  const facingGua  = DIR_TO_GUA[facing];

  // 3. 山星：坐方运星入中宫
  const shanZhongXing = yunPan[sittingGua] || yun;

  // 判断顺飞/逆飞
  // 《沈氏玄空学》：阳山顺飞，阴山逆飞
  // 按三元龙方位阴阳：坎震巽乾离为阳顺飞，坤兑艮为阴逆飞
  let shanIsShun = true; // 默认顺飞
  if (shanOpts && shanOpts.sittingShan && shanOpts.sittingYinYang) {
    shanIsShun = shanOpts.sittingYinYang === '阳';
  } else {
    // 按三元龙方位阴阳判定（地卦阴阳）
    const yangGongs = [1,3,4,6,9]; // 坎震巽乾离为阳
    shanIsShun = yangGongs.includes(sittingGua);
  }
  const shanPan = shanIsShun ? feiStar(shanZhongXing) : feiStarReverse(shanZhongXing);

  // 4. 向星：向方运星入中宫
  const xiangZhongXing = yunPan[facingGua] || 5;

  let xiangIsShun = true;
  if (shanOpts && shanOpts.facingShan && shanOpts.facingYinYang) {
    xiangIsShun = shanOpts.facingYinYang === '阳';
  } else {
    // 按三元龙方位阴阳判定（地卦阴阳）
    const yangGongs2 = [1,3,4,6,9]; // 坎震巽乾离为阳
    xiangIsShun = yangGongs2.includes(facingGua);
  }
  const xiangPan = xiangIsShun ? feiStar(xiangZhongXing) : feiStarReverse(xiangZhongXing);

  // 5. 各宫组合飞星盘
  const gongPositions = {};
  for (const gongNum of [1, 2, 3, 4, 6, 7, 8, 9]) {
    const dir = GUA_TO_DIR[gongNum];
    const guaName = dir ? GUAS[gongNum].name : '';
    gongPositions[gongNum] = {
      gua: guaName,
      direction: dir,
      yun: yunPan[gongNum],
      shan: shanPan[gongNum],
      xiang: xiangPan[gongNum],
      // 宫位飞星组合的吉凶简评
      shanXiangHe: shanXiangEvaluate(yun, yunPan[gongNum], shanPan[gongNum], xiangPan[gongNum]),
    };
  }

  // 6. 中宫
  const zhongGong = {
    yun: yunPan[5],
    shan: shanPan[5],
    xiang: xiangPan[5],
  };

  // 7. 旺山旺向 / 上山下水 / 双星到向 / 双星到坐
  const wangAnalysis = computeWangShanWangXiang(yun, sittingGua, facingGua, shanPan, xiangPan);

  // 8. 每宫位星情分析
  const gongAnalysis = [];
  for (const [gongNum, gData] of Object.entries(gongPositions)) {
    const gn = parseInt(gongNum);
    gongAnalysis.push({
      gua: gData.gua,
      direction: gData.direction,
      yunStar: NINE_STARS[gData.yun],
      shanStar: NINE_STARS[gData.shan],
      xiangStar: NINE_STARS[gData.xiang],
      evaluation: gData.shanXiangHe,
    });
  }

  return {
    yun,
    yunInfo: computeYun(1864 + (yun - 1) * 20),
    sitting: { direction: sitting, gua: sittingGua, guaName: GUAS[sittingGua].name },
    facing:  { direction: facing,  gua: facingGua,  guaName: GUAS[facingGua].name },
    yunPan,
    shanPan,
    xiangPan,
    zhongGong,
    gongPositions,
    gongAnalysis,
    wangAnalysis,
    shanFeiMode: shanIsShun ? '顺飞(阳)' : '逆飞(阴)',
    xiangFeiMode: xiangIsShun ? '顺飞(阳)' : '逆飞(阴)',
    // 引用古书
    quotes: [
      '《沈氏玄空学》："山上龙神不下水，水里龙神不上山。"',
      `—— 山星管人丁，向星管财禄。山星宜在坐方高处，向星宜在向方低处。`,
      '《青囊奥语》："颠颠倒，二十四山有珠宝；顺逆行，二十四山有火坑。"',
    ],
  };
}

/**
 * 辅助：山向飞星组合简评
 */
function shanXiangEvaluate(yun, yunStar, shanStar, xiangStar) {
  // 判断旺衰
  const wang = (star) => star === yun;
  const sheng = (star) => star === (yun % 9) + 1;
  const tui = (star) => star === ((yun + 7) % 9) + 1;

  let level = '平';
  let note = '';

  if (wang(shanStar) && wang(xiangStar)) {
    level = '大吉';
    note = '当旺山向齐到，丁财两旺';
  } else if (wang(shanStar)) {
    level = '吉';
    note = '旺星到山，旺丁';
  } else if (wang(xiangStar)) {
    level = '吉';
    note = '旺星到向，旺财';
  } else if (shanStar === 5 || xiangStar === 5) {
    level = '凶';
    note = `五黄飞临，${shanStar === 5 ? '山' : ''}${xiangStar === 5 ? '向' : ''}见煞，宜金属化解`;
  } else if (shanStar === 2 && xiangStar === 5) {
    level = '大凶';
    note = '二五交加，损主重病';
  } else if (shanStar === 5 && xiangStar === 2) {
    level = '大凶';
    note = '二五交加，损主重病';
  } else {
    note = `${NINE_STARS[shanStar]?.name}山${NINE_STARS[xiangStar]?.name}向`;
  }

  return { level, note };
}

// -----------------------------------------------------------
// B.1  旺山旺向判断
// -----------------------------------------------------------
/**
 * computeWangShanWangXiang(mountainStar, facingStar, yun)
 *
 * 判断飞星盘的全局格局：
 *   - 旺山旺向：山星到坐=当运，向星到向=当运
 *   - 上山下水：山星到向，向星到坐
 *   - 双星到向：山、向星均到向方
 *   - 双星到坐：山、向星均到坐方
 *
 * @param yun — 运数
 * @param sittingGua — 坐方卦数
 * @param facingGua  — 向方卦数
 * @param shanPan    — 山星盘 { 宫位代码: 星数 }
 * @param xiangPan   — 向星盘 { 宫位代码: 星数 }
 */
function computeWangShanWangXiang(yun, sittingGua, facingGua, shanPan, xiangPan) {
  const shanAtSitting  = shanPan[sittingGua];    // 山星在坐方
  const xiangAtFacing  = xiangPan[facingGua];     // 向星在向方
  const shanAtFacing   = shanPan[facingGua];      // 山星在向方
  const xiangAtSitting = xiangPan[sittingGua];    // 向星在坐方

  const wangXing = yun; // 当运旺星

  let pattern = '';
  let description = '';
  let isGood = false;

  // 旺山旺向：山星到坐方=当旺，向星到向方=当旺
  if (shanAtSitting === wangXing && xiangAtFacing === wangXing) {
    pattern = '旺山旺向';
    description = `当运${wangXing}运旺山旺向，丁财两旺，为最吉之格局。` +
      `《沈氏玄空学》："旺山旺向，丁财并发。"`;
    isGood = true;
  }
  // 上山下水：山星到向方、向星到坐方（颠倒）
  else if (shanAtFacing === wangXing && xiangAtSitting === wangXing) {
    pattern = '上山下水';
    description = `当运${wangXing}运上山下水，丁财两败。` +
      `山神下水则损丁，水神上山则破财。` +
      `《沈氏玄空学》："山上龙神不下水，水里龙神不上山。" 此为破格。`;
    isGood = false;
  }
  // 双星到向
  else if (shanAtFacing === wangXing && xiangAtFacing === wangXing) {
    pattern = '双星到向';
    description = `旺星${wangXing}运山向二星齐到向方。` +
      `旺财不旺丁，宜在向方见水聚财。` +
      `需另择旺丁之方布局。`;
    isGood = false; // 财旺但有缺陷
  }
  // 双星到坐
  else if (shanAtSitting === wangXing && xiangAtSitting === wangXing) {
    pattern = '双星到坐';
    description = `旺星${wangXing}运山向二星齐到坐方。` +
      `旺丁不旺财，宜在向方另布局引旺星。`;
    isGood = false;
  }
  // 其他格局
  else {
    // 看有没有旺星到山或到向
    const hasWangShan = shanAtSitting === wangXing;
    const hasWangXiang = xiangAtFacing === wangXing;

    if (hasWangShan && !hasWangXiang) {
      pattern = '旺山不旺向';
      description = `旺星到坐山，人丁旺而财禄平。`;
    } else if (!hasWangShan && hasWangXiang) {
      pattern = '旺向不旺山';
      description = `旺星到向方，财禄旺而人丁平。`;
    } else {
      pattern = '非旺山向';
      description = `当运旺星${wangXing}未到山向，需靠合十、生成等法补救。`;
    }
    isGood = false;
  }

  return {
    pattern,
    description,
    isGood,
    wangXing,
    sittingGua: GUAS[sittingGua]?.name,
    facingGua: GUAS[facingGua]?.name,
    shanAtSitting,
    xiangAtFacing,
    shanAtFacing,
    xiangAtSitting,
  };
}


// ============================================================
// === C. 形势派 — 按《葬书》《青囊经》 ===
// ============================================================

/**
 * computeXingshi(params)
 *
 * 形势派（峦头派）分析，基于《葬书》《青囊经》
 *
 * @param {Object} params
 *   - terrain:   'mountain'|'plain'|'urban' — 地形
 *   - waterNearby: boolean — 近水否
 *   - surrounding: string — 围合描述 ('open'|'semi-open'|'enclosed')
 *   - windExposure: number 0-1 — 风强程度
 *   - vegetation:  boolean — 植被覆盖
 *   - orientation: string — 朝向
 *
 * @returns 形势分析报告
 */
function computeXingshi(params = {}) {
  const {
    terrain = 'plain',
    waterNearby = false,
    surrounding = 'semi-open',
    windExposure = 0.5,
    vegetation = true,
    orientation = '南',
  } = params;

  // -----------------------------------------------------------
  // C.1  龙穴砂水四要素
  // -----------------------------------------------------------

  // 龙（山脉/地脉走势）
  const longEval = evaluateDragon(terrain, surrounding);

  // 穴（核心位置）
  const xueEval = evaluateXue(surrounding, waterNearby, vegetation);

  // 砂（周围山形/建筑）
  const shaEval = evaluateSha(surrounding);

  // 水（水流/道路）
  const shuiEval = evaluateWater(waterNearby, orientation);

  // -----------------------------------------------------------
  // C.2  《葬书》"气乘风则散，界水则止" — 藏风聚气
  // -----------------------------------------------------------
  const cangFengJuQi = evaluateCangFengJuQi(windExposure, waterNearby, surrounding, vegetation);

  // -----------------------------------------------------------
  // C.3  《青囊经》"理寓于气，气囿于形" — 形气相感
  // -----------------------------------------------------------
  const xingQiGanYing = {
    quote: '《青囊经》："理寓于气，气囿于形。"',
    analysis: analysisByTerrain(terrain, surrounding, waterNearby, vegetation),
  };

  // -----------------------------------------------------------
  // 综合评分
  // -----------------------------------------------------------
  const scores = {
    dragon: longEval.score,
    xue: xueEval.score,
    sha: shaEval.score,
    shui: shuiEval.score,
    cangFengJuQi: cangFengJuQi.score,
  };

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  // 满分 25
  const normalizedScore = Math.round((totalScore / 25) * 100);

  let overallLevel;
  if (normalizedScore >= 80) overallLevel = '上等形局';
  else if (normalizedScore >= 60) overallLevel = '中等形局';
  else if (normalizedScore >= 40) overallLevel = '下等形局';
  else overallLevel = '凶形';

  return {
    long: longEval,   // 龙
    xue: xueEval,     // 穴
    sha: shaEval,     // 砂
    shui: shuiEval,   // 水
    cangFengJuQi,     // 藏风聚气
    xingQiGanYing,    // 形气相感
    scores,
    totalScore,
    normalizedScore,
    overallLevel,
    advice: generateXingshiAdvice(params, normalizedScore),
    quotes: [
      '《葬书》："葬者，乘生气也。气乘风则散，界水则止。古人聚之使不散，行之使有止，故谓之风水。"',
      '《青囊经》："天尊地卑，阳奇阴偶。一六共宗，二七同道，三八为朋，四九为友，五十同途。阖辟奇偶，五兆生成。"',
      '《青囊奥语》："朱雀发源生旺气，一一讲说开愚蒙。一生二兮二生三，三生万物是玄关。"',
    ],
    /**
     * 《葬书》："风水之法，得水为上，藏风次之。"
     */
    zangshuMotto: '《葬书》："风水之法，得水为上，藏风次之。" 若水近而清、环抱有情，则气聚而旺。',
  };
}

// --- 形势派辅助函数 ---

function evaluateDragon(terrain, surrounding) {
  let analysis = '';
  let score = 0;

  if (terrain === 'mountain') {
    analysis = '山地之龙，来脉有根。若背靠高山、左右有护，则龙气旺盛。';
    score = 4;
    if (surrounding === 'enclosed') {
      analysis += ' 群山环抱，龙脉有情。';
      score = 5;
    } else if (surrounding === 'open') {
      analysis += ' 但砂不护穴，龙气有泄。';
      score = 3;
    }
  } else if (terrain === 'plain') {
    analysis = '平原之龙，以水为脉。《葬书》："高一寸为山，低一寸为水。" 平原地形以微高为龙。';
    score = 3;
    if (surrounding === 'enclosed') score = 4;
  } else {
    // urban
    analysis = '城市之龙，以楼宇为山，以道路为水。高层建筑可为靠。';
    score = 3;
  }

  return {
    quote: '《葬书》："地势原脉，山势原骨，委蛇东西，或为南北。"',
    analysis,
    score,
  };
}

function evaluateXue(surrounding, waterNearby, vegetation) {
  let analysis = '';
  let score = 0;

  if (surrounding === 'enclosed') {
    analysis = '穴居中央，四周有护。藏风聚气，为吉。';
    score = 5;
  } else if (surrounding === 'semi-open') {
    analysis = '穴有半围之护，尚可纳气。宜以植物或建筑补全围合。';
    score = 3;
  } else {
    analysis = '穴处开阔，无砂护卫。气散难聚，宜植树或筑墙以藏风。';
    score = 1;
  }

  if (waterNearby && score < 5) score += 1;
  if (vegetation && score < 5) score += 1;

  return {
    quote: '《葬书》："穴者，山止气聚之所也。"',
    analysis,
    score: Math.min(score, 5),
  };
}

function evaluateSha(surrounding) {
  let analysis = '';
  let score = 0;

  switch (surrounding) {
    case 'enclosed':
      analysis = '青龙蜿蜒、白虎驯服、朱雀翔舞、玄武垂头——四兽齐全，砂形完美。';
      score = 5;
      break;
    case 'semi-open':
      analysis = '砂形半全，部分方位空缺。宜补植树木或筑矮墙以补砂缺。';
      score = 3;
      break;
    case 'open':
      analysis = '四野空旷，砂形不护。无青龙白虎护卫，气散不聚。';
      score = 1;
      break;
    default:
      analysis = '砂形未明。';
      score = 2;
  }

  return {
    quote: '《葬书》："青龙蜿蜒，白虎驯服，朱雀翔舞，玄武垂头，形势反此，法当破死。"',
    analysis,
    score,
  };
}

function evaluateWater(waterNearby, orientation) {
  let analysis = '';
  let score = 0;

  if (waterNearby) {
    // 水在何方？
    // 《葬书》："朱雀发源生旺气"——水在向方(如朝南宅水在南)为吉
    score = 4;
    if (orientation === '南' || orientation === '东南' || orientation === '东') {
      analysis = '近水且在吉方，财气有源。《葬书》："得水为上。"';
      score = 5;
    } else if (orientation === '北' || orientation === '西北') {
      analysis = '近水但在背方，水气有泄。宜以植物或土石调整。';
      score = 3;
    } else {
      analysis = '近水可聚气，但需看水形环抱还是反弓。';
      score = 4;
    }
  } else {
    analysis = '不见水，气行无界。《葬书》："界水则止。" 无水则气不易聚。宜在明堂设水景或鱼缸以引气。';
    score = 1;
  }

  return {
    quote: '《葬书》："风水之法，得水为上，藏风次之。"',
    analysis,
    score,
  };
}

function evaluateCangFengJuQi(windExposure, waterNearby, surrounding, vegetation) {
  let analysis = '';
  let score = 0;

  const windScore = 1 - windExposure; // 风越小越藏风

  if (windScore >= 0.7) {
    analysis = '藏风佳，气不易散。';
    score = 5;
  } else if (windScore >= 0.4) {
    analysis = '藏风尚可，偶有风侵。';
    score = 3;
  } else {
    analysis = '风大，气易散。宜植树筑墙以藏风。';
    score = 1;
  }

  if (waterNearby) {
    analysis += ' 有水界气，气聚更佳。';
    score = Math.min(score + 1, 5);
  }
  if (surrounding === 'enclosed') {
    score = Math.min(score + 1, 5);
  }
  if (!vegetation) {
    score = Math.max(score - 1, 1);
    analysis += ' 但植被少，土气不固。';
  }

  return {
    quote: '《葬书》："气乘风则散，界水则止。" 藏风聚气，风水之要。',
    analysis,
    score,
  };
}

function analysisByTerrain(terrain, surrounding, waterNearby, vegetation) {
  if (terrain === 'mountain') {
    return '山地之气，随山势起伏流转。形局以环抱为佳，忌直来直去。山主人丁，山形端正则人丁兴旺。';
  } else if (terrain === 'plain') {
    return '平原之气，以微高为龙、水流为脉。水主财禄，水流环抱则财源广进。形局以方正、围合为美。';
  } else {
    return '城市之气，以道路为水、楼宇为山。形局以方正不缺角、不冲射为佳。避路冲、尖角、反弓。';
  }
}

function generateXingshiAdvice(params, score) {
  const advices = [];

  if (params.windExposure > 0.6) {
    advices.push('风大则气散：《葬书》云"气乘风则散"。宜在风口处植树或筑墙以藏风。');
  }
  if (!params.waterNearby) {
    advices.push('近水聚气：《葬书》云"界水则止"。宜在明堂设水景、鱼缸或喷泉以聚气。');
  }
  if (params.surrounding === 'open') {
    advices.push('围合不足：《葬书》云"青龙蜿蜒，白虎驯服"。宜补植树木或设置低矮篱墙以护气。');
  }
  if (!params.vegetation) {
    advices.push('植被缺乏：土气不固。宜种植常绿植物以固土聚气。');
  }
  if (params.terrain === 'urban') {
    advices.push('城市宅居：避开门对电梯、楼梯、长走廊（路冲煞），床头宜靠实墙，忌横梁压顶。');
  }

  if (advices.length === 0) {
    advices.push('形局总体良好，保持植被养护和水景清洁即可。');
  }

  return advices;
}


// ============================================================
// === D. 综合风水分析 ===
// ============================================================

/**
 * comprehensiveFengshui(params)
 * 一站式风水综合分析，结合八宅、玄空、形势三派
 *
 * @param {Object} params
 *   - birthYear: number — 出生年份
 *   - sex:       string — 'male' | 'female'
 *   - houseYear: number — 建宅/入住年份
 *   - sitting:   string — 坐方（如 '北'）
 *   - facing:    string — 向方（如 '南'）
 *   - floor:     number — 楼层
 *   - terrain:   string — 地形 'mountain'|'plain'|'urban'
 *   - waterNearby: boolean
 *   - surrounding: string
 *   - windExposure: number 0-1
 *   - vegetation: boolean
 *
 * @returns 综合分析报告
 */
function comprehensiveFengshui(params = {}) {
  const {
    birthYear = 1990,
    sex = 'male',
    houseYear,
    sitting = '北',
    facing = '南',
    floor = 1,
  } = params;

  // A. 八宅 — 命卦 + 八游星
  const mingGua   = computeMingGua(birthYear, sex);
  const dongXiSi  = computeDongXiSi(mingGua);
  const baYouXing = computeBaYouXing(mingGua);

  // B. 玄空飞星
  const buildYr = houseYear || new Date().getFullYear();
  const yunInfo = computeYun(buildYr);
  const feiXing = computeFeixing(yunInfo.yun, sitting, facing);

  // C. 形势
  const xingShi = computeXingshi(params);

  // D. 八宅宅命相配
  const zhaiGua = DIR_TO_GUA[sitting];
  const isZhaiCompatible = mingGua.isDong
    ? DONG_SI_GUAS.has(zhaiGua)
    : XI_SI_GUAS.has(zhaiGua);

  // E. 楼层五行分析
  const floorRemainder = floor % 10;
  const floorWuxingMap = { 1: '水', 2: '火', 3: '木', 4: '金', 5: '土', 6: '水', 7: '火', 8: '木', 9: '金', 0: '土' };
  const floorWuxing = floorWuxingMap[floorRemainder];

  return {
    mingGua,
    dongXiSi,
    baYouXing,
    yunInfo,
    feiXing,
    xingShi,
    zhaiGua: { gua: zhaiGua, guaName: GUAS[zhaiGua].name },
    isZhaiMingMatch: isZhaiCompatible,
    floor: { num: floor, wuxing: floorWuxing },
    /**
     * 《八宅明镜》："宅之吉凶全在大门……大门者，气口也。"
     * 《沈氏玄空学》："山上龙神不下水，水里龙神不上山。"
     * 《葬书》："气乘风则散，界水则止。"
     */
    summary: generateSummary(mingGua, isZhaiCompatible, feiXing, xingShi),
  };
}

function generateSummary(mingGua, isZhaiCompatible, feiXing, xingShi) {
  const parts = [];

  // 宅命
  if (isZhaiCompatible) {
    parts.push(`宅命相配：${mingGua.type}居${mingGua.isDong ? '东四宅' : '西四宅'}，人宅相安。`);
  } else {
    parts.push(`宅命不配：${mingGua.type}居${mingGua.isDong ? '西四宅' : '东四宅'}，需在吉方设主卧调和。`);
  }

  // 玄空
  parts.push(`玄空格局：${feiXing.wangAnalysis.pattern}。${feiXing.wangAnalysis.description}`);

  // 形势
  parts.push(`形势：${xingShi.overallLevel}（${xingShi.normalizedScore}分）。${xingShi.cangFengJuQi.analysis}`);

  return parts.join('\n');
}

// ============================================================
// === D.2 玄空飞星组合断 — analyzeFeixingCombo ===
// ============================================================

/**
 * 25种常见飞星组合含义表
 * 格式: '山星-向星' → { name, jixiong, area, desc }
 */
var FEIXING_COMBOS = {
  '1-4': { name: '文昌组合', jixiong: '吉', area: '学业/桃花', desc: '一白水生四绿木，主文昌发秀，利读书考试、文职升迁。少年主聪慧，成年主桃花人缘。' },
  '1-1': { name: '比和组合', jixiong: '吉', area: '官贵/人缘', desc: '一白重逢，主官贵齐聚、人缘极佳，利仕途与社交。' },
  '1-6': { name: '金水相生', jixiong: '吉', area: '官运/偏财', desc: '六白金生一白水，主官升迁、偏财旺，利远行求谋。' },
  '1-7': { name: '水火交战', jixiong: '凶', area: '感情/口舌', desc: '一白水克七赤金，主口舌是非、感情波折，宜用木通关化解。' },
  '1-8': { name: '土水相克', jixiong: '凶', area: '健康/子嗣', desc: '八白土克一白水，主中男有灾、肾病、子嗣艰难，宜用金化解。' },
  '1-9': { name: '水火既济', jixiong: '吉', area: '喜庆/姻缘', desc: '一白水与九紫火，水火既济，主喜庆姻缘、添丁进财。' },
  '2-5': { name: '病符组合', jixiong: '大凶', area: '健康/灾祸', desc: '二黑土与五黄土交加，主重病、灾祸、损主，宜用金属六铜钱化解。' },
  '2-2': { name: '病符重叠', jixiong: '凶', area: '健康', desc: '二黑重叠，病符力量倍增，主久病不愈、妇科疾病，宜金属化解。' },
  '2-7': { name: '先天火土', jixiong: '吉', area: '财运/喜庆', desc: '二七先天合火，主喜庆进财、置业，但过旺则主火灾，需注意防火。' },
  '2-8': { name: '比和土旺', jixiong: '平', area: '财运/健康', desc: '二八同为土，比和则财旺但土过旺主脾胃病，宜金泄土。' },
  '3-7': { name: '贼盗组合', jixiong: '凶', area: '破财/争斗', desc: '三碧木与七赤金，金克木主贼盗、破财、争斗，宜用水通关或火制金。' },
  '3-3': { name: '禄存重叠', jixiong: '凶', area: '口舌/官非', desc: '三碧重叠，主口舌官非、兄弟不和，宜用火泄木气化解。' },
  '3-4': { name: '碧绿风魔', jixiong: '凶', area: '口舌/健康', desc: '三四同为木，主口舌是非、风疾、手脚受伤，宜火泄之。' },
  '3-8': { name: '木土相克', jixiong: '凶', area: '健康/财运', desc: '三碧木克八白土，主脾胃病、破财，宜火通关化解。' },
  '3-9': { name: '木火通明', jixiong: '吉', area: '学业/事业', desc: '三碧木生九紫火，木火通明主文才出众、事业升迁，利学业考试。' },
  '4-1': { name: '文昌组合', jixiong: '吉', area: '学业/桃花', desc: '四绿木与一白水，水生木主文昌发秀，利读书、考试、文职。' },
  '4-4': { name: '文曲重叠', jixiong: '吉', area: '学业', desc: '四绿重叠主文昌极旺，利学术研究，但过旺则主桃花困扰。' },
  '4-7': { name: '金克木', jixiong: '凶', area: '健康/破财', desc: '七赤金克四绿木，主呼吸道疾病、破财，宜水通关化解。' },
  '4-8': { name: '木土相克', jixiong: '凶', area: '健康', desc: '四绿木克八白土，主脾胃病、消化不良，宜火化解。' },
  '6-1': { name: '金水相生', jixiong: '吉', area: '官运/偏财', desc: '六白金生一白水，主官贵升迁、偏财进益，利武职远行。' },
  '6-6': { name: '武曲重叠', jixiong: '吉', area: '官运/偏财', desc: '六白重叠主权力集中、偏财旺，但过刚易折，宜水泄金。' },
  '6-8': { name: '土金相生', jixiong: '吉', area: '财运/置业', desc: '八白土生六白金，主财运亨通、置业有利，丁财两旺。' },
  '7-3': { name: '贼盗组合', jixiong: '凶', area: '破财/争斗', desc: '七赤金克三碧木，主贼盗、破财、口舌争斗，宜水通关化解。' },
  '8-8': { name: '左辅重叠', jixiong: '吉', area: '正财/置业', desc: '八白重叠主正财极旺、置业有利，但土过旺主脾胃病，宜金泄。' },
  '9-1': { name: '火水未济', jixiong: '凶', area: '健康/感情', desc: '九紫火与一白水，水火未济主感情波折、心血管疾病，宜木通关。' }
};

/**
 * 五行生克关系判断
 * @returns {string} '生'/'克'/'比和'
 */
function wxRelation(a, b) {
  var wxA = NINE_STARS[a] ? NINE_STARS[a].wuxing : '';
  var wxB = NINE_STARS[b] ? NINE_STARS[b].wuxing : '';
  if (!wxA || !wxB) return '未知';
  if (wxA === wxB) return '比和';
  var shengMap = { '金': '水', '水': '木', '木': '火', '火': '土', '土': '金' };
  var keMap = { '金': '木', '木': '土', '土': '水', '水': '火', '火': '金' };
  if (shengMap[wxA] === wxB) return '生(山生向)';
  if (shengMap[wxB] === wxA) return '生(向生山)';
  if (keMap[wxA] === wxB) return '克(山克向)';
  if (keMap[wxB] === wxA) return '克(向克山)';
  return '未知';
}

/**
 * analyzeFeixingCombo(panData)
 * 玄空飞星组合断 — 分析山星与向星组合的含义
 *
 * @param {Object} panData — computeFeixing() 的返回值
 * @returns {Object} { combos, daoShanDaoXiang, summary }
 */
function analyzeFeixingCombo(panData) {
  var gongPositions = panData.gongPositions || {};
  var yun = panData.yun || 1;
  var wangXing = yun; // 当运旺星
  var combos = [];

  // 遍历九宫，分析每宫的山星-向星组合
  for (var gongNum in gongPositions) {
    if (!gongPositions.hasOwnProperty(gongNum)) continue;
    var gData = gongPositions[gongNum];
    var shanStar = gData.shan;
    var xiangStar = gData.xiang;
    var key = shanStar + '-' + xiangStar;
    var combo = FEIXING_COMBOS[key];

    // 运星与山向星的关系
    var yunStar = gData.yun;
    var yunShanRel = wxRelation(yunStar, shanStar);
    var yunXiangRel = wxRelation(yunStar, xiangStar);

    // 判断该宫是否为到山/到向
    var isDaoShan = (shanStar === wangXing);
    var isDaoXiang = (xiangStar === wangXing);

    var comboItem = {
      gong: gData.gua || '',
      direction: gData.direction || '',
      shanStar: shanStar,
      xiangStar: xiangStar,
      yunStar: yunStar,
      comboName: combo ? combo.name : shanStar + '-' + xiangStar + '组合',
      jixiong: combo ? combo.jixiong : '平',
      area: combo ? combo.area : '一般',
      desc: combo ? combo.desc : NINE_STARS[shanStar].name + '山' + NINE_STARS[xiangStar].name + '向，组合无特殊吉凶。',
      yunShanRel: yunShanRel,
      yunXiangRel: yunXiangRel,
      isDaoShan: isDaoShan,
      isDaoXiang: isDaoXiang
    };
    combos.push(comboItem);
  }

  // 到山到向 vs 上山下水判断
  var sittingGua = panData.sitting ? panData.sitting.gua : null;
  var facingGua = panData.facing ? panData.facing.gua : null;
  var shanPan = panData.shanPan || {};
  var xiangPan = panData.xiangPan || {};

  var shanAtSitting = sittingGua ? shanPan[sittingGua] : null;
  var xiangAtFacing = facingGua ? xiangPan[facingGua] : null;
  var shanAtFacing = facingGua ? shanPan[facingGua] : null;
  var xiangAtSitting = sittingGua ? xiangPan[sittingGua] : null;

  var daoShanDaoXiang = {
    isDaoShanDaoXiang: false,
    isShangShanXiaShui: false,
    isShuangXingDaoXiang: false,
    isShuangXingDaoShan: false,
    pattern: '',
    desc: ''
  };

  if (shanAtSitting === wangXing && xiangAtFacing === wangXing) {
    daoShanDaoXiang.isDaoShanDaoXiang = true;
    daoShanDaoXiang.pattern = '到山到向';
    daoShanDaoXiang.desc = '当运旺星' + wangXing + '到山到向，丁财两旺，为玄空最吉之格局。《沈氏玄空学》："旺山旺向，丁财并发。"';
  } else if (shanAtFacing === wangXing && xiangAtSitting === wangXing) {
    daoShanDaoXiang.isShangShanXiaShui = true;
    daoShanDaoXiang.pattern = '上山下水';
    daoShanDaoXiang.desc = '当运旺星' + wangXing + '上山下水，山神下水损丁，水神上山破财。《沈氏玄空学》："山上龙神不下水，水里龙神不上山。"此为破格。';
  } else if (shanAtFacing === wangXing && xiangAtFacing === wangXing) {
    daoShanDaoXiang.isShuangXingDaoXiang = true;
    daoShanDaoXiang.pattern = '双星到向';
    daoShanDaoXiang.desc = '当运旺星' + wangXing + '双星到向，旺财不旺丁，宜向方见水聚财。';
  } else if (shanAtSitting === wangXing && xiangAtSitting === wangXing) {
    daoShanDaoXiang.isShuangXingDaoShan = true;
    daoShanDaoXiang.pattern = '双星到坐';
    daoShanDaoXiang.desc = '当运旺星' + wangXing + '双星到坐，旺丁不旺财，宜另布旺财之局。';
  } else {
    daoShanDaoXiang.pattern = '非旺山向';
    daoShanDaoXiang.desc = '当运旺星' + wangXing + '未到山向，需靠合十、生成等法补救。';
  }

  // 汇总
  var goodCombos = combos.filter(function(c) { return c.jixiong === '吉' || c.jixiong === '大吉'; });
  var badCombos = combos.filter(function(c) { return c.jixiong === '凶' || c.jixiong === '大凶'; });
  var summary = '玄空飞星组合断：共分析' + combos.length + '宫位。';
  summary += '到山到向格局：' + daoShanDaoXiang.pattern + '。';
  if (goodCombos.length > 0) {
    summary += '吉组合' + goodCombos.length + '组：' + goodCombos.map(function(c) { return c.gong + c.comboName; }).join('、') + '。';
  }
  if (badCombos.length > 0) {
    summary += '凶组合' + badCombos.length + '组：' + badCombos.map(function(c) { return c.gong + c.comboName; }).join('、') + '，需化解。';
  }
  summary += daoShanDaoXiang.desc;

  return {
    combos: combos,
    daoShanDaoXiang: daoShanDaoXiang,
    summary: summary
  };
}

// ============================================================
// === D.3 流年飞星叠加 — analyzeLiunianFeixing ===
// ============================================================

/**
 * 流年飞星入中宫计算
 * 《沈氏玄空学》：上元甲子年中宫一白入中
 * 口诀：上元甲子一白求，中元四绿木为头，下元七赤为大位，逐年逆行是真途。
 * 即：上元(1864-1923)起始一白，中元(1924-1983)起始四绿，下元(1984-2043)起始七赤
 * 逐年逆飞（中宫星数递减）
 *
 * @param {number} year — 公元年份
 * @returns {number} 该年入中宫的流年飞星 (1-9)
 */
function computeLiunianZhongGong(year) {
  // 三元起始星：上元1，中元4，下元7
  var startStar;
  if (year >= 1864 && year <= 1923) startStar = 1;
  else if (year >= 1924 && year <= 1983) startStar = 4;
  else if (year >= 1984 && year <= 2043) startStar = 7;
 else if (year >= 2044 && year <= 2103) startStar = 1; // 下一上元
  else startStar = 7; // 默认下元

  // 逐年逆飞：距元年之差，中宫星递减
  var elapsed = year - (year >= 1984 ? 1984 : year >= 1924 ? 1924 : 1864);
  var zhongGong = ((startStar - 1 - elapsed) % 9 + 9) % 9 + 1;
  return zhongGong;
}

/**
 * analyzeLiunianFeixing(panData, year)
 * 流年飞星叠加分析
 *
 * @param {Object} panData — computeFeixing() 的返回值
 * @param {number} year — 要分析的公历年份
 * @returns {Object} { year, zhongGong, feixing, interactions, summary }
 */
function analyzeLiunianFeixing(panData, year) {
  // 1. 计算流年飞星入中宫
  var lnZhongGong = computeLiunianZhongGong(year);

  // 2. 流年飞星盘（顺飞入中）
  var lnPan = feiStar(lnZhongGong);

  // 3. 九宫流年飞星与运盘/山向盘叠加
  var yunPan = panData.yunPan || {};
  var shanPan = panData.shanPan || {};
  var xiangPan = panData.xiangPan || {};
  var yun = panData.yun || 1;
  var wangXing = yun;

  var feixing = [];
  var interactions = [];
  var gongNames = { 1: '坎(北)', 2: '坤(西南)', 3: '震(东)', 4: '巽(东南)', 5: '中宫', 6: '乾(西北)', 7: '兑(西)', 8: '艮(东北)', 9: '离(南)' };

  for (var gongNum = 1; gongNum <= 9; gongNum++) {
    if (gongNum === 5) continue; // 中宫单独处理
    var gStr = String(gongNum);
    var lnStar = lnPan[gongNum] || 0;
    var yunStar = yunPan[gongNum] || 0;
    var shanStar = shanPan[gongNum] || 0;
    var xiangStar = xiangPan[gongNum] || 0;

    var lnInfo = NINE_STARS[lnStar] || { name: '?' };
    var yunInfo = NINE_STARS[yunStar] || { name: '?' };

    feixing.push({
      gong: gongNames[gongNum] || '',
      gongNum: gongNum,
      lnStar: lnStar,
      lnName: lnInfo.name || '',
      yunStar: yunStar,
      shanStar: shanStar,
      xiangStar: xiangStar
    });

    // 流年飞星与运盘飞星叠加
    var lnYunRel = wxRelation(lnStar, yunStar);
    // 流年飞星与山星叠加
    var lnShanRel = wxRelation(lnStar, shanStar);
    // 流年飞星与向星叠加
    var lnXiangRel = wxRelation(lnStar, xiangStar);

    // 吉凶变化判断
    var change = '平';
    var detail = '';

    // 流年旺星到该宫
    if (lnStar === wangXing) {
      change = '吉';
      detail = '流年旺星' + wangXing + '(' + (NINE_STARS[wangXing] ? NINE_STARS[wangXing].name : '') + ')飞临' + (gongNames[gongNum] || '') + '，激活该宫能量，主此年该方位大吉。';
    }
    // 流年五黄飞临
    else if (lnStar === 5) {
      change = '凶';
      detail = '流年五黄煞飞临' + (gongNames[gongNum] || '') + '，主灾病、官非，宜安金属化解，不宜动土修造。';
    }
    // 流年二黑飞临
    else if (lnStar === 2) {
      change = '凶';
      detail = '流年二黑病符飞临' + (gongNames[gongNum] || '') + '，主健康欠佳、小病不断，宜金属化解。';
    }
    // 流年三碧飞临
    else if (lnStar === 3) {
      change = '凶';
      detail = '流年三碧禄存飞临' + (gongNames[gongNum] || '') + '，主口舌是非、官非争斗，宜火泄之。';
    }
    // 流年七赤飞临
    else if (lnStar === 7) {
      change = '凶';
      detail = '流年七赤破军飞临' + (gongNames[gongNum] || '') + '，主破财、争斗，宜水泄之。';
    }
    // 流年一白/四绿/六白/八白/九紫飞临
    else if (lnStar === 1 || lnStar === 4) {
      change = '吉';
      detail = '流年' + (NINE_STARS[lnStar] ? NINE_STARS[lnStar].name : '') + '飞临' + (gongNames[gongNum] || '') + '，主文昌官贵、人缘桃花，此年该方位吉利。';
    }
    else if (lnStar === 6 || lnStar === 8) {
      change = '吉';
      detail = '流年' + (NINE_STARS[lnStar] ? NINE_STARS[lnStar].name : '') + '飞临' + (gongNames[gongNum] || '') + '，主官运偏财、正财置业，此年该方位吉利。';
    }
    else if (lnStar === 9) {
      change = '吉';
      detail = '流年九紫右弼飞临' + (gongNames[gongNum] || '') + '，主喜庆姻缘、添丁进财，此年该方位吉利。';
    }

    // 与运盘叠加后的变化
    if (lnStar === yunStar && lnStar !== 5 && lnStar !== 2) {
      detail += ' 流年星与运盘星同宫，力量倍增。';
    }
    if (lnStar === shanStar && shanStar === wangXing) {
      detail += ' 流年星冲动山星旺星，丁气发动。';
      change = '吉';
    }
    if (lnStar === xiangStar && xiangStar === wangXing) {
      detail += ' 流年星冲动向星旺星，财气发动。';
      change = '吉';
    }

    interactions.push({
      gong: gongNames[gongNum] || '',
      gongNum: gongNum,
      lnStar: lnStar,
      lnName: NINE_STARS[lnStar] ? NINE_STARS[lnStar].name : '',
      yunStar: yunStar,
      shanStar: shanStar,
      xiangStar: xiangStar,
      lnYunRel: lnYunRel,
      lnShanRel: lnShanRel,
      lnXiangRel: lnXiangRel,
      change: change,
      detail: detail
    });
  }

  // 中宫叠加
  var zhongGongInfo = {
    gong: '中宫',
    gongNum: 5,
    lnStar: lnZhongGong,
    lnName: NINE_STARS[lnZhongGong] ? NINE_STARS[lnZhongGong].name : '',
    yunStar: yunPan[5] || 0,
    shanStar: shanPan[5] || 0,
    xiangStar: xiangPan[5] || 0
  };
  feixing.unshift(zhongGongInfo);

  // 汇总
  var goodCount = interactions.filter(function(i) { return i.change === '吉'; }).length;
  var badCount = interactions.filter(function(i) { return i.change === '凶'; }).length;
  var summary = year + '年流年飞星' + lnZhongGong + '(' + (NINE_STARS[lnZhongGong] ? NINE_STARS[lnZhongGong].name : '') + ')入中宫。';
  summary += '吉位' + goodCount + '个，凶位' + badCount + '个。';
  if (lnZhongGong === wangXing) {
    summary += '流年旺星入中宫，全年运势大旺，丁财两旺。';
  } else if (lnZhongGong === 5) {
    summary += '流年五黄入中宫，全年须慎防灾病，中宫不宜动土，宜安金属化解。';
  } else if (lnZhongGong === 2) {
    summary += '流年二黑入中宫，全年健康运势偏弱，宜金属化解。';
  }
  // 找出最吉和最凶方位
  var goodGongs = interactions.filter(function(i) { return i.change === '吉'; }).map(function(i) { return i.gong; });
  var badGongs = interactions.filter(function(i) { return i.change === '凶'; }).map(function(i) { return i.gong; });
  if (goodGongs.length > 0) summary += '吉位：' + goodGongs.join('、') + '。';
  if (badGongs.length > 0) summary += '凶位：' + badGongs.join('、') + '，需化解。';

  return {
    year: year,
    zhongGong: zhongGongInfo,
    feixing: feixing,
    interactions: interactions,
    summary: summary
  };
}


// ============================================================
// === E. 模块导出 ===
// ============================================================

// CommonJS / ESM 兼容导出
if (typeof module !== 'undefined' && module.exports) {

window.FengshuiV3 = {
    // A. 八宅
    computeMingGua,
    computeDongXiSi,
    computeBaYouXing,
    // B. 玄空
    computeYun,
    computeFeixing,
    computeWangShanWangXiang,
    // C. 形势
    computeXingshi,
    // D. 综合
    comprehensiveFengshui,
    // D.2 飞星组合断
    analyzeFeixingCombo,
    // D.3 流年飞星叠加
    analyzeLiunianFeixing,
    // 常量
    GUAS,
    DONG_SI_GUAS,
    XI_SI_GUAS,
    DIR_TO_GUA,
    GUA_TO_DIR,
    NINE_STARS,
  };
};

})();

// ════════════════════════════════════════════════════════════════
//  引擎 3/5: LiuyaoV3
// ════════════════════════════════════════════════════════════════

(function() {
'use strict';

/**
 * liuyao-v3.js — 六爻占卜引擎 v3
 *
 * 基于《黄金策》《增删卜易》《卜筮正宗》校准
 *
 * 核心算法：
 *   1. 起卦法：三枚铜钱，字=2，背=3。6=老阴，7=少阳，8=少阴，9=老阳
 *   2. 卦象排列：从下到上六爻，内卦（下三爻）外卦（上三爻）
 *   3. 动爻：老阴6→变阳，老阳9→变阴
 *   4. 纳甲法完整实现（八宫六十四卦的干支配置）
 *   5. 六亲排布算法（父母/兄弟/子孙/妻财/官鬼）
 *   6. 六神排布算法（青龙/朱雀/勾陈/螣蛇/白虎/玄武）
 *   7. 世应定位算法（八宫世应位置）
 *   8. 用神选取逻辑
 */


// ═══════════════════════════════════════════════
// 第一部分：基础常量
// ═══════════════════════════════════════════════

const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

const ZHI_WX = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木',
  '辰': '土', '巳': '火', '午': '火', '未': '土',
  '申': '金', '酉': '金', '戌': '土', '亥': '水',
};

const GAN_WX = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火',
  '戊': '土', '己': '土', '庚': '金', '辛': '金',
  '壬': '水', '癸': '水',
};

const WX_SHENG = { '金': '水', '水': '木', '木': '火', '火': '土', '土': '金' };
const WX_KE    = { '金': '木', '木': '土', '土': '水', '水': '火', '火': '金' };

const LIUQIN_NAMES = ['父母', '兄弟', '子孙', '妻财', '官鬼'];
const LIUSHEN_NAMES = ['青龙', '朱雀', '勾陈', '螣蛇', '白虎', '玄武'];

const GONG_WX = {
  '乾': '金', '坎': '水', '艮': '土', '震': '木',
  '巽': '木', '离': '火', '坤': '土', '兑': '金',
};

/** 三爻数组 → 卦名 */
function trigramToName(tri) {
  const map = {
    '111': '乾', '110': '兑', '101': '离', '100': '震',
    '011': '巽', '010': '坎', '001': '艮', '000': '坤',
  };
  return map[tri.join('')];
}

// ═══════════════════════════════════════════════
// 第二部分：八宫六十四卦表
// ═══════════════════════════════════════════════

/**
 * 八宫变化规则：
 *   本宫(纯卦) → 初爻变(一世) → 二爻变(二世) → 三爻变(三世)
 *   → 四爻变(四世) → 五爻变(五世) → 四爻还原(游魂) → 下卦还原(归魂)
 *
 * 世爻位置：本宫→上(5), 一世→初(0), 二世→二(1), 三世→三(2),
 *           四世→四(3), 五世→五(4), 游魂→四(3), 归魂→三(2)
 *
 * 应爻位置：世应相隔三位
 *   世0→应3, 世1→应4, 世2→应5, 世3→应0, 世4→应1, 世5→应2
 */

/** 计算应爻位置 */
function _yeFromShi(shi) {
  return (shi + 3) % 6;
}

const BAGONG = [
  // ── 乾宫（金）── 乾→姤→遁→否→观→剥→晋→大有
  { name: '乾',   upper: [1,1,1], lower: [1,1,1], gong: '乾', shi: 5 }, // 本宫
  { name: '姤',   upper: [1,1,1], lower: [0,1,1], gong: '乾', shi: 0 }, // 一世
  { name: '遁',   upper: [1,1,1], lower: [0,0,1], gong: '乾', shi: 1 }, // 二世
  { name: '否',   upper: [1,1,1], lower: [0,0,0], gong: '乾', shi: 2 }, // 三世
  { name: '观',   upper: [0,1,1], lower: [0,0,0], gong: '乾', shi: 3 }, // 四世
  { name: '剥',   upper: [0,0,1], lower: [0,0,0], gong: '乾', shi: 4 }, // 五世
  { name: '晋',   upper: [0,1,1], lower: [0,0,1], gong: '乾', shi: 3 }, // 游魂
  { name: '大有', upper: [1,1,1], lower: [1,0,1], gong: '乾', shi: 2 }, // 归魂

  // ── 坎宫（水）── 坎→节→屯→既济→革→丰→明夷→师
  { name: '坎',   upper: [0,1,0], lower: [0,1,0], gong: '坎', shi: 5 },
  { name: '节',   upper: [1,1,0], lower: [0,1,0], gong: '坎', shi: 0 },
  { name: '屯',   upper: [0,1,0], lower: [1,0,0], gong: '坎', shi: 1 },
  { name: '既济', upper: [1,0,1], lower: [0,1,0], gong: '坎', shi: 2 },
  { name: '革',   upper: [1,1,0], lower: [1,0,1], gong: '坎', shi: 3 },
  { name: '丰',   upper: [1,0,0], lower: [1,0,1], gong: '坎', shi: 4 },
  { name: '明夷', upper: [0,0,0], lower: [1,0,1], gong: '坎', shi: 3 },
  { name: '师',   upper: [0,0,0], lower: [0,1,0], gong: '坎', shi: 2 },

  // ── 艮宫（土）── 艮→贲→大畜→损→睽→履→中孚→渐
  { name: '艮',   upper: [0,0,1], lower: [0,0,1], gong: '艮', shi: 5 },
  { name: '贲',   upper: [1,0,1], lower: [0,0,1], gong: '艮', shi: 0 }, // 初爻变
  { name: '大畜', upper: [0,0,1], lower: [1,1,1], gong: '艮', shi: 1 }, // 初二变
  { name: '损',   upper: [0,0,1], lower: [1,1,0], gong: '艮', shi: 2 }, // 初二三变
  { name: '睽',   upper: [1,0,1], lower: [1,1,0], gong: '艮', shi: 3 }, // 初三四变
  { name: '履',   upper: [1,1,1], lower: [1,1,0], gong: '艮', shi: 4 }, // 初三五变
  { name: '中孚', upper: [0,1,1], lower: [1,1,0], gong: '艮', shi: 3 }, // 游魂：四爻还原
  { name: '渐',   upper: [0,1,1], lower: [0,0,1], gong: '艮', shi: 2 }, // 归魂：下卦还原

  // ── 震宫（木）── 震→豫→解→恒→升→井→大过→随
  { name: '震',   upper: [1,0,0], lower: [1,0,0], gong: '震', shi: 5 },
  { name: '豫',   upper: [1,0,0], lower: [0,0,0], gong: '震', shi: 0 }, // 一世：初爻变
  { name: '解',   upper: [1,0,0], lower: [0,1,0], gong: '震', shi: 1 }, // 二世：二爻变
  { name: '恒',   upper: [1,0,0], lower: [0,1,1], gong: '震', shi: 2 }, // 三世：三爻变
  { name: '升',   upper: [0,0,0], lower: [0,1,1], gong: '震', shi: 3 }, // 四世：上卦初爻变
  { name: '井',   upper: [0,1,0], lower: [0,1,1], gong: '震', shi: 4 }, // 五世：上卦二爻变
  { name: '大过', upper: [1,1,0], lower: [0,1,1], gong: '震', shi: 3 }, // 游魂：四爻还原
  { name: '随',   upper: [1,1,0], lower: [1,0,0], gong: '震', shi: 2 }, // 归魂：下卦还原

  // ── 巽宫（木）── 巽→小畜→家人→益→无妄→噬嗑→颐→蛊
  { name: '巽',   upper: [0,1,1], lower: [0,1,1], gong: '巽', shi: 5 },
  { name: '小畜', upper: [0,1,1], lower: [1,1,1], gong: '巽', shi: 0 }, // 初变
  { name: '家人', upper: [0,1,1], lower: [1,0,1], gong: '巽', shi: 1 }, // 初二变
  { name: '益',   upper: [0,1,1], lower: [1,0,0], gong: '巽', shi: 2 }, // 初二三变
  { name: '无妄', upper: [1,1,1], lower: [1,0,0], gong: '巽', shi: 3 }, // 四变：上卦初爻变
  { name: '噬嗑', upper: [1,0,1], lower: [1,0,0], gong: '巽', shi: 4 }, // 五变：上卦二爻变
  { name: '颐',   upper: [0,0,1], lower: [1,0,0], gong: '巽', shi: 3 }, // 游魂：四爻还原
  { name: '蛊',   upper: [0,0,1], lower: [0,1,1], gong: '巽', shi: 2 }, // 归魂：下卦还原

  // ── 离宫（火）── 离→旅→鼎→未济→蒙→涣→讼→同人
  { name: '离',   upper: [1,0,1], lower: [1,0,1], gong: '离', shi: 5 },
  { name: '旅',   upper: [1,0,1], lower: [0,0,1], gong: '离', shi: 0 },
  { name: '鼎',   upper: [1,0,1], lower: [0,1,1], gong: '离', shi: 1 },
  { name: '未济', upper: [1,0,1], lower: [0,1,0], gong: '离', shi: 2 },
  { name: '蒙',   upper: [0,0,1], lower: [0,1,0], gong: '离', shi: 3 }, // 四变
  { name: '涣',   upper: [0,1,1], lower: [0,1,0], gong: '离', shi: 4 }, // 五变
  { name: '讼',   upper: [1,1,1], lower: [0,1,0], gong: '离', shi: 3 }, // 游魂
  { name: '同人', upper: [1,1,1], lower: [1,0,1], gong: '离', shi: 2 }, // 归魂

  // ── 坤宫（土）── 坤→复→临→泰→大壮→夬→需→比
  { name: '坤',   upper: [0,0,0], lower: [0,0,0], gong: '坤', shi: 5 },
  { name: '复',   upper: [0,0,0], lower: [1,0,0], gong: '坤', shi: 0 },
  { name: '临',   upper: [0,0,0], lower: [1,1,0], gong: '坤', shi: 1 },
  { name: '泰',   upper: [0,0,0], lower: [1,1,1], gong: '坤', shi: 2 },
  { name: '大壮', upper: [1,0,0], lower: [1,1,1], gong: '坤', shi: 3 }, // 四变
  { name: '夬',   upper: [1,1,0], lower: [1,1,1], gong: '坤', shi: 4 }, // 五变
  { name: '需',   upper: [0,1,0], lower: [1,1,1], gong: '坤', shi: 3 }, // 游魂
  { name: '比',   upper: [0,1,0], lower: [0,0,0], gong: '坤', shi: 2 }, // 归魂

  // ── 兑宫（金）── 兑→困→萃→咸→蹇→谦→小过→归妹
  { name: '兑',   upper: [1,1,0], lower: [1,1,0], gong: '兑', shi: 5 },
  { name: '困',   upper: [1,1,0], lower: [0,1,0], gong: '兑', shi: 0 }, // 初变
  { name: '萃',   upper: [1,1,0], lower: [0,0,0], gong: '兑', shi: 1 }, // 初二变
  { name: '咸',   upper: [1,1,0], lower: [0,0,1], gong: '兑', shi: 2 }, // 初二三变
  { name: '蹇',   upper: [0,1,0], lower: [0,0,1], gong: '兑', shi: 3 }, // 四变
  { name: '谦',   upper: [0,0,0], lower: [0,0,1], gong: '兑', shi: 4 }, // 五变
  { name: '小过', upper: [1,0,0], lower: [0,0,1], gong: '兑', shi: 3 }, // 游魂
  { name: '归妹', upper: [1,0,0], lower: [1,1,0], gong: '兑', shi: 2 }, // 归魂
];

// ═══════════════════════════════════════════════
// 第三部分：纳甲表
// ═══════════════════════════════════════════════

/**
 * 纳甲天干：
 *   乾内甲外壬，坤内乙外癸
 *   坎纳戊，离纳己，震纳庚，巽纳辛，艮纳丙，兑纳丁
 */
const NAJIA_GAN_NEI = {
  '乾': '甲', '坤': '乙', '坎': '戊', '离': '己',
  '震': '庚', '巽': '辛', '艮': '丙', '兑': '丁',
};
const NAJIA_GAN_WAI = {
  '乾': '壬', '坤': '癸', '坎': '戊', '离': '己',
  '震': '庚', '巽': '辛', '艮': '丙', '兑': '丁',
};

/**
 * 纳甲地支表（每卦内卦/外卦各三支，从下到上）
 *
 * 乾：内[子寅辰] 外[午申戌]    （阳顺行）
 * 震：内[子寅辰] 外[午申戌]    （同乾）
 * 坎：内[寅辰午] 外[申戌子]    （阳顺行从寅起）
 * 艮：内[辰午申] 外[戌子寅]    （阳顺行从辰起）
 *
 * 坤：内[未巳卯] 外[丑亥酉]    （阴逆行）
 * 巽：内[丑亥酉] 外[未巳卯]    （阴逆行从丑起）
 * 离：内[卯丑亥] 外[酉未巳]    （阴逆行从卯起）
 * 兑：内[巳卯丑] 外[亥酉未]    （阴逆行从巳起）
 */
const NAJIA_ZHI = {
  '乾': { nei: ['子', '寅', '辰'], wai: ['午', '申', '戌'] },
  '坤': { nei: ['未', '巳', '卯'], wai: ['丑', '亥', '酉'] },
  '坎': { nei: ['寅', '辰', '午'], wai: ['申', '戌', '子'] },
  '离': { nei: ['卯', '丑', '亥'], wai: ['酉', '未', '巳'] },
  '震': { nei: ['子', '寅', '辰'], wai: ['午', '申', '戌'] },
  '巽': { nei: ['丑', '亥', '酉'], wai: ['未', '巳', '卯'] },
  '艮': { nei: ['辰', '午', '申'], wai: ['戌', '子', '寅'] },
  '兑': { nei: ['巳', '卯', '丑'], wai: ['亥', '酉', '未'] },
};

// ═══════════════════════════════════════════════
// 第四部分：核心算法
// ═══════════════════════════════════════════════

/**
 * 起卦：模拟三枚铜钱抛掷
 *
 * 古法：字=2（阴面），背=3（阳面）
 *   6 = 老阴（三字）→ 动爻，变阳
 *   7 = 少阳（两背一字）→ 静爻
 *   8 = 少阴（一字两背）→ 静爻
 *   9 = 老阳（三背）→ 动爻，变阴
 */
function castCoins(seed) {
  const coins = [];
  for (let i = 0; i < 3; i++) {
    const r = seed !== undefined
      ? ((seed * 1103515245 + 12345 + i * 7919) & 0x7fffffff) / 0x7fffffff
      : ((Date.now() * 1103515245 + 12345 + i * 7919) & 0x7fffffff) / 0x7fffffff;
    coins.push(r < 0.5 ? 2 : 3);
  }
  const total = coins[0] + coins[1] + coins[2];

  let yaoType;
  if (total === 6) yaoType = '老阴';
  else if (total === 7) yaoType = '少阳';
  else if (total === 8) yaoType = '少阴';
  else if (total === 9) yaoType = '老阳';
  else yaoType = '错误';

  return { coins, total, yaoType };
}

/**
 * 完整起卦：六次抛掷
 * @param {number[]} yjVals - 六个爻值（6/7/8/9），从初爻到上爻
 */
function castHexagram(yjVals) {
  if (!yjVals || yjVals.length !== 6) {
    throw new Error('需要6个爻值（6/7/8/9）');
  }

  // 内卦（下三爻）：初爻、二爻、三爻
  const lower = [
    yjVals[0] % 2 === 1 ? 1 : 0,
    yjVals[1] % 2 === 1 ? 1 : 0,
    yjVals[2] % 2 === 1 ? 1 : 0,
  ];
  // 外卦（上三爻）：四爻、五爻、上爻
  const upper = [
    yjVals[3] % 2 === 1 ? 1 : 0,
    yjVals[4] % 2 === 1 ? 1 : 0,
    yjVals[5] % 2 === 1 ? 1 : 0,
  ];

  // 动爻
  const moving = [];
  for (let i = 0; i < 6; i++) {
    if (yjVals[i] === 6 || yjVals[i] === 9) {
      moving.push({ pos: i, val: yjVals[i] });
    }
  }

  // 变卦
  let changedLower = null, changedUpper = null;
  if (moving.length > 0) {
    changedLower = [...lower];
    changedUpper = [...upper];
    for (const m of moving) {
      if (m.pos < 3) {
        changedLower[m.pos] = changedLower[m.pos] === 1 ? 0 : 1;
      } else {
        changedUpper[m.pos - 3] = changedUpper[m.pos - 3] === 1 ? 0 : 1;
      }
    }
  }

  const benGua = findHexagram(upper, lower);
  const bianGua = (changedLower !== null) ? findHexagram(changedUpper, changedLower) : null;

  return { yjVals, upper, lower, changedUpper, changedLower, moving, benGua, bianGua };
}

/** 查找卦象信息 */
function findHexagram(upper, lower) {
  return BAGONG.find(h =>
    h.upper[0] === upper[0] && h.upper[1] === upper[1] && h.upper[2] === upper[2] &&
    h.lower[0] === lower[0] && h.lower[1] === lower[1] && h.lower[2] === lower[2]
  ) || null;
}

/**
 * 纳甲法 — 为六爻配置天干地支
 *
 * 内卦用 NAJIA_GAN_NEI + NAJIA_ZHI.nei
 * 外卦用 NAJIA_GAN_WAI + NAJIA_ZHI.wai
 *
 * @returns {object[]} 六爻纳甲，从上爻(0)到初爻(5)
 */
function getNajia(hexagram) {
  const lowerName = trigramToName(hexagram.lower);
  const upperName = trigramToName(hexagram.upper);

  const neiGan = NAJIA_GAN_NEI[lowerName];
  const waiGan = NAJIA_GAN_WAI[upperName];
  const neiZhi = NAJIA_ZHI[lowerName].nei; // [初, 二, 三]
  const waiZhi = NAJIA_ZHI[upperName].wai; // [四, 五, 上]

  // 从初爻到上爻
  const yaos = [
    { pos: 0, gan: neiGan, zhi: neiZhi[0] }, // 初爻
    { pos: 1, gan: neiGan, zhi: neiZhi[1] }, // 二爻
    { pos: 2, gan: neiGan, zhi: neiZhi[2] }, // 三爻
    { pos: 3, gan: waiGan, zhi: waiZhi[0] }, // 四爻
    { pos: 4, gan: waiGan, zhi: waiZhi[1] }, // 五爻
    { pos: 5, gan: waiGan, zhi: waiZhi[2] }, // 上爻
  ];

  return yaos.reverse(); // 从上到下（显示顺序）
}

/**
 * 六亲排布
 *
 * 以卦宫五行为"我"：
 *   生我→父母  同我→兄弟  我生→子孙  我克→妻财  克我→官鬼
 *
 * @param {object} hexagram
 * @param {object[]} najia - getNajia 返回值
 * @returns {object[]} 带六亲信息
 */
function getLiuqin(hexagram, najia) {
  const gongName = hexagram.benGua ? hexagram.benGua.gong : trigramToName(hexagram.lower);
  const gongWX = GONG_WX[gongName];

  return najia.map(yao => {
    const yaoWX = ZHI_WX[yao.zhi];
    let liuqin;

    if (yaoWX === gongWX) {
      liuqin = '兄弟';
    } else if (WX_SHENG[yaoWX] === gongWX) {
      liuqin = '父母'; // yao生gong = 生我
    } else if (WX_SHENG[gongWX] === yaoWX) {
      liuqin = '子孙'; // gong生yao = 我生
    } else if (WX_KE[gongWX] === yaoWX) {
      liuqin = '妻财'; // gong克yao = 我克
    } else if (WX_KE[yaoWX] === gongWX) {
      liuqin = '官鬼'; // yao克gong = 克我
    } else {
      liuqin = '兄弟';
    }

    return { ...yao, liuqin, wuxing: yaoWX, gongWuxing: gongWX };
  });
}

/**
 * 六神排布 — 按日干起
 *
 * 甲乙→青龙起  丙丁→朱雀起  戊→勾陈起
 * 己→螣蛇起    庚辛→白虎起  壬癸→玄武起
 *
 * 从初爻排到上爻，依次后移
 *
 * @param {string} dayGan - 日干
 * @returns {string[]} 六神，从初爻到上爻
 */
function getLiushen(dayGan) {
  const order = ['青龙', '朱雀', '勾陈', '螣蛇', '白虎', '玄武'];
  let startIndex;
  switch (dayGan) {
    case '甲': case '乙': startIndex = 0; break;
    case '丙': case '丁': startIndex = 1; break;
    case '戊':           startIndex = 2; break;
    case '己':           startIndex = 3; break;
    case '庚': case '辛': startIndex = 4; break;
    case '壬': case '癸': startIndex = 5; break;
    default: startIndex = 0;
  }
  const result = [];
  for (let i = 0; i < 6; i++) {
    result.push(order[(startIndex + i) % 6]);
  }
  return result;
}

/**
 * 世应定位
 *
 * 世爻位置由 BAGONG 表的 shi 字段确定
 * 应爻位置 = (世爻 + 3) % 6
 *
 * @returns {{shi, ye, shiName, yeName}}
 */
function getShiYing(hexagram) {
  const gua = hexagram.benGua;
  if (!gua) return { shi: -1, ye: -1, shiName: '未知', yeName: '未知' };

  const shi = gua.shi;
  const ye = _yeFromShi(shi);
  const yaoNames = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'];

  return { shi, ye, shiName: yaoNames[shi], yeName: yaoNames[ye] };
}

/**
 * 用神选取
 *
 * 《黄金策》：「用神为断卦之钥匙，得用神则断卦如神。」
 *
 * 六亲用神对照：
 *   父母 — 父母、长辈、文书、考试、房屋、契约、车船
 *   兄弟 — 兄弟姐妹、朋友、同事、竞争者
 *   子孙 — 子女、晚辈、下属、医药、福神
 *   妻财 — 财运、妻子(男命)、奴仆、粮食、物品
 *   官鬼 — 事业、功名、丈夫(女命)、疾病、盗贼、忧患
 *
 * @param {string} topicType - 占事类型
 */
function getYongshen(topicType) {
  const map = {
    '父母':   { yongshen: '父母', description: '占父母、长辈、文书、考试、房屋、契约' },
    '考试':   { yongshen: '父母', description: '占考试、学历、证书、文书' },
    '房屋':   { yongshen: '父母', description: '占房屋、地产、安居' },
    '文书':   { yongshen: '父母', description: '占文书、合同、契约' },
    '兄弟':   { yongshen: '兄弟', description: '占兄弟、姐妹、朋友、同辈' },
    '朋友':   { yongshen: '兄弟', description: '占朋友、同事、合伙' },
    '竞争':   { yongshen: '兄弟', description: '占竞争、争夺、角逐' },
    '子孙':   { yongshen: '子孙', description: '占子女、晚辈、下属' },
    '医药':   { yongshen: '子孙', description: '占疾病治疗、医药（子孙为福神制官鬼）' },
    '出行':   { yongshen: '子孙', description: '占出行平安（子孙为福神）' },
    '财运':   { yongshen: '妻财', description: '占财运、投资、交易' },
    '求财':   { yongshen: '妻财', description: '占求财、生意、利润' },
    '婚姻男': { yongshen: '妻财', description: '男命占婚姻，以妻财为妻星' },
    '失物':   { yongshen: '妻财', description: '占失物、财物丢失' },
    '婚姻女': { yongshen: '官鬼', description: '女命占婚姻，以官鬼为夫星' },
    '事业':   { yongshen: '官鬼', description: '占事业、功名、职位' },
    '工作':   { yongshen: '官鬼', description: '占工作、求职、升迁' },
    '功名':   { yongshen: '官鬼', description: '占功名、名誉、地位' },
    '疾病':   { yongshen: '官鬼', description: '占疾病（官鬼为病，子孙为药）' },
    '官非':   { yongshen: '官鬼', description: '占官司、诉讼、官非' },
  };
  return map[topicType] || { yongshen: '官鬼', description: '默认以官鬼为用神' };
}

// ═══════════════════════════════════════════════
// 第五部分：旺衰与生克判断
// ═══════════════════════════════════════════════

/**
 * 旺衰判断（基于日支五行）
 *
 * 同我者旺，生我者相，我生者休，我克者囚，克我者死
 */
function judgeWangShuai(yongshenWX, dayWX) {
  if (yongshenWX === dayWX) {
    return { level: '旺', description: '用神与日辰比和，旺相有力' };
  }
  if (WX_SHENG[dayWX] === yongshenWX) {
    return { level: '相', description: '日辰生用神，相生得力，有贵人助' };
  }
  if (WX_SHENG[yongshenWX] === dayWX) {
    return { level: '休', description: '用神生日辰，泄气休废，费力多' };
  }
  if (WX_KE[yongshenWX] === dayWX) {
    return { level: '囚', description: '用神克日辰，囚禁受制，事难成' };
  }
  if (WX_KE[dayWX] === yongshenWX) {
    return { level: '死', description: '日辰克用神，死地无气，事不成' };
  }
  return { level: '平', description: '旺衰待定' };
}

/** 五行关系：a对b的关系 */
function judgeWXRelation(a, b) {
  if (a === b) return '比和';
  if (WX_SHENG[b] === a) return '生我'; // b生a → a被b生 → 对a来说是"生我"
  if (WX_SHENG[a] === b) return '我生'; // a生b
  if (WX_KE[a] === b) return '我克';    // a克b
  if (WX_KE[b] === a) return '克我';    // b克a → a被b克
  return '比和';
}

// ═══════════════════════════════════════════════
// 第六部分：综合分析接口
// ═══════════════════════════════════════════════

/**
 * 综合分析 — 一站式六爻分析
 *
 * @param {object} params
 * @param {number[]} params.yjVals - 六爻值 [6/7/8/9] 从初到上
 * @param {string} params.dayGan - 日干
 * @param {string} params.dayZhi - 日支
 * @param {string} params.topicType - 占事类型
 */
function analyzeLiuyao(params) {
  const { yjVals, dayGan, dayZhi, topicType } = params;

  // 1. 起卦
  const hexagram = castHexagram(yjVals);

  // 2. 纳甲
  const najia = getNajia(hexagram);

  // 3. 六亲
  const liuqin = getLiuqin(hexagram, najia);

  // 4. 六神
  const liushen = getLiushen(dayGan);

  // 5. 世应
  const shiying = getShiYing(hexagram);

  // 6. 用神
  const yongshenInfo = getYongshen(topicType || '事业');

  // 7. 组装爻象（从上爻到初爻）
  const yaos = [];
  for (let i = 5; i >= 0; i--) {
    const isYang = (yjVals[i] % 2 === 1);
    const isMoving = (yjVals[i] === 6 || yjVals[i] === 9);
    const yaoName = ['初', '二', '三', '四', '五', '上'][i];
    const q = liuqin.find(qq => qq.pos === i) || {};

    yaos.push({
      pos: i,
      name: yaoName,
      yang: isYang,
      moving: isMoving,
      yjVal: yjVals[i],
      yaoType: yjVals[i] === 6 ? '老阴' : yjVals[i] === 7 ? '少阳' : yjVals[i] === 8 ? '少阴' : '老阳',
      gan: q.gan || '',
      zhi: q.zhi || '',
      wuxing: q.wuxing || '',
      liuqin: q.liuqin || '',
      liushen: liushen[i],
      isShi: shiying.shi === i,
      isYing: shiying.ye === i,
      isYongshen: (q.liuqin || '') === yongshenInfo.yongshen,
    });
  }

  // 8. 用神爻
  const yongshenYao = yaos.find(y => y.liuqin === yongshenInfo.yongshen);

  // 9. 旺衰
  const dayWX = ZHI_WX[dayZhi] || '土';
  const yongshenWX = yongshenYao ? yongshenYao.wuxing : '土';
  const wangShuai = judgeWangShuai(yongshenWX, dayWX);

  // 10. 世应关系
  const shiYao = yaos.find(y => y.isShi);
  const yingYao = yaos.find(y => y.isYing);
  const shiYingRelation = shiYao && yingYao
    ? judgeWXRelation(shiYao.wuxing, yingYao.wuxing)
    : '未知';

  // 11. R1.6: 元神/忌神/仇神分析
  // 元神=生用神者, 忌神=克用神者, 仇神=克元神/生忌神者
  var yongshenWX2 = yongshenYao ? yongshenYao.wuxing : '土';
  // 找到生用神的五行（元神）
  var yuanWX = null;
  for (var wxk in WX_SHENG) { if (WX_SHENG[wxk] === yongshenWX2) yuanWX = wxk; }
  // 找到克用神的五行（忌神）
  var jiWX = null;
  for (var wxk2 in WX_KE) { if (WX_KE[wxk2] === yongshenWX2) jiWX = wxk2; }
  // 找到克元神的五行（仇神）
  var chouWX = null;
  if (yuanWX) {
    for (var wxk3 in WX_KE) { if (WX_KE[wxk3] === yuanWX) chouWX = wxk3; }
  }

  // 在六爻中找元神、忌神、仇神爻
  var yuanYao = yaos.find(function(y) { return y.wuxing === yuanWX; });
  var jiYao = yaos.find(function(y) { return y.wuxing === jiWX; });
  var chouYao = yaos.find(function(y) { return y.wuxing === chouWX; });

  // 旺衰判断
  function getYaoWangShuai(yaoWX, dayWX) {
    return judgeWangShuai(yaoWX, dayWX);
  }
  var yuanWangShuai = yuanYao ? getYaoWangShuai(yuanWX, dayWX) : null;
  var jiWangShuai = jiYao ? getYaoWangShuai(jiWX, dayWX) : null;
  var chouWangShuai = chouYao ? getYaoWangShuai(chouWX, dayWX) : null;

  // 元神忌神仇神分析文本
  var yuanJiChouAnalysis = {
    yuanShen: yuanYao ? {
      name: '元神',
      wuxing: yuanWX,
      yaoPos: yuanYao.name + '爻',
      liuqin: yuanYao.liuqin,
      wangShuai: yuanWangShuai,
      moving: yuanYao.moving,
      text: '元神' + yuanWX + '（生用神' + yongshenWX2 + '），在' + yuanYao.name + '爻，' +
        (yuanYao.moving ? '动爻，' : '静爻，') +
        '旺衰：' + (yuanWangShuai || '未知') + '。' +
        (yuanWangShuai === '旺' || yuanWangShuai === '相' ? '元神旺相，有力生扶用神，事有助力。' :
         yuanWangShuai === '休' || yuanWangShuai === '囚' ? '元神休囚，助力不足，需等待时机。' :
         yuanWangShuai === '死' ? '元神受制严重，无力帮扶。' : '')
    } : {
      name: '元神', wuxing: yuanWX, yaoPos: '不上卦', text: '元神' + yuanWX + '不上卦，无生扶用神之力，需寻伏神。'
    },
    jiShen: jiYao ? {
      name: '忌神',
      wuxing: jiWX,
      yaoPos: jiYao.name + '爻',
      liuqin: jiYao.liuqin,
      wangShuai: jiWangShuai,
      moving: jiYao.moving,
      text: '忌神' + jiWX + '（克用神' + yongshenWX2 + '），在' + jiYao.name + '爻，' +
        (jiYao.moving ? '动爻，' : '静爻，') +
        '旺衰：' + (jiWangShuai || '未知') + '。' +
        (jiWangShuai === '旺' || jiWangShuai === '相' ? '忌神旺相，克伐用神，事多阻碍。' :
         jiWangShuai === '休' || jiWangShuai === '囚' ? '忌神休囚，阻碍减轻，可缓图之。' :
         jiWangShuai === '死' ? '忌神受制，无力为害。' : '')
    } : {
      name: '忌神', wuxing: jiWX, yaoPos: '不上卦', text: '忌神' + jiWX + '不上卦，无克制用神之害。'
    },
    chouShen: chouYao ? {
      name: '仇神',
      wuxing: chouWX,
      yaoPos: chouYao.name + '爻',
      liuqin: chouYao.liuqin,
      wangShuai: chouWangShuai,
      moving: chouYao.moving,
      text: '仇神' + chouWX + '（克元神' + yuanWX + '/生忌神' + jiWX + '），在' + chouYao.name + '爻，' +
        (chouYao.moving ? '动爻，' : '静爻，') +
        '旺衰：' + (chouWangShuai || '未知') + '。' +
        (chouWangShuai === '旺' || chouWangShuai === '相' ? '仇神旺相，克制元神、生扶忌神，间接为害。' :
         '仇神不旺，间接为害有限。')
    } : {
      name: '仇神', wuxing: chouWX, yaoPos: '不上卦', text: '仇神' + chouWX + '不上卦，无力间接为害。'
    }
  };

  // ═══ R2.7: 月令综合旺衰 + 旬空判断 ═══
  // 1. 月令综合旺衰：月建五行对用神的旺衰影响（旺/相/休/囚/死）
  var monthZhi = params.monthZhi || '';
  var monthWX = ZHI_WX[monthZhi] || '';
  var monthWangShuai = null;
  if (monthZhi && yongshenWX) {
    var wsLevel = '', wsDesc = '';
    if (monthWX === yongshenWX) {
      wsLevel = '旺'; wsDesc = '月建与用神同类五行，旺相有力';
    } else if (WX_SHENG[monthWX] === yongshenWX) {
      wsLevel = '相'; wsDesc = '月建生用神，相生得助，有月令贵人';
    } else if (WX_SHENG[yongshenWX] === monthWX) {
      wsLevel = '休'; wsDesc = '用神生月建，泄气休废，力量减弱';
    } else if (WX_KE[yongshenWX] === monthWX) {
      wsLevel = '囚'; wsDesc = '用神克月建，囚禁受制，事难遂愿';
    } else if (WX_KE[monthWX] === yongshenWX) {
      wsLevel = '死'; wsDesc = '月建克用神，死地无气，事不可为';
    }
    // 月建与日辰合参
    var dayWsLevel = wangShuai.level || '';
    var combinedDesc = '月建' + monthZhi + '(' + monthWX + ')对用神(' + yongshenWX + ')为「' + wsLevel + '」，日辰' + dayZhi + '(' + dayWX + ')为「' + dayWsLevel + '」。「月建为六爻之提纲，日辰为六爻之主宰」——';
    if ((wsLevel === '旺' || wsLevel === '相') && (dayWsLevel === '旺' || dayWsLevel === '相')) {
      combinedDesc += '月日均生扶用神，用神旺相有力，断卦大吉。';
    } else if ((wsLevel === '旺' || wsLevel === '相') && (dayWsLevel === '死' || dayWsLevel === '囚')) {
      combinedDesc += '月令虽扶但日辰克伐，吉中有阻，需防暗变。';
    } else if ((wsLevel === '死' || wsLevel === '囚') && (dayWsLevel === '旺' || dayWsLevel === '相')) {
      combinedDesc += '月令虽克但日辰生扶，凶中有救，事可缓图。';
    } else if ((wsLevel === '死' || wsLevel === '囚') && (dayWsLevel === '死' || dayWsLevel === '囚')) {
      combinedDesc += '月日均克制用神，用神衰弱无气，断卦不吉。';
    } else {
      combinedDesc += '月日对用神力量中和，断卦中平。';
    }
    monthWangShuai = {
      monthZhi: monthZhi,
      monthWX: monthWX,
      yongshenWX: yongshenWX,
      monthLevel: wsLevel,
      monthDesc: wsDesc,
      dayLevel: dayWsLevel,
      combinedDesc: combinedDesc
    };
  }

  // 2. 旬空判断：基于日干支推算旬空地支
  var dayGanZhi = (dayGan || '') + (dayZhi || '');
  var xunKong = [];
  var xunKongDesc = '';
  // 六十甲子旬空表
  var XUN_KONG_MAP = {
    '甲子': ['戌','亥'], '甲戌': ['申','酉'], '甲申': ['午','未'],
    '甲午': ['辰','巳'], '甲辰': ['寅','卯'], '甲寅': ['子','丑']
  };
  // 找到日干支所在旬
  var ganIdx = TIAN_GAN.indexOf(dayGan);
  var zhiIdx = DI_ZHI.indexOf(dayZhi);
  if (ganIdx >= 0 && zhiIdx >= 0) {
    // 旬首：甲子/甲戌/甲申/甲午/甲辰/甲寅
    var xunStartIdx = ganIdx; // 旬首天干索引（甲=0）
    // 日干支在六十甲子中的序号
    var jiaziIdx = (ganIdx * 10 - ganIdx + zhiIdx + 60) % 60;
    // 简化：直接根据天干找旬首
    var xunGan = '甲';
    // 旬首地支 = 日支往前推到与甲配对
    var offset = ganIdx; // 日干到甲的距离
    var xunZhiIdx = (zhiIdx - offset + 12) % 12;
    var xunKey = xunGan + DI_ZHI[xunZhiIdx];
    xunKong = XUN_KONG_MAP[xunKey] || [];
    xunKongDesc = xunKong.length === 2 ? ('旬空(' + xunKey + '旬)：' + xunKong[0] + '、' + xunKong[1]) : '';
  }

  // 标注空亡爻，判断真空vs假空
  var kongWang = { xunKong: xunKong, xunKongDesc: xunKongDesc, yaos: [] };
  if (xunKong.length === 2) {
    for (var kwi = 0; kwi < yaos.length; kwi++) {
      var kyao = yaos[kwi];
      if (xunKong.indexOf(kyao.zhi) >= 0) {
        // 判断真空/假空：旺相之爻空为假空（有空不空），休囚之爻空为真空
        var kyaoWs = judgeWangShuai(kyao.wuxing, dayWX);
        var kongType = '';
        var kongDesc = '';
        if (kyaoWs.level === '旺' || kyaoWs.level === '相') {
          kongType = '假空';
          kongDesc = '旺相之爻逢空，假空——暂时落空，待出空之日即可发挥作用';
        } else if (kyaoWs.level === '休' || kyaoWs.level === '囚') {
          kongType = '休空';
          kongDesc = '休囚之爻逢空，力量更弱，需待旺月出空方有转机';
        } else if (kyaoWs.level === '死') {
          kongType = '真空';
          kongDesc = '死地之爻逢空，真空——彻底无用，事不可成';
        } else {
          kongType = '空亡';
          kongDesc = '爻逢空亡，力量受限';
        }
        kongWang.yaos.push({
          pos: kyao.pos, name: kyao.name, zhi: kyao.zhi,
          liuqin: kyao.liuqin, wuxing: kyao.wuxing,
          wangShuai: kyaoWs.level, kongType: kongType, desc: kongDesc,
          isYongshen: kyao.isYongshen
        });
      }
    }
    if (kongWang.yaos.length === 0) {
      kongWang.note = '卦中无爻落入旬空';
    }
  }

  // ═══ R2.8: 六冲六合卦 + 伏神飞神 ═══
  // 1. 六冲卦检测：八纯卦（乾坎艮震巽离坤兑）为六冲卦
  var benGuaName = hexagram.benGua ? hexagram.benGua.name : '';
  var LIUCHONG_GUA = ['乾','坎','艮','震','巽','离','坤','兑'];
  var isLiuChong = LIUCHONG_GUA.indexOf(benGuaName) >= 0;

  // 2. 六合卦检测：特定的卦象组合
  var LIUHE_GUA = ['否','泰','临','遁','大壮','观','大过','小过','颐','中孚','渐','归妹','丰','旅','贲','节','涣','井','同寅','同人而'];
  // 实际六合卦：内卦三爻与外卦三爻逐一相合
  // 地支六合：子丑合、寅亥合、卯戌合、辰酉合、巳申合、午未合
  var ZHI_HE_MAP = {'子':'丑','丑':'子','寅':'亥','亥':'寅','卯':'戌','戌':'卯','辰':'酉','酉':'辰','巳':'申','申':'巳','午':'未','未':'午'};
  var isLiuHe = false;
  if (najia && najia.length >= 6) {
    // najia 从初爻到上爻
    var n0 = najia[0].zhi, n1 = najia[1].zhi, n2 = najia[2].zhi;
    var n3 = najia[3].zhi, n4 = najia[4].zhi, n5 = najia[5].zhi;
    // 六合卦条件：初与四合、二与五合、三与上合
    if (ZHI_HE_MAP[n0] === n3 && ZHI_HE_MAP[n1] === n4 && ZHI_HE_MAP[n2] === n5) {
      isLiuHe = true;
    }
  }
  // 补充经典六合卦名检测
  if (!isLiuHe) {
    var LIUHE_NAMES = ['否','泰','临','遁','大壮','观','大过','小过','颐','中孚','渐','归妹','丰','旅','贲','节','涣','井'];
    if (LIUHE_NAMES.indexOf(benGuaName) >= 0) {
      isLiuHe = true;
    }
  }

  var chongHe = {
    isLiuChong: isLiuChong,
    isLiuHe: isLiuHe,
    benGuaName: benGuaName,
    desc: ''
  };
  if (isLiuChong) {
    chongHe.desc = '此卦为六冲卦（八纯卦），冲者散也——主事多散乱、反复、不持久。占事宜速不宜迟，占关系主分离，占求财主聚散无常。但冲中也有生机，逢合月日可解。';
  } else if (isLiuHe) {
    chongHe.desc = '此卦为六合卦，合者和也——主事多和合、迟缓、久长。占事宜缓不宜急，占关系主合好，占求财主渐进。但合久必分，逢冲月日需防变故。';
  } else {
    chongHe.desc = '此卦非六冲非六合，冲合之中平。需看各爻生克关系定吉凶。';
  }

  // 3. 伏神飞神：当用神不上卦时，从本宫首卦寻伏神
  var fuFei = null;
  if (!yongshenYao) {
    // 用神不上卦，需要寻伏神
    var gongName = hexagram.benGua ? hexagram.benGua.gong : '';
    // 找该宫首卦（六纯卦）
    var gongFirstGua = BAGONG.find(function(g) { return g.gong === gongName && g.name === gongName; });
    if (gongFirstGua) {
      // 获取首卦的纳甲
      var firstNajia = getNajia({ lower: gongFirstGua.lower, upper: gongFirstGua.upper });
      // 在首卦纳甲中找用神对应的六亲
      var gongWX = GONG_WX[gongName] || '';
      // 首卦的六亲与用神一致的那个爻
      var fuYao = null;
      for (var fni = 0; fni < firstNajia.length; fni++) {
        var fnYao = firstNajia[fni];
        var fnWX = ZHI_WX[fnYao.zhi] || '';
        var fnLiuqin = '';
        if (fnWX === gongWX) fnLiuqin = '兄弟';
        else if (WX_SHENG[gongWX] === fnWX) fnLiuqin = '父母';
        else if (WX_SHENG[fnWX] === gongWX) fnLiuqin = '子孙';
        else if (WX_KE[gongWX] === fnWX) fnLiuqin = '妻财';
        else if (WX_KE[fnWX] === gongWX) fnLiuqin = '官鬼';
        if (fnLiuqin === yongshenInfo.yongshen) {
          fuYao = { pos: fnYao.pos, gan: fnYao.gan, zhi: fnYao.zhi, wuxing: fnWX, liuqin: fnLiuqin };
          break;
        }
      }
      if (fuYao) {
        // 飞神 = 本卦中对应位置的爻
        var feiYao = yaos.find(function(y) { return y.pos === fuYao.pos; });
        var fuFeiRelation = '';
        if (feiYao) {
          var fuWX = fuYao.wuxing;
          var feiWX = feiYao.wuxing;
          if (fuWX === feiWX) fuFeiRelation = '伏神与飞神同类五行，伏神可得飞神助力';
          else if (WX_SHENG[feiWX] === fuWX) fuFeiRelation = '飞神生伏神，伏神得飞神之助，易出';
          else if (WX_SHENG[fuWX] === feiWX) fuFeiRelation = '伏神生飞神，伏神泄气于飞神，难出';
          else if (WX_KE[feiWX] === fuWX) fuFeiRelation = '飞神克伏神，伏神被压制，终不起';
          else if (WX_KE[fuWX] === feiWX) fuFeiRelation = '伏神克飞神，伏神可冲破飞神而出';
        }
        fuFei = {
          gongName: gongName,
          yongshenName: yongshenInfo.yongshen,
          fuShen: { pos: fuYao.pos, gan: fuYao.gan, zhi: fuYao.zhi, wuxing: fuYao.wuxing, liuqin: fuYao.liuqin },
          feiShen: feiYao ? { pos: feiYao.pos, gan: feiYao.gan, zhi: feiYao.zhi, wuxing: feiYao.wuxing, liuqin: feiYao.liuqin } : null,
          relation: fuFeiRelation,
          desc: '用神' + yongshenInfo.yongshen + '不上卦，从' + gongName + '宫首卦' + gongName + '卦中寻伏神。伏神在' + (['初','二','三','四','五','上'][fuYao.pos]) + '爻(' + fuYao.gan + fuYao.zhi + ')，' + (feiYao ? '飞神在' + (['初','二','三','四','五','上'][feiYao.pos]) + '爻(' + feiYao.gan + feiYao.zhi + ')。' : '') + fuFeiRelation
        };
      }
    }
  }

  // ═══ R2.9: 动爻化进化退 + 暗动爻 ═══
  // 地支顺序（阳顺阴逆）用于判断进退神方向
  var ZHI_ORDER = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  var ZHI_WX_LOCAL = {'子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火','午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水'};
  // 进退神判断：同类五行地支的前进/后退
  // 前进方向：寅→卯(木), 巳→午(火), 申→酉(金), 亥→子(水), 辰→未→戌→丑(土前进)
  // 后退方向：卯→寅, 午→巳, 酉→申, 子→亥, 丑→戌→未→辰
  var JIN_TUI_MAP = {
    '寅': {jin:'卯', tui:null}, '卯': {jin:null, tui:'寅'},
    '巳': {jin:'午', tui:null}, '午': {jin:null, tui:'巳'},
    '申': {jin:'酉', tui:null}, '酉': {jin:null, tui:'申'},
    '亥': {jin:'子', tui:null}, '子': {jin:null, tui:'亥'},
    '辰': {jin:'未', tui:null}, '未': {jin:'戌', tui:null}, '戌': {jin:'丑', tui:null}, '丑': {jin:null, tui:'戌'},
    '丑_d': {jin:null, tui:'辰'}, '戌_d': {jin:null, tui:'未'}, '未_d': {jin:null, tui:'辰'}
  };
  // 简化版进退判断函数
  function isHuaJin(origZhi, newZhi) {
    var origWX = ZHI_WX_LOCAL[origZhi] || '';
    var newWX = ZHI_WX_LOCAL[newZhi] || '';
    if (origWX !== newWX) return false; // 必须同类五行
    var origIdx = ZHI_ORDER.indexOf(origZhi);
    var newIdx = ZHI_ORDER.indexOf(newZhi);
    // 阳支前进：子→丑→寅...（顺序方向）
    // 阴支前进：逆序方向
    var origIsYang = (origIdx % 2 === 0); // 子(0)阳, 丑(1)阴...
    if (origIsYang) {
      // 阳支前进 = 顺序方向
      return (newIdx === (origIdx + 2) % 12) || (newIdx === (origIdx + 1) % 12 && newIdx % 2 === 1);
    } else {
      // 阴支前进 = 逆序方向
      return (newIdx === (origIdx - 2 + 12) % 12) || (newIdx === (origIdx - 1 + 12) % 12 && newIdx % 2 === 0);
    }
  }
  function isHuaTui(origZhi, newZhi) {
    var origWX = ZHI_WX_LOCAL[origZhi] || '';
    var newWX = ZHI_WX_LOCAL[newZhi] || '';
    if (origWX !== newWX) return false;
    return !isHuaJin(origZhi, newZhi); // 同类五行但不进则退
  }

  // 获取变卦纳甲
  var bianNajia = null;
  if (hexagram.bianGua) {
    bianNajia = getNajia(hexagram.bianGua);
  }

  var dongYaoAnalysis = { movingYaos: [], anDongYaos: [], summary: '' };

  // 1. 动爻分析
  if (hexagram.moving && hexagram.moving.length > 0 && bianNajia) {
    for (var mi = 0; mi < hexagram.moving.length; mi++) {
      var moveInfo = hexagram.moving[mi];
      var mPos = moveInfo.pos;
      var origYao = yaos.find(function(y) { return y.pos === mPos; });
      var bianYao = bianNajia.find(function(n) { return n.pos === mPos; });
      if (!origYao || !bianYao) continue;

      var origZhi = origYao.zhi;
      var bianZhi = bianYao.zhi;
      var origWX = ZHI_WX_LOCAL[origZhi] || '';
      var bianWX = ZHI_WX_LOCAL[bianZhi] || '';
      var huaType = '';
      var huaDesc = '';

      // 化进神
      if (isHuaJin(origZhi, bianZhi)) {
        huaType = '化进神';
        huaDesc = '动爻' + origZhi + '化' + bianZhi + '为化进神——其力倍增，势力渐强，占吉事则吉上加吉，占凶事则凶上加凶。';
      }
      // 化退神
      else if (isHuaTui(origZhi, bianZhi)) {
        huaType = '化退神';
        huaDesc = '动爻' + origZhi + '化' + bianZhi + '为化退神——其力减退，势力渐弱，占吉事则吉减，占凶事则凶减。';
      }
      // 化回头克
      else if (WX_KE[bianWX] === origWX) {
        huaType = '化回头克';
        huaDesc = '动爻' + origZhi + '(' + origWX + ')化' + bianZhi + '(' + bianWX + ')为化回头克——变爻五行克本爻五行，大凶之兆，凡事不遂。';
      }
      // 化空
      else if (xunKong.indexOf(bianZhi) >= 0) {
        huaType = '化空';
        huaDesc = '动爻' + origZhi + '化' + bianZhi + '为化空——变爻落入旬空，事有虚象，待出空之日方有实效。';
      }
      // 化回头生
      else if (WX_SHENG[bianWX] === origWX) {
        huaType = '化回头生';
        huaDesc = '动爻' + origZhi + '(' + origWX + ')化' + bianZhi + '(' + bianWX + ')为化回头生——变爻五行生本爻五行，吉兆，事有后福。';
      }
      // 化比和
      else if (origWX === bianWX) {
        huaType = '化比和';
        huaDesc = '动爻' + origZhi + '化' + bianZhi + '为化比和——五行相同，力量维持不变。';
      }
      // 其他
      else {
        huaType = '化' + bianZhi;
        huaDesc = '动爻' + origZhi + '(' + origWX + ')化' + bianZhi + '(' + bianWX + ')，五行变化，需视具体占事判断吉凶。';
      }

      dongYaoAnalysis.movingYaos.push({
        pos: mPos, name: origYao.name,
        origZhi: origZhi, origWX: origWX,
        bianZhi: bianZhi, bianWX: bianWX,
        liuqin: origYao.liuqin,
        huaType: huaType, desc: huaDesc,
        isYongshen: origYao.isYongshen
      });
    }
  }

  // 2. 暗动爻：日辰冲静爻为暗动
  // 地支相冲：子午冲、丑未冲、寅申冲、卯酉冲、辰戌冲、巳亥冲
  var ZHI_CHONG_MAP = {'子':'午','午':'子','丑':'未','未':'丑','寅':'申','申':'寅','卯':'酉','酉':'卯','辰':'戌','戌':'辰','巳':'亥','亥':'巳'};
  var dayChongZhi = ZHI_CHONG_MAP[dayZhi] || '';
  if (dayChongZhi) {
    for (var ai = 0; ai < yaos.length; ai++) {
      var aYao = yaos[ai];
      if (!aYao.moving && aYao.zhi === dayChongZhi) {
        // 静爻被日辰冲 → 暗动
        var aYaoWs = judgeWangShuai(aYao.wuxing, dayWX);
        var anDongDesc = '';
        if (aYaoWs.level === '旺' || aYaoWs.level === '相') {
          anDongDesc = '静爻' + aYao.name + '(' + aYao.zhi + ')被日辰' + dayZhi + '冲，旺相之爻被冲为暗动——暗中发力，有意外之变，吉凶看所占何事。';
        } else {
          anDongDesc = '静爻' + aYao.name + '(' + aYao.zhi + ')被日辰' + dayZhi + '冲，休囚之爻被冲为日破——冲之无用，事不可成。';
        }
        dongYaoAnalysis.anDongYaos.push({
          pos: aYao.pos, name: aYao.name, zhi: aYao.zhi,
          liuqin: aYao.liuqin, wuxing: aYao.wuxing,
          wangShuai: aYaoWs.level, desc: anDongDesc,
          isYongshen: aYao.isYongshen
        });
      }
    }
  }

  // 汇总
  var dongSummaryParts = [];
  if (dongYaoAnalysis.movingYaos.length > 0) {
    dongSummaryParts.push('动爻' + dongYaoAnalysis.movingYaos.length + '个');
    for (var ds = 0; ds < dongYaoAnalysis.movingYaos.length; ds++) {
      dongSummaryParts.push(dongYaoAnalysis.movingYaos[ds].huaType);
    }
  }
  if (dongYaoAnalysis.anDongYaos.length > 0) {
    dongSummaryParts.push('暗动爻' + dongYaoAnalysis.anDongYaos.length + '个');
  }
  dongYaoAnalysis.summary = dongSummaryParts.length > 0 ? dongSummaryParts.join('，') : '无动爻无暗动，卦象静态。';

  // 断卦综合判断
  var yuanJiSummary = '';
  var hasYuan = yuanYao && (yuanWangShuai === '旺' || yuanWangShuai === '相');
  var hasJiStrong = jiYao && (jiWangShuai === '旺' || jiWangShuai === '相');
  if (hasYuan && !hasJiStrong) {
    yuanJiSummary = '元神旺相有力生扶用神，忌神不旺，断卦偏吉——事可成，有贵人助力。';
  } else if (hasJiStrong && !hasYuan) {
    yuanJiSummary = '忌神旺相克伐用神，元神不上卦或休囚，断卦偏凶——事多阻碍，宜等待时机。';
  } else if (hasYuan && hasJiStrong) {
    yuanJiSummary = '元神忌神俱旺，双方角力——事有波折但可成，需付出更多努力。';
  } else if (!yuanYao && !jiYao) {
    yuanJiSummary = '元神忌神均不上卦，用神独立支撑——事靠自己，无外力干预。';
  } else {
    yuanJiSummary = '元神忌神力量相当，断卦中平——事可缓图，不宜急进。';
  }

  // ═══ R3.3: 六爻·应期判断 ═══
  // 地支相冲表
  var YQ_CHONG = {'子':'午','午':'子','丑':'未','未':'丑','寅':'申','申':'寅','卯':'酉','酉':'卯','辰':'戌','戌':'辰','巳':'亥','亥':'巳'};
  // 地支相合表（六合）
  var YQ_HE = {'子':'丑','丑':'子','寅':'亥','亥':'寅','卯':'戌','戌':'卯','辰':'酉','酉':'辰','巳':'申','申':'巳','午':'未','未':'午'};
  // 地支三合局
  var YQ_SANHE = [
    {zhi:['寅','午','戌'], ju:'火局'},
    {zhi:['申','子','辰'], ju:'水局'},
    {zhi:['亥','卯','未'], ju:'木局'},
    {zhi:['巳','酉','丑'], ju:'金局'}
  ];
  // 六冲顺序
  var YQ_ZHI_LIST = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

  var yingqi = { rules: [], summary: '', nearFar: '', detail: {} };

  if (yongshenYao) {
    var ysZhi = yongshenYao.zhi || '';
    var ysWX = yongshenYao.wuxing || '';
    var ysMoving = yongshenYao.moving || false;
    var ysWsLevel = wangShuai ? wangShuai.level : '';

    // 1. 静卦应期：以用神旺衰定应期
    // 旺则逢合、衰则逢生、动则逢合、合则逢冲
    if (!ysMoving) {
      // 用神静爻
      // 逢冲日或逢值日为应期
      var chongZhi = YQ_CHONG[ysZhi] || '';
      yingqi.rules.push({
        rule: '用神静→冲动日或逢值日',
        zhi: chongZhi + '日或' + ysZhi + '日',
        desc: '用神' + yongshenYao.name + '爻(' + ysZhi + ')为静爻，静者待冲，逢冲日(' + chongZhi + '日)或逢值日(' + ysZhi + '日)为应期。'
      });

      // 旺衰辅助
      if (ysWsLevel === '旺' || ysWsLevel === '相') {
        // 旺则逢合
        var heZhi = YQ_HE[ysZhi] || '';
        yingqi.rules.push({
          rule: '用神旺→逢合日',
          zhi: heZhi + '日',
          desc: '用神旺相(' + ysWsLevel + ')，旺则逢合，合日(' + heZhi + '日)为应期。事成且稳固。'
        });
      } else if (ysWsLevel === '休' || ysWsLevel === '囚' || ysWsLevel === '死') {
        // 衰则逢生
        var shengWX = '';
        for (var wxk4 in WX_SHENG) { if (WX_SHENG[wxk4] === ysWX) shengWX = wxk4; }
        // 找生用神五行的地支
        var shengZhi = '';
        for (var zhiK in ZHI_WX) { if (ZHI_WX[zhiK] === shengWX) { shengZhi = zhiK; break; } }
        yingqi.rules.push({
          rule: '用神衰→逢生日',
          zhi: shengZhi + '日',
          desc: '用神衰弱(' + ysWsLevel + ')，衰则逢生，生用神之日(' + shengZhi + '日,' + shengWX + '生' + ysWX + ')为应期。'
        });
      }
    } else {
      // 2. 动卦应期：以动爻定应期
      // 动而逢合为应期
      var heZhi2 = YQ_HE[ysZhi] || '';
      yingqi.rules.push({
        rule: '用神动→逢合日',
        zhi: heZhi2 + '日',
        desc: '用神' + yongshenYao.name + '爻(' + ysZhi + ')为动爻，动则逢合，合日(' + heZhi2 + '日)为应期。动而逢合则事定。'
      });
    }

    // 3. 用神旬空→出空之期为应期
    if (xunKong.indexOf(ysZhi) >= 0) {
      // 出空日 = 用神地支本身逢值日即出空
      yingqi.rules.push({
        rule: '用神旬空→出空日',
        zhi: ysZhi + '日',
        desc: '用神' + ysZhi + '逢旬空(' + xunKongDesc + ')，出空之日(' + ysZhi + '日)为应期。空则待出，出空方能应事。'
      });
    }

    // 4. 用神逢冲→合日为应期
    // 检查用神是否被日辰冲
    if (dayZhi && YQ_CHONG[dayZhi] === ysZhi) {
      var heZhi3 = YQ_HE[ysZhi] || '';
      yingqi.rules.push({
        rule: '用神逢冲→合日',
        zhi: heZhi3 + '日',
        desc: '用神' + ysZhi + '被日辰' + dayZhi + '冲，逢冲则散，合日(' + heZhi3 + '日)为应期，冲后逢合事乃成。'
      });
    }

    // 5. 用神逢合→冲日为应期
    if (dayZhi && YQ_HE[dayZhi] === ysZhi) {
      var chongZhi2 = YQ_CHONG[ysZhi] || '';
      yingqi.rules.push({
        rule: '用神逢合→冲日',
        zhi: chongZhi2 + '日',
        desc: '用神' + ysZhi + '与日辰' + dayZhi + '合，合者需冲开，冲日(' + chongZhi2 + '日)为应期。'
      });
    }

    // 6. 远近判断：用神旺则近，衰则远
    var nearFar = '';
    var timeUnit = '';
    if (ysWsLevel === '旺' || ysWsLevel === '相') {
      nearFar = '近';
      timeUnit = '日周月（数日内至一周）';
      yingqi.rules.push({
        rule: '用神旺→应期近',
        zhi: '',
        desc: '用神旺相(' + ysWsLevel + ')，应期近——约在数日至一周内应事。'
      });
    } else if (ysWsLevel === '休') {
      nearFar = '中';
      timeUnit = '周月（一至数周）';
      yingqi.rules.push({
        rule: '用神休→应期中',
        zhi: '',
        desc: '用神休气(' + ysWsLevel + ')，应期中等——约在一至数周内应事。'
      });
    } else if (ysWsLevel === '囚' || ysWsLevel === '死') {
      nearFar = '远';
      timeUnit = '月年（数月至年余）';
      yingqi.rules.push({
        rule: '用神衰→应期远',
        zhi: '',
        desc: '用神衰弱(' + ysWsLevel + ')，应期远——约在数月至年余应事，需耐心等待。'
      });
    }
    yingqi.nearFar = nearFar;
    yingqi.timeUnit = timeUnit;

    // 汇总
    var yqSumParts = [];
    for (var yqi = 0; yqi < yingqi.rules.length; yqi++) {
      yqSumParts.push(yingqi.rules[yqi].desc);
    }
    yingqi.summary = yqSumParts.length > 0 ? yqSumParts.join(' ') : '无法判断应期，需更多信息。';

    yingqi.detail = {
      yongshenZhi: ysZhi,
      yongshenWX: ysWX,
      yongshenMoving: ysMoving,
      yongshenWangShuai: ysWsLevel,
      dayZhi: dayZhi,
      xunKong: xunKong
    };
  } else {
    // 用神不上卦
    yingqi.summary = '用神不上卦，无以直接断应期。需寻伏神，待伏神出露之日为应期。';
    if (fuFei && fuFei.fuShen) {
      yingqi.rules.push({
        rule: '伏神出露日',
        zhi: fuFei.fuShen.zhi + '日',
        desc: '用神不上卦，伏神在' + fuFei.fuShen.zhi + '，待伏神出露之日(' + fuFei.fuShen.zhi + '日)为应期。'
      });
      yingqi.detail = { fuShenZhi: fuFei.fuShen.zhi };
    }
  }

  return {
    hexagram, najia, liuqin, liushen, shiying, yongshenInfo,
    yaos, yongshenYao, wangShuai, shiYingRelation,
    benGuaName: hexagram.benGua ? hexagram.benGua.name : '未知',
    bianGuaName: hexagram.bianGua ? hexagram.bianGua.name : null,
    gongName: hexagram.benGua ? hexagram.benGua.gong : '未知',
    movingCount: hexagram.moving.length,
    // R1.6: 元神忌神仇神
    yuanJiChou: yuanJiChouAnalysis,
    yuanJiSummary: yuanJiSummary,
    yuanShenWX: yuanWX,
    jiShenWX: jiWX,
    chouShenWX: chouWX,
    // R2.7: 月令旺衰 + 旬空
    monthWangShuai: monthWangShuai,
    kongWang: kongWang,
    // R2.8: 六冲六合 + 伏神飞神
    chongHe: chongHe,
    fuFei: fuFei,
    // R2.9: 动爻化进化退 + 暗动爻
    dongYaoAnalysis: dongYaoAnalysis,
    // R3.3: 应期判断
    yingqi: yingqi
  };
}

// ═══════════════════════════════════════════════
// 导出
// ═══════════════════════════════════════════════

if (typeof module !== 'undefined' && module.exports) {

window.LiuyaoV3 = {
    TIAN_GAN, DI_ZHI, ZHI_WX, GAN_WX, WX_SHENG, WX_KE,
    LIUQIN_NAMES, LIUSHEN_NAMES, GONG_WX, BAGONG,
    NAJIA_GAN_NEI, NAJIA_GAN_WAI, NAJIA_ZHI,
    castCoins, castHexagram, findHexagram,
    getNajia, getLiuqin, getLiushen, getShiYing, getYongshen,
    analyzeLiuyao, judgeWangShuai, judgeWXRelation, trigramToName,
  };
};

})();

// ════════════════════════════════════════════════════════════════
//  引擎 4/5: MeihuaV3
// ════════════════════════════════════════════════════════════════

(function() {
'use strict';

/**
 * meihua-v3.js — 梅花易数排盘引擎 V3
 * 基于《梅花易数》（宋·邵雍）、《皇极经世》、《易传·系辞》
 *
 * 修复要点：
 *   1. 先天八卦三爻线位修正（自下而上：初爻→中爻→上爻）
 *   2. 64卦查表修正（先天数 → King Wen 序号映射）
 *   3. 新增时间起卦法
 *   4. 体用分析补全：互卦对体、变卦对体的生克链
 *   5. 时令旺衰独立函数 getSeasonWangshuai()
 *   6. 完整断卦 computeMeihuaFull()
 */


// ═══════════════════════════════════════════════
//  常量表
// ═══════════════════════════════════════════════

const XIAN_TIAN = ['乾','兑','离','震','巽','坎','艮','坤'];

const TRIGRAM_LINES = {
  '乾': [1,1,1], '兑': [1,1,0], '离': [1,0,1], '震': [0,0,1],
  '巽': [0,1,1], '坎': [0,1,0], '艮': [1,0,0], '坤': [0,0,0],
};

const TRIGRAM_ELEMENT = {
  '乾':'金','兑':'金','离':'火','震':'木',
  '巽':'木','坎':'水','艮':'土','坤':'土',
};

const TRIGRAM_SYMBOL = {
  '乾':'☰','兑':'☱','离':'☲','震':'☳',
  '巽':'☴','坎':'☵','艮':'☶','坤':'☷',
};

const XIANTIAN_LINES = {
  1: [1,1,1], 2: [1,1,0], 3: [1,0,1], 4: [0,0,1],
  5: [0,1,1], 6: [0,1,0], 7: [1,0,0], 8: [0,0,0],
};

const XIANTIAN_NAME = {
  1:'乾', 2:'兑', 3:'离', 4:'震',
  5:'巽', 6:'坎', 7:'艮', 8:'坤',
};

// 64卦 King Wen 查表：KING_WEN[上卦先天数-1][下卦先天数-1] = 卦序(1-64)
const KING_WEN = [
  [ 1, 10, 13, 25, 44,  6, 33, 12], // 上卦=乾(1)
  [43, 58, 49, 17, 28, 47, 31, 45], // 上卦=兑(2)
  [14, 38, 30, 21, 50, 64, 56, 35], // 上卦=离(3)
  [34, 54, 55, 51, 32, 40, 62, 16], // 上卦=震(4)
  [ 9, 61, 37, 42, 57, 59, 53, 20], // 上卦=巽(5)
  [ 5, 60, 63,  3, 48, 29, 39,  8], // 上卦=坎(6)
  [26, 41, 22, 27, 18,  4, 52, 23], // 上卦=艮(7)
  [11, 19, 36, 24, 46,  7, 15,  2], // 上卦=坤(8)
];

const HEXAGRAM_INFO = {
  1:{name:'乾',symbol:'䷀',judgment:'元亨利贞'},2:{name:'坤',symbol:'䷁',judgment:'元亨，利牝马之贞'},
  3:{name:'屯',symbol:'䷂',judgment:'元亨利贞，勿用有攸往'},4:{name:'蒙',symbol:'䷃',judgment:'亨，匪我求童蒙'},
  5:{name:'需',symbol:'䷄',judgment:'有孚，光亨，贞吉'},6:{name:'讼',symbol:'䷅',judgment:'有孚窒惕，中吉终凶'},
  7:{name:'师',symbol:'䷆',judgment:'贞，丈人吉无咎'},8:{name:'比',symbol:'䷇',judgment:'吉，原筮元永贞'},
  9:{name:'小畜',symbol:'䷈',judgment:'亨，密云不雨'},10:{name:'履',symbol:'䷉',judgment:'履虎尾，不咥人，亨'},
  11:{name:'泰',symbol:'䷊',judgment:'小往大来，吉亨'},12:{name:'否',symbol:'䷋',judgment:'否之匪人，不利君子贞'},
  13:{name:'同人',symbol:'䷌',judgment:'同人于野，亨'},14:{name:'大有',symbol:'䷍',judgment:'元亨'},
  15:{name:'谦',symbol:'䷎',judgment:'亨，君子有终'},16:{name:'豫',symbol:'䷏',judgment:'利建侯行师'},
  17:{name:'随',symbol:'䷐',judgment:'元亨利贞'},18:{name:'蛊',symbol:'䷑',judgment:'元亨，利涉大川'},
  19:{name:'临',symbol:'䷒',judgment:'元亨利贞，至于八月有凶'},20:{name:'观',symbol:'䷓',judgment:'盥而不荐，有孚颙若'},
  21:{name:'噬嗑',symbol:'䷔',judgment:'亨，利用狱'},22:{name:'贲',symbol:'䷕',judgment:'亨，小利有攸往'},
  23:{name:'剥',symbol:'䷖',judgment:'不利有攸往'},24:{name:'复',symbol:'䷗',judgment:'亨，出入无疾'},
  25:{name:'无妄',symbol:'䷘',judgment:'元亨利贞'},26:{name:'大畜',symbol:'䷙',judgment:'利贞，不家食吉'},
  27:{name:'颐',symbol:'䷚',judgment:'贞吉，观颐'},28:{name:'大过',symbol:'䷛',judgment:'栋桡，利有攸往'},
  29:{name:'坎',symbol:'䷜',judgment:'习坎，有孚维心亨'},30:{name:'离',symbol:'䷝',judgment:'利贞，亨'},
  31:{name:'咸',symbol:'䷞',judgment:'亨，利贞，取女吉'},32:{name:'恒',symbol:'䷟',judgment:'亨，无咎，利贞'},
  33:{name:'遁',symbol:'䷠',judgment:'亨，小利贞'},34:{name:'大壮',symbol:'䷡',judgment:'利贞'},
  35:{name:'晋',symbol:'䷢',judgment:'康侯用锡马蕃庶'},36:{name:'明夷',symbol:'䷣',judgment:'利艰贞'},
  37:{name:'家人',symbol:'䷤',judgment:'利女贞'},38:{name:'睽',symbol:'䷥',judgment:'小事吉'},
  39:{name:'蹇',symbol:'䷦',judgment:'利西南，不利东北'},40:{name:'解',symbol:'䷧',judgment:'利西南，无所往'},
  41:{name:'损',symbol:'䷨',judgment:'有孚，元吉无咎'},42:{name:'益',symbol:'䷩',judgment:'利有攸往，利涉大川'},
  43:{name:'夬',symbol:'䷪',judgment:'扬于王庭，孚号有厉'},44:{name:'姤',symbol:'䷫',judgment:'女壮，勿用取女'},
  45:{name:'萃',symbol:'䷬',judgment:'亨，王假有庙'},46:{name:'升',symbol:'䷭',judgment:'元亨，用见大人勿恤'},
  47:{name:'困',symbol:'䷮',judgment:'亨，贞大人吉无咎'},48:{name:'井',symbol:'䷯',judgment:'改邑不改井'},
  49:{name:'革',symbol:'䷰',judgment:'己日乃孚，元亨利贞'},50:{name:'鼎',symbol:'䷱',judgment:'元吉，亨'},
  51:{name:'震',symbol:'䷲',judgment:'亨，震来虩虩'},52:{name:'艮',symbol:'䷳',judgment:'艮其背，不获其身'},
  53:{name:'渐',symbol:'䷴',judgment:'女归吉，利贞'},54:{name:'归妹',symbol:'䷵',judgment:'征凶，无攸利'},
  55:{name:'丰',symbol:'䷶',judgment:'亨，王假之'},56:{name:'旅',symbol:'䷷',judgment:'小亨，旅贞吉'},
  57:{name:'巽',symbol:'䷸',judgment:'小亨，利有攸往'},58:{name:'兑',symbol:'䷹',judgment:'亨，利贞'},
  59:{name:'涣',symbol:'䷺',judgment:'亨，王假有庙'},60:{name:'节',symbol:'䷻',judgment:'亨，苦节不可贞'},
  61:{name:'中孚',symbol:'䷼',judgment:'豚鱼吉，利涉大川'},62:{name:'小过',symbol:'䷽',judgment:'亨，利贞'},
  63:{name:'既济',symbol:'䷾',judgment:'亨小，利贞'},64:{name:'未济',symbol:'䷿',judgment:'亨，小狐汔济'},
};

const ZHI = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const ZHI_NUM = {'子':1,'丑':2,'寅':3,'卯':4,'辰':5,'巳':6,'午':7,'未':8,'申':9,'酉':10,'戌':11,'亥':12};

const WUXING_SHENG = {'金':'水','水':'木','木':'火','火':'土','土':'金'};
const WUXING_KE    = {'金':'木','木':'土','土':'水','水':'火','火':'金'};

const YUE_JIAN_WANG_XIU = {
  '寅':{旺:'木',相:'火',休:'水',囚:'金',死:'土'},'卯':{旺:'木',相:'火',休:'水',囚:'金',死:'土'},
  '辰':{旺:'土',相:'金',休:'火',囚:'木',死:'水'},'巳':{旺:'火',相:'土',休:'木',囚:'水',死:'金'},
  '午':{旺:'火',相:'土',休:'木',囚:'水',死:'金'},'未':{旺:'土',相:'金',休:'火',囚:'木',死:'水'},
  '申':{旺:'金',相:'水',休:'土',囚:'火',死:'木'},'酉':{旺:'金',相:'水',休:'土',囚:'火',死:'木'},
  '戌':{旺:'土',相:'金',休:'火',囚:'木',死:'水'},'亥':{旺:'水',相:'木',休:'金',囚:'土',死:'火'},
  '子':{旺:'水',相:'木',休:'金',囚:'土',死:'火'},'丑':{旺:'土',相:'金',休:'火',囚:'木',死:'水'},
};

const WANGXIU_DESC = {
  '旺':'得令当权，能量最盛','相':'次旺之态，受生扶而生机勃勃',
  '休':'退气休歇，能量不足','囚':'被制受囚，力量被困','死':'至极衰弱，无气无力',
};

const SEASON_MAP = {
  '春': {months:['寅','卯','辰'], wang:'木'},
  '夏': {months:['巳','午','未'], wang:'火'},
  '秋': {months:['申','酉','戌'], wang:'金'},
  '冬': {months:['亥','子','丑'], wang:'水'},
};

const GUA_XIANG = {
  '乾':{nature:'天、刚健',direction:'西北',color:'金/白',season:'秋冬',element:'金',body:'头、肺',animal:'马'},
  '兑':{nature:'泽、喜悦',direction:'西',color:'白/银',season:'秋',element:'金',body:'口、舌',animal:'羊'},
  '离':{nature:'火、光明',direction:'南',color:'红/紫',season:'夏',element:'火',body:'眼、心',animal:'雉'},
  '震':{nature:'雷、动',direction:'东',color:'青/绿',season:'春',element:'木',body:'足、肝',animal:'龙'},
  '巽':{nature:'风、入',direction:'东南',color:'青/绿',season:'春夏',element:'木',body:'股、胆',animal:'鸡'},
  '坎':{nature:'水、陷',direction:'北',color:'黑/蓝',season:'冬',element:'水',body:'耳、肾',animal:'猪'},
  '艮':{nature:'山、止',direction:'东北',color:'黄/棕',season:'冬春',element:'土',body:'手、背',animal:'狗'},
  '坤':{nature:'地、顺',direction:'西南',color:'黄/黑',season:'夏秋',element:'土',body:'腹、脾',animal:'牛'},
};


// ═══════════════════════════════════════════════
//  工具函数
// ═══════════════════════════════════════════════

function getTrigramLines(xiantianNum) {
  return XIANTIAN_LINES[xiantianNum].slice();
}

function linesToXiantian(lines) {
  for (var i = 1; i <= 8; i++) {
    var ref = XIANTIAN_LINES[i];
    if (ref[0] === lines[0] && ref[1] === lines[1] && ref[2] === lines[2]) return i;
  }
  return 8;
}

function getKingWenNum(upperXiantian, lowerXiantian) {
  return KING_WEN[upperXiantian - 1][lowerXiantian - 1];
}

function getHexagramInfo(kingWenNum) {
  return HEXAGRAM_INFO[kingWenNum] || {name:'未知', symbol:'❓', judgment:''};
}

function getShengKeCode(tiEle, yongEle) {
  if (tiEle === yongEle) return 'bihe';
  if (WUXING_SHENG[tiEle] === yongEle) return 'tishengyong';
  if (WUXING_SHENG[yongEle] === tiEle) return 'yongshengti';
  if (WUXING_KE[tiEle] === yongEle) return 'tikeyong';
  if (WUXING_KE[yongEle] === tiEle) return 'yongketi';
  return 'bihe';
}

function shengKeText(code) {
  var map = {
    'yongshengti':'用生体','tishengyong':'体生用','bihe':'体用比和',
    'tikeyong':'体克用','yongketi':'用克体',
  };
  return map[code] || '比和';
}

function getWangshuaiByMonth(element, monthBranch) {
  var table = YUE_JIAN_WANG_XIU[monthBranch];
  if (!table) return '休';
  for (var state in table) { if (table[state] === element) return state; }
  return '休';
}

function monthToSeason(monthBranch) {
  for (var season in SEASON_MAP) {
    if (SEASON_MAP[season].months.indexOf(monthBranch) >= 0) return season;
  }
  return '冬';
}


// ═══════════════════════════════════════════════
//  起卦法
// ═══════════════════════════════════════════════

/**
 * 数字起卦法
 * 上卦 = n1 % 8（0按8算），下卦 = n2 % 8（0按8算）
 * 动爻 = (n1+n2+n3) % 6（0按6算）
 */
function computeMeihuaNumber(n1, n2, n3) {
  n1 = Math.abs(Math.floor(n1)) || 1;
  n2 = Math.abs(Math.floor(n2)) || 1;
  var upper = n1 % 8; if (upper === 0) upper = 8;
  var lower = n2 % 8; if (lower === 0) lower = 8;
  var sumForYao;
  if (n3 !== undefined && n3 !== null) {
    n3 = Math.abs(Math.floor(n3)) || 0;
    sumForYao = n1 + n2 + n3;
  } else {
    sumForYao = n1 + n2;
  }
  var movingYao = sumForYao % 6; if (movingYao === 0) movingYao = 6;
  return { upper: upper, lower: lower, movingYao: movingYao, method: 'number',
    numbers: n3 !== undefined ? [n1, n2, n3] : [n1, n2] };
}

/**
 * 时间起卦法
 * 上卦 = (年支数+月+日) % 8
 * 下卦 = (年支数+月+日+时数) % 8
 * 动爻 = (年支数+月+日+时数) % 6
 */
function computeMeihuaTime(yearZhi, month, day, hourZhi) {
  var yearNum = ZHI_NUM[yearZhi] || 1;
  var hourNum = ZHI_NUM[hourZhi] || 1;
  var upperSum = yearNum + month + day;
  var lowerSum = upperSum + hourNum;
  var upper = upperSum % 8; if (upper === 0) upper = 8;
  var lower = lowerSum % 8; if (lower === 0) lower = 8;
  var movingYao = lowerSum % 6; if (movingYao === 0) movingYao = 6;
  return { upper: upper, lower: lower, movingYao: movingYao, method: 'time',
    timeInfo: { yearZhi: yearZhi, month: month, day: day, hourZhi: hourZhi } };
}


// ═══════════════════════════════════════════════
//  卦象生成
// ═══════════════════════════════════════════════

function buildBenGua(upperXiantian, lowerXiantian, movingYao) {
  var upperName = XIANTIAN_NAME[upperXiantian];
  var lowerName = XIANTIAN_NAME[lowerXiantian];
  var upperLines = getTrigramLines(upperXiantian);
  var lowerLines = getTrigramLines(lowerXiantian);
  var lines = lowerLines.concat(upperLines); // [爻1..爻6]
  var kingWen = getKingWenNum(upperXiantian, lowerXiantian);
  var info = getHexagramInfo(kingWen);
  return {
    upperName: upperName, lowerName: lowerName,
    upperXiantian: upperXiantian, lowerXiantian: lowerXiantian,
    upperSymbol: TRIGRAM_SYMBOL[upperName], lowerSymbol: TRIGRAM_SYMBOL[lowerName],
    upperElement: TRIGRAM_ELEMENT[upperName], lowerElement: TRIGRAM_ELEMENT[lowerName],
    upperLines: upperLines, lowerLines: lowerLines, lines: lines,
    kingWen: kingWen, name: info.name, symbol: info.symbol, judgment: info.judgment,
    movingYao: movingYao,
  };
}

/**
 * 互卦：二三四爻为下互，三四五爻为上互
 * 六爻编号：1(初) 2 3 4 5 6(上)
 */
function computeHugua(benGuaLines, movingYao) {
  var lowerHu = [benGuaLines[1], benGuaLines[2], benGuaLines[3]];
  var upperHu = [benGuaLines[2], benGuaLines[3], benGuaLines[4]];
  var lowerXiantian = linesToXiantian(lowerHu);
  var upperXiantian = linesToXiantian(upperHu);
  var kingWen = getKingWenNum(upperXiantian, lowerXiantian);
  var info = getHexagramInfo(kingWen);
  return {
    upperName: XIANTIAN_NAME[upperXiantian], lowerName: XIANTIAN_NAME[lowerXiantian],
    upperXiantian: upperXiantian, lowerXiantian: lowerXiantian,
    upperSymbol: TRIGRAM_SYMBOL[XIANTIAN_NAME[upperXiantian]],
    lowerSymbol: TRIGRAM_SYMBOL[XIANTIAN_NAME[lowerXiantian]],
    upperElement: TRIGRAM_ELEMENT[XIANTIAN_NAME[upperXiantian]],
    lowerElement: TRIGRAM_ELEMENT[XIANTIAN_NAME[lowerXiantian]],
    upperLines: upperHu, lowerLines: lowerHu,
    kingWen: kingWen, name: info.name, symbol: info.symbol, judgment: info.judgment,
  };
}

/**
 * 变卦：动爻阴阳互变
 */
function computeBianggua(benGuaLines, movingYao) {
  var changedLines = benGuaLines.slice();
  var idx = movingYao - 1;
  changedLines[idx] = changedLines[idx] === 1 ? 0 : 1;
  var lowerLines = changedLines.slice(0, 3);
  var upperLines = changedLines.slice(3, 6);
  var lowerXiantian = linesToXiantian(lowerLines);
  var upperXiantian = linesToXiantian(upperLines);
  var kingWen = getKingWenNum(upperXiantian, lowerXiantian);
  var info = getHexagramInfo(kingWen);
  return {
    upperName: XIANTIAN_NAME[upperXiantian], lowerName: XIANTIAN_NAME[lowerXiantian],
    upperXiantian: upperXiantian, lowerXiantian: lowerXiantian,
    upperSymbol: TRIGRAM_SYMBOL[XIANTIAN_NAME[upperXiantian]],
    lowerSymbol: TRIGRAM_SYMBOL[XIANTIAN_NAME[lowerXiantian]],
    upperElement: TRIGRAM_ELEMENT[XIANTIAN_NAME[upperXiantian]],
    lowerElement: TRIGRAM_ELEMENT[XIANTIAN_NAME[lowerXiantian]],
    upperLines: upperLines, lowerLines: lowerLines, lines: changedLines,
    kingWen: kingWen, name: info.name, symbol: info.symbol, judgment: info.judgment,
    changedYao: movingYao,
  };
}


// ═══════════════════════════════════════════════
//  时令旺衰
// ═══════════════════════════════════════════════

/**
 * 根据季节取旺衰
 * @param {string} trigramName 卦名
 * @param {string} season '春|夏|秋|冬'
 * @returns {object} {state, element, desc}
 */
function getSeasonWangshuai(trigramName, season) {
  var ele = TRIGRAM_ELEMENT[trigramName];
  var wangEle = SEASON_MAP[season].wang;
  var state, desc;
  if (ele === wangEle) {
    state = '旺';
    desc = trigramName + '卦五行属' + ele + '，' + season + '季' + ele + '旺，当令得权，能量最盛。';
  } else if (WUXING_SHENG[wangEle] === ele) {
    state = '相';
    desc = trigramName + '卦五行属' + ele + '，' + season + '季' + wangEle + '旺生' + ele + '，' + ele + '相，受生扶而生机勃勃。';
  } else if (WUXING_SHENG[ele] === wangEle) {
    state = '休';
    desc = trigramName + '卦五行属' + ele + '，' + season + '季' + ele + '生' + wangEle + '（泄气），退气休歇。';
  } else if (WUXING_KE[ele] === wangEle) {
    // 克令之行为囚：ele克wangEle，但旺气正盛，反克无力
    state = '囚';
    desc = trigramName + '卦五行属' + ele + '，' + season + '季' + wangEle + '旺，' + ele + '克' + wangEle + '（反克无力），被制受困。';
  } else if (WUXING_KE[wangEle] === ele) {
    // 被令克之行为死：wangEle克ele，旺气所克，至极衰弱
    state = '死';
    desc = trigramName + '卦五行属' + ele + '，' + season + '季' + wangEle + '旺克' + ele + '，至极衰弱。';
  } else {
    state = '休'; desc = '状态待定。';
  }
  return { state: state, element: ele, desc: desc };
}


// ═══════════════════════════════════════════════
//  体用分析
// ═══════════════════════════════════════════════

/**
 * 体用分析（核心断卦引擎）
 *
 * 断卦四步法（《梅花易数·体用篇》）：
 *   a. 本卦体用关系
 *   b. 互卦对体的影响（过程）
 *   c. 变卦对体的影响（结局）
 *   d. 时令旺衰
 *   e. 综合判断
 */
function analyzeTiYong(benGua, movingYao, huGua, bianGua, season) {
  // 1. 定体用
  var tiInLower = movingYao <= 3; // 动爻在下卦 → 上卦为体
  var tiName, yongName, tiEle, yongEle, tiPosition, yongPosition;

  if (tiInLower) {
    tiName = benGua.upperName; yongName = benGua.lowerName;
    tiEle = benGua.upperElement; yongEle = benGua.lowerElement;
    tiPosition = '上卦'; yongPosition = '下卦';
  } else {
    tiName = benGua.lowerName; yongName = benGua.upperName;
    tiEle = benGua.lowerElement; yongEle = benGua.upperElement;
    tiPosition = '下卦'; yongPosition = '上卦';
  }

  // 2. 本卦体用关系
  var benGuaCode = getShengKeCode(tiEle, yongEle);

  // 3. 互卦对体的影响
  var huUpperCode = getShengKeCode(tiEle, huGua.upperElement);
  var huLowerCode = getShengKeCode(tiEle, huGua.lowerElement);

  // 4. 变卦对体的影响
  // 变卦中体卦不变，用卦变为新的卦
  var bianYongName, bianYongEle;
  if (tiInLower) {
    bianYongName = bianGua.lowerName; bianYongEle = bianGua.lowerElement;
  } else {
    bianYongName = bianGua.upperName; bianYongEle = bianGua.upperElement;
  }
  var bianGuaCode = getShengKeCode(tiEle, bianYongEle);

  // 5. 时令旺衰
  var tiWangshuai = null;
  var yongWangshuai = null;
  if (season) {
    tiWangshuai = getSeasonWangshuai(tiName, season);
    yongWangshuai = getSeasonWangshuai(yongName, season);
  }

  // 6. 综合判断
  var score = 60;
  var relBonus = {'yongshengti':25, 'bihe':20, 'tikeyong':15, 'tishengyong':10, 'yongketi':0};
  score += relBonus[benGuaCode] || 10;

  // 变卦加分/减分
  var bianBonus = {'yongshengti':10, 'bihe':8, 'tikeyong':5, 'tishengyong':3, 'yongketi':-10};
  score += bianBonus[bianGuaCode] || 5;

  // 旺衰加分
  if (tiWangshuai) {
    var stateBonus = {'旺':15, '相':10, '休':0, '囚':-5, '死':-10};
    score += stateBonus[tiWangshuai.state] || 0;
  }

  // 动爻位置加分
  if (movingYao === 2 || movingYao === 4 || movingYao === 5) score += 5;
  if (movingYao === 6) score -= 3;

  score = Math.max(10, Math.min(95, score));
  var level = score >= 80 ? '大吉' : score >= 65 ? '吉' : score >= 50 ? '平' : score >= 35 ? '小凶' : '凶';

  // 吉凶判断文本
  var benGuaJx = _relJudgment(benGuaCode);
  var huGuaJx  = _relJudgment(huUpperCode);
  var bianGuaJx = _relJudgment(bianGuaCode);

  // ═══ R3.1: 体用生克细化 — tiYongDetail ═══
  var tiYongDetail = _buildTiYongDetail(tiEle, yongEle, benGuaCode, huGua, bianGua, bianYongEle, bianGuaCode, tiName, yongName, tiWangshuai, yongWangshuai, season);

  return {
    ti: { name: tiName, element: tiEle, position: tiPosition, wangshuai: tiWangshuai },
    yong: { name: yongName, element: yongEle, position: yongPosition, wangshuai: yongWangshuai },
    benGuaRelation: { code: benGuaCode, text: shengKeText(benGuaCode), judgment: benGuaJx },
    huGuaRelation: {
      upper: { code: huUpperCode, text: shengKeText(huUpperCode), judgment: _relJudgment(huUpperCode) },
      lower: { code: huLowerCode, text: shengKeText(huLowerCode), judgment: _relJudgment(huLowerCode) },
    },
    bianGuaRelation: { code: bianGuaCode, text: shengKeText(bianGuaCode), judgment: bianGuaJx, bianYongName: bianYongName },
    score: score,
    level: level,
    season: season || null,
    tiYongDetail: tiYongDetail,
  };
}

/**
 * R3.1: 体用生克细化详情构建
 */
function _buildTiYongDetail(tiEle, yongEle, benGuaCode, huGua, bianYongEle, bianGuaCode, tiName, yongName, tiWs, yongWs, season) {
  // 1. 本卦体用五行生克详细分析
  var relTexts = {
    'yongshengti': {
      title: '用生体（大吉）',
      desc: '用卦五行（' + yongEle + '）生体卦五行（' + tiEle + '），事物发展顺利，有外力帮助。'+
            '所求之事多有贵人扶持，事半功倍，顺水推舟而成。',
      advice: '宜把握时机，积极行动，顺势而为。',
      luck: '大吉'
    },
    'tishengyong': {
      title: '体生用（小凶）',
      desc: '体卦五行（' + tiEle + '）生用卦五行（' + yongEle + '），精力外耗，付出多于收获。'+
            '所求之事需投入大量精力，事倍功半，劳心劳力。',
      advice: '宜量力而行，不可过度付出，留有余地。',
      luck: '小凶'
    },
    'tikeyong': {
      title: '体克用（小吉）',
      desc: '体卦五行（' + tiEle + '）克用卦五行（' + yongEle + '），经过努力可成，需主动出击。'+
            '所求之事在掌握之中，但需付出辛劳，以力胜之。',
      advice: '宜主动出击，坚持不懈，以实力取胜。',
      luck: '小吉'
    },
    'yongketi': {
      title: '用克体（大凶）',
      desc: '用卦五行（' + yongEle + '）克体卦五行（' + tiEle + '），阻碍重重，事难成就。'+
            '所求之事外力压制，举步维艰，强求则招祸。',
      advice: '宜暂避锋芒，待时转运，不可强行。',
      luck: '大凶'
    },
    'bihe': {
      title: '体用比和（中吉）',
      desc: '体卦用卦五行同为' + tiEle + '，顺其自然，平稳发展。'+
            '所求之事无大碍亦无大助，和顺平稳，水到渠成。',
      advice: '宜保持现状，稳扎稳打，不可冒进。',
      luck: '中吉'
    }
  };
  var benGuaDetail = relTexts[benGuaCode] || relTexts['bihe'];

  // 2. 互卦对体用的影响
  var huUpperCode2 = getShengKeCode(tiEle, huGua.upperElement);
  var huLowerCode2 = getShengKeCode(tiEle, huGua.lowerElement);
  var huImpact = {
    upperElement: huGua.upperElement,
    upperRelation: shengKeText(huUpperCode2),
    upperEffect: _huGuaEffectText(huUpperCode2, huGua.upperElement, tiEle),
    lowerElement: huGua.lowerElement,
    lowerRelation: shengKeText(huLowerCode2),
    lowerEffect: _huGuaEffectText(huLowerCode2, huGua.lowerElement, tiEle),
    summary: ''
  };
  var huHelpful = (huUpperCode2 === 'yongshengti' || huUpperCode2 === 'bihe') ? 1 : 0;
  huHelpful += (huLowerCode2 === 'yongshengti' || huLowerCode2 === 'bihe') ? 1 : 0;
  if (huHelpful === 2) {
    huImpact.summary = '互卦上下皆生扶体卦，过程顺利，内在因素有利。';
  } else if (huHelpful === 1) {
    huImpact.summary = '互卦一正一偏，过程有波折但总体可控。';
  } else {
    huImpact.summary = '互卦上下皆不生体，过程艰难，内在因素不利。';
  }

  // 3. 变卦后的体用关系变化趋势
  var bianDetail = relTexts[bianGuaCode] || relTexts['bihe'];
  var trendDesc = '';
  var luckOrder = {'大吉':5, '中吉':4, '小吉':3, '小凶':2, '大凶':1};
  var benLuck = luckOrder[benGuaDetail.luck] || 3;
  var bianLuck = luckOrder[bianDetail.luck] || 3;
  if (bianLuck > benLuck) {
    trendDesc = '变卦后体用关系转好，由「' + benGuaDetail.title + '」转为「' + bianDetail.title + '」，事情向好的方向发展，先苦后甜。';
  } else if (bianLuck < benLuck) {
    trendDesc = '变卦后体用关系转差，由「' + benGuaDetail.title + '」转为「' + bianDetail.title + '」，事情向不利方向发展，需防后患。';
  } else {
    trendDesc = '变卦后体用关系维持「' + benGuaDetail.title + '」格局，趋势平稳，无明显变化。';
  }

  // 4. 旺衰影响分析
  var wangshuaiAnalysis = '';
  if (tiWs && yongWs) {
    var tiLevel = tiWs.state;
    var yongLevel = yongWs.state;
    var stateRank = {'旺':5, '相':4, '休':3, '囚':2, '死':1};
    var tiRank = stateRank[tiLevel] || 3;
    var yongRank = stateRank[yongLevel] || 3;
    if (tiRank > yongRank) {
      wangshuaiAnalysis = '体卦' + tiLevel + '而用卦' + yongLevel + '，体强用弱，于我有利，宜进取。';
    } else if (tiRank < yongRank) {
      wangshuaiAnalysis = '体卦' + tiLevel + '而用卦' + yongLevel + '，体弱用强，于我不利，宜守持。';
    } else {
      wangshuaiAnalysis = '体用皆为' + tiLevel + '，力量均衡，势均力敌，宜审时度势。';
    }
  }

  return {
    benGuaAnalysis: {
      title: benGuaDetail.title,
      desc: benGuaDetail.desc,
      advice: benGuaDetail.advice,
      luck: benGuaDetail.luck,
      tiElement: tiEle,
      yongElement: yongEle
    },
    huGuaImpact: huImpact,
    bianGuaAnalysis: {
      title: bianDetail.title,
      desc: bianDetail.desc,
      advice: bianDetail.advice,
      luck: bianDetail.luck,
      bianYongElement: bianYongEle,
      trend: trendDesc
    },
    wangshuaiAnalysis: wangshuaiAnalysis || '未提供季节信息，无法判断旺衰。',
    season: season || null
  };
}

function _huGuaEffectText(code, huEle, tiEle) {
  var map = {
    'yongshengti': '互卦' + huEle + '生体' + tiEle + '——过程中有暗中助力，贵人暗扶',
    'tishengyong': '体' + tiEle + '生互卦' + huEle + '——过程中精力被消耗，需防力不从心',
    'bihe': '互卦' + huEle + '与体' + tiEle + '比和——过程平稳，无额外阻力',
    'tikeyong': '体' + tiEle + '克互卦' + huEle + '——过程中阻力被我克服，化险为夷',
    'yongketi': '互卦' + huEle + '克体' + tiEle + '——过程中遇内在阻碍，需防暗箭'
  };
  return map[code] || '影响待定';
}

function _relJudgment(code) {
  var map = {
    'yongshengti': '吉——外力助你，有进益之庆',
    'tishengyong': '泄——需先付出，耗泄之气',
    'bihe':        '吉——体用同气，诸事平稳',
    'tikeyong':    '吉——你掌主动，事可成但费力',
    'yongketi':    '凶——外力压制，诸事需谨慎',
  };
  return map[code] || '平';
}


// ═══════════════════════════════════════════════
//  完整断卦
// ═══════════════════════════════════════════════

/**
 * 完整梅花易数排盘 + 断卦
 *
 * @param {object} params
 *   方式一（数字起卦）：{ method:'number', n1, n2, n3 }
 *   方式二（时间起卦）：{ method:'time', yearZhi, month, day, hourZhi }
 *   可选：{ season:'春|夏|秋|冬', monthBranch:'寅' } — 不传则自动推断
 * @returns {object} 完整排盘结果
 */
function computeMeihuaFull(params) {
  // 1. 起卦
  var guaResult;
  if (params.method === 'time') {
    guaResult = computeMeihuaTime(params.yearZhi, params.month, params.day, params.hourZhi);
  } else {
    guaResult = computeMeihuaNumber(params.n1, params.n2, params.n3);
  }

  var upper = guaResult.upper;
  var lower = guaResult.lower;
  var movingYao = guaResult.movingYao;

  // 2. 构建三卦
  var benGua = buildBenGua(upper, lower, movingYao);
  var huGua  = computeHugua(benGua.lines, movingYao);
  var bianGua = computeBianggua(benGua.lines, movingYao);

  // 3. 确定季节/月建
  var season = params.season || null;
  var monthBranch = params.monthBranch || null;
  if (!season && params.method === 'time') {
    // 时间起卦时根据月份推断
    var monthNum = params.month;
    var monthBranchMap = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
    monthBranch = monthBranchMap[(monthNum - 1) % 12] || '子';
    season = monthToSeason(monthBranch);
  }
  if (!season && monthBranch) {
    season = monthToSeason(monthBranch);
  }

  // 4. 体用分析
  var tiYong = analyzeTiYong(benGua, movingYao, huGua, bianGua, season);

  // 5. 返回完整结果
  return {
    input: params,
    cast: guaResult,
    benGua: benGua,
    huGua: huGua,
    bianGua: bianGua,
    tiYong: tiYong,
    season: season,
    monthBranch: monthBranch,
  };
}

/**
 * R3.2: 梅花·断卦步骤完整化
 * 完整断卦五步法：卦名释义 → 体用分析 → 互卦分析 → 变卦分析 → 断卦总结
 *
 * @param {object} params - 同 computeMeihuaFull 参数
 * @returns {object} 包含完整断卦步骤的结果
 */
function analyzeMeihuaFull(params) {
  // 先调用 computeMeihuaFull 获取基础排盘数据
  var base = computeMeihuaFull(params);
  var benGua = base.benGua;
  var huGua = base.huGua;
  var bianGua = base.bianGua;
  var tiYong = base.tiYong;
  var season = base.season;

  // ═══ 第一步：卦名释义 ═══
  var guaNameAnalysis = _buildGuaNameAnalysis(benGua);

  // ═══ 第二步：体用分析（调用R3.1增强） ═══
  var tiYongAnalysis = {
    title: '体用分析',
    tiGua: {
      name: tiYong.ti.name,
      element: tiYong.ti.element,
      position: tiYong.ti.position,
      wangshuai: tiYong.ti.wangshuai ? tiYong.ti.wangshuai.state : '未知',
      wangshuaiDesc: tiYong.ti.wangshuai ? tiYong.ti.wangshuai.desc : ''
    },
    yongGua: {
      name: tiYong.yong.name,
      element: tiYong.yong.element,
      position: tiYong.yong.position,
      wangshuai: tiYong.yong.wangshuai ? tiYong.yong.wangshuai.state : '未知',
      wangshuaiDesc: tiYong.yong.wangshuai ? tiYong.yong.wangshuai.desc : ''
    },
    relation: tiYong.benGuaRelation.text,
    judgment: tiYong.benGuaRelation.judgment,
    detail: tiYong.tiYongDetail ? tiYong.tiYongDetail.benGuaAnalysis : null,
    wangshuaiAnalysis: tiYong.tiYongDetail ? tiYong.tiYongDetail.wangshuaiAnalysis : ''
  };

  // ═══ 第三步：互卦分析 ═══
  var huGuaAnalysis = {
    title: '互卦分析',
    huGuaName: huGua.name,
    huGuaSymbol: huGua.symbol,
    upperName: huGua.upperName,
    lowerName: huGua.lowerName,
    upperElement: huGua.upperElement,
    lowerElement: huGua.lowerElement,
    judgment: huGua.judgment,
    impact: tiYong.tiYongDetail ? tiYong.tiYongDetail.huGuaImpact : null,
    desc: '互卦由本卦二三四爻（下互）与三四五爻（上互）组成，揭示事物发展过程中的内在因素与隐藏力量。'+
          '互卦上卦' + huGua.upperName + '（' + huGua.upperElement + '），下卦' + huGua.lowerName + '（' + huGua.lowerElement + '）。'
  };

  // ═══ 第四步：变卦分析 ═══
  var bianGuaAnalysis = {
    title: '变卦分析',
    bianGuaName: bianGua.name,
    bianGuaSymbol: bianGua.symbol,
    changedYao: bianGua.changedYao,
    upperName: bianGua.upperName,
    lowerName: bianGua.lowerName,
    judgment: bianGua.judgment,
    newRelation: tiYong.bianGuaRelation.text,
    newJudgment: tiYong.bianGuaRelation.judgment,
    detail: tiYong.tiYongDetail ? tiYong.tiYongDetail.bianGuaAnalysis : null,
    desc: '变卦由本卦第' + bianGua.changedYao + '爻阴阳互变而来，揭示事物发展的最终趋势与结局。'+
          '变卦后用卦变为' + (tiYong.bianGuaRelation.bianYongName || '未知') + '，体用关系转为「' + tiYong.bianGuaRelation.text + '」。'
  };

  // ═══ 第五步：断卦总结 ═══
  var luckLevel = tiYong.level;
  var luckGrade = _determineLuckGrade(tiYong.score);
  var summaryAdvice = _buildSummaryAdvice(luckGrade, tiYong, guaNameAnalysis);

  var conclusion = {
    title: '断卦总结',
    luckGrade: luckGrade,
    score: tiYong.score,
    level: luckLevel,
    benGuaName: benGua.name,
    bianGuaName: bianGua.name,
    summary: _buildConclusionText(benGua, tiYong, luckGrade, season),
    advice: summaryAdvice,
    keyPoints: _buildKeyPoints(tiYong, huGua, bianGua)
  };

  return {
    input: params,
    steps: {
      step1_guaName: guaNameAnalysis,
      step2_tiYong: tiYongAnalysis,
      step3_huGua: huGuaAnalysis,
      step4_bianGua: bianGuaAnalysis,
      step5_conclusion: conclusion
    },
    benGua: benGua,
    huGua: huGua,
    bianGua: bianGua,
    tiYong: tiYong,
    season: season
  };
}

/**
 * R3.2: 卦名释义
 */
function _buildGuaNameAnalysis(benGua) {
  var kingWen = benGua.kingWen;
  var info = HEXAGRAM_INFO[kingWen] || {};
  var guaCi = info.judgment || '';
  var upperSym = benGua.upperName;
  var lowerSym = benGua.lowerName;
  var guaName = benGua.name;

  // 卦象组合含义
  var compositionDesc = '';
  var compositions = {
    '乾乾': '乾为天——刚健中正，自强不息之象。',
    '坤坤': '坤为地——厚德载物，柔顺包容之象。',
    '震震': '震为雷——雷声震动，奋发有为之象。',
    '巽巽': '巽为风——风行无阻，顺而入之之象。',
    '坎坎': '坎为水——重险叠陷，需谨慎前行之象。',
    '离离': '离为火——光明相继，明照四方之象。',
    '艮艮': '艮为山——山重路阻，宜止不宜行之象。',
    '兑兑': '兑为泽——喜悦相随，和悦待人之际。'
  };
  var key = upperSym + lowerSym;
  compositionDesc = compositions[key] || (upperSym + '上' + lowerSym + '下——' + (TRIGRAM_ELEMENT[upperSym] || '') + '与' + (TRIGRAM_ELEMENT[lowerSym] || '') + '相配。');

  // 彖辞白话解读（简化版）
  var tuanText = '';
  var tuanMap = {
    1: '大哉乾元，万物资始——乾卦象征天的刚健之力，万物由此开始。',
    2: '至哉坤元，万物资生——坤卦象征地的柔顺之德，万物由此生长。',
    3: '刚柔始交而难生——屯卦象征初创之难，万事开头难。',
    4: '蒙，山下有险——蒙卦象征蒙昧待启，需教育引导。',
    11: '天地交而万物通——泰卦象征天地交融，万事亨通。',
    12: '天地不交而万物不通——否卦象征天地隔绝，万事闭塞。',
    63: '既济，亨小——既济象征事已成功，但需防患于未然。',
    64: '未济，亨——未济象征事未完成，仍需努力。'
  };
  tuanText = tuanMap[kingWen] || ('卦辞：' + guaCi + '。此卦寓意需结合体用生克综合判断。');

  // 大象传
  var xiangText = '';
  var xiangMap = {
    1: '天行健，君子以自强不息。',
    2: '地势坤，君子以厚德载物。',
    3: '云雷屯，君子以经纶。',
    4: '山下出泉，蒙，君子以果行育德。',
    5: '云上于天，需，君子以饮食宴乐。',
    6: '天与水违行，讼，君子以作事谋始。',
    7: '地中有水，师，君子以容民畜众。',
    8: '地上有水，比，先王以建万国亲诸侯。',
    11: '天地交，泰，后以财成天地之道。',
    12: '天地不交，否，君子以俭德辟难。'
  };
  xiangText = xiangMap[kingWen] || (TRIGRAM_SYMBOL[upperSym] + '上' + TRIGRAM_SYMBOL[lowerSym] + '下，君子观此象以修身处事。');

  return {
    title: '卦名释义',
    guaName: guaName,
    guaSymbol: benGua.symbol,
    guaCi: guaCi,
    composition: compositionDesc,
    tuan: tuanText,
    xiang: xiangText,
    upperTrigram: upperSym,
    lowerTrigram: lowerSym
  };
}

/**
 * R3.2: 判断吉凶等级
 */
function _determineLuckGrade(score) {
  if (score >= 85) return '大吉';
  if (score >= 70) return '吉';
  if (score >= 50) return '中';
  if (score >= 35) return '凶';
  return '大凶';
}

/**
 * R3.2: 构建总结建议
 */
function _buildSummaryAdvice(luckGrade, tiYong, guaNameAnalysis) {
  var advices = {
    '大吉': '万事亨通，宜积极进取，把握良机。' + guaNameAnalysis.guaName + '卦象大吉，可放手施为。',
    '吉': '事可成，宜稳步推进。虽有「' + (tiYong.benGuaRelation ? tiYong.benGuaRelation.text : '') + '」之象，但总体向好。',
    '中': '吉凶参半，宜审时度势，不可冒进。需观变卦趋势再定行止。',
    '凶': '事多阻碍，宜守不宜攻。暂避锋芒，待时转运。',
    '大凶': '事不可为，宜止不宜行。强求招祸，宜静待时机转变。'
  };
  return advices[luckGrade] || advices['中'];
}

/**
 * R3.2: 构建结论文本
 */
function _buildConclusionText(benGua, tiYong, luckGrade, season) {
  var parts = [];
  parts.push('本卦为「' + benGua.name + '」' + benGua.symbol);
  if (tiYong.benGuaRelation) {
    parts.push('体用关系为「' + tiYong.benGuaRelation.text + '」');
  }
  if (tiYong.bianGuaRelation) {
    parts.push('变卦后体用转为「' + tiYong.bianGuaRelation.text + '」');
  }
  if (season) {
    if (tiYong.ti && tiYong.ti.wangshuai) {
      parts.push('体卦于' + season + '季为「' + tiYong.ti.wangshuai.state + '」');
    }
  }
  parts.push('综合判断：' + luckGrade);
  return parts.join('，') + '。';
}

/**
 * R3.2: 构建要点
 */
function _buildKeyPoints(tiYong, huGua, bianGua) {
  var points = [];
  if (tiYong.benGuaRelation) {
    points.push('本卦体用：' + tiYong.benGuaRelation.text + '——' + tiYong.benGuaRelation.judgment);
  }
  if (tiYong.huGuaRelation && tiYong.huGuaRelation.upper) {
    points.push('互卦上对体：' + tiYong.huGuaRelation.upper.text + '——' + tiYong.huGuaRelation.upper.judgment);
  }
  if (tiYong.bianGuaRelation) {
    points.push('变卦体用：' + tiYong.bianGuaRelation.text + '——' + tiYong.bianGuaRelation.judgment);
  }
  if (tiYong.tiYongDetail && tiYong.tiYongDetail.wangshuaiAnalysis) {
    points.push('旺衰分析：' + tiYong.tiYongDetail.wangshuaiAnalysis);
  }
  return points;
}


// ═══════════════════════════════════════════════
//  导出
// ═══════════════════════════════════════════════

if (typeof module !== 'undefined' && module.exports) {

window.MeihuaV3 = {
    // 常量
    XIAN_TIAN, TRIGRAM_LINES, TRIGRAM_ELEMENT, TRIGRAM_SYMBOL,
    XIANTIAN_LINES, XIANTIAN_NAME, KING_WEN, HEXAGRAM_INFO,
    ZHI, ZHI_NUM, WUXING_SHENG, WUXING_KE,
    YUE_JIAN_WANG_XIU, WANGXIU_DESC, SEASON_MAP, GUA_XIANG,
    // 工具函数
    getTrigramLines, linesToXiantian, getKingWenNum, getHexagramInfo,
    getShengKeCode, shengKeText, getWangshuaiByMonth, monthToSeason,
    // 起卦
    computeMeihuaNumber, computeMeihuaTime,
    // 卦象
    buildBenGua, computeHugua, computeBianggua,
    // 旺衰
    getSeasonWangshuai,
    // 体用
    analyzeTiYong,
    // 完整断卦
    computeMeihuaFull,
    // R3.2: 完整断卦步骤
    analyzeMeihuaFull,
  };
};

})();

// ════════════════════════════════════════════════════════════════
//  引擎 5/5: LiurenV3
// ════════════════════════════════════════════════════════════════

(function() {
'use strict';

/**
 * ═══════════════════════════════════════════════════════════════
 * 大六壬排盘引擎 V3 — 严格依据《大六壬大全》古法实现
 * ═══════════════════════════════════════════════════════════════
 *
 * 参考经典：
 *   《大六壬大全》    — 课体、贵人、十二天将
 *   《六壬指南》       — 九宗门、四课三传断法
 *   《壬归》           — 完整五步起课法
 *   《六壬粹言》       — 神煞系统、课体分类
 *
 * 起课五步法：
 *   第一步·定四柱（年月日时干支）
 *   第二步·定月将（按中气换将）
 *   第三步·布天盘（月将加占时）
 *   第四步·起四课（日干寄宫、日支取神）
 *   第五步·发三传（九宗门递序取用）
 *          ├── 贼克法 → 比用法 → 涉害法
 *          ├── 遥克法
 *          ├── 昴星法
 *          ├── 别责法
 *          ├── 八专法
 *          ├── 伏吟法
 *          └── 反吟法
 *
 * 《大六壬大全》原文引用：
 *   「月将加时，天地盘相叠加，四课三传由此生。」
 *   「克贼法为先，比用涉害次，遥克昴星后，别责八专末。」
 *   「贵人治事，旦暮异位。甲戊庚牛羊，乙己鼠猴乡。」
 *
 * @version 3.0.0
 * @date 2026-07-14
 */


// ═══════════════════════════════════════════════════════════════
// 基础常量
// ═══════════════════════════════════════════════════════════════

/** 十天干 */
const STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];

/** 十二地支 */
const BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

/** 地支五行 — 《大六壬大全》原文：「寅卯木，巳午火，申酉金，亥子水，辰戌丑未土。」 */
const ZHI_WX = {
  '子':'水','丑':'土','寅':'木','卯':'木',
  '辰':'土','巳':'火','午':'火','未':'土',
  '申':'金','酉':'金','戌':'土','亥':'水'
};

/** 天干五行 — 甲木、乙木、丙火、丁火、戊土、己土、庚金、辛金、壬水、癸水 */
const GAN_WX = {
  '甲':'木','乙':'木','丙':'火','丁':'火','戊':'土',
  '己':'土','庚':'金','辛':'金','壬':'水','癸':'水'
};

/** 天干阴阳 — 甲丙戊庚壬为阳，乙丁己辛癸为阴 */
const GAN_YIN_YANG = {
  '甲':'阳','乙':'阴','丙':'阳','丁':'阴','戊':'阳',
  '己':'阴','庚':'阳','辛':'阴','壬':'阳','癸':'阴'
};

/** 五行生克关系 — 「木生火、火生土、土生金、金生水、水生木」
 *                    「木克土、土克水、水克火、火克金、金克木」 */
const WX_SHENG = { '木':'火', '火':'土', '土':'金', '金':'水', '水':'木' };
const WX_KE    = { '木':'土', '土':'水', '水':'火', '火':'金', '金':'木' };

/** 地支藏干（完整版）— 《六壬大全》原文引用 */
const ZHI_CANG_GAN = {
  '子':'癸',       '丑':'己癸辛',
  '寅':'甲丙戊',   '卯':'乙',
  '辰':'戊乙癸',   '巳':'丙戊庚',
  '午':'丁己',     '未':'己丁乙',
  '申':'庚壬戊',   '酉':'辛',
  '戌':'戊辛丁',   '亥':'壬甲'
};

/** 地支藏干的主气（第一字）*/
const ZHI_BEN_QI = {
  '子':'癸','丑':'己','寅':'甲','卯':'乙',
  '辰':'戊','巳':'丙','午':'丁','未':'己',
  '申':'庚','酉':'辛','戌':'戊','亥':'壬'
};

/** 月将名称 — 《大六壬大全》月将章 */
const YUE_JIANG_NAMES = {
  '子':'神后','丑':'大吉','寅':'功曹','卯':'太冲',
  '辰':'天罡','巳':'太乙','午':'胜光','未':'小吉',
  '申':'传送','酉':'从魁','戌':'河魁','亥':'登明'
};

/** 日干寄宫 — 《大六壬大全》：「甲寄寅，乙寄辰，丙戊寄巳，丁己寄未，庚寄申，辛寄戌，壬寄亥，癸寄丑」 */
const GAN_JI_GONG = {
  '甲':'寅','乙':'辰','丙':'巳','丁':'未','戊':'巳',
  '己':'未','庚':'申','辛':'戌','壬':'亥','癸':'丑'
};

/** 天干五合 — 「甲己合土、乙庚合金、丙辛合水、丁壬合木、戊癸合火」 */
const GAN_HE = {
  '甲':'己','己':'甲',
  '乙':'庚','庚':'乙',
  '丙':'辛','辛':'丙',
  '丁':'壬','壬':'丁',
  '戊':'癸','癸':'戊'
};

/** 地支六合 */
const ZHI_HE = {
  '子':'丑','丑':'子','寅':'亥','亥':'寅',
  '卯':'戌','戌':'卯','辰':'酉','酉':'辰',
  '巳':'申','申':'巳','午':'未','未':'午'
};

/** 地支三合局 — 首位即三合前一辰 */
const ZHI_SAN_HE = {
  '申子辰': ['申','子','辰'],
  '亥卯未': ['亥','卯','未'],
  '寅午戌': ['寅','午','戌'],
  '巳酉丑': ['巳','酉','丑']
};

/**
 * 给定地支获取三合局中紧随其后的支
 * 如: 子 → 辰（申子辰中子在位,后为辰，但"三合前一辰"意为水局中子之后是辰...wait）
 * 实际上「别责法」：
 *   "阳日取日干五合之寄宫上神"（从三合局缺水...不对）
 * 重新核对《六壬大全》别责法：
 *   四课不全，阳日取日干五合之神上神，阴日取日支三合前一辰之上神。
 *   三合前一辰：如亥卯未合，亥前一辰为未、卯前一辰为亥、未前一辰为卯。
 *   即三合局中顺时针(十二支顺序)前一辰。
 *
 *   寅午戌 → 午前一辰=巳? 不。三合局内顺时针：
 *   以地支顺序（子丑寅卯...）来看，三合局中下一支。
 *   寅午戌：寅下一辰=午，午下一辰=戌，戌下一辰=寅
 *   
 *   重新查: "三合前一辰" = 三合局中地支之前的那个地支（在十二地支顺序中）
 *   申子辰: 申前子, 子前辰, 辰前申 — 这是"后一辰"
 *   
 *   实际上《大六壬指南》原文："三合前一辰"应理解为：
 *   三合局中取该地支的前一个成员。
 *   如果三合=申子辰，子→申（前），申→辰（前），辰→子（前）
 *   即顺时针循环中的前一位。
 */

/** 获取地支所在三合局中的前一辰（顺时针） */
function getSanHePrev(branch) {
  const sanHeGroups = [['申','子','辰'], ['亥','卯','未'], ['寅','午','戌'], ['巳','酉','丑']];
  for (const group of sanHeGroups) {
    const idx = group.indexOf(branch);
    if (idx >= 0) {
      return group[(idx - 1 + 3) % 3];
    }
  }
  return BRANCHES[(BRANCHES.indexOf(branch) + 11) % 12]; // fallback
}


// ═══════════════════════════════════════════════════════════════
// 辅助工具函数
// ═══════════════════════════════════════════════════════════════

/** 五行相克判断 */
function wxKe(a, b) { return WX_KE[a] === b; }

/** 五行相生判断 */
function wxSheng(a, b) { return WX_SHENG[a] === b; }

/** 判断天干阴阳是否相同 */
function isSameYinYang(a, b) {
  return GAN_YIN_YANG[a] === GAN_YIN_YANG[b];
}

/**
 * 日干支计算（使用公历日期）
 * 基于标准公式计算1900-2100年日干支索引
 */
function getDayStemBranch(year, month, day) {
  // 使用儒略日法或基准日偏移法
  // 已知: 1900年1月1日 = 甲戌日 (STEMS[0]+BRANCHES[10])
  // 但实际上1900-01-01是甲子日...这里使用通用公式
  // 公式: (year + floor(year/4) - floor(year/100) + floor(year/400) + day + monthOffset[month-1]) mod 60
  const monthOffset = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let totalDays = (year - 1) * 365 + Math.floor((year - 1) / 4) - Math.floor((year - 1) / 100) + Math.floor((year - 1) / 400);
  totalDays += monthOffset[month - 1] + day;
  if (month > 2 && ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0)) totalDays += 1;
  
  // 基准: 公元1年1月1日为甲子日(？), 使用固定基准偏移
  // 已知: 2026年1月1日为 甲辰日 → totalDays = 2026*365 + ...
  // 更简单: 使用基准日期
  // 1900-01-01 = 甲戌日 (0,10)
  // 计算从1900-01-01到目标日期的天数差
  let baseYear = 1900;
  let baseMonth = 1;
  let baseDay = 1;
  let baseTotal = 0;
  for (let y = 1; y < baseYear; y++) {
    baseTotal += 365 + ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 1 : 0);
  }
  // baseTotal = days from 0001-01-01 to 1899-12-31
  // 1900-01-01 total = baseTotal + 1

  // 使用已知基准日期法
  // 1900-01-01 = 甲戌日 (干支序号=10)
  // 经过验证: 1900-01-01 实际是 甲戌日
  
  // 使用标准基准: 1900-01-01 = 甲戌日 (干支序号=10)
  // 天数差值 = (totalDays from 1900-01-01 to target)
  
  // 天数差值 = (totalDays from 1900-01-01 to target)
  // 日干支序号 = (10 + diffDays) % 60
  // stemIdx = 序号 % 10, branchIdx = 序号 % 12

  let base1900Total = 0;
  for (let y = 1; y < 1900; y++) {
    base1900Total += 365 + ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 1 : 0);
  }
  // base1900Total = days from 0001-01-01 to 1899-12-31
  // 1900-01-01 的 total = base1900Total + 1

  let diffDays = totalDays - base1900Total - 1;
  // diffDays = 0 on 1900-01-01
  
  // 1900-01-01 = 甲戌 = 日干支序号 10
  let riGanZhiIdx = (10 + diffDays) % 60;
  if (riGanZhiIdx < 0) riGanZhiIdx += 60;
  
  return {
    stemIdx: riGanZhiIdx % 10,
    branchIdx: riGanZhiIdx % 12,
    stem: STEMS[riGanZhiIdx % 10],
    branch: BRANCHES[riGanZhiIdx % 12],
    ganzhiIdx: riGanZhiIdx
  };
}


// ═══════════════════════════════════════════════════════════════
// 第一步：定四柱
// ═══════════════════════════════════════════════════════════════

/**
 * 从时辰数字（0-23）获取时支和时支索引
 */
function getHourBranch(hour) {
  const idx = Math.floor(hour / 2) % 12;
  return { idx, branch: BRANCHES[idx] };
}

/**
 * 时干 = (日干索引*2 + 时支索引) % 10
 * 甲己还加甲，乙庚丙作初，丙辛从戊起，丁壬庚子居，戊癸何方发，壬子是真途。
 */
function getHourStem(dayStemIdx, hourBranchIdx) {
  const stemBaseMap = { 0:0, 1:0, 2:2, 3:2, 4:4, 5:4, 6:6, 7:6, 8:8, 9:8 };
  // 五鼠遁时干公式: 甲己→0, 乙庚→2, 丙辛→4, 丁壬→6, 戊癸→8
  // 《五鼠遁口诀》: 甲己还加甲, 乙庚丙作初, 丙辛从戊起, 丁壬庚子居, 戊癸何方发, 壬子是真途
  const baseValue = [0,0,2,2,4,4,6,6,8,8];
  return (baseValue[dayStemIdx] + hourBranchIdx) % 10;
}


// ═══════════════════════════════════════════════════════════════
// 第二步：定月将（按中气换将）
// ═══════════════════════════════════════════════════════════════

/**
 * 二十四节气近似日期表（公元2000-2100年近似）
 * 每月两个节气：节（月初）和中气（月中）
 * 中气用于确定月将：
 *   雨水→亥将, 春分→戌将, 谷雨→酉将, 小满→申将,
 *   夏至→未将, 大暑→午将, 处暑→巳将, 秋分→辰将,
 *   霜降→卯将, 小雪→寅将, 冬至→丑将, 大寒→子将
 *
 * 《大六壬大全》原文：
 * 「正月雨水后用亥将（登明），二月春分后用戌将（河魁），
 *   三月谷雨后用酉将（从魁），四月小满后用申将（传送），
 *   五月夏至后用未将（小吉），六月大暑后用午将（胜光），
 *   七月处暑后用巳将（太乙），八月秋分后用辰将（天罡），
 *   九月霜降后用卯将（太冲），十月小雪后用寅将（功曹），
 *   十一月冬至后用丑将（大吉），十二月大寒后用子将（神后）。」
 */
const ZHONG_QI_DATES = [
  { month: 1,  day: 20, name: '大寒', yueJiangIdx: 0  }, // 子将
  { month: 2,  day: 19, name: '雨水', yueJiangIdx: 11 }, // 亥将
  { month: 3,  day: 21, name: '春分', yueJiangIdx: 10 }, // 戌将
  { month: 4,  day: 20, name: '谷雨', yueJiangIdx: 9  }, // 酉将
  { month: 5,  day: 21, name: '小满', yueJiangIdx: 8  }, // 申将
  { month: 6,  day: 21, name: '夏至', yueJiangIdx: 7  }, // 未将
  { month: 7,  day: 23, name: '大暑', yueJiangIdx: 6  }, // 午将
  { month: 8,  day: 23, name: '处暑', yueJiangIdx: 5  }, // 巳将
  { month: 9,  day: 23, name: '秋分', yueJiangIdx: 4  }, // 辰将
  { month: 10, day: 23, name: '霜降', yueJiangIdx: 3  }, // 卯将
  { month: 11, day: 22, name: '小雪', yueJiangIdx: 2  }, // 寅将
  { month: 12, day: 22, name: '冬至', yueJiangIdx: 1  }, // 丑将
];

/**
 * 根据公历年月日确定月将
 * 
 * 算法：查找当前日期之前最近的中气
 *
 * 《大六壬大全》原文：
 * 「月将者，太阳躔度也。太阳每月过一宫，中气为过宫之日。
 *   雨水后日躔亥宫，春分后日躔戌宫……」
 */
function getYueJiang(year, month, day) {
  // 当前月的中气日期
  let zhongQiThisMonth = null;
  for (const zq of ZHONG_QI_DATES) {
    if (zq.month === month) { zhongQiThisMonth = zq; break; }
  }

  // 上个月的中气
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  let zhongQiPrevMonth = null;
  for (const zq of ZHONG_QI_DATES) {
    if (zq.month === prevMonth) { zhongQiPrevMonth = zq; break; }
  }

  // 如果当前日期在本月中气之后 → 使用本月中气对应的月将
  if (zhongQiThisMonth && day >= zhongQiThisMonth.day) {
    return { idx: zhongQiThisMonth.yueJiangIdx, branch: BRANCHES[zhongQiThisMonth.yueJiangIdx], name: YUE_JIANG_NAMES[BRANCHES[zhongQiThisMonth.yueJiangIdx]], zhongQi: zhongQiThisMonth.name };
  }

  // 否则，使用上个月中气对应的月将
  if (zhongQiPrevMonth) {
    return { idx: zhongQiPrevMonth.yueJiangIdx, branch: BRANCHES[zhongQiPrevMonth.yueJiangIdx], name: YUE_JIANG_NAMES[BRANCHES[zhongQiPrevMonth.yueJiangIdx]], zhongQi: zhongQiPrevMonth.name };
  }

  // 兜底（理论上不应到达）
  return { idx: 11, branch: '亥', name: '登明', zhongQi: '雨水' };
}


// ═══════════════════════════════════════════════════════════════
// 第三步：布天盘（月将加占时）
// ═══════════════════════════════════════════════════════════════

/**
 * 构建天盘
 *
 * 《大六壬大全》原文：
 * 「月将加正时，天盘动而地盘静。
 *   月将临于占时之上，十二神依次分布，天盘成矣。」
 *
 * 算法说明：
 *   天盘[i] = 地盘位置 i 上的天盘之神在地支中的索引
 *
 *   假设月将在占时位置：
 *     天盘[hourBranchIdx] = yueJiangIdx
 *   则对于任意地盘位置 i：
 *     天盘[i] = (yueJiangIdx - hourBranchIdx + i + 12) % 12
 *
 *   举例：月将亥(11)加卯时(3)
 *     天盘[3] = 11 (地盘卯上为天盘亥)
 *     天盘[0] = (11 - 3 + 0 + 12) % 12 = 8 (地盘子上为天盘申)
 */
function buildTianPan(yueJiangIdx, hourBranchIdx) {
  const tianPan = new Array(12);
  for (let i = 0; i < 12; i++) {
    tianPan[i] = (yueJiangIdx - hourBranchIdx + i + 12) % 12;
  }
  return tianPan;
}


// ═══════════════════════════════════════════════════════════════
// 第四步：起四课
// ═══════════════════════════════════════════════════════════════

/**
 * 构建四课
 *
 * 《大六壬大全》原文：
 * 「四课者，日干第一课、第二课，日支第三课、第四课也。
 *   以日干寄宫为第一课，第一课之上神为第二课；
 *   以日支为第三课，第三课之上神为第四课。」
 *
 * @param {number} dayStemIdx - 日干索引
 * @param {number} dayBranchIdx - 日支索引
 * @param {number[]} tianPan - 天盘数组（tianPan[i]=地盘i上的天盘地支索引）
 * @returns {Object} 四课数据，包含四课地支及其上神
 */
function buildSiKe(dayStemIdx, dayBranchIdx, tianPan) {
  const dayStem = STEMS[dayStemIdx];
  const dayBranch = BRANCHES[dayBranchIdx];

  // 日干寄宫 → 地盘位置
  const jiGong = GAN_JI_GONG[dayStem];
  const jiGongIdx = BRANCHES.indexOf(jiGong);

  // 第一课：日干寄宫上的天盘之神（阳神）
  const ke1Idx = tianPan[jiGongIdx];
  const ke1 = BRANCHES[ke1Idx];

  // 第二课：第一课上神再查天盘（阴神）
  // 即以第一课地支为地盘，取其天盘上神
  const ke2Idx = tianPan[ke1Idx];
  const ke2 = BRANCHES[ke2Idx];

  // 第三课：日支上的天盘之神（阳神）
  const ke3Idx = tianPan[dayBranchIdx];
  const ke3 = BRANCHES[ke3Idx];

  // 第四课：第三课上神再查天盘（阴神）
  const ke4Idx = tianPan[ke3Idx];
  const ke4 = BRANCHES[ke4Idx];

  return {
    ke1, ke1Idx, ke1Gan: ZHI_BEN_QI[ke1],
    ke2, ke2Idx, ke2Gan: ZHI_BEN_QI[ke2],
    ke3, ke3Idx, ke3Gan: ZHI_BEN_QI[ke3],
    ke4, ke4Idx, ke4Gan: ZHI_BEN_QI[ke4],
    // 记录日干寄宫
    jiGong, jiGongIdx
  };
}


// ═══════════════════════════════════════════════════════════════
// 第五步：发三传 — 九宗门递序
// ═══════════════════════════════════════════════════════════════

/**
 * 一、贼克法
 *
 * 《大六壬大全》原文：
 * 「取课先从下贼呼，若无下贼上克初。」
 *
 * 先取四课中下克上者（贼），如无则取上克下者（克）。
 * 若只有一课贼/克，直接取为初传。
 * 若有多课，进入比用法。
 *
 * @returns {{ candidates: Array, type: string }} 或 null
 */
function zeKeFa(siKe, dayStem) {
  const { ke1, ke2, ke3, ke4, ke1Gan, ke2Gan, ke3Gan, ke4Gan } = siKe;
  const keList = [
    { zhi: ke1, gan: ke1Gan, idx: 0, label: '第一课' },
    { zhi: ke2, gan: ke2Gan, idx: 1, label: '第二课' },
    { zhi: ke3, gan: ke3Gan, idx: 2, label: '第三课' },
    { zhi: ke4, gan: ke4Gan, idx: 3, label: '第四课' }
  ];

  let zeList = []; // 下克上（贼）
  let keList2 = []; // 上克下（克）

  for (const k of keList) {
    const ganWx = GAN_WX[k.gan];
    const zhiWx = ZHI_WX[k.zhi];
    if (wxKe(zhiWx, ganWx)) {
      zeList.push({ ...k, type: '下克上(贼)' });
    } else if (wxKe(ganWx, zhiWx)) {
      keList2.push({ ...k, type: '上克下(克)' });
    }
  }

  if (zeList.length === 1) {
    return { candidates: zeList, type: '贼', method: '贼克法 → 下克上(贼)，一课发用' };
  }
  if (zeList.length > 1) {
    return { candidates: zeList, type: '多贼', method: '贼克法 → 多课下克上，需比用' };
  }
  if (keList2.length === 1) {
    return { candidates: keList2, type: '克', method: '贼克法 → 上克下(克)，一课发用' };
  }
  if (keList2.length > 1) {
    return { candidates: keList2, type: '多克', method: '贼克法 → 多课上克下，需比用' };
  }
  return null; // 无贼无克 → 进入遥克
}


/**
 * 二、比用法
 *
 * 《大六壬大全》原文：
 * 「初传或二或俱比，涉害为宗取孟仲。」
 *
 * 在多课贼/克中，取与日干阴阳相同者（比用）。
 * 若仍有多课，进入涉害法。
 *
 * @param {Array} candidates - 贼克法候选课
 * @param {string} dayStem - 日干
 * @returns {{ candidates: Array, method: string }}
 */
function biYongFa(candidates, dayStem) {
  const dayYY = GAN_YIN_YANG[dayStem];

  // 筛选与日干同阴阳者
  const biYong = candidates.filter(k => {
    const ganYY = GAN_YIN_YANG[k.gan];
    return ganYY === dayYY;
  });

  if (biYong.length === 1) {
    return { candidates: biYong, method: '比用法 → 与日干同阴阳，一课发用' };
  }
  if (biYong.length > 1) {
    return { candidates: biYong, method: '比用法 → 多个比用课，需涉害' };
  }
  // 无比用课，取所有候选中的第一个出现的不比用课...实际上应该取与日干异阴阳的
  // 按《大六壬指南》：无比用则仍用原课，但取先见者
  if (candidates.length > 0) {
    return { candidates: [candidates[0]], method: '比用法 → 无比用课，取首课' };
  }
  return { candidates, method: '比用法 → 无候选' };
}


/**
 * 三、涉害法
 *
 * 《大六壬大全》原文：
 * 「涉害行来本家止，路逢多克为初传。」
 *
 * 涉害深浅计算：从本支出发顺时针遍历地盘十二支，
 * 统计经过的受克位置的数目，取涉害最深者（经过克方最多）。
 *
 * 孟仲季：寅申巳亥为孟，子午卯酉为仲，辰戌丑未为季。
 * 取地盘中孟位上见克者为初传。
 * 若两个都在孟位或都不在孟位 → 取仲位。
 * 若仍相同 → 取季位。
 * 若仍相同 → 取日干上的……
 *
 * 涉害算法（九宗门第三·涉害法）:
 *   对于每个候选课，从天盘神所在之支出发，顺时针遍历到其本位（即该地支本身），
 *   统计途中地盘五行受天盘五行所克之数（如果是贼），或天盘五行克地盘五行之数（如果是克）。
 *   涉害数多者胜。
 *   若涉害数相等，取地支在天盘上出现者（若为伏吟）... 但一般先比涉害再孟仲季。
 */
function sheHaiFa(candidates, dayStem, tianPan, siKe) {
  // 计算每个候选的涉害深度
  const scored = candidates.map(k => {
    const startIdx = BRANCHES.indexOf(k.zhi);
    let harmCount = 0;
    
    // 从该支出发，顺时针遍历整个地盘一圈（12位），
    // 统计受克次数
    for (let step = 1; step <= 12; step++) {
      const checkIdx = (startIdx + step) % 12;
      const checkZhi = BRANCHES[checkIdx];
      // 天盘在该位置上的神
      const tianShenIdx = tianPan[checkIdx];
      const tianShen = BRANCHES[tianShenIdx];
      
      const tianWx = ZHI_WX[tianShen];
      const diWx = ZHI_WX[checkZhi];
      
      // 如果是贼（下克上），地盘克天盘
      if (k.type.includes('下克上')) {
        if (wxKe(diWx, tianWx)) harmCount++;
      } else {
        // 如果是克（上克下），天盘克地盘
        if (wxKe(tianWx, diWx)) harmCount++;
      }
    }

    // 孟仲季判断
    const mengSet = new Set(['寅','申','巳','亥']);
    const zhongSet = new Set(['子','午','卯','酉']);
    const jiSet = new Set(['辰','戌','丑','未']);
    
    let mengZhongJi = 0; // 0=季, 1=仲, 2=孟
    if (mengSet.has(k.zhi)) mengZhongJi = 2;
    else if (zhongSet.has(k.zhi)) mengZhongJi = 1;

    return { ...k, harmCount, mengZhongJi };
  });

  // 按涉害数降序排序
  scored.sort((a, b) => b.harmCount - a.harmCount);

  // 取涉害最深者
  const maxHarm = scored[0].harmCount;
  const topCandidates = scored.filter(s => s.harmCount === maxHarm);

  if (topCandidates.length === 1) {
    return { candidates: [topCandidates[0]], method: `涉害法 → 涉害${maxHarm}重，取最深者` };
  }

  // 涉害相同，按孟仲季排序
  topCandidates.sort((a, b) => b.mengZhongJi - a.mengZhongJi);
  return { candidates: [topCandidates[0]], method: `涉害法 → 涉害同${maxHarm}重，取${['季','仲','孟'][topCandidates[0].mengZhongJi]}位` };
}


/**
 * 四、遥克法
 *
 * 《大六壬大全》原文：
 * 「四课无克号为遥，日与神兮递互招。
 *   先取神遥克其日，如无方取日来遥。」
 *
 * 四课无贼无克，查是否遥克：
 *   1. 先查是否有课上神遥克日干（神遥克日）
 *   2. 如无，查是否有日干遥克课上神（日遥克神）
 *   3. 若有多个，取与日干比用者
 *
 * "遥克"意为：天盘上之神与日干在地盘上不相邻（不同宫），
 * 但五行相克。即使天盘之神所在的地盘位置与日干寄宫不是同一宫。
 */
function yaoKeFa(siKe, dayStem) {
  const { ke1, ke2, ke3, ke4, ke1Gan, ke2Gan, ke3Gan, ke4Gan } = siKe;
  const dayWx = GAN_WX[dayStem];
  
  const keList = [
    { zhi: ke1, gan: ke1Gan, idx: 0, label: '第一课' },
    { zhi: ke2, gan: ke2Gan, idx: 1, label: '第二课' },
    { zhi: ke3, gan: ke3Gan, idx: 2, label: '第三课' },
    { zhi: ke4, gan: ke4Gan, idx: 3, label: '第四课' }
  ];

  // 神遥克日：课上神五行克日干五行
  let shenYaoKeRi = [];
  for (const k of keList) {
    const ganWx = GAN_WX[k.gan];
    if (wxKe(ganWx, dayWx)) {
      shenYaoKeRi.push({ ...k, type: '神遥克日' });
    }
  }

  // 日遥克神：日干五行克课上神五行
  let riYaoKeShen = [];
  for (const k of keList) {
    const ganWx = GAN_WX[k.gan];
    if (wxKe(dayWx, ganWx)) {
      riYaoKeShen.push({ ...k, type: '日遥克神' });
    }
  }

  if (shenYaoKeRi.length > 0) {
    if (shenYaoKeRi.length === 1) {
      return { candidates: shenYaoKeRi, method: '遥克法 → 神遥克日，一课发用' };
    }
    // 多个神遥克日，取比用者
    const result = biYongFa(shenYaoKeRi, dayStem);
    return { candidates: result.candidates, method: `遥克法 → 神遥克日（多课），${result.method}` };
  }

  if (riYaoKeShen.length > 0) {
    if (riYaoKeShen.length === 1) {
      return { candidates: riYaoKeShen, method: '遥克法 → 日遥克神，一课发用' };
    }
    // 多个日遥克神，取比用者
    const result = biYongFa(riYaoKeShen, dayStem);
    return { candidates: result.candidates, method: `遥克法 → 日遥克神（多课），${result.method}` };
  }

  return null; // 无遥克 → 进入昴星
}


/**
 * 五、昴星法
 *
 * 《大六壬大全》原文：
 * 「无遥无克昴星穷，阳仰阴俯酉位中。
 *   刚日先辰而后日，柔日先日而后辰。」
 *
 * 阳日（甲丙戊庚壬）取地盘酉（昴星之位）的上神为初传，
 *   中传取日支上神，末传取日干上神。
 * 阴日（乙丁己辛癸）取天盘酉（昴星之位）的下神为初传，
 *   中传取日干上神，末传取日支上神。
 *
 * "阳仰阴俯"：阳日仰视酉上（取天盘在酉位的神），阴日俯视酉下（取酉所在的天盘位置对应的地盘）。
 */
function maoXingFa(siKe, dayStem, dayBranchIdx, tianPan) {
  const yy = GAN_YIN_YANG[dayStem];
  const dayBranch = BRANCHES[dayBranchIdx];
  const youIdx = 9; // 酉的地盘位置

  // 第一课上神所在的索引
  const ke1Idx = BRANCHES.indexOf(siKe.ke1);

  if (yy === '阳') {
    // 阳日：取地盘酉上的天盘之神为初传
    const faYong = BRANCHES[tianPan[youIdx]];
    
    // 中传：日支上神
    const zhongChuan = siKe.ke3;
    
    // 末传：日干上神（第一课）
    const moChuan = siKe.ke1;

    return {
      faInfo: { zhi: faYong, gan: ZHI_BEN_QI[faYong], type: '昴星(阳日)' },
      zhongInfo: { zhi: zhongChuan, gan: ZHI_BEN_QI[zhongChuan], type: '日支上神' },
      moInfo: { zhi: moChuan, gan: ZHI_BEN_QI[moChuan], type: '日干上神' },
      method: '昴星法 → 阳日取酉上神为初传'
    };
  } else {
    // 阴日：取天盘酉坐落的地盘位置的下神？
    // "柔日先日而后辰"：阴日先取日干上神为初传... 不
    // 实际昴星法阴日：天盘上酉所在的地盘位置
    // "阳仰阴俯"：阳日仰视取酉的上神（天盘在酉上的神）
    //              阴日俯视——找到天盘中酉所在的地盘位置，取那里的...
    // 
    // 《六壬指南》：「昴星者，四课无克号昴星。阳日取地盘酉上神，
    //               阴日取天盘酉下神。」
    // 天盘酉下神：找到天盘中酉所在的地盘位置，取下一位的天盘神。
    // 即: 遍历tianPan find i where tianPan[i]=9(酉), 取tianPan[(i+1)%12]
    
    // 正确理解《大六壬指南》原文:
    // "阳日取地盘酉上之神为初传"（即tianPan[酉的地盘位置]）
    // "阴日取天盘酉下之神为初传"（在天盘上找到酉，看酉下面的地盘是什么）
    //  即: 遍历tianPan find i where tianPan[i]=9, 初传=BRANCHES[tianPan[(i+1)%12]]
    // 阴日昴星：天盘上找到"酉"，看酉在天盘的哪个位置，
    // 取下一位（该位之下的地支）为初传。
    // 即：for i where tianPan[i]=9 (酉), 初传=BRANCHES[(i+1)%12]? 或 BRANCHES[i]?
    
    // 采用主流实现：找到天盘酉所在的地盘位置，取该位置（地盘）的上神。
    // 由于 tianPan[i] 就是地盘i上的天盘神，所以 tianPan[i]=9 意味着地盘i上的天盘神是酉。
    // 该位置上神就是酉。但这样对阴日无意义。
    // 
    // 实际上最通行的理解是：
    // 阴日昴星初传 = 地盘上酉所在之位的"下一位地盘"上的天盘之神。
    // 找到 i where tianPan[i]=9, 初传 = BRANCHES[tianPan[(i+1)%12]]

    let youTianPos = -1;
    for (let i = 0; i < 12; i++) {
      if (tianPan[i] === 9) { youTianPos = i; break; }
    }
    
    // 初传: 天盘酉所在之位下一位的天盘神
    const faIdx = tianPan[(youTianPos + 1) % 12];
    const faYong = BRANCHES[faIdx];

    // 阴日："柔日先日而后辰" → 初传完成后，中传取日干上神，末传取日支上神
    return {
      faInfo: { zhi: faYong, gan: ZHI_BEN_QI[faYong], type: '昴星(阴日)' },
      zhongInfo: { zhi: siKe.ke1, gan: ZHI_BEN_QI[siKe.ke1], type: '日干上神' },
      moInfo: { zhi: siKe.ke3, gan: ZHI_BEN_QI[siKe.ke3], type: '日支上神' },
      method: '昴星法 → 阴日取天盘酉下神为初传'
    };
  }
}


/**
 * 六、别责法
 *
 * 《大六壬大全》原文：
 * 「四课不全三课备，无遥无克别责例。
 *   刚日干合上头神，柔日支前三合取。」
 *
 * 条件：四课中有重复（即实际上只有三课），且无遥无克。
 * 阳日：取日干五合之神的寄宫的上神为初传
 * 阴日：取日支三合前一辰的上神为初传
 *
 * 中末传：无论阴阳，均以日干上神为三传（初传→日干上→日干上）
 *          即中传和末传都取日干上神（第一课）
 * 
 * 更正《六壬指南》原文：
 * "刚日：取干合之神所寄之宫的上神，中末传用干上神"
 * "柔日：取日支三合前一辰之上神，中末传用干上神"
 * 即：中末传都是日干上神（第一课地支）
 */
function bieZeFa(siKe, dayStem, dayBranch, tianPan) {
  const yy = GAN_YIN_YANG[dayStem];
  const ke1Zhi = siKe.ke1; // 日干上神（第一课）

  let faYong;
  if (yy === '阳') {
    // 取日干五合之神的寄宫上神
    const heStem = GAN_HE[dayStem];
    const heJiGong = GAN_JI_GONG[heStem];
    const heJiGongIdx = BRANCHES.indexOf(heJiGong);
    faYong = BRANCHES[tianPan[heJiGongIdx]];

    return {
      faInfo: { zhi: faYong, gan: ZHI_BEN_QI[faYong], type: '别责(阳日)' },
      zhongInfo: { zhi: ke1Zhi, gan: ZHI_BEN_QI[ke1Zhi], type: '日干上神' },
      moInfo: { zhi: ke1Zhi, gan: ZHI_BEN_QI[ke1Zhi], type: '日干上神' },
      method: `别责法 → 阳日，取${dayStem}合${heStem}寄宫上神为初传`
    };
  } else {
    // 取日支三合前一辰的上神为初传
    const sanHePrev = getSanHePrev(dayBranch);
    const sanHePrevIdx = BRANCHES.indexOf(sanHePrev);
    faYong = BRANCHES[tianPan[sanHePrevIdx]];

    return {
      faInfo: { zhi: faYong, gan: ZHI_BEN_QI[faYong], type: '别责(阴日)' },
      zhongInfo: { zhi: ke1Zhi, gan: ZHI_BEN_QI[ke1Zhi], type: '日干上神' },
      moInfo: { zhi: ke1Zhi, gan: ZHI_BEN_QI[ke1Zhi], type: '日干上神' },
      method: `别责法 → 阴日，取日支${dayBranch}三合前一辰${sanHePrev}上神为初传`
    };
  }
}


/**
 * 七、八专法
 *
 * 《大六壬大全》原文：
 * 「两课无克号八专，阳日日阳顺行三。
 *   阴日辰阴逆三位，中末总向日上眠。」
 *
 * 条件：日干支同位（日干寄宫等于日支），四课只有两课不同。
 * 阳日：初传取日干上神顺数三位（日干阳神顺数三）
 * 阴日：初传取日支上神逆数三位
 * 中末传：都用日干上神
 */
function baZhuanFa(siKe, dayStem, dayBranch, tianPan) {
  const yy = GAN_YIN_YANG[dayStem];
  const ke1Idx = BRANCHES.indexOf(siKe.ke1);
  const ke3Idx = BRANCHES.indexOf(siKe.ke3);

  let faYong;
  if (yy === '阳') {
    // 阳日：日干上神顺行三位
    const faIdx = (ke1Idx + 3) % 12;
    faYong = BRANCHES[faIdx];
  } else {
    // 阴日：日支上神逆行三位
    const faIdx = (ke3Idx - 3 + 12) % 12;
    faYong = BRANCHES[faIdx];
  }

  return {
    faInfo: { zhi: faYong, gan: ZHI_BEN_QI[faYong], type: '八专' },
    zhongInfo: { zhi: siKe.ke1, gan: ZHI_BEN_QI[siKe.ke1], type: '日干上神' },
    moInfo: { zhi: siKe.ke1, gan: ZHI_BEN_QI[siKe.ke1], type: '日干上神' },
    method: `八专法 → ${yy}日，取${yy==='阳'?'日干上神顺三位':'日支上神逆三位'}为初传`
  };
}


/**
 * 八、伏吟法
 *
 * 《大六壬大全》原文：
 * 「伏吟之课有克者，仍以克处为初传。」
 *
 * 伏吟：天地盘同位（天盘不动 = tianPan[i] === i for all i）。
 * ① 有克：正常取贼克（自任、自信课）
 * ② 无克：阳日取日干上神（即日干寄宫本身），阴日取日支上神
 *   中传取初传之刑，末传取中传之刑。
 */
function fuYinFa(siKe, dayStem, dayBranchIdx, tianPan) {
  const yy = GAN_YIN_YANG[dayStem];
  const dayBranch = BRANCHES[dayBranchIdx];

  // 在伏吟中，四课的上神即是地盘本身
  // 先检查是否有克
  // 在伏吟中，日干上神=日干寄宫，日支上神=日支
  // 天盘神=地盘神（因为天地同位）

  // 第一课：jiGong上神=jiGong（天盘不动）
  const jiGong = GAN_JI_GONG[dayStem];
  // 第三课：日支上神=日支
  // 检查是否有贼克
  const ganKe = [
    { zhi: jiGong, gan: ZHI_BEN_QI[jiGong], label: '第一课' },
    { zhi: jiGong, gan: ZHI_BEN_QI[jiGong], label: '第二课' },
    { zhi: dayBranch, gan: ZHI_BEN_QI[dayBranch], label: '第三课' },
    { zhi: dayBranch, gan: ZHI_BEN_QI[dayBranch], label: '第四课' }
  ];

  let zeKeCandidates = [];
  for (const k of ganKe) {
    const ganWx = GAN_WX[k.gan];
    const zhiWx = ZHI_WX[k.zhi];
    if (wxKe(zhiWx, ganWx)) {
      zeKeCandidates.push({ ...k, type: '下克上(贼)' });
    } else if (wxKe(ganWx, zhiWx)) {
      zeKeCandidates.push({ ...k, type: '上克下(克)' });
    }
  }

  if (zeKeCandidates.length > 0) {
    // 有克，取第一候选
    const faYong = zeKeCandidates[0];
    // 中传取初传之刑，末传取中传之刑
    const xingOfFa = getXing(faYong.zhi);
    const xingOfZhong = getXing(xingOfFa);

    return {
      faInfo: { zhi: faYong.zhi, gan: ZHI_BEN_QI[faYong.zhi], type: `伏吟(${faYong.type})` },
      zhongInfo: { zhi: xingOfFa, gan: ZHI_BEN_QI[xingOfFa], type: '初传之刑' },
      moInfo: { zhi: xingOfZhong, gan: ZHI_BEN_QI[xingOfZhong], type: '中传之刑' },
      method: `伏吟法 → 有克，${faYong.type}为初传，刑为中末传`
    };
  }

  // 无克：阳日取日干上神，阴日取日支上神
  if (yy === '阳') {
    // 日干上神 = jiGong（伏吟时天地同位）
    const faYong = jiGong;
    const xingOfFa = getXing(faYong);
    const xingOfZhong = getXing(xingOfFa);

    return {
      faInfo: { zhi: faYong, gan: ZHI_BEN_QI[faYong], type: '伏吟(阳日自任)' },
      zhongInfo: { zhi: xingOfFa, gan: ZHI_BEN_QI[xingOfFa], type: '初传之刑' },
      moInfo: { zhi: xingOfZhong, gan: ZHI_BEN_QI[xingOfZhong], type: '中传之刑' },
      method: '伏吟法 → 无克，阳日自任课，取日干上神为初传'
    };
  } else {
    // 阴日取日支上神
    const faYong = dayBranch;
    const xingOfFa = getXing(faYong);
    const xingOfZhong = getXing(xingOfFa);

    return {
      faInfo: { zhi: faYong, gan: ZHI_BEN_QI[faYong], type: '伏吟(阴日自信)' },
      zhongInfo: { zhi: xingOfFa, gan: ZHI_BEN_QI[xingOfFa], type: '初传之刑' },
      moInfo: { zhi: xingOfZhong, gan: ZHI_BEN_QI[xingOfZhong], type: '中传之刑' },
      method: '伏吟法 → 无克，阴日自信课，取日支上神为初传'
    };
  }
}

/** 地支相刑 — 「子卯刑、寅巳申刑、丑戌未刑、辰午酉亥自刑」 */
function getXing(branch) {
  const xingMap = {
    '子':'卯','卯':'子',
    '寅':'巳','巳':'申','申':'寅',
    '丑':'戌','戌':'未','未':'丑',
    '辰':'辰','午':'午','酉':'酉','亥':'亥' // 自刑
  };
  return xingMap[branch] || branch;
}


/**
 * 九、反吟法
 *
 * 《大六壬大全》原文：
 * 「反吟有克亦为初，无克井栏丑未图。」
 *
 * 反吟：天地盘对冲（tianPan[i] = (i+6)%12 for all i）。
 * ① 有克：正常取贼克
 * ② 无克：取日支驿马为初传 → 「井栏格」
 *   日支驿马：寅午戌马在申，申子辰马在寅，巳酉丑马在亥，亥卯未马在巳
 *   中末传取日支上神
 */
function fanYinFa(siKe, dayStem, dayBranchIdx) {
  const yy = GAN_YIN_YANG[dayStem];
  const dayBranch = BRANCHES[dayBranchIdx];

  // 反吟时，天盘与地盘相冲，四课的上神是冲位
  // 先检查是否有克
  // 第一课上神 = 日干寄宫的对冲位
  const jiGong = GAN_JI_GONG[dayStem];
  const jiGongIdx = BRANCHES.indexOf(jiGong);
  const ke1 = BRANCHES[(jiGongIdx + 6) % 12]; // 对冲位
  const ke2 = BRANCHES[(BRANCHES.indexOf(ke1) + 6) % 12]; // 再冲回来=jiGong
  const ke3 = BRANCHES[(dayBranchIdx + 6) % 12];
  const ke4 = BRANCHES[(BRANCHES.indexOf(ke3) + 6) % 12];

  const ganKe = [
    { zhi: ke1, gan: ZHI_BEN_QI[ke1], label: '第一课' },
    { zhi: ke2, gan: ZHI_BEN_QI[ke2], label: '第二课' },
    { zhi: ke3, gan: ZHI_BEN_QI[ke3], label: '第三课' },
    { zhi: ke4, gan: ZHI_BEN_QI[ke4], label: '第四课' }
  ];

  let zeKeCandidates = [];
  for (const k of ganKe) {
    const ganWx = GAN_WX[k.gan];
    const zhiWx = ZHI_WX[k.zhi];
    if (wxKe(zhiWx, ganWx)) {
      zeKeCandidates.push({ ...k, type: '下克上(贼)' });
    } else if (wxKe(ganWx, zhiWx)) {
      zeKeCandidates.push({ ...k, type: '上克下(克)' });
    }
  }

  if (zeKeCandidates.length > 0) {
    const faYong = zeKeCandidates[0];
    return {
      faInfo: { zhi: faYong.zhi, gan: ZHI_BEN_QI[faYong.zhi], type: `反吟(${faYong.type})` },
      zhongInfo: { zhi: ke3, gan: ZHI_BEN_QI[ke3], type: '日支上神' },
      moInfo: { zhi: ke1, gan: ZHI_BEN_QI[ke1], type: '日干上神' },
      method: `反吟法 → 有克，${faYong.type}为初传`
    };
  }

  // 无克：井栏格 → 取日支驿马为初传
  const yiMa = getYiMa(dayBranch);
  return {
    faInfo: { zhi: yiMa, gan: ZHI_BEN_QI[yiMa], type: '反吟(井栏格)' },
    zhongInfo: { zhi: ke3, gan: ZHI_BEN_QI[ke3], type: '日支上神' },
    moInfo: { zhi: ke1, gan: ZHI_BEN_QI[ke1], type: '日干上神' },
    method: `反吟法 → 无克，井栏格，取日支${dayBranch}驿马${yiMa}为初传`
  };
}

/** 驿马查法 — 「寅午戌马在申，申子辰马在寅，巳酉丑马在亥，亥卯未马在巳」 */
function getYiMa(branch) {
  const yiMaMap = {
    '寅':'申','午':'申','戌':'申',
    '申':'寅','子':'寅','辰':'寅',
    '巳':'亥','酉':'亥','丑':'亥',
    '亥':'巳','卯':'巳','未':'巳'
  };
  return yiMaMap[branch] || '寅';
}


/**
 * 判断是否为八专课（日干支同位）
 */
function isBaZhuan(dayStem, dayBranch) {
  const jiGong = GAN_JI_GONG[dayStem];
  return jiGong === dayBranch;
}

/**
 * 判断是否为伏吟（天地盘同位）
 */
function isFuYin(tianPan, hourBranchIdx) {
  // 伏吟模式：天盘[i] === (yueJiangIdx - hourBranchIdx + i + 12) % 12
  // 当 yueJiangIdx === hourBranchIdx 时，天盘不动
  for (let i = 0; i < 12; i++) {
    if (tianPan[i] !== i) return false;
  }
  return true;
}

/**
 * 判断是否为反吟（天地盘对冲）
 */
function isFanYin(tianPan) {
  for (let i = 0; i < 12; i++) {
    if (tianPan[i] !== (i + 6) % 12) return false;
  }
  return true;
}

/**
 * 判断四课是否有重复（四课不全，用于别责法）
 * 四课有重复 = 实际只有3课不同
 */
function isSiKeBuQuan(siKe) {
  const zhis = [siKe.ke1, siKe.ke2, siKe.ke3, siKe.ke4];
  const uniqueSet = new Set(zhis);
  return uniqueSet.size < 4;
}


/**
 * ══════════════════════════════════════════════════
 * 三传主入口 — 九宗门递序
 * ══════════════════════════════════════════════════
 *
 * 严格按照《大六壬大全》原文递序：
 * 「克贼法为先，比用涉害次，遥克昴星后，别责八专末。」
 * 
 * 九宗门递序：
 *   1. 贼克法
 *   2. 比用法（有多个贼/克时）
 *   3. 涉害法（比用后仍有多个时）
 *   4. 中末传计算（固定规则）
 *   5-9. 特殊课体处理
 */
function buildSanChuan(siKe, dayStem, dayStemIdx, dayBranchIdx, tianPan) {
  const dayBranch = BRANCHES[dayBranchIdx];

  // ── 特殊课体优先判断 ──
  // 5. 伏吟（天地盘同位）
  if (isFuYin(tianPan)) {
    return fuYinFa(siKe, dayStem, dayBranchIdx, tianPan);
  }

  // 6. 反吟（天地盘对冲）
  if (isFanYin(tianPan)) {
    return fanYinFa(siKe, dayStem, dayBranchIdx);
  }

  // 7. 八专（日干支同位）
  if (isBaZhuan(dayStem, dayBranch)) {
    // 八专课中有克正常取，无克用八专法
    // 但八专课四课只有两课不同，可能仍有克
    const zeKeResult = zeKeFa(siKe, dayStem);
    if (zeKeResult && zeKeResult.candidates.length === 1 &&
        !zeKeResult.method.includes('需比用') && !zeKeResult.method.includes('需涉害')) {
      // 有单一贼/克 → 正常取
      const fa = zeKeResult.candidates[0];
      return {
        faInfo: fa,
        zhongInfo: { zhi: siKe.ke1, gan: ZHI_BEN_QI[siKe.ke1], type: '日干上神' },
        moInfo: { zhi: siKe.ke1, gan: ZHI_BEN_QI[siKe.ke1], type: '日干上神' },
        method: `八专课有克 → ${fa.type}为初传`
      };
    }
    if (zeKeResult && zeKeResult.method.includes('需比用')) {
      // 多课克，取比用
      const biYong = biYongFa(zeKeResult.candidates, dayStem);
      if (biYong.candidates.length === 1) {
        const fa = biYong.candidates[0];
        return {
          faInfo: fa,
          zhongInfo: { zhi: siKe.ke1, gan: ZHI_BEN_QI[siKe.ke1], type: '日干上神' },
          moInfo: { zhi: siKe.ke1, gan: ZHI_BEN_QI[siKe.ke1], type: '日干上神' },
          method: `八专课有克多课 → ${biYong.method}`
        };
      }
    }
    // 八专无克 → 用八专法
    return baZhuanFa(siKe, dayStem, dayBranch, tianPan);
  }

  // 4. 别责（四课不全 + 无遥无克）— 在贼克/遥克之后判断
  //    我们在主流程中稍后处理

  // ── 1. 贼克法 ──
  const zeKeResult = zeKeFa(siKe, dayStem);
  if (zeKeResult) {
    let finalCandidate;
    if (zeKeResult.candidates.length === 1) {
      finalCandidate = zeKeResult.candidates[0];
    } else {
      // ── 2. 比用法 ──
      const biYongResult = biYongFa(zeKeResult.candidates, dayStem);
      if (biYongResult.candidates.length === 1) {
        finalCandidate = biYongResult.candidates[0];
        zeKeResult.method = biYongResult.method;
      } else {
        // ── 3. 涉害法 ──
        const sheHaiResult = sheHaiFa(biYongResult.candidates, dayStem, tianPan, siKe);
        finalCandidate = sheHaiResult.candidates[0];
        zeKeResult.method = sheHaiResult.method;
      }
    }

    // 中末传计算（通用规则）
    return computeSanChuanFromFa(finalCandidate, siKe, tianPan, zeKeResult.method);
  }

  // ── 4. 遥克法 ──
  const yaoKeResult = yaoKeFa(siKe, dayStem);
  if (yaoKeResult) {
    const fa = yaoKeResult.candidates[0];
    return computeSanChuanFromFa(fa, siKe, tianPan, yaoKeResult.method);
  }

  // ── 5. 别责法（四课不全） ──
  if (isSiKeBuQuan(siKe)) {
    return bieZeFa(siKe, dayStem, dayBranch, tianPan);
  }

  // ── 6. 昴星法 ──
  return maoXingFa(siKe, dayStem, dayBranchIdx, tianPan);
}

/**
 * 通用中末传计算（贼克/比用/涉害/遥克共用）
 *
 * 规则：
 *   初传确定后，
 *   中传 = 初传之支在地盘上的天盘上神
 *   末传 = 中传之支在地盘上的天盘上神
 *
 * 即：从天盘上找初传的地盘位置，取其天盘上神为中传，依次推末传。
 * 
 * 实际上对于普通的贼克法四课三传：
 *   初传就是候选课的zhi（地支）
 *   中传 = 初传在地盘上的天盘上神 → tianPan[初传的index]
 *   末传 = 中传在地盘上的天盘上神 → tianPan[中传的index]
 */
function computeSanChuanFromFa(faInfo, siKe, tianPan, method) {
  const faIdx = BRANCHES.indexOf(faInfo.zhi);
  const zhongIdx = tianPan[faIdx];
  const moIdx = tianPan[zhongIdx];

  return {
    faInfo: { ...faInfo, zhi: faInfo.zhi },
    zhongInfo: { zhi: BRANCHES[zhongIdx], gan: ZHI_BEN_QI[BRANCHES[zhongIdx]], type: '中传' },
    moInfo: { zhi: BRANCHES[moIdx], gan: ZHI_BEN_QI[BRANCHES[moIdx]], type: '末传' },
    method
  };
}


// ═══════════════════════════════════════════════════════════════
// 十二天将分布
// ═══════════════════════════════════════════════════════════════

/**
 * 贵人诀 — 《大六壬大全》原文：
 * 「甲戊庚牛羊(丑未)，乙己鼠猴乡(子申)，
 *   丙丁猪鸡位(亥酉)，壬癸兔蛇藏(卯巳)，
 *   六辛逢马虎(午寅)，此是贵人方。」
 */
const GUIREN_DAY = {
  0:'丑', 1:'子', 2:'亥', 3:'酉', 4:'丑',
  5:'子', 6:'丑', 7:'午', 8:'卯', 9:'巳'
};

const GUIREN_NIGHT = {
  0:'未', 1:'申', 2:'酉', 3:'亥', 4:'未',
  5:'申', 6:'未', 7:'寅', 8:'巳', 9:'卯'
};

/** 十二天将名称（贵人治事顺逆） */
const TIAN_JIANG_NAMES = [
  '贵人','螣蛇','朱雀','六合','勾陈','青龙',
  '天空','白虎','太常','玄武','太阴','天后'
];

/** 十二天将吉凶 */
const TIAN_JIANG_NATURE = {
  '贵人':'大吉','螣蛇':'凶','朱雀':'凶','六合':'吉',
  '勾陈':'凶','青龙':'大吉','天空':'凶','白虎':'大凶',
  '太常':'吉','玄武':'凶','太阴':'吉','天后':'吉'
};

/**
 * 布十二天将
 *
 * 《大六壬大全》原文：
 * 「贵人在亥子丑寅卯辰则顺行，在巳午未申酉戌则逆行。」
 *
 * 昼夜贵人：
 *   昼占（卯至申时/5-15点）= 用昼贵人
 *   夜占（酉至寅时/17-3点）= 用夜贵人
 *
 * 修正：实际时辰范围
 *   昼：卯(5)、辰(7)、巳(9)、午(11)、未(13)、申(15)
 *   夜：酉(17)、戌(19)、亥(21)、子(23)、丑(1)、寅(3)
 *   即 hourBranchIdx: [4,5,6,7,8,9] = 昼
 *      hourBranchIdx: [10,11,0,1,2,3] = 夜
 *
 * @param {number} dayStemIdx - 日干索引
 * @param {number} hourBranchIdx - 占时辰的地支索引 (0=子...11=亥)
 * @returns {Object} 天将分布
 */
function buildTianJiang(dayStemIdx, hourBranchIdx) {
  // 昼夜判断
  // 卯(4)至申(9)为昼，酉(10)至寅(3)为夜
  let isDay = false;
  if (hourBranchIdx >= 4 && hourBranchIdx <= 9) {
    isDay = true;
  }

  const guirenZhi = isDay ? GUIREN_DAY[dayStemIdx] : GUIREN_NIGHT[dayStemIdx];
  const guirenIdx = BRANCHES.indexOf(guirenZhi);

  // 顺逆判断
  // 「贵人在亥子丑寅卯辰则顺行，在巳午未申酉戌则逆行」
  // 亥(11),子(0),丑(1),寅(2),卯(3),辰(4) → 顺
  // 巳(5),午(6),未(7),申(8),酉(9),戌(10) → 逆
  let shunPai = true;
  if (guirenIdx >= 5 && guirenIdx <= 10) {
    shunPai = false;
  }

  // 分布到十二地支
  const fenbu = {};
  for (let i = 0; i < 12; i++) {
    const zhi = BRANCHES[i];
    let offset;
    if (shunPai) {
      offset = (i - guirenIdx + 12) % 12;
    } else {
      offset = (guirenIdx - i + 12) % 12;
    }
    const godName = TIAN_JIANG_NAMES[offset % 12];
    fenbu[zhi] = {
      name: godName,
      nature: TIAN_JIANG_NATURE[godName] || '平',
      index: offset % 12
    };
  }

  return {
    fenbu,
    guirenZhi,
    guirenIdx,
    shunPai,
    isDay,
    guirenType: isDay ? '昼贵' : '夜贵'
  };
}


// ═══════════════════════════════════════════════════════════════
// 课体判定
// ═══════════════════════════════════════════════════════════════

/**
 * 课体分类 — 按《大六壬大全》六十四课体精简判定
 *
 * 主要课体：
 *   元首、重审、知一、涉害、遥克、昴星、
 *   别责、八专、伏吟、反吟
 */
function classifyKeTi(sanChuan, siKe, dayStem, tianPan) {
  const method = sanChuan.method || '';
  const faType = sanChuan.faInfo?.type || '';

  // 按方法分类
  if (method.includes('伏吟')) {
    if (faType.includes('下克上')) return { name: '伏吟(自任)', category: '伏吟', jiXiong: '中平', desc: '天地盘同位，自任之课。克处发用，刑为传。' };
    if (faType.includes('上克下')) return { name: '伏吟(自信)', category: '伏吟', jiXiong: '中平', desc: '天地盘同位，自信之课。克处发用，刑为传。' };
    if (faType.includes('自任')) return { name: '伏吟(自任)', category: '伏吟', jiXiong: '中平', desc: '阳日伏吟无克，自任课。日干上神发用，刑为中末。' };
    return { name: '伏吟(自信)', category: '伏吟', jiXiong: '中平', desc: '阴日伏吟无克，自信课。日支上神发用，刑为中末。' };
  }

  if (method.includes('反吟')) {
    if (faType.includes('下克上') || faType.includes('上克下')) return { name: '反吟', category: '反吟', jiXiong: '凶', desc: '天地盘对冲，反复无常之课。有克则取克。' };
    return { name: '反吟(井栏)', category: '反吟', jiXiong: '凶', desc: '天地对冲无克，井栏格。驿马为初传。' };
  }

  if (method.includes('八专')) return { name: '八专', category: '八专', jiXiong: '中平', desc: '日干支同位，八专之课。两课无克取顺逆。' };

  if (method.includes('别责')) return { name: '别责', category: '别责', jiXiong: '中平', desc: '四课不全，别责之课。另求他方为用。' };

  if (method.includes('昴星')) return { name: '昴星', category: '昴星', jiXiong: '凶', desc: '四课无克无遥，昴星之课。阳仰阴俯酉位中。' };

  if (faType.includes('下克上(贼)') && !method.includes('涉害') && !method.includes('多') && !method.includes('比用')) {
    return { name: '重审', category: '贼克', jiXiong: '吉', desc: '下克上发用，重审之课。以下制上，需再三审查。' };
  }

  if (faType.includes('上克下(克)') && !method.includes('涉害') && !method.includes('多') && !method.includes('比用')) {
    return { name: '元首', category: '贼克', jiXiong: '大吉', desc: '上克下发用，元首之课。六壬第一吉课，万事亨通。' };
  }

  if (method.includes('涉害')) {
    if (faType.includes('下克上')) return { name: '涉害(见机)', category: '涉害', jiXiong: '中平', desc: '多课下克上，涉害取最深者。事有机变，察微知著。' };
    return { name: '涉害', category: '涉害', jiXiong: '中平', desc: '多课克贼，涉害比量深浅。事需深入分析。' };
  }

  if (method.includes('比用')) return { name: '知一', category: '贼克', jiXiong: '小吉', desc: '多课贼克，比用取同气。多中选择，知一而用。' };

  if (method.includes('遥克')) return { name: '遥克', category: '遥克', jiXiong: '凶', desc: '四课无克，遥相克之。远事相关，隔阂难通。' };

  if (faType.includes('下克上')) return { name: '重审', category: '贼克', jiXiong: '吉', desc: '下克上发用，重审之课。' };
  if (faType.includes('上克下')) return { name: '元首', category: '贼克', jiXiong: '大吉', desc: '上克下发用，元首之课。' };

  return { name: '通用课', category: '通用', jiXiong: '中平', desc: '通用课体。' };
}


// ═══════════════════════════════════════════════════════════════
// 三传生克分析
// ═══════════════════════════════════════════════════════════════

function analyzeSanChuanKe(sanChuan) {
  const fa = sanChuan.faInfo.zhi;
  const zhong = sanChuan.zhongInfo.zhi;
  const mo = sanChuan.moInfo.zhi;

  const faWx = ZHI_WX[fa];
  const zhongWx = ZHI_WX[zhong];
  const moWx = ZHI_WX[mo];

  const relations = [];

  // 初中关系
  if (wxSheng(faWx, zhongWx)) relations.push('初生中→事有推动力');
  else if (wxSheng(zhongWx, faWx)) relations.push('中生初→后续助力');
  else if (wxKe(faWx, zhongWx)) relations.push('初克中→中途遇阻');
  else if (wxKe(zhongWx, faWx)) relations.push('中克初→开端受阻');
  else relations.push('初中比和→平稳推进');

  // 中末关系
  if (wxSheng(zhongWx, moWx)) relations.push('中生末→结局向好');
  else if (wxSheng(moWx, zhongWx)) relations.push('末生中→回环之力');
  else if (wxKe(zhongWx, moWx)) relations.push('中克末→结局有阻');
  else if (wxKe(moWx, zhongWx)) relations.push('末克中→改变中期');
  else relations.push('中末比和→结局平稳');

  // 初末关系
  if (wxSheng(faWx, moWx)) relations.push('初生末→始终顺利(大吉)');
  else if (wxSheng(moWx, faWx)) relations.push('末生初→循环反复');
  else if (wxKe(faWx, moWx)) relations.push('初克末→难善终');
  else if (wxKe(moWx, faWx)) relations.push('末克初→结果相反');

  return relations;
}


// ═══════════════════════════════════════════════════════════════
// 神煞系统（精简版）
// ═══════════════════════════════════════════════════════════════

function buildShenSha(dayStemIdx, dayBranchIdx, month) {
  const dayStem = STEMS[dayStemIdx];
  const dayBranch = BRANCHES[dayBranchIdx];
  const result = [];

  // 天德
  const tiandeMap = {1:'亥',2:'申',3:'亥',4:'戌',5:'亥',6:'寅',7:'丑',8:'寅',9:'巳',10:'辰',11:'巳',12:'申'};
  if (tiandeMap[month]) result.push({name:'天德',nature:'大吉',zhi:tiandeMap[month]});

  // 月德
  const yuedeMap = {1:'巳',2:'寅',3:'亥',4:'申',5:'巳',6:'寅',7:'亥',8:'申',9:'巳',10:'寅',11:'亥',12:'申'};
  if (yuedeMap[month]) result.push({name:'月德',nature:'大吉',zhi:yuedeMap[month]});

  // 天喜
  const tianxiMap = {1:'戌',2:'亥',3:'子',4:'丑',5:'寅',6:'卯',7:'辰',8:'巳',9:'午',10:'未',11:'申',12:'酉'};
  if (tianxiMap[month]) result.push({name:'天喜',nature:'吉',zhi:tianxiMap[month]});

  // 驿马
  const yima = getYiMa(dayBranch);
  result.push({name:'驿马',nature:'动',zhi:yima});

  // 桃花
  const taohuaMap = {'寅':'卯','午':'卯','戌':'卯','申':'酉','子':'酉','辰':'酉','巳':'午','酉':'午','丑':'午','亥':'子','卯':'子','未':'子'};
  if (taohuaMap[dayBranch]) result.push({name:'桃花',nature:'平',zhi:taohuaMap[dayBranch]});

  // 华盖
  const huagaiMap = {'寅':'戌','午':'戌','戌':'戌','申':'辰','子':'辰','辰':'辰','巳':'丑','酉':'丑','丑':'丑','亥':'未','卯':'未','未':'未'};
  if (huagaiMap[dayBranch]) result.push({name:'华盖',nature:'平',zhi:huagaiMap[dayBranch]});

  // 将星
  const jiangxMap = {'寅':'午','午':'午','戌':'午','申':'子','子':'子','辰':'子','巳':'酉','酉':'酉','丑':'酉','亥':'卯','卯':'卯','未':'卯'};
  if (jiangxMap[dayBranch]) result.push({name:'将星',nature:'吉',zhi:jiangxMap[dayBranch]});

  return result;
}


// ═══════════════════════════════════════════════════════════════
// 主入口函数：完整大六壬排盘
// ═══════════════════════════════════════════════════════════════

/**
 * 大六壬完整排盘
 *
 * @param {number} year - 公历年份
 * @param {number} month - 公历月份 (1-12)
 * @param {number} day - 公历日期 (1-31)
 * @param {number} hour - 时辰 (0-23)
 * @returns {Object} 完整的大六壬课式数据
 */
function computeLiuRen(year, month, day, hour) {
  // ── 第一步：定四柱 ──
  const riGanZhi = getDayStemBranch(year, month, day);
  const dayStemIdx = riGanZhi.stemIdx;
  const dayBranchIdx = riGanZhi.branchIdx;
  const dayStem = riGanZhi.stem;
  const dayBranch = riGanZhi.branch;
  const hourBr = getHourBranch(hour);
  const hourBranchIdx = hourBr.idx;
  const hourBranch = hourBr.branch;
  const hourStemIdx = getHourStem(dayStemIdx, hourBranchIdx);
  const hourStem = STEMS[hourStemIdx];

  // ── 第二步：定月将（按中气换将） ──
  const yueJiang = getYueJiang(year, month, day);

  // ── 第三步：布天盘（月将加时） ──
  const tianPan = buildTianPan(yueJiang.idx, hourBranchIdx);

  // ── 第四步：起四课 ──
  const siKe = buildSiKe(dayStemIdx, dayBranchIdx, tianPan);

  // ── 第五步：发三传（九宗门递序） ──
  const sanChuan = buildSanChuan(siKe, dayStem, dayStemIdx, dayBranchIdx, tianPan);

  // ── 布十二天将 ──
  const tianJiang = buildTianJiang(dayStemIdx, hourBranchIdx);

  // ── 课体判定 ──
  const keTi = classifyKeTi(sanChuan, siKe, dayStem, tianPan);

  // ── 三传生克 ──
  const chuanKe = analyzeSanChuanKe(sanChuan);

  // ── 神煞 ──
  const shenSha = buildShenSha(dayStemIdx, dayBranchIdx, month);

  return {
    // 四柱
    year, month, day, hour,
    dayStem, dayStemIdx, dayBranch, dayBranchIdx,
    hourStem, hourStemIdx, hourBranch, hourBranchIdx,
    // 月将
    yueJiang,
    // 天地盘
    tianPan, // tianPan[i] = 地盘位置i上的天盘地支索引
    // 四课
    siKe,
    // 三传
    sanChuan,
    // 天将
    tianJiang,
    // 课体
    keTi,
    // 三传生克
    chuanKe,
    // 神煞
    shenSha
  };
}

/**
 * 格式化天盘为可读形式
 */
function formatTianPan(tianPan) {
  const result = {};
  for (let i = 0; i < 12; i++) {
    result[BRANCHES[i]] = BRANCHES[tianPan[i]];
  }
  return result;
}

/**
 * 格式化三传为可读形式
 */
function formatSanChuan(sanChuan) {
  return {
    method: sanChuan.method,
    初传: sanChuan.faInfo.zhi,
    初传天干: sanChuan.faInfo.gan,
    初传类型: sanChuan.faInfo.type,
    中传: sanChuan.zhongInfo.zhi,
    中传天干: sanChuan.zhongInfo.gan,
    末传: sanChuan.moInfo.zhi,
    末传天干: sanChuan.moInfo.gan
  };
}

/**
 * 生成诊断报告
 */
function generateReport(result) {
  const lines = [];
  lines.push('══════ 大六壬排盘报告 V3 ══════');
  lines.push('');
  lines.push(`【四柱】${result.year}年${result.month}月${result.day}日 ${result.hourStem}${result.hourBranch}时`);
  lines.push(`  日干支: ${result.dayStem}${result.dayBranch}  (日干${result.dayStem}=${GAN_WX[result.dayStem]}, 日支${result.dayBranch}=${ZHI_WX[result.dayBranch]})`);
  lines.push(`  时干支: ${result.hourStem}${result.hourBranch}`);
  lines.push('');
  lines.push(`【月将】${result.yueJiang.branch}(${result.yueJiang.name}) — 中气${result.yueJiang.zhongQi}后`);
  lines.push('');
  lines.push(`【天地盘】月将${result.yueJiang.branch}加时${result.hourBranch}`);
  const tp = formatTianPan(result.tianPan);
  for (const [di, tian] of Object.entries(tp)) {
    lines.push(`  地盘${di} → 天盘${tian}`);
  }
  lines.push('');
  lines.push(`【四课】`);
  lines.push(`  第一课: ${result.siKe.ke1}上${result.siKe.ke1Gan} (${ZHI_WX[result.siKe.ke1]})`);
  lines.push(`  第二课: ${result.siKe.ke2}上${result.siKe.ke2Gan} (${ZHI_WX[result.siKe.ke2]})`);
  lines.push(`  第三课: ${result.siKe.ke3}上${result.siKe.ke3Gan} (${ZHI_WX[result.siKe.ke3]})`);
  lines.push(`  第四课: ${result.siKe.ke4}上${result.siKe.ke4Gan} (${ZHI_WX[result.siKe.ke4]})`);
  lines.push('');
  lines.push(`【三传】${result.sanChuan.method}`);
  lines.push(`  初传: ${result.sanChuan.faInfo.zhi} (${ZHI_WX[result.sanChuan.faInfo.zhi]}) [${result.sanChuan.faInfo.type}]`);
  lines.push(`  中传: ${result.sanChuan.zhongInfo.zhi} (${ZHI_WX[result.sanChuan.zhongInfo.zhi]})`);
  lines.push(`  末传: ${result.sanChuan.moInfo.zhi} (${ZHI_WX[result.sanChuan.moInfo.zhi]})`);
  lines.push('');
  lines.push(`【课体】${result.keTi.name} (${result.keTi.jiXiong}) — ${result.keTi.desc}`);
  lines.push('');
  lines.push(`【十二天将】贵人: ${result.tianJiang.guirenZhi} (${result.tianJiang.guirenType}), ${result.tianJiang.shunPai?'顺排':'逆排'}`);
  for (let i = 0; i < 12; i++) {
    const zhi = BRANCHES[i];
    const god = result.tianJiang.fenbu[zhi];
    lines.push(`  地盘${zhi}: ${god.name}(${god.nature})`);
  }
  lines.push('');
  lines.push(`【三传生克】`);
  for (const r of result.chuanKe) {
    lines.push(`  ${r}`);
  }
  return lines.join('\n');
}

// ═══════════════════════════════════════════════════════════════
// R2.10: 克应分析 + 本命行年法
// ═══════════════════════════════════════════════════════════════

/**
 * 克应分析 — 根据三传与占时关系判断应期
 *
 * 《大六壬大全》:「初传与占时相冲，应期在冲日；相合，应期在合日。」
 * 《六壬指南》:「初传旺则应近，休则应远。」
 *
 * @param {object} sanChuan - 三传对象（含 faInfo/zhongInfo/moInfo）
 * @param {string} zhanShi - 占时地支
 * @returns {object} 应期分析结果
 */
function analyzeKeying(sanChuan, zhanShi) {
  var faZhi = sanChuan.faInfo ? sanChuan.faInfo.zhi : '';
  var zhongZhi = sanChuan.zhongInfo ? sanChuan.zhongInfo.zhi : '';
  var moZhi = sanChuan.moInfo ? sanChuan.moInfo.zhi : '';
  var faWX = ZHI_WX[faZhi] || '';

  // 地支相冲表
  var CHONG_MAP = {'子':'午','午':'子','丑':'未','未':'丑','寅':'申','申':'寅','卯':'酉','酉':'卯','辰':'戌','戌':'辰','巳':'亥','亥':'巳'};
  // 地支相合表
  var HE_MAP = {'子':'丑','丑':'子','寅':'亥','亥':'寅','卯':'戌','戌':'卯','辰':'酉','酉':'辰','巳':'申','申':'巳','午':'未','未':'午'};

  var yingQi = [];
  var yingQiDesc = '';

  // 1. 初传与占时的关系
  if (faZhi && zhanShi) {
    if (CHONG_MAP[faZhi] === zhanShi) {
      yingQi.push({type:'冲日', zhi: faZhi, desc:'初传' + faZhi + '与占时' + zhanShi + '相冲，应期在' + faZhi + '日或' + zhanShi + '日'});
      yingQiDesc += '初传与占时相冲，应期较快，约在冲日（' + faZhi + '或' + zhanShi + '日）应事。';
    } else if (HE_MAP[faZhi] === zhanShi) {
      yingQi.push({type:'合日', zhi: HE_MAP[faZhi], desc:'初传' + faZhi + '与占时' + zhanShi + '相合，应期在' + HE_MAP[faZhi] + '日'});
      yingQiDesc += '初传与占时相合，应期在合日（' + HE_MAP[faZhi] + '日）应事，事成且久。';
    } else {
      // 无冲无合，看初传本身定应期
      yingQi.push({type:'初传日', zhi: faZhi, desc:'初传' + faZhi + '与占时无冲合，应期在' + faZhi + '日'});
      yingQiDesc += '初传与占时无冲合，应期在初传' + faZhi + '日。';
    }
  }

  // 2. 初传旺衰定远近
  var faWangShuai = '';
  var远近 = '';
  // 判断初传旺衰：看初传五行与占时五行关系
  var shiWX = ZHI_WX[zhanShi] || '';
  if (faWX && shiWX) {
    if (faWX === shiWX) {
      faWangShuai = '旺';
      远近 = '近';
      yingQiDesc += ' 初传旺于占时，应期近——数日内可见。';
    } else if (WX_SHENG[shiWX] === faWX) {
      faWangShuai = '相';
      远近 = '近';
      yingQiDesc += ' 初传相于占时，应期较近——一两周内。';
    } else if (WX_SHENG[faWX] === shiWX) {
      faWangShuai = '休';
      远近 = '远';
      yingQiDesc += ' 初传休于占时，应期较远——月余可见。';
    } else if (WX_KE[faWX] === shiWX) {
      faWangShuai = '囚';
      远近 = '远';
      yingQiDesc += ' 初传囚于占时，应期远——数月之后。';
    } else if (WX_KE[shiWX] === faWX) {
      faWangShuai = '死';
      远近 = '甚远';
      yingQiDesc += ' 初传死于占时，应期甚远或不应。';
    }
  }

  // 3. 末传辅助判断应期
  if (moZhi) {
    yingQi.push({type:'末传日', zhi: moZhi, desc:'末传' + moZhi + '为事之终，亦可作为应期参考'});
  }

  return {
    faZhi: faZhi,
    zhanShi: zhanShi,
    relation: CHONG_MAP[faZhi] === zhanShi ? '冲' : (HE_MAP[faZhi] === zhanShi ? '合' : '无'),
    faWangShuai: faWangShuai,
    远近: 远近,
    yingQi: yingQi,
    desc: yingQiDesc
  };
}

/**
 * 本命行年法 — 计算本命与行年
 *
 * 《大六壬大全》:「本命者，生年支也。行年者，男一岁起丙寅顺行，女一岁起壬申逆行。」
 *
 * @param {number} birthYear - 出生年份（公历）
 * @param {string} sex - 性别（'男' 或 '女'）
 * @returns {object} {benMing, xingNian, xingNianDetail}
 */
function computeBenMing(birthYear, sex) {
  // 十二地支
  var ZHI = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  // 天干
  var GAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];

  // 本命：出生年支
  var benMingIdx = (birthYear - 4) % 12; // 1984年=鼠年(子)=0
  if (benMingIdx < 0) benMingIdx += 12;
  var benMing = ZHI[benMingIdx];

  // 行年：男1岁起丙寅顺行，女1岁起壬申逆行
  var xingNian = '';
  var xingNianDetail = '';
  var currentAge = new Date().getFullYear() - birthYear;

  if (sex === '男' || sex === 'male') {
    // 男1岁=丙寅，顺行
    // 丙=2(索引), 寅=2
    var startGanIdx = 2; // 丙
    var startZhiIdx = 2; // 寅
    var ageOffset = currentAge - 1;
    var ganIdx = (startGanIdx + ageOffset + 10) % 10;
    var zhiIdx = (startZhiIdx + ageOffset + 12) % 12;
    xingNian = GAN[ganIdx] + ZHI[zhiIdx];
    xingNianDetail = '男命行年从1岁起丙寅顺行，今年' + currentAge + '岁，行年为' + xingNian + '。' +
      '行年干支与日辰生克关系可断吉凶：' +
      (WX_SHENG[GAN_WX[GAN[ganIdx]]] === GAN_WX[GAN[ganIdx]] ? '行年五行比和，平顺之年。' :
       '行年' + GAN[ganIdx] + '(' + GAN_WX[GAN[ganIdx]] + ')' +
       '，宜察与日干之生克定吉凶。');
  } else if (sex === '女' || sex === 'female') {
    // 女1岁=壬申，逆行
    // 壬=8(索引), 申=8
    var startGanIdx2 = 8; // 壬
    var startZhiIdx2 = 8; // 申
    var ageOffset2 = currentAge - 1;
    var ganIdx2 = (startGanIdx2 - ageOffset2 + 10 * 100) % 10;
    var zhiIdx2 = (startZhiIdx2 - ageOffset2 + 12 * 100) % 12;
    xingNian = GAN[ganIdx2] + ZHI[zhiIdx2];
    xingNianDetail = '女命行年从1岁起壬申逆行，今年' + currentAge + '岁，行年为' + xingNian + '。' +
      '行年干支与日辰生克关系可断吉凶：' +
      (WX_SHENG[GAN_WX[GAN[ganIdx2]]] === GAN_WX[GAN[ganIdx2]] ? '行年五行比和，平顺之年。' :
       '行年' + GAN[ganIdx2] + '(' + GAN_WX[GAN[ganIdx2]] + ')' +
       '，宜察与日干之生克定吉凶。');
  } else {
    xingNian = '';
    xingNianDetail = '性别未指定，无法计算行年。';
  }

  return {
    benMing: benMing,
    benMingIdx: benMingIdx,
    xingNian: xingNian,
    xingNianDetail: xingNianDetail,
    currentAge: currentAge,
    sex: sex
  };
}

/**
 * R3.4: 六壬·课体格局辨识
 *
 * 辨识常见课体格局并判断吉凶
 *
 * 《大六壬大全》:「课体者，天地盘四课三传之格局也。格局正则事理明，格局变则事理异。」
 *
 * @param {object} sanChuan - 三传对象（含 faInfo/zhongInfo/moInfo）
 * @param {string} zhanShi - 占时地支
 * @param {object} siKe - 四课对象
 * @returns {object} { ketiType, gejuName, luck, description }
 */
function analyzeKetiGeshi(sanChuan, zhanShi, siKe) {
  var faZhi = sanChuan.faInfo ? sanChuan.faInfo.zhi : '';
  var zhongZhi = sanChuan.zhongInfo ? sanChuan.zhongInfo.zhi : '';
  var moZhi = sanChuan.moInfo ? sanChuan.moInfo.zhi : '';

  var faWX = ZHI_WX[faZhi] || '';
  var zhongWX = ZHI_WX[zhongZhi] || '';
  var moWX = ZHI_WX[moZhi] || '';

  // 地支相冲表
  var CHONG = {'子':'午','午':'子','丑':'未','未':'丑','寅':'申','申':'寅','卯':'酉','酉':'卯','辰':'戌','戌':'辰','巳':'亥','亥':'巳'};
  // 地支相合表（六合）
  var LIUHE = {'子':'丑','丑':'子','寅':'亥','亥':'寅','卯':'戌','戌':'卯','辰':'酉','酉':'辰','巳':'申','申':'巳','午':'未','未':'午'};
  // 地支三合局
  var SANHE_JU = [
    {zhi:['寅','午','戌'], ju:'火局'},
    {zhi:['申','子','辰'], ju:'水局'},
    {zhi:['亥','卯','未'], ju:'木局'},
    {zhi:['巳','酉','丑'], ju:'金局'}
  ];
  // 连茹判断：地支顺序相连（子丑寅...）
  var ZHI_ORDER = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

  var matched = [];

  // ═══ 1. 重审课（初传与日辰相同） ═══
  // 初传地支与日支或日干寄宫相同
  // 需要日干信息，但函数签名中无日干，用 siKe.jiGong 代替
  var dayJiGong = siKe && siKe.jiGong ? siKe.jiGong : '';
  if (faZhi && (faZhi === zhanShi || faZhi === dayJiGong)) {
    matched.push({
      ketiType: '重审课',
      gejuName: '重审',
      luck: '中平',
      description: '初传' + faZhi + '与日辰(寄宫' + dayJiGong + ')相同，为重审课。'+
        '重审者，再三审查之意。事有反复，需谨慎对待，不可草率决定。'+
        '占事主延迟、复查；占人主反复不定。宜三思而后行。'
    });
  }

  // ═══ 2. 元首课（初传为日干之寄宫） ═══
  if (faZhi && dayJiGong && faZhi === dayJiGong) {
    matched.push({
      ketiType: '元首课',
      gejuName: '元首',
      luck: '大吉',
      description: '初传' + faZhi + '为日干寄宫(' + dayJiGong + ')所发用，为元首课。'+
        '元首者，万物之始也。上克下发用，尊制卑之象。'+
        '六壬第一吉课，主万事亨通，尊长得令，事业开创，谋为大利。'
    });
  }

  // ═══ 3. 始终课（初传与末传相冲） ═══
  if (faZhi && moZhi && CHONG[faZhi] === moZhi) {
    matched.push({
      ketiType: '始终课',
      gejuName: '始终',
      luck: '凶',
      description: '初传' + faZhi + '与末传' + moZhi + '相冲，为始终课。'+
        '始终者，初末相冲，有始无终之象。'+
        '事有始无终，半途而废。占谋为主先成后败，占关系主先合后分。需防善始不善终。'
    });
  }

  // ═══ 4. 转接课（初传与中传比和） ═══
  if (faWX && zhongWX && faWX === zhongWX) {
    matched.push({
      ketiType: '转接课',
      gejuName: '转接',
      luck: '中吉',
      description: '初传' + faZhi + '(' + faWX + ')与中传' + zhongZhi + '(' + zhongWX + ')五行比和，为转接课。'+
        '转接者，初中同气，事有承接转接之象。'+
        '前因后果相连，事有转机。前段之努力在后段得以延续，宜把握转折点。'
    });
  }

  // ═══ 5. 递生课（初中末递相生） ═══
  if (faWX && zhongWX && moWX &&
      WX_SHENG[faWX] === zhongWX && WX_SHENG[zhongWX] === moWX) {
    matched.push({
      ketiType: '递生课',
      gejuName: '递生',
      luck: '大吉',
      description: '初传' + faZhi + '(' + faWX + ')生中传' + zhongZhi + '(' + zhongWX + ')生末传' + moZhi + '(' + moWX + ')，递相生，为递生课。'+
        '递生者，初中末依次相生，生机链不断之象。'+
        '事有层层推进，步步生辉。占谋为主大吉，事业蒸蒸日上，贵人层层扶持。'
    });
  }

  // ═══ 6. 递克课（初中末递相克） ═══
  if (faWX && zhongWX && moWX &&
      WX_KE[faWX] === zhongWX && WX_KE[zhongWX] === moWX) {
    matched.push({
      ketiType: '递克课',
      gejuName: '递克',
      luck: '大凶',
      description: '初传' + faZhi + '(' + faWX + ')克中传' + zhongZhi + '(' + zhongWX + ')克末传' + moZhi + '(' + moWX + ')，递相克，为递克课。'+
        '递克者，初中末依次相克，戾气链不断之象。'+
        '事有层层受阻，步步遭殃。占谋为主大凶，事业每况愈下，宜速避让，不可强求。'
    });
  }

  // ═══ 7. 连茹课（初中末三位连茹） ═══
  // 连茹：三个地支在十二地支顺序中相连（如子丑寅、寅卯辰等）
  if (faZhi && zhongZhi && moZhi) {
    var faIdx = ZHI_ORDER.indexOf(faZhi);
    var zhongIdx = ZHI_ORDER.indexOf(zhongZhi);
    var moIdx = ZHI_ORDER.indexOf(moZhi);
    if (faIdx >= 0 && zhongIdx >= 0 && moIdx >= 0) {
      // 顺序连茹：初→中→末依次+1
      var isShunLian = (zhongIdx === (faIdx + 1) % 12) && (moIdx === (faIdx + 2) % 12);
      // 逆序连茹：初→中→末依次-1
      var isNiLian = (zhongIdx === (faIdx + 11) % 12) && (moIdx === (faIdx + 10) % 12);
      if (isShunLian || isNiLian) {
        var lianDir = isShunLian ? '顺连' : '倒连';
        var lianDesc = isShunLian ?
          '顺连(' + faZhi + '→' + zhongZhi + '→' + moZhi + ')，事有顺次推进之象，宜顺势而为。' :
          '倒连(' + faZhi + '→' + zhongZhi + '→' + moZhi + ')，事有逆次退缩之象，宜退守自保。';
        matched.push({
          ketiType: '连茹课',
          gejuName: lianDir + '连茹',
          luck: isShunLian ? '吉' : '凶',
          description: '初传' + faZhi + '、中传' + zhongZhi + '、末传' + moZhi + '三位地支' + lianDir + '连茹，为连茹课。'+
            '连茹者，如藤蔓相连，引而申之。' + lianDesc +
            '占事主接连不断，牵一发而动全身。'
        });
      }
    }
  }

  // ═══ 8. 三合课（初中末三合局） ═══
  if (faZhi && zhongZhi && moZhi) {
    for (var si = 0; si < SANHE_JU.length; si++) {
      var sanHe = SANHE_JU[si];
      if (sanHe.zhi.indexOf(faZhi) >= 0 &&
          sanHe.zhi.indexOf(zhongZhi) >= 0 &&
          sanHe.zhi.indexOf(moZhi) >= 0 &&
          faZhi !== zhongZhi && zhongZhi !== moZhi && faZhi !== moZhi) {
        matched.push({
          ketiType: '三合课',
          gejuName: sanHe.ju,
          luck: '吉',
          description: '初传' + faZhi + '、中传' + zhongZhi + '、末传' + moZhi + '三合' + sanHe.ju + '，为三合课。'+
            '三合者，初中末三传合成一局，凝聚合力之象。'+
            '占事主众人合力，事可大成。占谋为主有贵人同心，占婚为主百年好合，占财为主合谋生财。宜合作共赢。'
        });
        break;
      }
    }
  }

  // ═══ 汇总结果 ═══
  // 如果匹配到多个课体，取最显著的一个（优先级：大吉 > 大凶 > 吉 > 凶 > 中吉 > 中平）
  var priority = {'大吉':5, '大凶':4, '吉':3, '凶':2, '中吉':1, '中平':0};
  var best = null;
  var bestScore = -1;
  for (var mi = 0; mi < matched.length; mi++) {
    var score = priority[matched[mi].luck] || 0;
    if (score > bestScore) {
      bestScore = score;
      best = matched[mi];
    }
  }

  // 如果未匹配到任何课体
  if (!best) {
    best = {
      ketiType: '通用课',
      gejuName: '通用',
      luck: '中平',
      description: '三传' + faZhi + '→' + zhongZhi + '→' + moZhi +
        '未匹配标准课体格局。需结合四课、天将、神煞综合判断吉凶。' +
        '初传' + faZhi + '(' + faWX + ')，中传' + zhongZhi + '(' + zhongWX + ')，末传' + moZhi + '(' + moWX + ')。'
    };
  }

  return {
    ketiType: best.ketiType,
    gejuName: best.gejuName,
    luck: best.luck,
    description: best.description,
    allMatched: matched,
    sanChuan: { fa: faZhi, zhong: zhongZhi, mo: moZhi },
    sanChuanWX: { fa: faWX, zhong: zhongWX, mo: moWX }
  };
}

window.LiurenV3 = {
  // 核心函数
  computeLiuRen,
  
  // 底层函数（供测试使用）
  getYueJiang,
  buildTianPan,
  buildSiKe,
  buildSanChuan,
  buildTianJiang,
  classifyKeTi,
  
  // 九宗门
  zeKeFa,
  biYongFa,
  sheHaiFa,
  yaoKeFa,
  maoXingFa,
  bieZeFa,
  baZhuanFa,
  fuYinFa,
  fanYinFa,
  
  // 工具
  getDayStemBranch,
  getHourBranch,
  getHourStem,
  formatTianPan,
  formatSanChuan,
  generateReport,
  isFuYin,
  isFanYin,
  isBaZhuan,
  isSiKeBuQuan,
  // R2.10: 克应分析 + 本命行年
  analyzeKeying,
  computeBenMing,
  // R3.4: 课体格局辨识
  analyzeKetiGeshi,
  
  // 常量
  STEMS,
  BRANCHES,
  ZHI_WX,
  GAN_WX,
  GAN_JI_GONG,
  YUE_JIANG_NAMES
};

})();

// ════════════════════════════════════════════════════════════════
//  引擎 6/6: QimenV3 (从 qimen-v3.js 合并)
// ════════════════════════════════════════════════════════════════

/* === BEGIN qimen-v3.js === */
/**
 * ════════════════════════════════════════════════════════════════
 *  命理宝鉴 · 奇门遁甲排盘引擎 V3
 *  Qimen Engine V3 — Astronomical Solar-Term Calibrated
 *
 *  校准典籍:
 *    《神奇宝海》《奇门遁甲秘笈大全》《钦定授时通考》
 *
 *  V3 校准要点:
 *    1. 天文节气定局（太阳黄经精确计算）
 *    2. 六仪三奇排布校准
 *    3. 天盘转动校准（值符随时干）
 *    4. 八门值使校准
 *    5. 九星值符校准
 *    6. 八神排布校准
 *    7. 格局判断校准（吉格/凶格/五假/三诈）
 *    8. 五不遇时校准
 * ════════════════════════════════════════════════════════════════
 */

(function() {
'use strict';

// ─── 常量 ────────────────────────────────────────────────────────

var STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
var BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
var GAN_ZHI = [];
for (var i = 0; i < 60; i++) { GAN_ZHI.push(STEMS[i%10] + BRANCHES[i%12]); }

// 六仪三奇
var LIU_YI = ['戊','己','庚','辛','壬','癸']; // 六仪
var SAN_QI = ['丁','丙','乙']; // 三奇(逆序: 丁丙乙)
var LIU_SAN_ALL = ['戊','己','庚','辛','壬','癸','丁','丙','乙']; // 完整排列

// 九宫 (洛书数序)
var JIU_GONG = [1,2,3,4,5,6,7,8,9];
var JIU_GONG_NAME = {
  1:'坎', 2:'坤', 3:'震', 4:'巽', 5:'中', 6:'乾', 7:'兑', 8:'艮', 9:'离'
};
var JIU_GONG_FANGWEI = {
  1:'北方', 2:'西南', 3:'东方', 4:'东南', 5:'中宫', 6:'西北', 7:'西方', 8:'东北', 9:'南方'
};

// 后天八卦
var BAGUA = {
  '坎':1, '坤':2, '震':3, '巽':4, '中':5, '乾':6, '兑':7, '艮':8, '离':9
};

// 八门原始宫位
var MEN_ORIG = {1:'休', 8:'生', 3:'伤', 4:'杜', 9:'景', 2:'死', 7:'惊', 6:'开'};
var MEN_NAMES = ['休','生','伤','杜','景','死','惊','开'];
var MEN_FULL = {'休':'休门','生':'生门','伤':'伤门','杜':'杜门','景':'景门','死':'死门','惊':'惊门','开':'开门'};

// 九星原始宫位
var STARS_ORIG = {1:'蓬', 2:'芮', 3:'冲', 4:'辅', 5:'禽', 6:'心', 7:'柱', 8:'任', 9:'英'};
var STARS_NAMES = ['蓬','芮','冲','辅','禽','心','柱','任','英'];
var STARS_FULL = {'蓬':'天蓬','芮':'天芮','冲':'天冲','辅':'天辅','禽':'天禽','心':'天心','柱':'天柱','任':'天任','英':'天英'};

// 八神
var SHEN_NAMES = ['值符','螣蛇','太阴','六合','白虎','玄武','九地','九天'];

// 节气遁局表
// 阳遁: 冬至174, 小寒285, 大寒396, 立春852, 雨水963, 惊蛰174,
//        春分396, 清明417, 谷雨528, 立夏417, 小满528, 芒种639
// 阴遁: 夏至936, 小暑825, 大暑714, 立秋258, 处暑147, 白露936,
//        秋分714, 寒露693, 霜降582, 立冬693, 小雪582, 大雪471
var JIEQI_JU_TABLE = {
  yang: {
    '冬至':[1,7,4], '小寒':[2,8,5], '大寒':[3,9,6],
    '立春':[8,5,2], '雨水':[9,6,3], '惊蛰':[1,7,4],
    '春分':[3,9,6], '清明':[4,1,7], '谷雨':[5,2,8],
    '立夏':[4,1,7], '小满':[5,2,8], '芒种':[6,3,9]
  },
  yin: {
    '夏至':[9,3,6], '小暑':[8,2,5], '大暑':[7,1,4],
    '立秋':[2,5,8], '处暑':[1,4,7], '白露':[9,3,6],
    '秋分':[7,1,4], '寒露':[6,9,3], '霜降':[5,8,2],
    '立冬':[6,9,3], '小雪':[5,8,2], '大雪':[4,7,1]
  }
};

// 24节气名称 (按时间顺序, 从冬至开始)
var JIEQI_ORDER = [
  '冬至','小寒','大寒','立春','雨水','惊蛰',
  '春分','清明','谷雨','立夏','小满','芒种',
  '夏至','小暑','大暑','立秋','处暑','白露',
  '秋分','寒露','霜降','立冬','小雪','大雪'
];

// 节气黄经度数表 (冬至=270°开始)
var JIEQI_LONGITUDE = {
  '冬至':270, '小寒':285, '大寒':300,
  '立春':315, '雨水':330, '惊蛰':345,
  '春分':0, '清明':15, '谷雨':30,
  '立夏':45, '小满':60, '芒种':75,
  '夏至':90, '小暑':105, '大暑':120,
  '立秋':135, '处暑':150, '白露':165,
  '秋分':180, '寒露':195, '霜降':210,
  '立冬':225, '小雪':240, '大雪':255
};

// 天干五行
var GAN_WX = {'甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水'};

// 地支宫位 (后天八卦)
var ZHI_GONG = {'子':1,'丑':8,'寅':8,'卯':3,'辰':4,'巳':4,'午':9,'未':2,'申':2,'酉':7,'戌':6,'亥':6};

// 旬首对应六仪
var XUN_YI = ['戊','己','庚','辛','壬','癸']; // 甲子旬→戊, 甲戌旬→己...

// ─── 天文节气计算 ────────────────────────────────────────────────

/**
 * 计算太阳黄经 (VSOP87 截断级数 — 标准天文算法)
 * 基于《钦定授时通考》节气以日躔为度的原则
 * 精度: ±0.01° (足以判断节气)
 */
function solarLongitude(jd) {
  // JD → T (儒略世纪, 从 J2000.0)
  var T = (jd - 2451545.0) / 36525.0;
  
  // 太阳平黄经
  var L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  
  // 太阳平近点角
  var M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  
  // 地球轨道偏心率
  var e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T;
  
  // 中心差
  var C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * sinDeg(M)
        + (0.019993 - 0.000101 * T) * sinDeg(2 * M)
        + 0.000289 * sinDeg(3 * M);
  
  // 太阳真黄经
  var theta = L0 + C;
  
  // 章动修正 (标准天文算法)
  var omega = 125.04 - 1934.136 * T;
  var lambda = theta - 0.00569 - 0.00478 * sinDeg(omega);
  
  // 归一化到 [0, 360)
  return ((lambda % 360) + 360) % 360;
}

function sinDeg(deg) { return Math.sin(deg * Math.PI / 180); }
function cosDeg(deg) { return Math.cos(deg * Math.PI / 180); }
function tanDeg(deg) { return Math.tan(deg * Math.PI / 180); }

/**
 * 公历日期转儒略日
 */
function toJulianDay(year, month, day) {
  if (month <= 2) { year -= 1; month += 12; }
  var A = Math.floor(year / 100);
  var B = 2 - A + Math.floor(A / 4);
  // 公历 → JD
  return Math.floor(365.25 * (year + 4716)) 
       + Math.floor(30.6001 * (month + 1)) 
       + day + B - 1524.5;
}

/**
 * 精确节气计算
 * 通过太阳黄经二分法查找节气时刻
 * 返回: { jieqi: 节气名, longitude: 黄经度数, nextJieqi: 下一节气 }
 */
function getJieqiPrecise(year, month, day) {
  var jd = toJulianDay(year, month, day);
  var lon = solarLongitude(jd);
  
  // 找到当前黄经对应的节气
  // 节气按黄经每15°一个, 从春分(0°)开始
  // 但传统节气从冬至(270°)开始排
  var currentJieqi = '';
  var nextJieqi = '';
  
  // 遍历节气表, 找到当前所在的节气区间
  var sortedJieqi = [
    [0,'春分'],[15,'清明'],[30,'谷雨'],[45,'立夏'],[60,'小满'],[75,'芒种'],
    [90,'夏至'],[105,'小暑'],[120,'大暑'],[135,'立秋'],[150,'处暑'],[165,'白露'],
    [180,'秋分'],[195,'寒露'],[210,'霜降'],[225,'立冬'],[240,'小雪'],[255,'大雪'],
    [270,'冬至'],[285,'小寒'],[300,'大寒'],[315,'立春'],[330,'雨水'],[345,'惊蛰']
  ];
  
  for (var i = 0; i < sortedJieqi.length; i++) {
    var curLon = sortedJieqi[i][0];
    var curName = sortedJieqi[i][1];
    var nextLon = sortedJieqi[(i + 1) % 24][0];
    var nextName = sortedJieqi[(i + 1) % 24][1];
    
    // 处理跨 0° 的情况
    if (curLon < nextLon) {
      if (lon >= curLon && lon < nextLon) {
        currentJieqi = curName;
        nextJieqi = nextName;
        break;
      }
    } else {
      // curLon >= nextLon, 说明跨 0°
      if (lon >= curLon || lon < nextLon) {
        currentJieqi = curName;
        nextJieqi = nextName;
        break;
      }
    }
  }
  
  if (!currentJieqi) {
    // 退化处理: 用近似日期
    currentJieqi = getJieqiApprox(year, month, day);
    nextJieqi = JIEQI_ORDER[(JIEQI_ORDER.indexOf(currentJieqi) + 1) % 24];
  }
  
  return {
    jieqi: currentJieqi,
    longitude: lon,
    nextJieqi: nextJieqi,
    isYang: isYangDun(currentJieqi)
  };
}

/**
 * 判断是否阳遁
 * 冬至(270°)后到夏至(90°)前为阳遁
 * 夏至(90°)后到冬至(270°)前为阴遁
 */
function isYangDun(jieqi) {
  var idx = JIEQI_ORDER.indexOf(jieqi);
  // 冬至到芒种 = 阳遁 (index 0~11)
  // 夏至到大雪 = 阴遁 (index 12~23)
  return idx >= 0 && idx <= 11;
}

/**
 * 近似节气 (退化用)
 */
function getJieqiApprox(year, month, day) {
  var dates = [
    [1,6,'小寒'],[1,20,'大寒'],[2,4,'立春'],[2,19,'雨水'],
    [3,6,'惊蛰'],[3,21,'春分'],[4,5,'清明'],[4,20,'谷雨'],
    [5,6,'立夏'],[5,21,'小满'],[6,6,'芒种'],[6,21,'夏至'],
    [7,7,'小暑'],[7,23,'大暑'],[8,8,'立秋'],[8,23,'处暑'],
    [9,8,'白露'],[9,23,'秋分'],[10,8,'寒露'],[10,23,'霜降'],
    [11,7,'立冬'],[11,22,'小雪'],[12,7,'大雪'],[12,22,'冬至']
  ];
  var jq = '冬至';
  for (var i = 0; i < dates.length; i++) {
    var m = dates[i][0], d = dates[i][1], name = dates[i][2];
    if (month > m || (month === m && day >= d)) { jq = name; }
  }
  if (month === 12 && day < 22) jq = '大雪';
  if (month === 1 && day < 6) jq = '冬至';
  return jq;
}

// ─── 干支计算 ────────────────────────────────────────────────────

/**
 * 日干支计算 (基于天文历, 从已知甲子日推算)
 * 1900-01-01 = 甲子日 (干支序数0, 已验证)
 */
function getDayGanZhi(year, month, day) {
  var baseDate = new Date(1900, 0, 1);
  var target = new Date(year, month - 1, day);
  var diff = Math.round((target - baseDate) / 86400000);
  var idx = ((diff % 60) + 60) % 60;
  return { idx: idx, gan: idx % 10, zhi: idx % 12, name: GAN_ZHI[idx] };
}

/**
 * 时干支计算 (五子遁)
 * 甲己日: 甲子时起; 乙庚日: 丙子时起; 丙辛日: 戊子时起;
 * 丁壬日: 庚子时起; 戊癸日: 壬子时起
 */
function getHourGanZhi(dayGanIdx, hour) {
  var hourIdx = Math.floor((hour + 1) / 2) % 12; // 子=0, 丑=1...
  var hourGzIdx = ((dayGanIdx * 12 + hourIdx) % 60 + 60) % 60;
  return { idx: hourGzIdx, gan: hourGzIdx % 10, zhi: hourGzIdx % 12, hourIdx: hourIdx, name: GAN_ZHI[hourGzIdx] };
}

// ─── 定遁局 ──────────────────────────────────────────────────────

/**
 * 定遁局
 * 1. 天文节气确定阴阳遁
 * 2. 日干支符头定上中下三元
 * 3. 节气+元数查遁局表
 *
 * 《奇门遁甲秘笈大全》云:
 *   「先须掌上排九宫, 纵横十五在其中。
 *    次将八卦论八节, 一气统三为正宗。」
 *
 * 符头定元: 甲己日为符头, 甲子/甲午/甲申/甲寅定上元
 *   日干支序数 mod 5: 0=甲己日(符头)
 *   每符头管5天为一元
 */
function getDunJu(year, month, day, hour, juType) {
  var jieqiInfo = getJieqiPrecise(year, month, day);
  var isYang = jieqiInfo.isYang;
  var dun = isYang ? 'yang' : 'yin';
  
  // 如果手动指定遁局
  if (juType && juType !== 'auto') {
    if (juType === 'yang') dun = 'yang';
    else if (juType === 'yin') dun = 'yin';
    else if (/^\d+$/.test(String(juType))) {
      var juNum = parseInt(juType);
      return { dun: dun, ju: juNum, jieqi: jieqiInfo.jieqi, yuan: '指定', method: '手动指定' };
    }
  }
  
  var dayGz = getDayGanZhi(year, month, day);
  
  // 定元: 以日干支符头定上中下三元
  // 甲己日(日干 idx%5==0)为符头
  // 符头后的5天为一元
  // 上元: 符头甲子/甲午/甲申/甲寅 (旬首日)
  // 实际: 日干支序数 mod 15: 0-4=上元, 5-9=中元, 10-14=下元
  var dayMod15 = dayGz.idx % 15;
  var yuan = dayMod15 < 5 ? 0 : dayMod15 < 10 ? 1 : 2; // 0=上, 1=中, 2=下
  var yuanName = ['上元','中元','下元'][yuan];
  
  // 查遁局表
  var table = isYang ? JIEQI_JU_TABLE.yang : JIEQI_JU_TABLE.yin;
  var juArr = table[jieqiInfo.jieqi];
  if (!juArr) {
    // 退化: 冬至阳遁1局, 夏至阴遁9局
    juArr = isYang ? [1,7,4] : [9,3,6];
  }
  var ju = juArr[yuan];
  
  return {
    dun: dun,
    ju: ju,
    jieqi: jieqiInfo.jieqi,
    jieqiLongitude: jieqiInfo.longitude,
    nextJieqi: jieqiInfo.nextJieqi,
    yuan: yuanName,
    yuanIdx: yuan,
    method: '天文节气+符头三元',
    dayGzIdx: dayGz.idx,
    dayGan: dayGz.gan,
    dayZhi: dayGz.zhi,
    dayGzName: dayGz.name
  };
}

// ─── 地盘排布 ────────────────────────────────────────────────────

/**
 * 地盘六仪三奇排布
 *
 * 《奇门遁甲秘笈大全》:
 *   阳遁: 戊己庚辛壬癸丁丙乙 (顺布六仪, 逆布三奇)
 *   阴遁: 戊己庚辛壬癸丁丙乙 (逆布六仪, 顺布三奇)
 *
 * 戊起于局数对应宫位, 按九宫飞布
 * 中宫5宫寄宫: 阳遁寄艮8, 阴遁寄坤2
 */
function arrangeDiPan(dun, ju) {
  var res = {};
  var startPalace = ju;
  
  for (var i = 0; i < 9; i++) {
    var palace;
    if (dun === 'yang') {
      // 阳遁顺飞: 从ju宫开始, 按 1→2→3→4→5→6→7→8→9 顺序飞布
      palace = ((startPalace - 1 + i) % 9) + 1;
    } else {
      // 阴遁逆飞: 从ju宫开始, 按 9→8→7→6→5→4→3→2→1 顺序飞布
      palace = ((startPalace - 1 - i + 90) % 9) + 1;
    }
    res[palace] = LIU_SAN_ALL[i];
  }
  
  return res;
}

// ─── 天盘排布 ────────────────────────────────────────────────────

/**
 * 天盘转动
 *
 * 《神奇宝海》:
 *   「天盘随值符转动, 以时辰地支为定位。」
 *
 * 1. 找时辰旬首 → 对应六仪
 * 2. 旬首六仪在地盘的宫位 = 值符宫
 * 3. 天盘以值符宫为起点, 将地盘六仪三奇重新排布
 *    阳遁顺飞, 阴遁逆飞
 */
function arrangeTianPan(dipan, hourGzIdx, ju, dun) {
  var res = {};
  
  // 旬首 → 六仪
  var xunShou = Math.floor(hourGzIdx / 10) * 10; // 0,10,20,30,40,50
  var xunYiIdx = Math.floor(xunShou / 10) % 6;
  var xunYi = XUN_YI[xunYiIdx];
  
  // 找旬首六仪在地盘的宫位
  var xunGong = 5;
  for (var p = 1; p <= 9; p++) {
    if (dipan[p] === xunYi) { xunGong = p; break; }
  }
  
  // 天盘飞布: 以值符宫为起点, 按九宫飞布排列地盘六仪三奇
  var flySeq = [];
  for (var i = 0; i < 9; i++) {
    var palace = (dun === 'yang')
      ? ((xunGong - 1 + i) % 9) + 1
      : ((xunGong - 1 - i + 90) % 9) + 1;
    flySeq.push(palace);
  }
  
  // 时辰地支宫位
  var hourZhiIdx = hourGzIdx % 12;
  var zhiGong = [1,8,8,3,4,4,9,2,2,7,6,6][hourZhiIdx]; // 子丑寅卯辰巳午未申酉戌亥
  
  // 旋转序列: 以时辰地支宫为目标
  var rotateSeq = [];
  for (var i = 0; i < 9; i++) {
    var palace = (dun === 'yang')
      ? ((zhiGong - 1 + i) % 9) + 1
      : ((zhiGong - 1 - i + 90) % 9) + 1;
    rotateSeq.push(palace);
  }
  
  // 天盘: rotateSeq[i]宫 = 地盘 flySeq[i]宫的仪
  for (var i = 0; i < 9; i++) {
    res[rotateSeq[i]] = dipan[flySeq[i]];
  }
  
  return res;
}

// ─── 八门排布 ────────────────────────────────────────────────────

/**
 * 八门排布
 *
 * 《奇门遁甲秘笈大全》:
 *   「值使从旬首宫起, 随时辰递宫。阳遁顺飞, 阴遁逆飞。」
 *   中宫无门, 跳过。
 *
 * 八门原始宫位: 休1 生8 伤3 杜4 景9 死2 惊7 开6
 */
function arrangeMen(dun, ju, hourGzIdx, dipan) {
  var res = {};
  
  // 旬首 → 六仪 → 在地盘的宫位
  var xunShou = Math.floor(hourGzIdx / 10) * 10;
  var xunYiIdx = Math.floor(xunShou / 10) % 6;
  var xunYi = XUN_YI[xunYiIdx];
  
  var xunGong = 5;
  for (var p = 1; p <= 9; p++) {
    if (dipan[p] === xunYi) { xunGong = p; break; }
  }
  
  // 值使 = 旬首宫对应的原始门
  var zhiShi = MEN_ORIG[xunGong] || '休';
  var zhiShiIdx = MEN_NAMES.indexOf(zhiShi);
  
  // 时辰在旬中的序数 (0-9)
  var hourInXun = hourGzIdx - xunShou;
  
  // 九宫飞布 (跳过中宫5)
  var gongFly = (dun === 'yang')
    ? [1,2,3,4,6,7,8,9]
    : [9,8,7,6,4,3,2,1];
  
  var startPos = 0;
  for (var i = 0; i < gongFly.length; i++) {
    if (gongFly[i] === xunGong) { startPos = i; break; }
  }
  
  for (var i = 0; i < 8; i++) {
    var palace = gongFly[(startPos + hourInXun + i) % gongFly.length];
    res[palace] = MEN_NAMES[(zhiShiIdx + i) % 8];
  }
  
  return res;
}

// ─── 九星排布 ────────────────────────────────────────────────────

/**
 * 九星排布
 *
 * 《神奇宝海》:
 *   「天蓬(冬至)→天任→天冲→天辅→天英→天芮→天柱→天心→天禽
 *    值符跟天盘旬首。」
 *
 * 九星原始宫位: 蓬1 芮2 冲3 辅4 禽5 心6 柱7 任8 英9
 * 值符星 = 旬首所在宫的原始星
 */
function arrangeStars(dun, ju, hourGzIdx, tianpan) {
  var res = {};
  
  // 旬首 → 六仪 → 在天盘的宫位
  var xunShou = Math.floor(hourGzIdx / 10) * 10;
  var xunYiIdx = Math.floor(xunShou / 10) % 6;
  var xunYi = XUN_YI[xunYiIdx];
  
  var xunGong = 5;
  for (var p = 1; p <= 9; p++) {
    if (tianpan[p] === xunYi) { xunGong = p; break; }
  }
  
  // 值符星 = 旬首所在宫的原始星
  var zhiFuStar = STARS_ORIG[xunGong] || '蓬';
  var zhiFuIdx = STARS_NAMES.indexOf(zhiFuStar);
  
  // 九宫飞布 (含中宫5)
  var gongFlyFull = (dun === 'yang')
    ? [1,2,3,4,5,6,7,8,9]
    : [9,8,7,6,5,4,3,2,1];
  
  var startPos = 0;
  for (var i = 0; i < gongFlyFull.length; i++) {
    if (gongFlyFull[i] === xunGong) { startPos = i; break; }
  }
  
  for (var i = 0; i < 9; i++) {
    var palace = gongFlyFull[(startPos + i) % 9];
    res[palace] = STARS_NAMES[(zhiFuIdx + i) % 9];
  }
  
  return res;
}

// ─── 八神排布 ────────────────────────────────────────────────────

/**
 * 八神排布
 *
 * 《奇门遁甲秘笈大全》:
 *   「值符→螣蛇→太阴→六合→白虎→玄武→九地→九天
 *    值符跟值符星所在宫。阳遁顺飞, 阴遁逆飞。」
 *   中宫无神, 跳过。
 */
function arrangeShen(dun, hourGzIdx, tianpan) {
  var res = {};
  
  // 旬首 → 六仪 → 在天盘的宫位 (= 值符星所在宫)
  var xunShou = Math.floor(hourGzIdx / 10) * 10;
  var xunYiIdx = Math.floor(xunShou / 10) % 6;
  var xunYi = XUN_YI[xunYiIdx];
  
  var xunGong = 5;
  for (var p = 1; p <= 9; p++) {
    if (tianpan[p] === xunYi) { xunGong = p; break; }
  }
  
  // 九宫飞布 (跳过中宫5)
  var gongFly = (dun === 'yang')
    ? [1,2,3,4,6,7,8,9]
    : [9,8,7,6,4,3,2,1];
  
  var startPos = 0;
  for (var i = 0; i < gongFly.length; i++) {
    if (gongFly[i] === xunGong) { startPos = i; break; }
  }
  
  for (var i = 0; i < 8; i++) {
    var palace = gongFly[(startPos + i) % 8];
    res[palace] = SHEN_NAMES[i];
  }
  
  return res;
}

// ─── 格局判断 ────────────────────────────────────────────────────

/**
 * 格局判断
 *
 * 校准自《神奇宝海》《奇门遁甲秘笈大全》
 *
 * 吉格:
 *   青龙返首 (戊加戊, 天盘甲子戊加地盘甲子戊)
 *   飞鸟跌穴 (丙加戊, 天盘丙奇加地盘甲子戊)
 *   玉女守门 (丁加开门)
 *   三诈格 (真诈/假诈/重诈)
 *   五假格 (天假/地假/人假/神假/鬼假)
 *
 * 凶格:
 *   白虎猖狂 (辛加乙, 辛金克乙木)
 *   腾蛇妖娇 (癸加丁)
 *   太白入荧 (庚加丙, 贼来)
 *   荧入太白 (丙加庚, 贼去)
 *   青龙折足 (戊加辛)
 *   朱雀投江 (丁加癸)
 *   伏吟 (天盘与地盘同)
 *   反吟 (天盘与地盘对冲)
 *   五不遇时
 */
function getGeju(panData) {
  var geju = [];
  var dipan = panData.dipan || {};
  var tianpan = panData.tianpan || {};
  var men = panData.men || {};
  var stars = panData.stars || {};
  var shen = panData.shen || {};
  
  // 对冲宫位表
  var duichong = {1:9, 9:1, 2:8, 8:2, 3:7, 7:3, 4:6, 6:4};
  
  for (var p = 1; p <= 9; p++) {
    if (p === 5) continue; // 中宫跳过
    var dip = dipan[p] || '';
    var tip = tianpan[p] || '';
    if (!dip || !tip) continue;
    
    // 伏吟
    if (dip === tip) {
      geju.push({ gong: p, name: '伏吟', type: '平', desc: p + '宫天盘地盘同为' + dip + '，伏吟主停滞' });
    }
    
    // 反吟
    var dc = duichong[p];
    if (dc && dipan[dc] && tianpan[p] === dipan[dc]) {
      geju.push({ gong: p, name: '反吟', type: '凶', desc: p + '宫天盘' + tip + '加地盘' + dip + '，反吟主反复' });
    }
    
    // 青龙返首 (戊加戊)
    if (tip === '戊' && dip === '戊') {
      geju.push({ gong: p, name: '青龙返首', type: '吉', desc: '戊加戊，青龙返首，大吉之象' });
    }
    
    // 飞鸟跌穴 (丙加戊)
    if (tip === '丙' && dip === '戊') {
      geju.push({ gong: p, name: '飞鸟跌穴', type: '吉', desc: '丙加戊，飞鸟跌穴，大吉之象' });
    }
    
    // 玉女守门 (丁加开门)
    if (tip === '丁' && men[p] === '开') {
      geju.push({ gong: p, name: '玉女守门', type: '吉', desc: '丁奇加开门，玉女守门，宜宴饮婚姻' });
    }
    
    // 太白入荧 (庚加丙) — 贼来
    if (tip === '庚' && dip === '丙') {
      geju.push({ gong: p, name: '太白入荧', type: '凶', desc: '庚加丙，太白入荧，贼来客胜' });
    }
    
    // 荧入太白 (丙加庚) — 贼去
    if (tip === '丙' && dip === '庚') {
      geju.push({ gong: p, name: '荧入太白', type: '凶', desc: '丙加庚，荧入太白，贼去主胜' });
    }
    
    // 青龙折足 (戊加辛)
    if (tip === '戊' && dip === '辛') {
      geju.push({ gong: p, name: '青龙折足', type: '凶', desc: '戊加辛，青龙折足，谋事多败' });
    }
    
    // 白虎猖狂 (辛加乙)
    if (tip === '辛' && dip === '乙') {
      geju.push({ gong: p, name: '白虎猖狂', type: '凶', desc: '辛加乙，白虎猖狂，主破财婚灾' });
    }
    
    // 腾蛇妖娇 (癸加丁)
    if (tip === '癸' && dip === '丁') {
      geju.push({ gong: p, name: '腾蛇妖娇', type: '凶', desc: '癸加丁，腾蛇妖娇，主口舌妖魅' });
    }
    
    // 朱雀投江 (丁加癸)
    if (tip === '丁' && dip === '癸') {
      geju.push({ gong: p, name: '朱雀投江', type: '凶', desc: '丁加癸，朱雀投江，主文书是非' });
    }
  }
  
  // 三诈格
  var jiMen = ['休','生','开'];
  var jiStar = ['辅','心','任','禽'];
  var jiShen = ['值符','太阴','六合','九天'];
  var xiongMen = ['死','惊','伤'];
  var xiongStar = ['芮','柱','蓬'];
  
  for (var p = 1; p <= 9; p++) {
    if (p === 5) continue;
    var pm = men[p] || '';
    var ps = stars[p] || '';
    var ph = shen[p] || '';
    if (!pm || !ps || !ph) continue;
    
    if (jiMen.indexOf(pm) >= 0 && jiStar.indexOf(ps) >= 0 && jiShen.indexOf(ph) >= 0) {
      geju.push({ gong: p, name: '真诈格', type: '吉', desc: p + '宫门星神俱吉，真诈格' });
    } else if (jiMen.indexOf(pm) >= 0 && xiongStar.indexOf(ps) >= 0 && jiShen.indexOf(ph) >= 0) {
      geju.push({ gong: p, name: '假诈格', type: '吉', desc: p + '宫门吉星凶神吉，假诈格' });
    } else if (xiongMen.indexOf(pm) >= 0 && jiStar.indexOf(ps) >= 0 && jiShen.indexOf(ph) >= 0) {
      geju.push({ gong: p, name: '重诈格', type: '吉', desc: p + '宫门凶星吉神吉，重诈格' });
    }
  }
  
  // 五假格
  var tianpanMap = tianpan;
  for (var p = 1; p <= 9; p++) {
    if (p === 5) continue;
    var pt = tianpanMap[p] || '';
    var pm2 = men[p] || '';
    var ph2 = shen[p] || '';
    if (!pt || !pm2 || !ph2) continue;
    
    if (pt === '丙' && pm2 === '景' && ph2 === '九天') {
      geju.push({ gong: p, name: '天假格', type: '吉', desc: '丙加景门加九天，天假格' });
    }
    if (pt === '丁' && pm2 === '杜' && ph2 === '九地') {
      geju.push({ gong: p, name: '地假格', type: '吉', desc: '丁加杜门加九地，地假格' });
    }
    if (pt === '己' && pm2 === '死' && ph2 === '太阴') {
      geju.push({ gong: p, name: '人假格', type: '吉', desc: '己加死门加太阴，人假格' });
    }
    if (pt === '辛' && pm2 === '伤' && ph2 === '螣蛇') {
      geju.push({ gong: p, name: '神假格', type: '吉', desc: '辛加伤门加螣蛇，神假格' });
    }
    if (pt === '癸' && pm2 === '惊' && ph2 === '玄武') {
      geju.push({ gong: p, name: '鬼假格', type: '吉', desc: '癸加惊门加玄武，鬼假格' });
    }
  }
  
  return geju;
}

// ─── 五不遇时 ────────────────────────────────────────────────────

/**
 * 五不遇时
 *
 * 《奇门遁甲秘笈大全》:
 *   「时干克日干, 且为阳克阳/阴克阴, 为五不遇时。」
 *   甲日庚午时, 乙日辛巳时, 丙日壬辰时, 丁日癸卯时, 戊日甲寅时,
 *   己日乙丑时, 庚日丙子时, 辛日丁酉时, 壬日戊申时, 癸日己未时
 */
function getWuBuYu(dayGanIdx, hourGzIdx) {
  var dayGan = dayGanIdx % 10;
  var hourGan = hourGzIdx % 10;
  var dayStem = STEMS[dayGan];
  var hourStem = STEMS[hourGan];
  
  // 七杀: 甲→庚, 乙→辛, 丙→壬, 丁→癸, 戊→甲, 己→乙, 庚→丙, 辛→丁, 壬→戊, 癸→己
  var qiSha = {'甲':'庚','乙':'辛','丙':'壬','丁':'癸','戊':'甲','己':'乙','庚':'丙','辛':'丁','壬':'戊','癸':'己'};
  
  if (qiSha[dayStem] === hourStem) {
    return {
      isWuBuYu: true,
      desc: '五不遇时：时干' + hourStem + '克日干' + dayStem + '，阳克阳/阴克阴，大凶',
      dayGan: dayStem,
      hourGan: hourStem
    };
  }
  return { isWuBuYu: false, desc: '' };
}

// ─── 空亡 / 马星 ─────────────────────────────────────────────────

function getKongWang(dayGzIdx) {
  var xunKong = ['戌亥','申酉','午未','辰巳','寅卯','子丑'];
  var xunIdx = Math.floor((dayGzIdx % 60) / 10);
  var kongZhi = xunKong[xunIdx];
  var kongGongMap = {'子':1,'丑':8,'寅':8,'卯':3,'辰':4,'巳':4,'午':9,'未':2,'申':2,'酉':7,'戌':6,'亥':6};
  return [kongGongMap[kongZhi[0]], kongGongMap[kongZhi[1]]];
}

function getMaXing(hourZhiIdx) {
  var maMap = {0:8, 4:8, 8:8, 5:6, 9:6, 1:6, 2:2, 6:2, 10:2, 3:4, 7:4, 11:4};
  return maMap[hourZhiIdx] || 5;
}

// ─── 完整排盘 ────────────────────────────────────────────────────

/**
 * 完整奇门排盘 (V3)
 *
 * @param {number} year  公历年
 * @param {number} month 公历月 (1-12)
 * @param {number} day   公历日
 * @param {number} hour  小时 (0-23)
 * @param {string} juType 'auto'|'yang'|'yin'|局数
 * @return {object} 完整排盘数据
 */
function qimenCalcV3(year, month, day, hour, juType) {
  juType = juType || 'auto';
  
  // 定遁局
  var dunJu = getDunJu(year, month, day, hour, juType);
  
  // 日干支
  var dayGz = getDayGanZhi(year, month, day);
  
  // 时干支
  var hourGz = getHourGanZhi(dayGz.gan, hour);
  
  // 地盘
  var dipan = arrangeDiPan(dunJu.dun, dunJu.ju);
  
  // 天盘
  var tianpan = arrangeTianPan(dipan, hourGz.idx, dunJu.ju, dunJu.dun);
  
  // 八门
  var men = arrangeMen(dunJu.dun, dunJu.ju, hourGz.idx, dipan);
  
  // 九星
  var stars = arrangeStars(dunJu.dun, dunJu.ju, hourGz.idx, tianpan);
  
  // 八神
  var shen = arrangeShen(dunJu.dun, hourGz.idx, tianpan);
  
  // 旬首六仪
  var xunShou = Math.floor(hourGz.idx / 10) * 10;
  var xunYi = XUN_YI[Math.floor(xunShou / 10) % 6];
  
  // 值符宫 (天盘旬首所在宫)
  var zhiFuGong = 5;
  for (var p = 1; p <= 9; p++) {
    if (tianpan[p] === xunYi) { zhiFuGong = p; break; }
  }
  
  // 值使门
  var zhiShiMen = MEN_ORIG[zhiFuGong] || '休';
  
  // 空亡
  var kongWang = getKongWang(dayGz.idx);
  
  // 马星
  var maXing = getMaXing(hourGz.hourIdx);
  
  // 五不遇时
  var wuBuYu = getWuBuYu(dayGz.gan, hourGz.gan);
  
  // 格局
  var geju = getGeju({
    dipan: dipan, tianpan: tianpan, men: men, stars: stars, shen: shen
  });
  
  return {
    // 基本信息
    year: year, month: month, day: day, hour: hour,
    dateStr: year + '-' + String(month).padStart(2,'0') + '-' + String(day).padStart(2,'0'),
    hourStr: String(hour).padStart(2,'0') + ':00',
    
    // 遁局
    dun: dunJu.dun,
    dunName: dunJu.dun === 'yang' ? '阳遁' : '阴遁',
    ju: dunJu.ju,
    juName: dunJu.dun === 'yang' ? '阳遁' + dunJu.ju + '局' : '阴遁' + dunJu.ju + '局',
    jieqi: dunJu.jieqi,
    jieqiLongitude: dunJu.jieqiLongitude,
    yuan: dunJu.yuan,
    method: dunJu.method,
    
    // 干支
    dayGzIdx: dayGz.idx,
    dayGzName: dayGz.name,
    dayGanName: STEMS[dayGz.gan],
    dayZhiName: BRANCHES[dayGz.zhi],
    hourGzIdx: hourGz.idx,
    hourGzName: hourGz.name,
    hourGanName: STEMS[hourGz.gan],
    hourZhiName: BRANCHES[hourGz.zhi],
    hourIdx: hourGz.hourIdx,
    
    // 旬首
    xunShouGz: GAN_ZHI[xunShou],
    xunYi: xunYi,
    
    // 值符值使
    zhiFuGong: zhiFuGong,
    zhiFuStar: STARS_ORIG[zhiFuGong] || '蓬',
    zhiShiMen: zhiShiMen,
    
    // 排盘
    dipan: dipan,
    tianpan: tianpan,
    men: men,
    stars: stars,
    shen: shen,
    
    // 辅助信息
    kongWang: kongWang,
    maXing: maXing,
    wuBuYu: wuBuYu,
    geju: geju
  };
}

// ─── 完整分析 ────────────────────────────────────────────────────

/**
 * 完整奇门分析 (V3)
 */
function analyzeQimenFull(panData) {
  if (!panData || !panData.dipan) return null;
  
  var result = {
    summary: '',
    gejuText: '',
    luck: '平',
    advice: '',
    details: []
  };
  
  // 格局
  var geju = panData.geju || getGeju(panData);
  var jiGe = geju.filter(function(g) { return g.type === '吉'; });
  var xiongGe = geju.filter(function(g) { return g.type === '凶'; });
  var pingGe = geju.filter(function(g) { return g.type === '平'; });
  
  // 格局文本
  var gejuParts = [];
  if (jiGe.length > 0) gejuParts.push('吉格: ' + jiGe.map(function(g){return g.name;}).join('、'));
  if (xiongGe.length > 0) gejuParts.push('凶格: ' + xiongGe.map(function(g){return g.name;}).join('、'));
  if (pingGe.length > 0) gejuParts.push('平格: ' + pingGe.map(function(g){return g.name;}).join('、'));
  result.gejuText = gejuParts.join(' | ') || '无特殊格局';
  
  // 吉凶判断
  if (panData.wuBuYu && panData.wuBuYu.isWuBuYu) {
    result.luck = '大凶';
    result.advice = '五不遇时，时干克日干，万事不宜，宜静守。';
  } else if (jiGe.length > 0 && xiongGe.length === 0) {
    result.luck = '吉';
    result.advice = '格局大吉，宜积极行动。';
  } else if (jiGe.length > xiongGe.length) {
    result.luck = '小吉';
    result.advice = '吉多于凶，可谨慎推进。';
  } else if (xiongGe.length > jiGe.length) {
    result.luck = '凶';
    result.advice = '凶多于吉，宜保守退守。';
  } else {
    result.luck = '平';
    result.advice = '吉凶参半，需因势利导。';
  }
  
  // 概述
  result.summary = panData.juName + ' | ' + panData.jieqi + panData.yuan + ' | 日干支: ' + panData.dayGzName + ' | 时干支: ' + panData.hourGzName;
  if (panData.wuBuYu && panData.wuBuYu.isWuBuYu) result.summary += ' | ⚠️五不遇时';
  
  // 详细分析
  // 1. R1.7: 值符值使深度分析
  var zhiFuGong = panData.zhiFuGong;
  var zhiFuStar = panData.zhiFuStar;
  var zhiShiMen = panData.zhiShiMen;
  var zhiFuGongEle = GONG_WX[JIU_GONG_NAME[zhiFuGong]] || '土';
  // 九星五行: 蓬=水 芮=土 冲=木 辅=木 禽=土 心=金 柱=金 任=土 英=火
  var STAR_WX_MAP = {蓬:'水',芮:'土',冲:'木',辅:'木',禽:'土',心:'金',柱:'金',任:'土',英:'火'};
  var zhiFuStarEle = STAR_WX_MAP[zhiFuStar] || '土';
  // 八门五行: 休=水 生=土 伤=木 杜=木 景=火 死=土 惊=金 开=金
  var MEN_WX_MAP = {休:'水',生:'土',伤:'木',杜:'木',景:'火',死:'土',惊:'金',开:'金'};
  var zhiShiMenEle = MEN_WX_MAP[zhiShiMen] || '土';
  
  // 五行生克判断
  function judgeWXRelation2(a, b) {
    if (a === b) return '比和';
    var shengMap = {木:'火',火:'土',土:'金',金:'水',水:'木'};
    var keMap = {木:'土',土:'水',水:'火',火:'金',金:'木'};
    if (shengMap[a] === b) return '我生';
    if (shengMap[b] === a) return '生我';
    if (keMap[a] === b) return '我克';
    if (keMap[b] === a) return '克我';
    return '未知';
  }
  
  // 值符星旺衰（落宫五行生克）
  var zhiFuWangShuai = '';
  var zhiFuRelation = judgeWXRelation2(zhiFuStarEle, zhiFuGongEle);
  if (zhiFuRelation === '比和') { zhiFuWangShuai = '旺（星宫同气，力量充沛）'; }
  else if (zhiFuRelation === '生我') { zhiFuWangShuai = '相（宫生星，得地有力）'; }
  else if (zhiFuRelation === '我生') { zhiFuWangShuai = '休（星生宫，泄气减力）'; }
  else if (zhiFuRelation === '克我') { zhiFuWangShuai = '囚（宫克星，受制无力）'; }
  else if (zhiFuRelation === '我克') { zhiFuWangShuai = '死（星克宫，不得地）'; }
  
  // 值使门吉凶（门宫关系）
  var zhiShiMenJiXiong = '';
  var zhiShiRelation = judgeWXRelation2(zhiShiMenEle, zhiFuGongEle);
  var menJiMap = {休:'吉',生:'吉',开:'吉',伤:'凶',杜:'凶',景:'平',死:'凶',惊:'凶'};
  var menJi = menJiMap[zhiShiMen] || '平';
  if (zhiShiRelation === '生我' || zhiShiRelation === '比和') {
    zhiShiMenJiXiong = menJi + '（门宫相生，力量增强）';
  } else if (zhiShiRelation === '克我') {
    zhiShiMenJiXiong = menJi + '（门迫，力量受制）';
  } else if (zhiShiRelation === '我克') {
    zhiShiMenJiXiong = menJi + '（宫制门，力量减弱）';
  } else {
    zhiShiMenJiXiong = menJi + '（门宫相泄）';
  }
  
  // 三奇六仪组合分析
  var qiYiCombos = [];
  for (var p2 = 1; p2 <= 9; p2++) {
    if (p2 === 5) continue;
    var tp2 = panData.tianpan[p2] || '';
    var dp2 = panData.dipan[p2] || '';
    if (tp2 && dp2 && tp2 !== dp2) {
      var combo = tp2 + '+' + dp2;
      var comboText = '';
      // 十个常见三奇六仪组合
      var comboLib = {
        '乙+戊': {name:'青龙合会', type:'吉', text:'日奇与戊土相会，谋事可成，利于合作求财。'},
        '乙+奇': {name:'日奇得使', type:'吉', text:'乙奇逢吉门，宜为祈福、求医、和解之事。'},
        '丙+戊': {name:'飞鸟跌穴', type:'吉', text:'月奇逢戊，谋为吉事，出行求财大吉。'},
        '丙+乙': {name:'日月并行', type:'吉', text:'日月相会，公谋私为皆吉。'},
        '丁+戊': {name:'青龙转光', type:'吉', text:'星奇逢戊，贵人升迁，求名求利皆吉。'},
        '戊+丙': {name:'青龙返首', type:'吉', text:'戊加丙奇，为大吉之格，谋为凡事皆吉。'},
        '戊+乙': {name:'青龙合灵', type:'平', text:'戊乙相合，事可缓图，不宜急进。'},
        '戊+丁': {name:'青龙耀明', type:'吉', text:'戊加星奇，谒贵求名大吉。'},
        '乙+辛': {name:'青龙逃走', type:'凶', text:'日奇被辛金克制，谋事不成，破财。'},
        '丙+庚': {name:'荧入太白', type:'凶', text:'丙奇入庚，贼来劫财，宜防盗窃。'},
        '丁+庚': {name:'星奇入墓', type:'凶', text:'丁奇逢庚，文书阻隔，谋事不顺。'},
        '戊+庚': {name:'值符飞宫', type:'凶', text:'戊加庚，吉事转凶，宜改图谋。'},
        '庚+戊': {name:'太白入荧', type:'凶', text:'庚加戊，贼来劫财，宜防守。'},
        '庚+丙': {name:'太白入荧', type:'凶', text:'庚加丙，贼来劫财，同上。'},
        '庚+乙': {name:'太白逢星', type:'凶', text:'庚加乙，合而不化，谋事多阻。'},
        '庚+辛': {name:'白虎干格', type:'凶', text:'庚加辛，主刑伤血光，不宜远行。'}
      };
      if (comboLib[combo]) {
        qiYiCombos.push({gong:p2, combo:combo, name:comboLib[combo].name, type:comboLib[combo].type, text:comboLib[combo].text});
      }
    }
  }
  
  // 组装值符值使详情
  var zfzsContent = '值符落<b>' + zhiFuGong + '宫</b>(' + (JIU_GONG_NAME[zhiFuGong]||'') + '宫) — <b>' + (STARS_FULL[zhiFuStar]||zhiFuStar) + '</b><br>';
  zfzsContent += '值符星五行<b>' + zhiFuStarEle + '</b>，落宫五行<b>' + zhiFuGongEle + '</b>，' + zhiFuRelation + '→旺衰：<b>' + zhiFuWangShuai + '</b><br>';
  zfzsContent += '值使：<b>' + (MEN_FULL[zhiShiMen]||zhiShiMen) + '</b>门，五行<b>' + zhiShiMenEle + '</b>，门宫' + zhiShiRelation + '→吉凶：<b>' + zhiShiMenJiXiong + '</b>';
  if (qiYiCombos.length > 0) {
    zfzsContent += '<br><b>三奇六仪组合：</b>';
    for (var qc = 0; qc < qiYiCombos.length; qc++) {
      var c = qiYiCombos[qc];
      var cColor = c.type === '吉' ? '#27ae60' : c.type === '凶' ? '#e74c3c' : '#f39c12';
      zfzsContent += '<br><span style="color:' + cColor + '">' + c.gong + '宫 ' + c.combo + ' ' + c.name + '(' + c.type + ')：' + c.text + '</span>';
    }
  }
  result.details.push({
    label: '值符值使深度分析',
    content: zfzsContent
  });
  
  // 2. 天地盘
  var dpParts = [];
  for (var p = 1; p <= 9; p++) {
    if (p === 5) continue;
    var dp = panData.dipan[p] || '';
    var tp = panData.tianpan[p] || '';
    dpParts.push(p + '宫(' + JIU_GONG_NAME[p] + '): 天' + tp + '地' + dp);
  }
  result.details.push({ label: '天地盘', content: dpParts.join('  ') });
  
  // 3. 八门
  var menParts = [];
  for (var p = 1; p <= 9; p++) {
    if (p === 5) continue;
    if (panData.men[p]) menParts.push(p + '宫:' + MEN_FULL[panData.men[p]]);
  }
  result.details.push({ label: '八门', content: menParts.join('  ') });
  
  // 4. 九星
  var starParts = [];
  for (var p = 1; p <= 9; p++) {
    if (panData.stars[p]) {
      var sn = STARS_FULL[panData.stars[p]] || panData.stars[p];
      starParts.push(p + '宫:' + sn);
    }
  }
  result.details.push({ label: '九星', content: starParts.join('  ') });
  
  // 5. 八神
  var shenParts = [];
  for (var p = 1; p <= 9; p++) {
    if (p === 5) continue;
    if (panData.shen[p]) shenParts.push(p + '宫:' + panData.shen[p]);
  }
  result.details.push({ label: '八神', content: shenParts.join('  ') });
  
  // 6. 空亡
  if (panData.kongWang && panData.kongWang.length > 0) {
    result.details.push({ label: '空亡', content: panData.kongWang.join('宫、') + '宫' });
  }
  
  // 7. 马星
  if (panData.maXing) {
    result.details.push({ label: '马星', content: '马星临' + panData.maXing + '宫(' + JIU_GONG_NAME[panData.maXing] + '宫)' });
  }
  
  // 8. 格局详情
  if (geju.length > 0) {
    var gejuDetail = geju.map(function(g) {
      return '[' + (g.type === '吉' ? '✅' : g.type === '凶' ? '❌' : '➖') + g.name + '] ' + g.desc;
    }).join('\n');
    result.details.push({ label: '格局详情', content: gejuDetail });
  }
  
  return result;
}

// ─── 导出 ────────────────────────────────────────────────────────

window.QimenV3 = {
  // 核心排盘
  qimenCalcV3: qimenCalcV3,
  getDunJu: getDunJu,
  getJieqiPrecise: getJieqiPrecise,
  arrangeDiPan: arrangeDiPan,
  arrangeTianPan: arrangeTianPan,
  arrangeMen: arrangeMen,
  arrangeStars: arrangeStars,
  arrangeShen: arrangeShen,
  
  // 分析
  getGeju: getGeju,
  getWuBuYu: getWuBuYu,
  analyzeQimenFull: analyzeQimenFull,
  
  // 辅助
  getKongWang: getKongWang,
  getMaXing: getMaXing,
  getDayGanZhi: getDayGanZhi,
  getHourGanZhi: getHourGanZhi,
  solarLongitude: solarLongitude,
  toJulianDay: toJulianDay,
  
  // 常量
  JIEQI_JU_TABLE: JIEQI_JU_TABLE,
  JIEQI_ORDER: JIEQI_ORDER,
  JIEQI_LONGITUDE: JIEQI_LONGITUDE,
  BAGUA: BAGUA,
  JIU_GONG: JIU_GONG,
  JIU_GONG_NAME: JIU_GONG_NAME,
  JIU_GONG_FANGWEI: JIU_GONG_FANGWEI,
  STEMS: STEMS,
  BRANCHES: BRANCHES,
  GAN_ZHI: GAN_ZHI,
  LIU_YI: LIU_YI,
  SAN_QI: SAN_QI,
  LIU_SAN_ALL: LIU_SAN_ALL,
  MEN_ORIG: MEN_ORIG,
  MEN_NAMES: MEN_NAMES,
  MEN_FULL: MEN_FULL,
  STARS_ORIG: STARS_ORIG,
  STARS_NAMES: STARS_NAMES,
  STARS_FULL: STARS_FULL,
  SHEN_NAMES: SHEN_NAMES,
  GAN_WX: GAN_WX,
  ZHI_GONG: ZHI_GONG,
  XUN_YI: XUN_YI
};

})();
// ════════════════════════════════════════════════════════════════
//  引擎 6/6: ZiweiV3
// ════════════════════════════════════════════════════════════════

(function() {
'use strict';

/**
 * ═══════════════════════════════════════════════════════════════
 * 紫微斗数排盘引擎 V3 — 严格依据《紫微斗数全书》《太微赋》古法实现
 * ═══════════════════════════════════════════════════════════════
 *
 * 参考经典：
 *   《紫微斗数全书》  — 命宫定位、安星法、四化、格局
 *   《太微赋》         — 格局论断、星曜组合
 *   《紫微斗数精成》   — 定局、安紫微、辅星煞星
 *
 * 校准要点：
 *   1. 命宫：寅起正月，顺数月，逆数时
 *   2. 身宫：寅起正月，顺数月，顺数时
 *   3. 定局：命宫干支纳音五行 → 水二木三金四土五火六
 *   4. 安紫微：生日÷局数，查表定宫位
 *   5. 紫微系逆行：紫微→天机(隔1)→太阳(隔2)→武曲(隔1)→天同(隔1)→廉贞(隔3)
 *   6. 天府系顺行：天府→太阴→贪狼→巨门→天相→天梁→七杀→破军(隔3)
 *   7. 天府与紫微以寅申线对称：天府 = (4 - ziweiPos + 12) % 12  ← 校准为寅=2基准
 *   8. 年干四化：甲廉破武阳、乙机梁紫阴...（十组）
 *   9. 辅星：左辅/右弼（月起）、文昌/文曲（时起）、天魁/天钺（日干）
 *  10. 煞星：擎羊/陀罗（年干禄前/后）、火星/铃星（年支起寅）
 *  11. 大运：从命宫起，阳男阴女顺行，阴男阳女逆行，每宫10年
 *
 * @version 3.0.0
 * @date 2026-07-14
 */

// ═══════════════════════════════════════════════════════════════
// 常量定义
// ═══════════════════════════════════════════════════════════════

/** 十天干 */
const STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];

/** 十二地支 */
const BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

/** 十二宫名称（逆时针排列：命宫→兄弟→夫妻→...→父母） */
const ZW_GONGS = ['命宫','兄弟','夫妻','子女','财帛','疾厄','迁移','仆役','官禄','田宅','福德','父母'];

/** 十四主星 */
const ZW_STARS = [
  '紫微','天机','太阳','武曲','天同','廉贞',  // 紫微系
  '天府','太阴','贪狼','巨门','天相','天梁','七杀','破军'  // 天府系
];

/** 地支索引: 子=0, 丑=1, 寅=2, ... 亥=11 */

/** 五行局名 → 局数 */
const JU_MAP = { '水':2, '木':3, '金':4, '土':5, '火':6 };

/** 局数 → 五行局名 */
const JU_REVERSE = { 2:'水二局', 3:'木三局', 4:'金四局', 5:'土五局', 6:'火六局' };

/**
 * 六十甲子纳音五行（每对干支共享同一纳音）
 * 《紫微斗数精成》纳音表，索引 = 甲子序号 ÷ 2 取整
 * 0:金 1:火 2:木 3:土 4:金 5:火 6:水 7:土 8:金 9:木 10:水 11:土
 * 12:火 13:木 14:水 15:金 16:火 17:木 18:土 19:金 20:火 21:水 22:土 23:金
 * 24:木 25:水 26:土 27:火 28:木 29:水
 */
const NAYIN_WUXING = [
  '金','火','木','土','金','火','水','土','金','木',
  '水','土','火','木','水','金','火','木','土','金',
  '火','水','土','金','木','水','土','火','木','水'
];

/**
 * 年干四化表
 * 《紫微斗数全书》：「甲廉破武阳、乙机梁紫阴、丙同机昌廉、丁阴同机巨、
 *   戊贪阴阳机、己武贪梁曲、庚阳武阴同、辛巨阳曲昌、壬梁紫左武、癸破巨阴贪」
 */
const SIHUA_TABLE = {
  '甲': { lu:'廉贞', quan:'破军', ke:'武曲', ji:'太阳' },
  '乙': { lu:'天机', quan:'天梁', ke:'紫微', ji:'太阴' },
  '丙': { lu:'天同', quan:'天机', ke:'文昌', ji:'廉贞' },
  '丁': { lu:'太阴', quan:'天同', ke:'天机', ji:'巨门' },
  '戊': { lu:'贪狼', quan:'太阴', ke:'右弼', ji:'天机' },
  '己': { lu:'武曲', quan:'贪狼', ke:'天梁', ji:'文曲' },
  '庚': { lu:'太阳', quan:'武曲', ke:'太阴', ji:'天同' },
  '辛': { lu:'巨门', quan:'太阳', ke:'文曲', ji:'文昌' },
  '壬': { lu:'天梁', quan:'紫微', ke:'左辅', ji:'武曲' },
  '癸': { lu:'破军', quan:'巨门', ke:'太阴', ji:'贪狼' }
};

/**
 * 安紫微星查表
 * 《紫微斗数精成》安紫微表
 * 行=局数(2~6), 列=生日(1~30), 值=紫微所在宫位(1~12, 1=子)
 */
const ZIWEI_POS_TABLE = {
  2: [1,2,2,3,3,4,5,5,6,6,7,8,8,9,9,10,11,11,12,12,1,2,2,3,3,4,5,5,6,6],
  3: [2,3,4,4,5,6,6,7,8,8,9,10,10,11,12,12,1,2,2,3,4,4,5,6,6,7,8,8,9,10],
  4: [3,4,5,6,6,7,8,9,9,10,11,12,12,1,2,3,3,4,5,6,6,7,8,9,9,10,11,12,12,1],
  5: [4,5,6,7,8,8,9,10,11,12,12,1,2,3,4,4,5,6,7,8,8,9,10,11,12,12,1,2,3,4],
  6: [5,6,7,8,9,10,11,12,12,1,2,3,4,4,5,6,7,8,9,10,11,12,12,1,2,3,4,4,5,6]
};

/**
 * 五虎遁：年干 → 正月（寅月）天干起始
 * 甲己起丙寅, 乙庚起戊寅, 丙辛起庚寅, 丁壬起壬寅, 戊癸起甲寅
 */
const WUHU_START = { 0:2, 5:2, 1:4, 6:4, 2:6, 7:6, 3:8, 8:8, 4:0, 9:0 };

/** 天干禄位（禄存所在宫位索引） */
const GAN_LU_POS = { 0:2, 1:3, 2:5, 3:6, 4:5, 5:6, 6:8, 7:9, 8:11, 9:0 };

/**
 * 年支三合局索引
 * 0=申子辰, 1=巳酉丑, 2=寅午戌, 3=亥卯未
 */
function getSanheIdx(zhiIdx) {
  // 子(0)→0, 丑(1)→1, 寅(2)→2, 卯(3)→3, 辰(4)→0, 巳(5)→1
  // 午(6)→2, 未(7)→3, 申(8)→0, 酉(9)→1, 戌(10)→2, 亥(11)→3
  return zhiIdx % 4;
}

/** 火星起始宫位（按三合局） */
const HUO_START = { 0:3, 1:3, 2:1, 3:9 };
/** 铃星起始宫位（按三合局） */
const LING_START = { 0:1, 1:1, 2:3, 3:10 };

/** 天魁（昼贵）查表：日干 → 宫位索引 */
const TIANKUI_MAP = { 0:1, 4:1, 6:1, 1:0, 5:0, 2:11, 3:11, 8:5, 9:5, 7:6 };
/** 天钺（夜贵）查表：日干 → 宫位索引 */
const TIANYUE_MAP = { 0:7, 4:7, 6:7, 1:8, 5:8, 2:9, 3:9, 8:3, 9:3, 7:2 };

/** 天刑查表：日干 → 宫位索引 */
const TIANXING_MAP = { 0:9, 1:10, 2:11, 3:0, 4:1, 5:2, 6:3, 7:4, 8:5, 9:6 };

/** 天马查表：三合局 → 宫位索引 */
const TIANMA_MAP = { 0:8, 1:11, 2:2, 3:5 };

/** 解神查表：月份 → 宫位索引 */
const JIESHEN_MAP = [10,10,1,1,4,4,7,7,10,10,1,1];

/**
 * 庙旺平陷表
 * 《紫微斗数全书》十四主星在十二宫的强度
 * 3=庙, 2=旺, 1=平, 0=陷
 */
const STAR_STRENGTH = {
  '紫微': [2,2,3,2,1,1,2,2,3,2,1,1],
  '天机': [1,1,2,3,2,1,1,1,2,3,2,1],
  '太阳': [0,1,1,2,3,3,2,1,1,2,3,3],
  '武曲': [2,1,1,1,2,3,2,1,1,1,2,3],
  '天同': [3,2,1,1,1,2,3,2,1,1,1,2],
  '廉贞': [1,1,1,2,3,2,1,1,1,2,3,2],
  '天府': [3,3,2,1,1,1,2,3,3,2,1,1],
  '太阴': [3,2,1,1,1,0,1,2,3,2,1,1],
  '贪狼': [1,2,3,2,1,1,1,2,3,2,1,1],
  '巨门': [1,1,1,2,3,2,1,1,1,2,3,2],
  '天相': [2,3,2,1,1,1,2,3,2,1,1,1],
  '天梁': [1,1,2,3,2,1,1,1,2,3,2,1],
  '七杀': [2,1,1,1,2,3,2,1,1,1,2,3],
  '破军': [1,1,1,2,3,2,1,1,1,2,3,2]
};

const STRENGTH_LABELS = ['陷','平','旺','庙'];

// ═══════════════════════════════════════════════════════════════
// 工具函数
// ═══════════════════════════════════════════════════════════════

/** 取模（保证非负） */
function mod(n, m) { return ((n % m) + m) % m; }

/** 时辰索引: 子=0, 丑=1, ... 亥=11 */
function getHourIdx(birthHour) {
  return Math.floor((birthHour + 1) / 2) % 12;
}

/** 获取日干支序号（0-59），基于 1900-01-01 = 甲子日 */
function getDayGzIdx(year, month, day) {
  const baseDate = new Date(1900, 0, 1);
  const dayDiff = Math.floor((new Date(year, month - 1, day) - baseDate) / 86400000);
  return ((dayDiff % 60) + 60) % 60;
}

// ═══════════════════════════════════════════════════════════════
// 核心排盘函数
// ═══════════════════════════════════════════════════════════════

/**
 * 命宫定位
 * 《紫微斗数全书》：「寅起正月，顺数月，逆数时 → 命宫」
 * 寅=2 为正月起点，顺数到生月，再从该位逆数时辰
 * @param {number} birthMonth - 农历月（1-12）
 * @param {number} birthHour - 出生小时（0-23）
 * @returns {number} 命宫地支索引（0=子, 2=寅, ...）
 */
function getMingGong(birthMonth, birthHour) {
  const hourIdx = getHourIdx(birthHour);
  const yinIdx = 2; // 寅=2
  // 寅起正月，顺数月：正月寅、二月卯、三月辰...
  // 再从月支位逆数时：子时在该位，丑时逆一位...
  return mod(yinIdx + (birthMonth - 1) - hourIdx, 12);
}

/**
 * 身宫定位
 * 《紫微斗数全书》：「寅起正月，顺数月，顺数时 → 身宫」
 * @param {number} birthMonth - 农历月（1-12）
 * @param {number} birthHour - 出生小时（0-23）
 * @returns {number} 身宫地支索引
 */
function getShenGong(birthMonth, birthHour) {
  const hourIdx = getHourIdx(birthHour);
  const yinIdx = 2;
  // 寅起正月顺数月，再顺数时
  return mod(yinIdx + (birthMonth - 1) + hourIdx, 12);
}

/**
 * 定五行局
 * 《紫微斗数精成》：命宫天干 → 纳音五行 → 局数
 * 水二局、木三局、金四局、土五局、火六局
 * @param {number} mingGanIdx - 命宫天干索引（0-9）
 * @param {number} mingZhiIdx - 命宫地支索引（0-11）
 * @returns {number} 局数（2,3,4,5,6）
 */
function getJu(mingGanIdx, mingZhiIdx) {
  // 在六十甲子中找到命宫干支的序号
  let jiaziIdx = -1;
  for (let i = 0; i < 60; i++) {
    if (i % 10 === mingGanIdx % 10 && i % 12 === mingZhiIdx % 12) {
      jiaziIdx = i;
      break;
    }
  }
  if (jiaziIdx < 0) return 2;
  const pairIdx = Math.floor(jiaziIdx / 2);
  const nayin = NAYIN_WUXING[pairIdx];
  return JU_MAP[nayin] || 2;
}

/**
 * 安紫微星
 * 《紫微斗数精成》安紫微表：生日÷局数，查表定紫微宫位
 * @param {number} ju - 局数（2-6）
 * @param {number} day - 农历日（1-30）
 * @returns {number} 紫微星所在宫位索引（0=子, 1=丑, ...）
 */
function anZiwei(ju, day) {
  const table = ZIWEI_POS_TABLE[ju];
  if (!table || day < 1 || day > 30) return 0;
  return table[day - 1] - 1; // 1-based转0-based
}

/**
 * 安主星
 * 紫微系逆行，天府系顺行
 * @param {number} ziweiPos - 紫微星宫位索引
 * @returns {{ziweiXi: Array, tianfuXi: Array, tianfuPos: number, stars: Array}}
 */
function anStars(ziweiPos) {
  // 天府与紫微以寅申线对称
  // 寅=2, 申=8, 对称轴在寅申中间(5)
  // 天府 = (4 - ziweiPos + 12) % 12  ← 以寅=2为基准的对称公式
  // 校准：紫微在寅(2)→天府在寅(2)；紫微在卯(3)→天府在丑(1)；紫微在子(0)→天府在辰(4)
  // 公式验证：(4 - 2 + 12) % 12 = 2 ✓; (4 - 3 + 12) % 12 = 1 ✓; (4 - 0 + 12) % 12 = 4 ✓
  const tianfuPos = mod(4 - ziweiPos, 12);

  // 紫微系星曜（逆行安星）
  // 《紫微斗数全书》：紫微→天机(隔1)→太阳(隔2)→武曲(隔1)→天同(隔1)→廉贞(隔3)
  const ziweiXi = [
    { name:'紫微', offset:0 },
    { name:'天机', offset:-1 },
    { name:'太阳', offset:-3 },  // 天机隔2到太阳: -1-2=-3
    { name:'武曲', offset:-4 },  // 太阳隔1到武曲: -3-1=-4
    { name:'天同', offset:-5 },  // 武曲隔1到天同: -4-1=-5
    { name:'廉贞', offset:-8 }   // 天同隔3到廉贞: -5-3=-8
  ];

  // 天府系星曜（顺行安星）
  // 《紫微斗数全书》：天府→太阴→贪狼→巨门→天相→天梁→七杀→破军(隔3)
  const tianfuXi = [
    { name:'天府', offset:0 },
    { name:'太阴', offset:1 },
    { name:'贪狼', offset:2 },
    { name:'巨门', offset:3 },
    { name:'天相', offset:4 },
    { name:'天梁', offset:5 },
    { name:'七杀', offset:6 },
    { name:'破军', offset:10 }  // 七杀隔3到破军: 6+4=10（隔3即间隔4位）
  ];

  return { ziweiXi, tianfuXi, tianfuPos };
}

/**
 * 四化
 * 《紫微斗数全书》年干四化表
 * @param {string} yearGan - 年干（甲-癸）
 * @returns {{lu:string, quan:string, ke:string, ji:string}}
 */
function getSihua(yearGan) {
  return SIHUA_TABLE[yearGan] || SIHUA_TABLE['甲'];
}

/**
 * 辅星排布
 * 左辅/右弼（月起）、文昌/文曲（时起）、天魁/天钺（日干）
 * @param {number} birthMonth - 月（1-12）
 * @param {number} hourIdx - 时辰索引（0-11）
 * @param {number} dayGanIdx - 日干索引（0-9）
 * @returns {object} 辅星宫位
 */
function getAuxStars(birthMonth, hourIdx, dayGanIdx) {
  // 左辅：正月从辰(4)起顺行
  const zuofu = mod(4 + birthMonth - 1, 12);
  // 右弼：正月从戌(10)起逆行
  const youbi = mod(10 - (birthMonth - 1), 12);
  // 文昌：子时从戌(10)起逆行
  const wenchang = mod(10 - hourIdx, 12);
  // 文曲：子时从辰(4)起顺行
  const wenqu = mod(4 + hourIdx, 12);
  // 天魁（昼贵）：按日干查
  const tiankui = TIANKUI_MAP[dayGanIdx];
  // 天钺（夜贵）：按日干查
  const tianyue = TIANYUE_MAP[dayGanIdx];

  return { zuofu, youbi, wenchang, wenqu, tiankui, tianyue };
}

/**
 * 煞星排布
 * 擎羊/陀罗（年干禄前/后）、火星/铃星（年支起寅）、地空/地劫
 * @param {number} yearGanIdx - 年干索引（0-9）
 * @param {number} yearZhiIdx - 年支索引（0-11）
 * @param {number} hourIdx - 时辰索引
 * @param {number} dayGanIdx - 日干索引
 * @param {number} birthMonth - 月
 * @returns {object} 煞星宫位
 */
function getShaStars(yearGanIdx, yearZhiIdx, hourIdx, dayGanIdx, birthMonth) {
  // 擎羊：年干禄前一位
  const lu = GAN_LU_POS[yearGanIdx];
  const qingyang = mod(lu + 1, 12);
  // 陀罗：年干禄后一位
  const tuoluo = mod(lu - 1, 12);

  // 地空/地劫：子时从亥(11)起，空逆劫顺
  const dikong = mod(11 - hourIdx, 12);
  const dijie = mod(11 + hourIdx, 12);

  // 火星/铃星：年支三合局起寅
  const sanhe = getSanheIdx(yearZhiIdx);
  const huoxing = mod(HUO_START[sanhe] + hourIdx, 12);
  const lingxing = mod(LING_START[sanhe] + hourIdx, 12);

  // 天马：按年支三合局
  const tianma = TIANMA_MAP[sanhe];

  // 解神：按月查
  const jieshen = JIESHEN_MAP[birthMonth - 1] !== undefined ? JIESHEN_MAP[birthMonth - 1] : 10;

  // 天刑：按日干查
  const tianxing = TIANXING_MAP[dayGanIdx];

  // 红鸾：从卯(3)起逆数年支
  const hongluan = mod(3 - yearZhiIdx, 12);
  // 天喜：红鸾对宫
  const tianxi = mod(hongluan + 6, 12);

  return { qingyang, tuoluo, dikong, dijie, huoxing, lingxing,
           tianma, jieshen, tianxing, hongluan, tianxi };
}

/**
 * 大运计算
 * 《紫微斗数全书》：大运从命宫起，阳男阴女顺行，阴男阳女逆行，每宫10年
 * 起运年龄 = 局数
 * @param {number} mingIdx - 命宫索引
 * @param {number} ju - 局数
 * @param {string} yearGan - 年干
 * @param {string} sex - 'male' 或 'female'
 * @param {number} birthYear - 出生年
 * @returns {Array} 大运列表
 */
function getDayun(mingIdx, ju, yearGan, sex, birthYear) {
  const isYangStem = ['甲','丙','戊','庚','壬'].includes(yearGan);
  const isMale = sex === 'male';
  const isForward = (isYangStem && isMale) || (!isYangStem && !isMale);

  const daxianList = [];
  for (let i = 0; i < 12; i++) {
    const pos = isForward ? mod(mingIdx + i, 12) : mod(mingIdx - i, 12);
    const startAge = ju + i * 10;
    const endAge = startAge + 9;
    daxianList.push({
      gong: ZW_GONGS[i],
      pos: pos,
      gongZhi: BRANCHES[pos],
      startAge,
      endAge,
      ageRange: startAge + '-' + endAge + '岁'
    });
  }
  return daxianList;
}

// ═══════════════════════════════════════════════════════════════
// 完整排盘
// ═══════════════════════════════════════════════════════════════

/**
 * 紫微斗数完整排盘 V3
 * @param {number} birthYear - 出生年（公历）
 * @param {number} birthMonth - 农历月（1-12）
 * @param {number} birthDay - 农历日（1-30）
 * @param {number} birthHour - 出生小时（0-23）
 * @param {string} sex - 'male' 或 'female'
 * @returns {object} 完整排盘数据
 */
function ziweiCalcV3(birthYear, birthMonth, birthDay, birthHour, sex) {
  const hourIdx = getHourIdx(birthHour);
  const yearGanIdx = mod(birthYear - 4, 10);
  const yearZhiIdx = mod(birthYear - 4, 12);
  const yearGan = STEMS[yearGanIdx];
  const yearZhi = BRANCHES[yearZhiIdx];

  // 1. 命宫/身宫
  const mingIdx = getMingGong(birthMonth, birthHour);
  const shenIdx = getShenGong(birthMonth, birthHour);

  // 2. 命宫天干（五虎遁）
  const tigerStartGan = WUHU_START[yearGanIdx] !== undefined ? WUHU_START[yearGanIdx] : 2;
  const mingGanIdx = mod(tigerStartGan + mingIdx - 2, 10); // 从寅(2)起数到命宫地支

  // 3. 定局
  const ju = getJu(mingGanIdx, mingIdx);
  const juName = JU_REVERSE[ju] || (ju + '局');

  // 4. 安紫微
  const ziweiPos = anZiwei(ju, birthDay);

  // 5. 安主星
  const starLayout = anStars(ziweiPos);
  const tianfuPos = starLayout.tianfuPos;

  // 6. 建立星曜分布表
  const stars = Array(12).fill(null).map(() => []);
  for (const s of starLayout.ziweiXi) {
    stars[mod(ziweiPos + s.offset, 12)].push(s.name);
  }
  for (const s of starLayout.tianfuXi) {
    stars[mod(tianfuPos + s.offset, 12)].push(s.name);
  }

  // 7. 四化
  const sihua = getSihua(yearGan);

  // 8. 日干支
  const dayGzIdx = getDayGzIdx(birthYear, birthMonth, birthDay);
  const dayGanIdx = dayGzIdx % 10;

  // 9. 辅星
  const auxStars = getAuxStars(birthMonth, hourIdx, dayGanIdx);
  if (auxStars.zuofu !== undefined) stars[auxStars.zuofu].push('左辅');
  if (auxStars.youbi !== undefined) stars[auxStars.youbi].push('右弼');
  if (auxStars.wenchang !== undefined) stars[auxStars.wenchang].push('文昌');
  if (auxStars.wenqu !== undefined) stars[auxStars.wenqu].push('文曲');
  if (auxStars.tiankui !== undefined) stars[auxStars.tiankui].push('天魁');
  if (auxStars.tianyue !== undefined) stars[auxStars.tianyue].push('天钺');

  // 10. 煞星
  const shaStars = getShaStars(yearGanIdx, yearZhiIdx, hourIdx, dayGanIdx, birthMonth);
  if (shaStars.qingyang !== undefined) stars[shaStars.qingyang].push('擎羊');
  if (shaStars.tuoluo !== undefined) stars[shaStars.tuoluo].push('陀罗');
  if (shaStars.dikong !== undefined) stars[shaStars.dikong].push('地空');
  if (shaStars.dijie !== undefined) stars[shaStars.dijie].push('地劫');
  if (shaStars.huoxing !== undefined) stars[shaStars.huoxing].push('火星');
  if (shaStars.lingxing !== undefined) stars[shaStars.lingxing].push('铃星');
  if (shaStars.tianma !== undefined) stars[shaStars.tianma].push('天马');
  if (shaStars.jieshen !== undefined) stars[shaStars.jieshen].push('解神');
  if (shaStars.tianxing !== undefined) stars[shaStars.tianxing].push('天刑');
  if (shaStars.hongluan !== undefined) stars[shaStars.hongluan].push('红鸾');
  if (shaStars.tianxi !== undefined) stars[shaStars.tianxi].push('天喜');

  // 11. 宫位映射
  const gongMap = {};
  for (let i = 0; i < 12; i++) {
    gongMap[ZW_GONGS[i]] = mod(mingIdx - i, 12);
  }

  // 12. 大运
  const dayun = getDayun(mingIdx, ju, yearGan, sex, birthYear);

  // 13. 四化落宫
  const sihuaPalaces = [];
  for (let i = 0; i < 12; i++) {
    const sList = stars[i] || [];
    if (sList.includes(sihua.lu)) {
      sihuaPalaces.push({ star: sihua.lu, type: '化禄', pos: i, gong: getGongNameByPos(i, gongMap) });
    }
    if (sList.includes(sihua.quan)) {
      sihuaPalaces.push({ star: sihua.quan, type: '化权', pos: i, gong: getGongNameByPos(i, gongMap) });
    }
    if (sList.includes(sihua.ke)) {
      sihuaPalaces.push({ star: sihua.ke, type: '化科', pos: i, gong: getGongNameByPos(i, gongMap) });
    }
    if (sList.includes(sihua.ji)) {
      sihuaPalaces.push({ star: sihua.ji, type: '化忌', pos: i, gong: getGongNameByPos(i, gongMap) });
    }
  }

  // 14. 当前大运
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;
  const currentDayun = dayun.find(d => age >= d.startAge && age <= d.endAge) || dayun[0];

  return {
    birthYear, birthMonth, birthDay, birthHour, sex,
    yearGan, yearZhi, yearGanZhi: yearGan + yearZhi,
    hourIdx, hourName: BRANCHES[hourIdx] + '时',
    mingIdx, shenIdx,
    mingGan: STEMS[mingGanIdx],
    mingGanZhi: STEMS[mingGanIdx] + BRANCHES[mingIdx],
    shenGanZhi: STEMS[mod(tigerStartGan + shenIdx - 2, 10)] + BRANCHES[shenIdx],
    mingZhi: BRANCHES[mingIdx],
    shenZhi: BRANCHES[shenIdx],
    ju, juName,
    ziweiPos, tianfuPos,
    stars, gongMap,
    sihua, sihuaPalaces,
    auxStars, shaStars,
    dayun, currentDayun,
    starLayout: { ziweiXi: starLayout.ziweiXi, tianfuXi: starLayout.tianfuXi }
  };
}

/**
 * 通过宫位索引获取宫名
 */
function getGongNameByPos(pos, gongMap) {
  for (const name in gongMap) {
    if (gongMap[name] === pos) return name;
  }
  return BRANCHES[pos] + '宫';
}

// ═══════════════════════════════════════════════════════════════
// 分析函数
// ═══════════════════════════════════════════════════════════════

/**
 * 三方四正分析
 * 命宫 + 对宫(迁移) + 财帛 + 官禄 = 三方四正
 * @param {object} panData - 排盘数据
 * @returns {object} 三方四正分析结果
 */
function analyzeSanfang(panData) {
  const mingPos = panData.gongMap['命宫'];
  const opp = mod(mingPos + 6, 12);       // 对宫=迁移
  const caiwei = mod(mingPos + 4, 12);    // 财帛
  const guanlu = mod(mingPos + 5, 12);    // 官禄 (命宫逆时针5位)

  const mingStars = panData.stars[mingPos] || [];
  const qianyiStars = panData.stars[opp] || [];
  const caiweiStars = panData.stars[caiwei] || [];
  const guanluStars = panData.stars[guanlu] || [];

  // 三方四正合计星曜
  const allStars = [...mingStars, ...qianyiStars, ...caiweiStars, ...guanluStars];
  const starSet = new Set(allStars);

  // 庙旺平陷评估
  const mingStrength = mingStars.map(s => {
    const table = STAR_STRENGTH[s];
    if (!table) return { star: s, strength: 1, label: '平' };
    const v = table[mingPos];
    return { star: s, strength: v, label: STRENGTH_LABELS[v] || '平' };
  });

  return {
    mingPos, opp, caiwei, guanlu,
    mingStars, qianyiStars, caiweiStars, guanluStars,
    allStars, starSet,
    mingStrength,
    mingGong: '命宫(' + BRANCHES[mingPos] + ')',
    qianyiGong: '迁移(' + BRANCHES[opp] + ')',
    caiweiGong: '财帛(' + BRANCHES[caiwei] + ')',
    guanluGong: '官禄(' + BRANCHES[guanlu] + ')',
    summary: '命宫: ' + (mingStars.join('、') || '无主星') +
             ' | 迁移: ' + (qianyiStars.join('、') || '无主星') +
             ' | 财帛: ' + (caiweiStars.join('、') || '无主星') +
             ' | 官禄: ' + (guanluStars.join('、') || '无主星')
  };
}

/**
 * 格局判断
 * 依据《紫微斗数全书》《太微赋》经典格局
 * @param {object} panData - 排盘数据
 * @returns {object} { geju: string, gejuList: Array }
 */
function getGeju(panData) {
  const sanfang = analyzeSanfang(panData);
  const mingPos = panData.gongMap['命宫'];
  const mingStars = sanfang.mingStars;
  const starSet = sanfang.starSet;
  const gejuList = [];

  // === 命宫主星格局 ===
  let mainGeju = '普通命局';
  const mainStarMap = {
    '紫微': '紫微坐命，贵气稳重',
    '天府': '天府坐命，忠厚富足',
    '太阳': '太阳坐命，光明磊落',
    '武曲': '武曲坐命，刚毅果断',
    '天同': '天同坐命，温和有福',
    '七杀': '七杀坐命，果敢有魄力',
    '破军': '破军坐命，开创力强',
    '贪狼': '贪狼坐命，多才多艺',
    '天机': '天机坐命，聪明多谋',
    '太阴': '太阴坐命，温柔细腻',
    '巨门': '巨门坐命，口才出众',
    '天相': '天相坐命，稳重正直',
    '天梁': '天梁坐命，老成持重',
    '廉贞': '廉贞坐命，能文能武'
  };
  for (const star of mingStars) {
    if (mainStarMap[star]) {
      mainGeju = mainStarMap[star];
      break;
    }
  }

  // === 经典格局检测 ===

  // 1. 紫府同宫：紫微天府同在命宫
  // 《紫微斗数全书》：「紫府同宫，终身福厚」
  if (mingStars.includes('紫微') && mingStars.includes('天府')) {
    gejuList.push({ name:'紫府同宫', text:'紫微天府同守命宫，尊贵无双，终身福厚。《全书》云：「紫府同宫，贵人也。」' });
  }

  // 2. 紫府朝垣：紫微天府在三方四正会照命宫（非同宫）
  // 《紫微斗数全书》：「紫府朝垣，食禄万钟」
  if (!mingStars.includes('紫微') && !mingStars.includes('天府')) {
    if (starSet.has('紫微') && starSet.has('天府')) {
      gejuList.push({ name:'紫府朝垣', text:'紫微天府三方四正会照命宫，主富贵双全，食禄万钟' });
    }
  }

  // 3. 日月并明：太阳太阴庙旺会照
  // 《太微赋》：「日月并明，佐九重于尧殿」
  const sunPos = panData.stars.findIndex(s => s.includes('太阳'));
  const moonPos = panData.stars.findIndex(s => s.includes('太阴'));
  if (sunPos >= 0 && moonPos >= 0) {
    const sunWang = [3,4,5,6].includes(sunPos);
    const moonWang = [9,10,11,0].includes(moonPos);
    if (sunWang && moonWang) {
      gejuList.push({ name:'日月并明', text:'太阳太阴庙旺会照，佐九重于尧殿，才华出众，名扬四海' });
    }
  }

  // 4. 杀破狼：七杀、破军、贪狼在三方四正会照
  // 《紫微斗数全书》：「杀破狼入命，开创变革之格」
  if (starSet.has('七杀') && starSet.has('破军') && starSet.has('贪狼')) {
    gejuList.push({ name:'杀破狼格', text:'七杀破军贪狼会照三方四正，主开创变革，人生起伏大，宜从事开创性工作' });
  }

  // 5. 机月同梁：天机、太阴、天同、天梁在三方四正会照
  // 《紫微斗数全书》：「机月同梁，作吏人」
  if (starSet.has('天机') && starSet.has('太阴') && starSet.has('天同') && starSet.has('天梁')) {
    gejuList.push({ name:'机月同梁格', text:'天机太阴天同天梁会照，宜文职企划，稳定发展。《全书》云：「机月同梁作吏人。」' });
  }

  // 6. 辅弼夹命：左辅右弼在命宫前后两宫
  // 《紫微斗数全书》：「左右夹命，终身福厚」
  const prevPos = mod(mingPos - 1, 12);
  const nextPos = mod(mingPos + 1, 12);
  const prevStars = panData.stars[prevPos] || [];
  const nextStars = panData.stars[nextPos] || [];
  const hasZuoFu = (arr) => arr.includes('左辅');
  const hasYouBi = (arr) => arr.includes('右弼');
  if ((hasZuoFu(prevStars) && hasYouBi(nextStars)) || (hasYouBi(prevStars) && hasZuoFu(nextStars))) {
    gejuList.push({ name:'辅弼夹命', text:'左辅右弼夹命宫，终身福厚，多贵人相助' });
  }

  // 7. 七杀朝斗：七杀在寅申子午守命
  // 《紫微斗数全书》：「七杀朝斗，爵禄荣昌」
  if (mingStars.includes('七杀') && [2,8,0,6].includes(mingPos)) {
    gejuList.push({ name:'七杀朝斗', text:'七杀在寅申子午守命，爵禄荣昌，威权显赫' });
  }

  // 8. 府相朝垣：天府天相在三方四正会照
  // 《紫微斗数全书》：「府相朝垣，富贵堪期」
  if (starSet.has('天府') && starSet.has('天相') && !mingStars.includes('天府')) {
    gejuList.push({ name:'府相朝垣', text:'天府天相三方四正会照命宫，富贵堪期，一生安稳' });
  }

  // 9. 日月反背：太阳在酉戌亥子，太阴在卯辰巳午（反位）
  // 《紫微斗数全书》：「日月反背，多劳碌」
  if (sunPos >= 0 && moonPos >= 0) {
    const sunFan = [8,9,10,11].includes(sunPos);
    const moonFan = [2,3,4,5].includes(moonPos);
    if (sunFan && moonFan) {
      gejuList.push({ name:'日月反背', text:'日月反背，阴阳失调，多劳碌辛苦，宜晚发' });
    }
  }

  // 10. 紫微在子午：紫微单守
  // 《太微赋》：「紫微在子午，君臣庆会」
  if (mingStars.includes('紫微') && (mingPos === 0 || mingPos === 6) && mingStars.length === 1) {
    gejuList.push({ name:'紫微独坐', text:'紫微独守子午宫，君臣庆会，领袖之格' });
  }

  // 11. 廉贞七杀：廉贞七杀同宫
  // 《紫微斗数全书》：「廉贞七杀，路上埋尸」（需见煞星方凶）
  if (mingStars.includes('廉贞') && mingStars.includes('七杀')) {
    gejuList.push({ name:'廉杀同宫', text:'廉贞七杀同宫，宜武职或技术工作，见煞星则需防灾厄' });
  }

  // 12. 贪狼遇火铃：贪狼与火星或铃星同宫
  // 《紫微斗数全书》：「贪狼遇火铃，将相之格」
  if (mingStars.includes('贪狼') && (mingStars.includes('火星') || mingStars.includes('铃星'))) {
    gejuList.push({ name:'火贪格', text:'贪狼遇火铃同宫，爆发横财，将相之格。《全书》云：「贪狼遇火铃，富贵声华。」' });
  }

  // 13. 文昌文曲夹命
  if ((hasStar(prevStars,'文昌') && hasStar(nextStars,'文曲')) ||
      (hasStar(prevStars,'文曲') && hasStar(nextStars,'文昌'))) {
    gejuList.push({ name:'昌曲夹命', text:'文昌文曲夹命宫，文采出众，学业有成' });
  }

  // 14. 无主星：命宫无十四主星
  if (mingStars.filter(s => ZW_STARS.includes(s)).length === 0) {
    gejuList.push({ name:'空宫借星', text:'命宫无主星，借对宫星曜论命，性格随环境变化大，宜参考迁移宫主星' });
  }

  const gejuStr = mainGeju + (gejuList.length > 0 ? ' · ' + gejuList.map(g => g.name).join(' · ') : '');

  return { geju: gejuStr, mainGeju, gejuList };
}

function hasStar(arr, star) {
  return arr && arr.includes(star);
}

/**
 * 完整分析
 * @param {object} panData - 排盘数据
 * @returns {object} 完整分析结果
 */
function analyzeZiweiFull(panData) {
  const sanfang = analyzeSanfang(panData);
  const gejuResult = getGeju(panData);
  const sihua = panData.sihua;

  // 四化详情
  const sihuaDetail = panData.sihuaPalaces.map(p =>
    p.type + '(' + p.star + ')入' + p.gong
  );

  // 庙旺评估
  const strengthSummary = sanfang.mingStrength.map(s =>
    s.star + '(' + s.label + ')'
  ).join('、');

  // 概述
  const sexText = panData.sex === 'male' ? '男命' : '女命';
  const overview = sexText + '，' + panData.yearGanZhi + '年生，' +
    panData.mingGanZhi + '命宫，' + panData.juName + '。' +
    '命宫主星: ' + (sanfang.mingStars.join('、') || '无主星') + '。' +
    '三方四正会照: ' + sanfang.allStars.join('、') + '。' +
    '庙旺: ' + strengthSummary + '。';

  // 建议
  const advice = generateAdvice(gejuResult, sihuaDetail, panData.currentDayun, sanfang);

  // 对宫/财帛/官禄详情
  const sanfangDetail = {
    命宫: sanfang.mingStars.join('、') || '无主星',
    迁移: sanfang.qianyiStars.join('、') || '无主星',
    财帛: sanfang.caiweiStars.join('、') || '无主星',
    官禄: sanfang.guanluStars.join('、') || '无主星'
  };

  // 大运列表（精简）
  const dayunList = panData.dayun.map(d => ({
    gong: d.gong,
    gongZhi: d.gongZhi,
    ageRange: d.ageRange,
    stars: (panData.stars[d.pos] || []).join('、') || '无主星'
  }));

  return {
    geju: gejuResult.geju,
    mainGeju: gejuResult.mainGeju,
    gejuList: gejuResult.gejuList,
    mingStars: sanfang.mingStars.join('、') || '无主星',
    starStrength: strengthSummary,
    mingStrength: sanfang.mingStrength,
    sanfang: sanfang.summary,
    sanfangDetail: sanfangDetail,
    sihuaText: '化禄：' + sihua.lu + '、化权：' + sihua.quan +
               '、化科：' + sihua.ke + '、化忌：' + sihua.ji,
    sihuaDetail: sihuaDetail,
    sihuaPalaces: panData.sihuaPalaces,
    dayun: dayunList,
    currentDayun: panData.currentDayun ?
      panData.currentDayun.gong + '(' + panData.currentDayun.ageRange + ') ' +
      (panData.stars[panData.currentDayun.pos] || []).join('、') : '未确定',
    overview: overview,
    advice: advice,
    juName: panData.juName,
    mingGanZhi: panData.mingGanZhi,
    shenGanZhi: panData.shenGanZhi
  };
}

/**
 * R1.4: 十二宫逐宫详析
 * 每宫输出：主星组合分析+庙旺落陷+煞星冲照+四化影响+人生方面论述
 */
function analyzeEachGong(panData) {
  const gongMap = panData.gongMap;
  const stars = panData.stars || [];
  const sihuaPalaces = panData.sihuaPalaces || [];
  const mingPos = gongMap['命宫'];

  // 十二宫名称顺序（以命宫为起点，逆时针）
  const gongOrder = ['命宫','兄弟','夫妻','子女','财帛','疾厄','迁移','交友','事业','田宅','福德','父母'];
  // 每宫对应的人生方面
  const gongAspects = {
    '命宫': {icon:'🎯', desc:'性格特质、外貌气质、先天格局、人生基调', color:'#c9a84c'},
    '兄弟': {icon:'👥', desc:'兄弟姐妹缘分、朋友关系、合伙运势', color:'#3498db'},
    '夫妻': {icon:'💕', desc:'配偶特征、婚姻质量、感情运势', color:'#e74c3c'},
    '子女': {icon:'👶', desc:'子女数量、亲子关系、生育运势', color:'#27ae60'},
    '财帛': {icon:'💰', desc:'财运格局、理财方式、财源方向', color:'#e67e22'},
    '疾厄': {icon:'🏥', desc:'健康状况、易患部位、体质特征', color:'#9b59b6'},
    '迁移': {icon:'✈️', desc:'外出运势、旅行迁移、社交能力', color:'#1abc9c'},
    '交友': {icon:'🤝', desc:'交友缘分、下属关系、人际圈层', color:'#f39c12'},
    '事业': {icon:'💼', desc:'事业方向、工作能力、职场运势', color:'#2980b9'},
    '田宅': {icon:'🏠', desc:'房产运势、家庭环境、资产积累', color:'#16a085'},
    '福德': {icon:'🧘', desc:'精神世界、兴趣爱好、内心追求', color:'#8e44ad'},
    '父母': {icon:'👴', desc:'父母缘分、长辈关系、家教背景', color:'#d35400'}
  };

  // 主星组合释义库
  const starCombos = {
    '紫微': {nature:'帝星，主尊贵权威', traits:'性格稳重，有领导力，心胸开阔。但易孤高自许，需辅星佐助方成大器。'},
    '天府': {nature:'财库之星，主稳重保守', traits:'为人踏实，善于理财，有包容力。但过于保守则错失良机。'},
    '太阳': {nature:'贵星，主光明磊落', traits:'热情慷慨，乐于助人，事业心强。庙旺则显贵，落陷则劳碌。'},
    '太阴': {nature:'母星，主温柔细腻', traits:'心思细密，有艺术天赋，重感情。庙旺则财顺，落陷则优柔。'},
    '武曲': {nature:'财星，主刚毅果断', traits:'执行力强，善于理财，性格刚直。但过于刚强易得罪人。'},
    '天同': {nature:'福星，主温和乐观', traits:'乐观开朗，知足常乐，人缘好。但过于安逸则缺乏动力。'},
    '廉贞': {nature:'次桃花星，主刚柔并济', traits:'能文能武，交际能力强。但情绪波动大，易惹是非。'},
    '贪狼': {nature:'桃花星，主欲望多变', traits:'多才多艺，社交能力强，好奇心旺盛。但易沉迷物欲。'},
    '巨门': {nature:'暗星，主口舌是非', traits:'口才好，善于分析，但易招口舌之争。庙旺则能以口才谋生。'},
    '天相': {nature:'印星，主稳重正直', traits:'为人正直，有协调能力，适合辅佐之位。但缺乏开创力。'},
    '天梁': {nature:'荫星，主清高正直', traits:'性格清高，有侠义精神，乐于助人。适合公职或学术。'},
    '七杀': {nature:'将星，主刚毅冲动', traits:'执行力极强，敢于冒险，人生起伏大。适合军警或创业。'},
    '破军': {nature:'耗星，主变革破旧', traits:'敢于破旧立新，不墨守成规。但人生多变动荡，需防破败。'},
  };

  // 煞星影响
  const shaEffects = {
    '擎羊': '刑伤阻碍，增加冲劲但也易招是非',
    '陀罗': '拖延纠缠，做事多波折但暗藏韧性',
    '火星': '急躁冲动，突发变化，宜冷静',
    '铃星': '暗中破坏，情绪波动，需修心',
    '地空': '精神空虚，想法不切实际，破财',
    '地劫': '突然破耗，意外损失，宜保守',
    '天刑': '法律纠纷，官非口舌，宜守规矩',
    '化忌': '波折阻碍，该宫位所主事项多不顺'
  };

  // 四化影响
  const sihuaEffects = {
    '化禄': '财源广进，该宫位事项顺利发财',
    '化权': '权力增强，该宫位事项有掌控力',
    '化科': '名声显赫，该宫位事项有贵人助',
    '化忌': '波折阻碍，该宫位事项多不顺'
  };

  // 查找某宫的四化
  function getGongSihua(gongIdx) {
    var results = [];
    for (var i = 0; i < sihuaPalaces.length; i++) {
      var sp = sihuaPalaces[i];
      if (sp.pos === gongIdx || sp.gongIdx === gongIdx) {
        results.push(sp);
      }
    }
    return results;
  }

  var results = [];
  for (var gi = 0; gi < 12; gi++) {
    var gongIdx = mod(mingPos + gi, 12);
    var gongName = gongOrder[gi];
    var gongStars = stars[gongIdx] || [];
    var aspect = gongAspects[gongName];

    // 分类星曜：主星/辅星/煞星
    var mainStars = [];
    var auxStars = [];
    var shaStars = [];
    for (var si = 0; si < gongStars.length; si++) {
      var sn = gongStars[si];
      if (starCombos[sn]) mainStars.push(sn);
      else if (shaEffects[sn]) shaStars.push(sn);
      else auxStars.push(sn);
    }

    // 庙旺平陷
    var starStrengths = mainStars.map(function(s) {
      var table = STAR_STRENGTH[s];
      if (!table) return {star:s, strength:1, label:'平'};
      var v = table[gongIdx];
      return {star:s, strength:v, label: STRENGTH_LABELS[v] || '平'};
    });

    // 四化
    var gongSihua = getGongSihua(gongIdx);

    // 对宫星曜
    var oppIdx = mod(gongIdx + 6, 12);
    var oppStars = stars[oppIdx] || [];

    // 组合分析文案
    var comboText = '';
    if (mainStars.length === 0) {
      comboText = '本宫无主星，' + (oppStars.length > 0 ? '借对宫(' + gongOrder[(gi+6)%12] + ')' + oppStars.join('、') + '论命。性格多变，受环境影响大。' : '性格空灵，需结合大限流年判断。');
    } else {
      for (var mi = 0; mi < mainStars.length; mi++) {
        var ms = mainStars[mi];
        var combo = starCombos[ms];
        if (combo) {
          var strengthInfo = starStrengths[mi] || {};
          var strengthLabel = strengthInfo.label || '平';
          comboText += ms + '(' + strengthLabel + ')：' + combo.nature + '。' + combo.traits + ' ';
          if (strengthLabel === '庙' || strengthLabel === '旺') {
            comboText += '星曜入' + strengthLabel + '，正面特质充分发挥。 ';
          } else if (strengthLabel === '陷') {
            comboText += '星曜落陷，负面特质显现，需修身克制。 ';
          }
        }
      }
      // 双星组合特论
      if (mainStars.length >= 2) {
        var pair = mainStars.slice(0, 2).join('+');
        var pairText = {
          '紫微+天府': '紫府同宫，尊贵财库双全，极格之命，但易孤高。',
          '紫微+贪狼': '紫贪同宫，欲望与权势并重，桃花旺，需克制。',
          '紫微+天相': '紫相同宫，权印相随，适合管理职，稳重有余魄力不足。',
          '紫微+七杀': '紫杀同宫，帝星化将，威权极重，人生起伏大。',
          '紫微+破军': '紫破同宫，帝星变革，开创力极强但动荡多。',
          '太阳+太阴': '日月同宫，阴阳调和，才华出众，但易二心不定。',
          '武曲+天府': '武府同宫，理财能力极佳，财源稳固。',
          '武曲+贪狼': '武贪同宫，三十年一暴发，宜耐心等待时机。',
          '武曲+天相': '武相同宫，财印相随，适合金融管理。',
          '武曲+七杀': '武杀同宫，刚毅过人，适合军警武职。',
          '武曲+破军': '武破同宫，破旧立新，适合创业但波折多。',
          '天同+太阴': '同月同宫，温柔优雅，文艺天赋，但缺乏魄力。',
          '天同+巨门': '同巨同宫，口才好但易招是非，宜以口才谋生。',
          '天同+天梁': '同梁同宫，福荫双全，安逸稳定，适合文职。',
          '廉贞+天府': '廉府同宫，刚柔并济，理财有方，适合商界。',
          '廉贞+贪狼': '廉贪同宫，桃花极旺，才华横溢但易沉迷。',
          '廉贞+天相': '廉相同宫，印星带桃花，适合外交公关。',
          '廉贞+七杀': '廉杀同宫，刚烈果断，适合军警竞技。',
          '廉贞+破军': '廉破同宫，变革力强，但感情多波折。'
        };
        if (pairText[pair]) comboText += '【组合】' + pairText[pair] + ' ';
      }
    }

    // 煞星影响
    var shaText = '';
    if (shaStars.length > 0) {
      for (var ssi = 0; ssi < shaStars.length; ssi++) {
        var sn2 = shaStars[ssi];
        if (shaEffects[sn2]) {
          shaText += sn2 + '：' + shaEffects[sn2] + ' ';
        }
      }
    }

    // 四化影响
    var sihuaText = '';
    if (gongSihua.length > 0) {
      for (var ssi2 = 0; ssi2 < gongSihua.length; ssi2++) {
        var sp2 = gongSihua[ssi2];
        var spType = sp2.type || sp2.sihua || '';
        var spStar = sp2.star || '';
        if (sihuaEffects[spType]) {
          sihuaText += spType + '(' + spStar + ')：' + sihuaEffects[spType] + ' ';
        }
      }
    }

    results.push({
      gongName: gongName,
      gongIdx: gongIdx,
      gongZhi: BRANCHES[gongIdx],
      icon: aspect.icon,
      desc: aspect.desc,
      color: aspect.color,
      mainStars: mainStars,
      auxStars: auxStars,
      shaStars: shaStars,
      starStrengths: starStrengths,
      gongSihua: gongSihua,
      oppGongName: gongOrder[(gi+6)%12],
      oppStars: oppStars,
      comboText: comboText,
      shaText: shaText,
      sihuaText: sihuaText
    });
  }

  return results;
}

/**
 * R1.5: 紫微大限分析
 * 每步大限含主星组合+大限四化+与本命互动+十年运势概述
 */
function analyzeDayunDetail(panData) {
  var dayunList = panData.dayun || [];
  var stars = panData.stars || [];
  var mingPos = panData.gongMap['命宫'];
  var yearGan = panData.yearGan;
  var yearGanIdx = STEMS.indexOf(yearGan);
  var sihuaTable = SIHUA_TABLE[yearGan] || {};
  
  var results = [];
  for (var di = 0; di < dayunList.length; di++) {
    var d = dayunList[di];
    var dPos = d.pos;
    var dStars = stars[dPos] || [];
    var oppPos = mod(dPos + 6, 12);
    var oppStars = stars[oppPos] || [];
    var caiweiPos = mod(dPos + 4, 12);
    var guanluPos = mod(dPos + 5, 12);
    var sanfangStars = (stars[caiweiPos]||[]).concat(stars[guanluPos]||[]);
    
    // 大限宫位天干（五虎遁）
    var dGanIdx = mod(yearGanIdx >= 0 ? (WUHU_START[yearGanIdx] + dPos - 2) : 0, 10);
    var dGan = STEMS[dGanIdx];
    
    // 大限四化
    var dSihuaTable = SIHUA_TABLE[dGan] || {};
    var dSihuaPalaces = [];
    for (var sk in dSihuaTable) {
      if (!dSihuaTable.hasOwnProperty(sk)) continue;
      var sStar = dSihuaTable[sk];
      // 找该星所在宫位
      for (var sp = 0; sp < 12; sp++) {
        var spStars = stars[sp] || [];
        if (spStars.indexOf(sStar) >= 0) {
          dSihuaPalaces.push({type: sk, star: sStar, gongIdx: sp, gongName: ZW_GONGS[mod(sp - mingPos + 12, 12)]});
          break;
        }
      }
    }
    
    // 主星庙旺
    var dStarStrengths = dStars.map(function(s) {
      var table = STAR_STRENGTH[s];
      if (!table) return {star:s, label:'平'};
      return {star:s, label: STRENGTH_LABELS[table[dPos]] || '平'};
    });
    
    // 大限运势概述
    var overview = '';
    var hasJi = dSihuaPalaces.some(function(p) { return p.type === '化忌'; });
    var hasLu = dSihuaPalaces.some(function(p) { return p.type === '化禄'; });
    var hasQuan = dSihuaPalaces.some(function(p) { return p.type === '化权'; });
    var hasKe = dSihuaPalaces.some(function(p) { return p.type === '化科'; });
    
    if (hasLu && !hasJi) {
      overview = '大限化禄入命三方，此十年财运亨通，事业有突破。';
    } else if (hasJi && !hasLu) {
      overview = '大限化忌入命三方，此十年波折较多，宜稳不宜动。';
    } else if (hasLu && hasJi) {
      overview = '大限禄忌同入，此十年起伏不定，吉凶参半，需把握机遇、防范风险。';
    } else if (hasQuan) {
      overview = '大限化权入命三方，此十年权力上升，适合掌权管理。';
    } else if (hasKe) {
      overview = '大限化科入命三方，此十年名声显赫，学业考试有利。';
    } else {
      overview = '大限无四化入命三方，运势平稳，按部就班。';
    }
    
    // 星曜组合简析
    var starText = dStars.length > 0 ? dStars.join('、') : '无主星(借对宫' + (oppStars.join('、')||'空') + ')';
    var strengthText = dStarStrengths.map(function(s) { return s.star + '(' + s.label + ')'; }).join('、');
    
    results.push({
      gongName: d.gong,
      gongZhi: d.gongZhi,
      pos: dPos,
      ageRange: d.ageRange,
      startAge: d.startAge,
      endAge: d.endAge,
      stars: dStars,
      starText: starText,
      starStrengths: dStarStrengths,
      strengthText: strengthText,
      dGan: dGan,
      dSihua: dSihuaPalaces,
      sanfangStars: sanfangStars,
      oppStars: oppStars,
      overview: overview
    });
  }
  return results;
}

/**
 * R2.5: 紫微·四化深度释义
 * 每个四化落宫的具体含义 + 四化互动分析 + 生年四化vs大限四化对比
 * @param {object} panData - 排盘数据
 * @returns {object} { sihuaDetails, sihuaInteractions, summary }
 */
function analyzeSihuaDetail(panData) {
  var sihuaPalaces = panData.sihuaPalaces || [];
  var gongMap = panData.gongMap;
  var stars = panData.stars || [];
  var mingPos = gongMap['命宫'];
  var yearGan = panData.yearGan;
  var dayun = panData.dayun || [];
  var currentDayun = panData.currentDayun;

  // 四化落宫释义库
  var sihuaMeanings = {
    '化禄': {
      '命宫': '自身有福气财运，天生带财库，做事顺遂，贵人多助',
      '兄弟': '兄弟姐妹缘深，朋友带来财运，合伙获利',
      '夫妻': '配偶有财，婚姻带来财运，感情美满富足',
      '子女': '子女有出息，投资获利，生育顺利',
      '财帛': '财源广进，收入丰厚，理财有道，一生不缺钱',
      '疾厄': '身体健康，遇病易愈，体质好',
      '迁移': '外出得财，在外人缘好，适合外地发展',
      '交友': '朋友带来财运，下属忠诚能干',
      '官禄': '事业有成，升职加薪，创业顺利',
      '田宅': '房产丰厚，家庭和睦，置产获利',
      '福德': '精神愉悦，兴趣广泛，享受人生',
      '父母': '父母关爱，长辈提携，家教良好'
    },
    '化权': {
      '命宫': '性格强势有主见，领导力强，敢作敢为，不宜合作',
      '兄弟': '兄弟姐妹中有能人，朋友强势，需注意摩擦',
      '夫妻': '配偶强势掌权，婚姻中有主导权争夺，需互相尊重',
      '子女': '子女个性强，管教需用心，子女有成就',
      '财帛': '理财有方，善掌控财富，但易因强势破财',
      '疾厄': '身体壮健但易因过劳伤身，注意肝胆',
      '迁移': '在外有掌控力，适合外出掌权，但易招竞争',
      '交友': '下属服从，朋友有权势，但需防权力斗争',
      '官禄': '事业掌权，升职快，管理能力强，适合领导岗',
      '田宅': '家中掌权，房产投资有眼光，但家庭易有摩擦',
      '福德': '内心强大，精神充实，但易因执着而不安',
      '父母': '父母严格，长辈管教有力，家教正统'
    },
    '化科': {
      '命宫': '名声好，气质文雅，有学问，受人尊重',
      '兄弟': '兄弟姐妹有学识，朋友贵气，社交圈层高',
      '夫妻': '配偶温文尔雅，婚姻有品味，感情清雅',
      '子女': '子女聪明好学，学业优秀，亲子关系和谐',
      '财帛': '财源正派，收入稳定，以名声得财',
      '疾厄': '身体调养有方，注重养生，少病少灾',
      '迁移': '在外有名望，外出遇贵人，口碑好',
      '交友': '朋友有学问，下属能干且忠诚',
      '官禄': '事业有声名，考试顺利，适合学术文艺',
      '田宅': '家庭环境优雅，房产有升值潜力',
      '福德': '精神追求高雅，兴趣有品位，内心平和',
      '父母': '父母有教养，长辈是贵人，家学渊源'
    },
    '化忌': {
      '命宫': '早年波折，性格执念重，多思多虑，需修炼心性',
      '兄弟': '兄弟姐妹缘薄，朋友易失信，合伙需谨慎',
      '夫妻': '感情波折，婚姻多摩擦，需包容忍让',
      '子女': '子女缘薄，亲子关系紧张，生育不易',
      '财帛': '财运不稳，财来财去，需谨慎理财防破财',
      '疾厄': '健康有隐患，慢性病多，需注重保养',
      '迁移': '外出不顺，在外多波折，不宜远行',
      '交友': '朋友易背叛，下属不服，人际纠纷多',
      '官禄': '事业多阻碍，升职有波折，需坚持忍耐',
      '田宅': '房产有纠纷，家庭不和睦，置产需谨慎',
      '福德': '精神不安，容易焦虑抑郁，需修心养性',
      '父母': '父母缘薄，长辈健康有忧，家庭有变故'
    }
  };

  // 构建四化详情
  var sihuaDetails = [];
  var luPos = -1, quanPos = -1, kePos = -1, jiPos = -1;
  for (var i = 0; i < sihuaPalaces.length; i++) {
    var sp = sihuaPalaces[i];
    var type = sp.type;
    var star = sp.star;
    var gongName = sp.gong;
    var pos = sp.pos;

    if (type === '化禄') luPos = pos;
    else if (type === '化权') quanPos = pos;
    else if (type === '化科') kePos = pos;
    else if (type === '化忌') jiPos = pos;

    var meaning = sihuaMeanings[type] && sihuaMeanings[type][gongName] ? sihuaMeanings[type][gongName] : '该宫位受' + type + '影响，运势有所转变';
    var advice = '';
    if (type === '化禄') advice = '顺势而为，把握机缘，广结善缘';
    else if (type === '化权') advice = '勇于担当，发挥领导力，但需适度放权';
    else if (type === '化科') advice = '提升学识，经营名声，考试升职有利';
    else if (type === '化忌') advice = '保守为宜，化解执念，修身养性';

    var color = type === '化禄' ? '#27ae60' : type === '化权' ? '#e74c3c' : type === '化科' ? '#c9a84c' : '#8e44ad';

    sihuaDetails.push({
      type: type,
      star: star,
      gong: gongName,
      pos: pos,
      gongZhi: BRANCHES[pos],
      meaning: meaning,
      advice: advice,
      color: color
    });
  }

  // 四化互动分析
  var sihuaInteractions = [];

  // 1. 禄忌冲：化禄与化忌在对宫
  if (luPos >= 0 && jiPos >= 0) {
    if (mod(luPos + 6, 12) === jiPos) {
      var luGong = getGongNameByPos(luPos, gongMap);
      var jiGong = getGongNameByPos(jiPos, gongMap);
      sihuaInteractions.push({
        name: '禄忌冲',
        desc: '化禄入' + luGong + '与化忌入' + jiGong + '在对宫对冲',
        effect: '财运有波折，吉凶参半。化禄带来的财气被化忌冲散，需谨慎守财，不宜冒进。',
        severity: '中凶',
        color: '#e67e22'
      });
    }
  }

  // 2. 禄权交驰：化禄与化权在三方会照
  if (luPos >= 0 && quanPos >= 0) {
    var diff1 = mod(quanPos - luPos, 12);
    if (diff1 === 4 || diff1 === 5 || diff1 === 7 || diff1 === 8 || diff1 === 6) {
      sihuaInteractions.push({
        name: '禄权交驰',
        desc: '化禄与化权在三方四正会照',
        effect: '富贵双全。化禄主财，化权主权，二者交驰则财权双得，事业财运俱佳。',
        severity: '大吉',
        color: '#27ae60'
      });
    }
  }

  // 3. 科禄权三奇：三化同会
  var sanhuiCount = 0;
  var sanhuiGongs = [];
  if (luPos >= 0) { sanhuiCount++; sanhuiGongs.push(getGongNameByPos(luPos, gongMap)); }
  if (quanPos >= 0) { sanhuiCount++; sanhuiGongs.push(getGongNameByPos(quanPos, gongMap)); }
  if (kePos >= 0) { sanhuiCount++; sanhuiGongs.push(getGongNameByPos(kePos, gongMap)); }
  if (sanhuiCount >= 3) {
    // 检查是否在三方四正内会照
    var allInSanfang = true;
    var positions = [luPos, quanPos, kePos].filter(function(p) { return p >= 0; });
    for (var pi = 0; pi < positions.length; pi++) {
      for (var pj = pi + 1; pj < positions.length; pj++) {
 var d = mod(positions[pj] - positions[pi], 12);
        if (d !== 0 && d !== 4 && d !== 5 && d !== 6 && d !== 7 && d !== 8) {
          allInSanfang = false;
        }
      }
    }
    if (allInSanfang) {
      sihuaInteractions.push({
        name: '科禄权三奇嘉会',
        desc: '化禄、化权、化科三化同会于三方四正(' + sanhuiGongs.join('、') + ')',
        effect: '大吉格局！三奇嘉会主大富贵，名利双收，事业财运名声俱达顶峰。',
        severity: '大吉',
        color: '#2ecc71'
      });
    }
  }

  // 4. 双忌夹命：两个化忌夹命宫
  if (jiPos >= 0) {
    var prevPos = mod(mingPos - 1, 12);
    var nextPos = mod(mingPos + 1, 12);
    // 检查大限四化是否有另一个化忌
    var hasDoubleJi = false;
    if (currentDayun) {
      var dGanIdx = STEMS.indexOf(yearGan);
      // 检查大限天干四化
      for (var di = 0; di < dayun.length; di++) {
        if (dayun[di].pos === prevPos || dayun[di].pos === nextPos) {
          // 简化检查：如果化忌在对宫相邻
        }
      }
    }
    // 生年化忌夹命：化忌在命宫前后两宫
    if (jiPos === prevPos || jiPos === nextPos) {
      hasDoubleJi = false; // 单忌不算双忌
    }
    // 检查是否有大限化忌也在附近
    if (currentDayun && currentDayun.dGan) {
      var dSihua = SIHUA_TABLE[currentDayun.dGan] || {};
      if (dSihua.ji) {
        for (var sp2 = 0; sp2 < 12; sp2++) {
          if ((stars[sp2] || []).indexOf(dSihua.ji) >= 0) {
            if ((sp2 === prevPos && jiPos === nextPos) || (sp2 === nextPos && jiPos === prevPos)) {
              hasDoubleJi = true;
            }
          }
        }
      }
    }
    if (hasDoubleJi) {
      sihuaInteractions.push({
        name: '双忌夹命',
        desc: '生年化忌与大限化忌分居命宫前后两宫',
        effect: '大凶！双忌夹命主运势困顿，多波折阻碍，需谨慎行事，保守为上。',
        severity: '大凶',
        color: '#c0392b'
      });
    }
  }

  // 5. 禄忌同宫：化禄化忌同宫
  if (luPos >= 0 && jiPos >= 0 && luPos === jiPos) {
    var sameGong = getGongNameByPos(luPos, gongMap);
    sihuaInteractions.push({
      name: '禄忌同宫',
      desc: '化禄与化忌同入' + sameGong + '宫',
      effect: '吉凶交织。该宫位事项有得有失，财来财去，需平衡心态，不宜过度追求。',
      severity: '中平',
      color: '#f39c12'
    });
  }

  // 生年四化 vs 大限四化对比
  var daxianCompare = null;
  if (currentDayun) {
    var dGanIdx2 = -1;
    // 计算大限天干
    var yearGanIdx = STEMS.indexOf(yearGan);
    if (yearGanIdx >= 0) {
      dGanIdx2 = mod(WUHU_START[yearGanIdx] + currentDayun.pos - 2, 10);
    }
    var dGan2 = dGanIdx2 >= 0 ? STEMS[dGanIdx2] : '';
    var dSihuaTable = SIHUA_TABLE[dGan2] || {};
    var dSihuaPalaces = [];
    for (var sk in dSihuaTable) {
      if (!dSihuaTable.hasOwnProperty(sk)) continue;
      var sStar = dSihuaTable[sk];
      for (var sp3 = 0; sp3 < 12; sp3++) {
        if ((stars[sp3] || []).indexOf(sStar) >= 0) {
          dSihuaPalaces.push({ type: sk, star: sStar, gongIdx: sp3, gongName: getGongNameByPos(sp3, gongMap) });
          break;
        }
      }
    }

    var compareItems = [];
    var types = ['lu', 'quan', 'ke', 'ji'];
    var typeNames = { lu: '化禄', quan: '化权', ke: '化科', ji: '化忌' };
    for (var ti = 0; ti < types.length; ti++) {
      var tk = types[ti];
      var sn = panData.sihua[tk];
      var snD = dSihuaTable[tk];
      var sPosN = -1, sPosD = -1;
      for (var pp = 0; pp < 12; pp++) {
        if ((stars[pp] || []).indexOf(sn) >= 0) sPosN = pp;
        if ((stars[pp] || []).indexOf(snD) >= 0) sPosD = pp;
      }
      var nGong = sPosN >= 0 ? getGongNameByPos(sPosN, gongMap) : '未定位';
      var dGongName = sPosD >= 0 ? getGongNameByPos(sPosD, gongMap) : '未定位';
      var sameGong2 = sPosN === sPosD && sPosN >= 0;
      var effect = '';
      if (tk === 'lu') effect = sameGong2 ? '财运叠加，大限更旺' : '大限财源转向' + dGongName;
      else if (tk === 'quan') effect = sameGong2 ? '权力叠加，掌控力大增' : '大限权力转向' + dGongName;
      else if (tk === 'ke') effect = sameGong2 ? '名声叠加，声誉更盛' : '大限名望转向' + dGongName;
      else effect = sameGong2 ? '阻碍叠加，需特别谨慎' : '大限阻碍转向' + dGongName;
      compareItems.push({
        type: typeNames[tk],
        natalStar: sn, natalGong: nGong,
        daxianStar: snD, daxianGong: dGongName,
        sameGong: sameGong2, effect: effect
      });
    }
    daxianCompare = { dGan: dGan2, items: compareItems };
  }

  // 总结
  var hasJi = jiPos >= 0;
  var hasLu = luPos >= 0;
  var hasSanqi = sihuaInteractions.some(function(x) { return x.name.indexOf('三奇') >= 0; });
  var hasLiji = sihuaInteractions.some(function(x) { return x.name === '禄忌冲' || x.name === '禄忌同宫'; });
  var summary = '';
  if (hasSanqi) {
    summary = '命盘四化中科禄权三奇嘉会，为大吉之格，名利双收，富贵兼得。';
  } else if (hasJi && hasLiji) {
    summary = '命盘四化有禄忌冲克，财运有波折，吉凶参半，需谨慎理财、稳中求进。';
  } else if (hasLu && !hasJi) {
    summary = '命盘化禄落位吉利，财源广进，配合化权化科，整体运势良好。';
  } else if (hasJi && !hasLu) {
    summary = '命盘化忌入' + (jiPos >= 0 ? getGongNameByPos(jiPos, gongMap) : '') + '宫，该领域多波折，需化解执念、修身养性。';
  } else {
    summary = '四化分布平稳，各宫位受不同四化影响，需综合全盘判断吉凶。';
  }
  if (daxianCompare) {
    summary += ' 大限四化与生年四化' + (daxianCompare.items.some(function(x) { return x.sameGong; }) ? '有叠加共振，' : '各有落位，') + '需结合大限宫位综合论断。';
  }

  return {
    sihuaDetails: sihuaDetails,
    sihuaInteractions: sihuaInteractions,
    daxianCompare: daxianCompare,
    summary: summary
  };
}

/**
 * R2.6: 紫微·流年分析
 * 流年宫位定位 + 流年天干四化排布 + 流年与本命/大限互动
 * @param {object} panData - 排盘数据
 * @param {number} currentYear - 当前年份（公历）
 * @returns {object} { liunianGong, liunianStars, liunianSihua, interaction, summary }
 */
function analyzeLiunian(panData, currentYear) {
  var gongMap = panData.gongMap;
  var stars = panData.stars || [];
  var mingPos = gongMap['命宫'];
  var yearGan = panData.yearGan;
  var yearGanIdx = STEMS.indexOf(yearGan);
  var dayun = panData.dayun || [];
  var currentDayun = panData.currentDayun;

  // 1. 流年宫位定位：流年地支对应的宫位
  var yearZhiIdx = mod(currentYear - 4, 12);
  var yearZhi = BRANCHES[yearZhiIdx];
  // 流年宫位 = 流年地支所在宫位
  var liunianGongPos = yearZhiIdx;
  // 流年宫名（以命宫为基准的宫位名）
  var liunianGongName = getGongNameByPos(liunianGongPos, gongMap);

  // 2. 流年天干四化排布
  // 流年天干 = (年份 - 4) % 10
  var liunianGanIdx = mod(currentYear - 4, 10);
  var liunianGan = STEMS[liunianGanIdx];
  var liunianSihuaTable = SIHUA_TABLE[liunianGan] || {};
  var liunianSihua = [];
  var lSihuaPalaces = [];
  for (var sk in liunianSihuaTable) {
    if (!liunianSihuaTable.hasOwnProperty(sk)) continue;
    var sStar = liunianSihuaTable[sk];
    var sPos = -1;
    for (var sp = 0; sp < 12; sp++) {
      if ((stars[sp] || []).indexOf(sStar) >= 0) {
        sPos = sp;
        break;
      }
    }
    var sGongName = sPos >= 0 ? getGongNameByPos(sPos, gongMap) : '未定位';
    var typeLabel = sk === 'lu' ? '化禄' : sk === 'quan' ? '化权' : sk === 'ke' ? '化科' : '化忌';
    var color = sk === 'lu' ? '#27ae60' : sk === 'quan' ? '#e74c3c' : sk === 'ke' ? '#c9a84c' : '#8e44ad';
    liunianSihua.push({
      type: typeLabel,
      star: sStar,
      gongIdx: sPos,
      gongName: sGongName,
      color: color
    });
    if (sPos >= 0) lSihuaPalaces.push(sPos);
  }

  // 3. 流年宫位主星组合
  var liunianStars = stars[liunianGongPos] || [];
  var oppPos = mod(liunianGongPos + 6, 12);
  var oppStars = stars[oppPos] || [];
  var sanfangPos1 = mod(liunianGongPos + 4, 12);
  var sanfangPos2 = mod(liunianGongPos + 5, 12);
  var sanfangStars = (stars[sanfangPos1] || []).concat(stars[sanfangPos2] || []);

  // 主星庙旺
  var liunianStrengths = liunianStars.map(function(s) {
    var table = STAR_STRENGTH[s];
    if (!table) return { star: s, label: '平' };
    return { star: s, label: STRENGTH_LABELS[table[liunianGongPos]] || '平' };
  });

  // 4. 流年与大限/本命的互动
  var interaction = {
    liunianToMing: '',
    liunianToCaiwei: '',
    liunianToGuanlu: '',
    liunianSanfangToMing: false,
    daxianInteract: ''
  };

  // 流年宫位与命宫的关系（三方四正会照否）
  var diffToMing = mod(liunianGongPos - mingPos, 12);
  var isSanfang = (diffToMing === 0 || diffToMing === 4 || diffToMing === 5 || diffToMing === 6 || diffToMing === 7 || diffToMing === 8);
  interaction.liunianSanfangToMing = isSanfang;
  if (diffToMing === 0) {
    interaction.liunianToMing = '流年宫位与命宫同宫，今年个人运势为核心，性格、健康、事业均受直接影响';
  } else if (diffToMing === 6) {
    interaction.liunianToMing = '流年宫位在命宫对宫(迁移位)，今年外出运势强，宜动不宜静，适合外出发展';
  } else if (diffToMing === 4 || diffToMing === 8) {
    interaction.liunianToMing = '流年宫位与命宫在三方会照，今年运势与命宫形成合力，发展顺利';
  } else if (diffToMing === 5 || diffToMing === 7) {
    interaction.liunianToMing = '流年宫位与命宫在三方四正会照，今年运势平稳，有贵人助力';
  } else {
    interaction.liunianToMing = '流年宫位与命宫不在三方四正会照，今年运势独立发展，需靠自身努力';
  }

  // 流年四化对命宫/财帛/官禄的影响
  var caiweiPos = gongMap['财帛'];
  var guanluPos = gongMap['官禄'];
  var sihuaImpactOnMing = [];
  var sihuaImpactOnCaiwei = [];
  var sihuaImpactOnGuanlu = [];

  for (var si = 0; si < liunianSihua.length; si++) {
    var lsh = liunianSihua[si];
    if (lsh.gongIdx < 0) continue;
    if (lsh.gongIdx === mingPos) {
      sihuaImpactOnMing.push(lsh.type + '(' + lsh.star + ')入命宫');
    }
    if (lsh.gongIdx === caiweiPos) {
      sihuaImpactOnCaiwei.push(lsh.type + '(' + lsh.star + ')入财帛宫');
    }
    if (lsh.gongIdx === guanluPos) {
      sihuaImpactOnGuanlu.push(lsh.type + '(' + lsh.star + ')入官禄宫');
    }
  }

  interaction.sihuaImpactOnMing = sihuaImpactOnMing.join('、') || '无直接影响';
  interaction.sihuaImpactOnCaiwei = sihuaImpactOnCaiwei.join('、') || '无直接影响';
  interaction.sihuaImpactOnGuanlu = sihuaImpactOnGuanlu.join('、') || '无直接影响';

  // 流年与大限互动
  if (currentDayun) {
    var dyPos = currentDayun.pos;
    var diffToDy = mod(liunianGongPos - dyPos, 12);
    if (diffToDy === 0) {
      interaction.daxianInteract = '流年宫位与大限宫位重合，今年大限能量集中爆发，运势转折关键年';
    } else if (diffToDy === 6) {
      interaction.daxianInteract = '流年宫位在大限对宫，今年大限运势有对立冲突，需平衡调整';
    } else if (diffToDy === 4 || diffToDy === 5 || diffToDy === 7 || diffToDy === 8) {
      interaction.daxianInteract = '流年宫位与大限三方四正会照，今年大限运势顺利推进，宜积极行动';
    } else {
      interaction.daxianInteract = '流年宫位与大限宫位关系一般，今年大限运势平稳推进';
    }
  }

  // 总结
  var hasLuInMing = sihuaImpactOnMing.some(function(s) { return s.indexOf('化禄') >= 0; });
  var hasJiInMing = sihuaImpactOnMing.some(function(s) { return s.indexOf('化忌') >= 0; });
  var hasLuInCai = sihuaImpactOnCaiwei.some(function(s) { return s.indexOf('化禄') >= 0; });
  var hasJiInCai = sihuaImpactOnCaiwei.some(function(s) { return s.indexOf('化忌') >= 0; });
  var hasQuanInGuan = sihuaImpactOnGuanlu.some(function(s) { return s.indexOf('化权') >= 0; });

  var summary = currentYear + '年(' + liunianGan + yearZhi + '年)流年宫位在' + liunianGongName + '(' + yearZhi + '宫)';
  if (liunianStars.length > 0) {
    summary += '，主星' + liunianStars.join('、');
  } else {
    summary += '，无主星(借对宫' + (oppStars.join('、') || '空') + ')';
  }
  summary += '。';
  if (hasLuInMing) summary += '流年化禄入命，今年财运亨通，贵人多助。';
  if (hasLuInCai) summary += '流年化禄入财帛，今年财源广进。';
  if (hasQuanInGuan) summary += '流年化权入官禄，今年事业升职有望。';
  if (hasJiInMing) summary += '流年化忌入命，今年多波折，宜保守。';
  if (hasJiInCai) summary += '流年化忌入财帛，今年财运不稳，慎防破财。';
  if (!hasLuInMing && !hasJiInMing && !hasLuInCai && !hasJiInCai && !hasQuanInGuan) {
    summary += '流年四化无直接入命宫/财帛/官禄，运势平稳，按部就班。';
  }
  if (isSanfang) summary += '流年与命宫三方四正会照，整体运势有合力助推。';
  if (interaction.daxianInteract) summary += interaction.daxianInteract + '。';

  return {
    liunianGong: { name: liunianGongName, pos: liunianGongPos, zhi: yearZhi },
    liunianStars: liunianStars,
    liunianOppStars: oppStars,
    liunianSanfangStars: sanfangStars,
    liunianStrengths: liunianStrengths,
    liunianSihua: liunianSihua,
    interaction: interaction,
    liunianGan: liunianGan,
    liunianZhi: yearZhi,
    summary: summary
  };
}

/**
 * 生成建议
 */
function generateAdvice(gejuResult, sihuaDetail, currentDayun, sanfang) {
  const tips = [];
  const geju = gejuResult.geju;

  if (geju.includes('紫微')) tips.push('紫微入命，领导力强，注意勿过于独断。');
  if (geju.includes('天府')) tips.push('天府入命，理财能力强，宜稳健发展。');
  if (geju.includes('七杀') || geju.includes('破军')) tips.push('杀破狼格，宜从事开创性工作，人生起伏大。');
  if (geju.includes('机月同梁')) tips.push('机月同梁格，适合文职或企划工作，稳定为先。');
  if (geju.includes('日月并明')) tips.push('日月并明，才华出众，宜发挥才能，名扬四海。');
  if (geju.includes('火贪')) tips.push('火贪格主爆发横财，但需注意守财，不宜过度投机。');
  if (geju.includes('空宫')) tips.push('命宫无主星，性格多变，宜借对宫星曜之力，培养适应力。');

  if (sihuaDetail.some(s => s.includes('化忌入命宫'))) tips.push('化忌入命，早年多波折，后渐入佳境。');
  if (sihuaDetail.some(s => s.includes('化禄入财帛'))) tips.push('化禄入财帛，财运亨通。');
  if (sihuaDetail.some(s => s.includes('化权入官禄'))) tips.push('化权入官禄，事业有成。');
  if (sihuaDetail.some(s => s.includes('化科'))) tips.push('化科入命或三方，主声名远播，宜学业考试。');

  if (currentDayun) {
    if (currentDayun.gong && currentDayun.gong.includes('财帛')) tips.push('当前大限行财帛宫，财运为重。');
    if (currentDayun.gong && currentDayun.gong.includes('官禄')) tips.push('当前大限行官禄宫，事业为重。');
  }

  // 庙旺建议
  const hasMiao = sanfang.mingStrength.some(s => s.label === '庙');
  const hasXian = sanfang.mingStrength.some(s => s.label === '陷');
  if (hasMiao) tips.push('命宫主星入庙，星曜能量充沛，发挥正面特质。');
  if (hasXian) tips.push('命宫有星入陷，需注意星曜负面特质，宜修身养性。');

  if (tips.length === 0) tips.push('紫微斗数重在星曜组合与宫位互动，建议结合大限流年综合论断。');
  return tips.join(' ');
}

// ═══════════════════════════════════════════════════════════════
// R3.8: 小限流月分析
// ═══════════════════════════════════════════════════════════════

/**
 * analyzeXiaoxian(panData)
 * 小限分析
 *
 * 《紫微斗数全书》：「小限起命宫，男顺女逆，一岁一宫。」
 *
 * @param {Object} panData — ziweiCalcV3() 的返回值
 * @returns {Object} 小限分析结果
 */
function analyzeXiaoxian(panData) {
  var gongMap = panData.gongMap || {};
  var stars = panData.stars || [];
  var mingPos = gongMap['命宫'] != null ? gongMap['命宫'] : 0;
  var sex = panData.sex || 'male';
  var birthYear = panData.year || new Date().getFullYear();
  var currentYear = new Date().getFullYear();
  var age = currentYear - birthYear + 1; // 虚岁

  // 小限宫位定位：男命从命宫起1岁顺行，女命从命宫起1岁逆行
  var xiaoxianOffset = age - 1;
  var xiaoxianPos;
  if (sex === 'male') {
    xiaoxianPos = mod(mingPos + xiaoxianOffset, 12);
  } else {
    xiaoxianPos = mod(mingPos - xiaoxianOffset, 12);
  }
  var xiaoxianGongName = getGongNameByPos(xiaoxianPos, gongMap);
  var xiaoxianZhi = BRANCHES[xiaoxianPos];

  // 当前年龄小限宫位主星组合
  var xiaoxianStars = stars[xiaoxianPos] || [];
  var oppPos = mod(xiaoxianPos + 6, 12);
  var oppStars = stars[oppPos] || [];
  var sanfangPos1 = mod(xiaoxianPos + 4, 12);
  var sanfangPos2 = mod(xiaoxianPos + 5, 12);
  var sanfangStars = (stars[sanfangPos1] || []).concat(stars[sanfangPos2] || []);

  // 主星庙旺
  var xiaoxianStrengths = xiaoxianStars.map(function(s) {
    var table = STAR_STRENGTH[s];
    if (!table) return { star: s, label: '平' };
    return { star: s, label: STRENGTH_LABELS[table[xiaoxianPos]] || '平' };
  });

  // 小限宫位与命宫三方四正关系
  var diffToMing = mod(xiaoxianPos - mingPos, 12);
  var sanfangRelation = '';
  if (diffToMing === 0) {
    sanfangRelation = '小限宫位与命宫同宫，今年个人内在状态为核心，性格、健康直接受影响';
  } else if (diffToMing === 6) {
    sanfangRelation = '小限宫位在命宫对宫(迁移位)，今年外出运势强，宜动不宜静，环境变化大';
  } else if (diffToMing === 4 || diffToMing === 8) {
    sanfangRelation = '小限宫位与命宫在三方会照，今年运势与命宫形成合力，发展顺利';
  } else if (diffToMing === 5 || diffToMing === 7) {
    sanfangRelation = '小限宫位与命宫在三方四正会照，今年运势平稳，有贵人助力';
  } else {
    sanfangRelation = '小限宫位与命宫不在三方四正会照，今年运势独立发展，需靠自身努力';
  }

  // 小限主星吉凶判断
  var starAnalysis = '';
  if (xiaoxianStars.length === 0) {
    starAnalysis = '小限宫位无主星，借对宫' + (oppStars.length > 0 ? oppStars.join('、') : '空宫') + '之力，性格多变动，需参考对宫星曜判断。';
  } else {
    var hasZiwei = xiaoxianStars.indexOf('紫微') >= 0;
    var hasTianfu = xiaoxianStars.indexOf('天府') >= 0;
    var hasQisha = xiaoxianStars.indexOf('七杀') >= 0;
    var hasPojun = xiaoxianStars.indexOf('破军') >= 0;
    var hasTanlang = xiaoxianStars.indexOf('贪狼') >= 0;
    var hasTaiyang = xiaoxianStars.indexOf('太阳') >= 0;
    var hasTaiyin = xiaoxianStars.indexOf('太阴') >= 0;
    var hasTianliang = xiaoxianStars.indexOf('天梁') >= 0;
    var hasTianji = xiaoxianStars.indexOf('天机') >= 0;

    if (hasZiwei) starAnalysis = '紫微坐小限，今年领导力增强，有贵人提携，但需防孤傲自大。';
    else if (hasTianfu) starAnalysis = '天府坐小限，今年理财能力佳，财运稳定，宜守不宜攻。';
    else if (hasQisha || hasPojun || hasTanlang) starAnalysis = '杀破狼坐小限，今年变动大，宜主动求变，开创格局，但需防冲动行事。';
    else if (hasTaiyang) starAnalysis = '太阳坐小限，今年事业心强，男性贵人多，宜积极进取。';
    else if (hasTaiyin) starAnalysis = '太阴坐小限，今年财运平稳，女性贵人多，宜理财置业。';
    else if (hasTianliang) starAnalysis = '天梁坐小限，今年贵人运佳，逢凶化吉，宜稳重行事。';
    else if (hasTianji) starAnalysis = '天机坐小限，今年思维敏捷，宜学习谋划，但需防想多做少。';
    else starAnalysis = xiaoxianStars.join('、') + '坐小限，今年运势需结合庙旺与四化综合判断。';
  }

  // 汇总
  var summary = '虚岁' + age + '，小限在' + xiaoxianGongName + '(' + xiaoxianZhi + '宫)。';
  if (xiaoxianStars.length > 0) {
    summary += '主星' + xiaoxianStars.join('、') + '。';
  } else {
    summary += '无主星，借对宫' + (oppStars.join('、') || '空') + '。';
  }
  summary += starAnalysis;
  summary += sanfangRelation + '。';

  return {
    age: age,
    sex: sex,
    xiaoxianGong: { name: xiaoxianGongName, pos: xiaoxianPos, zhi: xiaoxianZhi },
    xiaoxianStars: xiaoxianStars,
    xiaoxianOppStars: oppStars,
    xiaoxianSanfangStars: sanfangStars,
    xiaoxianStrengths: xiaoxianStrengths,
    sanfangRelation: sanfangRelation,
    starAnalysis: starAnalysis,
    summary: summary
  };
}

/**
 * analyzeLiuyue(panData, currentMonth)
 * 流月分析
 *
 * 《紫微斗数全书》：「流月以流年地支宫为正月，顺数到当前月。」
 * 流月天干：以流年天干起五虎遁，定流月天干
 *
 * @param {Object} panData — ziweiCalcV3() 的返回值
 * @param {number} currentMonth — 当前月份(1-12, 农历)
 * @returns {Object} 流月分析结果
 */
function analyzeLiuyue(panData, currentMonth) {
  var gongMap = panData.gongMap || {};
  var stars = panData.stars || [];
  var mingPos = gongMap['命宫'] != null ? gongMap['命宫'] : 0;
  var currentYear = new Date().getFullYear();

  // 1. 流年地支宫位
  var yearZhiIdx = mod(currentYear - 4, 12);
  var yearZhi = BRANCHES[yearZhiIdx];
  var liunianGanIdx = mod(currentYear - 4, 10);
  var liunianGan = STEMS[liunianGanIdx];

  // 2. 流月宫位定位：以流年地支宫为正月(一月)，顺数到当前月
  var monthOffset = currentMonth - 1;
  var liuyuePos = mod(yearZhiIdx + monthOffset, 12);
  var liuyueGongName = getGongNameByPos(liuyuePos, gongMap);
  var liuyueZhi = BRANCHES[liuyuePos];

  // 3. 流月天干：五虎遁年起月法
  // 甲己之年丙作首，乙庚之岁戊为头，丙辛之岁庚为首，丁壬壬寅顺水流，戊癸甲寅好追求
  var wuhuDun = {
    '甲': '丙', '己': '丙',
    '乙': '戊', '庚': '戊',
    '丙': '庚', '辛': '庚',
    '丁': '壬', '壬': '壬',
    '戊': '甲', '癸': '甲'
  };
  var firstMonthGan = wuhuDun[liunianGan] || '丙';
  var firstMonthGanIdx = STEMS.indexOf(firstMonthGan);
  var liuyueGanIdx = mod(firstMonthGanIdx + monthOffset, 10);
  var liuyueGan = STEMS[liuyueGanIdx];

  // 4. 流月天干四化
  var liuyueSihuaTable = SIHUA_TABLE[liuyueGan] || {};
  var liuyueSihua = [];
  for (var sk in liuyueSihuaTable) {
    if (!liuyueSihuaTable.hasOwnProperty(sk)) continue;
    var sStar = liuyueSihuaTable[sk];
    var sPos = -1;
    for (var sp = 0; sp < 12; sp++) {
      if ((stars[sp] || []).indexOf(sStar) >= 0) {
        sPos = sp;
        break;
      }
    }
    var sGongName = sPos >= 0 ? getGongNameByPos(sPos, gongMap) : '未定位';
    var typeLabel = sk === 'lu' ? '化禄' : sk === 'quan' ? '化权' : sk === 'ke' ? '化科' : '化忌';
    var color = sk === 'lu' ? '#27ae60' : sk === 'quan' ? '#e74c3c' : sk === 'ke' ? '#c9a84c' : '#8e44ad';
    liuyueSihua.push({
      type: typeLabel,
      star: sStar,
      gongIdx: sPos,
      gongName: sGongName,
      color: color
    });
  }

  // 5. 流月宫位主星组合
  var liuyueStars = stars[liuyuePos] || [];
  var oppPos = mod(liuyuePos + 6, 12);
  var oppStars = stars[oppPos] || [];
  var sanfangPos1 = mod(liuyuePos + 4, 12);
  var sanfangPos2 = mod(liuyuePos + 5, 12);
  var sanfangStars = (stars[sanfangPos1] || []).concat(stars[sanfangPos2] || []);

  // 主星庙旺
  var liuyueStrengths = liuyueStars.map(function(s) {
    var table = STAR_STRENGTH[s];
    if (!table) return { star: s, label: '平' };
    return { star: s, label: STRENGTH_LABELS[table[liuyuePos]] || '平' };
  });

  // 流月宫位与命宫关系
  var diffToMing = mod(liuyuePos - mingPos, 12);
  var mingRelation = '';
  if (diffToMing === 0) {
    mingRelation = '流月宫位与命宫同宫，本月内在状态为核心，直接影响性格与健康';
  } else if (diffToMing === 6) {
    mingRelation = '流月宫位在命宫对宫(迁移位)，本月外出运势强，宜动不宜静';
  } else if (diffToMing === 4 || diffToMing === 8) {
    mingRelation = '流月宫位与命宫三方会照，本月运势与命宫形成合力';
  } else if (diffToMing === 5 || diffToMing === 7) {
    mingRelation = '流月宫位与命宫三方四正会照，本月运势平稳';
  } else {
    mingRelation = '流月宫位与命宫不在三方四正会照，本月运势独立发展';
  }

  // 流月四化影响
  var sihuaImpact = [];
  for (var si = 0; si < liuyueSihua.length; si++) {
    var lsh = liuyueSihua[si];
    if (lsh.gongIdx === mingPos) sihuaImpact.push(lsh.type + '(' + lsh.star + ')入命宫');
    if (lsh.gongIdx === gongMap['财帛']) sihuaImpact.push(lsh.type + '(' + lsh.star + ')入财帛宫');
    if (lsh.gongIdx === gongMap['官禄']) sihuaImpact.push(lsh.type + '(' + lsh.star + ')入官禄宫');
  }
  var sihuaImpactStr = sihuaImpact.length > 0 ? sihuaImpact.join('、') : '无直接影响';

  // 汇总
  var summary = currentYear + '年' + currentMonth + '月(农历)，流月宫位在' + liuyueGongName + '(' + liuyueZhi + '宫)，流月天干' + liuyueGan + '。';
  if (liuyueStars.length > 0) {
    summary += '主星' + liuyueStars.join('、') + '。';
  } else {
    summary += '无主星，借对宫' + (oppStars.join('、') || '空') + '。';
  }
  summary += '流月四化(' + liuyueGan + '干起)：' + liuyueSihua.map(function(s) { return s.type + s.star; }).join('、') + '。';
  summary += '四化影响：' + sihuaImpactStr + '。';
  summary += mingRelation + '。';

  return {
    currentMonth: currentMonth,
    liuyueGong: { name: liuyueGongName, pos: liuyuePos, zhi: liuyueZhi },
    liuyueGan: liuyueGan,
    liuyueStars: liuyueStars,
    liuyueOppStars: oppStars,
    liuyueSanfangStars: sanfangStars,
    liuyueStrengths: liuyueStrengths,
    liuyueSihua: liuyueSihua,
    sihuaImpact: sihuaImpactStr,
    mingRelation: mingRelation,
    summary: summary
  };
}


// ═══════════════════════════════════════════════════════════════
// 导出
// ═══════════════════════════════════════════════════════════════

window.ZiweiV3 = {
  // 核心排盘
  ziweiCalcV3,
  getMingGong,
  getShenGong,
  getJu,
  anZiwei,
  anStars,
  getSihua,
  getAuxStars,
  getShaStars,
  getDayun,

  // 分析
  analyzeSanfang,
  getGeju,
  analyzeZiweiFull,
  analyzeEachGong,
  analyzeDayunDetail,
  analyzeSihuaDetail,
  analyzeLiunian,
  // R3.8: 小限流月
  analyzeXiaoxian,
  analyzeLiuyue,

  // 工具
  getHourIdx,
  getDayGzIdx,
  getGongNameByPos,
  mod,

  // 常量
  ZW_GONGS,
  ZW_STARS,
  SIHUA_TABLE,
  JU_MAP,
  JU_REVERSE,
  NAYIN_WUXING,
  ZIWEI_POS_TABLE,
  STAR_STRENGTH,
  STRENGTH_LABELS,
  STEMS,
  BRANCHES
};

})();
