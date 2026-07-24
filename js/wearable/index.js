/**
 * 可穿戴设备统一接入层（项目门面）
 *  - 智能眼镜：Rokid / 雷鸟 / INMO（多品牌）
 *  - 自动探测 + 优雅降级（PC 浏览器 fallback）
 *  - 暴露: capture() / once() / say() / onMotion() / pickModule()
 */
import { bridge } from './rokid-bridge.js';
import { camera } from './rokid-camera.js';
import { audio } from './rokid-audio.js';
import { voice } from './rokid-voice.js';
import { motion } from './rokid-motion.js';
import { storage } from './rokid-storage.js';
import { deviceProvider } from './device-provider.js';

export const wearable = {
  brand: deviceProvider.detect(),
  isGlass: deviceProvider.isGlass(),
  capabilities: deviceProvider.capabilities,
  bridge, camera, audio, voice, motion, storage,
  /** 一句话主入口：用户开口说，所有内部联动 */
  async once(onText) {
    if (voice?.once) return voice.once(onText);
    return new Promise((resolve) => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) return resolve(null);
      const r = new SR(); r.lang='zh-CN'; r.onresult = e => {
        const t = e.results[0][0].transcript;
        onText?.(t); resolve(t);
      };
      r.start();
    });
  },
  /** 念一句话（TTS，骨传导优先） */
  async say(text) { return audio?.speak?.(text) ?? void 0; },
  /** 触发抓拍/OCR 链路 */
  async capture() { return camera?.capture?.(); },
  /** 订阅姿态事件 */
  onMotion(cb) { motion?.on?.(cb); }
};
export default wearable;
window.wearable = wearable;  // 全局兜底
