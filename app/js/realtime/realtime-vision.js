/**
 * RealtimeVision v2.0 — 实时视觉引擎（跨项目共享 · 与语音同一零延迟规则）
 * =====================================================================
 * 解决的核心问题：视觉输入（摄像头）与语音执行同一规则——
 * 实时采集 → 实时识别 → 实时 KB 匹配 → 无等待反馈（禁止让用户等待）。
 *
 * 能力清单：
 *  1. getUserMedia 持续取流 → 定时抽帧（默认 800ms，可配置）→ 识别 API → KB 匹配
 *  2. 抽帧循环「防重叠」：上一帧未返回则跳过本帧，绝不并发堆积
 *  3. 服务不可用明确提示（禁止静默失败）：识别服务 3 次连续失败自动暂停并提示
 *  4. 结果去抖：特征指纹一致（前 3 特征）不重复上屏
 *  5. 超时保护：单帧识别 AbortSignal.timeout(5s)
 *  6. 降级路径：摄像头不可用 → 提示并允许上传图片单帧识别
 *  7. 严格容错：所有分支 try/catch，任何异常都有可读输出
 *
 * 后端契约（默认，mingli-baojian face-ocr-server /api/camera/upload）：
 *  POST multipart/form-data { image: <blob>, mode: 'face' }
 *  返回 { kb_matches: [...], kb_features: [...], ... }
 *  （其他项目可配置 endpoint 指向各自的识别服务；响应字段可通过 mapResult 适配）
 *
 * 使用方式：
 *  const vision = new RealtimeVision({
 *    videoEl: document.getElementById('cam'),
 *    endpoint: 'http://127.0.0.1:8913/api/camera/upload',
 *    onResult: r => render(r),     // r = { features, matches, latencyMs, ts }
 *    onStatus: s => updateUI(s)    // scanning / idle / camera_error / service_error / paused
 *  });
 *  vision.start();  vision.stop();  vision.captureOnce();
 */
