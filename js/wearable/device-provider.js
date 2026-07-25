/**
 * device-provider.js
 * ====================================================================
 * 命理宝jian · 多品牌穿戴设备统一抽象接口（Brand-Agnostic）
 * --------------------------------------------------------------------
 * 设计目标：
 *   - Rokid 是第一个品牌，后续会有小米/华为/Apple Vision/Samsung
 *   - 主业务逻辑不绑定任何品牌 SDK
 *   - 新增品牌只需新增一个 adapter 文件 + 注册到 factory
 *
 * 接口分层：
 *   1) IDeviceProvider       抽象基接口（每个品牌都实现）
 *   2) IRokidProvider        Rokid 专属能力（继承 IDeviceProvider）
 *   3) IWebFallbackProvider  浏览器标准 API fallback（永远可用）
 *   4) DeviceProviderFactory 工厂 + 注册表
 *   5) IBridgeChannel        多端协同（眼镜 ↔ 电脑/平板）
 *   6) IHealthReporter       健康上报
 * ====================================================================
 */

/* ============================================================
 * 一、抽象基接口 IDeviceProvider
 * ============================================================ */

/**
 * 设备能力描述
 * @typedef {Object} DeviceCapability
 * @property {string[]} cameras        - 可枚举摄像头 ID 列表
 * @property {string[]} microphones    - 可枚举麦克风 ID 列表
 * @property {boolean}  boneConduction - 是否支持骨传导音频输出
 * @property {boolean}  voiceWakeup    - 是否支持离线唤醒词
 * @property {boolean}  motionSensor   - 是否支持九轴陀螺仪
 * @property {boolean}  localStorage   - 是否支持大文件本地存储
 * @property {boolean}  cloudSync      - 是否支持云端同步
 * @property {number}   batteryLevel   - 当前电量 0-1
 */

/**
 * 摄像头描述
 * @typedef {Object} CameraDescriptor
 * @property {string}  id           - 设备 ID
 * @property {string}  label        - 摄像头名（如"舌诊微距 48MP"）
 * @property {string}  role         - 角色：'tongue'|'face'|'eye'|'hand'|'other'
 * @property {number}  pixelCount   - 像素（万）
 * @property {number}  minFocusDist - 最近对焦距离（cm）
 */

/**
 * 抽象基接口（JavaScript 实现用 duck typing）
 * 所有品牌 adapter 必须实现以下方法：
 *
 *   async probe()                       -> DeviceCapability
 *   async enumerateCameras()            -> CameraDescriptor[]
 *   async openCamera(roleOrId)          -> MediaStream
 *   async openMicrophone(deviceId?)     -> MediaStream
 *   async routeAudio(stream, mode)      -> boolean  (mode: 'bone'|'speaker'|'auto')
 *   async setVoiceWakeup(words, cb)     -> unsubscribe fn
 *   async startMotion(interval, cb)     -> unsubscribe fn
 *   async localCacheGet(key)            -> Promise<any>
 *   async localCacheSet(key, value, ttl?) -> Promise<void>
 *   async cloudSync(data, target)       -> Promise<{ok, remoteId}>
 *   startHealthReporter(intervalMs, cb) -> unsubscribe fn
 *   destroy()
 *
 * 以上方法是"约定"，具体 adapter 可选择实现子集。
 * 调用方需先 probe() 看能力再调用。
 */
class IDeviceProvider {
  /**
   * @returns {string} 品牌标识（如 'rokid' / 'web-fallback' / 'xiaomi'）
   */
  get brand() { throw new Error('not implemented'); }

  /**
   * @returns {Promise<DeviceCapability>}
   */
  async probe() { throw new Error('not implemented'); }

  /**
   * @returns {Promise<CameraDescriptor[]>}
   */
  async enumerateCameras() { throw new Error('not implemented'); }

  /**
   * @param {string} roleOrId 角色名 'tongue'/'face'/'eye'/'hand' 或设备 ID
   * @returns {Promise<MediaStream>}
   */
  async openCamera(roleOrId) { throw new Error('not implemented'); }

  /**
   * @param {string} [deviceId]
   * @returns {Promise<MediaStream>}
   */
  async openMicrophone(deviceId) { throw new Error('not implemented'); }

