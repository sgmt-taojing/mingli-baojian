/**
 * OCRClient — 全局统一 OCR 客户端
 *
 * 所有需要 OCR 的页面统一用 window.OCRClient，不再各自 fetch。
 *
 * 支持 mode:
 *   - 'ocr'       通用 OCR（文字/文档/卦象）→ /api/ocr/recognize
 *   - 'ocr-tcm'   中医病历 OCR（处方/舌苔/脉案）→ /api/ocr/tcm
 *   - 'face'      面相分析 → /api/face/analyze
 *   - 'tongue'    舌诊分析 → /api/face/analyze?mode=tongue
 *   - 'wangzhen'  中医望诊 → /api/face/analyze?mode=wangzhen
 *
 * 用法：
 *   const result = await OCRClient.recognize(imageB64, 'ocr-tcm');
 *   const result = await OCRClient.recognize(file, 'ocr');
 *   OCRClient.addEventListener(onChange);
 */
(function(global) {
  'use strict';

  var API = (location.hostname === '127.0.0.1' || location.hostname === 'localhost')
    ? 'http://127.0.0.1:8920' : '';

  var MODE_MAP = {
    'ocr':       { url: '/api/ocr/recognize', kbModule: 'classics' },
    'ocr-tcm':   { url: '/api/ocr/tcm',       kbModule: 'tcm' },
    'face':      { url: '/api/face/analyze',  kbModule: 'mianxue' },
    'tongue':    { url: '/api/face/analyze',  kbModule: 'shexiang', extra: { mode: 'tongue' } },
    'wangzhen':  { url: '/api/face/analyze',  kbModule: 'tcm',     extra: { mode: 'wangzhen' } },
    'report':    { url: '/api/ocr/tcm',       kbModule: 'tcm',     extra: { mode: 'report' } }
  };

  var listeners = [];
  var csrfCache = null;
  var csrfTime = 0;

  function getCsrf() {
    if (csrfCache && Date.now() - csrfTime < 25 * 60 * 1000) {
      return Promise.resolve(csrfCache);
    }
    return fetch(API + '/api/csrf', { credentials: 'include' })
      .then(function(r) { return r.json(); })
      .then(function(j) {
        csrfCache = j.csrf_token || (j.data && j.data.csrf_token) || '';
        csrfTime = Date.now();
        return csrfCache;
      })
      .catch(function() { return ''; });
  }

  function fileToB64(file) {
    return new Promise(function(resolve, reject) {
      var reader = new FileReader();
      reader.onload = function(e) {
        var b64 = e.target.result.split(',')[1];
        resolve(b64);
      };
      reader.onerror = function() { reject(new Error('图片编码失败')); };
      reader.readAsDataURL(file);
    });
  }

  function notify(state) {
    listeners.forEach(function(fn) {
      try { fn(state); } catch(e) { console.warn('[OCRClient listener]', e); }
    });
  }

  var OCRClient = {
    API: API,
    MODE_MAP: MODE_MAP,

    /**
     * 统一 OCR 调用
     * @param {string|File|Blob} image - base64(不含前缀) 或 File/Blob
     * @param {string} mode - 'ocr' | 'ocr-tcm' | 'face' | 'tongue' | 'wangzhen' | 'report'
     * @param {object} [opts] - { extra: {}, timeout: 15000 }
     * @returns {Promise<{ok, text, engine, raw, latency, mode}>}
     */
    recognize: async function(image, mode, opts) {
      mode = mode || 'ocr';
      opts = opts || {};
      var cfg = MODE_MAP[mode];
      if (!cfg) throw new Error('未知 OCR 模式: ' + mode);

      var b64 = image;
      if (image instanceof File || image instanceof Blob) {
        b64 = await fileToB64(image);
      }

      notify({ state: 'start', mode: mode });

      var t0 = Date.now();
      var csrf = await getCsrf();

      var body = { image: b64 };
      if (cfg.extra) Object.assign(body, cfg.extra);
      if (opts.extra) Object.assign(body, opts.extra);

      var controller = new AbortController();
      var timeoutId = setTimeout(function() { controller.abort(); }, opts.timeout || 15000);

      try {
        var r = await fetch(API + cfg.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': csrf
          },
          body: JSON.stringify(body),
          credentials: 'include',
          signal: controller.signal
        });

        var data = await r.json().catch(function() { return {}; });
        var latency = Date.now() - t0;

        var text = data.text || (data.data && data.data.text) || data.rawText || '';
        var engine = data.engine || (data.data && data.data.engine) || 'face-ocr';
        var ok = data.ok === true || data.code === 200 || r.ok;

        var result = {
          ok: ok,
          text: text,
          engine: engine,
          raw: data,
          latency: latency,
          mode: mode,
          kbModule: cfg.kbModule
        };

        notify({ state: 'done', result: result });
        clearTimeout(timeoutId);
        return result;

      } catch(e) {
        clearTimeout(timeoutId);
        var fallback = {
          ok: false,
          text: '',
          engine: 'unavailable',
          raw: null,
          latency: Date.now() - t0,
          mode: mode,
          error: e.message
        };

        // 离线兜底：如果 8913/8920 不可达，返回友好错误
        if (e.name === 'AbortError') {
          fallback.text = '⏱️ OCR 请求超时，请检查 face-ocr-server (8913) 是否在线';
        } else if (e.message.indexOf('Failed to fetch') > -1) {
          fallback.text = '⚠️ OCR 服务不可达，请确认 8913 端口运行中';
        }

        notify({ state: 'error', result: fallback });
        return fallback;
      }
    },

    /** 便捷方法 */
    ocr: function(image, opts) { return this.recognize(image, 'ocr', opts); },
    tcm: function(image, opts) { return this.recognize(image, 'ocr-tcm', opts); },
    face: function(image, opts) { return this.recognize(image, 'face', opts); },
    tongue: function(image, opts) { return this.recognize(image, 'tongue', opts); },
    report: function(image, opts) { return this.recognize(image, 'report', opts); },

    /** 监听状态变化 */
    addEventListener: function(fn) { listeners.push(fn); },
    removeEventListener: function(fn) {
      var i = listeners.indexOf(fn);
      if (i > -1) listeners.splice(i, 1);
    },

    /** 检查 OCR 服务是否可用 */
    healthCheck: async function() {
      try {
        var r = await fetch(API + '/api/ocr/recognize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: '' }),
          signal: AbortSignal.timeout ? AbortSignal.timeout(3000) : undefined
        });
        return r.status < 500;
      } catch(e) {
        return false;
      }
    }
  };

  global.OCRClient = OCRClient;
})(window);
