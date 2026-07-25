/**
 * rokid-bridge.js
 * ====================================================================
 * Rokid 智能眼镜 / AR Studio 浏览器层 JS Bridge 探测 + 适配层
 * --------------------------------------------------------------------
 * 背景：
 *   Rokid 官方目前对外开放的是 Android / iOS SDK（cg / Jetpack Compose
 *   的 kapick 或 jr-bridge）。浏览器层（即 webview 内运行的 H5）能不能
 *   直接调用这些原生能力，取决于 Rokid 自家的"全屏浏览器/CPS Browser"
 *   是否注入了 JSBridge 命名空间。截至 2026-07-24，公网没有正式发布
 *   稳定的 window.RokidJSBridge 文档，但有以下三种行为约定：
 *
 *     (a) Rokid AR Studio → WebView 默认会注入 window.RokidJSBridge
 *         （类似 Android WebView 注入 window.KJJSBridge 的机制）。
 *     (b) Rokid Max Pro / Air Pro 上的「全屏浏览器 APP」会把能力
 *         暴露成 JSON-RPC 风格的 postMessage 协议。
 *     (c) 若 a/b 都没命中，则降级到普通 Web 标准 API。
 *
 *   本模块不假设哪个版本必定注入任何对象，而是按"优先级探测 +
 *   优雅降级"的思路封装。代码假设如下（标 [HYP] 为"假设条件"）：
 *
 *     [HYP-1]  当存在 window.RokidJSBridge.callNative(event, json, cb)
 *              时，event 字符串为 Rokid 私有协议（参考 jr-bridge）。
 *     [HYP-2]  当存在 window.RokidJSBridge.postMessage(cmd, payload, cb)
 *              时，cmd 是 snake_case 字符串，payload 是 JSON。
 *     [HYP-3]  公网协议 v1 事件枚举见下方 EVENT 字典。
 * ====================================================================
 *
 * 用法：
 *   <script type="module" src="./rokid-sdk/rokid-bridge.js"></script>
 *   const result = await window.RokidBridge.call('camera.list', {});
 *
 * 依赖：无（纯 ES 浏览器侧）。
 * 兼容：Chrome 80+ / Safari 14+ / Android WebView 9+ / Rokid WebView。
 * 作者：命理宝鉴 / 穿戴接入组 (2026-07-24)。
 * ====================================================================
 */

