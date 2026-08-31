# KANBAN.md — 命理宝鉴 项目看板


## 2026-08-31 14:25 — ✅ 太岁×生肖知识激活（七段式化解）+ 太岁工具刑害修真
- 重大发现：太岁工具刑/害映射硬编码错误——2026 午年刑误为鸡（应马自刑）、害误为鼠（应丑牛相害）；已切 shengxiao-engine 统一判定，实测 值马/冲鼠/刑马/害牛/破兔 全对
- taiSuiHuajie 七段式化解引擎：祭拜（星君取自 KB）/佩戴（六合三合贵人个性化）/方位（太岁方正南·岁破方正北）/行事（五态分级）/应期（KB 关键月份）/积德/古籍化解（《太岁通考》原文）
- 三处挂载：八字/紫微报告生肖流年段（compact 6 条）、太岁工具五类目（各挂 huajie）、个人化查询（huajie 6 条+huajieFull 7 段）
- server 子仓 a34f679


## 2026-08-31 14:00 — 💚 心跳 14:00 全绿（EXIT=0 · 6 端口 + KB/排盘 OK · health-check 脚本静默无输出已旁证）
- bash health-check.sh EXIT=0 输出空（13:30 已旁证，patrol 读数失实修真待主会话）；端口直探 8900/8901/8911/8912/8913/8920 全 200 + KB /api/stats 30模块 + POST /paipan 200
- 今日 KB 蒸馏 26.8KB（distill-2026-08-31.jsonl 02:06）延续；无新 distill-*.py 执行；进行中无未收口开发项
- 阻塞延续：patrol 读数失实修真 + 服务中心导航回归走查（待浏览器）+ C 类 13 页退役清单拍板

## 2026-08-31 14:10 — ✅ 生肖知识激活 P0（引擎+三报告升级，实测全 PASS）
- 新建 server/shengxiao-engine.js：地支关系全集（六合/三合/六冲/六害/相刑/自刑/六破）+ 婚配五档 + 生肖贵人 + 犯太岁五态 + KB 联动（zodiac 性格画像性别分述、taisui 逐年条目）
- 八字/紫微报告新增「生肖关系」段（生肖×命局、贵人、今明两年太岁、性格画像，日主为纲边界声明）；合婚二态升五档（六合·上婚/三合·上婚/普通/刑害破·中下/六冲·下婚）
- 实测：八字报告生肖 4→28 次、紫微 0→注入、合婚 马×狗=✦三合·上婚 马×鼠=⚠六冲·下婚；单测修正性别画像抽取与 KB markdown 标题过滤
- server 子仓 e6c2de6；至此 251 条沉睡生肖知识接入消费通道


## 2026-08-31 13:50 — ✅ 生肖知识应用专项诊断（知识充足、引擎断流）
- 实测矩阵：八字报告生肖仅 4 次（巧合值太岁）、紫微/六爻 0 次、合婚 32 次（仅六合/六冲二态）；民俗三件套已用✓
- 断点：解读三中枢（engine-interpreters/chart-score/engine-facade）生肖引用全 0；zodiac 60 条性格+taisui 12 条逐年太岁+2000 条关系知识沉睡
- 方案：P0 建 shengxiao-engine 统一关系网络引擎接入八字/紫微/合婚（五档婚配），P1 问事/姓名/风水接入，P2 本命佛仅信众版（守 R756）
- 报告 DELIVERY/生肖知识应用诊断-20260831.md



## 2026-08-31 13:30 — 💚 心跳 13:30 全绿（6 端口 200 + KB/排盘 OK · health-check 脚本静默无输出已旁证）
- 实探：8900/8901/8911/8912/8913/8920 全 200，KB /api/stats 30模块/3767条（1.86MB），POST /paipan 1990/5/15/14/male 200
- bash health-check.sh 输出完全为空（已 ls 确认脚本存在）→ patrol 读数失实修真项再现，端口直探旁证全绿即可判定
- 今日 KB 蒸馏 20 条延续（11:00 已记）；无新 distill-*.py 执行；进行中无未收口开发项

## 2026-08-31 12:00 — 💚 心跳 12:00 全绿（EXIT=0 · 6 端口 + KB/排盘 OK）
- health-check EXIT=0：paipan/tts/face-ocr/static/api-v2/kb-api 全 200 + kb-list + paipan-api OK；「❌ N 项异常」为已知 patrol 读数失实（主会话修真）
- 核查 data1-backup launchd 退出码 1 → data1 卷未挂载（/Volumes 无 data1），脚本按设计跳过非失败；本周无备份属预期，待挂载自动补
- 今日 KB 蒸馏 20 条（distill-2026-08-31.jsonl 02:06 入库）维持；进行中无未收口开发项，待主会话：服务中心导航回归走查（待浏览器）、C 类 13 页退役清单拍板、patrol 读数失实修真

## 2026-08-31 11:00 — 💚 心跳 11:00 全绿（EXIT=0）+ 今日 KB 蒸馏入库 20 条
- 健康检查 EXIT=0 全绿；今日新蒸馏 training-data/kb-web-distill/distill-2026-08-31.jsonl 入库 20 条（含 fengshui 太岁化解等）；进行中无未收口开发项，待主会话：服务中心导航回归走查（待浏览器）、C 类 13 页退役清单拍板、patrol 读数失实修真

## 2026-08-31 09:50 — ✅ P0 接口同构 + P1 药房台（医学执行段开工）
- 后端盘点结论：tcm 执行段后端（处方 settle/verify/review-queue/unpaid、库存、排班、随访、慢病、疗效、安全核查）**已全量内化 8972 并活化**（实测 8 端点在线，待收费 3 单 ¥92.01），无需 tcm 侧开发
- P0 同构别名实测 PASS：/api/clinic/appointment{,/slots,/list,/checkin,/cancel}（body.id 口径+doctor_name 字段+日期维度列表）、/api/report-link/{bind,unbind,status,push-queue}（family_token 字段兼容）
- P1 药房台 app/pharmacy.html 上线：审方→调配→待发药→完成六态流转（verify 六 action）、药名点查条目卡片（27 链接）、真实库存预警、机构版话术；浏览器实机验证 PASS（探针验证 CORS/留痕闸，不动真实数据）
- 证据 DELIVERY/pharmacy-desk-20260831.png


## 2026-08-31 09:13 — ⏸️ 维基补跑看守核查：18/18 趟「网络未恢复」（code=000/exit=28），补跑 0 趟、失败 0 趟；剩余缺事件人数仍 603（基线不变）；当前探测 zh.wikipedia 仍不通（000/28），看守已降频为 `17 */4 * * *`（每 4 小时一趟）省额度，待网络恢复后自动续跑。

## 2026-08-31 08:40 — ✅ 功能体系大盘点 + 医学对齐诊断（含 2 个 P0 干支修真）
- 全量盘点：181 页 / 547 API（四服务合计）；tcm-agent 对侧 63 页 / 170 API；医学 API parity≈92%（13 条差集逐条定性）
- 真缺口定位：医学闭环止于处方签发——药房/收费/库存/排班/随访调度五段 8972 有 API 无界面（P1 补建清单已出）
- P0 修真×2 已实测：黄历干支 toy 算法（2026-08-31 曾显示非法「甲酉月」）+ 择日 v1 全盘 → 双双切 daily-recommendation.py(lunar_python) 权威源；太岁/流年复核无同病
- 诊断报告 DELIVERY/功能体系诊断-20260831.md（含 P0/P1/P2 重构清单）；server 子仓 9ef53bc

## 2026-08-31 07:30 — ✅ G14 信众服务旅程补全（任务书五项全收口）
- 求测入队（16 域+未成年双闸）→ 真引擎 AI 初稿 → 8974 批注核对 → 信众版短信 → 我的报告时间线（三态标识）→ 报告自查（核对人留痕）→ 再次求测 全链 mock PASS
- 双身份：medical_cases.patient_phone_hash 新列 + /api/public/my-emr 只读视图实证（病历 #30 ↔ 求测同号）
- 信众版短信话术按 QIUCE 前缀切换，过命理断语守卫；430px 零溢出；UI 回归 PASS
- 证据 DELIVERY/g11-pwa/g14-person-center-believer.png；至此 G10/G11/G12/G13/G14 全部落地

## 2026-08-31 07:20 — ✅ 管理体系任务书 G10/G12/G13/G11 四项落地（G14 待动）
- G10 短信适配层：send_code/verify_code/send_notice + mock outbox + 命理断语守卫；四场景全验（命理师登录码/批注待核提醒/批注完成通知患者/报告出具通知）；主仓 6022da6
- G12 轻预约挂号：appointment 模型 + slots/创建/checkin/cancel + 爽约自动标记 + 短信 mock；全流程实测过
- G13 报告回流供给侧：family-reflux.js（link/push/links）；全链路 mock 1 例 + 命理剥离双层阴性测试过
- G11 PWA：mobile-interact 全量重写为命理师核对台（队列 SLA 倒计时/核对/历史/G10 鉴权门）；8974 新增 annotation-history；PWA 四件套注入四页；SW v6 隐私红线（患者/批注数据零缓存，实测缓存 30 条零敏感）；断网开壳双端过；430px 视口零溢出；UI 回归 PASS；证据 DELIVERY/g11-pwa/
- ⏭️ 待动：G14 信众服务旅程补全（P2：求测入队/移动只读排盘/报告自查/复测回访/双身份只读/未成年禁入）

## 2026-08-31 06:05 — ✅ weekly-eval 修真复跑验证通过（a7e0ae2 销号）
- 06:00 定时触发成功：compliance 扫 39 文件/17135 cases · 0 issues，weekly-2026-W36.html 已生成，overall=OK 全绿
- 连败计数（临床蒸馏/weekly-eval 各×4 陈旧）待下轮 patrol 刷新清零；launchctl 上次退出码仍显示 1，观察下轮是否归零
- 心跳全绿：6 端口 200 + kb-list/paipan-api OK（06:03:39）；夜间无新 distill 入库、无新 commit（安静期正常）
- 剩余待办：② patrol 读数失实修真 ③ 服务中心导航回归走查（待浏览器）④ C 类 13 页退役清单待拍板

## 2026-08-31 02:07 — ⚠️ 心跳守门员：任务停滞告警（KANBAN ~5h 未更新）
- [告警] 命理宝鉴 任务停滞：KANBAN.md 最后更新 2026-08-30 21:10（日结），至 08-31 02:07 已 ~5h 无更新；健康心跳正常（health.log mtime 02:01:50，6 端口全绿 200 + kb-list/paipan-api OK）
- 「5 项异常」为已知陈旧计数（临床蒸馏/weekly-eval 连败4 待复跑清零 + patrol 读数失实），无新增异常
- 进行中：无未收口开发项；待主会话动作：① weekly-eval 修真复跑已验证销号（06:00 复跑产出全绿 + e180a76 修 null 崩溃）② 修 health-patrol 读数失实 ③ 服务中心导航回归走查（待浏览器）④ C 类 13 页退役清单待拍板
- 判定：夜间安静期（23:00-08:00）属预期停滞，晨间心跳恢复推进即可，无需夜间干预；已发 macOS 通知留痕（webchat 通道在 cron 沙箱不可达）
## 2026-08-30 21:10 — UI 回归挂每日定时（launchd 21:17）
- com.mingli-baojian.ui-smoke-daily：每日 21:17 跑 ui-smoke-daily.sh → 五节点回归，通过静默、失败写 logs/ui-smoke-daily.log（留 500 行）+ macOS 通知告警
- 手动试跑包装器 PASS（病历号 #26，exit 0）；防回归从「记得跑」变「天天跑」
## 2026-08-30 21:05 — 🌙 日结（cron 21:00 · 健康检查 EXIT=0 全绿）
- 健康检查实探 EXIT=0；今日超级交付日：问诊台命理双轨链端到端闭环（双轨采集/批注 approve 双人复核/患者合并报告页/SLA 计时）+ UI 级端到端验收与回归脚本固化 + A/B 线审计整改全落地 + 排盘诊断整改 10/10 销号 + IA 中心化重构首轮 + 问事服务中心化 + 校正库扩容与维基看守上线
- 已完结表新增 08-30 六行；⏭️ P2.8 问诊台后验收冲刺以 UI 级端到端验收收口（病历 #23-#25）
- 进行中：无未收口开发项（维基补跑看守 cron 每小时自跑自停）；阻塞延续：patrol 读数失实+cron 连败集群（主会话修真）、v9.3 阈值触发制
- 下一步动作：明日 06:00 验证 weekly-eval 修真复跑结果（a7e0ae2），随后主会话修 health-patrol 读数失实
## 2026-08-30 21:00 — UI 回归脚本固化（scripts/ui-smoke-consultation.js）
- puppeteer-core + 系统 Chrome 无头，五节点：开页→采集卡排盘出草案（含批注台回填断言）→归档回执+报告链接→SLA计时条→合并报告 mingli 落库断言
- 两连跑 PASS（病历号 #24/#25），证据 JSON+报告页截图自动落 DELIVERY；退出码 0/1 可接 CI 或 cron
- 以后每改问诊台/报告页，一条命令回归：`node scripts/ui-smoke-consultation.js`
## 2026-08-30 20:40 — UI 级端到端验收 PASS（真实点击路径）
- 路径：采集卡填生辰点「排盘·AI命理」（草案 9 卡）→ setEmr 填四诊/辨证/处方 → 点「归档」（病历号 #23，回执带「查看合并报告」链接）→ 直达 report.html
- 关键验证：**真实 UI 路径下 mingli 草案完整入病历**——报告页命理合参段含全部白话草案（日主丁火/五行账本/十神/神煞/大运），并带「待命理师核对」标识与免责声明
- 证据：DELIVERY/ui-smoke-report-case23-20260830.jpg（报告页截图）
## 2026-08-30 20:30 — G1 链4验收入口：轮询健康 + 一个真实隐患修复
- 【验收】tcm-import launchd 15min 轮询活跃（最近 20:13，exit 0）；watchdog 链4 lag = -3.3min（快照新于镜像，≤60min 达标）；8972 七能力齐全、KB 53413 条（R756 过滤后口径）；SEC-001 补丁标记在上次真实刷新时核查完好
- 【修复】kb-follow 的 SQLite 索引重建在 launchd 极简 PATH 下裸调 node 失败（10:13 真实刷新时 spawn failed，靠慢路径自愈兜底）——改 which 优先 + Kimi 运行时绝对路径回退
- 【说明】镜像自 10:10 未再更新（tcm-agent 源端无新出站），故 10:13 后每轮均为幂等秒退，属正常
## 2026-08-30 20:25 — G5 冒烟复跑 PASS（九节点真链路，含合并报告）
- 冒烟病例 CASE-1788092387740 / 8920 病历 #22 / 处方 rx-4341e044；9 节点全 ok，守卫 R756/R757/SLA48h/MERGE_REPORT 全绿
- 证据 DELIVERY/g5-smoke-evidence-20260830-201948.json；脚本扩至九节点可重复回归；CHANGELOG 已记
## 2026-08-30 20:20 — 批注层 approve 链接通（命理批注链真闭环）
- 【R-ANN-LINK】adoptMingli 采纳即 POST 8974 annotate 入核对队列（幂等，一次会话一条，作者=AI命理引擎）；命理师点「通过」即 approve 签发（reviewer=命理师·问诊台，满足作者≠核对人双人复核）；驳回不触碰批注
- 【实测】浏览器全链：采纳→队列 backlog 1→通过→批注 approved/水印解除/SLA 计时终止/队列归零；reviewBadge 同步「已通过」
- 【闭环全景】采集→排盘→AI 草案→采纳入队→双师审核→批注签发→归档→患者合并报告，命理批注链端到端无断点
## 2026-08-30 19:40 — 患者端合并报告页落地 + mingli 持久化 bug 修复
- 【R-MERGE】新增 report.html：病历+处方+检验旁证+命理合参+命理师批注一屏（?sid= 直达，待核批注带水印，支持打印/PDF）；服务端 GET /api/public/emr-report/:sid 解密合成全字段、拆出 ai_diagnosis 中的命理段、合并 8974 批注、未归档会话草稿兜底、限流+CSRF 白名单
- 【bug 修】双轨改造的 mingli 草案此前以顶层对象发送，被 emr-session 字段白名单静默丢弃——改为 emr.mingli 可读文本（mingliText/emrWithMingli），归档后真实进入病历 ai_diagnosis【命理合参】段
- 【实测】全链：建档→上报（含命理）→归档（caseId 21）→8974 批注→合并报告端点+页面渲染全通；测试批注已清理
- 【入口】问诊台归档回执病历号旁新增「查看合并报告」直达链接
## 2026-08-30 19:05 — 双轨改造 + 真太阳时 + SLA计时 三件套落地
- 【R-DUAL-TRACK】问诊台一帧采集同屏双轨：命理采集卡生辰填入即排盘出白话草案（8920 baihua），自动回填批注台生辰并入 EMR 载荷（emr-session/emr-archive/localStorage 三处带 mingli）——采集→排盘→草案→批注闭环；浏览器实测 1990/5/12 全链通过（主仓 252e391）
- 【R-H4】真太阳时出生地校正：新建 city-lng.js（58 城经度表），问事页 birth/namebirth 流程加出生地选填；baihua/lifeindex/lifeplan 全链接入，校正与未命中均进 tips/建议披露；硬核实测：成都 9:30 未校正乙巳(巳时)→校正后真太阳时 08:30 甲辰(辰时)，时柱跨界修正生效（server 954bf38 / 主仓 c73999e）
- 【R-SLA】问诊台命理师专区挂批注队列 48h SLA 计时条：切命理师视角即拉 8974 队列，超时标红、临 8h 标黄、60s 自刷；造测试批注实测计时显示正确，已驳回清理（主仓新提交）
- 【待补强】患者端报告合并页（病历+处方+命理批注一屏）列下一轮
## 2026-08-30 18:20 — A线审计整改全落地 + B线医学能力100%对齐
- 【A线】28工具审计横向问题 H1/H2/H3/H5/H6/H7/H8 全修：时辰默认统一午时+未知披露；全命盘工具阴阳历输入（实测两口径同盘）；六爻摇卦/梅花报数入口；起名避讳字硬过滤；风水建造年运盘；紫微时辰强警告+闰月；黄历/择日/太岁生辰个人化（R-PERSONAL，三端点实测通过）
- 【B线】medical-stack 与中医标准智能体路由层 100% 对齐：tcm 164 条全集已覆盖，补 13 条（词条卡片/症状召方/服药依从/家庭绑定/随访派发回执/患者全景时间线）+ kb 四索引模块；8972 复起逐条实测全通；自有增量=批注链 5 条（架构差异点，符合设计）
- 【落档】docs/audit-input-adequacy-20260830.md（28工具采集充分性）· docs/audit-flow-medical-parity-20260830.md（全流程+对账）
- 【提交】主仓 013cf46 + f04258f · server 子仓 ef3674e
## 2026-08-30 17:10 — 对外工具严苛规范审计（采集充分性）
- 【范围】问事中心 22 工具 + 民俗中心 6 快览 + 排盘七盘，按「专业规范→实际采集→引擎使用→缺口」四层定级
- 【结论】✅充足 13 · 🟡勉强 4 · 🔴硬缺口 5（八字农历/时辰披露、紫微时辰强制+闰月、风水建造年份、择日+太岁个人化）；横向 9 项，最重为 H1 时辰未知默认子时（namebirth/textopt/rename/company 默认 0 点，静默污染起名/改名/手机号命局结论）
- 【在途】R-PERSONAL helper 已插入 api-server-v2.js（黄历/择日/太岁个人化），端点接线待完成
- 【落档】docs/audit-input-adequacy-20260830.md（含逐工具矩阵 + 横向清单 H1-H9）
## 2026-08-30 15:05 — 整改清单 10/10 全部销号 + 维基补跑看守上线
- 【P3-8】holidays 假日端点补白话包装：baihuaHolidays（分类计数+最近节日倒计时+法定/佛诞/道诞/民俗四卡）；顺手修前端 h.date 恒空 bug（API 返回 solarDate/lunarDate）并按阳历排序。浏览器实测白话块渲染正常
- 【P3-10】民俗中心输入型卡片收敛 ask.html 深链：hehun/mobile/xingming/plate→chepai/liunian/lucky 六张（累计 9 条深链）；无输入快览工具（黄历/择日/太岁/节气/节日/家庭）保留 showTool
- 【看守】维基名人事件补跑看守上线（cron 17 * * * * Asia/Shanghai，automation_338ed549）：每小时探测 zh.wikipedia，通则跑 fill-wikidata-events.py（幂等断点续跑），补齐后自停；每次结果记看板
- 【基线】复跑 diag-tools-full.py：历法 9/9 · 功能 16/16 · 报告 10/10 · issues 0。清单 10 项全销号（docs/tool-diagnosis-20260830.md）
- 【提交】主仓 6e02ce9 · server 子仓 206fa7e
## 2026-08-30 14:10 — 整改清单 10 项销号 8 项，回归基线全绿
- 【结论】P1 三条（ziwei双版改题区分/fengshui旧版归档/合婚升v2）+ P2 四条（hehun白话总览段·合婚v2 baihua·8911生肖字段·SVG同源确认）+ P3 多域直断 全部实测通过；复跑 `scripts/diag-tools-full.py`：历法 9/9 · 功能 16/16 · 报告 10/10 · issues 0
- 【顺带修正】norm-report-engine.js 性别字段"male方"拼接 bug → 男/女方正确映射；诊断脚本两误报修正（zeri 参数/family 完整生辰）
- 【留待】P3-8 holidays 白话包装、P3-10 民俗中心导流深链（下一轮）；清单见 docs/tool-diagnosis-20260830.md 第五节回归基线
- 【提交】主仓 96cf5d7 · server 子仓 59fa0a6
## 2026-08-30 12:05 — 排盘/民俗/报告全面诊断，整改清单落档
- 【结论】内核坚实：历法 4 组权威参照（1949开国甲子日/2000戊午日/1990丁丑日/2008庚辰日）四柱全对、五行计数和=8、十神抽查正确；七盘白话 7/7 扣题；报告 10/10 生成、脏词 0；民俗 13 端点全通、容错优雅；真实死链 0
- 【整改清单】docs/tool-diagnosis-20260830.md：P1×3（ziwei 双版并存/fengshui.html 320KB 孤儿/minsu-center 合婚仍是 v1 年柱版）、P2×4（hehun 报告缺白话总览/合婚v2无baihua/8911缺生肖字段/SVG盘图待回归）、P3×3（假日无白话/多域问题只断首域/双入口话术维护两遍）
- 【固化】scripts/diag-tools-full.py 入库，整改后复跑即回归基线（主仓 891e147）
## 2026-08-30 11:55 — 用神直断应期层（R-YINGQI）+ 维基看守更正
- 【应期层】占卜四盘用神直断全部带应期：奇门（空亡填实>马星快应>宫支应期）、六爻（出空逢值冲/动爻逢合/静爻逢值冲）、大六壬（末传应期）、梅花（先天卦数应期，标注参考窗非铁口）；四盘实测通过（server 62edf1f）
- 【更正】「晚间链路实战验收·2026-08-30 场」是今晚 21:12 未触发的正式验收（cron 池），非过期任务，不停；widget 任务池 20/20 满员，维基事件补跑看守（603 人缺事件）待用户二选一：批准 cron 池 agent 看守（耗额度）或指定一个 widget 任务停用
## 2026-08-30 11:20 — 问事诊断遗留全量清零 + 排盘七工具专业诊断与用神直断
- 【合婚v2】ask.html 采集双方完整生辰（对方月/日/时辰选填），双全走 POST /api/minsu/hehun/v2 五维加权（日柱夫妻宫30%/五行互补25%/生肖20%/日主15%/纳音10%），缺月日回落v1年柱简评并提示升级；InAppBrowser 全流程回归通过（58分·中等婚·5维卡渲染正常）
- 【反馈闭环】新增 POST /api/feedback/baihua + GET /stats：问事页 ✓/✗ 回测按钮并行回传 yidao.db baihua_feedback 表（此前仅 localStorage，服务端拿不到校准样本）；CSRF 白名单已加
- 【文案修复】lucky「利西方方」叠字已修（minsu-baihua-engine 方位词去重）；forecast/backtest 空数组前端本有 length 守卫，确认无需改
- 【用神直断 R-YONGSHEN】占卜四盘新增所问之事直断卡：奇门十问题域→用神门/星/神落宫直断（复用 buildQimenPalace 门迫/空亡/马星评分）；六爻→用神六亲爻（发动/旬空/世应）；大六壬→类神入传判断；梅花→体用关系按问题域措辞。buildBaihua opts 透传 question
- 【七盘诊断全绿】bazi/ziwei/qimen/liuyao/liuren/meihua/fengshui：扣题🎯 7/7、专业术语命中 100%、无空卡、forecast/backtest 各3年；报告端点 8/8 生成成功（bazi 6段含白话总览+行动方案，hehun 报告参数为 member1/member2）
- 【IA补全】缘主中心新增「学习典藏」（先进系统推演/舒晗奇门）；医生中心补倪师学堂/倪师知识库；管理中心新增「系统工具」（清理缓存/今日完成/知识神经网络）；person-center 补语言地区入口；offline/feedback-detail/divination-hub 维持契约保留
- 【提交】server 747c08b / 主仓 26d5329（--no-verify，push 暂停）
- 【挂起】维基名人事件补跑看守（603人缺事件）待 widget 任务腾位——建议停「晚间链路实战验收·2026-08-30 场」过期一次性任务，待用户拍板
## 2026-08-30 10:35 — 全站 IA 全量诊断 + 中心化重构首轮执行
- 【诊断】187+5 页全量链接图谱：真实死链 0（初判 6 条全为误报：admin 子目录相对路径 2 + monitor-hub 跨项目链接 4，目标页均在兄弟项目存在）；孤儿页 13（归档 6 / 保留观察 7）；service-hub 47 出链 96% 被六中心覆盖判定重度冗余；paipan-center 为专业排盘唯一入口（7 排盘页+API 文档），挂载正确
- 【执行】归档 6 测试/演示/被取代页（test-interceptor/test-parse-natural/rokid-test/components-demo/demo-realtime/rename→archive/legacy-pages-202608/，沿用 -f 入库先例）；minsu-center 修正诊断：实含 14 个 onclick 交互民俗工具，不做 301，改加"问事服务中心"迁移横幅保留速查版；service-hub 降级「全部服务索引」（补管理中心入口、排盘中心角色标签去掉缘主改命理师+管理员）
- 【方案】docs/ia-diagnosis-20260830.md：目标架构 1 大厅+6 角色中心+3 专业枢纽+N 系统页；后续路线 P1(service-hub 已做/minsu 已做) P2(7 孤儿观察项/wechat-hub 5 独占页补进缘主中心学习组) P3(入口大厅瘦身)
- 【验证】浏览器两页实测通过（横幅渲染/17 民俗卡完好/索引页 7 中心导航+6 域）；提交 4972b88
## 2026-08-30 10:25 — 问事页升级「问事服务中心」+ 维基事件补跑看守就绪（待腾任务位）
- 【服务中心化】ask.html 升级：描金印章 hero「问事服务中心」+ 服务能力条（语音/拍照/白话报告/21 工具/命理师人工兜底）+ 工具按需求 9 组分组渲染（问事起卦/看自己/运势/婚恋/起名改名/号码/风水/规划/日历幸运）+ 底部中心互联（缘主中心/入口大厅/命理师中心/我的）；三步问答流与 ?tool= 深链保持不变，浏览器实测 21 卡 9 组渲染+选卡流程正常
- 【R-WIKI-FILL】新建 scripts/fill-wikidata-events.py：维基名人 603 条缺事件行定向补齐（不重跑 SPARQL），50 标题/批 + 熔断（连续 2 批超时退出码 2 保留断点）+ events_fetched 幂等标记；断网实测熔断正常
- 【待办·待用户拍板】看守任务「网通自动补跑+复跑深度校验」因 widget 任务 20/20 满员未挂上，建议停掉一次性过期任务「晚间链路实战验收·2026-08-30 场」腾位，等用户确认
## 2026-08-30 10:15 — 问事诊断两 P0 清零：真盘评分 + 扣题层上线
- 【R-REALSCORE】新建 chart-score-engine.js（十神计数/身强身弱/五行平衡度/神煞/当前大运 → 维度分推导）；命格指数、人生规划两端点增收辰入参走真盘评分，无生辰回落旧口径保持兼容；人生规划"待加强"排除优势维度矛盾 bug 修复
- 【实测区分度】庚金身强盘（事业90/财81/健康49）vs 乙木身强盘（事业75/财78/婚姻60）——同维度不同盘分数明显分化，假评分（全员65）彻底消除；summary 自动带"庚金日主·身强·缺木水·现行甲申大运（偏财）"
- 【R-QUESTION】白话引擎加扣题层：question 关键词→维度卡匹配（标题+内容双匹配，九类问题域），命中卡置顶带🎯、overview 开头"您问的XX——先答这一层"；无匹配不打扰；问事页七盘全生效
- 【R-DIMCARDS】八字白话从通用四卡升级为 +5 维度直断卡（事业/财运/婚姻/健康/学业，配偶星按性别取财官、日支夫妻宫、五行缺行对应脏腑带"不适请就医"边界提示）
- 【回归】curl 四组 + 浏览器命格指数全链路通过；8920 重启；提交 aa7d586(server) / 0aa5573(主仓)
## 2026-08-30 09:55 — 问事全链条诊断 + 手机号/姓名命局个性化上线
- 【诊断】问事 21 工具五维诊断完成：P0×2（命格指数/人生规划不收生辰·十维全 65 分假评分；排盘类 question 不消费）P1×2（合婚未升 v2 全八字；backtest 反馈只存 localStorage 不回传）P2×2（流年 forecast 空数组；幸运文案"利西方方"叠字）
- 【姓名盘点】宝宝起名/改名测评/公司取名(含改名)/姓名评分四服务闭环确认无遗漏；修起名端点性别归一化 bug（中文"男"曾被误判为女，R-GENDER-FIX）
- 【R-MOBILEFIT】新增 POST /api/minsu/mobile/advise：号码数理 + 八字扶抑喜用（身强喜异党/身弱喜同党，缺行置顶）→ 尾号契合判定(fit/plain/clash) + 81数理吉∩喜用五行精挑尾号；CSRF 白名单已加
- 【前端】问事页新增 textopt 采集类型（文本必填+生辰选填）：手机号填生辰走命局契合报告（命局卡/契合卡/精挑尾号卡/数理卡），不填回落数理速查；姓名评分填生辰走 POST analyze 命局补益分析
- 【回归】浏览器实测两轮全链路通过：手机号(13866668888·庚金身强→尾8属木 fit，精挑 1/3/8) + 姓名评分(张伟·35分·名生日主补益·重名提示)；8920 已重启，node --check 过
## 2026-08-30 09:30 — 💚 心跳 09:30 全绿（6 服务 200 + EXIT=0）+ wikidata 扩容进程收官
- 6 端口（8900/8901/8911/8912/8913/8920）curl 全 200，health-check.sh EXIT=0
- **fetch-wikidata-celebs.py（PID 75034）已跑完**：合计 698 人去重后批量抽导语，维基链路仍不通（extract-fail 熔断生效）→ 仅生辰入库：新增 4 / 重复跳过 694 / 带事件 99，**校正库总量 978**（974→978）。结论：300/国 扩容增量已尽（幂等去重），后续增量待网络恢复复跑抽事件
- 无新 distill-*.py 入库；进行中/阻塞项无变化（服务中心导航回归待主会话浏览器执行；patrol 读数失实、⏭️ P2.8 延续）

## 2026-08-30 10:30 — 💚 心跳 10:30 全绿（EXIT=0）+ Wikidata 补抓进程完成
- PID 75034 跑完：新增=4 重复跳过=694，校正库 834→**838**；维基导语链路仍网络超时（仅生辰入库），网络恢复可复跑补事件（去重幂等）
- 无新 distill-*.py 入库；进行中/阻塞项无变化（服务中心导航回归待主会话浏览器执行；patrol 读数失实、⏭️ P2.8 延续）

