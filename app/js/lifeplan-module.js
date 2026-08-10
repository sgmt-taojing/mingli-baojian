// lifeplan-module.js
// R639: 人生规划模块（从 divination-core.js 拆分）
// 包含：lpGetTenGodStrength / lpRecommendCareer / lpCalcChangsheng 等 19 个函数
// 依赖：divination-core.js（全局基础数据）
// 用法：用户进入人生规划页面时动态加载
// <script src="js/lifeplan-module.js" defer></script>

function lpGetTenGodStrength(baziData) {
  let result = {zhengGuan:0, qiSha:0, zhengYin:0, pianYin:0, shiShen:0, shangGuan:0, zhengCai:0, pianCai:0, biJian:0, jieCai:0};
  let dayStem = baziData.dayStem;
  let dayEle = ELE[dayStem];
  let pillars = baziData.pillars;
  
  for (let i = 0; i < pillars.length; i++) {
    if (i === 2) continue; // 跳过日柱
    let p = pillars[i];
    // 天干十神
    let ganGod = getTenGod(p.stem, null, dayStem);
    // 地支本气十神
    let zhiGod = getTenGod(null, p.branch, dayStem);
    
    if (ganGod) {
      if (ganGod === '正官') result.zhengGuan += 2;
      else if (ganGod === '七杀') result.qiSha += 2;
      else if (ganGod === '正印') result.zhengYin += 2;
      else if (ganGod === '偏印') result.pianYin += 2;
      else if (ganGod === '食神') result.shiShen += 2;
      else if (ganGod === '伤官') result.shangGuan += 2;
      else if (ganGod === '正财') result.zhengCai += 2;
      else if (ganGod === '偏财') result.pianCai += 2;
      else if (ganGod === '比肩') result.biJian += 2;
      else if (ganGod === '劫财') result.jieCai += 2;
    }
    if (zhiGod) {
      if (zhiGod === '正官') result.zhengGuan += 1;
      else if (zhiGod === '七杀') result.qiSha += 1;
      else if (zhiGod === '正印') result.zhengYin += 1;
      else if (zhiGod === '偏印') result.pianYin += 1;
      else if (zhiGod === '食神') result.shiShen += 1;
      else if (zhiGod === '伤官') result.shangGuan += 1;
      else if (zhiGod === '正财') result.zhengCai += 1;
      else if (zhiGod === '偏财') result.pianCai += 1;
      else if (zhiGod === '比肩') result.biJian += 1;
      else if (zhiGod === '劫财') result.jieCai += 1;
    }
  }
  return result;
}

// 检查命局是否有某十神
function lpHasTenGod(baziData, godName) {
  let gods = baziData.tenGods || [];
  for (let i = 0; i < gods.length; i++) {
    if (gods[i] && gods[i].indexOf(godName) >= 0) return true;
  }
  // 也检查地支藏干
  let strength = lpGetTenGodStrength(baziData);
  if (godName === '食神' && strength.shiShen > 0) return true;
  if (godName === '伤官' && strength.shangGuan > 0) return true;
  if (godName === '正印' && strength.zhengYin > 0) return true;
  if (godName === '偏印' && strength.pianYin > 0) return true;
  if (godName === '正官' && strength.zhengGuan > 0) return true;
  if (godName === '七杀' && strength.qiSha > 0) return true;
  if (godName === '正财' && strength.zhengCai > 0) return true;
  if (godName === '偏财' && strength.pianCai > 0) return true;
  return false;
}

// 检查神煞
function lpHasShensha(baziData, name) {
  let shensha = baziData.shensha || [];
  if (Array.isArray(shensha)) {
    for (let i = 0; i < shensha.length; i++) {
      if (shensha[i] && shensha[i].name && shensha[i].name.indexOf(name) >= 0) return true;
    }
  }
  return false;
}

// 1. 兴趣爱好推荐
function lpRecommendHobbies(baziData) {
  let dayEle = baziData.dayWuxing || ELE[baziData.dayStem];
  let base = LP_HOBBY_MAP[dayEle] || [];
  let extra = [];
  let reasons = ['基于日主' + dayEle + '五行特性'];
  
  // 结合食伤星
  if (lpHasTenGod(baziData, '食神')) {
    extra.push('创意写作', '绘画', '手工DIY', '花艺设计');
    reasons.push('食神星现，天生具创意天赋');
  }
  if (lpHasTenGod(baziData, '伤官')) {
    extra.push('辩论', '自媒体', '表演', '脱口秀');
    reasons.push('伤官星现，表达欲望强烈');
  }
  if (lpHasTenGod(baziData, '正印') || lpHasTenGod(baziData, '偏印')) {
    extra.push('读书', '书法', '学术研究', '古文鉴赏');
    reasons.push('印星现，天然学术倾向');
  }
  
  // 合并去重
  let all = [];
  let seen = {};
  for (let i = 0; i < base.length; i++) {
    if (!seen[base[i]]) { all.push(base[i]); seen[base[i]] = true; }
  }
  for (let j = 0; j < extra.length; j++) {
    if (!seen[extra[j]]) { all.push(extra[j]); seen[extra[j]] = true; }
  }
  
  return {items: all, reasons: reasons};
}

// 2. 学业方向推荐
function lpRecommendStudy(baziData) {
  let strength = lpGetTenGodStrength(baziData);
  let recommendations = [];
  let reasons = [];
  
  // 找最旺的十神
  let sorted = Object.keys(strength).map(function(k){return [k, strength[k]];}).sort(function(a,b){return b[1]-a[1];});
  let topGod = sorted[0][0];
  let topVal = sorted[0][1];
  
  let godNameMap = {zhengGuan:'正官', qiSha:'七杀', zhengYin:'正印', pianYin:'偏印', shiShen:'食神', shangGuan:'伤官', zhengCai:'正财', pianCai:'偏财', biJian:'比肩', jieCai:'劫财'};
  
  if (topGod === 'zhengYin' || topGod === 'pianYin') {
    recommendations.push('文学', '历史', '哲学', '教育学', '图书馆学', '考古学', '古典文献');
    reasons.push('印星旺盛，主学习能力强、学术天赋高');
  }
  if (topGod === 'shiShen' || topGod === 'shangGuan') {
    recommendations.push('艺术设计', '传媒', '创意产业', '广告学', '影视制作', '动画');
    reasons.push('食伤旺盛，主才智外放、创造力强');
  }
  if (topGod === 'zhengGuan' || topGod === 'qiSha') {
    recommendations.push('法学', '政治学', '军事学', '公共管理', '国际关系');
    reasons.push('官杀旺盛，主纪律性强、适合体制内发展');
  }
  if (topGod === 'zhengCai' || topGod === 'pianCai') {
    recommendations.push('经济学', '金融学', '商学', '会计学', '国际贸易');
    reasons.push('财星旺盛，主商业敏感度高');
  }
  if (topGod === 'biJian' || topGod === 'jieCai') {
    recommendations.push('体育', '工程学', '计算机科学', '机械工程', '团队协作型专业');
    reasons.push('比劫旺盛，主行动力强、适合技术实操');
  }
  
  // 如果没有明显旺的，综合推荐
  if (recommendations.length === 0) {
    recommendations.push('综合管理', '跨学科研究', '通识教育');
    reasons.push('十神较为均衡，适合综合型学科发展');
  }
  
  return {items: recommendations, reasons: reasons, topGod: godNameMap[topGod] || ''};
}

