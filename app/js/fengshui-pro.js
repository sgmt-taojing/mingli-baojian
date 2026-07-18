/**
 * fengshui-pro.js — 命理宝鉴·风水高级模块
 * 
 * 功能模块：
 *   1. 每日风水方位指南 getDailyFengshuiGuide()
 *   2. 家居布局诊断     diagnoseHomeLayout()
 *   3. 商铺/办公室风水   analyzeBusinessFengshui()
 *   4. 风水化煞大全     getShaqiCatalog()
 *   5. 流年飞星盘       renderAnnualFlyingStars()
 *   6. 家庭年度化解方案   generateFamilyAnnualCure()
 *   7. 风水择日         fengshuiZeRi()
 *
 * 依循典籍：《八宅明镜》《沈氏玄空学》《阳宅三要》《青囊序》《天玉经》《紫白诀》
 */

// ============================================================
// 0. 公共辅助
// ============================================================

/** 天干地支（复用 hub 内部定义，确保独立可用） */
var FS_PRO_GAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
var FS_PRO_ZHI = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
var FS_PRO_WUXING_GAN = { '甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水' };
var FS_PRO_WUXING_ZHI = { '子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火','午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水' };

/** 八卦方位映射 */
var FS_PRO_BAGUA = {
  '坎': { dir: '北', element: '水', num: 1 },
  '坤': { dir: '西南', element: '土', num: 2 },
  '震': { dir: '东', element: '木', num: 3 },
  '巽': { dir: '东南', element: '木', num: 4 },
  '乾': { dir: '西北', element: '金', num: 6 },
  '兑': { dir: '西', element: '金', num: 7 },
  '艮': { dir: '东北', element: '土', num: 8 },
  '离': { dir: '南', element: '火', num: 9 }
};

/** 九星名称 */
var FS_PRO_STARS = {
  1: { name: '一白贪狼', element: '水', desc: '桃花·人缘·文昌', auspicious: true },
  2: { name: '二黑巨门', element: '土', desc: '病符·健康·脾胃', auspicious: false },
  3: { name: '三碧禄存', element: '木', desc: '是非·口舌·官非', auspicious: false },
  4: { name: '四绿文曲', element: '木', desc: '文昌·学业·考试', auspicious: true },
  5: { name: '五黄廉贞', element: '土', desc: '灾祸·意外·大凶', auspicious: false },
  6: { name: '六白武曲', element: '金', desc: '武贵·事业·远行', auspicious: true },
  7: { name: '七赤破军', element: '金', desc: '破财·争斗·口舌', auspicious: false },
  8: { name: '八白左辅', element: '土', desc: '正财·置业·吉庆', auspicious: true },
  9: { name: '九紫右弼', element: '火', desc: '喜庆·姻缘·添丁', auspicious: true }
};

/** 飞星顺飞宫位顺序：中→乾→兑→艮→离→坎→坤→震→巽 */
var FS_PRO_FLY_ORDER = ['中','西北','西','东北','南','北','西南','东','东南'];

/** 计算年飞星入中宫 */
function _fsProYearCenter(year) {
  var base = 1864;
  var remainder = (year - base) % 9;
  var center = ((9 - remainder) % 9) || 9;
  return center;
}

/** 计算月飞星入中宫 */
function _fsProMonthCenter(year, month) {
  // 月飞星须依节气定月建：正月立春后起寅，依次推排
  // 子午卯酉年：正月起八白
  // 寅申巳亥年：正月起五黄
  // 辰戌丑未年：正月起二黑
  const yearZhi = FS_PRO_ZHI[(year - 4) % 12];
  let startStar;
  if (['子','午','卯','酉'].includes(yearZhi)) startStar = 8;
  else if (['寅','申','巳','亥'].includes(yearZhi)) startStar = 5;
  else startStar = 2;
  // 依节气定月序：寅月(立春)为正月，卯月(惊蛰)为二月...依次类推
  // 节气近似日期表（公历，用于推算月建）
  var jieQiApprox = {
    1: { jie: '小寒', day: 6 },   // 丑月
    2: { jie: '立春', day: 4 },   // 寅月——正月
    3: { jie: '惊蛰', day: 6 },   // 卯月
    4: { jie: '清明', day: 5 },   // 辰月
    5: { jie: '立夏', day: 6 },   // 巳月
    6: { jie: '芒种', day: 6 },   // 午月
    7: { jie: '小暑', day: 7 },   // 未月
    8: { jie: '立秋', day: 8 },   // 申月
    9: { jie: '白露', day: 8 },   // 酉月
    10: { jie: '寒露', day: 8 },  // 戌月
    11: { jie: '立冬', day: 7 },  // 亥月
    12: { jie: '大雪', day: 7 }   // 子月
  };
  // 确定当前节气所在月建序号（寅=0, 卯=1, ..., 丑=11）
  var monthJie = jieQiApprox[month];
  var monthJianIdx;
  if (month === 1) {
    // 1月：小寒前仍为子月(11)，小寒后为丑月(10)
    monthJianIdx = (new Date(year, 0, 1) < new Date(year, 0, 6)) ? 11 : 10;
  } else {
    // 其他月：节气前属上月，节气后属本月
    // 寅月=0, 卯月=1, ..., 丑月=11
    monthJianIdx = (month - 2 + 12) % 12;
    // 检查是否已过当月节气，未过则属上月
    var jieDate = new Date(year, month - 1, monthJie.day);
    if (new Date(year, month - 1, 1) <= jieDate && new Date(year, month - 1, 15) > jieDate) {
      // 月初到节气前，可能仍属上月
      var today = new Date(year, month - 1, 15); // 用月中近似
      // 精确判断：若当月15日已在节气之后，则全月属当月建
    }
  }
  var monthOffset = monthJianIdx; // 0=寅月(正月)
  var center = ((startStar - monthOffset - 1) % 9 + 9) % 9 || 9;
  return center;
}

/** 获取飞星盘布局 */
function _fsProFlyingStarGrid(centerStar) {
  var order = [centerStar];
  var next = centerStar;
  for (var i = 0; i < 8; i++) {
    next = next >= 9 ? 1 : next + 1;
    order.push(next);
  }
  var pos = {};
  for (var i = 0; i < FS_PRO_FLY_ORDER.length; i++) {
    pos[FS_PRO_FLY_ORDER[i]] = order[i];
  }
  return pos;
}

/** 五行相生相克 */
function _fsProWuxingRel(a, b) {
  var sheng = { '水':'木','木':'火','火':'土','土':'金','金':'水' };
  var ke = { '水':'火','火':'金','金':'木','木':'土','土':'水' };
  if (sheng[a] === b) return '生';
  if (ke[a] === b) return '克';
  if (a === b) return '比和';
  return '无';
}

/** 日干支计算（基于60甲子循环，以已知甲子日为基准） */
function _fsProDayGanZhi(date) {
  // 以 2000-01-07 甲子日为基准
  var base = new Date(2000, 0, 7);
  var diff = Math.floor((date - base) / 86400000);
  diff = ((diff % 60) + 60) % 60;
  return { gan: FS_PRO_GAN[diff % 10], zhi: FS_PRO_ZHI[diff % 12], index: diff };
}

/** 明财位计算：大门对角线方位 */
function _fsProMingCaiwei(doorDir) {
  // 明财位依大门朝向取对角线方位
  var caiweiMap = {
    '北': '东南', '南': '西北', '东': '西南', '西': '东北',
    '东南': '西北', '西南': '东北', '西北': '东南', '东北': '西南'
  };
  return caiweiMap[doorDir] || '东南';
}

/** 二十四山完整定义：12地支+8天干+4卦（乾巽艮坤） */
var FS_PRO_24MOUNTAIN = [
  '壬','子','癸',  // 北方三山
  '丑','艮','寅',  // 东北三山
  '甲','卯','乙',  // 东方三山
  '辰','巽','巳',  // 东南三山
  '丙','午','丁',  // 南方三山
  '未','坤','申',  // 西南三山
  '庚','酉','辛',  // 西方三山
  '戌','乾','亥'   // 西北三山
];

/** 二十四山方位映射（每山15度） */
var FS_PRO_24MOUNTAIN_DIR = {
  '壬': '北', '子': '北', '癸': '北',
  '丑': '东北', '艮': '东北', '寅': '东北',
  '甲': '东', '卯': '东', '乙': '东',
  '辰': '东南', '巽': '东南', '巳': '东南',
  '丙': '南', '午': '南', '丁': '南',
  '未': '西南', '坤': '西南', '申': '西南',
  '庚': '西', '酉': '西', '辛': '西',
  '戌': '西北', '乾': '西北', '亥': '西北'
};

/** 三元龙方位阴阳（决定玄空飞星顺逆飞）
 * 天元龙（卦位）：乾坤艮巽属阳顺飞，子午卯酉属阴逆飞
 * 地元龙（逆数）：辰戌丑未属阳顺飞，甲庚壬丙属阴逆飞
 * 人元龙（顺数）：寅申巳亥属阳顺飞，乙辛丁癸属阴逆飞
 */
var FS_PRO_24MOUNTAIN_YINYANG = {
  '子': '阴', '癸': '阴', '壬': '阳',
  '午': '阴', '丁': '阴', '丙': '阳',
  '卯': '阴', '乙': '阴', '甲': '阳',
  '酉': '阴', '辛': '阴', '庚': '阳',
  '乾': '阳', '巽': '阳', '艮': '阳', '坤': '阳',
  '辰': '阳', '戌': '阳', '丑': '阳', '未': '阳',
  '寅': '阳', '申': '阳', '巳': '阳', '亥': '阳'
};

/** 玄空飞星依三元龙阴阳定顺逆飞
 * 阳顺飞：中→乾→兑→艮→离→坎→坤→震→巽
 * 阴逆飞：中→巽→震→坤→坎→离→艮→兑→乾
 */
function _fsProFlyingStarGrid24(centerStar, mountain) {
  var isYang = FS_PRO_24MOUNTAIN_YINYANG[mountain] !== '阴';
  var flyOrder;
  if (isYang) {
    // 顺飞：中→乾→兑→艮→离→坎→坤→震→巽
    flyOrder = ['中','西北','西','东北','南','北','西南','东','东南'];
  } else {
    // 逆飞：中→巽→震→坤→坎→离→艮→兑→乾
    flyOrder = ['中','东南','东','西南','北','南','东北','西','西北'];
  }
  var order = [centerStar];
  var next = centerStar;
  for (var i = 0; i < 8; i++) {
    next = next >= 9 ? 1 : next + 1;
    order.push(next);
  }
  var pos = {};
  for (var i = 0; i < flyOrder.length; i++) {
    pos[flyOrder[i]] = order[i];
  }
  return pos;
}

/** 命卦计算（2000年前后分式，依古制）
 * 1900-1999：男 = (11 - 数根)%9，女 = (数根 + 4)%9
 * 2000+：男 = (9 - 数根)%9，女 = (数根 + 6)%9
 * 数根 = 年份各位数字相加至一位
 */
function _fsProMingGua(year, sex) {
  // 计算年份数字根
  var digits = String(year).split('');
  var numRoot = 0;
  for (var d = 0; d < digits.length; d++) {
    numRoot += parseInt(digits[d]);
  }
  while (numRoot >= 10) {
    var s = String(numRoot).split('');
    numRoot = 0;
    for (var d = 0; d < s.length; d++) numRoot += parseInt(s[d]);
  }
  var gua;
  if (year >= 2000) {
    if (sex === 'male') {
      gua = ((9 - numRoot) % 9 + 9) % 9;
    } else {
      gua = ((numRoot + 6) % 9 + 9) % 9;
    }
  } else {
    if (sex === 'male') {
      gua = ((11 - numRoot) % 9 + 9) % 9;
    } else {
      gua = ((numRoot + 4) % 9 + 9) % 9;
    }
  }
  if (gua === 0) gua = 9;
  if (gua === 5) gua = sex === 'male' ? 2 : 8;
  var isDong = [1, 9, 3, 4].includes(gua);
  var nameMap = { 1: '坎', 2: '坤', 3: '震', 4: '巽', 6: '乾', 7: '兑', 8: '艮', 9: '离' };
  return { gua: gua, guaName: nameMap[gua], isDong: isDong, type: isDong ? '东四命' : '西四命' };
}

/** 八宅游星推算 */
function _fsProBazhai(zhaiGua) {
  // 以宅卦为准，推算八方游星
  // 伏位→生气→延年→天医→祸害→六煞→五鬼→绝命
  var bazhaiMap = {
    1: { '北':'伏位','南':'延年','东':'天医','西':'祸害','东南':'生气','西南':'绝命','西北':'六煞','东北':'五鬼' },
    2: { '北':'绝命','南':'天医','东':'祸害','西':'延年','东南':'五鬼','西南':'伏位','西北':'生气','东北':'天医' },
    3: { '北':'天医','南':'生气','东':'伏位','西':'绝命','东南':'延年','西南':'祸害','西北':'五鬼','东北':'六煞' },
    4: { '北':'生气','南':'天医','东':'延年','西':'六煞','东南':'伏位','西南':'五鬼','西北':'祸害','东北':'绝命' },
    6: { '北':'六煞','南':'祸害','东':'五鬼','西':'生气','东南':'祸害','西南':'天医','西北':'伏位','东北':'天医' },
    7: { '北':'祸害','南':'延年','东':'绝命','西':'伏位','东南':'六煞','西南':'天医','西北':'生气','东北':'五鬼' },
    8: { '北':'五鬼','南':'祸害','东':'六煞','西':'天医','东南':'绝命','西南':'生气','西北':'天医','东北':'伏位' },
    9: { '北':'延年','南':'伏位','东':'生气','西':'六煞','东南':'天医','西南':'五鬼','西北':'绝命','东北':'祸害' }
  };
  return bazhaiMap[zhaiGua] || bazhaiMap[1];
}

/** Toast 提示 */
function _fsProToast(msg) {
  if (typeof showToast === 'function') { showToast(msg); return; }
  var t = document.createElement('div');
  t.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);background:rgba(201,168,76,0.95);color:#080808;padding:10px 24px;border-radius:8px;font-size:13px;letter-spacing:2px;z-index:99999;box-shadow:0 4px 20px rgba(0,0,0,0.3)';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(function() { t.remove(); }, 2400);
}

/** 生成带颜色的星盘 HTML */
function _fsProStarColor(star) {
  var colors = { 1:'#5dade2', 2:'#e74c3c', 3:'#27ae60', 4:'#27ae60', 5:'#e74c3c', 6:'#bdc3c7', 7:'#e67e22', 8:'#f1c40f', 9:'#e74c3c' };
  return colors[star] || '#c9a84c';
}

// ============================================================
// 1. 每日风水方位指南
// ============================================================

/**
 * 每日风水方位指南
 * 依据日干支、日建、流月飞星推算当日吉凶方位
 * 参考：《钦定协纪辨方书》《玉匣记》《紫白诀》
 */
