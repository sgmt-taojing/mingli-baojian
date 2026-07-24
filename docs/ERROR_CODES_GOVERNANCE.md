# 错误码表统一治理 · ERROR_CODES Governance

> **版本**：v1.0
> **生效日**：2026-07-24
> **适用范围**：`server/api-server-v2.js` 全部路由 + `server/kb-routes.js` / `server/kb-api.js` / `server/sync-api.js` / `server/im-routes.js` / `server/middleware/auth.js`
> **关联任务**：KANBAN #2 · API 设计规范落地（节点 6/8）
> **状态**：📘 规范文档，待节点 7/8 落地（旁路监控已就绪 `error-codes-monitor.js`）
> **配套**：`docs/ERROR_CODE_TABLE.md` · `docs/ERROR_COPYWRITING.md` · `server/api-response.js`

---

## 1. 现状盘点（基于 2026-07-24 09:13 审计）

### 1.1 KB 路由错误码分布（22 路由 × 133 次调用）

| 错误码 | 业务含义 | HTTP | 出现次数 | 占比 |
|--------|----------|------|---------:|----:|
| `SUCCESS (0)` | 业务成功 | 200 | 116 | 87.2% |
| `SERVER_ERROR (500001)` | 服务端异常 | 500 | 6 | 4.5% |
| `DB_UNAVAILABLE (503002)` | 数据库不可用 | 503 | 5 | 3.8% |
| `FORBIDDEN (403001)` | 无权限（RBAC） | 403 | 4 | 3.0% |
| `NOT_FOUND (404001)` | 资源不存在 | 404 | 2 | 1.5% |
| **合计** | — | — | **133** | 100% |

### 1.2 全量 API 路由 `ERROR_CODES` 使用频次（`server/api-server-v2.js` grep）

| 错误码 | 出现次数 | 用途 |
|--------|---------:|------|
| `SUCCESS` | 60 | 几乎所有成功路径 |
| `SERVER_ERROR` | 3 | try/catch 兜底 |
| `FORBIDDEN` | 3 | RBAC 拒绝（adminAuth） |
| `DB_UNAVAILABLE` | 2 | DB 未就绪 |
| `AI_UNAVAILABLE` | 2 | AI 服务不可用 |
| `RATE_LIMIT_GLOBAL` | 1 | 全局限流 |
| `PARAM_INVALID` | 1 | 入参校验 |
| `NOT_FOUND` | 1 | KB 文件不存在 |

**观察**：KB 模块的成功率 ≈87%，其余错误码被使用说明错误分支真实覆盖。`UNAUTHORIZED` / `TOKEN_EXPIRED` / `RATE_LIMIT_KB` / `CONFLICT` 在 api-server-v2.js 中**未被使用**（鉴权由中间件 `auth.js` 直接返回旧式 JSON）。

### 1.3 关键观察

| # | 观察 | 影响 |
|---|------|------|
| 1 | KB 路由全部走 `apiResp()`，覆盖率 100% | ✅ 健康 |
| 2 | 22 路由 × 9 处仍有 `res.json(...)` 调用 | ⚠️ 全为 KB 成功路径（列表返回、KB 文件下发），属预期保留 |
| 3 | `traceId` 字段恒为 `null` | ❌ 未注入 traceId 中间件，无法做日志关联 |
| 4 | `code=0` 时合并 `data` 进顶层并加 `_v1:true` | ⚠️ 兼容期设计，导致响应壳不纯净 |
| 5 | `ERROR_CODES` 仅 12 个枚举值 | ✅ 当前足够；KB 路由未触发 `UNAUTHORIZED` / `CONFLICT` 等码 |
| 6 | 错误文案混用中英文（"ok" / "未知错误" / "RBAC_FORBIDDEN"） | ⚠️ 与 `ERROR_COPYWRITING.md` 不完全一致 |
| 7 | 多个非 KB 路由（rate-limit / AI / TTS / profile / KB-admin）仍用 `res.status(...).json(...)` | ❌ 不在本次 KB 审计范围，但应纳入治理 |

---

## 2. 错误码全集（注册表）

> 来源：`server/api-response.js` 第 8–21 行

### 2.1 按 HTTP 类别分组

