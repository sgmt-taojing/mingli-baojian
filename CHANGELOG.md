# 变更日志（CHANGELOG）

所有命理宝鉴项目的显著变更都会记录在此文件。

格式基于 [Conventional Commits 1.0.0](https://www.conventionalcommits.org/)，
版本号遵循 [SemVer 2.0.0](https://semver.org/)。

> **版本查询**：[GitHub Releases](https://github.com/sgmt-taojing/mingli-baojian/releases)
> **自动生成**：未来版本将通过 standard-version 自动从 git 提交生成
> **手动维护**：v1.0.0 及之前版本由开发者手动整理

---

## [1.0.0] - 2026-07-25 · 阶段稳定版

### 🎯 阶段里程碑

经过 60+ 天迭代（2026-05-17 → 2026-07-25），命理宝jian 完成以下核心能力：

- ✅ **22 模块知识库全可用**（KB 总数 11,530+ 条结构化条目）
- ✅ **API 网关 v2 上线**（49 路由 + 21 v1 alias + RBAC 鉴权）
- ✅ **前端组件库统一**（toast/modal/tab 3 个 Web Components）
- ✅ **错误处理规范**（27.5KB 拦截器 + 25 错误码全量文案）
- ✅ **性能基线达标**（gzip 静态服务 1.8MB→521KB，Range 206 支持）
- ✅ **可观测性**（pino 结构化日志 + 12 事件埋点 + 仪表盘）
- ✅ **测试规范**（71.73% 覆盖率 + supertest 集成测试）
- ✅ **国际化文案**（zh-CN/en-US 双语资源 + 6 个页面迁移）
- ✅ **a11y 修补**（WCAG 2.1 AA 5 项 P0 修补）
- ✅ **隐私合规**（PII AES-256 + 用户删除/导出 API）
- ✅ **智能眼镜**（Rokid SDK 接入 + 多品牌扩展接口）

### ✨ 新增（feat）

#### 智能眼镜穿戴 SDK（wearable）
- 先知智镜 · Rokid SDK 接入 + 多品牌扩展接口 + 经络子午流注 KB
- R44-C · 智能眼镜 Admin 后台端点（test/health/broadcast/yearly-broadcast）
- R43-F · 智能眼镜 HTTP bridge（/api/glass/* 6 端点）

#### 智能助手（ai-assistant）
- R41-E · KB 命中 UI 升级（浮动得分 badge + 动画 + 来源标注）
- R40-E · KB 命中落库端点（/api/ai/kb-hit-log + /api/ai/kb-hit-stats）

#### 生活规划（lifeplan）
- R41-B · 12 领域矩阵注入（4 阶段 × 12 领域 = 48 维度 + CSS + JS）
- R41-B · 4 人生阶段深度补强（学龄前/小学中学/大学职场/中年成熟）

#### 化解模块（divination-hub）
- R41-A · 化解 4 宫双核注入（迁移+福德+兄弟+田宅，21→24 模块）
- R41-A · 化解 4 宫深度补强

#### 知识库（kb）
- R40-C · 2108 条 R39 KB 入库 yidao.db（kb_formal 1990→4098）
- R40-D · 5 页面双核速查最小注入（more-functions/almanac/qimen/oracle/membership）

#### 管理后台（admin）
- R43-D · KB 总台 + AI 落库修正（admin stats + search + ingest + ai hit-log/stats v2）

#### 技能系统（skill）
- R43-E · 55 个 skills 全量体检 v2
- R43-B · nihaisha skill 内联归档
- R41-F · skill-vetter 自动评估

#### 可访问性（a11y）
- #9 · 节点 9.2 组件层 + 样式层 P0 修补（5/7 PASS）

#### 国际化（i18n）
- #8 · 国际化文案规范 6/6 节点完成

#### 性能（perf）
- 性能基线 1/4 + 错误处理规范全套（#4 #5.1）

#### 组件库（components）
- #3 · 迁移 kb-explorer + merchant-dashboard + my-yuanzhu 到 Web Components
- 396KB inline 测算引擎库抽离为 js/divination-engine.js
- 163KB inline style 提取为外部 CSS
- 顶部 _sixCard 智能兜底替代手工注入（覆盖全部 22 模块）

### 🐛 修复（fix）

- a11y · divination-integrated.html button/span 标签不匹配
- server · R44-B send-push 函数体修复 + 玻璃块独立
- zidise-illness · HTML 三大模块注入锚点修复
- kb-router · 17 KB_SOURCES 全覆盖 + 4 topic groups + reviewed_by 回填
- kb-audit · 审计链路断裂修复（auditEntry/promoteToFormal 写 kb_audit）
- api · 全局错误兜底中间件 + 404 JSON 响应
- ai-assistant · typing() 与 callAI() ReferenceError 修复
- ai-assistant · 防止报告生成期间用户输入触发模块重启死循环
- divination-hub · 删除自引用 :root{} 块（变量死循环导致 CSS 失效）
- kb-fallback · 消除 3 处 Math.random() 替换为确定性 hash
- 家庭综合排盘功能修复 — 替换 stub 为真实引擎
- 黄历页面 CSS 变量自引用导致颜色失效修复

### ⚡ 性能（perf）

- gzip 静态服务 + Range 支持（节点 5.2.5 v1.1）
- 倪师/舒晗知识库加载优化（HTTP 请求 6+3→1+1）

### ♻️ 重构（refactor）

- 倪师 KB 知识蒸馏（6 个镜像文件 4.87MB → 1 个蒸馏文件 881KB，82%↓）
- 全量 var→let 迁移（11 个 JS + 10 个 HTML 文件，4204 处替换）
- 硬编码颜色全量迁移 CSS 变量（5 轮替换 4473→62 处）
- tizhi-module.js inline style 提取为 CSS class（99→16 处）
- TD2 engine-v3-bundle.js 1190 处 var→let/const 全部完成
- TD2 divination-core.js 5976 处 var→let/const 全部完成
- 知识库容量压缩（删除重复/开发工具/备份文件）

### 📚 文档（docs）

- docs/STATIC_GZIP_SERVICE_v1.1.md（5,186 字节）
- docs/PERFORMANCE_BUDGET.md（7,311 字节）
- docs/ERROR_HANDLING_INTERCEPTOR_v2.md（6,114 字节）
- docs/ERROR_HANDLING_STANDARD.md
- docs/ERROR_HANDLING_AUDIT_v1.md
- docs/RELEASE_MANAGEMENT_AUDIT_v1.md（14,500+ 字节）
- docs/API_V1_KB_STANDARD.md（5,127 字节）
- lighthouserc.json（1,345 字节）

### 🔨 杂项（chore）

- 整合 KB 文件位置 + 清理临时脚本
- 清理孤儿 JS 文件
- 关心维度集成
- 端口表刷新 v2
- KB API 鉴权修复（optionalAuth 公开浏览）
- 倪师五课 KB（242 条）5 模块全覆盖

---

## 版本说明

### 版本号规则（SemVer 2.0.0）
```
MAJOR.MINOR.PATCH

MAJOR: 破坏性变更（不兼容 API）
MINOR: 新增功能（向后兼容）
PATCH: 修复缺陷（向后兼容）
```

### 提交类型（Conventional Commits 1.0.0）
| 类型 | 触发版本 | 说明 |
|------|---------|------|
| `feat:` | MINOR | 新功能 |
| `fix:` | PATCH | 修复 |
| `feat:` 含 `BREAKING CHANGE:` | MAJOR | 破坏性新功能 |
| `fix:` 含 `BREAKING CHANGE:` | MAJOR | 破坏性修复 |
| `perf:` | PATCH | 性能优化 |
| `refactor:` | - | 重构（不影响版本）|
| `docs:` | - | 文档（不影响版本）|
| `test:` | - | 测试（不影响版本）|
| `chore:` | - | 杂项（不影响版本）|

### 工具链
- **commitlint** + **husky** commit-msg hook — 校验 commit message 格式
- **standard-version** — 自动从 conventional commits 生成 CHANGELOG + 打 tag
- **GitHub Releases** — 每个 tag 自动同步到 GitHub Release

### 提交示例

```bash
# ✅ 新功能（→ MINOR 版本）
git commit -m "feat(kb): 新增紫微斗数 14 主星 KB"

# ✅ 修复（→ PATCH 版本）
git commit -m "fix(api): 修复 /api/v1/kb 鉴权 401"

# ✅ 破坏性变更（→ MAJOR 版本）
git commit -m "feat(api)!: 重构 KB 路由为 /api/v2/kb

BREAKING CHANGE: /api/v1/kb 已废弃，请迁移到 /api/v2/kb"

# ✅ 含作用域
git commit -m "fix(glass): bridge 离线 KB 路径错误"
```

---

[1.0.0]: https://github.com/sgmt-taojing/mingli-baojian/releases/tag/v1.0.0