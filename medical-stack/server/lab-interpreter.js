/**
 * 移植自 tcm-agent server/lab-interpreter.js（tcm HEAD dc2acb0，契约 v1.3.8 D9，2026-09-03 吸收）
 * 纪律：只适配不训练；命理合流仅限 8974 批注环节，本模块为纯医学域
 */
/**
 * D9 患者体检报告智能解读引擎（契约 v1.3.8）
 * 定位：患者端「看得懂」的检验报告解读——白话释义、严重度、生活调理、就诊提示、中医佐证
 * 复用 api-server 的 LAB_PANEL（56 项 12 类参考区间）与 analyzeLabs（判读引擎），本模块不重复定义参考值
 * 纪律：仅供患者理解与就诊参考，不构成诊断（ADR-009 机构版话术）；危急值一律引导急诊
 */

// ── 别名归一表：报告单上的中英文写法 → LAB_PANEL 标准名 ──
// initials 为拼音首字母（前端录入联想用，不参与文本解析）
const LAB_ALIAS = [
  { key: '白细胞', aliases: ['白细胞', '白细胞计数', 'WBC'], initials: 'bxb' },
  { key: '红细胞', aliases: ['红细胞', '红细胞计数', 'RBC'], initials: 'hxb' },
  { key: '血红蛋白', aliases: ['血红蛋白', '血色素', 'HGB', 'Hb', 'HB'], initials: 'xhdb' },
  { key: '红细胞压积', aliases: ['红细胞压积', '红细胞比容', '血细胞比容', 'HCT'], initials: 'hxbyj' },
  { key: 'MCV', aliases: ['MCV', '平均红细胞体积', '平均红细胞容积'], initials: 'mcv' },
  { key: 'MCH', aliases: ['MCH', '平均红细胞血红蛋白量'], initials: 'mch' },
  { key: 'MCHC', aliases: ['MCHC', '平均红细胞血红蛋白浓度'], initials: 'mchc' },
  { key: '血小板', aliases: ['血小板', '血小板计数', 'PLT'], initials: 'xxb' },
  { key: '中性粒细胞%', aliases: ['中性粒细胞%', '中性粒细胞百分比', '中性粒细胞比率', '中性粒细胞比例', 'NEUT%', 'NE%'], initials: 'zxlxb' },
  { key: '淋巴细胞%', aliases: ['淋巴细胞%', '淋巴细胞百分比', '淋巴细胞比率', '淋巴细胞比例', 'LYMPH%', 'LY%'], initials: 'lbxb' },
  { key: '嗜酸性粒细胞%', aliases: ['嗜酸性粒细胞%', '嗜酸性粒细胞百分比', '嗜酸性粒细胞比率', '嗜酸细胞%', 'EO%'], initials: 'ssxlxb' },
  { key: '尿蛋白', aliases: ['尿蛋白', '尿蛋白定性', 'PRO'], initials: 'ndb' },
  { key: '尿糖', aliases: ['尿糖', '尿葡萄糖', '尿GLU'], initials: 'nt' },
  { key: '尿潜血', aliases: ['尿潜血', '尿隐血', 'BLD'], initials: 'nqx' },
  { key: '尿白细胞', aliases: ['尿白细胞', '尿白细胞酯酶', 'LEU'], initials: 'nbxb' },
  { key: '尿酮体', aliases: ['尿酮体', '酮体', 'KET'], initials: 'ntt' },
  { key: '谷丙转氨酶', aliases: ['谷丙转氨酶', '丙氨酸氨基转移酶', '谷丙', 'ALT'], initials: 'gbjam' },
  { key: '谷草转氨酶', aliases: ['谷草转氨酶', '天门冬氨酸氨基转移酶', '天冬氨酸氨基转移酶', '谷草', 'AST'], initials: 'gcjam' },
  { key: 'γ-谷氨酰转肽酶', aliases: ['γ-谷氨酰转肽酶', '谷氨酰转肽酶', 'γ-谷氨酰转移酶', 'GGT', 'γ-GT', 'r-GT'], initials: 'gaxztbm' },
  { key: '碱性磷酸酶', aliases: ['碱性磷酸酶', 'ALP'], initials: 'jxlsm' },
  { key: '总胆红素', aliases: ['总胆红素', 'TBIL', 'T-Bil'], initials: 'zdhs' },
  { key: '直接胆红素', aliases: ['直接胆红素', '结合胆红素', 'DBIL', 'D-Bil'], initials: 'zjdhs' },
  { key: '白蛋白', aliases: ['白蛋白', '血清白蛋白', 'ALB'], initials: 'bdb' },
  { key: '肌酐', aliases: ['肌酐', '血肌酐', 'CREA', 'Cr', 'CR'], initials: 'jg' },
  { key: '尿素氮', aliases: ['尿素氮', '尿素', 'BUN', 'UREA'], initials: 'nsd' },
  { key: '尿酸', aliases: ['尿酸', '血尿酸', 'UA'], initials: 'ns' },
  { key: '估算肾小球滤过率', aliases: ['估算肾小球滤过率', '肾小球滤过率', 'eGFR', 'EGFR'], initials: 'gsqlgl' },
  { key: '总胆固醇', aliases: ['总胆固醇', '胆固醇', 'TC', 'CHOL', 'CHO'], initials: 'zdgc' },
  { key: '甘油三酯', aliases: ['甘油三酯', '甘油三脂', 'TG'], initials: 'gysz' },
  { key: '低密度脂蛋白', aliases: ['低密度脂蛋白', '低密度脂蛋白胆固醇', 'LDL-C', 'LDL'], initials: 'dmdzdb' },
  { key: '高密度脂蛋白', aliases: ['高密度脂蛋白', '高密度脂蛋白胆固醇', 'HDL-C', 'HDL'], initials: 'gmdzdb' },
  { key: '空腹血糖', aliases: ['空腹血糖', '空腹葡萄糖', '血糖', 'FPG', 'GLU'], initials: 'kfxt' },
  { key: '餐后2小时血糖', aliases: ['餐后2小时血糖', '餐后两小时血糖', '餐后血糖', '2hPG', '2HPG'], initials: 'chxt' },
  { key: '糖化血红蛋白', aliases: ['糖化血红蛋白', '糖化', 'HbA1c', 'HBA1C', 'A1C'], initials: 'thxhdb' },
  { key: '促甲状腺激素', aliases: ['促甲状腺激素', '促甲状腺素', 'TSH'], initials: 'cjzxjs' },
  { key: '游离T3', aliases: ['游离T3', '游离三碘甲状腺原氨酸', 'FT3'], initials: 'ylt3' },
  { key: '游离T4', aliases: ['游离T4', '游离甲状腺素', 'FT4'], initials: 'ylt4' },
  { key: '肌酸激酶', aliases: ['肌酸激酶', '肌酸磷酸激酶', 'CK'], initials: 'jsjm' },
  { key: '肌酸激酶同工酶', aliases: ['肌酸激酶同工酶', '肌酸激酶MB同工酶', 'CK-MB', 'CKMB'], initials: 'jsjmtgm' },
  { key: '肌钙蛋白I', aliases: ['肌钙蛋白I', '肌钙蛋白', 'cTnI', 'CTNI', 'TNI'], initials: 'jgdb' },
  { key: 'BNP', aliases: ['BNP', '脑钠肽', 'B型钠尿肽', '脑利钠肽'], initials: 'bnp' },
  { key: '血钾', aliases: ['血钾', '血清钾', '钾', 'K+', 'K'], initials: 'xj' },
  { key: '血钠', aliases: ['血钠', '血清钠', '钠', 'Na+', 'Na'], initials: 'xn' },
  { key: '血钙', aliases: ['血钙', '血清钙', '钙', 'Ca'], initials: 'xg' },
  { key: 'C反应蛋白', aliases: ['C反应蛋白', 'C-反应蛋白', 'CRP'], initials: 'cfydb' },
  { key: '超敏C反应蛋白', aliases: ['超敏C反应蛋白', '超敏CRP', '高敏C反应蛋白', 'hs-CRP', 'HSCRP', 'hsCRP'], initials: 'cmc' },
  { key: '血沉', aliases: ['血沉', '红细胞沉降率', 'ESR'], initials: 'xc' },
  { key: '降钙素原', aliases: ['降钙素原', 'PCT'], initials: 'jgtsy' },
  { key: 'D-二聚体', aliases: ['D-二聚体', 'D二聚体', 'D-Dimer', 'DD', 'DDI'], initials: 'dejt' },
  { key: '甲胎蛋白', aliases: ['甲胎蛋白', 'AFP'], initials: 'jtdb' },
  { key: '癌胚抗原', aliases: ['癌胚抗原', 'CEA'], initials: 'apky' },
  { key: 'CA125', aliases: ['CA125', 'CA-125', '糖类抗原125'], initials: 'ca125' },
  { key: 'CA199', aliases: ['CA199', 'CA-199', 'CA19-9', '糖类抗原199'], initials: 'ca199' },
  { key: 'PSA', aliases: ['PSA', 'tPSA', 'TPSA', '前列腺特异性抗原'], initials: 'psa' }
];

