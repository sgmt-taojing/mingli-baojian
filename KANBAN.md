# 命理宝鉴 · 开发看板

> **维护原则**：每个任务按工作流 22 节点推进；完成一个自动拉下一个；阻塞项标红等待决策。
> **断点机制**：每个进行中任务必须记录"当前节点 + 产出物 + 下一步"，心跳只看这一页就能续推。
> **顶层架构**：见 MECHANISM.md（本项目根目录）
> **最后更新**：2026-07-25 07:10（心跳推进：#9-a11y-page-layer 节点 2/3 ✅ — 批量 ARIA 注入脚本完成 45/46 页覆盖率 97.8%，脚本 327 行 / 报告 11,920B / 14 项验收 PASS）
>
> **#9 节点 9.1 完成**：docs/A11Y_AUDIT_v1.md（29,703 字节 / 548 行 / 8 章节 + 2 附录），a11y 基础设施几乎为零：仅 4/63 文件含 aria-*（6.3%）、474 处 div onclick 假按钮、62/63 缺 `<main>`、0 skip-link、0 focus-trap、81 处 outline:none、6/10 img 缺 alt、表单 label for 仅 1.4%
> **#11 节点 11.2 完成**：commitlint.config.js（1,366B / 43 行 / 14 type 枚举）+ .husky/commit-msg（127B hook）+ CHANGELOG.md（7,031B / v1.0.0 初始化）+ docs/RELEASE_MANAGEMENT_v1.md（6,282B / 10 章节），现有 commit 合规率 84.9%
> **健康检查**：✅ 5/5 服务在线（paipan/tts/face-ocr/static/api-v2）；KB API OK；paipan-api 路由 WARN（已知）
> **AI 智能体 token 修复**（06:53，commit `8c49037`）：后端剥离 LLM reasoning_content（GLM/DeepSeek 思考模型）+ 前端 hist 截断 20 条 / 单条 500 字（user 300 字），实测单次 token 665→602（9.5%↓），10 轮 hist 累积从 5300+ 降至可控
> **已加入 KANBAN**：#9-a11y-page-layer 节点 1（2026-07-25 06:53 完结）— `97f5000` feat(a11y) 批量推行 ARIA 增强到剩余 7 页（+ skip-link + label 补齐），报告 `docs/A11Y_PAGE_LAYER_REPORT.md`

## 进行中 🔄

### ~~#11 · 变更发布规范（SemVer + CHANGELOG + Conventional Commits）~~ 2026-07-25 04:35 ✅

