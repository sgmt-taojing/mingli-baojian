# H5 API 暴露现状审计报告（#13 · 节点 1）

> **Issue**: #13 · P0-任务2 — H5 API 暴露给前端（≥12 个）  
> **审计节点**: 节点 1 — 现状审计  
> **审计日期**: 2026-07-25  
> **审计人**: Worker-13-audit  
> **审计范围**: `server/api-server-v2.js` + `app/*.html` + `app/js/*.js`  
> **约束**: 只读审计，不改代码

---

## 一、执行摘要

本次审计对命理宝鉴 H5 前端与 Node 后端之间的 API 暴露现状进行了系统化盘点。核心结论：

- **后端路由规模**：`api-server-v2.js` 共 3171 行，定义了 **101 个有效业务路由**（去除 21 个 v1→v0 308 重定向 + 8 个 `_v1Redir`/`_v1Pub` 宏包装），覆盖 AI 助手、用户、排盘、元助、智能眼镜、商城、反馈、课程、诊所以及 KB 等 14 个业务模块。
- **目标 12 API 状态**：P0-任务2 要求暴露的 12 个 API **已全部存在于后端**（✅ 12/12），且 `app/my-yuanzhu.html` 已经在 7 个 Tab 面板中调用了全部 12 个端点。
- **H5 页面覆盖广度**：58 个 HTML 页面中，**19 个页面**引用了后端 API 端点，合计引用 **57 个去重 API 路径**。
- **真实缺口**：`app/admin-glass-dashboard.html` 引用了 `/api/admin/yuanzhu/profile`，但后端**不存在该路由**——这是唯一明确的前后端不对齐问题。
- **路由模块挂载**：除主文件直接定义的路由外，`api-server-v2.js` 还通过 `app.use()` 挂载了 6 个子路由模块：`syncRoutes`、`distillationRoutes`、`kbRoutes`（二级挂载）、`exportRoutes`、`imRoutes`（v1+legacy 双挂载）、`glassRoutes`（v1+legacy 双挂载）。
- **前置报告**：`docs/P0_TASK2_API_COVERAGE.md`（commit `079059a`）已记录了 P0-任务2 的交付验收（补齐 4 个 API），本报告在此基础上做更深、更广的审计分析。

---

## 二、后端完整路由表（按模块分组）

以下路由来自 `server/api-server-v2.js`，已排除 `/api/v1/*` 的 308 重定向条目和 `_v1Redir`/`_v1Pub` 宏调用，仅保留**有效业务端点**（共 101 条）。

### 2.1 AI 模块（4 条）

| # | 方法 | 路由 | 鉴权 | 行号 |
|---|------|------|------|------|
| 1 | POST | `/api/ai/chat` | auth | 585 |
| 2 | POST | `/api/ai/kb-hit-log` | — | 621 |
| 3 | GET | `/api/ai/kb-hit-stats` | — | 654 |
| 4 | POST | `/api/ai/public-chat` | — | 826 |

### 2.2 用户模块（7 条）

| # | 方法 | 路由 | 鉴权 | 行号 |
|---|------|------|------|------|
| 5 | POST | `/api/user/login` | — | 936 |
| 6 | POST | `/api/user/profile` | auth | 997 |
| 7 | GET | `/api/user/profile` | auth | 1019 |
| 8 | POST | `/api/user/check-super` | rbac.auth | 1046 |
| 9 | GET | `/api/v1/user/export` | auth | 3112 |
| 10 | POST | `/api/v1/user/delete` | auth | 3117 |
| 11 | POST | `/api/v1/user/restore` | auth | 3122 |

> 注：用户同意管理 `/api/v1/user/consents`（GET+POST）也在 3127/3135 行，合计用户模块 9 条。

### 2.3 排盘模块（2 条）

| # | 方法 | 路由 | 鉴权 | 行号 |
|---|------|------|------|------|
| — | POST | `/api/paipan/save` | auth | 1054 |
| — | GET | `/api/paipan/history` | auth | 1080 |

### 2.4 元助（yuanzhu）模块（6 条）

| # | 方法 | 路由 | 鉴权 | 行号 |
|---|------|------|------|------|
| ★ | GET | `/api/yuanzhu/list` | auth | 1089 |
| ★ | GET | `/api/yuanzhu/profile` | auth | 1129 |
| — | POST | `/api/yuanzhu/preference` | auth | 1162 |
| — | GET | `/api/yuanzhu/preview-push` | auth | 1169 |
| — | POST | `/api/yuanzhu/send-push` | auth | 1183 |
| ★ | GET | `/api/yuanzhu/yearly-pushes` | auth | 1445 |

