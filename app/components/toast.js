/**
 * <ml-toast> · Web Component v1 (F-9 规范)
 *
 * USAGE EXAMPLE
 * ━━━━━━━━━━━━
 *   // 1) 在 HTML 里声明一次（通常放 body 末尾）：
 *   <ml-toast id="mlToast"></ml-toast>
 *
 *   // 2) 旧代码继续可用（向后兼容）：
 *   <script src="app/components/toast.js"></script>
 *   toast.show('保存成功', 'success');
 *   toast.success('提交成功');
 *   toast.error('网络异常');
 *   shToast('兼容旧名');
 *
 *   // 3) 新代码推荐：
 *   const t = document.getElementById('mlToast');
 *   t.show('保存成功', 'success');
 *   t.success('成功');
 *   t.error('失败');
 *
 * TYPICAL REFERENCE（来自 app/export-guard.html L151）
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *   function toast(msg, type){
 *     const t=document.getElementById('toast');
 *     t.textContent=msg;
 *     t.className='toast show '+(type||'');
 *     setTimeout(()=>t.className='toast',2400)
 *   }
 *
 * ATTRIBUTES
 * ━━━━━━━━━
 *   type     : 'success' | 'error' | 'warn' | 'info'（默认 info）
 *   duration : 毫秒（默认 2400）
 *   position : 'top' | 'bottom' | 'center'（默认 top）
 *
 * CSS VARS（可在 :root 覆盖主题）
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *   --ml-bg, --ml-ink, --ml-success, --ml-error, --ml-warn, --ml-info
 */

(function(){
  if (customElements.get('ml-toast')) return;

  const TEMPLATE = `
    <style>
      :host{
        position:fixed; left:50%; top:24px; transform:translateX(-50%);
        z-index:2147483600; pointer-events:none; display:block;
        --_bg:#333; --_ink:#fff;
      }
      :host([position="bottom"]){ top:auto; bottom:24px; }
      :host([position="center"]){
        top:50%; transform:translate(-50%,-50%);
      }
      .box{
        min-width:160px; max-width:80vw; padding:10px 16px;
        background:var(--ml-bg, var(--_bg));
        color:var(--ml-ink, var(--_ink));
        border-radius:8px; font:14px/1.5 -apple-system,"PingFang SC",sans-serif;
        box-shadow:0 8px 24px rgba(0,0,0,.18);
        opacity:0; transform:translateY(-8px);
        transition:opacity .2s, transform .2s;
        text-align:center;
      }
      :host(.show) .box{ opacity:1; transform:translateY(0); }
      :host([type="success"]) .box{
        background:var(--ml-success,#10b981); color:#fff;
      }
      :host([type="error"]) .box{
        background:var(--ml-error,#ef4444); color:#fff;
      }
      :host([type="warn"]) .box{
        background:var(--ml-warn,#f59e0b); color:#fff;
      }
      :host([type="info"]) .box{
        background:var(--ml-info,#3b82f6); color:#fff;
      }
    </style>
    <div class="box" part="box"><slot></slot></div>
  `;

  class MlToast extends HTMLElement {
    static get observedAttributes(){ return ['type','duration','position']; }
    constructor(){
      super();
      this.attachShadow({mode:'open'});
      this.shadowRoot.innerHTML = TEMPLATE;
      this._slot = this.shadowRoot.querySelector('slot');
      this._timer = null;
    }
    attributeChangedCallback(name, oldV, newV){
      if (name === 'type' && oldV !== newV) {
        // 切类型时不强清，保留兼容
      }
    }
    connectedCallback(){
      this._slot.addEventListener('slotchange', ()=>{});
    }
    _show(msg, type){
      if (type) this.setAttribute('type', type);
      else if (!this.hasAttribute('type')) this.setAttribute('type','info');
      const dur = parseInt(this.getAttribute('duration')||'2400',10);
      // 把消息写入 light DOM slot
      this.textContent = msg;
      this.classList.add('show');
      clearTimeout(this._timer);
      this._timer = setTimeout(()=> this.classList.remove('show'), dur);
      return this;
    }
    show(msg, type){ return this._show(msg, type); }
    success(msg){ return this._show(msg, 'success'); }
    error(msg){ return this._show(msg, 'error'); }
    warn(msg){ return this._show(msg, 'warn'); }
    info(msg){ return this._show(msg, 'info'); }
    hide(){ this.classList.remove('show'); return this; }
  }

  customElements.define('ml-toast', MlToast);

  // ─────────────────────────────────────────────
  // Backward-compat fallback（不改旧代码）
  // ─────────────────────────────────────────────
  function ensureEl(){
    let el = document.querySelector('ml-toast');
    if (!el){
      el = document.createElement('ml-toast');
      document.body.appendChild(el);
    }
    return el;
  }
  function callApi(fn, args){
    const el = ensureEl();
    return el[fn](...args);
  }
  // 老式全局函数：toast(msg, type) / shToast(msg)
  window.toast = {
    show:   (msg, type)=> callApi('show', [msg, type]),
    success:(msg)=> callApi('success', [msg]),
    error:  (msg)=> callApi('error', [msg]),
    warn:   (msg)=> callApi('warn', [msg]),
    info:   (msg)=> callApi('info', [msg]),
    hide:   ()=> callApi('hide', []),
  };
  window.shToast = (msg, type)=> window.toast.show(msg, type||'info');

  // 自动初始化：DOM 准备好就挂一个 ml-toast
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', ensureEl, {once:true});
  } else {
    ensureEl();
  }
})();