(function (global) {
  'use strict';

  var MODE_LABEL = { face: '面诊', tongue: '舌诊', eye: '眼诊', hand: '手诊' };

  function RealtimeVision(options) {
    this._opts = Object.assign({
      videoEl: null,               // <video> 元素（必填）
      canvasEl: null,              // <canvas> 抽帧画布（可选，自动创建）
      endpoint: 'http://127.0.0.1:8913/api/camera/upload',
      mode: 'face',                // face / tongue / eye / hand
      intervalMs: 800,             // 抽帧间隔
      frameWidth: 640,             // 抽帧宽度（降采样）
      timeoutMs: 5000,
      maxConsecutiveErrors: 3,     // 连续失败自动暂停
      onResult: null, onStatus: null, onError: null,
      mapResult: null,             // (json) => { features, matches } 自定义适配
      fetchImpl: null
    }, options || {});

    this._stream = null;
    this._canvas = null;
    this._timer = null;
    this._running = false;
    this._inFlight = false;        // 防重叠
    this._errors = 0;
    this._lastFingerprint = '';
    this._stats = { total: 0, hits: 0, lastLatency: 0, avgLatency: 0 };
    this._status = 'idle';         // idle | starting | scanning | paused | camera_error | service_error
  }

  /* ================= 对外 API ================= */
  RealtimeVision.prototype.start = function () {
    if (this._running) return;
    var self = this;
    if (!this._opts.videoEl) {
      this._setStatus('camera_error', '未指定 video 元素');
      return;
    }
    this._setStatus('starting', '正在启动摄像头…');
    this._running = true;
    this._errors = 0;

    var constraints = { video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } };
    var getUserMedia = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
    if (!getUserMedia) {
      this._running = false;
      this._setStatus('camera_error', '当前浏览器不支持摄像头（需 HTTPS 或 localhost）');
      this._emitError('camera-unsupported', '当前浏览器不支持摄像头调用，请使用 HTTPS 或 localhost 访问');
      return;
    }
    getUserMedia.call(navigator.mediaDevices, constraints)
      .then(function (stream) {
        if (!self._running) { // 期间被 stop
          try { stream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) { /* ignore */ }
          return;
        }
        self._stream = stream;
        var video = self._opts.videoEl;
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        var playPromise = video.play();
        if (playPromise && playPromise.catch) playPromise.catch(function () { /* 自动播放被拒时用户点击触发 */ });
        self._ensureCanvas();
        self._setStatus('scanning', '实时识别中（每 ' + self._opts.intervalMs + 'ms 一帧）');
        self._loop();
      })
      .catch(function (err) {
        self._running = false;
        var msg = (err && err.name === 'NotAllowedError') ? '摄像头权限被拒绝：请允许本页使用摄像头' :
          ((err && err.name === 'NotFoundError') ? '未检测到摄像头设备' : '摄像头启动失败：' + ((err && err.message) || '未知错误'));
        self._setStatus('camera_error', msg);
        self._emitError('camera-denied', msg);
      });
  };

  RealtimeVision.prototype.stop = function () {
    this._running = false;
    if (this._timer) { clearTimeout(this._timer); this._timer = null; }
    if (this._stream) {
      try { this._stream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) { /* ignore */ }
      this._stream = null;
    }
    var video = this._opts.videoEl;
    if (video && video.srcObject) {
      try { video.srcObject = null; } catch (e) { /* ignore */ }
    }
    this._setStatus('idle', '已停止');
  };

  /** 单帧识别（无摄像头时可用：上传图片） */
  RealtimeVision.prototype.captureOnce = function (imageFileOrDataUrl, mode) {
    var self = this;
    if (mode) this._opts.mode = mode;
    if (imageFileOrDataUrl) {
      this._sendFrameData(imageFileOrDataUrl);
      return;
    }
    // 从视频流截一帧
    if (!this._stream || !this._canvas) {
      this._emitError('no-frame', '当前没有可截取的画面，请先启动摄像头或上传图片');
      return;
    }
    try {
      var ctx = this._canvas.getContext('2d');
      ctx.drawImage(this._opts.videoEl, 0, 0, this._canvas.width, this._canvas.height);
      this._sendFrameData(this._canvas.toDataURL('image/jpeg', 0.8));
    } catch (e) {
      this._emitError('capture-failed', '截帧失败：' + e.message);
    }
  };

  RealtimeVision.prototype.getStats = function () { return Object.assign({}, this._stats); };
  RealtimeVision.prototype.getStatus = function () { return this._status; };

  /* ================= 内部：抽帧循环（防重叠） ================= */
  RealtimeVision.prototype._loop = function () {
    var self = this;
    if (!this._running) return;
    if (!this._inFlight) {
      this._inFlight = true;
      this._snapAndSend()
        .catch(function () { /* 已内部处理 */ })
        .then(function () {
          self._inFlight = false;
          if (self._running) self._timer = setTimeout(function () { self._loop(); }, self._opts.intervalMs);
        });
    } else {
      this._timer = setTimeout(function () { self._loop(); }, 60); // 上一帧未回，稍后再试
    }
  };

  RealtimeVision.prototype._snapAndSend = function () {
    var self = this;
    return new Promise(function (resolve) {
      try {
        var video = self._opts.videoEl;
        if (!video || video.readyState < 2) { resolve(); return; } // 视频未就绪
        var ctx = self._canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, self._canvas.width, self._canvas.height);
        var dataUrl = self._canvas.toDataURL('image/jpeg', 0.75);
        self._sendFrameData(dataUrl).then(resolve, resolve);
      } catch (e) {
        self._emitError('snap-failed', '抽帧失败：' + e.message);
        resolve();
      }
    });
  };

  RealtimeVision.prototype._sendFrameData = function (dataUrlOrFile) {
    var self = this;
    return new Promise(function (resolve) {
      var t0 = Date.now();
      var fd = new FormData();
      if (typeof dataUrlOrFile === 'string') {
        // dataURL → Blob
        try {
          var parts = dataUrlOrFile.split(',');
          var mime = (parts[0].match(/data:(.*?);/) || [])[1] || 'image/jpeg';
          var bin = atob(parts[1]);
          var arr = new Uint8Array(bin.length);
          for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
          fd.append('image', new Blob([arr], { type: mime }), 'frame_' + Date.now() + '.jpg');
        } catch (e) {
          self._countError('frame-encode', '图像编码失败：' + e.message);
          resolve(); return;
        }
      } else {
        fd.append('image', dataUrlOrFile, 'upload_' + Date.now() + '.jpg');
      }
      fd.append('mode', self._opts.mode);

      var fetchImpl = self._opts.fetchImpl || (typeof global.fetch === 'function' ? global.fetch : null);
      if (!fetchImpl) {
        self._countError('no-fetch', '当前环境不支持 fetch，无法调用识别服务');
        resolve(); return;
      }

      var timeoutSignal = typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(self._opts.timeoutMs) : undefined;
      fetchImpl(self._opts.endpoint, { method: 'POST', body: fd, signal: timeoutSignal })
        .then(function (res) {
          if (!res.ok) throw new Error('识别服务 HTTP ' + res.status);
          return res.json();
        })
        .then(function (json) {
          var latency = Date.now() - t0;
          var mapped = self._map(json);
          self._stats.total++;
          self._stats.lastLatency = latency;
          self._stats.avgLatency = self._stats.avgLatency === 0 ? latency : Math.round((self._stats.avgLatency * (self._stats.total - 1) + latency) / self._stats.total);
          if (mapped.matches && mapped.matches.length) self._stats.hits++;
          self._errors = 0; // 成功后重置错误计数

          // 结果去抖：特征指纹一致不重复上屏
          var fp = (mapped.features || []).slice(0, 3).join('|');
          if (fp && fp === self._lastFingerprint) { resolve(); return; }
          if (fp) self._lastFingerprint = fp;

          var result = { features: mapped.features || [], matches: mapped.matches || [], latencyMs: latency, ts: Date.now(), mode: self._opts.mode };
          if (typeof self._opts.onResult === 'function') { try { self._opts.onResult(result); } catch (e) { /* ignore */ } }
          self._setStatus('scanning', '实时识别中 · 上次 ' + latency + 'ms · 命中 ' + (mapped.matches || []).length + ' 条知识');
          resolve();
        })
        .catch(function (err) {
          var latency = Date.now() - t0;
          if (err && err.name === 'AbortError') {
            self._countError('vision-timeout', '识别超时（>' + self._opts.timeoutMs + 'ms），已跳过本帧');
          } else {
            self._countError('vision-service', '识别服务不可用：' + ((err && err.message) || '网络错误') + '（服务地址 ' + self._opts.endpoint + '）');
          }
          resolve();
        });
    });
  };

  /* ================= 响应适配 ================= */
  RealtimeVision.prototype._map = function (json) {
    // 自定义适配优先
    if (typeof this._opts.mapResult === 'function') {
      try {
        var m = this._opts.mapResult(json);
        if (m) return m;
      } catch (e) { /* 适配失败走默认 */ }
    }
    try {
      var matches = Array.isArray(json.kb_matches) ? json.kb_matches : (Array.isArray(json.matches) ? json.matches : []);
      var features = Array.isArray(json.kb_features) ? json.kb_features : (Array.isArray(json.features) ? json.features : []);
      return { features: features, matches: matches };
    } catch (e) {
      return { features: [], matches: [] };
    }
  };

  /* ================= 错误计数与暂停 ================= */
  RealtimeVision.prototype._countError = function (code, msg) {
    this._errors++;
    if (this._errors >= this._opts.maxConsecutiveErrors) {
      this._running = false;
      if (this._timer) { clearTimeout(this._timer); this._timer = null; }
      this._setStatus('paused', '识别服务连续失败 ' + this._errors + ' 次，已自动暂停（点击「恢复」重试）');
      this._emitError(code, msg + '（已自动暂停）');
      return;
    }
    this._setStatus('service_error', msg + '（' + this._errors + '/' + this._opts.maxConsecutiveErrors + '）');
    this._emitError(code, msg);
  };

  RealtimeVision.prototype._emitError = function (code, msg) {
    if (typeof this._opts.onError === 'function') {
      try { this._opts.onError({ code: code, message: msg }); } catch (e) { /* ignore */ }
    }
  };

  RealtimeVision.prototype._setStatus = function (status, detail) {
    this._status = status;
    if (typeof this._opts.onStatus === 'function') {
      try { this._opts.onStatus({ status: status, detail: detail, ts: Date.now() }); } catch (e) { /* ignore */ }
    }
  };

  RealtimeVision.prototype._ensureCanvas = function () {
    if (this._canvas) return;
    if (this._opts.canvasEl) {
      this._canvas = this._opts.canvasEl;
    } else {
      this._canvas = document.createElement('canvas');
      this._canvas.style.display = 'none';
      document.body.appendChild(this._canvas);
    }
    var w = this._opts.frameWidth;
    this._canvas.width = w;
    this._canvas.height = Math.round(w * 9 / 16); // 16:9
  };

  RealtimeVision.prototype.destroy = function () {
    this.stop();
  };

  /* ================= 事件总线（与 RealtimeVoice/RealtimeKB 同款，供 engine 编排） ================= */
  RealtimeVision.prototype.on = function (evt, fn) {
    if (!this._listeners) this._listeners = {};
    if (!this._listeners[evt]) this._listeners[evt] = [];
    this._listeners[evt].push(fn);
    return this;
  };
  RealtimeVision.prototype.emit = function (evt) {
    if (!this._listeners) return;
    var args = Array.prototype.slice.call(arguments, 1);
    var fns = this._listeners[evt] || [];
    for (var i = 0; i < fns.length; i++) {
      try { fns[i].apply(null, args); } catch (e) { /* ignore */ }
    }
  };

  global.RealtimeVision = RealtimeVision;
  global.RT_VISION_MODE_LABEL = MODE_LABEL;
})(typeof window !== 'undefined' ? window : this);
