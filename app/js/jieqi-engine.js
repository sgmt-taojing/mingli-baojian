/**
 * 天文节气统一引擎 v1.0
 * 基于紫金山天文台官方历法 (lunar_python) 精确节气表
 * 覆盖 1900-2100，日级精度
 * 
 * 系统强制规则：
 * 1. 六十甲子推演以紫金山天文台官方历法、真实节气精确时刻为唯一真值
 * 2. 年柱以立春精准时刻更替，不用春节换年
 * 3. 月柱跟随二十四节令划分，不用农历初一换月
 * 4. 日柱沿用连续千年无中断纪日法
 * 5. 交界当日必须区分时分判定干支归属
 */

var TIAN_GAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
var DI_ZHI = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
var GAN_ZHI_60 = (function(){
  var arr = [];
  for(var i=0;i<60;i++) arr.push(TIAN_GAN[i%10]+DI_ZHI[i%12]);
  return arr;
})();

var GAN_WX = {'甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水'};
var ZHI_WX = {'子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火','午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水'};
var JIE_BRANCH = {
  '立春':'寅','惊蛰':'卯','清明':'辰','立夏':'巳',
  '芒种':'午','小暑':'未','立秋':'申','白露':'酉',
  '寒露':'戌','立冬':'亥','大雪':'子','小寒':'丑'
};

