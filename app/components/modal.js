/**
 * <ml-modal> · Web Component v1 (F-9 规范)
 *
 * USAGE EXAMPLE
 * ━━━━━━━━━━━━
 *   <!-- 推荐用法 -->
 *   <ml-modal id="myModal" title="向大师提问" open="false">
 *     <p>这里是弹窗内容，可以放表单/按钮/图片。</p>
 *     <button onclick="document.getElementById('myModal').close()">关闭</button>
 *   </ml-modal>
 *
 *   <button onclick="document.getElementById('myModal').open()">打开弹窗</button>
 *
 *   <!-- JS API -->
 *   const m = document.getElementById('myModal');
 *   m.open();
 *   m.close();
 *   m.addEventListener('close', e => console.log('closed', e.detail));
 *
 *   <!-- 旧代码兼容（不改源码） -->
 *   <script src="app/components/modal.js"></script>
 *   openKbDetail();   // 老函数 → 找 .modal[id] 显示
 *   closeAskModal();  // 老函数 → 找 .modal[id] 隐藏
 *
 * TYPICAL REFERENCE（来自 app/divination-hub.html L1931）
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *   <div id="kbDetailModal" style="display:none;position:fixed;...;background:rgba(0,0,0,0.7)">
 *     <div style="background:var(--bg-dark);...;padding:24px">
 *       <button onclick="closeKbDetail()">✕</button>
 *       <div id="kbDetailContent"></div>
 *     </div>
 *   </div>
 *
 * ATTRIBUTES
 * ━━━━━━━━━
 *   title : 标题（可选）
 *   open  : 'true' | 'false'（受控）
 *   size  : 'sm' | 'md' | 'lg'（默认 md；最大宽 420/640/840）
 *   close-on-backdrop : 'true' | 'false'（默认 true；点遮罩关闭）
 *
 * EVENTS
 * ━━━━━
 *   open  · {detail:{}}
 *   close · {detail:{source:'x'|'backdrop'|'api'}}
 */

