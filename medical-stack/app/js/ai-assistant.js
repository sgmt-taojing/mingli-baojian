/**
 * TCM-Agent AI 语音助手全局浮窗 V1.0
 * 使用方式：页面引用 <script src="js/ai-assistant.js"></script>
 * 自动注入右下角浮窗，支持语音输入 + KB 问答 + 操作引导
 * 依赖：nav.js (TCM.toast) — 若不存在则自带 fallback
 */
(function() {
  'use strict';
  if (typeof window === 'undefined') return;
  if (window.TCM_AI_ASSISTANT) return; // 防止重复注入

  // ═══ 自带 toast fallback ═══
  function toast(msg) {
    if (window.TCM && TCM.toast) { TCM.toast(msg); return; }
    var t = document.createElement('div');
    t.style.cssText = 'position:fixed;bottom:80px;right:20px;background:rgba(0,0,0,.8);color:#fff;padding:8px 16px;border-radius:8px;font-size:12px;z-index:99998;max-width:240px';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function() { t.remove(); }, 2500);
  }

  // ═══ 状态 ═══
  var state = {
    open: false,
    listening: false,
    recognition: null,
    synth: window.speechSynthesis || null,
    history: [],
    speaking: false,
  };

  // ═══ 语音识别初始化 ═══
  function initSpeech() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return false;
    state.recognition = new SR();
    state.recognition.lang = 'zh-CN';
    state.recognition.continuous = false;
    state.recognition.interimResults = false;
    state.recognition.onresult = function(e) {
      var text = e.results[0][0].transcript;
      var input = document.getElementById('ai-assistant-input');
      if (input) { input.value = text; input.focus(); }
      state.listening = false;
      updateMicBtn();
      toast('✅ 语音识别完成');
    };
    state.recognition.onerror = function(e) {
      state.listening = false;
      updateMicBtn();
      toast('⚠️ 语音识别失败：' + (e.error || '未知错误'));
    };
    state.recognition.onend = function() {
      state.listening = false;
      updateMicBtn();
    };
    return true;
  }

  function toggleVoice() {
    if (!state.recognition) {
      if (!initSpeech()) { toast('⚠️ 当前浏览器不支持语音识别'); return; }
    }
    if (state.listening) {
      state.recognition.stop();
      state.listening = false;
    } else {
      try {
        state.recognition.start();
        state.listening = true;
        toast('🎙️ 说吧，我在听');
      } catch (e) {
        toast('⚠️ 语音启动失败');
      }
    }
    updateMicBtn();
  }

  function updateMicBtn() {
    var btn = document.getElementById('ai-assistant-mic');
    if (!btn) return;
    if (state.listening) {
      btn.style.background = '#dc2626';
      btn.innerHTML = '🔴';
      btn.title = '正在录音，点击停止';
    } else {
      btn.style.background = '#b8860b';
      btn.innerHTML = '🎙️';
      btn.title = '语音输入';
    }
  }

  // ═══ TTS 朗读 ═══
  function speak(text) {
    if (!state.synth) return;
    if (state.speaking) { state.synth.cancel(); state.speaking = false; }
    var u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN';
    u.rate = 1.0;
    u.pitch = 1.0;
    u.onstart = function() { state.speaking = true; updateSpeakBtn(); };
    u.onend = function() { state.speaking = false; updateSpeakBtn(); };
    state.synth.speak(u);
  }

  function updateSpeakBtn() {
    // 可扩展朗读按钮状态
  }

  // ═══ KB 问答 ═══
  async function askAI() {
    var input = document.getElementById('ai-assistant-input');
    if (!input) return;
    var question = input.value.trim();
    if (!question) { toast('请输入问题'); return; }

    addChat('user', question);
    input.value = '';

    var thinkingId = addChat('ai', '🔄 正在查询知识库...');

    try {
      // 优先走 KB 搜索
      var r = await fetch('/api/tcm/kb/search?q=' + encodeURIComponent(question) + '&max=3');
      var d = await r.json();

      if (d.ok && d.results && d.results.length > 0) {
        var top = d.results[0];
        var answer = formatKBAnswer(top, d.results);
        updateChat(thinkingId, 'ai', answer, true);
        // 自动朗读
        // speak(top.title + '。' + (top.summary || top.content || '').slice(0, 100));
      } else {
        // 尝试方剂搜索
        var r2 = await fetch('/api/tcm/formula/search?q=' + encodeURIComponent(question));
        var d2 = await r2.json();
        if (d2.ok && d2.formulas && d2.formulas.length > 0) {
          var f = d2.formulas[0];
          updateChat(thinkingId, 'ai', '📖 匹配方剂：\n**' + (f.formula || f.syndrome) + '**\n' +
            (f.source ? '来源：' + f.source + '\n' : '') +
            (f.symptoms ? '适应症：' + f.symptoms.join('、') : ''));
        } else {
          // 尝试穴位搜索
          var r3 = await fetch('/api/tcm/acupoint/search?q=' + encodeURIComponent(question));
          var d3 = await r3.json();
          if (d3.ok && d3.count > 0) {
            var points = d3.points.slice(0, 3).map(function(p) {
              return '📍 ' + p.name + '（' + (p.meridian || '经外奇穴') + '）：' + (p.indications || []).join('、');
            }).join('\n');
            updateChat(thinkingId, 'ai', points, true);
          } else {
            updateChat(thinkingId, 'ai', '📚 知识库暂未收录「' + question + '」的相关内容。\n\n💡 您可以尝试：\n· 换用医学术语（如「归脾汤」「足三里」）\n· 描述症状（如「失眠」「头痛」）\n· 询问操作引导（如「如何开处方」）');
          }
        }
      }
    } catch (e) {
      // 离线引导
      updateChat(thinkingId, 'ai', getOfflineGuide(question), true);
    }

    // 记录历史
    state.history.push({ q: question, ts: new Date().toISOString() });
    if (state.history.length > 20) state.history.shift();
  }

  function formatKBAnswer(top, all) {
    var lines = [];
    // R759 高质量: 用 content(检索返回字段) + 提取 A 部分去 Q 冗余
    var body = String(top.content || top.summary || '');
    var qIdx = body.indexOf('\nA:');
    if (qIdx >= 0) body = body.slice(qIdx + 3);
    body = body.replace(/^\s*A:\s*/, '').replace(/\n注：AI 仅作为知识检索工具[^\n]*/g, '').trim();
    var headMatch = body.match(/【[^】]+】|^[^\n]{2,20}(?:汤|散|丸|饮|方|穴|证)/);
    var title = headMatch ? headMatch[0] : (top.title || '知识条目');
    lines.push('📚 ' + title);
    // R759 高质量: 去掉与标题重复的首行(【归脾汤】标题+正文重复)
    var bodyClean = body;
    if (headMatch) {
      var firstLine = body.split('\n')[0].trim();
      if (firstLine === title) bodyClean = body.split('\n').slice(1).join('\n').trim();
    }
    lines.push(bodyClean.slice(0, 240));
    if (top.confidence) lines.push('✅ 置信度：' + Math.round(top.confidence * 100) + '%');
    if (all.length > 1) lines.push('📋 还有 ' + (all.length - 1) + ' 条相关知识');
    return lines.join('\n');
  }

  function getOfflineGuide(question) {
    var guides = {
      '处方': '💡 **开处方流程**：\n1. 在「AI诊疗中心」完成问诊+四诊\n2. 查看双路诊断（KB+视觉）\n3. 点击「✅ 采纳」自动填入\n4. 加减修改后「💾 完成接诊」',
      '问诊': '💡 **怎么问诊**：\n1. 诊疗中心左侧写主诉\n2. 点快捷症状，或直接说\n3. 系统自动辨证\n4. 右侧看诊断结果',
      '舌诊': '💡 **舌诊操作**：\n1. 在诊疗中心点击「📷 开启摄像头」\n2. 切换到「舌诊」模式\n3. 将舌头对准扫描框\n4. 点击「📸 一键采集」',
      '搜索': '💡 **搜索功能**：\n· 搜索方剂：输入方名（如「归脾汤」）\n· 搜索穴位：输入穴名或症状\n· 搜索知识：输入中医术语',
    };
    for (var key in guides) {
      if (question.includes(key)) return guides[key];
    }
    return '📡 网络不可达。\n\n💡 您可以尝试以下操作引导：\n· 「如何开处方」\n· 「如何问诊」\n· 「舌诊操作」\n· 「搜索功能」';
  }

  // ═══ 聊天渲染 ═══
  function addChat(role, text) {
    var body = document.getElementById('ai-assistant-body');
    if (!body) return null;
    var msg = document.createElement('div');
    msg.className = 'ai-chat-msg ai-chat-' + role;
    msg.innerHTML = '<div class="ai-chat-text">' + escHTML(text).replace(/\n/g, '<br>') + '</div>';
    body.appendChild(msg);
    body.scrollTop = body.scrollHeight;
    return msg;
  }

  function updateChat(el, role, text, typewriter) {
    if (!el) return;
    el.className = 'ai-chat-msg ai-chat-' + role;
    var body = document.getElementById('ai-assistant-body');
    // R759 高质量: 打字机效果——长回复逐块渲染(体验提升, 短回复直接显示)
    if (typewriter && text.length > 30 && text.length < 800) {
      var chunks = chunkText(text, 6);
      var i = 0;
      el.innerHTML = '<div class="ai-chat-text"></div>';
      (function tick() {
        if (i >= chunks.length) { if (body) body.scrollTop = body.scrollHeight; return; }
        var partial = chunks.slice(0, i + 1).join('');
        var rendered = escHTML(partial)
          .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
          .replace(/\n/g, '<br>');
        el.querySelector('.ai-chat-text').innerHTML = rendered;
        if (body) body.scrollTop = body.scrollHeight;
        i++;
        setTimeout(tick, 12);
      })();
      return;
    }
    var rendered = escHTML(text)
      .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
      .replace(/\n/g, '<br>');
    el.innerHTML = '<div class="ai-chat-text">' + rendered + '</div>';
    if (body) body.scrollTop = body.scrollHeight;
  }

  // 按语义边界切块(标点/换行优先, 避免打断词语)
  function chunkText(text, chunkLen) {
    var chars = text.split('');
    var chunks = [];
    var cur = '';
    var i = 0;
    while (i < chars.length) {
      cur += chars[i];
      var isBoundary = /[。！？!?，,；;\n]/.test(chars[i]);
      if (cur.length >= chunkLen || (isBoundary && cur.length >= 2)) {
        chunks.push(cur); cur = '';
      }
      i++;
    }
    if (cur) chunks.push(cur);
    return chunks;
  }

  function escHTML(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ═══ 快捷操作 ═══
  var QUICK_ACTIONS = [
    { icon: '🔍', label: '辨证指南', q: '如何进行辨证论治？' },
    { icon: '💊', label: '方剂搜索', q: '归脾汤' },
    { icon: '📍', label: '穴位查询', q: '足三里' },
    { icon: '📋', label: '开处方', q: '处方' },
    { icon: '📚', label: 'KB搜索', q: '气血亏虚' },
    // R760 缺口补齐：手诊快捷入口
    { icon: '🖐', label: '手诊辨证', q: '掌色苍白' },
    { icon: '👶', label: '小儿指纹', q: '小儿指纹透关射甲' },
  ];

  // ═══ 注入 UI ═══
  function injectUI() {
    if (document.getElementById('ai-assistant-fab')) return; // 已注入

    // CSS
    var css = `
#ai-assistant-fab{position:fixed;bottom:20px;right:20px;width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#b8860b,#92400e);color:#fff;font-size:22px;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 16px rgba(184,134,11,.35);z-index:99997;transition:transform .2s;border:none}
#ai-assistant-fab:hover{transform:scale(1.08)}
#ai-assistant-fab.active{transform:scale(.9)}
#ai-assistant-panel{position:fixed;bottom:80px;right:20px;width:360px;max-width:calc(100vw - 40px);height:480px;max-height:calc(100vh - 120px);background:#fff;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,.12);z-index:99998;display:none;flex-direction:column;overflow:hidden;border:1px solid #e5e7eb}
#ai-assistant-panel.open{display:flex}
.ai-assistant-header{background:linear-gradient(135deg,#b8860b,#92400e);color:#fff;padding:10px 14px;display:flex;align-items:center;gap:8px}
.ai-assistant-header .ah-title{font-size:14px;font-weight:700;flex:1}
.ai-assistant-header .ah-close{background:none;border:none;color:#fff;font-size:18px;cursor:pointer;padding:4px}
.ai-assistant-header .ah-tts{background:rgba(255,255,255,.2);border:none;color:#fff;font-size:12px;padding:3px 8px;border-radius:4px;cursor:pointer}
.ai-assistant-body{flex:1;overflow-y:auto;padding:10px;background:#f9fafb}
.ai-chat-msg{margin-bottom:8px;max-width:88%}
.ai-chat-user{margin-left:auto;text-align:right}
.ai-chat-ai{margin-right:auto}
.ai-chat-text{display:inline-block;padding:8px 12px;border-radius:12px;font-size:12px;line-height:1.5}
.ai-chat-user .ai-chat-text{background:#dbeafe;color:#1e40af;border-bottom-right-radius:4px}
.ai-chat-ai .ai-chat-text{background:#fef3c7;color:#92400e;border-bottom-left-radius:4px}
.ai-assistant-quick{display:flex;gap:4px;flex-wrap:wrap;padding:6px 10px;background:#fff;border-bottom:1px solid #e5e7eb}
.ai-quick-btn{padding:3px 8px;border-radius:6px;font-size:10px;cursor:pointer;background:#f3f4f6;color:#6b7280;border:1px solid #e5e7eb;white-space:nowrap}
.ai-quick-btn:hover{background:#fef3c7;color:#92400e;border-color:#b8860b}
.ai-assistant-input-bar{display:flex;gap:6px;padding:8px 10px;background:#fff;border-top:1px solid #e5e7eb}
#ai-assistant-input{flex:1;padding:8px 12px;border:1px solid #d1d5db;border-radius:20px;font-size:12px;outline:none}
#ai-assistant-input:focus{border-color:#b8860b;box-shadow:0 0 0 2px rgba(184,134,11,.1)}
#ai-assistant-send{background:#b8860b;color:#fff;border:none;border-radius:50%;width:34px;height:34px;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center}
#ai-assistant-send:hover{background:#92400e}
#ai-assistant-mic{background:#b8860b;color:#fff;border:none;border-radius:50%;width:34px;height:34px;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s}
.ai-assistant-footer{padding:4px 10px;font-size:9px;color:#9ca3af;text-align:center;background:#fff}
@media(max-width:360px){
  #ai-assistant-panel{width:calc(100vw - 20px);right:10px;bottom:70px}
  #ai-assistant-fab{bottom:15px;right:15px}
}
    `;
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    // 浮窗按钮
    var fab = document.createElement('button');
    fab.id = 'ai-assistant-fab';
    fab.setAttribute('aria-label', 'AI 助手');
    fab.innerHTML = '🤖';
    fab.onclick = togglePanel;
    document.body.appendChild(fab);

    // 面板
    var panel = document.createElement('div');
    panel.id = 'ai-assistant-panel';
    panel.innerHTML = `
      <div class="ai-assistant-header">
        <span style="font-size:18px">🤖</span>
        <span class="ah-title">AI 诊疗助手</span>
        <button class="ah-tts" onclick="window.__aiAssistToggleTTS()" id="ai-tts-btn" title="点击切换语音朗读">🔊 朗读</button>
        <button class="ah-close" onclick="window.__aiAssistClose()" aria-label="关闭">×</button>
      </div>
      <div class="ai-assistant-body" id="ai-assistant-body" role="log" aria-live="polite">
        <div class="ai-chat-msg ai-chat-ai">
          <div class="ai-chat-text">有什么想查的？\n\n📚 中医知识\n💊 方剂\n📍 穴位\n💡 操作引导\n\n直接输入问题就行。</div>
        </div>
      </div>
      <div class="ai-assistant-quick" id="ai-assistant-quick"></div>
      <div class="ai-assistant-input-bar">
        <input type="text" id="ai-assistant-input" placeholder="输入问题..." aria-label="AI助手输入框"
          onkeydown="if(event.key==='Enter')window.__aiAssistAsk()">
        <button id="ai-assistant-mic" onclick="window.__aiAssistVoice()" title="语音输入" aria-label="语音输入">🎙️</button>
        <button id="ai-assistant-send" onclick="window.__aiAssistAsk()" title="发送" aria-label="发送">➤</button>
      </div>
      <div class="ai-assistant-footer">基于自有知识库 · 仅供参考 · RBAC 权限控制</div>
    `;
    document.body.appendChild(panel);

    // 快捷按钮
    var quickEl = document.getElementById('ai-assistant-quick');
    QUICK_ACTIONS.forEach(function(a) {
      var btn = document.createElement('span');
      btn.className = 'ai-quick-btn';
      btn.textContent = a.icon + ' ' + a.label;
      btn.onclick = function() {
        var input = document.getElementById('ai-assistant-input');
        input.value = a.q;
        window.__aiAssistAsk();
      };
      quickEl.appendChild(btn);
    });
  }

  function togglePanel() {
    state.open = !state.open;
    var panel = document.getElementById('ai-assistant-panel');
    var fab = document.getElementById('ai-assistant-fab');
    if (state.open) {
      panel.classList.add('open');
      fab.classList.add('active');
      var input = document.getElementById('ai-assistant-input');
      if (input) setTimeout(function() { input.focus(); }, 100);
    } else {
      panel.classList.remove('open');
      fab.classList.remove('active');
    }
  }

  // ═══ 全局暴露 ═══
  window.__aiAssistAsk = askAI;
  window.__aiAssistVoice = toggleVoice;
  window.__aiAssistClose = function() { state.open = false; document.getElementById('ai-assistant-panel').classList.remove('open'); document.getElementById('ai-assistant-fab').classList.remove('active'); };
  window.__aiAssistToggleTTS = function() {
    if (state.speaking) { state.synth.cancel(); state.speaking = false; }
    var btn = document.getElementById('ai-tts-btn');
    btn.textContent = btn.textContent.includes('🔊') ? '🔇 关闭' : '🔊 朗读';
    toast(btn.textContent.includes('🔊') ? '朗读已开启' : '朗读已关闭');
  };

  window.TCM_AI_ASSISTANT = true;

  // ═══ 自动注入 ═══
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectUI);
  } else {
    injectUI();
  }
})();
