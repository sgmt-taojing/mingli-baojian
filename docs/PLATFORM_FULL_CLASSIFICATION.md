# 命理宝鉴 · 全平台专业架构 · 三端分级 + 智能眼镜方案

**生成时间**：2026-07-21
**依据**：用户需求 + 平台实际能力盘点 + 完整运营视角

---

## 一、四层专业分级体系

按"用户专业程度"和"服务深度"将平台分为 **4 层**，每层有独立的报告生成逻辑、引导深度和完整报告输出。

### T1 · AI 助手 · 大众层

**目标**：面向<strong>零专业知识</strong>用户
**特点**：友好对话全量引导，引导完毕给出<strong>完整报告</strong>
**前端**：[ai-assistant.html](/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/app/ai-assistant.html) · [my-yuanzhu.html](/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/app/my-yuanzhu.html)
**后端**：`/api/ai/chat` · `/api/ai/guide`

| 维度 | 说明 |
|------|------|
| 引导方式 | 一步步提问，不假设用户懂术语 |
| 引导深度 | 8-15 题，覆盖基础信息 + 核心关切 |
| 报告输出 | 命理概要 + 优势 + 风险 + 建议 + 时机 + 化解 + 行动清单 |
| 端 | H5 + 小程序 + 微信 H5 |

### T2 · 排盘引擎 · 爱好者层

**目标**：面向<strong>有学习兴趣或专业知识</strong>的用户
**特点**：8 大引擎排盘后给出<strong>完整专业报告</strong>

| 引擎 | 前端页面 |
|------|---------|
| 八字 | [divination-integrated.html](/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/app/divination-integrated.html) |
| 紫微 | [divination-knowledge.html](/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/app/divination-knowledge.html) |
| 奇门 | [yijing-qimen.html](/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/app/yijing-qimen.html) |
| 大六壬 | divination-hub 内嵌 |
| 六爻 | [yijing-oracle.html](/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/app/yijing-oracle.html) |
| 梅花 | divination-hub 内嵌 |
| 风水 | [fengshui.html](/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/app/fengshui.html) |
| 易卦 | yijing-oracle 内嵌 |

**后端**：`/api/paipan/*` · `/api/paipan/history` · `/api/paipan/save`

### T3 · 易+医 · 高端层

**目标**：面向<strong>高端客户</strong>
**特点**：命理 + 中医双轨并行，AI + 真人医师/大师联合服务

| 模块 | 前端页面 |
|------|---------|
| 中医诊疗 + AI 面相 | [tcm-clinic.html](/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/app/tcm-clinic.html) |
| 症状采集 | [tcm-symptom.html](/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/app/tcm-symptom.html) |
| 倪师经典学习 | [nihaisha-learning.html](/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/app/nihaisha-learning.html) |
| 舒晗知识库 | [shuhan-knowledge.html](/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/app/shuhan-knowledge.html) |
| 大师讲堂 | [master-class.html](/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/app/master-class.html) |

**后端**：`/api/clinic/*` · `/api/face/*` · `/api/courses`

### T4 · 后台管理 · 专业层

**目标**：面向<strong>管理员 / 大师 / 医师 / 代理商</strong>
**特点**：数据管理、审计、推送、审核一站式

| 模块 | 前端页面 |
|------|---------|
| 主后台 | [admin.html](/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/app/admin.html) |
| 商城管理 | [admin-shop.html](/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/app/admin-shop.html) |
| 缘主仪表盘 | admin/yuanzhu-dashboard.html |
| 监控大屏 | [monitor-dashboard.html](/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/app/monitor-dashboard.html) |
| KB 浏览器 | [kb-explorer.html](/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/app/kb-explorer.html) |
| 代理商 | [merchant-dashboard.html](/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/app/merchant-dashboard.html) |
| 数据安全导出 | [export-guard.html](/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/app/export-guard.html) |

**后端**：`/api/admin/*` · `/api/export/*`

---

## 二、智能眼镜集成方案（新需求）

### 2.1 业务场景