// ── 患者白话表：这是什么 / 异常怎么办 / 就诊时告诉医生什么 ──
const LAB_PLAIN = {
  '白细胞': { what: '身体的「防御部队」总数，反映有无感染或炎症', highAdvice: '常见于细菌感染、炎症或应激；伴发热、咳嗽、咽痛请及时就诊', lowAdvice: '抵抗力偏弱的信号；注意防感染、均衡营养，建议复查确认', ask: '近期有无发热、感染，或在服药物（部分药物会降低白细胞）' },
  '红细胞': { what: '运输氧气的「货车」数量', lowAdvice: '偏低常伴贫血；注意有无头晕乏力，配合血红蛋白一起判断', ask: '有无头晕、乏力、面色苍白' },
  '血红蛋白': { what: '血液携带氧气的核心蛋白，判断贫血的主指标', lowAdvice: '提示贫血：多吃红肉、动物肝脏、深色蔬菜；女性留意月经量，建议查铁蛋白明确原因', highAdvice: '常见于脱水、长期吸烟或高原居住；适量饮水后复查', ask: '有无头晕心悸、月经量多、黑便（消化道出血信号）' },
  '红细胞压积': { what: '红细胞在血液中的体积占比', lowAdvice: '与贫血相关，结合血红蛋白判断', highAdvice: '多见于血液浓缩（喝水少、出汗多），补水后复查', ask: '最近饮水量、有无腹泻呕吐' },
  'MCV': { what: '红细胞的平均大小，帮助判断贫血类型', lowAdvice: '偏小提示缺铁性贫血倾向，建议查铁蛋白', highAdvice: '偏大提示叶酸/维生素B12缺乏倾向，建议查叶酸、B12', ask: '是否长期素食、有无胃部手术史' },
  'MCH': { what: '每个红细胞平均带的血红蛋白量', lowAdvice: '与缺铁相关，配合 MCV、血红蛋白一起判断', ask: '同贫血相关病史' },
  'MCHC': { what: '红细胞内血红蛋白的平均浓度', lowAdvice: '提示低色素性贫血倾向（多为缺铁）', ask: '同贫血相关病史' },
  '血小板': { what: '止血凝血的「修补工」', lowAdvice: '偏低有出血倾向：避免磕碰、轻柔刷牙；若牙龈出血不止、皮肤瘀斑增多，请及时就医', highAdvice: '偏高多为炎症后的反应性升高，建议复查观察', ask: '有无牙龈出血、皮肤瘀点瘀斑、月经量异常' },
  '中性粒细胞%': { what: '抗细菌感染的「主力军」比例', highAdvice: '提示细菌感染倾向；结合有无发热、咽痛、咳嗽判断', lowAdvice: '需结合绝对值看，常见于病毒感染期', ask: '有无发热、咽痛、咳嗽咳痰' },
  '淋巴细胞%': { what: '抗病毒与免疫调节的「特种部队」比例', highAdvice: '常见于病毒感染（如感冒），多为自限性，注意休息多喝水', lowAdvice: '多见于急性感染期或免疫抑制状态', ask: '最近有无感冒、病毒感染' },
  '嗜酸性粒细胞%': { what: '与过敏和寄生虫相关的细胞比例', highAdvice: '提示过敏体质（鼻炎/哮喘/湿疹）或寄生虫可能；回想近期有无皮疹、打喷嚏、皮肤瘙痒', ask: '有无过敏史、皮疹、哮喘' },
  '尿蛋白': { what: '尿中是否漏出蛋白质，肾脏「滤网」功能信号', highAdvice: '阳性提示肾小球滤过异常可能；避免剧烈运动后复查，持续阳性请肾内科就诊', ask: '有无浮肿、泡沫尿、高血压、糖尿病史' },
  '尿糖': { what: '尿中是否出现葡萄糖', highAdvice: '阳性需警惕血糖过高，建议查空腹血糖和糖化血红蛋白', ask: '有无多饮、多尿、多食、体重下降' },
  '尿潜血': { what: '尿中是否有肉眼看不见的红细胞', highAdvice: '原因多样（结石/感染/肾脏问题）；女性避开经期复查，持续阳性请泌尿科就诊', ask: '有无腰痛、尿频尿痛、肉眼血尿' },
  '尿白细胞': { what: '尿中是否有炎症细胞', highAdvice: '提示尿路感染可能；多喝水，伴尿频尿急尿痛请就医', ask: '有无尿频、尿急、尿痛、发热' },
  '尿酮体': { what: '身体分解脂肪供能时的产物', highAdvice: '见于饥饿、剧烈减肥或血糖失控；糖尿病患者出现阳性需立即就医', ask: '是否在节食减肥、有无糖尿病' },
  '谷丙转氨酶': { what: '肝细胞损伤最敏感的「报警器」', highAdvice: '提示肝细胞受损：严格戒酒、避免熬夜、停用可疑伤肝药物和保健品，2~4 周复查；明显升高请消化科就诊', ask: '饮酒情况、在服药物（含中药/保健品）、有无乙肝丙肝病史' },
  '谷草转氨酶': { what: '存在于肝、心肌、肌肉的酶，需结合谷丙转氨酶判断来源', highAdvice: '与谷丙转氨酶同看：都高偏向肝损伤；单项明显升高需排查心脏/肌肉问题', ask: '同肝功能病史，有无胸闷、肌肉酸痛' },
  'γ-谷氨酰转肽酶': { what: '对酒精和胆汁淤积敏感的肝酶', highAdvice: '最常见于饮酒：戒酒 4 周后复查；伴黄疸、皮肤瘙痒请消化科就诊', ask: '饮酒量、有无皮肤巩膜发黄' },
  '碱性磷酸酶': { what: '与胆汁排泄和骨代谢相关的酶', highAdvice: '成人升高需排查胆道/骨骼问题；青少年生长期、孕妇可生理性升高', ask: '有无骨痛、黄疸、皮肤瘙痒' },
  '总胆红素': { what: '红细胞代谢的「废物」，升高表现为黄疸', highAdvice: '轻度升高且无症状常见于体质性黄疸（Gilbert 综合征），多无需处理；明显升高伴皮肤发黄请消化科就诊', ask: '有无皮肤/眼白发黄、尿色加深' },
  '直接胆红素': { what: '经肝脏处理后的胆红素，反映胆汁排泄是否通畅', highAdvice: '提示胆汁排泄不畅，建议腹部超声排查胆道问题', ask: '有无腹痛、黄疸、大便颜色变浅' },
  '白蛋白': { what: '肝脏合成的主要蛋白质，反映营养状况和肝功能', lowAdvice: '偏低提示营养不足或肝肾慢性消耗：加强优质蛋白（蛋、奶、鱼、瘦肉），并查明原因', ask: '近期食欲、体重变化、有无浮肿' },
  '肌酐': { what: '肌肉代谢废物，经肾脏排出，是肾功能核心指标', highAdvice: '提示肾功能减退：避免滥用止痛药和不明成分药物，控制好血压血糖，肾内科随诊评估', ask: '有无高血压、糖尿病、长期服药史' },
  '尿素氮': { what: '蛋白质代谢废物，与肌酐联合判断肾功能', highAdvice: '升高见于肾功能减退、脱水或高蛋白饮食；结合肌酐判断，适量饮水后复查', ask: '饮水量、蛋白摄入、有无浮肿' },
  '尿酸': { what: '嘌呤代谢产物，过高可致痛风和肾损伤', highAdvice: '低嘌呤饮食：少吃动物内脏、海鲜、浓肉汤，戒酒（尤其啤酒），每天饮水 2000ml 以上；反复关节红肿热痛请风湿科就诊', ask: '有无关节红肿热痛（尤其大脚趾）、饮酒与饮食习惯' },
  '估算肾小球滤过率': { what: '肾脏「工作效率」的综合评分', lowAdvice: '低于 60 提示慢性肾脏病可能，需肾内科规律随诊；60~89 结合其他指标观察', ask: '同肾功能相关病史' },
  '总胆固醇': { what: '血脂总量指标，动脉硬化的基础风险', highAdvice: '控油：少吃肥肉、动物内脏、油炸食品；增加膳食纤维和运动；明显升高请评估是否用药', ask: '心脑血管病家族史、饮食运动习惯' },
  '甘油三酯': { what: '与饮食关系最密切的血脂，「吃出来的指标」', highAdvice: '戒甜饮料和酒、减少精制主食、控油，4~12 周多可明显下降；超过 5.6 有急性胰腺炎风险，需尽快就医', ask: '饮酒、甜饮料、主食量' },
  '低密度脂蛋白': { what: '「坏胆固醇」，直接促进动脉斑块形成', highAdvice: '心脑血管病的核心干预目标：低脂饮食+规律运动；合并高血压/糖尿病者达标要求更严，请医生评估是否用药', ask: '有无高血压、糖尿病、吸烟、心脑血管病家族史' },
  '高密度脂蛋白': { what: '「好胆固醇」，血管的「清道夫」', lowAdvice: '偏低削弱血管保护：规律有氧运动（快走/游泳，每周 150 分钟）是最有效的提升方式', ask: '运动习惯、吸烟史' },
  '空腹血糖': { what: '禁食 8 小时后的血糖，糖尿病筛查主指标', highAdvice: '6.1~7.0 为糖尿病前期（干预黄金窗口）：减糖、减重、运动；≥7.0 请内分泌科确诊', lowAdvice: '低于 3.9 为低血糖：立即补充糖分（糖水/糖果）；反复发作需查明原因', ask: '有无多饮多尿、体重下降、糖尿病家族史' },
  '餐后2小时血糖': { what: '进餐后血糖回落能力，比空腹更早发现异常', highAdvice: '≥7.8 提示糖耐量异常，≥11.1 达糖尿病诊断界值；请内分泌科评估', ask: '同血糖相关病史' },
  '糖化血红蛋白': { what: '反映近 2~3 个月平均血糖的「金标准」', highAdvice: '6.0~6.5% 为糖尿病前期；≥6.5% 达糖尿病诊断标准；请内分泌科确诊并制定管理方案', ask: '同血糖相关病史' },
  '促甲状腺激素': { what: '大脑指挥甲状腺的「调度信号」，甲功最敏感指标', highAdvice: '升高提示甲减倾向：留意怕冷、乏力、体重增加、便秘；请内分泌科查 FT4 确认', lowAdvice: '降低提示甲亢倾向：留意心慌、手抖、多汗、消瘦；请内分泌科查 FT3/FT4 确认', ask: '怕冷还是怕热、体重变化、心率、颈部有无肿大' },
  '游离T3': { what: '甲状腺激素的活性形式', highAdvice: '升高支持甲亢诊断，请内分泌科就诊', lowAdvice: '降低支持甲减诊断，请内分泌科就诊', ask: '同甲功相关症状' },
  '游离T4': { what: '甲状腺分泌的主要激素', highAdvice: '升高支持甲亢诊断，请内分泌科就诊', lowAdvice: '降低支持甲减诊断，请内分泌科就诊', ask: '同甲功相关症状' },
  '肌酸激酶': { what: '心肌和骨骼肌损伤时升高的酶', highAdvice: '剧烈运动后可生理性升高（休息 3~5 天复查）；若伴胸闷胸痛，请立即心内科就诊', ask: '近期运动量、有无胸闷胸痛、肌肉酸痛' },
  '肌酸激酶同工酶': { what: '心肌特异性较高的酶', highAdvice: '升高提示心肌损伤可能：尤其伴胸闷胸痛，请立即心内科就诊', ask: '有无胸闷、胸痛、心悸' },
  '肌钙蛋白I': { what: '心肌梗死诊断的「金标准」指标', highAdvice: '升高高度提示心肌损伤：若伴胸闷、胸痛、大汗，请立即拨打 120 或急诊，切勿等待观察', ask: '有无胸痛、胸闷、大汗、濒死感' },
  'BNP': { what: '心脏「压力表」，心衰筛查指标', highAdvice: '升高提示心脏负担加重：留意活动后气短、夜间不能平卧、下肢水肿；请心内科评估', ask: '气短、水肿、夜间憋醒情况' },
  '血钾': { what: '维持心跳和肌肉功能的关键电解质', lowAdvice: '偏低可致乏力、心律失常：多吃香蕉、橙子、土豆；在服利尿剂者请医生评估', highAdvice: '偏高影响心脏安全，请尽快就医查明原因（肾功能/药物）', ask: '在服利尿剂/降压药、有无乏力心悸' },
  '血钠': { what: '维持体液平衡的核心电解质', lowAdvice: '轻度偏低常见于饮水过多或利尿剂使用；明显偏低可致头晕乏力，需就医', highAdvice: '偏高多见于水分摄入不足，适量补水后复查', ask: '饮水习惯、在服药物' },
  '血钙': { what: '骨骼和神经肌肉功能必需的矿物质', lowAdvice: '偏低可致手足麻木抽搐：补充奶制品、豆制品、多晒太阳；明显偏低请就医', highAdvice: '偏高需排查甲状旁腺等问题，请内分泌科就诊', ask: '有无手足麻木、抽搐、骨痛' },
  'C反应蛋白': { what: '全身炎症的「烽火台」，感染和炎症活动时升高', highAdvice: '提示体内有炎症活动：结合症状找感染灶；明显升高伴发热请就医', ask: '有无发热、局部疼痛红肿' },
  '超敏C反应蛋白': { what: '心血管慢性炎症的灵敏指标', highAdvice: '＞3 提示心血管风险增加：控制血压血脂、戒烟、运动，综合评估心血管风险', ask: '心血管危险因素（血压/血脂/吸烟）' },
  '血沉': { what: '红细胞沉降速度，炎症和免疫活动的「晴雨表」', highAdvice: '升高见于感染、风湿免疫病活动期等；特异性不高，需结合其他检查判断', ask: '有无关节痛、发热、体重下降' },
  '降钙素原': { what: '细菌感染的「特异性警报」，帮助鉴别细菌与病毒感染', highAdvice: '升高提示细菌感染可能性大，伴发热寒战请尽快就医；明显升高需急诊处理', ask: '发热、寒战、感染部位症状' },
  'D-二聚体': { what: '血栓溶解的产物，排查血栓的重要线索', highAdvice: '升高需排查血栓：单侧腿肿痛警惕深静脉血栓，突发胸痛呼吸困难警惕肺栓塞——这两种情况请立即急诊', ask: '有无单侧腿肿、胸痛、呼吸困难、近期手术或久坐' },
  '甲胎蛋白': { what: '肝癌筛查的常用标志物', highAdvice: '单项轻度升高不等于肿瘤（肝炎、怀孕也可升高）：建议肝脏超声+复查；明显升高请尽快消化科就诊', ask: '乙肝/丙肝/饮酒史、肝病家族史' },
  '癌胚抗原': { what: '消化道等多个系统肿瘤的广谱标志物', highAdvice: '吸烟者也可轻度升高：戒烟后复查，持续升高建议胃肠镜排查', ask: '吸烟史、消化道症状、肿瘤家族史' },
  'CA125': { what: '妇科肿瘤（卵巢）相关标志物', highAdvice: '月经期、盆腔炎、子宫内膜异位也可升高：避开经期复查，持续升高建议妇科超声', ask: '月经情况、痛经、盆腔症状' },
  'CA199': { what: '胰腺、胆道肿瘤相关标志物', highAdvice: '胆道炎症也可升高：建议腹部超声/CT 排查，复查动态观察', ask: '有无腹痛、黄疸、体重下降' },
  'PSA': { what: '前列腺癌筛查标志物（男性）', highAdvice: '前列腺炎、增生也可升高：避免骑车、射精后 48 小时内复查，持续升高请泌尿科就诊', ask: '排尿症状（尿频/尿急/尿不尽）、家族史' }
};

