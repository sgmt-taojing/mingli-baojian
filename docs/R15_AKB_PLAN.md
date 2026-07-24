# R15 · 知识库短板补强规划（2026-07-25 08:00）

> **基准快照**（2026-07-25 07:55 实测）：kb_formal 11,648 条 / 49 模块 / source_index 484 条 / trust ≥0.6 占 96.5% / 关键词覆盖率 99.99% / 孤儿 0
> **目标**：补 acupuncture / tcm-fangji / tcm-diagnosis / tcm-zhongfu 四大短板，叠加路总先知智镜（28 舌象 + 子午流注 + 医易联动）领域扩展
> **执行方式**：集群模式 S2 派 4-5 路 subagent 并行，每路一个独立 KB 模块补强
> **约束**：kb_formal schema 无 `updated_at`；用 `INSERT...SELECT FROM` 模式（rowcount 不可信）；新条目 `promoted_from` 标 staging.entry_id 或 audit-auto

## 一、当前模块现状（短板识别）

| 模块 | 当前 | 目标 | 缺口 | 优先级 | 主要补强来源 |
|------|------|------|------|--------|-------------|
| **acupuncture** | 162 | 300+ | +138 | P0 | 十二正经子午流注 + 灵龟八法 + 八纲取穴 + 奇穴 |
| **tcm-fangji** | 82 | 200+ | +118 | P0 | 经方 113 方 + 类方 + 经典方剂 + 路总实践方 |
| **tcm-diagnosis** | 296 | 400+ | +104 | P1 | 目诊五轮 / 瞳神 / 翳膜 + 手诊鱼际 / 指甲 / 小儿指纹 |
| **tcm-zhongfu** | — | 50+ | 新建 | P1 | 脏腑辨证基础（路总规划核心） |
| **shuhan-TCM** | — | 80+ | 新建 | P2 | 舒晗老师课程体系（密宗天纪 + 奇门校正） |
| **meridian** | — | 60+ | 新建 | P2 | 经络循行 / 十二经 / 奇经八脉 |

## 二、R15 派工拆解（5 路 subagent）

### Worker 1 · 针灸补强（acupuncture 162 → 300+）
- 起点：`knowledge/acupuncture-kb.js`（已有 47 行十二正经 + 灵龟八法）
- 补强方向：
  - 十二正经井荥输经合 60 穴 × 5 经 = 300 条
  - 灵龟八法 + 八纲取穴 + 飞腾八法 30 条
  - 经外奇穴 50 条（含路总规划"耳穴 + 全息"扩展）
- 来源标 SRC-LD-（路大师）/ SRC-CLASSIC-（经典）

### Worker 2 · 经方补强（tcm-fangji 82 → 200+）
- 起点：`server/database/yidao.db` 已 82 条
- 补强方向：
  - 伤寒论 113 方（每方 1 条）= 113 条
  - 金匮要略 70 方 = 70 条
  - 温病条辨 / 时方妙用 / 路总实践方 = 20-50 条
- 来源 SRC-CLASSIC-（伤寒/金匮原文 + 经方家注解）

### Worker 3 · 中医诊断补强（tcm-diagnosis 296 → 400+）
- 起点：`knowledge/tcm-diagnosis-kb.js`（已 737 行）
- 补强方向：
  - 目诊：五轮学说 + 瞳神 + 翳膜 + 白睛 + 虹膜（30 条）
  - 手诊：鱼际 + 指甲 + 小儿指纹 + 五色（25 条）
  - 舌诊：路总规划 28 舌象全结构化（28 条）
  - 面诊 / 耳诊 / 脉诊 补足至 50+ 条
- 来源 SRC-LD-（路大师实践）+ SRC-NHS-（倪师课程）

### Worker 4 · 脏腑辨证（tcm-zhongfu 新建）
- 起点：现有 0 条，新模块
- 补强方向：
  - 五脏六腑生理病理 30 条
  - 脏腑辨证 8 大证型 20 条
- 来源 SRC-CLASSIC-（中医基础理论）

### Worker 5 · 舒晗中医（shuhan-TCM 新建）
- 起点：现有 0 条，新模块
- 补强方向：
  - 舒晗老师密宗天纪 30 条
  - 奇门校正中医 20 条
  - 八字与中医体质 30 条
