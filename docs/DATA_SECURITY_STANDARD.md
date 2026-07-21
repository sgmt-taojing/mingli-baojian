# 命理宝鉴 · 数据安全规范 (Data Security Standard)

> **版本**: v1.0 · 2026-07-21
> **适用范围**: 全部缘主/信众数据的导出、传输、存储、审计

---

## 一、4 道防线架构

```
┌──────────────────────────────────────────────────────┐
│  请求导出                                            │
│    ↓                                                 │
│  ❶ 字段级脱敏（手机/姓名/地址/身份证/生辰/病例）    │
│    ↓                                                 │
│  ❷ 角色鉴权（free<vip<merchant<doctor<master<admin） │
│    ↓                                                 │
│  ❸ 审计水印（每次导出 → audit_logs + 水印指纹）      │
│    ↓                                                 │
│  ❹ 加密归档（敏感字段 AES-256-GCM 加密存档）         │
│    ↓                                                 │
│  输出 CSV / JSON / 加密包                            │
└──────────────────────────────────────────────────────┘
```

## 二、敏感字段等级表

### 等级定义
| 等级 | 含义 | 可见角色 |
|------|------|---------|
| 0 | 公开字段（生肖/日干/喜用神） | 任何人 |
| 1 | 低敏感（姓名/反馈内容） | vip+, merchant+ |
| 2 | 中敏感（手机/生辰/地址/用户ID） | doctor+, master+ |
| 3 | 高敏感（症状/体质/分析报告/营业执照） | admin_a/b+ |
| 4 | 完整明文 | 仅 super_admin |

### 按表字段配置

#### users 表（缘主档案）
| 字段 | 等级 | 脱敏方法 |
|------|------|---------|
| phone | 2 | 138\*\*\*\*1234 |
| name | 1 | 张\*\* |
| birth_date | 2 | 1990\*\*-\*\* |
| birthplace | 2 | 广东省\*\*\*\* |
| residence | 2 | 北京市\*\*\*\* |
| sex / zodiac / day_stem / xi_ele | 0 | 不脱敏 |

#### master_cases 表（大师病例）
| 字段 | 等级 | 脱敏方法 |
|------|------|---------|
| patient_id | 2 | U000123 |
| symptoms | 3 | 手机号/邮箱/身份证替换 |
| master_analysis | 3 | 手机号/邮箱/身份证替换 |
| case_number | 1 | CAS\*\*\*\*01 |

#### tcm_reports 表（中医报告）
| 字段 | 等级 | 脱敏方法 |
|------|------|---------|
| report_text | 3 | 高强度脱敏（截断+替换） |
| filtered_text | 2 | 中强度脱敏 |
| patient_id | 2 | U000123 |

#### merchants 表（商户）
| 字段 | 等级 | 脱敏方法 |
|------|------|---------|
| phone | 2 | 138\*\*\*\*1234 |
| boss / master | 1 | 张\*\* |
| license / cert | 3 | 9132\*\*\*\*\*\*\*\*\*5678 |

## 三、角色权限矩阵

| 角色 | 等级 | 可见表 | 脱敏程度 |
|------|------|--------|---------|
| free | 0 | 仅公开统计 | 完全脱敏 |
| registered | 0 | 自己的档案 | 自己明文，他人脱敏 |
| vip | 1 | 脱敏档案 | 中等脱敏 |
| merchant | 1 | 自门店病例 | 中等脱敏 |
| doctor | 2 | 分配的病例 | 低脱敏 |
| master | 2 | 分配的病例 | 低脱敏 |
| admin_a / admin_b | 3 | 全部表 | 审计留痕 |
| super_admin | 4 | 全部表 | 明文（审计+水印） |

## 四、导出 API

### POST /api/export/csv
脱敏 CSV 导出（UTF-8 BOM 头，Excel 直接打开）

请求体:
```json
{
  "table": "users",       // users / merchants / master_cases / tcm_reports / feedback / medical_cases
  "purpose": "月度统计"    // 导出用途说明
}
```