// 3. 中高考志愿推荐
function lpRecommendMajor(baziData) {
  let dayEle = baziData.dayWuxing || ELE[baziData.dayStem];
  let xiEle = baziData.xiEle || '';
  let recommendations = [];
  let reasons = ['基于日主' + dayEle + '+喜用' + xiEle + '分析'];
  
  let majorMap = {
    '木': ['林业', '中医', '中药学', '教育学', '汉语言文学', '出版学', '园林', '环保科学', '木材科学'],
    '火': ['能源工程', '电子工程', '传媒学', '餐饮管理', '化学工程', '光电信息', '播音主持', '烹饪工艺'],
    '土': ['建筑学', '农学', '地质学', '房地产管理', '陶瓷设计', '土木工程', '城乡规划', '土地资源管理'],
    '金': ['金融学', '法学', '机械工程', '珠宝设计', '公安学', '刑事科学', '审计学', '精密仪器'],
    '水': ['航运管理', '物流工程', '心理学', '旅游管理', '外交学', '海洋科学', '水利 工程', '统计学']
  };
  
  recommendations = majorMap[dayEle] ? majorMap[dayEle].slice() : [];
  
  // 喜用神补充
  if (xiEle && xiEle !== dayEle && majorMap[xiEle]) {
    for (let i = 0; i < majorMap[xiEle].length && i < 3; i++) {
      if (recommendations.indexOf(majorMap[xiEle][i]) < 0) {
        recommendations.push(majorMap[xiEle][i]);
      }
    }
    reasons.push('喜用神' + xiEle + '补充推荐相关专业');
  }
  
  // 文昌星判断学业层次
  let hasWenchang = lpHasShensha(baziData, '文昌');
  let hasTianyi = lpHasShensha(baziData, '天乙');
  if (hasWenchang) {
    reasons.push('命带文昌贵人，主考运亨通，适合深造读研读博');
  }
  if (hasTianyi) {
    reasons.push('命带天乙贵人，主贵人提携，求学路上多有名师指点');
  }
  if (!hasWenchang && !hasTianyi) {
    reasons.push('无明显文星，建议勤奋补拙，选专业时侧重实用技能型');
  }
  
  return {items: recommendations, reasons: reasons};
}

// 4. 职业方向推荐
function lpRecommendCareer(baziData) {
  let strength = lpGetTenGodStrength(baziData);
  let recommendations = [];
  let reasons = [];
  
  // 正官+正印
  if (strength.zhengGuan >= 2 && strength.zhengYin >= 2) {
    recommendations.push('公务员', '教师', '事业单位管理', '国企行政');
    reasons.push('正官+正印组合，主稳定端正，适合体制内');
  }
  // 七杀旺
  if (strength.qiSha >= 2) {
    recommendations.push('军警', '创业', '竞争性行业', '投行', '外科医生');
    reasons.push('七杀旺，主刚毅果敢，适合高压竞争环境');
  }
  // 食神+偏财
  if (strength.shiShen >= 2 && strength.pianCai >= 2) {
    recommendations.push('餐饮业', '创意产业', '投资理财', '内容创业', '品牌策划');
    reasons.push('食神+偏财组合，主以才生财');
  }
  // 伤官+偏财
  if (strength.shangGuan >= 2 && strength.pianCai >= 2) {
    recommendations.push('销售', '演艺', '自由职业', '商业咨询', '电商创业');
    reasons.push('伤官+偏财组合，主以口才胆识生财');
  }
  // 正印+比肩
  if (strength.zhengYin >= 2 && strength.biJian >= 2) {
    recommendations.push('科研', '学术', '技术研发', '高校教师', '专利工程师');
    reasons.push('正印+比肩组合，主学业精深适合同行协作');
  }
  // 正财旺
  if (strength.zhengCai >= 2) {
    recommendations.push('财务管理', '银行', '会计', '保险精算');
    reasons.push('正财旺，主理财稳健，适合金融后台');
  }
  // 伤官+正印（伤官佩印）
  if (strength.shangGuan >= 2 && strength.zhengYin >= 2) {
    recommendations.push('教育培训', '法律', '文化传媒', '心理咨询');
    reasons.push('伤官佩印格，主才华与修养兼备');
  }
  
  // 如果没有明显组合，根据日主五行推荐
  if (recommendations.length === 0) {
    let dayEle = baziData.dayWuxing || ELE[baziData.dayStem];
    let fallback = {
      '木': ['教育行业', '文化出版', '园林农业', '中医中药'],
      '火': ['电子科技', '传媒影视', '餐饮酒店', '能源化工'],
      '土': ['建筑工程', '房地产', '农业', '矿业'],
      '金': ['金融银行', '机械制造', '法律', '汽车工业'],
      '水': ['物流航运', '旅游酒店', '心理咨询', '水产渔业']
    };
    recommendations = fallback[dayEle] || ['综合管理类岗位'];
    reasons.push('基于日主' + dayEle + '五行基础推荐');
  }
  
  return {items: recommendations, reasons: reasons};
}

// 5. 适合发展的城市
function lpRecommendCities(baziData) {
  let xiEle = baziData.xiEle || '';
  let dayEle = baziData.dayWuxing || ELE[baziData.dayStem];
  let mingGua = baziData.mingGua || {};
  let recommendations = [];
  let reasons = [];
  
  // 主推荐：喜用神方位
  let primaryEle = xiEle || dayEle;
  let primary = LP_CITY_MAP[primaryEle];
  if (primary) {
    recommendations.push({ele: primaryEle, direction: primary.direction, cities: primary.cities});
    reasons.push('喜用神' + primaryEle + '主方位' + primary.direction + '，最利发展');
  }
  
  // 次推荐：日主五行方位
  if (dayEle !== primaryEle) {
    let secondary = LP_CITY_MAP[dayEle];
    if (secondary) {
      recommendations.push({ele: dayEle, direction: secondary.direction, cities: secondary.cities});
      reasons.push('日主' + dayEle + '本命方位' + secondary.direction + '为次选');
    }
  }
  
  // 命卦东四命/西四命细化
  if (mingGua.type) {
    reasons.push('命卦' + (mingGua.guaName || '') + '属' + mingGua.type + '，' + (mingGua.isDong ? '宜东、东南、南、北方发展' : '宜西、西北、西南、东北方发展'));
  }
  
  return {items: recommendations, reasons: reasons};
}

