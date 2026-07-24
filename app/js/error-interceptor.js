/**
 * ═══════════════════════════════════════════════════════════════
 *  命理宝鉴 · 前端 API 全局错误拦截器
 *  规范: docs/ERROR_HANDLING_STANDARD.md (S-2 / T-3)
 *  节点: KANBAN.md #4.3
 *  版本: v1.0 (2026-07-24)
 * ═══════════════════════════════════════════════════════════════
 *
 *  覆盖范围
 *  ────────
 *  1. 全局 window.fetch prototype 拦截（覆盖 95 处 fetch 调用）
 *  2. 全局 XMLHttpRequest 拦截（兜底）
 *  3. window.$axios 注入（兼容未来 axios 接入）
 *  4. 工具 API: apiCall(url, options) / showErrorToast / reportError
 *
 *  错误码收敛（与 server/api-response.js ERROR_CODES 对齐）
 *  ───────────────────────────────────────────────────────────
 *  0       成功
 *  400001  PARAM_INVALID    参数错误
 *  401001  UNAUTHORIZED     未登录
 *  401002  TOKEN_EXPIRED    Token 过期
 *  403001  FORBIDDEN        无权限
 *  404001  NOT_FOUND        资源不存在
 *  409001  CONFLICT         操作冲突
 *  429001  RATE_LIMIT_GLOBAL 全局限流
 *  429002  RATE_LIMIT_KB    KB 限流
 *  500001  SERVER_ERROR     服务端异常
 *  503001  AI_UNAVAILABLE   AI 不可用（建议 KB 兜底）
 *  503002  DB_UNAVAILABLE   DB 不可用
 *  ─────  网络层错误（无 code）→ 504000（自定义走网关）
 *
 *  使用方式
 *  ────────
 *  1) HTML 末尾加载: <script src="js/error-interceptor.js"></script>
 *  2) module 方式: import { apiCall, installErrorInterceptors } from './js/error-interceptor.js'
 *                   installErrorInterceptors()
 *  3) 业务调用:   const data = await apiCall('/api/xxx', { method:'POST', body:{...} })
 *
 *  兼容
 *  ────
 *  · 旧调用 fetch(url) 仍可工作，code 不为 0 时 reject 并 toast
 *  · 第三方库（如 jQuery $.ajax）暂不拦截
 *  · 通过 header `X-Skip-Interceptor: 1` 可豁免单次拦截
 */

