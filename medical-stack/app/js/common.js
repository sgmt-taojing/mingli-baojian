/**
 * ═══════════════════════════════════════════════════════════════
 *  common.js v1.0 — 全站公共函数收敛库（R748 修真）
 *  目标：消灭 34 处重复 toast、12 处重复 esc
 *  能力：toast / esc / debounce / fmtTime / copyText / openModal
 *
 *  用法：<script src="js/common.js"></script>
 *  所有函数挂 window 全局，旧页面内联同名函数自动被本库覆盖前
 *  需先删掉页面内联实现（由修真脚本批量完成）。
 * ═══════════════════════════════════════════════════════════════
 */
(function (global) {
  'use strict';

  /* ── toast：统一消息提示（3 秒自动消失，可换图标） ── */
  function toast(msg, type) {
    type = type || 'info';
    var icons = { info: '💡', success: '✅', warn: '⚠️', error: '❌' };
    var colors = { info: '#3b82f6', success: '#10b981', warn: '#f59e0b', error: '#ef4444' };
    var t = document.createElement('div');
    t.style.cssText = [
      'position:fixed', 'top:16px', 'left:50%', 'transform:translateX(-50%)',
      'z-index:99999', 'background:' + (colors[type] || colors.info),
      'color:#fff', 'padding:10px 20px', 'border-radius:8px',
      'font-size:14px', 'box-shadow:0 4px 16px rgba(0,0,0,.2)',
      'display:flex', 'align-items:center', 'gap:8px', 'max-width:80vw',
      'font-family:-apple-system,PingFang SC,sans-serif'
    ].join(';');
    t.textContent = (icons[type] || '💡') + ' ' + msg;
    document.body.appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; }, 2500);
    setTimeout(function () { t.remove(); }, 2900);
  }

  /* ── esc：HTML 转义（XSS 防护统一入口） ── */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* ── debounce：防抖（搜索框/输入实时过滤用） ── */
  function debounce(fn, wait) {
    var timer = null;
    return function () {
      var args = arguments, self = this;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(self, args); }, wait || 300);
    };
  }

  /* ── fmtTime：时间格式化 ── */
  function fmtTime(ts) {
    if (!ts) return '';
    var d = new Date(ts);
    var p = function (n) { return String(n).padStart(2, '0'); };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }

  /* ── copyText：复制到剪贴板（带提示） ── */
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast('已复制', 'success'); })
        .catch(function () { fallbackCopy(text); });
    } else {
      fallbackCopy(text);
    }
  }
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); toast('已复制', 'success'); }
    catch (_) { toast('复制失败，请手动复制', 'error'); }
    ta.remove();
  }

  /* ── openModal：统一弹窗（focus 陷阱联动 a11y） ── */
  function openModal(html, title) {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99990;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML =
      '<div style="background:#fff;border-radius:12px;max-width:90vw;max-height:85vh;overflow:auto;padding:20px;min-width:320px;position:relative;">' +
      (title ? '<h3 style="margin:0 0 12px;font-size:16px;">' + esc(title) + '</h3>' : '') +
      '<button style="position:absolute;top:10px;right:10px;border:none;background:#f3f4f6;border-radius:50%;width:28px;height:28px;cursor:pointer;">✕</button>' +
      '<div>' + html + '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    overlay.querySelector('button').addEventListener('click', function () { overlay.remove(); });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });
    // Esc 关闭
    var onKey = function (e) { if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', onKey); } };
    document.addEventListener('keydown', onKey);
    return overlay;
  }

  /* ── confirmModal：Promise 化确认框（R802：内嵌 WebView 不支持原生
     confirm/prompt/alert，静默返回 false/null，工作流被无声阻断） ── */
  function confirmModal(message, opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      var overlay = openModal(
        '<div style="font-size:13px;line-height:1.7;white-space:pre-wrap;margin-bottom:14px">' + esc(message) + '</div>' +
        '<div style="display:flex;gap:8px;justify-content:flex-end">' +
        '<button data-x="no" style="padding:8px 18px;border:1px solid #d1d5db;border-radius:6px;background:#fff;cursor:pointer;font-size:13px">' + esc(opts.cancelText || '取消') + '</button>' +
        '<button data-x="yes" style="padding:8px 18px;border:none;border-radius:6px;background:' + (opts.danger ? '#dc2626' : '#b8860b') + ';color:#fff;cursor:pointer;font-size:13px;font-weight:600">' + esc(opts.okText || '确认') + '</button>' +
        '</div>', opts.title || '请确认');
      overlay.querySelector('[data-x="yes"]').addEventListener('click', function () { overlay.remove(); resolve(true); });
      overlay.querySelector('[data-x="no"]').addEventListener('click', function () { overlay.remove(); resolve(false); });
      overlay.addEventListener('click', function (e) { if (e.target === overlay) resolve(false); });
    });
  }

  /* ── promptModal：Promise 化单输入框（同上，替原生 prompt） ── */
  function promptModal(title, def, ph) {
    return new Promise(function (resolve) {
      var overlay = openModal(
        '<input id="__pm_in" placeholder="' + esc(ph || '') + '" value="' + esc(def || '') + '" ' +
        'style="width:100%;box-sizing:border-box;padding:8px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;margin-bottom:12px">' +
        '<div style="display:flex;gap:8px;justify-content:flex-end">' +
        '<button data-x="no" style="padding:8px 18px;border:1px solid #d1d5db;border-radius:6px;background:#fff;cursor:pointer;font-size:13px">取消</button>' +
        '<button data-x="yes" style="padding:8px 18px;border:none;border-radius:6px;background:#b8860b;color:#fff;cursor:pointer;font-size:13px;font-weight:600">确定</button>' +
        '</div>', title || '请输入');
      var inp = overlay.querySelector('#__pm_in');
      setTimeout(function () { inp.focus(); inp.select(); }, 50);
      overlay.querySelector('[data-x="yes"]').addEventListener('click', function () { var v = inp.value; overlay.remove(); resolve(v); });
      overlay.querySelector('[data-x="no"]').addEventListener('click', function () { overlay.remove(); resolve(null); });
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { var v = inp.value; overlay.remove(); resolve(v); } });
      overlay.addEventListener('click', function (e) { if (e.target === overlay) resolve(null); });
    });
  }

  /* ── 挂载全局（覆盖旧页面重复实现，幂等） ── */
  global.toast = toast;
  global.esc = esc;
  global.debounce = debounce;
  global.fmtTime = fmtTime;
  global.copyText = copyText;
  global.openModal = openModal;
  global.confirmModal = confirmModal;
  global.promptModal = promptModal;

})(typeof window !== 'undefined' ? window : globalThis);
