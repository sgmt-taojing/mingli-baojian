/**
 * interp-version-badge.js — M2（2026-10-18）历史/详情页解读版本标注
 * 入口一致契约：盘面/报告/历史/详情同版本解释。本脚本在历史与详情类页面右下角
 * 注入「解读规范 vX」徽章，版本号实时取自 /api/paipan/glossary（单一事实源），
 * 服务不可达时静默不显示（不误导）。点击徽章可见版本说明。
 */
(function () {
  'use strict';
  var API_BASE = (location.hostname === '127.0.0.1' || location.hostname === 'localhost') ? 'http://127.0.0.1:8920' : '';
  function inject(ver) {
    if (document.getElementById('interp-version-badge')) return;
    var b = document.createElement('div');
    b.id = 'interp-version-badge';
    b.textContent = '解读规范 v' + ver;
    b.title = '本页解读遵循命理宝鉴盘面解读层契约 v' + ver + '（点读五段式 / 报告四档优先级 / 建议六要素）。引擎升级后此处版本号自动更新。';
    b.style.cssText = 'position:fixed;right:10px;bottom:10px;z-index:70;font-size:10px;' +
      'color:#8b7e6a;background:rgba(20,25,40,.85);border:1px solid rgba(201,168,76,.3);' +
      'border-radius:8px;padding:3px 8px;cursor:help;line-height:1.5';
    document.body.appendChild(b);
  }
  function boot() {
    try {
      fetch(API_BASE + '/api/paipan/glossary', { headers: { 'X-Skip-Interceptor': '1' }, signal: AbortSignal.timeout(8000) })
        .then(function (r) { return r.json(); })
        .then(function (g) { if (g && g.ok && g.version) inject(g.version); })
        .catch(function () {});
    } catch (_) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
