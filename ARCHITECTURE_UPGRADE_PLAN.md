# 易道智鉴 · 架构升级完整方案

> **版本：** v1.0  
> **日期：** 2026-07-03  
> **编制：** 架构师 AutoClaw  
> **项目路径：** `/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/`

---

## 目录

1. [当前架构分析](#1-当前架构分析)
2. [目标架构设计](#2-目标架构设计)
3. [分阶段执行计划](#3-分阶段执行计划)
4. [各阶段详细任务](#4-各阶段详细任务)
5. [风险评估](#5-风险评估)
6. [回退方案](#6-回退方案)
7. [附录](#7-附录)

---

## 1. 当前架构分析

### 1.1 现状概览

| 维度 | 现状 | 严重程度 |
|------|------|----------|
| 前端 | 单体 HTML/CSS + Vanilla JS，无构建工具 | 🔴 严重 |
| 后端 | Python `http.server` 静态文件服务，无业务逻辑 | 🔴 严重 |
| 数据库 | 无，全部依赖浏览器 `localStorage` | 🔴 严重 |
| 安全 | 无 HTTPS、无认证、无加密、无防入侵 | 🔴 严重 |
| 并发 | Python `http.server` 单线程，无法并发 | 🔴 严重 |
| 项目管理 | 560个文件、82MB，大量备份文件散落 | 🟡 中等 |

### 1.2 技术栈详情

```
前端层：
├── HTML：43个页面，主文件 divination-hub.html (2.2MB / 36,606行)
├── CSS：内联在 HTML 中，divination-hub.css 外链
├── JS：divination-core.js (2.0MB / 34,508行) + 18个辅助JS文件
├── 数据存储：localStorage（用户八字、会员信息、推送状态等）
├── 第三方调用：fetch → api.g2claw.com（AI解读）
└── 无构建工具、无模块化、无TypeScript

服务层：
├── server.py：Python http.server (端口8910)
├── 无路由系统、无中间件、无API端点
├── 无认证机制、无CORS配置
└── 强制无缓存（每次请求重新传输2.2MB+）

数据层：
├── 无数据库
├── localStorage（浏览器本地，5-10MB限制）
├── 无持久化、无备份、无数据分析能力
└── 用户数据分散在各浏览器，无法跨设备同步

项目文件：
├── 560个文件，82MB总大小
├── 大量 .bak / .backup / .bak.* 备份文件
├── 多个 patch_*.py / expand_*.js / self_check*.js 临时脚本
└── 无版本控制规范（有git但提交不规范）
```

### 1.3 核心问题深度分析

#### 问题1：单体文件过大
- `divination-hub.html`：2.2MB，36,606行 — 包含HTML结构 + 内联CSS + 内联JS
- `divination-core.js`：2.0MB，34,508行 — 所有排盘引擎、UI逻辑、数据操作混在一起
- **影响：** 首次加载慢（2.2MB+2.0MB ≈ 4.2MB）、维护困难、无法做代码分割、浏览器解析卡顿

#### 问题2：无后端服务
- Python `http.server` 仅做静态文件托管
- 所有业务逻辑（排盘计算、AI解读、推送生成）在前端完成
- API密钥暴露在前端代码中（`api.g2claw.com` 的密钥）
- **影响：** 安全隐患极大、无法做服务端验证、无法集中管理用户

#### 问题3：无数据库
- 用户八字、会员信息、推送状态全部存在 localStorage
- localStorage 有 5-10MB 限制，数据量大时会丢失
- 无法跨设备同步、无法做数据分析、无法备份
- **影响：** 用户换设备数据丢失、无法做用户行为分析、无法支持商城交易

#### 问题4：无安全体系
- HTTP明文传输，无HTTPS
- 无用户认证（JWT/Session）
- 无输入验证、无XSS防护、无CSRF防护
- API密钥硬编码在前端JS中
- **影响：** 用户数据泄露风险、API被滥用、易受XSS/CSRF攻击

#### 问题5：无并发能力
- Python `http.server` 是单线程同步模型
- 无负载均衡、无连接池
- 10000并发完全不可能
- **影响：** 超过10个并发用户即可能卡死

#### 问题6：前端架构原始
- 无框架（Vue/React）、无构建工具（Vite/Webpack）
- 无组件化、无状态管理
- DOM操作直接、全局变量泛滥
- **影响：** 代码不可维护、无法做SSR/SSG、无法做PWA离线

---

## 2. 目标架构设计

### 2.1 架构总览

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户层 (Client)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Web前端   │  │ 微信H5    │  │ 管理后台  │  │ 未来APP  │       │
│  │ (Vue3+   │  │ (同源适配) │  │ (React+  │  │ (UniApp) │       │
│  │  Vite)   │  │           │  │  AntD)   │  │          │       │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘  └────┬─────┘       │
└────────┼─────────────┼─────────────┼────────────┼──────────────┘
         │             │             │             │
         ▼             ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CDN层 (静态资源加速)                          │
│  ┌─────────────────────────────────────────────┐               │
│  │ CDN节点 → 静态资源(JS/CSS/图片/字体)         │               │
│  └─────────────────────┬───────────────────────┘               │
└────────────────────────┼────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  负载均衡层 (Nginx/HAProxy)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ SSL终端     │  │ 限流/WAF    │  │ 路由分发     │            │
│  │ (HTTPS)     │  │ (防入侵)    │  │             │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└────────┬──────────────┬──────────────┬─────────────────────────┘
         │              │              │
         ▼              ▼              ▼
┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│  API网关实例1   │ │  API网关实例2   │ │  API网关实例N   │  ← 可水平扩展
│ (FastAPI)      │ │ (FastAPI)      │ │ (FastAPI)      │
│ ┌────────────┐ │ │ ┌────────────┐ │ │ ┌────────────┐ │
│ │ 排盘服务    │ │ │ │ 排盘服务    │ │ │ │ 排盘服务    │ │
│ │ 用户服务    │ │ │ │ 用户服务    │ │ │ │ 用户服务    │ │
│ │ 商城服务    │ │ │ │ 商城服务    │ │ │ │ 商城服务    │ │
│ │ 推送服务    │ │ │ │ 推送服务    │ │ │ │ 推送服务    │ │
│ │ 知识库服务  │ │ │ │ 知识库服务  │ │ │ │ 知识库服务  │ │
│ └────────────┘ │ │ └────────────┘ │ │ └────────────┘ │
└───────┬────────┘ └───────┬────────┘ └───────┬────────┘
        │                  │                  │
        ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      数据层                                      │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐   │
│  │ openGauss │  │  Redis    │  │ MinIO/    │  │ Elastic   │   │
│  │ (主数据库) │  │ (缓存/    │  │ OSS (对象 │  │ search    │   │
│  │            │  │  会话)    │  │  存储)    │  │ (全文搜索) │   │
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘   │
│                                                                 │
│  ┌───────────────────────────────────────────┐                 │
│  │ openGauss 从库 (读写分离 / 异步复制)        │                 │
│  └───────────────────────────────────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 技术选型

| 层级 | 技术 | 版本 | 选型理由 |
|------|------|------|----------|
| **前端框架** | Vue 3 + Composition API | 3.5+ | 学习曲线平缓、中文生态好、性能优秀 |
| **构建工具** | Vite 6 | 6.x | 极速HMR、原生ESM、Vue官方推荐 |
| **UI组件库** | Element Plus | 2.x | Vue3生态成熟组件库、移动端适配 |
| **状态管理** | Pinia | 2.x | Vue3官方推荐、TypeScript友好 |
| **路由** | Vue Router | 4.x | Vue3标配 |
| **后端框架** | Python FastAPI | 0.115+ | 异步高性能、自动文档、类型安全 |
| **ASGI服务器** | Uvicorn + Gunicorn | — | 多worker进程管理、生产级部署 |
| **数据库** | openGauss | 6.0 LTS | 国产开源、高性能、兼容PostgreSQL协议 |
| **缓存** | Redis | 7.x | 会话管理、热数据缓存、限流 |
| **对象存储** | MinIO（自建）/ 阿里云OSS | — | 图片/报告文件存储 |
| **搜索引擎** | Elasticsearch | 8.x | 知识库全文搜索（206万字） |
| **负载均衡** | Nginx | 1.25+ | SSL终端、反向代理、静态资源 |
| **CDN** | 阿里云CDN / 腾讯云CDN | — | 静态资源加速 |
| **容器化** | Docker + Docker Compose | — | 环境一致性、便于部署扩展 |
| **进程管理** | Supervisor / systemd | — | 进程守护、自动重启 |

### 2.3 安全架构

```
安全层次模型：

┌─────────────────────────────────────────────┐
│ L7 应用安全                                  │
│ ├── JWT认证（access_token + refresh_token）  │
│ ├── RBAC权限控制（用户/会员/管理员）          │
│ ├── API限流（IP级 + 用户级）                  │
│ ├── 输入验证（Pydantic Schema）              │
│ └── 敏感数据脱敏（手机号/身份证/生辰）        │
├─────────────────────────────────────────────┤
│ L6 传输安全                                  │
│ ├── HTTPS (TLS 1.3)                         │
│ ├── HSTS 强制HTTPS                           │
│ └── AES-256-GCM 数据加密传输                 │
├─────────────────────────────────────────────┤
│ L5 WAF防火墙                                 │
│ ├── SQL注入防护                              │
│ ├── XSS过滤                                  │
│ ├── CSRF Token                               │
│ ├── 恶意User-Agent拦截                       │
│ └── CC攻击防护                               │
├─────────────────────────────────────────────┤
│ L4 网络安全                                  │
│ ├── 端口最小化开放                           │
│ ├── 防火墙规则（iptables/ufw）               │
│ └── DDoS防护                                 │
├─────────────────────────────────────────────┤
│ L3 数据安全                                  │
│ ├── 数据库加密存储（TDE）                    │
│ ├── 备份加密                                 │
│ ├── 密码bcrypt哈希                           │
│ └── 敏感字段AES加密                          │
└─────────────────────────────────────────────┘
```

### 2.4 数据库设计概览

```sql
-- openGauss 核心表结构（主要表）

-- 用户表
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    uuid VARCHAR(36) UNIQUE NOT NULL,
    phone_encrypted TEXT,           -- AES加密存储
    phone_hash VARCHAR(64),         -- 用于查询的哈希
    nickname VARCHAR(64),
    avatar_url TEXT,
    password_hash VARCHAR(128),
    member_level SMALLINT DEFAULT 0, -- 0=免费 1=常修 2=精进 3=明道
    member_expire TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login_at TIMESTAMP,
    status SMALLINT DEFAULT 1
);

-- 用户生辰信息（加密存储）
CREATE TABLE user_birth_info (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    name_encrypted TEXT,             -- 姓名加密
    gender SMALLINT,
    birth_date_encrypted TEXT,       -- 生辰加密
    birth_place_encrypted TEXT,      -- 出生地加密
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 排盘记录
CREATE TABLE divination_records (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    divination_type VARCHAR(20) NOT NULL, -- bazi/ziwei/qimen/meihua/liuren/liuyao
    input_data JSONB NOT NULL,            -- 输入参数
    result_data JSONB NOT NULL,           -- 排盘结果
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_user_type (user_id, divination_type)
);

-- 会员订单
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    order_no VARCHAR(32) UNIQUE NOT NULL,
    user_id BIGINT REFERENCES users(id),
    product_type VARCHAR(20),     -- membership/physical/virtual
    product_id BIGINT,
    amount DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'pending',
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 商城商品
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    category VARCHAR(32),
    price DECIMAL(10,2),
    image_url TEXT,
    description TEXT,
    stock INT DEFAULT 0,
    status SMALLINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 推送记录
CREATE TABLE push_records (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    push_type VARCHAR(20),       -- daily/forecast/alarm
    content JSONB,
    sent_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending'
);

-- 知识库
CREATE TABLE knowledge_base (
    id BIGSERIAL PRIMARY KEY,
    category VARCHAR(32),        -- 佛/道/儒/密宗/民间/心理
    title VARCHAR(256),
    content TEXT,
    tags TEXT[],
    search_vector tsvector,      -- 全文搜索
    created_at TIMESTAMP DEFAULT NOW()
);

-- 系统日志
CREATE TABLE system_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    action VARCHAR(64),
    ip VARCHAR(45),
    user_agent TEXT,
    params JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 2.5 并发架构设计

```
并发目标：10,000 并发连接

                    ┌─── Uvicorn Worker 1 (4线程) ────┐
                    ├─── Uvicorn Worker 2 (4线程) ────┤
Nginx (负载均衡) ───┼─── Uvicorn Worker 3 (4线程) ────┼── openGauss (连接池)
  (SSL/WAF/限流)    ├─── Uvicorn Worker 4 (4线程) ────┤   (最大连接数 1000)
  ↑ 10,000 conn     ├─── Uvicorn Worker 5 (4线程) ────┤
                    ├─── Uvicorn Worker 6 (4线程) ────┤   Redis (缓存/会话)
                    ├─── Uvicorn Worker 7 (4线程) ────┤   (最大连接数 10000)
                    └─── Uvicorn Worker 8 (4线程) ────┘
                    
                    连接池配置：
                    ├── openGauss: 每worker 20连接 × 8 = 160连接
                    ├── Redis: 每worker 10连接 × 8 = 80连接
                    └── 总并发处理能力: 8 workers × 4 线程 = 32并发请求/秒
                    └── 异步IO下: ~10,000 并发连接（大部分为等待态）

                    扩展策略：
                    ├── 用户达1,000+ → 上云服务器（弹性伸缩）
                    └── 用户达5,000+ → 负载均衡+CDN+多可用区
```

---

## 3. 分阶段执行计划

### 3.1 阶段总览

| 阶段 | 名称 | 周期 | 优先级 | 依赖 |
|------|------|------|--------|------|
| Phase 1 | 数据库部署（openGauss） | 1-2周 | P0 | 无 |
| Phase 2 | 后端API开发（FastAPI） | 3-5周 | P0 | Phase 1 |
| Phase 3 | 前端拆分（模块化） | 3-4周 | P0 | Phase 2 |
| Phase 4 | 安全体系 | 2周 | P0 | Phase 1-3 |
| Phase 5 | 并发/CDN/上云 | 2-3周 | P1 | Phase 1-4 |

### 3.2 甘特图

```
Week:  1  2  3  4  5  6  7  8  9  10  11  12  13  14  15  16
       ├──┤                                              Phase 1: 数据库
          ├─────┤                                        Phase 2: 后端API
                ├─────┤                                  Phase 3: 前端拆分
                      ├──┤                               Phase 4: 安全体系
                         ├───┤                          Phase 5: 并发/CDN
                              ├──┤                       集成测试
                                 ├──┤                    上线准备
```

### 3.3 里程碑

| 里程碑 | 时间 | 交付物 |
|--------|------|--------|
| M1 | 第2周末 | openGauss部署完成、表结构建立、连接池调优 |
| M2 | 第5周末 | 后端API全部上线、Swagger文档完成 |
| M3 | 第8周末 | 前端模块化完成、新旧版本并行运行 |
| M4 | 第10周末 | 安全体系全面覆盖、渗透测试通过 |
| M5 | 第13周末 | 10000并发压测通过、CDN配置完成 |
| M6 | 第14周末 | 正式上线、监控告警就绪 |

---

## 4. 各阶段详细任务

### Phase 1：数据库部署（openGauss）

**目标：** 部署openGauss数据库，完成表结构设计，建立数据迁移方案

#### 任务1.1：openGauss安装部署

```bash
# 环境准备
# - OS: Linux (推荐 openEuler 22.03 / CentOS 7.9+)
# - 内存: 最低8GB，推荐16GB
# - 磁盘: 最低50GB SSD
# - CPU: 最低4核，推荐8核

# 安装步骤（Docker方式）
docker pull opengauss/opengauss:6.0.0-lts
docker run -d \
  --name opengauss \
  -e GS_PASSWORD=<强密码> \
  -e GS_PORT=5432 \
  -v /data/opengauss:/var/lib/opengauss \
  -p 5432:5432 \
  --restart=always \
  opengauss/opengauss:6.0.0-lts
```

#### 任务1.2：数据库配置优化

```properties
# postgresql.conf 关键参数
max_connections = 1000          # 最大连接数
shared_buffers = 4GB            # 共享内存（25%总内存）
effective_cache_size = 12GB     # 有效缓存（75%总内存）
work_mem = 64MB                 # 单查询排序内存
maintenance_work_mem = 512MB    # 维护操作内存
wal_buffers = 16MB              # WAL缓冲
max_wal_size = 2GB              # WAL最大大小
checkpoint_timeout = 10min      # 检查点间隔
random_page_cost = 1.1          # SSD优化
effective_io_concurrency = 200  # SSD并发IO

# 日志配置
log_min_duration_statement = 500ms  # 慢查询日志
log_connections = on
log_disconnections = on
```

#### 任务1.3：表结构创建

按 2.4 节的数据库设计创建全部表结构，包括：
- 用户相关：users, user_birth_info, user_settings
- 业务相关：divination_records, orders, products, push_records
- 知识库：knowledge_base, knowledge_tags
- 系统：system_logs, admin_users, config
- 索引、外键、约束全部建立

#### 任务1.4：数据迁移方案

```python
# 数据迁移脚本框架
# 将现有 localStorage 数据结构映射到数据库

"""
迁移映射：
- localStorage['userBazi']        → user_birth_info + divination_records
- localStorage['memberInfo']      → users (member_level, member_expire)
- localStorage['userFaith']       → user_settings
- localStorage['mlbj_data']       → 按类型拆分到各业务表
- localStorage['annual_forecast_push_state'] → push_records
"""

# 迁移策略：
# 1. 首次登录时，前端检测localStorage旧数据
# 2. 调用 /api/v1/migrate 接口上传
# 3. 后端解析、加密、入库
# 4. 清除localStorage旧数据
# 5. 设置迁移完成标记
```

#### 任务1.5：备份策略

```bash
# 每日全量备份（凌晨3点）
0 3 * * * pg_dump -h localhost -U opengauss -F c -f /backup/opengauss_$(date+\%Y\%m\%d).dump mingli_baojian

# 每小时WAL归档
# 配置 archive_mode = on, archive_command

# 备份保留策略：
# - 日备份保留 7 天
# - 周备份保留 4 周
# - 月备份保留 12 个月
```

**Phase 1 交付物：**
- [x] openGauss 运行正常
- [x] 表结构 SQL 脚本
- [x] 数据库连接池配置
- [x] 备份脚本 + 定时任务
- [x] 数据迁移脚本框架

---

### Phase 2：后端API开发（FastAPI）

**目标：** 构建完整的后端API服务，替代前端纯静态架构

#### 任务2.1：项目初始化

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI入口
│   ├── config.py               # 配置管理
│   ├── database.py             # 数据库连接池
│   ├── redis_client.py         # Redis连接
│   ├── dependencies.py         # 依赖注入
│   ├── middleware/
│   │   ├── auth.py             # JWT认证中间件
│   │   ├── rate_limit.py       # 限流中间件
│   │   ├── security.py         # 安全头/CSRF
│   │   └── logging.py          # 请求日志
│   ├── models/                 # SQLAlchemy ORM模型
│   │   ├── user.py
│   │   ├── divination.py
│   │   ├── order.py
│   │   ├── product.py
│   │   ├── knowledge.py
│   │   └── push.py
│   ├── schemas/                # Pydantic模型
│   │   ├── user.py
│   │   ├── divination.py
│   │   └── ...
│   ├── routers/                # API路由
│   │   ├── auth.py             # /api/v1/auth
│   │   ├── user.py             # /api/v1/user
│   │   ├── divination.py       # /api/v1/divination
│   │   ├── knowledge.py        # /api/v1/knowledge
│   │   ├── shop.py             # /api/v1/shop
│   │   ├── push.py             # /api/v1/push
│   │   ├── upload.py           # /api/v1/upload
│   │   ├── migrate.py          # /api/v1/migrate
│   │   └── admin.py            # /api/v1/admin
│   ├── services/               # 业务逻辑层
│   │   ├── divination_engine.py  # 排盘引擎（从JS迁移）
│   │   ├── bazi_engine.py
│   │   ├── ziwei_engine.py
│   │   ├── qimen_engine.py
│   │   ├── meihua_engine.py
│   │   ├── liuren_engine.py
│   │   ├── liuyao_engine.py
│   │   ├── ai_interpreter.py     # AI解读服务
│   │   ├── push_service.py       # 推送服务
│   │   └── payment_service.py    # 支付服务
│   └── utils/
│       ├── crypto.py            # 加密工具
│       ├── jwt_helper.py        # JWT工具
│       ├── validators.py        # 输入验证
│       └── exceptions.py        # 自定义异常
├── alembic/                     # 数据库迁移
├── tests/                       # 测试
├── requirements.txt
├── Dockerfile
└── docker-compose.yml
```

#### 任务2.2：核心API端点设计

```python
# 认证模块
POST   /api/v1/auth/register          # 注册（手机号+验证码）
POST   /api/v1/auth/login             # 登录
POST   /api/v1/auth/refresh           # 刷新token
POST   /api/v1/auth/logout            # 登出
GET    /api/v1/auth/me                # 当前用户信息

# 用户模块
GET    /api/v1/user/profile           # 获取资料
PUT    /api/v1/user/profile           # 更新资料
GET    /api/v1/user/birth-info        # 生辰信息列表
POST   /api/v1/user/birth-info        # 添加生辰信息
PUT    /api/v1/user/birth-info/{id}   # 更新生辰
DELETE /api/v1/user/birth-info/{id}   # 删除生辰
GET    /api/v1/user/settings          # 用户设置
PUT    /api/v1/user/settings          # 更新设置
GET    /api/v1/user/membership        # 会员状态
POST   /api/v1/user/membership/order  # 创建会员订单

# 排盘模块
POST   /api/v1/divination/bazi        # 八字排盘
POST   /api/v1/divination/ziwei       # 紫微斗数
POST   /api/v1/divination/qimen       # 奇门遁甲
POST   /api/v1/divination/meihua      # 梅花易数
POST   /api/v1/divination/liuren      # 大六壬
POST   /api/v1/divination/liuyao      # 六爻占卜
POST   /api/v1/divination/xingming    # 姓名分析
POST   /api/v1/divination/zeri        # 择日
POST   /api/v1/divination/fengshui    # 风水分析
GET    /api/v1/divination/history     # 历史记录
GET    /api/v1/divination/{id}        # 单条记录详情
POST   /api/v1/divination/{id}/ai     # AI解读

# 知识库模块
GET    /api/v1/knowledge/list         # 知识列表
GET    /api/v1/knowledge/{id}         # 知识详情
GET    /api/v1/knowledge/search       # 全文搜索
GET    /api/v1/knowledge/daily        # 每日推送内容

# 商城模块
GET    /api/v1/shop/products          # 商品列表
GET    /api/v1/shop/products/{id}     # 商品详情
POST   /api/v1/shop/orders            # 创建订单
GET    /api/v1/shop/orders            # 订单列表
POST   /api/v1/shop/orders/{id}/pay   # 支付订单

# 推送模块
GET    /api/v1/push/today             # 今日推送
GET    /api/v1/push/history           # 推送历史
POST   /api/v1/push/settings          # 推送设置

# 管理后台
GET    /api/v1/admin/dashboard        # 数据概览
GET    /api/v1/admin/users            # 用户管理
GET    /api/v1/admin/orders           # 订单管理
CRUD   /api/v1/admin/products         # 商品管理
GET    /api/v1/admin/logs             # 系统日志

# 数据迁移
POST   /api/v1/migrate                # localStorage数据迁移
```

#### 任务2.3：排盘引擎迁移

**策略：将 divination-core.js 中的核心计算逻辑迁移为 Python 模块**

```python
# 迁移映射表：
# JS函数                          → Python模块
# computeBazi()                   → bazi_engine.py: BaziEngine.compute()
# computeZiWei()                  → ziwei_engine.py: ZiweiEngine.compute()
# computeQimen()                  → qimen_engine.py: QimenEngine.compute()
# computeMeiHua()                 → meihua_engine.py: MeihuaEngine.compute()
# computeLiuRen()                 → liuren_engine.py: LiurenEngine.compute()
# yjStart()                       → liuyao_engine.py: LiuyaoEngine.start()
# analyzeName()                   → xingming_engine.py: XingmingEngine.analyze()
# getNayin()                      → bazi_engine.py: get_nayin()
# 天干地支/六十甲子常量             → constants.py

# 迁移原则：
# 1. 纯计算逻辑直接翻译（排盘算法）
# 2. DOM操作逻辑不迁移（前端重写）
# 3. localStorage操作替换为数据库操作
# 4. fetch API调用迁移到服务层
# 5. 保留原JS版本作为参考和对照测试
```

#### 任务2.4：AI解读服务封装

```python
# services/ai_interpreter.py
# 将前端硬编码的API密钥迁移到后端环境变量

class AIInterpreter:
    def __init__(self):
        self.api_base = os.getenv("AI_API_BASE")
        self.api_key = os.getenv("AI_API_KEY")  # 不再暴露到前端
        self.model = os.getenv("AI_MODEL", "glm-4")
    
    async def interpret(self, divination_type: str, result: dict, 
                        user_info: dict) -> dict:
        # 构建提示词、调用AI、返回解读
        pass
```

#### 任务2.5：Redis缓存层

```python
# 缓存策略：
# - 排盘结果缓存：相同输入参数的结果缓存1小时
# - 知识库内容缓存：24小时TTL
# - 用户会话：JWT refresh_token 存Redis，30天TTL
# - 限流计数：滑动窗口限流
# - 每日推送内容：缓存到当天23:59

# Redis Key 命名规范：
# divination:{type}:{hash}     # 排盘结果
# knowledge:{category}:{id}    # 知识库
# session:{user_id}            # 用户会话
# rate_limit:{ip}:{endpoint}   # 限流
# push:daily:{date}            # 每日推送
```

**Phase 2 交付物：**
- [x] FastAPI 项目骨架
- [x] 全部 API 端点 + Swagger 文档
- [x] 排盘引擎 Python 版本（对照测试通过）
- [x] Redis 缓存层
- [x] 数据库 ORM 模型
- [x] 单元测试覆盖率 > 70%

---

### Phase 3：前端拆分（模块化）

**目标：** 将2.2MB单体HTML拆分为Vue3模块化应用

#### 任务3.1：Vue3项目初始化

```
frontend/
├── public/
│   ├── manifest.json
│   └── icons/
├── src/
│   ├── main.ts
│   ├── App.vue
│   ├── router/
│   │   └── index.ts
│   ├── stores/                    # Pinia状态管理
│   │   ├── user.ts                # 用户状态
│   │   ├── divination.ts          # 排盘状态
│   │   ├── cart.ts                # 购物车
│   │   └── settings.ts            # 设置
│   ├── views/                     # 页面
│   │   ├── Home.vue               # 首页（替代 divination-hub.html）
│   │   ├── bazi/                  # 八字模块
│   │   │   ├── BaziChart.vue
│   │   │   ├── BaziAnalysis.vue
│   │   │   └── BaziReport.vue
│   │   ├── ziwei/                 # 紫微斗数
│   │   ├── qimen/                 # 奇门遁甲
│   │   ├── meihua/                # 梅花易数
│   │   ├── liuren/                # 大六壬
│   │   ├── liuyao/                # 六爻占卜
│   │   ├── xingming/              # 姓名分析
│   │   ├── zeri/                  # 择日
│   │   ├── fengshui/              # 风水
│   │   ├── shop/                  # 商城
│   │   ├── knowledge/             # 知识库
│   │   ├── membership/            # 会员
│   │   ├── admin/                 # 管理后台
│   │   └── user/                  # 用户中心
│   ├── components/                # 公共组件
│   │   ├── layout/
│   │   │   ├── AppHeader.vue
│   │   │   ├── AppNav.vue
│   │   │   └── AppFooter.vue
│   │   ├── divination/
│   │   │   ├── ChartCard.vue      # 排盘卡片
│   │   │   ├── ResultPanel.vue    # 结果面板
│   │   │   └── FiveElementsBar.vue # 五行条
│   │   ├── common/
│   │   │   ├── DatePicker.vue
│   │   │   ├── LoadingSpinner.vue
│   │   │   └── ErrorBoundary.vue
│   │   └── ui/
│   ├── composables/               # 组合式函数
│   │   ├── useAuth.ts
│   │   ├── useDivination.ts
│   │   └── useApi.ts
│   ├── api/                       # API调用层
│   │   ├── client.ts              # Axios实例
│   │   ├── auth.ts
│   │   ├── divination.ts
│   │   ├── shop.ts
│   │   └── knowledge.ts
│   ├── styles/                    # 全局样式
│   │   ├── variables.scss         # CSS变量（迁移现有 :root）
│   │   ├── reset.scss
│   │   └── theme.scss
│   ├── utils/                     # 工具函数
│   │   ├── crypto.ts              # 前端加密
│   │   ├── format.ts              # 格式化
│   │   └── storage.ts             # 本地存储封装
│   └── assets/
├── vite.config.ts
├── tsconfig.json
└── package.json
```

#### 任务3.2：divination-hub.html 拆分映射

```
原HTML区块                          → Vue组件/页面
═══════════════════════════════════════════════════
<nav class="top-nav">               → components/layout/AppHeader.vue
<div class="file-nav-bar">          → components/layout/AppNav.vue
<section class="hero">              → views/Home.vue (HeroSection)
<div class="cat-grid">              → views/Home.vue (CategoryGrid)
Tab: 八字                           → views/bazi/BaziChart.vue
Tab: 紫微                           → views/ziwei/ZiweiChart.vue
Tab: 奇门                           → views/qimen/QimenChart.vue
Tab: 梅花                           → views/meihua/MeihuaChart.vue
Tab: 六壬                           → views/liuren/LiurenChart.vue
Tab: 六爻                           → views/liuyao/LiuyaoChart.vue
Tab: 姓名                           → views/xingming/XingmingForm.vue
Tab: 择日                           → views/zeri/ZeriForm.vue
Tab: 风水                           → views/fengshui/FengshuiView.vue
商城区域                             → views/shop/ShopList.vue
知识库区域                            → views/knowledge/KnowledgeView.vue
会员区域                              → views/membership/MembershipView.vue
管理后台                             → views/admin/AdminDashboard.vue
```

#### 任务3.3：divination-core.js 拆分映射

```
原JS函数块                           → Vue Composable / API调用
═══════════════════════════════════════════════════
排盘计算函数                          → 后端API (Phase 2已迁移)
DOM操作函数                           → Vue组件方法
localStorage操作                     → Pinia store + API调用
fetch(g2claw API)                   → api/divination.ts → 后端API
exportWord()                        → utils/export.ts
playDivinationSound()               → composables/useSound.ts
全局变量                             → Pinia store
事件监听                              → Vue事件系统
```

#### 任务3.4：CSS拆分

```scss
// 从 divination-hub.html 内联 <style> 提取
// 2.2MB HTML 中约 500KB 是 CSS

// styles/variables.scss — 迁移 :root 变量
// styles/reset.scss — 迁移 *{margin:0;padding:0} 等
// styles/animations.scss — 迁移 @keyframes
// styles/layout.scss — 迁移 .top-nav .main .hero 等
// styles/components.scss — 迁移 .cat-card .nav-tab 等

// 各组件 scoped style — 迁移组件级样式
```

#### 任务3.5：路由设计

```typescript
// router/index.ts
const routes = [
  { path: '/', component: Home },
  { path: '/bazi', component: BaziChart },
  { path: '/bazi/report/:id', component: BaziReport },
  { path: '/ziwei', component: ZiweiChart },
  { path: '/qimen', component: QimenChart },
  { path: '/meihua', component: MeihuaChart },
  { path: '/liuren', component: LiurenChart },
  { path: '/liuyao', component: LiuyaoChart },
  { path: '/xingming', component: XingmingForm },
  { path: '/zeri', component: ZeriForm },
  { path: '/fengshui', component: FengshuiView },
  { path: '/shop', component: ShopList },
  { path: '/shop/:id', component: ShopDetail },
  { path: '/knowledge', component: KnowledgeView },
  { path: '/knowledge/:id', component: KnowledgeDetail },
  { path: '/membership', component: MembershipView },
  { path: '/user', component: UserProfile },
  { path: '/user/settings', component: UserSettings },
  { path: '/admin', component: AdminDashboard, meta: { requiresAdmin: true } },
  // ... 其他路由
]
```

#### 任务3.6：代码分割与懒加载

```typescript
// 路由懒加载 — 每个排盘模块独立chunk
const BaziChart = () => import('@/views/bazi/BaziChart.vue')
const ZiweiChart = () => import('@/views/ziwei/ZiweiChart.vue')
// ...

// Vite构建配置
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-vue': ['vue', 'vue-router', 'pinia'],
          'vendor-ui': ['element-plus'],
          'divination-bazi': ['./src/views/bazi/'],
          'divination-ziwei': ['./src/views/ziwei/'],
          // ...
        }
      }
    },
    chunkSizeWarningLimit: 500, // 每个chunk ≤ 500KB
  }
})

// 预期效果：
// 首屏加载：vendor-vue(150KB) + home(200KB) ≈ 350KB (gzip后~120KB)
// 切换排盘模块：按需加载对应chunk ~50-100KB
// 总加载量：从 4.2MB → 首屏 350KB（减少92%）
```

#### 任务3.7：PWA支持

```typescript
// vite-plugin-pwa 配置
// - 离线缓存核心页面
// - App安装提示
// - 推送通知（配合后端推送服务）
// - 后台同步
```

**Phase 3 交付物：**
- [x] Vue3 项目骨架 + 路由
- [x] 全部页面组件（对照原HTML功能）
- [x] Pinia 状态管理
- [x] API 调用层
- [x] 样式迁移完成
- [x] 代码分割（首屏 < 400KB）
- [x] PWA 配置
- [x] 新旧版本并行运行验证

---

### Phase 4：安全体系

**目标：** 建立完整的安全防护体系，保护用户数据和服务稳定

#### 任务4.1：HTTPS部署

```nginx
# Nginx SSL配置
server {
    listen 443 ssl http2;
    server_name api.mingli-baojian.com;

    ssl_certificate /etc/ssl/certs/mingli.crt;
    ssl_certificate_key /etc/ssl/private/mingli.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    
    # 安全头
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.g2claw.com;" always;
}

# HTTP → HTTPS 重定向
server {
    listen 80;
    server_name api.mingli-baojian.com;
    return 301 https://$server_name$request_uri;
}
```

#### 任务4.2：JWT认证体系

```python
# 双Token策略
# access_token: 2小时过期，存内存/localStorage
# refresh_token: 30天过期，存Redis（可撤销）

# 认证流程：
# 1. 登录 → 返回 access_token + refresh_token
# 2. 请求 → Authorization: Bearer <access_token>
# 3. access_token过期 → 用refresh_token换新
# 4. 登出 → 撤销refresh_token

# 安全措施：
# - JWT签名算法: HS256
# - 密钥: 32字节随机字符串，环境变量存储
# - Payload: user_id + role + exp + iat + jti
# - 不存储敏感信息（密码/手机号）在JWT中
```

#### 任务4.3：数据加密与脱敏

```python
# 敏感数据加密方案

class CryptoService:
    """AES-256-GCM 加密服务"""
    
    KEY = os.getenv("DATA_ENCRYPTION_KEY")  # 32字节密钥
    
    @classmethod
    def encrypt(cls, plaintext: str) -> str:
        """加密敏感数据（手机号/身份证/生辰/姓名）"""
        iv = os.urandom(12)
        cipher = AES.new(cls.KEY, AES.MODE_GCM, iv)
        ciphertext, tag = cipher.encrypt_and_digest(plaintext.encode())
        return base64.b64encode(iv + tag + ciphertext).decode()
    
    @classmethod
    def decrypt(cls, encrypted: str) -> str:
        """解密"""
        data = base64.b64decode(encrypted)
        iv, tag, ciphertext = data[:12], data[12:28], data[28:]
        cipher = AES.new(cls.KEY, AES.MODE_GCM, iv)
        return cipher.decrypt_and_verify(ciphertext, tag).decode()


# 脱敏规则
DESENSITIZE_RULES = {
    'phone': lambda x: x[:3] + '****' + x[-4:],      # 138****8888
    'id_card': lambda x: x[:6] + '********' + x[-4:],  # 110101********1234
    'name': lambda x: x[0] + '*' * (len(x) - 1),       # 张**
    'birth_date': lambda x: x[:4] + '-**-**',          # 1990-**-**
    'birth_place': lambda x: x[:2] + '***',            # 北京***
}

# API响应自动脱敏
# 使用FastAPI中间件，对响应中的敏感字段自动脱敏
# 只有用户自己查看完整信息时才解密返回
```

#### 任务4.4：WAF / 防入侵

```nginx
# Nginx WAF 规则

# 1. SQL注入防护
location /api/ {
    # 拦截SQL关键词
    if ($query_string ~* "union.*select|insert.*into|delete.*from|drop.*table|exec|execute") {
        return 403;
    }
    
    # 2. XSS防护
    if ($query_string ~* "<script|javascript:|onerror=|onload=|onclick=") {
        return 403;
    }
    
    # 3. 路径遍历
    if ($query_string ~* "\.\./|\.\.\\") {
        return 403;
    }
    
    # 4. 命令注入
    if ($query_string ~* ";\s*(cat|ls|rm|wget|curl|bash|sh|python)") {
        return 403;
    }
}

# 5. 限流
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;     # 每IP每秒10请求
limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;    # 登录每秒1次

location /api/v1/auth/login {
    limit_req zone=login burst=5 nodelay;
}

location /api/ {
    limit_req zone=api burst=20 nodelay;
}

# 6. 恶意User-Agent拦截
if ($http_user_agent ~* "(sqlmap|nikto|nmap|masscan|dirb|gobuster|wpscan|hydra|metasploit)") {
    return 403;
}

# 7. 文件上传限制
location /api/v1/upload {
    client_max_body_size 5M;
    # 仅允许图片类型
    if ($content_type !~* "image/") {
        return 415;
    }
}
```

#### 任务4.5：API安全

```python
# FastAPI 安全中间件

# 1. CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://mingli-baojian.com", "https://www.mingli-baojian.com"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

# 2. CSRF 防护（针对非API请求）
# 双提交Cookie模式
# 1. 登录时设置 csrf_token Cookie
# 2. 前端读取Cookie，在header中携带 X-CSRF-Token
# 3. 后端验证两者一致

# 3. 请求体大小限制
app.add_middleware(RequestSizeLimit, max_size=5 * 1024 * 1024)  # 5MB

# 4. 请求频率限制
# IP级: 100请求/分钟
# 用户级: 200请求/分钟
# 排盘接口: 10次/小时（免费用户）, 50次/小时（会员）

# 5. 输入验证（Pydantic）
class BaziInput(BaseModel):
    name: str = Field(..., min_length=1, max_length=32)
    gender: Literal["male", "female"]
    year: int = Field(..., ge=1900, le=2100)
    month: int = Field(..., ge=1, le=12)
    day: int = Field(..., ge=1, le=31)
    hour: int = Field(..., ge=0, le=23)
    
    @validator('day')
    def validate_day(cls, v, values):
        # 验证日期合法性
        ...

# 6. SQL注入防护
# 使用SQLAlchemy ORM，所有查询参数化
# 禁止原始SQL拼接

# 7. API密钥管理
# 所有密钥存储在环境变量中，不硬编码
# 使用 .env 文件 + python-dotenv
```

**Phase 4 交付物：**
- [x] HTTPS 证书部署
- [x] JWT 认证流程
- [x] AES 加密/脱敏服务
- [x] WAF 规则配置
- [x] CORS / CSRF 防护
- [x] 限流策略
- [x] 安全测试报告（渗透测试）

---

### Phase 5：并发 / CDN / 上云

**目标：** 支持10,000并发，CDN加速，云服务器部署

#### 任务5.1：Uvicorn + Gunicorn 部署

```bash
# Gunicorn 配置 (gunicorn.conf.py)
import multiprocessing

bind = "127.0.0.1:8000"
workers = multiprocessing.cpu_count() * 2  # 8核 → 16 workers
worker_class = "uvicorn.workers.UvicornWorker"
worker_connections = 1000
max_requests = 10000          # 每worker处理10000请求后重启（防内存泄漏）
max_requests_jitter = 1000
timeout = 30
keepalive = 5
preload_app = True

# 启动命令
# gunicorn -c gunicorn.conf.py app.main:app
```

#### 任务5.2：Nginx 负载均衡

```nginx
# 多实例负载均衡
upstream backend {
    least_connections;  # 最少连接策略
    
    server 127.0.0.1:8000 weight=1 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:8001 weight=1 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:8002 weight=1 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:8003 weight=1 max_fails=3 fail_timeout=30s;
    
    keepalive 32;  # 保持连接池
}

# 健康检查
location /health {
    proxy_pass http://backend/health;
    health_check interval=5s fails=3 passes=2;
}

# API 反向代理
location /api/ {
    proxy_pass http://backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # WebSocket支持（未来实时推送）
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    
    # 超时
    proxy_connect_timeout 5s;
    proxy_send_timeout 30s;
    proxy_read_timeout 30s;
}

# 静态文件直接Nginx处理
location /static/ {
    alias /app/frontend/dist/;
    expires 30d;
    add_header Cache-Control "public, immutable";
    # 文件指纹命名，长期缓存
}

# 前端路由
location / {
    root /app/frontend/dist;
    try_files $uri $uri/ /index.html;  # SPA history模式
}
```

#### 任务5.3：CDN配置

```
CDN加速对象：
├── JS/CSS 文件（带文件指纹，长期缓存）
├── 图片资源（商品图片、用户头像）
├── 字体文件（Noto Serif SC 等）
├── HTML页面（首页等静态页面）
└── 知识库静态内容

CDN配置：
├── 源站：Nginx服务器
├── 回源协议：HTTPS
├── 缓存规则：
│   ├── JS/CSS/字体：30天（immutable）
│   ├── 图片：7天
│   ├── HTML：5分钟
│   └── API响应：不缓存
├── 压缩：Gzip + Brotli
├── HTTPS：CDN节点SSL证书
└── 防护：DDoS基础防护、CC防护

DNS配置：
├── mingli-baojian.com → CDN
├── api.mingli-baojian.com → 源站（不经过CDN）
└── static.mingli-baojian.com → CDN（纯静态资源）
```

#### 任务5.4：监控告警

```yaml
# 监控体系
监控维度：
├── 系统层：CPU/内存/磁盘/网络
├── 服务层：QPS/响应时间/错误率/连接数
├── 数据库：连接数/慢查询/复制延迟/锁等待
├── Redis：内存使用/命中率/连接数
├── Nginx：请求量/4xx/5xx/上下游响应时间
└── 业务层：排盘次数/注册数/订单数/推送成功率

工具选型：
├── Prometheus + Grafana（指标监控）
├── ELK Stack（日志收集）
├── Sentry（错误追踪）
└── 阿里云云监控（基础设施监控）

告警规则：
├── CPU > 80% 持续5分钟 → 告警
├── 内存 > 85% 持续5分钟 → 告警
├── 5xx错误率 > 1% 持续1分钟 → 告警
├── 数据库连接数 > 800 → 告警
├── Redis内存 > 80% → 告警
└── API响应时间 P95 > 2s 持续5分钟 → 告警
```

#### 任务5.5：用户规模扩容路线图

```
用户量阶段          告警动作                    架构调整
═══════════════════════════════════════════════════════
0 - 1,000 用户     当前架构可承载              单机部署
                   ⚠️ 1,000用户时提醒上云       

1,000 - 5,000      📦 上云服务器                云服务器部署
                   - 阿里云ECS 4核8G          openGauss云版
                   - openGauss云版            Redis云版
                   - Redis云版                对象存储OSS
                   - 对象存储OSS              

5,000 - 10,000     ⚠️ 5,000用户时提醒           负载均衡+CDN
                   负载均衡+CDN               - SLB负载均衡
                   - 阿里云SLB                - CDN全站加速
                   - CDN全站加速              - 2-3台应用服务器
                   - 2-3台ECS应用服务器       - openGauss主从
                   - openGauss主从            - Redis集群

10,000+            🚀 弹性伸缩                 K8s容器化
                   - ACK Kubernetes           - 自动扩缩容
                   - 自动扩缩容                - 读写分离
                   - 读写分离                  - 分库分表（按需）
                   - 多可用区部署
```

#### 任务5.6：Docker容器化

```dockerfile
# Dockerfile - FastAPI后端
FROM python:3.12-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["gunicorn", "-c", "gunicorn.conf.py", "app.main:app"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  opengauss:
    image: opengauss/opengauss:6.0.0-lts
    environment:
      GS_PASSWORD: ${DB_PASSWORD}
    volumes:
      - opengauss_data:/var/lib/opengauss
    ports:
      - "5432:5432"
      
  redis:
    image: redis:7-alpine
    command: redis-server --maxmemory 512mb --maxmemory-policy allkeys-lru
    ports:
      - "6379:6379"
      
  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://opengauss:${DB_PASSWORD}@opengauss:5432/mingli_baojian
      REDIS_URL: redis://redis:6379/0
    depends_on:
      - opengauss
      - redis
    ports:
      - "8000:8000"
      
  nginx:
    image: nginx:1.25-alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./frontend/dist:/usr/share/nginx/html
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
    ports:
      - "80:80"
      - "443:443"

volumes:
  opengauss_data:
```

**Phase 5 交付物：**
- [x] Docker 容器化部署
- [x] Nginx 负载均衡配置
- [x] CDN 配置完成
- [x] 监控告警系统
- [x] 10,000 并发压测报告
- [x] 用户扩容路线图文档

---

## 5. 风险评估

### 5.1 技术风险

| 风险项 | 概率 | 影响 | 风险等级 | 缓解措施 |
|--------|------|------|----------|----------|
| 排盘引擎JS→Python迁移出现计算差异 | 中 | 高 | 🔴 高 | 1. 保留原JS版本做对照测试 2. 建立测试用例库 3. 逐步迁移、逐个验证 |
| openGauss兼容性问题 | 低 | 中 | 🟡 中 | 1. 先在测试环境验证 2. 兼容PostgreSQL协议，可用PG做备选 |
| 前端Vue3重写周期长 | 中 | 中 | 🟡 中 | 1. 新旧并行运行 2. 按模块逐步切换 3. 优先核心模块 |
| 大文件拆分遗漏功能 | 高 | 中 | 🟡 中 | 1. 功能清单对照表 2. 自动化测试覆盖 3. 用户验收测试 |
| 10,000并发压测不达标 | 低 | 高 | 🟡 中 | 1. 分阶段压测 2. 异步优化 3. 水平扩展能力预留 |

### 5.2 业务风险

| 风险项 | 概率 | 影响 | 风险等级 | 缓解措施 |
|--------|------|------|----------|----------|
| 升级期间服务中断 | 中 | 高 | 🔴 高 | 1. 新旧并行运行 2. 灰度切换 3. 选择低峰期切换 |
| 用户数据迁移丢失 | 低 | 极高 | 🔴 高 | 1. localStorage数据不删除 2. 迁移后验证 3. 保留回退能力 |
| 用户体验下降 | 中 | 中 | 🟡 中 | 1. 充分测试 2. 灰度发布 3. 用户反馈渠道 |
| 升级成本超预期 | 中 | 中 | 🟡 中 | 1. 分阶段投入 2. 优先核心功能 3. 开源方案优先 |

### 5.3 安全风险

| 风险项 | 概率 | 影响 | 风险等级 | 缓解措施 |
|--------|------|------|----------|----------|
| API密钥泄露（现有） | 高 | 高 | 🔴 高 | Phase 2 首要任务：迁移到后端环境变量 |
| 过渡期安全真空 | 中 | 高 | 🔴 高 | 1. Phase 4 与 Phase 2-3 同步进行 2. 优先部署HTTPS和WAF |
| DDoS攻击 | 低 | 高 | 🟡 中 | 1. CDN基础防护 2. 云服务器DDoS防护 3. 限流策略 |
| 数据库注入 | 低 | 极高 | 🟡 中 | 1. ORM参数化查询 2. WAF规则 3. 最小权限原则 |

---

## 6. 回退方案

### 6.1 回退原则

- **每个阶段独立可回退**：任何阶段出现问题，可回退到上一阶段状态
- **数据不丢失**：回退不影响用户数据，localStorage数据在确认新系统稳定前不删除
- **快速回退**：回退操作在30分钟内完成

### 6.2 各阶段回退方案

#### Phase 1 回退（数据库）
```
触发条件：openGauss部署失败/性能不达标
回退操作：
1. 数据库数据导出保留
2. 停止openGauss容器
3. 前端继续使用localStorage（无影响）
4. 排查问题后重新部署
回退时间：< 10分钟
```

#### Phase 2 回退（后端API）
```
触发条件：API服务异常/排盘结果错误
回退操作：
1. Nginx切换到纯静态文件服务模式
2. 前端切换回 localStorage 模式（保留降级开关）
3. 后端服务停止
4. 排查问题后重新上线
回退时间：< 15分钟

关键设计：
- 前端保留 localStorage 降级模式（feature flag控制）
- API调用失败时自动降级到本地计算（需保留JS版排盘引擎）
```

#### Phase 3 回退（前端拆分）
```
触发条件：Vue新版本功能缺失/体验问题
回退操作：
1. Nginx切换到旧版 divination-hub.html 静态服务
2. 新版Vue应用保留但不对外服务
3. 用户访问旧版无感知
回退时间：< 5分钟

关键设计：
- 旧版HTML文件永久保留
- Nginx配置保留旧版server block
- DNS/路由切换即可回退
```

#### Phase 4 回退（安全体系）
```
触发条件：安全配置导致正常请求被拦截
回退操作：
1. 临时放宽WAF规则（仅保留基础防护）
2. 关闭 problematic 的安全中间件
3. 保留HTTPS（不可回退到HTTP）
回退时间：< 10分钟
```

#### Phase 5 回退（并发/CDN）
```
触发条件：负载均衡异常/CDN故障
回退操作：
1. CDN回源到Nginx直连
2. 负载均衡切换为单实例
3. 保留至少一台稳定实例
回退时间：< 20分钟
```

### 6.3 数据备份回退

```
数据备份策略：
├── 实时备份：openGauss WAL归档（可恢复到任意时间点）
├── 每日全量：pg_dump + 对象存储上传
├── Redis快照：每6小时RDB快照
└── 前端localStorage：迁移后保留只读副本（不主动清除）

数据恢复流程：
1. 确定恢复时间点
2. 从备份恢复数据库
3. 恢复Redis快照
4. 前端localStorage数据不受影响
5. 验证数据完整性
6. 恢复服务
```

---

## 7. 附录

### 7.1 现有文件清单（需迁移）

**核心文件（必须迁移）：**
| 文件 | 大小 | 迁移目标 |
|------|------|----------|
| app/divination-hub.html | 2.2MB | → Vue3 组件拆分 |
| app/js/divination-core.js | 2.0MB | → Python引擎 + Vue组件 |
| app/css/divination-hub.css | — | → SCSS模块化 |
| app/js/calc-engine-lib.js | 146KB | → Python排盘引擎 |
| app/js/guide-features.js | 415KB | → Vue组件 + API |
| app/js/cezi-database.js | 215KB | → 数据库/JSON配置 |
| app/js/tizhi-module.js | 65KB | → Python体质模块 |
| app/js/ai-interpreter.js | 36KB | → Python AI服务 |
| app/js/shop-module.js | 25KB | → Vue商城组件 |
| app/js/shop-admin.js | 26KB | → Vue管理后台 |
| app/js/merchant.js | 15KB | → Vue商家后台 |
| app/js/feedback.js | 11KB | → Vue反馈组件 |
| app/js/hetu-luoshu.js | 21KB | → Python河图洛书模块 |
| app/js/liuren-interp.js | 17KB | → Python六壬解读 |
| app/js/liuren-upgrade.js | 16KB | → Python六壬增强 |
| app/js/lp-upgrade.js | 62KB | → Python人生规划 |
| app/js/heige-integration.js | 17KB | → Python黑格整合 |
| app/js/shop-category.js | 10KB | → Vue分类组件 |
| app/divination-knowledge.html | 423KB | → Vue知识库页面 |
| app/divination-shop.html | 103KB | → Vue商城页面 |
| app/divination-almanac.html | 99KB | → Vue黄历页面 |
| app/admin.html | 101KB | → Vue管理后台 |
| app/wechat-hub.html | 104KB | → Vue微信入口 |
| app/divination-membership.html | 63KB | → Vue会员页面 |

**需清理的文件：**
- 所有 `.bak` / `.backup` / `.bak.*` 文件（约20+个）
- 所有 `patch_*.py` / `expand_*.js` / `self_check*.js` 临时脚本
- `_archive/` 和 `_archived/` 目录
- 多个 `.new` / `.new2` / `.restored` 临时文件

### 7.2 环境变量清单

```env
# .env 文件模板

# 数据库
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mingli_baojian
DB_USER=opengauss
DB_PASSWORD=<强密码>

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT
JWT_SECRET=<32字节随机字符串>
JWT_ACCESS_EXPIRE=7200        # 2小时（秒）
JWT_REFRESH_EXPIRE=2592000    # 30天（秒）

# 数据加密
DATA_ENCRYPTION_KEY=<32字节随机字符串>

# AI服务
AI_API_BASE=https://api.g2claw.com
AI_API_KEY=<API密钥>
AI_MODEL=glm-4

# 对象存储
OSS_ACCESS_KEY=<access_key>
OSS_SECRET_KEY=<secret_key>
OSS_BUCKET=mingli-baojian
OSS_ENDPOINT=oss-cn-beijing.aliyuncs.com

# CDN
CDN_DOMAIN=static.mingli-baojian.com

# 其他
APP_ENV=production
APP_DEBUG=false
CORS_ORIGINS=https://mingli-baojian.com,https://www.mingli-baojian.com
```

### 7.3 性能指标目标

| 指标 | 当前 | 目标 |
|------|------|------|
| 首屏加载 | ~4.2MB / 5-10秒 | < 400KB / < 1.5秒 |
| API响应 P50 | N/A | < 100ms |
| API响应 P95 | N/A | < 500ms |
| 排盘计算 | 前端2-5秒 | 后端 < 200ms |
| 并发支持 | ~10 | 10,000 |
| 数据存储 | 5-10MB (localStorage) | 无限 (数据库) |
| 跨设备同步 | 不支持 | 支持 |
| 安全等级 | 无 | HTTPS + JWT + AES + WAF |

### 7.4 测试计划

```
测试阶段：
├── 单元测试
│   ├── 后端：pytest（覆盖率 > 70%）
│   ├── 前端：Vitest（覆盖率 > 60%）
│   └── 排盘引擎：对照测试（JS vs Python 结果一致性）
│
├── 集成测试
│   ├── API集成测试
│   ├── 前后端联调
│   └── 数据库交互
│
├── 性能测试
│   ├── 并发压测：locust / wrk
│   ├── 目标：10,000并发连接
│   ├── 排盘接口：500 QPS
│   └── 页面加载：P95 < 2秒
│
├── 安全测试
│   ├── OWASP Top 10
│   ├── 渗透测试
│   ├── SQL注入测试
│   └── XSS/CSRF测试
│
└── 用户验收测试
    ├── 功能完整性验证
    ├── 旧功能对照
    └── 用户体验评估
```

---

## 文档信息

| 项目 | 内容 |
|------|------|
| 文档版本 | v1.0 |
| 创建日期 | 2026-07-03 |
| 最后更新 | 2026-07-03 |
| 编制人 | AutoClaw |
| 审核状态 | 待审核 |
| 下一步 | 用户确认后启动 Phase 1 |

---

> **注：** 本方案为架构升级指导文档，不包含实际代码修改。每个阶段启动前需编写详细的实施文档和代码方案。方案中涉及的具体技术版本号需在实施时确认最新稳定版。