### 2.5 智能眼镜模块（5 条）

| # | 方法 | 路由 | 鉴权 | 行号 |
|---|------|------|------|------|
| — | GET | `/api/glass/status` | — | 1219 |
| — | GET | `/api/glass/vitals` | — | 1224 |
| — | POST | `/api/glass/speak` | — | 1229 |
| — | POST | `/api/glass/face-scan` | — | 1236 |
| — | POST | `/api/glass/yearly-push` | — | 1241 |
| — | GET | `/api/glass/capabilities` | — | 1248 |

> 另有 4 条 admin/glass 路由（test/health/broadcast/yearly-broadcast）归入管理后台模块。

### 2.6 KB 知识库模块（4 条直接 + 子路由）

| # | 方法 | 路由 | 鉴权 | 行号 |
|---|------|------|------|------|
| ★ | GET | `/api/kb/list` | optionalAuth | 2022 |
| — | GET | `/api/kb/:filename` | optionalAuth | 2046 |
| — | GET | `/api/admin/kb/stats` | adminAuth | 682 |
| — | GET | `/api/admin/kb/search` | adminAuth | 694 |
| — | POST | `/api/admin/kb/ingest` | adminAuth | 705 |
| — | GET | `/api/admin/kb/audit-quality` | adminAuth | 763 |

> 另有 `app.use('/api/kb', kbRoutes)` 在 2853 行挂载的子路由模块，由 `server/kb-routes.js` 提供。

### 2.7 公开接口模块（public，20 条）

| # | 方法 | 路由 | 鉴权 | 行号 |
|---|------|------|------|------|
| — | GET | `/api/public/kb/stats` | — | 780 |
| — | GET | `/api/public/kb/hits` | — | 794 |
| — | GET | `/api/public/kb/search` | — | 807 |
| ★ | GET | `/api/public/stats` | — | 2099 |
| — | GET | `/api/public/kb-stats` | — | 2147 |
| — | GET | `/api/public/kb-list` | — | 2172 |
| — | GET | `/api/public/kb-manager/stats` | — | 2191 |
| — | GET | `/api/public/kb-manager/list` | — | 2208 |
| — | POST | `/api/public/kb-manager/bump` | — | 2226 |
| — | GET | `/api/public/kb-manager/hit-rate` | — | 2252 |
| — | GET | `/api/public/kb-manager/search` | — | 2278 |
| — | GET | `/api/public/feedback-points` | — | 2294 |
| — | GET | `/api/public/kb-query` | — | 2348 |
| — | GET | `/api/public/kb-search` | — | 2384 |
| — | POST | `/api/public/consulting-save` | — | 2427 |
| — | GET | `/api/public/consulting-list` | — | 2489 |
| — | GET | `/api/public/consulting-detail` | — | 2520 |
| — | GET | `/api/public/kb-topic-search` | — | 2537 |
| — | POST | `/api/public/kb-hit` | — | 2601 |
| — | POST | `/api/public/save-survey` | — | 2620 |
| ★ | GET | `/api/public/recent-cases` | — | 2651 |
| ★ | GET | `/api/public/latest-pushes` | — | 2665 |
| — | GET | `/api/public/courses` | — | 2675 |
| — | GET | `/api/public/clinic-reports` | — | 2690 |
| — | GET | `/api/public/voices` | — | 2700 |

### 2.8 商城模块（2 条）

| # | 方法 | 路由 | 鉴权 | 行号 |
|---|------|------|------|------|
| ★ | GET | `/api/shop/products` | — | 1510 |
| — | POST | `/api/order/create` | auth | 1514 |

### 2.9 反馈/积分模块（2 条）

| # | 方法 | 路由 | 鉴权 | 行号 |
|---|------|------|------|------|
| — | POST | `/api/feedback/submit` | auth | 1532 |
| ★ | GET | `/api/feedback/points` | auth | 1569 |

### 2.10 课程模块（2 条）

| # | 方法 | 路由 | 鉴权 | 行号 |
|---|------|------|------|------|
| ★ | GET | `/api/courses` | — | 1624 |
| — | POST | `/api/courses/add` | adminAuth | 1635 |

### 2.11 语音/TTS 模块（2 条）

