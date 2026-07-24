# 命理宝鉴 · 隐私合规规范 v1.0

> **节点 10.1 规范起草** · 2026-07-25
> **遵循法规**：《个人信息保护法》（PIPL 2021）+ GDPR（欧盟通用数据保护条例）+ 等级保护 2.0 三级
> **覆盖范围**：用户全生命周期（注册 → 使用 → 导出 → 删除）的隐私保护

---

## 1. PII 字段分级与处理策略

### 1.1 三级分类

| 级别 | 字段类型 | 字段实例 | 加密要求 | 脱敏要求 |
|------|---------|---------|---------|---------|
| **L3 高度敏感** | 身份证/银行卡/精确住址 | id_card / bank_card / precise_address | **AES-256-GCM 强制加密** | 永远不显示明文 |
| **L2 中度敏感** | 手机/出生日期/出生地 | phone / birth_date / birthplace | **AES-256-GCM 加密** | 仅 owner 显示，访客脱敏 |
| **L1 低度敏感** | 姓名/性别/职业 | name / sex / occupation | 建议加密 | 姓名首字保留 + 「*」|
| **L0 公开** | 头像/性别/生肖 | avatar / zodiac / day_stem | 不加密 | 明文 |

### 1.2 字段存储矩阵

| 表 | L3 字段 | L2 字段 | L1 字段 | L0 字段 |
|----|---------|---------|---------|---------|
| `users` | - | phone / birth_date / birthplace / residence | name / occupation | sex / zodiac / day_stem |
| `merchants` | license / cert | phone / boss / master | name / school | type / split_rate |
| `clinic_cases` | id_card | phone / name | filtered_text | status |
| `yuanzhu_payments` | - | - | - | amount / type |
| `feedback` | - | contact | - | content |

**存储约定**：
- 所有 L2+ 字段**必须以 `enc:iv:authTag:ciphertext` 格式**存入 SQLite（security-v2.js 已支持）
- L0/L1 字段可明文（便于查询和统计）
- L2+ 字段的**明文仅存在于运行时内存**，永不入日志、永不进前端 response

---

## 2. 密钥管理规范

### 2.1 密钥分层

| 密钥 | 环境变量 | 长度要求 | 用途 |
|------|---------|---------|------|
| 主加密密钥 | `MINGLI_ENCRYPT_KEY` | ≥ 32 字符 | AES-256-GCM 加密 L2+ 字段 |
| JWT 签名密钥 | `MINGLI_JWT_SECRET` | ≥ 32 字符 | 签发/验证 access_token |
| 旧加密密钥 | `MINGLI_ENCRYPT_KEY_LEGACY` | ≥ 32 字符 | 兼容 `encrypted:` 旧格式解密 |
| 导出归档密钥 | `MINGLI_EXPORT_KEY` | ≥ 32 字符 | 加密 ZIP/JSON 导出包 |

### 2.2 密钥存储

- **生产环境**：必须使用 macOS Keychain 或 1Password CLI 注入，**禁止明文写 `.env`**
- **开发环境**：使用 `.env.local`（已加入 `.gitignore`），**禁止提交**
- **轮转策略**：每 90 天轮转一次；轮转时启用双重解密（新+旧），全部迁移完成后弃用旧密钥
- **泄漏应急**：发现密钥泄漏立即 `MINGLI_ENCRYPT_KEY_EMERGENCY=1` 触发强制轮转脚本

### 2.3 启动校验（节点 10.3 落地）

```bash
# server/startup-privacy-check.sh
- 检查 4 个密钥环境变量存在 + 长度 ≥ 32
- 生产模式下密钥为 dev-key-* 前缀 → 拒绝启动
- 密钥强度检测（zxcvbn-style：必须含大小写+数字+特殊字符）
```

---

## 3. 用户数据生命周期管理

### 3.1 数据采集（注册）

- **明示同意**：注册前必须勾选《隐私政策》+《用户协议》
- **最小化采集**：仅采集 8 个必要字段（phone / name / sex / birth_date / birth_hour / birthplace / residence / occupation）
- **禁止采集**：身份证、银行卡、家庭住址精确门牌号（除特殊业务场景）

### 3.2 数据使用

- **目的限定**：仅用于排盘、推流、报告生成；**禁止用于广告/营销/二次销售**
- **访问日志**：每次 L2+ 字段解密访问记录 audit_logs（user_id / field / table / target_id / timestamp）
- **前端 response**：API 返回前**自动脱敏**（data-export-guard.js sanitizeField），owner 看明文，访客看脱敏

### 3.3 数据导出（GDPR 第 20 条 / PIPL 第 45 条）

