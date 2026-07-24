# 命理宝鉴 · 前端组件库 v1

> **作用域**：替换项目内散落的 toast / modal / tab 实现为标准 Web Components  
> **规范引用**：F-9（Web Components 优先）+ DRY 原则  
> **覆盖范围**：21 处 toast + 21 处 tab + 3 处 modal（扫描自 45 个 HTML 文件）  
> **维护起点**：节点 2 完成（3 个组件文件就绪）+ 节点 3 完成（demo 页面 795 行）  
> **设计原则**：零依赖 / Shadow DOM / Custom Elements v1 / 向后兼容

---

## 一、组件清单

| 组件 | 文件 | 行数 | 状态 |
|------|------|------|------|
| `<ml-toast>` | `app/components/toast.js` | 153 | ✅ 完成 |
| `<ml-modal>` | `app/components/modal.js` | 195 | ✅ 完成 |
| `<ml-tab>` / `<ml-tab-pane>` | `app/components/tab.js` | 198 | ✅ 完成 |
| 演示页 | `app/components/demo.html` | 795 | ✅ 完成 |
| 组件文档 | `docs/COMPONENTS.md`（本文） | — | ✅ 完成 |

---

## 二、引入方式

```html
<!-- 1. 引入组件（按需） -->
<script type="module" src="components/toast.js"></script>
<script type="module" src="components/modal.js"></script>
<script type="module" src="components/tab.js"></script>

<!-- 2. 旧代码无需改动，window.toast / shToast / switchTab 自动可用 -->
```

> 模块加载顺序：toast → modal → tab（独立组件，无依赖）。  
> JS 加载完成后自动注册 Custom Elements，旧 API（`window.toast.show` / `shToast` / 旧 `switchTab` / `.modal` / `[id$="Modal"]`）自动 polyfill。

---

## 三、API 速查

### 1. `<ml-toast>` — 轻量消息提示

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `type` | `success \| error \| warn \| info` | `info` | 提示类型 |
| `duration` | number (ms) | `2400` | 自动关闭延时 |
| `position` | `top \| bottom \| center` | `top` | 屏幕位置 |

**JS 方法**：`show(msg, type)` · `success(msg)` · `error(msg)` · `warn(msg)` · `info(msg)` · `hide()`  
**CSS 变量**：`--ml-bg` · `--ml-ink` · `--ml-success` · `--ml-error` · `--ml-warn` · `--ml-info`  
**旧 API 兼容**：`window.toast.show(msg, type)` / `shToast(msg)` / `toast.success(...)` 全保留。

### 2. `<ml-modal>` — 模态弹窗

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `title` | string | — | 弹窗标题 |
| `open` | `true \| false` | `false` | 是否打开 |
| `size` | `sm \| md \| lg` | `md` | 弹窗宽度（420/640/840 px） |
| `close-on-backdrop` | `true \| false` | `true` | 遮罩点击关闭 |

**JS 方法**：`open()` · `close(source?)`  
**事件**：`open` · `close`（detail: `{source: 'x' \| 'backdrop' \| 'escape' \| 'api'}`）  
**CSS 变量**：`--ml-bg` · `--ml-panel` · `--ml-ink` · `--ml-border`  
**旧 API 兼容**：`.modal` / `.modal-overlay` / `[id$="Modal"]` 自动升级为 `<ml-modal>`；  
`window.MlModal` · `window.__mlModalUpgrade()` 暴露。

### 3. `<ml-tab>` + `<ml-tab-pane>` — 标签页

**宿主属性（`<ml-tab>`）**

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `active` | number | `0` | 当前激活面板索引 |
| `position` | `top \| bottom` | `top` | 标签栏位置 |
| `align` | `left \| center \| right` | `left` | 标签栏对齐 |

**面板属性（`<ml-tab-pane>`）**

| 属性 | 类型 | 说明 |
|------|------|------|
| `label` | string（必填） | 按钮文字 |
| `icon` | emoji/string | 图标前缀 |
| `disabled` | boolean | 禁用该标签 |

**JS 方法**：`setActive(index)` · `activeIndex`（getter）  
**事件**：`tab-change`（detail: `{index, label, prevIndex}`）  
**CSS 变量**：`--ml-primary` · `--ml-muted` · `--ml-bg` · `--ml-border` · `--ml-ink-on-primary`  
**旧 API 兼容**：若 `window.switchTab` 不存在则自动注册兜底（兼容 `.tab-btn` + `.tab-panel`）。