(function (global) {
  'use strict';

  // ─────────────────────────────────────────────────────────────
  // 1. 错误码常量（与 server/api-response.js 同步）
  // ─────────────────────────────────────────────────────────────
  const ERROR_CODES = {
    SUCCESS: 0,
    PARAM_INVALID: 400001,
    UNAUTHORIZED: 401001,
    TOKEN_EXPIRED: 401002,
    FORBIDDEN: 403001,
    NOT_FOUND: 404001,
    CONFLICT: 409001,
    RATE_LIMIT_GLOBAL: 429001,
    RATE_LIMIT_KB: 429002,
    SERVER_ERROR: 500001,
    AI_UNAVAILABLE: 503001,
    DB_UNAVAILABLE: 503002,
    // 前端自定义
    NETWORK_ERROR: 504000,
    TIMEOUT: 504001,
    ABORTED: 504002,
    PARSE_ERROR: 504003
  };

  // ─────────────────────────────────────────────────────────────
  // 2. 用户友好文案（≤ 20 字，无技术词）
  //    完整版见 docs/ERROR_COPYWRITING.md（节点 4.4 扩到全码）
  // ─────────────────────────────────────────────────────────────
  const ERROR_COPY = {
    [ERROR_CODES.SUCCESS]:          { text: '操作成功',          type: 'success' },
    [ERROR_CODES.PARAM_INVALID]:    { text: '请检查输入内容',    type: 'warn' },
    [ERROR_CODES.UNAUTHORIZED]:     { text: '请先登录',          type: 'warn' },
    [ERROR_CODES.TOKEN_EXPIRED]:    { text: '登录已过期',        type: 'warn' },
    [ERROR_CODES.FORBIDDEN]:        { text: '您没有访问权限',    type: 'error' },
    [ERROR_CODES.NOT_FOUND]:        { text: '内容不存在或已删除', type: 'warn' },
    [ERROR_CODES.CONFLICT]:         { text: '操作冲突，请刷新',  type: 'warn' },
    [ERROR_CODES.RATE_LIMIT_GLOBAL]:{ text: '请求过于频繁',      type: 'warn' },
    [ERROR_CODES.RATE_LIMIT_KB]:    { text: '知识库调用过快',    type: 'warn' },
    [ERROR_CODES.SERVER_ERROR]:     { text: '服务异常，请稍后再试', type: 'error' },
    [ERROR_CODES.AI_UNAVAILABLE]:   { text: 'AI 暂时不可用，已切换知识库', type: 'info' },
    [ERROR_CODES.DB_UNAVAILABLE]:   { text: '数据服务维护中',    type: 'error' },
    [ERROR_CODES.NETWORK_ERROR]:    { text: '网络异常，请检查连接', type: 'error' },
    [ERROR_CODES.TIMEOUT]:          { text: '请求超时，请稍后再试', type: 'warn' },
    [ERROR_CODES.ABORTED]:          { text: '请求已取消',        type: 'info' },
    [ERROR_CODES.PARSE_ERROR]:      { text: '数据解析失败',      type: 'error' }
  };

  // ─────────────────────────────────────────────────────────────
  // 3. 配置
  // ─────────────────────────────────────────────────────────────
  const CONFIG = {
    maxRetry: 1,                  // 5xxxxx 时最多重试 1 次
    retryDelayMs: 800,            // 重试间隔
    timeoutMs: 15000,             // 默认 15s 超时
    logCacheKey: '_err_log_v1',   // localStorage 缓存 key
    logCacheMax: 20,              // 只保留最近 20 条
    reportEndpoint: '/api/log/error', // 错误上报端点
    enableReport: true,           // 5xxxxx 自动上报
    enableToast: true,            // 全局 toast 提示
    skipHeader: 'X-Skip-Interceptor'
  };

  // ─────────────────────────────────────────────────────────────
  // 4. 状态
  // ─────────────────────────────────────────────────────────────
  const STATE = {
    installed: false,
    rateLimitedUntil: 0,          // 429001 全局 30s 静默
    rateLimitMs: 30000,
    listeners: new Map()          // eventName → [fn]（供业务订制）
  };

  // ─────────────────────────────────────────────────────────────
  // 5. 工具函数
  // ─────────────────────────────────────────────────────────────
  function safeToast(msg, type) {
    if (!CONFIG.enableToast) return;
    try {
      if (global.toast && typeof global.toast.show === 'function') {
        global.toast.show(msg, type || 'error');
      } else if (global.shToast) {
        global.shToast(msg, type || 'error');
      } else if (typeof console !== 'undefined') {
        console.warn('[toast 未挂载]', msg);
      }
    } catch (e) {
      console.warn('[toast 调用失败]', e);
    }
  }

  function reportError(err, context) {
    try {
      const entry = {
        ts: Date.now(),
        code: err && err.code,
        message: err && err.message,
        url: (context && context.url) || (err && err.url) || '',
        stack: err && err.stack || '',
        ua: (typeof navigator !== 'undefined' && navigator.userAgent) || '',
        context: context || {}
      };
      // 5.1 console.error
      console.error('[err-interceptor]', entry);
      // 5.2 localStorage 缓存
      try {
        const arr = JSON.parse(localStorage.getItem(CONFIG.logCacheKey) || '[]');
        arr.push(entry);
        while (arr.length > CONFIG.logCacheMax) arr.shift();
        localStorage.setItem(CONFIG.logCacheKey, JSON.stringify(arr));
      } catch (_) {}
      // 5.3 全局限流期不上报
      if (CONFIG.enableReport && Date.now() < STATE.rateLimitedUntil) return;
      // 5.4 5xxxxx 类自动上报
      const code = entry.code;
      if (CONFIG.enableReport && typeof code === 'number' && code >= 500000 && code < 600000) {
        const body = JSON.stringify({
          code, message: entry.message, url: entry.url,
          stack: entry.stack, ua: entry.ua, context: entry.context
        });
        // Beacon 优先（不阻塞）
        if (navigator.sendBeacon) {
          navigator.sendBeacon(CONFIG.reportEndpoint, body);
        } else {
          fetch(CONFIG.reportEndpoint, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body, keepalive: true
          }).catch(() => {});
        }
      }
    } catch (e) {
      console.warn('[reportError 失败]', e);
    }
  }

  function showErrorToast(code, message) {
    const copy = ERROR_COPY[code] || { text: message || '操作失败', type: 'error' };
    safeToast(copy.text, copy.type);
    // 触发自定义事件
    emit('error', { code, message: copy.text, raw: message });
  }

  function emit(name, payload) {
    const arr = STATE.listeners.get(name);
    if (!arr) return;
    arr.forEach((fn) => {
      try { fn(payload); } catch (e) { console.warn('[emit listener]', e); }
    });
  }

  function publicReportError(err, context) {
    return reportError(err, context);
  }

  // ─────────────────────────────────────────────────────────────
  // 6. 业务响应判断（兼容多种壳）
  //    - 新壳: { code, message, data, traceId, timestamp }
  //    - 旧壳: { success, data, error } 等
  //    - 如果都没，按 HTTP 状态推断
  // ─────────────────────────────────────────────────────────────
  function normalizeResponse(res, body) {
    if (body == null) return { code: ERROR_CODES.NETWORK_ERROR, message: '空响应', data: null };
    if (typeof body === 'object') {
      // 新壳
      if (typeof body.code === 'number') {
        return {
          code: body.code,
          message: body.message || '',
          data: body.data === undefined ? null : body.data,
          traceId: body.traceId || null
        };
      }
      // 旧壳：success 字段
      if ('success' in body) {
        return {
          code: body.success ? 0 : ERROR_CODES.SERVER_ERROR,
          message: body.error || (body.success ? 'ok' : '操作失败'),
          data: body.data === undefined ? null : body.data
        };
      }
      // 兼容老 _v1 字段
      if (body._v1 && typeof body.code === 'number') {
        return {
          code: body.code,
          message: body.message || '',
          data: body.data === undefined ? null : body.data
        };
      }
    }
    // 默认当作成功 data
    return { code: 0, message: 'ok', data: body };
  }

  function httpCodeToBiz(httpStatus) {
    if (httpStatus === 0) return ERROR_CODES.NETWORK_ERROR;
    if (httpStatus === 401) return ERROR_CODES.UNAUTHORIZED;
    if (httpStatus === 403) return ERROR_CODES.FORBIDDEN;
    if (httpStatus === 404) return ERROR_CODES.NOT_FOUND;
    if (httpStatus === 408) return ERROR_CODES.TIMEOUT;
    if (httpStatus === 409) return ERROR_CODES.CONFLICT;
    if (httpStatus === 429) return ERROR_CODES.RATE_LIMIT_GLOBAL;
    if (httpStatus === 503) return ERROR_CODES.AI_UNAVAILABLE;
    if (httpStatus >= 500) return ERROR_CODES.SERVER_ERROR;
    if (httpStatus >= 400) return ERROR_CODES.PARAM_INVALID;
    return 0;
  }

  // ─────────────────────────────────────────────────────────────
  // 7. 自动重试策略：5xxxxx + GET 类可重试
  // ─────────────────────────────────────────────────────────────
  function shouldRetry(code, method) {
    if (code < 500000) return false;
    if (code === ERROR_CODES.AI_UNAVAILABLE) return false; // 503001 → 走 KB 兜底而非重试
    if (code === ERROR_CODES.DB_UNAVAILABLE) return false;
    if (method && /POST|PUT|DELETE|PATCH/i.test(method)) return false;
    return true;
  }

  function isRateLimited(code) {
    return code === ERROR_CODES.RATE_LIMIT_GLOBAL || code === ERROR_CODES.RATE_LIMIT_KB;
  }

  // ─────────────────────────────────────────────────────────────
  // 8. fetch prototype 拦截
  // ─────────────────────────────────────────────────────────────
  function installFetchInterceptor() {
    if (global.__fetchIntercepted) return;
    const origFetch = global.fetch;
    if (typeof origFetch !== 'function') return;

    global.fetch = function interceptedFetch(input, init) {
      init = init || {};
      const url = (typeof input === 'string') ? input : (input && input.url) || '';
      const method = (init.method || 'GET').toUpperCase();
      const headers = init.headers || {};
      // 豁免单次
      const skipHeaderVal = (typeof headers === 'object' && headers[CONFIG.skipHeader]) ||
        (input && input.headers && input.headers[CONFIG.skipHeader]);
      if (skipHeaderVal) {
        // 清理 header 后再发
        return origFetch(input, Object.assign({}, init, {
          headers: stripSkipHeader(headers)
        }));
      }

      // 附加 traceId
      const traceId = (global.crypto && crypto.randomUUID)
        ? crypto.randomUUID() : ('t-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8));
      const finalHeaders = Object.assign(
        {},
        (typeof headers === 'object' && !Array.isArray(headers)) ? headers : arrayHeadersToObject(headers),
        { 'X-Trace-Id': traceId }
      );
      const finalInit = Object.assign({}, init, { headers: finalHeaders, method });

      // 限时
      const ac = new AbortController();
      const timeoutId = setTimeout(() => ac.abort('timeout'), CONFIG.timeoutMs);
      finalInit.signal = ac.signal;

      const doFetch = () => {
        const p = origFetch(input, finalInit);
        return p.then((resp) => {
          clearTimeout(timeoutId);
          // 业务码由拦截器统一处理；HTTP 5xx → 业务码 500001
          const ct = resp.headers.get('content-type') || '';
          if (ct.includes('application/json')) {
            return resp.clone().json().then((body) => {
              const n = normalizeResponse(body, resp.status);
              // HTTP 错误覆盖业务码（4xx/5xx）
              if (!resp.ok && n.code === 0) {
                n.code = httpCodeToBiz(resp.status);
              }
              return { ok: n.code === 0, code: n.code, message: n.message, data: n.data, traceId: n.traceId, httpStatus: resp.status, response: resp };
            }).catch((e) => {
              return { ok: false, code: ERROR_CODES.PARSE_ERROR, message: 'JSON 解析失败', data: null, httpStatus: resp.status, response: resp };
            });
          }
          // 非 JSON：HTTP 状态判断
          if (!resp.ok) {
            return { ok: false, code: httpCodeToBiz(resp.status), message: resp.statusText || '请求失败', data: null, httpStatus: resp.status, response: resp };
          }
          return { ok: true, code: 0, message: 'ok', data: null, httpStatus: resp.status, response: resp };
        }).then((result) => {
          // 错误处理
          if (!result.ok) handleBizError(result, { url, method });
          return result;
        }).catch((err) => {
          clearTimeout(timeoutId);
          // 网络中断 / 超时
          const isTimeout = (err && err.name === 'AbortError') || (err && String(err).includes('timeout'));
          const result = {
            ok: false,
            code: isTimeout ? ERROR_CODES.TIMEOUT : ERROR_CODES.NETWORK_ERROR,
            message: isTimeout ? '请求超时' : '网络异常',
            data: null,
            httpStatus: 0
          };
          handleBizError(result, { url, method });
          return result;
        });
      };

      // 第一次尝试
      let attempt = doFetch();
      // 5xxxxx 自动重试 1 次
      attempt = attempt.then((result) => {
        if (result.ok) return result;
        if (!shouldRetry(result.code, method)) return result;
        return new Promise((resolve) => {
          setTimeout(() => {
            const retry = doFetch();
            retry.then(resolve);
          }, CONFIG.retryDelayMs);
        });
      });

      return attempt;
    };

    global.__fetchIntercepted = true;
  }

  function stripSkipHeader(headers) {
    if (!headers || typeof headers !== 'object') return headers;
    const out = Array.isArray(headers) ? headers.slice() : Object.assign({}, headers);
    try { delete out[CONFIG.skipHeader]; } catch (_) {}
    return out;
  }

  function arrayHeadersToObject(arr) {
    if (!Array.isArray(arr)) return {};
    const out = {};
    arr.forEach((kv) => { if (kv && kv.length >= 2) out[kv[0]] = kv[1]; });
    return out;
  }

  function handleBizError(result, ctx) {
    const code = result.code;
    // 429001 全局静默 30s
    if (code === ERROR_CODES.RATE_LIMIT_GLOBAL) {
      STATE.rateLimitedUntil = Date.now() + STATE.rateLimitMs;
    }
    // 401001/401002 → 跳登录（保留 returnTo）
    if (code === ERROR_CODES.UNAUTHORIZED || code === ERROR_CODES.TOKEN_EXPIRED) {
      try {
        const here = location.pathname + location.search;
        if (typeof location !== 'undefined' && !location.pathname.includes('/login')) {
          const ret = encodeURIComponent(here);
          // 不强制跳转，只在 5s 内多次 401 才跳
          handleAuthRedirect(ret);
        }
      } catch (_) {}
    }
    // toast
    showErrorToast(code, result.message);
    // 5.2 上报
    if (code >= 500000 || code === ERROR_CODES.NETWORK_ERROR || code === ERROR_CODES.TIMEOUT) {
      reportError({ code, message: result.message, stack: '' }, Object.assign({ url: ctx.url, method: ctx.method }, ctx));
    }
  }

  // 401 多次确认：5s 内出现 2 次才跳登录，避免单次抖动
  const AUTH_REDIRECT = { count: 0, firstAt: 0 };
  function handleAuthRedirect(returnTo) {
    const now = Date.now();
    if (now - AUTH_REDIRECT.firstAt > 5000) {
      AUTH_REDIRECT.count = 0;
      AUTH_REDIRECT.firstAt = now;
    }
    AUTH_REDIRECT.count++;
    if (AUTH_REDIRECT.count >= 2) {
      try {
        location.href = '/app/login.html?returnTo=' + returnTo;
      } catch (_) {}
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 9. XMLHttpRequest 拦截（兜底）
  // ─────────────────────────────────────────────────────────────
  function installXHRInterceptor() {
    if (global.__xhrIntercepted) return;
    const Orig = global.XMLHttpRequest;
    if (typeof Orig !== 'function') return;

    function WrappedXHR() {
      const xhr = new Orig();
      const _open = xhr.open.bind(xhr);
      const _send = xhr.send.bind(xhr);
      let _method = 'GET';
      let _url = '';

      xhr.open = function (method, url) {
        _method = method;
        _url = url;
        return _open.apply(xhr, arguments);
      };
      xhr.send = function (body) {
        xhr.addEventListener('loadend', function () {
          try {
            if (xhr.status === 0) return; // 被拦截或未发出
            const ct = xhr.getResponseHeader('content-type') || '';
            if (ct.includes('application/json')) {
              let body = null;
              try { body = JSON.parse(xhr.responseText); } catch (_) {}
              if (body) {
                const n = normalizeResponse(body, xhr.status);
                if (!n.code) { /* 成功不处理 */ }
                else handleBizError({ code: n.code, message: n.message, data: n.data }, { url: _url, method: _method });
              }
            } else if (xhr.status >= 400) {
              handleBizError({ code: httpCodeToBiz(xhr.status), message: xhr.statusText }, { url: _url, method: _method });
            }
          } catch (e) {
            console.warn('[XHR 拦截错误]', e);
          }
        });
        return _send.apply(xhr, arguments);
      };
      return xhr;
    }
    WrappedXHR.prototype = Orig.prototype;
    WrappedXHR.UNSENT = 0;
    WrappedXHR.OPENED = 1;
    WrappedXHR.HEADERS_RECEIVED = 2;
    WrappedXHR.LOADING = 3;
    WrappedXHR.DONE = 4;
    global.XMLHttpRequest = WrappedXHR;
    global.__xhrIntercepted = true;
  }

  // ─────────────────────────────────────────────────────────────
  // 10. 注入 $axios（兼容未来 axios 接入）
  // ─────────────────────────────────────────────────────────────
  function installAxiosStub() {
    if (global.$axios) return;
    // 占位 stub：实际接入 axios 时，仅需为其实例的 interceptors.response.use 追加同一矩阵
    global.$axios = {
      _handlers: [],
      use(onFulfilled, onRejected) {
        this._handlers.push({ onFulfilled, onRejected });
        return this._handlers.length - 1;
      },
      eject(id) { this._handlers.splice(id, 1); },
      _emit(err) {
        const code = (err && err.response && err.response.data && err.response.data.code) || httpCodeToBiz(err && err.response && err.response.status);
        const msg = (err && err.response && err.response.data && err.response.data.message) || (err && err.message);
        handleBizError({ code, message: msg }, { url: err && err.config && err.config.url });
      }
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 11. 公开 API：apiCall
  // ─────────────────────────────────────────────────────────────
  /**
   * 统一 API 调用入口
   * @param {string} url
   * @param {object} options { method, body, headers, timeout, retry, skipToast, skipReport, raw }
   * @returns {Promise<{ok: boolean, code: number, message: string, data: any}>}
   */
  async function apiCall(url, options) {
    options = options || {};
    const method = (options.method || 'GET').toUpperCase();
    const headers = Object.assign({}, options.headers || {});
    if (options.skipInterceptor) headers[CONFIG.skipHeader] = '1';
    const init = {
      method,
      headers
    };
    if (options.body !== undefined) {
      if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
        init.body = JSON.stringify(options.body);
        if (!headers['Content-Type'] && !headers['content-type']) {
          headers['Content-Type'] = 'application/json';
        }
      } else {
        init.body = options.body;
      }
    }
    if (options.timeout) init.signal = AbortSignal.timeout(options.timeout);
    else if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) {
      init.signal = AbortSignal.timeout(CONFIG.timeoutMs);
    }
    // 拦截器已全局生效，fetch 已被替换为统一返回标准化结果的版本
    return global.fetch(url, init);
  }

  // ─────────────────────────────────────────────────────────────
  // 12. 入口
  // ─────────────────────────────────────────────────────────────
  function installErrorInterceptors() {
    if (STATE.installed) return true;
    installFetchInterceptor();
    installXHRInterceptor();
    installAxiosStub();
    STATE.installed = true;
    console.log('[error-interceptor] 已安装（fetch + XHR + $axios stub）');
    return true;
  }

  // 暴露给业务
  const api = {
    // 工具
    get(url, opts) { return apiCall(url, Object.assign({ method: 'GET' }, opts)); },
    post(url, body, opts) { return apiCall(url, Object.assign({ method: 'POST', body: body || {} }, opts || {})); },
    put(url, body, opts) { return apiCall(url, Object.assign({ method: 'PUT', body: body || {} }, opts || {})); },
    del(url, opts) { return apiCall(url, Object.assign({ method: 'DELETE' }, opts)); },
    raw(url, opts) { return apiCall(url, Object.assign({}, opts, { skipInterceptor: true })); },
    // 错误处理
    showErrorToast,
    reportError: publicReportError,
    // 监听
    on(event, fn) {
      if (!STATE.listeners.has(event)) STATE.listeners.set(event, []);
      STATE.listeners.get(event).push(fn);
    },
    off(event, fn) {
      const arr = STATE.listeners.get(event);
      if (!arr) return;
      const i = arr.indexOf(fn);
      if (i >= 0) arr.splice(i, 1);
    },
    // 常量
    ERROR_CODES,
    ERROR_COPY,
    // 配置
    config: CONFIG,
    // 状态
    state: STATE,
    // 安装
    install: installErrorInterceptors
  };

  // ─────────────────────────────────────────────────────────────
  // 13. 自动挂载（双重策略：AMD-like + IIFE 全局）
  // ─────────────────────────────────────────────────────────────
  global.apiClient = api;
  global.apiError = api; // 兼容旧名
  global.installErrorInterceptors = installErrorInterceptors;
  global.showErrorToast = showErrorToast;
  global.reportError = publicReportError;

  // 兼容性：ES Module 导出（如果 <script type="module"> 加载）
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  // DOM Ready 后自动安装
  if (typeof document !== 'undefined') {
    const boot = () => installErrorInterceptors();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
      boot();
    }
  }

})(typeof window !== 'undefined' ? window : globalThis);
