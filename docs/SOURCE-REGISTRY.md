# 知识源注册表（MB-K1 · v1 · 2026-09-26）

> 一切入 KB 的知识必须带已注册 src_id；新源先登记后使用。
> trust 分档：0.9 权威经典原典 / 0.8 名家原著与老板亲授 / 0.7 公版网络净本 / 0.5 待核 / <0.5 拒。

## 命理域源（自有）

| src_id | 名称 | 类型 | trust | 入口管线 | 状态 |
|---|---|---|---|---|---|
| SRC-BOSS-MANUSCRIPT | 老板亲授稿件 67 份（倪师/舒晗/路总课程、流年班、风水典籍） | 稿件蒸馏 | 0.8 | manuscript-extract.py + manuscript-ocr.py（v2-ocr） | 活跃 |
| SRC-CLASSICS-WEB | 公版古籍净本（维基文库/ctext/archive.org，见 docs/CLASSICS-COLLECTION.md） | 古籍净本 | 0.7 | 蒸馏链（rules/g2） | 活跃 |
| r491-nihaisha-v1 | 倪师天纪系列蒸馏 v1 | 课程蒸馏 | 0.8 | 既有批次 | 已晋升 600 |
| SRC-BOOK-018 | 典籍书籍批次 | 书籍 | 0.8 | 既有批次 | 已晋升 380 |
| SRC-EXPERT-002 | 专家稿件批次 | 稿件 | 0.8 | 既有批次 | 已晋升 361 |
| SRC-LEGACY-* | 历史遗留批次（001~033 等） | 遗留 | 0.6~0.8 | 既有批次 | 部分晋升 |
| SRC-KR3e* | Kanripo 漢籍術數類批次 | 古籍 | 0.9 | ingest-kanripo-batch* | 已入库 |
| wikisource 批次 | 维基文库古籍（ingest-wikisource-batch13 等） | 古籍 | 0.7~0.9 | ingest-wikisource-* | 已入库 |
| kb-web-distill | 夜间网络蒸馏（节气/六爻/紫微等主题） | 网络蒸馏 | 0.6 | distill-backlog-ingest.py（cron 22:47） | 活跃 |
| celebrity-ingest | 名人八字事件校验库（维基 603 人） | 校验集 | 0.7 | celebrity-ingest.py | 活跃 |

## 医学域源（tcm 栈供给，只移植不训练）

| 源 | 说明 | 边界 |
|---|---|---|
| g25-ocr:* | tcm 侧 G25 医学 OCR 蒸馏同步（名医医话/明清全书/医案等） | 经 15min 通道内化，不打参考域标 |
| tcm-authoritative / medical-stack | tcm 权威库与移植栈 | 诊疗唯一正室（G17/G18/G24） |

## 红线

- 医学内容不入命理蒸馏（MEDICAL_RX 门）；命理/医学合流仅限批注层（R745/756/757）。
- 防幻觉：LLM 不得凭空生成事实条目入库；网络源宁缺毋滥。
- 原件只读；回执唯一写点 `/Volumes/模型训练数据/知识原始材料/管理/提取回执.json`。

## 晋升 SLA（衔接 R470 自动晋升）

| 阶段 | 时限 | 责任 | 规则 |
|---|---|---|---|
| staging 入队 → 一审 | 48h | 管线自动 + 周检抽检 | 五红线门已过即一审合格；锚点/医学门误杀周检复核 |
| 一审 → 晋升 | ≤7d | staging-auto-promote.js | audit_status=approved + confidence≥0.85 + 满 7 天 + 指纹非空 → 自动晋升 |
| 滞留 >14d | 周报亮红灯 | 活化周报 | 逐条裁决：升 / 拒（写原因），参照 staging-knowledge-adjudicate.py 范式 |
| 拒条目 | 即时 | 管线 | 必须写 audit_notes 原因，禁止无理由拒绝 |

## 活化周报

- 脚本 `scripts/kb-activation-weekly.py`，launchd `com.mingli-baojian.kb-weekly` 每周一 06:41 运行；
- 产出 `DELIVERY/kb-activation-weekly-<日期>.md`：staging 滞留账龄、晋升/拒绝比、命理域总量与增量、OCR/蒸馏队列状态、SLA 红灯项。
