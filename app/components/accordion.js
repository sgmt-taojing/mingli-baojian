/**
 * <ml-accordion> · Web Component v1 (F-9 规范)
 *
 * USAGE EXAMPLE
 * ━━━━━━━━━━━━
 *   <ml-accordion multiple="true" id="faqAccordion">
 *     <ml-accordion-item title="什么是八字？" icon="📜">八字即四柱八字...</ml-accordion-item>
 *     <ml-accordion-item title="如何排盘？" icon="🔮" open>使用 lunar-js 库...</ml-accordion-item>
 *     <ml-accordion-item title="什么是用神？" icon="⚖️" disabled>...</ml-accordion-item>
 *   </ml-accordion>
 *
 *   const acc = document.getElementById('faqAccordion');
 *   acc.addEventListener('item-toggle', e => console.log('toggled:', e.detail.index));
 *
 * ATTRIBUTES（ml-accordion）
 * ━━━━━━━━━━━━━━━━━━━━━━━━
 *   multiple : 'true' | 'false' — 是否多开（默认 false，单开模式）
 *
 * ATTRIBUTES（ml-accordion-item）
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *   title    : string — 标题（必填）
 *   icon     : emoji/string — 标题前缀
 *   open     : boolean — 默认展开
 *   disabled : boolean — 禁用
 *
 * CSS VARS
 * ━━━━━━━━
 *   --ml-bg, --ml-panel, --ml-ink, --ml-muted, --ml-border,
 *   --ml-primary, --ml-accent-open, --ml-radius
 *
 * EVENTS
 * ━━━━━━
 *   item-toggle · {detail:{index, open, title, source:'user'|'api'}}
 */

(function(){
  if (customElements.get('ml-accordion') && customElements.get('ml-accordion-item')) return;

  // ───────────────────── ml-accordion-item ─────────────────────
  class MlAccordionItem extends HTMLElement {
    static get observedAttributes(){ return ['title','icon','open','disabled']; }
    constructor(){
      super();
      this.attachShadow({mode:'open'});
      this._open = false;
      this._mount();
    }
    _mount(){
      this.shadowRoot.innerHTML = `
        <style>
          :host{
            display:block;
            border-bottom:1px solid var(--ml-border, rgba(201,168,76,.2));
          }
          :host(:last-of-type){ border-bottom:0; }
          .head{
            display:flex; align-items:center; justify-content:space-between;
            padding:14px 18px;
            cursor:pointer;
            user-select:none;
            background:transparent;
            transition:background .15s;
          }
          .head:hover{ background:rgba(201,168,76,.06); }
          :host([disabled]) .head{
            cursor:not-allowed;
            opacity:.5;
          }
          :host([disabled]) .head:hover{ background:transparent; }
          .left{ display:flex; align-items:center; gap:8px; flex:1; min-width:0; }
          .icon{ font-size:16px; }
          .title{
            font:600 15px/1.4 -apple-system,"PingFang SC","Noto Serif SC",serif;
            color:var(--ml-ink, #eee);
            letter-spacing:1px;
            overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
          }
          .arrow{
            flex-shrink:0;
            width:20px; height:20px;
            display:flex; align-items:center; justify-content:center;
            color:var(--ml-muted, #8a8a9a);
            transition:transform .25s ease;
          }
          :host([open]) .arrow{ transform:rotate(90deg); }
          .body{
            max-height:0;
            overflow:hidden;
            transition:max-height .3s ease, padding .3s ease;
            padding:0 18px;
            color:var(--ml-ink, #eee);
            font-size:14px;
            line-height:1.7;
          }
          :host([open]) .body{
            max-height:800px;
            padding:0 18px 16px;
          }
        </style>
        <div class="head" part="head" role="button" tabindex="0">
          <div class="left">
            <span class="icon"></span>
            <span class="title"></span>
          </div>
          <span class="arrow">▸</span>
        </div>
        <div class="body" part="body"><slot></slot></div>
      `;
      this._head = this.shadowRoot.querySelector('.head');
      this._titleEl = this.shadowRoot.querySelector('.title');
      this._iconEl = this.shadowRoot.querySelector('.icon');
      this._head.addEventListener('click', ()=> this._onToggle('user'));
      this._head.addEventListener('keydown', (e)=>{
        if (e.key === 'Enter' || e.key === ' '){
          e.preventDefault();
          this._onToggle('user');
        }
      });
    }
    connectedCallback(){
      this._sync();
      if (this.hasAttribute('open')) this._open = true;
    }
    attributeChangedCallback(name, oldV, newV){
      if (name === 'title' || name === 'icon') this._sync();
      if (name === 'open' && oldV !== newV){
        const wantOpen = newV !== null;
        if (wantOpen !== this._open) this._applyState(wantOpen, 'attr');
      }
    }
    _sync(){
      const title = this.getAttribute('title') || '';
      const icon = this.getAttribute('icon') || '';
      this._titleEl.textContent = title;
      this._iconEl.textContent = icon;
      this._iconEl.style.display = icon ? '' : 'none';
    }
    _onToggle(source){
      if (this.hasAttribute('disabled')) return;
      this._applyState(!this._open, source);
    }
    _applyState(open, source){
      this._open = open;
      if (open){
        this.setAttribute('open', '');
      } else {
        this.removeAttribute('open');
      }
      this.dispatchEvent(new CustomEvent('item-toggle', {
        detail:{
          index: this._indexInParent?.() ?? -1,
          open,
          title: this.getAttribute('title')||'',
          source
        },
        bubbles:true, composed:true
      }));
    }
    _indexInParent(){
      const p = this.parentElement;
      if (!p || p.tagName !== 'ML-ACCORDION') return -1;
      return Array.from(p.children).indexOf(this);
    }
    get open(){ return this._open; }
  }

  // ───────────────────── ml-accordion ─────────────────────
  class MlAccordion extends HTMLElement {
    static get observedAttributes(){ return ['multiple']; }
    constructor(){
      super();
      this.attachShadow({mode:'open'});
      this.shadowRoot.innerHTML = `
        <style>
          :host{
            display:block;
            background:var(--ml-panel, #16213e);
            border:1px solid var(--ml-border, rgba(201,168,76,.2));
            border-radius:var(--ml-radius, 14px);
            overflow:hidden;
          }
          ::slotted(*){ display:block; }
        </style>
        <slot></slot>
      `;
    }
    connectedCallback(){
      this.addEventListener('item-toggle', (e)=>{
        if (e.detail.source !== 'user') return;
        if (this.getAttribute('multiple') === 'true') return;
        // 单开模式：关闭其它
        const items = Array.from(this.querySelectorAll('ml-accordion-item'));
        items.forEach(it=>{
          if (it !== e.target && it.open){
            it._applyState(false, 'api');
          }
        });
      });
    }
    openAll(){
      this.querySelectorAll('ml-accordion-item:not([disabled])').forEach(it=>{
        it._applyState(true, 'api');
      });
    }
    closeAll(){
      this.querySelectorAll('ml-accordion-item').forEach(it=>{
        it._applyState(false, 'api');
      });
    }
  }

  customElements.define('ml-accordion-item', MlAccordionItem);
  customElements.define('ml-accordion', MlAccordion);

  window.MlAccordion = MlAccordion;
  window.MlAccordionItem = MlAccordionItem;
})();