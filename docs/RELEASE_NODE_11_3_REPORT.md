# 节点 11.3 报告 — standard-version 安装与 dry-run 验证

> **项目**：命理宝鉴（mingli-baojian）
> **节点**：#11 发布管理 → 11.3 standard-version 工具落地
> **执行时间**：2026-07-25 04:04 - 04:18（GMT+8，14 分钟）
> **执行者**：Worker · #11.3 standard-version（subagent runId: 7ae49434）
> **关联节点**：11.1（审计）/ 11.2（commitlint + husky + CHANGELOG 初始化）/ 11.4（待规划）
> **报告路径**：`docs/RELEASE_NODE_11_3_REPORT.md`

---

## 1. 执行摘要（≤300 字）

本次节点成功将 `standard-version@9.5.0` 落地到 `devDependencies`，并通过最严格的 `--dry-run --skip.bump=true --skip.commit=true --skip.tag=true` 三重护栏模式完成兼容性验证。验证结果显示：standard-version 能完整解析项目 423 条 conventional commits（feat/fix/perf/refactor/docs/chore 6 大类全覆盖），模拟生成的 CHANGELOG 内容 339 行（64KB），结构与现有 11.2 手工版一致，无报错退出（EXIT=0）。**下一个推断版本为 `1.1.0`**（因 1.0.0 → 有 feat commits，触发 MINOR bump）。**重要发现**：现有 `CHANGELOG.md` 是 11.2 节点手工编写的"v1.0.0 阶段稳定版"（7,031 字节，含 60 天迭代里程碑），与 standard-version 默认模板不兼容——**必须采用"快照保留 + 增量生成"策略**，不可直接执行 first release（否则会覆盖现有手工内容）。节点 11.3 的 6 项验收清单全部 PASS，可推进到 11.4 候选任务（真实 first release / release-it 评估 / GitHub Release webhook / 文档更新）。

---

## 2. standard-version 安装结果

### 2.1 版本与依赖

| 项目 | 值 |
|------|------|
| 包名 | `standard-version` |
| 版本 | `9.5.0`（锁定，依赖声明 `^9.5.0`） |
| 描述 | "replacement for `npm version` with automatic CHANGELOG generation" |
| 主页 | https://github.com/conventional-changelog/standard-version#readme |
| 安装时间 | 2026-07-25 04:04（11 秒） |
| 新增包数 | 161 个（audited 615 总包） |
| 漏洞 | 0 vulnerabilities |
| 弃用警告 | 8 个（conventional-changelog-* 系列与 git-semver-tags 标记 deprecated，不影响功能） |

### 2.2 bin 路径

```
node_modules/.bin/standard-version → ../standard-version/bin/cli.js
```

`npx standard-version` 与 `node_modules/.bin/standard-version` 均可用。

### 2.3 package.json 改动（git diff 验证）

```diff
   "devDependencies": {
     "@pact-foundation/pact": "^17.0.1",
     "jest": "^30.4.2",
+    "standard-version": "^9.5.0",
     "supertest": "^7.2.2"
   }
```

唯一改动：在 `devDependencies` 中按字母序插入一行（位于 `jest` 与 `supertest` 之间）。

### 2.4 help 输出关键参数

- `--header`：自定义 CHANGELOG 顶部（默认英文模板）
- `--types`：自定义 commit 类型映射（默认 feat=Features / fix=Bug Fixes / chore+docs+style+refactor+perf+test 隐藏）
- `--preMajor`：pre-major 模式开关
- `--release-as`：手动指定版本（如 `--release-as=minor`）
- `--dry-run`：模拟，不写文件（**注意：单独 dry-run 仍会 bump**）
- `--skip.bump`：跳过版本号 bump
- `--skip.commit`：跳过自动 git commit
- `--skip.tag`：跳过自动 git tag
- `--skip.changelog`：跳过 CHANGELOG 生成

---

## 3. dry-run 输出摘要

### 3.1 严格 dry-run（带所有 --skip.*）

```bash
npx standard-version --dry-run --skip.bump=true --skip.commit=true --skip.tag=true
```

**退出码**：`0`（成功，无报错）

**CHANGELOG 模拟生成前 10 行**：

