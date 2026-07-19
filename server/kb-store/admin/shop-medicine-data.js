// ===== 商城医药数据 =====

// 道医药品
const DAO_MEDICINE = [
  {
    id: 'dao001',
    name: '太乙膏',
    category: '膏药',
    school: '道医',
    price: 168,
    image: '🌿',
    desc: '道门秘传太乙膏，活血化瘀，消肿止痛。适用于跌打损伤、风湿骨痛。',
    ingredients: '当归、川芎、红花、乳香、没药等二十余味',
    usage: '外敷，每日1-2次，贴敷患处',
    caution: '孕妇慎用，皮肤破损处禁用',
    master: '武当道医馆',
    origin: '湖北武当山'
  },
  {
    id: 'dao002',
    name: '金丹丸',
    category: '药丸',
    school: '道医',
    price: 298,
    image: '💊',
    desc: '道家养生金丹，补益精气，延年益寿。适合体虚乏力、气血两亏者。',
    ingredients: '人参、鹿茸、枸杞、黄精、灵芝孢子粉',
    usage: '内服，每日2次，每次6粒，温水送服',
    caution: '感冒发热时停服，高血压患者遵医嘱',
    master: '青城山道医传承',
    origin: '四川青城山'
  },
  {
    id: 'dao003',
    name: '三清正气水',
    category: '药水',
    school: '道医',
    price: 88,
    image: '🧪',
    desc: '道家正气水，辟秽化浊，清热解毒。适用于中暑头晕、水土不服。',
    ingredients: '藿香、佩兰、苍术、陈皮、甘草',
    usage: '内服，每次10ml，温水冲服',
    caution: '脾胃虚寒者减量服用',
    master: '龙虎山天师府',
    origin: '江西龙虎山'
  },
  {
    id: 'dao004',
    name: '太极追风贴',
    category: '膏药',
    school: '道医',
    price: 128,
    image: '☯️',
    desc: '道家秘制追风贴，祛风除湿，温经通络。专治风湿关节炎、肩周炎。',
    ingredients: '附子、川乌、草乌、细辛、独活',
    usage: '外敷，贴于患处，24小时更换',
    caution: '过敏体质慎用，孕妇禁用',
    master: '武当太极传人',
    origin: '湖北武当山'
  },
  {
    id: 'dao005',
    name: '长生丹',
    category: '药丸',
    school: '道医',
    price: 588,
    image: '🔮',
    desc: '道家养生圣品，补肾填精，养心安神。适合失眠多梦、腰膝酸软者。',
    ingredients: '熟地黄、山茱萸、山药、茯苓、泽泻、牡丹皮',
    usage: '内服，每日2次，每次8粒',
    caution: '阴虚火旺者减量，儿童禁服',
    master: '崂山道医馆',
    origin: '山东崂山'
  },
  {
    id: 'dao006',
    name: '八宝丹',
    category: '药丸',
    school: '道医',
    price: 388,
    image: '✨',
    desc: '道家八宝丹，清热解毒，凉血消肿。适合上火、咽喉肿痛、口舌生疮。',
    ingredients: '牛黄、麝香、蟾酥、珍珠、雄黄',
    usage: '内服，每次2粒，每日1-2次',
    caution: '孕妇禁用，体虚者减量',
    master: '茅山道医',
    origin: '江苏茅山'
  }
];

// 佛医药品
const FO_MEDICINE = [
  {
    id: 'fo001',
    name: '大悲咒甘露丸',
    category: '药丸',
    school: '佛医',
    price: 198,
    image: '🙏',
    desc: '佛门加持甘露丸，每日持诵大悲咒加持，可清热解毒，安神定志。',
    ingredients: '藏红花、雪莲、沉香、檀香等',
    usage: '内服，每日1粒，诵经后服用更佳',
    caution: '素食者宜，孕妇可服',
    master: '普陀山佛医馆',
    origin: '浙江普陀山',
    blessing: '已由寺院僧众加持七七四十九日'
  },
  {
    id: 'fo002',
    name: '药师佛心咒贴',
    category: '膏药',
    school: '佛医',
    price: 138,
    image: '🪷',
    desc: '印有药师佛心咒的药贴，贴敷患处可消业祛病，配合持咒效果更佳。',
    ingredients: '艾叶、白芷、薄荷、冰片',
    usage: '外敷，贴于疼痛处，持诵药师咒',
    caution: '皮肤过敏者慎用',
    master: '少林寺药局',
    origin: '河南嵩山少林寺',
    blessing: '少林高僧开光加持'
  },
  {
    id: 'fo003',
    name: '莲花清心茶',
    category: '茶饮',
    school: '佛医',
    price: 68,
    image: '🍵',
    desc: '佛门清心茶，以禅修养生理念配伍，可清热去火、宁心安神。',
    ingredients: '莲花、荷叶、菊花、枸杞',
    usage: '冲泡，每日1-2袋',
    caution: '脾胃虚寒者加姜同饮',
    master: '九华山佛医馆',
    origin: '安徽九华山'
  },
  {
    id: 'fo004',
    name: '六字大明咒香囊',
    category: '香囊',
    school: '佛医',
    price: 58,
    image: '🎐',
    desc: '内装藏药香粉，外绣六字真言，随身佩戴可辟邪安神、净化身心。',
    ingredients: '藏红花、白檀香、沉香、龙脑',
    usage: '随身佩戴，或置于枕边',
    caution: '避免沾水，每季更换香粉',
    master: '五台山佛医馆',
    origin: '山西五台山',
    blessing: '高僧诵经加持'
  },
  {
    id: 'fo005',
    name: '罗汉果润喉丸',
    category: '药丸',
    school: '佛医',
    price: 88,
    image: '🫧',
    desc: '佛门润喉良方，适合长期诵经念佛者，清咽利嗓，保护声带。',
    ingredients: '罗汉果、胖大海、桔梗、甘草',
    usage: '含服，每日3-4粒',
    caution: '糖尿病患者减量',
    master: '峨眉山佛医馆',
    origin: '四川峨眉山'
  },
  {
    id: 'fo006',
    name: '药师佛药签',
    category: '药签',
    school: '佛医',
    price: 128,
    image: '🎋',
    desc: '佛门药签，内含药方与持咒方法，可用于日常养生调理。',
    ingredients: '含七种佛门药方与对应心咒',
    usage: '按签所示配药，配合持咒',
    caution: '重症需就医，不可单靠药签',
    master: '灵隐寺药局',
    origin: '杭州灵隐寺',
    blessing: '药师殿开光'
  }
];

// 知名医师推荐
const MASTERS_LIST = [
  {
    id: 'm001',
    name: '张道长',
    title: '武当山道医传承人',
    school: '道医',
    level: '★★★★★',
    specialty: '风湿骨病、养生导引',
    experience: '40余年道医经验',
    location: '湖北武当山',
    contact: '微信: wudangdao001',
    intro: '武当派第15代传人，精通道家养生、导引术、丹药配制。治愈无数风湿骨病患者。',
    services: ['义诊预约', '开方配药', '养生指导']
  },
  {
    id: 'm002',
    name: '李道医',
    title: '青城山道医馆馆长',
    school: '道医',
    level: '★★★★★',
    specialty: '内科杂症、养生丹药',
    experience: '35年临床经验',
    location: '四川青城山',
    contact: '电话: 028-8888xxxx',
    intro: '青城派道医传人，擅长调理慢性病、体虚乏力、亚健康状态。',
    services: ['远程问诊', '丹药定制', '体质辨识']
  },
  {
    id: 'm003',
    name: '慧明法师',
    title: '少林寺药局主管',
    school: '佛医',
    level: '★★★★★',
    specialty: '骨伤科、跌打损伤',
    experience: '30年佛医经验',
    location: '河南嵩山少林寺',
    contact: '微信: shaolinfoyi',
    intro: '少林药局传人，擅长正骨、针灸、药贴，少林跌打损伤一绝。',
    services: ['骨伤诊疗', '药贴配制', '禅修指导']
  },
  {
    id: 'm004',
    name: '心慈法师',
    title: '普陀山佛医馆住持',
    school: '佛医',
    level: '★★★★☆',
    specialty: '心理疏导、失眠焦虑',
    experience: '25年佛医与心理咨询',
    location: '浙江普陀山',
    contact: '微信: putuofoyi',
    intro: '擅长用佛法结合中医调理心理问题，失眠、焦虑、抑郁。',
    services: ['佛医咨询', '禅修疗愈', '甘露丸定制']
  },
  {
    id: 'm005',
    name: '王大师',
    title: '知名命理师傅',
    school: '命理',
    level: '★★★★★',
    specialty: '八字推命、择日改名',
    experience: '38年命理经验',
    location: '北京',
    contact: '微信: wangmingli001',
    intro: '精通子平八字、奇门遁甲、择日学，为无数人指点迷津。',
    services: ['八字详解', '择日择吉', '改名取名', '风水堪舆']
  },
  {
    id: 'm006',
    name: '陈道长',
    title: '龙虎山天师府传人',
    school: '道医',
    level: '★★★★★',
    specialty: '符箓、驱邪、化煞',
    experience: '正一派第32代传人',
    location: '江西龙虎山',
    contact: '微信: longhushan001',
    intro: '天师府正传，擅长道家符箓、法事科仪、驱邪化煞。',
    services: ['符箓定制', '法事预约', '开光加持', '择日择吉']
  },
  {
    id: 'm007',
    name: '林师傅',
    title: '台湾知名命理师',
    school: '命理',
    level: '★★★★☆',
    specialty: '紫微斗数、姓名学',
    experience: '30年紫微斗数经验',
    location: '台湾台北',
    contact: '微信: taiwanzwds',
    intro: '台湾紫微斗数名师，精通飞星四化，预测精准。',
    services: ['紫微排盘', '流年运势', '姓名批改', '合婚配对']
  },
  {
    id: 'm008',
    name: '悟真法师',
    title: '九华山佛医馆住持',
    school: '佛医',
    level: '★★★★☆',
    specialty: '肿瘤调理、慢性病',
    experience: '20年佛医与中医结合',
    location: '安徽九华山',
    contact: '微信: jiuhuashan01',
    intro: '擅长用佛医结合中医调理慢性病、肿瘤术后康复。',
    services: ['慢性病调理', '肿瘤康复', '禅修养生', '药签问诊']
  }
];

