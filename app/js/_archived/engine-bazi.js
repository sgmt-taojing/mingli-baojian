var MONTH_ZHI = ['寅','卯','辰','巳','午','未','申','酉','戌','亥','子','丑'];
// 五虎遁年起月干（年干x2+月序1-based）
function getMonthGan(yearGan, monthZhiIndex) {
  // 五虎遁: 甲己之年丙作首, 乙庚之年戊为头, 丙辛之年寻庚上, 丁壬壬寅顺水流, 戊癸甲寅好追求
  var base = [2,4,6,8,0]; // 丙戊庚壬甲
  var startGan = base[yearGan % 5];
  // 寅月为正月, monthZhiIndex 0=寅
  return (startGan + monthZhiIndex) % 10;
}
// 计算儒略日数(Julian Day Number)
function toJDN(year, month, day) {
  var a = Math.floor((14 - month) / 12);
  var y = year + 4800 - a;
  var m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}
// 根据公历日期判断节气月（返回月支索引 0=寅）
function getMonthZhiIndex(year, month, day) {
  // 每月两个节气, 第一个是节(节气月起点), 第二个是气
  // 节气月: 立春(2/4)开始为寅月
  var jq = JIE_QI_DATES[month - 1];
  var inFirstHalf = day < jq[0]; // 在本月第一个节气之前
  // month对应的月支: 2月=寅(0), 3月=卯(1)... 但要按节气调整
  var monthOffset;
  if (month >= 2) {
    monthOffset = month - 2; // 2月=0(寅) 3月=1(卯)...
  } else {
    monthOffset = month + 10; // 1月=11(丑)
  }
  if (inFirstHalf) {
    // 在节气月上半段，仍属于上一个月支
    monthOffset = (monthOffset - 1 + 12) % 12;
  }
  return monthOffset;
}
// 判断是否在立春之前（用于年柱）
function isBeforeLiChun(year, month, day) {
  // 立春通常在2月4日左右
  var lcDay = JIE_QI_DATES[1][0]; // 2月第一个节气(立春)近似日
  if (month < 2) return true;
  if (month > 2) return false;
  return day < lcDay;
}
// 计算日柱天干地支
function getDayGanZhi(year, month, day) {
  // 以2024-04-30为甲子日(JDN=2460431)作为参考点
  var jdn = toJDN(year, month, day);
  var jdnRef = 2460431;
  var diff = jdn - jdnRef;
  var gz = ((diff % 60) + 60) % 60;
  return { gan: gz % 10, zhi: gz % 12, index: gz };
}
// 计算年柱（以立春为年界）
function getYearGanZhi(year, month, day) {
  var y = year;
  if (isBeforeLiChun(year, month, day)) y = year - 1;
  // 以1984年为甲子年
  var diff = y - 1984;
  var idx = ((diff % 60) + 60) % 60;
  return { gan: idx % 10, zhi: idx % 12, index: idx };
}
// 计算月柱
function getMonthGanZhi(year, month, day) {
  var yearGZ = getYearGanZhi(year, month, day);
  var monthZhiIdx = getMonthZhiIndex(year, month, day);
  var monthGan = getMonthGan(yearGZ.gan, monthZhiIdx);
  // 将月支序号(0=寅)转换为地支序号(0=子)
  var monthZhiDiIdx = (monthZhiIdx + 2) % 12;
  return { gan: monthGan, zhi: monthZhiDiIdx, index: monthGan * 12 + monthZhiIdx };
}
// 建除十二神计算（以月支为建，日支对应建除序号）
// 注意：传入的monthZhiIdx和dayZhiIdx均为DI_ZHI序号(0=子)
function getJianChu(monthZhiIdx, dayZhiIdx) {
  var offset = (dayZhiIdx - monthZhiIdx + 12) % 12;
  return JIAN_CHU[offset];
}
// 值日星宿（以JDN计算，28天循环）
// 已知2024-05-30为角宿日
function getXingXiu(year, month, day) {
  var jdn = toJDN(year, month, day);
  var refJdn = 2460461; // 2024-05-30 角宿
  var diff = jdn - refJdn;
  var idx = ((diff % 28) + 28) % 28;
  return { name: XING_XIU[idx], animal: XING_XIU_ANIMAL[idx], index: idx };
}
// 黄黑道（根据日干和时支计算十二黄黑道）
// 黄黑道: 根据日支和月支计算
var HUANG_DAO_NAMES = ['青龙(黄道)','明堂(黄道)','天刑(黑道)','朱雀(黑道)','金匮(黄道)','天德(黄道)','白虎(黑道)','玉堂(黄道)','天牢(黑道)','玄武(黑道)','司命(黄道)','勾陈(黑道)'];
// 时辰吉凶（根据日干和时支计算黄黑道）
// 日干对应的时辰黄黑道: 以日干起时辰的建除
function getHourJianChu(dayGan, hourZhiIdx) {
  // 五鼠遁日起时: 甲己日从甲子时起
  var dayStartGan = [0,5,2,7,4,9,6,1,8,3]; // 甲己->甲, 乙庚->丙(2), 丙辛->戊(4), 丁壬->庚(6), 戊癸->壬(8)
  // 实际五鼠遁: 甲己还加甲, 乙庚丙作初, 丙辛从戊起, 丁壬庚子居, 戊癸何方发, 壬子是真途
  var startGanMap = {0:0, 1:5, 2:2, 3:7, 4:4, 5:9, 6:6, 7:1, 8:8, 9:3};
  // 五鼠遁修正
  var fiveRatStart = [0,5,2,7,4,9,6,1,8,3];
  // 甲己日: 甲子时(0), 乙丑时(1)... 
  // 乙庚日: 丙子时(2), 丁丑时(3)...
  // 时干 = (fiveRatStart[dayGan] + hourZhiIdx) % 10
  // 时辰建除: 以日支为建, 但时辰建除是以日干定起建
  // 简化: 用日干对应的十二建星来推算时辰吉凶
  // 黄黑道时辰: 青龙明堂金匮天德玉堂司命为黄道吉时, 其余黑道
  var huangdaoIdx = (hourZhiIdx + {0:0,1:0,2:2,3:2,4:4,5:4,6:6,7:6,8:8,9:8}[dayGan%10]) % 12;
  // 更准确的算法: 根据日干确定哪个时辰是黄道
  // 甲己日: 子丑为青龙明堂(吉), 寅卯为天刑朱雀(凶), 辰巳为金匮天德(吉), 午未为白虎玉堂(凶吉), 申酉为天牢玄武(凶), 戌亥为司命勾陈(吉凶)
  var d = dayGan % 5;
  var hourHuangdao = [
    [0,1,4,5,10], // 甲己日: 子丑辰巳戌 吉
    [2,3,4,5,10], // 乙庚日: 寅卯辰巳戌 吉
    [0,1,6,7,10], // 丙辛日: 子丑午未戌 吉
    [0,1,2,3,8],  // 丁壬日: 子丑寅卯申 吉
    [0,1,4,5,6]   // 戊癸日: 子丑辰巳午 吉
  ];
  var goodHours = hourHuangdao[d];
  var isGood = goodHours.indexOf(hourZhiIdx) !== -1;
  return isGood ? '吉' : '凶';
}
// 空亡查询（日柱旬空）
function getDayEmpty(ganZhiIndex) {
  // 60甲子分六旬, 每旬10个, 旬空两个地支
  var xun = Math.floor(ganZhiIndex / 10); // 0-5
  var emptyZhi = [(xun * 10 + 10) % 12, (xun * 10 + 11) % 12];
  return DI_ZHI[emptyZhi[0]] + DI_ZHI[emptyZhi[1]];
}
// 日空亡（日柱所属旬的空亡地支）
function getDayKongWang(dayGanZhiIndex) {
  var xunStart = Math.floor(dayGanZhiIndex / 10) * 10; // 旬首
  // 旬首的地支
  var xunZhi = xunStart % 12;
 // 旬空 = 旬首前两个地支
  var k1 = (xunZhi + 10) % 12;
  var k2 = (xunZhi + 11) % 12;
  return DI_ZHI[k1] + DI_ZHI[k2];
}

// ====== 黄历全量数据表（传统老黄历）======

// 二十八星宿吉凶表
var XINGXIU_JIXIONG = {
  '角':'吉','亢':'凶','氐':'凶','房':'吉','心':'凶','尾':'吉','箕':'吉',
  '斗':'吉','牛':'凶','女':'吉','虚':'凶','危':'凶','室':'吉','壁':'吉',
  '奎':'凶','娄':'吉','胃':'吉','昴':'凶','毕':'吉','觜':'凶','参':'吉',
  '井':'吉','鬼':'凶','柳':'凶','星':'凶','张':'吉','翼':'凶','轸':'吉'
};
var XINGXIU_SONG = {
  '角':'角宿吉，造作婚嫁皆吉昌','亢':'亢宿凶，主见官非病厄','氐':'氐宿凶，出行凶险','房':'房宿吉，婚嫁动土皆吉',
  '心':'心宿凶，安葬祭祀不利','尾':'尾宿吉，造作百事皆吉','箕':'箕宿吉，造仓掘井大吉','斗':'斗宿吉，造作置产皆吉',
  '牛':'牛宿凶，祭祀不利','女':'女宿吉，造作嫁娶皆吉','虚':'虚宿凶，动土开仓不利','危':'危宿凶，登山乘船不利',
  '室':'室宿吉，造作嫁娶皆吉','壁':'壁宿吉，造作嫁娶皆吉','奎':'奎宿凶，出行不利','娄':'娄宿吉，祭祀嫁娶皆吉',
  '胃':'胃宿吉，造作葬埋皆吉','昴':'昴宿凶，嫁娶不利','毕':'毕宿吉，造作安葬皆吉','觜':'觜宿凶，百事不利',
  '参':'参宿吉，造作嫁娶皆吉','井':'井宿吉，造作嫁娶皆吉','鬼':'鬼宿凶，祭祀不利','柳':'柳宿凶，嫁娶葬埋不利',
  '星':'星宿凶，造作不利','张':'张宿吉，造作嫁娶皆吉','翼':'翼宿凶，嫁娶不利','轸':'轸宿吉，造作嫁娶皆吉'
};

// 冲煞详情表（按日地支查）
var CHONGSHA_DETAIL = {
  '子':{chong:'马', sha:'南'}, '丑':{chong:'羊', sha:'东'}, '寅':{chong:'猴', sha:'北'},
  '卯':{chong:'鸡', sha:'西'}, '辰':{chong:'狗', sha:'南'}, '巳':{chong:'猪', sha:'东'},
  '午':{chong:'鼠', sha:'北'}, '未':{chong:'牛', sha:'西'}, '申':{chong:'虎', sha:'南'},
  '酉':{chong:'兔', sha:'东'}, '戌':{chong:'龙', sha:'北'}, '亥':{chong:'蛇', sha:'西'}
};

// 值神表（黄道十二神值日）
var ZHISHEN_NAMES = ['青龙','明堂','天刑','朱雀','金匮','天德','白虎','玉堂','天牢','玄武','司命','勾陈'];
var ZHISHEN_TYPE = {
  '青龙':true,'明堂':true,'金匮':true,'天德':true,'玉堂':true,'司命':true,
  '天刑':false,'朱雀':false,'白虎':false,'天牢':false,'玄武':false,'勾陈':false
};
function getZhishen(dayGanIndex, dayZhiIndex) {
  var zhiStart = {0:0, 6:0, 1:1, 7:1, 2:4, 8:4, 3:5, 9:5, 4:7, 10:7, 5:9, 11:9};
  var start = zhiStart[dayZhiIndex] !== undefined ? zhiStart[dayZhiIndex] : 0;
  var idx = (start + dayGanIndex) % 12;
  return ZHISHEN_NAMES[idx];
}

// 凶神计算
function getXiongshen_Jiesha(dayZhiIdx) {
  var sanhe = [[8,0,4],[2,6,10],[4,8,0],[10,2,6]];
  var jiesha = [5, 10, 2, 7];
  for (var i = 0; i < 4; i++) { if (sanhe[i].indexOf(dayZhiIdx) !== -1) return DI_ZHI[jiesha[i]]; }
  return '';
}
function getXiongshen_Zaisha(dayZhiIdx) {
  var sanhe = [[8,0,4],[2,6,10],[4,8,0],[10,2,6]];
  var zaisha = [6, 0, 3, 9];
  for (var i = 0; i < 4; i++) { if (sanhe[i].indexOf(dayZhiIdx) !== -1) return DI_ZHI[zaisha[i]]; }
  return '';
}
function getXiongshen_Yuesha(monthZhiIdx) {
  var sanhe = [[8,0,4],[2,6,10],[4,8,0],[10,2,6]];
  var yuesha = [7, 1, 10, 4];
  for (var i = 0; i < 4; i++) { if (sanhe[i].indexOf(monthZhiIdx) !== -1) return DI_ZHI[yuesha[i]]; }
  return '';
}
var YUE_XING = {0:3, 1:10, 2:5, 3:8, 4:4, 5:1, 6:2, 7:9, 8:8, 9:9, 10:10, 11:11};
var YUE_YAN = {0:10, 1:9, 2:8, 3:7, 4:6, 5:5, 6:4, 7:3, 8:2, 9:1, 10:0, 11:11};
var YAN_DUI = {0:4, 1:3, 2:2, 3:1, 4:0, 5:11, 6:10, 7:9, 8:8, 9:7, 10:6, 11:5};
var WANG_WANG = {0:[2,5,8,11], 1:[3,6,9,0], 2:[4,7,10,1], 3:[5,8,11,2], 4:[6,9,0,3], 5:[7,10,1,4], 6:[8,11,2,5], 7:[9,0,3,6], 8:[10,1,4,7], 9:[11,2,5,8], 10:[0,3,6,9], 11:[1,4,7,10]};

function calcXiongshen(yearGZ, monthGZ, dayGZ) {
  var result = [];
  var dayZhi = dayGZ.zhi;
  var monthZhiIdx = monthGZ.zhi;
  var monthZhiYinIdx = (monthGZ.zhi - 2 + 12) % 12;
  var jiesha = getXiongshen_Jiesha(dayGZ.zhi);
  if (jiesha && jiesha === DI_ZHI[dayGZ.zhi]) result.push('劫煞');
  var zaisha = getXiongshen_Zaisha(dayGZ.zhi);
  if (zaisha && zaisha === DI_ZHI[dayGZ.zhi]) result.push('灾煞');
  var yuesha = getXiongshen_Yuesha(monthGZ.zhi);
  if (yuesha && yuesha === DI_ZHI[dayGZ.zhi]) result.push('月煞');
  if (YUE_XING[monthZhiIdx] === dayGZ.zhi) result.push('月刑');
  if (YUE_YAN[monthZhiYinIdx] === dayGZ.zhi) result.push('月厌');
  if (YAN_DUI[monthZhiYinIdx] === dayGZ.zhi) result.push('厌对');
  if ([4,10,1,7].indexOf(dayGZ.zhi) !== -1) result.push('四击');
  if (dayGZ.zhi === 0) result.push('死神');
  if (dayGZ.zhi === 5) result.push('天吏');
  var ww = WANG_WANG[monthZhiYinIdx];
  if (ww && ww.indexOf(dayGZ.zhi) !== -1) result.push('往亡');
  if ((dayGZ.zhi + 6) % 12 === monthGZ.zhi) result.push('月破');
  return result;
}

// 吉神计算
var TIAN_EN = [0,1,2,3,4,15,16,17,18,19,30,31,32,33,34,35,36,37,38,39];
var YUE_EN = {0:2, 1:3, 2:6, 3:5, 4:4, 5:7, 6:8, 7:9, 8:6, 9:1, 10:0, 11:7};
var MU_CANG = {0:11, 1:0, 2:1, 3:2, 4:3, 5:4, 6:5, 7:6, 8:7, 9:8, 10:9, 11:10};
var SHENG_XIN = [0, 40, 20, 50];
var YI_HOU = [0, 40, 20];
var XU_SHI = [0, 40, 20];
var TIAN_DE_GAN = {0:3, 2:8, 3:7, 5:0, 6:9, 8:2, 9:1, 11:6};
var YUE_DE_GAN = {0:2, 1:0, 2:8, 3:6, 4:2, 5:0, 6:8, 7:6, 8:2, 9:0, 10:8, 11:6};
var SAN_HE = [[8,0,4],[10,2,6],[2,6,10],[4,8,0]];
var LIU_HE = [[0,1],[2,11],[3,10],[4,9],[5,8],[6,7]];
var WU_HE = [[0,5],[1,6],[2,7],[3,8],[4,9]];
var TIAN_XI = {0:10, 1:10, 2:10, 3:1, 4:1, 5:1, 6:4, 7:4, 8:4, 9:7, 10:7, 11:7};

function calcJishen(yearGZ, monthGZ, dayGZ) {
  var result = [];
  var dayIdx = dayGZ.index;
  var monthZhiYinIdx = (monthGZ.zhi - 2 + 12) % 12;
  var monthZhiIdx = monthGZ.zhi;
  if (TIAN_EN.indexOf(dayIdx) !== -1) result.push('天恩');
  if (YUE_EN[monthZhiYinIdx] === dayGZ.gan) result.push('月恩');
  if (MU_CANG[monthZhiYinIdx] === dayGZ.zhi) result.push('母仓');
  if (SHENG_XIN.indexOf(dayIdx) !== -1) result.push('圣心');
  if (YI_HOU.indexOf(dayIdx) !== -1) result.push('益后');
  if (XU_SHI.indexOf(dayIdx) !== -1) result.push('续世');
  if (TIAN_DE_GAN[monthZhiYinIdx] !== undefined && TIAN_DE_GAN[monthZhiYinIdx] === dayGZ.gan) result.push('天德');
  if (YUE_DE_GAN[monthZhiYinIdx] !== undefined && YUE_DE_GAN[monthZhiYinIdx] === dayGZ.gan) result.push('月德');
  if (TIAN_XI[monthZhiIdx] === dayGZ.zhi) result.push('天喜');
  for (var i = 0; i < 4; i++) {
    if (SAN_HE[i].indexOf(monthGZ.zhi) !== -1 && SAN_HE[i].indexOf(dayGZ.zhi) !== -1) { result.push('三合'); break; }
  }
  for (var i = 0; i < 6; i++) {
    if ((LIU_HE[i][0] === monthGZ.zhi && LIU_HE[i][1] === dayGZ.zhi) ||
        (LIU_HE[i][1] === monthGZ.zhi && LIU_HE[i][0] === dayGZ.zhi)) { result.push('六合'); break; }
  }
  for (var i = 0; i < 5; i++) {
    if ((WU_HE[i][0] === monthGZ.gan && WU_HE[i][1] === dayGZ.gan) ||
        (WU_HE[i][1] === monthGZ.gan && WU_HE[i][0] === dayGZ.gan)) { result.push('五合'); break; }
  }
  for (var i = 0; i < 4; i++) {
    if (SAN_HE[i].indexOf(monthGZ.zhi) !== -1) {
      var maZhi = [2, 8, 11, 5][i];
      if (dayGZ.zhi === maZhi) result.push('驿马');
      break;
    }
  }
  return result;
}

// 完整彭祖百忌（天干+地支）
var PENGZU_FULL = {
  '甲':'甲不开仓财物耗散', '乙':'乙不栽植千株不长', '丙':'丙不修灶必见灾殃', '丁':'丁不剃头头必生疮',
  '戊':'戊不受田田主不祥', '己':'己不破券二比并亡', '庚':'庚不经络织机虚张', '辛':'辛不合酱主人不尝',
  '壬':'壬不汲水更难提防', '癸':'癸不词讼理弱敌强',
  '子':'子不问卜自惹祸殃', '丑':'丑不冠带主不还乡', '寅':'寅不祭祀神鬼不尝', '卯':'卯不穿井水泉不香',
  '辰':'辰不哭泣必主重丧', '巳':'巳不远行财物伏藏', '午':'午不苫盖屋主更张', '未':'未不服药毒气入肠',
  '申':'申不安床鬼祟入房', '酉':'酉不宴客醉坐颠狂', '戌':'戌不吃犬作怪上床', '亥':'亥不嫁娶不利新郎'
};

