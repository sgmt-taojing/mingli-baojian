# R40-C KB formal 入库报告（2026-07-22）

## 入库概况
- **数据库**：`server/database/yidao.db`
- **表**：`kb_formal`
- **入库条目**：2108 条（R39 五类模型）
- **kb_formal 总量**：1990 → **4098 条** ⭐⭐⭐

## 模型分布
| 模型 | 条数 | 说明 |
|------|------|------|
| r39_dual_core | 1600 | 健康×事业×五行×行动 全联动 |
| r39_health_core | 200 | 健康 8 维 × 5 五行 × 5 行动 |
| r39_career_core | 200 | 事业 8 维 × 5 五行 × 5 行动 |
| r39_palace_12 | 60 | 紫微 12 宫 × 5 五行 |
| r39_lifeplan_stage | 48 | 12 领域 × 4 人生阶段 |
| **合计** | **2108** | — |

## 字段映射
- entry_id ← key
- module ← model
- title ← title
- content ← content
- category ← category
- keywords ← tags (JSON)
- summary ← content 前 200 字
- trust_score ← score / 100
- tags ← tags (JSON)
- source_ids ← sources (JSON)
- promoted_at ← CURRENT_TIMESTAMP
- version ← 'v1'

## 脚本归档
- `scripts/r40-kb-to-sql.js`（JSON→SQL 转换器）
- `scripts/r40-kb-insert-2108.sql`（1.85MB 批量 SQL）

## 后续优化
- R41 可继续入库 2000+ 条（lifeplan 8 阶段 × 12 领域 × 25 古籍）
- kb_formal 总数预计突破 **6098 条**