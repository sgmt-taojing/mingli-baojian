/**
 * PWA 注册脚本（注入到所有 HTML）
 * - 注册 service worker
 * - 检测安装事件
 * - 移动端触屏优化标识
 */
(function(){
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', function(){
    navigator.serviceWorker.register('/service-worker.js')
      .then(function(reg){
        console.info('[PWA] ServiceWorker registered:', reg.scope);
        // 检测更新
        reg.addEventListener('updatefound', function(){
          var sw = reg.installing;
          sw.addEventListener('statechange', function(){
            if (sw.state === 'installed' && navigator.serviceWorker.controller) {
              // 新版本可用，提示用户
              if (window.showToast) window.showToast('新版本可用，刷新页面即可体验', 'info');
            }
          });
        });
      })
      .catch(function(err){
        /* 静默处理 SW 注册失败 */
      });

    // 安装到桌面提示
    var deferred = null;
    window.addEventListener('beforeinstallprompt', function(e){
      e.preventDefault();
      deferred = e;
      // 显示浮动按钮
      var btn = document.createElement('div');
      btn.id = 'pwa-install-btn';
      btn.innerHTML = '📱 安装到桌面';
      btn.style.cssText = 'position:fixed;bottom:80px;right:16px;background:#d4af37;color:#0f1419;padding:10px 16px;border-radius:24px;font-weight:600;cursor:pointer;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.3);font-size:14px;';
      btn.onclick = function(){
        deferred.prompt();
        deferred.userChoice.then(function(r){
          if (r.outcome === 'accepted') {
            btn.remove();
          }
        });
      };
      document.body.appendChild(btn);
    });
  });

  // 触屏能力检测（用于差异化交互）
  window.isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

  // 安全区适配（iPhone 刘海/底部 home bar）
  if (window.isTouchDevice) {
    document.documentElement.style.setProperty('--sat', 'env(safe-area-inset-top)');
    document.documentElement.style.setProperty('--sab', 'env(safe-area-inset-bottom)');
    document.body.style.paddingTop = 'var(--sat, 0)';
    document.body.style.paddingBottom = 'var(--sab, 0)';
  }
})();
