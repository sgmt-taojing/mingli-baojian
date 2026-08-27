// gold-cases-v5.js · 黄金 case V5（62 条新增）
// 覆盖稀缺证型 + 补强高频主症
// 来源：中医内科学/中医儿科学教材 + 临床路径指南

module.exports = [
  // ==================== 稀缺证型补强 ====================

  // 风寒袭络 (头痛) — 补充：目前仅 1 条
  { case_id: 'V501', complaint: '头痛', symptoms: ['前额痛','恶风','鼻塞','流清涕'], expected: { syndrome: '风邪头痛', formula: '川芎茶调散' } },

  // 血虚不荣 (头痛) — 补充：目前仅 1 条
  { case_id: 'V502', complaint: '头痛', symptoms: ['头痛','面色苍白','心悸','神疲乏力'], expected: { syndrome: '血虚不荣', formula: '四物汤' } },

  // 肝火犯肺 (咳嗽) — 补充：目前仅 1 条
  { case_id: 'V503', complaint: '咳嗽', symptoms: ['咳嗽','痰中带血','胸胁灼痛','急躁易怒'], expected: { syndrome: '肝火犯肺', formula: '黛蛤散' } },

  // 肺气虚 (咳嗽) — 补充：目前仅 1 条
  { case_id: 'V504', complaint: '咳嗽', symptoms: ['咳嗽','气短','自汗','恶风','易感冒'], expected: { syndrome: '肺气虚', formula: '补肺汤' } },

  // 肾精亏虚 (眩晕) — 补充：目前仅 1 条
  { case_id: 'V505', complaint: '眩晕', symptoms: ['眩晕','耳鸣','腰膝酸软','遗精','须发早白'], expected: { syndrome: '肾精不足', formula: '左归丸' } },

  // 湿热蕴肤 (湿疹) — 补充：目前仅 1 条
  { case_id: 'V506', complaint: '皮肤瘙痒', symptoms: ['皮肤瘙痒','丘疹','流黄水','舌红苔黄腻'], expected: { syndrome: '湿热蕴肤', formula: '龙胆泻肝汤' } },

  // 痰浊闭阻 (胸痹/胸闷) — 补充：目前仅 1 条
  { case_id: 'V507', complaint: '胸闷', symptoms: ['胸闷','痛引肩背','痰多','苔白腻'], expected: { syndrome: '痰浊闭阻', formula: '半夏白术天麻汤' } },

  // 痛痹 (痹证) — 补充：目前仅 1 条
  { case_id: 'V508', complaint: '痹证', symptoms: ['关节疼痛','遇寒加重','痛处固定','舌淡苔白'], expected: { syndrome: '痛痹', formula: '乌头汤' } },

  // 行痹 (痹证) — 补充：目前仅 1 条
  { case_id: 'V509', complaint: '痹证', symptoms: ['关节游走性疼痛','恶风','舌淡苔薄白'], expected: { syndrome: '行痹', formula: '防风汤' } },

  // 着痹 (痹证) — 补充：目前仅 1 条
  { case_id: 'V510', complaint: '痹证', symptoms: ['关节重着','酸痛','肌肤麻木','苔白腻'], expected: { syndrome: '着痹', formula: '薏苡仁汤' } },

  // 热痹 (痹证) — 补充：目前仅 1 条
  { case_id: 'V511', complaint: '痹证', symptoms: ['关节红肿热痛','活动不利','舌红苔黄'], expected: { syndrome: '热痹', formula: '白虎加桂枝汤' } },

  // 肺热津伤 (消渴) — 补充：目前仅 1 条
  { case_id: 'V512', complaint: '消渴', symptoms: ['多饮','多食','多尿','口干舌燥','消瘦'], expected: { syndrome: '肺热津伤', formula: '清燥救肺汤' } },

  // 寒湿困脾 (腹胀) — 补充：目前仅 1 条
  { case_id: 'V513', complaint: '腹胀', symptoms: ['腹胀','纳呆','便溏','苔白腻','肢冷'], expected: { syndrome: '寒湿困脾', formula: '胃苓汤' } },

  // 肝郁气滞 (郁证) — 补充：目前仅 1 条
  { case_id: 'V514', complaint: '郁证', symptoms: ['情绪抑郁','胸胁胀痛','善太息','嗳气'], expected: { syndrome: '肝郁气滞', formula: '柴胡疏肝散' } },

  // 肺卫不固 (汗证) — 补充：目前仅 1 条
  { case_id: 'V515', complaint: '汗证', symptoms: ['自汗','动则加重','易感冒','气短','恶风'], expected: { syndrome: '肺卫不固', formula: '玉屏风散' } },

  // 营卫不和 (汗证) — 补充：目前仅 1 条
  { case_id: 'V516', complaint: '汗证', symptoms: ['恶风','自汗','周身酸楚','舌淡苔白'], expected: { syndrome: '营卫不和', formula: '桂枝汤' } },

  // 肾虚髓亏 (腰痛) — 补充：目前仅 1 条
  { case_id: 'V517', complaint: '腰痛', symptoms: ['腰痛','腰膝酸软','耳鸣','遗精','齿摇'], expected: { syndrome: '肾虚髓亏', formula: '左归丸' } },

  // 风寒袭肺 (咳嗽) — 补充：目前仅 1 条
  { case_id: 'V518', complaint: '咳嗽', symptoms: ['咳嗽','痰白清稀','恶寒','鼻塞','流涕'], expected: { syndrome: '风寒袭肺', formula: '止嗽散' } },

  // 脾不统血 (月经过多) — 补充：目前仅 1 条
  { case_id: 'V519', complaint: '月经不调', symptoms: ['月经量多','色淡质稀','神疲','气短','面色萎黄'], expected: { syndrome: '脾不统血', formula: '归脾汤' } },

  // 气阴两虚 (心悸) — 补充：目前仅 1 条
  { case_id: 'V520', complaint: '心悸', symptoms: ['心悸','气短','口干','神疲','自汗'], expected: { syndrome: '气阴两虚', formula: '生脉散' } },

  // 阴血亏虚 (失眠) — 补充：目前仅 1 条
  { case_id: 'V521', complaint: '失眠', symptoms: ['失眠','多梦','心悸','面色无华','舌淡'], expected: { syndrome: '阴血亏虚', formula: '酸枣仁汤' } },

  // 气血两虚 (眩晕) — 补充：目前仅 1 条
  { case_id: 'V522', complaint: '眩晕', symptoms: ['眩晕','面色苍白','神疲','气短','舌淡'], expected: { syndrome: '气血亏虚', formula: '归脾汤' } },

  // 心脾积热 (口疮) — 补充：目前仅 1 条
  { case_id: 'V523', complaint: '口疮', symptoms: ['口腔溃疡','疼痛','口干','心烦','小便黄'], expected: { syndrome: '心脾积热', formula: '凉膈散' } },

  // ==================== 高频主症补强 ====================

  // 感冒 补强 — 补充 风寒表虚 (桂枝汤)
  { case_id: 'V524', complaint: '感冒', symptoms: ['发热','汗出','恶风','鼻塞','鼻鸣'], expected: { syndrome: '风寒表虚', formula: '桂枝汤' } },

  // 感冒 补强 — 补充 暑湿感冒 (香薷饮)
  { case_id: 'V525', complaint: '感冒', symptoms: ['夏季发病','发热','恶寒','头重','胸闷','苔白腻'], expected: { syndrome: '暑湿感冒', formula: '新加香薷饮' } },

  // 感冒 补强 — 补充 风湿感冒 (羌活胜湿)
  { case_id: 'V526', complaint: '感冒', symptoms: ['恶寒','发热','头重如裹','身重','关节酸痛','苔白腻'], expected: { syndrome: '风湿感冒', formula: '羌活胜湿汤' } },

  // 感冒 补强 — 补充 温燥伤肺 (杏苏散)
  { case_id: 'V527', complaint: '感冒', symptoms: ['秋季发病','干咳少痰','咽干','鼻燥','微发热'], expected: { syndrome: '温燥伤肺', formula: '杏苏散' } },

  // 心悸 补强 — 补充 瘀阻心脉
  { case_id: 'V528', complaint: '心悸', symptoms: ['心悸','胸痛','胸闷','舌紫暗','脉涩'], expected: { syndrome: '瘀阻心脉', formula: '血府逐瘀汤' } },

  // 心悸 补强 — 补充 阴虚火旺
  { case_id: 'V529', complaint: '心悸', symptoms: ['心悸','五心烦热','口干','失眠','盗汗'], expected: { syndrome: '阴虚火旺', formula: '知柏地黄丸' } },

  // 心悸 补强 — 补充 心阳虚
  { case_id: 'V530', complaint: '心悸', symptoms: ['心悸','畏寒肢冷','面色苍白','神疲','舌淡'], expected: { syndrome: '心阳虚', formula: '桂枝甘草龙骨牡蛎汤' } },

  // 心悸 补强 — 补充 气血不足
  { case_id: 'V531', complaint: '心悸', symptoms: ['心悸怔忡','气短','面色苍白','舌淡','脉结代'], expected: { syndrome: '气血不足', formula: '炙甘草汤' } },

  // 胁痛 补强 — 补充 肝郁气滞
  { case_id: 'V532', complaint: '胁痛', symptoms: ['胁肋胀痛','情志抑郁','善太息','嗳气'], expected: { syndrome: '肝郁气滞', formula: '柴胡疏肝散' } },

  // 胁痛 补强 — 补充 瘀血阻络
  { case_id: 'V533', complaint: '胁痛', symptoms: ['胁肋刺痛','痛处固定','舌紫暗','脉涩'], expected: { syndrome: '瘀血阻络', formula: '膈下逐瘀汤' } },

  // 胁痛 补强 — 补充 肝胆湿热
  { case_id: 'V534', complaint: '胁痛', symptoms: ['胁肋胀痛','口苦','尿黄','舌红苔黄腻'], expected: { syndrome: '肝胆湿热', formula: '龙胆泻肝汤' } },

  // 胁痛 补强 — 补充 肝阴不足
  { case_id: 'V535', complaint: '胁痛', symptoms: ['胁肋隐痛','口干','咽燥','舌红少苔'], expected: { syndrome: '肝阴不足', formula: '一贯煎' } },

  // 咳嗽 补强 — 补充 风寒袭肺
  { case_id: 'V536', complaint: '咳嗽', symptoms: ['咳嗽','痰白清稀','恶寒','鼻塞','流清涕','头身疼痛'], expected: { syndrome: '风寒袭肺', formula: '止嗽散' } },

  // 咳嗽 补强 — 补充 痰湿蕴肺
  { case_id: 'V537', complaint: '咳嗽', symptoms: ['咳嗽','痰多白黏','胸闷','纳呆','苔白腻'], expected: { syndrome: '痰湿蕴肺', formula: '二陈汤' } },

  // 咳嗽 补强 — 补充 肝火犯肺
  { case_id: 'V538', complaint: '咳嗽', symptoms: ['咳嗽','痰黄稠','胸胁灼痛','急躁易怒','口苦'], expected: { syndrome: '肝火犯肺', formula: '黛蛤散' } },

  // 咳嗽 补强 — 补充 肺阴亏虚
  { case_id: 'V539', complaint: '咳嗽', symptoms: ['干咳少痰','咽干','潮热','盗汗','舌红少苔'], expected: { syndrome: '肺阴亏虚', formula: '沙参麦冬汤' } },

  // 失眠 补强 — 补充 心脾两虚
  { case_id: 'V540', complaint: '失眠', symptoms: ['失眠','多梦','心悸','纳呆','神疲','面色萎黄'], expected: { syndrome: '心脾两虚', formula: '归脾汤' } },

  // 失眠 补强 — 补充 阴虚火旺
  { case_id: 'V541', complaint: '失眠', symptoms: ['失眠','心烦','五心烦热','口干','盗汗'], expected: { syndrome: '阴虚火旺', formula: '知柏地黄丸' } },

  // 失眠 补强 — 补充 痰热内扰
  { case_id: 'V542', complaint: '失眠', symptoms: ['失眠','痰多','胸闷','心烦','口苦','苔黄腻'], expected: { syndrome: '痰热内扰', formula: '黄连温胆汤' } },

  // 失眠 补强 — 补充 肝郁化火
  { case_id: 'V543', complaint: '失眠', symptoms: ['失眠','急躁易怒','头晕','头痛','面红目赤'], expected: { syndrome: '肝郁化火', formula: '龙胆泻肝汤' } },

  // 头痛 补强 — 补充 瘀血阻络
  { case_id: 'V544', complaint: '头痛', symptoms: ['头痛','刺痛','痛处固定','舌紫暗','脉涩'], expected: { syndrome: '瘀阻心脉', formula: '血府逐瘀汤' } },

  // 头痛 补强 — 补充 痰浊上蒙
  { case_id: 'V545', complaint: '头痛', symptoms: ['头痛','头重','胸闷','恶心','痰多','苔白腻'], expected: { syndrome: '痰浊闭阻', formula: '半夏白术天麻汤' } },

  // 胃痛 补强 — 补充 肝胃不和
  { case_id: 'V546', complaint: '胃痛', symptoms: ['胃脘胀痛','痛连胁肋','嗳气','口苦'], expected: { syndrome: '肝胃不和', formula: '柴胡疏肝散' } },

  // 胃痛 补强 — 补充 脾胃虚寒
  { case_id: 'V547', complaint: '胃痛', symptoms: ['胃脘隐痛','喜温喜按','空腹痛甚','纳差','肢冷'], expected: { syndrome: '脾胃虚寒', formula: '理中丸' } },

  // 胃痛 补强 — 补充 胃阴不足
  { case_id: 'V548', complaint: '胃痛', symptoms: ['胃脘隐痛','口干','饥不欲食','舌红少苔'], expected: { syndrome: '胃阴不足', formula: '益胃汤' } },

  // 胃痛 补强 — 补充 饮食停滞
  { case_id: 'V549', complaint: '胃痛', symptoms: ['胃脘胀痛','嗳腐吞酸','呕吐不消化食物','舌苔厚腻'], expected: { syndrome: '食积停滞', formula: '保和丸' } },

  // 眩晕 补强 — 补充 气血亏虚
  { case_id: 'V550', complaint: '眩晕', symptoms: ['眩晕','面色苍白','神疲','气短','心悸'], expected: { syndrome: '气血亏虚', formula: '归脾汤' } },

  // 眩晕 补强 — 补充 肾精不足
  { case_id: 'V551', complaint: '眩晕', symptoms: ['眩晕','耳鸣','腰膝酸软','遗精','齿摇'], expected: { syndrome: '肾精不足', formula: '左归丸' } },

  // 腰痛 补强 — 补充 肾虚腰痛
  { case_id: 'V552', complaint: '腰痛', symptoms: ['腰痛','酸软','遇劳更甚','卧则减轻','耳鸣'], expected: { syndrome: '肾虚腰痛', formula: '左归丸' } },

  // 腰痛 补强 — 补充 瘀血阻络
  { case_id: 'V553', complaint: '腰痛', symptoms: ['腰痛如刺','痛处固定','俯仰不利','舌紫暗'], expected: { syndrome: '瘀血阻络', formula: '身痛逐瘀汤' } },

  // 便秘 补强 — 补充 冷秘
  { case_id: 'V554', complaint: '便秘', symptoms: ['大便秘结','面色苍白','四肢不温','腹中冷痛','舌淡苔白'], expected: { syndrome: '寒秘', formula: '温脾汤' } },

  // 便秘 补强 — 补充 气秘
  { case_id: 'V555', complaint: '便秘', symptoms: ['大便秘结','嗳气','腹胀','胁肋痞满'], expected: { syndrome: '气秘', formula: '柴胡疏肝散' } },

  // 泄泻 补强 — 补充 食积泄泻
  { case_id: 'V556', complaint: '泄泻', symptoms: ['腹痛泄泻','嗳腐吞酸','泻下臭秽','腹痛即泻'], expected: { syndrome: '食积停滞', formula: '保和丸' } },

  // 泄泻 补强 — 补充 肝郁乘脾
  { case_id: 'V557', complaint: '泄泻', symptoms: ['腹痛即泻','情志不畅时加重','胁痛','嗳气','舌淡红'], expected: { syndrome: '肝郁脾虚', formula: '痛泻要方' } },

  // 汗证 补强 — 补充 阴虚火旺
  { case_id: 'V558', complaint: '汗证', symptoms: ['盗汗','五心烦热','口干','失眠','舌红少苔'], expected: { syndrome: '阴虚火旺', formula: '当归六黄汤' } },

  // 水肿 补强 — 补充 湿热壅滞
  { case_id: 'V559', complaint: '水肿', symptoms: ['头面四肢水肿','胸腹闷胀','小便短赤','舌红苔黄腻'], expected: { syndrome: '湿热下注', formula: '疏凿饮子' } },

  // 黄疸 补强 — 补充 寒湿困脾
  { case_id: 'V560', complaint: '黄疸', symptoms: ['身目黄','黄色晦暗','纳呆','腹胀','便溏','苔白腻'], expected: { syndrome: '寒湿困脾', formula: '茵陈术附汤' } },

  // 消渴 补强 — 补充 肾阴亏虚
  { case_id: 'V561', complaint: '消渴', symptoms: ['尿频量多','混浊如脂膏','口干','腰膝酸软','耳鸣'], expected: { syndrome: '肾虚血亏', formula: '六味地黄丸' } },

  // 不寐 补强 — 补充 心胆气虚
  { case_id: 'V562', complaint: '失眠', symptoms: ['失眠','多梦','易惊','胆怯','心悸'], expected: { syndrome: '心胆气虚', formula: '安神定志丸' } },

  // 喘证 补强 — 补充 痰热阻肺
  { case_id: 'V563', complaint: '喘证', symptoms: ['喘咳','痰多黄稠','胸中烦闷','发热','口渴'], expected: { syndrome: '痰热壅肺', formula: '定喘汤' } },

  // 喘证 补强 — 补充 肺气虚
  { case_id: 'V564', complaint: '喘证', symptoms: ['喘促','气短','自汗','咳声低微','易感冒'], expected: { syndrome: '肺气虚', formula: '补肺汤' } },

  // 淋证 补强 — 补充 膏淋
  { case_id: 'V565', complaint: '尿频', symptoms: ['小便混浊','尿道涩痛','排尿不畅','苔黄腻'], expected: { syndrome: '湿热下注', formula: '八正散' } },

  // 遗精 补强 — 补充 肾虚不固
  { case_id: 'V566', complaint: '遗精', symptoms: ['梦遗频作','腰膝酸软','耳鸣','健忘','神疲'], expected: { syndrome: '肾气不固', formula: '金匮肾气丸' } },

  // 阳痿 补强 — 补充 心脾受损
  { case_id: 'V567', complaint: '阳痿', symptoms: ['阳痿','心悸','失眠','纳呆','神疲','面色萎黄'], expected: { syndrome: '心脾两虚', formula: '归脾汤' } },

  // 耳鸣 补强 — 补充 肾精亏虚
  { case_id: 'V568', complaint: '耳鸣', symptoms: ['耳鸣如蝉','听力下降','腰膝酸软','遗精','潮热'], expected: { syndrome: '肾精不足', formula: '左归丸' } },

  // 口苦 补强 — 补充 肝胆湿热
  { case_id: 'V569', complaint: '口苦', symptoms: ['口苦','咽干','眩晕','急躁易怒','胁痛','舌红苔黄'], expected: { syndrome: '肝胆湿热', formula: '龙胆泻肝汤' } },

  // 口疮 补强 — 补充 心肾不交
  { case_id: 'V570', complaint: '口疮', symptoms: ['口腔溃疡','反复发作','心悸','失眠','腰膝酸软','五心烦热'], expected: { syndrome: '心肾不交', formula: '交泰丸' } },

  // 湿疹 补强 — 补充 脾虚湿蕴
  { case_id: 'V571', complaint: '皮肤瘙痒', symptoms: ['皮肤瘙痒','丘疹','糜烂渗出','纳呆','便溏','苔白腻'], expected: { syndrome: '脾虚湿盛', formula: '参苓白术散' } },

  // 嗜睡 补强 — 补充 痰湿困脾
  { case_id: 'V572', complaint: '嗜睡', symptoms: ['嗜睡','头重','胸闷','纳呆','苔白腻'], expected: { syndrome: '痰湿困脾', formula: '平胃散' } },

  // 耳鸣 补强 — 补充 肝火上炎
  { case_id: 'V573', complaint: '耳鸣', symptoms: ['耳鸣如潮','头痛','眩晕','口苦','面红目赤'], expected: { syndrome: '肝郁化火', formula: '龙胆泻肝汤' } },

  // 耳鸣 补强 — 补充 痰火郁结
  { case_id: 'V574', complaint: '耳鸣', symptoms: ['耳鸣','痰多','胸闷','口苦','苔黄腻'], expected: { syndrome: '痰火扰心', formula: '黄连温胆汤' } },

  // 心悸 补强 — 补充 水饮凌心
  { case_id: 'V575', complaint: '心悸', symptoms: ['心悸','胸闷气短','畏寒','肢体浮肿','小便不利','舌淡胖'], expected: { syndrome: '心阳虚', formula: '苓桂术甘汤' } },

  // 眩晕 补强 — 补充 肝火上炎
  { case_id: 'V576', complaint: '眩晕', symptoms: ['眩晕','头痛','面红目赤','口苦','急躁易怒'], expected: { syndrome: '肝阳上亢', formula: '天麻钩藤饮' } },

  // 不寐 补强 — 补充 痰热内扰
  { case_id: 'V577', complaint: '失眠', symptoms: ['失眠','痰多','胸闷','心烦','口苦','苔黄腻'], expected: { syndrome: '痰热内扰', formula: '黄连温胆汤' } },

  // 中风 补强 — 补充 风痰入络
  { case_id: 'V578', complaint: '中风', symptoms: ['半身不遂','口眼歪斜','语言不利','苔白腻'], expected: { syndrome: '肝阳上亢', formula: '天麻钩藤饮' } },

  // 腰痛 补强 — 补充 湿热瘀阻
  { case_id: 'V579', complaint: '腰痛', symptoms: ['腰痛','痛处灼热','遇热加重','小便短赤','苔黄腻'], expected: { syndrome: '湿热下注', formula: '四妙丸' } },

  // 痹证 补强 — 补充 尪痹
  { case_id: 'V580', complaint: '痹证', symptoms: ['关节肿胀变形','僵硬','屈伸不利','舌淡苔白'], expected: { syndrome: '尪痹', formula: '补肾祛寒治尪汤' } },
];
