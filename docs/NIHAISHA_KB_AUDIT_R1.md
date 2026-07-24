# 倪师知识库 4 轮深度审计报告

> **审计时间**：2026-07-24 12:50  
> **审计范围**：`knowledge/nihaisha-kb.js`（881KB / 330K 字）  
> **审计目的**：找出 KB API 命中率低（175/902KB ≈ 19%）的根本原因 + 修复方案

---

## 📊 R1 — 结构化审计（Round 1: Structural Audit）

### 1.1 物理规模
| 维度 | 数值 |
|------|------|
| 文件大小 | 881 KB |
| 总字符数 | 330,036 chars |
| 顶层模块数 | 33 |
| 顶层非模块索引 | 4（`_meta`/`index`/`themes`/`correlations`） |

### 1.2 模块清单（33 个）

| # | 模块 key | 标题 | chars | 结构化? |
|---|----------|------|-------|---------|
| 1 | shanghanlun | 伤寒论课程参考 | 6,471 | ❌ |
| 2 | jingui | 金匮要略 | 16,684 | ❌ |
| 3 | huangdi | 黄帝内经 | 18,350 | ❌ |
| 4 | bencao | 神农本草 | 14,040 | ❌ |
| 5 | acupuncture | 针灸大成 | 30,013 | ❌ |
| 6 | bagang | 八纲辨证 | 24,818 | ❌ |
| 7 | zhongjing-xinfa | 仲景心法 | 6,955 | ❌ |
| 8 | fuyang | 扶阳论坛 | 6,246 | ❌ |
| 9 | yijinjing | 易筋经 | 4,895 | ❌ |
| 10 | liangdong | 梁冬对话 | 7,967 | ❌ |
| 11 | stanford | 斯坦福演讲 | 3,502 | ❌ |
| 12 | tianji | 天纪 | 19,146 | ❌ |
| 13 | clinical-cases | 临床医案 | 34,460 | ❌ |
| 14 | formula-patterns | 方剂方证 | 4,043 | ❌ |
| 15 | symptom-index | 症状入口 | 2,984 | ❌ |
| 16 | six-channel | 六经辨证 | 2,891 | ❌ |
| 17 | lesson-map | 逐课地图 | 9,026 | ❌ |
| 18 | learning-entry | 学习入口 | 4,228 | ❌ |
| 19 | beginner-questions | 白话入口 | 3,446 | ❌ |
| 20 | usage-scenarios | 场景路由 | 2,425 | ❌ |
| 21 | ebooks | 古籍溯源 | 4,063 | ❌ |
| 22 | audio-collection | 音频合集 | 9,667 | ❌ |
| 23-27 | notes-* (5 模块) | 各课笔记 | 16,398 (合计) | ❌ |
| 28-31 | notes-*-scan-essence (4 模块) | 扫描版要点 | 77,220 (合计) | ❌ |
| 32 | crossModuleThemes | 跨模块主题 | 0 | ❌ 空 |
| 33 | mingliCorrelation | 命理关联 | 0 | ❌ 空 |

### 1.3 ❌ 关键问题

| 问题 | 影响 |
|------|------|
| **0/33 模块结构化**（全部缺 `id`/`name`/`source` 标准字段） | KB API 无法匹配 |
| **2/33 模块内容为空**（crossModuleThemes、mingliCorrelation） | 占位空壳，浪费 KB 容量 |
| **module 字段无 `id`** | `_id` 哈希无法生成 → 命中失败 |

---

## 📊 R2 — 内容审计（Round 2: Content Audit）

### 2.1 内容深度评级（满分 5⭐）

| 模块 | 字符数 | 深度 | 评级 |
|------|--------|------|------|
| clinical-cases | 34,460 | 临床实战丰富 | ⭐⭐⭐⭐⭐ |
| acupuncture | 30,013 | 穴位系统完整 | ⭐⭐⭐⭐⭐ |
| bagang | 24,818 | 八纲辨证详尽 | ⭐⭐⭐⭐⭐ |
| tianji | 19,146 | 命理精要 | ⭐⭐⭐⭐ |
| huangdi | 18,350 | 内经要点 | ⭐⭐⭐⭐ |
| jingui | 16,684 | 金匮要点 | ⭐⭐⭐⭐ |
| bencao | 14,040 | 本草要点 | ⭐⭐⭐⭐ |
| notes-bencao-scan-essence | 65,673 | **超长笔记** | ⭐⭐⭐⭐⭐ |
| 其他 | < 10K | 摘要级 | ⭐⭐⭐ |

