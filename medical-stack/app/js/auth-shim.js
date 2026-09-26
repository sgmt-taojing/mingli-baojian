/* auth-shim.js — 须在页面内联脚本之前加载
 * 走查抓获修复（2026-09-26）：页面裸 fetch('/api/...') 自动附带院内令牌。
 * 仅当 ①本地有 tcm_token ②目标为本机 /api/ ③调用方未自带 Authorization 时附加；
 * 患者端无 token 或外部 CDN 请求完全不受影响。幂等防重复包装。
 */
(function (global) {
  if (global.__tcmAuthShimInstalled) return;
  global.__tcmAuthShimInstalled = true;
  const _origFetch = global.fetch.bind(global);
  global.fetch = function (url, opts) {
    try {
      const token = localStorage.getItem('tcm_token');
      if (token) {
        const u = new URL(typeof url === 'string' ? url : url.url, location.origin);
        const isLocalApi = /^https?:$/.test(u.protocol) && /^(127\.0\.0\.1|localhost)$/.test(u.hostname) && u.pathname.startsWith('/api/');
        if (isLocalApi) {
          opts = opts || {};
          const h = new Headers(opts.headers || {});
          if (!h.has('Authorization')) h.set('Authorization', 'Bearer ' + token);
          opts.headers = h;
        }
      }
    } catch (e) { /* 任何异常回退原样请求 */ }
    return _origFetch(url, opts);
  };
})(typeof window !== 'undefined' ? window : globalThis);
