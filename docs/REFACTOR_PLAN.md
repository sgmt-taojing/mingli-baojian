# 命理宝鉴 · 架构重构计划

**日期**：2026-07-13
**目标**：解决 2.39MB 单体 HTML 导致 PC/移动/微信三端功能不可用问题

---

## 一、当前问题诊断

### 1.1 架构问题
| 问题 | 影响 |
|---|---|
| divination-hub.html 2.39MB 单文件 | 移动端加载 50s+，外网体验极差 |
| divination-core.js 2.26MB 覆盖 hub.html 函数 | 14 个关键函数被覆盖，可能与 HTML 不兼容 |
| 55 个外部 JS 文件总计 9.89MB | window.load 事件延迟，loading-overlay 遮罩 |
| const 重复声明（已修复但根因仍在） | 脚本块失败风险 |

### 1.2 功能问题
| 问题 | 影响 |
|---|---|
| core.js showSection 覆盖 hub.html showSection | 导航逻辑可能与 HTML 结构不匹配 |
| computeBazi 被覆盖 | 排盘结果渲染可能失败 |
| 14 个函数被 core.js 覆盖 | 所有依赖这些函数的功能可能失效 |

### 1.3 微信适配问题
| 问题 | 影响 |
|---|---|
| 无微信 JSSDK 集成 | 无法使用微信分享、支付等原生能力 |
| 无微信内嵌浏览器检测和适配 | 微信内置浏览器行为与普通浏览器不同 |
| 页面 2.39MB | 微信内嵌浏览器加载更慢 |

---

## 二、重构方案

### 方案 A：精简 core.js（快速修复，1-2 小时）

**思路**：删除 core.js 中与 hub.html 重复的函数定义，让 hub.html 版本生效。

**步骤**：
1. 从 core.js 中删除 14 个被覆盖的函数（showSection/computeBazi/initAlmanac 等）
2. 保留 core.js 中独有的函数（getYearStemBranchExact/getDayStemIndex 等计算函数）
3. core.js 从 2.26MB 缩减到 ~1.5MB

**优点**：改动最小，风险最低
**缺点**：没有解决 2.39MB 单体 HTML 的根本问题

### 方案 B：拆分多页面（中期，4-8 小时）

**思路**：将 2.39MB 单体 HTML 拆分为多个独立页面。

**页面拆分**：
- `index.html` — 首页（功能入口网格）
- `bazi.html` — 八字排盘
- `zhanbu.html` — 占卜（六爻/梅花/奇门/六壬/紫微）
- `fengshui.html` — 风水
- `xingming.html` — 姓名起名
- `yanzhi.html` — 言值
- `jiuri.html` — 吉日
- `more.html` — 更多（知识库/黄历/体质/信众/口诀/会员/商城）
- `masters.html` — 名师解惑

**共享资源**：
- `js/common.js` — 公共函数（showSection 改为页面跳转）
- `js/engine-bazi.js` — 八字引擎
- `js/engine-ziwei.js` — 紫微引擎
- ... 7 个引擎独立文件
- `css/common.css` — 公共样式

**优点**：每个页面 50-200KB，移动端 < 3s 加载
**缺点**：改动量大，需要重构导航逻辑

### 方案 C：微信 H5 适配（中期，2-4 小时）

**思路**：在方案 B 基础上，增加微信内嵌浏览器适配。

**适配内容**：
1. 微信环境检测：`navigator.userAgent.includes('MicroMessenger')`
2. 微信内嵌样式适配：禁用 hover、增大触摸区域
3. 微信 JSSDK 集成：分享标题/描述/链接
4. 微信返回按钮：监听 `popstate` 事件
5. 禁用 iOS 双击缩放：`touch-action: manipulation`

---

## 三、推荐执行顺序

| 阶段 | 方案 | 时间 | 优先级 |
|---|---|---|---|
| Phase 1 | 方案 A：精简 core.js | 1h | P0 立即 |
| Phase 2 | 方案 B：拆分多页面 | 4-8h | P1 |
| Phase 3 | 方案 C：微信适配 | 2-4h | P1 |

Phase 1 解决"功能不可用"，Phase 2+3 解决"体验不好"。

---

## 四、验证标准

| 指标 | 目标 |
|---|---|
| 首页加载时间 | < 3s（移动端 4G） |
| 单页面体积 | < 200KB |
| 功能完整性 | 所有按钮可点击，所有排盘可出结果 |
| 微信兼容 | 微信内嵌浏览器正常使用 |
| PC 端 | 所有功能正常 |