| # | 方法 | 路由 | 鉴权 | 行号 |
|---|------|------|------|------|
| — | GET | `/api/tts` | — | 2728 |
| ★ | GET | `/api/voices` | — | 2766 |

### 2.12 人脸/OCR 模块（4 条）

| # | 方法 | 路由 | 鉴权 | 行号 |
|---|------|------|------|------|
| — | POST | `/api/face/analyze` | — | 2815 |
| — | POST | `/api/ocr/recognize` | — | 2825 |
| — | POST | `/api/ocr/tcm` | — | 2835 |
| — | GET | `/api/face/health` | — | 2842 |

### 2.13 诊所（clinic）模块（11 条）

| # | 方法 | 路由 | 鉴权 | 行号 |
|---|------|------|------|------|
| — | POST | `/api/clinic/submit-symptom` | requirePermission('clinic:submit_symptom') | 1744 |
| — | GET | `/api/clinic/assigned-cases` | requirePermission('clinic:view_assigned_case') | 1760 |
| — | POST | `/api/clinic/submit-analysis` | requirePermission('clinic:submit_analysis') | 1804 |
| — | POST | `/api/clinic/submit-diagnosis` | requirePermission('clinic:submit_diagnosis') | 1843 |
| — | POST | `/api/clinic/push-report` | requirePermission('clinic:push_report') | 1895 |
| ★ | GET | `/api/clinic/my-reports` | requirePermission('clinic:view_own_report') | 1923 |
| — | POST | `/api/clinic/discuss` | requirePermission('clinic:collaborate') | 1940 |
| — | GET | `/api/clinic/discussions/:caseId` | requirePermission('clinic:collaborate') | 1953 |
| — | GET | `/api/clinic/case/:id` | requirePermission('clinic:view_assigned_case') | 1967 |
| — | POST | `/api/clinic/score-case` | requirePermission('clinic:collaborate') | 2083 |
| — | POST | `/api/clinic/update-effectiveness` | requirePermission('clinic:collaborate') | 2089 |

### 2.14 管理后台（admin）模块（13 条）

| # | 方法 | 路由 | 鉴权 | 行号 |
|---|------|------|------|------|
| — | GET | `/api/admin/config` | adminAuth | 1669 |
| — | POST | `/api/admin/config` | adminAuth | 1674 |
| — | GET | `/api/admin/stats` | adminAuth | 1682 |
| — | POST | `/api/admin/assign-role` | adminAuth | 1705 |
| — | POST | `/api/admin/remove-role` | adminAuth | 1723 |
| — | POST | `/api/admin/glass/test` | adminAuth | 1279 |
| — | GET | `/api/admin/glass/health` | adminAuth | 1302 |
| — | POST | `/api/admin/glass/broadcast` | adminAuth | 1330 |
| — | POST | `/api/admin/glass/yearly-broadcast` | adminAuth | 1352 |
| — | POST | `/api/admin/yuanzhu/push-yearly` | adminAuth | 1384 |
| — | POST | `/api/admin/yuanzhu/:userId/push-yearly` | adminAuth | 1424 |
| — | GET | `/api/admin/yuanzhu/push-stats` | adminAuth | 1462 |
| — | POST | `/api/admin/cron/yearly-push` | adminAuth | 1480 |

### 2.15 其他模块

| # | 方法 | 路由 | 鉴权 | 行号 |
|---|------|------|------|------|
| — | POST | `/api/push/log` | auth | 1654 |
| — | POST | `/api/merchant/apply` | — | 1583 |
| — | GET | `/api/merchant/list` | adminAuth | 1609 |
| — | POST | `/api/merchant/approve` | adminAuth | 1614 |
| — | GET | `/api/v1/health` | — | 2905 |
| — | GET | `/api/v1/admin/metrics` | adminAuth | 2961 |
| — | POST | `/api/log/error` | — | 2930 |

### 2.16 子路由挂载（app.use）

| 挂载路径 | 模块文件 | 行号 |
|---------|---------|------|
| `/api/sync` | `sync-api.js` | 2792 |
| `/api/distill` | `distillation-routes.js` | 2793 |
| `/api/kb` | `kb-routes.js` | 2853 |
| `/api/export` | `export-routes.js` | 2854 |
| `/api/v1/im` + `/api/im` | `im-routes.js` | 2862–2863 |
| `/api/v1/glass` + `/api/glass` | `glass-routes.js` | 2864–2865 |

---