(function (global) {
  'use strict';

  // ---------------------------------------------------------------
  // 1. 事件枚举（假设 Rokid 私有协议）
  //    命名采用 {系统}.{能力}.{动作} 的下划线分隔形式
  // ---------------------------------------------------------------
  const EVENT = Object.freeze({
    CAMERA_LIST:        'camera.list',         // 枚举 5 路摄像头
    CAMERA_OPEN:        'camera.open',         // 打开指定 sensor
    CAMERA_CAPTURE:     'camera.capture',      // 拍照
    AUDIO_ROUTE:        'audio.route',         // 切换输出：骨传导/扬声器
    AUDIO_SET_GAIN:     'audio.setGain',       // 设置音量
    MIC_OPEN:           'mic.open',            // 指定 4 麦中的一路/几路
    MIC_CLOSE:          'mic.close',
    VOICE_REGISTER:     'voice.registerKeyword', // 注册离线唤醒词
    VOICE_START:        'voice.startListen',   // 进入持续监听
    VOICE_STOP:         'voice.stopListen',
    DEVICE_INFO:        'device.info',         // 序列号/电量/温度
    DEVICE_LIGHT:       'device.setBrightness',// 调节光机亮度
    STORAGE_GET:        'storage.get',         // 读眼镜 32GB
    STORAGE_SET:        'storage.set',
    NET_STATUS:         'net.status',          // 5G/WiFi6/BT 状态
  });

  // ---------------------------------------------------------------
  // 2. 探测代码：扫描页面里所有候选的 bridge 对象
  // ---------------------------------------------------------------
  function detectBridge() {
    // [HYP-1] / [HYP-2] 直接挂 window 上的桥
    if (global.RokidJSBridge && typeof global.RokidJSBridge.callNative === 'function') {
      return { kind: 'callNative', bridge: global.RokidJSBridge };
    }
    if (global.RokidJSBridge && typeof global.RokidJSBridge.postMessage === 'function') {
      return { kind: 'postMessage', bridge: global.RokidJSBridge };
    }
    if (global.Rokid && global.Rokid.bridge) {
      return { kind: 'rokid-object', bridge: global.Rokid.bridge };
    }
    // Android WebView 同款兜底
    if (global.KJJSBridge && typeof global.KJJSBridge.callNative === 'function') {
      return { kind: 'kjbridge', bridge: global.KJJSBridge };
    }
    // iOS WKWebView messageHandlers
    if (global.webkit && global.webkit.messageHandlers && global.webkit.messageHandlers.rokid) {
      return { kind: 'wkwebview', bridge: global.webkit.messageHandlers.rokid };
    }
    return null;
  }

  // ---------------------------------------------------------------
  // 3. 通用 call：把 call() 内部适配到不同形态的桥
  // ---------------------------------------------------------------
  function makeCaller(detected) {
    if (!detected) return null;
    const { kind, bridge } = detected;

    // callNative(event, jsonString, callback)
    function callViaCallNative(event, payload) {
      return new Promise((resolve, reject) => {
        try {
          const ok = bridge.callNative(
            event,
            JSON.stringify(payload || {}),
            function (resp) {
              // 约定：resp 是 JSON 字符串，{code:0, data:..., msg:..}
              const parsed = safeJson(resp);
              if (parsed && parsed.code === 0) resolve(parsed.data);
              else reject(new Error(parsed && parsed.msg || 'callNative failed'));
            }
          );
          if (ok === false) reject(new Error('callNative returned false'));
        } catch (e) {
          reject(e);
        }
      });
    }

    // postMessage(cmd, payload, callback) - 部分版本 bridge 接受对象
    function callViaPostMessage(event, payload) {
      return new Promise((resolve, reject) => {
        try {
          bridge.postMessage(event, payload || {}, function (resp) {
            const parsed = typeof resp === 'object' ? resp : safeJson(resp);
            if (parsed && (parsed.code === 0 || parsed.success)) {
              resolve(parsed.data !== undefined ? parsed.data : parsed);
            } else {
              reject(new Error((parsed && parsed.msg) || 'postMessage failed'));
            }
          });
        } catch (e) { reject(e); }
      });
    }

    // iOS WKWebView messageHandlers
    function callViaWK(event, payload) {
      return new Promise((resolve, reject) => {
        try {
          const token = Symbol('rokid'); // 用于识别回调
          bridge.postMessage({ event, payload: payload || {}, token: String(token) });
          // WKWebView 的 postMessage 通常不会回传 promise，所以挂一个全局监听
          const onMsg = (ev) => {
            if (!ev || !ev.data) return;
            const data = typeof ev.data === 'string' ? safeJson(ev.data) : ev.data;
            if (data && (data.event === event || data.cmd === event)) {
              global.removeEventListener('message', onMsg);
              if (data.code === 0) resolve(data.data);
              else reject(new Error(data.msg || 'wk failed'));
            }
          };
          global.addEventListener('message', onMsg);
          // 兜底超时
          setTimeout(() => {
            global.removeEventListener('message', onMsg);
            reject(new Error('wk postMessage timeout'));
          }, 8000);
        } catch (e) { reject(e); }
      });
    }

    if (kind === 'callNative')  return callViaCallNative;
    if (kind === 'postMessage') return callViaPostMessage;
    if (kind === 'rokid-object' && typeof bridge === 'function') {
      return (ev, pl) => new Promise((res, rej) => {
        try { bridge(ev, pl || {}, (r) => r && r.code === 0 ? res(r.data) : rej(new Error(r && r.msg))); }
        catch (e) { rej(e); }
      });
    }
    if (kind === 'kjbridge')    return callViaCallNative;
    if (kind === 'wkwebview')   return callViaWK;
    return null;
  }

  function safeJson(s) { try { return JSON.parse(s); } catch (_) { return null; } }

  // ---------------------------------------------------------------
  // 4. 公开 API：探测状态 + call + info + ready 事件
  // ---------------------------------------------------------------
  const detected = detectBridge();
  const caller = makeCaller(detected);

  const RokidBridge = {
    /** 是否探测到 Rokid 原生桥 */
    available: !!caller,
    /** 探测到的桥类型（null 表示走 Web 兜底） */
    bridgeKind: detected ? detected.kind : null,
    /** 设备信息缓存（懒加载） */
    _device: null,

    /** 通用调用，event 见上方 EVENT 枚举 */
    async call(event, payload) {
      if (!caller) {
        const err = new Error(
          'RokidBridge unavailable: 没有探测到原生桥，将走 Web 兜底。' +
          '调用方请使用同包的 rokid-camera.js / rokid-audio.js / rokid-voice.js 等模块，' +
          '它们已经内置 PC 浏览器 fallback。'
        );
        err.code = 'NO_BRIDGE';
        throw err;
      }
      return caller(event, payload);
    },

    /** 取设备信息（电量/序列号/版本），失败时返回模拟数据 */
    async info() {
      if (this._device) return this._device;
      try {
        this._device = await this.call(EVENT.DEVICE_INFO, {});
      } catch (e) {
        // 兜底：返回 PC 浏览器信息，便于前端不报错
        this._device = {
          vendor: 'fallback', model: 'PC-Browser',
          serial: 'n/a', battery: null, version: 'web-mock',
        };
      }
      return this._device;
    },

    /** 一次性探测是否在 Rokid 眼镜里（带缓存） */
    async probe() {
      const info = await this.info();
      return {
        inRokidGlass: this.available && info && info.vendor !== 'fallback',
        info,
      };
    },
  };

  // 当 bridge 探测成功时，发出 ready 事件
  if (caller) {
    global.dispatchEvent(new CustomEvent('rokid:ready', { detail: RokidBridge }));
  } else {
    // 延迟 500ms 后再探测一次：部分 Rokid WebView 注入较晚
    setTimeout(() => {
      const d2 = detectBridge();
      if (d2) {
        const c2 = makeCaller(d2);
        if (c2) {
          RokidBridge.available = true;
          RokidBridge.bridgeKind = d2.kind;
          RokidBridge.call = (e, p) => c2(e, p);
          global.dispatchEvent(new CustomEvent('rokid:ready', { detail: RokidBridge }));
        }
      }
    }, 500);
  }

  global.RokidBridge = RokidBridge;
  global.RokidEvent = EVENT;

  console.info('[RokidBridge] init', RokidBridge.available
    ? '已探测到原生桥 kind=' + RokidBridge.bridgeKind
    : '未探测到原生桥，将走 Web 兜底');
})(typeof window !== 'undefined' ? window : globalThis);
