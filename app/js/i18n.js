/**
 * i18n.js — R698 国际化基础设施
 * 用法：
 *   <script src="js/i18n.js" defer></script>
 *   <span data-i18n="nav.bazi">八字</span>  ← 自动翻译
 *   i18n.setLang('en')                      ← 切换语言
 *   i18n.t('nav.bazi')                      ← 程序式调用
 */
(function (global) {
  'use strict';

  var _lang = 'zh'; // 默认中文
  var _packs = {};  // 语言包缓存
  var _observer = null;

  // 核心术数术语映射表（中→英）
  var CORE_TERMS = {
    // 导航
    '八字': 'BaZi', '紫微斗数': 'ZiWei', '奇门遁甲': 'QiMen',
    '六爻': 'LiuYao', '六壬': 'LiuRen', '梅花易数': 'MeiHua',
    '风水': 'Feng Shui', '合婚': 'Compatibility', '起名': 'Naming',
    '化解': 'Remedies', '择日': 'Date Selection', '黄历': 'Almanac',
    // 排盘
    '排盘': 'Chart Casting', '日主': 'Day Master', '旺衰': 'Strength',
    '五行': 'Five Elements', '十神': 'Ten Gods', '大运': 'Major Luck',
    '流年': 'Annual Luck', '纳音': 'Na Yin', '神煞': 'Symbolic Stars',
    '用神': 'Useful God', '格局': 'Pattern',
    // 中医
    '体质': 'Constitution', '辨证': 'Pattern Differentiation',
    '方剂': 'Herbal Formula', '经络': 'Meridians', '脏腑': 'Organs',
    '气血': 'Qi & Blood', '阴阳': 'Yin & Yang',
    '面诊': 'Face Diagnosis', '舌诊': 'Tongue Diagnosis',
    '眼诊': 'Eye Diagnosis', '手诊': 'Hand Diagnosis',
    // 操作
    '排盘演命': 'Cast Chart', '开始录音': 'Start Recording',
    '正在录音': 'Recording', '实时模式': 'Live Mode',
    '知识库': 'Knowledge Base', '诊断': 'Analysis',
    '黄历': 'Almanac', '推演': 'Prediction', '知识库': 'Knowledge Base',
    '口诀': 'Formulas', '起名': 'Naming', '改名': 'Renaming',
    '体质': 'Constitution', '辨识': 'Identification', '中医养生': 'TCM Wellness',
    '望诊': 'Visual Diagnosis', '望诊中心': 'Visual Diagnosis Center',
    '临床': 'Clinical', '工作台': 'Workstation', '问卦': 'Divination',
    '占卜': 'Divination', '命格': 'Life Pattern',
    '易经': 'I Ching', '六爻': 'Six Lines', '奇门遁甲': 'QiMen',
    '梅花易数': 'MeiHua', '大六壬': 'LiuRen', '紫微斗数': 'ZiWei',
    '卦': 'Chart', '工具集': 'Toolkit',
  };

  // 英文语言包（可扩展）
  _packs.en = {
    _meta: { name: 'English', rtl: false },
    nav: {
      bazi: 'BaZi', ziwei: 'ZiWei', qimen: 'QiMen', liuyao: 'LiuYao',
      liuren: 'LiuRen', meihua: 'MeiHua', fengshui: 'Feng Shui',
      hehun: 'Compatibility', naming: 'Naming', huajie: 'Remedies',
      zeri: 'Date Selection', almanac: 'Almanac', tcm: 'TCM',
    },
    action: {
      cast: 'Cast Chart', analyze: 'Analyze', submit: 'Submit',
      startRec: 'Start Recording', stopRec: 'Stop', liveMode: 'Live Mode',
      reset: 'Reset', export: 'Export', share: 'Share',
    },
    label: {
      dayMaster: 'Day Master', strength: 'Strength', fiveElements: 'Five Elements',
      tenGods: 'Ten Gods', majorLuck: 'Major Luck', annualLuck: 'Annual Luck',
      usefulGod: 'Useful God', pattern: 'Pattern', naYin: 'Na Yin',
      symbolicStars: 'Symbolic Stars', constitution: 'Constitution',
      diagnosis: 'Analysis', formula: 'Herbal Formula',
      knowledgeBase: 'Knowledge Base', references: 'References',
    },
    msg: {
      enterBirth: 'Please enter your birth date and time',
      recording: 'Recording...', transcribing: 'Transcribing...',
      analyzing: 'Analyzing...', noResults: 'No results found',
      loading: 'Loading...', error: 'Something went wrong',
      disclaimer: 'For cultural and entertainment reference only',
      almanacTitle: 'Almanac: Three Perspectives', knowledgeTitle: 'I Ching Knowledge Base',
      toolsTitle: 'Divination Toolkit', folkloreTitle: 'Folklore · Almanac · Life',
      koujueTitle: 'Formula Gallery', renameTitle: 'Naming & Renaming',
      tizhiTitle: 'Constitution Identification · TCM Wellness',
      wangzhenTitle: 'Visual Diagnosis Center', clinicalTitle: 'Visual Diagnosis Workstation',
      yijingTitle: 'I Ching', qimenTitle: 'I Ching · QiMen', zhanbuTitle: 'Divination & Inquiry',
    },
    page: {
      almanac: 'Almanac Three Perspectives', knowledge: 'I Ching Knowledge Base',
      tools: 'Divination Tools', folklore: 'Folklore · Almanac · Life',
      koujue: 'Formula Gallery', rename: 'Naming & Renaming',
      tizhi: 'Constitution Identification', wangzhen: 'Visual Diagnosis Center',
      clinical: 'Visual Diagnosis Workstation', yijing: 'I Ching Oracle',
      qimen: 'I Ching · QiMen', zhanbu: 'Divination & Inquiry',
      lucky: 'Lucky Goods', wellness: 'TCM Wellness Wisdom',
      precise: 'Precision Recommendations', shop: 'Lucky Shop',
      integrated: 'YiDao · Advanced Oracle',
      hubTitle: 'Divination Hub',
      hubHeroBadge: 'I Ching · TCM · Knowledge · AI',
    },
  };

  _packs.zh = {
    _meta: { name: '中文', rtl: false },
    nav: {
      bazi: '八字', ziwei: '紫微斗数', qimen: '奇门遁甲', liuyao: '六爻',
      liuren: '六壬', meihua: '梅花易数', fengshui: '风水',
      hehun: '合婚', naming: '起名', huajie: '化解',
      zeri: '择日', almanac: '黄历', tcm: '中医',
    },
    action: {
      cast: '排盘演命', analyze: '分析', submit: '提交',
      startRec: '开始录音', stopRec: '停止', liveMode: '实时模式',
      reset: '重置', export: '导出', share: '分享',
    },
    label: {
      dayMaster: '日主', strength: '旺衰', fiveElements: '五行',
      tenGods: '十神', majorLuck: '大运', annualLuck: '流年',
      usefulGod: '用神', pattern: '格局', naYin: '纳音',
      symbolicStars: '神煞', constitution: '体质',
      diagnosis: '诊断', formula: '方剂',
      knowledgeBase: '知识库', references: '参考文献',
    },
    msg: {
      enterBirth: '请输入出生年月日时',
      recording: '正在录音...', transcribing: '正在转写...',
      analyzing: '正在分析...', noResults: '暂无结果',
      loading: '加载中...', error: '出错了',
      disclaimer: '仅供传统文化研究参考',
      almanacTitle: '黄历三视角', knowledgeTitle: '易学知识库',
      toolsTitle: '推演工具集', folkloreTitle: '民俗·黄历·生活',
      koujueTitle: '口诀库', renameTitle: '起名/改名',
      tizhiTitle: '体质辨识·中医养生',
      wangzhenTitle: '望诊中心', clinicalTitle: '望诊临床工作台',
      yijingTitle: '易经', qimenTitle: '易经·奇门遁甲', zhanbuTitle: '占卜问卦',
    },
    page: {
      almanac: '黄历三视角', knowledge: '易学知识库',
      tools: '推演工具集', folklore: '民俗·黄历·生活',
      koujue: '口诀库', rename: '起名/改名',
      tizhi: '体质辨识', wangzhen: '望诊中心',
      clinical: '望诊临床工作台', yijing: '易经占卜',
      qimen: '易经·奇门遁甲', zhanbu: '占卜问卦',
      lucky: '开运好物', wellness: '中医养生智慧',
      shop: '限时特惠', hubTitle: '占卜中枢',
      hubHeroBadge: '周易 · 中医 · 知识 · AI',
    },
  };

  function t(key) {
    var parts = key.split('.');
    var val = _packs[_lang];
    for (var i = 0; i < parts.length; i++) {
      if (val && typeof val === 'object') val = val[parts[i]];
      else return key;
    }
    return (typeof val === 'string') ? val : key;
  }

  function setLang(lang) {
    if (!_packs[lang]) return;
    _lang = lang;
    try { localStorage.setItem('mbj_locale', lang === 'en' ? 'en-SG' : (lang === 'zh' ? 'zh-CN' : lang)); } catch (_) {}
    applyTranslations();
    document.documentElement.lang = lang;
    // 通知其他组件
    document.dispatchEvent(new CustomEvent('i18n:langChanged', { detail: { lang: lang } }));
  }

  function getLang() { return _lang; }

  function applyTranslations() {
    var nodes = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      var key = nodes[i].getAttribute('data-i18n');
      var text = t(key);
      if (text !== key) nodes[i].textContent = text;
    }
    // data-i18n-placeholder
    var phNodes = document.querySelectorAll('[data-i18n-placeholder]');
    for (var j = 0; j < phNodes.length; j++) {
      var phKey = phNodes[j].getAttribute('data-i18n-placeholder');
      var phText = t(phKey);
      if (phText !== phKey) phNodes[j].placeholder = phText;
    }
  }

  // 自动翻译中文术语（在无 data-i18n 属性的元素上）
  function autoTranslate() {
    if (_lang === 'zh') return; // 中文模式不翻译
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, null);
    var node;
    while ((node = walker.nextNode())) {
      var text = node.textContent;
      var changed = false;
      for (var zh in CORE_TERMS) {
        if (text.indexOf(zh) >= 0) {
          text = text.split(zh).join(CORE_TERMS[zh]);
          changed = true;
        }
      }
      if (changed) node.textContent = text;
    }
  }

  function init() {
    var saved = null;
    try { saved = localStorage.getItem('mbj_locale') || localStorage.getItem('_i18n_lang'); } catch (_) {}
    if (saved && _packs[saved]) _lang = saved;
    // 浏览器语言探测
    if (!saved) {
      var browserLang = (navigator.language || navigator.userLanguage || 'zh').toLowerCase();
      if (browserLang.indexOf('en') === 0) _lang = 'en';
    }
    document.documentElement.lang = _lang;
    if (_lang !== 'zh') {
      // DOMContentLoaded 后自动翻译
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { applyTranslations(); autoTranslate(); });
      } else {
        applyTranslations(); autoTranslate();
      }
    }
  }

  global.i18n = { t: function(key){return t(key);}, setLang: setLang, getLang: getLang, applyTranslations: applyTranslations, autoTranslate: autoTranslate, CORE_TERMS: CORE_TERMS };
  init();
})(typeof window !== 'undefined' ? window : globalThis);

