/* ===== R89-P2 沉浸模式开关 ===== */
(function () {
  'use strict';
  let _active = false;
  function toggle() {
    const overlay = document.getElementById('immersiveOverlay');
    if (!overlay) return;
    _active = !_active;
    if (_active) {
      overlay.classList.add('active');
      overlay.setAttribute('aria-hidden', 'false');
      // 持久化
      try { localStorage.setItem('_r89_immersive_active', '1'); } catch (e) {}
    } else {
      overlay.classList.remove('active');
      overlay.setAttribute('aria-hidden', 'true');
      try { localStorage.removeItem('_r89_immersive_active'); } catch (e) {}
    }
  }
  // 暴露到全局，方便 onclick 调用
  window.toggleImmersive = toggle;
  // 启动：若之前开启过，自动恢复（用户体验连贯）
  document.addEventListener('DOMContentLoaded', function () {
    if (window.location.hash === '#immersive') {
      setTimeout(toggle, 80);
    }
  });
  // ESC 退出
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && _active) toggle();
  });
})();
