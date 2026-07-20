/**
 * voice-interaction.js — AI助手语音交互模块
 * 功能：语音朗读(TTS) + 语音输入(STT) + 语音对话模式
 * 依赖：后端 /api/tts 代理到 Python TTS 服务(8912)
 */
(function(){
'use strict';

// ============================
// 配置
// ============================
const API_BASE = (location.hostname === '127.0.0.1' || location.hostname === 'localhost')
  ? 'http://127.0.0.1:8920' : '';
const TTS_URL = API_BASE + '/api/tts';
const VOICES_URL = API_BASE + '/api/voices';

// ============================
// 状态
// ============================
let currentAudio = null;
let currentUtterance = null;
let isPlaying = false;
let isPaused = false;
let autoplayQueue = [];
let voiceMode = false; // 语音对话模式
let recognition = null;
let voicesLoaded = false;
let selectedVoice = 'female';

// ============================
// Web Speech API (STT) 初始化
// ============================
function initSTT() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    console.warn('[Voice] 浏览器不支持语音识别');
    return false;
  }
  recognition = new SR();
  recognition.lang = 'zh-CN';
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.onresult = function(e) {
    let finalTranscript = '';
    let interimTranscript = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const transcript = e.results[i][0].transcript;
      if (e.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }
    if (interimTranscript) {
      updateInputBox(interimTranscript);
    }
    if (finalTranscript) {
      updateInputBox(finalTranscript);
      // 自动发送
      setTimeout(function() {
        const btn = document.querySelector('.send') || document.getElementById('sendBtn');
        if (btn) btn.click();
      }, 300);
    }
  };
  recognition.onerror = function(e) {
    console.error('[Voice] STT错误:', e.error);
    hideListeningIndicator();
  };
  recognition.onend = function() {
    recognition.isStarted = false;
    hideListeningIndicator();
    // 通知外部监听器（页面级 UI 复位）
    if (typeof window.__onVoiceEnd === 'function') {
      try { window.__onVoiceEnd(); } catch(e) { console.warn(e); }
    }
    // 派发自定义事件
    window.dispatchEvent(new CustomEvent('voice:end'));
  };
  recognition.onstart = function() {
    recognition.isStarted = true;
    showListeningIndicator();
  };
  return true;
}

function updateInputBox(text) {
  const box = document.getElementById('box') || document.getElementById('input') || document.querySelector('input[type="text"]');
  if (box) {
    box.value = text;
    box.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

// ============================
// 语音朗读 (TTS)
// ============================

/**
 * 朗读文本 — 优先后端 TTS，降级浏览器 SpeechSynthesis
 */
function speak(text, opts) {
  opts = opts || {};
  if (!text || typeof text !== 'string') return;

  // 清理 HTML 标签
  text = text.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/gi, ' ').trim();
  if (text.length < 2) return;

  // 截断过长文本（TTS 限制）
  if (text.length > 500) {
    text = text.substring(0, 497) + '...';
  }

  stopSpeaking();

  // 尝试后端 TTS
  fetchTTS(text, opts.voice || selectedVoice).then(function(audioBlob) {
    playAudioBlob(audioBlob, text);
  }).catch(function(err) {
    console.warn('[Voice] 后端TTS不可用，降级浏览器朗读:', err);
    browserSpeak(text);
  });
}

/**
 * 从后端获取 TTS 音频
 */
function fetchTTS(text, voice) {
  return new Promise(function(resolve, reject) {
    const url = TTS_URL + '?text=' + encodeURIComponent(text) + '&voice=' + encodeURIComponent(voice || 'female');
    fetch(url).then(function(r) {
      if (!r.ok) throw new Error('TTS HTTP ' + r.status);
      return r.blob();
    }).then(function(blob) {
      if (blob.size < 100) throw new Error('TTS 返回数据过小');
      resolve(blob);
    }).catch(reject);
  });
}

/**
 * 播放音频 Blob
 */
function playAudioBlob(blob, text) {
  const url = URL.createObjectURL(blob);
  currentAudio = new Audio(url);
  currentAudio.onplay = function() {
    isPlaying = true;
    isPaused = false;
    updateVoiceUI();
  };
  currentAudio.onended = function() {
    isPlaying = false;
    isPaused = false;
    URL.revokeObjectURL(url);
    currentAudio = null;
    updateVoiceUI();
    // 自动播放队列中的下一条
    if (autoplayQueue.length > 0) {
      const next = autoplayQueue.shift();
      speak(next.text, next.opts);
    }
  };
  currentAudio.onerror = function() {
    console.error('[Voice] 音频播放失败');
    isPlaying = false;
    URL.revokeObjectURL(url);
    currentAudio = null;
    updateVoiceUI();
    // 降级到浏览器 TTS
    browserSpeak(text);
  };
  currentAudio.play().catch(function(e) {
    console.warn('[Voice] 自动播放被阻止:', e);
    isPlaying = false;
    updateVoiceUI();
  });
}

/**
 * 浏览器内置 SpeechSynthesis 降级方案
 */
function browserSpeak(text) {
  if (!('speechSynthesis' in window)) {
    console.warn('[Voice] 浏览器不支持语音合成');
    return;
  }
  window.speechSynthesis.cancel();
  currentUtterance = new SpeechSynthesisUtterance(text);
  currentUtterance.lang = 'zh-CN';
  currentUtterance.rate = 0.95;
  currentUtterance.pitch = 1;

  // 选中文语音
  const voices = window.speechSynthesis.getVoices();
  const zhVoice = voices.find(function(v) { return v.lang.startsWith('zh'); });
  if (zhVoice) currentUtterance.voice = zhVoice;

  currentUtterance.onstart = function() {
    isPlaying = true;
    isPaused = false;
    updateVoiceUI();
  };
  currentUtterance.onend = function() {
    isPlaying = false;
    isPaused = false;
    currentUtterance = null;
    updateVoiceUI();
    if (autoplayQueue.length > 0) {
      const next = autoplayQueue.shift();
      speak(next.text, next.opts);
    }
  };
  window.speechSynthesis.speak(currentUtterance);
}

/**
 * 停止朗读
 */
function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  isPlaying = false;
  isPaused = false;
  autoplayQueue = [];
  updateVoiceUI();
}

