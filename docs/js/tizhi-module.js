// === 体质调理模块 ===
// New TZ_DATA for tizhi module - comprehensive health management
var TZ_DATA = {
  constitutions: [
    {key:'pinghe',name:'平和质',icon:'🌱',color:'#4CAF50',desc:'体型匀称、面色润泽、精力充沛',yangsheng:'均衡饮食，规律作息，适度运动。保持当前状态，避免偏嗜。'},
    {key:'qixu',name:'气虚质',icon:'🌪️',color:'#9C27B0',desc:'容易疲乏、气短懒言、易出汗',yangsheng:'补气健脾，多食黄芪、党参、山药、大枣。避免过度劳累。'},
    {key:'yangxu',name:'阳虚质',icon:'🌊',color:'#009688',desc:'畏寒怕冷、手脚冰凉、喜热饮',yangsheng:'温补阳气，多食羊肉、生姜、桂圆、韭菜。注意保暖，避免生冷。'},
    {key:'yinxu',name:'阴虚质',icon:'🔥',color:'#FF9800',desc:'口干咽燥、手足心热、盗汗',yangsheng:'滋阴润燥，多食银耳、百合、枸杞、麦冬。避免辛辣燥热。'},
    {key:'xueyu',name:'血虚质',icon:'🩸',color:'#F44336',desc:'面色苍白、头晕眼花、心悸失眠',yangsheng:'补血养血，多食红枣、当归、桂圆、黑芝麻。避免过度用眼。'},
    {key:'tanshi',name:'痰湿质',icon:'💧',color:'#2196F3',desc:'体型肥胖、腹部松软、口中黏腻',yangsheng:'化痰祛湿，多食薏仁、冬瓜、陈皮、白萝卜。加强运动，少食肥甘。'},
    {key:'shire',name:'湿热质',icon:'🌿',color:'#4CAF50',desc:'面部油光、口苦口臭、大便黏滞',yangsheng:'清热利湿，多食绿豆、苦瓜、冬瓜、薏仁。忌辛辣油腻烟酒。'},
    {key:'xueyu2',name:'血瘀质',icon:'🟣',color:'#795548',desc:'肤色偏暗、易有瘀斑、唇色紫暗',yangsheng:'活血化瘀，多食山楂、桃仁、红花、黑木耳。加强运动促进气血运行。'},
    {key:'qiyu',name:'气郁质',icon:'🔵',color:'#3F51B5',desc:'情绪低落、多愁善感、胸闷叹气',yangsheng:'疏肝理气，多食玫瑰、佛手、柑橘、薄荷。保持心情舒畅，多社交。'},
    {key:'tebing',name:'特禀质',icon:'🧬',color:'#795548',desc:'易过敏、鼻敏感、对药物/食物敏感',yangsheng:'益气固表，避免过敏原。多食益气食物如黄芪、防风、白术。'}
  ],
  questions: [
    {q:'您是否容易疲乏，精力不足？',scores:{qixu:2,yangxu:1}},
    {q:'您是否容易气短，说话无力？',scores:{qixu:2}},
    {q:'您是否容易手脚发凉，畏寒怕冷？',scores:{yangxu:2}},
    {q:'您是否口干咽燥，总想喝水？',scores:{yinxu:2,shire:1}},
    {q:'您是否容易出汗（白天自汗或夜间盗汗）？',scores:{qixu:1,yinxu:1}},
    {q:'您是否容易情绪低落、叹气或胸闷？',scores:{qiyu:2}},
    {q:'您是否皮肤或嘴唇颜色偏暗、有瘀斑？',scores:{xueyu2:2}},
    {q:'您是否容易长痘或面部油腻？',scores:{shire:2,tanshi:1}},
    {q:'您是否容易过敏（食物/药物/花粉）？',scores:{tebing:2}},
    {q:'您是否睡眠良好，精力充沛，适应力强？',scores:{pinghe:2}},
    {q:'您是否头晕眼花，面色偏白？',scores:{xueyu:2,qixu:1}},
    {q:'您是否体型偏胖，腹部松软，口中黏腻？',scores:{tanshi:2}},
    {q:'您是否口苦口臭，大便黏滞不爽？',scores:{shire:2}},
    {q:'您是否腰膝酸软，耳鸣脱发？',scores:{yangxu:1,yinxu:1}},
    {q:'您是否食欲不振，腹胀便溏？',scores:{qixu:1,tanshi:1}}
  ],
  // 名医名方库
  famousPrescriptions: [
    {name:'四君子汤',source:'《太平惠民和剂局方》',constitutions:['气虚'],composition:'人参、白术、茯苓、甘草',effect:'益气健脾',usage:'适用于脾胃气虚证，食少便溏、四肢乏力',category:'补益剂'},
    {name:'补中益气汤',source:'《脾胃论》李东垣',constitutions:['气虚'],composition:'黄芪、人参、白术、炙甘草、当归、陈皮、升麻、柴胡',effect:'补中益气，升阳举陷',usage:'适用于脾胃气虚下陷证，内脏下垂、久泻',category:'补益剂'},
    {name:'四物汤',source:'《仙授理伤续断秘方》',constitutions:['血虚'],composition:'熟地黄、白芍、当归、川芎',effect:'补血调血',usage:'适用于营血虚滞证，面色无华、月经不调',category:'补血剂'},
    {name:'八珍汤',source:'《正体类要》',constitutions:['气虚','血虚'],composition:'人参、白术、茯苓、甘草、熟地、白芍、当归、川芎',effect:'气血双补',usage:'适用于气血两虚证，面色苍白、气短懒言',category:'气血双补'},
    {name:'十全大补汤',source:'《太平惠民和剂局方》',constitutions:['气虚','血虚','阳虚'],composition:'八珍汤加黄芪、肉桂',effect:'温补气血',usage:'适用于气血两虚兼阳虚证',category:'气血双补'},
    {name:'六味地黄丸',source:'《小儿药证直诀》钱乙',constitutions:['阴虚'],composition:'熟地黄、山茱萸、山药、泽泻、茯苓、牡丹皮',effect:'滋阴补肾',usage:'适用于肾阴虚证，腰膝酸软、头晕耳鸣',category:'补阴剂'},
    {name:'金匮肾气丸',source:'《金匮要略》张仲景',constitutions:['阳虚'],composition:'干地黄、山茱萸、山药、泽泻、茯苓、牡丹皮、桂枝、附子',effect:'温补肾阳',usage:'适用于肾阳不足证，畏寒肢冷、小便不利',category:'补阳剂'},
    {name:'逍遥散',source:'《太平惠民和剂局方》',constitutions:['气郁'],composition:'柴胡、当归、白芍、白术、茯苓、甘草、薄荷、生姜',effect:'疏肝解郁，健脾养血',usage:'适用于肝郁脾虚证，胸胁胀痛、情绪抑郁',category:'和解剂'},
    {name:'二陈汤',source:'《太平惠民和剂局方》',constitutions:['痰湿'],composition:'半夏、橘红、茯苓、甘草',effect:'燥湿化痰，理气和中',usage:'适用于湿痰证，咳嗽痰多、胸膈痞闷',category:'祛痰剂'},
    {name:'龙胆泻肝汤',source:'《医方集解》',constitutions:['湿热'],composition:'龙胆草、黄芩、栀子、泽泻、木通、车前子、当归、生地、柴胡、甘草',effect:'泻肝胆实火，清下焦湿热',usage:'适用于肝胆湿热证，口苦目赤、尿赤涩痛',category:'清热剂'},
    {name:'血府逐瘀汤',source:'《医林改错》王清任',constitutions:['血瘀'],composition:'桃仁、红花、当归、生地、川芎、赤芍、牛膝、桔梗、柴胡、枳壳、甘草',effect:'活血化瘀，行气止痛',usage:'适用于胸中血瘀证，胸痛头痛、失眠多梦',category:'理血剂'},
    {name:'玉屏风散',source:'《医方类聚》',constitutions:['气虚','特禀'],composition:'黄芪、白术、防风',effect:'益气固表止汗',usage:'适用于表虚不固证，易感冒、自汗',category:'固涩剂'},
    {name:'酸枣仁汤',source:'《金匮要略》张仲景',constitutions:['阴虚','气郁'],composition:'酸枣仁、甘草、知母、茯苓、川芎',effect:'养血安神，清热除烦',usage:'适用于虚劳虚烦不得眠',category:'安神剂'},
    {name:'桂枝汤',source:'《伤寒论》张仲景',constitutions:['平和','阳虚'],composition:'桂枝、芍药、生姜、大枣、炙甘草',effect:'解肌发表，调和营卫',usage:'适用于外感风寒表虚证',category:'解表剂'},
    {name:'理中丸',source:'《伤寒论》张仲景',constitutions:['阳虚'],composition:'人参、干姜、白术、炙甘草',effect:'温中祛寒，补气健脾',usage:'适用于脾胃虚寒证，腹痛便溏、不欲饮食',category:'温里剂'},
    {name:'归脾汤',source:'《济生方》严用和',constitutions:['气虚','血虚'],composition:'人参、黄芪、白术、茯神、酸枣仁、龙眼肉、木香、炙甘草、当归、远志',effect:'益气补血，健脾养心',usage:'适用于心脾两虚证，心悸失眠、食少体倦',category:'补血剂'}
  ],
  // 功法库
  qigongMethods: [
    {name:'八段锦',type:'导引功法',difficulty:'入门',duration:'15-20分钟',constitutions:['气虚','气郁','血瘀'],
     desc:'八段锦由八节动作组成，柔和缓慢、圆活连贯，适合各年龄段练习',
     steps:'1.两手托天理三焦 2.左右开弓似射雕 3.调理脾胃须单举 4.五劳七伤往后瞧 5.摇头摆尾去心火 6.两手攀足固肾腰 7.攒拳怒目增气力 8.背后七颠百病消',
     benefit:'调理脏腑、疏通经络、强身健体',
     caution:'饭后一小时内不宜练习，动作宜柔和'},
    {name:'太极拳',type:'内家拳法',difficulty:'进阶',duration:'20-40分钟',constitutions:['气虚','阴虚','气郁'],
     desc:'太极拳以柔克刚、以静制动，动作如行云流水，注重意气形合一',
     steps:'起势→野马分鬃→白鹤亮翅→搂膝拗步→手挥琵琶→倒卷肱→左右穿梭→海底针→闪通臂→收势',
     benefit:'增强心肺功能、改善平衡、调节神经系统',
     caution:'膝盖有损伤者注意动作幅度，避免低架'},
    {name:'六字诀',type:'呼吸吐纳',difficulty:'入门',duration:'10-15分钟',constitutions:['气郁','湿热','痰湿'],
     desc:'通过六种不同口型呼气，对应五脏六腑，吐故纳新',
     steps:'嘘（肝）→呵（心）→呼（脾）→呬（肺）→吹（肾）→嘻（三焦）',
     benefit:'调理五脏、泻腑实、补脏虚',
     caution:'空腹或饭后一小时内不宜练习'},
    {name:'五禽戏',type:'导引功法',difficulty:'入门',duration:'15-25分钟',constitutions:['气虚','阳虚','血瘀'],
     desc:'模仿虎、鹿、熊、猿、鸟五种动物姿态，华佗所创',
     steps:'虎戏（虎举、虎扑）→鹿戏（鹿抵、鹿奔）→熊戏（熊运、熊晃）→猿戏（猿提、猿摘）→鸟戏（鸟伸、鸟飞）',
     benefit:'强筋健骨、疏通经络、灵活关节',
     caution:'关节炎症急性期慎练'},
    {name:'易筋经',type:'导引功法',difficulty:'进阶',duration:'20-30分钟',constitutions:['气虚','阳虚','血瘀'],
     desc:'十二势易筋经，以形体屈伸俯仰为特点，强壮筋骨',
     steps:'韦驮献杵三势→摘星换斗→倒拽九牛尾→出爪亮翅→九鬼拔马刀→三盘落地→青龙探爪→卧虎扑食→打躬击鼓→掉尾势',
     benefit:'伸筋拔骨、强健肌肉、畅通气血',
     caution:'高血压患者动作宜缓慢，避免屏气'},
    {name:'站桩',type:'静功',difficulty:'入门',duration:'10-30分钟',constitutions:['气虚','阳虚','阴虚'],
     desc:'以静站为主，外形不动而内气运行，是内功基本功',
     steps:'自然站立，两脚与肩同宽，微屈膝，双手抱球于胸前，舌抵上腭，自然呼吸',
     benefit:'培养内气、增强体质、安定心神',
     caution:'初次练习不宜超过15分钟，循序渐进'},
    {name:'正念冥想',type:'静心修习',difficulty:'入门',duration:'10-20分钟',constitutions:['气郁','阴虚','血虚'],
     desc:'源自佛教禅修，以觉知当下为核心，不评判不执着',
     steps:'1.选择安静环境盘坐或椅坐 2.闭目或微闭 3.觉知呼吸进出 4.观察念头来去不追随 5.身体扫描从头到脚 6.慈心祝愿',
     benefit:'减轻焦虑抑郁、改善睡眠、增强专注力、降低血压',
     caution:'精神疾病急性期不宜单独练习'},
    {name:'腹式呼吸',type:'呼吸训练',difficulty:'入门',duration:'5-10分钟',constitutions:['气虚','气郁','特禀'],
     desc:'以腹部起伏为主的深呼吸法，激活副交感神经',
     steps:'仰卧或端坐，一手放胸一手放腹，鼻吸气时腹部隆起，口呼气时腹部凹陷，呼吸比约1:2',
     benefit:'缓解压力、改善睡眠、增强肺活量、按摩内脏',
     caution:'头晕时恢复正常呼吸，不要过度换气'}
  ],
  recipes: [
    {name:'莲子百合红枣粥',organ:'Huo',constitutions:['阴虚','血虚'],ingredients:'莲子30g、百合15g、红枣5颗、粳米100g',method:'莲子、百合提前浸泡1小时，与红枣、粳米同煮成粥',effect:'养心安神，滋阴润燥'},
    {name:'酸枣仁茯苓茶',organ:'Huo',constitutions:['阴虚','气虚'],ingredients:'酸枣仁15g、茯苓10g、知母6g',method:'水煎服，睡前2小时服用',effect:'养心安神，改善失眠'},
    {name:'桂圆红枣茶',organ:'Huo',constitutions:['血虚','阳虚'],ingredients:'桂圆10g、红枣5颗、枸杞5g',method:'沸水冲泡，焖10分钟',effect:'补益心血，安神定悸'},
    {name:'苦瓜莲心茶',organ:'Huo',constitutions:['阴虚','湿热'],ingredients:'苦瓜干片10g、莲子心3g',method:'沸水冲泡，凉后饮用',effect:'清心泻火'},
    {name:'枸杞菊花明目茶',organ:'Mu',constitutions:['阴虚','血虚'],ingredients:'枸杞10g、菊花5g、决明子5g',method:'沸水冲泡，每日1-2杯',effect:'清肝明目，滋补肝肾'},
    {name:'芹菜绿豆汤',organ:'Mu',constitutions:['湿热','阳虚'],ingredients:'鲜芹菜200g、绿豆30g',method:'绿豆半熟加芹菜煮20分钟',effect:'清肝泻火，平肝降压'},
    {name:'玫瑰佛手茶',organ:'Mu',constitutions:['气郁','痰湿'],ingredients:'玫瑰花6g、佛手6g、陈皮3g',method:'沸水冲泡代茶饮',effect:'疏肝理气，解郁安神'},
    {name:'柴胡白芍疏肝茶',organ:'Mu',constitutions:['气郁','阴虚'],ingredients:'柴胡5g、白芍10g、甘草3g',method:'水煎服',effect:'疏肝解郁，调和肝脾'},
    {name:'小米山药莲子粥',organ:'Tu',constitutions:['气虚','阳虚'],ingredients:'小米100g、山药50g、莲子15g',method:'同煮成粥，早晨空腹',effect:'健脾益气，和胃止泻'},
    {name:'四神汤',organ:'Tu',constitutions:['痰湿','气虚'],ingredients:'茯苓15g、山药30g、莲子15g、芡实15g',method:'炖汤或煮粥',effect:'健脾祛湿，固涩止泻'},
    {name:'陈皮生姜红茶',organ:'Tu',constitutions:['阳虚','痰湿'],ingredients:'陈皮5g、生姜3片、红茶3g',method:'沸水冲泡，晨起饮用',effect:'温中健脾，理气化湿'},
    {name:'黄芪党参鸡汤',organ:'Tu',constitutions:['气虚','阳虚'],ingredients:'黄芪20g、党参15g、鸡肉200g',method:'炖汤2小时',effect:'补中益气，健脾养胃'},
    {name:'川贝母蒸梨',organ:'Jin',constitutions:['阴虚','痰湿'],ingredients:'雪梨1个、川贝粉3g、冰糖少许',method:'梨去核填料蒸30分钟',effect:'润肺止咳，清热化痰'},
    {name:'百合银耳莲子羹',organ:'Jin',constitutions:['阴虚','血虚'],ingredients:'百合15g、银耳10g、莲子10g',method:'银耳泡发同煮成羹',effect:'滋阴润肺，养心安神'},
    {name:'白萝卜蜂蜜饮',organ:'Jin',constitutions:['痰湿','湿热'],ingredients:'白萝卜200g、蜂蜜30ml',method:'萝卜榨汁加蜂蜜',effect:'顺气化痰，润肠通便'},
    {name:'黄芪百合粥',organ:'Jin',constitutions:['气虚','阳虚'],ingredients:'黄芪20g、百合15g、粳米100g',method:'黄芪煎汁煮粥',effect:'益气固表，润肺止咳'},
    {name:'黑豆核桃枸杞粥',organ:'Shui',constitutions:['阴虚','血虚'],ingredients:'黑豆30g、核桃仁15g、枸杞10g',method:'黑豆泡发同煮',effect:'补肾益精，填髓乌发'},
    {name:'杜仲桑寄生茶',organ:'Shui',constitutions:['阳虚','气虚'],ingredients:'杜仲15g、桑寄生15g、红枣5颗',method:'水煎服',effect:'补肾强腰，祛风除湿'},
    {name:'肉桂红糖姜茶',organ:'Shui',constitutions:['阳虚','气虚'],ingredients:'肉桂3g、红糖15g、生姜3片',method:'沸水冲泡，晨起温服',effect:'温肾助阳，散寒止痛'},
    {name:'枸杞桑葚茶',organ:'Shui',constitutions:['阴虚','血虚'],ingredients:'枸杞10g、桑葚干15g',method:'沸水冲泡反复饮用',effect:'滋补肝肾，益精明目'}
  ],
  exercises: [
    {name:'快走',type:'有氧运动',duration:30,intensity:'低',calories:150,notes:'适合大多数人群'},
    {name:'慢跑',type:'有氧运动',duration:30,intensity:'中',calories:250,notes:'膝盖不适者改快走'},
    {name:'游泳',type:'有氧运动',duration:30,intensity:'中',calories:300,notes:'对关节友好'},
    {name:'骑车',type:'有氧运动',duration:40,intensity:'中',calories:280,notes:'户外或动感单车'},
    {name:'跳绳',type:'有氧运动',duration:15,intensity:'高',calories:200,notes:'注意膝盖保护'},
    {name:'深蹲',type:'力量训练',duration:10,intensity:'中',calories:80,notes:'膝盖不超过脚尖'},
    {name:'俯卧撑',type:'力量训练',duration:10,intensity:'中',calories:60,notes:'初学者可跪姿'},
    {name:'平板支撑',type:'力量训练',duration:5,intensity:'中',calories:40,notes:'保持身体一条线'},
    {name:'哑铃训练',type:'力量训练',duration:20,intensity:'中',calories:120,notes:'注意动作规范'},
    {name:'八段锦',type:'柔韧训练',duration:20,intensity:'低',calories:80,notes:'传统养生功法'},
    {name:'太极拳',type:'柔韧训练',duration:30,intensity:'低',calories:100,notes:'缓慢柔和，调节身心'},
    {name:'瑜伽',type:'柔韧训练',duration:30,intensity:'低',calories:120,notes:'注意呼吸配合'},
    {name:'拉伸',type:'柔韧训练',duration:15,intensity:'低',calories:30,notes:'运动前后均应进行'},
    {name:'腹式呼吸',type:'呼吸训练',duration:10,intensity:'低',calories:10,notes:'放松身心，改善焦虑'},
    {name:'六字诀',type:'呼吸训练',duration:15,intensity:'低',calories:20,notes:'对应五脏六腑'},
    {name:'冥想',type:'呼吸训练',duration:15,intensity:'低',calories:15,notes:'减轻压力，改善睡眠'}
  ],
  wuxing: {
    Mu:{name:'木',icon:'🌳',color:'#27ae60',season:'春',direction:'东',taste:'酸',organs:['肝','胆'],sense:'目',tissue:'筋',emotion:'怒',
      symptoms:['头痛眩晕','眼睛干涩','易怒烦躁','两肋胀痛','指甲脆弱','高血压'],
      foods:['芹菜','韭菜','绿豆','菠菜','猕猴桃','柠檬','山楂','菊花','枸杞叶'],
      herbs:['柴胡','白芍','当归','川芎','枸杞','决明子','天麻','钩藤','薄荷','茵陈'],
      regimen:'春季养肝，早睡早起，少生气。肝经当令丑时(1-3点)务必入睡。青色入肝，酸味收敛肝气。',
      avoid:'忌过度饮酒、熬夜、暴怒、油腻'},
    Huo:{name:'火',icon:'🔥',color:'#e74c3c',season:'夏',direction:'南',taste:'苦',organs:['心','小肠'],sense:'舌',tissue:'脉',emotion:'喜',
      symptoms:['心悸失眠','口腔溃疡','舌尖红赤','多汗','胸闷','面色潮红'],
      foods:['苦瓜','莲子','百合','西瓜','红豆','番茄','红枣','桂圆','菊花'],
      herbs:['丹参','黄连','莲子心','酸枣仁','麦冬','五味子','柏子仁','生地','竹叶'],
      regimen:'夏季养心，午睡半小时。心经当令午时(11-13点)宜小憩。红色入心，苦味降心火。',
      avoid:'忌过量咖啡浓茶、剧烈运动出汗过多、大悲大喜'},
    Tu:{name:'土',icon:'⛰️',color:'#f39c12',season:'长夏',direction:'中',taste:'甘',organs:['脾','胃'],sense:'口',tissue:'肉',emotion:'思',
      symptoms:['食欲不振','腹胀腹泻','面色萎黄','四肢乏力','水肿','大便稀溏'],
      foods:['小米','山药','薏仁','红枣','南瓜','土豆','扁豆','莲子','茯苓','陈皮'],
      herbs:['党参','白术','茯苓','甘草','陈皮','砂仁','苍术','黄芪','薏苡仁'],
      regimen:'长夏养脾，饮食定时定量，少吃生冷。脾经当令巳时(9-11点)进食早餐最佳。黄色入脾。',
      avoid:'忌生冷寒凉、暴饮暴食、思虑过度、久坐'},
    Jin:{name:'金',icon:'🪙',color:'#90a4ae',season:'秋',direction:'西',taste:'辛',organs:['肺','大肠'],sense:'鼻',tissue:'皮毛',emotion:'悲',
      symptoms:['咳嗽痰多','鼻塞流涕','皮肤干燥','咽喉肿痛','便秘','易感冒'],
      foods:['白萝卜','梨','百合','银耳','山药','杏仁','莲藕','枇杷','蜂蜜'],
      herbs:['川贝母','百合','麦冬','沙参','杏仁','桔梗','枇杷叶','桑白皮','玉竹'],
      regimen:'秋季养肺，早卧早起，多做深呼吸。肺经当令寅时(3-5点)宜深度睡眠。白色入肺。',
      avoid:'忌吸烟、辛辣过量、悲伤忧郁、空调直吹'},
    Shui:{name:'水',icon:'💧',color:'#3498db',season:'冬',direction:'北',taste:'咸',organs:['肾','膀胱'],sense:'耳',tissue:'骨',emotion:'恐',
      symptoms:['腰膝酸软','耳鸣耳聋','畏寒肢冷','夜尿频多','脱发白发','记忆力减退'],
      foods:['黑豆','黑芝麻','核桃','海参','紫菜','桑葚','板栗','羊肉','韭菜','山药'],
      herbs:['熟地黄','山药','山茱萸','枸杞子','杜仲','肉桂','淫羊藿','补骨脂','菟丝子'],
      regimen:'冬季养肾，早卧晚起，必待日光。肾经当令酉时(17-19点)宜按摩腰部。黑色入肾。',
      avoid:'忌过度劳累、房事不节、长时间站立、恐惧惊吓、高盐饮食'}
  },
  baziMap: {
    '甲乙木':{wuxing:'木',tizhi:'气郁质倾向',desc:'日主属木，肝气偏旺，易情绪波动。宜疏肝理气，多食绿色食物。'},
    '丙丁火':{wuxing:'火',tizhi:'阴虚质倾向',desc:'日主属火，心火易亢，口干心烦。宜滋阴降火，多食苦味清心。'},
    '戊己土':{wuxing:'土',tizhi:'痰湿质倾向',desc:'日主属土，脾胃关键，易生痰湿。宜健脾祛湿，多食黄色食物。'},
    '庚辛金':{wuxing:'金',tizhi:'气虚质倾向',desc:'日主属金，肺气不足，易感冒乏力。宜益气固表，多食白色食物。'},
    '壬癸水':{wuxing:'水',tizhi:'阳虚质倾向',desc:'日主属水，肾阳偏弱，畏寒怕冷。宜温补肾阳，多食黑色食物。'}
  },
  // 节气食疗库 — 体质×节气联动
  seasonalFoods: {
    '春': {
      jieqi: '立春/雨水/惊蛰/春分/清明/谷雨',
      principle: '春季养肝，宜省酸增甘，以养脾气',
      foods: ['韭菜','菠菜','荠菜','春笋','香椿','豌豆苗','枸杞芽'],
      byTizhi: {
        '气虚': '黄芪炖鸡、山药粥、红枣小米粥',
        '阴虚': '枸杞菊花茶、银耳羹、菠菜猪肝汤',
        '气郁': '玫瑰花茶、佛手柑茶、芹菜炒百合',
        '湿热': '绿豆汤、荠菜豆腐汤、马齿苋粥'
      }
    },
    '夏': {
      jieqi: '立夏/小满/芒种/夏至/小暑/大暑',
      principle: '夏季养心，宜清淡祛湿，多食苦味',
      foods: ['苦瓜','西瓜','绿豆','冬瓜','黄瓜','番茄','莲子'],
      byTizhi: {
        '湿热': '苦瓜排骨汤、绿豆薏仁粥、冬瓜海带汤',
        '阴虚': '银耳莲子羹、百合绿豆汤、酸梅汤',
        '痰湿': '薏仁红豆汤、陈皮山楂茶、荷叶粥',
        '气虚': '西洋参麦冬茶、莲子山药粥、黄芪鸭汤'
      }
    },
    '秋': {
      jieqi: '立秋/处暑/白露/秋分/寒露/霜降',
      principle: '秋季养肺，宜滋阴润燥，多食白色食物',
      foods: ['梨','百合','银耳','山药','白萝卜','莲藕','蜂蜜'],
      byTizhi: {
        '阴虚': '川贝炖雪梨、银耳百合羹、沙参麦冬汤',
        '气虚': '黄芪山药粥、红枣银耳羹、参须炖梨',
        '血虚': '当归生姜羊肉汤、桂圆红枣茶、黑芝麻糊',
        '气郁': '佛手柑泡茶、金桔蜜饯、柚子茶'
      }
    },
    '冬': {
      jieqi: '立冬/小雪/大雪/冬至/小寒/大寒',
      principle: '冬季养肾，宜温补藏精，多食黑色食物',
      foods: ['黑豆','黑芝麻','核桃','羊肉','桂圆','栗子','枸杞'],
      byTizhi: {
        '阳虚': '当归生姜羊肉汤、杜仲炖腰花、桂圆红枣茶',
        '气虚': '黄芪炖鸡、人参核桃粥、山药羊肉汤',
        '血虚': '阿胶糕、当归羊肉汤、黑芝麻核桃糊',
        '阴虚': '六味地黄丸食疗方、枸杞银耳羹、黑豆排骨汤'
      }
    }
  },
  // 体质食疗方案库（本地降级方案，AI不可用时使用）
  foodTherapy: {
    '气虚': [
      {name:'黄芪炖鸡',ingredients:'黄芪30g、母鸡1只、红枣10枚、生姜3片',method:'鸡洗净焯水，与黄芪红枣生姜同炖2小时，加盐调味',effect:'补中益气，健脾养胃'},
      {name:'山药小米粥',ingredients:'山药100g、小米50g、红枣5枚',method:'山药切块与小米红枣同煮为粥',effect:'健脾益气，养胃安神'},
      {name:'参苓白术粥',ingredients:'党参15g、茯苓15g、白术10g、大米50g',method:'药材煎汁去渣，用药汁煮粥',effect:'益气健脾，祛湿止泻'}
    ],
    '阳虚': [
      {name:'当归生姜羊肉汤',ingredients:'当归20g、生姜30g、羊肉500g',method:'羊肉焯水，与当归生姜同炖2小时',effect:'温阳散寒，补血止痛'},
      {name:'韭菜炒核桃',ingredients:'韭菜200g、核桃仁50g',method:'核桃仁先炒至微焦，加韭菜快炒',effect:'温补肾阳，固精壮腰'},
      {name:'桂圆红枣茶',ingredients:'桂圆肉15g、红枣10枚、生姜3片',method:'加水煮沸后小火煮15分钟',effect:'温阳补血，健脾暖胃'}
    ],
    '阴虚': [
      {name:'银耳百合羹',ingredients:'银耳1朵、百合30g、冰糖适量',method:'银耳泡发撕碎，与百合同煮至浓稠，加冰糖',effect:'滋阴润肺，养心安神'},
      {name:'枸杞菊花茶',ingredients:'枸杞15g、菊花10g',method:'沸水冲泡代茶饮',effect:'滋补肝肾，清肝明目'},
      {name:'沙参玉竹老鸭汤',ingredients:'北沙参30g、玉竹30g、老鸭半只',method:'鸭肉焯水，与沙参玉竹同炖2小时',effect:'养阴润燥，生津止渴'}
    ],
    '痰湿': [
      {name:'薏仁红豆汤',ingredients:'薏仁50g、红豆50g',method:'浸泡4小时后同煮至烂',effect:'健脾祛湿，利水消肿'},
      {name:'陈皮山楂茶',ingredients:'陈皮10g、山楂15g',method:'沸水冲泡代茶饮',effect:'理气化痰，消食导滞'},
      {name:'冬瓜海带汤',ingredients:'冬瓜200g、海带50g',method:'冬瓜切块与海带同煮20分钟',effect:'清热利湿，化痰软坚'}
    ],
    '湿热': [
      {name:'绿豆薏仁粥',ingredients:'绿豆50g、薏仁50g、大米30g',method:'同煮为粥',effect:'清热利湿，解毒消暑'},
      {name:'苦瓜排骨汤',ingredients:'苦瓜1根、排骨300g',method:'排骨焯水，苦瓜切块同炖1小时',effect:'清热解毒，祛湿降火'},
      {name:'马齿苋凉拌',ingredients:'马齿苋200g、蒜蓉适量',method:'马齿苋焯水，加蒜蓉调料拌匀',effect:'清热解毒，凉血止血'}
    ],
    '气郁': [
      {name:'玫瑰花茶',ingredients:'干玫瑰花10朵',method:'沸水冲泡代茶饮',effect:'疏肝理气，活血散瘀'},
      {name:'佛手柑泡茶',ingredients:'佛手柑片10g',method:'沸水冲泡代茶饮',effect:'疏肝理气，和胃化痰'},
      {name:'金桔蜜饯',ingredients:'金桔500g、蜂蜜200g',method:'金桔划口，与蜂蜜同煮至浓稠',effect:'理气解郁，化痰止咳'}
    ],
    '血瘀': [
      {name:'山楂红糖水',ingredients:'山楂30g、红糖20g',method:'山楂煎水去渣，加红糖',effect:'活血化瘀，消食化积'},
      {name:'黑木耳红枣汤',ingredients:'黑木耳20g、红枣10枚',method:'同煮30分钟',effect:'活血补血，养颜润肤'},
      {name:'桃仁粥',ingredients:'桃仁10g、大米50g',method:'桃仁研碎与米同煮为粥',effect:'活血祛瘀，润肠通便'}
    ],
    '血虚': [
      {name:'当归羊肉汤',ingredients:'当归20g、羊肉300g、生姜3片',method:'同炖2小时',effect:'补血活血，温经散寒'},
      {name:'桂圆红枣粥',ingredients:'桂圆肉20g、红枣10枚、大米50g',method:'同煮为粥',effect:'补血养心，健脾安神'},
      {name:'黑芝麻核桃糊',ingredients:'黑芝麻50g、核桃30g、糯米20g',method:'炒熟后磨粉，加水煮糊',effect:'补血补肾，乌发润肠'}
    ],
    '特禀': [
      {name:'黄芪防风茶',ingredients:'黄芪20g、防风10g、白术10g',method:'煎水代茶饮',effect:'益气固表，抗过敏'},
      {name:'山药粥',ingredients:'山药100g、大米50g',method:'山药切块与米同煮',effect:'健脾益气，增强免疫'}
    ],
    '平和': [
      {name:'四物汤炖鸡',ingredients:'当归10g、川芎5g、白芍10g、熟地15g、鸡半只',method:'同炖2小时',effect:'补血调血，日常保健'},
      {name:'五谷杂粮粥',ingredients:'黑米、红豆、绿豆、薏仁、燕麦各20g',method:'浸泡后同煮为粥',effect:'营养均衡，健脾养胃'}
    ]
  }
};
;
;

