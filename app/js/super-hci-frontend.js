/**
 * ═══════════════════════════════════════════════════════════════
 *  命理宝鉴 · 超级物种级 HCI 前端引擎（Super-HCI Frontend）
 *  版本: v1.0 (2026-08-08)
 *  能力: 实时情绪共振 · 自适应排版 · 预判卡片 · 记忆透明面板
 * ═══════════════════════════════════════════════════════════════
 */
'use strict';

(function (global) {
  'use strict';

  // ── 配置 ─────────────────────────────────────────────
  const API = (location.hostname === '127.0.0.1' || location.hostname === 'localhost')
    ? 'http://127.0.0.1:8920' : '';
  const STORAGE_KEY = 'super_hci_state';
  const HISTORY_KEY = 'super_hci_history';
  const MAX_HISTORY = 50;

  // ── 状态 ─────────────────────────────────────────────
  const state = {
    sessionId: null,
    emotion: 'neutral',
    emotionConfidence: 0,
    commProfile: 'detailed',
    predictions: [],
    memories: { known: [], preferences: [], inferred: [] },
    history: [],
    activeModals: [],
    initialized: false,
  };

  // ── DOM 辅助 ─────────────────────────────────────────
  function $(sel, parent) { return (parent || document).querySelector(sel); }
  function $$(sel, parent) { return Array.from((parent || document).querySelectorAll(sel)); }
  function el(tag, attrs, children) {
    const e = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        if (k === 'class') e.className = attrs[k];
        else if (k === 'style') e.setAttribute('style', attrs[k]);
        else if (k.startsWith('on') && typeof attrs[k] === 'function') e.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
        else if (k === 'html') { e.innerHTML = attrs[k]; }
        else e.setAttribute(k, attrs[k]);
      }
    }
    if (children) {
      (Array.isArray(children) ? children : [children]).forEach(c => {
        if (c == null) return;
        e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
      });
    }
    return e;
  }

  // ── 加载/保存 ────────────────────────────────────────
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        state.memories = saved.memories || state.memories;
        state.commProfile = saved.commProfile || state.commProfile;
      }
      const histRaw = localStorage.getItem(HISTORY_KEY);
      if (histRaw) state.history = JSON.parse(histRaw).slice(-MAX_HISTORY);
    } catch (e) { /* 静默 */ }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        memories: state.memories,
        commProfile: state.commProfile,
      }));
      localStorage.setItem(HISTORY_KEY, JSON.stringify(state.history.slice(-MAX_HISTORY)));
    } catch (e) { /* 静默 */ }
  }

  // ── 情绪共振展示 ─────────────────────────────────────
  const EMOTION_META = {
    anxious:    { icon: '🌿', label: '感知到您的焦虑', color: '#81c784', bg: 'rgba(129,199,132,.12)' },
    confused:   { icon: '💡', label: '为您理清思路', color: '#fff176', bg: 'rgba(255,241,118,.12)' },
    urgent:     { icon: '⚡', label: '快速解答中', color: '#ff8a65', bg: 'rgba(255,138,101,.12)' },
    hopeful:    { icon: '🌈', label: '充满希望', color: '#ce93d8', bg: 'rgba(206,147,216,.12)' },
    frustrated: { icon: '🔄', label: '换个角度看看', color: '#90caf9', bg: 'rgba(144,202,249,.12)' },
    curious:    { icon: '🔍', label: '满足您的好奇', color: '#80deea', bg: 'rgba(128,222,234,.12)' },
    sorrowful:  { icon: '🕯️', label: '陪伴您度过', color: '#b0bec5', bg: 'rgba(176,190,197,.12)' },
    angry:      { icon: '🧊', label: '冷静一下再看看', color: '#80cbc4', bg: 'rgba(128,203,196,.12)' },
    neutral:    { icon: '✨', label: '', color: '#c9a84c', bg: 'transparent' },
  };

  function renderEmotionBadge(container, emotion, confidence) {
    if (!container) return;
    const meta = EMOTION_META[emotion] || EMOTION_META.neutral;
    if (emotion === 'neutral' || confidence < 0.15) {
      const old = container.querySelector('.shci-emotion-badge');
      if (old) old.remove();
      return;
    }
    let badge = container.querySelector('.shci-emotion-badge');
    if (!badge) {
      badge = el('div', { class: 'shci-emotion-badge' });
      container.insertBefore(badge, container.firstChild);
    }
    badge.style.cssText = `display:flex;align-items:center;gap:6px;padding:6px 14px;background:${meta.bg};border:1px solid ${meta.color}33;border-radius:20px;font-size:12px;color:${meta.color};margin-bottom:8px;transition:all .4s ease;animation:shci-fade-in .4s ease`;
    badge.innerHTML = `<span style="font-size:14px">${meta.icon}</span><span>${meta.label}</span><span style="opacity:.5;font-size:10px">${Math.round(confidence * 100)}%</span>`;
  }

  // ── 预判卡片 ─────────────────────────────────────────
  function renderPredictions(container, predictions) {
    if (!container) return;
    let predRow = container.querySelector('.shci-predictions');
    if (old) { old.remove(); }
    var old = container.querySelector('.shci-predictions');
    if (!predictions || predictions.length === 0) {
      if (predRow) predRow.remove();
      return;
    }
    if (!predRow) {
      predRow = el('div', { class: 'shci-predictions' });
      predRow.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-top:8px';
      container.appendChild(predRow);
    }
    predRow.innerHTML = '';
    predictions.forEach(p => {
      const card = el('div', {
        class: 'shci-pred-card',
        style: `padding:8px 14px;background:rgba(201,168,76,.08);border:1px solid rgba(201,168,76,.25);border-radius:12px;cursor:pointer;transition:all .25s;font-size:12px;color:#c9d1d9;display:flex;align-items:center;gap:6px`,
        onclick: function () { triggerPrediction(p); },
      });
      card.innerHTML = `<span style="font-size:16px">${p.icon || '→'}</span><div><div style="font-weight:600;color:#c9a84c">${p.suggestion}</div><div style="font-size:10px;opacity:.6">${p.reason || ''}</div></div>`;
      predRow.appendChild(card);
    });
  }

  function triggerPrediction(p) {
    // 将预判作为输入发送
    const input = document.querySelector('#userInput, .chat-input textarea, #ai-input');
    if (input && p.suggestion) {
      input.value = p.suggestion;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      const sendBtn = document.querySelector('#sendBtn, .send-btn, #ai-send');
      if (sendBtn) sendBtn.click();
    }
  }

  // ── 记忆透明面板 ─────────────────────────────────────
  function renderMemoryPanel(container, memories) {
    if (!container || !memories) return;
    let panel = container.querySelector('.shci-memory-panel');
    if (!panel) {
      panel = el('div', { class: 'shci-memory-panel' });
      panel.style.cssText = 'padding:12px;background:rgba(45,55,72,.5);border-radius:10px;margin:8px 0;font-size:12px;color:#8b949e';
      container.appendChild(panel);
    }
    const parts = [];
    if (memories.known && memories.known.length > 0) {
      parts.push(`<div style="margin-bottom:6px"><span style="color:#c9a84c;font-weight:600">📋 已知</span> ${memories.known.map(m => escapeHtml(m.key + ': ' + m.value)).join(' · ')}</div>`);
    }
    if (memories.preferences && memories.preferences.length > 0) {
      parts.push(`<div style="margin-bottom:6px"><span style="color:#22d3ee;font-weight:600">⚙️ 偏好</span> ${memories.preferences.map(m => escapeHtml(m.key + ': ' + m.value)).join(' · ')}</div>`);
    }
    if (memories.inferred && memories.inferred.length > 0) {
      parts.push(`<div><span style="color:#a78bfa;font-weight:600">🤔 推断</span> ${memories.inferred.map(m => escapeHtml(m.key + ': ' + m.value)).join(' · ')}</div>`);
    }
    panel.innerHTML = parts.join('') || '<div style="text-align:center;opacity:.4">暂无记忆数据</div>';
  }

  // ── SSE 事件处理 ─────────────────────────────────────
  function handleSseEvent(eventName, data) {
    switch (eventName) {
      case 'super_hci': {
        if (data.emotion) {
          state.emotion = data.emotion.emotion;
          state.emotionConfidence = data.emotion.confidence;
          const chatArea = document.querySelector('.chat-messages, #chat-messages, .chat-area');
          renderEmotionBadge(chatArea, data.emotion.emotion, data.emotion.confidence);
        }
        if (data.commProfile) {
          state.commProfile = data.commProfile;
        }
        if (data.predictions && data.predictions.length > 0) {
          state.predictions = data.predictions;
          const inputArea = document.querySelector('.chat-input, #chat-input, .input-area');
          renderPredictions(inputArea, data.predictions);
        }
        break;
      }
      case 'kb_match': {
        // KB 匹配层级展示
        if (data.tier && data.tier !== 'FALLBACK') {
          const chatArea = document.querySelector('.chat-messages, #chat-messages');
          if (chatArea) {
            let tierBadge = chatArea.querySelector('.shci-tier-badge');
            if (!tierBadge) {
              tierBadge = el('div', { class: 'shci-tier-badge' });
              tierBadge.style.cssText = 'font-size:10px;color:#8b949e;padding:2px 8px;margin-bottom:4px';
              chatArea.insertBefore(tierBadge, chatArea.lastChild);
            }
            const tierLabel = { DIRECT: '⚡ KB 直答', POLISH: '✨ KB 增色', FALLBACK: '🤖 AI 生成' };
            tierBadge.textContent = (tierLabel[data.tier] || data.tier) + (data.trust ? ' · trust ' + data.trust.toFixed(2) : '');
          }
        }
        break;
      }
      case 'kb_answer': {
        // KB 直答事件
        if (data.content) {
          state.memories.known.push({ key: '最近查询', value: data.source || data.category || 'KB', confidence: 0.7 });
          saveState();
        }
        break;
      }
    }
  }

  // ── 连接 SSE ─────────────────────────────────────────
  function connectSSE(query, module, messages) {
    if (!query || !module) return null;

    // 保存历史
    state.history.push({ query, module, ts: Date.now() });
    if (state.history.length > MAX_HISTORY) state.history.shift();
    saveState();

    const url = `${API}/api/ai/stream-chat`;
    const body = JSON.stringify({ messages: messages || [{ role: 'user', content: query }], module });

    // 使用 fetch streaming
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body,
    }).then(function (response) {
      if (!response.ok) throw new Error('SSE fetch failed: ' + response.status);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      function readChunk() {
        reader.read().then(function (chunk) {
          if (chunk.done) return;
          buffer += decoder.decode(chunk.value || new Uint8Array(), { stream: true });
          // Parse SSE events
          const events = buffer.split('\\n\\n');
          buffer = events.pop() || '';
          for (var evt of events) {
            var eventName = 'message';
            var evtData = '';
            for (var line of evt.split('\\n')) {
              if (line.startsWith('event:')) eventName = line.slice(6).trim();
              else if (line.startsWith('data:')) evtData += line.slice(5).trim();
            }
            if (eventName !== 'message' && evtData) {
              try { handleSseEvent(eventName, JSON.parse(evtData)); } catch (e) { /* */ }
            }
          }
          readChunk();
        }).catch(function () { /* */ });
      }
      readChunk();
    }).catch(function () { /* */ });

    return true;
  }

  // ── 透明度工具栏 ─────────────────────────────────────
  function createTransparencyBar(container) {
    if (!container) return;
    var existing = container.querySelector('.shci-transparency-bar');
    if (existing) return;

    var bar = el('div', { class: 'shci-transparency-bar' });
    bar.style.cssText = 'display:flex;gap:12px;align-items:center;padding:8px 12px;background:rgba(26,35,50,.8);border-radius:8px;font-size:11px;color:#8b949e;margin:4px 0';

    // 记忆按钮
    var memBtn = el('button', {
      class: 'shci-mem-btn',
      style: 'background:none;border:1px solid #2d3748;border-radius:6px;padding:4px 10px;color:#c9a84c;cursor:pointer;font-size:11px',
      onclick: function () { toggleMemoryModal(); },
    }, '🧠 记忆');

    // 情绪按钮
    var emoBtn = el('button', {
      class: 'shci-emo-btn',
      style: 'background:none;border:1px solid #2d3748;border-radius:6px;padding:4px 10px;color:#22d3ee;cursor:pointer;font-size:11px',
      onclick: function () { toggleEmotionModal(); },
    }, '🌿 情绪');

    // 偏好按钮
    var prefBtn = el('button', {
      class: 'shci-pref-btn',
      style: 'background:none;border:1px solid #2d3748;border-radius:6px;padding:4px 10px;color:#a78bfa;cursor:pointer;font-size:11px',
      onclick: function () { togglePrefModal(); },
    }, '⚙️ 偏好');

    bar.appendChild(memBtn);
    bar.appendChild(emoBtn);
    bar.appendChild(prefBtn);
    container.appendChild(bar);
  }

  // ── 模态框 ───────────────────────────────────────────
  function createModal(title, contentHtml) {
    var overlay = el('div', {
      class: 'shci-modal-overlay',
      style: 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:100000;display:flex;align-items:center;justify-content:center;animation:shci-fade-in .2s ease',
    });
    var modal = el('div', {
      class: 'shci-modal',
      style: 'background:#1a2332;border:1px solid #2d3748;border-radius:16px;padding:24px;max-width:480px;width:calc(100vw - 40px);max-height:80vh;overflow-y:auto;box-shadow:0 12px 48px rgba(0,0,0,.4)',
    });
    modal.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><h3 style="color:#c9a84c;font-size:16px;margin:0">' + escapeHtml(title) + '</h3><button class="shci-modal-close" style="background:none;border:none;color:#8b949e;font-size:20px;cursor:pointer">×</button></div><div class="shci-modal-body">' + contentHtml + '</div>';
    overlay.appendChild(modal);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });
    modal.querySelector('.shci-modal-close').addEventListener('click', function () { overlay.remove(); });
    document.body.appendChild(overlay);
    return overlay;
  }

  function toggleMemoryModal() {
    var html = '<div style="color:#c9d1d9;font-size:13px;line-height:1.8">';
    if (state.memories.known.length > 0) {
      html += '<div style="margin-bottom:12px"><div style="color:#c9a84c;font-weight:600;margin-bottom:4px">📋 已知信息</div>';
      state.memories.known.forEach(function (m) { html += '<div style="padding:4px 0;border-bottom:1px solid #2d3748">' + escapeHtml(m.key) + ': ' + escapeHtml(m.value) + ' <span style="color:#8b949e;font-size:11px">' + Math.round((m.confidence || 0.7) * 100) + '%</span></div>'; });
      html += '</div>';
    }
    if (state.memories.preferences.length > 0) {
      html += '<div style="margin-bottom:12px"><div style="color:#22d3ee;font-weight:600;margin-bottom:4px">⚙️ 偏好</div>';
      state.memories.preferences.forEach(function (m) { html += '<div style="padding:4px 0;border-bottom:1px solid #2d3748">' + escapeHtml(m.key) + ': ' + escapeHtml(m.value) + '</div>'; });
      html += '</div>';
    }
    if (state.memories.inferred.length > 0) {
      html += '<div><div style="color:#a78bfa;font-weight:600;margin-bottom:4px">🤔 推断</div>';
      state.memories.inferred.forEach(function (m) { html += '<div style="padding:4px 0;opacity:.7">' + escapeHtml(m.key) + ': ' + escapeHtml(m.value) + ' (推测)</div>'; });
      html += '</div>';
    }
    if (state.memories.known.length === 0 && state.memories.preferences.length === 0 && state.memories.inferred.length === 0) {
      html += '<div style="text-align:center;opacity:.4;padding:20px">暂无记忆数据</div>';
    }
    html += '</div>';
    createModal('🧠 记忆透明度', html);
  }

  function toggleEmotionModal() {
    var meta = EMOTION_META[state.emotion] || EMOTION_META.neutral;
    var html = '<div style="text-align:center;padding:16px"><div style="font-size:48px;margin-bottom:12px">' + meta.icon + '</div><div style="color:#c9a84c;font-size:18px;font-weight:600;margin-bottom:8px">' + (meta.label || '平静') + '</div><div style="color:#8b949e;font-size:13px">置信度: ' + Math.round(state.emotionConfidence * 100) + '%</div><div style="color:#8b949e;font-size:12px;margin-top:8px">系统会根据您的情绪调整回复风格</div></div>';
    createModal('🌿 情绪共振', html);
  }

  function togglePrefModal() {
    var profiles = [
      { key: 'concise', label: '简洁', desc: '只说重点' },
      { key: 'detailed', label: '详细', desc: '展开说明' },
      { key: 'example', label: '案例', desc: '用例子说明' },
      { key: 'formal', label: '专业', desc: '学术风格' },
    ];
    var html = '<div style="color:#c9d1d9;font-size:13px"><div style="margin-bottom:12px;color:#8b949e">选择您偏好的回复风格：</div>';
    profiles.forEach(function (p) {
      var active = state.commProfile === p.label || state.commProfile === p.key || (state.commProfile === '详细模式' && p.key === 'detailed');
      html += '<div class="shci-pref-option' + (active ? ' active' : '') + '" data-profile="' + p.key + '" style="padding:10px 14px;border:1px solid ' + (active ? '#c9a84c' : '#2d3748') + ';border-radius:10px;margin-bottom:6px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;background:' + (active ? 'rgba(201,168,76,.08)' : 'transparent') + ';transition:all .2s"><span><span style="font-weight:600;color:#c9d1d9">' + p.label + '</span> <span style="color:#8b949e;font-size:11px">' + p.desc + '</span></span>' + (active ? '<span style="color:#c9a84c">✓</span>' : '') + '</div>';
    });
    html += '</div>';
    var modal = createModal('⚙️ 沟通偏好', html);
    // 绑定点击
    modal.querySelectorAll('.shci-pref-option').forEach(function (opt) {
      opt.addEventListener('click', function () {
        state.commProfile = opt.getAttribute('data-profile');
        saveState();
        modal.remove();
        togglePrefModal();
      });
    });
  }

  // ── 注入 CSS ─────────────────────────────────────────
  function injectCSS() {
    if (document.querySelector('#shci-css')) return;
    var style = el('style', { id: 'shci-css' });
    style.textContent = [
      '@keyframes shci-fade-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}',
      '.shci-pred-card:hover{border-color:#c9a84c !important;background:rgba(201,168,76,.15) !important;transform:translateY(-2px)}',
      '.shci-pref-option:hover{border-color:#c9a84c !important}',
    ].join('\\n');
    document.head.appendChild(style);
  }

  // ── 初始化 ───────────────────────────────────────────
  function init(opts) {
    if (state.initialized) return true;
    opts = opts || {};
    loadState();
    injectCSS();

    // 在聊天区域注入透明度工具栏
    if (opts.container) {
      createTransparencyBar(typeof opts.container === 'string' ? $(opts.container) : opts.container);
    } else {
      // 延迟自动查找
      setTimeout(function () {
        var chatArea = $('.chat-input, #chat-input, .input-area, .chat-bottom');
        if (chatArea) createTransparencyBar(chatArea);
      }, 500);
    }

    // 监听 ai-assistant 的消息事件
    if (opts.listenEvents !== false) {
      document.addEventListener('ai-stream-event', function (e) {
        if (e.detail) handleSseEvent(e.detail.event, e.detail.data);
      });
    }

    state.initialized = true;
    return true;
  }

  // ── 导出 ─────────────────────────────────────────────
  global.SuperHCI = {
    init: init,
    connectSSE: connectSSE,
    handleSseEvent: handleSseEvent,
    renderEmotionBadge: renderEmotionBadge,
    renderPredictions: renderPredictions,
    renderMemoryPanel: renderMemoryPanel,
    createTransparencyBar: createTransparencyBar,
    state: state,
  };

  // 自动初始化（ai-assistant.html 加载后）
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(function () {
        try { init(); } catch (e) { /* */ }
      }, 800);
    });
  }

  // ── 工具 ─────────────────────────────────────────────
  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
})(typeof window !== 'undefined' ? window : globalThis);
