# 命理宝鉴 · 规范建设清单 (Standards Backlog)

> 立项日期：2026-07-21
> 维护原则：每条规范必须有"问题现状 + 规范要点 + 验收标准 + 落地节奏"四要素，否则不入清单。

---

## 总览

| 优先级 | 规范名称 | 当前痛点 | 状态 |
|--------|---------|---------|------|
| 🔴 P0-1 | API 设计规范 (API_STANDARD) | 588 端点命名风格混乱，错误响应不统一 | 📝 待起草 |
| 🔴 P0-2 | 前端组件库规范 (UI_COMPONENT_STANDARD) | 51 页面重复造轮子 | 📝 待起草 |
| 🔴 P0-3 | 错误处理与降级规范 (ERROR_HANDLING_STANDARD) | AI 死循环、网络断开、401 过期等场景缺统一处理 | 📝 待起草 |
| 🟡 P1-4 | 性能基线与预算规范 (PERFORMANCE_BUDGET) | 无 Lighthouse CI、无 bundle 上限 | 📝 待起草 |
| 🟡 P1-5 | 可观测性规范 (OBSERVABILITY_STANDARD) | cron 失败无埋点、错误无聚合 | 📝 待起草 |
| 🟡 P1-6 | 测试规范 (TESTING_STANDARD) | 只有 flow-test，缺单元/契约测试 | 📝 待起草 |
| 🟡 P1-7 | 国际化与文案规范 (I18N_STANDARD) | 文案散落 HTML，未来多语言难做 | 📝 待起草 |
| 🟢 P2-8 | 可访问性 a11y 规范 (A11Y_STANDARD) | WCAG 2.1 AA 未达标 | 📝 待起草 |
| 🟢 P2-9 | 隐私与合规规范 (PRIVACY_STANDARD) | PII 加密策略散落，缺用户删除/导出 | 📝 待起草 |
| 🟢 P2-10 | 变更与发布规范 (RELEASE_STANDARD) | main 直推、无版本号、无 CHANGELOG | 📝 待起草 |
| 🟢 P2-11 | 文档即代码规范 (DOCS_AS_CODE) | 200+ md/html 散落、无索引、失效不告警 | 📝 待起草 |

---

## 🔴 P0-1 · API 设计规范 (API_STANDARD)

### 问题现状
- 588 个端点命名风格不统一：`/api/yuanzhu/list` (复数 + 动词) vs `/api/ai/chat` (单数 + 名词) vs `/api/kb/:filename` (资源 + 文件名)
- 错误响应五花八门：`{error: "请先登录"}` vs `{error: "RATE_LIMITED", message: "..."}` vs `res.status(401)` + 无 body
- 版本号缺失：所有路径都裸 `/api/xxx`，将来 v2 升级无法平滑
- 字段命名不统一：前端用 `case_id` 后端给 `caseId`

### 规范要点
1. **URL 命名**
   - 资源用复数名词：`/api/v1/yuanzhus` `/api/v1/cases` `/api/v1/knowledge-bases`
   - 操作动词路由到子路径：`/api/v1/yuanzhus/:id/push-yearly`
   - 文件名用 kebab-case：`/api/v1/knowledge-bases/:filename`
2. **版本策略**
   - 必须 `/api/v{1,2,...}/...`
   - 旧版至少保留 6 个月 + `Sunset` 响应头
3. **统一响应壳**
   ```json
   { "code": 0, "message": "ok", "data": { ... } }
   ```
   错误：`{ "code": 401001, "message": "登录已过期", "data": null }`
4. **错误码表**（节选）
   | 区间 | 含义 |
   |------|------|
   | 0 | 成功 |
   | 400xxx | 客户端请求错误 |
   | 401001 | 未登录 |
   | 401002 | Token 过期 |
   | 403001 | 无权限 (RBAC) |
   | 404xxx | 资源不存在 |
   | 429001 | 全局限流 |
   | 5xxxxx | 服务端错误 |
   | 503001 | AI 服务不可用（自动降级到 KB） |
