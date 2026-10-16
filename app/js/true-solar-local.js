/* 真太阳时校正 · 前端本地版（2026-10-16）
 * 与服务端 server/true-solar.js + city-lng.js 同口径：
 *   真太阳时 = 北京时间 + 时差(EoT, Spencer 1971) + (经度-120)×4分钟
 *   仅改时/分、不跨日（与服务端 normalize 0..1440 一致，两侧同简化）
 * 用途：离线排盘（_paipan / _ziweiIztroLocal）出生地经度校正；未命中城市不校正并如实披露。
 */
(function () {
  'use strict';
  // 与 server/city-lng.js 同源：4 直辖市 + 27 省会/首府 + 港澳台 + 主要大城市（约 50 城）
  var CITY_LNG = {
    '北京': 116.41, '天津': 117.20, '上海': 121.47, '重庆': 106.55,
    '石家庄': 114.51, '太原': 112.55, '呼和浩特': 111.75,
    '沈阳': 123.43, '长春': 125.32, '哈尔滨': 126.63,
    '南京': 118.78, '杭州': 120.15, '合肥': 117.28, '福州': 119.30,
    '南昌': 115.86, '济南': 117.12, '郑州': 113.62, '武汉': 114.30,
    '长沙': 112.94, '广州': 113.26, '南宁': 108.37, '海口': 110.32,
    '成都': 104.07, '贵阳': 106.63, '昆明': 102.83, '拉萨': 91.11,
    '西安': 108.94, '兰州': 103.83, '西宁': 101.78, '银川': 106.23,
    '乌鲁木齐': 87.62,
    '香港': 114.17, '澳门': 113.55, '台北': 121.56,
    '深圳': 114.06, '厦门': 118.09, '青岛': 120.38, '大连': 121.61,
    '宁波': 121.55, '苏州': 120.58, '无锡': 120.30, '佛山': 113.12,
    '东莞': 113.75, '珠海': 113.58, '温州': 120.70, '泉州': 118.68,
    '洛阳': 112.45, '烟台': 121.45, '桂林': 110.29, '三亚': 109.51,
    '绵阳': 104.68, '遵义': 106.93, '大理': 100.23, '丽江': 100.23,
    '喀什': 75.99, '日喀则': 88.88, '鄂尔多斯': 109.78, '包头': 109.84
  };
  var _citiesByLen = Object.keys(CITY_LNG).sort(function (a, b) { return b.length - a.length; });

  // 地名 → {city, lng, minutes}（最长城市名优先；未命中 null）
  function lookupLng(place) {
    if (!place || typeof place !== 'string') return null;
    var p = place.trim();
    if (!p) return null;
    for (var i = 0; i < _citiesByLen.length; i++) {
      var c = _citiesByLen[i];
      if (p.indexOf(c) >= 0) return { city: c, lng: CITY_LNG[c], minutes: Math.round((CITY_LNG[c] - 120) * 4 * 10) / 10 };
    }
    return null;
  }

  function dayOfYear(y, m, d) {
    var md = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    var n = d;
    for (var i = 0; i < m - 1; i++) n += md[i];
    if (m > 2 && ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0)) n += 1;
    return n;
  }
  function equationOfTime(y, m, d) { // Spencer 1971，分钟，误差 ±30 秒
    var N = dayOfYear(y, m, d);
    var B = (2 * Math.PI * (N - 1)) / 365;
    return 229.18 * (0.000075 + 0.001868 * Math.cos(B) - 0.032077 * Math.sin(B) - 0.014615 * Math.cos(2 * B) - 0.040849 * Math.sin(2 * B));
  }

  // toTrueSolar(y,m,d,h,minute,lng) → {true_hour, true_minute, correction_minutes, applied}
  function toTrueSolar(y, m, d, h, minute, lng) {
    if (lng === undefined || lng === null) {
      return { true_hour: h, true_minute: minute || 0, correction_minutes: 0, applied: false };
    }
    var corr = equationOfTime(y, m, d) + (lng - 120) * 4;
    var total = h * 60 + (minute || 0) + corr;
    total = ((total % 1440) + 1440) % 1440; // 同服务端：不跨日
    return {
      true_hour: Math.floor(total / 60),
      true_minute: Math.round(total % 60),
      correction_minutes: Math.round(corr * 10) / 10,
      applied: true, lng: lng
    };
  }

  function correctionNote(hit, before, after) {
    return '出生地「' + hit.city + '」经度 ' + hit.lng + '°E，真太阳时校正 ' + (hit.minutes > 0 ? '+' : '') + hit.minutes + ' 分钟'
      + (before && after ? '：' + before + ' → ' + after : '') + '（含时差微调，Spencer 1971）';
  }

  window._trueSolarLocal = { lookupLng: lookupLng, toTrueSolar: toTrueSolar, correctionNote: correctionNote, CITY_LNG: CITY_LNG };
})();
