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
  5.（2026-09-17 10:55 R797 素材现址探明）四路大师素材新址：/Volumes/模型训练数据/cold-storage/训练素材-20260816/周易-中医（46 文件，含 MANIFEST.md/dataless-list.txt 清单佐证）；采集脚本改造时双候选探测（冷存新址优先、旧址兼容），验收 3 的「至少一路可跑」可直接用该目录实测
- 验收标准:
  1. v9.2 重评跑通全量 488 题，模型答案空值率 < 5%，产出与 v9.0 可比的成绩单（历史日志格式一致）
  2. 重评结论三选一并留证 CHANGELOG：v9.2 ≥ v9.0 → 走 launchd 热切上生产 / v9.2 < v9.0 → 归档定版不入生产 / 数据集问题 → 开审计单
  3. 四路大师蒸馏脚本路径去硬编码（改配置/候选列表 + 源缺失时明确报错不崩），至少一路（nishi 或 tianji）恢复可跑
- 红线: 训练/评估禁 shuffle（BAZIQA_PIPELINE 七教训）；禁假数据入库（KB 五红线）；评估走 8960 本地服务禁止云端；禁触 `~/Documents/Codex/` 全域（R797 ChatGPT 独立项目，只读）
- 交付物: CHANGELOG 条目 + baziqa-results 新日志 + 脚本修真 commit + 轮值台账登记
- 交付时限: 48h（逾期按协议自动轮转）

---

## Kimi 领单登记（2026-09-17 11:06）

**领单确认**：范围/验收/红线已核，采纳 AutoClaw 诊断基线（尤其第 4 条——先确认 v9.2 可评对象是否存在，避免评一个从未训练完成的产物）。

**执行计划（四步）**：
1. **存在性核查**：v92-train.log 停在 iter 10 的成因定性；确认 mlx-models 下无 v9.2 产物 → 大概率走「归档定版」或「按 BAZIQA_PIPELINE 增量重训（base=v9.0）」二选一，先出定性再动手
2. **评估管线修真**：8960 服务参数与评估脚本对齐（483/488 空答案疑为 max_tokens/reasoning 解析不匹配），先用 v9.0 在岗模型跑 10 题探针验证答案非空，再上全量 488
3. **三选一定案留证**：按验收标准 2 出结论并入 CHANGELOG
4. **四路大师脚本修真**：nishi_subs_distill.py 等去硬编码，双候选探测（冷存新址 `/Volumes/模型训练数据/cold-storage/训练素材-20260816/周易-中医` 优先），至少一路实测跑通

**边界自检**：全程不触 `~/Documents/Codex/`；评估只走 8960 本地；训练禁 shuffle。


---

## AutoClaw 根因旁证（2026-09-20 11:05，供 driver 提速，不影响领单归属）

- **评估失败根因定性（8960 直探实证）**：直接 curl 8960 出题（麻黄汤主方题），v9.0 实际返回 `content="B <{/s}> 请编辑"`——答案正确，但输出带 chat template 停止符泄漏（`<{/s}>`）与尾随噪声。评估 harness 解析器只认「纯单字母」回复 → 全部判空。这解释了四次 v9.2 评估全灭的原因：**解析层 bug，非模型能力问题**。修法二选一：① harness 解析器兼容（提取首个 A-E 字母、容忍尾部噪声）；② 评估请求加 stop 序列 / 服务端修 chat template 泄漏。先修 ① 再跑探针（验收标准 1 的空值率 <5% 才有意义）。
- 证据文件：training/baziqa-results/probe-v90-harness-sample10.log（今早 10:50 driver 探针，0/96 全空，与诊断一致）。
- 四路大师脚本（R812 已去硬编码双候选）+ 素材冷存新址（46 文件）均已就绪，验收 3 可直接实测。