console.log('商城医药数据加载完成:', DAO_MEDICINE.length + '道医,', FO_MEDICINE.length + '佛医,', MASTERS_LIST.length + '位名师');
// ===== 常用养生中药详解 =====
const HERB_DATABASE = [
  // 1. 人参
  {
    id: 'herb001', name: '人参', pinyin: 'Renshen',
    nature: '性微温，味甘微苦',
    meridian: '归脾、肺、心、肾经',
    effects: '大补元气、复脉固脱、补脾益肺、生津养血、安神益智',
    indications: '体虚欲脱、肢冷脉微、脾虚食少、肺虚喘咳、津伤口渴、内热消渴、气血亏虚、惊悸失眠',
    dosage: '煎服3-9g，文火另煎兑服；研末吞服1-2g/次，每日2-3次',
    taboo: '不宜与藜芦、五灵脂同用；实热证及阴虚火旺者慎用；服用人参期间不宜饮茶、吃萝卜',
    compatibility: '配黄芪→补气固表；配麦冬→益气养阴；配当归→气血双补；配附子→补气回阳',
    category: '补气药'
  },
  // 2. 黄芪
  {
    id: 'herb002', name: '黄芪', pinyin: 'Huangqi',
    nature: '性微温，味甘',
    meridian: '归脾、肺经',
    effects: '补气升阳、固表止汗、利水消肿、生津养血、行滞通痹、托毒排脓、敛疮生肌',
    indications: '气虚乏力、食少便溏、中气下陷、久泻脱肛、便血崩漏、表虚自汗、气虚水肿、内热消渴、血虚萎黄、半身不遂、痹痛麻木、痈疽难溃、久溃不敛',
    dosage: '煎服9-30g；补气升阳宜炙用，其他宜生用',
    taboo: '表实邪盛及阴虚阳亢者慎用',
    compatibility: '配人参→大补元气；配当归→气血双补；配白术→健脾益气；配防己→利水消肿；配升麻→升阳举陷',
    category: '补气药'
  },
  // 3. 当归
  {
    id: 'herb003', name: '当归', pinyin: 'Danggui',
    nature: '性温，味甘辛',
    meridian: '归肝、心、脾经',
    effects: '补血活血、调经止痛、润肠通便',
    indications: '血虚萎黄、眩晕心悸、月经不调、经闭痛经、虚寒腹痛、风湿痹痛、跌打损伤、痈疽疮疡、肠燥便秘',
    dosage: '煎服6-12g；补血用归身，活血用归尾，和血用全当归',
    taboo: '湿盛中满及大便泄泻者慎用',
    compatibility: '配川芎→活血调经；配白芍→养血柔肝；配熟地→补血滋阴；配黄芪→气血双补；配桃仁→活血化瘀',
    category: '补血药'
  },
  // 4. 熟地
  {
    id: 'herb004', name: '熟地黄', pinyin: 'Shudihuang',
    nature: '性微温，味甘',
    meridian: '归肝、肾经',
    effects: '补血滋阴、益精填髓',
    indications: '血虚萎黄、心悸怔忡、月经不调、崩漏下血、肝肾阴虚、腰膝酸软、骨蒸潮热、盗汗遗精、内热消渴、眩晕耳鸣、须发早白',
    dosage: '煎服9-15g',
    taboo: '脾胃虚弱及气滞痰多者慎用',
    compatibility: '配山茱萸→滋肾补肝；配山药→补肾固精；配当归→补血和血；配白芍→养血柔肝；配何首乌→乌须黑发',
    category: '补血药'
  },
  // 5. 白术
  {
    id: 'herb005', name: '白术', pinyin: 'Baizhu',
    nature: '性温，味甘苦',
    meridian: '归脾、胃经',
    effects: '健脾益气、燥湿利水、止汗、安胎',
    indications: '脾虚食少、腹胀泄泻、痰饮眩悸、水肿、自汗、胎动不安',
    dosage: '煎服6-12g；健脾宜炒用，燥湿利水宜生用',
    taboo: '阴虚内热及津液亏耗者慎用',
    compatibility: '配黄芪→健脾益气固表；配茯苓→健脾利湿；配甘草→补脾益气；配山药→健脾止泻；配黄芩→清热安胎',
    category: '补气药'
  },
  // 6. 茯苓
  {
    id: 'herb006', name: '茯苓', pinyin: 'Fuling',
    nature: '性平，味甘淡',
    meridian: '归心、肺、脾、肾经',
    effects: '利水渗湿、健脾、宁心安神',
    indications: '水肿尿少、痰饮眩悸、脾虚食少、便溏泄泻、心神不安、惊悸失眠',
    dosage: '煎服10-15g',
    taboo: '阴虚而无湿热及虚寒滑精者慎用',
    compatibility: '配猪苓→利水渗湿；配白术→健脾利湿；配半夏→化痰止呕；配酸枣仁→宁心安神；配桂枝→温阳化饮',
    category: '利水渗湿药'
  },
  // 7. 甘草
  {
    id: 'herb007', name: '甘草', pinyin: 'Gancao',
    nature: '性平，味甘',
    meridian: '归心、肺、脾、胃经',
    effects: '补脾益气、清热解毒、祛痰止咳、缓急止痛、调和诸药',
    indications: '脾胃虚弱、倦怠乏力、心悸气短、咳嗽痰多、脘腹四肢挛急疼痛、痈肿疮毒、缓解药物毒性烈性',
    dosage: '煎服2-10g；清热解毒宜生用，补中缓急宜炙用',
    taboo: '不宜与海藻、大戟、甘遂、芫花同用；湿盛胀满及水肿者慎用',
    compatibility: '配人参→补气；配白芍→缓急止痛；配桔梗→利咽；配金银花→清热解毒；调和诸药为众方之佐使',
    category: '补气药'
  },
  // 8. 川芎
  {
    id: 'herb008', name: '川芎', pinyin: 'Chuanxiong',
    nature: '性温，味辛',
    meridian: '归肝、胆、心包经',
    effects: '活血行气、祛风止痛',
    indications: '胸胁刺痛、胸痹心痛、跌打肿痛、月经不调、经闭痛经、头痛、风湿痹痛',
    dosage: '煎服3-10g',
    taboo: '阴虚火旺及月经过多者慎用；孕妇慎用',
    compatibility: '配当归→活血调经；配白芷→祛风治头痛；配柴胡→疏肝理气；配羌活→祛风胜湿；配丹参→活血化瘀',
    category: '活血化瘀药'
  },
  // 9. 白芍
  {
    id: 'herb009', name: '白芍', pinyin: 'Baishao',
    nature: '性微寒，味苦酸',
    meridian: '归肝、脾经',
    effects: '养血调经、敛阴止汗、柔肝止痛、平抑肝阳',
    indications: '血虚萎黄、月经不调、自汗盗汗、胁痛腹痛、四肢挛痛、头痛眩晕',
    dosage: '煎服6-15g',
    taboo: '不宜与藜芦同用；虚寒腹痛泄泻者慎用',
    compatibility: '配当归→养血调经；配甘草→缓急止痛；配柴胡→疏肝解郁；配桂枝→调和营卫；配熟地→滋阴养血',
    category: '补血药'
  },
  // 10. 陈皮
  {
    id: 'herb010', name: '陈皮', pinyin: 'Chenpi',
    nature: '性温，味辛苦',
    meridian: '归脾、肺经',
    effects: '理气健脾、燥湿化痰',
    indications: '脘腹胀满、食少吐泻、咳嗽痰多',
    dosage: '煎服3-10g',
    taboo: '气虚及阴虚燥咳者慎用',
    compatibility: '配半夏→燥湿化痰；配木香→行气止痛；配白术→健脾理气；配茯苓→理气化湿；配生姜→和胃止呕',
    category: '理气药'
  },
  // 11. 半夏
  {
    id: 'herb011', name: '半夏', pinyin: 'Banxia',
    nature: '性温，味辛，有毒',
    meridian: '归脾、胃、肺经',
    effects: '燥湿化痰、降逆止呕、消痞散结',
    indications: '湿痰寒痰、咳喘痰多、痰饮眩悸、风痰眩晕、痰厥头痛、呕吐反胃、胸脘痞闷、梅核气；外治痈肿痰核',
    dosage: '煎服3-9g（需炮制）；内服宜制用，外用宜生品',
    taboo: '不宜与川乌、草乌、附子同用；阴虚燥咳及血症者慎用',
    compatibility: '配陈皮→化痰理气；配茯苓→化痰利湿；配生姜→降逆止呕；配厚朴→行气散结；配黄连→清化热痰',
    category: '化痰止咳药'
  },
  // 12. 柴胡
  {
    id: 'herb012', name: '柴胡', pinyin: 'Chaihu',
    nature: '性微寒，味辛苦',
    meridian: '归肝、胆、肺经',
    effects: '疏散退热、疏肝解郁、升举阳气',
    indications: '感冒发热、寒热往来、胸胁胀痛、月经不调、子宫脱垂、脱肛',
    dosage: '煎服3-10g；解表退热宜生用，疏肝解郁宜醋炙',
    taboo: '肝阳上亢及肝风内动者慎用',
    compatibility: '配黄芩→和解少阳；配白芍→疏肝柔肝；配升麻→升阳举陷；配薄荷→疏肝解郁；配当归→调经',
    category: '解表药'
  },
  // 13. 黄芩
  {
    id: 'herb013', name: '黄芩', pinyin: 'Huangqin',
    nature: '性寒，味苦',
    meridian: '归肺、胆、脾、大肠、小肠经',
    effects: '清热燥湿、泻火解毒、止血、安胎',
    indications: '湿温暑湿、胸闷呕恶、湿热痞满、泻痢黄疸、肺热咳嗽、高热烦渴、血热吐衄、痈肿疮毒、胎动不安',
    dosage: '煎服3-10g',
    taboo: '脾胃虚寒及无湿热者慎用',
    compatibility: '配黄连→清热燥湿；配柴胡→和解清热；配桑白皮→清肺止咳；配白术→清热安胎；配栀子→泻火除烦',
    category: '清热药'
  },
  // 14. 黄连
  {
    id: 'herb014', name: '黄连', pinyin: 'Huanglian',
    nature: '性寒，味苦',
    meridian: '归心、脾、胃、肝、胆、大肠经',
    effects: '清热燥湿、泻火解毒',
    indications: '湿热痞满、呕吐吞酸、泻痢、黄疸、高热神昏、心火亢盛、心烦不寐、心悸不宁、血热吐衄、目赤牙痛、消渴、痈肿疔疮；外用治湿疹、湿疮、耳道流脓',
    dosage: '煎服2-5g；外用适量',
    taboo: '脾胃虚寒者禁用；阴虚津伤者慎用',
    compatibility: '配黄芩→清热燥湿；配吴茱萸→清泻肝火、降逆止呕；配木香→清热止痢；配大黄→泻火通便',
    category: '清热药'
  },
  // 15. 生地
  {
    id: 'herb015', name: '生地黄', pinyin: 'Shengdihuang',
    nature: '性寒，味甘',
    meridian: '归心、肝、肾经',
    effects: '清热凉血、养阴生津',
    indications: '热入营血、温毒发斑、吐血衄血、热病伤阴、舌绛烦渴、津伤便秘、阴虚发热、骨蒸劳热、内热消渴',
    dosage: '煎服10-15g',
    taboo: '脾虚泄泻及胃寒食少者慎用',
    compatibility: '配玄参→清热凉血；配麦冬→养阴生津；配牡丹皮→凉血消斑；配知母→滋阴降火；配赤芍→凉血活血',
    category: '清热凉血药'
  },
  // 16. 麦冬
  {
    id: 'herb016', name: '麦冬', pinyin: 'Maidong',
    nature: '性微寒，味甘微苦',
    meridian: '归心、肺、胃经',
    effects: '养阴生津、润肺清心',
    indications: '肺燥干咳、阴虚劳嗽、喉痹咽痛、津伤口渴、内热消渴、心烦失眠、肠燥便秘',
    dosage: '煎服6-12g',
    taboo: '脾胃虚寒泄泻及风寒咳嗽者慎用',
    compatibility: '配天冬→滋阴润肺；配沙参→养阴生津；配生地→清热养阴；配酸枣仁→养心安神；配玉竹→养胃生津',
    category: '补阴药'
  },
  // 17. 天冬
  {
    id: 'herb017', name: '天冬', pinyin: 'Tiandong',
    nature: '性寒，味甘苦',
    meridian: '归肺、肾经',
    effects: '养阴润燥、清肺生津',
    indications: '肺燥干咳、顿咳痰黏、腰膝酸软、骨蒸潮热、内热消渴、热病伤津、咽干口渴、肠燥便秘',
    dosage: '煎服6-12g',
    taboo: '脾胃虚寒及风寒咳嗽者慎用',
    compatibility: '配麦冬→滋阴润肺；配熟地→滋肾补阴；配川贝母→润肺化痰；配知母→滋阴清热',
    category: '补阴药'
  },
  // 18. 玉竹
  {
    id: 'herb018', name: '玉竹', pinyin: 'Yuzhu',
    nature: '性微寒，味甘',
    meridian: '归肺、胃经',
    effects: '养阴润燥、生津止渴',
    indications: '肺胃阴伤、燥热咳嗽、咽干口渴、内热消渴',
    dosage: '煎服6-12g',
    taboo: '脾虚便溏及痰湿内盛者慎用',
    compatibility: '配沙参→养阴润肺；配麦冬→养胃生津；配薄荷→疏风清热；配天花粉→生津止渴',
    category: '补阴药'
  },
  // 19. 沙参
  {
    id: 'herb019', name: '北沙参', pinyin: 'Beishashen',
    nature: '性微寒，味甘微苦',
    meridian: '归肺、胃经',
    effects: '养阴清肺、益胃生津',
    indications: '肺热燥咳、劳嗽痰血、胃阴不足、热病伤津、咽干口渴',
    dosage: '煎服5-12g',
    taboo: '不宜与藜芦同用；风寒咳嗽及肺胃虚寒者慎用',
    compatibility: '配麦冬→养阴润肺；配玉竹→养阴生津；配知母→滋阴清热；配桔梗→清肺利咽',
    category: '补阴药'
  },
  // 20. 百合
  {
    id: 'herb020', name: '百合', pinyin: 'Baihe',
    nature: '性寒，味甘',
    meridian: '归心、肺经',
    effects: '养阴润肺、清心安神',
    indications: '阴虚燥咳、劳嗽咳血、虚烦惊悸、失眠多梦、精神恍惚',
    dosage: '煎服6-12g',
    taboo: '风寒咳嗽及中寒便溏者慎用',
    compatibility: '配麦冬→润肺养阴；配知母→清心安神；配生地→滋阴清热宁心；配酸枣仁→养心安神',
    category: '补阴药'
  },
  // 21. 莲子
  {
    id: 'herb021', name: '莲子', pinyin: 'Lianzi',
    nature: '性平，味甘涩',
    meridian: '归脾、肾、心经',
    effects: '补脾止泻、益肾固精、养心安神',
    indications: '脾虚泄泻、带下、遗精、心悸失眠',
    dosage: '煎服6-15g',
    taboo: '中满痞胀及大便燥结者慎用',
    compatibility: '配芡实→补脾固肾；配山药→健脾止泻；配百合→养心安神；配金樱子→益肾固精',
    category: '收涩药'
  },
  // 22. 芡实
  {
    id: 'herb022', name: '芡实', pinyin: 'Qianshi',
    nature: '性平，味甘涩',
    meridian: '归脾、肾经',
    effects: '益肾固精、补脾止泻、除湿止带',
    indications: '遗精滑精、遗尿尿频、脾虚久泻、带下',
    dosage: '煎服9-15g',
    taboo: '大小便不利者慎用',
    compatibility: '配莲子→补脾固肾；配金樱子→固精缩尿；配山药→健脾补肾；配白术→健脾止泻',
    category: '收涩药'
  },
  // 23. 山药
  {
    id: 'herb023', name: '山药', pinyin: 'Shanyao',
    nature: '性平，味甘',
    meridian: '归脾、肺、肾经',
    effects: '补脾养胃、生津益肺、补肾涩精',
    indications: '脾虚食少、久泻不止、肺虚喘咳、肾虚遗精、带下、尿频、虚热消渴',
    dosage: '煎服15-30g；麸炒山药补脾健胃，用于脾虚食少',
    taboo: '湿盛中满或有实邪积滞者慎用',
    compatibility: '配茯苓→健脾利湿；配芡实→补脾固肾；配熟地→补肾固精；配黄芪→补气健脾',
    category: '补气药'
  },
  // 24. 薏苡仁
  {
    id: 'herb024', name: '薏苡仁', pinyin: 'Yiyiren',
    nature: '性凉，味甘淡',
    meridian: '归脾、胃、肺经',
    effects: '利水渗湿、健脾止泻、除痹、排脓、解毒散结',
    indications: '水肿脚气、小便不利、脾虚泄泻、湿痹拘挛、肺痈肠痈、赘疣癌肿',
    dosage: '煎服9-30g；健脾宜炒用，其余生用',
    taboo: '孕妇慎用',
    compatibility: '配茯苓→健脾利湿；配冬瓜皮→利水消肿；配杏仁→宣肺利湿；配黄芪→补气利水',
    category: '利水渗湿药'
  },
  // 25. 扁豆
  {
    id: 'herb025', name: '白扁豆', pinyin: 'Baibiandou',
    nature: '性微温，味甘',
    meridian: '归脾、胃经',
    effects: '健脾化湿、和中消暑',
    indications: '脾胃虚弱、食欲不振、大便溏泻、白带过多、暑湿吐泻、胸闷腹胀',
    dosage: '煎服9-15g',
    taboo: '生扁豆有毒需煮熟食用',
    compatibility: '配山药→健脾止泻；配茯苓→健脾化湿；配藿香→化湿解暑；配薏苡仁→健脾利湿',
    category: '补气药'
  },
  // 26. 山楂
  {
    id: 'herb026', name: '山楂', pinyin: 'Shanzha',
    nature: '性微温，味酸甘',
    meridian: '归脾、胃、肝经',
    effects: '消食健胃、行气散瘀、化浊降脂',
    indications: '肉食积滞、胃脘胀满、泻痢腹痛、瘀血经闭、产后瘀阻、心腹刺痛、胸痹心痛、疝气疼痛、高脂血症',
    dosage: '煎服9-12g；焦山楂消食导滞作用强',
    taboo: '胃酸过多者慎用；孕妇慎用',
    compatibility: '配神曲→消食化积；配麦芽→消米面积食；配陈皮→理气和胃消食；配丹参→活血化瘀降脂',
    category: '消食药'
  },
  // 27. 神曲
  {
    id: 'herb027', name: '神曲', pinyin: 'Shenqu',
    nature: '性温，味甘辛',
    meridian: '归脾、胃经',
    effects: '消食和胃',
    indications: '饮食积滞、脘腹胀满、食少纳呆、肠鸣腹泻',
    dosage: '煎服6-15g',
    taboo: '胃火盛者慎用',
    compatibility: '配山楂→消肉食积滞；配麦芽→消米面积食；配陈皮→理气消食；配半夏→化痰消痞',
    category: '消食药'
  },
  // 28. 麦芽
  {
    id: 'herb028', name: '麦芽', pinyin: 'Maiya',
    nature: '性平，味甘',
    meridian: '归脾、胃经',
    effects: '行气消食、健脾开胃、回乳消胀',
    indications: '食积不消、脘腹胀痛、脾虚食少、乳汁郁积、乳房胀痛、妇女断乳、肝郁胁痛、肝胃气痛',
    dosage: '煎服10-15g；回乳炒用60g',
    taboo: '哺乳期妇女慎用',
    compatibility: '配山楂→消食化积；配神曲→消食和胃；配鸡内金→健脾消食；配柴胡→疏肝理气消食',
    category: '消食药'
  },
  // 29. 谷芽
  {
    id: 'herb029', name: '谷芽', pinyin: 'Guya',
    nature: '性温，味甘',
    meridian: '归脾、胃经',
    effects: '消食和中、健脾开胃',
    indications: '食积不消、腹胀口臭、脾胃虚弱、不饥食少',
    dosage: '煎服9-15g',
    taboo: '胃火盛者慎用',
    compatibility: '配麦芽→消食和胃；配山楂→消积导滞；配白术→健脾消食；配陈皮→理气开胃',
    category: '消食药'
  },
  // 30. 鸡内金
  {
    id: 'herb030', name: '鸡内金', pinyin: 'Jineijin',
    nature: '性平，味甘',
    meridian: '归脾、胃、小肠、膀胱经',
    effects: '健胃消食、涩精止遗、通淋化石',
    indications: '食积不消、呕吐泻痢、小儿疳积、遗尿遗精、石淋涩痛、胆胀胁痛',
    dosage: '煎服3-10g；研末服1.5-3g，效果优于煎剂',
    taboo: '脾虚无积滞者慎用',
    compatibility: '配山楂→消食化积；配麦芽→消谷食；配金钱草→通淋化石；配山药→健脾消食固精',
    category: '消食药'
  },
  // 31. 杜仲
  {
    id: 'herb031', name: '杜仲', pinyin: 'Duzhong',
    nature: '性温，味甘',
    meridian: '归肝、肾经',
    effects: '补肝肾、强筋骨、安胎',
    indications: '肝肾不足之腰膝酸痛、筋骨无力、头晕目眩、妊娠漏血、胎动不安',
    dosage: '煎服6-10g',
    taboo: '阴虚火旺者慎用',
    compatibility: '配续断→强筋壮骨；配牛膝→补肝肾强腰膝；配桑寄生→安胎止痛；配巴戟天→温肾助阳',
    category: '补阳药'
  },
  // 32. 续断
  {
    id: 'herb032', name: '续断', pinyin: 'Xuduan',
    nature: '性微温，味苦辛',
    meridian: '归肝、肾经',
    effects: '补肝肾、强筋骨、续折伤、止崩漏',
    indications: '肝肾不足之腰膝酸软、风湿痹痛、跌打损伤、筋骨折伤、崩漏下血、胎动不安',
    dosage: '煎服9-15g',
    taboo: '风湿热痹者慎用',
    compatibility: '配杜仲→补肾强腰；配骨碎补→续筋接骨；配桑寄生→补肾安胎；配当归→活血止痛',
    category: '补阳药'
  },
  // 33. 骨碎补
  {
    id: 'herb033', name: '骨碎补', pinyin: 'Gusuibu',
    nature: '性温，味苦',
    meridian: '归肝、肾经',
    effects: '活血续伤、补肾强骨',
    indications: '跌打损伤、筋骨折伤、瘀肿疼痛、肾虚腰痛、耳鸣耳聋、牙齿松动',
    dosage: '煎服3-9g；外用适量研末敷',
    taboo: '阴虚火旺及无瘀血者慎用',
    compatibility: '配续断→续筋接骨；配自然铜→活血疗伤；配补骨脂→补肾壮骨；配牛膝→活血强筋',
    category: '活血化瘀药'
  },
  // 34. 益智仁
  {
    id: 'herb034', name: '益智仁', pinyin: 'Yizhiren',
    nature: '性温，味辛',
    meridian: '归脾、肾经',
    effects: '暖肾固精缩尿、温脾止泻摄唾',
    indications: '肾虚遗尿、小便频数、遗精白浊、脾寒泄泻、腹中冷痛、口多唾涎',
    dosage: '煎服3-10g',
    taboo: '阴虚火旺及实热证者忌用',
    compatibility: '配乌药→缩尿止遗；配山药→补脾益肾；配补骨脂→温肾固精；配白术→温脾止泻',
    category: '补阳药'
  },
  // 35. 覆盆子
  {
    id: 'herb035', name: '覆盆子', pinyin: 'Fupenzi',
    nature: '性温，味甘酸',
    meridian: '归肝、肾、膀胱经',
    effects: '益肾固精缩尿、养肝明目',
    indications: '遗精滑精、遗尿尿频、阳痿早泄、目暗昏花',
    dosage: '煎服6-12g',
    taboo: '肾虚有火及小便短涩者慎用',
    compatibility: '配金樱子→固精缩尿；配枸杞→养肝明目；配菟丝子→补肾固精；配五味子→补肾涩精',
    category: '收涩药'
  },
  // 36. 金樱子
  {
    id: 'herb036', name: '金樱子', pinyin: 'Jinyingzi',
    nature: '性平，味酸甘涩',
    meridian: '归肾、膀胱、大肠经',
    effects: '固精缩尿、固崩止带、涩肠止泻',
    indications: '遗精滑精、遗尿尿频、崩漏带下、久泻久痢',
    dosage: '煎服6-12g',
    taboo: '实火及湿热泻痢者忌用',
    compatibility: '配芡实→水陆二仙丹固精止遗；配覆盆子→固精缩尿；配莲子→涩精止泻；配山药→补肾固涩',
    category: '收涩药'
  },
  // 37. 桑螵蛸
  {
    id: 'herb037', name: '桑螵蛸', pinyin: 'Sangpiaoxiao',
    nature: '性平，味甘咸',
    meridian: '归肝、肾经',
    effects: '固精缩尿、补肾助阳',
    indications: '遗精滑精、遗尿尿频、小便白浊、肾虚阳痿',
    dosage: '煎服5-10g',
    taboo: '阴虚火旺及膀胱有热者忌用',
    compatibility: '配龙骨→收敛固涩；配益智仁→温肾缩尿；配菟丝子→补肾固精；配山茱萸→补肾涩精',
    category: '收涩药'
  },
  // 38. 海螵蛸
  {
    id: 'herb038', name: '海螵蛸', pinyin: 'Haipiaoxiao',
    nature: '性微温，味咸涩',
    meridian: '归肝、肾经',
    effects: '固精止带、收敛止血、制酸止痛、收湿敛疮',
    indications: '遗精带下、崩漏便血、胃痛吞酸、外伤出血、湿疹湿疮',
    dosage: '煎服5-10g；外用适量研末撒敷',
    taboo: '阴虚多热者慎用',
    compatibility: '配贝母→制酸止痛；配白及→收敛止血；配茜草→固崩止带；配煅瓦楞子→制酸和胃',
    category: '收涩药'
  },
  // 39. 瓦楞子
  {
    id: 'herb039', name: '瓦楞子', pinyin: 'Walengzi',
    nature: '性平，味咸',
    meridian: '归肺、胃、肝经',
    effects: '消痰化瘀、软坚散结、制酸止痛',
    indications: '顽痰胶结、瘿瘤瘰疬、症瘕痞块、胃痛泛酸',
    dosage: '煎服9-15g，宜打碎先煎',
    taboo: '无瘀滞者慎用',
    compatibility: '配海藻→软坚散结；配海螵蛸→制酸止痛；配鳖甲→软坚消症；配半夏→化痰散结',
    category: '化痰止咳药'
  },
  // 40. 决明子
  {
    id: 'herb040', name: '决明子', pinyin: 'Juemingzi',
    nature: '性微寒，味甘苦咸',
    meridian: '归肝、大肠经',
    effects: '清热明目、润肠通便',
    indications: '目赤涩痛、羞明多泪、目暗不明、头痛眩晕、肠燥便秘',
    dosage: '煎服9-15g',
    taboo: '气虚便溏者慎用',
    compatibility: '配菊花→清肝明目；配枸杞→养肝明目；配夏枯草→清肝泻火；配火麻仁→润肠通便',
    category: '清热药'
  },
  // 41. 夏枯草
  {
    id: 'herb041', name: '夏枯草', pinyin: 'Xiakucao',
    nature: '性寒，味辛苦',
    meridian: '归肝、胆经',
    effects: '清肝泻火、明目、散结消肿',
    indications: '目赤肿痛、目珠夜痛、头痛眩晕、瘿瘤瘰疬、乳痈肿痛、高血压属肝火者',
    dosage: '煎服9-15g',
    taboo: '脾胃虚寒者慎用',
    compatibility: '配菊花→清肝明目；配决明子→降压明目；配蒲公英→散结消肿；配玄参→软坚散结',
    category: '清热药'
  },
  // 42. 蒲公英
  {
    id: 'herb042', name: '蒲公英', pinyin: 'Pugongying',
    nature: '性寒，味苦甘',
    meridian: '归肝、胃经',
    effects: '清热解毒、消肿散结、利尿通淋',
    indications: '疔疮肿毒、乳痈、瘰疬、目赤咽痛、肺痈肠痈、湿热黄疸、热淋涩痛',
    dosage: '煎服10-15g；外用适量捣敷',
    taboo: '脾胃虚寒者慎用',
    compatibility: '配金银花→清热解毒；配连翘→消痈散结；配夏枯草→散结消肿；配车前草→利尿通淋',
    category: '清热药'
  },
  // 43. 金银花
  {
    id: 'herb043', name: '金银花', pinyin: 'Jinyinhua',
    nature: '性寒，味甘',
    meridian: '归肺、心、胃经',
    effects: '清热解毒、疏散风热',
    indications: '痈肿疔疮、喉痹丹毒、风热感冒、温病发热、热毒血痢',
    dosage: '煎服6-15g',
    taboo: '脾胃虚寒及气虚疮疡脓清者慎用',
    compatibility: '配连翘→疏散风热、清热解毒；配蒲公英→消痈解毒；配菊花→疏散风热；配黄芩→清热燥湿解毒',
    category: '清热药'
  },
  // 44. 连翘
  {
    id: 'herb044', name: '连翘', pinyin: 'Lianqiao',
    nature: '性微寒，味苦',
    meridian: '归肺、心、小肠经',
    effects: '清热解毒、消肿散结、疏散风热',
    indications: '痈疽瘰疬、乳痈丹毒、风热感冒、温病初起、温热入营、高热烦渴、热淋涩痛',
    dosage: '煎服6-15g',
    taboo: '脾胃虚寒及气虚疮疡者慎用',
    compatibility: '配金银花→银翘散主药清热解毒；配薄荷→疏散风热；配夏枯草→散结消肿；配栀子→清心泻火',
    category: '清热药'
  },
  // 45. 板蓝根
  {
    id: 'herb045', name: '板蓝根', pinyin: 'Banlangen',
    nature: '性寒，味苦',
    meridian: '归心、胃经',
    effects: '清热解毒、凉血利咽',
    indications: '温疫时毒、发热咽痛、温毒发斑、痄腮（腮腺炎）、烂喉丹痧、大头瘟疫、丹毒痈肿',
    dosage: '煎服9-15g',
    taboo: '体虚而无实火热毒者忌用，脾胃虚寒者慎用',
    compatibility: '配大青叶→凉血解毒；配金银花→清热利咽；配连翘→清热解毒；配玄参→滋阴凉血利咽',
    category: '清热药'
  },
  // 46. 大青叶
  {
    id: 'herb046', name: '大青叶', pinyin: 'Daqingye',
    nature: '性寒，味苦',
    meridian: '归心、胃经',
    effects: '清热解毒、凉血消斑',
    indications: '温病高热、神昏发斑、痄腮喉痹、丹毒痈肿',
    dosage: '煎服9-15g；外用适量捣敷',
    taboo: '脾胃虚寒者忌用',
    compatibility: '配板蓝根→清热解毒凉血；配石膏→清气凉血；配栀子→清热凉血解毒；配玄参→凉血利咽',
    category: '清热药'
  },
  // 47. 鱼腥草
  {
    id: 'herb047', name: '鱼腥草', pinyin: 'Yuxingcao',
    nature: '性微寒，味辛',
    meridian: '归肺经',
    effects: '清热解毒、消痈排脓、利尿通淋',
    indications: '肺痈吐脓、痰热喘咳、热痢热淋、痈肿疮毒',
    dosage: '煎服15-25g，不宜久煎；鲜品加倍',
    taboo: '虚寒证及阴性疮疡者忌用',
    compatibility: '配桔梗→排脓消痈；配金银花→清热解毒；配车前草→利尿通淋；配黄芩→清肺化痰',
    category: '清热药'
  },
  // 48. 射干
  {
    id: 'herb048', name: '射干', pinyin: 'Shegan',
    nature: '性寒，味苦',
    meridian: '归肺经',
    effects: '清热解毒、消痰利咽',
    indications: '热毒痰火郁结之咽喉肿痛、痰涎壅盛、咳嗽气喘',
    dosage: '煎服3-10g',
    taboo: '脾虚便溏及孕妇慎用',
    compatibility: '配桔梗→清热利咽；配麻黄→宣肺平喘；配黄芩→清热化痰；配牛蒡子→利咽散结',
    category: '清热药'
  },
  // 49. 马勃
  {
    id: 'herb049', name: '马勃', pinyin: 'Mabo',
    nature: '性平，味辛',
    meridian: '归肺经',
    effects: '清肺利咽、止血',
    indications: '风热郁肺之咽痛音哑、咳嗽；外治鼻衄、创伤出血',
    dosage: '煎服2-6g，包煎；外用适量敷贴',
    taboo: '风寒咳嗽者慎用',
    compatibility: '配玄参→清热利咽；配青黛→凉血利咽；配白及→收敛止血；配射干→清热利咽散结',
    category: '清热药'
  },
  // 50. 山豆根
  {
    id: 'herb050', name: '山豆根', pinyin: 'Shandougen',
    nature: '性寒，味苦，有毒',
    meridian: '归肺、胃经',
    effects: '清热解毒、消肿利咽',
    indications: '火毒蕴结之乳蛾喉痹（扁桃体炎/咽喉炎）、牙龈肿痛、口舌生疮',
    dosage: '煎服3-6g；外用适量',
    taboo: '脾胃虚寒泄泻者忌用；用量不宜过大',
    compatibility: '配射干→清热利咽解毒；配玄参→滋阴降火利咽；配板蓝根→清热利咽凉血；配桔梗→宣肺利咽',
    category: '清热药'
  }
];

