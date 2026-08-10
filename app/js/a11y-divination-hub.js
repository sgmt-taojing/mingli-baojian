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

      // 跳过 <ml-tap> 自定义元素（已由 connectedCallback 处理 a11y）
      if (tag === 'ML-TAP') return;

      // 跳过嵌套子交互元素 (.cc-action 在 .cat-card 内)
      if (el.closest && el.closest('[role="button"]')) return;

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
    // 容器型 cat-card 用 role=presentation 避免 nested-interactive（实际交互在子 .cc-action 上）
    document.querySelectorAll('[id^="daily-knowledge-card"], [class*="cat-card"]').forEach(function (el) {
      if (!el.getAttribute('role')) el.setAttribute('role', 'presentation');
      if (!el.getAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    });
    // profileEntry 是独立可点击项（非容器），保留 button 语义
    document.querySelectorAll('[id^="profileEntry"]').forEach(function (el) {
      if (!el.getAttribute('role')) el.setAttribute('role', 'button');
      if (!el.getAttribute('tabindex')) el.setAttribute('tabindex', '0');
    });

    // voiceSelector aria-label 兜底（voice-interaction.js setAttribute 可能被异常中断）
    var vs = document.getElementById('voiceSelector');
    if (vs && !vs.getAttribute('aria-label')) {
      vs.setAttribute('aria-label', '语音声线选择');
    }

    console.warn('[a11y] divination-hub 增强完成：' + total + ' 个交互元素已绑键盘');
  }

  // 延迟再补一次（voice-interaction.js 可能在 run() 之后才注入）
  setTimeout(function () {
    var vs = document.getElementById('voiceSelector');
    if (vs && !vs.getAttribute('aria-label')) {
      vs.setAttribute('aria-label', '语音声线选择');
    }
  }, 3000);

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
        console.warn('[a11y] MutationObserver 新增增强：' + added + ' 个');
      }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }
})();