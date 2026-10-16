/* 紫微斗数 · 前端 iztro 全 parity 本地引擎（2026-10-16）
 * 与服务端 server/ziwei-iztro-core.js 同一内核（iztro@2.6.0 UMD），离线也能出与在线完全一致的精排盘。
 * 契约对齐服务端 chart：yearGanZhi（含立春前修复解析）/ wuxingJu / mingGongIdx / shenGongIdx /
 * palaces（命宫起 12 宫：干支+主星+辅星+煞星+庙旺）/ siHua / mingZhu / shenZhu。
 * 依赖 window.iztro（js/vendor/iztro.min.js）；不可用时返回 null，调用方回退简式引擎。
 */
(function () {
  'use strict';
  var TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  var DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  var PALACES = ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '仆役', '官禄', '田宅', '福德', '父母'];
  var MUTAGEN_KEY = { 禄: 'lu', 权: 'quan', 科: 'ke', 忌: 'ji' };

  /**
   * @param y/m/d 公历年月日（isLunar 时为农历）
   * @param h 小时 0-23
   * @param opts { isLunar, leap, sex }
   * @returns chart|null（iztro 未加载返回 null）
   */
  function ziweiIztroLocal(y, m, d, h, opts) {
    if (!window.iztro || !window.iztro.astro) return null;
    opts = opts || {};
    var astro = window.iztro.astro;
    var timeIndex = Math.floor(((h + 1) % 24) / 2);
    var dateStr = y + '-' + m + '-' + d;
    var gender = (opts.sex === '女' || opts.sex === 'female') ? '女' : '男';
    var a = opts.isLunar
      ? astro.byLunar(dateStr, timeIndex, gender, !!opts.leap, true, 'zh-CN')
      : astro.bySolar(dateStr, timeIndex, gender, true, 'zh-CN');

    // 年干支：iztro chineseDate 为四柱空格分隔（无「年」字），取首柱；兼容带「年」格式（同服务端 2026-10-16 修复）
    var cdStr = a.chineseDate ? String(a.chineseDate) : '';
    var mCn = cdStr.match(/([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥])年/);
    var mFirst = cdStr.match(/([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥])/);
    var yearGZ = (mCn ? mCn[1] : (mFirst ? mFirst[1] : null))
      || (TIAN_GAN[((y - 4) % 10 + 10) % 10] + DI_ZHI[((y - 4) % 12 + 12) % 12]);

    var branchIdx = function (b) { return DI_ZHI.indexOf(b); };
    var mingPalace = a.palaces.find(function (p) { return p.name === '命宫'; });
    var mingZhiIdx = branchIdx(mingPalace.earthlyBranch);
    var byBranch = {};
    a.palaces.forEach(function (p) { byBranch[p.earthlyBranch] = p; });

    // 生年四化：从星曜 mutagen 反查（同服务端权威口径）
    var siHua = {};
    a.palaces.forEach(function (p) {
      (p.majorStars || []).concat(p.minorStars || []).forEach(function (s) {
        if (s.mutagen && MUTAGEN_KEY[s.mutagen]) siHua[MUTAGEN_KEY[s.mutagen]] = s.name;
      });
    });

    var palaces12 = [];
    for (var i = 0; i < 12; i++) {
      var zhiI = (mingZhiIdx - i + 12) % 12;
      var p = byBranch[DI_ZHI[zhiI]];
      var brightness = {};
      (p.majorStars || []).forEach(function (s) { if (s.brightness) brightness[s.name] = s.brightness; });
      var auxStars = [], evilStars = [], otherStars = [];
      (p.minorStars || []).forEach(function (s) {
        if (s.brightness) brightness[s.name] = s.brightness;
        if (s.type === 'soft') auxStars.push(s.name);
        else if (s.type === 'tough') evilStars.push(s.name);
        else otherStars.push(s.name);
      });
      (p.adjectiveStars || []).forEach(function (s) { otherStars.push(s.name); });
      palaces12.push({
        index: zhiI,
        name: PALACES[i],
        isMingGong: i === 0,
        isShenGong: !!p.isBodyPalace,
        mainStars: (p.majorStars || []).map(function (s) { return s.name; }),
        auxStars: auxStars, evilStars: evilStars, otherStars: otherStars,
        changsheng: p.changsheng12 ? [p.changsheng12] : [],
        ganZhi: p.heavenlyStem + p.earthlyBranch,
        brightness: brightness
      });
    }

    var bodyPalace = a.palaces.find(function (p) { return p.isBodyPalace; });
    return {
      year: y, month: m, day: d, hour: h, isLunar: !!opts.isLunar,
      yearGanZhi: yearGZ,
      wuxingJu: a.fiveElementsClass || '',
      mingGongIdx: mingZhiIdx,
      shenGongIdx: bodyPalace ? branchIdx(bodyPalace.earthlyBranch) : (mingZhiIdx + 6) % 12,
      palaces: palaces12,
      siHua: siHua,
      mingZhu: a.soul || '',
      shenZhu: a.body || '',
      engine: 'iztro-browser@2.6.0'
    };
  }

  window._ziweiIztroLocal = ziweiIztroLocal;
})();

