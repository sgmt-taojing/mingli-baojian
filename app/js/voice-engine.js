/**
 * ═══════════════════════════════════════════════════════════════
 *  命理宝鉴 · 语音交互引擎（Voice Interaction Engine）
 *  版本: v1.0 (2026-08-08 R477)
 *  能力:
 *    1. 语音识别（Web Speech API + 回退到文字输入）
 *    2. 语音合成（浏览器 TTS + 后端 Edge-TTS 8912）
 *    3. 语音指令路由（唤醒词 → 命令解析 → 执行）
 *    4. 语音 + 文字双模态切换
 * ═══════════════════════════════════════════════════════════════
 */

(function (global) {
  'use strict';
  
  const API = (location.hostname === '127.0.0.1' || location.hostname === 'localhost')
    ? 'http://127.0.0.1:8920' : '';
  
  // ── 状态 ─────────────────────────────────────
  const state = {
    listening: false,
    speaking: false,
    recognition: null,
    synth: window.speechSynthesis || null,
    voices: [],
    preferredVoice: null,
    mode: 'auto',          // auto | voice | text
    wakeWord: '小鉴',      // 唤醒词
    commands: new Map(),
  };
  
  // ── 初始化 ───────────────────────────────────
  function init(opts = {}) {
    if (opts.wakeWord) state.wakeWord = opts.wakeWord;
    if (opts.mode) state.mode = opts.mode;
    
    // 加载语音合成
    if (state.synth) {
      const loadVoices = () => {
        state.voices = state.synth.getVoices().filter(v => v.lang.startsWith('zh'));
        state.preferredVoice = state.voices.find(v => v.lang === 'zh-CN') || state.voices[0];
      };
      loadVoices();
      state.synth.onvoiceschanged = loadVoices;
    }
    
    // 初始化语音识别
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      state.recognition = new SR();
      state.recognition.lang = 'zh-CN';
      state.recognition.continuous = false;
      state.recognition.interimResults = true;
      state.recognition.onresult = handleRecognitionResult;
      state.recognition.onerror = (e) => {
        console.warn('[Voice] 识别错误:', e.error);
        state.listening = false;
      };
      state.recognition.onend = () => { state.listening = false; };
    }
    
    registerDefaultCommands();
    return true;
  }
  
  // ── 语音识别 ─────────────────────────────────
  function startListening() {
    if (!state.recognition) {
      console.warn('[Voice] 浏览器不支持语音识别');
      return false;
    }
    if (state.listening) return false;
    try {
      state.recognition.start();
      state.listening = true;
      return true;
    } catch (e) {
      console.warn('[Voice] 启动失败:', e.message);
      return false;
    }
  }
  
  function stopListening() {
    if (state.recognition && state.listening) {
      state.recognition.stop();
      state.listening = false;
    }
  }
  
  function handleRecognitionResult(event) {
    let interim = '';
    let final = '';
    
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        final += transcript;
      } else {
        interim += transcript;
      }
    }
    
    // 触发回调
    if (state.onInterim && interim) state.onInterim(interim);
    if (state.onFinal && final) {
      // 去除唤醒词
      const cleaned = final.replace(new RegExp(state.wakeWord, 'g'), '').trim();
      // 命令路由
      const cmd = routeCommand(cleaned);
      if (cmd) {
        cmd.handler(cleaned);
      } else {
        state.onFinal(cleaned);
      }
    }
  }
  
  // ── 命令路由 ─────────────────────────────────
  function registerCommand(pattern, handler, desc) {
    state.commands.set(pattern, { handler, desc });
  }
  
  function registerDefaultCommands() {
    registerCommand(/排.*八字|算命|看命/, () => goTo('bazi.html'), '排八字');
    registerCommand(/紫微|斗数/, () => goTo('ziwei.html'), '紫微斗数');
    registerCommand(/奇门|遁甲/, () => goTo('qimen-chart.html'), '奇门遁甲');
    registerCommand(/六爻|摇卦/, () => goTo('liuyao-chart.html'), '六爻占卜');
    registerCommand(/梅花/, () => goTo('meihua-chart.html'), '梅花易数');
    registerCommand(/六壬/, () => goTo('liuren-chart.html'), '大六壬');
    registerCommand(/风水/, () => goTo('fengshui-chart.html'), '风水堪舆');
    registerCommand(/知识库|搜索/, () => goTo('kb-explorer.html'), '知识库');
    registerCommand(/首页|回家/, () => goTo('index.html'), '返回首页');
  }
  
  function routeCommand(text) {
    for (const [pattern, cmd] of state.commands) {
      if (pattern.test(text)) return cmd;
    }
    return null;
  }
  
  function goTo(page) {
    speak('好的，正在为您打开');
    setTimeout(() => { window.location.href = page; }, 500);
  }
  
  // ── 语音合成 ─────────────────────────────────
  function speak(text, opts = {}) {
    if (!text) return;
    
    // 方案 A：浏览器 TTS
    if (state.synth && state.mode !== 'edge-only') {
      state.synth.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'zh-CN';
      utter.rate = opts.rate || 1.0;
      utter.pitch = opts.pitch || 1.0;
      if (state.preferredVoice) utter.voice = state.preferredVoice;
      utter.onstart = () => { state.speaking = true; };
      utter.onend = () => { state.speaking = false; };
      utter.onerror = () => { state.speaking = false; };
      state.synth.speak(utter);
      return;
    }
    
    // 方案 B：Edge-TTS（后端 8912）
    fetch(`${API}/api/tts?text=${encodeURIComponent(text)}`,{method: 'GET',signal:AbortSignal.timeout(15000)}))
      .then(r => r.blob())
      .then(blob => {
        const audio = new Audio(URL.createObjectURL(blob));
        audio.onplay = () => { state.speaking = true; };
        audio.onended = () => { state.speaking = false; URL.revokeObjectURL(audio.src); };
        audio.play().catch(() => { state.speaking = false; });
      })
      .catch(() => { state.speaking = false; });
  }
  
  function stopSpeaking() {
    if (state.synth) state.synth.cancel();
    state.speaking = false;
  }
  
  // ── 对话模式 ─────────────────────────────────
  function startConversation(onMessage) {
    state.onFinal = onMessage;
    state.onInterim = (text) => onMessage(text, true);
    startListening();
  }
  
  function endConversation() {
    stopListening();
    stopSpeaking();
    state.onFinal = null;
    state.onInterim = null;
  }
  
  // ── 导出 ─────────────────────────────────────
  global.VoiceEngine = {
    init,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    startConversation,
    endConversation,
    registerCommand,
    get listening() { return state.listening; },
    get speaking() { return state.speaking; },
    get mode() { return state.mode; },
    set mode(v) { state.mode = v; },
    state,
  };
  
})(typeof window !== 'undefined' ? window : globalThis);
