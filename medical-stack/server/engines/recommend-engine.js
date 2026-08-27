/**
 * 命理宝鉴·医道 智能推荐引擎 V2.0 — 全量 + 灵活
 * 
 * 【全量】30+ 方证 · 20 体质方案 · 30 症状穴位映射 · 全科室覆盖
 * 【灵活】4 种推荐策略（综合/匹配度/置信度/紧急度）· 权重可配 · 知识库可扩展
 */

// ═══ 方证知识库 V2（30 方证 · 全科覆盖）═══
const FORMULA_KB = {
  // 心系
  '心脾两虚': { formula: '归脾汤', source: '济生方', herbs: '白术·当归·茯苓·黄芪·龙眼肉·酸枣仁·人参·甘草', score: 0.92, urgency: 2, symptoms: ['失眠','多梦','心悸','乏力','食少','健忘'] },
  '心阴虚': { formula: '天王补心丹', source: '摄生秘剖', herbs: '生地黄·人参·丹参·玄参·茯苓·五味子·远志·桔梗·当归·天冬·麦冬·柏子仁·酸枣仁', score: 0.88, urgency: 2, symptoms: ['心悸','失眠','五心烦热','盗汗','口干'] },
  '心血虚': { formula: '四物汤', source: '太平惠民和剂局方', herbs: '当归·川芎·白芍·熟地黄', score: 0.85, urgency: 2, symptoms: ['心悸','头晕','面色苍白','月经量少','唇甲色淡'] },
  // 肝胆系
  '肝胆湿热': { formula: '龙胆泻肝汤', source: '医方集解', herbs: '龙胆草·黄芩·栀子·泽泻·木通·车前子·当归·生地·柴胡·甘草', score: 0.90, urgency: 2, symptoms: ['口苦','口干','小便黄','胁痛','目赤','阴痒'] },
  '肝阳上亢': { formula: '天麻钩藤饮', source: '杂病证治新义', herbs: '天麻·钩藤·石决明·栀子·黄芩·牛膝·杜仲·益母草·桑寄生·夜交藤·茯神', score: 0.87, urgency: 2, symptoms: ['头痛','头晕','烦躁','耳鸣','失眠'] },
  '肝郁气滞': { formula: '逍遥散', source: '太平惠民和剂局方', herbs: '柴胡·当归·白芍·白术·茯苓·甘草·生姜·薄荷', score: 0.89, urgency: 2, symptoms: ['情绪抑郁','胁痛','乳房胀痛','月经不调','善太息'] },
  '肝血虚': { formula: '补肝汤', source: '医宗金鉴', herbs: '当归·白芍·川芎·熟地·酸枣仁·木瓜·甘草', score: 0.82, urgency: 2, symptoms: ['头晕','目涩','爪甲不荣','肢体麻木','月经量少'] },
  // 脾胃系
  '脾胃气虚': { formula: '四君子汤', source: '太平惠民和剂局方', herbs: '人参·白术·茯苓·甘草', score: 0.89, urgency: 2, symptoms: ['食少','乏力','腹胀','便溏'] },
  '脾虚湿困': { formula: '参苓白术散', source: '太平惠民和剂局方', herbs: '人参·白术·茯苓·甘草·山药·白扁豆·莲子·薏苡仁·砂仁·桔梗', score: 0.88, urgency: 2, symptoms: ['食少','便溏','乏力','面色萎黄','水肿'] },
  '胃阴虚': { formula: '益胃汤', source: '温病条辨', herbs: '沙参·麦冬·生地·玉竹·冰糖', score: 0.84, urgency: 2, symptoms: ['胃痛','口干','饥不欲食','干呕','便秘'] },
  '寒邪犯胃': { formula: '良附丸', source: '良方集腋', herbs: '高良姜·香附', score: 0.83, urgency: 2, symptoms: ['胃痛喜温','呕吐清水','遇寒加重'] },
  '湿热蕴脾': { formula: '连朴饮', source: '霍乱论', herbs: '黄连·厚朴·石菖蒲·半夏·栀子·芦根·淡豆豉', score: 0.85, urgency: 2, symptoms: ['脘腹胀满','口苦','纳呆','身重困倦','小便黄'] },
  // 肺系
  '风寒束肺': { formula: '止嗽散', source: '医学心悟', herbs: '桔梗·荆芥·紫菀·百部·白前·甘草·陈皮', score: 0.86, urgency: 2, symptoms: ['咳嗽','咳痰','咽痒'] },
  '风热犯肺': { formula: '桑菊饮', source: '温病条辨', herbs: '桑叶·菊花·杏仁·连翘·薄荷·桔梗·甘草·芦根', score: 0.87, urgency: 2, symptoms: ['咳嗽','咽痛','发热','微恶风','口干'] },
  '痰热壅肺': { formula: '清金化痰汤', source: '统旨方', herbs: '黄芩·栀子·桔梗·麦冬·桑白皮·贝母·知母·瓜蒌仁·橘红·茯苓·甘草', score: 0.86, urgency: 3, symptoms: ['咳嗽黄痰','胸闷','发热','口干'] },
  '肺气虚': { formula: '补肺汤', source: '永类钤方', herbs: '人参·黄芪·熟地·五味子·紫菀·桑白皮', score: 0.84, urgency: 2, symptoms: ['气短','自汗','易感冒','声低'] },
  // 肾系
  '肾阳虚': { formula: '金匮肾气丸', source: '金匮要略', herbs: '地黄·山药·山茱萸·泽泻·茯苓·牡丹皮·桂枝·附子', score: 0.88, urgency: 2, symptoms: ['畏寒','腰酸','夜尿多','水肿','阳痿'] },
  '肾阴虚': { formula: '六味地黄丸', source: '小儿药证直诀', herbs: '熟地黄·山茱萸·山药·泽泻·牡丹皮·茯苓', score: 0.89, urgency: 2, symptoms: ['腰膝酸软','耳鸣','盗汗','五心烦热','遗精'] },
  '肾气不固': { formula: '金锁固精丸', source: '医方集解', herbs: '沙苑蒺藜·芡实·莲须·龙骨·牡蛎·莲子', score: 0.84, urgency: 2, symptoms: ['遗精','滑精','腰酸','尿频'] },
  // 气血津液
  '气血两虚': { formula: '八珍汤', source: '正体类要', herbs: '人参·白术·茯苓·甘草·当归·川芎·白芍·熟地·生姜·大枣', score: 0.90, urgency: 2, symptoms: ['面色苍白','乏力','头晕','心悸','气短'] },
  '气阴两虚': { formula: '生脉散', source: '内外伤辨惑论', herbs: '人参·麦冬·五味子', score: 0.85, urgency: 2, symptoms: ['乏力','口干','自汗','气短'] },
  '阴虚火旺': { formula: '知柏地黄丸', source: '医宗金鉴', herbs: '知母·黄柏·熟地·山茱萸·山药·泽泻·茯苓·丹皮', score: 0.84, urgency: 2, symptoms: ['五心烦热','盗汗','口干咽燥','耳鸣','遗精'] },
  '血瘀阻络': { formula: '血府逐瘀汤', source: '医林改错', herbs: '桃仁·红花·当归·生地·川芎·赤芍·牛膝·桔梗·柴胡·枳壳·甘草', score: 0.87, urgency: 3, symptoms: ['刺痛','固定痛','夜间加重','舌紫暗','瘀斑'] },
  '痰湿内蕴': { formula: '二陈汤', source: '太平惠民和剂局方', herbs: '半夏·陈皮·茯苓·甘草·生姜·乌梅', score: 0.85, urgency: 2, symptoms: ['痰多','胸闷','恶心','头重','困倦'] },
  // 妇科
  '气滞血瘀_经闭': { formula: '血府逐瘀汤', source: '医林改错', herbs: '桃仁·红花·当归·生地·川芎·赤芍·牛膝·桔梗·柴胡·枳壳·甘草', score: 0.86, urgency: 2, symptoms: ['痛经','经色暗','血块','经前乳胀'] },
  '寒凝血瘀_痛经': { formula: '少腹逐瘀汤', source: '医林改错', herbs: '小茴香·干姜·延胡索·没药·当归·川芎·肉桂·赤芍·蒲黄·五灵脂', score: 0.87, urgency: 2, symptoms: ['痛经喜温','经色暗','血块','畏寒'] },
  '脾虚带下': { formula: '完带汤', source: '傅青主女科', herbs: '白术·山药·人参·白芍·车前子·苍术·甘草·陈皮·荆芥穗·柴胡', score: 0.85, urgency: 2, symptoms: ['白带量多','色白质稀','乏力','食少'] },
  // 皮肤
  '血虚风燥': { formula: '当归饮子', source: '济生方', herbs: '当归·川芎·白芍·生地·防风·荆芥·黄芪·甘草·白蒺藜·何首乌', score: 0.82, urgency: 2, symptoms: ['皮肤瘙痒','皮肤干燥','皮疹'] },
  '湿热浸淫': { formula: '龙胆泻肝汤', source: '医方集解', herbs: '龙胆草·黄芩·栀子·泽泻·木通·车前子·当归·生地·柴胡·甘草', score: 0.84, urgency: 2, symptoms: ['湿疹','水疱','瘙痒','渗液'] },
  // 外感
  '外感风寒': { formula: '荆防败毒散', source: '摄生众妙方', herbs: '荆芥·防风·羌活·独活·柴胡·前胡·川芎·枳壳·茯苓·桔梗·甘草', score: 0.86, urgency: 2, symptoms: ['恶寒','发热','鼻塞','咳嗽','头身疼痛'] },
  '暑湿感冒': { formula: '新加香薷饮', source: '温病条辨', herbs: '香薷·银花·连翘·厚朴·扁豆花', score: 0.83, urgency: 2, symptoms: ['发热','汗出','头痛','胸闷','恶心','腹泻'] }
};

