/**
 * 易道智鉴 · 口诀选择器（完整版）
 * =================================
 * 提供命理口诀的多维度筛选、随机抽取、学习路径和自测功能。
 *
 * 核心功能：
 *   - 多维度筛选：按领域、难度、来源、分类、关键词组合筛选
 *   - 随机口诀：支持完全随机和加权随机（按难度/分类）
 *   - 学习路径：从入门到精通的分阶段推荐学习顺序
 *   - 自测题库：选择题形式的命理知识自测功能
 *   - 统计导出：口诀数据的统计分析与导出
 *
 * 依赖：需要先加载 koujue-daily.js 以获取 KOUJUE_DAILY_DATABASE
 *
 * 使用方式：
 *   const selector = require('./select-koujue');
 *   const results = selector.selectKoujueByFilter({ category: '用神', difficulty: '进阶' });
 *   const path = selector.getKoujueLearningPath();
 *   const quiz = selector.generateQuiz(10);
 */

// ============================================================
// 领域分类定义
// 涵盖九大玄学领域：八字、紫微、风水、六爻、奇门、梅花、测字、择日、佛道
// 每个领域定义了对应的口诀类别标签，用于数据筛选
// ============================================================
const FIELD_DEFINITIONS = {
  bazi: {
    id: 'bazi',
    name: '八字命理',
    description: '子平术四柱预测学，以出生年月日时推算命运走势',
    categories: ['天干地支', '十神', '格局', '用神', '大运流年', '神煞', '纳音', '刑冲合害'],
    relatedSources: ['滴天髓', '穷通宝鉴', '三命通会', '子平真诠', '渊海子平', '神峰通考', '五言独步', '四言独步'],
    totalCount: 365,
  },
  ziwei: {
    id: 'ziwei',
    name: '紫微斗数',
    description: '以紫微星为首的十四主星排布十二宫垣，结合四化飞星论命',
    categories: ['星曜', '宫位', '四化', '格局'],
    relatedSources: ['紫微斗数全书', '太微赋', '骨髓赋'],
    totalCount: 0, // 待补充
  },
  fengshui: {
    id: 'fengshui',
    name: '风水堪舆',
    description: '以龙穴砂水向为核心，分峦头形势与理气玄空两大流派',
    categories: ['峦头', '理气', '玄空', '八宅', '三元'],
    relatedSources: ['葬经', '撼龙经', '青囊奥语', '天玉经'],
    totalCount: 0,
  },
  liuyao: {
    id: 'liuyao',
    name: '六爻预测',
    description: '以三枚铜钱起卦，配世应六亲六兽，断吉凶应期',
    categories: ['起卦', '装卦', '断卦', '应期'],
    relatedSources: ['卜筮正宗', '增删卜易', '易隐'],
    totalCount: 0,
  },
  qimen: {
    id: 'qimen',
    name: '奇门遁甲',
    description: '上古三式之一，以洛书九宫为框架推演时空吉凶',
    categories: ['排盘', '八门', '九星', '八神', '格局'],
    relatedSources: ['烟波钓叟赋', '奇门遁甲统宗', '神奇之门'],
    totalCount: 0,
  },
  meihua: {
    id: 'meihua',
    name: '梅花易数',
    description: '邵雍所创，以象数理占为核心，灵活起卦观象断事',
    categories: ['起卦', '体用', '八卦', '外应'],
    relatedSources: ['梅花易数', '皇极经世'],
    totalCount: 0,
  },
  cezi: {
    id: 'cezi',
    name: '测字拆字',
    description: '以汉字字形字义为媒介，通过拆解组合推断吉凶',
    categories: ['拆字', '会意', '谐音', '五行'],
    relatedSources: ['测字秘牒', '字触'],
    totalCount: 0,
  },
  zeri: {
    id: 'zeri',
    name: '择日选时',
    description: '依据黄道黑道、二十八宿等选择吉日良辰行事',
    categories: ['黄道', '黑道', '二十八宿', '建除'],
    relatedSources: ['协纪辨方书', '鳌头通书', '董公择日'],
    totalCount: 0,
  },
  fodao: {
    id: 'fodao',
    name: '佛道修炼',
    description: '涵盖佛教咒语真言与道教符箓心法的修行口诀',
    categories: ['佛咒', '道诀', '禅修', '密法', '符箓', '丹道'],
    relatedSources: ['金刚经', '心经', '道德经', '清静经', '北斗经'],
    totalCount: 0,
  },
};

// ============================================================
// 难度筛选配置
// 三级难度划分：入门（零基础概念）、进阶（组合应用）、精通（深层原理）
// ============================================================
const DIFFICULTY_LEVELS = {
  '入门': {
    level: 1,
    label: '入门',
    description: '适合零基础学习者，以基础概念和术语介绍为主',
    recommendedDays: '前30天',
    prerequisites: [],
  },
  '进阶': {
    level: 2,
    label: '进阶',
    description: '适合有一定基础的学员，涉及组合应用和格局判断',
    recommendedDays: '第31-50天',
    prerequisites: ['入门'],
  },
  '精通': {
    level: 3,
    label: '精通',
    description: '适合资深学者，探讨深层命理原理和特殊格局',
    recommendedDays: '第51-60天',
    prerequisites: ['入门', '进阶'],
  },
};

// ============================================================
// 来源经典配置
// 八字命理经典著作的完整信息，用于按来源筛选
// ============================================================
const SOURCE_DEFINITIONS = {
  '滴天髓': {
    title: '滴天髓',
    author: '刘伯温（明代）',
    era: '明代',
    description: '命理经典中的经典，以精炼四六骈文阐述命理玄机。十天干特性章节最为著名，被后人誉为「八字中的道德经」。',
    difficulty: '精通',
    chapters: ['通神颂', '天干论', '地支论', '格局论', '体用论'],
    entryCount: 42,
  },
  '穷通宝鉴': {
    title: '穷通宝鉴',
    author: '余春台（清代）',
    era: '清代',
    description: '原名《栏江网》，专论十干在十二月令的用神取法。以调候为核心思想，是取用神的必读经典。书中详细阐述了在何种月令条件下取何种用神最为得力。',
    difficulty: '进阶',
    chapters: ['甲木总论', '乙木总论', '丙火总论', '丁火总论', '戊土总论', '己土总论', '庚金总论', '辛金总论', '壬水总论', '癸水总论'],
    entryCount: 28,
  },
  '三命通会': {
    title: '三命通会',
    author: '万民英（明代）',
    era: '明代',
    description: '十二卷巨著，集明代以前命理之大成。内容包罗万象，从天干地支基础到精深格局无不涵盖，为命理学百科全书式的权威著作。',
    difficulty: '进阶',
    chapters: ['干支', '纳音', '神煞', '格局', '女命', '小儿', '杂论'],
    entryCount: 85,
  },
  '子平真诠': {
    title: '子平真诠',
    author: '沈孝瞻（清代）',
    era: '清代',
    description: '以格局论命为核心。首次系统阐述了顺用逆用的格局方法论：吉神顺用、凶神逆用。对后世子平术影响深远，是格局派的奠基之作。',
    difficulty: '进阶',
    chapters: ['论用神', '论格局', '论体用', '论顺逆'],
    entryCount: 52,
  },
  '渊海子平': {
    title: '渊海子平',
    author: '徐大升（宋代）',
    era: '宋代',
    description: '子平术的开山之作，以赋文和歌诀形式讲解命理。语言通俗易懂，内容生动形象，是入门者的首选读本。对后世命理传播贡献巨大。',
    difficulty: '入门',
    chapters: ['论日为主', '论月令', '论财官', '论运', '论神煞'],
    entryCount: 68,
  },
  '神峰通考': {
    title: '神峰通考',
    author: '张楠（明代）',
    era: '明代',
    description: '提出著名的病药学说：命局有病方为贵，有药方能发福。强调命局中的缺陷反而是成就贵格的必要条件，对医命思想影响深远。',
    difficulty: '精通',
    chapters: ['病药说', '格局辨', '五行论'],
    entryCount: 18,
  },
  '五言独步': {
    title: '五言独步',
    author: '佚名',
    era: '不详',
    description: '以五言诗格式概括命理论断要点。文字简练、朗朗上口、便于记诵。是历代命理师口传心授的核心歌诀。',
    difficulty: '进阶',
    chapters: ['通论', '格局', '用神', '岁运'],
    entryCount: 14,
  },
  '四言独步': {
    title: '四言独步',
    author: '佚名',
    era: '不详',
    description: '以四言诗格式阐述命理纲要。比五言更为精炼，高度浓缩命理精要于寥寥数句之中，是口诀中的口诀。',
    difficulty: '进阶',
    chapters: ['纲要', '干支', '格局', '岁运'],
    entryCount: 10,
  },
};

