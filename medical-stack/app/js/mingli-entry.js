/**
 * mingli-entry.js — 患者端「命理宝鉴」合作服务入口卡
 * 用法：页面放 <div data-mingli-entry></div> 并引入本脚本。
 * 链接由 GET /api/public/clinic-links 下发（data/clinic-config.json 的 mingli_portal_url 可配），
 * 端点不可达时回退默认入口 http://localhost:8900/。
 * 边界纪律：命理宝鉴为独立合作服务（另一套体系），卡片明示「命理参考 · 非医学诊断」，
 * 不与任何诊疗内容混排、不出现在病历/处方正文内。
 */
(function () {
  'use strict';
  var FALLBACK_URL = 'http://localhost:8900/';

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function render(url) {
    var safe = esc(url);
    var boxes = document.querySelectorAll('[data-mingli-entry]');
    if (!boxes.length) return;
    var html =
      '<div style="margin:14px 0;padding:14px 16px;border:1px solid #e5d9c5;border-radius:12px;' +
      'background:linear-gradient(135deg,#fdf8ef,#f9f1e3);display:flex;align-items:center;gap:12px;flex-wrap:wrap">' +
      '<div style="font-size:26px;line-height:1">🔮</div>' +
      '<div style="flex:1;min-width:200px">' +
      '<div style="font-weight:600;color:#6b4f2a;font-size:15px">命理宝鉴 · 传统命理咨询<span style="margin-left:8px;font-size:11px;font-weight:400;color:#a08454;border:1px solid #d9c9a8;border-radius:8px;padding:1px 6px">合作服务</span></div>' +
      '<div style="font-size:12px;color:#8a7452;margin-top:4px">八字排盘 · 运势参考 · 择吉问事 —— 由「命理宝鉴」独立提供服务</div>' +
      '<div style="font-size:11px;color:#b09b78;margin-top:3px">命理参考 · 非医学诊断，与本院诊疗行为无关</div>' +
      '</div>' +
      '<a href="' + safe + '" target="_blank" rel="noopener noreferrer" style="text-decoration:none;' +
      'background:#8b6b3d;color:#fff;padding:8px 16px;border-radius:8px;font-size:13px;white-space:nowrap">进入咨询 →</a>' +
      '</div>';
    boxes.forEach(function (b) { b.innerHTML = html; });
  }

  function init() {
    fetch('/api/public/clinic-links')
      .then(function (r) { return r.json(); })
      .then(function (d) { render((d && d.mingli_portal_url) || FALLBACK_URL); })
      .catch(function () { render(FALLBACK_URL); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
