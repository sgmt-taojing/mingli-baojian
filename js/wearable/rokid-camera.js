/**
 * rokid-camera.js
 * ====================================================================
 * 命理宝jian · 5 路分布式摄像头选择策略
 * --------------------------------------------------------------------
 * 先知智镜路总规划中提到 5 路摄像头：
 *    [1] 中间舌诊微距   4800 万像素  ← 诊舌头
 *    [2] 左面部广角     3200 万像素
 *    [3] 右面部广角     3200 万像素
 *    [4] 左目诊显微     1600 万像素
 *    [5] 右目诊显微     1600 万像素
 *    [6] 手部抓拍       2000 万像素  ← 实际是 6 路，本策略均能枚举
 *
 * 浏览器层（WebRTC getUserMedia + enumerateDevices）：
 *   - 同一时刻只能同时打开 1~2 路（多数 WebView 限制同时 1 路 视频流）。
 *   - 想准确切到"哪一路"必须借助原生 bridge，让 Rokid 端把选定 sensor
 *     注入为虚拟 videoinput。
 *   - 在 PC 浏览器 fallback 时，只能拿到笔记本自带 1 路摄像头，
 *     把这一路当作"通用眼部/舌部"采集。
 *
 * 假设 [HYP-CAM-1]：
 *   enumerateDevices 返回的 label 通常包含 "Rokid-CAM-TONGUE-48MP" /
 *   "Rokid-CAM-FACE-L-32MP" / "Rokid-CAM-EYE-L-16MP" 等可解析字串。
 *   若 label 为空（隐私），则需先 getUserMedia 一次再 enumerate。
 * ====================================================================
 *
 * 用法：
 *   const stream = await RokidCamera.open('tongue');
 *
 * 暴露：
 *   window.RokidCamera.open(role)
 *   window.RokidCamera.list()
 *   window.RokidCamera.capture(role)         // 拍 1 张 -> Blob
 *   window.RokidCamera.onFrame(role, cb)     // 持续帧回调
 * ====================================================================
 */