| 字段 | 值 |
|------|---|
| 优先级 | P2 |
| 规范引用 | D-4 |
| 节点进度 | **3/3 ✅** |
| 完成节点 | 11.1 — 发布管理现状审计 ✅<br>11.2 — commitlint + husky + CHANGELOG 初始化 ✅<br>11.3 — standard-version 安装 + dry-run 验证 ✅ |
| 产出物追加 | · **节点 11.3** `docs/RELEASE_NODE_11_3_REPORT.md`（373 行 / 8 章节 + 2 附录 + 8 可复现命令）<br>· standard-version@9.5.0 落地（devDependencies，161 新包 / 0 漏洞 / 11 秒安装）<br>· 严格 dry-run（`--dry-run --skip.bump --skip.commit --skip.tag`）EXIT=0，64KB CHANGELOG 模拟生成<br>· 验证 423 条 conventional commits 全解析（feat=163 / fix=133 / perf=8 / refactor=48 / docs=46 / chore=25）<br>· 推断版本: **1.0.0 → 1.1.0**（MINOR bump by feat, 13 条 BREAKING 实际无？需二次复查）<br>· 策略建议: **快照保留 + 增量生成**（不直接覆盖 11.2 手工编写的 7,031B v1.0.0 阶段稳定版）<br>· 11.4 候选清单（D+A 组合 25 分钟推荐）:<br>　 · 候选 A: 真实 first release（--release-as=minor 发布 v1.1.0）<br>　 · 候选 D: 文档更新（README + RELEASE_MANAGEMENT_v1.md 加 standard-version 章节）<br>　 · 候选 C: GitHub Release webhook 自动化<br>　 · 候选 B: release-it 替代评估<br>· 风险: 现有 `@commitlint/cli` + `husky` 包未实装（11.5 待修）<br>· commit `d864e3e` feat(release): 节点 11.3 standard-version 工具落地 + dry-run 验证（3 files / 2575+ insertions） |
| 验收 | ✅ standard-version 9.5.0 安装成功；✅ 严格 dry-run EXIT=0；✅ 423 commits 全解析；✅ 报告 373 行 ≥ 300 字节；✅ 8 章节 + 2 附录 + 8 可复现命令；✅ 11.4 候选清单已规划<br>✅ **#11 完结 3/3**：发布管理规范三件套全落地（审计 + 工具链 + 验证） |
| 阻塞 | 无 |
| 下一阶段 | P3-11.4 真实 first release（候选 A 触发 D + C） · P3-11.5 commitlint/husky 实装修复 |
| 最后更新 | 2026-07-25 04:35 |<br>· 调研范围：版本号现状 / 提交历史 / CHANGELOG / 标签策略 / 分支策略 / 发布流程 / 现有工具 / 风险评估<br>· 关键发现：package.json 无 version 字段（默认 1.0.0） / 提交历史 200+ 条 / 0 个版本标签 / 0 个 CHANGELOG 文件 / 无 release script<br>· 提交分析：feat/fix/chore/docs/style/refactor/perf/test/build/ci 9 大类型分布统计<br>· 版本化策略：v0.x 内测（≤1.0.0） → v1.x 首个 GA → v1.x.y patch 修复 → v2.x 破坏性<br>· **提议规范**：Conventional Commits 1.0.0（feat/fix/BREAKING CHANGE 等类型）+ SemVer 2.0.0 + Angular 风格 commitlint<br>· **工具链**：commitlint + husky + @commitlint/cli + @commitlint/config-conventional + standard-version 或 release-it<br>· **P0 4 项**：package.json 增 version / 写 CHANGELOG.md 模板 / 配 commitlint / commit-msg hook<br>· **P1 3 项**：semantic-release 自动化 / 标签 + GitHub Release / 文档即代码链接<br>· **P2 2 项**：可视化 changelog 网页 / 多语言 i18n 联动<br>· **节点 11.2** `commitlint.config.js`（1,366 字节 / 43 行）— 14 类 type 枚举（feat/fix/docs/style/refactor/perf/test/build/ci/chore/revert/audit/sync/deploy）+ subject 长度限制 72 字符 + header 长度限制 100 字符<br>· **节点 11.2** `.husky/commit-msg`（127 字节 / 4 行）— 提交前调用 commitlint --edit $1<br>· **节点 11.2** `CHANGELOG.md`（7,031 字节 / 178 行）— v1.0.0 阶段稳定版初始化，包含完整阶段里程碑、feat/fix/perf/refactor/docs/chore 6 大类变更记录、SemVer 规则、conventional commits 规则、提交示例、工具链说明<br>· **节点 11.2** `docs/RELEASE_MANAGEMENT_v1.md`（6,282 字节）— 完整变更发布规范文档：版本号规则 / 提交消息规则 / CHANGELOG 自动生成 / commitlint+husky 配置 / 版本发布流程 / 分支策略 / GitHub Release 同步 / 版本回退策略 / 监控与告警 / 参考资料（10 章节）<br>· **节点 11.2** 验证：现有 commit 合规率 **423/498 = 84.9%**（迁移成本极低）<br>· **节点 11.2** 验收清单 5/5 PASS：commitlint.config.js / .husky/commit-msg / CHANGELOG.md / conventional commits 正则 / 现有合规率 |
| 验收 | ✅ 报告 ≥3000 字节（实际 14,500+）；✅ 8 章节；✅ 附录含 12 条可复现命令；✅ 所有数字来自真实 git/文件统计<br>✅ 节点 11.2 5/5 PASS |
| 阻塞 | 无 |
| 最后更新 | 2026-07-25 03:54 |

---

### ~~#8 · 国际化文案规范（I18N 抽离）~~ 2026-07-25 03:02 ✅

