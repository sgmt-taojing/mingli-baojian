# 命理宝鉴修复报告 - 2026-06-15

## 问题1: 知识库卡片点击后内容为空
**根因**: `showKnowledgeDetail(key)` 直接查询 `AUTHORITATIVE_KNOWLEDGE[key]`，但卡片传入的是 `bagua`、`qimen` 等分类 key，与 AUTHORITATIVE_KNOWLEDGE 的 `overview`、`dizhi_canggan` 等 key 不匹配。

**修复**:
- 重写 `showKnowledgeDetail()` 函数，优先查找内联 `kd-xxx` div（12个均存在：bagua, liushisigua, bazi, qimen, wuxing, fengshui, shishen, nayin, shensha, hechong, liuyao, xingming）
- 找到后隐藏 knowledge-grid、显示 knowledge-detail 面板、定位对应 kd-xxx div
- 新增 `hideKnowledgeDetail()` 函数处理返回逻辑
- `closeKnowledgeDetail()` 委托给 `hideKnowledgeDetail()`
- 回退路径保留 AUTHORITATIVE_KNOWLEDGE 查询

**文件**: `/Users/tom/.qclaw/workspace/divination-hub.html`

## 问题2: 更多板块模块检查
### morePanel-tizhi (体质)
- ✅ `handleTizhiUpload()` 存在且功能完整（FileReader + AI API 分析）
- 无需修改

### morePanel-vip (会员)
- ✅ 已有三级会员对比信息（普通/年度/终身）
- 按钮保持 alert('即将上线') 提示
- 无需修改

### morePanel-faith (信众)
- ✅ `FAITH_KNOWLEDGE.deities` 数据结构正确：`{buddhist:[...], taoist:[...], confucian:[...]}`
- ✅ `renderDeities()` 正确读取并生成卡片，绑定 hover 事件
- ✅ `renderFaithPanelFromSelect()` 正确路由到 renderDeities
- 在 `renderDeities` 开头添加了调试日志作为诊断保障

**文件**: `/Users/tom/.qclaw/workspace/faith-renderer.js`

## 验证
- `node --check` faith-renderer.js ✅
- HTML 所有 script 块语法检查 ✅
