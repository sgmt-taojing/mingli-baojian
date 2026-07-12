// pages/almanac/almanac.js
// 黄历页面 — 命理宝鉴小程序

const TIAN_GAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const DI_ZHI = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const SHENG_XIAO = ['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'];
const WEEKDAYS = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];

// 冲煞详情表
const CHONGSHA_DETAIL = {
  '子': { chong: '马', sha: '南' }, '丑': { chong: '羊', sha: '东' },
  '寅': { chong: '猴', sha: '北' }, '卯': { chong: '鸡', sha: '西' },
  '辰': { chong: '狗', sha: '南' }, '巳': { chong: '猪', sha: '东' },
  '午': { chong: '鼠', sha: '北' }, '未': { chong: '牛', sha: '西' },
  '申': { chong: '虎', sha: '南' }, '酉': { chong: '兔', sha: '东' },
  '戌': { chong: '龙', sha: '北' }, '亥': { chong: '蛇', sha: '西' }
};

// 建除十二神
const JIAN_CHU = ['建','除','满','平','定','执','破','危','成','收','开','闭'];
const JIAN_CHU_YI = {
  '建': ['入学','安抚','出行','上任','见贵','求职'],
  '除': ['治病','沐浴','祭祀','解除','扫舍'],
  '满': ['祭祀','祈福','进人口','捕捉','畋猎'],
  '平': ['修造','动土','平整道路'],
  '定': ['祭祀','祈福','冠笄','嫁娶','纳采'],
  '执': ['捕捉','畋猎','祭祀','祈福','求嗣'],
  '破': ['求医疗病','破屋坏垣'],
  '危': ['祭祀','祈福','安床','入殓'],
  '成': ['入学','赴任','开市','交易','立券','纳财','嫁娶','祭祀','祈福','求嗣'],
  '收': ['祭祀','祈福','纳财','捕捉','畋猎','开市','交易'],
  '开': ['祭祀','祈福','赴任','上任','见贵','出行','入学','嫁娶','移徙'],
  '闭': ['筑堤防','补垣','塞穴','埋葬']
};
const JIAN_CHU_JI = {
  '建': ['动土','开仓'],
  '除': ['求医疗病','出行'],
  '满': ['嫁娶','安葬','移徙','赴任'],
  '平': ['祭祀','祈福','开市','交易'],
  '定': ['诉讼','出行','词讼'],
  '执': ['开市','移徙','出行','嫁娶'],
  '破': ['嫁娶','开市','出行','祭祀','祈福','冠笄','进人口'],
  '危': ['登山','乘船','出行'],
  '成': ['诉讼','词讼','出行','赴任'],
  '收': ['开市','出行','安葬'],
  '开': ['安葬','伐木','畋猎','开仓','出货财'],
  '闭': ['开市','交易','出行','嫁娶','求医疗病','动土']
};

// 喜神方位（按日干）
const XI_SHEN = ['艮(东北)','乾(西北)','坤(西南)','离(正南)','巽(东南)','艮(东北)','乾(西北)','坤(西南)','离(正南)','巽(东南)'];
// 福神方位（按日干）
const FU_SHEN = ['巽(东南)','坎(正北)','坎(正北)','离(正南)','艮(东北)','巽(东南)','坎(正北)','离(正南)','乾(西北)','坤(西南)'];
// 财神方位（按日干）
const CAI_SHEN = ['艮(东北)','艮(东北)','坎(正北)','坎(正北)','坎(正北)','坎(正北)','坤(西南)','巽(东南)','巽(东南)','巽(东南)'];

// 值神黄黑道
const ZHISHEN_NAMES = ['青龙','明堂','天刑','朱雀','金匮','天德','白虎','玉堂','天牢','玄武','司命','勾陈'];
const ZHISHEN_TYPE = {
  '青龙': true, '明堂': true, '金匮': true, '天德': true, '玉堂': true, '司命': true,
  '天刑': false, '朱雀': false, '白虎': false, '天牢': false, '玄武': false, '勾陈': false
};

// 二十八星宿
const XING_XIU = ['角','亢','氐','房','心','尾','箕','斗','牛','女','虚','危','室','壁','奎','娄','胃','昴','毕','觜','参','井','鬼','柳','星','张','翼','轸'];