(function(){
  if (customElements.get('ml-modal')) return;

  const TEMPLATE = `
    <style>
      :host{
        position:fixed; inset:0; z-index:2147483500;
        display:none; align-items:center; justify-content:center;
        --_bg:rgba(0,0,0,.6);
        --_panel:#1f1f1f;
        --_ink:#f5f5f5;
        --_border:#333;
      }
      :host([open="true"]){ display:flex; }
      .backdrop{
        position:absolute; inset:0;
        background:var(--ml-bg, var(--_bg));
        animation:mlmFade .18s ease;
      }
      .panel{
        position:relative;
        background:var(--ml-panel, var(--_panel));
        color:var(--ml-ink, var(--_ink));
        border:1px solid var(--ml-border, var(--_border));
        border-radius:12px;
        box-shadow:0 24px 64px rgba(0,0,0,.4);
        width:90%; max-width:640px; max-height:80vh; overflow:auto;
        padding:20px 24px;
        animation:mlmPop .22s cubic-bezier(.2,.7,.3,1.1);
      }
      :host([size="sm"]) .panel{ max-width:420px; }
      :host([size="lg"]) .panel{ max-width:840px; }
      .head{
        display:flex; align-items:center; justify-content:space-between;
        margin-bottom:12px; padding-bottom:10px;
        border-bottom:1px solid var(--_border);
      }
      .title{
        font:600 16px/1.4 -apple-system,"PingFang SC",serif;
        letter-spacing:1px;
      }
      :host(:not([title])) .head{ display:none; }
      button.x{
        background:transparent; border:0; color:inherit;
        font-size:20px; cursor:pointer; padding:0 4px; line-height:1;
        opacity:.7; transition:opacity .15s;
      }
      button.x:hover{ opacity:1; }
      .body :slotted(*){ display:block; }
      @keyframes mlmFade{ from{opacity:0} to{opacity:1} }
      @keyframes mlmPop{
        from{opacity:0; transform:translateY(8px) scale(.96)}
        to{opacity:1; transform:translateY(0) scale(1)}
      }
    </style>
    <div class="backdrop" part="backdrop"></div>
    <div class="panel" part="panel" role="dialog" aria-modal="true">
      <div class="head">
        <div class="title"></div>
        <button class="x" aria-label="关闭">✕</button>
      </div>
      <div class="body"><slot></slot></div>
    </div>
  `;

  class MlModal extends HTMLElement {
    static get observedAttributes(){ return ['open','title','size','close-on-backdrop']; }
    constructor(){
      super();
      this.attachShadow({mode:'open'});
      this.shadowRoot.innerHTML = TEMPLATE;
      this._title = this.shadowRoot.querySelector('.title');
      this._x = this.shadowRoot.querySelector('button.x');
      this._back = this.shadowRoot.querySelector('.backdrop');
      this._x.addEventListener('click', ()=> this.close('x'));
      this._back.addEventListener('click', ()=> {
        if (this.getAttribute('close-on-backdrop') !== 'false') this.close('backdrop');
      });
      this._escHandler = (e)=> {
        if (e.key === 'Escape' && this.getAttribute('open') === 'true') this.close('escape');
      };
    }
    attributeChangedCallback(name, oldV, newV){
      if (name === 'title') this._title.textContent = newV||'';
      if (name === 'open' && oldV !== newV){
        if (newV === 'true') this._enter();
        else this._leave();
      }
    }
    connectedCallback(){
      if (this.hasAttribute('title')) this._title.textContent = this.getAttribute('title');
      if (this.getAttribute('open') === 'true') this._enter();
      document.addEventListener('keydown', this._escHandler);
    }
    disconnectedCallback(){
      document.removeEventListener('keydown', this._escHandler);
    }
    _enter(){
      document.addEventListener('keydown', this._escHandler);
      this.dispatchEvent(new CustomEvent('open', {detail:{}, bubbles:true, composed:true}));
    }
    _leave(){
      document.removeEventListener('keydown', this._escHandler);
      this.dispatchEvent(new CustomEvent('close', {detail:{source:'api'}, bubbles:true, composed:true}));
    }
    open(){ this.setAttribute('open','true'); return this; }
    close(source){
      this.setAttribute('open','false');
      // 触发带 source 的 close 事件
      this.dispatchEvent(new CustomEvent('close', {detail:{source:source||'api'}, bubbles:true, composed:true}));
      return this;
    }
  }

  customElements.define('ml-modal', MlModal);

  // ─────────────────────────────────────────────
  // Backward-compat fallback（不改旧代码）
  // ─────────────────────────────────────────────
  // 1) 自动把 .modal / .modal-overlay / [id$="Modal"] 包成 <ml-modal>，
  //    让旧代码 document.getElementById('kbDetailModal').style.display='flex' 仍生效
  function upgradeLegacyModal(el){
    if (!el || el.dataset.mlmUpgraded === '1') return;
    el.dataset.mlmUpgraded = '1';
    // 同步 display 状态
    const cs = getComputedStyle(el);
    const isOpen = cs.display !== 'none';
    const m = document.createElement('ml-modal');
    if (el.id) m.id = el.id;
    // 把内容移到 slot
    while (el.firstChild) m.appendChild(el.firstChild);
    el.style.display = 'none'; // 原节点保留但隐藏
    el.parentNode.insertBefore(m, el);
    if (isOpen) m.setAttribute('open','true');
  }
  function autoUpgrade(){
    const sels = ['.modal','.modal-overlay','[id$="Modal"]'];
    document.querySelectorAll(sels.join(',')).forEach(upgradeLegacyModal);
  }
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', autoUpgrade, {once:true});
  } else {
    autoUpgrade();
  }
  // 2) 全局兜底：旧函数 openKbDetail() / closeAskModal() 直接改 display
  //    （不强行绑定到具体函数名，由各页自己实现；这里只暴露 helper）
  window.MlModal = MlModal;
  window.__mlModalUpgrade = upgradeLegacyModal;
})();