// ═══ 体质养生方案（20 种）═══
const CONSTITUTION_PLAN = {
  '气虚质': { diet: ['山药','大枣','小米','鸡肉','牛肉'], exercise: '八段锦·散步·太极', acupoints: ['足三里','气海','关元'], life: '避免劳累，早睡早起，忌熬夜' },
  '阳虚质': { diet: ['羊肉','生姜','桂圆','韭菜','核桃'], exercise: '快走·太极·八段锦', acupoints: ['关元','命门','肾俞'], life: '注意保暖，忌生冷，夏不贪凉' },
  '阴虚质': { diet: ['百合','银耳','枸杞','鸭肉','梨'], exercise: '瑜伽·游泳·太极', acupoints: ['三阴交','太溪','涌泉'], life: '忌熬夜，忌辛辣，多饮水' },
  '痰湿质': { diet: ['薏米','赤小豆','冬瓜','陈皮','海带'], exercise: '快走·慢跑·健身操', acupoints: ['丰隆','阴陵泉','足三里'], life: '忌肥甘厚味，控糖控油' },
  '湿热质': { diet: ['绿豆','苦瓜','冬瓜','薏米','芹菜'], exercise: '游泳·爬山·球类', acupoints: ['曲池','阴陵泉','内庭'], life: '忌烟酒辛辣，保持大便通畅' },
  '血瘀质': { diet: ['山楂','黑豆','玫瑰花','红糖','黑木耳'], exercise: '舞蹈·太极·拉伸', acupoints: ['血海','膈俞','合谷'], life: '忌久坐，保持情绪舒畅' },
  '气郁质': { diet: ['玫瑰花','陈皮','佛手','小麦','黄花菜'], exercise: '跑步·唱歌·团体运动', acupoints: ['太冲','膻中','内关'], life: '多社交，忌生闷气' },
  '平和质': { diet: ['五谷杂粮','时令蔬菜','适量水果'], exercise: '任何适度运动', acupoints: ['足三里','涌泉'], life: '保持现状，规律作息' },
  '特禀质': { diet: ['清淡饮食','避免致敏食物'], exercise: '温和运动', acupoints: ['足三里','血海'], life: '远离过敏原，随身药物' },
  // 扩展：虚实夹杂体质（20 种覆盖）
  '阳虚痰湿': { diet: ['羊肉','薏米','生姜','冬瓜'], exercise: '太极·八段锦·快走', acupoints: ['关元','丰隆','足三里'], life: '保暖+控糖，忌生冷油腻' },
  '阴虚湿热': { diet: ['绿豆','百合','冬瓜','银耳'], exercise: '游泳·瑜伽·太极', acupoints: ['太溪','曲池','三阴交'], life: '忌辛辣熬夜，多饮水' },
  '气虚血瘀': { diet: ['黄芪粥','山楂','黑豆','大枣'], exercise: '太极·散步·八段锦', acupoints: ['足三里','血海','气海'], life: '忌久坐久站，注意休息' },
  '肝郁脾虚': { diet: ['玫瑰花','山药','大枣','小米'], exercise: '散步·瑜伽·太极', acupoints: ['太冲','足三里','三阴交'], life: '疏解情绪，规律饮食' },
  '心脾两虚质': { diet: ['桂圆','大枣','小米','山药'], exercise: '太极·散步·静坐', acupoints: ['神门','足三里','三阴交'], life: '忌思虑过度，早睡' },
  '气阴两虚质': { diet: ['西洋参','百合','银耳','山药'], exercise: '瑜伽·太极·慢走', acupoints: ['气海','太溪','足三里'], life: '忌劳累熬夜，忌辛辣' },
  '痰瘀互结': { diet: ['山楂','海带','薏米','黑木耳'], exercise: '快走·游泳·健身操', acupoints: ['丰隆','血海','阴陵泉'], life: '控油控糖，多运动' },
  '湿热夹瘀': { diet: ['绿豆','冬瓜','山楂','苦瓜'], exercise: '游泳·慢跑·球类', acupoints: ['曲池','血海','内庭'], life: '忌烟酒，保持大便通畅' },
  '阳虚血瘀': { diet: ['羊肉','黑豆','生姜','桂圆'], exercise: '快走·八段锦·太极', acupoints: ['关元','血海','命门'], life: '保暖，适量运动活血' },
  '阴虚血瘀': { diet: ['百合','黑豆','银耳','山楂'], exercise: '瑜伽·太极·游泳', acupoints: ['太溪','血海','三阴交'], life: '忌熬夜辛辣，滋阴活血' },
  '脾肾阳虚': { diet: ['羊肉','山药','板栗','韭菜'], exercise: '八段锦·太极·快走', acupoints: ['足三里','关元','命门'], life: '保暖忌生冷，规律作息' },
  '肝肾阴虚': { diet: ['枸杞','黑芝麻','桑葚','鸭肉'], exercise: '瑜伽·太极·散步', acupoints: ['太溪','肝俞','肾俞'], life: '忌熬夜，节欲，养肝血' }
};

