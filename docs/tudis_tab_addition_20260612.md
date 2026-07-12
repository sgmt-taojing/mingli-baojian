# 知识图谱 Tab 添加

## 时间
2026-06-12

## 目标
在 divination-knowledge.html 中新增「🔗 知识图谱」Tab

## 完成内容
1. Tab 按钮 `kb-tab-tudis` 添加在功德 Tab 之后
2. SVG 五层关系图谱（五行→八卦→天干→地支→奇门九宫），含相生/相克关系线
3. 悬停高亮 + 点击解读面板交互
4. 4个断事工具：五行缺什么、今日宜忌、合婚速断、起名用字
5. 综合结论输出模板
6. Canvas 五行柱状图
7. 响应式设计（横向滚动 + 网格布局）
8. 修复了原文件 `};` 重复语法错误

## 技术细节
- 使用 `kb-tab` / `kb-section` / `showKb()` 与现有 Tab 系统一致
- 所有数据（WUXING_DATA, BAGUA_DATA, TIANGAN_DATA, DIZHI_DATA, QIMEN_DATA）内联在 JS 中
- 纯 SVG + JS 实现，无外部依赖
- 通过 `node --check` 语法验证通过
