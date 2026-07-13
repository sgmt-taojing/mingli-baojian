# 函数覆盖冲突审计报告

**审计子代理**: subagent_01  
**日期**: 2026-07-13  
**项目**: mingli-baojian (命理宝鉴)  
**文件**: `app/divination-hub.html` (37511行) + `app/js/divination-core.js` (38022行)  

---

## 执行摘要

`divination-core.js` 在 `divination-hub.html` 第34156行加载，**共覆盖 272 个同名函数**。其中关键冲突函数可按严重程度分为三类：

| 严重度 | 函数 | 问题 |
|--------|------|------|
| 🔴 严重 | `yjStart` | core.js 使用 `yjQixinTime` 字段，hub.html 只有 `yjQixinDate`+`yjQixinHour` → 事盘模式完全失效 |
| 🟡 中等 | `runQimen/runZiwei/runMeihua/runLiuren` + `computeQimen/computeZiWei/computeMeiHua/computeLiuRen` | core.js 版本读取不同表单字段(qm* vs qimen-*)，覆盖了 hub.html 简易版 |
| 🟢 良性 | `playDivinationSound` | core.js 增加了 try-catch 保护 |
| ⚪ 无覆盖 | `showSection`, `computeBazi`, `initAlmanac` 等 | 仅存在于 hub.html，core.js 未覆盖 |

**关键发现**: `showSection` 和 `computeBazi` **并未被 core.js 覆盖**——它们仅存在于 hub.html 中。导航和排盘功能失效的原因不是 showSection 被覆盖，而是其他排盘函数（runQimen 等）的覆盖导致字段不匹配。

---

## 1. showSection 函数对比

### 结论: ✅ 无覆盖，hub.html 版本生效

| 项目 | hub.html (行14962) | core.js |
|------|-------------------|---------|
| 是否定义 | ✅ `function showSection(name)` | ❌ 未定义 |

`core.js` 中搜索 `function showSection` 返回 **0 个结果**。之前误报源于 grep 同时搜索两个文件。

### showSection 的包装链

虽然 core.js 未定义 showSection，但它对 showSection 做了**包装**：

```
执行顺序:
1. [hub.html L14962] 定义 function showSection(name) { ... }
   - 处理 zhanbu 复合板块 (yijing/meihua/qimen/liuren/ziwei/cezi)
   - 处理 xingming 复合板块 (rename/company/mobile/**analyze**)
   - 文本匹配: '起名'(rename), '公司'(company), '手机'(mobile), '姓名分析'(analyze)
   - 处理 luopan 复合板块
   - 处理普通板块 + 滚动

2. [hub.html L26701-26706] jiuri 懒加载包装
   const jiuriOrigShowSection = window.showSection;
   window.showSection = function(name) { jiuriOrigShowSection(name); ... jiuriInit ... }

3. [hub.html L26711] ⚠️ 解包 jiuri!
   try { window.showSection = showSection; } catch(e) {}
   → 这行代码将 window.showSection 重置回原始函数声明，撤销了 jiuri 包装
   → jiuri 懒加载失效（但 L26717 有 fallback: load 事件触发 jiuriInit）

4. [core.js L34156] 加载 core.js
   → 不定义 showSection，不覆盖

5. [core.js L26561-26563 DOMContentLoaded] autoFill 包装
   _origShowSectionWrap = window.showSection;
   window.showSection = function(name) {
     _origShowSectionWrap(name);
     setTimeout(() => { injectAutoFillButtons(); renderUserBaziCard(); autoFillUserBazi(...); }, 500);
   };
```

**最终生效版本**: hub.html 原始 showSection + autoFill 包装。  
**jiuri 懒加载**: 被 L26711 解包，但有 load 事件 fallback，不影响功能。

### showSection 中的 analyze 子标签处理