function getDailyFengshuiGuide() {
  var date = new Date();
  var gz = _fsProDayGanZhi(date);
  var dayGan = gz.gan;
  var dayGanEle = FS_PRO_WUXING_GAN[dayGan];

  // 财神方位：日干所克之方位
  var caiShenMap = {
    '甲':'东北','乙':'东北','丙':'正西','丁':'正西',
    '戊':'正北','己':'正北','庚':'正东','辛':'正东',
    '壬':'正南','癸':'正南'
  };
  // 喜神方位
  var xiShenMap = {
    '甲己':'艮（东北偏东）','乙庚':'乾（西北偏北）','丙辛':'坤（西南偏南）',
    '丁壬':'离（正南）','戊癸':'巽（东南偏南）'
  };
  var xiKey = dayGan + (['甲','乙','丙','丁','戊'].includes(dayGan) ? FS_PRO_GAN[(FS_PRO_GAN.indexOf(dayGan) + 5) % 10] : '');
  // 喜神方位：依日干五合（五虎遁）取喜神所在方位，古制逐日推算
  var xiShenSimple = {
    '甲':'艮（东北偏东）','乙':'乾（西北偏北）','丙':'坤（西南偏南）',
    '丁':'离（正南）','戊':'巽（东南偏南）',
    '己':'艮（东北偏东）','庚':'乾（西北偏北）','辛':'坤（西南偏南）',
    '壬':'离（正南）','癸':'巽（东南偏南）'
  };
  // 福神方位
  var fuShenMap = {
    '甲':'东南','乙':'正北','丙':'正东','丁':'东南',
    '戊':'正北','己':'正东','庚':'东南','辛':'正北',
    '壬':'正东','癸':'东南'
  };

  // 当月飞星
  var monthCenter = _fsProMonthCenter(date.getFullYear(), date.getMonth() + 1);
  var monthStars = _fsProFlyingStarGrid(monthCenter);
  // 当年飞星
  var yearCenter = _fsProYearCenter(date.getFullYear());
  var yearStars = _fsProFlyingStarGrid(yearCenter);

  // 五黄位（年+月）
  var wuhuangYear = '中';
  var wuhuangMonth = '中';
  for (var d in yearStars) { if (yearStars[d] === 5) wuhuangYear = d; }
  for (var dm in monthStars) { if (monthStars[dm] === 5) wuhuangMonth = dm; }
  // 二黑位
  var erheiYear = '中';
  for (var dy in yearStars) { if (yearStars[dy] === 2) erheiYear = dy; }

  // 出行吉方（喜神方 + 生气方）
  var chuxingJi = xiShenSimple[dayGan];

  // 日建（地支）对应的煞方
  var shaMap = {
    '子':'南（午方）','丑':'东（寅方）','寅':'北（申方）','卯':'西（酉方）',
    '辰':'南（巳方）','巳':'东（辰方）','午':'北（子方）','未':'西（丑方）',
    '申':'南（寅方）','酉':'东（卯方）','戌':'北（辰方）','亥':'西（巳方）'
  };
  var daySha = shaMap[gz.zhi] || '无';

  var html = '';
  html += '<div class="fs-pro-result" style="animation:fadeUp .6s ease">';

  // 日期信息
  html += '<div style="text-align:center;margin-bottom:24px">' +
    '<div style="font-size:14px;opacity:.5;letter-spacing:3px">' + _fsProFmtDate(date) + '</div>' +
    '<div style="font-size:24px;color:var(--gold);font-family:Ma Shan Zheng,serif;letter-spacing:6px;margin-top:8px">' + gz.gan + gz.zhi + '日</div>' +
    '<div style="font-size:11px;opacity:.4;margin-top:4px">日干<strong style="color:var(--gold)">' + dayGan + '</strong>（' + dayGanEle + '）· 日支<strong style="color:var(--gold)">' + gz.zhi + '</strong>（' + FS_PRO_WUXING_ZHI[gz.zhi] + '）</div>' +
    '</div>';

  // 三大神位
  html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px">';
  html += _fsProGodCard('💰', '财神方位', caiShenMap[dayGan], '#f1c40f', '宜面朝此方交易、谈财、摆放招财物');
  html += _fsProGodCard('💕', '喜神方位', xiShenSimple[dayGan], '#e74c3c', '宜面朝此方婚嫁、相亲、谈判');
  html += _fsProGodCard('🌟', '福神方位', fuShenMap[dayGan], '#27ae60', '宜面朝此方祈福、许愿、求子');
  html += '</div>';

  // 今日不宜方位
  html += '<div style="background:rgba(231,76,60,0.06);border:1px solid rgba(231,76,60,0.2);border-radius:10px;padding:16px;margin-bottom:20px">';
  html += '<h5 style="color:#e74c3c;font-size:13px;letter-spacing:3px;margin-bottom:12px">⚠️ 今日不宜方位</h5>';
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;font-size:12px">';
  html += '<div><strong style="color:#e74c3c">五黄大煞（年）：</strong>' + wuhuangYear + '方 — 忌动土、久坐</div>';
  html += '<div><strong style="color:#e74c3c">五黄大煞（月）：</strong>' + wuhuangMonth + '方 — 忌动土、装修</div>';
  html += '<div><strong style="color:#e67e22">二黑病符（年）：</strong>' + erheiYear + '方 — 忌久卧、宜静</div>';
  html += '<div><strong style="color:#e67e22">日煞方：</strong>' + daySha + ' — 忌出行、动土</div>';
  html += '</div></div>';

  // 出行吉方
  html += '<div style="background:rgba(46,204,113,0.06);border:1px solid rgba(46,204,113,0.2);border-radius:10px;padding:16px;margin-bottom:20px">';
  html += '<h5 style="color:#2ecc71;font-size:13px;letter-spacing:3px;margin-bottom:8px">🧭 今日出行吉方</h5>';
  html += '<p style="font-size:13px;line-height:1.8;opacity:.8">首选：<strong style="color:#2ecc71">' + chuxingJi + '</strong>（喜神方）<br>';
  html += '次选：<strong style="color:#f1c40f">' + caiShenMap[dayGan] + '</strong>（财神方）<br>';
  html += '<span style="opacity:.5">出行、面试、谈生意宜面朝吉方。若不得已须向凶方，可先朝吉方行数步再转向。</span></p>';
  html += '</div>';

  // 动土方位
  html += '<div style="background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.2);border-radius:10px;padding:16px;margin-bottom:20px">';
  html += '<h5 style="color:var(--gold);font-size:13px;letter-spacing:3px;margin-bottom:8px">🔨 动土方位吉凶</h5>';
  html += '<p style="font-size:12px;line-height:1.8;opacity:.7">';
  var dongtuJi = (wuhuangYear === '中' && wuhuangMonth === '中');
  if (daySha.indexOf('无') !== -1) {
    html += '今日无严重煞方，动土可视情况而行。';
  } else {
    html += '日煞在' + daySha + '，此方今日<span style="color:#e74c3c">不宜动土</span>。<br>';
    html += '年五黄在' + wuhuangYear + '方、月五黄在' + wuhuangMonth + '方，此二方<span style="color:#e74c3c">大忌动土</span>。<br>';
    html += '其余方位可酌情动土，但须避开太岁方与三煞方。';
  }
  html += '</p></div>';

  // 入宅搬家吉日提示
  html += '<div style="background:rgba(155,89,182,0.06);border:1px solid rgba(155,89,182,0.2);border-radius:10px;padding:16px">';
  html += '<h5 style="color:#9b59b6;font-size:13px;letter-spacing:3px;margin-bottom:8px">🏠 入宅搬家提示</h5>';
  html += '<p style="font-size:12px;line-height:1.8;opacity:.7">入宅择日须看家主命卦与宅卦是否相配，避开五黄、二黑方位。<br>';
  html += '<span style="opacity:.6">建议使用「风水择日」功能精确查询入宅吉日。</span></p>';
  html += '<button class="compute-btn" style="margin-top:12px;padding:8px 24px;font-size:12px" onclick="showFengshuiProSub(\'fengshui-zeri-content\',document.querySelectorAll(\'#section-fengshui-pro .fs-pro-subtab\')[6])">前往风水择日 →</button>';
  html += '</div>';

  html += '</div>';
  return html;
}

function _fsProGodCard(icon, title, direction, color, desc) {
  return '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(201,168,76,0.12);border-radius:10px;padding:16px;text-align:center">' +
    '<div style="font-size:28px;margin-bottom:6px">' + icon + '</div>' +
    '<div style="font-size:12px;opacity:.5;letter-spacing:2px;margin-bottom:4px">' + title + '</div>' +
    '<div style="font-size:18px;color:' + color + ';font-weight:bold;letter-spacing:3px;margin-bottom:6px">' + direction + '</div>' +
    '<div style="font-size:10px;opacity:.4;line-height:1.6">' + desc + '</div>' +
    '</div>';
}

function _fsProFmtDate(d) {
  var y = d.getFullYear();
  var m = (d.getMonth() + 1).toString().padStart(2, '0');
  var day = d.getDate().toString().padStart(2, '0');
  var week = ['日','一','二','三','四','五','六'][d.getDay()];
  return y + '年' + m + '月' + day + '日 星期' + week;
}

// ============================================================
// 2. 家居布局诊断
// ============================================================

/**
 * 家居布局诊断
 * 用户输入宅门朝向和各房间方位，根据八宅法+玄空飞星综合诊断
 * 参考：《八宅明镜》《阳宅三要》《沈氏玄空学》
 */
function diagnoseHomeLayout() {
  var doorDir = document.getElementById('fs-pro-door-dir').value;
  var bedroomDir = document.getElementById('fs-pro-bedroom-dir').value;
  var kitchenDir = document.getElementById('fs-pro-kitchen-dir').value;
  var bathroomDir = document.getElementById('fs-pro-bathroom-dir').value;
  var studyDir = document.getElementById('fs-pro-study-dir').value;
  var livingDir = document.getElementById('fs-pro-living-dir').value;
  var buildYear = parseInt(document.getElementById('fs-pro-build-year').value) || 2000;

  // 宅卦推算：以门向定宅卦
  var dirToGua = { '北':1, '南':9, '东':3, '西':7, '东南':4, '西南':2, '西北':6, '东北':8 };
  var zhaiGua = dirToGua[doorDir] || 1;
  var bazhai = _fsProBazhai(zhaiGua);
  var yearStar = _fsProYearCenter(buildYear);
  var yearStarPos = _fsProFlyingStarGrid(yearStar);
  var currentYearStar = _fsProYearCenter(new Date().getFullYear());
  var currentStarPos = _fsProFlyingStarGrid(currentYearStar);

  // 八宅吉凶位说明
  var bazhaiDesc = {
    '生气': { level: '大吉', color: '#2ecc71', desc: '生气星主丁财两旺，精力充沛，宜主卧、书房', items: '宜放发财树、水晶洞、绿色植物催旺' },
    '天医': { level: '吉', color: '#27ae60', desc: '天医星主健康长寿，宜卧室、疗养', items: '宜放葫芦、玉器、铜制摆件' },
    '延年': { level: '吉', color: '#f1c40f', desc: '延年星主人际和谐、姻缘，宜主卧、客厅', items: '宜放粉色水晶、和合二仙、双数摆件' },
    '伏位': { level: '平吉', color: '#c9a84c', desc: '伏位主安定平稳，宜书房、静室', items: '宜放山水画、陶瓷制品、泰山石' },
    '祸害': { level: '凶', color: '#e67e22', desc: '祸害星主是非、官非、口舌', items: '宜放五帝钱、黄水晶球化解' },
    '六煞': { level: '凶', color: '#e74c3c', desc: '六煞星主感情纠纷、破财', items: '宜放黑曜石球、铜葫芦化解' },
    '五鬼': { level: '大凶', color: '#c0392b', desc: '五鬼星主火灾、盗窃、官非', items: '宜放五帝钱、铜铃、白水晶簇化解' },
    '绝命': { level: '大凶', color: '#dc3545', desc: '绝命星主破财、伤丁、疾病', items: '宜放五帝钱、铜葫芦、黑曜石化解' }
  };

  // 各房间诊断
  var rooms = [
    { name: '大门', dir: doorDir, icon: '🚪', importance: '大门为气口，主一宅之枢' },
    { name: '主卧', dir: bedroomDir, icon: '🛏️', importance: '主卧关系家主健康与夫妻感情' },
    { name: '厨房', dir: kitchenDir, icon: '🍳', importance: '厨房主饮食健康，火气所在' },
    { name: '卫生间', dir: bathroomDir, icon: '🚿', importance: '卫生间为污秽之源，宜压凶方' },
    { name: '书房', dir: studyDir, icon: '📚', importance: '书房主学业与事业运' },
    { name: '客厅', dir: livingDir, icon: '🛋️', importance: '客厅主家庭和睦与财运' }
  ];

  var html = '';
  html += '<div class="fs-pro-result" style="animation:fadeUp .6s ease">';

  // 宅卦信息
  var guaName = { 1:'坎',2:'坤',3:'震',4:'巽',6:'乾',7:'兑',8:'艮',9:'离' }[zhaiGua];
  html += '<div style="text-align:center;margin-bottom:20px;padding:16px;background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.2);border-radius:10px">';
  html += '<div style="font-size:14px;opacity:.5;letter-spacing:2px">宅卦</div>';
  html += '<div style="font-size:28px;color:var(--gold);font-family:Ma Shan Zheng,serif;letter-spacing:6px">' + guaName + '宅 · ' + doorDir + '向</div>';
  html += '<div style="font-size:11px;opacity:.4;margin-top:4px">建造年份：' + buildYear + '年 · ' + yearStar + '入中宫</div>';
  html += '</div>';

  // 逐房间诊断
  for (var i = 0; i < rooms.length; i++) {
    var r = rooms[i];
    var bPos = bazhai[r.dir] || '伏位';
    var bInfo = bazhaiDesc[bPos] || bazhaiDesc['伏位'];
    var yStar = currentStarPos[r.dir] || 0;
    var starInfo = FS_PRO_STARS[yStar] || { name: '未知', desc: '', auspicious: false };

    // 特殊诊断
    var special = '';
    if (r.name === '厨房') {
      // 厨房属火，不宜在北方（水克火）
      if (r.dir === '北') {
        special = '<div style="color:#e74c3c;font-size:12px;margin-top:6px">⚠️ 厨房在北方，水火相冲，《阳宅三要》云"灶压北方，水火既济"，宜灶台朝东或南化解</div>';
      } else if (r.dir === '南') {
        special = '<div style="color:#e67e22;font-size:12px;margin-top:6px">⚠️ 厨房在南方，火气过旺，宜用黄色陶瓷器皿泄火气</div>';
      } else if (r.dir === '东南' || r.dir === '东') {
        special = '<div style="color:#2ecc71;font-size:12px;margin-top:6px">✅ 厨房在木方，木生火，灶火旺盛，大吉</div>';
      }
    }
    if (r.name === '卫生间') {
      // 卫生间宜压凶方
      if (['绝命','五鬼','六煞','祸害'].includes(bPos)) {
        special = '<div style="color:#2ecc71;font-size:12px;margin-top:6px">✅ 卫生间压凶方' + bPos + '位，以毒攻毒，符合"凶方宜压"原则</div>';
      } else {
        special = '<div style="color:#e74c3c;font-size:12px;margin-top:6px">⚠️ 卫生间在吉方' + bPos + '位，污秽冲吉，宜保持干燥清洁，放盐灯化解</div>';
      }
    }
    if (r.name === '大门') {
      if (['生气','天医','延年','伏位'].includes(bPos)) {
        special = '<div style="color:#2ecc71;font-size:12px;margin-top:6px">✅ 大门开在' + bPos + '位，纳吉气入宅，大吉</div>';
      } else {
        special = '<div style="color:#e67e22;font-size:12px;margin-top:6px">⚠️ 大门开在' + bPos + '位，入门气不纯，宜在玄关放铜葫芦或五帝钱化解</div>';
      }
    }
    if (r.name === '主卧') {
      if (['绝命','五鬼'].includes(bPos)) {
        special = '<div style="color:#e74c3c;font-size:12px;margin-top:6px">⚠️ 主卧在大凶位，影响健康与夫妻感情，建议换房或床头朝吉方化解</div>';
      } else if (['生气','天医','延年'].includes(bPos)) {
        special = '<div style="color:#2ecc71;font-size:12px;margin-top:6px">✅ 主卧在吉位，利于健康与夫妻和睦</div>';
      }
    }
    if (r.name === '书房') {
      // 文昌位：四绿星所在方位或东南方
      var wenchangDir = '东南';
      for (var wd in currentStarPos) { if (currentStarPos[wd] === 4) wenchangDir = wd; }
      if (r.dir === wenchangDir) {
        special = '<div style="color:#2ecc71;font-size:12px;margin-top:6px">✅ 书房在文昌位（' + wenchangDir + '），大利学业与考试</div>';
      }
    }
    if (r.name === '客厅') {
      // 财位：明财位为大门对角线方位，暗财位依宅卦生气方定
      // 明财位：大门对角线45°方位
      var mingCaiwei = _fsProMingCaiwei(doorDir);
      // 暗财位：依宅卦生气方
      var anCaiwei = '东南';
      for (var cd in bazhai) { if (bazhai[cd] === '生气') anCaiwei = cd; }
      var caiwei = mingCaiwei || anCaiwei;
      if (r.dir === caiwei) {
        special = '<div style="color:#2ecc71;font-size:12px;margin-top:6px">✅ 客厅在财位（' + caiwei + '方，明财位），宜放聚宝盆、黄水晶球催财</div>';
      } else if (r.dir === anCaiwei) {
        special = '<div style="color:#2ecc71;font-size:12px;margin-top:6px">✅ 客厅在暗财位（' + anCaiwei + '方，生气位），宜放貔貅、金蟾催财</div>';
      } else {
        special = '<div style="font-size:12px;margin-top:6px;opacity:.5">💡 本宅明财位在' + mingCaiwei + '方，暗财位在' + anCaiwei + '方，可在此方放黄水晶球或聚宝盆</div>';
      }
    }

    html += '<div style="background:rgba(255,255,255,0.02);border:1px solid rgba(201,168,76,0.1);border-radius:10px;padding:16px;margin-bottom:12px">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">';
    html += '<span style="font-size:16px">' + r.icon + ' ' + r.name + ' — ' + r.dir + '方</span>';
    html += '<span style="font-size:11px;padding:2px 10px;border-radius:4px;background:' + bInfo.color + '20;color:' + bInfo.color + '">' + bPos + ' · ' + bInfo.level + '</span>';
    html += '</div>';
    html += '<p style="font-size:12px;opacity:.6;line-height:1.7;margin-bottom:4px">' + r.importance + '</p>';
    html += '<p style="font-size:12px;opacity:.7;line-height:1.7">八宅' + bPos + '：' + bInfo.desc + '</p>';
    html += '<p style="font-size:11px;opacity:.5;margin-top:4px">流年飞星：' + starInfo.name + '（' + starInfo.desc + '）</p>';
    html += '<p style="font-size:11px;opacity:.5">' + bInfo.items + '</p>';
    if (special) html += special;
    html += '</div>';
  }

  // 综合建议
  html += '<div style="background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.2);border-radius:10px;padding:16px;margin-top:12px">';
  html += '<h5 style="color:var(--gold);font-size:13px;letter-spacing:3px;margin-bottom:10px">📋 综合布局建议</h5>';
  html += '<ol style="font-size:12px;line-height:2;opacity:.7;padding-left:20px">';
  html += '<li>大门为气口，宜保持干净明亮，不可堆放杂物</li>';
  html += '<li>主卧宜在生气、天医、延年方，床头朝命卦吉方</li>';
  html += '<li>厨房灶台朝向宜东或南，忌北（水克火）</li>';
  html += '<li>卫生间宜压绝命、五鬼、六煞、祸害方</li>';
  html += '<li>书房宜在文昌位（四绿星所在方或东南方）</li>';
  html += '<li>客厅财位宜放聚宝盆、黄水晶球、发财树催财</li>';
  html += '<li>《阳宅三要》云："门、主、灶"为阳宅三要，三者相生为吉，相克为凶</li>';
  html += '</ol></div>';

  html += '</div>';
  return html;
}

