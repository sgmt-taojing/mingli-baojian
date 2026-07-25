# #15 KB 直答命中率 Dashboard · 节点 1 调研报告

> **任务**：`#15 · AI 助手 KB 直答命中率 Dashboard`
> **优先级**：P3（断网 100% + AI 助手 22 模块全可用 后的延伸需求）
> **节点**：1/4 — 现状调研 + 架构设计
> **报告日期**：2026-07-25 13:00（心跳 #15 启动）
> **作者**：总指挥 main session

---

## 1. 执行摘要

P0/P1/#14 全部完结后，AI 助手 KB 直答路径已有完整数据采集：
- **前端** `app/ai-assistant.html:295-310` 通过 `_kbHitCount(moduleId, kbEntryId)` 累计 localStorage + 异步 POST `/api/public/kb-hit`
- **后端** `server/api-server-v2.js:654-678` `GET /api/ai/kb-hit-stats` 返回 `{ total, today, topQueries, bySource }`
- **缺**：可视化页面（运营/产品看板上无法直观判断 KB 命中效果）

#15 目标：补 1 个 dashboard 页面 + 1 条端到端监测脚本，让命中率达 ≥40% 后能直观验证 AGENTS.md P0-任务1 验收。

---

## 2. 现状数据流

```
用户提问
  ↓
ai-assistant.html _matchKbFirst()  →  best KB entry
  ↓
命中分 ≥0.7 → 直接答 + 累计 localStorage['_kb_hit_count/<moduleId>']
            → 异步 POST /api/public/kb-hit  { entry_id, app_endpoint, user_query }
  ↓
落 kb_hit_log 表 (kb.db) — 字段：id / query / hits / module / source / response_time / created_at
  ↓
GET /api/ai/kb-hit-stats 返回聚合：
   · total         累计命中次数
   · today         今日命中次数
   · topQueries    TOP10 高频 query + 次数
   · bySource      按 source 分布 + 次数
```

---

## 3. 4 节点拆解

| 节点 | 标题 | 产出 | 估时 |
|------|------|------|------|
| **15.1** | 现状调研 + 架构设计 | 本报告 | ✅ |
| **15.2** | KB 命中率 Dashboard 页面 | `app/admin/kb-hit-dashboard.html`（4 卡片 + 2 表格 + 1 时间线） | 20 min |
| **15.3** | 后端补 `?range=7d` 时间窗口 + byModule 维度 | `server/api-server-v2.js` + 10 行 | 10 min |
| **15.4** | 端到端验收 + KANBAN 更新 | scan-all + 实测 200 + commit | 10 min |

**不派 worker 拆分**：节点 2-4 总量 40 min，1 个 Worker 串行最稳（避免 sqlite 锁竞争 — 同 #7 经验）。

---

## 4. 节点 2 Dashboard 设计

### 4.1 视觉布局

```
┌─────────────────────────────────────────────────┐
│  KB 直答命中率 Dashboard        [刷新] [导出 JSON]│
├─────────────────────────────────────────────────┤
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐    │
│ │ 总命中  │ │ 今日   │ │ 命中模块 │ │ 平均延迟 │  ← 4 卡片
│ │ 12,438 │ │   286  │ │   42   │ │  35 ms  │    │
│ └────────┘ └────────┘ └────────┘ └────────┘    │
├─────────────────────────────────────────────────┤
│ ┌──────────────────┐ ┌──────────────────┐      │
│ │ TOP10 高频 Query  │ │ 按 source 分布    │ ← 2 表格
│ │ (含次数)          │ │ (含次数 / 占比)   │      │
│ └──────────────────┘ └──────────────────┘      │
├─────────────────────────────────────────────────┤
│ 最近 24h 命中趋势（柱状图 24 根）                │
└─────────────────────────────────────────────────┘
```

### 4.2 数据来源

| 卡片/图表 | API | 字段 |
|-----------|-----|------|
| 总命中 | `/api/ai/kb-hit-stats` | `total` |
| 今日 | 同 | `today` |
| 命中模块 | 新增 byModule 维度 | `byModule` |
| 平均延迟 | 新增 avgResponseTime | `avgMs` |
| TOP10 Query | 现有 | `topQueries` |
| 按 source | 现有 | `bySource` |
| 24h 趋势 | 新增 ?range=24h | `hourlyHits[]` |

### 4.3 集成入口

- admin 导航：`app/admin/dashboard.html`（可观测性已有）侧栏加「KB 命中」
- AI 助手侧栏：showWelcome 卡片「今日 KB 直答 N 次」旁边加「→ 看大盘」链接
- 路由：H5 静态 8914 直接访问 `app/admin/kb-hit-dashboard.html`

---

## 5. 风险与边界

| 风险 | 等级 | 缓解 |
|------|------|------|
| KB DB 在 macOS 路径权限差异 | 🟡 | scan-all 验证 |
| 12,438 条目级命中但 0 个完整 query 维度 | 🟢 | 已有 `kb_hit_log.query` 字段，无须迁移 |
| 第三方可视化（Chart.js 70KB） | 🟡 | 用 CSS 柱状图（参考 #6.4 admin/dashboard.html） |
| 命中率口径歧义（按条数 vs 按 query 数） | 🟢 | 文档明确「按 hits 累计」 |

---

## 6. 验收清单

- [ ] 后端新增 `?range=24h|7d|30d` 参数返回 `hourlyHits[]` + `byModule[]` + `avgMs`
- [ ] Dashboard 页面 4 卡片 + 2 表格 + 24h 柱状图
- [ ] 端到端实测：curl `/api/ai/kb-hit-stats?range=7d` → JSON 完整
- [ ] scan-all.js 0 错误
- [ ] 集成到 admin/dashboard.html 导航
- [ ] 集成到 AI 助手 showWelcome「→ 看大盘」按钮
- [ ] KANBAN #15 节点进度推进到 4/4

---

## 7. 后续可扩展（不属 #15 范围）

- 按用户分群命中率（注册/会员/游客）
- 命中率环比（今日 vs 昨日）
- KB 模块覆盖率矩阵（应有 KB 但 0 命中模块标红）
- 自动告警：连续 3 天命中率 < 40% → 推送
- LLM 兜底 fallback 路径可视化

---

**调研完成时间**：2026-07-25 13:05
**后续动作**：派 Worker 串行执行节点 2-4（约 40 min）