| 场景 | 触发方式 | 输出格式 | 包含内容 |
|------|---------|---------|---------|
| 用户自助导出 | `GET /api/v1/user/export` | ZIP（含 JSON + CSV + 加密归档） | 全部 L0+L1 字段明文 + L2+ 解密后明文 |
| 管理员批量导出 | `POST /api/v1/admin/export` | CSV（脱敏后）+ 水印 | L0+L1 明文 + L2+ 脱敏（如 `138****5678`）|
| 法律合规导出 | `POST /api/v1/admin/legal-export` | 加密 ZIP + 司法链 | 全量明文 + 哈希完整性证明 |

**响应延迟**：导出生成 ≤ 5s（数据量 ≤ 100 条）/ ≤ 30s（数据量 ≤ 10000 条）
**下载链接**：一次性 URL，24h 过期

### 3.4 数据删除（GDPR 第 17 条 / PIPL 第 47 条）

**两种模式**：

| 模式 | 端点 | 保留时间 | 适用场景 |
|------|------|---------|---------|
| **软删除（注销）** | `DELETE /api/v1/user/me` | 30 天可恢复，之后硬删除 | 用户主动注销 |
| **硬删除（彻底清除）** | 定时任务 daily 03:00 | 立即清除 | 30 天宽限期到期 |

**硬删除规则**：
1. 删除 `users` 表该用户所有记录
2. 删除关联表：`paipan_records` / `feedback` / `clinic_cases` / `yuanzhu_yearly_pushes` / `payments`
3. 删除文件存储：`uploads/{user_id}/*` 全部文件
4. 删除加密备份：`backups/backup-{date}.db` 中移除该用户记录（重建备份）
5. audit_logs **永久保留**（脱敏后）— 用于追溯合规审计

### 3.5 数据保留

| 数据类型 | 保留期 | 法律依据 |
|---------|--------|---------|
| 用户基本资料 | 注销后 30 天 | GDPR 第 17 条 |
| 排盘记录 | 注销后立即删除 | 业务必需 |
| 支付凭证 | **永久保留 7 年** | 《会计档案管理办法》|
| audit_logs | **永久保留 5 年** | PIPL 第 69 条 |
| 反馈工单 | 注销后 30 天 | 业务必需 |

---

## 4. 角色权限矩阵

| 角色 | 查看自己 PII | 查看他人 PII（脱敏） | 修改 PII | 删除 PII | 导出 PII |
|------|------------|--------------------|---------|---------|---------|
| **owner**（本人） | ✅ 明文 | ❌ | ✅ 自己 | ✅ 自己 | ✅ 自己 |
| **super_admin** | ✅ 明文 | ✅ admin 级脱敏 | ✅ 全部 | ✅ 全部 | ✅ admin 导出 |
| **merchant** | ✅ 明文（自己商户） | ✅ mid 级脱敏 | ❌ | ❌ | ❌ |
| **doctor** | ✅ 明文（自己病例） | ✅ doctor 级脱敏 | ❌ | ❌ | ❌ |
| **vip** | ✅ 明文 | ✅ vip 级（手机尾号） | ❌ | ❌ | ❌ |
| **registered** | ✅ 明文 | ✅ registered 级（手机尾号） | ❌ | ❌ | ❌ |
| **guest** | ❌ | ❌ | ❌ | ❌ | ❌ |

**脱敏等级**（数字越大看得越多）：
- registered: 0（仅 owner 明文）
- vip: 1（手机尾号 + 姓名首字）
- merchant: 1（同 vip）
- doctor: 2（病例正文脱敏版）
- super_admin: 3（全量明文 + 审计）

---

## 5. 同意管理

### 5.1 同意类型

| 类型 | 触发时机 | 可撤回 |
|------|---------|--------|
| 注册协议 | 注册流程 | ✅（= 注销） |
| 隐私政策 v1 | 注册流程 | ✅（= 注销） |
| 推流授权 | 开启「每日推送」时 | ✅（关闭推送） |
| 数据研究使用 | 单独勾选（默认 ❌） | ✅（设置页关闭） |

### 5.2 同意记录

```sql
CREATE TABLE user_consents (
  user_id INTEGER,
  consent_type TEXT,  -- 'tos' / 'privacy' / 'push' / 'research'
  granted INTEGER,    -- 1=同意, 0=拒绝
  version TEXT,       -- 隐私政策版本号（如 v1.0）
  ip TEXT,
  user_agent TEXT,
  created_at TEXT,
  PRIMARY KEY (user_id, consent_type, version)
);
```

**每次隐私政策版本变更**：强制重新弹窗 + 记录 `user_consents`

---

## 6. 审计与可追溯

### 6.1 必须记录的 PII 事件