function tzSwitchTab(name){
  var allTabs = ['report','selftest','plan','food','qigong','prescription','bazi','checkin','wuxing'];
  allTabs.forEach(function(t){
    var panel=document.getElementById('tz-tab-'+t);
    var btn=document.getElementById('tzTab-'+t);
    if(panel) panel.style.display = (t===name)?'block':'none';
    if(btn){
      if(t===name){btn.style.background='var(--title)';btn.style.color='#fff';btn.style.fontWeight='600';}
      else{btn.style.background='transparent';btn.style.color='var(--muted)';btn.style.fontWeight='400';}
    }
  });
  if(name==='selftest' && !document.getElementById('tzQuestionnaire').innerHTML) tzRenderQuestionnaire();
  if(name==='food' && !document.getElementById('tzFoodList').innerHTML) tzRenderFood('all');
  if(name==='qigong') tzRenderQigong();
  if(name==='prescription') tzRenderPrescriptions();
  if(name==='plan') tzPopulatePlanSelect();
  if(name==='checkin') tzRenderCheckin();
  if(name==='wuxing' && !document.getElementById('tzWuxingDetail').innerHTML) {tzSelectWuxing('Mu');tzRenderWxButtons();}
}

function tzPopulatePlanSelect(){
  var sel=document.getElementById('tzPlanTizhi');
  if(!sel) return;
  // Check if already populated
  if(sel.options.length>1) return;
  TZ_DATA.constitutions.forEach(function(c){
    var opt=document.createElement('option');
    opt.value=c.key;opt.textContent=c.icon+' '+c.name;
    sel.appendChild(opt);
  });
  // Try to get last result
  try{
    var last=window._tzLastResult;
    if(last && last.key){sel.value=last.key;}
  }catch(e){}
}

