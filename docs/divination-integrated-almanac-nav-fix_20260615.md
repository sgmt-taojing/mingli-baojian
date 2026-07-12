# 乾元平台 · 功能导航区修复

## 问题
cron 自检发现 `divination-integrated.html` 和 `divination-almanac.html` 缺少"风水/改名/公司起名/户型鉴别"等核心功能导航关键词。

## 原因
两个文件是平台子页面（体质调理/黄历），仅有顶部全局导航栏，底部只有法律声明，缺少对平台核心功能的引导区。

## 修复
在两个文件底部（`</body>` 前、法律声明下方）各添加统一的「平台功能导航区」：

- **7 个功能卡片**：命理总览 / 风水堪舆 / 改名取名 / 公司起名 / 户型鉴别 / 黄历或体质调理 / 易学知识
- 每个卡片：图标 + 名称 + 简述，带 hover 效果
- `divination-integrated.html`（暖色风格）：深棕底 + 金色卡片
- `divination-almanac.html`（暗金风格）：深墨底 + 金色边框卡片
- 导航指向主文件对应锚点（`#fengshui`/`#xingming`/`#company`/`#huxing`）

## 验证
- ✅ `divination-integrated.html` JS 语法正确（Script 0: 59200 chars）
- ✅ `divination-almanac.html` JS 语法正确（Script 0: 29877 chars）
- ✅ 两个文件均含 6 处导航关键词命中

## 文件
- `/Users/tom/.qclaw/workspace/divination-integrated.html`（含底部功能导航区）
- `/Users/tom/.qclaw/workspace/divination-almanac.html`（含底部功能导航区）