// ===== 养生药膳方 =====
const HERBAL_RECIPES = [
  {
    id: 'rec001', name: '四君子汤',
    category: '补气类',
    ingredients: '人参9g、白术9g、茯苓9g、甘草6g',
    effects: '益气健脾',
    suitable: '脾胃气虚证，面色萎黄、语声低微、食少便溏者',
    method: '上四味加水适量，浸泡30分钟后煎煮，武火煮沸转文火煎30分钟，取汁；再加水煎25分钟，合并煎液分2-3次温服',
    taboo: '实热证及阴虚火旺者不宜'
  },
  {
    id: 'rec002', name: '四物汤',
    category: '补血类',
    ingredients: '当归9g、川芎6g、白芍9g、熟地黄12g',
    effects: '补血调血',
    suitable: '血虚证，面色无华、头晕目眩、月经不调者',
    method: '上四味加水适量，浸泡后煎煮30分钟，取汁；再加水煎25分钟，合并煎液分2-3次温服。亦可加鸡肉炖汤',
    taboo: '湿热及阴虚火旺者慎用'
  },
  {
    id: 'rec003', name: '八珍汤',
    category: '气血双补类',
    ingredients: '人参6g、白术9g、茯苓9g、甘草6g、当归9g、川芎6g、白芍9g、熟地12g',
    effects: '益气补血',
    suitable: '气血两虚证，面色萎黄、头晕目眩、四肢倦怠、气短懒言者',
    method: '上八味加水适量，浸泡30分钟后煎煮。武火煮沸转文火煎30分钟取汁，再煎一次，合并煎液分2-3次温服',
    taboo: '感冒发热及实证者不宜'
  },
  {
    id: 'rec004', name: '当归生姜羊肉汤',
    category: '温补类',
    ingredients: '当归15g、生姜30g、羊肉500g',
    effects: '温中补血、祛寒止痛',
    suitable: '血虚有寒者，产后腹痛、寒疝腹痛、虚劳不足者',
    method: '羊肉切块焯水去血沫，与当归生姜同入砂锅，加水大火烧开转小火炖1.5-2小时至肉烂，加盐调味即可',
    taboo: '阴虚火旺及热证者不宜'
  },
  {
    id: 'rec005', name: '百合银耳羹',
    category: '润肺类',
    ingredients: '百合15g、银耳10g、冰糖适量',
    effects: '养阴润肺、清心安神',
    suitable: '肺燥干咳、虚烦失眠、口干咽燥者',
    method: '银耳泡发撕小朵，与百合同入锅加水适量，大火烧开转小火炖1小时至银耳出胶，加冰糖调味',
    taboo: '风寒咳嗽者不宜'
  },
  {
    id: 'rec006', name: '莲子芡实粥',
    category: '健脾类',
    ingredients: '莲子30g、芡实30g、糯米60g、冰糖适量',
    effects: '补脾止泻、益肾固精',
    suitable: '脾虚泄泻、遗精带下、夜尿频繁者',
    method: '莲子去芯与芡实提前浸泡2小时，与糯米同入锅加水煮粥，粥熟加冰糖即可',
    taboo: '便秘及腹胀者慎用'
  },
  {
    id: 'rec007', name: '党参黄芪炖鸡',
    category: '补气类',
    ingredients: '党参15g、黄芪20g、红枣10枚、母鸡1只',
    effects: '益气固表、补血养颜',
    suitable: '气血不足、免疫力低下、病后体虚者',
    method: '母鸡焯水去血沫，与党参黄芪红枣同入砂锅，加水大火烧开转小火炖1.5小时，加盐调味即可',
    taboo: '高血压及实热证者不宜'
  },
  {
    id: 'rec008', name: '枸杞菊花茶',
    category: '明目类',
    ingredients: '枸杞10g、菊花5g、冰糖适量',
    effects: '养肝明目、清热降火',
    suitable: '肝血不足、视物昏花、目赤干涩、长期用电脑者',
    method: '枸杞菊花放入杯中，加沸水冲泡，加盖焖5-10分钟，加冰糖调味即可',
    taboo: '脾胃虚寒者少量饮用'
  },
  {
    id: 'rec009', name: '山药茯苓糕',
    category: '健脾类',
    ingredients: '山药200g、茯苓粉100g、糯米粉100g、白糖适量',
    effects: '健脾益气、祛湿止泻',
    suitable: '脾虚食少、消化不良、形体消瘦者',
    method: '山药蒸熟去皮捣泥，与茯苓粉糯米粉白糖加水调匀，入模具蒸20分钟即可',
    taboo: '湿热壅滞者不宜'
  },
  {
    id: 'rec010', name: '天麻炖鱼头',
    category: '平肝类',
    ingredients: '天麻10g、川芎6g、鱼头1个（约500g）、生姜3片',
    effects: '平肝息风、通络止痛',
    suitable: '肝阳上亢所致头痛眩晕、高血压者',
    method: '鱼头洗净去腮，与天麻川芎生姜同入砂锅，加水大火烧开转小火炖40分钟，加盐调味',
    taboo: '气血虚弱及低血压者慎用'
  },
  {
    id: 'rec011', name: '麦冬玉竹沙参汤',
    category: '润燥类',
    ingredients: '麦冬12g、玉竹12g、沙参12g、瘦肉200g',
    effects: '养阴润肺、生津润燥',
    suitable: '肺胃阴虚之干咳少痰、口干咽燥、皮肤干燥者',
    method: '瘦肉切块焯水，与麦冬玉竹沙参同入砂锅，大火烧开转小火炖1小时，加盐调味',
    taboo: '风寒咳嗽及脾胃虚寒者不宜'
  },
  {
    id: 'rec012', name: '桂圆红枣茶',
    category: '补血类',
    ingredients: '桂圆肉15g、红枣10枚、枸杞10g、红糖适量',
    effects: '补血养心、安神助眠',
    suitable: '心血不足之失眠健忘、面色萎黄、产后体虚者',
    method: '红枣去核与桂圆枸杞同入锅加水适量，煮15分钟，加红糖调味饮用',
    taboo: '糖尿病及痰湿壅盛者慎用'
  },
  {
    id: 'rec013', name: '山楂麦芽茶',
    category: '消食类',
    ingredients: '山楂10g、麦芽15g、陈皮5g',
    effects: '消食化积、健脾开胃',
    suitable: '饮食积滞、消化不良、脘腹胀满者',
    method: '山楂麦芽陈皮放入杯中，加沸水冲泡，加盖焖10分钟即可饮用',
    taboo: '胃酸过多及孕妇慎用'
  },
  {
    id: 'rec014', name: '灵芝红枣煲鸡汤',
    category: '扶正类',
    ingredients: '灵芝片15g、红枣10枚、枸杞10g、母鸡1只',
    effects: '扶正固本、益气养血、增强免疫',
    suitable: '免疫力低下、病后体虚、亚健康状态者',
    method: '母鸡焯水去血沫，与灵芝片红枣同入砂锅，大火烧开转小火炖1.5小时，起锅前15分钟加枸杞，加盐调味',
    taboo: '实热证及感冒发热时不宜'
  },
  {
    id: 'rec015', name: '陈皮薏仁粥',
    category: '祛湿类',
    ingredients: '陈皮5g、薏苡仁50g、大米50g',
    effects: '理气健脾、祛湿消肿',
    suitable: '脾虚湿盛所致身体困重、浮肿、大便粘滞者',
    method: '薏苡仁提前浸泡2小时，与大米陈皮同入锅加水煮粥，粥熟即可',
    taboo: '阴虚燥热及便秘者慎用'
  },
  {
    id: 'rec016', name: '杜仲猪腰汤',
    category: '补肾类',
    ingredients: '杜仲15g、核桃仁30g、猪腰1对、生姜3片',
    effects: '补肾强腰、固精壮骨',
    suitable: '肾虚腰痛、腰膝酸软、阳痿遗精者',
    method: '猪腰剖开去白筋膜，焯水去腥，与杜仲核桃仁生姜同入砂锅，大火烧开转小火炖1小时，加盐调味',
    taboo: '阴虚火旺及湿热下注者不宜'
  },
  {
    id: 'rec017', name: '菊花决明子茶',
    category: '清肝类',
    ingredients: '菊花5g、决明子10g、枸杞5g',
    effects: '清肝明目、润肠通便',
    suitable: '肝火旺盛所致目赤肿痛、视物模糊、便秘者',
    method: '决明子略炒，与菊花枸杞同放入杯中，加沸水冲泡，加盖焖10分钟即可饮用',
    taboo: '脾胃虚寒及低血压者慎用'
  },
  {
    id: 'rec018', name: '阿胶红枣鸡蛋糖水',
    category: '补血类',
    ingredients: '阿胶10g、红枣10枚、鸡蛋1个、红糖适量',
    effects: '补血滋阴、美容养颜',
    suitable: '血虚所致面色萎黄、月经不调、产后血虚者',
    method: '红枣去核加水煮15分钟，打入鸡蛋，阿胶打粉以少量温水化开加入搅匀，加红糖调味',
    taboo: '痰湿体质及消化不良者少量'
  },
  {
    id: 'rec019', name: '太子参炖瘦肉',
    category: '补气类',
    ingredients: '太子参15g、白术10g、茯苓10g、瘦肉200g',
    effects: '健脾益气、养阴生津',
    suitable: '脾肺气虚所致食欲不振、体虚易感冒、小儿发育迟缓者',
    method: '瘦肉切块焯水，与太子参白术茯苓同入砂锅，大火烧开转小火炖1小时，加盐调味',
    taboo: '实邪未尽者慎用'
  },
  {
    id: 'rec020', name: '桑葚枸杞膏',
    category: '滋补类',
    ingredients: '桑葚干200g、枸杞100g、蜂蜜200g',
    effects: '滋阴补血、养肝明目、乌须黑发',
    suitable: '肝肾阴虚所致头晕目眩、须发早白、腰膝酸软者',
    method: '桑葚干枸杞加水适量浸泡1小时后煎煮，取浓汁，加蜂蜜慢火收膏。每次1-2匙，温水送服',
    taboo: '糖尿病及脾虚便溏者慎用'
  },
  {
    id: 'rec021', name: '四君子汤（正方）',
    category: '补气类',
    ingredients: '人参9g、白术9g、茯苓9g、炙甘草6g',
    effects: '益气健脾',
    suitable: '脾胃气虚证，面色萎黄、语声低微、气短乏力、食少便溏者',
    method: '上四味加水适量，浸泡30分钟后武火煮沸，转文火煎30分钟取汁；再加水煎25分钟，合并煎液分早晚两次温服',
    taboo: '实热证及阴虚火旺者不宜'
  },
  {
    id: 'rec022', name: '四物汤（正方）',
    category: '补血类',
    ingredients: '当归10g、川芎8g、白芍12g、熟地黄12g',
    effects: '补血调血、调经止痛',
    suitable: '血虚血滞证，月经不调、脐腹疼痛、崩漏、产后恶露不下者',
    method: '上四味加水适量，浸泡后煎煮30分钟取汁；再加水煎25分钟，合并煎液分早晚两次温服。空腹服用效果更佳',
    taboo: '阴虚发热及血崩气脱者不宜'
  },
  {
    id: 'rec023', name: '六味地黄丸（汤）',
    category: '补阴类',
    ingredients: '熟地黄24g、山茱萸12g、山药12g、泽泻9g、牡丹皮9g、茯苓9g',
    effects: '滋阴补肾',
    suitable: '肾阴亏损之头晕耳鸣、腰膝酸软、骨蒸潮热、盗汗遗精、消渴者',
    method: '上六味加水适量，浸泡后武火煮沸转文火煎30分钟取汁；再煎一次，合并煎液分早晚两次温服。成药丸剂每次8粒，每日3次',
    taboo: '脾虚泄泻及湿热者慎用'
  },
  {
    id: 'rec024', name: '八珍汤（正方）',
    category: '气血双补类',
    ingredients: '人参6g、白术9g、茯苓9g、当归9g、川芎6g、白芍9g、熟地黄12g、炙甘草6g、生姜3片、大枣5枚',
    effects: '益气补血',
    suitable: '气血两虚证，面色苍白或萎黄、头晕目眩、四肢倦怠、气短懒言、心悸怔忡、饮食减少者',
    method: '上十味加水适量，浸泡30分钟后煎煮，武火煮沸转文火煎30分钟取汁；再煎一次合并煎液分早晚两次温服',
    taboo: '感冒发热及实证者不宜'
  },
  {
    id: 'rec025', name: '十全大补汤',
    category: '气血双补类',
    ingredients: '人参6g、白术9g、茯苓9g、当归9g、川芎6g、白芍9g、熟地黄12g、炙甘草6g、黄芪15g、肉桂3g',
    effects: '温补气血',
    suitable: '气血两虚兼阳虚证，面色萎黄、倦怠食少、头晕目眩、畏寒肢冷、疮疡不敛者',
    method: '上十味加水适量，浸泡后武火煮沸转文火煎30分钟取汁；再煎一次合并煎液，分早晚两次温服。可加鸡肉或排骨同炖',
    taboo: '阴虚火旺及实热证者忌用'
  },
  {
    id: 'rec026', name: '补中益气汤',
    category: '补气类',
    ingredients: '黄芪18g、炙甘草9g、人参6g、当归3g、陈皮6g、升麻6g、柴胡6g、白术9g',
    effects: '补中益气、升阳举陷',
    suitable: '脾胃气虚及气陷证，食少体倦、少气懒言、久泻脱肛、子宫脱垂、胃下垂者',
    method: '上八味加水适量，浸泡后武火煮沸转文火煎30分钟取汁；再煎一次合并煎液，分早晚两次温服',
    taboo: '阴虚发热及上实下虚者不宜'
  },
  {
    id: 'rec027', name: '归脾汤',
    category: '补血类',
    ingredients: '白术9g、当归9g、茯神9g、黄芪12g、龙眼肉12g、酸枣仁12g、人参6g、木香6g、炙甘草6g、远志6g',
    effects: '益气补血、健脾养心',
    suitable: '心脾两虚证，心悸怔忡、失眠健忘、食少体倦、面色萎黄、脾不统血之便血崩漏者',
    method: '上十味加水适量，浸泡后武火煮沸转文火煎30分钟取汁；再煎一次合并煎液，分早晚两次温服',
    taboo: '实热及阴虚火旺者慎用'
  },
  {
    id: 'rec028', name: '逍遥散（汤）',
    category: '理气类',
    ingredients: '柴胡9g、当归9g、白芍9g、白术9g、茯苓9g、炙甘草6g、薄荷3g（后下）、煨生姜3片',
    effects: '疏肝解郁、养血健脾',
    suitable: '肝郁血虚脾弱证，两胁作痛、头痛目眩、口燥咽干、神疲食少、月经不调、乳房胀痛者',
    method: '上八味加水适量（薄荷后下），浸泡后武火煮沸转文火煎25分钟，最后5分钟放入薄荷；取汁再煎一次，合并煎液分早晚两次温服',
    taboo: '阴虚阳亢者慎用'
  },
  {
    id: 'rec029', name: '桂枝汤',
    category: '解表类',
    ingredients: '桂枝9g、白芍9g、炙甘草6g、生姜9g、大枣12枚',
    effects: '解肌发表、调和营卫',
    suitable: '外感风寒表虚证，头痛发热、汗出恶风、鼻鸣干呕者',
    method: '上五味加水适量，浸泡后武火煮沸转文火煎20分钟取汁；再煎一次合并煎液，分两次温服。服后喝热稀粥一碗以助药力，盖被微发汗',
    taboo: '表实无汗及温病初起者忌用'
  },
  {
    id: 'rec030', name: '麻黄汤',
    category: '解表类',
    ingredients: '麻黄9g、桂枝6g、杏仁9g、炙甘草3g',
    effects: '发汗解表、宣肺平喘',
    suitable: '外感风寒表实证，恶寒发热、头身疼痛、无汗而喘者',
    method: '上四味加水适量，先煎麻黄去上沫，再加余药同煎20分钟取汁；再煎一次合并煎液，分两次温服。服后盖被取微汗',
    taboo: '表虚自汗、体虚外感及高血压心脏病者忌用'
  },
  {
    id: 'rec031', name: '银翘散（汤）',
    category: '清热类',
    ingredients: '金银花15g、连翘15g、桔梗9g、薄荷6g（后下）、竹叶6g、荆芥穗6g、淡豆豉9g、牛蒡子9g、甘草6g',
    effects: '辛凉解表、清热解毒',
    suitable: '温病初起之风热表证，发热无汗或汗出不畅、微恶风寒、头痛口渴、咳嗽咽痛者',
    method: '上九味加水适量（薄荷后下），浸泡后武火煮沸转文火煎20分钟，最后5分钟放入薄荷；取汁分两次温服。每日一剂',
    taboo: '风寒感冒及脾胃虚寒者不宜'
  },
  {
    id: 'rec032', name: '藿香正气汤',
    category: '祛湿类',
    ingredients: '藿香9g、紫苏6g、白芷6g、大腹皮9g、茯苓9g、白术9g、半夏9g、陈皮6g、厚朴6g、桔梗6g、炙甘草6g',
    effects: '解表化湿、理气和中',
    suitable: '外感风寒内伤湿滞证，恶寒发热、头痛、胸膈满闷、腹痛呕吐、肠鸣泄泻者；夏季暑湿感冒尤宜',
    method: '上十一味加水适量，浸泡后武火煮沸转文火煎25分钟取汁；再煎一次合并煎液，分两次温服',
    taboo: '阴虚火旺及实热证者不宜'
  },
  {
    id: 'rec033', name: '保和丸（汤）',
    category: '消食类',
    ingredients: '山楂18g、神曲9g、半夏9g、茯苓9g、陈皮6g、连翘6g、莱菔子9g',
    effects: '消食和胃',
    suitable: '食积停滞证，脘腹痞满胀痛、嗳腐吞酸、恶食呕逆、大便泄泻者',
    method: '上七味加水适量，浸泡后武火煮沸转文火煎20分钟取汁；再煎一次合并煎液，分两次温服。食后半小时服用效果最佳',
    taboo: '脾胃虚寒及无积滞者慎用'
  },
  {
    id: 'rec034', name: '健脾丸（汤）',
    category: '消食类',
    ingredients: '白术15g、木香6g、黄连6g、甘草6g、茯苓12g、人参9g、神曲9g、陈皮6g、砂仁6g（后下）、麦芽12g、山楂12g、山药12g',
    effects: '健脾和胃、消食止泻',
    suitable: '脾虚食积证，食少难消、脘腹痞闷、大便溏薄、倦怠乏力者',
    method: '上十二味加水适量（砂仁后下），浸泡后武火煮沸转文火煎25分钟，最后5分钟放入砂仁；取汁再煎一次合并煎液，分两次温服',
    taboo: '实热积滞者不宜'
  },
  {
    id: 'rec035', name: '玉屏风散（汤）',
    category: '补气类',
    ingredients: '黄芪30g、白术15g、防风10g',
    effects: '益气固表止汗',
    suitable: '表虚不固之自汗恶风、面色㿠白、体虚易感风邪者',
    method: '上三味加水适量，浸泡后武火煮沸转文火煎25分钟取汁；再煎一次合并煎液，分两次温服。长期服用可增强免疫力',
    taboo: '外感表实邪盛者忌用'
  },
  {
    id: 'rec036', name: '生脉散（汤）',
    category: '补气类',
    ingredients: '人参9g、麦冬15g、五味子6g',
    effects: '益气生津、敛阴止汗',
    suitable: '气阴两伤证，汗多神疲、体倦乏力、气短懒言、咽干口渴、脉虚数者',
    method: '上三味加水适量，浸泡后武火煮沸转文火煎20分钟取汁；再煎一次合并煎液，分两次温服。夏季可作茶饮冷服',
    taboo: '外邪未解及实热证者忌用'
  },
  {
    id: 'rec037', name: '小柴胡汤',
    category: '和解类',
    ingredients: '柴胡12g、黄芩9g、人参6g、半夏9g、炙甘草6g、生姜9g、大枣12枚',
    effects: '和解少阳',
    suitable: '少阳证，寒热往来、胸胁苦满、默默不欲饮食、心烦喜呕、口苦咽干者',
    method: '上七味加水适量，浸泡后武火煮沸转文火煎25分钟取汁；再煎一次合并煎液，分两次温服',
    taboo: '阴虚血少及肝阳上亢者慎用'
  },
  {
    id: 'rec038', name: '大柴胡汤',
    category: '和解类',
    ingredients: '柴胡12g、黄芩9g、白芍9g、半夏9g、枳实9g、大黄6g（后下）、生姜15g、大枣12枚',
    effects: '和解少阳、内泻热结',
    suitable: '少阳阳明合病，寒热往来、胸胁苦满、呕不止、郁郁微烦、心下痞硬、大便不解者',
    method: '上八味加水适量（大黄后下），浸泡后武火煮沸转文火煎25分钟，最后5分钟放入大黄；取汁分两次温服',
    taboo: '单纯少阳证及脾胃虚寒者忌用'
  },
  {
    id: 'rec039', name: '五苓散（汤）',
    category: '祛湿类',
    ingredients: '猪苓9g、泽泻15g、白术9g、茯苓9g、桂枝6g',
    effects: '利水渗湿、温阳化气',
    suitable: '膀胱气化不利之蓄水证，小便不利、水肿腹胀、渴欲饮水但水入即吐者',
    method: '上五味加水适量，浸泡后武火煮沸转文火煎20分钟取汁；再煎一次合并煎液，分两次温服',
    taboo: '阴虚及湿热者不宜'
  },
  {
    id: 'rec040', name: '真武汤',
    category: '祛湿类',
    ingredients: '茯苓9g、白芍9g、生姜9g、白术6g、炮附子9g（先煎）',
    effects: '温阳利水',
    suitable: '阳虚水泛证，小便不利、四肢沉重疼痛、浮肿、腹痛下利、心悸头眩者',
    method: '附子先煎40分钟去毒，再加余药同煎25分钟取汁；再煎一次合并煎液，分两次温服',
    taboo: '阴虚阳亢及实热证者忌用'
  }
];