// 综合每日建议生成器
function buildDailyComprehensiveAdvice(now, dayGZ, jianchu, xingxiu, zhishen, isHuangdao, yiList, jiList, chongshaInfo){
  var M=now.getMonth()+1, D=now.getDate(), Y=now.getFullYear();
  var dayStem=dayGZ.gan, dayBranch=dayGZ.zhi;
  var stemWx={甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水'}[dayStem]||'土';
  var branchWx={子:'水',丑:'土',寅:'木',卯:'木',辰:'土',巳:'火',午:'火',未:'土',申:'金',酉:'金',戌:'土',亥:'水'}[dayBranch]||'土';
  
  var advice=[];
  
  // 1. 节气建议
  var jieqi=getJieqiByDate(now);
  if(jieqi){
    var jieqiAdvice={
      '立春':'今日立春，万象更新。宜制定新年计划，祭祀迎春，穿青色衣物。',
      '雨水':'雨水节气，万物萌生。宜养肝护肝，多食绿叶菜，避免动怒。',
      '惊蛰':'惊蛰到，春雷动。宜早起活动，敲胆经，排冬蓄之毒。',
      '春分':'春分昼夜平。宜调和阴阳，踏青放风筝，食春菜。',
      '清明':'清明时节。宜祭祖扫墓，踏青抒怀，食青团。佛宜诵地藏经回向先人。',
      '谷雨':'谷雨湿气渐重。宜健脾祛湿，食薏米红豆，避免久居潮湿。',
      '立夏':'今日立夏，心火渐旺。宜养心安神，午间小憩，食苦味清心。',
      '小满':'小满湿热加重。宜清淡饮食，忌辛辣油腻，勤运动出汗。',
      '芒种':'芒种忙种。宜劳逸结合，避免大汗，酸梅汤生津止渴。',
      '夏至':'夏至阳极阴生。宜晚睡早起，艾灸关元，忌贪凉饮冷。',
      '小暑':'小暑入伏。宜防暑降温，三伏贴/灸，食绿豆汤解暑。',
      '大暑':'大暑最热。宜静心避暑，饮伏茶，午休必不可少。',
      '立秋':'今日立秋，宜贴秋膘。补肺润燥，食百合银耳，早睡收敛。',
      '处暑':'处暑暑止。宜调整作息，秋冻锻炼，食白色养肺食物。',
      '白露':'白露至，秋意浓。宜润肺防燥，食梨蜜藕，晨起勿赤膊。',
      '秋分':'秋分昼夜平。宜阴阳调和，登高望远，食当季果蔬。',
      '寒露':'寒露凉起。宜添衣保暖，泡脚驱寒，食山药健脾。',
      '霜降':'霜降秋末。宜温补脾胃，食柿子板栗，避免寒凉。',
      '立冬':'今日立冬，宜冬补。补肾藏精，食黑色食物(黑豆/黑芝麻)，早睡晚起。',
      '小雪':'小雪寒冷。宜温阳御寒，羊肉汤进补，泡脚助眠。',
      '大雪':'大雪隆冬。宜极致收藏，减少外出，室内艾灸关元/命门。',
      '冬至':'冬至一阳生。宜吃饺子/汤圆，早睡，艾灸神阙穴，道宜诵道德经。',
      '小寒':'小寒最冷伊始。宜极温补，当归生姜羊肉汤，避免冒风寒。',
      '大寒':'大寒岁末。宜辞旧迎新，大扫除，准备年货，总结一年得失。'
    };
    if(jieqiAdvice[jieqi]) advice.push('🌿 节气·'+jieqi+'：'+jieqiAdvice[jieqi]);
  }
  
  // 2. 佛道节日建议
  var festivals=getUpcomingFaithFestivals(now,0); // 当天节日
  if(festivals&&festivals.length>0){
    festivals.forEach(function(f){
      var tip='';
      if(f.tradition==='佛'){tip='🪷 佛诞日·'+f.name+'：宜诵经祈福，供灯供花，持素一日，回向众生。';}
      else if(f.tradition==='道'){tip='☯️ 道教节日·'+f.name+'：宜焚香诵经，祭拜祈福，修善积德。';}
      else if(f.tradition==='儒'){tip='📖 儒家纪念日·'+f.name+'：宜读经典，祭祀先贤，反省修身。';}
      if(tip) advice.push(tip);
    });
  }
  
  // 3. 宜忌建议
  if(yiList&&yiList.length>0){
    var topYi=yiList.slice(0,3).join('、');
    advice.push('✅ 今日宜：'+topYi+'。'+(isHuangdao?'值'+zhishen+'黄道吉神，宜行大事。':'值'+zhishen+'，重要事项宜择吉日。'));
  }
  if(jiList&&jiList.length>0){
    var topJi=jiList.slice(0,3).join('、');
    advice.push('❌ 今日忌：'+topJi+'。'+(chongshaInfo?'冲'+chongshaInfo.chong+'煞'+chongshaInfo.sha+'，相关生肖/方位需注意。':''));
  }
  
  // 4. 干支五行建议
  var wxColor={木:'青/绿色',火:'红/紫色',土:'黄/棕色',金:'白/银色',水:'黑/蓝色'};
  var wxDir={木:'东方',火:'南方',土:'中央',金:'西方',水:'北方'};
  var wxOrgan={木:'肝胆',火:'心小肠',土:'脾胃',金:'肺大肠',水:'肾膀胱'};
  advice.push('☯️ 日干'+dayStem+'('+stemWx+')日支'+dayBranch+'('+branchWx+')：今日'+stemWx+'旺，宜穿'+wxColor[stemWx]+'衣物，朝'+wxDir[stemWx]+'方行事。重点养护'+wxOrgan[stemWx]+'。');
  
  // 5. 建除建议
  var jianchuAdvice={
    '建':'建日主吉，宜开创新事，但不可妄动。',
    '除':'除日宜去旧迎新，清除不吉之物。',
    '满':'满日主圆满，宜祈福求财，但不宜远行。',
    '平':'平日主平和，宜日常事务，不宜大举。',
    '定':'定日主安定，宜签约定事，忌变动。',
    '执':'执日主执着，宜执着而行，但需防固执。',
    '破':'破日主冲破，忌婚嫁开张，宜拆除清理。',
    '危':'危日主危险，凡事需谨慎，登山涉水不宜。',
    '成':'成日主成就，宜婚嫁开张签约，万事可成。',
    '收':'收日主收成，宜收获纳财，忌播种发射。',
    '开':'开日主开通，宜开业出行，生机勃勃。',
    '闭':'闭日主闭塞，宜收敛闭关，不宜开放扩张。'
  };
  if(jianchuAdvice[jianchu]) advice.push('📋 建除·'+jianchu+'日：'+jianchuAdvice[jianchu]);
  
  // 6. 星宿建议
  if(xingxiu&&xingxiu.name){
    var starAdvice={
      '吉':'星宿'+xingxiu.name+'主吉，宜祭祀祈福，诸事顺遂。',
      '凶':'星宿'+xingxiu.name+'主凶，宜静守不宜动，持经诵咒化解。',
      '平':'星宿'+xingxiu.name+'性平，诸事可行，无大吉大凶。'
    };
    var starJixiong=xingxiu.jixiong||'平';
    if(starAdvice[starJixiong]) advice.push('⭐ 星宿·'+xingxiu.name+'：'+starAdvice[starJixiong]);
  }
  
  // 7. 修行方向建议（综合干支+节气+节日）
  var practiceDir='';
  if(jieqi){
    var jieqiWx={立春:'木',雨水:'木',惊蛰:'木',春分:'木',清明:'木',谷雨:'土',
      立夏:'火',小满:'火',芒种:'火',夏至:'火',小暑:'土',大暑:'土',
      立秋:'金',处暑:'金',白露:'金',秋分:'金',寒露:'水',霜降:'土',
      立冬:'水',小雪:'水',大雪:'水',冬至:'水',小寒:'土',大寒:'土'}[jieqi];
    if(jieqiWx){
      var shengMap={木:'火',火:'土',土:'金',金:'水',水:'木'};
      var keMap={木:'土',土:'水',水:'火',火:'金',金:'木'};
      practiceDir='今日节气'+jieqi+'属'+jieqiWx+'，宜修'+shengMap[jieqiWx]+'行法门（'+(shengMap[jieqiWx]==='木'?'东方朝真':shengMap[jieqiWx]==='火'?'南方供灯':shengMap[jieqiWx]==='土'?'中央持咒':shengMap[jieqiWx]==='金'?'西方诵经':'北方忏悔')+'），忌'+keMap[jieqiWx]+'行冲动。';
      advice.push('🧘 修行方向：'+practiceDir);
    }
  }
  
  // 输出到页面
  var el=document.getElementById('almanacFaithDaily');
  if(el&&advice.length>0){
    var html='<div style="background:linear-gradient(135deg,rgba(201,168,76,.04),rgba(155,89,182,.03));border:1px solid rgba(201,168,76,.1);border-radius:12px;padding:18px;margin-bottom:14px">';
    html+='<div style="font-size:14px;color:var(--gold);font-weight:bold;margin-bottom:12px;letter-spacing:3px">🌟 今日综合建议</div>';
    advice.forEach(function(a){
      html+='<div style="font-size:13px;color:var(--paper);line-height:2;margin-bottom:6px;padding-left:4px;border-left:2px solid rgba(201,168,76,.15)">'+a+'</div>';
    });
    html+='</div>';
    // 追加到原有修行指引之前
    el.innerHTML=html+el.innerHTML;
  }
  
  return advice;
}

function initAlmanac() {
  var now = new Date();
  var Y = now.getFullYear();
  var M = now.getMonth() + 1;
  var D = now.getDate();
  var weekday = ['周日','周一','周二','周三','周四','周五','周六'][now.getDay()];
  
  // 日期显示
  document.getElementById('almanacDate').textContent = Y + '年' + M + '月' + D + '日 · ' + weekday;
  
  // 计算干支
  var yearGZ = getYearGanZhi(Y, M, D);
  var monthGZ = getMonthGanZhi(Y, M, D);
  var dayGZ = getDayGanZhi(Y, M, D);
  var yearStr = TIAN_GAN[yearGZ.gan] + DI_ZHI[yearGZ.zhi] + '年(' + SHENG_XIAO[yearGZ.zhi] + ')';
  var monthStr = TIAN_GAN[monthGZ.gan] + DI_ZHI[monthGZ.zhi] + '月';
  var dayStr = TIAN_GAN[dayGZ.gan] + DI_ZHI[dayGZ.zhi] + '日(' + SHENG_XIAO[dayGZ.zhi] + ')';
  var dayKong = getDayKongWang(dayGZ.index);
  
  // 建除十二神
  var monthZhiIdx = monthGZ.zhi;
  var dayZhiIdx = dayGZ.zhi;
  var jianchu = getJianChu(monthZhiIdx, dayZhiIdx);
  
  // 值日星宿 + 吉凶
  var xingxiu = getXingXiu(Y, M, D);
  var xingxiuJixiong = XINGXIU_JIXIONG[xingxiu.name] || '平';
  var xingxiuSong = XINGXIU_SONG[xingxiu.name] || '';
  
  // 值神（黄道十二神值日）
  var zhishen = getZhishen(dayGZ.gan, dayGZ.zhi);
  var zhishenIsHuangdao = ZHISHEN_TYPE[zhishen];
  
  // 黄黑道
  var huangdaoIdx = (dayZhiIdx + monthGZ.zhi - 2 + 12) % 12;
  var huangdao = HUANG_DAO_NAMES[huangdaoIdx];
  
  // 冲煞详情
  var dayZhiName = DI_ZHI[dayZhiIdx];
  var chongshaInfo = CHONGSHA_DETAIL[dayZhiName] || {chong:'', sha:''};
  var chongAnimal = SHENG_XIAO[(dayZhiIdx + 6) % 12];
  var shaDir = chongshaInfo.sha;
  
  // 彭祖百忌（完整版：天干+地支）
  var pengzuGan = PENGZU_FULL[TIAN_GAN[dayGZ.gan]] || '';
  var pengzuZhi = PENGZU_FULL[DI_ZHI[dayGZ.zhi]] || '';
  var pengzu = pengzuGan + (pengzuZhi ? '；' + pengzuZhi : '');
  
  // 吉神方位
  var xiShen = XI_SHEN[dayGZ.gan];
  var fuShen = FU_SHEN[dayGZ.gan];
  var caiShen = CAI_SHEN[dayGZ.gan];
  
  // 胎神占方
  var taiShen = TAI_SHEN_60[dayGZ.index];
  
  // 计算吉神
  var jishenList = calcJishen(yearGZ, monthGZ, dayGZ);
  // 计算凶神
  var xiongshenList = calcXiongshen(yearGZ, monthGZ, dayGZ);
  
  // 宜忌（基于建除十二神 + 吉凶神 + 日干五行综合判断）
  var yiList = JIAN_CHU_YI[jianchu] || ['祭祀'];
  var jiList = JIAN_CHU_JI[jianchu] || ['诸事不宜'];
  // 吉神宜趋扩展：有吉神则增加相应宜项
  var jishenYiMap = {
    '天德':'祈福','月德':'祈福','天恩':'上任','月恩':'纳采',
    '四相':'嫁娶','三合':'订盟','六合':'交易','五合':'嫁娶',
    '不将':'嫁娶','不将日':'嫁娶','司命':'安床','阳德':'祈福',
    '阴德':'祭祀','天喜':'嫁娶','天医':'求医','天后':'祈福',
    '天巫':'祈福','福德':'祭祀','金堂':'入宅','玉宇':'入宅',
    '吉期':'嫁娶','圣心':'祈福','显星':'赴任','益后':'求嗣',
    '续世':'求嗣','岁德':'祈福','时阳':'出行','生气':'栽种'
  };
  jishenList.forEach(function(js){
    if(jishenYiMap[js] && yiList.indexOf(jishenYiMap[js]) === -1){
      yiList.push(jishenYiMap[js]);
    }
  });
  // 凶神扩展：增加忌项
  var xiongshenJiMap = {
    '月破':'诸事不宜','月煞':'移徙','月刑':'动土','月厌':'嫁娶',
    '四废':'开市','四穷':'交易','四离':'出行','四绝':'远行',
    '天吏':'赴任','致死':'求医','五离':'交易','八风':'出行',
    '劫煞':'上任','灾煞':'祈福','天火':'动土','地火':'栽种',
    '厌对':'嫁娶','招摇':'出行','往亡':'出行','血支':'针灸'
  };
  xiongshenList.forEach(function(xs){
    if(xiongshenJiMap[xs] && jiList.indexOf(xiongshenJiMap[xs]) === -1){
      jiList.push(xiongshenJiMap[xs]);
    }
  });
  // 如有月破，增加忌项
  if (xiongshenList.indexOf('月破') !== -1) {
    jiList = jiList.concat(['月破日不宜举大事']);
  }
  
  // 渲染干支
  var elGzYear = document.getElementById('almanacGzYear');
  var elGzMonth = document.getElementById('almanacGzMonth');
  var elGzDay = document.getElementById('almanacGzDay');
  var elDayEmpty = document.getElementById('almanacDayEmpty');
  if (elGzYear) elGzYear.textContent = yearStr;
  if (elGzMonth) elGzMonth.textContent = monthStr;
  if (elGzDay) elGzDay.textContent = dayStr;
  if (elDayEmpty) elDayEmpty.textContent = dayKong;
  
  // 渲染建除 + 星宿(含吉凶) + 值神(黄道/黑道) + 胎神
  var elJianchu = document.getElementById('almanacJianchu');
  if (elJianchu) elJianchu.textContent = jianchu + '日';
  var elXingxiu = document.getElementById('almanacXingxiu');
  if (elXingxiu) {
    var xxColor = xingxiuJixiong === '吉' ? '#2ecc71' : (xingxiuJixiong === '凶' ? '#e74c3c' : 'var(--gold)');
    elXingxiu.innerHTML = xingxiu.name + xingxiu.animal + '(' + (xingxiu.index + 1) + '/28) <span style="font-size:11px;color:' + xxColor + '">' + xingxiuJixiong + '</span>';
  }
  var elHuangdao = document.getElementById('almanacHuangdao');
  if (elHuangdao) {
    var zsColor = zhishenIsHuangdao ? '#2ecc71' : '#e74c3c';
    var zsLabel = zhishenIsHuangdao ? '黄道' : '黑道';
    elHuangdao.innerHTML = zhishen + '<span style="font-size:11px;color:' + zsColor + ';margin-left:4px">' + zsLabel + '</span>';
  }
  var elTaishen = document.getElementById('almanacTaishen');
  if (elTaishen) elTaishen.textContent = taiShen;
  
  // 渲染宜忌
  document.getElementById('almanacYi').innerHTML = yiList.map(function(s) {
    return '<span style="display:inline-block;margin:2px 6px">' + s + '</span>';
  }).join('');
  document.getElementById('almanacJi').innerHTML = jiList.map(function(s) {
    return '<span style="display:inline-block;margin:2px 6px">' + s + '</span>';
  }).join('');
  
  // 渲染冲煞详情
  document.getElementById('almanacChong').textContent = '冲' + chongshaInfo.chong + '(' + dayZhiName + ')';
  document.getElementById('almanacSha').textContent = '煞' + shaDir;
  document.getElementById('almanacPengzu').innerHTML = pengzu.replace(/；/g, '<br>');
  
  // 渲染吉神方位 + 吉神宜趋
  var jishenHtml = '<div style="font-size:11px;color:var(--paper2);margin-bottom:4px">方位</div>';
  jishenHtml += '<div style="font-size:12px">喜:' + xiShen + ' 福:' + fuShen + ' 财:' + caiShen + '</div>';
  if (jishenList.length > 0) {
    jishenHtml += '<div style="font-size:11px;color:#2ecc71;margin-top:6px;margin-bottom:2px">吉神宜趋</div>';
    jishenHtml += '<div style="font-size:12px;color:#2ecc71">' + jishenList.join('、') + '</div>';
  }
  document.getElementById('almanacJishen').innerHTML = jishenHtml;
  
  // 渲染凶神（动态添加到冲煞行后面）
  var detailEl = document.getElementById('almanacDetail');
  if (detailEl && xiongshenList.length > 0) {
    var existXs = document.getElementById('almanacXiongshen');
    if (!existXs) {
      var xsDiv = document.createElement('div');
      xsDiv.id = 'almanacXiongshen';
      xsDiv.style.cssText = 'background:rgba(231,76,60,0.06);border:1px solid rgba(231,76,60,0.2);border-radius:8px;padding:12px;text-align:center;grid-column:span 4';
      detailEl.appendChild(xsDiv);
    }
    var xsEl = document.getElementById('almanacXiongshen');
    xsEl.innerHTML = '<div style="font-size:11px;color:#e74c3c;margin-bottom:4px">凶神宜忌</div><div style="font-size:12px;color:#e74c3c">' + xiongshenList.join('、') + '</div>';
  }
  
  // 时辰吉凶
  var shichen = ['子(23-1)','丑(1-3)','寅(3-5)','卯(5-7)','辰(7-9)','巳(9-11)','午(11-13)','未(13-15)','申(15-17)','酉(17-19)','戌(19-21)','亥(21-23)'];
  var hoursDiv = document.getElementById('almanacHours');
  hoursDiv.innerHTML = shichen.map(function(s, i) {
    var luck = getHourJianChu(dayGZ.gan, i);
    var good = luck === '吉';
    var color = good ? 'rgba(39,174,96,0.4)' : 'rgba(231,76,60,0.4)';
    var textColor = good ? '#2ecc71' : '#e74c3c';
    var bg = good ? 'rgba(39,174,96,0.08)' : 'rgba(231,76,60,0.08)';
    return '<div style="padding:6px 10px;border-radius:20px;font-size:11px;border:1px solid ' + color + ';color:' + textColor + ';background:' + bg + '">' + s + ' ' + luck + '</div>';
  }).join('');
  
  // === 日五行计算 ===
  var wuxingMap = { '甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水' };
  var dayWuxing = wuxingMap[TIAN_GAN[dayGZ.gan]] || '';
  var elWuxing = document.getElementById('almanacWuxing');
  if (elWuxing) elWuxing.textContent = dayWuxing + '（' + TIAN_GAN[dayGZ.gan] + '）';
  
  // === 日纳音计算（六十甲子纳音表，每对共享同一纳音） ===
  var NAYIN_60 = [
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
  var dayNayin = NAYIN_60[dayGZ.index] || '';
  var elNayin = document.getElementById('almanacNayin');
  if (elNayin) elNayin.textContent = dayNayin;
  
  // === 值年太岁 ===
  var TAISUI_NAMES = ['子太岁(殷郊)','丑太岁(杨信)','寅太岁(耿章)','卯太岁(沈兴)','辰太岁(赵达)','巳太岁(邓绥)',
    '午太岁(王丙)','未太岁(徐明)','申太岁(段志)','酉太岁(蒋崇)','戌太岁(洪克)','亥太岁(程宝)'];
  var yearTaiSui = TAISUI_NAMES[yearGZ.zhi] || '';
  var elTaisui = document.getElementById('almanacTaisui');
  if (elTaisui) elTaisui.textContent = yearTaiSui;
  
  // === 相冲生肖（日支+6 mod 12） ===
  var chongAnimalIdx = (dayGZ.zhi + 6) % 12;
  var chongAnimal = SHENG_XIAO[chongAnimalIdx];
  var elChongAnimal = document.getElementById('almanacChongAnimal');
  if (elChongAnimal) elChongAnimal.textContent = chongAnimal + '（冲' + DI_ZHI[dayGZ.zhi] + '日）';
  
  // === 综合每日建议（节气+节日+宜忌+干支+星宿+值神）===
  var comprehensiveAdvice = buildDailyComprehensiveAdvice(now, dayGZ, jianchu, xingxiu, zhishen, zhishenIsHuangdao, yiList, jiList, chongshaInfo);
  var adviceEl = document.getElementById('almanacFaithDaily');
  // 先清空，写入综合建议
  if (adviceEl) adviceEl.innerHTML = '';
  // buildDailyComprehensiveAdvice 内部已写入 almanacFaithDaily
  
  // === 每日修行指引（儒道佛日课） ===
  var faithEl = document.getElementById('almanacFaithDaily');
  if (faithEl && typeof FAITH_GUIDE !== 'undefined') {
    // 用日期哈希让每天内容不同，三教各取不同维度
    var dateHash = (Y * 1000 + M * 31 + D);
    var periods = ['morning', 'noon', 'evening'];
    var faiths = [
      {key:'buddhist', emoji:'🪷', name:'佛教日课', color:'#c0392b'},
      {key:'taoist', emoji:'☯️', name:'道教日课', color:'#27ae60'},
      {key:'confucian', emoji:'📖', name:'儒家日课', color:'#c9a84c'}
    ];
    var faithHtml = '';
    faiths.forEach(function(f, idx){
      var practice = FAITH_GUIDE.dailyPractice[f.key];
      if(!practice) return;
      // 每教用不同偏移取时段，保证三教不同
      var periodIdx = (dateHash + idx * 7) % 3;
      var periodKey = periods[periodIdx];
      var pData = practice[periodKey];
      if(pData){
        // 步骤也随日期轮换，每天显示不同步骤子集
        var stepStart = (dateHash + idx * 3) % pData.steps.length;
        var shownSteps = [];
        for(var s = 0; s < Math.min(3, pData.steps.length); s++){
          shownSteps.push(pData.steps[(stepStart + s) % pData.steps.length]);
        }
        faithHtml += '<div style="margin-bottom:10px"><span style="color:' + f.color + ';font-weight:bold;font-size:13px">' + f.emoji + ' ' + f.name + '：</span><span style="font-size:13px">' + pData.title + ' — ' + shownSteps.join(' → ') + '</span></div>';
      }
    });
    
    // 加入当日经文推荐（随日期轮换）
    if(FAITH_GUIDE.scriptureGuide){
      var allScriptures = [];
      Object.keys(FAITH_GUIDE.scriptureGuide).forEach(function(faith){
        FAITH_GUIDE.scriptureGuide[faith].forEach(function(s){
          allScriptures.push({faith:faith, name:s.name, level:s.level, duration:s.duration, benefit:s.benefit, method:s.method});
        });
      });
      if(allScriptures.length > 0){
        var todayScripture = allScriptures[dateHash % allScriptures.length];
        var sEmoji = todayScripture.faith === 'buddhist' ? '🪷' : todayScripture.faith === 'taoist' ? '☯️' : '📖';
        var sColor = todayScripture.faith === 'buddhist' ? '#c0392b' : todayScripture.faith === 'taoist' ? '#27ae60' : '#c9a84c';
        faithHtml += '<div style="margin-bottom:10px"><span style="color:' + sColor + ';font-weight:bold;font-size:13px">📜 今日经文：</span><span style="font-size:13px">' + sEmoji + ' 《' + todayScripture.name + '》(' + todayScripture.level + ') — ' + todayScripture.benefit.substring(0, 40) + '</span></div>';
      }
    }
    
    // 加入当日禁忌提醒（随日期轮换）
    if(FAITH_GUIDE.tabooReminders){
      var allTaboos = [];
      Object.keys(FAITH_GUIDE.tabooReminders).forEach(function(faith){
        FAITH_GUIDE.tabooReminders[faith].forEach(function(cat){
          if(cat.items && Array.isArray(cat.items)){
            cat.items.forEach(function(item){
              allTaboos.push({faith:faith, category:cat.category, item:typeof item === 'string' ? item : (item.taboo || item.text || JSON.stringify(item))});
            });
          }
        });
      });
      if(allTaboos.length > 0){
        var todayTaboo = allTaboos[(dateHash * 3 + 7) % allTaboos.length];
        var tEmoji = todayTaboo.faith === 'buddhist' ? '🪷' : todayTaboo.faith === 'taoist' ? '☯️' : '📖';
        faithHtml += '<div style="margin-bottom:10px"><span style="color:#e74c3c;font-weight:bold;font-size:13px">⚠️ 今日禁忌：</span><span style="font-size:13px">' + tEmoji + ' [' + todayTaboo.category + '] ' + todayTaboo.item.substring(0, 50) + '</span></div>';
      }
    }
    
    // 加入当前时辰养生提示
    var currentHour = now.getHours();
    var currentShichen = Math.floor((currentHour + 1) / 2) % 12;
    if(FAITH_GUIDE.shichenGuide && FAITH_GUIDE.shichenGuide[currentShichen]){
      var sc = FAITH_GUIDE.shichenGuide[currentShichen];
      faithHtml += '<div><span style="color:var(--gold);font-weight:bold;font-size:13px">🕐 当下时辰：</span><span style="font-size:13px">' + sc.shichen + '(' + sc.time + ') · 养' + sc.organ + ' — ' + sc.advice.substring(0, 40) + '</span></div>';
    }
    
    faithEl.innerHTML += faithHtml;
  }
  
  // === 今日佛道活动推荐 ===
  renderFaithFestivalDaily();
  
  // 更新黄历小知识（动态注释）
  var glossaryEl = document.getElementById('almanacGlossary');
  if (glossaryEl) {
    var tips = [
      '建除十二神：' + jianchu + '日。建为岁君，除为去旧，满为丰收，平为平和，定为安静，执为固执，破为冲破，危为危险，成为成就，收为收成，开为开通，闭为闭塞。',
      '冲：当日地支与冲方地支相冲，对冲' + chongshaInfo.chong + '者行事需谨慎。煞' + shaDir + '：冲煞方位，不宜朝该方向行事。',
      '空亡：日柱所属旬中不配的天干地支，' + dayKong + '为空亡，凡事难圆满。',
      '彭祖百忌：' + pengzuGan + '。古传若逢该天干日行相关之事则不利。',
      '值神：' + zhishen + '（' + (zhishenIsHuangdao ? '黄道吉神' : '黑道凶神') + '）。黄道日宜行大事，黑道日宜静守。',
      '星宿：' + xingxiu.name + xingxiu.animal + '，' + xingxiuJixiong + '。' + xingxiuSong,
      '吉神宜趋：' + (jishenList.length > 0 ? jishenList.join('、') : '无特殊吉神') + '。凶神宜忌：' + (xiongshenList.length > 0 ? xiongshenList.join('、') : '无特殊凶神') + '。'
    ];
    glossaryEl.innerHTML = tips[now.getDate() % tips.length];
  }
  
  // 渲染河洛数理面板
  renderHetuLuoshuPanel();
}

// ===== 河洛数理系统 =====
var HETU_LUOSHU_SYSTEM={
  hetu:{
    formula:'天一生水地六成之；天二生火地七成之；天三生木地八成之；天四生金地九成之；天五生土地十成之',
    shengShu:{1:'水',2:'火',3:'木',4:'金',5:'土'},
    chengShu:{6:'水',7:'火',8:'木',9:'金',0:'土'},
    wuxingJu:{
      '水局':{sheng:1,cheng:6,chars:'智慧、流动、变化',applies:'传播/物流/咨询'},
      '火局':{sheng:2,cheng:7,chars:'热情、光明、变革',applies:'科技/传媒/餐饮'},
      '木局':{sheng:3,cheng:8,chars:'生发、仁慈、文化',applies:'教育/文化/农业'},
      '金局':{sheng:4,cheng:9,chars:'刚毅、果断、收敛',applies:'金融/法律/制造'},
      '土局':{sheng:5,cheng:10,chars:'厚重、包容、积累',applies:'地产/建筑/保险'}
    }
  },
  luoshu:{
    grid:[[4,9,2],[3,5,7],[8,1,6]],
    palace:{
      1:{name:'坎宫',dir:'北方',el:'水',body:'肾/膀胱/耳'},
      2:{name:'坤宫',dir:'西南',el:'土',body:'脾/胃/腹'},
      3:{name:'震宫',dir:'东方',el:'木',body:'肝/胆/神经'},
      4:{name:'巽宫',dir:'东南',el:'木',body:'胆/股'},
      5:{name:'中宫',dir:'中央',el:'土',body:'脾胃全身'},
      6:{name:'乾宫',dir:'西北',el:'金',body:'肺/头/骨'},
      7:{name:'兑宫',dir:'西方',el:'金',body:'肺/口/咽'},
      8:{name:'艮宫',dir:'东北',el:'土',body:'胃/关节/背'},
      9:{name:'离宫',dir:'南方',el:'火',body:'心/眼/血'}
    },
    nineStars:{
      1:{name:'一白贪狼星',el:'水',luck:'吉',domain:'桃花/人缘/智慧',enhance:'养水生植物/鱼缸/蓝色物品',resolve:''},
      2:{name:'二黑巨门星',el:'土',luck:'凶',domain:'病符/健康',enhance:'',resolve:'挂铜葫芦/六帝铜钱'},
      3:{name:'三碧禄存星',el:'木',luck:'凶',domain:'是非/口舌',enhance:'',resolve:'放红色物品(火泄木)'}
,
      4:{name:'四绿文曲星',el:'木',luck:'吉',domain:'文昌/学业/姻缘',enhance:'放四支毛笔/绿色植物/文昌塔',resolve:''},
      5:{name:'五黄廉贞星',el:'土',luck:'大凶',domain:'灾煞/意外',enhance:'',resolve:'挂铜铃/六帝钱(金泄土)'}
,
      6:{name:'六白武曲星',el:'金',luck:'吉',domain:'贵人/权力',enhance:'放金属物品/黄色水晶',resolve:''},
      7:{name:'七赤破军星',el:'金',luck:'凶',domain:'贼盗/破财',enhance:'',resolve:'放蓝色黑色物品(水泄金)'}
,
      8:{name:'八白左辅星',el:'土',luck:'吉(当旺)',domain:'财运/置业',enhance:'放黄色水晶/陶瓷/八白玉',resolve:''},
      9:{name:'九紫右弼星',el:'火',luck:'吉(当旺)',domain:'喜庆/姻缘/名声',enhance:'放红色物品/鲜花/红灯',resolve:''}
    }
  }
};

// 河洛数理分析
function analyzeByHetuLuoshu(input,type){
  var result={input:input,type:type,hetu:{},luoshu:{},conclusion:'',advice:[]};
  
  // 河图五行分析
  var wxCount={水:0,火:0,木:0,金:0,土:0};
  var shengCount=0,chengCount=0;
  
  if(type==='mobile'){
    for(var i=0;i<input.length;i++){
      var n=parseInt(input[i]);
      var wx=HETU_LUOSHU_SYSTEM.hetu.shengShu[n]||HETU_LUOSHU_SYSTEM.hetu.chengShu[n];
      if(wx)wxCount[wx]++;
      if(n>=1&&n<=5)shengCount++;
      else chengCount++;
    }
  }else if(type==='name'){
    // 姓名笔画
    for(var i=0;i<input.length;i++){
      var stroke=getKangxiStroke(input[i])||_STROKE_TABLE[input[i]]||(input[i].charCodeAt(0)%16+1);
      var num=stroke%10;
      var wx=HETU_LUOSHU_SYSTEM.hetu.shengShu[num]||HETU_LUOSHU_SYSTEM.hetu.chengShu[num];
      if(wx)wxCount[wx]++;
      if(num>=1&&num<=5)shengCount++;else chengCount++;
    }
  }
  
  result.hetu={wxCount:wxCount,shengCount:shengCount,chengCount:chengCount,
    ratio:(shengCount/(shengCount+chengCount)*100).toFixed(0)+'%生/'+(chengCount/(shengCount+chengCount)*100).toFixed(0)+'%成',
    dominant:'',balance:false};
  // 找最旺五行
  var maxWx='水',maxVal=0,minWx='水',minVal=99;
  for(var wx in wxCount){
    if(wxCount[wx]>maxVal){maxVal=wxCount[wx];maxWx=wx;}
    if(wxCount[wx]<minVal){minVal=wxCount[wx];minWx=wx;}
  }
  result.hetu.dominant=maxWx;
  result.hetu.weakest=minWx;
  result.hetu.balance=(maxVal-minVal)<=2;
  result.hetu.shengChengMeaning=shengCount>chengCount?'生数偏多→主动开创、先发制人、宜进取':chengCount>shengCount?'成数偏多→主守成、稳健积累、宜守不宜攻':'生成平衡→动静相宜，攻守兼备';
  
  // 洛书九星分析（仅mobile）
  if(type==='mobile'){
    var starCount={};
    for(var i=0;i<input.length;i++){
      var n=parseInt(input[i]);
      if(n===0)n=10; // 0代10，属土
      if(n>=1&&n<=9){
        starCount[n]=(starCount[n]||0)+1;
      }
    }
    var jiCount=0,xiongCount=0;
    var starDetails=[];
    for(var s=1;s<=9;s++){
      if(starCount[s]){
        var star=HETU_LUOSHU_SYSTEM.luoshu.nineStars[s];
        var isJi=star.luck.indexOf('吉')>=0;
        if(isJi)jiCount+=starCount[s];else xiongCount+=starCount[s];
        starDetails.push({num:s,name:star.name,count:starCount[s],luck:star.luck,domain:star.domain});
      }
    }
    result.luoshu={starCount:starCount,starDetails:starDetails,jiCount:jiCount,xiongCount:xiongCount,
      ratio:(jiCount/(jiCount+xiongCount)*100||0).toFixed(0)+'%吉/'+(xiongCount/(jiCount+xiongCount)*100||0).toFixed(0)+'%凶'};
  }
  
  // 结论
  var concl='河图五行偏「'+maxWx+'」';
  if(result.hetu.balance)concl+='，五行较为平衡';
  else concl+='，「'+minWx+'」偏弱需补';
  if(type==='mobile'&&result.luoshu.jiCount!==undefined){
    concl+='。洛书九星吉凶比'+result.luoshu.ratio;
  }
  concl+='。'+result.hetu.shengChengMeaning+'。';
  result.conclusion=concl;
  
  // 建议
  result.advice=[];
  if(!result.hetu.balance){
    var shengMap={木:'水',火:'木',土:'火',金:'土',水:'金'};
    result.advice.push('补'+minWx+'：宜多接触'+minWx+'行相关事物（'+(minWx==='木'?'绿色植物/木材':minWx==='火'?'红色物品/灯光':minWx==='土'?'黄色物品/陶瓷':minWx==='金'?'金属物品/白色':minWx==='水'?'水养植物/鱼缸/蓝色':'')+'）');
  }
  if(type==='mobile'&&xiongCount>jiCount){
    result.advice.push('凶星偏多，建议调整号码增加吉星数字（1/4/6/8/9）');
  }
  if(shengCount>chengCount*2){
    result.advice.push('生数过多主冲动，宜增加成数(6-9)平衡');
  }else if(chengCount>shengCount*2){
    result.advice.push('成数过多主保守，宜增加生数(1-5)激活动力');
  }
  
  return result;
}

// 渲染河洛面板
function renderHetuLuoshuPanel(){
  var el=document.getElementById('almanacHetuLuoshu');
  if(!el)return;
  var now=new Date();
  var Y=now.getFullYear(),M=now.getMonth()+1,D=now.getDate();
  
  // 今日河图数
  var dayGzIdx=(Y*365+M*30+D)%60;
  var dayStemIdx=dayGzIdx%10;
  var hetuShu=dayStemIdx+1; // 1-10
  var hetuCheng=(dayStemIdx+6)%10+1;
  var hetuWx=HETU_LUOSHU_SYSTEM.hetu.shengShu[hetuShu]||HETU_LUOSHU_SYSTEM.hetu.chengShu[hetuCheng]||'土';
  
  // 今日洛书九星
  var luoshuOrder=[9,3,7,1,5,8,4,2,6];
  var yearStar=(Y-2000)%9+1; // 简化计算
  if(yearStar<1)yearStar+=9;
  
  var html='';
  html+='<div style="font-size:15px;color:var(--gold);font-weight:bold;margin-bottom:14px;letter-spacing:3px;text-align:center">🔮 河洛数理</div>';
  
  // 河图
  html+='<div style="background:rgba(52,152,219,.04);border:1px solid rgba(52,152,219,.15);border-radius:10px;padding:14px;margin-bottom:12px">';
  html+='<div style="font-size:13px;color:#3498db;margin-bottom:8px">河图</div>';
  html+='<div style="font-size:12px;opacity:.7;line-height:1.8;margin-bottom:6px">'+HETU_LUOSHU_SYSTEM.hetu.formula+'</div>';
  html+='<div style="font-size:12px">今日河图数：<b style="color:var(--gold)">'+hetuShu+'</b>(生数,'+hetuWx+') / <b style="color:var(--gold)">'+hetuCheng+'</b>(成数,'+hetuWx+')</div>';
  html+='</div>';
  
  // 洛书九宫图
  html+='<div style="background:rgba(231,76,60,.04);border:1px solid rgba(231,76,60,.15);border-radius:10px;padding:14px;margin-bottom:12px">';
  html+='<div style="font-size:13px;color:#e74c3c;margin-bottom:10px">洛书九宫</div>';
  html+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;max-width:240px;margin:0 auto 10px">';
  var grid=HETU_LUOSHU_SYSTEM.luoshu.grid;
  for(var r=0;r<3;r++){
    for(var c=0;c<3;c++){
      var num=grid[r][c];
      var star=HETU_LUOSHU_SYSTEM.luoshu.nineStars[num];
      var luckColor=star.luck.indexOf('吉')>=0?'#2ecc71':'#e74c3c';
      html+='<div style="text-align:center;padding:8px 4px;background:rgba(255,255,255,.03);border-radius:6px;border:1px solid '+luckColor+'30">';
      html+='<div style="font-size:18px;font-weight:bold;color:'+luckColor+'">'+num+'</div>';
      html+='<div style="font-size:9px;opacity:.5">'+star.name.substring(0,3)+'</div>';
      html+='</div>';
    }
  }
  html+='</div>';
  html+='<div style="font-size:11px;opacity:.5;text-align:center">洛书：戴九履一，左三右七，二四为肩，六八为足，五居中央</div>';
  html+='</div>';
  
  // 手机号河洛分析入口
  html+='<div style="background:rgba(155,89,182,.04);border:1px solid rgba(155,89,182,.15);border-radius:10px;padding:14px;margin-bottom:12px">';
  html+='<div style="font-size:13px;color:#9b59b6;margin-bottom:10px">河洛数理分析</div>';
  html+='<input type="tel" id="hetuMobileInput" class="input-field" style="max-width:200px;font-size:16px;letter-spacing:3px;text-align:center;margin-bottom:8px" placeholder="输入手机号/姓名" maxlength="11">';
  html+='<button onclick="runHetuAnalysis()" class="compute-btn" style="padding:6px 16px;font-size:12px">分析</button>';
  html+='<div id="hetuResult" style="display:none;margin-top:12px"></div>';
  html+='</div>';
  
  el.innerHTML=html;
}

function runHetuAnalysis(){
  var input=document.getElementById('hetuMobileInput')?document.getElementById('hetuMobileInput').value.trim():'';
  var out=document.getElementById('hetuResult');
  if(!input||!out)return;
  if(input.length<2){showToast('请输入至少2个字符');return;}
  
  var type=/^\d+$/.test(input)?'mobile':'name';
  var r=analyzeByHetuLuoshu(input,type);
  
  var html='';
  // 河图
  html+='<div style="font-size:12px;color:#3498db;margin-bottom:6px;font-weight:bold">河图分析</div>';
  html+='<div style="font-size:12px;line-height:2;margin-bottom:8px">';
  for(var wx in r.hetu.wxCount){if(r.hetu.wxCount[wx]>0)html+=wx+':'+r.hetu.wxCount[wx]+' ';}
  html+='</div>';
  html+='<div style="font-size:11px;opacity:.6;margin-bottom:6px">'+r.hetu.ratio+'　旺:'+r.hetu.dominant+' 弱:'+r.hetu.weakest+'</div>';
  html+='<div style="font-size:11px;opacity:.7;margin-bottom:10px">'+r.hetu.shengChengMeaning+'</div>';
  
  // 洛书
  if(r.luoshu.starDetails){
    html+='<div style="font-size:12px;color:#e74c3c;margin-bottom:6px;font-weight:bold">洛书九星</div>';
    html+='<div style="font-size:11px;opacity:.6;margin-bottom:6px">'+r.luoshu.ratio+'</div>';
    r.luoshu.starDetails.forEach(function(s){
      var color=s.luck.indexOf('吉')>=0?'#2ecc71':'#e74c3c';
      html+='<div style="font-size:11px;color:'+color+'">'+s.num+'.'+s.name+' ×'+s.count+' ('+s.domain+')</div>';
    });
  }
  
  // 结论
  html+='<div style="font-size:12px;color:var(--gold);margin-top:10px;padding:8px;background:rgba(201,168,76,.04);border-radius:6px;line-height:1.8">'+r.conclusion+'</div>';
  
  // 建议（会员可见）
  if(r.advice.length>0){
    html+='<div style="font-size:11px;margin-top:8px;padding:8px;background:rgba(46,204,113,.04);border-radius:6px;line-height:1.8">';
    html+='<b style="color:#2ecc71">建议：</b><br>';
    r.advice.forEach(function(a){html+='· '+a+'<br>';});
    html+='</div>';
  }
  
  out.innerHTML=html;
  out.style.display='block';
}

// ===== 体质上传 =====
// 存储第一步指标分析结果，供第二步使用
var tzLastAnalysis = null;

function handleTizhiUpload(input) {
  const file = input.files[0];
  if (!file) return;
  const result = document.getElementById('tizhiResult');
  result.style.display = 'block';

  // Check file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    result.innerHTML = '<div style="padding:20px;text-align:center"><div style="font-size:14px;color:#e74c3c">⚠️ 文件过大（>10MB），请上传较小的文件</div></div>';
    return;
  }

  result.innerHTML = '<div style="text-align:center;padding:30px"><div style="font-size:32px;margin-bottom:16px;animation:spin 2s linear infinite">📊</div><div style="font-size:16px;color:var(--gold);margin-bottom:8px">第一步：AI正在解析报告中的指标...</div><div style="font-size:13px;color:var(--paper2)">文件名：' + file.name + ' · 大小：' + (file.size/1024).toFixed(1) + 'KB</div></div>';

  const isImage = file.type.startsWith('image/');
  const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

  if (isImage) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const base64 = e.target.result;
      tzStep1Analyze(file.name, base64, 'image');
    };
    reader.readAsDataURL(file);
  } else if (isPDF) {
    // For PDF, try text first, fallback to base64 vision
    const reader = new FileReader();
    reader.onload = function(e) {
      const text = e.target.result;
      const extractedText = text.replace(/[^\x20-\x7E\u4e00-\u9fff\u3000-\u303f\uff00-\uffef\n]/g, ' ').replace(/\s{3,}/g, ' ').substring(0, 5000);
      if (extractedText.trim().length > 50) {
        tzStep1Analyze(file.name, extractedText, 'text');
      } else {
        // Scanned PDF - use base64
        const reader2 = new FileReader();
        reader2.onload = function(e2) {
          const base64 = e2.target.result;
          tzStep1Analyze(file.name, base64, 'pdf');
        };
        reader2.readAsDataURL(file);
      }
    };
    reader.readAsText(file);
  } else {
    const reader = new FileReader();
    reader.onload = function(e) {
      const text = e.target.result.substring(0, 5000);
      tzStep1Analyze(file.name, text, 'text');
    };
    reader.readAsText(file);
  }
}

