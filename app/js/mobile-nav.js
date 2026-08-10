/* R84: mobile bottom navigation
 * auto-mount on page load if NOT divination-hub (it has its own bottom-nav)
 * detects current page from window.location.pathname
 * hides on desktop (>= 768px) via CSS media query
 */
(function () {
  'use strict';
  if (window.location.pathname.indexOf('divination-hub') !== -1) return;

  var ITEMS = [
    { href: 'divination-hub.html', icon: '🏠', label: '首页', key: 'hub' },
    { href: 'paipan-center.html', icon: '🌀', label: '排盘', key: 'paipan' },
    { href: 'ai-assistant.html', icon: '🤖', label: '智能助手', key: 'assistant' },
    { href: 'kb-hot.html', icon: '🔥', label: 'KB热词', key: 'kb-hot' },
    { href: 'kb-quality.html', icon: '⭐', label: 'KB质量', key: 'kb-quality' },
    { href: 'daily-summary.html', icon: '📊', label: '今日完成', key: 'daily' },
    { href: 'ai-engine-config.html', icon: '⚙️', label: '引擎配置', key: 'engine' },
    { href: 'kb-graph.html', icon: '🕸️', label: '图谱', key: 'kb-graph' },
    { href: 'lifeplan-detail.html', icon: '🧭', label: '人生规划', key: 'lifeplan' },
    { href: 'qimen-chart.html', icon: '🧭', label: '奇门排盘', key: 'qimen-chart' },
    { href: 'camera-capture.html', icon: '📸', label: '拍照', key: 'camera' },
    { href: 'vision-demo.html', icon: '👁️', label: '视野', key: 'vision' }
  ];

  var path = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var html = '<nav class="mobile-bottom-nav" aria-label="底部主导航">' +
    ITEMS.map(function (it) {
      var active = (path === it.href.toLowerCase()) ? ' active' : '';
      return '<a class="mbn-item' + active + '" href="' + it.href + '" aria-label="' + it.label + '">' +
        '<span class="mbn-icon">' + it.icon + '</span>' +
        '<span class="mbn-label">' + it.label + '</span>' +
      '</a>';
    }).join('') +
  '</nav>';

  // mount before </body>
  if (document.body) {
    document.body.insertAdjacentHTML('beforeend', html);
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      document.body.insertAdjacentHTML('beforeend', html);
    });
  }
})();