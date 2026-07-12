# 命理宝鉴 · 架构 V2 设计文档

**版本**：v2.0
**日期**：2026-07-12
**状态**：设计冻结（Phase D-1 完成）
**前序版本**：[ARCHITECTURE_UPGRADE_PLAN.md](/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/ARCHITECTURE_UPGRADE_PLAN.md)（2026-07-03，已合并 60%）

---

## 〇、设计背景

为解决 2026-07-12 多路审计发现的 4 大问题：

| 问题 | 根因 | 架构 V2 解法 |
|---|---|---|
| 排盘引擎准确度低（紫微 2/10、奇门 3/10） | 算法分散在 `app/js/*` 与 `server/paipan.py`，无统一接口契约 | 建立 `engine_meta` 接口层 + 7 引擎统一签名 |
| divination-hub.html 体积 712KB → 首屏 15s | 单文件巨型 SPA，未拆分 | O-1 按需加载：核心 250KB + 6 × ~60KB 模块 |
| 公开仓库源码泄露 | 单一 GitHub repo，所有代码全公开 | `data/` 已 gitignore + README 加免责声明 |
| 推送分散于 H5 + 公众号两套 | 模板未抽公共层 | R-3 共享 `push/tpl/almanac.hbs` |

---

## 一、总体架构图

```
┌────────────────────────────────────────────────────────────────────┐
│                          用户层（5 端入口）                          │
│  ┌──────────────┐ ┌──────────────┐ ┌────────────┐ ┌─────────────┐ │
│  │ 微信小程序      │ │ H5 SPA        │ │ 公众号菜单   │ │ 后台管理    │ │
│  │ (miniprogram) │ │ (divination   │ │ (wechat_mp)│ │ (/admin)    │ │
│  │ 19 页面       │ │  -hub.html)   │ │ 6 菜单     │ │ (cron 后台) │ │
│  └─────┬─────────┘ └─────┬─────────┘ └─────┬──────┘ └─────┬───────┘ │
│        │                │                  │               │         │
└────────┼────────────────┼──────────────────┼───────────────┼─────────┘
         │                │                  │               │
┌────────▼────────────────▼──────────────────▼───────────────▼─────────┐
│                       API 网关层（8920 端口）                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ Express + Bearer Token 鉴权 + RateLimit + CORS + 审计日志    │  │
│  │ /api/user/login  /api/paipan/*  /api/push/first-almanac      │  │
│  │ /api/shop/*      /api/knowledge/*  /api/admin/*              │  │
│  └───────────────────────────────────────────────────────────────┘  │
└────────┬──────────────────────────────────────────────┬──────────────┘
         │                                              │
┌────────▼──────────────────┐         ┌────────────────▼──────────────┐
│  引擎层（7 个排盘引擎）       │         │  数据层（SQLite）                │
│  ┌─────────────────────┐  │         │  ┌─────────────────────────┐   │
│  │ 八字  (bazi)        │  │         │  │ users / user_points      │   │
│  │ 紫微  (ziwei)       │  │         │  │ paipan_history           │   │
│  │ 奇门  (qimen)       │  │         │  │ push_log (首次推送台账)  │   │
│  │ 大六壬(liuren)      │  │         │  │ shop_orders / shop_items │   │
│  │ 六爻  (liuyao)      │  │         │  └─────────────────────────┘   │
│  │ 梅花  (meihua)      │  │         └────────────────────────────────┘
│  │ 风水  (fengshui)    │  │
│  └─────────────────────┘  │
└────────┬──────────────────┘
         │
┌────────▼──────────────────────────┐      ┌────────────────────────────┐
│  推送层（cron + 公众号）               │      │  知识库层（65 JS 文件）       │
│  ┌──────────────────────────────┐  │      │  ┌──────────────────────┐  │
│  │ daily_push.js   (6:00/18:00)│  │      │  │ authoritative-       │  │
│  │ push_wechat.js  (公众号菜单) │  │      │  │   knowledge-base.js  │  │
│  │ first_pull.js   (首次立即)  │  │      │  │ 8 大类：八字/紫微/   │  │
│  │ verify_knowledge.py (回归)  │  │      │  │  奇门/六壬/六爻/梅花 │  │
│  └──────────────────────────────┘  │      │  │  /风水/周易           │  │
│                                    │      │  └──────────────────────┘  │
└────────────────────────────────────┘      └────────────────────────────┘
```

---

## 二、模块划分

### 2.1 前端层
| 模块 | 文件 | 体量 | 阶段 | 优先级 |
|---|---|---|---|---|
| H5 SPA 核心 | `app/divination-hub.html` | 712KB → 600KB | O-1 | 高 |
| 小程序首页 | `miniprogram/pages/index/` | 23 个二级入口 | D-3 | 高 |
| 小程序排盘 | `miniprogram/pages/paipan/` | 5 术数 | R-2 | 高 |
| 黄历 | `miniprogram/pages/almanac/` | 干支 + 4 板块 | 已完成 | 中 |
| 知识库 | `miniprogram/pages/knowledge/` | 8 大类 | 已完成 | 中 |
| 我的中心 | `miniprogram/pages/mine/` | 登录 / 生辰 | 已完成 | 中 |
| 商城 | `miniprogram/pages/shop/` | 5 子页面 | R-5 | 中 |
| H5 子页 | `app/divination-*.html` | 4 个 | D-3 | 低 |