function tzGeneratePlan(){
  var sel=document.getElementById('tzPlanTizhi');
  var tizhiKey=sel.value;
  if(!tizhiKey){showToast('请先选择体质类型');return;}
  var cons=TZ_DATA.constitutions.find(function(c){return c.key===tizhiKey;});
  if(!cons) return;
  var result=document.getElementById('tzPlanResult');
  result.style.display='block';
  result.innerHTML='<div style="text-align:center;padding:30px"><div style="font-size:32px;margin-bottom:16px;animation:spin 2s linear infinite">🎯</div><div style="font-size:16px;color:var(--gold);margin-bottom:8px">AI正在生成您的综合养生方案...</div><div style="font-size:13px;color:var(--paper2)">基于' + cons.name + '体质特征</div></div>';

  // Build context for AI
  var wuKey={木:'Mu',火:'Huo',土:'Tu',金:'Jin',水:'Shui'}[cons.yangsheng.match(/[木火土金水]/)?cons.yangsheng.match(/[木火土金水]/)[0]:'土'];
  var prompt='你是中医养生专家。请为"' + cons.name + '"体质的人生成一份综合养生方案。\n';
  prompt+='体质特征：' + cons.desc + '\n';
  prompt+='基本养生原则：' + cons.yangsheng + '\n\n';
  prompt+='请从以下四个维度给出具体方案：\n';
  prompt+='1. 中医食疗（推荐3-5道食疗方，含食材和做法）\n';
  prompt+='2. 功法锻炼（推荐2-3种适合的功法，说明理由）\n';
  prompt+='3. 正念修习（推荐冥想/呼吸/禅修方法）\n';
  prompt+='4. 起居调摄（作息/穴位/注意事项）\n\n';
  prompt+='用JSON格式回复：{"食疗":[{"名称":"...","食材":"...","做法":"...","功效":"..."}],"功法":[{"名称":"...","理由":"...","时长":"..."}],"正念":[{"方法":"...","步骤":"...","益处":"..."}],"起居":[{"方面":"...","建议":"..."}],"总结":"..."}';

  fetch((location.hostname === '127.0.0.1' || location.hostname === 'localhost' ? 'http://127.0.0.1:8900' : '') + '/v1/chat/completions',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({model:'openclaw',messages:[{role:'user',content:prompt}],max_tokens:2000,temperature:0.4})
  }).then(function(r){return r.json();}).then(function(data){
    var text=data.choices&&data.choices[0]&&data.choices[0].message&&data.choices[0].message.content||'';
    var jsonMatch=text.match(/\{[\s\S]+\}/);
    var obj=null;
    if(jsonMatch){try{obj=JSON.parse(jsonMatch[0]);}catch(e){obj=null;}}
    if(!obj){
      result.innerHTML='<div style="background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:12px;padding:20px"><div style="font-size:14px;color:var(--text);line-height:1.8;white-space:pre-wrap">'+text+'</div></div>';
      return;
    }
    var html='<div style="background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:12px;padding:24px">';
    // Header
    html+='<div style="text-align:center;margin-bottom:20px"><div style="font-size:48px">'+cons.icon+'</div><div style="font-size:20px;color:'+cons.color+';font-weight:bold;margin-top:8px">'+cons.name+' · 综合养生方案</div><div style="font-size:13px;color:var(--paper2);margin-top:6px">'+cons.desc+'</div></div>';
    // 食疗
    if(obj.食疗&&obj.食疗.length){
      html+='<div style="background:rgba(45,106,79,0.06);border-left:3px solid var(--success);padding:16px;border-radius:0 10px 10px 0;margin-bottom:14px"><div style="font-size:15px;color:var(--success);font-weight:bold;margin-bottom:12px">🍵 中医食疗</div>';
      obj.食疗.forEach(function(r){html+='<div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:12px;margin-bottom:8px"><div style="font-size:14px;color:var(--gold);font-weight:bold;margin-bottom:4px">'+r.名称+'</div><div style="font-size:12px;color:var(--paper2);margin-bottom:4px"><b>食材：</b>'+r.食材+'</div><div style="font-size:12px;color:var(--paper2);margin-bottom:4px"><b>做法：</b>'+r.做法+'</div><div style="font-size:12px;color:var(--success)"><b>功效：</b>'+r.功效+'</div></div>';});
      html+='</div>';
    }
    // 功法
    if(obj.功法&&obj.功法.length){
      html+='<div style="background:rgba(201,168,76,0.06);border-left:3px solid var(--gold);padding:16px;border-radius:0 10px 10px 0;margin-bottom:14px"><div style="font-size:15px;color:var(--gold);font-weight:bold;margin-bottom:12px">🧘 功法锻炼</div>';
      obj.功法.forEach(function(r){html+='<div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:12px;margin-bottom:8px"><div style="font-size:14px;color:var(--gold);font-weight:bold;margin-bottom:4px">'+r.名称+' <span style="font-size:12px;color:var(--muted)">（'+r.时长+'）</span></div><div style="font-size:12px;color:var(--paper2)">'+r.理由+'</div></div>';});
      html+='</div>';
    }
    // 正念
    if(obj.正念&&obj.正念.length){
      html+='<div style="background:rgba(155,89,182,0.06);border-left:3px solid #9b59b6;padding:16px;border-radius:0 10px 10px 0;margin-bottom:14px"><div style="font-size:15px;color:#9b59b6;font-weight:bold;margin-bottom:12px">🧠 正念修习</div>';
      obj.正念.forEach(function(r){html+='<div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:12px;margin-bottom:8px"><div style="font-size:14px;color:#bb8fce;font-weight:bold;margin-bottom:4px">'+r.method||r.方法+'</div><div style="font-size:12px;color:var(--paper2);margin-bottom:4px">'+(r.steps||r.步骤)+'</div><div style="font-size:12px;color:var(--success)">'+(r.benefit||r.益处)+'</div></div>';});
      html+='</div>';
    }
    // 起居
    if(obj.起居&&obj.起居.length){
      html+='<div style="background:rgba(52,152,219,0.06);border-left:3px solid #3498db;padding:16px;border-radius:0 10px 10px 0;margin-bottom:14px"><div style="font-size:15px;color:#3498db;font-weight:bold;margin-bottom:12px">🏠 起居调摄</div>';
      obj.起居.forEach(function(r){html+='<div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:12px;margin-bottom:8px"><div style="font-size:13px;color:var(--gold);font-weight:bold;margin-bottom:4px">'+(r.方面||r.aspect)+'</div><div style="font-size:12px;color:var(--paper2)">'+(r.建议||r.advice)+'</div></div>';});
      html+='</div>';
    }
    // Summary
    if(obj.总结){
      html+='<div style="background:rgba(201,168,76,0.06);border-left:3px solid var(--gold);padding:14px 18px;border-radius:0 8px 8px 0;margin-bottom:14px"><div style="font-size:14px;color:var(--gold);font-weight:bold;margin-bottom:6px">📝 总结</div><div style="font-size:13px;color:var(--text);line-height:1.8">'+obj.总结+'</div></div>';
    }
    // Disclaimer
    html+='<div style="background:rgba(231,76,60,0.04);border:1px solid rgba(231,76,60,0.15);border-radius:8px;padding:12px 16px;margin-top:12px"><div style="font-size:12px;color:#e74c3c;line-height:1.6">⚠️ <b>温馨提示：</b>本方案由AI根据体质特征生成，仅供养生保健参考。如有特定疾病或服药中，请咨询中医师调整方案。功法练习请循序渐进，如有不适请停止。</div></div>';
    html+='</div>';
    result.innerHTML=html;
  }).catch(function(err){
    result.innerHTML='<div style="padding:20px;text-align:center"><div style="font-size:14px;color:#e74c3c;margin-bottom:12px">⚠️ 方案生成服务暂时不可用</div><div style="font-size:12px;color:var(--paper2)">请确认网络正常，AI服务可用</div></div>';
  });
}

