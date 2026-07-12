// ================================================================
// 人生规划引擎升级 — 新增子函数
// ================================================================

// 长生十二宫 → 人生阶段映射
var LP_CS_STAGE_MAP = {
  '长生': {ageRange: [0, 12], name: '长生期', desc: '如初生之苗，生机勃发', guidance: '打基础，学习，培养兴趣，发展健康的身心习惯', auspicious: 1, advice: '此阶段为人生根基，宜注重营养、教育启蒙、性格塑造。家长应给予充分关爱与引导。'},
  '沐浴': {ageRange: [13, 18], name: '沐浴期', desc: '如新生沐浴，脆弱需护', guidance: '青春期学业关键期，防桃花干扰，注重心理成长', auspicious: 0, advice: '此阶段情绪波动大，易受外界影响。宜专注学业，避免早恋分心。家长需多沟通理解，忌简单粗暴。'},
  '冠带': {ageRange: [19, 24], name: '冠带期', desc: '如人加冠，初具规模', guidance: '大学/初入社会，技能积累，拓展人脉', auspicious: 1, advice: '此阶段宜广学博闻，积累专业技能与社交经验。可尝试实习、兼职，为正式入行做准备。'},
  '临官': {ageRange: [25, 35], name: '临官期', desc: '如人出仕，独当一面', guidance: '事业起步，成家立业，勇抓机遇', auspicious: 1, advice: '此阶段为事业黄金起步期，宜敢于担当、快速成长。同时考虑成家，事业家庭兼顾。'},
  '帝旺': {ageRange: [36, 50], name: '帝旺期', desc: '如帝之旺，气势最盛', guidance: '事业巅峰，把握机遇，敢于进取', auspicious: 1, advice: '此阶段为人生巅峰期，精力与经验俱佳。宜大胆拓展事业版图，同时注意家庭经营与身体健康。'},
  '衰': {ageRange: [51, 60], name: '衰期', desc: '由盛转衰，需知进退', guidance: '稳中求进，培养接班人，逐步放权', auspicious: 0, advice: '此阶段运势转弱，不宜冒进。宜稳守成果，培养接班人，为退休做规划。注重健康保养。'},
  '病': {ageRange: [61, 66], name: '病期', desc: '体弱需养，非真病也', guidance: '注重健康，修身养性，放下执念', auspicious: 0, advice: '此阶段精力下降，宜减少工作量，注重养生。定期体检，饮食清淡，适度运动。'},
  '死': {ageRange: [67, 72], name: '死期', desc: '气数收敛，非真死亡', guidance: '放下执念，享受天伦，精神超脱', auspicious: 0, advice: '此阶段宜彻底放下事业操心，享受家庭生活。可修习太极、书画等修身养性之活动。'},
  '墓': {ageRange: [73, 78], name: '墓期', desc: '收藏归库，宜守不宜攻', guidance: '安享晚年，整理传承，回顾人生', auspicious: 0, advice: '此阶段宜静养，整理人生经验传承后人。可写回忆录、传授经验给晚辈。'},
  '绝': {ageRange: [79, 84], name: '绝期', desc: '旧气已绝，新气将生', guidance: '超然物外，精神传承，恬淡虚无', auspicious: 0, advice: '此阶段宜保持恬淡心态，不问俗事，精神上达观超脱。家人应多陪伴关护。'},
  '胎': {ageRange: [85, 90], name: '胎期', desc: '新胎暗结，轮回再起', guidance: '颐养天年，精神不灭，福寿绵长', auspicious: 1, advice: '此阶段如有高寿，说明根基深厚。宜保持心情愉悦，享受天伦之乐。'},
  '养': {ageRange: [91, 99], name: '养期', desc: '养精蓄锐，德被后人', guidance: '福寿绵长，德泽子孙', auspicious: 1, advice: '此为极高寿之象，宜保持心态平和，家族和睦，精神充盈。'}
};

// 长生十二宫阶段吉凶描述
var LP_CS_FORTUNE_MAP = {
  '长生': '吉——生机旺盛，宜开创新事',
  '沐浴': '凶——飘摇不定，宜守不宜进',
  '冠带': '吉——初成气象，宜积累精进',
  '临官': '吉——运势上扬，宜积极进取',
  '帝旺': '大吉——气势如虹，宜把握巅峰',
  '衰': '小凶——由盛转衰，宜守成不冒进',
  '病': '凶——体力下降，宜养不宜劳',
  '死': '凶——气运低落，宜静不宜动',
  '墓': '小凶——运入收藏，宜守不宜攻',
  '绝': '凶——旧气已尽，宜等新机',
  '胎': '吉——暗藏转机，宜蓄势待发',
  '养': '吉——休养生息，宜培植根基'
};

// 日主五行健康对照表
var LP_HEALTH_MAP = {
  '木': {
    organs: '肝胆系统、神经系统、筋骨',
    risks: '肝气郁结、偏头痛、颈椎病、眼干眼涩',
    avoid: '忌熬夜、忌动怒、忌过量饮酒',
    diet: '宜食绿色蔬菜、酸味食物（适量）、枸杞、菊花茶；少食油腻辛辣',
    exercise: '宜户外运动、瑜伽拉伸、太极拳；早晨5-7点（卯时）锻炼最佳',
    checkup: '肝功能、胆囊B超、颈椎X光、眼底检查'
  },
  '火': {
    organs: '心血管、眼睛、血液、小肠',
    risks: '心律不齐、高血压、眼疾、口腔溃疡',
    avoid: '忌过劳、忌情绪激动、忌辛辣燥热',
    diet: '宜食红色食物（红枣、枸杞）、苦味食物（适量）、莲子心茶；少食油炸烧烤',
    exercise: '宜有氧运动、慢跑、游泳；避免午时（11-13点）剧烈运动',
    checkup: '心电图、血压监测、眼底检查、血脂血糖'
  },
  '土': {
    organs: '脾胃、消化系统、肌肉、口腔',
    risks: '胃炎、消化不良、血糖偏高、口腔问题',
    avoid: '忌暴饮暴食、忌生冷寒凉、忌饮食不规律',
    diet: '宜食黄色食物（小米、南瓜、土豆）、甘味食物（适量）；少食生冷瓜果',
    exercise: '宜散步、八段锦、广场舞；饭后百步走有助消化',
    checkup: '胃镜/肠镜、血糖检测、腹部B超、口腔检查'
  },
  '金': {
    organs: '呼吸系统、肺部、大肠、皮肤',
    risks: '咳嗽气喘、鼻炎、皮肤过敏、便秘',
    avoid: '忌抽烟、忌雾霾暴露、忌辛辣刺激',
    diet: '宜食白色食物（银耳、百合、梨、白萝卜）、辛味食物（适量）；少食辛辣燥热',
    exercise: '宜游泳、登山、深呼吸练习；清晨（3-5点肺经当令）可做呼吸操',
    checkup: '胸部X光/CT、肺功能检测、过敏源筛查、皮肤检查'
  },
  '水': {
    organs: '肾脏、膀胱、泌尿系统、骨骼',
    risks: '肾虚腰痛、尿路感染、骨质疏松、耳鸣',
    avoid: '忌久坐憋尿、忌过度劳累、忌寒凉侵袭',
    diet: '宜食黑色食物（黑豆、黑芝麻、黑米）、咸味食物（适量）；少食寒凉',
    exercise: '宜站桩、太极拳、腰部运动；注意腰部保暖，避免久坐',
    checkup: '肾功能、尿常规、骨密度检测、肾脏B超'
  }
};

// 合伙人五行推荐表
var LP_PARTNER_MAP = {
  '木': {best: ['水', '火'], ok: ['木'], avoid: ['金'], reason: '水生木为贵人，木生火为相辅；金克木为忌'},
  '火': {best: ['木', '土'], ok: ['火'], avoid: ['水'], reason: '木生火为贵人，火生土为相辅；水克火为忌'},
  '土': {best: ['火', '金'], ok: ['土'], avoid: ['木'], reason: '火生土为贵人，土生金为相辅；木克土为忌'},
  '金': {best: ['土', '水'], ok: ['金'], avoid: ['火'], reason: '土生金为贵人，金生水为相辅；火克金为忌'},
  '水': {best: ['金', '木'], ok: ['水'], avoid: ['土'], reason: '金生水为贵人，水生木为相辅；土克水为忌'}
};

// 7. 长生十二宫人生阶段计算
function lpCalcChangshengStages(baziData) {
  var dayStem = baziData.dayStem;
  var pillars = baziData.pillars;
  var stages = [];
  for (var i = 0; i < pillars.length; i++) {
    var ds = getDishi(dayStem, pillars[i].branch);
    stages.push({
      pillar: ['年柱', '月柱', '日柱', '时柱'][i],
      branch: pillars[i].branch,
      stage: ds,
      info: LP_CS_STAGE_MAP[ds] || null,
      fortune: LP_CS_FORTUNE_MAP[ds] || ''
    });
  }
  return stages;
}