// ============================================================
// 学习路径定义
// 60天系统学习计划，从零基础到精通
// ============================================================
const LEARNING_PATH = {
  title: '八字命理口诀60天系统学习路径',
  description: '从入门到精通的四阶段学习计划，每天学习一条精选口诀，配合解释理解命理核心概念。按顺序循序渐进，基础牢固后再深入学习。',
  stages: [
    {
      id: 'stage-1',
      name: '第一阶段：入门奠基',
      dayRange: '第1-15天',
      difficulty: '入门',
      description: '掌握天干地支基础概念和五行生克的核心理论。这一阶段是整个命理学的地基，务必扎实理解每一条口诀背后的阴阳五行原理。学习完成后应能熟练说出十天干十二地支的五行属性、方位、阴阳，理解五行相生相克的顺序和反生反克的特殊情况。',
      keyTopics: ['十天干名称与五行', '十二地支名称与五行', '地支生肖对应', '五行相生相克', '五行反生反克', '天干五合', '地支六合基础', '三合局基础概念'],
      recommendedEntries: 15,
    },
    {
      id: 'stage-2',
      name: '第二阶段：入门深化',
      dayRange: '第16-30天',
      difficulty: '入门',
      description: '在掌握干支五行基础上，进一步学习神煞、纳音、刑冲合害等入门级概念。神煞是命理中判断特殊吉凶的重要工具；纳音补充了干支之外的五行维度；刑冲合害则揭示了地支之间的复杂互动关系。此阶段结束应能完整排出一个八字并初步判断日主强弱。',
      keyTopics: ['十神推算方法', '天乙贵人', '文昌贵人', '驿马与桃花', '六十甲子纳音', '地支六冲', '地支三合三会', '地支相刑相害'],
      recommendedEntries: 15,
    },
    {
      id: 'stage-3',
      name: '第三阶段：进阶应用',
      dayRange: '第31-50天',
      difficulty: '进阶',
      description: '进入格局分析和用神取法的核心内容。格局决定了命局的基本层次和人生走向，用神则是改变命运的关键钥匙。本阶段将学习正格八格和常见变格的判断方法，理解扶抑、调候、通关、病药四种用神取法的适用场景和判断技巧。学习完本阶段应能独立分析一个八字的格局层次和用神取法。',
      keyTopics: ['正官格', '七杀格', '正印格', '偏印格', '正财格', '偏财格', '食神格', '伤官格', '建禄与阳刃格', '扶抑用神', '调候用神', '通关用神', '病药用神', '从格化格'],
      recommendedEntries: 20,
    },
    {
      id: 'stage-4',
      name: '第四阶段：精通要义',
      dayRange: '第51-60天',
      difficulty: '精通',
      description: '深入学习从格、化格等特殊格局，理解岁运并临、天克地冲等大运流年的深层应期理论，综合运用纳音与格局的交互判断。本阶段将之前学习的零散知识点融会贯通，形成完整的命理分析思维框架。完成本阶段后，你已具备独立批命的基本功，接下来需要大量实战练习来积累经验。',
      keyTopics: ['从杀从财从儿格', '化气格真化条件', '岁运并临', '天克地冲', '换运吉凶', '纳音与格局综合', '四言独步精要', '五言独步精要'],
      recommendedEntries: 10,
    },
  ],
  totalDays: 60,
};

