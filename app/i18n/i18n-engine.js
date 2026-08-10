/**
 * i18n-engine.js — 轻量多语言切换引擎（零依赖，浏览器原生）
 *
 * 用法：
 *   <html lang="zh-CN">
 *   <script src="/app/i18n/i18n-engine.js"></script>
 *   <body data-i18n="nav.bazi">八字</body>  ← 自动替换
 *   I18N.setLocale('en-SG')  ← 切换语言
 *   I18N.t('collab.title')   ← 程序取值
 */
'use strict';

const I18N = (function () {
  const LANG_STORE = 'mbj_locale';
  const REGION_STORE = 'mbj_region';
  const DEFAULT_LOCALE = 'zh-CN';
  const REGION_LOCALE = {
    cn: 'zh-CN', sg: 'en-SG', jp: 'ja-JP', kr: 'ko-KR', vn: 'vi-VN',
    us: 'en-SG', eu: 'en-SG', tw: 'zh-TW', hk: 'zh-TW', my: 'en-SG', th: 'en-SG', au: 'en-SG',
  };
  const SUPPORTED = {
    'zh-CN': '简体中文',
    'zh-TW': '繁體中文',
    'en-SG': 'English (SEA)',
    'ja-JP': '日本語',
    'ko-KR': '한국어',
    'vi-VN': 'Tiếng Việt',
  };

  let _locale = localStorage.getItem(LANG_STORE) || _localeFromRegion() || _detectLocale();

  function _localeFromRegion() {
    const region = localStorage.getItem(REGION_STORE);
    return (region && REGION_LOCALE[region]) || null;
  }
  let _packs = {};
  let _loaded = {};

  function _detectLocale() {
    const nav = (navigator.language || navigator.userLanguage || '').toLowerCase();
    if (nav.startsWith('zh-tw') || nav.startsWith('zh-hk') || nav.startsWith('zh-sg')) return 'zh-TW';
    if (nav.startsWith('zh')) return 'zh-CN';
    if (nav.startsWith('en')) return 'en-SG';
    return DEFAULT_LOCALE;
  }

  /** 深取值：pack.a.b.c → pack.a.b.c || key */
  function _get(obj, path) {
    return path.split('.').reduce((o, k) => (o && o[k] != null ? o[k] : null), obj);
  }

  /** 异步加载语言包 JSON */
  async function _load(locale) {
    if (_loaded[locale]) return _packs[locale];
    try {
      let res = await fetch(`/i18n/${locale}.json`).catch(() => null);
      if (!res || !res.ok) res = await fetch(`/app/i18n/${locale}.json`).catch(() => null);
      if (!res || !res.ok) throw new Error('HTTP ' + (res && res.status));
      _packs[locale] = await res.json();
      _loaded[locale] = true;
      return _packs[locale];
    } catch (e) {
      console.warn('[i18n] load failed:', locale, e.message);
      if (locale !== DEFAULT_LOCALE) return _load(DEFAULT_LOCALE);
      return {};
    }
  }

  /** 翻译 key（支持 fallback 到默认语言） */
  function t(key) {
    const pack = _packs[_locale] || {};
    const val = _get(pack, key);
    if (val != null) return val;
    // fallback 默认
    const def = _get(_packs[DEFAULT_LOCALE] || {}, key);
    return def != null ? def : key;
  }

  /** 扫描 DOM 中 [data-i18n] 元素，批量替换文本 */
  function _applyDOM() {
    const pack = _packs[_locale] || {};
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = _get(pack, key);
      if (val != null) el.textContent = val;
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      const key = el.getAttribute('data-i18n-ph');
      const val = _get(pack, key);
      if (val != null) el.setAttribute('placeholder', val);
    });
    document.documentElement.lang = _locale;
  }

  /** 切换语言（异步加载 → 应用 DOM → 存 localStorage） */
  async function setLocale(locale) {
    if (!SUPPORTED[locale]) {
      console.warn('[i18n] unsupported locale:', locale);
      return;
    }
    _locale = locale;
    localStorage.setItem(LANG_STORE, locale);
    await _load(locale);
    if (!_packs[DEFAULT_LOCALE]) await _load(DEFAULT_LOCALE);
    _applyDOM();
    // 广播事件
    document.dispatchEvent(new CustomEvent('locale-changed', { detail: { locale } }));
  }

  /** 初始化（页面加载时自动调用） */
  async function init() {
    await _load(DEFAULT_LOCALE);
    if (_locale !== DEFAULT_LOCALE) await _load(_locale);
    _applyDOM();
    return _locale;
  }

  /** 语言选择器 HTML（可嵌入顶栏） */
  function selectorHTML(current) {
    const cur = current || _locale;
    return `<select class="i18n-selector" onchange="I18N.setLocale(this.value)">
      ${Object.entries(SUPPORTED).map(([k, v]) =>
        `<option value="${k}" ${k === cur ? 'selected' : ''}>${v}</option>`
      ).join('')}
    </select>`;
  }

  return {
    t, setLocale, init, selectorHTML,
    get locale() { return _locale; },
    get supported() { return SUPPORTED; },
  };
})();

// 自动初始化（DOM ready）
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => I18N.init());
} else {
  I18N.init();
}

window.I18N = I18N;
