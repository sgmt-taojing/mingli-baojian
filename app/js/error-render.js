/**
 * error-render.js — 统一 toast / error / fallback 渲染组件
 *
 * 使用：
 *   <script src="js/error-render.js?v=20260721"></script>
 *   ErrorRender.toast('操作成功');
 *   ErrorRender.showError(element, '出错了', retryFn);
 *
 * 设计目标：替换散落在 15+ 个 HTML 里的 function toast(m) / showToast / showVoiceFallback 重复代码
 *
 * 版本：v1.0.0 - 2026-07-21
 * 兼容：浏览器（Chrome/Safari/Firefox/Edge/iOS Safari 14+）
 */
(function(global){
  'use strict';

  // ═══════════════════════════════════════════════
  // 1. 统一 toast 提示（顶部居中弹窗）
  // ═══════════════════════════════════════════════
  function toast(msg, type){
    type = type || 'info'; // info | success | warn | error
    const t = document.createElement('div');
    t.className = 'er-toast er-toast-' + type;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function(){ t.remove(); }, 1800);
  }

  // ═══════════════════════════════════════════════
  // 2. 块级错误（替换 element 内部，显示重试按钮）
  // ═══════════════════════════════════════════════
  function showError(element, message, retryFn, options){
    options = options || {};
    const showRetry = options.retry !== false && typeof retryFn === 'function';
    const html =
      '<div class="er-error">' +
        '<div class="er-error-icon">⚠️</div>' +
        '<div class="er-error-msg">' + esc(message || '出错了') + '</div>' +
        (showRetry ? '<button class="er-error-retry">🔄 重试</button>' : '') +
      '</div>';
    element.innerHTML = html;
    const btn = element.querySelector('.er-error-retry');
    if(btn && retryFn) btn.onclick = retryFn;
  }

  // ═══════════════════════════════════════════════
  // 3. 行内 loading 占位
  // ═══════════════════════════════════════════════
  function loading(text){
    text = text || '加载中…';
    return '<div class="er-loading"><span class="er-loading-dot"></span><span class="er-loading-dot"></span><span class="er-loading-dot"></span> ' + esc(text) + '</div>';
  }

  // ═══════════════════════════════════════════════
  // 4. 语音降级面板（无 mic 权限 / 浏览器不支持时）
  // ═══════════════════════════════════════════════
  function voiceFallback(onSubmit, placeholder){
    placeholder = placeholder || '请在此输入您的问题...';
    // 已有则切换显隐
    let panel = document.getElementById('erVoiceFallback');
    if(panel){ panel.style.display = panel.style.display === 'none' ? 'block' : 'none'; return; }

    panel = document.createElement('div');
    panel.id = 'erVoiceFallback';
    panel.className = 'er-voice-fallback';
    panel.innerHTML =
      '<div class="er-vf-title">🎤 语音输入（文本模式）</div>' +
      '<textarea id="erVoiceText" placeholder="' + esc(placeholder) + '"></textarea>' +
      '<div class="er-vf-actions">' +
        '<button class="er-vf-cancel">取消</button>' +
        '<button class="er-vf-send">发送</button>' +
      '</div>';
    document.body.appendChild(panel);

    const ta = panel.querySelector('#erVoiceText');
    ta.focus();
    const submit = function(){
      const v = ta.value.trim();
      if(v && typeof onSubmit === 'function') onSubmit(v);
      ta.value = '';
      panel.style.display = 'none';
    };
    panel.querySelector('.er-vf-send').onclick = submit;
    panel.querySelector('.er-vf-cancel').onclick = function(){ panel.style.display = 'none'; };
    ta.addEventListener('keydown', function(e){
      if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); submit(); }
    });
  }

  // ═══════════════════════════════════════════════
  // 5. 内嵌 CSS（自动注入，无需依赖外部）
  // ═══════════════════════════════════════════════
  function injectStyles(){
    if(document.getElementById('errorRenderStyles')) return;
    const s = document.createElement('style');
    s.id = 'errorRenderStyles';
    s.textContent =
      // toast
      '.er-toast{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(26,30,20,.95);color:var(--gold,#c9a84c);padding:10px 18px;border-radius:22px;font-size:13px;border:1px solid var(--border,rgba(201,168,76,.12));z-index:9999;animation:erToastIn .2s ease;box-shadow:0 4px 20px rgba(0,0,0,.5)}' +
      '.er-toast-success{background:rgba(39,174,96,.95);color:#fff}' +
      '.er-toast-warn{background:rgba(241,196,15,.95);color:#222}' +
      '.er-toast-error{background:rgba(231,76,60,.95);color:#fff}' +
      '@keyframes erToastIn{from{opacity:0;transform:translate(-50%,-50%) scale(.9)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}' +
      // 块级 error
      '.er-error{display:flex;flex-direction:column;align-items:center;gap:8px;padding:20px;background:rgba(231,76,60,.05);border:1px dashed rgba(231,76,60,.3);border-radius:10px;color:var(--paper,#ccc);font-size:13px}' +
      '.er-error-icon{font-size:24px}' +
      '.er-error-msg{text-align:center;line-height:1.6}' +
      '.er-error-retry{padding:6px 16px;background:linear-gradient(135deg,#c9a84c,#a08030);color:#000;border:none;border-radius:14px;font-size:12px;cursor:pointer;font-family:inherit}' +
      // loading
      '.er-loading{display:flex;align-items:center;gap:4px;padding:8px 12px;color:var(--paper3,#888);font-size:12px}' +
      '.er-loading-dot{width:5px;height:5px;background:var(--gold,#c9a84c);border-radius:50%;animation:erLoadDot 1.2s infinite}' +
      '.er-loading-dot:nth-child(2){animation-delay:.2s}' +
      '.er-loading-dot:nth-child(3){animation-delay:.4s}' +
      '@keyframes erLoadDot{0%,60%,100%{opacity:.3;transform:translateY(0)}30%{opacity:1;transform:translateY(-3px)}}' +
      // voice fallback
      '.er-voice-fallback{position:fixed;bottom:70px;left:50%;transform:translateX(-50%);width:90%;max-width:500px;background:var(--ink2,#111);border:1px solid rgba(201,168,76,.3);border-radius:12px;padding:16px;z-index:300;box-shadow:0 -4px 30px rgba(0,0,0,.5)}' +
      '.er-vf-title{color:var(--gold,#c9a84c);font-size:14px;margin-bottom:10px;text-align:center;letter-spacing:2px}' +
      '.er-voice-fallback textarea{width:100%;min-height:80px;background:rgba(255,255,255,.04);border:1px solid rgba(201,168,76,.15);border-radius:8px;padding:10px;color:var(--paper,#f0e8d8);font-size:14px;font-family:inherit;resize:none;line-height:1.8}' +
      '.er-vf-actions{display:flex;gap:8px;margin-top:10px;justify-content:flex-end}' +
      '.er-vf-cancel,.er-vf-send{padding:6px 16px;font-size:12px;border-radius:6px;cursor:pointer;font-family:inherit}' +
      '.er-vf-cancel{border:1px solid rgba(201,168,76,.2);background:transparent;color:var(--paper3,#a09080)}' +
      '.er-vf-send{border:none;background:linear-gradient(135deg,#c9a84c,#a08030);color:#080808}';
    document.head.appendChild(s);
  }

  // ═══════════════════════════════════════════════
  // utils
  // ═══════════════════════════════════════════════
  function esc(s){
    if(s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // 注入样式
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', injectStyles);
  } else {
    injectStyles();
  }

  // 全局暴露
  global.ErrorRender = {
    version: '1.0.0',
    toast: toast,
    showError: showError,
    loading: loading,
    voiceFallback: voiceFallback,
    esc: esc
  };

  // 兼容旧函数名（让 15+ 个 HTML 现有 toast() 调用不破）
  global.showToast = toast;

})(typeof window !== 'undefined' ? window : this);