  /**
   * @param {MediaStream} stream
   * @param {'bone'|'speaker'|'auto'} mode
   * @returns {Promise<boolean>}
   */
  async routeAudio(stream, mode = 'auto') { throw new Error('not implemented'); }

  /**
   * @param {string[]} words
   * @param {(keyword: string, confidence: number) => void} cb
   * @returns {() => void} unsubscribe
   */
  async setVoiceWakeup(words, cb) { throw new Error('not implemented'); }

  /**
   * @param {number} intervalMs
   * @param {(motion: {pitch: number, roll: number, yaw: number}) => void} cb
   * @returns {() => void} unsubscribe
   */
  async startMotion(intervalMs, cb) { throw new Error('not implemented'); }

  /**
   * @param {string} key
   * @returns {Promise<any>}
   */
  async localCacheGet(key) { throw new Error('not implemented'); }

  /**
   * @param {string} key
   * @param {any} value
   * @param {number} [ttlMs]
   * @returns {Promise<void>}
   */
  async localCacheSet(key, value, ttlMs) { throw new Error('not implemented'); }

  /**
   * @param {any} data
   * @param {'cloud'|'companion'} target
   * @returns {Promise<{ok: boolean, remoteId?: string}>}
   */
  async cloudSync(data, target = 'cloud') { throw new Error('not implemented'); }

  /**
   * @param {number} intervalMs
   * @param {(report: HealthReport) => void} cb
   * @returns {() => void} unsubscribe
   */
  startHealthReporter(intervalMs, cb) { throw new Error('not implemented'); }

  destroy() { throw new Error('not implemented'); }
}

/* ============================================================
 * 二、健康上报 schema
 * ============================================================ */

/**
 * @typedef {Object} HealthReport
 * @property {string}  brand
 * @property {number}  battery           - 0-1
 * @property {number}  latencyMs         - 最近一次响应延迟
 * @property {number}  fps               - 摄像头帧率
 * @property {string[]} errors           - 最近错误摘要
 * @property {Object}  metadata          - 品牌自由扩展
 */

const HEALTH_REPORT_SCHEMA = {
  brand: 'string',
  battery: 'number:0-1',
  latencyMs: 'number:>=0',
  fps: 'number:>=0',
  errors: 'string[]',
  metadata: 'object'
};

/* ============================================================
 * 三、Web Fallback Provider（永远可用）
 * ============================================================ */

/**
 * 基于浏览器标准 API 的退化实现。
 * 不需要任何品牌眼镜，在 PC/手机浏览器即可用。
 *
 * 能力：
 *   - cameras: enumerateDevices() 列举（不含品牌细节）
 *   - microphones: 同上
 *   - boneConduction: ❌（无硬件能力）
 *   - voiceWakeup: ⚠️ 用 Web Speech API 模拟（依赖网络）
 *   - motionSensor: ✅ 用 DeviceOrientation
 *   - localStorage: ✅ 用 IndexedDB
 *   - cloudSync: ✅ 用 fetch + WebSocket
 */
class IWebFallbackProvider extends IDeviceProvider {
  get brand() { return 'web-fallback'; }

