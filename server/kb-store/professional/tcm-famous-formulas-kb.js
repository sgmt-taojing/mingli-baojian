window.TCM_FAMOUS_FORMULAS_KB = {};
(function(){
window.TCM_FAMOUS_FORMULAS_KB = {
  version: '1.0',
  description: '历代名医名方与医学典籍知识库——基于中医古籍和经典医书系统整理',

  // ═══════════════════════════════════════════
  // 历代名医（56位）
  // ═══════════════════════════════════════════
  doctors: [
    // ── 先秦至汉 ──
    {name:'扁鹊',era:'春秋战国',title:'脉学之祖',specialties:['望闻问切','脉诊'],major_works:['《难经》'],signature_formulas:['三豆饮'],medical_theory:'创立四诊法，擅望面色听声息问病状切脉象，奠定中医诊断基础',case_study:'望齐桓侯面色知病在腠理，屡劝不听后病入膏肓',source:'《史记·扁鹊仓公列传》'},
    {name:'淳于意',era:'西汉',title:'仓公',specialties:['诊籍','辨证'],major_works:['《诊籍》'],signature_formulas:['仓公方'],medical_theory:'首创病历记录，详载病因脉证方药',case_study:'诊齐中大夫龋齿案，以苦参汤漱口愈',source:'《史记·扁鹊仓公列传》'},
    {name:'张仲景',era:'东汉',title:'医圣',specialties:['伤寒杂病','辨证论治'],major_works:['《伤寒杂病论》'],signature_formulas:['麻黄汤','桂枝汤','小柴胡汤','白虎汤','承气汤','四逆汤','肾气丸','炙甘草汤'],medical_theory:'创立六经辨证体系，确立辨证论治原则，被尊为医圣',case_study:'诊王某伤寒太阳病，用麻黄汤一剂汗出而愈',source:'《伤寒论》《金匮要略》'},
    {name:'华佗',era:'东汉',title:'外科鼻祖',specialties:['外科','针灸','养生'],major_works:['《中藏经》'],signature_formulas:['麻沸散','华佗夹脊穴','五禽戏'],medical_theory:'发明麻沸散用于外科手术，创五禽戏养生导引，论脏腑虚实寒热',case_study:'为关公刮骨疗毒，以针灸治曹操头风',source:'《后汉书·华佗传》《中藏经》'},
    {name:'董奉',era:'东汉',title:'杏林始祖',specialties:['内科'],major_works:[],signature_formulas:[],medical_theory:'治病不取酬，令愈者种杏，后以杏易谷济贫',case_study:'居庐山行医，日种杏树万株成林',source:'《神仙传》'},

    // ── 魏晋南北朝 ──
    {name:'王叔和',era:'西晋',title:'脉学大家',specialties:['脉诊'],major_works:['《脉经》'],signature_formulas:[],medical_theory:'系统整理24种脉象，确立脉学理论体系',case_study:'撰《脉经》十卷，辨阴阳虚实于寸关尺',source:'《脉经》'},
    {name:'皇甫谧',era:'西晋',title:'针灸之祖',specialties:['针灸'],major_works:['《针灸甲乙经》'],signature_formulas:[],medical_theory:'系统整理经络穴位，确立针灸学理论体系',case_study:'自身患风痹，以针灸自疗而愈，遂著针灸专书',source:'《针灸甲乙经》'},
    {name:'葛洪',era:'东晋',title:'炼丹术家',specialties:['炼丹','急救方药','传染病'],major_works:['《肘后备急方》','《抱朴子》'],signature_formulas:['葱豉汤','黄连解毒汤（雏形）'],medical_theory:'集急救方药之大成，记载天花恙虫病等传染病，炼丹术为化学先驱',case_study:'《肘后方》载青蒿截疟，后启发屠呦呦提取青蒿素',source:'《肘后备急方》《抱朴子》'},
    {name:'陶弘景',era:'南朝梁',title:'本草学家',specialties:['本草','炼丹'],major_works:['《本草经集注》'],signature_formulas:[],medical_theory:'整理《神农本草经》，增补药物至730种，创药物分类法',case_study:'隐居茅山，整理本草，注《神农本草经》为集注',source:'《本草经集注》'},

    // ── 隋唐 ──
    {name:'巢元方',era:'隋朝',title:'病理学家',specialties:['病因病理'],major_works:['《诸病源候论》'],signature_formulas:[],medical_theory:'系统论述各种疾病病因病机，共列1739种病候',case_study:'撰《诸病源候论》五十卷，为第一部病因病理学专书',source:'《诸病源候论》'},
    {name:'孙思邈',era:'唐朝',title:'药王',specialties:['内科','养生','食疗'],major_works:['《千金要方》','《千金翼方》'],signature_formulas:['独活寄生汤','温胆汤','苇茎汤','犀角地黄汤','孔圣枕中丹'],medical_theory:'大医精诚，重视医德，倡食疗养生，集唐以前医学之大成',case_study:'治脚气病以谷白皮粥，早于西方千年认识维生素B1缺乏',source:'《千金要方》《千金翼方》'},
    {name:'王焘',era:'唐朝',title:'方书大家',specialties:['方剂整理'],major_works:['《外台秘要》'],signature_formulas:[],medical_theory:'汇集唐以前各家方书，保存大量已佚医籍内容',case_study:'编《外台秘要》四十卷，收方六千余首',source:'《外台秘要》'},
    {name:'鉴真',era:'唐朝',title:'传日医圣',specialties:['内科','本草'],major_works:['《鉴上人秘方》'],signature_formulas:[],medical_theory:'东渡日本传中医，为日本汉方医学之祖',case_study:'六次东渡终成功，在日本传授中医中药针灸',source:'《唐大和上东征传》'},

    // ── 宋代 ──
    {name:'钱乙',era:'北宋',title:'儿科之圣',specialties:['儿科'],major_works:['《小儿药证直诀》'],signature_formulas:['六味地黄丸','泻白散','导赤散','七味白术散'],medical_theory:'创立小儿五脏辨证体系，提出"五脏所主"理论',case_study:'以六味地黄丸治小儿先天不足发育迟缓，后成为滋补名方',source:'《小儿药证直诀》'},
    {name:'庞安时',era:'北宋',title:'伤寒大家',specialties:['伤寒'],major_works:['《伤寒总病论》'],signature_formulas:['圣散子方'],medical_theory:'发挥伤寒论温病学说，重视气候与疾病关系',case_study:'治时疫用圣散子方，活人无数',source:'《伤寒总病论》'},
    {name:'许叔微',era:'南宋',title:'伤寒临床家',specialties:['伤寒','辨证'],major_works:['《普济本事方》','《伤寒发微论》'],signature_formulas:['真珠丸','槐花散'],medical_theory:'以医案验证伤寒理论，倡表里虚实辨证',case_study:'自患肠风下血，以槐花散治愈，录于本事方',source:'《普济本事方》'},
    {name:'陈自明',era:'南宋',title:'妇科大家',specialties:['妇科','外科'],major_works:['《妇人良方大全》','《外科精要》'],signature_formulas:['温经汤','牡丹皮散'],medical_theory:'系统整理妇产科理论，分经带胎产诸证',case_study:'治妇人月经不调以温经汤，载于妇人良方',source:'《妇人良方大全》'},
    {name:'严用和',era:'南宋',title:'方剂学家',specialties:['内科'],major_works:['《济生方》'],signature_formulas:['归脾汤','实脾散','加味肾气丸','清魂散'],medical_theory:'重视脏腑虚实辨证，方剂配伍严谨',case_study:'创归脾汤治心脾两虚，至今为补益名方',source:'《济生方》'},
    {name:'王惟一',era:'北宋',title:'针灸铜人',specialties:['针灸'],major_works:['《铜人针灸图经》'],signature_formulas:[],medical_theory:'铸造针灸铜人模型，规范穴位定位',case_study:'铸铜人两具，外涂黄蜡内注水银，考试时取穴精准则水银流出',source:'《铜人针灸图经》'},

    // ── 金元四大家 ──
    {name:'刘完素',era:'金朝',title:'寒凉派宗师',specialties:['温病','火热论'],major_works:['《素问玄机原病式》','《宣明论方》'],signature_formulas:['防风通圣散','双解散','凉膈散'],medical_theory:'倡"六气皆从火化"，主用寒凉药治病，开温病学说先河',case_study:'治伤寒热病以寒凉方，一改辛温发散旧法',source:'《素问玄机原病式》'},
    {name:'张从正',era:'金朝',title:'攻下派宗师',specialties:['攻邪论'],major_works:['《儒门事亲》'],signature_formulas:['禹功散','导水丸','三圣散'],medical_theory:'倡"邪去正安"，以汗吐下三法攻邪，反对盲目进补',case_study:'以三圣散催吐治痰迷心窍，一吐而愈',source:'《儒门事亲》'},
    {name:'李杲',era:'金朝',title:'补土派宗师',specialties:['脾胃论'],major_works:['《脾胃论》','《内外伤辨惑论》'],signature_formulas:['补中益气汤','升阳益胃汤','生脉散','当归补血汤'],medical_theory:'倡"内伤脾胃百病由生"，重视升发脾阳，创立甘温除热法',case_study:'治气虚发热以补中益气汤，甘温除大热',source:'《脾胃论》'},
    {name:'朱震亨',era:'元朝',title:'滋阴派宗师',specialties:['滋阴论'],major_works:['《丹溪心法》','《格致余论》'],signature_formulas:['大补阴丸','越鞠丸','保和丸','二妙散'],medical_theory:'倡"阳常有余阴常不足"，主滋阴降火，创六郁之说',case_study:'治阴虚火旺以大补阴丸，滋水制火而愈',source:'《丹溪心法》'},

    // ── 明代 ──
    {name:'戴思恭',era:'明朝',title:'丹溪传人',specialties:['内科'],major_works:['《证治要诀》','《推求师意》'],signature_formulas:[],medical_theory:'继承丹溪滋阴学说，发挥气血痰郁辨证',case_study:'治痰证以二陈加味，从丹溪六郁论治',source:'《证治要诀》'},
    {name:'张景岳',era:'明朝',title:'温补派宗师',specialties:['温补','阴阳论'],major_works:['《景岳全书》','《类经》'],signature_formulas:['左归丸','右归丸','金水六君煎','玉女煎','济川煎'],medical_theory:'倡"阳非有余阴常不足"，重视温补真阴真阳，创"阴阳互根"理论',case_study:'治肾阳不足以右归丸温补肾阳，填精止遗',source:'《景岳全书》'},
    {name:'吴又可',era:'明朝',title:'温疫学说创始人',specialties:['温疫','传染病'],major_works:['《温疫论》'],signature_formulas:['达原饮','三消饮'],medical_theory:'创"戾气"学说，指出温疫由特殊致病因子引起，经口鼻侵入',case_study:'治大明京师温疫，以达原饮透达膜原，控制疫情',source:'《温疫论》'},
    {name:'李时珍',era:'明朝',title:'药圣',specialties:['本草'],major_works:['《本草纲目》','《濒湖脉学》'],signature_formulas:[],medical_theory:'历时27年编纂《本草纲目》，收药1892种，附方11096首',case_study:'亲尝百草验证药性，考正历代本草错误',source:'《本草纲目》'},
    {name:'龚廷臣',era:'明朝',title:'方书大家',specialties:['内科','养生'],major_works:['《寿世保元》','《万病回春》'],signature_formulas:['龚氏三方'],medical_theory:'重视脾胃调理，集古今名方于实用',case_study:'以寿世保元方治老年虚损，延年益寿',source:'《寿世保元》'},
    {name:'缪希雍',era:'明朝',title:'本草学家',specialties:['本草','炮制'],major_works:['《神农本草经疏》','《炮炙大法》'],signature_formulas:[],medical_theory:'阐发本草药性理论，规范中药炮制方法',case_study:'疏《神农本草经》三十卷，详辨药物气味主治',source:'《神农本草经疏》'},
    {name:'喻昌',era:'明朝',title:'伤寒临床家',specialties:['伤寒','温病'],major_works:['《寓意草》','《尚论篇》'],signature_formulas:['清燥救肺汤'],medical_theory:'重订伤寒论条目，倡"秋燥论"，创清燥救肺法',case_study:'治秋燥伤肺以清燥救肺汤，润燥化痰止咳',source:'《寓意草》《尚论篇》'},

    // ── 清代 ──
    {name:'叶天士',era:'清朝',title:'温病四大家之首',specialties:['温病','内科'],major_works:['《温热论》','《临证指南医案》'],signature_formulas:['银翘散（传吴鞠通）','桑菊饮（传吴鞠通）','叶氏养胃汤'],medical_theory:'创卫气营血辨证体系，论温病传变规律，善用轻灵之剂',case_study:'治温热病初起以辛凉轻剂，透邪出卫，奠定温病治疗体系',source:'《温热论》《临证指南医案》'},
    {name:'吴鞠通',era:'清朝',title:'温病大家',specialties:['温病'],major_works:['《温病条辨》'],signature_formulas:['银翘散','桑菊饮','清营汤','安宫牛黄丸','增液汤','三仁汤'],medical_theory:'创三焦辨证体系，分温病为上中下三焦论治',case_study:'治温病初起以银翘散辛凉透表，至今为感冒首选方',source:'《温病条辨》'},
    {name:'薛生白',era:'清朝',title:'湿热病大家',specialties:['湿热病'],major_works:['《湿热病篇》'],signature_formulas:[],medical_theory:'专论湿热病证治，辨湿热轻重与上下焦',case_study:'治湿热温病以清热化湿法，分消走泄',source:'《湿热病篇》'},
    {name:'王孟英',era:'清朝',title:'温病集大成者',specialties:['温病'],major_works:['《温热经纬》','《王氏医案》'],signature_formulas:['王氏清暑益气汤','甘露消毒丹'],medical_theory:'融汇各家温病学说，以经典为经以临床为纬',case_study:'治暑温以清暑益气汤，清气分热邪生津止渴',source:'《温热经纬》'},
    {name:'徐大椿',era:'清朝',title:'医学评论家',specialties:['医论','方剂'],major_works:['《医学源流论》','《兰台轨范》'],signature_formulas:[],medical_theory:'主张追溯经典源流，反对滥用温补，强调辨证用方',case_study:'评当时滥用补药之风，著《医学源流论》正本清源',source:'《医学源流论》'},
    {name:'陈修园',era:'清朝',title:'医学教育家',specialties:['医学普及'],major_works:['《医学三字经》','《时方歌括》','《长沙方歌括》'],signature_formulas:[],medical_theory:'以歌括形式普及医学知识，便于初学记诵',case_study:'著《医学三字经》以三字一句概括医学源流',source:'《医学三字经》'},
    {name:'傅青主',era:'清朝',title:'妇科圣手',specialties:['妇科','内科'],major_works:['《傅青主女科》'],signature_formulas:['完带汤','清海丸','生化汤（传）','定经汤'],medical_theory:'妇科重在肝脾肾，善用扶正祛邪，方药简而效宏',case_study:'治妇人白带以完带汤大剂白术山药，健脾祛湿止带',source:'《傅青主女科》'},
    {name:'王清任',era:'清朝',title:'活血化瘀大家',specialties:['解剖','活血化瘀'],major_works:['《医林改错》'],signature_formulas:['血府逐瘀汤','补阳还五汤','膈下逐瘀汤','少腹逐瘀汤','身痛逐瘀汤'],medical_theory:'重视解剖纠正前人错误，创逐瘀方剂系列，倡补气活血',case_study:'治中风后遗症以补阳还五汤重用黄芪，补气活血通络',source:'《医林改错》'},
    {name:'唐宗海',era:'清朝',title:'中西汇通派',specialties:['血证','中西汇通'],major_works:['《血证论》','《中西汇通医经精义》'],signature_formulas:['止血消瘀宁血补血四法'],medical_theory:'提出治血四法：止血、消瘀、宁血、补血，尝试中西汇通',case_study:'治吐血以止血为先，次消瘀再宁血后补血，四法贯穿',source:'《血证论》'},
    {name:'吴谦',era:'清朝',title:'御纂医书总编',specialties:['方剂整理'],major_works:['《医宗金鉴》'],signature_formulas:[],medical_theory:'奉敕编撰《医宗金鉴》，为太医院教科书',case_study:'集古今名医方论，编为《医宗金鉴》九十卷',source:'《医宗金鉴》'},

    // ── 近现代 ──
    {name:'张锡纯',era:'近现代',title:'中西汇通派代表',specialties:['中西汇通'],major_works:['《医学衷中参西录》'],signature_formulas:['镇肝熄风汤','活络效灵丹','玉液汤','升陷汤','参赭培气汤'],medical_theory:'衷中参西，以西药解中药药理，创诸多实效名方',case_study:'治脑充血以镇肝熄风汤，平肝潜阳引血下行',source:'《医学衷中参西录》'},
    {name:'丁甘仁',era:'近现代',title:'孟河医派代表',specialties:['内科','喉科'],major_works:['《丁甘仁医案》'],signature_formulas:[],medical_theory:'孟河医派传人，用药轻灵，擅治温病伤寒',case_study:'治喉痧以辛凉透表配合养阴清热，活人甚众',source:'《丁甘仁医案》'},
    {name:'施今墨',era:'近现代',title:'北京四大名医',specialties:['内科','对药'],major_works:['《施今墨临床经验集》'],signature_formulas:['施氏对药'],medical_theory:'创"对药"配伍体系，提倡中西医结合辨证辨病结合',case_study:'治糖尿病以黄芪配山药苍术配玄参，对药降糖',source:'《施今墨临床经验集》'},
    {name:'蒲辅周',era:'近现代',title:'温病大家',specialties:['温病','内科'],major_works:['《蒲辅周医案》','《蒲辅周医疗经验》'],signature_formulas:[],medical_theory:'融汇伤寒温病学说，重视气候节气与发病关系',case_study:'1956年治乙型脑炎，按暑温辨证施治，疗效卓著',source:'《蒲辅周医案》'},
    {name:'岳美中',era:'近现代',title:'经方派大家',specialties:['经方运用'],major_works:['《岳美中医案》','《岳美中论医集》'],signature_formulas:[],medical_theory:'强调专方专药与辨证论治结合，擅用经方治大病',case_study:'治慢性肾炎以经方化裁，长期调理获效',source:'《岳美中医案》'},
    {name:'刘渡舟',era:'近现代',title:'伤寒论大家',specialties:['伤寒论'],major_works:['《伤寒论通俗讲话》','《伤寒论十四讲》'],signature_formulas:['刘氏柴胡系列'],medical_theory:'精研伤寒论，以六经辨证指导临床，擅用柴胡剂',case_study:'治少阳病以小柴胡汤化裁，和解少阳枢机',source:'《伤寒论通俗讲话》'},
    {name:'邓铁涛',era:'近现代',title:'国医大师',specialties:['脾胃学说','重症肌无力'],major_works:['《邓铁涛临床经验辑要》'],signature_formulas:['邓氏冠心方','强肌健力饮'],medical_theory:'倡脾胃学说，重视五脏相关，擅治重症肌无力',case_study:'治重症肌无力以补脾益气为主，长期调理显效',source:'《邓铁涛临床经验辑要》'},
    {name:'朱良春',era:'近现代',title:'虫类药专家',specialties:['虫类药','痹证'],major_works:['《虫类药的应用》','《朱良春医集》'],signature_formulas:['益肾蠲痹丸','痛风方'],medical_theory:'善用虫类药搜风通络，治痹证有特效',case_study:'治类风湿以虫类药配伍，搜风剔络止痛',source:'《虫类药的应用》'},
    {name:'焦树德',era:'近现代',title:'痹证专家',specialties:['痹证','内科'],major_works:['《用药心得十讲》','《方剂心得十讲》'],signature_formulas:['补肾祛寒治尪汤'],medical_theory:'创"尪痹"病名，分型论治，补肾祛寒为主',case_study:'治类风湿关节炎以补肾祛寒治尪汤，温肾散寒通络',source:'《方剂心得十讲》'},
    {name:'颜正华',era:'近现代',title:'国医大师',specialties:['中药学','脾胃'],major_works:['《颜正华中药学讲稿》'],signature_formulas:[],medical_theory:'重视中药药性理论与临床配伍，倡脾胃为后天之本',case_study:'治脾胃病以疏肝健脾和胃为法，用药轻灵',source:'《颜正华中药学讲稿》'},
    {name:'王绵之',era:'近现代',title:'方剂学大家',specialties:['方剂学'],major_works:['《王绵之方剂学讲稿》'],signature_formulas:[],medical_theory:'系统整理方剂学理论，强调君臣佐使配伍规律',case_study:'以方剂学理论指导临床，化裁古方治今病',source:'《王绵之方剂学讲稿》'},
    {name:'张伯礼',era:'近现代',title:'中国工程院院士',specialties:['心血管','中西医结合'],major_works:['《张伯礼院士集》'],signature_formulas:['复方丹参方'],medical_theory:'中西医结合治疗心脑血管疾病，推动中药现代化',case_study:'治冠心病以复方丹参方化裁，活血化瘀通脉',source:'《张伯礼院士集》'},
    {name:'仝小林',era:'近现代',title:'中国科学院院士',specialties:['糖尿病','代谢病'],major_works:['《糖络杂病论》'],signature_formulas:['芪药消渴方'],medical_theory:'创"态靶辨治"体系，以中医理论指导糖尿病治疗',case_study:'治2型糖尿病以清热降糖为法，态靶结合',source:'《糖络杂病论》'},
    {name:'黄煌',era:'近现代',title:'方证对应大家',specialties:['经方运用','方证'],major_works:['《张仲景50味药证》','《中医十大类方》'],signature_formulas:[],medical_theory:'倡方证对应，以体质辨证选方，推广经方应用',case_study:'治体质性失眠以柴胡加龙骨牡蛎汤，方证对应',source:'《中医十大类方》'},
    {name:'倪海厦',era:'近现代',title:'经方派大师',specialties:['经方','针灸','命理与中医'],major_works:['《人纪》《天纪》','汉唐方剂系列'],signature_formulas:['HT-1白带丸','HT-2退乳丸','HT-3记忆减退方','HT-4皮肤过敏方'],medical_theory:'崇尚经方，以六经辨证统万病，融合命理风水于中医',case_study:'治乳癌以经方化裁，拒绝手术纯中医治疗',source:'《人纪》《天纪》'},
    {name:'舒晗',era:'近现代',title:'周易命理与中医结合',specialties:['奇门遁甲','命理','中医结合'],major_works:['舒晗密训系列','舒晗基础课'],signature_formulas:[],medical_theory:'将奇门遁甲决策学应用于健康调理，融合周易与中医',case_study:'以奇门格局分析体质趋势，指导四季调理',source:'舒晗密训教材'}
  ],

  // ═══════════════════════════════════════════
  // 经典名方（108首）
  // ═══════════════════════════════════════════
  formulas: [
    // ── 解表剂 ──
    {name:'麻黄汤',category:'解表剂',source:'《伤寒论》张仲景',composition:[{drug:'麻黄',dose:'9g'},{drug:'桂枝',dose:'6g'},{drug:'杏仁',dose:'6g'},{drug:'炙甘草',dose:'3g'}],efficacy:'发汗解表，宣肺平喘',indications:'外感风寒表实证，恶寒发热无汗头痛身疼喘',analysis:'麻黄为君发汗解表宣肺平喘，桂枝为臣解肌发表助麻黄发汗，杏仁为佐降肺平喘，甘草为使调和诸药',modifications:['恶寒明显加荆芥防风','喘甚加苏子桑白皮','湿邪重加苍术藿香'],modern_application:'感冒流感支气管哮喘荨麻疹',cautions:'体虚自汗阴虚火旺者慎用'},
    {name:'桂枝汤',category:'解表剂',source:'《伤寒论》张仲景',composition:[{drug:'桂枝',dose:'9g'},{drug:'白芍',dose:'9g'},{drug:'生姜',dose:'9g'},{drug:'大枣',dose:'3枚'},{drug:'炙甘草',dose:'6g'}],efficacy:'解肌发表，调和营卫',indications:'外感风寒表虚证，发热汗出恶风鼻鸣干呕',analysis:'桂枝为君散风寒解肌表，白芍为臣敛阴和营，姜枣为佐调和营卫，甘草为使调和诸药',modifications:['项背强几几加葛根','喘加厚朴杏仁','汗多加黄芪'],modern_application:'感冒自主神经功能失调荨麻疹',cautions:'表实无汗者不宜用'},
    {name:'银翘散',category:'解表剂',source:'《温病条辨》吴鞠通',composition:[{drug:'金银花',dose:'30g'},{drug:'连翘',dose:'30g'},{drug:'薄荷',dose:'18g'},{drug:'牛蒡子',dose:'18g'},{drug:'桔梗',dose:'18g'},{drug:'淡竹叶',dose:'12g'},{drug:'芦根',dose:'30g'},{drug:'荆芥穗',dose:'12g'},{drug:'淡豆豉',dose:'15g'},{drug:'甘草',dose:'15g'}],efficacy:'辛凉透表，清热解毒',indications:'温病初起，发热微恶寒无汗或有汗不畅头痛口渴咽痛',analysis:'银花连翘为君清热解毒透表，薄荷牛蒡子为臣疏散风热利咽，荆芥豆豉为佐助君药透表，芦根竹叶清热生津，桔梗甘草宣肺利咽',modifications:['咽痛甚加马勃玄参','热甚加黄芩栀子','咳嗽加杏仁贝母'],modern_application:'流感急性咽炎扁桃体炎上呼吸道感染',cautions:'风寒感冒不宜用'},
    {name:'桑菊饮',category:'解表剂',source:'《温病条辨》吴鞠通',composition:[{drug:'桑叶',dose:'7.5g'},{drug:'菊花',dose:'3g'},{drug:'薄荷',dose:'2.4g'},{drug:'连翘',dose:'5g'},{drug:'杏仁',dose:'6g'},{drug:'桔梗',dose:'6g'},{drug:'芦根',dose:'6g'},{drug:'甘草',dose:'2.4g'}],efficacy:'疏风清热，宣肺止咳',indications:'风温初起，咳嗽身热不甚口微渴',analysis:'桑叶菊花为君疏散风热清肺，薄荷连翘为臣清热透表，杏仁桔梗宣肺止咳，芦根清热生津甘草调和',modifications:['热甚加石膏知母','咳嗽甚加百部紫菀','痰黄加黄芩瓜蒌'],modern_application:'感冒急性支气管炎上呼吸道感染',cautions:'风寒咳嗽不宜用'},
    {name:'九味羌活汤',category:'解表剂',source:'《此事难知》张元素',composition:[{drug:'羌活',dose:'9g'},{drug:'防风',dose:'9g'},{drug:'苍术',dose:'9g'},{drug:'细辛',dose:'3g'},{drug:'川芎',dose:'6g'},{drug:'白芷',dose:'6g'},{drug:'生地黄',dose:'6g'},{drug:'黄芩',dose:'6g'},{drug:'甘草',dose:'6g'}],efficacy:'发汗祛湿，兼清里热',indications:'外感风寒湿邪兼有里热，恶寒发热无汗头痛肢体酸痛口苦微渴',analysis:'羌活为君散风寒湿止痛，防风苍术为臣祛风除湿，细辛白芷川芎散寒止痛，生地黄芩清里热，甘草调和',modifications:['湿重加藿香佩兰','热重加石膏知母','头痛甚加蔓荆子'],modern_application:'感冒风湿性关节炎偏头痛',cautions:'阴虚火旺者慎用'},

    // ── 清热剂 ──
    {name:'白虎汤',category:'清热剂',source:'《伤寒论》张仲景',composition:[{drug:'石膏',dose:'50g'},{drug:'知母',dose:'18g'},{drug:'甘草',dose:'6g'},{drug:'粳米',dose:'9g'}],efficacy:'清热生津',indications:'阳明气分热盛证，壮热面赤烦渴引饮大汗出脉洪大',analysis:'石膏为君清热泻火除烦，知母为臣清热滋阴，甘草粳米为佐益胃护津',modifications:['加人参治气津两伤','加桂枝治热痹','加苍术治湿温'],modern_application:'流感大叶性肺炎乙脑出血热',cautions:'表证未解或阴虚发热者不宜用'},
    {name:'黄连解毒汤',category:'清热剂',source:'《外台秘要》引崔氏方',composition:[{drug:'黄连',dose:'9g'},{drug:'黄芩',dose:'6g'},{drug:'黄柏',dose:'6g'},{drug:'栀子',dose:'9g'}],efficacy:'泻火解毒',indications:'三焦火毒热盛证，大热烦躁口燥咽干错语不眠吐血发斑',analysis:'黄连为君清心火，黄芩清上焦火为臣，黄柏清下焦火栀子通泻三焦火为佐使',modifications:['便秘加大黄','吐血加生地丹皮','发斑加玄参犀角'],modern_application:'败血症脓毒血症急性感染性疾病',cautions:'阴虚火旺者不宜久服'},
    {name:'龙胆泻肝汤',category:'清热剂',source:'《医方集解》引《局方》',composition:[{drug:'龙胆草',dose:'6g'},{drug:'黄芩',dose:'9g'},{drug:'栀子',dose:'9g'},{drug:'泽泻',dose:'12g'},{drug:'木通',dose:'6g'},{drug:'车前子',dose:'9g'},{drug:'当归',dose:'3g'},{drug:'生地黄',dose:'9g'},{drug:'柴胡',dose:'6g'},{drug:'甘草',dose:'6g'}],efficacy:'泻肝胆实火，清下焦湿热',indications:'肝胆实火上炎证（头痛目赤口苦耳聋耳肿）或肝经湿热下注证（阴肿阴痒带下黄臭）',analysis:'龙胆草为君泻肝胆实火清下焦湿热，黄芩栀子为臣清热泻火，泽泻木通车前子清热利湿，当归生地养血滋阴柴胡疏肝，甘草调和',modifications:['便秘加大黄','小便不利加赤茯苓','阴痒加苦参蛇床子'],modern_application:'急性结膜炎急性中耳炎急性盆腔炎带状疱疹',cautions:'脾胃虚寒者慎用不宜久服'},
    {name:'清胃散',category:'清热剂',source:'《脾胃论》李东垣',composition:[{drug:'黄连',dose:'6g'},{drug:'升麻',dose:'6g'},{drug:'生地黄',dose:'12g'},{drug:'牡丹皮',dose:'9g'},{drug:'当归',dose:'6g'}],efficacy:'清胃凉血',indications:'胃火牙痛，牙痛牵引头痛面颊发热齿喜冷恶热口气热臭唇舌颊腮肿痛',analysis:'黄连为君清胃火，升麻为臣清热解毒引药入胃，生地丹皮为佐凉血滋阴，当归养血活血',modifications:['便秘加大黄','肿甚加金银花连翘','阴虚加麦冬石斛'],modern_application:'牙周炎口腔溃疡三叉神经痛',cautions:'阴虚火旺者慎用'},
    {name:'葛根芩连汤',category:'清热剂',source:'《伤寒论》张仲景',composition:[{drug:'葛根',dose:'15g'},{drug:'黄芩',dose:'9g'},{drug:'黄连',dose:'9g'},{drug:'炙甘草',dose:'6g'}],efficacy:'解表清里',indications:'协热下利证，身热下利臭秽肛门灼热喘而汗出',analysis:'葛根为君解肌清热升清止利，黄芩黄连为臣清热燥湿止利，甘草为使和中',modifications:['腹泻甚加马齿苋','腹痛加白芍木香','呕吐加半夏生姜'],modern_application:'急性肠炎细菌性痢疾胃肠型感冒',cautions:'虚寒下利者不宜用'},
    {name:'普济消毒饮',category:'清热剂',source:'《东垣试效方》李东垣',composition:[{drug:'黄芩',dose:'15g'},{drug:'黄连',dose:'15g'},{drug:'连翘',dose:'3g'},{drug:'薄荷',dose:'3g'},{drug:'玄参',dose:'3g'},{drug:'板蓝根',dose:'3g'},{drug:'马勃',dose:'3g'},{drug:'牛蒡子',dose:'3g'},{drug:'僵蚕',dose:'2g'},{drug:'升麻',dose:'2g'},{drug:'柴胡',dose:'2g'},{drug:'桔梗',dose:'2g'},{drug:'甘草',dose:'6g'},{drug:'陈皮',dose:'6g'}],efficacy:'清热解毒，疏风散邪',indications:'大头瘟，恶寒发热头面红肿焮痛目不能开咽喉不利',analysis:'黄芩黄连为君清热泻火，牛蒡子连翘薄荷僵蚕为臣疏散风热，玄参板蓝根马勃清热解毒利咽，升麻柴胡桔梗引经宣肺，陈皮理气甘草调和',modifications:['便秘加大黄','肿甚加金银花蒲公英','高热加石膏知母'],modern_application:'流行性腮腺炎颌下淋巴结炎颜面丹毒',cautions:'阴虚者慎用'},

    // ── 泻下剂 ──
    {name:'大承气汤',category:'泻下剂',source:'《伤寒论》张仲景',composition:[{drug:'大黄',dose:'12g'},{drug:'芒硝',dose:'9g'},{drug:'枳实',dose:'12g'},{drug:'厚朴',dose:'24g'}],efficacy:'峻下热结',indications:'阳明腑实证，大便不通频转矢气脘腹痞满腹痛拒按按之硬甚则潮热谵语手足濈然汗出',analysis:'大黄为君泻热通便，芒硝为臣软坚润燥，枳实厚朴为佐行气消痞除满',modifications:['热甚加栀子黄芩','阴伤加生地玄参','腹痛加白芍'],modern_application:'肠梗阻急性胰腺炎胆道感染感染性休克',cautions:'孕妇禁用气虚阴亏者慎用'},
    {name:'温脾汤',category:'泻下剂',source:'《备急千金要方》孙思邈',composition:[{drug:'大黄',dose:'15g'},{drug:'附子',dose:'6g'},{drug:'干姜',dose:'9g'},{drug:'人参',dose:'6g'},{drug:'当归',dose:'9g'},{drug:'甘草',dose:'6g'}],efficacy:'攻下冷积，温补脾阳',indications:'阳虚寒积证，便秘腹痛脐下绞痛绕脐不止手足不温',analysis:'附子干姜为君温阳散寒，大黄为臣泻下积滞，人参当归为佐益气养血，甘草为使调和',modifications:['腹痛甚加白芍','便秘甚加芒硝','气虚甚加黄芪'],modern_application:'慢性便秘肠梗阻术后肠麻痹',cautions:'孕妇慎用'},

    // ── 和解剂 ──
    {name:'小柴胡汤',category:'和解剂',source:'《伤寒论》张仲景',composition:[{drug:'柴胡',dose:'24g'},{drug:'黄芩',dose:'9g'},{drug:'人参',dose:'9g'},{drug:'半夏',dose:'9g'},{drug:'甘草',dose:'6g'},{drug:'生姜',dose:'9g'},{drug:'大枣',dose:'4枚'}],efficacy:'和解少阳',indications:'伤寒少阳证，往来寒热胸胁苦满默默不欲饮食心烦喜呕口苦咽干目眩',analysis:'柴胡为君透泄少阳之邪疏畅气机，黄芩为臣清泄少阳之热，半夏生姜降逆止呕，人参大枣甘草扶正祛邪',modifications:['渴去半夏加天花粉','腹痛去黄芩加白芍','咳嗽加五味子干姜'],modern_application:'感冒发热胆囊炎肝炎胰腺炎更年期综合征',cautions:'阴虚血少者慎用'},
    {name:'逍遥散',category:'和解剂',source:'《太平惠民和剂局方》',composition:[{drug:'柴胡',dose:'30g'},{drug:'当归',dose:'30g'},{drug:'白芍',dose:'30g'},{drug:'白术',dose:'30g'},{drug:'茯苓',dose:'30g'},{drug:'甘草',dose:'15g'},{drug:'薄荷',dose:'少许'},{drug:'生姜',dose:'少许'}],efficacy:'疏肝解郁，养血健脾',indications:'肝郁血虚脾弱证，两胁作痛头痛目眩口燥咽干神疲食少往来寒热月经不调乳房胀痛',analysis:'柴胡为君疏肝解郁，当归白芍为臣养血柔肝，白术茯苓为佐健脾祛湿，薄荷助柴胡疏肝，生姜温胃甘草调和',modifications:['热甚加丹皮栀子（丹栀逍遥散）','血虚甚加熟地','月经不调加香附益母草'],modern_application:'抑郁症焦虑症月经不调乳腺增生慢性肝炎',cautions:'阴虚阳亢者慎用'},
    {name:'半夏泻心汤',category:'和解剂',source:'《伤寒论》张仲景',composition:[{drug:'半夏',dose:'12g'},{drug:'黄芩',dose:'9g'},{drug:'干姜',dose:'9g'},{drug:'人参',dose:'9g'},{drug:'黄连',dose:'3g'},{drug:'大枣',dose:'4枚'},{drug:'炙甘草',dose:'9g'}],efficacy:'寒热平调，消痞散结',indications:'寒热互结之痞证，心下痞但满而不痛呕吐肠鸣下利',analysis:'半夏为君降逆止呕散结消痞，黄芩黄连为臣苦寒降热，干姜为臣辛温散寒，人参大枣甘草为佐益气补中',modifications:['脾胃虚寒加吴茱萸','湿热甚加蒲公英','嗳气加旋覆花代赭石'],modern_application:'慢性胃炎胃溃疡功能性消化不良肠易激综合征',cautions:'孕妇慎用'},

    // ── 温里剂 ──
    {name:'理中丸',category:'温里剂',source:'《伤寒论》张仲景',composition:[{drug:'人参',dose:'9g'},{drug:'干姜',dose:'9g'},{drug:'炙甘草',dose:'9g'},{drug:'白术',dose:'9g'}],efficacy:'温中祛寒，补气健脾',indications:'脾胃虚寒证，脘腹绵绵作痛喜温喜按呕吐便溏脘痞食少畏寒肢冷',analysis:'干姜为君温中散寒，人参为臣补气健脾，白术为佐健脾燥湿，甘草为使益气和中',modifications:['寒甚加附子（附子理中丸）','呕吐加半夏生姜','腹泻加肉豆蔻'],modern_application:'慢性胃炎慢性肠炎胃溃疡功能性消化不良',cautions:'阴虚有热者不宜用'},
    {name:'四逆汤',category:'温里剂',source:'《伤寒论》张仲景',composition:[{drug:'附子',dose:'15g'},{drug:'干姜',dose:'6g'},{drug:'炙甘草',dose:'6g'}],efficacy:'回阳救逆',indications:'少阴病，四肢厥逆恶寒蜷卧呕吐不渴腹痛下利神衰欲寐脉微欲绝',analysis:'附子为君回阳救逆温肾散寒，干姜为臣温中散寒助附子回阳，甘草为佐益气温中缓附子之毒',modifications:['脉微欲绝加人参','面色赤加葱白','呕吐加生姜'],modern_application:'心衰休克急性胃肠炎脱水',cautions:'孕妇禁用阴虚火旺者不宜用'},
    {name:'当归四逆汤',category:'温里剂',source:'《伤寒论》张仲景',composition:[{drug:'当归',dose:'12g'},{drug:'桂枝',dose:'9g'},{drug:'白芍',dose:'9g'},{drug:'细辛',dose:'3g'},{drug:'通草',dose:'6g'},{drug:'大枣',dose:'8枚'},{drug:'炙甘草',dose:'6g'}],efficacy:'温经散寒，养血通脉',indications:'血虚寒厥证，手足厥寒脉细欲绝或肢体关节疼痛',analysis:'当归为君养血和血，桂枝芍药为臣温经和营，细辛通草为佐温通经脉，大枣甘草为使益气健脾',modifications:['寒甚加附子肉桂','关节痛加威灵仙','血虚甚加熟地鸡血藤'],modern_application:'雷诺综合征血栓闭塞性脉管炎风湿性关节炎',cautions:'阴虚火旺者不宜用'},
    {name:'阳和汤',category:'温里剂',source:'《外科证治全生集》王洪绪',composition:[{drug:'熟地黄',dose:'30g'},{drug:'肉桂',dose:'3g'},{drug:'麻黄',dose:'2g'},{drug:'鹿角胶',dose:'9g'},{drug:'白芥子',dose:'6g'},{drug:'姜炭',dose:'2g'},{drug:'生甘草',dose:'3g'}],efficacy:'温阳补血，散寒通滞',indications:'阴疽证，患处漫肿无头皮色不变酸痛无热口中不渴舌淡苔白',analysis:'熟地鹿角胶为君温阳补血填精，肉桂姜炭为臣温阳散寒，麻黄白芥子为佐通阳散滞化痰，甘草为使调和',modifications:['气虚加黄芪党参','疼痛甚加乳香没药','肿块坚硬加浙贝母'],modern_application:'骨结核淋巴结核慢性骨髓炎类风湿',cautions:'阳证痈疡不宜用'},

    // ── 补益剂 ──
    {name:'四君子汤',category:'补益剂',source:'《太平惠民和剂局方》',composition:[{drug:'人参',dose:'9g'},{drug:'白术',dose:'9g'},{drug:'茯苓',dose:'9g'},{drug:'炙甘草',dose:'6g'}],efficacy:'益气健脾',indications:'脾胃气虚证，面色萎白语声低微气短乏力食少便溏',analysis:'人参为君大补元气健脾养胃，白术为臣健脾燥湿，茯苓为佐健脾渗湿，甘草为使益气和中',modifications:['气虚甚加黄芪','湿甚加薏苡仁扁豆','呕吐加半夏陈皮'],modern_application:'慢性胃炎慢性腹泻疲劳综合征免疫力低下',cautions:'阴虚火旺者不宜用'},
    {name:'参苓白术散',category:'补益剂',source:'《太平惠民和剂局方》',composition:[{drug:'人参',dose:'1000g'},{drug:'白术',dose:'1000g'},{drug:'茯苓',dose:'1000g'},{drug:'甘草',dose:'1000g'},{drug:'山药',dose:'1000g'},{drug:'莲子肉',dose:'500g'},{drug:'白扁豆',dose:'750g'},{drug:'薏苡仁',dose:'500g'},{drug:'砂仁',dose:'500g'},{drug:'桔梗',dose:'500g'}],efficacy:'益气健脾，渗湿止泻',indications:'脾虚湿盛证，饮食不化胸脘痞闷肠鸣泄泻四肢乏力形体消瘦面色萎黄',analysis:'四君子汤为基础益气健脾，山药莲子助健脾止泻，扁豆薏苡仁助茯苓渗湿，砂仁行气化湿，桔梗载药上行',modifications:['腹泻甚加诃子肉豆蔻','食欲差加鸡内金山楂','气虚甚加黄芪'],modern_application:'慢性腹泻消化不良小儿营养不良',cautions:'阴虚火旺者不宜用'},
    {name:'补中益气汤',category:'补益剂',source:'《脾胃论》李东垣',composition:[{drug:'黄芪',dose:'18g'},{drug:'人参',dose:'6g'},{drug:'白术',dose:'9g'},{drug:'炙甘草',dose:'9g'},{drug:'当归',dose:'3g'},{drug:'陈皮',dose:'6g'},{drug:'升麻',dose:'6g'},{drug:'柴胡',dose:'6g'}],efficacy:'补中益气，升阳举陷',indications:'脾胃气虚证及气虚下陷证，少气懒言体倦乏力食少便溏或脱肛子宫下垂久泻久痢',analysis:'黄芪为君补中益气升阳固表，人参白术甘草为臣益气健脾，当归养血陈合理性气机，升麻柴胡为佐使升阳举陷',modifications:['气虚甚重用黄芪','脱垂甚加枳壳','阴虚加麦冬五味子'],modern_application:'胃下垂脱肛子宫脱垂慢性腹泻疲劳综合征',cautions:'阴虚火旺者不宜用'},
    {name:'四物汤',category:'补益剂',source:'《太平惠民和剂局方》',composition:[{drug:'熟地黄',dose:'12g'},{drug:'当归',dose:'9g'},{drug:'白芍',dose:'9g'},{drug:'川芎',dose:'6g'}],efficacy:'补血调血',indications:'营血虚滞证，头晕心悸面色无华唇甲色淡月经不调或经闭脐腹作痛',analysis:'熟地为君滋阴补血填精，当归为臣补血活血，白芍为佐养血敛阴，川芎为使活血行气',modifications:['血热加生地丹皮','血寒加肉桂艾叶','血瘀加桃仁红花（桃红四物汤）'],modern_application:'贫血月经不调痛经产后调理',cautions:'脾胃虚弱泄泻者慎用'},
    {name:'归脾汤',category:'补益剂',source:'《济生方》严用和',composition:[{drug:'白术',dose:'9g'},{drug:'当归',dose:'9g'},{drug:'白茯苓',dose:'9g'},{drug:'黄芪',dose:'12g'},{drug:'龙眼肉',dose:'12g'},{drug:'酸枣仁',dose:'12g'},{drug:'人参',dose:'6g'},{drug:'木香',dose:'6g'},{drug:'炙甘草',dose:'3g'},{drug:'远志',dose:'6g'}],efficacy:'益气补血，健脾养心',indications:'心脾气血两虚证，心悸怔忡健忘失眠盗汗食少体倦面色萎黄或脾不统血之便血崩漏',analysis:'黄芪人参为君补气健脾，当归龙眼肉为臣补血养心，白术茯苓健脾渗湿酸枣仁远志养心安神，木香理气醒脾',modifications:['失眠甚加合欢皮夜交藤','出血加阿胶艾叶','气虚甚重用黄芪'],modern_application:'神经衰弱失眠贫血血小板减少性紫癜',cautions:'阴虚有热者慎用'},
    {name:'六味地黄丸',category:'补益剂',source:'《小儿药证直诀》钱乙',composition:[{drug:'熟地黄',dose:'24g'},{drug:'山萸肉',dose:'12g'},{drug:'山药',dose:'12g'},{drug:'泽泻',dose:'9g'},{drug:'牡丹皮',dose:'9g'},{drug:'茯苓',dose:'9g'}],efficacy:'滋补肝肾',indications:'肝肾阴虚证，腰膝酸软头晕耳鸣盗汗遗精骨蒸潮热手足心热口燥咽干',analysis:'熟地为君滋阴补肾填精，山萸肉山药为臣补肝肾涩精，三泻（泽泻丹皮茯苓）为佐泻湿浊清虚热',modifications:['阴虚火旺加知母黄柏（知柏地黄丸）','肝肾不足加枸杞菊花（杞菊地黄丸）','肺肾阴虚加麦冬五味子（麦味地黄丸）'],modern_application:'高血压糖尿病慢性肾炎更年期综合征甲状腺功能亢进',cautions:'脾胃虚寒泄泻者慎用'},
    {name:'肾气丸',category:'补益剂',source:'《金匮要略》张仲景',composition:[{drug:'干地黄',dose:'24g'},{drug:'山药',dose:'12g'},{drug:'山萸肉',dose:'12g'},{drug:'泽泻',dose:'9g'},{drug:'茯苓',dose:'9g'},{drug:'牡丹皮',dose:'9g'},{drug:'桂枝',dose:'3g'},{drug:'附子',dose:'3g'}],efficacy:'温补肾阳',indications:'肾阳不足证，腰痛脚软下半身常有冷感少腹拘急小便不利或反多舌质淡而胖脉虚弱',analysis:'干地黄滋阴补肾为君，附子桂枝温补肾阳为臣，山萸肉山药补肝肾，泽泻茯苓丹皮泻湿浊清虚热为佐使',modifications:['阳虚甚加淫羊藿巴戟天','水肿加牛膝车前子（济生肾气丸）','遗精加芡实莲须'],modern_application:'慢性肾炎前列腺增生糖尿病性功能减退',cautions:'阴虚火旺者不宜用'},
    {name:'左归丸',category:'补益剂',source:'《景岳全书》张景岳',composition:[{drug:'熟地黄',dose:'240g'},{drug:'山药',dose:'120g'},{drug:'枸杞',dose:'120g'},{drug:'山萸肉',dose:'120g'},{drug:'川牛膝',dose:'90g'},{drug:'菟丝子',dose:'120g'},{drug:'鹿角胶',dose:'120g'},{drug:'龟板胶',dose:'120g'}],efficacy:'滋阴补肾，填精益髓',indications:'真阴不足证，头晕目眩腰酸腿软遗精滑泄自汗盗汗口燥舌干',analysis:'熟地为君滋阴填精，龟板胶鹿角胶为臣填精补髓，枸杞山萸肉山药滋阴补肝肾，菟丝子川牛膝为佐益肾强腰',modifications:['气虚加人参','滑精加芡实莲须','火旺加知母黄柏'],modern_application:'慢性肾炎骨质疏松更年期综合征不育症',cautions:'脾胃虚寒泄泻者慎用'},
    {name:'右归丸',category:'补益剂',source:'《景岳全书》张景岳',composition:[{drug:'熟地黄',dose:'240g'},{drug:'山药',dose:'120g'},{drug:'山萸肉',dose:'90g'},{drug:'枸杞',dose:'120g'},{drug:'鹿角胶',dose:'120g'},{drug:'菟丝子',dose:'120g'},{drug:'杜仲',dose:'120g'},{drug:'当归',dose:'90g'},{drug:'肉桂',dose:'60g'},{drug:'附子',dose:'60g'}],efficacy:'温补肾阳，填精止遗',indications:'肾阳不足命门火衰证，气衰神疲畏寒肢冷腰膝软弱阳痿遗精或大便不实小便自遗',analysis:'附子肉桂为君温补肾阳，鹿角胶杜仲菟丝子为臣温补肾阳填精，熟地山药山萸肉枸杞当归为佐滋阴养血',modifications:['阳痿加淫羊藿巴戟天','遗精加芡实金樱子','腹泻加补骨脂肉豆蔻'],modern_application:'性功能减退慢性腹泻腰肌劳损不育症',cautions:'阴虚火旺者不宜用'},
    {name:'炙甘草汤',category:'补益剂',source:'《伤寒论》张仲景',composition:[{drug:'炙甘草',dose:'12g'},{drug:'生姜',dose:'9g'},{drug:'人参',dose:'6g'},{drug:'生地黄',dose:'50g'},{drug:'桂枝',dose:'9g'},{drug:'阿胶',dose:'6g'},{drug:'麦门冬',dose:'10g'},{drug:'麻仁',dose:'10g'},{drug:'大枣',dose:'10枚'}],efficacy:'益气滋阴，通阳复脉',indications:'阴血不足气虚血弱证，脉结代心动悸虚羸少气舌光少苔或虚劳肺痿',analysis:'炙甘草为君益气补中，人参大枣为臣补气，生地阿胶麦冬麻仁为佐滋阴养血，桂枝生姜为佐温阳通脉',modifications:['心悸甚加龙骨牡蛎','失眠加酸枣仁柏子仁','气虚甚加黄芪'],modern_application:'心律失常病毒性心肌炎功能性早搏',cautions:'痰湿内盛者不宜用'},
    {name:'生脉散',category:'补益剂',source:'《医学启源》李东垣',composition:[{drug:'人参',dose:'9g'},{drug:'麦门冬',dose:'9g'},{drug:'五味子',dose:'6g'}],efficacy:'益气生津，敛阴止汗',indications:'温热暑热耗气伤阴证或久咳肺虚证，汗多神疲体倦乏力气短懒言咽干口渴脉虚数',analysis:'人参为君大补元气，麦冬为臣养阴清热生津，五味子为佐敛肺止汗生津',modifications:['气虚甚加黄芪','阴虚甚加生地','咳嗽加紫菀款冬花'],modern_application:'冠心病心力衰竭夏季中暑慢性支气管炎',cautions:'实证邪盛者不宜用'},
    {name:'玉屏风散',category:'补益剂',source:'《医方类聚》引《究原方》',composition:[{drug:'黄芪',dose:'60g'},{drug:'白术',dose:'60g'},{drug:'防风',dose:'30g'}],efficacy:'益气固表止汗',indications:'表虚自汗证，自汗恶风面色㿠白易感冒或体虚易感风邪',analysis:'黄芪为君益气固表，白术为臣健脾益气助黄芪固表，防风为佐走表祛风御邪',modifications:['自汗甚加浮小麦牡蛎','气虚甚加人参','阳虚加附子'],modern_application:'反复感冒过敏性鼻炎免疫力低下',cautions:'外感表实证不宜用'},

    // ── 安神剂 ──
    {name:'酸枣仁汤',category:'安神剂',source:'《金匮要略》张仲景',composition:[{drug:'酸枣仁',dose:'15g'},{drug:'甘草',dose:'3g'},{drug:'知母',dose:'6g'},{drug:'茯苓',dose:'6g'},{drug:'川芎',dose:'6g'}],efficacy:'养血安神，清热除烦',indications:'肝血不足虚热内扰证，虚烦不得眠心悸盗汗头目眩晕咽干口燥',analysis:'酸枣仁为君养心安神敛汗，川芎为臣调畅气血疏肝，茯苓为佐宁心安神，知母为佐清虚热，甘草为使调和',modifications:['失眠甚加龙骨牡蛎','血虚甚加当归白芍','热甚加栀子丹皮'],modern_application:'失眠症神经衰弱焦虑症更年期综合征',cautions:'实热证不宜用'},
    {name:'天王补心丹',category:'安神剂',source:'《校注妇人良方》',composition:[{drug:'酸枣仁',dose:'60g'},{drug:'柏子仁',dose:'60g'},{drug:'当归',dose:'60g'},{drug:'天冬',dose:'60g'},{drug:'麦冬',dose:'60g'},{drug:'生地',dose:'120g'},{drug:'人参',dose:'15g'},{drug:'丹参',dose:'15g'},{drug:'玄参',dose:'15g'},{drug:'白茯苓',dose:'15g'},{drug:'五味子',dose:'15g'},{drug:'远志',dose:'15g'},{drug:'桔梗',dose:'15g'}],efficacy:'滋阴养血，补心安神',indications:'阴虚血少神志不安证，心悸怔忡虚烦失眠神疲健忘梦遗盗汗手足心热',analysis:'生地为君滋阴养血，天冬麦冬玄参为臣滋阴清热，当归丹参补血养心，人参茯苓益气宁心，酸枣仁柏子仁远志五味子安神敛汗',modifications:['失眠甚加龙骨牡蛎','气虚甚加黄芪','热甚加栀子'],modern_application:'失眠症神经衰弱心律失常甲亢',cautions:'脾胃虚寒泄泻者慎用'},
    {name:'甘麦大枣汤',category:'安神剂',source:'《金匮要略》张仲景',composition:[{drug:'甘草',dose:'9g'},{drug:'小麦',dose:'15g'},{drug:'大枣',dose:'10枚'}],efficacy:'养心安神，和中缓急',indications:'脏躁证，精神恍惚悲伤欲哭不能自主频繁打呵欠伸懒腰',analysis:'小麦为君养心安神，甘草为臣和中缓急，大枣为佐补中益气养血',modifications:['失眠加酸枣仁百合','烦躁加栀子豆豉','气虚加人参黄芪'],modern_application:'癔病抑郁症更年期综合征神经官能症',cautions:'实热证不宜用'},

    // ── 理气剂 ──
    {name:'越鞠丸',category:'理气剂',source:'《丹溪心法》朱丹溪',composition:[{drug:'香附',dose:'6g'},{drug:'川芎',dose:'6g'},{drug:'苍术',dose:'6g'},{drug:'栀子',dose:'6g'},{drug:'神曲',dose:'6g'}],efficacy:'行气解郁',indications:'六郁证，胸膈痞闷脘腹胀痛嗳腐吞酸恶心呕吐饮食不消',analysis:'香附为君行气解郁，川芎血中气药治血郁，苍术燥湿健脾治湿郁，栀子清热泻火治火郁，神曲消食和胃治食郁',modifications:['气郁甚加木香枳壳','血瘀甚加桃仁红花','湿重加茯苓薏苡仁'],modern_application:'胃肠神经官能症慢性胃炎消化不良抑郁症',cautions:'阴虚火旺者慎用'},
    {name:'半夏厚朴汤',category:'理气剂',source:'《金匮要略》张仲景',composition:[{drug:'半夏',dose:'12g'},{drug:'厚朴',dose:'9g'},{drug:'茯苓',dose:'12g'},{drug:'生姜',dose:'9g'},{drug:'苏叶',dose:'6g'}],efficacy:'行气散结，降逆化痰',indications:'梅核气，咽中如有物阻咯吐不出吞咽不下胸胁满闷或咳或呕',analysis:'半夏为君化痰散结降逆，厚朴为臣行气开郁下气，茯苓为佐健脾渗湿，生姜辛散降逆苏叶宣肺疏肝',modifications:['气郁甚加香附郁金','痰多加陈皮胆南星','胸胁痛加柴胡枳壳'],modern_application:'咽异感症慢性咽炎胃神经官能症癔病',cautions:'阴虚咽干者不宜用'},
    {name:'枳实薤白桂枝汤',category:'理气剂',source:'《金匮要略》张仲景',composition:[{drug:'枳实',dose:'12g'},{drug:'厚朴',dose:'12g'},{drug:'薤白',dose:'9g'},{drug:'桂枝',dose:'6g'},{drug:'瓜蒌',dose:'12g'}],efficacy:'通阳散结，祛痰下气',indications:'胸阳不振痰气互结之胸痹证，胸满而痛甚或胸痛彻背喘息咳唾短气',analysis:'瓜蒌为君涤痰宽胸，薤白为臣通阳散结，枳实厚朴为佐行气消痞，桂枝为佐通阳化气',modifications:['胸痛甚加丹参檀香','痰多加半夏陈皮','气虚加人参黄芪'],modern_application:'冠心病心绞痛肋间神经痛',cautions:'阴虚有热者慎用'},
    {name:'苏子降气汤',category:'理气剂',source:'《太平惠民和剂局方》',composition:[{drug:'苏子',dose:'9g'},{drug:'半夏',dose:'9g'},{drug:'当归',dose:'6g'},{drug:'甘草',dose:'6g'},{drug:'前胡',dose:'6g'},{drug:'厚朴',dose:'6g'},{drug:'肉桂',dose:'3g'}],efficacy:'降气平喘，祛痰止咳',indications:'上实下虚之喘咳证，痰涎壅盛胸膈满闷喘咳短气或腰疼脚弱',analysis:'苏子为君降气化痰平喘，半夏前胡为臣降逆化痰，厚朴行气下气，当归养血润燥肉桂温肾纳气，甘草调和',modifications:['喘甚加白果麻黄','痰多加陈皮茯苓','肾虚加补骨脂'],modern_application:'慢性支气管炎肺气肿支气管哮喘',cautions:'肺肾两虚喘咳者不宜用'},

    // ── 理血剂 ──
    {name:'血府逐瘀汤',category:'理血剂',source:'《医林改错》王清任',composition:[{drug:'桃仁',dose:'12g'},{drug:'红花',dose:'9g'},{drug:'当归',dose:'9g'},{drug:'生地黄',dose:'9g'},{drug:'川芎',dose:'5g'},{drug:'赤芍',dose:'6g'},{drug:'牛膝',dose:'9g'},{drug:'桔梗',dose:'5g'},{drug:'柴胡',dose:'3g'},{drug:'枳壳',dose:'6g'},{drug:'甘草',dose:'3g'}],efficacy:'活血化瘀，行气止痛',indications:'胸中血瘀证，胸痛头痛日久不愈痛如针刺而有定处呃逆日久不止饮水即呛心悸怔忡失眠',analysis:'桃仁红花为君活血化瘀，川芎赤芍当归为臣活血养血，柴胡枳壳疏肝理气，牛膝引血下行桔梗载药上行，生地配当归养血活血',modifications:['胸痛甚加乳香没药','头痛甚加全蝎蜈蚣','气虚加黄芪'],modern_application:'冠心病心绞痛脑供血不足头痛失眠',cautions:'孕妇禁用气虚血瘀者慎用'},
    {name:'补阳还五汤',category:'理血剂',source:'《医林改错》王清任',composition:[{drug:'黄芪',dose:'120g'},{drug:'当归',dose:'6g'},{drug:'赤芍',dose:'5g'},{drug:'地龙',dose:'3g'},{drug:'川芎',dose:'3g'},{drug:'红花',dose:'3g'},{drug:'桃仁',dose:'3g'}],efficacy:'补气活血通络',indications:'中风之气虚血瘀证，半身不遂口眼歪斜语言謇涩口角流涎小便频数或遗尿不禁',analysis:'重用黄芪为君大补元气使气旺以促血行，当归为臣补血活血，川芎赤芍桃仁红花为佐活血化瘀，地龙为佐通经活络',modifications:['偏寒加附子桂枝','偏热加栀子黄芩','痰多加半夏天竺黄'],modern_application:'脑梗死后遗症脑出血后遗症冠心病',cautions:'阴虚血热者慎用'},
    {name:'十灰散',category:'理血剂',source:'《十药神书》葛可久',composition:[{drug:'大蓟',dose:'等分'},{drug:'小蓟',dose:'等分'},{drug:'荷叶',dose:'等分'},{drug:'侧柏叶',dose:'等分'},{drug:'白茅根',dose:'等分'},{drug:'茜草根',dose:'等分'},{drug:'山栀',dose:'等分'},{drug:'大黄',dose:'等分'},{drug:'牡丹皮',dose:'等分'},{drug:'棕榈皮',dose:'等分'}],efficacy:'凉血止血',indications:'血热妄行之上部出血证，吐血咯血衄血嗽血血色鲜红',analysis:'大蓟小蓟荷叶侧柏叶白茅根茜根为君凉血止血，栀子大黄清热泻火引热下行，丹皮配大黄凉血祛瘀，棕榈收涩止血',modifications:['出血甚加三七白及','热甚加黄芩黄连','气虚加人参'],modern_application:'肺结核咯血胃溃疡出血鼻衄',cautions:'虚寒出血者不宜用'},
    {name:'小蓟饮子',category:'理血剂',source:'《济生方》严用和',composition:[{drug:'生地黄',dose:'30g'},{drug:'小蓟',dose:'15g'},{drug:'滑石',dose:'15g'},{drug:'木通',dose:'6g'},{drug:'蒲黄',dose:'9g'},{drug:'藕节',dose:'9g'},{drug:'淡竹叶',dose:'9g'},{drug:'当归',dose:'6g'},{drug:'栀子',dose:'9g'},{drug:'炙甘草',dose:'6g'}],efficacy:'凉血止血，利水通淋',indications:'热结下焦之血淋尿血，小便频数赤涩热痛尿中见血或血尿',analysis:'生地小蓟为君凉血止血，藕节蒲黄为臣收敛止血，滑石木通竹叶栀子清热利水通淋，当归养血和血甘草调和',modifications:['血尿甚加白茅根琥珀','热甚加蒲公英金银花','疼痛加白芍甘草'],modern_application:'急性膀胱炎尿路感染肾结石血尿',cautions:'脾胃虚寒者慎用'},

    // ── 祛湿剂 ──
    {name:'平胃散',category:'祛湿剂',source:'《太平惠民和剂局方》',composition:[{drug:'苍术',dose:'15g'},{drug:'厚朴',dose:'9g'},{drug:'陈皮',dose:'9g'},{drug:'甘草',dose:'6g'},{drug:'生姜',dose:'少许'},{drug:'大枣',dose:'2枚'}],efficacy:'燥湿健脾，宽胸消胀',indications:'湿滞脾胃证，脘腹胀满不思饮食口淡无味恶心呕吐嗳气吞酸肢体沉重怠惰嗜卧',analysis:'苍术为君燥湿健脾，厚朴为臣行气除满燥湿，陈皮为佐理气化湿和胃，甘草为使调和姜枣和胃',modifications:['湿盛加藿香佩兰','热重加黄芩黄连','气虚加人参白术'],modern_application:'慢性胃炎消化不良胃肠功能紊乱',cautions:'阴虚气滞者慎用'},
    {name:'藿香正气散',category:'祛湿剂',source:'《太平惠民和剂局方》',composition:[{drug:'藿香',dose:'90g'},{drug:'紫苏',dose:'30g'},{drug:'白芷',dose:'30g'},{drug:'大腹皮',dose:'30g'},{drug:'茯苓',dose:'30g'},{drug:'白术',dose:'60g'},{drug:'陈皮',dose:'60g'},{drug:'半夏曲',dose:'60g'},{drug:'厚朴',dose:'60g'},{drug:'桔梗',dose:'60g'},{drug:'甘草',dose:'75g'}],efficacy:'解表化湿，理气和中',indications:'外感风寒内伤湿滞证，恶寒发热头痛胸膈满闷脘腹疼痛恶心呕吐肠鸣泄泻',analysis:'藿香为君外散风寒内化湿浊，紫苏白芷为臣助解表散寒，半夏曲陈皮燥湿和胃厚朴大腹皮行气化湿，白术茯苓健脾渗湿桔梗宣肺',modifications:['寒甚加干姜肉桂','湿重加苍术薏苡仁','食滞加神曲山楂'],modern_application:'胃肠型感冒急性胃肠炎食物中毒',cautions:'阴虚火旺者慎用'},
    {name:'三仁汤',category:'祛湿剂',source:'《温病条辨》吴鞠通',composition:[{drug:'杏仁',dose:'15g'},{drug:'滑石',dose:'18g'},{drug:'白通草',dose:'6g'},{drug:'白蔻仁',dose:'6g'},{drug:'竹叶',dose:'6g'},{drug:'厚朴',dose:'6g'},{drug:'生薏苡仁',dose:'18g'},{drug:'半夏',dose:'15g'}],efficacy:'宣畅气机，清利湿热',indications:'湿温初起及暑温夹湿，头痛恶寒身重疼痛面色淡黄胸闷不饥午后身热',analysis:'杏仁宣上焦肺气白蔻仁畅中焦气机薏苡仁渗下焦湿热为君，半夏厚朴为臣燥湿行气，滑石通草竹叶为佐清热利湿',modifications:['热甚加黄芩连翘','湿重加苍术藿香','咳嗽加桔梗枇杷叶'],modern_application:'肠伤寒钩端螺旋体病急性胃肠炎肾盂肾炎',cautions:'阴虚者不宜用'},
    {name:'茵陈蒿汤',category:'祛湿剂',source:'《伤寒论》张仲景',composition:[{drug:'茵陈',dose:'18g'},{drug:'栀子',dose:'9g'},{drug:'大黄',dose:'6g'}],efficacy:'清热利湿退黄',indications:'湿热黄疸证，一身面目俱黄黄色鲜明如橘子色腹微满口渴小便短赤',analysis:'茵陈为君清热利湿退黄，栀子为臣清泄三焦湿热，大黄为佐泻热逐瘀通便',modifications:['热甚加黄柏龙胆草','湿重加茯苓泽泻','胁痛加柴胡郁金'],modern_application:'急性黄疸型肝炎胆囊炎胆石症',cautions:'阴黄证不宜用'},
    {name:'五苓散',category:'祛湿剂',source:'《伤寒论》张仲景',composition:[{drug:'泽泻',dose:'15g'},{drug:'茯苓',dose:'9g'},{drug:'猪苓',dose:'9g'},{drug:'白术',dose:'9g'},{drug:'桂枝',dose:'6g'}],efficacy:'利水渗湿，温阳化气',indications:'膀胱蓄水证，小便不利头痛微热烦渴欲饮水水入则吐或水肿',analysis:'泽泻为君利水渗湿，茯苓猪苓为臣助渗湿，白术为佐健脾运湿，桂枝为佐温阳化气兼解表',modifications:['水肿甚加车前子冬瓜皮','脾虚加黄芪党参','寒甚加附子干姜'],modern_application:'急慢性肾炎水肿尿潴留腹泻',cautions:'阴虚有热者慎用'},
    {name:'真武汤',category:'祛湿剂',source:'《伤寒论》张仲景',composition:[{drug:'茯苓',dose:'9g'},{drug:'芍药',dose:'9g'},{drug:'白术',dose:'6g'},{drug:'生姜',dose:'9g'},{drug:'附子',dose:'9g'}],efficacy:'温阳利水',indications:'阳虚水泛证，畏寒肢厥小便不利心下悸四肢沉重浮肿腰以下为甚腹痛下利',analysis:'附子为君温肾助阳化气行水，茯苓白术为臣健脾渗湿利水，生姜为佐温散水气，芍药为佐敛阴和营制附子之燥',modifications:['脾虚甚加党参黄芪','水肿甚加车前子泽泻','咳加五味子细辛'],modern_application:'慢性肾炎心衰肝硬化腹水甲状腺功能减退',cautions:'阴虚火旺者不宜用'},
    {name:'独活寄生汤',category:'祛湿剂',source:'《备急千金要方》孙思邈',composition:[{drug:'独活',dose:'9g'},{drug:'桑寄生',dose:'6g'},{drug:'杜仲',dose:'6g'},{drug:'牛膝',dose:'6g'},{drug:'细辛',dose:'6g'},{drug:'秦艽',dose:'6g'},{drug:'茯苓',dose:'6g'},{drug:'肉桂心',dose:'6g'},{drug:'防风',dose:'6g'},{drug:'川芎',dose:'6g'},{drug:'人参',dose:'6g'},{drug:'甘草',dose:'6g'},{drug:'当归',dose:'6g'},{drug:'芍药',dose:'6g'},{drug:'干地黄',dose:'6g'}],efficacy:'祛风湿止痹痛益肝肾补气血',indications:'痹证日久肝肾两虚气血不足证，腰膝疼痛肢节屈伸不利或麻木不仁畏寒喜温',analysis:'独活为君祛下焦风寒湿邪，防风秦艽为臣祛风除湿，细辛肉桂温经散寒，桑寄生杜仲牛膝补肝肾强筋骨，四物汤养血和血四君子汤益气健脾',modifications:['疼痛甚加乳香没药','寒甚加附子乌头','湿重加苍术薏苡仁'],modern_application:'类风湿性关节炎骨关节炎坐骨神经痛',cautions:'孕妇慎用'},

    // ── 祛痰剂 ──
    {name:'二陈汤',category:'祛痰剂',source:'《太平惠民和剂局方》',composition:[{drug:'半夏',dose:'15g'},{drug:'橘红',dose:'15g'},{drug:'白茯苓',dose:'9g'},{drug:'炙甘草',dose:'5g'},{drug:'生姜',dose:'7片'},{drug:'乌梅',dose:'1个'}],efficacy:'燥湿化痰，理气和中',indications:'湿痰证，咳嗽痰多色白易咯胸膈痞闷恶心呕吐肢体困倦头眩心悸',analysis:'半夏为君燥湿化痰降逆止呕，橘红为臣理气燥湿化痰，茯苓为佐健脾渗湿，生姜降逆化痰乌梅敛肺，甘草调和',modifications:['寒痰加干姜细辛','热痰加黄芩瓜蒌','风痰加制南星白附子'],modern_application:'慢性支气管炎慢性胃炎梅尼埃病',cautions:'阴虚燥咳者不宜用'},
    {name:'温胆汤',category:'祛痰剂',source:'《备急千金要方》孙思邈',composition:[{drug:'半夏',dose:'6g'},{drug:'竹茹',dose:'6g'},{drug:'枳实',dose:'6g'},{drug:'陈皮',dose:'9g'},{drug:'茯苓',dose:'4.5g'},{drug:'甘草',dose:'3g'},{drug:'生姜',dose:'5片'},{drug:'大枣',dose:'1枚'}],efficacy:'理气化痰，清胆和胃',indications:'胆郁痰扰证，虚烦不眠呕吐呃逆惊悸不宁或癫痫',analysis:'半夏为君燥湿化痰降逆和胃，竹茹为臣清热化痰止呕，枳实为佐行气消痰，陈皮理气茯苓健脾甘草姜枣调和',modifications:['失眠甚加酸枣仁远志','热甚加黄连（黄连温胆汤）','眩晕加天麻钩藤'],modern_application:'失眠症焦虑症美尼尔综合征慢性胃炎',cautions:'寒痰者不宜用'},
    {name:'半夏白术天麻汤',category:'祛痰剂',source:'《医学心悟》程钟龄',composition:[{drug:'半夏',dose:'9g'},{drug:'天麻',dose:'6g'},{drug:'茯苓',dose:'6g'},{drug:'橘红',dose:'6g'},{drug:'白术',dose:'15g'},{drug:'甘草',dose:'3g'},{drug:'生姜',dose:'1片'},{drug:'大枣',dose:'2枚'}],efficacy:'化痰息风，健脾祛湿',indications:'风痰上扰证，眩晕头痛胸闷呕恶痰多白滑',analysis:'半夏天麻为君化痰息风止眩，白术为臣健脾燥湿，茯苓为佐健脾渗湿，橘红理气化痰甘草姜枣调和',modifications:['眩晕甚加钩藤菊花','头痛加川芎白芷','痰多加胆南星'],modern_application:'美尼尔综合征高血压眩晕偏头痛',cautions:'肝阳上亢之眩晕不宜用'},

    // ── 消食剂 ──
    {name:'保和丸',category:'消食剂',source:'《丹溪心法》朱丹溪',composition:[{drug:'山楂',dose:'18g'},{drug:'神曲',dose:'6g'},{drug:'半夏',dose:'9g'},{drug:'茯苓',dose:'9g'},{drug:'陈皮',dose:'3g'},{drug:'连翘',dose:'3g'},{drug:'莱菔子',dose:'3g'}],efficacy:'消食和胃',indications:'食滞胃脘证，脘腹痞满胀痛嗳腐吞酸恶食呕吐大便不调',analysis:'山楂为君消肉食油腻，神曲为臣消食和胃，莱菔子下气消食，半夏陈皮燥湿化痰理气和胃，茯苓健脾渗湿连翘清食积所生之热',modifications:['食滞甚加枳实槟榔','热甚加黄芩栀子','便秘加大黄'],modern_application:'消化不良急性胃肠炎小儿积食',cautions:'脾胃虚弱者慎用'},
    {name:'健脾丸',category:'消食剂',source:'《证治准绳》王肯堂',composition:[{drug:'白术',dose:'75g'},{drug:'木香',dose:'22g'},{drug:'黄连',dose:'22g'},{drug:'甘草',dose:'22g'},{drug:'白茯苓',dose:'60g'},{drug:'人参',dose:'45g'},{drug:'神曲',dose:'30g'},{drug:'陈皮',dose:'30g'},{drug:'砂仁',dose:'30g'},{drug:'麦芽',dose:'30g'},{drug:'山楂',dose:'30g'},{drug:'山药',dose:'30g'},{drug:'肉豆蔻',dose:'30g'}],efficacy:'健脾和胃，消食止泻',indications:'脾虚食积证，食少难消脘腹痞闷大便溏薄苔腻微黄',analysis:'人参白术茯苓山药为君益气健脾，山楂神曲麦芽为臣消食化积，木香砂仁陈皮理气开胃，肉豆蔻涩肠止泻黄连清湿热',modifications:['腹泻甚加莲子芡实','食滞甚加枳实','气虚甚加黄芪'],modern_application:'慢性消化不良小儿营养不良慢性肠炎',cautions:'食积实证不宜用'},

    // ── 治风剂 ──
    {name:'川芎茶调散',category:'治风剂',source:'《太平惠民和剂局方》',composition:[{drug:'川芎',dose:'120g'},{drug:'荆芥',dose:'120g'},{drug:'白芷',dose:'60g'},{drug:'羌活',dose:'60g'},{drug:'甘草',dose:'60g'},{drug:'细辛',dose:'30g'},{drug:'防风',dose:'45g'},{drug:'薄荷叶',dose:'240g'}],efficacy:'疏风止痛',indications:'外感风邪头痛证，偏正头痛或巅顶作痛恶寒发热鼻塞目眩',analysis:'川芎为君行气活血祛风止痛，薄荷荆芥为臣疏散风邪，羌活白芷细辛防风为佐散寒止痛，甘草调和清茶清上降下',modifications:['偏头痛加柴胡黄芩','风寒甚加桂枝生姜','热甚加菊花蔓荆子'],modern_application:'偏头痛紧张性头痛感冒头痛',cautions:'肝阳上亢头痛者不宜用'},
    {name:'镇肝熄风汤',category:'治风剂',source:'《医学衷中参西录》张锡纯',composition:[{drug:'怀牛膝',dose:'30g'},{drug:'生赭石',dose:'30g'},{drug:'生龙骨',dose:'15g'},{drug:'生牡蛎',dose:'15g'},{drug:'生龟板',dose:'15g'},{drug:'生杭芍',dose:'15g'},{drug:'玄参',dose:'15g'},{drug:'天冬',dose:'15g'},{drug:'川楝子',dose:'6g'},{drug:'生麦芽',dose:'6g'},{drug:'茵陈',dose:'6g'},{drug:'甘草',dose:'4.5g'}],efficacy:'镇肝息风，滋阴潜阳',indications:'类中风证，头目眩晕目胀耳鸣脑部热痛心中烦热面色如醉或肢体渐觉不利口眼渐形歪斜',analysis:'牛膝为君引血下行补益肝肾，赭石为臣平肝降逆龙骨牡蛎龟板潜阳熄风，白芍玄参天冬滋阴，川楝子麦芽茵陈疏肝清热甘草调和',modifications:['眩晕甚加天麻钩藤','痰多加胆南星竹茹','心烦加栀子豆豉'],modern_application:'高血压脑病脑出血后遗症血管性头痛',cautions:'气虚血瘀者慎用'},
    {name:'天麻钩藤饮',category:'治风剂',source:'《中医内科新编》',composition:[{drug:'天麻',dose:'9g'},{drug:'钩藤',dose:'12g'},{drug:'石决明',dose:'18g'},{drug:'栀子',dose:'9g'},{drug:'黄芩',dose:'9g'},{drug:'川牛膝',dose:'12g'},{drug:'杜仲',dose:'9g'},{drug:'益母草',dose:'9g'},{drug:'桑寄生',dose:'9g'},{drug:'夜交藤',dose:'9g'},{drug:'朱茯神',dose:'9g'}],efficacy:'平肝息风，清热安神',indications:'肝阳偏亢肝风上扰证，头痛眩晕失眠耳鸣口苦面红目赤',analysis:'天麻钩藤为君平肝息风，石决明为臣平肝潜阳，栀子黄芩清热泻火川牛膝引血下行，杜仲桑寄生补益肝肾，夜交藤茯神安神',modifications:['眩晕甚加菊花白蒺藜','失眠加酸枣仁','热甚加龙胆草'],modern_application:'高血压病神经性头痛眩晕症',cautions:'血虚阴虚者慎用'},

    // ── 治燥剂 ──
    {name:'杏苏散',category:'治燥剂',source:'《温病条辨》吴鞠通',composition:[{drug:'苏叶',dose:'9g'},{drug:'杏仁',dose:'9g'},{drug:'半夏',dose:'9g'},{drug:'茯苓',dose:'9g'},{drug:'橘皮',dose:'6g'},{drug:'前胡',dose:'9g'},{drug:'苦桔梗',dose:'6g'},{drug:'枳壳',dose:'6g'},{drug:'甘草',dose:'3g'},{drug:'生姜',dose:'3片'},{drug:'大枣',dose:'3枚'}],efficacy:'轻宣凉燥，理肺化痰',indications:'外感凉燥证，恶寒无汗头微痛咳嗽痰稀鼻塞咽干',analysis:'苏叶杏仁为君轻宣凉燥宣肺化痰，前胡为臣降气化痰，桔梗枳壳一升一降调畅气机，半夏橘皮燥湿化痰茯苓健脾甘草姜枣调和',modifications:['咳嗽甚加紫菀款冬花','痰多加贝母瓜蒌','恶寒甚加荆芥防风'],modern_application:'秋季感冒慢性支气管炎',cautions:'温燥伤肺者不宜用'},
    {name:'清燥救肺汤',category:'治燥剂',source:'《医门法律》喻昌',composition:[{drug:'桑叶',dose:'9g'},{drug:'石膏',dose:'8g'},{drug:'甘草',dose:'3g'},{drug:'人参',dose:'2g'},{drug:'胡麻仁',dose:'3g'},{drug:'阿胶',dose:'3g'},{drug:'麦门冬',dose:'4g'},{drug:'杏仁',dose:'2g'},{drug:'枇杷叶',dose:'3g'}],efficacy:'清燥润肺',indications:'温燥伤肺证，身热头痛干咳无痰气逆而喘咽喉干燥鼻燥心烦口渴',analysis:'桑叶为君轻宣燥热，石膏为臣清肺热麦冬润肺燥，阿胶胡麻仁滋阴润肺，人参甘草益气生津，杏仁枇杷叶降逆止咳',modifications:['热甚加栀子黄芩','咳血加白茅根侧柏叶','气虚甚加黄芪'],modern_application:'秋季感冒急性支气管炎肺炎恢复期',cautions:'凉燥者不宜用'},
    {name:'百合固金汤',category:'治燥剂',source:'《慎斋遗书》周慎斋',composition:[{drug:'百合',dose:'12g'},{drug:'熟地黄',dose:'9g'},{drug:'生地黄',dose:'9g'},{drug:'当归身',dose:'9g'},{drug:'白芍',dose:'6g'},{drug:'甘草',dose:'3g'},{drug:'桔梗',dose:'6g'},{drug:'玄参',dose:'3g'},{drug:'贝母',dose:'6g'},{drug:'麦冬',dose:'9g'}],efficacy:'滋肾保肺，止咳化痰',indications:'肺肾阴亏虚火上炎证，咳嗽气喘痰中带血咽喉燥痛手足心热骨蒸盗汗',analysis:'百合麦冬为君润肺清热，熟地生地为臣滋肾养阴，玄参清热凉血当归白芍养血和血，贝母化痰止咳桔梗载药上行甘草调和',modifications:['咳血甚加白及仙鹤草','热甚加知母地骨皮','痰多加瓜蒌'],modern_application:'肺结核慢性支气管炎支气管扩张咯血',cautions:'脾胃虚寒泄泻者慎用'},

    // ── 固涩剂 ──
    {name:'四神丸',category:'固涩剂',source:'《证治准绳》王肯堂',composition:[{drug:'肉豆蔻',dose:'60g'},{drug:'补骨脂',dose:'120g'},{drug:'五味子',dose:'60g'},{drug:'吴茱萸',dose:'30g'}],efficacy:'温肾暖脾，固肠止泻',indications:'脾肾阳虚之肾泄证，五更泄泻不思饮食食不消化或久泻不愈腹痛腰酸肢冷',analysis:'补骨脂为君温肾补火，肉豆蔻为臣温脾涩肠，五味子为佐敛肠止泻，吴茱萸为佐温中散寒',modifications:['泄泻甚加诃子赤石脂','腰酸加杜仲续断','气虚加人参白术'],modern_application:'慢性结肠炎过敏性肠炎五更泻',cautions:'湿热泄泻者不宜用'},
    {name:'完带汤',category:'固涩剂',source:'《傅青主女科》傅青主',composition:[{drug:'白术',dose:'30g'},{drug:'山药',dose:'30g'},{drug:'人参',dose:'6g'},{drug:'白芍',dose:'15g'},{drug:'车前子',dose:'9g'},{drug:'苍术',dose:'9g'},{drug:'甘草',dose:'3g'},{drug:'陈皮',dose:'2g'},{drug:'黑芥穗',dose:'2g'},{drug:'柴胡',dose:'2g'}],efficacy:'补脾疏肝，化湿止带',indications:'脾虚肝郁湿浊下注证，带下色白或淡黄清稀无臭绵绵不断面色㿠白倦怠便溏',analysis:'白术山药为君大剂量健脾益气止带，人参为臣补气，苍术陈皮燥湿行气，车前子利湿，柴胡白芍疏肝解郁，黑芥穗入血分祛风胜湿甘草调和',modifications:['带下量多加芡实金樱子','湿热加黄柏栀子','腰酸加杜仲续断'],modern_application:'阴道炎慢性盆腔炎宫颈糜烂',cautions:'湿热下注者不宜用'},

    // ── 经方加减 ──
    {name:'桂枝茯苓丸',category:'理血剂',source:'《金匮要略》张仲景',composition:[{drug:'桂枝',dose:'9g'},{drug:'茯苓',dose:'9g'},{drug:'牡丹皮',dose:'9g'},{drug:'赤芍',dose:'9g'},{drug:'桃仁',dose:'9g'}],efficacy:'活血化瘀，缓消癥块',indications:'瘀阻胞宫证，妇人宿有癥块妊娠漏下不止或胎动不安血色紫黑晦暗腹痛拒按',analysis:'桂枝为君温通血脉，桃仁丹皮为臣活血化瘀消癥，赤芍为佐活血和血，茯苓为佐渗湿健脾',modifications:['痛经加当归川芎','癥块加三棱莪术','出血加三七茜草'],modern_application:'子宫肌瘤卵巢囊肿子宫内膜异位症盆腔炎',cautions:'孕妇慎用'},
    {name:'大补阴丸',category:'补益剂',source:'《丹溪心法》朱丹溪',composition:[{drug:'熟地黄',dose:'120g'},{drug:'龟板',dose:'120g'},{drug:'黄柏',dose:'80g'},{drug:'知母',dose:'80g'}],efficacy:'滋阴降火',indications:'阴虚火旺证，骨蒸潮热盗汗遗精咳嗽咯血心烦易怒足膝疼热',analysis:'熟地龟板为君滋阴潜阳，黄柏知母为臣清热泻火滋阴，猪脊髓为佐填精补髓',modifications:['遗精加芡实莲须','咳血加白及仙鹤草','热甚加地骨皮银柴胡'],modern_application:'甲亢糖尿病肺结核更年期综合征',cautions:'脾胃虚寒者慎用'},
    {name:'增液汤',category:'治燥剂',source:'《温病条辨》吴鞠通',composition:[{drug:'玄参',dose:'30g'},{drug:'麦冬',dose:'24g'},{drug:'生地黄',dose:'24g'}],efficacy:'增液润燥',indications:'阳明温病津液不足证，大便秘结口渴唇干舌干',analysis:'玄参为君滋阴清热生津，麦冬为臣养阴润燥生津，生地为佐滋阴清热',modifications:['便秘甚加大黄芒硝（增液承气汤）','阴虚甚加沙参玉竹','热甚加栀子丹皮'],modern_application:'便秘口腔干燥综合征糖尿病',cautions:'湿邪偏盛者不宜用'},
    {name:'安宫牛黄丸',category:'开窍剂',source:'《温病条辨》吴鞠通',composition:[{drug:'牛黄',dose:'30g'},{drug:'郁金',dose:'30g'},{drug:'犀角',dose:'30g'},{drug:'黄连',dose:'30g'},{drug:'朱砂',dose:'30g'},{drug:'梅片',dose:'7.5g'},{drug:'麝香',dose:'7.5g'},{drug:'真珠',dose:'15g'},{drug:'栀子',dose:'30g'},{drug:'雄黄',dose:'30g'},{drug:'黄芩',dose:'30g'}],efficacy:'清热解毒，豁痰开窍',indications:'邪热内陷心包证，高热烦躁神昏谵语中风昏迷小儿惊厥',analysis:'牛黄为君清心解毒豁痰开窍，麝香为臣芳香开窍，犀角黄连黄芩栀子清热解毒，朱砂珍珠镇心安神冰片郁金芳香辟秽',modifications:['热甚加紫雪丹','痰盛加至宝丹','抽搐加羚羊角钩藤'],modern_application:'脑炎脑膜炎脑出血败血症高热昏迷',cautions:'孕妇禁用虚寒证不宜用'},
    {name:'达原饮',category:'清热剂',source:'《温疫论》吴又可',composition:[{drug:'槟榔',dose:'6g'},{drug:'厚朴',dose:'3g'},{drug:'草果',dose:'1.5g'},{drug:'知母',dose:'3g'},{drug:'芍药',dose:'3g'},{drug:'黄芩',dose:'3g'},{drug:'甘草',dose:'1.5g'}],efficacy:'开达膜原，辟秽化浊',indications:'瘟疫或疟疾邪伏膜原证，憎寒壮热发无定时胸闷呕恶头痛烦躁脉弦数',analysis:'槟榔为君破膜原之邪，厚朴草果为臣行气燥湿辟秽化浊，知母芍药滋阴和血黄芩清热，甘草调和',modifications:['热甚加栀子连翘','湿重加藿香苍术','呕吐加半夏生姜'],modern_application:'疟疾流感急性传染病',cautions:'阴虚火旺者不宜用'},
    {name:'防风通圣散',category:'解表剂',source:'《宣明论方》刘完素',composition:[{drug:'防风',dose:'等分'},{drug:'荆芥',dose:'等分'},{drug:'连翘',dose:'等分'},{drug:'麻黄',dose:'等分'},{drug:'薄荷',dose:'等分'},{drug:'川芎',dose:'等分'},{drug:'当归',dose:'等分'},{drug:'白芍',dose:'等分'},{drug:'白术',dose:'等分'},{drug:'栀子',dose:'等分'},{drug:'大黄',dose:'等分'},{drug:'芒硝',dose:'等分'},{drug:'石膏',dose:'等分'},{drug:'黄芩',dose:'等分'},{drug:'桔梗',dose:'等分'},{drug:'甘草',dose:'等分'},{drug:'滑石',dose:'等分'}],efficacy:'疏风解表，泻热通便',indications:'风热壅盛大便秘结证，憎寒壮热头目昏眩目赤睛痛口苦口干咽喉不利胸膈痞满咳嗽呕恶大便秘结',analysis:'防风荆芥麻黄薄荷疏风解表，大黄芒硝泄热通便栀子滑石清热利湿，黄芩石膏清肺胃之热，川芎当归白芍养血和血白术健脾',modifications:['便秘甚重用大黄芒硝','热甚重用石膏黄芩','咳嗽加杏仁贝母'],modern_application:'感冒便秘荨麻疹湿疹肥胖症',cautions:'孕妇慎用体虚者不宜用'},
    {name:'实脾散',category:'祛湿剂',source:'《重订严氏济生方》严用和',composition:[{drug:'厚朴',dose:'6g'},{drug:'白术',dose:'6g'},{drug:'木瓜',dose:'6g'},{drug:'木香',dose:'6g'},{drug:'草果仁',dose:'6g'},{drug:'大腹子',dose:'6g'},{drug:'附子',dose:'6g'},{drug:'白茯苓',dose:'6g'},{drug:'干姜',dose:'6g'},{drug:'甘草',dose:'3g'}],efficacy:'温阳健脾，行气利水',indications:'脾肾阳虚水气内停证，身半以下肿甚手足不温口中不渴胸腹胀满大便溏薄舌苔白腻',analysis:'附子干姜为君温阳化气，白术茯苓为臣健脾渗湿，厚朴木香大腹子草果行气化湿，木瓜和胃化湿甘草调和',modifications:['肿甚加车前子泽泻','气虚加人参黄芪','寒甚加肉桂'],modern_application:'慢性肾炎心源性肝硬化腹水',cautions:'阳盛有热者不宜用'},
    {name:'导赤散',category:'清热剂',source:'《小儿药证直诀》钱乙',composition:[{drug:'生地黄',dose:'6g'},{drug:'木通',dose:'6g'},{drug:'生甘草梢',dose:'6g'}],efficacy:'清心利水养阴',indications:'心经热盛证，心胸烦热口渴面赤口舌生疮或心热移于小肠小便赤涩',analysis:'生地为君凉血滋阴，木通为臣清心降火利水，甘草梢为佐清热解毒直达茎中',modifications:['心火甚加黄连栀子','小便涩加竹叶车前子','口疮加金银花连翘'],modern_application:'口腔溃疡尿路感染小儿夜啼',cautions:'脾胃虚寒者慎用'},
    {name:'泻白散',category:'清热剂',source:'《小儿药证直诀》钱乙',composition:[{drug:'地骨皮',dose:'30g'},{drug:'桑白皮',dose:'30g'},{drug:'甘草',dose:'3g'}],efficacy:'清泻肺热，止咳平喘',indications:'肺热喘咳证，气喘咳嗽皮肤蒸热日晡尤甚舌红苔黄',analysis:'桑白皮为君泻肺平喘，地骨皮为臣清肺中伏火，甘草粳米为佐养胃和中',modifications:['喘甚加葶苈子苏子','热甚加黄芩知母','咳血加白及侧柏叶'],modern_application:'小儿肺炎支气管炎百日咳',cautions:'风寒咳嗽者不宜用'},
    {name:'苇茎汤',category:'清热剂',source:'《备急千金要方》孙思邈',composition:[{drug:'苇茎',dose:'60g'},{drug:'薏苡仁',dose:'30g'},{drug:'瓜瓣',dose:'24g'},{drug:'桃仁',dose:'9g'}],efficacy:'清肺化痰，逐瘀排脓',indications:'肺痈证，咳嗽痰多腥臭或脓血胸痛肌肤甲错',analysis:'苇茎为君清肺泄热，薏苡仁为臣清热排脓，瓜瓣清热化痰桃仁活血化瘀',modifications:['脓多加金银花连翘','胸痛加郁金乳香','咳血加白及仙鹤草'],modern_application:'肺脓肿支气管扩张肺炎',cautions:'孕妇慎用'}
  ],

  // ═══════════════════════════════════════════
  // 医学典籍（24部）
  // ═══════════════════════════════════════════
  classics: [
    {title:'《黄帝内经》',author:'佚名（多人编撰）',era:'战国至西汉',category:'经典',significance:'中医理论体系奠基之作，包括《素问》《灵枢》各81篇',key_content:'阴阳五行学说、藏象经络理论、病因病机、诊法治则、养生防病、运气学说。确立"整体观念"和"辨证论治"两大核心原则。',famous_formulas:['半夏秫米汤','四乌贼骨一藘茹丸','生铁落饮','兰草汤']},
    {title:'《伤寒论》',author:'张仲景',era:'东汉',category:'经典',significance:'确立六经辨证体系，被誉为方书之祖',key_content:'397条原文113方，六经（太阳阳明少阳太阴少阴厥阴）辨证论治，创立麻黄汤桂枝汤小柴胡汤白虎汤承气汤等经典方剂。',famous_formulas:['麻黄汤','桂枝汤','小柴胡汤','白虎汤','大承气汤','四逆汤','真武汤','乌梅丸']},
    {title:'《金匮要略》',author:'张仲景',era:'东汉',category:'临床',significance:'内科杂病辨证论治的经典著作',key_content:'25篇262方，论述内妇科杂病，包括中风历节血痹虚劳肺痈胸痹痰饮水气黄疸等病证的辨证施治。',famous_formulas:['肾气丸','黄芪桂枝五物汤','苓桂术甘汤','桂枝茯苓丸','胶艾汤','大柴胡汤']},
    {title:'《温病条辨》',author:'吴鞠通',era:'清朝',category:'温病',significance:'创立三焦辨证体系，温病学集大成之作',key_content:'创立三焦辨证，分温病为上中下三焦论治。载方208首，包括银翘散桑菊饮清营汤安宫牛黄丸等著名方剂。',famous_formulas:['银翘散','桑菊饮','清营汤','安宫牛黄丸','增液汤','三仁汤','新加坡牛黄散']},
    {title:'《本草纲目》',author:'李时珍',era:'明朝',category:'本草',significance:'本草学集大成之作，收药1892种附方11096首',key_content:'52卷190万字，分16部60类。收药物1892种，插图1109幅，附方11096首。纠正前人本草错误，详述药物产地性味主治。',famous_formulas:[]},
    {title:'《千金要方》',author:'孙思邈',era:'唐朝',category:'方书',significance:'中国最早的临床百科全书，载方5300余首',key_content:'30卷232门，包括医学总论、妇人方、少小婴孺方、七窍病、风毒脚气、诸风、伤寒、脏腑病论等。首列"大医精诚"论医德。',famous_formulas:['独活寄生汤','苇茎汤','温胆汤','犀角地黄汤','孔圣枕中丹']},
    {title:'《千金翼方》',author:'孙思邈',era:'唐朝',category:'方书',significance:'《千金要方》的补充，载方2000余首',key_content:'30卷，补充《千金要方》未备，包括药录纂要、本草、妇人、伤寒、小儿、养性、辟谷、退居、补益、中风等。',famous_formulas:[]},
    {title:'《外台秘要》',author:'王焘',era:'唐朝',category:'方书',significance:'整理保存唐以前医籍的重要文献',key_content:'40卷1104门，收方6000余首。引录前人医书60余种，多已佚失，赖此书保存部分内容。',famous_formulas:[]},
    {title:'《太平惠民和剂局方》',author:'太平惠民和剂局编',era:'宋朝',category:'方书',significance:'世界上最早的由国家颁布的药典方书',key_content:'10卷14门，收方788首。多为丸散膏丹成药，便于应用。四君子汤四物汤逍遥散藿香正气散等名方出此书。',famous_formulas:['四君子汤','四物汤','逍遥散','藿香正气散','平胃散','五苓散','川芎茶调散']},
    {title:'《三因极一病证方论》',author:'陈言',era:'宋朝',category:'方书',significance:'创立三因学说（内因外因不内外因）',key_content:'18卷，分180门，收方1500余首。以三因统论诸病，对病因学有重要贡献。',famous_formulas:[]},
    {title:'《儒门事亲》',author:'张从正',era:'金朝',category:'临床',significance:'攻下派代表作，倡汗吐下三法攻邪',key_content:'15卷，论述三法（汗吐下）攻邪理论。认为"邪去正安"，反对盲目进补。载有大量攻邪医案。',famous_formulas:['禹功散','导水丸','三圣散']},
    {title:'《脾胃论》',author:'李东垣',era:'金朝',category:'临床',significance:'补土派代表作，创"内伤脾胃百病由生"理论',key_content:'3卷，论述脾胃为后天之本，创补中益气汤升阳益胃汤等方。甘温除热法为独创。',famous_formulas:['补中益气汤','升阳益胃汤','清胃散','当归补血汤']},
    {title:'《丹溪心法》',author:'朱丹溪',era:'元朝',category:'临床',significance:'滋阴派代表作，倡"阳常有余阴常不足"',key_content:'5卷，论阴阳五行、脏腑、气血、痰郁火等病理。创大补阴丸越鞠丸保和丸二妙散等方。六郁理论影响深远。',famous_formulas:['大补阴丸','越鞠丸','保和丸','二妙散']},
    {title:'《景岳全书》',author:'张景岳',era:'明朝',category:'临床',significance:'温补派代表作，倡"阳非有余阴常不足"',key_content:'64卷，分16种。论阴阳精气、脏腑、虚实寒热、脉法、伤寒温疫、杂病、妇人小儿等。创左归丸右归丸等方。',famous_formulas:['左归丸','右归丸','金水六君煎','玉女煎','济川煎']},
    {title:'《温疫论》',author:'吴又可',era:'明朝',category:'温病',significance:'第一部温疫专著，创"戾气"学说',key_content:'2卷，论述温疫由"戾气"引起，经口鼻侵入人体。创达原饮等方。比西方发现传染病早200余年。',famous_formulas:['达原饮','三消饮']},
    {title:'《傅青主女科》',author:'傅青主',era:'清朝',category:'妇科',significance:'妇科经典著作，方药简而效宏',key_content:'2卷，论述带下血崩经水先期经水后期等妇产科诸病。方剂多用量大力专，至今为妇科常用。',famous_formulas:['完带汤','清海丸','定经汤','生化汤']},
    {title:'《医林改错》',author:'王清任',era:'清朝',category:'临床',significance:'活血化瘀代表作，纠正前人解剖错误',key_content:'2卷，论述脏腑解剖，纠正前人错误。创五逐瘀汤系列和补阳还五汤，对活血化瘀法贡献巨大。',famous_formulas:['血府逐瘀汤','补阳还五汤','膈下逐瘀汤','少腹逐瘀汤','身痛逐瘀汤']},
    {title:'《医学衷中参西录》',author:'张锡纯',era:'近现代',category:'临床',significance:'中西汇通派代表作，衷中参西',key_content:'30卷，融合中西医理论，创镇肝熄风汤活络效灵丹等方。以西药解中药药理，开中西医结合先河。',famous_formulas:['镇肝熄风汤','活络效灵丹','玉液汤','升陷汤']},
    {title:'《针灸甲乙经》',author:'皇甫谧',era:'西晋',category:'针灸',significance:'最早的针灸学专著',key_content:'12卷128篇，系统整理经络穴位，记载349个穴位，论述针灸方法及各病证针灸治疗。',famous_formulas:[]},
    {title:'《针灸大成》',author:'杨继洲',era:'明朝',category:'针灸',significance:'针灸学集大成之作',key_content:'10卷，汇集历代针灸理论，记载359个穴位，详述针法灸法及各科病证针灸治疗。',famous_formulas:[]},
    {title:'《诸病源候论》',author:'巢元方',era:'隋朝',category:'经典',significance:'第一部病因病理学专著',key_content:'50卷67门1739候，论述各病病因病机证候，不载方药，但引用大量"导引法"（养生体操）。',famous_formulas:[]},
    {title:'《脉经》',author:'王叔和',era:'西晋',category:'经典',significance:'第一部脉学专著',key_content:'10卷，系统整理24种脉象，论述寸关尺三部脉法及各病脉象。为中医诊断学奠基。',famous_formulas:[]},
    {title:'《小儿药证直诀》',author:'钱乙',era:'北宋',category:'儿科',significance:'第一部儿科专著，创小儿五脏辨证',key_content:'3卷，论述小儿生理病理特点，创小儿五脏辨证体系。六味地黄丸泻白散导赤散等名方出此书。',famous_formulas:['六味地黄丸','泻白散','导赤散','七味白术散']},
    {title:'《血证论》',author:'唐宗海',era:'清朝',category:'临床',significance:'血证治疗专著，创治血四法',key_content:'8卷，论述各种出血病证的病因病机和治疗。提出止血、消瘀、宁血、补血四法，尝试中西汇通。',famous_formulas:[]}
  ],

  // ═══════════════════════════════════════════
  // 方剂分类索引
  // ═══════════════════════════════════════════
  formulaCategories: {
    '解表剂': ['麻黄汤','桂枝汤','银翘散','桑菊饮','九味羌活汤','防风通圣散'],
    '清热剂': ['白虎汤','黄连解毒汤','龙胆泻肝汤','清胃散','葛根芩连汤','普济消毒饮','导赤散','泻白散','苇茎汤','达原饮'],
    '泻下剂': ['大承气汤','温脾汤'],
    '和解剂': ['小柴胡汤','逍遥散','半夏泻心汤'],
    '温里剂': ['理中丸','四逆汤','当归四逆汤','阳和汤','实脾散'],
    '补益剂': ['四君子汤','参苓白术散','补中益气汤','四物汤','归脾汤','六味地黄丸','肾气丸','左归丸','右归丸','炙甘草汤','生脉散','玉屏风散','大补阴丸'],
    '安神剂': ['酸枣仁汤','天王补心丹','甘麦大枣汤'],
    '开窍剂': ['安宫牛黄丸'],
    '理气剂': ['越鞠丸','半夏厚朴汤','枳实薤白桂枝汤','苏子降气汤'],
    '理血剂': ['血府逐瘀汤','补阳还五汤','十灰散','小蓟饮子','桂枝茯苓丸'],
    '祛湿剂': ['平胃散','藿香正气散','三仁汤','茵陈蒿汤','五苓散','真武汤','独活寄生汤','实脾散'],
    '祛痰剂': ['二陈汤','温胆汤','半夏白术天麻汤'],
    '消食剂': ['保和丸','健脾丸'],
    '治风剂': ['川芎茶调散','镇肝熄风汤','天麻钩藤饮'],
    '治燥剂': ['杏苏散','清燥救肺汤','百合固金汤','增液汤'],
    '固涩剂': ['四神丸','完带汤']
  },

  // ═══════════════════════════════════════════
  // 搜索工具函数
  // ═══════════════════════════════════════════
  searchDoctors: function(keyword) {
    let kb = window.TCM_FAMOUS_FORMULAS_KB;
    return kb.doctors.filter(function(d) {
      return d.name.indexOf(keyword) >= 0 ||
             d.era.indexOf(keyword) >= 0 ||
             d.title.indexOf(keyword) >= 0 ||
             d.specialties.some(function(s) { return s.indexOf(keyword) >= 0; });
    });
  },

  searchFormulas: function(keyword) {
    let kb = window.TCM_FAMOUS_FORMULAS_KB;
    return kb.formulas.filter(function(f) {
      return f.name.indexOf(keyword) >= 0 ||
             f.efficacy.indexOf(keyword) >= 0 ||
             f.indications.indexOf(keyword) >= 0 ||
             f.source.indexOf(keyword) >= 0;
    });
  },

  getFormulasByCategory: function(category) {
    let kb = window.TCM_FAMOUS_FORMULAS_KB;
    return kb.formulas.filter(function(f) { return f.category === category; });
  },

  getDoctorByName: function(name) {
    let kb = window.TCM_FAMOUS_FORMULAS_KB;
    return kb.doctors.find(function(d) { return d.name === name; });
  },

  getFormulaByName: function(name) {
    let kb = window.TCM_FAMOUS_FORMULAS_KB;
    return kb.formulas.find(function(f) { return f.name === name; });
  }
};
})();
