/**
 * rokid-voice.js
 * ====================================================================
 * 命理宝jian · 4 麦语音唤醒 + 问诊识别
 * --------------------------------------------------------------------
 * 唤醒词：「先知开启问诊」（用户说后半句"开启问诊"作为触发）
 *
 * 路径：
 *   [原生]  Rokid SDK 的 offline 唤醒词（cpsr.aar / kapick VoiceKit）
 *          监听 "wakeup" 事件，回调带 keyword 与 confidence。
 *   [Web]   - 通过 RokidBridge 注册唤醒词 + 订阅唤醒事件；
 *          - 兼容回退：用 Web Speech API（仅在联网时可用；
 *            多数浏览器要求"speak 关键词"作为持续监听替代）。
 *
 * 4 麦阵列：
 *   - 锁定指定 deviceId 通常没用，因为浏览器把 4 麦混成 1 路 audioinput。
 *   - 想做"波束成形"必须依赖原生 mic.open({beam:'narrow'})。
 *   - 兜底：直接用 default mic，配合 WebAudio 做 RNNoise 风格降噪（这里
 *     只调 WebAudio BiquadFilter 简易高通）。
 *
 * ASR：
 *   - 优先调用命理宝jian 自家 /api/voice/asr （WebSocket 流式）。
 *   - 兜底：浏览器内置 webkitSpeechRecognition（仅 webkit 前缀有效）。
 *
 * ====================================================================
 */

