/**
 * ================================================================
 * 命理宝鉴 · 会员推送计划系统 (push-plan.js)
 * 
 * 功能：推送内容分级、推送时间矩阵、跨年推送、引流转化设计
 * 依赖：无外部依赖，纯数据+渲染模块
 * 
 * 引用古籍：
 * - 《协纪辨方书》《钦定协纪辨方书》——黄历宜忌
 * - 《三历撮要》——吉时选择
 * - 《黄帝内经·素问》——节气养生
 * - 《玉匣记》——民俗吉日
 * - 《滴天髓》《子平真诠》——命理化解
 * ================================================================
 */

// ================================================================
// 一、推送会员等级定义
// ================================================================
const PUSH_PLAN = {
  /* ---- 会员等级 ---- */
  tiers: {
    free: {
      name: '缘主',
      color: '#8a7d60',
      icon: '🟐',
      features: [
        '每日宜忌推送（基础版，仅3个吉时）',
        '黄历查看',
        '基础排盘 3次/天',
        '知识库浏览',
        '节日祝福推送'
      ],
      restrictions: [
        '不显示完整化解方案',
        '不显示完整吉时（仅3/6个）',
        '不显示财运方位具体布局',
        '无月运报告',
        '无年度运程',
        '无个性化化煞方案'
      ]
    },
    annual: {
      name: '年度会员',
      color: '#c9a84c',
      icon: '🥇',
      features: [
        '每日完整推送（四板块全量）',
        '全部6个吉时显示',
        '财运方位+催财布局',
        '月运报告（每月1号）',
        '节气专题推送（前1天）',
        '传统节日专题推送',
        '年度运程总览（立春前7天）',
        '个性化化解方案',
        '完整化解建议（含物品、时辰、方位）'
      ],
      restrictions: [
        '无家庭成员运程',
        '无专属化煞方案',
        '无跨年化解衔接方案'
      ]
    },
    lifetime: {
      name: '终身会员',
      color: '#e74c3c',
      icon: '👑',
      features: [
        '年度会员全部内容',
        '家庭成员运程推送（最多6人）',
        '专属化煞方案（个性化定制）',
        '跨年化解衔接方案',
        '立春当日完整年度化解方案',
        '流年切换物品准备清单',
        '一对一真人解读（8次/月）',
        '专属客服通道',
        '开运物品折扣'
      ],
      restrictions: []
    }
  },

  /* ================================================================
   * 二、每日推送时间矩阵
   * ================================================================ */
  dailySchedule: [
    {
      time: '07:30',
      type: 'daily_morning',
      title: '每日宜忌 · 静观天时',
      icon: '🌅',
      tiers: ['free', 'annual', 'lifetime'],
      content: {
        free: {
          headline: '早安，缘主！今日天象已更新',
          blocks: [
            '🔮 鉴运知变：今日人生阶段概览（基础版）',
            '🧭 顺天应时：宜忌摘要 + 3个吉时（升级解锁全部6个）',
            '🙏 敬天法祖：今日参拜指南精简版',
            '📿 修己安人：今日修行口诀'
          ],
          upgradeHint: '您的今日吉时仅显示3个，升级会员解锁全部6个吉时 + 完整化解方案'
        },
        annual: {
          headline: '早安！今日完整运程已为您备好',
          blocks: [
            '🔮 鉴运知变：人生阶段（十二长生+干喜支忌）+ 健康预警 + 本命佛 + 运势评分 + 化解建议',
            '🧭 顺天应时：完整宜忌 + 财神喜神方位（含具体用途）+ 全部6个吉时 + 穿搭（节气+五行色）+ 饮食 + 五行养生',
            '🙏 敬天法祖：佛道儒节日 + 参拜指南（完整版）+ 近7天提醒 + 今晚准备 + 节气养生',
            '📿 修己安人：修行口诀 + 正念 + 咒语（注音）+ 三元九运 + 鼓励语'
          ]
        },
        lifetime: {
          headline: '早安！今日天机全鉴 + 家庭运程',
          blocks: [
            '🔮 鉴运知变：完整四板块 + 家庭成员今日运势摘要',
            '🧭 顺天应时：完整宜忌 + 方位 + 吉时 + 穿搭 + 饮食 + 五行养生 + 专属化煞时辰',
            '🙏 敬天法祖：完整参拜指南 + 家庭祈福建议 + 专属法事提醒',
            '📿 修己安人：修行口诀 + 个性化咒语 + 家庭共修建议 + 三元九运 + 鼓励语'
          ]
        }
      },
      source: '《协纪辨方书》《三历撮要》',
      disclaimer: '国学文化演绎，个人参考。非医疗诊断，不替代专业意见。'
    },
    {
      time: '18:00',
      type: 'daily_evening',
      title: '晚间提醒 · 日省吾身',
      icon: '🌆',
      tiers: ['annual', 'lifetime'],
      content: {
        annual: {
          headline: '今日将尽，宜省身修心',
          blocks: [
            '📿 今日修行回顾：是否践行口诀？',
            '🧭 明日吉时预告：提前规划',
            '🙏 今晚宜做：诵持 / 冥想 / 静坐（含具体时辰）',
            '💊 今日五行养生复盘：器官养护建议'
          ]
        },
        lifetime: {
          headline: '日省吾身 · 家运同修',
          blocks: [
            '📿 今日修行回顾 + 家庭共修建议',
            '🧭 明日吉时预告 + 家庭成员运势提醒',
            '🙏 今晚宜做：家庭诵持 / 供灯 / 静坐（含专属时辰）',
            '💊 今日五行养生复盘 + 家庭成员健康提醒',
            '📿 专属化煞方案执行进度'
          ]
        }
      },
      source: '《黄帝内经·素问》「日西而阳气衰，早卧早起」',
      disclaimer: '国学文化演绎，个人参考。'
    }
  ],

  /* ================================================================
   * 三、节气推送（24节气，前1天推送）
   * ================================================================ */
  solarTerms: [
    {
      name: '立春', date: '02-04', icon: '🌱',
      title: '立春 · 万物复苏，一年之计始于此',
     养生: {
        diet: '宜食辛甘发散之物：葱、姜、韭菜、香菜。《素问》云："春三月，此谓发陈，天地俱生，万物以荣。"宜省酸增甘，以养脾气。',
        lifestyle: '夜卧早起，广步于庭。披发缓形，以使志生。生而勿杀，予而勿夺，赏而勿罚。',
        exercise: '宜拉伸筋骨、舒展肝气。练习八段锦「调理脾胃须单举」「攒拳怒目增气力」。',
        taboo: '忌怒、忌郁结。春属木，主肝，怒伤肝。'
      },
      fortune: '立春为流年切换之始，太岁当值。冲犯太岁者需在此日拜太岁、安太岁。流年运势自此日重新计算。',
      memberExtra: '立春当日完整年度化解方案（终身会员专属）',
      tiers: ['annual', 'lifetime'],
      source: '《协纪辨方书》《黄帝内经·素问·四气调神大论》'
    },
    {
      name: '雨水', date: '02-19', icon: '🌧️',
      title: '雨水 · 天降甘霖，润物无声',
      养生: {
        diet: '宜食红枣、山药、莲子以健脾祛湿。少食生冷。',
        lifestyle: '防寒湿，注意保暖。早睡早起，避风寒。',
        exercise: '宜舒缓运动，避免大汗。',
        taboo: '忌过食寒凉，损伤脾胃阳气。'
      },
      fortune: '雨水节气，水气渐旺。命局喜水者运势上扬，忌水者需注意肾、膀胱健康。',
      memberExtra: '个人五行喜忌与节气关系分析',
      tiers: ['annual', 'lifetime'],
      source: '《素问》「湿气通于脾」'
    },
    {
      name: '惊蛰', date: '03-05', icon: '⚡',
      title: '惊蛰 · 春雷乍响，蛰虫始振',
      养生: {
        diet: '宜食梨润肺，百合安神。忌辛辣燥热。',
        lifestyle: '夜卧早起，晨起叩齿三十六通。',
        exercise: '宜放风筝、踏青，舒展肝气。',
        taboo: '忌熬夜伤肝，忌情绪激动。'
      },
      fortune: '惊蛰雷动，阳气升发。事业易有变动，宜积极进取。命局木旺者需防过刚易折。',
      memberExtra: '惊蛰化煞方案：安神符 + 肝经穴位按摩',
      tiers: ['annual', 'lifetime'],
      source: '《月令七十二候集解》「万物出乎震，震为雷」'
    },
    {
      name: '春分', date: '03-20', icon: '🌸',
      title: '春分 · 阴阳相半，昼夜均平',
      养生: {
        diet: '宜食春菜（荠菜、香椿），养肝健脾。',
        lifestyle: '春分者，阴阳相半也，故昼夜均而寒暑平。宜调阴阳。',
        exercise: '宜放风筝、散步，平衡阴阳。',
        taboo: '忌偏寒偏热，忌大喜大怒。'
      },
      fortune: '春分阴阳平衡，宜调和人际关系。婚姻宫动者宜在此节气订婚、结婚。',
      memberExtra: '春分和合法事：促进夫妻/恋人和谐',
      tiers: ['annual', 'lifetime'],
      source: '《春秋繁露》「春分者，阴阳相半也」'
    },
    {
      name: '清明', date: '04-05', icon: '🌿',
      title: '清明 · 慎终追远，踏青抒怀',
      养生: {
        diet: '宜食青团、清明果。柔肝养肺。',
        lifestyle: '扫墓祭祖，踏青郊游。抒发肝气。',
        exercise: '宜户外散步、太极。',
        taboo: '忌过度悲伤，伤及肺气。'
      },
      fortune: '清明祭祖得先人庇佑。命局印星为用者运势提升。',
      memberExtra: '清明祭祖时辰选择 + 方位建议',
      tiers: ['annual', 'lifetime'],
      source: '《岁时百问》「万物生长此时，皆清洁而明净」'
    },
    {
      name: '谷雨', date: '04-20', icon: '🌾',
      title: '谷雨 · 雨生百谷，湿气渐盛',
      养生: {
        diet: '宜食薏米、赤小豆祛湿。健脾化湿。',
        lifestyle: '防湿邪侵入，注意关节保暖。',
        exercise: '宜动不宜静，微汗为度。',
        taboo: '忌居潮湿之地，忌过食甜腻。'
      },
      fortune: '谷雨湿气重，命局土弱者需注意脾胃健康。财运宜守不宜攻。',
      memberExtra: '谷雨祛湿食疗方 + 个人脾胃五行调护',
      tiers: ['annual', 'lifetime'],
      source: '《群芳谱》「谷雨，谷得雨而生也」'
    },
    {
      name: '立夏', date: '05-05', icon: '☀️',
      title: '立夏 · 夏始之时，养心为要',
      养生: {
        diet: '宜食苦味养心：苦瓜、莲子心。忌过食冰品。',
        lifestyle: '夜卧早起，无厌于日。使志无怒，使华英成秀。',
        exercise: '宜游泳、慢跑，适度出汗。',
        taboo: '忌大汗淋漓，耗伤心阴。'
      },
      fortune: '立夏火气初生，命局喜火者运势上扬。忌火者需注意心血管健康。',
      memberExtra: '立夏养心方案：穴位 + 饮食 + 起居全攻略',
      tiers: ['annual', 'lifetime'],
      source: '《素问·四气调神大论》「夏三月，此谓蕃秀」'
    },
    {
      name: '小满', date: '05-21', icon: '🔆',
      title: '小满 · 物至于此小得盈满',
      养生: {
        diet: '宜食绿豆、冬瓜清热利湿。',
        lifestyle: '防湿热，保持心情舒畅。',
        exercise: '宜清晨运动，避开烈日。',
        taboo: '忌贪凉饮冷，损伤脾胃。'
      },
      fortune: '小满意为"小得盈满"，事业有小成。宜守不宜贪。',
      memberExtra: '小满财运分析 + 投资建议',
      tiers: ['annual', 'lifetime'],
      source: '《月令七十二候集解》「小满者，物至于此小得盈满」'
    },
    {
      name: '芒种', date: '06-06', icon: '🌿',
      title: '芒种 · 有芒之谷可种',
      养生: {
        diet: '宜食酸梅汤、薏仁水。清热祛湿。',
        lifestyle: '注意午休，养心气。',
        exercise: '宜游泳、太极，避免大汗。',
        taboo: '忌房事过度，耗伤肾精。'
      },
      fortune: '芒种忙碌之象，事业多任务并行。命局身旺者大利，身弱者需量力而行。',
      memberExtra: '芒种忙中有序：个人时间管理方位建议',
      tiers: ['annual', 'lifetime'],
      source: '《月令七十二候集解》'
    },
    {
      name: '夏至', date: '06-21', icon: '🌞',
      title: '夏至 · 阳极阴生，养心护阳',
      养生: {
        diet: '宜食面条、荷叶粥。冬至饺子夏至面。',
        lifestyle: '夏至一阴生，宜静养。午时（11-13点）小憩。',
        exercise: '宜清晨或傍晚运动，忌午间烈日。',
        taboo: '忌冷水洗澡，忌过食冰品。'
      },
      fortune: '夏至阳极阴生，命局阳亢者需防物极必反。宜守不宜攻。',
      memberExtra: '夏至养心护阳方案 + 个人命局阴阳平衡分析',
      tiers: ['annual', 'lifetime'],
      source: '《素问》「夏至一阴生」'
    },
    {
      name: '小暑', date: '07-07', icon: '🔥',
      title: '小暑 · 暑气始至，伏天将临',
      养生: {
        diet: '宜食西瓜、绿豆汤消暑。饮食清淡。',
        lifestyle: '防中暑，多饮水。心静自然凉。',
        exercise: '宜室内运动，瑜伽、太极。',
        taboo: '忌午间外出，忌暴饮暴食。'
      },
      fortune: '小暑火土渐旺，命局火土为忌者需注意肠胃、皮肤问题。',
      memberExtra: '小暑消暑方案：个人五行消暑饮品推荐',
      tiers: ['annual', 'lifetime'],
      source: '《月令七十二候集解》「暑，热也」'
    },
    {
      name: '大暑', date: '07-23', icon: '🌡️',
      title: '大暑 · 一年最热，湿热交蒸',
      养生: {
        diet: '宜食薏米红豆汤、丝瓜。清热祛湿为主。',
        lifestyle: '三伏天宜冬病夏治，艾灸最佳。',
        exercise: '宜清晨极缓运动，忌大汗。',
        taboo: '忌贪凉，忌辛辣油腻。'
      },
      fortune: '大暑湿气最重，命局湿气重者需格外注意脾胃。财运宜守。',
      memberExtra: '三伏艾灸方案（含个人穴位选择） + 冬病夏治指导',
      tiers: ['annual', 'lifetime'],
      source: '《素问》「土主中央，其色黄，其性湿」'
    },
    {
      name: '立秋', date: '08-08', icon: '🍂',
      title: '立秋 · 秋始之时，养肺为先',
      养生: {
        diet: '宜食百合、银耳、秋梨。润肺生津。《素问》云："秋三月，此谓容平。"',
        lifestyle: '早卧早起，与鸡俱兴。使志安宁，以缓秋刑。',
        exercise: '宜登高望远、练习吐纳。',
        taboo: '忌悲伤过度，悲则气消伤肺。'
      },
      fortune: '立秋金气初生，命局喜金者运势转好。忌金者注意呼吸道健康。',
      memberExtra: '立秋养肺方案：穴位按摩 + 食疗 + 秋季运势分析',
      tiers: ['annual', 'lifetime'],
      source: '《素问·四气调神大论》'
    },
    {
      name: '处暑', date: '08-23', icon: '🌤️',
      title: '处暑 · 暑气止矣，秋凉渐至',
      养生: {
        diet: '宜食蜂蜜、芝麻滋阴润燥。',
        lifestyle: '防秋燥，多饮水。调整作息，早睡早起。',
        exercise: '宜户外运动，登高、慢跑。',
        taboo: '忌辛辣燥热，忌熬夜。'
      },
      fortune: '处暑暑气止，事业困顿者将迎转机。命局喜金水者渐入佳境。',
      memberExtra: '处暑转机分析：个人运势转折点预测',
      tiers: ['annual', 'lifetime'],
      source: '《月令七十二候集解》「处，止也」'
    },
    {
      name: '白露', date: '09-08', icon: '💧',
      title: '白露 · 露凝而白，秋意渐浓',
      养生: {
        diet: '宜食莲藕、山药、白果。白色入肺。',
        lifestyle: '白露身不露，注意保暖。防寒气侵入。',
        exercise: '宜慢跑、太极，增强肺气。',
        taboo: '忌赤膊露体，忌过食寒凉。'
      },
      fortune: '白露金气渐旺，财运渐显。命局金为财星者投资运势上扬。',
      memberExtra: '白露财运分析 + 个人投资方位建议',
      tiers: ['annual', 'lifetime'],
      source: '《诗经》「蒹葭苍苍，白露为霜」'
    },
    {
      name: '秋分', date: '09-23', icon: '🍁',
      title: '秋分 · 阴阳相半，秋收之时',
      养生: {
        diet: '宜食柿子、栗子、山药。养胃润肺。',
        lifestyle: '秋分阴阳平，宜调和情志。',
        exercise: '宜登高、赏菊、太极。',
        taboo: '忌大喜大悲，忌寒温不调。'
      },
      fortune: '秋分阴阳平衡，宜决断大事。事业宜收不宜放。',
      memberExtra: '秋分决策吉时 + 个人命局贵人方位',
      tiers: ['annual', 'lifetime'],
      source: '《春秋繁露》「秋分者，阴阳相半也」'
    },
    {
      name: '寒露', date: '10-08', icon: '❄️',
      title: '寒露 · 露气寒冷，将凝结成霜',
      养生: {
        diet: '宜食芝麻、糯米、蜂蜜。滋阴润肺。',
        lifestyle: '防寒保暖，注意足部。寒从脚下起。',
        exercise: '宜室内运动，泡脚暖身。',
        taboo: '忌赤脚，忌过食生冷。'
      },
      fortune: '寒露寒气渐重，命局寒性体质者注意关节、肾膀胱健康。',
      memberExtra: '寒露暖身方案：个人体质泡脚配方 + 艾灸穴位',
      tiers: ['annual', 'lifetime'],
      source: '《月令七十二候集解》'
    },
    {
      name: '霜降', date: '10-23', icon: '🧊',
      title: '霜降 · 气肃而凝，露结为霜',
      养生: {
        diet: '宜食柿子、白萝卜。润肺化痰。',
        lifestyle: '防秋燥转冬寒，添衣保暖。',
        exercise: '宜舒缓运动，保持气血流通。',
        taboo: '忌剧烈运动后受寒。'
      },
      fortune: '霜降为秋冬过渡，运势多变动。命局喜火者需补火暖身。',
      memberExtra: '霜降暖身补火方案：个人命局五行调候',
      tiers: ['annual', 'lifetime'],
      source: '《二十四节气解》「气肃而霜降」'
    },
    {
      name: '立冬', date: '11-07', icon: '🌬️',
      title: '立冬 · 冬始之时，养藏为道',
      养生: {
        diet: '宜食羊肉、核桃、栗子。温补养肾。《素问》云："冬三月，此谓闭藏。"',
        lifestyle: '早卧晚起，必待日光。去寒就温，无泄皮肤。',
        exercise: '宜室内运动，太极、八段锦。',
        taboo: '忌出汗过多，冬不藏精。'
      },
      fortune: '立冬水气初生，命局喜水者运势上扬。忌水者注意肾、膀胱、生殖系统。',
      memberExtra: '立冬养肾方案：食疗 + 穴位 + 起居全攻略',
      tiers: ['annual', 'lifetime'],
      source: '《素问·四气调神大论》「冬三月，此谓闭藏」'
    },
    {
      name: '小雪', date: '11-22', icon: '🌨️',
      title: '小雪 · 闭塞而成冬，养精蓄锐',
      养生: {
        diet: '宜食黑芝麻、黑豆、黑木耳。黑色入肾。',
        lifestyle: '防抑郁，多晒太阳。保持心情愉快。',
        exercise: '宜室内有氧，瑜伽。',
        taboo: '忌房劳过度，冬不藏精。'
      },
      fortune: '小雪阴气渐重，命局阴寒者需注意情绪低落。宜补火暖身。',
      memberExtra: '小雪暖心情志调护方案：芳香疗法 + 命局补火',
      tiers: ['annual', 'lifetime'],
      source: '《月令七十二候集解》'
    },
    {
      name: '大雪', date: '12-07', icon: '⛄',
      title: '大雪 · 鹖鴠不鸣，万物潜藏',
      养生: {
        diet: '宜食当归生姜羊肉汤。温补气血。',
        lifestyle: '大雪宜冬补，但需因人而异。阴虚者不宜大补。',
        exercise: '宜室内慢运动，忌大汗。',
        taboo: '忌盲目进补，忌生冷。'
      },
      fortune: '大雪水气最旺，命局水旺者需防水多木漂。财运宜守。',
      memberExtra: '大雪个人进补方案：体质辨识 + 食疗推荐',
      tiers: ['annual', 'lifetime'],
      source: '《素问》「北方黑色，入通于肾」'
    },
    {
      name: '冬至', date: '12-22', icon: '🕯️',
      title: '冬至 · 阴极阳生，一阳来复',
      养生: {
        diet: '宜食饺子（北方）、汤圆（南方）。冬至大如年。',
        lifestyle: '冬至一阳生，宜静养守阳。子时（23-1点）宜入静。',
        exercise: '宜打坐、站桩，养先天之气。',
        taboo: '忌行房事，忌过度劳累。冬至如过年，宜家人团聚。'
      },
      fortune: '冬至一阳生，运势转折点。命局阳虚者自此转运。冬至日祈福效果最佳。',
      memberExtra: '冬至祈福时辰 + 一阳来复养生法 + 新年化解方案预告',
      tiers: ['annual', 'lifetime'],
      source: '《素问》「冬至一阳生」《周易》「复其见天地之心乎」'
    },
    {
      name: '小寒', date: '01-05', icon: '🥶',
      title: '小寒 · 寒气积久，岁寒知松柏',
      养生: {
        diet: '宜食腊八粥。五谷杂粮养脾胃。',
        lifestyle: '防寒保暖为主，尤其腰腹足部。',
        exercise: '宜室内八段锦、太极。',
        taboo: '忌出汗当风，忌过食寒凉。'
      },
      fortune: '小寒至冷，但阳气已生。命局寒极者宜静待转机。',
      memberExtra: '小寒年度化解方案启动指南 + 个人运势预热分析',
      tiers: ['annual', 'lifetime'],
      source: '《月令七十二候集解》「月初寒尚小」'
    },
    {
      name: '大寒', date: '01-20', icon: '🏔️',
      title: '大寒 · 寒至极矣，立春将临',
      养生: {
        diet: '宜食当归、黄芪炖鸡。补气养血迎立春。',
        lifestyle: '大寒宜准备立春化煞物品。扫尘除旧迎新。',
        exercise: '宜舒展运动，迎接春天。',
        taboo: '忌惰怠，宜积极准备新年。'
      },
      fortune: '大寒为岁末最后一个节气，宜总结今年、规划来年。立春前准备就绪。',
      memberExtra: '大寒立春前准备清单 + 个性化化煞时辰 + 物品准备指导',
      tiers: ['annual', 'lifetime'],
      source: '《授时通考》「大寒为中者，上形于小寒」'
    }
  ],

  /* ================================================================
   * 四、传统节日推送
   * ================================================================ */
  festivals: [
    {
      name: '春节', date: '正月初一', icon: '🧧',
      title: '春节 · 新岁伊始，万象更新',
      type: 'all',  // 推送给所有用户
      content: {
        all: {
          greeting: '新春大吉！财神驾到，福禄寿喜齐聚门庭',
          blocks: [
            '🧧 新年第一推：本年度流年概览（基础版）',
            '🙏 春节参拜指南：正月初一拜太岁 + 财神方位',
            '🧭 初一至初七每日宜忌速览',
            '📿 新年开运口诀：紫微大帝咒（注音版）'
          ]
        },
        free: {
          upgradeHint: '您的流年化煞指南已生成，升级查看完整方案 + 专属化煞时辰'
        },
        annual: {
          extra: '完整流年化解方案 + 正月每日运势详解 + 财神催财布局'
        },
        lifetime: {
          extra: '家庭新年化煞方案 + 全家流年运程 + 专属化煞物品清单'
        }
      },
      source: '《协纪辨方书》《玉匣记》'
    },
    {
      name: '元宵节', date: '正月十五', icon: '🏮',
      title: '元宵 · 天官赐福，月圆人圆',
      type: 'all',
      content: {
        all: {
          greeting: '元宵佳节，天官赐福！上元天官降临，赐福消灾',
          blocks: [
            '🏮 上元天官大帝圣诞：参拜指南',
            '🙏 天官赐福法事：发愿 + 诵经 + 供灯',
            '🧭 元宵节吉时：赏月最佳时辰',
            '📿 天官赐福咒：消灾延寿'
          ]
        },
        free: {
          upgradeHint: '天官赐福完整法事流程，升级会员解锁'
        },
        annual: {
          extra: '天官赐福完整参拜流程 + 个人福位方向 + 上元节点化煞'
        },
        lifetime: {
          extra: '家庭天官赐福法事 + 全家祈福供灯方案'
        }
      },
      source: '《三元品戒经》「上元正月十五天官赐福」'
    },
    {
      name: '清明节', date: '阳历04-05', icon: '🌿',
      title: '清明 · 慎终追远，祭祖祈福',
      type: 'all',
      content: {
        all: {
          greeting: '清明时节，慎终追远。祭祖得福，先人庇佑',
          blocks: [
            '🌿 清明祭祖时辰选择（基础版）',
            '🙏 祭祖流程：上香 → 献花 → 诵经 → 祈福',
            '🧭 清明扫墓方位与禁忌',
            '📿 地藏菩萨心咒：超度先人'
          ]
        },
        free: {
          upgradeHint: '您的祭祖吉时已生成，升级查看专属时辰 + 家族风水建议'
        },
        annual: {
          extra: '个人命局祭祖吉时 + 祖坟风水简易指南 + 先人庇佑方位'
        },
        lifetime: {
          extra: '家族祖坟风水完整分析 + 祭祖化煞方案 + 家族运势提升'
        }
      },
      source: '《岁时百问》《葬书》'
    },
    {
      name: '端午节', date: '五月初五', icon: '🐉',
      title: '端午 · 驱邪避瘟，正气浩然',
      type: 'all',
      content: {
        all: {
          greeting: '端午安康！五毒退散，正气护身',
          blocks: [
            '🐉 端午驱邪：挂艾草、佩香囊、系五彩绳',
            '🙏 端午参拜：关帝圣君圣诞',
            '🧭 端午午时水：采水方位与时辰',
            '📿 端午辟邪咒：净天地神咒'
          ]
        },
        free: {
          upgradeHint: '端午辟邪完整方案已生成，升级查看个人化煞物品'
        },
        annual: {
          extra: '个人命局端午辟邪方案 + 五毒月养生 + 香囊配方'
        },
        lifetime: {
          extra: '家庭端午化煞方案 + 全家辟邪物品定制'
        }
      },
      source: '《荆楚岁时记》《玉匣记》'
    },
    {
      name: '中元节', date: '七月十五', icon: '🙏',
      title: '中元 · 地官赦罪，普度众生',
      type: 'all',
      content: {
        all: {
          greeting: '中元节至，地官赦罪。诵经回向，福报无边',
          blocks: [
            '🙏 中元地官大帝圣诞：赦罪法事',
            '📿 地藏菩萨本愿经：诵经回向先人',
            '🧭 中元节禁忌：夜间不宜外出（特定时辰）',
            '🕯️ 普度供灯：为先人照亮冥途'
          ]
        },
        free: {
          upgradeHint: '中元赦罪完整法事流程，升级解锁'
        },
        annual: {
          extra: '个人命局中元化煞 + 诵经回向方案 + 先人超度指导'
        },
        lifetime: {
          extra: '家族超度法事 + 祖先风水调整 + 家族业障化解'
        }
      },
      source: '《三元品戒经》「中元七月十五地官赦罪」'
    },
    {
      name: '中秋节', date: '八月十五', icon: '🌕',
      title: '中秋 · 月圆人圆，太阴星君圣诞',
      type: 'all',
      content: {
        all: {
          greeting: '中秋团圆！太阴星君圣诞，拜月祈福',
          blocks: [
            '🌕 拜月祈福：太阴星君圣诞参拜指南',
            '🙏 月老牵线：单身者拜月求姻缘',
            '🧭 中秋赏月吉时与方位',
            '📿 太阴星君宝诰：诵持祈福'
          ]
        },
        free: {
          upgradeHint: '拜月祈福完整流程 + 姻缘方位，升级解锁'
        },
        annual: {
          extra: '个人命局拜月方案 + 姻缘方位 + 中秋财运分析'
        },
        lifetime: {
          extra: '家庭拜月祈福 + 夫妻和合方案 + 子女姻缘预测'
        }
      },
      source: '《太上洞房内经》《礼记》「天子春朝日，秋夕月」'
    },
    {
      name: '重阳节', date: '九月初九', icon: '🏔️',
      title: '重阳 · 登高望远，敬老延寿',
      type: 'all',
      content: {
        all: {
          greeting: '重阳登高！敬老延寿，斗母星君圣诞',
          blocks: [
            '🏔️ 重阳登高：方位选择与运势提升',
            '🙏 斗母星君圣诞：消灾延寿法事',
            '🧵 重阳佩茱萸：驱邪避瘟',
            '📿 斗母宝诰：诵持延寿'
          ]
        },
        free: {
          upgradeHint: '重阳延寿完整法事 + 登高方位，升级解锁'
        },
        annual: {
          extra: '个人命局重阳延寿方案 + 父母健康祈福 + 登高方位'
        },
        lifetime: {
          extra: '家族延寿祈福 + 父母命理化解 + 家庭登高吉方'
        }
      },
      source: '《玉匣记》《太上玄门斗姆元君本命延生心经》'
    },
    {
      name: '冬至', date: '阳历12-22', icon: '🕯️',
      title: '冬至 · 冬至大如年，一阳来复',
      type: 'all',
      content: {
        all: {
          greeting: '冬至大如年！一阳来复，万象更新',
          blocks: [
            '🕯️ 冬至一阳生：子时入静养生法',
            '🙏 冬至祭祖：与清明同等重要',
            '🧭 冬至日影：测算来年运势',
            '📿 复卦卦辞：「复其见天地之心乎」'
          ]
        },
        free: {
          upgradeHint: '冬至一阳来复养生法完整版 + 来年运势预告，升级解锁'
        },
        annual: {
          extra: '冬至一阳养生完整方案 + 来年运势总览预告 + 祭祖吉时'
        },
        lifetime: {
          extra: '冬至家族祭祖 + 来年全家运势 + 新年化解方案预告'
        }
      },
      source: '《周易》复卦《素问》「冬至一阳生」'
    }
  ],

  /* ================================================================
   * 五、月运推送（每月1号）
   * ================================================================ */
  monthly: {
    schedule: '每月1号 08:00',
    title: '月运报告 · 流月天机',
    icon: '🌙',
    tiers: ['annual', 'lifetime'],
    content: {
      annual: {
        blocks: [
          '🌙 流月天干地支解析：本月天机主线',
          '🔮 人生阶段：本月十二长生运程',
          '💰 财运分析：正财/偏财/投资方位',
          '❤️ 感情运势：桃花/婚姻/人际',
          '💊 健康预警：五行器官养护重点',
          '⚡ 关键日期：本月吉日与凶日标注',
          '🧭 方位布局：本月财位/喜位/病位',
          '📿 化解建议：针对性化煞方案'
        ]
      },
      lifetime: {
        blocks: [
          '🌙 流月完整解析（含纳音、神煞）',
          '🔮 个人人生阶段 + 家庭成员月运',
          '💰 财运分析 + 投资策略 + 家族财务建议',
          '❤️ 感情运势 + 家庭关系 + 子女运势',
          '💊 健康预警 + 家庭成员健康提醒',
          '⚡ 关键日期 + 流月冲克分析',
          '🧭 方位布局 + 家庭风水调整',
          '📿 个性化化解方案 + 专属化煞时辰',
          '📋 月度执行清单：本月化煞物品、时辰、方位汇总'
        ]
      }
    },
    source: '《滴天髓》《子平真诠》流月分析法'
  },

  /* ================================================================
   * 六、年度推送（含跨年）
   * ================================================================ */
  annual: [
    /* ---- 跨年前（公历12月）---- */
    {
      date: '12-15',
      type: 'annual_review',
      title: '年度运势回顾报告',
      icon: '📊',
      tiers: ['annual', 'lifetime'],
      content: {
        annual: {
          blocks: [
            '📊 本年度流年干支回顾：天干地支与命局互动总结',
            '💰 财运回顾：正财/偏财收支分析',
            '❤️ 感情回顾：桃花/婚姻年度总结',
            '💊 健康回顾：五行器官健康年度报告',
            '⚡ 大事记：本年度关键节点回顾',
            '🔮 下年度流年预告：天干地支转换影响'
          ]
        },
        lifetime: {
          blocks: [
            '📊 完整年度回顾（含家庭成员）',
            '💰 家族财运年度报告',
            '❤️ 家庭关系年度总结',
            '💊 家庭健康年度报告',
            '⚡ 大事记 + 化解效果评估',
            '🔮 下年度流年预告 + 家庭成员影响分析',
            '📋 年度化解方案执行复盘'
          ]
        }
      },
      source: '《滴天髓》流年分析法'
    },
    {
      date: '12-22',
      type: 'winter_solstice',
      title: '冬至养生专题 + 新年化解方案预告',
      icon: '🕯️',
      tiers: ['annual', 'lifetime'],
      content: {
        annual: {
          blocks: [
            '🕯️ 冬至一阳来复：子时静坐养生法（完整版）',
            '🥟 冬至食养：饺子/汤圆的五行意义',
            '🙏 冬至祭祖：全年最重要的祭祖日',
            '🔮 一阳来复与个人命局：来年运势起点分析',
            '📋 新年化解方案预告：立春将推出完整方案'
          ]
        },
        lifetime: {
          blocks: [
            '🕯️ 冬至一阳来复：家族共修静坐法',
            '🥟 冬至家族食养方案',
            '🙏 冬至家族祭祖完整流程',
            '🔮 一阳来复与全家命局：来年运势起点',
            '📋 新年化解方案预告 + 专属化煞物品准备清单',
            '⏰ 个性化化煞时辰：冬至至立春关键时间节点'
          ]
        }
      },
      source: '《周易》复卦《素问》「冬至一阳生」'
    },
    {
      date: '12-28',
      type: 'new_year_prep',
      title: '新年化煞物品准备清单',
      icon: '📋',
      tiers: ['lifetime'],
      content: {
        lifetime: {
          blocks: [
            '📋 专属化煞物品清单（根据个人命局定制）',
            '🧭 化煞物品摆放方位（根据家居风水）',
            '⏰ 化煞物品开光时辰（根据个人命局选择）',
            '💰 化煞物品采购预算与渠道',
            '🙏 化煞物品开光流程（可在家自行操作）',
            '📦 物品清单明细：',
            '  • 五行调和物（金/木/水/火/土各需何物）',
            '  • 化太岁符（冲犯太岁者必备）',
            '  • 财位催财物（根据流年财位）',
            '  • 桃花位布置物（单身/求姻缘者）',
            '  • 文昌位布置物（学子/考证者）',
            '  • 健康化煞物（根据个人健康预警）',
            '  • 家人专属物品（每位家庭成员）'
          ]
        }
      },
      source: '《玉匣记》《阳宅三要》化煞物品选择法'
    },
    {
      date: '12-31',
      type: 'new_year_eve_gregorian',
      title: '跨年祝福 + 流年交接提醒',
      icon: '🎉',
      tiers: ['annual', 'lifetime'],
      content: {
        annual: {
          blocks: [
            '🎉 跨年祝福：辞旧迎新，一元复始',
            '🔮 今晚跨年吉时：最佳迎新时辰',
            '🙏 跨年祈福：简单的迎新仪式',
            '⚠️ 流年交接提醒：立春前注意事项',
            '📿 跨年诵持：消除一年业障的咒语'
          ]
        },
        lifetime: {
          blocks: [
            '🎉 跨年祝福 + 家庭迎新仪式',
            '🔮 今晚跨年专属吉时（根据命局）',
            '🙏 跨年祈福：家族迎新完整仪式',
            '⚠️ 流年交接提醒 + 家人注意事项',
            '📿 跨年家族诵持：消除一年业障',
            '📋 立春前最终准备清单确认'
          ]
        }
      },
      source: '《协纪辨方书》跨年择吉法'
    },

    /* ---- 跨年后（公历1月）---- */
    {
      date: '01-01',
      type: 'new_year_first',
      title: '新年第一推 · 本年度流年概览',
      icon: '🌅',
      tiers: ['annual', 'lifetime'],
      content: {
        annual: {
          blocks: [
            '🌅 新年第一推：元旦天象与流年概览',
            '🔮 本年度流年天干地支与命局互动总览',
            '💰 年度财运方向：正财/偏财大势',
            '❤️ 年度感情大势：桃花/婚姻走向',
            '💊 年度健康预警：五行器官重点',
            '⚡ 年度关键节点：重要月份标注',
            '🧭 年度方位：财位/喜位/病位/文昌位'
          ]
        },
        lifetime: {
          blocks: [
            '🌅 新年第一推 + 家庭流年全鉴',
            '🔮 全家流年干支互动分析',
            '💰 家族年度财运 + 投资策略',
            '❤️ 家庭关系 + 子女年度运势',
            '💊 家庭健康年度预警',
            '⚡ 年度关键节点 + 家庭大事规划',
            '🧭 年度方位 + 家庭风水布局方案',
            '📋 年度化解方案执行时间表'
          ]
        }
      },
      source: '《滴天髓》《子平真诠》流年总览法'
    },
    {
      date: '01-05',
      type: 'solar_term_xiaohan',
      title: '小寒 · 年度化解方案启动指南',
      icon: '🥶',
      tiers: ['annual', 'lifetime'],
      content: {
        annual: {
          blocks: [
            '🥶 小寒天象：寒气积久，阳气暗生',
            '📋 年度化解方案启动：本月需要完成的准备',
            '🧭 本月化煞方位与物品',
            '💰 小寒财运：年前最后的财运调整机会',
            '🙏 小寒祈福：为立春做准备'
          ]
        },
        lifetime: {
          blocks: [
            '🥶 小寒天象 + 家庭运势分析',
            '📋 年度化解方案启动指南（含家庭成员）',
            '🧭 本月化煞方位 + 家庭风水调整',
            '💰 小寒财运 + 家族财务规划',
            '🙏 小寒祈福 + 专属化煞时辰',
            '⏰ 立春倒计时：化煞物品最终准备清单'
          ]
        }
      },
      source: '《月令七十二候集解》《玉匣记》'
    },
    {
      date: '01-20',
      type: 'solar_term_dahan',
      title: '大寒 · 立春前准备 + 个性化化煞时辰',
      icon: '🏔️',
      tiers: ['annual', 'lifetime'],
      content: {
        annual: {
          blocks: [
            '🏔️ 大寒天象：寒至极矣，春将来临',
            '📋 立春前准备清单：',
            '  • 化煞物品采购完毕确认',
            '  • 家居方位调整计划',
            '  • 立春当日行程安排',
            '⏰ 立春当日吉时预告',
            '🧭 立春流年方位布局预告',
            '🔮 流年切换最后预警：冲太岁/害太岁/破太岁提醒'
          ]
        },
        lifetime: {
          blocks: [
            '🏔️ 大寒天象 + 家庭运势过渡分析',
            '📋 立春前家庭准备清单：',
            '  • 全家化煞物品确认',
            '  • 家居风水最终调整方案',
            '  • 立春当日家庭仪式安排',
            '⏰ 个性化化煞时辰（根据命局精确到时辰）',
            '🧭 立春流年方位布局 + 家庭风水全方案',
            '🔮 流年切换完整预警 + 家庭成员冲克分析',
            '📿 立春前诵持准备：净化旧年气场'
          ]
        }
      },
      source: '《授时通考》《协纪辨方书》立春迎新年法'
    },
    {
      date: '立春前3天',
      type: 'lichun_prep',
      title: '流年切换最终准备 + 物品清单',
      icon: '⚡',
      tiers: ['annual', 'lifetime'],
      content: {
        annual: {
          blocks: [
            '⚡ 立春倒计时3天！流年切换最终准备',
            '📋 物品清点确认单：',
            '  ✅ 化太岁符（如冲犯太岁）',
            '  ✅ 五行调和物',
            '  ✅ 财位催财物',
            '  ✅ 新年衣物颜色（根据五行）',
            '🧭 立春当日方位布局图',
            '⏰ 立春精确时刻 + 最佳化煞时辰',
            '🙏 立春当日简单仪式流程'
          ]
        },
        lifetime: {
          blocks: [
            '⚡ 立春倒计时3天！家庭流年切换最终准备',
            '📋 全家物品清点确认单（含每位成员）',
            '🧭 立春当日家庭方位布局全图',
            '⏰ 立春精确时刻 + 每位家庭成员专属化煞时辰',
            '🙏 立春当日家庭完整仪式流程',
            '📿 立春诵持准备：流年切换咒语',
            '🔔 立春当日提醒：将在立春时刻推送完整方案'
          ]
        }
      },
      source: '《协纪辨方书》《玉匣记》立春化煞法'
    },
    {
      date: '立春当日',
      type: 'lichun_day',
      title: '流年正式切换 + 完整年度化解方案',
      icon: '🌱',
      tiers: ['annual', 'lifetime'],
      content: {
        annual: {
          blocks: [
            '🌱 立春至！流年正式切换！',
            '🔮 新流年天干地支完整解析',
            '📊 年度运程总览（完整版）：',
            '  • 事业运：全年走势 + 关键月份',
            '  • 财运：正财/偏财/投资方位',
            '  • 感情运：桃花/婚姻/人际关系',
            '  • 健康运：五行器官全年养护重点',
            '🧭 年度方位布局（完整版）',
            '📿 年度化解方案：',
            '  • 化太岁方案（如需要）',
            '  • 财位催财布局',
            '  • 桃花位布置（如需要）',
            '  • 文昌位布置（如需要）',
            '  • 健康化煞方案',
            '⏰ 年度化煞吉时表（12个月）'
          ]
        },
        lifetime: {
          blocks: [
            '🌱 立春至！流年正式切换！家庭年度全鉴！',
            '🔮 新流年天干地支 + 家庭全员命局互动分析',
            '📊 家庭年度运程总览：',
            '  • 家庭事业运',
            '  • 家族财运 + 投资策略',
            '  • 家庭关系运',
            '  • 家庭健康运 + 每位成员预警',
            '🧭 家庭年度方位布局（含每个房间）',
            '📿 专属年度化解方案（终身会员定制版）：',
            '  • 个人化太岁方案（精确到时辰）',
            '  • 家庭化煞全方案',
            '  • 财位催财布局（根据流年飞星）',
            '  • 桃花/婚姻布局',
            '  • 文昌布局（子女学业）',
            '  • 健康化煞（每位家庭成员）',
            '  • 跨年化解衔接方案（上年度→本年度过渡）',
            '⏰ 家庭年度化煞吉时表（12个月 × 每位成员）',
            '📋 年度执行总清单：可打印的家庭化煞日历'
          ]
        }
      },
      source: '《滴天髓》《子平真诠》《协纪辨方书》《玉匣记》《阳宅三要》'
    }
  ],

  /* ================================================================
   * 七、引流转化策略
   * ================================================================ */
  conversion: {
    /* 免费用户每日推送底部"升级解锁"卡片 */
    dailyUpgradeCards: [
      {
        scenario: '吉时限制',
        icon: '⏰',
        text: '您的今日吉时仅显示3个，升级会员解锁全部6个吉时',
        cta: '查看完整吉时',
        style: 'soft'
      },
      {
        scenario: '财运方位',
        icon: '💰',
        text: '今日财运方位为正南，升级查看具体催财布局与物品摆放',
        cta: '解锁催财方案',
        style: 'soft'
      },
      {
        scenario: '化解方案',
        icon: '📿',
        text: '您的化解方案已生成，升级查看完整方案（含物品、时辰、方位）',
        cta: '查看完整方案',
        style: 'soft'
      },
      {
        scenario: '健康预警',
        icon: '💊',
        text: '今日五行健康预警已出，升级查看器官养护 + 穴位按摩方案',
        cta: '解锁健康方案',
        style: 'soft'
      },
      {
        scenario: '参拜指南',
        icon: '🙏',
        text: '今日参拜指南仅显示精简版，升级查看完整参拜流程（含发愿、还愿）',
        cta: '查看完整指南',
        style: 'soft'
      },
      {
        scenario: '月运报告',
        icon: '🌙',
        text: '本月月运报告已发布，升级会员查看完整流月运势分析',
        cta: '查看月运报告',
        style: 'highlight'
      },
      {
        scenario: '年度运程',
        icon: '🔮',
        text: '您的年度运程报告已就绪，升级解锁全年运势总览 + 化解方案',
        cta: '查看年度运程',
        style: 'highlight'
      }
    ],

    /* 会员到期前续费提醒 */
    renewalReminder: {
      daysBefore: 7,
      title: '会员即将到期',
      content: '您的{tier}会员将于{date}到期。续费可继续享受：\n• 每日完整推送\n• 月运报告\n• 年度运程\n• 个性化化解方案',
      cta: '立即续费',
      discountHint: '现在续费享9折优惠'
    },

    /* 节气/节日推送中嵌入的"会员专属内容"预告 */
    embeddedTeasers: [
      {
        context: '节气推送',
        text: '📣 节气养生完整版（含个人命局分析）为会员专属内容',
        cta: '升级查看'
      },
      {
        context: '节日推送',
        text: '📣 节日参拜完整流程 + 个人吉时为会员专属内容',
        cta: '升级查看'
      },
      {
        context: '月运推送',
        text: '📣 完整月运报告（含投资方位、化解方案）为会员专属内容',
        cta: '升级查看'
      }
    ],

    /* 引流文案模板 */
    copywriting: {
      gentle: '缘分使然，您已看到天机一角。升级解锁完整内容，让命理智慧为您指路。',
      curiosity: '您的完整化解方案已生成，其中包含3个关键化煞时辰。升级即可查看。',
      value: '日均仅需0.6元，即可获得每日完整运程 + 化解方案 + 月运报告。比一杯茶更便宜，却能让您天天受益。',
      urgency: '今日财运方位已出，化煞时辰不等人。升级即刻查看，把握今日吉时。',
      social: '已有10万+缘主升级会员，解锁了完整命理服务。您还在等什么？'
    }
  },

  /* ================================================================
   * 八、免责声明（每篇推送文末）
   * ================================================================ */
  disclaimer: '──────────────\n⚠️ 国学文化演绎，个人参考。\n本内容基于传统典籍与现代黄历，纯属娱乐参考，\n非医疗机构诊断、不替代专业意见。\n──────────────'
};

