/**
 * TCM-Agent PWA 注入脚本（G11 · 模板源自 smart-home-family pwa-standard v1.0）
 * 职责：注册 /sw.js（作用域根）、安装引导条（beforeinstallprompt + iOS 手动引导）、触屏安全区适配
 */
(function () {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js')
      .then(function (reg) {
        console.info('[PWA] ServiceWorker registered:', reg.scope);
        reg.addEventListener('updatefound', function () {
          var sw = reg.installing;
          if (!sw) return;
          sw.addEventListener('statechange', function () {
            if (sw.state === 'installed' && navigator.serviceWorker.controller) {
              showBar('新版本可用，点此刷新', function () {
                sw.postMessage({ type: 'SKIP_WAITING' });
                location.reload();
              });
            }
          });
        });
      })
      .catch(function () { /* SW 注册失败静默降级为普通网页 */ });

    // ── 安装引导条 ──
    var deferred = null;
    var dismissed = false;
    try { dismissed = sessionStorage.getItem('pwa-install-dismissed') === '1'; } catch (e) {}

    function showBar(text, onclick) {
      if (document.getElementById('pwa-install-bar')) return;
      var bar = document.createElement('div');
      bar.id = 'pwa-install-bar';
      bar.style.cssText = 'position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0));background:#6b3a1f;color:#f5f2ed;padding:10px 14px;border-radius:12px;font-size:13px;display:flex;align-items:center;justify-content:space-between;gap:10px;z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,.25)';
      bar.innerHTML = '<span>📱 ' + text + '</span>';
      var acts = document.createElement('span');
      acts.style.cssText = 'display:flex;gap:8px;flex-shrink:0';
      var go = document.createElement('button');
      go.textContent = '好';
      go.style.cssText = 'background:#d4af37;color:#3a2008;border:none;border-radius:8px;padding:5px 14px;font-weight:600;font-size:13px;cursor:pointer';
      go.onclick = function () { bar.remove(); onclick && onclick(); };
      var no = document.createElement('button');
      no.textContent = '不了';
      no.style.cssText = 'background:transparent;color:#d8c9b8;border:1px solid #8a6a52;border-radius:8px;padding:5px 10px;font-size:12px;cursor:pointer';
      no.onclick = function () { bar.remove(); try { sessionStorage.setItem('pwa-install-dismissed', '1'); } catch (e) {} };
      acts.appendChild(go); acts.appendChild(no);
      bar.appendChild(acts);
      document.body.appendChild(bar);
    }

    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      deferred = e;
      if (!dismissed) showBar('安装到桌面，查房审批一键直达', function () {
        deferred.prompt();
        deferred.userChoice.finally(function () { deferred = null; });
      });
    });

    // iOS Safari 无 beforeinstallprompt → 手动引导
    var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    var inStandalone = window.navigator.standalone === true ||
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
    if (isIOS && !inStandalone && !dismissed) {
      showBar('用 Safari「分享 → 添加到主屏幕」安装', null);
    }
  });

  // 触屏安全区适配（刘海/Home bar）
  window.isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  if (window.isTouchDevice) {
    document.documentElement.style.setProperty('--sat', 'env(safe-area-inset-top)');
    document.documentElement.style.setProperty('--sab', 'env(safe-area-inset-bottom)');
  }
})();
