// 命理宝鉴 · divination-hub 交互元素 ARIA 增强（#9 a11y 节点 9.3）
// 策略：CSS 层 pointer-events + JS 委托 + role/tabindex/aria-pressed 动态注入
// 不改 onclick 也不重写 DOM 字符串拼接，仅做体验层修补

(function () {
  'use strict';

  function enhanceInteractive(root) {
    if (!root || !root.querySelectorAll) return 0;
    var nodes = root.querySelectorAll('[onclick]');
    var count = 0;
    nodes.forEach(function (el) {
      // 跳过已经是 <button>/<a>/<input> 的元素
      var tag = el.tagName;
      if (tag === 'BUTTON' || tag === 'A' || tag === 'INPUT') return;

      // 1. 添加 role
      if (!el.getAttribute('role')) {
        el.setAttribute('role', 'button');
      }

      // 2. 添加 tabindex
      if (!el.getAttribute('tabindex')) {
        el.setAttribute('tabindex', '0');
      }

      // 3. 键盘事件委托：Enter / Space 触发 onclick
      if (!el.dataset.a11yBound) {
        el.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            el.click();
          }
        });
        el.dataset.a11yBound = '1';
        count++;
      }
    });
    return count;
  }

  // 等到 DOM 字符串拼接完成
  function run() {
    var total = 0;
    // divination-hub 主容器
    var hub = document.getElementById('divinationHub') || document.body;
    total += enhanceInteractive(hub);
    // 全局兜底（包括动态插入的卡片）
    document.querySelectorAll('[id^="daily-knowledge-card"], [id^="profileEntry"], [class*="cat-card"]').forEach(function (el) {
      if (!el.getAttribute('role')) el.setAttribute('role', 'button');
      if (!el.getAttribute('tabindex')) el.setAttribute('tabindex', '0');
    });

    console.log('[a11y] divination-hub 增强完成：' + total + ' 个交互元素已绑键盘');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

  // MutationObserver 兜底：动态插入的 div+onclick 也补上
  if (typeof MutationObserver !== 'undefined') {
    var mo = new MutationObserver(function (mutations) {
      var added = 0;
      mutations.forEach(function (m) {
        m.addedNodes.forEach(function (n) {
          if (n.nodeType !== 1) return;
          if (n.matches && n.matches('[onclick]') && !n.dataset.a11yBound) {
            n.setAttribute('role', n.getAttribute('role') || 'button');
            n.setAttribute('tabindex', n.getAttribute('tabindex') || '0');
            n.addEventListener('keydown', function (e) {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                n.click();
              }
            });
            n.dataset.a11yBound = '1';
            added++;
          }
          // 子节点也扫一遍
          if (n.querySelectorAll) {
            added += enhanceInteractive(n);
          }
        });
      });
      if (added > 0) {
        console.log('[a11y] MutationObserver 新增增强：' + added + ' 个');
      }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }
})();