| 类别 | 范围 | 错误码 | 枚举常量 | HTTP | 含义 |
|------|-----:|--------|----------|-----:|------|
| 成功 | 0 | `0` | `SUCCESS` | 200 | 业务成功 |
| 客户端 | 400xxx | `400001` | `PARAM_INVALID` | 400 | 参数校验失败 |
| 鉴权 | 401xxx | `401001` | `UNAUTHORIZED` | 401 | 未登录 |
| 鉴权 | 401xxx | `401002` | `TOKEN_EXPIRED` | 401 | Token 过期 |
| 鉴权 | 403xxx | `403001` | `FORBIDDEN` | 403 | 无权限（RBAC 拒绝） |
| 资源 | 404xxx | `404001` | `NOT_FOUND` | 404 | 资源不存在 |
| 冲突 | 409xxx | `409001` | `CONFLICT` | 409 | 资源冲突（重复操作） |
| 限流 | 429xxx | `429001` | `RATE_LIMIT_GLOBAL` | 429 | 全局限流 |
| 限流 | 429xxx | `429002` | `RATE_LIMIT_KB` | 429 | KB 调用限流 |
| 服务端 | 500xxx | `500001` | `SERVER_ERROR` | 500 | 服务端异常 |
| 服务端 | 503xxx | `503001` | `AI_UNAVAILABLE` | 503 | AI 服务不可用 |
| 服务端 | 503xxx | `503002` | `DB_UNAVAILABLE` | 503 | 数据库不可用 |

### 2.2 按严重程度分级

| 级别 | 错误码 | 处理策略 |
|------|--------|----------|
| 🟢 P0 信息 | `SUCCESS` | 正常返回 |
| 🟡 P1 用户可恢复 | `PARAM_INVALID` / `NOT_FOUND` / `CONFLICT` / `RATE_LIMIT_*` | 前端 toast + 表单回显 |
| 🟠 P2 鉴权问题 | `UNAUTHORIZED` / `TOKEN_EXPIRED` / `FORBIDDEN` | 前端跳登录或弹权限提示 |
| 🔴 P3 系统异常 | `SERVER_ERROR` / `AI_UNAVAILABLE` / `DB_UNAVAILABLE` | 前端兜底文案 + 自动重试或降级 |

---

## 3. 统一规则

### 3.1 保留 / 弃用 / 新增清单

| 状态 | 错误码 | 决定 | 理由 |
|------|--------|------|------|
| ✅ 保留 | `SUCCESS` / `PARAM_INVALID` / `FORBIDDEN` / `NOT_FOUND` / `SERVER_ERROR` / `AI_UNAVAILABLE` / `DB_UNAVAILABLE` / `RATE_LIMIT_GLOBAL` | 保留 | KB 路由实际使用 |
| ✅ 保留（未用） | `UNAUTHORIZED` / `TOKEN_EXPIRED` / `RATE_LIMIT_KB` / `CONFLICT` | 保留 | 鉴权/限流/冲突场景需要，统一语义 |
| 🆕 新增（建议） | `KB_NOT_FOUND (404002)` | 待节点 7 评估 | KB 文件不存在 vs 通用 NOT_FOUND 当前混用 `404001`，未来可细分 |
| 🆕 新增（建议） | `RATE_LIMIT_AI (429003)` | 待节点 7 评估 | AI 调用限流场景 |
| ❌ 弃用 | 无 | — | 当前 `ERROR_CODES` 已经过收敛，无需弃用 |

### 3.2 HTTP 状态码 vs 业务 code 映射约定

**当前实现（`server/api-response.js` `httpStatusFor`）**：

```javascript
function httpStatusFor(code) {
  if (code === 0) return 200;
  const prefix = Math.floor(code / 1000);
  const map = { 400: 400, 401: 401, 403: 403, 404: 404,
                409: 409, 429: 429, 500: 500, 503: 503 };
  return map[prefix] || 200;
}
```

**约定**：业务 code 的千位前缀 = HTTP 状态码。

| 业务 code 前缀 | HTTP 状态 |
|----------------|-----------|
| `0` | 200 |
| `4xx` | `4xx`（400/401/403/404/409） |
| `429` | 429 |
| `5xx` | `5xx`（500/503） |
| 其他 | 200（兜底） |

