# WO-002 v9.2 BaziQA 重评定案 + 四路大师蒸馏恢复（轮值周期 #2）
- 发起: AutoClaw（依 R796 协议从 Kimi 旧 backlog 提取）
- driver: Kimi
- reviewer: AutoClaw / 用户
- 范围: training/baziqa + training-data/ + scripts/kb-masters/
- 背景（2026-09-17 AutoClaw 诊断基线）:
  1. v9.2-full488.log 实为无效评估：模型答案 483/488 为空（答案分布 {'':483}），结果 0.6% 不可用，非真实水平——疑为评估脚本与 8960 服务参数不匹配（如 max_tokens/reasoning 解析）
  2. 8960 当前在岗模型 = mingli-sft-v9.0-7b（生产基线 53.9%）
  3. 四路大师蒸馏：scripts/kb-masters/ 有 10 个蒸馏脚本但无常态化调度，nishi_subs_distill.py 硬编码 /Volumes/data2 路径已失效（data2 卷 08-28 确认消失）
  4.（2026-09-17 AutoClaw 补充证据）v9.2 训练侧本身未完成：training/logs/v92-train.log 停在 iter 10（0.106 it/s，序列 1208+ tokens 截断警告），training/mlx-models/ 下仅有 v9.0 adapter，无 v9.2 adapter/融合产物——重评前先确认可评对象是否存在；若不存在则二选一：按 BAZIQA_PIPELINE 重训（增量 base=v9.0）或将 v9.2 线归档定版
- 验收标准:
  1. v9.2 重评跑通全量 488 题，模型答案空值率 < 5%，产出与 v9.0 可比的成绩单（历史日志格式一致）
  2. 重评结论三选一并留证 CHANGELOG：v9.2 ≥ v9.0 → 走 launchd 热切上生产 / v9.2 < v9.0 → 归档定版不入生产 / 数据集问题 → 开审计单
  3. 四路大师蒸馏脚本路径去硬编码（改配置/候选列表 + 源缺失时明确报错不崩），至少一路（nishi 或 tianji）恢复可跑
- 红线: 训练/评估禁 shuffle（BAZIQA_PIPELINE 七教训）；禁假数据入库（KB 五红线）；评估走 8960 本地服务禁止云端
- 交付物: CHANGELOG 条目 + baziqa-results 新日志 + 脚本修真 commit + 轮值台账登记
- 交付时限: 48h（逾期按协议自动轮转）
