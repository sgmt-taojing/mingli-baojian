# 乾元命理宝鉴 · 知识库全量扩充（2026-06-18）

## 目标
按用户给出的顺序，对乾元命理宝鉴进行「全量收录」式知识库扩充。

## 新建文件清单

| 序号 | 域 | 文件名 | 大小 |
|------|------|--------|------|
| 1 | 六爻断法 | `liuyao-knowledge-base.js` | 31KB |
| 2 | 八字命理 | `bazi-knowledge-base.js` | 26KB |
| 3 | 紫微斗数 | `ziwei-knowledge-base.js` | 15KB |
| 4 | 奇门遁甲 | `qimen-knowledge-base.js` | 11KB |
| 5 | 梅花易数 | `meihua-knowledge-base.js` | 5KB |
| 6 | 大六壬 | `liuren-knowledge-base.js` | 6KB |
| 7 | 风水形势派 | `fengshui-knowledge-base.js` | 7KB |
| 8 | 周易 | `zhouyi-knowledge-base.js` | 9KB |
| + | 姓名学 | `knowledge-details-extra.js` 追加 | ~1KB追加 |

## 每个文件的结构

每个知识库文件采用统一模式：
1. `window.XXX_KB` 对象（全量结构化知识数据）
2. 自执行函数注册 `window.KNOWLEDGE_DETAILS['xxx']` HTML内容（供知识卡片调用）
3. 每个文件包含：起源传承、核心概念、分类详解、口诀、进阶知识

## 页面修改

- `divination-hub.html`：添加了全部 8 个 script 引用 + `xingming` 到 `knowledge-details-extra.js`
- `divination-knowledge.html`：同步添加了全部 script 引用（含 `yangzhai-knowledge-base.js`）

## 数据流验证

- **知识卡片点击** → `showKnowledgeDetail('xxx')` → 查 `window.KNOWLEDGE_DETAILS['xxx']` ✅
- **知识库标签页** → `showKb('xxx')` → `loadKbContent('xxx')` → 查 `window.KNOWLEDGE_DETAILS` ✅
- `loadKbContent` 的 `dataMap` 已预配置所有新类别 ✅

## HTTP 服务
`python3 -m http.server 8899` PID 93794 运行中