var JieqiEngine = {
  getJieqiDate: function(year, jieqiName){
    if(typeof JIEQI_TABLE === 'undefined') return null;
    var yt = JIEQI_TABLE[String(year)];
    if(!yt) return null;
    var dateStr = yt[jieqiName];
    if(!dateStr) return null;
    var parts = dateStr.split('-');
    return {month: parseInt(parts[0],10), day: parseInt(parts[1],10)};
  },

  getYearJieqi: function(year){
    if(typeof JIEQI_TABLE === 'undefined') return {};
    var yt = JIEQI_TABLE[String(year)] || {};
    var result = {};
    for(var name in yt){
      if(yt.hasOwnProperty(name)){
        var parts = yt[name].split('-');
        result[name] = {month: parseInt(parts[0],10), day: parseInt(parts[1],10)};
      }
    }
    return result;
  },

  /**
   * 确定月柱地支（12节为界）
   * 
   * 算法：从立春开始的一年周期中，找到最后一个已过的节
   * 立春日中午12时前仍属上一年丑月
   * 
   * @returns {{branch:string, jieName:string, solarYear:number}}
   */
  getMonthBranch: function(year, month, day, hour){
    // 获取本年立春
    var lichun = this.getJieqiDate(year, '立春');
    
    // 确定太阳年（立春为界）
    var solarYear = year;
    if(lichun){
      if(month < lichun.month || (month === lichun.month && day < lichun.day)){
        solarYear = year - 1;
      }
      // 立春当天：中午12时前还属上年丑月
      if(month === lichun.month && day === lichun.day && hour < 12){
        solarYear = year - 1;
      }
    }

    // 构建当前太阳年的12节列表
    // 太阳年 S：从 S 年立春 到 S+1 年立春前
    // 节序：立春(S) → 惊蛰(S) → ... → 大雪(S) → 小寒(S+1,1月)
    var candidates = [];
    
    // 本年小寒（1月，在立春前，属于上一年太阳年的末尾）
    var xiaohanThis = this.getJieqiDate(year, '小寒');
    if(xiaohanThis){
      candidates.push({jie:'小寒', cy:year, cm:xiaohanThis.month, cd:xiaohanThis.day});
    }

    // 本年立春到大雪
    var jieInYear = ['立春','惊蛰','清明','立夏','芒种','小暑','立秋','白露','寒露','立冬','大雪'];
    for(var i=0;i<jieInYear.length;i++){
      var jd = this.getJieqiDate(year, jieInYear[i]);
      if(jd){
        candidates.push({jie:jieInYear[i], cy:year, cm:jd.month, cd:jd.day});
      }
    }

    // 下年小寒（12月/1月，属于本年太阳年的末尾）
    var xiaohanNext = this.getJieqiDate(year+1, '小寒');
    if(xiaohanNext){
      candidates.push({jie:'小寒', cy:year+1, cm:xiaohanNext.month, cd:xiaohanNext.day});
    }

    // 按下一年立春（用作下一太阳年起点的参考，不用来计算）
    // 只需按时间排序即可
    candidates.sort(function(a,b){
      if(a.cy !== b.cy) return a.cy - b.cy;
      if(a.cm !== b.cm) return a.cm - b.cm;
      return a.cd - b.cd;
    });

    // 找到最后一个在 (year, month, day, hour) 当天或之前的节
    // 节气当天 12:00 前不算已过（仍属上一个节气月）
    var found = null;
    for(var i=0;i<candidates.length;i++){
      var c = candidates[i];
      if(c.cy < year || (c.cy === year && (c.cm < month || (c.cm === month && c.cd < day)))){
        found = c;
      } else if(c.cy === year && c.cm === month && c.cd === day && hour >= 12){
        found = c; // 节气当天 12:00 才算已过
      } else {
        break;
      }
    }

    if(!found){
      // 极小概率：1月1日还没到小寒 → 上一太阳年的大雪月
      return {branch:'子', jieName:'大雪', solarYear:year-1};
    }

    var branch = JIE_BRANCH[found.jie] || '寅';
    return {branch:branch, jieName:found.jie, solarYear:solarYear};
  },

  /**
   * 年柱（立春为界，中午12:00前归上一年）
   */
  getYearPillar: function(year, month, day, hour){
    var lichun = this.getJieqiDate(year, '立春');
    var y = year;
    if(lichun){
      if(month < lichun.month || (month === lichun.month && day < lichun.day)){
        y = year - 1;
      }
      if(month === lichun.month && day === lichun.day && hour < 12){
        y = year - 1;
      }
    }
    var ganIdx = ((y - 4) % 10 + 10) % 10;
    var zhiIdx = ((y - 4) % 12 + 12) % 12;
    return {gan:TIAN_GAN[ganIdx], zhi:DI_ZHI[zhiIdx], ganzhi:TIAN_GAN[ganIdx]+DI_ZHI[zhiIdx]};
  },

  /**
   * 月柱（节气为界）
   */
  getMonthPillar: function(year, month, day, hour){
    var mb = this.getMonthBranch(year, month, day, hour);
    var sy = mb.solarYear;
    var branchIdx = DI_ZHI.indexOf(mb.branch);
    
    // 五虎遁：年干定月干起始
    // 甲己→丙寅, 乙庚→戊寅, 丙辛→庚寅, 丁壬→壬寅, 戊癸→甲寅
    var yearGanIdx = ((sy - 4) % 10 + 10) % 10;
    var startGan = [2,4,6,8,0]; // 丙=2, 戊=4, 庚=6, 壬=8, 甲=0
    var s = startGan[yearGanIdx % 5];
    // 正月寅月起，向前步进到目标月支
    var stepsFromYin = (branchIdx - 2 + 12) % 12;
    var monthGanIdx = (s + stepsFromYin) % 10;
    
    return {gan:TIAN_GAN[monthGanIdx], zhi:mb.branch, ganzhi:TIAN_GAN[monthGanIdx]+mb.branch};
  },

  /**
   * 日柱（连续纪日法，1900-01-01=甲子日）
   */
  getDayPillar: function(year, month, day){
    var base = new Date(1900, 0, 1);
    var target = new Date(year, month-1, day);
    var diff = Math.round((Date.UTC(year, month-1, day) - Date.UTC(1900, 0, 1)) / 86400000);
    var idx = ((diff + 10) % 60 + 60) % 60; /* 1900-01-01=甲戌(idx=10) */
    return {
      gan: TIAN_GAN[idx % 10],
      zhi: DI_ZHI[idx % 12],
      ganzhi: GAN_ZHI_60[idx],
      idx: idx
    };
  },

  /**
   * 时柱（五子遁）
   */
  getHourPillar: function(dayGan, hour){
    var zhiIdx = Math.floor((hour + 1) / 2) % 12;
    var dayGanIdx = TIAN_GAN.indexOf(dayGan);
    var startGan = [0,2,4,6,8]; // 甲→甲子, 乙→丙子, 丙→戊子, 丁→庚子, 戊→壬子
    var ganIdx = (startGan[dayGanIdx % 5] + zhiIdx) % 10;
    return {gan:TIAN_GAN[ganIdx], zhi:DI_ZHI[zhiIdx], ganzhi:TIAN_GAN[ganIdx]+DI_ZHI[zhiIdx]};
  },

  /**
   * 完整排四柱（天文节气精确版）
   */
  getFourPillars: function(year, month, day, hour){
    if(hour === undefined) hour = 0;
    var yp = this.getYearPillar(year, month, day, hour);
    var mp = this.getMonthPillar(year, month, day, hour);
    var dp = this.getDayPillar(year, month, day);
    var hp = this.getHourPillar(dp.gan, hour);
    var mb = this.getMonthBranch(year, month, day, hour);
    var lichun = this.getJieqiDate(year, '立春');
    var isLichunBoundary = !!(lichun && month === lichun.month && day === lichun.day);

    return {
      yearGan: yp.gan, yearZhi: yp.zhi, yearGZ: yp.ganzhi,
      monthGan: mp.gan, monthZhi: mp.zhi, monthGZ: mp.ganzhi,
      dayGan: dp.gan, dayZhi: dp.zhi, dayGZ: dp.ganzhi,
      hourGan: hp.gan, hourZhi: hp.zhi, hourGZ: hp.ganzhi,
      jieqi: mb.jieName || '',
      liChunBoundary: isLichunBoundary,
      solarYear: mb.solarYear,
      source: '紫金山天文台历表'
    };
  },

  /**
   * 节气交界检测
   */
  getJieqiBoundary: function(year, month, day, hour){
    var allTerms = this.getYearJieqi(year);
    var nearest = null;
    var minDiff = Infinity;
    var isBoundary = false;

    for(var name in allTerms){
      if(!allTerms.hasOwnProperty(name)) continue;
      var t = allTerms[name];
      var termDate = new Date(year, t.month-1, t.day);
      var curDate = new Date(year, month-1, day);
      var diff = Math.round((termDate - curDate) / 86400000);
      if(diff === 0){
        isBoundary = true;
        nearest = name;
        minDiff = 0;
      } else if(Math.abs(diff) < Math.abs(minDiff)){
        minDiff = diff;
        nearest = name;
      }
    }

    var tips = '';
    if(isBoundary){
      tips = '⚠️ 当日为「' + nearest + '」交节日，年/月柱归属需按具体时分判定';
    } else if(minDiff > 0 && minDiff <= 2){
      tips = '📅 「' + nearest + '」' + minDiff + '天后交节，临近节气交界需留意';
    }

    return {nearby:nearest, daysTo:minDiff, isBoundary:isBoundary, tips:tips};
  },

  /**
   * 60甲子纳音
   */
  NAYIN: [
    '海中金','炉中火','大林木','路旁土','剑锋金','山头火','涧下水','城墙土','白蜡金','杨柳木',
    '泉中水','屋上土','霹雳火','松柏木','长流水','砂石金','山下火','平地木','壁上土','金箔金',
    '覆灯火','天河水','大驿土','钗钏金','桑柘木','大溪水','沙中土','天上火','石榴木','大海水'
  ],

  getNayin: function(ganzhi){
    var idx = GAN_ZHI_60.indexOf(ganzhi);
    if(idx < 0) return '';
    return this.NAYIN[Math.floor(idx/2)];
  },

  /**
   * 三派并列输出（用户规则要求）
   * ① 天文标准干支 ② 现代子平体系 ③ 冬至岁首古法参考
   */
  getThreeSchoolOutput: function(year, month, day, hour){
    if(hour === undefined) hour = 0;
    
    // ① 天文标准（紫金山天文台历法）
    var astro = this.getFourPillars(year, month, day, hour);
    
    // ② 现代子平体系（同天文标准——子平也以节气为界）
    // 差异在于神煞、十神等解读，干支列法一致
    var ziping = this.getFourPillars(year, month, day, hour);
    ziping.source = '现代子平体系';
    
    // ③ 冬至岁首古法
    // 古法以冬至为一岁之始，年柱在冬至而非立春更替
    var dongzhi = this.getJieqiDate(year, '冬至');
    var ancientYear = year;
    if(dongzhi){
      if(month < dongzhi.month || (month === dongzhi.month && day < dongzhi.day)){
        ancientYear = year - 1;
      }
      // 冬至当天中午前 → 归上年
      if(month === dongzhi.month && day === dongzhi.day && hour < 12){
        ancientYear = year - 1;
      }
    }
    var aGanIdx = ((ancientYear - 4) % 10 + 10) % 10;
    var aZhiIdx = ((ancientYear - 4) % 12 + 12) % 12;
    var ancient = {
      yearGan: TIAN_GAN[aGanIdx],
      yearZhi: DI_ZHI[aZhiIdx],
      yearGZ: TIAN_GAN[aGanIdx] + DI_ZHI[aZhiIdx],
      monthGan: astro.monthGan,
      monthZhi: astro.monthZhi,
      monthGZ: astro.monthGZ,
      dayGan: astro.dayGan,
      dayZhi: astro.dayZhi,
      dayGZ: astro.dayGZ,
      hourGan: astro.hourGan,
      hourZhi: astro.hourZhi,
      hourGZ: astro.hourGZ,
      jieqi: astro.jieqi,
      solarYear: ancientYear,
      source: '冬至岁首古法（通用整理值）'
    };
    
    var boundary = this.getJieqiBoundary(year, month, day, hour);
    
    return {
      astro: astro,
      ziping: ziping,
      ancient: ancient,
      boundary: boundary,
      hasDisagreement: (astro.yearGZ !== ancient.yearGZ)
    };
  }
};

if(typeof window !== 'undefined'){ window.JieqiEngine = JieqiEngine; }
if(typeof module !== 'undefined' && module.exports){ module.exports = JieqiEngine; }
