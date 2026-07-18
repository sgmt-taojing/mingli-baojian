// annual-fortune.js — 年度运势引擎
// 跨年祈福参拜指南 + 年后运势指导
// 依赖: divination-hub.html 中的全局变量和函数(STEMS, BRANCHES, ELE, ZHI_ELE, ZHI_CANGGAN, TENGAN, TEGAN_NAMES, getTenGod, getDishi, getJieDate, JIE_DATES 等)
(function() {
  'use strict';

  // ══════════════════════════════════════════════════════════════
  //  常量定义
  // ══════════════════════════════════════════════════════════════

  const STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  const BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  const ZODIACS = ['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'];
  const ELE = {甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水'};
  const ZHI_ELE = {子:'水',丑:'土',寅:'木',卯:'木',辰:'土',巳:'火',午:'火',未:'土',申:'金',酉:'金',戌:'土',亥:'水'};

  // 太岁地支方位
  var BRANCH_DIRECTIONS = {
    0: '正北',   // 子
    1: '东北偏北', // 丑
    2: '东北偏东', // 寅
    3: '正东',   // 卯
    4: '东南偏东', // 辰
    5: '东南偏南', // 巳
    6: '正南',   // 午
    7: '西南偏南', // 未
    8: '西南偏西', // 申
    9: '正西',   // 酉
    10: '西北偏西', // 戌
    11: '西北偏北'  // 亥
  };

  // 年干吉位表
  // 甲己年、乙庚年、丙辛年、丁壬年、戊癸年
  var YEAR_STEM_DIRECTIONS = {
    0: {cai:'东北', xi:'东北', gui:'正北', wenchang:'正南'},  // 甲
    5: {cai:'东北', xi:'东北', gui:'正北', wenchang:'正南'},  // 己
    1: {cai:'正北', xi:'西北', gui:'西南', wenchang:'正北'},  // 乙
    6: {cai:'正北', xi:'西北', gui:'西南', wenchang:'正北'},  // 庚
    2: {cai:'正西', xi:'西南', gui:'正西', wenchang:'正西'},  // 丙
    7: {cai:'正西', xi:'西南', gui:'正西', wenchang:'正西'},  // 辛
    3: {cai:'正东', xi:'正南', gui:'正东', wenchang:'正东'},  // 丁
    8: {cai:'正东', xi:'正南', gui:'正东', wenchang:'正东'},  // 壬
    4: {cai:'正南', xi:'东南', gui:'正南', wenchang:'正南'},  // 戊
    9: {cai:'正南', xi:'东南', gui:'正南', wenchang:'正南'}   // 癸
  };

  // 相冲: 差6
  // 相害: 子未、丑午、寅巳、卯辰、申亥、酉戌
  const HAI_PAIRS = [[0,7],[7,0],[1,6],[6,1],[2,5],[5,2],[3,4],[4,3],[8,11],[11,8],[9,10],[10,9]];

  // 相刑: 寅巳申(无恩之刑)、丑戌未(恃势之刑)、子卯(无礼之刑)、辰辰(自刑)、午午(自刑)、酉酉(自刑)、亥亥(自刑)
  var XING_GROUPS = [
    [2,5,8],   // 寅巳申
    [1,10,7],  // 丑戌未
    [0,3],     // 子卯
    [4,4],     // 辰自刑
    [6,6],     // 午自刑
    [9,9],     // 酉自刑
    [11,11]    // 亥自刑
  ];

  // 相破: 子酉、丑辰、寅亥、卯午、巳申、未戌
  const PO_PAIRS = [[0,9],[9,0],[1,4],[4,1],[2,11],[11,2],[3,6],[6,3],[5,8],[8,5],[7,10],[10,7]];

  // 十神名(本地副本,避免依赖外部)
  const TEN_GOD_NAMES = {比:'比肩',劫:'劫财',食:'食神',伤:'伤官',财:'正财',才:'偏财',官:'正官',杀:'七杀',印:'正印',枭:'偏印'};

  // 天干十神表(本地副本)
  var TENGAN_LOCAL = {
    甲:{比:'甲',劫:'乙',食:'丙',伤:'丁',财:'己',才:'戊',官:'辛',杀:'庚',印:'癸',枭:'壬'},
    乙:{比:'乙',劫:'甲',食:'丁',伤:'丙',财:'戊',才:'己',官:'庚',杀:'辛',印:'壬',枭:'癸'},
    丙:{比:'丙',劫:'丁',食:'戊',伤:'己',财:'辛',才:'庚',官:'癸',杀:'壬',印:'乙',枭:'甲'},
    丁:{比:'丁',劫:'丙',食:'己',伤:'戊',财:'庚',才:'辛',官:'壬',杀:'癸',印:'甲',枭:'乙'},
    戊:{比:'戊',劫:'己',食:'庚',伤:'辛',财:'癸',才:'壬',官:'乙',杀:'甲',印:'丁',枭:'丙'},
    己:{比:'己',劫:'戊',食:'辛',伤:'庚',财:'壬',才:'癸',官:'甲',杀:'乙',印:'丙',枭:'丁'},
    庚:{比:'庚',劫:'辛',食:'壬',伤:'癸',财:'乙',才:'甲',官:'丁',杀:'丙',印:'己',枭:'戊'},
    辛:{比:'辛',劫:'庚',食:'癸',伤:'壬',财:'甲',才:'乙',官:'丙',杀:'丁',印:'戊',枭:'己'},
    壬:{比:'壬',劫:'癸',食:'甲',伤:'乙',财:'丁',才:'丙',官:'己',杀:'戊',印:'辛',枭:'庚'},
    癸:{比:'癸',劫:'壬',食:'乙',伤:'甲',财:'丙',才:'丁',官:'戊',杀:'己',印:'庚',枭:'辛'}
  };

  // 长生十二宫
  var CHANGSHENG_START_LOCAL = {
    '甲':'亥','丙':'寅','戊':'寅','庚':'巳','壬':'申',
    '乙':'午','丁':'酉','己':'酉','辛':'子','癸':'卯'
  };
  const CS_ORDER = ['长生','沐浴','冠带','临官','帝旺','衰','病','死','墓','绝','胎','养'];
  const GAN_YINYANG = {'甲':'阳','乙':'阴','丙':'阳','丁':'阴','戊':'阳','己':'阴','庚':'阳','辛':'阴','壬':'阳','癸':'阴'};

  // 藏干表
  var ZHI_CANGGAN_LOCAL = {
    '子':['癸'],'丑':['己','癸','辛'],'寅':['甲','丙','戊'],'卯':['乙'],
    '辰':['戊','乙','癸'],'巳':['丙','戊','庚'],'午':['丁','己'],'未':['己','丁','乙'],
    '申':['庚','壬','戊'],'酉':['辛'],'戌':['戊','辛','丁'],'亥':['壬','甲']
  };

  // 节气近似日期表 (月, 日偏移基准)
  var JIEQI_APPROX = {
    '立春': [2, 4],   // 2月3-5日
    '雨水': [2, 19],
    '惊蛰': [3, 6],
    '春分': [3, 21],
    '清明': [4, 5],
    '谷雨': [4, 20],
    '立夏': [5, 6],
    '小满': [5, 21],
    '芒种': [6, 6],
    '夏至': [6, 21],
    '小暑': [7, 7],
    '大暑': [7, 23],
    '立秋': [8, 8],
    '处暑': [8, 23],
    '白露': [9, 8],
    '秋分': [9, 23],
    '寒露': [10, 8],
    '霜降': [10, 23],
    '立冬': [11, 7],
    '小雪': [11, 22],
    '大雪': [12, 7],
    '冬至': [12, 22],
    '小寒': [1, 6],
    '大寒': [1, 20]
  };

  // 农历正月初一查照表 (2024-2030) — 用于精确推算农历日期
  // 数据来源：天文年历，非近似估算
  var LUNAR_NEW_YEAR = {
    2024: [2, 10],   // 甲辰龙年
    2025: [1, 29],   // 乙巳蛇年
    2026: [2, 17],   // 丙午马年
    2027: [2, 6],    // 丁未羊年
    2028: [1, 26],   // 戊申猴年
    2029: [2, 13],   // 己酉鸡年
    2030: [2, 3]     // 庚戌狗年
  };

  // 供品建议
  var OFFERING_SUGGESTIONS = {
    common: ['清香三炷', '鲜花一束', '素果五种(苹果、橘子、香蕉、葡萄、桂圆)', '清茶三杯', '素斋五碟', '红烛一对'],
    caiShen: ['金元宝', '黄水晶聚宝盆', '五色米(白黄红绿黑)', '甜汤圆三碗', '发糕五个'],
    taiSui: ['太岁衣', '太岁金', '平安米', '清酒三杯', '红绳一条'],
    wenChang: ['葱(聪)', '芹菜(勤)', '包子(包中)', '桂花(贵)', '毛笔一枝']
  };

  // 祈福文书模板
  var PRAYER_TEMPLATES = {
    taiSui: '弟子〇〇〇，生于〇〇年〇月〇日，今值〇〇年太岁星君当值，诚心叩拜。祈愿太岁星君护佑，赐弟子一年平安顺遂，消灾解厄，福寿康宁。弟子誓行善事，广结善缘，以报神恩。叩首再拜。',
    caiShen: '弟子〇〇〇，恭迎财神爷降临。今备香花果茶之仪，诚心叩拜。祈愿财神赐福，财源广进，生意兴隆，事业顺遂。弟子当以正道取财，乐善好施，不负神恩。叩首敬拜。',
    wenChang: '弟子〇〇〇，恭拜文昌帝君。祈愿帝君开慧启智，助弟子学业精进，考试顺利，金榜题名。弟子当勤勉不辍，以学问济世，不负帝君之恩。叩首敬拜。',
    general: '弟子〇〇〇，生于〇〇年〇月〇日，今诚心祈福。祈愿〇〇年风调雨顺，国泰民安，弟子及家人平安健康，诸事顺遂。弟子当积德行善，感恩惜福。叩首敬拜。'
  };

  // 生肖年度运势基础文本（再依日主十神关系个性化调整）
  var ZODIAC_YEAR_FORTUNE = {
    0: {keyword: '开拓进取', desc: '子水逢流年，智谋活跃，宜创新求变，注意肾脏健康。'},
    1: {keyword: '稳健积累', desc: '丑土逢流年，踏实勤勉，财运渐旺，宜守不宜攻。'},
    2: {keyword: '奋发有为', desc: '寅木逢流年，魄力十足，事业有突破，注意肝胆。'},
    3: {keyword: '柔和应变', desc: '卯木逢流年，人缘通达，贵人相助，宜以柔克刚。'},
    4: {keyword: '龙腾四海', desc: '辰土逢流年，气势如虹，事业大成，注意情绪管理。'},
    5: {keyword: '蛰伏待机', desc: '巳火逢流年，智慧内蕴，宜谋不宜动，防口舌是非。'},
    6: {keyword: '马到成功', desc: '午火逢流年，精力充沛，事业有成，注意心脏健康。'},
    7: {keyword: '和顺安康', desc: '未土逢流年，性情温和，贵人扶持，宜稳中求进。'},
    8: {keyword: '灵活多变', desc: '申金逢流年，机智灵活，财运亨通，注意呼吸道。'},
    9: {keyword: '精进修为', desc: '酉金逢流年，才华显露，名声有助，注意言行分寸。'},
    10: {keyword: '忠诚守信', desc: '戌土逢流年，忠厚得福，事业稳定，注意肠胃保养。'},
    11: {keyword: '随缘自在', desc: '亥水逢流年，福慧双修，宜静心养性，注意防寒。'}
  };

  // ══════════════════════════════════════════════════════════════
  //  辅助函数
  // ══════════════════════════════════════════════════════════════

  function getYearStemIdx(year) {
    return ((year - 4) % 10 + 10) % 10;
  }

  function getYearBranchIdx(year) {
    return ((year - 4) % 12 + 12) % 12;
  }

  function getYearGanZhi(year) {
    return STEMS[getYearStemIdx(year)] + BRANCHES[getYearBranchIdx(year)];
  }

  // 获取十神
  function getTenGodLocal(yearStem, dayStem) {
    let map = TENGAN_LOCAL[dayStem];
    if (!map) return '';
    for (var rel in map) {
      if (map[rel] === yearStem) return TEN_GOD_NAMES[rel] || rel;
    }
    return '';
  }

  // 获取地支十神
  function getBranchTenGod(yearBranch, dayStem) {
    let canggan = ZHI_CANGGAN_LOCAL[yearBranch] || [];
    if (canggan.length === 0) return '';
    let map = TENGAN_LOCAL[dayStem];
    if (!map) return '';
    let benQi = canggan[0];
    for (var rel in map) {
      if (map[rel] === benQi) return TEN_GOD_NAMES[rel] || rel;
    }
    return '';
  }

  // 长生十二宫
  function getDishiLocal(gan, zhi) {
    let start = CHANGSHENG_START_LOCAL[gan];
    if (!start) return '';
    let forward = (GAN_YINYANG[gan] === '阳');
    let si = BRANCHES.indexOf(start);
    let zi = BRANCHES.indexOf(zhi);
    let step = forward ? ((zi - si + 12) % 12) : ((si - zi + 12) % 12);
    return CS_ORDER[step];
  }

  // 获取节气日期(优先用全局getJieDate,否则用近似表)
  function getJieDateSafe(year, jieName) {
    try {
      if (typeof getJieDate === 'function') {
        let d = getJieDate(year, jieName);
        if (d) return d;
      }
    } catch(e) {}
    let approx = JIEQI_APPROX[jieName];
    if (!approx) return null;
    return new Date(year, approx[0] - 1, approx[1]);
  }

  // 获取农历正月初一
  function getLunarNewYear(year) {
    let data = LUNAR_NEW_YEAR[year];
    if (data) return new Date(year, data[0] - 1, data[1]);
    // 近似: 1月21日到2月21日之间,用公式估算
    var offset = ((year - 4) % 19 + 19) % 19; // 默冬周期近似
    let day = 21 + Math.round(offset * 0.53);
    return new Date(year, 0, day > 31 ? day - 31 : day);
  }

  // 生肖
  function getZodiacByBranchIdx(idx) {
    return ZODIACS[idx] || '';
  }

  // 格式化日期
  function formatDate(d) {
    if (!d) return '';
    return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日';
  }

  // 计算两日期相差天数
  function daysBetween(d1, d2) {
    return Math.round((d2.getTime() - d1.getTime()) / 86400000);
  }

  // ══════════════════════════════════════════════════════════════
  //  太岁信息
  // ══════════════════════════════════════════════════════════════

  function getTaisuiInfo(birthBranchIdx, yearBranchIdx) {
    try {
      let diff = (birthBranchIdx - yearBranchIdx + 12) % 12;
      const relations = [];
      const solutions = [];

      // 值太岁
      if (birthBranchIdx === yearBranchIdx) {
        relations.push('值太岁(本命年)');
        solutions.push('请太岁符佩戴或安奉于太岁方');
        solutions.push('年初到道观拜太岁(正月初八或立春日)');
        solutions.push('穿红色内衣裤、系红腰带(本命年习俗)');
        solutions.push('避免参加白事、探病');
        solutions.push('可佩戴三合或六合生肖饰品化解');
      }

      // 冲太岁(差6)
      if (diff === 6) {
        relations.push('冲太岁');
        solutions.push('避免重大决策(结婚、搬家、创业)');
        solutions.push('佩戴相合生肖饰品化解');
        solutions.push('年初拜太岁求平安');
        solutions.push('多行善事积德');
        solutions.push('避免在太岁方长期逗留');
      }

      // 害太岁
      for (var i = 0; i < HAI_PAIRS.length; i++) {
        if (HAI_PAIRS[i][0] === birthBranchIdx && HAI_PAIRS[i][1] === yearBranchIdx) {
          relations.push('害太岁');
          solutions.push('谨言慎行，防小人暗算');
          solutions.push('佩戴六合生肖饰品');
          solutions.push('避免与人合作投资');
          solutions.push('年初拜太岁祈福');
          break;
        }
      }

      // 刑太岁
      for (var g = 0; g < XING_GROUPS.length; g++) {
        let group = XING_GROUPS[g];
        if (group.indexOf(birthBranchIdx) >= 0 && group.indexOf(yearBranchIdx) >= 0 && birthBranchIdx !== yearBranchIdx) {
          relations.push('刑太岁');
          solutions.push('修身养性，遵纪守法');
          solutions.push('避免口舌争执');
          solutions.push('可佩戴相合生肖饰品');
          solutions.push('多行善事化解刑伤');
          break;
        }
        // 自刑
        if (group.length === 2 && group[0] === birthBranchIdx && group[1] === yearBranchIdx && birthBranchIdx === yearBranchIdx) {
          relations.push('刑太岁(自刑)');
          solutions.push('控制情绪，避免内耗');
          solutions.push('修身养性，多读书静坐');
          solutions.push('佩戴相合生肖饰品');
          break;
        }
      }

      // 破太岁
      for (var j = 0; j < PO_PAIRS.length; j++) {
        if (PO_PAIRS[j][0] === birthBranchIdx && PO_PAIRS[j][1] === yearBranchIdx) {
          relations.push('破太岁');
          solutions.push('谨慎理财，防破财');
          solutions.push('避免借贷担保');
          solutions.push('佩戴相合生肖饰品');
          solutions.push('拜太岁祈求平安');
          break;
        }
      }

      if (relations.length === 0) {
        relations.push('无犯太岁');
        solutions.push('年初可拜太岁祈福');
        solutions.push('太岁方不宜动土');
        solutions.push('保持善念，岁岁平安');
      }

      let taisuiDirection = BRANCH_DIRECTIONS[yearBranchIdx];
      let taisuiZodiac = getZodiacByBranchIdx(yearBranchIdx);
      let birthZodiac = getZodiacByBranchIdx(birthBranchIdx);

      return {
        birthBranchIdx: birthBranchIdx,
        yearBranchIdx: yearBranchIdx,
        birthZodiac: birthZodiac,
        taisuiZodiac: taisuiZodiac,
        taisuiDirection: taisuiDirection,
        relations: relations,
        solutions: solutions,
        hasOffense: relations.indexOf('无犯太岁') < 0
      };
    } catch(e) {
      return {error: '太岁信息计算出错: ' + e.message};
    }
  }

  // ══════════════════════════════════════════════════════════════
  //  流年吉位
  // ══════════════════════════════════════════════════════════════

  function getAuspiciousDirections(yearStemIdx) {
    try {
      let dirs = YEAR_STEM_DIRECTIONS[yearStemIdx];
      if (!dirs) return {error: '无法获取吉位'};
      return {
        caiShen: dirs.cai,
        xiShen: dirs.xi,
        guiShen: dirs.gui,
        wenChang: dirs.wenchang
      };
    } catch(e) {
      return {error: '吉位计算出错: ' + e.message};
    }
  }

  // ══════════════════════════════════════════════════════════════
  //  祈福吉日
  // ══════════════════════════════════════════════════════════════

  function getWorshipDates(targetYear) {
    try {
      const dates = [];
      let lichun = getJieDateSafe(targetYear, '立春');
      if (lichun) {
        dates.push({
          name: '立春',
          date: lichun,
          desc: '二十四节气之首，万物复苏。立春拜太岁最为灵验，宜在立春当日辰时(7-9点)面向太岁方焚香祝祷。',
          priority: 'high'
        });
      }

      let newYear = getLunarNewYear(targetYear);
      dates.push({
        name: '正月初一(春节)',
        date: newYear,
        desc: '农历新年第一天，万象更新。宜子时(23:00-1:00)焚香开门迎新年，辰时拜神佛、拜长辈。此日忌杀生、忌扫地。',
        priority: 'high'
      });

      // 初五迎财神
      let day5 = new Date(newYear.getTime() + 4 * 86400000);
      dates.push({
        name: '正月初五(迎财神)',
        date: day5,
        desc: '俗称"破五"，宜零点焚香、放鞭炮迎财神。当日辰时面向财神方位焚金元宝、烧金纸，供奉甜汤圆、发糕。',
        priority: 'high'
      });

      // 初九拜天公
      let day9 = new Date(newYear.getTime() + 8 * 86400000);
      dates.push({
        name: '正月初九(拜天公)',
        date: day9,
        desc: '玉皇大帝诞辰。宜子时(前一日23:00)设香案，供五果六斋、红龟粿、发糕，焚天公金，祈求一年风调雨顺。',
        priority: 'medium'
      });

      // 十五元宵
      let day15 = new Date(newYear.getTime() + 14 * 86400000);
      dates.push({
        name: '正月十五(元宵节)',
        date: day15,
        desc: '上元节，天官赐福。宜燃灯供佛、吃汤圆、猜灯谜。此日也是天官大帝诞辰，宜祈福、消灾、解厄。',
        priority: 'medium'
      });

      // 二月二龙抬头（农历二月初二）
      // 依农历正月初一推算：农历正月大月30天/小月29天，二月初二 = 正月初一 + 30或31天
      // 此处用30天近似（多数年份正月为大月），再加1天到初二
      var longTai = new Date(newYear.getTime() + 31 * 86400000); // 农历二月初二
      dates.push({
        name: '二月二(龙抬头)',
        date: longTai,
        desc: '青龙七星出现在东方，万物生机盎然。宜理发(剃龙头)、吃龙须面、龙眼(桂圆)。此日祈求一年精神饱满、事业腾飞。',
        priority: 'medium'
      });

      // 腊月二十三(祭灶)
      let nextYearLunar = getLunarNewYear(targetYear + 1);
      let jiZao = new Date(nextYearLunar.getTime() - 7 * 86400000);
      dates.push({
        name: '腊月二十三(祭灶)',
        date: jiZao,
        desc: '俗称"小年"。祭灶王爷，供糖瓜(麦芽糖)、灶糖，焚灶王马，送灶神上天言好事。除夕再迎灶神回宅。',
        priority: 'medium'
      });

      // 除夕
      let chuXi = new Date(nextYearLunar.getTime() - 1 * 86400000);
      dates.push({
        name: '除夕(大年三十)',
        date: chuXi,
        desc: '一年终了，辞旧迎新。宜贴春联、挂灯笼、祭祖、吃团圆饭。子时焚香开门迎新年。',
        priority: 'high'
      });

      return dates;
    } catch(e) {
      return [{name: '日期计算出错', date: null, desc: e.message, priority: 'error'}];
    }
  }

  // ══════════════════════════════════════════════════════════════
  //  判断是否在跨年期
  // ══════════════════════════════════════════════════════════════

  function isYearTransitionPeriod() {
    try {
      let now = new Date();
      let year = now.getFullYear();
      let lichun = getJieDateSafe(year, '立春');
      if (!lichun) return false;

      // 腊月(农历十二月)开始到立春前
      // 近似: 立春前45天到立春日
      let startDate = new Date(lichun.getTime() - 45 * 86400000);
      return now >= startDate && now < lichun;
    } catch(e) {
      return false;
    }
  }

  // ══════════════════════════════════════════════════════════════
  //  HTML 生成辅助
  // ══════════════════════════════════════════════════════════════

  function card(title, content) {
    return '<div style="margin:16px 0;border:1px solid var(--border);border-radius:12px;overflow:hidden">' +
      '<div style="background:var(--title);color:#fff;padding:10px 16px;font-weight:600">' + title + '</div>' +
      '<div style="padding:12px">' + content + '</div>' +
      '</div>';
  }

  function infoRow(label, value) {
    return '<div style="display:flex;padding:4px 0;border-bottom:1px solid rgba(201,168,76,.06)">' +
      '<span style="min-width:90px;opacity:.5;font-size:13px">' + label + '</span>' +
      '<span style="flex:1;font-size:13px">' + value + '</span></div>';
  }

  function tag(text, color) {
    let bg = color || 'rgba(201,168,76,.15)';
    return '<span style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:11px;background:' + bg + ';color:var(--gold);margin:2px 4px 2px 0">' + text + '</span>';
  }

  // ══════════════════════════════════════════════════════════════
  //  跨年祈福参拜指南
  // ══════════════════════════════════════════════════════════════

  function generateWorshipGuide(birthInfo, targetYear) {
    try {
      targetYear = targetYear || new Date().getFullYear();
      let yearStemIdx = getYearStemIdx(targetYear);
      let yearBranchIdx = getYearBranchIdx(targetYear);
      let yearGanZhi = getYearGanZhi(targetYear);
      const html = '';

      // 标题
      html += '<div style="text-align:center;margin-bottom:20px">' +
        '<div style="font-size:22px;font-weight:700;color:var(--gold);letter-spacing:4px">' + targetYear + '年 ' + yearGanZhi + '年 祈福参拜指南</div>' +
        '<div style="font-size:13px;opacity:.5;margin-top:6px">太岁星君：' + getZodiacByBranchIdx(yearBranchIdx) + '太岁 · 太岁方位：' + BRANCH_DIRECTIONS[yearBranchIdx] + '</div>' +
        '</div>';

      // 1. 太岁方位与化解
      let tsInfo = getTaisuiInfo(birthInfo.stemIdx !== undefined ? birthInfo.stemIdx : 0, yearBranchIdx);
      // birthInfo中的birthBranchIdx
      let birthBranchIdx = birthInfo.yearBranchIdx !== undefined ? birthInfo.yearBranchIdx : 0;
      tsInfo = getTaisuiInfo(birthBranchIdx, yearBranchIdx);

      const taisuiContent = '';
      taisuiContent += infoRow('缘主生肖', getZodiacByBranchIdx(birthBranchIdx));
      taisuiContent += infoRow('当年太岁', tsInfo.taisuiZodiac + '太岁(' + yearGanZhi + '年)');
      taisuiContent += infoRow('太岁方位', tsInfo.taisuiDirection);
      taisuiContent += infoRow('太岁关系', tsInfo.relations.map(function(r){return tag(r, r.indexOf('无')>=0?'rgba(46,204,113,.15)':'rgba(231,76,60,.15)');}).join(' '));

      if (tsInfo.solutions.length > 0) {
        taisuiContent += '<div style="margin-top:10px;padding:10px;background:rgba(231,76,60,.05);border-radius:8px;border-left:3px solid var(--cinn)">' +
          '<div style="font-size:12px;font-weight:600;margin-bottom:6px">🛡️ 化解建议</div>';
        for (var s = 0; s < tsInfo.solutions.length; s++) {
          taisuiContent += '<div style="font-size:12px;padding:2px 0;opacity:.8">' + (s+1) + '. ' + tsInfo.solutions[s] + '</div>';
        }
        taisuiContent += '</div>';
      }
      html += card('🛡️ 太岁方位与化解', taisuiContent);

      // 2. 流年吉位
      let dirs = getAuspiciousDirections(yearStemIdx);
      const dirContent = '';
      if (dirs.error) {
        dirContent = '<div style="color:var(--danger);font-size:13px">' + dirs.error + '</div>';
      } else {
        dirContent += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
        dirContent += '<div style="padding:10px;background:rgba(201,168,76,.06);border-radius:8px;text-align:center">' +
          '<div style="font-size:20px">💰</div><div style="font-size:11px;opacity:.5;margin-top:4px">财神位</div><div style="font-size:14px;font-weight:600;color:var(--gold)">' + dirs.caiShen + '</div></div>';
        dirContent += '<div style="padding:10px;background:rgba(231,76,60,.06);border-radius:8px;text-align:center">' +
          '<div style="font-size:20px">💕</div><div style="font-size:11px;opacity:.5;margin-top:4px">喜神位</div><div style="font-size:14px;font-weight:600;color:var(--cinn2)">' + dirs.xiShen + '</div></div>';
        dirContent += '<div style="padding:10px;background:rgba(46,204,113,.06);border-radius:8px;text-align:center">' +
          '<div style="font-size:20px">🙏</div><div style="font-size:11px;opacity:.5;margin-top:4px">贵神位</div><div style="font-size:14px;font-weight:600;color:var(--jade)">' + dirs.guiShen + '</div></div>';
        dirContent += '<div style="padding:10px;background:rgba(142,68,173,.06);border-radius:8px;text-align:center">' +
          '<div style="font-size:20px">📚</div><div style="font-size:11px;opacity:.5;margin-top:4px">文昌位</div><div style="font-size:14px;font-weight:600;color:var(--violet2)">' + dirs.wenChang + '</div></div>';
        dirContent += '</div>';

        dirContent += '<div style="margin-top:10px;font-size:12px;opacity:.6;line-height:1.8">' +
          '参拜顺序：先拜太岁方 → 再拜财神方 → 喜神方 → 贵神方 → 文昌方。每个方位焚香三炷，叩首三拜。</div>';
      }
      html += card('🧭 流年吉位', dirContent);

      // 3. 祈福吉日
      let dates = getWorshipDates(targetYear);
      const dateContent = '';
      for (var d = 0; d < dates.length; d++) {
        let dt = dates[d];
        let priorityColor = dt.priority === 'high' ? 'var(--cinn2)' : (dt.priority === 'medium' ? 'var(--gold)' : 'var(--danger)');
        dateContent += '<div style="padding:8px 0;border-bottom:1px solid rgba(201,168,76,.06)">' +
          '<div style="display:flex;align-items:center;gap:8px">' +
          '<span style="font-weight:600;color:' + priorityColor + ';font-size:13px">' + dt.name + '</span>' +
          (dt.date ? '<span style="font-size:11px;opacity:.4">' + formatDate(dt.date) + '</span>' : '') +
          '</div>' +
          '<div style="font-size:12px;opacity:.6;margin-top:4px;line-height:1.6">' + dt.desc + '</div>' +
          '</div>';
      }
      html += card('📅 祈福吉日', dateContent);

      // 4. 参拜指南
      const worshipContent = '';
      worshipContent += '<div style="font-size:13px;line-height:2">';
      worshipContent += '<div style="font-weight:600;color:var(--gold);margin-bottom:6px">参拜前准备</div>';
      worshipContent += '1. 沐浴更衣，着整洁衣物，忌穿黑色<br>';
      worshipContent += '2. 准备香烛、供品、金纸<br>';
      worshipContent += '3. 心诚则灵，参拜时默念姓名、生辰、住址<br>';
      worshipContent += '4. 参拜顺序：太岁 → 财神 → 喜神 → 贵神 → 文昌<br><br>';

      worshipContent += '<div style="font-weight:600;color:var(--gold);margin-bottom:6px">参拜步骤</div>';
      worshipContent += '1. 上香三炷(左手插香，先中间、再右、后左)<br>';
      worshipContent += '2. 跪拜三叩首<br>';
      worshipContent += '3. 默念祈福文(见下方模板)<br>';
      worshipContent += '4. 焚金纸、化太岁衣<br>';
      worshipContent += '5. 礼拜三拜后退三步，转身离开<br><br>';
      worshipContent += '</div>';

      // 供品建议
      worshipContent += '<div style="font-weight:600;color:var(--gold);margin-bottom:6px;font-size:13px">供品建议</div>';
      worshipContent += '<div style="font-size:12px;opacity:.7;margin-bottom:6px">通用供品：' + OFFERING_SUGGESTIONS.common.join('、') + '</div>';
      worshipContent += '<div style="font-size:12px;opacity:.7;margin-bottom:6px">拜太岁供品：' + OFFERING_SUGGESTIONS.taiSui.join('、') + '</div>';
      worshipContent += '<div style="font-size:12px;opacity:.7;margin-bottom:6px">迎财神供品：' + OFFERING_SUGGESTIONS.caiShen.join('、') + '</div>';
      worshipContent += '<div style="font-size:12px;opacity:.7;margin-bottom:6px">拜文昌供品：' + OFFERING_SUGGESTIONS.wenChang.join('、') + '</div>';

      html += card('🙏 参拜指南', worshipContent);

      // 5. 祈福文书模板
      const prayerContent = '';
      var prayers = [
        {title: '拜太岁祈福文', text: PRAYER_TEMPLATES.taiSui},
        {title: '迎财神祈福文', text: PRAYER_TEMPLATES.caiShen},
        {title: '拜文昌祈福文', text: PRAYER_TEMPLATES.wenChang},
        {title: '通用祈福文', text: PRAYER_TEMPLATES.general}
      ];
      for (var p = 0; p < prayers.length; p++) {
        prayerContent += '<div style="margin-bottom:12px;padding:10px;background:rgba(255,255,255,.03);border-radius:8px">' +
          '<div style="font-size:12px;font-weight:600;color:var(--gold);margin-bottom:4px">' + prayers[p].title + '</div>' +
          '<div style="font-size:12px;opacity:.6;line-height:1.8;font-family:var(--font-serif)">' + prayers[p].text + '</div></div>';
      }
      html += card('📜 祈福文书模板', prayerContent);

      // 6. 化煞物品清单(按生肖和八字用神)
      const itemContent = '';
      let birthZodiac = getZodiacByBranchIdx(birthBranchIdx);
      let xiEle = birthInfo.xiEle || '未知';

      itemContent += '<div style="margin-bottom:10px">';
      itemContent += '<div style="font-size:13px;margin-bottom:6px">缘主生肖：<strong>' + birthZodiac + '</strong> · 喜用神：<strong>' + xiEle + '</strong></div>';
      itemContent += '</div>';

      // 按太岁关系推荐
      if (tsInfo.hasOffense) {
        itemContent += '<div style="padding:8px;background:rgba(231,76,60,.05);border-radius:8px;margin-bottom:8px">';
        itemContent += '<div style="font-size:12px;font-weight:600;color:var(--cinn2)">⚠️ 犯太岁化煞物品</div>';
        itemContent += '<div style="font-size:12px;opacity:.7;margin-top:4px">• 太岁符(随身佩戴)<br>• 六合生肖玉坠<br>• 三合生肖手链<br>• 黑曜石葫芦(化煞辟邪)<br>• 五帝钱(挂门后化太岁)</div>';
        itemContent += '</div>';
      }

      // 按喜用神推荐
      var eleItems = {
        '木': ['绿幽灵水晶', '翡翠玉器', '绿色植物', '木质佛珠', '檀香'],
        '火': ['红玛瑙', '紫水晶', '红色中国结', '朱砂饰品', '红绳'],
        '土': ['黄水晶', '陶瓷聚宝盆', '蜜蜡琥珀', '和田玉', '黄玉'],
        '金': ['白水晶', '铜葫芦', '金银饰品', '金属风铃', '铜钱'],
        '水': ['黑曜石', '蓝水晶', '海蓝宝', '蓝色黑曜石', '水晶球']
      };
      let items = eleItems[xiEle] || [];
      if (items.length > 0) {
        itemContent += '<div style="padding:8px;background:rgba(46,204,113,.05);border-radius:8px;margin-bottom:8px">';
        itemContent += '<div style="font-size:12px;font-weight:600;color:var(--jade)">🌿 喜用神(' + xiEle + ')补益物品</div>';
        itemContent += '<div style="font-size:12px;opacity:.7;margin-top:4px">• ' + items.join('<br>• ') + '</div>';
        itemContent += '</div>';
      }

      // 通用化煞物品
      itemContent += '<div style="padding:8px;background:rgba(201,168,76,.05);border-radius:8px">';
      itemContent += '<div style="font-size:12px;font-weight:600;color:var(--gold)">🔮 通用化煞物品</div>';
      itemContent += '<div style="font-size:12px;opacity:.7;margin-top:4px">• 葫芦(化病化煞)<br>• 八卦镜(挂门楣化煞)<br>• 麒麟(镇宅招财)<br>• 貔貅(招财辟邪)<br>• 山海镇(化各种形煞)</div>';
      itemContent += '</div>';

      html += card('🧿 化煞物品清单', itemContent);

      return html;
    } catch(e) {
      return card('⚠️ 出错', '<div style="color:var(--danger)">生成祈福参拜指南时出错: ' + e.message + '</div>');
    }
  }

  // ══════════════════════════════════════════════════════════════
  //  年后运势指导
  // ══════════════════════════════════════════════════════════════

  function generateYearlyGuidance(birthInfo, targetYear) {
    try {
      targetYear = targetYear || new Date().getFullYear();
      let yearStemIdx = getYearStemIdx(targetYear);
      let yearBranchIdx = getYearBranchIdx(targetYear);
      let yearStem = STEMS[yearStemIdx];
      let yearBranch = BRANCHES[yearBranchIdx];
      let yearGanZhi = yearStem + yearBranch;
      let dayStem = STEMS[birthInfo.stemIdx] || STEMS[0];
      const html = '';

      // 标题
      html += '<div style="text-align:center;margin-bottom:20px">' +
        '<div style="font-size:22px;font-weight:700;color:var(--gold);letter-spacing:4px">' + targetYear + '年 ' + yearGanZhi + '年 运势指导</div>' +
        '<div style="font-size:13px;opacity:.5;margin-top:6px">日主：' + dayStem + '(' + ELE[dayStem] + ') · 流年天干：' + yearStem + '(' + ELE[yearStem] + ')</div>' +
        '</div>';

      // 1. 流年总运
      let ganShen = getTenGodLocal(yearStem, dayStem);
      let zhiShen = getBranchTenGod(yearBranch, dayStem);
      let dishi = getDishiLocal(dayStem, yearBranch);
      let yearEle = ELE[yearStem];
      let yearZhiEle = ZHI_ELE[yearBranch];
      let dayEle = ELE[dayStem];

      // 五行生克关系
      var relMap = {
        '木': {金:'克我(官杀)',火:'我生(食伤)',水:'生我(印星)',木:'同我(比劫)',土:'我克(财星)'},
        '火': {木:'生我(印星)',土:'我生(食伤)',金:'我克(财星)',火:'同我(比劫)',水:'克我(官杀)'},
        '土': {火:'生我(印星)',金:'我生(食伤)',木:'克我(官杀)',土:'同我(比劫)',水:'我克(财星)'},
        '金': {土:'生我(印星)',水:'我生(食伤)',火:'克我(官杀)',金:'同我(比劫)',木:'我克(财星)'},
        '水': {金:'生我(印星)',木:'我生(食伤)',土:'克我(官杀)',水:'同我(比劫)',火:'我克(财星)'}
      };
      let ganRel = (relMap[dayEle] && relMap[dayEle][yearEle]) || '';
      let zhiRel = (relMap[dayEle] && relMap[dayEle][yearZhiEle]) || '';

      const totalContent = '';
      totalContent += infoRow('流年干支', yearGanZhi);
      totalContent += infoRow('流年天干', yearStem + '(' + yearEle + ') · ' + ganShen + ' · ' + ganRel);
      totalContent += infoRow('流年地支', yearBranch + '(' + yearZhiEle + ') · ' + zhiShen + ' · ' + zhiRel);
      totalContent += infoRow('长生十二宫', dishi);
      totalContent += infoRow('太岁关系', getTaisuiInfo(birthInfo.yearBranchIdx || 0, yearBranchIdx).relations.join('、'));

      // 总运评语
      const overall = '';
      let xiEle = birthInfo.xiEle || '';
      if (yearEle === xiEle || yearZhiEle === xiEle) {
        overall = '流年五行与喜用神相合，今年为顺遂之年，宜把握机遇、主动出击。';
      } else if (yearEle === birthInfo.jiEle || yearZhiEle === birthInfo.jiEle) {
        overall = '流年五行与忌神相合，今年需谨慎行事、保守为上，注意健康和人际关系。';
      } else {
        overall = '流年五行中性，运势平稳，宜稳中求进，不可冒进亦不必过于保守。';
      }
      totalContent += '<div style="margin-top:10px;padding:10px;background:rgba(201,168,76,.06);border-radius:8px;font-size:13px;line-height:1.8">' + overall + '</div>';

      html += card('🌟 流年总运', totalContent);

      // 2. 十二生肖运势（结合用户日主十神个性化）
      const zodiacContent = '';
      // 用户出生地支索引
      let userBranchIdx = birthInfo.yearBranchIdx || 0;
      let userZodiacLabel = ZODIACS[userBranchIdx];
      // 标注用户生肖
      for (var z = 0; z < 12; z++) {
        let tsInfo = getTaisuiInfo(z, yearBranchIdx);
        let fortune = ZODIAC_YEAR_FORTUNE[z] || {keyword:'', desc:''};
        // 依日主与该生肖地支的十神关系个性化补充
        let zBranch = BRANCHES[z];
        let zEle = ZHI_ELE[zBranch];
        let zShen = getBranchTenGod(zBranch, dayStem);
        let personalized = fortune.desc;
        if (z === userBranchIdx) {
          personalized += ' （此为您的生肖，' + (tsInfo.hasOffense ? '今年犯太岁需特别注意' : '今年太岁关系平稳') + '）';
        }
        if (zShen) {
          personalized += ' 对您而言为' + zShen + '之年，';
          if (zShen === '正财' || zShen === '偏财') personalized += '利求财；';
          else if (zShen === '正官' || zShen === '七杀') personalized += '利事业但需防压力；';
          else if (zShen === '正印' || zShen === '偏印') personalized += '利学业贵人；';
          else if (zShen === '比肩' || zShen === '劫财') personalized += '利合作但防破财；';
          else if (zShen === '食神' || zShen === '伤官') personalized += '利创作表现；';
        }
        let zodiacColor = tsInfo.hasOffense ? 'var(--cinn2)' : 'var(--gold)';
        let bg = tsInfo.hasOffense ? 'rgba(231,76,60,.04)' : 'rgba(201,168,76,.04)';
        let isUser = (z === userBranchIdx);

        zodiacContent += '<div style="padding:8px;margin-bottom:6px;background:' + bg + ';border-radius:8px;border-left:3px solid ' + zodiacColor + (isUser ? ';box-shadow:0 0 0 2px var(--gold) inset' : '') + '">';
        zodiacContent += '<div style="display:flex;justify-content:space-between;align-items:center">';
        zodiacContent += '<span style="font-weight:600;font-size:13px;color:' + zodiacColor + '">' + ZODIACS[z] + (isUser ? ' ★' : '') + '</span>';
        zodiacContent += '<span style="font-size:11px;opacity:.4">' + tsInfo.relations.join('、') + '</span>';
        zodiacContent += '</div>';
        zodiacContent += '<div style="font-size:12px;opacity:.6;margin-top:4px;line-height:1.6">' + personalized + '</div>';
        zodiacContent += '</div>';
      }
      html += card('🐃 十二生肖运势', zodiacContent);

      // 3. 逐月运势
      const monthContent = '';
      var monthBranches = ['寅','卯','辰','巳','午','未','申','酉','戌','亥','子','丑']; // 正月到十二月
      const monthNames = ['正月(寅)', '二月(卯)', '三月(辰)', '四月(巳)', '五月(午)', '六月(未)', '七月(申)', '八月(酉)', '九月(戌)', '十月(亥)', '冬月(子)', '腊月(丑)'];

      for (var m = 0; m < 12; m++) {
        let mBranch = monthBranches[m];
        let mZhiEle = ZHI_ELE[mBranch];
        let mShen = getBranchTenGod(mBranch, dayStem);
        let mDishi = getDishiLocal(dayStem, mBranch);

        // 判断是否冲太岁月或犯太岁月
        let mBranchIdx = BRANCHES.indexOf(mBranch);
        let isChong = (Math.abs(mBranchIdx - yearBranchIdx) === 6);
        let isZhi = (mBranchIdx === yearBranchIdx);

        const alertTag = '';
        const alertBg = '';
        if (isChong) {
          alertTag = tag('⚠️ 冲太岁月', 'rgba(231,76,60,.15)');
          alertBg = 'rgba(231,76,60,.04)';
        } else if (isZhi) {
          alertTag = tag('⚠️ 值太岁月', 'rgba(231,76,60,.1)');
          alertBg = 'rgba(231,76,60,.02)';
        } else if (yearEle === xiEle || mZhiEle === xiEle) {
          alertTag = tag('✨ 吉月', 'rgba(46,204,113,.15)');
          alertBg = 'rgba(46,204,113,.03)';
        }

        // 月运建议
        const monthAdvice = '';
        let mRel = (relMap[dayEle] && relMap[dayEle][mZhiEle]) || '';
        if (mZhiEle === xiEle) {
          monthAdvice = '此月五行' + mZhiEle + '与喜用神相合，运势较好，宜进取。';
        } else if (mZhiEle === (birthInfo.jiEle || '')) {
          monthAdvice = '此月五行' + mZhiEle + '与忌神相合，需谨慎行事。';
        } else {
          monthAdvice = '此月五行' + mZhiEle + '，' + mRel + '，运势平稳。';
        }
        if (isChong) monthAdvice += '冲太岁月变动较大，避免重大决策。';
        if (isZhi) monthAdvice += '值太岁月压力较大，注意身体和情绪。';

        monthContent += '<div style="padding:8px;margin-bottom:6px;background:' + (alertBg || 'rgba(255,255,255,.02)') + ';border-radius:8px">';
        monthContent += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">';
        monthContent += '<span style="font-size:13px;font-weight:600">' + monthNames[m] + '</span>';
        monthContent += '<span style="font-size:11px;opacity:.4">' + mShen + ' · ' + mDishi + ' · ' + mZhiEle + '</span>';
        monthContent += '</div>';
        monthContent += '<div style="margin-bottom:4px">' + alertTag + '</div>';
        monthContent += '<div style="font-size:12px;opacity:.6;line-height:1.6">' + monthAdvice + '</div>';
        monthContent += '</div>';
      }
      html += card('📆 逐月运势', monthContent);

      // 4. 财神方位(按月)
      const caiContent = '';
      // 月干推算: 年干×2+月支序号(寅=1)
      for (var cm = 0; cm < 12; cm++) {
        let cmBranch = monthBranches[cm];
        let cmBranchIdx = BRANCHES.indexOf(cmBranch);
        // 月干: (年干Index*2 + cmBranchIdx) % 10, 但寅月=1月
        // 正确: (yearStemIdx*2 + cmBranchIdx + 2) % 10
        let cmStemIdx = (yearStemIdx * 2 + cmBranchIdx + 2) % 10;
        let cmDirs = YEAR_STEM_DIRECTIONS[cmStemIdx] || {};
        caiContent += '<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(201,168,76,.06);font-size:12px">' +
          '<span>' + monthNames[cm] + '</span>' +
          '<span style="opacity:.6">' + STEMS[cmStemIdx] + cmBranch + '月 · 财神位：' + (cmDirs.cai || '—') + '</span>' +
          '</div>';
      }
      html += card('💰 逐月财神方位', caiContent);

      // 5. 重点月份预警
      const alertContent = '';
      const hasAlert = false;

      for (var am = 0; am < 12; am++) {
        let aBranchIdx = BRANCHES.indexOf(monthBranches[am]);
        let aIsChong = (Math.abs(aBranchIdx - yearBranchIdx) === 6);
        let aIsZhi = (aBranchIdx === yearBranchIdx);

        // 害月
        const aIsHai = false;
        for (var ah = 0; ah < HAI_PAIRS.length; ah++) {
          if (HAI_PAIRS[ah][0] === aBranchIdx && HAI_PAIRS[ah][1] === yearBranchIdx) { aIsHai = true; break; }
        }

        // 刑月
        const aIsXing = false;
        for (var ax = 0; ax < XING_GROUPS.length; ax++) {
          let ag = XING_GROUPS[ax];
          if (ag.indexOf(aBranchIdx) >= 0 && ag.indexOf(yearBranchIdx) >= 0 && aBranchIdx !== yearBranchIdx) { aIsXing = true; break; }
        }

        if (aIsChong || aIsZhi || aIsHai || aIsXing) {
          hasAlert = true;
          const alerts = [];
          if (aIsZhi) alerts.push('值太岁月');
          if (aIsChong) alerts.push('冲太岁月');
          if (aIsHai) alerts.push('害太岁月');
          if (aIsXing) alerts.push('刑太岁月');

          alertContent += '<div style="padding:8px;margin-bottom:6px;background:rgba(231,76,60,.05);border-radius:8px;border-left:3px solid var(--cinn)">' +
            '<div style="display:flex;justify-content:space-between;align-items:center">' +
            '<span style="font-size:13px;font-weight:600;color:var(--cinn2)">' + monthNames[am] + '</span>' +
            '<span>' + alerts.map(function(a){return tag(a, 'rgba(231,76,60,.15)');}).join('') + '</span>' +
            '</div>' +
            '<div style="font-size:12px;opacity:.6;margin-top:4px;line-height:1.6">此月犯太岁，需特别注意：避免重大决策、投资、搬家；谨慎出行；多行善事；可佩戴相合生肖饰品化解。</div>' +
            '</div>';
        }
      }

      if (!hasAlert) {
        alertContent = '<div style="text-align:center;padding:20px;opacity:.5;font-size:13px">今年无重点预警月份，但仍需谨慎行事，不可掉以轻心。</div>';
      }

      html += card('🚨 重点月份预警', alertContent);

      return html;
    } catch(e) {
      return card('⚠️ 出错', '<div style="color:var(--danger)">生成年度运势指导时出错: ' + e.message + '</div>');
    }
  }

  // ══════════════════════════════════════════════════════════════
  //  完整年度运势报告
  // ══════════════════════════════════════════════════════════════

  function generateAnnualReport(birthInfo, targetYear) {
    try {
      targetYear = targetYear || new Date().getFullYear();
      const html = '';
      let isTransition = isYearTransitionPeriod();

      // 报告标题
      html += '<div style="text-align:center;margin-bottom:24px;padding:20px;background:rgba(201,168,76,.04);border-radius:16px">' +
        '<div style="font-size:24px;font-weight:700;color:var(--gold);letter-spacing:6px">' + targetYear + '年年度运势报告</div>' +
        '<div style="font-size:13px;opacity:.5;margin-top:8px">日主：' + (STEMS[birthInfo.stemIdx] || '—') + ' · 喜用：' + (birthInfo.xiEle || '—') + '</div>' +
        '</div>';

      // 根据时期决定生成内容
      if (isTransition) {
        // 跨年期：生成祈福参拜指南 + 年度运势指导
        html += generateWorshipGuide(birthInfo, targetYear);
        html += '<div style="margin:24px 0;text-align:center;opacity:.3;font-size:12px">——— 以上为祈福参拜指南 ———</div>';
        html += generateYearlyGuidance(birthInfo, targetYear);
      } else {
        // 非跨年期：生成年度运势指导
        html += generateYearlyGuidance(birthInfo, targetYear);

        // 附带祈福参拜指南(折叠)
        html += '<details style="margin:16px 0;border:1px solid var(--border);border-radius:12px;overflow:hidden">' +
          '<summary style="background:var(--title);color:#fff;padding:10px 16px;font-weight:600;cursor:pointer;font-size:14px">🙏 查看祈福参拜指南(点击展开)</summary>' +
          '<div style="padding:12px">' + generateWorshipGuide(birthInfo, targetYear) + '</div>' +
          '</details>';
      }

      // 免责声明
      html += '<div style="margin:20px 0;padding:12px;background:rgba(255,255,255,.02);border-radius:8px;text-align:center;font-size:11px;opacity:.3;line-height:1.6">' +
        '本报告基于传统命理学推算，仅供参考娱乐，不构成任何决策建议。命由己造，福自己求，行善积德方为改命之本。<br>' +
        '生成时间：' + formatDate(new Date()) +
        '</div>';

      return html;
    } catch(e) {
      return card('⚠️ 出错', '<div style="color:var(--danger)">生成年度运势报告时出错: ' + e.message + '</div>');
    }
  }

  // ══════════════════════════════════════════════════════════════
  //  导出到 window
  // ══════════════════════════════════════════════════════════════

  window.AnnualFortune = {
    generateAnnualReport: generateAnnualReport,
    isYearTransitionPeriod: isYearTransitionPeriod,
    generateWorshipGuide: generateWorshipGuide,
    generateYearlyGuidance: generateYearlyGuidance,
    getTaisuiInfo: getTaisuiInfo,
    getAuspiciousDirections: getAuspiciousDirections,
    getWorshipDates: getWorshipDates,
    // 辅助函数(便于测试)
    _getYearStemIdx: getYearStemIdx,
    _getYearBranchIdx: getYearBranchIdx,
    _getYearGanZhi: getYearGanZhi,
    _getTenGod: getTenGodLocal,
    _getBranchTenGod: getBranchTenGod,
    _getDishi: getDishiLocal,
    _getJieDate: getJieDateSafe,
    _getLunarNewYear: getLunarNewYear,
    _formatDate: formatDate,
    _card: card,
    _infoRow: infoRow,
    _tag: tag
  };

})();
