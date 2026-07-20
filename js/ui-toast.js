/* ════════════════════════════════════════════════════════════
 * ui-toast.js — 全站统一 toast 提示 + esc HTML 转义
 * 来源：抽离自 38 个页面重复定义的 toast()/escapeHTML()
 * 用法：<script src="js/ui-toast.js"></script>
 *       调用 window.toast('信息') / window.esc('<x>')
 * ════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  // ── toast 提示 ──
  function toast(msg, duration){
    duration = duration || 1500;
    try{
      const t = document.createElement('div');
      t.className = 'toast';
      t.textContent = msg;
      // 兼容旧样式
      t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.85);color:#fff;padding:10px 20px;border-radius:8px;font-size:14px;z-index:99999;pointer-events:none;animation:toast-in .25s ease';
      document.body.appendChild(t);
      setTimeout(()=>{
        t.style.opacity='0';
        t.style.transition='opacity .3s';
        setTimeout(()=>t.remove(), 320);
      }, duration);
    }catch(e){
      console.warn('toast fallback:', msg);
    }
  }
  // ── HTML 转义 ──
  function esc(s){
    if(!s) return '';
    if(typeof s !== 'string') s = String(s);
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  // ── 时间格式化 ──
  function nowStr(){
    const d = new Date();
    const pad = n=>String(n).padStart(2,'0');
    return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+' '+pad(d.getHours())+':'+pad(d.getMinutes())+':'+pad(d.getSeconds());
  }
  // ── 公共 loading 浮层 ──
  let _loadingEl = null;
  function showLoading(text){
    if(_loadingEl) hideLoading();
    _loadingEl = document.createElement('div');
    _loadingEl.id = '__global_loading';
    _loadingEl.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:99998;flex-direction:column;gap:16px';
    _loadingEl.innerHTML = '<div style="width:48px;height:48px;border:4px solid rgba(255,255,255,0.2);border-top-color:#c9a84c;border-radius:50%;animation:spin 1s linear infinite"></div><div style="color:#fff;font-size:14px">'+(text||'加载中...')+'</div>';
    if(!document.getElementById('__spin_key')){
      const s = document.createElement('style');
      s.id='__spin_key';
      s.textContent='@keyframes spin{to{transform:rotate(360deg)}}@keyframes toast-in{from{opacity:0;transform:translate(-50%,20px)}to{opacity:1;transform:translate(-50%,0)}}';
      document.head.appendChild(s);
    }
    document.body.appendChild(_loadingEl);
  }
  function hideLoading(){
    if(_loadingEl){_loadingEl.remove();_loadingEl=null;}
  }
  // ── 导出到全局 ──
  window.toast = toast;
  window.esc = esc;
  window.nowStr = nowStr;
  window.showLoading = showLoading;
  window.hideLoading = hideLoading;
})();