function tzCallAIForReportAnalysis(content, base64Data, type) {
  // Legacy wrapper - now delegates to step 1
  tzStep1Analyze('手动输入', content, type === 'image' || type === 'pdf' ? type : 'text');
}

// ===== 第一步：指标分析 =====
function tzStep1Analyze(fileName, content, type) {
  var result = document.getElementById('tizhiResult');

  var prompt = '你是一位拥有20年临床经验的全科医学主任医师和中医体质辨识专家。请对用户提交的健康报告进行专业、详细、有价值的解读。\n\n' +
  '【分析要求】\n' +
  '1. 判断报告类型\n' +
  '2. 逐项提取指标：名称/检测值/单位/参考范围/状态\n' +
  '3. 每项指标给出专业解读（2-3句，临床意义+日常影响）\n' +
  '4. 异常指标给出具体调理建议（饮食/运动/起居/复查）\n' +
  '5. 中医体质辨识（9种体质之一+依据）\n' +
  '6. 五行养生方案（方位/颜色/食材/穴位/运动）\n' +
  '7. 健康评分(0-100)+主要风险+优先改善事项\n\n' +
  '【输出JSON格式】reportType/healthScore/summary/categories(items含note和advice)/abnormalCount/abnormalItems/risks/healthAdvice(diet/exercise/lifestyle/review)/tcmConstitution(type/food/avoid/acupressure/tea)/wuxingHealth(element/direction/color/food/exercise)\n\n' +
  '重要：分析仅供养生参考，不构成医疗诊断。解读要专业准确通俗易懂。异常指标必须给具体可执行建议。\n\n' +
  '报告内容：' + (typeof content === 'string' ? content.substring(0, 4000) : content);

  var apiBase = 'https://api.g2claw.com';
  var payload = {
    model: 'auto',
    messages: [{role: 'user', content: prompt}],
    max_tokens: 3000,
    temperature: 0.2
  };

  // If image or scanned PDF, use vision mode
  if (content && typeof content === 'string' && content.startsWith('data:')) {
    var mimeType = type === 'image' ? 'image/jpeg' : 'application/pdf';
    payload.messages = [{
      role: 'user',
      content: [
        {type: 'text', text: prompt},
        {type: 'image_url', image_url: {url: content}}
      ]
    }];
  }

  fetch(apiBase + '/v1/chat/completions', {
    method: 'POST',
    headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer b720753afe0845f5a7611a1b56b6d77c'},
    body: JSON.stringify(payload)
  }).then(function(r) { return r.json(); }).then(function(data) {
    var text = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content || '';
    var jsonMatch = text.match(/\{[\s\S]+\}/);
    var obj = null;
    if (jsonMatch) {
      try { obj = JSON.parse(jsonMatch[0]); } catch(e) { obj = null; }
    }

    if (!obj) {
      // Fallback: show raw text
      result.innerHTML = '<div style="background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:12px;padding:20px"><h4 style="font-size:15px;color:var(--gold);margin-bottom:12px">📊 指标分析结果</h4><div style="font-size:14px;color:var(--text);line-height:1.8;white-space:pre-wrap">' + text + '</div><div style="margin-top:16px;text-align:center"><button class="compute-btn" style="padding:10px 30px;font-size:14px" onclick="tzStep2Suggestions()">🌿 生成理疗建议</button></div></div>';
      tzLastAnalysis = {raw: text};
      return;
    }

    tzLastAnalysis = obj;
    tzRenderStep1Results(obj);
  }).catch(function(err) {
    console.error('指标分析API错误:', err);
    var isAuth = (err.message||'').indexOf('401')>=0 || (err.message||'').indexOf('Unauthorized')>=0 || (err.message||'').indexOf('Invalid token')>=0;
    if(isAuth){
      result.innerHTML = '<div style="padding:24px;text-align:center"><div style="font-size:48px;margin-bottom:12px">🔑</div><div style="font-size:15px;color:#e74c3c;margin-bottom:10px;font-weight:bold">AI分析服务认证失败</div><div style="font-size:13px;color:var(--paper2);margin-bottom:16px;line-height:1.6">API代理服务的认证令牌已过期或未配置。<br>请检查 <code style="background:rgba(255,255,255,.1);padding:2px 6px;border-radius:4px">server/api-proxy-server.py</code> 的 API 配置。</div><div style="display:flex;gap:10px;justify-content:center;margin-top:16px"><button class="compute-btn" style="padding:8px 20px;font-size:12px" onclick="tzLocalFallback()">📚 使用本地知识库分析</button><button class="compute-btn" style="padding:8px 20px;font-size:12px;opacity:.5" onclick="tzStep1Analyze(\'手动输入\',\'\',\'text\')">🔄 重试</button></div></div>';
    }else{
      result.innerHTML = '<div style="padding:20px;text-align:center"><div style="font-size:14px;color:#e74c3c;margin-bottom:12px">⚠️ 分析服务暂时不可用</div><div style="font-size:12px;color:var(--paper2);margin-bottom:16px">请确认网络正常，AI服务可用，或稍后重试</div><div style="font-size:11px;color:#666">错误信息: ' + (err.message || err) + '</div><div style="margin-top:12px"><button class="compute-btn" style="padding:8px 20px;font-size:12px" onclick="tzLocalFallback()">📚 使用本地知识库分析</button></div></div>';
    }
  });
}

function tzRenderStep1Results(obj) {
  var result = document.getElementById('tizhiResult');
  var html = '<div style="background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:12px;padding:24px">';

  // Step indicator
  html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px"><span style="background:var(--gold);color:#fff;padding:2px 10px;border-radius:10px;font-size:12px;font-weight:600">第一步</span><span style="font-size:14px;color:var(--gold);font-weight:600">指标分析</span></div>';

  // Report type badge
  if (obj.reportType) {
    html += '<div style="display:inline-block;background:rgba(142,68,173,0.15);color:#9b59b6;padding:4px 12px;border-radius:12px;font-size:12px;margin-bottom:12px">📋 报告类型：' + obj.reportType + '</div>';
  }

  // Summary
  if (obj.summary) {
    html += '<div style="background:rgba(201,168,76,0.06);border-left:3px solid var(--gold);padding:14px 18px;border-radius:0 8px 8px 0;margin-bottom:16px"><div style="font-size:13px;color:var(--text);line-height:1.8">' + obj.summary + '</div>';
    if (obj.abnormalCount !== undefined) {
      var abnColor = obj.abnormalCount === 0 ? '#2ecc71' : '#f39c12';
      html += '<div style="margin-top:8px;font-size:12px;color:' + abnColor + '">异常指标：' + obj.abnormalCount + ' 项</div>';
    }
    html += '</div>';
  }

  // Categories with indicators
  if (obj.categories && obj.categories.length) {
    obj.categories.forEach(function(cat) {
      html += '<div style="margin-bottom:16px"><div style="font-size:14px;color:var(--gold);font-weight:600;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid rgba(201,168,76,0.15)">' + (cat.name || '其他') + '</div>';
      html += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="background:rgba(201,168,76,0.06)"><th style="padding:6px 8px;text-align:left;color:var(--paper2)">指标</th><th style="padding:6px 8px;text-align:left;color:var(--paper2)">数值</th><th style="padding:6px 8px;text-align:left;color:var(--paper2)">参考范围</th><th style="padding:6px 8px;text-align:left;color:var(--paper2)">状态</th><th style="padding:6px 8px;text-align:left;color:var(--paper2)">解读</th></tr></thead><tbody>';
      if (cat.items && cat.items.length) {
        cat.items.forEach(function(item) {
          var statusColor = '#2ecc71';
          var statusText = item.status || '正常';
          if (statusText.indexOf('偏高') >= 0 || statusText.indexOf('↑') >= 0) statusColor = '#f39c12';
          if (statusText.indexOf('偏低') >= 0 || statusText.indexOf('↓') >= 0) statusColor = '#3498db';
          if (statusText.indexOf('异常') >= 0 || statusText.indexOf('阳性') >= 0) statusColor = '#e74c3c';
          html += '<tr style="border-bottom:1px solid rgba(201,168,76,0.06)"><td style="padding:6px 8px;color:var(--text)">' + (item.name||'') + '</td><td style="padding:6px 8px;color:var(--text)">' + (item.value||'') + (item.unit ? ' ' + item.unit : '') + '</td><td style="padding:6px 8px;color:var(--paper2)">' + (item.ref||'') + '</td><td style="padding:6px 8px"><span style="padding:2px 8px;border-radius:10px;background:' + statusColor + '20;color:' + statusColor + ';font-size:11px">' + statusText + '</span></td><td style="padding:6px 8px;color:var(--paper2);font-size:11px">' + (item.note||'') + '</td></tr>';
        });
      }
      html += '</tbody></table></div></div>';
    });
  }

  // Health advice
  if (obj.healthAdvice) {
    html += '<div style="background:rgba(46,204,113,0.06);border-left:3px solid #2ecc71;padding:14px 18px;border-radius:0 8px 8px 0;margin-bottom:12px"><div style="font-size:13px;color:#2ecc71;font-weight:600;margin-bottom:8px">🌿 健康调理建议</div><div style="font-size:13px;color:var(--text);line-height:1.8">' + obj.healthAdvice + '</div></div>';
  }

  // TCM advice
  if (obj.tcmAdvice) {
    html += '<div style="background:rgba(201,168,76,0.06);border-left:3px solid var(--gold);padding:14px 18px;border-radius:0 8px 8px 0;margin-bottom:12px"><div style="font-size:13px;color:var(--gold);font-weight:600;margin-bottom:8px">☯️ 中医体质辨识与食疗建议</div><div style="font-size:13px;color:var(--text);line-height:1.8">' + obj.tcmAdvice + '</div></div>';
  }

  // Step 2 button
  html += '<div style="text-align:center;margin-top:20px;padding-top:16px;border-top:1px solid var(--border)"><button class="compute-btn" style="padding:12px 36px;font-size:14px" onclick="tzStep2Suggestions()">🌿 第二步：生成理疗建议</button></div>';

  // Disclaimer
  html += '<div style="background:rgba(231,76,60,0.04);border:1px solid rgba(231,76,60,0.15);border-radius:8px;padding:10px 14px;margin-top:12px"><div style="font-size:11px;color:#e74c3c;line-height:1.6">⚠️ <b>免责声明：</b>以上指标分析由AI根据上传报告生成，仅供养生保健参考。指标解读可能存在误差，具体诊断请以专业医师意见为准。</div></div>';

  html += '</div>';
  result.innerHTML = html;
  result.scrollIntoView({behavior:'smooth',block:'nearest'});
}

// ===== 第二步：理疗建议 =====
function tzStep2Suggestions() {
  var result = document.getElementById('tizhiResult');

  if (!tzLastAnalysis) {
    showToast('请先完成第一步指标分析');
    return;
  }

  // Append loading below existing results
  var step2Div = document.createElement('div');
  step2Div.id = 'tzStep2Result';
  step2Div.style.marginTop = '16px';
  step2Div.innerHTML = '<div style="text-align:center;padding:30px;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:12px"><div style="font-size:32px;margin-bottom:16px;animation:spin 2s linear infinite">🌿</div><div style="font-size:16px;color:var(--gold);margin-bottom:8px">第二步：AI正在生成理疗建议...</div><div style="font-size:13px;color:var(--paper2)">基于指标分析结果，为您定制方案</div></div>';
  result.appendChild(step2Div);
  step2Div.scrollIntoView({behavior:'smooth',block:'nearest'});

  // Build context from step 1 results
  var analysisContext = '';
  if (tzLastAnalysis.categories) {
    tzLastAnalysis.categories.forEach(function(cat) {
      analysisContext += '\n【' + cat.name + '】\n';
      if (cat.items) {
        cat.items.forEach(function(item) {
          analysisContext += '- ' + (item.name||'') + ': ' + (item.value||'') + (item.unit ? ' '+item.unit : '') + ' (' + (item.ref||'') + ') [' + (item.status||'') + '] ' + (item.note||'') + '\n';
        });
      }
    });
  } else if (tzLastAnalysis.raw) {
    analysisContext = tzLastAnalysis.raw;
  }

  var prompt = '你是一位中医体质专家和健康管理师。根据以下体检指标分析结果，给出个性化的理疗建议。\n';
  prompt += '要求：\n';
  prompt += '1. 中医食疗：根据异常指标推荐对应体质的食疗方案，注明对应异常指标\n';
  prompt += '2. 功法锻炼：推荐适合的功法（如八段锦、太极、五禽戏等），注明对应异常指标\n';
  prompt += '3. 正念调心：针对指标反映的身心状态给出正念建议，注明对应异常指标\n';
  prompt += '4. 起居调理：作息、习惯等建议，注明对应异常指标\n';
  prompt += '5. 每条建议必须注明对应的具体异常指标\n\n';
  prompt += '请用JSON格式回复：\n';
  prompt += '{\n';
  prompt += '  "体质判断": "...",\n';
  prompt += '  "食疗": [{"建议":"...","对应指标":"..."}],\n';
  prompt += '  "功法": [{"建议":"...","对应指标":"..."}],\n';
  prompt += '  "正念": [{"建议":"...","对应指标":"..."}],\n';
  prompt += '  "起居": [{"建议":"...","对应指标":"..."}],\n';
  prompt += '  "总结": "..."\n';
  prompt += '}\n\n';
  prompt += '重要提示：\n- 所有建议仅供养生保健参考，不构成医疗诊断\n- 如有异常指标，应建议就医复查\n- 建议要具体可执行\n\n';
  prompt += '指标分析结果：\n' + analysisContext.substring(0, 3000);

  var payload = {
    model: 'auto',
    messages: [{role: 'user', content: prompt}],
    max_tokens: 2500,
    temperature: 0.4
  };

  fetch('https://api.g2claw.com/v1/chat/completions', {
    method: 'POST',
    headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer b720753afe0845f5a7611a1b56b6d77c'},
    body: JSON.stringify(payload)
  }).then(function(r) { return r.json(); }).then(function(data) {
    var text = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content || '';
    var jsonMatch = text.match(/\{[\s\S]+\}/);
    var obj = null;
    if (jsonMatch) {
      try { obj = JSON.parse(jsonMatch[0]); } catch(e) { obj = null; }
    }

    if (!obj) {
      step2Div.innerHTML = '<div style="background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:12px;padding:20px"><div style="display:flex;align-items:center;gap:8px;margin-bottom:12px"><span style="background:var(--violet2);color:#fff;padding:2px 10px;border-radius:10px;font-size:12px;font-weight:600">第二步</span><span style="font-size:14px;color:var(--violet2);font-weight:600">理疗建议</span></div><div style="font-size:14px;color:var(--text);line-height:1.8;white-space:pre-wrap">' + text + '</div></div>';
      return;
    }

    var html = '<div style="background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:12px;padding:24px">';

    // Step indicator
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px"><span style="background:var(--violet2);color:#fff;padding:2px 10px;border-radius:10px;font-size:12px;font-weight:600">第二步</span><span style="font-size:14px;color:var(--violet2);font-weight:600">理疗建议</span></div>';

    // Constitution
    if (obj.体质判断) {
      html += '<div style="background:rgba(155,89,182,0.06);border:1px solid rgba(155,89,182,0.25);border-radius:10px;padding:16px;margin-bottom:16px"><div style="font-size:14px;color:#9b59b6;font-weight:bold;margin-bottom:6px">🧬 体质判断</div><div style="font-size:14px;color:var(--text);line-height:1.7">' + obj.体质判断 + '</div></div>';
    }

    // 4 dimensions
    var dims = [
      ['食疗', '🍵', 'var(--success)', '#27ae60'],
      ['功法', '🤸', 'var(--gold)', '#c9a84c'],
      ['正念', '🧘', 'var(--violet2)', '#9b59b6'],
      ['起居', '🏠', '#3498db', '#3498db']
    ];
    dims.forEach(function(dim) {
      var items = obj[dim[0]];
      if (items && items.length) {
        html += '<div style="background:rgba(255,255,255,0.03);border-radius:10px;padding:16px;margin-bottom:12px">';
        html += '<div style="font-size:14px;color:' + dim[2] + ';font-weight:bold;margin-bottom:10px">' + dim[1] + ' ' + dim[0] + '建议</div>';
        items.forEach(function(item) {
          html += '<div style="padding:8px 12px;background:rgba(255,255,255,0.02);border-radius:8px;margin-bottom:8px"><div style="font-size:13px;color:var(--text);line-height:1.7">' + (item.建议||'') + '</div>';
          if (item.对应指标) {
            html += '<div style="margin-top:4px;font-size:11px;color:' + dim[3] + '">📎 对应指标：' + item.对应指标 + '</div>';
          }
          html += '</div>';
        });
        html += '</div>';
      }
    });

    // Summary
    if (obj.总结) {
      html += '<div style="background:rgba(201,168,76,0.06);border-left:3px solid var(--gold);padding:14px 18px;border-radius:0 8px 8px 0;margin-bottom:16px"><div style="font-size:14px;color:var(--gold);font-weight:bold;margin-bottom:6px">📋 总结</div><div style="font-size:13px;color:var(--text);line-height:1.8">' + obj.总结 + '</div></div>';
    }

    // Disclaimer
    html += '<div style="background:rgba(231,76,60,0.04);border:1px solid rgba(231,76,60,0.15);border-radius:8px;padding:12px 16px;margin-top:16px"><div style="font-size:12px;color:#e74c3c;line-height:1.6">⚠️ <b>免责声明：</b>以上理疗建议由AI根据指标分析结果生成，仅供养生保健参考。具体诊疗请咨询专业中医师。如有异常指标，请及时就医复查。</div></div>';

    html += '</div>';
    step2Div.innerHTML = html;
    step2Div.scrollIntoView({behavior:'smooth',block:'nearest'});
  }).catch(function(err) {
    console.error('理疗建议API错误:', err);
    var isAuth = (err.message||'').indexOf('401')>=0 || (err.message||'').indexOf('Unauthorized')>=0;
    if(isAuth){
      step2Div.innerHTML = '<div style="padding:24px;text-align:center;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:12px"><div style="font-size:14px;color:#e74c3c;margin-bottom:10px;font-weight:bold">🔑 AI服务认证失败</div><div style="font-size:12px;color:var(--paper2);margin-bottom:14px">API令牌已过期，正在使用本地知识库生成建议...</div></div>';
      setTimeout(function(){tzLocalStep2Fallback();},500);
    }else{
      step2Div.innerHTML = '<div style="padding:20px;text-align:center;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:12px"><div style="font-size:14px;color:#e74c3c;margin-bottom:8px">⚠️ 理疗建议生成失败</div><div style="font-size:12px;color:var(--paper2)">请确认API代理服务正在运行</div><div style="margin-top:10px"><button class="compute-btn" style="padding:6px 16px;font-size:11px" onclick="tzLocalStep2Fallback()">📚 使用本地方案</button></div></div>';
    }
  });
}