function tzRenderQigong(){
  var list=TZ_DATA.qigongMethods||[];
  var html=list.map(function(q){
    return '<div style="background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:12px;padding:18px">'+
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">'+
        '<span style="font-size:16px;color:var(--gold);font-weight:bold">'+q.name+'</span>'+
        '<div style="display:flex;gap:6px">'+
          '<span style="font-size:11px;padding:2px 8px;border-radius:10px;background:rgba(201,168,76,0.1);color:var(--gold2)">'+q.type+'</span>'+
          '<span style="font-size:11px;padding:2px 8px;border-radius:10px;background:rgba(0,0,0,0.2);color:var(--muted)">'+q.difficulty+'</span>'+
          '<span style="font-size:11px;padding:2px 8px;border-radius:10px;background:rgba(45,106,79,0.1);color:var(--success)">'+q.duration+'</span>'+
        '</div>'+
      '</div>'+
      '<div style="font-size:13px;color:var(--paper2);line-height:1.7;margin-bottom:10px">'+q.desc+'</div>'+
      '<div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:12px;margin-bottom:10px"><div style="font-size:12px;color:var(--gold);margin-bottom:6px">📋 练习步骤</div><div style="font-size:12px;color:var(--paper);line-height:1.8;white-space:pre-line">'+q.steps+'</div></div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">'+
        '<div style="background:rgba(45,106,79,0.06);border-radius:6px;padding:10px"><div style="font-size:11px;color:var(--success);margin-bottom:4px">✅ 功效</div><div style="font-size:12px;color:var(--paper2)">'+q.benefit+'</div></div>'+
        '<div style="background:rgba(231,76,60,0.06);border-radius:6px;padding:10px"><div style="font-size:11px;color:#e74c3c;margin-bottom:4px">⚠️ 注意</div><div style="font-size:12px;color:var(--paper2)">'+q.caution+'</div></div>'+
      '</div>'+
      '<div style="display:flex;gap:4px;flex-wrap:wrap">'+q.constitutions.map(function(c){return '<span style="font-size:11px;padding:2px 8px;background:rgba(201,168,76,0.08);border:1px solid var(--border);border-radius:10px;color:var(--gold2)">适合：'+c+'</span>';}).join('')+'</div>'+
    '</div>';
  }).join('');
  var el=document.getElementById('tzQigongList');
  if(el) el.innerHTML=html;

  // Also render exercise filters and list
  var exFilters=['全部','有氧运动','力量训练','柔韧训练','呼吸训练'];
  var fhtml=exFilters.map(function(f,i){
    return '<button onclick="tzFilterExercise(\''+(i===0?'all':f)+'\')" style="padding:6px 14px;border:1px solid var(--border);border-radius:8px;background:'+(i===0?'var(--title)':'rgba(255,255,255,0.04)')+';color:'+(i===0?'#fff':'var(--muted)')+';cursor:pointer;font-size:12px;font-family:inherit">'+f+'</button>';
  }).join('');
  var fel=document.getElementById('tzExFilters');
  if(fel) fel.innerHTML=fhtml;
  if(!document.getElementById('tzExerciseList').innerHTML) tzRenderExercise('all');
}