  async probe() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return {
      cameras: devices.filter(d => d.kind === 'videoinput').map(d => d.deviceId),
      microphones: devices.filter(d => d.kind === 'audioinput').map(d => d.deviceId),
      boneConduction: false,
      voiceWakeup: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
      motionSensor: 'DeviceOrientationEvent' in window,
      localStorage: 'indexedDB' in window,
      cloudSync: 'fetch' in window,
      batteryLevel: 1.0  // 浏览器无法获取，假设满电
    };
  }

  async enumerateCameras() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices
      .filter(d => d.kind === 'videoinput')
      .map((d, i) => ({
        id: d.deviceId,
        label: d.label || `Camera ${i}`,
        role: 'other',  // 浏览器无法识别角色
        pixelCount: 0,  // 浏览器无法识别
        minFocusDist: 0
      }));
  }

  async openCamera(roleOrId) {
    const constraints = roleOrId && roleOrId.length > 20
      ? { video: { deviceId: { exact: roleOrId } } }
      : { video: { facingMode: 'user' } };
    return await navigator.mediaDevices.getUserMedia(constraints);
  }

  async openMicrophone(deviceId) {
    const constraints = deviceId
      ? { audio: { deviceId: { exact: deviceId } } }
      : { audio: true };
    return await navigator.mediaDevices.getUserMedia(constraints);
  }

  async routeAudio(stream, mode = 'auto') {
    // 浏览器无法选择音频路由，只能挂在 default destination
    if (stream.getAudioTracks().length === 0) return false;
    return true;  // 表示"已路由到默认输出"
  }

  async setVoiceWakeup(words, cb) {
    // Web Speech API 单次识别，需要循环监听
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return () => {};
    const recog = new SR();
    recog.continuous = true;
    recog.interimResults = false;
    recog.lang = 'zh-CN';
    recog.onresult = (event) => {
      const last = event.results[event.results.length - 1];
      const text = last[0].transcript.trim();
      // 简单匹配：只要文本包含任一唤醒词
      for (const w of words) {
        if (text.includes(w)) {
          cb(w, last[0].confidence || 0.9);
          break;
        }
      }
    };
    recog.onerror = (e) => console.warn('voiceWakeup error:', e.error);
    recog.start();
    return () => recog.stop();
  }

  async startMotion(intervalMs, cb) {
    if (!('DeviceOrientationEvent' in window)) return () => {};
    const handler = (event) => {
      cb({
        pitch: event.beta || 0,
        roll:  event.gamma || 0,
        yaw:   event.alpha || 0
      });
    };
    // iOS 13+ 需要 requestPermission
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission !== 'granted') return () => {};
      } catch (e) { return () => {}; }
    }
    const timer = setInterval(() => {
      // 节流：实际事件触发即可，但用 interval 保持稳定
    }, intervalMs);
    window.addEventListener('deviceorientation', handler);
    return () => {
      clearInterval(timer);
      window.removeEventListener('deviceorientation', handler);
    };
  }

  async localCacheGet(key) {
    return new Promise((resolve) => {
      const req = indexedDB.open('mingli-baojian-cache', 1);
      req.onsuccess = () => {
        const tx = req.result.transaction('kv', 'readonly');
        const get = tx.objectStore('kv').get(key);
        get.onsuccess = () => resolve(get.result || null);
        get.onerror = () => resolve(null);
      };
      req.onerror = () => resolve(null);
    });
  }

  async localCacheSet(key, value, ttlMs) {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('mingli-baojian-cache', 1);
      req.onsuccess = () => {
        const tx = req.result.transaction('kv', 'readwrite');
        const payload = { value, expireAt: ttlMs ? Date.now() + ttlMs : null };
        tx.objectStore('kv').put(payload, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async cloudSync(data, target = 'cloud') {
    // 默认走 /api/companion/sync 后端代理
    try {
      const res = await fetch('/api/companion/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, target })
      });
      return { ok: res.ok, remoteId: (await res.json()).id };
    } catch (e) {
      return { ok: false };
    }
  }

  startHealthReporter(intervalMs, cb) {
    const timer = setInterval(() => {
      cb({
        brand: this.brand,
        battery: 1.0,
        latencyMs: 0,
        fps: 0,
        errors: [],
        metadata: { userAgent: navigator.userAgent }
      });
    }, intervalMs);
    return () => clearInterval(timer);
  }

  destroy() { /* noop */ }
}

/* ============================================================
 * 四、工厂 + 注册表
 * ============================================================ */

/**
 * 设备 provider 工厂
 *
 * 用法：
 *   const factory = new DeviceProviderFactory();
 *   factory.register('rokid', () => new IRokidProvider(...));
 *   factory.register('web-fallback', () => new IWebFallbackProvider());
 *   const provider = await factory.create();  // 自动探测最佳 provider
 *   const provider = await factory.create('rokid');  // 强制指定
 */
class DeviceProviderFactory {
  constructor() {
    /** @type {Map<string, () => IDeviceProvider>} */
    this._registry = new Map();
  }

  /**
   * 注册 provider 构造函数
   * @param {string} brand
   * @param {() => IDeviceProvider} factory
   */
  register(brand, factory) {
    this._registry.set(brand, factory);
  }

  /**
   * 自动探测最佳 provider
   * 优先级：rokid > xiaomi > huawei > web-fallback
   * @returns {Promise<IDeviceProvider>}
   */
  async create(preferredBrand) {
    if (preferredBrand && this._registry.has(preferredBrand)) {
      return this._registry.get(preferredBrand)();
    }
    // 自动探测：调用每个 provider 的 probe() 看 capability
    const candidates = [];
    for (const [brand, factory] of this._registry) {
      try {
        const provider = factory();
        const cap = await provider.probe();
        const score = this._scoreCapability(cap);
        candidates.push({ brand, provider, score });
      } catch (e) {
        console.warn(`Provider ${brand} probe failed:`, e);
      }
    }
    if (candidates.length === 0) {
      throw new Error('No device provider available');
    }
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0].provider;
  }

  /**
   * 评分 capability，分数越高越优
   * @param {DeviceCapability} cap
   * @returns {number}
   */
  _scoreCapability(cap) {
    let score = 0;
    if (cap.boneConduction) score += 10;
    if (cap.voiceWakeup) score += 5;
    if (cap.motionSensor) score += 3;
    if (cap.cameras.length > 1) score += 4;
    if (cap.cameras.length > 3) score += 6;
    if (cap.localStorage) score += 2;
    if (cap.cloudSync) score += 2;
    return score;
  }

  /**
   * 列出所有已注册品牌
   * @returns {string[]}
   */
  list() {
    return Array.from(this._registry.keys());
  }
}

