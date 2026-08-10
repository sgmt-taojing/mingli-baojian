# KANBAN.md — 命理宝鉴 项目看板

> 最后更新: 2026-08-11 06:20 CST（停滞告警后盘点：实际有 R702-R705 + 蒸馏闭环推进未上板）

## 进行中

### #1 蒸馏闭环常态化
- **节点**: 4/5（采集→KB检查→蒸馏入库→审核上线→反馈闭环）
- **进度**: 低分反馈提取 + KB覆盖检查 + 蒸馏入库已验证 ✅；**feedback loop 已打通**（commit ac32801，aggregator→staging 带噪声过滤）✅；3 个 launchd cron 已挂载（auto-distill / distill-link / distill-feedback-loop）✅；08-11 03:45 自动蒸馏运行：流年班 PDF×2 + 天相天梁 pptx → 12 词条入库（ziwei 模块，KB 总量 44399）
- **阻塞**: staging 中 2 条待审核词条（仅剩审核上线节点）
- **下一步**: 审核 staging 2 词条 → 验证全自动闭环跑满 5/5

### #2 公共能力包市场（capability-market）
- **节点**: 4/6（规划→注册表→模板→匹配器→自进化脚本→实际运营）
- **进度**: 6 大能力包已注册 + matcher 6 场景全绿 + evolve 4 场景全绿
- **下一步**: 对接第一个外部训练需求验证完整流程

### #3 AI 助手语音 + KB 实时互通
- **节点**: 2/3（语音识别→KB实时查询→流式卡片渲染）
- **进度**: R697 已提交（500ms 防抖 + 流式卡片 + 自动续接）
- **下一步**: 端到端延迟优化（P95 < 1.5s 验收）

### #4 多源实时交互诊断闭环（R694）
- **节点**: 5/5（采集→四路并行→分层结论→医生审核处方→进化预留）
- **进度**: commit `a18788f` + `901dd37`，四路引擎 + SSE + 处方签发/驳回 + 前端页面 + 导航入口
- **实测**: 端到端 1.5s，诊断→处方→驳回全链路 ✓
- **下一步**: mode=auto 无人化自主诊断（医生审核步骤可配置跳过）

## 已完结

| 日期 | 任务 | 产出物 |
|------|------|--------|
| 2026-08-10 | 蒸馏闭环全链路验证 | distill-server.js module 透传修真 + 2 条 staging 词条 |
| 2026-08-10 | ai-vision-toolkit git 初始化 | commit 3ca0830, 70 文件入仓 |
| 2026-08-10 | Phase 6 评估（divination-core 全量拆分） | 结论：低优先级，不做全量拆分 |
| 2026-08-10 | 公共能力包市场落地 | `projects/_shared/capability-market/` (README+注册表+3模板+2脚本+6能力包) |
| 2026-08-10 | R698: 四路诊断导航入口 + demo-realtime canonical | commit 901dd37 |
| 2026-08-10 | R694: 多源实时诊断闭环（4路视觉+KB → 医生处方） | commit a18788f |
| 2026-08-09 | R697: 语音实时KB互通 | commit 33faabf |
| 2026-08-09 | 安全清理（gitignore + README 保密声明） | commit c1e94c0 |
| 2026-08-07~08 | P0-任务1: KB优先+后端AI兜底双路径 | 三级分级匹配 + 命中率统计 |
| 2026-08-07~08 | P0-任务2: 暴露后台API给H5 (16个) | app/my-yuanzhu.html |
| 2026-08-07~08 | P1-任务3: music/lifeindex/lifeplan KB兜底 | _MODULE_REPORTS 901行 |
| 2026-08-07~08 | P1-任务4: lifeplan蓝图化 | lifeplan-detail.html + 时间轴 |
| 2026-08-06 | R695: Critic交叉验证 | commit 4f149a4 |
| 2026-08-11 | R503: collab region参数化 + 排盘页i18n全接入 | commit cd09aab |
| 2026-08-11 | R502: 国内/海外版本隔离 | commit 2670e55 |
| 2026-08-11 | R501: 全球方剂接入诊断链 | commit 409ab21 |
| 2026-08-10 | R500: 类iPhone激活流程 | commit b528625 |
| 2026-08-10 | R499: 全球传统医学方剂库 | commit 30ea2eb |
| 2026-08-10 | R498: 出海i18n框架+合规分层 | commit be1b5e0 |
| 2026-08-10 | R497f: 双源融合置信(无人化) | commit 11119bf |
| 2026-08-10 | R497e: autopilot放行 | commit 4f34367 |
| 2026-08-10 | R497d: 采集自动提交闭环 | commit d07d3ee |
| 2026-08-10 | R497c: 语音流式KB+视觉连续采集 | commit b5088d1 |
| 2026-08-10 | R497b: 安全闸门+医生认证 | commit d56a382 |
| 2026-08-05 | R497: 四方实时协作诊断工作台 | commit aa20a96 |
| 2026-08-04 | R693: console.log清零 + AI味文案清零 | commit 1909bf0 |
| 2026-08-03 | R689: pre-commit 接入 health-check-all | commit 5e7e6cb |
| 2026-08-02 | R688: divination-hub 按需加载 | commit 8d6dbd0 |
| 2026-08-01 | R494: prescription matcher 方剂闭环 | commit f121082 |
| 2026-07-31 | R687: PWA PNG 图标 | commit 7568d25 |
| 2026-08-11 | R705: i18n-engine 接入 5 核心页（cn-global 拆分） | commit d66269e |
| 2026-08-11 | R704: knowledge路径修真(87处) + /app/双前缀修真(54处) + sft v3 null guard | commit 8b222b7 / 47ca230 / 4c9d454 |
| 2026-08-11 | R703: cn-global i18n 键统一修真 | commit 1d7d310 |
| 2026-08-11 | R702: 排盘API英文转换层(lang=en) + server/ 独立 git 仓库化 + distill feedback loop | commit ae59a50 / c199f95 / ac32801 |
| 2026-08-11 | 蒸馏闭环 cron 自动运行（03:45 增量 3 文件→12 词条） | .distill-progress.json |

## 冻结/低优先级

| 任务 | 原因 |
|------|------|
| Phase 6 divination-core 全量拆分 | 26 个 runXxx 仅 0.1KB 薄 wrapper，gzip 旧 core 717KB，收益低 |
| 五行音乐生成器 | KB 兜底已完成，生谱引擎暂缓 |

## 阻塞项

_无_