---

## 四、迁移指南

### 4.1 替换 `<ml-toast>`

```diff
- <div id="customToast" class="toast-hidden"></div>
- <script>showCustomToast('保存成功', 'success')</script>
+ <script type="module" src="components/toast.js"></script>
+ <ml-toast id="appToast"></ml-toast>
+ <script>document.getElementById('appToast').success('保存成功')</script>
```

或者保留旧代码自动兼容：

```diff
- <script src="js/old-toast.js"></script>
+ <script type="module" src="components/toast.js"></script>
  <!-- shToast('hi') / toast.show('hi', 'success') 自动可用 -->
```

### 4.2 替换 `<ml-modal>`

```diff
- <div class="modal" id="settingsModal" style="display:none">
-   <div class="modal-overlay"></div>
-   <div class="modal-content">
-     <h2>设置</h2>
-     <p>...</p>
-   </div>
- </div>
+ <ml-modal id="settingsModal" title="设置">
+   <p>...</p>
+ </ml-modal>
```

**或保留旧代码**：引入 modal.js 后，`.modal` / `[id$="Modal"]` 自动升级，旧的 `display='flex'` 仍可工作。

### 4.3 替换 `<ml-tab>`

```diff
- <div class="tabs">
-   <button class="tab-btn active" onclick="switchTab('a')">A</button>
-   <button class="tab-btn" onclick="switchTab('b')">B</button>
- </div>
- <div class="tab-panel active" id="tab-a">内容A</div>
- <div class="tab-panel" id="tab-b">内容B</div>
+ <ml-tab active="0">
+   <ml-tab-pane label="A">内容A</ml-tab-pane>
+   <ml-tab-pane label="B">内容B</ml-tab-pane>
+ </ml-tab>
```

> ⚠️ 对于自定义类名（如 `.kbe-tab`）的非通用情况，需改写为 `.tab-btn` 或自定义 CSS 适配组件内部 class。

---

## 五、迁移执行计划（节点 4~6）

| 节点 | 内容 | 状态 |
|------|------|------|
| 1 | 调研扫描（45 文件 / 12h 总工作量） | ✅ |
| 2 | 抽 3 个 Web Components（toast / modal / tab） | ✅ |
| 3 | demo 页（795 行） + 文档（本文） | ✅ |
| 4 | 业务页面替换（10 个文件 / 21 toast + 21 tab + 3 modal） | 🔵 进行中 |
| 5 | 单元测试（每个组件 ≥3 个用例） | ⏳ |
| 6 | 打包发布（`@mingli-baojian/components` npm 本地包） | ⏳ |

### 5.1 节点 4 - 业务页面替换清单

| 优先级 | 文件 | 旧实现 | 新组件 | 备注 |
|--------|------|--------|--------|------|
| P0 | `divination-integrated.html` | 14 个 `switchTab` + 8 个 panel | `<ml-tab>` | 全站最大消费点 |
| P0 | `wechat-hub.html` | 23 个 modal | `<ml-modal>` | 模态最密集 |
| P1 | `divination-membership.html` | 12 个 modal | `<ml-modal>` | 会员功能页 |
| P1 | `master-class.html` | 7 个 `switchTab` | `<ml-tab>` | 大师课堂 |
| P1 | `kb-explorer.html` | 6 个 `switchTab`（`kbe-tab` 自定义） | 定制 `.tab-btn` 适配 | 自定义类名 |
| P1 | `merchant-dashboard.html` | 5 个 `switchTab` | `<ml-tab>` | 商户看板 |
| P2 | `my-yuanzhu.html` | 2 个 `switchTab` | `<ml-tab>` | 助手页 |
| P2 | `admin-shop.html` | 3 个 `.modal` | `<ml-modal>` | 后台 |
| P2 | `admin.html` | 无 | — | 跳过 |
| P2 | `doctor-elder.html` | 无 | — | 跳过 |

### 5.2 验证清单（每次迁移后必跑）

- [ ] 旧 API（`window.toast.show` / `shToast` / 旧 `switchTab`）仍工作
- [ ] 新组件（`<ml-toast>` / `<ml-modal>` / `<ml-tab>`）正常工作
- [ ] 浏览器无 console error / warning
- [ ] 响应式布局未崩（深色主题色未变）
- [ ] 健康检查通过：`bash .openclaw/tmp/health-check.sh` ✅