// ============================================================
// 3. 商铺/办公室风水
// ============================================================

/**
 * 商铺/办公室风水分析
 * 参考：《八宅明镜》《阳宅三要》《商业风水秘笈》
 */
function analyzeBusinessFengshui() {
  var shopType = document.getElementById('fs-pro-shop-type').value;
  var doorDir = document.getElementById('fs-pro-shop-door').value;
  var cashierDir = document.getElementById('fs-pro-cashier').value;
  var bossDir = document.getElementById('fs-pro-boss-office').value;
  var staffDir = document.getElementById('fs-pro-staff-area').value;
  var counterDir = document.getElementById('fs-pro-counter').value;

  var dirToGua = { '北':1, '南':9, '东':3, '西':7, '东南':4, '西南':2, '西北':6, '东北':8 };
  var zhaiGua = dirToGua[doorDir] || 1;
  var bazhai = _fsProBazhai(zhaiGua);
  var currentYear = new Date().getFullYear();
  var currentStarPos = _fsProFlyingStarGrid(_fsProYearCenter(currentYear));

  var bazhaiDesc = {
    '生气': { level: '大吉', color: '#2ecc71', desc: '丁财两旺', action: '宜设收银台、老板办公室' },
    '天医': { level: '吉', color: '#27ae60', desc: '健康贵人', action: '宜休息区、财务室' },
    '延年': { level: '吉', color: '#f1c40f', desc: '人缘和谐', action: '宜会客室、洽谈区' },
    '伏位': { level: '平吉', color: '#c9a84c', desc: '平稳安定', action: '宜仓库、储藏' },
    '祸害': { level: '凶', color: '#e67e22', desc: '是非口舌', action: '宜仓库、卫生间' },
    '六煞': { level: '凶', color: '#e74c3c', desc: '破财纠纷', action: '宜卫生间、通道' },
    '五鬼': { level: '大凶', color: '#c0392b', desc: '火灾盗窃', action: '宜卫生间、储藏' },
    '绝命': { level: '大凶', color: '#dc3545', desc: '破财伤丁', action: '宜仓库、卫生间' }
  };

  var areas = [
    { name: '大门/入口', dir: doorDir, icon: '🚪', role: '纳气之口，决定商铺整体气运' },
    { name: '收银台', dir: cashierDir, icon: '💰', role: '财位所在，关系商铺营收' },
    { name: '老板办公室', dir: bossDir, icon: '👔', role: '决策中心，关系老板运势' },
    { name: '员工工位区', dir: staffDir, icon: '💼', role: '员工工作效率与团队和谐' },
    { name: '展示柜台', dir: counterDir, icon: '🏷️', role: '商品展示与销售' }
  ];

  var html = '';
  html += '<div class="fs-pro-result" style="animation:fadeUp .6s ease">';

  // 店铺类型信息
  var shopTypeInfo = {
    'retail': '零售商铺',
    'restaurant': '餐饮店铺',
    'office': '办公场所',
    'beauty': '美容美发',
    'clinic': '诊所药房'
  };
  html += '<div style="text-align:center;margin-bottom:20px;padding:16px;background:rgba(46,204,113,0.06);border:1px solid rgba(46,204,113,0.2);border-radius:10px">';
  html += '<div style="font-size:16px;color:#2ecc71;letter-spacing:3px">🏢 ' + (shopTypeInfo[shopType] || '商铺') + '风水分析</div>';
  html += '<div style="font-size:11px;opacity:.4;margin-top:4px">门朝' + doorDir + ' · ' + currentYear + '年流年飞星</div>';
  html += '</div>';

  // 各区域诊断
  for (var i = 0; i < areas.length; i++) {
    var a = areas[i];
    var bPos = bazhai[a.dir] || '伏位';
    var bInfo = bazhaiDesc[bPos] || bazhaiDesc['伏位'];
    var yStar = currentStarPos[a.dir] || 0;
    var starInfo = FS_PRO_STARS[yStar] || { name: '未知', desc: '' };

    var advice = '';
    if (a.name === '收银台') {
      if (['生气','天医','延年'].includes(bPos)) {
        advice = '收银台在吉位，大吉。宜在收银台放黄水晶球、金蟾、貔貅催财。背后宜有靠（墙或屏风），不可背对大门。';
      } else {
        advice = '收银台在凶位，建议移至生气或延年方。若无法移动，可在收银台放铜葫芦+五帝钱化解，并在台面铺红色或金色台布。';
      }
    } else if (a.name === '老板办公室') {
      if (['生气','延年','天医'].includes(bPos)) {
        advice = '老板办公室在吉位，决策英明，贵人相助。办公桌宜坐北朝南或坐西向东，背后宜有靠。';
      } else {
        advice = '老板办公室在凶位，易决策失误。建议办公桌朝向吉方（东四命朝东/东南/南/北，西四命朝西/西南/西北/东北），椅背挂山水画。';
      }
    } else if (a.name === '员工工位区') {
      if (['生气','延年'].includes(bPos)) {
        advice = '员工区在吉位，团队和谐，效率高。工位宜背靠实墙，面朝开阔方向。';
      } else {
        advice = '员工区在凶位，易生口舌是非。可在区域四角放黑曜石球化解，员工桌面可放小型绿色植物。';
      }
    } else if (a.name === '展示柜台') {
      if (['生气','延年'].includes(bPos)) {
        advice = '展示柜在吉位，客源旺盛，成交率高。宜用暖色灯光照亮商品。';
      } else {
        advice = '展示柜在凶位，客流不旺。建议增加照明亮度，柜台放水晶球聚气。';
      }
    } else if (a.name === '大门/入口') {
      if (['生气','天医','延年'].includes(bPos)) {
        advice = '大门在吉位，纳吉气入店，客源自然旺盛。门前宜开阔干净，不可有遮挡。';
      } else {
        advice = '大门在凶位，入门气不纯。建议在门口放铜葫芦或五帝钱化解，入口处设流水摆件引气。';
      }
    }

    html += '<div style="background:rgba(255,255,255,0.02);border:1px solid rgba(201,168,76,0.1);border-radius:10px;padding:16px;margin-bottom:12px">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">';
    html += '<span style="font-size:15px">' + a.icon + ' ' + a.name + ' — ' + a.dir + '方</span>';
    html += '<span style="font-size:11px;padding:2px 10px;border-radius:4px;background:' + bInfo.color + '20;color:' + bInfo.color + '">' + bPos + ' · ' + bInfo.level + '</span>';
    html += '</div>';
    html += '<p style="font-size:11px;opacity:.5;line-height:1.6;margin-bottom:6px">' + a.role + '</p>';
    html += '<p style="font-size:12px;opacity:.7;line-height:1.7">' + advice + '</p>';
    html += '<p style="font-size:10px;opacity:.4;margin-top:4px">流年飞星：' + starInfo.name + '（' + starInfo.desc + '）</p>';
    html += '</div>';
  }

  // 招财摆件推荐
  html += '<div style="background:rgba(241,196,15,0.06);border:1px solid rgba(241,196,15,0.2);border-radius:10px;padding:16px;margin-top:12px">';
  html += '<h5 style="color:#f1c40f;font-size:13px;letter-spacing:3px;margin-bottom:10px">🔮 招财摆件推荐</h5>';
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;font-size:12px">';
  html += '<div>🤑 <strong>金蟾</strong>：嘴含铜钱，朝向室内，放收银台招财</div>';
  html += '<div>🐉 <strong>貔貅</strong>：头朝门外，放门口两侧，招财辟邪</div>';
  html += '<div>💎 <strong>黄水晶球</strong>：放财位或收银台，聚财气</div>';
  html += '<div>🐟 <strong>风水鱼缸</strong>：放生气方，养6条或9条金鱼催财</div>';
  html += '<div>🪴 <strong>发财树</strong>：放门口或财位，叶大招财</div>';
  html += '<div>💰 <strong>聚宝盆</strong>：放财位，内放硬币、水晶碎石</div>';
  html += '</div></div>';

  // 开业择日提示
  html += '<div style="background:rgba(155,89,182,0.06);border:1px solid rgba(155,89,182,0.2);border-radius:10px;padding:16px;margin-top:12px">';
  html += '<h5 style="color:#9b59b6;font-size:13px;letter-spacing:3px;margin-bottom:8px">📅 开业择日提示</h5>';
  html += '<p style="font-size:12px;opacity:.6;line-height:1.8">开业择日须结合行业五行与老板八字命卦：<br>';
  html += '· 零售餐饮宜选财星旺日（甲子、丙寅、戊辰、庚午、壬申）<br>';
  html += '· 美容美发宜选桃花旺日（甲卯、丙午、戊未）<br>';
  html += '· 诊所药房宜选天医旺日（乙巳、丁未、己酉）<br>';
  html += '<span style="opacity:.5">精确择日请使用「风水择日」功能</span></p>';
  html += '<button class="compute-btn" style="margin-top:12px;padding:8px 24px;font-size:12px" onclick="showFengshuiProSub(\'fengshui-zeri-content\',document.querySelectorAll(\'#section-fengshui-pro .fs-pro-subtab\')[6])">前往风水择日 →</button>';
  html += '</div>';

  html += '</div>';
  return html;
}

// ============================================================
// 4. 风水化煞大全
// ============================================================

/**
 * 风水化煞大全
 * 收录12种常见煞气及化解方案
 * 参考：《阳宅大全》《风水化煞全书记》《沈氏玄空学》
 */
