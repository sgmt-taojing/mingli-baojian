/**
 * portal-nav.js — 全平台统一导航条
 * 8 门户 + 穿戴设备 + 居家诊疗 = 10 入口
 * 自动注入到页面底部
 */
(function(){
  var nav = document.createElement('nav');
  nav.className = 'mlb-nav';
  nav.innerHTML = [
    '<a href="index.html">🏠 首页</a>',
    '<a href="naming-portal.html">🪪 命名</a>',
    '<a href="tcm-portal.html">🌿 中医</a>',
    '<a href="patient-portal.html">🩺 患者</a>',
    '<a href="home-care.html">🏠 居家</a>',
    '<a href="wearable-hub.html">⌚ 穿戴</a>',
    '<a href="practice-portal.html">🧘 修行</a>',
    '<a href="folklore-portal.html">🎎 民俗</a>',
    '<a href="monitor-portal.html">🛰️ 监控</a>',
  ].join('');
  
  // 在页面加载完成后注入
  function inject(){
    if(document.body){
      document.body.appendChild(nav);
      // 确保页面底部有足够空间
      if(!document.body.style.paddingBottom){
        document.body.style.paddingBottom = '48px';
      }
    } else {
      setTimeout(inject, 100);
    }
  }
  inject();
})();
