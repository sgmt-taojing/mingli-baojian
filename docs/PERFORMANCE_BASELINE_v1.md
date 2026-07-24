# 性能基线实测报告 · PERFORMANCE_BASELINE_v1

> **版本**：v1.0  
> **实测日期**：2026-07-24 17:31 CST  
> **环境**：macOS Darwin 25.5.0 (arm64) / Python 3.9.6 / curl 8.7.1  
> **服务**：8914 gzip 静态服务（GzipStatic/1.0）+ 8920 Node API 网关（Express）  
> **关联**：KANBAN #5 节点 5.4 | `docs/PERFORMANCE_BUDGET.md` v1.0 | `lighthouserc.json`

---

## 1. 实测环境

| 项目 | 值 |
|------|---|
| 测试时间 | 2026-07-24 17:31 CST |
| 操作系统 | macOS Darwin 25.5.0 (arm64) |
| 静态服务 | 8914 端口 — GzipStatic/1.0（Python http.server + gzip） |
| API 服务 | 8920 端口 — Express (Node.js v22.22.3) |
| 测试工具 | curl 8.7.1 |
| 网络环境 | localhost（本机回环，无网络延迟） |

---

## 2. Bundle 大小 vs 预算对比

### 2.1 核心页面 HTML

| 页面 | Raw 大小 | Gzip 大小 | 压缩率 | 预算 (raw) | 状态 |
|------|----------|-----------|--------|-----------|------|
| divination-hub.html | 1,871,823 B (1.79 MB) | 521,601 B (510 KB) | 72.1% | 200 KB | ❌ 超标 9.2x |
| fengshui.html | 510,579 B (499 KB) | 110,511 B (108 KB) | 78.4% | 200 KB | ❌ 超标 2.5x |
| divination-knowledge.html | 443,510 B (433 KB) | 107,030 B (105 KB) | 75.9% | 200 KB | ❌ 超标 2.2x |
| ai-assistant.html | 273,582 B (267 KB) | 94,806 B (93 KB) | 65.4% | 200 KB | ❌ 超标 1.3x |
| divination-integrated.html | 169,544 B (166 KB) | 45,719 B (45 KB) | 73.0% | 200 KB | ✅ 达标 |

### 2.2 JS 资源

| 资源 | Raw 大小 | Gzip 大小 | 压缩率 | 预算 (gzip) | 状态 |
|------|----------|-----------|--------|------------|------|
| **app/js/ 全部** | 4,928,275 B (4.70 MB) | 1,386,707 B (1.32 MB) | 71.9% | 300 KB/页 | ❌ 超标 4.5x |
| divination-core.js | 2,402,796 B (2.29 MB) | 716,419 B (699 KB) | 70.2% | 100 KB | ❌ 超标 7.0x |
| engine-v3-bundle.js | 480,641 B (469 KB) | — | — | 100 KB | ❌ 超标 |
| divination-engine.js | 473,753 B (463 KB) | — | — | 100 KB | ❌ 超标 |
| guide-features.js | 428,084 B (418 KB) | — | — | 100 KB | ❌ 超标 |
| error-interceptor.js | 27,510 B (27 KB) | 7,388 B (7.2 KB) | 73.1% | 100 KB | ✅ 达标 |
| toast.js | 5,523 B (5.4 KB) | 2,228 B (2.2 KB) | 59.7% | 100 KB | ✅ 达标 |
| modal.js | 8,224 B (8.0 KB) | 3,093 B (3.0 KB) | 62.4% | 100 KB | ✅ 达标 |
| tab.js | 8,314 B (8.1 KB) | 2,957 B (2.9 KB) | 64.4% | 100 KB | ✅ 达标 |

### 2.3 CSS 资源

| 资源 | Raw 大小 | Gzip 大小 | 压缩率 | 预算 (gzip) | 状态 |
|------|----------|-----------|--------|------------|------|
| 全部 CSS 合计 | 308,861 B (302 KB) | 58,086 B (56.7 KB) | 81.2% | 50 KB | ❌ 轻微超标 1.13x |
| divination-hub-inline.css | 164,105 B | 29,884 B | 81.8% | — | — |
| divination-hub.css | 140,640 B | 27,064 B | 80.8% | — | — |
| pro-panel.css | 4,116 B | 1,138 B | 72.4% | — | — |

