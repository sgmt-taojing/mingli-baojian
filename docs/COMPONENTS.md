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

_本文档随组件库版本演进更新；最后更新：2026-07-24_
