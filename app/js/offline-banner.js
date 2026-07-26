/**
 * 离线模式横幅（R62）
 * - navigator.onLine + 主动 ping 探测双重判断
 * - 顶部插入一行红色 banner「📴 离线模式 · 仅 KB 兜底可用」
 * - 上线时淡出 banner
 * - 通过全局函数 OfflineBanner.isOnline() 让 AI 助手知道当前是否在线
 *   当离线时，callAI 自动跳过 fetch，直接走 KB 快速通道
 */
(function (global) {
  'use strict';

  const PING_URL = '/api/health'; // 后端健康检查（轻量）
  const PING_TIMEOUT_MS = 5000;
  const PING_INTERVAL_MS = 30000;

  let _online = navigator.onLine !== false;
  let _banner = null;
  let _lastPing = 0;
  let _pingInFlight = false;

  function _ensureBanner() {
    if (_banner) return _banner;
    _banner = document.createElement('div');
    _banner.id = 'offlineBanner';
    _banner.setAttribute('role', 'status');
    _banner.setAttribute('aria-live', 'polite');
    _banner.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'right:0', 'z-index:9999',
      'background:linear-gradient(90deg,#dc2626,#b91c1c)',
      'color:#fff', 'padding:8px 12px', 'text-align:center',
      'font-size:13px', 'font-weight:600',
      'box-shadow:0 2px 8px rgba(0,0,0,.3)',
      'transform:translateY(-100%)', 'transition:transform .3s ease',
      'cursor:pointer', 'user-select:none'
    ].join(';');
    _banner.innerHTML = '📴 离线模式 · KB 兜底可用 · AI 调用已暂停（点击重试）';
    _banner.onclick = function () { _checkPing(true); };
    document.body.appendChild(_banner);
    return _banner;
  }

  function _show() {
    const b = _ensureBanner();
    // 强制 reflow 后再 transform 才会触发动画
    b.offsetHeight; // eslint-disable-line no-unused-expressions
    b.style.transform = 'translateY(0)';
  }
  function _hide() {
    if (_banner) _banner.style.transform = 'translateY(-100%)';
  }

  async function _ping() {
    if (_pingInFlight) return _online;
    _pingInFlight = true;
    try {
      const ctrl = new AbortController();
      const t = setTimeout(function () { ctrl.abort(); }, PING_TIMEOUT_MS);
      const r = await fetch(PING_URL + '?_=' + Date.now(), {
        method: 'GET',
        cache: 'no-store',
        signal: ctrl.signal
      });
      clearTimeout(t);
      return r.ok;
    } catch (e) {
      return false;
    } finally {
      _pingInFlight = false;
    }
  }

  async function _checkPing(force) {
    const now = Date.now();
    if (!force && (now - _lastPing) < PING_INTERVAL_MS) return _online;
    _lastPing = now;
    const reachable = await _ping();
    const wasOnline = _online;
    _online = reachable && navigator.onLine !== false;
    if (wasOnline !== _online) {
      if (_online) { _hide(); _toast('🌐 网络已恢复', 'success'); }
      else { _show(); _toast('📴 网络已断开，已切换 KB 兜底', 'warn'); }
    }
    return _online;
  }

  function _toast(msg, type) {
    try {
      if (typeof showToast === 'function') showToast(msg, type);
      else if (typeof toast === 'function') toast(msg);
    } catch (e) { /* 静默 */ }
  }

  // 浏览器事件
  window.addEventListener('online', function () { _checkPing(true); });
  window.addEventListener('offline', function () { _online = false; _show(); });

  // 定期 ping
  setInterval(function () { _checkPing(false); }, PING_INTERVAL_MS);

  // 公开 API
  global.OfflineBanner = {
    /** 是否在线（同步读取最近一次结果） */
    isOnline: function () { return _online; },
    /** 主动检查（返回 Promise<boolean>） */
    refresh: function () { return _checkPing(true); },
    /** 手动隐藏 */
    hide: _hide,
    /** 手动显示 */
    show: _show
  };

  // 首次启动后 1.5s 主动 ping（避开首屏渲染）
  document.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () { _checkPing(true); }, 1500);
  });
})(window);