function tzRenderPrescriptions(){
  var list=TZ_DATA.famousPrescriptions||[];
  var html=list.map(function(p){
    return '<div style="background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:12px;padding:18px">'+
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">'+
        '<span style="font-size:16px;color:var(--gold);font-weight:bold">💊 '+p.name+'</span>'+
        '<span style="font-size:11px;padding:2px 8px;border-radius:10px;background:rgba(201,168,76,0.1);color:var(--gold2)">'+p.category+'</span>'+
      '</div>'+
      '<div style="font-size:12px;color:var(--paper3);margin-bottom:8px">出处：'+p.source+'</div>'+
      '<div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:12px;margin-bottom:10px">'+
        '<div style="font-size:12px;color:var(--gold);margin-bottom:6px">组成</div>'+
        '<div style="font-size:13px;color:var(--paper);line-height:1.7">'+p.composition+'</div>'+
      '</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">'+
        '<div style="background:rgba(45,106,79,0.06);border-radius:6px;padding:10px"><div style="font-size:11px;color:var(--success);margin-bottom:4px">功效</div><div style="font-size:12px;color:var(--paper2)">'+p.effect+'</div></div>'+
        '<div style="background:rgba(255,255,255,0.03);border-radius:6px;padding:10px"><div style="font-size:11px;color:var(--gold2);margin-bottom:4px">主治</div><div style="font-size:12px;color:var(--paper2)">'+p.usage+'</div></div>'+
      '</div>'+
      '<div style="display:flex;gap:4px;flex-wrap:wrap">'+p.constitutions.map(function(c){return '<span style="font-size:11px;padding:2px 8px;background:rgba(201,168,76,0.08);border:1px solid var(--border);border-radius:10px;color:var(--gold2)">适合：'+c+'质</span>';}).join('')+'</div>'+
    '</div>';
  }).join('');
  var el=document.getElementById('tzPrescriptionList');
  if(el) el.innerHTML=html;
}

