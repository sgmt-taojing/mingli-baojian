/**
 * ═══════════════════════════════════════════════════════════════
 *  命理宝鉴 · AI 流式聊天客户端（SSE Consumer）
 *  版本: v1.0 (2026-08-08 R477)
 *  特性:
 *    1. Server-Sent Events 流式接收
 *    2. 自动回退 fetch POST（降级兼容）
 *    3. KB 命中指示器
 *    4. 工具调用可视化
 *    5. Markdown 实时渲染
 * ═══════════════════════════════════════════════════════════════
 */

(function (global) {
  'use strict';
  
  const API_BASE = (location.hostname === '127.0.0.1' || location.hostname === 'localhost')
    ? 'http://127.0.0.1:8920' : '';
  
  // ── 状态 ─────────────────────────────────────
  let stream = null;
  let isStreaming = false;
  let abortController = null;
  
  // ── 回调 ─────────────────────────────────────
  const callbacks = {
    onStart: null,
    onDelta: null,     // (text) => void
    onKbMatch: null,   // (info) => void
    onToolCall: null,  // (tools) => void
    onToolResult: null,// (result) => void
    onDone: null,      // (meta) => void
    onError: null,     // (err) => void
  };
  
  /**
   * 发送消息（流式）
   */
  async function sendMessage(messages, opts = {}) {
    if (isStreaming) {
      console.warn('[AI Stream] 已有流式请求进行中');
      return;
    }
    
    isStreaming = true;
    abortController = new AbortController();
    
    const module = opts.module || 'freechat';
    const startTime = Date.now();
    let buffer = '';
    
    try {
      // ── 方案 A：fetch + ReadableStream（SSE 兼容） ──
      const res = await fetch(`${API_BASE}/api/ai/stream-chat`, { signal: AbortSignal.timeout(15000),
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({ messages, module, ...opts }),
        signal: abortController.signal,
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let currentEvent = 'message';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buf += decoder.decode(value, { stream: true });
        
        // 解析 SSE 帧
        const lines = buf.split('\n');
        buf = lines.pop() || '';  // 不完整的行
        
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            try {
              const data = JSON.parse(dataStr);
              handleEvent(currentEvent, data, callbacks, buffer, (text) => {
                buffer += text;
              });
            } catch (_) {
              // 忽略 JSON 解析失败
            }
            currentEvent = 'message';
          }
        }
      }
      
    } catch (e) {
      if (e.name === 'AbortError') {
        callbacks.onError && callbacks.onError({ message: '已取消', aborted: true });
      } else {
        // ── 方案 B：回退到传统 fetch POST ──
        console.warn('[AI Stream] SSE 降级到 POST:', e.message);
        try {
          const res2 = await fetch(`${API_BASE}/api/ai/public-chat`, { signal: AbortSignal.timeout(15000),
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages, module }),
            signal: abortController.signal,
          });
          const data = await res2.json();
          const text = data.content || data.message || data.answer || '';
          if (text) {
            callbacks.onDelta && callbacks.onDelta(text);
            callbacks.onDone && callbacks.onDone({
              tier: 'POST_FALLBACK',
              latencyMs: Date.now() - startTime,
              tokens: 0,
            });
          }
        } catch (e2) {
          callbacks.onError && callbacks.onError({ message: e2.message });
        }
      }
    } finally {
      isStreaming = false;
      abortController = null;
    }
  }
  
  function handleEvent(event, data, cbs, currentBuffer, appendFn) {
    switch (event) {
      case 'start':
        cbs.onStart && cbs.onStart(data);
        break;
      case 'delta':
        cbs.onDelta && cbs.onDelta(data.content || '');
        appendFn(data.content || '');
        break;
      case 'kb_match':
        cbs.onKbMatch && cbs.onKbMatch(data);
        break;
      case 'tool_calls':
        cbs.onToolCall && cbs.onToolCall(data.tools || []);
        break;
      case 'tool_result':
        cbs.onToolResult && cbs.onToolResult(data);
        break;
      case 'done':
        cbs.onDone && cbs.onDone(data);
        break;
      case 'error':
        cbs.onError && cbs.onError(data);
        break;
    }
  }
  
  /**
   * 取消当前流
   */
  function cancel() {
    if (abortController) {
      abortController.abort();
    }
    isStreaming = false;
  }
  
  /**
   * 检查流式服务是否可用
   */
  async function checkHealth() {
    try {
      const res = await fetch(`${API_BASE}/api/ai/stream-health`, {signal: AbortSignal.timeout(2000)});
      return await res.json();
    } catch (_) {
      return { ok: false };
    }
  }
  
  /**
   * 注册回调
   */
  function on(event, fn) {
    if (event in callbacks) {
      callbacks[event] = fn;
    }
  }
  
  // ── 导出 ─────────────────────────────────────
  global.AiStreamClient = {
    sendMessage,
    cancel,
    checkHealth,
    on,
    get isStreaming() { return isStreaming; },
  };
  
})(typeof window !== 'undefined' ? window : globalThis);
