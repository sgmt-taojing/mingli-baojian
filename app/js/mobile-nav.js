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
      '.mbn-icon{width:22px;height:22px;display:block}.mbn-icon svg{width:100%;height:100%;display:block}';
    document.head.appendChild(st);
  }
  // R747: divination-hub 已是跳转页，不再特殊排除

  // R747: 导航项重构——面向大众的高频功能（去掉运维项，首页指向大厅）
  // R748: emoji → 统一线性 SVG 图标（stroke=currentColor，视觉口径一致，不依赖系统 emoji 字体）
  var IC = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/></svg>',
    voice: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12z"/></svg>',
    paipan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 3a4.5 4.5 0 0 1 0 9 4.5 4.5 0 0 0 0 9"/><circle cx="12" cy="7.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="12" cy="16.5" r="1.1" fill="currentColor" stroke="none"/></svg>',
    assistant: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="7" width="16" height="12" rx="3"/><path d="M12 7V3.5"/><circle cx="9" cy="12.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="15" cy="12.5" r="1.1" fill="currentColor" stroke="none"/><path d="M9.5 16h5"/></svg>',
    huangli: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="16" rx="2.5"/><path d="M3.5 9.5h17"/><path d="M8 3v4M16 3v4"/><path d="M8 14h3M8 17h6"/></svg>',
    mine: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4.5 21c1.5-4 4.5-6 7.5-6s6 2 7.5 6"/></svg>'
  };
  var ITEMS = [
    { href: 'index.html', icon: IC.home, label: '首页', key: 'home' },
    { href: 'voice-portal.html', icon: IC.voice, label: '直达', key: 'voice' },
    { href: 'paipan-quick.html', icon: IC.paipan, label: '命理', key: 'paipan' },
    { href: 'ai-assistant.html', icon: IC.assistant, label: '助手', key: 'assistant' },
    { href: 'huangli-daily.html', icon: IC.huangli, label: '黄历', key: 'huangli' },
    { href: 'patient-journey.html', icon: IC.mine, label: '我的', key: 'mine' }
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