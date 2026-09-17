# WO-001 养生域 KB 起批 + STALE 清欠（轮值周期 #1）
- 发起: 用户（「深度优化+建立轮番机制」）
- driver: AutoClaw
- reviewer: Kimi / 用户
- 范围: kb_formal yangsheng/huangli 域 + wechat-platform knowledge/
- 验收标准:
  1. yangsheng 域条目 ≥5（实付 5 条秋分养生入库）
  2. 蒸馏管线落盘→入库→fts5 对齐全链路实测通过
  3. wechat-platform 46 条 STALE 快照归档消除
  4. health-patrol + kb-quality-patrol 全绿
- 红线: docs/KB-QUALITY-RULES.md（R796 长度门槛分域 60/100）

## 交付证据（2026-09-17）
- distill-2026-09-17.jsonl 20 条蒸馏 → 五红线入库 14 条（yangsheng 5 / huangli 5 / bazi 4），跳过 6（指纹重复/过短）
- kb-sync-guard --sync 增量对齐，主表=fts5=251242，patrol 全绿 rc=0
- wechat-platform commit c16102d：yidao.db.stale-snapshot-20260816 归档
- CHANGELOG 条目 + commit d906275c / e7ee99dd

REVIEWED: （待 Kimi 或用户复核签署）
