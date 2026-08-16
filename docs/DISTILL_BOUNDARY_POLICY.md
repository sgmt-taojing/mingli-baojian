# 蒸馏边界规范（DISTILL_BOUNDARY_POLICY）

> 版本：v1.0 · 2026-08-16 · R745 规范化固化 · 适用全项目

## 一、背景与原则

2026-08-16 专项检验发现：桌面「周易-中医」材料蒸馏时，命理/术数内容混入医学 KB
（tcm-agent 权威库 1,133 条、smart-home-family floor_tcm 3 条），并随正向同步传播到消费方。

**核心原则：知识库必须按领域边界隔离——医学 KB 只含医学知识，命理 KB 只含命理知识，交叉引用必须保持语境正确。**

## 二、领域边界定义

| 领域 | 允许内容 | 禁止内容 |
|---|---|---|
| 医学 KB（tcm-* / nihaisha / shanghan-lun） | 中医理论、四诊、方剂、针灸、辨证、运气学说、医案 | 紫微/八字/奇门/六壬/风水/相术/占卜/命卦/大限流年 |
| 命理 KB（ziwei / bazi / fengshui / qimen…） | 排盘、星曜、宫位、大运流年、风水布局 | 医学诊断、处方剂量（如需引用仅作理论示例） |
| 交叉条目（如"五运六气与流年"） | 中医运气学说（黄帝内经理论） | 以命盘预测疾病吉凶的"断语" |

**判定规则（可执行）**：
1. 标题含命理特征词（天纪/紫微/奇门/八字命理/风水/阳宅/阴宅/六壬/梅花易数/占卜/命宫/财帛宫/夫妻宫/流年班/一掌经/相术/玉匣记/撼龙经/葬书/术数/五行命理/大运/运势分析/命理/飞星/四化/星耀/紫微斗数/大限/流年/命卦）→ 污染
2. 内容含 ≥2 个命理特征词 且 医学术语 <2 → 污染
3. **医学前缀豁免**（金匮/伤寒/人纪/医案/本草/汤头/黄帝内经/神农/药性/方剂/针灸/艾灸/穴位/经络/倪海厦人纪/汉唐中医/五运六气）——望诊语境引用"命宫/天纪"不算污染
4. 豁免模块（floor_mingli / ziwei / bazi / fengshui / qimen…）——命理 KB 本身合法

## 三、蒸馏红线（横向蒸馏）

1. **源侧过滤**：从 mingli-baojian 等混合项目蒸馏到医学 KB 时，必须按 module 过滤（仅医学模块），禁止全量搬移
2. **出口防线**：`cron-distill-tcm-outbound.sh` 等出站脚本必须带命理黑名单（标题命中 或 内容 ≥2 词），并计入 skipped['mingli'] 统计
3. **隔离区**：发现污染条目移入 `_mingli_quarantine` 模块（不删除源数据），消费方同步必须排除隔离区
4. **正向同步**：`sync-tcm-forward.js` 等全量同步脚本必须跳过 `_mingli_quarantine`

## 四、巡检自动化（修真后必跑）

```bash
# 内容级污染 + 溯源一致性自动校验
python3 scripts/distill-source-audit.py          # 检查模式（exit 0 = 干净）
python3 scripts/distill-source-audit.py --fix    # 修真溯源不一致
python3 scripts/distill-source-audit.py --json <path>  # 额外检查指定文件
```

已接入 `scripts/health-patrol.sh`。覆盖目标：
- smart-home-family/knowledge/floor_tcm.jsonl（医学楼层）
- tcm-agent/server/kb-store/tcm-synced-kb.json（权威库）
- smart-home-family + mingli-baojian 的 tcm-authoritative.json（消费方副本）

## 五、处置流程（发现污染时）

1. 备份原文件（`.openclaw/tmp/kb-backup/`）
2. 用 `scripts/clean-mingli-pollution.py --dry-run` 预演，人工抽查样本防误伤
3. `--apply` 隔离 → 隔离区 `_mingli_quarantine`
4. 重跑 `sync-tcm-forward.js`（消费方净化）
5. 复跑 `distill-source-audit.py` 全绿后 commit

## 六、审计记录（2026-08-16）

| 库 | 修真前 | 修真后 | 动作 |
|---|---|---|---|
| tcm-synced-kb.json | 污染 1,133 条 (4.0%) | 0 | 隔离入 _mingli_quarantine (1,133 条) |
| floor_tcm.jsonl | 污染 3 条 | 0 | 剔除命卦/紫微十二宫/六壬校正 |
| SHF tcm-authoritative.json | 污染 1,309 条 | 0 | 重同步（排除隔离区） |
| MB tcm-authoritative.json | 污染 1,309 条 | 0 | 重同步（排除隔离区） |
