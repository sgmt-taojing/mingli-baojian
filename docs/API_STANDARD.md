# 命理宝鉴 · API 设计规范 (v1.0)

> 生效日期：2026-07-21
> 版本：v1.0
> 适用范围：server/api-server-v2.js 全部 588 端点及后续新增

---

## 一、URL 命名

### 1.1 基础规则

| 元素 | 规则 | 示例 |
|------|------|------|
| 版本号 | 必填，`/api/v{1,2,...}/` 前缀 | `/api/v1/yuanzhus` |
| 资源名 | 复数名词、kebab-case | `/api/v1/knowledge-bases` |
| 资源 ID | 路径参数 `:id` | `/api/v1/cases/:id` |
| 动作 | 子路径表示 | `/api/v1/yuanzhus/:id/push-yearly` |
| 过滤查询 | `?status=active&limit=20` | `/api/v1/cases?status=active` |
| 分页 | `?page=1&pageSize=20` 或 `?cursor=xxx` | — |

### 1.2 HTTP 方法

| 方法 | 用途 | 幂等 | 安全性 |
|------|------|------|--------|
| GET | 查询资源 | ✅ | ✅ |
| POST | 创建资源 / 触发动作 | ❌ | ❌ |
| PUT | 全量更新 | ✅ | ❌ |
| PATCH | 局部更新 | ❌ | ❌ |
| DELETE | 删除资源 | ✅ | ❌ |

### 1.3 反例 → 正例

| ❌ 现状 | ✅ 应改为 |
|---------|----------|
| `/api/yuanzhu/list` | `/api/v1/yuanzhus` (GET 列表) |
| `/api/ai/chat` | `/api/v1/ai/chat` 或 `/api/v1/chats` |
| `/api/kb/list` | `/api/v1/knowledge-bases` |
| `/api/kb/:filename` | `/api/v1/knowledge-bases/:filename` |
| `/api/admin/yuanzhu/push-yearly` | `/api/v1/admin/yuanzhus/:id/push-yearly` |
| `/api/clinic/case/:id` | `/api/v1/clinic/cases/:id` |

---

## 二、统一响应壳

### 2.1 成功响应

```json
{
  "code": 0,
  "message": "ok",
  "data": { ... }
}
```

### 2.2 错误响应

```json
{
  "code": 401002,
  "message": "登录已过期",
  "data": null,
  "traceId": "tr-20260721-220501-abc123"
}
```

### 2.3 服务端实现

```javascript
// server/api-response.js
function apiResp(res, code, data, message, httpStatus) {
  const httpMap = {
    0: 200,
    '4xxxxx': 400,
    '401xxx': 401,
    '403xxx': 403,
    '404xxx': 404,
    '429xxx': 429,
    '5xxxxx': 500,
    '503xxx': 503
  };
  const status = httpStatus || httpMap[String(code).charAt(0) + 'xxxxx'] || 200;
  return res.status(status).json({
    code,
    message: message || (code === 0 ? 'ok' : 'unknown error'),
    data: data === undefined ? null : data,
    traceId: res.locals.traceId || null
  });
}

module.exports = { apiResp };
```

### 2.4 前端兼容层

```javascript
// app/js/api-client.js (兼容旧版响应)
async function api(path, opts = {}) {
  const res = await fetch(API_BASE + path, { ... });
  const json = await res.json();
  // 旧版：{ error: '...' } → 新版：{ code: 401001, message: '...' }
  if (json.code !== undefined) {
    if (json.code !== 0) throw new ApiError(json.code, json.message);
    return json.data;
  }
  // 兜底旧版
  if (json.error) throw new ApiError(500001, json.error);
  return json;
}
```

---

## 三、错误码表

### 3.1 一级分类

| 区间 | 类别 | HTTP 状态 |
|------|------|-----------|
| 0 | 成功 | 200 |
| 400xxx | 客户端请求错误 | 400 |
| 401xxx | 认证失败 | 401 |
| 403xxx | 权限不足 | 403 |
| 404xxx | 资源不存在 | 404 |
| 409xxx | 资源冲突 | 409 |
| 429xxx | 限流 | 429 |
| 5xxxxx | 服务端错误 | 500 |
| 503xxx | 服务不可用 | 503 |

### 3.2 常用错误码

| 错误码 | 含义 | 用户文案 | 处理建议 |
|--------|------|---------|---------|
| 0 | 成功 | — | — |
| 400001 | 参数校验失败 | 请检查输入 | 表单红字提示 |
| 401001 | 未登录 | 请先登录 | 跳登录页 |
| 401002 | Token 过期 | 登录已过期，请重新登录 | 尝试 refresh，失败跳登录 |
| 403001 | 无权限 (RBAC) | 您没有访问权限 | 隐藏按钮 + toast |
| 404001 | 资源不存在 | 内容不存在或已删除 | 跳 404 页 |
| 429001 | 全局限流 | 请求过于频繁，请稍后再试 | 30s 倒计时 |
| 429002 | KB 限流 | 知识库调用过快 | 静默 5s |
| 500001 | 服务端异常 | 服务异常，请稍后再试 | 报告 traceId |
| 503001 | AI 服务不可用 | AI 暂时不可用，已为您切换知识库模式 | 自动降级 KB |
| 503002 | 数据库不可用 | 数据服务维护中 | 显示降级页 |

