/**
 * 命理宝鉴 · 轻量自实现 i18n（节点 8.2 产出）
 *
 * 设计目标：
 *  - 体积小（< 2 KB），零依赖
 *  - 浏览器中 window.I18N.t('key') / window.I18N.setLocale() 立即可用
 *  - 内置 zh-CN 兜底字典（≥25 个共性 UI 字面量 + 节点 8.5 扩展 20 条 → 共 45+ 条）
 *  - 异步加载其他 locale 字典（zh-TW / en-US 后续扩展）
 *  - DOM 扫描：[data-i18n] / [data-i18n-placeholder] / [data-i18n-title] / [data-i18n-aria-label]
 *  - 占位符替换：支持 {name} / {count} 等简单变量
 *  - 缺失 key 兜底：内置 zh-CN → fallback 字符串 → "[key]"（warn 一次）
 *
 * KB 知识库内容（97.8% 中文字符）**不参与 i18n**，仅 UI 文案走 t()。
 *
 * API 表面：
 *   I18N.locale           — 当前语言，默认 'zh-CN'
 *   I18N.messages         — 当前语言字典（懒加载）
 *   I18N.fallback         — 兜底字典，默认内置 zh-CN
 *   I18N.t(key, params)   — 取字典，找不到返回 "[key]"
 *   I18N.setLocale(loc)   — 切换语言，触发 i18n:localechange
 *   I18N.loadLocale(loc, url) — 内部用：fetch JSON
 *   I18N.apply(root)      — DOM 扫描替换
 *   I18N.init({locale, messages, autoApply}) — 入口
 *
 * 用法示例：
 *   <script src="/js/i18n.js"></script>
 *   <script>I18N.init({ autoApply: true });</script>
 *   <button data-i18n="common.submit">提交</button>
 *   <input data-i18n-placeholder="form.name_required" placeholder="请输入姓名">
 *   const msg = I18N.t('error.401001');
 */