---

## 六、设计决策记录（ADR）

### ADR-001：选择 Custom Elements v1 而非 React/Vue

- **决策**：使用原生 Web Components（Custom Elements v1 + Shadow DOM）
- **理由**：
  - 项目零外部依赖目标（避免引入框架运行时）
  - 浏览器原生支持，无需打包（直接 `<script>` 加载即可）
  - Shadow DOM 样式隔离，避免污染全局
  - 旧代码可平滑迁移（polyfill 兼容层）

### ADR-002：保留旧 API（向后兼容）

- **决策**：注入 polyfill 层，旧 API 继续工作
- **理由**：
  - 12 小时迁移成本可压缩到 0（旧页面完全不动也能受益）
  - 避免一次性迁移风险
  - 业务方可渐进升级

### ADR-003：CSS 变量主题化

- **决策**：组件样式通过 CSS 变量（`--ml-bg` / `--ml-ink` / `--ml-primary` 等）暴露
- **理由**：
  - 兼容现有深色主题（divination-hub / pro-panel 已用 CSS 变量）
  - 业务方可注入自己的品牌色
  - 浅色主题预留扩展点

---

## 七、相关文件

| 类型 | 路径 |
|------|------|
| 组件 | `app/components/toast.js` · `app/components/modal.js` · `app/components/tab.js` |
| 演示 | `app/components/demo.html`（含交互式 demo + 事件日志） |
| 规范 | `docs/COMPONENTS.md`（本文） |
| 看板 | `projects/mingli-baojian/KANBAN.md`（任务 #3） |
| 顶层架构 | `projects/mingli-baojian/MECHANISM.md` |

---

## 八、下一步

- **节点 4 立即行动**：先迁移 `divination-integrated.html`（P0 影响最大）
- 准备好脚本：`tools/migrate-component.js`（自动按规范替换模式）
- 验证：浏览器手测 + Lighthouse CI 截图对比

---

## 九、Web Components 基础

### 9.1 什么是 Web Components？

Web Components 是一套浏览器原生标准，由 **3 个子规范** 组成：

| 子规范 | 作用 | API |
|--------|------|-----|
| **Custom Elements** | 自定义 HTML 标签 | `customElements.define()` |
| **Shadow DOM** | 封装内部样式与 DOM | `Element.attachShadow({mode:'open'})` |
| **HTML Templates** | 复用 DOM 模板 | `<template>` / `<slot>` |

### 9.2 customElements.define

```js
// 注册一个自定义元素
class MyEl extends HTMLElement {
  constructor(){ super(); /* ... */ }
  connectedCallback(){ /* 插入到 DOM 时触发 */ }
  attributeChangedCallback(name, oldV, newV){ /* 属性变化 */ }
  static get observedAttributes(){ return ['attr1','attr2']; }
}
customElements.define('my-el', MyEl);

// HTML 中使用
const el = document.createElement('my-el');
document.body.appendChild(el);
// 或者直接 <my-el attr1="x"></my-el>
```

**注意**：自定义元素名称必须包含 **连字符 `-`**（如 `ml-toast` 而非 `mltoast`），避免与未来 HTML 标签冲突。

### 9.3 Shadow DOM

```js
const el = document.querySelector('ml-toast');
const shadow = el.attachShadow({mode:'open'});
shadow.innerHTML = `
  <style>
    :host{ /* 选中宿主元素 */ }
    :host([type="success"]){ /* 响应宿主属性 */ }
    .box{ /* 组件内部样式（不会污染外部） */ }
  </style>
  <div class="box"><slot></slot></div>
`;
```

**核心优势**：
- **样式隔离**：组件内部 CSS 不影响全局，全局 CSS 也不影响组件（除非通过 `:host`）
- **DOM 隔离**：内部元素不参与全局 querySelector
- **主题化**：通过 CSS 自定义属性（`--ml-bg`）穿透 Shadow DOM 边界

**两种模式**：
- `mode:'open'`：外部 JS 可通过 `element.shadowRoot` 访问
- `mode:'closed'`：完全封装（外部不可访问）

本组件库全部采用 `mode:'open'`，便于调试和扩展。

### 9.4 Slot 插槽

