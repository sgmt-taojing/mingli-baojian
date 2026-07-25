/**
 * rokid-motion.js
 * ====================================================================
 * 命理宝jian · 姿态、陀螺仪、九轴传感器
 * --------------------------------------------------------------------
 * W3C DeviceOrientation / DeviceMotion API 在普通 WebView 中已经能
 * 直接使用（iOS 13+ 需要用户手势内调 requestPermission()）。
 *
 * 眼镜 vs 手机不同点：
 *   - 头动 → 颈椎姿态 → 推断「仰头/低头/侧偏」（用于"点头确认"。
 *     这里约定：派头 Y 轴转 > 25° 视为一次「点头确认」事件）。
 *   - 九轴 IMU 通常由原生驱动采集，陀螺仪短时抖动更稳，但 W3C API
 *     已经能用 99% 场景，仅做小校准即可。
 *
 * 用法：
 *   const off = RokidMotion.on({
 *     onTilt(p),   // 持续姿态 {pitch,yaw,roll,ts}
 *     onNod(),     // 点头（确认）
 *     onShake(),   // 摇头（取消）
 *     onStep(),    // 步态计数（粗）
 *     onTap(),     // 双击镜腿（原生桥事件转 web）
 *   });
 *   off();  // 取消订阅
 *
 * 假设 [HYP-MOT-1]：
 *   原生 bridge 会在触发「双击镜腿/单击镜腿」后，dispatch
 *   window.dispatchEvent(new CustomEvent('rokid:tap', {detail:{count:1|2}}))
 *   与 window.dispatchEvent(new CustomEvent('rokid:longpress', ...))
 * ====================================================================
 */

