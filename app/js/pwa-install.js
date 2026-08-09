// pwa-install.js
// R645: PWA 安装引导
// 功能：检测 beforeinstallprompt，显示安装按钮
(function(global){
  let deferredPrompt = null;
  let installBtn = null;
  
  function showInstallPrompt() {
    if (!deferredPrompt) return;
    
    // 创建安装提示条
    installBtn = document.createElement('div');
    installBtn.id = 'pwa-install-banner';
    installBtn.innerHTML = '\
      <div style="position:fixed;bottom:20px;left:50%;transform:translateX(-50%);\
           background:linear-gradient(135deg,#1a1a2e,#16213e);\
           border:1px solid rgba(201,168,76,.3);\
           border-radius:16px;padding:14px 24px;\
           display:flex;align-items:center;gap:12px;\
           box-shadow:0 8px 32px rgba(0,0,0,.4);\
           z-index:99999;font-family:system-ui">\
        <span style="font-size:28px">📱</span>\
        <div>\
          <div style="color:var(--gold);font-weight:600;font-size:14px">安装易道智鉴</div>\
          <div style="color:var(--text-dim);font-size:12px">添加到主屏幕，离线可用</div>\
        </div>\
        <button id="pwa-install-btn" style="\
           background:linear-gradient(135deg,#c9a84c,#b8941f);\
           color:#050608;border:none;border-radius:20px;\
           padding:8px 18px;font-weight:600;cursor:pointer;font-size:13px">\
          安装\
        </button>\
        <button id="pwa-install-close" style="\
           background:transparent;color:var(--text-dim);\
           border:none;font-size:18px;cursor:pointer;padding:4px 8px">✕</button>\
      </div>';
    
    document.body.appendChild(installBtn);
    
    // 安装按钮
    document.getElementById('pwa-install-btn').addEventListener('click', async () => {
      deferredPrompt.preventDefault();
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('[PWA] install outcome:', outcome);
      dismissBanner();
    });
    
    // 关闭按钮
    document.getElementById('pwa-install-close').addEventListener('click', dismissBanner);
    
    // 5 秒后自动隐藏
    setTimeout(dismissBanner, 8000);
  }
  
  function dismissBanner() {
    if (installBtn && installBtn.parentNode) {
      installBtn.parentNode.removeChild(installBtn);
    }
    installBtn = null;
  }
  
  // 监听安装提示
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    // 延迟显示，等页面加载完成
    setTimeout(showInstallPrompt, 3000);
  });
  
  // 监听安装完成
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    dismissBanner();
    console.log('[PWA] app installed');
  });
  
  // 导出 API
  global.PWAInstall = {
    showPrompt: showInstallPrompt,
    dismissBanner: dismissBanner,
    isAvailable: () => !!deferredPrompt
  };
  
  console.info('[pwa-install] ready');
})(typeof window !== 'undefined' ? window : globalThis);
