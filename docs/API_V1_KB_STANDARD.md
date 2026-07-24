# API v1 版本化标准 · KB 模块

> **版本**：v1.0
> **生效日**：2026-07-23
> **适用范围**：KB 模块（含 /api/kb/* /api/public/kb* /api/admin/kb/* /api/ai/kb* /api/public/kb-manager/*）
> **关联任务**：KANBAN #2 · API 设计规范落地（节点 3/8）
> **状态**：✅ 落地 21 个 v1 alias，全部 HTTP 308 重定向

---

## 1. 核心规则

### 1.1 URL 命名
- **全部小写**，单词用连字符 `-` 分隔（snake-case 禁用）
- **资源用复数**：如 `/api/v1/kb/files`、`/api/v1/admin/users`
- **不暴露技术栈**：禁止 `/api/v1/paipan_json`、`/api/v1/users_v2` 等含实现的命名
- **RESTful 动词**：GET（查）/POST（建）/PUT（改）/DELETE（删）

### 1.2 版本策略
- **路径前缀**：`/api/v{major}/...` —— 强制 v1 起步
- **不破坏式升级**：v2 引入时，旧路径保留 ≥6 个月，文档注明"已废弃"
- **重定向机制**：v1 与原始路径**共存**，v1 → 原始路径返回 `HTTP 308 Permanent Redirect`

### 1.3 响应壳（统一 envelope）
```json
{
  "ok": true,            // 业务成功
  "code": 0,             // 业务错误码（0=成功，≠0 见错误码表）
  "data": { ... },       // 业务数据
  "msg": "操作成功",     // 用户可读消息（中文）
  "ts": 1753270000000,   // 服务端时间戳
  "trace_id": "abc123"   // 请求追踪 ID（用于日志关联）
}
```

错误响应：
```json
{
  "ok": false,
  "code": 40101,
  "data": null,
  "msg": "登录已过期，请重新登录",
  "ts": 1753270000000,
  "trace_id": "abc123"
}
```

### 1.4 错误码规范
| 范围 | 含义 | 示例 |
|------|------|------|
| 0 | 成功 | `{ok:true, code:0}` |
| 1xxxx | 客户端参数错 | 10001-缺少参数, 10101-参数格式错 |
| 2xxxx | 鉴权 | 20001-未登录, 20101-Token 过期, 20201-无权限 |
| 4xxxx | 业务 | 40401-资源不存在, 40901-重复 |
| 5xxxx | 服务端 | 50001-数据库异常, 50301-上游不可用 |

完整表见 `docs/ERROR_CODE_TABLE.md`

### 1.5 字段命名
- **驼峰命名**：`userId`, `kbName`, `hitRate`（**禁用** user_id 混用）
- **布尔字段**：`isActive`, `hasPermission`（`is*`/`has*`/`can*` 前缀）
- **时间字段**：`createdAt`, `updatedAt`（ISO 8601 字符串，**禁用** timestamp 数字）
- **金额**：`amountFen`（**整数分**为单位，禁用浮点）

---

## 2. KB 模块 v1 别名清单（21 个）

> 所有 v1 路径通过 `HTTP 308 Permanent Redirect` 重定向到原路径，**业务逻辑保持不变**。

| Method | v1 路径 | 原路径 | 鉴权 |
|--------|---------|--------|------|
| POST   | /api/v1/ai/kb-hit-log              | /api/ai/kb-hit-log              | 可选 |
| GET    | /api/v1/ai/kb-hit-stats            | /api/ai/kb-hit-stats            | 可选 |
| GET    | /api/v1/admin/kb/stats             | /api/admin/kb/stats             | adminAuth |
| GET    | /api/v1/admin/kb/search            | /api/admin/kb/search            | adminAuth |
| POST   | /api/v1/admin/kb/ingest            | /api/admin/kb/ingest            | adminAuth |
| GET    | /api/v1/admin/kb/audit-quality     | /api/admin/kb/audit-quality     | adminAuth |
| GET    | /api/v1/public/kb/stats            | /api/public/kb/stats            | 公开 |
| GET    | /api/v1/public/kb/hits             | /api/public/kb/hits             | 公开 |
| GET    | /api/v1/public/kb/search           | /api/public/kb/search           | 公开 |
| GET    | /api/v1/kb/list                    | /api/kb/list                    | optionalAuth |
| GET    | /api/v1/public/kb-stats            | /api/public/kb-stats            | 公开 |
| GET    | /api/v1/public/kb-list             | /api/public/kb-list             | 公开 |
| GET    | /api/v1/public/kb-manager/stats    | /api/public/kb-manager/stats    | 公开 |
| GET    | /api/v1/public/kb-manager/list     | /api/public/kb-manager/list     | 公开 |
| POST   | /api/v1/public/kb-manager/bump     | /api/public/kb-manager/bump     | 公开 |
| GET    | /api/v1/public/kb-manager/hit-rate | /api/public/kb-manager/hit-rate | 公开 |
| GET    | /api/v1/public/kb-manager/search   | /api/public/kb-manager/search   | 公开 |
| GET    | /api/v1/public/kb-query            | /api/public/kb-query            | 公开 |
| GET    | /api/v1/public/kb-search           | /api/public/kb-search           | 公开 |
| GET    | /api/v1/public/kb-topic-search     | /api/public/kb-topic-search     | 公开 |
| POST   | /api/v1/public/kb-hit              | /api/public/kb-hit              | 公开 |

### 2.1 重定向实现
源码位置：`server/api-server-v2.js`，每个 v1 路由**紧贴原路由上方**：

```javascript
// v1 alias
app.get('/api/v1/kb/list', (req, res) => res.redirect(308, '/api/kb/list'));
app.get('/api/kb/list', optionalAuth, async (req, res) => { /* 实际业务 */ });
```

---

## 3. 验收清单

- [x] 21 个 KB v1 路由全部返回 HTTP 308
- [x] 原路径业务逻辑不受影响
- [x] syntax 校验通过
- [x] 服务重启后健康检查 OK
- [ ] **TODO**：响应壳 `apiResp()` 工厂函数实现（节点 4）
- [ ] **TODO**：错误码表统一收敛（节点 5）
- [ ] **TODO**：前端 `api()` 封装自动注入 v1 前缀（节点 6）

---

## 4. 抽测 URL（实时验证）

```
curl -sS -I http://127.0.0.1:8920/api/v1/kb/list          # → 308 → /api/kb/list
curl -sS -I http://127.0.0.1:8920/api/v1/admin/kb/stats  # → 308 → /api/admin/kb/stats
curl -sS -I http://127.0.0.1:8920/api/v1/public/kb/stats # → 308 → /api/public/kb/stats
curl -sS -I http://127.0.0.1:8920/api/v1/ai/kb-hit-stats # → 308 → /api/ai/kb-hit-stats
```

---

## 5. 延伸规范（下一节点）

### 5.1 待统一 `apiResp()` 工具
在 `server/lib/api-resp.js` 中实现：
```javascript
function apiResp(res, code = 0, data = null, msg = '') {
  return res.json({
    ok: code === 0,
    code,
    data,
    msg: msg || (code === 0 ? '操作成功' : '操作失败'),
    ts: Date.now(),
    trace_id: res.locals.traceId || crypto.randomUUID().slice(0, 8)
  });
}
```

### 5.2 命名收敛（待办）
- [ ] 把 21 个 KB 路径里 `/public/kb-*` 短横线命名（`/public/kb-list`）改成 RESTful `/public/kb/files`（list 是动词，files 是资源）
- [ ] 把 `/api/public/kb-manager/*` 拆成 `/api/admin/kb/*`（统一权限语义）

---

## 6. 一句话

**KB 模块已开 v1 通道（21 alias）；下一节点统一响应壳 + 错误码表，2026-07-25 前完成**。