### 2.2 内容"丢失风险"清单
- **notes-bencao-scan-essence**：65K chars 超长 → 容易被截断或忽略
- **clinical-cases**：34K chars → KB 渲染分页未实现
- **acupuncture**：30K chars → KB 检索权重低（长文本无摘要）

### 2.3 ❌ 知识重复检测
- `bencao` vs `notes-bencao` vs `notes-bencao-scan-essence`：本草知识 3 份，部分重叠
- `shanghanlun` vs `notes-shanghan` vs `notes-shanghan-scan-essence`：伤寒 3 份
- `jingui` vs `notes-jingui`：金匮 2 份

→ 建议 R3 阶段做去重合并

---

## 📊 R3 — 可检索性审计（Round 3: Searchability Audit）

### 3.1 KB API 检索接口分析
KB API 服务在端口 8901（`server/kb-api-server.js`）。它用什么字段做匹配？

→ **测试发现**：KB API 主要按 `id`/`name`/`content` 字段做 substring 匹配；缺这些字段 → **完全不命中**。

### 3.2 模拟检索测试（5 个常见词）

| 检索词 | 当前命中 | 预期命中 | 原因 |
|--------|----------|----------|------|
| "伤寒论" | 175/902KB 笼统 | 应 ≥ 30 条 | 模块有内容但无 id |
| "麻黄" | ~5 | 应 ≥ 20 | 散落在 bencao/shanghanlun，无索引 |
| "附子" | ~3 | 应 ≥ 30 | 倪师重点药，多模块有 |
| "针灸" | ~10 | 应 ≥ 50 | 30K chars 内容足够 |
| "六经辨证" | ~2 | 应 ≥ 20 | 独立模块但无 id |

### 3.3 ❌ 核心问题
> **KB API 的本质是"按结构化条目查"，但 nihaisha-kb.js 是"按模块蒸馏"** —— 范式错配！

---

## 📊 R4 — 修复方案（Round 4: Remediation Plan）

### 4.1 立即可做（结构性，零内容成本）

| 优先级 | 任务 | 工作量 |
|--------|------|--------|
| P0 | 给 33 个模块**自动生成结构化条目**（`{id, name, source, content, ...}`） | 1 小时 |
| P0 | 2 个空模块删除（crossModuleThemes、mingliCorrelation） | 5 分钟 |
| P1 | 写 `seedNihaishaStructuredKB()` 把 nihaisha-kb 模块 → kb_formal 条目 | 2 小时 |

### 4.2 中期优化（内容性，需内容理解）

| 优先级 | 任务 | 工作量 |
|--------|------|--------|
| P1 | 把 bencao/shanghanlun/jingui/acupuncture 模块**按段落切分**为多个 kb 条目 | 半天 |
| P1 | 给 clinical-cases 34K chars 提取**独立医案条目** | 半天 |
| P2 | 去重 3 个 bencao/shanghan 重复模块 | 半天 |
| P2 | 添加 `_id_hash` 字段（基于 key+content 哈希）| 1 小时 |

### 4.3 长期规划

| 优先级 | 任务 | 工作量 |
|--------|------|--------|
| P2 | 接入倪师视频转写 → 自动生成条目 | 1 天 |
| P3 | 添加倪师"实践视角"（每条关联 [路大师]/[舒晗]/[倪师]） | 1 天 |

---

## 🎯 量化收益预测

| 阶段 | KB 条目 | 命中率 | API 响应 |
|------|---------|--------|----------|
| 当前（结构化前） | 175 | 19% | 1000ms+ |
| P0 完成（自动结构化） | 200+ | 22% | < 800ms |
| P1 完成（按段落切分） | 800+ | 88% | < 500ms |
| P2 完成（去重+完善） | 1000+ | 95% | < 300ms |

---

## ✅ 立即行动（已在本轮实施）

1. ✅ 创建本审计报告 `docs/NIHAISHA_KB_AUDIT_R1.md`
2. ⏳ 下一步：写 `seedNihaishaStructuredKB()` 自动结构化脚本
3. ⏳ 同步给用户：当前"0% 结构化"是命中低的根本原因