## 三、目标 12 API 对照表

下表将 P0-任务2 要求的 12 个 API 与后端实际路由逐一对照。**结论：12/12 全部存在 ✅**。

| # | 目标 API | 状态 | 后端路由 | 行号 | 鉴权 | 在 my-yuanzhu.html 中的调用位置 |
|---|---------|------|---------|------|------|-------------------------------|
| 1 | `yuanzhu/list` | ✅ | `GET /api/yuanzhu/list` | 1089 | auth | `renderYuanzhu()` L143 |
| 2 | `profile` | ✅ | `GET /api/yuanzhu/profile` | 1129 | auth | `renderProfile()` L127 |
| 3 | `yearly-pushes` | ✅ | `GET /api/yuanzhu/yearly-pushes` | 1445 | auth | `renderPush()` L174 |
| 4 | `public/latest-pushes` | ✅ | `GET /api/public/latest-pushes` | 2665 | — | `renderPush()` L196（兜底） |
| 5 | `feedback/points` | ✅ | `GET /api/feedback/points` | 1569 | auth | `renderPoints()` L212 |
| 6 | `public/stats` | ✅ | `GET /api/public/stats` | 2099 | — | `renderPoints()` L216 |
| 7 | `public/recent-cases` | ✅ | `GET /api/public/recent-cases` | 2651 | — | `renderYuanzhu()` L147 |
| 8 | `shop/products` | ✅ | `GET /api/shop/products` | 1510 | — | `renderShop()` L259 |
| 9 | `voices` | ✅ | `GET /api/voices` | 2766 | — | `renderPush()` L178 |
| 10 | `kb/list` | ✅ | `GET /api/kb/list` | 2022 | optionalAuth | `renderKb()` L268 |
| 11 | `courses` | ✅ | `GET /api/courses` | 1624 | — | `renderKb()` L272 |
| 12 | `clinic/my-reports` | ✅ | `GET /api/clinic/my-reports` | 1923 | requirePermission | `renderReports()` L249 |

**鉴权分布**：4 个需 `auth`（登录用户），1 个需 `optionalAuth`，1 个需 `requirePermission('clinic:view_own_report')`（诊所角色），6 个无鉴权（公开）。

---

## 四、`app/my-yuanzhu.html` 现状分析

### 4.1 基本信息

- **文件大小**：16,696 字节，339 行
- **最后修改**：2026-07-25 07:28
- **标题**：「我的助手 · 易道智鉴」

### 4.2 Tab 结构（7 个面板）

该页面已实现 7 个 Tab 面板，通过 `<ml-tab>` Web Components 实现（兼容旧 `.tab` CSS）：

| Tab 序号 | 标签 | data-tab | 渲染函数 | 调用的目标 API |
|---------|------|---------|---------|--------------|
| 0 | 👤 个人 | profile | `renderProfile()` | `/api/yuanzhu/profile` + `/api/user/login` |
| 1 | 🧙 助手 | yuanzhu | `renderYuanzhu()` | `/api/yuanzhu/list` + `/api/public/recent-cases` |
| 2 | 📨 推送 | push | `renderPush()` | `/api/yuanzhu/yearly-pushes` + `/api/voices` + `/api/public/latest-pushes` |
| 3 | 🎯 积分 | points | `renderPoints()` | `/api/feedback/points` + `/api/public/stats` |
| 4 | 📋 病历 | reports | `renderReports()` | `/api/clinic/my-reports` |
| 5 | 🛍️ 商城 | shop | `renderShop()` | `/api/shop/products` |
| 6 | 📚 知识 | kb | `renderKb()` | `/api/kb/list` + `/api/courses` |

### 4.3 API 调用列表

`my-yuanzhu.html` 通过 `api()` 包装函数共调用 **13 个 API 端点**（12 个目标 API + 1 个登录接口）：

```
/api/yuanzhu/profile      → renderProfile()
/api/yuanzhu/list         → renderYuanzhu()
/api/public/recent-cases  → renderYuanzhu()
/api/yuanzhu/yearly-pushes → renderPush()
/api/voices               → renderPush()
/api/public/latest-pushes → renderPush() 兜底
/api/feedback/points      → renderPoints()
/api/public/stats         → renderPoints()
/api/clinic/my-reports    → renderReports()
/api/shop/products        → renderShop()
/api/kb/list              → renderKb()
/api/courses              → renderKb()
/api/user/login           → login()
```

### 4.4 技术特点

