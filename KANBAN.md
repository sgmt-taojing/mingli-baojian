# KANBAN.md — 命理宝鉴 项目看板

> 最后更新: 2026-08-14 15:00 CST（心跳·8服务全绿·KB今日+16条入库·MLX仍v5@8960）

## 08-14 R713 故障处理（10:30）

- **事件**：08-14 08:50 起 health-patrol 持续报异常（峰值 13 项），10:06 系统重启后服务陆续拉起，但 api-v2(8920) crash loop（stderr `ERR_SQLITE_ERROR: database is locked`，根因：重启后 Spotlight 重建索引 I/O 风暴 500-660MB/s → SQLite 大查询饿死）
- **处理**：确认 8960/8913 为脚本超时误报（已修真 health-patrol.sh：8913 3s→8s+retry、8960 5s→15s+retry）；api-v2 kickstart 后恢复（149 端点正常）
- **⚠️ MLX 状态修正**：实际 8960 跑的是 **mingli-sft-v5**（launchd plist 于 08-14 09:32 被改回 v5，mtime 可证），8950 端口无监听、v6 未在生产！R712 记录「8950 已切 v6」与实际不符，v6 iter100 仍需重新部署（或先解决知识缺陷）
- **服务终态**：8900/8901/8911/8912/8913/8914/8920/8960 全部 200，内存 49%
- **根因待查**：08-14 09:32 是谁把 plist 回滚 v5（疑似为保服务稳定手动回退，需用户确认 v6 是否重新上线）

## 进行中

### #1 MLX v6 模型训练迭代
- **节点**: ⚠️ 实际回退 v5@8960（plist 09:32 被改回），v6 iter100 曾部署 8950 但现无监听
- **训练参数**: Qwen2.5-3B + LoRA rank=8 / lr=2e-5 / mask_prompt=true / grad_checkpoint / max_seq=2048 / batch=2
- **训练数据**: DPO→SFT 829 train + 92 val（102 模块覆盖）
- **val loss**: 3.063 → 1.849（iter 1→100，-40%）
- **硬件限制**: 16GB Mac mini 无法同时跑训练+推理（Peak mem 10.7GB + 系统 4GB + swap 11GB → OOM）
- **下一步**: ① 云端 GPU 续训到 600 iters ② 补充太岁/文昌专项 SFT 数据 ③ 确认 v6 重新上线计划（当前生产 v5）

### #2 公共能力包市场（capability-market）
- **节点**: 4/6（规划→注册表→模板→匹配器→自进化脚本→实际运营）
- **进度**: 6 大能力包已注册 + matcher 6 场景全绿 + evolve 4 场景全绿（无新推进）
- **下一步**: 对接第一个外部训练需求验证完整流程

### #3 AI 助手语音 + KB 实时互通
- **节点**: 2/3（语音识别→KB实时查询→流式卡片渲染）
- **进度**: R697 已提交（500ms 防抖 + 流式卡片 + 自动续接）
- **下一步**: 端到端延迟优化（P95 < 1.5s 验收）

### #4 多源实时交互诊断闭环（R694）
- **节点**: 5/5（采集→四路并行→分层结论→医生审核处方→进化预留）✅ 已完结
- **进度**: commit `a18788f` + `901dd37`，四路引擎 + SSE + 处方签发/驳回 + 前端页面 + 导航入口。实测端到端 1.5s
- **下一步**: mode=auto 无人化自主诊断（可配置跳过医生审核）

## 已完结

| 日期 | 任务 | 产出物 |
|------|------|--------|
| 2026-08-14 | 心跳: KB今日+16条入库(LZ-CASE紫微案例5+其他) | kb_formal 47055 |
| 2026-08-13 | R712: MLX v6 iter100 生产上线 8950 | launchd plist 更新 + v6 adapter 部署 |
| 2026-08-12 | 日结健康检查 6 服务全绿 | .openclaw/tmp/health-today.log |
| 2026-08-12 | R103-v2: 蒸馏出站管线 + 视觉注册表 | commit `d903709` |
| 2026-08-12 | R711: KB 检索修真 + activate-routes | commit `8258dd1` |
| 2026-08-12 | desktop PDFs/DOCX 蒸馏 10 条 KB-NIGHT 入库 | commit `439a301`（KB 44409+） |
| 2026-08-12 | i18n 报告翻译覆盖修真到 94% | commit `2be79ff` |
| 2026-08-11 | R709: MLX v5 启动预热修真 | commit `227d17c`（ThreadingHTTPServer + ready 字段 + daemon 预热） |
| 2026-08-11 | R710: server 同步 lang 优先级修真 + MLX_BASE 硬绑定 | commit `2fda255` |
| 2026-08-11 | R708+: 23页 i18n.js?v=708i 缓存戳 + 精准推荐标题修真 + 字典扩 precise+wellness+lucky | commit `69d20fc` |
| 2026-08-11 | 节气展示修真（区分当天/期间） | commit `97dbe2c` |
| 2026-08-11 | R708: 5页导航 data-i18n 标注 + 全站 23 页英文渲染验证 | commit `3fa2207` |
| 2026-08-11 | R706: 7排盘API双语完整闭环 | _translatePaipan/Ziwei/Qimen/Liuyao/Liuren/MeiHua/Fengshui + 7前端lang对接 |
| 2026-08-11 | R706: 10核心页i18n基础设施接入 | paipan-center/tcm-portal/tcm-clinic/voice-consult/camera-capture/kb-explorer/report-interpret/lifeplan-detail/clinic-consultation/naming-portal |
| 2026-08-11 | R706: divination-hub data-i18n标注 + 6语言包hub key | heroBadge/divination/tcm/knowledge/wearable |
| 2026-08-11 | R705: MLX v5推理路由修真 | /v1/models 路由 + launchd 冷启动 |
| 2026-08-11 | R705: region-banner公共横幅组件 | 9页自动海外免责 + bazi模板script转义 |
| 2026-08-11 | R705: bazi排盘lang=en前端对接 | 5处英文适配 + 5页data-i18n标注 |
| 2026-08-11 | R705: index-global 合规过滤 | 6模块cat标注 + region-config过滤 |
| 2026-08-11 | R704: 国内外版本混淆全面修真 | i18n引擎修复+knowledge映射87处+/app双前缀54处+bazi模板修真 |
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

- **R709**（commit `227d17c`）：MLX 启动预热 — ThreadingHTTPServer + ready 字段 + 启动时后台线程跑一次 dummy 推理触发 compile
  - 修真：HTTPServer 单线程假死（客户端 abort → 连接卡死）→ ThreadingHTTPServer + daemon_threads + socket timeout 120s
  - 修真：模型懒加载导致 health 启动期 000 → ready 字段标记（starting/ok），health 永不误判
  - 修真：首次推理 ~40s（compile 首次）→ 启动时后台线程预热，消灭首请求延迟
  - 实测：33s ready=true，首次推理 21.6s（含 compile，正常），之后 ~2-5s
  - 服务终态：8920 API 单实例 200 + 8950 MLX ready:true
  - 提交：227d17c（main+submodule 同步）