function getShaqiCatalog() {
  var shaqiList = [
    {
      name: '路冲煞',
      icon: '🛣️',
      severity: '大凶',
      identify: '住宅大门或窗户正对一条直路、走廊或河道，如箭射来。路越长、越窄，煞气越重。常见于T字路口尽头、长走廊正对的房间。',
      harm: '主血光之灾、车祸、破财、家人健康受损。路冲距离越近，凶应越快。',
      cure: [
        { item: '泰山石敢当', material: '青石', color: '灰色', placement: '埋于门前地下，或立石碑于路冲方向', count: '1块' },
        { item: '凸面八卦镜', material: '铜制', color: '金色', placement: '挂在门楣或窗框上方，镜面朝向路冲方向', count: '1面' },
        { item: '铜葫芦', material: '纯铜', color: '金色', placement: '挂在冲煞方位的窗边', count: '1对' }
      ],
      classic: '《阳宅大全》："路冲如箭，伤害无剩。"路冲为最常见且最凶之煞。'
    },
    {
      name: '角煞（尖角煞）',
      icon: '📐',
      severity: '凶',
      identify: '邻近建筑的尖角、屋檐角、广告牌尖角正对本宅，如刀尖刺来。也见于室内尖锐家具的尖角正对座位或床位。',
      harm: '主健康受损、易患怪病、精神不安、口舌是非。尖煞正对卧室影响睡眠，正对书房影响思维。',
      cure: [
        { item: '凹面八卦镜', material: '铜制', color: '金色', placement: '挂在被冲的窗框上，凹面朝向尖角', count: '1面' },
        { item: '盆栽植物', material: '活体植物', color: '绿色', placement: '在窗台放高大绿色植物（如仙人掌、龙骨）挡煞', count: '1-2盆' },
        { item: '窗帘', material: '厚布料', color: '深色', placement: '拉上窗帘遮挡尖角视线', count: '1副' }
      ],
      classic: '《沈氏玄空学》："尖角如锋，伤人无形。"尖角煞为视觉与气场双重伤害。'
    },
    {
      name: '天斩煞',
      icon: '⚡',
      severity: '大凶',
      identify: '两栋高楼之间的狭窄缝隙正对本宅，如天空被劈开一道裂缝。缝隙越窄、距离越近，煞气越重。',
      harm: '主血光之灾、意外伤害、家人健康严重受损。易招官非、破大财。',
      cure: [
        { item: '铜马', material: '纯铜', color: '金色', placement: '在面向天斩煞的窗台放一对铜马，马头朝外', count: '1对' },
        { item: '凸面八卦镜', material: '铜制', color: '金色', placement: '挂在窗框上方，凸面朝向缝隙', count: '1面' },
        { item: '五帝钱', material: '铜钱', color: '金色', placement: '挂在窗框两侧', count: '1串' }
      ],
      classic: '《风水化煞全书》："天斩如刀，劈宅伤丁。"天斩煞为城市高楼常见凶煞。'
    },
    {
      name: '穿心煞',
      icon: '🎯',
      severity: '大凶',
      identify: '大门正对后门、或大门正对阳台窗户，形成直线穿堂风。也见于走廊直通到底、或楼下有隧道通道穿过楼宇。',
      harm: '主漏财、气场不稳、家人健康下滑。穿堂风使气无法聚于宅内，财来财去。',
      cure: [
        { item: '屏风/玄关柜', material: '木质', color: '木色/深色', placement: '在门内1-2米处设屏风或玄关柜，阻挡气流直冲', count: '1个' },
        { item: '珠帘/布帘', material: '水晶珠或厚布', color: '暖色', placement: '在门与窗之间挂长珠帘或布帘', count: '1副' },
        { item: '绿色植物', material: '活体植物', color: '绿色', placement: '在穿堂通道中间放大盆植物挡气', count: '1-2盆' }
      ],
      classic: '《阳宅三要》："气乘风则散，界水则止。"穿心煞使气散不聚，最主破财。'
    },
    {
      name: '反弓煞',
      icon: '🏹',
      severity: '凶',
      identify: '住宅位于弯路、河流的外侧弧线处，弧形如弓背朝向本宅。也见于天桥/高架桥的外弯处。',
      harm: '主破财、是非、健康问题。反弓方向所对应的家中成员受影响最大。',
      cure: [
        { item: '泰山石', material: '青石', color: '灰色', placement: '在反弓方向的窗台或门口放泰山石', count: '1块' },
        { item: '植物', material: '活体植物', color: '绿色', placement: '在反弓方向种高大树木或放盆栽', count: '1-3株' },
        { item: '凸面八卦镜', material: '铜制', color: '金色', placement: '挂在面向反弓方向的窗框上', count: '1面' }
      ],
      classic: '《八宅明镜》："反弓无情，退财伤丁。"反弓煞在城市河岸、弯道旁常见。'
    },
    {
      name: '镰刀煞',
      icon: '🔪',
      severity: '大凶',
      identify: '天桥、高架桥的弧形弯道如镰刀般切向本宅，或带弯刀形的广告牌、屋檐正对本宅。',
      harm: '主血光之灾、意外破财、家人易有手术或外伤。',
      cure: [
        { item: '铜麒麟', material: '纯铜', color: '金色', placement: '在镰刀切来方向的窗台放一对铜麒麟', count: '1对' },
        { item: '凸面八卦镜', material: '铜制', color: '金色', placement: '挂在被煞窗框上方', count: '1面' },
        { item: '红绳', material: '丝绳', color: '红色', placement: '在窗框缠绕红绳化解', count: '1条' }
      ],
      classic: '《风水化煞全书》："镰刀如割，血光难免。"镰刀煞为现代城市高架桥所生之凶煞。'
    },
    {
      name: '梁压煞',
      icon: '📉',
      severity: '凶',
      identify: '横梁正压床位、沙发、办公桌、灶台上方。人在梁下活动，受气场压迫。',
      harm: '主头痛、精神不振、事业受阻、夫妻不和。压床影响睡眠与健康，压桌影响事业运。',
      cure: [
        { item: '天花板/吊顶', material: '石膏板', color: '白色', placement: '做吊顶将梁包平，化解压迫感', count: '按面积' },
        { item: '葫芦', material: '天然葫芦或铜葫芦', color: '木色/金色', placement: '挂在梁下两端，各挂一个', count: '1对' },
        { item: '移动家具', material: '—', color: '—', placement: '将床/桌/沙发移离梁下', count: '—' }
      ],
      classic: '《阳宅三要》："梁压床头，睡不安宁。"梁压煞为室内最常见的煞气之一。'
    },
    {
      name: '门冲煞',
      icon: '🚪',
      severity: '凶',
      identify: '两门相对（自家大门对邻居家大门、卧室门对卫生间门、厨房门对卧室门等），形成气场对冲。',
      harm: '主口舌是非、家人不和、健康受损。厨房门对卧室门主火气冲身，卫生间门对卧室门主污秽冲健康。',
      cure: [
        { item: '门帘', material: '布帘或珠帘', color: '根据五行选色', placement: '在冲煞的门上挂长门帘（过门一半以上）', count: '1副' },
        { item: '五帝钱', material: '铜钱', color: '金色', placement: '挂在两门之间的门框上', count: '1串' },
        { item: '屏风', material: '木质', color: '木色', placement: '在两门之间设屏风隔断', count: '1个' }
      ],
      classic: '《阳宅大全》："两门相冲，必有一退。"门冲煞使气场互冲，弱者受损。'
    },
    {
      name: '壁刀煞',
      icon: '🧱',
      severity: '凶',
      identify: '邻接建筑的墙面（无窗的侧墙）如刀面般正切本宅，刀面越大、距离越近，煞气越重。',
      harm: '主意外伤害、血光之灾、家人健康下滑。',
      cure: [
        { item: '凸面八卦镜', material: '铜制', color: '金色', placement: '挂在被切窗框上方，凸面朝向壁刀', count: '1面' },
        { item: '植物', material: '活体植物', color: '绿色', placement: '在窗台放高大植物挡煞', count: '1-2盆' },
        { item: '窗帘', material: '厚布', color: '深色', placement: '拉上窗帘遮挡', count: '1副' }
      ],
      classic: '《沈氏玄空学》："壁刀如切，伤人于无形。"壁刀煞为城市密集建筑区常见。'
    },
    {
      name: '声煞',
      icon: '🔊',
      severity: '中凶',
      identify: '住宅临近高架桥、工地、工厂、闹市，长期受噪音干扰。也见于电梯井旁、水泵房旁的住宅。',
      harm: '主精神不宁、失眠焦虑、血压升高、家人易争吵。',
      cure: [
        { item: '隔音窗', material: '双层/三层中空玻璃', color: '透明', placement: '更换为隔音窗户', count: '按需' },
        { item: '绿色植物', material: '活体植物', color: '绿色', placement: '在噪音来源方向种高大树木或放盆栽', count: '多株' },
        { item: '水晶簇', material: '白水晶', color: '透明', placement: '在噪音方向的窗台放白水晶簇安定气场', count: '1块' }
      ],
      classic: '《阳宅三要》："声为煞气，扰人心神。"声煞虽无形，但对人的精神伤害甚大。'
    },
    {
      name: '光煞',
      icon: '💡',
      severity: '中凶',
      identify: '住宅对面有玻璃幕墙反射强光、霓虹灯闪烁、路灯直射入室，形成光污染。也见于室内镜面正对床位。',
      harm: '主精神不宁、失眠、视力受损、易招桃花劫。',
      cure: [
        { item: '遮光窗帘', material: '遮光布', color: '深色', placement: '安装遮光窗帘，夜间拉上', count: '1副' },
        { item: '磨砂贴膜', material: '磨砂膜', color: '半透明', placement: '在玻璃上贴磨砂膜减少反光', count: '按需' },
        { item: '植物', material: '活体植物', color: '绿色', placement: '在窗台放植物过滤光线', count: '1-2盆' }
      ],
      classic: '《风水化煞全书》："光煞乱神，夜不能寐。"光煞为现代城市特有的风水问题。'
    },
    {
      name: '孤阳煞',
      icon: '🏛️',
      severity: '凶',
      identify: '住宅周边有寺庙、教堂、警察局、政府大楼、电力设施等阳气过重的建筑，使本宅受"孤阳"之气冲射。',
      harm: '主家人性情暴躁、孤僻、不易聚财、不易嫁娶。',
      cure: [
        { item: '葫芦', material: '天然葫芦或铜葫芦', color: '木色/金色', placement: '在面向孤阳建筑的窗台挂葫芦', count: '1对' },
        { item: '八卦镜', material: '铜制', color: '金色', placement: '挂在窗框上方，镜面朝向孤阳建筑', count: '1面' },
        { item: '植物', material: '活体植物', color: '绿色', placement: '在窗台放高大绿色植物', count: '1-2盆' }
      ],
      classic: '《阳宅大全》："孤阳不生，独阴不长。"住宅宜阴阳平衡，过阳过阴皆为煞。'
    }
  ];

  var html = '';
  html += '<div class="fs-pro-result" style="animation:fadeUp .6s ease">';

  // 煞气图例
  html += '<div style="background:rgba(231,76,60,0.06);border:1px solid rgba(231,76,60,0.2);border-radius:10px;padding:16px;margin-bottom:20px;text-align:center">';
  html += '<p style="font-size:13px;opacity:.6;line-height:1.8">煞气共12种，以下按严重程度排列。<br>';
  html += '<span style="color:#dc3545">大凶</span>需立即化解 · <span style="color:#e74c3c">凶</span>建议化解 · <span style="color:#e67e22">中凶</span>酌情化解</p></div>';

  for (var i = 0; i < shaqiList.length; i++) {
    var s = shaqiList[i];
    var sevColor = s.severity === '大凶' ? '#dc3545' : s.severity === '凶' ? '#e74c3c' : '#e67e22';

    html += '<div style="background:rgba(255,255,255,0.02);border:1px solid rgba(201,168,76,0.1);border-radius:10px;padding:16px;margin-bottom:16px">';
    // 标题行
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">';
    html += '<span style="font-size:16px">' + s.icon + ' ' + (i + 1) + '. ' + s.name + '</span>';
    html += '<span style="font-size:11px;padding:2px 10px;border-radius:4px;background:' + sevColor + '20;color:' + sevColor + '">' + s.severity + '</span>';
    html += '</div>';

    // 识别方法
    html += '<div style="margin-bottom:10px">';
    html += '<div style="font-size:12px;color:var(--gold);margin-bottom:4px">🔍 识别方法</div>';
    html += '<p style="font-size:12px;opacity:.7;line-height:1.7">' + s.identify + '</p>';
    html += '</div>';

    // 危害
    html += '<div style="margin-bottom:10px">';
    html += '<div style="font-size:12px;color:#e74c3c;margin-bottom:4px">⚠️ 危害</div>';
    html += '<p style="font-size:12px;opacity:.7;line-height:1.7">' + s.harm + '</p>';
    html += '</div>';

    // 化解方案
    html += '<div style="margin-bottom:10px">';
    html += '<div style="font-size:12px;color:#2ecc71;margin-bottom:6px">✅ 化解方案</div>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:8px">';
    for (var j = 0; j < s.cure.length; j++) {
      var c = s.cure[j];
      html += '<div style="background:rgba(46,204,113,0.06);border:1px solid rgba(46,204,113,0.12);border-radius:8px;padding:10px;font-size:11px;line-height:1.6">';
      html += '<strong style="color:#2ecc71">' + c.item + '</strong><br>';
      html += '<span style="opacity:.6">材质：' + c.material + '</span><br>';
      html += '<span style="opacity:.6">颜色：' + c.color + '</span><br>';
      html += '<span style="opacity:.6">摆放：' + c.placement + '</span><br>';
      html += '<span style="opacity:.6">数量：' + c.count + '</span>';
      html += '</div>';
    }
    html += '</div></div>';

    // 经典出处
    html += '<div style="background:rgba(201,168,76,0.04);border-left:3px solid var(--gold);padding:8px 12px;border-radius:0 6px 6px 0;font-size:11px;opacity:.5;line-height:1.6">';
    html += '📜 ' + s.classic;
    html += '</div>';

    html += '</div>';
  }

  // 化煞物品购买指南
  html += '<div style="background:rgba(241,196,15,0.06);border:1px solid rgba(241,196,15,0.2);border-radius:10px;padding:16px;margin-top:12px">';
  html += '<h5 style="color:#f1c40f;font-size:13px;letter-spacing:3px;margin-bottom:10px">🛒 化煞物品购买指南</h5>';
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;font-size:11px;line-height:1.7">';
  html += '<div><strong>八卦镜</strong>：铜制为佳，凸面挡煞、凹面吸煞、平面反射。网购约30-80元。</div>';
  html += '<div><strong>五帝钱</strong>：顺治、康熙、雍正、乾隆、嘉庆五枚铜钱。真品约200-500元，仿品30-50元。</div>';
  html += '<div><strong>铜葫芦</strong>：纯铜铸造，开口或不开口均可。约50-150元。</div>';
  html += '<div><strong>泰山石</strong>：天然青石，刻"泰山石敢当"字样。约100-300元。</div>';
  html += '<div><strong>铜麒麟/铜马</strong>：纯铜铸造，一对。约200-600元。</div>';
  html += '<div><strong>天然葫芦</strong>：天然晾干葫芦，挂于窗边。约20-50元。</div>';
  html += '</div>';
  html += '<p style="font-size:11px;opacity:.4;margin-top:10px">⚠️ 化煞物品开光后效果更佳。摆放后不宜随意移动。八卦镜不宜正对他人门窗，以免转煞于人。</p>';
  html += '</div>';

  html += '</div>';
  return html;
}

// ============================================================
// 5. 流年飞星盘
// ============================================================

/**
 * 流年飞星盘可视化
 * 参考：《沈氏玄空学》《紫白诀》
 */
