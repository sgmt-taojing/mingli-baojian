/**
 * <ml-tap> · Web Component v1 (a11y 假按钮替代方案)
 *
 * 解决问题：477 个 <div onclick="..."> 假按钮 → 真正的 button-like 元素
 *
 * USAGE EXAMPLE
 * ━━━━━━━━━━━━
 *   // 旧（假按钮，无键盘可达性、无 ARIA、SEO 不识别）
 *   <div onclick="showSection('bazi')">开始使用 →</div>
 *
 *   // 新（真按钮，键盘可达 + ARIA + focus + role="button"）
 *   <ml-tap onclick="showSection('bazi')" role="button" tabindex="0">开始使用 →</ml-tap>
 *
 *   // 高级（自动收集 stats）
 *   const t = document.querySelector('ml-tap');
 *   t.addEventListener('tap', (e) => console.warn('tapped', e.detail));
 *
 * ATTRIBUTES
 * ━━━━━━━━━━
 *   onclick      : string — 点击时执行的 JS 字符串（向后兼容旧代码）
 *   role         : 'button' | 'link' | 'menuitem'（默认 button）
 *   tabindex     : string — 默认为 0（可键盘 focus）
 *   disabled     : 'true' | 'false'
 *   variant      : 'default' | 'card' | 'tile' | 'ghost' — 视觉样式
 *   aria-label   : string — 无障碍标签
 *   href         : string — 当 role='link' 时模拟跳转
 *
 * EVENTS
 * ━━━━━━
 *   tap · {detail:{source: 'mouse'|'keyboard'|'touch', originalEvent}}
 *
 * KEYBOARD
 * ━━━━━━━━
 *   Enter / Space → 触发 onclick
 *   Escape → blur
 *
 * CSS VARS
 * ━━━━━━━━
 *   --ml-tap-bg       : 背景色（默认 transparent）
 *   --ml-tap-radius   : 圆角（默认 8px）
 *   --ml-tap-padding  : 内边距（默认 0）
 *   --ml-tap-focus    : focus outline 色
 *
 * A11Y 优势
 * ━━━━━━━
 *   1. role=button + tabindex=0 → 屏幕阅读器识别为可交互元素
 *   2. Enter/Space 键盘触发 → 无鼠标用户可用
 *   3. focus-visible CSS → 键盘 focus 时显示 outline
 *   4. 自动 aria-pressed toggle（按下态）
 *
 * 迁移统计
 * ━━━━━━━
 *   落档日期：2026-07-25
 *   覆盖：app/*.html 477 处 div onclick（13 个文件）
 *   优先级：divination-hub.html（156 处）
 */

