/**
 * 紫微斗数排盘引擎 v1.0
 * 纯前端 JS 实现，不依赖后端 API
 * 基于出生年月日时 → 推算十二宫 + 主星 + 四化
 */
(function(){
  'use strict';
  window.ZiweiEngine = window.ZiweiEngine || {};

  // ===== 天干地支 =====
  var TIAN_GAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  var DI_ZHI = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  var ZHI_HOUR = {子:0,丑:1,寅:3,卯:5,辰:7,巳:9,午:11,未:13,申:15,酉:17,戌:19,亥:23};

  // ===== 五行局（年干×月支）=====
  var WUXING_JU = {
    '甲子':'金四局','甲午':'金四局','甲辰':'火六局','甲戌':'火六局',
    '甲寅':'水二局','甲申':'水二局','甲巳':'土五局','甲亥':'土五局',
    '乙丑':'金四局','乙未':'金四局','乙卯':'火六局','乙酉':'火六局',
    '乙巳':'水二局','乙亥':'水二局','乙辰':'土五局','乙戌':'土五局',
    '丙寅':'火六局','丙申':'火六局','丙子':'水二局','丙午':'水二局',
    '丙辰':'土五局','丙戌':'土五局','丙卯':'金四局','丙酉':'金四局',
    '丁卯':'火六局','丁酉':'火六局','丁丑':'水二局','丁未':'水二局',
    '丁巳':'土五局','丁亥':'土五局','丁寅':'金四局','丁申':'金四局',
    '戊辰':'木三局','戊戌':'木三局','戊子':'火六局','戊午':'火六局',
    '戊寅':'土五局','戊申':'土五局','戊卯':'金四局','戊酉':'金四局',
    '戊巳':'水二局','戊亥':'水二局',
    '己巳':'木三局','己亥':'木三局','己丑':'火六局','己未':'火六局',
    '己卯':'土五局','己酉':'土五局','己寅':'金四局','己申':'金四局',
    '己辰':'水二局','己戌':'水二局',
    '庚午':'木三局','庚子':'木三局','庚辰':'火六局','庚戌':'火六局',
    '庚寅':'土五局','庚申':'土五局','庚卯':'金四局','庚酉':'金四局',
    '庚巳':'水二局','庚亥':'水二局',
    '辛未':'木三局','辛丑':'木三局','辛巳':'火六局','辛亥':'火六局',
    '辛卯':'土五局','辛酉':'土五局','辛寅':'金四局','辛申':'金四局',
    '辛辰':'水二局','辛戌':'水二局',
    '壬申':'木三局','壬寅':'木三局','壬午':'金四局','壬子':'金四局',
    '壬辰':'水二局','壬戌':'水二局','壬巳':'火六局','壬亥':'火六局',
    '壬卯':'土五局','壬酉':'土五局',
    '癸酉':'木三局','癸卯':'木三局','癸未':'金四局','癸丑':'金四局',
    '癸巳':'水二局','癸亥':'水二局','癸午':'火六局','癸子':'火六局',
    '癸辰':'土五局','癸戌':'土五局'
  };

  // ===== 十二宫位 =====
  var PALACES = ['命宫','兄弟','夫妻','子女','财帛','疾厄','迁移','奴仆','官禄','田宅','福德','父母'];

  // ===== 十四主星 =====
  var MAIN_STARS = ['紫微','天机','太阳','武曲','天同','廉贞','天府','太阴','贪狼','巨门','天相','天梁','七杀','破军'];

  // ===== 紫微星定位（简化版：基于五行局+农历日）=====
  function locateZiwei(ju, day){
    var juMap = {'水二局':2,'木三局':3,'金四局':4,'土五局':5,'火六局':6};
    var juNum = juMap[ju] || 5;
    // 紫微星位置 = 农历日数除以局数取整 + 余数处理
    var pos;
    var remainder = day % juNum;
    if(remainder === 0){
      pos = Math.floor(day / juNum);
    } else {
      pos = Math.floor(day / juNum) + 1;
      // 每隔一个局数间隔
      var steps = Math.ceil(day / juNum);
      pos = steps;
      // 调整到12宫位内
    }
    // 紫微星在十二宫中的位置（从寅起算）
    var ziweiIdx = ((pos - 1) * 2) % 12;
    return ziweiIdx;
  }

  // ===== 紫微星系分布（紫微星定位后，其他主星跟随）=====
  var ZIWEI_SYSTEM = {
    0: {ziwei:0, tianji:11, taiyang:8, wuqu:7, lianzhen:4},
    1: {ziwei:1, tianji:0, taiyang:9, wuqu:8, lianzhen:5},
    2: {ziwei:2, tianji:1, taiyang:10, wuqu:9, lianzhen:6},
    3: {ziwei:3, tianji:2, taiyang:11, wuqu:10, lianzhen:7},
    4: {ziwei:4, tianji:3, taiyang:0, wuqu:11, lianzhen:8},
    5: {ziwei:5, tianji:4, taiyang:1, wuqu:0, lianzhen:9},
    6: {ziwei:6, tianji:5, taiyang:2, wuqu:1, lianzhen:10},
    7: {ziwei:7, tianji:6, taiyang:3, wuqu:2, lianzhen:11},
    8: {ziwei:8, tianji:7, taiyang:4, wuqu:3, lianzhen:0},
    9: {ziwei:9, tianji:8, taiyang:5, wuqu:4, lianzhen:1},
    10: {ziwei:10, tianji:9, taiyang:6, wuqu:5, lianzhen:2},
    11: {ziwei:11, tianji:10, taiyang:7, wuqu:6, lianzhen:3}
  };

  // 天府星系（天府定位后跟随）
  function locateTianfu(ziweiIdx){
    // 天府与紫微关于寅申线对称
    return (4 - ziweiIdx + 12) % 12;
  }

  var TIANFU_SYSTEM = {
    0: {tianfu:4, taiyin:8, tanlang:3, jumen:6, tianxiang:9, tianliang:5, qisha:10, pojun:2},
    1: {tianfu:3, taiyin:9, tanlang:2, jumen:7, tianxiang:10, tianliang:6, qisha:11, pojun:1},
    2: {tianfu:2, taiyin:10, tanlang:1, jumen:8, tianxiang:11, tianliang:7, qisha:0, pojun:0},
    3: {tianfu:1, taiyin:11, tanlang:0, jumen:9, tianxiang:0, tianliang:8, qisha:1, pojun:11},
    4: {tianfu:0, taiyin:0, tanlang:11, jumen:10, tianxiang:1, tianliang:9, qisha:2, pojun:10},
    5: {tianfu:11, taiyin:1, tanlang:10, jumen:11, tianxiang:2, tianliang:10, qisha:3, pojun:9},
    6: {tianfu:10, taiyin:2, tanlang:9, jumen:0, tianxiang:3, tianliang:11, qisha:4, pojun:8},
    7: {tianfu:9, taiyin:3, tanlang:8, jumen:1, tianxiang:4, tianliang:0, qisha:5, pojun:7},
    8: {tianfu:8, taiyin:4, tanlang:7, jumen:2, tianxiang:5, tianliang:1, qisha:6, pojun:6},
    9: {tianfu:7, taiyin:5, tanlang:6, jumen:3, tianxiang:6, tianliang:2, qisha:7, pojun:5},
    10: {tianfu:6, taiyin:6, tanlang:5, jumen:4, tianxiang:7, tianliang:3, qisha:8, pojun:4},
    11: {tianfu:5, taiyin:7, tanlang:4, jumen:5, tianxiang:8, tianliang:4, qisha:9, pojun:3}
  };

  // ===== 四化星（年干决定）=====
  var SI_HUA = {
    '甲': {lu:'廉贞', quan:'破军', ke:'武曲', ji:'太阳'},
    '乙': {lu:'天机', quan:'天梁', ke:'紫微', ji:'太阴'},
    '丙': {lu:'天同', quan:'天机', ke:'文昌', ji:'廉贞'},
    '丁': {lu:'太阴', quan:'天同', 科:'天机', ji:'巨门'},
    '戊': {lu:'贪狼', quan:'太阴', 科:'右弼', ji:'天机'},
    '己': {lu:'武曲', quan:'贪狼', 科:'天梁', ji:'文曲'},
    '庚': {lu:'太阳', quan:'武曲', 科:'太阴', ji:'天同'},
    '辛': {lu:'巨门', quan:'太阳', 科:'文曲', ji:'文昌'},
    '壬': {lu:'天梁', quan:'紫微', 科:'左辅', ji:'武曲'},
    '癸': {lu:'破军', quan:'巨门', 科:'太阴', ji:'贪狼'}
  };

  // ===== 命宫定位（月支+时支逆推）=====
  function locateMingGong(month, hourZhi){
    // 从寅起，顺数月，逆数时
    var base = 2; // 寅=2
    var mg = (base + month - 1 - hourZhi + 12) % 12;
    return mg;
  }

  // ===== 身宫定位 =====
  function locateShenGong(month, hourZhi){
    // 从寅起，顺数月，顺数时
    var base = 2;
    var sg = (base + month - 1 + hourZhi) % 12;
    return sg;
  }

  // ===== 主排盘函数 =====
  function paipan(year, month, day, hour, isLunar){
    // 计算年干支
    var ganIdx = (year - 4) % 10;
    var zhiIdx = (year - 4) % 12;
    var yearGan = TIAN_GAN[ganIdx];
    var yearZhi = DI_ZHI[zhiIdx];
    var yearGanZhi = yearGan + yearZhi;

    // 时支索引
    var hourZhi = 0;
    for(var i = 0; i < DI_ZHI.length; i++){
      if(ZHI_HOUR[DI_ZHI[i]] !== undefined){
        var start = ZHI_HOUR[DI_ZHI[i]];
        var end = (start + 2) % 24;
        if(end === 0) end = 24;
        if(hour >= start && hour < end){
          hourZhi = i;
          break;
        }
      }
    }

    // 五行局
    var juKey = yearGan + yearZhi;
    var ju = WUXING_JU[juKey] || '土五局';

    // 命宫/身宫
    var mingGongIdx = locateMingGong(month, hourZhi);
    var shenGongIdx = locateShenGong(month, hourZhi);

    // 紫微星定位
    var ziweiIdx = locateZiwei(ju, day);

    // 紫微星系
    var zwSys = ZIWEI_SYSTEM[ziweiIdx] || {};
    // 天府星系
    var tfIdx = locateTianfu(ziweiIdx);
    var tfSys = TIANFU_SYSTEM[tfIdx] || {};

    // 合并所有主星位置
    var starPositions = {};
    starPositions.ziwei = zwSys.ziwei;
    starPositions.tianji = zwSys.tianji;
    starPositions.taiyang = zwSys.taiyang;
    starPositions.wuqu = zwSys.wuqu;
    starPositions.lianzhen = zwSys.lianzhen;
    starPositions.tianfu = tfSys.tianfu;
    starPositions.taiyin = tfSys.taiyin;
    starPositions.tanlang = tfSys.tanlang;
    starPositions.jumen = tfSys.jumen;
    starPositions.tianxiang = tfSys.tianxiang;
    starPositions.tianliang = tfSys.tianliang;
    starPositions.qisha = tfSys.qisha;
    starPositions.pojun = tfSys.pojun;

    // 四化
    var sihua = SI_HUA[yearGan] || {};

    // 十二宫排列（从命宫起逆时针）
    var palaces12 = [];
    for(var i = 0; i < 12; i++){
      var palaceIdx = (mingGongIdx + i) % 12;
      var palaceName = PALACES[i];
      var starsInPalace = [];
      Object.keys(starPositions).forEach(function(star){
        if(starPositions[star] === palaceIdx){
          starsInPalace.push(star);
        }
      });
      palaces12.push({
        index: palaceIdx,
        name: palaceName,
        stars: starsInPalace,
        isMingGong: i === 0,
        isShenGong: palaceIdx === shenGongIdx
      });
    }

    return {
      year: year,
      month: month,
      day: day,
      hour: hour,
      isLunar: isLunar || false,
      yearGanZhi: yearGanZhi,
      dayMaster: '', // 紫微不用日主，留空
      wuxingJu: ju,
      mingGong: PALACES[0],
      mingGongIdx: mingGongIdx,
      shenGong: PALACES[shenGongIdx - mingGongIdx] || PALACES[(shenGongIdx - mingGongIdx + 12) % 12],
      shenGongIdx: shenGongIdx,
      ziweiStarIdx: ziweiIdx,
      palaces: palaces12,
      siHua: sihua,
      mainStars: MAIN_STARS
    };
  }

  // ===== 渲染紫微命盘 =====
  function renderChart(container, result){
    if(!container || !result) return;
    var starNames = {
      ziwei:'紫微', tianji:'天机', taiyang:'太阳', wuqu:'武曲', lianzhen:'廉贞',
      tianfu:'天府', taiyin:'太阴', tanlang:'贪狼', jumen:'巨门',
      tianxiang:'天相', tianliang:'天梁', qisha:'七杀', pojun:'破军'
    };

    var html = '<div class="ziwei-chart">';
    html += '<div class="ziwei-header">';
    html += '<div class="ziwei-title">🌌 紫微斗数命盘</div>';
    html += '<div class="ziwei-meta">' + result.yearGanZhi + '年 · ' + result.wuxingJu + ' · 命宫：' + result.mingGong + '</div>';
    html += '</div>';

    // 四化
    if(result.siHua){
      html += '<div class="ziwei-sihua">';
      html += '<span class="sihua-item hua-lu">化禄：' + (result.siHua.lu||'') + '</span>';
      html += '<span class="sihua-item hua-quan">化权：' + (result.siHua.quan||'') + '</span>';
      html += '<span class="sihua-item hua-ke">化科：' + (result.siHua.ke||result.siHua.科||'') + '</span>';
      html += '<span class="sihua-item hua-ji">化忌：' + (result.siHua.ji||'') + '</span>';
      html += '</div>';
    }

    // 十二宫网格（4×3）
    html += '<div class="ziwei-grid">';
    result.palaces.forEach(function(p, i){
      var cls = 'ziwei-gong';
      if(p.isMingGong) cls += ' gong-ming';
      if(p.isShenGong) cls += ' gong-shen';
      html += '<div class="' + cls + '" data-palace="' + p.name + '" style="cursor:pointer">';
      html += '<div class="gong-name">' + p.name;
      if(p.isMingGong) html += ' <span class="gong-tag">命</span>';
      if(p.isShenGong) html += ' <span class="gong-tag shen">身</span>';
      html += '</div>';
      if(p.stars.length > 0){
        html += '<div class="gong-stars">';
        p.stars.forEach(function(s){
          var name = starNames[s] || s;
          var starCls = 'star';
          if(['紫微','天府','太阳','太阴','贪狼','巨门','天相','天梁','七杀','破军','武曲','天机','廉贞'].indexOf(name) >= 0){
            starCls += ' star-main';
          }
          // 四化标记
          if(result.siHua){
            if(result.siHua.lu === name) starCls += ' hua-lu';
            if(result.siHua.quan === name) starCls += ' hua-quan';
            if((result.siHua.ke || result.siHua.科) === name) starCls += ' hua-ke';
            if(result.siHua.ji === name) starCls += ' hua-ji';
          }
          html += '<span class="' + starCls + '">' + name + '</span>';
        });
        html += '</div>';
      } else {
        html += '<div class="gong-empty">空宫</div>';
      }
      html += '</div>';
    });
    html += '</div>';

    html += '</div>';
    container.innerHTML = html;
  }

  // 暴露
  window.ZiweiEngine.paipan = paipan;
  window.ZiweiEngine.renderChart = renderChart;
  window.ZiweiEngine.PALACES = PALACES;
  window.ZiweiEngine.MAIN_STARS = MAIN_STARS;

})();
