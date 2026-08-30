# 命理/中医全流程诊断 + 中医标准智能体能力迁移对账（2026-08-30 R860）

## 一、结论先行

**医学服务能力 = 中医标准智能体（tcm-agent）：已达成路由层 100% 对齐。**
- tcm-agent 路由 164 条；medical-stack 原有 156 条，本次补齐缺口 13 条 → **169 条 = tcm 全集 ∪ 命理宝鉴自有增量 5 条（批注链）**
- 自有增量：`GET /api/annotation-queue`、`GET /api/emr/:id/annotations`、`POST /api/emr/:id/annotate`、`POST /api/annotations/:aid/approve`、`POST /api/annotations/:aid/reject` —— 正是命理师批注环节，符合"唯一区别在批注层"的架构定位
- 知识层：KB 镜像 `tcm-synced-kb.json` 52,655 条 + 自动跟随看守（G1，08-28 上线，mtime 变化即触发重打包）；本次随路由补齐 4 个索引模块（symptom-index.js / symptom-aliases.json / formula-symptom-index.json / syndrome-supplement.json）
- 模型层：舌/面/手/眼四个诊断服务 + vision-gateway + mlx-v8 均为常驻 launchd 服务，与 tcm 同源

## 二、补齐的 13 条路由（全部实测通过，8972 复起验证）

| 路由 | 能力 | 实测 |
|---|---|---|
| GET /api/tcm/entry/info | 证型/药材/方剂词条即点即查（含同脏腑鉴别诊断栏） | 甘草→tcm-herb ✅；脾胃气虚→鉴别 5 条 ✅ |
| GET /api/tcm/entry/names | 药材+方剂+证型正名清单（病历 linkify） | 782 条 ✅ |
| GET /api/tcm/kb/formula-recall | 症状→候选方反向召回 | "胃脘胀痛 嗳气"→canon[胃胀,嗳气] 8 方 ✅ |
| POST /api/tcm/kb/recall-exclude | 症状→方排除事件落库（标签噪声信号） | ✅ |
| GET/POST /api/home/med-adherence | 服药依从回传与查询 | POST→GET 回环 ✅ |
| GET /api/family/members + POST bind/unbind | 家庭账号↔就诊人绑定（隐私合规件） | 鉴权拦截正确（401 非 404）✅ |
| POST /api/followup/dispatch | 随访派发（manual/sms/voice/rcs5g，通道未配置诚实返回） | manual→logged ✅ |
| POST /api/followup/callback | 运营商回执→自动回填随访完成态 | followup_updated=true ✅ |
| GET /api/followup/dispatches | 派发台账+通道状态 | ✅ |
| GET /api/patient/timeline | 患者全景时间线（就诊+随访+评价+依从，恢复曲线 trend） | ✅ |

纪律遵守：全部为**内化移植**（helper 逻辑原样搬运 + 数据文件复用），未做任何二次训练；命理内容未触碰任何医学路由（R756/R757 守卫完好，辨证输出无命理词）。

## 三、中医全流程盘点（medical-stack 现状）

建档（POST /api/patients 系/clinic session）→ 一帧采集（舌/面/手/眼 + 问诊 inquiry/inquiry-frame）→ 多模态辨证（multi-modal-diagnose / seven-diagnosis / inhouse-diagnose）→ 安全审查（safety-check）→ 处方（prescription/create + verify + settle）→ 医技开单（lab/order + result）→ 队列流转（clinic/queue checkin/call/action）→ 随访（create → dispatch → callback 自动回填）→ 慢病管理（chronic assess 四病种）→ 家庭端（members/bind + med-adherence + sos）→ 应急（emergency protocols/events/respond）。
**判定：医院级全链条闭环已通**（08-28 G5 端到端冒烟已验证诊断→批注→病历链；本次补齐随访派发与家庭绑定两块短板）。

## 四、命理全流程盘点（上午 A 线审计整改后现状）

信众/大众面（问事服务中心 22 工具，问答式采集）→ 引擎运算（七盘+民俗，历法内核 9/9 权威参照验证）→ 白话报告（概述+分维卡+行动建议+免责，10/10 全绿）→ 反馈回环（/api/feedback/baihua 准/不准回传蒸馏）。
命理师面（专业排盘，paipan:pro 权限门）：七盘专业渲染 + 点宫/点爻解读 + SVG 盘图。
**A 线整改后关键提升**：时辰默认统一午时+未知披露（H1/H2）、全工具阴阳历输入（H3 实测两口径同盘）、择日/太岁/黄历按生辰个人化（R-PERSONAL）、紫微时辰强警告+闰月、风水建造年运盘、六爻摇卦/梅花报数、起名避讳字。

## 五、合流点（平台核心差异价值）

一帧采集（音视频+八字）→ 中医 AI 诊断（8972 diagnose 系）**∥ 并行** AI 命理（8920 baihua 系）→ 双师审核台：**医生审医学结论** ∥ **命理师批注命理层**（annotation-queue → approve/reject）→ 合并出具电子病历 + 电子处方 + 命理批注。
- 隔离守卫：R745（命理不入医学训练）、R756（医学内容无命理泄漏）、R757（辨证无命理词降级）——本次移植未触碰任一守卫
- 待补强（下一轮）：① 一帧采集页把命理采集（生辰/掌纹特写）与中医采集做成同屏双轨；② 批注层 48h SLA 计时与超时提醒上问诊台首页；③ 患者端报告页合并呈现（病历+处方+命理批注一屏）

## 六、遗留观察项

- medical-stack 的 tcm 能力为**快照内化**模式：tcm 后续新增路由需再次对差（建议每月第一周跑一次本对账脚本，已固化命令见 KANBAN）
- 真太阳时（H4）与风水 24 山精度（H7 深部）属 P2 增强，引擎已支持 lng/minute，前端出生地采集待做
- 随访 sms/voice/rcs5g 外发需配置运营商凭证（data/carrier-config.json），当前 manual 通道可用