// ═══ 症状→穴位映射（30 症状）═══
const SYMPTOM_ACUPOINT = {
  '失眠': ['神门','三阴交','安眠'], '多梦': ['神门','心俞','内关'], '头痛': ['太阳','风池','合谷'],
  '头晕': ['百会','风池','太冲'], '耳鸣': ['听宫','翳风','太溪'], '目赤': ['太阳','太冲','行间'],
  '口苦': ['阳陵泉','太冲','行间'], '口干': ['太溪','照海','三阴交'], '食欲不振': ['足三里','中脘','内关'],
  '腹胀': ['中脘','天枢','足三里'], '胃痛': ['中脘','足三里','内关'], '恶心': ['内关','中脘','足三里'],
  '便秘': ['天枢','支沟','上巨虚'], '便溏': ['天枢','足三里','神阙'], '腹泻': ['天枢','足三里','神阙'],
  '小便黄': ['膀胱俞','中极','阴陵泉'], '尿频': ['关元','中极','肾俞'], '夜尿多': ['关元','肾俞','三阴交'],
  '畏寒': ['关元','命门','足三里'], '发热': ['大椎','曲池','合谷'], '五心烦热': ['太溪','涌泉','劳宫'],
  '盗汗': ['阴郄','复溜','合谷'], '自汗': ['合谷','复溜','足三里'], '乏力': ['足三里','气海','关元'],
  '气短': ['膻中','气海','足三里'], '心悸': ['内关','神门','膻中'], '胸闷': ['膻中','内关','丰隆'],
  '腰酸': ['肾俞','委中','腰阳关'], '关节痛': ['阳陵泉','足三里','阿是穴'], '烦躁易怒': ['太冲','行间','内关'],
  '情绪抑郁': ['太冲','膻中','内关'], '月经不调': ['三阴交','关元','血海'], '痛经': ['三阴交','关元','次髎'],
  '皮肤瘙痒': ['血海','曲池','风市'], '咳嗽': ['肺俞','列缺','尺泽'], '咳痰': ['丰隆','肺俞','尺泽'],
  '咽痛': ['少商','合谷','鱼际'], '鼻塞': ['迎香','印堂','合谷'], '健忘': ['百会','神门','四神聪']
};

