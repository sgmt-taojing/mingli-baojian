// bazi-core.js
// R629 Phase 2: 八字核心引擎（从 divination-core.js 拆分）
// 包含：getBaziCalcData / computeBaziCore / buildTiaohouYongshenHTML
// 依赖：divination-core.js（全局数据）
// 用法：<script src="js/divination-core.js" defer></script>
//        <script src="js/bazi-core.js" defer></script>
(function(global){
// ================================================================
//  BAZI ENGINE
// ================================================================

// 辅助函数:计算八字数据并返回(供多处调用)
function getBaziCalcData(year, month, day, hour, sex) {
  // Year — 传入出生时辰精确判断立春
  let _ysRes = getYearStemBranchExact(year, month, day, hour || 12, 0);
  let ysIdx = _ysRes.stemIdx, ybIdx = _ysRes.branchIdx, yStem = _ysRes.stem, yBranch = _ysRes.branch;
  // Day
  let dayStemIdx = getDayStemIndex(year, month, day);
  let dayBranchIdx = getDayBranchIndex(year, month, day);
  let dayStem = STEMS[dayStemIdx];
  let dayBranch = BRANCHES[dayBranchIdx];

  // Month — 以节气定月支
  let monthBranch = getMonthBranchBySolar(year, month, day);
  let monthStemIdx = getMonthStem(ysIdx, monthBranch);
  let monthStem = STEMS[monthStemIdx];
  let monthBranchIdx = BRANCHES.indexOf(monthBranch);

  // Hour
  let hourBranchIdx = Math.floor(hour / 2) % 12;
  let hourBranch = BRANCHES[hourBranchIdx];
  let hourStemIdx = getHourStem(dayStemIdx, hourBranch);
  let hourStem = STEMS[hourStemIdx];

  let pillars = [
    { stem: yStem, branch: yBranch, stemIdx: ysIdx, branchIdx: ybIdx },
    { stem: monthStem, branch: monthBranch, stemIdx: monthStemIdx, branchIdx: monthBranchIdx },
    { stem: dayStem, branch: dayBranch, stemIdx: dayStemIdx, branchIdx: dayBranchIdx },
    { stem: hourStem, branch: hourBranch, stemIdx: hourStemIdx, branchIdx: hourBranchIdx }
  ];

  // 五行统计
  let eleCount = {木:0,火:0,土:0,金:0,水:0};
  for (let pi = 0; pi < pillars.length; pi++) {
    eleCount[ELE[pillars[pi].stem]]++;
    eleCount[ZHI_ELE[pillars[pi].branch]]++;
  }
  let total = 0;
  let _keys = Object.keys(eleCount);
  for (let ki = 0; ki < _keys.length; ki++) total += eleCount[_keys[ki]];
  let sorted = _keys.map(function(k){return [k, eleCount[k]];}).sort(function(a,b){return a[1]-b[1];});
  let weakestEle = sorted[0][0];
  let strongestEle = sorted[sorted.length-1][0];

  // ═══ 升级：旺衰诊断（getMingType） ═══
  let mingType = getMingType(pillars, dayStem, dayStemIdx);

  // ═══ 升级：格局判定（getGeju） ═══
  let geju = getGeju(monthBranch, dayStemIdx, pillars);

  // ═══ 升级：神煞判定（getShensha） ═══
  let shensha = getShensha(pillars, dayStemIdx, dayBranchIdx);

  // ═══ 升级：十神（年/月/时干支） ═══
  let tenGods = [];
  for (let ti = 0; ti < pillars.length; ti++) {
    if (ti === 2) continue; // 跳过日柱
    tenGods.push(getTenGod(pillars[ti].stem, pillars[ti].branch, dayStem));
  }

  // ═══ 升级：胎元/命宫/身宫/旬空/旬名 ═══
  let taiYuan = getTaiYuan(monthStem, monthBranch);
  let mingGong = getMingGong(ysIdx, monthBranch, hourBranch);
  let shenGong = getShenGong(ysIdx, monthBranch, hourBranch);
  let xunKong = getXunKong(dayStem, dayBranch);
  let xunName = getXunName(dayStem, dayBranch);

  // ═══ 升级：长生十二宫（日干对四地支） ═══
  let dishi = pillars.map(function(p) {
    return getDishi(dayStem, p.branch);
  });

  // ═══ 升级：起运年龄（精确三日折一岁） ═══
  let dayun = computeDayun(pillars, sex, year, month, day, hour, dayStemIdx, ELE[dayStem]);

  // 命卦
  let mingGua = getMingGua(parseInt(year), sex);

  // 喜用神（从mingType获取，不再用简单xiMap）
  let xiEle = mingType.yongshenEle || (function(){
    let _xiMap = {木:'水',火:'木',土:'火',金:'土',水:'金'};
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

// computeBaziCore alias for getBaziCalcData (used by multiple modules)
function computeBaziCore(year, month, day, hour) {
  return getBaziCalcData(year, month, day, hour);
}

// ================================================================
//  R3.7: 调候用神分析 — buildTiaohouYongshenHTML
// ================================================================

/**
 * 十天干十二月令调候用神详解表
 * 基于穷通宝鉴，按日主天干×月令地支给出调候用神及说明
 */
var TIAOHOU_DETAIL = {
  '甲': {
    '寅': { gods: '丙火、癸水', need: '初春尚寒，需丙火暖局,癸水润木', priority: '丙火为主', desc: '甲木生寅月，初春余寒未消，以丙火暖局为急，癸水滋养为辅。' },
    '卯': { gods: '丙火、癸水', need: '春分后木气渐旺，需丙火照暖、癸水滋扶', priority: '丙火为主', desc: '甲木生卯月，木气正旺，丙火照暖使木条达，癸水润根。' },
    '辰': { gods: '庚金、壬水', need: '土旺木困，需庚金疏土、壬水生木', priority: '庚金为主', desc: '甲木生辰月，土旺木折，需庚金劈土引丁，壬水滋木。' },
    '巳': { gods: '癸水', need: '火旺木渴，急需癸水润木', priority: '癸水为主', desc: '甲木生巳月，火旺木渴，以癸水为调候第一用神。' },
    '午': { gods: '癸水、丁火', need: '夏火炎燥，需癸水润木,丁火制金', priority: '癸水为主', desc: '甲木生午月，火炎木渴，癸水为救命之药，丁火辅助。' },
    '未': { gods: '癸水、丁火', need: '土燥木枯，需癸水润土、丁火炼金', priority: '癸水为主', desc: '甲木生未月，土燥木枯，癸水滋润为先。' },
    '申': { gods: '庚金、丙火', need: '金旺木受克，需丙火制金、庚金修剪', priority: '丙火为主', desc: '甲木生申月，金旺克木，丙火制金护身为急。' },
    '酉': { gods: '庚金、丙火', need: '金旺木危，需丙火制金保木', priority: '丙火为主', desc: '甲木生酉月，秋金克木，丙火制金为调候要务。' },
    '戌': { gods: '庚金、丁火', need: '土燥木枯，需庚金疏土、丁火暖局', priority: '庚金为主', desc: '甲木生戌月，土旺木折，庚金疏土，丁火暖局。' },
    '亥': { gods: '丙火、戊土', need: '冬寒木冷，需丙火暖局、戊土制水', priority: '丙火为主', desc: '甲木生亥月，水寒木冷，丙火暖局为第一急务。' },
    '子': { gods: '丙火、丁火', need: '冬寒水旺，需丙丁火暖局化寒', priority: '丙火为主', desc: '甲木生子月，隆冬水寒，丙火暖局，丁火辅助。' },
    '丑': { gods: '丁火、丙火', need: '冻木需火暖，丁火为主、丙火为辅', priority: '丁火为主', desc: '甲木生丑月，冻土寒木，丁火暖局为要。' }
  },
  '乙': {
    '寅': { gods: '丙火、癸水', need: '乙木初生需丙火照暖、癸水润根', priority: '丙火为主', desc: '乙木生寅月，初春尚寒，丙火照暖、癸水滋根。' },
    '卯': { gods: '丙火、癸水', need: '春木旺需丙火照暖、癸水滋养', priority: '丙火为主', desc: '乙木生卯月，木气正旺，丙火照暖使花木绽放。' },
    '辰': { gods: '癸水、丙火', need: '土旺木困需癸水润木、丙火暖局', priority: '癸水为主', desc: '乙木生辰月，土旺木折，癸水滋木为要。' },
    '巳': { gods: '癸水', need: '火旺木渴急需癸水润木', priority: '癸水为主', desc: '乙木生巳月，火旺木渴，癸水为调候首选。' },
    '午': { gods: '癸水', need: '夏火炎燥急需癸水润木', priority: '癸水为主', desc: '乙木生午月，火炎木枯，癸水为救命之药。' },
    '未': { gods: '癸水、丙火', need: '土燥木枯需癸水润土、丙火暖局', priority: '癸水为主', desc: '乙木生未月，土燥木枯，癸水滋润为先。' },
    '申': { gods: '丙火、癸水', need: '金旺木受克需丙火制金、癸水润木', priority: '丙火为主', desc: '乙木生申月，秋金克木，丙火制金护身。' },
    '酉': { gods: '丙火、癸水', need: '金旺木危需丙火制金保木', priority: '丙火为主', desc: '乙木生酉月，秋金克木，丙火制金为调候。' },
    '戌': { gods: '丙火、癸水', need: '土燥木枯需丙火暖局、癸水润木', priority: '丙火为主', desc: '乙木生戌月，土旺木折，丙火暖局、癸水滋木。' },
    '亥': { gods: '丙火、戊土', need: '冬寒木冷需丙火暖局、戊土制水', priority: '丙火为主', desc: '乙木生亥月，水寒木冷，丙火暖局为急。' },
    '子': { gods: '丙火', need: '冬寒水旺需丙火暖局', priority: '丙火为主', desc: '乙木生子月，隆冬水寒，丙火暖局为第一。' },
    '丑': { gods: '丙火', need: '冻木需丙火暖局', priority: '丙火为主', desc: '乙木生丑月，冻土寒木，丙火暖局为要。' }
  },
  '丙': {
    '寅': { gods: '壬水、庚金', need: '丙火初生需壬水制火、庚金生水', priority: '壬水为主', desc: '丙火生寅月，木旺生火，壬水制火为调候。' },
    '卯': { gods: '壬水、庚金', need: '木旺火旺需壬水制火', priority: '壬水为主', desc: '丙火生卯月，木火相生，壬水制火润局。' },
    '辰': { gods: '壬水', need: '土泄火气需壬水制火润局', priority: '壬水为主', desc: '丙火生辰月，土泄火气，壬水制火为要。' },
    '巳': { gods: '壬水', need: '火旺需壬水制火润燥', priority: '壬水为主', desc: '丙火生巳月，火旺炎燥，壬水为调候首选。' },
    '午': { gods: '壬水、庚金', need: '夏火最旺需壬水制火、庚金生水', priority: '壬水为主', desc: '丙火生午月，火旺至极，壬水为救命之药。' },
    '未': { gods: '壬水', need: '土燥火炎需壬水润局', priority: '壬水为主', desc: '丙火生未月，土燥火炎，壬水润局为急。' },
    '申': { gods: '壬水', need: '秋金生水需壬水制火', priority: '壬水为主', desc: '丙火生申月，金水进气，壬水制火为调候。' },
    '酉': { gods: '壬水', need: '秋金旺需壬水制火润局', priority: '壬水为主', desc: '丙火生酉月，金旺水进，壬水制火为要。' },
    '戌': { gods: '壬水', need: '土燥火退需壬水润局', priority: '壬水为主', desc: '丙火生戌月，土旺火退，壬水润局。' },
    '亥': { gods: '甲木、戊土、壬水', need: '冬水旺需甲木生火、戊土制水', priority: '甲木为主', desc: '丙火生亥月，水旺火灭，甲木生火为第一，戊土制水为辅。' },
    '子': { gods: '壬水、戊土', need: '冬水最旺需戊土制水、壬水辅之', priority: '戊土为主', desc: '丙火生子月，水旺灭火，戊土制水保火为急。' },
    '丑': { gods: '壬水、甲木', need: '冻土寒水需甲木生火、壬水润局', priority: '甲木为主', desc: '丙火生丑月，冻土寒水，甲木生火为调候。' }
  },
  '丁': {
    '寅': { gods: '甲木、庚金', need: '丁火弱需甲木生火、庚金劈甲', priority: '甲木为主', desc: '丁火生寅月，木旺火弱，甲木生火为调候。' },
    '卯': { gods: '甲木、庚金', need: '木旺需甲木生火、庚金劈甲引丁', priority: '甲木为主', desc: '丁火生卯月，木旺火弱，甲木生火、庚金劈甲引丁。' },
    '辰': { gods: '甲木', need: '土泄火气需甲木生火', priority: '甲木为主', desc: '丁火生辰月，土泄火气，甲木生火为要。' },
    '巳': { gods: '甲木', need: '火渐旺需甲木生火扶丁', priority: '甲木为主', desc: '丁火生巳月，火渐旺，甲木生扶丁火。' },
    '午': { gods: '甲木、壬水', need: '火最旺需壬水制火、甲木生丁', priority: '甲木为主', desc: '丁火生午月，火旺至极，壬水制火润局，甲木生丁。' },
    '未': { gods: '甲木', need: '土燥需甲木生火制土', priority: '甲木为主', desc: '丁火生未月，土燥火微，甲木生火制土。' },
    '申': { gods: '甲木', need: '金旺火弱需甲木生火', priority: '甲木为主', desc: '丁火生申月，金旺火弱，甲木生火护身为调候。' },
    '酉': { gods: '甲木', need: '秋金旺需甲木生火', priority: '甲木为主', desc: '丁火生酉月，金旺火微，甲木生火为急。' },
    '戌': { gods: '甲木', need: '土旺火弱需甲木生火', priority: '甲木为主', desc: '丁火生戌月，土旺泄火，甲木生火为调候。' },
    '亥': { gods: '甲木', need: '冬水旺火灭需甲木生火', priority: '甲木为主', desc: '丁火生亥月，水旺火灭，甲木生火为第一急务。' },
    '子': { gods: '甲木、庚金', need: '冬水最旺需甲木生火、庚金劈甲', priority: '甲木为主', desc: '丁火生子月，水旺灭火，甲木生火为救命之药。' },
    '丑': { gods: '甲木', need: '冻土寒水需甲木生火', priority: '甲木为主', desc: '丁火生丑月，冻土寒水，甲木生火为调候。' }
  },
  '戊': {
    '寅': { gods: '丙火、甲木、癸水', need: '初春寒土需丙火暖局、甲木疏土、癸水润泽', priority: '丙火为主', desc: '戊土生寅月，初春寒土，丙火暖局为急，甲木疏土为辅。' },
    '卯': { gods: '丙火、甲木、癸水', need: '木旺土崩需丙火暖局、甲木疏土', priority: '丙火为主', desc: '戊土生卯月，木旺土崩，丙火暖局，甲木疏土。' },
    '辰': { gods: '甲木、丙火', need: '土旺需甲木疏土、丙火暖局', priority: '甲木为主', desc: '戊土生辰月，土旺需甲木疏土，丙火暖局。' },
    '巳': { gods: '甲木、丙火', need: '火旺土燥需甲木疏土', priority: '甲木为主', desc: '戊土生巳月，火旺土燥，甲木疏土为调候。' },
    '午': { gods: '壬水、丙火', need: '火炎土燥需壬水润土', priority: '壬水为主', desc: '戊土生午月，火炎土燥，壬水润土为救命之药。' },
    '未': { gods: '癸水、丙火', need: '土燥需癸水润土、丙火暖局', priority: '癸水为主', desc: '戊土生未月，土燥需癸水润泽。' },
    '申': { gods: '丙火、癸水', need: '秋金泄土需丙火暖土、癸水润泽', priority: '丙火为主', desc: '戊土生申月，金旺泄土，丙火暖土为调候。' },
    '酉': { gods: '丙火、癸水', need: '秋金泄土需丙火暖土', priority: '丙火为主', desc: '戊土生酉月，金旺泄土，丙火暖土为急。' },
    '戌': { gods: '丙火、癸水', need: '土燥需丙火暖局、癸水润泽', priority: '丙火为主', desc: '戊土生戌月，土燥需丙火暖局，癸水润泽。' },
    '亥': { gods: '甲木、丙火', need: '冬寒土冻需丙火暖土、甲木疏土', priority: '丙火为主', desc: '戊土生亥月，冬寒土冻，丙火暖土为第一急务。' },
    '子': { gods: '丙火、甲木', need: '冬水旺土寒需丙火暖土', priority: '丙火为主', desc: '戊土生子月，水旺土寒，丙火暖土为调候首选。' },
    '丑': { gods: '丙火、甲木', need: '冻土需丙火暖土、甲木疏土', priority: '丙火为主', desc: '戊土生丑月，冻土寒凝，丙火暖土为要。' }
  },
  '己': {
    '寅': { gods: '丙火、甲木、癸水', need: '初春寒土需丙火暖局', priority: '丙火为主', desc: '己土生寅月，寒土需丙火暖局，甲木疏土，癸水润泽。' },
    '卯': { gods: '丙火、甲木、癸水', need: '木旺土崩需丙火暖局', priority: '丙火为主', desc: '己土生卯月，木旺土崩，丙火暖局为急。' },
    '辰': { gods: '甲木、丙火', need: '土旺需甲木疏土', priority: '甲木为主', desc: '己土生辰月，土旺需甲木疏土。' },
    '巳': { gods: '甲木、丙火', need: '火旺需甲木疏土', priority: '甲木为主', desc: '己土生巳月，火旺土燥，甲木疏土。' },
    '午': { gods: '丙火、癸水', need: '火炎土燥需癸水润土', priority: '癸水为主', desc: '己土生午月，火炎土燥，癸水润土为急。' },
    '未': { gods: '丙火、癸水', need: '土燥需癸水润泽', priority: '癸水为主', desc: '己土生未月，土燥需癸水润泽。' },
    '申': { gods: '丙火、癸水', need: '金泄土需丙火暖土', priority: '丙火为主', desc: '己土生申月，金旺泄土，丙火暖土。' },
    '酉': { gods: '丙火、癸水', need: '金泄土需丙火暖土', priority: '丙火为主', desc: '己土生酉月，金旺泄土，丙火暖土。' },
    '戌': { gods: '丙火、癸水', need: '土燥需丙火暖局', priority: '丙火为主', desc: '己土生戌月，土燥，丙火暖局，癸水润泽。' },
    '亥': { gods: '丙火、甲木', need: '冬寒土冻需丙火暖土', priority: '丙火为主', desc: '己土生亥月，冬寒土冻，丙火暖土为急。' },
    '子': { gods: '丙火、甲木', need: '冬水旺土寒需丙火暖土', priority: '丙火为主', desc: '己土生子月，水旺土寒，丙火暖土。' },
    '丑': { gods: '丙火、甲木', need: '冻土需丙火暖土', priority: '丙火为主', desc: '己土生丑月，冻土寒凝，丙火暖土为要。' }
  },
  '庚': {
    '寅': { gods: '丁火、甲木、丙火', need: '初春金弱需丁火炼金、甲木生火', priority: '丁火为主', desc: '庚金生寅月，木旺金弱，丁火炼金为调候。' },
    '卯': { gods: '丁火、甲木、丙火', need: '木旺金弱需丁火炼金', priority: '丁火为主', desc: '庚金生卯月，木旺金弱，丁火炼金为要。' },
    '辰': { gods: '甲木、丁火', need: '土旺金埋需甲木疏土、丁火炼金', priority: '甲木为主', desc: '庚金生辰月，土旺金埋，甲木疏土为第一。' },
    '巳': { gods: '甲木、丁火', need: '火旺金受克需甲木生火', priority: '甲木为主', desc: '庚金生巳月，火旺克金，甲木泄火生丁为调候。' },
    '午': { gods: '丁火、壬水', need: '火最旺需壬水制火、丁火炼金', priority: '丁火为主', desc: '庚金生午月，火旺克金，丁火炼金，壬水制火。' },
    '未': { gods: '丁火、甲木', need: '土燥金埋需丁火炼金、甲木疏土', priority: '丁火为主', desc: '庚金生未月，土燥金埋，丁火炼金为要。' },
    '申': { gods: '甲木', need: '金旺需甲木引丁', priority: '甲木为主', desc: '庚金生申月，金旺需甲木引丁炼金。' },
    '酉': { gods: '甲木', need: '金旺需甲木引丁', priority: '甲木为主', desc: '庚金生酉月，金旺需甲木引丁。' },
    '戌': { gods: '甲木、丁火', need: '土旺金埋需甲木疏土', priority: '甲木为主', desc: '庚金生戌月，土旺金埋，甲木疏土为调候。' },
    '亥': { gods: '丁火、甲木', need: '冬水旺金寒需丁火炼金', priority: '丁火为主', desc: '庚金生亥月，水旺金寒，丁火炼金暖金为急。' },
    '子': { gods: '丁火、甲木', need: '冬水最旺金寒需丁火', priority: '丁火为主', desc: '庚金生子月，水旺金寒，丁火炼金为第一调候。' },
    '丑': { gods: '丁火、甲木', need: '冻金需丁火炼金', priority: '丁火为主', desc: '庚金生丑月，冻金寒土，丁火炼金为要。' }
  },
  '辛': {
    '寅': { gods: '壬水、己土、甲木', need: '初春金弱需壬水洗金、己土生金', priority: '壬水为主', desc: '辛金生寅月，木旺金弱，壬水洗金为调候。' },
    '卯': { gods: '壬水、己土、甲木', need: '木旺需壬水洗金', priority: '壬水为主', desc: '辛金生卯月，木旺金弱，壬水洗金为要。' },
    '辰': { gods: '壬水、甲木', need: '土旺金埋需壬水洗金', priority: '壬水为主', desc: '辛金生辰月，土旺金埋，壬水洗金为调候。' },
    '巳': { gods: '壬水、甲木', need: '火旺需壬水洗金制火', priority: '壬水为主', desc: '辛金生巳月，火旺克金，壬水制火洗金。' },
    '午': { gods: '壬水、己土', need: '火最旺需壬水制火', priority: '壬水为主', desc: '辛金生午月，火旺克金，壬水为救命之药。' },
    '未': { gods: '壬水、甲木', need: '土燥需壬水润局洗金', priority: '壬水为主', desc: '辛金生未月，土燥金弱，壬水润局洗金。' },
    '申': { gods: '壬水、甲木', need: '金旺需壬水洗金', priority: '壬水为主', desc: '辛金生申月，金旺需壬水洗金显秀。' },
    '酉': { gods: '壬水、甲木', need: '金旺需壬水洗金', priority: '壬水为主', desc: '辛金生酉月，金旺需壬水洗金。' },
    '戌': { gods: '壬水、甲木', need: '土旺金埋需壬水洗金', priority: '壬水为主', desc: '辛金生戌月，土旺金埋，壬水洗金为调候。' },
    '亥': { gods: '壬水、甲木', need: '冬水旺需壬水洗金', priority: '壬水为主', desc: '辛金生亥月，水旺金寒，壬水洗金为调候。' },
    '子': { gods: '壬水、丙火', need: '冬水最旺需丙火暖金', priority: '壬水为主', desc: '辛金生子月，水旺金寒，壬水洗金，丙火暖局。' },
    '丑': { gods: '壬水、丙火', need: '冻金需丙火暖金、壬水洗金', priority: '壬水为主', desc: '辛金生丑月，冻金寒土，壬水洗金，丙火暖局。' }
  },
  '壬': {
    '寅': { gods: '庚金、丙火、戊土', need: '初春水弱需庚金生水、丙火暖局', priority: '庚金为主', desc: '壬水生寅月，木旺泄水，庚金生水为调候。' },
    '卯': { gods: '庚金、戊土', need: '木旺泄水需庚金生水', priority: '庚金为主', desc: '壬水生卯月，木旺泄水，庚金生水为要。' },
    '辰': { gods: '甲木、庚金', need: '土旺需甲木疏土、庚金生水', priority: '甲木为主', desc: '壬水生辰月，土旺克水，甲木疏土为调候。' },
    '巳': { gods: '壬水', need: '火旺需壬水自救', priority: '壬水为主', desc: '壬水生巳月，火旺水渴，壬水比劫自救为调候。' },
    '午': { gods: '壬水、辛金', need: '火最旺需壬水自救、辛金生水', priority: '壬水为主', desc: '壬水生午月，火旺水竭，壬水比劫、辛金生水为要。' },
    '未': { gods: '壬水、辛金', need: '土燥水弱需壬水润局', priority: '壬水为主', desc: '壬水生未月，土燥水弱，壬水润局为急。' },
    '申': { gods: '戊土', need: '金旺水旺需戊土制水', priority: '戊土为主', desc: '壬水生申月，金旺水旺，戊土制水为调候。' },
    '酉': { gods: '甲木', need: '金旺水旺需甲木泄水', priority: '甲木为主', desc: '壬水生酉月，金旺水旺，甲木泄水为调候。' },
    '戌': { gods: '甲木', need: '土旺需甲木疏土', priority: '甲木为主', desc: '壬水生戌月，土旺克水，甲木疏土为调候。' },
    '亥': { gods: '戊土、丙火', need: '冬水旺需戊土制水、丙火暖局', priority: '戊土为主', desc: '壬水生亥月，水旺泛滥，戊土制水为第一急务。' },
    '子': { gods: '戊土、丙火', need: '冬水最旺需戊土制水', priority: '戊土为主', desc: '壬水生子月，水旺至极，戊土制水为救命之药。' },
    '丑': { gods: '丙火、丁火', need: '冻水需丙丁火暖局', priority: '丙火为主', desc: '壬水生丑月，冻水寒土，丙火暖局为调候。' }
  },
  '癸': {
    '寅': { gods: '庚金、辛金', need: '初春水弱需庚辛金生水', priority: '庚金为主', desc: '癸水生寅月，木旺泄水，庚金生水为调候。' },
    '卯': { gods: '庚金、辛金', need: '木旺泄水需庚辛金生水', priority: '庚金为主', desc: '癸水生卯月，木旺泄水，庚金生水为要。' },
    '辰': { gods: '甲木、丙火', need: '土旺需甲木疏土、丙火暖局', priority: '甲木为主', desc: '癸水生辰月，土旺克水，甲木疏土为调候。' },
    '巳': { gods: '丙火', need: '火旺需丙火暖局', priority: '丙火为主', desc: '癸水生巳月，火旺水渴，丙火暖局为调候。' },
    '午': { gods: '庚金、辛金', need: '火最旺需庚辛金生水', priority: '庚金为主', desc: '癸水生午月，火旺水竭，庚金生水为救命之药。' },
    '未': { gods: '庚金、辛金', need: '土燥水弱需庚辛金生水', priority: '庚金为主', desc: '癸水生未月，土燥水弱，庚金生水为调候。' },
    '申': { gods: '庚金、辛金', need: '金旺生水需庚辛金', priority: '庚金为主', desc: '癸水生申月，金旺生水，庚辛金为调候。' },
    '酉': { gods: '庚金、辛金', need: '金旺生水需庚辛金', priority: '庚金为主', desc: '癸水生酉月，金旺生水，庚辛金为调候。' },
    '戌': { gods: '庚金、辛金', need: '土旺需庚辛金生水', priority: '庚金为主', desc: '癸水生戌月，土旺克水，庚金生水为调候。' },
    '亥': { gods: '庚金、辛金', need: '冬水旺需庚辛金生水', priority: '庚金为主', desc: '癸水生亥月，水旺需庚辛金生水助之。' },
    '子': { gods: '丙火、丁火', need: '冬水最旺需丙丁火暖局', priority: '丙火为主', desc: '癸水生子月，水旺至极，丙火暖局为调候。' },
    '丑': { gods: '丙火、丁火', need: '冻水需丙丁火暖局', priority: '丙火为主', desc: '癸水生丑月，冻水寒土，丙丁火暖局为要。' }
  }
};

/**
 * buildTiaohouYongshenHTML(data)
 * 调候用神分析HTML生成
 *
 * @param {Object} data — generateInterpretation 的 data 对象
 *   需包含: dayStem (日主天干), pillars (四柱), mingType (含 yongshenEle 等)
 * @returns {string} HTML字符串
 */
function buildTiaohouYongshenHTML(data) {
  let dayStem = data.dayStem || (data.dayMaster ? data.dayMaster.charAt(0) : '甲');
  let pillars = data.pillars || [];
  let mingType = data.mingType || {};
  let yongshenEle = mingType.yongshenEle || '';

  // 从月柱提取月令地支
  let monthBranch = '';
  if (pillars.length >= 2 && pillars[1] && pillars[1].branch) {
    monthBranch = pillars[1].branch;
  } else if (data.monthBranch) {
    monthBranch = data.monthBranch;
  }
  if (!monthBranch || !dayStem) return '';

  // 查调候表
  let tiaohouInfo = TIAOHOU_DETAIL[dayStem] ? TIAOHOU_DETAIL[dayStem][monthBranch] : null;
  if (!tiaohouInfo) return '';

  // 判断调候用神在命局中的有无
  let tiaohouGods = tiaohouInfo.gods.split(/[,，、]/).map(function(s) { return s.trim(); });
  let allStems = [];
  let allBranches = [];
  for (let i = 0; i < pillars.length; i++) {
    if (pillars[i]) {
      if (pillars[i].stem) allStems.push(pillars[i].stem);
      if (pillars[i].branch) allBranches.push(pillars[i].branch);
    }
  }

  // 天干五行映射
  let ganWx = { '甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水' };
  // 地支五行映射
  let zhiWx = { '子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火','午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水' };

  // 调候用神对应的五行
  let tiaohouWx = [];
  for (let ti = 0; ti < tiaohouGods.length; ti++) {
    let g = tiaohouGods[ti];
    if (ganWx[g]) tiaohouWx.push({ god: g, wx: ganWx[g] });
  }

  // 检查命局中是否有调候用神
  let hasInStems = false;
  let hasInBranches = false;
  let presentGods = [];
  for (let pi = 0; pi < tiaohouWx.length; pi++) {
    let tw = tiaohouWx[pi];
    // 检查天干
    for (let si = 0; si < allStems.length; si++) {
      if (allStems[si] === tw.god) {
        hasInStems = true;
        if (presentGods.indexOf(tw.god) < 0) presentGods.push(tw.god);
      }
    }
    // 检查地支（地支藏干含同类五行也算）
    for (let bi = 0; bi < allBranches.length; bi++) {
      if (zhiWx[allBranches[bi]] === tw.wx) {
        hasInBranches = true;
      }
    }
  }

  let presenceStatus = '';
  let presenceColor = '';
  if (hasInStems) {
    presenceStatus = '调候用神「' + presentGods.join('、') + '」透干，命局中调候得力';
    presenceColor = 'var(--jade)';
  } else if (hasInBranches) {
    presenceStatus = '调候用神藏支不透，调候之力有但不显，需大运引出';
    presenceColor = 'var(--warn)';
  } else {
    presenceStatus = '命局中缺调候用神，需大运流年补之，早期运势多艰';
    presenceColor = 'var(--cinn2)';
  }

  // 调候与扶抑用神的关系
  let fuyiEle = yongshenEle || '';
  let relationDesc = '';
  let tiaohouWxStr = tiaohouWx.length > 0 ? tiaohouWx[0].wx : '';
  if (fuyiEle && tiaohouWxStr) {
    if (fuyiEle === tiaohouWxStr) {
      relationDesc = '调候用神与扶抑用神五行一致（均为' + fuyiEle + '），调候即扶抑，一神两用，大吉之象。';
    } else {
      relationDesc = '调候用神（' + tiaohouWxStr + '）与扶抑用神（' + fuyiEle + '）方向不同。调候为急、扶抑为本，需结合大运权衡取舍。若大运行调候之运，则急症先解；行扶抑之运，则固本培元。';
    }
  } else {
    relationDesc = '调候为急，权而用之。穷通宝鉴云：「冬生需火暖，夏生需水润。」此为调候之要义。';
  }

  // 生成HTML
  let html = '';
  html += '<div style="background:linear-gradient(135deg,rgba(52,152,219,.06),rgba(201,168,76,.03));border:1px solid rgba(52,152,219,.15);padding:14px 16px;margin-bottom:14px;border-radius:10px">';
  html += '<div style="font-size:14px;font-weight:bold;color:var(--cyan2);margin-bottom:10px;letter-spacing:2px">🍵 调候用神分析</div>';
  html += '<div style="font-size:12px;color:var(--paper);line-height:1.9">';

  // 基本信息行
  html += '<div style="padding:8px 10px;background:rgba(255,255,255,.02);border-radius:8px;margin-bottom:8px">';
  html += '<b class="rpt-is-1">日主：</b>' + dayStem + '(' + (ganWx[dayStem]||'') + ') &nbsp;';
  html += '<b class="rpt-is-1">月令：</b>' + monthBranch + '(' + (zhiWx[monthBranch]||'') + ') &nbsp;';
  html += '<b class="rpt-is-1">调候用神：</b><span class="rpt-is-4">' + tiaohouInfo.gods + '</span>';
  html += '</div>';

  // 调候需求说明
  html += '<div class="rpt-is-19"><b class="rpt-is-23">📋 调候需求：</b>' + tiaohouInfo.desc + '</div>';
  html += '<div class="rpt-is-19"><b class="rpt-is-23">🎯 优先级：</b>' + tiaohouInfo.priority + '。' + tiaohouInfo.need + '。</div>';

  // 调候与扶抑的关系
  html += '<div style="padding:8px 10px;background:rgba(201,168,76,.04);border-left:3px solid rgba(201,168,76,.3);border-radius:0 6px 6px 0;margin-bottom:8px">';
  html += '<b class="rpt-is-1">⚖️ 调候与扶抑：</b><br>' + relationDesc;
  html += '</div>';

  // 命局有无判断
  html += '<div style="padding:8px 10px;background:rgba(255,255,255,.02);border-radius:6px;margin-bottom:8px">';
  html += '<b class="rpt-is-1">🔍 命局有无：</b><br>';
  html += '<span style="color:' + presenceColor + ';font-weight:600">' + presenceStatus + '</span>';
  html += '</div>';

  // 穷通宝鉴引文
  html += '<div style="font-size:11px;color:var(--paper2);font-style:italic;margin-top:6px;padding:6px 10px;background:rgba(155,89,182,.03);border-radius:4px">';
  html += '《穷通宝鉴》：「十干配十二月，各有宜忌。调候者，所以济格局之偏，救五行之弊也。」';
  html += '</div>';

  html += '</div></div>';

  return html;
}

})(typeof window !== "undefined" ? window : globalThis);