function tzRenderQuestionnaire(){
  var html='';
  TZ_DATA.questions.forEach(function(q,idx){
    html+='<div style="margin-bottom:16px;padding:14px;background:rgba(255,255,255,0.03);border-radius:8px">'+
      '<div style="font-size:14px;color:var(--text);margin-bottom:10px"><b style="color:var(--gold)">'+(idx+1)+'.</b> '+q.q+'</div>'+
      '<div style="display:flex;gap:8px">'+
      ['没有','很少','有时','经常','总是'].forEach(function(opt,oi){
        html+='<label style="flex:1;padding:8px;text-align:center;border:1px solid var(--border);border-radius:6px;cursor:pointer;font-size:12px;color:var(--muted);transition:.2s" onclick="tzSelectAnswer('+idx+','+oi+',this)">'+
          '<input type="radio" name="tzq'+idx+'" value="'+oi+'" style="display:none">'+opt+'</label>';
      }).join('')+
      '</div></div>';
    html=html.replace(/<\/div><\/div>/,'</div>');
  });
  document.getElementById('tzQuestionnaire').innerHTML=html;
  window._tzAnswers={};
}

function tzSelectAnswer(qIdx,aIdx,el){
  var siblings=el.parentNode.querySelectorAll('label');
  siblings.forEach(function(s){
    s.style.background='rgba(255,255,255,0.03)';
    s.style.color='var(--muted)';
    s.style.borderColor='var(--border)';
  });
  el.style.background='rgba(201,168,76,0.15)';
  el.style.color='var(--gold)';
  el.style.borderColor='var(--gold)';
  window._tzAnswers[qIdx]=aIdx;
}

function tzCalculateResult(){
  var answers=window._tzAnswers||{};
  var scores={};
  TZ_DATA.questions.forEach(function(q,idx){
    var a=answers[idx]||0;
    if(q.scores){
      Object.keys(q.scores).forEach(function(k){
        scores[k]=(scores[k]||0)+q.scores[k]*a;
      });
    }
  });
  var sorted=Object.keys(scores).sort(function(a,b){return scores[b]-scores[a];});
  var top=sorted[0]||'pinghe';
  var second=sorted[1]||'pinghe';
  var cons=TZ_DATA.constitutions;
  var topC=cons.find(function(c){return c.key===top;})||cons[0];
  var secondC=cons.find(function(c){return c.key===second;})||cons[0];
  window._tzLastResult={key:top,name:topC.name};

  var html='<div style="background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:12px;padding:24px">'+
    '<h4 style="font-family:\'Ma Shan Zheng\',serif;font-size:22px;color:var(--gold);margin-bottom:16px;letter-spacing:3px;text-align:center">📊 您的体质分析结果</h4>'+
    '<div style="display:flex;gap:16px;justify-content:center;margin-bottom:20px;flex-wrap:wrap">'+
      '<div style="background:rgba('+parseInt(topC.color.slice(1,3),16)+','+parseInt(topC.color.slice(3,5),16)+','+parseInt(topC.color.slice(5,7),16)+',0.1);border:2px solid '+topC.color+';border-radius:12px;padding:20px 32px;text-align:center">'+
        '<div style="font-size:40px">'+topC.icon+'</div>'+
        '<div style="font-size:18px;color:'+topC.color+';font-weight:bold;margin-top:8px">主体质：'+topC.name+'</div>'+
        '<div style="font-size:13px;color:var(--paper2);margin-top:6px">'+topC.desc+'</div>'+
      '</div>'+
      '<div style="background:rgba('+parseInt(secondC.color.slice(1,3),16)+','+parseInt(secondC.color.slice(3,5),16)+','+parseInt(secondC.color.slice(5,7),16)+',0.05);border:1px solid '+secondC.color+';border-radius:12px;padding:20px 32px;text-align:center;opacity:0.8">'+
        '<div style="font-size:32px">'+secondC.icon+'</div>'+
        '<div style="font-size:16px;color:'+secondC.color+';font-weight:bold;margin-top:8px">兼体质：'+secondC.name+'</div>'+
        '<div style="font-size:12px;color:var(--paper2);margin-top:6px">'+secondC.desc+'</div>'+
      '</div>'+
    '</div>'+
    '<div style="background:rgba(201,168,76,0.06);border-left:3px solid var(--gold);padding:16px 20px;border-radius:0 8px 8px 0;margin-bottom:16px">'+
      '<div style="font-size:14px;color:var(--gold);font-weight:bold;margin-bottom:8px">🌿 养生建议</div>'+
      '<div style="font-size:14px;color:var(--text);line-height:1.8">'+topC.yangsheng+'</div>'+
    '</div>'+
    '<div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:16px">'+
      '<div style="font-size:13px;color:var(--paper2);margin-bottom:8px">📈 各体质得分</div>';
  sorted.forEach(function(k){
    var cc=cons.find(function(c){return c.key===k;});
    if(cc){
      var pct=Math.min(100,Math.round((scores[k]||0)/20*100));
      html+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">'+
        '<span style="font-size:13px;color:var(--muted);min-width:80px">'+cc.icon+' '+cc.name+'</span>'+
        '<div style="flex:1;height:8px;background:rgba(255,255,255,0.06);border-radius:4px;overflow:hidden">'+
          '<div style="width:'+pct+'%;height:100%;background:'+cc.color+';border-radius:4px"></div>'+
        '</div>'+
        '<span style="font-size:12px;color:var(--gold);min-width:30px;text-align:right">'+(scores[k]||0)+'</span>'+
      '</div>';
    }
  });
  html+='</div>';
  // Quick link to plan
  html+='<div style="text-align:center;margin-top:16px"><button class="compute-btn" style="padding:10px 30px;font-size:14px" onclick="tzSwitchTab(\'plan\')">🎯 生成综合养生方案 →</button></div>';
  html+='</div>';
  document.getElementById('tzResult').innerHTML=html;
  document.getElementById('tzResult').style.display='block';
}

