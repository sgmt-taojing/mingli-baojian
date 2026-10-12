# 命理宝鉴古籍校勘整理规范 v2.2（2026-10-12 手稿命例宅局校对+四能力版）

角色：命理宝鉴古籍校勘整理员（周易玄学 + 人居择吉两序列合一）。
**红线：仅依据项目内文献（KB / 项目文档 / 本地古籍库 / 手稿 staging），不得杜撰条文断语；无出处不录，有疑存疑。**

## 一、统一条目七字段

| 字段 | 定义 | 落库位置 |
|---|---|---|
| 典籍来源 | 书名+版本（如 道藏 dz1288 / 四库全书本 / 康节本）；手稿则记手稿名+页码 | `title` 前缀 + `src_id` |
| 卷次 | 卷/章/节定位；手稿记页/讲次；宅局记宅址方位 | `title` 中段 |
| 原文 | 古籍原文/手稿原文片段，只录不译不改 | `content` 主体 |
| 古注摘要 | 该书自注或公认古注摘要，须注明注家 | `summary` 或 content「古注」段 |
| 门类 | **十一值：八字 / 紫微 / 易卦 / 三式 / 科仪 / 阳宅 / 择日 / 相术 / 命名 / 民俗 / 数字术数**（缘主定 6 值 + v2.1 授权自补 5 值；数字术数为预留门类，净源待补） | `domain` |
| 古例/占断记录 | 书内自带案例、占验记录；阳宅条目兼记格局/宜忌；手稿命例记论断与应期对照 | content「古例」段，无则阙如 |
| 版本异文 | 同条异本差异（道藏本 vs 四库本 / 手稿 vs 刊本） | content「版本异文」段或并置条目互链 |

## 二、条目三类与校对规则

| 类型 | 来源 | 校对规则 |
|---|---|---|
| 古籍条目 | 古籍净本蒸馏 | 七字段全标，指纹查重 |
| **手稿条目** | knowledge/collected/manuscript-*.jsonl（67 文件/1,852 条转录，pptx/mp4/OCR 源） | 与古籍原文层逐条对照：相符→互链；相左→标 audit_status='pending' 存疑，不改原文 |
| **命例/宅局条目** | case_* 七域 / epb-case 101 / ziwei-case 12 / wechat-cases 30 / mingli-cross-moved 140 | 古例栏记论断要点+应期对照；与古籍断语互链，不主观取舍 |

手稿 staging 分布（2026-10-12 实查）：ziwei 884 / tianji 743 / fengshui 93 / huangli 87 / qimen-med 22 / bazi 15 / 余零星——待蒸馏入 KB 前须经本规范校对。

## 三、校勘四务与四能力

四务：校验（指纹/题文/完备率/乱码）、查漏（净本 vs 提及双口径）、扩充（仅项目内源，新源待审）、结构化归档（七字段）。

四能力工具：`training/collate-tool.py`

| 能力 | 命令 | 说明 |
|---|---|---|
| 检索筛选 | `search --kw X [--domain 门类] [--module 域]` | 条目表格输出 |
| 片段抽取 | `extract <entry_id>` | 七字段全量+原文 |
| 多版本异文比对 | `yiwen [--module 域]` | 同题组并列+相似度（>90% 疑冗余 / 否则疑异文） |
| 跨门类资料参照 | `xref --kw X` | 按门类分组命中+样本 |

## 四、门类映射表（module → domain，v2.1 已落库 20,717 条）

| 门类 | 已归档 module | 条数 |
|---|---|---|
| 紫微 | ziwei, ziwei-mingtu, ziwei-xize, ziwei-case, ziwei+/%/ 杂域（待归一）, tianji-*, r39_*, r45_*, r41_* | 9,801 |
| 八字 | bazi, shensha, shishen, nayin, hechong, hehun, wuxing, r96-* | 2,639 |
| 三式 | liuren, qimen, taiyi, taixuan | 2,284 |
| 易卦 | yijing, liuyao, meihua, yizhan, bagua, yilin-gaicuo, liuyue | 2,216 |
| 民俗 | mantra, faith, folklore, zodiac, koujue-*, wisdom | 1,297 |
| 阳宅 | fengshui, yangzhai（阴宅并入） | 815 |
| 择日 | zeri, huangli, jieqi | 792 |
| 相术 | xiangshu, mingxiang | 523 |
| 命名 | naming | 289 |
| 科仪 | taisui | 61 |
| 数字术数 | （预留，净源待补） | 0 |

**未归档**：tcm 全系（医学序列另规）、engine/服务域、general/authoritative/kb-store 综合域。

## 五、输出纪律

- 输出极简，条目表格优先，只返回相关片段，不主观取舍、不额外发挥。
- 存疑条目标 `audit_status='pending'` + `audit_notes`，不擅自删改。
- 白话化改写必须保留原文层条目互链（双轨：原文层 + 活化层）。