function renderAnnualFlyingStars() {
  var year = parseInt(document.getElementById('fs-pro-fx-year').value) || new Date().getFullYear();
  var centerStar = _fsProYearCenter(year);
  var starPos = _fsProFlyingStarGrid(centerStar);
  var currentMonth = new Date().getMonth() + 1;
  var monthCenter = _fsProMonthCenter(year, currentMonth);
  var monthStarPos = _fsProFlyingStarGrid(monthCenter);

  var html = '';
  html += '<div class="fs-pro-result" style="animation:fadeUp .6s ease">';

  // 年份选择
  html += '<div style="text-align:center;margin-bottom:20px">';
  html += '<div style="font-size:28px;color:var(--gold);font-family:Ma Shan Zheng,serif;letter-spacing:6px">' + year + '年流年飞星盘</div>';
  html += '<div style="font-size:12px;opacity:.5;margin-top:4px">' + centerStar + '入中宫 · ' + FS_PRO_STARS[centerStar].name + '当令</div>';
  html += '<div style="font-size:11px;opacity:.4;margin-top:2px">' + FS_PRO_STARS[centerStar].desc + '</div>';
  html += '</div>';

  // 九宫飞星盘（CSS Grid）
  html += '<div style="display:flex;justify-content:center;margin-bottom:24px">';
  html += '<div style="display:grid;grid-template-columns:repeat(3,120px);grid-template-rows:repeat(3,120px);gap:2px;background:rgba(201,168,76,0.1);padding:2px;border-radius:8px">';

  // 九宫格顺序：东南→南→西南→东→中→西→东北→北→西北
  // 对应视觉方位（上南下北，左东右西）
  var gridOrder = ['东南','南','西南','东','中','西','东北','北','西北'];
  for (var i = 0; i < gridOrder.length; i++) {
    var dir = gridOrder[i];
    var star = starPos[dir];
    var starInfo = FS_PRO_STARS[star];
    var color = _fsProStarColor(star);
    var bg = starInfo.auspicious ? 'rgba(46,204,113,0.08)' : (star === 5 || star === 2 ? 'rgba(231,76,60,0.08)' : 'rgba(231,76,60,0.04)');

    html += '<div style="background:' + bg + ';border-radius:4px;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative">';
    html += '<div style="position:absolute;top:4px;left:4px;font-size:9px;opacity:.4">' + dir + '</div>';
    html += '<div style="font-size:32px;color:' + color + ';font-family:Ma Shan Zheng,serif;line-height:1">' + star + '</div>';
    html += '<div style="font-size:9px;opacity:.5;margin-top:2px;text-align:center;padding:0 4px">' + starInfo.name.substring(2) + '</div>';
    html += '</div>';
  }
  html += '</div></div>';

  // 图例
  html += '<div style="display:flex;justify-content:center;gap:16px;margin-bottom:20px;flex-wrap:wrap">';
  html += '<span style="font-size:11px;color:#2ecc71">■ 吉星</span>';
  html += '<span style="font-size:11px;color:#e74c3c">■ 凶星</span>';
  html += '<span style="font-size:11px;opacity:.5">方位说明：上南下北，左东右西</span>';
  html += '</div>';

  // 大凶方位预警
  html += '<div style="background:rgba(231,76,60,0.06);border:1px solid rgba(231,76,60,0.2);border-radius:10px;padding:16px;margin-bottom:16px">';
  html += '<h5 style="color:#e74c3c;font-size:13px;letter-spacing:3px;margin-bottom:12px">⚠️ 大凶方位预警</h5>';
  for (var d in starPos) {
    var st = starPos[d];
    if (st === 5 || st === 2 || st === 3 || st === 7) {
      var si = FS_PRO_STARS[st];
      html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;font-size:12px">';
      html += '<span style="color:#e74c3c;font-weight:bold;width:60px">' + d + '方</span>';
      html += '<span style="color:' + _fsProStarColor(st) + '">' + st + '·' + si.name + '</span>';
      html += '<span style="opacity:.6">' + si.desc + '</span>';
      html += '</div>';
    }
  }
  html += '<div style="margin-top:10px;font-size:11px;opacity:.5;line-height:1.7">';
  html += '化解：五黄位放六字真言铜葫芦+金属风铃（金泄土），忌动土。<br>';
  html += '二黑位放铜葫芦+金属风铃，忌红色黄色。<br>';
  html += '三碧位放红色装饰（火泄木），忌绿色黑色。<br>';
  html += '七赤位放蓝色装饰或水族箱（水泄金），忌红色。';
  html += '</div></div>';

  // 大吉方位催旺
  html += '<div style="background:rgba(46,204,113,0.06);border:1px solid rgba(46,204,113,0.2);border-radius:10px;padding:16px;margin-bottom:16px">';
  html += '<h5 style="color:#2ecc71;font-size:13px;letter-spacing:3px;margin-bottom:12px">🌟 大吉方位催旺</h5>';
  for (var dg in starPos) {
    var sg = starPos[dg];
    if (sg === 8 || sg === 9 || sg === 1 || sg === 4 || sg === 6) {
      var sgi = FS_PRO_STARS[sg];
      html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;font-size:12px">';
      html += '<span style="color:#2ecc71;font-weight:bold;width:60px">' + dg + '方</span>';
      html += '<span style="color:' + _fsProStarColor(sg) + '">' + sg + '·' + sgi.name + '</span>';
      html += '<span style="opacity:.6">' + sgi.desc + '</span>';
      html += '</div>';
    }
  }
  html += '<div style="margin-top:10px;font-size:11px;opacity:.5;line-height:1.7">';
  html += '催旺：八白位放黄水晶球+聚宝盆+红色装饰（火生土）。<br>';
  html += '九紫位放红色装饰+紫色水晶+九枝玫瑰。<br>';
  html += '一白位放水培植物+蓝色装饰。<br>';
  html += '四绿位放文昌塔+四枝毛笔+绿色植物。<br>';
  html += '六白位放金属摆件+铜马+黄水晶。';
  html += '</div></div>';

  // 当月飞星变化
  html += '<div style="background:rgba(93,173,226,0.06);border:1px solid rgba(93,173,226,0.2);border-radius:10px;padding:16px">';
  html += '<h5 style="color:#5dade2;font-size:13px;letter-spacing:3px;margin-bottom:10px">📅 当月（' + currentMonth + '月）飞星变化</h5>';
  html += '<div style="font-size:12px;opacity:.6;margin-bottom:10px">' + monthCenter + '入中宫</div>';
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;font-size:11px">';
  for (var md in monthStarPos) {
    var ms = monthStarPos[ms];
    var mInfo = FS_PRO_STARS[monthStarPos[md]];
    html += '<div style="background:rgba(255,255,255,0.03);border-radius:6px;padding:8px;text-align:center">';
    html += '<div style="opacity:.5">' + md + '</div>';
    html += '<div style="color:' + _fsProStarColor(monthStarPos[md]) + ';font-size:16px;font-weight:bold">' + monthStarPos[md] + '</div>';
    html += '<div style="font-size:9px;opacity:.5">' + mInfo.name.substring(2) + '</div>';
    html += '</div>';
  }
  html += '</div></div>';

  html += '</div>';
  return html;
}

// ============================================================
// 6. 家庭年度化解方案
// ============================================================

/**
 * 家庭年度化解方案
 * 输入家庭成员出生信息，结合流年飞星，生成个性化化解方案
 * 参考：《沈氏玄空学》《紫白诀》《八宅明镜》
 */
function generateFamilyAnnualCure() {
  var year = new Date().getFullYear();
  var centerStar = _fsProYearCenter(year);
  var starPos = _fsProFlyingStarGrid(centerStar);

  // 获取成员列表
  var members = [];
  var memberRows = document.querySelectorAll('.fs-pro-family-member-row');
  for (var i = 0; i < memberRows.length; i++) {
    var row = memberRows[i];
    var name = row.querySelector('.fm-name').value.trim();
    var birthYear = parseInt(row.querySelector('.fm-year').value);
    var sex = row.querySelector('.fm-sex').value;
    if (name && birthYear) {
      var mingGua = _fsProMingGua(birthYear, sex);
      members.push({ name: name, birthYear: birthYear, sex: sex, mingGua: mingGua });
    }
  }

  if (members.length === 0) {
    _fsProToast('请至少添加一位家庭成员');
    return '<div style="text-align:center;padding:40px;color:#e74c3c">请添加家庭成员信息</div>';
  }

  // 化解方案数据
  var cureItems = {
    5: { name: '五黄大灾', items: ['六字真言铜葫芦（金属材质，金色，挂于五黄方位，1对）', '金属风铃（铜制，金色，挂于五黄方位，1串）', '铜制六帝钱（金色，挂于门框，1串）'], avoid: '忌动土、忌红色、忌黄色、忌久坐此方' },
    2: { name: '二黑病符', items: ['铜葫芦（纯铜，金色，放于病符方位，1对）', '金属风铃（铜制，金色，挂于此方，1串）', '天医符（纸质，黄色，贴于此方墙上，1张）'], avoid: '忌红色、忌黄色、忌久卧此方' },
    3: { name: '三碧是非', items: ['红色地毯（布质，红色，铺于此方地面，1块）', '紫水晶簇（天然紫水晶，紫色，放于此方桌面，1块）', '红色中国结（丝绳，红色，挂于此方，1个）'], avoid: '忌绿色、忌黑色、忌在此方争吵' },
    7: { name: '七赤破财', items: ['蓝色装饰画（布面，蓝色，挂于此方墙上，1幅）', '小型水族箱（玻璃，蓝色，放于此方，1个，养6条黑色金鱼）', '黑曜石球（天然黑曜石，黑色，放于此方，1个）'], avoid: '忌红色、忌金属摆件' }
  };

  var auspiciousCures = {
    8: { name: '八白正财', items: ['黄水晶球（天然黄水晶，黄色，放于财位，1个）', '聚宝盆（陶瓷，金色内衬，放于财位，1个，内放88枚硬币）', '红色地毯（布质，红色，铺于此方，1块）'], tip: '宜在此方办公、谈生意、放保险箱' },
    9: { name: '九紫喜庆', items: ['紫色水晶簇（天然紫水晶，紫色，放于此方，1块）', '九枝红玫瑰（鲜花，红色，放于此方花瓶，1束）', '红色装饰灯（LED，暖红色，放于此方，1盏）'], tip: '宜在此方相亲、婚房、庆祝' },
    1: { name: '一白桃花', items: ['水培富贵竹（活体植物，绿色，放于此方，1瓶，水养4枝）', '蓝色装饰（玻璃/布面，蓝色，放于此方，适量）'], tip: '宜在此方社交、交友、谈心' },
    4: { name: '四绿文昌', items: ['文昌塔（铜制或水晶，金色/透明，放于此方书桌，1座，7层或9层）', '四枝毛笔（竹杆狼毫，棕色，放于此方笔筒，4支）', '绿色植物（活体，绿色，放于此方，1盆）'], tip: '宜在此方学习、考试、写作' },
    6: { name: '六白武曲', items: ['铜马（纯铜，金色，放于此方，1对，马头朝外）', '金属印章（铜制，金色，放于此方桌面，1枚）'], tip: '宜在此方办公、求职、见贵人' }
  };

  var html = '';
  html += '<div class="fs-pro-result" style="animation:fadeUp .6s ease">';

  // 年度概况
  html += '<div style="text-align:center;margin-bottom:24px;padding:16px;background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.2);border-radius:10px">';
  html += '<div style="font-size:24px;color:var(--gold);font-family:Ma Shan Zheng,serif;letter-spacing:6px">' + year + '年家庭化解方案</div>';
  html += '<div style="font-size:12px;opacity:.5;margin-top:4px">' + centerStar + '入中宫 · ' + FS_PRO_STARS[centerStar].name + '当令 · ' + FS_PRO_STARS[centerStar].desc + '</div>';
  html += '</div>';

  // 为每位成员生成方案
  for (var mi = 0; mi < members.length; mi++) {
    var m = members[mi];
    // 东四命吉方：北、南、东、东南
    // 西四命吉方：西、西南、西北、东北
    var goodDirs = m.mingGua.isDong ? ['北','南','东','东南'] : ['西','西南','西北','东北'];
    var badDirs = m.mingGua.isDong ? ['西','西南','西北','东北'] : ['北','南','东','东南'];

    html += '<div style="background:rgba(255,255,255,0.02);border:1px solid rgba(201,168,76,0.15);border-radius:12px;padding:20px;margin-bottom:16px">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">';
    html += '<span style="font-size:16px;color:var(--gold)">' + m.name + '</span>';
    html += '<span style="font-size:11px;padding:2px 10px;border-radius:4px;background:rgba(201,168,76,0.1)">' + m.mingGua.guaName + '卦 · ' + m.mingGua.type + ' · ' + (m.sex === 'male' ? '男' : '女') + '</span>';
    html += '</div>';

    // 流年凶方需化解
    html += '<div style="margin-bottom:12px">';
    html += '<div style="font-size:12px;color:#e74c3c;margin-bottom:6px">⚠️ 需化解的凶方</div>';
    for (var d in starPos) {
      var st = starPos[d];
      if (cureItems[st]) {
        var ci = cureItems[st];
        var affectsMe = badDirs.includes(d);
        html += '<div style="background:rgba(231,76,60,0.04);border-radius:6px;padding:10px;margin-bottom:6px">';
        html += '<div style="font-size:12px;color:#e74c3c;font-weight:bold">' + d + '方 — ' + ci.name + (affectsMe ? '（⚠️ 此方为你的凶方，重点化解）' : '') + '</div>';
        html += '<div style="font-size:11px;opacity:.6;margin-top:4px">化解物品：</div>';
        for (var ii = 0; ii < ci.items.length; ii++) {
          html += '<div style="font-size:11px;opacity:.7;padding-left:12px">• ' + ci.items[ii] + '</div>';
        }
        html += '<div style="font-size:11px;color:#e67e22;margin-top:4px">禁忌：' + ci.avoid + '</div>';
        html += '</div>';
      }
    }
    html += '</div>';

    // 吉方催旺
    html += '<div style="margin-bottom:12px">';
    html += '<div style="font-size:12px;color:#2ecc71;margin-bottom:6px">🌟 宜催旺的吉方</div>';
    for (var gd in starPos) {
      var gs = starPos[gd];
      if (auspiciousCures[gs]) {
        var ac = auspiciousCures[gs];
        var goodForMe = goodDirs.includes(gd);
        html += '<div style="background:rgba(46,204,113,0.04);border-radius:6px;padding:10px;margin-bottom:6px">';
        html += '<div style="font-size:12px;color:#2ecc71;font-weight:bold">' + gd + '方 — ' + ac.name + (goodForMe ? '（✅ 此方为你的吉方，加倍催旺）' : '') + '</div>';
        html += '<div style="font-size:11px;opacity:.6;margin-top:4px">催旺物品：</div>';
        for (var ai = 0; ai < ac.items.length; ai++) {
          html += '<div style="font-size:11px;opacity:.7;padding-left:12px">• ' + ac.items[ai] + '</div>';
        }
        html += '<div style="font-size:11px;color:#27ae60;margin-top:4px">提示：' + ac.tip + '</div>';
        html += '</div>';
      }
    }
    html += '</div>';

    // 个人方位建议
    html += '<div style="background:rgba(201,168,76,0.04);border-radius:6px;padding:10px;font-size:11px;opacity:.7;line-height:1.7">';
    html += '🛏️ <strong>最佳卧室方位：</strong>' + goodDirs[0] + '方或' + goodDirs[1] + '方<br>';
    html += '🧭 <strong>最佳办公朝向：</strong>面朝' + goodDirs[0] + '方<br>';
    html += '🚪 <strong>不宜方位：</strong>' + badDirs.join('、') + '方';
    html += '</div>';

    html += '</div>';
  }

  // 分季度执行计划
  html += '<div style="background:rgba(155,89,182,0.06);border:1px solid rgba(155,89,182,0.2);border-radius:10px;padding:20px;margin-top:16px">';
  html += '<h5 style="color:#9b59b6;font-size:14px;letter-spacing:3px;margin-bottom:14px">📅 分季度执行计划</h5>';

  var quarters = [
    { name: '第一季度（1-3月）', focus: '春季木旺，重点化解三碧是非星方位', tasks: ['春节前完成五黄、二黑方位物品布置', '三碧方放红色装饰', '开春检查所有化煞物品是否完好'] },
    { name: '第二季度（4-6月）', focus: '夏季火旺，催旺九紫喜庆星方位', tasks: ['九紫方放红色装饰催喜庆', '四绿方放文昌塔催学业（中高考在即）', '检查五黄方是否有动土，及时补救'] },
    { name: '第三季度（7-9月）', focus: '秋季金旺，化解七赤破财星方位', tasks: ['七赤方放蓝色装饰或水族箱', '八白财位放黄水晶球催财', '中秋前后检查流月飞星变化'] },
    { name: '第四季度（10-12月）', focus: '冬季水旺，总结年度风水效果', tasks: ['年终盘点化解效果，调整不灵验的物品', '提前准备来年飞星盘分析', '冬至前后为关键转折点，注意五黄方位'] }
  ];

  for (var qi = 0; qi < quarters.length; qi++) {
    var q = quarters[qi];
    html += '<div style="margin-bottom:12px">';
    html += '<div style="font-size:13px;color:#9b59b6;font-weight:bold;margin-bottom:4px">' + q.name + '</div>';
    html += '<div style="font-size:11px;opacity:.5;margin-bottom:4px">' + q.focus + '</div>';
    html += '<ul style="font-size:11px;opacity:.7;padding-left:20px;line-height:1.8">';
    for (var ti = 0; ti < q.tasks.length; ti++) {
      html += '<li>' + q.tasks[ti] + '</li>';
    }
    html += '</ul></div>';
  }
  html += '</div>';

  // 采购清单
  html += '<div style="background:rgba(241,196,15,0.06);border:1px solid rgba(241,196,15,0.2);border-radius:10px;padding:20px;margin-top:16px">';
  html += '<h5 style="color:#f1c40f;font-size:14px;letter-spacing:3px;margin-bottom:14px">🛒 化解物品采购清单</h5>';
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px;font-size:12px">';
  html += '<div>✅ 铜葫芦 × ' + (members.length * 2) + '（每成员2个，挂于五黄/二黑方）</div>';
  html += '<div>✅ 金属风铃 × ' + (members.length * 2) + '（每成员2串）</div>';
  html += '<div>✅ 五帝钱 × ' + members.length + '串</div>';
  html += '<div>✅ 黄水晶球 × ' + members.length + '个</div>';
  html += '<div>✅ 聚宝盆 × 1个（放客厅财位）</div>';
  html += '<div>✅ 红色装饰/地毯 × 2套</div>';
  html += '<div>✅ 紫色水晶 × ' + members.length + '块</div>';
  html += '<div>✅ 文昌塔 × 1座（放书房或学生书桌）</div>';
  html += '<div>✅ 蓝色装饰/水族箱 × 1套</div>';
  html += '<div>✅ 黑曜石球 × ' + members.length + '个</div>';
  html += '</div>';
  html += '<p style="font-size:11px;opacity:.4;margin-top:12px">预估总费用：800-3000元（视物品品质而定）。建议在农历腊月（12月）备齐，立春前布置完成。</p>';
  html += '</div>';

  html += '</div>';
  return html;
}

