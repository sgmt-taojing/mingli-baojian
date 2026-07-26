/**
 * R62 · 设备 ↔ KB 实时联动桥
 *
 * 核心逻辑：
 *   设备事件（拍照/录音/扫码） → 自动映射到 KB 模块 → recordKbHit 打点
 *   反向：AI 助手查询时，拉最近 5 分钟的设备事件作为上下文加权
 *
 * 零 API 改动，纯前端事件总线 + localStorage
 *
 * 用法：
 *   DeviceKbBridge.attach(platform)        // 挂载到 device-platform 实例
 *   DeviceKbBridge.onCapture('face')       // 手动触发拍照事件
 *   DeviceKbBridge.getRecentContext()       // AI 助手拉取最近设备上下文
 *   DeviceKbBridge.renderBadge(el)          // 设备卡上显示 KB 联动状态
 */
(function (global) {
  'use strict';

  // ── 设备能力 → KB 模块映射 ──────────────────────────────
  const CAPABILITY_TO_KB = {
    'face_capture':      { module: 'zhongyi',   label: '中医面诊', icon: '👁' },
    'tongue_capture':    { module: 'shexiang',  label: '舌象诊断', icon: '👅' },
    'eye_capture':       { module: 'mianxue',   label: '眼诊/面相', icon: '👀' },
    'document_ocr':      { module: 'classics',  label: '经典文献', icon: '📜' },
    'voice_record':      { module: 'mantra',    label: '咒语/诵经', icon: '🎙️' },
    'stt_realtime':      { module: 'mantra',    label: '语音识别', icon: '🗣️' },
    'wake_word':         { module: 'mantra',    label: '唤醒词', icon: '👂' },
    'heart_rate':        { module: 'tcm',       label: '中医脉率', icon: '❤️' },
    'spo2':              { module: 'tcm',       label: '血氧监测', icon: '💧' },
    'sleep_tracker':     { module: 'mobile',    label: '作息养生', icon: '😴' },
    'wearable_view':     { module: 'fengshui',  label: '环境风水', icon: '👓' },
    'battery_report':    { module: null,         label: '电量', icon: '🔋' },
  };

  // ── 事件存储 ──────────────────────────────────────────
  const EVT_KEY = '_device_kb_events';
  const WINDOW_MS = 5 * 60 * 1000; // 5 分钟窗口

  function _readEvents() {
    try {
      return JSON.parse(localStorage.getItem(EVT_KEY) || '[]');
    } catch (e) { return []; }
  }

  function _writeEvents(evts) {
    try {
      // 只保留最近 200 条
      if (evts.length > 200) evts = evts.slice(-200);
      localStorage.setItem(EVT_KEY, JSON.stringify(evts));
    } catch (e) { /* 隐私模式 */ }
  }

  function _pushEvent(evt) {
    const evts = _readEvents();
    evts.push(evt);
    _writeEvents(evts);
  }

  // ── 公共 API ──────────────────────────────────────────

  const DeviceKbBridge = {
    attached: false,

    /**
     * 挂载到 DevicePlatform 实例，自动监听设备事件
     */
    attach: function (platform) {
      if (!platform || !platform.bus || this.attached) return;
      var self = this;

      // 设备发现 → 记录
      platform.bus.on('device:discovered', function (d) {
        _pushEvent({ type: 'discovered', deviceId: d.id, ts: Date.now(),
                      label: d.vendor + ' ' + (d.model || ''), category: d.category });
      });

      // 设备连接 → 记录
      platform.bus.on('device:connected', function (d) {
        _pushEvent({ type: 'connected', deviceId: d.id || d.deviceId, ts: Date.now() });
      });

      // 设备断开 → 记录
      platform.bus.on('device:disconnected', function (d) {
        _pushEvent({ type: 'disconnected', deviceId: d.id || d.deviceId, ts: Date.now() });
      });

      // 设备授权 → 记录
      platform.bus.on('device:authorized', function (d) {
        _pushEvent({ type: 'authorized', deviceId: d.id, ts: Date.now() });
      });

      // 健康指标 → 心率/血氧自动映射
      platform.bus.on('device:health', function (h) {
        if (h.metric && h.metric.heartRate) {
          self.onCapture('heart_rate', { value: h.metric.heartRate });
        }
        if (h.metric && h.metric.spo2) {
          self.onCapture('spo2', { value: h.metric.spo2 });
        }
      });

      this.attached = true;
      console.log('[DeviceKbBridge] 已挂载到 DevicePlatform');
    },

    /**
     * 拍照/采集事件 → 自动映射 KB 模块 + 打点
     * @param {string} capability - face_capture / tongue_capture / eye_capture / voice_record 等
     * @param {object} extra - 附加数据（如 { value: 72 }）
     */
    onCapture: function (capability, extra) {
      extra = extra || {};
      var mapping = CAPABILITY_TO_KB[capability];
      if (!mapping || !mapping.module) return;

      // 1. 记录设备事件
      _pushEvent({
        type: 'capture',
        capability: capability,
        module: mapping.module,
        label: mapping.label,
        icon: mapping.icon,
        ts: Date.now(),
        data: extra
      });

      // 2. 自动 KB 打点（score 0.8 = 高置信度设备采集）
      if (typeof global.recordKbHit === 'function') {
        global.recordKbHit(mapping.module, 0.8, true);
      }

      // 3. 派发全局事件让 UI 组件可以响应
      try {
        global.dispatchEvent(new CustomEvent('device:kb:capture', {
          detail: { capability: capability, module: mapping.module, label: mapping.label, icon: mapping.icon, data: extra }
        }));
      } catch (e) { /* IE 不支持 CustomEvent 构造器 */ }
    },

    /**
     * AI 助手拉取最近 5 分钟的设备上下文
     * 返回 [{ capability, module, label, icon, ts, data }]
     */
    getRecentContext: function (windowMs) {
      windowMs = windowMs || WINDOW_MS;
      var cutoff = Date.now() - windowMs;
      return _readEvents()
        .filter(function (e) { return e.ts >= cutoff && e.type === 'capture'; })
        .map(function (e) {
          return {
            capability: e.capability,
            module: e.module,
            label: e.label,
            icon: e.icon,
            ts: e.ts,
            data: e.data
          };
        });
    },

    /**
     * 获取设备上下文增强的 KB 模块权重
     * 最近 5 分钟内采集过的模块权重 +0.3
     */
    getModuleBoost: function () {
      var recent = this.getRecentContext();
      var boost = {};
      recent.forEach(function (e) {
        if (e.module) {
          boost[e.module] = (boost[e.module] || 0) + 0.3;
        }
      });
      return boost;
    },

    /**
     * 渲染设备卡上的 KB 联动 badge
     * @param {HTMLElement} el - badge 容器
     */
    renderBadge: function (el) {
      if (!el) return;
      var recent = this.getRecentContext();
      if (recent.length === 0) {
        el.innerHTML = '<span class="dev-kb-badge idle">KB 待联动</span>';
        return;
      }
      var modules = {};
      recent.forEach(function (e) {
        if (e.module) {
          if (!modules[e.module]) modules[e.module] = { label: e.label, icon: e.icon, count: 0 };
          modules[e.module].count++;
        }
      });
      var html = Object.values(modules).map(function (m) {
        return '<span class="dev-kb-badge active" title="' + m.label + '">' +
               m.icon + ' ' + m.label + ' ×' + m.count + '</span>';
      }).join(' ');
      el.innerHTML = html;
    },

    /**
     * 获取完整能力 → KB 模块映射表（供 UI 渲染）
     */
    getCapabilityMap: function () {
      return Object.assign({}, CAPABILITY_TO_KB);
    },

    /**
     * 清除所有设备事件（调试用）
     */
    clear: function () {
      try { localStorage.removeItem(EVT_KEY); } catch (e) {}
    }
  };

  // ── 导出 ──────────────────────────────────────────────
  global.DeviceKbBridge = DeviceKbBridge;

  // ── 自动挂载（如果 device-platform 已加载）────────────
  if (global.devicePlatform) {
    DeviceKbBridge.attach(global.devicePlatform);
  }

})(typeof window !== 'undefined' ? window : this);