hub.html 版本正确处理了 `analyze` 子标签：
```js
if (['rename','company','mobile','analyze'].includes(name)) {  // ✅ 包含 analyze
  // 文本匹配: name === 'rename' ? '起名' : ... '姓名分析'  // ✅ 起名
}
```

由于 core.js 未覆盖 showSection，此逻辑正常工作。

---

## 2. computeBazi 函数对比

### 结论: ✅ 无覆盖，hub.html 版本生效

| 项目 | hub.html (行16352) | core.js |
|------|-------------------|---------|
| 是否定义 | ✅ `function computeBazi()` | ❌ 未定义 `function computeBazi()` |
| 相关函数 | - | `_computeBaziImpl()` (行3793) — **死代码** |

### 问题: core.js 的 `_computeBaziImpl` 是死代码

`core.js` 在行3793定义了 `function _computeBaziImpl()`，这是 computeBazi 的**增强版**，额外支持：
- 出生地/居住地经度自动推算 (`baziBirthplace`, `baziResidence`)
- 长生十二宫显示 (`getDishi`)
- 出城市/现居城市保存到 localStorage
- 错误捕获包装

**但 hub.html 的 `computeBazi` 从未调用 `_computeBaziImpl`**，且 `core.js` 没有定义 `computeBazi` 包装器来委托到 `_computeBaziImpl`。

`core.js` L25656: `try { window.computeBazi = computeBazi; } catch(e){}` — 这行只是将 hub.html 的 computeBazi 重新赋值给 window，无实际效果。

`core.js` L33234: 包装了 `window._computeBaziImpl` 用于注入可视化盘面 — 但由于没人调用 `_computeBaziImpl`，这个包装器从未触发。

### 影响

- hub.html 版 computeBazi 正常工作，但**缺少** core.js 增强版的功能：
  - 无长生十二宫
  - 无出生地自动推算经度
  - 无出生地/居住地信息保存
  - 无错误捕获
- 可视化盘面注入(`renderBaziChart`)从未执行

### 修复方案

**方案 A (推荐)**: 在 core.js 中添加 computeBazi 包装器，委托到 _computeBaziImpl：

```js
// 在 core.js _computeBaziImpl 定义之后添加
function computeBazi() {
  try {
    return _computeBaziImpl();
  } catch(e) {
    console.error('[八字排盘错误]', e.message, e.stack);
    // 错误渲染...
  }
}
```

但这需要验证 _computeBaziImpl 中的 DOM ID 与 hub.html 一致。

**方案 B**: 删除 core.js 中的 _computeBaziImpl，统一使用 hub.html 版本。将增强功能（长生十二宫等）直接合并到 hub.html 的 computeBazi 中。

---

## 3. 被覆盖的关键函数对比

### 3.1 🔴 yjStart (六爻起卦) — 严重冲突

| 项目 | hub.html (行19129) | core.js (行7185) |
|------|-------------------|------------------|
| 起心动念字段 | `yjQixinDate` + `yjQixinHour` (两个独立字段) | `yjQixinTime` (单个 datetime-local 字段) |
| 显示/隐藏行 | 无（始终显示） | `yjQixinRow` 元素控制 |
| 错误处理 | 无 | try-catch 包装 + _yjStartImpl 模式 |

**冲突详情**:

1. **字段不匹配**: HTML 中存在 `yjQixinDate` 和 `yjQixinHour`，但**不存在** `yjQixinTime` 和 `yjQixinRow`。
2. **事盘模式失效**: core.js 的 yjStart 在 matter 模式下检查 `yjQixinTime`，由于该字段不存在，`qxTime = ''`，直接弹出 alert 并 return → **事盘占卜完全无法使用**。
3. **人盘模式正常**: person 模式不依赖这些字段，可以正常工作。

**修复方案**: 保留 hub.html 版本（删除 core.js 中的 yjStart 和 _yjStartImpl），或在 HTML 中添加 `yjQixinTime` 和 `yjQixinRow` 元素。

### 3.2 🟡 runQimen / computeQimen (奇门遁甲) — 中等冲突