```html
<!-- 组件模板 -->
<template>
  <div class="head"><slot name="header"></slot></div>
  <div class="body"><slot></slot></div>  <!-- 默认插槽 -->
</template>

<!-- 使用组件 -->
<ml-card>
  <h1 slot="header">自定义标题</h1>  <!-- 命名插槽 -->
  <p>卡片内容</p>                    <!-- 默认插槽 -->
</ml-card>
```

**监听变化**：
```js
shadow.querySelector('slot').addEventListener('slotchange', e=>{
  const assigned = e.target.assignedNodes({flatten:true});
  console.log('当前插槽内容：', assigned);
});
```

### 9.5 生命周期

| 钩子 | 触发时机 |
|------|----------|
| `constructor()` | 创建实例（必须先调 `super()`） |
| `connectedCallback()` | 首次插入 DOM |
| `disconnectedCallback()` | 从 DOM 移除 |
| `adoptedCallback()` | 移动到新文档（很少用） |
| `attributeChangedCallback()` | observedAttributes 中声明的属性变化 |
| `static get observedAttributes()` | 声明需要监听的属性 |

---

## 十、ml-toast 完整 API

### 10.1 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `type` | `success \| error \| warn \| info` | `info` | 视觉类型（背景色随之变化） |
| `duration` | number (ms) | `2400` | 自动隐藏延时 |
| `position` | `top \| bottom \| center` | `top` | 屏幕位置 |

### 10.2 方法

| 方法 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `show(msg, type?)` | msg:string, type?:string | `this` | 显示提示（type 缺省用现有或 info） |
| `success(msg)` | msg:string | `this` | 绿色成功提示 |
| `error(msg)` | msg:string | `this` | 红色错误提示 |
| `warn(msg)` | msg:string | `this` | 橙色警告提示 |
| `info(msg)` | msg:string | `this` | 蓝色信息提示 |
| `hide()` | — | `this` | 立即隐藏 |

### 10.3 事件

`<ml-toast>` 不主动派发事件，但可通过 `transitionend` 监听 `.show` class 切换。

### 10.4 CSS 变量

```css
:root{
  --ml-bg:        #333;           /* 默认背景（type 不匹配时） */
  --ml-ink:       #fff;           /* 默认文字色 */
  --ml-success:   #10b981;        /* success 背景 */
  --ml-error:     #ef4444;        /* error 背景 */
  --ml-warn:      #f59e0b;        /* warn 背景 */
  --ml-info:      #3b82f6;        /* info 背景 */
}
```

### 10.5 完整示例

```html
<ml-toast id="t" duration="3000" position="top"></ml-toast>

<script type="module">
  import '../js/components-loader.js';
  const t = document.getElementById('t');
  
  // 链式调用
  t.info('正在处理…');
  setTimeout(()=> t.success('完成！'), 1500);
  
  // 通过 window.ml
  ml.toast.error('网络异常');
</script>
```

### 10.6 Slots

`<ml-toast>` 默认插槽可承载富文本消息（图标、加粗等），但常用直接传字符串，更简单。

---

## 十一、ml-modal 完整 API

### 11.1 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `title` | string | — | 标题文本（不设则隐藏标题栏） |
| `open` | `true \| false` | `false` | 是否打开（受控） |
| `size` | `sm \| md \| lg` | `md` | 宽度（420 / 640 / 840 px） |
| `close-on-backdrop` | `true \| false` | `true` | 点击遮罩是否关闭 |

### 11.2 方法

| 方法 | 参数 | 返回 | 说明 |
|------|------|------|------|
| `open()` | — | `this` | 打开弹窗 |
| `close(source?)` | source?:'x'\|'backdrop'\|'escape'\|'api' | `this` | 关闭弹窗（source 会写入 close 事件 detail） |

### 11.3 事件

| 事件 | detail | 触发时机 |
|------|--------|----------|
| `open` | `{}` | 弹窗打开后 |
| `close` | `{source: string}` | 弹窗关闭后 |

```js
const m = document.getElementById('myModal');
m.addEventListener('close', e=>{
  console.log('关闭来源：', e.detail.source); // 'x' / 'backdrop' / 'escape' / 'api'
});
```

### 11.4 CSS 变量