/** 添加家庭成员行 */
function addFamilyMemberRow() {
  var container = document.getElementById('fs-pro-family-members');
  if (!container) return;
  var row = document.createElement('div');
  row.className = 'fs-pro-family-member-row';
  row.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px';
  row.innerHTML =
    '<input class="input-field fm-name" type="text" placeholder="姓名" style="min-width:80px;flex:1">' +
    '<input class="input-field fm-year" type="number" placeholder="出生年" min="1930" max="2025" style="min-width:90px;flex:1">' +
    '<select class="input-field fm-sex" style="min-width:70px;flex:1">' +
    '<option value="male">男</option><option value="female">女</option></select>' +
    '<button onclick="this.parentElement.remove()" style="background:rgba(231,76,60,0.1);border:1px solid rgba(231,76,60,0.3);color:#e74c3c;padding:8px 12px;border-radius:6px;cursor:pointer;font-size:12px">删除</button>';
  container.appendChild(row);
}

// ============================================================
// 7. 风水择日
// ============================================================

/**
 * 风水择日
 * 搬家入宅、动土装修、开业、结婚、安葬择日
 * 参考：《钦定协纪辨方书》《玉匣记》《象吉通书》
 */
function fengshuiZeRi() {
  var eventType = document.getElementById('fs-pro-zeri-type').value;
  var startDate = document.getElementById('fs-pro-zeri-start').value;
  var endDate = document.getElementById('fs-pro-zeri-end').value;

  if (!startDate || !endDate) {
    _fsProToast('请选择查询日期范围');
    return '<div style="text-align:center;padding:40px;color:#e74c3c">请选择日期范围</div>';
  }

  var start = new Date(startDate);
  var end = new Date(endDate);
  if (start > end) {
    _fsProToast('开始日期不能晚于结束日期');
    return '<div style="text-align:center;padding:40px;color:#e74c3c">日期范围无效</div>';
  }

  // 限制查询范围（最多90天）
  var maxEnd = new Date(start);
  maxEnd.setDate(maxEnd.getDate() + 90);
  if (end > maxEnd) end = maxEnd;

  // 黄道吉日（建除十二神+神煞推算）
  // 建除十二神：建、除、满、平、定、执、破、危、成、收、开、闭
  // 各事件宜忌：
  var eventConfig = {
    move: { name: '搬家入宅', yi: ['成','开','满'], ji: ['破','收','闭','建'], desc: '入宅择日宜选成日、开日、满日', special: '入宅宜选天赦日、天愿日、母仓日' },
    construction: { name: '动土装修', yi: ['成','定','开'], ji: ['破','收','闭','建','执'], desc: '动土宜选成日、定日、开日', special: '动土须避开太岁方、三煞方、五黄方' },
    business: { name: '开业', yi: ['成','满','开','定'], ji: ['破','收','闭'], desc: '开业宜选成日、满日、开日', special: '开业宜选天富日、天贵日、月财日' },
    wedding: { name: '结婚', yi: ['成','定','满','开'], ji: ['破','收','闭','执','建'], desc: '结婚宜选成日、定日、满日', special: '结婚宜选天德合、月德合、三合日' },
    burial: { name: '安葬', yi: ['定','成','收','闭'], ji: ['建','满','破','开'], desc: '安葬宜选定日、成日、收日', special: '安葬须避开重丧日、三丧日' }
  };

  var config = eventConfig[eventType] || eventConfig['move'];

  // 日建十二神计算：以节气定月建，再以日干支推建除
  var jianChu = ['建','除','满','平','定','执','破','危','成','收','开','闭'];

  // 月支依节气推算（非公历月）
  // 立春~惊蛰=寅月，惊蛰~清明=卯月，... 各节气近似日期
  var jieQiDates = [
    { jie: '立春', month: 2, day: 4, zhi: '寅' },
    { jie: '惊蛰', month: 3, day: 6, zhi: '卯' },
    { jie: '清明', month: 4, day: 5, zhi: '辰' },
    { jie: '立夏', month: 5, day: 6, zhi: '巳' },
    { jie: '芒种', month: 6, day: 6, zhi: '午' },
    { jie: '小暑', month: 7, day: 7, zhi: '未' },
    { jie: '立秋', month: 8, day: 8, zhi: '申' },
    { jie: '白露', month: 9, day: 8, zhi: '酉' },
    { jie: '寒露', month: 10, day: 8, zhi: '戌' },
    { jie: '立冬', month: 11, day: 7, zhi: '亥' },
    { jie: '大雪', month: 12, day: 7, zhi: '子' },
    { jie: '小寒', month: 1, day: 6, zhi: '丑' }
  ];
  // 依据节气确定月支
  function _getMonthZhiByJieQi(date) {
    var y = date.getFullYear();
    var m = date.getMonth() + 1;
    var d = date.getDate();
    var md = m * 100 + d;
    // 遍历节气，找到最后一个已过的节气
    var currentZhi = '丑'; // 默认丑月（小寒前）
    for (var i = 0; i < jieQiDates.length; i++) {
      var jq = jieQiDates[i];
      var jqMd = jq.month * 100 + jq.day;
      // 同年节气
      if (jq.month <= m && jqMd <= md) {
        currentZhi = jq.zhi;
      }
    }
    // 跨年处理：1月小寒前仍属上年子月
    if (m === 1 && d < 6) currentZhi = '子';
    return currentZhi;
  }

  var goodDays = [];
  var badDays = [];
  var current = new Date(start);

  while (current <= end) {
    var gz = _fsProDayGanZhi(current);
    var monthZhi = _getMonthZhiByJieQi(current);
    // 日建：月支为建，依次排列
    var zhiIndex = FS_PRO_ZHI.indexOf(gz.zhi);
    var monthZhiIndex = FS_PRO_ZHI.indexOf(monthZhi);
    var jianChuIndex = ((zhiIndex - monthZhiIndex) % 12 + 12) % 12;
    var dayJianChu = jianChu[jianChuIndex];

    // 吉凶判断：建除宜忌+神煞辅参
    var isGood = config.yi.includes(dayJianChu);
    var isBad = config.ji.includes(dayJianChu);

    // 天赦日（古制：春季戊寅日、夏季甲午日、秋季戊申日、冬季甲子日）
    // 依《协纪辨方书》天赦日每季仅一干支，为百无禁忌之吉日
    var season = Math.floor((current.getMonth() + 1) / 3) % 4; // 0春1夏2秋3冬
    var tianshe = false;
    if (season === 0 && gz.gan === '戊' && gz.zhi === '寅') tianshe = true;
    if (season === 1 && gz.gan === '甲' && gz.zhi === '午') tianshe = true;
    if (season === 2 && gz.gan === '戊' && gz.zhi === '申') tianshe = true;
    if (season === 3 && gz.gan === '甲' && gz.zhi === '子') tianshe = true;

    var dayInfo = {
      date: new Date(current),
      ganzhi: gz.gan + gz.zhi,
      jianchu: dayJianChu,
      isGood: isGood,
      isBad: isBad,
      tianshe: tianshe,
      week: ['日','一','二','三','四','五','六'][current.getDay()]
    };

    if (isGood || tianshe) goodDays.push(dayInfo);
    else if (isBad) badDays.push(dayInfo);

    current.setDate(current.getDate() + 1);
  }

  var html = '';
  html += '<div class="fs-pro-result" style="animation:fadeUp .6s ease">';

  // 事件信息
  html += '<div style="text-align:center;margin-bottom:20px;padding:16px;background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.2);border-radius:10px">';
  html += '<div style="font-size:20px;color:var(--gold);font-family:Ma Shan Zheng,serif;letter-spacing:4px">📋 ' + config.name + '择日</div>';
  html += '<div style="font-size:12px;opacity:.5;margin-top:4px">' + startDate + ' 至 ' + endDate + '</div>';
  html += '<div style="font-size:11px;opacity:.4;margin-top:4px">' + config.desc + '</div>';
  html += '<div style="font-size:11px;opacity:.4">' + config.special + '</div>';
  html += '</div>';

  // 宜忌说明
  html += '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(201,168,76,0.1);border-radius:10px;padding:14px;margin-bottom:16px">';
  html += '<div style="display:flex;gap:20px;flex-wrap:wrap;font-size:12px">';
  html += '<span style="color:#2ecc71">✅ 宜：' + config.yi.join('日、') + '日</span>';
  html += '<span style="color:#e74c3c">❌ 忌：' + config.ji.join('日、') + '日</span>';
  html += '</div></div>';

  // 吉日列表
  if (goodDays.length > 0) {
    html += '<div style="background:rgba(46,204,113,0.06);border:1px solid rgba(46,204,113,0.2);border-radius:10px;padding:16px;margin-bottom:16px">';
    html += '<h5 style="color:#2ecc71;font-size:14px;letter-spacing:3px;margin-bottom:12px">✅ 宜选吉日（共' + goodDays.length + '天）</h5>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px">';
    for (var gi = 0; gi < goodDays.length; gi++) {
      var gd = goodDays[gi];
      var dStr = gd.date.getFullYear() + '-' + (gd.date.getMonth() + 1).toString().padStart(2, '0') + '-' + gd.date.getDate().toString().padStart(2, '0');
      html += '<div style="background:rgba(46,204,113,0.08);border:1px solid rgba(46,204,113,0.15);border-radius:8px;padding:10px;text-align:center">';
      html += '<div style="font-size:13px;color:#2ecc71;font-weight:bold">' + dStr + '</div>';
      html += '<div style="font-size:11px;opacity:.6;margin-top:2px">' + gd.ganzhi + '日 · 星期' + gd.week + '</div>';
      html += '<div style="font-size:11px;color:#2ecc71;margin-top:2px">' + gd.jianchu + '日</div>';
      if (gd.tianshe) html += '<div style="font-size:10px;color:#f1c40f;margin-top:2px">⭐ 天赦日（大吉）</div>';
      html += '</div>';
    }
    html += '</div></div>';
  } else {
    html += '<div style="background:rgba(231,76,60,0.06);border:1px solid rgba(231,76,60,0.2);border-radius:10px;padding:16px;margin-bottom:16px;text-align:center">';
    html += '<p style="color:#e67e22;font-size:13px">所选日期范围内暂无理想吉日，建议扩大查询范围。</p></div>';
  }

  // 忌日列表
  if (badDays.length > 0) {
    html += '<div style="background:rgba(231,76,60,0.04);border:1px solid rgba(231,76,60,0.1);border-radius:10px;padding:16px">';
    html += '<h5 style="color:#e74c3c;font-size:13px;letter-spacing:3px;margin-bottom:10px">❌ 应避开的日子（共' + badDays.length + '天）</h5>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px;font-size:11px">';
    for (var bi = 0; bi < Math.min(badDays.length, 20); bi++) {
      var bd = badDays[bi];
      var bdStr = bd.date.getFullYear() + '-' + (bd.date.getMonth() + 1).toString().padStart(2, '0') + '-' + bd.date.getDate().toString().padStart(2, '0');
      html += '<div style="background:rgba(231,76,60,0.06);border-radius:6px;padding:8px;text-align:center">';
      html += '<div style="color:#e74c3c">' + bdStr + '</div>';
      html += '<div style="opacity:.5">' + bd.ganzhi + ' · ' + bd.jianchu + '日</div>';
      html += '</div>';
    }
    html += '</div></div>';
  }

  // 择日说明
  html += '<div style="background:rgba(201,168,76,0.04);border-left:3px solid var(--gold);padding:12px 16px;border-radius:0 8px 8px 0;margin-top:16px;font-size:12px;opacity:.6;line-height:1.8">';
  html += '📜 <strong>择日说明：</strong><br>';
  html += '· 建除十二神：建、除、满、平、定、执、破、危、成、收、开、闭<br>';
  html += '· 成日：万事成就，宜搬家、开业、结婚<br>';
  html += '· 开日：开通达路，宜开业、搬家<br>';
  html += '· 满日：圆满丰收，宜结婚、开业<br>';
  html += '· 定日：安定平稳，宜安葬、动土<br>';
  html += '· 天赦日：百无禁忌，全年最吉之日（每季仅1-2天）<br>';
  html += '· 《钦定协纪辨方书》为清代官方择日权威，本功能依据其建除法推算<br>';
  html += '· 精确择日还需结合个人八字命卦，建议咨询专业风水师';
  html += '</div>';

  html += '</div>';
  return html;
}

// ============================================================
// 8. 城门诀 (R3.4)
// ============================================================

/**
 * 玄空飞星·城门诀
 * 以向方两旁宫位的向星判断城门是否可用
 * 参考：《沈氏玄空学》城门篇
 * 城门诀是玄空飞星的重要辅助法门，城门开则引入旺气，可补旺山旺向之不足
 */
