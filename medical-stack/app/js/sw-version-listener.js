/**
 * ═══════════════════════════════════════════════════════════════
 *  TCM-Agent · SW 版本广播监听器
 *  R738 修真——订阅 SW_VERSION 消息，提示用户一键升级
 * ═══════════════════════════════════════════════════════════════
 */
(function (global) {
  'use strict';

  var LS_KEY = '_sw_known_version';
  var STORAGE_VERSION_KEY = '_tcm_sw_version';

  function showUpgradeBar(newVersion) {
    var bar = document.createElement('div');
    bar.setAttribute('role', 'alert');
    bar.setAttribute('aria-live', 'polite');
    bar.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'right:0', 'z-index:99999',
      'padding:10px 16px', 'background:#3b82f6', 'color:#fff',
      'display:flex', 'justify-content:space-between', 'align-items:center',
      'box-shadow:0 2px 8px rgba(0,0,0,0.15)', 'font-size:13px',
      'font-family:-apple-system,BlinkMacSystemFont,sans-serif'
    ].join(';');
    bar.innerHTML = [
      '<span>🔄 发现新版本 ' + newVersion + '，建议刷新页面</span>',
      '<button id="sw-reload-btn" style="background:#fff;color:#3b82f6;border:none;padding:6px 14px;border-radius:4px;cursor:pointer;font-weight:600">立即刷新</button>',
      '<button id="sw-dismiss-btn" style="background:transparent;color:#fff;border:1px solid rgba(255,255,255,0.4);padding:6px 10px;border-radius:4px;cursor:pointer;margin-left:6px">稍后</button>'
    ].join('');
    document.body.appendChild(bar);

    var btn = document.getElementById('sw-reload-btn');
    var dismiss = document.getElementById('sw-dismiss-btn');
    if (btn) btn.addEventListener('click', function () {
      try { localStorage.setItem(STORAGE_VERSION_KEY, newVersion); } catch (_) {}
      location.reload();
    });
    if (dismiss) dismiss.addEventListener('click', function () {
      bar.remove();
      try { localStorage.setItem(STORAGE_VERSION_KEY, newVersion); } catch (_) {}
    });
  }

  function handleMessage(event) {
    var data = event.data || {};
    if (data.type !== 'SW_VERSION') return;
    var version = data.version || '';
    if (!version) return;
    var known = '';
    try { known = localStorage.getItem(LS_KEY) || ''; } catch (_) {}
    if (known === version) return;
    try { localStorage.setItem(LS_KEY, version); } catch (_) {}
    // 延迟 1.5s 弹出，避免首屏抖动
    setTimeout(function () { showUpgradeBar(version); }, 1500);
  }

  function install() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.addEventListener('message', handleMessage);
    // 主动注册 SW（容错：已注册则跳过）
    navigator.serviceWorker.getRegistration().then(function (reg) {
      if (!reg) {
        navigator.serviceWorker.register('/service-worker.js').catch(function () {});
      }
    });
    // 首次安装控制台提示
    if (global.console && global.console.warn && !global.__swListenerInstalled) {
      console.warn('[sw-version-listener] 已安装——订阅 SW_VERSION 广播');
    }
    global.__swListenerInstalled = true;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, { once: true });
  } else {
    install();
  }
})(typeof window !== 'undefined' ? window : globalThis);