/**
 * RealtimeEngine v2.0 — 实时交互统一编排引擎（跨项目共享）
 * =====================================================================
 * 将 RealtimeVoice（实时收音）+ RealtimeKB（实时 KB 互通）+ RealtimeVision（实时视觉）
 * 编排为一条「零延迟交互流水线」：
 *
 *  用户说话 ──interim──▶ 实时转写滚动 ──150ms 防抖──▶ KB 实时检索 ──▶ 结果先出（无需等说完）
 *  用户说完 ──final────▶ KB 直答优先（≥0.7 直接回答） ──<0.4──▶ AI 兜底（可接现有 AI 接口）
 *  摄像头   ──抽帧─────▶ 实时识别 ──▶ KB 匹配 ──▶ 诊断结果实时上屏（同零延迟规则）
 *
 * 状态机：idle → listening → searching → answering → vision_scanning（可并行）
 * 事件：statechange / kb_result / kb_status / vision_result / vision_status / voice_error / answer / latency
 *
 * 使用方式：
 *  const engine = new RealtimeEngine({
 *    voice: voiceInstance, kb: kbInstance, vision: visionInstance,
 *    onEvent: (type, payload) => render(type, payload),
 *    speak: (text) => speakText(text)   // 可选：KB 直答朗读
 *  });
 *  engine.bindVoiceToKb();   // 一行接线：interim→kb.search, final→kb.search(force)+朗读
 */
