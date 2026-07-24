/**
 * <ml-tab> · Web Component v1 (F-9 规范)
 *
 * USAGE EXAMPLE
 * ━━━━━━━━━━━━
 *   <ml-tab active="0" id="mainTab">
 *     <ml-tab-pane label="📐 五行总览">面板1：五行关系图</ml-tab-pane>
 *     <ml-tab-pane label="📤 上传报告">面板2：上传表单</ml-tab-pane>
 *     <ml-tab-pane label="🤖 AI解读">面板3：AI 解读</ml-tab-pane>
 *   </ml-tab>
 *
 *   <script src="app/components/tab.js"></script>
 *   const tab = document.getElementById('mainTab');
 *   tab.addEventListener('tab-change', e => console.log('switched →', e.detail.index));
 *   tab.setActive(2);  // 编程切换
 *
 * TYPICAL REFERENCE（来自 app/divination-integrated.html 内联实现）
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *   <div class="tab-bar">
 *     <button class="tab-btn active" onclick="switchTab('overview')">📐 五行总览</button>
 *     <button class="tab-btn" onclick="switchTab('report')">📤 上传报告</button>
 *     ...
 *   </div>
 *   <div class="tab-panel active" id="tab-overview">...</div>
 *   <div class="tab-panel" id="tab-report">...</div>
 *   function switchTab(name){
 *     document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
 *     document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
 *     ...
 *   }
 *
 * ATTRIBUTES（ml-tab）
 * ━━━━━━━━━━━━━━━━━━━━
 *   active    : 数字索引（默认 0）
 *   position  : 'top' | 'bottom'（默认 top；bar 位置）
 *   align     : 'left' | 'center' | 'right'（默认 left）
 *
 * ATTRIBUTES（ml-tab-pane）
 * ━━━━━━━━━━━━━━━━━━━━━━━━
 *   label : 按钮文字（必填）
 *   icon  : emoji/字符（可选，与 label 拼接）
 *   disabled : 'true' 不可点
 *
 * EVENTS
 * ━━━━━━
 *   tab-change · {detail:{index, label, prevIndex}}
 */