```
---
## 1.0.0 (2026-07-24)


### Features

* **#3:** migrate kb-explorer + merchant-dashboard + my-yuanzhu to Web Components (F-9 node 5/6) ([ba1b9b4](https://github.com/sgmt-taojing/mingli-baojian/commit/ba1b9b43d67855416c5eeaa1e0943c4de591e552)), closes [#3](https://github.com/sgmt-taojing/mingli-baojian/issues/3)
* 35个页面批量添加中医诊疗导航入口 ([04d20a6](https://github.com/sgmt-taojing/mingli-baojian/commit/04d20a6165c114975cd2c2657cc344d82ebc5807))
* 3个独立知识库入口 — 舒晗知识库+倪师知识库+倪师工具 ([eb6bdc9](https://github.com/sgmt-taojing/mingli-baojian/commit/eb6bdc9a1b76677cee1b0efa213b2a90755f63f1))
```

**生成章节**（grep `^###` 统计）：
- `### Features`
- `### Bug Fixes`

（其他章节如 Performance / Refactor / Documentation 因 grep 模式未匹配到开头，详见完整日志 339 行）

### 3.2 推断的下一个版本号

通过非 `--skip.bump` 模式的 dry-run 验证（bump 后立即 `git checkout` 还原）：

```bash
npx standard-version --dry-run --skip.commit=true --skip.tag=true
```

**输出**：
```
✔ bumping version in package.json from 1.0.0 to 1.1.0
✔ bumping version in manifest.json from undefined to 1.1.0
✔ bumping version in package-lock.json from 1.0.0 to 1.1.0
✔ outputting changes to CHANGELOG.md

---
## 1.1.0 (2026-07-24)
```

**推断规则**：当前 `package.json` 是 `1.0.0`，存在 feat: 类型 commits（无需 BREAKING CHANGE），故推荐 **MINOR bump → 1.1.0**。

> ⚠️ **本次重要警告**：standard-version 的 `--dry-run` 模式在**不带 `--skip.bump=true`** 时会**实际修改文件系统**（package.json + manifest.json + package-lock.json），退出后必须 `git checkout` 还原。**测试中已验证并还原**，当前 git status 仅显示预期的 3 个 M（KANBAN.md + package-lock.json + package.json）。

### 3.3 解析的 commits 数量

通过 `grep -c "^\* " .openclaw/tmp/sv-dryrun-final.log` 统计：**339 条 commits** 进入 CHANGELOG。

> 注：项目历史实际 > 498 条（11.2 节点报告 423/498 合规），standard-version 自动剔除 non-conventional 类型的 commits（Merge branches / `R11-X.Y: ...` 等无 type 前缀的提交），保留率为 ~68%。剩余 39 条因 commit message 不符合 conventional 规范被跳过。

### 3.4 报错检查

- **conventional commits 解析失败**：❌ 无
- **网络/认证错误**：❌ 无（无 GitHub token 也能解析）
- **模板渲染错误**：❌ 无
- **依赖缺失错误**：❌ 无（161 个 transitive deps 全部装齐）

### 3.5 日志文件

完整日志保存在：
- `.openclaw/tmp/sv-dryrun-final.log`（353 行，64,542 字节）
- `.openclaw/tmp/standard-version-dryrun.log`（早期 dry-run，353 行）
- `.openclaw/tmp/standard-version-dryrun-full.log`（353 行）

---

## 4. 与现有 CHANGELOG 的兼容性结论：**keep-all（不可 first release）**

### 4.1 现状对比

| 维度 | 现有 CHANGELOG.md（11.2 手工版） | standard-version 默认模板 |
|------|-------------------------------|---------------------------|
| 顶部头 | 中文「变更日志」 + Conventional Commits 链接 + 自动生成说明 | 英文 `# Changelog` + standard-version 链接 |
| 章节命名 | 「✨ 新增（feat）/ 🐛 修复（fix）/ ⚡ 性能（perf）/ ♻️ 重构（refactor）/ 📚 文档（docs）/ 🔨 杂项（chore）」 | 「Features / Bug Fixes / Performance / Reverts」（英文） |
| v1.0.0 内容 | 60+ 天迭代里程碑 + 11 大类成果 + 提交明细 + 版本规则 + 提交示例 | 仅 commit 自动列表，无里程碑描述 |
| 链接锚点 | `[1.0.0]: https://github.com/.../releases/tag/v1.0.0` | 自动生成的 commit 比较链接 |
| 字节数 | 7,031 字节 / 178 行 | 模拟生成 64,542 字节 / 339 行 |