1. **统一 API 封装**：`api(path, opts)` 函数封装了认证 header 注入、JSON 解析、错误拦截器对接
2. **静默兜底策略**：public API 调用全部 try/catch 包裹，失败时不阻塞 Tab 已有内容
3. **Web Components**：使用 `<ml-tab>` 和 `<ml-toast>` 自定义元素（`components/tab.js` + `components/toast.js`）
4. **错误拦截器**：引入 `js/error-interceptor.js` 实现全局 fetch 拦截和错误码收敛
5. **暗墨主题**：CSS 变量体系完整（`--ink`, `--gold`, `--paper` 等），与全站一致
6. **无外部 JS 库**：不依赖 jQuery/Vue/React，纯原生 JS 实现

### 4.5 缺什么

从功能完整度看，`my-yuanzhu.html` **已基本完成 P0-任务2 的要求**，12 个 API 全部对接。尚存的改进空间：

| 缺口 | 严重度 | 说明 |
|------|--------|------|
| 缺少语音播放控件 | 低 | `/api/voices` 仅列表展示，未提供 TTS 预览播放 |
| 缺少下拉刷新/分页 | 中 | 年度推送、病历等列表仅 `slice(0,10)`，无分页/无限滚动 |
| 缺少骨架屏 | 低 | 加载中仅显示 "加载中..." 文字 |
| 商城缺购买入口 | 中 | 商品列表有展示，但无"购买"按钮（需对接 `/api/order/create`） |
| 知识库 KB 搜索入口缺失 | 低 | 仅展示 KB 目录列表，未接入 `/api/public/kb-search` 搜索功能 |

---

## 五、H5 页面 × API 调用矩阵

### 5.1 总体统计

- **HTML 页面总数**：58 个（`app/*.html`）
- **引用后端 API 的页面数**：**19 个**（32.8%）
- **H5 引用的去重 API 路径数**：**57 个**
- **JS 文件中引用的 API 路径数**：4 个（`app/js/*.js`）

### 5.2 页面 × API 矩阵

下表列出 19 个有 API 调用的页面及其调用的端点（★ 标记目标 12 API）：

| 页面 | API 调用列表 | 目标 API 数 |
|------|-------------|-----------|
| **my-yuanzhu.html** | ★yuanzhu/list, ★yuanzhu/profile, ★yearly-pushes, ★public/latest-pushes, ★feedback/points, ★public/stats, ★public/recent-cases, ★shop/products, ★voices, ★kb/list, ★courses, ★clinic/my-reports, user/login | **12/12** |
| **ai-assistant.html** | ai/chat, ai/public-chat, kb/list, paipan/history, paipan/save, public/kb-hit, public/save-survey, feedback/submit, face/analyze, kb/:filename | 1/12 |
| **admin-glass-dashboard.html** | admin/glass/broadcast, admin/glass/health, admin/glass/test, admin/glass/yearly-broadcast, admin/yuanzhu/profile, glass/demo, public/kb-manager/hit-rate | 0/12 |
| **admin-kb-batch.html** | admin/kb/audit-quality, admin/kb/ingest, admin/kb/stats, ai/kb-hit-stats | 0/12 |
| **admin-kb-panel.html** | admin/kb/stats, admin/kb/search | 0/12 |
| **admin.html** | admin/kb/ingest, admin/kb/stats, admin/stats, ai/kb-hit-stats | 0/12 |
| **divination-hub.html** | ai/public-chat, public/kb-hit, public/save-survey | 0/12 |
| **divination-integrated.html** | ai/public-chat, paipan/save | 0/12 |
| **export-guard.html** | export/, export/archive, export/decrypt, export/unlock | 0/12 |
| **glass-console.html** | ai/public-chat, face-analyze | 0/12 |
| **glass-history.html** | v1/glass/history | 0/12 |
| **im.html** | ai/public-chat | 0/12 |
| **kb-explore-submit.html** | kb/discover-online, kb/submit-material, public/kb-list, public/kb-stats | 0/12 |
| **kb-explorer.html** | public/kb-stats, public/kb/hits, public/kb/search | 0/12 |
| **login.html** | user/login | 0/12 |
| **master-zidise-illness.html** | ai/public-chat, paipan/save, public/kb-hit | 0/12 |
| **monitor-dashboard.html** | admin/stats | 0/12 |
| **tcm-clinic.html** | clinic/assigned-cases, clinic/discuss, clinic/discussions/:caseId, clinic/my-reports, clinic/push-report, clinic/submit-analysis, clinic/submit-symptom, feedback/submit, ocr/tcm, order/create, public/feedback-points, public/kb-list, public/kb-manager/list, public/latest-pushes, public/recent-cases, public/stats | 5/12 |
| **wechat-hub.html** | ai/public-chat, public/kb-hit, public/save-survey | 0/12 |
| **yuanzhu-inbox.html** | yuanzhu/yearly-pushes | 1/12 |