// ============================================================
// 自测题库
// 选择题形式的命理知识自测，每题四个选项，配有正确答案和解析
// ============================================================
const QUIZ_BANK = [
  {
    id: 1,
    question: '十天干中，甲木的五行属性是什么？',
    options: ['金', '木', '水', '火'],
    answer: 1,
    explain: '甲为阳木，属东方，其象为参天大树。在十天干中排列第一位。甲木刚直挺拔，为栋梁之材。',
    category: '天干地支',
    difficulty: '入门',
  },
  {
    id: 2,
    question: '"甲木参天，脱胎要火"出自哪部经典？',
    options: ['《三命通会》', '《滴天髓》', '《渊海子平》', '《子平真诠》'],
    answer: 1,
    explain: '此句出自《滴天髓》甲木章首句。意为甲木如同参天大树，初春嫩芽必须依赖火的温暖才能抽枝发芽、蓬勃生长。',
    category: '天干地支',
    difficulty: '入门',
  },
  {
    id: 3,
    question: '地支"子"在五行中属什么？',
    options: ['木', '火', '金', '水'],
    answer: 3,
    explain: '子属水，为阳水之正位，在八卦属坎。子是十二地支之首，时辰为夜半23点至凌晨1点，生肖为鼠。',
    category: '天干地支',
    difficulty: '入门',
  },
  {
    id: 4,
    question: '克我者为官杀，其中阴阳相异者称为什么？',
    options: ['七杀', '正官', '偏财', '正印'],
    answer: 1,
    explain: '克我而阴阳相异者为正官。以甲木为例，辛金（阴金）克甲木（阳木），阴阳相异，故辛为甲之正官。正官为有情之克。',
    category: '十神',
    difficulty: '入门',
  },
  {
    id: 5,
    question: '"有病方为贵，无伤不是奇"一语出自哪部经典？',
    options: ['《滴天髓》', '《五言独步》', '《三命通会》', '《子平真诠》'],
    answer: 1,
    explain: '此名言出自《五言独步》。它的意思是：命局中存在缺陷（病）反而可能是贵格的标志，四平八稳、完美无缺的命局未必神奇。核心思想是病药相济方为贵。',
    category: '格局',
    difficulty: '进阶',
  },
  {
    id: 6,
    question: '甲木生于正月（寅月），最需要的是什么调候用神？',
    options: ['戊土和庚金', '丙火和癸水', '壬水和甲木', '丁火和壬水'],
    answer: 1,
    explain: '正月甲木（寅月），初春尚有余寒。最需要丙火来温暖驱寒、癸水来滋润根基。丙癸双透，富贵双全。这正是《穷通宝鉴》调候理论的核心要义。',
    category: '用神',
    difficulty: '进阶',
  },
  {
    id: 7,
    question: '地支"寅午戌"三合局合成的五行是什么？',
    options: ['木', '水', '火', '金'],
    answer: 2,
    explain: '寅午戌三合火局。寅为火之长生、午为火之帝旺、戌为火之墓库。三者齐全则火势冲天，烈焰腾空。',
    category: '刑冲合害',
    difficulty: '进阶',
  },
  {
    id: 8,
    question: '庚金的特性在《滴天髓》中被描述为什么？',
    options: ['温润而清', '刚健为最', '中正蓄藏', '欺霜侮雪'],
    answer: 1,
    explain: '《滴天髓》云：庚金带煞，刚健为最。庚金为十天干中最刚健者，如同刀斧利器，锋芒毕露。得水而清，得火而锐。',
    category: '天干地支',
    difficulty: '入门',
  },
  {
    id: 9,
    question: '大运排法中，阳年男性和阴年女性的起运方向是？',
    options: ['逆排', '顺排', '随机', '不分顺逆'],
    answer: 1,
    explain: '阳年天干为甲丙戊庚壬的年份，男命大运顺排（从月柱顺数）；阴年天干为乙丁己辛癸的年份，女命也顺排。反之则为逆排。口诀为：阳男阴女顺行，阴男阳女逆行。',
    category: '大运流年',
    difficulty: '进阶',
  },
  {
    id: 10,
    question: '八字中"正印"的定义是？',
    options: ['我生而阴阳相异', '生我而阴阳相异', '克我而阴阳相异', '同我而阴阳相异'],
    answer: 1,
    explain: '生我而阴阳相异者为正印。以甲木为例，癸水（阴水）生甲木（阳木），阴阳相异，故癸为甲之正印。印者荫也，如母亲之慈爱庇护。',
    category: '十神',
    difficulty: '入门',
  },
  {
    id: 11,
    question: '"辰戌丑未"在十二地支中被称为？',
    options: ['四正之位', '四生之方', '四库之土', '四败之地'],
    answer: 2,
    explain: '辰戌丑未为四墓库之土。辰为水库、戌为火库、丑为金库、未为木库。四库之神主收藏，各含杂气（藏干不止一个）。',
    category: '天干地支',
    difficulty: '进阶',
  },
  {
    id: 12,
    question: '丙辛合化后的五行是什么？',
    options: ['木', '火', '土', '水'],
    answer: 3,
    explain: '丙火与辛金相合化为水。丙为阳火，辛为阴金，火金相遇而化为水。此合名为威制之合，需水旺之月方为真化。',
    category: '刑冲合害',
    difficulty: '进阶',
  },
  {
    id: 13,
    question: '"伤官见官"在什么情况下为贵而不是凶？',
    options: ['火土伤官', '金水伤官', '木火伤官', '土金伤官'],
    answer: 1,
    explain: '金水伤官要见官。因金水伤官格寒湿之气重，见火（官星）可调候暖局，反为贵格。而火土伤官则宜伤尽，见官反为祸。',
    category: '格局',
    difficulty: '精通',
  },
  {
    id: 14,
    question: '天乙贵人的查法口诀中，甲戊庚的贵人是？',
    options: ['子申', '丑未', '亥酉', '卯巳'],
    answer: 1,
    explain: '甲戊并牛羊，即甲日、戊日、庚日生人以丑（牛）和未（羊）为天乙贵人。天乙贵人是命中最尊贵之神，有逢凶化吉之效。',
    category: '神煞',
    difficulty: '进阶',
  },
  {
    id: 15,
    question: '"从儿不论身强弱"中"儿"指的是什么？',
    options: ['官杀', '食伤', '印星', '比劫'],
    answer: 1,
    explain: '从儿格中的"儿"指食神和伤官。我生者为食伤，即"儿"。从儿格的关键不在于日主强弱，而在于食伤能否再生财星（儿又生儿）。',
    category: '格局',
    difficulty: '精通',
  },
  {
    id: 16,
    question: '地支六冲中，"子午冲"代表什么？',
    options: ['水火相战', '木火通明', '金水相生', '土金相生'],
    answer: 0,
    explain: '子属水、午属火，子午相冲为水火相战。在八字中子午冲主情绪波动大、动荡不安、水火不济。',
    category: '刑冲合害',
    difficulty: '进阶',
  },
  {
    id: 17,
    question: '"食神制杀"中"杀"指的是什么？',
    options: ['七杀', '正官', '伤官', '劫财'],
    answer: 0,
    explain: '"杀"即七杀（偏官）。食神制杀为贵格，以食神之智慧化解七杀的凶暴之气，转凶为吉。',
    category: '格局',
    difficulty: '进阶',
  },
  {
    id: 18,
    question: '地支"申子辰"三合局合成的五行是什么？',
    options: ['火', '水', '木', '金'],
    answer: 1,
    explain: '申子辰三合水局。申为水之长生、子为水之帝旺、辰为水之墓库。三合水局水势浩荡。',
    category: '刑冲合害',
    difficulty: '进阶',
  },
  {
    id: 19,
    question: '六十甲子中，甲子旬的第二位是什么？',
    options: ['乙丑', '丙寅', '丁卯', '甲戌'],
    answer: 0,
    explain: '甲子旬为甲子、乙丑、丙寅、丁卯、戊辰、己巳、庚午、辛未、壬申、癸酉。乙丑为第二位。',
    category: '天干地支',
    difficulty: '入门',
  },
  {
    id: 20,
    question: '"伤官配印"为什么是贵格？',
    options: ['伤官生印', '印星克制伤官之傲', '伤官与印比和', '伤印互不相干'],
    answer: 1,
    explain: '伤官之人聪明高傲、恃才傲物。印星（正印偏印）可以制约伤官的狂傲之气，使其才华得到正统发挥，故伤官配印为贵格。',
    category: '格局',
    difficulty: '精通',
  },
  {
    id: 21,
    question: '"天克地冲"在大运流年中意味什么？',
    options: ['大吉大利', '动荡不安多有变故', '平平无奇', '财源广进'],
    answer: 1,
    explain: '天克地冲是大运流年中最凶的组合之一，主该年动荡不安、多有变故，需特别谨慎行事。如甲子大运遇庚午流年即为天克地冲。',
    category: '大运流年',
    difficulty: '精通',
  },
  {
    id: 22,
    question: '丁壬合化后的五行是什么？',
    options: ['木', '火', '水', '金'],
    answer: 0,
    explain: '丁火与壬水相合化为木。丁为阴火、壬为阳水，水火相合反生木，此合名为淫匿之合。',
    category: '刑冲合害',
    difficulty: '进阶',
  },
  {
    id: 23,
    question: '八字中"劫财"的定义是？',
    options: ['同五行同阴阳', '同五行异阴阳', '生我异阴阳', '克我同阴阳'],
    answer: 0,
    explain: '与日主五行相同且阴阳也相同者为劫财。如甲木见甲木（同为阳木），或乙木见乙木（同为阴木）。劫财主竞争、争夺、破耗。',
    category: '十神',
    difficulty: '入门',
  },
  {
    id: 24,
    question: '纳音五行中，甲子乙丑的纳音是什么？',
    options: ['海中金', '炉中火', '大林木', '涧下水'],
    answer: 0,
    explain: '甲子乙丑海中金。六十甲子纳音以海中金为始，甲子乙丑如金沉海底，藏而不露，待时而发。',
    category: '纳音',
    difficulty: '进阶',
  },
  {
    id: 25,
    question: '"杀印相生"中杀和印的生克关系是什么？',
    options: ['杀生印', '印生杀', '杀克印', '印克杀'],
    answer: 0,
    explain: '杀（七杀）生印（正印/偏印），七杀的凶暴之气转化为印星的仁慈护佑之力，化杀为权，为贵格。',
    category: '格局',
    difficulty: '进阶',
  },
  {
    id: 26,
    question: '地支中哪四个为"四正之位"（子午卯酉）？',
    options: ['子午卯酉全部是', '只有子午是', '只有卯酉是', '子午卯酉中只有两个是'],
    answer: 0,
    explain: '子午卯酉为四正之位（四帝旺），分别为北方子水、南方午火、东方卯木、西方酉金。四正在各自方位的正中央，气最纯粹。',
    category: '天干地支',
    difficulty: '入门',
  },
  {
    id: 27,
    question: '"建禄格"和"阳刃格"的区别是什么？',
    options: ['建禄为月令比肩，阳刃为月令劫财', '建禄为月令劫财，阳刃为月令比肩', '两者完全相同', '建禄只出现在阳干'],
    answer: 0,
    explain: '建禄格是月令为日主的比肩（同五行异阴阳），如甲木生于寅月（甲见寅为比肩）；阳刃格是月令为日主的劫财（同五行同阴阳），如甲木生于卯月（甲见卯为劫财/阳刃）。阳刃比建禄更凶，因劫财争夺之力更强。',
    category: '格局',
    difficulty: '精通',
  },
  {
    id: 28,
    question: '"岁运并临"指什么情况？',
    options: ['大运与流年干支相同', '两个流年干支相同', '大运与命局相同', '流年与月柱相同'],
    answer: 0,
    explain: '大运和流年干支完全相同时称为岁运并临。此时大运和流年的力量叠加，吉凶加倍。俗语云"岁运并临，不死自己死他人"虽夸张，但确需高度警惕。',
    category: '大运流年',
    difficulty: '精通',
  },
  {
    id: 29,
    question: '风水学中，八卦中哪一卦代表西北方？',
    options: ['乾', '坤', '艮', '坎'],
    answer: 0,
    explain: '乾卦在后天八卦中对应西北方。乾为天为父为君，西北方为乾位，在风水中代表男主人运势。',
    category: '刑冲合害',
    difficulty: '入门',
  },
  {
    id: 30,
    question: '"藤萝系甲"描述的是什么格局特征？',
    options: ['乙木得甲木帮扶', '戊土得己土帮扶', '庚金得辛金帮扶', '壬水得癸水帮扶'],
    answer: 0,
    explain: '藤萝系甲出自《滴天髓》乙木章。乙木柔弱如藤萝，若能依附甲木（如藤缠大树），则可借甲木之力上达高处。乙木以甲为劫财却也以甲为依托，可春可秋。',
    category: '格局',
    difficulty: '精通',
  },
];