// 8. 长生十二宫人生时间轴
function lpRecommendChangshengTimeline(baziData) {
  var timeline = [];
  var stageOrder = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养'];
  for (var i = 0; i < stageOrder.length; i++) {
    var info = LP_CS_STAGE_MAP[stageOrder[i]];
    if (!info) continue;
    timeline.push({
      stage: stageOrder[i],
      name: info.name,
      ageRange: info.ageRange[0] + '-' + info.ageRange[1] + '岁',
      desc: info.desc,
      guidance: info.guidance,
      auspicious: info.auspicious,
      advice: info.advice,
      fortune: LP_CS_FORTUNE_MAP[stageOrder[i]] || ''
    });
  }
  return timeline;
}

// 9. 当前阶段指导
function lpGetCurrentStageGuidance(baziData, birthYear) {
  var currentYear = new Date().getFullYear();
  var age = currentYear - birthYear;
  var currentStage = null;
  var nextStage = null;
  var stageOrder = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养'];

  for (var i = 0; i < stageOrder.length; i++) {
    var info = LP_CS_STAGE_MAP[stageOrder[i]];
    if (!info) continue;
    if (age >= info.ageRange[0] && age <= info.ageRange[1]) {
      currentStage = {stage: stageOrder[i], info: info, age: age};
      if (i + 1 < stageOrder.length) {
        var nextInfo = LP_CS_STAGE_MAP[stageOrder[i + 1]];
        if (nextInfo) nextStage = {stage: stageOrder[i + 1], info: nextInfo};
      }
      break;
    }
  }

  // 也查看当前大运的长生阶段
  var currentDyStage = null;
  var dayun = baziData.dayun || [];
  for (var j = 0; j < dayun.length; j++) {
    if (age >= dayun[j].ageStart && age < dayun[j].ageEnd) {
      currentDyStage = {
        dayun: dayun[j].gan + dayun[j].zhi,
        ageRange: Math.round(dayun[j].ageStart) + '-' + Math.round(dayun[j].ageEnd) + '岁',
        yearRange: dayun[j].yearStart + '-' + dayun[j].yearEnd + '年',
        dishi: dayun[j].dishi || '',
        ganShen: dayun[j].ganShen || '',
        zhiShen: dayun[j].zhiShen || '',
        isXi: dayun[j].isXi,
        isJi: dayun[j].isJi
      };
      break;
    }
  }

  return {currentStage: currentStage, nextStage: nextStage, currentDyStage: currentDyStage, age: age};
}

// 10. 年龄段催旺与化解
function lpRecommendEnhanceByAge(baziData) {
  var strength = lpGetTenGodStrength(baziData);
  var dayEle = baziData.dayWuxing || ELE[baziData.dayStem];
  var xiEle = baziData.xiEle || '';
  var stages = [];

  // 0-18岁：催文昌（学业）、催印星（保护）
  stages.push({
    ageRange: '0-18岁',
    title: '少年学龄期',
    enhance: [
      {target: '文昌星（学业）', method: '书桌朝向喜用神方位，摆放文昌塔或四支毛笔；佩戴或使用喜用五行颜色的文具'},
      {target: '印星（保护荫庇）', method: '印星代表长辈庇护，宜与长辈关系和睦；家中长辈位（西北方）保持整洁明亮'}
    ],
    remedy: [
      {target: '伤官过旺（叛逆多动）', method: strength.shangGuan >= 4 ? '伤官偏旺，宜引导转化为才艺特长；佩戴印星五行饰品化解' : '伤官不旺，无需特别化解'},
      {target: '比劫过旺（争斗好胜）', method: strength.biJian + strength.jieCai >= 4 ? '比劫偏旺，宜培养团队协作意识；教导分享与谦让' : '比劫平和，正常引导即可'}
    ],
    focus: '学业为重，培养良好学习习惯和品德修养'
  });

  // 19-30岁：催桃花（姻缘）、催官杀（事业起步）
  stages.push({
    ageRange: '19-30岁',
    title: '青年立业期',
    enhance: [
      {target: '桃花星（姻缘）', method: '桃花位摆放鲜花（男摆西方，女摆东方）；穿戴喜用五行颜色衣物增旺个人魅力'},
      {target: '官杀星（事业起步）', method: '正官代表事业地位，宜在办公桌青龙方（左手边）摆放龙形或麒麟摆件；面试时穿戴正官五行颜色'}
    ],
    remedy: [
      {target: '比劫过旺（破财争偶）', method: strength.biJian + strength.jieCai >= 4 ? '比劫旺易争财夺妻/夫，理财宜谨慎，感情需专一；佩戴食伤五行饰品化解' : '比劫不旺，正常经营感情即可'},
      {target: '伤官见官（口舌是非）', method: strength.shangGuan >= 2 && strength.zhengGuan >= 2 ? '伤官见官易惹是非，宜低调做人、谨言慎行；可佩戴印星五行饰品化解' : '无伤官见官之患'}
    ],
    focus: '事业起步与感情发展并重，积累人脉与经验'
  });

  // 31-50岁：催财（正财偏财）、催贵人（升迁）
  stages.push({
    ageRange: '31-50岁',
    title: '中年壮盛期',
    enhance: [
      {target: '财星（正财偏财）', method: '财位（进门对角线方位）摆放聚宝盆或貔貅；办公桌明堂开阔利纳财；投资选喜用五行行业'},
      {target: '天乙贵人（升迁助力）', method: '查找本命天乙贵人方位，办公桌朝向该方位；佩戴天乙贵人符或贵人生肖饰品'}
    ],
    remedy: [
      {target: '劫财夺财（投资失利）', method: strength.jieCai >= 2 ? '劫财旺易破财，投资宜稳健忌投机；大额支出需深思熟虑；佩戴印星五行饰品护财' : '劫财不旺，正常理财即可'},
      {target: '七杀攻身（压力过大）', method: strength.qiSha >= 2 ? '七杀旺压力大，宜学会减压；可佩戴食伤五行饰品制杀，或印星五行饰品化杀' : '七杀不旺，压力可控'}
    ],
    focus: '事业财运并重，注重家庭经营与健康管理'
  });

  // 51岁以上：催健康、催印星（晚年安乐）
  stages.push({
    ageRange: '51岁以上',
    title: '晚年安康期',
    enhance: [
      {target: '印星（晚年安乐）', method: '印星主晚年福报，宜修身养性、念佛抄经；家中文昌位保持明亮整洁'},
      {target: '健康星（寿元）', method: '根据日主五行调理饮食起居；住宅选择朝向喜用方位；卧室避免横梁压顶'}
    ],
    remedy: [
      {target: '衰病死墓运（体力下降）', method: '结合当前长生阶段调理；病/死/墓阶段尤须注意体检，每半年一次全面检查'},
      {target: '财星过旺（贪财伤身）', method: strength.zhengCai + strength.pianCai >= 4 ? '财旺身弱晚年辛苦，宜放下对物质的执着，注重精神修养' : '财星平和，适度理财即可'}
    ],
    focus: '健康第一，精神充盈，传承经验，享受天伦'
  });

  return stages;
}

// 11. 健康注意事项
function lpRecommendHealth(baziData) {
  var dayEle = baziData.dayWuxing || ELE[baziData.dayStem];
  var healthInfo = LP_HEALTH_MAP[dayEle] || {};
  var stages = lpCalcChangshengStages(baziData);
  var dayun = baziData.dayun || [];

  // 查看当前和未来大运的长生阶段，判断健康风险期
  var riskPeriods = [];
  var currentYear = new Date().getFullYear();
  var birthYear = baziData.pillars && baziData.pillars[0] ? null : null; // not directly available, use dayun
  for (var i = 0; i < dayun.length; i++) {
    var dy = dayun[i];
    if (dy.dishi === '病' || dy.dishi === '死' || dy.dishi === '墓') {
      riskPeriods.push({
        ageRange: Math.round(dy.ageStart) + '-' + Math.round(dy.ageEnd) + '岁',
        yearRange: dy.yearStart + '-' + dy.yearEnd + '年',
        stage: dy.dishi,
        risk: dy.dishi === '病' ? '体力下降，慢性病风险增高' : dy.dishi === '死' ? '气运最低，需防意外与重疾' : '运入收藏，宜静养不宜劳'
      });
    }
  }

  // 五行生克健康提示
  var keMap = {'木':'土','土':'水','水':'火','火':'金','金':'木'};
  var shengMap = {'木':'火','火':'土','土':'金','金':'水','水':'木'};
  var keBy = '';
  var shengBy = '';
  for (var k in keMap) { if (keMap[k] === dayEle) { keBy = k; break; } }
  for (var s in shengMap) { if (shengMap[s] === dayEle) { shengBy = s; break; } }

  var extraTips = [];
  if (keBy) extraTips.push('被' + keBy + '所克，需防范' + (LP_HEALTH_MAP[keBy] || {}).organs + '方面的问题传导');
  if (shengBy) extraTips.push('受' + shengBy + '所生，' + shengBy + '过旺则' + dayEle + '受塞，注意排泄与代谢');

  return {
    dayEle: dayEle,
    organs: healthInfo.organs || '',
    risks: healthInfo.risks || '',
    avoid: healthInfo.avoid || '',
    diet: healthInfo.diet || '',
    exercise: healthInfo.exercise || '',
    checkup: healthInfo.checkup || '',
    riskPeriods: riskPeriods,
    extraTips: extraTips
  };
}