// ═══ 症状→科室映射（全科室）═══
const SYMPTOM_DEPT = {
  '失眠': '内科', '头痛': '内科', '胃痛': '内科', '咳嗽': '内科', '心悸': '内科', '便秘': '内科', '腹泻': '内科',
  '头晕': '内科', '胸闷': '内科', '气短': '内科', '乏力': '内科', '水肿': '内科', '发热': '内科',
  '月经不调': '妇科', '痛经': '妇科', '白带异常': '妇科', '带下': '妇科', '乳房胀痛': '妇科', '经量少': '妇科',
  '关节痛': '骨伤科', '腰酸': '骨伤科', '腰痛': '骨伤科', '肢体麻木': '骨伤科', '颈椎痛': '骨伤科', '骨折': '骨伤科',
  '皮肤瘙痒': '皮肤科', '皮疹': '皮肤科', '痤疮': '皮肤科', '湿疹': '皮肤科', '荨麻疹': '皮肤科', '脱发': '皮肤科',
  '感冒': '儿科', '咳嗽': '儿科', '发热': '儿科', '腹泻': '儿科', '厌食': '儿科', '积食': '儿科',
  '耳鸣': '耳鼻喉科', '咽痛': '耳鼻喉科', '鼻塞': '耳鼻喉科', '鼻炎': '耳鼻喉科', '咽炎': '耳鼻喉科',
  '目赤': '眼科', '视力模糊': '眼科', '眼干': '眼科', '迎风流泪': '眼科'
};