// ============================================================
// 口诀学习路径（入门10条 → 进阶20条 → 精通20条）
// ============================================================
const KOUJUE_LEARNING_PATH = {
  title: '易道智鉴 · 口诀学习路径（50条精华口诀）',
  intro: '从入门到精通的系统学习路径，按难度分级推荐50条核心口诀。入门10条打基础、进阶20条学应用、精通20条探奥秘。建议按顺序逐条学习，基础牢固后再进阶。',
  stages: [
    {
      level: '入门',
      count: 10,
      description: '零基础入门，以基本概念和术语为核心。每天学习1条，10天完成。重点理解天干地支、五行生克、十神等基础概念。',
      criteria: '学习完成后应能：说出十天干十二地支的五行和方位、理解五行生克关系、推算十神、知道天干五合和地支六合。',
      recommended: [
        { order: 1, topic: '十天干名称与五行属性', key: '甲乙木、丙丁火、戊己土、庚辛金、壬癸水' },
        { order: 2, topic: '十二地支名称与五行属性', key: '寅卯木、巳午火、申酉金、亥子水、辰戌丑未土' },
        { order: 3, topic: '十二地支与生肖', key: '子鼠、丑牛、寅虎、卯兔、辰龙、巳蛇、午马、未羊、申猴、酉鸡、戌狗、亥猪' },
        { order: 4, topic: '五行相生相克', key: '木生火→火生土→土生金→金生水→水生木；木克土→土克水→水克火→火克金→金克木' },
        { order: 5, topic: '十神推算', key: '生我者为印、我生者为食伤、克我者为官杀、我克者为财、同我者为比劫' },
        { order: 6, topic: '天干五合', key: '甲己合土、乙庚合金、丙辛合水、丁壬合木、戊癸合火' },
        { order: 7, topic: '地支六合', key: '子丑合土、寅亥合木、卯戌合火、辰酉合金、巳申合水、午未合土' },
        { order: 8, topic: '地支三合局', key: '申子辰水、亥卯未木、寅午戌火、巳酉丑金' },
        { order: 9, topic: '地支六冲', key: '子午冲、丑未冲、寅申冲、卯酉冲、辰戌冲、巳亥冲' },
        { order: 10, topic: '天乙贵人查法', key: '甲戊庚牛羊、乙己鼠猴乡、丙丁猪鸡位、壬癸兔蛇藏、六辛逢虎马' }
      ]
    },
    {
      level: '进阶',
      count: 20,
      description: '有一定基础后进入进阶学习。以格局分析和用神取法为核心，深入学习八字命理的中级内容。每天1-2条，20天完成。',
      criteria: '学习完成后应能：判断正格八格、理解用神取法四种（扶抑/调候/通关/病药）、看懂大运排法、会看流年吉凶。',
      recommended: [
        { order: 11, topic: '正官格判断', key: '月令正官，官星有生有护，无伤官破格' },
        { order: 12, topic: '七杀格判断', key: '月令七杀，以食神制杀或印星化杀为贵' },
        { order: 13, topic: '正印格偏印格', key: '月令印星，印旺身强则以官杀为用' },
        { order: 14, topic: '正财格偏财格', key: '月令财星，财旺需身强方可担财' },
        { order: 15, topic: '食神格伤官格', key: '月令食伤，需配印或生财方为佳' },
        { order: 16, topic: '建禄格与阳刃格', key: '建禄为比肩月令，阳刃为劫财月令，需官杀制之' },
        { order: 17, topic: '扶抑用神', key: '身强则克泄耗为用（官杀/食伤/财才），身弱则生扶为用（印绶/比劫）' },
        { order: 18, topic: '调候用神', key: '根据月令寒暖选择调候五行，如冬月需火暖局，夏月需水润燥' },
        { order: 19, topic: '通关用神', key: '命局中有两种五行相战，取通关之神化解矛盾' },
        { order: 20, topic: '病药用神', key: '有病方为贵，以药去病，如身强杀浅则以财滋杀为药' },
        { order: 21, topic: '大运排法', key: '阳男阴女顺排，阴男阳女逆排；起运岁数约3-7岁' },
        { order: 22, topic: '流年吉凶', key: '大运吉流年吉则大吉，大运凶流年凶则大凶，天克地冲最凶' },
        { order: 23, topic: '地支三会局', key: '寅卯辰东方木、巳午未南方火、申酉戌西方金、亥子丑北方水' },
        { order: 24, topic: '地支相刑', key: '寅巳申无恩之刑、丑戌未恃势之刑、子卯无礼之刑、辰午酉亥自刑' },
        { order: 25, topic: '桃花（咸池）', key: '申子辰在酉、寅午戌在卯、巳酉丑在午、亥卯未在子' },
        { order: 26, topic: '驿马', key: '申子辰在寅、寅午戌在申、巳酉丑在亥、亥卯未在巳' },
        { order: 27, topic: '六十甲子纳音表', key: '甲子乙丑海中金至壬戌癸亥大海水，共30组纳音' },
        { order: 28, topic: '纳音断命法', key: '年柱纳音为根基，日柱纳音为自身，生克论命' },
        { order: 29, topic: '文昌贵人', key: '甲乙巳午报君知、丙戊申宫丁己鸡、庚猪辛鼠壬逢虎、癸人见兔入云梯' },
        { order: 30, topic: '十神生克总论', key: '比劫生食伤、食伤生财才、财才生官杀、官杀生印绶、印绶生比劫' }
      ]
    },
    {
      level: '精通',
      count: 20,
      description: '深入探索高级格局和深层原理。包括从格、化格、特殊格局的判断以及岁运应期的深层理论。每天1条，20天完成。',
      criteria: '学习完成后应能：独立批命、判断从化真假、推算大运流年吉凶应期、综合运用纳音和格局进行分析。',
      recommended: [
        { order: 31, topic: '从杀格（从官杀格）', key: '官杀极旺日主无根，从势而弃命，官杀为用' },
        { order: 32, topic: '从财格', key: '财星极旺日主无依，弃命从财，财为用神' },
        { order: 33, topic: '从儿格（从食伤格）', key: '食伤极旺日主无根，从儿不论身强弱，以食伤生财为佳' },
        { order: 34, topic: '化气格', key: '天干五合得月令之气而真化，如甲己化土需辰戌丑未月' },
        { order: 35, topic: '假从假化', key: '真从清贵、假从驳杂，真假之间的微妙差别决定命局层次' },
        { order: 36, topic: '岁运并临', key: '大运与流年干支相同，吉凶加倍，需结合命局判断' },
        { order: 37, topic: '天克地冲', key: '大运或流年与命局天克地冲，主该时期动荡不安' },
        { order: 38, topic: '换运吉凶', key: '换大运前后两年为转换期（交运脱运），运势波动大' },
        { order: 39, topic: '众寡论', key: '制化得宜为贵，制化太过或不及为病' },
        { order: 40, topic: '清浊论', key: '用神清透为贵（清），用神驳杂为贱（浊）' },
        { order: 41, topic: '真假论', key: '用神得力为真，用神无力为假；真神得用平生贵' },
        { order: 42, topic: '有情无情论', key: '用神与日主有情则吉，无情则凶' },
        { order: 43, topic: '源流论', key: '何处起根源、流到何方住，五行流通为贵' },
        { order: 44, topic: '通关论', key: '两神相战，取通关之神化解；通关之神有力则妙' },
        { order: 45, topic: '制化论', key: '制得中和为贵，制之太过或不及均为病' },
        { order: 46, topic: '战局论', key: '命局出现两种五行相战且无通关，战局凶险' },
        { order: 47, topic: '化敌为友', key: '化忌为喜、变凶为吉是格局调和的最高境界' },
        { order: 48, topic: '合而无情与合有情', key: '合去用神则凶、合来喜神则吉' },
        { order: 49, topic: '贪合忘克与贪合忘生', key: '两干相合后失去原有生克功能的变化' },
        { order: 50, topic: '综合实战', key: '综合运用以上所有知识进行完整的八字批命分析' }
      ]
    }
  ]
};