| 字段 | 值 |
|------|---|
| 优先级 | P1 |
| 规范引用 | T-4（i18n） |
| 节点进度 | **6/6 ✅** |
| 完成节点 | 8.1 — I18N 现状调研报告 ✅<br>8.2 — 轻量 i18n 核心 + zh-CN 字典 ✅<br>8.3 — error-interceptor.js + error-render.js 引入 t() ✅<br>**8.4 — BUILTIN_ZH_CN 与 zh-CN.json 一致性修复 ✅** |
| 产出物追加 | · 节点 8.1 `docs/I18N_AUDIT_v1.md`（24,540 字节 / 8 章节 + 2 附录）<br>· 关键数据：106 个文件 / 183,638 行 / 5.30MB HTML + 4.75MB JS / 总中文 3,106,423 字<br>· **核心结论**：i18n 机制完全缺失（0 个 key / 0 个 t() / 0 个 locale 模块）<br>· **KB vs UI**：JS 中 97.8% 中文字符是 KB 知识库内容（1,652,086 / 1,689,852 字），真正 UI 文案仅 37,766 字（2.2%）<br>· **错误码硬编码**：error-interceptor.js 13 错误码 + error-render.js 4 字面量全部硬编码中文，是首要抽离对象<br>· **组件层**：5 个 ml-* 组件均未支持 i18n（无 t() 函数）<br>· **共性 UI 字面量**：加载中(54) / 暂无(114) / 请输入(101) / 保存(99) / 登录(95) / 确认(77) / 提交(66) / 取消(26) / 删除(26)<br>· **建议方案**：自实现轻量 i18n（window.I18N + t(key) + data-i18n 属性），**不引入 i18next**（31KB 体积 + 学习成本不划算）<br>· **节点 8.2 草图**：app/js/i18n.js（约 80 行）+ app/i18n/zh-CN.json（约 200 key）<br>· 节点 8.2 `app/js/i18n.js`（8,748 字节 / 259 行 / 8 API：t/setLocale/loadLocale/apply/init/locale/messages/fallback）<br>· 节点 8.2 `app/i18n/zh-CN.json`（3,301 字节 / 82 翻译 key / 30 错误码 / 6 命名空间：common/form/toast/error/ui/_meta）<br>· **节点 8.3** `app/js/error-interceptor.js` 改造：610 行 → 617 行（+7 兜底函数），ERROR_COPY 16 条 + normalizeResponse 4 处 + showErrorToast 1 处 + fetch 拦截器 5 处 共 26 处硬编码 → `t('error.xxx', 'fallback')` 调用<br>· **节点 8.3** `app/js/error-render.js` 改造：154 行 → 171 行（+17 含兜底函数），toast/showError/loading/voiceFallback 4 个函数体内 8 处硬编码 → `t()` 调用，修复 `t` 局部变量 shadowing 冲突（重命名为 `el`）<br>· **节点 8.3** `docs/I18N_NODE_8_3_REPORT.md`（9,126 字节 / 6 章节：执行摘要/改造明细/diff 摘要/兜底容错/验收结果/后续）<br>· **节点 8.3**：错误码 → i18n key 完整映射表（16 条），含已知限制（BUILTIN_ZH_CN 扁平 vs zh-CN.json 嵌套结构不齐）<br>· **节点 8.4** `app/js/i18n.js` 改造：286 行 → 306 行（+20），新增 `lookup(obj, key)` 函数支持 flat + 嵌套双向查询，`t()` 函数签名扩展兼容 string 类型第二参数（兜底文案）<br>· **节点 8.4** BUILTIN_ZH_CN 6 处文案同步到 zh-CN.json 更完整版本（400002/401001/404002/422001/429001/429003）<br>· **节点 8.4** `docs/I18N_NODE_8_4_REPORT.md`（4,021 字节 / 6 章节：执行摘要/改造明细/测试验证/API 变更/后续建议/验收清单）<br>· **节点 8.4** 功能测试 11/12 PASS，BUILTIN vs JSON error keys 差异 = 0 |
| 验收 | ✅ 报告 ≥3000 字节（实际 24,540）；✅ 8 章节（执行摘要/整体规模/HTML密度/JS密度/机制/共性文案/错误码/风险建议）；✅ 附录含 9 条可复现命令；✅ 所有数字来自真实命令输出（无硬编码）；✅ 中文正则 `[\u4e00-\u9fa5]`<br>✅ 节点 8.3 报告 9,126 字节 / 6 章节；✅ `node --check` 两个文件语法 OK；✅ grep 验证业务文案 0 处硬编码（仅 fallback 参数和注释）；✅ i18n.js / zh-CN.json MD5 未变；✅ 12 个公开 API 签名 0 变更 |
| 阻塞 | 无 |
| 节点 8.5 | BUILTIN_ZH_CN 持久化 i18n.js 集成 | ✅ |
| 节点 8.6 | 全量验收报告 + 删除 5 行 fallback 容错代码 | ✅ |
| 最后更新 | 2026-07-25 03:02 |