// 模式识别的患者版一句话（name 与 api-server LAB_PATTERNS 对齐）
const PATTERN_PLAIN = {
  '缺铁性贫血模式': '指标组合提示缺铁性贫血倾向——最常见的贫血类型，多数通过补铁和饮食调整可以改善。',
  '巨幼细胞贫血模式': '提示叶酸或维生素 B12 缺乏倾向，常见于长期素食或胃肠吸收不良。',
  '细菌感染模式': '提示细菌感染可能性大，常伴发热、咽痛等症状。',
  '病毒感染倾向': '更像病毒感染（如普通感冒），多数可自愈，注意休息多喝水。',
  '肝细胞损伤模式': '肝脏在「报警」：最常见原因是饮酒、脂肪肝或药物影响，戒酒+复查是关键。',
  '胆汁淤积模式': '胆汁排泄不畅的信号，建议做腹部超声看看胆道。',
  '肾功能减退模式': '肾脏工作效率下降的信号，需要肾内科规律随诊，切勿滥用药物。',
  '高尿酸/痛风倾向': '尿酸偏高：管住嘴（少内脏海鲜酒）、多喝水，可明显降低痛风风险。',
  '糖尿病（消渴）': '已达糖尿病诊断界值——这不是句号而是逗号，规范管理可以控制得很好，请尽快内分泌科确诊。',
  '糖尿病前期': '处于糖尿病前期——这是最好的干预窗口期：减重+运动+饮食调整，一半以上可以逆转。',
  '血脂异常（痰浊）': '血脂超标是动脉斑块的「原料」，现在干预正是时候。',
  '甲减模式': '甲状腺功能减退倾向：怕冷、乏力、体重增加都可能是它在作祟。',
  '甲亢模式': '甲状腺功能亢进倾向：心慌、手抖、消瘦、脾气急都可能与此相关。',
  '炎症活动模式': '体内有明确的炎症活动，需要找到并处理炎症来源。',
  '心衰倾向': '心脏负担加重的信号，请务必心内科评估。',
  '低钾倾向': '血钾偏低会乏力、心慌，饮食补钾并查明原因。',
  '肿瘤标志物警示': '请先深呼吸——单项升高不等于肿瘤，很多良性情况也会升高，影像复查确认才是下一步。'
};

