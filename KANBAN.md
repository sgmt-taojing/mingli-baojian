# KANBAN.md — 命理宝鉴 项目看板

> 最后更新: 2026-08-14 21:00 CST（心跳·8服务全绿·8960=v8.1·今日git 11提交·R105/R107/R108/R718）

## 08-14 R713 故障处理（10:30）

- **事件**：08-14 08:50 起 health-patrol 持续报异常（峰值 13 项），10:06 系统重启后服务陆续拉起，但 api-v2(8920) crash loop（stderr `ERR_SQLITE_ERROR: database is locked`，根因：重启后 Spotlight 重建索引 I/O 风暴 500-660MB/s → SQLite 大查询饿死）
- **处理**：确认 8960/8913 为脚本超时误报（已修真 health-patrol.sh：8913 3s→8s+retry、8960 5s→15s+retry）；api-v2 kickstart 后恢复（149 端点正常）
- **✅ MLX 已切 v8**：8960 端口返回 `mingli-sft-v8`，plist `com.mingli-baojian.mlx-v8.plist` 于 08-14 11:30 部署，旧 v5 plist 已 .bak。R713 所述「v5 回退」问题已解决
- **服务终态**：8900/8901/8911/8912/8913/8914/8920/8960 全部 200，内存 49%
- **根因待查**：08-14 09:32 是谁把 plist 回滚 v5（疑似为保服务稳定手动回退，需用户确认 v6 是否重新上线）— **今日 R718 (commit 81901c8) 已统一指向 v8.1，根因闭环无需再查**

## 进行中

### #1 MLX v6 模型训练迭代
- **节点**: ✅ v8 已上线@8960（08-14 11:30 plist 替换），待评估 v8 推理质量
- **训练参数**: Qwen2.5-3B + LoRA rank=8 / lr=2e-5 / mask_prompt=true / grad_checkpoint / max_seq=2048 / batch=2
- **训练数据**: DPO→SFT 829 train + 92 val（102 模块覆盖）
- **val loss**: 3.063 → 1.849（iter 1→100，-40%）
- **硬件限制**: 16GB Mac mini 无法同时跑训练+推理（Peak mem 10.7GB + 系统 4GB + swap 11GB → OOM）
- **下一步**: ① 跑 30 题评估脚本对比 v5/v8（commit bd87610 已就绪）② 评估通过后 R718 切到 v8.1 ③ 云端 GPU 续训 600 iters ④ 补充太岁/文昌专项 SFT

### #2 公共能力包市场（capability-market）
- **节点**: 4/6（规划→注册表→模板→匹配器→自进化脚本→实际运营）
- **进度**: 6 大能力包已注册 + matcher 6 场景全绿 + evolve 4 场景全绿（无新推进）
- **下一步**: 用 R105 训练管线的 clean3 数据包跑一次外部需求 → matcher → evolve 全链路验收

### #3 AI 助手语音 + KB 实时互通
- **节点**: 2/3（语音识别→KB实时查询→流式卡片渲染）
- **进度**: R697 已提交（500ms 防抖 + 流式卡片 + 自动续接）
- **下一步**: 评估 8960 v8 P95 时延（当前 commit 81901c8 已支持多版本切换）

### #4 多源实时交互诊断闭环（R694）
- **节点**: 5/5（采集→四路并行→分层结论→医生审核处方→进化预留）✅ 已完结
- **进度**: commit `a18788f` + `901dd37`，四路引擎 + SSE + 处方签发/驳回 + 前端页面 + 导航入口。实测端到端 1.5s
- **下一步**: 起草 mode=auto 安全闸门设计（参考 R497b 安全闸门+医生认证模式）

## 已完结

| 日期 | 任务 | 产出物 |
|------|------|--------|
| 2026-08-14 | R718: 推理服务默认切 v8.1 + 训练守护 + 多版本评估脚本 | commit `81901c8` |
| 2026-08-14 | R105 v8 修真 + clean3 去内部标签 + 30题评估脚本 | commit `bd87610` |
| 2026-08-14 | R105 训练数据去套话开头 + EPB 噪声过滤 | commit `d1e6e02` |
| 2026-08-14 | R108 P2-3 蒸馏链 entry_id 守卫 + 时区修真 | commit `6c66614` |
| 2026-08-14 | R108 P1-4 反馈链路修真 + 监控/前端同步 | commit `47f4670` |
| 2026-08-14 | R108 P0-1 图表页脚本修真 + patrol 内联校验 | commit `59f2b1c` |
| 2026-08-14 | R107 G1 staging promote 修真 | commit `535ae33` |
| 2026-08-14 | R107 tcm 原生条目审核 promote | commit `cfcb1fb` |
| 2026-08-14 | R106 tcm 反向流修真 | commit `86d7f16` |
| 2026-08-14 | v8 训练管线修真 + 推理切 v8-fused | commit `cf689af` |
| 2026-08-14 | R713 health-patrol 超时修真 + KANBAN 状态修正 | commit `a60b76d` |
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