```css
:root{
  --ml-bg:        rgba(0,0,0,.6);   /* 遮罩背景 */
  --ml-panel:     #16213e;          /* 面板背景 */
  --ml-ink:       #eee;             /* 文字颜色 */
  --ml-border:    rgba(201,168,76,.2); /* 边框色 */
}
```

### 11.5 Slots

- 默认插槽：弹窗主体内容
- 无具名插槽（标题通过 `title` 属性设置）

### 11.6 完整示例

```html
<ml-modal id="confirmModal" title="确认操作" size="sm">
  <p>确定要删除这条命例吗？</p>
  <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">
    <button onclick="document.getElementById('confirmModal').close()">取消</button>
    <button class="btn-primary" onclick="onConfirm()">确认删除</button>
  </div>
</ml-modal>

<script type="module">
  import '../js/components-loader.js';
  
  // 打开
  document.getElementById('confirmModal').open();
  
  // 或者 Promise 风格
  const ok = await ml.modal.confirm({
    title:'删除命例',
    message:'此操作不可撤销',
  });
  if (ok) doDelete();
</script>
```

### 11.7 关闭交互汇总

| 触发 | 触发条件 | 事件 detail.source |
|------|----------|---------------------|
| 点击 ✕ 按钮 | 始终可触发 | `'x'` |
| 点击遮罩 | `close-on-backdrop` ≠ `'false'` | `'backdrop'` |
| 按 ESC 键 | 弹窗打开时 | `'escape'` |
| 调用 `m.close(s)` | 始终 | `s \|\| 'api'` |
| 调用 `m.setAttribute('open','false')` | 始终 | `'api'` |

---

## 十二、通用组件清单（节点 3.4 新增）

### 12.1 `<ml-tab>` / `<ml-tab-pane>`

| 属性 | 宿主 | 类型 | 默认 | 说明 |
|------|------|------|------|------|
| `active` | ml-tab | number | `0` | 当前激活索引 |
| `position` | ml-tab | `top \| bottom` | `top` | 标签栏位置 |
| `align` | ml-tab | `left \| center \| right` | `left` | 标签栏对齐 |
| `label` | ml-tab-pane | string | — | 按钮文字（必填） |
| `icon` | ml-tab-pane | emoji | — | 图标前缀 |
| `disabled` | ml-tab-pane | boolean | `false` | 禁用 |

**方法**：`setActive(index)` · getter `activeIndex`

**事件**：`tab-change` · `{detail:{index, label, prevIndex}}`

### 12.2 `<ml-card>`（节点 3.4 新增）

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `title` | string | — | 卡片标题 |
| `subtitle` | string | — | 副标题 |
| `variant` | `flat \| elevated \| glass \| outlined` | `elevated` | 视觉变体 |
| `clickable` | boolean | `false` | 是否可点击（hover 高亮） |
| `color` | `gold \| success \| error \| warn \| info` | — | 左侧色条颜色 |

**Slots**：
- `default`：主内容
- `name="title"`：自定义标题（覆盖 title 属性）
- `name="subtitle"`：自定义副标题
- `name="footer"`：底部操作区
- `name="media"`：顶部媒体（图/视频）

**事件**：`card-click` · `{detail:{}}`（仅 `clickable="true"` 时触发）

**CSS 变量**：`--ml-bg`、`--ml-panel`、`--ml-ink`、`--ml-muted`、`--ml-border`、`--ml-primary`、`--ml-radius`、`--ml-shadow`、`--ml-accent`

### 12.3 `<ml-accordion>` / `<ml-accordion-item>`（节点 3.4 新增）

| 属性 | 宿主 | 类型 | 默认 | 说明 |
|------|------|------|------|------|
| `multiple` | ml-accordion | boolean | `false` | 是否多开 |
| `title` | ml-accordion-item | string | — | 标题（必填） |
| `icon` | ml-accordion-item | emoji | — | 标题前缀 |
| `open` | ml-accordion-item | boolean | `false` | 默认展开 |
| `disabled` | ml-accordion-item | boolean | `false` | 禁用 |

**方法**（ml-accordion）：
- `openAll()`：展开所有（跳过 disabled）
- `closeAll()`：收起所有

**事件**：`item-toggle` · `{detail:{index, open, title, source:'user'|'api'}}`

### 12.4 组件清单总览