(function (global) {
  'use strict';

  // 角色 -> 选择策略关键词
  const ROLE_RULES = {
    tongue: { keys: ['tongue', '舌', 'tougue'], label: '舌诊微距 (48MP)' },
    faceL:  { keys: ['face', 'left', '脸左', 'L'], label: '左面部广角' },
    faceR:  { keys: ['face', 'right', '脸右', 'R'], label: '右面部广角' },
    eyeL:   { keys: ['eye', 'left', '目左'], label: '左目诊显微' },
    eyeR:   { keys: ['eye', 'right', '目右'], label: '右目诊显微' },
    hand:   { keys: ['hand', 'palm', '手'], label: '手部抓拍' },
  };

  // 评分：哪个 device 命中给定 role
  function scoreRole(label, role) {
    if (!label) return 0;
    const lower = label.toLowerCase();
    const rule = ROLE_RULES[role];
    if (!rule) return 0;
    let s = 0;
    for (const k of rule.keys) {
      if (lower.indexOf(k.toLowerCase()) !== -1) s += 1;
    }
    // 与 role 无关的负向信号（防止其他标签干扰）
    if (role === 'tongue' && /hand|eye|face/.test(lower)) s -= 0.5;
    if (role === 'eyeL' && /right/.test(lower)) s -= 0.5;
    if (role === 'eyeR' && /left/.test(lower)) s -= 0.5;
    if (role === 'faceL' && /right/.test(lower)) s -= 0.5;
    if (role === 'faceR' && /left/.test(lower)) s -= 0.5;
    return s;
  }

  function isRokidLabel(label) {
    if (!label) return false;
    return /rokid|rbg|glass|wearable|先知/i.test(label);
  }

  // ---------------------------------------------------------------
  // enumerate 摄像头
  // ---------------------------------------------------------------
  async function list() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return [];
    }
    const devs = await navigator.mediaDevices.enumerateDevices();
    return devs
      .filter((d) => d.kind === 'videoinput')
      .map((d, i) => ({
        deviceId: d.deviceId,
        label: d.label || `未知摄像头 #${i}`,
        groupId: d.groupId,
        isRokid: isRokidLabel(d.label),
      }));
  }

  // ---------------------------------------------------------------
  // 选择 deviceId（先用原生 bridge 切到特定 sensor，再用 web 枚举）
  // ---------------------------------------------------------------
  async function pickDeviceId(role) {
    // 1) 让原生端把目标 sensor 暴露成 videoinput
    if (global.RokidBridge && global.RokidBridge.available) {
      try {
        await global.RokidBridge.call(global.RokidEvent.CAMERA_OPEN, {
          sensor: role,           // 'tongue' / 'faceL' / 'eyeL' ...
          expose: 'videoinput',   // 暴露成 mediaDevices 一员
        });
      } catch (e) {
        console.warn('[RokidCamera] bridge 切 sensor 失败，继续 web 枚举：', e.message);
      }
    }

    const cams = await list();
    if (cams.length === 0) return null;

    // 2) 找最佳匹配
    let best = null;
    let bestScore = -Infinity;
    for (const c of cams) {
      const s = scoreRole(c.label, role);
      // Rokid 标签额外加权
      const adj = s + (c.isRokid ? 0.5 : 0);
      if (adj > bestScore) { bestScore = adj; best = c; }
    }

    // 3) 完全没匹配时，挑第一个 Rokid 标签的设备
    if (!best || bestScore <= 0) {
      best = cams.find((c) => c.isRokid) || cams[0];
    }
    return best ? best.deviceId : null;
  }

  // ---------------------------------------------------------------
  // open(role) -> MediaStream
  // ---------------------------------------------------------------
  async function open(role = 'tongue', constraints) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('当前浏览器不支持 getUserMedia，无法开启摄像头');
    }
    // 在 iOS / 某些 WebView 下，enumerateDevices 在用户授权前 label 全空，
    // 因此先尝试用 default device 拿一次权限，再次枚举才能看到完整 label。
    try {
      const tmp = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      tmp.getTracks().forEach((t) => t.stop());
    } catch (_) {
      // 用户拒绝时会抛错，仍继续尝试 open，让上层提示
    }

    const deviceId = await pickDeviceId(role);
    const con = constraints || {
      audio: false,
      video: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        width:  { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30 },
      },
    };
    return navigator.mediaDevices.getUserMedia(con);
  }

  // ---------------------------------------------------------------
  // capture(role) -> Blob (1 张)
  // ---------------------------------------------------------------
  async function capture(role = 'tongue') {
    const stream = await open(role);
    const track = stream.getVideoTracks()[0];
    if (!track) throw new Error('capture: 没有可用视频轨');
    const supported = typeof track.capabilities === 'object'
      && track.capabilities && 'torch' in track.capabilities;
    // 优先使用 ImageCapture（HTC 眼镜端 / Chrome 86+）
    if (typeof global.ImageCapture !== 'undefined') {
      try {
        const ic = new ImageCapture(track);
        return await ic.takePhoto();
      } catch (_) { /* 走 canvas 兜底 */ }
    }
    // canvas 兜底：截 1 帧
    const video = document.createElement('video');
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;
    await new Promise((res) => (video.onloadedmetadata = res));
    await video.play();
    const cvs = document.createElement('canvas');
    cvs.width = video.videoWidth;
    cvs.height = video.videoHeight;
    cvs.getContext('2d').drawImage(video, 0, 0);
    stream.getTracks().forEach((t) => t.stop());
    return await new Promise((res) => cvs.toBlob(res, 'image/jpeg', 0.92));
  }

  // ---------------------------------------------------------------
  // onFrame(role, cb) -> {stop()}：返回连续帧 Base64 字符串
  // ---------------------------------------------------------------
  function onFrame(role, cb, fps = 10) {
    let stopped = false;
    let stream = null;
    let video = null;
    let timer = null;
    (async () => {
      stream = await open(role);
      video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      await new Promise((res) => (video.onloadedmetadata = res));
      await video.play();
      const cvs = document.createElement('canvas');
      const ctx = cvs.getContext('2d');
      const interval = Math.max(50, Math.floor(1000 / fps));

      const tick = () => {
        if (stopped) return;
        if (video.readyState >= 2) {
          cvs.width = video.videoWidth;
          cvs.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);
          try {
            const dataUrl = cvs.toDataURL('image/jpeg', 0.7);
            cb && cb({ dataUrl, role, ts: Date.now() });
          } catch (e) { /* 跨域 canvas 等 */ }
        }
        timer = setTimeout(tick, interval);
      };
      tick();
    })().catch((e) => console.error('[RokidCamera] onFrame error:', e));

    return {
      stop() {
        stopped = true;
        if (timer) clearTimeout(timer);
        if (stream) stream.getTracks().forEach((t) => t.stop());
      },
    };
  }

  const RokidCamera = {
    ROLE_RULES,
    list,
    open,
    capture,
    onFrame,
    /** 一次性取证多张（同时最多 1~2 路；需要切换 sensor 后轮流拍） */
    async captureMulti(roles = ['tongue', 'faceL', 'faceR', 'eyeL', 'eyeR', 'hand']) {
      const out = {};
      for (const r of roles) {
        try { out[r] = await capture(r); }
        catch (e) { out[r] = { error: e.message }; }
      }
      return out;
    },
  };

  global.RokidCamera = RokidCamera;
  console.info('[RokidCamera] init · roles=', Object.keys(ROLE_RULES).join(','));
})(typeof window !== 'undefined' ? window : globalThis);