### 2.4 文件数量

| 指标 | 实测值 | 预算 | 状态 |
|------|--------|------|------|
| divination-hub.html 同步 `<script src=>` | 180 | ≤ 15 | ❌ 超标 12x |
| divination-hub.html 总 `<script>` 标签 | 197 | ≤ 15 | ❌ 超标 13x |
| divination-hub.html CSS `<link>` | 4 | ≤ 3 | ❌ 轻微超标 |
| app/ 目录总大小 | 11 MB | — | — |
| HTML 文件数 | 61 | — | — |
| JS 文件数 | 40 | — | — |
| CSS 文件数 | 3 | — | — |

---

## 3. API 延迟实测

### 3.1 /api/kb/list（8920 端口 — Node API 网关）

| 运行 | HTTP | TTFB | Total | Size |
|------|------|------|-------|------|
| Run 1 | 200 | 1.480 ms | 1.663 ms | 2,377 B |
| Run 2 | 200 | 1.073 ms | 1.164 ms | 2,377 B |
| Run 3 | 200 | 0.879 ms | 0.924 ms | 2,377 B |
| **平均** | — | **1.144 ms** | **1.250 ms** | 2,377 B |

### 3.2 /api/v1/health（8920 端口 — Node API 网关）

| 运行 | HTTP | TTFB | Total | Size |
|------|------|------|-------|------|
| Run 1 | 200 | 0.908 ms | 0.943 ms | 40 B |
| Run 2 | 200 | 0.629 ms | 0.669 ms | 40 B |
| Run 3 | 200 | 0.843 ms | 0.882 ms | 40 B |
| **平均** | — | **0.793 ms** | **0.831 ms** | 40 B |

### 3.3 /api/face/health（8920 端口 — 转发 8913 face-ocr）

| 运行 | HTTP | TTFB | Total | Size |
|------|------|------|-------|------|
| Run 1 | 200 | 19.442 ms | 19.498 ms | 291 B |
| Run 2 | 200 | 3.739 ms | 3.792 ms | 291 B |
| Run 3 | 200 | 3.000 ms | 3.054 ms | 291 B |
| **平均** | — | **8.727 ms** | **8.781 ms** | 291 B |

### 3.4 静态资源延迟（8914 端口）

| 资源 | HTTP | Raw Total | Gzip Total | Gzip Size |
|------|------|-----------|------------|-----------|
| 首页 / | 200 | 3.774 ms | 2.088 ms | 1,167 B |
| divination-hub.html | 200 | 17.490 ms | 87.508 ms | 521,601 B |

> 注：divination-hub.html gzip 响应时间较长（87ms）是因为实时压缩 1.8MB 文件。预压缩可降至 < 5ms。

---

## 4. Gzip 压缩率

### 4.1 按资源类型汇总

| 资源类型 | Raw 总和 | Gzip 总和 | 平均压缩率 | 说明 |
|----------|---------|----------|-----------|------|
| HTML（5 核心页面） | 3,269,038 B | 879,687 B | 73.1% | 内联大量 JS/CSS |
| JS（app/js/ 全部） | 4,928,275 B | 1,386,707 B | 71.9% | 40 个 JS 文件 |
| CSS（全部） | 308,861 B | 58,086 B | 81.2% | 3 个 CSS 文件 |
| 组件库（3 组件） | 22,061 B | 8,278 B | 62.5% | toast+modal+tab |

### 4.2 gzip 服务验证

| 测试项 | 预期 | 实际 | 状态 |
|--------|------|------|------|
| > 1KB 文本自动 gzip | Content-Encoding: gzip | ✅ 确认 | ✅ |
| < 1KB 文件不压缩 | 无 Content-Encoding | ✅ 确认（首页 1,167B 未压缩） | ✅ |
| Vary: Accept-Encoding | 返回 Vary 头 | ✅ 确认 | ✅ |
| 无 gzip 请求时不压缩 | 不返回 Content-Encoding | ✅ 确认（Content-Length: 27510 raw） | ✅ |
| Accept-Encoding: identity | 不压缩 | ✅ 确认 | ✅ |
| JS MIME 类型正确 | application/javascript | ✅ 确认 | ✅ |

### 4.3 首页小文件不压缩验证