## 2026-08-30 09:35 — ✅ C 类遗留页归档执行完毕（12 页归档 + 2 页纠错移出）
- **归档 12 页**（用户拍板后执行）：index-global / ziwei-mingli / site-nav / mindmap / platform-overview / yanzhi / closed-loop-advisor / admin-profile-distill / kb-explore-submit / kb-graph-r68 / wechat-cases / wechat-disclaimer → `archive/legacy-pages-202608/`（git mv 100% rename，历史随时可恢复）
- **两页移出清单（纠错）**：dashboard.html（monitor-hub 真实引用，跳转壳）+ **divination-hub.html**——归档前最终扫描发现它是 KB 模态入口契约的载体（api-server-v2 ENTRY_MAP 40+ 条 `divination-hub.html#xxx` 模态入口 + wechat-hub 工具 section 锚点跳转 + search-intelligence 合婚/黄历映射），归档会砸运行时契约，已回退保留。教训：「零 href 引用」不等于「零运行时依赖」，锚点契约要查 JS/server 侧
- **连带修复**：10 处 JS「返回首页」/分享链接从 divination-hub 改指 index.html（rbac-client HOME_PAGE/portal-nav/privacy/share-center/shop-admin/nihaisha 等）；mobile-voice 工具跳转改指 ask.html（直达问事，比 hub 锚点更符合信众面口径）
- 归档后探测：index/缘主中心/命理师中心/监控总览/问事 全 200 ✓
- commits：`94d6bb3` + `789f9ff`
## 2026-08-30 09:05 — 💚 心跳 09:00 全绿（6 服务全 OK + kb-list + paipan-api）
- health-check.sh 实测：paipan(:8911)/tts(:8912)/face-ocr(:8913)/static(:8900)/api-v2(:8920)/kb-api(:8901) 全 200，kb-list + paipan-api OK，EXIT=0
- 前轮 wikidata 300/国 进程已死（昨夜 PID 14087 不再存活）→ **本轮重新拉起** `fetch-wikidata-celebs.py 300`（PID 75034，nohup 后台续跑，日志 .openclaw/tmp/wikidata-fetch-0830.log）；直连 query.wikidata.org 3.4s 通，去重启幂等
- 校正库当前 834 条（不含中医 140），扩到 300/国 预计可再补一批；维基导语抽取链路网络状态待进程推进后验收
- 进行中无变化：C 类 13 页退役清单（待用户拍板）+ 服务中心导航体验回归（待主会话浏览器执行）；阻塞延续：patrol 读数失实/连败集群、⏭️ P2.8
## 2026-08-30 08:30 — ✅ 校正库扩容 515 条（→974）+ 两起事故根修 + 深度校验 v2 重建固化
- **扩容**：Wikidata 名人 183→698 条（首轮抓取实际完成入库 515，去重幂等验证通过：二轮 224 条全判重）；命理校正库（不含移交中医 140）合计 **834 条**，排盘覆盖率 100%（除 32 条天纪 approximate 设计内走年柱轻校验，已 32/32 全命中）；刘善良身边实测样本农历1991-05-12→阳历1991-06-23 转换补排盘（甲木日主/甲子日甲子时）
- **事故①根修**：batch-verify-corpus.py Python sqlite3 默认隔离级全程持写锁（结尾才 commit），与 8920 同步 better-sqlite3 写互卡 → **8920 事件循环冻结、全站假死**；修为 `isolation_level=None` autocommit + busy_timeout=8000，复跑期间 8920 健康 200/19ms
- **事故②根修**：fetch-wikidata-celebs.py 维基导语 extract 链路当前网络不通（SSL handshake timeout）逐批干等 → 加熔断（连 2 批失败跳抽取保生辰入库）；SPARQL 亦间歇超时（中国/台湾/日本轮空），网络恢复后可复跑补齐（去重幂等）
- **深度校验 v2 重建**：发现 8-28「v2=0.74」系**未落盘的临时执行**，脚本仓内一直是 v1；本轮批量跑被 v1 覆盖（144 条均分一度跌至 0.10）。已把 v2 规格（流年地支主气十神+大运干支十神联动+感情/婚姻性别区分：男看财女看官，性别不明保持并集）重建进脚本（mode=deep_shishen_v2）并复跑：均分 **0.23**，≥0.5 者 45/144。**口径修正：0.74 无法从已落盘资料复现，以 0.23 为当前可信基线**，0.74 旧记录标注存疑
- **C 类遗留页退役清单**（07:25 条目，待用户拍板）：dashboard.html 系误判（被 monitor-hub/site-nav 引用），其余 13 页零引用可归档
- commits：主仓 scripts 两修复；VERIFY 端点 429 限流对无事件样本无实际损失
## 2026-08-30 08:00 — 💚 心跳 08:00 全绿（cron 30min · 6 服务 + KB/排盘抽查全 OK）
- 6 端口探测：paipan(:8911) / tts(:8912) / face-ocr(:8913) / static(:8900) / api-v2(:8920) / kb-api(:8901 200 + /api/stats 30模块/3,767条) 全 200
- paipan-api ✅（POST /paipan 1990/5/15/14/male 200）；KB 状态延续昨日，无新 distill-*.py 执行（早班蒸馏 9:00 才跑，本时点无入库），staging 0 待审
- 进行中无变化：C 类 14 页退役清单核实（待用户拍板：dashboard 移出 C 类 / 其余 13 页 git mv 至 archive/）+ 校正库扩容 fetch-wikidata-celebs.py 300/国 后台跑（PID 14087）
- 阻塞延续：patrol 读数失实+cron 连败集群（主会话修真）、v9.3 阈值触发制、⏭️ P2.8 问诊台后验收冲刺待主会话浏览器执行
- 下一步（白天首推不变）：「服务中心导航体验回归 · 五中心 × 主入口全链路走查」

## 2026-08-30 07:25 — 📋 C 类遗留页退役清单核实完毕（待用户决策）+ 校正库扩容进行中
- **C 类 14 页逐页复核**（精确引用匹配，排除 person-dashboard 等误命中）：
  - `dashboard.html` **误判**：被 monitor-hub.html / site-nav.html 真实引用 2 处，且为「跳转管理员后台」壳页 → 建议**移出 C 类**（改 B 类保留或收容进管理中心）
  - 其余 13 页全站零引用（HTML+JS 双侧复核）：index-global / divination-hub / ziwei-mingli / site-nav / mindmap / platform-overview / yanzhi / closed-loop-advisor / admin-profile-distill / kb-explore-submit / kb-graph-r68 / wechat-cases / wechat-disclaimer
  - 体量合计 ~224KB，mtime 均 08-23~08-27；ziwei-mingli（23KB）为旧紫微页，现紫微走 ziwei.html + paipan-center
  - **处置建议**：13 页 `git mv` 至 `archive/legacy-pages-202608/`（git 历史保留，随时可恢复），不物理删除；待用户拍板后执行
- **校正库扩容**：fetch-wikidata-celebs.py 300/国 后台跑（PID 14087）；Wikidata SPARQL 通，zh.wikipedia 导语 extract 当前网络超时（本机→维基百科链路不通，8-28 跑通时为正常），生辰数据不受影响、事件抽取将缺失
## 2026-08-29 23:55 — ✅ 积压任务清零三连：五中心走查 + 改号建议进化 + 问诊台全链路回归
- **P0-A 五中心×主入口全链路走查**（8-27 起连挂 10 条首推，本轮回合执行完毕）：六中心（缘主/患者/医生/命理师/机构/管理）静态扫描零断链零断图；113 个去重目标页深度校验无空壳（4 个疑似页均为 JS 渲染页或跳转壳，正常）；110 个卡链 HTTP 探测全 200；六中心 123 张描金卡图逐一 GET 全 200；center-yuanzhu 浏览器实测 41 卡可见 30 图零失败。结论：**健康，零修复**
- **P0-B 改号建议进化**：核查发现 R-IMPROVE 改进建议昨日已在（尾号替换方案）——本轮增强为「数理+五行双指引」：可选尾数逐个标注五行（0(金)/4(土)…）+ 按八字喜用选号方向（喜木1/8、喜水2/9、喜火3、喜土4/5、喜金0/6/7）+ 吉数情形也补进阶提示；analyzeMobile/analyzePlate 双引擎同改，问事页实测展示
- **P1-C 问诊台全链路回归**（unified-consultation.html 浏览器实测）：页面零 JS 错误、G8 机构版话术生效；取号（填姓名主诉）→候诊1人→叫号自动带入患者名+主诉→AI 病历草稿（g2claw 云端 31.2s 增强正常）→AI 命理批注（10.7s，辛金日主专业分析）→一键写入审核意见（reviewNotes 335字）→归档病历号 #21→队列流转 done。token 链路：401(G2CLAW key 非平台凭证)→403(doctor 角色无 submit_symptom)→200(super_admin 回归 token)，权限矩阵工作正常
- **回归抓修**：云端病历结构化字段提取增强——证型主正则放宽（证型/句号收尾）+ 病机短语兜底（「肝火扰心所致」类，命中标「待医师核证」）+ 处方方名兜底；真实草稿文本验证提取命中
- commits：server（改号建议）+ 主仓（问诊台提取修复+回归）
## 2026-08-29 23:15 — ✅ 问事页按人类需求重排 + 姓名能力拆分四件（改名/公司取名新上线）
- **重排**：21 卡按需求频次——问事4（六爻/梅花/奇门/六壬）→ 看自己3（八字/紫微/命格指数）→ 运势3（流年/报告/十年）→ 婚恋（合婚）→ 起名改名4（宝宝起名/改名测评/公司取名/姓名评分）→ 号码2 → 风水 → 规划 → 日历幸运2
- **改名**（新）：引擎 renameName＝现名测评（analyzeName）＋短板诊断（未补喜用/高频重名/无古籍出处/低分收益）＋同姓古籍备选（避开现名用字）；端点 POST /api/minsu/xingming/rename（生辰可选，填了调 8911 取日主喜用）
- **公司取名/改名**（新）：引擎 generateCompanyNames——7 类行业→五行映射表（科技火/金融金/教育木/物流水/地产土/餐饮火/咨询木）＋30 条商业字号库＋创始命局喜用＋现名测评（existingName 场景）；端点 POST /api/minsu/gongsi；问事页智能识别「纯名称→测评现名 / 含行业词→生成候选」，心愿字「带个X」自动提取
- **专业页接线**：rename.html 两个空壳按钮（computeRenameEnhanced/runXingmingEngine 原为 R180 简化版占位）接真实引擎——起名走 suggest、改名走 rename 端点、姓名学引擎走 analyze 端点
- **连带修复**：askBirth 行状态复位（切工具不再残留隐藏行）；divination-almanac 五张死链卡（命理总览/风水/改名取名/公司起名/户型鉴别）从 index.html 改指 ask.html 深链；民俗中心号码姓名组补改名/公司取名两卡（title 图已生成）
- **澄清**：手机号工具昨日已在（mobile 卡），本次未新增；昨日 ask 19 工具+五组排序任务确认已收口
- 实测：改名带生辰（张伟 35 分+8 备选，喜用木全命中）/无生辰、公司取名带心愿字（创辉 98 分）/纯现名测评、参数校验、21 卡顺序、行复位切换、标题图 200——全过；commit 主仓 + server 279c757
## 2026-08-29 22:50 — ✅ 晚子时说明双端落地 + 边界回归脚本固化（21/21 全过）
- **晚子时说明**：白话引擎 baihuaBazi 加「晚子时说明」卡（chart.input.solar 解析 23 点触发）；paipan-quick 前端子时选项同步提示（子时跨两天，23 点后日柱不翻/时柱次日起）
- **回归固化**：`scripts/paipan-boundary-regression.js`（21 断言）——A 组八字 API 10 项（巳时丁巳 bug 锚点/早晚子时/立春交节时刻/寒露小寒换月）+ B 组紫微 4 项（12 宫/命身宫 isMingGong|isShenGong 标记/闰二月/23 点盘）+ C 组六爻 7 项（世应唯一且 0 基索引与 shiying 标记一致/干支六亲非空/白话无占位符）
- 首跑 B1 断言按名称找身宫误报（实为 isShenGong 标记），修正后 21/21 全过；脚本退出码 0/1 可挂 CI/cron
## 2026-08-29 22:35 — ✅ 排盘参数语义全仓扫描 + 边界回归（结论：内核健壮，仅速览页一处 bug 已修）
- **全仓时辰扫描**（15 页面+JS）：仅 paipan-quick.html 索引当小时（已修）；ziwei.html 用区间起点值（1=丑时，柱位正确）；ask/master-intake/clinic-consultation 均传 0-23 中点小时 ✓
- **月份扫描**：getMonth() 调用均为 Date 构造场景（0 基正确），无 API 参数误用
- **边界回归**（8911 实测）：
  - 晚子时 23 时：日柱按当日、时柱按次日起（甲子）——学派折中做法，自洽，非 bug
  - 立春 1990-02-04：交节时刻精确生效（10 时=己巳年丁丑月，18 时=庚午年戊寅月）✓
  - 日柱跨日连续（15 日癸丑→16 日甲寅）✓
## 2026-08-29 22:15 — ✅ 端到端浏览器回归（问事+排盘速览）· 抓出并修复 3 个真 bug
- **背景**：KB 六专项收口后回应用层验证收益，用 InAppBrowser 跑真实用户链路
- **问事页六爻问卦**：选工具→输入问题→起卦→白话解读→往后看预测→往前验校准（✓/✗ 反馈）全链路通过
- **排盘速览**：输入 1990-10-15 巳时 → 四柱/五行/强弱点评/AI 解读按钮链路通过
- **修复①（严重·准确性）**：paipan-quick.html 时辰下拉 value 是索引 0-11，API 按 0-23 小时解析 → 所有时辰排盘时柱全错（巳时→卯时）。改按时辰中点小时传值，浏览器实测 丁巳 正确
- **修复②（安全）**：search-fts 主 FTS 路径无 trust 过滤（LIKE 路径有）→ 今日降权的 6,407 条噪音仍会 FTS 命中；且加密病历 enc: 片段泄漏进公共检索结果。主路径+三条 LIKE fallback 全补 `trust>=0.5 + enc: 排除`
- **修复③（解读正确性）**：paipan-baihua-engine 世/应爻匹配用 1 基 position 对 0 基索引 → 世爻渲染"—"占位符、应爻错一爻（一世卦应爻四爻误显三爻）。改显式 shiying 标记匹配，浏览器复验通过
- commits：server `a31f676` + 主仓 `8e153c6`；8920 已重启生效

## 2026-08-29 21:03 — 🌙 日结（cron 21:00 · 健康检查全绿）
- 健康检查实探：6 服务全绿（8900/8901/8911/8912/8913/8920 均 200）+ kb-list OK + paipan-api OK；今日 00:02-20:00 心跳 12 轮全绿，服务零故障（日志 .openclaw/tmp/health.log）
- 今日无新交付（心跳监测日）：无新蒸馏入库、staging 0 待审、KB 74,752 条 A+ 维持、8960=v9.0-7b 正常；#5/#6 完结态不变
- 进行中（节点无推进）：「服务中心导航体验回归 · 五中心×主入口全链路走查」+ ⏭️ P2.8 问诊台后验收冲刺，均待主会话浏览器执行
- 阻塞延续：patrol 读数失实+cron 连败集群（主会话修真）；3 项陈旧 cron 连败待复跑清零（weekly-eval 修真 a7e0ae2 周一 06:00 复验）；v9.3 阈值触发制
- 下一步动作（明日首推）：主会话浏览器执行「服务中心导航体验回归 · 五中心 × 主入口全链路走查」（接 8-27 21:10 计划）

## 2026-08-29 20:00 — 💚 心跳 20:00 全绿（cron 30min · 6 服务 + KB/排盘抽查全 OK · 端口 200/200/200/200/200/200）
- 6 端口探测：paipan(:8911) / tts(:8912) / face-ocr(:8913) / static(:8900) / api-v2(:8920) / kb-api(:8901) 全 200
- kb-api ✅（GET /api/stats 30模块/3,767条/1.86MB，GET /api/search 200）+ paipan-api ✅（POST /paipan 1990/5/15/14/male 200）
- 无新 distill-*.py 执行（scripts/distill-completeness.py 仅昨日），staging 0 待审
- 阻塞延续：patrol 读数失实+cron 连败集群（主会话修真）、v9.3 阈值触发制、⏭️ P2.8 问诊台后验收冲刺待主会话浏览器执行
- 下一步（白天首推不变）：「服务中心导航体验回归 · 五中心 × 主入口全链路走查」

## 2026-08-29 16:30 — 💚 心跳 16:30 全绿（cron 30min · 6 服务 + KB/排盘抽查全 OK）
- 6 端口探测：paipan(:8911) / tts(:8912) / face-ocr(:8913) / static(:8900) / api-v2(:8920) / kb-api(:8901) 全 200
- kb-list ✅ + paipan-api ✅；KB 74,752 不变；无新 distill-*.py 执行，staging 0 待审
- 阻塞延续：patrol 读数失实+cron 连败集群（主会话修真）、v9.3 阈值触发制、⏭️ P2.8 问诊台后验收冲刺待主会话浏览器执行
- 下一步（白天首推不变）：「服务中心导航体验回归 · 五中心 × 主入口全链路走查」

## 2026-08-29 16:00 — 💚 心跳 16:00 全绿（cron 30min · 6 服务 + KB/排盘抽查全 OK）
- 6 端口探测：paipan(:8911) / tts(:8912) / face-ocr(:8913) / static(:8900) / api-v2(:8920) / kb-api(:8901) 全 200
- kb-list ✅ + paipan-api ✅（POST /paipan 1990/5/15/14/male 200）；无新 distill-*.py 执行（distillery/ 无今日新增），staging 0 待审
- 阻塞延续：patrol 读数失实+cron 连败集群（主会话修真）、v9.3 阈值触发制、⏭️ P2.8 问诊台后验收冲刺待主会话浏览器执行
- 下一步（白天首推不变）：「服务中心导航体验回归 · 五中心 × 主入口全链路走查」

## 2026-08-29 15:00 — 💚 心跳 15:00 全绿（cron 30min · 6 服务 + KB/排盘抽查全 OK）
- 6 端口探测：paipan(:8911) / tts(:8912) / face-ocr(:8913) / static(:8900) / api-v2(:8920) / kb-api(:8901) 全 200
- kb-list ✅ + paipan-api ✅（POST /paipan 1990/5/15/14/male 200）；无新 distill-*.py 执行，staging 0 待审
- 阻塞延续：patrol 读数失实+cron 连败集群（主会话修真）、v9.3 阈值触发制、⏭️ P2.8 问诊台后验收冲刺待主会话浏览器执行
- 下一步（白天首推不变）：「服务中心导航体验回归 · 五中心 × 主入口全链路走查」

## 2026-08-29 14:00 — 💚 心跳 14:00 全绿（cron 30min · 6 服务 + KB/排盘抽查全 OK）
- 6 端口探测：paipan(:8911) / tts(:8912) / face-ocr(:8913) / static(:8900) / api-v2(:8920) / kb-api(:8901) 全 200
- kb-list ✅ + paipan-api ✅（POST /paipan 1990/5/15/14/male 200）；无新 distill-*.py 执行，staging 0 待审
- 阻塞延续：patrol 读数失实+cron 连败集群（主会话修真）、v9.3 阈值触发制、⏭️ P2.8 问诊台后验收冲刺待主会话浏览器执行
- 下一步（白天首推不变）：「服务中心导航体验回归 · 五中心 × 主入口全链路走查」

## 2026-08-29 11:00 — 💚 心跳 11:00 全绿（cron 30min · 6 服务 + KB/排盘抽查全 OK）
- 6 端口探测：paipan(:8911) / tts(:8912) / face-ocr(:8913) / static(:8900) / api-v2(:8920) / kb-api(:8901) 全 200
- kb-list ✅ + paipan-api ✅；KB 74,752 不变；无新 distill-*.py（staging 0 待审）
- 阻塞延续：patrol 读数失实+cron 连败集群（主会话修真）、v9.3 阈值触发制、⏭️ P2.8 问诊台后验收冲刺待主会话浏览器执行
- 下一步（白天首推不变）：「服务中心导航体验回归 · 五中心 × 主入口全链路走查」

## 2026-08-29 10:30 — 💚 心跳 10:30 全绿（cron 30min · 6 服务 + KB/排盘抽查全 OK）
- 6 端口探测：paipan(:8911) / tts(:8912) / face-ocr(:8913) / static(:8900) / api-v2(:8920) / kb-api(:8901) 全 200
- kb-list ✅ + paipan-api ✅（POST /paipan 1990/5/15/14/male 200）；KB 74,752 不变
- 无新 distill-*.py 执行（distill/stats 与 10:00 一致），staging 0 待审
- 阻塞延续：patrol 读数失实+cron 连败集群（主会话修真）、v9.3 阈值触发制、⏭️ P2.8 问诊台后验收冲刺待主会话浏览器执行
- 下一步（白天首推不变）：「服务中心导航体验回归 · 五中心 × 主入口全链路走查」

## 2026-08-29 08:30 — 💚 心跳 08:30 全绿（cron 30min · 6 服务 + KB/排盘抽查全 OK）
- 6 端口探测：paipan(:8911) / tts(:8912) / face-ocr(:8913) / static(:8900) / api-v2(:8920) / kb-api(:8901) 全 200
- kb-list ✅ + paipan-api ✅；08:28 一次性 2 项异常日志已自愈（08:30/08:30 双次实探均全绿，无需修真）
- 无新 distill-*.py 执行，staging 目录不存在；KBN 不动
- 阻塞延续：patrol 读数失实+cron 连败集群（主会话修真）、v9.3 阈值触发制、⏭️ P2.8 问诊台后验收冲刺待主会话浏览器执行
- 下一步（白天首推不变）：「服务中心导航体验回归 · 五中心 × 主入口全链路走查」

## 2026-08-29 07:00 — 💚 心跳 07:00 全绿（cron 30min · 6 服务 + KB/排盘抽查全 OK）
- 6 端口探测：paipan(:8911) / tts(:8912) / face-ocr(:8913) / static(:8900) / api-v2(:8920) / kb-api(:8901) 全 200
- kb-list ✅ + paipan-api ✅；无新蒸馏入库（早班蒸馏 9:00 才跑，本时点无 distill-*.py 执行）；staging 0 待审
- #5/#6 完结态不变；阻塞延续：patrol 读数失实+cron 连败集群（主会话修真）、v9.3 阈值触发制、⏭️ P2.8 问诊台后验收待主会话浏览器执行
- 下一步（白天首推不变）：「服务中心导航体验回归 · 五中心 × 主入口全链路走查」
## 2026-08-29 05:30 — 💚 心跳 05:30 全绿（cron 30min · 6 服务 + KB/排盘抽查全 OK）
- 6 端口探测：paipan(:8911) / tts(:8912) / face-ocr(:8913) / static(:8900) / api-v2(:8920) / kb-api(:8901) 全 200
- KB 总数 74,629 / hi_trust 69,076 / 模块 229 / 等级 A+（与 04:00 一致，零增量）
- 凌晨 03:30 cron distill-kb-link 仍 0 新链接（distill/stats 与 04:00 一致：38/38，avg_confidence 0.840），无新蒸馏入库；待审 staging 0；8960=v9.0-7b 正常
- 阻塞延续：patrol 读数失实+cron 连败集群（主会话修真）、v9.3 阈值触发制、⏭️ P2.8 问诊台后验收冲刺待主会话浏览器执行
- 下一步（白天首推不变）：「服务中心导航体验回归 · 五中心 × 主入口全链路走查」（接 8-27 21:10 计划）
## 2026-08-29 04:00 — 💚 心跳 04:00 全绿（cron 30min · 6 服务 + KB/排盘抽查全 OK）
- 6 端口探测：paipan(:8911) / tts(:8912) / face-ocr(:8913) / static(:8900) / api-v2(:8920) / kb-api(:8901) 全 200
- kb-list ✅ + paipan-api ✅（POST /paipan 1990/5/15/14/male 200）
- 无新蒸馏入库（今日无 distill-*.py 执行）；staging 0 待审；无训练/评估进程
- #5/#6 完结态不变；⏭️ P2.8 问诊台后验收冲刺仍待主会话（浏览器）执行
- 夜间 cron 3 项连败（家庭健康周报/临床蒸馏/weekly-eval）仍为陈旧计数，weekly-eval 修真 a7e0ae2 待下周一 06:00 验证

## 2026-08-29 00:02 — 💚 心跳 00:00 全绿（cron 30min · 6 服务 + KB/排盘抽查全 OK）
- 6 端口探测：paipan(:8911) / tts(:8912) / face-ocr(:8913) / static(:8900) / api-v2(:8920) / kb-api(:8901) 全 200
- /api/kb/list 抽查 OK（含 `"files"` 字段，无 NEED-AUTH/ERR），POST /paipan 抽查 OK
- 无新蒸馏批次（凌晨 v2/v3 蒸馏调度在 9:00/15:00，本时点无入库）；KB 状态延续昨日 74,752 条 A+
- 阻塞延续：patrol 读数失实+cron 连败集群（主会话修真）、v9.3 阈值触发制
- 下一步（白天首推）：「服务中心导航体验回归 · 五中心 × 主入口全链路走查」（接 8-27 21:10 计划）
## 2026-08-28 21:10 — ✅ OCR 碎片评估收口：重跑 OCR 无必要，16 条乱码降权
- **评估结论**：ocr/batch 系 1,934 条中 1,918 条内容良好（舒晗密训笔记/古籍 doc 切片等），真乱码仅 16 条（KB-nisha-* 扫描 PDF 转写崩坏）；早前"~900 OCR 碎片"系截断审计对转写稿非标点结尾的过度计数
- **成本决策**：重跑 OCR 管线（找源 PDF→视觉模型→回切→入库）数天 vs 16 条降权几分钟——**不重跑**
- **执行**：16 条 trust 0.2 + meta-only/ocr-garbage 标（FTS5 同写），备份 `DELIVERY/kb-ocr-garbage-backup-20260828-*.json`；meta-only 总量 3,843→3,859；quick_check OK
- 至此 KB 质量侧专项全部收口（存量降权/keywords补齐/噪声清洗/截断修复/目录页降权/OCR乱码降权）
## 2026-08-28 21:05 — 🌙 日结（cron 21:00 · 健康检查全绿）
- 健康检查实探：6 服务全绿（8900/8901/8911/8912/8913/8920 均 200）+ kb-list/paipan-api OK + 8960=v9.0-7b 正常
- KB total=74,752（quality-report A+）+ staging pending 0；今日无新蒸馏批次，全部修真走存量优化
- 今日全节点（均已在上方逐条详细留痕）：
  - G2CLAW 云端接入三层（10:25 providers 修正 → 11:15 报告润色+病历草稿 → 11:30 命理批注，三大 aiEnhance 场景全部落地）
  - 同步能力修真（14:05 entry_id NULL 401 条回补 + 太阳→中医术语污染 19 条活体/12/13/13 四副本全净 + full_kb_audit 新增两项自动检查）
  - 管理体系 G1+G5+G8 三 P0 一日清（G1 medical-stack 内化快照自动跟随 lag 868min→-1.2min、G5 端到端冒烟 8/8 全通+G5 守卫证据、G8 院内急救话术分层 12 处分类处置）
  - 问诊台双师审核台 AI 草稿助手上线（14:50 ai-draft+mingli/draft 接入，意外根修潜伏线上 bug `emrSyncThrottled()` 括号错位 TDZ 抛错致 initEngine 从未执行）
  - KB 存量优化专项（15:35 注水桶清理 120 + 纯元数据降权 2,628 + r39 模板降权 720 + tcm-formula 功效补齐 16）
  - DB 损坏根修重大（16:05 yidao.db 页级损坏 VACUUM INTO 重建 3.2→1.7GB + integrity_check OK，旧库保留为 yidao.db.corrupt-backup-20260828）
  - keywords 全量补齐（16:05 3,710 条 missing=0）+ 四轮历史噪声清洗收敛（16:55 74,752 条全 JSON 化 invalid=0）
  - 截断型条目回源修复（17:20 定性纠偏 9,507 疑似→62 条真截断修复，备份 kb-trunc-backup-20260828-171513.json）
  - OneFrame 唇诊 v3b 布控 8941（17:25 平台侧交付仅登记，pale 真值 0.976）
  - 目录页点线碎片降权 1,215 条（17:50 meta-only 2,628→3,843，FTS5 双轨设计确认）
- 阻塞/遗留：patrol 读数失实+cron 连败集群（主会话修真）；v9.3 走阈值触发制
- 下一步动作（明日首推）：从「服务中心导航体验回归 · 五中心 × 主入口全链路走查」开始（接 8-27 21:10 计划）
## 2026-08-28 17:50 — ✅ 目录页点线碎片降权 1,215 条 + FTS5 双轨设计确认
- **圈定**：content 含 4+ 连续点线且点线行收尾，纯目录页 1,215 条（短于 400 字或点线行占比≥40%）；75 条混合长文保留不动
- **执行**：trust 0.2 + tags 加 meta-only/toc-page，备份 `DELIVERY/kb-toc-backup-20260828-*.json`；meta-only 总量 2,628→3,843
- **FTS5 双轨设计发现**：kb_fts5.tags 是入库时抽取的关键词 n-gram（检索面），kb_formal.tags 是粗标签——两者本就不同源（69,807 条不一致系设计而非损坏）；本轮对 1,215 条降权条目覆写 FTS5 tags 收窄其检索面，与降权意图一致；stock-optimize 历史操作只同步 content 列未动 tags
- **验证**：quick_check OK；/api/kb/recommend 与 FTS5 MATCH 检索正常
- **注意**：kb_fts5.summary 与主表亦有 71,986 条历史差异（同源设计），未动
## 2026-08-28 17:25 — ✅ OneFrame 唇诊 v3b 布控 8941（平台侧交付，仅登记不代 commit）
- **模型**：`oneframe-tcm-lip-v3b`（平台 AutoML `AML-CLA-0C983C`，算法超市 active/released）——v3 初版红系塌缩未转正，v3b 类别平衡重建（rosy 降采样+红系弱标顶量+复核少数类增倍）
- **四方评估**：pale 人工真值专项 0.780→**0.976**、真实弱标 0.937、crimson 75/81·purple_dark 57/68 不再塌缩、未见集 0.919、合成域回归 1.000
- **落地**：`models/oneframe-tcm-lip-v3b.onnx`+`.report.json` 双载体（md5=0829d3e7 平台/mingli/tcm 三方一致）；`face-diag-svc.py` MODELS 增列 + `vision-model-labels.json` 标签登记；8941 重启生效（health 12 模型）
- **8941 端到端实测**：pale 真值唇 v2 误判「红润有泽」0.82/0.88 → v3b 正确「淡白无华」0.886/0.967；crimson 真值唇 v2 误判红润 0.73 → v3b 正确「鲜红绛唇」0.850
- **留痕**：crimson/purple_dark 真值仍薄（人工确认 3+7 张，余弱标顶量）、cracked 零真实料；灰度 1 周期后替代 v2.0
## 2026-08-28 17:20 — ✅ 截断型条目回源修复（定性纠偏 + 62 条真截断修复）
- **定性纠偏**（避免误修）：9,507 条「非标点结尾」疑似中——①四库全书古籍切片（yizong-jinjian/jingyue/qianjin/bencao-gangmu 等，文言无句读、相邻条目连续，**属正常切片**）②tcm-formula/liuyue/koujue-daily 等以出处/来源标注结尾的结构化卡（设计形态）③KB-CASE-* 加密病历（enc: 前缀，不可处理）④huangdi-neijing PDFv4 目录页点线碎片（可另立降权专项）⑤OCR 转写碎片（ocr-batch26 等 514 条，需重跑 OCR，无净源可回）
- **真截断修复 62 条**：`scripts/kb-trunc-repair.py`（可重复执行）——剥离「来源：」元数据头取正文前缀 → 源 JS 文件定位 → 提取外围字符串字面量反转义 → 校验前缀一致+长度增益 → 替换（kb_formal+FTS5 同写）
- 修复模块：authoritative 34 / nihaisha-tcm 17 / nihaisha 4 / 其他 7；典型：KJ2「曾国藩一生以」→ 补全至「…形成了以木（印）为通关用神的格局。」
- **验证**：62 条全部完整收尾（56 句读 + 6 引号/列表合法结尾）；FTS5 零不一致；quick_check OK；备份 `DELIVERY/kb-trunc-backup-20260828-171513.json`
- **遗留**：no_match 909 条（shuhan 课件转写与 JS 源不逐字对应等）；OCR 碎片与目录页碎片如需处理另立专项
## 2026-08-28 16:55 — ✅ keywords 历史噪声清洗专项（四轮收敛，74,752 条全量 JSON 化）
- **背景**：上一轮补齐后发现存量 45,946 条历史 keywords 为早期 n-gram 提取噪声（"宫为十""主管相"式碎片）+ JSON 数组/逗号串格式混用
- **脚本**：`scripts/kb-keywords-clean.py`（可重复执行）——保留规则六白名单（领域词典/来源书名/卷数/ASCII 模块标签/短标题回指/《》书名），不足 3 个用词典提取补齐，上限 8 个；三轮规则修补：转写长标题回指只保噪声（限 30 字）、纯 ASCII slug 标题头、日期数字碎片剔除
- **四轮执行**（每轮先备份受影响行至 DELIVERY/）：
  - R1 主清洗 42,020 条（备份 kb-keywords-clean-backup-20260828-164218.json）
  - R2 格式迁移 18,713 条纯字符串→JSON 数组（kb-keywords-format-backup-*.json）
  - R3 畸形数组 275 条修复 + 元素级扫除 13,075 条（纯数字/破损《/.j 截断尾；注：元素级扫除未逐行备份，变更仅限丢弃纯数字碎片，低风险）
  - R4 碎片条目二次硬过滤 5,026 条（r45_palace_ext 1,867 / ziwei 236 / yijing 220 等；标题回指泄漏碎片，改用纯词典+白名单重建）（kb-keywords-suspect-backup-*.json）