5. **字段命名**：前后端统一用 `snake_case`，前端用工具函数转 `camelCase`
6. **OpenAPI 自动生成**：用 `swagger-jsdoc` 注解每个路由，启动时输出 `/api/v1/openapi.json`

### 验收标准
- [ ] `docs/API_STANDARD.md` 文档发布
- [ ] 现有 588 端点全部加 v1 前缀
- [ ] 统一响应壳函数 `apiResp(code, data, msg)` 落地到 `server/api-response.js`
- [ ] OpenAPI 文档可访问：`http://127.0.0.1:8920/api/v1/openapi.json`
- [ ] 前端 `api()` 函数自动兼容新旧响应壳（v1 期内过渡）

### 落地节奏
- **本周**：起草 API_STANDARD.md + 抽取 apiResp 中间件
- **下周**：批量改造 588 端点 + 生成 OpenAPI
- **第 3 周**：前端切到新响应壳 + 下线旧路径

---

## 🔴 P0-2 · 前端组件库规范 (UI_COMPONENT_STANDARD)

### 问题现状
- 51 个 HTML 页面 + 大量 `<style>` 内联
- 重复造轮子：toast/modal/tab/accordion 几乎每个页面都写一遍
- 颜色硬编码：`#667eea` 出现在 50+ 文件

### 规范要点
1. **基于 Web Components 封装**（不引框架）
   - `<rich-card>` 卡片容器
   - `<rich-modal>` 模态框
   - `<rich-tabs>` 标签页
   - `<rich-accordion>` 折叠面板
   - `<rich-metrics>` 指标卡
   - `<rich-timeline>` 时间轴
   - `<rich-grid>` 网格布局
   - `<rich-compare>` 对比表格
2. **强制 CSS 变量**：所有颜色必须 `var(--color-primary)`，禁用 hex
3. **组件目录**：`app/components/{name}/{name}.js + .md + demo.html`
4. **使用约束**：业务页面禁止内联 `<style>` 写颜色；新组件必须配 demo.html 和 SKILL.md

### 验收标准
- [ ] `docs/UI_COMPONENT_STANDARD.md` 发布
- [ ] `app/components/` 至少 8 个核心组件
- [ ] 全量扫描：业务 HTML 内联 hex 颜色 = 0
- [ ] 每个组件 ≥ 1 个使用页面

### 落地节奏
- **本周**：文档 + 抽 3 个高频组件（toast/modal/card）
- **下周**：补齐剩余 5 个 + 改造 divination-hub.html 做标杆

---

## 🔴 P0-3 · 错误处理与降级规范 (ERROR_HANDLING_STANDARD)

### 问题现状
- AI 接口超时/失败行为未定义（之前出过 `AI 助手死循环` bug）
- 网络断开时页面无降级
- 401 过期只在 `/api/login` 路径特殊处理
- 用户看到的是原始 stack，不是友好文案

### 规范要点
1. **错误码分级**（与 P0-1 错误码表对齐）
2. **降级链**：
   ```
   AI 优先 → KB 命中 ≥ 0.7 直答 → KB 0.4-0.7 摘要+润色 → KB < 0.4 AI 兜底 → 全失败走兜底文案
   ```
3. **客户端拦截器**：
   - 401001 → 跳登录页 + 保留 returnTo
   - 401002 → 自动 refresh token，失败再跳登录
   - 429001 → 全局 toast「请求过于频繁」+ 30s 倒计时静默
   - 503001 → 走 KB 兜底 + 显示「AI 暂时不可用，已为您切换知识库模式」
4. **服务端 try/catch 兜底**：每个路由必须包 try/catch，错误统一走 `apiResp(5xxxxx, null, e.message)`
5. **用户友好文案表**：`docs/ERROR_COPYWRITING.md`，禁止直接 throw 技术错误给前端

### 验收标准
- [ ] `docs/ERROR_HANDLING_STANDARD.md` 发布
- [ ] 前端 `api()` 全局拦截器实现
- [ ] 服务端每个路由包 try/catch（覆盖率 100%）
- [ ] 模拟断网/AI 失败场景测试：KB 兜底 100% 生效

