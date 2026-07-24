# 性能预算规范 · PERFORMANCE_BUDGET

> **版本**：v1.0  
> **日期**：2026-07-24  
> **负责人**：命理宝鉴开发组  
> **关联任务**：KANBAN #5（性能基线与预算）  
> **规范引用**：P-1（Lighthouse CI）、P-2（Bundle 上限 300KB）

---

## 1. 当前基线数据

以下为 2026-07-24 实测数据，作为优化前基准。

### 1.1 JS 资源

| 资源 | Raw 大小 | Gzipped | 备注 |
|------|----------|---------|------|
| `app/js/` 全部 | 5.5 MB | 1.52 MB | 含核心引擎 + 知识库 + 组件 |
| `divination-core.js` | 2.3 MB | 700 KB | 单文件最大，严重超标 |
| `knowledge/` 目录 | 10 MB | 2.9 MB | 同步加载，阻塞渲染 |
| `knowledge-models/` | 820 KB | 200 KB | 五行/天干地支等数据模型 |
| 组件库 `components/` | 68 KB | ~18 KB | toast/tab/modal（#3 产出） |

### 1.2 CSS 资源

| 资源 | Raw 大小 | Gzipped |
|------|----------|---------|
| 全部 CSS | 312 KB | 57 KB |

### 1.3 最重页面：divination-hub.html

| 指标 | 当前值 | 预算目标 | 超标倍数 |
|------|--------|---------|---------|
| HTML raw | 1.8 MB | 200 KB | **9x** |
| 加载 JS 文件数 | 52 | ≤ 15 | **3.5x** |
| 加载 CSS 文件数 | 2 | ≤ 3 | ✅ |
| JS gzipped 总和 | ~1.5 MB+ | 300 KB | **5x** |
| 最大单 JS gzipped | 700 KB | 100 KB | **7x** |

### 1.4 图片资源

无。项目为纯文本/数据驱动应用，不包含图片资源。

### 1.5 LCP 预估

当前 `divination-hub.html` 因 1.8MB 内联 HTML + 52 个同步 JS 请求，LCP 预估 **>5s**，远超 2.5s 预算。

---

## 2. 核心指标预算

### 2.1 Web Vitals 目标

| 指标 | 预算 | 当前预估 | 状态 |
|------|------|---------|------|
| **LCP** (Largest Contentful Paint) | < 2.5s | > 5s | ❌ 超标 2x+ |
| **TTI** (Time to Interactive) | < 3.5s | > 6s | ❌ 超标 |
| **CLS** (Cumulative Layout Shift) | < 0.1 | 未测 | ⚠️ 待测 |
| **FID** (First Input Delay) | < 100ms | 未测 | ⚠️ 待测 |
| **FCP** (First Contentful Paint) | < 1.8s | > 3s | ❌ 超标 |

### 2.2 达标判定

- 所有 5 个核心页面必须同时满足上述预算
- Lighthouse Performance 评分 ≥ 0.9（目标值，分阶段达到）
- 移动端 4G 慢速网络下 LCP < 4s（降级预算）

---

## 3. Bundle 预算

### 3.1 单页资源上限

| 资源类型 | 预算上限 | 当前最大值 | 超标情况 |
|----------|---------|-----------|---------|
| JS gzipped 总和 | **300 KB** | ~1.5 MB（divination-hub） | 超标 5x |
| 单个 JS 文件 gzipped | **100 KB** | 700 KB（divination-core.js） | 超标 7x |
| CSS gzipped 总和 | **50 KB** | 57 KB（全站） | 轻微超标 |
| HTML raw | **200 KB** | 1.8 MB（divination-hub） | 超标 9x |

### 3.2 文件数量限制

| 资源类型 | 预算上限 | 当前值 |
|----------|---------|--------|
| 同步 JS 文件数/页 | **15** | 52（divination-hub） |
| 异步/懒加载 JS 不限 | — | — |
| CSS 文件数/页 | **3** | 2 ✅ |
| 总请求数/页 | **60** | ~55+ |

### 3.3 预算执行机制

1. **CI 检查**：Lighthouse CI 资源预算断言（见 §5）
2. **代码审查**：新增 JS 模块必须声明 gzipped 大小
3. **自动告警**：单页 JS gzipped 总和超过 300KB 时 CI 失败