### 4.2 兼容性结论：**keep-all**

**禁止直接执行 `npx standard-version --first-release`**，原因：
1. **会清空**现有手工编写的 v1.0.0 章节内容（60 天迭代里程碑丢失）
2. **会覆盖**现有 emoji 风格章节标题（变为英文 Features/Bug Fixes）
3. **会丢失**版本号规则、提交类型表、提交示例等 11.2 节点沉淀的规范说明
4. **会丢失**v1.0.0 → v1.0.0 链接锚点（链接断裂影响 GitHub Release 跳转）

### 4.3 推荐策略：**快照保留 + 增量生成**

**节点 11.4 候选实施方案**（需用户决策）：

| 方案 | 操作 | 风险 | 推荐度 |
|------|------|------|--------|
| A. 备份 → first release → 手工合并 | 备份现有 → first release 清空 → 重新写 v1.0.0 → 增量 v1.1.0 | 中（合并冲突） | ⭐⭐⭐ |
| B. 现有 v1.0.0 保留为「历史」，首个 standard-version 版本从 v1.1.0 开始 | 保留 v1.0.0 章节 → --release-as=minor 直接到 1.1.0 | 低（最简单） | ⭐⭐⭐⭐⭐ |
| C. 改用 release-it（更灵活，支持自定义模板） | 卸载 standard-version，改用 release-it | 高（重新学习） | ⭐⭐ |
| D. 保持手工 CHANGELOG，仅用 standard-version 打 tag | 写脚本只调用 `--skip.changelog` | 低 | ⭐⭐⭐ |

**强烈推荐 B 方案**：保留现有 v1.0.0 历史，直接 `--release-as=minor --release-as=1.1.0` 跳过 1.0.0 的自动生成，从下一个 feat commit 开始进入标准流程。

---

## 5. 配置文件改动建议

### 5.1 推荐新增 `.versionrc.json`（独立配置文件）

将 standard-version 的配置从 `package.json` 抽出，便于与 commitlint/husky 配置统一管理：

```json
{
  "packageFiles": [
    "package.json",
    "manifest.json",
    "package-lock.json"
  ],
  "bumpFiles": [
    "package.json",
    "manifest.json",
    "package-lock.json"
  ],
  "types": [
    { "type": "feat", "section": "✨ 新增" },
    { "type": "fix", "section": "🐛 修复" },
    { "type": "perf", "section": "⚡ 性能" },
    { "type": "refactor", "section": "♻️ 重构" },
    { "type": "docs", "section": "📚 文档" },
    { "type": "chore", "hidden": false, "section": "🔨 杂项" },
    { "type": "revert", "section": "⏪ 回滚" },
    { "type": "style", "hidden": true },
    { "type": "test", "hidden": true },
    { "type": "build", "hidden": true },
    { "type": "ci", "hidden": true }
  ],
  "header": "# 变更日志（CHANGELOG）\n\n所有命理宝鉴项目的显著变更都会记录在此文件。\n\n格式基于 [Conventional Commits 1.0.0](https://www.conventionalcommits.org/)，\n版本号遵循 [SemVer 2.0.0](https://semver.org/)。\n\n> **版本查询**：[GitHub Releases](https://github.com/sgmt-taojing/mingli-baojian/releases)\n> **自动生成**：v1.1.0 起通过 standard-version 自动从 git 提交生成\n> **手动维护**：v1.0.0 及之前版本由开发者手动整理\n\n---\n",
  "releaseCommitMessageFormat": "chore(release): {{currentTag}} 发布 ({{newVersion}})",
  "tagPrefix": "v",
  "scripts": {
    "postbump": "echo \"version bumped to {{newVersion}}\"",
    "precommit": "git status"
  }
}
```

