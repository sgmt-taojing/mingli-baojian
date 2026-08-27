/**
 * RealtimeVoice v2.0 — 浏览器 Web Speech API 实时收音引擎（跨项目共享）
 * =====================================================================
 * 解决的核心问题：把「粘贴文本」式语音输入升级为「边说边出字、边出字边查库」的实时收音。
 *
 * 能力清单：
 *  1. 连续识别 continuous=true + interimResults=true（用户还没说完，转写已在滚动）
 *  2. 事件模型：statechange / interim(部分结果) / final(最终结果) / volume(音量) / error / unsupported
 *  3. 自动重启：解决 Chrome 等浏览器 ~60s 自动断连问题（autoRestart + 连续重启上限防死循环）
 *  4. 静音检测：静音超过阈值自动重启识别，避免"哑火"状态
 *  5. 错误分级：not-allowed / no-speech / network / audio-capture / aborted 全部分级处理，可读提示
 *  6. 降级路径：浏览器不支持时自动切换「粘贴文本」模式（同一事件接口，下游零改动）
 *  7. 音量可视化：getUserMedia + AnalyserNode（可选开启，用于 UI 反馈）
 *  8. 严格容错：重复 start 保护、识别器空引用保护、异常捕获全覆盖
 *
 * 使用方式（任意项目，零依赖）：
 *  <script src="realtime-voice.js"></script>
 *  const voice = new RealtimeVoice({
 *    onInterim: t => renderInterim(t),   // 实时滚动
 *    onFinal:   t => doKbSearch(t),      // 一句话说完
 *    onState:   s => updateMicUI(s)
 *  });
 *  voice.start();  // 或 voice.toggle()
 *
 * 事件接口（RealtimeKB / 页面渲染共用）：
 *  interim  → 部分识别文本（灰色滚动）
 *  final    → 完整一句（含粘贴降级输入）
 */