(function (global) {
  'use strict';
  // === 报告正文术语（用于替换 segments content 硬编码中文）===
  if (typeof REPORT_CONTENT_TERMS === 'undefined') {
    var REPORT_CONTENT_TERMS = {
      '基础格局解读': 'Basic Chart Analysis',
      '知识依据': 'Knowledge Basis',
      '动态时效分析': 'Dynamic Timing Analysis',
      '时效分析知识参考': 'Timing Knowledge Reference',
      '具象落地场景': 'Practical Scenarios',
      '优化建议': 'Optimization Advice',
      '免责声明': 'Disclaimer',
      '缘主核心关切': 'Core Concerns',
      '当前大运': 'Current Major Luck Period',
      '当前流年': 'Current Annual Luck',
      '当前年龄': 'Current Age',
      '日主': 'Day Master',
      '日干支': 'Day Stem-Branch',
      '时干支': 'Hour Stem-Branch',
      '大运': 'Major Luck',
      '流年': 'Annual Luck',
      '五行': 'Five Elements',
      '命局': 'Chart Pattern',
      '命盘': 'Birth Chart',
      '格局': 'Chart Pattern',
      '运程': 'Life Path',
      '运势': 'Fortune',
      '吉': 'Auspicious',
      '凶': 'Inauspicious',
      '化禄': 'Hua Lu',
      '化权': 'Hua Quan',
      '化科': 'Hua Ke',
      '化忌': 'Hua Ji',
      '命宫': 'Life Palace',
      '财帛宫': 'Wealth Palace',
      '官禄宫': 'Career Palace',
      '夫妻宫': 'Spouse Palace',
      '疾厄宫': 'Health Palace',
      '交友宫': 'Friends Palace',
      '田宅宫': 'Property Palace',
      '迁移宫': 'Travel Palace',
      '福德宫': 'Fortune Palace',
      '身宫': 'Body Palace',
      '大限': 'Major Decade',
      '小限': 'Minor Year',
      '流月': 'Monthly Flow',
      '流日': 'Daily Flow',
      '流时': 'Hourly Flow',
      '应期': 'Timing Window',
      '用神': 'Useful God',
      '原神': 'Source God',
      '忌神': 'Avoid God',
      '喜神': 'Auspicious God',
      '仇神': 'Opposing God',
      '食神': 'Eating God',
      '伤官': 'Hurting Officer',
      '正财': 'Direct Wealth',
      '偏财': 'Indirect Wealth',
      '正官': 'Direct Officer',
      '七杀': 'Seven Killings',
      '正印': 'Direct Seal',
      '偏印': 'Indirect Seal',
      '比肩': 'Friend',
      '劫财': 'Rob Wealth',
      '劫杀': 'Rob Kill',
      '阳刃': 'Yang Blade',
      '天乙贵人': 'Noble Star',
      '文昌贵人': 'Wenchang',
      '天德贵人': 'Tiande',
      '月德贵人': 'Yuede',
      '桃花': 'Peach Blossom',
      '天喜': 'Heavenly Joy',
      '红鸾': 'Red Phoenix',
      '孤辰': 'Loneliness',
      '寡宿': 'Widow Star',
      '空亡': 'Emptiness',
      '三刑': 'Three Punishments',
      '六害': 'Six Harms',
      '冲': 'Clash',
      '合': 'Combine',
      '刑': 'Punishment',
      '害': 'Harm',
      '破': 'Break',
      '墓': 'Tomb',
      '绝': 'Extinction',
      '胎': 'Embryo',
      '养': 'Nourish',
      '长生': 'Growth',
      '沐浴': 'Bath',
      '冠带': 'Crown',
      '临官': 'Official',
      '帝旺': 'Emperor',
      '衰': 'Decline',
      '病': 'Sickness',
      '死': 'Death',
      '墓库': 'Tomb Store',
      '进财': 'Wealth Gain',
      '机缘': 'Opportunity',
      '权势': 'Authority',
      '晋升': 'Promotion',
      '名声': 'Reputation',
      '贵人': 'Noble',
      '障碍': 'Obstacle',
      '波折': 'Setbacks',
      '管理': 'Management',
      '金融': 'Finance',
      '行政': 'Administration',
      '创业': 'Entrepreneurship',
      '销售': 'Sales',
      '技术': 'Technology',
      '咨询': 'Consulting',
      '研发': 'R&D',
      '教育': 'Education',
      '公关': 'PR',
      '外交': 'Diplomacy',
      '感情': 'Relationships',
      '沟通': 'Communication',
      '包容': 'Understanding',
      '健康': 'Health',
      '脾胃': 'Spleen & Stomach',
      '心肺': 'Heart & Lungs',
      '肝胆': 'Liver & Gallbladder',
      '肾脏': 'Kidneys',
      '免疫': 'Immunity',
      '睡眠': 'Sleep',
      '饮食': 'Diet',
      '运动': 'Exercise',
      '注意': 'Note',
      '建议': 'Advice',
      '方位': 'Direction',
      '行业': 'Industry',
      '颜色': 'Color',
      '数字': 'Number',
      '贵人方位': 'Noble Direction',
      '有利方位': 'Auspicious Direction',
      '不利方位': 'Inauspicious Direction',
      '利方位': 'Favorable Direction',
      '忌方位': 'Avoid Direction',
      '大运天干': 'Decade Stem',
      '大运地支': 'Decade Branch',
      '岁运并临': 'Concurrent Luck',
      '天克地冲': 'Clash',
      '天合地合': 'Harmony',
      '暗合': 'Hidden Combine',
      '伏吟': 'Reversal',
      '反吟': 'Counter Reversal',
      '进财时机': 'Wealth Timing',
      '事业机遇': 'Career Opportunity',
      '感情关键期': 'Relationship Milestone',
      '健康预警期': 'Health Alert Period',
      '适合从事': 'Suitable Career',
      '适合方位': 'Favorable Direction',
      '注意事项': 'Precautions',
      '发展趋势': 'Trend',
      '风险提示': 'Risk Alert',
      '开运建议': 'Luck Enhancement',
      '化解建议': 'Remedies',
      '吉日': 'Auspicious Day',
      '吉时': 'Auspicious Time',
      '吉方': 'Auspicious Direction',
      '吉利': 'Auspicious',
      '祥瑞': 'Auspicious',
      '禁忌': 'Taboo',
      '忌讳': 'Avoid',
      '切勿': 'Avoid',
      '不宜': 'Not Recommended',
      '可行': 'Feasible',
      '可行方案': 'Feasible Plan',
      '优先级': 'Priority',
      '紧迫度': 'Urgency',
      '效果预期': 'Expected Effect',
      '持续时间': 'Duration',
      '疗程': 'Treatment Course',
      '副作用': 'Side Effects',
      '注意事项': 'Notes',
      '特别提醒': 'Special Note',
      '温馨提示': 'Warm Reminder',
      '系统提醒': 'System Reminder',
      '当前状态': 'Current Status',
      '下一步': 'Next Step',
      '行动清单': 'Action Checklist',
      '执行须知': 'Execution Notes',
      '礼制': 'Etiquette',
      // === R498 增补：天干地支 / 方位 / 八字关系 / 中医术语 ===
      '天干': 'Heavenly Stems',
      '地支': 'Earthly Branches',
      '十天干': 'Ten Heavenly Stems',
      '十二地支': 'Twelve Earthly Branches',
      '甲': 'Jia', '乙': 'Yi', '丙': 'Bing', '丁': 'Ding', '戊': 'Wu',
      '己': 'Ji', '庚': 'Geng', '辛': 'Xin', '壬': 'Ren', '癸': 'Gui',
      '子': 'Zi', '丑': 'Chou', '寅': 'Yin', '卯': 'Mao', '辰': 'Chen',
      '巳': 'Si', '午': 'Wu', '未': 'Wei', '申': 'Shen', '酉': 'You',
      '戌': 'Xu', '亥': 'Hai',
      '木': 'Wood', '火': 'Fire', '土': 'Earth', '金': 'Metal', '水': 'Water',
      '东': 'East', '南': 'South', '西': 'West', '北': 'North', '中': 'Center',
      '东南': 'Southeast', '东北': 'Northeast', '西南': 'Southwest', '西北': 'Northwest',
      '方位': 'Direction',
      '财运': 'Wealth Luck',
      '事业': 'Career',
      '婚姻': 'Marriage',
      '感情': 'Relationships',
      '健康': 'Health',
      '学业': 'Academics',
      '人脉': 'Social Network',
      '贵人': 'Noble Person',
      '小人': '小人',
      '官运': 'Official Luck',
      '工作': 'Work',
      '求学': 'Study',
      '创业': 'Entrepreneurship',
      '理财': 'Finance',
      '投资': 'Investment',
      '置业': 'Property',
      '搬迁': 'Relocation',
      '桃花': 'Peach Blossom',
      '红鸾': 'Red Phoenix',
      '天喜': 'Heavenly Joy',
      '天乙': 'Heavenly Noble',
      '太极': 'Tai Chi',
      '文昌': 'Wen Chang',
      '驿马': 'Travel Star',
      '华盖': 'Canopy Star',
      '将星': 'General Star',
      '咸池': 'Salt Lake',
      '禄存': 'Lu Cun',
      '天同': 'Tian Tong',
      '天机': 'Tian Ji',
      '太阳': 'Sun',
      '太阴': 'Moon',
      '武曲': 'Wu Qu',
      '天相': 'Tian Xiang',
      '紫微': 'Zi Wei',
      '天府': 'Tian Fu',
      '贪狼': 'Tan Lang',
      '巨门': 'Ju Men',
      '廉贞': 'Lian Zhen',
      '破军': 'Po Jun',
      '七杀': 'Seven Killings',
      '舌': '舌',
      '舌苔': 'Coated Tongue',
      '舌色': 'Tongue Color',
      '舌质': 'Tongue Body',
      '脉': 'Pulse',
      '脉象': 'Pulse Pattern',
      '沉': 'Deep',
      '浮': 'Floating',
      '迟': 'Slow',
      '数': 'Rapid',
      '虚': 'Deficient',
      '实': 'Excess',
      '寒': 'Cold',
      '热': 'Heat',
      '湿': 'Dampness',
      '燥': 'Dryness',
      '脾': 'Spleen',
      '胃': 'Stomach',
      '肝': 'Liver',
      '心': 'Heart',
      '肺': 'Lung',
      '肾': 'Kidney',
      '虚证': 'Deficiency Pattern',
      '实证': 'Excess Pattern',
      '寒证': 'Cold Pattern',
      '热证': 'Heat Pattern',
      '虚寒': 'Deficiency Cold',
      '实热': 'Excess Heat',
      '脾虚': 'Spleen Deficiency',
      '肾虚': 'Kidney Deficiency',
      '肝郁': 'Liver Qi Stagnation',
      '气滞': 'Qi Stagnation',
      '血瘀': 'Blood Stasis',
      '痰湿': 'Phlegm Dampness',
      '阴虚': 'Yin Deficiency',
      '阳虚': 'Yang Deficiency',
      '气血不足': 'Qi-Blood Insufficiency',
      '湿困': 'Dampness Trapped',
      '调和': 'Harmonize',
      '滋补': 'Nourish',
      '清热': 'Clear Heat',
      '温阳': 'Warm Yang',
      '活血': 'Invigorate Blood',
      '化瘀': 'Resolve Stasis',
      '行气': 'Move Qi',
      '补气': 'Tonify Qi',
      '养血': 'Nourish Blood',
      '健脾': 'Strengthen Spleen',
      '疏肝': 'Soothe Liver',
      '为木': 'as Wood', '为火': 'as Fire', '为土': 'as Earth', '为金': 'as Metal', '为水': 'as Water',
      '见化禄': 'sees Hua Lu',
      '走财运': 'walks Wealth Luck',
      '见七杀': 'sees Seven Killings',
      '见': 'sees',
      '走': 'walks',
      '入': 'enters',
      '主事业': 'indicates Career',
      '主婚姻': 'indicates Marriage',
      '主健康': 'indicates Health',
      '主': 'governs',
      // === R718 i18n 报告补充翻译（针对 9 条样例的剩余片段） ===
      '日主为木': 'Day Master is Wood',
      '八字喜用神为火': 'Bazi Favorable Element is Fire',
      '事业突破': 'career breakthrough',
      '当前大运走财运': 'Current Major Luck walks Wealth',
      '2026 流年见化禄入命宫': '2026 Annual sees Hua Lu enters Life Palace',
      '化解方案': 'Remedy Plan',
      '盘面问题溯源于五行失衡': 'Chart issue traces to Five-Element imbalance',
      '调整居住方位朝东': 'Adjust residence facing East',
      '脉象沉细': 'Pulse deep and thin',
      '证属脾虚湿困': 'Pattern Spleen Deficiency with Damp',
      '八字用神为水': 'Bazi Useful God is Water',
      '喜金来生': 'favors Metal to generate',
      '忌土克水': 'avoids Earth restraining Water',
      '平衡图显示': 'Balance Chart shows',
      '火元素，需要补火': 'Fire element, needs Fire supplement',
      '元素，需要补': 'element, needs supplement',
      '需要补火': 'needs Fire supplement',
      '化解建议': 'Remedy Advice',
      '农历七月十五': 'Lunar July 15',
      '吉方南方': 'Auspicious Direction South',
      '五行属水，主智慧，性格内敛': 'Five Elements Water, governs wisdom, introverted',
      '主智慧': 'governs wisdom',
      '性格内敛': 'introverted personality',
      '五行属水': 'Five Elements Water',
      '走财运，主事业': 'walks Wealth, governs Career',
      '见化禄入命宫，主事业突破': 'sees Hua Lu enters Life Palace, career breakthrough',
      '为木，八字喜用神为火': 'is Wood, Bazi Favorable Element is Fire',
      '见七杀星': 'sees Seven Killings',
      '舌苔白腻': 'white greasy coating',
      '属脾虚湿困': 'pattern Spleen Deficiency Damp',
      '属水，主智慧': 'Water, governs wisdom',
      '（农历七月十五）': '(Lunar July 15)',
      '吉日 8月15日': 'Auspicious Day Aug 15',
      '方南方': 'Direction South',
      '时午时': 'Time Wu Hour',
      '方南方': 'Direction South',
      '示 lacking element': 'shows lacking element',
      '示 lacking element Fire': 'shows lacking element Fire',
      'Fire元素': 'Fire element',
      '需要补Fire': 'needs Fire supplement',
      'balance-chart 平衡图显示': 'balance-chart Balance Chart shows',
      '舌诊见': 'Tongue diagnosis shows',
      '配偶宫': 'Spouse Palace',
      '配偶宫见': 'Spouse Palace sees',
      '婚姻感情需注意': 'Marriage relationships need attention to',
      '婚姻感情': 'Marriage relationships',
      '沟通方式': 'communication style',
      '生于': 'born in',
      '日主甲木': 'Day Master Jia Wood',
      '八字身强': 'Bazi body strong',
      '水旺木相': 'Water prosperous Wood mutual',
      '八字用神为水': 'Bazi useful god is Water',
      '大运流年分析': 'Major Luck Annual Luck Analysis',
      '火旺利事业': 'Fire prosperous benefits Career',
      '流年分析': 'Annual Luck Analysis',
      '大运分析': 'Major Luck Analysis',
      '十神': 'Ten Gods',
      '甲乙丙丁戊己庚辛壬癸': 'Jia Yi Bing Ding Wu Ji Geng Xin Ren Gui',
      '子丑寅卯辰巳午未申酉戌亥': 'Zi Chou Yin Mao Chen Si Wei Wu Shen You Xu Hai',
      '天干': 'Heavenly Stems',
      '地支': 'Earthly Branches',
      '格局': 'Pattern',
      '身强': 'Body Strong',
      '身弱': 'Body Weak',
      '喜用神': 'Favorable Element',
      '忌神': 'Unfavorable Element',
      '用神': 'Useful God',
      '调候': 'Climate Adjustment',
      '通关': 'Bridge Element',
      '旺衰': 'Prosperity Decline',
      '五行旺衰': 'Five Element Prosperity',
      '十神格局': 'Ten Gods Pattern',
      '木': 'Wood',
      '火': 'Fire',
      '土': 'Earth',
      '金': 'Metal',
      '水': 'Water',
      '东方': 'East',
      '西方': 'West',
      '南方': 'South',
      '北方': 'North',
      '中央': 'Center',
      '春季': 'Spring',
      '夏季': 'Summer',
      '秋季': 'Autumn',
      '冬季': 'Winter',
      '长夏': 'Late Summer',
      '生克制化': 'Generate Restrain Transform',
      '生扶': 'Generate Support',
      '泄耗': 'Drain Consume',
      '制化': 'Restrain Transform',
      '喜': 'favors',
      '忌': 'avoids',
      '旺': 'prosperous',
      '衰': 'declining',
      '相': 'mutual',
      '休': 'rest',
      '囚': 'imprisoned',
      '死': 'dead',
      '胎': 'fetal',
      '养': 'nurture',
      '长生': 'Long Life',
      '沐浴': 'Bath',
      '冠带': 'Cap Belt',
      '临官': 'Officer',
      '帝旺': 'Emperor',
      '墓': 'Tomb',
      '日主甲': 'Day Master Jia',
      '日主乙': 'Day Master Yi',
      '日主丙': 'Day Master Bing',
      '日主丁': 'Day Master Ding',
      '日主戊': 'Day Master Wu',
      '日主己': 'Day Master Ji',
      '日主庚': 'Day Master Geng',
      '日主辛': 'Day Master Xin',
      '日主壬': 'Day Master Ren',
      '日主癸': 'Day Master Gui',
      '生于亥月': 'born in Hai month',
      '日主甲木生于亥月': 'Day Master Jia Wood born in Hai month',
      '喜用神为火土': 'favorable elements Fire Earth',
      '火旺利': 'Fire prosperous benefits',
      '年乙巳年': 'year Yi Si',
      '年丙午年': 'year Bing Wu',
      '2025年乙巳年': '2025 year Yi Si',
      '2026年丙午年': '2026 year Bing Wu',
      '甲木': 'Jia Wood',
      '乙木': 'Yi Wood',
      '丙火': 'Bing Fire',
      '丁火': 'Ding Fire',
      '戊土': 'Wu Earth',
      '己土': 'Ji Earth',
      '庚金': 'Geng Metal',
      '辛金': 'Xin Metal',
      '壬水': 'Ren Water',
      '癸水': 'Gui Water',
      '亥月': 'Hai month',
      '子月': 'Zi month',
      '丑月': 'Chou month',
      '寅月': 'Yin month',
      '卯月': 'Mao month',
      '辰月': 'Chen month',
      '巳月': 'Si month',
      '午月': 'Wu month',
      '未月': 'Wei month',
      '申月': 'Shen month',
      '酉月': 'You month',
      '戌月': 'Xu month',
      '需注意': 'need attention to',
      '需': 'need',
      '方式': 'method',
      '分析': 'Analysis',
    };

    global.REPORT_CONTENT_TERMS = REPORT_CONTENT_TERMS;
  }

  // 辅助：CJK 字符检测（CJK Unified Ideographs + 扩展 A 区）
  function _isCJK(ch) {
    if (!ch) return false;
    var code = ch.charCodeAt(0);
    return (code >= 0x4E00 && code <= 0x9FFF) ||
           (code >= 0x3400 && code <= 0x4DBF) ||
           (code >= 0x3040 && code <= 0x30FF); // 日文假名（中文报告中也偶有）
  }

  // 辅助：英文字符检测
  function _isAsciiLetter(ch) {
    if (!ch) return false;
    var code = ch.charCodeAt(0);
    return (code >= 0x41 && code <= 0x5A) || (code >= 0x61 && code <= 0x7A);
  }

  // 智能替换：中文键 → 英文值，前后自动补空格（避免 "Day Masteras Wood" 这种粘连）
  function _smartReplace(text, key, val) {
    if (text.indexOf(key) < 0) return text;
    var result = '';
    var idx = 0;
    var pad = String.fromCharCode(32); // 空格
    while (idx < text.length) {
      var pos = text.indexOf(key, idx);
      if (pos < 0) { result += text.substring(idx); break; }
      // 前缀：从 idx 到 pos
      var prevChar = pos > 0 ? text.charAt(pos - 1) : '';
      var nextChar = pos + key.length < text.length ? text.charAt(pos + key.length) : '';
      var prefix = text.substring(idx, pos);
      var needSpaceBefore = false;
      var needSpaceAfter = false;
      // 英文前接中文 → 中文键被英文值替换 → 如果 key 前是 ASCII 字母则需要空格；否则 key 前是 CJK 不需要
      // 英文后接中文 → 同理
      // 空格策略：
      // needSpaceBefore = 上一字符是 ASCII 字母 且 key 首个字符是 CJK（中文 key 前接英文字母 → 需空格隔开）
      // needSpaceAfter  = value 末尾是 ASCII 字母 且 下一字符是 ASCII 字母（避免英文词粘连，如 "governs" + "career"）
      // needSpaceAfter 也 = value 末尾是 ASCII 字母 且 下一字符是 CJK（避免英文后接中文）
      // 例外：上一字符或下一字符已经是空格 → 不重复补
      if (prevChar && _isAsciiLetter(prevChar) && _isCJK(key.charAt(0)) && prevChar !== pad) {
        needSpaceBefore = true;
      }
      if (nextChar && nextChar !== pad && _isAsciiLetter(val.charAt(val.length - 1))) {
        // 英文 value 后接任何非空格字符 → 补空格
        needSpaceAfter = true;
      }
      result += prefix + (needSpaceBefore ? pad : '') + val + (needSpaceAfter ? pad : '');
      idx = pos + key.length;
    }
    return result;
  }

  function translateReportContent(content) {
    var _curLang = (global.i18n && global.i18n.getLang) ? global.i18n.getLang() : 'zh';
    if (_curLang === 'zh' || !content) return content;
    var text = content;
    var zh, en;
    // 按 key 长度倒序（先长后短），避免短串误匹配
    var keys = Object.keys(REPORT_CONTENT_TERMS);
    keys.sort(function (a, b) { return b.length - a.length; });
    for (var i = 0; i < keys.length; i++) {
      zh = keys[i];
      if (!REPORT_CONTENT_TERMS.hasOwnProperty(zh)) continue;
      en = REPORT_CONTENT_TERMS[zh];
      if (text.indexOf(zh) >= 0) {
        text = _smartReplace(text, zh, en);
      }
    }
    return text;
  }

  // 将两个 IIFE 的能力合并到 window.i18n
    // 保护现场，避免覆盖第一个 IIFE 已注册的函数
    if (!global.i18n) global.i18n = {};
    var existing = global.i18n;
    var mergeFields = {
      t: function (key) { return existing.t ? existing.t(key) : key; },
      getLang: existing.getLang || function () { return 'zh'; },
      setLang: existing.setLang || function (l) { existing._lang = l; },
      applyTranslations: existing.applyTranslations || function () {},
      autoTranslate: existing.autoTranslate || function () {},
      CORE_TERMS: existing.CORE_TERMS || {},
      REPORT_CONTENT_TERMS: REPORT_CONTENT_TERMS
    };
    // 保留第一个 IIFE 的引用
    Object.keys(existing).forEach(function (k) { mergeFields[k] = existing[k]; });
    mergeFields.translateReportContent = translateReportContent;
    mergeFields.REPORT_CONTENT_TERMS = REPORT_CONTENT_TERMS;
    global.i18n = mergeFields;
    // 同步关键字段供浏览器直接使用
    if (!global.REPORT_CONTENT_TERMS) global.REPORT_CONTENT_TERMS = REPORT_CONTENT_TERMS;
})(typeof window !== 'undefined' ? window : globalThis);