---

## 4. 资源策略

### 4.1 知识库懒加载

**问题**：`knowledge/` 目录 10MB raw / 2.9MB gzipped，当前 52 个文件同步加载。

**方案**：
- 按功能域拆分为 6 个懒加载 chunk：
  - `kb-bazi.js`（八字知识库）
  - `kb-qianyuan.js`（乾元知识库）
  - `kb-fengshui.js`（风水知识库）
  - `kb-nihaisha.js`（倪海厦知识库）
  - `kb-shuhan.js`（倪师汉知识库）
  - `kb-common.js`（共享工具函数）
- 使用 `IntersectionObserver` 或用户点击时 `import()` 动态加载
- 加载状态用 skeleton 占位

**预期收益**：首屏 JS 减少 ~2MB gzipped，LCP 改善 ~2-3s

### 4.2 divination-core.js 拆分

**问题**：单文件 2.3MB raw / 700KB gzipped，包含排盘+解析+报告生成等全部逻辑。

**方案**：按功能域拆分：
| 模块 | 预估大小（gzipped） | 职责 |
|------|-------------------|------|
| `core-paipan.js` | ~150 KB | 排盘引擎（天干地支、纳音、神煞） |
| `core-analyze.js` | ~120 KB | 命盘解析（格局、用神、大运） |
| `core-report.js` | ~80 KB | 报告生成（模板渲染、格式化） |
| `core-qimen.js` | ~100 KB | 奇门遁甲专用 |
| `core-ziwei.js` | ~100 KB | 紫微斗数专用 |
| `core-shared.js` | ~50 KB | 共享工具（日期、五行、常量） |

**预期收益**：单文件最大从 700KB → 150KB gzipped，首屏只需加载 `core-shared` + 对应功能模块

### 4.3 HTML 瘦身

**问题**：`divination-hub.html` 1.8MB raw，大量内联 CSS/JS。

**方案**：
- 内联 `<style>` 外提为独立 CSS 文件
- 内联 `<script>` 外提为独立 JS 文件
- 模板数据抽为 JSON，运行时 fetch 加载
- 目标：HTML raw < 200KB

### 4.4 静态资源缓存

| 资源类型 | Cache-Control | 理由 |
|----------|--------------|------|
| 带 hash 的 JS/CSS | `public, max-age=31536000, immutable` | 永久缓存，hash 变更自动失效 |
| HTML | `no-cache` | 需即时更新 |
| 带 hash 的字体 | `public, max-age=31536000, immutable` | 永久缓存 |
| API 响应 | `no-store` | 动态数据 |

**CDN 策略**：
- 静态资源部署到 CDN edge nodes
- 使用 `Cache-Control: immutable` 避免 304 验证请求
- 考虑 Service Worker 离线缓存（已存在 `service-worker.js`）

### 4.5 加载优先级

| 优先级 | 资源 | 策略 |
|--------|------|------|
| P0 | 核心 CSS、core-shared.js | `<link rel="preload">` |
| P1 | 当前页面对应功能模块 | `<link rel="modulepreload">` |
| P2 | 用户可能访问的相邻模块 | idle 预取 |
| P3 | 知识库 chunk | 用户交互时加载 |

---

## 5. Lighthouse CI 配置

### 5.1 配置文件

配置文件位置：项目根目录 `lighthouserc.json`

### 5.2 审计页面

| 页面 | URL | 说明 |
|------|-----|------|
| divination-hub | http://127.0.0.1:8914/divination-hub.html | 最重页面 |
| fengshui | http://127.0.0.1:8914/fengshui.html | 风水页 |
| divination-knowledge | http://127.0.0.1:8914/divination-knowledge.html | 知识库页 |
| ai-assistant | http://127.0.0.1:8914/ai-assistant.html | AI 助手页 |
| divination-integrated | http://127.0.0.1:8914/divination-integrated.html | 综合页 |

### 5.3 断言规则

```json
{
  "assertions": {
    "categories:performance": ["error", { "minScore": 0.5 }],
    "categories:accessibility": ["warn", { "minScore": 0.8 }],
    "categories:best-practices": ["warn", { "minScore": 0.8 }],
    "resource-summary:script:size": ["error", { "maxNumericValue": 307200 }]
  }
}
```