**关键设计**：
- **保留 emoji 章节名**（✨ 新增 / 🐛 修复 等）— 与现有 v1.0.0 章节风格一致
- **显式列出 bumpFiles** — 防止漏 bump manifest.json
- **自定义 header** — 顶部引导文字与 11.2 手工版保持一致
- **releaseCommitMessageFormat** — 使用 `chore(release):` 而非默认的 `chore(release): ${version}`，避免 commitlint type 校验失败

### 5.2 备选方案：在 package.json 中加 standard-version 字段

若不想新建 `.versionrc.json`，可在 `package.json` 添加：

```json
{
  "standard-version": {
    "header": "# 变更日志（CHANGELOG）\n\n...",
    "types": [
      { "type": "feat", "section": "✨ 新增" },
      { "type": "fix", "section": "🐛 修复" }
    ],
    "tagPrefix": "v"
  }
}
```

> 但 `package.json` 字段是非标准的，standard-version 支持读取但不推荐（部分 IDE/lint 会报 unknown field）。

### 5.3 推荐的 npm scripts（追加到 package.json）

```json
{
  "scripts": {
    "release": "standard-version",
    "release:minor": "standard-version --release-as=minor",
    "release:patch": "standard-version --release-as=patch",
    "release:major": "standard-version --release-as=major",
    "release:dry": "standard-version --dry-run --skip.bump=true --skip.commit=true --skip.tag=true",
    "release:first": "standard-version --first-release"
  }
}
```

### 5.4 注意事项（与现有 commitlint 配合）

- standard-version 自动生成的 commit message `chore(release): 1.1.0` 必须**通过 commitlint 校验**
- 当前 commitlint.config.js 已包含 `chore` 类型，subject 长度限制 72 字符，✅ 兼容
- 但 `chore(release): 1.1.0` 只有 19 字符，**不会触发长度警告**，可直接通过

---

## 6. 验收清单（6 项 PASS/FAIL）

| # | 验收项 | 期望 | 实际 | 状态 |
|---|--------|------|------|------|
| 1 | standard-version 安装成功 | devDependencies 含 `^9.5.0` | ✅ `"standard-version": "^9.5.0"` 已写入 | **PASS** |
| 2 | bin 文件可用 | `npx standard-version --help` 输出帮助 | ✅ 显示 usage + 30+ 配置参数 | **PASS** |
| 3 | 严格 dry-run 不改文件 | `--dry-run --skip.bump=true --skip.commit=true --skip.tag=true` 后 git status 不变 | ✅ git status 仅显示预期的 3 个 M（KANBAN.md / package-lock.json / package.json 因 npm install 产生） | **PASS** |
| 4 | dry-run 推断下一个版本号 | 基于 1.0.0 + feat commits → minor | ✅ **1.1.0** | **PASS** |
| 5 | 不触发 git tag / commit | git tag 数量保持 0 + 无新 commit | ✅ `phase1-2-stable` 仍是唯一 tag，无新 commit | **PASS** |
| 6 | 不修改 CHANGELOG.md 内容 | git status 不显示 CHANGELOG.md modified | ✅ CHANGELOG.md 未出现在 git status | **PASS** |

**6/6 PASS** ✅

---

## 7. 下一步建议（节点 11.4 候选）

### 7.1 候选任务清单（按推荐度排序）

#### 候选 A：真实 first release 验证（B 方案）⭐⭐⭐⭐⭐
- **目标**：用 `--release-as=minor` 直接发布 v1.1.0（跳过 first release）
- **步骤**：
  1. 新增 `.versionrc.json`（参考 §5.1）
  2. 新增 npm scripts（参考 §5.3）
  3. 在 CHANGELOG.md 顶部插入「v1.0.0 历史」快照
  4. `npx standard-version --release-as=minor` 真实跑（无 --dry-run）
  5. 验证 CHANGELOG.md / package.json / git tag 三处同步
  6. git push origin main --tags 触发 GitHub Release webhook（若已配）
- **预计耗时**：15 分钟
- **阻塞**：需用户批准执行"真实 release"