| 组件 | 文件 | 注册状态 | 编程入口 |
|------|------|----------|----------|
| `<ml-toast>` | `app/components/toast.js` | ✅ | `ml.toast.*` |
| `<ml-modal>` | `app/components/modal.js` | ✅ | `ml.modal.*` |
| `<ml-tab>` / `<ml-tab-pane>` | `app/components/tab.js` | ✅ | `ml.tab.*` |
| `<ml-card>` | `app/components/card.js`（v2 新增） | ✅ | `ml.card.create()` |
| `<ml-accordion>` / `<ml-accordion-item>` | `app/components/accordion.js`（v2 新增） | ✅ | `ml.accordion.*` |

---

## 十三、迁移指南（jQuery / vanilla → Web Component）

### 13.1 替换前的诊断清单

扫描现有 HTML/JS 文件，找出以下模式：

| 模式 | 出现频率 | 新组件 |
|------|----------|--------|
| `setTimeout(()=>{el.className='toast'}, 2400)` | 21 | `<ml-toast>` |
| `.tab-btn.active + .tab-panel.active` + `switchTab()` | 21 | `<ml-tab>` |
| `<div class="modal" style="display:none">` + `display='flex'` | 3 | `<ml-modal>` |
| `<details>` + `<summary>` | 0 | `<ml-accordion>`（自带样式统一） |
| `<div class="card">` 大量重复 | N | `<ml-card>` |

### 13.2 替换原则

1. **优先替换 4 个高频组件**：toast / modal / tab / accordion
2. **保留业务逻辑**：不要在迁移中改变交互行为
3. **利用旧 API 兼容层**：先引入新组件 JS，老代码不动也能跑
4. **渐进式升级**：逐文件迁移，避免一次性大改

### 13.3 jQuery → Web Component

```diff
- // jQuery 写法
- $('.toast').text('保存成功').fadeIn(200);
- setTimeout(()=> $('.toast').fadeOut(200), 2400);
+ // Web Component 写法
+ ml.toast.success('保存成功');
```

```diff
- // jQuery tab
- $('.tab-btn').removeClass('active');
- $('.tab-panel').removeClass('active');
- $(this).addClass('active');
- $('#tab-' + name).addClass('active');
+ // Web Component tab
+ <ml-tab-pane label="...">...</ml-tab-pane>
+ // 内置点击切换
```

### 13.4 Vanilla JS → Web Component

```diff
- // vanilla 弹窗
- const m = document.getElementById('myModal');
- m.style.display = 'flex';
- m.querySelector('.close-btn').onclick = ()=> m.style.display = 'none';
+ // Web Component 弹窗
+ <ml-modal id="myModal" title="...">...</ml-modal>
+ document.getElementById('myModal').open();
+ document.getElementById('myModal').close();
```

### 13.5 一次性自动迁移脚本

```bash
# 1. 在目标页面顶部引入 loader（一次性）
node tools/insert-loader.js app/divination-integrated.html

# 2. 把 21 处 toast 代码替换为 ml.toast
node tools/migrate-toast.js app/divination-integrated.html

# 3. 把 switchTab() 替换为 ml.tab.setActive
node tools/migrate-tab.js app/divination-integrated.html
```

详见 `tools/migrate-component.js`（节点 4+ 开发）。

### 13.6 常见陷阱

| 陷阱 | 解决方案 |
|------|----------|
| 自定义类名（如 `.kbe-tab`） | 改写为 `.tab-btn`，或自定义 CSS 适配组件内部 |
| 同一页面多个 toast 实例 | 默认 loader 已 `_ensure()` 单例，无需手动管理 |
| Modal 嵌套 | 不推荐；如需，可手动 `z-index` 调整 |
| Slot 透传不上 | 检查 `<slot name="...">` 是否对应 `<element slot="...">` |
| Shadow DOM 样式被全局污染 | 使用 `:host` 选择器，并通过 CSS 变量穿透 |

---

## 十四、CSS Token 系统

### 14.1 设计原则

- **统一前缀**：所有组件 CSS 变量以 `--ml-` 开头
- **语义命名**：变量名表达用途而非颜色（如 `--ml-primary` 而非 `--ml-gold`）
- **优雅降级**：组件内部用 `var(--ml-bg, #333)` 形式提供默认值

### 14.2 Color（颜色）