function computeChengmenJue(xuankongData, chaoxiang) {
  try {
    // 八方位与两旁方位的映射
    var dirNumMap = {'北':1,'南':9,'东':3,'西':7,'东北':8,'西北':6,'东南':4,'西南':2};
    var numDirMap = {1:'北',2:'西南',3:'东',4:'东南',6:'西北',7:'西',8:'东北',9:'南'};
    // 每个向方两旁的宫位（顺时针和逆时针相邻方位）
    var adjacentMap = {
      '北':   ['西北','东北'],
      '南':   ['东南','西南'],
      '东':   ['东北','东南'],
      '西':   ['西南','西北'],
      '东北': ['北','东'],
      '西北': ['西','北'],
      '东南': ['东','南'],
      '西南': ['南','西']
    };

    // 当前元运旺星和生气星
    var period = xuankongData && xuankongData.period ? xuankongData.period : (Math.floor((new Date().getFullYear() - 1864) / 20) + 1);
    var wangStar = period;
    var shengStar = (period % 9) + 1; // 生气星（下一运旺星）

    // 九星信息
    var starNames = {1:'一白贪狼',2:'二黑巨门',3:'三碧禄存',4:'四绿文曲',5:'五黄廉贞',6:'六白武曲',7:'七赤破军',8:'八白左辅',9:'九紫右弼'};
    var starElements = {1:'水',2:'土',3:'木',4:'木',5:'土',6:'金',7:'金',8:'土',9:'火'};

    // 如果有完整的飞星盘数据，使用之；否则基于简略数据推算
    var xiangPan = xuankongData && xuankongData.xiangPan ? xuankongData.xiangPan : null;
    var yunPan = xuankongData && xuankongData.yunPan ? xuankongData.yunPan : null;

    var xiangDir = chaoxiang || '南';
    var adjDirs = adjacentMap[xiangDir] || ['东南','西南'];

    var results = [];
    var html = '';
    html += '<div style="margin-top:30px">';
    html += '<h5 style="font-size:14px;letter-spacing:4px;color:var(--gold);margin-bottom:6px">🚪 城门诀分析</h5>';
    html += '<p style="font-size:12px;opacity:.5;margin-bottom:16px">向方两旁宫位向星判断 · 《沈氏玄空学》城门篇</p>';

    html += '<div style="background:rgba(201,168,76,0.04);border:1px solid rgba(201,168,76,0.12);border-radius:10px;padding:16px;margin-bottom:16px">';
    html += '<div style="font-size:12px;opacity:.7;line-height:1.8;margin-bottom:8px">';
    html += '<strong>城门诀原理：</strong>城门者，向方两旁宫位也。若两旁宫位之向星为当旺之星或生气之星，则城门可用，开门开窗可引入旺气。<br>';
    html += '<strong>城门与旺山旺向：</strong>若本宅已得旺山旺向，城门为锦上添花；若非旺山旺向，城门可补救宅运，以城门之力补向方之不足。<br>';
    html += '<strong>城门开与不开：</strong>城门可用之方宜开门开窗、设通道，引旺气入宅；城门不可用之方忌开门窗，否则引凶气入宅。';
    html += '</div></div>';

    for (var i = 0; i < adjDirs.length; i++) {
      var adjDir = adjDirs[i];
      var adjNum = dirNumMap[adjDir] || 1;
      
      // 获取该宫位的向星
      var xiangStar = null;
      if (xiangPan && xiangPan[adjNum]) {
        xiangStar = xiangPan[adjNum];
      } else {
        // 简略推算：基于运盘推算向星
        xiangStar = ((period - 1 + adjNum) % 9) + 1;
      }
      
      var starName = starNames[xiangStar] || '未知';
      var starEle = starElements[xiangStar] || '土';
      var isWang = (xiangStar === wangStar);
      var isSheng = (xiangStar === shengStar);
      var usable = isWang || isSheng;
      
      var statusText = '';
      var statusColor = '';
      var effectText = '';
      var cureText = '';
      
      if (isWang) {
        statusText = '城门可用（旺星到城门）';
        statusColor = '#2ecc71';
        effectText = '当旺之星' + starName + '到' + adjDir + '方城门位，开门开窗可引入当旺之气，大吉。主速发财运，事业兴旺。';
        cureText = '宜在此方开门、开窗、设通道。若为墙壁，可常开窗通风。可放金属风铃或铜葫芦催旺。';
      } else if (isSheng) {
        statusText = '城门可用（生气星到城门）';
        statusColor = '#2ecc71';
        effectText = '生气之星' + starName + '到' + adjDir + '方城门位，开门开窗可引入生气，吉。主渐进式发展，未来运势看涨。';
        cureText = '宜在此方开门、开窗。可放水培植物或蓝色装饰品催旺生气。';
      } else if (xiangStar === 5) {
        statusText = '城门不可用（五黄到城门）';
        statusColor = '#e74c3c';
        effectText = '五黄大凶之星到' + adjDir + '方城门位，开门开窗引入凶气，主灾祸、疾病、破财。';
        cureText = '忌在此方开门开窗。若已有门窗，宜常闭，挂六字真言铜葫芦+金属风铃化解。';
      } else if (xiangStar === 2) {
        statusText = '城门不可用（二黑到城门）';
        statusColor = '#e74c3c';
        effectText = '二黑病符星到' + adjDir + '方城门位，开门开窗引入病气，主家人健康受损、脾胃疾病。';
        cureText = '忌在此方开门开窗。若已有门窗，宜常闭，放铜葫芦+金属风铃化解。';
      } else if (xiangStar === 3) {
        statusText = '城门不宜用（三碧到城门）';
        statusColor = '#e67e22';
        effectText = '三碧是非星到' + adjDir + '方城门位，开门开窗易引口舌是非、官非争斗。';
        cureText = '不宜在此方开门开窗。若已有门窗，宜放红色装饰品（火泄木）化解。';
      } else if (xiangStar === 7) {
        statusText = '城门不宜用（七赤到城门）';
        statusColor = '#e67e22';
        effectText = '七赤破军星到' + adjDir + '方城门位，开门开窗易引破财、争斗、口舌。';
        cureText = '不宜在此方开门开窗。若已有门窗，宜放蓝色装饰品或水族箱（水泄金）化解。';
      } else {
        statusText = '城门平淡（退气之星）';
        statusColor = '#c9a84c';
        effectText = starName + '到' + adjDir + '方城门位，非旺非生，城门开与不开影响不大，平平淡淡。';
        cureText = '可开门窗但非必要。无需特别催旺或化解。';
      }
      
      results.push({
        direction: adjDir,
        xiangStar: xiangStar,
        starName: starName,
        usable: usable,
        status: statusText,
        effect: effectText,
        cure: cureText
      });
      
      html += '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(201,168,76,0.15);border-radius:10px;padding:16px;margin-bottom:12px;border-left:3px solid ' + statusColor + '">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">';
      html += '<span style="font-size:15px;color:var(--gold);font-weight:bold">' + adjDir + '方城门</span>';
      html += '<span style="font-size:11px;padding:2px 8px;border-radius:4px;background:' + statusColor + '20;color:' + statusColor + '">' + statusText + '</span>';
      html += '</div>';
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px;font-size:12px;margin-bottom:10px">';
      html += '<div><span style="opacity:.5">向星：</span><span style="color:' + statusColor + '">' + starName + '(' + starEle + ')</span></div>';
      html += '<div><span style="opacity:.5">当旺星：</span>' + starNames[wangStar] + '</div>';
      html += '<div><span style="opacity:.5">生气星：</span>' + starNames[shengStar] + '</div>';
      html += '</div>';
      html += '<div style="font-size:12px;opacity:.7;line-height:1.7;margin-bottom:6px">📌 <strong>影响：</strong>' + effectText + '</div>';
      html += '<div style="font-size:12px;color:#2ecc71;line-height:1.7">🛡️ <strong>建议：</strong>' + cureText + '</div>';
      html += '</div>';
    }

    // 城门诀总结
    var anyUsable = results.some(function(r) { return r.usable; });
    html += '<div style="background:rgba(46,204,113,0.06);border:1px solid rgba(46,204,113,0.15);border-radius:10px;padding:14px;margin-top:8px">';
    if (anyUsable) {
      var usableDirs = results.filter(function(r){return r.usable;}).map(function(r){return r.direction;}).join('、');
      html += '<div style="font-size:13px;color:#2ecc71;line-height:1.8">✅ <strong>城门诀总结：</strong>本宅' + usableDirs + '方城门可用，宜开门开窗引入旺气。';
      html += '若本宅已得旺山旺向，城门为锦上添花，令宅运更旺；若非旺山旺向，城门可补救，以城门之力补向方之不足，化凶为吉。</div>';
    } else {
      var allBad = results.every(function(r) { return r.xiangStar === 5 || r.xiangStar === 2; });
      if (allBad) {
        html += '<div style="font-size:13px;color:#e74c3c;line-height:1.8">⚠️ <strong>城门诀总结：</strong>本宅两旁城门均不可用，向方两旁均为凶星。宜封堵两旁门窗，专以向方纳气。若无旺山旺向，需以布局化煞为主，放铜葫芦、五帝钱等化解凶气。</div>';
      } else {
        html += '<div style="font-size:13px;color:#c9a84c;line-height:1.8">⚪ <strong>城门诀总结：</strong>本宅两旁城门均非旺星，城门之力有限。宅运主要依靠向方及山向格局。宜以八宅布局和流年飞星化解为主，不必刻意开城门。</div>';
      }
    }
    html += '</div>';

    // 经典引用
    html += '<div style="background:rgba(201,168,76,0.04);border-left:3px solid var(--gold);padding:8px 12px;border-radius:0 6px 6px 0;font-size:11px;opacity:.5;line-height:1.6;margin-top:12px">';
    html += '📜 《沈氏玄空学》：「城门者，向方两旁宫位也。两旁向星若为当旺或生气，则城门可用，开门引气，可补宅运之不足。」';
    html += '</div>';

    html += '</div>';
    return html;
  } catch(e) {
    console.error('[城门诀分析错误]', e.message);
    return '<div style="padding:16px;color:#e74c3c;font-size:12px">城门诀分析出错: ' + e.message + '</div>';
  }
}

// ============================================================
// 9. 飞星组合深化 (R3.5)
// ============================================================

/**
 * 经典飞星组合含义深化分析
 * 参考：《沈氏玄空学》《紫白诀》《飞星赋》
 * 每种组合含：组合名称、吉凶、影响方面、化解方法
 */