| 项目 | hub.html | core.js |
|------|----------|---------|
| runQimen (行号) | L37027 — 读取 `qimen-year/month/day/hour/ju` | L14 — `function runQimen(){ computeQimen(); }` |
| computeQimen (行号) | L19646 — 简易版 | L7744 — 完整版 |
| 表单字段 | `qimen-year`, `qimen-month`, `qimen-day`, `qimen-hour`, `qimen-ju` | `qmName`, `qmDate`, `qmHour`, `qmDun` |
| 渲染目标 | `qimenResult` | `qmResult`, `qmInterp` |
| 功能 | 基础排盘 + 简单分析 | 完整排盘 + 四柱 + 详细分析 + 化解方案 + 格局分析 |

**冲突详情**:

HTML 中**同时存在两套字段**（`qm*` 和 `qimen-*`），对应两套不同的 UI：
- `qm*` 字段在"引擎"按钮区域（调用 `runQimenEngine()`）
- `qimen-*` 字段在"排盘演局"按钮区域（调用 `runQimen()`）

core.js 覆盖了 runQimen，使其调用 `computeQimen()`（core.js 完整版），读取 `qm*` 字段。但 `qimen-*` 字段的"排盘演局"按钮现在也调用了 core.js 的 `runQimen()` → `computeQimen()`，会读取空的 `qm*` 字段。

**实际影响**: 用户如果通过 `qimen-*` 字段输入数据后点击"排盘演局"，core.js 的 computeQizen 会读取 `qm*` 字段（可能为空），导致排盘失败或使用默认值。

**修复方案**: 
- 方案 A: 将 `qimen-*` 字段的 onclick 改为调用 hub.html 版本的逻辑（需要重命名函数）
- 方案 B: 在 core.js computeQimen 中同时支持 `qm*` 和 `qimen-*` 字段
- 方案 C: 统一使用 core.js 版本，删除 HTML 中的 `qimen-*` 字段

### 3.3 🟡 runZiwei / computeZiWei (紫微斗数) — 中等冲突

与奇门类似：hub.html 简易版 vs core.js 完整版，字段 ID 不同。

### 3.4 🟡 runMeihua / computeMeiHua (梅花易数) — 中等冲突

与奇门类似：hub.html 简易版 vs core.js 完整版，字段 ID 不同。

### 3.5 🟡 runLiuren / computeLiuRen (大六壬) — 中等冲突

与奇门类似：hub.html 简易版 vs core.js 完整版，字段 ID 不同。

### 3.6 🟡 yjCast (六爻掷卦) — 轻微差异

| 项目 | hub.html (行19175) | core.js (行7226) |
|------|-------------------|------------------|
| 随机种子 | `(Date.now() + yjLine*7) % 1000` | `Date.now() + i*7919) % 100` |
| 功能 | 完全相同 | 完全相同 |

覆盖是良性的，仅随机数生成算法略有不同。

### 3.7 🟢 playDivinationSound — 良性覆盖

| 项目 | hub.html (行3364) | core.js (行9) |
|------|-------------------|---------------|
| 实现 | `function playDivinationSound(){ playSound('success'); }` | `function playDivinationSound(){ try{if(typeof playSound==='function')playSound('success');}catch(e){} }` |

core.js 版本增加了 try-catch 保护，更安全。**无需修复**。

### 3.8 ⚪ 未被覆盖的关键函数

以下函数仅存在于 hub.html，core.js 未覆盖：

| 函数 | hub.html 行号 | 说明 |
|------|-------------|------|
| `showSection` | 14962 | 导航核心函数，正常工作 |
| `computeBazi` | 16352 | 八字排盘，正常工作（但缺少 core.js 增强功能） |
| `showZhanbuSub` | 15039 | 占卜子导航 |
| `showXingmingSub` | 15055 | 姓名子导航（包含 analyze 子标签） |
| `showFengshuiSub` | 15080 | 风水子导航 |
| `initCompositeSections` | 15134 | 复合板块初始化 |
| `toggleMore` | 15193 | 更多菜单展开 |
| `closeMore` | 15207 | 更多菜单关闭 |
| `showMoreModule` | 15219 | 更多板块切换 |
| `initAlmanac` | 15615 | 黄历初始化 |
| `bindBazi` | 32967 | 缘主绑定 |
| `playSound` | 3327 | 音效播放 |