function tzRenderFood(filter){
  var list=TZ_DATA.recipes;
  if(filter!=='all') list=list.filter(function(r){return r.constitutions.indexOf(filter)>=0;});
  var html=list.map(function(r){
    return '<div style="background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:10px;padding:16px">'+
      '<div style="font-size:15px;color:var(--gold);font-weight:bold;margin-bottom:8px">🍵 '+r.name+'</div>'+
      '<div style="font-size:12px;color:var(--paper2);margin-bottom:6px"><b>食材：</b>'+r.ingredients+'</div>'+
      '<div style="font-size:12px;color:var(--paper2);margin-bottom:6px"><b>做法：</b>'+r.method+'</div>'+
      '<div style="font-size:12px;color:var(--success);margin-bottom:8px"><b>功效：</b>'+r.effect+'</div>'+
      '<div style="display:flex;gap:4px;flex-wrap:wrap">'+r.constitutions.map(function(c){return '<span style="font-size:11px;padding:2px 8px;background:rgba(201,168,76,0.08);border:1px solid var(--border);border-radius:10px;color:var(--gold2)">'+c+'</span>';}).join('')+'</div>'+
    '</div>';
  }).join('');
  // Also build filters
  var filterEl=document.getElementById('tzFoodFilters');
  if(filterEl && !filterEl.innerHTML){
    var fhtml='<button onclick="tzFilterFood(\'all\')" style="padding:6px 14px;border:1px solid var(--border);border-radius:8px;background:var(--title);color:#fff;cursor:pointer;font-size:12px;font-family:inherit">全部</button>';
    TZ_DATA.constitutions.forEach(function(c){
      fhtml+='<button onclick="tzFilterFood(\''+c.name.replace(/质$/,'')+'\')" style="padding:6px 14px;border:1px solid var(--border);border-radius:8px;background:rgba(255,255,255,0.04);color:var(--muted);cursor:pointer;font-size:12px;font-family:inherit">'+c.icon+' '+c.name.replace(/质$/,'')+'</button>';
    });
    filterEl.innerHTML=fhtml;
  }
  document.getElementById('tzFoodList').innerHTML=html||'<div style="text-align:center;color:var(--muted);padding:20px">暂无相关食谱</div>';
  
  // 增强版：追加体质食疗方案 + 节气饮食建议
  var extraHtml='';
  
  // 体质食疗方案（本地库）
  if(TZ_DATA.foodTherapy && filter!=='all'){
    var tizhiKey=filter;
    var ftList=TZ_DATA.foodTherapy[tizhiKey]||[];
    if(ftList.length>0){
      extraHtml+='<div style="margin-top:20px;padding:16px;background:rgba(46,204,113,0.04);border:1px solid rgba(46,204,113,0.15);border-radius:12px">';
      extraHtml+='<div style="font-size:15px;color:var(--jade2);font-weight:bold;margin-bottom:12px">🍵 '+tizhiKey+'体质专属食疗方</div>';
      ftList.forEach(function(f){
        extraHtml+='<div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:12px;margin-bottom:8px">';
        extraHtml+='<div style="font-size:14px;color:var(--gold);font-weight:bold;margin-bottom:4px">'+f.name+'</div>';
        extraHtml+='<div style="font-size:12px;color:var(--paper2);margin-bottom:4px"><b>食材：</b>'+f.ingredients+'</div>';
        extraHtml+='<div style="font-size:12px;color:var(--paper2);margin-bottom:4px"><b>做法：</b>'+f.method+'</div>';
        extraHtml+='<div style="font-size:12px;color:var(--jade2)"><b>功效：</b>'+f.effect+'</div>';
        extraHtml+='</div>';
      });
      extraHtml+='</div>';
    }
  }
  
  // 节气饮食建议
  if(TZ_DATA.seasonalFoods){
    var now=new Date();
    var month=now.getMonth()+1;
    var season=month>=3&&month<=5?'春':month>=6&&month<=8?'夏':month>=9&&month<=11?'秋':'冬';
    var sf=TZ_DATA.seasonalFoods[season];
    if(sf){
      extraHtml+='<div style="margin-top:16px;padding:16px;background:rgba(201,168,76,0.04);border:1px solid rgba(201,168,76,0.15);border-radius:12px">';
      extraHtml+='<div style="font-size:15px;color:var(--gold);font-weight:bold;margin-bottom:8px">🌿 当前'+season+'季饮食建议</div>';
      extraHtml+='<div style="font-size:12px;color:var(--paper2);margin-bottom:6px"><b>节气：</b>'+sf.jieqi+'</div>';
      extraHtml+='<div style="font-size:12px;color:var(--paper2);margin-bottom:6px"><b>原则：</b>'+sf.principle+'</div>';
      extraHtml+='<div style="font-size:12px;color:var(--paper2);margin-bottom:8px"><b>时令食材：</b>'+sf.foods.join('、')+'</div>';
      if(filter!=='all'&&sf.byTizhi&&sf.byTizhi[filter]){
        extraHtml+='<div style="font-size:12px;color:var(--jade2);padding:8px;background:rgba(46,204,113,0.06);border-radius:6px"><b>'+filter+'体质推荐：</b>'+sf.byTizhi[filter]+'</div>';
      }
      extraHtml+='</div>';
    }
  }
  
  if(extraHtml){
    var cur=document.getElementById('tzFoodList').innerHTML;
    document.getElementById('tzFoodList').innerHTML=cur+extraHtml;
  }
}

function tzFilterFood(f){
  document.querySelectorAll('#tzFoodFilters button').forEach(function(b){b.style.background='rgba(255,255,255,0.04)';b.style.color='var(--muted)';});
  event.target.style.background='var(--title)';event.target.style.color='#fff';
  tzRenderFood(f);
}

function tzRenderExercise(filter){
  var list=TZ_DATA.exercises;
  if(filter!=='all') list=list.filter(function(e){return e.type===filter;});
  var intColors={'低':'#4CAF50','中':'#FF9800','高':'#f44336'};
  var html=list.map(function(e){
    return '<div style="background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:10px;padding:16px">'+
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">'+
        '<span style="font-size:15px;color:var(--gold);font-weight:bold">🤸 '+e.name+'</span>'+
        '<span style="font-size:11px;padding:2px 8px;border-radius:10px;background:'+intColors[e.intensity]+'20;color:'+intColors[e.intensity]+'">'+e.intensity+'强度</span>'+
      '</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:12px;color:var(--paper2)">'+
        '<div>⏱ '+e.duration+'分钟</div><div>🔥 '+e.calories+'千卡</div>'+
        '<div>📋 '+e.type+'</div><div>💡 '+e.notes+'</div>'+
      '</div>'+
    '</div>';
  }).join('');
  document.getElementById('tzExerciseList').innerHTML=html||'<div style="text-align:center;color:var(--muted);padding:20px">暂无相关运动</div>';
}

function tzFilterExercise(f){
  document.querySelectorAll('#tzExFilters button').forEach(function(b){b.style.background='rgba(255,255,255,0.04)';b.style.color='var(--muted)';});
  event.target.style.background='var(--title)';event.target.style.color='#fff';
  tzRenderExercise(f);
}

function tzAnalyzeBazi(){
  var dateStr=document.getElementById('tzBaziDate').value;
  var hourIdx=parseInt(document.getElementById('tzBaziHour').value);
  var gender=document.getElementById('tzBaziGender').value;
  if(!dateStr){showToast('请选择出生日期');return;}
  var parts=dateStr.split('-');
  var y=parseInt(parts[0]),m=parseInt(parts[1]),day=parseInt(parts[2]);

  var jdn = Math.floor((1461*(y+4800+Math.floor((m-14)/12)))/4)+Math.floor((367*(m-2-12*Math.floor((m-14)/12)))/12)-Math.floor((3*Math.floor((y+4900+Math.floor((m-14)/12))/100))/4)+day-32075;
  var gzOffset=(jdn-11)%60;
  if(gzOffset<0) gzOffset+=60;
  var stems=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  var dayStem=stems[gzOffset%10];
  var stemWuxing={'甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水'};
  var wu=stemWuxing[dayStem];

  var baziKey={'甲':'甲乙木','乙':'甲乙木','丙':'丙丁火','丁':'丙丁火','戊':'戊己土','己':'戊己土','庚':'庚辛金','辛':'庚辛金','壬':'壬癸水','癸':'壬癸水'}[dayStem];
  var baziInfo=TZ_DATA.baziMap[baziKey]||TZ_DATA.baziMap['甲乙木'];
  var wuData=TZ_DATA.wuxing[{木:'Mu',火:'Huo',土:'Tu',金:'Jin',水:'Shui'}[wu]];

  var html='<div style="background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:12px;padding:24px">'+
    '<h5 style="font-family:\'Ma Shan Zheng\',serif;font-size:20px;color:var(--gold);margin-bottom:16px;text-align:center">🔮 日主'+dayStem+'('+wu+'行) 体质分析</h5>'+
    '<div style="text-align:center;margin-bottom:16px">'+
      '<div style="font-size:48px">'+wuData.icon+'</div>'+
      '<div style="font-size:20px;color:'+wuData.color+';font-weight:bold;margin-top:8px">'+wuData.name+'行 · '+wuData.organs.join('、')+'</div>'+
      '<div style="font-size:14px;color:var(--paper2);margin-top:8px">'+baziInfo.tizhi+'</div>'+
      '<div style="font-size:13px;color:var(--text);margin-top:8px;line-height:1.8;max-width:600px;margin-left:auto;margin-right:auto">'+baziInfo.desc+'</div>'+
    '</div>'+
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:16px">'+
      '<div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:14px"><div style="font-size:12px;color:var(--gold);margin-bottom:6px">🕐 季节</div><div style="font-size:14px;color:var(--text)">'+wuData.season+' · '+wuData.direction+'方</div></div>'+
      '<div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:14px"><div style="font-size:12px;color:var(--gold);margin-bottom:6px">👅 五味</div><div style="font-size:14px;color:var(--text)">'+wuData.taste+'味入'+wuData.organs[0]+'</div></div>'+
      '<div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:14px"><div style="font-size:12px;color:var(--gold);margin-bottom:6px">😨 情志</div><div style="font-size:14px;color:var(--text)">'+wuData.emotion+'伤'+wuData.organs[0]+'</div></div>'+
      '<div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:14px"><div style="font-size:12px;color:var(--gold);margin-bottom:6px">👁 关联</div><div style="font-size:14px;color:var(--text)">'+wuData.sense+' · '+wuData.tissue+'</div></div>'+
    '</div>'+
    '<div style="background:rgba(230,126,34,0.06);border-left:3px solid var(--warn);padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:14px">'+
      '<div style="font-size:13px;color:var(--warn);font-weight:bold;margin-bottom:6px">⚠ 常见症状</div>'+
      '<div style="font-size:13px;color:var(--paper2)">'+wuData.symptoms.join('、')+'</div>'+
    '</div>'+
    '<div style="background:rgba(45,106,79,0.06);border-left:3px solid var(--success);padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:14px">'+
      '<div style="font-size:13px;color:var(--success);font-weight:bold;margin-bottom:6px">🌿 养生食物</div>'+
      '<div style="font-size:13px;color:var(--paper2)">'+wuData.foods.join('、')+'</div>'+
    '</div>'+
    '<div style="background:rgba(201,168,76,0.06);border-left:3px solid var(--gold);padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:14px">'+
      '<div style="font-size:13px;color:var(--gold);font-weight:bold;margin-bottom:6px">💊 常用药材</div>'+
      '<div style="font-size:13px;color:var(--paper2)">'+wuData.herbs.join('、')+'</div>'+
    '</div>'+
    '<div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:14px;margin-bottom:14px">'+
      '<div style="font-size:13px;color:var(--gold);font-weight:bold;margin-bottom:6px">📝 调养原则</div>'+
      '<div style="font-size:13px;color:var(--text);line-height:1.8">'+wuData.regimen+'</div>'+
    '</div>'+
    '<div style="background:rgba(192,57,43,0.06);border-left:3px solid var(--danger);padding:12px 16px;border-radius:0 8px 8px 0">'+
      '<div style="font-size:13px;color:var(--danger);font-weight:bold;margin-bottom:6px">🚫 禁忌</div>'+
      '<div style="font-size:13px;color:var(--paper2)">'+wuData.avoid+'</div>'+
    '</div>'+
  '</div>';
  document.getElementById('tzBaziResult').innerHTML=html;
  document.getElementById('tzBaziResult').style.display='block';
}

