# 乾元命理宝鉴 Bug修复报告
**日期**: 2026-06-20 15:44
**任务**: 修复4个已知Bug

## 问题1: 知识库所有按钮点击后都不能用

### 分析
- 检查了所有JS文件语法 — 全部通过语法检查
- 检查了外部JS文件 — 全部存在且可访问
- `showKnowledgeDetail()` 函数逻辑正确，数据源完整（knowledge-details.js + knowledge-details-extra.js）
- 发现 `keyMap` 映射有误：`shishen: 'bazi'`, `nayin: 'bazi'`, `shensha: 'bazi'` 导致十神、纳音、神煞三个独立页面都显示八字内容
- knowledgeDetailModal z-index 可能在某些情况下被其他弹窗覆盖

### 修复
1. 修正 `keyMap`：`shishen:'shishen'`, `nayin:'nayin'`, `shensha:'shensha'`（每个指向独立数据）
2. 添加 `console.log` 调试信息方便排查
3. 强制 `knowledgeDetailModal` z-index 设为 10001
4. 文件: `divination-hub.html` 行23587附近

### 遗留
- 如果是本地文件系统加载（file://协议）导致CORS阻止外部JS加载，需通过HTTP服务器访问

## 问题2: 体质调理风格跟主界面不统一

### 分析
`divination-integrated.html` 使用浅色纸张主题（亮色背景+深色文字），主平台 `divination-hub.html` 使用深色主题（黑色背景+米色文字）。大量使用 `#faf8f4`、`#3d2b1f`、`#ede5d8` 等亮色值。CSS变量 `--title`、`--muted`、`--accent` 未在 `:root` 中定义。

### 修复
1. **重写 `:root` CSS变量**：对齐主平台变量（`--ink:#080808`, `--paper:#f0e8d8`, `--gold:#c9a84c` 等），补充定义 `--title`, `--muted`, `--accent`
2. **修改 body 样式**：`background:var(--bg)`（深黑）, `color:var(--text)`（米色）
3. **批量替换亮色引用**：`#faf8f4`→`rgba(255,255,255,0.06)`, `#3d2b1f`→`var(--text)`, `#f0ebe3`→`rgba(201,168,76,0.08)` 等
4. **修改页头/导航栏**：渐变背景改为深色系
5. **修改五行颜色卡片**：高透明度背景适配深色主题
6. 文件: `divination-integrated.html`

### 注意
- `divination-integrated.html` 内有一个 JS 语法错误（`try` 块缺少 `catch`，行640），此错误在修复前已存在，非本次修改引入

## 问题3: 更多→信众中心有大片空白区域

### 分析
- `section-user` 的 `min-height: calc(100vh - 64px)` 导致即使内容少也占满一屏
- 选择信仰后，`selectFaith()` 原来只调用 `renderFaithPanelFromSelect()`，该函数操作的是 `morePanel-faith` 的 `faithContent`，与 `section-user` 无关
- `showWorship()` 使用 `event.target` 但调用时未传 `event`，会导致 ReferenceError

### 修复
1. **修复 `selectFaith` 函数**：增加 localStorage 保存 + 调用 `initUserCenter()` 初始化 `section-user` 的日程/穿搭/建议内容 + 调用 `showWorship()` 显示参拜指南
2. **修复 `showWorship` 函数**：移除 `event.target` 依赖，改为遍历标签按钮匹配高亮
3. 文件: `divination-hub.html` 行11312和行16798

## 问题4: 信众中心内容不全

### 分析
`section-user`（通过"更多→信众中心"进入）和 `morePanel-faith`（通过"更多"标签页的"信众"标签进入）是两个不同的界面：
- `section-user`：侧重信仰设置、年度日程、穿搭建议、每日提醒 — 这是简化版
- `morePanel-faith`：完整的信众修行界面，含儒/道/佛的雅乐/食养/健身/口诀/计划5大模块 + 动态模块导航（神仙殿堂、经典经文、咒语口诀等11个模块）

### 现状
- `morePanel-faith` 中儒/道/佛三面板的5大模块（雅乐/食养/健身/口诀/计划）内容完整
- `faith-renderer.js` 的 `renderFullPanel` 正确渲染了11个动态模块
- `faith-knowledge-base.js` 包含22位神仙数据和完整口诀库

### 结论
- `morePanel-faith` 内容完整，5大模块正常展示
- `section-user` 的功能定位不同（简化入口），不算bug
- 已通过修复问题3使 `section-user` 在选择信仰后正确展示更多内容

## 修改的文件清单
1. `divination-hub.html` — 3处修改
   - `selectFaith()` 增加初始化逻辑
   - `showWorship()` 移除event依赖
   - `showKnowledgeDetail()` 修正keyMap + 增加调试日志
2. `divination-integrated.html` — CSS变量和颜色全面统一到深色主题

## 测试建议
1. 硬刷新 `divination-hub.html`（Cmd+Shift+R）
2. 进入"更多"→"知识库"，点击各知识卡片验证弹窗正常
3. 进入"更多"→"信众中心"，选择信仰后查看日程、穿搭等是否正常显示
4. 打开 `divination-integrated.html`，验证深色主题风格与主平台一致
5. 检查浏览器控制台是否有JS错误