// 12. 职业方向细分（考公/国企/创业/合伙）
function lpRecommendCareerDetailed(baziData) {
  var strength = lpGetTenGodStrength(baziData);
  var dayEle = baziData.dayWuxing || ELE[baziData.dayStem];
  var xiEle = baziData.xiEle || '';
  var dayun = baziData.dayun || [];
  var result = {
    government: null,    // 考公考编
    soe: null,           // 国央企
    startup: null,       // 创业
    partnership: null    // 合伙
  };

  // 考公考编：正官+正印组合
  var govScore = 0;
  var govReasons = [];
  if (strength.zhengGuan >= 2) { govScore += 3; govReasons.push('正官星有力，主端正守纪，天生适合体制内'); }
  if (strength.zhengYin >= 2) { govScore += 3; govReasons.push('正印星有力，主学业根基扎实，考试运佳'); }
  if (lpHasShensha(baziData, '天乙')) { govScore += 2; govReasons.push('命带天乙贵人，仕途多有贵人提携'); }
  if (lpHasShensha(baziData, '文昌')) { govScore += 1; govReasons.push('命带文昌，利于考试竞考'); }
  if (strength.shangGuan >= 2) { govScore -= 1; govReasons.push('伤官见官，体制内容易口舌是非，需注意收敛'); }
  if (strength.biJian + strength.jieCai >= 4) { govScore -= 1; govReasons.push('比劫过旺，竞争压力大需多加努力'); }

  var govDirections = LP_CITY_MAP[xiEle] ? LP_CITY_MAP[xiEle].direction : '喜用方位';
  result.government = {
    suitable: govScore >= 3,
    score: govScore,
    reasons: govReasons,
    advice: govScore >= 3 ? '命局组合利考公考编，建议认真备考。重点方向：' + govDirections + '地区岗位竞争相对小。备考期间书桌朝' + govDirections + '。' : '命局考公意愿一般，如决心考公需加倍努力，可考虑基层岗位起步。',
    direction: govDirections,
    bestYears: lpFindDayunByShen(dayun, baziData.dayStem, ['正官', '七杀', '正印'])
  };

  // 国央企：正官+正财
  var soeScore = 0;
  var soeReasons = [];
  if (strength.zhengGuan >= 2) { soeScore += 2; soeReasons.push('正官有力，适合有体制保障的大型企业'); }
  if (strength.zhengCai >= 2) { soeScore += 2; soeReasons.push('正财有力，主稳定收入，适合国企薪酬体系'); }
  if (strength.zhengYin >= 2) { soeScore += 1; soeReasons.push('正印护身，企业内易获上级赏识'); }
  if (strength.qiSha >= 3) { soeScore -= 1; soeReasons.push('七杀偏旺，国企约束感强需适应'); }

  var soeIndustries = [];
  var soeEleMap = {
    '木': ['林业集团', '中医药企业', '教育出版社', '环保集团'],
    '火': ['能源集团', '电力公司', '文化传媒集团', '化工集团'],
    '土': ['建筑集团', '房地产国企', '矿业集团', '农业集团'],
    '金': ['银行', '金融机构', '机械制造', '汽车集团'],
    '水': ['航运集团', '港口物流', '水务集团', '海洋渔业']
  };
  soeIndustries = soeEleMap[xiEle] || soeEleMap[dayEle] || [];
  result.soe = {
    suitable: soeScore >= 2,
    score: soeScore,
    reasons: soeReasons,
    industries: soeIndustries,
    advice: soeScore >= 2 ? '适合国央企发展，推荐行业：' + soeIndustries.slice(0, 3).join('、') + '。入行后注重人际积累与职称评定。' : '国央企适配度一般，可作为一种选择但不必强求。'
  };

  // 创业：七杀+食伤
  var startupScore = 0;
  var startupReasons = [];
  if (strength.qiSha >= 2) { startupScore += 3; startupReasons.push('七杀有力，主果敢冒险，创业魄力十足'); }
  if (strength.shiShen >= 2 || strength.shangGuan >= 2) { startupScore += 2; startupReasons.push('食伤有力，主创意与执行力，善于开拓'); }
  if (strength.pianCai >= 2) { startupScore += 2; startupReasons.push('偏财有力，主偏门财路，适合非传统行业创业'); }
  if (strength.biJian >= 2) { startupScore += 1; startupReasons.push('比肩助力，创业有同道中人支持'); }
  if (strength.jieCai >= 3) { startupScore -= 2; startupReasons.push('劫财过旺，合伙创业易被骗，宜独资'); }
  if (strength.zhengGuan >= 4) { startupScore -= 1; startupReasons.push('正官过旺，性格偏保守，创业需突破舒适区'); }

  var startupIndustries = [];
  var startupEleMap = {
    '木': ['教育培训', '文化出版', '中医养生', '园林景观', '环保科技'],
    '火': ['互联网/科技', '传媒影视', '餐饮连锁', '新能源', '直播电商'],
    '土': ['建筑工程', '房地产开发', '农产品', '仓储物流', '矿业'],
    '金': ['金融科技', '机械制造', '珠宝首饰', '汽车服务', '法律服务'],
    '水': ['跨境电商', '旅游平台', '心理咨询', '水产养殖', '物流配送']
  };
  startupIndustries = startupEleMap[xiEle] || startupEleMap[dayEle] || [];

  // 创业时机：食伤生财的大运
  var startupYears = [];
  for (var si = 0; si < dayun.length; si++) {
    var dy = dayun[si];
    var dyGanShen = dy.ganShen || '';
    var dyZhiShen = dy.zhiShen || '';
    if ((dyGanShen.indexOf('食神') >= 0 || dyGanShen.indexOf('伤官') >= 0) &&
        (dyZhiShen.indexOf('财') >= 0 || dyZhiShen.indexOf('食神') >= 0 || dyZhiShen.indexOf('伤官') >= 0)) {
      startupYears.push(Math.round(dy.ageStart) + '-' + Math.round(dy.ageEnd) + '岁（' + dy.yearStart + '-' + dy.yearEnd + '年）');
    }
    if ((dyZhiShen.indexOf('食神') >= 0 || dyZhiShen.indexOf('伤官') >= 0) &&
        (dyGanShen.indexOf('财') >= 0)) {
      startupYears.push(Math.round(dy.ageStart) + '-' + Math.round(dy.ageEnd) + '岁（' + dy.yearStart + '-' + dy.yearEnd + '年）');
    }
  }

  result.startup = {
    suitable: startupScore >= 3,
    score: startupScore,
    reasons: startupReasons,
    industries: startupIndustries,
    timing: startupYears.length > 0 ? startupYears : ['需结合大运流年具体分析，食伤生财之时为佳'],
    advice: startupScore >= 3 ? '命局适合创业，建议行业：' + startupIndustries.slice(0, 3).join('、') + '。最佳创业时机：' + (startupYears[0] || '食伤旺的大运') + '。' : '创业需谨慎，建议先积累行业经验与人脉后再择机出手。'
  };

  // 合伙人推荐
  var partnerInfo = LP_PARTNER_MAP[dayEle] || {best: [], ok: [], avoid: [], reason: ''};
  var partnerWarnings = [];
  if (strength.biJian + strength.jieCai >= 4) {
    partnerWarnings.push('比劫过旺，合伙易生争执分赃不均，建议独资或绝对控股');
  }
  if (strength.jieCai >= 3) {
    partnerWarnings.push('劫财偏旺，合伙需防被骗，重要财务条款必须白纸黑字写清楚');
  }
  if (strength.shangGuan >= 3) {
    partnerWarnings.push('伤官偏旺，合伙中容易因言语得罪人，需注意沟通方式');
  }

  result.partnership = {
    dayEle: dayEle,
    bestPartners: partnerInfo.best,
    okPartners: partnerInfo.ok,
    avoidPartners: partnerInfo.avoid,
    reason: partnerInfo.reason,
    warnings: partnerWarnings,
    advice: partnerWarnings.length > 0 ? '合伙需谨慎：' + partnerWarnings.join('；') : '可以合伙，优先选择日主五行为' + partnerInfo.best.join('/') + '的合伙人，互补共赢。'
  };

  return result;
}