// ===== 中药配伍禁忌 =====
const HERB_CONTRAINDICATIONS = {
  shibafan: {
    title: '十八反',
    intro: '十八反是中药配伍中的绝对禁忌，两种药物同用会产生剧烈毒副作用，临床严禁合用。以下为十八反歌诀及详解。',
    koujue: '本草明言十八反，半萎贝蔹及攻乌，藻戟遂芫俱战草，诸参辛芍叛藜芦。',
    pairs: [
      {
        group: '乌头类（川乌、草乌、附子）',
        contraindicated: '半夏、瓜蒌（全瓜蒌、瓜蒌皮、瓜蒌仁、天花粉）、贝母（川贝母、浙贝母）、白蔹、白及',
        risk: '同用可致心律失常、呼吸抑制甚至死亡',
        detail: '乌头类药物含乌头碱，与半夏等药同用会增强心脏毒性。乌头反半夏为十八反之首，临床最需警惕。'
      },
      {
        group: '甘草',
        contraindicated: '海藻、大戟、甘遂、芫花',
        risk: '同用可致水电解质紊乱、肝肾损伤',
        detail: '甘草的肾上腺皮质激素样作用与海藻等的利尿作用相互拮抗，可引起严重的水电解质紊乱。但现代研究显示海藻与甘草在某些特定配比下可安全使用（如海藻玉壶汤），需遵医嘱。'
      },
      {
        group: '藜芦',
        contraindicated: '人参、沙参、丹参、玄参、苦参、细辛、白芍、赤芍',
        risk: '同用可致剧烈呕吐、血压下降、呼吸抑制',
        detail: '藜芦本身有剧毒，含藜芦碱能强烈刺激消化道和抑制中枢神经。与人参等补益药同用会引发剧烈毒性反应。藜芦与诸参相反，涵盖范围最广。'
      }
    ],
    note: '十八反是中药配伍的底线规则，但在某些特殊复方中（如感应丸中的巴豆与牵牛同用），经过特殊炮制和配伍后可有控制地使用。此类用法必须由经验丰富的中医师严格掌握，不可自行尝试。'
  },
  shijiuwei: {
    title: '十九畏',
    intro: '十九畏指两种药物同用时会相互削弱药效或产生不良反应，临床应避免同时使用。与十八反不同，十九畏并非绝对毒性禁忌，但强烈建议避免合用。',
    koujue: '硫黄原是火中精，朴硝一见便相争；水银莫与砒霜见，狼毒最怕密陀僧；巴豆性烈最为上，偏与牵牛不顺情；丁香莫与郁金见，牙硝难合京三棱；川乌草乌不顺犀，人参最怕五灵脂；官桂善能调冷气，若逢石脂便相欺。',
    pairs: [
      { drugA: '硫黄', drugB: '朴硝（芒硝）', risk: '药性冲突，硫黄大热朴硝大寒，相互抵消且可能产生毒性', category: '寒热冲突' },
      { drugA: '水银', drugB: '砒霜', risk: '两毒相加，毒性急剧增强，可致死', category: '剧毒' },
      { drugA: '狼毒', drugB: '密陀僧', risk: '药性冲突，毒性增强', category: '毒性' },
      { drugA: '巴豆', drugB: '牵牛子', risk: '泻下作用过强，可致严重脱水、电解质紊乱', category: '药性增强' },
      { drugA: '丁香', drugB: '郁金', risk: '药理拮抗，温中与行气解郁作用相互抵消', category: '功能拮抗' },
      { drugA: '牙硝（芒硝）', drugB: '三棱', risk: '破血作用过强，有出血风险', category: '药性增强' },
      { drugA: '川乌/草乌', drugB: '犀角（水牛角代）', risk: '寒热冲突，且影响乌头类药物的炮制减毒效果', category: '寒热冲突' },
      { drugA: '人参', drugB: '五灵脂', risk: '人参补气作用被五灵脂的活血化瘀作用所削弱', category: '功能拮抗' },
      { drugA: '肉桂（官桂）', drugB: '赤石脂', risk: '肉桂的辛散温通被赤石脂的收敛固涩所抑制', category: '功能拮抗' }
    ],
    note: '十九畏中部分组合在现代药理研究中并未发现严重毒性反应（如丁香与郁金），但传统用药习惯仍建议避免合用。临床应用中须由医师权衡利弊后谨慎决定。'
  }
};

