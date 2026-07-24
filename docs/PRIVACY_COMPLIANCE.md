# 隐私合规规范（GDPR / PIPL）

> 版本: 1.0 | 节点: 10.2 | 更新: 2026-07-25

## 适用范围

命理宝鉴涉及个人敏感数据（出生日期时辰、手机号、住址、信仰、消费记录），
需同时遵守中国《个人信息保护法》(PIPL) 和国际 GDPR 标准。

## 一、用户权利（5 项 API）

| 权利 | 法规依据 | 端点 | 方法 |
|------|---------|------|------|
| 知情同意 | PIPL 第 14 条 / GDPR 第 7 条 | `/api/v1/user/consents` | GET / POST |
| 数据可携权 | PIPL 第 45 条 / GDPR 第 20 条 | `/api/v1/user/export` | GET |
| 删除权（软删） | PIPL 第 47 条 / GDPR 第 17 条 | `/api/v1/user/delete` | POST |
| 撤销删除 | 30 天宽限期恢复 | `/api/v1/user/restore` | POST |
| 反对自动化决策 | PIPL 第 24 条 / GDPR 第 22 条 | （预留） `/api/v1/user/auto-decision` | POST |

## 二、同意类型（5 类）

```js
const CONSENT_TYPES = {
  birth_data:        '出生信息（八字/紫微推演核心数据）',
  calendar_alert:    '日历提醒（节气/推送通知）',
  shop_purchase:     '商城消费记录',
  third_party_ai:    '第三方 AI 推理（数据传输到外部模型）',
  research_anonymous:'匿名化研究使用'
};
```

### 版本化

- 每次隐私策略更新 → 版本号 +1（如 `1.0` → `1.1`）
- 用户需重新同意新版本
- 旧版本同意记录保留不删

## 三、数据处理流程

```
用户操作 → 需要哪个同意类型？
  ├─ birth_data 未同意 → 拦截 + 引导到同意页
  ├─ third_party_ai 未同意 → AI 助手不可用
  └─ 全部同意 → 正常流程
```

## 四、软删除机制

1. 用户发起删除 → `user_deletion_requests` 表写入记录
2. `scheduled_hard_delete_at` = 当前 +30 天
3. 30 天宽限期内可恢复（`POST /restore`）
4. 超过 30 天 → cron 任务物理删除所有关联数据
5. 物理删除前导出最后一份备份（冷存储）

## 五、审计日志

所有 PII 操作写入 `audit_logs` 表：

| action | 说明 |
|--------|------|
| `consent.grant` | 用户授予权限 |
| `consent.revoke` | 用户撤销权限 |
| `pii.export` | 用户导出个人数据 |
| `pii.delete.soft` | 用户发起软删除 |
| `pii.delete.cancel` | 用户撤销软删除 |
| `pii.delete.hard` | 管理员执行物理删除 |

审计日志保留 3 年，不随用户删除而删除。

## 六、数据加密

- 传输层：HTTPS (TLS 1.2+)
- 存储层：SQLite 数据库文件权限 600
- 敏感字段加密：手机号 AES-256-GCM（计划中）
- 日志脱敏：手机号显示为 `138****0001`

## 七、第三方数据共享

| 场景 | 接收方 | 数据范围 | 合规要求 |
|------|--------|---------|---------|
| AI 推理 | 智谱 GLM-4V | 出生信息 + 问题 | 用户同意 + 数据协议 |
| AI 推理 | OpenAI GPT-4o | 同上 | 同上 |
| 支付 | 微信/支付宝 | 订单金额 | PCI-DSS 合规 |
| CDN | GitHub Pages | 静态资源 | 无 PII |

## 八、前端集成要求

### 同意弹窗（首次使用时）

- 首次进入 AI 助手 → 弹窗请求 `birth_data` + `third_party_ai` 同意
- 首次进入商城 → 弹窗请求 `shop_purchase` 同意
- 首次设置推送 → 弹窗请求 `calendar_alert` 同意
- 同意弹窗文案 ≤ 50 字，拒绝不影响核心功能

### 隐私中心页面

`app/privacy-center.html`（计划中）：
- 查看所有同意状态
- 撤销 / 重新授予同意
- 导出个人数据
- 注销账号

## 九、Cron 任务（计划中）

```bash
# 每天 03:00 检查软删除到期用户
0 3 * * * node scripts/hard-delete-cron.js
```

物理删除范围：
- `users` 表 `phone` 字段置 NULL
- `user_data` 相关行删除
- `paipan_records` 删除
- `yearly_pushes` 删除
- `user_consents` 保留（审计要求）
- `audit_logs` 保留