| 变量 | 浅色默认值 | 深色默认值 | 用途 |
|------|------------|------------|------|
| `--ml-bg` | `rgba(0,0,0,.6)` | 同 | 遮罩/默认背景 |
| `--ml-panel` | `#fff` | `#16213e` | 面板背景 |
| `--ml-ink` | `#1f1f1f` | `#eee` | 主要文字 |
| `--ml-muted` | `#6b7280` | `#8a8a9a` | 次要文字 |
| `--ml-border` | `#e5e5e5` | `rgba(201,168,76,.2)` | 边框 |
| `--ml-primary` | `#c9a84c` | `#c9a84c` | 主题色（金） |
| `--ml-ink-on-primary` | `#fff` | `#1a1a2e` | 主题色上文字 |
| `--ml-success` | `#10b981` | `#10b981` | 成功 |
| `--ml-error` | `#ef4444` | `#ef4444` | 错误 |
| `--ml-warn` | `#f59e0b` | `#f59e0b` | 警告 |
| `--ml-info` | `#3b82f6` | `#3b82f6` | 信息 |
| `--ml-accent` | `--ml-primary` | `--ml-primary` | 强调色条 |

### 14.3 Spacing（间距）

| 变量 | 值 | 用途 |
|------|----|------|
| `--ml-radius` | `14px` | 卡片/弹窗圆角 |
| `--ml-radius-sm` | `8px` | 按钮/输入框圆角 |
| `--ml-pad-md` | `20px 24px` | 卡片内边距 |
| `--ml-gap` | `10px` | 按钮组间距 |

### 14.4 Typography（字体）

```css
font-family: -apple-system, "PingFang SC", "Noto Serif SC", serif;
font-size: 14px; /* base */
line-height: 1.7;
```

| 层级 | 大小 | 字重 |
|------|------|------|
| 标题（H2） | 18px | 600 |
| 卡片标题 | 16px | 600 |
| 正文 | 14px | 400 |
| 辅助 | 13px | 400 |
| 标签/小字 | 12px | 400 |

### 14.5 Radius（圆角）

| 变量 | 值 | 用途 |
|------|----|------|
| `--ml-radius-lg` | `14px` | 卡片/弹窗 |
| `--ml-radius-md` | `10px` | 按钮/输入框 |
| `--ml-radius-sm` | `6px` | 小标签 |

### 14.6 Shadow（阴影）

| 变量 | 值 | 用途 |
|------|----|------|
| `--ml-shadow` | `0 4px 16px rgba(0,0,0,.18)` | 卡片默认 |
| `--ml-shadow-lg` | `0 24px 64px rgba(0,0,0,.4)` | 弹窗 |

### 14.7 自定义主题示例

```css
/* 深色金主题（默认） */
:root{
  --ml-bg:#1a1a2e;
  --ml-panel:#16213e;
  --ml-primary:#c9a84c;
  --ml-ink:#eee;
}

/* 浅色蓝主题 */
:root{
  --ml-bg:#fff;
  --ml-panel:#f9fafb;
  --ml-primary:#3b82f6;
  --ml-ink:#1f2937;
  --ml-border:rgba(0,0,0,.08);
}
```

只需在 `:root` 重新声明，全站组件自动适配。

---

## 十五、测试方法

### 15.1 vitest + happy-dom 单元测试

```bash
npm install --save-dev vitest happy-dom @web/test-runner
```

#### toast.test.js

```js
import { describe, it, expect, beforeEach } from 'vitest';
import '../components/toast.js';

describe('<ml-toast>', ()=>{
  let el;
  beforeEach(()=>{
    document.body.innerHTML = '<ml-toast></ml-toast>';
    el = document.querySelector('ml-toast');
  });
  it('should register custom element', ()=>{
    expect(customElements.get('ml-toast')).toBeDefined();
  });
  it('should show and hide on success()', async ()=>{
    el.success('test');
    expect(el.classList.contains('show')).toBe(true);
    await new Promise(r=> setTimeout(r, 2500));
    expect(el.classList.contains('show')).toBe(false);
  });
  it('should respect type attribute', ()=>{
    el.setAttribute('type', 'error');
    el.error('oops');
    expect(el.getAttribute('type')).toBe('error');
  });
});
```

#### modal.test.js

