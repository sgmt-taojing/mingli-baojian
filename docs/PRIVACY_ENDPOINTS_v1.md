# 隐私合规 API 规范 (v1)

> 节点 10.2 | 文档版本: 1.0 | 更新: 2026-07-25

## 概述

命理宝鉴隐私合规模块提供 PIPL/GDPR 兼容的 4 个用户权利端点 + 1 个同意管理端点。

## 端点列表

| 端点 | 方法 | 鉴权 | 用途 |
|------|------|------|------|
| `/api/v1/user/consents` | GET | JWT | 查询用户所有同意状态 |
| `/api/v1/user/consents` | POST | JWT | 记录/更新某类同意 |
| `/api/v1/user/export` | GET | JWT | 导出个人数据（JSON） |
| `/api/v1/user/delete` | POST | JWT | 软删除（30天宽限期） |
| `/api/v1/user/restore` | POST | JWT | 撤销软删除 |

## 数据模型

### user_consents
```sql
CREATE TABLE user_consents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  consent_type TEXT NOT NULL,
  granted INTEGER DEFAULT 1,
  version TEXT DEFAULT '1.0',
  ip TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, consent_type, version)
);
```

### user_deletion_requests
```sql
CREATE TABLE user_deletion_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  reason TEXT,
  requested_at TEXT DEFAULT CURRENT_TIMESTAMP,
  scheduled_hard_delete_at TEXT,
  cancelled_at TEXT
);
```

## API 详情

### 1. POST /api/v1/user/consents

**请求：**
```json
{
  "consentType": "birth_data",
  "granted": true,
  "version": "1.0"
}
```

**响应（200）：**
```json
{
  "ok": true,
  "data": { "consentId": 17 },
  "message": "consent recorded"
}
```

**错误：**
- `400`: `consentType 必填` / `granted 必填`
- `401`: 未登录

### 2. GET /api/v1/user/consents

**响应（200）：**
```json
{
  "ok": true,
  "data": {
    "consents": [
      { "consent_type": "birth_data", "granted": 1, "version": "1.0", "created_at": "..." },
      { "consent_type": "third_party_ai", "granted": 0, "version": "1.0", "created_at": "..." }
    ]
  }
}
```

### 3. GET /api/v1/user/export

**响应：** JSON 附件下载
```
Content-Disposition: attachment; filename="mingli-user-{id}-export.json"
Content-Type: application/json; charset=utf-8
```

**导出包结构：**
```json
{
  "exportedAt": "2026-07-25T...",
  "exportVersion": "1.0",
  "gdprBasis": "PIPL 第 45 条 / GDPR 第 20 条",
  "user": { "id": 12, "phone": "..." },
  "userData": [...],
  "roles": [...],
  "paipan_records": [...],
  "yearly_pushes": [...],
  "feedback_points": [...],
  "shop_orders": [...],
  "consents": [...],
  "meta": { "totalRows": 42 }
}
```

### 4. POST /api/v1/user/delete

**请求：**
```json
{ "reason": "privacy_concern" }
```

**响应（200）：**
```json
{
  "ok": true,
  "data": {
    "requestedAt": "2026-07-25T...",
    "scheduledHardDeleteAt": "2026-08-24T...",
    "gracePeriodDays": 30
  },
  "message": "账号已注销，30 天内可恢复"
}
```

### 5. POST /api/v1/user/restore

**响应（200）：**
```json
{
  "ok": true,
  "data": {
    "restoredAt": "2026-07-25T...",
    "reactivated": true
  },
  "message": "账号已恢复"
}
```

## 审计日志

所有 PII 操作写入 `audit_logs`，`action` 字段遵循 `consent.*` 或 `pii.*` 命名空间。

## Cron 任务

```javascript
// scripts/hard-delete-cron.js — 每天 03:00
const due = db.prepare(`
  SELECT user_id FROM user_deletion_requests
  WHERE scheduled_hard_delete_at < CURRENT_TIMESTAMP
    AND cancelled_at IS NULL
`).all();
```
