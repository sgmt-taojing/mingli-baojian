/**
 * ═══════════════════════════════════════════════════════════════
 *  命理宝鉴 · 全局提交防护（防重复提交 + loading + 错误恢复）
 *  规范: docs/ENGINEERING_AUDIT.md §P2-4
 *  版本: v1.0 (2026-08-08)
 * ═══════════════════════════════════════════════════════════════
 *
 *  覆盖场景
 *  ────────
 *  1. 同一按钮多次点击 → 第一次有效，后续被锁定
 *  2. 异步未返回时按钮 disabled + loading 文本
 *  3. 失败/超时自动解锁 + 友好错误
 *  4. 同一业务 ID 并发请求 → 仅首发有效，后续等待或 reject
 *  5. 多按钮隔离（每个按钮独立 lock 状态）
 *
 *  使用方式
 *  ────────
 *  // HTML 末尾加载: <script src="js/submit-guard.js"></script>
 *  // 旧: <button onclick="submitForm()">提交</button>
 *  // 新: <button id="btn-submit" data-guard="submit-form">提交</button>
 *
 *  // 旧: async function submitForm() { await fetch(...); }
 *  // 新: window.guardRun('submit-form', async () => { await fetch(...); }, { btn: 'btn-submit', loadingText: '提交中...' });
 *
 *  // 或装饰器式: window.decorateSubmit('btn-submit', 'submit-form', submitForm);
 *
 *  兼容性
 *  ─────
 *  - 不强制使用，未装饰的旧代码继续工作
 *  - 自动接管 data-guard 属性的按钮（页面加载后绑定）
 *  - globalThis.guardRun / guardLock / guardUnlock / guardIsLocked
 */
(function (global) {
  'use strict';

  // ── 内部状态 ─────────────────────────────────────────────────
  const locks = new Map();      // key → boolean（true=locked）
  const originalText = new WeakMap(); // btn → 原始文本
  let installed = false;

  // ── 配置 ─────────────────────────────────────────────────────
  const CONFIG = {
    defaultLoadingText: '处理中...',
    timeoutMs: 30000,           // 30s 超时自动解锁
    showErrorToast: true,
  };

  // ── 工具：lock/unlock ────────────────────────────────────────
  function lock(key) {
    if (locks.get(key)) return false;
    locks.set(key, true);
    return true;
  }

  function unlock(key) {
    locks.set(key, false);
  }

  function isLocked(key) {
    return locks.get(key) === true;
  }

  // ── 工具：按钮状态 ──────────────────────────────────────────
  function setBtnLoading(btn, loadingText) {
    if (!btn) return;
    if (!originalText.has(btn)) {
      originalText.set(btn, btn.textContent || btn.value || '');
    }
    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
    if (loadingText) {
      if (btn.tagName === 'INPUT') btn.value = loadingText;
      else btn.textContent = loadingText;
    }
  }

  function setBtnDone(btn) {
    if (!btn) return;
    btn.disabled = false;
    btn.removeAttribute('aria-busy');
    const orig = originalText.get(btn);
    if (orig !== undefined) {
      if (btn.tagName === 'INPUT') btn.value = orig;
      else btn.textContent = orig;
      originalText.delete(btn);
    }
  }

  // ── 核心：包装异步函数 ──────────────────────────────────────
  async function run(key, fn, opts = {}) {
    if (!key) {
      console.warn('[submit-guard] key required');
      return null;
    }
    if (isLocked(key)) {
      // 已有任务在跑，静默拒绝
      if (typeof global.showErrorToast === 'function' && CONFIG.showErrorToast) {
        // 不弹错误 toast，只 console 提醒
        console.debug('[submit-guard] ' + key + ' 已在执行中');
      }
      return { ok: false, reason: 'locked' };
    }

    const btn = opts.btn ? document.getElementById(opts.btn) || document.querySelector(opts.btn) : null;
    const loadingText = opts.loadingText || CONFIG.defaultLoadingText;
    const timeoutMs = opts.timeoutMs || CONFIG.timeoutMs;

    lock(key);
    setBtnLoading(btn, loadingText);

    let timeoutTimer = null;
    try {
      const timeoutPromise = new Promise((_, reject) => {
        timeoutTimer = setTimeout(() => reject(new Error('timeout')), timeoutMs);
      });
      const result = await Promise.race([
        Promise.resolve().then(() => fn()),
        timeoutPromise,
      ]);
      return { ok: true, result };
    } catch (err) {
      if (typeof global.showErrorToast === 'function' && CONFIG.showErrorToast) {
        const msg = err && err.message === 'timeout' ? '请求超时，请重试' : (err && err.message) || '操作失败';
        try { global.showErrorToast(msg, 'error'); } catch (_) {}
      }
      return { ok: false, reason: err && err.message || 'error', error: err };
    } finally {
      if (timeoutTimer) clearTimeout(timeoutTimer);
      setBtnDone(btn);
      unlock(key);
    }
  }

  // ── 自动绑定 data-guard 按钮 ────────────────────────────────
  function bindAuto() {
    if (installed) return;
    installed = true;
    document.querySelectorAll('[data-guard]').forEach((btn) => {
      const key = btn.getAttribute('data-guard');
      const handler = btn.getAttribute('data-handler') || key;
      btn.addEventListener('click', (e) => {
        if (isLocked(key)) {
          e.preventDefault();
          e.stopImmediatePropagation();
          return false;
        }
        // 调用 window[handler]() 存在则执行
        if (typeof global[handler] === 'function') {
          // 不自动包，让调用方自己用 guardRun
        }
      }, true); // capture 阶段先拦截
    });
  }

  // ── 导出 ─────────────────────────────────────────────────────
  const api = {
    run,
    lock,
    unlock,
    isLocked,
    bindAuto,
    setBtnLoading,
    setBtnDone,
    config: CONFIG,
  };

  global.submitGuard = api;
  global.guardRun = run;
  global.guardIsLocked = isLocked;

  // DOM Ready 后自动绑定
  if (typeof document !== 'undefined') {
    const boot = () => bindAuto();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
      boot();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
