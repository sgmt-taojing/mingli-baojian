/**
 * mock-harness.js
 * ====================================================================
 * 命理宝鉴 · 智镜硬件 Mock Harness（无眼镜环境下完整跑通 Rokid JS Bridge）
 * --------------------------------------------------------------------
 * 用法：
 *   <script src="./wearable/rokid-bridge.js"></script>
 *   <script src="./wearable/mock-harness.js"></script>
 *   <script>
 *     MockRokid.enable({ kind: 'jr-bridge', delayMs: 50 });
 *     await RokidBridge.callNative('audio.play', { url: '/test.mp3' });
 *     // → console 输出 "[mock] audio.play {url:'/test.mp3'}"
 *   </script>
 *
 * 设计目标：
 *   1. 在普通浏览器（无眼镜）下能完整跑通所有 Bridge 调用
 *   2. 模拟三类原生能力（音频/相机/语音）的 mock 响应
 *   3. 注入 console.info 计数面板（mock 调用统计）
 *   4. 支持事件触发机制（deviceMotion/TTS 事件）
 * ====================================================================
 */

(function (global) {
  'use strict';

  const STATE = {
    enabled: false,
    kind: 'jr-bridge',
    delayMs: 30,
    callCount: 0,
    eventLog: []
  };

  const MOCK_RESPONSE = {
    'audio.play':         { code: 0, message: 'ok', data: { duration_ms: 1234 } },
    'audio.stop':         { code: 0, message: 'ok' },
    'audio.setVolume':    { code: 0, message: 'ok' },
    'camera.capture':     { code: 0, message: 'ok', data: { width: 1280, height: 720, format: 'jpeg', base64: 'MOCK_BASE64' } },
    'camera.startStream': { code: 0, message: 'ok', data: { streamId: 'mock-stream-001' } },
    'voice.start':        { code: 0, message: 'ok', data: { sessionId: 'mock-vc-001' } },
    'voice.stop':         { code: 0, message: 'ok' },
    'motion.subscribe':   { code: 0, message: 'ok', data: { subscriptionId: 'mock-sub-001' } },
    'storage.set':        { code: 0, message: 'ok' },
    'storage.get':        { code: 0, message: 'ok', data: { value: null } }
  };

  function mockCall(event, payload) {
    return new Promise((resolve) => {
      STATE.callCount++;
      STATE.eventLog.push({ type: 'call', event, payload, t: Date.now() });

      const response = MOCK_RESPONSE[event] || { code: 0, message: 'mock-ok', data: null };

      console.info(
        `%c[mock-Rokid]`,
        'color:#9b59b6;font-weight:bold',
        `#${STATE.callCount}`,
        event,
        JSON.stringify(payload).slice(0, 80)
      );

      setTimeout(() => resolve(response), STATE.delayMs);
    });
  }

  const MockRokid = {
    enable(opts = {}) {
      STATE.enabled = true;
      STATE.kind = opts.kind || 'jr-bridge';
      STATE.delayMs = opts.delayMs || 30;

      // 把 RokidBridge.available 强制设为 true，并替换 call
      if (global.RokidBridge) {
        global.RokidBridge.available = true;
        global.RokidBridge.bridgeKind = `mock-${STATE.kind}`;
        // 保存原始 call（如有）
        const origCall = global.RokidBridge.call
          ? global.RokidBridge.call.bind(global.RokidBridge)
          : null;
        global.RokidBridge.call = function (event, payload) {
          return mockCall(event, payload).then((res) => {
            STATE.eventLog.push({ type: 'response', event, res, t: Date.now() });
            return res;
          });
        };
        // 兼容：部分代码用 callNative(event, payload, cb)
        global.RokidBridge.callNative = function (event, payload, cb) {
          mockCall(event, payload).then((res) => {
            STATE.eventLog.push({ type: 'response', event, res, t: Date.now() });
            if (typeof cb === 'function') cb(res);
          });
        };
      }

      // 注入 navigator.rokidMock 用于 UI 探测（浏览器安全写入）
      try {
        Object.defineProperty(global.navigator, 'rokidMock', {
          get: () => STATE.enabled ? { kind: STATE.kind } : null,
          configurable: true
        });
      } catch (e) {
        // Node 环境下 navigator 只读，跳过
      }

      console.info(
        `%c[mock-Rokid] ENABLED`,
        'color:#9b59b6;font-weight:bold;font-size:14px',
        `kind=${STATE.kind} delay=${STATE.delayMs}ms`
      );
    },

    disable() {
      STATE.enabled = false;
      if (global.RokidBridge) {
        global.RokidBridge.available = false;
      }
      console.info('[mock-Rokid] DISABLED');
    },

    stats() {
      return {
        enabled: STATE.enabled,
        kind: STATE.kind,
        callCount: STATE.callCount,
        eventLogSize: STATE.eventLog.length,
        recentEvents: STATE.eventLog.slice(-5)
      };
    },

    triggerMotion(beta = 10, gamma = 5) {
      if (global.dispatchEvent) {
        global.dispatchEvent(new global.DeviceOrientationEvent('deviceorientation', {
          alpha: 0, beta, gamma, absolute: false
        }));
        STATE.eventLog.push({ type: 'trigger', kind: 'motion', beta, gamma, t: Date.now() });
      }
    },

    triggerVoice(text = '命理宝鉴') {
      if (global.dispatchEvent) {
        global.dispatchEvent(new global.Event('rokid-voice-result'));
        STATE.eventLog.push({ type: 'trigger', kind: 'voice', text, t: Date.now() });
      }
    },

    reset() {
      STATE.callCount = 0;
      STATE.eventLog = [];
    }
  };

  global.MockRokid = MockRokid;

  // R43: UI 友好别名，提供 isEnabled() / toggle() 接口
  global.rokidMock = {
    isEnabled() { return STATE.enabled; },
    toggle(on, opts) {
      if (on) MockRokid.enable(opts); else MockRokid.disable();
    },
    stats() { return MockRokid.stats(); },
    triggerMotion: MockRokid.triggerMotion,
    triggerVoice: MockRokid.triggerVoice,
    reset: MockRokid.reset
  };

  // 自动启用（除非显式 ?nomock）
  if (typeof location !== 'undefined' && !/nomock/.test(location.search || '')) {
    document.addEventListener('DOMContentLoaded', () => {
      // 不自动 enable——留给调用方决定
      console.info('[mock-Rokid] loaded; call MockRokid.enable() to activate');
    });
  }
})(typeof window !== 'undefined' ? window : globalThis);