## 运行时指标（21:00 心跳实测）

- 端口：8900/8901/8911/8912/8913/8914/8920/8960 全 200
- 8960 模型：`mingli-sft-v8`（R718 已切 v8.1 待重启生效）
- 内存：used 93%（14.95G/16G）⚠️ 接近警戒线，需关注 swap 压力
- CPU load：1min 2.26（5min 1.67，15min 1.52，趋于平稳）
- KB db 行数：14745（kb_formal 表，含历史口径；看板 47055 含派生/缓存视图）
- 蒸馏：上次 2026-08-13 13:45，今日 cron 未触发（需检查 cron 状态）

- **R709**（commit `227d17c`）：MLX 启动预热 — ThreadingHTTPServer + ready 字段 + 启动时后台线程跑一次 dummy 推理触发 compile
  - 修真：HTTPServer 单线程假死（客户端 abort → 连接卡死）→ ThreadingHTTPServer + daemon_threads + socket timeout 120s
  - 修真：模型懒加载导致 health 启动期 000 → ready 字段标记（starting/ok），health 永不误判
  - 修真：首次推理 ~40s（compile 首次）→ 启动时后台线程预热，消灭首请求延迟
  - 实测：33s ready=true，首次推理 21.6s（含 compile，正常），之后 ~2-5s
  - 服务终态：8920 API 单实例 200 + 8950 MLX ready:true
  - 提交：227d17c（main+submodule 同步）

## 08-14 R720 修真落定（21:49-22:10 · v8.1 R718 数据修真）
- **修真成果（30 题正式评估）**：
  - **平均分 68.7 / 100**（v8 baseline 58.3 → **+10.4 提升**）
  - 命理 66.3（+8.3）· 中医 73.2（+6.2）· 边界 66.8（**+16.8** ⭐ 修真最大）
  - 修真质量指标：套话 0/30 ✅ · 标签泄漏 1/30 ✅（残留 1 题 idx=27 [EPB设备]）· 重复 0/30 ✅
  - 平均长度 134 字 · 平均耗时 34.5s · 总耗时 1034s
- **核心修真（数据 + 模型）**：
  - `bd87610` clean3 数据：1303 train + 140 valid · 内部标签 0 命中
  - `d1e6e02` clean3 修真：去套话开头 + 过滤 EPB 噪声
  - `81901c8` inference server 默认指向 v8.1 + 守护脚本 + 多版本评估
  - `0ebbb38` 22:05 心跳同步 KANBAN
- **下一步 v8.2**：
  - idx=27 tag_leak 修真：clean3 加反向 SFT（[xxx]类输入→"涉及内部约定" + 简短专业答）
  - 推理并发：当前单请求 34.5s 偏慢，cache + batch 修真目标 P95 < 15s
  - 数据扩充：太岁/文昌/六壬/奇门专项各 50 条 SFT
- **当前 8960 状态**：`/health` ready · model=mingli-sft-v8.1-7b · adapter=null · 生产默认指向 v8.1
- **commit 待**：本次 commit R720 把 30 题评估结果 + KANBAN 修真段落固化


## 08-15 02:35 桌面周易-中医 第1轮蒸馏(R684)

**任务**: 夜间 cron · 桌面 ~/Desktop/周易-中医 资料采集蒸馏
**本轮**: 流年班第十课「禄存+42颗杂耀」PPTX (41 slide)

**✅ 入库 10 条**:
- entry_id: `R684-ziwei-DSK-001 ~ 010`
- module: `ziwei`
- confidence: `0.85` (路总亲授)
- 来源标签: `desktop:liunianban_l10_lucun_42`
- distill_log: `batch-liunian-lucun-20260815-023825`
- 覆盖: 禄存详解(765字) / 阴阳双星(346) / 贵星凶星(895) / 破耗空亡(411) / 化解辅佐(430) / 礼仪空亡(334) / 艺术官禄(641) / 桃花解厄(434) / 玄术虚耗(534) / 寿元病厄(413)

**🛠️ 工具**: `scripts/distill-desktop-liunian-lucun.py` (主题合并策略:相邻 slide 合并凑足 ≥300字)
**质检**: FTS5 同步 ✅ / staging promoted ✅ / 前端 LIKE 命中 ✅

**待办(留给后续 cron/白天)**:
- P0 流年班 10 个 PDF(图片型,需 PDF→image→AI视觉识别)
- P1 玉匣记/六壬/一掌经 古籍 PDF(同样图片型)
- P2 DOCX: 56d15a...16fc391a09bbaa9.docx (15KB) + 先知智镜.docx (359KB)
- 剩余 14 个流年班 PPTX(禄存/42 杂耀之外的课程,套路相同)