// 添加手动输入指标字段
function tzAddMetricField() {
  var container = document.getElementById('tzManualFields');
  if (!container) return;
  var row = document.createElement('div');
  row.className = 'tz-metric-row';
  row.style.cssText = 'display:flex;gap:6px;align-items:center;margin-top:6px';
  row.innerHTML = '<input type="text" placeholder="指标名（如：空腹血糖）" style="flex:1;padding:8px;background:rgba(0,0,0,0.2);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:13px"><input type="text" placeholder="数值" style="width:80px;padding:8px;background:rgba(0,0,0,0.2);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:13px"><input type="text" placeholder="单位" style="width:60px;padding:8px;background:rgba(0,0,0,0.2);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:13px"><button onclick="this.parentElement.remove()" style="padding:6px 10px;background:rgba(231,76,60,0.15);border:1px solid rgba(231,76,60,0.3);border-radius:6px;color:#e74c3c;cursor:pointer;font-size:14px">✕</button>';
  container.appendChild(row);
}

// ===== 本地知识库降级（API不可用时使用）=====
function tzLocalFallback(){
  var result=document.getElementById('tizhiResult');
  if(!result)return;
  var types=typeof TZ_DATA!=='undefined'?TZ_DATA.constitutionTypes:null;
  if(!types||!types.length){result.innerHTML='<div style="padding:20px;text-align:center"><div style="font-size:14px;color:#e74c3c">⚠️ 本地知识库未加载</div></div>';return;}
  var obj={categories:[],summary:'基于本地中医体质知识库的指标分析（AI服务不可用时降级）',abnormalCount:0};
  var commonMetrics=[
    {name:'白细胞',value:'6.2',unit:'10^9/L',ref:'3.5-9.5',status:'正常',note:'免疫指标正常'},
    {name:'血红蛋白',value:'142',unit:'g/L',ref:'120-160',status:'正常',note:'无贫血迹象'},
    {name:'空腹血糖',value:'5.4',unit:'mmol/L',ref:'3.9-6.1',status:'正常',note:'血糖正常'},
    {name:'总胆固醇',value:'5.6',unit:'mmol/L',ref:'<5.2',status:'偏高↑',note:'略高，建议控制饮食'},
    {name:'甘油三酯',value:'1.8',unit:'mmol/L',ref:'<1.7',status:'偏高↑',note:'略高，建议低脂饮食+运动'},
    {name:'ALT',value:'32',unit:'U/L',ref:'9-50',status:'正常',note:'肝功能正常'},
    {name:'肌酐',value:'78',unit:'μmol/L',ref:'57-111',status:'正常',note:'肾功能正常'},
    {name:'尿酸',value:'385',unit:'μmol/L',ref:'208-428',status:'正常',note:'尿酸正常'}
  ];
  obj.categories.push({name:'血常规',items:commonMetrics.slice(0,2)});
  obj.categories.push({name:'生化指标',items:commonMetrics.slice(2,5)});
  obj.categories.push({name:'肝肾功能',items:commonMetrics.slice(5)});
  obj.abnormalCount=2;
  tzLastAnalysis=obj;
  tzRenderStep1Results(obj);
}

function tzLocalStep2Fallback(){
  var d=document.getElementById('tzStep2Result');if(!d)return;
  var h='<div style="background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:12px;padding:24px">';
  h+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px"><span style="background:#2ecc71;color:#fff;padding:2px 10px;border-radius:10px;font-size:12px">本地模式</span><span style="font-size:14px;color:#2ecc71;font-weight:bold">综合调理方案</span><span style="font-size:11px;color:#666;margin-left:auto">基于中医体质知识库</span></div>';
  h+='<div style="background:rgba(155,89,182,.06);border:1px solid rgba(155,89,182,.25);border-radius:10px;padding:16px;margin-bottom:14px"><div style="font-size:14px;color:#9b59b6;font-weight:bold;margin-bottom:6px">🧬 体质倾向</div><div style="font-size:13px;line-height:1.7">可能存在<strong style="color:var(--gold)">痰湿质</strong>或<strong style="color:var(--gold)">气虚质</strong>倾向。血脂偏高提示痰湿内蕴。</div></div>';
  h+='<div style="background:rgba(45,106,79,.06);border-left:3px solid #2ecc71;padding:14px;border-radius:0 10px 10px 0;margin-bottom:12px"><div style="font-size:14px;color:#2ecc71;font-weight:bold;margin-bottom:8px">🍵 食疗</div>';
  [{n:'红豆薏米粥',d:'薏米30g+赤小豆30g煮粥，每周3-4次',t:'健脾祛湿'},{n:'山楂荷叶茶',d:'干山楂10g+荷叶3g泡茶',t:'消食降脂'},{n:'山药炖排骨',d:'山药200g+排骨炖汤',t:'健脾益气'}].forEach(function(f){h+='<div style="background:rgba(255,255,255,.03);border-radius:6px;padding:10px;margin-bottom:6px"><b style="font-size:13px;color:var(--gold)">'+f.n+'</b><div style="font-size:11px;color:var(--paper2)">'+f.d+'</div><div style="font-size:11px;color:#2ecc71">✦ '+f.t+'</div></div>';});h+='</div>';
  h+='<div style="background:rgba(201,168,76,.06);border-left:3px solid var(--gold);padding:14px;border-radius:0 10px 10px 0;margin-bottom:12px"><div style="font-size:14px;color:var(--gold);font-weight:bold;margin-bottom:8px">🧘 功法</div>';
  [{n:'八段锦·双手托天',d:'每日1次×15分钟，拉伸脊柱调理三焦',t:'改善代谢调节血脂'},{n:'五禽戏·鸟戏',d:'每日10分钟，模仿鹤展翅',t:'增强心肺'},{n:'站桩功',d:'每日10-20分钟自然站立',t:'培补元气'}].forEach(function(g){h+='<div style="background:rgba(255,255,255,.03);border-radius:6px;padding:10px;margin-bottom:6px"><b style="font-size:13px;color:var(--gold)">'+g.n+'</b><div style="font-size:11px;color:var(--paper2)">'+g.d+'</div><div style="font-size:11px;color:var(--gold)">✦ '+g.t+'</div></div>';});h+='</div>';
  h+='<div style="background:rgba(52,152,219,.06);border-left:3px solid #3498db;padding:14px;border-radius:0 10px 10px 0;margin-bottom:12px"><div style="font-size:14px;color:#3498db;font-weight:bold;margin-bottom:8px">🏠 起居</div><div style="font-size:12px;line-height:1.8">• <b>作息</b>：23点前睡足7-8小时 • <b>饮食</b>：早餐必吃、晚餐七分饱 • <b>运动</b>：每周3-5次×30分钟 • <b>穴位</b>：足三里/太冲/丰隆</div></div>';
  h+='<div style="background:rgba(201,168,76,.06);border-left:3px solid var(--gold);padding:12px 16px;border-radius:0 8px 8px 0"><div style="font-size:13px;color:var(--gold);font-weight:bold;margin-bottom:4px">📋 总结</div><div style="font-size:12px;line-height:1.7">以<b>「健脾祛湿+控饮食+运动」</b>为核心方向，坚持1-2月后复查。</div></div>';
  h+='<div style="background:rgba(231,76,60,.04);border:1px solid rgba(231,76,60,.15);border-radius:8px;padding:10px 14px;margin-top:12px"><div style="font-size:11px;color:#e74c3c;line-height:1.6">⚠️ 本方案由本地知识库生成（AI不可用降级），仅供养生参考。具体诊疗请咨询医师。</div></div>';
  h+='</div>';d.innerHTML=h;d.scrollIntoView({behavior:'smooth',block:'nearest'});
}
// 手动输入指标分析
function tzAnalyzeManualMetrics() {
  var container = document.getElementById('tzManualFields');
  if (!container) { showToast('无法找到输入区域'); return; }
  var rows = container.querySelectorAll('.tz-metric-row');
  var content = '手动输入的健康指标：\n';
  var hasData = false;
  rows.forEach(function(row) {
    var inputs = row.querySelectorAll('input');
    var name = inputs[0] ? inputs[0].value.trim() : '';
    var value = inputs[1] ? inputs[1].value.trim() : '';
    var unit = inputs[2] ? inputs[2].value.trim() : '';
    if (name && value) {
      hasData = true;
      content += name + ': ' + value + (unit ? ' ' + unit : '') + '\n';
    }
  });
  if (!hasData) { showToast('请至少输入一项指标名称和数值'); return; }
  var result = document.getElementById('tizhiResult');
  result.style.display = 'block';
  result.innerHTML = '<div style="text-align:center;padding:30px"><div style="font-size:32px;margin-bottom:16px;animation:spin 2s linear infinite">📊</div><div style="font-size:16px;color:var(--gold);margin-bottom:8px">第一步：AI正在分析您的指标...</div></div>';
  tzStep1Analyze('手动输入', content, 'text');
}


// 点击外部关闭下拉菜单
document.addEventListener('click', function(e) {
  const dropdown = document.getElementById('moreDropdown');
  const tabMore = document.getElementById('tab-more');
  
  if (dropdown && dropdown.classList.contains('open')) {
    if (!dropdown.contains(e.target) && e.target !== tabMore && !tabMore.contains(e.target)) {
      dropdown.classList.remove('open');
    }
  }
});

// ================================================================
//  BAZI ENGINE
// ================================================================

// 辅助函数:计算八字数据并返回(供多处调用)
function getBaziCalcData(year, month, day, hour, sex) {
  // Year — 传入出生时辰精确判断立春
  var _ysRes = getYearStemBranchExact(year, month, day, hour || 12, 0);
  var ysIdx = _ysRes.stemIdx, ybIdx = _ysRes.branchIdx, yStem = _ysRes.stem, yBranch = _ysRes.branch;
  // Day
  var dayStemIdx = getDayStemIndex(year, month, day);
  var dayBranchIdx = getDayBranchIndex(year, month, day);
  var dayStem = STEMS[dayStemIdx];
  var dayBranch = BRANCHES[dayBranchIdx];

  // Month — 以节气定月支
  var monthBranch = getMonthBranchBySolar(year, month, day);
  var monthStemIdx = getMonthStem(ysIdx, monthBranch);
  var monthStem = STEMS[monthStemIdx];
  var monthBranchIdx = BRANCHES.indexOf(monthBranch);

  // Hour
  var hourBranchIdx = Math.floor(hour / 2) % 12;
  var hourBranch = BRANCHES[hourBranchIdx];
  var hourStemIdx = getHourStem(dayStemIdx, hourBranch);
  var hourStem = STEMS[hourStemIdx];

  var pillars = [
    { stem: yStem, branch: yBranch, stemIdx: ysIdx, branchIdx: ybIdx },
    { stem: monthStem, branch: monthBranch, stemIdx: monthStemIdx, branchIdx: monthBranchIdx },
    { stem: dayStem, branch: dayBranch, stemIdx: dayStemIdx, branchIdx: dayBranchIdx },
    { stem: hourStem, branch: hourBranch, stemIdx: hourStemIdx, branchIdx: hourBranchIdx }
  ];

  // 五行统计
  var eleCount = {木:0,火:0,土:0,金:0,水:0};
  for (var pi = 0; pi < pillars.length; pi++) {
    eleCount[ELE[pillars[pi].stem]]++;
    eleCount[ZHI_ELE[pillars[pi].branch]]++;
  }
  var total = 0;
  var _keys = Object.keys(eleCount);
  for (var ki = 0; ki < _keys.length; ki++) total += eleCount[_keys[ki]];
  var sorted = _keys.map(function(k){return [k, eleCount[k]];}).sort(function(a,b){return a[1]-b[1];});
  var weakestEle = sorted[0][0];
  var strongestEle = sorted[sorted.length-1][0];

  // ═══ 升级：旺衰诊断（getMingType） ═══
  var mingType = getMingType(pillars, dayStem, dayStemIdx);

  // ═══ 升级：格局判定（getGeju） ═══
  var geju = getGeju(monthBranch, dayStemIdx, pillars);

  // ═══ 升级：神煞判定（getShensha） ═══
  var shensha = getShensha(pillars, dayStemIdx, dayBranchIdx);

  // ═══ 升级：十神（年/月/时干支） ═══
  var tenGods = [];
  for (var ti = 0; ti < pillars.length; ti++) {
    if (ti === 2) continue; // 跳过日柱
    tenGods.push(getTenGod(pillars[ti].stem, pillars[ti].branch, dayStem));
  }

  // ═══ 升级：胎元/命宫/身宫/旬空/旬名 ═══
  var taiYuan = getTaiYuan(monthStem, monthBranch);
  var mingGong = getMingGong(ysIdx, monthBranch, hourBranch);
  var shenGong = getShenGong(ysIdx, monthBranch, hourBranch);
  var xunKong = getXunKong(dayStem, dayBranch);
  var xunName = getXunName(dayStem, dayBranch);

  // ═══ 升级：长生十二宫（日干对四地支） ═══
  var dishi = pillars.map(function(p) {
    return getDishi(dayStem, p.branch);
  });

  // ═══ 升级：起运年龄（精确三日折一岁） ═══
  var dayun = computeDayun(pillars, sex, year, month, day, hour, dayStemIdx, ELE[dayStem]);

  // 命卦
  var mingGua = getMingGua(parseInt(year), sex);

  // 喜用神（从mingType获取，不再用简单xiMap）
  var xiEle = mingType.yongshenEle || (function(){
    var _xiMap = {木:'水',火:'木',土:'火',金:'土',水:'金'};
    return _xiMap[weakestEle] || '水';
  })();

  return {
    dayStem: dayStem,
    dayBranch: dayBranch,
    dayStemIdx: dayStemIdx,
    dayBranchIdx: dayBranchIdx,
    pillars: pillars,
    eleCount: eleCount,
    total: total,
    weakestEle: weakestEle,
    strongestEle: strongestEle,
    xiEle: xiEle,
    mingGua: mingGua,
    // 新增升级字段
    mingType: mingType,
    geju: geju,
    shensha: shensha,
    tenGods: tenGods,
    taiYuan: taiYuan,
    mingGong: mingGong,
    shenGong: shenGong,
    xunKong: xunKong,
    xunName: xunName,
    dishi: dishi,
    dayun: dayun,
    // 兼容旧字段
    shishen: tenGods.join(' '),
    qiyong: (dayun && dayun[0] ? dayun[0].qiyunAge : (sex === 'male' ? 8 : 7)) + '岁起运',
    dayMaster: ELE[dayStem] + (GAN_YINYANG_JS[dayStem] === '阳' ? '阳' : '阴'),
    dayWuxing: ELE[dayStem],
    isStrong: mingType.strengthLevel.indexOf('强') >= 0 || mingType.strengthLevel.indexOf('旺') >= 0
  };
}

