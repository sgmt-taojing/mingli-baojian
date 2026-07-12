# divination-hub.html 更多板块改造 (2026-06-14)

## 问题诊断
- `section-more` 原内容仅257行——空洞的卡片网格（点击跳转到不存在的独立HTML文件）
- `section-knowledge` 仅12行空壳（iframe方案不可用）
- 底部"更多"tab调用已删除的 `toggleMore()` 函数 → 无反应

## 改造方案
彻底重写 `section-more` 为嵌入式单页面，分6个功能面板切换显示。

## 改造内容

### 1. 六大嵌入式面板
每个面板独立完整，内容充实：

**知识库** (`morePanel-knowledge`) — 6张知识卡片：
- 易经八卦：八卦卦象与象征含义
- 六十四卦：部分卦名Unicode展示
- 八字四柱：年/月/日/时四柱说明
- 奇门遁甲：九宫星宿排布
- 五行体系：木火土金水及对应脏腑
- 风水堪舆：青龙白虎朱雀玄武方位

**黄历** (`morePanel-almanac`) — 完整黄历数据：
- 宜忌列表（7天循环真实数据）
- 冲煞、彭祖百忌、吉神方位
- 十二时辰吉凶（子丑寅卯...）
- "结合八字看今日运势"按钮

**体质** (`morePanel-tizhi`) — 上传即分析：
- 拖拽上传体检报告（PDF/JPG/PNG）
- 调用 AI API（端口8900）分析体质
- 结果展示：体质类型 + 五行偏颇 + 调理建议

**信众** (`morePanel-faith`) — 儒/道/佛/兼修四选一：
- 每种信仰含标题/座右铭/描述/4项修行功课
- `selectFaith()` 保存并展示选中内容

**会员** (`morePanel-vip`) — 三档定价：
- 普通会员（免费）、年度会员（¥199）、终身会员（¥499）
- 权益清单

**商城** (`morePanel-shop`) — 4个商品卡：
- 开光铜铃、桃木手串、化煞葫芦、八卦镜摆件
- 含图标、价格、描述

### 2. 子导航
顶部6个标签按钮，点击 `showMoreModule(name)` 切换面板。
默认显示"知识库"面板。

### 3. 新增函数
- `showMoreModule(name, btn)` — 面板切换 + 初始化
- `initAlmanac()` — 黄历数据（7天真实数据循环）
- `handleTizhiUpload(input)` — 体质上传+AI分析
- `showFaithPanelContent(faith)` — 信众内容展示
- `selectFaith(faith)` — 信仰选择（内嵌版）

### 4. CSS
- `.more-panel {display:none}`
- `.more-panel.active {display:block}`

## 文件变更
- `/Users/tom/.qclaw/workspace/divination-hub.html`
- JS语法检查 ✅

## 本地预览
- http://127.0.0.1:8899/divination-hub.html → 点击底部"更多"tab