function computeFeixingCombos(xuankongData, chaoxiang) {
  try {
    // 经典飞星组合数据库（山星+向星组合）
    var comboDB = [
      {
        stars: [1, 4],
        name: '一四同宫',
        alias: '文昌会合',
        luck: '吉',
        aspects: '学业·考试·文采·官职',
        desc: '一白水生四绿木，水木相生，主文昌大发。利读书、考试、升学、文职工作。',
        detail: '一白为坎水，四绿为巽木，水生木而旺文昌。《紫白诀》云：「一四同宫，准发科名之显。」此组合最利学子书房、文职办公位。若流年一白或四绿飞临，更验。',
        cure: '宜在此方设书房、书桌。可放文昌塔（7层或9层）、四枝毛笔、绿色植物催旺。忌放金属物品（金克木破文昌）。',
        classic: '《紫白诀》：「一四同宫，准发科名之显。」《沈氏玄空学》：「一白水生四绿木，发文昌，主科甲功名。」'
      },
      {
        stars: [2, 7],
        name: '二七同道',
        alias: '先天火数',
        luck: '凶',
        aspects: '火灾·脾胃·炎症·口舌',
        desc: '二黑土与七赤金，先天河图二七为火，主火患。又土生金泄气，主脾胃疾病。',
        detail: '二黑坤土，七赤兑金，先天数二七为火。《飞星赋》云：「二七同道，惊伤脾胃。」又主火灾、炎症、消化系统疾病。若太岁叠临，防火灾。',
        cure: '宜放金属风铃或铜葫芦（金泄土生水制火）。忌红色、紫色装饰。厨房在此方尤需注意防火。可放黄色陶瓷器（土泄火气）化解。',
        classic: '《飞星赋》：「二七同道，惊伤脾胃。」《玄机赋》：「二七为火，防火灾。」'
      },
      {
        stars: [3, 7],
        name: '三七相克',
        alias: '穿心煞',
        luck: '凶',
        aspects: '口舌·是非·官非·争斗',
        desc: '三碧木被七赤金克，金木相战，主口舌是非、官非争斗、手足受伤。',
        detail: '三碧震木，七赤兑金，金克木。《飞星赋》云：「三七交加，贼盗官灾。」又主长男与少女不和，易生口角争斗。若动象叠临，主官非诉讼。',
        cure: '宜放水族箱或蓝色装饰品（水通关：金生水、水生木）化解。忌金属摆件。可放黑曜石球吸收争斗之气。',
        classic: '《飞星赋》：「三七交加，贼盗官灾。」《玄机赋》：「三碧七赤，金木相战，主口舌是非。」'
      },
      {
        stars: [2, 5],
        name: '二五交加',
        alias: '损主煞',
        luck: '大凶',
        aspects: '疾病·灾祸·损主妇·绝症',
        desc: '二黑土与五黄土，两凶土叠加，主大灾。尤损主妇（坤为母），主重病、绝症、意外。',
        detail: '二黑巨门土，五黄廉贞土，两土叠临为最凶组合。《飞星赋》云：「二五交加必损主。」二黑坤为母，五黄为大凶之星，两凶叠临，主损主妇、重病、绝症。此组合最忌动土，动则发凶。',
        cure: '宜放金属风铃、铜葫芦、六帝钱（金泄土气）化解。忌黄色、红色装饰，忌动土。保持此方安静，不宜久坐久卧。可放金属器具或金属时钟持续泄土气。',
        classic: '《飞星赋》：「二五交加必损主。」《沈氏玄空学》：「二黑五黄，两凶叠临，主损主妇，大凶之象。」'
      },
      {
        stars: [3, 8],
        name: '三八为朋',
        alias: '伤足煞',
        luck: '凶',
        aspects: '伤足·肝胆·手足·意外',
        desc: '三碧木克八白土，木土相克，主伤足、肝胆疾病、手足受伤。',
        detail: '三碧震木，八白艮土，木克土。《飞星赋》云：「三八为朋，伤足损胎。」震为足，艮为手，木克土主手足受伤。又主肝胆疾病、肠胃不和。但八白为吉星，若得令亦可为吉。',
        cure: '宜放红色装饰品或紫色水晶（火通关：木生火、火生土）化解。忌绿色植物过多。可放红地毯或红色中国结。',
        classic: '《飞星赋》：「三八为朋，伤足损胎。」《玄机赋》：「三碧八白，木克土，主伤足。」'
      },
      {
        stars: [4, 9],
        name: '四九为友',
        alias: '木火通明',
        luck: '吉',
        aspects: '聪明·文采·科名·姻缘',
        desc: '四绿木生九紫火，木火通明，主聪明文采、科甲功名、姻缘喜庆。',
        detail: '四绿巽木，九紫离火，木生火而通明。《玄机赋》云：「木火通明，聪明文采。」主发文昌、利考试升学。九紫又主喜庆姻缘，四九组合既利学业又利感情。',
        cure: '宜在此方设书桌或卧室。可放绿色植物+红色装饰（木火相生）催旺。忌黑色、蓝色装饰（水克火破局）。',
        classic: '《玄机赋》：「木火通明，聪明文采。」《紫白诀》：「四绿九紫，木火通明，主科名喜庆。」'
      },
      {
        stars: [1, 6],
        name: '一六共宗',
        alias: '官贵局',
        luck: '吉',
        aspects: '官贵·事业·武职·远行',
        desc: '一白水与六白金，金生水，主官贵、事业升迁、武职显达。',
        detail: '一白坎水，六白乾金，金生水。《玄机赋》云：「一六共宗，主官贵。」六白为武曲星，一白为官星，金水相生主事业顺利、升迁有望。利公务员、军人、警察等武职。',
        cure: '宜在此方设办公位或主卧。可放金属摆件（铜马、铜印）或黄水晶催旺。忌红色装饰（火克金破局）。',
        classic: '《玄机赋》：「一六共宗，主官贵。」《沈氏玄空学》：「金水相生，主官贵显达。」'
      },
      {
        stars: [2, 8],
        name: '二八合十',
        alias: '进财局',
        luck: '吉',
        aspects: '进财·置业·积蓄·田产',
        desc: '二黑与八白合十（2+8=10），主进财、置业、积蓄丰厚。',
        detail: '二黑坤土，八白艮土，二八合十。《沈氏玄空学》以合十为吉局，二八合十主田产进财、置业有利。八白为当旺财星尤吉，即使二黑退气，合十亦可减轻凶性。',
        cure: '宜在此方放保险箱、聚宝盆、黄水晶球催财。可放黄色或红色装饰品（火生土旺财）。忌金属风铃（金泄土气破财）。',
        classic: '《沈氏玄空学》：「二八合十，主进财。」合十之法，可化凶为吉，减轻凶星之害。'
      },
      {
        stars: [3, 9],
        name: '三九木火',
        alias: '木火通明',
        luck: '吉',
        aspects: '科名·文书·创意·才智',
        desc: '三碧木生九紫火，木火通明，主发科名、利文书、创意才智。',
        detail: '三碧震木，九紫离火，木生火。《玄机赋》云：「木火通明，主科名。」与四九组合类似，但三九更主创意和行动力，四九更主文采和感情。三九利设计、创作、军警、技术人员。',
        cure: '宜在此方工作学习。可放绿色植物+红色装饰催旺。放紫色水晶或红水晶增强火气。忌黑色蓝色装饰。',
        classic: '《玄机赋》：「三碧九紫，木火通明，主科名。」《飞星赋》：「三九木火通明，才华横溢。」'
      },
      {
        stars: [7, 1],
        name: '七一金水',
        alias: '口才局',
        luck: '吉',
        aspects: '口才·交际·桃花·远行',
        desc: '七赤金生一白水，金水相生，主口才出众、交际有利、桃花旺盛。',
        detail: '七赤兑金，一白坎水，金生水。《玄机赋》云：「七一相生，主口才。」兑为口、坎为水，金水相生主口才好、交际广泛。又主桃花，利感情。但若在衰败之宫，金水过旺主风流、酒色。',
        cure: '宜在此方设会客区或演讲台。可放金属摆件+水培植物催旺。若防桃花过旺，可放黄色陶瓷器（土克水）平衡。',
        classic: '《玄机赋》：「七一相生，主口才。」《飞星赋》：「七一金水相生，利口才交际。」'
      },
      {
        stars: [6, 8],
        name: '六八武辅',
        alias: '武贵财局',
        luck: '吉',
        aspects: '武贵·偏财·置业·功名',
        desc: '六白金与八白土，土生金，主武贵功名、偏财置业。',
        detail: '六白乾金，八白艮土，土生金。《玄机赋》云：「六八相生，主武贵。」六白武曲星逢八白左辅土生之，主武职升迁、偏财运佳。利军警、体育、工程等行业。又主置业有利。',
        cure: '宜在此方设办公位或放保险箱。可放黄水晶球+铜马催旺。忌红色装饰（火克金）。',
        classic: '《玄机赋》：「六八相生，主武贵。」《沈氏玄空学》：「六白八白，土金相生，主功名置业。」'
      },
      {
        stars: [9, 5],
        name: '九五紫黄',
        alias: '紫黄毒药',
        luck: '大凶',
        aspects: '毒药·绝症·火灾·血光',
        desc: '九紫火生五黄土，火炎土燥，主毒药、绝症、火灾、血光之灾。',
        detail: '九紫离火，五黄廉贞土，火生土而五黄更凶。《飞星赋》云：「紫黄毒药，入口封喉。」九紫本吉，但生五黄凶土则化为大凶。主服毒、绝症、火灾、血光。若太岁叠临，其凶更甚。',
        cure: '宜放金属器具、铜葫芦、金属风铃（金泄土）化解。忌红色、紫色、黄色装饰。忌在此方烹饪（火生土）。保持安静，忌动土。',
        classic: '《飞星赋》：「紫黄毒药，入口封喉。」《沈氏玄空学》：「九紫生五黄，火炎土燥，大凶之象。」'
      },
      {
        stars: [1, 5],
        name: '一五水土',
        alias: '水泛克土',
        luck: '凶',
        aspects: '肾病·泌尿·流产·酒色',
        desc: '一白水克五黄土，水泛克土，主肾病、泌尿系统疾病、流产、酒色之灾。',
        detail: '一白坎水，五黄廉贞土，本为土克水，但五黄为凶星，反主水泛。《飞星赋》云：「一五同宫，主肾病酒色。」主肾脏、泌尿、生殖系统疾病，又主酒色破财。',
        cure: '宜放金属器具（金通关：土生金、金生水）化解。忌黑色蓝色装饰（水更旺）。可放铜葫芦或金属风铃。',
        classic: '《飞星赋》：「一五同宫，主肾病酒色。」五黄克一白，水受克则病。'
      },
      {
        stars: [3, 5],
        name: '三五土木',
        alias: '刑伤煞',
        luck: '凶',
        aspects: '刑伤·官非·手足·肝胆',
        desc: '三碧木克五黄土，木土相克，主刑伤、官非、手足肝胆疾病。',
        detail: '三碧震木，五黄廉贞土，木克土。《飞星赋》云：「三五刑伤。」三碧为是非星，五黄为灾祸星，两凶叠临主刑伤官非。震为足，又主手足受伤、肝胆疾病。',
        cure: '宜放红色装饰品（火通关：木生火、火生土）化解。忌绿色植物。可放红地毯或紫水晶。',
        classic: '《飞星赋》：「三五刑伤，主官非刑伤。」《玄机赋》：「三碧五黄，木克土，主刑伤。」'
      },
      {
        stars: [7, 5],
        name: '七五金土',
        alias: '交剑煞',
        luck: '凶',
        aspects: '争斗·破财·刀伤·肺病',
        desc: '七赤金泄五黄土，土金相生但五黄凶性不减，主争斗、破财、刀伤、肺病。',
        detail: '七赤兑金，五黄廉贞土，土生金而泄气。《飞星赋》云：「七五交剑，主争斗破财。」七赤为破军星主争斗，五黄为大凶星，组合主刀伤、肺病、争斗破财。',
        cure: '宜放水族箱或蓝色装饰品（水泄金气）化解。忌金属摆件。可放黑曜石球或蓝色地毯。',
        classic: '《飞星赋》：「七五交剑，主争斗破财。」《玄机赋》：「七赤五黄，金泄土气，主争斗。」'
      }
    ];

    // 获取飞星盘数据
    var shanPan = xuankongData && xuankongData.shanPan ? xuankongData.shanPan : null;
    var xiangPan = xuankongData && xuankongData.xiangPan ? xuankongData.xiangPan : null;
    var yunPan = xuankongData && xuankongData.yunPan ? xuankongData.yunPan : null;
    var period = xuankongData && xuankongData.period ? xuankongData.period : (Math.floor((new Date().getFullYear() - 1864) / 20) + 1);
    var wangStar = period;

    var starNames = {1:'一白',2:'二黑',3:'三碧',4:'四绿',5:'五黄',6:'六白',7:'七赤',8:'八白',9:'九紫'};
    var gongNames = {1:'坎(北)',2:'坤(西南)',3:'震(东)',4:'巽(东南)',6:'乾(西北)',7:'兑(西)',8:'艮(东北)',9:'离(南)'};
    var dirNumMap = {'北':1,'南':9,'东':3,'西':7,'东北':8,'西北':6,'东南':4,'西南':2};

    // 收集九宫的山向星组合
    var combos = [];
    var palacePositions = [1,2,3,4,6,7,8,9]; // 排除中宫

    for (var pi = 0; pi < palacePositions.length; pi++) {
      var gongNum = palacePositions[pi];
      var shanStar = shanPan ? (shanPan[gongNum] || 0) : 0;
      var xiangStar = xiangPan ? (xiangPan[gongNum] || 0) : 0;
      var yunStar = yunPan ? (yunPan[gongNum] || 0) : 0;
      
      if (shanStar > 0 && xiangStar > 0) {
        // 查找匹配的经典组合
        var matched = null;
        for (var ci = 0; ci < comboDB.length; ci++) {
          var combo = comboDB[ci];
          if ((combo.stars[0] === shanStar && combo.stars[1] === xiangStar) ||
              (combo.stars[0] === xiangStar && combo.stars[1] === shanStar)) {
            matched = combo;
            break;
          }
        }
        
        // 同时检查运星与山向星的组合
        var matchedYunShan = null;
        var matchedYunXiang = null;
        for (var ci2 = 0; ci2 < comboDB.length; ci2++) {
          var combo2 = comboDB[ci2];
          if ((combo2.stars[0] === yunStar && combo2.stars[1] === shanStar) ||
              (combo2.stars[0] === shanStar && combo2.stars[1] === yunStar)) {
            matchedYunShan = combo2;
          }
          if ((combo2.stars[0] === yunStar && combo2.stars[1] === xiangStar) ||
              (combo2.stars[0] === xiangStar && combo2.stars[1] === yunStar)) {
            matchedYunXiang = combo2;
          }
        }
        
        combos.push({
          gongNum: gongNum,
          gongName: gongNames[gongNum] || ('宫' + gongNum),
          shanStar: shanStar,
          xiangStar: xiangStar,
          yunStar: yunStar,
          matched: matched,
          matchedYunShan: matchedYunShan,
          matchedYunXiang: matchedYunXiang
        });
      }
    }

    // 如果没有完整飞星盘数据，基于运盘生成组合分析
    var html = '';
    html += '<div style="margin-top:30px">';
    html += '<h5 style="font-size:14px;letter-spacing:4px;color:var(--gold);margin-bottom:6px">🌟 飞星组合深化分析</h5>';
    html += '<p style="font-size:12px;opacity:.5;margin-bottom:16px">经典飞星组合吉凶解读 · 《沈氏玄空学》《紫白诀》《飞星赋》</p>';

    // 飞星组合图例
    html += '<div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">';
    html += '<span style="font-size:11px;padding:2px 8px;border-radius:4px;background:rgba(46,204,113,0.12);color:#2ecc71">吉</span>';
    html += '<span style="font-size:11px;padding:2px 8px;border-radius:4px;background:rgba(231,76,60,0.12);color:#e74c3c">凶</span>';
    html += '<span style="font-size:11px;padding:2px 8px;border-radius:4px;background:rgba(220,53,69,0.12);color:#dc3545">大凶</span>';
    html += '<span style="font-size:11px;padding:2px 8px;border-radius:4px;background:rgba(201,168,76,0.12);color:#c9a84c">平</span>';
    html += '</div>';

    if (combos.length > 0) {
      // 有完整飞星盘：按宫位显示匹配的组合
      for (var i = 0; i < combos.length; i++) {
        var c = combos[i];
        var allMatches = [];
        if (c.matched) allMatches.push({type: '山向', combo: c.matched});
        if (c.matchedYunShan && c.matchedYunShan !== c.matched) allMatches.push({type: '运山', combo: c.matchedYunShan});
        if (c.matchedYunXiang && c.matchedYunXiang !== c.matched && c.matchedYunXiang !== c.matchedYunShan) allMatches.push({type: '运向', combo: c.matchedYunXiang});
        
        if (allMatches.length === 0) continue;
        
        for (var mi = 0; mi < allMatches.length; mi++) {
          var m = allMatches[mi];
          var luckColor = m.combo.luck === '吉' ? '#2ecc71' : m.combo.luck === '大凶' ? '#dc3545' : m.combo.luck === '凶' ? '#e74c3c' : '#c9a84c';
          var luckBg = m.combo.luck === '吉' ? 'rgba(46,204,113,0.06)' : m.combo.luck === '大凶' ? 'rgba(220,53,69,0.06)' : m.combo.luck === '凶' ? 'rgba(231,76,60,0.06)' : 'rgba(201,168,76,0.06)';
          
          html += '<div style="background:' + luckBg + ';border:1px solid ' + luckColor + '20;border-radius:10px;padding:16px;margin-bottom:12px;border-left:3px solid ' + luckColor + '">';
          html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">';
          html += '<span style="font-size:14px;color:var(--gold);font-weight:bold">' + c.gongName + ' · ' + m.combo.name + '</span>';
          html += '<span style="font-size:11px;padding:2px 8px;border-radius:4px;background:' + luckColor + '20;color:' + luckColor + '">' + m.combo.luck + '</span>';
          html += '</div>';
          html += '<div style="font-size:12px;opacity:.6;margin-bottom:8px">组合：' + starNames[c.shanStar] + '(山) + ' + starNames[c.xiangStar] + '(向)';
          if (m.type !== '山向') html += ' · ' + m.type + '组合';
          html += ' | 别名：' + m.combo.alias + '</div>';
          html += '<div style="font-size:12px;opacity:.7;line-height:1.7;margin-bottom:8px">📋 <strong>影响方面：</strong>' + m.combo.aspects + '</div>';
          html += '<div style="font-size:12px;opacity:.7;line-height:1.7;margin-bottom:8px">📖 <strong>详解：</strong>' + m.combo.detail + '</div>';
          html += '<div style="font-size:12px;color:#2ecc71;line-height:1.7;margin-bottom:8px">🛡️ <strong>化解/催旺：</strong>' + m.combo.cure + '</div>';
          html += '<div style="background:rgba(201,168,76,0.04);border-left:3px solid var(--gold);padding:6px 10px;border-radius:0 6px 6px 0;font-size:11px;opacity:.5;line-height:1.6">📜 ' + m.combo.classic + '</div>';
          html += '</div>';
        }
      }
    }

    // 经典组合速查表（即使无完整飞星盘也显示）
    html += '<div style="margin-top:20px"><h6 style="font-size:13px;letter-spacing:3px;color:var(--gold);margin-bottom:12px">📚 经典飞星组合速查表</h6>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:10px">';
    
    for (var di = 0; di < comboDB.length; di++) {
      var db = comboDB[di];
      var lc = db.luck === '吉' ? '#2ecc71' : db.luck === '大凶' ? '#dc3545' : db.luck === '凶' ? '#e74c3c' : '#c9a84c';
      var lbg = db.luck === '吉' ? 'rgba(46,204,113,0.04)' : db.luck === '大凶' ? 'rgba(220,53,69,0.04)' : db.luck === '凶' ? 'rgba(231,76,60,0.04)' : 'rgba(201,168,76,0.04)';
      
      html += '<div style="background:' + lbg + ';border:1px solid ' + lc + '15;border-radius:8px;padding:12px;border-left:3px solid ' + lc + '">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">';
      html += '<span style="font-size:13px;color:var(--gold);font-weight:bold">' + db.name + '</span>';
      html += '<span style="font-size:10px;padding:1px 6px;border-radius:3px;background:' + lc + '20;color:' + lc + '">' + db.luck + '</span>';
      html += '</div>';
      html += '<div style="font-size:11px;opacity:.5;margin-bottom:4px">' + db.alias + ' | ' + db.aspects + '</div>';
      html += '<div style="font-size:11px;opacity:.7;line-height:1.6;margin-bottom:4px">' + db.desc + '</div>';
      html += '<div style="font-size:11px;color:#2ecc71;line-height:1.6">化解：' + db.cure + '</div>';
      html += '</div>';
    }
    html += '</div></div>';

    html += '</div>';
    return html;
  } catch(e) {
    console.error('[飞星组合分析错误]', e.message);
    return '<div style="padding:16px;color:#e74c3c;font-size:12px">飞星组合分析出错: ' + e.message + '</div>';
  }
}

// ============================================================
// 子导航切换
// ============================================================

function showFengshuiProSub(id, btnEl) {
  var subIds = ['fengshui-daily-content','fengshui-layout-content','fengshui-business-content','fengshui-shaqi-content','fengshui-stars-content','fengshui-cure-content','fengshui-zeri-content'];
  subIds.forEach(function(sid) {
    var el = document.getElementById(sid);
    if (el) el.style.display = (sid === id) ? 'block' : 'none';
  });
  if (btnEl) {
    document.querySelectorAll('#section-fengshui-pro .fs-pro-subtab').forEach(function(b) { b.classList.remove('active'); });
    btnEl.classList.add('active');
  }
}

/** 触发计算并渲染 */
function fsProCompute(type) {
  var outputId = 'fs-pro-output-' + type;
  var output = document.getElementById(outputId);
  if (!output) return;
  var html = '';
  switch (type) {
    case 'daily': html = getDailyFengshuiGuide(); break;
    case 'layout': html = diagnoseHomeLayout(); break;
    case 'business': html = analyzeBusinessFengshui(); break;
    case 'shaqi': html = getShaqiCatalog(); break;
    case 'stars': html = renderAnnualFlyingStars(); break;
    case 'cure': html = generateFamilyAnnualCure(); break;
    case 'zeri': html = fengshuiZeRi(); break;
  }
  output.innerHTML = html;
  output.style.display = 'block';
  output.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// 暴露到全局
try {
  window.getDailyFengshuiGuide = getDailyFengshuiGuide;
  window.diagnoseHomeLayout = diagnoseHomeLayout;
  window.analyzeBusinessFengshui = analyzeBusinessFengshui;
  window.getShaqiCatalog = getShaqiCatalog;
  window.renderAnnualFlyingStars = renderAnnualFlyingStars;
  window.generateFamilyAnnualCure = generateFamilyAnnualCure;
  window.fengshuiZeRi = fengshuiZeRi;
  window.showFengshuiProSub = showFengshuiProSub;
  window.fsProCompute = fsProCompute;
  window.addFamilyMemberRow = addFamilyMemberRow;
} catch (e) { console.warn('[fengshui-pro] global export error:', e); }
