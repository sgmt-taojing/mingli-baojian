# 命理宝鉴 · 变更发布规范 v1.0

> **生效日期**：2026-07-25
> **依据文档**：[RELEASE_MANAGEMENT_AUDIT_v1.md](./RELEASE_MANAGEMENT_AUDIT_v1.md)
> **适用版本**：v1.0.0 起所有版本

---

## 一、版本号规则（SemVer 2.0.0）

```
MAJOR.MINOR.PATCH[-PRERELEASE]

例：1.2.0         稳定版
    2.0.0-alpha   内部测试
    2.0.0-beta.1  公测
    2.0.0-rc.1    候选发布
```

| 位 | 触发 | 说明 |
|----|------|------|
| MAJOR | `feat:` 含 `BREAKING CHANGE:` 或 `fix:` 含 `BREAKING CHANGE:` | 不兼容 API 变更 |
| MINOR | `feat:`（无 BREAKING CHANGE） | 新增功能（向后兼容）|
| PATCH | `fix:` 或 `perf:` | 修复缺陷或性能优化 |
| PRERELEASE | 标准 alpha/beta/rc 标签 | 预发布版本 |

## 二、提交消息规则（Conventional Commits 1.0.0）

### 格式

```
<type>(<scope>)!: <subject>

<body>

<footer>

BREAKING CHANGE: <description>
Refs: #<issue>
```

### type 枚举（命理宝jian 14 类）

| type | 触发版本 | 含义 |
|------|---------|------|
| `feat` | MINOR | 新功能 |
| `fix` | PATCH | 修复 |
| `perf` | PATCH | 性能优化 |
| `docs` | - | 仅文档变更 |
| `style` | - | 格式（不影响代码运行）|
| `refactor` | - | 重构（非新功能非修复）|
| `test` | - | 测试 |
| `build` | - | 构建系统/外部依赖 |
| `ci` | - | CI 配置文件和脚本 |
| `chore` | - | 其他修改 |
| `revert` | PATCH | 回退 |
| `audit` | PATCH | 安全审计（命理宝jian 定制）|
| `sync` | PATCH | 同步上游/版本（命理宝jian 定制）|
| `deploy` | - | 部署相关（命理宝jian 定制）|

### scope 建议（命理宝jian 模块）

| scope | 模块 |
|-------|------|
| `kb` | 知识库 |
| `api` | API 网关 |
| `glass` | 智能眼镜 |
| `wearable` | 穿戴 SDK |
| `ai` | AI 助手 |
| `i18n` | 国际化 |
| `a11y` | 可访问性 |
| `perf` | 性能 |
| `kb-router` | KB 路由器 |
| `kb-audit` | KB 审计 |
| `admin` | 管理后台 |
| `divination-hub` | 易道智鉴主页 |
| `divination-integrated` | 易道综合 |
| `lifeplan` | 人生规划 |
| `static` | 静态服务 |

### 规则限制

| 规则 | 限制 |
|------|------|
| `subject-empty` | 永不为空 |
| `subject-max-length` | ≤ 72 字符 |
| `subject-case` | 英文小写开头（不允许 Sentence/Start/Pascal/Upper Case）|
| `header-max-length` | ≤ 100 字符 |
| `type-enum` | 必须为 14 类之一 |
| `scope-case` | 小写（如 `(kb-router)` 而非 `(KB-Router)`） |

## 三、CHANGELOG 自动生成

### 工具：standard-version（或 release-it）

**安装**：
```bash
npm install --save-dev standard-version
```

**package.json 脚本**：
```json
{
  "scripts": {
    "release": "standard-version",
    "release:minor": "standard-version --release-as minor",
    "release:major": "standard-version --release-as major",
    "release:patch": "standard-version --release-as patch",
    "release:first": "standard-version --release-as initial"
  }
}
```

**执行效果**：
1. 读取所有 `feat:`/`fix:`/`perf:`/`revert:`/`BREAKING CHANGE:` 类型的 commit
2. 按 type 分组追加到 `CHANGELOG.md`
3. 自动 bump `package.json` 的 version
4. 自动 `git tag -a v<version>`
5. 自动 `git commit -m "chore(release): v<version>"`

**手动首次发布**（v1.0.0）：
```bash
npx standard-version --release-as initial
```

## 四、commitlint + husky 配置

### commitlint.config.js

位于项目根 `commitlint.config.js`：