// ================================================================
// 渲染逻辑
// ================================================================

/**
 * 渲染推送计划主页面
 * @param {string} containerId - 容器元素ID
 */
function renderPushPlan(containerId) {
  let container = document.getElementById(containerId);
  if (!container) return;

  const html = '';

  /* ---- 顶部标题 ---- */
  html += '<div class="push-plan-hero">';
  html += '  <div class="pp-hero-icon">📡</div>';
  html += '  <h2 class="pp-hero-title">推送计划矩阵</h2>';
  html += '  <p class="pp-hero-sub">天机推送 · 分级定制 · 精准触达</p>';
  html += '  <p class="pp-hero-desc">根据会员等级，为您提供差异化的命理推送服务<br>从每日宜忌到年度化解，全方位守护您的每一天</p>';
  html += '</div>';

  /* ---- 会员等级对比 ---- */
  html += renderTierComparison();

  /* ---- 每日推送时间表 ---- */
  html += renderDailySchedule();

  /* ---- 节气推送日历 ---- */
  html += renderSolarTermsCalendar();

  /* ---- 节日推送 ---- */
  html += renderFestivalsList();

  /* ---- 月运推送 ---- */
  html += renderMonthlyPlan();

  /* ---- 年度推送（跨年）---- */
  html += renderAnnualPlan();

  /* ---- 引流转化策略 ---- */
  html += renderConversionStrategy();

  /* ---- 免责声明 ---- */
  html += '<div class="pp-disclaimer">' + PUSH_PLAN.disclaimer.replace(/\n/g, '<br>') + '</div>';

  container.innerHTML = html;
}

