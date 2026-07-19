window.TCM_DIAGNOSIS_KB = {};
(function() {
  window.TCM_DIAGNOSIS_KB.symptom_engine = {
    title: '症状解读引擎',
    description: '常见症状到中医证候的映射，含脏腑、五行、寒热虚实、严重程度及鉴别诊断',
    symptoms: [
      {
        name: '头痛', syndromes: ['肝火上炎','风寒感冒','肝郁气滞','瘀血阻络','痰浊上扰'],
        organs: ['肝','胆','胃'], element: '木', nature: '热/风', cold_hot: '热', xu_shi: '实',
        severity: '中', differential: ['头痛如裂伴面红目赤→肝火上炎','头痛恶寒怕冷→风寒感冒','头痛胀闷随情绪变化→肝郁气滞','痛处固定如针刺→瘀血阻络','头痛昏沉如裹→痰浊上扰']
      },
      {
        name: '失眠', syndromes: ['心脾两虚','肝火上炎','阴虚火旺','痰热扰心','胃气不和'],
        organs: ['心','肝','脾','胃'], element: '火/土', nature: '热/虚', cold_hot: '热', xu_shi: '虚/实',
        severity: '中', differential: ['入睡困难多梦易醒→心脾两虚','烦躁不眠伴口苦→肝火上炎','五心烦热盗汗→阴虚火旺','胸闷痰多心烦→痰热扰心','脘腹胀满不眠→胃气不和']
      },
      {
        name: '胸闷', syndromes: ['气滞血瘀','心气虚','痰湿内阻','肝郁气滞','寒凝心脉'],
        organs: ['心','肺','肝'], element: '火/金/木', nature: '滞/寒/虚', cold_hot: '寒', xu_shi: '虚实夹杂',
        severity: '中', differential: ['胸闷刺痛固定→气滞血瘀','胸闷气短乏力→心气虚','胸闷痰多→痰湿内阻','胸闷随情绪变化→肝郁气滞','胸闷遇寒加重→寒凝心脉']
      },
      {
        name: '咳嗽', syndromes: ['风寒束肺','风热犯肺','肺气虚','肺阴虚','痰湿蕴肺'],
        organs: ['肺'], element: '金', nature: '寒/热/痰', cold_hot: '寒热皆可', xu_shi: '虚实皆可',
        severity: '中', differential: ['咳嗽痰白清稀→风寒束肺','咳嗽痰黄粘稠→风热犯肺','咳声低微无力→肺气虚','干咳无痰少痰→肺阴虚','咳嗽痰多色白→痰湿蕴肺']
      },
      {
        name: '胃痛', syndromes: ['脾胃虚寒','肝气犯胃','胃火炽盛','瘀血停胃','食滞胃脘'],
        organs: ['脾','胃','肝'], element: '土/木', nature: '寒/热/滞', cold_hot: '寒热皆可', xu_shi: '虚实皆可',
        severity: '中', differential: ['胃痛隐隐喜温喜按→脾胃虚寒','胃痛随情绪加重→肝气犯胃','胃痛灼热口臭→胃火炽盛','胃痛如针刺固定→瘀血停胃','胃痛胀满嗳腐→食滞胃脘']
      },
      {
        name: '腹泻', syndromes: ['脾胃虚弱','脾肾阳虚','湿热下注','肝郁脾虚','食滞肠胃'],
        organs: ['脾','胃','肾','肝','大肠'], element: '土/水/木', nature: '寒/热/湿', cold_hot: '寒热皆可', xu_shi: '虚实皆可',
        severity: '中', differential: ['大便溏泄迁延→脾胃虚弱','五更泻泻畏寒→脾肾阳虚','泻下急迫灼热→湿热下注','腹泻随情绪波动→肝郁脾虚','泻下臭秽嗳腐→食滞肠胃']
      },
      {
        name: '便秘', syndromes: ['肠道实热','肠道气滞','脾肾阳虚','阴液亏虚','气虚传导无力'],
        organs: ['大肠','脾','肾'], element: '金/土/水', nature: '热/燥/虚', cold_hot: '热', xu_shi: '虚实皆可',
        severity: '轻', differential: ['大便干结口臭→肠道实热','大便不畅胁胀→肠道气滞','大便艰涩畏寒→脾肾阳虚','大便干结口干→阴液亏虚','虽有便意无力排出→气虚传导无力']
      },
      {
        name: '尿频', syndromes: ['肾阳虚','肾气不固','膀胱湿热','肺气虚','脾虚下陷'],
        organs: ['肾','膀胱','肺','脾'], element: '水/金/土', nature: '寒/湿/虚', cold_hot: '寒', xu_shi: '虚',
        severity: '中', differential: ['夜尿频多畏寒→肾阳虚','尿频遗尿→肾气不固','尿频尿急尿痛→膀胱湿热','尿频气短乏力→肺气虚','尿频伴小腹坠胀→脾虚下陷']
      },
      {
        name: '腰痛', syndromes: ['肾阳虚','肾阴虚','寒湿痹阻','瘀血阻络','湿热下注'],
        organs: ['肾','膀胱'], element: '水', nature: '寒/湿/瘀', cold_hot: '寒热皆可', xu_shi: '虚实皆可',
        severity: '中', differential: ['腰痛冷痛畏寒→肾阳虚','腰痛酸软五心烦热→肾阴虚','腰痛沉重阴雨加重→寒湿痹阻','腰痛如刺固定→瘀血阻络','腰痛灼热→湿热下注']
      },
      {
        name: '乏力', syndromes: ['脾气虚','心气虚','肺气虚','肾气虚','气血两虚'],
        organs: ['脾','心','肺','肾'], element: '土/火/金/水', nature: '虚', cold_hot: '平', xu_shi: '虚',
        severity: '轻', differential: ['乏力食少便溏→脾气虚','乏力心悸气短→心气虚','乏力自汗易感冒→肺气虚','乏力腰膝酸软→肾气虚','乏力面色苍白→气血两虚']
      },
      {
        name: '失眠多梦', syndromes: ['心脾两虚','心肾不交','肝郁化火','痰热扰心','心血虚'],
        organs: ['心','脾','肝','肾'], element: '火/土/木/水', nature: '热/虚', cold_hot: '热', xu_shi: '虚',
        severity: '中', differential: ['多梦易醒健忘→心脾两虚','失眠多梦遗精→心肾不交','多梦烦躁易怒→肝郁化火','多梦胸闷痰多→痰热扰心','多梦心悸面色淡→心血虚']
      },
      {
        name: '口干口苦', syndromes: ['肝火上炎','胃火炽盛','阴虚火旺','胆郁痰扰','脾胃湿热'],
        organs: ['肝','胆','胃','脾'], element: '木/土', nature: '热/燥', cold_hot: '热', xu_shi: '实/虚',
        severity: '轻', differential: ['口苦目眩烦躁→肝火上炎','口干口臭牙龈肿→胃火炽盛','口干咽干五心烦热→阴虚火旺','口苦呕恶→胆郁痰扰','口干口苦身重→脾胃湿热']
      },
      {
        name: '食欲不振', syndromes: ['脾胃虚弱','湿邪困脾','肝郁犯脾','食滞胃脘','胃阴虚'],
        organs: ['脾','胃','肝'], element: '土/木', nature: '虚/湿/滞', cold_hot: '平', xu_shi: '虚',
        severity: '轻', differential: ['食少腹胀便溏→脾胃虚弱','纳呆身重困倦→湿邪困脾','纳差随情绪变化→肝郁犯脾','厌食嗳腐吞酸→食滞胃脘','饥不欲食口干→胃阴虚']
      },
      {
        name: '月经不调', syndromes: ['肝郁气滞','血虚','血瘀','肾虚','寒凝血瘀','血热'],
        organs: ['肝','肾','脾'], element: '木/水/土', nature: '滞/虚/寒/热', cold_hot: '寒热皆可', xu_shi: '虚实皆可',
        severity: '中', differential: ['经期不准胸胁胀→肝郁气滞','量少色淡面色萎→血虚','色暗有块腹痛→血瘀','量少腰酸腿软→肾虚','经色暗有块畏寒→寒凝血瘀','量多色深红→血热']
      },
      {
        name: '关节疼痛', syndromes: ['风寒湿痹','风湿热痹','瘀血痹阻','肝肾亏虚','痰瘀互结'],
        organs: ['肝','肾'], element: '木/水', nature: '风/寒/湿/热/瘀', cold_hot: '寒热皆可', xu_shi: '虚实夹杂',
        severity: '中', differential: ['关节冷痛遇寒加重→风寒湿痹','关节红肿热痛→风湿热痹','痛处固定如刺→瘀血痹阻','关节酸痛乏力→肝肾亏虚','关节肿大变形→痰瘀互结']
      },
      {
        name: '头晕目眩', syndromes: ['肝阳上亢','气血两虚','痰浊中阻','肾精不足','肝火上炎'],
        organs: ['肝','脾','肾'], element: '木/土/水', nature: '风/虚/痰/火', cold_hot: '热', xu_shi: '虚实皆可',
        severity: '中', differential: ['眩晕耳鸣面赤→肝阳上亢','眩晕劳累加重→气血两虚','眩晕头重如裹→痰浊中阻','眩晕腰膝酸软→肾精不足','眩晕目赤口苦→肝火上炎']
      },
      {
        name: '心悸气短', syndromes: ['心气虚','心阳虚','心血虚','心阴虚','痰迷心窍'],
        organs: ['心'], element: '火', nature: '虚/痰', cold_hot: '寒热皆可', xu_shi: '虚',
        severity: '中', differential: ['心悸气短自汗→心气虚','心悸畏寒肢冷→心阳虚','心悸面色淡白→心血虚','心悸五心烦热→心阴虚','心悸胸闷痰多→痰迷心窍']
      },
      {
        name: '自汗盗汗', syndromes: ['卫气不固','阴虚火旺','营卫不和','气虚发热','湿热熏蒸'],
        organs: ['肺','心','肾','脾'], element: '金/火/水/土', nature: '虚/热/湿', cold_hot: '热', xu_shi: '虚',
        severity: '轻', differential: ['自汗易感冒→卫气不固','盗汗五心烦热→阴虚火旺','自汗恶风→营卫不和','自汗气短乏力→气虚发热','汗出粘腻身重→湿热熏蒸']
      },
      {
        name: '耳鸣', syndromes: ['肾精不足','肝火上炎','痰浊上扰','气血两虚','脾胃虚弱'],
        organs: ['肾','肝','脾'], element: '水/木/土', nature: '虚/火/痰', cold_hot: '寒热皆可', xu_shi: '虚实皆可',
        severity: '轻', differential: ['耳鸣如蝉腰膝酸软→肾精不足','耳鸣如潮面赤→肝火上炎','耳鸣头重如裹→痰浊上扰','耳鸣劳累加重→气血两虚','耳鸣食少便溏→脾胃虚弱']
      },
      {
        name: '视力模糊', syndromes: ['肝血虚','肝肾阴虚','肝火上炎','气血两虚','风热犯目'],
        organs: ['肝','肾'], element: '木/水', nature: '虚/热/风', cold_hot: '热', xu_shi: '虚',
        severity: '轻', differential: ['视物模糊面色淡→肝血虚','目涩干热腰酸→肝肾阴虚','目赤肿痛→肝火上炎','视物模糊乏力→气血两虚','目痒流泪→风热犯目']
      },
      {
        name: '皮肤瘙痒', syndromes: ['血虚风燥','风热犯表','湿热蕴肤','血热妄行','风寒袭表'],
        organs: ['肺','肝','脾'], element: '金/木/土', nature: '风/热/湿/燥', cold_hot: '寒热皆可', xu_shi: '虚实皆可',
        severity: '轻', differential: ['瘙痒干燥脱屑→血虚风燥','瘙痒红疹→风热犯表','瘙痒渗水→湿热蕴肤','瘙痒鲜红→血热妄行','瘙痒遇寒加重→风寒袭表']
      },
      {
        name: '水肿', syndromes: ['脾阳虚','肾阳虚','风水相搏','气滞水停','湿热壅盛'],
        organs: ['脾','肾','肺'], element: '土/水/金', nature: '寒/湿/风/热', cold_hot: '寒热皆可', xu_shi: '虚/实',
        severity: '中', differential: ['身肿乏力纳少→脾阳虚','腰以下肿畏寒→肾阳虚','头面先肿恶风→风水相搏','胸胁胀满水肿→气滞水停','遍身肿烦热→湿热壅盛']
      },
      {
        name: '恶心呕吐', syndromes: ['胃寒','胃热','肝气犯胃','痰饮停胃','食滞胃脘'],
        organs: ['胃','肝','脾'], element: '土/木', nature: '寒/热/滞/痰', cold_hot: '寒热皆可', xu_shi: '实',
        severity: '轻', differential: ['呕吐清水喜温→胃寒','呕吐酸臭口干→胃热','呕吐随情绪变化→肝气犯胃','呕吐清水痰涎→痰饮停胃','呕吐酸腐嗳气→食滞胃脘']
      },
      {
        name: '咽喉肿痛', syndromes: ['风热犯肺','肺胃热盛','阴虚肺燥','痰热蕴结','风寒化热'],
        organs: ['肺','胃'], element: '金/土', nature: '热/燥/痰', cold_hot: '热', xu_shi: '实/虚',
        severity: '轻', differential: ['咽痛发热咳嗽→风热犯肺','咽痛口渴便秘→肺胃热盛','咽干痛干咳→阴虚肺燥','咽痛痰黄→痰热蕴结','咽痛恶寒→风寒化热']
      },
      {
        name: '鼻塞流涕', syndromes: ['风寒感冒','风热感冒','肺气虚','胆热移脑','暑湿感冒'],
        organs: ['肺','胆'], element: '金/木', nature: '风/寒/热/湿', cold_hot: '寒热皆可', xu_shi: '实/虚',
        severity: '轻', differential: ['鼻塞流清涕→风寒感冒','鼻塞流黄涕→风热感冒','鼻塞反复发作→肺气虚','鼻塞流浊涕头痛→胆热移脑','鼻塞身重困倦→暑湿感冒']
      },
      {
        name: '面色萎黄', syndromes: ['脾胃虚弱','气血两虚','脾虚湿困','肝血虚','虫积'],
        organs: ['脾','胃','肝'], element: '土/木', nature: '虚/湿', cold_hot: '平', xu_shi: '虚',
        severity: '轻', differential: ['面色萎黄食少→脾胃虚弱','面色淡白无华→气血两虚','面色黄而虚浮→脾虚湿困','面色萎黄视物模糊→肝血虚','面色萎黄腹痛→虫积']
      },
      {
        name: '脱发', syndromes: ['肝肾阴虚','血虚生风','肾阳虚','湿热上蒸','肝郁气滞'],
        organs: ['肝','肾'], element: '木/水', nature: '虚/热/湿/郁', cold_hot: '寒热皆可', xu_shi: '虚实皆可',
        severity: '轻', differential: ['脱发腰膝酸软→肝肾阴虚','脱发面色淡白→血虚生风','脱发畏寒肢冷→肾阳虚','脱发头皮油腻→湿热上蒸','脱发情志不畅→肝郁气滞']
      },
      {
        name: '肥胖', syndromes: ['脾虚湿盛','痰湿内阻','胃热湿阻','气虚肥胖','阳虚水泛'],
        organs: ['脾','胃','肾'], element: '土/水', nature: '湿/痰/热/虚', cold_hot: '平', xu_shi: '虚实夹杂',
        severity: '中', differential: ['体胖乏力便溏→脾虚湿盛','体胖痰多身重→痰湿内阻','体胖食欲旺盛→胃热湿阻','体胖气短乏力→气虚肥胖','体胖畏寒浮肿→阳虚水泛']
      },
      {
        name: '消瘦', syndromes: ['脾胃虚弱','胃火炽盛','阴虚火旺','肝郁脾虚','虫积'],
        organs: ['脾','胃','肝'], element: '土/木', nature: '虚/热', cold_hot: '热', xu_shi: '虚实皆可',
        severity: '轻', differential: ['消瘦食少腹胀→脾胃虚弱','消瘦多食口干→胃火炽盛','消瘦五心烦热→阴虚火旺','消瘦情志不畅→肝郁脾虚','消瘦腹痛→虫积']
      },
      {
        name: '怕冷', syndromes: ['肾阳虚','脾阳虚','心阳虚','卫阳不固','寒邪直中'],
        organs: ['肾','脾','心','肺'], element: '水/土/火/金', nature: '寒/虚', cold_hot: '寒', xu_shi: '虚',
        severity: '中', differential: ['畏寒腰膝冷痛→肾阳虚','畏寒腹冷便溏→脾阳虚','畏寒心悸胸闷→心阳虚','畏寒自汗易感冒→卫阳不固','突然畏寒腹痛→寒邪直中']
      },
      {
        name: '怕热', syndromes: ['阴虚火旺','肝火上炎','胃火炽盛','气分热盛','湿热郁蒸'],
        organs: ['肝','胃','肾','肺'], element: '木/土/水/金', nature: '热/火', cold_hot: '热', xu_shi: '实/虚',
        severity: '中', differential: ['五心烦热盗汗→阴虚火旺','面红目赤口苦→肝火上炎','口渴口臭便秘→胃火炽盛','大热大汗烦渴→气分热盛','身热不扬汗出→湿热郁蒸']
      }
    ]
  };

  window.TCM_DIAGNOSIS_KB.syndrome_db = {
    title: '证候数据库',
    description: '20个中医常见证候，含症状组合、治法、方剂、穴位、五行及命理关联',
    syndromes: [
      {
        name: '肝郁气滞', symptom_combo: ['胸胁胀痛','情志抑郁','善太息','女性月经不调','咽中如有物阻'],
        treatment: '疏肝理气，解郁和络', formulas: ['逍遥散','柴胡疏肝散','越鞠丸'],
        acupoints: ['太冲','期门','阳陵泉','膻中','内关'],
        element: '木', organs: ['肝','胆'],
        mingli_link: '八字木旺或金旺克木者易患；日柱天干为甲乙木受克，或月令金旺'
      },
      {
        name: '肝火上炎', symptom_combo: ['头痛眩晕','面红目赤','口苦口干','急躁易怒','耳鸣如潮','便秘尿黄'],
        treatment: '清肝泻火，平肝潜阳', formulas: ['龙胆泻肝汤','当归龙荟丸','丹栀逍遥散'],
        acupoints: ['太冲','行间','风池','太阳','侠溪'],
        element: '木', organs: ['肝','胆'],
        mingli_link: '八字木火通明或火多木焚者；甲乙木生丙丁火太旺，或寅卯木局加巳午火'
      },
      {
        name: '心脾两虚', symptom_combo: ['心悸怔忡','失眠多梦','面色萎黄','食少倦怠','月经量少'],
        treatment: '补益心脾，养血安神', formulas: ['归脾汤','养心汤','天王补心丹'],
        acupoints: ['神门','心俞','脾俞','足三里','三阴交'],
        element: '火/土', organs: ['心','脾'],
        mingli_link: '八字火土弱或水旺克火者；日主丙丁火弱而水多，或戊己土泄火太过'
      },
      {
        name: '脾胃湿热', symptom_combo: ['脘腹痞满','口苦口粘','纳呆恶心','大便粘滞不爽','身重困倦','面目发黄'],
        treatment: '清热利湿，健脾和胃', formulas: ['茵陈蒿汤','甘露消毒丹','三仁汤'],
        acupoints: ['中脘','足三里','阴陵泉','内庭','天枢'],
        element: '土', organs: ['脾','胃'],
        mingli_link: '八字土湿偏重或火土相生太过；辰戌丑未土多而湿，或子亥水泛浸土'
      },
      {
        name: '肾阳虚', symptom_combo: ['畏寒肢冷','腰膝酸冷','性功能减退','夜尿频多','水肿','五更泻'],
        treatment: '温补肾阳，化气行水', formulas: ['金匮肾气丸','右归丸','真武汤'],
        acupoints: ['肾俞','命门','关元','气海','太溪'],
        element: '水', organs: ['肾','膀胱'],
        mingli_link: '八字水弱或土旺克水者；壬癸水弱而戊己土旺，或申酉金弱不能生水'
      },
      {
        name: '肾阴虚', symptom_combo: ['腰膝酸软','头晕耳鸣','五心烦热','盗汗','口干咽燥','遗精'],
        treatment: '滋补肾阴，降火清热', formulas: ['六味地黄丸','左归丸','知柏地黄丸'],
        acupoints: ['太溪','肾俞','三阴交','照海','然谷'],
        element: '水', organs: ['肾','肝'],
        mingli_link: '八字水弱火旺或金弱不能生水者；壬癸水弱而丙丁火旺，或火多水涸'
      },
      {
        name: '肺气虚', symptom_combo: ['咳声低微','气短乏力','自汗易感冒','面色苍白','语声低微'],
        treatment: '补益肺气，固表止汗', formulas: ['玉屏风散','补肺汤','保元汤'],
        acupoints: ['肺俞','太渊','足三里','气海','膻中'],
        element: '金', organs: ['肺'],
        mingli_link: '八字金弱或火旺克金者；庚辛金弱而丙丁火旺，或土多金埋'
      },
      {
        name: '肝血虚', symptom_combo: ['面色无华','视物模糊','爪甲不荣','肢体麻木','月经量少或闭经'],
        treatment: '补血养肝，柔肝明目', formulas: ['四物汤','补肝汤','当归补血汤'],
        acupoints: ['肝俞','三阴交','足三里','太冲','血海'],
        element: '木', organs: ['肝'],
        mingli_link: '八字木弱或金旺克木者；甲乙木弱而庚辛金旺，或水弱不能涵木'
      },
      {
        name: '痰湿内阻', symptom_combo: ['胸闷痰多','身重困倦','纳呆口粘','大便不爽','面色晦滞','体胖'],
        treatment: '燥湿化痰，理气和中', formulas: ['二陈汤','温胆汤','平胃散'],
        acupoints: ['丰隆','中脘','足三里','阴陵泉','脾俞'],
        element: '土', organs: ['脾','肺'],
        mingli_link: '八字土旺水泛或湿气重者；辰戌丑未土多，或子亥水多与土混杂'
      },
      {
        name: '气滞血瘀', symptom_combo: ['胸胁刺痛','痛处固定拒按','肿块','面色晦暗','口唇紫暗','舌有瘀斑'],
        treatment: '行气活血，化瘀止痛', formulas: ['血府逐瘀汤','桃红四物汤','丹参饮'],
        acupoints: ['膈俞','血海','太冲','合谷','三阴交'],
        element: '木/火', organs: ['肝','心'],
        mingli_link: '八字木旺化火或金木相战者；甲乙木受庚辛金克伐太过，气血郁滞'
      },
      {
        name: '风寒感冒', symptom_combo: ['恶寒发热','头痛身痛','鼻塞流清涕','无汗','咳嗽痰白'],
        treatment: '辛温解表，宣肺散寒', formulas: ['麻黄汤','桂枝汤','荆防败毒散'],
        acupoints: ['风池','风门','列缺','合谷','大椎'],
        element: '金/水', organs: ['肺','膀胱'],
        mingli_link: '八字金水偏旺或卫阳不足者；庚辛金多遇壬癸水，或火弱卫阳不固'
      },
      {
        name: '风热感冒', symptom_combo: ['发热重恶寒轻','头痛咽痛','鼻塞流黄涕','口渴','咳嗽痰黄'],
        treatment: '辛凉解表，清热解毒', formulas: ['银翘散','桑菊饮','双黄连口服液'],
        acupoints: ['大椎','曲池','合谷','鱼际','少商'],
        element: '金/火', organs: ['肺','心'],
        mingli_link: '八字火金相战或木火旺者；丙丁火旺遇庚辛金，或木生火旺犯肺'
      },
      {
        name: '暑湿感冒', symptom_combo: ['发热不扬','头重如裹','身重困倦','胸闷纳呆','大便溏泄','口粘腻'],
        treatment: '清暑祛湿，解表和中', formulas: ['新加香薷饮','藿香正气散','清暑益气汤'],
        acupoints: ['中脘','足三里','阴陵泉','合谷','大椎'],
        element: '土/火', organs: ['脾','胃','肺'],
        mingli_link: '八字火土偏旺或湿气重者；巳午未月火土旺，或辰戌丑未湿土多'
      },
      {
        name: '阳明腑实', symptom_combo: ['大便秘结','腹满硬痛','日晡潮热','口渴','汗出','神昏谵语'],
        treatment: '峻下热结，通腑泄热', formulas: ['大承气汤','小承气汤','调胃承气汤'],
        acupoints: ['天枢','足三里','上巨虚','合谷','曲池'],
        element: '土/金', organs: ['胃','大肠'],
        mingli_link: '八字土金偏旺或火燥土者；戊己土旺遇庚辛金，或火土燥烈津液亏'
      },
      {
        name: '少阳证', symptom_combo: ['往来寒热','胸胁苦满','口苦咽干','目眩','不欲饮食','心烦喜呕'],
        treatment: '和解少阳，调畅枢机', formulas: ['小柴胡汤','蒿芩清胆汤','柴胡桂枝汤'],
        acupoints: ['外关','足临泣','丘墟','阳陵泉','期门'],
        element: '木/火', organs: ['胆','三焦'],
        mingli_link: '八字木火交争或金木相搏者；甲乙木与庚辛金相战，枢机不利'
      },
      {
        name: '太阴脾虚', symptom_combo: ['腹满呕吐','食不下','自利不渴','时腹自痛','四肢欠温'],
        treatment: '温中健脾，散寒燥湿', formulas: ['理中汤','附子理中丸','参苓白术散'],
        acupoints: ['中脘','脾俞','足三里','章门','天枢'],
        element: '土', organs: ['脾'],
        mingli_link: '八字土弱或木旺克土者；戊己土弱而甲乙木旺，或水多土流'
      },
      {
        name: '少阴寒化', symptom_combo: ['四肢厥冷','脉微细','但欲寐','下利清谷','恶寒蜷卧'],
        treatment: '回阳救逆，温经散寒', formulas: ['四逆汤','真武汤','附子汤'],
        acupoints: ['关元','气海','神阙','命门','太溪'],
        element: '水/火', organs: ['心','肾'],
        mingli_link: '八字水旺火微或阳虚明显者；壬癸水旺而丙丁火极弱，阳气将亡'
      },
      {
        name: '厥阴肝寒', symptom_combo: ['头顶痛','干呕吐涎沫','脘腹冷痛','四肢厥冷','痛经'],
        treatment: '暖肝散寒，温经止痛', formulas: ['吴茱萸汤','当归四逆汤','暖肝煎'],
        acupoints: ['太冲','百会','关元','气海','三阴交'],
        element: '木', organs: ['肝'],
        mingli_link: '八字木弱水寒或金寒克木者；甲乙木弱而壬癸水寒，或金旺木凋'
      },
      {
        name: '卫气不固', symptom_combo: ['自汗','易感冒','气短乏力','面色苍白','稍动则汗出'],
        treatment: '益气固表，敛汗止汗', formulas: ['玉屏风散','牡蛎散','桂枝加黄芪汤'],
        acupoints: ['足三里','肺俞','气海','关元','复溜'],
        element: '金/土', organs: ['肺','脾'],
        mingli_link: '八字金土偏弱或火旺克金者；庚辛金弱而丙丁火旺，或土弱不能生金'
      },
      {
        name: '营卫不和', symptom_combo: ['发热恶风','自汗出','鼻鸣干呕','脉浮缓','时冷时热'],
        treatment: '调和营卫，解肌发表', formulas: ['桂枝汤','桂枝加葛根汤','柴胡桂枝汤'],
        acupoints: ['风池','合谷','足三里','大椎','后溪'],
        element: '金/木', organs: ['肺','肝'],
        mingli_link: '八字金木不调或风邪外袭者；庚辛金与甲乙木不协调，营卫失和'
      }
    ]
  };

  window.TCM_DIAGNOSIS_KB.doctor_recommendation = {
    title: '名医推荐库',
    description: '古今名医信息，含专长、代表方、擅长证候及推荐理由模板',
    doctors: [
      {
        name: '张仲景', era: '东汉', specialty: '伤寒杂病',
        representative_work: '《伤寒杂病论》', key_formulas: ['桂枝汤','麻黄汤','小柴胡汤','白虎汤','理中汤','四逆汤'],
        syndrome_tags: ['风寒感冒','少阳证','阳明腑实','太阴脾虚','少阴寒化'],
        reason_template: '您的症状表现为{核心症状}，符合六经辨证中{证型}的特征。张仲景擅用经方治疗此类证候，推荐方剂{方剂名}，药简力专，效果显著。'
      },
      {
        name: '华佗', era: '东汉', specialty: '外科针灸',
        representative_work: '《中藏经》（传）', key_formulas: ['麻沸散','华佗夹脊穴'],
        syndrome_tags: ['气滞血瘀','风寒湿痹','关节疼痛'],
        reason_template: '您的症状涉及{核心症状}，需针灸与药物并治。华佗擅长外科与针灸，夹脊穴对{症状描述}效果独特，配合药物调理可获佳效。'
      },
      {
        name: '孙思邈', era: '唐代', specialty: '综合内科/养生',
        representative_work: '《千金要方》《千金翼方》', key_formulas: ['独活寄生汤','温胆汤','苇茎汤'],
        syndrome_tags: ['肝郁气滞','痰湿内阻','风寒湿痹','气血两虚'],
        reason_template: '您的症状{核心症状}属于{证型}。孙思邈《千金方》中{方剂名}对此类证候有良效，并注重养生调摄，建议配合食养与导引。'
      },
      {
        name: '李时珍', era: '明代', specialty: '本草/药学',
        representative_work: '《本草纲目》', key_formulas: ['诸多本草验方'],
        syndrome_tags: ['脾胃湿热','肝火上炎','阴虚火旺'],
        reason_template: '您的症状{核心症状}需从药食同源角度调理。李时珍《本草纲目》记载{相关药材}对{证型}有良效，建议药膳配合治疗。'
      },
      {
        name: '倪海厦', era: '现代', specialty: '经方+命理',
        representative_work: '《人纪》《天纪》', key_formulas: ['经方化裁','紫微斗数辅助辨证'],
        syndrome_tags: ['少阴寒化','厥阴肝寒','肾阳虚','肝郁气滞'],
        reason_template: '结合您八字{命理特征}与症状{核心症状}，倪海厦经方流派擅长将命理与六经辨证结合，推荐{方剂名}温阳祛寒，并依据命局调整用药。'
      },
      {
        name: '刘渡舟', era: '现代', specialty: '伤寒论',
        representative_work: '《伤寒论通俗讲话》《伤寒论十四讲》', key_formulas: ['柴胡剂系列','苓桂术甘汤'],
        syndrome_tags: ['少阳证','痰湿内阻','心脾两虚'],
        reason_template: '您的症状{核心症状}符合少阳证或痰饮证特点。刘渡舟善用柴胡剂和苓桂剂，{方剂名}可和解枢机、温化痰饮，切合您的病机。'
      },
      {
        name: '邓铁涛', era: '现代', specialty: '脾胃学说',
        representative_work: '《邓铁涛医学文集》', key_formulas: ['补中益气汤化裁','强肌健力饮'],
        syndrome_tags: ['太阴脾虚','脾胃虚弱','气虚发热'],
        reason_template: '您的症状{核心症状}属脾胃虚弱范畴。邓铁涛崇尚脾胃学说，认为"脾为后天之本"，推荐{方剂名}健脾益气，从脾胃论治整体调理。'
      },
      {
        name: '朱良春', era: '现代', specialty: '虫类药/痹证',
        representative_work: '《虫类药的应用》《医学微言》', key_formulas: ['益肾蠲痹丸','复肝丸'],
        syndrome_tags: ['风寒湿痹','瘀血阻络','肝肾亏虚'],
        reason_template: '您的症状{核心症状}属痹证或瘀阻。朱良春善用虫类药搜风通络，{方剂名}中含虫类药可深入络脉，对{证型}疗效显著。'
      },
      {
        name: '焦树德', era: '现代', specialty: '痹证/心病',
        representative_work: '《用药心得十讲》《方剂心得十讲》', key_formulas: ['补肾祛寒治尪汤','调痹汤'],
        syndrome_tags: ['风寒湿痹','肾阳虚','气滞血瘀'],
        reason_template: '您的关节疼痛症状{核心症状}属痹证。焦树德治痹经验丰富，{方剂名}补肾祛寒、活血通络，对{证型}尤为对症。'
      },
      {
        name: '颜正华', era: '现代', specialty: '本草/脾胃',
        representative_work: '《颜正华中药学讲稿》', key_formulas: ['香砂六君子汤','参苓白术散化裁'],
        syndrome_tags: ['脾胃虚弱','脾胃湿热','痰湿内阻'],
        reason_template: '您的症状{核心症状}需从脾胃调治。颜正华精通药性，善用平和之品调理脾胃，{方剂名}药性平和，适合{证型}长期调理。'
      },
      {
        name: '王绵之', era: '现代', specialty: '方剂学',
        representative_work: '《王绵之方剂学讲稿》', key_formulas: ['逍遥散化裁','六味地黄丸化裁'],
        syndrome_tags: ['肝郁气滞','肾阴虚','心脾两虚'],
        reason_template: '您的症状{核心症状}涉及{证型}。王绵之方剂学造诣深厚，善于化裁古方，{方剂名}加减可针对您的具体病机精准调理。'
      },
      {
        name: '张伯礼', era: '现代', specialty: '心血管/中风',
        representative_work: '《中医内科医学》', key_formulas: ['丹蒌片','清心化痰方'],
        syndrome_tags: ['气滞血瘀','痰湿内阻','心气虚'],
        reason_template: '您的症状{核心症状}涉及心血管系统。张伯礼院士擅长中西医结合治疗心血管疾病，{方剂名}活血化痰通络，适合{证型}的治疗。'
      },
      {
        name: '仝小林', era: '现代', specialty: '糖尿病/代谢病',
        representative_work: '《糖络杂病论》《维新中医》', key_formulas: ['桑梅饮','消瘅方'],
        syndrome_tags: ['阴虚火旺','脾胃湿热','气阴两虚'],
        reason_template: '您的症状{核心症状}与代谢相关。仝小林院士擅长糖尿病中医治疗，{方剂名}针对{证型}有较好疗效，建议结合生活方式干预。'
      },
      {
        name: '黄煌', era: '现代', specialty: '经方派/方证相应',
        representative_work: '《张仲景50味药证》《中医十大类方》', key_formulas: ['柴胡加龙骨牡蛎汤','黄芪桂枝五物汤','半夏厚朴汤'],
        syndrome_tags: ['肝郁气滞','气虚血瘀','痰湿内阻','营卫不和'],
        reason_template: '您的体质与症状{核心症状}符合"方人相应"特点。黄煌经方派强调方证对应，{方剂名}体质辨识明确，适合{证型}的患者。'
      },
      {
        name: '舒晗', era: '现代', specialty: '奇门遁甲+中医',
        representative_work: '奇门中医诊疗体系', key_formulas: ['奇门择时针方','五行调衡方'],
        syndrome_tags: ['肝郁气滞','肾阳虚','心脾两虚','气滞血瘀'],
        reason_template: '结合您奇门局{奇门格局}与症状{核心症状}，舒晗体系将奇门时空与中医辨证结合，推荐{治法}，择时施治，调和五行。'
      }
    ],
    match: function(symptoms, mingli) {
      var tags = symptoms || [];
      var results = [];
      var doctors = this.doctors;
      for (var i = 0; i < doctors.length; i++) {
        var doc = doctors[i];
        var score = 0;
        for (var j = 0; j < tags.length; j++) {
          if (doc.syndrome_tags.indexOf(tags[j]) !== -1) score++;
        }
        if (score > 0) {
          results.push({ name: doc.name, score: score, reason: doc.reason_template.replace('{核心症状}', tags.join('、')) });
        }
      }
      results.sort(function(a, b) { return b.score - a.score; });
      return results;
    }
  };

  window.TCM_DIAGNOSIS_KB.mingli_disease_prediction = {
    title: '命理-疾病预测',
    description: '基于八字五行推断疾病走势，含五行偏盛偏衰、大运流年、十神与疾病关系',
    element_organ_risk: {
      'wood_too_strong': { organ: '肝胆', risk: '肝火上炎、肝郁气滞、高血压', direction: '需金克木或火泄木' },
      'wood_too_weak': { organ: '肝胆', risk: '肝血虚、视力下降、月经量少', direction: '需水生木或木助' },
      'fire_too_strong': { organ: '心/小肠', risk: '心火亢盛、口疮、失眠', direction: '需水克火或土泄火' },
      'fire_too_weak': { organ: '心/小肠', risk: '心气虚、心阳虚、血脉不利', direction: '需木生火或火助' },
      'earth_too_strong': { organ: '脾胃', risk: '痰湿内阻、肥胖、糖尿病', direction: '需木克土或金泄土' },
      'earth_too_weak': { organ: '脾胃', risk: '脾虚泄泻、消化不良、内脏下垂', direction: '需火生土或土助' },
      'metal_too_strong': { organ: '肺/大肠', risk: '肺气壅滞、便秘、皮肤干燥', direction: '需火克金或水泄金' },
      'metal_too_weak': { organ: '肺/大肠', risk: '肺气虚、易感冒、自汗', direction: '需土生金或金助' },
      'water_too_strong': { organ: '肾/膀胱', risk: '水肿、寒湿、阳虚', direction: '需土克水或木泄水' },
      'water_too_weak': { organ: '肾/膀胱', risk: '肾阴虚、口干、腰膝酸软', direction: '需金生水或水助' }
    },
    dayun_trigger_rules: [
      { rule: '大运逢七杀冲克日主', disease: '肝胆疾病、外伤', explanation: '七杀为克制日主之物，大运逢之则正气受损，对应脏腑受累' },
      { rule: '大运逢伤官见官', disease: '心肺疾病', explanation: '伤官见官，火金交战，心肺首当其冲' },
      { rule: '大运逢羊刃冲合', disease: '出血性疾病、肝胆', explanation: '羊刃主血光，冲合引动则易出血或肝胆发病' },
      { rule: '大运逢枭神夺食', disease: '脾胃疾病', explanation: '枭神夺食，土受木克，脾胃运化失常' },
      { rule: '大运逢财破印', disease: '肾病、泌尿系统', explanation: '财破印，水受土克，肾与泌尿受损' },
      { rule: '大运逢三合局化火', disease: '心血管疾病', explanation: '三合火局成化，心火太旺，易发心血管疾病' },
      { rule: '大运逢三会金局', disease: '肺病、呼吸道', explanation: '三会金局，金气太盛，肺气壅滞' },
      { rule: '大运逢冲提', disease: '突发疾病', explanation: '冲提纲，月令被冲，脏腑功能突变' }
    ],
    ten_god_disease: {
      '七杀旺克日主': { disease: '肝胆疾病', organ: '肝胆', element: '木', explanation: '七杀为偏官，克制日主太过，肝胆受损' },
      '正官太旺': { disease: '心肺气虚', organ: '心肺', element: '火/金', explanation: '正官太旺，日主受制，心肺功能下降' },
      '伤官旺': { disease: '肺热咳嗽', organ: '肺', element: '金', explanation: '伤官泄秀太过，肺气耗散' },
      '食伤太过': { disease: '脾胃虚弱', organ: '脾胃', element: '土', explanation: '食伤泄日主太过，脾胃运化不利' },
      '财星太旺': { disease: '肾虚腰痛', organ: '肾', element: '水', explanation: '财星耗日主太过，肾气亏虚' },
      '印星太旺': { disease: '痰湿肥胖', organ: '脾', element: '土', explanation: '印星生日主太过，土旺生痰湿' },
      '比劫太旺': { disease: '肝阳上亢', organ: '肝', element: '木', explanation: '比劫帮身太过，木旺化火，肝阳上亢' },
      '枭神夺食': { disease: '脾胃病', organ: '脾', element: '土', explanation: '枭神克食，脾胃运化受阻' }
    },
    yongshen_health: {
      '用神为木': { direction: '疏肝理气，养血柔肝', advice: '多食绿色食物，保持心情舒畅，适当运动疏泄肝气' },
      '用神为火': { direction: '温补心阳，益气活血', advice: '多食红色食物，注意保暖，避免过度劳累' },
      '用神为土': { direction: '健脾和胃，燥湿化痰', advice: '饮食有节，忌生冷，适当食用黄色食物如小米、南瓜' },
      '用神为金': { direction: '补益肺气，固表敛汗', advice: '多食白色食物如百合、银耳，适当进行呼吸锻炼' },
      '用神为水': { direction: '滋补肾阴或温补肾阳', advice: '多食黑色食物如黑豆、黑芝麻，注意腰部保暖' }
    },
    prediction_templates: [
      {
        scenario: '八字木旺火炎，大运逢金',
        prediction: '此造木火偏旺，金为财星。大运逢金，金木相战，肝胆先病，继则肺金受克。40-50岁需防肝胆疾病与呼吸道问题。',
        advice: '宜疏肝清火，佐以润肺。方用丹栀逍遥散合沙参麦冬汤。'
      },
      {
        scenario: '八字水旺火微，大运逢土',
        prediction: '此造水旺火微，阳气不足。大运逢土克水，虽制水但有脾胃负担。30-40岁易发脾胃虚寒与心血管问题。',
        advice: '宜温补脾肾，方用理中汤合金匮肾气丸。'
      },
      {
        scenario: '八字土旺木弱，大运逢木',
        prediction: '此造土旺木弱，木被土折。大运逢木，天干地支木到，但力弱难制厚土。脾胃痰湿重，肝气郁滞。',
        advice: '宜健脾化痰、疏肝理气，方用二陈汤合逍遥散。'
      },
      {
        scenario: '八字火旺金弱，大运逢火',
        prediction: '此造火旺金弱，金受火克。大运再逢火，肺金更损。35-45岁易发呼吸道疾病与大肠问题。',
        advice: '宜清金润肺，方用百合固金汤合泻白散。'
      },
      {
        scenario: '八字金旺木弱，大运逢金',
        prediction: '此造金旺木弱，金克木太过。大运再逢金，肝木更损。40-50岁需防肝病、目疾、筋脉问题。',
        advice: '宜滋水涵木、柔肝养血，方用一贯煎合六味地黄丸。'
      },
      {
        scenario: '八字水弱土旺，大运逢土',
        prediction: '此造水弱土旺，土克水。大运再逢土，肾水更亏。50岁后需防肾病、泌尿系统、骨骼问题。',
        advice: '宜滋补肾阴，佐以健脾利湿，方用六味地黄丸合五苓散。'
      },
      {
        scenario: '八字七杀旺克日主，大运逢七杀',
        prediction: '此造七杀太旺，日主受克。大运再逢七杀，正气大损。需防外伤、肝胆疾病、突发性疾病。',
        advice: '宜用印化杀、食制杀。方用逍遥散加黄芪、党参扶正祛邪。'
      },
      {
        scenario: '八字伤官见官，大运逢伤官',
        prediction: '此造伤官见官，火金交战。大运逢伤官，心肺受累。35-45岁需防心血管与呼吸道疾病。',
        advice: '宜清心润肺、调和火金，方用导赤散合百合固金汤。'
      },
      {
        scenario: '八字枭神夺食，大运逢枭',
        prediction: '此造枭神夺食，木克土。大运逢枭，脾胃更损。30-40岁需防消化系统疾病。',
        advice: '宜健脾和胃、化痰降逆，方用香砂六君子汤。'
      },
      {
        scenario: '八字财破印，大运逢财',
        prediction: '此造财破印，土克水。大运逢财，肾气更亏。45-55岁需防肾虚、腰痛、泌尿系统疾病。',
        advice: '宜补肾固精、健脾利水，方用济生肾气丸合参苓白术散。'
      }
    ]
  };

  window.TCM_DIAGNOSIS_KB.yijing_tcm_solution = {
    title: '周易-中医联合方案',
    description: '六十四卦与健康对应，卦象→证候→方剂→穴位的完整链路',
    hexagram_health: [
      { hexagram: '乾', name: '乾为天', element: '金', organ: '肺/大肠/头', disease_hint: '乾卦主刚健过亢，易致肺气壅滞、头痛、便秘', tcm_link: '肺气虚/阳明腑实', formula: '白虎汤/承气汤', acupoints: ['合谷','曲池','天枢','肺俞'], health_direction: '润肺降气，通腑泄热' },
      { hexagram: '坤', name: '坤为地', element: '土', organ: '脾/胃/腹', disease_hint: '坤卦主厚载过湿，易致脾虚湿盛、腹胀、水肿', tcm_link: '太阴脾虚/痰湿内阻', formula: '理中汤/二陈汤', acupoints: ['中脘','足三里','脾俞','阴陵泉'], health_direction: '健脾燥湿，温中散寒' },
      { hexagram: '震', name: '震为雷', element: '木', organ: '肝/胆/神经', disease_hint: '震卦主震动不宁，易致肝风内动、眩晕、惊悸', tcm_link: '肝火上炎/肝郁气滞', formula: '天麻钩藤饮/柴胡疏肝散', acupoints: ['太冲','风池','百会','阳陵泉'], health_direction: '平肝息风，疏肝理气' },
      { hexagram: '巽', name: '巽为风', element: '木', organ: '肝/胆/呼吸道', disease_hint: '巽卦主风邪外袭，易致感冒、咳嗽、皮肤瘙痒', tcm_link: '风寒感冒/风热感冒', formula: '桂枝汤/银翘散', acupoints: ['风池','列缺','合谷','肺俞'], health_direction: '祛风解表，宣肺止咳' },
      { hexagram: '坎', name: '坎为水', element: '水', organ: '肾/膀胱/耳', disease_hint: '坎卦主寒水过盛，易致肾阳虚、水肿、耳疾', tcm_link: '肾阳虚/少阴寒化', formula: '金匮肾气丸/真武汤', acupoints: ['肾俞','命门','关元','太溪'], health_direction: '温补肾阳，化气行水' },
      { hexagram: '离', name: '离为火', element: '火', organ: '心/小肠/目', disease_hint: '离卦主火热上炎，易致心火亢盛、口疮、目赤', tcm_link: '肝火上炎/心火亢盛', formula: '导赤散/龙胆泻肝汤', acupoints: ['神门','心俞','少府','太阳'], health_direction: '清心泻火，滋阴降火' },
      { hexagram: '艮', name: '艮为山', element: '土', organ: '脾/胃/关节', disease_hint: '艮卦主停滞不通，易致食滞、关节疼痛、肿瘤', tcm_link: '气滞血瘀/食滞胃脘', formula: '保和丸/身痛逐瘀汤', acupoints: ['足三里','中脘','合谷','太冲'], health_direction: '消食导滞，活血通络' },
      { hexagram: '兑', name: '兑为泽', element: '金', organ: '肺/口/咽喉', disease_hint: '兑卦主缺损不固，易致肺虚、口疮、咽喉肿痛', tcm_link: '肺气虚/肺阴虚', formula: '百合固金汤/玉屏风散', acupoints: ['太渊','肺俞','鱼际','列缺'], health_direction: '润肺养阴，固表益气' },
      { hexagram: '泰', name: '地天泰', element: '土/金', organ: '脾/胃/心', disease_hint: '泰卦主阴阳交合，健康之象。失和则心脾两虚', tcm_link: '心脾两虚', formula: '归脾汤', acupoints: ['神门','心俞','脾俞','足三里'], health_direction: '补益心脾，养血安神' },
      { hexagram: '否', name: '天地否', element: '金/土', organ: '脾/胃/心', disease_hint: '否卦主阴阳不交，气机痞塞，易致胸痹、腹胀', tcm_link: '气滞血瘀/痰湿内阻', formula: '枳实薤白桂枝汤/半夏泻心汤', acupoints: ['膻中','中脘','内关','足三里'], health_direction: '通阳散结，调和脾胃' },
      { hexagram: '既济', name: '水火既济', element: '水/火', organ: '心/肾', disease_hint: '既济卦主心肾相交，健康。失常则心肾不交', tcm_link: '心肾不交/肾阴虚', formula: '交泰丸/六味地黄丸', acupoints: ['神门','太溪','心俞','肾俞'], health_direction: '交通心肾，滋阴降火' },
      { hexagram: '未济', name: '火水未济', element: '火/水', organ: '心/肾', disease_hint: '未济卦主心肾不交，易致失眠、遗精、潮热', tcm_link: '阴虚火旺/心肾不交', formula: '知柏地黄丸/天王补心丹', acupoints: ['神门','三阴交','太溪','心俞'], health_direction: '滋阴清热，交通心肾' },
      { hexagram: '复', name: '地雷复', element: '木/土', organ: '肝/脾', disease_hint: '复卦主阳气来复，调养之象。失调则肝郁脾虚', tcm_link: '肝郁脾虚', formula: '逍遥散', acupoints: ['太冲','足三里','期门','脾俞'], health_direction: '疏肝健脾，调畅气机' },
      { hexagram: '垢', name: '天风姤', element: '金/木', organ: '肺/肝', disease_hint: '姤卦主阴气渐盛，易致寒邪内侵、肝肺不调', tcm_link: '风寒感冒/肝郁气滞', formula: '桂枝汤/柴胡疏肝散', acupoints: ['风池','太冲','列缺','合谷'], health_direction: '祛风散寒，疏肝理气' },
      { hexagram: '升', name: '地风升', element: '木/土', organ: '肝/脾', disease_hint: '升卦主气机升发，太过则肝阳上亢', tcm_link: '肝火上炎/肝阳上亢', formula: '天麻钩藤饮/镇肝熄风汤', acupoints: ['太冲','风池','百会','太阳'], health_direction: '平肝潜阳，清热息风' },
      { hexagram: '降', name: '泽地萃', element: '金/土', organ: '肺/脾', disease_hint: '萃卦主聚而不散，易致痰湿聚积、食滞', tcm_link: '痰湿内阻/食滞胃脘', formula: '二陈汤/保和丸', acupoints: ['丰隆','中脘','足三里','肺俞'], health_direction: '化痰祛湿，消食导滞' },
      { hexagram: '恒', name: '雷风恒', element: '木', organ: '肝/胆', disease_hint: '恒卦主久而不变，易致气机呆滞、肝胆湿热', tcm_link: '肝郁气滞/脾胃湿热', formula: '龙胆泻肝汤/逍遥散', acupoints: ['太冲','阳陵泉','期门','足三里'], health_direction: '疏肝利胆，清热化湿' },
      { hexagram: '损', name: '山泽损', element: '土/金', organ: '脾/肺', disease_hint: '损卦主损下益上，易致脾虚肺弱', tcm_link: '脾肺气虚', formula: '参苓白术散/补中益气汤', acupoints: ['足三里','肺俞','脾俞','太渊'], health_direction: '健脾益气，培土生金' },
      { hexagram: '益', name: '风雷益', element: '木', organ: '肝/胆', disease_hint: '益卦主损上益下，肝胆受益。太过则木旺化火', tcm_link: '肝血虚/肝火上炎', formula: '四物汤/丹栀逍遥散', acupoints: ['三阴交','太冲','肝俞','血海'], health_direction: '养血柔肝，清热平肝' },
      { hexagram: '晋', name: '火地晋', element: '火/土', organ: '心/脾', disease_hint: '晋卦主明出地上，心脾受益。失调则心脾两虚', tcm_link: '心脾两虚/心火亢盛', formula: '归脾汤/导赤散', acupoints: ['神门','心俞','脾俞','足三里'], health_direction: '补益心脾，清心泻火' }
    ],
    hexagram_to_syndrome_chain: function(hexagramName) {
      var list = this.hexagram_health;
      for (var i = 0; i < list.length; i++) {
        if (list[i].name.indexOf(hexagramName) !== -1 || list[i].hexagram === hexagramName) {
          var h = list[i];
          return {
            hexagram: h.hexagram,
            name: h.name,
            element: h.element,
            organ: h.organ,
            syndrome: h.tcm_link,
            formula: h.formula,
            acupoints: h.acupoints,
            direction: h.health_direction
          };
        }
      }
      return null;
    },
    prevention_stages: [
      {
        stage: '未病预防', principle: '上工治未病', method: '根据卦象所主脏腑，日常调理对应经络与饮食',
        template: '卦象{卦名}主{脏腑}，日常宜{养生方向}，食疗推荐{食材}，穴位保健{穴位}'
      },
      {
        stage: '初病防变', principle: '既病防变', method: '初起证候及时辨证施治，防止传变',
        template: '症状初起属{证候}，方用{方剂}，配合{穴位}针灸，防止传至{相关脏腑}'
      },
      {
        stage: '病中防逆', principle: '防其逆变', method: '密切观察病情变化，及时调整治疗方案',
        template: '病属{证候}，已用{方剂}，需观察{指标}，若变证出现则改用{备选方剂}'
      },
      {
        stage: '瘥后防复', principle: '瘥后防复', method: '病后调理体质，防止复发',
        template: '病后体质属{体质类型}，宜{调理方向}，方用{调理方}，配合{养生方法}防止复发'
      }
    ]
  };

  window.TCM_DIAGNOSIS_KB.tizhi_mingli_union = {
    title: '体质-命理联合分析',
    description: '九种体质与八字五行的对应关系，双重诊断与调理方案',
    tizhi_mingli_map: [
      {
        tizhi: '平和质', features: '体形匀称，面色红润，精力充沛，睡眠良好',
        wuxing: '五行均衡，无明显偏盛偏衰',
        diagnosis_template: '体质平和，八字五行均衡。维持现状，注意四时调养。',
        diet: '饮食均衡，五谷杂粮、五果五畜搭配', exercise: '适度运动，太极拳、八段锦', lifestyle: '起居有常，顺应四时'
      },
      {
        tizhi: '气虚质', features: '气短懒言，乏力自汗，易感冒',
        wuxing: '八字金土偏弱或火旺克金',
        diagnosis_template: '气虚体质，八字{金/土}弱。肺脾两虚，卫气不固。',
        diet: '多食黄芪、党参、山药、大枣', exercise: '缓和运动如散步、气功', lifestyle: '避免过度劳累，保证充足睡眠'
      },
      {
        tizhi: '阳虚质', features: '畏寒肢冷，面色苍白，大便溏薄',
        wuxing: '八字水旺火弱或金寒水冷',
        diagnosis_template: '阳虚体质，八字火弱水旺。肾阳不足，命门火衰。',
        diet: '多食羊肉、韭菜、生姜、核桃', exercise: '适量运动生阳，慢跑、站桩', lifestyle: '注意保暖，避免寒凉环境'
      },
      {
        tizhi: '阴虚质', features: '手足心热，口干咽燥，盗汗',
        wuxing: '八字火旺水弱或金弱不能生水',
        diagnosis_template: '阴虚体质，八字水弱火旺。肾阴不足，虚火内生。',
        diet: '多食百合、银耳、梨、枸杞', exercise: '柔和运动，瑜伽、冥想', lifestyle: '避免熬夜，忌辛辣燥热食物'
      },
      {
        tizhi: '痰湿质', features: '体形肥胖，腹部松软，痰多，身重',
        wuxing: '八字土旺水泛或湿气重',
        diagnosis_template: '痰湿体质，八字土湿偏重。脾虚湿盛，痰浊内阻。',
        diet: '多食薏米、冬瓜、陈皮、萝卜', exercise: '坚持有氧运动，游泳、快走', lifestyle: '饮食清淡，避免甜腻厚味'
      },
      {
        tizhi: '湿热质', features: '面垢油光，口苦口干，身重困倦',
        wuxing: '八字火土偏旺或湿与热并重',
        diagnosis_template: '湿热体质，八字火土旺。脾胃湿热，熏蒸肝胆。',
        diet: '多食绿豆、苦瓜、薏米、冬瓜', exercise: '中等强度运动，出汗排毒', lifestyle: '避免潮湿环境，忌酒及辛辣'
      },
      {
        tizhi: '血瘀质', features: '面色晦暗，口唇紫暗，易有瘀斑',
        wuxing: '八字金木相战或火旺血燥',
        diagnosis_template: '血瘀体质，八字金木不调。气滞血瘀，络脉不通。',
        diet: '多食山楂、桃仁、玫瑰花、藏红花', exercise: '促进血液循环的运动，太极剑', lifestyle: '保持心情舒畅，避免久坐'
      },
      {
        tizhi: '气郁质', features: '情志抑郁，胸胁胀满，善太息',
        wuxing: '八字木旺或金旺克木',
        diagnosis_template: '气郁体质，八字木偏旺或受克。肝郁气滞，情志不遂。',
        diet: '多食玫瑰花、佛手、柑橘、芹菜', exercise: '户外运动，登山、跑步', lifestyle: '保持心情舒畅，培养兴趣爱好'
      },
      {
        tizhi: '特禀质', features: '过敏体质，易患哮喘、鼻炎',
        wuxing: '八字五行驳杂或刑冲克害多',
        diagnosis_template: '特禀体质，八字五行驳杂。先天禀赋异常，卫外不固。',
        diet: '避免过敏原，多食灵芝、黄芪', exercise: '温和运动，避免剧烈运动', lifestyle: '远离过敏原，注意环境清洁'
      }
    ],
    seasonal_adjustment: [
      {
        season: '春季', element: '木', organ: '肝',
        advice: '春宜养肝，疏肝理气。用神为木者春季为调理佳期；用神为金者春季需防肝木过旺克土。',
        formula: '逍遥散/柴胡疏肝散加减', diet: '多食绿色蔬菜、芽菜'
      },
      {
        season: '夏季', element: '火', organ: '心',
        advice: '夏宜养心，清热消暑。用神为火者夏季为佳；用神为水者夏季需防心火过旺。',
        formula: '生脉饮/导赤散加减', diet: '多食苦瓜、莲子心、西瓜'
      },
      {
        season: '长夏', element: '土', organ: '脾',
        advice: '长夏宜健脾化湿。用神为土者长夏为佳；用神为水者需防湿土克水。',
        formula: '参苓白术散/藿香正气散加减', diet: '多食薏米、山药、扁豆'
      },
      {
        season: '秋季', element: '金', organ: '肺',
        advice: '秋宜养肺，润燥生津。用神为金者秋季为佳；用神为木者秋季需防金旺克木。',
        formula: '沙参麦冬汤/百合固金汤加减', diet: '多食梨、百合、银耳'
      },
      {
        season: '冬季', element: '水', organ: '肾',
        advice: '冬宜养肾，温补藏精。用神为水者冬季为佳；用神为火者冬季需防水旺克火。',
        formula: '金匮肾气丸/六味地黄丸加减', diet: '多食黑豆、黑芝麻、核桃'
      }
    ],
    union_diagnosis: function(tizhi, baziElement) {
      var map = this.tizhi_mingli_map;
      for (var i = 0; i < map.length; i++) {
        if (map[i].tizhi === tizhi) {
          return {
            tizhi: tizhi,
            bazi_element: baziElement,
            diagnosis: map[i].diagnosis_template,
            diet: map[i].diet,
            exercise: map[i].exercise,
            lifestyle: map[i].lifestyle,
            note: '体质与命理联合诊断：' + tizhi + '体质配合八字' + baziElement + '偏盛，需综合调理。'
          };
        }
      }
      return null;
    }
  };

  console.log('[tcm-diagnosis-kb.js] 已加载');
})();
