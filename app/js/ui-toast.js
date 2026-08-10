/**
 * ui-toast.js — 全局 Toast / Notification 组件
 * 统一入口：兼容 toast-helper.js 的 showToast / showConfirm
 * 也提供别名 toast() 供旧代码使用
 */
(function() {
  'use strict';

  // 如果 toast-helper.js 已加载，直接 return
  if (typeof window.showToast === 'function' && typeof window.showConfirm === 'function') {
    // 提供别名
    if (!window.toast) window.toast = window.showToast;
    return;
  }

  // 自带实现（当 toast-helper.js 未加载时）
  window.showToast = function(msg, type) {
    type = type || 'info';
    var t = document.getElementById('toastMsg');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toastMsg';
      t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);padding:10px 24px;border-radius:8px;font-size:14px;z-index:99999;opacity:0;transition:opacity .3s;pointer-events:none;max-width:90%;text-align:center';
      document.body.appendChild(t);
    }
    var bg = type === 'success' ? '#2d7d2d' : type === 'error' ? '#c0392b' : type === 'warning' ? '#d4a017' : '#333';
    var fg = '#fff';
    t.textContent = msg;
    t.style.background = bg;
    t.style.color = fg;
    t.style.opacity = '1';
    clearTimeout(t._tid);
    t._tid = setTimeout(function() {
      t.style.opacity = '0';
    }, 2500);
  };

  window.showConfirm = function(msg, onOk, onCancel) {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:99999;display:flex;align-items:center;justify-content:center';
    overlay.innerHTML = '<div style="background:#1a1e14;border:1px solid rgba(201,168,76,0.4);border-radius:12px;padding:24px;max-width:360px;width:90%;box-shadow:0 8px 32px rgba(0,0,0,0.5)">' +
      '<div style="color:#e8e0d0;font-size:15px;line-height:1.7;margin-bottom:20px;letter-spacing:1px">' + msg + '</div>' +
      '<div style="display:flex;gap:12px;justify-content:flex-end">' +
      '<button data-act="cancel" style="padding:8px 20px;background:transparent;color:#a09080;border:1px solid #5a5048;border-radius:6px;cursor:pointer;font-size:13px">取消</button>' +
      '<button data-act="ok" style="padding:8px 20px;background:linear-gradient(135deg,#c9a84c,#c0584c);color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;letter-spacing:1px">确认</button>' +
      '</div></div>';
    document.body.appendChild(overlay);
    function close(result) {
      document.body.removeChild(overlay);
      if (result && typeof onOk === 'function') onOk();
      else if (!result && typeof onCancel === 'function') onCancel();
    }
    overlay.querySelector('[data-act="ok"]').onclick = function() { close(true); };
    overlay.querySelector('[data-act="cancel"]').onclick = function() { close(false); };
    overlay.onclick = function(e) { if (e.target === overlay) close(false); };
  };

  // 别名
  if (!window.toast) window.toast = window.showToast;
})();