/* ============================================================
 * 五、多端协同接口（眼镜 ↔ 电脑/平板）
 * ============================================================ */

/**
 * 多端协同 channel 接口
 *
 * 传输方式优先级：
 *   1) WebRTC DataChannel（低延迟，需建立 peer）
 *   2) WebSocket（标准，需服务端）
 *   3) BroadcastChannel（同源同浏览器多 tab 间）
 *   4) localStorage + storage event（兜底）
 *
 * 消息格式（统一）：
 *   { type: 'voice'|'query'|'answer'|'notify'|'display'|'sync',
 *     payload: any,
 *     from: 'glass'|'desktop'|'tablet',
 *     to: 'glass'|'desktop'|'tablet'|'*',
 *     ts: number }
 */
class IBridgeChannel {
  /**
   * @returns {Promise<boolean>} 是否连接成功
   */
  async connect() { throw new Error('not implemented'); }

  /**
   * @param {Object} message
   */
  send(message) { throw new Error('not implemented'); }

  /**
   * @param {(message: Object) => void} cb
   * @returns {() => void} unsubscribe
   */
  onMessage(cb) { throw new Error('not implemented'); }

  close() { throw new Error('not implemented'); }
}

/**
 * BroadcastChannel 实现（同浏览器多 tab 间通讯，最简单）
 * 用于：电脑端打开 divination-hub，H5 端打开 glass-console
 * 同一域名下自动通信。
 */
class BroadcastChannelBridge extends IBridgeChannel {
  constructor(channelName = 'mingli-baojian-bridge') {
    super();
    this.channelName = channelName;
    this.channel = null;
  }

  async connect() {
    if (typeof BroadcastChannel === 'undefined') return false;
    this.channel = new BroadcastChannel(this.channelName);
    return true;
  }

  send(message) {
    if (!this.channel) return;
    this.channel.postMessage({ ...message, ts: Date.now() });
  }

  onMessage(cb) {
    if (!this.channel) return () => {};
    this.channel.onmessage = (event) => cb(event.data);
    return () => { if (this.channel) this.channel.close(); };
  }

  close() {
    if (this.channel) this.channel.close();
    this.channel = null;
  }
}

/**
 * WebSocket Bridge（跨设备，需后端做中转）
 * 服务端可部署在 8920 端口：/api/companion/ws
 */
class WebSocketBridge extends IBridgeChannel {
  constructor(url = 'ws://127.0.0.1:8920/api/companion/ws') {
    super();
    this.url = url;
    this.ws = null;
  }

