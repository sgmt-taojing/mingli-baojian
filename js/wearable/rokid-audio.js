/**
 * rokid-audio.js
 * ====================================================================
 * 命理宝jian · 骨传导音频路由
 * --------------------------------------------------------------------
 * 骨传导不入耳 → 医生"无感接收 AI 播报"。
 *
 * Web 侧限制：
 *   - WebAudio 的 AudioContext.destination 永远是 default speaker，浏览器
 *     API 没办法直接挑"骨传导 vs 扬声器"。
 *   - 切到骨传导必须依赖原生桥：调用 audio.route 设置 audio output 到
 *     "bone-conduction"。
 *   - PC 浏览器 fallback：就走默认扬声器（普通外放），不影响演示。
 *
 * 设计：
 *   - playTTS(text)：
 *       1) 先用 Edge-TTS / 系统 TTS 拿到 PCM（base64 或 blob）；
 *       2) 调原生 bridge 把 audio 路由到骨传导；
 *       3) WebAudio 解码 + 播放。
 *   - 或直接调 Rokid 原生 TTS（命理宝jian 现有 /api/tts 上是 Edge-TTS mp3，
 *     这里提供一个 "tts-and-route" 的便捷函数）。
 *
 *   默认提供：routeOut(mode) where mode ∈ ['speaker', 'bone', 'mix']。
 * ====================================================================
 */

(function (global) {
  'use strict';

  /** 创建 AudioContext（用户首次手势后调用） */
  let _actx = null;
  function ensureActx() {
    if (_actx) return _actx;
    const Ctor = global.AudioContext || global.webkitAudioContext;
    if (!Ctor) throw new Error('浏览器不支持 WebAudio');
    _actx = new Ctor({ latencyHint: 'interactive' });
    return _actx;
  }

  /** 让原生桥切换输出通道 */
  async function routeOut(mode = 'bone') {
    if (global.RokidBridge && global.RokidBridge.available) {
      try {
        await global.RokidBridge.call(global.RokidEvent.AUDIO_ROUTE, { mode });
        console.info('[RokidAudio] routeOut ->', mode);
        return { ok: true, mode, via: 'bridge' };
      } catch (e) {
        console.warn('[RokidAudio] bridge 路由失败，继续走 WebAudio 兜底：', e.message);
      }
    }
    // Web 兜底：仅提示，无法真的切到骨传导
    return { ok: false, mode, via: 'web-fallback', note: 'PC 浏览器无法切到骨传导，走默认扬声器' };
  }

  /** 设置眼镜端音量（0~100） */
  async function setGain(vol = 80) {
    if (global.RokidBridge && global.RokidBridge.available) {
      try { return await global.RokidBridge.call(global.RokidEvent.AUDIO_SET_GAIN, { vol }); }
      catch (e) { console.warn(e.message); }
    }
    // WebAudio 兜底：调整 gainNode
    const ctx = ensureActx();
    if (ctx._gain) ctx._gain.gain.value = Math.max(0, Math.min(1, vol / 100));
    return { ok: false, gainNode: vol / 100 };
  }

  /**
   * playText(text, opts)：让眼镜播报一段文字。
   * 优先：调原生 TTS（如 RokidBridge 支持 voice.tts），获取 url 后路由到骨传导播放。
   * 退化：浏览器自带的 Web Speech API（speechSynthesis）走默认扬声器。
   */
  async function playText(text, opts = {}) {
    const { route = 'bone', voice = 'zh-CN', rate = 1, volume = 1, useNativeTTS = true } = opts;
    await routeOut(route);

    if (useNativeTTS && global.RokidBridge && global.RokidBridge.available) {
      try {
        // 假设 Rokid 侧接受 voice.tts 事件，返回 mp3 url 或 PCM 数据
        const r = await global.RokidBridge.call('voice.tts', { text, voice, rate, volume });
        if (r && r.url) {
          const audio = new Audio(r.url);
          audio.crossOrigin = 'anonymous';
          await audio.play();
          return { ok: true, via: 'native-tts', url: r.url };
        }
        if (r && r.pcmBase64) {
          return await playBase64PCM(r.pcmBase64, r.sampleRate || 16000);
        }
      } catch (e) { console.warn('[RokidAudio] 原生 TTS 失败，回退 WebSpeech：', e.message); }
    }

    // 退化：Web Speech API
    return await playWithWebSpeech(text, { voice, rate, volume, route });
  }

  /** Web Speech 播放（先尝试设置 speechSynthesis 输出设备；多数浏览器不支持） */
  function playWithWebSpeech(text, { voice, rate, volume, route }) {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in global)) {
        resolve({ ok: false, reason: 'unsupported', route });
        return;
      }
      const u = new SpeechSynthesisUtterance(text);
      u.lang = voice;
      u.rate = rate;
      u.volume = volume;
      const v = (global.speechSynthesis.getVoices() || []).find((x) => x.lang.startsWith(voice.split('-')[0]));
      if (v) u.voice = v;
      u.onend = () => resolve({ ok: true, via: 'speechSynthesis', route });
      u.onerror = (e) => resolve({ ok: false, reason: e.error || 'speech-error', route });
      global.speechSynthesis.speak(u);
    });
  }

  /** 播放 base64 PCM */
  async function playBase64PCM(b64, sampleRate = 16000) {
    const ctx = ensureActx();
    const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    // 这里假设为 16-bit 单声道；其他格式需要重采样
    const buf = ctx.createBuffer(1, bin.length / 2, sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0, j = 0; i < bin.length; i += 2, j++) {
      ch[j] = ((bin[i] | (bin[i + 1] << 8)) / 32768);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const gain = ctx.createGain ? ctx.createGain() : ctx.destination;
    if (gain.gain) {
      gain.gain.value = 1.0;
      ctx._gain = gain;
    }
    src.connect(gain).connect(ctx.destination);
    src.start();
    return { ok: true, via: 'pcm', durationSec: buf.duration };
  }

  /**
   * 播放 url（mp3/wav 等）：先 GET 拉 array buffer，解码后走 WebAudio，
   * 同时把 audio 路由到骨传导。
   */
  async function playUrl(url) {
    await routeOut('bone');
    const ctx = ensureActx();
    const resp = await fetch(url);
    const ab = await resp.arrayBuffer();
    const buf = await ctx.decodeAudioData(ab);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const gain = ctx.createGain();
    gain.gain.value = 1;
    ctx._gain = gain;
    src.connect(gain).connect(ctx.destination);
    src.start();
    return { ok: true, via: 'web-audio', durationSec: buf.duration };
  }

  const RokidAudio = {
    ensureActx,
    routeOut,
    setGain,
    playText,
    playUrl,
    playBase64PCM,
  };

  global.RokidAudio = RokidAudio;
  console.info('[RokidAudio] init · 准备好了 骨传导路由 + WebAudio 回退');
})(typeof window !== 'undefined' ? window : globalThis);
