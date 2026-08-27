/**
 * TCM-Agent AI 语音助手全局浮窗 V1.0
 * 功能：右下角悬浮按钮 → AI 对话 + 语音录入 + KB 问答 + 工作流引导
 * 特性：Web Speech API · Markdown 渲染 · 快捷操作 · 关闭不影响页面
 * 使用对象：所有角色 · 功能：智能问答+语音录入 · 价值：解放双手+知识随时问
 */
(function() {
  'use strict';
  if (window._TCMVoiceAssistant) return;
  window._TCMVoiceAssistant = true;

  // toast 函数（内联，防止未定义）
  function showToast(msg, type) {
    type = type || 'info';
    var t = document.createElement('div');
    t.style.cssText = 'position:fixed;top:20px;right:20px;z-index:99999;padding:12px 20px;border-radius:8px;color:#fff;font-size:14px;max-width:360px;box-shadow:0 4px 12px rgba(0,0,0,.4);opacity:0;transition:opacity .3s;background:' + (type==='error'?'#c0392b':type==='success'?'#2d7a46':'#2c3e50');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function(){t.style.opacity='1';},10);
    setTimeout(function(){t.style.opacity='0';setTimeout(function(){t.remove();},300);},3500);
  }

  var isOpen = false;
  var isListening = false;
  var recognition = null;
  var messages = [];

  // ─── 注入浮窗按钮 ───
  function injectButton() {
    if (document.getElementById('ai-fab')) return;
    var fab = document.createElement('button');
    fab.id = 'ai-fab';
    fab.setAttribute('aria-label', '打开 AI 语音助手');
    fab.innerHTML = '🦾';
    fab.style.cssText = 'position:fixed;bottom:20px;right:20px;width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none;font-size:28px;cursor:pointer;box-shadow:0 6px 20px rgba(99,102,241,0.4);z-index:99997;transition:transform 0.2s;display:flex;align-items:center;justify-content:center;';
    fab.onmouseenter = function() { fab.style.transform = 'scale(1.08)'; };
    fab.onmouseleave = function() { fab.style.transform = 'scale(1)'; };
    fab.onclick = togglePanel;
    document.body.appendChild(fab);

    // 红点提示（首次）
    var dot = document.createElement('div');
    dot.id = 'ai-fab-dot';
    dot.textContent = '1';
    dot.style.cssText = 'position:absolute;top:-2px;right:-2px;background:#ef4444;color:#fff;font-size:11px;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:600;';
    fab.appendChild(dot);
  }

  // ─── 浮窗主体 ───
  function createPanel() {
    if (document.getElementById('ai-panel')) return;
    var panel = document.createElement('div');
    panel.id = 'ai-panel';
    panel.style.cssText = 'position:fixed;bottom:88px;right:20px;width:min(380px,92vw);height:min(560px,80vh);background:#fff;border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,0.15);z-index:99998;display:none;flex-direction:column;overflow:hidden;border:1px solid #e5e7eb;';
    panel.innerHTML =
      '<div style="display:flex;align-items:center;padding:14px 18px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;">' +
        '<span style="font-size:24px;margin-right:10px;">🦾</span>' +
        '<div style="flex:1;">' +
          '<div style="font-weight:600;font-size:15px;">AI 助手 · 智能问答</div>' +
          '<div style="font-size:11px;opacity:0.85;">支持语音 · 知识库查询 · 工作流引导</div>' +
        '</div>' +
        '<button id="ai-close" aria-label="关闭助手" style="background:none;border:none;color:#fff;font-size:20px;cursor:pointer;padding:0 6px;">✕</button>' +
      '</div>' +
      '<div id="ai-messages" style="flex:1;overflow-y:auto;padding:14px;background:#f9fafb;"></div>' +
      '<div id="ai-quick" style="padding:10px 14px;background:#fff;border-top:1px solid #e5e7eb;display:flex;gap:6px;flex-wrap:wrap;"></div>' +
      '<div style="display:flex;gap:8px;padding:12px 14px;background:#fff;border-top:1px solid #e5e7eb;">' +
        '<button id="ai-voice" aria-label="语音录入" style="background:none;border:1px solid #d1d5db;border-radius:8px;width:40px;height:40px;cursor:pointer;font-size:18px;flex-shrink:0;">🎙️</button>' +
        '<input id="ai-input" type="text" placeholder="问点中医知识、方剂、症状…" ' +
          'style="flex:1;border:1px solid #d1d5db;border-radius:8px;padding:0 12px;outline:none;font-size:14px;" ' +
          'aria-label="AI 对话输入" />' +
        '<button id="ai-send" aria-label="发送消息" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none;border-radius:8px;padding:0 16px;cursor:pointer;font-size:14px;font-weight:500;">发送</button>' +
      '</div>';
    document.body.appendChild(panel);

    document.getElementById('ai-close').onclick = togglePanel;
    document.getElementById('ai-send').onclick = function() { sendMessage(); };
    document.getElementById('ai-voice').onclick = toggleVoice;
    document.getElementById('ai-input').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') sendMessage();
    });

    // 默认快捷
    renderQuick([
      { label: '🩺 怎么辨证？', q: '中医辨证的基本流程' },
      { label: '💊 失眠方剂', q: '失眠' },
      { label: '📍 足三里', q: '足三里' },
      { label: '📚 中医入门', q: '中医四诊' }
    ]);

    // 欢迎消息
    pushMessage('ai', '您好！我是您的 AI 中医助手 🦾\n\n我可以帮您：\n• 查询方剂/穴位/证型\n• 解释中医概念\n• 引导诊疗流程\n\n试试下面的快捷问题，或直接输入您的问题。');
  }

  function renderQuick(items) {
    var box = document.getElementById('ai-quick');
    if (!box) return;
    box.innerHTML = '';
    items.forEach(function(it) {
      var b = document.createElement('button');
      b.textContent = it.label;
      b.style.cssText = 'padding:5px 10px;font-size:12px;border:1px solid #e5e7eb;border-radius:14px;background:#f9fafb;cursor:pointer;color:#4b5563;';
      b.onmouseenter = function() { b.style.background = '#f3f4f6'; };
      b.onmouseleave = function() { b.style.background = '#f9fafb'; };
      b.onclick = function() {
        var inp = document.getElementById('ai-input');
        inp.value = it.q;
        sendMessage();
      };
      box.appendChild(b);
    });
  }

  function togglePanel() {
    createPanel();
    isOpen = !isOpen;
    document.getElementById('ai-panel').style.display = isOpen ? 'flex' : 'none';
    var dot = document.getElementById('ai-fab-dot');
    if (dot && isOpen) dot.style.display = 'none';
    if (isOpen) {
      setTimeout(function() { document.getElementById('ai-input').focus(); }, 200);
    }
  }

  function pushMessage(role, text) {
    messages.push({ role: role, text: text, ts: Date.now() });
    renderMessages();
  }

  function renderMessages() {
    var box = document.getElementById('ai-messages');
    if (!box) return;
    var html = '';
    messages.forEach(function(m) {
      var bg = m.role === 'user' ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#fff';
      var color = m.role === 'user' ? '#fff' : '#1f2937';
      var align = m.role === 'user' ? 'flex-end' : 'flex-start';
      var border = m.role === 'ai' ? '1px solid #e5e7eb' : 'none';
      var icon = m.role === 'user' ? '🙋' : '🦾';
      var time = new Date(m.ts).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
      html += '<div style="display:flex;justify-content:' + align + ';margin-bottom:10px;">' +
        '<div style="max-width:80%;background:' + bg + ';color:' + color + ';padding:10px 14px;border-radius:14px;border:' + border + ';font-size:13px;line-height:1.6;white-space:pre-wrap;word-wrap:break-word;">' +
          '<div>' + formatMarkdown(m.text) + '</div>' +
          '<div style="font-size:10px;opacity:0.6;margin-top:4px;text-align:right;">' + time + '</div>' +
        '</div>' +
      '</div>';
    });
    box.innerHTML = html;
    box.scrollTop = box.scrollHeight;
  }

  function formatMarkdown(s) {
    return String(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n/g, '<br>')
                    .replace(/^[•·]/gm, '&nbsp;&nbsp;•');
  }

  function sendMessage() {
    var inp = document.getElementById('ai-input');
    var text = inp.value.trim();
    if (!text) return;
    pushMessage('user', text);
    inp.value = '';
    pushMessage('ai', '正在思考…');
    var idx = messages.length - 1;
    var apiBase = (typeof TCM !== 'undefined' && TCM.API_BASE) ? TCM.API_BASE : '';
    fetch(apiBase + '/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    }).then(function(r) { return r.json(); })
      .then(function(data) {
        messages[idx] = { role: 'ai', text: (data.reply || '未能理解您的问题，请换种说法试试。'), ts: Date.now() };
        renderMessages();
        if (data.suggestions && data.suggestions.length) {
          renderQuick(data.suggestions.map(function(s) { return { label: s, q: s }; }));
        }
      }).catch(function() {
        messages[idx] = { role: 'ai', text: '⚠️ 服务暂时不可用，请稍后再试。\n离线时您仍可访问已有页面。', ts: Date.now() };
        renderMessages();
      });
  }

  // ─── 语音 ───
  function toggleVoice() {
    var btn = document.getElementById('ai-voice');
    if (isListening) {
      stopVoice();
      return;
    }
    var Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Rec) {
      showToast('当前浏览器不支持语音识别，请使用 Chrome / Edge', 'error');
      return;
    }
    recognition = new Rec();
    recognition.lang = 'zh-CN';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = function() {
      isListening = true;
      btn.style.background = '#fee2e2';
      btn.style.borderColor = '#ef4444';
      btn.textContent = '⏹';
    };
    recognition.onresult = function(e) {
      var text = e.results[0][0].transcript;
      document.getElementById('ai-input').value = text;
      sendMessage();
    };
    recognition.onerror = function() {
      stopVoice();
    };
    recognition.onend = function() { stopVoice(); };
    try { recognition.start(); } catch (e) {}
  }

  function stopVoice() {
    isListening = false;
    var btn = document.getElementById('ai-voice');
    if (btn) { btn.style.background = 'none'; btn.style.borderColor = '#d1d5db'; btn.textContent = '🎙️'; }
    if (recognition) {
      try { recognition.stop(); } catch (e) {}
      recognition = null;
    }
  }

  // ─── 初始化 ───
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectButton);
  } else {
    injectButton();
  }
})();