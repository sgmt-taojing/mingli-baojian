/**
 * ═══════════════════════════════════════════════════════════════
 *  中医智能体 · HTML 转义工具（XSS 防护）
 *  规范: ENGINEERING_AUDIT.md §P3-XSS
 *  版本: v1.0 (2026-08-08 R474)
 * ═══════════════════════════════════════════════════════════════
 *
 *  使用方式
 *  ────────
 *  // 旧: el.innerHTML = '<div>' + userInput + '</div>';
 *  // 新: el.innerHTML = '<div>' + esc(userInput) + '</div>';
 *  // 或: el.innerHTML = escHtml('<div>' + userInput + '</div>');
 *
 *  // 批量转义对象: escObj({name:'<x>', age:30})
 *  //   → {name:'&lt;x&gt;', age:30}
 *
 *  // 安全 HTML 插入: safeHtml(template, {name: '<x>'})
 *  //   → 模板里的 {{name}} 自动转义
 */
(function (global) {
  'use strict';

  const ESC_MAP = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };

  const ESC_RE = /[&<>"'`=\/]/g;

  /**
   * 转义字符串中的 HTML 特殊字符
   * @param {string} str
   * @returns {string}
   */
  function esc(str) {
    if (str === null || str === undefined) return '';
    if (typeof str !== 'string') return String(str);
    return str.replace(ESC_RE, (ch) => ESC_MAP[ch] || ch);
  }

  /**
   * 批量转义对象的所有字符串字段
   * @param {object} obj
   * @returns {object}
   */
  function escObj(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(escObj);
    const out = {};
    for (const k in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, k)) continue;
      out[k] = escObj(obj[k]);
    }
    return out;
  }

  /**
   * 模板替换：{{key}} 替换为 escObj(obj)[key]
   * @param {string} template
   * @param {object} obj
   * @returns {string}
   */
  function safeHtml(template, obj) {
    if (typeof template !== 'string') return '';
    const safe = escObj(obj || {});
    return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, key) => {
      const v = safe[key];
      return v === undefined ? '' : String(v);
    });
  }

  /**
   * 安全属性值（用于 setAttribute / dataset / dataset.X 字符串拼接场景）
   * @param {string} str
   * @returns {string}
   */
  function escAttr(str) {
    return esc(str).replace(/\s/g, ' ');
  }

  // ── 导出 ──────────────────────────────────────────────────
  const api = { esc, escObj, safeHtml, escAttr };
  global.escapeHtml = esc;
  global.escHtml = esc;
  global.escObj = escObj;
  global.safeHtml = safeHtml;
  global.escAttr = escAttr;
  global.HtmlEscape = api;

})(typeof window !== 'undefined' ? window : globalThis);
