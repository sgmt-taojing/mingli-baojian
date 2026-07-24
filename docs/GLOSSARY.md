# 命理宝鉴 · 文档 → 规范映射词典

> **最后更新**：2026-07-25 06:18
> **用途**：每个核心概念/规范/任务 → 对应文档快速跳转

## A-C

| 概念 | 规范引用 | 主要文档 |
|------|---------|---------|
| A11Y (WCAG 2.1 AA) | WCAG | docs/A11Y_AUDIT_v1.md |
| API 设计规范 | API_STANDARD | docs/API_STANDARD.md |
| API 端点测试 | T-1/T-2 | tests/integration/api-endpoints.test.js |
| API 契约测试 | T-1/T-2 | tests/contract/api-contract.test.js |
| AutoClaw | — | MECHANISM.md（顶层架构） |
| 八字 KB | KB-A1 | knowledge/bazi-knowledge-base.js |
| 编译型错误处理 | T-3 | docs/ERROR_HANDLING_v1.md |
| 变更发布管理 | D-4 | docs/RELEASE_MANAGEMENT_v1.md |

## D-F

| 概念 | 规范引用 | 主要文档 |
|------|---------|---------|
| 错误码体系 | E-1 | server/api-response.js |
| 待办列表 | — | KANBAN.md |
| 端到端测试 | T-2 | tests/integration/ |
| 二级索引（KB） | R12 | （规划中） |
| 服饰类会员 | P-1 | docs/DIVINATION_MEMBERSHIP_v1.md |
| 风水 KB | KB-A1 | knowledge/fengshui-knowledge-base.js |
| 服务端口 | — | TOOLS.md |

## G-I

| 概念 | 规范引用 | 主要文档 |
|------|---------|---------|
| GDPR 合规 | PIPL/GDPR | docs/PRIVACY_COMPLIANCE_v1.md |
| 工具脚本约定 | OPS-1 | AGENTS.md |
| 共享状态层 | M-1 | KANBAN.md / MEMORY.md |
| 滚动发布 | D-4 | docs/RELEASE_MANAGEMENT_v1.md |
| 国际版 KB | KB-I18N | knowledge/i18n/ |
| 后端 API 暴露 | API-PUB | docs/API_ENDPOINTS_PUBLIC.md |
| i18n 抽离 | T-4 | docs/I18N_AUDIT_v1.md |

## J-L

| 概念 | 规范引用 | 主要文档 |
|------|---------|---------|
| 集中式状态 | M-1 | KANBAN.md |
| 健康检查 | OPS-2 | HEARTBEAT.md |
| KB 审计 | KB-AUDIT | docs/KB_AUDIT_v*.md |
| KANBAN 机制 | — | KANBAN.md |
| 客户管理 | P-2 | docs/YUANZHU_MANAGEMENT_v1.md |
| 跨任务完成度 | OPS-3 | AGENTS.md |

## M-O

| 概念 | 规范引用 | 主要文档 |
|------|---------|---------|
| 命理类用户 | — | docs/USER_PROFILE_DEMOGRAPHICS.md |
| 命相同参（路总理念）| NEW-1 | knowledge/mingxiang-cross-kb.js |
| 面诊 KB | KB-A1 | knowledge/tcm-diagnosis-kb.js |
| 倪师人纪 | KB-NS | knowledge/nihaisha-knowledge-base.js |
| 排序推荐 | R12 | （规划中） |
| PIPL 合规 | PIPL 第 14/24/45/47 | docs/PRIVACY_COMPLIANCE_v1.md |
| openclaw 配置 | — | ~/.openclaw-autoclaw/ |

## P-R

| 概念 | 规范引用 | 主要文档 |
|------|---------|---------|
| Pact 契约 | T-2 | pacts/ |
| Performance 基线 | P-1 | docs/PERFORMANCE_BASELINE_v1.md |
| Privacy API | PIPL/GDPR | docs/PRIVACY_ENDPOINTS_v1.md |
| 奇门 KB | KB-A1 | knowledge/qimen-knowledge-base.js |
| 全量扫描脚本 | OPS-1 | ~/.openclaw-autoclaw/workspace/.openclaw/tmp/scan-*.js |
| 日结 cron | OPS-2 | cron `bee9eb0e` |
| Rokid 穿戴 SDK | W-1 | js/wearable/rokid-bridge.js |

## S-U

| 概念 | 规范引用 | 主要文档 |
|------|---------|---------|
| 三步闭环 | M-1 | MECHANISM.md |
| 山农甲六壬 KB | KB-A1 | knowledge/liuren-knowledge-base.js |
| 十二长生 KB | KB-A1 | knowledge/r39-*.js |
| 时辰推算 | — | server/paipan-server.js |
| 双分支同步 | D-4 | MEMORY.md「Git 双分支」 |
| 田纪 KB（舒晗密宗）| KB-SH | knowledge/shuhan-*.js |
| 推送 API | PUSH-1 | server/api-server-v2.js |
| 推盘 KB | KB-A1 | knowledge/liuyao-knowledge-base.js |
| 拓展模块（KB）| KB-A2 | knowledge/extended/ |

## V-Z

| 概念 | 规范引用 | 主要文档 |
|------|---------|---------|
| Wearable 集成 | W-1 | docs/SMART_GLASS_INTEGRATION_v2.md |
| 网络策略 | OPS-4 | MEMORY.md「网络策略」 |
| 五行权重 | KB-A3 | knowledge/wuxing-data.js |
| 心跳机制 | OPS-2 | HEARTBEAT.md |
| 玄学类会员 | P-1 | docs/DIVINATION_MEMBERSHIP_v1.md |
| 演化规则 | EVO-1 | MEMORY.md「演化规则」 |
| 一级路由 | API-1 | server/api-server-v2.js |
| 月度审计 | KB-AUDIT | .openclaw/tmp/nightly-kb-audit.js |
| 知识库审计 | KB-AUDIT | docs/KB_AUDIT_*.md |
| 子代理机制 | OPS-5 | AGENTS.md |
| 子代理超时 | EVO-stuck | MEMORY.md「stuck-subagent-recovery」 |
| 综合统计 | KB-AUDIT | docs/KB_AUDIT_v*.md |

## 命名规则

- **M-1** = 总机制（顶层）
- **T-1/T-2/T-3/T-4** = 测试/契约/错误处理/国际化
- **D-1/D-2/D-3/D-4** = 文档治理/链接失效/CI/变更发布
- **KB-A1/KB-A2/KB-A3/KB-AUDIT** = KB 核心/扩展/权重/审计
- **E-1** = 错误码
- **API-* / PUSH-1 / PRIVACY-*** = API 规范
- **OPS-1/OPS-2/OPS-3/OPS-4/OPS-5** = 运维约定
- **EVO-*** = 演化规则
- **NEW-1** = 新创概念
- **W-1** = 穿戴 SDK

## 引用规范

- 命名引用：`见 {文档路径}`（绝对路径优先）
- 章节引用：`见 {文档}#{章节标题}`
- 跨项目引用：`见 ~/其他项目/...`