(function (global) {
  'use strict';

  var STATE = { IDLE: 'idle', STARTING: 'starting', LISTENING: 'listening', STOPPING: 'stopping', FALLBACK: 'fallback' };

  /**
   * 错误分级 → 用户可读提示
   */
  var ERROR_MESSAGES = {
    'not-allowed': '麦克风权限被拒绝：请点击地址栏的麦克风图标允许本页使用麦克风',
    'service-not-allowed': '浏览器未授权语音服务：请检查浏览器设置或换用 Chrome / Edge',
    'no-speech': '没有听到声音：请靠近麦克风再试一次',
    'audio-capture': '麦克风被其他应用占用：请关闭占用程序后重试',
    'network': '语音识别服务网络异常：请检查网络后重试（当前转写仍可粘贴输入）',
    'aborted': '', // 用户主动停止，静默
    'language-not-supported': '当前浏览器不支持中文语音识别：请换用 Chrome / Edge',
    'default': '语音识别暂不可用：可点击下方输入框直接粘贴文字'
  };

  function RealtimeVoice(options) {
    this._opts = Object.assign({
      lang: 'zh-CN',
      continuous: true,
      interimResults: true,
      maxAlternatives: 3,
      autoRestart: true,          // 断连自动重启
      restartDelayMs: 350,        // 重启间隔
      maxRestarts: 5,             // 连续重启上限（超出则停止并提示，防死循环）
      silenceTimeoutMs: 3500,     // 静音自动重启阈值
      autoSubmitMs: 900,          // VAD 式自动提交：interim 停顿该时长视为说完（0=关闭，主流语音助手模式）
      emitFinalOnStop: true,      // 手动停止时把未定稿 interim 作为 final 提交（PTT 松开即提交）
      volumeMeter: false,         // 是否启用音量可视化（额外申请麦克风）
      volumeLevel: 0,             // 只读：当前音量 0-100
      onState: null, onInterim: null, onFinal: null, onVolume: null, onError: null, onRestart: null
    }, options || {});

    this._listeners = {};
    this._recognition = null;
    this._state = STATE.IDLE;
    this._shouldListen = false;   // 期望状态（用于 onend 自动重启判断）
    this._restartCount = 0;
    this._lastResultAt = 0;
    this._silenceTimer = null;
    this._stopTimer = null;
    this._volumeStream = null;
    this._volumeAnalyser = null;
    this._volumeRaf = 0;
    this._finalAccum = '';        // 本次会话累计最终文本
    this._lastInterimText = '';   // 最近一次未定稿文本（VAD 自动提交用）
    this._supported = this._detectSupport();
  }

  /* ================= 事件总线 ================= */
  RealtimeVoice.prototype.on = function (evt, fn) {
    if (!this._listeners[evt]) this._listeners[evt] = [];
    this._listeners[evt].push(fn);
    return this;
  };
  RealtimeVoice.prototype.emit = function (evt) {
    var args = Array.prototype.slice.call(arguments, 1);
    var fns = this._listeners[evt] || [];
    for (var i = 0; i < fns.length; i++) {
      try { fns[i].apply(null, args); } catch (e) { /* 监听器异常不影响引擎 */ }
    }
    var cb = this._opts['on' + evt.charAt(0).toUpperCase() + evt.slice(1)];
    if (typeof cb === 'function') {
      try { cb.apply(null, args); } catch (e) { /* 回调异常不影响引擎 */ }
    }
  };

  /* ================= 状态 ================= */
  RealtimeVoice.prototype._setState = function (s) {
    if (this._state === s) return;
    this._state = s;
    this.emit('statechange', s);
  };
  RealtimeVoice.prototype.getState = function () { return this._state; };
  RealtimeVoice.prototype.isSupported = function () { return this._supported; };
  RealtimeVoice.prototype.isListening = function () { return this._state === STATE.LISTENING || this._state === STATE.STARTING; };
  RealtimeVoice.prototype.getAccumText = function () { return this._finalAccum; };

  RealtimeVoice.prototype._detectSupport = function () {
    try {
      var SR = global.SpeechRecognition || global.webkitSpeechRecognition;
      return !!SR;
    } catch (e) { return false; }
  };

  /* ================= 启动 / 停止 ================= */
  RealtimeVoice.prototype.start = function () {
    if (this._state === STATE.LISTENING || this._state === STATE.STARTING) return;
    if (!this._supported) {
      this._setState(STATE.FALLBACK);
      this.emit('unsupported', ERROR_MESSAGES['language-not-supported']);
      this.emit('error', { code: 'unsupported', message: ERROR_MESSAGES['language-not-supported'], recoverable: true });
      return;
    }
    try {
      this._finalAccum = '';
      this._restartCount = 0;
      this._shouldListen = true;
      this._createRecognition();
      this._setState(STATE.STARTING);
      this._recognition.start();
      this._watchSilence();
      if (this._opts.volumeMeter) this._startVolumeMeter();
    } catch (e) {
      // start() 抛错（如已启动/无效状态）→ 尝试重建一次
      try {
        this._createRecognition();
        this._recognition.start();
      } catch (e2) {
        this._shouldListen = false;
        this._setState(STATE.IDLE);
        this.emit('error', { code: 'start-failed', message: '语音识别启动失败：' + (e2 && e2.message ? e2.message : '未知错误'), recoverable: true });
      }
    }
  };

  RealtimeVoice.prototype.stop = function () {
    this._shouldListen = false;
    this._clearTimers();
    this._stopVolumeMeter();
    // PTT 松开即提交：未定稿文本作为 final 提交（emitFinalOnStop）
    if (this._opts.emitFinalOnStop && this._lastInterimText) {
      var text = this._lastInterimText;
      this._lastInterimText = '';
      this._finalAccum += text;
      this.emit('final', text, this._finalAccum, { ptt: true });
    }
    if (this._recognition && this._state !== STATE.IDLE) {
      this._setState(STATE.STOPPING);
      try { this._recognition.stop(); } catch (e) { /* 已停止则忽略 */ }
    } else {
      this._setState(STATE.IDLE);
    }
  };

  RealtimeVoice.prototype.toggle = function () {
    if (this.isListening()) { this.stop(); return false; }
    this.start(); return true;
  };

  /* ================= 识别器构建与事件绑定 ================= */
  RealtimeVoice.prototype._createRecognition = function () {
    var SR = global.SpeechRecognition || global.webkitSpeechRecognition;
    if (!SR) return null;
    var r = new SR();
    r.lang = this._opts.lang;
    r.continuous = this._opts.continuous;
    r.interimResults = this._opts.interimResults;
    r.maxAlternatives = this._opts.maxAlternatives;

    r.onresult = this._onResult.bind(this);
    r.onerror = this._onError.bind(this);
    r.onend = this._onEnd.bind(this);
    r.onstart = (function () {
      this._restartCount = 0;
      this._setState(STATE.LISTENING);
    }).bind(this);
    this._recognition = r;
    return r;
  };

  RealtimeVoice.prototype._onResult = function (event) {
    try {
      this._lastResultAt = Date.now();
      var interim = '', finals = [];
      for (var i = event.resultIndex; i < event.results.length; i++) {
        var res = event.results[i];
        var text = res[0] && res[0].transcript ? res[0].transcript : '';
        if (res.isFinal) {
          finals.push(text);
          this._finalAccum += text;
        } else {
          interim += text;
        }
      }
      if (finals.length) this.emit('final', finals.join(''), this._finalAccum);
      if (interim) {
        this._lastInterimText = interim;
        this.emit('interim', interim, this._finalAccum);
      } else {
        this._lastInterimText = '';
      }
      // 有结果即重置静音计时
      if (this._silenceTimer) { clearTimeout(this._silenceTimer); this._watchSilence(); }
    } catch (e) {
      this.emit('error', { code: 'parse-error', message: '识别结果解析异常', recoverable: true });
    }
  };

  RealtimeVoice.prototype._onError = function (event) {
    var code = (event && event.error) ? event.error : 'default';
    var msg = ERROR_MESSAGES[code] || ERROR_MESSAGES['default'];
    // 用户主动停止触发的 aborted 静默
    if (code === 'aborted' && !this._shouldListen) return;
    this.emit('error', { code: code, message: msg, recoverable: code !== 'not-allowed' && code !== 'service-not-allowed' });
    if (code === 'not-allowed' || code === 'service-not-allowed' || code === 'language-not-supported') {
      this._shouldListen = false;
      this._setState(STATE.IDLE);
    }
  };

  RealtimeVoice.prototype._onEnd = function () {
    this._setState(STATE.IDLE);
    this._stopVolumeMeter();
    if (!this._shouldListen) return; // 用户主动停止
    // 自动重启（浏览器约 60s 会强制 onend）
    if (!this._opts.autoRestart) return;
    if (this._restartCount >= this._opts.maxRestarts) {
      this._shouldListen = false;
      this.emit('error', { code: 'restart-limit', message: '语音识别多次中断，已自动停止。请重新点击麦克风开始。', recoverable: true });
      return;
    }
    this._restartCount++;
    var self = this;
    this.emit('restart', this._restartCount);
    setTimeout(function () {
      if (!self._shouldListen) return;
      try {
        self._createRecognition();
        self._recognition.start();
      } catch (e) {
        self.emit('error', { code: 'restart-failed', message: '语音识别自动重启失败，请点击麦克风重试', recoverable: true });
        self._shouldListen = false;
        self._setState(STATE.IDLE);
      }
    }, this._opts.restartDelayMs);
  };

  /* ================= 静音检测（VAD 自动提交 + 断连重启双计时） ================= */
  RealtimeVoice.prototype._watchSilence = function () {
    var self = this;
    if (this._silenceTimer) clearTimeout(this._silenceTimer);
    var autoMs = this._opts.autoSubmitMs;
    this._silenceTimer = setTimeout(function () {
      // ① VAD 自动提交：interim 停顿超过 autoSubmitMs → 视为说完（主流语音助手“说完自动识别”）
      if (autoMs > 0 && self._lastInterimText) {
        var text = self._lastInterimText;
        self._lastInterimText = '';
        self._finalAccum += text;
        self.emit('final', text, self._finalAccum, { auto: true });
        self._lastResultAt = Date.now(); // 重置，避免紧接触发重启
      }
      // ② 持续静音超过 silenceTimeoutMs 且仍期望收音 → 自动重启识别（解决“哑火”）
      if (self._shouldListen && self._state === STATE.LISTENING &&
          Date.now() - self._lastResultAt >= self._opts.silenceTimeoutMs) {
        try { if (self._recognition) self._recognition.stop(); } catch (e) { /* ignore */ }
      }
    }, Math.min(autoMs > 0 ? autoMs : self._opts.silenceTimeoutMs, self._opts.silenceTimeoutMs));
  };

  RealtimeVoice.prototype._clearTimers = function () {
    if (this._silenceTimer) { clearTimeout(this._silenceTimer); this._silenceTimer = null; }
    if (this._stopTimer) { clearTimeout(this._stopTimer); this._stopTimer = null; }
  };

  /* ================= 音量可视化（可选） ================= */
  RealtimeVoice.prototype._startVolumeMeter = function () {
    var self = this;
    if (this._volumeStream) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(function (stream) {
        try {
          var AC = global.AudioContext || global.webkitAudioContext;
          var ctx = new AC();
          var src = ctx.createMediaStreamSource(stream);
          var analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          src.connect(analyser);
          self._volumeStream = stream;
          self._volumeAnalyser = analyser;
          self._volumeRaf = requestAnimationFrame(function tick() {
            if (!self._volumeAnalyser) return;
            var data = new Uint8Array(self._volumeAnalyser.frequencyBinCount);
            self._volumeAnalyser.getByteFrequencyData(data);
            var sum = 0;
            for (var i = 0; i < data.length; i++) sum += data[i];
            var level = Math.min(100, Math.round((sum / data.length / 255) * 100));
            self._opts.volumeLevel = level;
            self.emit('volume', level);
            self._volumeRaf = requestAnimationFrame(tick);
          });
        } catch (e) { /* 音量表失败不影响识别 */ }
      })
      .catch(function () { /* 用户拒绝音频权限时仅关闭音量表 */ });
  };

  RealtimeVoice.prototype._stopVolumeMeter = function () {
    if (this._volumeRaf) { cancelAnimationFrame(this._volumeRaf); this._volumeRaf = 0; }
    if (this._volumeStream) {
      try { this._volumeStream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) { /* ignore */ }
      this._volumeStream = null;
    }
    this._volumeAnalyser = null;
    this._opts.volumeLevel = 0;
  };

  /* ================= 降级：粘贴文本入口（同一事件接口） ================= */
  /**
   * 浏览器不支持 Web Speech API 或用户选择手动输入时调用。
   * 以 final 事件喂给下游，保证 RealtimeKB / 页面渲染零改动。
   */
  RealtimeVoice.prototype.feedText = function (text) {
    text = (text || '').trim();
    if (!text) return;
    this._finalAccum += text;
    this.emit('final', text, this._finalAccum);
  };

  RealtimeVoice.prototype.destroy = function () {
    this.stop();
    this._listeners = {};
    this._recognition = null;
  };

  global.RealtimeVoice = RealtimeVoice;
  global.RT_VOICE_STATE = STATE;
})(typeof window !== 'undefined' ? window : this);
