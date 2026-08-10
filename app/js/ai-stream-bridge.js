/**
 * ═══════════════════════════════════════════════════════════════
 *  命理宝鉴 · AiStreamClient 集成补丁 (R480)
 *  功能: 为 ai-assistant-inline.js 提供 AiStreamClient 适配器
 *  让 inline 版本可选择使用 AiStreamClient（支持 kb_match/tool_call 可视化）
 *  版本: v1.0 (2026-08-09)
 * ═══════════════════════════════════════════════════════════════
 */

(function (global) {
  'use strict';

  // ── 检测是否启用 AiStreamClient ───────────────────
  // 检测方式：url 参数 ?sse=1 或 localStorage 标记
  var USE_SSE = function () {
    try {
      if (location.search.indexOf('sse=1') >= 0) return true;
      if (localStorage.getItem('mbj_sse_enabled') === '1') return true;
    } catch (_) { }
    return false;
  }();

  // ── 桥接器：让 ai-assistant-inline.js 使用 AiStreamClient ──
  global.AiStreamBridge = {
    isEnabled: USE_SSE,

    // 替换原来的 stream-chat 调用
    streamChat: async function (messages, opts = {}) {
      if (!USE_SSE || typeof AiStreamClient === 'undefined') {
        console.warn('[AiStreamBridge] SSE 未启用，请使用 ?sse=1 开启');
        return null;
      }

      return new Promise(function (resolve, reject) {
        var reply = '';
        var kbMatch = null;
        var toolCalls = [];

        AiStreamClient.sendMessage(messages, {
          module: opts.module || 'freechat',
          baziData: opts.baziData || null,
          onDelta: function (text) {
            reply += text;
            // 实时更新（如果页面有 stream 更新钩子）
            if (typeof global._streamCallback === 'function') {
              global._streamCallback(text);
            }
          },
          onKbMatch: function (data) {
            kbMatch = data;
            if (typeof global._kbMatchCallback === 'function') {
              global._kbMatchCallback(data);
            }
          },
          onToolCall: function (tools) {
            toolCalls = tools;
            if (typeof global._toolCallCallback === 'function') {
              global._toolCallCallback(tools);
            }
          },
          onDone: function (meta) {
            resolve({
              content: reply,
              kbMatch: kbMatch,
              toolCalls: toolCalls,
              tier: meta.tier || 'SSE',
              latencyMs: meta.latencyMs,
            });
          },
          onError: function (err) {
            reject(err);
          },
        });
      });
    },

    // 切换 SSE 模式
    toggle: function (enabled) {
      USE_SSE = !!enabled;
      try {
        localStorage.setItem('mbj_sse_enabled', enabled ? '1' : '0');
      } catch (_) { }
      return USE_SSE;
    },
  };

  // ── 导出 ─────────────────────────────────────────
  global.AiStreamBridge.version = '1.0';
})(typeof window !== 'undefined' ? window : globalThis);
