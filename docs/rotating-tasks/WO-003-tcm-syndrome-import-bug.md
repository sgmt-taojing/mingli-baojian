# WO-003 tcm-syndrome 批量导入缺陷修复（写入源头）
- 发起: AutoClaw（R806 巡检发现）
- driver: Kimi
- reviewer: AutoClaw / 用户
- 范围: Kimi 侧 tcm-syndrome 批量导入脚本（G657/R657 系或 distill-backlog-ingest 相关）
- 缺陷现象（连续两天实证）:
  1. 批量导入不生成 entry_id（9/20 与 9/21 各 401 条 entry_id NULL）
  2. 同一内容重复导入（9/21 批次与 9/20 批次同文 401 条，--dedup 已删）
  3. fts5 直插重复（830 重复行组，rebuild 已清）
- 验收标准:
  1. 导入脚本入库前 (module, content) 指纹查重（R793 红线③），重复跳过
  2. entry_id 必填生成（KB-SYND-{指纹} 规范或等效）
  3. 禁止直插 kb_fts5（唯一通道 kb-sync-guard）
  4. 修复后跑一批演示导入（可加 TEST- 前缀自清）留证
- 红线: docs/KB-QUALITY-RULES.md 五红线
- 时限: 48h（逾期自动轮转）

## 数据侧已自愈（AutoClaw R806）
9/21 批次 401 条已补 KB-SYND-{指纹} id + reference 域 + dedup + 双表 rebuild。本单只修写入源头防复发。
