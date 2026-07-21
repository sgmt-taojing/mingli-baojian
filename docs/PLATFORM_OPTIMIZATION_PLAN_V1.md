# 命理宝鉴 · 整体架构优化方案 v1.0

> 按规范标准进行整体框架设计与优化诊断 → 开发 → 测试

**生成时间**: 2026-07-21 23:30
**目标**: 建立"后台管理 + 后台服务 + 性能监控 + 角色分权限 + 多端协同 + 站内沟通 + 流程规范"七大能力

---

## 一、整体架构总览

```
┌─────────────────────────────────────────────────────────────────────┐
│                          应用层 (7端)                                │
├──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──┤
│  H5 端   │  小程序   │  后台     │ Admin    │ Monitor  │  IM 端   │  SDK  │
│ divination│ minipgm  │ yuanzhu  │ /admin   │/monitor  │ /im      │ /sdk │
└─────┬────┴────┬─────┴────┬─────┴────┬─────┴────┬─────┴────┬─────┴──┘
      │          │          │          │          │          │
┌─────▼──────────▼──────────▼──────────▼──────────▼──────────▼───────┐
│                    API Gateway (Express + RBAC)                    │
│              ┌──────────────────────────────────┐                  │
│              │   API v1 (新版规范 shell)        │                  │
│              │  /api/v1/yuanzhus (RESTful)     │                  │
│              │  /api/v1/admin/...              │                  │
│              │  /api/v1/monitor/...            │                  │
│              │  /api/v1/messages/...            │                  │
│              └──────────────────────────────────┘                  │
│                  旧路径兼容 6 个月（Deprecation 响应头）            │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────────┐
│                       服务层 (8 子系统)                              │
├─────────────┬─────────────┬─────────────┬─────────────────────────────┤
│  鉴权       │   RBAC      │  性能监控    │   消息总线                  │
│  auth.js    │rbac-mw      │monitor.js  │   im-bus.js (新)             │
├─────────────┼─────────────┼─────────────┼─────────────────────────────┤
│  排盘       │   KB        │  数据安全    │   推送                       │
│  8 engine   │  kb-mgmt    │data-export │  push-engine                │
└─────────────┴─────────────┴─────────────┴─────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────────┐
│                       数据层 (SQLite)                                │
│  yidao.db · 31 表 (yuanzhu/clinic/kb/admin/message/monitor...)     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 二、8 大子系统 · 现状与改造

### 1. 后台管理（admin.html → admin-console.html）

**现状**:
- `app/admin.html` 104KB 单文件，主菜单+卡片式管理
- `app/admin/yuanzhu-dashboard.html` 单独缘主仪表盘
- `app/admin-shop.html` 商城独立管理
- ⚠️ 缺口：无独立模块化拆分、无 KPI 看板、无审计日志查看

**改造方案**:

| 模块 | 路径 | 职责 |
|------|------|------|
| 仪表盘 | `/admin/dashboard` | KPI 大屏：今日排盘数/活跃用户/异常告警/收入 |
| 缘主管理 | `/admin/yuanzhu` | 列表+详情+推送记录+反馈 |
| 排盘审计 | `/admin/paipan-audit` | 8 引擎调用次数+耗时+错误率 |
| KB 管理 | `/admin/kb-mgmt` | 9 表 CRUD + 蒸馏 + 模型构建 |
| 数据导出 | `/admin/export` | 走数据安全闸门 + 留痕 |
| 推送管理 | `/admin/push` | 时段控制 + 模板 + 关键字统计 |
| 系统审计 | `/admin/audit-log` | 全操作流水 + 异常告警 |

**核心 KPI 大屏字段**：
- 今日排盘 / 历史总排盘 / 异常率（≤ 0.5%）
- 活跃用户（DAU / MAU）
- 推送成功率 / 失败原因 TOP3
- KB 命中率 / formal 增长率

---

### 2. 后台服务（api-server-v2.js 升级）

**现状**:
- 单文件 1710 行，56+ 路由
- ⚠️ 缺口：无模块化、未走新规范壳(routes 分包)

**改造方案（split routes）**：

```
server/
├── api-server-v2.js          # 入口（仅 bootstrap + mount routes）
├── routes/
│   ├── index.js              # 路由总线
│   ├── auth-routes.js        # 鉴权 / JWT
│   ├── yuanzhu-routes.js     # 缘主 CRUD
│   ├── paipan-routes.js      # 8 排盘引擎路由
│   ├── kb-routes.js          # KB 管理 + 9 表 API
│   ├── clinic-routes.js      # 中医诊疗
│   ├── course-routes.js      # 大师讲堂
│   ├── shop-routes.js        # 商城
│   ├── feedback-routes.js    # 反馈
│   ├── export-routes.js      # 数据安全（已存在）
│   ├── monitor-routes.js     # 性能监控 (新)
│   ├── message-routes.js     # 站内信 IM (新)
│   ├── audit-routes.js       # 审计日志 (新)
│   └── knowledge-routes.js   # KB 检索 (新)
├── middleware/
│   ├── auth.js               # JWT 鉴权
│   ├── rbac.js               # 权限中间件
│   ├── monitor.js            # 性能埋点
│   └── rate-limit.js         # 限流
└── bootstrap/
    ├── db.js                 # sqlite 初始化
    ├── schema-loader.js      # SQL schema 加载
    └── start.js              # 启动入口
