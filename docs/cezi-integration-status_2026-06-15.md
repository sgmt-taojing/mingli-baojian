# 测字集成状态检查 - 2026-06-15

## 状态：knowledge-supplement-6.js 不存在，跳过集成

## 现有测字功能
- HTML: divination-hub.html 第6986-7003行（表单+结果区域）
- JS: `doCezi()` 第16042行，`randomCezi()` 第16099行
- 数据: `CEZI_DATA` 常量第15766行（内联~30字）
- 字段结构: radical, wuxing, strokes, meaning, career, marriage, health, wealth, mnemonic

## 待办（当 knowledge-supplement-6.js 创建后）
1. 第22518行后添加 `<script src="knowledge-supplement-6.js"></script>`
2. 在 `const CEZI_DATA = {` 前添加 `var _inline_cezi = `
3. 在 CEZI_DATA 定义后添加 `CEZI_DATA = window.CEZI_DATABASE || _inline_cezi;`
4. 这样外部500+字数据库可覆盖内联30字fallback