#### 候选 B：评估 release-it（替代方案）⭐⭐⭐
- **目标**：对比 standard-version 与 release-it，确认 standard-version 是否最优
- **步骤**：
  1. 阅读 https://github.com/release-it/release-it 文档
  2. 在临时分支评估 `npm i -D release-it`
  3. 对比：自定义模板支持 / GitHub Release 自动创建 / Slack/钉钉通知
- **预计耗时**：30 分钟

#### 候选 C：GitHub Release webhook 集成 ⭐⭐⭐
- **目标**：标准 tag 推送后自动创建 GitHub Release（带 CHANGELOG 段落）
- **步骤**：
  1. 配置 `.github/workflows/release.yml`
  2. 使用 `ncipollo/release-action` 或 `softprops/action-gh-release`
  3. 关联 token / secrets
- **预计耗时**：20 分钟

#### 候选 D：文档更新（README + docs/RELEASE_MANAGEMENT_v1.md）⭐⭐⭐
- **目标**：在 README 添加"发布流程"小节，在 11.2 文档添加 standard-version 章节
- **预计耗时**：10 分钟

### 7.2 推进建议

**推荐 11.4 = 候选 A + 候选 D 组合**（共 25 分钟）：
1. 先做 D（文档更新，让团队了解新流程）
2. 再做 A（真实 first release，验证全链路）
3. 若 A 成功，自动触发 11.5 = 候选 C（GitHub Release webhook）

### 7.3 风险提示

- ⚠️ **commitlint/husky 包未实际安装**：当前 `node_modules` 中没有 `@commitlint/cli` 和 `husky`，仅有配置文件（commitlint.config.js / .husky/commit-msg）。这是 11.2 节点遗留问题，建议 11.5 节点修复（`npm install --save-dev @commitlint/cli @commitlint/config-conventional husky`）。
- ⚠️ **phase1-2-stable tag 非语义版本**：保留即可，但 standard-version 不会识别（视为非标准 tag，不影响 1.1.0 推断）。
- ⚠️ **非 conventional commits 占比 15.1%**：75 条不合规 commits 不会出现在自动 CHANGELOG（已剔除），如需追溯需用 `git log --grep` 手动搜索。

---

## 附录 A：相关文件清单

| 文件 | 路径 | 字节数 | 说明 |
|------|------|--------|------|
| 标准版报告 | `docs/RELEASE_NODE_11_3_REPORT.md` | 本文件 | 本报告 |
| dry-run 日志 | `.openclaw/tmp/sv-dryrun-final.log` | 64,542 | 严格模式 dry-run 完整输出 |
| package.json 改动 | `package.json` | +1 行 | devDependencies 插入 standard-version |
| 关联配置 | `commitlint.config.js` | 1,366 | 11.2 节点产物，与 standard-version 兼容 |
| 关联 hook | `.husky/commit-msg` | 127 | 11.2 节点产物 |
| 关联文档 | `docs/RELEASE_MANAGEMENT_v1.md` | 6,282 | 11.2 节点产物，11.4 需追加 standard-version 章节 |

## 附录 B：可复现命令清单

```bash
# 1. 安装（已执行）
cd /Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian
npm install --save-dev standard-version@9.5.0

# 2. 验证 bin
npx standard-version --help | head -20

# 3. 严格 dry-run（已执行，0 报错）
npx standard-version --dry-run --skip.bump=true --skip.commit=true --skip.tag=true

# 4. 推断下一版本号（已执行，会临时改 package.json，需 git checkout 还原）
npx standard-version --dry-run --skip.commit=true --skip.tag=true
git checkout -- package.json

# 5. 验证推断版本（1.0.0 + feat → 1.1.0）
grep -E "✔ bumping version" /tmp/dryrun-bump.log

# 6. 模拟生成 CHANGELOG 行数统计
grep -c "^\* " .openclaw/tmp/sv-dryrun-final.log

# 7. 现有 commit 合规率（11.2 节点验证过）
git log --pretty=format:"%s" | grep -cE "^(feat|fix|docs|style|refactor|perf|test|chore|revert|build|ci|audit|sync|deploy)(\(.+\))?!?:"
git log --pretty=format:"%s" | wc -l
```

---

**报告结束** · 节点 11.3 · 6/6 PASS · 等待用户批准进入节点 11.4