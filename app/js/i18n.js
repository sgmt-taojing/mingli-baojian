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

  global.i18n = { t: t, setLang: setLang, getLang: getLang, applyTranslations: applyTranslations, autoTranslate: autoTranslate, CORE_TERMS: CORE_TERMS };
  init();
})(typeof window !== 'undefined' ? window : globalThis);

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
    };

    global.REPORT_CONTENT_TERMS = REPORT_CONTENT_TERMS;
  }

  function translateReportContent(content) {
    if (_lang === 'zh' || !content) return content;
    var text = content;
    var zh, en;
    for (zh in REPORT_CONTENT_TERMS) {
      if (REPORT_CONTENT_TERMS.hasOwnProperty(zh) && text.indexOf(zh) >= 0) {
        text = text.split(zh).join(REPORT_CONTENT_TERMS[zh]);
      }
    }
    return text;
  }

  global.i18n = {
    t: t, setLang: setLang, getLang: getLang,
    applyTranslations: applyTranslations, autoTranslate: autoTranslate,
    translateReportContent: translateReportContent,
    CORE_TERMS: CORE_TERMS, REPORT_CONTENT_TERMS: REPORT_CONTENT_TERMS
  };
}
