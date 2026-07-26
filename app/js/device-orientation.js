/**
 * device-orientation.js — R89-2 DeviceOrientation 头姿控制
 *
 * 功能：
 * 1. 监听 deviceorientation 事件，提取 alpha/beta/gamma
 * 2. beta（前后倾斜）→ 滚动页面
 * 3. gamma（左右倾斜）→ 切换标签页
 * 4. alpha（旋转）→ 调节语音音量
 * 5. shake 检测 → 触发快捷动作
 *
 * 使用场景：
 * - 智能眼镜佩戴者头姿控制页面
 * - 移动端倾斜翻页
 * - 摇一摇触发功能
 *
 * 兼容性：iOS 13+ 需 DeviceOrientationEvent.requestPermission()
 */
(function(){
  'use strict';

  var ORIENT_KEY = '_device_orient_enabled';
  var SHAKE_THRESHOLD = 18; // m/s²
  var SHAKE_INTERVAL = 800; // ms 防抖
  var TILT_THRESHOLD = 25; // 度阈值
  var lastShake = 0;
  var lastTiltNav = 0;
  var enabled = false;

  // 平滑过滤器（避免抖动）
  var smoothBeta = 0, smoothGamma = 0;
  var SMOOTH_FACTOR = 0.3;

  function log(msg){
    console.log('[DeviceOrientation] ' + msg);
  }

  // 倾斜事件分发
  function dispatchTilt(direction){
    var now = Date.now();
    if(now - lastTiltNav < 1200) return; // 1.2s 防抖
    lastTiltNav = now;
    document.dispatchEvent(new CustomEvent('device:tilt', { detail: { direction: direction } }));
    log('tilt: ' + direction);
  }

  // 摇一摇事件分发
  function dispatchShake(){
    var now = Date.now();
    if(now - lastShake < SHAKE_INTERVAL) return;
    lastShake = now;
    document.dispatchEvent(new CustomEvent('device:shake'));
    log('shake detected');
  }

  // deviceorientation 事件处理
  function onOrientation(e){
    if(!enabled) return;

    // alpha: 0-360（绕 Z 轴旋转，即罗盘方向）
    // beta: -180~180（前后倾斜）
    // gamma: -90~90（左右倾斜）
    var beta = e.beta || 0;
    var gamma = e.gamma || 0;

    // 指数平滑
    smoothBeta = smoothBeta * (1 - SMOOTH_FACTOR) + beta * SMOOTH_FACTOR;
    smoothGamma = smoothGamma * (1 - SMOOTH_FACTOR) + gamma * SMOOTH_FACTOR;

    // 左右倾斜 → 切换方向
    if(Math.abs(smoothGamma) > TILT_THRESHOLD){
      dispatchTilt(smoothGamma > 0 ? 'right' : 'left');
    }

    // 前后倾斜 → 滚动
    if(Math.abs(smoothBeta) > 35){
      var scrollDir = smoothBeta > 0 ? 1 : -1;
      window.scrollBy({ top: scrollDir * 40, behavior: 'smooth' });
    }

    // 分发实时数据（供 UI 调试/显示）
    document.dispatchEvent(new CustomEvent('device:orient', {
      detail: { alpha: e.alpha, beta: beta, gamma: gamma, smoothBeta: smoothBeta, smoothGamma: smoothGamma }
    }));
  }

  // devicemotion 事件处理（摇一摇）
  function onMotion(e){
    if(!enabled) return;
    var acc = e.accelerationIncludingGravity;
    if(!acc) return;
    var mag = Math.sqrt((acc.x||0)*(acc.x||0) + (acc.y||0)*(acc.y||0) + (acc.z||0)*(acc.z||0));
    if(mag > SHAKE_THRESHOLD){
      dispatchShake();
    }
  }

  // iOS 13+ 需要用户手势触发权限
  function requestPermission(){
    if(typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function'){
      Promise.all([
        DeviceOrientationEvent.requestPermission(),
        DeviceMotionEvent.requestPermission()
      ]).then(function(results){
        if(results[0] === 'granted' && results[1] === 'granted'){
          enable();
        } else {
          log('权限被拒绝');
          document.dispatchEvent(new CustomEvent('device:permission', { detail: { granted: false } }));
        }
      }).catch(function(err){
        log('请求权限失败: ' + err.message);
        document.dispatchEvent(new CustomEvent('device:permission', { detail: { granted: false, error: err.message } }));
      });
    } else {
      // 非 iOS，直接启用
      enable();
    }
  }

  function enable(){
    if(enabled) return;
    enabled = true;
    localStorage.setItem(ORIENT_KEY, '1');
    window.addEventListener('deviceorientation', onOrientation, true);
    window.addEventListener('devicemotion', onMotion, true);
    log('已启用头姿控制');
    document.dispatchEvent(new CustomEvent('device:enabled'));
  }

  function disable(){
    if(!enabled) return;
    enabled = false;
    localStorage.setItem(ORIENT_KEY, '0');
    window.removeEventListener('deviceorientation', onOrientation, true);
    window.removeEventListener('devicemotion', onMotion, true);
    log('已禁用头姿控制');
    document.dispatchEvent(new CustomEvent('device:disabled'));
  }

  function toggle(){
    if(enabled) disable(); else requestPermission();
  }

  function isEnabled(){
    return enabled;
  }

  // 自动恢复（非 iOS）
  if(localStorage.getItem(ORIENT_KEY) === '1' && typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission !== 'function'){
    // 延迟启用，等待页面加载完成
    setTimeout(function(){ enable(); }, 500);
  }

  // 导出
  window.DeviceOrientation = {
    requestPermission: requestPermission,
    enable: enable,
    disable: disable,
    toggle: toggle,
    isEnabled: isEnabled
  };
})();