- 来源 SRC-SH-（舒晗课程原始素材）

## 三、INSERT 模式（kb_formal 无 updated_at）

```sql
INSERT OR IGNORE INTO kb_formal (
  entry_id, module, title, content,
  src_id, category, keywords, summary,
  trust_score, version, promoted_at,
  promoted_from, reviewed_by,
  hit_count, last_hit, tags, source_ids,
  confidence, access_level, difficulty, status
)
SELECT
  'r15-<模块>-<编号>' AS entry_id,
  '<模块>' AS module,
  '<标题>' AS title,
  '<正文 50-500 字>' AS content,
  '<src_id>' AS src_id,
  '<category>' AS category,
  '<JSON 数组关键词>' AS keywords,
  '<一句话摘要>' AS summary,
  0.7 AS trust_score,
  'v1' AS version,
  CURRENT_TIMESTAMP AS promoted_at,
  'audit-auto' AS promoted_from,
  'audit-auto' AS reviewed_by,
  0 AS hit_count,
  NULL AS last_hit,
  '[]' AS tags,
  '[<src_id>]' AS source_ids,
  0.7 AS confidence,
  'registered' AS access_level,
  'intermediate' AS difficulty,
  'formal' AS status
FROM (SELECT 1) WHERE NOT EXISTS (
  SELECT 1 FROM kb_formal WHERE entry_id = 'r15-<模块>-<编号>'
);
```

**注意**：
- Python sqlite3 `INSERT OR IGNORE` 的 rowcount 不可信，必须用 `INSERT...SELECT FROM` 模式
- 写完后用 `SELECT COUNT(*) FROM kb_formal WHERE module = '<模块>'` 验证

## 四、验收清单（节点 7.6 + R15 双重门槛）

| 项 | 阈值 | 实测方法 |
|----|------|----------|
| acupuncture | ≥300 | `SELECT COUNT(*) FROM kb_formal WHERE module='acupuncture'` |
| tcm-fangji | ≥200 | 同上 |
| tcm-diagnosis | ≥400 | 同上 |
| tcm-zhongfu | ≥50（新建） | 同上 |
| shuhan-TCM | ≥80（新建） | 同上 |
| 关键词全 JSON | 100% | `SELECT COUNT(*) WHERE typeof(keywords)!='json' AND keywords!=''` |
| 孤儿 | 0 | grep entry_id 唯一性 |
| Jest 全绿 | 504/504 | `npx jest` |
| 覆盖率 | ≥72% | `npx jest --coverage` |
| GitHub Pages | 200 | curl 5 URL |

## 五、风险与回退

- **风险 1**：kb_formal 唯一性冲突（entry_id 重复）→ INSERT OR IGNORE + SELECT NOT EXISTS 双保险
- **风险 2**：trust_score 0.7 默认太低（实际数据 96.5% ≥0.6）→ 经典 0.85 / 实践 0.7 / 争议 0.5
- **风险 3**：source_index 不足（当前 484 条）→ 同步新建对应 src_id（命名 SRC-CLASSIC-xxx / SRC-LD-xxx）
- **风险 4**：5 worker 并行 sqlite3 写冲突 → maxWorkers=1 + INSERT 模式原子性 + 错峰（每 worker 完成 N 条 commit 一次）

## 六、时间线（预估）

- **Worker 1 针灸**（最大缺口）：45 分钟 → 节点 7.6 验收
- **Worker 2 经方**（数据相对规整）：30 分钟
- **Worker 3 中医诊断**：30 分钟
- **Worker 4 脏腑辨证**（新模块）：20 分钟
- **Worker 5 舒晗中医**（新模块）：25 分钟
- **总计**：2 小时 / 5 路并行

## 七、下一步执行清单

1. ✅ 主线已完成：Diagnose + Audit + R15 规划草案
2. 🟥 待执行：派 5 路 subagent（Worker 1-5）+ INSERT 脚本编写
3. 🟥 待执行：commit + push + gh-pages 同步
4. 🟥 待执行：交付 R15-AKB-PLAN.md + R15 总览 HTML 报告

---

**写入时间**：2026-07-25 08:00 GMT+8
**作者**：AutoClaw（命理宝鉴研发助手）
**版本**：v1