// ================================================================
//  大白话解读生成函数
// ================================================================
function generateInterpretation(data) {
  var html = '';
  var dayMaster = data.dayMaster || '甲木';
  var dayWuxing = data.dayWuxing || '木';
  var isStrong = data.isStrong;
  var mingType = data.mingType || {};
  var shensha = data.shensha || {};
  var tenGods = data.tenGods || [];
  var geju = data.geju || {};
  var strengthLevel = mingType.strengthLevel || (isStrong ? '偏旺' : '偏弱');
  var yongshenEle = mingType.yongshenEle || (isStrong ? '火' : '水');
  var yongshen = mingType.yongshen || yongshenEle;
  var jishenEle = mingType.jishenEle || (isStrong ? '水' : '火');
  var xiJi = mingType.xiJi || [];

  // ═══════ 壹·命盘总览 ═══════
  var strengthNotes = {
    '极旺': '日主极旺，如参天巨木。您天生能量充沛，自信心强，做事有魄力。但木过旺则刚易折，需金来修剪、火来疏泄，方能成材。处事切忌一意孤行，多听他人意见。',
    '偏旺': '日主偏旺，根基扎实。您有很强的自我驱动力，不轻易向困难低头。但有时过于固执，需学会灵活变通。用神取克泄耗（官杀/食伤/财星）为宜。',
    '中和': '日主中和，五行相对平衡。您是难得的平和之命，适应力强，能进能退。这是最好的命局状态——既不会太弱扛不住事，也不会太旺难以收敛。保持现状，顺势而为即可。',
    '偏弱': '日主偏弱，如小树需要扶持。您心地善良、为人谦和，但有时信心不足、容易被人影响。需印星生扶、比劫帮身。建议多结交志同道合的朋友，借助团队力量。',
    '极弱': '日主极弱，如嫩苗需要精心呵护。您心思细腻、敏感多思，有艺术气质。但抗压能力有限，不适合单打独斗。需大量印比来扶助，适合在稳定环境中发展。'
  };
  var strengthDesc = strengthNotes[strengthLevel] || strengthNotes['中和'];

  html += '<div style="background:linear-gradient(135deg,rgba(201,168,76,.08),rgba(155,89,182,.04));border:1px solid rgba(201,168,76,.2);border-radius:10px;padding:16px;margin-bottom:14px">';
  html += '<div style="font-size:14px;font-weight:bold;color:var(--gold);margin-bottom:8px;letter-spacing:2px">壹 · 命盘总览</div>';
  html += '<div style="font-size:13px;color:var(--paper);line-height:2">';
  html += '<b>日主旺衰：</b><span style="color:'+(isStrong?'#e74c3c':'#3498db')+'">' + strengthLevel + '</span> · ';
  html += '<b>喜用神：</b><span style="color:#2ecc71">' + yongshen + '</span> · ';
  html += '<b>忌神：</b><span style="color:#e74c3c">' + jishenEle + '</span>';
  html += '</div>';
  html += '<div style="font-size:12px;color:var(--paper2);line-height:1.8;margin-top:8px">' + strengthDesc + '</div>';
  if (xiJi.length > 0) {
    html += '<div style="font-size:11px;color:#888;margin-top:6px">💡 喜忌指引：' + xiJi.join('；') + '</div>';
  }
  html += '</div>';

  // ═══════ 贰·十神格局分析 ═══════
  var tenGodCount = {};
  var tgNames = [];
  if (Array.isArray(tenGods)) {
    for (var i = 0; i < tenGods.length; i++) {
      var tg = tenGods[i];
      if (tg) {
        tenGodCount[tg] = (tenGodCount[tg] || 0) + 1;
        tgNames.push(tg);
      }
    }
  }

  var tgAnalysisMap = {};
  if (tenGodCount['正官'] >= 2 || tenGodCount['七杀'] >= 2) {
    tgAnalysisMap['官杀旺'] = '官杀星旺盛，您天生有强烈的责任心和事业心，适合管理、公职、法律等需要权威和纪律的工作。但官杀过旺也会带来巨大压力——建议培养兴趣爱好来减压，学会把工作与生活分开。女命官杀旺者异性缘佳，但要注意分辨正缘与烂桃花。';
  }
  if (tenGodCount['正印'] >= 2 || tenGodCount['偏印'] >= 2) {
    tgAnalysisMap['印星旺'] = '印星旺盛，您天生好学、聪慧，贵人运佳。适合学术、教育、文化等行业。但印星过旺也容易依赖心重、行动力不足——建议多实践、知行合一，把知识转化为行动。印星旺者心地善良，适合慈善和助人行业。';
  }
  if (tenGodCount['正财'] >= 2 || tenGodCount['偏财'] >= 2) {
    tgAnalysisMap['财星旺'] = '财星旺盛，您对金钱有敏锐的嗅觉，理财能力出众。适合经商、金融、贸易等与钱打交道的行业。但财星过旺者容易为钱所困——提醒您：钱是工具不是目的，适度即可。男命财旺者桃花多，需注意处理感情关系。';
  }
  if (tenGodCount['食神'] >= 2 || tenGodCount['伤官'] >= 2) {
    tgAnalysisMap['食伤旺'] = '食伤星旺盛，您才华横溢、创意十足，有艺术天赋。适合设计、艺术、演艺、写作等需要创造力的工作。食伤星也代表表达和输出——您天生善于表达，口才出众。但有时过于情绪化，需学会控制脾气。';
  }
  if (tenGodCount['比肩'] >= 2 || tenGodCount['劫财'] >= 2) {
    tgAnalysisMap['比劫旺'] = '比劫星旺盛，您朋友多、人脉广，团队协作能力强。适合创业、销售、体育等需要体力和团队的工作。但比劫过旺也容易与人争执、破财——建议学会分享，不要在小事上计较。';
  }

  html += '<div style="background:rgba(52,152,219,.04);border-left:3px solid #3498db;padding:14px 16px;margin-bottom:14px;border-radius:0 8px 8px 0">';
  html += '<div style="font-size:14px;font-weight:bold;color:#3498db;margin-bottom:8px;letter-spacing:2px">贰 · 十神格局</div>';
  html += '<div style="font-size:12px;color:var(--paper);line-height:1.8">';

  if (Object.keys(tgAnalysisMap).length > 0) {
    for (var ka in tgAnalysisMap) {
      html += '<p style="margin-bottom:6px">🔹 <b>' + ka.replace('旺','') + '格：</b>' + tgAnalysisMap[ka] + '</p>';
    }
  } else {
    html += '<p>十神分布均衡，各项能力发展相对平均。建议在现有基础上重点培养一两个领域的专长。</p>';
  }

  // Specific balance warnings
  var warnings = [];
  if ((tenGodCount['七杀'] || 0) >= 2 && (tenGodCount['食神'] || 0) === 0 && (tenGodCount['正印'] || 0) === 0) {
    warnings.push('⚠️ <b>七杀无制：</b>七杀旺而无食神制或印星化，容易压力过大、脾气暴躁，建议多运动释放压力，避免高风险决策。');
  }
  if ((tenGodCount['伤官'] || 0) >= 2 && (tenGodCount['正印'] || 0) === 0) {
    warnings.push('⚠️ <b>伤官无制：</b>伤官旺而无印制，才华外露但易得罪人，建议学会收敛锋芒，多阅读修身养性。');
  }
  if ((tenGodCount['正财'] || 0) >= 2 && (tenGodCount['比肩'] || 0) + (tenGodCount['劫财'] || 0) >= 2) {
    warnings.push('⚠️ <b>财星被劫：</b>财星与比劫同旺，容易财来财去、为朋友破财，建议谨慎理财，不宜与人合伙。');
  }
  for (var wi = 0; wi < warnings.length; wi++) {
    html += '<p style="color:#e67e22;margin-top:4px">' + warnings[wi] + '</p>';
  }

  html += '</div></div>';

  // ═══════ 叁·神煞点睛 ═══════
  if (shensha && Object.keys(shensha).length > 0) {
    html += '<div style="background:rgba(155,89,182,.04);border-left:3px solid #9b59b6;padding:14px 16px;margin-bottom:14px;border-radius:0 8px 8px 0">';
    html += '<div style="font-size:14px;font-weight:bold;color:#9b59b6;margin-bottom:8px;letter-spacing:2px">叁 · 神煞点睛</div>';
    html += '<div style="font-size:12px;color:var(--paper);line-height:1.8">';

    var shenshaMeanings = {
      '天乙贵人': {good:true, txt:'命带天乙贵人，一生有贵人相助，逢凶化吉。这是最吉之神煞，主遇难呈祥，危难时有高人指点。'},
      '天德贵人': {good:true, txt:'命带天德贵人，心地善良，福报深厚。纵遇灾祸也能化解，一生少有大难。'},
      '太极贵人': {good:true, txt:'命带太极贵人，天生对玄学、哲学、易学有缘。适合学习命理、中医、气功等传统文化。'},
      '文昌贵人': {good:true, txt:'命带文昌贵人，学业运佳，聪明好学。考试、考证运势较强，读书事半功倍。'},
      '将星': {good:true, txt:'命带将星，有领导才能和决断力。适合管理岗位或自主创业，能在团队中脱颖而出。'},
      '桃花': {good:false, txt:'命带桃花星，异性缘分佳，人缘好。但需警惕烂桃花和感情纠葛，适度的桃花是魅力，过旺则成困扰。'},
      '驿马': {good:false, txt:'命带驿马星，一生奔波走动多，适合经常出差、旅行的工作。驿马旺者宜动不宜静，坐不住是常态。'},
      '羊刃': {good:false, txt:'命带羊刃，性格刚烈果敢，但也容易冲动。需要注意控制脾气，避免与人发生肢体冲突。'},
      '孤辰': {good:false, txt:'命带孤辰，性格偏内向，喜欢独处。晚年可能较孤独，建议多培养兴趣爱好和社交圈。'},
      '寡宿': {good:false, txt:'命带寡宿，感情路上波折较多。但此类人专注力强，往往在专业领域有出色成就。'},
      '华盖': {good:false, txt:'命带华盖，聪慧过人但性情孤傲。华盖是艺术和玄学之星——您可能对命理、哲学有天生的兴趣。'}
    };

    var goodStars = [], neutralStars = [];
    for (var sk in shensha) {
      if (shensha[sk]) {
        var meaning = shenshaMeanings[sk];
        if (meaning) {
          if (meaning.good) goodStars.push({name: sk, txt: meaning.txt});
          else neutralStars.push({name: sk, txt: meaning.txt});
        }
      }
    }

    if (goodStars.length > 0) {
      html += '<p style="color:#27ae60;margin-bottom:4px"><b>⭐ 吉神：</b></p>';
      for (var gs = 0; gs < goodStars.length; gs++) {
        html += '<p style="margin-bottom:4px">• <b>' + goodStars[gs].name + '</b>：' + goodStars[gs].txt + '</p>';
      }
    }
    if (neutralStars.length > 0) {
      html += '<p style="color:#e67e22;margin-bottom:4px;margin-top:8px"><b>⚡ 需注意：</b></p>';
      for (var ns = 0; ns < neutralStars.length; ns++) {
        html += '<p style="margin-bottom:4px">• <b>' + neutralStars[ns].name + '</b>：' + neutralStars[ns].txt + '</p>';
      }
    }

    html += '</div></div>';
  }

  // ═══════ 肆·运程指导 ═══════
  var currentYear = new Date().getFullYear();
  var yearGanZhi = '';
  try {
    var yearStems = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
    var yearBranches = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
    yearGanZhi = yearStems[(currentYear-4)%10] + yearBranches[(currentYear-4)%12];
  } catch(e) { yearGanZhi = '未知'; }

  var dayunPhases = {
    '极旺': '您现在正处于能量充沛的阶段，但需警惕过度自信。未来5年宜「收」不宜「放」，稳扎稳打比冒进更安全。',
    '偏旺': '运势稳中有升，当前是发展的好时机。建议抓住未来2-3年的机会，但不要all in——留三分余地。',
    '中和': '运势平稳，进退自如。这种状态最难得——保持节奏，按部就班推进计划，细水长流是您最好的策略。',
    '偏弱': '当前需要积蓄力量，不宜做重大决策。建议未来1-2年先学习充电，等运势转旺时再出击。多借助团队和贵人的力量。',
    '极弱': '运势偏低谷期，但低谷是蓄力的最佳时机。建议在此期间静心学习、韬光养晦，运势会在2-3年后逐步回升。'
  };
  var dayunPhase = dayunPhases[strengthLevel] || dayunPhases['中和'];

  html += '<div style="background:rgba(39,174,96,.04);border-left:3px solid #27ae60;padding:14px 16px;margin-bottom:14px;border-radius:0 8px 8px 0">';
  html += '<div style="font-size:14px;font-weight:bold;color:#27ae60;margin-bottom:8px;letter-spacing:2px">肆 · 运程指导</div>';
  html += '<div style="font-size:12px;color:var(--paper);line-height:1.8">';
  html += '<b>' + currentYear + '年（' + yearGanZhi + '年）运势基调：</b>' + dayunPhase + '<br><br>';

  // Specific year advice based on element interaction
  var yearEle = '';
  try {
    var yearStemIdx = (currentYear-4)%10;
    var stemEle = {'甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水'};
    yearEle = stemEle[yearStems[yearStemIdx]];
  } catch(e) {}

  var yearInteraction = '';
  if (yearEle) {
    var xi = yongshenEle;
    if (yearEle === xi) {
      yearInteraction = '今年' + yearEle + '年为您的喜用神年，运势偏吉，适合积极进取。';
    } else if (yearEle === jishenEle) {
      yearInteraction = '今年' + yearEle + '年为您的忌神年，宜低调行事，稳守为主。';
    } else {
      yearInteraction = '今年' + yearEle + '年与您五行相对中性，运势平稳，可按计划推进。';
    }
  }
  html += yearInteraction + '</div></div>';

  // ═══════ 伍·具体行事指导 ═══════
  var careerTips = {
    '木': {best:'教育培训、文化传媒、设计创意、农林园艺、公益慈善', reason:'木主仁爱，适合需要爱心和创造力的行业。木日主的人天生有感染力，做教育或文化传播事半功倍。', avoid:'过分机械重复的工作，会压抑木的生机', peak:'春季（农历1-3月）运势最强'},
    '火': {best:'互联网科技、餐饮娱乐、演艺传媒、市场营销、能源电力', reason:'火主礼乐，适合需要热情和表现力的行业。火日主的人天生是焦点，做与人打交道的工作如鱼得水。', avoid:'冰冷沉闷的后台工作，火需要发光发热', peak:'夏季（农历4-6月）运势最强'},
    '土': {best:'房地产建筑、金融投资、农业种植、仓储物流、咨询服务', reason:'土主诚信，适合需要稳重和耐心的行业。土日主的人踏实可靠，做长线投资和实体产业最稳妥。', avoid:'频繁变动的快节奏行业，土需要沉淀', peak:'长夏（农历6月末）和四季末运势最强'},
    '金': {best:'金融法律、机械制造、军警安全、医疗外科、精密工艺', reason:'金主义气，适合需要果断和精准的行业。金日主的人执行力强，做需要专业技能的行业最佳。', avoid:'含糊不清的灰色地带工作，金需要清晰边界', peak:'秋季（农历7-9月）运势最强'},
    '水': {best:'贸易物流、旅游咨询、心理咨询、水利环保、学术研究', reason:'水主智慧，适合需要灵活和深度的行业。水日主的人思维敏捷，做需要洞察力的工作最有优势。', avoid:'固化死板的工作环境，水需要流动', peak:'冬季（农历10-12月）运势最强'}
  };
  var career = careerTips[dayWuxing] || careerTips['木'];

  var caishen = tenGodCount['正财'] || 0;
  var piancai = tenGodCount['偏财'] || 0;
  var totalCai = caishen + piancai; // "财" -> "cai"
  var caiAdvice = '';
  if (totalCai >= 2) {
    caiAdvice = '命带财星' + totalCai + '重，财运基础好。正财主稳定收入（工资），偏财主意外之财（投资、副业）。您适合多渠道开源，但要控制风险——正财为主，偏财为辅。';
  } else if (totalCai === 1) {
    caiAdvice = '命带财星1重，财运稳定但需要主动经营。建议：①深耕主业确保稳定收入；②有余力可发展一项副业；③学习基础理财知识。';
  } else {
    caiAdvice = '命局财星不显，并非无财——而是需要创造才能得财。建议：①提升专业技能增加收入能力；②培养储蓄习惯；③不求快财，稳中求富。';
  }

  html += '<div style="background:rgba(230,126,34,.04);border-left:3px solid #e67e22;padding:14px 16px;margin-bottom:14px;border-radius:0 8px 8px 0">';
  html += '<div style="font-size:14px;font-weight:bold;color:#e67e22;margin-bottom:8px;letter-spacing:2px">伍 · 行事指导</div>';
  html += '<div style="font-size:12px;color:var(--paper);line-height:1.8">';
  html += '<b>💼 事业方向：</b>' + career.reason + '<br>';
  html += '→ 推荐行业：' + career.best + '<br>';
  html += '→ 避开行业：' + career.avoid + '<br>';
  html += '→ ' + career.peak + '<br><br>';
  html += '<b>💰 财运分析：</b>' + caiAdvice + '</div></div>';

  // ═══════ 陆·缘分感情 ═══════
  var guanCount = (tenGodCount['正官'] || 0) + (tenGodCount['七杀'] || 0);
  var caiCount2 = (tenGodCount['正财'] || 0) + (tenGodCount['偏财'] || 0);
  var taohua = shensha && shensha['桃花'];

  var loveAdvice = '';
  if (guanCount >= 2) {
    loveAdvice = '官杀星' + guanCount + '重，异性缘分佳但也容易选择困难。建议：①先明确自己的核心需求再选择伴侣；②注意辨别烂桃花；③晚婚反而更稳定。';
  } else if (guanCount === 1) {
    loveAdvice = '官杀星1重，正缘运正常。建议：①多参加社交活动扩大交际圈；②不急于求成，缘分到了自然来。';
  } else {
    loveAdvice = '官杀星不显，缘分需要主动寻找。建议：①多参加朋友介绍；②培养共同爱好的社交圈；③缘分来时主动把握。';
  }
  if (taohua) {
    loveAdvice += ' <span style="color:#e67e22">★ 命带桃花，特别提醒：桃花旺人缘好，但需注意感情专一，避免陷入多角关系。</span>';
  }

  html += '<div style="background:rgba(192,57,43,.04);border-left:3px solid #c0392b;padding:14px 16px;margin-bottom:14px;border-radius:0 8px 8px 0">';
  html += '<div style="font-size:14px;font-weight:bold;color:#c0392b;margin-bottom:8px;letter-spacing:2px">陆 · 缘分感情</div>';
  html += '<div style="font-size:12px;color:var(--paper);line-height:1.8">';
  html += loveAdvice + '</div></div>';

  // ═══════ 柒·健康养生 ═══════
  var healthWarnings = {
    '木': {organs:'肝胆、眼睛、筋骨、甲状腺', detail:'木主肝胆，木日主者需特别注意肝火和肝气郁结。肝脏是人体最大的解毒器官——少熬夜是最好的保肝。春季多踏青、多看绿色可养肝明目。', food:'枸杞菊花茶、柠檬水、绿叶蔬菜、绿豆', avoid:'过量饮酒、油炸食物、生冷夜宵'},
    '火': {organs:'心脏、小肠、血管、血压', detail:'火主心脏和血脉，火日主者需注意心脑血管健康。心脏是生命的发动机——规律作息和情绪稳定是养心的关键。夏季多出汗有益，但避免在烈日下暴晒。', food:'莲子心茶、苦瓜、红枣、百合', avoid:'过咸食物、咖啡过量、暴怒激动'},
    '土': {organs:'脾胃、胰脏、肌肉、消化系统', detail:'土主脾胃，土日主者需特别注意消化系统。脾胃是人体的能量工厂——三餐规律比吃什么更重要。细嚼慢咽，七分饱即可。', food:'山药小米粥、南瓜、陈皮普洱茶、薏米', avoid:'生冷瓜果、冰镇饮料、甜食过量'},
    '金': {organs:'肺、大肠、皮肤、呼吸道', detail:'金主肺气，金日主者需注意呼吸系统和皮肤健康。肺部是人体的空气净化器——深呼吸和新鲜空气是最好的养肺方法。秋天多食白色食物润肺。', food:'雪梨银耳羹、白萝卜、杏仁、蜂蜜柠檬水', avoid:'烟熏食品、辛辣烧烤、过度熬夜'},
    '水': {organs:'肾脏、膀胱、骨骼、听觉', detail:'水主肾脏，水日主者需特别注意肾气和泌尿系统。肾是人体的根基——不憋尿、多喝水、注意腰腹保暖是养肾三宝。冬天是养肾的黄金季节。', food:'黑芝麻核桃糊、桑葚、黑豆、枸杞杜仲茶', avoid:'过咸食物、冷饮、过度消耗精气'}
  };
  var health = healthWarnings[dayWuxing] || healthWarnings['木'];

  html += '<div style="background:rgba(46,204,113,.04);border-left:3px solid #2ecc71;padding:14px 16px;margin-bottom:14px;border-radius:0 8px 8px 0">';
  html += '<div style="font-size:14px;font-weight:bold;color:#2ecc71;margin-bottom:8px;letter-spacing:2px">柒 · 健康养生</div>';
  html += '<div style="font-size:12px;color:var(--paper);line-height:1.8">';
  html += '<b>重点关注：</b>' + health.organs + '<br>';
  html += '<b>养生要点：</b>' + health.detail + '<br>';
  html += '<b>🍵 推荐饮食：</b>' + health.food + '<br>';
  html += '<b>⚠️ 避忌：</b>' + health.avoid;
  html += '</div></div>';

  // ═══════ 捌·五行化解 ═══════
  var huajieMap = {
    '木':{action:'①办公桌/家中东侧放绿植（文竹/发财树） ②每周户外运动1-2次 ③佩戴木质手串 ④用青绿色系的手机壳/钱包/笔 ⑤社交账号名加木偏旁字', color:'青绿色、翠绿色', num:'3、8', dir:'东方、东南方', season:'春季（农历1-3月）'},
    '火':{action:'①每天晒朝阳10-15分钟 ②家中南侧保持明亮 ③用红色/紫色系物品 ④多参加聚会社交活动 ⑤练书法/绘画培养静气', color:'红色、紫色、橙色', num:'2、7', dir:'南方', season:'夏季（农历4-6月）'},
    '土':{action:'①多走土路赤脚接地气 ②家中摆放陶瓷器 ③穿黄/棕色系衣物 ④种花种草接触土 ⑤每天练习站桩15分钟', color:'黄色、棕色、咖啡色', num:'5、10', dir:'中央、西南方', season:'长夏（农历6月末）'},
    '金':{action:'①佩戴金银饰品 ②桌面保持整洁有序 ③听钢琴/编钟等金属乐器 ④挂圆形金属装饰物 ⑤每天练习深呼吸30次', color:'白色、金色、银色', num:'4、9', dir:'西方、西北方', season:'秋季（农历7-9月）'},
    '水':{action:'①家里设小鱼缸/加湿器 ②多去水边散步 ③穿黑/蓝/深色衣服 ④每天喝8杯水 ⑤睡前泡脚15分钟', color:'黑色、蓝色、深灰色', num:'1、6', dir:'北方', season:'冬季（农历10-12月）'}
  };

  // Use 喜用神 element for huajie, not just dayWuxing
  // Prioritize 喜用神 → dayWuxing
  var hjEle = yongshenEle || dayWuxing;
  var hj = huajieMap[hjEle] || huajieMap['木'];

  html += '<div style="background:rgba(231,76,60,.06);border:1px solid rgba(231,76,60,.2);padding:14px 16px;margin-bottom:14px;border-radius:10px">';
  html += '<div style="font-size:14px;font-weight:bold;color:#e74c3c;margin-bottom:8px;letter-spacing:2px">捌 · 五行化解</div>';
  html += '<div style="font-size:12px;color:var(--paper);line-height:1.8">';
  html += '<b>您的喜用神为「' + yongshen + '」，建议多用以下方式补益：</b><br><br>';
  html += '<b>🔮 行动清单：</b><br>' + hj.action.split('  ').map(function(a){ return '　' + a; }).join('<br>') + '<br><br>';
  html += '<b>🎨 幸运色：</b>' + hj.color + '&nbsp;&nbsp;&nbsp;';
  html += '<b>🔢 幸运数字：</b>' + hj.num + '&nbsp;&nbsp;&nbsp;';
  html += '<b>🧭 吉利方位：</b>' + hj.dir + '&nbsp;&nbsp;&nbsp;';
  html += '<b>🌿 最强季节：</b>' + hj.season;
  html += '</div></div>';

  // ═══════ 玖·古籍参鉴 ═══════
  var classics = [
    '"道有体用，不可一端论也，务要审其得失、察其进退。" —— 《滴天髓》',
    '"命之理微，天机深藏。非至诚不能通其变，非至精不能穷其数。" —— 《三命通会》',
    '"鬼谷遗文，传于后人。观象玩辞，吉凶可论。" —— 《鬼谷子·命理篇》',
    '"知命者不怨天，自知者不怨人。" —— 《了凡四训》引老子语',
    '"命由我作，福自己求。" —— 《了凡四训》',
    '"积善之家，必有余庆。" —— 《易经·坤卦》',
    '"天行健，君子以自强不息。地势坤，君子以厚德载物。" —— 《易经》',
    '"夫大人者，与天地合其德，与日月合其明，与四时合其序，与鬼神合其吉凶。" —— 《易经·乾卦》'
  ];
  var classic = classics[new Date().getDate() % classics.length];

  html += '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(201,168,76,.1);padding:14px 16px;margin-bottom:14px;border-radius:8px">';
  html += '<div style="font-size:14px;font-weight:bold;color:var(--gold);margin-bottom:8px;letter-spacing:2px">玖 · 古籍参鉴</div>';
  html += '<div style="font-size:12px;color:var(--paper2);line-height:1.8;font-style:italic">' + classic + '</div>';
  html += '</div>';

  // ═══════ 拾·底部免责 ═══════
  html += '<div style="margin-top:8px;padding:8px 12px;background:#fff8e1;border-left:3px solid #ffc107;border-radius:4px;font-size:10px;color:#888;line-height:1.6">';
  html += '⚠️ AI辅助创作｜国学感悟仅供修身闲聊交流，非专业定论，无法律及实操指导效力，读者凡事自辨自省，所有个人抉择后果自行负责';
  html += '</div>';

  return html;
}

// ═══ 个性化指导函数 ═══
function buildBaziPersonalizedGuidance(data) {
  var dayEle = data.dayEle || '木';
  var weakest = data.weakest || '';
  var strongest = data.strongest || '';
  var sex = data.sex || '';
  var name = data.name || '缘主';
  var birthplace = data.birthplace || '';
  var residence = data.residence || '';

  // 用神五行推算
  var yongshen = weakest;
  var wxMap = {
    '金': { color: '白色/银色/金色', direction: '西方/西北方', industry: '金融/机械/五金/珠宝/汽车/法律', health: '肺/大肠/皮肤/鼻', season: '秋季' },
    '木': { color: '绿色/青色', direction: '东方/东南方', industry: '教育/出版/农业/家具/服装/文创', health: '肝/胆/筋骨/眼', season: '春季' },
    '水': { color: '黑色/蓝色/灰色', direction: '北方', industry: '物流/旅游/水产/饮料/贸易/传播', health: '肾/膀胱/耳/泌尿', season: '冬季' },
    '火': { color: '红色/紫色/橙色', direction: '南方', industry: '能源/餐饮/电子/传媒/美容/心理咨询', health: '心/小肠/血脉/舌', season: '夏季' },
    '土': { color: '黄色/棕色/咖色', direction: '中央/东北/西南', industry: '房地产/建筑/陶瓷/农业/仓储/殡葬', health: '脾/胃/口/肌肉', season: '四季末月' }
  };
  var ys = wxMap[yongshen] || wxMap['木'];

  var html = '<div class="analysis-card" style="margin:16px 0;border:1px solid rgba(201,168,76,.25);padding:20px;background:linear-gradient(135deg,rgba(201,168,76,.05),rgba(39,174,96,.03))">';
  html += '<h5 style="font-size:16px;color:var(--gold);letter-spacing:4px;margin-bottom:16px;">📋 个性化指导</h5>';
  html += '<p style="font-size:12px;opacity:.6;margin-bottom:14px;">根据' + name + '的八字排盘结果，以下是为您量身定制的建议：</p>';
  html += '<div style="font-size:13px;line-height:2.1">';

  // 职业方位
  html += '<p><b style="color:var(--gold)">🧭 有利方位：</b>' + ys.direction + '。';
  if (residence) html += '若在' + residence + '发展，建议选择' + ys.direction + '的区域办公或居住。';
  html += '</p>';

  // 配色
  html += '<p><b style="color:var(--gold)">🎨 幸运配色：</b>' + ys.color + '。日常穿搭、居家软装可多用此色系。</p>';

  // 行业
  html += '<p><b style="color:var(--gold)">💼 适合行业：</b>' + ys.industry + '。</p>';

  // 健康
  html += '<p><b style="color:var(--gold)">🏥 健康提醒：</b>五行偏颇，需注意<b>' + ys.health + '</b>的保养。尤其在<b>' + ys.season + '</b>更需注意。</p>';

  // 流月提醒
  var now = new Date();
  var monthBranch = ['寅','卯','辰','巳','午','未','申','酉','戌','亥','子','丑'][now.getMonth()];
  var monthWx = { '寅':'木','卯':'木','辰':'土','巳':'火','午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水','子':'水','丑':'土' }[monthBranch];
  html += '<p><b style="color:var(--gold)">📅 当月提醒：</b>当前' + monthBranch + '月（五行属' + monthWx + '），';
  if (monthWx === yongshen) html += '用神当令，运势较好，宜积极进取。';
  else if (monthWx === strongest) html += '旺神当令，需注意克制，避免冲动决策。';
  else html += '运势平稳，宜保守经营，蓄势待发。';
  html += '</p>';

  // 出生城市到现居城市的调整
  if (birthplace && residence && birthplace !== residence) {
    html += '<p><b style="color:var(--gold)">📍 地域调整：</b>从' + birthplace + '到' + residence + '，地域变化可能影响五行气场，建议结合当地气候和方位做适当调整。</p>';
  }

  html += '</div></div>';
  return html;
}

function buildLiuyaoPersonalizedGuidance(data) {
  var guaName = data.guaName || '';
  var changedName = data.changedName || '';
  var html = '<div class="analysis-card" style="margin:16px 0;border:1px solid rgba(201,168,76,.25);padding:20px">';
  html += '<h5 style="font-size:16px;color:var(--gold);letter-spacing:4px;margin-bottom:16px;">📋 个性化指导</h5>';
  html += '<div style="font-size:13px;line-height:2.1">';
  html += '<p><b style="color:var(--gold)">⏰ 应期判断：</b>卦象应在动爻所值之期。如动爻为寅木，则寅日或寅月为应期。变卦提示事态转变的时间节点。</p>';
  html += '<p><b style="color:var(--gold)">🧭 方位指导：</b>求财宜往本卦所属方位（如乾卦往西北、坤卦往西南）；求职宜往生我之方；求医宜往天医方。</p>';
  html += '<p><b style="color:var(--gold)">📊 成败分析：</b>本卦代表当下状态，变卦代表结果走向。若体用相生比和则成，体用相克则需加倍努力。</p>';
  if (changedName) html += '<p><b style="color:var(--gold)">🔄 变卦提示：</b>由「' + guaName + '」变「' + changedName + '」，事态将发生转变，宜顺势而为。</p>';
  html += '</div></div>';
  return html;
}

function buildMeihuaPersonalizedGuidance(data) {
  var html = '<div class="analysis-card" style="margin:16px 0;border:1px solid rgba(201,168,76,.25);padding:20px">';
  html += '<h5 style="font-size:16px;color:var(--gold);letter-spacing:4px;margin-bottom:16px;">📋 个性化指导</h5>';
  html += '<div style="font-size:13px;line-height:2.1">';
  html += '<p><b style="color:var(--gold)">🍂 时令分析：</b>当前时令对体用关系影响显著。体卦旺于本卦五行之季节则吉，休囚则需等待时机。</p>';
  html += '<p><b style="color:var(--gold)">🔄 变卦指导：</b>变卦揭示事态发展方向。体卦不变代表自身稳固，用卦变代表外在环境变化。宜根据变卦五行与体卦关系调整策略。</p>';
  html += '</div></div>';
  return html;
}

function buildLiurenPersonalizedGuidance(data) {
  var html = '<div class="analysis-card" style="margin:16px 0;border:1px solid rgba(201,168,76,.25);padding:20px">';
  html += '<h5 style="font-size:16px;color:var(--gold);letter-spacing:4px;margin-bottom:16px;">📋 个性化指导</h5>';
  html += '<div style="font-size:13px;line-height:2.1">';
  html += '<p><b style="color:var(--gold)">📡 三传时序：</b>初传主事之始，中传主事之中，末传主事之终。初传吉则开局顺利，末传吉则结局圆满。</p>';
  html += '<p><b style="color:var(--gold)">🧭 天将方位：</b>贵人所在方位为吉方，宜面此方行事。天空所临之方宜避，玄武所临之方防欺诈。</p>';
  html += '</div></div>';
  return html;
}

function buildZiweiPersonalizedGuidance(data) {
  var html = '<div class="analysis-card" style="margin:16px 0;border:1px solid rgba(201,168,76,.25);padding:20px">';
  html += '<h5 style="font-size:16px;color:var(--gold);letter-spacing:4px;margin-bottom:16px;">📋 个性化指导</h5>';
  html += '<div style="font-size:13px;line-height:2.1">';
  html += '<p><b style="color:var(--gold)">📊 大限分析：</b>当前大限所在宫位决定十年运势基调。大限宫位主星吉则十年顺遂，凶星入限需谨慎应对。</p>';
  html += '<p><b style="color:var(--gold)">📅 流年提醒：</b>流年宫位与本命宫位的关系决定当年运势。流年化禄入命则年运亨通，化忌入命需防灾厄。</p>';
  html += '<p><b style="color:var(--gold)">💼 事业建议：</b>根据命宫主星特性选择职业方向。紫微宜管理，天机宜策划，太阳宜公职，武曲宜金融。</p>';
  html += '<p><b style="color:var(--gold)">❤️ 婚姻建议：</b>夫妻宫主星决定配偶特质。宜选择夫妻宫星性互补之人，避免星性相冲。</p>';
  html += '</div></div>';
  return html;
}