```

**改造顺序**：
1. 抽 auth/rbac/限流 到 middleware/
2. 按业务线拆路由（12 个 routes/*.js）
3. entry 仅 bootstrap + mount
4. 跑 ab -n 100 压测，对比改造前后 RT

---

### 3. 性能监控（新建 monitor 子系统）

**现状**: ❌ 完全没有埋点、火焰图、慢查询统计

**设计方案**:

#### 3.1 指标体系（5 类 25 指标）

| 类别 | 指标 | 计算 |
|------|------|------|
| **HTTP** | 请求量/成功率/P95/P99 | res.on('finish') |
| **引擎** | 8 引擎调用次数/平均耗时/错误率 | engine.run() 包一层 |
| **DB** | 查询次数/慢查询(>100ms)/命中率 | sqlite 计时 |
| **KB** | formal 命中次数/置信度分布 | KB 命中路径埋点 |
| **AI** | AI 调用次数/兜底率/响应时间 | 智谱 + 兜底 |

#### 3.2 采集 → 存储 → 展示

```javascript
// middleware/monitor.js
function trackRequest(req, res, next) {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const dur = Number(process.hrtime.bigint() - start) / 1e6;
    monitorStore.insert({
      type: 'http',
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration_ms: dur,
      role: req.auth?.role,
      timestamp: Date.now()
    });
  });
  next();
}
```

#### 3.3 5 个核心端点

| 端点 | 用途 |
|------|------|
| `GET /api/v1/monitor/dashboard` | 实时 KPI（DAU/请求数/P95/错误率）|
| `GET /api/v1/monitor/slow-queries` | 慢查询 TOP10 |
| `GET /api/v1/monitor/engine-stats` | 8 引擎调用统计 |
| `GET /api/v1/monitor/kb-hit-rate` | KB 命中率实时 |
| `GET /api/v1/monitor/timeseries` | 时序数据（小时/天粒度）|

#### 3.4 告警规则（5 条）

| 触发条件 | 通知 |
|---------|------|
| P95 连续 5 分钟 > 3s | 钉钉 / Webhook |
| 错误率 1 分钟 > 5% | 钉钉 / 邮件 |
| 引擎 500 > 3 次 | 控制台红 banner |
| KB 命中率 < 30% | 控制台黄 banner |
| DB 连接失败 | 系统告警 |

---

### 4. RBAC 分级权限（已存在 → 强化）

**现状**:
- `server/rbac-middleware.js` 248 行
- 10 角色：guest/free/mingdao/advanced/vip/admin_a/patient/master/doctor/admin_b/super_admin

**强化方向**:

| 维度 | 当前 | 强化 |
|------|------|------|
| 角色数 | 10 | 12（增加 `doctor_assistant` / `merchant`）|
| 权限粒度 | 端点级 | 端点 + 资源（按 user_id / clinic_id 隔离）|
| 数据隔离 | 无 | 行级（doctor 只能看自己被分配的 case）|
| 多端协同 | 单一 token | 三端 token 来源（小程序/H5/IM）统一 |
| 审计 | 无 | 每个受保护操作写 audit_log |

#### 4.1 行级隔离示例

```javascript
// clinic/case/list
const cases = db.prepare(`SELECT * FROM medical_cases
  WHERE assigned_doctor_id = ? OR assigned_master_id = ?
  ORDER BY created_at DESC`)
  .all(req.user.id, req.user.id);