(function(){
  if (customElements.get('ml-tab') && customElements.get('ml-tab-pane')) return;

  // ───────────────────────────── ml-tab-pane ─────────────────────────────
  class MlTabPane extends HTMLElement {
    static get observedAttributes(){ return ['label','icon','disabled']; }
    constructor(){ super(); }
    connectedCallback(){
      if (!this.hasAttribute('role')) this.setAttribute('role','tabpanel');
    }
    get label(){ return this.getAttribute('label')||''; }
    get disabled(){ return this.getAttribute('disabled') === 'true'; }
  }

  // ───────────────────────────── ml-tab ─────────────────────────────────
  const TEMPLATE = `
    <style>
      :host{ display:block; }
      .bar{
        display:flex; gap:6px; padding:4px;
        background:var(--ml-bg,#fff);
        border:1px solid var(--ml-border,#e5e5e5);
        border-radius:12px; margin-bottom:12px; flex-wrap:wrap;
      }
      :host([position="bottom"]) .bar{ order:2; margin:12px 0 0; }
      :host([align="center"]) .bar{ justify-content:center; }
      :host([align="right"])  .bar{ justify-content:flex-end; }
      button{
        flex:1; min-width:100px;
        padding:10px 18px; border:0; border-radius:8px;
        background:transparent;
        color:var(--ml-muted,#6b7280);
        font:14px/1 inherit; cursor:pointer;
        transition:background .2s, color .2s;
      }
      button:hover:not(.active):not(:disabled){
        background:rgba(201,168,76,.08);
        color:var(--ml-primary,#c9a84c);
      }
      button.active{
        background:var(--ml-primary,#c9a84c);
        color:var(--ml-ink-on-primary,#fff);
        font-weight:600;
      }
      button:disabled{ opacity:.4; cursor:not-allowed; }
      .panes > ::slotted(*){ display:none; animation:mltFade .25s ease; }
      .panes > ::slotted(.ml-tab-active){ display:block; }
      @keyframes mltFade{
        from{opacity:0; transform:translateY(4px)}
        to  {opacity:1; transform:translateY(0)}
      }
    </style>
    <div class="bar" part="bar" role="tablist"></div>
    <div class="panes" part="panes"><slot></slot></div>
  `;

  class MlTab extends HTMLElement {
    static get observedAttributes(){ return ['active','position','align']; }
    constructor(){
      super();
      this.attachShadow({mode:'open'});
      this.shadowRoot.innerHTML = TEMPLATE;
      this._bar = this.shadowRoot.querySelector('.bar');
      this._slot = this.shadowRoot.querySelector('slot');
      this._panes = [];
      this._active = -1;
    }
    connectedCallback(){
      this._slot.addEventListener('slotchange', ()=> this._sync());
      this._sync();
    }
    attributeChangedCallback(name, oldV, newV){
      if (name === 'active' && oldV !== newV){
        const idx = parseInt(newV||'0',10);
        if (!isNaN(idx)) this.setActive(idx);
      }
    }
    _sync(){
      // 收集 panes
      this._panes = Array.from(this.querySelectorAll('ml-tab-pane'));
      // 重建按钮
      this._bar.innerHTML = '';
      this._panes.forEach((pane, idx)=>{
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('role','tab');
        const icon = pane.getAttribute('icon');
        const label = pane.getAttribute('label') || pane.label || `Tab${idx+1}`;
        b.textContent = (icon ? icon+' ' : '') + label;
        if (pane.disabled) b.disabled = true;
        b.addEventListener('click', ()=> {
          if (pane.disabled) return;
          this.setActive(idx);
        });
        this._bar.appendChild(b);
      });
      const idx = parseInt(this.getAttribute('active')||'0',10);
      this.setActive(isNaN(idx)?0:idx);
    }
    setActive(index){
      if (!this._panes.length) return this;
      const prev = this._active;
      const idx = Math.max(0, Math.min(index, this._panes.length-1));
      this._active = idx;
      this.setAttribute('active', String(idx));
      // 按钮 active 态
      Array.from(this._bar.children).forEach((b,i)=> b.classList.toggle('active', i===idx));
      // pane active 态
      this._panes.forEach((p,i)=> p.classList.toggle('ml-tab-active', i===idx));
      this.dispatchEvent(new CustomEvent('tab-change', {
        detail:{ index:idx, label:this._panes[idx]?.getAttribute('label')||'', prevIndex:prev },
        bubbles:true, composed:true
      }));
      return this;
    }
    get activeIndex(){ return this._active; }
  }

  customElements.define('ml-tab-pane', MlTabPane);
  customElements.define('ml-tab', MlTab);

  // ─────────────────────────────────────────────
  // Backward-compat fallback（不改旧代码）
  // ─────────────────────────────────────────────
  // 监听 .tab-btn + .tab-panel 的旧模式（典型：divination-integrated.html）
  function upgradeLegacyTabs(){
    // 不强行替换按钮，只让旧函数 window.switchTab(name) 继续工作
    if (typeof window.switchTab === 'function') return;
    window.switchTab = function(name){
      // 找所有 tab-btn / tab-panel 对
      const btns = document.querySelectorAll('.tab-btn');
      const panels = document.querySelectorAll('.tab-panel');
      btns.forEach(b=> b.classList.remove('active'));
      panels.forEach(p=> p.classList.remove('active'));
      // 通过 onclick 字符串解析 tab 名（粗略兼容）
      btns.forEach(b=>{
        const oc = b.getAttribute('onclick')||'';
        if (oc.includes(`'${name}'`) || oc.includes(`"${name}"`)) b.classList.add('active');
      });
      const target = document.getElementById('tab-'+name);
      if (target) target.classList.add('active');
    };
  }
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', upgradeLegacyTabs, {once:true});
  } else {
    upgradeLegacyTabs();
  }
  window.MlTab = MlTab;
  window.MlTabPane = MlTabPane;
})();