(function (global) {
  'use strict';

  var STATE = {
    IDLE: 'idle',
    LISTENING: 'listening',      // 正在收音
    SEARCHING: 'searching',      // KB 实时检索中
    ANSWERING: 'answering',      // 正在给出最终回答
    VISION: 'vision_scanning',   // 视觉实时扫描（可与语音并行）
    ERROR: 'error'
  };

  var STATE_LABEL = {
    idle: '待命',
    listening: '正在聆听…',
    searching: '正在查阅典籍…',
    answering: '正在答复…',
    vision_scanning: '视觉实时识别中…',
    error: '异常'
  };

  function RealtimeEngine(options) {
    this._opts = Object.assign({
      voice: null, kb: null, vision: null,
      onEvent: null,              // (type, payload) => void
      speak: null,                // (text) => void  最终回答朗读
      kbDirectSpeak: true,        // KB 直答是否朗读
      minFinalChars: 2
    }, options || {});

    this._listeners = {};
    this._state = STATE.IDLE;
    this._lastKb = null;          // 最近一次 KB 结果
    this._lastAnswer = '';
    this._timings = { voiceToKb: 0, kbLatency: 0, lastKbLatency: 0, answerAt: 0 };
    this._wire();
  }

  /* ================= 状态 ================= */
  RealtimeEngine.prototype.setState = function (s) {
    if (this._state === s) return;
    this._state = s;
    this._emit('statechange', { state: s, label: STATE_LABEL[s] || s });
  };
  RealtimeEngine.prototype.getState = function () { return this._state; };
  RealtimeEngine.prototype.getTimings = function () { return Object.assign({}, this._timings); };

  /* ================= 事件 ================= */
  RealtimeEngine.prototype.on = function (evt, fn) {
    if (!this._listeners[evt]) this._listeners[evt] = [];
    this._listeners[evt].push(fn);
    return this;
  };
  RealtimeEngine.prototype._emit = function (type, payload) {
    var fns = this._listeners[type] || [];
    for (var i = 0; i < fns.length; i++) {
      try { fns[i](payload); } catch (e) { /* ignore */ }
    }
    if (typeof this._opts.onEvent === 'function') {
      try { this._opts.onEvent(type, payload); } catch (e) { /* ignore */ }
    }
  };

  /* ================= 自动接线（核心编排） ================= */
  RealtimeEngine.prototype._wire = function () {
    var self = this;

    // ── 语音 → KB：边说边查 ──
    if (this._opts.voice) {
      this._opts.voice.on('interim', function (text, accum) {
        self.setState(STATE.LISTENING);
        self._emit('interim', { text: text, accum: accum });
        if (self._opts.kb) {
          var t0 = performance.now();
          self._opts.kb.search(text, { force: false });
          self._timings.voiceToKb = Math.round(performance.now() - t0);
        }
      });

      this._opts.voice.on('final', function (text, accum) {
        self._emit('final', { text: text, accum: accum });
        if (!self._opts.kb) return;
        var t0 = performance.now();
        self._opts.kb.search(text, { force: true });
        self._timings.voiceToKb = Math.round(performance.now() - t0);
      });

      this._opts.voice.on('statechange', function (s) {
        if (s === 'idle' || s === 'fallback') {
          if (self._state === STATE.LISTENING) self.setState(STATE.IDLE);
        }
      });

      this._opts.voice.on('error', function (err) {
        self._emit('voice_error', err);
      });
    }

    // ── KB 结果 → 分级响应 ──
    if (this._opts.kb) {
      this._opts.kb.on('status', function (st) {
        self._emit('kb_status', st);
      });
      this._opts.kb.on('result', function (r) {
        self._lastKb = r;
        self._timings.kbLatency = r.latencyMs || 0;
        self._timings.lastKbLatency = r.latencyMs || 0;
        self._emit('kb_result', r);
        // KB 直答：直接进入 answering 并朗读（≥0.7 直答，无需等 AI）
        if (r.tier === 'direct' && self._opts.kbDirectSpeak && self._opts.speak && r.items && r.items[0]) {
          var snippet = r.items[0].content || r.items[0].title || '';
          var say = '根据知识库：' + (r.items[0].title || '') + '。' + snippet.substring(0, 120);
          self.setState(STATE.ANSWERING);
          try { self._opts.speak(say); } catch (e) { /* ignore */ }
          self._timings.answerAt = Date.now();
        }
      });
    }

    // ── 视觉 → 事件透传 ──
    if (this._opts.vision) {
      this._opts.vision.on('result', function (r) {
        self.setState(STATE.VISION);
        self._emit('vision_result', r);
      });
      this._opts.vision.on('status', function (st) {
        self._emit('vision_status', st);
        if (st.status === 'idle' && self._state === STATE.VISION) self.setState(STATE.IDLE);
      });
      this._opts.vision.on('error', function (e) {
        self._emit('vision_error', e);
      });
    }
  };

  /* ================= 便捷方法 ================= */

  /** 一句话接线：语音 ↔ KB ↔ 朗读（多数页面一行搞定） */
  RealtimeEngine.prototype.bindVoiceToKb = function () {
    // 接线已在 _wire 完成；此方法仅做状态提示（保持 API 语义清晰）
    return this;
  };

  /** 最终回答（AI 兜底结果也走这里，统一出口） */
  RealtimeEngine.prototype.answer = function (text) {
    this._lastAnswer = text || '';
    this.setState(STATE.ANSWERING);
    this._timings.answerAt = Date.now();
    this._emit('answer', { text: this._lastAnswer, kb: this._lastKb });
    if (this._opts.speak && text) {
      try { this._opts.speak(text); } catch (e) { /* ignore */ }
    }
    return this;
  };

  /** 复位（新会话） */
  RealtimeEngine.prototype.reset = function () {
    if (this._opts.voice) { try { this._opts.voice.stop(); } catch (e) { /* ignore */ } }
    if (this._opts.kb) { try { this._opts.kb.flush(); } catch (e) { /* ignore */ } }
    this._lastKb = null;
    this._lastAnswer = '';
    this.setState(STATE.IDLE);
    this._emit('reset', { ts: Date.now() });
    return this;
  };

  global.RealtimeEngine = RealtimeEngine;
  global.RT_ENGINE_STATE = STATE;
  global.RT_ENGINE_STATE_LABEL = STATE_LABEL;
})(typeof window !== 'undefined' ? window : this);