响应: `text/csv` 文件下载，末尾含水印指纹

### POST /api/export/json
脱敏 JSON 导出（带 meta + watermark）

### POST /api/export/archive
加密归档（仅 super_admin）

请求体:
```json
{
  "table": "master_cases",
  "ids": [1, 2, 3],
  "reason": "法律合规归档"
}
```

响应: `encrypted_payload`（AES-256-GCM 密文）

### POST /api/export/decrypt
解密归档（仅 super_admin）

请求体:
```json
{
  "encrypted_payload": "enc:...",
  "reason": "审计回溯 #CASE-001"
}
```

### POST /api/export/unlock
申请解锁令牌

### GET /api/export/audit-log
导出审计日志（仅 super_admin）

### GET /api/export/policy
查看脱敏规则（仅 super_admin）

## 五、审计水印机制

每次导出生成唯一 `watermark_id`:
```
WM-{timestamp}-{HMAC-SHA256签名前16位}
```

- 嵌入 CSV 末尾注释行
- 嵌入 JSON `meta.watermark` 字段
- 写入 `audit_logs` 表，关联 user_id / ip / user_agent

**泄漏追溯**: 拿到泄漏文件 → 提取 watermark_id → 查 audit_logs → 定位导出者

## 六、加密归档

使用 AES-256-GCM 对称加密:
- 密钥: `EXPORT_AES_KEY` 环境变量（生产环境必须设置）
- 格式: `enc:{iv}:{authTag}:{ciphertext}`
- 归档操作必须 super_admin 权限 + 填写 reason

## 七、解锁令牌

场景: 医生临时需要查看完整手机号联系缘主

```
POST /api/export/unlock
{
  "table": "users",
  "target_ids": [123],
  "ttl_hours": 1,
  "reason": "紧急联系缘主复诊"
}
```

- TTL 默认 1 小时
- 审计日志记录申请者、目标、过期时间
- 令牌本身不含解密能力，仅是审计凭据

## 八、定期审计

### 建议频率
- **每周**: super_admin 审查 export_audit_log
- **每月**: 统计导出次数 TOP 5 用户
- **每季**: 审视敏感字段等级是否需调整

### SQL 查询模板
```sql
-- 本月导出统计
SELECT user_id, action, COUNT(*) as cnt
FROM audit_logs
WHERE action LIKE 'export_%' AND date(created_at) >= date('now', '-30 day')
GROUP BY user_id, action ORDER BY cnt DESC LIMIT 20;

-- 可疑模式：同一用户 1 小时内导出 >3 次
SELECT user_id, COUNT(*) as cnt
FROM audit_logs
WHERE action LIKE 'export_%' AND created_at > datetime('now', '-1 hour')
GROUP BY user_id HAVING cnt > 3;
```

## 九、禁止行为

| # | 禁止 | 理由 |
|---|------|------|
| 1 | 不得在客户端 localStorage 存储原始手机号/身份证 | XSS 可窃取 |
| 2 | 不得在 URL 参数中传递原始敏感字段 | 日志/CDN 会记录 |
| 3 | 不得在 console.log 打印完整病例正文 | 开发者工具可见 |
| 4 | 不得将生产数据导出到非加密介质 | 物理泄漏 |
| 5 | 不得将 super_admin 账号共享使用 | 审计追溯失效 |
| 6 | 不得跳过 /api/export/* 端点直接查库导出 | 绕过审计 |

## 十、事件响应

发现数据泄漏时:
1. 提取泄漏文件中的 watermark_id
2. 查 `audit_logs` 定位导出者和时间
3. 评估泄漏范围（哪些表、哪些缘主）
4. 通知受影响缘主（72 小时内）
5. 关闭相关账号导出权限
6. 补录安全事件到 `audit_logs`

---

*本规范为命理宝鉴数据安全的唯一权威文档。所有导出代码必须遵循此规范。*