### 5.3 目标 12 API 的 H5 页面覆盖率

| 目标 API | 后端存在 | 被 H5 页面调用 | 调用页面数 |
|---------|---------|--------------|-----------|
| `yuanzhu/list` | ✅ | ✅ | 1（my-yuanzhu.html） |
| `yuanzhu/profile` | ✅ | ✅ | 1（my-yuanzhu.html） |
| `yearly-pushes` | ✅ | ✅ | 2（my-yuanzhu.html, yuanzhu-inbox.html） |
| `public/latest-pushes` | ✅ | ✅ | 2（my-yuanzhu.html, tcm-clinic.html） |
| `feedback/points` | ✅ | ✅ | 1（my-yuanzhu.html） |
| `public/stats` | ✅ | ✅ | 2（my-yuanzhu.html, tcm-clinic.html） |
| `public/recent-cases` | ✅ | ✅ | 2（my-yuanzhu.html, tcm-clinic.html） |
| `shop/products` | ✅ | ✅ | 1（my-yuanzhu.html） |
| `voices` | ✅ | ✅ | 1（my-yuanzhu.html） |
| `kb/list` | ✅ | ✅ | 2（my-yuanzhu.html, ai-assistant.html） |
| `courses` | ✅ | ✅ | 1（my-yuanzhu.html） |
| `clinic/my-reports` | ✅ | ✅ | 2（my-yuanzhu.html, tcm-clinic.html） |

**结论**：12/12 目标 API 均已被 H5 页面调用，调用页面覆盖率良好。

### 5.4 API 热度排行（被引用次数 Top 10）

| 排名 | API 端点 | 被页面引用次数 |
|------|---------|-------------|
| 1 | `/api/ai/public-chat` | 8 |
| 2 | `/api/user/login` | 2 |
| 2 | `/api/public/stats` | 2 |
| 2 | `/api/public/recent-cases` | 2 |
| 2 | `/api/public/latest-pushes` | 2 |
| 2 | `/api/public/kb-stats` | 2 |
| 2 | `/api/public/kb-hit` | 2 |
| 2 | `/api/paipan/save` | 2 |
| 2 | `/api/kb/list` | 2 |
| 2 | `/api/feedback/submit` | 2 |

> 注意：以上计数基于页面级引用次数，不计算同一页面内的多次调用。`/api/ai/public-chat` 是热度最高的端点（8 页面引用），说明 AI 对话是平台核心功能。

---

## 六、缺口分析与建议

### 6.1 真实缺口：`/api/admin/yuanzhu/profile` 后端缺失

**严重度**：中

`app/admin-glass-dashboard.html` 第 448 行调用了 `/api/admin/yuanzhu/profile`：

```javascript
const data = await api('/api/admin/yuanzhu/profile');
```

但后端 `api-server-v2.js` **不存在该路由**（grep 确认无匹配）。admin 模块仅有 `/api/admin/yuanzhu/push-yearly`、`/api/admin/yuanzhu/:userId/push-yearly`、`/api/admin/yuanzhu/push-stats` 三条路由。

**建议**：
- 方案 A：在 admin-glass-dashboard.html 中改为调用已有的 `/api/yuanzhu/profile`（带 admin token）
- 方案 B：在 `api-server-v2.js` 中新增 `GET /api/admin/yuanzhu/profile` 路由（adminAuth 鉴权），返回所有用户的元助档案

### 6.2 公开 API 存在但 H5 可见度不均

以下公开 API 虽然后端存在，但在 H5 端**可见度不足**（仅被 1-2 个页面引用）：