- `performance >= 0.5`：当前低基线，先确保不退化，逐步提升至 0.9
- `script gzipped < 300KB`：硬性预算，超标即 CI 失败
- `accessibility >= 0.8`：软告警，对应 #9 a11y 任务
- `best-practices >= 0.8`：软告警

### 5.4 CI 集成方式

```bash
# 本地运行
lhci autorun --collect.url=http://127.0.0.1:8914/divination-hub.html

# CI 集成（GitHub Actions / 本地脚本）
lhci autorun --config=./lighthouserc.json
```

要求：先启动 8914 静态服务，再执行 Lighthouse 审计。

---

## 6. 分阶段达标计划

### Phase 1: Q3 2026 — 拆分与基线（当前阶段）

| 步骤 | 内容 | 目标 | 预计完成 |
|------|------|------|---------|
| 1.1 | divination-core.js 拆分为 6 个功能模块 | 单文件 < 150KB gz | 2026-08 |
| 1.2 | knowledge/ 目录重组为 6 个 chunk | 知识库按需加载 | 2026-08 |
| 1.3 | divination-hub.html 内联资源外提 | HTML < 300KB raw | 2026-08 |
| 1.4 | Lighthouse CI 纳入本地开发流程 | performance ≥ 0.5 | 2026-09 |

### Phase 2: Q4 2026 — 懒加载与缓存

| 步骤 | 内容 | 目标 | 预计完成 |
|------|------|------|---------|
| 2.1 | 知识库 chunk 全部改为动态 import() | 首屏 JS < 200KB gz | 2026-10 |
| 2.2 | Service Worker 缓存策略落地 | 重复访问 LCP < 1.5s | 2026-10 |
| 2.3 | preload / prefetch 关键资源 | FCP < 1.5s | 2026-11 |
| 2.4 | performance ≥ 0.8 | Lighthouse 达标 | 2026-12 |

### Phase 3: Q1 2027 — 预算强制与优化

| 步骤 | 内容 | 目标 | 预计完成 |
|------|------|------|---------|
| 3.1 | CI 预算硬断言启用（JS > 300KB → 失败） | 预算强制执行 | 2027-01 |
| 3.2 | Tree-shaking + Dead code elimination | 移除未使用代码 | 2027-02 |
| 3.3 | Code splitting 按路由自动拆分 | 每页 JS < 150KB gz | 2027-03 |
| 3.4 | performance ≥ 0.9 | 全面达标 | 2027-03 |

---

## 7. 监控与回顾

### 7.1 监控频率

- **开发阶段**：每次 PR / commit 运行 Lighthouse CI
- **生产环境**：每周自动审计 5 个核心页面，记录趋势
- **告警**：performance 评分下降 > 0.1 时通知

### 7.2 回顾机制

- 每两周 review 一次性能趋势
- 每个阶段结束更新本文档基线数据
- 性能退化时优先修复，新功能让路

### 7.3 责任人

- 性能预算由开发组共同遵守
- CI 断言由 #5 任务节点维护
- 文档更新跟随阶段进展

---

## 8. 附录

### 8.1 测量方法

```bash
# 启动静态服务
cd projects/mingli-baojian && python3 -m http.server 8914 --directory app

# 运行 Lighthouse
npx lighthouse http://127.0.0.1:8914/divination-hub.html \
  --output html --output json \
  --output-path ./lh-report \
  --throttling-method=simulate

# 查看资源大小
du -sh app/js/ app/css/ docs/knowledge/ docs/knowledge-models/
gzip -c app/js/divination-core.js | wc -c  # gzipped 大小
```

### 8.2 相关文档

- `KANBAN.md` — 任务 #5 跟踪
- `docs/ERROR_HANDLING_STANDARD.md` — 错误处理规范
- `docs/COMPONENTS.md` — 组件库文档
- `lighthouserc.json` — Lighthouse CI 配置

### 8.3 修订历史

| 日期 | 版本 | 内容 |
|------|------|------|
| 2026-07-24 | v1.0 | 初版：基线数据 + 预算规范 + 分阶段计划 |

---

> **下一步**：节点 2/4 — `divination-core.js` 拆分方案设计 + `knowledge/` 懒加载 PoC
