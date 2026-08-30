# 全站信息架构（IA）全量诊断与中心化重构方案

日期：2026-08-30 · 范围：app/ 187 页 + admin/ 5 页 · 方法：全量链接图谱扫描（出/入链）+ 中心重叠分析 + 跨项目引用核查

---

## 一、现状盘点（实测数据）

| 指标 | 数值 |
|---|---|
| 页面总量 | 187（+admin 子目录 5） |
| 入口大厅 index.html | 出链 55 / 入链 145（全站总枢纽） |
| 角色服务中心 | 6 个（缘主 29 链 / 命理师 25 / 医生 24 / 机构 23 / 管理 23 / 患者 22） |
| 次级枢纽 | service-hub(47) / wechat-hub(13) / paipan-center(10) / reports-hub(10) / minsu-center(4) |
| 零入链孤儿页 | 13（本次归档 6，保留观察 7） |
| 真实死链 | **0**（初判 6 条经核查均为误报：admin 子目录相对路径 2 条存在；monitor-hub 4 条为跨项目链接，目标页在 tcm-agent / ai-vision-toolkit 均存在） |

### 六中心健康度

- 互联结构良好：六中心两两互链（footer 导航），index 全互联。
- 独占能力占比：缘主 23/29、命理师 17/25、医生 14/24、患者 13/22、管理 16/23、机构 14/23——分工基本成立。
- 合理共享：unified-consultation（医生+命理师+机构三中心共享，双师审核台本应如此）、patient-journey/patient-archive（医生+患者）、tcm-clinic（医生+机构）。

### 枢纽冗余度（诊断核心发现）

| 枢纽 | 出链 | 已被六中心覆盖 | 结论 |
|---|---|---|---|
| service-hub | 47 | 45（96%） | **重度冗余**，应降级为"全部服务索引"页 |
| wechat-hub | 13 | 8 | 移动端入口，独占 5（知识库×3+登录+先进推演），保留 |
| paipan-center | 10 | 2 | **专业排盘唯一入口**（八字/紫微/奇门/六爻/大六壬/梅花/风水 7 个排盘页+API 文档），已正确挂命理师中心+入口大厅，保留 |
| reports-hub | 10 | 8 | 轻度冗余，保留（报告聚合语义独立） |
| minsu-center | 4 | 4 | **完全冗余**，能力已并入问事服务中心，建议改跳转 |

## 二、目标架构（1+6+3+N）

```
入口大厅 index.html（角色分流）
├── 缘主服务中心 center-yuanzhu   → 问事服务中心 ask.html（21 工具 9 组）
├── 命理师服务中心 center-master  → 排盘中心 paipan-center（7 专业排盘，仅命理师/管理员）
├── 医生服务中心 center-doctor    → 问诊台 unified-consultation / integrated-clinic
├── 患者服务中心 center-patient
├── 机构服务中心 center-org       → SaaS 多机构
├── 管理服务中心 center-admin
├── 专业枢纽（按需保留）：reports-hub / wechat-hub（移动）/ wangzhen-center（望诊）
└── 系统保留页：login / activate / offline / clear-cache / privacy-center / feedback-center
```

原则：**角色中心是唯一能力入口**；枢纽页只做聚合不做平行入口；专业排盘永不进缘主流。

## 三、本次已执行

1. ✅ 归档 6 个测试/演示/被取代孤儿页 → `archive/legacy-pages-202608/`：
   test-interceptor / test-parse-natural / rokid-test / components-demo / demo-realtime / rename（能力已被问事「改名测评」覆盖，0 引用）
2. ✅ 死链清零确认（6 条初判全部为误报，无需修复）
3. ✅ 问事页已升级为「问事服务中心」（hero+服务条+9 组分组+中心互联，见 KANBAN 10:25 条目）

## 四、后续路线（按优先级）

- **P1 · service-hub 降级**：47 链 96% 冗余，改为"全部服务索引"（六中心大卡 + 反馈中心 + 机构分析 2 个独占项），去掉平行工具入口，消除"两个总枢纽"认知负担
- **P1 · minsu-center 改跳转**：4 链 100% 被问事服务中心覆盖，301 到 ask.html（保留 URL 防外链失效）
- **P2 · 孤儿观察项 7 页**：activate / clear-cache / offline / daily-summary / nn-dashboard / feedback-detail / divination-hub（模态契约保留）——补接入链或在页内标注系统用途
- **P2 · wechat-hub 与缘主中心打通**：移动端 5 个独占页（倪师/舒晗知识库×3、login、divination-almanac）补进缘主中心"学习"分组
- **P3 · 入口大厅瘦身**：55 出链中工具直达与中心入口混排，建议大厅只留"六中心 + 高频三件事（问事/黄历/我的）"，其余收进中心

## 五、验收标准

- 全站零真实死链（已达成）
- 任意能力页从"入口大厅 → 角色中心"两步内可达
- 专业排盘 7 页仅能从 center-master / center-admin / paipan-center 到达（已达成）
- 每个中心出链独占率 ≥ 50%（当前 57%-79%，已达成）
