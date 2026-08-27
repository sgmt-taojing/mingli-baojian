/**
 * 慢病居家管理引擎 — 4 大核心慢病诊疗路径
 *
 * 疾病：
 *   HTN  (hypertension)      高血压
 *   DM   (diabetes)          糖尿病
 *   INS  (insomnia)          失眠
 *   COPD (chronic-obstructive) 慢性阻塞性肺疾病
 *
 * 每条路径包含：
 *   profile            — 疾病元信息（名称/别名/科室/西医定义/TCM归经/常见证型）
 *   riskThresholds     — 危险值阈值（数值区间 → risk level + 处置建议）
 *   patternProfile     — TCM 辨证要素（主症/兼症/舌象/脉象/证型）
 *   medSchedule        — 典型西药+中成药（按证型区分）
 *   lifestyleGuide     — 饮食/运动/起居/情志 生活指导
 *   emergencySignal    — 什么情况下触发 SOS / 呼叫 120
 *   tcmAdvice          — TCM 养生方/食疗/穴位保健（非处方建议）
 *
 * 边界：
 *   ① 不输出疾病诊断 — 仅做风险识别 + 生活方式建议 + 就医指引
 *   ② 不替代医生处方 — 用药提醒仅做依从性辅助
 *   ③ 危险值直接触发 SOS 流程（sos() → 家属+120）
 *   ④ 所有建议标注「仅供参考，重要事项请遵医嘱」
 */