/**
 * 渲染会员等级对比
 */
function renderTierComparison() {
  const html = '';
  html += '<div class="pp-section">';
  html += '  <h3 class="pp-section-title"><span class="pp-section-icon">👑</span> 会员等级推送对比</h3>';
  html += '  <div class="pp-tier-grid">';

  Object.keys(PUSH_PLAN.tiers).forEach(function(key) {
    let tier = PUSH_PLAN.tiers[key];
    let isCurrent = (key === 'free') ? '' : '';
    html += '<div class="pp-tier-card pp-tier-' + key + '" style="border-color:' + tier.color + '40">';
    html += '  <div class="pp-tier-badge" style="background:' + tier.color + '20;color:' + tier.color + ';border:1px solid ' + tier.color + '50">' + tier.icon + ' ' + tier.name + '</div>';
    html += '  <div class="pp-tier-name" style="color:' + tier.color + '">' + tier.name + '</div>';
    html += '  <div class="pp-tier-features">';
    html += '    <div class="pp-features-label">推送权益</div>';
    html += '    <ul>';
    tier.features.forEach(function(f) {
      html += '<li>✅ ' + f + '</li>';
    });
    if (tier.restrictions.length > 0) {
      tier.restrictions.forEach(function(r) {
        html += '<li class="pp-disabled">🔒 ' + r + '</li>';
      });
    }
    html += '    </ul>';
    html += '  </div>';
    if (key !== 'lifetime') {
      html += '  <button class="pp-upgrade-btn" style="border-color:' + tier.color + ';color:' + tier.color + '" onclick="showSection(\'more\');showMoreModule(\'vip\')">升级 ' + (key === 'free' ? '年度会员' : '终身会员') + '</button>';
    }
    html += '</div>';
  });

  html += '  </div>';
  html += '</div>';
  return html;
}

