/**
 * ═══════════════════════════════════════════════════════════════
 *  命理宝鉴 · 超级物种级人机交互 — 前端层（Super-HCI Frontend）
 *  版本: v1.0 (2026-08-08)
 *  功能: 情绪共振 · 预判辅助 · 自适应沟通 · 跨模态连续性 · 记忆透明度
 * ═══════════════════════════════════════════════════════════════
 */
(function() {
  'use strict';

  if (window.__superHciReady) return;
  window.__superHciReady = true;

  const API_BASE = (location.hostname === '127.0.0.1' || location.hostname === 'localhost')
    ? 'http://127.0.0.1:8920' : '';

  // ── 状态 ──────────────────────────────────────────
  const state = {
    emotion: { emotion: 'neutral', confidence: 0, tone: 'neutral' },
    commProfile: 'detailed',
    history: [],
    memorySummary: null,
    predictions: [],
    orbGlyphs: {
      anxious: '🌿', confused: '💡', urgent: '⚡', hopeful: '🌈',
      frustrated: '🔄', curious: '🔍', sorrowful: '🕯️', angry: '🧊', neutral: '✨'
    },
    orbGlyphText: {
      anxious: '安', confused: '明', urgent: '速', hopeful: '望',
      frustrated: '转', curious: '探', sorrowful: '暖', angry: '静', neutral: '知'
    },
  };

  // ── DOM 就绪 ──────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function() {
    injectEmotionOrb();
    injectMemoryTrigger();
    injectPredictBar();
    injectMemoryPanel();
    setupModalTracking();
    setupKeyboardShortcuts();
    loadRecentHistory();
  });

  // ── 情绪共振层 ────────────────────────────────────
  function injectEmotionOrb() {
    const orb = document.createElement('div');
    orb.className = 'sh-emotion-orb';
    orb.setAttribute('data-emotion', 'neutral');
    orb.id = 'sh-emotion-orb';
    orb.innerHTML = '<span class="sh-orb-glyph" id="sh-orb-glyph">✨</span>';
    orb.title = '智能感知您的情绪状态';
    orb.addEventListener('click', function() {
      showEmotionTip(state.emotion);
    });
    document.body.appendChild(orb);
  }

  function updateEmotion(emotionResult) {
    state.emotion = emotionResult;
    const orb = document.getElementById('sh-emotion-orb');
    if (!orb) return;
    orb.setAttribute('data-emotion', emotionResult.emotion);
    const glyph = document.getElementById('sh-orb-glyph');
    if (glyph) glyph.textContent = state.orbGlyphText[emotionResult.emotion] || '知';

    // 高置信度情绪自动提示
    if (emotionResult.confidence > 0.6 && emotionResult.emotion !== 'neutral') {
      showEmotionTip(emotionResult);
    }
  }

  function showEmotionTip(emotionResult) {
    // 移除旧提示
    const old = document.getElementById('sh-emotion-tip');
    if (old) old.remove();

    const tip = document.createElement('div');
    tip.className = 'sh-emotion-tip';
    tip.id = 'sh-emotion-tip';

    const messages = {
      anxious:   { label: '检测到焦虑情绪', text: '别着急，我们慢慢看。可以试试深呼吸三次，让身心先静下来。' },
      confused:  { label: '理解您的疑惑', text: '这个问题可能需要从基础说起，让我为您拆解一下。' },
      urgent:    { label: '紧急状态', text: '已优先处理您的问题，正在快速为您分析。' },
      hopeful:   { label: '感受到期待', text: '很好，带着期待心来，往往会有好结果。' },
      frustrated:{ label: '感受到困扰', text: '我理解您的感受，让我们换个思路试试。' },
      curious:   { label: '好奇心驱动', text: '好奇是最好的老师，让我为您深度解答。' },
      sorrowful: { label: '感受到低落', text: '请记住，困境只是暂时的。命理告诉我们，运势流转，终有转机。' },
      angry:     { label: '感受到情绪', text: '先深呼吸，我们理性看待问题。情绪过后，答案会浮现。' },
    };
    const msg = messages[emotionResult.emotion] || { label: '感知中', text: '我在认真听您说。' };

    tip.innerHTML = `<div class="sh-tip-close" onclick="this.parentElement.remove()">×</div>
      <div style="color:var(--hci-primary);font-size:11px;margin-bottom:4px">${msg.label}</div>
      <div>${msg.text}</div>`;
    document.body.appendChild(tip);
    setTimeout(function() { if (tip.parentElement) tip.remove(); }, 5000);
  }

  // ── 预判辅助层 ────────────────────────────────────
  function injectPredictBar() {
    const bar = document.createElement('div');
    bar.className = 'sh-predict-bar';
    bar.id = 'sh-predict-bar';
    bar.hidden = true;
    document.body.appendChild(bar);
  }

  function updatePredictions(predictions) {
    state.predictions = predictions;
    const bar = document.getElementById('sh-predict-bar');
    if (!bar) return;

    if (!predictions || predictions.length === 0) {
      bar.hidden = true;
      return;
    }

    bar.hidden = false;
    bar.innerHTML = predictions.map(function(p) {
      return `<div class="sh-predict-card" onclick="shNavigate('${escapeAttr(p.suggestion)}')">
        <div class="sh-predict-icon">${p.icon || '→'}</div>
        <div class="sh-predict-info">
          <div class="sh-predict-label">${escapeHtml(p.suggestion)}</div>
          <div class="sh-predict-reason">${escapeHtml(p.reason)}</div>
        </div>
      </div>`;
    }).join('');
  }

  window.shNavigate = function(action) {
    const mappings = {
      '八字排盘': 'bazi.html', '紫微斗数': 'ziwei.html',
      '奇门遁甲': 'qimen-chart.html', '六爻占卜': 'liuyao-chart.html',
      '今日运势': 'bazi.html', '今日黄历': 'bazi.html',
      '中医问诊': 'tcm-portal.html', '风水堪舆': 'fengshui.html',
      '五行音乐': 'music-detail.html', '人生规划': 'lifeplan-detail.html',
      '化解指导': 'closed-loop-advisor.html', '合婚配对': 'bazi.html',
      '快速排盘': 'bazi.html',
    };
    const page = mappings[action] || 'index.html';
    if (page && page !== '#') {
      window.location.href = page;
    }
  };

  // ── 自适应沟通层 ──────────────────────────────────
  function detectAndSetProfile(text) {
    const profile = requireSuperHciEngine().detectCommunicationProfile(text, state.history);
    state.commProfile = profile.label;
    updateCommModeIndicator(profile.label);
    return profile;
  }

  function updateCommModeIndicator(mode) {
    let el = document.getElementById('sh-comm-mode');
    if (!el) {
      el = document.createElement('span');
      el.className = 'sh-comm-mode';
      el.id = 'sh-comm-mode';
      el.style.marginLeft = '8px';
      el.style.verticalAlign = 'middle';
      const badge = document.querySelector('.hci-confidence-badge');
      if (badge && badge.parentElement) {
        badge.parentElement.appendChild(el);
      }
    }
    el.setAttribute('data-mode', mode);
    el.textContent = '📝 ' + mode;
  }

  function adaptResponse(baseResponse, emotion) {
    const profile = state.commProfile;
    if (profile === '简洁模式') {
      const sents = baseResponse.split(/[。！？\n]/).filter(s => s.trim());
      return sents.slice(0, 2).join('。') + '。';
    }
    if (profile === '专业模式') return '【专业解析】\n' + baseResponse;
    if (emotion.emotion === 'anxious' && emotion.confidence > 0.6) return '🌿 深呼吸，我们慢慢看。\n\n' + baseResponse;
    if (emotion.emotion === 'urgent') return '⚡ ' + baseResponse.replace(/^[#\s]+/, '');
    if (emotion.emotion === 'frustrated') return '理解您的困扰，让我换个方式：\n\n' + baseResponse;
    return baseResponse;
  }

  // ── 跨模态连续性 ──────────────────────────────────
  function injectMemoryTrigger() {
    const trigger = document.createElement('button');
    trigger.className = 'sh-mem-trigger';
    trigger.id = 'sh-mem-trigger';
    trigger.innerHTML = '🧠';
    trigger.title = '查看系统记忆';
    trigger.addEventListener('click', function() {
      document.getElementById('sh-memory-panel').classList.toggle('open');
    });
    document.body.appendChild(trigger);
  }

  function injectMemoryPanel() {
    const panel = document.createElement('div');
    panel.className = 'sh-memory-panel';
    panel.id = 'sh-memory-panel';
    panel.innerHTML = `
      <div class="sh-memory-header">
        <span class="sh-memory-title">🧠 系统记忆</span>
        <button onclick="document.getElementById('sh-memory-panel').classList.remove('open')"
          style="background:none;border:none;color:var(--hci-muted);cursor:pointer;font-size:16px" aria-label="关闭">×</button>
      </div>
      <div id="sh-memory-content" style="font-size:12px;color:var(--hci-text)">
        <div style="color:var(--hci-muted);text-align:center;padding:20px">暂无记忆</div>
      </div>`;
    document.body.appendChild(panel);
  }

  function updateMemoryPanel(memories) {
    const engine = requireSuperHciEngine();
    const summary = engine.buildMemorySummary(memories);
    state.memorySummary = summary;
    const content = document.getElementById('sh-memory-content');
    if (!content) return;
    const html = engine.formatMemoryDisplay(summary);
    content.innerHTML = html || '<div style="color:var(--hci-muted);text-align:center;padding:20px">暂无记忆</div>';
  }

  function showModalBanner(message) {
    const old = document.getElementById('sh-modal-banner');
    if (old) old.remove();
    const banner = document.createElement('div');
    banner.className = 'sh-modal-banner';
    banner.id = 'sh-modal-banner';
    banner.textContent = message;
    document.body.appendChild(banner);
    setTimeout(function() { if (banner.parentElement) banner.remove(); }, 2200);
  }

  // ── 跨模态切换追踪 ─────────────────────────────────
  const MODAL_LABELS = {
    'text': '文字', 'voice': '语音', 'camera': '相机', 'report': '报告'
  };
  let _prevModal = 'text';

  function setupModalTracking() {
    // 监听语音引擎切换
    if (window.VoiceEngine) {
      const origStartConv = window.VoiceEngine.startConversation;
      window.VoiceEngine.startConversation = function(onMsg) {
        const newModal = 'voice';
        if (_prevModal !== newModal) {
          const engine = requireSuperHciEngine();
          showModalBanner(engine.getTransitionMessage(_prevModal, newModal));
          _prevModal = newModal;
        }
        return origStartConv(onMsg);
      };
      const origEndConv = window.VoiceEngine.endConversation;
      window.VoiceEngine.endConversation = function() {
        if (_prevModal !== 'text') {
          const engine = requireSuperHciEngine();
          showModalBanner(engine.getTransitionMessage('voice', 'text'));
          _prevModal = 'text';
        }
        return origEndConv();
      };
    }

    // 监听相机/图片输入
    document.addEventListener('hci:image-paste', function() {
      showModalBanner('📷 已接收图片，将结合文字为您分析');
      _prevModal = 'camera';
    });
    document.addEventListener('hci:image-drop', function() {
      showModalBanner('📷 已接收图片，将结合文字为您分析');
      _prevModal = 'camera';
    });
  }

  // ── 键盘快捷键 ────────────────────────────────────
  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
      // Ctrl+M 打开记忆面板
      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        document.getElementById('sh-memory-panel').classList.toggle('open');
      }
      // Ctrl+Shift+E 切换简洁/详细
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        const newMode = state.commProfile === '简洁模式' ? '详细模式' : '简洁模式';
        state.commProfile = newMode;
        updateCommModeIndicator(newMode);
        showEmotionTip({ emotion: 'hopeful', confidence: 0.8 });
      }
    });
  }

  // ── 历史记录加载 ──────────────────────────────────
  function loadRecentHistory() {
    try {
      const raw = localStorage.getItem('ai_chat_history') || localStorage.getItem('chat_history');
      if (raw) {
        const parsed = JSON.parse(raw);
        state.history = Array.isArray(parsed) ? parsed.slice(-10).map(function(item) {
          return { query: item.text || item.user || item.query || '', ts: item.ts || Date.now() };
        }) : [];
      }
    } catch (e) { /* 静默 */ }
  }

  // ── 消息处理钩子 ──────────────────────────────────
  function processUserMessage(text) {
    if (!text) return;
    state.history.push({ query: text, ts: Date.now() });
    if (state.history.length > 20) state.history.shift();

    // 情绪检测
    const engine = requireSuperHciEngine();
    const emotion = engine.detectEmotion(text);
    updateEmotion(emotion);

    // 沟通模式检测
    detectAndSetProfile(text);

    // 预判辅助
    const predictions = engine.generatePredictions(state.history, null);
    updatePredictions(predictions);

    // 记忆更新
    updateMemoryPanel(state.memorySummary);

    return { emotion: emotion, profile: state.commProfile, predictions: predictions };
  }

  // ── 适配 AI 回复 ──────────────────────────────────
  function adaptAiResponse(baseText, emotion) {
    const engine = requireSuperHciEngine();
    const profile = detectAndSetProfile('');
    return engine.adaptResponseStyle(baseText, profile, emotion || state.emotion);
  }

  // ── 全局 API ──────────────────────────────────────
  function requireSuperHciEngine() {
    if (window.__superHciEngine) return window.__superHciEngine;
    // 尝试从 fetch 加载后端引擎（在 api-server-v2.js 中注册）
    const proxy = {
      detectEmotion: function(text) {
        // 纯前端情绪检测
        return state.emotion;
      },
      detectCommunicationProfile: function() {
        const profiles = {
          concise: { label: '简洁模式', traits: { maxLength: 120 } },
          detailed: { label: '详细模式', traits: { maxLength: 800, useBullets: true, includeExamples: true } },
          example: { label: '案例模式', traits: { maxLength: 500, useBullets: true, includeExamples: true } },
          formal: { label: '专业模式', traits: { maxLength: 600, useBullets: true, formalTone: true } },
        };
        return profiles[state.commProfile] || profiles.detailed;
      },
      generatePredictions: function() { return state.predictions; },
      buildMemorySummary: function(memories) {
        if (!memories) return state.memorySummary;
        return { known: memories, inferred: [], preferences: [] };
      },
      formatMemoryDisplay: function(summary) {
        if (!summary) return '';
        let html = '';
        if (summary.known) {
          html += summary.known.map(function(m) {
            return '<div class="sh-mem-item"><span class="sh-mem-key">' + escapeHtml(m.key || '') + '</span>: ' + escapeHtml(m.value || '') + '</div>';
          }).join('');
        }
        return html;
      },
      getTransitionMessage: function(from, to) {
        const labels = { text: '文字', voice: '语音', camera: '相机', report: '报告' };
        return '已从' + (labels[from] || from) + '切换到' + (labels[to] || to);
      },
      adaptResponseStyle: function(base, profile, emotion) {
        if (profile && profile.traits && profile.traits.maxLength < 150) {
          const sents = base.split(/[。！？\n]/).filter(s => s.trim());
          return sents.slice(0, 2).join('。') + '。';
        }
        return base;
      },
    };
    window.__superHciEngine = proxy;
    return proxy;
  }

  // ── 工具函数 ──────────────────────────────────────
  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function escapeAttr(str) {
    if (!str) return '';
    return String(str).replace(/'/g, "\\'").replace(/"/g, '&quot;');
  }

  // ── 公开 API ──────────────────────────────────────
  window.SuperHCI = {
    processMessage: processUserMessage,
    adaptResponse: adaptAiResponse,
    getEmotion: function() { return state.emotion; },
    getProfile: function() { return state.commProfile; },
    getPredictions: function() { return state.predictions; },
    updatePredictions: updatePredictions,
    updateMemory: updateMemoryPanel,
    reset: function() {
      state.history = [];
      state.predictions = [];
      state.emotion = { emotion: 'neutral', confidence: 0, tone: 'neutral' };
      updatePredictions([]);
      const orb = document.getElementById('sh-emotion-orb');
      if (orb) orb.setAttribute('data-emotion', 'neutral');
      const glyph = document.getElementById('sh-orb-glyph');
      if (glyph) glyph.textContent = '知';
    },
  };

})();
