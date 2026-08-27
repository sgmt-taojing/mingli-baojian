// gold-cases-v4.js · 黄金 case 扩充版（40 条）
// 4 大类：外感病 G081-G090 / 内伤病 G091-G100 / 妇儿病 G101-G110 / 急症 G111-G120
// 来源：中医内科学/中医妇科学/中医儿科学/中医急症学教材 + 临床路径指南

module.exports = [
  // ==================== 外感病 10 条 ====================
  {
    "case_id": "G081",
    "complaint": "感冒",
    "symptoms": ["恶寒重", "发热轻", "无汗", "头痛", "身痛", "鼻塞", "咳嗽", "痰白稀"],
    "expected": { "syndrome": "风寒表实", "formula": "麻黄汤" }
  },
  {
    "case_id": "G082",
    "complaint": "感冒",
    "symptoms": ["发热", "汗出", "恶风", "鼻鸣", "干呕"],
    "expected": { "syndrome": "风寒表虚", "formula": "桂枝汤" }
  },
  {
    "case_id": "G083",
    "complaint": "感冒",
    "symptoms": ["发热重", "微恶风", "咽痛", "口渴", "咳嗽", "痰黄"],
    "expected": { "syndrome": "风热表证", "formula": "银翘散" }
  },
  {
    "case_id": "G084",
    "complaint": "感冒",
    "symptoms": ["夏季发病", "发热", "恶寒", "无汗", "头重", "胸闷", "呕吐", "腹泻"],
    "expected": { "syndrome": "暑湿感冒", "formula": "新加香薷饮" }
  },
  {
    "case_id": "G085",
    "complaint": "感冒",
    "symptoms": ["恶寒", "发热", "头重如裹", "身重", "关节酸痛"],
    "expected": { "syndrome": "风湿感冒", "formula": "羌活胜湿汤" }
  },
  {
    "case_id": "G086",
    "complaint": "感冒",
    "symptoms": ["秋季发病", "干咳", "咽干", "口鼻干燥", "微发热"],
    "expected": { "syndrome": "温燥伤肺", "formula": "桑杏汤" }
  },
  {
    "case_id": "G087",
    "complaint": "咳嗽",
    "symptoms": ["咳嗽", "痰白稀", "咽痒", "微恶风"],
    "expected": { "syndrome": "风寒袭肺", "formula": "止嗽散" }
  },
  {
    "case_id": "G088",
    "complaint": "头痛",
    "symptoms": ["头痛", "恶风", "鼻塞", "前额痛"],
    "expected": { "syndrome": "风邪头痛", "formula": "川芎茶调散" }
  },
  {
    "case_id": "G089",
    "complaint": "发热",
    "symptoms": ["寒热往来", "胸胁苦满", "心烦", "口苦", "咽干"],
    "expected": { "syndrome": "少阳证", "formula": "小柴胡汤" }
  },
  {
    "case_id": "G090",
    "complaint": "咽痛",
    "symptoms": ["咽痛", "口干", "喉红", "微发热"],
    "expected": { "syndrome": "风热咽痛", "formula": "玄麦甘桔汤" }
  },

  // ==================== 内伤病 10 条 ====================
  {
    "case_id": "G091",
    "complaint": "胁痛",
    "symptoms": ["胁肋胀痛", "情志抑郁", "善太息", "纳呆", "便溏"],
    "expected": { "syndrome": "肝郁脾虚", "formula": "逍遥散" }
  },
  {
    "case_id": "G092",
    "complaint": "心悸",
    "symptoms": ["心悸", "健忘", "失眠", "纳呆", "乏力", "面色萎黄"],
    "expected": { "syndrome": "心脾两虚", "formula": "归脾汤" }
  },
  {
    "case_id": "G093",
    "complaint": "胁痛",
    "symptoms": ["胁肋隐痛", "口干", "咽燥", "眩晕", "腰膝酸软"],
    "expected": { "syndrome": "肝肾阴虚", "formula": "一贯煎" }
  },
  {
    "case_id": "G094",
    "complaint": "泄泻",
    "symptoms": ["黎明泄泻", "腹痛", "肢冷", "腰膝酸软"],
    "expected": { "syndrome": "脾肾阳虚", "formula": "四神丸" }
  },
  {
    "case_id": "G095",
    "complaint": "心悸",
    "symptoms": ["心悸", "气短", "自汗", "口干", "乏力"],
    "expected": { "syndrome": "气阴两虚", "formula": "生脉散" }
  },
  {
    "case_id": "G096",
    "complaint": "眩晕",
    "symptoms": ["眩晕", "头重", "胸闷", "痰多", "纳呆"],
    "expected": { "syndrome": "痰湿内阻", "formula": "二陈汤" }
  },
  {
    "case_id": "G097",
    "complaint": "胸痛",
    "symptoms": ["胸痛", "刺痛", "固定", "舌紫暗", "脉涩"],
    "expected": { "syndrome": "心血瘀阻", "formula": "血府逐瘀汤" }
  },
  {
    "case_id": "G098",
    "complaint": "胁痛",
    "symptoms": ["胁痛", "口苦", "急躁", "目赤", "小便黄"],
    "expected": { "syndrome": "肝胆湿热", "formula": "龙胆泻肝汤" }
  },
  {
    "case_id": "G099",
    "complaint": "潮热",
    "symptoms": ["潮热", "盗汗", "五心烦热", "口干", "腰膝酸软"],
    "expected": { "syndrome": "阴虚火旺", "formula": "知柏地黄丸" }
  },
  {
    "case_id": "G100",
    "complaint": "畏寒",
    "symptoms": ["畏寒", "肢冷", "腰膝酸冷", "小便清长", "夜尿多"],
    "expected": { "syndrome": "肾阳虚衰", "formula": "金匮肾气丸" }
  },

  // ==================== 妇儿病 10 条 ====================
  {
    "case_id": "G101",
    "complaint": "月经不调",
    "symptoms": ["月经后期", "量少", "色暗有块", "小腹冷痛", "畏寒"],
    "expected": { "syndrome": "冲任虚寒", "formula": "温经汤" }
  },
  {
    "case_id": "G102",
    "complaint": "痛经",
    "symptoms": ["经期小腹冷痛", "得热痛减", "经血暗紫有块"],
    "expected": { "syndrome": "寒凝血瘀", "formula": "少腹逐瘀汤" }
  },
  {
    "case_id": "G103",
    "complaint": "崩漏",
    "symptoms": ["非经期出血", "量多", "色淡质稀", "神疲", "气短"],
    "expected": { "syndrome": "气血两虚", "formula": "固本止崩汤" }
  },
  {
    "case_id": "G104",
    "complaint": "带下",
    "symptoms": ["带下色白", "清稀无臭", "神疲", "纳呆", "便溏"],
    "expected": { "syndrome": "脾虚湿盛", "formula": "完带汤" }
  },
  {
    "case_id": "G105",
    "complaint": "妊娠呕吐",
    "symptoms": ["孕后恶心呕吐", "食入即吐", "神疲", "嗜睡"],
    "expected": { "syndrome": "脾胃虚弱", "formula": "香砂六君子汤" }
  },
  {
    "case_id": "G106",
    "complaint": "产后恶露不绝",
    "symptoms": ["产后恶露过期不止", "量少色暗", "小腹冷痛"],
    "expected": { "syndrome": "产后血瘀", "formula": "生化汤" }
  },
  {
    "case_id": "G107",
    "complaint": "小儿厌食",
    "symptoms": ["食欲不振", "食少便多", "面色萎黄", "消瘦"],
    "expected": { "syndrome": "脾胃虚弱", "formula": "健脾丸" }
  },
  {
    "case_id": "G108",
    "complaint": "小儿疳积",
    "symptoms": ["消瘦", "面色无华", "毛发干枯", "食欲不振", "腹胀"],
    "expected": { "syndrome": "脾虚虫积", "formula": "肥儿丸" }
  },
  {
    "case_id": "G109",
    "complaint": "小儿遗尿",
    "symptoms": ["睡中遗尿", "醒后方觉", "面白肢冷", "小便清长"],
    "expected": { "syndrome": "肾气不固", "formula": "缩泉丸" }
  },
  {
    "case_id": "G110",
    "complaint": "小儿多动",
    "symptoms": ["多动不安", "注意力不集中", "五心烦热", "盗汗"],
    "expected": { "syndrome": "阴虚阳亢", "formula": "知柏地黄丸" }
  },

  // ==================== 急症 10 条 ====================
  {
    "case_id": "G111",
    "complaint": "高热",
    "symptoms": ["高热不退", "大汗", "大渴", "脉洪大"],
    "expected": { "syndrome": "阳明气分热盛", "formula": "白虎汤" }
  },
  {
    "case_id": "G112",
    "complaint": "昏迷",
    "symptoms": ["神昏", "高热", "谵语", "舌红绛"],
    "expected": { "syndrome": "热闭心包", "formula": "安宫牛黄丸" }
  },
  {
    "case_id": "G113",
    "complaint": "厥脱",
    "symptoms": ["四肢厥冷", "汗出", "面色苍白", "脉微欲绝"],
    "expected": { "syndrome": "阳气暴脱", "formula": "四逆加人参汤" }
  },
  {
    "case_id": "G114",
    "complaint": "中风",
    "symptoms": ["突然昏倒", "不省人事", "牙关紧闭", "两拳握固"],
    "expected": { "syndrome": "痰热闭窍", "formula": "至宝丹" }
  },
  {
    "case_id": "G115",
    "complaint": "中风",
    "symptoms": ["突然昏倒", "目合口张", "手撒肢冷", "汗多"],
    "expected": { "syndrome": "元气衰微", "formula": "参附汤" }
  },
  {
    "case_id": "G116",
    "complaint": "心悸",
    "symptoms": ["心悸怔忡", "气短", "脉结代"],
    "expected": { "syndrome": "气血不足", "formula": "炙甘草汤" }
  },
  {
    "case_id": "G117",
    "complaint": "腹痛",
    "symptoms": ["腹痛拒按", "大便秘结", "潮热", "舌红苔黄燥"],
    "expected": { "syndrome": "阳明腑实", "formula": "大承气汤" }
  },
  {
    "case_id": "G118",
    "complaint": "喘证",
    "symptoms": ["喘咳", "痰多色黄", "胸膈满闷"],
    "expected": { "syndrome": "痰热壅肺", "formula": "定喘汤" }
  },
  {
    "case_id": "G119",
    "complaint": "咯血",
    "symptoms": ["咯血", "血色鲜红", "烦躁", "口干"],
    "expected": { "syndrome": "血热妄行", "formula": "十灰散" }
  },
  {
    "case_id": "G120",
    "complaint": "泄泻",
    "symptoms": ["急性腹泻", "肛门灼热", "腹痛", "泻下急迫"],
    "expected": { "syndrome": "湿热下注", "formula": "葛根芩连汤" }
  }
];
