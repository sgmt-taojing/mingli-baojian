# 黄历个性化功能添加

## 目标
为 divination-almanac.html 添加八字录入UI和个性化宜忌建议

## 完成的修改
1. CSS: `.personal-card` 样式（line ~490）
2. HTML: 顶部可折叠八字录入面板（line ~493）
3. JS: `saveUserBazi`, `clearUserBazi`, `getUserBazi`, `getPersonalAdvice` 函数及五行常量（line ~822）
4. JS: `updateDailyAdvice` 函数增加个性化板块
5. JS: `DOMContentLoaded` 回调增加八字恢复逻辑

## 未修改
- 已有黄历计算逻辑
- 无新页面
- 无其他文件