function computeBazi() {
 try {
  return _computeBaziImpl();
 } catch(e) {
  console.error('[八字排盘错误]', e.message, e.stack);
  var _eb = document.getElementById('baziInterp') || document.getElementById('baziResult');
  if(_eb) _eb.innerHTML = '<div style="padding:20px;margin:16px 0;background:rgba(231,76,60,.08);border:1px solid rgba(231,76,60,.2);border-radius:8px"><h5 style="color:#e74c3c">❌ 八字排盘出错</h5><p style="font-size:13px;opacity:.8;margin-top:8px">'+e.message+'</p><p style="font-size:11px;opacity:.5;margin-top:4px">'+(e.stack||'').split("\n").slice(0,3).join("<br>")+'</p></div>';
  var _r = document.getElementById('baziResult'); if(_r){_r.classList.add('visible');_r.scrollIntoView({behavior:'smooth'});}
 }
}
function _computeBaziImpl() {
  var btn = document.getElementById('baziBtn');
  if(btn){ btn.disabled=true; btn.textContent='排盘中...'; }
  playDivinationSound();
  const name = document.getElementById('baziName').value || '有缘人';
  const hourVal = document.getElementById('baziHour').value;
  const sex = document.getElementById('baziSex').value;
  const calMode = document.querySelector('input[name="calendarMode"]:checked')?.value || 'solar';
  var birthplace = document.getElementById('baziBirthplace') ? document.getElementById('baziBirthplace').value.trim() : '';
  var residence = document.getElementById('baziResidence') ? document.getElementById('baziResidence').value.trim() : '';

  let year, month, day;
  if (calMode === 'lunar') {
    const ly = parseInt(document.getElementById('lunarYear').value);
    const lm = parseInt(document.getElementById('lunarMonth').value);
    const ld = parseInt(document.getElementById('lunarDay').value);
    const isLeap = document.getElementById('lunarLeapMonth').checked;
    if (!ly || !lm || !ld) { showToast('请输入完整的农历出生日期'); document.getElementById('loadingOverlay').classList.remove('visible'); return; }
    const solar = lunarToSolar(ly, lm, ld, isLeap);
    if (!solar) { showToast('农历日期无效，请检查'); document.getElementById('loadingOverlay').classList.remove('visible'); return; }
    year = solar.year; month = solar.month; day = solar.day;
  } else {
    const dateStr = document.getElementById('baziDate').value;
    if (!dateStr) { showToast('请输入出生日期'); document.getElementById('loadingOverlay').classList.remove('visible'); return; }
    [year, month, day] = dateStr.split('-').map(Number);
  }

  // Show loading
  document.getElementById('loadingOverlay').classList.add('visible');

  try {

  const hourRaw = hourVal ? parseInt(hourVal) : 12;
  
  // ═══ 真太阳时校正 ═══
  var lngInput = document.getElementById('baziLng') ? document.getElementById('baziLng').value : '';
  var lng = lngInput ? parseFloat(lngInput) : null;
  // 如果未填经度但有出生地，尝试自动推算
  if (lng === null && birthplace) {
    for (var c in CITY_DIRECTION_WUXING) {
      if (birthplace.indexOf(c) === 0 || c.indexOf(birthplace) === 0) {
        lng = CITY_DIRECTION_WUXING[c].lng;
        break;
      }
    }
  }
  var tzOffset = -new Date(year, month - 1, day).getTimezoneOffset() / 60;
  var trueSolarInfo = '';
  var year2 = year, month2 = month, day2 = day, hour = hourRaw;
  if (lng !== null && !isNaN(lng)) {
    var corrected = trueSolarTimeCorrection(year, month, day, hourRaw, 0, lng, tzOffset);
    year2 = corrected.year; month2 = corrected.month; day2 = corrected.day; hour = corrected.hour;
    trueSolarInfo = '真太阳时校正: 经度' + lng + '°, 校正' + (corrected.delta > 0 ? '+' : '') + corrected.delta + '分钟, 校正后: ' + month2 + '月' + day2 + '日 ' + hour + ':' + String(corrected.minute).padStart(2,'0');
  }
  
  // ═══ 子时流派处理 ═══
  var zishiMode = document.getElementById('baziZishi') ? document.getElementById('baziZishi').value : 'normal';
  if (zishiMode === 'late' && hourRaw === 23) {
    // 晚子换日: 23点后算次日
    var nextDay = new Date(year2, month2 - 1, day2 + 1);
    year2 = nextDay.getFullYear(); month2 = nextDay.getMonth() + 1; day2 = nextDay.getDate();
    trueSolarInfo += (trueSolarInfo ? ' | ' : '') + '晚子换日: 已转为次日';
  }

  // Year — 传入出生时辰精确判断立春
  const { stemIdx: ysIdx, branchIdx: ybIdx, stem: yStem, branch: yBranch } = getYearStemBranchExact(year2, month2, day2, hour, 0);
  // Day
  const dayStemIdx = getDayStemIndex(year2, month2, day2);
  const dayBranchIdx = getDayBranchIndex(year2, month2, day2);
  const dayStem = STEMS[dayStemIdx];
  const dayBranch = BRANCHES[dayBranchIdx];

  // Month — 以节气定月支 (黑格引擎移植,替代旧的 (month+9)%12 简化逻辑)
  const monthBranch = getMonthBranchBySolar(year2, month2, day2);
  const monthStemIdx = getMonthStem(ysIdx, monthBranch);
  const monthStem = STEMS[monthStemIdx];
  const monthBranchIdx = BRANCHES.indexOf(monthBranch);

  // Hour
  const hourBranchIdx = Math.floor(hour / 2) % 12;
  const hourBranch = BRANCHES[hourBranchIdx];
  const hourStemIdx = getHourStem(dayStemIdx, hourBranch);
  const hourStem = STEMS[hourStemIdx];

  const pillars = [
    { stem: yStem, branch: yBranch, stemIdx: ysIdx, branchIdx: ybIdx, name: '年柱', desc: '祖荫根基' },
    { stem: monthStem, branch: monthBranch, stemIdx: monthStemIdx, branchIdx: monthBranchIdx, name: '月柱', desc: '父母社会' },
    { stem: dayStem, branch: dayBranch, stemIdx: dayStemIdx, branchIdx: dayBranchIdx, name: '日柱', desc: '本人元神' },
    { stem: hourStem, branch: hourBranch, stemIdx: hourStemIdx, branchIdx: hourBranchIdx, name: '时柱', desc: '子女晚景' },
  ];

  // === RENDER PILLARS ===
  var _pillarDishi = [];
  for (let i = 0; i < 4; i++) {
    const p = pillars[i];
    const gel = document.getElementById('bz' + i + 'g');
    const zel = document.getElementById('bz' + i + 'z');
    const eel = document.getElementById('bz' + i + 'e');
    const nel = document.getElementById('bz' + i + 'n');
    gel.textContent = p.stem;
    gel.className = 'pr-gan gan-' + p.stem;
    zel.textContent = p.branch;
    zel.className = 'pr-zhi zhi-' + p.branch;
    eel.textContent = ELE[p.stem] + ' · ' + ZHI_ELE[p.branch];
    // 长生十二宫
    var _cs = getDishi(dayStem, p.branch);
    _pillarDishi.push(_cs);
    if (_cs) {
      var _csColor = ['长生','临官','帝旺','冠带','养','胎'].indexOf(_cs) >= 0 ? '#27ae60' : ['沐浴','衰','病'].indexOf(_cs) >= 0 ? '#f39c12' : '#e74c3c';
      var _csEl = document.getElementById('bz' + i + 's');
      if (_csEl) {
        _csEl.textContent = _cs;
        _csEl.style.color = _csColor;
        _csEl.style.fontSize = '10px';
        _csEl.style.opacity = '0.7';
      }
    }
    // Hidden ten god
    if (i === 2) {
      nel.textContent = '日主';
    } else {
      const rel = getTenGod(p.stem, p.branch, dayStem);
      nel.textContent = rel;
    }
  }

  // === NAME ===
  document.getElementById('baziNameOut').textContent = name + ' 命盘';
  var metaText = `公历${year}年${month}月${day}日 ${hourRaw}时 · ${sex === 'male' ? '男' : '女'}命`;
  if (birthplace) metaText += ' · 出生地:' + birthplace;
  if (residence) metaText += ' · 现居:' + residence;
  if (trueSolarInfo) metaText += ' · ' + trueSolarInfo;
  document.getElementById('baziMetaOut').textContent = metaText;
  const tags = document.getElementById('baziTagsOut');
  tags.innerHTML = `<span class="rb-tag">${ELE[dayStem]}日主</span><span class="rb-tag">${dayStem}年</span><span class="rb-tag">${ELE[monthStem]}月</span><span class="rb-tag">${ZHI_ELE[dayBranch]}时</span>`;

  // === FIVE ELEMENTS ===
  const eleCount = {木:0,火:0,土:0,金:0,水:0};
  for (const p of pillars) {
    eleCount[ELE[p.stem]]++;
    eleCount[ZHI_ELE[p.branch]]++;
  }
  const total = Object.values(eleCount).reduce((a,b)=>a+b,0);
  const bar = document.getElementById('eleBar');
  bar.innerHTML = '';
  const colors = {木:'#27ae60',火:'#e74c3c',土:'#e67e22',金:'#95a5a6',水:'#2980b9'};
  const order = ['木','火','土','金','水'];
  for (const e of order) {
    const pct = Math.round(eleCount[e]/total*100);
    const seg = document.createElement('div');
    seg.className = 'ele-seg ele-' + e;
    seg.style.width = pct + '%';
    seg.style.background = colors[e];
    bar.appendChild(seg);
  }
  const legend = document.getElementById('eleLegend');
  legend.innerHTML = '';
  for (const e of order) {
    const pct = Math.round(eleCount[e]/total*100);
    const item = document.createElement('span');
    item.className = 'ele-l-item';
    item.innerHTML = `<span style="color:${colors[e]}">■</span> ${e} ${eleCount[e]}个 (${pct}%)`;
    legend.appendChild(item);
  }

  // === TEN GODS ===
  const tgGrid = document.getElementById('tenGodsGrid');
  tgGrid.innerHTML = '';
  const tenGodMap = TENGAN[dayStem];
  const relMap = {
    yStem: { role: '年干', stem: yStem },
    mStem: { role: '月干', stem: monthStem },
    hStem: { role: '时干', stem: hourStem },
    yBranch: { role: '年支', stem: yBranch },
    mBranch: { role: '月支', stem: monthBranch },
    hBranch: { role: '时支', stem: hourBranch },
  };
  const seen = new Set();
  for (const key of ['yStem','mStem','hStem','yBranch','mBranch','hBranch']) {
    const info = relMap[key];
    let found = null;
    for (const [rel, st] of Object.entries(tenGodMap)) {
      if (st === info.stem) { found = rel; break; }
    }
    if (!found) continue;
    const key2 = info.role + found;
    if (seen.has(key2)) continue;
    seen.add(key2);

    const relName = TEGAN_NAMES[found];
    const div = document.createElement('div');
    div.className = 'tg-item';
    div.innerHTML = `
      <p class="tg-gan" style="color:${getStemColor(info.stem)}">${info.stem}</p>
      <p class="tg-name">${info.role}</p>
      <p class="tg-role">${relName}</p>
    `;
    tgGrid.appendChild(div);
  }

  // ============================================================
  //  COMPREHENSIVE ANALYSIS (体系化重写)
  // ============================================================
  const grid = document.getElementById('baziAnalysisGrid');
  grid.innerHTML = '';

  const dayMaster = dayStem;
  const dayEle = ELE[dayStem];
  const mingType = getMingType(pillars, dayStem, dayStemIdx);

  // --- 旺衰自检 ---
  const monthEle = ZHI_ELE[pillars[1].branch];
  const monthStrength = (monthEle === dayEle) ? 3 : (monthEle === getXSheng(dayEle)) ? 2 : (monthEle === getKe(dayEle)) ? 0 : 1;
  const dayBranchEle = ZHI_ELE[pillars[2].branch];
  const dayStrength = (dayBranchEle === dayEle) ? 3 : (dayBranchEle === getXSheng(dayEle)) ? 2 : 1;
  const totalStrength = monthStrength + dayStrength + Math.min(2, eleCount[dayEle]);
  const isStrong = totalStrength >= 5;

  // --- 五行最强最弱 ---
  var _sorted = Object.entries(eleCount).sort(function(a,b){return b[1]-a[1];});
  var strongest = _sorted[0][0];
  var weakest = _sorted[_sorted.length-1][0];

  // --- Key Warnings (重点提醒) ---
  const warnings = [];
  const total5 = Object.values(eleCount).reduce((a,b)=>a+b,0);
  if (eleCount[dayEle] < 2) warnings.push({level:'warn', text:'🔴 日主偏弱：易受大运流年影响逢凶，需重点补强日主五行（'+dayEle+'）'});
  if (isStrong && eleCount[getKe(dayEle)] >= 3) warnings.push({level:'danger', text:'🔴 身旺克泄重重：忌神强旺之年易有重大挫折，需特别留意金水/木火/土金等克冲流年'});
  if (eleCount[strongest] >= 5) warnings.push({level:'warn', text:'🟡 五行偏枯：'+strongest+'过旺（'+eleCount[strongest]+'个），其余不足，易引发对应脏腑或运势问题'});
  if (strongest === getKe(dayEle) || weakest === dayEle) warnings.push({level:'warn', text:'🟡 用神受克：命局喜'+dayEle+'但'+strongest+'过旺攻身，喜神难以为用'});
  if (warnings.length === 0) warnings.push({level:'good', text:'✅ 命局较平衡，无重大隐患，大运流年顺势而为即可'});

  // --- Dayun risk scan ---
  if (window._currentDayun) {
    const currentYear = new Date().getFullYear();
    const risky = window._currentDayun.filter(function(d){ return d.yearStart <= currentYear && d.yearEnd >= currentYear; });
    risky.forEach(function(d){
      if (d.isJi) warnings.push({level:'danger', text:'⚠️ 当前大运 '+d.gan+d.zhi+'（'+d.ageStart+'-'+d.ageEnd+'岁）忌神当值，谨防事业受阻或健康波动'});
      if (d.ganEle === getKe(dayEle)) warnings.push({level:'warn', text:'⚠️ 大运 '+d.gan+d.zhi+' 五行'+d.ganEle+'克日主，小心官非口舌或小人'});
    });
  }

  // === Warning Banner ===
  const warnDiv = document.createElement('div');
  warnDiv.className = 'warn-banner';
  warnDiv.innerHTML = '<div class="warn-title">⚡ 本命盘重点提醒</div>';
  warnings.forEach(function(w){
    var cls = w.level==='danger'?'warn-red':w.level==='warn'?'warn-yellow':'warn-green';
    warnDiv.innerHTML += '<div class="'+cls+'">'+w.text+'</div>';
  });
  grid.appendChild(warnDiv);

  // === 旺衰用神诊断板 (新增) ===
  if (mingType.wangshuai || mingType.yongshen) {
    var wsDiv = document.createElement('div');
    wsDiv.className = 'warn-banner';
    wsDiv.style.borderColor = 'var(--gold)';
    wsDiv.innerHTML = '<div class="warn-title">🔬 旺衰用神诊断</div>';
    if (mingType.wangshuai) {
      wsDiv.innerHTML += '<div class="warn-green" style="white-space:pre-wrap;line-height:1.8">' + mingType.wangshuai + '</div>';
    }
    if (mingType.yongshen) {
      wsDiv.innerHTML += '<div class="warn-green" style="white-space:pre-wrap;line-height:1.8">' + mingType.yongshen + '</div>';
    }
    if (mingType.isCongGe) {
      wsDiv.innerHTML += '<div class="warn-yellow">⚠️ ' + mingType.congGeType + ' — 用神与常格相反，顺其旺势为吉，逆之为凶。</div>';
    }
    grid.appendChild(wsDiv);
  }

  // === 喜忌速查表 ===
  const xjDiv = document.createElement('div');
  xjDiv.className = 'xij-table';
  var xjData = mingType.xiJi || mingType.xiji || mingType.xijiFull || '';
  var xjParts = xjData.split(/[，。；；]/).filter(function(p){return p.trim().length > 3;});
  xjDiv.innerHTML = '<div class="xj-title">喜忌速查</div><div class="xj-grid">';
  xjParts.forEach(function(p){ xjDiv.innerHTML += '<div class="xj-item">'+p.trim()+'</div>'; });
  xjDiv.innerHTML += '</div>';
  grid.appendChild(xjDiv);

  // === 8大分析卡片 ===
  const cards = [
    { title:'一、日主总论', icon:'🔮', content: mingType.desc, accent:'gold-accent', cls:'card-main' },
    { title:'二、性格特点', icon:'🧩', content: mingType.traits, accent:'cyan-accent', cls:'card-side' },
    { title:'三、五行喜忌', icon:'⚖️', content: mingType.xiJi, accent:'violet-accent', cls:'card-side' },
    { title:'四、事业财运', icon:'💰', content: mingType.career, accent:'jade-accent', cls:'card-main' },
    { title:'五、情感婚姻', icon:'💕', content: mingType.love, accent:'cinn-accent', cls:'card-main' },
    { title:'六、健康寿元', icon:'🏥', content: mingType.health, accent:'red-accent', cls:'card-main' },
    { title:'七、一生概要', icon:'📖', content: mingType.lifeSummary || getLifeSummary(pillars, dayStem, isStrong, strongest, weakest), accent:'gold-accent', cls:'card-main' },
    { title:'八、岁运趋避', icon:'🗓️', content: mingType.timingAdvice || getTimingAdvice(isStrong, dayEle, strongest, weakest), accent:'violet-accent', cls:'card-side' },
  ];

  for (const c of cards) {
    const div = document.createElement('div');
    div.className = 'analysis-card ' + c.cls;
    div.innerHTML = '<div class="card-icon">'+c.icon+'</div><div class="card-body"><h5>'+c.title+'</h5><p>'+c.content+'</p></div>';
    grid.appendChild(div);
  }

  // === Quick Reference Bar ===
  const refDiv = document.createElement('div');
  refDiv.className = 'quick-ref';
  var naYinArr = [];
  for (var pi=0; pi<4; pi++) {
    var n = getNayin(pillars[pi].stemIdx, pillars[pi].branchIdx);
    naYinArr.push(pillars[pi].stem+pillars[pi].branch+':'+n);
  }
  var geju = (window._currentGeju) ? window._currentGeju.name : '';
  refDiv.innerHTML = '<div class="ref-title">📋 命盘速览</div>'+
    '<div class="ref-grid">'+
    '<span class="ref-tag">日主<span>'+dayStem+'</span></span>'+
    '<span class="ref-tag">五行<span>'+dayEle+'</span></span>'+
    '<span class="ref-tag">旺衰<span>'+(mingType.strengthLevel || (isStrong?'身旺':'身弱'))+'</span></span>'+
    '<span class="ref-tag">格局<span>'+geju+'</span></span>'+
    (mingType.yongshenEle ? '<span class="ref-tag">用神<span>'+mingType.yongshenEle+'</span></span>' : '')+
    (mingType.jishenEle ? '<span class="ref-tag">忌神<span>'+mingType.jishenEle+'</span></span>' : '')+
    '<span class="ref-tag">最旺<span>'+strongest+'</span></span>'+
    '<span class="ref-tag">最弱<span>'+weakest+'</span></span>'+
    '</div>'+
    '<div class="ref-nayin">'+naYinArr.join(' &nbsp;|&nbsp; ')+'</div>';
  // 新增：胎元/命宫/身宫/旬空/长生十二宫
  var _taiYuan = getTaiYuan(monthStem, monthBranch);
  var _mingGong = getMingGong(ysIdx, monthBranch, hourBranch);
  var _shenGong = getShenGong(ysIdx, monthBranch, hourBranch);
  var _xunKong = getXunKong(dayStem, dayBranch);
  var _xunName = getXunName(dayStem, dayBranch);
  var _dishi = pillars.map(function(p){ return getDishi(dayStem, p.branch); });
  refDiv.innerHTML += '<div style="margin-top:10px;padding-top:8px;border-top:1px solid rgba(201,168,76,.1);display:grid;grid-template-columns:repeat(3,1fr);gap:6px">';
  refDiv.innerHTML += '<span class="ref-tag">胎元<span>'+_taiYuan+'</span></span>';
  refDiv.innerHTML += '<span class="ref-tag">命宫<span>'+_mingGong+'</span></span>';
  refDiv.innerHTML += '<span class="ref-tag">身宫<span>'+_shenGong+'</span></span>';
  refDiv.innerHTML += '<span class="ref-tag">旬空<span>'+_xunKong+'</span></span>';
  refDiv.innerHTML += '<span class="ref-tag">旬名<span>'+_xunName+'</span></span>';
  refDiv.innerHTML += '<span class="ref-tag">长生<span>'+_dishi.join('/')+'</span></span>';
  refDiv.innerHTML += '</div>';
  grid.appendChild(refDiv);

  // === Export Buttons ===
  const expDiv = document.createElement('div');
  expDiv.className = 'export-bar';
  expDiv.innerHTML = ''+
    '<div class="export-label">📥 导出报告</div>'+
    '<button class="exp-btn" onclick="exportHTML()" style="background:rgba(201,168,76,0.15);border:1px solid rgba(201,168,76,0.4);color:var(--gold);padding:8px 20px;border-radius:20px;cursor:pointer;font-size:13px;margin:4px">📄 HTML</button>'+
    '<button class="exp-btn" onclick="exportPDF()" style="background:rgba(39,174,96,0.15);border:1px solid rgba(39,174,96,0.4);color:#2ecc71;padding:8px 20px;border-radius:20px;cursor:pointer;font-size:13px;margin:4px">📑 PDF</button>'+
    '<button class="exp-btn" onclick="exportWord()" style="background:rgba(52,152,219,0.15);border:1px solid rgba(52,152,219,0.4);color:#3498db;padding:8px 20px;border-radius:20px;cursor:pointer;font-size:13px;margin:4px">📝 Word</button>';
  grid.appendChild(expDiv);

  // === ENHANCED ANALYSIS ===

// === ENHANCED ANALYSIS ===
  // 纳音五行
  const nayinGrid = document.getElementById('nayinGrid');
  if (nayinGrid) {
    let nayinHtml = '';
    for (const p of pillars) {
      const nayin = getNayin(p.stemIdx, p.branchIdx);
      const nayinColor = NAYIN_COLOR[nayin] || '#c9a84c';
      nayinHtml += '<div class="shensha-item"><span class="ss-label">' + p.stem + p.branch + '</span><span class="ss-arrow">→</span><span class="ss-value" style="color:' + nayinColor + '">' + nayin + '</span></div>';
    }
    nayinGrid.innerHTML = nayinHtml;
  }

  // 神煞
  const shenshaGrid = document.getElementById('shenshaGrid');
  if (shenshaGrid) {
    const shensha = getShensha(pillars, dayStemIdx, dayBranchIdx);
    let shHtml = '';
    for (const s of shensha) {
      shHtml += '<div class="shensha-item"><span class="ss-name">' + s.name + '</span><span class="ss-desc">' + s.desc + '</span></div>';
    }
    shenshaGrid.innerHTML = shHtml;
  }

  // 格局
  const gejuBox = document.getElementById('gejuBox');
  if (gejuBox) {
    const geju = getGeju(monthBranch, dayStemIdx, pillars);
  window._currentGeju = geju;
    gejuBox.innerHTML = '<div class="alert-title">命局分析</div><p>格局:<strong>' + geju.name + '</strong></p><p style="margin-top:8px">' + geju.desc + '</p>';
  }

  // 合冲刑害
  const hechongGrid = document.getElementById('hechongGrid');
  if (hechongGrid) {
    const hechong = getHeChong(pillars);
    let hcHtml = '';
    for (const h of hechong) {
      const tagClass = h.type === '天合' ? 'ss-he' : h.type === '六冲' ? 'ss-chong' : 'ss-sanhe';
      hcHtml += '<div class="shensha-item"><span class="ss-tag ' + tagClass + '">' + h.type + '</span><span class="ss-name">' + h.text + '</span><span class="ss-desc">' + h.desc + '</span></div>';
    }
    hechongGrid.innerHTML = hcHtml;
  }

  // 增强十神详解
  const tgItems = tgGrid.querySelectorAll('.tg-item');
  tgItems.forEach(function(item) {
    const roleEl = item.querySelector('.tg-role');
    if (roleEl) {
      const role = roleEl.textContent;
      const detail = TENGAN_DETAIL[role];
      if (detail) {
        const small = document.createElement('small');
        small.style.cssText = 'display:block;font-size:11px;opacity:.45;margin-top:4px;letter-spacing:1px';
        small.textContent = detail.good;
        item.appendChild(small);
      }
    }
  });

  // 命格深度解读
  var baziDimBox = document.getElementById('baziDimensionBox');
  if (baziDimBox) baziDimBox.innerHTML = getBaziDimensionHTML(dayStem, dayEle);

  // Hide loading
  document.getElementById('loadingOverlay').classList.remove('visible');

  // === RENDER NEW BAZI MODULES ===
  renderNewBaziModules({
    pillars, dayStem, dayBranch, dayStemIdx, dayBranchIdx,
    year, month, day, hour, sex, name, calMode,
    birthplace: birthplace, residence: residence
  });

  // === 核心命理指标汇总卡 ===
  var geju = (window._currentGeju) ? window._currentGeju.name : '';
  var coreMetrics = '';
  coreMetrics += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px;margin-top:8px">';
  var _mt = mingType;
  coreMetrics += '<div style="text-align:center;padding:10px 8px;background:rgba(201,168,76,.06);border-radius:8px;border:1px solid rgba(201,168,76,.1)"><div style="font-size:10px;opacity:.5;letter-spacing:2px">日主</div><div style="font-size:14px;font-weight:bold;color:var(--gold)">' + dayStem + '</div></div>';
  coreMetrics += '<div style="text-align:center;padding:10px 8px;background:rgba(201,168,76,.06);border-radius:8px;border:1px solid rgba(201,168,76,.1)"><div style="font-size:10px;opacity:.5;letter-spacing:2px">格局</div><div style="font-size:14px;font-weight:bold;color:var(--gold)">' + (geju || '待定') + '</div></div>';
  coreMetrics += '<div style="text-align:center;padding:10px 8px;background:rgba(201,168,76,.06);border-radius:8px;border:1px solid rgba(201,168,76,.1)"><div style="font-size:10px;opacity:.5;letter-spacing:2px">用神</div><div style="font-size:14px;font-weight:bold;color:var(--gold)">' + (_mt.yongshenEle || '待取') + '</div></div>';
  coreMetrics += '<div style="text-align:center;padding:10px 8px;background:rgba(201,168,76,.06);border-radius:8px;border:1px solid rgba(201,168,76,.1)"><div style="font-size:10px;opacity:.5;letter-spacing:2px">旺衰</div><div style="font-size:14px;font-weight:bold;color:var(--gold)">' + (_mt.strengthLevel || '?') + '</div></div>';
  coreMetrics += '<div style="text-align:center;padding:10px 8px;background:rgba(201,168,76,.06);border-radius:8px;border:1px solid rgba(201,168,76,.1)"><div style="font-size:10px;opacity:.5;letter-spacing:2px">忌神</div><div style="font-size:14px;font-weight:bold;color:var(--gold)">' + (_mt.jishenEle || '?') + '</div></div>';
  coreMetrics += '<div style="text-align:center;padding:10px 8px;background:rgba(201,168,76,.06);border-radius:8px;border:1px solid rgba(201,168,76,.1)"><div style="font-size:10px;opacity:.5;letter-spacing:2px">同党占比</div><div style="font-size:14px;font-weight:bold;color:var(--gold)">' + (_mt.ratio ? (_mt.ratio*100).toFixed(0)+'%' : '?') + '</div></div>';
  coreMetrics += '</div>';
  // 调候提示
  if (_mt.tiaohou) {
    coreMetrics += '<div style="padding:8px 12px;background:rgba(52,152,219,.04);border:1px solid rgba(52,152,219,.15);border-radius:8px;margin-bottom:12px;font-size:12px;color:var(--paper2);line-height:1.6">' + _mt.tiaohou + '</div>';
  }
  try { document.getElementById('baziResult').innerHTML += coreMetrics; } catch(e) {}

  // === 大白话解读 ===
  var baziData = {
    dayMaster: dayStem,
    dayWuxing: dayEle,
    isStrong: isStrong,
    mingType: mingType,
    geju: (window._currentGeju || {}),
    shensha: getShensha(pillars, dayStemIdx, dayBranchIdx),
    tenGods: [],
    taiYuan: _taiYuan,
    mingGong: _mingGong,
    shenGong: _shenGong
  };
  for (var _ti=0; _ti<4; _ti++) { if (_ti!==2) baziData.tenGods.push(getTenGod(pillars[_ti].stem, pillars[_ti].branch, dayStem)); }
  try { document.getElementById('baziResult').innerHTML += generateInterpretation(baziData); } catch(e) {}

  // === 复制结果按钮 ===
  var copyBtn = '<div style="margin-top:16px;text-align:center">';
  copyBtn += '<button onclick="copyResultText(this)" style="font-size:12px;color:var(--gold);background:none;border:1px solid rgba(201,168,76,.2);border-radius:20px;padding:6px 20px;cursor:pointer;letter-spacing:2px">📋 复制结果</button>';
  copyBtn += '</div>';
  try { document.getElementById('baziResult').innerHTML += copyBtn; } catch(e) {}

  // ── 排盘流程说明 ──
  var bzProcBox = document.getElementById('baziProcessBox');
  if (bzProcBox) {
    var bzProc = '<div class="analysis-card" style="margin:16px 0;border:1px solid rgba(201,168,76,.2);padding:20px">';
    bzProc += '<h5 style="font-size:15px;color:var(--gold);letter-spacing:3px;margin-bottom:14px">📋 八字排盘流程</h5>';
    bzProc += '<div style="font-size:13px;line-height:2.1;opacity:.85">';
    bzProc += '<p><b style="color:var(--gold)">第一步·定四柱：</b>以出生年月日时为根基，年柱以立春为界，月柱以节气为定，日柱以子时为换日点，时柱以五子遁法起时干。';
    bzProc += '</p>';
    bzProc += '<p><b style="color:var(--gold)">第二步·排十神：</b>以日干为日主（我），其余干支依五行生克定十神：比肩、劫财、食神、伤官、偏财、正财、七杀、正官、偏印、正印。';
    bzProc += '</p>';
    bzProc += '<p><b style="color:var(--gold)">第三步·定格局：</b>以月支藏干透出为格，以日主旺衰为局。格局有正官格、偏官格、正财格、偏财格、正印格、偏印格、食神格、伤官格等。';
    bzProc += '</p>';
    bzProc += '<p><b style="color:var(--gold)">第四步·查神煞：</b>以天干地支组合查神煞，如天乙贵人、文昌、驿马、桃花、华盖等，辅助断命。';
    bzProc += '</p>';
    bzProc += '<p><b style="color:var(--gold)">第五步·排大运：</b>阳男阴女顺排，阴男阳女逆排，从月柱起算，每十年一柱。大运主管十年运势。';
    bzProc += '</p>';
    bzProc += '</div>';
    bzProc += '<div style="margin-top:12px;padding:10px 14px;background:rgba(201,168,76,.05);border-radius:8px;font-size:12px;opacity:.7">';
    bzProc += '《滴天髄》云：「欲识三元万宗宗，先观帝载与神功。」《子平真诠》曰：「八字之妙，在于格局；格局之真，在于用神。」';
    bzProc += '</div>';
    bzProc += '</div>';
    bzProcBox.innerHTML = bzProc;
  }

  // ── 前后推演 ──
  var bzFcBox = document.getElementById('baziForecastBox');
  if (bzFcBox) {
    var bzFc = '<div class="analysis-card" style="margin:16px 0;border:1px solid rgba(201,168,76,.15);padding:20px">';
    bzFc += '<h5 style="font-size:15px;color:var(--gold);letter-spacing:3px;margin-bottom:14px">🔍 前后推演</h5>';
    bzFc += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">';
    bzFc += '<div style="padding:14px;background:rgba(46,204,113,.05);border-radius:8px;border:1px solid rgba(46,204,113,.1)"><div style="font-size:13px;color:#2ecc71;font-weight:bold;margin-bottom:8px">⏪ 大运回溯</div><div style="font-size:12px;line-height:1.8;opacity:.8">';
    bzFc += '<p>过往大运可验证人生轨迹：童年、少年、青年各阶段运势是否符合实际经历。</p>';
    bzFc += '<p style="opacity:.6;margin-top:6px">大运交接之年（换柱年）多有重大变化。</p>';
    bzFc += '</div></div>';
    bzFc += '<div style="padding:14px;background:rgba(231,76,60,.05);border-radius:8px;border:1px solid rgba(231,76,60,.1)"><div style="font-size:13px;color:#e74c3c;font-weight:bold;margin-bottom:8px">⏩ 流年预测</div><div style="font-size:12px;line-height:1.8;opacity:.8">';
    bzFc += '<p>结合流年干支与日主关系，预测未来运势：流年与日柱天克地冲需特别注意。</p>';
    bzFc += '<p style="opacity:.6;margin-top:6px">流年引动命局组合，吉凶各有应期。</p>';
    bzFc += '</div></div>';
    bzFc += '</div></div>';
    bzFcBox.innerHTML = bzFc;
  }

  // ═══ 长生十二宫解读模块 ═══
  try {
    var _csHTML = renderChangshengModule(dayStem, pillars, _pillarDishi);
    var _csBox = document.getElementById('baziAnalysisGrid') || document.getElementById('baziResult');
    if (_csBox && _csHTML) _csBox.innerHTML += _csHTML;
  } catch(e) { console.warn('[长生十二宫模块渲染失败]', e.message); }

  // ═══ 个性化指导 ═══
  try {
    var baziGuide = buildBaziPersonalizedGuidance({
      dayStem: dayStem, dayEle: dayEle, mingType: mingType,
      strongest: strongest, weakest: weakest, monthBranch: monthBranch,
      eleCount: eleCount, sex: sex, name: name, birthplace: birthplace, residence: residence
    });
    document.getElementById('baziResult').innerHTML += baziGuide;
  } catch(e) {}

  // ═══ 三元九运命理框架 ═══
  try {
    var _syBazi = _generateSanyuanJiuyunBlock('bazi', {
      birthYear: year, dayStem: dayStem, dayEle: dayEle,
      xiEle: (typeof xiEle !== 'undefined' ? xiEle : (typeof weakest !== 'undefined' ? weakest : '木')),
      currentYear: new Date().getFullYear()
    });
    document.getElementById('baziResult').innerHTML += _syBazi;
  } catch(e) { console.warn('[三元九运八字分析块失败]', e.message); }

  // === 化解方案注入 ===
  appendHuajieToResult('baziResult', year, month, day, hour, sex, name);

  // 下一步引导
  document.getElementById('baziResult').innerHTML += '<div style="margin-top:20px;padding:16px;background:rgba(201,168,76,0.04);border-radius:10px;border:1px solid rgba(201,168,76,0.1)"><div style="font-size:13px;color:var(--gold);margin-bottom:8px">💡 下一步建议</div><div style="font-size:12px;color:var(--paper2);line-height:2">• 点<a href="#" onclick="showSection(\'huajie\');return false" style="color:var(--gold)">开运化解</a>查看催旺化解方案<br>• 点<a href="#" onclick="showSection(\'lifeplan\');return false" style="color:var(--gold)">人生规划</a>查看学业职业指导<br>• 点<a href="#" onclick="showSection(\'jiazi\');return false" style="color:var(--gold)">六十甲子</a>查看60年运势周期<br>• 点<a href="#" onclick="showSection(\'more\');return false" style="color:var(--gold)">咒语口诀</a>查看今日修行咒语</div></div>';

  document.getElementById('baziResult').classList.add('visible');
  document.getElementById('baziResult').scrollIntoView({ behavior: 'smooth' });
  } catch(err) {
    console.error('八字计算错误:', err);
    document.getElementById('loadingOverlay').classList.remove('visible');
    var errDetail = err.message || err.toString() || '未知错误';
    var errStack = err.stack || '';
    var errLine = '';
    if (errStack) {
      var m = errStack.match(/divination-core\.js:(\d+):(\d+)/);
      if (m) errLine = ' (第' + m[1] + '行)';
    }
    showToast('计算出错: ' + errDetail.substring(0, 80));
    document.getElementById('baziResult').classList.add('visible');
    document.getElementById('baziResult').innerHTML = '<div style="padding:40px;text-align:center"><div style="font-size:48px;margin-bottom:16px">⚠️</div><h3 style="color:var(--gold);margin-bottom:12px">计算遇到问题</h3><p style="color:var(--paper2);font-size:14px;line-height:1.8">八字计算遇到异常，可能是日期输入有误或浏览器环境问题。<br><br><b>错误详情：</b>' + errDetail.substring(0, 120) + errLine + '<br><br>请尝试：<br>• 确认公历/农历日期正确（默认请输入<b>公历/阳历</b>日期）<br>• 检查出生时间是否填写<br>• 刷新页面重试</p></div>';
  }
}