// 节气近似日期
const JIE_QI_DATES = [
  [6,20],[4,19],[6,21],[5,20],[6,21],[6,22],[7,23],[8,23],[8,23],[8,24],[7,22],[7,22]
];
const MONTH_ZHI = ['寅','卯','辰','巳','午','未','申','酉','戌','亥','子','丑'];

// 六十甲子纳音五行
const NAYIN = [
  '海中金','海中金','炉中火','炉中火','大林木','大林木','路旁土','路旁土','剑锋金','剑锋金',
  '山头火','山头火','涧下水','涧下水','城墙土','城墙土','白蜡金','白蜡金','杨柳木','杨柳木',
  '井泉水','井泉水','屋上土','屋上土','霹雳火','霹雳火','松柏木','松柏木','长流水','长流水',
  '砂石金','砂石金','山下火','山下火','平地木','平地木','壁上土','壁上土','金箔金','金箔金',
  '覆灯火','覆灯火','天河水','天河水','大驿土','大驿土','钗钏金','钗钏金','桑柘木','桑柘木',
  '大溪水','大溪水','沙中土','沙中土','天上火','天上火','石榴木','石榴木','大海水','大海水'
];

// 每日一句语录
const DAILY_QUOTES = [
  '命里有时终须有，命里无时莫强求。',
  '穷则变，变则通，通则久。',
  '积善之家，必有余庆；积不善之家，必有余殃。',
  '天行健，君子以自强不息；地势坤，君子以厚德载物。',
  '祸兮福之所倚，福兮祸之所伏。',
  '善不积不足以成名，恶不积不足以灭身。',
  '居上位而不骄，在下位而不忧。',
  '亢龙有悔，盈不可久也。',
  '履霜坚冰至，驯致其道也。',
  '谦谦君子，卑以自牧也。',
  '同声相应，同气相求。',
  '一阴一阳之谓道，继之者善也，成之者性也。',
  '君子藏器于身，待时而动。',
  '飞龙在天，利见大人。',
  '地势坤，君子以厚德载物。',
  '见群龙无首，吉。',
  '时乘六龙以御天也。',
  '云从龙，风从虎，圣人作而万物睹。',
  '本乎天者亲上，本乎地者亲下。',
  '方以类聚，物以群分，吉凶生矣。'
];

// ====== 农历转换工具 ======

// 农历数据表 (1900-2100)，每年用 hex 编码
// 注意：此表仅用于公历→农历月日转换，干支推算不依赖此表（干支通过六十甲子轮换独立计算）
// 超出 1900-2100 范围时，农历月日显示为"--"，但不影响干支计算
const LUNAR_INFO = [
  0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,
  0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,
  0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,
  0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,
  0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,
  0x06ca0,0x0b550,0x15355,0x04da0,0x0a5b0,0x14573,0x052b0,0x0a9a8,0x0e950,0x06aa0,
  0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,
  0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b6a0,0x195a6,
  0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,
  0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x055c0,0x0ab60,0x096d5,0x092e0,
  0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,
  0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,
  0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,
  0x05aa0,0x076a3,0x096d0,0x04afb,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45,
  0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0,
  0x14b63,0x09370,0x049f8,0x04970,0x064b0,0x168a6,0x0ea50,0x06b20,0x1a6c4,0x0aae0,
  0x0a2e0,0x0d2e3,0x0c960,0x0d557,0x0d4a0,0x0da50,0x05d55,0x056a0,0x0a6d0,0x055d4,
  0x052d0,0x0a9b8,0x0a950,0x0b4a0,0x0b6a6,0x0ad50,0x055a0,0x0aba4,0x0a5b0,0x052b0,
  0x0b273,0x06930,0x07337,0x06aa0,0x0ad50,0x14b55,0x04b60,0x0a570,0x054e4,0x0d160,
  0x0e968,0x0d520,0x0daa0,0x16aa6,0x056d0,0x04ae0,0x0a9d4,0x0a2d0,0x0d150,0x0f252,
  0x0d520
];

function lunarYearDays(year) {
  let sum = 348;
  for (let i = 0x8000; i > 0x8; i >>= 1) {
    sum += (LUNAR_INFO[year - 1900] & i) ? 1 : 0;
  }
  sum += leapDays(year);
  return sum;
}

function leapMonth(year) {
  return LUNAR_INFO[year - 1900] & 0xf;
}