**关键决策**：
- ✅ `ERROR_CODES.NOT_FOUND (404001)` → HTTP **404**（与 HTTP 语义一致，便于 Nginx/网关识别）
- ✅ `ERROR_CODES.FORBIDDEN (403001)` → HTTP **403**
- ✅ `ERROR_CODES.SERVER_ERROR (500001)` → HTTP **500**
- ✅ `code=0` → HTTP **200**（业务成功统一 200）
- ⚠️ 不允许 HTTP 200 + 业务 code=500001 的"软失败"（保持 HTTP 语义纯净）

### 3.3 错误信息（message）规范

**当前实况**：错误文案散落各路由，混用中英文（"ok" / "未知错误" / "RBAC_FORBIDDEN"）。

**新规范**：

| 字段 | 规则 | 示例 |
|------|------|------|
| `message` | **必填**，**中文**，用户可读 | `"无权访问此知识库"` |
| `message` 技术后缀 | 仅 `SERVER_ERROR` 追加 traceId（前端友好文案） | `"服务异常，请稍后再试"` |
| `message` 兜底 | 未填写时用 `"未知错误"` | — |
| `data` | 错误时 `null`；成功时业务数据 | — |
| `traceId` | **必须返回**（详见 §3.4） | `"a1b2c3d4"` |
| `timestamp` | ISO 8601 UTC 字符串 | `"2026-07-24T01:34:09.304Z"` |

**禁用文案**（沿用 `ERROR_COPYWRITING.md`）：
- ❌ `Internal Server Error` / `undefined` / `null` / Stack trace
- ❌ 英文枚举字符串直接当用户文案（`"RBAC_FORBIDDEN"` 应改为中文 `"无权访问此知识库"`）

### 3.4 traceId 注入（节点 7 待办）

**当前状态**：响应体 `traceId: null`，未注入。

**目标**：
1. 在 `server/api-server-v2.js` 启动时挂载 traceId 中间件（按 UUID v4 短码 8 位）
2. 写入 `res.locals.traceId`
3. `apiResp()` 自动读取并填入响应体
4. **日志关联**：所有 `console.error()` 改用 `[${traceId}]` 前缀

**实现参考**（节点 7 落地）：

```javascript
// server/middleware/trace.js
const crypto = require('crypto');
module.exports = function trace(req, res, next) {
  const tid = crypto.randomBytes(4).toString('hex');
  res.locals.traceId = tid;
  req.traceId = tid;
  res.setHeader('X-Trace-Id', tid);
  next();
};
```

挂载顺序：在 `bodyParser` 之后，所有路由之前。

### 3.5 响应壳（envelope）一致性

**当前实况**：

```javascript
// api-response.js 第 38–48 行
if (code === 0 && data && typeof data === 'object' && !Array.isArray(data)) {
  return res.status(httpCode).json({ ...body, ...data, _v1: true });
}
```

**问题**：成功路径把 `data` 字段拍平到顶层 + 加 `_v1:true` 兼容标记 → 响应壳不纯净。

**治理目标**（节点 7/8）：
1. 短期（兼容期）：保留 `_v1:true` 标记，前端 `app/js/api-client.js` 据此做兼容解析
2. 长期（≥6 个月后）：移除拍平逻辑，强制 `{code, message, data, traceId, timestamp}` 纯净壳

---

## 4. 覆盖检查 · `res.status(...)` 遗漏点

### 4.1 检索命令

```bash
grep -rn "res\.status([0-9]" server/ | grep -v "apiResp\|node_modules"
```

### 4.2 遗漏点清单（按文件归类）