```js
import '../components/modal.js';

describe('<ml-modal>', ()=>{
  let el;
  beforeEach(()=>{
    document.body.innerHTML = '<ml-modal title="Test">body</ml-modal>';
    el = document.querySelector('ml-modal');
  });
  it('should open() and close()', ()=>{
    el.open();
    expect(el.getAttribute('open')).toBe('true');
    el.close('x');
    expect(el.getAttribute('open')).toBe('false');
  });
  it('should emit close event with source', ()=>{
    const spy = vi.fn();
    el.addEventListener('close', spy);
    el.close('backdrop');
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({detail:{source:'backdrop'}})
    );
  });
});
```

#### card.test.js

```js
import '../components/card.js';

describe('<ml-card>', ()=>{
  it('should render title from attribute', ()=>{
    document.body.innerHTML = '<ml-card title="Hello">body</ml-card>';
    const el = document.querySelector('ml-card');
    expect(el.title).toBe('Hello');
  });
  it('should emit card-click when clickable', ()=>{
    document.body.innerHTML = '<ml-card clickable="true">x</ml-card>';
    const el = document.querySelector('ml-card');
    const spy = vi.fn();
    el.addEventListener('card-click', spy);
    el.shadowRoot.querySelector('.card').click();
    expect(spy).toHaveBeenCalled();
  });
});
```

### 15.2 E2E 测试（Playwright）

```js
import { test, expect } from '@playwright/test';

test('demo page renders all components', async ({ page })=>{
  await page.goto('http://localhost:8900/app/components-demo.html');
  await expect(page.locator('ml-toast')).toBeAttached();
  await expect(page.locator('ml-modal')).toHaveCount(2);
  await expect(page.locator('ml-tab')).toHaveCount(1);
  await expect(page.locator('ml-card')).toHaveCount(6);
  await expect(page.locator('ml-accordion')).toHaveCount(2);
});

test('toast success button works', async ({ page })=>{
  await page.goto('http://localhost:8900/app/components-demo.html');
  await page.click('[data-toast="success"]');
  await expect(page.locator('ml-toast.show')).toBeVisible();
});

test('modal open/close cycle', async ({ page })=>{
  await page.goto('http://localhost:8900/app/components-demo.html');
  await page.click('#btn-open-basic');
  await expect(page.locator('#modalBasic')).toHaveAttribute('open','true');
  await page.click('#modalBasic >> .x');
  await expect(page.locator('#modalBasic')).toHaveAttribute('open','false');
});
```

### 15.3 手动验证清单

- [ ] 打开 `app/components-demo.html`
- [ ] 点击 4 个 toast 按钮，看到顶部弹出 4 种颜色提示
- [ ] 点击 3 个 modal 按钮，分别弹出基础/表单/确认对话框
- [ ] 表单提交后看到 success toast
- [ ] 切换 3 个 tab，内容随之切换
- [ ] 点击 clickable 卡片，触发 card-click 事件
- [ ] 展开/收起 accordion item
- [ ] 点击"全部展开/收起"，多开模式生效
- [ ] 检查 Console：无 error/warning
- [ ] 检查 Network：5 个组件 JS 都 200 OK

### 15.4 健康检查脚本

```bash
# 8914 端口 curl 测试
curl -sI http://localhost:8914/components-demo.html | head -3

# HTML 标签平衡校验（grep 计数 <ml- 与 </ml-）
node tests/check-tags.js app/components-demo.html
```

---

## 十六、完整文件清单（节点 3.4 落地）

| 类型 | 路径 | 行数 | 说明 |
|------|------|------|------|
| 组件 | `app/components/toast.js` | 153 | v1 已完成 |
| 组件 | `app/components/modal.js` | 195 | v1 已完成 |
| 组件 | `app/components/tab.js` | 198 | v1 已完成 |
| 组件 | `app/components/card.js` | ~220 | v2 新增 |
| 组件 | `app/components/accordion.js` | ~190 | v2 新增 |
| 加载器 | `app/js/components-loader.js` | ~180 | v2 新增 |
| 演示页 v1 | `app/components/demo.html` | 795 | 旧版，仍保留 |
| 演示页 v2 | `app/components-demo.html` | ~430 | 新版，5 组件齐发 |
| 文档 | `docs/COMPONENTS.md`（本文） | — | 已扩展 7 章节 |
| 单元测试 | `tests/components/*.test.js` | — | 节点 5 待办 |

---

_本文档随组件库版本演进更新；最后更新：2026-07-25（节点 3.4 完成 v2 扩展）_