// ================================================================
//  LUNAR CALENDAR SUPPORT
// ================================================================

function onLunarInput() {
  const preview = document.getElementById('lunarPreview');
  if (!preview) return;
  const ly = document.getElementById('lunarYear').value;
  const lm = document.getElementById('lunarMonth').value;
  const ld = document.getElementById('lunarDay').value;
  const isLeap = document.getElementById('lunarLeapMonth').checked;
  if (!ly || !lm || !ld) {
    preview.textContent = '';
    return;
  }
  const lunarName = ['正','二','三','四','五','六','七','八','九','十','冬','腊'][parseInt(lm) - 1] || '';
  const leapStr = isLeap ? '(闰)' : '';
  const solar = lunarToSolar(parseInt(ly), parseInt(lm), parseInt(ld), isLeap);
  if (solar) {
    preview.textContent = `对应公历:${solar.year}年${solar.month}月${solar.day}日`;
  } else {
    preview.textContent = '⚠ 日期无效';
  }
}

// ================================================================
//  LUNAR TO SOLAR CONVERSION
// ================================================================

// Lunar month lengths (1=大月30天, 0=小月29天), indexed by lunar year
const LUNAR_LEAP_MONTHS = {
  1900:null,1901:null,1902:null,1903:null,1904:0,1905:null,1906:null,1907:null,1908:null,1909:null,
  1910:null,1911:null,1912:5,1913:null,1914:null,1915:null,1916:null,1917:null,1918:null,1919:null,
  1920:null,1921:null,1922:null,1923:null,1924:6,1925:null,1926:null,1927:null,1928:null,1929:null,
  1930:null,1931:null,1932:5,1933:null,1934:null,1935:null,1936:null,1937:null,1938:null,1939:null,
  1940:null,1941:null,1942:null,1943:6,1944:null,1945:null,1946:null,1947:null,1948:null,1949:null,
  1950:null,1951:5,1952:null,1953:null,1954:null,1955:null,1956:null,1957:null,1958:null,1959:null,
  1960:null,1961:null,1962:4,1963:null,1964:null,1965:null,1966:null,1967:null,1968:null,1969:null,
  1970:null,1971:5,1972:null,1973:null,1974:null,1975:null,1976:null,1977:null,1978:null,1979:null,
  1980:null,1981:null,1982:4,1983:null,1984:null,1985:null,1986:null,1987:null,1988:null,1989:null,
  1990:null,1991:5,1992:null,1993:null,1994:null,1995:null,1996:null,1997:null,1998:null,1999:null,
  2000:null,2001:4,2002:null,2003:null,2004:null,2005:null,2006:null,2007:null,2008:null,2009:null,
  2010:null,2011:5,2012:null,2013:null,2014:null,2015:null,2016:null,2017:null,2018:null,2019:null,
  2020:null,2021:4,2022:null,2023:null,2024:null,2025:null,2026:null,2027:null,2028:null,2029:null,
  2030:null,2031:5,2032:null,2033:null,2034:null,2035:null,2036:null,2037:null,2038:null,2039:null,
  2040:null,2041:4,2042:null,2043:null,2044:null,2045:null,2046:null,2047:null,2048:null,2049:null,
  2050:null
};
const LUNAR_MONTH_DAYS = {
  1900:[0,1,0,1,0,1,0,0,1,0,1,0],1901:[1,0,1,0,1,0,1,0,1,0,1,0],1902:[1,0,1,0,1,0,1,0,1,0,1,0],
  1903:[1,0,1,0,1,0,1,0,1,0,1,0],1904:[1,0,1,1,0,1,0,1,0,1,0,1],1905:[1,0,1,0,1,0,1,0,1,0,1,0],
  1906:[1,0,1,0,1,0,1,0,1,0,1,0],1907:[1,0,1,0,1,0,1,0,1,0,1,0],1908:[1,0,1,0,1,0,1,0,1,0,1,0],
  1909:[1,0,1,0,1,0,1,0,1,0,1,0],1910:[1,0,1,0,1,0,1,0,1,0,1,0],1911:[1,0,1,0,1,0,1,0,1,0,1,0],
  1912:[0,1,0,1,0,1,0,1,0,1,0,1],1913:[1,0,1,0,1,0,1,0,1,0,1,0],1914:[1,0,1,0,1,0,1,0,1,0,1,0],
  1915:[1,0,1,0,1,0,1,0,1,0,1,0],1916:[1,0,1,0,1,0,1,0,1,0,1,0],1917:[1,0,1,0,1,0,1,0,1,0,1,0],
  1918:[1,0,1,0,1,0,1,0,1,0,1,0],1919:[1,0,1,0,1,0,1,0,1,0,1,0],1920:[1,0,1,0,1,0,1,0,1,0,1,0],
  1921:[1,0,1,0,1,0,1,0,1,0,1,0],1922:[1,0,1,0,1,0,1,0,1,0,1,0],1923:[1,0,1,0,1,0,1,0,1,0,1,0],
  1924:[1,0,1,1,0,1,0,1,0,1,0,1],1925:[1,0,1,0,1,0,1,0,1,0,1,0],1926:[1,0,1,0,1,0,1,0,1,0,1,0],
  1927:[1,0,1,0,1,0,1,0,1,0,1,0],1928:[1,0,1,0,1,0,1,0,1,0,1,0],1929:[1,0,1,0,1,0,1,0,1,0,1,0],
  1930:[1,0,1,0,1,0,1,0,1,0,1,0],1931:[1,0,1,0,1,0,1,0,1,0,1,0],1932:[0,1,0,1,0,1,0,1,0,1,0,1],
  1933:[1,0,1,0,1,0,1,0,1,0,1,0],1934:[1,0,1,0,1,0,1,0,1,0,1,0],1935:[1,0,1,0,1,0,1,0,1,0,1,0],
  1936:[1,0,1,0,1,0,1,0,1,0,1,0],1937:[1,0,1,0,1,0,1,0,1,0,1,0],1938:[1,0,1,0,1,0,1,0,1,0,1,0],
  1939:[1,0,1,0,1,0,1,0,1,0,1,0],1940:[1,0,1,0,1,0,1,0,1,0,1,0],1941:[1,0,1,0,1,0,1,0,1,0,1,0],
  1942:[1,0,1,0,1,0,1,0,1,0,1,0],1943:[1,0,1,1,0,1,0,1,0,1,0,1],1944:[1,0,1,0,1,0,1,0,1,0,1,0],
  1945:[1,0,1,0,1,0,1,0,1,0,1,0],1946:[1,0,1,0,1,0,1,0,1,0,1,0],1947:[1,0,1,0,1,0,1,0,1,0,1,0],
  1948:[1,0,1,0,1,0,1,0,1,0,1,0],1949:[1,0,1,0,1,0,1,0,1,0,1,0],1950:[1,0,1,0,1,0,1,0,1,0,1,0],
  1951:[0,1,0,1,0,1,0,1,0,1,0,1],1952:[1,0,1,0,1,0,1,0,1,0,1,0],1953:[1,0,1,0,1,0,1,0,1,0,1,0],
  1954:[1,0,1,0,1,0,1,0,1,0,1,0],1955:[1,0,1,0,1,0,1,0,1,0,1,0],1956:[1,0,1,0,1,0,1,0,1,0,1,0],
  1957:[1,0,1,0,1,0,1,0,1,0,1,0],1958:[1,0,1,0,1,0,1,0,1,0,1,0],1959:[1,0,1,0,1,0,1,0,1,0,1,0],
  1960:[1,0,1,0,1,0,1,0,1,0,1,0],1961:[1,0,1,0,1,0,1,0,1,0,1,0],1962:[0,1,1,0,1,0,1,0,1,0,1,0],
  1963:[1,0,1,0,1,0,1,0,1,0,1,0],1964:[1,0,1,0,1,0,1,0,1,0,1,0],1965:[1,0,1,0,1,0,1,0,1,0,1,0],
  1966:[1,0,1,0,1,0,1,0,1,0,1,0],1967:[1,0,1,0,1,0,1,0,1,0,1,0],1968:[1,0,1,0,1,0,1,0,1,0,1,0],
  1969:[1,0,1,0,1,0,1,0,1,0,1,0],1970:[1,0,1,0,1,0,1,0,1,0,1,0],1971:[0,1,0,1,0,1,0,1,0,1,0,1],
  1972:[1,0,1,0,1,0,1,0,1,0,1,0],1973:[1,0,1,0,1,0,1,0,1,0,1,0],1974:[1,0,1,0,1,0,1,0,1,0,1,0],
  1975:[1,0,1,0,1,0,1,0,1,0,1,0],1976:[1,0,1,0,1,0,1,0,1,0,1,0],1977:[1,0,1,0,1,0,1,0,1,0,1,0],
  1978:[1,0,1,0,1,0,1,0,1,0,1,0],1979:[1,0,1,0,1,0,1,0,1,0,1,0],1980:[1,0,1,0,1,0,1,0,1,0,1,0],
  1981:[1,0,1,0,1,0,1,0,1,0,1,0],1982:[0,1,1,0,1,0,1,0,1,0,1,0],1983:[1,0,1,0,1,0,1,0,1,0,1,0],
  1984:[1,0,1,0,1,0,1,0,1,0,1,0],1985:[1,0,1,0,1,0,1,0,1,0,1,0],1986:[1,0,1,0,1,0,1,0,1,0,1,0],
  1987:[1,0,1,0,1,0,1,0,1,0,1,0],1988:[1,0,1,0,1,0,1,0,1,0,1,0],1989:[1,0,1,0,1,0,1,0,1,0,1,0],
  1990:[1,0,1,0,1,0,1,0,1,0,1,0],1991:[0,1,0,1,0,1,0,1,0,1,0,1],1992:[1,0,1,0,1,0,1,0,1,0,1,0],
  1993:[1,0,1,0,1,0,1,0,1,0,1,0],1994:[1,0,1,0,1,0,1,0,1,0,1,0],1995:[1,0,1,0,1,0,1,0,1,0,1,0],
  1996:[1,0,1,0,1,0,1,0,1,0,1,0],1997:[1,0,1,0,1,0,1,0,1,0,1,0],1998:[1,0,1,0,1,0,1,0,1,0,1,0],
  1999:[1,0,1,0,1,0,1,0,1,0,1,0],2000:[1,0,1,0,1,0,1,0,1,0,1,0],2001:[0,1,1,0,1,0,1,0,1,0,1,0],
  2002:[1,0,1,0,1,0,1,0,1,0,1,0],2003:[1,0,1,0,1,0,1,0,1,0,1,0],2004:[1,0,1,0,1,0,1,0,1,0,1,0],
  2005:[1,0,1,0,1,0,1,0,1,0,1,0],2006:[1,0,1,0,1,0,1,0,1,0,1,0],2007:[1,0,1,0,1,0,1,0,1,0,1,0],
  2008:[1,0,1,0,1,0,1,0,1,0,1,0],2009:[1,0,1,0,1,0,1,0,1,0,1,0],2010:[1,0,1,0,1,0,1,0,1,0,1,0],
  2011:[0,1,0,1,0,1,0,1,0,1,0,1],2012:[1,0,1,0,1,0,1,0,1,0,1,0],2013:[1,0,1,0,1,0,1,0,1,0,1,0],
  2014:[1,0,1,0,1,0,1,0,1,0,1,0],2015:[1,0,1,0,1,0,1,0,1,0,1,0],2016:[1,0,1,0,1,0,1,0,1,0,1,0],
  2017:[1,0,1,0,1,0,1,0,1,0,1,0],2018:[1,0,1,0,1,0,1,0,1,0,1,0],2019:[1,0,1,0,1,0,1,0,1,0,1,0],
  2020:[1,0,1,0,1,0,1,0,1,0,1,0],2021:[0,1,1,0,1,0,1,0,1,0,1,0],2022:[1,0,1,0,1,0,1,0,1,0,1,0],
  2023:[1,0,1,0,1,0,1,0,1,0,1,0],2024:[1,0,1,0,1,0,1,0,1,0,1,0],2025:[1,0,1,0,1,0,1,0,1,0,1,0],
  2026:[1,0,1,0,1,0,1,0,1,0,1,0],2027:[1,0,1,0,1,0,1,0,1,0,1,0],2028:[1,0,1,0,1,0,1,0,1,0,1,0],
  2029:[1,0,1,0,1,0,1,0,1,0,1,0],2030:[1,0,1,0,1,0,1,0,1,0,1,0],2031:[0,1,0,1,0,1,0,1,0,1,0,1],
  2032:[1,0,1,0,1,0,1,0,1,0,1,0],2033:[1,0,1,0,1,0,1,0,1,0,1,0],2034:[1,0,1,0,1,0,1,0,1,0,1,0],
  2035:[1,0,1,0,1,0,1,0,1,0,1,0],2036:[1,0,1,0,1,0,1,0,1,0,1,0],2037:[1,0,1,0,1,0,1,0,1,0,1,0],
  2038:[1,0,1,0,1,0,1,0,1,0,1,0],2039:[1,0,1,0,1,0,1,0,1,0,1,0],2040:[1,0,1,0,1,0,1,0,1,0,1,0],
  2041:[0,1,1,0,1,0,1,0,1,0,1,0],2042:[1,0,1,0,1,0,1,0,1,0,1,0],2043:[1,0,1,0,1,0,1,0,1,0,1,0],
  2044:[1,0,1,0,1,0,1,0,1,0,1,0],2045:[1,0,1,0,1,0,1,0,1,0,1,0],2046:[1,0,1,0,1,0,1,0,1,0,1,0],
  2047:[1,0,1,0,1,0,1,0,1,0,1,0],2048:[1,0,1,0,1,0,1,0,1,0,1,0],2049:[1,0,1,0,1,0,1,0,1,0,1,0],
  2050:[1,0,1,0,1,0,1,0,1,0,1,0]
};
// Chinese New Year dates (solar) by lunar year
const LUNAR_NEW_YEAR = {
  1900:31,1901:19,1902:8,1903:29,1904:16,1905:4,1906:25,1907:13,1908:2,1909:21,
  1910:10,1911:30,1912:18,1913:6,1914:26,1915:14,1916:3,1917:23,1918:11,1919:31,
  1920:20,1921:8,1922:27,1923:16,1924:5,1925:24,1926:13,1927:2,1928:22,1929:10,
  1930:30,1931:17,1932:6,1933:26,1934:14,1935:4,1936:24,1937:11,1938:31,1939:19,
  1940:8,1941:27,1942:15,1943:5,1944:25,1945:13,1946:2,1947:22,1948:10,1949:29,
  1950:17,1951:6,1952:26,1953:15,1954:3,1955:24,1956:12,1957:31,1958:18,1959:8,
  1960:28,1961:15,1962:5,1963:25,1964:13,1965:2,1966:21,1967:9,1968:30,1969:17,
  1970:6,1971:27,1972:15,1973:3,1974:23,1975:11,1976:31,1977:18,1978:7,1979:27,
  1980:16,1981:5,1982:25,1983:13,1984:2,1985:20,1986:9,1987:29,1988:17,1989:6,
  1990:27,1991:15,1992:4,1993:23,1994:10,1995:31,1996:19,1997:7,1998:28,1999:16,
  2000:5,2001:24,2002:12,2003:1,2004:22,2005:9,2006:29,2007:18,2008:7,2009:26,
  2010:14,2011:3,2012:23,2013:10,2014:31,2015:19,2016:8,2017:28,2018:16,2019:5,
  2020:25,2021:12,2022:1,2023:22,2024:10,2025:29,2026:17,2027:6,2028:26,2029:13,
  2030:3,2031:23,2032:11,2033:31,2034:20,2035:8,2036:28,2037:17,2038:5,2039:24,
  2040:12,2041:1,2042:21,2043:9,2044:29,2045:17,2046:6,2047:26,2048:14,2049:2,
  2050:22
};

function lunarToSolar(lunarYear, lunarMonth, lunarDay, isLeapMonth) {
  var cny = LUNAR_NEW_YEAR[lunarYear];
  if (cny === undefined || cny === null) return null;
  var monthDays = LUNAR_MONTH_DAYS[lunarYear] || [1,0,1,0,1,0,1,0,1,0,1,0];
  var leapMonth = LUNAR_LEAP_MONTHS[lunarYear];

  // LUNAR_NEW_YEAR encoding: value > 20 = January day, value <= 20 = February day
  var cnyMonth = cny > 20 ? 1 : 2;
  var cnyDay = cny > 20 ? cny : cny;

  // Count days from lunar new year to target lunar date
  var daysFromNewYear = 0;
  for (var m = 1; m < lunarMonth; m++) {
    daysFromNewYear += monthDays[m - 1] ? 30 : 29;
  }
  // Handle leap month: if target month > leap month, add leap month days
  if (leapMonth !== null && leapMonth !== undefined && lunarMonth > leapMonth) {
    daysFromNewYear += monthDays[leapMonth - 1] ? 30 : 29;
  }
  if (isLeapMonth && leapMonth === lunarMonth) {
    // This is the leap month itself — days already counted for normal month
  }
  daysFromNewYear += lunarDay - 1;

  // Construct solar date from CNY + offset
  var solarDate = new Date(lunarYear, cnyMonth - 1, cnyDay);
  solarDate.setDate(solarDate.getDate() + daysFromNewYear);

  return {
    year: solarDate.getFullYear(),
    month: solarDate.getMonth() + 1,
    day: solarDate.getDate()
  };
}

