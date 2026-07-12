# 命理宝鉴 · 菜单矩阵（v2.0）

**日期**：2026-07-12
**状态**：Phase D-3 设计冻结
**适用范围**：小程序 + H5 共同菜单结构

---

## 〇、5 个 tabBar（不变）

| Tab | 页面 | 功能 |
|---|---|---|
| 首页 | `pages/index/index` | 功能入口网格 + 每日箴言 + 首次引导 |
| 排盘 | `pages/paipan/paipan` | 7 术数切换 + 5 字段输入 + 历史 |
| 黄历 | `pages/almanac/almanac` | 今日 / 明日 干支 + 4 板块 |
| 知识 | `pages/knowledge/knowledge` | 8 大类 + 搜索 + 热门推荐 |
| 我的 | `pages/mine/mine` | 登录 / 生辰 / 历史 / 积分 |

---

## 一、二级入口矩阵（23 个，按"完整度 / 优先级"排）

### 1.1 完整已上线（5 个，可立即使用）
| 入口 | 路由 | 现状 | 阶段 |
|---|---|---|---|
| 起名改名 | `pages/naming/naming` | H5 跳转引导 | ✅ 已升级（minip-p0 batch 1） |
| 八字排盘 | `pages/paipan/paipan?type=bazi` | 真实 4 柱 | ✅ 完整 |
| 黄历 | `pages/almanac/almanac` | 4 板块 9203 字符 | ✅ 完整 |
| 知识库 | `pages/knowledge/knowledge` | 8 大类 | ✅ 完整 |
| 个人中心 | `pages/mine/mine` | 登录/历史/积分 | ✅ 完整 |

### 1.2 高级工具升级中（8 个，R-1 / R-2 推进）
| 入口 | 路由 | 当前准确度 | 目标 | 负责人 |
|---|---|---|---|---|
| 紫微斗数 | `?type=ziwei` | 2/10 | 8/10 | subagent_06 |
| 奇门遁甲 | `?type=qimen` | 3/10 | 8/10 | subagent_07 |
| 大六壬 | `?type=liuren` | 3/10 | 8/10 | subagent_08 |
| 六爻占卜 | `pages/zhanbu/zhanbu` | 7/10 | 9/10 | subagent_09 |
| 梅花易数 | `?type=meihua` | — | 8/10 | subagent_09 |
| 玄空风水 | `pages/fengshui/fengshui` | 3/10 | 8/10 | subagent_06 |
| 择日 | `pages/zeri/zeri` | 5/10 | 8/10 | subagent_05 |
| 体质辨识 | `pages/tizhi/tizhi` | 6/10 | 9/10 | subagent_05 |

### 1.3 占位页实装（11 个，R-1 推进）
| 入口 | 路由 | 当前状态 | 实装任务 |
|---|---|---|---|
| 手机号测评 | `pages/phone/phone` | H5 跳转引导 | 数字五行 + 八星组合 |
| 楼层推荐 | `pages/louceng/louceng` | H5 跳转引导 | 河图数 + 命卦配合 |
| 大师课堂 | `pages/master/master` | H5 跳转引导 | 课程列表 + VIP 解锁 |
| 功德系统 | `pages/merit/merit` | H5 跳转引导 | 每日打卡 + 计数器 |
| 每日运势 | `pages/yunshi/yunshi` | H5 跳转引导 | 事业/财运/健康评分 |
| 合婚匹配 | `pages/hehun/hehun` | H5 跳转引导 | 双八字合婚算法 |
| 待办/Coming | `pages/coming/coming` | 占位 | 删除或转入 lab |

### 1.4 商城子页（5 个，R-5 推进）
| 入口 | 路由 | 当前状态 | 实装任务 |
|---|---|---|---|
| 商城主页 | `pages/shop/shop` | 5 类目浏览 | 已完成 |
| 详情 | `shop/detail?id=` | 缺失 | R-5 |
| 购物车 | `shop/cart` | 缺失 | R-5 |
| 订单 | `shop/orders` | 缺失 | R-5 |
| 我的收藏 | `shop/favorites` | 缺失 | R-5 |

---

## 二、菜单信息架构图

```
首页 (index)
├─ 头部：每日箴言 + 用户问候
├─ 排盘类（5 个）
│   ├─ 八字排盘 → pages/paipan
│   ├─ 紫微斗数 → pages/paipan?type=ziwei
│   ├─ 奇门遁甲 → pages/paipan?type=qimen
│   ├─ 六壬 → pages/paipan?type=liuren
│   └─ 六爻/梅花 → pages/zhanbu
├─ 生活类（8 个）
│   ├─ 黄历 → pages/almanac
│   ├─ 起名 → pages/naming
│   ├─ 合婚 → pages/hehun
│   ├─ 体质 → pages/tizhi
│   ├─ 手机号 → pages/phone
│   ├─ 楼层 → pages/louceng
│   ├─ 风水 → pages/fengshui
│   └─ 择日 → pages/zeri
├─ 学习类（4 个）
│   ├─ 知识库 → pages/knowledge
│   ├─ 大师课堂 → pages/master
│   ├─ 每日运势 → pages/yunshi
│   └─ 功德系统 → pages/merit
└─ 商城类（5 个）
    ├─ 商城 → pages/shop
    ├─ 详情 → shop/detail
    ├─ 购物车 → shop/cart
    ├─ 订单 → shop/orders
    └─ 收藏 → shop/favorites
```

---

## 三、用户行为埋点（设计原则）

| 事件 | 字段 | 用途 |
|---|---|---|
| 菜单点击 | `route`, `from`, `ts` | 流量分析 |
| 排盘完成 | `engine`, `accuracy`, `ts` | 引擎准确度 |
| 推送首屏 | `channel`, `version`, `ts` | 推送防重 |
| 商城下单 | `item_id`, `total`, `ts` | 营收统计 |
| Token 失效 | `api`, `status`, `ts` | 鉴权监控 |

---

## 四、阶段对齐

| 阶段 | 菜单相关任务 |
|---|---|
| D-3 | 本文档冻结 ✅ |
| R-1 | 11 个占位页实装 |
| R-2 | 8 个工具引擎校准 |
| R-5 | 5 个商城子页实装 |
| T-3 | 端到端验证 5 场景都覆盖菜单 |

设计冻结日：2026-07-14