### 落地节奏
- **本周**：文档 + 前端拦截器
- **下周**：服务端批量加 try/catch + 友好文案

---

## 🟡 P1-4 · 性能基线与预算 (PERFORMANCE_BUDGET)

### 规范要点
- 每页 LCP < 2.5s / TTI < 3.5s / CLS < 0.1
- JS bundle 总和 < 300KB（gzipped）
- 图片懒加载率 100% / WebP 优先
- 加 `lighthouse-ci.yml` + GitHub Action 拦截超预算 PR

---

## 🟡 P1-5 · 可观测性 (OBSERVABILITY_STANDARD)

### 规范要点
- 结构化日志（pino / winston）
- 关键事件打点：KB 命中率 / AI 调用次数 / 导出次数 / 推送送达率
- 错误聚合：按错误码 + endpoint 分组
- 业务 dashboard：每日活跃报告数 / 模块使用排行 / KB 直答占比

---

## 🟡 P1-6 · 测试规范 (TESTING_STANDARD)

### 规范要点
- Vitest 单元测试（覆盖 calc-engine / paipan / tcm）
- Pact 契约测试（前后端字段对齐）
- Playwright e2e 关键路径（10 条核心流程）
- 新功能必须 ≥ 60% 覆盖率

---

## 🟡 P1-7 · 国际化与文案 (I18N_STANDARD)

### 规范要点
- 用户可见文案抽到 `i18n/zh-CN.json`（先做中文版，预留英文位）
- 代码用 `t('home.title')` 调用（轻量 i18n 函数）
- 时间/数字/货币用 `Intl` API
- 文档同步双语（中文为主，关键摘要英文）

---

## 🟢 P2-8 · 可访问性 a11y (A11Y_STANDARD)

### 规范要点
- WCAG 2.1 AA 合规
- 颜色对比度 ≥ 4.5:1
- 键盘可达 + focus 可见
- 所有交互元素配 `aria-label`
- 加 `axe-core` 自动检测进 CI

---

## 🟢 P2-9 · 隐私与合规 (PRIVACY_STANDARD)

### 规范要点
- PII（出生日期/时辰/姓名）AES-256 加密存储
- 用户一键导出（JSON + Markdown）
- 用户一键删除（90 天软删除 → 硬删除）
- Cookie 同意横幅
- 数据保留策略：诊疗案例 5 年 / 排盘记录 1 年 / 操作日志 90 天

---

## 🟢 P2-10 · 变更与发布 (RELEASE_STANDARD)

### 规范要点
- SemVer 语义化版本
- Conventional Commits 规范
- 自动生成 CHANGELOG.md（release-please）
- 蓝绿部署：GitHub Pages `main` + `preview` 双分支
- 回滚 SOP：3 分钟内可回滚到上一版本

---

## 🟢 P2-11 · 文档即代码 (DOCS_AS_CODE)

### 规范要点
- `docs/INDEX.md` 总目录（自动生成）
- 90 天未更新文档告警
- 文档 lint：死链 / 失效图片 / 时效内容
- API 文档从代码注释自动生成（typedoc / swagger）
- 关键 SOP 进版本控制 + PR Review

---

## 验收清单（汇总）
- [ ] 11 项规范全部起草完成（每项 docs/*.md）
- [ ] P0 三项已落地到代码（apiResp 拦截器 / 组件库 / 错误处理）
- [ ] P1 七项中至少完成 3 项
- [ ] P2 十一项中至少完成 1 项
- [ ] 全平台扫描：内联 hex 颜色 = 0 / 未捕获异常 = 0 / 死链 < 1%

---

## 状态跟踪

| 日期 | 更新内容 | 责任人 |
|------|---------|--------|
| 2026-07-21 | 立项，11 项规范列入 backlog | AutoClaw |
| 待定 | P0-1 API_STANDARD.md 起草 | AutoClaw |

---

_本文件由 AutoClaw 自动维护，规范起草后请同步更新对应行的「状态」列。_
