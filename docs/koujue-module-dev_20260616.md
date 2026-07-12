# 口诀宝库模块开发记录

## 完成时间
2026-06-16 07:05 GMT+8

## 目标
为乾元命理宝鉴平台开发口诀库浏览功能，集成已有的 koujue-database-full.js 数据库。

## 完成内容

### 1. 引入口诀数据库
- 在 `<head>` 中添加 `<script src="koujue-database-full.js"></script>`（与其他外部脚本并列）

### 2. 口诀库浏览面板 (morePanel-koujue)
- 模块 ID: `morePanel-koujue`
- 底部"更多"菜单栏添加 📿口诀 按钮（3处：mini-btn、jinang-tab、more-menu）
- 界面包含：
  - 标题「📿 口诀宝库」+ 副标题
  - 搜索框（实时过滤 name/text/purpose）
  - 收藏入口按钮（localStorage 存储）
  - 分类标签栏（全部/八大神咒/护身咒/佛教咒语/内丹导引/禅修口诀/儒家修身/生活智慧/养生时辰）
  - 口诀卡片列表（名称、用途、正文预览）
  - 每日推荐区（基于时段和季节自动选取养生建议）

### 3. 口诀卡片详情展开
- 点击卡片展开完整口诀正文、用法、场景
- 佛教咒语显示梵文(sanskrit)和功德(merit)
- 内丹/禅修类展示 details 数组
- 注意事项(caution)和提示(tips)

### 4. 收藏功能
- 卡片右上角收藏按钮，存 localStorage
- 口诀库首页"我的收藏"入口

### 5. 信众面板联动
- 三个信仰面板的"修行口诀"区添加 data-faith 属性和唯一 ID
- showMoreModule('faith') 时自动调用 updateFaithKoujue()
- 儒家→confucian_cultivation, 道家→taoist_eight+taoist_protection+neidan_koujue, 佛家→buddhist_mantras+buddhist_meditation
- 动态替换静态口诀文本为数据库内容（最多8条+更多链接）

### 6. CSS 样式
- 添加 .koujue-tab / .koujue-card / .koujue-detail / .koujue-sub-cat 等样式
- 使用 var(--gold), var(--paper2), var(--paper3) 等平台 CSS 变量
- 古风金黑配色，与平台一致

## 技术细节
- JS 通过 IIFE 封装，避免全局污染
- showMoreModule 通过覆盖模式增强（保存原始函数，追加口诀逻辑）
- 生活智慧和每日推荐按子分类特殊渲染
- Node --check 语法检查通过

## 备份
- divination-hub.html.bak6（原始文件备份）

## 文件修改
- `/Users/tom/.qclaw/workspace/divination-hub.html` - 主文件（6处编辑）
- `koujue-database-full.js` - 未修改，仅引用
