/**
 * report-render-adapters.js — 各端报告渲染适配器
 *
 * 同一报告文本，根据端的特点选择不同渲染方式：
 * - chatBubble:  AI 助手聊天气泡（默认，富文本+操作按钮+推荐）
 * - drawer:      divination-hub 抽屉式弹出
 * - inline:      lifeplan-detail 内嵌区域
 * - wechat:      微信端精简纯文本+关键表格
 */
(function () {
  'use strict';

  function esc(s) {
    return String(s || '').replace(/[<>"&]/g, function (c) {
      return { '<': '&lt;', '>': '&gt;', '"': '&quot;', '&': '&amp;' }[c];
    });
  }

  // 通用：KB 命中信息条
  function metaBar(meta) {
    if (!meta || typeof meta !== 'object') return '';
    var score = typeof meta.score === 'number' ? meta.score : 0;
    var pct = Math.round(score * 100);
    var color = score >= 0.7 ? '#10b981' : score >= 0.4 ? '#c9a84c' : '#f59e0b';
    var src = meta.engine ? meta.engine : (meta.source || '本地知识库');
    var fb = meta.fallback ? ' · 回退' : '';
    return '<div style="display:inline-flex;align-items:center;gap:8px;padding:5px 10px;margin-bottom:8px;background:rgba(201,168,76,.08);border:1px solid rgba(201,168,76,.25);border-radius:6px;font-size:11px;color:inherit;opacity:.85">' +
      '<span style="opacity:.7">🎯 KB 命中</span>' +
      '<span style="color:' + color + ';font-weight:600">' + pct + '%</span>' +
      '<span style="opacity:.5">·</span>' +
      '<span>引擎：' + esc(src) + esc(fb) + '</span></div>';
  }

  // 通用：报告操作按钮
  function opsBar(text) {
    var safe = esc(text).replace(/"/g, '&quot;');
    return '<div class="report-ops" style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap">' +
      '<button class="btn-copy" data-report="' + safe + '" onclick="navigator.clipboard.writeText(this.dataset.report||\'\').then(function(){alert(\'已复制\')})" style="padding:4px 12px;border:1px solid rgba(201,168,76,.3);border-radius:6px;background:transparent;color:inherit;cursor:pointer;font-size:12px">📋 复制</button>' +
      '<button class="btn-copy-md" data-report="' + safe + '" onclick="navigator.clipboard.writeText(this.dataset.report||\'\').then(function(){alert(\'已复制 Markdown\')})" style="padding:4px 12px;border:1px solid rgba(201,168,76,.3);border-radius:6px;background:transparent;color:inherit;cursor:pointer;font-size:12px">📝 Markdown</button>' +
      '</div>';
  }

  var Adapters = {
    // ─── 聊天气泡（AI 助手默认）───
    chatBubble: function (container, text, meta) {
      var d = document.createElement('div');
      d.className = 'msg m-ai';
      d.innerHTML = metaBar(meta) + '<div class="b" style="line-height:1.8;white-space:pre-wrap">' + esc(text) + '</div>' + opsBar(text);
      if (typeof container === 'string') container = document.getElementById(container);
      if (container) container.appendChild(d);
      return d;
    },

    // ─── 抽屉弹出（divination-hub）───
    drawer: function (container, text, meta) {
      var overlay = document.createElement('div');
      overlay.className = 'report-drawer-overlay';
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9998;display:flex;align-items:flex-end;justify-content:center';
      var panel = document.createElement('div');
      panel.style.cssText = 'background:var(--paper,#1a1a2e);color:var(--paper2,#e0d6c8);width:100%;max-width:640px;max-height:80vh;overflow-y:auto;border-radius:16px 16px 0 0;padding:20px;box-shadow:0 -4px 24px rgba(0,0,0,.4)';
      panel.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">' +
        '<span style="font-weight:600;font-size:15px">📋 分析报告</span>' +
        '<button onclick="this.closest(\'.report-drawer-overlay\').remove()" style="background:transparent;border:none;color:inherit;font-size:20px;cursor:pointer;opacity:.6">✕</button></div>' +
        metaBar(meta) +
        '<div style="line-height:1.8;white-space:pre-wrap;font-size:13px">' + esc(text) + '</div>' +
        opsBar(text);
      overlay.appendChild(panel);
      overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });
      document.body.appendChild(overlay);
      return panel;
    },

    // ─── 内嵌区域（lifeplan-detail 等）───
    inline: function (container, text, meta) {
      if (typeof container === 'string') container = document.getElementById(container);
      if (!container) return null;
      var box = document.createElement('div');
      box.className = 'report-inline-box';
      box.style.cssText = 'margin:16px 0;padding:18px;background:rgba(201,168,76,.05);border:1px solid rgba(201,168,76,.15);border-radius:10px';
      box.innerHTML = metaBar(meta) +
        '<div style="line-height:1.8;white-space:pre-wrap;font-size:13px">' + esc(text) + '</div>' +
        opsBar(text);
      container.appendChild(box);
      return box;
    },

    // ─── 微信端精简（纯文本 + 关键结构）───
    wechat: function (container, text, meta) {
      if (typeof container === 'string') container = document.getElementById(container);
      if (!container) return null;
      // 微信端去除操作按钮、简化 meta 条
      var score = meta && typeof meta.score === 'number' ? Math.round(meta.score * 100) : 0;
      var src = meta ? (meta.source || 'AI') : 'AI';
      var simple = '<div style="font-size:11px;color:#999;margin-bottom:6px">🎯 ' + score + '% · ' + esc(src) + '</div>';
      // 微信端不显示 Markdown 表格原文，保留纯文本
      var cleanText = esc(text).replace(/\|/g, ' ').replace(/---+/g, '');
      var box = document.createElement('div');
      box.style.cssText = 'padding:14px;background:#fff;border-radius:8px;font-size:14px;color:#333;line-height:1.7;white-space:pre-wrap';
      box.innerHTML = simple + '<div>' + cleanText + '</div>';
      container.innerHTML = '';
      container.appendChild(box);
      return box;
    }
  };

  if (typeof globalThis !== 'undefined') globalThis.ReportAdapters = Adapters;
})();
