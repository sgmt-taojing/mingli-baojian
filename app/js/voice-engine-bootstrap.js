/**
 * ═══════════════════════════════════════════════════════════════
 *  命理宝鉴 · VoiceEngine 集成补丁 (R480)
 *  功能: 在 ai-assistant.html 暴露语音按钮 + 路由
 *  集成: voice-engine.js (双模态 ASR/TTS) + voice-interaction.js
 *  版本: v1.0 (2026-08-09)
 * ═══════════════════════════════════════════════════════════════
 */

(function (global) {
  'use strict';

  // ── 语音按钮注入 ────────────────────────────────
  function injectVoiceButton() {
    if (document.getElementById('voice-engine-btn')) return;
    if (typeof VoiceEngine === 'undefined') {
      console.warn('[VoiceEngine 补丁] VoiceEngine 未加载，跳过');
      return;
    }

    // 找到现有麦克风按钮位置
    const micBtn = document.getElementById('mic');
    if (micBtn) {
      // 在现有麦克风按钮旁边添加语音 TTS 按钮（播报 AI 回复）
      const ttsBtn = document.createElement('button');
      ttsBtn.id = 'voice-engine-btn';
      ttsBtn.className = 'voice-tts-btn';
      ttsBtn.innerHTML = '🔊';
      ttsBtn.title = '语音播报';
      ttsBtn.setAttribute('aria-label', '语音播报 AI 回复');
      ttsBtn.style.cssText = 'position:absolute;right:8px;top:60px;width:36px;height:36px;border-radius:50%;background:#c9a84c;color:#fff;border:none;cursor:pointer;font-size:18px;';
      micBtn.parentElement.appendChild(ttsBtn);

      ttsBtn.addEventListener('click', function () {
        if (typeof VoiceEngine.speak === 'function') {
          // 取得最后一条 AI 消息
          const lastAi = document.querySelector('.ai-msg, .assistant, [data-role="assistant"]');
          if (lastAi) {
            const text = lastAi.textContent || lastAi.innerText;
            VoiceEngine.speak(text);
          }
        }
      });
    }

    // 初始化 VoiceEngine 并注册默认指令
    if (typeof VoiceEngine.init === 'function') {
      VoiceEngine.init({ wakeWord: '小鉴', mode: 'auto' });
    }
    if (typeof VoiceEngine.registerDefaultCommands === 'function') {
      VoiceEngine.registerDefaultCommands();
    }

    console.log('[VoiceEngine 集成] 已激活');
  }

  // ── 导出 ─────────────────────────────────────────
  global.VoiceEngineBootstrap = { injectVoiceButton, version: '1.0' };

  // ── 自动初始化 ───────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(injectVoiceButton, 500);
    });
  } else {
    setTimeout(injectVoiceButton, 500);
  }
})(typeof window !== 'undefined' ? window : globalThis);