| 事件 | 字段 |
|------|------|
| `auth.login` | user_id / method / ip |
| `pii.read` | user_id / field / table / target_id / requester_id |
| `pii.export` | user_id / table / rows_count / purpose / requester_id |
| `pii.delete` | user_id / mode / requester_id |
| `key.rotate` | key_type / old_fingerprint / new_fingerprint |
| `consent.grant` | user_id / consent_type / version |
| `consent.revoke` | user_id / consent_type / version |

### 6.2 audit_logs 表结构（已存在，需扩展）

```sql
ALTER TABLE audit_logs ADD COLUMN requester_id INTEGER;  -- 操作者 user_id
ALTER TABLE audit_logs ADD COLUMN target_id INTEGER;      -- 被操作者 user_id
ALTER TABLE audit_logs ADD COLUMN field TEXT;            -- PII 字段名
```

**保留期**：5 年
**查询端点**：`GET /api/v1/admin/audit-logs?range=30d&user_id=X`（admin 专用）

### 6.3 异常告警

| 阈值 | 动作 |
|------|------|
| 单用户 1h 内 pii.read > 100 次 | 触发 admin 通知（疑似爬虫）|
| 单 IP 1h 内 pii.export > 5 次 | 自动封禁 IP + admin 告警 |
| pii.delete > 10 次/日 | admin 强制审核 |

---

## 7. 前端约束

### 7.1 传输安全

- **强制 HTTPS**：生产环境拒绝 HTTP（除 `/health`）
- **HSTS**：max-age=31536000; includeSubDomains
- **CSP**：`default-src 'self'; img-src 'self' data: https:; script-src 'self' 'nonce-...'`

### 7.2 展示约束

| 场景 | 展示规则 |
|------|---------|
| 手机号 | `138****5678` 格式 |
| 出生日期 | 仅显示年月（如 `1979-06`）除非 owner |
| 身份证 | 永不展示 |
| 住址 | 仅显示省市（如 `浙江省杭州市`） |

### 7.3 客户端存储

- **localStorage**：禁止存 L2+ 字段明文（如 phone 明文）
- **IndexedDB**：禁止存 L2+ 字段
- **Cookie**：仅存 token + 用户 ID，**禁止** PII

---

## 8. 应急响应

### 8.1 数据泄漏 24h 应急流程

1. **0-1h**：冻结 `MINGLI_ENCRYPT_KEY`（启用旧密钥解密 + 新密钥加密）
2. **1-3h**：通知 admin + 启动泄漏范围审计（`SELECT * FROM audit_logs WHERE event IN ('pii.read', 'pii.export') AND created_at > 泄漏时间 - 7d`）
3. **3-12h**：向受影响用户发送通知（推流 + 短信）
4. **12-24h**：上报监管部门（PIPL 第 57 条 1h 上报 + GDPR 72h 上报）

### 8.2 用户投诉响应

- **响应时长**：≤ 24h 首次回复，≤ 7 天解决
- **升级路径**：admin → 研发负责人 → 法务
- **记录归档**：所有投诉记录到 `user_complaints` 表（永久保留）

---

## 9. 合规清单（验收对照表）

| 条款 | 实现位置 | 验收 |
|------|---------|------|
| AES-256-GCM 加密 L2+ 字段 | `server/security-v2.js` `encrypt()` | ✅ 14 users 已加密 |
| 字段级脱敏 4 道防线 | `server/data-export-guard.js` | ✅ sanitizeField 函数已实现 |
| 用户导出（GDPR 第 20 条） | **本规范 3.3**（节点 10.2 实现） | ⏳ 节点 10.2 |
| 用户删除（GDPR 第 17 条） | **本规范 3.4**（节点 10.2 实现） | ⏳ 节点 10.2 |
| 同意管理 | `user_consents` 表（节点 10.2 创建） | ⏳ 节点 10.2 |
| 审计日志扩展 | `audit_logs` ALTER（节点 10.2） | ⏳ 节点 10.2 |
| 密钥管理 + Keychain | **本规范 2**（节点 10.3 实现） | ⏳ 节点 10.3 |
| 隐私政策 v1 文档 | `app/privacy-policy.html`（节点 10.3） | ⏳ 节点 10.3 |
| 启动密钥校验 | `server/startup-privacy-check.sh`（节点 10.3） | ⏳ 节点 10.3 |
| 应急响应剧本 | `docs/PRIVACY_INCIDENT_PLAYBOOK.md`（节点 10.3） | ⏳ 节点 10.3 |

---

## 10. 版本与维护

- **当前版本**：v1.0（2026-07-25）
- **下次评审**：每 6 个月（下次：2027-01-25）
- **维护人**：AutoClaw 🦞
- **变更触发**：法规变更 / 业务重大调整 / 安全事件