| 文件 | 行号 | 当前写法 | 应改 | 严重度 |
|------|------|----------|------|--------|
| `server/middleware/auth.js` | 17 | `res.status(403).json({error:'FORBIDDEN', message:'需要管理员权限'})` | `forbid(res, '需要管理员权限')` | 🟡 |
| `server/sync-api.js` | 42 | `res.status(401).json({error:'未登录'})` | `unauth(res)` | 🟡 |
| `server/sync-api.js` | 44 | `res.status(401).json({error:'登录已过期'})` | `expired(res)` | 🟡 |
| `server/sync-api.js` | 105 | `res.status(429).json({error:'同步请求过于频繁...'})` | `rateLimit(res, '同步请求过于频繁...')` | 🟡 |
| `server/kb-routes.js` | 24/38/52/62/83/117/130/140/155/167 | 13 处 `res.status(500).json({error:e.message})` | `serverErr(res, e)` 或 `fail(res, ERROR_CODES.SERVER_ERROR, e.message)` | 🔴 |
| `server/kb-routes.js` | 111 | `res.status(400).json({error:'entry_id required'})` | `bad(res, 'entry_id required')` | 🟡 |
| `server/kb-routes.js` | 163 | `res.status(400).json({error:'model_id required'})` | `bad(res, 'model_id required')` | 🟡 |
| `server/kb-api.js` | 160/218/250/285 | 4 处 KB 错误码（旧版兼容窗口） | `apiResp(res, ERROR_CODES.NOT_FOUND/FORBIDDEN/SERVER_ERROR)` | 🔴 |
| `server/api-server-v2.js` | 71 | 限流兜底 | `rateLimit(res)` | 🟡 |
| `server/api-server-v2.js` | 790/836/865 | 限流兜底 | 同上 | 🟡 |
| `server/api-server-v2.js` | 1138 | 排盘保存失败 | `serverErr(res, e)` | 🟡 |
| `server/api-server-v2.js` | 1371 | 画像不存在 | `notFound(res, '画像不存在')` | 🟡 |
| `server/api-server-v2.js` | 1381 | 画像保存失败 | `serverErr(res, e)` | 🟡 |
| `server/api-server-v2.js` | 1529 | 限流兜底 | `rateLimit(res, '申请过于频繁，请1小时后再试')` | 🟡 |
| `server/api-server-v2.js` | 2394 | 咨询保存失败 | `serverErr(res, e)` | 🟡 |
| `server/api-server-v2.js` | 2658/2664/2687 | TTS 错误 | 新增 `TTS_UNAVAILABLE (503003)` 或复用 `AI_UNAVAILABLE` | 🟡 |
| `server/api-server-v2.js` | 2831 | 全局兜底 | `serverErr(res, err)` | 🟡 |
| `server/im-routes.js` | 173/206 | 2 处错误 | `serverErr(res, e)` | 🟡 |

**统计**：共 **29 处遗漏**，分布：
- 🔴 高严重度（影响契约纯净度）：17 处（kb-routes.js + kb-api.js）
- 🟡 中严重度（个别路由不一致）：12 处

**治理建议**（节点 7）：
1. **优先级 1**：修复 `kb-routes.js` + `kb-api.js`（kb-admin 内部 API，必须收敛）
2. **优先级 2**：修复 `api-server-v2.js` 中非 KB 路由（限流/TTS/排盘/画像/咨询）
3. **优先级 3**：修复 `auth.js` / `sync-api.js` / `im-routes.js`（鉴权/同步/IM 子服务）

---

## 5. 回归抽测（节点 6 当前 + 治理后对比）

### 5.1 `/api/kb/list`（200 SUCCESS）

**当前**（curl 2026-07-24 09:34）：

```bash
$ curl -sS -i http://127.0.0.1:8920/api/kb/list
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Length: 2111
{"code":0,"message":"ok","data":{...},"traceId":null,"timestamp":"2026-07-24T01:34:06.xxx"}
```

**治理后**（节点 7/8）：

```bash
HTTP/1.1 200 OK
X-Trace-Id: a1b2c3d4
Content-Type: application/json; charset=utf-8
{"code":0,"message":"ok","data":{...},"traceId":"a1b2c3d4","timestamp":"2026-07-24T01:34:06.xxx"}
```

差异：traceId 从 `null` → `"a1b2c3d4"`，新增 `X-Trace-Id` 响应头。

### 5.2 `/api/public/kb-search?q=da`（200 SUCCESS）

**当前**：

```bash
$ curl -sS "http://127.0.0.1:8920/api/public/kb-search?q=da"
{"code":0,"message":"ok","data":{"error":null,"query":"da","count":20,"results":[...]},"traceId":null,"timestamp":"...","_v1":true}
```

