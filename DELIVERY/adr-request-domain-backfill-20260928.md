# 裁决申请：kb_formal 空域标归口 + reference 域存量去重

> 发起：mingli-baojian（Kimi）｜日期：2026-09-28｜关联：ADR-024（G24 参考域标注）补遗
> 一页纸，批复后即可执行。

## 一、现状（实测 yidao.db · 321,690 条）

| 域标 | 条数 | 状态 |
|---|---|---|
| mingli | 20,052 | ✅ 09-28 已收敛（0 重复/0 旧指纹/0 碰撞） |
| reference | 36,760 | G24 已标，但有 205 组/410 条同文跨模块重复 |
| tech | 4 | 正常 |
| **空标** | **264,874** | ❌ G24 未覆盖的旧批次，诊疗检索域排除规则对它们**失效**（规则按 domain='reference' 过滤，空标条目仍是"隐身人"） |

**风险点**：空标条目既不在 mingli 也不在 reference，G24 定的"诊疗只命中 tcm 移植栈 + authoritative"检索排除无法约束它们——二十多万条医学旧条目处于规则真空。

## 二、空标归口方案（四桶映射，只改标签不动内容）

| 目标桶 | 模块范围 | 条数 |
|---|---|---|
| reference（医学典籍/课程） | tcm 201,989 · shanghan-lun 16,968 · tcm-fangji 12,689 · tcm-diagnosis 8,155 · nihaisha/nihaisha-tcm 6,490 · yizong-jinjian 2,687 · jingyue 2,616 · bencao-gangmu 2,541 · qianjin 758 · huangdi-neijing 623 · shuhan/shuihan-tcm 505 · mingyi-leian 463 · zhubingyuanhou 270 · rumen-shiqin 218 · wenbing/wenre/wenyi 328 · jiayi-jing 186 · maijing 116 · nanjing 66 · piwei-lun 58 · jinkui-yaolue 55 · shennong-bencao 33 · danxi 34 · yangsheng 54 · tcm-* 余部 · r491_* 医学蒸馏 928 | ≈ 261,000 |
| reference（诊疗引擎知识） | syndrome/chronic-disease/pulse/classics/constitution/drug-safety/dosage/safety/compliance/tongue-inhouse/dual-constitution/causality/pathway/recommend/dialogue-engine 等 + engine_compare + r491_r_engine_meta | ≈ 200 |
| mingli（命理归队） | authoritative 1,462（己土/世爻等 premium 命理内容）· r45_shishen_ext 500 · naming 289 · r45_palace 168 · mingli-cross-moved 140 · ziwei 及 ziwei,* 混拼 386 · r45_lifeplan 80 · r45_shishen 50 · r45_huajie 40 · qimen 39 · r96-* 146 · r41_dh_huajie4 30 · koujue-* 52 · yanzhi 32 · tianji-mingli 12 · ziwei-case 12 · distill_* 命理系 ~20 · case_* 12 · fengshui 1 | ≈ 3,470 |
| quarantine（乱码/垃圾） | general 260（实测为二进制乱码乱文）· kb-store/knowledge-raw/knowledge-supplement/kb-supplement 305（原始暂存遗留，逐条抽检后定） | ≈ 565 |

未列明小模块（epb-* 企业合规、wechat-cases、master-class、shop、mobile、ai-prompt 等 ≈ 500 条）执行时逐条抽检归桶，抽检样本入证据件。

## 三、reference 域 205 组去重建议（tcm 通道侧）

- **根因**：tcm 内化吸收时同文跨模块双收（tcm-diagnosis↔tcm-wangzhen、tcm-syndrome↔distill_* 对子），吸收端缺内容指纹幂等
- **建议**：① 增量——tcm 吸收管线加 sha256[:16] 内容指纹幂等闸（与 KBIngestor 同规）；② 存量——205 组每组留高 trust/先入库一条，余者删除（删前 jsonl 留证，同本侧 09-28 先例）；③ 或由裁判指定单侧执行，本侧可代劳但需跨界授权

## 四、分工与验收

- **本侧可做**（批复后即执行）：mingli 桶 3,470 条归队 + quarantine 桶处置 + 小模块抽检；执行前后各跑一次"诊疗查询参考域不命中"验证（G24 口径）
- **需裁判/tcm 通道**：reference 桶 261k 条标注（量大，建议脚本化批处理，本侧可提供脚本）+ 205 组去重拍板
- **验收**：四桶归口后 `SELECT domain, COUNT(*)` 空标归零；诊疗检索域排除实测生效；证据件落 DELIVERY/g-domain-evidence-<时间戳>.json

## 五、不做的事

不改内容、不删知识、不动 trust 标、不触碰 tcm-authoritative 正室条目、不重新训练。