  async connect() {
    return new Promise((resolve) => {
      this.ws = new WebSocket(this.url);
      this.ws.onopen = () => resolve(true);
      this.ws.onerror = () => resolve(false);
    });
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ ...message, ts: Date.now() }));
    }
  }

  onMessage(cb) {
    if (!this.ws) return () => {};
    this.ws.onmessage = (event) => cb(JSON.parse(event.data));
    return () => { if (this.ws) this.ws.close(); };
  }

  close() {
    if (this.ws) this.ws.close();
    this.ws = null;
  }
}

/* ============================================================
 * 六、健康上报
 * ============================================================ */

class IHealthReporter {
  /**
   * @param {IDeviceProvider} provider
   * @param {number} intervalMs
   * @param {(report: HealthReport) => void} cb
   */
  constructor(provider, intervalMs = 30000, cb) {
    this.provider = provider;
    this.intervalMs = intervalMs;
    this.cb = cb;
    this.errors = [];
    this.unsubscribe = null;
  }

  start() {
    this.unsubscribe = this.provider.startHealthReporter(this.intervalMs, (report) => {
      // 合并本地错误队列
      const merged = { ...report, errors: [...this.errors, ...(report.errors || [])] };
      this.errors = [];
      this.cb(merged);
    });
  }

  recordError(err) {
    const msg = err instanceof Error ? err.message : String(err);
    this.errors.push(msg);
    if (this.errors.length > 10) this.errors = this.errors.slice(-10);
  }

  stop() {
    if (this.unsubscribe) this.unsubscribe();
  }
}

/* ============================================================
 * 七、未来品牌接入清单（难度评估）
 * ============================================================ */

/**
 * 各品牌 SDK 接入难度评估
 *
 * | 品牌          | 型号           | SDK 类型           | 难度 | 备注
 * |--------------|---------------|-------------------|------|------
 * | Rokid        | Max Pro/Air   | Android Native    | 中   | 已有 bridge.js + audio/camera/voice/motion 6 文件
 * | 小米米家      | MIUI Glasses  | Android Native    | 中   | 复用 MediaDevices + 自定义 JSBridge
 * | 华为 Eyewear  | Smart Glass   | HarmonyOS Native  | 高   | 需鸿蒙 JS API 重写
 * | XREAL        | Air 2 Ultra   | Nebula OS + Web   | 低   | 复用 web-fallback
 * | INMO         | Air2          | Android Native    | 中   | 同 Rokid
 * | 雷鸟         | X2            | Android Native    | 中   | 同 Rokid
 * | Meta Ray-Ban | Stories       | WhatsApp API      | 高   | 只能单向通知
 * | Apple Vision | Pro           | visionOS JS       | 高   | visionOS 不开放 web，需 PWA + native shell
 *
 * P0（用户已购）：Rokid（已有代码）
 * P1（3 个月内）：小米米家 / XREAL
 * P2（6 个月）：华为 / INMO / 雷鸟
 * P3（探索）：Meta Ray-Ban / Apple Vision Pro
 */

/* ============================================================
 * 八、默认导出
 * ============================================================ */

const factory = new DeviceProviderFactory();

// 默认注册 web-fallback（永远可用）
factory.register('web-fallback', () => new IWebFallbackProvider());

// Rokid adapter 单独文件注册：IRokidProvider
// 见：rokid-bridge.js / rokid-camera.js / rokid-audio.js / rokid-voice.js / rokid-motion.js / rokid-storage.js
// 用法：
//   import { RokidProvider } from './rokid-glass.js';
//   factory.register('rokid', () => new RokidProvider());

// 浏览器端使用：
//   const device = await factory.create();           // 自动探测
//   const device = await factory.create('rokid');    // 强制 Rokid
//   const cap = await device.probe();                // 看能力
//   const stream = await device.openCamera('tongue'); // 开舌诊摄像头

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    IDeviceProvider,
    IWebFallbackProvider,
    DeviceProviderFactory,
    IBridgeChannel,
    BroadcastChannelBridge,
    WebSocketBridge,
    IHealthReporter,
    HEALTH_REPORT_SCHEMA,
    factory
  };
} else if (typeof window !== 'undefined') {
  window.DeviceProvider = {
    IDeviceProvider,
    IWebFallbackProvider,
    DeviceProviderFactory,
    IBridgeChannel,
    BroadcastChannelBridge,
    WebSocketBridge,
    IHealthReporter,
    factory
  };
}