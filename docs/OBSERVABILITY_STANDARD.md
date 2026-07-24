# 可观测性规范（OBSERVABILITY_STANDARD）

> **规范代号**：S-6 / T-6 | **版本**：v1.0 | **生效日**：2026-07-24
> **配套**：`ERROR_HANDLING_STANDARD.md`、`API_STANDARD.md`、`PERFORMANCE_BASELINE_v1.md`

---

## 1. 问题现状

`server/*.js` 共 123 处 `console.log/warn/error`，存在六大问题：无结构化格式（纯文本不可解析）、无级别管控（DEBUG 与 ERROR 混杂）、无请求关联（同请求日志无法串联）、无业务打点（KB 命中率等指标无埋点）、无错误聚合（相同错误无告警）、无日志轮转（stdout 重启即丢）。

---

## 2. 日志分层

| 级别 | 语义 | 生产 | 开发 |
|------|------|------|------|
| `ERROR` | 服务异常、需人工介入 | ✅ | ✅ |
| `WARN` | 降级、重试成功、可恢复 | ✅ | ✅ |
| `INFO` | 请求日志、业务打点 | ✅ | ✅ |
| `DEBUG` | 调试信息 | ❌ | ✅ |

生产 `LOG_LEVEL=info`，开发默认 `debug`。JSON 格式：

```json
{"time":"2026-07-24T10:02:33.123Z","level":"info","msg":"request completed",
"reqId":"r-abc123","method":"POST","path":"/api/v1/ai/chat","statusCode":200,
"durationMs":842,"module":"ai-assistant","userId":"u-1001","event":"ai.chat.complete"}
```

必填：`time`/`level`/`msg`/`reqId`；业务字段：`module`/`event`/`userId`/`durationMs`。

---

## 3. 结构化日志方案（pino）

**选型**：pino（零依赖、异步序列化 ~2× faster、原生 JSON），优于 winston（5+ 依赖、同步阻塞）。

**安装**：`npm install pino pino-http pino-pretty pino-roll`

**`server/logger.js`**：

```javascript
const pino = require('pino');
module.exports = pino({
  level: process.env.LOG_LEVEL || 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: { level: (label) => ({ level: label }) },
  transport: process.env.NODE_ENV === 'production'
    ? undefined
    : { target: 'pino-pretty', options: { colorize: true } },
});
```

**HTTP 中间件**：

```javascript
const pinoHttp = require('pino-http');
const logger = require('./logger');
app.use(pinoHttp({ logger, genReqId: () => `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}` }));
```

**迁移对照**：`console.error('[consulting-save]', e.message)` → `req.log.error({ module:'consulting', err:e }, 'save failed')`；`console.log('启动', port)` → `logger.info({ module:'system' }, 'started port=%d', port)`。

---

## 4. 关键事件打点清单

| # | event | 核心字段 | 触发时机 |
|---|-------|---------|---------|
| 1 | `kb.hit` | moduleId, score, source | KB 匹配 ≥ 0.7 直答 |
| 2 | `kb.miss` | moduleId, score, fallback | KB 匹配 < 0.4 走 AI |
| 3 | `kb.partial` | moduleId, score, aiRefined | KB 0.4-0.7 AI 润色 |
| 4 | `ai.invoke` | provider, tokensIn/Out, durationMs | 调用后端 AI |
| 5 | `ai.error` | provider, errorCode, errMsg | AI 失败/超时 |
| 6 | `report.generate` | module, reportType, durationMs | 生成命理报告 |
| 7 | `report.export` | module, format, sizeBytes | 导出 PDF/图片 |
| 8 | `push.deliver` | channel, success, userId | 推送送达 |
| 9 | `auth.login` | userId, method, durationMs | 登录成功 |
| 10 | `auth.fail` | method, reason, ip | 登录失败 |
| 11 | `tts.synthesize` | engine, chars, durationMs | TTS 合成完成 |
| 12 | `ocr.recognize` | engine, faces, durationMs | 面相 OCR 完成 |

---

## 5. 错误聚合策略

按 **错误码 × endpoint** 分组，滚动窗口 **5 分钟**，`groupKey = ${errorCode}::${method} ${path}`。

| 5 分钟内同 key 次数 | 动作 |
|--------------------|------|
| ≤ 3 | 正常记录 |
| 4-10 | WARN `error.aggregate.warning` |
| > 10 | ERROR `error.aggregate.critical`，写 `data/alerts/YYYY-MM-DD.jsonl` |