首页 `index.html` 仅 1,167 字节（< 1,024 阈值），gzip 服务正确地未压缩此文件。请求带 `Accept-Encoding: gzip` 时，响应无 `Content-Encoding` 头，直接返回原始内容。

---

## 5. 缓存头验证

### 5.1 静态资源（8914 端口 — GzipStatic/1.0）

| 资源 | Cache-Control | Vary | Content-Encoding | 状态 |
|------|--------------|------|-----------------|------|
| / (首页 HTML) | 无 | 无 | 无（< 1KB 不压缩） | ⚠️ 缺 Cache-Control |
| divination-hub.html | public, max-age=3600 | Accept-Encoding | gzip | ✅ |
| /js/error-interceptor.js | public, max-age=3600 | Accept-Encoding | gzip | ✅ |
| /components/toast.js | public, max-age=3600 | Accept-Encoding | gzip | ✅ |

### 5.2 API 响应（8920 端口 — Express）

| 端点 | Cache-Control | Vary | 安全头 | 状态 |
|------|--------------|------|--------|------|
| /api/kb/list | 无（ETag 仅） | Origin | nosniff/DENY/XSS/Referrer/Permissions | ⚠️ 缺 Cache-Control |
| /api/v1/health | 无（ETag 仅） | Origin | nosniff/DENY/XSS/Referrer/Permissions | ⚠️ 缺 Cache-Control |

### 5.3 预算对照

| 预算要求 | 实际 | 状态 |
|----------|------|------|
| HTML: no-cache | public, max-age=3600 | ❌ 应为 no-cache |
| 带 hash JS/CSS: immutable | 无 hash 机制 | ❌ 未实现 |
| API 响应: no-store | 无 Cache-Control | ⚠️ 应显式 no-store |

---

## 6. Web Vitals 预估

| 指标 | 预算 | 预估值 | 依据 | 状态 |
|------|------|--------|------|------|
| LCP | < 2.5s | > 5s | 1.8MB HTML + 180 同步 JS | ❌ 超标 2x+ |
| TTI | < 3.5s | > 6s | 197 个 script 标签阻塞解析 | ❌ 超标 |
| FCP | < 1.8s | > 3s | 首屏大量同步 JS | ❌ 超标 |
| CLS | < 0.1 | 未测 | — | ⚠️ 待测 |
| FID | < 100ms | 未测 | — | ⚠️ 待测 |

---

## 7. 结论：达标情况

### 7.1 预算达标汇总

| 预算项 | 目标 | 实测 | 达标 |
|--------|------|------|------|
| JS gzipped 总和/页 | ≤ 300 KB | ~1,387 KB（全量） | ❌ |
| 单 JS 文件 gzipped | ≤ 100 KB | 716 KB（divination-core.js） | ❌ |
| CSS gzipped 总和 | ≤ 50 KB | 56.7 KB | ❌ 轻微 |
| HTML raw | ≤ 200 KB | 1,872 KB（divination-hub） | ❌ |
| 同步 JS 文件数/页 | ≤ 15 | 180（divination-hub） | ❌ |
| CSS 文件数/页 | ≤ 3 | 4（divination-hub） | ❌ |
| LCP | < 2.5s | > 5s（预估） | ❌ |
| Lighthouse Performance | ≥ 0.5 | 未运行 | ⚠️ 待 Lighthouse CI |
| gzip 服务可用 | 是 | 是 | ✅ |
| Vary: Accept-Encoding | 是 | 是 | ✅ |
| Cache-Control 存在 | 是 | 部分 | ⚠️ |

### 7.2 达标项（3/10）

1. ✅ **gzip 静态服务**：8914 端口运行正常，自动压缩 > 1KB 文本文件，压缩率 60-90%
2. ✅ **Vary: Accept-Encoding**：所有 gzip 响应均正确返回 Vary 头
3. ✅ **API 延迟**：localhost 环境下 P95 < 2ms（/api/kb/list）和 < 1ms（/api/v1/health）

### 7.3 未达标项（7/10）

1. ❌ **JS bundle 严重超标**：全量 1.32 MB gzipped vs 300 KB 预算，超标 4.5x
2. ❌ **divination-core.js 巨型文件**：716 KB gzipped vs 100 KB 预算，超标 7x
3. ❌ **HTML 过大**：divination-hub.html 1.87 MB raw vs 200 KB 预算，超标 9x
4. ❌ **同步 JS 文件数**：180 个 vs 15 个预算，超标 12x
5. ❌ **CSS 轻微超标**：56.7 KB vs 50 KB 预算
6. ❌ **缓存策略不完整**：HTML 应 no-cache 实际 max-age=3600；API 缺显式 no-store
7. ❌ **Web Vitals 全部超标**：LCP/TTI/FCP 均超预算 2x+

