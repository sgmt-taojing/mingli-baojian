// 乾元命理宝鉴 · 十二生肖知识库 v1.0
// 版本：2026.06.17
// 包含：本命佛、年度运势、吉祥物推荐、开运方法

const ZODIAC_KNOWLEDGE = {

  // ====================================================================
  // 十二生肖本命佛对照表
  // ====================================================================
  buddhaMap: {
    '鼠': {
      buddha: '千手观音菩萨',
      sanskrit: 'Sahasra-bhuja Avalokitesvara',
      image: 'images/zodiac/rat-buddha.jpg',
      intro: '千手观音是大慈大悲的象征，能消除一切灾难，增长一切善法。千手代表护持众生，千眼代表观照世间。属鼠者与千手观音因缘深厚，佩戴或供奉可消除灾厄、增长福报。',
      worship: '每日清晨焚香三拜，持念"南无大慈大悲千手千眼观世音菩萨"108遍，供清水一杯、白色鲜花。',
      taboos: ['不可佩戴入厕所', '不可置于低于腰部位置', '房事时需取下收好', '经期女性不宜佩戴'],
      benefits: ['消灾解难', '增福延寿', '化解太岁', '护佑平安']
    },
    '牛': {
      buddha: '虚空藏菩萨',
      sanskrit: 'Akasagarbha',
      image: 'images/zodiac/ox-buddha.jpg',
      intro: '虚空藏菩萨是智慧与财富的象征，智慧如虚空般广大，财富如宝藏般丰盈。属牛者诚实守信，与虚空藏菩萨相应，能增强智慧、招财进宝。',
      worship: '每月初八供灯一盏，持念"南无虚空藏菩萨摩诃萨"108遍，供黄色花、檀香。',
      taboos: ['不可与污秽之物同放', '不可借予他人佩戴', '沐浴时需取下'],
      benefits: ['开启智慧', '增进财富', '记忆力增强', '事业顺利']
    },
    '虎': {
      buddha: '虚空藏菩萨',
      sanskrit: 'Akasagarbha',
      image: 'images/zodiac/tiger-buddha.jpg',
      intro: '虚空藏菩萨智慧如虚空，财富如宝藏。属虎者勇敢果断，与虚空藏菩萨相应，能化解冲动、增进智慧。',
      worship: '每月十五供灯，持念"南无虚空藏菩萨"圣号，供黄色或金色花。',
      taboos: ['不可佩戴进入娱乐场所', '不可与异性乱搞暧昧时佩戴'],
      benefits: ['平复暴躁', '增强智慧', '财富增长', '化解是非']
    },
    '兔': {
      buddha: '文殊菩萨',
      sanskrit: 'Manjusri',
      image: 'images/zodiac/rabbit-buddha.jpg',
      intro: '文殊菩萨是智慧第一的大菩萨，手持宝剑斩断无明，骑乘狮子吼震醒众生。属兔者温文尔雅，与文殊菩萨相应，能开启智慧、增强学业。',
      worship: '考前或每月初四供灯、文房四宝，持念文殊心咒"嗡 阿若巴佳呐谛"108遍。',
      taboos: ['不可佩戴进入赌场', '不可心术不正时求智慧'],
      benefits: ['学业进步', '考试顺利', '智慧开启', '思维敏捷']
    },
    '龙': {
      buddha: '普贤菩萨',
      sanskrit: 'Samantabhadra',
      image: 'images/zodiac/dragon-buddha.jpg',
      intro: '普贤菩萨是大行大愿的代表，骑乘六牙白象，象征愿力坚固、行愿无尽。属龙者志向远大，与普贤菩萨相应，能满愿成就、延寿增福。',
      worship: '每月二十一日供莲花，持念"南无大行普贤菩萨"或《普贤行愿品》。',
      taboos: ['不可发空愿', '不可不行善却求满愿'],
      benefits: ['发愿成就', '延寿增福', '行愿圆满', '事业大成']
    },
    '蛇': {
      buddha: '普贤菩萨',
      sanskrit: 'Samantabhadra',
      image: 'images/zodiac/snake-buddha.jpg',
      intro: '普贤菩萨是大行大愿之王，愿力无边。属蛇者智慧深沉，与普贤菩萨相应，能化解阴柔、增长行愿。',
      worship: '每月二十一日供莲花、清水，持念普贤圣号。',
      taboos: ['不可心术不正', '不可行邪术'],
      benefits: ['化解偏执', '愿力成就', '延寿护佑', '行善积德']
    },
    '马': {
      buddha: '大势至菩萨',
      sanskrit: 'Mahasthamaprapta',
      image: 'images/zodiac/horse-buddha.jpg',
      intro: '大势至菩萨以智慧光普照一切，令离三涂得无上力。属马者热情奔放，与大势至菩萨相应，能化解躁动、增强定力。',
      worship: '每月十三日供灯、香花，持念"南无大势至菩萨"圣号。',
      taboos: ['不可急躁求成', '不可心浮气躁时求定力'],
      benefits: ['平复躁动', '增强定力', '智慧增长', '逢凶化吉']
    },
    '羊': {
      buddha: '大日如来',
      sanskrit: 'Vairocana',
      image: 'images/zodiac/goat-buddha.jpg',
      intro: '大日如来是密教最高本尊，代表绝对真理与圆满智慧。属羊者温和善良，与大日如来相应，能开启光明智慧、破除无明。',
      worship: '每月初八供灯七盏，持念大日如来心咒"嗡 缚日罗 驮都 鉴"。',
      taboos: ['不可佩戴进入屠宰场', '不可杀生时佩戴'],
      benefits: ['开启智慧光明', '破除无明', '逢凶化吉', '身心健康']
    },
    '猴': {
      buddha: '大日如来',
      sanskrit: 'Vairocana',
      image: 'images/zodiac/monkey-buddha.jpg',
      intro: '大日如来代表遍照宇宙的智慧光明。属猴者聪明伶俐，与大日如来相应，能化解浮躁、开启大智慧。',
      worship: '每月十五供灯，持念大日如来圣号或心咒。',
      taboos: ['不可心术不正', '不可耍小聪明求佛力'],
      benefits: ['智慧圆满', '破除烦恼', '光明前途', '事业顺遂']
    },
    '鸡': {
      buddha: '不动明王',
      sanskrit: 'Acalanatha',
      image: 'images/zodiac/rooster-buddha.jpg',
      intro: '不动明王是大日如来的教令轮身，代表坚定不动、降伏魔怨。属鸡者精明果断，与不动明王相应，能化解多虑、增强定力。',
      worship: '每月初八供灯，持念不动明王心咒"南无 大日大圣 不动明王"。',
      taboos: ['不可心浮气躁', '不可三心二意'],
      benefits: ['坚定意志', '降伏烦恼', '事业稳固', '财源广进']
    },
    '狗': {
      buddha: '阿弥陀佛',
      sanskrit: 'Amitabha',
      image: 'images/zodiac/dog-buddha.jpg',
      intro: '阿弥陀佛是西方极乐世界教主，接引众生往生净土。属狗者忠诚守信，与阿弥陀佛相应，能化解执着、往生净土。',
      worship: '每日持念"南无阿弥陀佛"圣号，或诵《阿弥陀经》。',
      taboos: ['不可杀生', '不可妄语', '不可心不诚'],
      benefits: ['往生净土', '现世安乐', '化解业障', '福寿延绵']
    },
    '猪': {
      buddha: '阿弥陀佛',
      sanskrit: 'Amitabha',
      image: 'images/zodiac/pig-buddha.jpg',
      intro: '阿弥陀佛大慈大悲，接引众生。属猪者宽厚仁慈，与阿弥陀佛相应，能增福延寿、往生净土。',
      worship: '每日持念阿弥陀佛圣号，或诵《阿弥陀经》。',
      taboos: ['不可杀生吃肉时佩戴', '不可心术不正'],
      benefits: ['增福延寿', '往生净土', '业障消除', '一生安乐']
    }
  },

  // ====================================================================
  // 十二生肖年度运势（2025-2030）
  // ====================================================================
  yearlyFortune: {
    2025: {
      '鼠': {
        overall: '冲太岁，运势起伏较大',
        career: '事业多变动，宜守不宜进',
        wealth: '财来财去，宜储蓄防破财',
        love: '感情易生变，需多沟通',
        health: '注意肠胃、泌尿系统',
        luckyNumber: [1, 6],
        luckyColor: ['金色', '白色'],
        luckyDirection: '西方',
        avoidColor: ['红色', '橙色'],
        remedy: '佩戴千手观音吊坠，年初拜太岁'
      },
      '牛': {
        overall: '三合年，运势平稳向好',
        career: '贵人相助，事业顺遂',
        wealth: '正财稳健，偏财需谨慎',
        love: '感情稳定，单身者有桃花运',
        health: '身体健康，注意劳逸结合',
        luckyNumber: [5, 0],
        luckyColor: ['黄色', '棕色'],
        luckyDirection: '东北方',
        avoidColor: ['绿色'],
        remedy: '佩戴虚空藏菩萨吊坠'
      },
      '虎': {
        overall: '平稳之年，稳中求进',
        career: '事业发展，但需防小人',
        wealth: '财运平稳，投资需谨慎',
        love: '感情顺利，已婚者注意沟通',
        health: '注意肝胆、呼吸系统',
        luckyNumber: [3, 8],
        luckyColor: ['绿色', '青色'],
        luckyDirection: '东方',
        avoidColor: ['白色'],
        remedy: '佩戴虚空藏菩萨吊坠'
      },
      '兔': {
        overall: '犯太岁，运势波折',
        career: '事业多阻碍，宜守不宜攻',
        wealth: '财运不佳，防破财',
        love: '感情不顺，多包容',
        health: '注意肝胆、神经系统',
        luckyNumber: [3, 4],
        luckyColor: ['绿色', '蓝色'],
        luckyDirection: '东南方',
        avoidColor: ['金色'],
        remedy: '佩戴文殊菩萨吊坠，年初拜太岁'
      },
      '龙': {
        overall: '犯太岁，需谨慎行事',
        career: '事业压力大，宜低调',
        wealth: '财运不稳，防破财',
        love: '感情多波折，需耐心',
        health: '注意心脏、血压',
        luckyNumber: [6, 9],
        luckyColor: ['金色', '红色'],
        luckyDirection: '南方',
        avoidColor: ['蓝色'],
        remedy: '佩戴普贤菩萨吊坠，拜太岁'
      },
      '蛇': {
        overall: '三合年，运势旺盛',
        career: '事业大展宏图，贵人相助',
        wealth: '财运亨通，投资有利',
        love: '感情美满，单身者有良缘',
        health: '身体健康，精力充沛',
        luckyNumber: [2, 7],
        luckyColor: ['红色', '紫色'],
        luckyDirection: '南方',
        avoidColor: ['黑色'],
        remedy: '佩戴普贤菩萨吊坠'
      },
      '马': {
        overall: '平稳之年，稳扎稳打',
        career: '事业发展平稳，有升迁机会',
        wealth: '财运尚可，不宜冒险',
        love: '感情稳定，宜婚嫁',
        health: '注意心脏、眼睛',
        luckyNumber: [2, 7],
        luckyColor: ['红色', '橙色'],
        luckyDirection: '南方',
        avoidColor: ['黑色'],
        remedy: '佩戴大势至菩萨吊坠'
      },
      '羊': {
        overall: '平稳之年，宜静不宜动',
        career: '事业平稳，不宜跳槽',
        wealth: '财运一般，需开源节流',
        love: '感情平稳，需经营',
        health: '注意肠胃、皮肤',
        luckyNumber: [5, 0],
        luckyColor: ['黄色', '米色'],
        luckyDirection: '西南方',
        avoidColor: ['绿色'],
        remedy: '佩戴大日如来吊坠'
      },
      '猴': {
        overall: '犯太岁，运势多变',
        career: '事业多变动，宜守不宜进',
        wealth: '财运不稳，防破财',
        love: '感情不顺，需包容',
        health: '注意呼吸系统、筋骨',
        luckyNumber: [4, 9],
        luckyColor: ['白色', '金色'],
        luckyDirection: '西方',
        avoidColor: ['红色'],
        remedy: '佩戴大日如来吊坠，拜太岁'
      },
      '鸡': {
        overall: '三合年，运势向好',
        career: '事业顺遂，有升迁机会',
        wealth: '财运亨通，投资有利',
        love: '感情美满，单身者有桃花运',
        health: '身体健康，注意饮食',
        luckyNumber: [5, 8],
        luckyColor: ['黄色', '金色'],
        luckyDirection: '西方',
        avoidColor: ['绿色'],
        remedy: '佩戴不动明王吊坠'
      },
      '狗': {
        overall: '冲太岁，运势起伏',
        career: '事业多变动，需谨慎',
        wealth: '财运不稳，防破财',
        love: '感情易生变，需沟通',
        health: '注意肠胃、关节',
        luckyNumber: [2, 7],
        luckyColor: ['红色', '紫色'],
        luckyDirection: '南方',
        avoidColor: ['黑色'],
        remedy: '佩戴阿弥陀佛吊坠，拜太岁'
      },
      '猪': {
        overall: '平稳之年，稳中求进',
        career: '事业发展，贵人相助',
        wealth: '财运尚可，正财为主',
        love: '感情稳定，宜婚嫁',
        health: '注意肾脏、泌尿系统',
        luckyNumber: [1, 6],
        luckyColor: ['黑色', '蓝色'],
        luckyDirection: '北方',
        avoidColor: ['黄色'],
        remedy: '佩戴阿弥陀佛吊坠'
      }
    },
    // 2026-2030 数据结构相同，后续填充...
    2026: {},
    2027: {},
    2028: {},
    2029: {},
    2030: {}
  },

  // ====================================================================
  // 吉祥物推荐（按生肖+年份）
  // ====================================================================
  auspiciousItems: {
    // 2025年
    2025: {
      '鼠': {
        home: {
          items: ['貔貅（面向大门）', '金蟾（朝内）', '五帝钱'],
          placement: '客厅财位（进门对角线）或玄关',
          materials: { '貔貅': ['铜', '玉', '黑曜石'], '金蟾': ['铜', '树脂'], '五帝钱': ['铜'] },
          note: '貔貅需开光，头朝门外招财；金蟾含铜钱朝内，不含朝外'
        },
        car: {
          items: ['平安符', '小貔貅', '八卦镜'],
          placement: '仪表盘、后视镜悬挂',
          materials: { '平安符': ['黄布'], '小貔貅': ['玉', '铜'], '八卦镜': ['铜', '木'] },
          note: '平安符需到寺庙开光；八卦镜凸面朝外挡煞'
        },
        body: {
          items: ['千手观音吊坠', '黑曜石手串', '红绳'],
          placement: '贴身佩戴，吊坠在胸口，手串在左手',
          materials: { '千手观音吊坠': ['玉', '金', '银'], '黑曜石手串': ['黑曜石'], '红绳': ['红丝线'] },
          note: '冲太岁年需佩戴本命佛化解；洗澡、房事时取下'
        }
      },
      '牛': {
        home: {
          items: ['麒麟', '葫芦', '聚宝盆'],
          placement: '客厅或书房',
          materials: { '麒麟': ['铜', '玉'], '葫芦': ['铜', '天然葫芦'], '聚宝盆': ['铜', '水晶'] },
          note: '麒麟成对摆放，头朝门外；葫芦挂门后化病气'
        },
        car: {
          items: ['平安符', '小葫芦'],
          placement: '后视镜、仪表盘',
          materials: { '平安符': ['黄布'], '小葫芦': ['铜', '玉'] },
          note: '三合年运势好，平安符保平安即可'
        },
        body: {
          items: ['虚空藏菩萨吊坠', '黄水晶手串', '和田玉平安扣'],
          placement: '贴身佩戴',
          materials: { '虚空藏菩萨吊坠': ['玉', '金', '银'], '黄水晶手串': ['黄水晶'], '和田玉平安扣': ['和田玉'] },
          note: '黄水晶招财；平安扣保平安'
        }
      },
      // 其他生肖类似结构...
      '虎': {
        home: { items: ['貔貅', '龙龟'], placement: '客厅财位', materials: { '貔貅': ['铜', '玉'], '龙龟': ['铜'] }, note: '龙龟化小人' },
        car: { items: ['平安符', '小象'], placement: '仪表盘', materials: { '平安符': ['黄布'], '小象': ['玉', '铜'] }, note: '象象征吉祥' },
        body: { items: ['虚空藏菩萨吊坠', '虎眼石手串'], placement: '贴身佩戴', materials: { '虚空藏菩萨吊坠': ['玉', '金'], '虎眼石手串': ['虎眼石'] }, note: '虎眼石增强魄力' }
      },
      '兔': {
        home: { items: ['葫芦（化病气）', '文昌塔', '如意'], placement: '书房、客厅', materials: { '葫芦': ['铜', '天然葫芦'], '文昌塔': ['铜', '水晶'], '如意': ['玉', '铜'] }, note: '犯太岁需化煞' },
        car: { items: ['平安符', '小葫芦'], placement: '后视镜', materials: { '平安符': ['黄布'], '小葫芦': ['铜'] }, note: '葫芦保平安' },
        body: { items: ['文殊菩萨吊坠', '紫水晶手串', '红绳'], placement: '贴身佩戴', materials: { '文殊菩萨吊坠': ['玉', '金'], '紫水晶手串': ['紫水晶'], '红绳': ['红丝线'] }, note: '犯太岁需红绳化解' }
      },
      '龙': {
        home: { items: ['龙龟', '五帝钱', '葫芦'], placement: '客厅、门后', materials: { '龙龟': ['铜'], '五帝钱': ['铜'], '葫芦': ['铜'] }, note: '犯太岁需化煞' },
        car: { items: ['平安符', '小龙龟'], placement: '仪表盘', materials: { '平安符': ['黄布'], '小龙龟': ['铜', '玉'] }, note: '龙龟化煞保平安' },
        body: { items: ['普贤菩萨吊坠', '黑曜石手串', '红绳'], placement: '贴身佩戴', materials: { '普贤菩萨吊坠': ['玉', '金'], '黑曜石手串': ['黑曜石'], '红绳': ['红丝线'] }, note: '犯太岁需本命佛化解' }
      },
      '蛇': {
        home: { items: ['貔貅', '金蟾', '聚宝盆'], placement: '客厅财位', materials: { '貔貅': ['铜', '玉'], '金蟾': ['铜'], '聚宝盆': ['铜', '水晶'] }, note: '三合年财运旺' },
        car: { items: ['平安符', '小貔貅'], placement: '仪表盘', materials: { '平安符': ['黄布'], '小貔貅': ['玉'] }, note: '平安符保平安' },
        body: { items: ['普贤菩萨吊坠', '红玛瑙手串'], placement: '贴身佩戴', materials: { '普贤菩萨吊坠': ['玉', '金'], '红玛瑙手串': ['红玛瑙'] }, note: '红玛瑙招财' }
      },
      '马': {
        home: { items: ['麒麟', '龙马', '聚宝盆'], placement: '客厅', materials: { '麒麟': ['铜', '玉'], '龙马': ['铜'], '聚宝盆': ['铜'] }, note: '龙马精神' },
        car: { items: ['平安符', '小马'], placement: '仪表盘', materials: { '平安符': ['黄布'], '小马': ['玉', '铜'] }, note: '马到成功' },
        body: { items: ['大势至菩萨吊坠', '红玛瑙手串'], placement: '贴身佩戴', materials: { '大势至菩萨吊坠': ['玉', '金'], '红玛瑙手串': ['红玛瑙'] }, note: '红玛瑙增强活力' }
      },
      '羊': {
        home: { items: ['葫芦', '如意', '三羊开泰摆件'], placement: '客厅、书房', materials: { '葫芦': ['铜', '天然葫芦'], '如意': ['玉', '铜'], '三羊开泰': ['铜', '玉'] }, note: '三羊开泰寓意吉祥' },
        car: { items: ['平安符', '小羊'], placement: '仪表盘', materials: { '平安符': ['黄布'], '小羊': ['玉'] }, note: '平安出行' },
        body: { items: ['大日如来吊坠', '白水晶手串'], placement: '贴身佩戴', materials: { '大日如来吊坠': ['玉', '金'], '白水晶手串': ['白水晶'] }, note: '白水晶净化心灵' }
      },
      '猴': {
        home: { items: ['貔貅', '葫芦（化病气）', '五帝钱'], placement: '客厅财位、门后', materials: { '貔貅': ['铜', '玉'], '葫芦': ['铜'], '五帝钱': ['铜'] }, note: '犯太岁需化煞' },
        car: { items: ['平安符', '小葫芦'], placement: '后视镜', materials: { '平安符': ['黄布'], '小葫芦': ['铜'] }, note: '葫芦保平安' },
        body: { items: ['大日如来吊坠', '黑曜石手串', '红绳'], placement: '贴身佩戴', materials: { '大日如来吊坠': ['玉', '金'], '黑曜石手串': ['黑曜石'], '红绳': ['红丝线'] }, note: '犯太岁需红绳化解' }
      },
      '鸡': {
        home: { items: ['金蟾', '聚宝盆', '凤凰摆件'], placement: '客厅财位', materials: { '金蟾': ['铜'], '聚宝盆': ['铜', '水晶'], '凤凰': ['铜', '玉'] }, note: '三合年财运旺' },
        car: { items: ['平安符', '小金蟾'], placement: '仪表盘', materials: { '平安符': ['黄布'], '小金蟾': ['铜'] }, note: '金蟾招财' },
        body: { items: ['不动明王吊坠', '黄水晶手串'], placement: '贴身佩戴', materials: { '不动明王吊坠': ['玉', '金'], '黄水晶手串': ['黄水晶'] }, note: '黄水晶招财' }
      },
      '狗': {
        home: { items: ['龙龟', '葫芦', '五帝钱'], placement: '客厅、门后', materials: { '龙龟': ['铜'], '葫芦': ['铜'], '五帝钱': ['铜'] }, note: '冲太岁需化煞' },
        car: { items: ['平安符', '小葫芦'], placement: '后视镜', materials: { '平安符': ['黄布'], '小葫芦': ['铜'] }, note: '葫芦保平安' },
        body: { items: ['阿弥陀佛吊坠', '黑曜石手串', '红绳'], placement: '贴身佩戴', materials: { '阿弥陀佛吊坠': ['玉', '金'], '黑曜石手串': ['黑曜石'], '红绳': ['红丝线'] }, note: '冲太岁需本命佛化解' }
      },
      '猪': {
        home: { items: ['貔貅', '聚宝盆', '福猪摆件'], placement: '客厅财位', materials: { '貔貅': ['铜', '玉'], '聚宝盆': ['铜', '水晶'], '福猪': ['玉', '铜'] }, note: '福猪象征福气' },
        car: { items: ['平安符', '小貔貅'], placement: '仪表盘', materials: { '平安符': ['黄布'], '小貔貅': ['玉'] }, note: '平安出行' },
        body: { items: ['阿弥陀佛吊坠', '黑曜石手串'], placement: '贴身佩戴', materials: { '阿弥陀佛吊坠': ['玉', '金'], '黑曜石手串': ['黑曜石'] }, note: '黑曜石辟邪' }
      }
    }
  },

  // ====================================================================
  // 推荐道观寺庙（按生肖）
  // ====================================================================
  temples: {
    '鼠': [
      {
        name: '普陀山普济寺',
        location: '浙江舟山普陀山',
        deity: '千手观音',
        festival: '二月十九/六月十九/九月十九观音圣诞',
        highlights: ['南海观音立像', '紫竹林', '不肯去观音院', '潮音洞'],
        transport: '上海/宁波乘船至普陀山，再乘岛上巴士',
        accommodation: '岛上众多民宿、酒店',
        tips: '求愿需默念姓名住址所求愿望，三步一拜最虔诚；潮音洞投硬币许愿'
      },
      {
        name: '南山寺',
        location: '海南三亚',
        deity: '千手观音',
        festival: '观音圣诞',
        highlights: ['108米海上观音', '金玉观音阁', '南山寺大殿'],
        transport: '三亚市区乘公交或打车',
        accommodation: '南山文化旅游区内酒店',
        tips: '海上观音三面分别代表福禄寿，绕佛三圈祈福'
      }
    ],
    '牛': [
      {
        name: '五台山显通寺',
        location: '山西忻州五台山',
        deity: '虚空藏菩萨',
        festival: '每月初八虚空藏菩萨日',
        highlights: ['无量殿', '铜殿', '大白塔'],
        transport: '太原乘车至五台山',
        accommodation: '台怀镇众多宾馆、寺院挂单',
        tips: '登1080台阶消业障；每月初八供灯最灵'
      },
      {
        name: '峨眉山万年寺',
        location: '四川乐山峨眉山',
        deity: '普贤菩萨（虚空藏同属智慧菩萨）',
        festival: '二月廿一普贤圣诞',
        highlights: ['无梁砖殿', '普贤骑象铜像', '白水秋风'],
        transport: '成都乘车至峨眉山',
        accommodation: '峨眉山脚下或山上酒店',
        tips: '三步一拜上金顶，求愿后须行愿还愿'
      }
    ],
    '虎': [
      {
        name: '五台山显通寺',
        location: '山西忻州五台山',
        deity: '虚空藏菩萨',
        festival: '每月初八',
        highlights: ['无量殿', '铜殿', '大白塔'],
        transport: '太原乘车至五台山',
        accommodation: '台怀镇',
        tips: '智慧与财富双修'
      }
    ],
    '兔': [
      {
        name: '五台山殊像寺',
        location: '山西忻州五台山',
        deity: '文殊菩萨',
        festival: '四月初四文殊圣诞',
        highlights: ['文殊殿', '般若泉', '五百罗汉'],
        transport: '太原乘车至五台山',
        accommodation: '台怀镇',
        tips: '考前必拜，面朝东南持文殊心咒；登1080台阶消业障'
      },
      {
        name: '峨眉山金顶',
        location: '四川乐山峨眉山',
        deity: '普贤菩萨（文殊智慧同修）',
        festival: '四月初四',
        highlights: ['十方普贤金像', '金顶云海', '日出'],
        transport: '成都乘车至峨眉山',
        accommodation: '金顶酒店',
        tips: '求智慧登金顶，供灯持咒'
      }
    ],
    '龙': [
      {
        name: '峨眉山金顶',
        location: '四川乐山峨眉山',
        deity: '普贤菩萨',
        festival: '二月廿一普贤圣诞',
        highlights: ['十方普贤金像', '金顶云海', '日出'],
        transport: '成都乘车至峨眉山',
        accommodation: '金顶酒店',
        tips: '三步一拜上金顶，发愿后须行愿还愿'
      }
    ],
    '蛇': [
      {
        name: '峨眉山金顶',
        location: '四川乐山峨眉山',
        deity: '普贤菩萨',
        festival: '二月廿一普贤圣诞',
        highlights: ['十方普贤金像', '金顶云海'],
        transport: '成都乘车至峨眉山',
        accommodation: '金顶酒店',
        tips: '行愿实践，行善积德'
      }
    ],
    '马': [
      {
        name: '狼山广教寺',
        location: '江苏南通狼山',
        deity: '大势至菩萨',
        festival: '农历七月十三大势至菩萨圣诞',
        highlights: ['支云塔', '大势至殿', '观音殿'],
        transport: '南通市区乘公交',
        accommodation: '狼山脚下酒店',
        tips: '大势至菩萨智慧光普照，持念圣号'
      }
    ],
    '羊': [
      {
        name: '法门寺',
        location: '陕西宝鸡扶风',
        deity: '大日如来（佛指舍利）',
        festival: '四月初八佛诞',
        highlights: ['佛指舍利', '合十舍利塔', '法门寺地宫'],
        transport: '西安乘车至扶风',
        accommodation: '法门寺附近酒店',
        tips: '礼拜佛指舍利功德无量，供灯七盏'
      }
    ],
    '猴': [
      {
        name: '法门寺',
        location: '陕西宝鸡扶风',
        deity: '大日如来',
        festival: '四月初八佛诞',
        highlights: ['佛指舍利', '合十舍利塔'],
        transport: '西安乘车至扶风',
        accommodation: '法门寺附近酒店',
        tips: '礼拜佛指舍利，持大日如来心咒'
      }
    ],
    '鸡': [
      {
        name: '鸡鸣寺',
        location: '江苏南京',
        deity: '不动明王',
        festival: '每月初八',
        highlights: ['药师佛塔', '观音殿', '樱花大道'],
        transport: '南京市区公交',
        accommodation: '南京市区酒店',
        tips: '求坚定意志，持念不动明王心咒'
      }
    ],
    '狗': [
      {
        name: '庐山东林寺',
        location: '江西九江庐山',
        deity: '阿弥陀佛',
        festival: '十一月十七阿弥陀佛圣诞',
        highlights: ['东林大佛', '念佛堂', '祖师殿'],
        transport: '九江乘车至庐山',
        accommodation: '东林寺挂单',
        tips: '净土宗祖庭，持念阿弥陀佛圣号，参与佛七法会'
      },
      {
        name: '灵岩山寺',
        location: '江苏苏州',
        deity: '阿弥陀佛',
        festival: '十一月十七',
        highlights: ['灵岩塔', '念佛堂', '印光大师纪念堂'],
        transport: '苏州市区公交',
        accommodation: '苏州市区酒店',
        tips: '净土宗道场，持名念佛'
      }
    ],
    '猪': [
      {
        name: '庐山东林寺',
        location: '江西九江庐山',
        deity: '阿弥陀佛',
        festival: '十一月十七阿弥陀佛圣诞',
        highlights: ['东林大佛', '念佛堂'],
        transport: '九江乘车至庐山',
        accommodation: '东林寺挂单',
        tips: '净土宗祖庭，念佛往生'
      }
    ]
  },

  // ====================================================================
  // 十二生肖性格特征
  // ====================================================================
  personality: {
    '鼠': {
      strengths: ['聪明机智', '适应力强', '勤奋节俭', '直觉敏锐', '善于理财'],
      weaknesses: ['多疑敏感', '眼光短浅', '爱面子', '易焦虑'],
      career: ['商业', '金融', '会计', '策划', '研究'],
      compatibility: { best: ['龙', '猴', '牛'], good: ['虎', '蛇', '狗'], avoid: ['马', '羊'] }
    },
    '牛': {
      strengths: ['勤恳踏实', '责任感强', '有耐心', '意志坚定', '值得信赖'],
      weaknesses: ['固执己见', '不善表达', '过于保守', '容易钻牛角尖'],
      career: ['农业', '建筑', '工程', '医疗', '教育'],
      compatibility: { best: ['鼠', '蛇', '鸡'], good: ['猪', '猴'], avoid: ['羊', '马'] }
    },
    '虎': {
      strengths: ['勇敢果断', '正义感强', '领导力', '热情慷慨', '有魄力'],
      weaknesses: ['冲动鲁莽', '固执', '爱面子', '容易得罪人'],
      career: ['军人', '警察', '管理', '创业', '体育'],
      compatibility: { best: ['马', '狗', '猪'], good: ['鼠', '兔'], avoid: ['猴', '蛇'] }
    },
    '兔': {
      strengths: ['温柔善良', '机智灵活', '有艺术天分', '人缘好', '善解人意'],
      weaknesses: ['优柔寡断', '过于敏感', '逃避现实', '虚荣心强'],
      career: ['艺术', '设计', '教育', '医疗', '服务'],
      compatibility: { best: ['羊', '猪', '狗'], good: ['虎', '兔'], avoid: ['鸡', '龙'] }
    },
    '龙': {
      strengths: ['志向远大', '领袖气质', '创造力强', '热情大方', '有胆识'],
      weaknesses: ['傲慢', '好高骛远', '缺乏耐心', '脾气急躁'],
      career: ['创业', '管理', '政治', '艺术', '科研'],
      compatibility: { best: ['鼠', '猴', '鸡'], good: ['虎', '蛇'], avoid: ['狗', '兔'] }
    },
    '蛇': {
      strengths: ['智慧深沉', '洞察力强', '冷静理智', '有谋略', '审美敏锐'],
      weaknesses: ['多疑', '嫉妒心强', '过于保守', '不善交际'],
      career: ['研究', '心理咨询', '艺术', '金融', '医学'],
      compatibility: { best: ['牛', '鸡', '猴'], good: ['龙', '蛇'], avoid: ['猪', '虎'] }
    },
    '马': {
      strengths: ['热情开朗', '行动力强', '独立自主', '乐观向上', '善于社交'],
      weaknesses: ['缺乏耐心', '三分钟热度', '浮躁', '不善理财'],
      career: ['销售', '旅游', '体育', '传媒', '创业'],
      compatibility: { best: ['虎', '羊', '狗'], good: ['龙', '蛇'], avoid: ['鼠', '牛'] }
    },
    '羊': {
      strengths: ['温和善良', '有同情心', '艺术天分', '细腻体贴', '有耐心'],
      weaknesses: ['优柔寡断', '过于敏感', '依赖性强', '悲观消极'],
      career: ['艺术', '教育', '医疗', '设计', '公益'],
      compatibility: { best: ['兔', '猪', '马'], good: ['蛇', '猴'], avoid: ['牛', '鼠'] }
    },
    '猴': {
      strengths: ['聪明机智', '灵活多变', '善于社交', '学习能力强', '幽默风趣'],
      weaknesses: ['多动', '不够专注', '爱耍小聪明', '缺乏恒心'],
      career: ['科技', '商业', '演艺', '创意', '销售'],
      compatibility: { best: ['鼠', '龙', '蛇'], good: ['马', '羊'], avoid: ['虎', '猪'] }
    },
    '鸡': {
      strengths: ['精明果断', '组织力强', '勤奋努力', '有责任感', '注重细节'],
      weaknesses: ['爱面子', '挑剔', '过于张扬', '固执己见'],
      career: ['会计', '审计', '管理', '设计', '医疗'],
      compatibility: { best: ['牛', '蛇', '龙'], good: ['羊', '猴'], avoid: ['兔', '狗'] }
    },
    '狗': {
      strengths: ['忠诚可靠', '正义感强', '责任心强', '直率坦诚', '乐于助人'],
      weaknesses: ['过于敏感', '爱操心', '固执', '不善变通'],
      career: ['军人', '警察', '法律', '公益', '服务'],
      compatibility: { best: ['虎', '兔', '马'], good: ['鼠', '蛇'], avoid: ['龙', '鸡'] }
    },
    '猪': {
      strengths: ['善良宽厚', '乐观豁达', '诚实守信', '慷慨大方', '有福气'],
      weaknesses: ['过于天真', '容易轻信', '懒惰', '缺乏主见'],
      career: ['餐饮', '艺术', '教育', '医疗', '服务'],
      compatibility: { best: ['兔', '羊', '虎'], good: ['鼠', '牛'], avoid: ['蛇', '猴'] }
    }
  }
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ZODIAC_KNOWLEDGE;
}