/**
 * 暂停/继续
 */
function togglePause() {
  if (currentAudio) {
    if (isPaused) {
      currentAudio.play();
      isPaused = false;
    } else {
      currentAudio.pause();
      isPaused = true;
    }
    updateVoiceUI();
  } else if ('speechSynthesis' in window) {
    if (isPaused) {
      window.speechSynthesis.resume();
      isPaused = false;
    } else {
      window.speechSynthesis.pause();
      isPaused = true;
    }
    updateVoiceUI();
  }
}

// ============================
// 语音输入 (STT)
// ============================
function startListening() {
  if (!recognition) {
    if (!initSTT()) {
      showToast('浏览器不支持语音输入，请使用 Chrome/Edge');
      return;
    }
  }
  try {
    recognition.start();
    showListeningIndicator();
    window.dispatchEvent(new CustomEvent('voice:start'));
  } catch (e) {
    console.warn('[Voice] STT 已在运行:', e);
  }
}

function stopListening() {
  if (recognition) {
    recognition.stop();
  }
  hideListeningIndicator();
}

// ============================
// 语音模式切换
// ============================
function toggleVoiceMode() {
  voiceMode = !voiceMode;
  if (voiceMode) {
    document.body.classList.add('voice-mode-active');
    showToast('🎤 语音对话模式已开启');
  } else {
    document.body.classList.remove('voice-mode-active');
    stopSpeaking();
    stopListening();
    showToast('🎤 语音对话模式已关闭');
  }
}

// ============================
// UI 更新
// ============================
function updateVoiceUI() {
  const playBtn = document.getElementById('voice-play');
  const stopBtn = document.getElementById('voice-stop');
  if (playBtn) {
    playBtn.classList.toggle('active', isPlaying);
    playBtn.title = isPlaying ? (isPaused ? '继续朗读' : '暂停朗读') : '朗读最后回复';
  }
  if (stopBtn) {
    stopBtn.style.display = isPlaying ? 'flex' : 'none';
  }
}

function showListeningIndicator() {
  let indicator = document.getElementById('voice-listening');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.id = 'voice-listening';
    indicator.style.cssText = 'position:fixed;bottom:70px;left:50%;transform:translateX(-50%);background:rgba(201,168,76,0.15);border:1px solid var(--gold,#c9a84c);border-radius:20px;padding:8px 16px;font-size:12px;color:var(--gold,#c9a84c);z-index:9999;display:flex;align-items:center;gap:8px;backdrop-filter:blur(8px)';
    indicator.innerHTML = '<span class="pulse-dot"></span> 正在聆听...';
    document.body.appendChild(indicator);
  }
  indicator.style.display = 'flex';
}

function hideListeningIndicator() {
  const indicator = document.getElementById('voice-listening');
  if (indicator) indicator.style.display = 'none';
}

