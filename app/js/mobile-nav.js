/* R84: mobile bottom navigation
 * auto-mount on page load if NOT divination-hub (it has its own bottom-nav)
 * detects current page from window.location.pathname
 * hides on desktop (>= 768px) via CSS media query
 */
(function () {
  'use strict';
  // R747: 自包含样式注入（不再依赖页面引 css/mobile-nav.css）
  if (!document.getElementById('mobileNavStyle')) {
    var st = document.createElement('style');
    st.id = 'mobileNavStyle';
    st.textContent = '.mobile-bottom-nav{position:fixed;bottom:0;left:0;right:0;display:none;justify-content:space-around;align-items:center;background:rgba(12,12,12,.95);backdrop-filter:blur(12px);border-top:1px solid rgba(201,168,76,.2);padding:6px 4px calc(6px + env(safe-area-inset-bottom));z-index:9999}' +
      '@media(max-width:768px){.mobile-bottom-nav{display:flex}}' +
      '.mbn-item{display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px 10px;text-decoration:none;color:#a09080;font-size:10px;min-width:52px;border-radius:8px;transition:.15s}' +
      '.mbn-item.active{color:#e8cc7a;background:rgba(201,168,76,.1)}' +
      '.mbn-item:hover{color:#e8cc7a}' +
      '.mbn-icon{font-size:20px;line-height:1}';
    document.head.appendChild(st);
  }
  // R747: divination-hub 已是跳转页，不再特殊排除

  // R747: 导航项重构——面向大众的高频功能（去掉运维项，首页指向大厅）
  var ITEMS = [
    { href: 'index.html', icon: '🏠', label: '首页', key: 'home' },
    { href: 'voice-portal.html', icon: '⚡', label: '直达', key: 'voice' },
    { href: 'paipan-quick.html', icon: '☯', label: '命理', key: 'paipan' },
    { href: 'ai-assistant.html', icon: '🤖', label: '助手', key: 'assistant' },
    { href: 'huangli-daily.html', icon: '📅', label: '黄历', key: 'huangli' },
    { href: 'patient-journey.html', icon: '📋', label: '我的', key: 'mine' }
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