/**
 * 渲染每日推送时间表
 */
function renderDailySchedule() {
  const html = '';
  html += '<div class="pp-section">';
  html += '  <h3 class="pp-section-title"><span class="pp-section-icon">⏰</span> 每日推送时间表</h3>';
  html += '  <div class="pp-schedule-grid">';

  PUSH_PLAN.dailySchedule.forEach(function(item) {
    html += '<div class="pp-schedule-card">';
    html += '  <div class="pp-schedule-header">';
    html += '    <span class="pp-schedule-icon">' + item.icon + '</span>';
    html += '    <div>';
    html += '      <div class="pp-schedule-time">' + item.time + '</div>';
    html += '      <div class="pp-schedule-title">' + item.title + '</div>';
    html += '    </div>';
    html += '  </div>';
    html += '  <div class="pp-schedule-tiers">';
    item.tiers.forEach(function(t) {
      let tier = PUSH_PLAN.tiers[t];
      html += '<span class="pp-tier-tag" style="background:' + tier.color + '15;color:' + tier.color + ';border:1px solid ' + tier.color + '30">' + tier.icon + ' ' + tier.name + '</span>';
    });
    html += '  </div>';
    html += '  <div class="pp-schedule-content">';

    Object.keys(item.content).forEach(function(tierKey) {
      let content = item.content[tierKey];
      let tier = PUSH_PLAN.tiers[tierKey];
      html += '<div class="pp-content-block pp-content-' + tierKey + '">';
      html += '<div class="pp-content-tier" style="color:' + tier.color + '">' + tier.icon + ' ' + tier.name + '</div>';
      html += '<div class="pp-content-headline">' + content.headline + '</div>';
      html += '<ul class="pp-content-list">';
      content.blocks.forEach(function(b) {
        html += '<li>' + b + '</li>';
      });
      if (content.upgradeHint) {
        html += '<li class="pp-upgrade-hint">🔓 ' + content.upgradeHint + '</li>';
      }
      html += '</ul>';
      html += '</div>';
    });

    html += '  </div>';
    html += '  <div class="pp-source">📖 来源：' + item.source + '</div>';
    html += '</div>';
  });

  html += '  </div>';
  html += '</div>';
  return html;
}