---

## 4. core.js 独立初始化逻辑

### DOMContentLoaded 监听器

core.js 共注册了 **12 个 DOMContentLoaded 监听器**：

| 行号 | 功能 | 是否修改DOM |
|------|------|------------|
| 11645 | `initCompositeSections()` (hub.html 也有同名函数!) | ✅ 移动子板块内容 |
| 11648 | URL hash 导航 | ❌ 仅切换 |
| 11700 | 渲染六十四卦网格 + 日期默认值 + 每日智慧 | ✅ 渲染卦网格 |
| 12902 | (需进一步检查) | ? |
| 13151 | `initUserCenter()` | ✅ 注入用户中心 |
| 25994 | `injectAutoFillButtons()` + `renderUserBaziCard()` | ✅ 注入按钮 |
| 26003 | showSection autoFill 包装 | ❌ 仅包装函数 |
| 32221 | (需进一步检查) | ? |
| 33318 | 重建更多菜单分类 | ✅ 修改菜单 |
| 36092 | 日期输入框默认值 | ✅ 设置 input.value |

### 冲突: initCompositeSections 重复注册

**hub.html L20643**: `document.addEventListener('DOMContentLoaded', initCompositeSections);`  
**core.js L11645**: `document.addEventListener('DOMContentLoaded', initCompositeSections);`

`initCompositeSections` 仅在 hub.html 中定义。两个文件都注册了同一个函数到 DOMContentLoaded，导致**该函数执行两次**。

**影响**: 函数会将 section 子板块内容移动到复合板块容器中。执行两次时，第二次执行时子板块已经被移空，`children` 为空，不会重复移动。**实际无害**，但浪费性能。

### core.js 的 DOM 修改

1. **injectAutoFillButtons()** — 在各排盘区域注入"自动填充"按钮
2. **renderUserBaziCard()** — 渲染缘主信息卡片
3. **renderYijingGuaGrid()** — 渲染六十四卦网格
4. **日期输入框默认值** — 设置所有 `input[type="date"]` 的值为今天

这些修改在 DOMContentLoaded 后 500ms 延迟执行，不会阻塞页面渲染。

---

## 5. hub.html 中未被覆盖的函数分析

### bindBazi (行32967)

```js
function bindBazi() {
  // 读取 bindYear/bindMonth/bindDay/bindHour
  // 保存到 localStorage('userBaziBirth')
  showSection('bazi');
  setTimeout(() => {
    // 设置 birthYear/birthMonth/birthDay/birthHour
    if (typeof computeBazi === 'function') computeBazi();
  }, 300);
}
```

**分析**: 调用 `showSection('bazi')` 和 `computeBazi()`，两者都是 hub.html 版本，正常工作。  
**注意**: bindBazi 设置的字段 ID (`birthYear` 等) 与 computeBazi 读取的字段 ID (`baziDate`) 不同，可能存在不匹配。

### playSound (行3327)

仅存在于 hub.html，未被覆盖。被 hub.html 的 `playDivinationSound` 调用。  
core.js 的 `playDivinationSound` 通过 `typeof playSound === 'function'` 安全调用。  
**正常工作**。

---

## 6. 完整冲突清单与修复方案

### 🔴 严重冲突 (必须修复)

#### 6.1 yjStart — 事盘模式失效

**原因**: core.js 使用 `yjQixinTime` 字段，HTML 中不存在  
**修复**: **删除 core.js 中的 yjStart 和 _yjStartImpl**，让 hub.html 版本生效