(function () {
  'use strict';

  if (customElements.get('ml-tap')) return;

  const TAP_STYLES = `
    :host {
      display: inline-block;
      cursor: pointer;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
      transition: transform 0.15s ease, background 0.2s ease;
      background: var(--ml-tap-bg, transparent);
      border-radius: var(--ml-tap-radius, 8px);
      padding: var(--ml-tap-padding, 0);
    }
    :host([variant="card"]) {
      background: var(--ml-tap-bg, rgba(255,255,255,0.03));
      border: 1px solid var(--ml-border, rgba(255,255,255,0.08));
      border-radius: var(--ml-tap-radius, 10px);
      padding: var(--ml-tap-padding, 14px 18px);
      transition: all 0.3s ease;
    }
    :host([variant="card"]:hover) {
      transform: translateY(-2px);
      border-color: rgba(201,168,76,0.3);
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    }
    :host([variant="tile"]) {
      background: var(--ml-tap-bg, rgba(201,168,76,0.05));
      border: 1px solid rgba(201,168,76,0.2);
      border-radius: var(--ml-tap-radius, 12px);
      padding: var(--ml-tap-padding, 12px 16px);
    }
    :host([variant="ghost"]:hover) {
      background: rgba(255,255,255,0.05);
    }
    :host(:focus-visible) {
      outline: 2px solid var(--ml-tap-focus, var(--ml-primary, #c9a84c));
      outline-offset: 2px;
    }
    :host([disabled="true"]) {
      opacity: 0.5;
      cursor: not-allowed;
      pointer-events: none;
    }
    :host([aria-pressed="true"]) {
      background: rgba(201,168,76,0.15);
    }
  `;

  class MlTap extends HTMLElement {
    static get observedAttributes() {
      return ['onclick', 'role', 'disabled', 'variant', 'aria-label', 'aria-pressed'];
    }

    constructor() {
      super();
      this._onClickHandler = null;
      this._onKeydownHandler = null;
      this._attachListeners();
    }

    connectedCallback() {
      // 默认属性
      // 若内嵌交互元素（role=button / role=link / button / a / tabindex>=0 子节点）
      // 则外层 ml-tap 设为 role=presentation + tabindex=-1，避免 nested-interactive 违规
      const hasInteractiveChild = this._hasInteractiveDescendant();
      if (hasInteractiveChild) {
        if (!this.hasAttribute('role')) this.setAttribute('role', 'presentation');
        if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '-1');
      } else {
        if (!this.hasAttribute('role')) this.setAttribute('role', 'button');
        if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '0');
      }
      // shadow 注入（每个实例一份）
      if (!this.shadowRoot) {
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.innerHTML = '<style>' + TAP_STYLES + '</style><slot></slot>';
      }
    }

    /**
     * 检测是否含有交互型后代元素，避免 nested-interactive WCAG 违规
     */
    _hasInteractiveDescendant() {
      // 只检测 light DOM（shadow 不含用户内容）
      // 包含：原生交互元素 + 已升级的自定义元素 + 通用 [role] 标记
      var interactive = this.querySelectorAll(
        'button, a[href], [role="button"], [role="link"], input, select, textarea, ' +
        '[tabindex]:not([tabindex="-1"]), ' +
        // 自定义元素标签（含连字符）— 可能升级后变成交互元素
        '*[class*="cc-action"], ml-tap, ml-card[role], ml-accordion[role]'
      );
      return interactive.length > 0;
    }

    _attachListeners() {
      this._onClickHandler = (e) => this._handleClick(e, 'mouse');
      this._onKeydownHandler = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this._handleClick(e, 'keyboard');
        } else if (e.key === 'Escape') {
          this.blur();
        }
      };
      this.addEventListener('click', this._onClickHandler);
      this.addEventListener('keydown', this._onKeydownHandler);
    }

    _handleClick(e, source) {
      if (this.getAttribute('disabled') === 'true') return;
      const onclickStr = this.getAttribute('onclick');
      if (onclickStr) {
        try {
          // eslint-disable-next-line no-new-func
          new Function(onclickStr).call(this, e);
        } catch (err) {
          console.error('[ml-tap] onclick 错误:', err, '表达式:', onclickStr);
        }
      }
      const href = this.getAttribute('href');
      if (href && this.getAttribute('role') === 'link') {
        window.location.href = href;
      }
      // toggle aria-pressed for button role
      if (this.getAttribute('role') === 'button' && this.hasAttribute('aria-pressed')) {
        const cur = this.getAttribute('aria-pressed') === 'true';
        this.setAttribute('aria-pressed', String(!cur));
      }
      this.dispatchEvent(new CustomEvent('tap', {
        bubbles: true,
        composed: true,
        detail: { source: source, originalEvent: e },
      }));
    }

    disconnectedCallback() {
      this.removeEventListener('click', this._onClickHandler);
      this.removeEventListener('keydown', this._onKeydownHandler);
    }

    attributeChangedCallback(name, oldVal, newVal) {
      if (name === 'disabled' && newVal === 'true') {
        this.setAttribute('aria-disabled', 'true');
      }
    }

    disable() { this.setAttribute('disabled', 'true'); }
    enable() { this.removeAttribute('disabled'); }
    press() { this._handleClick(new Event('programmatic'), 'program'); }
  }

  customElements.define('ml-tap', MlTap);

  window.MlTap = MlTap;

  // 自动扫描 + 报告
  if (typeof window !== 'undefined' && window.MLBJ_TAP_AUTO_REPORT !== false) {
    setTimeout(function () {
      var allDivs = document.querySelectorAll('div[onclick]');
      var mlTaps = document.querySelectorAll('ml-tap');
      console.warn('[ml-tap] 扫描报告: ' + allDivs.length + ' 个 div[onclick] 假按钮 / ' + mlTaps.length + ' 个 <ml-tap> 真按钮');
      if (window.MLBJ_TAP_STATS) {
        window.MLBJ_TAP_STATS({ divCount: allDivs.length, mlTapCount: mlTaps.length });
      }
    }, 1500);
  }
})();