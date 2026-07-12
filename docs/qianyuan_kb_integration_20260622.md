# 乾元命理宝鉴 · 知识库整合修复

**日期：** 2026-06-22  
**目标：** 修复 zodiac-knowledge-base.js 和 masters-knowledge.js 未被引用问题，增强生肖详情展示

## 问题诊断

1. **zodiac-knowledge-base.js（32KB）**：已在 HTML 中通过 `<script src>` 引用，但 `showZodiacDetail()` 函数使用内联硬编码数据，未调用 `ZODIAC_KNOWLEDGE` 对象中的丰富数据（本命佛详细信息、年度运势、吉祥物推荐）
2. **masters-knowledge.js（35KB）**：已在 HTML 中通过 `<script src>` 引用，但没有任何展示函数或入口，`MASTERS_KNOWLEDGE` 对象完全闲置
3. **knowledge-deep-supplement.js**：上次巡检已创建并引用，补充 authoritative-knowledge-base.js 中7个过于简略的知识类别

## 修复内容

### 1. 新增 `showMastersKB()` 函数
- 在知识库网格中添加「命理宗师」卡片（🎓 图标）
- 函数读取 `MASTERS_KNOWLEDGE` 对象，按三个时代分节展示：
  - 古代命理大师（唐宋元明）
  - 近现代命理大师（清末民国）
  - 当代命理大师
- 每位大师展示：姓名、年代、学派标签、头衔、生平、贡献、核心思想、代表著作、名言、影响
- 复用 `knowledgeDetailModal` 弹窗

### 2. 增强 `showZodiacDetail()` 函数
- 原函数仅有内联基础数据（五行、方位、配对、避免配对）
- 增强后从 `ZODIAC_KNOWLEDGE` 读取深度数据：
  - **本命佛**：菩萨名称、梵文、详细介绍、供奉方法、功德利益、禁忌
  - **年度运势**：事业、财运、感情、健康
  - **吉祥物推荐**：家居、车内、佩戴
- 保留原有内联数据作为 fallback（当 ZODIAC_KNOWLEDGE 未加载时仍可显示基础信息）

### 3. 端口冲突状态
- 端口 8899：环保助手 HTTP 服务（com.epb.assistant.http，工作目录 skills/epb-assistant/scripts）
- 端口 8901：乾元命理宝鉴 HTTP 服务（com.qianyuan.http，工作目录 workspace）
- 两者独立运行，互不干扰，均有 LaunchAgent 保活

## 验证结果

- ✅ 41 个 `<script>` 块全部通过 vm.Script 语法验证
- ✅ knowledge-deep-supplement.js、zodiac-knowledge-base.js、masters-knowledge.js 均通过 HTTP 8901 正常返回
- ✅ HTML 中 3 处 JS 引用确认存在
- ✅ LaunchAgent com.qianyuan.http 配置正确（端口 8901，工作目录 workspace，KeepAlive）

## 文件变更

| 文件 | 操作 | 说明 |
|------|------|------|
| divination-hub.html | 修改 | 新增 showMastersKB() 函数 + 知识库卡片；增强 showZodiacDetail() 使用 ZODIAC_KNOWLEDGE 深度数据 |
