/**
 * Toast Helper — 轻量级通知组件
 * 用法: showToast('消息内容') / showToast('消息', 'success')
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
})();