(function (global) {
  'use strict';

  // 阈值（度 / m/s2）
  const TH = {
    NOD_DELTA: 18,       // pitch 向下大于这个值才算低头
    NOD_RECOVER: 8,      // pitch 回到这个范围内算结束
    NOD_TIMEOUT: 1500,   // ms 之内未复原则放弃本次
    SHAKE_G: 2.4,        // 比这强的加速度视为摇一摇
    STEP_PEAK: 1.3,      // 步态峰值阈值
    STEP_INTERVAL: 350,  // ms 最小步频
  };

  function rad2deg(r) { return r * 180 / Math.PI; }

  // 工具：节流
  function throttle(fn, ms) {
    let last = 0, timer = null;
    return function (...args) {
      const now = Date.now();
      const delta = now - last;
      if (delta >= ms) { last = now; fn.apply(this, args); }
      else {
        clearTimeout(timer);
        timer = setTimeout(() => { last = Date.now(); fn.apply(this, args); }, ms - delta);
      }
    };
  }

  // ---------------------------------------------------------------
  // 1. 持续姿态（Tilt）：以 beta/pitch、gamma/yaw 替代 alpha/roll
  // ---------------------------------------------------------------
  function onTilt(cb) {
    if (!('DeviceOrientationEvent' in global)) {
      console.warn('[RokidMotion] 设备不支持 DeviceOrientationEvent');
      return () => {};
    }
    const handler = (ev) => {
      // beta: x轴（pitch 仰头/低头）  gamma: y轴（yaw 左右）
      // alpha: z轴（roll 侧倾）
      const p = {
        pitch: typeof ev.beta  === 'number' ? rad2deg(ev.beta)  : null,
        yaw:   typeof ev.gamma === 'number' ? rad2deg(ev.gamma) : null,
        roll:  typeof ev.alpha === 'number' ? rad2deg(ev.alpha) : null,
        ts: Date.now(),
      };
      cb && cb(p);
      detectNodShake(p);
    };
    global.addEventListener('deviceorientation', handler);
    return () => global.removeEventListener('deviceorientation', handler);
  }

  // ---------------------------------------------------------------
  // 2. 点头 / 摇头 / 步态 检测（基于 DeviceMotion + Orientation）
  // ---------------------------------------------------------------
  let nodState = { phase: 'idle', lastDownTs: 0 };   // idle→down→up
  let step = { lastStepTs: 0, count: 0 };
  const listeners = { nod: [], shake: [], step: [], tap: [] };

  function emit(type, ev) { (listeners[type] || []).forEach((cb) => { try { cb(ev); } catch (_) {} }); }

  function detectNodShake(p) {
    if (p.pitch == null) return;
    if (nodState.phase === 'idle') {
      if (p.pitch > TH.NOD_DELTA) { nodState.phase = 'down'; nodState.lastDownTs = Date.now(); }
    } else if (nodState.phase === 'down') {
      if (p.pitch < TH.NOD_RECOVER) {
        // 回到正位 → 视为一次点头
        nodState.phase = 'up';
        emit('nod', { ts: Date.now() });
        // 立刻回归 idle（防止误触）
        setTimeout(() => (nodState.phase = 'idle'), 200);
      } else if (Date.now() - nodState.lastDownTs > TH.NOD_TIMEOUT) {
        nodState.phase = 'idle';
      }
    }
  }

  function onMotion(cb) {
    if (!('DeviceMotionEvent' in global)) {
      console.warn('[RokidMotion] 设备不支持 DeviceMotionEvent');
      return () => {};
    }
    const handler = (ev) => {
      const acc = ev.accelerationIncludingGravity || ev.acceleration;
      if (!acc) return;
      const x = acc.x || 0, y = acc.y || 0, z = acc.z || 0;
      const g = Math.sqrt(x * x + y * y + z * z);   // 单位：g
      cb && cb({ x, y, z, g, ts: Date.now() });
      // 摇一摇
      if (g > TH.SHAKE_G) emit('shake', { g, ts: Date.now() });
      // 步态
      const now = Date.now();
      if (g > TH.STEP_PEAK && (now - step.lastStepTs) > TH.STEP_INTERVAL) {
        step.lastStepTs = now; step.count += 1; emit('step', { count: step.count, ts: now });
      }
    };
    global.addEventListener('devicemotion', handler);
    return () => global.removeEventListener('devicemotion', handler);
  }

  // ---------------------------------------------------------------
  // 3. 镜腿点击（来自原生 Rokid 硬件事件 → 通过 bridge 的 CustomEvent）
  // ---------------------------------------------------------------
  function onTap(cb) {
    if (!cb) return () => {};
    const h = (ev) => cb(ev.detail || {});
    global.addEventListener('rokid:tap', h);
    return () => global.removeEventListener('rokid:tap', h);
  }
  function onLongPress(cb) {
    if (!cb) return () => {};
    const h = (ev) => cb(ev.detail || {});
    global.addEventListener('rokid:longpress', h);
    return () => global.removeEventListener('rokid:longpress', h);
  }

  // ---------------------------------------------------------------
  // 4. 综合 once(on/off)
  // ---------------------------------------------------------------
  function on(handlers = {}) {
    const offTilt = handlers.onTilt   ? onTilt(handlers.onTilt) : () => {};
    const offMot  = handlers.onMotion || handlers.onShake || handlers.onStep
                      ? onMotion((m) => { handlers.onMotion && handlers.onMotion(m); }) : () => {};
    const offTap  = handlers.onTap    ? onTap(handlers.onTap)   : () => {};
    const offLp   = handlers.onLongPress ? onLongPress(handlers.onLongPress) : () => {};
    if (handlers.onNod)   listeners.nod.push(handlers.onNod);
    if (handlers.onShake) listeners.shake.push(handlers.onShake);
    if (handlers.onStep)  listeners.step.push(handlers.onStep);
    return function off() {
      offTilt(); offMot(); offTap(); offLp();
      // 不清 listeners，单次解除即可（下一轮 on 会重新 push）
    };
  }

  // ---------------------------------------------------------------
  // 5. iOS 13+ 权限请求（无障碍设置）
  // ---------------------------------------------------------------
  async function requestPermission() {
    if (typeof DeviceOrientationEvent !== 'undefined'
        && typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const r = await DeviceOrientationEvent.requestPermission();
        return r === 'granted';
      } catch (_) { return false; }
    }
    return true;
  }

  const RokidMotion = {
    on,
    onTilt,
    onMotion,
    onTap,
    onLongPress,
    requestPermission,
    // 测试用
    _TH: TH,
  };

  global.RokidMotion = RokidMotion;
  console.info('[RokidMotion] init · DeviceOrientation / DeviceMotion / 点头/摇头/步态/镜腿点击');
})(typeof window !== 'undefined' ? window : globalThis);