智能眼镜作为 **AI 数据采集入口**：
1. 信众与授权角色（大师/医师）对话
2. 眼镜实时采集视频 + 音频
3. 后端 AI 分析 → 实时推送对话引导建议
4. 对话完毕 → AI 自动形成方案
5. 大师/医师审核 → 推送给信众/患者

### 2.2 数据流（6 步）

| 步骤 | 描述 |
|------|------|
| 1 | 眼镜采集音视频流 → `/api/glass/stream` |
| 2 | AI 实时分析（g2claw / GLM-4V） |
| 3 | 生成对话引导建议 → 眼镜 HUD |
| 4 | 授权角色按引导与信众对话 |
| 5 | AI 自动生成方案草稿（命理 + 中医） |
| 6 | 大师/医师审核 → 推送至信众 |

### 2.3 新增后端端点（7 个）

| 端点 | 用途 | 权限 |
|------|------|------|
| `POST /api/glass/stream` | 接收眼镜音视频流 | 授权角色 |
| `GET /api/glass/analysis/:id` | 获取 AI 分析结果 | 授权角色 |
| `POST /api/glass/guide` | AI 生成对话引导 | 系统 |
| `POST /api/glass/session` | 创建/结束眼镜会话 | 授权角色 |
| `GET /api/glass/history` | 历史会话查询 | admin |
| `POST /api/glass/report/generate` | 自动生成方案草稿 | 系统 |
| `POST /api/glass/report/approve` | 审核确认推送 | 大师/医师 |

### 2.4 新增前端页面（3 个）

| 页面 | 用途 |
|------|------|
| `app/glass-console.html` | 授权角色眼镜操作面板 |
| `app/glass-history.html` | 历史会话回放 |
| `app/glass-approve.html` | 大师/医师审核队列 |

### 2.5 新增数据库表

```sql
CREATE TABLE glass_sessions (
  id INTEGER PRIMARY KEY,
  master_id INTEGER,           -- 授权角色
  patient_id INTEGER,          -- 信众/患者
  stream_url TEXT,             -- 音视频流地址
  transcript TEXT,             -- 对话转写
  ai_analysis TEXT,            -- AI 分析 JSON
  guide_suggestions TEXT,      -- 引导建议 JSON
  auto_report TEXT,            -- 自动生成的方案草稿
  status TEXT DEFAULT 'active',-- active/ended/approved/rejected
  created_at TEXT DEFAULT (datetime('now','localtime'))
);
```

---

## 三、三端全量报告逻辑

### T1 · AI 助手报告流程

```
输入：自然语言问题
↓
引导：AI 友好提问（8-15 题）
↓
引擎：KB 优先双路径（命中≥0.7 直答，0.4-0.7 润色，<0.4 兜底）
↓
输出：完整报告
```

### T2 · 排盘报告流程

```
输入：生辰八字 + 选引擎
↓
排盘：8 大引擎专业排盘
↓
分析：命盘 + 十宫 + 流年
↓
输出：完整专业报告（命盘 / 格局 / 大运 / 流年 / 化解建议）
```

### T3 · 易+医报告流程

```
输入：排盘结果 + 症状 + AI 面相（智能眼镜）
↓
诊断：命理分析 + 中医辨证（八纲/六经/三焦）
↓
方案：命理建议 + 中医处方 + 食疗 + 穴位 + 经方
↓
审核：AI 草稿 → 大师/医师审核确认
↓
输出：双轨报告（命理 + 中医）
```

---

## 四、PC + 移动端策略

**结论**：PC 和移动端**没有功能差异**，只是使用场景不同：
- **PC 后台**：`admin.html` 大屏办公（104KB）
- **移动端**：所有 H5 页面响应式适配
- **PC 移动互通**：同一后端 API，三端 DTO 共享

---

## 五、从完整运营角度看 · 还缺什么

### 🔴 P0 · 关键缺口