// 严重模式的就诊紧迫度提升（出现这些模式 → 建议尽快就诊）
const SOON_PATTERNS = ['糖尿病（消渴）', '心衰倾向', '肿瘤标志物警示', '肾功能减退模式', '甲减模式', '甲亢模式'];

// ── 别名索引（构建一次）──
// 短别名（纯 ASCII ≤3 字符，如 K/Na/Cr/Hb）需词边界匹配，避免误伤
const _aliasIndex = [];
LAB_ALIAS.forEach(a => {
  a.aliases.forEach(al => {
    _aliasIndex.push({ alias: al, aliasLower: al.toLowerCase(), key: a.key, short: /^[a-zA-Z0-9+\-%]{1,3}$/.test(al) });
  });
});
_aliasIndex.sort((x, y) => y.alias.length - x.alias.length); // 长别名优先

function normalizeName(name) {
  const s = String(name || '').trim();
  if (!s) return null;
  const lower = s.toLowerCase();
  for (const it of _aliasIndex) {
    if (it.aliasLower === lower) return it.key;
  }
  for (const it of _aliasIndex) {
    if (lower.includes(it.aliasLower) && !it.short) return it.key;
  }
  for (const it of _aliasIndex) {
    if (it.short && new RegExp('(^|[^a-z0-9])' + it.aliasLower.replace(/[+%]/g, '\\$&') + '([^a-z0-9]|$)').test(lower)) return it.key;
  }
  return null;
}

