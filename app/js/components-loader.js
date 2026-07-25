/**
 * ml-components-loader.js
 *
 * 统一加载并注册所有 ml-* Web Components
 * 注册完成后挂载 window.ml 全局命名空间：
 *   window.ml.toast.success('已保存')
 *   window.ml.modal.open('myModal')
 *   window.ml.tab.setActive('demoTab', 2)
 *   window.ml.card.create({ title: '...', body: '...' })
 *   window.ml.accordion.openAll('faqId')
 *
 * 用法：
 *   <!-- 相对路径引入（与本 html 同目录起算 ../js/） -->
 *   <script type="module" src="../js/components-loader.js"></script>
 *
 * 已注册组件：
 *   - <ml-toast>           app/components/toast.js
 *   - <ml-modal>           app/components/modal.js
 *   - <ml-tab>             app/components/tab.js
 *   - <ml-card>            app/components/card.js
 *   - <ml-accordion>       app/components/accordion.js
 *   - <ml-tap>             app/components/tap.js   ★ a11y 假按钮替代
 *   - <ml-tab-pane>        app/components/tab.js
 *   - <ml-accordion-item>  app/components/accordion.js
 *
 * 设计原则：
 *   - 单次导入：仅发起 6 个 HTTP 请求（每个组件一个）
 *   - 加载完成触发 window.ML_COMPONENTS_READY=true + 'ml:ready' CustomEvent
 *   - 提供 ml.toast / ml.modal / ml.tab / ml.card / ml.accordion / ml.tap 命名空间
 *   - 旧 API（window.toast / shToast / switchTab / openModal / closeModal）由各组件文件内部挂载，本文件不重复
 */

const __loaded = new Set();

async function tryImport(spec){
  if (__loaded.has(spec)) return;
  __loaded.add(spec);
  try {
    await import(spec);
    console.log('[ml-loader] ✓ loaded:', spec);
  } catch (e){
    console.error('[ml-loader] ✗ failed to import', spec, e);
  }
}

(async function bootstrap(){
  // 同时并发拉所有组件，互不依赖
  await Promise.all([
    tryImport('../components/toast.js'),
    tryImport('../components/modal.js'),
    tryImport('../components/tab.js'),
    tryImport('../components/card.js'),
    tryImport('../components/accordion.js'),
    tryImport('../components/tap.js'),
  ]);

  // 注册 window.ml 命名空间（依赖各组件已注册 class）
  const ml = {
    version: '1.1.0',
    components: [
      'ml-toast', 'ml-modal',
      'ml-tab', 'ml-tab-pane',
      'ml-card',
      'ml-accordion', 'ml-accordion-item',
      'ml-tap',
    ],

    // ── toast ──
    toast: {
      _ensure(){
        let el = document.querySelector('ml-toast');
        if (!el){
          el = document.createElement('ml-toast');
          document.body.appendChild(el);
        }
        return el;
      },
      show:    (msg, type) => ml.toast._ensure().show(msg, type),
      success: (msg)       => ml.toast._ensure().success(msg),
      error:   (msg)       => ml.toast._ensure().error(msg),
      warn:    (msg)       => ml.toast._ensure().warn(msg),
      info:    (msg)       => ml.toast._ensure().info(msg),
      hide:    ()          => ml.toast._ensure().hide(),
    },

    // ── modal ──
    modal: {
      open(id){
        const el = document.getElementById(id);
        if (el && typeof el.open === 'function') return el.open();
        console.warn(`[ml.modal] #${id} not found or not <ml-modal>`);
      },
      close(id, source){
        const el = document.getElementById(id);
        if (el && typeof el.close === 'function') return el.close(source||'api');
      },
      // 通用 confirm：基于临时 ml-modal 立即返回一个 Promise
      confirm({ title='确认', message='确定执行吗？', confirmText='确定', cancelText='取消', size='sm' } = {}){
        return new Promise((resolve)=>{
          const m = document.createElement('ml-modal');
          m.setAttribute('title', title);
          m.setAttribute('size', size);
          m.innerHTML = `
            <p style="color:var(--ml-ink,#eee);font-size:14px;line-height:1.7;padding:4px 0">${message}</p>
            <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px">
              <button data-act="cancel" style="padding:8px 16px;border:1px solid var(--ml-border,rgba(201,168,76,.3));background:transparent;color:var(--ml-ink,#eee);border-radius:6px;cursor:pointer;font:inherit">${cancelText}</button>
              <button data-act="ok" style="padding:8px 16px;border:0;background:var(--ml-primary,#c9a84c);color:var(--ml-ink-on-primary,#1a1a2e);border-radius:6px;cursor:pointer;font:600 inherit">${confirmText}</button>
            </div>`;
          m.addEventListener('close', ()=> resolve(false));
          m.querySelector('[data-act="ok"]').addEventListener('click', ()=>{
            m.close('ok'); resolve(true);
          });
          m.querySelector('[data-act="cancel"]').addEventListener('click', ()=>{
            m.close('cancel'); resolve(false);
          });
          document.body.appendChild(m);
          m.open();
        });
      },
    },

    // ── tab ──
    tab: {
      setActive(id, index){
        const el = document.getElementById(id);
        if (el && typeof el.setActive === 'function') return el.setActive(index);
        console.warn(`[ml.tab] #${id} not found or not <ml-tab>`);
      },
      getActive(id){
        const el = document.getElementById(id);
        return el?.activeIndex ?? -1;
      },
    },

    // ── card ──
    card: {
      create({ title='', subtitle='', variant='elevated', color, body='', footer='' } = {}){
        const c = document.createElement('ml-card');
        if (title)    c.setAttribute('title', title);
        if (subtitle) c.setAttribute('subtitle', subtitle);
        if (variant)  c.setAttribute('variant', variant);
        if (color)    c.setAttribute('color', color);
        if (body)     c.innerHTML = body;
        if (footer){
          const f = document.createElement('div');
          f.setAttribute('slot','footer');
          f.innerHTML = footer;
          c.appendChild(f);
        }
        return c;
      },
    },

    // ── accordion ──
    accordion: {
      openAll(id){
        const el = document.getElementById(id);
        if (el && typeof el.openAll === 'function') return el.openAll();
      },
      closeAll(id){
        const el = document.getElementById(id);
        if (el && typeof el.closeAll === 'function') return el.closeAll();
      },
    },

    // ── tap ── (a11y 假按钮替代)
    tap: {
      disable(el) { if (el && el.disable) el.disable(); },
      enable(el)  { if (el && el.enable)  el.enable(); },
      press(el)   { if (el && el.press)   el.press(); },
    },
  };

  window.ml = ml;
  window.ML_COMPONENTS_READY = true;
  document.dispatchEvent(new CustomEvent('ml:ready', { detail: ml }));
  console.log('[ml-loader] ✓ all components registered; window.ml ready');
})();