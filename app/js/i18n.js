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
    try { localStorage.setItem('_i18n_lang', lang); } catch (_) {}
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
    try { saved = localStorage.getItem('_i18n_lang'); } catch (_) {}
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