/**
 * 粘贴报告文本解析：支持一行多项、「名称 数值 单位 ↑」、括号别名、阳性/阴性文本项
 * 返回 [{name, value, raw, unit}]（name 已归一为 LAB_PANEL 标准名；未识别项丢弃）
 */
function parseLabText(text) {
  const lines = String(text || '').split(/[\n\r;；]+/);
  const found = [];
  const seen = new Set();
  for (const rawLine of lines) {
    let line = rawLine.trim();
    if (!line || line.length > 120) continue;
    let guard = 0;
    while (line && guard++ < 8) {
      // 找本行最早出现的别名
      let best = null;
      for (const it of _aliasIndex) {
        const idx = line.toLowerCase().indexOf(it.aliasLower);
        if (idx < 0) continue;
        if (it.short) {
          const before = idx > 0 ? line[idx - 1] : '';
          const after = idx + it.alias.length < line.length ? line[idx + it.alias.length] : '';
          if (/[a-zA-Z0-9]/.test(before) || /[a-zA-Z0-9]/.test(after)) continue;
        }
        if (!best || idx < best.idx || (idx === best.idx && it.alias.length > best.item.alias.length)) best = { idx, item: it };
      }
      if (!best) break;
      const nameEnd = best.idx + best.item.alias.length;
      // 值段：名称之后到下一个别名出现之前
      let seg = line.slice(nameEnd);
      let nextIdx = seg.length;
      for (const it of _aliasIndex) {
        if (it.key === best.item.key) continue;
        const j = seg.toLowerCase().indexOf(it.aliasLower);
        if (j >= 0 && j < nextIdx) nextIdx = j;
      }
      const valueSeg = seg.slice(0, nextIdx);
      if (!seen.has(best.item.key)) {
        const numM = valueSeg.match(/[-+]?\d+(?:\.\d+)?/);
        const txtM = valueSeg.match(/阳性|弱阳性|阴性|±|\++|−|-/);
        if (numM) {
          // 单位：锚定数值之后截取（避免把数值尾位误当单位）
          const afterNum = valueSeg.slice(numM.index + numM[0].length);
          const unitM = afterNum.match(/^\s*([^\s,，;；:：↑↓+＋\u4e00-\u9fa5]{1,14})/);
          seen.add(best.item.key);
          found.push({ name: best.item.key, value: parseFloat(numM[0]), raw: numM[0] + (/[↑＋]/.test(afterNum) ? '↑' : /[↓]/.test(afterNum) ? '↓' : ''), unit: unitM && unitM[1] ? unitM[1] : '' });
        } else if (txtM) {
          seen.add(best.item.key);
          found.push({ name: best.item.key, value: NaN, raw: txtM[0], unit: '' });
        }
      }
      line = seg.slice(nextIdx);
    }
  }
  return found;
}