```js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [
      'feat', 'fix', 'docs', 'style', 'refactor', 'perf',
      'test', 'build', 'ci', 'chore', 'revert',
      'audit', 'sync', 'deploy'
    ]],
    'subject-empty': [2, 'never'],
    'subject-max-length': [2, 'always', 72],
    'subject-case': [2, 'never', ['sentence-case', 'start-case', 'pascal-case', 'upper-case']],
    'header-max-length': [2, 'always', 100],
  },
};
```

### .husky/commit-msg hook

位于项目根 `.husky/commit-msg`：

```sh
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"
npx --no-install commitlint --edit "$1"
```

### 安装步骤（一次性）

```bash
# 1. 安装 husky
npm install --save-dev husky @commitlint/cli @commitlint/config-conventional
npx husky install

# 2. 创建 commit-msg hook
npx husky add .husky/commit-msg "npx --no-install commitlint --edit \$1"
chmod +x .husky/commit-msg

# 3. 测试
echo "test commit" | npx commitlint   # 应失败
echo "feat(api): test" | npx commitlint  # 应通过
```

## 五、版本发布流程

### 自动流程（推荐）

```bash
# 1. 确认 main 分支干净
git status
git pull origin main

# 2. 跑 standard-version（自动 CHANGELOG + tag + commit）
npm run release

# 3. 推送 tag + commit
git push --follow-tags origin main

# 4. GitHub 自动同步 Release（可选配 .github/workflows/release.yml）
```

### 手动流程（应急）

```bash
# 1. 编辑 CHANGELOG.md（追加本版本变更）
# 2. 修改 package.json 的 version 字段
# 3. git commit -m "chore(release): v1.2.0"
# 4. git tag -a v1.2.0 -m "v1.2.0 release notes"
# 5. git push --follow-tags origin main
```

## 六、分支策略

### 主分支

| 分支 | 用途 |
|------|------|
| `main` | 稳定版本，仅接受合并 PR |
| `develop`（可选）| 开发分支 |
| `gh-pages` | GitHub Pages 静态文件 |

### 功能分支

```bash
git checkout -b feat/issue-123-kb-zidian-extract
# ... 开发 ...
git commit -m "feat(kb): 紫微斗数字典抽取"
git push origin feat/issue-123-kb-zidian-extract
# 在 GitHub 创建 PR → main
```

### 命名约定

- `feat/issue-N-<short-desc>` — 新功能
- `fix/issue-N-<short-desc>` — 修复
- `chore/<short-desc>` — 杂项
- `release/v1.2.0` — 发布分支

## 七、GitHub Release 同步（可选）

### .github/workflows/release.yml

```yaml
name: Release
on:
  push:
    tags: ['v*']
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: softprops/action-gh-release@v1
        with:
          generate_release_notes: true
          draft: false
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## 八、版本回退策略

### patch 回退（小版本）

```bash
git revert <commit-sha>
git commit -m "revert: 撤销 v1.2.0 中引入的问题"
npm run release:patch  # 触发 v1.2.1
```

### major 回退（破坏性回退）

```bash
git tag -d v1.3.0
git reset --hard v1.2.0  # ⚠️ 慎用，会丢失 commit
git push --force origin main  # ⚠️ 慎用
npm run release:major  # 触发 v2.0.0
```

### 推荐：用 revert 而非 reset

```bash
# ✅ 推荐（保留历史）
git revert <commit-sha>

# ⚠️ 不推荐（丢失历史）
git reset --hard <old-commit>
```

## 九、监控与告警

### 健康指标

| 指标 | 阈值 | 监控方式 |
|------|------|---------|
| 合规 commit 占比 | ≥ 90% | `bash scripts/check-commit-compliance.sh` |
| CHANGELOG.md 与 git tag 同步 | 100% | GitHub Actions |
| `package.json` version 与最新 tag 一致 | 100% | GitHub Actions |

### 不合规告警

commitlint 会拒绝不合规 commit，开发者在 `git commit` 时立即看到错误，无需 CI 检查。

## 十、参考资料

- [Conventional Commits 1.0.0](https://www.conventionalcommits.org/)
- [SemVer 2.0.0](https://semver.org/)
- [commitlint](https://commitlint.js.org/)
- [husky](https://typicode.github.io/husky/)
- [standard-version](https://github.com/conventional-changelog/standard-version)
- [Angular 提交规范](https://github.com/angular/angular/blob/master/CONTRIBUTING.md)

---

**维护者**：AutoClaw 🦞
**最后更新**：2026-07-25 03:53
**下次审查**：v1.5.0 发布前（2026-08 末）