---

## 四、字段命名

### 4.1 统一 snake_case

```json
{
  "user_id": "u-1784",
  "yuanzhu_name": "张三",
  "birth_date": "1990-05-12",
  "created_at": "2026-07-21T22:00:00+08:00"
}
```

### 4.2 前端转换

```javascript
// 自动 snake_case ↔ camelCase 转换
import { toCamel, toSnake } from './case-utils.js';
const dto = toCamel(response.data);
const payload = toSnake(formData);
```

### 4.3 禁止的命名

- ❌ 缩写混用：`uid` vs `userId` vs `user_id`
- ❌ 复数/单数不一致：`case` vs `cases` 在同一接口
- ❌ 含义模糊字段：`data` `info` `extra` 避免顶层用

---

## 五、版本策略

### 5.1 多版本共存

```
/api/v1/yuanzhus    # 当前
/api/v2/yuanzhus    # 下一版（字段重构时）
```

### 5.2 弃用流程

1. 新版上线，旧版加响应头 `Deprecation: true` 和 `Sunset: Wed, 01 Jan 2027 00:00:00 GMT`
2. 控制台 / dashboard 每周统计旧版调用量
3. 调用量 < 1% 后下线，保留 ≥ 6 个月

### 5.3 URL 不可变原则

路径一旦发布**不得重命名**，只能加版本号或新端点。客户端零迁移成本。

---

## 六、认证与权限

### 6.1 JWT 透传

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### 6.2 RBAC 标签

路由声明所需权限：

```javascript
app.get('/api/v1/admin/users',
  auth,
  requirePermission('user:list'),
  handler
);
```

权限粒度：`{module}:{action}`，如 `case:create` `yuanzhu:push` `kb:audit`。

### 6.3 公开端点白名单

```javascript
const PUBLIC_PREFIXES = [
  '/api/v1/public/',
  '/api/v1/health',
  '/api/v1/openapi.json'
];
```

---

## 七、分页与查询

### 7.1 偏移分页

```
GET /api/v1/cases?page=1&pageSize=20&status=active
```

响应：
```json
{
  "code": 0,
  "data": {
    "items": [...],
    "total": 124,
    "page": 1,
    "pageSize": 20,
    "hasMore": true
  }
}
```

### 7.2 游标分页（大数据集）

```
GET /api/v1/knowledge_trace?cursor=tr-20260721-xxx&limit=50
```

响应：
```json
{
  "code": 0,
  "data": {
    "items": [...],
    "nextCursor": "tr-20260721-yyy",
    "hasMore": true
  }
}
```

---

## 八、限流

### 8.1 全局限流

- 默认 120 req/min/IP（已实现）
- 响应头：`X-RateLimit-Remaining` `X-RateLimit-Reset`

### 8.2 端点级限流

```javascript
const kbLimiter = rateLimit({ windowMs: 60_000, max: 30 });
app.post('/api/v1/ai/chat', auth, kbLimiter, handler);
```

---

## 九、OpenAPI 自动生成

### 9.1 注解示例

```javascript
/**
 * @openapi
 * /api/v1/yuanzhus/{id}:
 *   get:
 *     summary: 获取缘主档案
 *     tags: [Yuanzhu]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 成功
 *       404:
 *         description: 不存在
 */
app.get('/api/v1/yuanzhus/:id', auth, handler);
```

### 9.2 访问文档

- JSON：`http://127.0.0.1:8920/api/v1/openapi.json`
- UI：`http://127.0.0.1:8920/api/v1/docs`（Swagger UI）

---

## 十、迁移路线图

### Phase 1（本周）
- [ ] 抽取 `server/api-response.js` 统一响应壳
- [ ] 588 端点全部加 `/v1/` 前缀（旧路径保留作为 alias）
- [ ] OpenAPI JSON 输出

### Phase 2（下周）
- [ ] 前端 `api()` 函数自动适配新旧响应
- [ ] 切换主流程（divination-hub / ai-assistant / kb-list）
- [ ] 添加 X-RateLimit-* 响应头

### Phase 3（两周内）
- [ ] 全量字段 snake_case 改造
- [ ] 旧路径标记 Deprecation
- [ ] Swagger UI 上线

### Phase 4（一个月内）
- [ ] 监控旧版调用量 < 5% 后考虑下线
- [ ] 准备 v2 设计（按需）

---

## 十一、违反规范的代码评审标准

PR 中出现以下情况**必须打回**：

1. ❌ URL 未带版本号
2. ❌ 直接 `res.json({ error: 'xxx' })` 而非 `apiResp`
3. ❌ 错误码未在错误码表中
4. ❌ 字段混用 snake_case 与 camelCase
5. ❌ 路由缺少认证/权限中间件
6. ❌ 响应未走统一壳（直接 res.json 业务数据）

---

## 附录 A · 当前 588 端点改造索引

> 待补充：批量脚本 `scripts/api-v1-migration.js` 自动扫描并生成改造对照表。

## 附录 B · 错误码完整清单

> 见 `docs/ERROR_CODE_TABLE.md`（待建）。

## 附录 C · OpenAPI 注解速查

> 见 `docs/OPENAPI_CHEATSHEET.md`（待建）。

---

_本规范由 AutoClaw 起草，2026-07-21 v1.0 生效。如需修订请在 PR 中说明。_
