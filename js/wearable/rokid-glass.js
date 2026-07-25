/**
 * rokid-glass.js
 * ====================================================================
 * 命理宝jian · 主控入口（facade）
 *   一次性 import 后挂出 window.RokidGlass = { bridge, camera, audio, voice, motion, storage }
 *   并提供 config.version / config.probe() / config.stop()
 *   其他 js / html 只引用本文件即可。
 * ====================================================================
 */

(function (global) {
  'use strict';
  const target = global.RokidGlass = global.RokidGlass || {
    version: '1.0.0',
    /** 综合探测结果 */
    async probe() {
      const cap = {};
      cap.inRokidGlass = !!(global.RokidBridge && global.RokidBridge.available);
      cap.mic = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      cap.cam = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      cap.audio = !!(global.AudioContext || global.webkitAudioContext);
      cap.tilt  = 'DeviceOrientationEvent' in global;
      cap.mot   = 'DeviceMotionEvent' in global;
      cap.idb   = 'indexedDB' in global;
      cap.cache = 'caches' in global;
      cap.speechSynthesis = 'speechSynthesis' in global;
      cap.webkitSR = 'webkitSpeechRecognition' in global || 'SpeechRecognition' in global;
      cap.geolocation = 'geolocation' in global;
      cap.battery = 'getBattery' in navigator;
      return cap;
    },
  };

  // 已经存在的子模块直接挂上
  global.addEventListener('DOMContentLoaded', () => {
    target.bridge  = global.RokidBridge;
    target.camera  = global.RokidCamera;
    target.audio   = global.RokidAudio;
    target.voice   = global.RokidVoice;
    target.motion  = global.RokidMotion;
    target.storage = global.RokidStorage;
    console.info('[RokidGlass] v' + target.version + ' · ready',
      'bridge=' + !!target.bridge.available,
      'cam=' + !!target.camera,
      'audio=' + !!target.audio,
      'voice=' + !!target.voice,
      'motion=' + !!target.motion);
  });

  // 如果子模块已先加载完成
  if (global.RokidBridge) {
    target.bridge  = global.RokidBridge;
  }
  if (global.RokidCamera) target.camera = global.RokidCamera;
  if (global.RokidAudio)  target.audio  = global.RokidAudio;
  if (global.RokidVoice)  target.voice  = global.RokidVoice;
  if (global.RokidMotion) target.motion = global.RokidMotion;
  if (global.RokidStorage) target.storage = global.RokidStorage;
})(typeof window !== 'undefined' ? window : globalThis);
