/**
 * 紫微浏览器端 iztro 兜底引擎（R-ENGINE-UNIFY-2 · 2026-10-14）
 *
 * 背景：旧本地 ZiweiEngine.paipan 五行局表误用「年干×月支」（古制应为命宫干支纳音），
 * 且表内含「甲巳」等六十甲子不存在的非法干支组合，公历也未转农历——离线兜底排出错盘，
 * 违反「事实为体（知识失真=零）」宪法条款。
 *
 * 本模块以 iztro UMD 浏览器端（js/vendor/iztro.min.js，v2.6.0，与服务端同一内核同源同版）
 * 取代旧本地引擎，输出契约与 server/ziwei-iztro-core.js paipan() 完全一致，
 * 前端统一走 zwServerToLocal() 转换渲染——在线/离线同一引擎、同一结果。
 *
 * 依赖：window.iztro（UMD 全局）。未加载时 paipan 返回 null，由调用方诚实报错，不出错盘。
 */
(function () {
  'use strict';

  var TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  var DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  var PALACES = ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '奴仆', '官禄', '田宅', '福德', '父母'];
  var MUTAGEN_KEY = { '禄': 'lu', '权': 'quan', '科': 'ke', '忌': 'ji' };

  function normSex(sex) {
    if (sex === 'male' || sex === 'm' || sex === 'M') return '男';
    if (sex === 'female' || sex === 'f' || sex === 'F') return '女';
    return (sex === '女') ? '女' : '男';
  }

  // 小时 → iztro timeIndex（0=早子 … 11=亥, 12=晚子 23:00-24:00）——与服务端 hourToTimeIndex 逐行一致
  function hourToTimeIndex(hour) {
    var h = ((hour % 24) + 24) % 24;
    if (h === 23) return 12;
    return Math.floor((h + 1) / 2) % 12;
  }

  /**
   * 浏览器端排盘（契约同服务端 paipan，省略真太阳时/大限/流年等在线增强字段）
   * @returns {object|null} 服务端同构 chart；iztro 未加载或排盘异常返回 null
   */
  function paipan(year, month, day, hour, isLunar, sex) {
    if (!window.iztro || !window.iztro.astro) return null;
    try {
      var gender = normSex(sex);
      var timeIndex = hourToTimeIndex(hour);
      var dateStr = year + '-' + month + '-' + day;
      var astro = window.iztro.astro;
      var a = isLunar
        ? astro.byLunar(dateStr, timeIndex, gender, false, true, 'zh-CN')
        : astro.bySolar(dateStr, timeIndex, gender, true, 'zh-CN');
      if (!a || !a.palaces) return null;

      // 生年干支（iztro chineseDate 权威，缺省回退年柱推）
      // 2026-10-16 修复：iztro chineseDate 实为四柱空格分隔（「己巳 丁丑 庚辰 辛巳」无「年」字），
      // 旧 (?=年) 正则永不命中 → 立春前生人回退阳历年直推（如 1990-01 显示庚午，实际按己巳排盘），显示与内核矛盾。
      // 修正：优先取四柱首柱（年柱），兼容带「年」格式（与服务端 ziwei-iztro-core.js 同日修复同口径）。
      var yearGanZhi = null;
      if (a.chineseDate) {
        var cdStr = String(a.chineseDate);
        var mCn = cdStr.match(/([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥])年/);
        var mFirst = cdStr.match(/([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥])/);
        yearGanZhi = mCn ? mCn[1] : (mFirst ? mFirst[1] : null);
      }
      var gIdx = ((year - 4) % 10 + 10) % 10;
      var zIdx = ((year - 4) % 12 + 12) % 12;
      var yearGZ = yearGanZhi || (TIAN_GAN[gIdx] + DI_ZHI[zIdx]);

      var branchIdx = function (b) { return DI_ZHI.indexOf(b); };
      var mingPalace = null, bodyPalace = null;
      var byBranch = {};
      a.palaces.forEach(function (p) {
        byBranch[p.earthlyBranch] = p;
        if (p.name === '命宫') mingPalace = p;
        if (p.isBodyPalace) bodyPalace = p;
      });
      if (!mingPalace) return null;
      var mingZhiIdx = branchIdx(mingPalace.earthlyBranch);

      // 生年四化：从星曜 mutagen 反查（与服务端一致，不依赖年干推算）
      var siHua = {}, siHuaByStar = {};
      a.palaces.forEach(function (p) {
        (p.majorStars || []).concat(p.minorStars || []).forEach(function (s) {
          if (s.mutagen && MUTAGEN_KEY[s.mutagen]) {
            siHua[MUTAGEN_KEY[s.mutagen]] = s.name;
            siHuaByStar[s.name] = s.mutagen;
          }
        });
      });

      // 十二宫：命宫起沿地支递减（与服务端 palaces12 同序同构）
      var palaces12 = [];
      for (var i = 0; i < 12; i++) {
        var zhiI = (mingZhiIdx - i + 12) % 12;
        var p = byBranch[DI_ZHI[zhiI]];
        palaces12.push({
          index: zhiI,
          name: PALACES[i],
          isMingGong: i === 0,
          isShenGong: !!p.isBodyPalace,
          mainStars: (p.majorStars || []).map(function (s) { return s.name; })
        });
      }

      return {
        year: year, month: month, day: day, hour: hour, isLunar: !!isLunar,
        yearGanZhi: yearGZ,
        wuxingJu: a.fiveElementsClass || '',
        mingGong: '命宫',
        mingGongIdx: mingZhiIdx,
        shenGongIdx: bodyPalace ? branchIdx(bodyPalace.earthlyBranch) : (mingZhiIdx + 6) % 12,
        palaces: palaces12,
        siHua: siHua, siHuaByStar: siHuaByStar,
        mingZhu: a.soul || '',
        shenZhu: a.body || '',
        engine: 'iztro-browser@2.6.0'
      };
    } catch (e) {
      return null;
    }
  }

  window.ZwBrowserFallback = { paipan: paipan };
})();