// ===== 孕妇禁用/慎用中药清单 =====
const PREGNANCY_HERB_RESTRICTIONS = {
  title: '孕妇中药使用禁忌',
  intro: '孕妇用药需格外谨慎，以下按禁用（绝对禁止）和慎用（医师指导下方可使用）分类列出。妊娠禁忌的原则是：凡峻下、逐水、破血、通经、催吐、有毒之品均应禁用或慎用。',
  jinji: {
    title: '绝对禁用类',
    description: '以下药物毒性强或药性峻猛，孕妇使用可致流产、胎儿畸形或危及母体生命，严禁使用。',
    herbs: [
      { name: '巴豆', reason: '峻下逐水，烈性最强，可致强烈宫缩流产' },
      { name: '牵牛子', reason: '峻下逐水，通利二便，孕妇忌用' },
      { name: '大戟', reason: '峻下逐水，有毒，可致流产' },
      { name: '甘遂', reason: '峻下逐水，有毒，孕妇绝对禁用' },
      { name: '芫花', reason: '峻下逐水，有毒，刺激子宫收缩' },
      { name: '商陆', reason: '峻下逐水，有毒，可致流产' },
      { name: '麝香', reason: '芳香走窜力极强，兴奋子宫，可致堕胎（最著名的妊娠禁忌药之一）' },
      { name: '三棱', reason: '破血行气，作用猛烈，孕妇禁用' },
      { name: '莪术', reason: '破血行气，孕妇忌用' },
      { name: '水蛭', reason: '破血逐瘀力强，孕妇禁用' },
      { name: '虻虫', reason: '破血逐瘀，有毒，孕妇禁用' },
      { name: '斑蝥', reason: '攻毒蚀疮，大毒之品，孕妇绝对禁用' },
      { name: '马钱子', reason: '通络止痛，大毒，可致畸胎' },
      { name: '川乌', reason: '祛风湿散寒，大毒，孕妇禁用' },
      { name: '草乌', reason: '祛风湿散寒，大毒，孕妇禁用' },
      { name: '砒霜', reason: '剧毒，任何情况下孕妇均禁用' },
      { name: '水银', reason: '剧毒重金属，绝对禁用' },
      { name: '藜芦', reason: '涌吐风痰，剧毒，孕妇忌用' },
      { name: '附子', reason: '大热有毒，孕妇一般禁用（特殊配伍下偶尔慎用）' }
    ]
  },
  shenyong: {
    title: '慎用类（医师指导下方可使用）',
    description: '以下药物有活血通经、行气攻下或毒性风险，一般情况下应避免使用，仅在特殊病情下由医师严格掌握剂量和疗程后谨慎使用。',
    herbs: [
      { name: '桃仁', reason: '活血祛瘀，小剂量安胎大剂量破血，需严格掌握用量' },
      { name: '红花', reason: '活血通经，孕妇慎用，大剂量可致流产' },
      { name: '川芎', reason: '活血行气，孕妇慎用（当归川芎配伍中川芎量宜小）' },
      { name: '牛膝', reason: '活血通经，引血下行，孕妇忌用' },
      { name: '牡丹皮', reason: '活血化瘀，孕妇慎用' },
      { name: '大黄', reason: '泻下攻积，活血祛瘀，孕妇慎用（产后可用）' },
      { name: '芒硝', reason: '泻下软坚，孕妇慎用' },
      { name: '番泻叶', reason: '泻下导滞，孕妇慎用' },
      { name: '枳实', reason: '破气消积，孕妇慎用（枳壳亦然）' },
      { name: '肉桂', reason: '补火助阳，温通经脉，孕妇慎用（有出血倾向者尤慎）' },
      { name: '干姜', reason: '温中散寒，燥热之品，孕妇慎用' },
      { name: '半夏', reason: '燥湿化痰，生半夏有毒，孕妇慎用（须炮制后使用）' },
      { name: '天南星', reason: '燥湿化痰，有毒，孕妇慎用' },
      { name: '薏苡仁', reason: '利水渗湿，有报道大量使用可兴奋子宫，孕妇慎用' },
      { name: '通草', reason: '利尿通淋，通经下乳，孕妇慎用' },
      { name: '滑石', reason: '利尿通淋，性滑利，孕妇慎用' },
      { name: '赭石', reason: '平肝潜阳，质重沉降，孕妇慎用' },
      { name: '冰片', reason: '开窍醒神，芳香走窜，孕妇慎用' }
    ]
  },
  general_principle: '孕妇用药总原则：凡属禁用药绝对不能使用；属慎用药一般情况下尽量避免，如确实需要使用，必须在执业中医师严格辨证论治和剂量控制下短期使用，中病即止（病情好转立即停药）。妊娠期间任何中药使用前均应咨询专业医师。'
};

