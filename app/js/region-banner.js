/**
 * region-banner.js — R705: 海外合规横幅公共组件
 *
 * 用法：<script src="/js/region-banner.js" defer></script>
 * 自动检测 mbj_region，非 cn 地区在顶部显示合规免责横幅
 * 依赖：region-config.js（提供 RegionConfig.REGION_CONFIG）
 */
(function () {
  'use strict';

  function init() {
    try {
      var region = localStorage.getItem('mbj_region');
      if (!region || region === 'cn') return;

      // 已存在则跳过
      if (document.getElementById('region-compliance-banner')) return;

      var cfg = (window.RegionConfig && window.RegionConfig.REGION_CONFIG &&
                 window.RegionConfig.REGION_CONFIG[region]) || null;

      var banner = document.createElement('div');
      banner.id = 'region-compliance-banner';
      banner.style.cssText =
        'position:fixed;top:0;left:0;right:0;z-index:99999;' +
        'background:#1a1a2e;color:#e8dcc0;font-size:12px;' +
        'padding:8px 40px;text-align:center;' +
        'font-family:ui-serif,serif;letter-spacing:0.3px';

      var text = (cfg && cfg.disclaimer && cfg.disclaimer.text) ||
        'Content provided for cultural education and entertainment reference only.';
      banner.textContent = text;

      document.body.appendChild(banner);

      // 顶栏下移
      var phb = document.querySelector('.page-header-bar');
      if (phb) phb.style.marginTop = '34px';
    } catch (_) {}
  }

  if (document.body) init();
  else document.addEventListener('DOMContentLoaded', init);
})();