// 6. 适婚年龄与择偶推荐
function lpRecommendMarriage(baziData, sex) {
  let dayBranch = baziData.dayBranch || '';
  let dayEle = baziData.dayWuxing || ELE[baziData.dayStem];
  let dayun = baziData.dayun || [];
  let recommendations = {};
  let reasons = [];
  
  // 夫妻宫分析
  let zhiEle = ZHI_ELE[dayBranch] || '';
  let dayEleZhi = dayEle;
  let branchRelation = '';
  let shengMap = {'木':'火','火':'土','土':'金','金':'水','水':'木'};
  let keMap = {'木':'土','土':'水','水':'火','火':'金','金':'木'};
  if (zhiEle === dayEleZhi) branchRelation = '比和（平等互助）';
  else if (shengMap[dayEleZhi] === zhiEle) branchRelation = '日主生夫妻宫（付出型）';
  else if (shengMap[zhiEle] === dayEleZhi) branchRelation = '夫妻宫生日主（得助型）';
  else if (keMap[dayEleZhi] === zhiEle) branchRelation = '日主克夫妻宫（主导型）';
  else if (keMap[zhiEle] === dayEleZhi) branchRelation = '夫妻宫克日主（受制型）';
  
  reasons.push('日支夫妻宫为' + dayBranch + '(' + zhiEle + ')，与日主' + dayEle + '关系: ' + branchRelation);
  
  // 适婚年龄：根据大运中财/官星旺的时段
  let marriageAges = [];
  let targetGod = sex === 'female' ? '正官' : '正财';
  let altGod = sex === 'female' ? '七杀' : '偏财';
  
  for (let i = 0; i < dayun.length; i++) {
    let dy = dayun[i];
    // 检查大运天干十神
    let dyGod = getTenGod(dy.gan, null, baziData.dayStem);
    let dyZhiGod = getTenGod(null, dy.zhi, baziData.dayStem);
    
    if (dyGod === targetGod || dyGod === altGod || dyZhiGod === targetGod || dyZhiGod === altGod) {
      marriageAges.push(Math.round(dy.ageStart) + '-' + Math.round(dy.ageEnd) + '岁（' + dy.yearStart + '-' + dy.yearEnd + '年）');
    }
  }
  
  if (marriageAges.length === 0) {
    // 回退到常规推荐
    if (sex === 'female') {
      marriageAges.push('24-28岁', '30-32岁');
      reasons.push('女命以正官为夫，未在显著大运中发现官星，参考常规适婚年龄');
    } else {
      marriageAges.push('26-30岁', '32-35岁');
      reasons.push('男命以正财为妻，未在显著大运中发现财星，参考常规适婚年龄');
    }
  } else {
    reasons.push((sex === 'female' ? '女命以正官/七杀为夫星' : '男命以正财/偏财为妻星') + '，在大运中找到财/官旺的时段: ' + marriageAges.join('、'));
  }
  
  // 择偶方向：根据日主五行推荐配偶五行
  let spouseEleMap = {
    '木': {best: '水（水生木）', ok: '木（比和）', avoid: '金（金克木）'},
    '火': {best: '木（木生火）', ok: '火（比和）', avoid: '水（水克火）'},
    '土': {best: '火（火生土）', ok: '土（比和）', avoid: '木（木克土）'},
    '金': {best: '土（土生金）', ok: '金（比和）', avoid: '火（火克金）'},
    '水': {best: '金（金生水）', ok: '水（比和）', avoid: '土（土克水）'}
  };
  let spouseInfo = spouseEleMap[dayEle] || {};
  
  // 生肖婚配参考（以日支为主）
  let zodiacMatch = {
    '子': ['申(猴)', '辰(龙)', '丑(牛)'], '丑': ['子(鼠)', '巳(蛇)', '酉(鸡)'],
    '寅': ['午(马)', '戌(狗)', '亥(猪)'], '卯': ['亥(猪)', '未(羊)', '戌(狗)'],
    '辰': ['子(鼠)', '申(猴)', '酉(鸡)'], '巳': ['丑(牛)', '酉(鸡)', '午(马)'],
    '午': ['寅(虎)', '戌(狗)', '未(羊)'], '未': ['卯(兔)', '亥(猪)', '午(马)'],
    '申': ['子(鼠)', '辰(龙)', '巳(蛇)'], '酉': ['丑(牛)', '巳(蛇)', '辰(龙)'],
    '戌': ['寅(虎)', '午(马)', '卯(兔)'], '亥': ['卯(兔)', '未(羊)', '寅(虎)']
  };
  let goodZodiac = zodiacMatch[dayBranch] || [];
  
  recommendations.marriageAges = marriageAges;
  recommendations.spouseEle = spouseInfo;
  recommendations.goodZodiac = goodZodiac;
  recommendations.branchRelation = branchRelation;
  
  return {items: recommendations, reasons: reasons};
}

// ================================================================
// 人生规划引擎升级 — 新增子函数
// ================================================================