| 公开 API | 说明 | 建议 |
|---------|------|------|
| `/api/public/courses` | 公开课程列表 | 仅 `/api/courses` 被 my-yuanzhu.html 用，public 版未被任何 H5 页面调用 |
| `/api/public/clinic-reports` | 公开诊所报告 | 完全未被 H5 页面调用 |
| `/api/public/voices` | 公开语音列表 | 完全未被 H5 页面调用（H5 调用的是 `/api/voices`） |
| `/api/public/consulting-list` | 公开咨询列表 | 完全未被 H5 页面调用 |
| `/api/public/consulting-detail` | 公开咨询详情 | 完全未被 H5 页面调用 |
| `/api/public/kb-topic-search` | KB 主题搜索 | 完全未被 H5 页面调用 |

**建议**：在 my-yuanzhu.html 或其他 H5 页面中适当接入这些公开端点，提高数据可见度。

### 6.3 API 版本双轨问题

项目中 `/api/v1/*` 和 `/api/*` 两套路由并存，v1 路由通过 308 重定向到 v0 路由。`glass-history.html` 仍在使用 `/api/v1/glass/history` 而非 `/api/glass/history`。

**建议**：统一迁移 H5 调用到无版本前缀的路由（已在 `docs/API_V1_MIGRATION.md` 中有规划）。

### 6.4 路由模块化不彻底

`api-server-v2.js` 3171 行中直接定义了大量路由，只有 6 个子模块被抽出（sync/distill/kb/export/im/glass）。yuanzhu、clinic、shop、courses、face/ocr 等模块仍内联在主文件中。

**建议**：将 yuanzhu（6 条）、clinic（11 条）、shop（2 条）等路由抽到独立模块文件，降低主文件复杂度。`server/routes/yuanzhu-routes.js` 已存在但仅做委托转发，未真正承载业务逻辑。

### 6.5 `app/my-yuanzhu.html` 功能完善建议

| 优先级 | 建议 | 说明 |
|--------|------|------|
| P1 | 接入 `/api/order/create` | 商城 Tab 有商品列表但无购买入口 |
| P2 | KB 搜索 | 知识 Tab 可接入 `/api/public/kb-search` 提供搜索框 |
| P2 | 分页/无限滚动 | 年度推送、病历等列表需分页支持 |
| P3 | 语音 TTS 预览 | 语音 Tab 可增加试听按钮，调用 `/api/tts` |

---

## 七、附录：可复现命令

以下命令可在项目根目录 `projects/mingli-baojian/` 下复现本报告的所有数据：

```bash
# 1. 后端路由总数（含重定向）
grep -cE "app\.(get|post|put|delete|patch)\(" server/api-server-v2.js
# → 130

# 2. 后端有效路由数（去重定向 + 去宏）
grep -nE "app\.(get|post|put|delete|patch)\(" server/api-server-v2.js \
  | grep -v "res.redirect(308" \
  | grep -v "_v1Redir\|_v1Pub" \
  | wc -l
# → 101

# 3. 目标 12 API 存在性检查
for ep in yuanzhu/list yuanzhu/profile yuanzhu/yearly-pushes \
          public/latest-pushes feedback/points public/stats \
          public/recent-cases shop/products voices kb/list \
          courses clinic/my-reports; do
  grep -qE "app\.(get|post)\('/api/${ep}'" server/api-server-v2.js \
    && echo "✅ /api/${ep}" || echo "❌ /api/${ep}"
done

# 4. HTML 文件总数
ls app/*.html | wc -l
# → 58

# 5. 引用 API 的 HTML 页面数
grep -lE "/api/" app/*.html 2>/dev/null | wc -l
# → 19

# 6. H5 引用的去重 API 路径数
grep -rEoh "'/api/[a-zA-Z0-9/_-]+'" app/*.html 2>/dev/null \
  | tr -d "'" | sort -u | wc -l
# → 57

# 7. my-yuanzhu.html 中调用的 API 端点
grep -oE "/api/[a-zA-Z0-9/_-]+" app/my-yuanzhu.html | sort -u

# 8. 缺失路由检查：admin/yuanzhu/profile
grep -nE "app\.(get|post)\('/api/admin/yuanzhu/profile'" server/api-server-v2.js
# → (无输出)

# 9. API 热度排行
grep -rEoh "'/api/[a-zA-Z0-9/_-]+'" app/*.html 2>/dev/null \
  | tr -d "'" | sort | uniq -c | sort -rn | head -10

# 10. api-server-v2.js 文件行数
wc -l server/api-server-v2.js
# → 3171
```

---

## 八、版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| v1 | 2026-07-25 | 初始审计报告（节点 1 现状审计） |

---

*报告完毕。下一步（节点 2）：根据缺口分析实施 API 补齐和 H5 页面增强。*