// ===== 中药煎服方法 =====
const HERB_DECOCTION_GUIDE = {
  title: '中药煎服方法完全指南',
  intro: '中药的煎煮方法直接影响药效发挥。正确煎药可使药力尽出、毒性降低、疗效倍增。以下为家庭煎药的标准操作流程。',
  preparation: {
    title: '一、煎药前准备',
    steps: [
      { step: '选择器具', detail: '首选砂锅、瓦罐（化学性质稳定，受热均匀），其次可选搪瓷锅、不锈钢锅。禁用铁锅、铝锅、铜锅（金属离子会与中药成分发生化学反应，降低药效或产生毒性）。' },
      { step: '浸泡药物', detail: '将药材放入锅中，加入冷水没过药面2-3厘米（约高出药面一指），浸泡30-60分钟。花叶草类浸泡20-30分钟即可；根茎果实类需浸泡40-60分钟；矿石贝壳类需浸泡1小时以上。浸泡用水量取决于药物吸水性和煎煮时间。' },
      { step: '选择用水', detail: '以洁净的自来水、纯净水或井水为宜。水量一般为药材重量的8-10倍。解表药用水宜少（轻煎取其气），滋补药用水宜多（久煎取其味）。' }
    ]
  },
  decoction: {
    title: '二、煎煮过程',
    steps: [
      { step: '一煎（头煎）', detail: '浸泡后的药物和水直接上火。先用武火（大火）煮沸（约5-10分钟），然后转文火（小火）慢煎。一般药物文火煎20-30分钟；解表药（如麻黄汤）文火煎10-15分钟即可；滋补药（如六味地黄汤）文火煎40-60分钟。煎好后用纱布滤出药液。' },
      { step: '二煎（再煎）', detail: '头煎滤出后，药渣中再加温水（水量少于头煎，没过药渣即可），武火煮沸后文火煎15-25分钟。滋补药二煎时间可比一般药略长。滤出二煎药液。' },
      { step: '合并药液', detail: '将头煎和二煎的药液混合均匀，分作2-3次服用。一般一日一剂，分早晚两次温服。特殊情况下（如急症、重症）可一日两剂。' },
      { step: '特殊煎法总览', detail: '先煎：矿石类（石膏、龙骨、牡蛎等）、贝壳类（龟板、鳖甲等）、有毒药物（附子、川乌等）需先煎20-60分钟。后下：芳香类药物（薄荷、砂仁、白豆蔻等）在煎好前5-10分钟放入。包煎：绒毛类（旋覆花）、细粉类（蒲黄、滑石等）需用纱布包好再煎。烊化：胶类（阿胶、鹿角胶等）用煎好的药液溶化后兑入。冲服：贵重细料（三七粉、人参粉、羚羊角粉等）用药液冲服。煎汤代水：某些体积大、吸水性强的药物（如灶心土）先煎取汁，以此汁再煎其他药物。' }
    ]
  },
  special_herbs: {
    title: '三、特殊药物煎煮详解',
    items: [
      { name: '附子/川乌/草乌', method: '先煎40-60分钟（至口尝无麻舌感），以彻底破坏乌头碱毒性。全程不能加冷水，如需加水只能加开水。' },
      { name: '石膏/龙骨/牡蛎', method: '先煎20-30分钟，使有效成分充分溶出。质地坚硬，需打碎后先煎。' },
      { name: '薄荷/砂仁/白豆蔻', method: '后下，在煎好前5-10分钟放入。久煎则芳香挥发油散失，药效大减。' },
      { name: '旋覆花/辛夷', method: '包煎，旋覆花有绒毛会刺激咽喉，辛夷有毛茸需包煎以免刺激。' },
      { name: '阿胶/鹿角胶/龟板胶', method: '烊化，将胶块打碎，加入煎好滤出的热药液中搅拌至完全溶化，或隔水蒸化后兑入。' },
      { name: '三七粉/人参粉', method: '冲服，将药粉放入杯中，用药液冲调后服用。不宜入煎剂以免浪费。' },
      { name: '大黄（泻下时）', method: '后下，煎煮时间不超过5-10分钟。大黄久煎则泻下成分（蒽醌苷类）被破坏，失去通便作用。' },
      { name: '钩藤', method: '后下，煎煮时间不超过15分钟。钩藤碱久煎易破坏，影响降压效果。' },
      { name: '羚羊角', method: '另煎（单独煎2小时以上取汁），或锉成细粉冲服。价格昂贵，不宜与其他药合煎。' },
      { name: '人参/西洋参', method: '另煎兑服，单独文火煎40-60分钟取汁，再与其他药液混合服用，可充分利用贵重药材。' }
    ]
  },
  taking: {
    title: '四、服药方法与禁忌',
    rules: [
      { rule: '服药时间', detail: '补益药（四君子汤、六味地黄丸等）宜空腹或饭前1小时服用，便于吸收。健胃消食药（保和丸、山楂等）宜饭后30分钟服用。安神药（酸枣仁汤、天王补心丹等）宜睡前30-60分钟服用。驱虫药宜清晨空腹服用。峻下逐水药宜清晨空腹服用。一般药物（如解表药、清热药）可在饭后1-2小时服用。' },
      { rule: '服药温度', detail: '一般汤剂宜温服（不烫口为宜）。解表药（桂枝汤、麻黄汤等）需热服，服后喝热稀粥盖被取微汗。清热药（银翘散、黄连解毒汤等）可温服或凉服。' },
      { rule: '饮食禁忌（忌口）', detail: '服药期间一般忌生冷、油腻、辛辣、腥膻及不易消化的食物。具体禁忌因病情和药物而异：服人参忌萝卜（萝卜破气会削弱人参补气作用）；服清热药忌辛辣燥热食物；服温补药忌生冷寒凉食物；皮肤病患者忌鱼虾蟹等发物；水肿患者忌盐。' },
      { rule: '特殊人群注意事项', detail: '老年人用药剂量宜偏小（一般为成人的2/3-3/4），注意脾胃承受能力。儿童用药剂量按年龄递减：3岁以下用成人量的1/4，4-7岁用1/3，8-14岁用1/2。孕妇用药见妊娠禁忌清单。哺乳期妇女用药需询问医师是否影响乳汁。' },
      { rule: '服药后观察', detail: '服药后注意观察身体反应：解表药服后应微有汗出（不可大汗淋漓）；泻下药服后应有适度排便（不可泻下过度）；补益药服后应感到体力精神有所改善。如出现不良反应（皮疹、呕吐、腹泻过度等），应立即停药并咨询医师。' },
      { rule: '中药西药间隔', detail: '如同时服用西药，中药与西药应间隔1-2小时服用，避免药物相互作用。某些西药（如华法林等抗凝药）与活血化瘀类中药（丹参、三七等）同用可能增加出血风险，需告知医师全部用药情况。' }
    ]
  },
  storage: {
    title: '五、药物储存',
    rules: [
      '中药材应存放在阴凉干燥处，避免阳光直射和潮湿。',
      '煎好的药液如当天不服用完，应密封放入冰箱冷藏（2-8℃），最长存放不超过48小时。',
      '服用前需充分加热至沸腾后再放温服用，不可喝冷药。',
      '代煎袋装中药液应放入冰箱冷藏，加热时连袋放入热水中浸泡升温，不要剪开袋子直接加热。',
      '发现药液有酸腐味、气泡或霉变，严禁服用。',
      '贵重药材（人参、鹿茸、冬虫夏草等）应密封冷藏或冷冻保存，防止虫蛀。',
      '外用药与内服药应分开存放，并在包装上明确标注，以防误服。'
    ]
  }
};