function leapDays(year) {
  if (leapMonth(year)) {
    return (LUNAR_INFO[year - 1900] & 0x10000) ? 30 : 29;
  }
  return 0;
}

function monthDays(year, month) {
  return (LUNAR_INFO[year - 1900] & (0x10000 >> month)) ? 30 : 29;
}

function solarToLunar(year, month, day) {
  // 边界保护：超出 1900-2100 范围时返回占位值，不影响干支计算
  if (year < 1900 || year > 2100) {
    return { year: year, month: 0, day: 0, isLeap: false, monthStr: '--', dayStr: '--' };
  }
  const baseDate = new Date(1900, 0, 31); // 1900-01-31 = 农历正月初一
  const objDate = new Date(year, month - 1, day);
  let offset = Math.floor((objDate - baseDate) / 86400000);

  let lYear, lMonth, lDay, isLeap = false;

  for (lYear = 1900; lYear < 2100 && offset > 0; lYear++) {
    const yearDays = lunarYearDays(lYear);
    if (offset < yearDays) break;
    offset -= yearDays;
  }

  const leap = leapMonth(lYear);
  let isLeapMonth = false;

  for (lMonth = 1; lMonth < 13 && offset > 0; lMonth++) {
    if (leap > 0 && lMonth === leap + 1 && !isLeapMonth) {
      --lMonth;
      isLeapMonth = true;
      isLeap = true;
      const ld = leapDays(lYear);
      if (offset < ld) break;
      offset -= ld;
    } else {
      const md = monthDays(lYear, lMonth);
      if (offset < md) break;
      offset -= md;
    }
    if (isLeapMonth && lMonth === leap + 1) isLeapMonth = false;
  }

  if (offset === 0 && leap > 0 && lMonth === leap + 1) {
    if (isLeapMonth) {
      isLeapMonth = false;
    } else {
      isLeapMonth = true;
      --lMonth;
    }
  }

  lDay = offset + 1;

  const lunarMonthNames = ['正','二','三','四','五','六','七','八','九','十','冬','腊'];
  const lunarDayNames1 = ['初一','初二','初三','初四','初五','初六','初七','初八','初九','初十'];
  const lunarDayNames2 = ['十一','十二','十三','十四','十五','十六','十七','十八','十九','二十'];
  const lunarDayNames3 = ['廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'];
  const dayNames = [lunarDayNames1, lunarDayNames2, lunarDayNames3];

  const monthStr = (isLeap ? '闰' : '') + lunarMonthNames[lMonth - 1] + '月';
  const dayStr = dayNames[Math.floor((lDay - 1) / 10)][(lDay - 1) % 10];

  return { year: lYear, month: lMonth, day: lDay, isLeap, monthStr, dayStr };
}

// ====== 干支计算 ======

