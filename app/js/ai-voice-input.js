/**
 * AI 助手 ASR 语音输入模块
 * 基于 Web Speech API (webkitSpeechRecognition)
 * 兼容 Chrome/Edge/Safari
 *
 * 功能：
 * - 麦克风按钮（浮动 FAB，右下角，金色主题）
 * - 点击切换 listening 状态（脉冲动画 + 红色）
 * - 识别结果实时显示在输入框
 * - 识别中显示"正在听…"状态提示
 * - 超时 10s 自动停止
 * - 浏览器不支持时静默隐藏按钮
 *
 * 健壮性：
 * - 所有 SpeechRecognition 事件 try/catch
 * - 不支持时静默降级（按钮不显示）
 * - 权限拒绝时提示用户（toast，不用 alert）
 * - 识别错误时自动回退到手动输入
 */
(function () {
  'use strict';

  // ===== 常量 =====
  var TIMEOUT_MS = 10000;          // 10s 超时自动停止
  var SUPPORTED = typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  // ===== 状态 =====
  var recognition = null;
  var isListening = false;
  var timeoutTimer = null;
  var fabBtn = null;
  var inlineBtn = null;
  var inputBox = null;
  var statusTip = null;
  var finalText = '';

  // ===== DOM 查找辅助 =====
  function _findInputBox() {
    return document.getElementById('box') ||
           document.querySelector('.input input[type="text"]') ||
           document.querySelector('input[placeholder*="输入"]');
  }

  function _findInlineMic() {
    return document.getElementById('mic') ||
           document.querySelector('.input .mic');
  }

  // ===== Toast 提示（兼容 ui-toast.js 或内联降级）=====
  function _toast(msg, type) {
    try {
      if (typeof showToast === 'function') { showToast(msg, type); return; }
      if (typeof toast === 'function') { toast(msg); return; }
    } catch (e) { /* ignore */ }
    // 内联降级 toast
    try {
      var t = document.createElement('div');
      t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);' +
        'padding:8px 20px;background:rgba(0,0,0,.85);color:#fff;border-radius:20px;' +
        'font-size:13px;z-index:10000;pointer-events:none;transition:opacity .3s';
      t.textContent = msg;
      document.body.appendChild(t);
      setTimeout(function () {
        t.style.opacity = '0';
        setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 300);
      }, 2500);
    } catch (e) { /* ignore */ }
  }

  // ===== 创建浮动 FAB 按钮 =====
  function _createFAB() {
    if (fabBtn) return fabBtn;
    try {
      fabBtn = document.createElement('button');
      fabBtn.id = 'aiVoiceFAB';
      fabBtn.setAttribute('aria-label', '语音输入');
      fabBtn.setAttribute('title', '点击说话，再次点击结束');
      fabBtn.style.cssText = [
        'position:fixed',
        'bottom:72px',
        'right:20px',
        'width:52px',
        'height:52px',
        'border-radius:50%',
        'border:none',
        'background:linear-gradient(135deg,#c9a84c,#a08030)',
        'color:#fff',
        'font-size:22px',
        'cursor:pointer',
        'z-index:9998',
        'box-shadow:0 4px 16px rgba(201,168,76,.4)',
        'transition:all .25s',
        'display:flex',
        'align-items:center',
        'justify-content:center',
        'line-height:1',
        '-webkit-tap-highlight-color:transparent'
      ].join(';');
      fabBtn.innerHTML = '🎤';

      fabBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        _toggle();
      });

      document.body.appendChild(fabBtn);
    } catch (e) {
      console.warn('[ai-voice-input] FAB create err', e);
    }
    return fabBtn;
  }

  // ===== 创建状态提示 =====
  function _createStatusTip() {
    if (statusTip) return statusTip;
    try {
      statusTip = document.createElement('div');
      statusTip.id = 'aiVoiceStatus';
      statusTip.style.cssText = [
        'position:fixed',
        'bottom:132px',
        'right:20px',
        'padding:6px 14px',
        'background:rgba(231,76,60,.15)',
        'border:1px solid rgba(231,76,60,.4)',
        'border-radius:20px',
        'color:#e74c3c',
        'font-size:12px',
        'z-index:9998',
        'pointer-events:none',
        'opacity:0',
        'transition:opacity .3s',
        'white-space:nowrap'
      ].join(';');
      statusTip.textContent = '🎤 正在听…';
      document.body.appendChild(statusTip);
    } catch (e) { /* ignore */ }
    return statusTip;
  }

  // ===== 添加脉冲动画样式 =====
  function _injectStyles() {
    if (document.getElementById('ai-voice-input-style')) return;
    try {
      var s = document.createElement('style');
      s.id = 'ai-voice-input-style';
      s.textContent = [
        '@keyframes aiVoicePulse {',
        '  0% { box-shadow: 0 0 0 0 rgba(231,76,60,.5), 0 4px 16px rgba(201,168,76,.4); }',
        '  70% { box-shadow: 0 0 0 18px rgba(231,76,60,0), 0 4px 16px rgba(201,168,76,.4); }',
        '  100% { box-shadow: 0 0 0 0 rgba(231,76,60,0), 0 4px 16px rgba(201,168,76,.4); }',
        '}',
        '#aiVoiceFAB.listening {',
        '  background:linear-gradient(135deg,#e74c3c,#c0392b) !important;',
        '  animation:aiVoicePulse 1.4s infinite;',
        '}',
        '#aiVoiceFAB:hover { transform:scale(1.08); }',
        '#aiVoiceFAB.listening:hover { transform:scale(1.12); }',
        '@media(max-width:768px){ #aiVoiceFAB{ bottom:64px; right:14px; width:46px; height:46px; font-size:20px; } }',
        '@media(max-width:480px){ #aiVoiceFAB{ bottom:60px; right:12px; width:44px; height:44px; font-size:18px; } }'
      ].join('\n');
      document.head.appendChild(s);
    } catch (e) { /* ignore */ }
  }

  // ===== 初始化 SpeechRecognition =====
  function _initRecognition() {
    if (!SUPPORTED) return null;
    try {
      var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      var r = new SR();
      r.lang = 'zh-CN';
      r.continuous = false;
      r.interimResults = true;
      r.maxAlternatives = 3;
      return r;
    } catch (e) {
      console.warn('[ai-voice-input] init recognition err', e);
      return null;
    }
  }

  // ===== 开始监听 =====
  function _startListening() {
    if (isListening) return;
    recognition = _initRecognition();
    if (!recognition) {
      _toast('浏览器不支持语音输入，请使用 Chrome 或 Edge', 'warning');
      return;
    }

    finalText = '';
    isListening = true;

    // UI 切换为 listening 状态
    _setListeningUI(true);

    // 超时定时器
    clearTimeout(timeoutTimer);
    timeoutTimer = setTimeout(function () {
      try { recognition.stop(); } catch (e) { /* ignore */ }
      _stopListening();
    }, TIMEOUT_MS);

    // ===== 事件处理（全部 try/catch）=====

    recognition.onstart = function () {
      try {
        isListening = true;
        _setListeningUI(true);
      } catch (e) { /* ignore */ }
    };

    recognition.onresult = function (event) {
      try {
        var interim = '';
        for (var i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalText += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        // 实时显示在输入框
        if (inputBox) {
          inputBox.value = finalText + interim;
          // 输入框获焦 + 光标移到末尾
          try { inputBox.focus(); inputBox.setSelectionRange(inputBox.value.length, inputBox.value.length); } catch (e) { /* ignore */ }
        }
      } catch (e) { /* ignore */ }
    };

    recognition.onerror = function (event) {
      try {
        var errMsg = '';
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          errMsg = '麦克风权限被拒绝，请在浏览器设置中允许';
        } else if (event.error === 'no-speech') {
          errMsg = '未检测到语音，请重试';
        } else if (event.error === 'network') {
          errMsg = '网络错误，请检查连接';
        } else if (event.error === 'aborted') {
          errMsg = '';  // 主动中止，不提示
        } else if (event.error === 'audio-capture') {
          errMsg = '麦克风硬件错误，请检查设备';
        } else if (event.error === 'language-not-supported') {
          errMsg = '当前语言不被支持';
        } else {
          errMsg = '语音识别出错：' + event.error;
        }
        if (errMsg) _toast(errMsg, 'error');
      } catch (e) { /* ignore */ }
      _stopListening();
    };

    recognition.onend = function () {
      try {
        // 如果有识别结果，填入输入框（确保最终文本已写入）
        if (finalText.trim() && inputBox) {
          inputBox.value = finalText.trim();
        }
      } catch (e) { /* ignore */ }
      _stopListening();

      // 识别结束后，如果输入框有内容，自动触发发送
      if (finalText.trim() && inputBox && inputBox.value.trim()) {
        try {
          // 调用全局 send 函数（ai-assistant-inline.js 中定义）
          if (typeof window.send === 'function') {
            window.send(finalText.trim());
          } else if (typeof send === 'function') {
            send(finalText.trim());
          }
        } catch (e) {
          console.warn('[ai-voice-input] auto-send err', e);
        }
      }
    };

    // 启动
    try {
      recognition.start();
    } catch (e) {
      console.warn('[ai-voice-input] start err', e);
      _toast('无法启动语音识别，请重试', 'error');
      _stopListening();
    }
  }

  // ===== 停止监听 =====
  function _stopListening() {
    isListening = false;
    clearTimeout(timeoutTimer);
    timeoutTimer = null;

    // UI 复位
    _setListeningUI(false);

    // 停止 recognition（如果还在运行）
    if (recognition) {
      try { recognition.stop(); } catch (e) { /* ignore */ }
      recognition = null;
    }
  }

  // ===== 切换 UI 状态 =====
  function _setListeningUI(listening) {
    try {
      // FAB 按钮
      if (fabBtn) {
        if (listening) {
          fabBtn.classList.add('listening');
          fabBtn.innerHTML = '🔴';
          fabBtn.setAttribute('title', '点击停止');
        } else {
          fabBtn.classList.remove('listening');
          fabBtn.innerHTML = '🎤';
          fabBtn.setAttribute('title', '点击说话');
        }
      }

      // 内联麦克风按钮
      if (inlineBtn) {
        if (listening) {
          inlineBtn.dataset.on = '1';
          inlineBtn.classList.add('on');
          inlineBtn.textContent = '🔴';
          inlineBtn.style.transform = 'scale(1.2)';
        } else {
          inlineBtn.dataset.on = '';
          inlineBtn.classList.remove('on');
          inlineBtn.textContent = '🎤';
          inlineBtn.style.transform = '';
        }
      }

      // 输入框 placeholder
      if (inputBox) {
        if (listening) {
          inputBox.placeholder = '🎤 正在听…';
          inputBox.style.borderColor = 'rgba(231,76,60,0.4)';
        } else {
          inputBox.placeholder = '输入问题...';
          inputBox.style.borderColor = '';
        }
      }

      // 状态提示
      if (statusTip) {
        statusTip.style.opacity = listening ? '1' : '0';
        statusTip.textContent = listening ? '🎤 正在听…' : '';
      }
    } catch (e) { /* ignore */ }
  }

  // ===== 切换开始/停止 =====
  function _toggle() {
    if (isListening) {
      _stopListening();
    } else {
      _startListening();
    }
  }

  // ===== 暴露全局接口 =====
  window.AIVoiceInput = {
    start: function () { _startListening(); },
    stop: function () { _stopListening(); },
    toggle: function () { _toggle(); },
    isListening: function () { return isListening; },
    isSupported: function () { return !!SUPPORTED; },
    getVersion: function () { return '1.0.0'; }
  };

  // ===== 初始化 =====
  function _init() {
    if (!SUPPORTED) {
      // 浏览器不支持 → 静默不显示
      return;
    }

    // 查找输入框
    inputBox = _findInputBox();
    if (!inputBox) {
      // 输入框不存在 → 延迟重试
      setTimeout(_init, 1000);
      return;
    }

    // 查找内联麦克风按钮
    inlineBtn = _findInlineMic();

    // 注入样式
    _injectStyles();

    // 创建状态提示
    _createStatusTip();

    // 创建 FAB（仅当内联麦克风按钮不存在时创建浮动按钮）
    // 如果已有内联 mic 按钮，则增强它；否则创建 FAB
    if (!inlineBtn) {
      _createFAB();
    } else {
      // 增强已有内联按钮：绑定点击事件
      inlineBtn.addEventListener('click', function (e) {
        // 阻止原有 voice() 函数的调用（通过 stopPropagation）
        e.preventDefault();
        e.stopPropagation();
        _toggle();
      }, true);  // capture phase 优先拦截
    }
  }

  // DOM Ready 初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(_init, 500);  // 等其他脚本先加载
    });
  } else {
    setTimeout(_init, 500);
  }

  // 二次延迟初始化（确保动态加载的 DOM 已就绪）
  setTimeout(function () {
    if (!fabBtn && !inlineBtn) { _init(); }
  }, 2000);
  setTimeout(function () {
    if (!fabBtn && !inlineBtn) { _init(); }
  }, 5000);

})();