(function (global) {
  'use strict';

  /** 注册离线唤醒词（需原生 Rokid 桥） */
  async function registerKeyword(keywords = ['先知开启问诊', 'xianzhi kaiqi wenzhen', 'hey xianzhi']) {
    if (global.RokidBridge && global.RokidBridge.available) {
      try {
        await global.RokidBridge.call(global.RokidEvent.VOICE_REGISTER, { keywords });
        console.info('[RokidVoice] 唤醒词已注册到 Rokid 端：', keywords);
        return { ok: true, via: 'bridge', keywords };
      } catch (e) {
        console.warn('[RokidVoice] bridge 注册唤醒失败，将用 Web 兜底：', e.message);
      }
    }
    return { ok: false, via: 'web-fallback', keywords };
  }

  /** 持续监听唤醒（订阅原生事件 → 触发回调） */
  function onWakeup(cb) {
    if (!cb) return () => {};
    const handler = (ev) => {
      const detail = ev && ev.detail || {};
      cb({ keyword: detail.keyword || 'unknown', confidence: detail.confidence || 1, ts: Date.now() });
    };
    // 原生侧通常通过 window 上的事件统一抛出
    global.addEventListener('rokid:wakeup', handler);
    // 兜底：如果有原生 bridge 调用 capability，附带轮询
    let pollTimer = null;
    if (global.RokidBridge && global.RokidBridge.available) {
      pollTimer = setInterval(() => {
        // 大多数实现走事件总线，这里只是占位
      }, 1000);
    }
    return () => {
      global.removeEventListener('rokid:wakeup', handler);
      if (pollTimer) clearInterval(pollTimer);
    };
  }

  // ---------------------------------------------------------------
  // 录音 / 流式 ASR
  // ---------------------------------------------------------------

  /**
   * lockMic(role='narrow')
   *   narrow=4 麦波束 narrow；far=远场；auto=自动。
   *   通过原生 bridge 设置；Web 兜底直接打开 default mic。
   */
  async function lockMic(role = 'narrow') {
    if (global.RokidBridge && global.RokidBridge.available) {
      try {
        return await global.RokidBridge.call(global.RokidEvent.MIC_OPEN, { role });
      } catch (e) { /* 继续 */ }
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('浏览器不支持 getUserMedia 录音');
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
        sampleRate: 16000,
      },
    });
    return { ok: true, via: 'web-mic', stream };
  }

  /**
   * ASR：调用命理宝jian /api/voice/asr，
   *      兜底用 webkitSpeechRecognition（仅识别一次性短句）。
   *
   * stream?: MediaStream（来自 lockMic）
   * onText?(partial, final) 增量回调
   */
  async function recognize({ stream, lang = 'zh-CN', wsUrl = '/api/voice/asr', onText } = {}) {
    // 1) 优先：WebSocket + 命理宝jian 自家流式 ASR
    if (stream && wsUrl) {
      try {
        return await streamViaWS(stream, wsUrl, onText, lang);
      } catch (e) {
        console.warn('[RokidVoice] WS ASR 失败，回退 webkitSpeechRecognition:', e.message);
      }
    }

    // 2) 兜底：webkitSpeechRecognition（短句一次性）
    return await recognizeOnceWebkit({ lang, onText });
  }

  function streamViaWS(stream, url, onText, lang) {
    return new Promise((resolve, reject) => {
      try {
        const Proto = global.WebSocket || global.MozWebSocket;
        if (!Proto) return reject(new Error('WebSocket 不可用'));

        const ws = new Proto(url);
        const actx = (global.AudioContext || global.webkitAudioContext) ? new AudioContext({ sampleRate: 16000 }) : null;
        if (!actx) return reject(new Error('AudioContext 不可用'));

        const src = actx.createMediaStreamSource(stream);
        const proc = actx.createScriptProcessor(4096, 1, 1);
        let buf = [];
        let stopped = false;
        src.connect(proc);
        proc.connect(actx.destination);

        ws.onopen = () => {
          // 发送开始帧
          ws.send(JSON.stringify({ type: 'start', lang, sampleRate: actx.sampleRate }));
        };

        ws.onmessage = (ev) => {
          try {
            const msg = JSON.parse(ev.data);
            if (msg.type === 'partial' && onText) onText(msg.text, null, msg);
            if (msg.type === 'final' && onText) onText(msg.text, true, msg);
            if (msg.type === 'end') {
              stopped = true;
              cleanup();
              resolve({ ok: true, via: 'ws', text: msg.text });
            }
          } catch (_) {}
        };

        ws.onerror = (e) => { cleanup(); reject(new Error('ws error')); };

        proc.onaudioprocess = (e) => {
          if (stopped) return;
          const data = e.inputBuffer.getChannelData(0);
          // 16-bit PCM
          const pcm = new Int16Array(data.length);
          for (let i = 0; i < data.length; i++) {
            const s = Math.max(-1, Math.min(1, data[i]));
            pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
          }
          ws.send(pcm.buffer);
        };

        function cleanup() {
          try { proc.disconnect(); src.disconnect(); } catch (_) {}
          try { ws.close(); } catch (_) {}
          stream.getTracks().forEach((t) => t.stop());
        }

        // 提供结束 API
        recognize._stop = cleanup;
      } catch (e) { reject(e); }
    });
  }

  function recognizeOnceWebkit({ lang, onText }) {
    return new Promise((resolve) => {
      const Recog = global.SpeechRecognition || global.webkitSpeechRecognition;
      if (!Recog) return resolve({ ok: false, reason: 'unsupported' });
      const r = new Recog();
      r.lang = lang;
      r.continuous = false;
      r.interimResults = true;
      r.onresult = (ev) => {
        let finalText = '';
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          const res = ev.results[i];
          if (onText) onText(res[0].transcript, res.isFinal, res);
          if (res.isFinal) finalText += res[0].transcript;
        }
        if (finalText) resolve({ ok: true, via: 'webkit', text: finalText });
      };
      r.onerror = (e) => resolve({ ok: false, reason: e.error || 'webkit-error' });
      try { r.start(); } catch (e) { resolve({ ok: false, reason: e.message }); }
    });
  }

  /**
   * 高保真一站式：唤醒 → 录音 → ASR → （可选）TTS 回应
   *
   * usage:
   *   RokidVoice.once().then(({ ok, text }) => ...);
   */
  async function once(opts = {}) {
    await registerKeyword();
    return new Promise((resolve) => {
      const off = onWakeup(async () => {
        off();
        const mic = await lockMic('narrow');
        const r = await recognize({ stream: mic.stream, onText: opts.onPartial });
        resolve(r);
      });
      // 兜底：5 分钟超时
      setTimeout(() => { off(); resolve({ ok: false, reason: 'timeout' }); }, 5 * 60 * 1000);
    });
  }

  const RokidVoice = {
    registerKeyword,
    onWakeup,
    lockMic,
    recognize,
    once,
    /** 停止正在进行的流式 ASR */
    stop() { if (recognize._stop) recognize._stop(); },
  };

  global.RokidVoice = RokidVoice;
  console.info('[RokidVoice] init · 唤醒词="先知开启问诊" / fallback=webkitSpeechRecognition');
})(typeof window !== 'undefined' ? window : globalThis);