// ============================================================
// 口诀分类索引
// ============================================================
const KOUJUE_CATEGORY_INDEX = {
  title: '口诀分类索引',
  intro: '按九大玄学领域分类，列出每个领域包含的口诀类别清单和核心口诀列表。',
  categories: [
    {
      field: '八字命理', id: 'bazi', icon: '🔢',
      description: '子平术四柱预测学。口诀覆盖天干地支、十神、格局、用神、神煞、大运流年、纳音、刑冲合害八大类，共365条。',
      subcategories: [
        { name: '天干地支', count: 48, topics: ['十天干特性', '十二地支特性', '干支纪年', '六十甲子'] },
        { name: '十神', count: 42, topics: ['正官七杀', '正印偏印', '正财偏财', '食神伤官', '比肩劫财'] },
        { name: '格局', count: 65, topics: ['正格八格', '从格化格', '特殊格局', '格局高低'] },
        { name: '用神', count: 52, topics: ['扶抑', '调候', '通关', '病药'] },
        { name: '大运流年', count: 38, topics: ['大运排法', '流年判断', '岁运并临', '天克地冲'] },
        { name: '神煞', count: 45, topics: ['天乙贵人', '文昌贵人', '桃花驿马', '羊刃劫煞'] },
        { name: '纳音', count: 35, topics: ['六十纳音', '纳音五行', '纳音断命'] },
        { name: '刑冲合害', count: 40, topics: ['六冲', '六合', '三合三会', '相刑相害'] }
      ]
    },
    {
      field: '紫微斗数', id: 'ziwei', icon: '🌟',
      description: '以紫微星为首的十四主星排布十二宫垣，结合四化飞星论命。（数据待补充）',
      subcategories: [
        { name: '星曜', count: 0, topics: ['紫微', '天府', '天相', '七杀', '破军', '贪狼', '太阳', '太阴', '天机', '天同', '天梁', '廉贞', '巨门', '武曲'] },
        { name: '宫位', count: 0, topics: ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '交友', '官禄', '田宅', '福德', '父母'] },
        { name: '四化', count: 0, topics: ['化禄', '化权', '化科', '化忌'] },
        { name: '格局', count: 0, topics: ['紫府同宫', '君臣庆会', '月朗天门', '明珠出海'] }
      ]
    },
    {
      field: '风水堪舆', id: 'fengshui', icon: '⛰️',
      description: '以龙穴砂水向为核心，分峦头形势与理气玄空两大流派。（数据待补充）',
      subcategories: [
        { name: '峦头', count: 0, topics: ['龙法', '穴法', '砂法', '水法', '向法'] },
        { name: '理气', count: 0, topics: ['八卦方位', '二十四山', '罗盘用法', '飞星'] },
        { name: '玄空', count: 0, topics: ['三元九运', '玄空飞星', '七星打劫', '城门诀'] },
        { name: '八宅', count: 0, topics: ['东西命', '大游年', '吉凶方位'] },
        { name: '三元', count: 0, topics: ['三元龙', '三般卦', '兼向替卦'] }
      ]
    },
    {
      field: '六爻预测', id: 'liuyao', icon: '🪙',
      description: '以三枚铜钱起卦，配世应六亲六兽，断吉凶应期。（数据待补充）',
      subcategories: [
        { name: '起卦', count: 0, topics: ['铜钱起卦', '时间起卦', '数字起卦'] },
        { name: '装卦', count: 0, topics: ['定世应', '安六亲', '配六兽', '纳甲'] },
        { name: '断卦', count: 0, topics: ['用神取法', '原忌仇神', '飞伏神', '月建日辰'] },
        { name: '应期', count: 0, topics: ['应期判断', '旬空', '月破', '动爻'] }
      ]
    },
    {
      field: '奇门遁甲', id: 'qimen', icon: '🚪',
      description: '上古三式之一，以洛书九宫为框架推演时空吉凶。（数据待补充）',
      subcategories: [
        { name: '排盘', count: 0, topics: ['阳遁阴遁', '值符值使', '定局'] },
        { name: '八门', count: 0, topics: ['休生伤杜', '景死惊开'] },
        { name: '九星', count: 0, topics: ['天蓬', '天芮', '天冲', '天辅', '天禽', '天心', '天柱', '天任', '天英'] },
        { name: '八神', count: 0, topics: ['值符', '腾蛇', '太阴', '六合', '白虎', '玄武', '九地', '九天'] },
        { name: '格局', count: 0, topics: ['青龙回首', '飞鸟跌穴', '玉女守门'] }
      ]
    },
    {
      field: '梅花易数', id: 'meihua', icon: '🌸',
      description: '邵雍所创，以象数理占为核心，灵活起卦观象断事。',
      subcategories: [
        { name: '起卦', count: 5, topics: ['时间起卦', '数字起卦', '声音起卦', '文字起卦', '物象起卦'] },
        { name: '体用', count: 3, topics: ['体卦判定', '用卦判定', '体用生克'] },
        { name: '八卦', count: 8, topics: ['乾兑离震', '巽坎艮坤'] },
        { name: '外应', count: 4, topics: ['天时', '地理', '人物', '物象'] }
      ]
    },
    {
      field: '测字拆字', id: 'cezi', icon: '✍️',
      description: '以汉字字形字义为媒介，通过拆解组合推断吉凶。（数据待补充）',
      subcategories: [
        { name: '拆字', count: 0, topics: ['偏旁拆解', '笔画拆解', '结构拆解'] },
        { name: '会意', count: 0, topics: ['字形会意', '字义会意', '形义结合'] },
        { name: '谐音', count: 0, topics: ['同音推断', '方言运用'] },
        { name: '五行', count: 0, topics: ['字属五行', '五行生克'] }
      ]
    },
    {
      field: '择日选时', id: 'zeri', icon: '📅',
      description: '依据黄道黑道、二十八宿等选择吉日良辰行事。（数据待补充）',
      subcategories: [
        { name: '黄道', count: 0, topics: ['青龙', '明堂', '金匮', '天德', '玉堂', '司命'] },
        { name: '黑道', count: 0, topics: ['天刑', '朱雀', '白虎', '天牢', '玄武', '勾陈'] },
        { name: '二十八宿', count: 0, topics: ['东方七宿', '南方七宿', '西方七宿', '北方七宿'] },
        { name: '建除', count: 0, topics: ['建除满平', '定执破危', '成收开闭'] }
      ]
    },
    {
      field: '佛道修炼', id: 'fodao', icon: '🕉️',
      description: '涵盖佛教咒语真言与道教符箓心法的修行口诀。（数据待补充）',
      subcategories: [
        { name: '佛咒', count: 0, topics: ['六字大明咒', '大悲咒', '心经', '楞严咒'] },
        { name: '道诀', count: 0, topics: ['道德经', '清静经', '北斗经', '黄庭经'] },
        { name: '禅修', count: 0, topics: ['数息观', '不净观', '慈悲观', '因缘观'] },
        { name: '密法', count: 0, topics: ['本尊法', '气脉明点', '大手印'] },
        { name: '符箓', count: 0, topics: ['五雷符', '护身符', '招财符'] },
        { name: '丹道', count: 0, topics: ['筑基', '炼精化气', '炼气化神', '炼神还虚'] }
      ]
    }
  ]
};