```javascript
// server/error-aggregator.js
const logger = require('./logger');
const windows = new Map();
function recordError(errorCode, method, path) {
  const key = `${errorCode}::${method} ${path}`, now = Date.now();
  const e = windows.get(key) || { count: 0, firstAt: now };
  if (now - e.firstAt > 3e5) { e.count = 0; e.firstAt = now; }
  e.count++; windows.set(key, e);
  if (e.count === 4) logger.warn({ module:'aggregator', event:'error.aggregate.warning', groupKey:key, count:e.count }, 'freq rising');
  if (e.count === 11) logger.error({ module:'aggregator', event:'error.aggregate.critical', groupKey:key, count:e.count }, 'freq critical');
}
module.exports = { recordError };
```

全局错误中间件调用 `recordError(err.code||'500001', req.method, req.path)`。

---

## 6. 业务 Dashboard 指标

| # | 指标 | 来源 | 聚合 | 展示 |
|---|------|------|------|------|
| 1 | 每日活跃报告数 | `report.generate` | COUNT(DISTINCT userId)/day | 折线图 |
| 2 | 模块使用排行 | `report.generate` | COUNT per module | 柱状图 |
| 3 | KB 直答占比 | `kb.hit/(hit+partial+miss)` | 比率 | 环形图 |
| 4 | AI 调用次数/天 | `ai.invoke` | COUNT/day | 折线图 |
| 5 | 推送送达率 | `push.deliver` | success/total | 百分比 |
| 6 | P95 响应延迟 | pino-http durationMs | P95/endpoint | 表格 |
| 7 | 错误率 TOP 5 | `error.aggregate.*` | COUNT desc | 排行榜 |
| 8 | TTS 成功率 | `tts.synthesize` | success/total | 百分比 |

数据通过 `GET /api/v1/admin/metrics?range=7d` 提供，`admin/dashboard.html` 渲染。

---

## 7. 日志轮转与保留

| 项 | 值 |
|----|-----|
| 切割 | 按天 `logs/YYYY-MM-DD.log` |
| 保留 | 30 天 |
| 压缩 | 7 天前 gzip |
| 单文件上限 | 100MB 滚动 |

`pino-roll` 按天切割。crontab `0 3 * * *`：`find logs/ -name "*.log" -mtime +7 -exec gzip {} \; && find logs/ -name "*.gz" -mtime +30 -delete`

---

## 8. 验收标准

| # | 标准 | 验证 |
|---|------|------|
| 1 | `console.*` 调用 = 0 | `grep -rc "console\.\(log\|warn\|error\)" server/*.js` 总和 = 0 |
| 2 | 日志 JSON 含 `time`/`level`/`msg`/`reqId` | 抽样 100 条 100% 合规 |
| 3 | 12 个事件有埋点 | `grep "event:" server/*.js \| wc -l` ≥ 12 |
| 4 | 聚合 > 10 次触发 critical | 模拟 11 次同错，检查 `data/alerts/` |
| 5 | 日志保留 30 天 | 31 天后 `ls logs/*.log \| wc -l` ≤ 31 |
| 6 | 8 指标可查询 | `curl /api/v1/admin/metrics` 含 8 指标 |
| 7 | 生产无 DEBUG | `LOG_LEVEL=info` 后 stdout 无 debug |
| 8 | 请求注入 reqId | 抽样 50 请求 100% 覆盖 |

---

## 9. 落地节奏

| 节点 | 内容 | 工时 |
|------|------|------|
| **6.1** ✅ | 规范文档（本文档） | — |
| **6.2** ✅ | pino 集成 + console 全量替换 | 4h |
| **6.3** | 12 事件埋点 + error-aggregator | 6h |
| **6.4** ✅ | metrics 接口 + dashboard 页面 | 4h |

**6.2**：创建 `logger.js` → 挂载 `pino-http` → 替换全部 `console.*` → launchd 加 `LOG_LEVEL`

> **kb-store 说明**：`server/kb-store/*` 下的 `.js` 文件为前端数据文件（被 HTML 通过 `<script>` 加载到浏览器执行），其中的 `console.log` 为浏览器端调试输出，不在 Node.js 进程中运行，不在本次替换范围。验证范围限定 `server/*.js`（Node.js 顶层服务文件），`grep -rn "console\.\(log\|warn\|error\)" server/*.js` = 0 ✅

**6.3**：KB 3 事件 → AI 2 事件 → report 2 事件 → push 1 事件 → auth 2 事件 → tts+ocr 2 事件 → aggregator 接入

**6.4**：`/api/v1/admin/metrics` 解析日志统计 → `admin/dashboard.html` 渲染 8 指标

---

> 命理宝鉴可观测性规范 v1.0 | 2026-07-24