**治理后**：

```bash
{"code":0,"message":"ok","data":{"error":null,"query":"da","count":20,"results":[...]},"traceId":"a1b2c3d4","timestamp":"..."}
```

差异：移除 `_v1:true` 标记（兼容期满后）。

### 5.3 `/api/kb/nonexistent.js`（404 NOT_FOUND）

**当前**：

```bash
$ curl -sS "http://127.0.0.1:8920/api/kb/nonexistent.js"
{"code":404001,"message":"文件不存在","data":null,"traceId":null,"timestamp":"2026-07-24T01:34:09.304Z"}
```

**HTTP 状态码**：当前已正确返回 `HTTP 404`（由 `httpStatusFor(404001)` 推导）。

**治理后**：

```bash
HTTP/1.1 404 Not Found
X-Trace-Id: a1b2c3d4
Content-Type: application/json; charset=utf-8
{"code":404001,"message":"文件不存在","data":null,"traceId":"a1b2c3d4","timestamp":"2026-07-24T01:34:09.304Z"}
```

### 5.4 `/api/admin/kb/search` 无 token（403 FORBIDDEN）

**当前预期**：adminAuth 中间件先拦截 → 返回旧式 `{error:'FORBIDDEN'}`，未走 apiResp。

**治理后预期**：`auth.js` 改为 `forbid(res, '需要管理员权限')` → `apiResp` 统一壳。

### 5.5 建议统一后的契约摘要

| 字段 | 类型 | 必有 | 说明 |
|------|------|:----:|------|
| `code` | number | ✅ | 业务错误码（0=成功，≠0 见错误码表） |
| `message` | string | ✅ | 中文用户文案 |
| `data` | object \| null | ✅ | 业务数据；错误时为 `null` |
| `traceId` | string \| null | ✅ | 8 位十六进制 traceId（短期可为 `null`，节点 7 后必须返回） |
| `timestamp` | string (ISO 8601) | ✅ | 服务端 UTC 时间戳 |
| 响应头 `X-Trace-Id` | string | ✅ | 与 `traceId` 同值，便于网关/Nginx 日志关联 |

---

## 6. 监控打点（旁路监听）

详见 `.openclaw/tmp/error-codes-monitor.js` 与 `.openclaw/tmp/error-codes-monitor.README.md`。

**核心能力**：
- 监听 `/tmp/api-v2.log`（api-server-v2 输出流）
- 每分钟统计 ERROR_CODES 各码出现次数
- 写入 `.openclaw/tmp/error-codes-stats.jsonl`（每行一条 JSON）
- 支持 `node error-codes-monitor.js --since 30` 查看过去 30 分钟统计

**关键设计**：
- ✅ **零侵入**：不动 `api-server-v2.js`，纯旁路监听
- ✅ **不重启服务**：节点 6 无服务重启
- ✅ **低开销**：每分钟聚合一次，无高频 IO

---

## 7. 待办（移交节点 7/8）

| 任务 | 优先级 | 状态 |
|------|:------:|:----:|
| 挂载 traceId 中间件（`server/middleware/trace.js`） | P0 | 节点 7 |
| 修复 `kb-routes.js` 13 处 `res.status(500)` 遗漏 | P1 | 节点 7 |
| 修复 `kb-api.js` 4 处旧式错误壳 | P1 | 节点 7 |
| 修复 `auth.js` / `sync-api.js` 鉴权/同步遗漏 | P2 | 节点 8 |
| 修复 `im-routes.js` 2 处遗漏 | P2 | 节点 8 |
| 修复 `api-server-v2.js` 非 KB 路由（限流/TTS/排盘）12 处 | P2 | 节点 8 |
| 启动 `error-codes-monitor.js` 作为 launchd 后台守护 | P1 | 节点 7 |
| 评估新增 `KB_NOT_FOUND (404002)` / `RATE_LIMIT_AI (429003)` | P3 | 节点 8 |

---

## 8. 一句话

**22 KB 路由已 100% 走 apiResp，错误码分布健康（87% 成功），核心问题在 traceId 未注入 + 29 处非 KB 路由遗漏 + 响应壳 `_v1:true` 兼容标记需规划退出。**