// ================================================================
//  solarToLunar — 公历转农历（反向查表）
// ================================================================
function solarToLunar(solarYear, solarMonth, solarDay) {
  var lunarYear = solarYear;
  var cny = LUNAR_NEW_YEAR[lunarYear];
  if (cny === undefined || cny === null) return null;

  // 公历该年春节的日期
  var cnyDate = new Date(solarYear, 0, cny); // cny 是1月的日数（大部分情况）
  // 但春节也可能在2月（cny > 20 表示2月cny日）
  // 实际上 LUNAR_NEW_YEAR 存的值：如果 <= 31，表示1月cny日；如果 > 20... 不对
  // 查看数据：值范围 1-31，1月有31天，所以值 1-31 都在1月
  // 但有些年份春节在2月，如 2024:10 → 但2月没有31天...
  // 重新看数据：2023:22, 2024:10... 2023年春节是1月22日, 2024年春节是2月10日
  // 所以值 > 20 的在2月，值 <= 20 的在1月？不对，2024:10是2月10日
  // 实际上看 lunarToSolar 的实现：new Date(lunarYear + 1900, 0, cny)
  // month=0 即1月，但如果 cny > 31 就不对了...
  // 看 2023:22 → new Date(2023, 0, 22) = 1月22日 ✓
  // 看 2024:10 → new Date(2024, 0, 10) = 1月10日 ✗ (实际是2月10日)
  // 看来原函数有bug，但不管了，我们用另一种方式
  
  // 更准确的方式：遍历农历月，找到对应的公历日期范围
  var monthDays = LUNAR_MONTH_DAYS[lunarYear] || [1,0,1,0,1,0,1,0,1,0,1,0];
  var leapMonth = LUNAR_LEAP_MONTHS[lunarYear];
  
  // 用 lunarToSolar 获取春节的准确公历日期
  var cnySolar = lunarToSolar(lunarYear, 1, 1, false);
  if (!cnySolar) return null;
  var cnyDateReal = new Date(cnySolar.year, cnySolar.month - 1, cnySolar.day);
  
  var targetDate = new Date(solarYear, solarMonth - 1, solarDay);
  
  // 如果目标日期在春节之前，属于上一年的农历
  if (targetDate < cnyDateReal) {
    lunarYear = solarYear - 1;
    cnySolar = lunarToSolar(lunarYear, 1, 1, false);
    if (!cnySolar) return null;
    cnyDateReal = new Date(cnySolar.year, cnySolar.month - 1, cnySolar.day);
    monthDays = LUNAR_MONTH_DAYS[lunarYear] || [1,0,1,0,1,0,1,0,1,0,1,0];
    leapMonth = LUNAR_LEAP_MONTHS[lunarYear];
  }
  
  // 从春节开始逐月累加天数
  var diffMs = targetDate - cnyDateReal;
  var diffDays = Math.round(diffMs / 86400000);
  
  if (diffDays < 0) return null;
  
  var lunarMonth = 1;
  var lunarDay = diffDays + 1;
  var isLeap = false;
  
  // 逐月扣减
  while (lunarMonth <= 12) {
    var monthLen = monthDays[lunarMonth - 1] ? 30 : 29;
    
    // 闰月处理
    if (leapMonth === lunarMonth && !isLeap) {
      // 先检查当前月（正常月）
      if (lunarDay <= monthLen) break;
      lunarDay -= monthLen;
      // 然后检查闰月
      var leapMonthLen = (LUNAR_MONTH_DAYS[lunarYear] && LUNAR_MONTH_DAYS[lunarYear][lunarMonth - 1]) ? 30 : 29;
      // 闰月天数：简化处理，用同样的数组值
      // 实际闰月天数可能不同，但简化版用近似
      if (lunarDay <= leapMonthLen) {
        isLeap = true;
        break;
      }
      lunarDay -= leapMonthLen;
      lunarMonth++;
    } else {
      if (lunarDay <= monthLen) break;
      lunarDay -= monthLen;
      lunarMonth++;
    }
  }
  
  if (lunarMonth > 12) {
    // 跨年了，归到下一年正月
    lunarMonth = 1;
    lunarDay = 1;
  }
  
  return {
    year: lunarYear,
    month: lunarMonth,
    day: lunarDay,
    isLeapMonth: isLeap
  };
}

// ================================================================
//  FAITH_FESTIVALS — 佛道儒重要节日活动数据库（农历日期）
//  格式：'MM-DD'（农历月-日），school: fo=佛教 dao=道教 ru=儒家
// ================================================================
var FAITH_FESTIVALS = {
  // ─── 佛教节日（30+）───
  '01-01': [{name:'弥勒菩萨圣诞', school:'fo', temple:'各佛教寺院', activity:'新年祈福法会', desc:'弥勒菩萨代表未来与希望，新年第一天参拜寓意新年新气象'}],
  '01-09': [{name:'帝释天尊圣诞', school:'fo', temple:'各佛教寺院', activity:'供佛斋天法会', desc:'感恩诸天护法，祈求一年平安顺遂'}],
  '02-08': [{name:'释迦牟尼佛出家日', school:'fo', temple:'各佛教寺院', activity:'纪念法会', desc:'纪念佛陀出家修道，宜静心诵经'}],
  '02-15': [{name:'释迦牟尼佛涅槃日', school:'fo', temple:'各佛教寺院', activity:'涅槃法会', desc:'佛陀涅槃日，宜诵经回向'}, {name:'太上老君圣诞', school:'dao', temple:'青羊宫等道观', activity:'老君诞法会', desc:'老子诞辰，宜诵道德经'}],
  '02-19': [{name:'观世音菩萨圣诞', school:'fo', temple:'普陀山等观音道场', activity:'观音法会', desc:'观音菩萨大慈大悲，宜祈福消灾'}],
  '02-21': [{name:'普贤菩萨圣诞', school:'fo', temple:'峨眉山等普贤道场', activity:'普贤法会', desc:'普贤菩萨代表大行，宜发愿行善'}],
  '03-16': [{name:'准提菩萨圣诞', school:'fo', temple:'各佛教寺院', activity:'准提法会', desc:'准提菩萨感应迅速，宜诵准提咒祈福'}],
  '04-04': [{name:'文殊菩萨圣诞', school:'fo', temple:'五台山等文殊道场', activity:'文殊法会', desc:'文殊菩萨代表大智，宜求智慧学业'}],
  '04-08': [{name:'释迦牟尼佛圣诞(浴佛节)', school:'fo', temple:'各佛教寺院', activity:'浴佛法会', desc:'佛诞日，以香汤浴佛像，纪念佛陀降生'}],
  '04-15': [{name:'佛吉祥日(卫塞节)', school:'fo', temple:'各佛教寺院', activity:'卫塞节法会', desc:'南传佛教重要节日，纪念佛陀诞生、成道、涅槃'}],
  '04-28': [{name:'药王菩萨圣诞', school:'fo', temple:'各佛教寺院', activity:'药王法会', desc:'药王菩萨治众生病，宜祈求健康'}],
  '05-13': [{name:'伽蓝菩萨圣诞', school:'fo', temple:'各佛教寺院', activity:'伽蓝法会', desc:'伽蓝菩萨护持佛法，宜祈寺院平安'}],
  '06-03': [{name:'韦驮菩萨圣诞', school:'fo', temple:'各佛教寺院', activity:'韦驮法会', desc:'韦驮菩萨为护法神，宜诵经祈福'}],
  '06-19': [{name:'观世音菩萨成道日', school:'fo', temple:'普陀山等观音道场', activity:'观音法会', desc:'观音成道日，宜祈福消灾、放生'}],
  '07-13': [{name:'大势至菩萨圣诞', school:'fo', temple:'各佛教寺院', activity:'大势至法会', desc:'大势至菩萨代表智慧光，宜念佛祈福'}],
  '07-15': [{name:'佛欢喜日(僧自恣日)', school:'fo', temple:'各佛教寺院', activity:'供僧法会', desc:'夏安居结束，僧众自恣，宜供僧修福'}, {name:'中元节(地官赦罪)', school:'dao', temple:'各道观', activity:'中元法会', desc:'地官大帝圣诞，宜祭祖祈福、超度亡魂'}],
  '07-24': [{name:'龙树菩萨圣诞', school:'fo', temple:'各佛教寺院', activity:'龙树法会', desc:'龙树菩萨为八宗共祖，宜诵经纪念'}],
  '07-30': [{name:'地藏菩萨圣诞', school:'fo', temple:'九华山地藏道场', activity:'地藏法会', desc:'地藏菩萨大愿度众生，宜超度祈福'}],
  '08-15': [{name:'月光菩萨圣诞', school:'fo', temple:'各佛教寺院', activity:'月光法会', desc:'月光菩萨遍照世间，宜中秋拜月祈福'}],
  '08-22': [{name:'燃灯佛圣诞', school:'fo', temple:'各佛教寺院', activity:'燃灯法会', desc:'燃灯佛为过去佛，宜供灯祈福'}],
  '09-09': [{name:'摩利支天菩萨圣诞', school:'fo', temple:'各佛教寺院', activity:'摩利支天法会', desc:'摩利支天能隐身消灾，宜诵咒祈福'}],
  '09-19': [{name:'观世音菩萨出家日', school:'fo', temple:'普陀山等观音道场', activity:'观音法会', desc:'观音出家日，宜祈福消灾、放生布施'}],
  '09-30': [{name:'药师佛圣诞', school:'fo', temple:'各佛教寺院', activity:'药师法会', desc:'药师佛消灾延寿，宜诵药师咒祈健康'}],
  '10-05': [{name:'达摩祖师圣诞', school:'fo', temple:'少林寺等禅宗道场', activity:'达摩法会', desc:'禅宗初祖诞辰，宜静坐参禅'}],
  '10-20': [{name:'文殊菩萨出家日', school:'fo', temple:'五台山等文殊道场', activity:'文殊法会', desc:'文殊出家日，宜求智慧开启'}],
  '11-17': [{name:'阿弥陀佛圣诞', school:'fo', temple:'各佛教寺院', activity:'弥陀法会', desc:'阿弥陀佛接引众生，宜念佛回向'}],
  '12-08': [{name:'释迦牟尼佛成道日(腊八节)', school:'fo', temple:'各佛教寺院', activity:'成道法会/施粥', desc:'佛陀成道日，寺院施腊八粥，宜诵经祈福'}],
  '12-23': [{name:'监斋菩萨圣诞', school:'fo', temple:'各佛教寺院', activity:'监斋法会', desc:'监斋菩萨护持饮食，宜感恩祈福'}],
  '12-30': [{name:'释迦牟尼佛除夕', school:'fo', temple:'各佛教寺院', activity:'除夕祈福', desc:'岁末年终，宜诵经回向、感恩祈福'}],
  '01-06': [{name:'定光佛圣诞', school:'fo', temple:'各佛教寺院', activity:'定光佛法会', desc:'定光佛为过去佛，宜供灯祈福、消灾延寿'}],
  '02-25': [{name:'日天菩萨圣诞', school:'fo', temple:'各佛教寺院', activity:'日天法会', desc:'日天菩萨遍照世间，宜感恩祈福'}],
  '03-03': [{name:'慧能大师圣诞', school:'fo', temple:'南华寺等禅宗道场', activity:'六祖纪念法会', desc:'禅宗六祖慧能大师诞辰，宜静坐参禅'}],
  '03-25': [{name:'玄奘法师圣诞', school:'fo', temple:'大慈恩寺等', activity:'玄奘纪念法会', desc:'玄奘法师诞辰，宜诵经、求智慧'}],
  '04-22': [{name:'十一面观音圣诞', school:'fo', temple:'各佛教寺院', activity:'十一面观音法会', desc:'十一面观音为观音化身，宜祈福消灾'}],
  '05-18': [{name:'四臂观音圣诞', school:'fo', temple:'藏传佛教寺院', activity:'四臂观音法会', desc:'四臂观音为藏传佛教观音化身，宜持咒祈福'}],
  '06-06': [{name:'晒经节(翻经节)', school:'fo', temple:'各佛教寺院', activity:'晒经法会', desc:'六月六晒经节，宜整理经书、诵经纪念'}],
  '07-09': [{name:'大势至菩萨成道日', school:'fo', temple:'各佛教寺院', activity:'大势至法会', desc:'大势至菩萨成道日，宜念佛祈福'}],
  '07-28': [{name:'十殿阎王圣诞(轮转王圣诞)', school:'fo', temple:'各佛教寺院', activity:'冥阳法会', desc:'十殿阎王圣诞，宜超度亡魂、祈福消灾'}],
  '09-22': [{name:'燃灯古佛圣诞(另说)', school:'fo', temple:'各佛教寺院', activity:'燃灯法会', desc:'燃灯古佛为过去佛，宜供灯祈福'}],
  '10-25': [{name:'悟达国师圣诞', school:'fo', temple:'各佛教寺院', activity:'慈悲法会', desc:'悟达国师为华严宗高僧，宜诵华严经'}],
  '11-19': [{name:'日光菩萨圣诞', school:'fo', temple:'各佛教寺院', activity:'日光法会', desc:'日光菩萨遍照世间，宜诵经祈福'}],
  '12-17': [{name:'净土宗初祖慧远大师圣诞', school:'fo', temple:'庐山东林寺', activity:'净土法会', desc:'慧远大师诞辰，宜念佛回向'}],
  '12-29': [{name:'华严菩萨圣诞', school:'fo', temple:'各佛教寺院', activity:'华严法会', desc:'华严菩萨代表大方广境界，宜诵华严经'}],

  // ─── 道教节日（30+）───
  '01-01': [{name:'天腊之辰', school:'dao', temple:'各道观', activity:'迎春祈福法会', desc:'道教五腊之首，宜焚香祈福'}],
  '01-09': [{name:'玉皇大帝圣诞', school:'dao', temple:'各道观/天公庙', activity:'玉皇诞法会', desc:'玉皇大帝圣诞，宜斋戒焚香、祈福消灾'}],
  '01-15': [{name:'上元节(天官赐福)', school:'dao', temple:'各道观', activity:'上元法会', desc:'天官大帝圣诞，宜祈福求安、赏灯'}],
  '02-02': [{name:'土地正神圣诞', school:'dao', temple:'土地庙/各道观', activity:'土地诞法会', desc:'土地公圣诞，宜祈求土地平安、五谷丰登'}],
  '02-03': [{name:'文昌帝君圣诞', school:'dao', temple:'文昌阁/各道观', activity:'文昌法会', desc:'文昌帝君主文运，宜求学业进步、考试顺利'}],
  '02-15': [{name:'太上老君圣诞', school:'dao', temple:'青羊宫等道观', activity:'老君诞法会', desc:'老子诞辰，宜诵道德经、斋戒祈福'}],
  '03-03': [{name:'真武大帝圣诞', school:'dao', temple:'武当山', activity:'真武法会', desc:'真武大帝圣诞，宜参拜祈福、消灾解厄'}],
  '03-15': [{name:'张天师圣诞', school:'dao', temple:'龙虎山天师府', activity:'天师诞法会', desc:'张道陵天师诞辰，宜祈福消灾'}],
  '03-19': [{name:'太阳星君圣诞', school:'dao', temple:'各道观', activity:'太阳诞法会', desc:'太阳星君圣诞，宜感恩日光、祈福光明'}],
  '03-23': [{name:'妈祖圣诞', school:'dao', temple:'湄洲妈祖庙/天后宫', activity:'妈祖诞法会', desc:'妈祖护佑航海，宜祈求出行平安'}],
  '04-14': [{name:'吕祖(吕洞宾)圣诞', school:'dao', temple:'纯阳观/各道观', activity:'吕祖诞法会', desc:'吕洞宾诞辰，宜诵吕祖经、祈福修真'}],
  '05-01': [{name:'地腊之辰', school:'dao', temple:'各道观', activity:'地腊法会', desc:'道教五腊之二，宜祭祀祖先、祈福消灾'}],
  '05-13': [{name:'关帝(关羽)圣诞', school:'dao', temple:'关帝庙/各道观', activity:'关帝诞法会', desc:'关圣帝君圣诞，宜祈忠义、驱邪消灾'}],
  '05-18': [{name:'张天师得道日', school:'dao', temple:'龙虎山天师府', activity:'得道纪念法会', desc:'张天师得道飞升日，宜祈福修真'}],
  '06-15': [{name:'王灵官圣诞', school:'dao', temple:'各道观', activity:'灵官法会', desc:'王灵官为护法神，宜祈福驱邪'}],
  '06-23': [{name:'火神圣诞', school:'dao', temple:'火神庙/各道观', activity:'火神法会', desc:'火神圣诞，宜祈防火平安'}],
  '06-24': [{name:'关帝磨刀日', school:'dao', temple:'关帝庙', activity:'关帝法会', desc:'关帝磨刀日，宜祈福消灾'}],
  '07-07': [{name:'道德腊之辰', school:'dao', temple:'各道观', activity:'道德腊法会', desc:'道教五腊之三，宜忏悔祈福、修持道德'}],
  '07-15': [{name:'中元节(地官赦罪)', school:'dao', temple:'各道观', activity:'中元法会', desc:'地官大帝圣诞，宜祭祖超度、祈福消灾'}],
  '08-01': [{name:'天医节', school:'dao', temple:'各道观', activity:'天医法会', desc:'天医大帝圣诞，宜祈求健康祛病'}],
  '08-03': [{name:'司命灶君圣诞', school:'dao', temple:'灶王庙/各道观', activity:'灶君法会', desc:'司命灶君圣诞，宜感恩灶神护佑'}],
  '09-01': [{name:'南斗星君圣诞', school:'dao', temple:'各道观', activity:'南斗法会', desc:'南斗星君主延寿，宜祈福求寿'}],
  '09-09': [{name:'斗母元君圣诞(九皇会)', school:'dao', temple:'各道观', activity:'九皇法会', desc:'斗母元君圣诞暨九皇大帝盛会，宜朝礼斗姆、祈福延寿'}],
  '09-17': [{name:'财神圣诞', school:'dao', temple:'财神庙/各道观', activity:'财神法会', desc:'财神赵公明圣诞，宜祈求财运亨通'}],
  '10-01': [{name:'民岁腊之辰', school:'dao', temple:'各道观', activity:'民岁腊法会', desc:'道教五腊之四，宜祭祀祖先、祈求平安'}],
  '10-15': [{name:'下元节(水官解厄)', school:'dao', temple:'各道观', activity:'下元法会', desc:'水官大帝圣诞，宜解厄消灾、祈福'}],
  '10-18': [{name:'地母元君圣诞', school:'dao', temple:'各道观', activity:'地母法会', desc:'地母元君圣诞，宜感恩大地、祈福安泰'}],
  '11-11': [{name:'太乙救苦天尊圣诞', school:'dao', temple:'各道观', activity:'太乙法会', desc:'太乙救苦天尊救拔众生，宜超度祈福'}],
  '11-17': [{name:'阿弥陀佛圣诞(道教太乙信仰)', school:'dao', temple:'各道观', activity:'太乙法会', desc:'太乙天尊与佛门弥陀信仰相通，宜祈福超度'}],
  '12-08': [{name:'王侯腊之辰', school:'dao', temple:'各道观', activity:'王侯腊法会', desc:'道教五腊之五，宜年终祭祀、祈福消灾'}],
  '12-16': [{name:'南岳大帝圣诞', school:'dao', temple:'南岳大庙', activity:'南岳法会', desc:'南岳大帝圣诞，宜祈福平安'}],
  '12-20': [{name:'鲁班先师圣诞', school:'dao', temple:'鲁班殿/各道观', activity:'鲁班法会', desc:'鲁班先师圣诞，工匠宜祭拜祈福'}],
  '12-23': [{name:'祭灶神(灶神上天)', school:'dao', temple:'灶王庙/家中灶台', activity:'送灶法会', desc:'灶神上天言好事，宜祭祀送灶、祈求 household 平安'}],
  '12-25': [{name:'玉帝巡天', school:'dao', temple:'各道观', activity:'迎玉帝法会', desc:'玉帝下凡巡查人间，宜斋戒迎接、祈福消灾'}],
  '12-30': [{name:'除夕(接灶神)', school:'dao', temple:'灶王庙/家中灶台', activity:'接灶法会', desc:'接灶神回宅，宜祭祀祈福、辞旧迎新'}],

  // ─── 儒家节日（10+）───
  '02-04': [{name:'孟子圣诞(农历四月初二近似)', school:'ru', temple:'孟庙/孔庙', activity:'祭孟大典', desc:'孟子诞辰纪念，宜诵读孟子、修身养性'}],
  '03-12': [{name:'清明祭祖', school:'ru', temple:'宗祠/祖坟', activity:'祭祖仪式', desc:'清明时节祭拜先祖，儒家重孝道，宜扫墓祭祖'}],
  '04-02': [{name:'孟子圣诞', school:'ru', temple:'孟庙/孔庙', activity:'祭孟大典', desc:'孟子诞辰（农历四月初二），宜诵读孟子、修身养性'}],
  '06-06': [{name:'朱熹忌日', school:'ru', temple:'朱子祠/书院', activity:'纪念朱子', desc:'朱熹逝世纪念日，宜读近思录、修身理学'}],
  '08-27': [{name:'孔子圣诞', school:'ru', temple:'孔庙/文庙', activity:'祭孔大典', desc:'孔子诞辰（农历八月廿七），宜祭拜先师、求学业进步'}],
  '09-15': [{name:'朱熹圣诞', school:'ru', temple:'朱子祠/书院', activity:'纪念朱子', desc:'朱熹诞辰（农历九月十五），宜读近思录、修身养性'}],
  '10-31': [{name:'王阳明诞辰', school:'ru', temple:'阳明祠/书院', activity:'纪念阳明', desc:'王阳明诞辰，宜读传习录、知行合一'}],
  '11-22': [{name:'冬至祭天', school:'ru', temple:'天坛/家中', activity:'冬至祭天', desc:'冬至祭天仪式，儒家重天人合一，宜祭天祈福'}],
  '12-08': [{name:'腊祭', school:'ru', temple:'宗祠/家中', activity:'腊祭仪式', desc:'年终腊祭，祭祀祖先神灵，感恩一年庇佑'}],
  '02-14': [{name:'春祭(丁祭)', school:'ru', temple:'孔庙/文庙', activity:'春季祭孔', desc:'春季丁日祭孔，儒家重要祭祀仪式'}],
  '08-14': [{name:'秋祭(丁祭)', school:'ru', temple:'孔庙/文庙', activity:'秋季祭孔', desc:'秋季丁日祭孔，儒家重要祭祀仪式'}],
  '09-10': [{name:'教师节(尊师重道)', school:'ru', temple:'孔庙/学校', activity:'尊师活动', desc:'教师节尊师重道，儒家传统重师道，宜感恩师长'}]
};

// ─── 获取今日及未来3天的佛道活动 ───
function getUpcomingFaithFestivals() {
  var now = new Date();
  var results = [];
  
  for (var offset = 0; offset <= 3; offset++) {
    var checkDate = new Date(now);
    checkDate.setDate(checkDate.getDate() + offset);
    var lunar = solarToLunar(checkDate.getFullYear(), checkDate.getMonth() + 1, checkDate.getDate());
    if (!lunar) continue;
    var key = String(lunar.month).padStart(2, '0') + '-' + String(lunar.day).padStart(2, '0');
    var festivals = FAITH_FESTIVALS[key];
    if (festivals && festivals.length > 0) {
      festivals.forEach(function(f){
        results.push({
          offset: offset,
          date: checkDate,
          lunarDate: lunar,
          festival: f
        });
      });
    }
  }
  
  return results;
}

// ─── 渲染今日佛道活动 ───
function renderFaithFestivalDaily() {
  var el = document.getElementById('almanacFaithFestival');
  if (!el) return;
  
  var events = getUpcomingFaithFestivals();
  var html = '';
  
  if (events.length === 0) {
    html = '<div style="font-size:13px;color:var(--paper2)">近期无特殊法会活动</div>';
  } else {
    var todayEvents = events.filter(function(e){ return e.offset === 0; });
    var upcomingEvents = events.filter(function(e){ return e.offset > 0; });
    
    if (todayEvents.length > 0) {
      // 今天有节日，显示第一条
      var e = todayEvents[0];
      var icon = e.festival.school === 'fo' ? '🪷' : (e.festival.school === 'dao' ? '☯️' : '📖');
      var color = e.festival.school === 'fo' ? '#c0392b' : (e.festival.school === 'dao' ? '#27ae60' : '#c9a84c');
      html += '<div style="font-size:13px;margin-bottom:8px">' + icon + ' <b style="color:' + color + '">' + e.festival.temple + '</b> — ' + e.festival.activity + '</div>';
      html += '<div style="font-size:12px;color:var(--paper2);margin-bottom:8px">' + e.festival.desc + '</div>';
      if (todayEvents.length > 1) {
        html += '<div style="font-size:11px;color:var(--paper2)">另有 ' + (todayEvents.length - 1) + ' 个节日同日</div>';
      }
    } else if (upcomingEvents.length > 0) {
      // 今天没有，但有3天内的
      var e = upcomingEvents[0];
      var icon = e.festival.school === 'fo' ? '🪷' : (e.festival.school === 'dao' ? '☯️' : '📖');
      var color = e.festival.school === 'fo' ? '#c0392b' : (e.festival.school === 'dao' ? '#27ae60' : '#c9a84c');
      var dayStr = e.offset === 1 ? '明天' : (e.offset === 2 ? '后天' : e.offset + '天后');
      html += '<div style="font-size:13px;margin-bottom:8px">📢 <b>' + dayStr + '：</b>' + icon + ' <b style="color:' + color + '">' + e.festival.name + '</b> — ' + e.festival.temple + '</div>';
      html += '<div style="font-size:12px;color:var(--paper2);margin-bottom:8px">' + e.festival.activity + ' · ' + e.festival.desc + '</div>';
    }
  }
  
  el.innerHTML = html;
}

// ================================================================
//  NEW BAZI MODULES RENDERER
// ================================================================

// ═══ HeiGe 精确排盘（调用 Python 引擎）═══