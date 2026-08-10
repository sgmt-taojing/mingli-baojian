// almanac-engine.js
// R629 Phase 1: 黄历计算引擎（从 divination-core.js 拆分）
// 包含：getMonthGan / toJDN / getDayGanZhi / getJianChu / getXingXiu 等
// 依赖：JIEQI_TABLE 全局表（由 divination-core.js 提供）
// 用法：<script src="js/almanac-engine.js" defer></script>
(function(global){
// ===== 黄历计算引擎 =====
// 天干地支
var TIAN_GAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
var DI_ZHI = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
var SHENG_XIAO = ['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'];
// 二十八星宿（东方苍龙·北方玄武·西方白虎·南方朱雀）
var XING_XIU = ['角','亢','氐','房','心','尾','箕','斗','牛','女','虚','危','室','壁','奎','娄','胃','昴','毕','觜','参','井','鬼','柳','星','张','翼','轸'];
var XING_XIU_ANIMAL = ['蛟','龙','貉','兔','狐','虎','豹','獬','牛','蝠','鼠','燕','猪','㺄','狼','狗','雉','鸡','乌','猴','猿','犴','羊','獐','马','鹿','蛇','蚓'];
// 建除十二神
var JIAN_CHU = ['建','除','满','平','定','执','破','危','成','收','开','闭'];
var JIAN_CHU_YI = {
  '建':['入学','安抚','出行','上任','见贵','求职'],'除':['治病','沐浴','祭祀','解除','扫舍'],'满':['祭祀','祈福','进人口','捕捉','畋猎'],'平':['修造','动土','平整道路'],'定':['祭祀','祈福','冠笄(guān jī)：成年礼','嫁娶','纳采(nà cǎi)：提亲'],'执':['捕捉','畋猎','祭祀','祈福','求嗣'],'破':['求医疗病','破屋坏垣'],'危':['祭祀','祈福','安床','入殓'],'成':['入学','赴任','开市','交易','立券','纳财','嫁娶','祭祀','祈福','求嗣'],'收':['祭祀','祈福','纳财','捕捉','畋猎','开市','交易'],'开':['祭祀','祈福','赴任','上任','见贵','出行','入学','嫁娶','移徙'],'闭':['筑堤防','补垣','塞穴','埋葬']
};
var JIAN_CHU_JI = {
  '建':['动土','开仓'],'除':['求医疗病','出行'],'满':['嫁娶','安葬','移徙','赴任'],'平':['祭祀','祈福','开市','交易'],'定':['诉讼','出行','词讼'],'执':['开市','移徙','出行','嫁娶'],'破':['嫁娶','开市','出行','祭祀','祈福','冠笄','进人口'],'危':['登山','乘船','出行'],'成':['诉讼','词讼','出行','赴任'],'收':['开市','出行','安葬'],'开':['安葬','伐木','畋猎','开仓','出货财'],'闭':['开市','交易','出行','嫁娶','求医疗病','动土']
};
// 彭祖百忌（十干）
var PENG_ZU = ['甲不开仓财物耗散','乙不栽植千株不长','丙不修灶必见灾殃','丁不剃头头必生疮','戊不受田田主不祥','己不破券二比并亡','庚不经络织机虚张','辛不合酱主人不尝','壬不汲水更难提防','癸不词讼理弱敌强'];
// 六冲
var CHONG_MAP = {0:'午',1:'未',2:'申',3:'酉',4:'戌',5:'亥',6:'子',7:'丑',8:'寅',9:'卯',10:'辰',11:'巳'};
// 煞方
var SHA_MAP = {0:'南',1:'东',2:'北',3:'西',4:'南',5:'东',6:'北',7:'西',8:'南',9:'东',10:'北',11:'西'};
// 喜神方位（按日干）
var XI_SHEN = ['艮(东北)','乾(西北)','坤(西南)','离(正南)','巽(东南)','艮(东北)','乾(西北)','坤(西南)','离(正南)','巽(东南)'];
// 福神方位（按日干）
var FU_SHEN = ['巽(东南)','坎(正北)','坎(正北)','离(正南)','艮(东北)','巽(东南)','坎(正北)','离(正南)','乾(西北)','坤(西南)'];
// 财神方位（按日干）
var CAI_SHEN = ['艮(东北)','艮(东北)','坎(正北)','坎(正北)','坎(正北)','坎(正北)','坤(西南)','巽(东南)','巽(东南)','巽(东南)'];
// 胎神占方（60甲子全表）
var TAI_SHEN_60 = [
  '占门碓房内北','碓磨厕外东南','厨灶炉外正南','仓库门房内北','房床栖外正南',  // 甲子-戊辰 0-4
  '占门床场外正南','占碓磨外正南','厨灶碓外西南','仓库炉外西南','房床门内西南',  // 己巳-癸酉 5-9
  '门鸡栖外西南','碓磨床外西南','厨灶碓外西南','仓库厕外正北','房床炉外正南',  // 甲戌-戊寅 10-14
  '占门厕外正南','碓磨栖外正西','厨灶床外正北','仓库碓外西北','房床厕外西北',  // 己卯-癸未 15-19
  '占门炉外西北','碓磨门外正东','厨灶栖外西北','仓库床外西北','房床占外正南',  // 甲申-戊子 20-24
  '占门厕外正南','碓磨炉外正南','厨灶门房外正北','仓库栖外正北','房床场内正北',  // 己丑-癸巳 25-29
  '占门碓房内北','碓磨厕外东南','厨灶炉外正南','仓库门房内北','房床栖外正南',  // 甲午-戊戌 30-34
  '占门床场内南','占碓磨房内南','厨灶厕房内南','仓库炉房内南','房床门房内会',  // 己亥-癸卯 35-39
  '门鸡栖外西南','碓磨床外西南','厨灶碓房内东','仓库厕房内东','房床炉房内中',  // 甲辰-戊申 40-44
  '占门厕外东南','碓磨栖外东南','厨灶床外东南','仓库碓外东南','房床灶外正东',  // 己酉-癸丑 45-49
  '占门碓房内北','碓磨厕外东南','厨灶炉外正南','仓库门房内北','房床栖外正南',  // 甲寅-戊午 50-54
  '占门床场外正南','占碓磨外正南','厨灶碓外西南','仓库炉外西南','房床门内西南'   // 己未-癸亥 55-59
];
// 黄黑道（十二建星与日支关系）
// 日禄时辰（按日干）
var RI_LU = {0:'寅',2:'巳',4:'巳',6:'申',8:'亥'}; // 甲禄寅,丙禄巳,戊禄巳,庚禄申,壬禄亥
// 节气近似日期（公历每月的节气近似日）
var JIE_QI_DATES = [
  [6,20], // 1月 小寒6 大寒20
  [4,19], // 2月 立春4 雨水19
  [6,21], // 3月 惊蛰6 春分21
  [5,20], // 4月 清明5 谷雨20
  [6,21], // 5月 立夏6 小满21
  [6,22], // 6月 芒种6 夏至22
  [7,23], // 7月 小暑7 大暑23
  [8,23], // 8月 立秋8 处暑23
  [8,23], // 9月 白露8 秋分23
  [8,24], // 10月 寒露8 霜降24
  [7,22], // 11月 立冬7 小雪22
  [7,22]  // 12月 大雪7 冬至22
];
// 月支对应表（以节气定月支）
// 寅月(立春-惊蛰) 卯月(惊蛰-清明) 辰月(清明-立夏) 巳月(立夏-芒种)
// 午月(芒种-小暑) 未月(小暑-立秋) 申月(立秋-白露) 酉月(白露-寒露)
// 戌月(寒露-立冬) 亥月(立冬-大雪) 子月(大雪-小寒) 丑月(小寒-立春)
var MONTH_ZHI = ['寅','卯','辰','巳','午','未','申','酉','戌','亥','子','丑'];
// 五虎遁年起月干（年干x2+月序1-based）
function getMonthGan(yearGan, monthZhiIndex) {
  // 五虎遁: 甲己之年丙作首, 乙庚之年戊为头, 丙辛之年寻庚上, 丁壬壬寅顺水流, 戊癸甲寅好追求
  let base = [2,4,6,8,0]; // 丙戊庚壬甲
  let startGan = base[yearGan % 5];
  // 寅月为正月, monthZhiIndex 0=寅
  return (startGan + monthZhiIndex) % 10;
}
// 计算儒略日数(Julian Day Number)
function toJDN(year, month, day) {
  let a = Math.floor((14 - month) / 12);
  let y = year + 4800 - a;
  let m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}
// 根据公历日期判断节气月（返回月支索引 0=寅）
function getMonthZhiIndex(year, month, day) {
  // 每月两个节气, 第一个是节(节气月起点), 第二个是气
  // 节气月: 立春(2/4)开始为寅月
  let jq = JIE_QI_DATES[month - 1];
  let inFirstHalf = day < jq[0]; // 在本月第一个节气之前
  // month对应的月支: 2月=寅(0), 3月=卯(1)... 但要按节气调整
  let monthOffset;
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
  let lcDay = JIE_QI_DATES[1][0]; // 2月第一个节气(立春)近似日
  if (month < 2) return true;
  if (month > 2) return false;
  return day < lcDay;
}
// 计算日柱天干地支
function getDayGanZhi(year, month, day) {
  // 以2024-04-30为甲子日(JDN=2460431)作为参考点
  let jdn = toJDN(year, month, day);
  let jdnRef = 2460431;
  let diff = jdn - jdnRef;
  let gz = ((diff % 60) + 60) % 60;
  return { gan: gz % 10, zhi: gz % 12, index: gz };
}
// 计算年柱（以立春为年界）
function getYearGanZhi(year, month, day) {
  let y = year;
  if (isBeforeLiChun(year, month, day)) y = year - 1;
  // 以1984年为甲子年
  let diff = y - 1984;
  let idx = ((diff % 60) + 60) % 60;
  return { gan: idx % 10, zhi: idx % 12, index: idx };
}
// 计算月柱
function getMonthGanZhi(year, month, day) {
  let yearGZ = getYearGanZhi(year, month, day);
  let monthZhiIdx = getMonthZhiIndex(year, month, day);
  let monthGan = getMonthGan(yearGZ.gan, monthZhiIdx);
  // 将月支序号(0=寅)转换为地支序号(0=子)
  let monthZhiDiIdx = (monthZhiIdx + 2) % 12;
  return { gan: monthGan, zhi: monthZhiDiIdx, index: monthGan * 12 + monthZhiIdx };
}
// 建除十二神计算（以月支为建，日支对应建除序号）
// 注意：传入的monthZhiIdx和dayZhiIdx均为DI_ZHI序号(0=子)
function getJianChu(monthZhiIdx, dayZhiIdx) {
  let offset = (dayZhiIdx - monthZhiIdx + 12) % 12;
  return JIAN_CHU[offset];
}
// 值日星宿（以JDN计算，28天循环）
// 已知2024-05-30为角宿日
function getXingXiu(year, month, day) {
  let jdn = toJDN(year, month, day);
  let refJdn = 2460461; // 2024-05-30 角宿
  let diff = jdn - refJdn;
  let idx = ((diff % 28) + 28) % 28;
  return { name: XING_XIU[idx], animal: XING_XIU_ANIMAL[idx], index: idx };
}
// 黄黑道（根据日干和时支计算十二黄黑道）
// 黄黑道: 根据日支和月支计算
var HUANG_DAO_NAMES = ['青龙(黄道)','明堂(黄道)','天刑(黑道)','朱雀(黑道)','金匮(黄道)','天德(黄道)','白虎(黑道)','玉堂(黄道)','天牢(黑道)','玄武(黑道)','司命(黄道)','勾陈(黑道)'];
// 时辰吉凶（根据日干和时支计算黄黑道）
// 日干对应的时辰黄黑道: 以日干起时辰的建除
function getHourJianChu(dayGan, hourZhiIdx) {
  // 五鼠遁日起时: 甲己日从甲子时起
  let dayStartGan = [0,5,2,7,4,9,6,1,8,3]; // 甲己->甲, 乙庚->丙(2), 丙辛->戊(4), 丁壬->庚(6), 戊癸->壬(8)
  // 实际五鼠遁: 甲己还加甲, 乙庚丙作初, 丙辛从戊起, 丁壬庚子居, 戊癸何方发, 壬子是真途
  let startGanMap = {0:0, 1:5, 2:2, 3:7, 4:4, 5:9, 6:6, 7:1, 8:8, 9:3};
  // 五鼠遁修正
  let fiveRatStart = [0,5,2,7,4,9,6,1,8,3];
  // 甲己日: 甲子时(0), 乙丑时(1)... 
  // 乙庚日: 丙子时(2), 丁丑时(3)...
  // 时干 = (fiveRatStart[dayGan] + hourZhiIdx) % 10
  // 时辰建除: 以日支为建, 但时辰建除是以日干定起建
  // 黄黑道时辰: 青龙明堂金匮天德玉堂司命为黄道吉时, 其余黑道
  // 古制：根据日干确定黄道吉时
  let huangdaoIdx = (hourZhiIdx + {0:0,1:0,2:2,3:2,4:4,5:4,6:6,7:6,8:8,9:8}[dayGan%10]) % 12;
  // 更准确的算法: 根据日干确定哪个时辰是黄道
  // 甲己日: 子丑为青龙明堂(吉), 寅卯为天刑朱雀(凶), 辰巳为金匮天德(吉), 午未为白虎玉堂(凶吉), 申酉为天牢玄武(凶), 戌亥为司命勾陈(吉凶)
  let d = dayGan % 5;
  let hourHuangdao = [
    [0,1,4,5,10], // 甲己日: 子丑辰巳戌 吉
    [2,3,4,5,10], // 乙庚日: 寅卯辰巳戌 吉
    [0,1,6,7,10], // 丙辛日: 子丑午未戌 吉
    [0,1,2,3,8],  // 丁壬日: 子丑寅卯申 吉
    [0,1,4,5,6]   // 戊癸日: 子丑辰巳午 吉
  ];
  let goodHours = hourHuangdao[d];
  let isGood = goodHours.indexOf(hourZhiIdx) !== -1;
  return isGood ? '吉' : '凶';
}
// 空亡查询（日柱旬空）
function getDayEmpty(ganZhiIndex) {
  // 60甲子分六旬, 每旬10个, 旬空两个地支
  let xun = Math.floor(ganZhiIndex / 10); // 0-5
  let emptyZhi = [(xun * 10 + 10) % 12, (xun * 10 + 11) % 12];
  return DI_ZHI[emptyZhi[0]] + DI_ZHI[emptyZhi[1]];
}
// 日空亡（日柱所属旬的空亡地支）
function getDayKongWang(dayGanZhiIndex) {
  let xunStart = Math.floor(dayGanZhiIndex / 10) * 10; // 旬首
  // 旬首的地支
  let xunZhi = xunStart % 12;
 // 旬空 = 旬首前两个地支
  let k1 = (xunZhi + 10) % 12;
  let k2 = (xunZhi + 11) % 12;
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
  let zhiStart = {0:0, 6:0, 1:1, 7:1, 2:4, 8:4, 3:5, 9:5, 4:7, 10:7, 5:9, 11:9};
  let start = zhiStart[dayZhiIndex] !== undefined ? zhiStart[dayZhiIndex] : 0;
  let idx = (start + dayGanIndex) % 12;
  return ZHISHEN_NAMES[idx];
}

// 凶神计算
function getXiongshen_Jiesha(dayZhiIdx) {
  let sanhe = [[8,0,4],[2,6,10],[4,8,0],[10,2,6]];
  let jiesha = [5, 10, 2, 7];
  for (let i = 0; i < 4; i++) { if (sanhe[i].indexOf(dayZhiIdx) !== -1) return DI_ZHI[jiesha[i]]; }
  return '';
}
function getXiongshen_Zaisha(dayZhiIdx) {
  let sanhe = [[8,0,4],[2,6,10],[4,8,0],[10,2,6]];
  let zaisha = [6, 0, 3, 9];
  for (let i = 0; i < 4; i++) { if (sanhe[i].indexOf(dayZhiIdx) !== -1) return DI_ZHI[zaisha[i]]; }
  return '';
}
function getXiongshen_Yuesha(monthZhiIdx) {
  let sanhe = [[8,0,4],[2,6,10],[4,8,0],[10,2,6]];
  let yuesha = [7, 1, 10, 4];
  for (let i = 0; i < 4; i++) { if (sanhe[i].indexOf(monthZhiIdx) !== -1) return DI_ZHI[yuesha[i]]; }
  return '';
}
var YUE_XING = {0:3, 1:10, 2:5, 3:8, 4:4, 5:1, 6:2, 7:9, 8:8, 9:9, 10:10, 11:11};
var YUE_YAN = {0:10, 1:9, 2:8, 3:7, 4:6, 5:5, 6:4, 7:3, 8:2, 9:1, 10:0, 11:11};
var YAN_DUI = {0:4, 1:3, 2:2, 3:1, 4:0, 5:11, 6:10, 7:9, 8:8, 9:7, 10:6, 11:5};
var WANG_WANG = {0:[2,5,8,11], 1:[3,6,9,0], 2:[4,7,10,1], 3:[5,8,11,2], 4:[6,9,0,3], 5:[7,10,1,4], 6:[8,11,2,5], 7:[9,0,3,6], 8:[10,1,4,7], 9:[11,2,5,8], 10:[0,3,6,9], 11:[1,4,7,10]};

function calcXiongshen(yearGZ, monthGZ, dayGZ) {
  let result = [];
  let dayZhi = dayGZ.zhi;
  let monthZhiIdx = monthGZ.zhi;
  let monthZhiYinIdx = (monthGZ.zhi - 2 + 12) % 12;
  let jiesha = getXiongshen_Jiesha(dayGZ.zhi);
  if (jiesha && jiesha === DI_ZHI[dayGZ.zhi]) result.push('劫煞');
  let zaisha = getXiongshen_Zaisha(dayGZ.zhi);
  if (zaisha && zaisha === DI_ZHI[dayGZ.zhi]) result.push('灾煞');
  let yuesha = getXiongshen_Yuesha(monthGZ.zhi);
  if (yuesha && yuesha === DI_ZHI[dayGZ.zhi]) result.push('月煞');
  if (YUE_XING[monthZhiIdx] === dayGZ.zhi) result.push('月刑');
  if (YUE_YAN[monthZhiYinIdx] === dayGZ.zhi) result.push('月厌');
  if (YAN_DUI[monthZhiYinIdx] === dayGZ.zhi) result.push('厌对');
  if ([4,10,1,7].indexOf(dayGZ.zhi) !== -1) result.push('四击');
  if (dayGZ.zhi === 0) result.push('死神');
  if (dayGZ.zhi === 5) result.push('天吏');
  let ww = WANG_WANG[monthZhiYinIdx];
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
  let result = [];
  let dayIdx = dayGZ.index;
  let monthZhiYinIdx = (monthGZ.zhi - 2 + 12) % 12;
  let monthZhiIdx = monthGZ.zhi;
  if (TIAN_EN.indexOf(dayIdx) !== -1) result.push('天恩');
  if (YUE_EN[monthZhiYinIdx] === dayGZ.gan) result.push('月恩');
  if (MU_CANG[monthZhiYinIdx] === dayGZ.zhi) result.push('母仓');
  if (SHENG_XIN.indexOf(dayIdx) !== -1) result.push('圣心');
  if (YI_HOU.indexOf(dayIdx) !== -1) result.push('益后');
  if (XU_SHI.indexOf(dayIdx) !== -1) result.push('续世');
  if (TIAN_DE_GAN[monthZhiYinIdx] !== undefined && TIAN_DE_GAN[monthZhiYinIdx] === dayGZ.gan) result.push('天德');
  if (YUE_DE_GAN[monthZhiYinIdx] !== undefined && YUE_DE_GAN[monthZhiYinIdx] === dayGZ.gan) result.push('月德');
  if (TIAN_XI[monthZhiIdx] === dayGZ.zhi) result.push('天喜');
  for (let i = 0; i < 4; i++) {
    if (SAN_HE[i].indexOf(monthGZ.zhi) !== -1 && SAN_HE[i].indexOf(dayGZ.zhi) !== -1) { result.push('三合'); break; }
  }
  for (let i = 0; i < 6; i++) {
    if ((LIU_HE[i][0] === monthGZ.zhi && LIU_HE[i][1] === dayGZ.zhi) ||
        (LIU_HE[i][1] === monthGZ.zhi && LIU_HE[i][0] === dayGZ.zhi)) { result.push('六合'); break; }
  }
  for (let i = 0; i < 5; i++) {
    if ((WU_HE[i][0] === monthGZ.gan && WU_HE[i][1] === dayGZ.gan) ||
        (WU_HE[i][1] === monthGZ.gan && WU_HE[i][0] === dayGZ.gan)) { result.push('五合'); break; }
  }
  for (let i = 0; i < 4; i++) {
    if (SAN_HE[i].indexOf(monthGZ.zhi) !== -1) {
      let maZhi = [2, 8, 11, 5][i];
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
  let M=now.getMonth()+1, D=now.getDate(), Y=now.getFullYear();
  let dayStem=dayGZ.gan, dayBranch=dayGZ.zhi;
  let stemWx={甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水'}[dayStem]||'土';
  let branchWx={子:'水',丑:'土',寅:'木',卯:'木',辰:'土',巳:'火',午:'火',未:'土',申:'金',酉:'金',戌:'土',亥:'水'}[dayBranch]||'土';
  
  let advice=[];
  
  // 1. 节气建议
  let jieqi=getJieqiByDate(now);
  if(jieqi){
    let jieqiAdvice={
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
  let festivals=getUpcomingFaithFestivals(now,0); // 当天节日
  if(festivals&&festivals.length>0){
    festivals.forEach(function(f){
      let tip='';
      if(f.tradition==='佛'){tip='🪷 佛诞日·'+f.name+'：宜诵经祈福，供灯供花，持素一日，回向众生。';}
      else if(f.tradition==='道'){tip='☯️ 道教节日·'+f.name+'：宜焚香诵经，祭拜祈福，修善积德。';}
      else if(f.tradition==='儒'){tip='📖 儒家纪念日·'+f.name+'：宜读经典，祭祀先贤，反省修身。';}
      if(tip) advice.push(tip);
    });
  }
  
  // 3. 宜忌建议
  if(yiList&&yiList.length>0){
    let topYi=yiList.slice(0,3).join('、');
    advice.push('✅ 今日宜：'+topYi+'。'+(isHuangdao?'值'+zhishen+'黄道吉神，宜行大事。':'值'+zhishen+'，重要事项宜择吉日。'));
  }
  if(jiList&&jiList.length>0){
    let topJi=jiList.slice(0,3).join('、');
    advice.push('❌ 今日忌：'+topJi+'。'+(chongshaInfo?'冲'+chongshaInfo.chong+'煞'+chongshaInfo.sha+'，相关生肖/方位需注意。':''));
  }
  
  // 4. 干支五行建议
  let wxColor={木:'青/绿色',火:'红/紫色',土:'黄/棕色',金:'白/银色',水:'黑/蓝色'};
  let wxDir={木:'东方',火:'南方',土:'中央',金:'西方',水:'北方'};
  let wxOrgan={木:'肝胆',火:'心小肠',土:'脾胃',金:'肺大肠',水:'肾膀胱'};
  advice.push('☯️ 日干'+dayStem+'('+stemWx+')日支'+dayBranch+'('+branchWx+')：今日'+stemWx+'旺，宜穿'+wxColor[stemWx]+'衣物，朝'+wxDir[stemWx]+'方行事。重点养护'+wxOrgan[stemWx]+'。');
  
  // 5. 建除建议
  let jianchuAdvice={
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
    let starAdvice={
      '吉':'星宿'+xingxiu.name+'主吉，宜祭祀祈福，诸事顺遂。',
      '凶':'星宿'+xingxiu.name+'主凶，宜静守不宜动，持经诵咒化解。',
      '平':'星宿'+xingxiu.name+'性平，诸事可行，无大吉大凶。'
    };
    let starJixiong=xingxiu.jixiong||'平';
    if(starAdvice[starJixiong]) advice.push('⭐ 星宿·'+xingxiu.name+'：'+starAdvice[starJixiong]);
  }
  
  // 7. 修行方向建议（综合干支+节气+节日）
  let practiceDir='';
  if(jieqi){
    let jieqiWx={立春:'木',雨水:'木',惊蛰:'木',春分:'木',清明:'木',谷雨:'土',
      立夏:'火',小满:'火',芒种:'火',夏至:'火',小暑:'土',大暑:'土',
      立秋:'金',处暑:'金',白露:'金',秋分:'金',寒露:'水',霜降:'土',
      立冬:'水',小雪:'水',大雪:'水',冬至:'水',小寒:'土',大寒:'土'}[jieqi];
    if(jieqiWx){
      let shengMap={木:'火',火:'土',土:'金',金:'水',水:'木'};
      let keMap={木:'土',土:'水',水:'火',火:'金',金:'木'};
      practiceDir='今日节气'+jieqi+'属'+jieqiWx+'，宜修'+shengMap[jieqiWx]+'行法门（'+(shengMap[jieqiWx]==='木'?'东方朝真':shengMap[jieqiWx]==='火'?'南方供灯':shengMap[jieqiWx]==='土'?'中央持咒':shengMap[jieqiWx]==='金'?'西方诵经':'北方忏悔')+'），忌'+keMap[jieqiWx]+'行冲动。';
      advice.push('🧘 修行方向：'+practiceDir);
    }
  }
  
  // 输出到页面
  let el=document.getElementById('almanacFaithDaily');
  if(el&&advice.length>0){
    let html='<div style="background:linear-gradient(135deg,rgba(201,168,76,.04),rgba(155,89,182,.03));border:1px solid rgba(201,168,76,.1);border-radius:12px;padding:18px;margin-bottom:14px">';
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



})(typeof window !== "undefined" ? window : globalThis);
