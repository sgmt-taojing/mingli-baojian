// ═══ R502 · AI 语音助手组件 · 可嵌入任意页面 ═══
// 使用：<div id="ai-assistant-mount"></div> + <script src="js/ai-voice-assistant.js"></script>
// 或：window.AIVoiceAssistant.mount(document.body)
(function() {
  'use strict';

  const TTS_BASE = '/api/tts';
  const API = '';  // 相对路径
  let state = {
    open: false,
    listening: false,
    speaking: false,
    voice: 'female',
    speed: 1.0,
    history: JSON.parse(localStorage.getItem('ai_voice_history') || '[]'),
    recognition: null,
    currentAudio: null,
    pendingText: '',
  };

  // ── CSS ──
  const CSS = `
    .aiva-fab{position:fixed;right:20px;bottom:80px;width:56px;height:56px;border-radius:50%;
      background:linear-gradient(135deg,#c9a84c,#e3c97a);box-shadow:0 4px 20px rgba(201,168,76,.4);
      display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:99998;
      transition:transform .3s ease;border:none;font-size:24px}
    .aiva-fab:hover{transform:scale(1.1)}
    .aiva-fab.active{animation:aiva-pulse 1.5s infinite}
    @keyframes aiva-pulse{0%,100%{box-shadow:0 4px 20px rgba(201,168,76,.4)}50%{box-shadow:0 4px 30px rgba(201,168,76,.8)}}
    .aiva-panel{position:fixed;right:20px;bottom:145px;width:min(380px,calc(100vw - 40px));
      max-height:70vh;background:#1a2332;border:1px solid #2d3748;border-radius:16px;
      display:none;flex-direction:column;z-index:99999;overflow:hidden;
      box-shadow:0 8px 32px rgba(0,0,0,.4)}
    .aiva-panel.open{display:flex;animation:aiva-slide-up .3s ease}
    @keyframes aiva-slide-up{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
    .aiva-header{padding:12px 16px;background:linear-gradient(135deg,#c9a84c22,transparent);
      border-bottom:1px solid #2d3748;display:flex;align-items:center;justify-content:space-between}
    .aiva-header-title{color:#c9a84c;font-size:14px;font-weight:600;display:flex;align-items:center;gap:8px}
    .aiva-header-actions{display:flex;gap:8px}
    .aiva-header-btn{background:none;border:none;color:#718096;cursor:pointer;font-size:16px;padding:4px;border-radius:4px}
    .aiva-header-btn:hover{color:#c9a84c;background:rgba(201,168,76,.1)}
    .aiva-messages{flex:1;overflow-y:auto;padding:12px 16px;display:flex;flex-direction:column;gap:10px;
      scrollbar-width:thin;scrollbar-color:#2d3748 transparent}
    .aiva-messages::-webkit-scrollbar{width:4px}
    .aiva-messages::-webkit-scrollbar-thumb{background:#2d3748;border-radius:2px}
    .aiva-msg{max-width:85%;padding:10px 14px;border-radius:12px;font-size:13px;line-height:1.5;word-break:break-word}
    .aiva-msg.user{align-self:flex-end;background:#c9a84c;color:#0e1726;border-bottom-right-radius:4px}
    .aiva-msg.bot{align-self:flex-start;background:#2d3748;color:#c9d1d9;border-bottom-left-radius:4px}
    .aiva-msg.system{align-self:center;background:transparent;color:#718096;font-size:11px;text-align:center}
    .aiva-msg .kb-ref{display:inline-block;margin-top:4px;padding:2px 8px;background:rgba(201,168,76,.15);
      border-radius:4px;font-size:11px;color:#c9a84c}
    .aiva-input-area{padding:10px 16px;border-top:1px solid #2d3748;display:flex;gap:8px;align-items:center}
    .aiva-input{flex:1;padding:10px 14px;background:#0e1726;border:1px solid #2d3748;
      border-radius:8px;color:#c9d1d9;font-size:13px;font-family:inherit;outline:none;transition:border-color .2s}
    .aiva-input:focus{border-color:#c9a84c}
    .aiva-mic-btn{width:40px;height:40px;border-radius:50%;border:none;cursor:pointer;
      display:flex;align-items:center;justify-content:center;font-size:18px;transition:all .2s;
      background:#2d3748;color:#c9d1d9}
    .aiva-mic-btn:hover{background:#c9a84c;color:#0e1726}
    .aiva-mic-btn.listening{background:#f56565;color:#fff;animation:aiva-rec-pulse 1s infinite}
    @keyframes aiva-rec-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
    .aiva-send-btn{width:40px;height:40px;border-radius:50%;border:none;cursor:pointer;
      display:flex;align-items:center;justify-content:center;font-size:18px;
      background:#c9a84c;color:#0e1726;transition:transform .2s}
    .aiva-send-btn:hover{transform:scale(1.05)}
    .aiva-quick-tags{padding:8px 16px;display:flex;gap:6px;flex-wrap:wrap}
    .aiva-tag{padding:4px 10px;background:#2d3748;border-radius:12px;font-size:11px;
      color:#c9d1d9;cursor:pointer;transition:all .2s;border:1px solid transparent}
    .aiva-tag:hover{border-color:#c9a84c;color:#c9a84c}
    .aiva-typing{display:flex;gap:4px;padding:8px 0}
    .aiva-typing span{width:6px;height:6px;border-radius:50%;background:#718096;animation:aiva-typing 1.4s infinite}
    .aiva-typing span:nth-child(2){animation-delay:.2s}
    .aiva-typing span:nth-child(3){animation-delay:.4s}
    @keyframes aiva-typing{0%,60%,100%{opacity:.3}30%{opacity:1}
  `;

  // ── 工具函数 ──
  function $(sel, root) { return (root || document).querySelector(sel); }
  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  // ── TTS 播放 ──
  function speak(text, opts) {
    opts = opts || {};
    stopSpeak();
    if (!text || text.length < 2) return;
    const truncated = text.substring(0, 2000);
    const url = TTS_BASE + '?text=' + encodeURIComponent(truncated) + '&voice=' + (opts.voice || state.voice);
    state.currentAudio = new Audio(url);
    state.currentAudio.playbackRate = opts.speed || state.speed;
    state.speaking = true;
    state.currentAudio.onended = function() {
      state.speaking = false;
      state.currentAudio = null;
      updateMicButton();
    };
    state.currentAudio.onerror = function() {
      state.speaking = false;
      state.currentAudio = null;
      updateMicButton();
    };
    state.currentAudio.play().catch(function() {});
    updateMicButton();
  }

  function stopSpeak() {
    if (state.currentAudio) {
      state.currentAudio.pause();
      state.currentAudio = null;
    }
    state.speaking = false;
    updateMicButton();
  }

  // ── 语音识别 ──
  function initRecognition() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    const r = new SR();
    r.lang = 'zh-CN';
    r.continuous = false;
    r.interimResults = true;
    r.maxAlternatives = 1;
    return r;
  }

  function startListening(targetInput) {
    if (!state.recognition) state.recognition = initRecognition();
    if (!state.recognition) {
      addMessage('bot', '⚠️ 当前浏览器不支持语音识别，请使用 Chrome 或 Safari。');
      return;
    }
    if (state.listening) {
      state.recognition.stop();
      return;
    }
    state.listening = true;
    updateMicButton();

    let finalText = '';
    state.recognition.onresult = function(e) {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          finalText += e.results[i][0].transcript;
        } else {
          interim += e.results[i][0].transcript;
        }
      }
      if (targetInput) targetInput.value = finalText || interim;
    };
    state.recognition.onend = function() {
      state.listening = false;
      updateMicButton();
      if (finalText && targetInput) {
        targetInput.value = finalText;
        // Auto-send if enabled
        if (state.autoSendOnVoice) sendMessage(finalText);
      }
    };
    state.recognition.onerror = function(e) {
      state.listening = false;
      updateMicButton();
      if (e.error !== 'no-speech') addMessage('bot', '⚠️ 语音识别异常：' + e.error);
    };
    state.recognition.start();
  }

  // ── 消息管理 ──
  function addMessage(role, text, opts) {
    opts = opts || {};
    if (!state._msgContainer) return;
    const msgEl = el('div', 'aiva-msg ' + role, text);
    if (opts.kbRef) {
      const ref = el('div', 'kb-ref', '📚 ' + opts.kbRef);
      msgEl.appendChild(ref);
    }
    state._msgContainer.appendChild(msgEl);
    state._msgContainer.scrollTop = state._msgContainer.scrollHeight;

    // Save to history
    state.history.push({ role, text, ts: Date.now(), kbRef: opts.kbRef });
    if (state.history.length > 100) state.history = state.history.slice(-100);
    localStorage.setItem('ai_voice_history', JSON.stringify(state.history.slice(-20)));

    // Auto TTS for bot messages
    if (role === 'bot' && state.autoTTS) speak(text);
  }

  function showTyping() {
    if (!state._msgContainer) return;
    const t = el('div', 'aiva-msg bot', '<div class="aiva-typing"><span></span><span></span><span></span></div>');
    t.id = 'aiva-typing';
    state._msgContainer.appendChild(t);
    state._msgContainer.scrollTop = state._msgContainer.scrollHeight;
  }
  function hideTyping() {
    const t = $('#aiva-typing');
    if (t) t.remove();
  }

  // ── 发送消息（调 AI API）──
  async function sendMessage(text) {
    if (!text || !text.trim()) return;
    addMessage('user', text.trim());

    // R510: 优先 voice-command（意图解析）→ kb-match/AI 问答
    const ctrl = new AbortController();
    const to = setTimeout(function(){ctrl.abort();}, 12000);

    // 1) voice-command（短文本意图匹配）
    let cmd = null;
    try {
      const r = await fetch(API + '/api/ai/voice-command', { signal: AbortSignal.timeout(15000),
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim() }), signal: ctrl.signal
      });
      const d = await r.json();
      cmd = d && d.data ? d.data : null;
    } catch (e) { /* 降级 */ }

    if (cmd && cmd.intent === 'open' && cmd.target) {
      clearTimeout(to);
      addMessage('bot', '🎯 ' + (cmd.label || '打开页面') + '\n\n即将跳转...');
      setTimeout(function(){ try { window.location.href = cmd.target; } catch(e){} }, 600);
      return;
    }
    if (cmd && (cmd.intent === 'clear' || cmd.intent === 'close' || cmd.intent === 'mute')) {
      clearTimeout(to);
      if (cmd.intent === 'clear') {
        state.history = [];
        localStorage.removeItem('ai_voice_history');
        if (state._msgContainer) state._msgContainer.innerHTML = '';
      } else if (cmd.intent === 'close') {
        close();
      } else if (cmd.intent === 'mute' && state.autoTTS) {
        state.autoTTS = false;
      }
      addMessage('bot', '✓ ' + (cmd.label || cmd.intent));
      return;
    }

    // 2) knowledge-qa（KB 优先问答）
    let qa = null;
    try {
      const r = await fetch(API + '/api/ai/knowledge-qa', { signal: AbortSignal.timeout(15000),
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text.trim() }), signal: ctrl.signal
      });
      const d = await r.json();
      qa = d && d.data ? d.data : null;
    } catch (e) { /* 降级 */ }

    if (qa && qa.source === 'kb' && qa.reply) {
      clearTimeout(to);
      const top = qa.topEntry || {};
      addMessage('bot', qa.reply, { kbRef: 'KB · ' + (top.module || '') + ' · 置信度 ' + (top.trust || qa.confidence || 0).toFixed(2) });
      return;
    }
    if (qa && qa.source === 'kb-summary' && qa.hits && qa.hits.length > 0) {
      clearTimeout(to);
      const lines = qa.hits.map(function(h, i){ return (i+1) + '. 【' + (h.module||'') + '】' + h.title + '（trust ' + (h.trust||0).toFixed(2) + '）'; });
      addMessage('bot', '🔍 找到 ' + qa.hits.length + ' 条相关知识：\n\n' + lines.join('\n') + '\n\n请说"打开知识库"或继续提问。');
      return;
    }

    // 3) AI 兜底
    try {
      const r = await fetch(API + '/api/ai/public-chat', { signal: AbortSignal.timeout(15000),
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{role:'user', content: text.trim()}], context: 'voice-assistant' }), signal: ctrl.signal
      });
      const d = await r.json();
      clearTimeout(to);
      const reply = (d.data && d.data.choices && d.data.choices[0] && d.data.choices[0].message && d.data.choices[0].message.content)
        || d.reply || d.response || d.text || '收到您的消息，但暂时无法生成回复。';
      if (reply && !/无效的 API Key|authentication_error/i.test(reply)) {
        addMessage('bot', reply);
      } else {
        addMessage('bot', '⚠️ AI 服务暂时不可用，请稍后再试。');
      }
    } catch (e) {
      clearTimeout(to);
      addMessage('bot', '⚠️ 网络异常，请检查连接后重试。');
    }
  }

  function formatKBAnswer(top, all) {
    const module = top.module || '知识库';
    const trust = top.trust_score || 0.85;
    const snippet = (top.snippet || top.title || '').substring(0, 500);
    let ref = `${module} · 置信度${trust.toFixed(2)}`;
    if (all.length > 1) ref += ` · 共${all.length}条匹配`;
    return {
      text: `📚 ${top.title || ''}\n\n${snippet}\n\n⚠️ 仅供学习参考，不构成专业建议。`,
      ref: ref
    };
  }

  // ── UI 更新 ──
  function updateMicButton() {
    if (!state._micBtn) return;
    if (state.listening) {
      state._micBtn.classList.add('listening');
      state._micBtn.textContent = '⏹';
    } else if (state.speaking) {
      state._micBtn.classList.remove('listening');
      state._micBtn.textContent = '🔊';
    } else {
      state._micBtn.classList.remove('listening');
      state._micBtn.textContent = '🎤';
    }
  }

  // ── 热门标签 ──
  const QUICK_TAGS = [
    { label: '八字十神', q: '八字十神详解' },
    { label: '紫微斗数', q: '紫微斗数排盘原理' },
    { label: '中医辨证', q: '中医八纲辨证' },
    { label: '舌诊要点', q: '舌诊方法与辨证' },
    { label: '风水入门', q: '风水基础理论' },
    { label: '奇门遁甲', q: '奇门遁甲排盘' },
    { label: '气血调养', q: '气血两虚如何调养' },
    { label: '每日运势', q: '今日宜忌' },
  ];

  // ── 挂载 ──
  function mount(container) {
    // Inject CSS
    if (!$('#aiva-css')) {
      const style = el('style', null, CSS);
      style.id = 'aiva-css';
      document.head.appendChild(style);
    }

    // FAB
    const fab = el('button', 'aiva-fab', '🦞');
    fab.setAttribute('aria-label', 'AI语音助手');
    fab.onclick = togglePanel;

    // Panel
    const panel = el('div', 'aiva-panel');
    panel.innerHTML = `
      <div class="aiva-header">
        <div class="aiva-header-title">🦞 AI语音助手</div>
        <div class="aiva-header-actions">
          <button class="aiva-header-btn" onclick="window.AIVoiceAssistant.clearHistory()" title="清空" aria-label="清空对话">🗑</button>
          <button class="aiva-header-btn" onclick="window.AIVoiceAssistant.toggleTTS()" title="语音播报" id="aiva-tts-toggle">🔊</button>
          <button class="aiva-header-btn" onclick="window.AIVoiceAssistant.close()" title="关闭" aria-label="关闭">✕</button>
        </div>
      </div>
      <div class="aiva-messages"></div>
      <div class="aiva-quick-tags">
        ${QUICK_TAGS.map(t => `<span class="aiva-tag" data-q="${t.q}">${t.label}</span>`).join('')}
      </div>
      <div class="aiva-input-area">
        <button class="aiva-mic-btn" aria-label="语音输入">🎤</button>
        <input class="aiva-input" placeholder="输入或说出您的问题..." aria-label="问题输入" />
        <button class="aiva-send-btn" aria-label="发送">➤</button>
      </div>
    `;

    container.appendChild(fab);
    container.appendChild(panel);

    state._panel = panel;
    state._msgContainer = $('.aiva-messages', panel);
    state._input = $('.aiva-input', panel);
    state._micBtn = $('.aiva-mic-btn', panel);
    state._sendBtn = $('.aiva-send-btn', panel);

    // Events
    state._micBtn.onclick = function() {
      if (state.speaking) { stopSpeak(); return; }
      startListening(state._input);
    };
    state._sendBtn.onclick = function() {
      const text = state._input.value;
      if (text.trim()) { sendMessage(text); state._input.value = ''; }
    };
    state._input.onkeydown = function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        state._sendBtn.click();
      }
    };

    // Quick tags
    document.querySelectorAll('.aiva-tag', panel).forEach(function(tag) {
      tag.onclick = function() {
        const q = this.getAttribute('data-q');
        if (q) { sendMessage(q); }
      };
    });

    // Welcome message
    addMessage('bot', '您好！我是命理宝鉴AI语音助手 🦞\n\n我可以：\n• 🔍 搜索知识库（八字/紫微/中医/风水等）\n• 🎤 语音问答（点击麦克风说话）\n• 🔊 语音播报（点击右上角🔊开启）\n• 📚 提供知识引用与置信度\n\n请问有什么可以帮助您的？');
  }

  function togglePanel() {
    state.open = !state.open;
    if (state._panel) state._panel.classList.toggle('open', state.open);
    if (state._fab) state._fab.classList.toggle('active', state.open);
  }

  function close() {
    state.open = false;
    if (state._panel) state._panel.classList.remove('open');
  }

  // ── Public API ──
  window.AIVoiceAssistant = {
    mount: mount,
    open: function() { if (!state.open) togglePanel(); },
    close: close,
    togglePanel: togglePanel,
    sendMessage: sendMessage,
    speak: speak,
    stopSpeak: stopSpeak,
    clearHistory: function() {
      state.history = [];
      localStorage.removeItem('ai_voice_history');
      if (state._msgContainer) state._msgContainer.innerHTML = '';
      addMessage('system', '对话已清空');
    },
    toggleTTS: function() {
      state.autoTTS = !state.autoTTS;
      const btn = $('#aiva-tts-toggle');
      if (btn) {
        btn.textContent = state.autoTTS ? '🔊✓' : '🔊';
        btn.style.color = state.autoTTS ? '#c9a84c' : '#718096';
      }
      if (state.autoTTS) addMessage('system', '语音播报已开启');
      else addMessage('system', '语音播报已关闭');
    },
    setVoice: function(v) { state.voice = v; },
    getState: function() { return { ...state, recognition: null, currentAudio: null }; }
  };

  // Auto-mount if designated element exists
  if (document.currentScript) {
    document.addEventListener('DOMContentLoaded', function() {
      const mountEl = $('#ai-assistant-mount') || document.body;
      mount(mountEl);
    });
  }
})();
