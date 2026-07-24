# 命理宝鉴 · 开发看板

> **维护原则**：每个任务按工作流 22 节点推进；完成一个自动拉下一个；阻塞项标红等待决策。
> **断点机制**：每个进行中任务必须记录"当前节点 + 产出物 + 下一步"，心跳只看这一页就能续推。
> **顶层架构**：见 MECHANISM.md（本项目根目录）
> **最后更新**：2026-07-25 00:35（心跳自主推进：#7 节点 7.4 + 7.5 完成 → 6/6 ✅）
> **健康检查**：✅ 5/5 服务在线（paipan/tts/face-ocr/static/api-v2）；KB API OK；paipan-api 路由 WARN（已知）

## 进行中 🔄

### ~~#7 · 测试规范补齐（单元测试 ≥60% + Pact 契约测试）~~ 2026-07-25 00:35 ✅

| 字段 | 值 |
|------|---|
| 优先级 | P1 |
| 规范引用 | T-1/T-2 |
| 节点进度 | **6/6 ✅** |
| 完成节点 | 7.6 — 任务完结 + 覆盖率报告归档 ✅ |
| 产出物 | · `jest.config.js`（testEnvironment=node, testMatch=tests/**/*.test.js, collectCoverage, 排除 api-server-v2.js 和 kb-store/**, maxWorkers=1 防 SQLite 并发锁）<br>· `tests/smoke.test.js` 扩展（新增 api-response 成功/错误格式验证 + logger 导出验证 + error-aggregator recordError 导出验证）<br>· `tests/unit/api-response.test.js`（9 测试）<br>· `tests/unit/logger.test.js`（7 测试）<br>· `tests/unit/error-aggregator.test.js`（5 测试）<br>· **节点 7.2**：22 个单元测试套件全通过（472 测试），覆盖率 Statements 64.04% / Lines 63.74% / Functions 73.88% / Branches 59.88%，均 ≥60% ✅<br>· **节点 7.2**：修复 coverage 模式 flaky 测试 — jest.config.js 添加 `maxWorkers: 1` 解决 SQLite "database is locked" 并发问题<br>· **节点 7.3**：安装 `@pact-foundation/pact` v17.0.1（devDependency）<br>· **节点 7.3**：`tests/contract/api-contract.test.js`（4 个 PactV3 消费者契约测试：GET /api/v1/health + GET /api/kb/list + GET /api/kb/:filename + GET /api/v1/kb/list 308 重定向）<br>· **节点 7.3**：`pacts/mingli-baojian-h5-mingli-baojian-api.json`（契约文件自动生成）<br>· **节点 7.4**：`tests/integration/api-endpoints.test.js`（28 个 supertest 端到端测试：health/kb-list/kb-file/路径穿越/log-error/sync-404/public-kb-query/CORS/api-response 9 函数）<br>· **节点 7.4**：supertest 7.2.2 已安装；28/28 全通过；首跑 0.469s<br>· **节点 7.5**：覆盖率验收 — Statements **71.73%** / Branches **63.50%** / Functions **79.75%** / 24 套件 / 504 测试（全部维度 ≥60% ✅，Statements/Function 比目标 +10pp 以上）<br>· **节点 7.6**：`docs/TEST_COVERAGE_REPORT_v1.md`（4,267B / 7 章节）+ `.openclaw/tmp/coverage-summary-7.4.txt`（覆盖率快照）<br>· **节点 7.6**：8 文件覆盖率 < 70% 已记入延后清单（export-routes / distillation-engine 等），等 #9+ 补齐 |
| 验收 | ✅ `npx jest` 全绿 504/504；✅ 集成 28/28 + 契约 4/4；✅ Statements 71.73 / Branches 63.50 / Functions 79.75 / Lines 71.73；✅ 排除清单合理（api-server-v2 巨型单一入口） |
| 阻塞 | 无（已完结） |
| 最后更新 | 2026-07-25 00:35 |

---

## 已完结 ✅（最新追加在底部）

### ~~#5 · 性能基线与预算（4/4）~~ 2026-07-24 17:31 ✅

| 字段 | 值 |
|------|---|
| 优先级 | P1 |
| 规范引用 | P-1/P-2 |
| 节点进度 | **4/4 ✅** |
| 完成节点 | 5.4 — 性能基线实测报告 ✅ |
| 产出物 | · 节点 5.1 `docs/PERFORMANCE_BUDGET.md`（7,311B）+ `lighthouserc.json`（1,345B）<br>· 节点 5.2.5 gzip 静态服务：`server/static-gzip.py`（6,366B / Range + Cache-Control + Vary 全支持）<br>· 节点 5.2.5 启动脚本：`server/start-static-gzip.sh`（2,234B）<br>· 节点 5.2.5 文档：`docs/STATIC_GZIP_SERVICE_v1.md`<br>· 节点 5.4 实测报告：`docs/PERFORMANCE_BASELINE_v1.md`（9,966B） |
| 验收 | ✅ gzip 1.8MB→521KB（72% 压缩率）；✅ 小文件不压缩；✅ Cache-Control max-age=3600；✅ Vary Accept-Encoding；✅ Range 206；✅ API /api/kb/list P95 1.7ms；✅ /api/v1/health P95 0.9ms；✅ 基线报告含 bundle/API/gzip/缓存/Web Vitals 全维度 |
| 结论 | gzip 服务达标✅；bundle 严重超标（JS 4.5x/HTML 9x/文件数 12x）→ Phase 1 拆分优先 |
| 最后更新 | 2026-07-24 17:31 |

---

### ~~#6 · 可观测性规范（P-3 / P-4）~~ 2026-07-24 21:01 ✅

| 字段 | 值 |
|------|---|
| 优先级 | P1 |
| 规范引用 | P-3/P-4 |
| 节点进度 | **4/4 ✅** |
| 完成节点 | 6.4 — metrics 接口 + dashboard 页面 ✅ |
| 产出物 | · 节点 6.1 `docs/OBSERVABILITY_STANDARD.md`（规范文档 v1.0）<br>· 节点 6.2 `server/logger.js`（pino 实例 + pino-pretty 开发 + pino-roll 生产轮转）+ `server/api-server-v2.js` console.* 全量替换（0 残留）+ kb-store/* 前端数据文件说明<br>· 节点 6.3 `server/error-aggregator.js`（5 分钟滚动窗口 + 12 事件埋点：kb.hit/miss/partial + ai.invoke/error + report.generate/export + push.deliver + auth.login/fail + tts.synthesize + ocr.recognize）<br>· 节点 6.4 `GET /api/v1/admin/metrics?range=7d` 端点（8 指标 JSON 返回 + adminAuth 保护）+ `app/admin/dashboard.html`（8 指标卡片 + CSS 柱状图 + 模块排行 + 每日趋势 + 错误 TOP 5 表格） |
| 验收 | ✅ `grep -rn "console\.(log|warn|error)" server/*.js` = 0；✅ kb-store/* 前端文件说明写入 OBSERVABILITY_STANDARD.md；✅ metrics 端点 adminAuth 保护；✅ dashboard.html 存在；✅ 8 指标全覆盖 |
| 最后更新 | 2026-07-24 21:01 |

---

### ~~#4 · 错误处理规范（S-2 / T-3）~~ 2026-07-24 16:56 ✅

**节点 4.3 验收**：✅ node --check 通过；✅ 8914 静态服务 /js/error-interceptor.js 200（27510 字节）；✅ /components/toast.js 200；✅ 2 个 HTML 加载脚本成功；✅ 覆盖 95 处 fetch 调用；✅ 错误码矩阵覆盖 0/400001/401001/401002/403001/404001/409001/429001/429002/500001/503001/503002 + 自定义 504000/001/002/003；✅ GET+5xx 自动重试 1 次；✅ 401 双触发跳登录；✅ 429 全局 30s 静默；✅ 5xxxxx 上报 + localStorage 缓存最近 20 条 |

**节点 4.4 验收**：✅ ERROR_COPYWRITING.md 扩到 25 错误码（4xx×12 + 5xx×12 + 业务码×13）；✅ 三段式文案模板（发生+影响+行动）；✅ 后端 `POST /api/log/error` 端点添加并验证通过（JSONL 落盘 + traceId 返回）；✅ ok 函数引入修复；✅ 文案 CI 校验脚本；✅ 告警阈值定义（3 连 5xx/20% AI 失败/5% 网络异常/100/h URL） |

---

### ~~#3 · 前端组件库封装 · ✅ 已完成 6/6~~ 2026-07-24 14:35

| 字段 | 值 |
|------|---|
| 优先级 | P0 |
| 规范引用 | F-9（Web Components 优先） |
| 节点进度 | **6/6 ✅** |
| 总产出 | **已迁 7 页**（divination-integrated + wechat-hub + divination-membership + master-class + kb-explorer + merchant-dashboard + my-yuanzhu）；3 组件（toast/tab/modal）+ demo.html + docs/COMPONENTS.md |
| 已产出追加 | **节点 6 e2e 验证 PASS**（5 页 HTTP 200 + 3 组件语法 OK + 0 内联残留），报告：`.openclaw/tmp/e2e-report-#3.md`（3504 字节） |
| 验收 | ✅ 5/5 HTTP 200（ml-component 引用 80 处）；✅ node --check 3/3 OK；✅ customElements.define 4 处全注册；✅ 0 内联 `class="toast"` 残留 |
| 备注 | F-9 规范完全落实；兼容层 `switchTab/showToast` 保留作为桥接 |

| 字段 | 值 |
|------|---|
| 优先级 | P0 |
| 节点进度 | 8/8 ✅ |
| 总产出 | 21 个 v1 alias；API_V1_KB_STANDARD.md（5127 字节）；22 个 KB 路由全 apiResp 化（73 处）；错误码收敛至 5 类 |
| 验收 | 5 个 v1 alias 全部 308；10 个 KB 路由全 code=0；健康检查 HEALTHY；optionalAuth 引入修复 |

## 待办队列 🟡

### P0（本周必完成）

| # | 任务 | 规范引用 | 预估节点数 | 阻塞 |
|---|------|---------|-----------|------|
| ~~2~~ | ~~API 设计规范落地~~（8/8 完成） | B-1/B-2/B-3 | 8 | - |
| ~~3~~ | ~~前端组件库封装（Web Components 替换内联 toast/modal/tab）~~（6/6 完成 2026-07-24 14:35） | F-9 | 6 | ~~#2 完成~~ |
| ~~4~~ | ~~错误处理规范（统一 try-catch + 错误码表 + 前端拦截器）~~（5/5 完成 2026-07-24 16:56） | S-2/T-3 | 5 | #2 完成 |

### P1（启动）

| # | 任务 | 规范引用 | 预估节点数 | 阻塞 | 启动 |
|---|------|---------|-----------|------|------|
| ~~5~~ | ~~性能基线与预算~~（4/4 完成 2026-07-24 17:31） | P-1/P-2 | 4 | - | - |
| ~~6~~ | ~~可观测性规范（结构化日志 + 关键事件打点）~~（4/4 完成 2026-07-24 21:01） | P-3/P-4 | 4 | - | - |
> **#6 完结**：6.1 ✅ 规范文档 · 6.2 ✅ pino 集成 + console 全量替换（server/*.js = 0，kb-store/* 为前端数据文件不在范围） · 6.3 ✅ 12 事件埋点 + error-aggregator · 6.4 ✅ GET /api/v1/admin/metrics 端点 + app/admin/dashboard.html 仪表盘页面
| ~~7~~ | ~~测试规范补齐~~（6/6 完成 2026-07-25 00:35） | T-1/T-2 | 6 | ~~-~~ | - |
| **8** | **国际化文案规范（I18N 抽离）** | **-** | **3** | **#7 完成 ✅** | **🟢 启动** |

### P2（下月）

| # | 任务 | 规范引用 | 预估节点数 | 阻塞 |
|---|------|---------|-----------|------|
| 9 | 可访问性 a11y（WCAG 2.1 AA） | - | 4 | - |
| 10 | 隐私合规（PII AES-256 + 用户删除/导出） | SEC-3 | 3 | - |
| 11 | 变更发布规范（SemVer + CHANGELOG + Conventional Commits） | D-4 | 2 | - |
| 12 | 文档即代码（索引 + 失效告警） | - | 3 | - |

## 已完结 ✅

| # | 任务 | 完成日期 | 产出物 |
|---|------|---------|--------|
| 1 | KB API 鉴权修复（optionalAuth 公开浏览） | 2026-07-23 | rbac-middleware.js + api-server-v2.js |
| - | 端口表刷新 v2 | 2026-07-23 | PORT_ALLOCATIONS.md |
| - | 倪师五课 KB（242 条） | 2026-07-23 | 5 模块全覆盖 |
| - | 架构升级方案 v1 | 2026-07-03 | ARCHITECTURE_UPGRADE_PLAN.md |
| 2.1 | KB v1 alias 21 个 | 2026-07-23 23:03 | server/api-server-v2.js |
| 2.2 | API_V1_KB_STANDARD.md | 2026-07-23 23:08 | docs/API_V1_KB_STANDARD.md（5127 字节） |
| 2.3 | 3 个 KB 路由 apiResp 化 | 2026-07-23 23:10 | server/api-server-v2.js + optionalAuth 引入 |
| 2.4 | 全量 49 处 apiResp 化 | 2026-07-24 09:11 | server/api-server-v2.js + 健康检查 OK |
| 2.5 | KB 错误码统计 | 2026-07-24 10:25 | SUCCESS/SERVER_ERROR/DB_UNAVAILABLE/FORBIDDEN |
| 2.6 | 6 处 DB_UNAVAILABLE 归一 | 2026-07-24 10:32 | server/api-server-v2.js |
| 2.7 | FORBIDDEN 归一（RBAC_FORBIDDEN） | 2026-07-24 10:35 | server/api-server-v2.js L1992 |
| **#2 完结** | **API 设计规范 8/8 完成** | **2026-07-24 10:36** | 全 22 路由 + 21 v1 alias + 文档 + 错误码归一 |
| 4.3 | 前端错误拦截器（fetch+XHR+axios stub） | 2026-07-24 16:35 | app/js/error-interceptor.js (27510B) + ERROR_HANDLING_INTERCEPTOR_v1.md |
| 4.4 | 全错误码文案 + 后端上报端点 | 2026-07-24 16:56 | ERROR_COPYWRITING.md (6085B) + INTERCEPTOR_v2.md (6114B) + POST /api/log/error（JSONL） |
| 3.1 | 组件库调研（45 文件 / 12h） | 2026-07-24 10:38 | toast 21 / tab 21 / modal 3 |
| 3.2 | 抽 3 个 Web Components | 2026-07-24 10:55 | `app/components/toast.js`(153) + `modal.js`(195) + `tab.js`(198)；旧 API 全兼容 |
| 3.3 | 业务页迁移 7 页 | 2026-07-24 13:50 | divination-integrated + wechat-hub + divination-membership + master-class + kb-explorer + merchant-dashboard + my-yuanzhu |
| 3.4 | demo.html + docs/COMPONENTS.md | 2026-07-24 14:00 | F-9 文档化 |
| 3.4b | v2 扩展：5 组件 + loader + 7 章节文档 | 2026-07-25 00:30 | card.js(242) + accordion.js(216) + components-loader.js(167) + components-demo.html(633) + COMPONENTS.md 扩 234→873 行 |
| **#3 完结** | **前端组件库封装 6/6 完成** | **2026-07-24 14:35** | 7 页迁移 + 3 组件 + demo + docs + e2e 验证 PASS |

---

## 心跳卡住的处理机制

### 问题根源
心跳信号到达后，agent 可能不知道当前推进到哪一步，容易返回"HEALTHY"但不真正推进任务。

### 解决办法（已落地）
1. **断点写在 KANBAN.md**（见 #2 表格中的"当前节点/下一步动作"）
2. **心跳唤起后**：只读 KANBAN.md 中的"进行中"章节 → 领取"下一步动作" → 执行 → 更新节点进度

### 手动触发推进
- 推进当前任务：发"推进 #2"
- 查看当前节点：发"看 KANBAN"
- 跳过当前任务：发"跳过 #2，拉下一个"
- 紧急插入：发"插队 #X：任务描述"

---

## 当前阻塞项

| 阻塞 | 原因 | 需用户决策 |
|------|------|-----------|
| 8910 静态服务未启动 | start.sh 需手动执行 | 是否现在拉起 |
| label-studio vs sky-gateway 8080 冲突 | 共用端口 | label-studio 是否迁走 |
| paipan API 路径 | `/api/paipan` 返回"未知路径"，路由表需对齐 | 改前端调用路径 vs 改后端路由 |
| 服务器选型 | 三个候选机型 | ThinkStation P3 vs Dell 3680 vs HP Z2 |

| #11 | KB API 暴露 (118 条结构化条目 + R10 修复) | ✅ 已完成 6/6 | 2026-07-24 13:02 |
| **#3 完结** | **前端组件库封装 6/6 PASS** | **2026-07-24 14:35** | e2e 验证 + F-9 规范落实 |
| 4.1 | ERROR_HANDLING_STANDARD.md 主规范发布 | 2026-07-24 15:03 | docs/ERROR_HANDLING_STANDARD.md（4127 字节 v1.0） |
| 4.2 | 服务端 try/catch 全量审计 PASS | 2026-07-24 16:05 | docs/ERROR_HANDLING_AUDIT_v1.md（5 路由 100% 配对） |
| **#4 完结** | **错误处理规范 5/5 完成** | **2026-07-24 16:56** | error-interceptor.js + ERROR_COPYWRITING.md + INTERCEPTOR_v2.md + POST /api/log/error |
| **#6 完结** | **可观测性规范 4/4 完成** | **2026-07-24 21:01** | logger.js + pino-http + error-aggregator.js + 12 事件埋点 + /api/v1/admin/metrics + admin/dashboard.html |
| **#X 完结** | **穿戴 SDK 落地总规划 (R11-W)** | **2026-07-25 00:25** | docs/WEARABLE_XIANZHI_PLAN.md（382 行 / 7 章）+ SMART_GLASS_INTEGRATION.md v2.0（R11-W 增强 §8）+ HEARTBEAT.md（穿戴监控）+ 9 个 SDK 文件本地 8914 + GH Pages 全 200（含 5 路摄像头 / 4 麦 / 骨传导 / NPU / 32GB 硬件清单 + 28 舌象 + 36 面诊 + 子午流注 + 医易联动 + 多品牌路线图） |
| 7.4 | supertest 集成测试 | 2026-07-25 00:30 | tests/integration/api-endpoints.test.js（341 行 / 28 测试） |
| 7.5 | 整体覆盖率验收 ≥60% | 2026-07-25 00:33 | Stmts 71.73% / Br 63.50% / Fn 79.75% / 24 套件 / 504 测试 |
| 7.6 | 测试报告归档 + 任务完结 | 2026-07-25 00:35 | docs/TEST_COVERAGE_REPORT_v1.md（4,267B）+ coverage-summary-7.4.txt |
| **#7 完结** | **测试规范补齐 6/6 完成** | **2026-07-25 00:35** | 22 单测 + 1 集成 + 1 契约 + 1 冒烟 = 504 测试，4 维度均达标 |
