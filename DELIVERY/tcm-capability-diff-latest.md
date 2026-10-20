# tcm → mingli 能力差集巡检（二阶段增量吸收）

- 生成：2026-10-19 20:22 ｜ 差集指纹 `96a10c8c21bce29a`
- tcm 侧 HEAD：`9cda9265 v2.19.97 经验方召回92%→96%：词典补14别名+E源抽取主治优先降噪`
- 结论：**⚠ 有待吸收增量**

## L1 API 路由差集（tcm 有 · medical-stack 无）：19 条
- `get /api/clinic/agent/xinglin-review`
- `get /api/clinic/draft-adoption`
- `get /api/edu/personalized`
- `get /api/graph/case-text`
- `get /api/graph/similar-cases`
- `get /api/growth/quiz/stats`
- `get /api/growth/quiz/wrong-book`
- `get /api/kb/proofread/entry`
- `get /api/kb/proofread/page-image`
- `get /api/kb/proofread/worklist`
- `get /api/multimodal/std-input/contract`
- `get /api/public/kb/ancient-search`
- `get /api/teaching/round/:id`
- `post /api/clinic/agent/xinglin-review/ack`
- `post /api/growth/quiz/attempt`
- `post /api/kb/proofread/submit`
- `post /api/multimodal/std-input`
- `post /api/teaching/round`
- `post /api/teaching/round/:id/answer`

## 已知等价登记（勿重复建设）：1 条
- `post /api/tcm/` → visual-observation-proxy 动态路由前缀（非独立端点）；ms 已有等价观察端点，严格代理按 ADR-007 架构定位豁免

## L2 关键模块导出函数差集
- `auth.js` 缺：createToken, id, sub

## L2.5 检索处理器特征哈希（排序逻辑漂移监控，G17R 采纳项）

| 处理器 | tcm 哈希 | ms 哈希 | 状态 |
|---|---|---|---|
| `/api/tcm/kb/search` | `MISSING` | `cc2825765991dd8a` | 🔴 缺失 MISSING |
| `/api/tcm/kb/formula-recall` | `MISSING` | `b1cca84d4f18f7e6` | 🔴 缺失 MISSING |

漂移处置：哈希不一致即排序/打分逻辑单侧变更——按 ADR-016 流程移植对齐或登记豁免，禁止静默放过。

## L2.6 KB 数据资产哈希（症状通道/词典/降级名单漂移监控，2026-09-07 新增）

| 资产 | tcm 哈希 | ms 哈希 | 状态 |
|---|---|---|---|
| `formula-symptom-index.json` | `d7d040ca65b1` | `d7d040ca65b1` | ✅ 一致 |
| `symptom-aliases.json` | `6b6c1b7fae8f` | `6b6c1b7fae8f` | ✅ 一致 |
| `recall-demotions.json` | `44136fa355b3` | `44136fa355b3` | ✅ 一致 |
| `t2s-map.js` | `4f3a8aa939a1` | `4f3a8aa939a1` | ✅ 一致 |
| `symptom-index.js` | `332366481c3c` | `332366481c3c` | ✅ 一致 |
| `tcm-classics.json` | `47effa3917b3` | `47effa3917b3` | ✅ 一致 |
| `syndrome-supplement.json` | `6ff617f0267b` | `6ff617f0267b` | ✅ 一致 |

漂移处置：数据资产不一致即检索行为分叉（处理器同哈希也可能结果不同），直接同步文件对齐。

## L3 种子数据差集：0 项
- （空）

## L4 页面层参考：tcm 比 mingli 多 57 个页面（按三分法人工定性：真缺口/已有等价/架构定位）

## L4.5 共享 js 哈希比对（页面同源监控）
- `config-engine.js`：⚪ 有意适配（仅系统品牌名适配（SEC-001）；逻辑同源）
- `i18n.js`：⚪ 有意适配（仅 app.name 品牌串适配（SEC-001）；逻辑同源）
- `longitudinal-page.js`：🔴 漂移
- `nav.js`：⚪ 有意适配（ms 导航为 curated 子集 + 命理宝鉴品牌适配（fhub/consult/insur 已对齐 tcm 增量））
- `seed-loader.js`：⚪ 有意适配（R864 V2.0 已对齐（生产不自动注入假数据）；头部品牌标注差异）
- `mingli-annotation-view.js`：⚪ ms 自有（ms 自有（命理批注面板视图，G15/G16 命理视图开关，命理域自有））
- `reflux-badge.js`：⚪ ms 自有（ms 自有（G13+ 家庭端回流状态共享组件，诊台/药房/候诊/医技开单四触点复用））

## medical-stack 独有（命理增量层，勿回流 tcm）：25 条
（批注/预约自建/reflux/短信校验等，属 mingli 特有边界，详见 ADR-007）

---
处置流程见 docs/TCM-ABSORPTION-SPEC.md：移植→适配→冒烟→KANBAN 留证。禁止二次训练；R745/R756/R757 守卫不可绕过。