// 辅助：在大运中查找含特定十神的时段
function lpFindDayunByShen(dayun, dayStem, shenNames) {
  var results = [];
  for (var i = 0; i < dayun.length; i++) {
    var dy = dayun[i];
    var ganShen = dy.ganShen || '';
    var zhiShen = dy.zhiShen || '';
    for (var j = 0; j < shenNames.length; j++) {
      if (ganShen.indexOf(shenNames[j]) >= 0 || zhiShen.indexOf(shenNames[j]) >= 0) {
        results.push(Math.round(dy.ageStart) + '-' + Math.round(dy.ageEnd) + '岁（' + dy.yearStart + '-' + dy.yearEnd + '年）');
        break;
      }
    }
  }
  return results;
}

// 13. 时机提醒（关键年龄节点）
function lpRecommendTiming(baziData, birthYear) {
  var strength = lpGetTenGodStrength(baziData);
  var dayun = baziData.dayun || [];
  var dayStem = baziData.dayStem;
  var timings = [];

  // 升学关键期：文昌星/印星旺的年份
  var studyYears = lpFindDayunByShen(dayun, dayStem, ['正印', '偏印']);
  timings.push({
    type: '升学深造',
    icon: '📚',
    periods: studyYears.length > 0 ? studyYears : ['印星旺的年份（需结合流年具体分析）'],
    action: '考研、读博、考证、出国深造',
    howTo: '在印星/文昌星旺的大运流年报考，录取率高。书桌朝喜用方位，佩戴文昌符。',
    enhance: '催旺文昌：书桌摆放文昌塔/四支毛笔，朝喜用方位'
  });

  // 就业关键期：官杀星旺的年份
  var careerYears = lpFindDayunByShen(dayun, dayStem, ['正官', '七杀']);
  timings.push({
    type: '就业升职',
    icon: '💼',
    periods: careerYears.length > 0 ? careerYears : ['官杀星旺的年份（需结合流年具体分析）'],
    action: '求职、跳槽、竞聘管理岗',
    howTo: '在官杀旺的大运流年求职或竞聘，成功率最高。面试穿戴正官五行颜色。',
    enhance: '催旺官星：办公桌青龙方摆放龙形摆件，面朝喜用方位'
  });

  // 结婚关键期：夫妻宫被合/财官星旺的年份
  var marryYears = [];
  var targetGod = baziData.dayWuxing ? (strength.zhengCai >= 2 ? '正财' : (strength.pianCai >= 2 ? '偏财' : '正财')) : '正财';
  var marryShenNames = ['正财', '偏财', '正官', '七杀'];
  marryYears = lpFindDayunByShen(dayun, dayStem, marryShenNames);
  timings.push({
    type: '婚恋成家',
    icon: '💕',
    periods: marryYears.length > 0 ? marryYears : ['财官星旺的年份（需结合流年具体分析）'],
    action: '相亲、恋爱、结婚',
    howTo: '在财/官星旺的大运流年主动社交，容易遇到正缘。桃花位摆放鲜花催旺。',
    enhance: '催旺桃花：根据生肖查桃花位，摆放鲜花或粉水晶'
  });

  // 创业关键期：食伤生财的年份
  var startupYears = [];
  for (var i = 0; i < dayun.length; i++) {
    var dy = dayun[i];
    var gs = dy.ganShen || '';
    var zs = dy.zhiShen || '';
    if ((gs.indexOf('食神') >= 0 || gs.indexOf('伤官') >= 0) && (zs.indexOf('财') >= 0)) {
      startupYears.push(Math.round(dy.ageStart) + '-' + Math.round(dy.ageEnd) + '岁（' + dy.yearStart + '-' + dy.yearEnd + '年）');
    }
    if ((zs.indexOf('食神') >= 0 || zs.indexOf('伤官') >= 0) && (gs.indexOf('财') >= 0)) {
      startupYears.push(Math.round(dy.ageStart) + '-' + Math.round(dy.ageEnd) + '岁（' + dy.yearStart + '-' + dy.yearEnd + '年）');
    }
  }
  timings.push({
    type: '创业投资',
    icon: '🚀',
    periods: startupYears.length > 0 ? startupYears : ['食伤生财的年份（需结合流年具体分析）'],
    action: '启动创业、扩大投资、开设新业务',
    howTo: '在食伤生财的大运启动创业，创意与财运俱佳。忌在劫财旺的年份大额投资。',
    enhance: '催旺财星：财位摆放聚宝盆/貔貅，朝喜用方位'
  });

  // 购房关键期：印星旺的年份
  var houseYears = lpFindDayunByShen(dayun, dayStem, ['正印', '偏印']);
  timings.push({
    type: '购房置产',
    icon: '🏠',
    periods: houseYears.length > 0 ? houseYears : ['印星旺的年份（需结合流年具体分析）'],
    action: '买房、置业、装修',
    howTo: '在印星旺的大运购房，容易买到满意房产且价格合理。选朝向喜用方位的房屋。',
    enhance: '催旺印星：家中长辈位（西北方）保持整洁明亮，摆放山水画'
  });

  // 生育关键期：食伤星旺的年份
  var birthChildYears = lpFindDayunByShen(dayun, dayStem, ['食神', '伤官']);
  timings.push({
    type: '生育子女',
    icon: '👶',
    periods: birthChildYears.length > 0 ? birthChildYears : ['食伤星旺的年份（需结合流年具体分析）'],
    action: '备孕、生育',
    howTo: '在食伤旺的大运流年备孕，子女缘厚。生产前后注重母亲身体调理。',
    enhance: '催旺食伤：佩戴食伤五行饰品，保持心情愉悦'
  });

  return timings;
}

