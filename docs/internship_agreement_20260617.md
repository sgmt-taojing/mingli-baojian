# 实习协议（自媒体运营）- 生成记录

## 任务
生成一页纸的实习协议 Word 文档（.docx），岗位为自媒体运营，包含详细工作内容。

## 输出文件
`/Users/tom/Desktop/实习协议_自媒体运营.docx`（14KB）

## 文档结构
- **标题**：实习协议书（自媒体运营岗位）
- **基本信息表**：甲方/乙方/岗位/期限/地点/时间/补贴/日期
- **七大章节**：
  1. 协议依据
  2. 甲方权利与义务（5条）
  3. 乙方权利与义务（6条）
  4. 实习工作内容明细（**10大模块，详细列表**）
  5. 保密与竞业限制
  6. 协议解除与终止
  7. 其他约定
- **工作明细表**（含表头，工作模块+内容说明，10行）

## 技术说明
- 使用 `docx` npm 包生成 A4 Word 文档
- NODE_PATH 需指向：`/Users/tom/Library/Application Support/QClaw/npm-global/lib/node_modules`
- **重要 Bug**：JavaScript 中 `const甲方 = [...]`（无空格）会被解析为将值赋给名为 `const甲方` 的单个标识符，而非 `const` 声明 `甲方` 变量，导致 `ReferenceError: 甲方 is not defined`。必须写成 `const itemsA = [...]`（用 ASCII 标识符）。
- 同样问题影响 `const乙方`，已统一改为 `itemsA` / `itemsB`
- 共 5 个表格（基本信息表 + 工作明细表 + 签字栏等），76 个段落
