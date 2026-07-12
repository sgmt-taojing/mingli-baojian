# AI 分析古籍引用增强

## 目标
为 divination-hub.html 的 AI 分析功能添加古籍原文引用，提升专业度。

## 修改文件
- `/Users/tom/.qclaw/workspace/divination-hub.html` (1682→1773 行，+91 行)

## 具体修改

### 1. CSS（line 180 后）
- 添加 `.classical-ref` 样式：金色左边框、半透明底色、12px 字号

### 2. JS - 古籍数据库（line 1232 前，+65 行）
- `CLASSICAL_QUOTES`：十天干+十二地支各 2 条引用
- `getClassicalRef(dayStem, dim)`：按日主和维度返回引用

### 3. JS - Prompt 增强（5 个维度各 +7 行）
- 每个 prompt 末尾添加古籍引用要求及格式说明

### 4. JS - 结果展示（1 行改 2 行）
- AI 返回结果追加 `classicalRef` HTML

## 效果
- AI 分析会尝试在输出中引用古籍（prompt 引导）
- 无论 AI 是否输出引用，都自动附加本地古籍引用作为补充
