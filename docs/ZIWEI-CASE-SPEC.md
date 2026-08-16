# ziwei-case 模块规范（R119 · 2026-08-16）

> 紫微断病教学案例模块（路总流年班蒸馏）。案例 = 命盘快照 + 疾病标签 + 断病要点 + 调理方向。

## 一、数据来源
- `~/Desktop/周易-中医/案例.pptx`（2026-08-16 用户授权学习）
- 4 张「八字排盘宝-紫微」命盘截图 → autoglm-image-recognition 识别 → 结构化入库
- 关联源：KB-ZW-CASE-001 ~ 004（kb_formal，module=`ziwei-case`，trust 0.85）

## 二、条目结构（kb_formal）
| 字段 | 规则 |
|---|---|
| entry_id | `KB-ZW-CASE-###` |
| module | `ziwei-case` |
| title | `紫微断病案例·{疾病}` |
| content | 性别/出生/四柱/局/紫微/四化/命身宫/命身主/盘面要点 |
| keywords | `路总,流年班,紫微,断病,{疾病}` |
| authority | `yijing-desktop` |
| src_id | `SRC-LD-DESKTOP-案例pptx-20260816` |

## 三、引擎侧镜像（server/huajie-engine.js）
- `ZIWEI_CASES` 常量数组（4 案例 × id/disease/gender/sihua/ming/points/advice）
- `matchZiweiCase(chartSummary, chartResult)`：
  - 主匹配：四化串包含 + 命宫地支一致 + 性别一致
  - 次匹配：化忌尾字（如"机"）+ 命宫一致
  - 无性别/无命宫时宽松放行
- `generateHuajie` 输出 `case_refs`：case_id/disease/points/advice/note（免责）

## 四、前端渲染（app/report-interpret.html）
- huajie.case_refs → 「案例参考（教学对照）」粉色卡片：疾病 + 盘面要点 + 调理方向 + 免责注

## 五、新增案例流程（SOP）
1. 命盘截图 → autoglm-image-recognition 识别
2. 提炼：出生/四柱/局/紫微/四化/命身宫/命主/身主/盘面要点
3. kb_formal 入库（module=ziwei-case）+ FTS5 rebuild
4. 引擎 ZIWEI_CASES 镜像条目（同步 points/advice）
5. 单测 matchZiweiCase（5 组：4 命中 + 1 排除）

## 六、匹配注意
- 四化串是排盘 App 输出（如"戊贪阴右机"），引擎匹配用包含/尾字，避免排盘差异
- 断病输出**必须**带免责（"仅供学习对照，不构成疾病诊断或治疗建议"）
- 案例库扩展上限 50 条（引擎内存镜像，超限改 DB 读取）