// ===== 四季养生要点 =====
const SEASONAL_HEALTH = {
  spring: {
    name: '春养肝',
    season: '春季（立春-立夏）',
    principle: '春三月，此谓发陈。天地俱生，万物以荣。夜卧早起，广步于庭，被发缓形，以使志生',
    organ: '肝',
    element: '木',
    emotion: '戒怒',
    diet: '宜食辛甘发散之品如葱姜蒜韭，不宜过食酸味以免收敛肝气',
    herbs: '柴胡、薄荷、菊花、枸杞、玫瑰花',
    recipe: '薄荷菊花茶、枸杞猪肝汤、柴胡白芍饮',
    exercise: '散步、太极拳、八段锦，舒展筋骨',
    key: '保持心情舒畅，避免压抑恼怒，早睡早起，顺应春生之气'
  },
  summer: {
    name: '夏养心',
    season: '夏季（立夏-立秋）',
    principle: '夏三月，此谓蕃秀。天地气交，万物华实。夜卧早起，无厌于日，使志无怒，使华英成秀',
    organ: '心',
    element: '火',
    emotion: '戒怒戒躁',
    diet: '宜清淡，多食瓜果蔬菜如西瓜、苦瓜、黄瓜、绿豆，不宜过食生冷',
    herbs: '麦冬、莲子心、百合、酸枣仁、竹叶',
    recipe: '绿豆百合汤、莲心麦冬茶、酸枣仁粥',
    exercise: '游泳、晨练，避免烈日下剧烈运动',
    key: '养心安神，午间小憩养心，保持心平气和'
  },
  autumn: {
    name: '秋养肺',
    season: '秋季（立秋-立冬）',
    principle: '秋三月，此谓容平。天气以急，地气以明。早卧早起，与鸡俱兴，使志安宁，以缓秋刑',
    organ: '肺',
    element: '金',
    emotion: '戒悲',
    diet: '宜食滋阴润燥之物如梨、百合、银耳、蜂蜜，不宜过食辛辣',
    herbs: '沙参、麦冬、玉竹、百合、川贝母',
    recipe: '秋梨膏、百合银耳羹、沙参玉竹汤',
    exercise: '深呼吸吐纳、慢跑、登山',
    key: '滋阴润肺防秋燥，早睡早起收敛神气'
  },
  winter: {
    name: '冬养肾',
    season: '冬季（立冬-立春）',
    principle: '冬三月，此谓闭藏。水冰地坼，无扰乎阳。早卧晚起，必待日光，使志若伏若匿',
    organ: '肾',
    element: '水',
    emotion: '戒恐',
    diet: '宜温热滋补如羊肉、核桃、黑豆、黑芝麻，不宜过食寒凉',
    herbs: '熟地、山茱萸、肉桂、杜仲、鹿茸',
    recipe: '当归生姜羊肉汤、杜仲核桃汤、黑芝麻糊',
    exercise: '室内八段锦、站桩，注意保暖避免大汗',
    key: '补肾藏精，早睡晚起养阳气，注意足部保暖'
  }
};