// 长生十二宫 → 人生阶段映射
var LP_CS_STAGE_MAP = {
  '长生': {
    ageRange: [0, 10], name: '长生期', desc: '如初生之苗，生机勃发', guidance: '打基础，学习，培养兴趣，发展健康的身心习惯',
    auspicious: 1, advice: '此阶段为人生根基，宜注重营养、教育启蒙、性格塑造。家长应给予充分关爱与引导。',
    theme: '生命力萌发，扎根成长',
    yi: ['培养良好生活习惯与品德', '启蒙教育与兴趣探索', '注重营养与体育锻炼'],
    ji: ['过度溺爱导致任性', '过早施加学业压力', '接触不良信息环境'],
    enhanceStudy: '书桌朝喜用方位，摆放文昌塔；启蒙阅读，培养专注力',
    enhanceNoble: '长辈关爱是最好的贵人；拜认干爹干妈可增福荫',
    enhanceMarriage: '此阶段不宜催桃花，宜培养健康性别认知与社交能力',
    enhanceWealth: '培养储蓄意识，开立儿童账户；教导金钱观念',
    remedy: ['比劫过旺：教导分享谦让，避免争斗', '伤官过旺：引导转化为才艺特长，佩戴印星五行饰品'],
    health: '注意营养均衡与免疫力建设，按时接种疫苗；防意外磕碰'
  },
  '沐浴': {
    ageRange: [11, 20], name: '沐浴期', desc: '如新生沐浴，脆弱需护', guidance: '青春期学业关键期，防桃花干扰，注重心理成长',
    auspicious: 0, advice: '此阶段情绪波动大，易受外界影响。宜专注学业，避免早恋分心。家长需多沟通理解，忌简单粗暴。',
    theme: '青春期波动，洗心革面',
    yi: ['专注学业，打牢知识基础', '培养1-2项特长或兴趣爱好', '建立健康社交圈与友谊'],
    ji: ['早恋分心影响学业', '叛逆冲动做出过激行为', '沉迷网络或不良嗜好'],
    enhanceStudy: '书桌朝喜用方位；佩戴文昌符；考试前佩戴印星五行饰品',
    enhanceNoble: '多结交正能量的同学与师长；参加学习小组互帮互助',
    enhanceMarriage: '此阶段感情尚不成熟，宜以学业为重；可培养社交能力为将来打基础',
    enhanceWealth: '学会理财规划零用钱；培养劳动获酬观念',
    remedy: ['伤官见官（口舌是非）：谨言慎行，佩戴印星五行饰品化解', '比劫过旺（争斗好胜）：培养团队协作意识，教导分享谦让'],
    health: '关注青春期心理健康；注意视力保护与坐姿；女生关注生理期调理'
  },
  '冠带': {
    ageRange: [21, 30], name: '冠带期', desc: '如人加冠，初具规模', guidance: '大学/初入社会，技能积累，拓展人脉',
    auspicious: 1, advice: '此阶段宜广学博闻，积累专业技能与社交经验。可尝试实习、兼职，为正式入行做准备。',
    theme: '成年礼成，立足社会',
    yi: ['积累专业技能与工作经验', '拓展人脉圈层，建立职场关系', '尝试不同方向找到最适合之路'],
    ji: ['频繁跳槽不安定', '过度消费不储蓄', '忽视感情经营错过良缘'],
    enhanceStudy: '考研考证最佳期；书桌朝喜用方位，佩戴文昌塔',
    enhanceNoble: '积极参加行业活动，多结识前辈；办公桌青龙方摆放龙形摆件',
    enhanceMarriage: '桃花位摆放鲜花（男摆西方，女摆东方）；穿戴喜用五行颜色增旺魅力',
    enhanceWealth: '开始定期储蓄与理财；学习投资知识，小额试水',
    remedy: ['比劫过旺（破财争偶）：理财宜谨慎，感情需专一；佩戴食伤五行饰品化解', '伤官见官（口舌是非）：低调做人，谨言慎行；佩戴印星五行饰品化解'],
    health: '注意作息规律，避免熬夜；关注心理健康与压力释放；定期体检'
  },
  '临官': {
    ageRange: [31, 40], name: '临官期', desc: '如人出仕，独当一面', guidance: '事业起步，成家立业，勇抓机遇',
    auspicious: 1, advice: '此阶段为事业黄金起步期，宜敢于担当、快速成长。同时考虑成家，事业家庭兼顾。',
    theme: '事业上升，独当一面',
    yi: ['勇抓事业机遇，敢于担当重任', '成家立业，经营夫妻关系', '建立个人品牌与人脉网络'],
    ji: ['因工作忽视家庭与健康', '盲目投资超出能力范围', '固步自封拒绝学习成长'],
    enhanceStudy: '在职深造读MBA/考职称；印星旺时利考试',
    enhanceNoble: '天乙贵人方位办公；佩戴贵人符或贵人生肖饰品',
    enhanceMarriage: '夫妻宫位保持整洁；卧室避免镜子对床；选择喜用五行颜色床品',
    enhanceWealth: '财位摆放聚宝盆或貔貅；投资选喜用五行行业；办公桌明堂开阔利纳财',
    remedy: ['劫财夺财（投资失利）：投资宜稳健忌投机；大额支出需深思熟虑', '七杀攻身（压力过大）：学会减压，佩戴食伤五行饰品制杀或印星五行饰品化杀'],
    health: '注意颈椎腰椎与心血管；定期全面体检；坚持规律运动；管理压力'
  },
  '帝旺': {
    ageRange: [41, 50], name: '帝旺期', desc: '如帝之旺，气势最盛', guidance: '事业巅峰，把握机遇，敢于进取',
    auspicious: 1, advice: '此阶段为人生巅峰期，精力与经验俱佳。宜大胆拓展事业版图，同时注意家庭经营与身体健康。',
    theme: '人生巅峰，精力最旺',
    yi: ['大胆拓展事业版图，把握巅峰机遇', '培养接班人与团队，学会放权', '注重家庭经营与子女教育'],
    ji: ['过度操劳透支健康', '骄傲自满刚愎自用', '忽视子女教育与陪伴'],
    enhanceStudy: '终身学习保持竞争力；关注行业新趋势与新技术',
    enhanceNoble: '已成贵人，宜提携后辈；广结善缘为下半生积累人脉',
    enhanceMarriage: '中年夫妻关系需用心经营；定期二人世界；避免事业忽视伴侣',
    enhanceWealth: '投资组合多元化；资产配置注重稳健；考虑养老规划',
    remedy: ['财星过旺（身弱不担财）：注意健康，不可为财透支；佩戴比劫五行饰品助身', '官杀过旺（压力过载）：学会放权减压；培养接班人；佩戴印星五行饰品化杀'],
    health: '全面体检每年一次；关注三高与心血管；注意更年期调理；坚持运动与体检'
  },
  '衰': {
    ageRange: [51, 60], name: '衰期', desc: '由盛转衰，需知进退', guidance: '稳中求进，培养接班人，逐步放权',
    auspicious: 0, advice: '此阶段运势转弱，不宜冒进。宜稳守成果，培养接班人，为退休做规划。注重健康保养。',
    theme: '由盛转衰，知进退明得失',
    yi: ['稳守成果，逐步培养接班人', '为退休做财务与生活规划', '注重养生与健康投资'],
    ji: ['冒进投资或二次创业大额投入', '忽视身体预警信号', '放不下权力不愿交接'],
    enhanceStudy: '学习养生知识与退休规划；发展精神层面的兴趣',
    enhanceNoble: '与老友保持联络；传承经验给后辈，以德聚人',
    enhanceMarriage: '夫妻关系重新升温；规划退休后共同生活；互相陪伴',
    enhanceWealth: '资产配置转向稳健保守；减少高风险投资；确保养老金充足',
    remedy: ['衰病死墓运：结合长生阶段调理，每半年全面体检', '财星过旺（贪财伤身）：放下对物质的执着，注重精神修养'],
    health: '每半年体检一次；关注心脑血管与骨密度；适度运动不宜剧烈；注意饮食调理'
  },
  '病': {
    ageRange: [61, 70], name: '病期', desc: '体弱需养，非真病也', guidance: '注重健康，修身养性，放下执念',
    auspicious: 0, advice: '此阶段精力下降，宜减少工作量，注重养生。定期体检，饮食清淡，适度运动。',
    theme: '健康需关注，修心养性',
    yi: ['修身养性，减少世俗操劳', '享受天伦之乐，传承人生智慧', '发展恬淡兴趣如书画、园艺、太极'],
    ji: ['操心子女事务过度', '忽视身体不适拖延就医', '执着往事难以释怀'],
    enhanceStudy: '学习传统文化、哲学、宗教等精神层面知识',
    enhanceNoble: '与同龄人组建养生圈子；互相关照健康',
    enhanceMarriage: '老伴陪伴最重要；互相照料健康；珍惜相处时光',
    enhanceWealth: '以保本为主；安排好遗产规划；不参与高风险投资',
    remedy: ['健康风险期：定期全面检查，遵医嘱调理', '情绪低落：参加社区活动，保持社交'],
    health: '每年至少两次全面体检；关注慢性病管理；饮食清淡少油盐；适度运动如太极散步'
  },
  '死': {
    ageRange: [71, 80], name: '死期', desc: '气数收敛，非真死亡', guidance: '放下执念，享受天伦，精神超脱',
    auspicious: 0, advice: '此阶段宜彻底放下事业操心，享受家庭生活。可修习太极、书画等修身养性之活动。',
    theme: '生命力减弱，精神超脱',
    yi: ['彻底放下世事操心，享受天伦', '修习太极、书画、抄经等修身养性', '整理人生经验传承后人'],
    ji: ['独居不与人来往', '过度忧虑子女家事', '拒绝接受身体照护'],
    enhanceStudy: '精神层面的学习与修行；念佛抄经；阅读经典',
    enhanceNoble: '子女孙辈是最好的贵人；保持家庭和睦',
    enhanceMarriage: '老伴相互扶持；子女定期探望陪伴',
    enhanceWealth: '确保养老医疗费用充足；妥善安排财务事宜',
    remedy: ['气运低落：宜静不宜动；家中保持明亮通风', '孤独感：积极参与老年社区活动'],
    health: '防跌倒与意外；定期体检；注意认知功能；家人多陪伴照护'
  },
  '墓': {
    ageRange: [81, 90], name: '墓期', desc: '收藏归库，宜守不宜攻', guidance: '安享晚年，整理传承，回顾人生',
    auspicious: 0, advice: '此阶段宜静养，整理人生经验传承后人。可写回忆录、传授经验给晚辈。',
    theme: '归藏收藏，传承智慧',
    yi: ['安享晚年，静养身心', '整理人生经验，传承给后辈', '与家人共处，享受天伦之乐'],
    ji: ['操心世俗事务', '过度劳累伤身', '与家人产生矛盾'],
    enhanceStudy: '回忆录写作；精神层面的修行',
    enhanceNoble: '家人陪伴是最大福报；子女孝顺',
    enhanceMarriage: '老伴相依；子女照护',
    enhanceWealth: '遗产安排妥当；财务简洁透明',
    remedy: ['体力下降：专人照护；家居适老化改造', '情绪低落：家人多陪伴；保持社交活动'],
    health: '专人照护；家居防跌防滑；饮食软烂易消化；定期检查'
  },
  '绝': {
    ageRange: [91, 99], name: '绝期', desc: '旧气已绝，新气将生', guidance: '超然物外，精神传承，恬淡虚无',
    auspicious: 0, advice: '此阶段宜保持恬淡心态，不问俗事，精神上达观超脱。家人应多陪伴关护。',
    theme: '终点即起点，超然物外',
    yi: ['保持恬淡虚无的心态', '享受每一天的陪伴', '精神传承后人'],
    ji: ['执着世间俗务', '独处无人照护', '情绪大起大落'],
    enhanceStudy: '精神层面的终极关怀；宗教信仰慰藉',
    enhanceNoble: '家人全程照护陪伴',
    enhanceMarriage: '老伴或家人陪伴左右',
    enhanceWealth: '财务已安排妥当，无需操心',
    remedy: ['身体虚弱：专业护理；保持环境舒适', '精神孤独：家人陪伴；回忆美好往事'],
    health: '全程照护；关注生命质量；舒适为主；家人陪伴'
  },
  '胎': {
    ageRange: [85, 90], name: '胎期', desc: '新胎暗结，轮回再起', guidance: '颐养天年，精神不灭，福寿绵长',
    auspicious: 1, advice: '此阶段如有高寿，说明根基深厚。宜保持心情愉悦，享受天伦之乐。',
    theme: '新胎暗结，轮回再起',
    yi: ['保持心情愉悦', '享受天伦之乐', '精神层面修行'],
    ji: ['忧虑世俗', '情绪波动', '独居无人照护'],
    enhanceStudy: '精神修行；念佛打坐',
    enhanceNoble: '家人陪伴照护',
    enhanceMarriage: '家人陪伴最重要',
    enhanceWealth: '无需操心财务',
    remedy: ['保持环境舒适安静', '家人多陪伴'],
    health: '关注生命质量；舒适照护；家人陪伴'
  },
  '养': {
    ageRange: [91, 99], name: '养期', desc: '养精蓄锐，德被后人', guidance: '福寿绵长，德泽子孙',
    auspicious: 1, advice: '此为极高寿之象，宜保持心态平和，家族和睦，精神充盈。',
    theme: '养精蓄锐，德被后人',
    yi: ['保持心态平和', '家族和睦', '精神充盈'],
    ji: ['操心俗务', '情绪波动', '与家人争执'],
    enhanceStudy: '精神层面的终极修行',
    enhanceNoble: '后辈孝敬',
    enhanceMarriage: '家人陪伴',
    enhanceWealth: '传承安排妥当',
    remedy: ['保持舒适环境', '家人陪伴照护'],
    health: '关注生命质量；舒适照护'
  }
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
  let dayStem = baziData.dayStem;
  let pillars = baziData.pillars;
  let stages = [];
  for (let i = 0; i < pillars.length; i++) {
    let ds = getDishi(dayStem, pillars[i].branch);
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
  let timeline = [];
  let stageOrder = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养'];
  for (let i = 0; i < stageOrder.length; i++) {
    let info = LP_CS_STAGE_MAP[stageOrder[i]];
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
  let currentYear = new Date().getFullYear();
  let age = currentYear - birthYear;
  let currentStage = null;
  let nextStage = null;
  let stageOrder = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养'];

  for (let i = 0; i < stageOrder.length; i++) {
    let info = LP_CS_STAGE_MAP[stageOrder[i]];
    if (!info) continue;
    if (age >= info.ageRange[0] && age <= info.ageRange[1]) {
      currentStage = {stage: stageOrder[i], info: info, age: age};
      if (i + 1 < stageOrder.length) {
        let nextInfo = LP_CS_STAGE_MAP[stageOrder[i + 1]];
        if (nextInfo) nextStage = {stage: stageOrder[i + 1], info: nextInfo};
      }
      break;
    }
  }

  // 也查看当前大运的长生阶段
  let currentDyStage = null;
  let dayun = baziData.dayun || [];
  for (let j = 0; j < dayun.length; j++) {
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

// 10. 年龄段催旺与化解（精细版）
function lpRecommendEnhanceByAge(baziData) {
  let strength = lpGetTenGodStrength(baziData);
  let dayEle = baziData.dayWuxing || ELE[baziData.dayStem];
  let xiEle = baziData.xiEle || '';
  let stages = [];

  // 0-6岁：学龄前——性格培养/健康/早教
  stages.push({
    ageRange: '0-6岁',
    title: '学龄前·性格培养期',
    focus: '性格培养方向、健康注意、早教建议',
    enhance: [
      {target: '文昌星（早教启蒙）', method: '书桌朝喜用方位，摆放四支毛笔；亲子阅读每日30分钟；播放古典音乐薰陶'},
      {target: '印星（长辈荫庇）', method: '长辈位（西北方）保持整洁明亮；与祖辈多亲近；家中摆放全家福增福荫'},
      {target: '健康基础', method: '按日主五行调理饮食：木——绿色蔬菜，火——红色食物，土——黄色食物，金——白色食物，水——黑色食物'}
    ],
    remedy: [
      {target: '比劫过旺（争抢好胜）', method: strength.biJian + strength.jieCai >= 4 ? '比劫偏旺，宜培养分享意识；通过合作游戏教导谦让' : '比劫平和，正常引导即可'},
      {target: '伤官过旺（多动叛逆）', method: strength.shangGuan >= 4 ? '伤官偏旺，宜引导转化为才艺特长；多做创造性手工活动' : '伤官不旺，无需特别化解'}
    ],
    ageGuidance: {
      character: '培养安全感与自信心，多鼓励少批评；建立规律作息',
      health: '注意营养均衡，按时接种疫苗；防意外磕碰；木日主注意肝胆，火日主注意心血管，土日主注意脾胃，金日主注意呼吸道，水日主注意肾脏',
      earlyEdu: '以游戏为主，培养好奇心与专注力；接触自然；双语薰陶；不宜过早识字算数'
    }
  });

  // 7-12岁：小学——学习习惯/兴趣发现/性格矫正
  stages.push({
    ageRange: '7-12岁',
    title: '小学·习惯养成期',
    focus: '学习习惯养成、兴趣发现、性格矫正',
    enhance: [
      {target: '文昌星（学业）', method: '书桌朝喜用方位，摆放文昌塔；固定学习时间与地点；培养预习复习习惯'},
      {target: '印星（学业保护）', method: '印星代表师长关爱，与老师保持良好沟通；家长检查作业但不过度干预'},
      {target: '兴趣发现', method: '根据日主五行试学：木——音乐书法，火——表演绘画，土——陶艺烹饪，金——棋类乐器，水——游泳科学'}
    ],
    remedy: [
      {target: '伤官过旺（叛逆多动）', method: strength.shangGuan >= 3 ? '伤官偏旺，宜引导转化为才艺特长；参加兴趣班释放能量；佩戴印星五行饰品' : '伤官不旺，正常引导'},
      {target: '比劫过旺（争斗好胜）', method: strength.biJian + strength.jieCai >= 3 ? '比劫偏旺，培养团队协作；教导分享与谦让；参加集体运动' : '比劫平和，正常引导'}
    ],
    ageGuidance: {
      study: '建立每日固定学习时间；培养阅读习惯；数学与语文基础最重要',
      interest: '试学2-3项兴趣班，3个月后筛选保留1-2项长期坚持',
      character: '培养责任感与抗挫能力；教导尊重他人与感恩'
    }
  });

  // 13-15岁：初中——叛逆期/学科选择/青春期心理
  stages.push({
    ageRange: '13-15岁',
    title: '初中·叛逆期应对',
    focus: '叛逆期应对、学科选择、青春期心理',
    enhance: [
      {target: '文昌星（中考）', method: '书桌朝喜用方位；考试前佩戴文昌符；保持充足睡眠提升学习效率'},
      {target: '印星（心理保护）', method: '家长多倾听少说教；尊重孩子隐私；营造和谐家庭氛围'},
      {target: '食伤（才华发展）', method: '鼓励发展特长；参加竞赛获得成就感；用创作表达情绪'}
    ],
    remedy: [
      {target: '伤官见官（与权威冲突）', method: strength.shangGuan >= 2 && strength.zhengGuan >= 2 ? '伤官见官易与老师家长冲突，宜引导表达方式；佩戴印星五行饰品化解' : '无此问题'},
      {target: '比劫过旺（同伴压力）', method: strength.biJian + strength.jieCai >= 3 ? '比劫旺易受同伴影响，关注交友圈；引导结交正能量朋友' : '正常引导'}
    ],
    ageGuidance: {
      rebellion: '理解叛逆是成长必经阶段；给予适度空间与尊重；设立底线但不过度控制',
      subject: '根据成绩与兴趣选择文理方向；食伤旺偏文科/艺术，印星旺偏理科/学术',
      psychology: '关注情绪变化；教导压力管理；必要时寻求心理咨询'
    }
  });

  // 16-18岁：高中——文理分科/备考/压力管理
  stages.push({
    ageRange: '16-18岁',
    title: '高中·备考冲刺期',
    focus: '文理分科、备考策略、压力管理',
    enhance: [
      {target: '文昌星（高考）', method: '书桌朝喜用方位，摆放文昌塔和四支毛笔；考前佩戴文昌符；卧室避免镜子对床'},
      {target: '印星（考试运）', method: '印星旺时利考试；保持充足睡眠；穿喜用五行颜色衣物赴考'},
      {target: '贵人星（升学助力）', method: '查找天乙贵人方位，赴考路线避开凶方；佩戴贵人生肖饰品'}
    ],
    remedy: [
      {target: '伤官过旺（注意力分散）', method: strength.shangGuan >= 3 ? '伤官旺易分心，宜培养专注力；番茄工作法；减少电子产品干扰' : '正常'},
      {target: '七杀攻身（压力过大）', method: strength.qiSha >= 2 ? '七杀旺压力巨大，宜学会减压；运动释放；佩戴食伤五行饰品制杀' : '压力可控'}
    ],
    ageGuidance: {
      division: '印星旺者偏理科/学术；食伤旺者偏文科/创意；官杀旺者适合医科/法学；财星旺者适合商科',
      exam: '制定三轮复习计划；重视基础题；考前模拟训练；保持规律作息',
      stress: '每天运动30分钟；保证6-8小时睡眠；学会深呼吸放松；与朋友家人倾诉'
    }
  });

  // 19-22岁：大学——专业选择/考研vs就业/恋爱观
  stages.push({
    ageRange: '19-22岁',
    title: '大学·专业定型期',
    focus: '专业选择、考研vs就业、恋爱观',
    enhance: [
      {target: '文昌星（深造）', method: '考研者书桌朝喜用方位；图书馆学习为佳；佩戴文昌符'},
      {target: '官杀星（就业起步）', method: '求职者办公桌青龙方摆放龙形摆件；面试穿正官五行颜色；积极参加实习'},
      {target: '桃花星（恋爱）', method: '桃花位摆放粉色水晶；参加社团活动拓展社交圈；培养健康恋爱观'}
    ],
    remedy: [
      {target: '比劫过旺（感情竞争）', method: strength.biJian + strength.jieCai >= 3 ? '比劫旺易有感情竞争对手，宜真诚待人不玩手段' : '正常'},
      {target: '伤官过旺（眼高手低）', method: strength.shangGuan >= 3 ? '伤官旺易好高骜远，宜脚踏实地；从基层做起积累经验' : '正常'}
    ],
    ageGuidance: {
      major: '根据八字十神选专业：正印——学术研究/教育；偏印——技术/医疗；食神——餐饮/艺术；伤官——设计/传媒；正财——金融/会计；偏财——投资/贸易；正官——管理/公务员；七杀——军警/创业',
      gradVsWork: '印星旺利考研深造；食伤旺利直接就业创业；官杀旺利考公考编',
      love: '树立正确恋爱观；以人品为重；学习沟通技巧；不因恋爱影响学业'
    }
  });

  // 23-30岁：职场初期——职业方向/考公考编/创业vs就业/城市选择
  stages.push({
    ageRange: '23-30岁',
    title: '职场初期·方向定位期',
    focus: '职业方向确定、考公考编、创业vs就业、城市选择',
    enhance: [
      {target: '官杀星（事业运）', method: '办公桌青龙方摆放龙形/麒麟摆件；面朝喜用方位办公；穿正官五行颜色衣物'},
      {target: '桃花星（姻缘）', method: '桃花位摆放鲜花（男摆西方，女摆东方）；参加社交活动；穿戴喜用五行颜色增旺魅力'},
      {target: '财星（起步理财）', method: '财位摆放聚宝盆；开始定期储蓄；学习理财知识；小额投资试水'}
    ],
    remedy: [
      {target: '比劫过旺（破财争偶）', method: strength.biJian + strength.jieCai >= 4 ? '比劫旺易破财争偶，理财谨慎感情专一；佩戴食伤五行饰品化解' : '正常经营'},
      {target: '伤官见官（职场是非）', method: strength.shangGuan >= 2 && strength.zhengGuan >= 2 ? '伤官见官易惹是非，低调做人谨言慎行；佩戴印星五行饰品化解' : '无此患'}
    ],
    ageGuidance: {
      career: '正官格/正印格——考公考编国央企；七杀格/食伤生财——创业或私企；偏财/偏印——自由职业',
      city: '选择喜用神方位城市发展：木——东方，火——南方，土——中央，金——西方，水——北方',
      startup: '创业vs就业：七杀旺/食伤生财/偏财旺适合创业；正官正印旺适合就业；先就业再创业更稳'
    }
  });

  // 31-40岁：职场上升期——晋升/跳槽/合伙/投资
  stages.push({
    ageRange: '31-40岁',
    title: '职场上升期·事业黄金期',
    focus: '晋升策略、跳槽时机、合伙人选择、投资理财',
    enhance: [
      {target: '天乙贵人（升迁助力）', method: '办公桌朝天乙贵人方位；佩戴天乙贵人符或贵人生肖饰品；维护上级关系'},
      {target: '财星（正财偏财）', method: '财位摆放聚宝盆或貔貅；办公桌明堂开阔利纳财；投资选喜用五行行业'},
      {target: '夫妻宫（家庭稳定）', method: '夫妻宫位保持整洁；卧室避免镜子对床；选择喜用五行颜色床品'}
    ],
    remedy: [
      {target: '劫财夺财（投资失利）', method: strength.jieCai >= 2 ? '劫财旺易破财，投资宜稳健忌投机；大额支出深思熟虑；佩戴印星五行饰品护财' : '正常理财'},
      {target: '七杀攻身（压力过大）', method: strength.qiSha >= 2 ? '七杀旺压力大，学会减压；佩戴食伤五行饰品制杀或印星五行饰品化杀' : '压力可控'}
    ],
    ageGuidance: {
      promotion: '官杀旺者利晋升；食伤旺者靠业绩说话；印星旺者靠资历与人际；财星旺者靠业绩与资源',
      jobHop: '跳槽最佳时机：大运走到官杀运或财星运时；避免在劫财运跳槽',
      partner: '合伙人五行互补（日主木找水/火）；避免日主相冲（甲庚/乙辛等）；劫财旺者宜独资',
      invest: '食伤生财大运利投资；劫财大运忌大额投资；分散投资降低风险'
    }
  });

  // 41-55岁：中年期——事业巩固/健康/子女教育/父母赡养
  stages.push({
    ageRange: '41-55岁',
    title: '中年期·事业巩固期',
    focus: '事业巩固、健康管理、子女教育、父母赡养',
    enhance: [
      {target: '财星（财富积累）', method: '财位摆放聚宝盆/貔貅；多元化资产配置；投资组合稳健为主'},
      {target: '印星（传承荫庇）', method: '家中文昌位保持明亮；传承经验给后辈；以德聚人广结善缘'},
      {target: '官杀星（事业巩固）', method: '办公环境整洁有序；维护核心人脉；培养接班人团队'}
    ],
    remedy: [
      {target: '财星过旺（身弱不担财）', method: strength.zhengCai + strength.pianCai >= 4 ? '财旺身弱需注意健康，不可为财透支；佩戴比劫五行饰品助身' : '正常'},
      {target: '官杀过旺（压力过载）', method: strength.qiSha >= 3 ? '官杀旺压力过载，学会放权减压；培养接班人；佩戴印星五行饰品化杀' : '压力可控'}
    ],
    ageGuidance: {
      career: '稳守成果为主，不宜大幅转型；培养接班人；考虑事业传承',
      health: '每年全面体检；关注三高与心血管；注意更年期调理；坚持规律运动',
      children: '根据子女八字引导发展方向；以身作则；给予适度空间与支持',
      parents: '关注父母健康；定期陪伴；提前规划赡养安排'
    }
  });

  // 56岁以上：老年期——退休规划/养生/精神寄托/遗产
  stages.push({
    ageRange: '56岁以上',
    title: '老年期·安享晚年期',
    focus: '退休规划、养生、精神寄托、遗产',
    enhance: [
      {target: '印星（晚年安乐）', method: '印星主晚年福报，宜修身养性、念佛抄经；家中文昌位保持明亮整洁'},
      {target: '健康星（寿元）', method: '根据日主五行调理饮食起居；住宅选择朝向喜用方位；卧室避免横梁压顶'},
      {target: '精神寄托', method: '发展恬淡兴趣如书画、园艺、太极；参加社区活动；传承人生智慧'}
    ],
    remedy: [
      {target: '衰病死墓运（体力下降）', method: '结合当前长生阶段调理；病/死/墓阶段尤须注意体检，每半年一次全面检查'},
      {target: '财星过旺（贪财伤身）', method: strength.zhengCai + strength.pianCai >= 4 ? '财旺身弱晚年辛苦，宜放下对物质的执着，注重精神修养' : '适度理财即可'}
    ],
    ageGuidance: {
      retirement: '提前规划退休财务；确保养老金充足；发展退休后兴趣爱好',
      health: '每半年体检；关注慢性病管理；饮食清淡少油盐；适度运动如太极散步',
      spiritual: '信仰与修行；念佛/打坐/抄经；阅读经典哲学；参与社区志愿服务',
      legacy: '提前安排遗产规划；立遗嘱避免家庭纠纷；传承人生智慧给后辈'
    }
  });

  return stages;
}

// 11. 健康注意事项
function lpRecommendHealth(baziData) {
  let dayEle = baziData.dayWuxing || ELE[baziData.dayStem];
  let healthInfo = LP_HEALTH_MAP[dayEle] || {};
  let stages = lpCalcChangshengStages(baziData);
  let dayun = baziData.dayun || [];

  // 查看当前和未来大运的长生阶段，判断健康风险期
  let riskPeriods = [];
  let currentYear = new Date().getFullYear();
  let birthYear = baziData.pillars && baziData.pillars[0] ? null : null; // not directly available, use dayun
  for (let i = 0; i < dayun.length; i++) {
    let dy = dayun[i];
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
  let keMap = {'木':'土','土':'水','水':'火','火':'金','金':'木'};
  let shengMap = {'木':'火','火':'土','土':'金','金':'水','水':'木'};
  let keBy = '';
  let shengBy = '';
  for (let k in keMap) { if (keMap[k] === dayEle) { keBy = k; break; } }
  for (let s in shengMap) { if (shengMap[s] === dayEle) { shengBy = s; break; } }

  let extraTips = [];
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
  let strength = lpGetTenGodStrength(baziData);
  let dayEle = baziData.dayWuxing || ELE[baziData.dayStem];
  let xiEle = baziData.xiEle || '';
  let dayun = baziData.dayun || [];
  let result = {
    government: null,    // 考公考编
    soe: null,           // 国央企
    startup: null,       // 创业
    partnership: null    // 合伙
  };

  // 考公考编：正官+正印组合
  let govScore = 0;
  let govReasons = [];
  if (strength.zhengGuan >= 2) { govScore += 3; govReasons.push('正官星有力，主端正守纪，天生适合体制内'); }
  if (strength.zhengYin >= 2) { govScore += 3; govReasons.push('正印星有力，主学业根基扎实，考试运佳'); }
  if (lpHasShensha(baziData, '天乙')) { govScore += 2; govReasons.push('命带天乙贵人，仕途多有贵人提携'); }
  if (lpHasShensha(baziData, '文昌')) { govScore += 1; govReasons.push('命带文昌，利于考试竞考'); }
  if (strength.shangGuan >= 2) { govScore -= 1; govReasons.push('伤官见官，体制内容易口舌是非，需注意收敛'); }
  if (strength.biJian + strength.jieCai >= 4) { govScore -= 1; govReasons.push('比劫过旺，竞争压力大需多加努力'); }

  let govDirections = LP_CITY_MAP[xiEle] ? LP_CITY_MAP[xiEle].direction : '喜用方位';
  result.government = {
    suitable: govScore >= 3,
    score: govScore,
    reasons: govReasons,
    advice: govScore >= 3 ? '命局组合利考公考编，建议认真备考。重点方向：' + govDirections + '地区岗位竞争相对小。备考期间书桌朝' + govDirections + '。' : '命局考公意愿一般，如决心考公需加倍努力，可考虑基层岗位起步。',
    direction: govDirections,
    bestYears: lpFindDayunByShen(dayun, baziData.dayStem, ['正官', '七杀', '正印'])
  };

  // 国央企：正官+正财
  let soeScore = 0;
  let soeReasons = [];
  if (strength.zhengGuan >= 2) { soeScore += 2; soeReasons.push('正官有力，适合有体制保障的大型企业'); }
  if (strength.zhengCai >= 2) { soeScore += 2; soeReasons.push('正财有力，主稳定收入，适合国企薪酬体系'); }
  if (strength.zhengYin >= 2) { soeScore += 1; soeReasons.push('正印护身，企业内易获上级赏识'); }
  if (strength.qiSha >= 3) { soeScore -= 1; soeReasons.push('七杀偏旺，国企约束感强需适应'); }

  let soeIndustries = [];
  let soeEleMap = {
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
  let startupScore = 0;
  let startupReasons = [];
  if (strength.qiSha >= 2) { startupScore += 3; startupReasons.push('七杀有力，主果敢冒险，创业魄力十足'); }
  if (strength.shiShen >= 2 || strength.shangGuan >= 2) { startupScore += 2; startupReasons.push('食伤有力，主创意与执行力，善于开拓'); }
  if (strength.pianCai >= 2) { startupScore += 2; startupReasons.push('偏财有力，主偏门财路，适合非传统行业创业'); }
  if (strength.biJian >= 2) { startupScore += 1; startupReasons.push('比肩助力，创业有同道中人支持'); }
  if (strength.jieCai >= 3) { startupScore -= 2; startupReasons.push('劫财过旺，合伙创业易被骗，宜独资'); }
  if (strength.zhengGuan >= 4) { startupScore -= 1; startupReasons.push('正官过旺，性格偏保守，创业需突破舒适区'); }

  let startupIndustries = [];
  let startupEleMap = {
    '木': ['教育培训', '文化出版', '中医养生', '园林景观', '环保科技'],
    '火': ['互联网/科技', '传媒影视', '餐饮连锁', '新能源', '直播电商'],
    '土': ['建筑工程', '房地产开发', '农产品', '仓储物流', '矿业'],
    '金': ['金融科技', '机械制造', '珠宝首饰', '汽车服务', '法律服务'],
    '水': ['跨境电商', '旅游平台', '心理咨询', '水产养殖', '物流配送']
  };
  startupIndustries = startupEleMap[xiEle] || startupEleMap[dayEle] || [];

  // 创业时机：食伤生财的大运
  let startupYears = [];
  for (let si = 0; si < dayun.length; si++) {
    let dy = dayun[si];
    let dyGanShen = dy.ganShen || '';
    let dyZhiShen = dy.zhiShen || '';
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
  let partnerInfo = LP_PARTNER_MAP[dayEle] || {best: [], ok: [], avoid: [], reason: ''};
  let partnerWarnings = [];
  if (strength.biJian + strength.jieCai >= 4) {
    partnerWarnings.push('比劫过旺，合伙易生争执分赃不均，建议独资或绝对控股');
  }
  if (strength.jieCai >= 3) {
    partnerWarnings.push('劫财偏旺，合伙需防被骗，重要财务条款必须白纸黑字写清楚');
  }
  if (strength.shangGuan >= 3) {
    partnerWarnings.push('伤官偏旺，合伙中容易因言语得罪人，需注意沟通方式');
  }

  // 自由职业：偏财+偏印+伤官
  let freelanceScore = 0;
  let freelanceReasons = [];
  if (strength.pianCai >= 2) { freelanceScore += 2; freelanceReasons.push('偏财有力，主不规则财路，适合自由职业收入模式'); }
  if (strength.pianYin >= 2) { freelanceScore += 2; freelanceReasons.push('偏印有力，主非传统思维，适合独立创作与咨询'); }
  if (strength.shangGuan >= 2) { freelanceScore += 2; freelanceReasons.push('伤官有力，主才华横溢，适合自由创作与技术服务'); }
  if (strength.biJian + strength.jieCai <= 2) { freelanceScore += 1; freelanceReasons.push('比劫不旺，独立工作更高效，不受团队拖累'); }
  if (strength.zhengGuan >= 4) { freelanceScore -= 1; freelanceReasons.push('正官偏旺，性格偏守规矩，自由职业需突破安逸心态'); }
  let freelanceIndustries = [];
  let freelanceEleMap = {
    '木': ['自由撰稿人', '独立设计师', '中医顾问', '心理咨询师', '园艺师'],
    '火': ['自媒体博主', '独立摄影师', '主播', '设计工作室', '培训机构独立讲师'],
    '土': ['独立房产经纪', '农业合作社', '手工艺人', '独立造价师', '仓储顾问'],
    '金': ['独立律师', '金融顾问', '独立审计师', '珠宝设计师', '机械技术顾问'],
    '水': ['跨境电商卖家', '独立导游', '心理咨询师', '水产养殖', '物流顾问']
  };
  freelanceIndustries = freelanceEleMap[xiEle] || freelanceEleMap[dayEle] || [];
  result.freelance = {
    suitable: freelanceScore >= 3,
    score: freelanceScore,
    reasons: freelanceReasons,
    industries: freelanceIndustries,
    advice: freelanceScore >= 3 ? '命局适合自由职业，推荐方向：' + freelanceIndustries.slice(0, 3).join('、') + '。自由职业需自律，建议先积累行业资源再独立。' : '自由职业适配度一般，建议先在平台积累经验与人脉。'
  };

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