### 2.2 后端层
| 模块 | 文件 | 状态 | 优先级 |
|---|---|---|---|
| API 网关 | `server/api-server.js` | ✅ 已有 | 核心 |
| 八字引擎 | `server/paipan.py` | 🔧 校准中 | R-2 |
| 紫微引擎 | `server/paipan-server.py` → 独立 | 🔴 待重写 | R-2 |
| 奇门引擎 | 同上 | 🔴 待补 | R-2 |
| 六壬引擎 | `_liurenSiKe` 已存在 | 🟡 启用 | R-2 |
| 六爻引擎 | `expand-zhanbu.js` | 🟡 待补 | R-2 |
| 梅花引擎 | 缺失 | 🔴 待建 | R-2 |
| 风水引擎 | 缺失 | 🔴 待建 | R-2 |
| 推送服务 | `daily_push.js` | ✅ 已有 | 核心 |
| 鉴权 | `server/security.js` | ✅ 已有 | 核心 |

### 2.3 数据层
| 表 | 字段 | 状态 | 备注 |
|---|---|---|---|
| `users` | id, phone_hash, name, sex, birth_date(加密), vip_level | ✅ | 手机号 SHA256 |
| `user_points` | user_id, points, total | ✅ | 积分系统 |
| `paipan_history` | id, user_id, type, payload, result | 🟡 | 待迁移小程序历史 |
| `push_log` | user_id, date, version, channel | 🔴 新增 | 首次推送台账 |
| `shop_orders` | id, user_id, items, total, status | 🔴 新增 | 商城下单 |
| `audit_logs` | user_id, action, detail, ts | ✅ | 已用 |

---

## 三、关键技术决策

### 3.1 鉴权模型（保留）
- 客户端：手机号 → 后端 SHA256 → 颁发 JWT（72 小时） → `wx.storage` 持久化
- 后端：`Authorization: Bearer <token>` 中间件校验
- 旧 `admin123` 已淘汰，全站走 Token

### 3.2 引擎接口契约（D-2 详细）
```js
{
  engine: 'bazi',                    // 引擎标识
  version: '2.0',                    // 引擎版本
  source: '《渊海子平》《三命通会》', // 出处
  accuracy: 0.86,                    // 自评准确度
  result: { pillars, dayun, liuyun, shensha, score },
  engine_meta: { calibrated_at, calibrate_count }
}
```

### 3.3 推送防重（D-4 详细）
- 双键冗余：客户端 `localStorage['_firstAlmanacPushed']` + 服务端 `push_log`
- 同用户同一天只推送一次，cron 6:00 检查后才补发

### 3.4 性能（O-1）
- 拆分策略：核心模块 250KB → 子模块 `<script async>` 按需加载
- CDN：`github-pages` 静态资源走 CDN 缓存 fallback
- 字体：仅用系统字体栈，禁用远程 Google Fonts

### 3.5 安全（O-1 / T-1）
- PII 数据库加密：`users.birth_date` 已 AES
- 公开仓库：保留 docs/ `DISCLAIMER`，`data/` 严控 `.gitignore`
- API RateLimit：5 req/min/IP + per-phone 限速

---

## 四、目录约定

```
mingli-baojian/
├── ARCHITECTURE_V2.md  ← 本文件
├── MENU_MATRIX.md      ← D-3
├── PUSH_CONTRACT.md    ← D-4
├── miniprogram/
├── server/
│   ├── api-server.js
│   ├── engines/        ← 7 引擎独立目录（R-2 用）
│   ├── push/
│   │   ├── daily_push.js
│   │   ├── tpl/almanac.hbs
│   │   └── first_almanac.js
│   └── database/
├── app/                ← H5
├── knowledge/          ← 65 JS 知识库
├── docs/               ← 历史产物存档
└── desktop_archive/    ← 桌面归档脚本输出目录
```

---

## 五、与 V1 版本差异

| 项 | V1 (现) | V2 (新) |
|---|---|---|
| 引擎接口 | 各 JS 文件散落 | 7 引擎统一签名 |
| 推送 | H5 内 + 公众号各一套 | 共享 `push/tpl/almanac.hbs` |
| 鉴权 | 部分页面无 Token | 全站 Bearer Token |
| H5 体积 | 单体 712KB | 拆分 + 按需 |
| 错误处理 | `try/catch` 局部 | 全链路 error_id + 审计 |
| 知识校验 | 无 | `verify_knowledge.py` 自动化 |

---

## 六、设计冻结清单

- ✅ 鉴权模型（Bearer Token + JWT 72h）
- ✅ 数据加密（手机号 SHA256 + 生日 AES）
- ✅ 引擎接口契约（V2 engine_meta）
- ✅ 推送通道（H5 / 公众号 / 小程序 / cron 四通道共享模板）
- ✅ 防重机制（客户端 + 服务端双键冗余）
- ✅ 性能目标（核心 < 250KB、首屏 < 3s）
- ✅ 安全规约（README 免责声明 + `.gitignore` PII 隔离）

设计冻结日：2026-07-14