/** 参考区间展示文本（性别分层） */
function refTextOf(ref, gender) {
  if (!ref) return '';
  if (ref.text) return '阴性为正常';
  let lo = ref.low, hi = ref.high;
  if (gender === '男' && ref.mLow != null) { lo = ref.mLow; hi = ref.mHigh; }
  if (gender === '女' && ref.fLow != null) { lo = ref.fLow; hi = ref.fHigh; }
  const fmt = v => (v == null ? '' : String(v));
  if (lo != null && hi != null) return fmt(lo) + ' ~ ' + fmt(hi) + (ref.unit ? ' ' + ref.unit : '');
  if (hi != null) return '≤ ' + fmt(hi) + (ref.unit ? ' ' + ref.unit : '');
  if (lo != null) return '≥ ' + fmt(lo) + (ref.unit ? ' ' + ref.unit : '');
  return ref.unit || '';
}

/** 前端录入辅助目录：指标 + 别名 + 拼音首字母 + 参考区间 */
function buildCatalog(panel) {
  return LAB_ALIAS.map(a => {
    const ref = panel.find(p => p.key === a.key) || {};
    return {
      key: a.key, cat: ref.cat || '', unit: ref.unit || '', text: !!ref.text,
      ref_default: refTextOf(ref, ''), ref_male: refTextOf(ref, '男'), ref_female: refTextOf(ref, '女'),
      aliases: a.aliases, initials: a.initials,
      plain_what: (LAB_PLAIN[a.key] || {}).what || ''
    };
  });
}