// ============================================================
// 口诀难度详细说明
// ============================================================
const KOUJUE_DIFFICULTY_GUIDE = {
  title: '口诀难度等级详解',
  intro: '三级口诀难度（入门/进阶/精通）的判断标准和学习建议。',
  levels: [
    {
      level: '入门', color: '#27ae60', icon: '🌱',
      who: '完全零基础，从未接触过命理/易学/玄学知识。',
      prerequisites: '无前置知识要求。',
      judgment: '判断标准：口诀为单一概念解释、基础定义或歌诀背诵。不涉及组合推理和格局判断。以「是什么」「叫什么」为主。',
      contentFeatures: ['单个概念的定义和解释', '基础口诀和歌诀背诵', '简单的分类知识（五行归类、方位对应）', '纯知识性内容'],
      studyMethod: ['每日1-2条，反复诵读背诵', '制作卡片/思维导图', '先记忆后理解', '与日常生活结合记忆'],
      estimatedTime: '10天',
      testCriterion: '能说出十天干十二地支的名称和五行属性，理解五行生克，会推算十神。'
    },
    {
      level: '进阶', color: '#f39c12', icon: '🌿',
      who: '已完成入门，掌握基本概念，能进行简单干支分析。',
      prerequisites: '完全掌握入门的全部内容。',
      judgment: '判断标准：涉及多概念综合应用、格局判断、用神取法。需将基础知识组合推理。以「怎么判断」「如何应用」为主。',
      contentFeatures: ['格局的判断方法', '用神的取法', '多概念综合运用', '经典原典解读'],
      studyMethod: ['每日1-2条后实战验证', '多找八字案例练习', '建立知识网络', '自我测试检验'],
      estimatedTime: '20天',
      testCriterion: '能独立判断基本格局，能初步判断用神取法，理解大运排法和流年判断。'
    },
    {
      level: '精通', color: '#e74c3c', icon: '🌳',
      who: '已完成进阶，能独立分析八字，有较深理解（至少分析过50个八字）。',
      prerequisites: '完全掌握入门和进阶内容，有实战经验。',
      judgment: '判断标准：涉及深层原理、特殊格局、驳杂辨别、精确应期。需融会贯通。以「为什么」「深层原理」为主。',
      contentFeatures: ['从格化格判断', '特殊格局深层原理', '岁运应期精确判断', '驳杂辨别', '命理哲学深度思考'],
      studyMethod: ['每日1条深度研读', '大量实战验证', '反向学习', '教授他人以加深理解'],
      estimatedTime: '20天',
      testCriterion: '能独立完成完整八字分析，能处理从格化格，判断准确率80%以上。'
    }
  ]
};

// ============================================================
// 核心选择器函数
// ============================================================

/**
 * 按多条件组合筛选口诀
 *
 * 支持的条件包括：
 *   - field：按玄学领域筛选（bazi/ziwei/fengshui/liuyao/qimen/meihua/cezi/zeri/fodao）
 *   - category：按子分类筛选（天干地支/十神/格局/用神/大运流年/神煞/纳音/刑冲合害）
 *   - difficulty：按难度筛选（入门/进阶/精通）
 *   - source：按经典来源筛选（滴天髓/穷通宝鉴/三命通会等）
 *   - keyword：按关键词搜索（在原文、释义、出处中匹配）
 *   - month：按月份筛选（1-12）
 *   - limit：限制返回条数
 *
 * @param {object} filters - 筛选条件对象
 * @returns {array} 匹配的口诀条目数组，附带的元数据在 _meta 字段中
 */
