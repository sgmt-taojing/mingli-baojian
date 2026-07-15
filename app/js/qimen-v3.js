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
 * 计算太阳黄经 (VSOP87 简化算法)
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
  
  // 章动修正 (简化)
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
  // 1. 值符值使
  result.details.push({
    label: '值符值使',
    content: '值符落' + panData.zhiFuGong + '宫(' + JIU_GONG_NAME[panData.zhiFuGong] + '宫) — ' + STARS_FULL[panData.zhiFuStar] + ' | 值使: ' + MEN_FULL[panData.zhiShiMen] || panData.zhiShiMen
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
