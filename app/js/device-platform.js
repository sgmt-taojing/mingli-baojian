/* ============================================================================
 * 设备统一抽象平台 (Device Platform) · R46
 * 适配：摄像头(看) / 麦克风(听) / AR眼镜(穿戴) / 蓝牙耳机 / 桌面传感器
 * 设计原则：
 *   - 单一能力接口（capability-based）
 *   - 统一生命周期（discover→register→authorize→activate→monitor→deactivate）
 *   - 事件总线（connect/disconnect/error/health）
 *   - 健康指标（fps/latency/bitrate/errorRate）
 *   - 接入插件化（vision/audio/wearable/sensor 四类）
 * ============================================================================ */

(function (global) {
  'use strict';

  // ============== 设备类型与能力定义 ==============
  const DEVICE_CATEGORIES = {
    vision: {
      name: '看 · 视觉设备',
      icon: '👁',
      subTypes: ['camera', 'ar_glasses', 'desktop_camera', 'smart_glasses', 'ring_camera']
    },
    audio: {
      name: '听 · 音频设备',
      icon: '👂',
      subTypes: ['microphone', 'headset', 'speaker', 'earbuds', 'smart_glasses_mic']
    },
    wearable: {
      name: '穿戴 · 智能硬件',
      icon: '⌚',
      subTypes: ['smart_watch', 'smart_ring', 'ar_glasses', 'fitness_band', 'sleep_tracker']
    },
    sensor: {
      name: '传感器 · 环境感知',
      icon: '📡',
      subTypes: ['heart_rate', 'spo2', 'imu', 'gps', 'ambient_light', 'temperature']
    }
  };

  const CAPABILITY_REGISTRY = {
    'face_capture': { category: 'vision', desc: '面诊拍照' },
    'tongue_capture': { category: 'vision', desc: '舌诊拍照' },
    'eye_capture': { category: 'vision', desc: '眼诊拍照' },
    'document_ocr': { category: 'vision', desc: '文档 OCR' },
    'wearable_view': { category: 'vision', desc: '穿戴端视野（第一人称）' },
    'voice_record': { category: 'audio', desc: '语音录制' },
    'stt_realtime': { category: 'audio', desc: '实时语音转文字' },
    'wake_word': { category: 'audio', desc: '唤醒词检测' },
    'audio_play': { category: 'audio', desc: '音频播放' },
    'battery_report': { category: 'wearable', desc: '电池电量' },
    'step_count': { category: 'wearable', desc: '步数统计' },
    'heart_rate': { category: 'sensor', desc: '心率监测' },
    'spo2': { category: 'sensor', desc: '血氧监测' },
    'sleep_quality': { category: 'sensor', desc: '睡眠质量' },
    'motion': { category: 'sensor', desc: '运动 / 姿态' }
  };

  // ============== 事件总线 ==============
  class EventBus {
    constructor() { this.listeners = new Map(); }
    on(event, cb) {
      if (!this.listeners.has(event)) this.listeners.set(event, []);
      this.listeners.get(event).push(cb);
      return () => this.off(event, cb);
    }
    off(event, cb) {
      const arr = this.listeners.get(event);
      if (!arr) return;
      const i = arr.indexOf(cb);
      if (i >= 0) arr.splice(i, 1);
    }
    emit(event, payload) {
      const arr = this.listeners.get(event);
      if (!arr) return;
      arr.forEach(cb => { try { cb(payload); } catch (e) { console.error('[DeviceBus]', event, e); } });
    }
  }

  // ============== 设备抽象基类 ==============
  class Device {
    constructor(opts) {
      this.id = opts.id || ('dev-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6));
      this.vendor = opts.vendor || '未知厂商';
      this.model = opts.model || '未知型号';
      this.category = opts.category;       // vision / audio / wearable / sensor
      this.subType = opts.subType || 'unknown';
      this.capabilities = opts.capabilities || [];
      this.connection = opts.connection || 'unknown'; // usb / bluetooth / thunderbolt / internal
      this.status = 'discovered';          // discovered / registered / authorized / online / error / offline
      this.error = null;
      this.lastSeen = Date.now();
      this.metadata = opts.metadata || {};
      this.healthMetrics = {
        fps: 0,
        latencyMs: 0,
        bitrateKbps: 0,
        errorCount: 0,
        errorRate: 0,
        batteryPct: null,
        signalDbm: null,
        uptimeSec: 0
      };
      this.healthHistory = []; // 最近 60 次采样
      this.eventCount = 0;
    }

    hasCapability(cap) { return this.capabilities.includes(cap); }

    updateHealth(metric) {
      this.lastSeen = Date.now();
      Object.assign(this.healthMetrics, metric);
      this.healthHistory.push({ t: Date.now(), ...metric });
      if (this.healthHistory.length > 60) this.healthHistory.shift();
      this.eventCount++;
      if (this.status === 'registered' && this.healthMetrics.fps > 0) this.status = 'online';
    }

    markError(msg) {
      this.status = 'error';
      this.error = msg;
      this.healthMetrics.errorCount++;
    }

    toJSON() {
      return {
        id: this.id,
        vendor: this.vendor,
        model: this.model,
        category: this.category,
        subType: this.subType,
        capabilities: this.capabilities,
        connection: this.connection,
        status: this.status,
        error: this.error,
        lastSeen: this.lastSeen,
        metadata: this.metadata,
        health: this.healthMetrics,
        eventCount: this.eventCount
      };
    }
  }

  // ============== 桥接器：浏览器原生 ==============
  class WebMediaBridge {
    constructor() {
      this.kind = 'web_media';
      this.bus = new EventBus();
      this.devices = new Map();
      this.knownDeviceIds = { videoinput: new Set(), audioinput: new Set(), audiooutput: new Set() };
      this._pollTimer = null;
    }

    async discover() {
      if (!navigator.mediaDevices) return [];
      const all = await navigator.mediaDevices.enumerateDevices();
      const found = [];
      all.forEach(d => {
        const subType = d.kind === 'videoinput' ? 'camera' : d.kind === 'audioinput' ? 'microphone' : 'speaker';
        const category = d.kind === 'videoinput' ? 'vision' : 'audio';
        const capabilities = d.kind === 'videoinput'
          ? ['face_capture', 'tongue_capture', 'eye_capture', 'document_ocr']
          : ['voice_record', 'stt_realtime', 'wake_word'];

        const id = 'webmedia-' + d.deviceId.slice(0, 12);
        const dev = new Device({
          id, vendor: '浏览器原生', model: d.label || subType,
          category, subType, capabilities,
          connection: 'internal',
          metadata: { deviceId: d.deviceId, groupId: d.groupId, kind: d.kind }
        });
        this.devices.set(id, dev);
        this.knownDeviceIds[d.kind].add(d.deviceId);
        found.push(dev);
      });
      return found;
    }

    startHotplug() {
      if (!navigator.mediaDevices) return;
      navigator.mediaDevices.addEventListener('devicechange', () => this._check());
      this._pollTimer = setInterval(() => this._check(), 3000);
    }

    stopHotplug() {
      if (this._pollTimer) { clearInterval(this._pollTimer); this._pollTimer = null; }
    }

    async _check() {
      try {
        const all = await navigator.mediaDevices.enumerateDevices();
        const currentIds = {
          videoinput: new Set(all.filter(d => d.kind === 'videoinput').map(d => d.deviceId)),
          audioinput: new Set(all.filter(d => d.kind === 'audioinput').map(d => d.deviceId)),
          audiooutput: new Set(all.filter(d => d.kind === 'audiooutput').map(d => d.deviceId))
        };
        // 新设备
        ['videoinput', 'audioinput', 'audiooutput'].forEach(kind => {
          currentIds[kind].forEach(id => {
            if (!this.knownDeviceIds[kind].has(id)) {
              this.bus.emit('device:connected', { kind, deviceId: id, ts: Date.now() });
            }
          });
          this.knownDeviceIds[kind].forEach(id => {
            if (!currentIds[kind].has(id)) {
              this.bus.emit('device:disconnected', { kind, deviceId: id, ts: Date.now() });
            }
          });
          this.knownDeviceIds[kind] = currentIds[kind];
        });
      } catch (e) {
        this.bus.emit('device:error', { source: 'webmedia', error: e.message });
      }
    }

    async authorize(deviceId, video = true, audio = true) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: video ? { deviceId: { exact: deviceId } } : false,
          audio: audio ? { deviceId: { exact: deviceId } } : false
        });
        // 启动健康监测
        this._startStreamHealth(stream);
        return { ok: true, stream };
      } catch (e) {
        return { ok: false, error: e.message };
      }
    }

    _startStreamHealth(stream) {
      const t0 = Date.now();
      const tracks = stream.getTracks();
      trackLoop();
      function trackLoop() {
        tracks.forEach(t => {
          if (t.kind === 'video' && typeof t.getSettings === 'function') {
            const s = t.getSettings();
            this.bus.emit('device:health', {
              deviceId: t.getSettings().deviceId || 'unknown',
              metric: { fps: s.frameRate || 0, latencyMs: Date.now() - t0, bitrateKbps: 0 }
            });
          }
        });
        if (tracks.some(t => t.readyState === 'live')) setTimeout(() => trackLoop(), 2000);
      }
    }
  }

  // ============== 桥接器：Web Bluetooth ==============
  class BluetoothBridge {
    constructor() {
      this.kind = 'bluetooth';
      this.bus = new EventBus();
      this.devices = new Map();
      this.supported = typeof navigator !== 'undefined' && 'bluetooth' in navigator;
    }

    async discover() {
      if (!this.supported) return [];
      try {
        const bt = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ['battery_service', 'heart_rate', 'generic_access']
        });
        const id = 'bt-' + bt.id;
        const dev = new Device({
          id, vendor: bt.name || 'BT 设备', model: bt.name || '蓝牙设备',
          category: 'wearable', subType: 'smart_watch',
          capabilities: ['battery_report', 'heart_rate'],
          connection: 'bluetooth',
          metadata: { id: bt.id, name: bt.name }
        });
        this.devices.set(id, dev);
        return [dev];
      } catch (e) {
        return []; // 用户拒绝或不支持
      }
    }

    async readBattery(deviceId) {
      // 简化：Web Bluetooth 读取电池服务的 0x180F
      try {
        const dev = await navigator.bluetooth.requestDevice({
          filters: [{ services: ['battery_service'] }]
        });
        const server = await dev.gatt.connect();
        const service = await server.getPrimaryService('battery_service');
        const char = await service.getCharacteristic('battery_level');
        const value = await char.readValue();
        return value.getUint8(0);
      } catch (e) {
        return null;
      }
    }
  }

  // ============== 桥接器：Web USB（Type-C 硬件） ==============
  class USBBridge {
    constructor() {
      this.kind = 'usb';
      this.bus = new EventBus();
      this.devices = new Map();
      this.supported = typeof navigator !== 'undefined' && 'usb' in navigator;
    }

    async discover() {
      if (!this.supported) return [];
      try {
        const devices = await navigator.usb.getDevices();
        return devices.map(ud => {
          const id = 'usb-' + ud.productId + '-' + ud.vendorId;
          // 推断类目
          const isCamera = ud.class === 0x0E; // UVC
          const isAudio = ud.class === 0x01;  // USB Audio
          const category = isCamera ? 'vision' : isAudio ? 'audio' : 'sensor';
          const subType = isCamera ? 'camera' : isAudio ? 'headset' : 'unknown';
          const capabilities = isCamera
            ? ['face_capture', 'document_ocr']
            : isAudio ? ['voice_record', 'stt_realtime'] : ['battery_report'];
          const dev = new Device({
            id, vendor: ud.manufacturerName || 'USB 设备', model: ud.productName || 'Type-C 硬件',
            category, subType, capabilities,
            connection: 'usb',
            metadata: { productId: ud.productId, vendorId: ud.vendorId, serialNumber: ud.serialNumber }
          });
          this.devices.set(id, dev);
          return dev;
        });
      } catch (e) {
        return [];
      }
    }
  }

  // ============== 桥接器：AR 眼镜（WebHID / 厂商 SDK） ==============
  class ARGlassesBridge {
    constructor() {
      this.kind = 'ar_glasses';
      this.bus = new EventBus();
      this.devices = new Map();
      // 已知 AR 眼镜厂商映射（预留 SDK 接入位）
      this.knownVendors = {
        'rokid': { name: 'Rokid Air / Lite', capabilities: ['wearable_view', 'face_capture', 'voice_record', 'stt_realtime'] },
        'evenrealities': { name: 'Even Realities G1', capabilities: ['wearable_view', 'voice_record'] },
        'brilliant': { name: 'Brilliant Labs Frame', capabilities: ['wearable_view', 'face_capture'] },
        'rayneo': { name: 'RayNeo X2', capabilities: ['wearable_view', 'face_capture', 'voice_record'] }
      };
    }

    discover() {
      const found = [];
      // 探测 Rokid 原生桥
      const rokidReady = !!(global.RokidBridge && global.RokidBridge.available);
      Object.entries(this.knownVendors).forEach(([vendor, spec]) => {
        const id = 'ar-' + vendor;
        const dev = new Device({
          id, vendor: spec.name, model: spec.name,
          category: 'wearable', subType: 'ar_glasses',
          capabilities: spec.capabilities,
          connection: 'bluetooth',
          metadata: { vendor, sdkReady: vendor === 'rokid' ? rokidReady : false }
        });
        // Rokid 探测到原生桥则标记为已注册
        if (vendor === 'rokid' && rokidReady) {
          dev.status = 'registered';
          dev.metadata.bridgeKind = global.RokidBridge.bridgeKind;
          this.bus.emit('rokid:bridge:ready', { vendor, bridgeKind: dev.metadata.bridgeKind });
        } else {
          dev.status = 'discovered';
        }
        this.devices.set(id, dev);
        found.push(dev);
      });
      return found;
    }

    /**
     * 探测原生厂商桥（外部可调用强制刷新）
     */
    async probeRokid() {
      if (typeof global.RokidBridge === 'undefined') {
        // 动态注入探测脚本（如果项目里加载了 rokid-bridge.js）
        try {
          await new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'js/wearable/rokid-bridge.js';
            s.onload = resolve;
            s.onerror = reject;
            document.head.appendChild(s);
          });
        } catch (e) {
          return { ready: false, error: e.message };
        }
      }
      // 等探测周期完成（500ms）
      if (global.RokidBridge && !global.RokidBridge.available) {
        await new Promise(r => setTimeout(r, 800));
      }
      const ready = !!(global.RokidBridge && global.RokidBridge.available);
      return {
        ready,
        bridgeKind: global.RokidBridge ? global.RokidBridge.bridgeKind : null,
        event: global.RokidEvent || null
      };
    }

    /**
     * Rokid 拍照（舌诊/面诊）
     */
    async capturePhoto(mode = 'face') {
      if (!global.RokidBridge || !global.RokidBridge.available) {
        return { ok: false, error: 'Rokid 原生桥未就绪' };
      }
      try {
        const result = await global.RokidBridge.call('camera.capture', { mode, resolution: 'high' });
        return { ok: true, data: result };
      } catch (e) {
        return { ok: false, error: e.message };
      }
    }

    /**
     * Rokid TTS 念一句话（骨传导优先）
     */
    async speak(text) {
      if (!global.RokidBridge || !global.RokidBridge.available) {
        return { ok: false, error: 'Rokid 原生桥未就绪' };
      }
      try {
        const result = await global.RokidBridge.call('audio.speak', { text, channel: 'bone_conduction' });
        return { ok: true, data: result };
      } catch (e) {
        return { ok: false, error: e.message };
      }
    }

    /**
     * Rokid 订阅姿态（点头/摇头）
     */
    onMotion(cb) {
      if (!global.RokidBridge || !global.RokidBridge.available) return false;
      try {
        global.RokidBridge.call('motion.subscribe', { types: ['head_nod', 'head_shake'] });
        global.addEventListener('rokid:motion', e => cb(e.detail));
        return true;
      } catch (e) {
        return false;
      }
    }
  }

  // ============== 中央协调器 ==============
  class DevicePlatform {
    constructor() {
      this.bus = new EventBus();
      this.devices = new Map();         // id → Device
      this.bridges = {
        webmedia: new WebMediaBridge(),
        bluetooth: new BluetoothBridge(),
        usb: new USBBridge(),
        ar_glasses: new ARGlassesBridge()
      };
      this.userProfile = {
        preferredCameraId: null,
        preferredMicId: null,
        preferredSpeakerId: null,
        preferredArGlassesId: null,
        labels: {}  // deviceId → 用户自定义名
      };
      this._loadProfile();
      this._wireBridgeEvents();
    }

    async discoverAll() {
      // 全部桥接器并行扫描
      const [webmedia, bluetooth, usb, ar] = await Promise.all([
        this.bridges.webmedia.discover(),
        this.bridges.bluetooth.discover(),
        this.bridges.usb.discover(),
        Promise.resolve(this.bridges.ar_glasses.discover())
      ]);
      [...webmedia, ...bluetooth, ...usb, ...ar].forEach(d => {
        this.devices.set(d.id, d);
        this.bus.emit('device:discovered', d.toJSON());
      });
      return this.list();
    }

    startMonitoring() {
      this.bridges.webmedia.startHotplug();
      // 启动健康轮询（每 5 秒）
      this._healthTimer = setInterval(() => this._pollHealth(), 5000);
    }

    stopMonitoring() {
      this.bridges.webmedia.stopHotplug();
      if (this._healthTimer) { clearInterval(this._healthTimer); this._healthTimer = null; }
    }

    _pollHealth() {
      this.devices.forEach(d => {
        if (d.status === 'online') {
          d.updateHealth({ uptimeSec: d.healthMetrics.uptimeSec + 5 });
          this.bus.emit('device:health', { id: d.id, metric: d.healthMetrics });
        }
      });
    }

    list(filter = {}) {
      let arr = Array.from(this.devices.values());
      if (filter.category) arr = arr.filter(d => d.category === filter.category);
      if (filter.status) arr = arr.filter(d => d.status === filter.status);
      if (filter.capability) arr = arr.filter(d => d.hasCapability(filter.capability));
      return arr.map(d => d.toJSON());
    }

    get(id) {
      return this.devices.get(id)?.toJSON();
    }

    setLabel(id, label) {
      this.userProfile.labels[id] = label;
      this._saveProfile();
    }

    setPreferred(role, deviceId) {
      const key = 'preferred' + role.charAt(0).toUpperCase() + role.slice(1) + 'Id';
      this.userProfile[key] = deviceId;
      this._saveProfile();
    }

    async authorizeWebMedia(deviceId, video, audio) {
      const result = await this.bridges.webmedia.authorize(deviceId, video, audio);
      if (result.ok) {
        const dev = Array.from(this.devices.values()).find(d => d.metadata.deviceId === deviceId);
        if (dev) { dev.status = 'online'; this.bus.emit('device:authorized', dev.toJSON()); }
      }
      return result;
    }

    async pairBluetooth() {
      const found = await this.bridges.bluetooth.discover();
      found.forEach(d => {
        this.devices.set(d.id, d);
        this.bus.emit('device:connected', d.toJSON());
      });
      return found.map(d => d.toJSON());
    }

    async scanUSB() {
      const found = await this.bridges.usb.discover();
      found.forEach(d => {
        this.devices.set(d.id, d);
        this.bus.emit('device:connected', d.toJSON());
      });
      return found.map(d => d.toJSON());
    }

    getCategories() { return DEVICE_CATEGORIES; }

    getCapabilities() { return CAPABILITY_REGISTRY; }

    _wireBridgeEvents() {
      Object.values(this.bridges).forEach(b => {
        b.bus.on('device:connected', payload => this.bus.emit('device:connected', payload));
        b.bus.on('device:disconnected', payload => this.bus.emit('device:disconnected', payload));
        b.bus.on('device:error', payload => this.bus.emit('device:error', payload));
        b.bus.on('device:health', payload => this.bus.emit('device:health', payload));
      });
    }

    _loadProfile() {
      try {
        const raw = localStorage.getItem('_device_profile');
        if (raw) this.userProfile = { ...this.userProfile, ...JSON.parse(raw) };
      } catch (e) {}
    }

    _saveProfile() {
      try {
        localStorage.setItem('_device_profile', JSON.stringify(this.userProfile));
      } catch (e) {}
    }
  }

  // ============== 暴露到全局 ==============
  global.DevicePlatform = DevicePlatform;
  global.DeviceCategoryRegistry = DEVICE_CATEGORIES;
  global.DeviceCapabilityRegistry = CAPABILITY_REGISTRY;

  // 自动初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { global.__devicePlatform = new DevicePlatform(); });
  } else {
    global.__devicePlatform = new DevicePlatform();
  }

  console.log('[DevicePlatform] 已加载 · 4 类桥接器（webmedia / bluetooth / usb / ar_glasses）');
})(typeof window !== 'undefined' ? window : globalThis);
