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

  // 轻量 Markdown → HTML 渲染（R228 新增）
  // 支持：标题 #/##/### · 加粗 **text** · 斜体 *text* · 列表 - item · 表格 | a | b | · 分割线 ---
  function renderMd(text) {
    var html = esc(text);
    // 分割线
    html = html.replace(/^---+$/gm, '<hr style="border:none;border-top:1px solid rgba(201,168,76,.2);margin:14px 0">');
    // 标题
    html = html.replace(/^### (.+)$/gm, '<h4 style="color:var(--paper,#e0d6c8);font-size:15px;margin:14px 0 6px;font-weight:600">$1</h4>');
    html = html.replace(/^## (.+)$/gm, '<h3 style="color:var(--accent,#c9a84c);font-size:17px;margin:18px 0 8px;border-bottom:1px solid rgba(201,168,76,.2);padding-bottom:4px;font-weight:600">$1</h3>');
    html = html.replace(/^# (.+)$/gm, '<h2 style="color:var(--paper,#e0d6c8);font-size:19px;margin:22px 0 10px;font-weight:600">$1</h2>');
    // 加粗
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--paper,#e0d6c8);font-weight:600">$1</strong>');
    // 斜体（避免与加粗冲突）
    html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
    // 表格行（| ... |）
    html = html.replace(/^\| (.+) \|$/gm, function (m) {
      var cells = m.split('|').filter(function (c) { return c.trim(); });
      // 分割线行 |---|---|
      if (cells.every(function (c) { return /^[-: ]+$/.test(c.trim()); })) return '';
      var tds = cells.map(function (c) { return '<td style="padding:4px 10px;border:1px solid rgba(201,168,76,.15);font-size:12px">' + c.trim() + '</td>'; }).join('');
      return '<table style="border-collapse:collapse;width:100%;margin:4px 0"><tr>' + tds + '</tr></table>';
    });
    // 列表
    html = html.replace(/^- (.+)$/gm, '<div style="padding-left:18px;margin:3px 0">• $1</div>');
    // 换行
    html = html.replace(/\n/g, '<br>');
    // 清理多余 <br> 在块级元素后
    html = html.replace(/<\/h[234]><br>/g, '</h[234]>');
    html = html.replace(/<\/table><br>/g, '</table>');
    html = html.replace(/<hr [^>]*><br>/g, function (m) { return m.replace('<br>', ''); });
    return html;
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
      '<button class="btn-copy" data-report="' + safe + '" onclick="navigator.clipboard.writeText(this.dataset.report||\'\').then(function(){var t=document.createElement(\'div\');t.textContent=\'已复制\';t.style.cssText=\'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:6px 16px;border-radius:6px;font-size:13px;z-index:9999\';document.body.appendChild(t);setTimeout(function(){t.remove()},1500)})" style="padding:4px 12px;border:1px solid rgba(201,168,76,.3);border-radius:6px;background:transparent;color:inherit;cursor:pointer;font-size:12px">📋 复制</button>' +
      '<button class="btn-copy-md" data-report="' + safe + '" onclick="navigator.clipboard.writeText(this.dataset.report||\'\').then(function(){var t=document.createElement(\'div\');t.textContent=\'已复制 Markdown\';t.style.cssText=\'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:6px 16px;border-radius:6px;font-size:13px;z-index:9999\';document.body.appendChild(t);setTimeout(function(){t.remove()},1500)})" style="padding:4px 12px;border:1px solid rgba(201,168,76,.3);border-radius:6px;background:transparent;color:inherit;cursor:pointer;font-size:12px">📝 Markdown</button>' +
      '</div>';
  }

  var Adapters = {
    // ─── 聊天气泡（AI 助手默认）───
    chatBubble: function (container, text, meta) {
      var d = document.createElement('div');
      d.className = 'msg m-ai';
      d.innerHTML = metaBar(meta) + '<div class="b" style="line-height:1.8">' + renderMd(text) + '</div>' + opsBar(text);
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
        '<div style="line-height:1.8;font-size:13px">' + renderMd(text) + '</div>' +
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
        '<div style="line-height:1.8;font-size:13px">' + renderMd(text) + '</div>' +
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
      var cleanText = renderMd(text);
      var box = document.createElement('div');
      box.style.cssText = 'padding:14px;background:#fff;border-radius:8px;font-size:14px;color:#333;line-height:1.7';
      box.innerHTML = simple + '<div>' + cleanText + '</div>';
      container.innerHTML = '';
      container.appendChild(box);
      return box;
    }
  };

  if (typeof globalThis !== 'undefined') globalThis.ReportAdapters = Adapters;
})();