```diff
// core.js 删除以下代码:
- function yjStart(mode) {
-  try { return _yjStartImpl(mode); } catch(e) { ... }
- }
- function _yjStartImpl(mode) { ... }
```

### 🟡 中等冲突 (建议修复)

#### 6.2 runQimen + computeQimen — 双重表单字段冲突

**原因**: core.js 的 computeQimen 读取 `qm*` 字段，hub.html 的"排盘演局"按钮传入 `qimen-*` 字段  
**修复**: **在 core.js computeQimen 中添加 qimen-* 字段兼容读取**

```js
// 在 computeQimen 开头添加兼容逻辑:
var dateStr = document.getElementById('qmDate').value;
if (!dateStr) {
  // 兼容 qimen-* 字段
  var qy = document.getElementById('qimen-year')?.value;
  var qm = document.getElementById('qimen-month')?.value;
  var qd = document.getElementById('qimen-day')?.value;
  if (qy && qm && qd) {
    dateStr = qy + '-' + String(qm).padStart(2,'0') + '-' + String(qd).padStart(2,'0');
  }
}
// 类似处理 hour, dun 等
```

#### 6.3 runZiwei + computeZiWei — 同上

**修复**: 同 6.2，添加 `ziwei-*` 字段兼容

#### 6.4 runMeihua + computeMeiHua — 同上

**修复**: 同 6.2，添加 `meihua-*` 字段兼容

#### 6.5 runLiuren + computeLiuRen — 同上

**修复**: 同 6.2，添加 `liuren-*` 字段兼容

#### 6.6 computeBazi 增强功能未生效

**原因**: core.js 的 `_computeBaziImpl` 从未被调用  
**修复**: 在 core.js 中添加 computeBazi 包装器

```js
// core.js 中添加:
function computeBazi() {
  try { return _computeBaziImpl(); }
  catch(e) { console.error('[八字排盘错误]', e); /* 错误渲染 */ }
}
```

**但需先验证**: _computeBaziImpl 中的 DOM ID 与 hub.html 一致（已验证大部分一致，额外字段 `baziBirthplace`/`baziResidence` 也存在于 HTML 中）。

### 🟢 良性覆盖 (无需修复)

#### 6.7 playDivinationSound — 安全覆盖

core.js 版本增加了 try-catch，更安全。无需修复。

#### 6.8 yjCast — 随机种子差异

功能完全相同，仅随机种子算法略有不同。无需修复。

### ⚪ 无覆盖 (无需修复)

#### 6.9 showSection — 未被覆盖

hub.html 版本正常生效。包含 analyze 子标签处理和 '起名' 文本匹配。

#### 6.10 initCompositeSections — 重复注册但无害

函数执行两次，但第二次无副作用。

---

## 7. 总结

### 导致功能失效的根本原因

1. **事盘占卜失效**: core.js 的 `yjStart` 覆盖了 hub.html 版本，使用了不存在的 `yjQixinTime` 字段
2. **排盘双重字段问题**: core.js 的 computeQimen/computeZiWei 等读取 `qm*` 字段，但 HTML 中部分按钮调用 `qimen-*` 字段
3. **computeBazi 增强功能未生效**: `_computeBaziImpl` 是死代码，从未被调用
4. **可视化盘面注入未生效**: 依赖于 `_computeBaziImpl` 的包装，但该函数从未被调用

### 修复优先级

| 优先级 | 修复项 | 预期效果 |
|--------|--------|---------|
| P0 | 删除 core.js 中的 yjStart/_yjStartImpl | 恢复事盘占卜功能 |
| P1 | 添加 computeBazi 包装器委托到 _computeBaziImpl | 启用八字增强功能+可视化盘面 |
| P2 | 在 computeQimen/ZiWei/MeiHua/LiuRen 中添加字段兼容 | 修复双表单字段不匹配 |
| P3 | 移除 initCompositeSections 重复注册 | 性能优化 |