/**
 * 渲染节气推送日历
 */
function renderSolarTermsCalendar() {
  const html = '';
  html += '<div class="pp-section">';
  html += '  <h3 class="pp-section-title"><span class="pp-section-icon">🌿</span> 二十四节气推送</h3>';
  html += '  <p class="pp-section-desc">每个节气前1天推送养生+运势提醒（年度会员+终身会员）</p>';
  html += '  <div class="pp-terms-grid">';

  PUSH_PLAN.solarTerms.forEach(function(term) {
    html += '<div class="pp-term-card">';
    html += '  <div class="pp-term-header">';
    html += '    <span class="pp-term-icon">' + term.icon + '</span>';
    html += '    <div>';
    html += '      <div class="pp-term-name">' + term.name + '</div>';
    html += '      <div class="pp-term-date">公历 ' + term.date + '</div>';
    html += '    </div>';
    html += '  </div>';
    html += '  <div class="pp-term-title">' + term.title + '</div>';
    html += '  <div class="pp-term-body">';
    html += '    <div class="pp-term-sub">🥗 饮食养生</div>';
    html += '    <p>' + term.养生.diet + '</p>';
    html += '    <div class="pp-term-sub">🛏️ 起居调养</div>';
    html += '    <p>' + term.养生.lifestyle + '</p>';
    html += '    <div class="pp-term-sub">🏃 运动建议</div>';
    html += '    <p>' + term.养生.exercise + '</p>';
    html += '    <div class="pp-term-sub">⚠️ 禁忌</div>';
    html += '    <p>' + term.养生.taboo + '</p>';
    html += '    <div class="pp-term-sub">🔮 运势分析</div>';
    html += '    <p>' + term.fortune + '</p>';
    html += '    <div class="pp-term-sub pp-member-only">👑 会员专属</div>';
    html += '    <p class="pp-member-text">' + term.memberExtra + '</p>';
    html += '  </div>';
    html += '  <div class="pp-source">📖 ' + term.source + '</div>';
    html += '</div>';
  });

  html += '  </div>';
  html += '</div>';
  return html;
}

