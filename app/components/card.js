/**
 * <ml-card> · Web Component v1 (F-9 规范)
 *
 * USAGE EXAMPLE
 * ━━━━━━━━━━━━
 *   <ml-card title="📊 五行总览" subtitle="基于您提供的八字" variant="elevated">
 *     <p>这里是卡片内容...</p>
 *     <div slot="footer">
 *       <button>详情</button>
 *     </div>
 *   </ml-card>
 *
 *   const card = document.querySelector('ml-card');
 *   card.setAttribute('variant', 'glass');
 *
 * ATTRIBUTES
 * ━━━━━━━━━
 *   title    : string — 卡片标题（slot='title' 也可）
 *   subtitle : string — 副标题
 *   variant  : 'flat' | 'elevated' | 'glass' | 'outlined'（默认 elevated）
 *   clickable: 'true' | 'false' — 是否可点击（hover 高亮）
 *   color    : 'gold' | 'success' | 'error' | 'warn' | 'info' — 强调色（左侧色条）
 *
 * SLOTS
 * ━━━━━
 *   default  : 主内容
 *   title    : 自定义标题（覆盖 title 属性）
 *   subtitle : 自定义副标题
 *   footer   : 底部操作区（按钮组等）
 *   media    : 顶部媒体（图片/图表）
 *
 * CSS VARS
 * ━━━━━━━━
 *   --ml-bg, --ml-panel, --ml-ink, --ml-muted, --ml-border,
 *   --ml-primary, --ml-radius, --ml-shadow, --ml-accent
 *
 * EVENTS
 * ━━━━━━
 *   card-click · {detail:{}} — 当 clickable='true' 时点击触发
 */