// 主函数
function computeLifePlan() {
  // 读取输入
  var name = (document.getElementById('lifeplanName') || {}).value || '';
  var sex = (document.getElementById('lifeplanSex') || {}).value || '';
  var hourVal = (document.getElementById('lifeplanHour') || {}).value || '';
  var birthplace = (document.getElementById('lifeplanBirthplace') || {}).value || '';
  var residence = (document.getElementById('lifeplanResidence') || {}).value || '';
  var stage = (document.getElementById('lifeplanStage') || {}).value || '';

  // 校验必填
  if (!sex) { showToast('请选择性别'); return; }
  if (!hourVal) { showToast('请选择出生时辰'); return; }

  // 获取日期
  var year, month, day;
  var calMode = document.querySelector('input[name="lifeplanCalMode"]:checked');
  var isLunar = calMode && calMode.value === 'lunar';

  if (isLunar) {
    var ly = parseInt((document.getElementById('lpLunarYear') || {}).value);
    var lm = parseInt((document.getElementById('lpLunarMonth') || {}).value);
    var ld = parseInt((document.getElementById('lpLunarDay') || {}).value);
    var leap = (document.getElementById('lpLunarLeap') || {}).checked;
    if (!ly || !lm || !ld) { showToast('请填写完整农历日期'); return; }
    try {
      var solar = lunarToSolar(ly, lm, ld, leap);
      year = solar.year; month = solar.month; day = solar.day;
    } catch(e) {
      showToast('农历转换失败: ' + e.message); return;
    }
  } else {
    var dateStr = (document.getElementById('lifeplanDate') || {}).value;
    if (!dateStr) { showToast('请选择出生日期'); return; }
    var parts = dateStr.split('-');
    year = parseInt(parts[0]); month = parseInt(parts[1]); day = parseInt(parts[2]);
  }

  if (!year || !month || !day) { showToast('日期解析失败'); return; }
  if (year < 1900 || year > 2050) { showToast('请输入1900-2050年之间的日期'); return; }

  var hour = parseInt(hourVal);

  // 调用八字引擎
  var baziData;
  try {
    baziData = getBaziCalcData(year, month, day, hour, sex);
  } catch(e) {
    showToast('八字排盘失败: ' + e.message); return;
  }

  // 生成各维度推荐
  var hobbies = lpRecommendHobbies(baziData);
  var study = lpRecommendStudy(baziData);
  var major = lpRecommendMajor(baziData);
  var career = lpRecommendCareer(baziData);
  var cities = lpRecommendCities(baziData);
  var marriage = lpRecommendMarriage(baziData, sex);

  // === 新增推荐 ===
  var csStages = lpCalcChangshengStages(baziData);
  var csTimeline = lpRecommendChangshengTimeline(baziData);
  var currentGuidance = lpGetCurrentStageGuidance(baziData, year);
  var enhanceByAge = lpRecommendEnhanceByAge(baziData);
  var health = lpRecommendHealth(baziData);
  var careerDetailed = lpRecommendCareerDetailed(baziData);
  var timings = lpRecommendTiming(baziData, year);

  // 阶段过滤
  var stageNames = {preschool:'学龄前', primary:'小学', junior:'初中', senior:'高中', college:'大学', career:'职场', marriage:'婚恋期'};

  // 构建输出HTML
  var html = '';

  // ========== Banner ==========
  html += '<div class="result-banner">';
  html += '<h2 class="rb-name">' + (name ? name + ' · ' : '') + '人生规划综合报告</h2>';
  html += '<p class="rb-meta">' + baziData.dayMaster + ' | ' + baziData.dayWuxing + '日主 | ' + (baziData.mingType && baziData.mingType.strengthLevel ? baziData.mingType.strengthLevel : '') + '</p>';
  html += '<div class="rb-tags">';
  html += '<span class="rb-tag">日主' + baziData.dayStem + '</span>';
  html += '<span class="rb-tag">喜用' + (baziData.xiEle || '') + '</span>';
  if (baziData.mingGua && baziData.mingGua.type) html += '<span class="rb-tag">' + baziData.mingGua.type + '</span>';
  if (baziData.geju && baziData.geju.name) html += '<span class="rb-tag">' + baziData.geju.name + '</span>';
  if (stage) html += '<span class="rb-tag">' + (stageNames[stage] || stage) + '</span>';
  html += '</div></div>';

  // ========== 1. 命盘概要 ==========
  html += '<div class="bazi-new-module">';
  html += '<div class="bazi-module-title" onclick="toggleBaziModule(this)">☰ 命盘概要 <span class="toggle-icon">▼</span></div>';
  html += '<div class="bazi-module-body">';
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:12px">';
  html += '<div style="padding:10px;background:rgba(201,168,76,.05);border-radius:8px;text-align:center"><p style="font-size:11px;opacity:.5;margin-bottom:4px">日主</p><p style="font-size:16px;font-weight:600;color:var(--gold)">' + baziData.dayStem + '(' + baziData.dayWuxing + ')</p></div>';
  html += '<div style="padding:10px;background:rgba(72,201,176,.05);border-radius:8px;text-align:center"><p style="font-size:11px;opacity:.5;margin-bottom:4px">喜用神</p><p style="font-size:16px;font-weight:600;color:#48c9b0">' + (baziData.xiEle || '—') + '</p></div>';
  html += '<div style="padding:10px;background:rgba(41,128,185,.05);border-radius:8px;text-align:center"><p style="font-size:11px;opacity:.5;margin-bottom:4px">命局强弱</p><p style="font-size:14px;font-weight:600;color:var(--cyan)">' + (baziData.mingType && baziData.mingType.strengthLevel ? baziData.mingType.strengthLevel : '—') + '</p></div>';
  html += '<div style="padding:10px;background:rgba(142,68,173,.05);border-radius:8px;text-align:center"><p style="font-size:11px;opacity:.5;margin-bottom:4px">命卦</p><p style="font-size:14px;font-weight:600;color:var(--violet)">' + (baziData.mingGua && baziData.mingGua.guaName ? baziData.mingGua.guaName + '·' + baziData.mingGua.type : '—') + '</p></div>';
  html += '</div>';

  // 四柱 + 长生
  html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px">';
  var pillarNames = ['年柱', '月柱', '日柱', '日柱', '时柱'];
  var pillarLabels = ['年柱', '月柱', '日柱', '时柱'];
  for (var pi = 0; pi < 4; pi++) {
    var p = baziData.pillars[pi];
    var ds = csStages[pi] ? csStages[pi].stage : '';
    html += '<div style="padding:8px;background:rgba(201,168,76,.03);border-radius:8px;text-align:center">';
    html += '<p style="font-size:11px;opacity:.5;margin-bottom:4px">' + pillarLabels[pi] + '</p>';
    html += '<p style="font-size:15px;font-weight:600;color:var(--gold)">' + p.stem + p.branch + '</p>';
    if (pi !== 2 && baziData.tenGods) {
      var tgIdx = pi < 2 ? pi : pi - 1;
      if (baziData.tenGods[tgIdx]) {
        html += '<p style="font-size:11px;opacity:.6">' + baziData.tenGods[tgIdx] + '</p>';
      }
    }
    if (ds) html += '<p style="font-size:11px;color:#48c9b0">' + ds + '</p>';
    html += '</div>';
  }
  html += '</div>';

  // 起运信息
  if (baziData.dayun && baziData.dayun[0] && baziData.dayun[0].qiyunAge) {
    html += '<p style="font-size:12px;opacity:.6;text-align:center">' + Math.round(baziData.dayun[0].qiyunAge * 10) / 10 + '岁起运（' + baziData.dayun[0].qiyunDetail + '）</p>';
  }
  html += '</div></div>';

  // ========== 2. 长生十二宫人生时间轴 ==========
  html += '<div class="bazi-new-module">';
  html += '<div class="bazi-module-title" onclick="toggleBaziModule(this)">🕐 长生十二宫人生时间轴 <span class="toggle-icon">▼</span></div>';
  html += '<div class="bazi-module-body">';
  html += '<p style="font-size:12px;color:var(--gold);opacity:.7;margin-bottom:12px">长生十二宫象征人生从生到旺再到衰的循环，每个阶段对应不同的人生课题。"适合的年龄做适合的事"。</p>';

  // 四柱长生位
  html += '<div style="margin-bottom:14px">';
  html += '<p style="font-size:13px;font-weight:600;margin-bottom:8px">四柱长生位（日干论）</p>';
  html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">';
  for (var ci = 0; ci < csStages.length; ci++) {
    var cs = csStages[ci];
    var isCurrent = currentGuidance.currentDyStage && cs.stage === currentGuidance.currentDyStage.dishi;
    var bgCol = cs.info && cs.info.auspicious ? 'rgba(72,201,176,.06)' : 'rgba(231,76,60,.06)';
    var txCol = cs.info && cs.info.auspicious ? '#48c9b0' : 'var(--fire)';
    html += '<div style="padding:8px;background:' + bgCol + ';border-radius:8px;text-align:center' + (isCurrent ? ';border:2px solid var(--gold)' : '') + '">';
    html += '<p style="font-size:11px;opacity:.5">' + cs.pillar + '</p>';
    html += '<p style="font-size:14px;font-weight:600;color:' + txCol + '">' + cs.stage + '</p>';
    html += '<p style="font-size:10px;opacity:.5">' + cs.fortune + '</p>';
    html += '</div>';
  }
  html += '</div></div>';

  // 时间轴
  html += '<div style="position:relative;padding-left:20px">';
  html += '<div style="position:absolute;left:6px;top:0;bottom:0;width:2px;background:linear-gradient(to bottom,#48c9b0,var(--gold),var(--fire),var(--violet))"></div>';
  for (var ti = 0; ti < csTimeline.length; ti++) {
    var tl = csTimeline[ti];
    var isCurrentStage = currentGuidance.currentStage && currentGuidance.currentStage.stage === tl.stage;
    var dotColor = tl.auspicious ? '#48c9b0' : 'var(--fire)';
    html += '<div style="position:relative;margin-bottom:12px;padding:10px;background:' + (isCurrentStage ? 'rgba(201,168,76,.08)' : 'rgba(201,168,76,.03)') + ';border-radius:8px' + (isCurrentStage ? ';border:1px solid var(--gold)' : '') + '">';
    html += '<div style="position:absolute;left:-17px;top:14px;width:10px;height:10px;border-radius:50%;background:' + dotColor + ';border:2px solid var(--bg-card)"></div>';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">';
    html += '<span style="font-size:13px;font-weight:600;color:' + dotColor + '">' + tl.stage + ' · ' + tl.name + '</span>';
    if (isCurrentStage) html += '<span style="font-size:10px;padding:2px 8px;background:var(--gold);color:var(--bg-card);border-radius:10px">当前</span>';
    html += '</div>';
    html += '<p style="font-size:11px;opacity:.5;margin-bottom:4px">' + tl.ageRange + ' | ' + tl.desc + '</p>';
    html += '<p style="font-size:12px;opacity:.7;line-height:1.6">' + tl.guidance + '</p>';
    html += '<p style="font-size:11px;opacity:.5;line-height:1.6;margin-top:4px">' + tl.advice + '</p>';
    html += '</div>';
  }
  html += '</div>';
  html += '</div></div>';

  // ========== 3. 当前阶段指导 ==========
  if (currentGuidance.currentStage) {
    var cg = currentGuidance.currentStage;
    var ng = currentGuidance.nextStage;
    var dy = currentGuidance.currentDyStage;
    html += '<div class="bazi-new-module">';
    html += '<div class="bazi-module-title" onclick="toggleBaziModule(this)">📍 当前阶段指导 <span class="toggle-icon">▼</span></div>';
    html += '<div class="bazi-module-body">';
    html += '<div style="padding:14px;background:rgba(201,168,76,.06);border-radius:10px;border-left:4px solid var(--gold);margin-bottom:12px">';
    html += '<p style="font-size:15px;font-weight:600;color:var(--gold);margin-bottom:6px">当前年龄：' + cg.age + '岁 · ' + cg.info.name + '（' + cg.stage + '）</p>';
    html += '<p style="font-size:13px;opacity:.7;line-height:1.8">' + cg.info.advice + '</p>';
    html += '</div>';

    if (dy) {
      html += '<div style="padding:14px;background:rgba(72,201,176,.05);border-radius:10px;border-left:4px solid #48c9b0;margin-bottom:12px">';
      html += '<p style="font-size:14px;font-weight:600;color:#48c9b0;margin-bottom:6px">当前大运：' + dy.dayun + '（' + dy.ageRange + '）</p>';
      html += '<p style="font-size:12px;opacity:.6;margin-bottom:4px">长生位：' + dy.dishi + ' | 天干十神：' + dy.ganShen + ' | 地支十神：' + dy.zhiShen + '</p>';
      if (dy.yearRange) html += '<p style="font-size:12px;opacity:.6">年份：' + dy.yearRange + '</p>';
      if (dy.isXi) html += '<p style="font-size:12px;color:#48c9b0">✓ 此运为喜用神，运势较顺</p>';
      if (dy.isJi) html += '<p style="font-size:12px;color:var(--fire)">⚠ 此运为忌神，需谨慎行事</p>';
      html += '</div>';
    }

    if (ng) {
      html += '<div style="padding:12px;background:rgba(142,68,173,.04);border-radius:10px">';
      html += '<p style="font-size:13px;font-weight:600;color:var(--violet);margin-bottom:4px">下一阶段：' + ng.info.name + '（' + ng.stage + '，' + ng.info.ageRange[0] + '-' + ng.info.ageRange[1] + '岁）</p>';
      html += '<p style="font-size:12px;opacity:.6;line-height:1.6">' + ng.info.guidance + '</p>';
      html += '</div>';
    }
    html += '</div></div>';
  }

  // ========== 4. 年龄段催旺与化解清单 ==========
  html += '<div class="bazi-new-module">';
  html += '<div class="bazi-module-title" onclick="toggleBaziModule(this)">⚖️ 年龄段催旺与化解 <span class="toggle-icon">▼</span></div>';
  html += '<div class="bazi-module-body">';
  for (var ei = 0; ei < enhanceByAge.length; ei++) {
    var es = enhanceByAge[ei];
    var isCurrentAge = false;
    var ageNow = currentGuidance.age;
    var ageNums = es.ageRange.match(/\d+/g);
    if (ageNums && ageNums.length >= 2) {
      isCurrentAge = ageNow >= parseInt(ageNums[0]) && ageNow <= parseInt(ageNums[1]);
    }
    html += '<div style="margin-bottom:14px;padding:12px;background:' + (isCurrentAge ? 'rgba(201,168,76,.08);border:1px solid var(--gold)' : 'rgba(201,168,76,.03)') + ';border-radius:10px">';
    html += '<p style="font-size:14px;font-weight:600;color:var(--gold);margin-bottom:4px">' + es.ageRange + ' · ' + es.title + (isCurrentAge ? ' ⬅ 当前' : '') + '</p>';
    html += '<p style="font-size:12px;opacity:.6;margin-bottom:8px">重点：' + es.focus + '</p>';

    // 催旺
    html += '<p style="font-size:12px;font-weight:600;color:#48c9b0;margin-bottom:4px">🔼 催旺</p>';
    for (var eni = 0; eni < es.enhance.length; eni++) {
      html += '<p style="font-size:12px;opacity:.7;line-height:1.6;padding-left:8px">• ' + es.enhance[eni].target + '：' + es.enhance[eni].method + '</p>';
    }

    // 化解
    html += '<p style="font-size:12px;font-weight:600;color:var(--fire);margin-top:6px;margin-bottom:4px">🔽 化解</p>';
    for (var rmi = 0; rmi < es.remedy.length; rmi++) {
      html += '<p style="font-size:12px;opacity:.7;line-height:1.6;padding-left:8px">• ' + es.remedy[rmi].target + '：' + es.remedy[rmi].method + '</p>';
    }
    html += '</div>';
  }
  html += '</div></div>';

  // ========== 5. 兴趣爱好推荐 ==========
  html += '<div class="bazi-new-module">';
  html += '<div class="bazi-module-title" onclick="toggleBaziModule(this)">🎨 兴趣爱好推荐 <span class="toggle-icon">▼</span></div>';
  html += '<div class="bazi-module-body">';
  html += '<p style="font-size:12px;color:var(--gold);opacity:.7;margin-bottom:8px">基于八字' + hobbies.reasons.join('、') + '</p>';
  html += '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px">';
  for (var i = 0; i < hobbies.items.length; i++) {
    html += '<span style="padding:6px 14px;background:rgba(72,201,176,.08);border:1px solid rgba(72,201,176,.2);border-radius:20px;font-size:13px;color:#48c9b0">' + hobbies.items[i] + '</span>';
  }
  html += '</div>';
  html += '<p style="font-size:12px;opacity:.6;line-height:1.8">建议：' + hobbies.items.slice(0, 3).join('、') + '为首选方向，结合孩子实际兴趣试学1-2项，坚持3个月以上再评估是否长期发展。</p>';
  html += '</div></div>';

  // ========== 6. 学业方向推荐 ==========
  html += '<div class="bazi-new-module">';
  html += '<div class="bazi-module-title" onclick="toggleBaziModule(this)">📚 学业方向推荐 <span class="toggle-icon">▼</span></div>';
  html += '<div class="bazi-module-body">';
  html += '<p style="font-size:12px;color:var(--gold);opacity:.7;margin-bottom:8px">基于八字' + study.reasons.join('、') + '</p>';
  if (study.topGod) html += '<p style="font-size:13px;margin-bottom:8px">最旺十神：<b style="color:var(--gold)">' + study.topGod + '</b></p>';
  html += '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px">';
  for (var i = 0; i < study.items.length; i++) {
    html += '<span style="padding:6px 14px;background:rgba(201,168,76,.08);border:1px solid rgba(201,168,76,.2);border-radius:20px;font-size:13px;color:var(--gold)">' + study.items[i] + '</span>';
  }
  html += '</div>';
  html += '<p style="font-size:12px;opacity:.6;line-height:1.8">建议：优先考虑' + study.items.slice(0, 3).join('、') + '方向，结合实际成绩和学校资源选择。如有条件，可双修或辅修第二专业拓宽路径。</p>';
  html += '</div></div>';

  // ========== 7. 中高考志愿 ==========
  html += '<div class="bazi-new-module">';
  html += '<div class="bazi-module-title" onclick="toggleBaziModule(this)">🎓 中高考志愿推荐 <span class="toggle-icon">▼</span></div>';
  html += '<div class="bazi-module-body">';
  html += '<p style="font-size:12px;color:var(--gold);opacity:.7;margin-bottom:8px">' + major.reasons.join('；') + '</p>';
  html += '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px">';
  for (var i = 0; i < major.items.length; i++) {
    html += '<span style="padding:6px 14px;background:rgba(41,128,185,.08);border:1px solid rgba(41,128,185,.2);border-radius:20px;font-size:13px;color:var(--cyan)">' + major.items[i] + '</span>';
  }
  html += '</div>';
  html += '<p style="font-size:12px;opacity:.6;line-height:1.8">建议：第一批次志愿以' + major.items.slice(0, 3).join('、') + '为主冲方向；保底志愿选' + major.items.slice(-3).join('、') + '类专业稳录取。</p>';
  html += '</div></div>';

  // ========== 8. 职业方向推荐（含考公/国企/创业/合伙） ==========
  html += '<div class="bazi-new-module">';
  html += '<div class="bazi-module-title" onclick="toggleBaziModule(this)">💼 职业方向推荐 <span class="toggle-icon">▼</span></div>';
  html += '<div class="bazi-module-body">';

  // 基础职业推荐
  html += '<p style="font-size:12px;color:var(--gold);opacity:.7;margin-bottom:8px">基于八字十神组合分析</p>';
  html += '<div style="font-size:13px;margin-bottom:10px">';
  for (var r = 0; r < career.reasons.length; r++) {
    html += '<p style="padding:4px 0;opacity:.7">• ' + career.reasons[r] + '</p>';
  }
  html += '</div>';
  html += '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px">';
  for (var i = 0; i < career.items.length; i++) {
    html += '<span style="padding:6px 14px;background:rgba(231,76,60,.08);border:1px solid rgba(231,76,60,.2);border-radius:20px;font-size:13px;color:var(--fire)">' + career.items[i] + '</span>';
  }
  html += '</div>';

  // 考公考编
  var gov = careerDetailed.government;
  html += '<div style="margin-bottom:14px;padding:12px;background:rgba(201,168,76,.04);border-radius:10px;border-left:3px solid ' + (gov.suitable ? '#48c9b0' : 'var(--fire)') + '">';
  html += '<p style="font-size:14px;font-weight:600;color:' + (gov.suitable ? '#48c9b0' : 'var(--fire)') + ';margin-bottom:6px">🏛️ 考公考编 ' + (gov.suitable ? '✓ 适合' : '△ 一般') + '</p>';
  html += '<div style="font-size:12px;opacity:.7;line-height:1.6">';
  for (var gi = 0; gi < gov.reasons.length; gi++) html += '<p style="padding:2px 0">• ' + gov.reasons[gi] + '</p>';
  html += '</div>';
  html += '<p style="font-size:12px;opacity:.6;line-height:1.6;margin-top:6px">' + gov.advice + '</p>';
  if (gov.bestYears && gov.bestYears.length > 0) {
    html += '<p style="font-size:11px;color:#48c9b0;margin-top:4px">有利时段：' + gov.bestYears.join('、') + '</p>';
  }
  html += '</div>';

  // 国央企
  var soe = careerDetailed.soe;
  html += '<div style="margin-bottom:14px;padding:12px;background:rgba(41,128,185,.04);border-radius:10px;border-left:3px solid ' + (soe.suitable ? '#48c9b0' : 'var(--fire)') + '">';
  html += '<p style="font-size:14px;font-weight:600;color:' + (soe.suitable ? '#48c9b0' : 'var(--fire)') + ';margin-bottom:6px">🏢 国央企 ' + (soe.suitable ? '✓ 适合' : '△ 一般') + '</p>';
  html += '<div style="font-size:12px;opacity:.7;line-height:1.6">';
  for (var si = 0; si < soe.reasons.length; si++) html += '<p style="padding:2px 0">• ' + soe.reasons[si] + '</p>';
  html += '</div>';
  if (soe.industries && soe.industries.length > 0) {
    html += '<p style="font-size:12px;opacity:.6;margin-top:6px">推荐行业：' + soe.industries.join('、') + '</p>';
  }
  html += '<p style="font-size:12px;opacity:.6;line-height:1.6;margin-top:4px">' + soe.advice + '</p>';
  html += '</div>';

  // 创业
  var startup = careerDetailed.startup;
  html += '<div style="margin-bottom:14px;padding:12px;background:rgba(231,76,60,.04);border-radius:10px;border-left:3px solid ' + (startup.suitable ? '#48c9b0' : 'var(--fire)') + '">';
  html += '<p style="font-size:14px;font-weight:600;color:' + (startup.suitable ? '#48c9b0' : 'var(--fire)') + ';margin-bottom:6px">🚀 创业 ' + (startup.suitable ? '✓ 适合' : '△ 需谨慎') + '</p>';
  html += '<div style="font-size:12px;opacity:.7;line-height:1.6">';
  for (var sti = 0; sti < startup.reasons.length; sti++) html += '<p style="padding:2px 0">• ' + startup.reasons[sti] + '</p>';
  html += '</div>';
  if (startup.industries && startup.industries.length > 0) {
    html += '<p style="font-size:12px;opacity:.6;margin-top:6px">推荐方向：' + startup.industries.join('、') + '</p>';
  }
  if (startup.timing && startup.timing.length > 0) {
    html += '<p style="font-size:11px;color:#48c9b0;margin-top:4px">最佳创业时机：' + startup.timing.join('、') + '</p>';
  }
  html += '<p style="font-size:12px;opacity:.6;line-height:1.6;margin-top:4px">' + startup.advice + '</p>';
  html += '</div>';

  // 合伙
  var partner = careerDetailed.partnership;
  html += '<div style="margin-bottom:14px;padding:12px;background:rgba(142,68,173,.04);border-radius:10px;border-left:3px solid var(--violet)">';
  html += '<p style="font-size:14px;font-weight:600;color:var(--violet);margin-bottom:6px">🤝 合伙人推荐</p>';
  html += '<p style="font-size:12px;opacity:.7;line-height:1.6">日主' + partner.dayEle + '，' + partner.reason + '</p>';
  html += '<p style="font-size:12px;margin-top:6px">最佳合伙人五行：<b style="color:#48c9b0">' + partner.bestPartners.join('/') + '</b> | 次佳：<b style="color:var(--gold)">' + partner.okPartners.join('/') + '</b> | 避免：<b style="color:var(--fire)">' + partner.avoidPartners.join('/') + '</b></p>';
  if (partner.warnings && partner.warnings.length > 0) {
    html += '<div style="margin-top:6px">';
    for (var wi = 0; wi < partner.warnings.length; wi++) {
      html += '<p style="font-size:12px;color:var(--fire);padding:2px 0">⚠ ' + partner.warnings[wi] + '</p>';
    }
    html += '</div>';
  }
  html += '<p style="font-size:12px;opacity:.6;line-height:1.6;margin-top:6px">' + partner.advice + '</p>';
  html += '</div>';

  html += '</div></div>';

  // ========== 9. 适合发展的城市 ==========
  html += '<div class="bazi-new-module">';
  html += '<div class="bazi-module-title" onclick="toggleBaziModule(this)">🗺️ 适合发展的城市 <span class="toggle-icon">▼</span></div>';
  html += '<div class="bazi-module-body">';
  html += '<p style="font-size:12px;color:var(--gold);opacity:.7;margin-bottom:8px">' + cities.reasons.join('；') + '</p>';
  for (var ci = 0; ci < cities.items.length; ci++) {
    var city = cities.items[ci];
    var isPrimary = ci === 0;
    html += '<div style="margin-bottom:12px;padding:12px;background:rgba(' + (isPrimary ? '72,201,176' : '201,168,76') + ',.04);border-radius:8px;border-left:3px solid ' + (isPrimary ? '#48c9b0' : 'var(--gold)') + '">';
    html += '<p style="font-size:14px;font-weight:600;color:' + (isPrimary ? '#48c9b0' : 'var(--gold)') + ';margin-bottom:6px">' + (isPrimary ? '⭐ 首选' : '☆ 次选') + '：' + city.ele + '行方位 · ' + city.direction + '</p>';
    html += '<div style="display:flex;flex-wrap:wrap;gap:6px">';
    for (var cj = 0; cj < city.cities.length; cj++) {
      html += '<span style="padding:4px 12px;background:rgba(' + (isPrimary ? '72,201,176' : '201,168,76') + ',.1);border-radius:16px;font-size:12px;color:' + (isPrimary ? '#48c9b0' : 'var(--gold)') + '">' + city.cities[cj] + '</span>';
    }
    html += '</div></div>';
  }
  if (residence) {
    html += '<p style="font-size:12px;opacity:.6;line-height:1.8">当前居住地：' + residence + '。若与推荐方位不符，可考虑在工作地选择朝向喜用方位的住所调理。</p>';
  }
  html += '</div></div>';

  // ========== 10. 适婚年龄与择偶 ==========
  html += '<div class="bazi-new-module">';
  html += '<div class="bazi-module-title" onclick="toggleBaziModule(this)">💕 适婚年龄与择偶推荐 <span class="toggle-icon">▼</span></div>';
  html += '<div class="bazi-module-body">';
  html += '<p style="font-size:12px;color:var(--gold);opacity:.7;margin-bottom:8px">基于八字夫妻宫+大运财官分析</p>';

  html += '<div style="margin-bottom:12px;padding:12px;background:rgba(231,76,60,.04);border-radius:8px">';
  html += '<p style="font-size:14px;font-weight:600;color:var(--fire);margin-bottom:6px">📅 适婚年龄段</p>';
  var ages = marriage.items.marriageAges || [];
  html += '<div style="display:flex;flex-wrap:wrap;gap:8px">';
  for (var ai = 0; ai < ages.length; ai++) {
    html += '<span style="padding:6px 14px;background:rgba(231,76,60,.1);border-radius:20px;font-size:13px;color:var(--fire)">' + ages[ai] + '</span>';
  }
  html += '</div></div>';

  html += '<div style="margin-bottom:12px;padding:12px;background:rgba(201,168,76,.04);border-radius:8px">';
  html += '<p style="font-size:14px;font-weight:600;color:var(--gold);margin-bottom:6px">🏠 夫妻宫分析</p>';
  html += '<p style="font-size:13px;opacity:.7;line-height:1.8">日支为' + baziData.dayBranch + '，夫妻宫关系：' + marriage.items.branchRelation + '</p>';
  html += '</div>';

  var sp = marriage.items.spouseEle || {};
  if (sp.best) {
    html += '<div style="margin-bottom:12px;padding:12px;background:rgba(39,174,96,.04);border-radius:8px">';
    html += '<p style="font-size:14px;font-weight:600;color:var(--jade);margin-bottom:6px">五行择偶方向</p>';
    html += '<p style="font-size:13px;opacity:.7;line-height:1.8">最佳配偶五行：' + sp.best + '</p>';
    if (sp.ok) html += '<p style="font-size:13px;opacity:.7;line-height:1.8">次佳：' + sp.ok + '</p>';
    if (sp.avoid) html += '<p style="font-size:13px;opacity:.5;line-height:1.8">避免：' + sp.avoid + '</p>';
    html += '</div>';
  }

  var zodiac = marriage.items.goodZodiac || [];
  if (zodiac.length > 0) {
    html += '<div style="margin-bottom:12px;padding:12px;background:rgba(142,68,173,.04);border-radius:8px">';
    html += '<p style="font-size:14px;font-weight:600;color:var(--violet);margin-bottom:6px">生肖婚配参考</p>';
    html += '<div style="display:flex;flex-wrap:wrap;gap:8px">';
    for (var zi = 0; zi < zodiac.length; zi++) {
      html += '<span style="padding:6px 14px;background:rgba(142,68,173,.1);border-radius:20px;font-size:13px;color:var(--violet)">' + zodiac[zi] + '</span>';
    }
    html += '</div></div>';
  }

  html += '<div style="font-size:12px;opacity:.5;line-height:1.8;margin-top:8px">';
  for (var mi = 0; mi < marriage.reasons.length; mi++) {
    html += '• ' + marriage.reasons[mi] + '<br>';
  }
  html += '</div>';
  html += '</div></div>';

  // ========== 11. 健康注意事项 ==========
  html += '<div class="bazi-new-module">';
  html += '<div class="bazi-module-title" onclick="toggleBaziModule(this)">🏥 健康注意事项 <span class="toggle-icon">▼</span></div>';
  html += '<div class="bazi-module-body">';

  html += '<div style="padding:14px;background:rgba(231,76,60,.04);border-radius:10px;border-left:4px solid var(--fire);margin-bottom:12px">';
  html += '<p style="font-size:14px;font-weight:600;color:var(--fire);margin-bottom:6px">日主' + health.dayEle + ' · 重点器官：' + health.organs + '</p>';
  html += '<p style="font-size:12px;opacity:.7;line-height:1.6">常见风险：' + health.risks + '</p>';
  html += '<p style="font-size:12px;color:var(--fire);line-height:1.6;margin-top:4px">' + health.avoid + '</p>';
  html += '</div>';

  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">';
  html += '<div style="padding:10px;background:rgba(72,201,176,.04);border-radius:8px">';
  html += '<p style="font-size:12px;font-weight:600;color:#48c9b0;margin-bottom:4px">🍎 饮食建议</p>';
  html += '<p style="font-size:12px;opacity:.7;line-height:1.6">' + health.diet + '</p>';
  html += '</div>';
  html += '<div style="padding:10px;background:rgba(201,168,76,.04);border-radius:8px">';
  html += '<p style="font-size:12px;font-weight:600;color:var(--gold);margin-bottom:4px">🏃 运动建议</p>';
  html += '<p style="font-size:12px;opacity:.7;line-height:1.6">' + health.exercise + '</p>';
  html += '</div>';
  html += '</div>';

  html += '<div style="padding:10px;background:rgba(41,128,185,.04);border-radius:8px;margin-bottom:12px">';
  html += '<p style="font-size:12px;font-weight:600;color:var(--cyan);margin-bottom:4px">🔬 体检重点</p>';
  html += '<p style="font-size:12px;opacity:.7;line-height:1.6">' + health.checkup + '</p>';
  html += '</div>';

  if (health.extraTips && health.extraTips.length > 0) {
    html += '<div style="padding:10px;background:rgba(142,68,173,.04);border-radius:8px;margin-bottom:12px">';
    html += '<p style="font-size:12px;font-weight:600;color:var(--violet);margin-bottom:4px">⚠️ 五行生克提示</p>';
    for (var eti = 0; eti < health.extraTips.length; eti++) {
      html += '<p style="font-size:12px;opacity:.7;line-height:1.6">• ' + health.extraTips[eti] + '</p>';
    }
    html += '</div>';
  }

  if (health.riskPeriods && health.riskPeriods.length > 0) {
    html += '<div style="padding:10px;background:rgba(231,76,60,.06);border-radius:8px">';
    html += '<p style="font-size:13px;font-weight:600;color:var(--fire);margin-bottom:6px">⚠️ 健康风险期（大运长生位为病/死/墓）</p>';
    for (var rpi = 0; rpi < health.riskPeriods.length; rpi++) {
      var rp = health.riskPeriods[rpi];
      html += '<p style="font-size:12px;opacity:.7;line-height:1.6;padding-left:8px">• ' + rp.ageRange + '（' + rp.yearRange + '）· ' + rp.stage + '：' + rp.risk + '</p>';
    }
    html += '</div>';
  }

  html += '</div></div>';

  // ========== 12. 人生关键节点时间表 ==========
  html += '<div class="bazi-new-module">';
  html += '<div class="bazi-module-title" onclick="toggleBaziModule(this)">⏰ 人生关键节点时间表 <span class="toggle-icon">▼</span></div>';
  html += '<div class="bazi-module-body">';
  html += '<p style="font-size:12px;color:var(--gold);opacity:.7;margin-bottom:12px">结合大运十神与长生十二宫，标注人生各关键节点的最佳时机。</p>';

  for (var tmi = 0; tmi < timings.length; tmi++) {
    var tm = timings[tmi];
    html += '<div style="margin-bottom:12px;padding:12px;background:rgba(201,168,76,.03);border-radius:10px;border-left:3px solid var(--gold)">';
    html += '<p style="font-size:14px;font-weight:600;color:var(--gold);margin-bottom:6px">' + tm.icon + ' ' + tm.type + '</p>';
    html += '<p style="font-size:12px;opacity:.7;margin-bottom:4px">适宜时段：' + tm.periods.join('、') + '</p>';
    html += '<p style="font-size:12px;opacity:.6;line-height:1.6;margin-bottom:4px">行动：' + tm.action + '</p>';
    html += '<p style="font-size:12px;opacity:.6;line-height:1.6;margin-bottom:4px">把握方法：' + tm.howTo + '</p>';
    html += '<p style="font-size:11px;color:#48c9b0;line-height:1.6">' + tm.enhance + '</p>';
    html += '</div>';
  }

  html += '</div></div>';

  // ========== 13. 综合建议与免责声明 ==========
  html += '<div class="bazi-new-module">';
  html += '<div class="bazi-module-title" onclick="toggleBaziModule(this)">📋 综合建议 <span class="toggle-icon">▼</span></div>';
  html += '<div class="bazi-module-body">';
  html += '<div style="padding:14px;background:rgba(72,201,176,.04);border-radius:10px;margin-bottom:10px">';
  html += '<p style="font-size:13px;line-height:1.8;color:#48c9b0">基于以上分析，综合建议如下：</p>';
  html += '<ol style="font-size:12px;opacity:.7;line-height:2;padding-left:16px">';
  html += '<li><b>顺势而为</b>：当前处于' + (currentGuidance.currentStage ? currentGuidance.currentStage.info.name : '人生') + '，宜' + (currentGuidance.currentStage ? currentGuidance.currentStage.info.guidance : '踏实努力') + '。</li>';
  html += '<li><b>扬长避短</b>：发挥' + (study.topGod || '命局优势') + '特长，规避' + (strength && strength.jieCai >= 3 ? '破财争斗' : '急躁冒进') + '之短。</li>';
  html += '<li><b>把握时机</b>：关注关键节点的催旺方法，在有利时段大胆出手，不利时段保守稳健。</li>';
  html += '<li><b>健康为本</b>：日主' + health.dayEle + '需重点关注' + health.organs + '，定期体检，合理饮食运动。</li>';
  html += '<li><b>方位助力</b>：优先选择' + (cities.items[0] ? cities.items[0].direction : '喜用方位') + '发展，居住环境朝向喜用方位。</li>';
  html += '<li><b>持续学习</b>：印星主学习，保持终身学习习惯，' + (lpHasShensha(baziData, '文昌') ? '命带文昌更利深造' : '勤奋补拙同样成才') + '。</li>';
  html += '</ol>';
  html += '</div>';
  html += '</div></div>';

  // 免责声明
  html += '<div style="margin-top:16px;padding:16px;background:rgba(201,168,76,.03);border:1px solid rgba(201,168,76,.1);border-radius:8px;text-align:center">';
  html += '<p style="font-size:12px;color:var(--gold);opacity:.5;line-height:1.8">⚠️ 免责声明：以上推荐基于传统命理学八字五行十神、长生十二宫理论生成，仅供参考。人生选择需结合个人实际情况、社会环境、家庭条件等多方面因素综合判断。命理指引方向，努力决定高度。</p>';
  html += '</div>';

  // 输出
  var output = document.getElementById('lifeplanResult');
  if (output) {
    output.style.display = 'block';
    output.innerHTML = html;
    output.scrollIntoView({behavior: 'smooth'});
  }
}