```

#### 4.2 三端 token 统一

```
H5/app: JWT in Authorization header
小程序: JWT in x-web-jwt header (兼容 wx.login)
IM: JWT in cookie (WebSocket upgrade 前置鉴权)
```

所有 token 都过统一的 `auth-middleware.js`，自动映射到 `req.auth = { id, role, platform }`。

---

### 5. 多端协同（三端同步）

**现状**:
- H5：`app/*.html` 多个页面
- 小程序：`miniprogram/` 已开发
- ❌ IM 端无
- ❌ 三端数据不互通

**协同方案**:

| 数据 | H5 | 小程序 | IM | 同步 |
|------|----|---|----|------|
| 缘主档案 | ✓ | ✓ | ✗ | 后端统一 |
| 排盘结果 | ✓ | ✓ | ✓ | 后端存 yidao.db |
| KB 缓存 | ✓ | ✓ | ✓ | localStorage + 后端 push |
| 推送状态 | ✓ | ✓ | - | 后端 scheduled_job |
| 站内消息 | ✗ | ✗ | ✓ | 新建 message_bus |

#### 5.1 三端一致的"数据契约层"（DTO 规范）

```javascript
// server/dto/yuanzhu.dto.js
function yuanzhuDTO(row) {
  return {
    id: row.id,
    name: row.name,                  // 不同角色看到不同
    bazi: row.bazi ? summary(row.bazi) : null,
    phone: row.phone ? mask(row.phone, 'doctor') : null,
    latest_report_id: row.latest_report_id,
    updated_at: row.updated_at
  };
}
```

#### 5.2 H5 → 小程序同步策略

- 用户首次在小程序打开，引导登录
- 登录后小程序拿 H5 token，同一 user_id 共享档案
- API 端检测 platform header，对差异化内容走 dto

---

### 6. 站内沟通（新建 IM 子系统）

**现状**: ❌ 完全缺失

**设计方案**:

#### 6.1 4 类消息

| 类型 | 用途 | 场景 |
|------|------|------|
| **system** | 系统通知 | 推送完成 / 异常 / 升级 |
| **case** | 诊疗协作 | doctor ↔ master ↔ admin |
| **consult** | 用户咨询 | 管理员 ↔ 缘主 |
| **broadcast** | 全站公告 | 公告 / 升级 / 紧急 |

#### 6.2 核心能力

| 端点 | 用途 |
|------|------|
| `POST /api/v1/messages/send` | 发消息（带 RBAC）|
| `GET  /api/v1/messages/inbox` | 收件箱（分页）|
| `GET  /api/v1/messages/thread/:id` | 会话详情 |
| `POST /api/v1/messages/read/:id` | 标记已读 |
| `GET  /api/v1/messages/unread-count` | 未读数（顶部 badge）|
| `WS   /ws/im` | 实时消息（WebSocket）|
| `POST /api/v1/messages/broadcast` | super_admin 群发 |

#### 6.3 数据库表（4 张）

```sql
CREATE TABLE messages (
  id INTEGER PRIMARY KEY,
  from_id INTEGER, from_role TEXT, from_name TEXT,
  to_id INTEGER, to_role TEXT,
  type TEXT,              -- system/case/consult/broadcast
  subject TEXT,
  content TEXT,
  thread_id INTEGER,
  ref_id INTEGER,         -- 关联 case_id / report_id
  attachments TEXT,       -- JSON
  read_at TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE message_threads (
  id INTEGER PRIMARY KEY,
  participants TEXT,      -- JSON: [role, role]
  subject TEXT,
  last_message_at TEXT,
  unread_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'open'
);

CREATE TABLE message_reads (
  message_id INTEGER,
  user_id INTEGER,
  read_at TEXT DEFAULT (datetime('now','localtime')),
  PRIMARY KEY (message_id, user_id)
);

CREATE TABLE message_audit (
  message_id INTEGER,
  action TEXT,           -- send/read/delete/reply
  user_id INTEGER,
  ip TEXT,
  ua TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);
```

#### 6.4 实时推送

WebSocket 握手时鉴权，握手后 push 消息。离线时存 inbox，下次上线拉未读。

#### 6.5 前端 IM 页面（`app/im.html`）

- 左侧会话列表（缩略未读数）
- 右侧会话详情（消息流 + 输入框）
- 顶部红点未读 badge
- 三端消息打通（H5/小程序/IM 一致）

---

### 7. 流程规范（SOP）

#### 7.1 6 大标准流程

| 流程 | 触发 | 节点 | 失败处理 |
|------|------|------|---------|
| **新用户引导** | 注册 | 收集八字 → 选关心维度 → 首份报告 | 半引导完成度可中途退出 |
| **诊疗协作** | 提交症状 | patient→master→doctor→admin | 任何一环卡 24h 自动催办 |
| **KB 新源** | 上传文件 | extract→audit→promote→model | 审计失败自动打回 |
| **数据导出** | admin 触发 | policy→敏感判定→脱敏→水印→审计 | 解锁令牌过期自动 revoke |
| **推送发布** | 模板编辑 | 模板→preview→审批→定时→发送 | 审批拒绝退草稿 |
| **权限变更** | admin 操作 | 申请→审批→生效→通知 | 离职自动撤销所有权限 |

#### 7.2 流程引擎轻量化

不需要 flowable/camunda，自建轻量：

```javascript
// server/workflow/lightweight-bpm.js
class Workflow {
  constructor(name, steps) {
    this.name = name;
    this.steps = steps; // [{name, role, action, timeout}]
    this.instances = new Map();
  }
  start(ctx) { /* ... */ }
  advance(id, action) { /* ... */ }
  onTimeout(id) { /* webhook + notify */ }
}
```

#### 7.3 流程可视化

- admin 后台 /admin/workflow 显示每个流程的实例 + 当前节点
- 25 张图（按 6 大流程）

---

### 8. 测试与质量保障

#### 8.1 测试金字塔

| 层级 | 工具 | 覆盖率目标 |
|------|------|----------|
| 单元 | node:test (内置) | 80%+ |
| 集成 | supertest | 60%+ |
| 端到端 | 现有 9 流程脚本 | 100% 通过 |
| 性能 | autocannon | P95 ≤ 500ms |

#### 8.2 现有测试现状
- `scripts/flow-test.js`（回顾：9 大业务流程 26/26 全通过 ✅）

#### 8.3 缺补的测试

| 模块 | 测试用例数 |
|------|----------|
| monitor 时间序列 | ≥ 5 |
| IM 收件/发件/已读 | ≥ 8 |
| RBAC 行级隔离 | ≥ 6 |
| 数据安全脱敏 | ≥ 10 |
| 性能压测 | ≥ 3 |

---

## 三、实施路线图

### Phase 1（Week 1）— P0 关键改造
1. ✅ routes/ 模块化拆分（10 个 routes/*.js）
2. ✅ middleware/monitor.js 性能埋点
3. ✅ monitor 子系统 5 端点 + 仪表盘
4. ✅ IM 4 表 + 7 端点
5. ✅ admin/index.html 升级 + IM 前端

### Phase 2（Week 2）— P1 强化
1. RBAC 12 角色 + 行级隔离
2. 三端 token 统一
3. 6 流程引擎
4. test 覆盖率提升

### Phase 3（Week 3）— P2 完善
1. workflow 可视化
2. 告警 webhook
3. 性能压测脚本
4. 文档即代码

---

## 四、关键指标（验收标准）

| 指标 | 当前 | 目标 |
|------|------|------|
| API 响应 P95 | 未测 | ≤ 500ms |
| API 路由数 | 56 | 80+ |
| 模块数 | 4（admin/cli/admin-shop/yuanzhu-dash）| 7 |
| RBAC 粒度 | 端点级 | 端点+行级 |
| IM 用户 | 0 | 全员 |
| 测试覆盖率 | 0% | 80% |
| 监控指标 | 0 | 25 |
| 告警规则 | 0 | 5 |
| 流程数 | 0 | 6 |

---

## 五、文件落地清单

**新增**（估算 38 个文件）:
```
server/middleware/monitor.js          (180 行)
server/middleware/rate-limit.js       (60 行)
server/routes/monitor-routes.js       (220 行 · 5 端点)
server/routes/message-routes.js       (260 行 · 7 端点)
server/routes/audit-routes.js         (140 行 · 4 端点)
server/im-bus.js                       (140 行 · WS 简易)
server/database/messaging-schema.sql   (90 行 · 4 表)
server/database/monitor-schema.sql    (60 行 · 3 表)
server/dto/yuanzhu.dto.js              (80 行)
server/dto/clinic.dto.js               (90 行)
server/workflow/lightweight-bpm.js     (180 行)
app/admin/dashboard.html              (新文件 · KPI 大屏)
app/admin/monitor.html                (新文件 · 实时监控)
app/im.html                           (新文件 · IM 收件箱)
test/monitor.test.js                  (160 行)
test/im.test.js                       (240 行)
test/rbac-row-level.test.js           (140 行)
```

**改造**:
```
server/api-server-v2.js               (1710 → 600 行，仅 bootstrap)
server/rbac-middleware.js             (248 → 380 行 + 行级)
app/admin.html                        (104KB → 拆 4 模块)
docs/PLATFORM_OPTIMIZATION_PLAN_V1.md (本文件)
docs/STANDARDS_BACKLOG.md             (更新进度)
```

---

## 六、风险与回退

| 风险 | 概率 | 影响 | 回退 |
|------|------|------|------|
| routes 拆分引入循环依赖 | 中 | 高 | 留单文件副本 + 灰度切换 |
| monitor 埋点影响 P95 | 低 | 中 | 异步落盘 + 采样（10%）|
| IM WS 兼容性问题 | 中 | 中 | 轮询 fallback（5s 间隔）|
| RBAC 行级数据漏防 | 中 | 高 | 默认 deny + audit 抽样检查 |

---

**下一步**：按 P0 顺序，先做 routes 拆分 + monitor 埋点，保留 1 周回退窗口。