/**
 * 渲染节日推送
 */
function renderFestivalsList() {
  const html = '';
  html += '<div class="pp-section">';
  html += '  <h3 class="pp-section-title"><span class="pp-section-icon">🎊</span> 传统节日专题推送</h3>';
  html += '  <p class="pp-section-desc">所有用户均可收到节日祝福，会员解锁完整专题内容</p>';
  html += '  <div class="pp-festival-grid">';

  PUSH_PLAN.festivals.forEach(function(fest) {
    let allContent = fest.content.all;
    html += '<div class="pp-festival-card">';
    html += '  <div class="pp-festival-header" style="background:linear-gradient(135deg,' + 'rgba(201,168,76,0.08),' + 'rgba(201,168,76,0.02))">';
    html += '    <span class="pp-festival-icon">' + fest.icon + '</span>';
    html += '    <div>';
    html += '      <div class="pp-festival-name">' + fest.name + '</div>';
    html += '      <div class="pp-festival-date">' + fest.date + '</div>';
    html += '    </div>';
    html += '  </div>';
    html += '  <div class="pp-festival-title">' + fest.title + '</div>';
    html += '  <div class="pp-festival-greeting">' + allContent.greeting + '</div>';
    html += '  <div class="pp-festival-blocks">';
    allContent.blocks.forEach(function(b) {
      html += '<div class="pp-festival-block">' + b + '</div>';
    });
    html += '  </div>';

    if (fest.content.free && fest.content.free.upgradeHint) {
      html += '<div class="pp-festival-upgrade">🔓 ' + fest.content.free.upgradeHint + '</div>';
    }
    if (fest.content.annual) {
      html += '<div class="pp-festival-member"><span class="pp-member-badge" style="background:rgba(201,168,76,0.15);color:#c9a84c;border:1px solid rgba(201,168,76,0.3)">年度会员</span> ' + fest.content.annual.extra + '</div>';
    }
    if (fest.content.lifetime) {
      html += '<div class="pp-festival-member"><span class="pp-member-badge" style="background:rgba(231,76,60,0.15);color:#e74c3c;border:1px solid rgba(231,76,60,0.3)">终身会员</span> ' + fest.content.lifetime.extra + '</div>';
    }

    html += '  <div class="pp-source">📖 ' + fest.source + '</div>';
    html += '</div>';
  });

  html += '  </div>';
  html += '</div>';
  return html;
}

