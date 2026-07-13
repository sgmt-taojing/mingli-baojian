# 命理宝鉴 · 架构重构计划与进度

**日期**：2026-07-13
**状态**：Phase 1 完成，Phase 2-3 待启动

---

## 一、问题诊断

### 根因分析
1. **core.js 覆盖 hub.html 中的 292 个函数**，其中 18 个关键 UI/导航函数与 hub.html 的 HTML 结构不兼容，导致所有导航和排盘功能失效
2. **2.39MB 单体 HTML**，移动端加载 50 秒
3. **loading-overlay 遮罩层**（已修复）
4. **63 处 const 重复声明**（已修复）
5. **无微信适配**

### Phase 1 修复（已完成）

| 修复项 | 修复前 | 修复后 |
|---|---|---|
| loading-overlay 遮罩 | display:flex 阻挡所有点击 | display:none + 5秒超时保底 |
| const 重复声明 | 63处 SyntaxError | 改为 var |
| core.js 函数覆盖 | 18个UI函数被core.js覆盖 | 从core.js删除，hub.html版本生效 |
| core.js 体积 | 2.26MB | 1.59MB（减少 30%） |

### 验证结果

| 检查项 | 状态 |
|---|---|
| hub.html showSection | ✅ 存在且生效 |
| hub.html computeBazi | ✅ 存在且生效（含首次推送） |
| hub.html initAlmanac | ✅ 存在且生效 |
| core.js showSection | ✅ 已删除 |
| core.js 计算函数 | ✅ 保留（getYearStemBranchExact等） |
| loading-overlay | ✅ display:none |
| mobile-quick-item | ✅ 18个入口 |
| const 重复 | ✅ 0处 |
| 语法检查 | ✅ 通过 |

---

## 二、后续重构计划

### Phase 2：拆分多页面（建议 4-8 小时）

将 1.83MB 单体 HTML 拆分为独立页面：

| 页面 | 功能 | 目标体积 |
|---|---|---|
| index.html | 首页功能入口 | < 50KB |
| bazi.html | 八字排盘 | < 200KB |
| zhanbu.html | 占卜（六爻/梅花/奇门/六壬/紫微） | < 300KB |
| fengshui.html | 风水分析 | < 150KB |
| xingming.html | 姓名起名 | < 150KB |
| more.html | 知识库/黄历/体质/商城 | < 200KB |
| masters.html | 名师解惑 | < 100KB |

### Phase 3：微信 H5 适配（建议 2-4 小时）

1. 微信环境检测：`navigator.userAgent.includes('MicroMessenger')`
2. 微信内嵌样式适配：禁用 hover、增大触摸区域
3. 微信 JSSDK 集成：分享标题/描述/链接
4. 微信返回按钮：监听 `popstate` 事件
5. 禁用 iOS 双击缩放：`touch-action: manipulation`

---

## 三、Git 状态

| 分支 | commit | 内容 |
|---|---|---|
| main | 5c03882 | Phase 1 全部修复 |
| gh-pages | fa99537 | 同步到外网（v20260713d） |

---

## 四、外网 URL

| 页面 | 地址 |
|---|---|
| H5 主应用 | https://sgmt-taojing.github.io/mingli-baojian/divination-hub.html |
| 入口页 | https://sgmt-taojing.github.io/mingli-baojian/ |
| 黄历 | https://sgmt-taojing.github.io/mingli-baojian/divination-almanac.html |
| 知识库 | https://sgmt-taojing.github.io/mingli-baojian/divination-knowledge.html |
| 商城 | https://sgmt-taojing.github.io/mingli-baojian/divination-shop.html |
| 会员 | https://sgmt-taojing.github.io/mingli-baojian/divination-membership.html |