/**
 * 患者版解读主函数
 * labs: [{name, value, raw, unit}]（name 自动归一）; profile: {gender, age}
 * helpers: {panel: LAB_PANEL, analyze: analyzeLabs}（由 api-server 注入，避免参考值重复定义）
 */
function interpretForPatient(labsIn, profile, helpers) {
  const panel = helpers.panel, analyze = helpers.analyze;
  const gender = (profile && profile.gender) || '';
  // 归一 + 去重（同名保留第一条）
  const seen = new Set();
  const labs = [];
  (Array.isArray(labsIn) ? labsIn : []).forEach(l => {
    if (!l) return;
    const key = normalizeName(l.name) || String(l.name || '').trim();
    if (!key || seen.has(key)) return;
    seen.add(key);
    labs.push({ name: key, value: typeof l.value === 'number' ? l.value : parseFloat(l.value), raw: l.raw, unit: l.unit });
  });
  if (!labs.length) return null;

  const ana = analyze(labs, gender);
  const panelOf = n => panel.find(p => p.key === n);

  const items = ana.items.map(it => {
    const plain = LAB_PLAIN[it.name] || {};
    const ref = panelOf(it.name);
    const known = !!ref;
    let advice = '', ask = '';
    if (it.flag === '高' || it.flag === '阳') advice = plain.highAdvice || '';
    else if (it.flag === '低') advice = plain.lowAdvice || '';
    if (it.flag !== '正常' && it.flag !== '录') ask = plain.ask || '';
    if (it.flag === '录') advice = '该指标不在本院判读面板内，已为您记录，就诊时可出示给医生参考。';
    return {
      name: it.name, cat: it.cat || '其他', value: it.value, unit: it.unit || (ref ? ref.unit : ''),
      flag: it.flag, severity: it.severity || '',
      ref_text: known ? refTextOf(ref, gender) : '',
      what: plain.what || '', advice, ask,
      tcm_hint: (it.flag === '高' || it.flag === '阳') ? (ref && ref.highHint) : it.flag === '低' ? (ref && ref.lowHint) : ''
    };
  });

  const abn = items.filter(i => i.flag !== '正常' && i.flag !== '录');
  const critN = (ana.criticals || []).length;
  const patterns = (ana.patterns || []).map(p => ({ name: p.name, tcm: p.tcm, advice: p.advice, plain: PATTERN_PLAIN[p.name] || '' }));
  const patternNames = patterns.map(p => p.name);

  // 就诊紧迫度分级
  let urgency = 'ok', urgency_label = '全部参考范围内', urgency_desc = '本次判读指标均在参考范围内，保持现有健康生活方式即可。';
  if (critN > 0) {
    urgency = 'critical'; urgency_label = '立即就医';
    urgency_desc = '检测到危急值 ' + critN + ' 项，请不要等待，立即前往急诊或拨打 120；前往时携带本报告。';
  } else if (abn.some(i => i.severity === '重') || patternNames.some(n => SOON_PATTERNS.includes(n))) {
    urgency = 'soon'; urgency_label = '建议尽快就诊';
    urgency_desc = '部分指标明显异常或组合模式需要医生面诊确认，建议 1 周内挂号就诊（可在下方直接预约本院）。';
  } else if (abn.length > 0) {
    urgency = 'routine'; urgency_label = '建议调理 + 复查';
    urgency_desc = '轻度异常多数可通过生活方式改善，按下方建议调理，4~12 周后复查对比。';
  }

  // 生活方式建议与就诊提示汇总（去重截断）
  const lifestyle = [...new Set(abn.map(i => i.advice).filter(Boolean))].slice(0, 6);
  const doctorNotes = [...new Set(abn.map(i => i.ask).filter(Boolean))].slice(0, 8);
  const tcmSet = [...new Set(abn.map(i => i.tcm_hint).filter(Boolean))].slice(0, 5);

  const overview = {
    total: items.length, abnormal: abn.length, critical: critN, recorded: items.filter(i => i.flag === '录').length,
    urgency, urgency_label, urgency_desc,
    headline: '本次判读 ' + items.length + ' 项，异常 ' + abn.length + ' 项' +
      (critN ? '（含危急值 ' + critN + ' 项）' : '') +
      (patterns.length ? '，识别出「' + patternNames.join('、') + '」' : '')
  };

  return {
    overview, items, patterns,
    criticals: ana.criticals || [],
    tcm_corroboration: tcmSet.length || patterns.length
      ? '中医视角佐证（供医师参考）：' + [...tcmSet, ...patterns.map(p => p.name + '→' + p.tcm)].join('；')
      : '本次指标未见明显中医证候佐证线索。',
    lifestyle, doctor_notes: doctorNotes,
    engine_summary: ana.summary,
    disclaimer: '本解读由 AI 辅助生成，帮助您理解报告并为就诊做准备，不构成诊断或治疗建议；最终诊疗决策由执业医师作出，急危重症请立即按急诊流程处置。'
  };
}

module.exports = { LAB_ALIAS, LAB_PLAIN, PATTERN_PLAIN, normalizeName, parseLabText, buildCatalog, interpretForPatient };