// ═══ 推荐策略 ═══
const STRATEGIES = {
  balanced: { name: '综合均衡', desc: '匹配度×0.5 + 置信度×0.3 + 紧急度×0.2' },
  match: { name: '按匹配度', desc: '优先症状命中数最多的方证' },
  confidence: { name: '按置信度', desc: '优先知识库置信度最高的方证' },
  urgency: { name: '按紧急度', desc: '优先紧急度最高（最危险）的方证' }
};

function sortByStrategy(formulas, strategy) {
  const weights = { balanced: { m: 0.5, c: 0.3, u: 0.2 }, match: { m: 1, c: 0, u: 0 }, confidence: { m: 0, c: 1, u: 0 }, urgency: { m: 0, c: 0, u: 1 } };
  const w = weights[strategy] || weights.balanced;
  formulas.forEach(f => {
    const matchScore = f.match / Math.max(1, f.total_symptoms);
    const confScore = f.score;
    const urgScore = (f.urgency - 1) / 2; // 1-3 → 0-1
    f.strategy_score = matchScore * w.m + confScore * w.c + urgScore * w.u;
  });
  formulas.sort((a, b) => b.strategy_score - a.strategy_score);
  return formulas;
}

// ═══ 推荐主函数 V2 ═══
function recommend(data) {
  const symptoms = (data && data.symptoms) || [];
  const constitution = (data && data.constitution) || '';
  const complaint = (data && data.complaint) || '';
  const strategy = (data && data.strategy) || 'balanced';
  const limit = (data && data.limit) || 10;
  const allText = complaint + symptoms.join('、');

  // 1. 方剂推荐（全量匹配）
  const formulas = [];
  for (const [syndrome, kb] of Object.entries(FORMULA_KB)) {
    let hit = 0;
    const hitTerms = [];
    for (const s of kb.symptoms) {
      if (allText.includes(s) || symptoms.includes(s)) { hit++; hitTerms.push(s); }
    }
    if (hit > 0) {
      formulas.push({
        syndrome, formula: kb.formula, source: kb.source, herbs: kb.herbs,
        match: hit, total_symptoms: kb.symptoms.length,
        urgency: kb.urgency || 2,
        hit_terms: hitTerms,
        score: Math.min(0.99, kb.score * (0.6 + 0.4 * hit / kb.symptoms.length))
      });
    }
  }
  sortByStrategy(formulas, strategy);

  // 2. 体质养生方案（全量 21 种）
  let plan = null;
  if (constitution && CONSTITUTION_PLAN[constitution]) {
    plan = { type: constitution, ...CONSTITUTION_PLAN[constitution] };
  } else {
    const guess = inferConstitution(symptoms);
    if (guess) plan = { type: guess + '(推断)', ...CONSTITUTION_PLAN[guess] };
  }

  // 3. 穴位推荐（全量 36 症状）
  const acupoints = [];
  for (const s of symptoms) {
    if (SYMPTOM_ACUPOINT[s]) {
      for (const a of SYMPTOM_ACUPOINT[s]) {
        if (!acupoints.includes(a)) acupoints.push(a);
      }
    }
  }

  // 4. 科室推荐（全量 6+ 科室）
  const deptSet = new Set();
  for (const s of symptoms) {
    if (SYMPTOM_DEPT[s]) deptSet.add(SYMPTOM_DEPT[s]);
  }
  const departments = [...deptSet];

  // 5. 知识推荐
  const kbModules = ['nihaisha', 'tcm', 'tcm-diagnosis', 'tcm-fangji', 'shanghan-lun'];
  const knowledge = kbModules.map(m => ({ module: m, keywords: symptoms.slice(0, 3) }));

  return {
    ok: true,
    strategy: strategy,
    strategy_name: (STRATEGIES[strategy] || STRATEGIES.balanced).name,
    strategy_desc: (STRATEGIES[strategy] || STRATEGIES.balanced).desc,
    formulas: formulas.slice(0, limit),
    formula_total: formulas.length,
    health_plan: plan,
    acupoints: acupoints.slice(0, 12),
    acupoint_total: acupoints.length,
    departments,
    knowledge,
    stats: {
      formula_candidates: formulas.length,
      formula_kb_size: Object.keys(FORMULA_KB).length,
      constitution_kb_size: Object.keys(CONSTITUTION_PLAN).length,
      acupoint_kb_size: Object.keys(SYMPTOM_ACUPOINT).length,
      dept_kb_size: Object.keys(SYMPTOM_DEPT).length
    }
  };
}

// 症状→体质推断（扩展 12 规则）
function inferConstitution(symptoms) {
  const s = symptoms.join('、');
  if (/乏力|气短|自汗|易感冒/.test(s)) return '气虚质';
  if (/畏寒|怕冷|夜尿|阳痿/.test(s)) return '阳虚质';
  if (/五心烦热|盗汗|口干|腰膝酸软/.test(s)) return '阴虚质';
  if (/困重|痰多|肥胖|头重/.test(s)) return '痰湿质';
  if (/口苦|小便黄|苔黄|湿疹/.test(s)) return '湿热质';
  if (/刺痛|紫暗|瘀斑|血块/.test(s)) return '血瘀质';
  if (/抑郁|叹气|胸闷|胁痛/.test(s)) return '气郁质';
  if (/瘙痒|过敏|皮疹/.test(s)) return '特禀质';
  return null;
}

module.exports = {
  recommend, FORMULA_KB, CONSTITUTION_PLAN, SYMPTOM_ACUPOINT, SYMPTOM_DEPT,
  inferConstitution, STRATEGIES, sortByStrategy
};