function tzSubmitCheckin(){
  var today=new Date().toISOString().slice(0,10);
  var items=[];
  if(document.getElementById('tzCheckDiet').checked) items.push('饮食调理');
  if(document.getElementById('tzCheckExercise').checked) items.push('功法锻炼');
  if(document.getElementById('tzCheckSleep').checked) items.push('早睡早起');
  if(document.getElementById('tzCheckEmotion').checked) items.push('情志调节');
  if(document.getElementById('tzCheckAcupoint').checked) items.push('穴位按摩');
  if(document.getElementById('tzCheckTea').checked) items.push('药膳茶饮');
  if(document.getElementById('tzCheckMeditation').checked) items.push('正念冥想');
  if(document.getElementById('tzCheckReading').checked) items.push('经典诵读');
  var note=document.getElementById('tzCheckNote').value;

  var key='tz_checkin_'+today;
  var data={date:today,items:items,note:note};
  try{localStorage.setItem(key,JSON.stringify(data));}catch(e){}

  showToast('✅ 打卡成功！今日完成'+items.length+'项调理');
  tzRenderCheckin();
}

function tzRenderCheckin(){
  var today=new Date().toISOString().slice(0,10);
  var todayKey='tz_checkin_'+today;
  var todayData=null;
  try{todayData=JSON.parse(localStorage.getItem(todayKey)||'null');}catch(e){}

  var streak=0,total=0;
  var d=new Date();
  for(var _i=0;_i<365;_i++){
    var k='tz_checkin_'+d.toISOString().slice(0,10);
    if(localStorage.getItem(k)){streak++;total++;d.setDate(d.getDate()-1);}
    else break;
  }
  d=new Date();
  d.setDate(d.getDate()-streak+1);
  for(var _j=0;_j<365;_j++){
    if(++_safety>365) break;
    d.setDate(d.getDate()+1);
    var k='tz_checkin_'+d.toISOString().slice(0,10);
    if(localStorage.getItem(k)){total++;}
    else break;
  }

  if(document.getElementById('tzStreakDays')) document.getElementById('tzStreakDays').textContent=streak;
  if(document.getElementById('tzTotalDays')) document.getElementById('tzTotalDays').textContent=total;
  if(document.getElementById('tzTodayStatus')) document.getElementById('tzTodayStatus').textContent=todayData?'已打卡':'未打卡';

  var html='<h5 style="font-size:15px;color:var(--gold);margin-bottom:12px">📅 最近打卡记录</h5>';
  var hasHistory=false;
  for(var i=0;i<7;i++){
    var dd=new Date();dd.setDate(dd.getDate()-i);
    var dk='tz_checkin_'+dd.toISOString().slice(0,10);
    var dData=null;
    try{dData=JSON.parse(localStorage.getItem(dk)||'null');}catch(e){}
    if(dData){
      hasHistory=true;
      html+='<div style="background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:8px">'+
        '<div style="display:flex;justify-content:space-between;margin-bottom:6px">'+
          '<span style="font-size:13px;color:var(--gold)">'+dk.replace('tz_checkin_','')+'</span>'+
          '<span style="font-size:12px;color:var(--success)">✅ '+dData.items.length+'项</span>'+
        '</div>'+
        '<div style="font-size:12px;color:var(--paper2)">'+dData.items.join(' · ')+'</div>'+
        (dData.note?'<div style="font-size:12px;color:var(--muted);margin-top:4px;font-style:italic">'+dData.note+'</div>':'')+
      '</div>';
    }
  }
  if(!hasHistory) html+='<div style="text-align:center;color:var(--muted);padding:20px;font-size:13px">暂无打卡记录，开始您的第一次打卡吧！</div>';
  var el=document.getElementById('tzCheckinHistory');
  if(el) el.innerHTML=html;
}

function tzRenderWxButtons(){
  var btns=['Mu','Huo','Tu','Jin','Shui'];
  var html=btns.map(function(k){
    var d=TZ_DATA.wuxing[k];
    return '<button class="tz-wx-btn" data-key="'+k+'" style="padding:10px 20px;border:1.5px solid var(--border);border-radius:8px;cursor:pointer;font-family:inherit;font-size:14px;background:rgba(255,255,255,0.04);color:var(--muted)" onclick="tzSelectWuxing(\''+k+'\')">'+d.icon+' '+d.name+'·'+d.organs[0]+'</button>';
  }).join('');
  var el=document.getElementById('tzWxBtns');
  if(el) el.innerHTML=html;
}

function tzSelectWuxing(key){
  var d=TZ_DATA.wuxing[key];
  document.querySelectorAll('#tzWxBtns button').forEach(function(b){
    if(b.dataset.key===key){b.style.background='var(--title)';b.style.color='#fff';b.style.borderColor='var(--gold)';}
    else{b.style.background='rgba(255,255,255,0.04)';b.style.color='var(--muted)';b.style.borderColor='var(--border)';}
  });
  var html='<div style="background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:12px;padding:24px">'+
    '<div style="text-align:center;margin-bottom:20px">'+
      '<div style="font-size:56px">'+d.icon+'</div>'+
      '<div style="font-size:24px;color:'+d.color+';font-weight:bold;margin-top:8px">'+d.name+'行 · '+d.organs.join('、')+'</div>'+
      '<div style="font-size:13px;color:var(--paper2);margin-top:6px">'+d.season+'季 · '+d.direction+'方 · '+d.taste+'味 · '+d.emotion+'</div>'+
    '</div>'+
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:16px">'+
      '<div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:14px"><div style="font-size:12px;color:var(--gold);margin-bottom:6px">👁 对应</div><div style="font-size:14px;color:var(--text)">'+d.sense+' · '+d.tissue+'</div></div>'+
      '<div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:14px"><div style="font-size:12px;color:var(--gold);margin-bottom:6px">⚠ 症状</div><div style="font-size:12px;color:var(--paper2)">'+d.symptoms.slice(0,4).join('、')+'</div></div>'+
    '</div>'+
    '<div style="background:rgba(45,106,79,0.06);border-left:3px solid var(--success);padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:14px">'+
      '<div style="font-size:13px;color:var(--success);font-weight:bold;margin-bottom:6px">🌿 养生食物</div>'+
      '<div style="font-size:13px;color:var(--paper2);line-height:1.8">'+d.foods.join('、')+'</div>'+
    '</div>'+
    '<div style="background:rgba(201,168,76,0.06);border-left:3px solid var(--gold);padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:14px">'+
      '<div style="font-size:13px;color:var(--gold);font-weight:bold;margin-bottom:6px">💊 药材</div>'+
      '<div style="font-size:13px;color:var(--paper2);line-height:1.8">'+d.herbs.join('、')+'</div>'+
    '</div>'+
    '<div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:14px;margin-bottom:14px">'+
      '<div style="font-size:13px;color:var(--gold);font-weight:bold;margin-bottom:6px">📝 调养原则</div>'+
      '<div style="font-size:13px;color:var(--text);line-height:1.8">'+d.regimen+'</div>'+
    '</div>'+
    '<div style="background:rgba(192,57,43,0.06);border-left:3px solid var(--danger);padding:12px 16px;border-radius:0 8px 8px 0">'+
      '<div style="font-size:13px;color:var(--danger);font-weight:bold;margin-bottom:6px">🚫 禁忌</div>'+
      '<div style="font-size:13px;color:var(--paper2)">'+d.avoid+'</div>'+
    '</div>'+
  '</div>';
  var el=document.getElementById('tzWuxingDetail');
  if(el) el.innerHTML=html;
}