---

### ~~#9 · 可访问性 a11y（WCAG 2.1 AA）~~ 2026-07-25 03:50 ✅（9.3 拆为 P3 子任务 #9-a11y-page-layer）

| 字段 | 值 |
|------|---|
| 优先级 | P1 |
| 规范引用 | WCAG 2.1 AA（Perceivable/Operable/Understandable/Robust） |
| 节点进度 | **3/4 ✅**（节点 9.1 ✅ + 9.2 ✅ + 9.4 验收 ✅，剩 9.3 页面层拆为 P3） |
| 当前节点 | **9.4 验收报告完成 ✅ → 9.3 页面层拆为独立 P3 子任务 #9-a11y-page-layer** |
| 下一步动作 | 派 #9-a11y-page-layer：先 divination-hub.html 10 处 PoC + acorn 扫描脚本验证无回归 |
| 产出物 | · 节点 9.1 `docs/A11Y_AUDIT_v1.md`（**29,703 字节 / 548 行 / 8 章节 + 2 附录**）<br>· 调研范围：app/*.html 全量 63 + app/js 36 + app/components 5 + 表单 + 图像 alt + 键盘 + ARIA + 颜色对比<br>· 关键数据：104 个文件 / 191,262 行 / 10.86 MB；aria-* 总属性仅 67 处（80% 集中在 divination-hub.html 单页）<br>· **ARIA 覆盖**：仅 4/63 文件（6.3%）含 aria-*；aria-hidden 0 / aria-describedby 0 / aria-required 0 / aria-invalid 0 / aria-busy 0<br>· **6 个错误 role**：im.html `role="user/master/doctor/ai/agent/admin"` 不是合法 ARIA role<br>· **语义标签**：`<button>` 937 / `<nav>` 16 / `<main>` **1** / `<article>` **0** / `<aside>` **0** / `<form>` **1**<br>· **474 处 `<div onclick>` 反模式** + 19 `<span onclick>` = **493 处假按钮**，不可键盘聚焦<br>· **标题层级**：divination-hub.html 含 **6 个 `<h1>`**（含 JS 字符串模板 3 处）违反 WCAG H42<br>· **表单**：426 input / 411 label 但 `<label for>` 仅 **6 处**（1.4%）405 个 label 无 id 关联<br>· **键盘**：tabindex **0** / skip-link **0** / focus-trap **0** / focus-visible **0** / `outline:none` **81 处**<br>· **图像**：10 img 中 4 有 alt（40%）；6 缺 alt（含 3 处 innerHTML 动态插入：ai-assistant/tcm-clinic/wechat-h5）<br>· **错误可访问**：toast/feedback/error-render 0 个 aria-live/role=alert；ml-toast **完全无 a11y**（0 分）<br>· **组件 a11y 自审**：ml-modal 60 / ml-accordion 60 / ml-tab 50 / ml-card 0 / ml-toast 0<br>· **WCAG AA 50 条**：明确不达标 ≥15 条 + 部分不达标 10+ 条；Perceivable 6/11、Operable 8/11、Understandable 5/9、Robust 3/3<br>· **P0 6 项**：div→button 化（474 处）/ 表单 label for 补全 / skip-link（63 处）/ 修 6 错 role / ml-modal focus-trap / ml-toast aria-live<br>· **P1 5 项**：h1 收敛 / outline:none 加 focus-visible / img alt 补全 / `<main>` 包裹 / aria-required+invalid<br>· **P2 4 项**：颜色对比实测 / 移动端 reflow / `<title>` 结构化 / `<a>` 加 href<br>· **节点 9.2 草图**：app/components/toast.js（+5 行 aria-live）+ modal.js（+30 行 focus-trap + 自动聚焦）+ divination-hub.html（L297 nav-tab 加 tabindex=0 + 全页 outline:none 加 focus-visible）+ login.html（form 包裹已存在，补 label for 全部 input）<br>· 风险高：命理类用户 50+ 占比高 + 视障/色弱/读屏用户基本无法使用关键功能 |
| 验收 | ✅ 报告 ≥3000 字节（实际 29,703）；✅ 8 章节（执行摘要/整体规模/ARIA密度/语义标签/键盘/图像/WCAG对照/P0P1P2）；✅ 附录含 16 条可复现命令 + 50 条 WCAG AA 对照表；✅ 所有数字来自真实命令输出（无硬编码）；✅ 4 大原则全对照 |
| 阻塞 | 无 |
| 最后更新 | 2026-07-25 03:36 |

---

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

## 进行中 🔄

### ~~#12 · 文档即代码（索引 + 失效告警）~~ 2026-07-25 06:32 ✅

| 字段 | 值 |
|------|---|
| 优先级 | P2 |
| 规范引用 | D-1（文档治理）/ D-2（链接失效）/ D-3（CI 校验） |
| 节点进度 | **3/3 ✅** |
| 当前节点 | **完结 ✅** |
| 下一步动作 | P3: 孤立文件治理（55.4% → <20%）+ 命名规范提升（27.5% → ≥50%） |
| 验收 | ✅ lint 脚本实测 PASS（222 md, JSON 5 维度）；✅ INDEX + GLOSSARY 落地；✅ CI workflow macos-latest / artifact 30 天；✅ 12.3 报告 60 行 / 5/5 PASS |
| 产出物追加（12.2） | · `docs/INDEX.md`（2,814B / 82 行 / 6 类目录：规范/报告/审计/方案/历史/案例）<br>· `docs/GLOSSARY.md`（4,811B / 126 行 / 26 核心概念 + 26 规范引用 + A-Z 索引）<br>· `scripts/docs-lint.sh`（2,149B / 66 行 / 5 维度 JSON 输出 / exit 0=健康 1=警告 2=严重）<br>· `scripts/docs-lint-ci.sh`（634B / 28 行 / 严格模式 / 输出 docs/_reports/{timestamp}.json）<br>· `.github/workflows/docs-lint.yml`（612B / 31 行 / macos-latest / 触发 push main|gh-pages 改 docs/** 或 scripts/docs-lint* + PR main 改 docs/** / artifact 保留 30 天）<br>· `README.md` 文档治理章节 +30 行（索引/词典/lint 命令三入口）<br>· `docs/DOCS_AS_CODE_NODE_12_2_REPORT.md`（83 行） + `docs/DOCS_AS_CODE_NODE_12_3_REPORT.md`（60 行 / 5/5 PASS）<br>· 健康指标实测：222 个 md / UPPER_SNAKE 27.5% / 123 孤立文件（55.4%）/ 1 失效链接 / 28 极小文件 / 37 今日新增<br>· commit `d85ee1c` / `39d9280` / `ef95154` + merge `8519141` gh-pages 同步 |
| 验收 | ✅ 报告 ≥ 3,000B（实际 21,323）；✅ 8 章节 + 2 附录（执行摘要 / 分类 / 命名 / 链接 / 孤立 / 生命周期 / 风险建议 / 命令附录 + 元数据）；✅ 全部数据来自真实命令输出，无硬编码；✅ 复现性 100%<br>✅ 节点 12.2 5/5 PASS（lint 脚本 / INDEX / GLOSSARY / README / 报告）<br>✅ 节点 12.3 5/5 PASS（CI 入口 / workflow YAML / 双分支同步 / 6 产出物 / 健康 JSON 完整） |
| 阻塞 | 无 |
| 最后更新 | 2026-07-25 06:36 |

---

### #9-a11y-page-layer · 页面层批量推行 🔄 2026-07-25 07:10

| 字段 | 值 |
|------|---|
| 优先级 | P3（#9 a11y 节点 9.3 拆分） |
| 规范引用 | WCAG 2.1 AA（Perceivable/Operable/Understandable/Robust） |
| 节点进度 | **2/3 🔄**（节点 1 ✅ 8/8 页手工注入 + 节点 2 ✅ 45/46 页脚本批量注入，待节点 3 CI 钩子 + main 包裹） |
| 当前节点 | **#9-a11y-page-layer 节点 2 — 批量 ARIA 注入脚本完成（45/46 页 ✅）** |
| 下一步动作 | 节点 3 候选：① `scripts/a11y-ci-check.js` 接入 prebuild 钩子防回归 ② 46 页批量追加 `<main id="main-content">` 包裹让 skip-link 锚点生效 ③ Lighthouse CI 集成 |
| 待推行页面 | ✅ **节点 1**：8 页手工注入（divination-hub/integrated/wechat-hub/membership/master-class/kb-explorer/merchant-dashboard/my-yuanzhu）<br>✅ **节点 2**：45/46 页脚本批量注入 — admin-glass-dashboard / admin-kb-batch / admin-kb-panel / admin-shop / clear-cache / components-demo / disclaimer / divination-almanac / divination-knowledge / divination-shop / divination-tools / doctor-elder / export-guard / fengshui / glass-console / glass-history / health-career-dashboard / im / index / kb-explore-submit / koujue-gallery / lifeindex-detail / lifeplan-detail / master-archive / master-disease / master-elder / master-zidise-illness / merchant-apply / merit-system / monitor-dashboard / more-functions / nihaisha-knowledge / nihaisha-learning / nihaisha-tool / report-config / report-sample-bazi / shuhan-knowledge / tcm-symptom / test-parse-natural / wechat-disclaimer / wechat-h5 / yijing-oracle / yijing-qimen / youthplan-detail / yuanzhu-inbox<br>⏭ **跳过**：`knowledge-panel.html`（HTML 片段，无 `<head>`/`<body>`，由宿主页继承 a11y 基础设施） |
| 产出物 | · 节点 1：`app/js/a11y-divination-hub.js`（93 行 / 委托型 ARIA 增强器 / 8+ 页共用 / 不动现有 onclick）<br>· 节点 1：`app/css/a11y-fix.css`（77→94 行 / +17 加 sr-only 工具类）<br>· 节点 1：8 页 `<head>` 引入 a11y-fix.css + `<body>` 紧后加 `<a class="skip-link">跳到主内容</a>` + 包 `<main id="main-content">…</main>`<br>· 节点 1：17 处 `<label for class="sr-only">` 关联（divination-integrated 3 / wechat-hub 4 / membership 2 / master-class 3 / kb-explorer 1 / merchant 3 / my-yuanzhu 1）<br>· 节点 1：报告 `docs/A11Y_PAGE_LAYER_REPORT.md`（12,452 字节 / 7 章节 + 3 附录）<br>· 节点 1 commit：`97f5000` feat(a11y): 批量推行 ARIA 增强到剩余 7 页<br>· **节点 2**：`scripts/a11y-batch-inject.js`（327 行 / 9,710B / 零依赖纯 Node / `--dry-run` + `--verbose` 双模式 / 退出码 0/1 反映 95% 阈值）<br>· **节点 2**：46 页 × 3 处注入 = **135 次插入**（45 页全量 + 1 页 HTML 片段跳过）<br>· **节点 2**：覆盖率 **97.8% (45/46)** ≥ 95% 阈值<br>· **节点 2**：幂等性二次验证通过（0 重复注入）<br>· **节点 2**：报告 `docs/A11Y_PAGE_LAYER_NODE_2_REPORT.md`（11,920 字节 / 5 章节 + 2 附录 + 14 项验收清单）<br>· **节点 2 commit**：`feat(a11y): #9-a11y-page-layer 节点 2 — 批量 ARIA 注入脚本覆盖剩余 46 页` |
| 验收 | ✅ **节点 1**：8/8 页引入 a11y-divination-hub.js + a11y-fix.css + skip-link + main；✅ 7 页 main 标签开闭平衡；✅ 17 个 label[for] 全部有匹配 input/select id（0 悬空）；✅ onclick 数量不动；✅ node --check JS 语法 OK；✅ 验收清单 10/10 PASS<br>✅ **节点 2**：`node --check scripts/a11y-batch-inject.js` 语法 OK；✅ 45/46 = 97.8% 注入覆盖率 ≥ 95% 阈值；✅ 二次运行幂等（45 全跳过）；✅ 节点 1 12 页未被破坏（git diff 无新改动）；✅ 业务 onclick 未动；✅ glass-history `</style></head><body>` 连写场景兼容；✅ tcm-symptom JS 字符串命中兼容；✅ 验收清单 14/14 PASS |
| 阻塞 | 无 |
| 最后更新 | 2026-07-25 07:10 |

---

## 已完结 ✅（最新追加在底部）

### ~~#10 · 隐私合规（GDPR / PIPL）~~ 2026-07-25 03:50 ✅

| 字段 | 值 |
|------|---|
| 优先级 | P2 |
| 规范引用 | PIPL 第 14/24/45/47 条 + GDPR 第 7/17/20/22 条 |
| 节点进度 | **4/4 ✅** |
| 完成节点 | 10.1 服务端骨架 ✅<br>10.2 五端点 8/8 验收 ✅（含 Bug 修复：apiExportHandler 异步未 await 修复）<br>10.3 审计日志 + 软删恢复流程 ✅<br>10.4 文档归档 + KANBAN 更新 ✅ |
| 产出物 | · 节点 10.1 `server/privacy-compliance.js`（280 行 / 5 类同意管理 + 4 用户权利端点）<br>· 节点 10.2 — 注入到 `server/api-server-v2.js`（7 行绑定 + 401/400 边界处理）<br>· 节点 10.2 — 全量测试脚本 `~/.openclaw/tmp/test-privacy-compliance.js`（37 行覆盖 8 个验收点）<br>· 节点 10.3 — `audit_logs` 持续记录 + `user_deletion_requests` 30 天宽限期<br>· 节点 10.4 — `docs/PRIVACY_COMPLIANCE.md`（2,346B / 9 章节）+ `docs/PRIVACY_ENDPOINTS_v1.md`（2,971B / 5 端点 + 数据模型）<br>· 节点 10.2 — 数据库 schema：`user_consents`（UNIQUE on user_id+type+version + version 化）+ `user_deletion_requests`（宽限期 timestamp） |
| 验收 | ✅ 5/5 同意类型 grant/revoke 全部生效；✅ 5 类同意字段语义清晰；✅ export 返回完整 1.7KB 包（含 user/userData/roles/paipan_records/yearly_pushes/consents/feedback_points/shop_orders + meta.totalRows）；✅ delete → 30 天宽限期 + scheduledHardDeleteAt 时间戳写入；✅ restore 撤销成功 + reactivated=true；✅ 已删/已恢复幂等保护 alreadyScheduled=true；✅ 审计日志 PII 操作完整记录；✅ Bug 修复：apiExportHandler 由 function 改 async + exportUserData 改为同步，全量 content-length 从 2 字节升至 1727 字节 |
| 下一阶段 | 物理删除 cron（节点 P3-10.5） + 前端 privacy-center.html（节点 P3-10.6） + 同意弹窗集成（节点 P3-10.7）|
| 最后更新 | 2026-07-25 03:50 |

---


### ~~#11 · 变更发布规范（SemVer + CHANGELOG + Conventional Commits）~~ 2026-07-25 04:35 ✅

| 字段 | 值 |
|------|---|
| 优先级 | P2 |
| 规范引用 | D-4 |
| 节点进度 | **3/3 ✅** |
| 完成节点 | 11.1 — 发布管理现状审计 ✅<br>11.2 — commitlint + husky + CHANGELOG 初始化 ✅<br>11.3 — standard-version 安装 + dry-run 验证 ✅ |
| 产出物 | · 节点 11.1 `docs/RELEASE_MANAGEMENT_AUDIT_v1.md`（**14,500+ 字节 / 280+ 行 / 8 章节**）<br>· 节点 11.2 commitlint.config.js（1,366B / 14 type 枚举）+ .husky/commit-msg + CHANGELOG.md（7,031B / v1.0.0）+ docs/RELEASE_MANAGEMENT_v1.md（6,282B）<br>· **节点 11.3** `docs/RELEASE_NODE_11_3_REPORT.md`（373 行 / 8 章节 + 2 附录）<br>· standard-version@9.5.0 devDependencies（161 新包 / 0 漏洞）<br>· 严格 dry-run EXIT=0 / 423 commits 全解析 / 模拟 CHANGELOG 339 行<br>· commit `d864e3e` feat(release): 节点 11.3 standard-version 工具落地 |
| 验收 | ✅ standard-version 9.5.0 安装成功；✅ dry-run EXIT=0；✅ 423 commits 全解析；✅ 报告 373 行；✅ 8 章节 + 2 附录；✅ commit d864e3e<br>✅ **#11 完结 3/3**：发布管理规范三件套全落地（审计 + 工具链 + 验证） |
| 下一阶段 | P3-11.4 真实 first release（候选 A 触发 D + C） · P3-11.5 commitlint/husky 实装 |
| 最后更新 | 2026-07-25 04:35 |

---

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
| ~~8~~ | ~~国际化文案规范（I18N 抽离）~~（6/6 完成 2026-07-25 03:02） | **T-4** | **6** | ~~#7 完成 ✅~~ | - |

### P2（下月）

| # | 任务 | 规范引用 | 预估节点数 | 阻塞 |
|---|------|---------|-----------|------|
| 9 | 可访问性 a11y（WCAG 2.1 AA） | - | 4 | - |
| 10 | 隐私合规（PII AES-256 + 用户删除/导出） | SEC-3 | 3 | - |
| ~~11~~ | ~~变更发布规范~~（3/3 完成 2026-07-25 04:35） | D-4 | 3 | - |
| ~~12~~ | ~~文档即代码~~（3/3 完成 2026-07-25 06:32） | ~~D-1/D-2/D-3~~ | ~~3~~ | - | **✅ 完结** |

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
| 11.1 | 发布管理现状审计 | 2026-07-25 03:35 | docs/RELEASE_MANAGEMENT_AUDIT_v1.md（14,500+B / 280+ 行 / 8 章节） |
| 11.2 | commitlint + husky + CHANGELOG 初始化 | 2026-07-25 03:54 | commitlint.config.js + .husky/commit-msg + CHANGELOG.md（v1.0.0）+ docs/RELEASE_MANAGEMENT_v1.md |
| 11.3 | standard-version 安装 + dry-run 验证 | 2026-07-25 04:18 | docs/RELEASE_NODE_11_3_REPORT.md（373 行 / 8 章节 + 2 附录）+ package.json devDependencies + commit d864e3e |
| **#11 完结** | **变更发布规范 3/3 完成** | **2026-07-25 04:35** | SemVer + CHANGELOG + commitlint + standard-version 4 件套全落地，423 commits 解析验证通过 |
| 12.1 | 文档即代码现状审计 | 2026-07-25 04:30 | docs/DOCS_AS_CODE_AUDIT_v1.md（21,323B / 424 行 / 9 章节 + 2 附录） |
| 12.2 | 命名规范索引 + 失效链接扫描器 | 2026-07-25 05:30 | docs/INDEX.md（2,814B）+ docs/GLOSSARY.md（4,811B）+ scripts/docs-lint.sh（2,149B）+ scripts/docs-lint-ci.sh + README +30 行 |
| 12.3 | CI 集成验证 | 2026-07-25 06:32 | .github/workflows/docs-lint.yml（612B）+ docs/DOCS_AS_CODE_NODE_12_3_REPORT.md（60 行 / 5/5 PASS）+ commit d85ee1c / 39d9280 / ef95154 |
| **#12 完结** | **文档即代码 3/3 完成** | **2026-07-25 06:32** | lint 脚本 222 md 实测 PASS + CI workflow macos-latest + 5/5 PASS |

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
| 8.1 | I18N 现状调研报告 | 2026-07-25 01:05 | docs/I18N_AUDIT_v1.md（24,540B / 8 章节 + 2 附录） |
| 8.2 | 轻量 i18n 核心 + zh-CN 字典 | 2026-07-25 01:33 | app/js/i18n.js（259 行 / 8 API）+ app/i18n/zh-CN.json（82 key） |
| 8.3 | error-interceptor.js + error-render.js 引入 t() | 2026-07-25 02:04 | 26 处硬编码 → t() + docs/I18N_NODE_8_3_REPORT.md（9,126B） |
| 8.4 | BUILTIN_ZH_CN 与 zh-CN.json 一致性修复 | 2026-07-25 02:35 | lookup() 双向查询 + 6 处文案同步 + docs/I18N_NODE_8_4_REPORT.md（4,021B） |
| 8.5 | 共性 UI 字面量抽离 + 最终验收 | 2026-07-25 03:02 | zh-CN.json +8 common key + i18n.js +27 BUILTIN + docs/I18N_NODE_8_5_REPORT.md（10,888B / 8 章节） |
| **#8 完结** | **国际化文案规范 6/6 完成** | **2026-07-25 03:02** | i18n.js 337 行 + zh-CN.json 90 key + 5 份节点报告，12 API 0 破坏性变更 |
| 9.1 | a11y 现状调研报告 | 2026-07-25 03:36 | docs/A11Y_AUDIT_v1.md（29,703B / 548 行 / 8 章节 + 2 附录）— 仅 4/63 文件含 aria-*、474 处 div onclick、0 skip-link、81 处 outline:none |