function showToast(msg) {
  let toast = document.getElementById('voice-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'voice-toast';
    toast.style.cssText = 'position:fixed;top:50px;left:50%;transform:translateX(-50%);background:rgba(8,8,8,0.9);color:#c9a84c;border:1px solid rgba(201,168,76,0.3);border-radius:8px;padding:8px 14px;font-size:12px;z-index:9999;opacity:0;transition:opacity .2s';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  setTimeout(function() { toast.style.opacity = '0'; }, 2000);
}

// ============================
// 注入语音工具栏
// ============================
function injectVoiceToolbar() {
  // 检查是否已注入
  if (document.getElementById('voice-toolbar')) return;

  const toolbar = document.createElement('div');
  toolbar.id = 'voice-toolbar';
  toolbar.style.cssText = 'display:flex;align-items:center;gap:4px;padding:0 4px';
  toolbar.innerHTML = [
    '<button id="voice-mic" title="语音输入" style="background:none;border:1px solid rgba(201,168,76,0.2);border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:14px;color:#c9a84c;transition:all .15s">🎤</button>',
    '<button id="voice-play" title="朗读回复" style="background:none;border:1px solid rgba(201,168,76,0.2);border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:14px;color:#c9a84c;transition:all .15s">🔊</button>',
    '<button id="voice-stop" title="停止朗读" style="background:none;border:1px solid rgba(201,168,76,0.2);border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:14px;color:#c9a84c;transition:all .15s;display:none">⏹</button>',
    '<button id="voice-mode" title="语音对话模式" style="background:none;border:1px solid rgba(201,168,76,0.2);border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:14px;color:#c9a84c;transition:all .15s">💬</button>'
  ].join('');

  // 插入到输入栏区域
  const inputBar = document.querySelector('.input-bar') || document.querySelector('.input') || document.querySelector('#input-bar');
  if (inputBar) {
    inputBar.insertBefore(toolbar, inputBar.firstChild);
  } else {
    // 备选：插入到发送按钮前
    const sendBtn = document.querySelector('.send');
    if (sendBtn && sendBtn.parentNode) {
      sendBtn.parentNode.insertBefore(toolbar, sendBtn);
    }
  }

  // 绑定事件
  document.getElementById('voice-mic').addEventListener('click', function() {
    if (recognition && recognition.isStarted) {
      stopListening();
    } else {
      startListening();
    }
  });

  document.getElementById('voice-play').addEventListener('click', function() {
    if (isPlaying) {
      togglePause();
    } else {
      // 朗读最后一条助手回复
      const msgs = document.querySelectorAll('.msg-ai, .assistant-msg, [data-role="assistant"]');
      if (msgs.length > 0) {
        const lastMsg = msgs[msgs.length - 1];
        speak(lastMsg.textContent);
      } else {
        showToast('没有可朗读的内容');
      }
    }
  });

  document.getElementById('voice-stop').addEventListener('click', stopSpeaking);

  document.getElementById('voice-mode').addEventListener('click', toggleVoiceMode);

  // 添加 pulse 动画
  if (!document.getElementById('voice-pulse-style')) {
    const style = document.createElement('style');
    style.id = 'voice-pulse-style';
    style.textContent = [
      '@keyframes voice-pulse{0%,100%{opacity:1}50%{opacity:.3}}',
      '.pulse-dot{width:8px;height:8px;background:#c9a84c;border-radius:50%;display:inline-block;animation:voice-pulse 1s infinite}',
      '#voice-mic.listening{background:rgba(201,168,76,0.2)!important;border-color:#c9a84c!important;animation:voice-pulse 1s infinite}',
      '#voice-play.active{background:rgba(201,168,76,0.15)!important}',
      'body.voice-mode-active #voice-mode{background:rgba(201,168,76,0.2)!important;border-color:#c9a84c!important}'
    ].join('\n');
    document.head.appendChild(style);
  }

  // 监听 STT 状态更新 mic 按钮（如果存在 voice-mic 元素）
  if (recognition && document.getElementById('voice-mic')) {
    const oldOnStart = recognition.onstart;
    const oldOnEnd = recognition.onend;
    recognition.onstart = function(e) {
      recognition.isStarted = true;  // 确保状态标记
      if (oldOnStart) oldOnStart(e);
      const vm = document.getElementById('voice-mic');
      if (vm) vm.classList.add('listening');
    };
    recognition.onend = function(e) {
      recognition.isStarted = false;  // 强制设回 false
      if (oldOnEnd) oldOnEnd(e);
      const vm = document.getElementById('voice-mic');
      if (vm) vm.classList.remove('listening');
    };
  }
}

// ============================
// 自动朗读钩子
// ============================
function hookAutoSpeak() {
  // 监听 DOM 变化，当新的助手消息出现时自动朗读（仅在语音模式下）
  const observer = new MutationObserver(function(mutations) {
    if (!voiceMode) return;
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === 1 && (
          node.classList.contains('msg-ai') ||
          node.classList.contains('assistant-msg') ||
          node.getAttribute('data-role') === 'assistant'
        )) {
          speak(node.textContent);
        }
      }
    }
  });
  const chatArea = document.querySelector('.chat') || document.querySelector('#chat') || document.querySelector('.messages');
  if (chatArea) {
    observer.observe(chatArea, { childList: true, subtree: true });
  }
}

// ============================
// 对外接口
// ============================
window.VoiceInteraction = {
  speak: speak,
  stop: stopSpeaking,
  pause: togglePause,
  startListening: startListening,
  stopListening: stopListening,
  toggleVoiceMode: toggleVoiceMode,
  isPlaying: function() { return isPlaying; },
  isListening: function() { return recognition && recognition.isStarted; },
  setVoice: function(v) { selectedVoice = v; },
  getVoices: function() {
    return fetch(VOICES_URL).then(function(r) { return r.json(); });
  }
};

// 兼容旧接口
window.speakText = speak;
window.playSound = function(type) {
  if (type === 'stop') stopSpeaking();
};

// ============================
// 初始化
// ============================
function init() {
  initSTT();
  injectVoiceToolbar();
  hookAutoSpeak();
  console.log('[Voice] 语音交互模块已加载');
}

// DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})();
