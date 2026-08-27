/**
 * ═══════════════════════════════════════════════════════════════
 *  TCM-Agent · UI 三态组件库
 *  R731 修真——统一空态/加载态/错误态
 *  全站 55 个二级页统一接入
 * ═══════════════════════════════════════════════════════════════
 */

(function (global) {
  'use strict';

  // ── 空态组件 ─────────────────────────────────────────────
  /**
   * <empty-state icon="📋" title="暂无数据" hint="点击右下角添加"></empty-state>
   */
  function emptyState(opts) {
    opts = opts || {};
    var icon = opts.icon || '📋';
    var title = opts.title || '暂无数据';
    var hint = opts.hint || '';
    var action = opts.action || ''; // 可选按钮 HTML
    return [
      '<div class="ui-state ui-state-empty" role="status">',
      '  <div class="ui-state-icon">' + icon + '</div>',
      '  <div class="ui-state-title">' + title + '</div>',
      '  <div class="ui-state-hint">' + hint + '</div>',
      '  <div class="ui-state-action">' + action + '</div>',
      '</div>'
    ].join('');
  }

  // ── 加载态组件 ───────────────────────────────────────────
  /**
   * <loading-state text="正在加载..." spinner></loading-state>
   */
  function loadingState(opts) {
    opts = opts || {};
    var text = opts.text || '正在加载…';
    var spinner = opts.spinner !== false;
    return [
      '<div class="ui-state ui-state-loading" role="status" aria-live="polite">',
      (spinner ? '  <div class="ui-state-spinner"></div>' : ''),
      '  <div class="ui-state-text">' + text + '</div>',
      '</div>'
    ].join('');
  }

  // ── 错误态组件 ───────────────────────────────────────────
  /**
   * <error-state code="500001" message="服务异常" retry></error-state>
   */
  function errorState(opts) {
    opts = opts || {};
    var code = opts.code || 'unknown';
    var message = opts.message || '加载失败';
    var showRetry = opts.retry !== false;
    var retryText = opts.retryText || '重试';
    var retryCallback = opts.retryCallback || '';
    return [
      '<div class="ui-state ui-state-error" role="alert">',
      '  <div class="ui-state-icon">⚠️</div>',
      '  <div class="ui-state-title">加载失败</div>',
      '  <div class="ui-state-message">' + message + '</div>',
      '  <div class="ui-state-code">错误码: ' + code + '</div>',
      (showRetry ? '  <button class="ui-state-retry" onclick="' + retryCallback + '">' + retryText + '</button>' : ''),
      '</div>'
    ].join('');
  }

  // ── 三态切换辅助：自动根据 fetch 返回渲染对应状态 ─────────
  /**
   * 三态渲染器
   * @param {HTMLElement} container 容器
   * @param {string} state 'loading' | 'empty' | 'error' | 'success'
   * @param {object} opts 同对应组件的 options
   */
  function renderState(container, state, opts) {
    if (!container) return;
    opts = opts || {};
    var html = '';
    switch (state) {
      case 'loading': html = loadingState(opts); break;
      case 'empty':   html = emptyState(opts); break;
      case 'error':   html = errorState(opts); break;
      case 'success':
        // 成功时由业务方渲染数据,清空容器
        container.innerHTML = '';
        return;
      default: container.innerHTML = ''; return;
    }
    container.innerHTML = html;
  }

  // ── 自动接管：fetch 包装函数 ──────────────────────────────
  /**
   * 三态 fetch 调用
   * @param {HTMLElement} container
   * @param {string} url
   * @param {object} options 透传给 apiCall
   * @param {object} emptyOpts 空态配置
   * @returns {Promise<any>}
   */
  async function fetchWithStates(container, url, options, emptyOpts) {
    renderState(container, 'loading', { text: '正在加载…' });
    try {
      const result = await global.apiClient.apiCall(url, options);
      if (result.ok) {
        const data = result.data;
        if (data === null || data === undefined ||
            (Array.isArray(data) && data.length === 0) ||
            (typeof data === 'object' && Array.isArray(data.list) && data.list.length === 0)) {
          renderState(container, 'empty', emptyOpts || { icon: '📋', title: '暂无数据', hint: '' });
          return data;
        }
        renderState(container, 'success');
        return data;
      } else {
        renderState(container, 'error', {
          code: result.code,
          message: result.message || '加载失败',
          retryCallback: 'window.uiStates.fetchWithStates(this.closest(\'.ui-state\').parentElement, ' + JSON.stringify(url) + ', ' + JSON.stringify(options) + ', ' + JSON.stringify(emptyOpts || {}) + ')'
        });
        return null;
      }
    } catch (e) {
      renderState(container, 'error', {
        code: 'EXCEPTION',
        message: String(e.message || e),
        retryCallback: 'location.reload()'
      });
      return null;
    }
  }

  // R741 修真——字段级实时校验自动绑定（零侵入）
  // 页面加载后扫描所有 [data-validate] 字段, 绑定 blur/input 实时校验
  // 不拦截任何提交逻辑, 只做可视化提示; 页面可调用 validateInputs() 做提交拦截
  function autoBindFieldValidation() {
    if (global.__fieldValidationBound) return true;
    var bind = function () {
      if (global.__fieldValidationBound) return;
      global.__fieldValidationBound = true;
      var els = document.querySelectorAll('[data-validate]');
      els.forEach(function (el) {
        if (el.__validateBound) return;
        el.__validateBound = true;
        var showTip = function () {
          // R743 修真——隐藏容器内的字段不显示校验提示
          var _p = el.parentElement;
          var _hidden = false;
          while (_p) {
            try {
              if (_p.hasAttribute && _p.hasAttribute('hidden')) { _hidden = true; break; }
              if (_p.style && _p.style.display === 'none') { _hidden = true; break; }
              var _cs = window.getComputedStyle ? window.getComputedStyle(_p) : null;
              if (_cs && (_cs.display === 'none' || _cs.visibility === 'hidden')) { _hidden = true; break; }
            } catch (_e) {}
            _p = _p.parentElement;
          }
          if (_hidden) { el.classList.remove('is-invalid'); return; }
          var rules = (el.getAttribute('data-validate') || '').split('|');
          var value = (el.value || '').trim();
          var label = el.getAttribute('data-label') || el.placeholder || el.name || el.id || '此项';
          var tip = el.parentElement ? el.parentElement.querySelector('.validate-tip') : null;
          if (!tip) {
            tip = document.createElement('div');
            tip.className = 'validate-tip';
            tip.style.cssText = 'font-size:11px;color:#dc2626;margin-top:2px;min-height:14px;';
            if (el.parentElement) el.parentElement.appendChild(tip);
          }
          var msg = '';
          var isRequired = rules.indexOf('required') >= 0;
          if (isRequired && !value) msg = label + '为必填项';
          else if (rules.indexOf('phone') >= 0 && value && !/^1[3-9]\d{9}$/.test(value)) msg = label + '格式不正确';
          else if (rules.indexOf('email') >= 0 && value && !/^[\w.-]+@[\w.-]+\.\w+$/.test(value)) msg = label + '格式不正确';
          else if (rules.indexOf('idcard') >= 0 && value && !/^\d{17}[\dXx]$/.test(value)) msg = label + '格式不正确';
          else if (rules.indexOf('number') >= 0 && value && isNaN(Number(value))) msg = label + '需为数字';
          else {
            rules.forEach(function (rule) {
              var m = rule.match(/^min=(\d+)$/);
              if (m && value && value.length < parseInt(m[1], 10)) msg = label + '至少 ' + m[1] + ' 个字符';
              m = rule.match(/^max=(\d+)$/);
              if (m && value && value.length > parseInt(m[1], 10)) msg = label + '最多 ' + m[1] + ' 个字符';
            });
          }
          tip.textContent = msg;
          el.classList.toggle('is-invalid', !!msg);
        };
        el.addEventListener('blur', showTip);
        el.addEventListener('input', function () {
          // input 时若已有错误提示则实时刷新, 否则不动
          if (el.classList.contains('is-invalid')) showTip();
        });
      });
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bind, { once: true });
      // 兜底：150ms 后仍未绑定则立即绑定（jsdom/延迟脚本等异常场景）
      setTimeout(function () { if (!global.__fieldValidationBound) bind(); }, 150);
    } else {
      bind();
    }
    return true;
  }
  /**
   * 自动校验带 data-validate 的表单
   * 标签语法: <input data-validate="required|phone|email|idcard|min=N|max=N" />
   */
  function validateForm(form) {
    if (!form) return { ok: false, errors: ['表单不存在'] };
    var errors = [];
    var inputs = form.querySelectorAll('[data-validate]');
    inputs.forEach(function (el) {
      var rules = (el.getAttribute('data-validate') || '').split('|');
      var value = (el.value || '').trim();
      rules.forEach(function (rule) {
        rule = rule.trim();
        if (!rule) return;
        if (rule === 'required' && !value) {
          errors.push({ field: el.name || el.id, message: '此项必填' });
          el.classList.add('is-invalid');
        } else if (rule === 'phone' && value && !/^1[3-9]\d{9}$/.test(value)) {
          errors.push({ field: el.name || el.id, message: '手机号格式不正确' });
          el.classList.add('is-invalid');
        } else if (rule === 'email' && value && !/^[\w.-]+@[\w.-]+\.\w+$/.test(value)) {
          errors.push({ field: el.name || el.id, message: '邮箱格式不正确' });
          el.classList.add('is-invalid');
        } else if (rule === 'idcard' && value && !/^\d{17}[\dXx]$/.test(value)) {
          errors.push({ field: el.name || el.id, message: '身份证号格式不正确' });
          el.classList.add('is-invalid');
        } else if (rule.indexOf('min=') === 0) {
          var minLen = parseInt(rule.slice(4), 10);
          if (value && value.length < minLen) {
            errors.push({ field: el.name || el.id, message: '至少 ' + minLen + ' 个字符' });
            el.classList.add('is-invalid');
          }
        } else if (rule.indexOf('max=') === 0) {
          var maxLen = parseInt(rule.slice(4), 10);
          if (value && value.length > maxLen) {
            errors.push({ field: el.name || el.id, message: '最多 ' + maxLen + ' 个字符' });
            el.classList.add('is-invalid');
          }
        } else {
          el.classList.remove('is-invalid');
        }
      });
    });
    return { ok: errors.length === 0, errors: errors };
  }

  // R741 修真——无 form 容器的独立校验（全站 55 页多数字段不在 <form> 内）
  /**
   * 校验任意容器内的 [data-validate] 字段
   * @param {HTMLElement} root 容器（默认 document）
   * @returns {{ok:boolean, errors:Array}}
   */
  function validateInputs(root) {
    root = root || document;
    var errors = [];
    var els = root.querySelectorAll('[data-validate]');
    els.forEach(function (el) {
      // 跳过隐藏字段（显式 hidden / display:none / 不可见祖先容器内的字段）
      if (el.getAttribute('type') === 'hidden') return;
      if (el.hasAttribute('data-skip-validate')) return;
      if (el.style && el.style.display === 'none') return;
      // R743 修真——跳过不可见祖先容器（用 computedStyle 判断, 弹窗打开时可见则校验）
      var _p = el.parentElement;
      while (_p) {
        try {
          if (_p.getAttribute && _p.getAttribute('hidden') !== null && _p.hasAttribute('hidden')) return;
          if (_p.style && _p.style.display === 'none') return;
          var _cs = window.getComputedStyle ? window.getComputedStyle(_p) : null;
          if (_cs && (_cs.display === 'none' || _cs.visibility === 'hidden')) return;
        } catch (_e) {}
        _p = _p.parentElement;
      }
      var rules = (el.getAttribute('data-validate') || '').split('|');
      var value = (el.value || '').trim();
      var label = el.getAttribute('data-label') || el.placeholder || el.name || el.id || '此项';
      var isRequired = rules.indexOf('required') >= 0;
      // 非必填且为空 → 跳过（只校验必填 + 已填格式）
      if (!isRequired && !value) return;
      rules.forEach(function (rule) {
        rule = rule.trim();
        if (!rule || rule === 'required') return;
        if (rule === 'phone' && value && !/^1[3-9]\d{9}$/.test(value)) {
          errors.push({ field: el.id || el.name, message: label + '手机号格式不正确' });
          el.classList.add('is-invalid');
        } else if (rule === 'email' && value && !/^[\w.-]+@[\w.-]+\.\w+$/.test(value)) {
          errors.push({ field: el.id || el.name, message: label + '邮箱格式不正确' });
          el.classList.add('is-invalid');
        } else if (rule === 'idcard' && value && !/^\d{17}[\dXx]$/.test(value)) {
          errors.push({ field: el.id || el.name, message: label + '身份证号格式不正确' });
          el.classList.add('is-invalid');
        } else if (rule === 'number' && value && isNaN(Number(value))) {
          errors.push({ field: el.id || el.name, message: label + '需为数字' });
          el.classList.add('is-invalid');
        } else if (rule.indexOf('min=') === 0) {
          var minLen = parseInt(rule.slice(4), 10);
          if (value && value.length < minLen) {
            errors.push({ field: el.id || el.name, message: label + '至少 ' + minLen + ' 个字符' });
            el.classList.add('is-invalid');
          }
        } else if (rule.indexOf('max=') === 0) {
          var maxLen = parseInt(rule.slice(4), 10);
          if (value && value.length > maxLen) {
            errors.push({ field: el.id || el.name, message: label + '最多 ' + maxLen + ' 个字符' });
            el.classList.add('is-invalid');
          }
        } else {
          el.classList.remove('is-invalid');
        }
      });
      if (isRequired && !value) {
        errors.push({ field: el.id || el.name, message: label + '为必填项' });
        el.classList.add('is-invalid');
      }
    });
    return { ok: errors.length === 0, errors: errors };
  }

  // R741 修真——错误汇总展示（无 form 场景）
  function showValidationErrors(result, container) {
    if (result.ok) return;
    var box = container || document.getElementById('form-errors');
    if (!box) {
      // 自动创建错误条
      box = document.createElement('div');
      box.id = 'form-errors';
      box.setAttribute('role', 'alert');
      box.style.cssText = 'padding:10px 14px;background:#fef2f2;color:#dc2626;border:1px solid #fecaca;border-radius:6px;font-size:13px;margin:10px 0;';
      var firstInvalid = document.querySelector('.is-invalid');
      if (firstInvalid && firstInvalid.parentElement) {
        firstInvalid.parentElement.insertBefore(box, firstInvalid.parentElement.firstChild);
      } else {
        document.body.insertBefore(box, document.body.firstChild);
      }
    }
    box.innerHTML = '⚠️ ' + result.errors.map(function (e) { return e.message; }).join('；');
  }

  // ── 注入全局样式 ──────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('ui-states-styles')) return;
    var style = document.createElement('style');
    style.id = 'ui-states-styles';
    style.textContent = [
      '.ui-state { padding: 32px 16px; text-align: center; color: #6b7280; }',
      '.ui-state-icon { font-size: 48px; margin-bottom: 12px; }',
      '.ui-state-title { font-size: 16px; font-weight: 600; color: #374151; margin-bottom: 6px; }',
      '.ui-state-hint, .ui-state-message { font-size: 13px; color: #9ca3af; margin-bottom: 8px; }',
      '.ui-state-code { font-size: 11px; color: #d1d5db; margin-bottom: 12px; font-family: monospace; }',
      '.ui-state-spinner { width: 32px; height: 32px; border: 3px solid #e5e7eb; border-top: 3px solid #3b82f6; border-radius: 50%; animation: ui-spin 1s linear infinite; margin: 0 auto 12px; }',
      '.ui-state-loading .ui-state-text { font-size: 13px; color: #6b7280; }',
      '.ui-state-error .ui-state-icon { color: #ef4444; }',
      '.ui-state-error .ui-state-title { color: #dc2626; }',
      '.ui-state-retry { margin-top: 8px; padding: 6px 16px; background: #3b82f6; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; }',
      '.ui-state-retry:hover { background: #2563eb; }',
      '.is-invalid { border-color: #ef4444 !important; background: #fef2f2; }',
      '.is-invalid:focus { outline-color: #ef4444; }',
      '@keyframes ui-spin { to { transform: rotate(360deg); } }',
      '@media (max-width: 640px) {',
      '  .ui-state { padding: 24px 12px; }',
      '  .ui-state-icon { font-size: 36px; }',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  // ── 公开 API ──────────────────────────────────────────────
  global.uiStates = {
    empty: emptyState,
    loading: loadingState,
    error: errorState,
    render: renderState,
    fetchWithStates: fetchWithStates,
    validateForm: validateForm,
    validateInputs: validateInputs,
    showValidationErrors: showValidationErrors,
    autoBindFieldValidation: autoBindFieldValidation,
    injectStyles: injectStyles,
    install: function () {
      injectStyles();
      autoBindFieldValidation();
      // DOM ready 自动注入
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectStyles, { once: true });
        document.addEventListener('DOMContentLoaded', autoBindFieldValidation, { once: true });
      } else {
        injectStyles();
        autoBindFieldValidation();
      }
    }
  };

  // 兼容旧名
  global.UIStates = global.uiStates;

  // 自动挂载
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { global.uiStates.install(); }, { once: true });
  } else {
    global.uiStates.install();
  }

})(typeof window !== 'undefined' ? window : globalThis);
