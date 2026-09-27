# 命理域稀薄模块定性表（2026-09-27 · 全面诊断审计产出）

> 触发：图谱页「⚠️ 41 个模块 <100 条」告警。本轮完成整改后剩 29 个，逐一定性如下。
> 关键背景：FTS5 检索为全库三角匹配，模块标签薄不等于检索不到——bazi 主模块已覆盖 十神75/神煞50/纳音111/合冲32。故多数「稀薄」是标签卫生问题，非知识缺口。

## A. 已整改（本轮执行，审计 logs/kb-thin-module-remediate-audit.jsonl）

| 原标签 | 条数 | 处置 | 去向 |
|---|---|---|---|
| bazi-teaching | 1 | 归并 | bazi |
| liuyao-basics | 2 | 归并 | liuyao |
| wuhou | 4 | 归并 | jieqi（物候并入节气）|
| bazi/ziwei | 1 | 归并 | classics（古籍信息）|
| qimen/liuren | 1 | 归并 | classics（古籍信息）|
| fengshui+yijing | 1 | 归并 | yijing |
| qimen/fengshui | 3 | 归并 | yangzhai |
| ziwei+qimen+fengshui | 1 | 归并 | tianji-jiangjie |
| ziwei/career · relationship · education · real-estate | 21 | 归并 | ziwei |
| fengshui/zexu | 3 | 归并 | zeri |
| xianzhi-lens | 4 | 移出命理域 | domain='tech'（先知智镜 SDK 工程文档，非命理知识）|
| 空摘要 | 6,630 | 回填 | 正文首 80 字，FTS 触发器自动同步 |

## B. 冗余但保留（知识已在主模块厚覆盖，标签作主题索引用）

shishen(11)/shensha(11)/nayin(11)/hechong(11)/bagua(11)/wuxing(95)——bazi 主模块已有厚覆盖（十神75/神煞50/纳音111/合冲32），小标签是主题入口，保留不动。

## C. 蒸馏暂存件（r 前缀，引擎/蒸馏管线工作区，非对外知识模块）

r41_lifeplan_stage(17)/r39_lifeplan_stage(48)/r96-yongshen(48)/r39_palace_12(60)/r96-meta(60)/r96-yueling-jie(60)——不动。

## D. 真缺口（补蒸馏队列，按优先级）

| 模块 | 条数 | 缺口性质 | 补源方向 | 优先级 |
|---|---|---|---|---|
| jieqi | 9→19 | ~~节气物候体系薄~~ ✅ 09-27 已补 | 《月令七十二候集解》全帙入库 10 条（YL72|） | ~~P1~~ 销 |
| taiyi | 11 | 太乙神数近乎空白 | 《太乙金镜式经》 | P2 |
| taixuan | 14 | 太玄经薄 | 扬雄《太玄》+司马光注 | P2 |
| yishi | 20→182 | ~~易林薄~~ ✅ 09-27 已补 | 焦氏易林 16 卷全帙 162 条（YLY|） | ~~P1~~ 销 |
| yunqi | 20 | 五运六气知识薄（引擎强、知识薄）| **改道 tcm 内化通道**（运气七篇属医学语料，ADR-024 不自蒸） | 转 tcm 通道 |
| taisui | 27 | 太岁化解薄 | 道藏太岁科仪+民俗汇编 | P2 |
| folklore | 39 | 民俗杂项 | 地方民俗志 | P3 |
| huangli/zeri | 42/325→730 | ~~黄历宜忌规则薄~~ ✅ 09-27 已补 | 协纪辨方书 36 卷全帙 402 条（XJB|，入 zeri） | ~~P1~~ 销 |
| yilin-gaicuo | 43 | 易林改错专项 | 与 yishi 合并补源 | 随 yishi |
| mingxiang | 18 | 命相同参薄 | 已由 xiangshu(398) 承接大部，定向补「命相互证」专题 | P2 |
| lifeplan/lifeplan-priority | 40 | 人生规划框架薄 | 已有排盘引擎规则，知识化排期 | P3 |
| yangzhai | 18 | 阳宅薄（fengshui 778 厚）| 标签分工保留，阳宅专题补《阳宅三要》 | P2 |
| ganqing | 10 | 感情专题薄 | hehun(209) 已厚，保留作索引 | 不补 |
| huajie | 59 | 化解专题 | r45_huajie_ext(1260) 厚，保留 | 不补 |
| zodiac | 60 | 生肖专题 | 本命佛/冲合已有，可补生肖性情总论 | P3 |
| xingming | 71 | 姓名学中位 | 五格剖象+字形字义可加厚 | P2 |

## 验收基线（整改后 2026-09-27 17:55）

- kb_formal = kb_fts5 = 320,568；NULL entry_id = 0；空摘要 = 0
- mingli 域 18,930 条 / 58 模块（原 63，归并净减 5）
- 稀薄模块 41 → 29（其中 B/C 类 21 个属保留，真需补源仅 D 类 P1/P2 共 9 个）
