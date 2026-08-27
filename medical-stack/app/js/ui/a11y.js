/**
 * ═══════════════════════════════════════════════════════════════
 *  TCM-Agent · 无障碍/a11y 辅助库
 *  R733 修真——弹窗焦点陷阱 + 键盘 Esc 关闭 + Tab 顺序
 * ═══════════════════════════════════════════════════════════════
 */

(function (global) {
  'use strict';

  // ── 焦点陷阱：限制 Tab 在弹窗内循环 ────────────────────────
  /**
   * 打开 a11y 模式（弹窗/SOS/确认框）
   * @param {HTMLElement} container 弹窗容器
   * @returns {Function} 关闭函数
   */
  function trapFocus(container) {
    if (!container) return function () {};
    var previouslyFocused = document.activeElement;
    container.setAttribute('aria-modal', 'true');
    container.setAttribute('role', 'dialog');

    var focusableSelectors = [
      'a[href]', 'button:not([disabled])', 'input:not([disabled])', 'select:not([disabled])',
      'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])', '[contenteditable="true"]'
    ].join(',');

    function getFocusable() {
      return Array.prototype.slice.call(container.querySelectorAll(focusableSelectors));
    }

    function onKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      } else if (e.key === 'Tab') {
        var focusable = getFocusable();
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      } else if (e.key === 'Enter') {
        // 提交表单
        var active = document.activeElement;
        if (active && (active.tagName === 'BUTTON' || active.getAttribute('role') === 'button')) {
          // 默认 button Enter 嘴动触发,这里不拦截
        }
      }
    }

    function close() {
      container.removeEventListener('keydown', onKeyDown);
      container.removeAttribute('aria-modal');
      if (previouslyFocused && previouslyFocused.focus) {
        previouslyFocused.focus();
      }
    }

    container.addEventListener('keydown', onKeyDown);
    // 初始聚焦首个可聚焦元素
    setTimeout(function () {
      var focusable = getFocusable();
      if (focusable.length > 0) focusable[0].focus();
    }, 50);

    return close;
  }

  // ── 全局 Esc 监听 + 主区域焦点辅助 ─────────────────────────
  function installGlobalA11y() {
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        // 关闭顶层弹窗
        var modals = document.querySelectorAll('.modal[aria-modal="true"], .dialog[aria-modal="true"]');
        if (modals.length > 0) {
          var top = modals[modals.length - 1];
          var closeBtn = top.querySelector('[data-dismiss="modal"], .close-btn, .btn-close');
          if (closeBtn) closeBtn.click();
        }
      }
    });

    // skip-link 跳转
    var skipLink = document.querySelector('.skip-link');
    if (skipLink) {
      skipLink.addEventListener('click', function (e) {
        e.preventDefault();
        var target = document.querySelector(skipLink.getAttribute('href'));
        if (target) {
          target.setAttribute('tabindex', '-1');
          target.focus();
        }
      });
    }

    // 警告:console 重复输出
    if (global.console && global.console.warn && !global.__a11yInstalled) {
      console.warn('[a11y] 已安装——焦点陷阱 + Esc 关闭 + skip-link');
    }
    global.__a11yInstalled = true;
  }

  // ── 自动跳过隐藏区域的焦点 ────────────────────────────────
  function filterFocusable(root) {
    root = root || document;
    var all = root.querySelectorAll('a, button, input, select, textarea, [tabindex]');
    all.forEach(function (el) {
      if (el.offsetParent === null || el.getAttribute('aria-hidden') === 'true') {
        el.setAttribute('tabindex', '-1');
      }
    });
  }

  // ── 公开 API ──────────────────────────────────────────────
  global.a11y = {
    trapFocus: trapFocus,
    install: installGlobalA11y,
    filterFocusable: filterFocusable
  };

  // DOM ready 自动安装
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installGlobalA11y, { once: true });
  } else {
    installGlobalA11y();
  }

})(typeof window !== 'undefined' ? window : globalThis);