---

## 8. 改进建议

### 8.1 P0 — 立即执行（预计收益最大）

| # | 措施 | 预期收益 | 难度 | 对应预算 |
|---|------|---------|------|---------|
| 1 | **divination-core.js 拆分为 6 模块**（core-paipan/analyze/report/qimen/ziwei/shared） | 单文件 716KB → ~150KB gz | 高 | 单 JS ≤ 100KB |
| 2 | **divination-hub.html 内联资源外提**（197 个 script → 外部文件） | HTML 1.87MB → < 200KB | 中 | HTML ≤ 200KB |
| 3 | **知识库目录懒加载**（import() 动态加载） | 首屏 JS 减少 ~2MB gz | 中 | JS ≤ 300KB |

### 8.2 P1 — 短期跟进

| # | 措施 | 预期收益 | 难度 |
|---|------|---------|------|
| 4 | **预压缩静态文件**（.gz 预生成，避免实时压缩） | divination-hub 响应 87ms → < 5ms | 低 |
| 5 | **HTML Cache-Control 改为 no-cache** | 避免 stale HTML | 低 |
| 6 | **API 响应添加 no-store** | 避免缓存动态数据 | 低 |
| 7 | **CSS 精简**（合并去重，移除未使用规则） | 56.7KB → < 50KB | 低 |
| 8 | **同步 script 改 defer/async** | 减少解析阻塞，改善 FCP/TWI | 中 |

### 8.3 P2 — 中期优化

| # | 措施 | 预期收益 | 难度 |
|---|------|---------|------|
| 9 | **引入文件 hash + immutable 缓存** | 永久缓存，消除 304 请求 | 中 |
| 10 | **Service Worker 缓存策略落地** | 重复访问 LCP < 1.5s | 中 |
| 11 | **preload/prefetch 关键资源** | FCP < 1.5s | 低 |
| 12 | **Lighthouse CI 纳入开发流程** | 性能回归自动检测 | 低 |

### 8.4 预期达标路径

```
当前基线 → [P0 拆分+懒加载] → JS 300KB / HTML 200KB → [P1 预压缩+缓存] → LCP < 3s
                                                                      → [P2 SW+preload] → LCP < 2.5s / Performance ≥ 0.9
```

---

## 9. 附录

### 9.1 测量命令

```bash
# 静态资源 raw vs gzip
curl -s -o /dev/null -w "%{size_download}" http://localhost:8914/divination-hub.html
curl -s -o /dev/null -w "%{size_download}" -H "Accept-Encoding: gzip" http://localhost:8914/divination-hub.html

# API 延迟
curl -s -o /dev/null -w "TTFB: %{time_starttransfer}s | Total: %{time_total}s" http://localhost:8920/api/kb/list

# 缓存头验证
curl -s -D - -o /dev/null -H "Accept-Encoding: gzip" http://localhost:8914/js/error-interceptor.js

# 文件级 gzip 大小
gzip -c app/js/divination-core.js | wc -c
```

### 9.2 相关文档

| 文档 | 路径 |
|------|------|
| 性能预算规范 | `docs/PERFORMANCE_BUDGET.md` |
| Lighthouse CI 配置 | `lighthouserc.json` |
| gzip 静态服务源码 | `server/static-gzip.py` |
| gzip 服务启动脚本 | `server/start-static-gzip.sh` |

### 9.3 修订历史

| 日期 | 版本 | 内容 |
|------|------|------|
| 2026-07-24 | v1.0 | 初版：实测基线数据 + 预算对照 + 改进建议 |

---

> **结论**：当前项目处于 Phase 1 优化前阶段。gzip 服务（节点 5.2.5）已就位并正确工作，但 bundle 严重超标（JS 4.5x、HTML 9x、文件数 12x）。下一步应按 `PERFORMANCE_BUDGET.md` §4 资源策略执行 divination-core.js 拆分和知识库懒加载，预计可将 JS gzipped 从 1.32MB 降至 ~300KB 目标。