/* 报告渲染：消费 ziweiIztroLocal 的 chart，输出与在线精排一致口径的文本报告（含借星安宫/四化/庙旺） */
(function () {
  'use strict';
  var DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  var STAR_DESC = {
    '紫微': '帝星·领导力强·主观固执', '天机': '智多星·善于谋划·神经敏感',
    '太阳': '贵星·热情大方·男主父旺', '武曲': '财星·刚毅果决·财禄有成',
    '天同': '福星·乐观享福·安于现状', '廉贞': '囚星·次桃花·干练多争',
    '天府': '库星·稳重保守·财蓄有成', '太阴': '母星·温柔内敛·女主母旺',
    '贪狼': '桃花·多才多艺·欲望强', '巨门': '暗星·口才好但多是非',
    '天相': '印星·循规蹈矩·助人助己', '天梁': '荫星·正直有原则·老成持重',
    '七杀': '将星·刚毅勇敢·波动大', '破军': '耗星·破旧立新·变化多端'
  };
  function starWithBright(p) {
    if (!p.mainStars.length) return '空宫';
    return p.mainStars.map(function (s) {
      var b = p.brightness && p.brightness[s];
      return s + (b ? '(' + b + ')' : '');
    }).join('、');
  }
  function borrowStars(chart, palace) {
    // 借星安宫：空宫借对宫（地支相冲位）主星
    var oppZhi = (palace.index + 6) % 12;
    var opp = chart.palaces.find(function (pc) { return pc.index === oppZhi; });
    return opp && opp.mainStars.length ? opp.mainStars : [];
  }
  function palaceLine(chart, p) {
    var line = p.name + '(' + p.ganZhi + ') → ' + starWithBright(p);
    if (!p.mainStars.length) {
      var bw = borrowStars(chart, p);
      if (bw.length) line += '（借对宫' + bw.join('、') + '）';
    }
    var aux = (p.auxStars || []).concat(p.evilStars || []);
    if (aux.length) line += ' [' + aux.join(' ') + ']';
    if (p.isShenGong) line += ' ★身宫';
    return line;
  }
  function coreSection(chart, p) {
    var stars = p.mainStars.length ? p.mainStars : borrowStars(chart, p);
    var first = stars[0];
    var head = '【' + p.name + ' · ' + (p.mainStars.length ? p.mainStars.join('、') : '空宫' + (stars.length ? '·借' + stars.join('、') : '')) + '】';
    var desc = stars.map(function (s) { return STAR_DESC[s]; }).filter(Boolean).join('；');
    if (!desc) desc = '辅曜参考：' + (p.auxStars.concat(p.evilStars).join('、') || '无');
    if (first === '巨门') desc += '。口才出众，适合律师/教师，但防口舌是非。';
    else if (first === '紫微') desc += '。领导力强，适合管理岗，但主观过强需广纳建言。';
    else if (first === '天机') desc += '。头脑灵活，适合策划/研究，注意多思多虑。';
    else if (first === '太阳') desc += '。热情博爱，适合公职/传媒。';
    else if (first === '武曲') desc += '。刚毅果决，适合金融/管理。';
    else if (first === '天同') desc += '。乐观温和，适合服务/教育。';
    else if (first === '天府') desc += '。稳重善理财，适合金融/房产。';
    else if (first === '太阴') desc += '。温柔内敛，适合艺术/教育。';
    else if (first === '贪狼') desc += '。多才多艺，适合演艺/销售，欲望需节制。';
    else if (first === '天梁') desc += '。正直有原则，适合法律/医疗。';
    else if (first === '七杀') desc += '。勇敢果决，适合军警/创业，波动大成就高。';
    else if (first === '破军') desc += '。破旧立新，适合创新行业。';
    else if (first === '廉贞') desc += '。干练有才，适合行政/法律，注意桃花纠纷。';
    else if (first === '天相') desc += '。踏实稳重，适合公务/行政。';
    return head + '\n' + desc + '\n\n';
  }
  function ziweiIztroReport(chart, birthStr) {
    var r = '━━━ 紫微斗数完整排盘报告 ━━━\n\n';
    r += '【生辰】' + birthStr + (chart.isLunar ? '（农历）' : '') + '\n';
    r += '【年干支】' + chart.yearGanZhi + '（立春界） · 【五行局】' + chart.wuxingJu + '\n';
    if (chart.mingZhu) r += '【命主】' + chart.mingZhu + ' · 【身主】' + chart.shenZhu + '\n';
    var sh = chart.siHua;
    if (sh.lu || sh.quan || sh.ke || sh.ji) {
      r += '【生年四化】' + (sh.lu ? sh.lu + '化禄 · ' : '') + (sh.quan ? sh.quan + '化权 · ' : '') + (sh.ke ? sh.ke + '化科 · ' : '') + (sh.ji ? sh.ji + '化忌' : '') + '\n';
    }
    r += '\n━━━ 一、十二宫详细排盘 ━━━\n';
    chart.palaces.forEach(function (p, i) { r += (i + 1) + '.' + palaceLine(chart, p) + '\n'; });
    r += '\n━━━ 二、核心宫位深度解读 ━━━\n';
    [0, 2, 4, 8].forEach(function (i) { r += coreSection(chart, chart.palaces[i]); }); // 命/夫妻/财帛/官禄
    r += '━━━ 排盘引擎：iztro 权威内核（与在线精排完全一致） ━━━';
    return r;
  }
  window._ziweiIztroReport = ziweiIztroReport;
})();
