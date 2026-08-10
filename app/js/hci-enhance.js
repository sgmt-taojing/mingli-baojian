/**
 * R515 · HCI Enhancement Engine — 前端交互逻辑
 * 版本: v1.0 (2026-08-08)
 * 功能:
 *   1. 思维链可视化渲染
 *   2. 置信度徽章
 *   3. 智能追问卡片
 *   4. 快捷指令面板
 *   5. 多模态输入适配（粘贴/拖拽图片）
 *   6. 会话上下文管理
 */
(function() {
  'use strict';

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  // ── 思维链可视化 ─────────────────────────────
  window.hciToggleThinking = function(show) {
    var panel = $('hci-thinking-panel');
    if (panel) panel.hidden = !show;
  };

  window.hciRenderThinking = function(steps) {
    var container = $('hci-thinking-steps');
    if (!container || !Array.isArray(steps)) return;
    container.innerHTML = steps.map(function(s, i) {
      return '<div class="hci-thought-step" style="animation-delay:' + (i * 0.1) + 's">' +
        '<div class="step-num">' + (i + 1) + '</div>' +
        '<div class="step-content">' +
          '<div class="step-phase">' + esc(s.phase) +
          (s.elapsed > 0 ? '<span class="step-time">+' + s.elapsed + 'ms</span>' : '') +
          '</div>' +
          '<div class="step-detail">' + esc(s.detail) + '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  };

  // ── 置信度徽章 ───────────────────────────────
  window.hciShowConfidence = function(confidence) {
    var badge = $('hci-confidence-badge');
    if (!badge || !confidence) return;
    badge.hidden = false;
    badge.setAttribute('data-level', confidence.level);
    badge.querySelector('.hci-conf-text').textContent =
      confidence.level + ' ' + Math.round(confidence.score * 100) + '%';
  };

  // ── 正在思考指示器 ───────────────────────────
  window.hciShowThinking = function(show, text) {
    var ind = $('hci-thinking-indicator');
    if (!ind) return;
    ind.hidden = !show;
    if (show && text) {
      var t = ind.querySelector('.hci-indicator-text');
      if (t) t.textContent = text;
    }
  };

  // ── 智能追问卡片 ─────────────────────────────
  window.hciRenderFollowUps = function(followUps) {
    var container = $('hci-followup-container');
    if (!container || !Array.isArray(followUps)) return;
    container.innerHTML = followUps.map(function(f) {
      var typeLabel = { clarify: '追问', collect: '收集', extend: '延伸' }[f.type] || f.type;
      var html = '<div class="hci-followup-card">' +
        '<div class="hci-followup-question">' +
        '<span class="hci-followup-type">' + typeLabel + '</span>' +
        esc(f.question) +
        '</div>';
      if (f.options && f.options.length) {
        html += '<div class="hci-followup-options">';
        f.options.forEach(function(opt) {
          html += '<div class="hci-followup-option" onclick="hciQuick(\'' + esc(opt.label) + '\')" role="button" tabindex="0">' +
            '<span>' + opt.icon + '</span> ' + esc(opt.label) + '</div>';
        });
        html += '</div>';
      }
      html += '</div>';
      return html;
    }).join('');
  };

  // ── 快捷指令面板 ─────────────────────────────
  window.hciToggleQuick = function(show) {
    var panel = $('hci-quick-panel');
    var trigger = $('hci-quick-trigger');
    if (panel) panel.hidden = !show;
    if (trigger) trigger.style.display = show ? 'none' : 'block';
  };

  window.hciQuick = function(text) {
    var input = document.querySelector('textarea#input, input#input, #msg');
    if (input) {
      input.value = text;
      input.focus();
      var evt = new Event('input', { bubbles: true });
      input.dispatchEvent(evt);
    }
    if (typeof window.send === 'function') {
      setTimeout(function() { window.send(); }, 100);
    }
    hciToggleQuick(false);
  };

  // ── 会话上下文 ───────────────────────────────
  var _sessionCtx = { expert: null, history: [] };

  window.hciSetContext = function(ctx) {
    if (!ctx) return;
    if (ctx.expert) _sessionCtx.expert = ctx.expert;
    if (ctx.query) {
      _sessionCtx.history.push({ q: ctx.query, ts: Date.now() });
      if (_sessionCtx.history.length > 10) _sessionCtx.history.shift();
    }
  };

  window.hciGetContext = function() { return _sessionCtx; };

  // ── 多模态输入适配 ───────────────────────────
  document.addEventListener('paste', function(e) {
    var items = e.clipboardData && e.clipboardData.items;
    if (!items) return;
    for (var i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        var blob = items[i].getAsFile();
        if (!blob) continue;
        var ce = new CustomEvent('hci:image-paste', { detail: { blob: blob } });
        document.dispatchEvent(ce);
      }
    }
  });

  document.addEventListener('dragover', function(e) { e.preventDefault(); });
  document.addEventListener('drop', function(e) {
    e.preventDefault();
    var files = e.dataTransfer && e.dataTransfer.files;
    if (!files || files.length === 0) return;
    for (var j = 0; j < files.length; j++) {
      if (files[j].type.indexOf('image') !== -1) {
        var ce2 = new CustomEvent('hci:image-drop', { detail: { file: files[j] } });
        document.dispatchEvent(ce2);
      }
    }
  });

  // ── 键盘快捷键: Ctrl+K 打开快捷面板 ──────────
  document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      var panel2 = $('hci-quick-panel');
      hciToggleQuick(panel2 ? panel2.hidden : true);
    }
  });

  // ── 初始化 ─────────────────────────────────
  document.addEventListener('DOMContentLoaded', function() {
    var trigger = $('hci-quick-trigger');
    if (trigger) trigger.style.display = 'block';
  });
})();