// ===== 体质辨识与中药调理 =====
const CONSTITUTION_GUIDE = [
  {
    id: 'con001', name: '平和质',
    characteristics: '体形匀称健壮，面色红润，精力充沛，睡眠良好，二便正常，舌淡红苔薄白，脉和缓有力',
    principle: '平衡阴阳，维持现状',
    herbs: '枸杞、大枣、百合、麦冬、山药（日常适量调理）',
    recipe: '枸杞红枣茶、山药粥',
    lifestyle: '保持规律作息，均衡饮食，适度运动'
  },
  {
    id: 'con002', name: '气虚质',
    characteristics: '肌肉松软不实，精神不振，气短懒言，易出汗，舌淡红边有齿痕，脉弱',
    principle: '补气健脾',
    herbs: '黄芪、党参、白术、山药、大枣、甘草',
    recipe: '黄芪炖鸡、四君子汤、山药芡实粥',
    lifestyle: '避免过度劳累，可做太极拳、气功等轻柔运动'
  },
  {
    id: 'con003', name: '阳虚质',
    characteristics: '肌肉松软，畏寒怕冷，手足不温，喜热饮食，精神不振，舌淡胖嫩，脉沉迟',
    principle: '温阳补肾',
    herbs: '肉桂、附子（炮）、鹿茸、杜仲、巴戟天、干姜',
    recipe: '当归生姜羊肉汤、杜仲猪腰汤、桂圆红枣姜茶',
    lifestyle: '多晒太阳，注意保暖，可做八段锦等温和运动'
  },
  {
    id: 'con004', name: '阴虚质',
    characteristics: '体形偏瘦，手足心热，口燥咽干，大便干燥，舌红少津，脉细数',
    principle: '滋阴降火',
    herbs: '生地、麦冬、天冬、玉竹、沙参、石斛、枸杞',
    recipe: '百合银耳羹、麦冬沙参瘦肉汤、桑葚枸杞膏',
    lifestyle: '避免熬夜，忌辛辣燥热食物，可做瑜伽、游泳'
  },
  {
    id: 'con005', name: '痰湿质',
    characteristics: '体形肥胖，腹部肥满松软，面部皮肤油腻多汗，胸闷痰多，舌苔白腻，脉滑',
    principle: '健脾利湿、化痰泄浊',
    herbs: '茯苓、薏苡仁、陈皮、半夏、白术、苍术',
    recipe: '陈皮薏仁粥、茯苓白术汤、山楂荷叶茶',
    lifestyle: '饮食清淡，控制甜食油腻，加强运动减肥'
  },
  {
    id: 'con006', name: '湿热质',
    characteristics: '面垢油光，易生痤疮粉刺，口苦口干，身重困倦，大便粘滞，小便短黄，舌红苔黄腻，脉滑数',
    principle: '清热利湿',
    herbs: '黄连、黄芩、薏苡仁、茵陈、栀子、金银花',
    recipe: '绿豆薏仁汤、金银花菊花茶、茵陈瘦肉汤',
    lifestyle: '饮食清淡，忌辛辣油腻及酒，保持皮肤清洁'
  },
  {
    id: 'con007', name: '血瘀质',
    characteristics: '肤色晦暗，色素沉着，容易出现瘀斑，口唇暗淡，舌暗有瘀点瘀斑，脉涩',
    principle: '活血化瘀',
    herbs: '丹参、川芎、桃仁、红花、当归、三七',
    recipe: '川芎当归炖鸡、三七丹参茶、桃仁粥',
    lifestyle: '保持情绪愉快，多做舒展运动，避免久坐'
  },
  {
    id: 'con008', name: '气郁质',
    characteristics: '神情抑郁，情感脆弱，烦闷不乐，舌淡红苔薄白，脉弦',
    principle: '疏肝解郁、理气安神',
    herbs: '柴胡、玫瑰花、薄荷、香附、白芍、佛手',
    recipe: '玫瑰花茶、柴胡白芍饮、合欢花粥',
    lifestyle: '多参加社交活动，培养兴趣爱好，适当运动'
  },
  {
    id: 'con009', name: '特禀质（过敏质）',
    characteristics: '过敏体质，易对药物食物气味花粉过敏，易患过敏性鼻炎哮喘荨麻疹等',
    principle: '益气固表、养血祛风',
    herbs: '黄芪、白术、防风、乌梅、蝉蜕、徐长卿',
    recipe: '玉屏风散（黄芪白术防风）煲汤、乌梅甘草茶',
    lifestyle: '避免接触过敏原，保持居室清洁，加强体质锻炼'
  }
];

console.log('中药数据库加载完成:', HERB_DATABASE.length + '味中药,', HERBAL_RECIPES.length + '个药膳方,', '四季养生,', CONSTITUTION_GUIDE.length + '种体质');