/**
 * 渲染月运推送
 */
function renderMonthlyPlan() {
  const html = '';
  let m = PUSH_PLAN.monthly;
  html += '<div class="pp-section">';
  html += '  <h3 class="pp-section-title"><span class="pp-section-icon">🌙</span> 月运报告</h3>';
  html += '  <p class="pp-section-desc">推送时间：' + m.schedule + ' | 推送对象：年度会员 + 终身会员</p>';
  html += '  <div class="pp-monthly-grid">';

  html += '  <div class="pp-monthly-card">';
  html += '    <div class="pp-monthly-header">';
  html += '      <span class="pp-monthly-icon">' + m.icon + '</span>';
  html += '      <div>';
  html += '        <div class="pp-monthly-title">' + m.title + '</div>';
  html += '        <div class="pp-monthly-source">📖 ' + m.source + '</div>';
  html += '      </div>';
  html += '    </div>';
  html += '    <div class="pp-monthly-tiers">';
  m.tiers.forEach(function(t) {
    let tier = PUSH_PLAN.tiers[t];
    html += '<span class="pp-tier-tag" style="background:' + tier.color + '15;color:' + tier.color + ';border:1px solid ' + tier.color + '30">' + tier.icon + ' ' + tier.name + '</span>';
  });
  html += '    </div>';

  Object.keys(m.content).forEach(function(tierKey) {
    let content = m.content[tierKey];
    let tier = PUSH_PLAN.tiers[tierKey];
    html += '<div class="pp-content-block pp-content-' + tierKey + '">';
    html += '<div class="pp-content-tier" style="color:' + tier.color + '">' + tier.icon + ' ' + tier.name + '内容</div>';
    html += '<ul class="pp-content-list">';
    content.blocks.forEach(function(b) {
      html += '<li>' + b + '</li>';
    });
    html += '</ul>';
    html += '</div>';
  });

  html += '  </div>';
  html += '  </div>';
  html += '</div>';
  return html;
}