function selectKoujueByFilter(filters = {}) {
  if (typeof KOUJUE_DAILY_DATABASE === 'undefined') {
    console.error('[SelectKoujue] KOUJUE_DAILY_DATABASE 未加载！');
    return [];
  }

  let result = [...KOUJUE_DAILY_DATABASE];

  // 按领域筛选：目前只有八字领域有完整数据
  if (filters.field && filters.field !== 'bazi') {
    const fieldDef = FIELD_DEFINITIONS[filters.field];
    if (fieldDef && fieldDef.totalCount === 0) {
      // 该领域暂无数据，返回空数组并附元数据说明
      result.length = 0;
      result._meta = {
        field: filters.field,
        fieldName: fieldDef.name,
        message: `「${fieldDef.name}」领域口诀数据尚未录入，敬请期待更新。`,
        availableFields: Object.keys(FIELD_DEFINITIONS).filter(k => FIELD_DEFINITIONS[k].totalCount > 0),
      };
      return result;
    }
  }

  // 按子分类筛选：在八字数据的 category 字段中精确匹配
  if (filters.category) {
    result = result.filter(e => e.category === filters.category);
  }

  // 按难度筛选：在 difficulty 字段中匹配
  if (filters.difficulty) {
    result = result.filter(e => e.difficulty === filters.difficulty);
  }

  // 按来源筛选：在 source 字段中包含指定关键词即可
  if (filters.source) {
    result = result.filter(e => e.source.includes(filters.source));
  }

  // 按关键词搜索：在口诀原文、释义、出处的任意位置匹配
  if (filters.keyword) {
    const kw = filters.keyword;
    result = result.filter(e =>
      e.text.includes(kw) ||
      e.explain.includes(kw) ||
      e.source.includes(kw) ||
      e.category.includes(kw)
    );
  }

  // 按月份筛选：以 date 字段中的月份前缀匹配
  if (filters.month && filters.month >= 1 && filters.month <= 12) {
    result = result.filter(e => e.date.startsWith(filters.month + '-'));
  }

  // 限制返回条数
  if (filters.limit && filters.limit > 0) {
    result = result.slice(0, filters.limit);
  }

  // 附筛选元数据
  result._meta = {
    filterApplied: filters,
    totalMatched: result.length,
    totalInDatabase: KOUJUE_DAILY_DATABASE.length,
    matchRate: KOUJUE_DAILY_DATABASE.length > 0
      ? (result.length / KOUJUE_DAILY_DATABASE.length * 100).toFixed(1) + '%'
      : '0%',
  };

  return result;
}

/**
 * 获取随机口诀
 *
 * 支持三种随机模式：
 *   1. 完全随机：从全部口诀中随机抽取一条
 *   2. 按难度加权随机：优先抽取指定难度的口诀
 *   3. 按分类加权随机：优先抽取指定分类的口诀
 *
 * @param {object} options - 可选参数
 *   - difficulty：限定难度范围
 *   - category：限定分类范围
 *   - count：返回条数（默认1条）
 *   - unique：是否去重（默认true）
 * @returns {object|array} 单条口诀对象或多条口诀数组
 */
function getRandomKoujue(options = {}) {
  if (typeof KOUJUE_DAILY_DATABASE === 'undefined') {
    console.error('[SelectKoujue] KOUJUE_DAILY_DATABASE 未加载！');
    return null;
  }

  let pool = [...KOUJUE_DAILY_DATABASE];
  const count = options.count || 1;

  // 按难度限制候选池
  if (options.difficulty) {
    pool = pool.filter(e => e.difficulty === options.difficulty);
    if (pool.length === 0) {
      console.warn(`[SelectKoujue] 没有找到难度为「${options.difficulty}」的口诀，回退到全部数据。`);
      pool = [...KOUJUE_DAILY_DATABASE];
    }
  }

  // 按分类限制候选池
  if (options.category) {
    const categoryPool = pool.filter(e => e.category === options.category);
    if (categoryPool.length > 0) {
      pool = categoryPool;
    } else {
      console.warn(`[SelectKoujue] 没有找到分类为「${options.category}」的口诀。`);
    }
  }

  // 随机抽取指定条数
  if (count === 1) {
    const idx = Math.floor(Math.random() * pool.length);
    return { ...pool[idx], _randomIndex: idx, _poolSize: pool.length };
  }

  // 多条随机（去重）
  const result = [];
  const usedIndices = new Set();
  const maxCount = Math.min(count, pool.length);

  while (result.length < maxCount) {
    const idx = Math.floor(Math.random() * pool.length);
    if (options.unique !== false && usedIndices.has(idx)) continue;
    usedIndices.add(idx);
    result.push({ ...pool[idx], _randomIndex: idx });
  }

  return result;
}

/**
 * 获取学习路径
 *
 * 返回60天系统学习计划，包含四个阶段的详细配置。
 * 每天推荐一条对应难度的口诀，按顺序循序渐进。
 *
 * @param {object} options - 可选参数
 *   - stage：指定阶段（1-4），默认返回全部
 *   - includeEntries：是否包含具体口诀条目（默认true，设为false仅返回结构）
 * @returns {object} 学习路径对象，含阶段、口诀、统计信息
 */
function getKoujueLearningPath(options = {}) {
  if (typeof KOUJUE_DAILY_DATABASE === 'undefined') {
    console.error('[SelectKoujue] KOUJUE_DAILY_DATABASE 未加载！');
    return null;
  }

  const result = {
    title: LEARNING_PATH.title,
    description: LEARNING_PATH.description,
    totalDays: LEARNING_PATH.totalDays,
    stages: [],
    statistics: {
      totalEntries: 0,
      byDifficulty: { '入门': 0, '进阶': 0, '精通': 0 },
    },
  };

  LEARNING_PATH.stages.forEach((stageDef, index) => {
    // 如果指定了阶段就只返回对应阶段
    if (options.stage && (index + 1) !== options.stage) return;

    const stage = {
      id: stageDef.id,
      name: stageDef.name,
      dayRange: stageDef.dayRange,
      description: stageDef.description,
      keyTopics: stageDef.keyTopics,
      entries: [],
      progress: {
        recommended: stageDef.recommendedEntries,
        available: 0,
      },
    };

    // 从数据库中按难度筛选对应的口诀条目
    if (options.includeEntries !== false) {
      const matchingEntries = KOUJUE_DAILY_DATABASE
        .filter(e => e.difficulty === stageDef.difficulty);

      // 按难度内部再按来源和分类混合排列，保证学习多样性
      const sorted = matchingEntries.sort((a, b) => {
        const catOrder = ['天干地支', '十神', '格局', '用神', '大运流年', '神煞', '纳音', '刑冲合害'];
        return catOrder.indexOf(a.category) - catOrder.indexOf(b.category);
      });

      stage.entries = sorted.slice(0, stageDef.recommendedEntries);
      stage.progress.available = stage.entries.length;
    }

    result.stages.push(stage);
    result.statistics.totalEntries += stage.progress.available;
    result.statistics.byDifficulty[stageDef.difficulty] =
      (result.statistics.byDifficulty[stageDef.difficulty] || 0) + stage.progress.available;
  });

  // 计算总体完成率（假设全部未完成时为0%）
  result.statistics.maxEntries = LEARNING_PATH.stages.reduce((s, st) => s + st.recommendedEntries, 0);

  return result;
}

/**
 * 生成自测题目
 *
 * 从题库中随机抽取指定数量的选择题，支持按难度和分类筛选。
 * 返回的题目随机排列选项顺序，避免死记硬背答案位置。
 *
 * @param {number} count - 题目数量（默认10题）
 * @param {object} options - 可选参数
 *   - difficulty：按难度筛选题目
 *   - category：按分类筛选题目
 *   - shuffleOptions：是否打乱选项顺序（默认true）
 * @returns {object} 测验对象，含题目列表、正确答案索引映射、评分标准
 */