function toJDN(year, month, day) {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

function isBeforeLiChun(year, month, day) {
  const lcDay = JIE_QI_DATES[1][0];
  if (month < 2) return true;
  if (month > 2) return false;
  return day < lcDay;
}

function getDayGanZhi(year, month, day) {
  const jdn = toJDN(year, month, day);
  const jdnRef = 2460431; // 2024-04-30 = 甲子日
  const diff = jdn - jdnRef;
  const gz = ((diff % 60) + 60) % 60;
  return { gan: gz % 10, zhi: gz % 12, index: gz };
}

function getYearGanZhi(year, month, day) {
  let y = year;
  if (isBeforeLiChun(year, month, day)) y = year - 1;
  const diff = y - 1984;
  const idx = ((diff % 60) + 60) % 60;
  return { gan: idx % 10, zhi: idx % 12, index: idx };
}

function getMonthZhiIndex(year, month, day) {
  const jq = JIE_QI_DATES[month - 1];
  const inFirstHalf = day < jq[0];
  let monthOffset;
  if (month >= 2) {
    monthOffset = month - 2;
  } else {
    monthOffset = month + 10;
  }
  if (inFirstHalf) {
    monthOffset = (monthOffset - 1 + 12) % 12;
  }
  return monthOffset;
}

function getMonthGan(yearGan, monthZhiIndex) {
  const base = [2, 4, 6, 8, 0]; // 丙戊庚壬甲
  const startGan = base[yearGan % 5];
  return (startGan + monthZhiIndex) % 10;
}

function getMonthGanZhi(year, month, day) {
  const yearGZ = getYearGanZhi(year, month, day);
  const monthZhiIdx = getMonthZhiIndex(year, month, day);
  const monthGan = getMonthGan(yearGZ.gan, monthZhiIdx);
  const monthZhiDiIdx = (monthZhiIdx + 2) % 12;
  return { gan: monthGan, zhi: monthZhiDiIdx, index: monthGan * 12 + monthZhiIdx };
}

function getJianChu(monthZhiIdx, dayZhiIdx) {
  const offset = (dayZhiIdx - monthZhiIdx + 12) % 12;
  return JIAN_CHU[offset];
}

function getXingXiu(year, month, day) {
  const jdn = toJDN(year, month, day);
  const refJdn = 2460461; // 2024-05-30 = 角宿
  const diff = jdn - refJdn;
  const idx = ((diff % 28) + 28) % 28;
  return XING_XIU[idx];
}

function getZhishen(dayGanIndex, dayZhiIndex) {
  const zhiStart = { 0: 0, 6: 0, 1: 1, 7: 1, 2: 4, 8: 4, 3: 5, 9: 5, 4: 7, 10: 7, 5: 9, 11: 9 };
  const start = zhiStart[dayZhiIndex] !== undefined ? zhiStart[dayZhiIndex] : 0;
  const idx = (start + dayGanIndex) % 12;
  return ZHISHEN_NAMES[idx];
}

// 吉时计算（黄黑道）
function getGoodBadHours(dayGan) {
  const d = dayGan % 5;
  const hourHuangdao = [
    [0, 1, 4, 5, 10],
    [2, 3, 4, 5, 10],
    [0, 1, 6, 7, 10],
    [0, 1, 2, 3, 8],
    [0, 1, 4, 5, 6]
  ];
  const hourNames = ['子时','丑时','寅时','卯时','辰时','巳时','午时','未时','申时','酉时','戌时','亥时'];
  const goodHours = [];
  const badHours = [];
  const goodSet = hourHuangdao[d];
  for (let i = 0; i < 12; i++) {
    if (goodSet.indexOf(i) !== -1) {
      goodHours.push(hourNames[i]);
    } else {
      badHours.push(hourNames[i]);
    }
  }
  return { goodHours, badHours };
}

function ganzhiStr(gz) {
  return TIAN_GAN[gz.gan] + DI_ZHI[gz.zhi];
}

// ====== 页面逻辑 ======

Page({
  data: {
    gregorianDate: '',
    lunarDateText: '',
    weekdayText: '',
    ganzhi: null,
    yiList: [],
    jiList: [],
    directions: null,
    goodHours: [],
    badHours: [],
    chongsha: null,
    wuxing: '',
    jianchu: '',
    xingxiu: '',
    zhishen: '',
    zhishenType: true,
    dailyQuote: '',
    _offsetDays: 0 // 0=今天, 1=明天
  },

  onLoad() {
    this.loadAlmanac(0);
  },

  onShow() {
    if (this.data._offsetDays !== 0 && getCurrentPages) {
      // 从明日返回时重置为今天
    }
  },

  onPullDownRefresh() {
    this.loadAlmanac(this.data._offsetDays, () => {
      wx.stopPullDownRefresh();
    });
  },

  // 尝试从后端获取，失败则用本地计算
  loadAlmanac(offsetDays, callback) {
    const target = this._getDateWithOffset(offsetDays);
    const dateStr = `${target.year}-${String(target.month).padStart(2,'0')}-${String(target.day).padStart(2,'0')}`;

    // 尝试调用后端 API
    wx.request({
      url: 'http://127.0.0.1:8920/api/almanac/today',
      method: 'GET',
      data: { date: dateStr },
      timeout: 3000,
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.success !== false) {
          this._renderAlmanac(res.data, target, offsetDays);
        } else {
          this._renderLocalAlmanac(target, offsetDays);
        }
      },
      fail: () => {
        this._renderLocalAlmanac(target, offsetDays);
      },
      complete: () => {
        if (callback) callback();
      }
    });
  },

  _getDateWithOffset(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate(),
      week: d.getDay()
    };
  },

  // 后端数据渲染
  _renderAlmanac(data, target, offsetDays) {
    const lunar = solarToLunar(target.year, target.month, target.day);
    const quote = DAILY_QUOTES[(target.year + target.month * 31 + target.day) % DAILY_QUOTES.length];

    this.setData({
      gregorianDate: `${target.year}年${target.month}月${target.day}日`,
      lunarDateText: `农历${lunar.monthStr}${lunar.dayStr}`,
      weekdayText: WEEKDAYS[target.week],
      ganzhi: data.ganzhi || this._calcGanzhi(target),
      yiList: data.yi || [],
      jiList: data.ji || [],
      directions: data.directions || this._calcDirections(target),
      goodHours: data.goodHours || [],
      badHours: data.badHours || [],
      chongsha: data.chongsha || this._calcChongsha(target),
      wuxing: data.wuxing || '',
      jianchu: data.jianchu || '',
      xingxiu: data.xingxiu || '',
      zhishen: data.zhishen || '',
      zhishenType: data.zhishenType !== undefined ? data.zhishenType : true,
      dailyQuote: data.quote || quote,
      _offsetDays: offsetDays
    });
  },

  // 本地计算渲染（fallback）
  _renderLocalAlmanac(target, offsetDays) {
    const lunar = solarToLunar(target.year, target.month, target.day);
    const yearGZ = getYearGanZhi(target.year, target.month, target.day);
    const monthGZ = getMonthGanZhi(target.year, target.month, target.day);
    const dayGZ = getDayGanZhi(target.year, target.month, target.day);

    const jcName = getJianChu(monthGZ.zhi, dayGZ.zhi);
    const xingxiu = getXingXiu(target.year, target.month, target.day);
    const zhishen = getZhishen(dayGZ.gan, dayGZ.zhi);
    const zhishenType = ZHISHEN_TYPE[zhishen] !== undefined ? ZHISHEN_TYPE[zhishen] : true;

    const yiList = JIAN_CHU_YI[jcName] || ['祭祀'];
    const jiList = JIAN_CHU_JI[jcName] || ['诸事不宜'];

    const dayZhiName = DI_ZHI[dayGZ.zhi];
    const chongsha = CHONGSHA_DETAIL[dayZhiName] || { chong: '', sha: '' };

    const directions = {
      caishen: CAI_SHEN[dayGZ.gan],
      xishen: XI_SHEN[dayGZ.gan],
      fushen: FU_SHEN[dayGZ.gan]
    };

    const hours = getGoodBadHours(dayGZ.gan);
    const wuxing = NAYIN[dayGZ.index] || '';
    const quote = DAILY_QUOTES[(target.year + target.month * 31 + target.day) % DAILY_QUOTES.length];

    this.setData({
      gregorianDate: `${target.year}年${target.month}月${target.day}日`,
      lunarDateText: `农历${lunar.monthStr}${lunar.dayStr}`,
      weekdayText: WEEKDAYS[target.week],
      ganzhi: {
        year: ganzhiStr(yearGZ),
        month: ganzhiStr(monthGZ),
        day: ganzhiStr(dayGZ)
      },
      yiList,
      jiList,
      directions,
      goodHours: hours.goodHours,
      badHours: hours.badHours,
      chongsha,
      wuxing,
      jianchu: jcName,
      xingxiu: xingxiu + '宿',
      zhishen,
      zhishenType,
      dailyQuote: quote,
      _offsetDays: offsetDays
    });
  },

  _calcGanzhi(target) {
    const yearGZ = getYearGanZhi(target.year, target.month, target.day);
    const monthGZ = getMonthGanZhi(target.year, target.month, target.day);
    const dayGZ = getDayGanZhi(target.year, target.month, target.day);
    return {
      year: ganzhiStr(yearGZ),
      month: ganzhiStr(monthGZ),
      day: ganzhiStr(dayGZ)
    };
  },

  _calcDirections(target) {
    const dayGZ = getDayGanZhi(target.year, target.month, target.day);
    return {
      caishen: CAI_SHEN[dayGZ.gan],
      xishen: XI_SHEN[dayGZ.gan],
      fushen: FU_SHEN[dayGZ.gan]
    };
  },

  _calcChongsha(target) {
    const dayGZ = getDayGanZhi(target.year, target.month, target.day);
    const dayZhiName = DI_ZHI[dayGZ.zhi];
    return CHONGSHA_DETAIL[dayZhiName] || { chong: '', sha: '' };
  },

  goTomorrow() {
    this.loadAlmanac(1);
    wx.showToast({ title: '已切换至明日', icon: 'none', duration: 1500 });
  }
});
