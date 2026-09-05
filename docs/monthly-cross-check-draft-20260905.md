# 月度互查清单 · mingli 本侧检查项草案（2026-09-05）

> 定位：把既有巡检资产（G17 六层 / G17R 采纳项 / G21-G22 能力保鲜）合并为一张月度互查清单。
> 本草案为 mingli 本侧承担项；family / tcm 侧对应项由各自窗口补充后合并为三方互查表。
> 节奏建议：每月 1 号以后首个工作窗口执行；红线项另有日常节奏（已挂 health-patrol / launchd）。

## A. mingli → family 方向（命理能力保鲜，G21/G22）

| # | 检查项 | 工具/方法 | 日常节奏 | 月度动作 | 证据件 |
|---|--------|-----------|----------|----------|--------|
| A1 | 能力包漂移（outbox 定版 ↔ family 部署逐文件哈希） | `scripts/capability-drift-check.js` | 已挂 health-patrol（实时） | 汇总当月 DELIVERY/capability-drift-latest.json 历史，确认零未结 DRIFT | capability-drift-latest.json |
| A2 | registry ↔ outbox 实物对账（releases 登记的版本目录都存在且 manifest 可解析） | 巡检脚本扩展项（月度手动跑） | — | 对 registry.releases[] 逐条核对 pack_path 存在性 | 对账输出贴 KANBAN |
| A3 | **排盘输出指纹对拍**（固定 5 用例：qimen/liuyao/meihua/liuren 2026-08-27 20 时 + ziwei 1990-05-15 14:00，双侧同跑比完整 JSON，不止 selftest 过/不过） | 本侧出指纹件，family 侧同跑自证 | — | 各出 `fingerprint-<月份>.json`，逐字段 diff（白名单：无） | DELIVERY/paipan-fingerprint-YYYYMM.json |

## B. tcm → mingli 方向（医学通道保鲜，G17/G17R/G18 既有）

| # | 检查项 | 工具/方法 | 日常节奏 | 月度动作 | 证据件 |
|---|--------|-----------|----------|----------|--------|
| B1 | L1 差集巡检（tcm 新能力待吸收清单） | `scripts/tcm-capability-diff.py` | 既有节奏 | 月度确认「无待吸收增量」或列出排期 | tcm-capability-diff-latest.md |
| B2 | L2.5 检索处理器特征哈希（search/formula-recall 函数体规范化 sha256 双侧一致） | tcm-capability-diff.py 内 L2.5 | 既有节奏 | 月度复核零漂移；漂移即查 OTA 激活记录 | 同上 |
| B3 | L2 同案对拍（equiv-set-v1 冻结集 30 例 + 10 舌面帧，Δ≤0.02） | `scripts/equiv-dual-run.py` | OTA 门必过 | 月度全量复跑一次留证 | DELIVERY/l2-evidence-*.json |
| B4 | L3 知识一致性（条数/抽样 200 指纹/Recall@K 对跑） | G17 六层脚本 | — | 月度执行 | DELIVERY/l3-evidence-*.json |
| B5 | 排名漂移残留守护（G17R 裁判采纳并入月查项） | 对拍结果分析 | — | 月度复核 B075 等金案 top1 双侧一致 | 同 B3 |

## C. 通用合规项

| # | 检查项 | 方法 | 月度动作 |
|---|--------|------|----------|
| C1 | 话术分层抽查（ADR-009 三层：机构版/消费者版话术不错位） | 抽查 3 个页面 + 1 份新出报告 | 月度 |
| C2 | 命理/医学分域守卫（R745/R756/R757：医学输出零命理词、批注不入诊断上下文） | L4 阴性守卫用例复跑 | 月度 |
| C3 | 历法换算一致性（true-solar.js 指纹；paipan-rules 能力包与引擎包内嵌副本同源） | sha256 比对 | 月度 |

## 待 family / tcm 窗口补充

- family 侧：A3 对拍执行人、漂移 --fix 降级缺陷根修确认（见 handoff 事故通报 20260905）、家庭端回流内容抽检；
- tcm 侧：B 系列各项的 tcm 半边执行确认、G19 落地通报节奏。

## 执行约定

- 月度互查结果记入各自 KANBAN，异常项 24h 内跨窗口通报（handoff 通道）；
- 本草案版本：v0.1（待三方会签后升 v1.0 并写入各自 AGENT.md）。