(function(){
  if (customElements.get('ml-card')) return;

  const TEMPLATE = `
    <style>
      :host{
        display:block;
        --_bg:#fff;
        --_panel:#16213e;
        --_ink:#eee;
        --_muted:#8a8a9a;
        --_border:rgba(201,168,76,.2);
        --_primary:#c9a84c;
        --_radius:14px;
        --_shadow:0 4px 16px rgba(0,0,0,.18);
        --_accent:var(--_primary);
        font-family:-apple-system,"PingFang SC","Noto Serif SC",serif;
        color:var(--ml-ink, var(--_ink));
      }
      .card{
        position:relative;
        background:var(--ml-panel, var(--_panel));
        border:1px solid var(--ml-border, var(--_border));
        border-radius:var(--ml-radius, var(--_radius));
        padding:20px 24px;
        box-shadow:var(--ml-shadow, transparent);
        transition:transform .2s, box-shadow .2s, border-color .2s;
        overflow:hidden;
      }
      :host([variant="flat"]) .card{
        box-shadow:none;
        background:transparent;
      }
      :host([variant="outlined"]) .card{
        box-shadow:none;
        background:transparent;
        border-width:2px;
      }
      :host([variant="glass"]) .card{
        background:rgba(22,33,62,.55);
        backdrop-filter:blur(12px);
        -webkit-backdrop-filter:blur(12px);
      }
      :host([clickable="true"]) .card{
        cursor:pointer;
      }
      :host([clickable="true"]) .card:hover{
        transform:translateY(-2px);
        border-color:var(--_primary);
      }
      /* 强调色左侧条 */
      .card::before{
        content:"";
        position:absolute;
        left:0; top:0; bottom:0;
        width:4px;
        background:var(--ml-accent, transparent);
        opacity:0;
        transition:opacity .2s;
      }
      :host([color]) .card::before{ opacity:1; }
      :host([color="gold"])    .card::before{ background:var(--_primary); }
      :host([color="success"]) .card::before{ background:#10b981; }
      :host([color="error"])   .card::before{ background:#ef4444; }
      :host([color="warn"])    .card::before{ background:#f59e0b; }
      :host([color="info"])    .card::before{ background:#3b82f6; }
      .head{
        display:flex;
        align-items:flex-start;
        justify-content:space-between;
        gap:10px;
        margin-bottom:12px;
      }
      .title-wrap{ flex:1; min-width:0; }
      .title{
        font:600 16px/1.4 inherit;
        color:var(--_primary);
        letter-spacing:1px;
        margin-bottom:4px;
      }
      .subtitle{
        font:13px/1.4 inherit;
        color:var(--ml-muted, var(--_muted));
      }
      :host(:not([title])) .title,
      :host(:not([title])) slot[name="title"]::slotted(*){
        display:none;
      }
      :host(:not([subtitle])) .subtitle,
      :host(:not([subtitle])) slot[name="subtitle"]::slotted(*){
        display:none;
      }
      .body{
        font-size:14px;
        line-height:1.7;
        color:var(--ml-ink, var(--_ink));
      }
      .body ::slotted(*){
        margin-bottom:8px;
      }
      .body ::slotted(*:last-child){
        margin-bottom:0;
      }
      .footer{
        margin-top:14px;
        padding-top:12px;
        border-top:1px solid var(--_border);
        display:flex;
        align-items:center;
        justify-content:flex-end;
        gap:8px;
      }
      .footer:not(:has(slot[name="footer"])::slotted(*)){ display:none; }
      slot[name="footer"]{
        display:none;
      }
      slot[name="footer"]::slotted(*){
        display:inline-flex;
      }
      .has-footer slot[name="footer"]{ display:inline; }
      .media{
        margin:-20px -24px 14px;
      }
      .media ::slotted(img),
      .media ::slotted(video){
        display:block;
        width:100%;
        max-height:240px;
        object-fit:cover;
      }
      .media:not(:has(slot[name="media"])::slotted(*)){ display:none; }
    </style>
    <div class="card" part="card">
      <div class="media"><slot name="media"></slot></div>
      <div class="head">
        <div class="title-wrap">
          <div class="title"><slot name="title">${''}</slot></div>
          <div class="subtitle"><slot name="subtitle">${''}</slot></div>
        </div>
      </div>
      <div class="body"><slot></slot></div>
      <div class="footer"><slot name="footer"></slot></div>
    </div>
  `;

  class MlCard extends HTMLElement {
    static get observedAttributes(){ return ['title','subtitle','variant','clickable','color']; }
    constructor(){
      super();
      this.attachShadow({mode:'open'});
      this.shadowRoot.innerHTML = TEMPLATE;
      this._titleSlot = this.shadowRoot.querySelector('slot[name="title"]');
      this._subtitleSlot = this.shadowRoot.querySelector('slot[name="subtitle"]');
      this._footerSlot = this.shadowRoot.querySelector('slot[name="footer"]');
      this._footer = this.shadowRoot.querySelector('.footer');
      this._card = this.shadowRoot.querySelector('.card');
      this._footerSlot.addEventListener('slotchange', ()=> this._syncFooter());
      this._syncFooter();
    }
    connectedCallback(){
      this._card.addEventListener('click', (e)=>{
        if (this.getAttribute('clickable') === 'true'){
          this.dispatchEvent(new CustomEvent('card-click', {
            detail:{}, bubbles:true, composed:true
          }));
        }
      });
    }
    attributeChangedCallback(name, oldV, newV){
      if (name === 'title') this._syncTitle();
      if (name === 'subtitle') this._syncSubtitle();
    }
    _syncTitle(){
      const t = this.getAttribute('title') || '';
      // 写入 default slot 前的 fallback：使用 _titleSlot 的 textContent 兜底
      const titleEl = this.shadowRoot.querySelector('.title');
      if (t && !this.querySelector('[slot="title"]')){
        titleEl.textContent = t;
      }
    }
    _syncSubtitle(){
      const s = this.getAttribute('subtitle') || '';
      const subtitleEl = this.shadowRoot.querySelector('.subtitle');
      if (s && !this.querySelector('[slot="subtitle"]')){
        subtitleEl.textContent = s;
      }
    }
    _syncFooter(){
      const nodes = this._footerSlot.assignedNodes({flatten:true});
      const hasContent = nodes.some(n=> n.nodeType === Node.ELEMENT_NODE || (n.nodeType === Node.TEXT_NODE && n.textContent.trim()));
      this._footer.style.display = hasContent ? 'flex' : 'none';
    }
    get variant(){ return this.getAttribute('variant')||'elevated'; }
    get title(){ return this.getAttribute('title')||''; }
    get subtitle(){ return this.getAttribute('subtitle')||''; }
  }

  customElements.define('ml-card', MlCard);

  // Backward-compat: expose class
  window.MlCard = MlCard;
})();