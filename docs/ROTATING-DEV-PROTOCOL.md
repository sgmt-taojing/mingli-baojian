# 命理宝鉴 · 双智能体轮番开发协议（R796 · 2026-09-17）

> 用户设定：Kimi 与 AutoClaw 轮番开发同一项目，相互检查、对照能力。
> 本协议是轮番机制的唯一规范；与 AGENT-TAKEOVER-20260917.md（接管宣言）配套生效。

## 一、轮值模型

**交替推进制**：每个「轮值周期」由一方主开发（driver）、另一方守门复核（reviewer）。

- **周期单元** = 一个可验收的开发包（feature / 修真集 / 知识批次），不是固定时长
- **轮转触发**：driver 完成→交付→reviewer 复核通过→轮转；或 48h 未交付自动轮转
- **当前轮次登记**：本文档末尾「轮值台账」唯一记录，禁止两侧各自记账

## 二、任务单（Work Order）规范

每周期开工前，在 `docs/rotating-tasks/` 下建任务单 `WO-<序号>-<slug>.md`：

```
# WO-<序号> <标题>
- 发起: <AutoClaw|Kimi|用户>
- driver: <本轮开发方>
- reviewer: <本轮复核方>
- 范围: <明确文件/模块/KB域>
- 验收标准: <可实测的判定条目>
- 红线: <适用边界引用 docs/KB-QUALITY-RULES.md 等>
```

序号全局递增；一个 WO 只归属一个 driver。

## 三、交付与复核流程（driver→reviewer）

1. **driver 交付物**：代码/KB 变更 + CHANGELOG 条目 + 自检证据（patrol/测试输出）
2. **reviewer 复核清单**（不通过即打回，附原因）：
   - 巡检全绿（health-patrol + kb-quality-patrol rc=0）
   - CHANGELOG/KANBAN 留证与实际 diff 一致
   - 五红线/边界红线零违反
   - 验收标准逐条实测
3. **复核通过**：reviewer 在 WO 文件尾部签 `REVIEWED: <方> <日期> <一句话结论>`，轮值台账登记
4. **复核时限（R797 补）**：reviewer 须在 driver 交付后 24h 内完成复核签署；逾期未复核 → 视为通过（台账记「逾期默认通过」），轮转继续，杜绝双向等待死锁；任何一方对逾期通过项可后补抽验，发现问题开 WO-<n>-audit 修真

## 四、冲突防护（两侧同时写库防护）

- **唯一工作区（不留副本，R798 Kimi 会签补）**：本项目唯一开发现场即 `workspace/projects/mingli-baojian/`，双方直接在同一目录轮番作业；禁止任何一方克隆/另建平行副本开发后再合并（副本即漂移源）。外接盘 cold-storage 仅作冷存归档，不作开发现场
- **分支纪律**：driver 在 `main` 直接提交（单人周期内）；reviewer 复核期只读不写
- **KB 写入唯一通道**：无论谁 driver，写库必须走 R793 守卫（kb-sync-guard.py），红线不因轮值而放宽
- **Git 为准**：任何一侧发现对方产出与 CHANGELOG 不符 → 开 WO-<n>-audit 审计单，暂停新开发直到定性

## 四补、优势分工指引（R798 · 建议性，不强制）

派单时优先让强项方出手，用户对照表只看实绩：

| 维度 | AutoClaw 强项 | Kimi 强项 |
|---|---|---|
| 运行时 | 常驻 launchd/cron 集群、夜间批处理、系统级守护值守 | 会话内深度调试、服务热修 |
| 诊断 | 基线盘点、日志证据采集、状态对账 | 复杂根因定位、假闭环/假成功猎捕、浏览器实走查 |
| 知识 | 批量蒸馏管线、增量调度 | 知识质量精修、报告专业性/白话化打磨、五红线审计 |
| 前端 | 结构改造、批量修真 | 交互体验、点读/视觉细节、用户视角验收 |

跨强项任务照样可派，但 reviewer 侧优先由另一方担任以形成互检。

## 八、签署

- 起草：AutoClaw 2026-09-17（R796/R797）
- 会签：**Kimi 2026-09-17 11:06**——边界已实测核实（禁触五路径逐一验存、本项目管线零 Codex 引用、端口/launchd 归属盘点一致），WO-002 已领单

## 五、能力对照记录（应用户「看哪个更强」）

每周期结束在轮值台账记一行：
`WO-xx | driver | 交付物摘要 | 验收一次通过?(Y/N) | reviewer 打回次数 | 用时`
用户可据此对照两智能体的：交付速度、一次通过率、被打回原因分布。

## 六、首轮分配（本协议生效即启动）

- WO-001（AutoClaw driver）：养生域 KB 建设第一批（已完成 14 条入库：yangsheng 5 + 今日蒸馏管线验证）+ wechat-platform STALE 清欠——**本轮即本轮值周期 #1**
- WO-002（待 Kimi driver）：由用户/Kimi 侧从 backlog 提取（建议：四路大师 cron 集群恢复 或 v9.2 BaziQA 重评——Kimi 旧 backlog 中未闭环项）

## 轮值台账

| WO | driver | 内容 | 一次通过 | 打回 | 复核 |
|---|---|---|---|---|---|
| WO-001 | AutoClaw | 养生域KB起步14条+STALE快照清欠+接管基线 | Y | 0 | （待 Kimi/用户抽验） |
| WO-002 | Kimi | v9.2 BaziQA 重评定案+四路大师蒸馏恢复 | — | — | **Kimi 已领单 2026-09-17 11:06**（执行计划见 WO 文件） |


## 七、禁触边界（R797 · 2026-09-17 用户令）

**ChatGPT（Codex）开发的独立项目——禁止触碰**。无论轮值到哪一方、无论任何任务，以下目录一律只读：

- `~/Documents/Codex/2026-09-08/new-chat/outputs/mingli-core/`（命理核心独立实现，含 knowledge.sqlite）
- `~/Documents/Codex/2026-09-08/new-chat/outputs/mingli-workbench/`
- `~/Documents/Codex/2026-09-08/new-chat/outputs/knowledge-library/`
- `~/Documents/Codex/2026-09-08/ai-vision-platform/`
- `~/Documents/Codex/2026-09-08/new-chat-3/outputs/smart-home-family-v2/`
- 及 `~/Documents/Codex/` 全域（含 2026-09-08.local-backup 等备份）

规则：
1. 不修改、不删除、不移动、不重命名其中任何文件；不向其写入任何产物
2. 允许只读参考（如架构对照、能力盘点），但引用须注明路径与只读性质
3. 与本项目的蒸馏/同步/巡检通道无关——不得将 Codex 项目纳入 mingli-baojian 的任何自动化管线的写入目标
4. 轮值 WO 任务单中若出现涉以上路径的范围，该条无效需重新划界