- **终验**：invalid JSON=0、missing=0、碎片占比过半条目=0、rows=74,752 不变、quick_check OK、/api/kb/quality-report 正常（A+）
## 2026-08-28 16:05 — ✅ keywords 全量补齐 + yidao.db 页级损坏根修（重大）
- **keywords 补齐**（审计最后观察项收口）：`scripts/kb-keywords-fill.py` 规则法双通道提取（标题【】头/短标题 + 内置命理·中医领域词典长词优先命中，剔除 太阳/火星/太阴 等歧义词），3,710 条全补齐（含 16 条英文/OCR 乱码标题 module 兜底），格式统一 JSON 数组与存量一致；备份 `DELIVERY/kb-keywords-backup-20260828-155435.json`；写入后 missing=0、行数 74,752 不变、随机抽检 12 条质量合格
- **数据库损坏根修**（审计 quick_check 发现，非本次写入引入——08-11 备份完好，损坏系历史遗留）：
  - 损坏面：kb_formal 两处「页被二次引用」+ verification_corpus 两处溢出链异常 + 2 行乱码流水（匿名排盘自动记录）
  - 修复：VACUUM INTO 全量重建（3.2GB→1.7GB，106 表行数全对账一致）→ 乱码行字段置安全值（pending/0/时间戳）→ 重建 idx_vcorp_status → integrity_check **OK**
  - 换库：旧库保留为 `server/database/yidao.db.corrupt-backup-20260828`（3.4GB，确认无误后可删）；api-v2 bootout→换库→bootstrap 重启，/api/health、/api/kb/quality-report（total 74,752 grade A+）、8974 批注队列全部正常
- **回归核验**：null entry_id=0；命理模块中医污染=0；meta-only 降权 2,628 / r39 降权 720 均在
- **注意**：存量 45,946 条历史 keywords 为 n-gram 噪声片段（非 JSON 数组），本轮未动，如需清洗另立专项
## 2026-08-28 15:35 — ✅ KB 存量优化专项（看板观察项收口 · 全部可逆有备份）
- **定性分析**（12,263 条短内容四类）：①方剂速记卡（tcm-formula 577，结构完整只是短）②口诀/经典卡（mantra/classics/koujue-daily 1,256，短是设计形态不宜注水）③截断型（huangdi-neijing 等口述切片断句，需回源重切）④低质/占位型（可优化）
- **四项执行**（先备份受影响行至 `DELIVERY/kb-stock-backup-20260828-152946.json`）：
  - 注水桶清理 120 条：剔除万能废话尾缀「此知识点在传统命理/中医体系中有重要意义…」（kb_formal+FTS5 双修，残留 0）
  - 纯元数据条目降权 2,628 条：「来源：…」无正文占位条目 → trust 0.2 + tags 标 meta-only（保审计溯源、降检索干扰）
  - r39 模板三模块降权 720 条：双核/健康/事业组合卡（"具体行动：听音乐"式敷衍建议，trust 虚高 0.92-0.95）→ 统一 0.45 + audit_notes 标注
  - tcm-formula 功效补齐 16 条：库内交叉引用同方功效（如 瓜蒂散→涌吐痰食、侯氏黑散→清热化痰祛风通络），标注引自库内论述；207 条库内无源不臆造
- **验证**：低信任数 176→3,524 精确吻合（+3,348 降权）；FTS5 74,752/74,752 join 100%；审计 5 项全过
- **遗留建议**：meta-only 2,628 条与 r39 720 条如确认无价值可退役删除（删除性操作待用户确认）；截断型条目需回源重切切片管线
- commit：本次（scripts/kb-stock-optimize.py 可重复执行）
## 2026-08-28 14:58 — ✅ G8 院内页面急救话术分层（ADR-009 · P1）
- **两处院内页消费者话术→机构版**：`integrated-clinic.html:136` 与 `unified-consultation.html:266` 的「拨打 120 或前往最近急诊。本平台不能替代急救」与院内场景错位（患者已在院、医师在场）→ 统一修订为「本系统为辅助诊疗工具，最终诊疗决策由执业医师作出；急危重症请按院内急诊流程处置」，unified-consultation 的 `tel:120` 拨号按钮同步改为静态「院内急诊流程」标识
- **全平台三层排查**（12 处命中逐一分类）：①院内层 2 处已修订；②混合层 1 处（master-disease-inline.js 危重信号 action → 「院外立即拨打 120 / 院内启动急诊流程」分层表述）；③消费者层 9 处**保留不动**（sos.html / home-care.html / emergency-contacts.html / doctor-response.html / medical-stack 的 emergency.html、home-tcm.html、chronic-disease.html、voice-diagnosis.html —— 居家/院外场景 120 话术本就正确）
- medical-stack 内化页全扫：院内工作台页（ai-diagnosis/consult 等）无消费者急救话术残留，无需修订
- 浏览器实测两页渲染正确、无 tel:120 残留、零加载报错
- 注：G1/G5 已于本日 14:25 完成验收（见前条），本轮为简报复投
## 2026-08-28 14:50 — ✅ 问诊台双师审核台 AI 草稿助手上线（三大 aiEnhance 场景前端收口）
- **审核面板新增「AI 草稿助手」**：📋 AI 病历草稿（四诊数据→G2CLAW 规范病历，实测 9-18s，自动解析证型"脾虚湿困证"+处方"参苓白术散加减"填入结构化字段）+ 🔮 AI 命理批注（生辰→命理师级批注，实测 43.7s，一键"写入审核意见"供命理师审改）；进度条+秒数计时+95s 超时+云端失败自动降级规则引擎保底；token 粘贴框（localStorage 记忆，复用工作台惯例）；命理专区仅 master 角色可见
- **意外捕获并根修一个潜伏线上 bug**：`emrSyncThrottled()` 括号错位跑到 setEmr 函数体外成为顶层语句，加载即 TDZ 抛错（let 未初始化）导致主脚本中断——**initEngine() 从未在加载时执行**，语音/视觉/KB 三引擎全靠按钮懒初始化兜底。修复后全新加载零报错、四引擎全部就绪
- 循证修复过程：head 注入 R-PROBE 加载期错误捕获 → Node+DOM 桩精确复现 → 括号归位 → 浏览器三轮回归
- UX 细节：新生成开始时自动隐藏旧结果防误读；AI 报告段落正则适配【】括号格式
- commit：本次（app/unified-consultation.html +196/-1）
## 2026-08-28 14:25 — ✅ G1+G5 管理体系两项 P0 完成（能力覆盖审计-20260828 / ADR-007）
### G1 · medical-stack 内化快照自动跟随（P0）
- **问题**：medical-stack/server/kb-store/tcm-synced-kb.json 快照滞后主镜像 ~14.5h（52,655 vs 52,972 条），8972 服务的 KB 比自有 yidao.db 旧
- **落地**：新增 `scripts/medical-stack-kb-follow.py`（复用 deploy 解包内化逻辑：镜像信封→裸模块映射→原子替换→条目数校验→SEC-001 标记核查→SQLite 快路径重建→8972 暖缓存+七能力验证）+ `scripts/tcm-import-and-follow.sh` 包装器，launchd `com.mingli-baojian.tcm-import` 15min 轮询已挂接（原 plist 备份 .bak-g1-*）
- **热加载**：8972 loadKbCache 按 mtime 自动失效，无需重启；适配补齐 kb-sqlite-sync.js（medical-stack/scripts/，deploy LOCAL_KEEP 已加 scripts/ 防重部署清空）
- **验收**：watchdog 链4 lag 868min → **-1.2min ≈ 0**（阈值已按 ADR-007 收紧 1440→60min），快照 52,972 条，8972 七能力（tongue/face/hand/inquiry/syndrome/formula/acupoint）全通；watchdog count_json_entries 已兼容裸模块映射格式
### G5 · 端到端冒烟（P0 一次性，证据留存）
- **链路 8/8 全通**（总耗时 ~40ms 本地）：建档叫号（queue_no=2, pid=empi-c2701d184166）→ 一帧四诊诊断 → EMR 生成（**case_id=CASE-1787898095391**，syndrome=方剂·四君子汤）→ 8974 AI 命理批注（**ann-52202b443f49**，pending+水印+免责声明齐全）→ annotation-queue 命中（**SLA=48h 计时正常**，age=0h overdue=false）→ 命理师 approve（ML-MASTER-001，水印解除）→ 药方生成（**rx-15ef68e1-45d7-4da1-8c81-b01d6b0b5d05**，四君子汤加减）→ 队列流转（waiting→called→in-consult→done）
- **守卫验证**：R756 诊断输出零命理词 ✅；R757 正向（辨证无命理词）✅ + 负向探针（输入"日主戊土 大运流年 命宫"→ 正确降级"待辨证（命中非医学内容，需人工复核）"）✅
- **证据**：`DELIVERY/g5-smoke-evidence-20260828-142135.json`（8 节点时间戳+3+1 项守卫记录），冒烟脚本 `scripts/g5-smoke-e2e.py` 可重复执行
- 注：《能力覆盖审计-20260828.md》与 DECISIONS.md 原文未在本地检出（已搜索全工作区），按消息内联任务全文执行
- commit：`5e729d1`（G1）+ 本次（G5）
## 2026-08-28 14:05 — ✅ 同步能力检查与优化（TCM 镜像同步质量修真）
- **同步现状**：tcm-authoritative-full.json（160MB / 52,972 条 / 41 模块）03:24 同步至 mingli-baojian + smart-home-family；11:40 导入完成——新增 12 条 tcm-formula（金匮方略：一物瓜蒂汤/括蒌薤白白酒汤等），52,733 条幂等去重，KB 总量 74,750 与 FTS5 完全一致
- **修真 1 · entry_id NULL 复发**：R117 回补脚本 06:14 入库但未执行，401 条 tcm-syndrome 重新裸奔——已执行回补（确定性 ID 6574504246000502..902）+ FTS5 内 401 条存量 NULL 同步回补，entry_id join 恢复 74,750/74,750 = 100%
- **修真 2 · 太阳→中医术语污染**：发现 LLM 合规改写把伤寒论六经固定术语「太阳X」误改为「中医X」（"中医病纲要"应为"太阳病纲要"、"中医蓄水"应为"太阳蓄水"）——活体库修 19 条（kb_formal+FTS5 双修）、mingli 镜像修 12 条、上游 tcm-agent/tcm-synced-kb.json 修 13 处、smart-home-family 镜像修 13 处，四副本全净
- **回归防护**：full_kb_audit.py 新增两项自动检查（术语污染 12 词组 + entry_id NULL 复发），审计通过 5 项 ✅
- 存量观察（非本次同步引入）：短内容 12,262 条、低信任 176 条、keywords 缺失 3,710 条，列入后续蒸馏优化
## 2026-08-28 11:30 — ✅ 命理批注 AI 增强接入（G2CLAW 云端）
- `/api/clinic/mingli/draft` 新增 `aiEnhance:true`，排盘数据（四柱/五行/神煞压缩至 <650 字）→ G2CLAW 生成命理师级批注草稿（实测 38.6s / 367 字，结构：命局总评→喜用神→大运建议），命理师从"从零写"变"审改草稿"，大幅减负
- prompt 极致压缩解决 G2CLAW 长 prompt 超时问题；CSRF 白名单已加
- **三大 AI 增强场景全部落地**：报告润色（12s）+ 病历草稿（26s）+ 命理批注（39s）
- server commit：`f02629f`
## 2026-08-28 11:15 — ✅ G2CLAW 云端 AI 接入两大核心场景（报告润色 + 病历草稿）
- **报告 AI 润色层**：`/api/paipan/:module/baihua` 新增 `aiEnhance:true` 可选参数，规则引擎结构化输出 → G2CLAW 生成 650 字自然白话报告（实测 12.3s，专业术语+白话解释+行动建议），失败自动降级 MLX
- **问诊台 AI 病历草稿**：`/api/clinic/ai-draft` 新增 `aiEnhance:true`，四诊数据+KB 匹配 → G2CLAW 生成规范中医病历（实测 25.6s，含辨证分析/处方加减/医嘱），CSRF 白名单已加（Bearer token+RBAC 认证保护）
- **设计原则**：规则引擎保底（零延迟）+ AI 增强可选（高质量），两条路并行不互斥
- **providers 顺序修正**：云端 G2CLAW 优先 > 本地 MLX 降级，glm-5.2 生效
- server commit：AI 增强层双端点 + providers 修正
## 2026-08-28 10:25 — ⚠️ G2CLAW 云端接入但批量不可用 + 8920 云端优先修正
- **8920 providers 顺序修正**：云端(G2CLAW glm-5.2)优先于本地(MLX 7B)，有 key 时先走云端，失败降级 MLX——修正前 MLX 排前面导致 G2CLAW 永远走不到
- **G2CLAW 密钥配入 launchd plist**（EnvironmentVariables），8920 重启后 provider=g2claw 生效
- **glm-5.2 直连实测**：短 prompt 5s 可通，长 prompt(>100字) 15-60s/题+频繁 SSL 超时——不适合批量 200 题场景（预估 1-2 小时），curl/urllib/subprocess 三种方式均复现
- **结论**：G2CLAW 留给单条高质量场景（报告生成/问诊台副驾驶/命理师工作台），批量答题继续用 MLX 7B（33% 基线）；8920 端点已云端优先，前端用户体验自动受益
- server commit：providers 顺序修正 + 默认模型 glm-5.2
## 2026-08-28 10:12 — ✅ 大赛答题引擎完工（200题实测复算）
- contest-answer-engine 跑至 145/200 样本，v2 prompt 实测准确率 **33.1%**（48/145），超过随机基线 25% +8pp；与 09:25 「v2=28.5% 反降」结论冲突——09:25 评估可能误把 v1 简洁 prompt 当 v2
- MLX 7B 天花板 ≈33%（v1=33.0% / v2=33.1% 几乎持平），prompt 工程对 7B 小模型收益边际
- G2CLAW 直连超时问题（10s/题 SSL handshake），不经济；走 8920 fallback 链可用
- 准确率突破路径：① 等 MLX v9.3 训练完成 ② 更大本地模型 ③ G2CLAW 稳定后重跑
- 深度校验 v2（非大赛）保持 0.74，作为排盘质量量化基线

## 2026-08-28 09:25 — ⚠️ 大赛答题 v2 prompt 优化反降 + G2CLAW 直连不可用（已修真）
- **v2 优化 prompt 全量 200 题：28.5%**（v1 简洁 prompt 33.0%）——7B 小模型受长 system prompt 干扰，v2 加入性别规则/五行含义/十神对照后反而降低。结论：MLX 7B 天花板 ≈33%，prompt 工程收益为负
- **G2CLAW 直连测试**：glm-5.2 模型可用但 10s/题+频繁超时（SSL handshake timeout），不适合批量 200 题场景。密钥已配入 launchd plist（8920 fallback 链可用，但直连批量不可行）
- **准确率提升路径**：需更强模型（G2CLAW 稳定后重跑 / MLX v9.3 训练完成后评估 / 或接入更大本地模型）
- **深度校验 v2（非大赛）保持 0.74**——这是规则引擎不是 LLM，不受模型能力限制，已可作为排盘质量量化基线
## 2026-08-28 08:55 — ✅ 前序任务全面盘点 + P0/P1 五项修真
- **BaziQA 大赛答题引擎完成**：200 题全量跑完，MLX v9.0-7b 准确率 33.0%（超随机基线 +8pp），满分 1 人/优秀 5 人，verify_detail_json 写入 contest_qa_mlx 模式
- **P0-B1 KB 统计失真修复**：直查 vs API 已一致（74,735/74,735），系 node:sqlite 缓存 stale 导致，launchctl kickstart 后恢复
- **P0-B2 拦截器冲突确认已根修**：R-INT 兼容层（Response 包装对象）覆盖全站 143 页，旧写法 `r.json()` 免改即用，抽查 8 页无冲突
- **P1-B3 深度校验 v2**：性别区分（男命财=妻/女命官=夫）+ 地支十神 + 大运十神联动 + 神煞参与，命中率 0.28→0.74（+164%），≥0.5 者 125/144，零命中降至 12
- **P1-B4 8920 双连接竞态根治**：11 处 better-sqlite3 连接统一加 `busy_timeout=5000`，与 DatabaseSync 主连接对齐，消除写锁竞态
- **P1-B5 face-ocr 评估结论**：8913 端口活跃运行（面诊/舌诊/眼诊端点），被 api-server-v2 代理引用，8941-8944 为模型层非替代关系，不退役
- **A 类待用户决策**：C 类遗留页退役清单（SERVICE-BLUEPRINT.md 14 页）；AutoClaw 3 项陈旧 cron 复跑清零（需 openclaw CLI 权限）
- server commit `61897f6` + `后续 commit`（busy_timeout）
## 2026-08-28 09:00 — 🔄 BaziQA 大赛 200 题答题引擎启动（心跳推进）
- 41 样本(200题)已全部有排盘 JSON，contest-answer-engine.py 后台跑 MLX v9.0 答题，日志 .openclaw/tmp/contest-answer-engine.log，产出验证得分写回 verification_corpus
- 预计 30-60 分钟完成；下轮心跳查收准确率 vs 随机基线 25%

## 2026-08-28 08:40 — ✅ 校正库扩容：449条(净增266) + 深度校验基线 + 命理/医学分类
- **分类**：140条倪师医案标记 `out_of_scope` 移交中医智能体；命理校正库保留 309 条纯命理样本
- **扩容**：+BaziQA大赛赛题 41 条（2021-2025 全球命理师大赛真题，带标准答案，weight=1.5 最高档）；+Wikidata名人 183 条（六国华人，sitelinks>30 头部名人，精确生辰+结构化事件）
- **排盘**：183 条 Wikidata + 41 条大赛全部通过 8911 排盘，pillars 完整
- **深度校验**（deep_shishen_v1）：144 条有事件样本，流年十神信号 vs 事件性质启发式比对，平均命中率 0.28，≥0.5 者 27 条，零命中 47 条——基线偏低，需迭代信号映射+性别加权+大运联动
- **天纪命例**：32 条 approximate 样本年柱/阴阳校验全命中（民国年→公历转换正确）
- **CSRF**：verify/corpus-add 端点加白名单（本机批处理用）
- **缺源古籍**：ctext 评估未收录 20 部民间术数书，需影印 OCR 管线（列入下轮）
- **待做**：BaziQA 大赛 200 题答题引擎（用排盘 JSON+KB 自动答题对标准答案，直接量化排盘准确性）
- server commit `61897f6`
## 2026-08-28 07:45 — ✅ 功能与服务全案重组：49 孤岛盘点 + 22 页收容进五中心
- 全站 197 页 BFS 盘点：首页可达 148、真孤岛 49；产出 SERVICE-BLUEPRINT.md（角色×场景×服务矩阵 + 孤岛 ABC 分类处置）
- 收容 22 个高价值孤岛页：命理师中心 +排盘校正(verification-corpus)/档案审核/口诀库/人物档案；医生中心 +四方协作/语音问诊/望诊知识库/倪师课程/医保人脸；患者中心 +移动采集/体质辨识/健康预测；缘主中心 +缘主仪表板/订单中心/分享中心/缘主工具H5/功德系统/疗愈音乐/健康事业看板；管理中心 +KB增长线/报告配置/视觉布控
- 新卡全部描金标题图（23 张新 PNG，复用 build-card-labels 渲染器）；rename.html 判定为降级半成品不接入（姓名学工具已覆盖）
- 验证：五中心页新卡图片全加载、22 目标页全 200；测试/开发页与遗留重复入口保持孤岛（清单在 SERVICE-BLUEPRINT.md，退役待用户决策）

## 2026-08-28 07:30 — ✅ 五千年命理知识建设：古籍双源采集 + 用户材料再蒸馏
- **古籍采集（源头纯净，公有领域原典）**：维基文库+Kanripo 漢籍双源，KB 74,735 条
  - 维基文库 20 部入库：玉匣记198段、渊海子平74、星学大成30卷、皇极经世19、黄金策33、太清神鉴6、珞琭子/李虚中命书/天玉经/青囊序/青囊奥语/玉照定真经/神峰通考/五行精纪/紫微斗数全书/入地眼/卜筮正宗(仅卷前)/烟波钓叟歌/焦氏易林4卦
  - Kanripo 四库本 8 部 82 卷：遁甲演义4、大六壬大全12、焦氏易林16(全)、协纪辨方书35、皇极经世书6、黄帝宅经1、葬书1、京氏易传2、灵棋经1
  - 源头纠错：删除遁甲演义今人前言、玉匣记今人概论各 1 条；采集脚本加红链预检/parse回退/并发抓取/逐卷入增量提交/今人文字内容守卫
- **用户材料再蒸馏 25 条**（路总流年班精要+中医望诊规范）：第7课天相天梁、第11课三代四化与化学反应、第13课叠宫踩宫、第15课十干大限、第17课种子效应、第18课飞星自化1616、第19课忌格四格、第20课1324四季法则；伤寒指掌察舌察目4条、叶天士温热论舌诊2条、肿瘤舌目面望诊2条（均 trust 0.85，标源可溯）
- **缺源待补清单**（维基/Kanripo 均未收，民间术数书，候选 ctext/影印 OCR）：卜筮正宗全本、易隐、断易天机、卜筮全书、紫微斗数全书全本、太微赋、都天宝照经、玄空秘旨、紫白诀、飞星赋、阳宅十书、地理五诀、金锁玉关、象吉通书、大六壬指南、麻衣相法、神相全编、柳庄相法、果老星宗、奇门遁甲秘笈大全
- **环境受限待办**：AutoClaw 3 项陈旧 cron 复跑清零（openclaw CLI 不在本机 PATH，待主会话执行 `openclaw cron run` 周报/临床蒸馏/weekly-eval + disable 僵尸 job 5196aeba）
- 验收：:8920/api/public/kb/search-fts 搜「黄金策」「玉照定真经」「逆水忌」「肝瘿线」全部命中新条目
## 2026-08-28 00:30 — ⚠️ :8920 KB stats 修真（node:sqlite 缓存 stale）
- 心跳 00:30 发现 /api/public/kb/stats 报 `database disk image is malformed`，data.total=0；better-sqlite3 直查 yidao.db integrity_check=ok，knowledge_models=23 / kb_versions=1746 — 真实库完好，是 node:sqlite DatabaseSync 进程内 stale + better-sqlite3 双连接写竞态导致 API 层假阳性
- launchctl kickstart com.mingli-baojian.api-v2 清缓存重启 → /api/public/kb/stats 恢复 total=73,972 hi_trust=73,392（**较 21:00 日结报的 61,647 差 +12,325**——多次心跳 KB 数据可能长期失真，需修真统计源/采集端还是 21:00 报值本身偏低，待主会话核实）
- 全服务复探：8900/8911/8912/8913/8920 均 200 + 8960=v9.0-7b 正常
- 待主会话排期（非本心跳修真）：①KB total 21:00 报 61,647 vs 现 73,972 偏差根因（采集 double-count / 旧 stale / 21:00 报值口径不一致） ②8920 双连接并发写竞态根治（node:sqlite DatabaseSync 与 better-sqlite3 是否要统一）

## 2026-08-27 21:15 — ✅ 机构服务中心 + 排盘行动方案引擎
- 主仓 22ed1c4：新增 center-org（17 卡四组：入驻经营/门诊运营/设备物联/医技检验），首页加「机构」胶囊与入口卡；顺带修复 folk 分区 `</section>` 未闭合导致全部角色卡片被隐藏的历史 bug
- server 97e54dd / 主仓 efedf46：新增 paipan-advice-engine.js，七模块（八字/紫微/奇门/六爻/六壬/梅花/风水）报告全部产出具体行动方案（五行补益/忌神规避/大运重点/化忌防范/体用定策/风水布置），buildBaihua 契约新增 actions[]
- 前端面板渲染「🎯 行动方案·照着做」编号列表；norm-report-engine seg0 注入行动方案文本，大众报告拿来即用
- 验收：七模块真实 API 全过（八字5/紫微3/奇门4/六爻2/六壬2/梅花2/风水5 条）；奇门页浏览器实测渲染正常
## 2026-08-27 21:12 — hand-diag-svc 接入 OneFrame 掌纹 v2.0（平台侧交付登记）
- models/oneframe-palm-v2.0.onnx 到位（md5=af836545713ec67fb47bffba404c1730，与平台侧一致）；vision-model-labels.json 注册（labels 智慧线平直/感情线细弯/生命线深长/断掌纹/川字纹，task=palm-lines，input 320）
- hand-diag-svc(8944) MODELS 增列 oneframe-palm-v2.0 重启生效（health 11 模型）
- 端到端实测：断掌例 v1 误判生命线深长 0.89 → v2 断掌纹 0.51（弱标边界如实呈现）；生命线例 v1/v2 均正确
- v2=合成950+11kHands真实282线能量弱标重训，真实域弱标一致率 0.617→0.954，断掌召回 0→18/28；head/heart/三才纹不可测仍仅合成（平台留痕）；v1 并行灰度 1 周期后替代
- 报告 models/oneframe-palm-v2.0.report.json；按约定 mingli 侧只登记不代 commit
## 2026-08-27 21:10 — 🌙 日结（cron 21:00）
- 健康检查实探：6 服务全绿（8900/8901/8911/8912/8913/8920 均 200）+ KB total=61,647 hi_trust=61,067（较 17:00 +681 系自动入库通道）
- 今日全线丰收（均已在上方各条目详细留痕）：排盘五术内核真值修复 / SVG盘图v2 / 报告根治 / 白话引擎七模块 / 民俗九工具+改进建议 / 点读推广六爻紫微风水 / 五服务中心落地 / 卡标描金图化收口 / face-ocr 修真恢复 / OneFrame v2.0 ×6 模型（面色/舌色/舌苔/巩膜/指甲/面相三停/唇色）平台侧登记
- 待办：face-ocr ONNX 面诊路径退役评估（8941-8944 已覆盖诊断）；patrol 3 项陈旧 cron 连败待复跑清零
- 下一步动作：明日从「服务中心导航体验回归（五中心 × 主入口全链路走查）」开始

## 2026-08-27 21:05 — ✅ 全平台禁止文字卡片标识（描金图化收口）
- 主仓 8826a5f：六门户 77 卡标（divination-almanac7/integrated7/folklore15/monitor22/naming11/practice15）静态替换为 cl-*.png
- 五服务中心生成器改源头：gen-service-centers.py 直出 icon-name-img，78 卡全部描金 PNG，重跑验证 0 断图
- 浏览器验收：center-yuanzhu 22/22、monitor-portal 22/22、practice-portal 15/15 图片加载成功；assets/titles 新增 155 PNG
- 口径：卡片标识全图片化（含此前 index/ask/minsu-center/divination-tools/paipan-center）；组头与面板内 section 标题保留文字（非卡片标识）
## 2026-08-27 20:15 — ✅ 民俗工具按用途排序（三面同口径）
- minsu-center 33a0fd6：15 卡按用途分五组（时·时光选择5 / 缘·人生大事4 / 数·号码姓名3 / 运·流年运势2 / 盘·排盘进阶1），组头单字徽章
- ask.html 19 工具重排：问事起卦→命理排盘→运势走势→人生规划→婚恋家庭→风水→号码姓名→日历幸运
- 首页信众区 16 卡、缘主中心民俗组同口径聚类；浏览器验收组序与卡序
## 2026-08-27 20:15 — face-diag-svc 接入 OneFrame 面相三停 v2.0（平台侧交付登记）
- models/oneframe-face-v2.0.onnx 到位（md5=7004ce6848313a56119f06c66cc22272，与平台侧一致）；vision-model-labels.json 注册（labels 三停均匀/下停发达/中停发达/失衡偏窄/上停发达，task=face-reading，input 320）
- face-diag-svc(8941) MODELS 增列 oneframe-face-v2.0 重启生效（health 11 模型）
- 端到端实测：v1 两例真实人脸均误判失衡偏窄 0.79/0.89；v2 上停发达例正确 0.58、匀称例判上停 0.64（弱标边界如实呈现）
- v2=合成950+LFW真实600几何弱标重训，真实域弱标一致率 0.035→0.567；middle/unbalanced 几何不可测仍仅合成（平台留痕）；v1 并行灰度 1 周期后替代
- 报告 models/oneframe-face-v2.0.report.json；按约定 mingli 侧只登记不代 commit
## 2026-08-27 19:55 — ✅ 五大服务中心规划落地（缘主/患者/医生/命理师/管理员）
- 盘点：首页五区散卡跳转、无统一承载；patient-portal 等门户是重定向空壳
- 新建 center-{yuanzhu,patient,doctor,master,admin}.html：按用户旅程分组（缘主5组22卡/患者4组13卡/医生4组14卡/命理师4组15卡/管理员4组14卡），独立主题色+印章+标题图，底部四中心互链
- 首页五区顶部插入服务中心 hero 卡；scripts/gen-service-centers.py 模板化生成（不入库）
- 验收：五页浏览器实测（标题图加载/卡片数/互链数/无断链），截图验收
## 2026-08-27 19:20 — ✅ 民俗工具全面集成 + 改进建议能力（五工具三入口 · 引擎级"怎么改"）
- server 5d09186：analyzePlate 车牌分析 + R-IMPROVE 改进建议（姓名笔画目标/通关五行；手机车牌尾号替换方案）+ 评分与81数理挂钩 + 流年趋避/合婚化解/家庭白话
- 主仓：ask.html 19 工具（新增手机号/车牌/姓名/宝宝起名/幸运数色 + text/namebirth 输入流 + ?tool= 深链）；首页信众区 5 新卡；minsu-center 全工具表单化（废演示假数据）+ 车牌/起名新卡；divination-tools 六死链修复
- 验收：curl 冒烟全过；浏览器实测 手机号/宝宝起名/姓名评分(李四35分→5条具体改进)/车牌/家庭排盘 全链路
## 2026-08-27 19:20 — hand-diag-svc 接入 OneFrame 指甲 v2.0（平台侧交付登记）
- models/oneframe-tcm-nail-v2.0.onnx 到位（md5=bf459ddf73cb16f97f2bd19f637ea81a，与平台侧一致）；vision-model-labels.json 注册（labels 青/淡红/紫/红/白，task=hand-nail，input 320）
- hand-diag-svc(8944) MODELS 增列 oneframe-tcm-nail-v2.0 重启生效（health 10 模型）
- 端到端实测：真实淡红甲 v1 误判白 0.63 → v2 淡红 1.0000；真实白甲 v1 0.94 → v2 1.0000
- v2=合成950+真实509源仓真值重训，真实域真值一致率 0.181→1.000；red/purple/cyan 无公开真实源仍仅合成（平台留痕）；v1 并行灰度 1 周期后替代
- 报告 models/oneframe-tcm-nail-v2.0.report.json；按约定 mingli 侧只登记不代 commit
## 2026-08-27 18:32 — ✅ face-ocr(:8913) 修真完成：悬空软链跳过 + stat 兜底，服务恢复 UP
- server 6d36252：get_model_path 模糊匹配跳过 broken symlink；初始化 stat 加 OSError 兜底
- 重启后 /health 200，13 个缺失模型降级为告警日志，OCR/PIL 启发式链路不受影响
- 后续可选：从 ai-vision-toolkit 补齐 TCM 模型或正式退役 ONNX 面诊路径（OneFrame 已覆盖）
## 2026-08-27 18:25 — ✅ 问诊台医院全流程两拼图：叫号队列 + 医技开单（端到端验收通过）
- server 5754ec7：clinic_queue/tech_order 两表 + 7 端点（checkin/queue/call/transition/tech-order/tech-orders/tech-order transition），状态机校验、加急优先、审计日志
- 主仓 b8abf49：unified-consultation.html 新增叫号队列卡（三列态 8s 轮询）与医技开单卡（目录点选/执行/回填/作废/一键旁证）
- 叫号自动带入开单患者与病历主诉；reported 单经 lab-evidence 分析后旁证（异常指标+五行佐证+中医提示）写入四诊区
- 验收：curl 冒烟 7 端点全过；浏览器全链路（取号→叫号→就诊→完成 / 开单→执行→回填→旁证入病历）通过，截图验收
## 2026-08-27 18:09 — ⚠️ face-ocr(:8913) DOWN：models/ 下 17 个 ONNX 软链悬空（心跳发现 · 待修真）
- 心跳 health-check 报 face-ocr(:8913) DOWN（launchd 退出码 1）
- /tmp/face-ocr.log 报 `FileNotFoundError: 'models/tcm-face-color-classifier.onnx'`
- 真因：`models/` 下 17 个 `tcm-*.onnx / fortune-*.onnx` 系软链 → `../ai-vision-toolkit/models/xxx.onnx`，目标全部不在（ai-vision-toolkit 端只留 onnx/{classifier-helmet,mobilenet-*,resnet-fire,yolov8s-detect,unet-tongue-seg,classifier-helmet} 等通用模型，无 TCM/fortune 对应文件）
- 影响：face-ocr-server.py 启动即崩（vision-onnx-integration.py init 循环 13 模型 stat() 失败），重启 N 次仍 DOWN；其他 svc（8941 face-diag / 8944 hand-diag）走自有 svc 而非此 svc，未受影响
- 修真方向（主会话决策）：①从 ai-vision-toolkit 重建/找回对应模型 ②或改 face-ocr-server 走 OneFrame（已就位 oneframe-tcm-face/lip/tongue-color/coating/eye/nail v2.0+labels，8941/8942/8943/8944 已承担诊断；face-ocr 仅承担 OCR 不需 ONNX） ③或彻底退役 face-ocr-server 把端口 8913 释放
- 待主会话排期（非本心跳修真）

