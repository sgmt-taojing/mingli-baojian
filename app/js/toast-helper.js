/**
 * Toast Helper — 轻量级通知组件
 * 用法: showToast('消息内容') / showToast('消息', 'success')
 *        showConfirm('确认?', onOk, onCancel)
 */
(function() {
  if (typeof window.showToast === 'function') return;
  window.showToast = function(msg, type) {
    type = type || 'info';
    let t = document.getElementById('toastMsg');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toastMsg';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.className = 'toast-msg toast-' + type + ' show';
    clearTimeout(t._tid);
    t._tid = setTimeout(function() {
      t.classList.remove('show');
    }, 2500);
  };

  // 异步确认模态框（替代原生 confirm）
  window.showConfirm = function(msg, onOk, onCancel) {
    let overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:99999;display:flex;align-items:center;justify-content:center';
    overlay.innerHTML = '<div style="background:#1a1a2e;border:1px solid rgba(201,168,76,0.4);border-radius:12px;padding:24px;max-width:360px;width:90%;box-shadow:0 8px 32px rgba(0,0,0,0.5)">' +
      '<div style="color:#f0e8d8;font-size:15px;line-height:1.7;margin-bottom:20px;letter-spacing:1px">' + msg + '</div>' +
      '<div style="display:flex;gap:12px;justify-content:flex-end">' +
      '<button data-act="cancel" style="padding:8px 20px;background:transparent;color:#888;border:1px solid #555;border-radius:6px;cursor:pointer;font-size:13px">取消</button>' +
      '<button data-act="ok" style="padding:8px 20px;background:linear-gradient(135deg,#c9a84c,#a08430);color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;letter-spacing:1px">确认</button>' +
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
})();