function generateQuiz(count = 10, options = {}) {
  let pool = [...QUIZ_BANK];

  // 按难度筛选
  if (options.difficulty) {
    pool = pool.filter(q => q.difficulty === options.difficulty);
  }

  // 按分类筛选
  if (options.category) {
    pool = pool.filter(q => q.category === options.category);
  }

  // 随机抽取
  const shuffled = pool.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, pool.length));

  // 打乱每题的选项顺序，同时记录正确答案的新位置
  const quizQuestions = selected.map(q => {
    const originalOptions = [...q.options];
    const originalAnswer = q.answer;

    if (options.shuffleOptions !== false) {
      // 创建带索引的选项数组
      const indexedOptions = originalOptions.map((opt, idx) => ({ text: opt, originalIndex: idx }));
      // 随机打乱
      const shuffled = indexedOptions.sort(() => Math.random() - 0.5);
      const newOptions = shuffled.map(o => o.text);
      const newAnswer = shuffled.findIndex(o => o.originalIndex === originalAnswer);

      return {
        id: q.id,
        question: q.question,
        options: newOptions,
        answer: newAnswer,
        explain: q.explain,
        category: q.category,
        difficulty: q.difficulty,
      };
    }

    return {
      id: q.id,
      question: q.question,
      options: originalOptions,
      answer: originalAnswer,
      explain: q.explain,
      category: q.category,
      difficulty: q.difficulty,
    };
  });

  return {
    title: `易道智鉴 · 命理口诀自测`,
    totalQuestions: quizQuestions.length,
    questions: quizQuestions,
    scoring: {
      passingScore: Math.ceil(quizQuestions.length * 0.6),
      maxScore: quizQuestions.length,
      gradeLevels: [
        { min: 0, max: 0.59, grade: '需加强学习', comment: '建议回到入门阶段重新学习基础知识。' },
        { min: 0.6, max: 0.79, grade: '基础扎实', comment: '已经掌握了命理口诀的基本内容，继续加油！' },
        { min: 0.8, max: 0.94, grade: '熟练掌握', comment: '对口诀体系有较为全面的理解和把握。' },
        { min: 0.95, max: 1.0, grade: '精通大师', comment: '命理口诀烂熟于心，可为他人讲解传授。' },
      ],
    },
    evaluate: function(answers) {
      let correct = 0;
      const details = [];
      quizQuestions.forEach((q, idx) => {
        const userAnswer = answers[idx];
        const isCorrect = userAnswer === q.answer;
        if (isCorrect) correct++;
        details.push({
          questionIndex: idx,
          question: q.question,
          userAnswer: userAnswer,
          correctAnswer: q.answer,
          isCorrect,
          explain: q.explain,
        });
      });
      const rate = correct / quizQuestions.length;
      const grade = this.scoring.gradeLevels.find(g => rate >= g.min && rate <= g.max);
      return {
        correct,
        total: quizQuestions.length,
        rate: (rate * 100).toFixed(0) + '%',
        grade: grade ? grade.grade : '未评级',
        comment: grade ? grade.comment : '',
        details,
      };
    },
  };
}

/**
 * 按玄学领域获取分类列表
 * @param {string} fieldId - 领域ID，不传则返回所有领域
 * @returns {object} 领域配置对象或全部领域配置
 */
function getFieldCategories(fieldId) {
  if (fieldId) {
    return FIELD_DEFINITIONS[fieldId] || null;
  }
  return FIELD_DEFINITIONS;
}

/**
 * 获取来源经典信息
 * @param {string} sourceName - 来源名称关键词
 * @returns {object} 来源配置对象或全部来源配置
 */
function getSourceInfo(sourceName) {
  if (sourceName) {
    // 模糊匹配
    for (const [key, val] of Object.entries(SOURCE_DEFINITIONS)) {
      if (key.includes(sourceName) || sourceName.includes(key)) {
        return val;
      }
    }
    return null;
  }
  return SOURCE_DEFINITIONS;
}

/**
 * 获取数据库统计摘要
 * 按分类、难度、来源、月份等维度统计口诀数量
 * @returns {object} 全面统计摘要
 */
function getDatabaseSummary() {
  if (typeof KOUJUE_DAILY_DATABASE === 'undefined') return null;

  const byCategory = {};
  const byDifficulty = {};
  const bySource = {};
  const byMonth = {};

  KOUJUE_DAILY_DATABASE.forEach(e => {
    byCategory[e.category] = (byCategory[e.category] || 0) + 1;
    byDifficulty[e.difficulty] = (byDifficulty[e.difficulty] || 0) + 1;
    const src = e.source.replace(/[《》]/g, '');
    bySource[src] = (bySource[src] || 0) + 1;
    const month = e.date.split('-')[0];
    byMonth[month] = (byMonth[month] || 0) + 1;
  });

  return {
    total: KOUJUE_DAILY_DATABASE.length,
    byCategory,
    byDifficulty,
    bySource,
    byMonth,
    fieldCoverage: {
      bazi: KOUJUE_DAILY_DATABASE.length,
      others: '待补充',
    },
  };
}

/**
 * 获取推荐学习顺序（按从易到难排列的口诀列表）
 * 适合初学者按顺序学习
 * @param {number} limit - 返回条数
 * @returns {array} 按难度和分类排序的口诀数组
 */
function getRecommendedOrder(limit = 60) {
  if (typeof KOUJUE_DAILY_DATABASE === 'undefined') return [];

  const difficultyOrder = { '入门': 0, '进阶': 1, '精通': 2 };
  const categoryOrder = ['天干地支', '十神', '神煞', '纳音', '刑冲合害', '格局', '用神', '大运流年'];

  const sorted = [...KOUJUE_DAILY_DATABASE].sort((a, b) => {
    const diffDiff = (difficultyOrder[a.difficulty] || 0) - (difficultyOrder[b.difficulty] || 0);
    if (diffDiff !== 0) return diffDiff;
    const catDiff = categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
    if (catDiff !== 0) return catDiff;
    return a.date.localeCompare(b.date);
  });

  return sorted.slice(0, limit);
}

// ============================================================
// 导出
// ============================================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FIELD_DEFINITIONS,
    DIFFICULTY_LEVELS,
    SOURCE_DEFINITIONS,
    LEARNING_PATH,
    QUIZ_BANK,
    KOUJUE_LEARNING_PATH,
    KOUJUE_CATEGORY_INDEX,
    KOUJUE_DIFFICULTY_GUIDE,
    selectKoujueByFilter,
    getRandomKoujue,
    getKoujueLearningPath,
    generateQuiz,
    getFieldCategories,
    getSourceInfo,
    getDatabaseSummary,
    getRecommendedOrder,
  };
}

// 如果直接运行脚本，输出使用说明
if (require.main === module) {
  console.log('═══ 易道智鉴 · 口诀选择器 ═══');
  console.log('用法示例：');
  console.log('');
  console.log('// 按分类和难度筛选');
  console.log('const results = selectKoujueByFilter({ category: "用神", difficulty: "进阶" });');
  console.log('');
  console.log('// 获取随机口诀');
  console.log('const random = getRandomKoujue({ difficulty: "进阶" });');
  console.log('');
  console.log('// 获取学习路径');
  console.log('const path = getKoujueLearningPath();');
  console.log('');
  console.log('// 生成自测题');
  console.log('const quiz = generateQuiz(10);');
  console.log('');

  const summary = getDatabaseSummary();
  if (summary) {
    console.log('数据库统计：');
    console.log(`  总数：${summary.total} 条`);
    console.log('  按难度：', summary.byDifficulty);
    console.log('  按分类：', summary.byCategory);
    console.log('  按来源：', summary.bySource);
  }
}

console.log('[SelectKoujue] 口诀选择器加载完成 | 支持9大领域 | 15道自测题 | 60天学习路径');