/**
 * 渲染年度推送（含跨年）
 */
function renderAnnualPlan() {
  const html = '';
  html += '<div class="pp-section">';
  html += '  <h3 class="pp-section-title"><span class="pp-section-icon">🔮</span> 年度推送 · 跨年化解全流程</h3>';
  html += '  <p class="pp-section-desc">从公历12月到立春，完整的跨年化解方案推送时间线</p>';

  /* 跨年时间线 */
  html += '  <div class="pp-timeline">';

  PUSH_PLAN.annual.forEach(function(item, idx) {
    let isLast = (idx === PUSH_PLAN.annual.length - 1);
    html += '<div class="pp-timeline-item">';
    html += '  <div class="pp-timeline-dot ' + (item.tiers.includes('lifetime') ? 'pp-dot-lifetime' : 'pp-dot-annual') + '"></div>';
    if (!isLast) html += '  <div class="pp-timeline-line"></div>';
    html += '  <div class="pp-timeline-card">';
    html += '    <div class="pp-timeline-date">' + item.icon + ' ' + item.date + '</div>';
    html += '    <div class="pp-timeline-title">' + item.title + '</div>';
    html += '    <div class="pp-timeline-tiers">';
    item.tiers.forEach(function(t) {
      let tier = PUSH_PLAN.tiers[t];
      html += '<span class="pp-tier-tag" style="background:' + tier.color + '15;color:' + tier.color + ';border:1px solid ' + tier.color + '30">' + tier.icon + ' ' + tier.name + '</span>';
    });
    html += '    </div>';
    html += '    <div class="pp-timeline-content">';

    Object.keys(item.content).forEach(function(tierKey) {
      let content = item.content[tierKey];
      let tier = PUSH_PLAN.tiers[tierKey];
      html += '<div class="pp-content-block pp-content-' + tierKey + '">';
      html += '<div class="pp-content-tier" style="color:' + tier.color + '">' + tier.icon + ' ' + tier.name + '</div>';
      html += '<ul class="pp-content-list">';
      content.blocks.forEach(function(b) {
        html += '<li>' + b + '</li>';
      });
      html += '</ul>';
      html += '</div>';
    });

    html += '    </div>';
    html += '    <div class="pp-source">📖 ' + item.source + '</div>';
    html += '  </div>';
    html += '</div>';
  });

  html += '  </div>';
  html += '</div>';
  return html;
}

/**
 * 渲染引流转化策略
 */
function renderConversionStrategy() {
  const html = '';
  let c = PUSH_PLAN.conversion;
  html += '<div class="pp-section">';
  html += '  <h3 class="pp-section-title"><span class="pp-section-icon">📈</span> 引流转化设计</h3>';
  html += '  <p class="pp-section-desc">免费用户推送底部嵌入"升级解锁"卡片，自然引导转化</p>';

  /* 升级解锁卡片示例 */
  html += '  <div class="pp-conversion-grid">';
  html += '    <h4 class="pp-conv-sub-title">每日推送底部"升级解锁"卡片</h4>';
  c.dailyUpgradeCards.forEach(function(card) {
    let styleClass = card.style === 'highlight' ? 'pp-conv-card pp-conv-highlight' : 'pp-conv-card';
    html += '<div class="' + styleClass + '">';
    html += '  <span class="pp-conv-icon">' + card.icon + '</span>';
    html += '  <div class="pp-conv-body">';
    html += '    <div class="pp-conv-text">' + card.text + '</div>';
    html += '    <button class="pp-conv-cta">' + card.cta + ' →</button>';
    html += '  </div>';
    html += '</div>';
  });
  html += '  </div>';

  /* 续费提醒 */
  html += '  <div class="pp-conversion-section">';
  html += '    <h4 class="pp-conv-sub-title">会员到期续费提醒</h4>';
  html += '    <div class="pp-renewal-card">';
  html += '      <div class="pp-renewal-icon">⏰</div>';
  html += '      <div class="pp-renewal-content">';
  html += '        <div class="pp-renewal-title">' + c.renewalReminder.title + '（到期前' + c.renewalReminder.daysBefore + '天）</div>';
  html += '        <div class="pp-renewal-text">' + c.renewalReminder.content.replace(/\n/g, '<br>') + '</div>';
  html += '        <div class="pp-renewal-discount">' + c.renewalReminder.discountHint + '</div>';
  html += '      </div>';
  html += '      <button class="pp-conv-cta pp-renewal-cta">' + c.renewalReminder.cta + ' →</button>';
  html += '    </div>';
  html += '  </div>';

  /* 嵌入式预告 */
  html += '  <div class="pp-conversion-section">';
  html += '    <h4 class="pp-conv-sub-title">节气/节日推送中的会员预告</h4>';
  c.embeddedTeasers.forEach(function(t) {
    html += '<div class="pp-teaser-item">';
    html += '  <span class="pp-teaser-context">' + t.context + '</span>';
    html += '  <span class="pp-teaser-text">' + t.text + '</span>';
    html += '  <button class="pp-conv-cta pp-teaser-cta">' + t.cta + ' →</button>';
    html += '</div>';
  });
  html += '  </div>';

  /* 引流文案 */
  html += '  <div class="pp-conversion-section">';
  html += '    <h4 class="pp-conv-sub-title">引流文案库</h4>';
  html += '    <div class="pp-copy-grid">';
  Object.keys(c.copywriting).forEach(function(style) {
    let label = { gentle: '温和型', curiosity: '好奇型', value: '价值型', urgency: '紧迫型', social: '社交型' }[style] || style;
    html += '<div class="pp-copy-card">';
    html += '  <span class="pp-copy-label">' + label + '</span>';
    html += '  <p class="pp-copy-text">' + c.copywriting[style] + '</p>';
    html += '</div>';
  });
  html += '    </div>';
  html += '  </div>';

  html += '</div>';
  return html;
}

// ================================================================
// 初始化
// ================================================================
if (typeof window !== 'undefined') {
  window.PUSH_PLAN = PUSH_PLAN;
  window.renderPushPlan = renderPushPlan;
}
