# 排盘与化解功能修复 (2026-06-14)

## 问题
排盘结果和化解方案无法出具，页面 JS 语法和逻辑错误导致功能崩溃。

## 已修复的 Bug（共 3 处）

1. **第8065行：模板字符串嵌套导致 SyntaxError** — `${isOld?'... (老${isYang?...}...)` 中嵌套模板表达式，改为条件表达式拼接（上次修复）

2. **第8370行：中文逗号导致 Invalid token** — `，` 混用替换为英文逗号（上次修复）

3. **第5950行：`const寅月干Idx` 缺少空格** — Node.js 将 `const寅月干Idx` 解析为单一标识符而非 `const` + 变量名。改为 `const yinMonthGanIdx` 并更新引用处

4. **`getShopLinks` 函数缺失** — 在 3 处被调用（7431/7555/7565行）但从未定义。添加函数：接收关键词数组，生成推荐物品 HTML 行

5. **`getNayin` 函数和 `NAYIN_COLOR` 常量缺失** — 纳音数据在排盘渲染中使用但未定义。添加六十甲子纳音表 `NAYIN_TABLE`（30组×2=60甲子）、`getNayin(stemIdx, branchIdx)` 函数、`NAYIN_COLOR` 颜色映射（30种纳音对应颜色）

## 验证结果
- 所有 `<script>` 块 `node --check` 语法检查通过
- `computeHuajie()` 执行成功（化解独立页面）
- `renderHuajieFull()` 执行成功（排盘内嵌化解）
- `getNayin` 返回正确纳音值（甲子→海中金 等）
- `getShopLinks` 正常生成推荐物品行