| 缺口 | 说明 | URL/模块 |
|------|------|----------|
| 🔴 智能眼镜全链路 | 后端 7 端点 + 前端 3 页面 + DB 表 + AI 分析 | glass-console.html · /api/glass/* |
| 🔴 站内 IM 系统 | 管理员 ↔ 大师 ↔ 医师 ↔ 信众实时沟通 | im.html · /api/messages/* · message_* 4 表 |
| 🔴 API 模块化拆分 | 1710 行单文件 → 12 个 routes/*.js | server/routes/*.js |
| 🔴 三端报告一致性 | H5/小程序/微信 H5 报告格式统一 | dto/*.js · report-renderer.js |

### 🟡 P1 · 增强缺口

| 缺口 | 说明 | URL/模块 |
|------|------|----------|
| 性能监控深度化 | monitor-dashboard 已有界面，缺后端埋点 | middleware/monitor.js + trackEngine/trackKB |
| 流程引擎 BPM | 6 大 SOP 无可视化 | workflow/lightweight-bpm.js |
| AI 面相结合排盘 | face-ocr 未与排盘联动 | tcm-clinic.html 双轨报告 |
| 小程序 AI 助手 | 小程序有知识库和排盘，缺 AI 助手 | miniprogram/pages/ai-assistant/ |

### 🟢 P2 · 优化缺口

| 缺口 | 说明 | URL/模块 |
|------|------|----------|
| 数据安全合规 | 缺 GDPR 式数据删除/匿名化 | /api/export/anonymize |
| 测试覆盖率 | 缺单元测试 + 集成测试 | test/*.test.js · autocannon 压测 |

---

## 六、完整架构总览

```
┌────────────────────────────────────────┐
│        用户层 · 5 端 + 智能眼镜         │
├──────────┬──────────┬──────────────────┤
│ H5 SPA   │ 小程序   │ 微信 H5 + 公众号  │
│ 48 页面  │ 19 页面  │ 6 菜单 + 后台菜单 │
├──────────┼──────────┼──────────────────┤
│ Admin 后台 (PC)  │  🥽 智能眼镜 (NEW)  │
└──────────┴──────────┴──────────────────┘
                ↓ HTTPS / WS
┌────────────────────────────────────────┐
│    API 网关层 · Express : 8920          │
│    JWT + RBAC + RateLimit + CORS       │
│    56 个端点                            │
├────────────────────────────────────────┤
│         服务层 · 8 子系统               │
├─────┬─────┬─────┬─────┬─────┬─────┬───┤
│排盘 8│AI助手│中医 │智能眼│推送 │数据 │商城│监控 │
│ 引擎 │KB   │clinic│镜 NEW│cron │导出 │   │    │
├─────┴─────┴─────┴─────┴─────┴─────┴───┤
│    数据层 · SQLite yidao.db            │
│    yuanzhu · clinic · paipan · kb     │
│    shop · push · audit · glass_sessions│
└────────────────────────────────────────┘
```

---

## 七、实施优先级

| 优先级 | 任务 | 类型 | 状态 |
|--------|------|------|------|
| P0 | 智能眼镜全链路 | NEW | 🔴 待启动 |
| P0 | 站内 IM 系统 | NEW | 🔴 待启动 |
| P0 | API routes 拆分 | 重构 | 🔴 待启动 |
| P1 | 三端报告 DTO 统一 | 增强 | 🟡 已规划 |
| P1 | 性能监控深度化 | 增强 | 🟡 已规划 |
| P1 | 轻量 BPM 流程引擎 | NEW | 🟡 已规划 |
| P2 | AI 面相结合排盘 | 增强 | 🟢 待办 |
| P2 | 小程序 AI 助手 | 新增 | 🟢 待办 |

---

## 交付物

- [全平台专业架构 HTML](/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/docs/PLATFORM_FULL_CLASSIFICATION.html) — 4 层分级 + 智能眼镜方案 + 架构图 + 缺口清单
- [全平台专业架构 Markdown](/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/docs/PLATFORM_FULL_CLASSIFICATION.md) — 同内容 Markdown 版本