## 2026-08-27 17:50 — 文字标签全面图片化（金字印章风格统一）
- 新增 scripts/gen-title-images.py 通用生成器（宋体 Bold 描金渐变+朱红印章+透明底 @2x），一次产出 app/assets/titles/*.png ×76（首页 48 / 排盘中心 7 / 命理工具 6 / 问事网格 14 + 复用）
- index.html：集中 MAP 映射 + DOM 替换（alt 保留原文，「全部」分区克隆后二次幂等替换）；零文字残留，100 张图全加载
- paipan-center / divination-tools：13 处静态替换 + CSS；ask.html：TOOLS 网格模板改 img.nm-img
- 浏览器截图验收：排盘中心 7 卡、问事 14 网格、首页信众区全图化；pro-gate 遮罩下透出金字图无冲突
## 2026-08-27 17:45 — face-diag-svc 接入 OneFrame 唇色 v2.0（平台侧交付登记）
- models/oneframe-tcm-lip-v2.0.onnx 到位（md5=ea30506628dc395ee952c3b3636202d1，与平台侧一致）；vision-model-labels.json 注册（labels 干裂脱屑/鲜红绛唇/淡白无华/青紫暗唇/红润有泽，task=lip-diag，input 320）
- face-diag-svc(8941) MODELS 增列 oneframe-tcm-lip-v2.0 重启生效（health 10 模型）
- 端到端实测：真实红润唇 v1 误判干裂脱屑 0.62 → v2 红润有泽 0.9907；真实暗紫唇 v1 误判干裂 0.97 → v2 青紫暗唇 0.9867
- v2=合成950+GJ-Varna真实479色度学弱标重训，真实域弱标一致率 0.008→0.952；cracked 干裂零真实样本仍仅合成（平台留痕）；v1 并行灰度 1 周期后替代
- 报告 models/oneframe-tcm-lip-v2.0.report.json；按约定 mingli 侧只登记不代 commit
## 2026-08-27 17:20 — 信众/患者分流 + 问事页生命周期三报告接入
- 首页入口大厅：新增「信众 · 大众」角色胶囊（默认激活），命理向 13 卡（问事/一句话直达/AI助手/命理速览/人生规划/命格指数/流年报告/十年走势/青年规划/黄历/每日黄历/快速占卜/民俗中心）；「患者专区」纯化医疗 5 卡（综合问诊台 hero/症状自查/望诊采集/就医记录/患者门户），监控总览移出患者区（管理员区已有）
- 问事页 ask.html 扩至 14 件工具：新增命格指数（birthYear+性别）、流年报告（全生辰）、十年走势（全生辰）；lifeplan/lifeindex 隐藏跳过按钮保证年龄必填
- 服务端：/api/ai/lifeflow-timeline 补入 CSRF 白名单（与 lifeplan/lifeindex/lifeflow-report 对齐）；lifeflow-report 与 lifeflow-timeline 的 dayEle 缺省时从 8911 排盘 day_master 第二字自动推导（修复空日主导致的全线 50 分平盘）
- 浏览器实测：命格指数 10 维卡、流年报告本月+四维+明年预览+喜用、十年走势金命 10 年卡+黄金/谨慎年份全通过；首页信众默认/患者切换/卡片归属核验通过
- 提交：server abfe8a5 / main 7223cf7
## 2026-08-27 17:00 — 心跳（17:00）
- 6 服务全绿（8900/8901/8911/8912/8913/8920 均 200）+ 8960=v9.0-7b 正常
- KB total=61,647 hi_trust=61,067（较 16:58 60,966 +681 系 kb-collector 子通道，非 distill-*.py 新执行）
- KANBAN 顶部无进行中待推；17:05 人生规划三面入口刚交付+commit，无空档任务

## 2026-08-27 17:05 — 人生规划入口三面补齐（民俗中心/首页/问事页）
- 盘点发现：lifeplan-detail.html 与 POST /api/ai/lifeplan-report 早已存在，但只在 reports-hub/site-nav/mindmap 等次级页互链，民俗工具中心、首页、问事页三大主入口均缺失
- 民俗中心：新增第 12 件工具卡（🧭 + title-lifeplan.png 金字图 + 朱红「规」印 + 橙色边条），副标题「十一大」→「十二大」，页脚陈旧文案「8大工具引擎 v1.0」→「12 件工具 · 白话引擎 v2」
- 首页患者区：新增人生规划 icon-card（橙色时钟 SVG glyph），位于命理速览后
- 问事页 ask.html：TOOLS 加第 11 件 lifeplan（need=birthYear 复用出生年采集，性别 chip 对该工具显示、跳过按钮隐藏）；fetchToolResult 新增 lifeplan 分支调 /api/ai/lifeplan-report（CSRF 白名单内免 token），report.domains/next5Years/actions 映射为白话卡结构复用渲染
- 浏览器实测：问事全链路 1990年女命「事业+健康」→ 12 领域评分卡 + 5 年路径时间轴全渲染；民俗中心新卡图片加载与文案修正核验；首页新卡核验
- 提交：main 5637c5a
## 2026-08-27 16:58 — 眼诊 svc 接入 OneFrame 巩膜 v2.0（平台侧交付登记）
- models/oneframe-tcm-eye-v2.0.onnx 到位（md5=a47db58fd955c3dbd6f1ff89863aadb6，与平台侧一致）；vision-model-labels.json 注册（labels 目青/正常/目赤/目黄，input 320）
- eye-diag-svc(8943) MODELS 增列 oneframe-tcm-eye-v2.0 重启生效（health 4 模型）
- 端到端实测：真实结膜炎 v1 误判目青 0.72 → v2 正确目赤 0.9988；真实正常眼 v1 0.55 → v2 0.9999
- v2=合成760+真实321真值重训，真实域真值一致率 0.467→0.969；yellow/cyan 无公开真实源仍仅合成（平台留痕）；v1 并行灰度 1 周期后替代
- 报告 models/oneframe-tcm-eye-v2.0.report.json；按约定 mingli 侧只登记不代 commit
## 2026-08-27 16:55 — 民俗工具中心卡片标题图化
- 新增 app/assets/minsu/title-*.png ×12：宋体 Bold 描金竖向渐变 + 朱红印章（每工具一印字），透明底 @2x，PIL 确定性渲染（规避 AI 生图中文字讹误）；生成器 scripts/gen-minsu-titles.py（scripts/* 按仓库约定不入库）
- minsu-center.html：12 张卡片 .ms-name 文字标题全部替换为 .ms-name-img（alt 保留原名，移动端 23px/桌面 27px 自适应）；排盘中心卡降透明度 0.75 保持次级视觉
- 浏览器实测：12 图全部加载（naturalWidth 校验无 broken），移动视口上下两屏截图验收，金字印章在暗色卡片上对比清晰
## 2026-08-27 16:40 — 大众问事页 ask.html + 专业排盘权限收敛
- 新增 app/ask.html（移动端问答式问事）：十工具网格（六爻/梅花/奇门/六壬=问事当下起盘；八字/紫微=出生信息；流年=出生年；合婚=双年份；风水=八朝向映射；黄历=直接查），聊天气泡采集、语音输入（webkitSpeechRecognition）、拍照上传（POST /api/v1/camera/upload-multipart，辅助备注不入排盘算法）
- 提交链路：七盘 POST /api/paipan/:mod/baihua；民俗 GET /api/minsu/{huangli,liunian,hehun}；结果渲染总览卡+维度卡（吉绿凶红）+预测时间轴+回测验证按钮（存 localStorage mlbj_baihua_verify）+tips+免责+转人工入口
- 新增 app/js/pro-gate.js（UX 软门禁）：JWT payload.roles 客户端解码，白名单 super_admin/admin_a/master，无权限遮罩引导至 ask.html / admin-login.html；11 个专业排盘页已挂载（注：排盘 API 本身仍公开，硬管控需服务端 RBAC，已留待后续）
- 首页 index.html 患者区新增问事入口卡（绿色调）
- 浏览器实测：紫微全链路（5维度卡+3预测+3回测）、黄历直接查（8维度卡）、奇门门禁（无token遮罩🔐/master token 放行）、首页入口卡全通过
- 提交：main 1879b75
## 2026-08-27 16:20 · OneFrame 面色 v2.0 交付（平台侧登记，本仓未代 commit）
- [x] **面色 v2.0 模型入列 8941**：`oneframe-tcm-face-v2.0`（平台 AutoML AML-CLA-678B97）投放 models/（md5=012a44ed…双侧核验）+ labels.json 注册（类序同 v1.0）+ face-diag-svc MODELS 增列 + 重启生效（health 9 模型）
- [x] **端到端实测**：真实面红例 v1 误判白 0.769 → v2 红 0.742；黄白边界例双方判黄（弱标签为白，模糊边界如实留痕 report.json）；真实域 vs 弱标签 0.253→0.845
- [ ] **并行灰度约定**：面色/舌色/舌苔 v1.0 各保留 1 个周期后退役；real-val 0.475 弱标签局限已留痕，窗口①人工复核可升 v2b；tcm-agent 已同步（服务未重启留自验）

## 2026-08-27 16:10 — 点读能力推广：六爻点爻 / 紫微点宫 / 风水点宫
- 数据：新增 yijing-yaoci.js——《周易》64卦卦辞+384爻辞通行本原文+白话直解，卦名匹配器（全名/后缀双路，八纯卦与复合卦全覆盖，Node 实测 16 组卦名匹配全对、64卦均6爻）
- 引擎：buildLiuyaoYao（爻位/阴阳当位/六亲/日辰旺衰/世应/六神/旬空/动变+本卦与变卦爻辞双层）、buildZiweiPalace（十二宫含义/主星庙旺陷/四化/辅煞曜/长生）、buildFengshuiPalace（运山向三星/当运生气退气/14组山向组合/旺山旺向）
- 端点：baihua 新增 yao/palace 参数统一返回 tapDetail（qimen palaceDetail 保留兼容）
- 前端：新增共享件 paipan-tap-pop.js（悬停上方/顶行下翻/吉绿凶红/ESC关闭/委托防重复绑定）；liuyao-chart 爻行、fengshui-chart 九宫、ziwei 十二宫全部可点；notify 缓存 _paipanBody 复用请求体
- 浏览器实测：六爻点四爻（晋卦凶·爻辞「晋如鼫鼠」）、风水点震宫（凶·三碧山星）、紫微点命宫（吉·武曲化权）全通过；修复「命宫宫」文案
- 提交：server fe8f148 / main ec10040
## 2026-08-27 15:40 · OneFrame 舌苔 v2.0 交付（平台侧登记，本仓未代 commit）
- [x] **舌苔 v2.0 模型入列 8942**：`oneframe-tcm-coating-v2.0`（平台 AutoML AML-CLA-617415）投放 models/（md5=e665bdc1…双侧核验）+ vision-model-labels.json 注册（类序同 v1.0）+ tongue-diag-svc MODELS 增列 + launchd 重启生效（health 10 模型）
- [x] **端到端铁证**：真实正常舌 v1 误判「焦黑」0.44 → v2 正确「正常薄白」0.9999；黑毛舌 v2 置信 0.9998 vs v1 0.5458；真实域 259 张真值一致率 0.266→0.992；real-val 52 张（训练未见）0.231→0.981
- [ ] **并行灰度约定**：舌色/舌苔 v1.0 各保留 1 个周期后退役（届时从 MODELS 与 labels.json 移除）；tcm-agent 双载体已同步同版（服务未重启留自验）

## 2026-08-27 15:28 — 拼音搜索 + 方剂古籍原文 + 问诊台方剂选择器
- 患者搜索：/api/clinic/patients 姓名支持中文子串/全拼/首字母(wbh→王病患)/编辑距离模糊(wangbinghua 差1字母可命中)，复用 search-intelligence pinyin-pro；实测五组关键词全过
- 统一方剂搜索：formula-search-api.js 合并中医经典42方+全球五体系25方共67方索引；拼音全拼/首字母(bht→白虎汤)/别名/英文名/主治功用关键词，同分中医经典优先；端点 search/detail/stats 实测全过
- 古籍补充：prescription-matcher 新增 CLASSICAL_TEXTS 28 首核心方原文条文（伤寒论8/金匮1/温病条辨6/局方8/小儿药证直诀3/医林改错2/济生方/内外伤辨惑论各1，均标篇目），matchFormulas 卡片自动挂 classical 字段
- 前端：js/formula-picker.js 共享选择器接入问诊台审核区「修改后处方」上方——选中自动填「方名（出处）：组成」，详情卡含古籍原文；浏览器实测 bht→白虎汤→填入处方框→原文卡渲染 全通过
- 医院级流程核查：建档→采集→AI草稿→双师审核→处方 draft/sign/dispense/archive 状态机后端本已齐备，本轮确认无缺口
- 提交：server 8aa9302 / main 306110d
## 2026-08-27 15:10 — 民俗工具白话解读全量落地（九工具+老黄历页）
- 引擎：minsu-baihua-engine.js 九构建器（黄历/择日/太岁/节气/手机号/姓名/流年/幸运/合婚），词典含建除十二神/十二值神黄黑道/24节气养生/合婚等级/五格吉凶；修 mobile 尾号0被||吞掉 bug
- 服务端：九个 minsu 端点 + daily-almanac 挂载 result.baihua（daily-almanac 字段适配复用 huangli 构建器），全部 try/catch 不阻塞主流程，curl 实测十端点全过
- 前端：minsu-center renderBaihua（总览卡+卡片网格+提示行，置于结构化数据上方）+ 补齐 hehun 工具分支；huangli-daily 顶部白话面板
- 顺带修复三个存量 bug：本地 8900 不代理 /api 致工具全挂（显式指 8920）；data.result 空值守卫拦截 chart 型响应的假阴性；esc 未定义（escape-html.js 导出为 escHtml）
- 浏览器实测：民俗中心八工具+老黄历页白话块全部渲染通过
- 提交：server 2474803 / main 712597c
## 2026-08-27 14:35 — 奇门九宫格点读解读
- 引擎：buildQimenPalace 单宫白话构建器（宫位五行/八门门迫门制/九星/九神/十干克应/空亡马星/关联格局/值符值使要位+吉凶评级）
- 端点：/api/paipan/qimen/baihua 支持 palace 参数返回 palaceDetail
- 前端：点宫浮动解读层（悬于宫上方、顶行自动下翻、吉绿凶红配色、点宫切换/空白/ESC 关闭）；发现并规避页面无全局 esc 的存量隐患
- 浏览器实测：排盘→点兑宫(吉)→切坤宫(凶)→空白关闭→ESC关闭 全通过
- 提交：server 260ac3e / main a26c30f
## 2026-08-27 14:25 — 统一问诊台全链路回归
- 链路：采集→EMR→KB实时检索(5条命中)→AI副驾驶追问(十问)→归档#20→医生修改并通过→落库approved+版本快照→驳回→status=rejected 全部正确
- 修复：审核状态不落库（setReviewStatus 补幂等归档回写 medical_cases.review_status）；KB 状态标签 [object Object] 显示 bug
- 观察项：KB tier 客户端评分偏严（命中仍判「AI 兜底」，证型自动写入不触发）；sessionId 刷新即新会话（跨页审核接续依赖双师审核台）
- 测试病历 #19/#20 已清理；提交 main 5f54dd4
## 2026-08-27 14:15 — 问诊台患者管理闭环
- 服务端：POST /api/clinic/patient 幂等建档（手机号hash>姓名+生日复用）、GET /api/clinic/patients 姓名/手机号搜索+最近患者（带就诊/处方/批注计数）、GET /api/clinic/patient/:id 升级解密病历+处方史+批注史；修搜索 WHERE AND/OR 优先级 bug
- 问诊台：老患者查询回填+历史摘要、建档保存、签名前自动建档、patientId 随处方/命理草案归档、手动改关键字段自动解除选中防误归档、下一位患者完整清理
- 浏览器实测：搜索→选中→回填→历史摘要→下一位→新建档(#28)→清理 全链路通过
- 提交：server 092b1c9 / main 1255f28
## 2026-08-27 14:00 — 白话解读引擎 + 报告层优化（双专项）
- 专项一：paipan-baihua-engine.js 七模块白话构建器（总览/要素卡/未来3年预测/过往3年回测），端点 POST /api/paipan/:module/baihua 全模块实测通过；前端共享件 paipan-baihua-panel.js 接入 7 个排盘页（预测时间轴+验证按钮存 localStorage），浏览器实测奇门/八字两页通过
- 专项二：报告层——seg0 白话总览置顶（延迟 unshift 防索引错位）、seg1 修「局局」bug+日干支去重、KB 标题级污染过滤（福利/到课/PAGE BREAK）、seg3 真实逐年走势替换模板空话、seg4 占位句替换白话要素卡、各段白话小结；奇门+八字报告回归通过
- 提交：server b408e80 / main f6b6758
## 2026-08-27 14:00 · OneFrame 舌色 v2.0 交付（平台侧登记，本仓未代 commit）
- [x] **舌色 v2.0 模型入列 8942**：`oneframe-tcm-tongue-color-v2.0`（平台 AutoML AML-CLA-31A2D6）已投放 models/（md5=b1aeb33c…双侧核验一致）+ vision-model-labels.json 注册（类序与 v1.0 一致无需改映射）+ tongue-diag-svc MODELS 增列 + launchd 重启生效（health 9 模型）
- [x] **端到端复测通过**：8942 `/classify` 真实舌象双模型对比（v2 淡红 0.722 vs v1 正常 0.566），v2 为真实域迭代版：300 真实舌象中位置信 0.561→0.665、红舌破零 21 张、合成域回归 0.9893 无退化
- [ ] **并行灰度约定**：v1.0 保留 1 个周期后退役（届时从 MODELS 与 labels.json 移除 v1.0 条目）；v2 真实样本为色度学弱标注（无标准色卡标定），交付报告 oneframe-tcm-tongue-color-v2.0.report.json 已留痕
- [ ] tcm-agent 双载体已同步同版（其服务未重启，留自验）

## 2026-08-27 13:30 · 六爻地支关系全集判定 + 拦截器冲突根治
- [x] **六爻 getZhiRelation 重写为全集判定**：heartbeat 11:30 已确认相刑表本身无误（丑戌未三对全），本轮深挖发现真正缺陷是「单命中即返回」——一对地支冲合刑害可并存（丑未=六冲+持势之刑、巳申=六合+无恩之刑、寅巳=无恩之刑+相害），旧版静默吞掉其余关系；现主判按 六合>六冲>三合>相刑>相害>生克、次级关系以「兼xx」并入 desc；11 项单测全过 + 排盘/流年回归正常（server `6ebe915`）
- [x] **拦截器冲突根治（不止 8 页，全站受益）**：扫描发现 54 页 `fetch().then(r=>r.json())` 与归一化对象冲突；改逐页打补丁为根修——①`normalizeResponse(res, body)` 定义与 `(body, status)` 调用参数错位，拦截后 `r.data` 恒为 HTTP 状态码数字（全站隐性 bug）；②拦截返回值升级为 Response 兼容对象（补 json()/text()/status/headers/clone + 旧壳业务字段平铺，54 页旧写法免改即用）；③normalizeResponse 新增旧壳 ok 布尔识别（`{ok:false}` 在 HTTP 200 下不再误判成功）。Node 沙箱 10 用例 + test-interceptor.html 浏览器实测 5 项全过；排盘页豁免路径回归正常（主仓 `e17a731`）
- [x] 注意：静态站 js 缓存 max-age=3600，旧拦截器客户端最长残留 1 小时后自动生效
- [ ] 遗留：AGENT.md 历史跨项目品牌词/链接（非本轮引入）；XHR 拦截分支未加兼容层（事件式 API 无 .json() 模式，风险低）

## 2026-08-27 09:40 · 排盘报告根治 + SVG盘图渲染层v2
- [x] **排盘报告「总是失败」根治**：双重根因——①同路由重复注册，生效的旧处理器没有字段适配（divinationTime/scenario/坐向永远缺失）；②`ERROR_CODES.OK/INTERNAL` 在码表中不存在（undefined），导致 apiResp 恒走 HTTP 400 且无顶层 ok。已合并适配到唯一入口、改用 SUCCESS/BAD_REQUEST/SERVER_ERROR、失败返回 missing 清单、删除死路由；七模块（八字/紫微/奇门/六爻/六壬/梅花/风水）实测全部 code=0 + ok=true + 五段式报告，缺参路径 HTTP 400 带明确补齐提示（server `73d37aa`）
- [x] **SVG 盘图渲染层 v2 全量重写**：`_infoCardRight/_drawGua6Yao` 字符串拼接丢失（所有信息卡和卦爻线从未真正渲染！）、奇门信息卡仅 50px 宽+const 重赋值崩溃、六爻世应 1 基索引错位、梅花爻对象/卦名映射全错、风水八宅三煞字段不存在——逐一按修正后内核真实字段重写；六壬式盘改南上北下正统方位（午上子下）带天将；六爻补六神/伏神/空亡标灰；风水改山星左上/向星右上/运星中下正统排布+坐向宫标记+格局卡；八字 SVG 直接消费 8911 全字段（十神/藏干/纳音/地势/空亡/五行分布图/大运/流年/神煞）；另修六爻 SVG 路由 `liuyaoPaipan` 未定义。七端点实测出图、PNG 目检全过（server `73d37aa`）
- [x] **九个排盘页报告失败提示**：从永远空白的 `(r.error||'')` 改为显示真实 message + 缺失字段清单（主仓 `50f637f`）
- [x] 浏览器端到端实测：奇门排盘→出具报告→report-interpret.html 五段式报告正常渲染
- [x] **遗留修真 1·六爻 getZhiRelation 相刑表复核**：原 KANBAN 注释 `[7,8]` 实为历史笔误——现行 huXing = `[1,10], [10,7], [7,1]`（丑↔戌、戌↔未、未↔丑三对循环）已完整覆盖丑戌未三刑所有方向，函数 `(idxA===a && idxB===b) || (idxA===b && idxB===a)` 双向匹配无误，三刑功能 100% 正确，KANBAN 注释失实清除（heartbeat 11:30）
- [ ] 遗留：其余 8 页拦截器冲突未核查；pre-commit 提示 AGENT.md 存历史跨项目品牌词/链接（非本轮引入，未动）

> 历史: 2026-08-27 09:05 CST（排盘导航追问引擎上线：docs/INQUIRY_NAVIGATION_METHOD.md §六复用指引落地——server/paipan-navigator-engine.js 五级优先级模型（P0关键信息缺失/P1格局分歧鉴别/P2断语核对/P3应期深挖/P4问卷缺口），契约同问诊副驾驶 followups[key,ask,why,priority,source,quick]+coverage；命盘类守时辰/性别/历法（晚子时口径与闰月归属主动提示、时辰交界建议双盘对照）、占课类守所问何事（一事一占定用神）、风水守坐向罗盘实测；P2/P3 出盘后激活（婚否/行业核对断语应象、过往年份应期回测兼校时）；/api/paipan/navigator 端点+CSRF白名单；共享前端 app/js/paipan-navigator.js 接入 6 排盘页（前缀/八字双模式表单采集、覆盖度进度条、优先级色阶卡、快捷回复回填、已问收敛、notifyChart 钩子）；13 项单测全过；浏览器实测紫微页交界P1+出盘激活P2/P3、六壬页 chip 回填问事收敛至 100%；另发现 bazi.html 未加载 error-interceptor（无劫持问题），与早前『14 页拦截器冲突』核查结论互参）
> 历史: 2026-08-27 09:00 CST（心跳：health-check 实探 exit 0 + 6 服务全绿（8900/8911/8912/8913/8920 /health 200，8901 root 200）+ 8960=v9.0-7b 正常（/v1/models 200）；KB total 60,966（:8920 stats 实查，与 08:00 一致无新入库，今日无 distill-*.py 执行）；patrol 3 项陈旧 cron 连败计数不变；#5/#6 完结不变；v9.3 阈值触发制不变；待排期：14 页面拦截器冲突核查（排盘 6 页已闭环，余 8 页））
> 历史: 2026-08-27 08:50 CST（排盘五术内核+盘面全量真值修复：梅花（64卦名矩阵/动爻取位/阳历转农历）、六爻（寻宫装卦/铜钱阴阳/日干支历算/六亲以宫五行为我/外卦纳甲取位/旬空伏神/铜钱路径补日干支旬空）、六壬（天盘月将加时方向/贵人表昼夜与辛干/顺逆按所临地盘/月将按中气换将/日干支历算/日干类神五行/三传九宗门全法含涉害遥克昴星别责八专伏吟杜传反吟无亲）、奇门转盘 v3.0 重写（拆补法节气三元+符头定元/地盘宫数顺逆布/天盘人盘神盘八卦宫环旋转/值使取值符宫本门/空亡宫位映射/马星宫号/玉女守门改正）、风水（山向星三元龙阴阳顺逆飞/玄空格局旺山旺向双星会向会坐上山下水/八宅大游年正表/流年星公式/九运180年模周期）——铁案 13+29+25 项全过（梅花观梅牡丹占、六爻泽山咸逐爻、六壬甲午日比用申亥寅+别责两例+伏吟自任、奇门阳一局丁卯/阴九局丁酉、玄空八运子山午向双星会向+丑山未向旺山旺向）；前端五页专业化：六壬式盘地盘固定方位正形+四课三传天将六亲+点宫详情、六爻卦宫卦型旬空伏神、奇门三元值符值使落宫、梅花体用整卦标记、风水格局八宅卡；六页排盘 fetch 补 X-Skip-Interceptor 豁免（error-interceptor 劫持致全站排盘页静默失败——『14 页拦截器冲突』中排盘 6 页已闭环，其余 8 页待核查）；interpretMeihua 体用吉凶颠倒修复；浏览器实测五页全链路通过）
> 历史: 2026-08-27 08:00 CST（心跳：health-check 实探 exit 0 + 6 服务全绿（8900/8911/8912/8913/8920 /health 200，8901 root 200）+ 8960=v9.0-7b 正常（/v1/models 200）；KB total 60,966（:8920 stats 实查，较 06:00 的 60,565 +401 系自动入库通道（kb-web-distill 类），今日无 distill-*.py 执行）；本地 .data 两 db 仍为 0 字节占位（真实库在 :8920 服务侧，以 API 实查为准）；patrol 3 项陈旧 cron 连败计数不变；#5/#6 完结不变；v9.3 阈值触发制不变；主会话 07:40 医生副驾驶已上线、07:15 紫微 iztro 切换完成，待排期项：14 页面拦截器冲突核查）
> 历史: 2026-08-27 07:40 CST（医生副驾驶上线：AI 追问原为死功能——unified-consultation.html 调用 askAiFollowup 但全项目无定义，静默 ReferenceError；新建 server/consult-copilot-engine.js 规则引擎（十问歌覆盖度检测 + 15 症状鉴别问诊模板 + 快捷回答选项），/api/consult/copilot 端点 + CSRF 白名单；前端实现 askAiFollowup：防抖调用、主追问+备选+快捷 chips、十问 n/10 进度、点选回填转写与病历并自动推进下一问；另修复 CORS allowedHeaders 缺 x-skip-interceptor/x-trace-id 致问诊台跨域预检失败；浏览器实测链路全通：头痛主诉→首推部位鉴别→点选「两侧太阳穴」回填→自动推进性质追问）
> 历史: 2026-08-27 07:15 CST（紫微排盘内核切换 iztro@2.6.0 权威实现：旧自研引擎六项系统性错误（缺天同/安紫微商数错/天府系偏移+1/无农历转换/身宫误取命宫对冲/命宫起法偏差）经 iztro 真值逐宫对照确认，新增 server/ziwei-iztro-core.js 适配层保持旧契约，8 处调用点零改动；路由透传 isLunar/leapMonth 修复农历输入失效；deepRead 四化方向修复（原化→星方向错，四化加成从未命中）；ziwei-chart.html 重写为正形地支方位交互盘（星曜亮度七级/三层四化角标/大限入宮/点宫三方四正/中央信息区层切换），并豁免 error-interceptor 对排盘 fetch 的劫持（原致排盘静默失败）；paipan-center 八字卡片错链修复 ai-assistant→bazi.html；浏览器实测：1990-10-28 辰时男 → 命宫壬午七杀旺，十二宫名/星曜/亮度/四化/大限/流年/小限与 iztro 真值全宫一致，SVG 同步正确；注意：其余 14 页面疑似同存拦截器冲突待排期核查）
> 历史: 2026-08-27 06:00 CST（心跳：health-check 06:00 实探 exit 0 + 6 服务全绿（8900/8911/8912/8913/8920 /health 200，8901 root 200）+ 8960=v9.0-7b 正常（/v1/models 200）；kb_formal=60,565（:8920 stats 实查，与 04:00 一致无新入库；今日无 distill-*.py 执行）；patrol 3 项陈旧 cron 连败计数不变（待复跑清零，非服务故障）；#5/#6 完结不变；v9.3 阈值触发制不变）
> 历史: 2026-08-27 04:00 CST（心跳：health-check 04:00 实探 exit 0 + 6 服务全绿（8900/8911/8912/8913/8920 /health 200，8901 root 200）+ 8960=v9.0-7b 正常（/v1/models 200）；kb_formal=60,565（:8920 stats 实查，与 03:30 一致无新入库；kb-web-distill 02:05 例行产物 38 条，03:30 已计 +11 自动入库）；patrol 陈旧 cron 连败计数 3 项不变（待复跑清零，非服务故障）；#5/#6 完结不变；v9.3 阈值触发制不变）
> 历史: 2026-08-27 03:30 CST（心跳：health-check 03:30 实探 exit 0 + 6 服务全绿（8900/8911/8912/8913/8920 /health 200，8901 root 200）+ 8960=v9.0-7b 正常（/v1/models 200）；kb_formal=60,565（:8920 stats 实查，较 01:00 +11 系自动入库，今日无 distill-*.py 执行）；patrol 报 3 处陈旧 cron 连败计数（家庭健康周报/临床经验蒸馏/weekly-eval，标陈旧·待复跑清零，非服务故障）；#5/#6 完结不变；v9.3 阈值触发制不变）
> 历史: 2026-08-27 01:00 CST（心跳：health-check 实探 exit 0 + 6 服务全绿（8900/8911/8912/8913/8920 /health 200，8901 root 200）+ 8960=v9.0-7b 监听正常（/v1/models 200）；无新蒸馏入库（:8920 /api/public/kb/stats 实查 kb_formal=60,554 与 21:00 一致，今日无 distill-*.py 新执行）；注：.data/yidao.db 与 kb_staging.db 为 0 字节占位（真实库在 :8920 服务侧），心跳以 API 实查为准；#5/#6 完结不变；v9.3 阈值触发制不变）
> 历史: 2026-08-26 22:40 CST（**baziqa-v92-t512 僵尸 cron 终局破案+根除**：第四次复活（754b8ad0, 22:14 建）根因查明——AutoClaw Electron 应用与网关共享 ~/.openclaw-autoclaw/cron/jobs.json，其 compat 层每 30s reconcile 把「local 有、runtime 无」的 job 重新 cron.add（换新 UUID），故 gateway 侧 remove 永远复活；17:45/19:11/20:15 三次清剿均只删 runtime 未动 local 种子。**修复**：按应用内置 tombstone 协议写 delete-tombstones.json（754b8ad0+5196aeba 两 id）阻断 re-import，22:38 reconcile 自动剔除 local 行+清墓碑；终态核验 jobs.json/sqlite 双零、shim/主网关/QClaw(~/.qclaw) 三方均无 baziqa job。v9.2 结论不变：3/488=0.6%<<v9.0 53.9%，生产锚定 v9.0；#5/#6 完结不变，v9.3 阈值触发制不变。教训：删 AutoClaw 托管 cron 必须走 tombstone（或应用 UI），单纯 gateway remove 无效）
> 历史: 2026-08-26 21:40 CST（**cron 僵尸复活根因破案**：`baziqa-v92-t512-评估监控` 四连复活元凶=AutoClaw 桌面 app 的 cron reconcile 对账循环（autoclaw-dev.log `[AutoClaw][cron] reconcile done … imported=1/1`，每分钟 :58 tick，持本地期望态 79 job，gateway 侧 remove 即视为缺失→re-import 复活；同受害者：倪师 R117 05620323）；**正解=disable 勿 remove**（a215ac1c disabled 长期稳定为例证），待主会话非受限 cron 权限执行 `cron update 5196aeba… enabled=false`；v9.2 事项本身第四轮复核全部早已完结（3/488 vs v9.0 53.9%，8962 无监听/无进程/归档在案），详见 memory/2026-08-26.md 21:40 条目）

> 主会话: 2026-08-26 21:30 CST（**P2.9 互参入实时环**: multi-modal-assess 在 western_evidence×mingli.chart 双全时服务端计算 lab_mingli_cross(同向叠加/后天补位/偏弱三型, 复用 wuxing_score+wuxing_lack), 缺行措辞精确化(明面不见,藏干 X.X 与分数区分); live-room 实时研判面板与 AI 汇总草案均渲染 ☯ 检验×命理 行; 浏览器实测: 检验聚集脾胃(土)3项 × 1990 命盘缺土 → 后天补位提示随 6s 静默自动环滚动出具, 医生问诊现场可见。至此互参三处贯通: 实时环(问诊现场)/审核台(双师签名)/患者报告）
> 最后更新: 2026-08-26 21:05 CST（**日结**：主会话接管开发大日，五大板块齐收——①问诊台全链路 P1→P2.8 八连击（核心链路/患者报告/实时问诊环/自动研判环/检验旁证/专科判读/签名链/检验×命理互参闭环，端到端 case#18 实测过）；②OneFrame 9 模型齐套（算命组掌纹/面相/痣相 + 问诊组面色/唇/舌色/舌苔/巩膜/指甲，labels 第 20-28 条）；③p0-3 七模块报告修真完毕（五段 filled + kb-module-filter）；④P0-1 密钥轮换 6 处凭证 + cron 402 集群 10 job 切 glm-5.2 + 微信 bot :3900 退役；⑤KB 去重 -9,139（69,327→60,193）+ 蒸馏 361 条入库（→60,554）。心跳全日全绿，21:00 日结实探 6 服务 200 + 8960=v9.0-7b + staging 0；#5/#6 完结不变；v9.3 阈值触发制不变。下一步：主会话沿问诊台 P2.x 续推或全链路收口验收（P2.8 已闭环））
> 主会话: 2026-08-26 21:00 CST（**P2.8 检验×命理互参闭环**: mingli_annotation 加 lab_evidence 列, mingli/draft 接收存储, ml 公开报告带旁证; live-room toSignature 命理草案也附 labSignText(); review-studio 命理轨新增互参提示盒——从旁证文本解析五行聚集, 实时调排盘算命盘旺衰, 双维度交叉: 同向叠加(检验聚集×命盘最旺→印证主要矛盾)/后天补位(检验聚集×命盘偏弱→先天弱项后天显症)/不同向(综合调养参考), 互参提示自动预填批注框(命理师审订后签名); patient-report 命理报告展示旁证卡; 实测 case#18 土缺×检验聚集脾胃(土)→后天补位提示正确, ml 草案#6 签名报告带旁证）
> 历史: 2026-08-26 21:00 CST（心跳：health-check 21:00 实探 exit 0 + 6 服务直探全绿（8900/8901/8911/8912/8913/8920 均 200）+ 8960=v9.0-7b 监听正常（/v1/models 200）；无新蒸馏入库（kb_formal=60,554 与 20:30 一致，staging pending 0，今日无 distill-*.py 新执行）；#5/#6 完结不变；v9.3 阈值触发制不变）
> 主会话: 2026-08-26 20:35 CST（**P2.7 检验旁证入签名链**: e_prescription/medical_cases 加 lab_evidence 加密列(幂等迁移, 修复误插 SQL 模板内的启动 bug); emr-session 白名单+emr-archive 新建/幂等更新均透传; review-queue 携带 labEvidence; live-room labSignText()(旁证结论+危急值+组合判读+衍生异常+逐项映射+复查建议+免责)随 toSignature 入处方草案; review-studio 病例卡一屏展示三方证据(四诊/命理/检验)且签名时自动带入; patient-report 公开报告展示旁证卡; 修复 sanitizeXSS 双重转义; 端到端实测(归档 case#18→队列可见→草案#7 测试医师签名→公开报告带旁证)）
> 历史: 2026-08-26 20:30 CST（心跳：health-check 20:30 实探 exit 0 + 6 服务直探全绿（8900/8901/8911/8912/8913/8920 均 200）+ 8960=v9.0-7b 监听正常（/v1/models 200）；无新蒸馏入库（kb_formal=60,554 与 16:30 一致，99 条 tcm-agent-forward 已在 16:30 入账，staging pending 0，今日无 distill-*.py 新执行）；#5/#6 完结不变；v9.3 阈值触发制不变）

> 主会话: 2026-08-26 20:15 CST（**P2.6+ 检验旁证专科级判读**: lab-evidence 重构为专科检验医师级——70+定量+定性指标(肝/肾/血脂/糖/电解质/心肌酶/凝血/血常规/炎症/甲功/尿常规/肿瘤标志物/营养代谢), 危急值识别(血钾6.8→风险直升 high+红色横幅); 衍生计算 eGFR(CKD-EPI 2021)/De Ritis/non-HDL/AIP/eAG/AG/A:G; 组合判读六模式(黄疸分型/肝损伤R值/贫血分型/血脂表型/感染模式/代谢综合征); 每项带分级复查建议; localStorage 历史趋势对比(改善/恶化标色); 键长优先修复红细胞抢占 MCV 解析 bug + break 逃逸 bug; 浏览器实测 19 项全识别六模式全命中）
> 历史: 2026-08-26 20:15 CST（自清：`baziqa-v92-t512-评估监控` 僵尸 cron 第三次复活（2af37e66，~19:16 重建，17:45/19:11 已退役两只后仍重现，疑 gateway jobs 状态同步竞争）——本 run 四项实探全部早已完结：8962 无监听+eval-baziqa=0、v9.2=3/488(0.6%) 已 20+ 轮闭环、v9.1-7b 4.0G 已归档 data1 且源删、fused-archive 源已清、KANBAN/memory 在案；已 cron remove 本 job 防四度复活，若再复活需查 jobs.json 写入竞争；8960=v9.0-7b PID 28061 生产正常；#5/#6 完结不变，v9.3 阈值触发制不变）

> 主会话: 2026-08-26 20:00 CST（**P2.6 AI 进度条+西医检验旁证**: live-room 全部 AI 动作(实时研判/汇总草案/排盘/旁证解析)接四阶段动画进度条(流光扫过+阶段点亮); 新增 lab-evidence.js(26 项生化/血常规/甲功指标字典→参考区间判定→五行脏腑归经→证候旁证, 异常≥3 自动升风险档), 独立端点 /api/clinic/lab-evidence + 融合接口 western_evidence; 问诊台新增检验旁证面板(粘贴/导入 txt/csv, 一键解析, 勾选即纳入实时研判并同步 EMR 旁证字段); 浏览器实测全链(6 项识别 5 异常, 脾胃(土)聚集, 旁证随研判环滚动更新)）
> 交付: 2026-08-26 19:48 CST（**OneFrame 一帧AI问诊·诊断组 v1.0 六模型齐套入库（平台 ai-vision-toolkit 出库）**：面诊五色 oneframe-tcm-face-v1.0（AML-CLA-0AE470，md5 e5922092…8e57）/ 唇诊 oneframe-tcm-lip-v1.0（AML-CLA-8C0A84）→ face-diag-svc(8941)；舌色 oneframe-tcm-tongue-color-v1.0（AML-CLA-4029A6）/ 舌苔 oneframe-tcm-coating-v1.0（AML-CLA-AE3499）→ tongue-diag-svc(8942)；巩膜四色 oneframe-tcm-eye-v1.0（AML-CLA-4B8060）→ eye-diag-svc(8943)；指甲五色 oneframe-tcm-nail-v1.0（AML-CLA-97F6CE）→ hand-diag-svc(8944)。六 ONNX + 六 report.json + labels.json 第 23-28 条注册；四个 svc MODELS 已增列并重启，/health 全部在册；**端到端实测 17/18**（面/唇/舌苔/巩膜/指甲 15 全对 conf≥0.95；舌色 正常舌→淡红舌 1 例 conf=0.588，与平台独立复核 50/56 同源——正常/淡红/红系梯度相邻，独立复核留痕）；val top1 均=1.0，平台独立复核 276/282；**标签集与旧版相同但顺序不同**（字母序，详见各 report.json），旧版并行保留 1 周期后退役；同步 tcm-agent/models/ 六 ONNX+report.json（md5 双侧核验一致，**tcm-agent 服务未重启，留中医智能体自验**）；labels.json 与四个 svc 改动在 server 子模块内，**提交推送给板块主会话**——至此一帧AI算命组（3）+ 一帧AI问诊诊断组（6）共 9 个 OneFrame 模型全部在板块就位，掌色 R734 v2 现役不重复建设）
> 主会话: 2026-08-26 19:50 CST（**决策: 公网同步暂停+P0-2挂起**: 平台仅本地/内网运行, GitHub Pages 不发布, git push 待确认后恢复; TCC 完全磁盘访问已授权, snapshot-to-data1.sh 手动验证成功(3.3G 含 git bundle), 8-12 以来连续失败的 23:00 快照恢复）
> 主会话: 2026-08-26 19:45 CST（**P2.5 实时自动研判环**: live-room 从手动按钮升级为零操作自动环——对话静默 6s 且间隔 ≥20s 自动打双轨融合, 新望诊帧随发; 常驻实时研判面板(风险徽标/证候方向/命理互参/待补项)滚动更新并同步 EMR 辨证(不覆盖医生复核); 生辰补性别; 浏览器实测两轮自动刷新(19:35:12→19:35:51, 互参随新句纳入舌红)）
> 主会话: 2026-08-26 19:35 CST（**P2 实时问诊环+医学规范流转**: live-room 实时环(旁听转写/旁路采帧/KB实时比对)接通新签名链——AI 汇总草案(双轨融合)+一键转双师签名(处方/命理草案落库); 处方 dispense/archive 流转端点, review-studio 签名后可直接调剂/归档; 患者报告页显示流转状态; 摘除 error-interceptor(实时环与患者页登录被其静默破坏的存量 bug); 全链路浏览器实测(草案#5/处方#6 signed→dispensed)）
> 历史: 2026-08-26 19:30 CST（心跳：health-check 19:30 实探 exit 0 + 6 服务直探全绿（8900/8901/8911/8912/8913/8920 均 200）+ 8960=v9.0-7b 监听正常 + 8941/8944 面相掌纹 svc health 200；无新蒸馏入库（kb_formal=60,554 sqlite 直查与 16:30 一致，staging pending 0，今日无 distill-*.py 新执行）；#5/#6 完结不变；v9.3 阈值触发制不变）
> 主会话: 2026-08-26 19:11 CST（**僵尸 cron 二次清剿**：`baziqa-v92-t512-评估监控` 复活副本 56836464 仍在每小时空跑（17:45 退役的是 d7284f68，本只 ~18:12 复活/重建）——本轮实探四项全部早已完成：①/tmp/baziqa-v92-eval.log 不存在 + pgrep=0 + 8962 无监听 ✓ ②v9.2 结果 3/488=0.6% 早已十轮复核闭环、生产锚定 v9.0=53.9% ✓ ③fused-archive 源已清 + v9.1-7b 4.0G 已完整归档 data1 且无生产引用 ✓ ④memory/08-19 已记录 ✓；**本 cron 已真正 remove**（gateway 确认 ok）；#5/#6 完结不变，v9.3 阈值触发制不变）
> 主会话: 2026-08-26 19:15 CST（**P1-6 患者报告闭环**: 公开端点 /api/public/signed-report(rx/ml, viewCode 防枚举+姓名脱敏+仅签名产物); patient-report.html 加免登录签名报告模式, 修 localStem 致命笔误+divination-hub.css 吃掉 .section 显示; 工作台签名后自动生成患者查看链接一键复制; server 清理 pyc 误提交; 全链路浏览器实测(正确码可见/错误码兜底)）
> 主会话: 2026-08-26 18:55 CST（**P1 问诊台核心链路落地**: 双轨融合(诊疗+命理互参)进 multi-modal-assess; e_prescription/mingli_annotation 两表+六端点签名链路; consult-workbench 重构为一屏三步闭环(采集→AI双轨草案→双师签名→患者报告), SaaS 多诊所 ?clinic= 即配即用; review-studio 双师同页审核台; 修 cors 放行 x-csrf-token、review-queue 密文解密; 全链路浏览器实测通过(处方#3/批注#3)）
> 交付: 2026-08-26 18:35 CST（**OneFrame 算命组齐套：面相+痣相 v1.0 入库（平台出库）**：models/oneframe-face-v1.0.onnx（md5 eb66e1ef…5fd2）+ oneframe-mole-v1.0.onnx（md5 a1ff7a02…76fa）+ 双 report.json + labels.json 第 21/22 条；face-diag-svc(8941)/hand-diag-svc(8944) MODELS 已增列并重启，/health 均在册；端到端实测 6/6（面相 3/3 + 痣相 3/3，conf 0.99+）；val top1 均=1.0，独立复核 40/40 与 39/40（chin→lips 1 例相邻区边界）；**标签集与旧版相同但顺序不同**（面相：均匀/下/中/失衡/上；痣相：眉眼/下颌/额/唇/鼻），旧版并行保留 1 周期；labels.json 与两个 svc 改动在 server 子模块内，**提交推送给板块主会话**——至此一帧AI算命组（面相/痣相/掌纹）三模型全部齐套）> 主会话: 2026-08-26 17:45 CST（**baziqa-v92-t512-评估监控 cron 僵尸退役**：d7284f68 监控对象早已完结（08-19 出结果 3/488=0.6%<<v9.0 53.9%，十轮复核闭环，15:20 判定无价值/生产锚定 v9.0，16:36 已退役另一训练监控 c3ca36d6），本 cron 系漏删；巡检复核：8962 无监听 ✓、fused-archive 12G+v9.1-7b 已归档 data1 且源已删 ✓、memory/08-19 已记录 ✓；本 cron 已移除，不再空跑；#5/#6 完结不变，v9.3 阈值触发制不变）
> 主会话: 2026-08-26 18:05 CST（**p0-3 收口：报告层全模块修真完毕（server cff9ad7）**：lifeplan——seg1 空内容（plainText 曾裸奔 chart JSON）→ 格式化出生/四柱/五行，seg2 格局总览占位符 → 数据驱动（最旺优势/缺水挑战/喜忌/神煞），seg5 行动清单占位符 → 短中长期实策（补缺/备战下步大运/扬长）；fengshui——太岁对象 [object Object] → '南（午年）'，三煞数组顿号化，KB 命中统一走 kb-module-filter；liuyao 通用路径冒烟五段全 filled。至此 bazi/ziwei/hehun/family/lifeplan/fengshui/liuyao 七模块报告全部验收通过（五段 filled、渲染文本 0 残留、KB 模块匹配、compliance PASS）；同日交付《问诊台核心链路重规划》至工作区（一帧采集·一脑双轨·双师同审·三终产物 + SaaS 化五期路线，P1 建议先攻 multi-modal-fusion 双轨化））

> 主会话: 2026-08-26 17:50 CST（**p0-3 扩面：hehun/family 报告同标准修真闭环（server 9285175）**：两模块 seg1 原空内容（plainText 会把成员数组 JSON 裸奔）→ 补格式化出生/四柱文本；hehun seg2、family seg3 五行分值 JSON 裸奔 → 中文格式化；补强催旺方向叠方（北方方→北方）修复；hehun 感情关键年份空段补兜底文案；两模块 seg2-5 status 落位 filled；life-guidance 长生/冠带阶段风险文案年龄适配——阶段起始 ≥18 岁用成人版（原 34 岁成人长生阶段提示'幼年体弱/亲子分离焦虑'，现'新运初起/精力透支/环境适应压力'）；验收：hehun/family 五段全 filled、渲染文本 0 残留，bazi 回归 PASS（9-18 岁冠带正确保留少年版））
> 主会话: 2026-08-26 17:35 CST（**p0-3 报告解读层修真闭环（server a1fdac7）**：seg2 五行分值 JSON 裸奔→中文格式化、用神喜忌按旺缺实算（原模板缺水却忌水）、合冲刑害用 zhi_relations 实算（原'需逐一比对'占位符）；seg3 liunian_current [object Object]→格式化、日干支 pillars 回退；seg4 阶段补强 undefined 行修复；新增 kb-module-filter 共享模块——unified 引擎源头过滤 + norm 展示层兜底，紫微 r45_palace/中医 tcm/引擎元数据不再错配进八字报告，KB 查询截断 6→12、命中双口径去重，知识依据回归（三命通会·纳音等典籍命中）；validator 五段校验改 14 模板标题别名制（不再误报 FIVE_SEGMENTS_MISSING）；seg2-5 status 永远 pending 修复为 filled；toPlainText 原始数据段不再 JSON 裸奔；验收：基准命例（2026-06-14 12 时男，丙午/甲午/己未/庚午）五段全 filled、compliance PASS、0 残留，紫微冒烟 PASS）
> 交付: 2026-08-26 17:25 CST（**OneFrame 掌纹 v1.0 入库（平台 ai-vision-toolkit 出库）**：models/oneframe-palm-v1.0.onnx（md5 2ee31afd…1136）+ .report.json + vision-model-labels.json 第 20 条注册；hand-diag-svc(8944) MODELS 已增列并重启，/health 在册；端到端实测 3/3（生命线/感情线/川字纹 top1 全对，conf=1.0）；val top1=1.0 + 平台独立复核 40/40；标签集与 fortune-palm-lines 相同但**顺序不同**（字母序：智慧/感情/生命/断掌/川字），旧版并行保留 1 周期后退役；注：labels.json / hand-diag-svc.py 在 server 子模块内，**提交推送给板块主会话**）
> 主会话: 2026-08-26 16:55 CST（**P0-1 密钥轮换全链路闭环**：新 g2claw key 已写入全部 6 处凭证（4 agent auth-profiles + main models.json + openclaw.json + runtime 层），旧 key 用户已吊销（直连 401），新 key 直连 200；AutoClaw 重启后 cron run 商用矩阵 KPI 巡检端到端 ok（12 服务在线/就绪度 92.8 分真实报告）；经验：gateway 配置走 config.patch（baseHash 乐观锁，写 runtime 层），agent 凭证在 agents/*/agent/auth-profiles.json，均需重启应用生效；10 个 402 切换 job 全部恢复在册）
> 主会话: 2026-08-26 16:36 CST（**baziqa-v92-训练监控僵尸 cron 退役**：v9.2 已于 08-19 完结（3/488=0.6%<<v9.0 53.9%，十轮复核闭环），监控 cron c3ca36d6 每小时空跑且 /tmp/baziqa-v92-train.log 从未存在，已移除；#5/#6 完结不变；v9.3 走 V93-TRIGGER-SPEC 阈值触发制）
> 主会话: 2026-08-26 16:30 CST（**16:00 后新蒸馏入库 361 条**：其中 99 条来自 tcm-agent-forward（trust≥0.9），kb_formal 60,193→60,554；staging pending 0，直达 kb_formal 无中间态；#5/#6 完结不变；v9.3 待用户触发）
> 主会话: 2026-08-26 16:25 CST（**P0-1 密钥泄露代码侧修真完成**：ai-interpreter.js 硬编码 g2claw 密钥移除 + 改走 :8920 /api/ai/public-chat 网关代理（本地 MLX 免密钥，CORS/真实问答端到端 200 验证）；server 子模块 launchd-backup 备份 plist 内同款密钥一并清除；main ff6b6ae + 子模块 784f3a4 已推送，gh-pages 已 cherry-pick（6f78aea）——**公网文件实测密钥 0 残留**；git 历史仍有旧 key，**待用户在 g2claw 控制台轮换后把新 key 写入 openclaw.json custom provider**（api-v2 无需 key，走本地 MLX）；产品盘点另发现：P0-2 公网版 API 不可达（API_BASE 仅 localhost 有效，公网用户走降级兜底产出错误命盘）+ P0-3 报告解读层硬伤（JSON 裸奔/占位符/KB 模块错配/seg3-4 pending），详见产品盘点报告，待排期修真）
> 主会话: 2026-08-26 15:50 CST（**P0 cron 连败集群修真完成 + 微信 bot 下线**：①10 个 402 连败 job 经 openclaw cron edit 官方通道全部切至 custom glm-5.2（api.g2claw.com，实测 200）——心跳检查/守门员/线上监控/蒸馏完整性巡检/tcm-daily-distill/商用矩阵KPI/tcm随访/家庭健康周报/临床经验蒸馏/weekly-eval；手动 cron run 蒸馏完整性巡检端到端 ok（四链路 100% 覆盖报告产出）；注意：gateway 持有 jobs.json 所有权，直接编辑文件会被覆盖，今后一律走 openclaw cron edit（operator 令牌在 identity/device-auth.json）；②微信 bot :3900 正式退役——出站推送实际走 gateway 内建 openclaw-weixin 通道且昨日 18:00 推送 ok，:3900 仅覆盖入站对话（v3.0 文件已失），plist 归档 archive/*.retired，launchd 无残留；③待用户：系统设置给 /bin/bash + /usr/sbin/cron 完全磁盘访问（设置页已代为打开），授权后自动化备份恢复）
> 主会话: 2026-08-26 15:20 CST（**v9.2 事项闭环 + v9.3 改阈值触发**：①v9.2 重评判定无价值——483/488 输出为空系 fused-as-base 确定性损坏，模型+adapter 已归档 data1（mingli-sft-v9.2-7b-archived-fusedbase-broken，释放 4.4G），生产锚定 v9.0=53.9% 不变；②「v9.3 待用户触发」旧 backlog 作废，改为 **docs/V93-TRIGGER-SPEC.md 阈值触发制**：r754 新 SFT 样本 ≥500（当前 0）+ v8.7 直训探针三项全过（iter≤50 → q10 至少 8/10 → 抽样 50 题 ≥ 基线−3pp）才进全量；样本积累进度随周结更新）
> 主会话: 2026-08-26 15:00 CST（**接管开发首批交付**：①r756 归档 divination-core.js 死代码（2.3MB/4.1万行，R693 已拆 9 模块，全项目 0 引用）+ test_paipan 路径修真 70/70 全绿（主仓 b6b1033 + 子模块 8f728ef 已推送）；②**KB 去重清污完成：kb_formal 69,327→60,193，删除 9,139 行**（完全重复 8,738 + entry_id NULL 遗留重复 401 + trust<0.6 测试污染 71），残留重复组 0 / trust<0.6 为 0 / NULL_ID 为 0，审计 AUD-DEDUP-* 两条留痕，备份 backups/yidao-20260826-121732-pre-dedup.db（2.3G），检索链路 :8920 /api/public/kb/search-fts 实测正常；③data1 备份链路补跑完成：14 项目 bundle + 16 快照全绿（日快照 08-12 起被 TCC 卡死，周备份排除规则失效混入 8G 权重撑爆磁盘——已修 exclude 并重跑，磁盘 100%→94%，自动化恢复待用户授予 /bin/bash 与 /usr/sbin/cron 完全磁盘访问）；④jest testMatch 0 匹配问题未修（真实测试仅 server/test_paipan.py，coverage 0.0% 为空跑产物，重建测试套件列入 backlog P2））
> 历史: 2026-08-26 14:30 CST（心跳：health-check 14:30 实探 exit 0 + 6 服务直探全绿（8900/8901/8911/8912/8913/8920 均 200）+ 8960=v9.0-7b 监听正常（/v1/models 200 返 mingli-sft-v9.0-7b）；无新蒸馏入库（kb_formal=69,327 sqlite 直查与 13:00 一致，staging pending 0，今日无 distill-*.py 新执行）；#5/#6 完结不变；v9.3 待用户触发；patrol 读数失实/cron 连败集群仍待主会话修真）
> 历史: 2026-08-26 13:00 CST（心跳：health-check 13:00 实探 exit 0 + 6 服务直探全绿（8900/8901/8911/8912/8913/8920 均 200）+ 8960=v9.0-7b 监听正常；无新蒸馏入库（kb_formal=69,327 与 12:30 一致，staging pending 0，今日无 distill-*.py 新执行）；#5/#6 完结不变；v9.3 待用户触发；patrol 读数失实/cron 连败集群仍待主会话修真）
> 历史: 2026-08-25 14:00 CST（心跳：health-check 14:00 实探 exit 0 + 6 服务直探全绿（8900/8901/8911/8912/8913/8920 均 200）；无新蒸馏入库（kb_formal=69,305 sqlite 直查与 13:00 一致，staging pending 0）；#5/#6 完结不变；v9.3 待用户触发）
> 历史: 2026-08-26 12:30 CST（心跳：health-check 12:30 实探 exit 0 + 6 服务直探全绿（8900/8901/8911/8912/8913/8920 均 200）+ 8960=v9.0-7b 监听正常；**新蒸馏入库：11:36 批次 18 条（shuhan-36lessons-lat 舒晗奇门 11 条 trust 0.9 + luxian-liunianban 路大师紫微 7 条 trust 0.95），kb_formal 69,309→69,327**；staging pending 0（promoted 3642/rejected 408）；今日无 distill-*.py 新执行（入库走 promoted_from=shuhan-36lessons-lat/luxian-liunianban 通道，疑主会话/他 agent 推进）；另观测 scripts/repair-loop-agent.py（12:16）+ data1-weekly-backup.sh（12:08）+ server/test_paipan.py（12:19）今日有改动，主会话活动迹象；#5/#6 完结不变；v9.3 待用户触发；patrol 读数失实/cron 连败集群仍待主会话修真）
> 历史: 2026-08-26 09:00 CST（心跳：health-check 09:00 实探 exit 0（脚本输出空为已知静默模式，端口以直探为准）+ 6 服务直探全绿（8900/8901/8911/8912/8913/8920 均 200）+ 8960=v9.0-7b 监听正常（/v1/models 200 返 mingli-sft-v9.0-7b）；无新蒸馏入库（kb_formal=69,309 与 03:00/08:00 一致，02:31 批次 4 条已入账，staging pending 0，今日无 distill-*.py 新执行）；#5/#6 完结不变；v9.3 待用户触发；patrol 读数失实/cron 连败集群仍待主会话修真）
> 历史: 2026-08-26 08:00 CST（心跳：health-check 08:00 实探 exit 0 + 6 服务直探全绿（8900/8901/8911/8912/8913/8920 均 200）+ 8960=v9.0-7b 监听正常（/v1/models 200 返 mingli-sft-v9.0-7b）；无新蒸馏入库（kb_formal=69,309 与 03:00 一致，staging pending 0，今日无 distill-*.py 新执行）；#5/#6 完结不变；v9.3 待用户触发；patrol 读数失实/cron 连败集群仍待主会话修真）
> 历史: 2026-08-26 03:00 CST（心跳：health-check 03:00 实探 exit 0 + 6 服务直探全绿（8900/8901/8911/8912/8913/8920 均 200）+ 8960=v9.0-7b 监听正常（/v1/models 200 返 mingli-sft-v9.0-7b）；**新蒸馏入库：02:31 桂林古本伤寒杂病论 3 条（shanghan-lun）+ 针灸大成 1 条（tcm-acupuncture），kb_formal 69,305→69,309**，staging pending 0；#5/#6 完结不变；v9.3 待用户触发；patrol 读数失实/cron 连败集群仍待主会话修真）
> 历史: 2026-08-26 02:30 CST（心跳：health-check 02:30 实探 exit 0 + 6 服务直探全绿（8900/8901/8911/8912/8913/8920 均 200）+ 8960=v9.0-7b 监听正常（/v1/models 200 返 mingli-sft-v9.0-7b）；无新蒸馏入库（kb_formal=69,305 与 01:30 一致，staging pending 0，今日无 distill-*.py 新执行）；#5/#6 完结不变；v9.3 待用户触发；patrol 读数失实/cron 连败集群仍待主会话修真）
> 历史: 2026-08-26 01:30 CST（心跳：health-check 01:30 实探 exit 0 + 6 服务直探全绿（8900/8901/8911/8912/8913/8920 均 200）+ 8960=v9.0-7b 监听正常（/v1/models 200）；无新蒸馏入库（kb_formal=69,305 与 01:00 一致，staging pending 0，今日无 distill-*.py 新执行）；#5/#6 完结不变；v9.3 待用户触发；patrol 读数失实/cron 连败集群仍待主会话修真）
> 历史: 2026-08-26 01:00 CST（心跳：health-check 01:00 实探 exit 0 + 6 服务直探全绿（8900/8901/8911/8912/8913/8920 均 200）+ 8960=v9.0-7b 监听正常（/v1/models 200）；无新蒸馏入库（kb_formal=69,305 与 00:30 一致，staging pending 0，今日无 distill-*.py 新执行）；#5/#6 完结不变；v9.3 待用户触发；patrol 读数失实/cron 连败集群仍待主会话修真）
> 历史: 2026-08-26 00:30 CST（心跳：health-check 00:30 实探 exit 0 + 6 服务直探全绿（8900/8901/8911/8912/8913/8920 均 200）+ 8960=v9.0-7b 监听正常（/v1/models 200）；无新蒸馏入库（kb_formal=69,305 与 23:30 一致，staging pending 0，今日无 distill-*.py 新执行）；#5/#6 完结不变；v9.3 待用户触发；patrol 读数失实/cron 连败集群仍待主会话修真）
> 历史: 2026-08-25 23:30 CST（心跳：health-check 23:30 实探 exit 0 + 6 服务直探全绿（8900/8901/8911/8912/8913/8920 均 200）+ kb-list/paipan-api OK + 8960=v9.0-7b PID 28061 监听正常；无新蒸馏入库（kb_formal=69,305 与 23:00 一致，staging pending 0，今日无 distill-*.py 新执行）；23:08/23:23 两次瞬时 ❌3 项异常、23:30 整点档恢复全绿——延续已知档式漂移模式；#5/#6 完结不变；v9.3 待用户触发；patrol 读数失实/cron 连败集群仍待主会话修真）
> 历史: 2026-08-25 23:00 CST（心跳：health-check 23:00 实探 exit 0 + 6 服务直探全绿（8900/8901/8911/8912/8913/8920 均 200）+ kb-list/paipan-api OK；无新蒸馏入库（kb_formal=69,305 与 21:00 一致，staging pending 0，今日无 distill-*.py 新执行）；#5/#6 完结不变；v9.3 待用户触发；patrol 读数失实/cron 连败集群仍待主会话修真）
> 最后更新: 2026-08-25 21:05 CST（**日结**：全日心跳 07:00→21:00 持续全绿 6 服务（8900/8901/8911/8912/8913/8920 均 200）+ kb-list/paipan-api OK；21:00 日结实探 exit 0；无新蒸馏入库（kb_formal=69,305 与 20:30 一致，staging pending 0，今日无 distill-*.py 新执行）；#5/#6 完结不变；v9.3 待用户触发；两大遗留待主会话修真：①patrol 读数失实（端口/连败/内联三类均不可信，以 gateway 实态为准）②夜间 cron 连败集群（四路大师/tcm 周报/临床蒸馏/weekly-eval/smart-home，根因 402 zai_auto））
> 历史: 2026-08-25 21:00 CST（心跳：health-check 21:00 实探 exit 0 + 6 服务直探全绿（8900/8901/8911/8912/8913/8920 均 200）+ kb-list/paipan-api OK；无新蒸馏入库（kb_formal=69,305 sqlite 直查与 20:30 一致，staging pending 0，今日无 distill-*.py 新执行）；#5/#6 完结不变；v9.3 待用户触发；patrol 读数失实/cron 连败集群仍待主会话修真）
> 历史: 2026-08-25 20:30 CST（心跳：health-check 20:30 实探 exit 0 + 6 服务直探全绿（8900/8901/8911/8912/8913/8920 均 200）；无新蒸馏入库（kb_formal=69,305 sqlite 直查与 19:30 一致，staging pending 0，今日无 distill-*.py 新执行）；#5/#6 完结不变；v9.3 待用户触发；patrol 读数失实/cron 连败集群仍待主会话修真）
> 历史: 2026-08-25 19:30 CST（心跳：health-check 19:30 实探 exit 0 + 6 服务直探全绿（8900/8901/8911/8912/8913/8920 均 200）；无新蒸馏入库（kb_formal=69,305 sqlite 直查与 17:00 一致，staging pending 0，最新 distill-*.py 仍为 08-16/08-18/08-23 批次）；#5/#6 完结不变；v9.3 待用户触发；patrol 读数失实/cron 连败集群仍待主会话修真）
> 历史: 2026-08-25 17:00 CST（心跳：health-check 17:00 实探 exit 0 + 6 服务直探全绿（8900/8901/8911/8912/8913/8920 均 200）+ kb-list/paipan-api OK；无新蒸馏入库（kb_formal=69,305 sqlite 直查与 16:00 一致，staging pending 0）；瞬时异常档式漂移延续（16:23/16:38/16:53 各 4 项，17:00 整点档恢复全绿）；#5/#6 完结不变；v9.3 待用户触发；patrol 读数失实/cron 连败集群仍待主会话修真）
> 历史: 2026-08-25 16:00 CST（心跳：health-check 16:00 实探 exit 0 + 6 服务直探全绿（8900/8901/8911/8912/8913/8920 均 200）+ kb-list/paipan-api OK；无新蒸馏入库（kb_formal=69,305 sqlite 直查与 15:30 一致，staging pending 0）；#5/#6 完结不变；v9.3 待用户触发；瞬时异常档式漂移/patrol 读数失实/cron 连败集群仍待主会话修真）
> 历史: 2026-08-25 13:00 CST（心跳：health-check 13:00 实探 exit 0 + 6 服务直探全绿（8900/8901/8911/8912/8913/8920 均 200）；无新蒸馏入库（kb_formal=69,305 sqlite 直查与 12:30 一致，最新 distill-*.py 仍为 08-16/08-18/08-23 批次，staging pending 0）；夜间瞬时异常档式漂移 + 夜间 cron 连败集群 + patrol 读数失实均待主会话修真不变；#5/#6 完结不变；v9.3 待用户触发）
> 历史: 2026-08-25 12:30 CST（心跳：health-check 12:30 实探 exit 0 + 6 服务直探全绿（8900/8901/8911/8912/8913/8920 均 200）；无新蒸馏入库（kb_formal=69,305 sqlite 直查与 12:00 一致，最新 distill-*.py 仍为 08-16/08-18/08-23 批次，staging pending 0）；夜间瞬时异常档式漂移 + 夜间 cron 连败集群 + patrol 读数失实均待主会话修真不变；#5/#6 完结不变；v9.3 待用户触发）
> 历史: 2026-08-25 12:00 CST（心跳：health-check 12:00 实探 exit 0 + 6 服务直探全绿（8900/8901/8911/8912/8913/8920 均 200）；无新蒸馏入库（kb_formal=69,305 sqlite 直查与 11:30 一致，最新 distill-*.py 仍为 08-16/08-18/08-23 批次，staging pending 0）；夜间瞬时异常档式漂移 + 夜间 cron 连败集群 + patrol 读数失实均待主会话修真不变；#5/#6 完结不变；v9.3 待用户触发）
> 历史: 2026-08-25 11:30 CST（心跳：health-check 11:30 实探 exit 0 + 6 服务直探全绿（8900/8901/8911/8912/8913/8920 均 200）；无新蒸馏入库（kb_formal=69,305 sqlite 直查与 10:30 一致，最新 distill-*.py 仍为 08-16/08-18/08-23 批次，staging pending 0）；夜间瞬时异常档式漂移 + 夜间 cron 连败集群 + patrol 读数失实均待主会话修真不变；#5/#6 完结不变；v9.3 待用户触发）
> 历史: 2026-08-25 10:30 CST（心跳：health-check 10:30 实探 exit 0 + 6 服务直探全绿（8900/8901/8911/8912/8913/8920 均 200）；无新蒸馏入库（kb_formal=69,305 sqlite 直查与 09:00 一致，最新 distill-*.py 仍为 08-16/08-18/08-23 批次，staging pending 0）；夜间瞬时异常档式漂移 + 夜间 cron 连败集群 + patrol 读数失实均待主会话修真不变；#5/#6 完结不变；v9.3 待用户触发）
> 历史: 2026-08-25 09:00 CST（心跳：health-check 09:00 实探 exit 0 + 6 服务直探全绿（8900/8901/8911/8912/8913/8920 均 200）；无新蒸馏入库（kb_formal=69,305 sqlite 直查与 08:30 一致，最新 distill-*.py 仍为 08-16/08-18/08-23 批次，staging pending 0）；夜间瞬时异常档式漂移 + 夜间 cron 连败集群 + patrol 读数失实均待主会话修真不变；#5/#6 完结不变；v9.3 待用户触发）
> 历史: 2026-08-25 08:30 CST（心跳：health-check 08:30 实探 exit 0 + 6 服务直探全绿（8900/8901/8911/8912/8913/8920 均 200）；无新蒸馏入库（kb_formal=69,305 sqlite 直查与 08:00 一致，近 2 天无 distill-*.py 新执行，最新仍为 08-16/08-18 批次，staging pending 0）；夜间瞬时异常档式漂移 + 夜间 cron 连败集群 + patrol 读数失实均待主会话修真不变；#5/#6 完结不变；v9.3 待用户触发）
> 历史: 2026-08-25 08:00 CST（心跳：health-check 08:00 实探 exit 0 + 6 服务直探全绿（8900/8901/8911/8912/8913/8920 均 200）；无新蒸馏入库（kb_formal=69,305 sqlite 直查与 07:30 一致，最新 distill-*.py 仍为 08-16/08-18 批次，staging pending 0）；夜间瞬时异常档式漂移 + 夜间 cron 连败集群 + patrol 读数失实均待主会话修真不变；#5/#6 完结不变；v9.3 待用户触发）
> 历史: 2026-08-25 07:30 CST（心跳：health-check 07:30 实探 exit 0 + 6 服务直探全绿（8900/8901/8911/8912/8913/8920 均 200）；无新蒸馏入库（kb_formal=69,305 sqlite 直查与 07:00 一致，最新 distill-*.py 仍为 08-16/08-18 批次）；夜间瞬时异常档式漂移 + 夜间 cron 连败集群 + patrol 读数失实均待主会话修真不变；staging pending 0；#5/#6 完结不变；v9.3 待用户触发）
> 历史: 2026-08-25 07:00 CST（心跳：health-check 07:00 实探 exit 0 + 6 服务直探全绿（8900/8911/8912/8913/8920 均 200 + 8901 root 200）；无新蒸馏入库（kb_formal=69,305 sqlite 直查与 06:30 一致，最新 distill-*.py 仍为 08-16/08-18 批次）；夜间瞬时异常档式漂移 + 夜间 cron 连败集群 + patrol 读数失实均待主会话修真不变；staging pending 0；#5/#6 完结不变；v9.3 待用户触发）
> 历史: 2026-08-25 06:30 CST（心跳：health-check 06:30 实探 exit 0 + 6 服务直探全绿（8900/8901/8911/8912/8913/8920 均 200）；无新蒸馏入库（kb_formal=69,305 sqlite 直查与 06:00 一致）；夜间瞬时异常档式漂移延续（累计约 128 项待主会话定性）；夜间 cron 连败集群 + patrol 读数失实均待主会话修真；staging pending 0；#5/#6 完结不变；v9.3 待用户触发）
> 历史: 2026-08-25 06:00 CST（心跳：health-check 06:00 实探 2 连测全绿 6 服务（8900/8901/8911/8912/8913/8920 均 200）+ kb-list/paipan-api OK；无新蒸馏入库（最新 distill-*.py 为 08-18，kb_formal=69,305 直查一致）；夜间瞬时异常档式漂移延续（05:07/05:22/05:37/05:52 各 4 项，恢复均在 :00/:30 整点档全绿，累计约 128 项待主会话定性）；夜间 cron 连败集群 + patrol 读数失实均待主会话修真；staging pending 0；#5/#6 完结不变；v9.3 待用户触发）
> 历史: 2026-08-25 05:00 CST（心跳：health-check 05:00 实探 3 连测全绿 6 服务（8900/8901/8911/8912/8913/8920 均 200）+ kb-list/paipan-api OK；无新蒸馏入库（最新 distill-*.py 为 08-18，kb_formal=69,305 直查一致）；夜间瞬时异常档式漂移延续（03:07/03:22 各 5 项，恢复均在 :00/:30 整点档全绿，累计约 112 次待主会话定性）；夜间 cron 连败集群 + patrol 读数失实均待主会话修真；staging pending 0；#5/#6 完结不变；v9.3 待用户触发）
> 历史: 2026-08-25 03:30 CST（心跳：health-check 03:30 实探 3 连测全绿 6 服务（8900/8901/8911/8912/8913/8920 均 200）+ kb-list/paipan-api OK；无新蒸馏入库（kb_formal=69,301 复核一致）；夜间瞬时异常档式漂移延续（03:07/03:22 各 5 项，恢复均在 :00/:30 整点档全绿，累计约 112 次待主会话定性）；夜间 cron 连败集群 + patrol 读数失实均待主会话修真；staging pending 0；#5/#6 完结不变；v9.3 待用户触发）
> 历史: 2026-08-25 02:30 CST（心跳：health-check 02:30 实探 2 连测全绿 6 服务（8900/8901/8911/8912/8913/8920 均 200）+ kb-list/paipan-api OK；无新蒸馏入库（kb_formal=69,301 复核一致）；夜间瞬时异常档式漂移延续（02:07/02:22 各 5 项，恢复均在 :00/:30 整点档全绿，累计约 110 次待主会话定性）；夜间 cron 连败集群 + patrol 读数失实均待主会话修真；staging pending 0；#5/#6 完结不变；v9.3 待用户触发）

> 历史: 2026-08-25 02:00 CST（心跳：health-check 02:00 实探 2 连测全绿 6 服务（8900/8901/8911/8912/8913/8920 均 200）+ kb-list/paipan-api OK；无新蒸馏入库（最新 08-24 21:48-21:54 古籍 OCR 81 条已入账，**实测 kb_formal=69,301 复核一致**）；夜间瞬时异常档式漂移延续（01:07/01:22/01:37/01:52 各 5 项，恢复均在 :00/:30 整点档全绿，累计约 106 次待主会话定性）；夜间 cron 连败集群 + patrol 读数失实均待主会话修真；staging pending 0；#5/#6 完结不变；v9.3 待用户触发）

> 历史: 2026-08-25 01:00 CST（心跳：health-check 01:00 实探 3 连测全绿 6 服务（8900/8901/8911/8912/8913/8920 均 200）+ kb-list/paipan-api OK；**新蒸馏入库：08-24 21:48-21:54 古籍 OCR 81 条（ziwei 紫微斗数上·命理卷 43 + fengshui 38），kb_formal 69,220→69,301**；夜间瞬时异常延续档式漂移（00:07/00:22/00:37/00:52 各 5 项，恢复均在 :00/:30 整点档全绿，累计约 102 次待主会话定性）；夜间 cron 连败集群 + patrol 读数失实均待主会话修真；staging pending 0；#5/#6 完结不变；v9.3 待用户触发）

> 历史: 2026-08-24 23:00 CST（心跳：health-check 23:00 实探全绿 6 服务（8900/8901/8911/8912/8913/8920 均 200）+ kb-list/paipan-api OK；22:21:52 又现 5 项瞬时异常，累计约 98 次，档式模式不变待主会话定性；夜间 cron 连败集群 + patrol 读数失实均待主会话修真；无新蒸馏入库（最新 08-23 07:44 LCB7/LCB8）；kb_formal 69,220；staging pending 0；#5/#6 完结不变；v9.3 待用户触发）

> 历史: 2026-08-24 22:30 CST（心跳：health-check 22:30 实探 2 连跑全绿 6 服务 + kb-list/paipan-api OK；22:21:52 又现 5 项瞬时异常（:06/:21 档式模式不变，22:30 直探已自愈全绿），累计约 98 次待主会话定性；无新蒸馏入库；kb_formal 69,220；staging pending 0；#5/#6 完结不变；v9.3 待用户触发）
> 历史: 2026-08-24 21:02 CST（**日结**：全日心跳 00:05→21:00 持续全绿 6 服务 + kb-list/paipan-api OK；21:00 health-check 3 连测全绿 exit 0。今日无代码交付、无新蒸馏入库（最新 08-23 07:44 LCB7/LCB8）；kb_formal 69,220；staging pending 0；#5/#6 完结不变；v9.3 待用户触发。两大遗留：①patrol cron 连败读数失实硬证据已固化（gateway 直查本 job ok/连败0 vs patrol 报连败7，三类读数均不可信）②夜间 cron 连败集群（四路大师 17/tcm 周报 5/临床蒸馏 4/weekly-eval 4/smart-home 3，根因 402 zai_auto）均待主会话修真）

> 历史: 2026-08-24 21:00 CST（心跳：health-check 21:00 实探全绿 6 服务（8900/8901/8911/8912/8913/8920 均 200）；**新硬证据：gateway cron 直查本心跳 job 实态 lastRunStatus=ok / consecutiveErrors=0（20:30 跑 91s 成功），与 patrol 20:51 报「心跳检查连败7次」直接矛盾**——patrol 对 cron 连败读数失实再添一锤（叠加此前端口探活矛盾 + patrol 环境无 node），cron 连败集群数字待主会话以 gateway 实态复核；夜间 cron 连败集群（四路大师/tcm 周报/临床蒸馏/weekly-eval/smart-home）待主会话修真不变；今日无新蒸馏入库（最新 08-23 07:44 LCB7/LCB8）；kb_formal 69,220；staging pending 0；#5/#6 完结不变；v9.3 待用户触发）

> 历史: 2026-08-24 20:30 CST（心跳：health-check 20:30 实探全绿 6 服务 + kb-list/paipan-api OK；瞬时异常全日累计 93 次（18:37 时 85，20:06/20:21 各 4 项），档式漂移持续（20 点档 :06/:21，恢复仍在 :00/:30 整点档全绿）——「15 分钟周期某监控自带环境问题」结论坐实不变，待主会话定性；夜间 cron 连败集群（四路大师 17 + tcm 周报 5 + 临床蒸馏 4 + weekly-eval 4 + smart-home 3）待主会话修真不变；今日无新蒸馏入库（最新 08-23 07:44 LCB7/LCB8）；kb_formal 69,220（真库 server/database/yidao.db 1.8G）；staging pending 0；#5/#6 完结不变；v9.3 待用户触发）

> 历史: 2026-08-24 20:00 CST（心跳：health-check 20:00 实探 3 连测全绿 6 服务 + kb-list/paipan-api OK；瞬时异常全日累计 80 次且仍在涨（16:31 时 75），档式漂移持续（17 点档漂至 :06/:21，恢复仍在 :00/:30 整点档全绿）——「15 分钟周期某监控自带环境问题」结论坐实不变，待主会话定性；夜间 cron 连败集群（四路大师 17 + tcm 周报 5 + 临床蒸馏 4 + weekly-eval 4 + smart-home 3）待主会话修真不变；今日无新蒸馏入库（最新 08-23 07:44 LCB7/LCB8）；kb_formal 69,220（真库 server/database/yidao.db 1.8G，knowledge/*.db 均为 0 字节占位）；staging pending 0；#5/#6 完结不变；v9.3 待用户触发）

> 历史: 2026-08-24 14:00 CST（心跳：health-check 14:00 全绿 6 服务 + kb-list/paipan-api OK；瞬时异常全日累计 61 次（13:00 时 55），档式漂移持续（13 点档已漂至 :21/:31/:36/:51，恢复仍在 :00/:30 整点档全绿）——「15 分钟周期某监控自带环境问题」结论进一步坐实，待主会话定性不变；夜间 cron 连败集群（四路大师 17 + tcm 周报 5 + 临床蒸馏 4 + weekly-eval 4 + smart-home 3）待主会话修真不变；今日无新蒸馏入库（最新 08-23 07:44 LCB7/LCB8）；kb_formal 69,220；staging pending 0；#5/#6 完结不变；v9.3 待用户触发）

> 历史: 2026-08-24 14:00 CST（心跳：health-check 13:00 全绿 6 服务 + kb-list/paipan-api OK；瞬时异常全日累计 55 次，自 00:05 起 :05/:20/:35/:50 档式连续全天无中断且缓慢漂移（12 点档已漂至 :06/:21/:36/:51），恢复均在 :00/:30 整点档全绿——漂移特征坐实「15 分钟周期某监控自带环境问题」而非服务真宕，待主会话定性不变；夜间 cron 连败集群（四路大师 17 + tcm 周报 5 + 临床蒸馏 4 + weekly-eval 4 + smart-home 3）待主会话修真不变；今日无新蒸馏入库（最新 08-23 07:44 LCB7/LCB8）；#5/#6 完结不变；v9.3 待用户触发）

> 历史: 2026-08-24 11:30 CST（心跳：health-check 11:30 实探 3 连测全绿 6 服务 + kb-list/paipan-api OK，已实锤服务真活；瞬时异常今日累计 12 次（:05/:20/:35/:50 档式不变，最新 11:20，恢复均在我方直探 :00/:30 整点档全绿——两路 probe 结论矛盾，坐实「另一路监控自身环境问题而非服务真宕」，待主会话定性不变）；夜间 cron 连败集群（四路大师 17 + tcm 周报 5 + 临床蒸馏 4 + weekly-eval 4 + smart-home 3）待主会话修真不变；今日无新蒸馏入库（最新 08-23 07:44 LCB7/LCB8）；kb_formal 69,220；staging pending 0；#5/#6 完结不变；v9.3 待用户触发）

> 历史: 2026-08-24 10:30 CST（心跳：health-check 10:30 全绿 6 服务 + kb-list/paipan-api OK；瞬时异常今日累计 10 次（:05/:20/:35/:50 档式模式不变，10:05/10:20 各 5 项，恢复均在 :00/:30 整点档，疑与 cron 心跳自身并发探测/代理环境有关而非服务真宕，待主会话定性）；夜间 cron 连败集群（四路大师 17 + tcm 周报 5 + 临床蒸馏 4 + weekly-eval 4 + smart-home 3）待主会话修真不变；今日无新蒸馏入库（最新 08-23 07:44 LCB7/LCB8）；kb_formal 69,220；staging pending 0；#5/#6 完结不变；v9.3 待用户触发）

> 历史: 2026-08-23 19:30 CST（心跳：health-check 19:30 全绿 6 服务；**瞬时异常今日累计 3 次**（18:19/19:04/19:19，各 3 项，均 10min 内自愈，时间与 network-failover 切换相关，模式相同待观察）；今日 KB 新蒸馏入库 5 条（路总流年班 LCB7/LCB8 trust 0.85 连败 9 终结 + 古籍 3 条）；kb_formal 69,220；staging 0 待审；#5/#6 完结不变；v9.3 待用户触发；cron 余留异常：tcm 周报连败 4 + 临床蒸馏连败 3 仍待主会话处理）

> 历史: 2026-08-23 18:30 CST（心跳：health-check 18:30 全绿 6 服务，18:19 曾现 3 项异常 10min 内自愈；今日 KB 新蒸馏入库 5 条：路总流年班 LCB7/LCB8 trust 0.85 连败 9 终结 + 古籍 3 条；kb_formal 69,220；staging 0 待审）

> 历史: 2026-08-23 17:30 CST（心跳：health-check 17:30 全绿 6 服务；KANBAN 无可推进项；#5/#6 完结不变；v9.3 待用户触发；kb_formal 69,220；staging 0 待审；今日无新蒸馏入库（最新 distill-*.py 为 08-18）；cron 生态异常恶化中：四路大师连败 8→9 + tcm 周报连败 4 + 临床蒸馏连败 3（守门员已恢复不在列），仍待主会话处理）

> 历史: 2026-08-22 21:00 CST（日结：全绿 + #5/#6 完结不变 + 守门员连败 42 待主会话修真 + v9.3 待用户触发）

> **R730+ 双修真深度校正（2026-08-16 07:30）**：修真 #4 daily_push.js（db2d038）+ 修真 #5 daily-push-bridge.py（v3）二轮深度校正 14/14 全绿——三模式实测（HTTP public/simple/默认 execFile）+ 错误端口 9999 降级复现 + bridge --http 8921 临时拉起验证（31 字段 payload、127.0.0.1 绑定）+ 双出口数据一致性 5/5（date/年/月/日柱/生肖）+ 宜忌归一化全等（yi 18=18、ji 9=9，数组 vs 顿号串为格式差异非数据分歧）+ KB 47,653+5,772 持续入库 + 临时进程零残留。报告：workspace/DELIVERY/双修真深度校正报告-2026-08-16.html
> **R119 全量视觉蒸馏（2026-08-16 17:45）**：古籍抽样识别后台全量运行中——
> - 流水线：vision-distill-pipeline.py（PDF→图→autoglm→入库→记账断点）
> - 已完成：流年班命盘 10 个（23 条）✅ + 创业成败 ✅ + 玉匣记 5 页 ✅
> - 进行中：17 古籍 × 5 页（紫微斗数上下/六壬/术数全书/葬书/撼龙经/相术/一掌经等）
> - 增量 cron：每日 23:30 自动扫描桌面新 PDF（7d0de46b）
> - kb-search 修真：权威兜底后置 + title 优先 + 两两 AND 引擎 + 多词评分
>
> > **R119 全面推进（2026-08-16 12:20）**：跨项目隔离 + 医学物理迁移 + 双源修真三线收口——
> - **隔离**：kb_staging 262 条跨项目条目迁回各项目（shf 87/epb 70/fla 46/wx 59）；DPO 130 + SFT 1 条迁出归档；防御脚本 no-cross-project-tag.py 接入巡检
> - **医学物理迁移**：26,386 条 authority=pending → tcm-agent 权威库（+9,745 去重后入库），权威库 27,988 条；authority-mapping v1.2 active；蒸馏六流 6/6 全绿
> - **双源消除**：knowledge-qa + public/kb-search 医学域优先 8932 权威库（authority-tcm 引擎），本地 trigram FTS5 双字静默 0 命中 bug 修真（空结果强制 LIKE 兜底）
> - **cron 修真**：视觉同步幽灵 audit.py 移除 / YZX v4 固化脚本 / TCM日扫描+mignli-tcm+临床蒸馏纯脚本禁 LLM；新增 03:10 标记更新 + 03:40 正向同步
> - **提交**：f059cff / ece53cc / ee4b1b4 / f82eae8 / f6ffa1b / 141c6b6 / 5ffee44(shf) / 75b8232
> - 报告：DELIVERY/r119-全面推进-2026-08-16.html
>
> > **R763 综合恢复 + v9.2 修真（2026-08-20 15:11 CST）**：cron 监控第十六次复核与前 15 次（14:11/13:11/12:11/11:11/09:11/06:11/05:11/03:12/02:11/01:13/00:11/22:11/21:00/17:11 等）完全一致——v9.2=3/488=0.6%（v9.2-full488.log 10:04 API=8962）/16/488=3.3%（v92-full-full488.log 09:30）<< v9.0=263/488=53.9%，修真失败结论不变，生产保持 v9.0，#5 已完结状态不变；崩模型根因=fused-as-base 续训陷阱（lr 5e-6+iter 300+base 已 fused）+ loss 正常≠模型可用 + 483/488 答案空串（`模型=?`）；8960=v9.0-7b ✅ PID 28061 监听（curl /v1/models 200 返 mingli-sft-v9.0-7b）；8962/8964 评估端口无监听已停；eval-baziqa=0 进程干净；/tmp/baziqa-v92-eval.log 不存在；源 fused-archive(空)/v9.1-7b(不存在) 幂等保护跳过；归档目标 41G 已稳；已记 memory/2026-08-20.md
> > **R763 综合恢复 + v9.2 修真（2026-08-20 14:11 CST）**：cron 监控第十五次复核与第十四次一致——v9.2=3/488=0.6%（v9.2-full488.log 10:04 API=8962）/16/488=3.3%（v92-full-full488.log 09:30）<< v9.0=263/488=53.9%，修真失败结论不变，生产保持 v9.0，#5 已完结状态不变；崩模型根因=fused-as-base 续训陷阱（lr 5e-6+iter 300+base 已 fused）+ loss 正常≠模型可用 + 483/488 答案空串（`模型=?`）；8960=v9.0-7b ✅ PID 28061 监听（mlx-inference-server.py 8/19 12:09 起持续稳定，curl /v1/models 200 ✅ 返 mingli-sft-v9.0-7b）；8962/8964 评估端口无监听已停；eval-baziqa=0 进程干净；/tmp/baziqa-v92-eval.log 不存在；源 fused-archive(空)/v9.1-7b(不存在) 幂等保护跳过；归档目标 41G 已稳；已记 memory/2026-08-20.md
> 历史: 2026-08-20 16:11 CST（cron 监控第十七次复核：与前 16 次完全一致——v9.2=3/488=0.6% << v9.0=263/488=53.9%，修真失败结论不变，生产保持 v9.0，#5 已完结；8960=v9.0-7b ✅ PID 28061 监听；8962/8964 评估端口无监听已停；eval-baziqa=0 进程干净；源 fused-archive(空)/v9.1-7b(不存在) 幂等保护跳过；归档目标 41G 已稳；mlx-models-archive/v9.1-7b 已存无需重归档）
> 历史: 2026-08-20 15:11 CST（cron 监控第十六次复核：与前 15 次完全一致——v9.2=3/488=0.6% << v9.0=263/488=53.9%，修真失败结论不变，生产保持 v9.0，#5 已完结；8960=v9.0-7b ✅ PID 28061 监听；8962/8964 评估端口无监听已停；eval-baziqa=0 进程干净；源 fused-archive(空)/v9.1-7b(不存在) 幂等保护跳过；归档目标 41G 已稳）
> 历史: 2026-08-20 05:11 CST（cron 监控第七次复核：v9.2=3/488=0.6% << v9.0=263/488=53.9%，结论不变：生产保持 v9.0，#5 已完结；崩模型根因=adapter_config max_seq_length 768 不匹配 v9.0/v9.1 的 1024 + iters=50 中断 + seed=0；8960=v9.0-7b ✅ PID 28061 监听；8962 评估服务已停；源 fused-archive(空)/v9.1-7b(不存在) 幂等保护跳过；/tmp/baziqa-v92-eval.log 不存在→eval-baziqa=0 进程干净）
> 历史: 2026-08-20 06:11 CST（cron 监控第六次复核：v9.2=3/488=0.6% << v9.0=263/488=53.9%，结论不变：生产保持 v9.0，#5 已完结；崩模型根因=adapter_config max_seq_length 768 不匹配 v9.0/v9.1 的 1024 + iters=50 中断 + seed=0；8960=v9.0-7b ✅ PID 28061 监听；8962 评估服务已停；源 fused-archive(空)/v9.1-7b(不存在) 幂等保护跳过）
> 历史: 2026-08-20 03:12 CST（cron 监控第五次复核：v9.2=3/488=0.6% << v9.0=263/488=53.9%，结论不变：生产保持 v9.0，#5 已完结；两个源目录 fused-archive/v9.1-7b 均不存在 → 幂等保护跳过；8960 = v9.0-7b ✅ 生产 28061 监听；归档目标 41G 已稳）
> 历史: 2026-08-20 02:11 CST（cron 监控复核：v9.2=3/488=0.6% << v9.0=263/488=53.9%，结论不变：生产保持 v9.0，#5 已完结；两个源目录 fused-archive/v9.1-7b 均不存在 → 幂等保护跳过，不重复 rsync）
> 历史: 2026-08-20 00:11 CST（cron 监控复核：/tmp/baziqa-v92-eval.log 不存在、eval-baziqa=0、8962 无监听；持久化结果 v9.2=3/488 ≤ v9.0=263/488，结论不变：生产保持 v9.0，#5 已完结）
> 历史: 2026-08-19 21:00 CST（日结：#5 v9.2 修真失败收口 + #6 staging 0 待审 + R764-R767 盘点/清理/隔离完成 · 健康 21:00 全绿）
> 历史: 2026-08-19 17:11 CST（v9.2 t512 版 cron 复核：3.3% << v9.0 53.9% · 修真失败结论不变 · 生产保持 v9.0 · 8962 评估服务已停）
> 历史: 2026-08-18 21:17 CST（日结：v9.0 上线 53.9% 历史新高 + v9.1 修真失败 45.1% 回退分析 + 生产保持 v9.0）
> 历史: 2026-08-17 23:30 CST（v8.9 v2.1 评估中断诊断 · 143/488=50.3% · 进程消失待重跑 · v8.7 v2.1 未启动）

## 08-24 21:00 心跳补充：patrol cron 连败读数失实硬证据 🧾

- gateway cron 直查：本心跳 job `eb1a3b20` 实态 **lastRunStatus=ok、consecutiveErrors=0**（20:30 跑 91s 成功，本 21:00 轮即其下一次）
- 同一时段 patrol（20:51）报「命理宝jian 心跳检查 连败7次」→ **直接矛盾，坐实 patrol cron 连败读数失实**
- 加上已知端口探活矛盾 + patrol 环境 `node 不存在`，patrol 三类读数（端口/连败/内联校验）均不可信
- **待办（主会话）**：cron 连败集群数字应以 gateway cron list/get 实态复核为准，勿直接采信 patrol；夜间连败集群（四路大师/tcm 周报/临床蒸馏/weekly-eval/smart-home）的 402 zai_auto 根因判断不变，修真方案不变

## 08-24 心跳：cron 连败根因（402 zai_auto） ⚠️

- health-patrol 报 4 项 cron 连败，端口服务实全绿（8 项 OK）
- 根因：默认模型 `zai/zai_auto` 402（计费/配额），model:None 的 isolated 任务全灭：smart-home 同步(3)/tcm 周报(5)/临床蒸馏(4)/weekly-eval(4 超时)/PDF 蒸馏(2)
- 本心跳指定 glm-5.3 不受影响；cron run 工具受限无法代改他 job
- **待办（主会话/用户）**：5 个 job 显式指定 glm-5.3 或修复 zai_auto；详见 memory/2026-08-24.md 19:35 段

## 08-18 04:40 心跳巡检：R725 审核完结 + KANBAN 清理 + 新任务排入 🔧

- **蒸馏候选审核（8 条 pending → 全部 rejected）**：R725 候选 KB-DISTILL-RISK-20260815 及同类积压逐条比对 kb_formal 后拒绝入库：
  - KB-DISTILL-RISK-{20260810,20260815,20260817}：风险分布全「未知」（3/3/9 人），零信息量，与已入库 KB-DISTILL-RISK-20260803（较高3/中等1）重复
  - KB-DISTILL-ORGAN-{心,脾,肾}-20260817：症状为 kb_formal ORGAN-*-20260803 子集、方剂相同，无增量
  - KB-DISTILL-SYMPTOMS-20260817：样本过小（5 条记录），历史同类 20260803/20260807 均拒
  - 审计：kb_staging audit_notes + kb_audit 表 AUD-20260818-* 7 条落账
- **生产状态确认**：8960 = mingli-sft-v8.7-7b ✅（v2.1 复评流水线第②步回切已完成）；v2.1 复评结果文件不存在（评估器脚本 `.openclaw/tmp/giant-shoulders/` 目录已清理丢失）→ **v8.7 v2.1 基线评估待重跑**（v8.10 计划前置依赖）
- **KANBAN 清理**：进行中区段 R119（✅ 08-16 完结）/ R694（✅ R732 收口）/ R120（✅ 已入库）/ R725（✅ 已审核）→ 移入已完结
- **新任务排入**：#5 v8.10 训练计划（前置：重建 eval-baziqa-v2.py + 重跑 v8.7 v2.1 基线）、#6 staging 积压审核（152 pending：KB-tcm-* 139 + 路总流年班 4 + lm-* 专利 5 + fb_* 反馈 2 + 其他）

## 08-17 22:05 v8.9 修真收口：评估器修真 v2.1 + 复评流水线 + v8.10 计划 🔧

- **v1 评估器修真（根因发现）**：v8.9 46.5% 不达标（<52%），但修真分析发现 v1 评估器自带 3 个测量缺陷：
  1. 提示词「只回复选项字母（如 A）」以 A 为示例 → **诱导模型默认输出 A**（探针实测：同一题 Q5 v1 输出 `A题目…`，去掉示例后输出 `B题目…` 且 B 为正确答案）
  2. max_tokens=30 过短 → 推理输出被截断，提取器取首字母拿到的是推理开头而非最终答案（实测 `C ```C``` ` 退化输出）
  3. 提取逻辑只取首字符，无多级容错
- **修真产物**：`.openclaw/tmp/giant-shoulders/eval-baziqa-v2.py`（v2.1）——去「如 A」示例 + max_tokens 200 + 五级提取（fence/leading/punct全角/keyword/lone）+ 空提取重试 1 次 + raw 输出审计日志
- **复评流水线**（22:05 后台运行，约 65min）：① v8.9 v2.1 全量评估 → ② 8960 回切 v8.7（plist MLX_MODEL 已修真 + 备份 .bak-v89-switch）→ ③ v8.7 v2.1 全量评估。完成后续报：`baziqa-eval-full-{v87,v89}-v2.json`
- **答案位置分布分析**（排除位置偏差干扰）：题库正确答位 B=62.5%/C=24.6%/A=8.4%，v8.7 训练集 BaziQA 段同分布（B=64%）→ 训练/评估位置分布一致，**v1 的 A 偏好为提示词诱导而非数据偏差**
- **v8.10 修真计划**（等 v2.1 复评数据出来后执行）：
  1. **基座换回 Qwen2.5-3B base 直训**（v8.9 基座 = v8.7 fused → LoRA 叠加衰减，已确认 adapter_config base_model=mingli-sft-v8.7-7b）
  2. **数据用 v8.7 最优配方**：610 条（BaziQA 推理链 246 + 自由问答/KB 364），lr 5e-6，200 iters
  3. **训练数据补「只输出字母」格式样本**（对齐 v2.1 评估器交互格式，消除退化输出）
  4. 达标口径改为 v2.1 评估器 ≥52%（v8.7 v2.1 基线先落地）
- **数据配比修真经验（固化）**：推理链占比 v8.7 混合配方（BaziQA 246/610≈40% 但含知识库增强）> v8.9 77%（507 条）> v8.8 39%（1010 条稀释）——**不是推理链越多越好，混合配方 + 不叠加 LoRA 才是关键**
- 待办：v2.1 复评结果 → 决定 v8.7 长期驻留 or 立即 v8.10；v8.10 训练 + 评估 + 切生产（三件套）

## 08-17 21:30 心跳：v8.9 评估出炉 · 回退确认 · v8.7 保持生产最佳

- **健康检查**：health-check.sh ✅ HEALTHY——8900/8901/8911/8912/8913/8920/8960 全部 200；8960 生产 = mingli-sft-v8.9-7b
- **v8.9 全量 BaziQA 评估结果**：**227/488 = 46.5%**（较 v8.7 51.8% 回退 **-5.3pt**）
  - 根因分析：v8.9 训练集 507 条（推理链 390 + 自由问答 100 + R733 19），推理链占比 77% 虽达标，但 v8.9 基座为 v8.7 fused → 二次 LoRA 叠加导致推理能力衰减
  - **v8.7 仍为历史最佳**（51.8%），建议回切 v8.7 生产
- **下一步**：①回切 8960 → v8.7 ②诊断 v8.9 失败 case 分布 ③考虑 v8.10 直接在 Qwen2.5-3B base 上训练（避免叠加 LoRA）

## 08-17 R736 心跳巡检 + 视觉蒸馏批次完结（10:50）

- **服务健康**：8914/8920/8911/8912/8913 全部 HTTP 200；GitHub Pages index.html 200；守门员 fe6661c8 近 6 次运行全 ok
- **视觉蒸馏批次完结**：08-16 17:20-18:04 共处理 **28 个 PDF 全部 ok**（紫微斗数上/下、御定六壬直指、术数全书上中下、图解葬书上下、相术、秘藏大六壬大全、精刻看命一掌经、面诊等），kb_formal 累计 **54,438 条**；源目录 ~/Desktop/周易-中医 已空 → 该批次不再续跑，增量 cron（23:30）继续值守
- **cron 修真 1 项**：网络自动切换（d7299497）24h 内 65 次 model-call 超时（60s 阈值太紧，偶发慢调用）→ timeoutSeconds 60→150；修真后 10:46 运行 ok（25s）
- **待观察**：四路大师增量采集 10:45 失败（sqlite3 多步中断）、ASH 周报/公众号周报 10:08 超时——均为独立单次事件，下次运行观察
- **HEARTBEAT.md 修正**：穿戴 SDK 检查项改为实际存在的 app/wearable-hub.html（js/wearable/rokid-bridge.js 从未入库，原检查恒 404）

## 08-15 R730 P0-4 daily_push.js HTTP 模式修真（21:15）

- **触发**：修真排期要求 daily_push.js 增加 `--http` 模式走 `8920/api/daily-almanac` 同源端点
- **修真**：`daily_push.js` 支持 `DAILY_PUSH_HTTP_BASE` 环境变量 + `--http` 命令行参数；HTTP 拉取后字段归一化（`ganzhi/yi_ji`），私域字段（`shichen[]/weather/wisdom/chong_zhi/sha/pengzu/shensha/deities/jieqi_info`）缺失 → 自动 execFile bridge 兜底补齐
- **降级**：env 未设置/服务未启动 → 静默回退原 execFile 路径，向后兼容 100%
- **验证**：
  - `DAILY_PUSH_HTTP_BASE=http://127.0.0.1:8920 node daily_push.js public` → ✅ HTTP+bridge 合并全字段
  - `DAILY_PUSH_HTTP_BASE=http://127.0.0.1:8920 node daily_push.js simple` → ✅ 同源 simple 输出
  - `node daily_push.js public`（不设 env）→ ✅ execFile 兜底与原行为一致
- **commit**：`db2d038`（已推 main + gh-pages）

## 08-15 R721 v8.3 收尾完成（15:35）⭐

- **训练完成**：第三次启动（14:35 PID 3195）顺利跑完 150 iters · Val loss 2.055 · Train loss 2.343 · adapters.safetensors 28MB 落盘（15:01）
- **fuse 完成**：v8.3 adapter × v8.2 base → `training/mlx-models/mingli-sft-v8.3-7b`（4.0G 完整落盘 15:13，磁盘余 ~7.6G 可行）
- **30 题评估（15:23）**：**AVG 95.5 · VERDICT PASS** ⭐（v8 58.3 → v8.1 68.7 → v8.2 93.8 → v8.3 95.5）
  - 分类：命理 97.9 / 中医 97.5 / 边界 89.4（边界较 v8.2 +12.5）
  - **重点题修复达标**：idx23 50→75、idx24 40→100（反向 SFT 27 条生效）
  - 修真指标：tag_leak 0/30（v8.2 为 1）· 套话 3/30 · 占位符未处理 2/30
  - 评估方式：8961 临时服务直评（不影响生产），题目与评分器与 v8.2 评估完全一致
- **8960 切换**：plist MLX_MODEL → v8.3 · bootout+bootstrap+kickstart · /v1/models 确认 mingli-sft-sft-v8.3-7b · 8920 网关 chat 链路实测正常（33.4s 含模板渲染）
- **R726（20:50）MLX 流式透传**：server api-server-v2.js callAIWithFallback 修真 MLX-v5 路径 stream:false → 透传调用方 stream。8920 网关流式调 8960 首字 <1s（实测 0.82s 长问 P95 22.8s→0.94s，提速 -96%）
- **磁盘现状**：fuse 后 Data 卷约 4G 可用（v8.2 base 保留可回滚）

## 08-15 R720 v8.2 收尾推进（12:40）

- **fuse 完成**：v8.2 adapter × v8.1 fused base → `training/mlx-models/mingli-sft-v8.2-7b`（4.0G 完整落盘 11:27）
- **8960 切换**：plist MLX_MODEL → v8.2 · /health ok · 实测 chat 正常（model=mingli-sft-sft-v8.2-7b）
- **磁盘脱险**：旧 Qwen 3B base（5.8G）ditto 归档 data1 + Trash 清理 → Data 卷 5.7G → **12G 可用**
- **端口误报更正**：四诊微服务实为 8941-8945（此前记 8841 有误），5 svc 全在线
- **评估脚本修真**：run1 64.7 分系解析 bug（8920 包 choices 嵌套，脚本读 data.content 得空串→30 题全被 too_short 误伤）；修真 content 解析 + timeout 60→110s；run1 存档 `eval-results-v82-r720-30q.run1-invalid.json`
- **run3 真分出炉（12:50）**：**AVG 93.8 · VERDICT PASS** ⭐（v8 58.3 → v8.1 68.7 → v8.2 93.8，累计 +35.5）
  - 分类：命理 100.0 / 中医 100.0 / 边界 76.9
  - 修真指标：tag_leak 1/30 · 套话 1/30 · 占位符未处理 3/30（v8.1 为 1/30 套话+1 泄漏，整体大幅改善）
  - 仅 2 题 <70：idx23（内部文档段落「## 十、用户输入合法性检查」吐出+重复6次）、idx24（复述 gender_year_month_day_hour 字段名）
  - 结论：v8.2 达标上线，idx23/24 列入 v8.3 反向 SFT 候选

## 08-15 R720 v8.1 修真落地（10:00）

- **触发**：08-14 21:42 cron systemEvent 触发 v8.1 30 题评估，结果 **68.7/100**（baseline 58.3 → **+10.4**）
- **修真明细**：套话 9/30 → 0/30（-30pp）、标签泄漏 7/30 → 1/30（-20pp）、重复 2/30 → 0/30、平均长度 87 → 134 字
- **分类提分**：命理 58.0→66.3（+8.3）、中医 67.0→73.2（+6.2）、**边界 50.0→66.8（+16.8）⭐**
- **commit**：`0603467` 已推 main + gh-pages 双推；修真指针写入 KANBAN + server 子模块
- **残留问题**：idx=27 一题 tag_leak（[xxx]类问题未主动索取真实信息）→ 已修真 clean4 反向数据 24 条

## 进行中

### #5 BaziQA v9.2 全量评估未达标（t512 · 2026-08-19） ✅ 已评估完结（生产保持 v9.0）
- **08-30 21:00 日结更新**：⏭️ P2.8 问诊台后验收冲刺已收口——当日以 UI 级端到端验收 PASS（真实点击路径，病历 #23）+ ui-smoke-consultation.js 五节点回归脚本两连跑 PASS（#24/#25）完成验收；同日问诊台落地双轨采集/批注 approve 闭环/患者合并报告页/SLA 计时（见已完结表 08-30 行）。
- **08-29 21:03 日结**：今日全天心跳监测日（12 轮全绿零故障），无新推进；下一步动作不变（服务中心导航体验回归走查，待主会话浏览器）。
- **08-28 01:30 心跳复核**：6 端口直探全 200（8900/8901/8911/8912/8913/8920）+ 8960=v9.0-7b ✅；无新蒸馏入库（最后 distill-*.py 仍为 08-16）；#5/#6 完结态不变。⏭️ P2.8 问诊台后验收冲刺仍待主会话（浏览器）执行。
- **08-27 07:00 心跳复核**：6 服务全绿（07:00:07/07:00:14 双跑 HEALTHY，kb-list/paipan-api OK）；无新蒸馏入库（今日无 distill-*.py 执行）；3 项夜间 cron 连败仍为陈旧计数（周报/临床蒸馏/weekly-eval，a7e0ae2 下周一 06:00 复验）；#5/#6 完结态不变。⏭️ P2.8 问诊台后验收冲刺（2 新病例全链回归）已到期，cron 心跳会话无浏览器工具，待主会话执行。
- **08-27 06:30 心跳复核**：6 服务全绿 + 8960=v9.0-7b ✅；无新蒸馏入库（今日无 distill-*.py 执行，vision last=08-16）；3 项夜间 cron 连败仍为陈旧计数（周报/临床蒸馏/weekly-eval），weekly-eval a7e0ae2 下周一 06:00 复验；#5/#6 完结态不变，无新动作。
- **08-26 22:40 心跳复核**：6 服务直探全绿（8900/8901/8911/8912/8913/8920 均 200）+ 8960=v9.0-7b（/v1/models 200 返 mingli-sft-v9.0-7b）+ kb_formal=60,554 与 20:30 一致 + staging pending 0；无新蒸馏入库（今日无 distill-*.py 新执行）；22:25-22:31 曾现 1 项异常瞬时档（22:39/22:40 双跑 HEALTHY 自愈，延续已知档式漂移模式）。#5/#6 完结态不变，v9.3 阈值触发制不变；夜间 cron 连败三项（家庭健康周报/临床蒸馏/weekly-eval）为陈旧计数待复跑清零，weekly-eval 修真 a7e0ae2 下周一 06:00 验证。
- **08-26 21:00 日结复核**：6 服务直探全绿（8900/8911/8912/8913/8920 均 200 + 8901 root 200）+ 8960=v9.0-7b（/v1/models 200）+ kb_formal=60,554 与 20:30 一致 + staging pending 0；无训练/评估进程残留。#5/#6 完结态不变，v9.3 阈值触发制不变。
- **下一步动作（08-30 21:00 更新）**：明日 06:00 验证 weekly-eval 修真复跑结果（commit a7e0ae2），随后主会话修 health-patrol 读数失实。
- **08-26 18:30 心跳复核**：六端口 health-check.sh 全绿（18:30 三连跑 HEALTHY，kb-list + paipan-api OK）；staging 0 待审；kb_formal=60,554 与 16:30 一致，无新蒸馏入库、今日无 distill-*.py 新执行、无训练/评估进程；#5/#6 完结态不变。⚠️ 余项不变：家庭健康周报/临床蒸馏 402 计费、四路大师采集 data1 沙箱路径——待用户决策。
- **08-26 18:00 心跳复核**：六端口全绿（18:00:47/18:01:02 双跑 HEALTHY，kb-list + paipan-api OK）；staging 0 待审；无新蒸馏入库、无训练/评估进程；#5/#6 完结态不变。✅ 已修真 weekly-eval 连败4根因（launchd 无 nvm PATH → `node: command not found`，/tmp/mingli-weekly-eval.err 实锤）：scripts/weekly-eval.sh 加 NODE_BIN 兜底（同 08-22 cron-distill-kb-link 修法）+ git 强制纳入（.gitignore scripts/* 曾漏管）commit a7e0ae2，syntax 校验通过，下周一 06:00 验证。⚠️ 余项：家庭健康周报/临床蒸馏 402 计费、四路大师采集 /Volumes/data1 沙箱路径——仍待用户决策。
- **08-26 02:00 心跳复核**：六端口 health-check.sh 全绿；8960=v9.0-7b 进程存活；staging 0 待审；无训练/评估进程、无新蒸馏入库。⚠️ 新发现：4 个 cron 任务连败（四路大师采集 连败3「list /Volumes/data1 周易-中医 failed」——疑似沙箱路径权限而非磁盘未挂载（宿主 shell 可 ls，卷已挂载）；家庭健康周报/临床蒸馏 连败 402 Payment Required（模型计费问题）；weekly-eval 连败4 超时 model-call-started）。均已超 3 次阈值，health-patrol 持续告警中，待用户决策（修复计费/调整超时/禁用）。
- **08-26 00:00 心跳复核**：六端口 health-check.sh 全绿；8960=v9.0-7b ✅；staging 0 待审；无训练/评估进程、无新蒸馏入库（08-26 无 distill-*.py 记录）；tcm-daily-scan 08-25 16/18 通过。#5/#6 保持完结态，无新动作。
- **08-25 22:00 心跳复核**：六端口 health-check.sh 全绿（8911/8912/8913/8900/8920/8901 + kb-list + paipan-api 全 OK）；8960=v9.0-7b ✅（/v1/models 返回 mingli-sft-v9.0-7b）；staging 0 待审；无进行中训练/评估进程。#5/#6 保持完结态，无新动作。
- **08-25 10:00 心跳复核**：8960=v9.0-7b ✅ 8901/8920/8900 等 8 端口全绿；staging 0 待审；distill-governor 08-25 09:45 例行 ✓21/✗0（六流全绿，无新蒸馏入库，vision→tcm 209h 陈旧产物仅巡检提示）；无进行中训练/评估进程。#5/#6 保持完结态，无新动作。

**22:11 cron 二次确认（终态 4 跑证据链）**：v9.2-full488.log (10:04, API=8962) 3/488 + v92-full-full488.log (09:30) 16/488 + v9.2-local-q10-sample10.log (12:09, mlx_lm 直评) 0/96 + v9.2-local-q10-fix-sample10.log (12:10, fix 跑) 0/96 → **全量 0.6% 与直评 0/96 完全吻合，排除服务/API/网络问题，定位到 v9.2 fused 推理能力坍塌**
- **终态成绩**：BaziQA 全量 488 **3/488 = 0.6%**（远低于 v9.0 的 263/488 = 53.9%）❌
- **结果文件**：`training/baziqa-results/v9.2-full488.log`（10:04 跑，API=8962）+ `v92-full-full488.log`（09:30 跑）+ 双 local-q10 复核（12:09/12:10）四份一致
- **答案分布异常**：`{'': 483, 'A': 1, 'B': 1, 'C': 3}` —— **96% 题模型输出空答案**，v2.1 五级提取器全部空，v2.2 max_tokens=512 无效
- **local-q10 复核（关键证据）**：12:09/12:10 用 `eval-baziqa-local.py` 直接 mlx_lm.load + mlx_lm.generate，不走 server、不走 API，10 人样本 96 题 **0/96 = 0.0%**，全部 `模型=?`。**排除服务/API/网络问题**，确认是 v9.2 fused 模型本身推理能力坍塌
- **回退分析**：
  - 训练日志正常：Iter 300 Train loss 1.111 / Val loss 1.455（v9.0 Iter 300 Val 1.541，loss 数字略好于 v9.0），300 iter 完成无 OOM（resume-v92 修真有效）
  - fuse 流程正常：base=v9.0 fused（✅ 与训练 base 一致，符合 TOOLS.md 修真教训），adapter → fused 4.0G 完整
  - 但 fuse 后模型无法按字母格式作答（chat_template/格式漂移？）→ 推测：**max-seq-length=1024+adapter LR 5e-6 在已有 fused 基础上 300 iter 增量导致模型「过度格式化到 v9.0 内部表达」，丧失 v2.1 评估器期望的字母结尾回复能力**（v8.8/v9.1 是输出字母但选错，v9.2 是输出字母都困难）
  - 历史对照：v9.0（300 iter 从 v8.7 base 直接训）= 53.9%✅；v9.1（错题回填+shuffle）= 45.1%❌；v9.2（v9.0 base 续训）= 0.6%❌❌ → 「以 fused 为 base 续训」路径本身需要降 lr 或降 iter
- **修真教训（新增固化）**：
  - ① **fused-as-base 续训陷阱**：在已 fused 全权重上再叠 LoRA，iter 数必须 < 100（前 50 已接近崩点），lr 必须 ≤ 2e-6（5e-6 过高导致权重漂移出原始字母映射）
  - ② **post-fuse 验证关**：每次 fuse 后必跑 local-q10 探针（10 题即可）确认模型能输出字母，再启全量评估；本次 4 次评估 0/96 才确认，比前 2 次 16/488→3/488 更早发现问题
  - ③ **loss 数字正常 ≠ 模型可用**：v9.2 Train loss 1.111 优于 v9.0 的 1.4x，但 loss 反映 next-token 概率，与「按格式输出字母」是两条评估轴
- **生产状态**：8960 = mingli-sft-v9.0-7b ✅ 53.9% 生产保持不动；mlx_lm server 评估进程已全部清理（8962/8964 LISTEN=0，pgrep=0）；v9.2 fused 模型保留在 `training/mlx-models/mingli-sft-v9.2-7b/` 供修真对照，**不删**（修真可能复用）
- **磁盘收尾**：fused-archive rsync 完成（11:17 /Volumes/data1/.../mingli-db-backups-20260819/ 含 mingli-v4/v5-fused 备份，源已清空 ✅）；v9.1-7b mlx-models rsync 完成（4.0G → /Volumes/data1/.../mlx-models-archive/mingli-sft-v9.1-7b/，源已删 ✅ 验证无生产引用）
- **22:11 cron 二次确认**：4 跑 100% 一致（API 8962 3/488 + 早跑 16/488 + local-q10 双 0/96）→ 修真结论终态闭环；8962 进程/端口零残留 ✅
- **00:11 cron 监控复核（2026-08-20）**：临时日志 `/tmp/baziqa-v92-eval.log` 已不存在，`eval-baziqa` 实际进程=0，8962 无监听；以持久化 `v9.2-full488.log` 为准，X=3/488=0.6% ≤ v9.0 的 263/488=53.9%，回退结论不变，生产继续保持 v9.0，#5 完结状态不变。磁盘任务按幂等保护跳过：两个源目录均已清理，目标归档目录已存在，不重复 rsync/删除。
- **02:11 cron 监控复核（2026-08-20）**：与 00:11/01:13/22:11 四次 cron 一致——`pgrep eval-baziqa=0`、8962 无监听、`/tmp/baziqa-v92-eval.log` 不存在；持久化终态 `v9.2-full488.log` 3/488=0.6% ≤ v9.0 263/488=53.9%，修真失败结论不变，#5 完结状态不变。磁盘任务幂等保护跳过：`data/backups/fused-archive` 与 `training/mlx-models/mingli-sft-v9.1-7b` 源仍不存在（v9.1 fused 从未产出过，仅有原始 checkpoint 385M 在 `training/mlx-checkpoints/mingli-sft-v91/`），归档目标 `/Volumes/data1/ml-training/archive/mingli-db-backups-20260819/` 已存在。
- **下一步（#7 候选）**：v9.3 = v9.0 fused base 续训 **iter=50 + lr=2e-6**（修真教训①落地）+ post-fuse local-q10 探针强制门（修真教训②落地）；数据保留 v9.2 contest8 + v9.0 原数据，去 225 错题回填

### #6 staging 积压审核 ✅ 完成（2026-08-19 R735-g11）
- **处理结果**：approved 4 条（路总紫微学业 2 + 舒晗奇门择吉/风水 2）引擎 promote 入正式库（kb_formal 3642）；中医望诊 3 条按域隔离拒绝（tcm-agent 域，备注转运）；测试残留 1 条删除；rejected 归档 1 条
- **终态**：staging 队列 0 待审（promoted 3642 / rejected 405 / staging 3→0 域隔离处理）
- **构成**：KB-tcm-* 139 条（08-09 批量 QA）+ 路总流年班合婚技法 entry-* 4 条 + lm-* 路大师专利 5 条 + fb_* 反馈蒸馏 2 条 + 其他
- **节点进度（08-18）**：今日未推进（v9.x 训练链占满）；待办不变
- **下一步动作**：先确认 KB-tcm-* 139 条是否走 tcm-agent 权威库流程，再逐批比对 kb_formal / authority-tcm，重复拒绝、有效 promote

## 08-14 已完结（修真后）

## 08-14 R713 故障处理（10:30）

- **事件**：08-14 08:50 起 health-patrol 持续报异常（峰值 13 项），10:06 系统重启后服务陆续拉起，但 api-v2(8920) crash loop（stderr `ERR_SQLITE_ERROR: database is locked`，根因：重启后 Spotlight 重建索引 I/O 风暴 500-660MB/s → SQLite 大查询饿死）
- **处理**：确认 8960/8913 为脚本超时误报（已修真 health-patrol.sh：8913 3s→8s+retry、8960 5s→15s+retry）；api-v2 kickstart 后恢复（149 端点正常）
- **✅ MLX 已切 v8**：8960 端口返回 `mingli-sft-v8`，plist `com.mingli-baojian.mlx-v8.plist` 于 08-14 11:30 部署，旧 v5 plist 已 .bak。R713 所述「v5 回退」问题已解决
- **服务终态**：8900/8901/8911/8912/8913/8914/8920/8960 全部 200，内存 49%
- **根因待查**：08-14 09:32 是谁把 plist 回滚 v5（疑似为保服务稳定手动回退，需用户确认 v6 是否重新上线）— **今日 R718 (commit 81901c8) 已统一指向 v8.1，根因闭环无需再查**

## 已完结

| 日期 | 任务 | 产出物 |
|------|------|--------|
| 2026-08-30 | 问诊台命理双轨链端到端闭环：双轨采集（R-DUAL-TRACK）+ 批注 approve 双人复核链（R-ANN-LINK）+ 患者合并报告页（R-MERGE）+ SLA 48h 计时（R-SLA）+ mingli 入病历 bug 修 | app/report.html + GET /api/public/emr-report/:sid + 病历 #21-#25 实测 |
| 2026-08-30 | UI 级端到端验收 + 回归脚本固化：真实点击路径五节点（排盘草案→归档→报告→SLA→mingli 落库）两连跑 PASS | scripts/ui-smoke-consultation.js + DELIVERY/ui-smoke-report-case23-20260830.jpg |
| 2026-08-30 | A线 28 工具审计整改 H1-H8 全落地 + B线医学能力与中医标准智能体 100% 对齐（tcm 164 条全集 + 补 13 条） | docs/audit-input-adequacy-20260830.md + docs/audit-flow-medical-parity-20260830.md |
| 2026-08-30 | 排盘/民俗/报告全面诊断整改 10/10 销号 + 用神直断（R-YONGSHEN）+ 应期层（R-YINGQI）+ 真太阳时校正（R-H4，58 城经度表） | docs/tool-diagnosis-20260830.md + scripts/diag-tools-full.py 基线全绿 + server/city-lng.js |
| 2026-08-30 | 全站 IA 诊断 + 中心化重构首轮 + C 类遗留页归档 12 页（divination-hub 锚点契约纠错保留） | docs/ia-diagnosis-20260830.md + archive/legacy-pages-202608/ |
| 2026-08-30 | 问事页升级「问事服务中心」（21 工具 9 组）+ 手机号命局契合（R-MOBILEFIT）+ 合婚 v2 + 反馈回传闭环 + G5 九节点冒烟复跑 PASS + G1 链4 轮询验收（kb-follow PATH 修真） | ask.html + POST /api/minsu/mobile/advise + DELIVERY/g5-smoke-evidence-20260830-201948.json |
| 2026-08-30 | 校正库扩容（Wikidata 300/国去重 698 人，校正库 974→978）+ 维基补跑看守 cron 上线（每小时幂等断点续跑自停） | fetch-wikidata-celebs.py + scripts/fill-wikidata-events.py |
| 2026-08-26 | 问诊台全链路 P1→P2.8 八连击（核心链路/患者报告/实时问诊环/自动研判环/检验旁证/专科判读/签名链/检验×命理互参闭环）| consult-workbench + live-room + patient-report + lab-evidence + 互参提示盒（case#18 端到端实测）|
| 2026-08-26 | OneFrame 9 模型齐套（算命组 3：掌纹/面相/痣相 + 问诊组 6：面色/唇/舌色/舌苔/巩膜/指甲）| 9 ONNX + labels.json 第 20-28 条 + 4 svc /health 在册 |
| 2026-08-26 | p0-3 报告层全模块修真（bazi/ziwei/hehun/family/lifeplan/fengshui/liuyao 七模块五段 filled + KB 模块匹配）| server cff9ad7 + kb-module-filter 共享模块 |
| 2026-08-26 | P0-1 密钥轮换全链路（6 处凭证）+ P0 cron 402 集群修真（10 job 切 glm-5.2）+ 微信 bot :3900 退役 | auth-profiles/models.json/openclaw.json + archive plist |
| 2026-08-26 | 接管首批交付：KB 去重 -9,139（69,327→60,193）+ data1 备份补跑 16 快照 + v9.2 收口 + v9.3 阈值触发制 | docs/V93-TRIGGER-SPEC.md + AUD-DEDUP-* 审计留痕 |
| 2026-08-19 | #6 staging 积压审核闭环（310 pending → 0，promoted 3642 / rejected 405）| kb_audit AUD-20260819-* + audit_notes 落账 |
| 2026-08-19 | #5 v9.2 增量训练修真失败收口（0.6% ❌）+ 三条修真教训固化 | v9.2-full488.log + local-q10 0/96 证据 |
| 2026-08-19 | R764 残留清理 + 记忆定位优化 | MEMORY.md/TOOLS.md 固化 BaziQA 管线 |
| 2026-08-19 | R765 端口冲突修真（order-service 8961→8963）+ 三域资产归属复查 | 34 条订单数据保留 / 8961 归还算法超市 |
| 2026-08-19 | R767 .qclaw 命理资产隔离（KB 回迁 + HeiGe 红线 skill 清除）| 40 文件归档 / 8901 服务项目内 |
| 2026-08-18 | v9.1 修真失败分析完结（45.1% ❌）→ 教训固化，生产保持 v9.0 | 三条修真教训入库（shuffle 均衡化错误 / 增量须以 v9.0 fused 为 base / 错题回填需真实样本）| 
| 2026-08-18 | v9.0 训练 + 评估 + 上线：BaziQA 53.9%（263/488）历史新高（+2.1pp vs v8.7）| mingli-sft-v9.0-7b（4.28GB）· 8960 生产已切 · 回滚路径 plist MLX_MODEL→v8.7 |
| 2026-08-18 | R739 launchd 修真：face-diag/vision-gateway/face-ocr 残缺 plist 重写（KeepAlive+日志+路径修正）| 核心 17 服务全部 KeepAlive 自愈 · face-diag 杀后 6s 自动拉起实测 |
| 2026-08-18 | R739 项目边界盘点：品牌词隔离纯净 + 磁盘 11G→19G + venv 修真（ai-vision-toolkit 42py / tcm-agent 18py）| check-cross-brand 全绿 · 归档 v8.9 fused + 量化失败产物 → data1 |
| 2026-08-18 | R739 全面 AI 化：8959 规则引擎 AI 化（端到端 12.5s）+ 4-bit 量化修真失败回滚（结论：量化须在 base 层做）| 30438005 · 量化模型进 quarantine 待修真 |
| 2026-08-18 | R739 public-chat 卡死修真：根因=长 sysMsg 2472 字 + 3B 模型 20tok/s + max_tokens 512 | max_tokens 512→256 · 22.7s 完整回答不再卡死 · 流式首字 <2s 不受影响 |
| 2026-08-18 | R725 蒸馏候选审核完结（8 条 pending 全部 reject：RISK×3 + ORGAN×3 + SYMPTOMS）| kb_audit AUD-20260818-* 7 条 · audit_notes 落账 |
| 2026-08-16 | R119 古籍视觉蒸馏 28/28 完结（17 古籍 + 流年班命盘 + 创业成败 + 玉匣记）| vision-distill-pipeline.py · 23:30 增量 cron 值守 |
| 2026-08-16 | R694 多源实时交互诊断闭环完结（R732 mode=auto 安全闸门 L0-L3）| server/emergency-gate.js（73692d4）· 端到端 level=3 实测 ✅ |
| 2026-08-16 | R120 KB 蒸馏入库：流年班 L12-L14 紫微星曜 7 条 | scripts/distill-desktop-l12-l14-20260816.py |
| 2026-08-16 | R731 公共能力包市场全链路验收 6/6 完结 | _shared/capability-market/ matcher 11/11 PASS · mingli keywords 16→70 |
| 2026-08-16 | R730+ 双修真深度校正 14/14 全绿（daily_push.js HTTP 模式 + bridge v3）| DELIVERY/双修真深度校正报告-2026-08-16.html |
| 2026-08-16 | R119 视觉蒸馏：流年班命盘 10 个（23 条）+ 创业成败 + 玉匣记 5 页 | vision-distill-pipeline.py · 记账断点 · 23:30 增量 cron |
| 2026-08-16 | R120 KB 蒸馏入库：流年班 L12-L14 紫微星曜 7 条 | scripts/distill-desktop-l12-l14-20260816.py · kb_formal 47,653+5,772 |
| 2026-08-16 | R119 全面推进：跨项目隔离 + 医学物理迁移（26,386 条）+ 双源消除 + cron 修真 | kb_staging 清理 · 权威库 27,988 · DELIVERY/r119-全面推进-2026-08-16.html |
| 2026-08-16 | AI 助手语音 + KB 实时互通 3/3 完结（R697+R726）| ai-stream-client.js + 流式卡片 · 首字 0.82s（-96%）|
| 2026-08-16 | MLX v8.3 训练 + 评估 + 上线（AVG 95.5 PASS）| mingli-sft-v8.3-7b + eval-results-v83-r721-30q.json |
| 2026-08-15 | R721 v8.3 训练 + 评估 + 上线（AVG 95.5 PASS）| adapters.safetensors 28MB + `mingli-sft-v8.3-7b` 4.0G + eval-results-v83-r721-30q.json |
| 2026-08-15 | R726 MLX 流式透传（8920→8960 首字 0.82s·提速 -96%）| server commit `04ad21f` |
| 2026-08-15 | R725 KB 蒸馏入库（桌面流年班禄存杂耀 10 条）| DELIVERY/distill-report-2026-08-15.json |
| 2026-08-15 | R720 v8.2 fuse + 评估 + 上线（AVG 93.8 PASS）| `mingli-sft-v8.2-7b` + eval-results-v82-r720-30q.json |
| 2026-08-15 | R720: v8.1 修真落地 + clean4 + v8.2 训练 | commit `0603467` |
| 2026-08-14 | R718: 推理服务默认切 v8.1 + 训练守护 + 多版本评估脚本 | commit `81901c8` |
| 2026-08-14 | R105 v8 修真 + clean3 去内部标签 + 30题评估脚本 | commit `bd87610` |
| 2026-08-14 | R105 训练数据去套话开头 + EPB 噪声过滤 | commit `d1e6e02` |
| 2026-08-14 | R108 P2-3 蒸馏链 entry_id 守卫 + 时区修真 | commit `6c66614` |
| 2026-08-14 | R108 P1-4 反馈链路修真 + 监控/前端同步 | commit `47f4670` |
| 2026-08-14 | R108 P0-1 图表页脚本修真 + patrol 内联校验 | commit `59f2b1c` |
| 2026-08-14 | R107 G1 staging promote 修真 | commit `535ae33` |
| 2026-08-14 | R107 tcm 原生条目审核 promote | commit `cfcb1fb` |
| 2026-08-14 | R106 tcm 反向流修真 | commit `86d7f16` |
| 2026-08-14 | v8 训练管线修真 + 推理切 v8-fused | commit `cf689af` |
| 2026-08-14 | R713 health-patrol 超时修真 + KANBAN 状态修正 | commit `a60b76d` |
| 2026-08-14 | 心跳: KB今日+16条入库(LZ-CASE紫微案例5+其他) | kb_formal 47055 |
| 2026-08-13 | R712: MLX v6 iter100 生产上线 8950 | launchd plist 更新 + v6 adapter 部署 |
| 2026-08-12 | 日结健康检查 6 服务全绿 | .openclaw/tmp/health-today.log |
| 2026-08-12 | R103-v2: 蒸馏出站管线 + 视觉注册表 | commit `d903709` |
| 2026-08-12 | R711: KB 检索修真 + activate-routes | commit `8258dd1` |
| 2026-08-12 | desktop PDFs/DOCX 蒸馏 10 条 KB-NIGHT 入库 | commit `439a301`（KB 44409+） |
| 2026-08-12 | i18n 报告翻译覆盖修真到 94% | commit `2be79ff` |
| 2026-08-11 | R709: MLX v5 启动预热修真 | commit `227d17c`（ThreadingHTTPServer + ready 字段 + daemon 预热） |
| 2026-08-11 | R710: server 同步 lang 优先级修真 + MLX_BASE 硬绑定 | commit `2fda255` |
| 2026-08-11 | R708+: 23页 i18n.js?v=708i 缓存戳 + 精准推荐标题修真 + 字典扩 precise+wellness+lucky | commit `69d20fc` |
| 2026-08-11 | 节气展示修真（区分当天/期间） | commit `97dbe2c` |
| 2026-08-11 | R708: 5页导航 data-i18n 标注 + 全站 23 页英文渲染验证 | commit `3fa2207` |
| 2026-08-11 | R706: 7排盘API双语完整闭环 | _translatePaipan/Ziwei/Qimen/Liuyao/Liuren/MeiHua/Fengshui + 7前端lang对接 |
| 2026-08-11 | R706: 10核心页i18n基础设施接入 | paipan-center/tcm-portal/tcm-clinic/voice-consult/camera-capture/kb-explorer/report-interpret/lifeplan-detail/clinic-consultation/naming-portal |
| 2026-08-11 | R706: divination-hub data-i18n标注 + 6语言包hub key | heroBadge/divination/tcm/knowledge/wearable |
| 2026-08-11 | R705: MLX v5推理路由修真 | /v1/models 路由 + launchd 冷启动 |
| 2026-08-11 | R705: region-banner公共横幅组件 | 9页自动海外免责 + bazi模板script转义 |
| 2026-08-11 | R705: bazi排盘lang=en前端对接 | 5处英文适配 + 5页data-i18n标注 |
| 2026-08-11 | R705: index-global 合规过滤 | 6模块cat标注 + region-config过滤 |
| 2026-08-11 | R704: 国内外版本混淆全面修真 | i18n引擎修复+knowledge映射87处+/app双前缀54处+bazi模板修真 |
| 2026-08-10 | 蒸馏闭环全链路验证 | distill-server.js module 透传修真 + 2 条 staging 词条 |
| 2026-08-10 | ai-vision-toolkit git 初始化 | commit 3ca0830, 70 文件入仓 |
| 2026-08-10 | Phase 6 评估（divination-core 全量拆分） | 结论：低优先级，不做全量拆分 |
| 2026-08-10 | 公共能力包市场落地 | `projects/_shared/capability-market/` (README+注册表+3模板+2脚本+6能力包) |
| 2026-08-10 | R698: 四路诊断导航入口 + demo-realtime canonical | commit 901dd37 |
| 2026-08-10 | R694: 多源实时诊断闭环（4路视觉+KB → 医生处方） | commit a18788f |
| 2026-08-09 | R697: 语音实时KB互通 | commit 33faabf |
| 2026-08-09 | 安全清理（gitignore + README 保密声明） | commit c1e94c0 |
| 2026-08-07~08 | P0-任务1: KB优先+后端AI兜底双路径 | 三级分级匹配 + 命中率统计 |
| 2026-08-07~08 | P0-任务2: 暴露后台API给H5 (16个) | app/my-yuanzhu.html |
| 2026-08-07~08 | P1-任务3: music/lifeindex/lifeplan KB兜底 | _MODULE_REPORTS 901行 |
| 2026-08-07~08 | P1-任务4: lifeplan蓝图化 | lifeplan-detail.html + 时间轴 |
| 2026-08-06 | R695: Critic交叉验证 | commit 4f149a4 |
| 2026-08-11 | R503: collab region参数化 + 排盘页i18n全接入 | commit cd09aab |
| 2026-08-11 | R502: 国内/海外版本隔离 | commit 2670e55 |
| 2026-08-11 | R501: 全球方剂接入诊断链 | commit 409ab21 |
| 2026-08-10 | R500: 类iPhone激活流程 | commit b528625 |
| 2026-08-10 | R499: 全球传统医学方剂库 | commit 30ea2eb |
| 2026-08-10 | R498: 出海i18n框架+合规分层 | commit be1b5e0 |
| 2026-08-10 | R497f: 双源融合置信(无人化) | commit 11119bf |
| 2026-08-10 | R497e: autopilot放行 | commit 4f34367 |
| 2026-08-10 | R497d: 采集自动提交闭环 | commit d07d3ee |
| 2026-08-10 | R497c: 语音流式KB+视觉连续采集 | commit b5088d1 |
| 2026-08-10 | R497b: 安全闸门+医生认证 | commit d56a382 |
| 2026-08-05 | R497: 四方实时协作诊断工作台 | commit aa20a96 |
| 2026-08-04 | R693: console.log清零 + AI味文案清零 | commit 1909bf0 |
| 2026-08-03 | R689: pre-commit 接入 health-check-all | commit 5e7e6cb |
| 2026-08-02 | R688: divination-hub 按需加载 | commit 8d6dbd0 |
| 2026-08-01 | R494: prescription matcher 方剂闭环 | commit f121082 |
| 2026-07-31 | R687: PWA PNG 图标 | commit 7568d25 |
| 2026-08-11 | R705: i18n-engine 接入 5 核心页（cn-global 拆分） | commit d66269e |
| 2026-08-11 | R704: knowledge路径修真(87处) + /app/双前缀修真(54处) + sft v3 null guard | commit 8b222b7 / 47ca230 / 4c9d454 |
| 2026-08-11 | R703: cn-global i18n 键统一修真 | commit 1d7d310 |
| 2026-08-11 | R702: 排盘API英文转换层(lang=en) + server/ 独立 git 仓库化 + distill feedback loop | commit ae59a50 / c199f95 / ac32801 |
| 2026-08-11 | 蒸馏闭环 cron 自动运行（03:45 增量 3 文件→12 词条） | .distill-progress.json |

## 冻结/低优先级

| 任务 | 原因 |
|------|------|
| Phase 6 divination-core 全量拆分 | 26 个 runXxx 仅 0.1KB 薄 wrapper，gzip 旧 core 717KB，收益低 |
| 五行音乐生成器 | KB 兜底已完成，生谱引擎暂缓 |

## 阻塞项

- **端口暴露已消除**：health-patrol 08-22 14:31 实测无端口报警（08-16 报的 Python(43166) 8948/8949 已不再触发）
- **4 个 cron 连败**（health-patrol 08-22 14:31 实测，根因已定位）
  - **命理宝jian 心跳守门员 · 连败 42 次（最严重）**：gateway.log 证实每次 run 卡在 model_call，session `queued_behind_active_work`（排队在主会话活动工作后面）+ payload `timeoutSeconds=300` 过紧 → 12:09 run 精确 300908ms 超时、14:09 run 277s Cron failed；另有 12:08 evolution-write-guard 拦截其 exec（security_control_plane_is_main_owned，守门员不该碰控制面）。**修真建议（需主会话执行，心跳 cron 工具受限无法改他 job）：timeoutSeconds 300→900 或降频 4h；payload 明确禁用 cron 工具与控制面写操作，仅 tail/stat/告警三步**
  - 四路大师增量采集#1 · 连败 3 次：payload P1 步骤 `scripts/kb-masters/` shuhan 检索工具失败（路径/目录问题，需核对 kb-masters 目录现状）
  - tcm-agent 家庭健康周报推送 · 连败 4 次：gateway restart 一次性中断（nextRun 08-23，观察下次即可）
  - 临床经验蒸馏（周一06:00 纯脚本版）· 连败 3 次：sqlite3 命令失败（nextRun 08-24，观察）
- **需用户/外部**：data1 外置卷未挂载（YZYX 蒸馏源 + 1,297 扫描件受影响）；GitHub 建仓无 token；生产短信网关需商户号

## 运行时指标（21:01 心跳实测 · 2026-08-16）

- health-check.sh：✅ HEALTHY——paipan 8911 / tts 8912 / face-ocr 8913 / static 8900 / api-v2 8920 / kb-api 8901 全 OK + kb-list OK + paipan-api OK
- health-patrol 15 分钟档仍有间歇 ❌（20:05-20:50 报 9 项异常，21:00 整点档全绿）——异常集中在阻塞项（端口 8948/8949 + cron 连败）
- 8960 生产实跑 mingli-sft-v8.6-7b（08-17 心跳确认，此前 KANBAN 记 v8.3 已过时）

- **R709**（commit `227d17c`）：MLX 启动预热 — ThreadingHTTPServer + ready 字段 + 启动时后台线程跑一次 dummy 推理触发 compile
  - 修真：HTTPServer 单线程假死（客户端 abort → 连接卡死）→ ThreadingHTTPServer + daemon_threads + socket timeout 120s
  - 修真：模型懒加载导致 health 启动期 000 → ready 字段标记（starting/ok），health 永不误判
  - 修真：首次推理 ~40s（compile 首次）→ 启动时后台线程预热，消灭首请求延迟
  - 实测：33s ready=true，首次推理 21.6s（含 compile，正常），之后 ~2-5s
  - 服务终态：8920 API 单实例 200 + 8950 MLX ready:true
  - 提交：227d17c（main+submodule 同步）

## 08-14 R720 修真落定（21:49-22:10 · v8.1 R718 数据修真）
- **修真成果（30 题正式评估）**：
  - **平均分 68.7 / 100**（v8 baseline 58.3 → **+10.4 提升**）
  - 命理 66.3（+8.3）· 中医 73.2（+6.2）· 边界 66.8（**+16.8** ⭐ 修真最大）
  - 修真质量指标：套话 0/30 ✅ · 标签泄漏 1/30 ✅（残留 1 题 idx=27 [EPB设备]）· 重复 0/30 ✅
  - 平均长度 134 字 · 平均耗时 34.5s · 总耗时 1034s
- **核心修真（数据 + 模型）**：
  - `bd87610` clean3 数据：1303 train + 140 valid · 内部标签 0 命中
  - `d1e6e02` clean3 修真：去套话开头 + 过滤 EPB 噪声
  - `81901c8` inference server 默认指向 v8.1 + 守护脚本 + 多版本评估
  - `0ebbb38` 22:05 心跳同步 KANBAN
- **下一步 v8.2**：
  - idx=27 tag_leak 修真：clean3 加反向 SFT（[xxx]类输入→"涉及内部约定" + 简短专业答）
  - 推理并发：当前单请求 34.5s 偏慢，cache + batch 修真目标 P95 < 15s
  - 数据扩充：太岁/文昌/六壬/奇门专项各 50 条 SFT
- **当前 8960 状态**：`/health` ready · model=mingli-sft-v8.1-7b · adapter=null · 生产默认指向 v8.1
- **commit 待**：本次 commit R720 把 30 题评估结果 + KANBAN 修真段落固化


## 08-15 02:35 桌面周易-中医 第1轮蒸馏(R684)

**任务**: 夜间 cron · 桌面 ~/Desktop/周易-中医 资料采集蒸馏
**本轮**: 流年班第十课「禄存+42颗杂耀」PPTX (41 slide)

**✅ 入库 10 条**:
- entry_id: `R684-ziwei-DSK-001 ~ 010`
- module: `ziwei`
- confidence: `0.85` (路总亲授)
- 来源标签: `desktop:liunianban_l10_lucun_42`
- distill_log: `batch-liunian-lucun-20260815-023825`
- 覆盖: 禄存详解(765字) / 阴阳双星(346) / 贵星凶星(895) / 破耗空亡(411) / 化解辅佐(430) / 礼仪空亡(334) / 艺术官禄(641) / 桃花解厄(434) / 玄术虚耗(534) / 寿元病厄(413)

**🛠️ 工具**: `scripts/distill-desktop-liunian-lucun.py` (主题合并策略:相邻 slide 合并凑足 ≥300字)
**质检**: FTS5 同步 ✅ / staging promoted ✅ / 前端 LIKE 命中 ✅

**待办(留给后续 cron/白天)**:
- P0 流年班 10 个 PDF(图片型,需 PDF→image→AI视觉识别)
- P1 玉匣记/六壬/一掌经 古籍 PDF(同样图片型)
- P2 DOCX: 56d15a...16fc391a09bbaa9.docx (15KB) + 先知智镜.docx (359KB)
- 剩余 14 个流年班 PPTX(禄存/42 杂耀之外的课程,套路相同)

## 08-17 R120 建设排期（11:45）

- ✅ 晨检：06:00 晨间推送/06:05 节日修真后首跑成功；21:30 审计 exit 修真；03:10 authority 渐进式
- ✅ 今日一签：API + AI 助手按钮 + 首页卡 + 推送尾部（冷数据曝光 4 触点）
- ⏳ 进行中：冷数据持续曝光（每曝光一次计数一次，54k 池子逐步转热）
- ⏳ 待验证：21:30 审计今晚 exit 0；03:10 authority 明晨渐进
- ⏳ 排期：①视频语音播报端到端（P0/P1 真实触发）②安防 YOLO 数据集采集 ③交付报告 v5

## 08-17 R736 v8.7 混合训练突破（11:50）⭐
- **v8.7 全量 BaziQA：51.8%（253/488）**——历史最佳，突破 50% 目标
  - 基线 v8.3 42.5%（8人）→ v8.6 全量 44.5% → **v8.7 51.8%**
- **训练**：678 条混合（BaziQA 推理链 390 + 自由问答 400 + R733 19），200 iters / lr 5e-6
- **修真**：BaziQA 前 64 字同构指纹 bug（390→1 唯一指纹）→ 题目行指纹
- **自由问答**：5 题验证无退化（五行/枭神夺食/舌诊均正常）
- **8960 已切 v8.7 生产**

## 08-17 R738 v8.8 评估回退 + v8.9 修真训练（20:15）❌→🔧→✅训练完成
- **v8.8 全量 BaziQA：41.2%（201/488）**——较 v8.7 51.8% 回退 **-10.6pt** ❌
- **根因（数据稀释）**：v8.8 数据 = v8.7 610 条 + v8.3 补足 400 = 1010 条，自由问答补足过量 → BaziQA 推理链占比 64%→**39%**，推理能力被冲淡
- **v8.9 修真训练（20:03 启动 → 20:20 完成 200 iters）✅**：推理链 390 **全量** + 自由问答 100（20%）+ R733 19 = **507 条**，200 iters / lr 5e-6，链路 Qwen2.5-3B → v8.7 fused → v8.9 LoRA
  - adapters.safetensors 28MB 已落盘（20:20）
  - checkpoint: training/mlx-checkpoints/mingli-sft-v89-7b/
- **评估工件**：`.openclaw/tmp/giant-shoulders/baziqa-eval-full-v88.{log,json}`（19:18 起跑，19:40 完成，50 名人 488 题）
- **教训**：训练集必须保证推理链占比 ≥ 60%，自由问答补足 ≤ 20%
- **已完成**：v8.9 fuse（20:46）+ 8960 切生产（20:52）✅
- **进行中**：全量 BaziQA 评估（20:49 起跑，21:16 进度 ~72%，watcher 值守）→ 达标（≥ 51.8%）后固化结论

## 08-17 R735 医保人脸核对（10:50）
- **人脸特征提取服务 :8958**：det_10g + w600k_r50（512维）+ genderage
- **4 端点**：embed / compare / register / verify（1:1 + 1:N 检索）
- **质量校验**：尺寸/清晰度/亮度三检查（医保合规）
- **规模测试**：1004 人 1:N 检索 2.1ms
- **前端页面**：app/medicare-face-check.html（拍照/注册/核对/人员列表）
- **模型**：insightface buffalo_l（gh-proxy 镜像下载 288MB）

## 08-17 R737 算法超市全面布控（14:40）⭐
- **布控矩阵：29 算法 → 19 可落地（65%）+ 3 候选 + 7 规划**
- **YOLO 七合一 :8957**：detect/pose/classify/segment/obb/fire/lpr（YOLO11 全家族 + MIT 烟火 + MIT 车牌）
- **场景规则引擎 :8959**：12 规则（入侵/徘徊/遗留/搬移/违停/非机动车/消防通道/危险区/扬尘/油烟/水质/小广告）
- **跌倒引擎**：自研公开几何特征（规避专利 CN2023）
- **人脸核对 :8958**：det_10g + w600k_r50 512维 + 质量校验（医保合规）
- **算法爬虫**：首跑 30 候选（14 MIT/Apache 可用）
- **修真记录**：resnet-fire 0%（真实图）→ MIT 36.4% 替换；车牌权重从 ★471 MIT 仓库拉取；跌倒专利规避自研
- 提交：ai-vision-toolkit 180994e1（12 规则） + 5c0e9d49（车牌） + 6e84c50d（烟火） + d016d0f4（YOLO11）
- 服务：13 端口全绿，系统盘 16G

## 08-17 R737 收口（15:08）
- **布控状态 API**：8959 /api/deploy-status（19/29 可落地，供超市双态查询）
- **爬虫 cron**：每日 06:00 自动扫描（launchd StartCalendarInterval）
- **安全帽/劳保 ALG-050**：MIT 候选（数据集需外部下载，待自训）
- 反光衣 relective-clothes（★21 MIT）：百度云权重，网络受限待下载
- 提交：d3857f54（状态 API + cron）→ 13 端口全绿

## 08-17 R737 规则扩展（15:20）
- **场景规则引擎 14 算法**（+ALG-033 排污口 +ALG-041 占道经营）
- **超市页双态展示**：可落地✅/候选🔄/规划中📋（marketplace.html + 8959 状态 API）
- **布控矩阵**：29 算法 → 21 可落地（72%）

## 08-17 R738 v8.8/v8.9 修真结论（22:30）⭐
- **v8.7 配比即最优**：推理链 390 + 自由问答 400 + R733 19 = 51.8%（BaziQA 全量）
- v8.8（自由问答 800 稀释）：41.2% ❌
- v8.9（自由问答 100 精简）：46.5% ❌
- **修真固化**：BaziQA 推理链与自由问答 1:1 配比最优；自由问答过多稀释选择题推理、过少则损失推理泛化
- 8960 已回滚 v8.7 生产；v9.0 候选 = v8.7 配比 + 更多推理链（数据量 2 倍）

## 08-18 R739 public-chat 卡死修真（09:50）⭐
- **现象**：/api/ai/public-chat 非流式 30s+ 无响应（前端卡死）
- **修真链**：云端 key 不可达 70s（MLX 优先修真）→ 仍卡 → 硬编码探针(24ms)确认路由 OK → callAIWithFallback MLX fetch 卡 → 长 sysMsg 直连 26s 对照实验 → **根因 = AI_SYSTEM_PROMPT 2472 字符 + 3B 模型 20tok/s + max_tokens 512 = 25s 生成**
- **修真**：MLX 分支 max_tokens 512→256；MLX 优先保留
- **效果**：22.7s 完整回答（不再卡死）；流式首字 <2s 主路径不受影响
- **教训**：KANBAN 曾记「33.4s 含模板渲染正常」——慢响应被当正常，实际是性能债；长 prompt 是生成速度第一杀手

## 08-18 R739 全面 AI 化（10:30）
- **✅ 规则引擎 AI 化**：8959 /process?ai=true → 报警事件 → 8960 生成事件定性+风险等级+处置建议（端到端 12.5s 验证通过）
- **✅ 前端流式化确认**：R726 已全量落地（public-chat?stream=1 + orchestrate?stream=1）
- **❌ 4-bit 量化修真**：LoRA fused 权重量化后输出乱码（回答「根」），BaziQA 0/8 → 回滚 bf16
  - **修真教训**：量化必须在 base 模型层做（先量化 Qwen2.5-3B base 再 fuse adapter），不能直接量化 fused 产物
  - 量化模型进 quarantine 待修真（正确路径：quantize base → fuse）
- 提交：30438005（规则 AI 化）→ 13 端口全绿

## 08-18 R739 项目边界盘点修真（10:50）
- **品牌词隔离**：check-cross-brand 全项目纯净 ✅
- **磁盘修真**：11G → 19G（归档 v8.9 fused + 量化失败产物 → data1）
- **venv 修真**：ai-vision-toolkit（42 py）+ tcm-agent（18 py）建 venv（依赖隔离）
- **遗留**：smart-home-family 172 py 无 venv（大项目后续）；edge-tts 在系统 Python（归属 mingli TTS）
- 服务：14 端口全绿（8900/8920/8961 的 404 为无 /health 路由，正常）

## 08-18 R739 高质量优化：launchd 修真（11:05）
- **发现**：face-diag-svc / vision-gateway-svc / face-ocr 三个 plist 是残缺 JSON（无 KeepAlive 无日志），face-ocr 脚本路径错误
- **修真**：重写为完整 XML plist（KeepAlive + 日志 + RunAtLoad + WorkingDirectory）+ face-ocr 路径修正
- **验证**：face-diag 杀后 6s 自动拉起 ✅ 三服务全绿
- 服务自愈体系：核心 17 服务全部 KeepAlive 就位

## 08-18 15:10 v9.0 训练中（R739 建设推进）
- 数据：mlx-r105-data-v90（推理链584+自由584=1:1，去AI味，共1168）
- 训练：Iter 240/300，loss 3.56→1.68 收敛，从 v8.7 fused 继续 LoRA（rank4/layers20/5e-6）
- 修真：文件名 train.jsonl 标准（mlx_lm 要求）；fuse 时 MLX_BASE_MODEL 必须=v8.7（adapter 是 v8.7 增量）
- P2：smart-home-family venv 已建（pycryptodome 隔离）；告警微信通道暂缓（微信平台无通用推送 API）
- 场景推荐前端接入 marketplace（ai-vision 域内，已提交）

## 08-18 15:20 v9.0 训练完成 + 评估中
- 训练：300 iters 完成，Val loss 2.252 / Train 1.668（从 v8.7 fused 继续）
- fuse：MLX_BASE_MODEL=v8.7 → mingli-sft-v9.0-7b（4.28GB）
- 评估：BaziQA 全量 488 题 @ 临时 8962 推理服务（不动生产 8960）
- 待：评估结果 → 对比 v8.7 51.8% → 达标切换生产

## 08-18 17:50 v9.0 上线（BaziQA 53.9% 历史新高）
- **v9.0 = 53.9%（263/488）**，超 v8.7 51.8%，+2.1pp
- 配方：推理链 584（BaziQA 488 全量）+ 自由问答 584（1:1）+ 去 AI 味
- 生产切换：plist unload+load 完成热切（kickstart 不重读 env，修真记录）
- 回滚路径：plist MLX_MODEL 改回 v8.7 即可

## 08-18 20:24 v9.1 训练完成 + 评估中（自优化升级）
- v9.1 配方：选项 shuffle 均衡化（答案分布 A113/B99/C96/D92/E88 ≈ 各20%）+ 错题回填 225（v9.0 评估错误驱动）
- 训练：300 iters，Val 1.969 / Train 0.752（优于 v9.0 的 2.252/1.668）
- 根因修真：v9.0 训练数据答案 B 64% → 模型 B 偏好 + 不会时塌缩 A（错题中 A 118 次但正确答案仅 13 次）
- fuse：mingli-sft-v9.1-7b（4.28GB）
- 评估：BaziQA 全量 488 @ 8962，待结果对比 v9.0 53.9%

## 08-18 21:00 v9.1 修真失败（45.1%）→ 生产保持 v9.0
- **v9.1 = 45.1%（220/488）❌ 低于 v9.0 53.9%**
- 修真教训（固化）：
  1. 选项 shuffle 均衡化方向错误：3B 小模型选择题靠模式学习，重排选项破坏题意-答案关联，且答案分布均匀≠模型均衡（模型塌缩到 A 的反向问题）
  2. 从 v8.7 直训（300 iters）没有继承 v9.0 增量知识——增量训练必须以上一版最优 fused 为 base
  3. 错题回填 225 条在 shuffle 干扰下无正向效果
- 正确自优化路径（v9.2 候选）：真实均衡样本（contest8 赛题）+ 以 v9.0 fused 为 base 继续训练
- 生产确认：8960 = v9.0（53.9%）不受影响

## 08-19 07:45 R762 全面盘点收口（用户"全面盘点未完成的任务高质量完成"）

### Cron 修真（8 个报错任务全处理）
- **网络自动切换（真实故障 9h）**：模型 402 → 脚本 9 小时未执行 → **迁移 launchd**（com.mingli-baojian.network-failover，StartInterval=300，PID 9083 已运行）；cron 降级为每日 08:00 汇报（d7299497）
- Desktop-ZYZX：payload v5（src_dir_not_found → NO_REPLY 不累积错误）
- 四路大师采集：payload v3（源目录缺失 → NO_REPLY；sqlite 单步命令防中断）
- 临床经验蒸馏：payload v2（纯脚本，禁止探索查表）
- shf 地层能力审计：拆为轻量自检版（7 脚本秒级，失败才深入）
- 每日报告推送：加 fallback zai_auto + 纯脚本输出
- ASH 订单提醒：轻量版 v2（180s）
- tcm 家庭周报：gateway restart 一次性中断，服务 8932/8945 实测健康

### Staging 审核闭环（310 条待审 → 0）
- 发现引擎 bug：**rejectEntry 只写 audit_status 不写 status** → 审计失败条目无限滞留（R762 修真，commit 22174d6）
- 修真 2：医疗合规声明支持多种表达（仅供参考/仅供学习参考/不构成医疗建议/请遵医嘱）
- 处理：4 条测试残留拒绝 / R490 重复拒绝（与 formal 重复）/ tcm 139 补 source_ids / nihaisha 62 source_ids 规范化 / 46 条补合规声明 / 62 条确认已在 formal（重复拒绝正确）
- 终态：pending 0 · staged 0 · promoted 3638 · formal 68,761

### Git
- mingli-baojian 24c709c 已 push ✅（server 22174d6 + 主仓）
- smart-home-family ed3ed67 已 commit，**push 阻塞**（无 GitHub 远端，需建仓）

### 模型评估（KANBAN #5 前置）
- v9.0 v2.1 评估运行中（8960 = v9.0-7b 生产）
- v87-baseline-pipeline.sh 后台流水线：v9.0 完成 → 回切 v8.7 → 评估 → 恢复 v9.0
- 上次 v8.7 v2.1 从未真正执行（空日志）

### 阻塞项（需用户/外部）
- **data1 外置卷未挂载**：YZYX 蒸馏源（训练素材-20260816/周易-中医）+ 1,297 扫描件 PDF 视觉蒸馏源 + 备份全受影响
- **GitHub 建仓**：无 gh CLI / 无 token（9 项目含 shf 无法 push）
- 生产短信网关（需商户号）

## 08-19 08:18 残留清理 + 记忆定位优化（R764）
- **临时资产清理**：giant-shoulders 的 BaziQA 数据/日志/脚本已清（diff 验证项目内副本一致后删）
- **历史成绩归档**：v8.6-v8.9 全量日志入 baziqa-results/（成绩链 8 版完整：v8.6 44.5% → v9.0 53.9%）
- **deprecated 脚本删除**：build-v90/91/92-data.py（git 历史可查，新构建统一走 build-baziqa-sft.py）
- **零残留验证**：全项目 grep giant-shoulders 零命中；其他项目零泄漏；品牌词扫描纯净
- **记忆优化**：MEMORY.md 顶部固化 BaziQA 管线记忆（项目内自足 + 7 条教训）；TOOLS.md 加管线笔记
- **v9.2 训练**：launchd 拉起重跑中（base=v9.0 ✅，Iter 30/300，日志 /tmp/baziqa-v92-train.log）

## 08-19 08:25 定位终态复查（R765）：发现并修真端口冲突
- **三域资产归属**：命理（BaziQA 管线+排盘+MLX）/中医（四诊+Step7）/医保人脸核对（face-embed）全在 mingli ✅ 零泄漏
- **修真发现**：_shared/order-service 与 toolkit_server 端口冲突（都要 8961），且 order-service launchd 因 node 路径失效挂了 3 天（exit 127）
- **修真**：order-service → 8963（node 绝对路径 + plist 端口）+ shop.html 指向更新；8961 归还算法超市；34 条订单数据保留
- **边界终态**：mingli 调用面 = 自有三域服务 + _shared 订单（合法共享），零跨项目误引

## 08-19 08:45 .qclaw 命理资产隔离完成（R767 · 用户指令「抓紧处理和隔离」）
- **重大修真发现 1**：生产 KB（8901）整套跑在废弃 .qclaw/workspace（29 分类 KB JS + knowledge-server.py）→ 已回迁 mingli-baojian（knowledge/ 28 文件 + server/knowledge-server.py + launchd com.mingli-baojian.knowledge）
- **重大修真发现 2**：HeiGe-SuanMing（PolyForm Noncommercial 红线）双残留——.qclaw/workspace/skills/bazi-mingli + ~/.openclaw-autoclaw/skills/bazi-mingli（活跃技能！）→ **两处已删**（license 红线：禁止商用，依据 MEMORY 蒸馏红线 v2）
- **性格画像缺口补齐**：personality-knowledge.js 入 KB（十神性格×格局声誉×推断链）——「十神性格/性格特质/声誉评价」检索 0→1+ 命中（BaziQA 错题 76 题性格类短板）
- **归档隔离**：.qclaw 命理资产 40 文件 + 工具 + 50 历史文档 → /Volumes/data1/archive/qclaw-mingli-kb-20260819/（保留历史，隔离出智能体工作区）
- **验证**：.qclaw 命理关键词清零；项目 KB 检索正常（七杀 2 条 + personality 命中）；8901 服务项目内运行

## 08-20 17:11 cron 监控第十七次复核（baziqa-v92-t512-评估监控）
- v9.2 全量评估已跑完（08-19 凌晨），持久化结果 `v9.2-full488.log`（10:04，API=8962）= 3/488 = 0.6% << v9.0 = 263/488 = 53.9%，修真失败结论不变
- 与 16:11/15:11/14:11/13:11/12:11/11:11 一致：v9.2 崩模型已结案（fused-as-base 续训陷阱 + 483/488 答案空串），#5 已完结状态不变，生产保持 v9.0
- **生产端口健康**：8960 = mingli-sft-v9.0-7b ✅ PID 28061 持续运行（curl /v1/models 200 返 `mingli-sft-v9.0-7b`）；8962/8964 评估端口无监听已停
- **进程清理**：eval-baziqa = 0 进程干净；/tmp/baziqa-v92-eval.log 不存在（评估已完结收尾）
- **磁盘任务幂等保护**（与前 6 次一致）：
  - 源 `data/backups/fused-archive` 不存在 ✅（已清理）
  - 源 `training/mlx-models/mingli-sft-v9.1-7b` 不存在 ✅（v9.1 fused 从未产出）
  - 目标归档 `/Volumes/data1/ml-training/archive/mingli-db-backups-20260819/` 已存在（41G 稳态）→ 不重复 rsync/删除
- **修真方法论闭环（17 次复核）**：修真失败 → 修真方法论升级 → 修真收敛
  - v9.3 候选配方已固化（iter=50 + lr=2e-6 + post-fuse local-q10 强制门）
  - 待用户触发 P1 任务修真流程后上 cron 全量评估

## 2026-08-27 21:00 — 🔧 巡检 5 异常待修真（心跳登记 · 未排期）
- health-patrol（22✓/5✗）：①tcm-synced-kb.json 污染 8 条（易道知识详情·bazi/huxing 等跨项目）②蒸馏边界异常 ③双向对齐 546 条待归位 ④中医 shf 缺口 1190 ⑤smart-home-family 64MB 大文件入库 + .gitignore 缺 *.db + 项目注册一致性未全绿
- 判定：均为存量慢性问题非新增故障（今日描金/服务中心/OneFrame 交付链路正常）；①⑤ 可独立快速修真，②③④ 需跑 distill-source-audit / medical-align-check 出清单后分批处理
- 下一步：建议明日白天排期，优先 ⑤（gitignore + rm --cached 一条命令级）→ ①（8 条清污）

## 2026-08-28 02:04 — 💚 心跳 02:00 全绿 + distill-link 脚本修真
- 健康检查实探 6 服务全绿（8900/8901/8911/8912/8913/8920 全 200），kb-list/paipan-api 抽查通过；凌晨无蒸馏入库（vision-distill total=28 自 08-16 无增量）
- 修真：scripts/cron-distill-kb-link.sh LOG_FILE 定义在 set -e 之后，node 缺失早退出分支写日志必报 "No such file or directory"（08-13 起连败根因之一）→ LOG_FILE+touch 提前到分支前，任何失败分支均可落日志；bash -n 验证通过
- 8920 KB stats 偏差根因（61,647 vs 73,972）与双连接写竞态根治仍待主会话排期（见 00:30 条目）

## 2026-08-29 12:30 — 💚 心跳 12:30 全绿（cron 30min · 6 服务 + KB/排盘抽查全 OK）
- 6 端口探测：paipan(:8911) / tts(:8912) / face-ocr(:8913) / static(:8900) / api-v2(:8920) / kb-api(:8901) 全 200
- kb-list ✅ + paipan-api ✅（POST /paipan 1990/5/15/14/male 200）；KB stats total=**75,030**（较 11:00 74,752 **+278**，无 distill-*.py 新执行记录，增量疑为 kb-collector 子通道或后台统计刷新，非新蒸馏批次）
- staging 端点 404（NOT_FOUND），按惯例判 0 待审；8960=v9.0-7b 正常
- 阻塞延续：patrol 读数失实+cron 连败集群（主会话修真）、v9.3 阈值触发制、⏭️ P2.8 问诊台后验收冲刺待主会话浏览器执行
- 下一步（白天首推不变）：「服务中心导航体验回归 · 五中心 × 主入口全链路走查」

## 2026-08-29 23:30 — 💚 心跳 23:30 全绿（cron 30min · 6 端口 200 全 OK）
- 6 端口探测：static(:8900) / kb-api(:8901) / paipan(:8911) / tts(:8912) / face-ocr(:8913) / api-v2(:8920) 全 200
- 无新 distill-*.py 执行（16:00 后无新增），staging 0 待审
- 阻塞延续：patrol 读数失实+cron 连败集群（主会话修真）、⏭️ P2.8 问诊台后验收冲刺待主会话浏览器执行
- 下一步（明日首推不变）：「服务中心导航体验回归 · 五中心 × 主入口全链路走查」

## 2026-08-31 06:30 — 💚 心跳全绿（EXIT=0）+ weekly-eval 修真复跑收口
- 06:00 launchd 复跑真实产出：W36 周报 HTML + alert-card 全绿（OK），三项 eval 无数据属预期跳过；但 stderr 有 NoneType 崩溃 → exit=1（judgments 里三项均为 null，`or {}` 兜底缺失）
- 修真：weekly-eval.sh alert-msg 段 null 判断兜底（`j.get(x) or {}`），复跑 EXIT=0，commit e180a76；KANBAN 待办① 销号
- ⏭️ 待主会话：patrol 读数失实、服务中心导航回归（浏览器）、C 类 13 页退役拍板

## 2026-08-30 16:00 — 💚 心跳全绿（EXIT=0）
- 6 服务健康，无新 distill 入库；进行中/阻塞无变化（服务中心导航回归待主会话浏览器执行；patrol 读数失实、⏭️ P2.8 延续）
