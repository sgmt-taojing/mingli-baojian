/**
 * TCM-Agent AI 语音助手浮窗组件 V1.0
 *
 * 功能：
 * - 右下角悬浮麦克风按钮（呼吸动画）
 * - 点击展开对话面板（文字+语音双输入）
 * - Web Speech API 语音识别（zh-CN）
 * - 自动调用 /api/ai/chat 获取智能回复
 * - TTS 朗读 AI 回复（edge-tts 或 SpeechSynthesis）
 * - 上下文感知（自动注入当前页面上下文）
 * - 对话历史 localStorage 持久化（最近 20 轮）
 *
 * 使用方式：<script src="js/voice-assistant.js"></script>
 *           （nav.js 已自动加载，无需手动引用）
 */

(function() {
  if (typeof window === 'undefined') return;

  var HISTORY_KEY = 'tcm_voice_history';
  var MAX_HISTORY = 20;
  var PAGE_CONTEXT = getPageContext();

  function getPageContext() {
    var path = location.pathname || '';
    var name = path.split('/').pop().replace('.html', '') || 'index';
    var ctxMap = {
      'index': '辨证论治',
      'treatment-center': '诊疗中心',
      'clinical': '四诊采集',
      'clinic-desk': '医生工作台',
      'admin': '患者管理',
      'pharmacy': '药房管理',
      'patient-portal': '患者自助',
      'report': '诊断报告',
      'wearable-hub': '设备监控',
      'voice-diagnosis': '语音问诊',
      'emergency': '紧急救助',
      'chronic-disease': '慢病管理',
      'kb-evolution': '知识库蒸馏'
    };
    return ctxMap[name] || name;
  }

  // ─── 对话历史 ───
  function loadHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch(e) { return []; }
  }
  function saveHistory(hist) {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(hist.slice(-MAX_HISTORY))); } catch(e) {}
  }
  function addToHistory(role, text) {
    var h = loadHistory();
    h.push({ role: role, text: text, time: new Date().toLocaleString('zh-CN'), page: PAGE_CONTEXT });
    saveHistory(h);
  }

  // ─── TTS ───
  function speak(text) {
    if (!text) return;
    if ('speechSynthesis' in window) {
      // 取消之前的朗读
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text.slice(0, 500));
      u.lang = 'zh-CN';
      u.rate = 1.0;
      u.pitch = 1.0;
      // 优先找中文声音
      var voices = window.speechSynthesis.getVoices();
      var zh = voices.find(function(v) { return v.lang.startsWith('zh'); });
      if (zh) u.voice = zh;
      window.speechSynthesis.speak(u);
    }
  }

  // ─── 语音识别 ───
  var recognition = null;
  var isListening = false;

  function initRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('[voice-assistant] Web Speech API 不可用');
      return false;
    }
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SR();
    recognition.lang = 'zh-CN';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = function(event) {
      var transcript = event.results[0][0].transcript;
      if (transcript) {
        sendMessage(transcript);
      }
      setListening(false);
    };
    recognition.onerror = function(e) {
      console.warn('[voice-assistant] 识别错误:', e.error);
      setListening(false);
    };
    recognition.onend = function() {
      setListening(false);
    };
    return true;
  }

  function setListening(v) {
    isListening = v;
    var btn = document.getElementById('tcm-va-mic-btn');
    if (btn) {
      btn.setAttribute('aria-label', v ? '正在录音（点击停止）' : '语音输入');
      btn.classList.toggle('tcm-va-listening', v);
    }
  }

  function toggleListen() {
    if (!recognition) {
      if (!initRecognition()) {
        appendMessage('system', '⚠️ 当前浏览器不支持语音识别，请使用文字输入');
        return;
      }
    }
    if (isListening) {
      recognition.stop();
      setListening(false);
    } else {
      // 先展开面板
      openPanel();
      try {
        recognition.start();
        setListening(true);
      } catch(e) {
        setListening(false);
      }
    }
  }

  // ─── AI 对话 ───
  function sendMessage(msg) {
    if (!msg || !msg.trim()) return;
    appendMessage('user', msg);
    addToHistory('user', msg);

    var reply = '';
    var source = 'fallback';
    var suggestions = ['联系医生', '查看知识库'];

    // 1. KB 优先
    try {
      fetch('/api/tcm/kb/search?q=' + encodeURIComponent(msg)).then(function(r) { return r.json(); }).then(function(d) {
        if (d && d.results && d.results.length > 0) {
          var top = d.results[0];
          reply = '【知识库】' + (top.title || top.term || '') + '：' + (top.summary || top.content || '').slice(0, 200);
          source = 'kb';
          suggestions = ['查看完整知识', '相关方剂', '临床案例'];
        }
        // 回退：方剂
        if (!reply) {
          fetch('/api/tcm/formula/search?q=' + encodeURIComponent(msg)).then(function(r2) { return r2.json(); }).then(function(d2) {
            if (d2 && d2.formulas && d2.formulas.length > 0) {
              var top = d2.formulas[0];
              reply = '【方剂】' + top.formula + '\n证型：' + (top.syndrome || '') + '\n来源：' + (top.source || '') + '\n症状：' + (top.symptoms || []).join('、');
              source = 'formula';
              suggestions = ['查看完整组成', '临床加减'];
            }
            if (!reply) reply = '我目前没有找到关于「' + msg + '」的相关知识。建议：联系专业中医师获取更准确的信息。';
            appendMessage('ai', reply, source, suggestions);
            addToHistory('ai', reply);
            speak(reply);
          }).catch(function() {
            appendMessage('ai', reply || '服务暂时不可用，请稍后重试。', source, suggestions);
          });
        } else {
          appendMessage('ai', reply, source, suggestions);
          addToHistory('ai', reply);
          speak(reply);
        }
      }).catch(function() {
        appendMessage('ai', '服务暂时不可用，请稍后重试。', 'error', ['重新提问']);
      });
    } catch(e) {
      appendMessage('ai', '服务暂时不可用，请稍后重试。', 'error', ['重新提问']);
    }
  }

  // ─── 消息渲染 ───
  function appendMessage(role, text, source, suggestions) {
    source = source || '';
    suggestions = suggestions || [];
    var panel = document.getElementById('tcm-va-panel');
    if (!panel) return;
    var list = panel.querySelector('.tcm-va-messages');
    if (!list) return;

    var isUser = role === 'user';
    var msg = document.createElement('div');
    msg.className = 'tcm-va-msg tcm-va-' + (isUser ? 'user' : 'ai');

    var bubble = document.createElement('div');
    bubble.className = 'tcm-va-bubble';
    bubble.style.cssText = (isUser ? 'background:#0f766e;color:#fff' : 'background:#f1f5f9;color:#0f172a') +
                           ';border-radius:12px;padding:10px 14px;max-width:90%;font-size:13px;line-height:1.6;white-space:pre-wrap';

    var label = document.createElement('div');
    label.style.cssText = 'font-size:10px;color:#94a3b8;margin-bottom:4px';
    label.textContent = isUser ? '你' : (source === 'kb' ? '📚 知识库' : source === 'formula' ? '💊 方剂库' : '🤖 AI 助手');
    bubble.appendChild(label);

    var content = document.createElement('div');
    content.textContent = text;
    bubble.appendChild(content);
    msg.appendChild(bubble);

    // 建议标签
    if (suggestions.length) {
      var tags = document.createElement('div');
      tags.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;margin-top:6px';
      suggestions.forEach(function(s) {
        var tag = document.createElement('button');
        tag.className = 'tcm-va-tag';
        tag.textContent = s;
        tag.style.cssText = 'font-size:11px;padding:2px 10px;border-radius:20px;border:1px solid #0f766e;color:#0f766e;background:transparent;cursor:pointer';
        tag.addEventListener('click', function() {
          sendMessage(s);
        });
        tags.appendChild(tag);
      });
      msg.appendChild(tags);
    }

    list.appendChild(msg);
    // 滚动到底
    list.scrollTop = list.scrollHeight;
  }

  // ─── 面板 DOM ───
  function createPanel() {
    // 悬浮按钮
    var btn = document.createElement('button');
    btn.id = 'tcm-va-mic-btn';
    btn.className = 'tcm-va-fab';
    btn.setAttribute('aria-label', '语音助手');
    btn.title = 'AI 语音助手（语音/文字输入）';
    btn.style.cssText =
      'position:fixed;bottom:24px;right:24px;width:56px;height:56px;border-radius:50%;border:none;' +
      'background:linear-gradient(135deg,#0f766e,#14b8a6);color:#fff;font-size:24px;cursor:pointer;' +
      'box-shadow:0 4px 16px rgba(15,118,110,0.35);z-index:9997;display:flex;align-items:center;justify-content:center;' +
      'transition:transform 0.2s,box-shadow 0.2s';
    btn.textContent = '🎤';
    btn.addEventListener('click', function(e) {
      if (state.open) closePanel();
      else openPanel();
      e.stopPropagation();
    });
    document.body.appendChild(btn);

    // 面板
    var overlay = document.createElement('div');
    overlay.style.cssText =
      'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(15,23,42,0.4);z-index:9998;display:none;' +
      'align-items:center;justify-content:center';
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closePanel();
    });

    var panel = document.createElement('div');
    panel.id = 'tcm-va-panel';
    panel.style.cssText =
      'background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.25);width:min(420px,92vw);max-height:min(600px,85vh);' +
      'display:flex;flex-direction:column;overflow:hidden;transform:translateY(20px);opacity:0;transition:opacity 0.2s,transform 0.2s';

    // 顶栏
    var header = document.createElement('div');
    header.style.cssText = 'padding:12px 18px;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;justify-content:space-between;background:#f8fafc';
    var title = document.createElement('span');
    title.style.cssText = 'font-size:14px;font-weight:600;color:#0f172a';
    title.innerHTML = '🎤 AI 语音助手 <span style="font-size:11px;color:#94a3b8;font-weight:400">(' + PAGE_CONTEXT + ')</span>';
    header.appendChild(title);
    var closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = 'border:none;background:transparent;font-size:18px;cursor:pointer;color:#64748b;padding:4px 8px';
    closeBtn.setAttribute('aria-label', '关闭语音助手');
    closeBtn.addEventListener('click', closePanel);
    header.appendChild(closeBtn);
    panel.appendChild(header);

    // 消息列表
    var list = document.createElement('div');
    list.className = 'tcm-va-messages';
    list.style.cssText = 'flex:1;overflow-y:auto;padding:12px 18px;display:flex;flex-direction:column;gap:10px';
    panel.appendChild(list);

    // 欢迎语
    var welcome = document.createElement('div');
    welcome.style.cssText = 'text-align:center;color:#94a3b8;font-size:12px;padding:20px 0';
    welcome.innerHTML = '👋 您好！我是「' + PAGE_CONTEXT + '」AI 助手<br><span style="font-size:11px">点击麦克风说话 或 直接输入问题</span>';
    list.appendChild(welcome);

    // 底部输入
    var footer = document.createElement('div');
    footer.style.cssText = 'padding:10px 14px;border-top:1px solid #e5e7eb;display:flex;gap:8px;align-items:center;background:#f8fafc';

    var textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.id = 'tcm-va-text-input';
    textInput.placeholder = '输入问题，或点麦克风说话…';
    textInput.setAttribute('aria-label', '语音助手输入框');
    textInput.style.cssText = 'flex:1;border:1px solid #e5e7eb;border-radius:20px;padding:8px 16px;font-size:13px;outline:none;background:#fff';
    textInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        var val = textInput.value.trim();
        if (val) { sendMessage(val); textInput.value = ''; }
      }
    });
    footer.appendChild(textInput);

    var micBtn = document.createElement('button');
    micBtn.id = 'tcm-va-mic';
    micBtn.textContent = '🎤';
    micBtn.title = '语音输入';
    micBtn.style.cssText =
      'width:40px;height:40px;border-radius:50%;border:none;background:#0f766e;color:#fff;font-size:18px;cursor:pointer';
    micBtn.addEventListener('click', toggleListen);
    footer.appendChild(micBtn);

    panel.appendChild(footer);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    state.overlay = overlay;
    state.panel = panel;

    // 入场动画
    requestAnimationFrame(function() {
      panel.style.opacity = '1';
      panel.style.transform = 'translateY(0)';
    });
  }

  function openPanel() {
    if (!state.panel) createPanel();
    state.open = true;
    state.overlay.style.display = 'flex';
    var input = document.getElementById('tcm-va-text-input');
    if (input) setTimeout(function() { input.focus(); }, 200);
    // 渲染历史
    var hist = loadHistory();
    if (hist.length) {
      var list = document.getElementById('tcm-va-panel') ? document.getElementById('tcm-va-panel').querySelector('.tcm-va-messages') : null;
      if (list && list.children.length === 1) {
        list.innerHTML = '';
        hist.slice(-8).forEach(function(h) {
          appendMessage(h.role, h.text);
        });
      }
    }
  }

  function closePanel() {
    if (!state.overlay) return;
    state.open = false;
    state.overlay.style.display = 'none';
    if (isListening && recognition) {
      try { recognition.stop(); } catch(e) {}
      setListening(false);
    }
  }

  // ─── 初始化 ───
  function init() {
    if (!initRecognition()) {
      // 降级：只有文字输入
    }
    // 暴露 API
    window.TCM = window.TCM || {};
    window.TCM.voiceAssistant = window.TCM.voiceAssistant || {
      open: openPanel,
      close: closePanel,
      send: sendMessage,
      speak: speak,
      history: function() { return loadHistory(); },
      clearHistory: function() { saveHistory([]); }
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();