(function (global) {
  'use strict';

  // ---- 内置兜底字典（≥45 个共性 UI 字面量：节点 8.2 = 25 + 节点 8.5 = 20） ----
  var BUILTIN_ZH_CN = {
    // 通用动作 / 按钮
    'loading':          '加载中…',
    'empty':            '暂无数据',
    'placeholder':      '请输入',
    'save':             '保存',
    'login':            '登录',
    'confirm':          '确认',
    'submit':           '提交',
    'cancel':           '取消',
    'delete':           '删除',
    'retry':            '重试',
    'success':          '操作成功',
    'failed':           '操作失败',
    'yes':              '是',
    'no':               '否',
    'back':             '返回',
    'next':             '下一步',
    'prev':             '上一步',
    'close':            '关闭',
    'more':             '更多',
    'loading_failed':   '加载失败',
    'network_error':    '网络异常',
    'permission_denied':'无权访问',
    'not_found':        '未找到',
    'server_error':     '服务器错误',
    'timeout':          '请求超时',

    // 错误码文案（节点 4.4 ERROR_COPYWRITING.md 三段式：发生+影响+行动）
    // 业务级（4xx）
    'error.0':          '操作成功',
    'error.400001':     '请检查输入内容，部分字段不合法',
    'error.400002':     '必填项未填写完整，请补全后提交',
    'error.400003':     '输入内容过长，请精简后再提交',
    'error.401001':     '请先登录后再使用此功能',
    'error.401002':     '登录已过期，正在为您重新登录…',
    'error.401003':     '登录信息异常，请重新登录',
    'error.403001':     '您没有访问权限',
    'error.403002':     '您当前没有该操作权限',
    'error.403003':     '此功能仅在特定地区开放',
    'error.404001':     '内容不存在或已被删除',
    'error.404002':     '服务暂未上线，敬请期待',
    'error.409001':     '操作冲突，请刷新页面后重试',
    'error.409002':     '请勿重复操作',
    'error.422001':     '内容校验未通过，请检查输入',
    'error.429001':     '操作太频繁，请稍等 30 秒后再试',
    'error.429002':     '知识库调用过快，请稍后再试',
    'error.429003':     'AI 调用已达上限（每日额度），请明日再试',

    // 服务级（5xx）
    'error.500001':     '服务异常，我们已记录（编号 xxx）',
    'error.500002':     '服务繁忙，已自动切换备用方案',
    'error.500003':     '后端处理超时，请稍后再试',
    'error.503001':     'AI 助手暂时繁忙，已切换知识库为您解答',
    'error.503002':     '数据服务升级中，请稍后再试',
    'error.503003':     '语音服务暂不可用，已切换文字回复',
    'error.503004':     '视觉识别暂不可用，请手动输入',
    'error.503005':     '排盘超时，请稍后再试',
    'error.504000':     '网络异常，请检查连接后重试',
    'error.504001':     '请求超时，请稍后再试',
    'error.504002':     '请求已取消',
    'error.504003':     '数据解析失败，请刷新页面',

    // === 节点 8.5 新增：共性 UI 字面量（20 条，提供 flat + common.* 双向） ===
    // 基础动作（7 条，原 BUILTIN 未覆盖；'placeholder' 已在上方定义）
    'search':           '搜索',
    'copy':             '复制',
    'share':            '分享',
    'export':           '导出',
    'loadingMore':      '加载更多',
    'noMore':           '没有更多了',
    'operationFailed':  '操作失败，请重试',
    // common.* 命名空间形式（与 zh-CN.json 嵌套结构对齐）
    'common.loading':       '加载中…',
    'common.empty':         '暂无数据',
    'common.placeholder':   '请输入',
    'common.save':          '保存',
    'common.cancel':        '取消',
    'common.confirm':       '确认',
    'common.submit':        '提交',
    'common.delete':        '删除',
    'common.login':         '登录',
    'common.retry':         '重试',
    'common.back':          '返回',
    'common.close':         '关闭',
    'common.edit':          '编辑',
    'common.search':        '搜索',
    'common.copy':          '复制',
    'common.share':         '分享',
    'common.export':        '导出',
    'common.loadingMore':   '加载更多',
    'common.noMore':        '没有更多了',
    'common.operationFailed':'操作失败，请重试'
  };

  // ---- 内部状态 ----
  var locale   = 'zh-CN';
  var messages = Object.assign({}, BUILTIN_ZH_CN);
  var fallback = BUILTIN_ZH_CN;
  var warnedKeys = {}; // 去重 warn，避免刷屏

  // ---- 工具函数 ----
  function warnOnce(key) {
    if (warnedKeys[key]) return;
    warnedKeys[key] = true;
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('[i18n] missing key:', key);
    }
  }

  /**
   * 占位符替换：支持 {name} / {count} 等
   * 仅做简单字符串替换，不引入模板引擎
   */
  function interpolate(str, params) {
    if (!params || typeof str !== 'string') return str;
    return str.replace(/\{(\w+)\}/g, function (_, k) {
      return params[k] !== undefined ? String(params[k]) : '{' + k + '}';
    });
  }

  /**
   * 查嵌套对象：'error.401001' → ['error']['401001']
   * 支持点分 key 与 flat key 双向查询（节点 8.4 兼容 BUILTIN_ZH_CN 与 zh-CN.json）
   * @param {Object} obj
   * @param {string} key
   * @returns {*} 查到的值 / undefined
   */
  function lookup(obj, key) {
    if (obj == null) return undefined;
    if (obj[key] !== undefined) return obj[key]; // flat 优先
    var parts = key.split('.');
    var cur = obj;
    for (var i = 0; i < parts.length; i++) {
      if (cur == null) return undefined;
      cur = cur[parts[i]];
    }
    return cur;
  }

  /**
   * 翻译函数
   * @param {string} key - 字典 key（支持 'error.401001' 嵌套 / 'loading' flat / 'error.0'）
   * @param {Object|string=} params - 占位符参数或兜底字符串
   * @returns {string} 翻译结果；找不到返回 fallback 或 "[key]"
   */
  function t(key, params) {
    if (typeof key !== 'string') return '';
    var val = lookup(messages, key);
    if (val === undefined) {
      val = lookup(fallback, key);
    }
    if (val === undefined) {
      if (typeof params === 'string') return params; // 兼容 error-interceptor: t('error.x', '兜底')
      warnOnce(key);
      return '[' + key + ']';
    }
    return interpolate(val, typeof params === 'string' ? undefined : params);
  }

  /**
   * 切换语言：加载 → 覆盖 → 通知
   * @param {string} newLocale
   * @returns {Promise<boolean>}
   */
  function setLocale(newLocale) {
    if (!newLocale || newLocale === locale) {
      return Promise.resolve(true);
    }
    return loadLocale(newLocale).then(function (ok) {
      if (!ok) return false;
      locale = newLocale;
      if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.lang = newLocale;
      }
      if (typeof global.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
        try {
          global.dispatchEvent(new CustomEvent('i18n:localechange', {
            detail: { locale: newLocale }
          }));
        } catch (e) { /* ignore IE 兼容 */ }
      }
      return true;
    });
  }

  /**
   * 内部用：从 URL 加载 JSON 字典
   * @param {string} loc - 语言标识
   * @param {string=} url - 字典文件 URL（默认 /i18n/{loc}.json）
   * @returns {Promise<boolean>}
   */
  function loadLocale(loc, url) {
    var target = url || ((typeof location !== 'undefined' ? location.origin : '') + '/i18n/' + loc + '.json');
    if (typeof fetch === 'undefined') {
      console.warn('[i18n] fetch not available, skip loadLocale');
      return Promise.resolve(false);
    }
    return fetch(target, { credentials: 'same-origin' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (json) {
        if (json && typeof json === 'object') {
          messages = Object.assign({}, BUILTIN_ZH_CN, json);
          return true;
        }
        return false;
      })
      .catch(function (err) {
        console.warn('[i18n] loadLocale failed:', loc, err && err.message);
        return false;
      });
  }

  /**
   * DOM 扫描替换
   * @param {Element|Document=} root - 扫描根，默认 document
   */
  function apply(root) {
    root = root || (typeof document !== 'undefined' ? document : null);
    if (!root || typeof root.querySelectorAll !== 'function') return;

    // textContent
    var nodes = root.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var k = el.getAttribute('data-i18n');
      if (k) el.textContent = t(k);
    }

    // placeholder
    var phs = root.querySelectorAll('[data-i18n-placeholder]');
    for (var j = 0; j < phs.length; j++) {
      var pEl = phs[j];
      var pk = pEl.getAttribute('data-i18n-placeholder');
      if (pk) pEl.setAttribute('placeholder', t(pk));
    }

    // title
    var tts = root.querySelectorAll('[data-i18n-title]');
    for (var k2 = 0; k2 < tts.length; k2++) {
      var tEl = tts[k2];
      var tk = tEl.getAttribute('data-i18n-title');
      if (tk) tEl.setAttribute('title', t(tk));
    }

    // aria-label
    var als = root.querySelectorAll('[data-i18n-aria-label]');
    for (var m = 0; m < als.length; m++) {
      var aEl = als[m];
      var ak = aEl.getAttribute('data-i18n-aria-label');
      if (ak) aEl.setAttribute('aria-label', t(ak));
    }
  }

  /**
   * 入口
   * @param {Object=} opts
   *   - locale {string}    目标语言，默认 'zh-CN'
   *   - messages {Object}  预置字典（覆盖内置）
   *   - autoApply {boolean} 是否自动扫描 document，默认 false
   *   - url {string}       字典文件 URL（可选，配合 locale）
   */
  function init(opts) {
    opts = opts || {};
    if (opts.messages && typeof opts.messages === 'object') {
      messages = Object.assign({}, BUILTIN_ZH_CN, opts.messages);
      fallback = messages;
    }
    if (opts.locale && opts.locale !== locale) {
      // 异步加载不阻塞 init
      return loadLocale(opts.locale, opts.url).then(function () {
        locale = opts.locale;
        if (typeof document !== 'undefined' && document.documentElement) {
          document.documentElement.lang = opts.locale;
        }
        if (opts.autoApply) apply(typeof document !== 'undefined' ? document : null);
      });
    }
    if (opts.autoApply && typeof document !== 'undefined') {
      apply(document);
    }
    return Promise.resolve(true);
  }

  // ---- 暴露 API ----
  global.I18N = {
    locale: locale,
    messages: messages,
    fallback: fallback,
    t: t,
    setLocale: setLocale,
    loadLocale: loadLocale,
    apply: apply,
    init: init
  };

  // 兼容 __("xxx") 风格（如未来需要可启用）
  // global.__ = t;

})(typeof window !== 'undefined' ? window : globalThis);