'use strict';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  4 大慢病定义
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const CHRONIC_DISEASES = {
  HTN: {
    id: 'HTN',
    name: '高血压',
    aliases: ['高血压病', '原发性高血压', '风眩', '眩晕'],
    department: '心内科 / 中医内科',
    westernDef: '动脉血压持续升高（≥140/90 mmHg），心脑血管疾病首要危险因素',
    tcmCategory: '眩晕 / 风眩 / 头痛',
    tcmMeridian: '肝、肾、心',
    prevalence: '中国 ≈ 2.7 亿',
    targetVitals: ['systolic', 'diastolic', 'heart_rate'],

    // 危险值阈值 (mmHg)
    riskThresholds: {
      critical: { systolic: [180, 999], diastolic: [120, 999], label: '极高危', action: '立即拨打 120，保持安静平卧', color: '#dc2626' },
      high:     { systolic: [160, 179], diastolic: [100, 119], label: '高危',   action: '立即联系医生，30 分钟内评估', color: '#ef4444' },
      medium:   { systolic: [140, 159], diastolic: [90, 99],   label: '中危',   action: '今日内门诊，监测血压变化', color: '#f59e0b' },
      low:      { systolic: [0, 139],   diastolic: [0, 89],    label: '正常',   action: '继续保持，定期监测', color: '#22c55e' },
    },

    // 血压分级判定
    classifyBP(sys, dia) {
      if (sys >= 180 || dia >= 120) return 'critical';
      if (sys >= 160 || dia >= 100) return 'high';
      if (sys >= 140 || dia >= 90)  return 'medium';
      return 'low';
    },

    // TCM 辨证主路径
    patternProfile: [
      {
        syndrome: '肝阳上亢',
        priority: 1,
        mainSymptoms: ['头痛', '眩晕', '面红目赤', '急躁易怒', '血压波动'],
        tongue: '舌红苔黄',
        pulse: '脉弦',
        score: 0.9,
        formula: '天麻钩藤饮',
        herbs: '天麻、钩藤、石决明、栀子、黄芩、牛膝、杜仲、益母草、桑寄生、夜交藤、茯神',
        tcmAdvice: '菊花茶、芹菜汁、少盐饮食、避免熬夜',
      },
      {
        syndrome: '痰湿内阻',
        priority: 2,
        mainSymptoms: ['头重', '胸闷', '痰多', '纳呆', '舌苔白腻'],
        tongue: '苔白腻',
        pulse: '脉滑',
        score: 0.8,
        formula: '半夏白术天麻汤',
        herbs: '半夏、白术、天麻、茯苓、橘红、生姜、大枣',
        tcmAdvice: '薏米粥、陈皮水、少食肥甘、适当运动',
      },
      {
        syndrome: '肝肾阴虚',
        priority: 3,
        mainSymptoms: ['眩晕', '耳鸣', '腰膝酸软', '五心烦热'],
        tongue: '舌红少苔',
        pulse: '脉细数',
        score: 0.75,
        formula: '杞菊地黄丸',
        herbs: '枸杞、菊花、熟地黄、山萸肉、山药、泽泻、丹皮、茯苓',
        tcmAdvice: '黑芝麻、核桃、枸杞泡水、避免房劳过度',
      },
      {
        syndrome: '阴阳两虚',
        priority: 4,
        mainSymptoms: ['眩晕', '腰膝酸软', '畏寒', '五心烦热', '脉细'],
        tongue: '舌淡或红',
        pulse: '脉沉细',
        score: 0.6,
        formula: '二仙汤加减',
        herbs: '仙茅、仙灵脾、当归、巴戟天、知母、黄柏',
        tcmAdvice: '温补交替、避免骤冷骤热、规律作息',
      },
    ],

    // 典型用药提醒模板（不替代医嘱）
    medSchedule: [
      { time: '07:00', drug: '降压药（晨起）',   type: '长期', note: '餐前 30 分钟，避免与西柚同食' },
      { time: '19:00', drug: '降压药（晚间）',    type: '长期', note: '餐后服用，睡前 2h 停' },
      { time: '12:00', drug: '辅助中成药',        type: '按需', note: '如医生处方天麻钩藤饮类' },
    ],

    // 生活指导
    lifestyleGuide: {
      diet: {
        principle: '低盐低脂，每日盐 < 5g',
        recommend: ['芹菜、海带、黑木耳、山楂、决明子茶', '鱼类（Omega-3）、橄榄油', '全谷物、蔬菜、水果'],
        avoid: ['咸菜、腌肉、加工食品', '动物内脏、肥肉', '浓茶、烈酒、咖啡过量'],
      },
      exercise: {
        principle: '中等强度有氧运动，每周 ≥ 150 分钟',
        recommend: ['快走（30 分钟/天）', '太极拳、八段锦', '游泳（水温适宜）'],
        avoid: ['剧烈无氧运动', '屏气发力（如举重）', '晨起空腹剧烈运动'],
        warning: '血压 > 160/100 时暂停运动',
      },
      sleep: {
        principle: '7-8 小时，规律作息',
        recommend: ['晚 22:30 前入睡', '午休 ≤ 30 分钟', '睡前温水泡脚'],
        avoid: ['熬夜（23 点后）', '睡前激烈运动', '睡前大量饮水'],
      },
      emotion: {
        principle: '避免情绪剧烈波动',
        recommend: ['书法、听音乐、冥想', '与亲友交流', '避免焦虑/暴怒'],
      },
    },

    // 触发 SOS 的信号
    emergencySignals: [
      { condition: '收缩压 ≥ 180 或 舒张压 ≥ 120',  reason: '高血压危象，可能脑出血/主动脉夹层' },
      { condition: '剧烈头痛 + 恶心呕吐',             reason: '疑似脑出血先兆' },
      { condition: '胸痛 + 呼吸困难',                 reason: '疑似急性心衰/心梗' },
      { condition: '一侧肢体麻木/无力',               reason: '疑似脑卒中' },
      { condition: '视物模糊/意识模糊',               reason: '高血压脑病' },
    ],

    tcmAdvice: {
      acupoints: ['太冲（降压）', '曲池（降压）', '足三里（调理脾胃）', '涌泉（引火归元）'],
      footBath: '吴茱萸 10g + 牛膝 15g，煮水泡脚 20 分钟（晚间）',
      dietTherapy: '决明子粥（决明子 15g + 粳米 50g）、山楂茶、芹菜汁',
      qigong: '八段锦 — 双手托天理三焦、调理脾胃须单举',
    },
  },

  DM: {
    id: 'DM',
    name: '糖尿病',
    aliases: ['消渴', '糖尿病', '1 型/2 型'],
    department: '内分泌科 / 中医内科',
    westernDef: '以高血糖为特征的代谢性疾病，胰岛素分泌/作用缺陷导致',
    tcmCategory: '消渴（上/中/下三消）',
    tcmMeridian: '肺、胃、肾',
    prevalence: '中国 ≈ 1.4 亿',
    targetVitals: ['blood_glucose', 'spo2', 'heart_rate'],

    riskThresholds: {
      critical: { glucose_fasting: [16.7, 99],  glucose_random: [22.2, 99], label: '极高危', action: '立即联系内分泌科，评估酮症酸中毒', color: '#dc2626' },
      high:     { glucose_fasting: [13.9, 16.6], glucose_random: [16.7, 22.1], label: '高危',   action: '24h 内门诊，调整方案', color: '#ef4444' },
      medium:   { glucose_fasting: [7.0, 13.8],  glucose_random: [11.1, 16.6], label: '偏高',   action: '加强监测，控制饮食', color: '#f59e0b' },
      low:      { glucose_fasting: [0, 6.9],     glucose_random: [0, 11.0],   label: '正常',   action: '继续保持', color: '#22c55e' },
    },

    classifyGlucose(fasting, random) {
      const val = fasting || random;
      if (fasting >= 16.7 || random >= 22.2) return 'critical';
      if (fasting >= 13.9 || random >= 16.7) return 'high';
      if (fasting >= 7.0  || random >= 11.1) return 'medium';
      return 'low';
    },

    patternProfile: [
      {
        syndrome: '肺热津伤',
        priority: 1,
        mainSymptoms: ['多饮', '口干舌燥', '多食', '消瘦', '舌红少津'],
        tongue: '舌红少津',
        pulse: '脉细数',
        score: 0.85,
        formula: '消渴方',
        herbs: '天花粉、葛根、麦冬、生地、藕汁、黄连、黄芩、知母',
        tcmAdvice: '百合粥、麦冬茶、银耳羹',
      },
      {
        syndrome: '胃热炽盛',
        priority: 2,
        mainSymptoms: ['多食', '多饮', '多尿', '消瘦', '口渴'],
        tongue: '舌红苔黄',
        pulse: '脉滑数',
        score: 0.8,
        formula: '玉女煎加减',
        herbs: '石膏、知母、熟地、麦冬、牛膝、黄连、栀子',
        tcmAdvice: '苦瓜、冬瓜、芹菜，忌甜食',
      },
      {
        syndrome: '肾阴亏虚',
        priority: 3,
        mainSymptoms: ['尿频', '尿浊', '腰膝酸软', '口干', '耳鸣'],
        tongue: '舌红少苔',
        pulse: '脉沉细',
        score: 0.8,
        formula: '六味地黄丸',
        herbs: '熟地黄、山萸肉、山药、泽泻、丹皮、茯苓',
        tcmAdvice: '黑豆、黑芝麻、枸杞、山药',
      },
      {
        syndrome: '阴阳两虚',
        priority: 4,
        mainSymptoms: ['尿频', '腰膝酸冷', '五心烦热', '畏寒', '乏力'],
        tongue: '舌淡苔白',
        pulse: '脉沉细',
        score: 0.6,
        formula: '金匮肾气丸',
        herbs: '附子、桂枝、熟地黄、山萸肉、山药、泽泻、丹皮、茯苓',
        tcmAdvice: '温阳益气，避免骤冷骤热，规律作息',
      },
    ],

    medSchedule: [
      { time: '07:00', drug: '降糖药（餐前）',    type: '长期', note: '餐前 30 分钟服用，监测空腹血糖' },
      { time: '12:00', drug: '降糖药（餐前）',    type: '长期', note: '餐前服用' },
      { time: '18:00', drug: '降糖药（餐前/后）', type: '长期', note: '按医嘱，睡前加餐防低血糖' },
      { time: '22:00', drug: '睡前加餐（防低血糖）', type: '按需', note: '如当日胰岛素剂量大' },
    ],

    lifestyleGuide: {
      diet: {
        principle: '碳水控制（总量 < 200g/天），低 GI，定时定量',
        recommend: ['燕麦、糙米、荞麦', '绿叶菜、豆类、瘦肉', '苦瓜、南瓜（适量）', '规律三餐，七分饱'],
        avoid: ['白米饭、白面包（GI 高）', '糖果、甜饮料、蜂蜜', '高脂油炸、动物内脏'],
      },
      exercise: {
        principle: '餐后 1 小时运动，避免低血糖',
        recommend: ['快走（30 分钟）', '太极拳', '八段锦'],
        avoid: ['空腹运动', '剧烈无氧', '运动前不进食'],
        warning: '血糖 < 3.9 mmol/L 时暂停运动并补充糖',
      },
      sleep: {
        principle: '规律作息，熬夜升糖',
        recommend: ['23:00 前入睡', '午休 ≤ 30 分钟'],
      },
      emotion: {
        principle: '情绪波动影响血糖',
        recommend: ['冥想、深呼吸', '避免焦虑'],
      },
    },

    emergencySignals: [
      { condition: '血糖 ≥ 16.7 mmol/L（空腹）',           reason: '高血糖危象，可能酮症酸中毒' },
      { condition: '血糖 ≤ 2.8 mmol/L 伴意识模糊',          reason: '严重低血糖昏迷' },
      { condition: '呼气有烂苹果味（酮症）',                reason: '酮症酸中毒，立即 120' },
      { condition: '恶心呕吐 + 腹痛 + 深大呼吸',            reason: '糖尿病酮症酸中毒三联征' },
    ],

    tcmAdvice: {
      acupoints: ['足三里（调理脾胃）', '太溪（滋阴补肾）', '关元（补元气）', '脾俞（健脾）'],
      footBath: '艾叶 15g + 吴茱萸 10g，煮水泡脚（晚间，水温 38-40°C）',
      dietTherapy: '山药粥、苦瓜炒蛋、百合银耳羹（代糖）',
      qigong: '八段锦 — 调理脾胃须单举、两手攀足固肾腰',
    },
  },

  INS: {
    id: 'INS',
    name: '失眠',
    aliases: ['不寐', '目不瞑', '不得眠', '失眠症'],
    department: '神经内科 / 中医内科 / 睡眠医学科',
    westernDef: '以入睡困难/睡眠维持困难/早醒为核心症状，影响日间功能的睡眠障碍',
    tcmCategory: '不寐',
    tcmMeridian: '心、肝、脾、肾',
    prevalence: '中国成人 ≈ 38.2%',
    targetVitals: ['sleep_hours', 'sleep_quality', 'heart_rate'],

    riskThresholds: {
      critical: { sleep_hours: [0, 2],  label: '极高危', action: '立即联系医生，评估安眠药/急诊', color: '#dc2626' },
      high:     { sleep_hours: [2, 4],  label: '严重失眠', action: '48h 内就诊睡眠门诊', color: '#ef4444' },
      medium:   { sleep_hours: [4, 6],  label: '睡眠不足', action: '调整作息，加强睡眠卫生', color: '#f59e0b' },
      low:      { sleep_hours: [6, 24], label: '正常',   action: '继续保持', color: '#22c55e' },
    },

    classifySleep(hours) {
      if (hours >= 0 && hours < 2) return 'critical';
      if (hours >= 2 && hours < 4) return 'high';
      if (hours >= 4 && hours < 6) return 'medium';
      return 'low';
    },

    patternProfile: [
      {
        syndrome: '心脾两虚',
        priority: 1,
        mainSymptoms: ['多梦易醒', '心悸', '头晕目眩', '面色少华', '神疲'],
        tongue: '舌淡苔薄',
        pulse: '脉细弱',
        score: 0.9,
        formula: '归脾汤',
        herbs: '党参、黄芪、白术、茯神、酸枣仁、龙眼肉、木香、当归、远志、炙甘草、生姜、大枣',
        tcmAdvice: '桂圆红枣粥、酸枣仁茶、睡前温水泡脚',
      },
      {
        syndrome: '阴虚火旺',
        priority: 2,
        mainSymptoms: ['心烦', '多梦', '五心烦热', '口干', '盗汗'],
        tongue: '舌红少苔',
        pulse: '脉细数',
        score: 0.85,
        formula: '黄连阿胶汤',
        herbs: '黄连、黄芩、阿胶、白芍、鸡子黄',
        tcmAdvice: '百合粥、银耳羹、莲子心茶（少量）',
      },
      {
        syndrome: '肝郁化火',
        priority: 3,
        mainSymptoms: ['失眠', '急躁易怒', '胸闷胁痛', '口苦', '目赤'],
        tongue: '舌红苔黄',
        pulse: '脉弦数',
        score: 0.8,
        formula: '龙胆泻肝汤',
        herbs: '龙胆草、黄芩、栀子、泽泻、木通、车前子、当归、生地、柴胡、生甘草',
        tcmAdvice: '菊花决明子茶、避免生气、适当运动宣泄',
      },
      {
        syndrome: '痰热内扰',
        priority: 4,
        mainSymptoms: ['失眠', '心烦', '胸闷', '痰多', '口苦'],
        tongue: '舌红苔黄腻',
        pulse: '脉滑数',
        score: 0.7,
        formula: '黄连温胆汤',
        herbs: '半夏、陈皮、茯苓、甘草、枳实、竹茹、黄连、大枣',
        tcmAdvice: '陈皮水、少吃肥甘厚味、晚餐减量',
      },
    ],

    medSchedule: [
      { time: '21:00', drug: '安神类中成药（按医嘱）', type: '按需', note: '如酸枣仁类，遵医嘱' },
      { time: '22:00', drug: '睡前准备',            type: '日常', note: '泡脚/听轻音乐/关屏幕' },
    ],

    lifestyleGuide: {
      diet: {
        principle: '晚餐七分饱，避免辛辣/咖啡/浓茶',
        recommend: ['小米粥、百合、莲子', '牛奶（温）', '核桃（少量）'],
        avoid: ['下午 3 点后不喝咖啡', '晚餐过饱', '辛辣刺激'],
      },
      exercise: {
        principle: '白天适量运动，睡前 3h 不运动',
        recommend: ['快走（30 分钟）', '太极拳', '八段锦'],
        avoid: ['睡前剧烈运动', '傍晚后大量运动'],
      },
      sleep: {
        principle: '固定作息，23:00 前入睡，7-8h',
        recommend: ['睡前温水泡脚（20 分钟）', '调暗灯光', '关闭屏幕', '听轻音乐'],
        avoid: ['睡前看手机/电视', '咖啡/浓茶午后', '午睡 > 30 分钟'],
      },
      emotion: {
        principle: '睡前不思考烦心事',
        recommend: ['冥想、深呼吸', '写日记释放情绪', '与家人交流'],
      },
    },

    emergencySignals: [
      { condition: '连续 72h 无法入睡 + 意识模糊',    reason: '严重失眠导致认知障碍' },
      { condition: '失眠 + 幻听/妄想',                 reason: '可能精神疾病' },
      { condition: '自杀念头',                          reason: '紧急精神干预' },
    ],

    tcmAdvice: {
      acupoints: ['神门（安神）', '内关（宁心）', '三阴交（养血安神）', '涌泉（引火归元）'],
      footBath: '艾叶 15g + 吴茱萸 10g + 夜交藤 15g，煮水泡脚（睡前 1h，水温 38-40°C）',
      dietTherapy: '百合粥（百合 30g + 粳米 50g）、酸枣仁茶、桂圆红枣茶',
      qigong: '八段锦 — 调理脾胃须单举；睡前静坐冥想 10 分钟',
    },
  },

  COPD: {
    id: 'COPD',
    name: '慢性阻塞性肺疾病',
    aliases: ['慢阻肺', 'COPD', '肺胀', '喘证'],
    department: '呼吸内科 / 中医内科',
    westernDef: '持续性气流受限，慢性支气管炎/肺气肿导致，进行性加重',
    tcmCategory: '肺胀 / 喘证 / 咳嗽',
    tcmMeridian: '肺、脾、肾',
    prevalence: '中国 ≈ 1 亿',
    targetVitals: ['spo2', 'heart_rate', 'respiratory_rate', 'temperature'],

    riskThresholds: {
      critical: { spo2: [0, 88], respiratory_rate: [0, 30], label: '极高危', action: '立即 120，保持半坐位吸氧', color: '#dc2626' },
      high:     { spo2: [88, 91], respiratory_rate: [25, 29], label: '高危',   action: '立即联系医生，2h 内评估', color: '#ef4444' },
      medium:   { spo2: [91, 93], respiratory_rate: [20, 24], label: '中危',   action: '今日内门诊，监测变化', color: '#f59e0b' },
      low:      { spo2: [93, 100], respiratory_rate: [0, 19], label: '正常',  action: '继续保持', color: '#22c55e' },
    },

    classifyVitals(spo2, rr) {
      if (spo2 < 88 || rr >= 30) return 'critical';
      if (spo2 < 91 || rr >= 25) return 'high';
      if (spo2 < 93 || rr >= 20) return 'medium';
      return 'low';
    },

    patternProfile: [
      {
        syndrome: '肺气虚',
        priority: 1,
        mainSymptoms: ['气短', '自汗', '易感冒', '咳嗽', '痰白清稀'],
        tongue: '舌淡苔白',
        pulse: '脉弱',
        score: 0.9,
        formula: '玉屏风散',
        herbs: '黄芪、白术、防风、党参、五味子、紫菀、冬花',
        tcmAdvice: '黄芪粥、山药粥、注意保暖、避免感冒',
      },
      {
        syndrome: '痰湿蕴肺',
        priority: 2,
        mainSymptoms: ['咳嗽', '痰多', '胸闷', '纳呆', '痰白粘'],
        tongue: '苔白腻',
        pulse: '脉滑',
        score: 0.85,
        formula: '二陈汤合三子养亲汤',
        herbs: '半夏、陈皮、茯苓、甘草、苏子、白芥子、莱菔子',
        tcmAdvice: '薏米粥、陈皮水、拍背排痰、避免寒湿环境',
      },
      {
        syndrome: '肺肾两虚',
        priority: 3,
        mainSymptoms: ['气短', '腰膝酸软', '动则喘甚', '自汗'],
        tongue: '舌淡',
        pulse: '脉沉细',
        score: 0.8,
        formula: '平喘固本汤',
        herbs: '党参、五味子、冬虫夏草、胡桃肉、沉香、紫石英、坎炁、苏子、橘红、半夏、款冬、桑皮、杏仁',
        tcmAdvice: '核桃、山药、冬虫夏草（遵医嘱）、八段锦',
      },
      {
        syndrome: '痰热壅肺',
        priority: 4,
        mainSymptoms: ['咳嗽', '痰黄粘稠', '胸闷', '发热', '口干'],
        tongue: '舌红苔黄腻',
        pulse: '脉滑数',
        score: 0.75,
        formula: '清气化痰丸',
        herbs: '胆南星、黄芩、瓜蒌仁、陈皮、杏仁、枳实、茯苓、半夏、生姜',
        tcmAdvice: '多饮水、梨汁、避免烟尘刺激',
      },
    ],

    medSchedule: [
      { time: '07:00', drug: '支气管扩张剂（晨起）',  type: '长期', note: '吸入器，先呼后吸' },
      { time: '12:00', drug: '化痰药',                type: '长期', note: '如乙酰半胱氨酸' },
      { time: '19:00', drug: '支气管扩张剂（晚间）',  type: '长期', note: '吸入器' },
      { time: '随时',  drug: '应急吸入器（沙丁胺醇）', type: '应急', note: '急性发作时使用，记录使用频率' },
    ],

    lifestyleGuide: {
      diet: {
        principle: '高蛋白、高纤维、清淡易消化',
        recommend: ['瘦肉、鱼类、蛋类（高蛋白）', '梨、百合、银耳（润肺）', '多饮水（> 1500ml/天）'],
        avoid: ['烟酒（绝对禁止）', '辛辣刺激', '过咸/过甜', '油腻'],
      },
      exercise: {
        principle: '腹式呼吸 + 循序渐进运动',
        recommend: ['腹式呼吸（每天 2 次，每次 10 分钟）', '快走（短距离）', '八段锦（缓慢）'],
        avoid: ['剧烈运动', '冷环境运动', '空腹运动'],
        warning: 'SpO2 < 90% 时停止运动，吸氧',
      },
      sleep: {
        principle: '半坐卧位减轻呼吸困难',
        recommend: ['枕头垫高 15-20cm', '睡前拍背排痰'],
      },
      emotion: {
        principle: '避免焦虑加重呼吸困难',
        recommend: ['腹式呼吸放松', '冥想', '避免生气'],
      },
    },

    emergencySignals: [
      { condition: '血氧 SpO2 < 88%',                   reason: '呼吸衰竭，立即 120' },
      { condition: '呼吸频率 > 30 次/分',                reason: '呼吸急促，急性加重' },
      { condition: '咳粉红色泡沫痰',                     reason: '急性肺水肿，立即 120' },
      { condition: '意识模糊/嗜睡',                      reason: '二氧化碳潴留/肺性脑病' },
      { condition: '胸痛 + 呼吸困难',                    reason: '肺栓塞/气胸可能' },
    ],

    tcmAdvice: {
      acupoints: ['肺俞（补肺气）', '足三里（健脾）', '肾俞（补肾纳气）', '膻中（宽胸理气）'],
      footBath: '艾叶 15g + 麻黄 6g + 桂枝 10g，煮水泡脚（晚间，水温 38-40°C）',
      dietTherapy: '百合粥、银耳羹、梨汁、黄芪粥',
      qigong: '八段锦 — 调理脾胃须单举、两手攀足固肾腰；腹式呼吸练习',
    },
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  引擎导出
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports = {
  CHRONIC_DISEASES,

  /**
   * 获取疾病完整档案
   */
  getDisease(diseaseId) {
    return CHRONIC_DISEASES[diseaseId] || null;
  },

  /**
   * 列出所有可用慢病
   */
  listDiseases() {
    return Object.values(CHRONIC_DISEASES).map(d => ({
      id: d.id,
      name: d.name,
      aliases: d.aliases,
      department: d.department,
      prevalence: d.prevalence,
    }));
  },

  /**
   * 风险分级 — HTN (systolic/diastolic)
   */
  assessHTN(systolic, diastolic) {
    const disease = CHRONIC_DISEASES.HTN;
    const level = disease.classifyBP(systolic, diastolic);
    const thresholds = disease.riskThresholds[level];
    return {
      disease: 'HTN',
      diseaseName: '高血压',
      level,
      label: thresholds.label,
      color: thresholds.color,
      action: thresholds.action,
      values: { systolic, diastolic },
      isCritical: level === 'critical' || level === 'high',
      emergencySignals: disease.emergencySignals,
      lifestyle: disease.lifestyleGuide,
      tcmAdvice: disease.tcmAdvice,
    };
  },

  /**
   * 风险分级 — DM (fasting/random glucose)
   */
  assessDM(fasting, random) {
    const disease = CHRONIC_DISEASES.DM;
    const level = disease.classifyGlucose(fasting, random);
    const thresholds = disease.riskThresholds[level];
    return {
      disease: 'DM',
      diseaseName: '糖尿病',
      level,
      label: thresholds.label,
      color: thresholds.color,
      action: thresholds.action,
      values: { fasting, random },
      isCritical: level === 'critical' || level === 'high',
      emergencySignals: disease.emergencySignals,
      lifestyle: disease.lifestyleGuide,
      tcmAdvice: disease.tcmAdvice,
    };
  },

  /**
   * 风险分级 — INS (sleep hours)
   */
  assessINS(sleepHours) {
    const disease = CHRONIC_DISEASES.INS;
    const level = disease.classifySleep(sleepHours);
    const thresholds = disease.riskThresholds[level];
    return {
      disease: 'INS',
      diseaseName: '失眠',
      level,
      label: thresholds.label,
      color: thresholds.color,
      action: thresholds.action,
      values: { sleepHours },
      isCritical: level === 'critical' || level === 'high',
      emergencySignals: disease.emergencySignals,
      lifestyle: disease.lifestyleGuide,
      tcmAdvice: disease.tcmAdvice,
    };
  },

  /**
   * 风险分级 — COPD (SpO2/respiratory rate)
   */
  assessCOPD(spo2, respiratoryRate) {
    const disease = CHRONIC_DISEASES.COPD;
    const level = disease.classifyVitals(spo2, respiratoryRate);
    const thresholds = disease.riskThresholds[level];
    return {
      disease: 'COPD',
      diseaseName: '慢阻肺',
      level,
      label: thresholds.label,
      color: thresholds.color,
      action: thresholds.action,
      values: { spo2, respiratoryRate },
      isCritical: level === 'critical' || level === 'high',
      emergencySignals: disease.emergencySignals,
      lifestyle: disease.lifestyleGuide,
      tcmAdvice: disease.tcmAdvice,
    };
  },

  /**
   * 通用评估路由
   */
  assess(diseaseId, vitals) {
    switch (diseaseId) {
      case 'HTN':  return this.assessHTN(vitals.systolic, vitals.diastolic);
      case 'DM':   return this.assessDM(vitals.fasting, vitals.random);
      case 'INS':  return this.assessINS(vitals.sleepHours);
      case 'COPD': return this.assessCOPD(vitals.spo2, vitals.respiratoryRate);
      default:     return null;
    }
  },

  /**
   * 获取疾病用药提醒
   */
  getMedSchedule(diseaseId) {
    return CHRONIC_DISEASES[diseaseId]?.medSchedule || [];
  },

  /**
   * 获取疾病 TCM 养生指导
   */
  getTcmAdvice(diseaseId) {
    return CHRONIC_DISEASES[diseaseId]?.tcmAdvice || null;
  },

  /**
   * 获取疾病生活指导
   */
  getLifestyleGuide(diseaseId) {
    return CHRONIC_DISEASES[diseaseId]?.lifestyleGuide || null;
  },

  /**
   * 格式化风险等级（前端展示用）
   */
  formatRiskLevel(result) {
    if (!result) return null;
    return {
      disease: result.diseaseName,
      level: result.level,
      label: result.label,
      color: result.color,
      action: result.action,
      isCritical: result.isCritical,
      values: result.values,
    };
  },

  /**
   * 是否需要触发 SOS
   */
  shouldSOS(result) {
    return result?.isCritical || false;
  },
};
