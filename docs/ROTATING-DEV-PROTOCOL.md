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

## 四、冲突防护（两侧同时写库防护）

- **分支纪律**：driver 在 `main` 直接提交（单人周期内）；reviewer 复核期只读不写
- **KB 写入唯一通道**：无论谁 driver，写库必须走 R793 守卫（kb-sync-guard.py），红线不因轮值而放宽
- **Git 为准**：任何一侧发现对方产出与 CHANGELOG 不符 → 开 WO-<n>-audit 审计单，暂停新开发直到定性

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
