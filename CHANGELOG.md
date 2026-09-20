## 2026-09-20 11:30 · R821 全面诊断+修复：无ID行修复401+幽灵行+R804钩子断链二连修

- **全面诊断快照（07:32 起）**：服务 7 端口全绿（8900-8960）；主表=fts5 曾差 407；ahead 13 未 push；09-19 体系浇筑日（宪法v3.1/任务板14项/R805-R820 化解库种子+道场库+推送强化链）产出集中落 server 子模块。
- **401 条 tcm-syndrome 无 stamp 行修复（重要）**：09-18 18:03~09-19 20:17 窗口入库的 tcm-syndrome 批次全部缺 entry_id/src_id/时间戳（写入方字段不全），致 fts5 join 失败漏索引、promoted_at 不可考。补 KB-SYND-<hash> ID + SRC-BOOK-018 溯源 + 时间戳（修复脚本事务级重放，实况确认已在 10:53 由并行进程完成 stamp，本机复核无残留）。
- **fts5 幽灵行 1 条清除**（entry_id NULL 行 join 遗留）+ 7 条缺索引补插（r491-meta-* 元数据行）→ 主表=fts5 精确一致。
- **R804 钩子断链二连修（防再发收口）**：①今晨 03:30 钩子实跑但 $PROJECT_DIR 在脚本上下文为空 → /scripts/ 路径不存在 → 补账静默失败（log 留证）——改绝对路径固化；②滞留 17 条（0919/0920 两批蒸馏）全部补账入库（yangsheng 9 / bazi 4 / huangli 5 含 3 短条按门槛拦截）；5 条 UNIQUE 幂等冲突实证拦截正确。全部 28 条蒸馏终账清零。
- **红线4 最后 1 条补源**：KB-LU-YY-SHENZHI-001（甪庸堂商业规划条目）补 SRC-BUSINESS-PLAN-20260919。
- **hua-jiehu 12 条种子字段规整**：title 空（标题在 content 首行）由 --normalize 规整 summary/tags；化解三要素结构完好（类别/方法/依据）。
- **终态**：主表=fts5=316,783；五红线全绿；health-patrol 全绿（411 块）；任务板 T1（八字补库5000）查实现状 bazi 599+子平系 1821+穷通 886 条在库，缺口仍在按 P0 继续推进。
- 待办移交：ahead 13+ 本轮提交一并 push。

## 2026-09-18 18:20 · R804 蒸馏断链排查+补账 13 条 + 断链防再发钩子

- **排查发现**：夜间蒸馏落盘（kb-web-distill/distill-*.jsonl）与主表入库存在断链——09-17/09-18 两批 28 条蒸馏中 14 条从未入库（指纹法逐条比对实证）：09-17 xingming 整批 5 条 + bazi「子平取格以月令为纲」、09-18 全批 8 条滞留盘上。R795/R797b 记录的入库数只覆盖当时工作集，落盘→入库无自动衔接。
- **补账 13 条入库**（scripts/distill-backlog-ingest.py，五红线全检：分域长度门槛 60/100、主题锚点、全库指纹幂等、entry_id=KB-WD+module|content 哈希、SRC-WEB-DISTILL/trust 0.6）：xingming 9 条（五格剖象/三才/81 数理体系，域 62→71）、yangsheng 4 条（白露/秋分养生，域 25→29）。另 1 条与 09-17 同文重合按红线3 幂等跳过（标题同、内容同）。
- **误杀复核**：6 条 huangli「无锚点」跳过经逐条复核为锚点词表覆盖不足（黄道/建除/择日/时辰为正宗黄历术语）——词表已扩；该 6 条实为 09-17 10:16 早已入库（Kimi 时代批次），指纹幂等正确拦截，无实际遗漏。
- **断链防再发**：cron-distill-kb-link.sh 增 R804 尾钩——每日 03:30 蒸馏后自动跑 distill-backlog-ingest --days 2 + kb-sync-guard --sync 48，落盘 jsonl 不再滞留。
- **终态**：主表=fts5=316,454；kb-quality-patrol 五红线全绿；health-patrol 全绿（411 块）。构建期 2 次 database locked（busy_timeout 8s→30s 加固）+UNIQUE 幂等拦截均自愈，无脏数据。

## 2026-09-17 16:35 · R797b 优化提升：养生域第二批+KB质量三修+faith孤品归档（WO-001 续）

- **养生域 KB 第二批 +20 条（yangsheng 5→25）**：从库内经典源（素问四气调神/上古天真/藏气法时等 8 部经文义理）再蒸馏 20 条 50-150 字口语化条目（scripts/yangsheng-batch2.py，SRC-CLASSIC-RE-DISTILL-20260917 / trust 0.6 / 五红线全检+指纹幂等），kb-sync-guard --sync 对齐。
- **KB 质量三修**：①乱码 30 条修复（--fix-mojibake，latin1→gbk 链还原）②红线4 真无出处 34 条补 src_id（tcmfwd 镜像可溯源映射 SRC-TCM-MIRROR-REMAP）③同文重复 30 冗余行清除（--dedup）——五红线复验全绿。
- **faith-deities-detail.js 孤品归档（KANBAN 软待办④定性收口）**：全站零 script 引用（grep 实证，头注所述 divination-hub.html 实为跳转壳页），数据已被 KB faith 域收编（260 条）；归档 archive/knowledge-orphan-20260917/，kb-config 登记 level=archived，kb-audit.html 假登记行同步删除（防审计页假数据）。
- **tcm-import 链 EPERM 复发处置**：G25 OCR 批次镜像（09-16 重写）触发 mtime 幂等导入，手动复跑遇扫描窗口 EPERM（R754 已知窗口期），重试后 CHAIN_RESULT rc=0、parity 归零；批次 65,210 条全为 g25-ocr 可溯源（trust 0.55 tcm 侧已降权）、域门禁核验零越界，主表=fts5=316,441。
- **W38 feedback-aggregator 复测通过**（KANBAN 软待办③收口）：W38 聚合 1 条输出正常，无 PermissionError。
- **主表数差额 -13 定性**：今晨 251242 → purge-empty 18 条（10:59 审计留证 logs/kb-purge-empty-audit.jsonl）所致，非数据异常。
- 回归：health-patrol 全绿（411 块）+ kb-quality-patrol 五红线全绿。

## 2026-09-17 11:20 · R798 轮值协议 Kimi 会签 + 边界实测核实（WO-002 领单）

- **项目边界盘点**：launchd 归属清晰（com.mingli-baojian.* 53 项在管 / com.tcm-agent.*、com.smart-home-family.* 兄弟项目各自独立 / com.autoclaw.* 为运行时与共享订单服务 8963，本项目只调用不改动）；端口段 8900-8999 无越界。
- **禁触区实测**：`~/Documents/Codex/` 全域五个独立项目路径逐一验证存在；全项目脚本/KB 管线扫描**零 Codex 引用**——无泄漏、无自动化写入目标，R797 边界即刻生效且已合规。
- **协议会签**：ROTATING-DEV-PROTOCOL.md 增补——§四「唯一工作区（不留副本）」纪律（副本即漂移源，cold-storage 仅冷存不作开发现场）、§四补「优势分工指引」（AutoClaw 常驻运行时/批量管线值守，Kimi 深度诊断/前端走查/知识质量精修，建议性不强制）、§八双方签署。
- **WO-002 领单**：v9.2 BaziQA 重评定案+四路大师蒸馏恢复，四步执行计划已登记 WO 文件（先定性 v9.2 可评对象存在性，再修真评估管线，三选一定案，大师脚本去硬编码用冷存新址实测）。

## 2026-09-17 11:15 · R797 补充：patrol 修真 + WO-002 训练侧证据补强（AutoClaw）

- **health-patrol.sh 修真**：备份守卫段 `grep -c ... || echo 0` 在无匹配时输出 "0\n0"（grep 退出码 1 触发 echo 追加），导致 `[ ... -gt 0 ]` 报 integer expression error——改为固定单值输出；复跑 rc=0 全绿验证。
- **v9.2 训练侧新证据（补入 WO-002）**：training/logs/v92-train.log 停在 iter 10（0.106 it/s，序列 1208+ tokens 截断警告），mlx-models/ 下仅有 v9.0 adapter，**无任何 v9.2 adapter/融合产物**——WO-002 driver 领单后先确认可评对象是否存在，不存在则二选一：按 BAZIQA_PIPELINE 重训（增量 base=v9.0）或归档定版 v9.2 线。
- **历法校准 cron 复跑**：手动触发 rc=0 自愈（上次为瞬时故障），顺带完成 2027 年节气表修真（bmcx+lunar_python 双源差异 2 处）。
- commit 8fec02f7。

## 2026-09-17 11:00 · R797 双智能体轮番机制落地 + Kimi 遗产全量诊断（接管第二单）

- **边界与机制复核**：AGENT-TAKEOVER-20260917 定位/红线复核无误；ROTATING-DEV-PROTOCOL 补 R797 复核时限条款（reviewer 24h 未复核视为通过+可后补抽验，杜绝双向等待死锁）。
- **Kimi 遗产诊断（git 法证）**：训练盘克隆（/Volumes/模型训练数据/projects/mingli-baojian）最后提交 c8f35962（R-WALK3, 09-08）经 merge-base 确认为主仓祖先——**无未同步代码**；其未提交改动均为 09-08 工具状态产物（能力差集报告/KANBAN 精简/训练数据清理），非新产出。09-14 后任务书通道空壳，接管结论二次印证。已落 ARCHIVED-README.md 归档标记，无任何 launchd 服务指向该克隆（grep 实证）。
- **全量诊断（本轮实测）**：health-patrol 全绿（端口 8900/8901/8911/8912/8913/8920/8960/8941-8945 + 410 内联块）；kb-quality-patrol 五红线全绿（主表=fts5=251,242）；tcm 差集 clean=true / 缺失 API 0（Kimi 时代 13 条 L1 差集已吸收闭环）。
- **缺口定案**：KB 域分布 tcm 系 19 万+、命理核心（紫微 2856/classic 11034/nihaisha 5478/shanghan 3434）、**yangsheng 仅 5 条=最大缺口**；v9.2-full488.log 实为无效评估（模型答案 483/488 空值，0.6% 不可用，疑脚本与 8960 参数不匹配），非真实成绩。
- **WO-002 派单（轮值周期 #2，driver=Kimi）**：v9.2 BaziQA 重评定案（三选一：热切上产/归档定版/开审计单）+ 四路大师蒸馏恢复（路径去硬编码+至少一路可跑）；任务单已投递主仓 docs/rotating-tasks/ 与 Kimi 工作副本双侧。
- **后续开发（AutoClaw 本轮继续 driver）**：养生域 KB 第二批推进（夜间蒸馏主题池节气养生扩容已置首），维持五红线唯一通道。

## 2026-09-14 10:30 · 告警治理四源根修 + 项目全面梳理清理

- **告警源 1 · distill-mingli-outbound EPERM（已修实测）**：09-11 training-data 软链至外接盘后，launchd 上下文对可移动宗卷 EPERM 致该任务 09-12 起连败。EXPORT/retention 等 5 处改落本地 `exports/distill-outbound/`，kickstart 实测跑通（全量镜像推送 SHF 成功，registry total=10182）。
- **告警源 2 · kb-web-distill 静默 103h（已修）**：脚本系僵尸（指向 0 字节归档库、无任何任务引用），已归档 `archive/scripts-legacy/`；巡检 5c 段监控目标改指 family 知识通道真产出 `exports/distill-outbound/mingli-full-*.json`（日频，09-14 已验证在写）。
- **告警源 3 · 8932 探针误报（已修）**：实测服务 198ms 健康返回 103,484 条，I/O 尖峰致 5s/8s 超时抖动误报，超时加固至 12s/15s（R-DEBOUNCE2）。
- **告警源 4 · tcm-import 退出码 1**：10:01 轮 rc=0 自愈，无需修。
- **全面梳理清理**：`.openclaw/tmp` 两周以上陈旧文件 1,722 个 311MB 迁外接盘冷存 `cold-storage/mingli-baojian/tmp-stale-20260914/`（tmp 372M→44M）；git 卫生——server/kb-store、medical-stack kb-store、training-data 等已迁外接盘软链的目录停止跟踪，.gitignore 补软链条目（server 5cbb516）。
- **回归**：巡检全绿（409 块过、端口全活）+ 29 链路冒烟复跑。

## 2026-09-08 12:50 · R-WALK3 机构中心走查：入驻申请假闭环根修

- **基线**：19 卡零死链零破图；shop 套餐下单实测走通共享订单服务 8963（真实创建 ORD 单）；merchant-dashboard 本地账与 serverId 同步兼容。
- **假闭环根修（SaaS 红线）**：merchant-apply 机构入驻申请原只写 localStorage——机构填完申请，平台侧永远看不到。新增服务端 `org_applications` 表 + 三接口：POST /api/public/org-apply（CSRF 全局覆盖、电话格式校验）、GET /api/org/applications 与 POST …/review（adminAuth 门禁，实测未登录 401）。前端先送服务端、localStorage 降级为明示「未送达平台」的诚实副本。浏览器实测：申请提交→**申请编号 #2 真实入库**。
- **回归**：409 块全绿 + 29 链路冒烟全过。提交 server 侧 + 父仓。

## 2026-09-07 21:35 · R-WALK2 患者建档闭环根修（红线级假成功清除）

- **patient-intake 三重症**（患者中心「首次就诊·建档登记」）：
  1. **红线级假成功**：POST /api/clinic/case 有 CSRF 门禁而页面从未取 token——建档提交 100% 失败，catch 却显示「提交成功（离线模式）」。改为：预取 CSRF + 过期自动换新重试一次 + 失败给真实原因与「重新提交」（表单不丢）。
  2. **幽灵患者锚点**：硬编码 patient_id=4（查无此人）改为散客锚点 0（medical_cases 主约定 32/41 例），姓名/性别/年龄/生辰写入 paipan_summary 供医师识别。
  3. **服务端 falsy 误判**：`!patient_id` 把合法的 0 也拒了，改 undefined/null 精确判定（server 718fb7e）。
- **浏览器实测全链**：填表→提交→真实诊疗编号 **#49** 入库，状态 pending_master 进大师复核队列。
- **顺带**：症状前缀空「。」瑕疵修复；报告回流两接口（my-reports 登录门禁/signed-report 404 空态）行为正确无需修。
- **回归**：409 块全绿 + 29 链路冒烟全过。提交 80b240a4。

## 2026-09-07 21:20 · R-WALK-API 基址门禁入巡检（制度化防再生）

- health-patrol.sh 新增规则：app/*.html 禁止 ①API 基址空字符串静态赋值 ②裸 `/api/` 相对路径 fetch/XHR（注释行豁免）；白名单 `scripts/.patrol-api-base-allowlist`（当前为空，例外须注明理由）。
- 阴性测试：植入 `API=''`+裸 fetch 病页 → 巡检立即告警「R-WALK-API 基址同源落空」；移除后恢复全绿。今日走查的 13 页暗病从此有静态门禁，再生即被抓。

## 2026-09-07 21:05 · 五中心走查：API 基址暗病批量根修（12 页）+ 空壳清零

- **空壳清零**（您已确认）：11 个 0 字节 db 空壳（knowledge/ 8 + data/ 3）归档 archive/empty-db-shells/；2 个失效历史导入脚本（r474/r486 指向已归档路径）归档 scripts-legacy/；feedback-aggregator 候选列表摘除 data/yidao.db。巡检 R120 断链规则持续守护。
- **五中心死链基线**：doctor/patient/org/admin/yuanzhu 五中心 257 链接零死链、图片标题全部在位。
- **API 基址暗病批量根修（本轮最大战果）**：同源落空病共 12 页——master-workstation 同款（`API=''` 或裸 `fetch('/api/…')` 打 8900 静态口必 404，页面静默降级为空态）：
  - 直接基址为空 4 页：admin-tickets / clinic-consultation / doctor-consult / unified-diagnosis
  - 裸相对路径 8 页：admin-kb-panel / glass-console / health-forecast / kb-browser / kb-quality / naming-portal / ocr-history / tcm-syndromes
  - 统一注入标准基址（127.0.0.1→8920，线上留同源），逐页浏览器实测全通。
- **附修三处字段契约错位**：①kb-browser 的 api() 助手不走基址，总览长期全 0——修复后实显 **87,352 条目 / 220 模块 / trust 0.819 / 命中 145,029 / 质量 A+**；②tcm-syndromes 读 d.data 而接口返回 d.stats；③doctor-consult 健康检查只认 ok/status 字段不认 code===0，修后实测「所有服务就绪 · 可以开始采集」。
- **回归**：409 块 inline 全绿、29 链路冒烟全过。提交 e4b34063（空壳）+ 6d45a2eb（基址批量）。

## 2026-09-07 20:35 · 知识蒸馏与活化全链诊断：一处真故障根修，其余链路健康

**诊断结论（全链五段）**：
1. **库存**：真库 server/database/yidao.db——kb_formal 87,177 条（今日 +15,098 经 tcm 通道内化）；knowledge/ 与 data/ 下八个 .db 均为 0 字节历史空壳（yidao.db 空壳删除仍待您确认）。
2. **蒸馏（命理域）**：G26 多轮补蒸馏 SOP 已收敛——R1 覆盖审计 212 文件全覆盖、差集 0、3 项合理排除（书面说明），月度轮 13:46 复跑「无差集仅审计」。倪师天纪语料 181+17 全部入KB。
3. **暂存→正式（故障点已修）**：staging-auto-promote 今晨 829 候选仅晋级 5、824 条 database is locked——根因是 launchd 时刻表撞车：promote(每日03:00) × distill-mingli-outbound(每日03:00) × distill-feedback-loop(周一03:00) 三任务同秒齐发抢 WAL 单写者，15s busy_timeout+重试耗尽。手动复跑 **829/829 全晋级 0 错误**；时刻表错开：promote→04:17、反馈环→周一02:47，plist 纳入 scripts/launchd 版本管理（481ee678）。暂存区当前 pending 1/staged 3（不达标保留），无积压。
4. **活化（命中侧）**：周评估（今晨 06:00）KB 检索 341 次、命中率 100%、均延 28.8ms ✅；修真闭环本周零记录；反馈入库 341 条全部去重跳过（幂等正常）。
5. **外发**：mingli-full.json 镜像每日 03:00 推 family（13:36 补跑成功，qimen 915/fengshui 707/bazi 595 等全量模块）。
- 遗留观察：知识/目录下空壳 db 容易误导（本次诊断即被误导一次），建议下次确认后清理。

## 2026-09-07 20:10 · 命理师中心走查：两处真问题根修

- **死链/图片/排盘渲染基线**：47 链接零死链、20 张图片标题全载、paipan-center 七盘入口全通、kb-insights/master-intake API 配置正确。
- **修复①：复核签发链路指向真审核台**。master-review.html（大师端·批八字）是遗留演示页——硬编码 `/api/patient/profile/4` 而该患者已 NOT_FOUND，页面只会优雅空转。归档至 archive/app-legacy/，三处入口改指：center-master 复核签发卡 + index 复核卡 → review-studio.html（真双师审核台，Bearer+CSRF 门禁正常，浏览器实测 AUTH 拦截在位）；practice-portal 复习精要卡（学习门户错配到批八字演示）→ koujue-gallery.html（口诀速查）。**同步清源三处**：生成器 gen-service-centers.py（防重生成回退）、sitemap.xml（删死条目）、site-index.json（改指审核台）。
- **修复②：命理大师工作台活体数据从未工作**。`const API=''` + WS 拼 `location.host`(8900 静态口)——所有 fetch/SSE/WS 全部落空，页面只显示降级空态（「SSE 推送失败」「尚未接收到患者诊断同步」）。API 与 WS 双双改指 8920，浏览器实测：推送失败标志消失、SSE 通道恢复。这意味着问诊室→大师工作台的病例实时同步链路（R505 WS→SSE→轮询三级降级）首次真正可用。
- **回归**：409 块 inline 全绿（归档一页减 1 块）、29 链路冒烟全过。提交 97ef9355。

## 2026-09-07 19:55 · R-TAP-Y 点读末三盘：梅花/六壬/八字点读上线，七盘点读全覆盖

- **服务端**：`paipan-baihua-engine.js` 新增 buildMeihuaTap（本/互/变/动爻四点读）、buildLiurenChuan（三传点读：天将+阶段+起传法+贵人）、buildBaziPillar（四柱点读：柱位/十神/藏干/纳音/长生/旬空六维）；api-server-v2 白话分发新增 meihua+tap / liuren+chuan / bazi+pillar 三支，契约 {ok,title,level,summary,lines} 与共享弹层组件一致。
- **前端**：meihua-chart（点本/互/变卦+动爻）、liuren-chart（点三传）、bazi（点四柱）接线 paipan-tap-pop.js，委托绑定常驻容器不受重渲染影响。
- **顺带根修 bazi.html 两处既有 bug**：①pro-gate.js 从未引入——computeBazi 的 SVG 盘图链路调用 proFetch 必抛（导出模板里那行 `\x3cscript` 是转义文本不算引入），补 `<script src="js/pro-gate.js">` 后盘图渲染恢复；②catch 分支 `esc(e.message)` 全页未定义，任何真实错误都被「esc is not defined」掩盖——补页面级 esc 兜底。
- **验证**：浏览器实测三盘——八字 1990-05-12 辰时点日柱出「日柱·丁丑」六维白话弹层、梅花点变卦「雷水解」+点动爻体用关系、六壬点初传「寅乘腾蛇」；巡检 410 块 inline 全绿、29 链路冒烟全过。提交 server 7e41027 + 父仓 f4e78758。
- 至此**七大排盘（八字/紫微/六爻/奇门/风水/梅花/六壬）点读能力全覆盖**。

## 2026-09-07 19:35 · 民俗中心+缘主中心+移动 H5 走查：H5 三处假数据/错排盘根修

- **民俗工具中心**（浏览器实走）：14 件工具五分组、图片标题落地、太岁卡点阅全链畅通（白话+化解+不恐慌提示）、「我的生辰」个人化机制在位。冒烟扩至 29/29 全绿（新增择日·个人化/太岁本命化解/节气/节日/家庭排盘五链路字段级断言——太岁化解≥2 项为用户红线）。修一处 UX：卡片角标裸 API 路径（GET /api/minsu/xxx）对信众隐藏。
- **缘主中心**：37 个出口链接死链扫描零死链，五中心互链完整。
- **移动 H5（wechat-h5）三处真问题根修**：
  1. **简化八字排盘公式数学错误**——日柱 `(year*365+month*30+day)%60` 必错、月柱不历节气，输出看似合理的假盘（最伤可信度的一类缺陷）。废弃本地公式改调真排盘引擎 `/api/paipan/calculate`，实测 1990-05-15 卯时出 庚午/辛巳/庚辰/己卯+日主庚金+五行缺水，与 8911 全量盘一致；
  2. **今日运势/吉日查询为日期哈希轮转假数据**（12 条库存话术+%12 循环、宜忌 %15/%12 伪随机）——双双改接真实 `/api/minsu/huangli`（日课：干支/建除/值神/冲煞生肖提醒/喜财福方位；宜忌真实 11 事/7 事）；
  3. 顺带修「81月7日」拼接优先级 bug + 月度报告 fetch 补 WX_API 基址（8900 下此前必失败）。
- 全站同模式扫描：dateHash/dHash 伪随机模式仅 wechat-h5-inline.js 一处，已清零。

## 2026-09-07 19:05 · 问事服务中心 21 工具 24 链路全量冒烟落地 + 挂入每日回归

- 新建 `scripts/ask-flow-smoke.py`：按 ask.html 真实载荷逐条打 21 工具（24 链路，含手机号/姓名/合婚双模式——有无生辰两条路都测），按各工具前端实际取数路径提取白话体并过质量门（overview 长度/cards/tips/字段级断言：起名候选≥3 带分带释义、改名有现名分+备选、手机号有命局契合度+喜用、十年走势≥10 年条目）。
- 首跑抓出 7 个「假失败」均为冒烟脚本提取器与客户端总览组装口径差异（客户端在前端拼 richer overview），逐一按真实取数路径修正后 **24/24 全过**——今日早些时候发现并修复的八字回测空转是本轮唯一真缺陷，已先行修复。
- 挂入 `ui-smoke-daily.sh` 第三段（问诊台回归 + 文字红线扫描 + 问事全链路），失败即桌面告警。gitignore 例外已开。

## 2026-09-07 18:50 · 问事服务中心全链路实机走查：回测空转 P1 根修 + 卡片无障碍 + 巡检防抖

- **走查链路**（真实浏览器 + 网络抓包，8900/app/ask.html）：21 工具卡片点击 → 问事对话（语音/拍照入口在位）→ 生辰采集（阳历农历/时辰/性别/出生地真太阳时/跳过兜底）→ 8920 baihua 排盘 → 白话报告渲染。正向全部畅通：问句复述扣题、🎯相关卡置顶、九维卡片、往后看三年、tips 齐全。
- **P1 根修 · 回测空转**：八字「往前验」2023/2024/2025 三年全显「暂无流年数据」——baihuaBazi 的 perYear 只查 8911 预计算 liunian 数组（仅覆盖当前年往后），其余六盘 perYear 走 liuNianFn 任年现算无此问题。修复：缺档时本地确定性补算（yearGanzhi 干支纪年 + tenGodOf 十神生克 + 地支藏干表，全部历法常量推算零外依赖）。**正确性对拍**：补算法则对 2027-2029（引擎真值覆盖年）计算结果与真值逐字一致（正官/偏印/正印）；复测 2023 癸卯伤官/2024 甲辰偏财/2025 乙巳正财，与人工核验吻合。verifyAsk 同步接通补算值。回测反馈按钮（✓/✗ 回传入库）从此有真实弹药。
- **无障碍补强**：21 张工具卡补 role=button/tabindex/aria-label + 键盘 Enter/Space 可达（此前仅 div onclick，读屏与键盘用户不可达）。
- **巡检防抖**：8932 存活探针 40min 内两次误报（tcm 侧重启窗口/冷索引期 5s 超时）——失败时隔 8s 重试一次再告警，告警文案带重试后实测值。复跑全绿。

## 2026-09-07 18:20 · launchd 常驻脚本 yidao.db 写纪律审计：两修一退役 + DB 周期热备从零到一

- **审计范围**：40 个 launchd 常驻任务引用脚本全量过一遍（历史 156 个引用 yidao.db 的脚本中一次性蒸馏脚本不复跑、不列管）。结论：import-tcm-kb / wiki-fill-watch / g24-reference-guard / staging-auto-promote / health-patrol 等主力全部合规（safe_close / mode=ro / busy_timeout 在位）。
- **修 1 · evolution-loop.py**：连接补 `timeout=30 + PRAGMA busy_timeout=30000`（昨日 824 锁连败同类隐患）。
- **修 2 · cron-distill-feedback-loop.sh**：写库块（source_index+kb_staging）补 busy_timeout=30000（原仅有 checkpoint，缺等待机制）。
- **退役 · evolution-loop 定时任务**：审计牵出真问题——该任务 DB_PATH 指向旧库 `knowledge/yidao.db`（8/16 起每次运行 connect 创建 0 字节空壳即崩 `no such table: formal_knowledge`，launchd 状态=1，功能自 8/16 全灭）；其 L4 进化层能力（反馈聚合→staging 入库→自动晋升）与现行 cron-distill-feedback-loop.sh + staging-auto-promote.js 完全重复且指向错误 schema。已 bootout + plist 归档 `archive/launchd-retired/`（可逆）；0 字节空壳 `knowledge/yidao.db` 待用户确认后删除。
- **补洞 · DB 周期热备从零到一**：data1-weekly-backup.sh 此前排除全部 *.db——主 KB 库无任何周期备份（昨日 freelist 事故零丢失纯靠 VACUUM INTO 侥幸）。新增 3.5 段：sqlite3 `.backup` 在线热备（WAL 活体安全）→ 备份件 integrity_check 自检（不合格即删不留坏备份）→ 保留最近 4 份周备。热备链路实测通过（1.8G，integrity=ok）。
- 验证：三脚本语法全过；health-patrol 复跑全绿。

## 2026-09-07 17:40 · 8973 医学栈端口补丁后浏览器全链路走查通过 + 上游词表缺口移交 tcm

- 走查（真实浏览器 + 网络抓包）：8973/index 渲染正常（品牌/话术/表单齐全）；辨证请求确认走 **8972 内化栈**（预检 204 + POST 200）；正向链路实测：快捷卡片「胃不适」→ 主诉「胃不舒服，腹胀，没胃口」→ 提取 腹胀/纳差 → 出方 四君子汤（脾胃气虚，置信度 30%，合规话术齐全）；server-monitor 端口卡已显示 8972/8973 运行。
- **走查发现上游缺口**：自由文本「胃胀嗳气」辨证空结果——页面端 extractTerms 硬编码 15 词条表无脾胃高频词（服务端 structureInquiry 能力闲置）。双侧对拍确认双侧同构（tcm 源页行为一致，非内化回归）。按「只适配不训练」纪律未在本侧打医学逻辑补丁，移交 tcm 裁量：`tcm-agent/docs/handoff/mingli-index-extracterms-gap-20260907.md`。

## 2026-09-07 15:55 · 8931 端口冲突收口：医学页直连 tcm 活体 API 真 bug 根修

- **真发现**：借收口 8931 归属冲突盘点，发现三个医学页（index/clinic-stats/wuzhen-diagnosis）硬编码 `http://127.0.0.1:8932` **直连 tcm 活体 API**——绕过内化栈 8972，tcm 停机即瘫，且违背"医学服务=内化栈"的架构定位；server-monitor 端口卡也显示旧 8932/8931。
- **合规修复**：tcm 源页不可手改（G18 纪律），新建补丁 `patches/brand/port-adapt-897x.json`（pages 五页 stem 命名——首跑因误写 .html 后缀零匹配，复算逐补丁追踪定位后修正），重放 5 页、冒烟 5/5、G18 漂移审计 rc=0。8972 CORS 正则本就放通 localhost 任意端口，无需改服务。
- **监控中心补强**：monitor-hub.html 新增「命理宝鉴·医道（医学内化栈）」8973 条目（总览/医生看板/门诊工作台/批注工作台/服务监控/门诊统计），原「中医智能体」更名标注（上游源头）；语法校验 + 线上 200 通过。
- 销账：KANBAN「8931 端口归属冲突需跨项目协调」——落定结论：medical-stack 静态层让位 8973（已在产），页面层残留本次清完，无需跨项目动作。

## 2026-09-07 15:35 · 维基补齐纯脚本看守上线（不占模型额度，网络通即自动补跑）

- `scripts/wiki-fill-watch.sh` + launchd `com.mingli-baojian.wiki-fill-watch`（30min）：探活 zh.wikipedia 不通静默 rc 0；通了自动跑 fill-wikidata-events.py（幂等断点续跑，熔断 rc 2=仍未通则下轮继续）；全部补齐后自卸载+桌面通知。落实用户「盯着网络通了自动补跑」指令，替代原 cron 池挂 agent 看守方案（零额度消耗）。
- 试跑验证：当前链路不通，静默退出 rc 0，不误报不惊扰。补齐后 603 条名人导语事件入库，深度校验有效样本将从 144 涨至 600+。
- 顺带销账：临床经验蒸馏周一 06:02 复跑 ok、连败自清零（payload 单步化修复生效，KANBAN 观察项关闭）。

## 2026-09-07 15:25 · 内存压力遗留专项销账：指标失真根修 + 实况盘点结论「非常驻缺陷」

- **指标失真根修**（子模块 de7bce4）：api-v2 /api/health 内存口径 os.freemem→vm_stat——macOS 下 freemem 只算完全空闲页，inactive/可清除页全计已用致常年误报 95-99%（09-06「free 仅 85MB」「内存 100%」判断同源失真），修真后实测 70% vs 旧口径 99%，与 patrol 独立口径吻合。
- **实况盘点**：mingli 全部 30+ launchd 常驻服务合计仅 524MB（MLX 推理懒加载空载 12MB）；全机 57% 空闲；头部占用为桌面应用（Kimi 渲染器 1.68GB）与 tcm 侧 api 467MB——本侧无瘦身空间。
- **结论**：历史 100% 压力=MLX v6 训练窗口（GB 级训练进程）+指标失真叠加的非常驻事件；patrol vm_stat 口径 MEM_MAX=96 守卫持续在位，转观察项销账（KANBAN 09-06 遗留）。

## 2026-09-07 15:15 · 月度互查机制落地（草案 v0.1 → 自动化链路）+ 首跑立功捕获 V201 排名分叉

- `scripts/monthly-cross-check.py`：草案三分野 9 项全自动——A1 漂移对账 / **A3 排盘指纹对拍**（5 固定用例打 8920 原始盘端点，sha256 规范化 JSON，月度环比）/ B1 差集 clean / **B2 检索处理器哈希** / B3 同案对拍复跑 / B4 L3-lite 知识一致性 / **B5 排名漂移守护**（金案 B075 双侧 top1）/ C1 话术分层 / C2 R745 三阴性断言 / C3 历法同源——裁判采纳的三个口头 P2（检索哈希/排名漂移/指纹对拍）全部机制化关闭。
- launchd `com.mingli-baojian.monthly-cross-check`：每月 2 日 09:17，health-patrol 挂 R-MCC 退出码告警；证据件 `DELIVERY/monthly-cross-check-YYYYMM.json` + `paipan-fingerprint-YYYYMM.json`（A3 首版基线已产出）。
- **首跑即立功**：捕获 V201「腹满 面黄」排名分叉——《钱天来论理中汤》ms top1(14 分) vs tcm 跌出 top30；逐层排除索引/处理器哈希/条目数据/同步滞后后定性为 tcm 侧 G25 v1.7.3 清账+信任标校准（~14:50）的活体排名演化。不移交不猜因，已发 tcm 移交件 `tcm-agent/docs/handoff/mingli-v201-ranking-drift-20260907.md` 请求确认是否预期副作用；对拍门槛 0.02 不放宽，tcm 回执后镜像追平自收敛。

## 2026-09-07 14:30 · P0 事故：yidao.db freelist 损坏修复 + G24 边界常驻守卫 + 巡检通知通道开通

- **事故**：tcm-import 链条 exit 1 连警，根因 import-tcm-kb.py 写入报 `database disk image is malformed`——integrity_check 定位 freelist 计数不符（1352 vs 应 1378，WAL 裂脑系列事故残余），插入需分配空闲页即报错。
- **修复**：停 api-v2 → `VACUUM INTO` 重建新文件（integrity_check=ok，kb_formal 76,206 / kb_staging 4,054 / 触发器 4 全一致）→ 原子置换 → 重启。旧库按 ADR-010 迁 `/Volumes/模型训练数据/mingli-db-coldstore/` 冷存。链条手动 kickstart 复跑 **exit 0**，diff clean。
- **G24 边界漏洞顺带根修**：修复中发现参考域 37,260→37,197 差额 63 条——staging→formal promote（INSERT OR REPLACE）绕过 G24 一次性打标。`scripts/g24-reference-guard.py`：补标 63 条（回到 37,260 与 G24d 账目吻合）+ 建常驻触发器 `kb_formal_reference_guard`（AFTER INSERT 自动补标，覆盖 promote/蒸馏/手工全路径，TCMFWD 正室豁免）+ 事务内实弹自检 pass + 泄漏 0。
- **巡检通知通道**：health-patrol 告警此前只落 `data/alerts/health-alerts.jsonl`（积压 9,067 行无任何消费方），今接 macOS 桌面通知（osascript，告警指纹 6h 去抖，指纹变化立即通知）；同步加 R-G24GUARD 泄漏巡检规则兜底触发器。

## 2026-09-07 14:15 · staging promote 824 锁连败根修：busy_timeout + 重试双防线

- 凌晨 03:00 例行 promote 824/829 条失败「database is locked」：kb-management-engine 模块级连接 busy_timeout=0（node:sqlite 默认），WAL 单写者被占即瞬时报错，824 条候选整批陪绑。
- 根修双防线：①引擎连接补 `PRAGMA busy_timeout=15000`（server 子模块 5a71636，api-v2 已重启生效）；②staging-auto-promote.js 逐条 promote 加锁重试（2s/5s 两档，非锁错误不重试）。
- 复跑验证：promoted **829/829（0 errors）**，积压全消化。

## 2026-09-07 14:00 · equiv 对拍 FAIL 根修：G1 索引重建空壳事故 + 钩子守护上线

- 现象：equiv-dual-run 复跑 FAIL——端点零差异但 Recall@K tcm 31/36 vs ms 30/36（Δ=0.0278>0.02），唯一掉案=案30「腹满 面黄」期望《钱天来论理中汤》。
- 根因：13:42 G1 跟随钩子重打包 KB 层（63k+ 条镜像）时，SQLite 快路径索引用 fire-and-forget spawn 重建（stdout/stderr 丢 DEVNULL），进程中断成 4096B 空壳（残留 tmp-shm 753KB）；8972 静默回退 JSON 慢路径，召回掉案。与 mingli 侧 yidao.db 无关（8972 读 medical-stack 自有存储）。
- 处置：`kb-sqlite-sync.js --force` 重建（61,628 条/356.6MB，--verify 分区+抽样全一致）→ 重启 8972 → 对拍 PASS（双侧 31/36，Δ=0.0，zero_diff ✓）。
- 根修：medical-stack-kb-follow.py 第 5 步改同步执行 `--force` + `--verify` 双段，任一步失败 status=error 告警（watchdog 链4 可捕获），禁止再静默跳过；端到端实测通过（touch 镜像触发全流程，63,173 条重建 2.6s，warm_check 62,994 + R756 过滤 179，七能力 caps_ok，status ok）。

## 2026-09-05 · A2 对账上线 + WAL 裂脑二发收敛

- capability-drift-check.js 增 registry↔outbox 双向对账（ERROR 级入 health-patrol）；3 条登记双向全对
- WAL 裂脑二发（api-v2 持失链 wal）按 R-WALF 重启收敛，巡检全绿；R772 根修未覆盖失链窗口期，建议立项

## 2026-09-07 13:47 · G26 SOP 常态化：月度 launchd 上线（每月 1 日 08:43）

- scripts/g26-monthly-sop.sh：R1 审计 → 有差集自动 R2 补蒸（密钥运行时从 api-v2 plist 读取不落盘）→ R3 复扫 → 收敛后自动下发镜像；差集不清非零退出供 health-patrol 捕获。
- launchd com.mingli-baojian.g26-sop 已装载并试跑通过（R1 差集 0 直过，日志 logs/g26-sop.log）。

## 2026-09-07 13:42 · 镜像→消费全链路验证：G26 知识 family 侧可检索

- 链路：mingli-full.json（13:36 推送 20,832 条纯命理）→ family build-family-kb.py 重建融合层（mingli 20,649 + tcm 59,103 = 79,752，去重 2,471）→ 消费方 triage_router/closed_loop_engine 均为 mtime 缓存自动热载，无需重启。
- 实测：family 消费方加载 79,752 条，G26 财帛宫系列 13 条可检索（样例「紫微斗数紫微星坐财帛宫各组合含义与吉凶详解」）；mingli 域 TCMFWD 混入 0。
- family-kb launchd 日 04 点自动重建，日常无需人工。

## 2026-09-07 13:40 · 镜像出站根修：参考域+TCMFWD 正室双排除，family 收纯命理 20,832 条

- cron-distill-mingli-outbound.sh 两个导出查询（pure/full）加 `domain!='reference'` + `fingerprint NOT LIKE 'TCMFWD|%'`：模块名 LIKE 黑名单盖不住 huangdi-neijing/bencao-gangmu/qianjin 等经典命名模块，tcm 内化正室 11,003 条此前长期混入 family 镜像（医学双源重复+越界，违 R747）——domain/fingerprint 双字段才是权威边界。
- 手动复跑验证：family 侧 mingli-full.json 20,832 条纯命理（-11,003 医学），G26 新增 42 条全到达，参考域泄漏 0、TCMFWD 混入 0；distill-registry 回写 total=10,184（pure 线）。

## 2026-09-07 13:45 · G24d 参考域收尾：nihaisha_pcs/nihaisha-pcs/nihaisha-structured 打标，医学双头全灭

- nihaisha_pcs（1,274，兰台轨范/伤寒论条辨/针灸甲乙经等医典§节）+ nihaisha-pcs（80，梁冬对话倪海厦访谈）+ nihaisha-structured（96，伤寒论/金匮课程蒸馏笔记）→ domain='reference' 共 **1,450 条**，范围内未打标 0。
- 全库 reference 累计 **37,260 条**（占 72,908+ 增量的 ~48%）；命理域模块（authoritative/classics/kb-store 用神八宅/mingli-cross-moved/yizhan 焦氏易林等）逐一经内容抽样确认命理归属，不打标。
- 回滚快照 g24d_backup_20260907；至此 G24 系（G24/G24b/G24c/G24d）参考域边界全闭环：医学存量全标、正室全豁免、命理全可达、诊疗检索域零泄漏。

## 2026-09-07 13:35 · G24c nihaisha 混血模块内容级分拣（参考域边界最后一块闭环）

- nihaisha 主模块 772 条（0 TCMFWD）按标题+内容前300字规则分拣：医学 309 + 不明 182（倪师健康短讲/养生集锦）→ domain='reference' 共 **491 条**；命理 281 条中 266 条按标题归位命理模块（yijing 86/tianji-jiangjie 71/ziwei 68/fengshui 35/liuren 5/bazi 1），15 条留原模块。
- 配套根修：kb_matcher.py 诊疗四诊白名单（舌/面/目/手）移除 'nihaisha'——命理条目彻底退出诊疗检索域（R756 防泄漏加固）；归位后命理条目脱离报告黑名单模块名，命理链路恢复可达。
- 误判防线：医学正则剔除单字器官/汤丸散（易经「涣卦=散」「人心」类标题曾被误伤）；不明类就高打标（命理链路可命中参考域，误伤成本低；诊疗混入养生短讲噪音成本高）。
- 验证：8920 重启后 /api/public/tcm/syndrome-infer 命中 5 条全部 TCMFWD 正室，零泄漏；归位抽样正确。回滚快照 g24c_backup_20260907（772 行）。
- 全库参考域累计 **35,810 条**（35,319+491）。

## 2026-09-07 13:16 · G26 命理知识多轮补蒸馏 SOP 首轮闭环（差集收敛）

- 【R1 覆盖审计】命理语料 212 件（A·天纪分类字幕 179 / B·24集字幕 17 / C·天纪系文档 10 / D·项目内抽取 6）× kb_formal 对账：覆盖 205，差集 7（undistilled 5 + partial 2）；证据 DELIVERY/g26-r1-audit-20260907-1226.json。附查：天纪 24 集目录 subs/ 实测为空，字幕实位于 nishi-materials/subs/天纪*.txt。
- 【R2 补蒸馏】真实差集 3 件（财帛宫星耀含义→ziwei、倪海厦地纪日记 8 篇→fengshui、八字基础→bazi）切块 18 块全量过 AI 蒸馏管线+质量门（≥300字/命理锚点/医学诊疗口径剔除），入库 **42 条**（bazi 18 / fengshui 10 / ziwei 14，共 23,557 字），fingerprint='G26|md5' 幂等；途中根修三处：OLE2 二进制改名假 txt（换 93KB 抽取版源）、推理模型 max_tokens 截断（8192+尾逗号修复）、entry_id 撞车（改指纹派生）；语料台账 distilled-files.json 同步登记 3 件。
- 【R3 复扫】差集 0；合理排除 3 项书面在案（四柱命卦14/19 源文件 <700B 近空占位；八字基础 505KB 为 .doc 二进制改名以抽取版覆盖）；证据 DELIVERY/g26-r1-audit-20260907-1314.json。
- 【R4 收敛判定】13:15 复扫差集 0，连续两轮无新增 → **差集收敛**，转常态（新语料到达即跑 g26-r1-coverage-audit.py，差集进 g26-r2-gap-distill.py）。
- 边界遵守：人纪五篇与医学 PDF 全程不蒸（医学归 tcm 通道内化）；蒸馏入 KB≠模型训练；未越界。

## 2026-09-07 12:20 · G24b 清单外医学经典模块参考域收尾（承接 G24，裁判拍板项落地）

- 29 个医学经典/临床模块存量打 reference **1,513 条**（jinkui-yaolue 582/nihaisha-yian 371/acupuncture 316/wangzhen 115/bencao 72/r45_tcm 45/neijing 41/wenbing 27 等）；qianjin/mingyi-leian/zhubingyuanhou/rumen-shiqin/wenbing-tiaobian/jiayi-jing/nanjing/wenre-lun/piwei-lun/wenyi-lun/yilin-gaicuo/danxi/maijing 13 模块实测 100% 为 TCMFWD 正室（无旧存量，打标 0）。
- 全库 reference 累计 **35,319 条**；范围内未打标全部 TCMFWD（untagged_all_tcmfwd=true）；回滚快照 g24b_backup_20260907（4,236 行）。
- 命理域抽样排除不打标：yizhan(焦氏易林)/monthly_cure(运势化解)/yishi(行业运势)；nihaisha 主模块 772 条天纪命理+人纪医学混合，未整体打标，另案内容级分拣。

## 2026-09-07 11:20 · G24 医学存量参考域标注 + 模块标签规范化（ADR-024 裁判任务书，双项全收）

- 【任务① 参考域标注】kb_formal 新增 domain 列；G24 清单 23 模块 + tcm* 前缀存量打 domain='reference' 共 **33,806 条**（总量 72,908，占 46.4%）；TCMFWD 内化正室 10,904 条全部豁免（范围内未打标=正室，机器校验 untagged_all_tcmfwd=true）；不改内容/不删条目/不动 trust 与 updated_at；回滚快照表 g24_backup_20260907（45,107 行原值）。
- 【诊疗排除验证】补丁点 2 处：kb_matcher.py 3 条 SQL + collab-diagnosis.js liveKbMatch 3 条 SQL 加 `domain != 'reference'` 排除（覆盖 /api/tcm/syndrome-infer、/api/public/tcm/syndrome-infer、/api/doctor/consult-capture、问诊台 collab 实时链路、vision-gateway KB 联动）。端到端验证：POST /api/public/tcm/syndrome-infer（舌红苔黄腻/面色红/掌色红）命中 4 条全部 fingerprint=TCMFWD 正室，参考域 0 泄漏；对照 SQL：同关键词加排除条件后 tcm 模块 reference 条目全部滤除。
- 【命理链路阳性】命理报告/批注/AI 助手/通用检索链路不加排除（kb-module-filter 按 module 过滤不受影响）：同「桂枝汤」查询命理链路命中 tcm|reference 条目 3 条——参考域只读保留供命理批注与人文参考，符合规则。
- 【任务② 标签归并】12 条映射 573 行（只改标签不改内容）：qimen/shuihan-tcm→qimen(79)、shuihan-tcm→qimen(3)、shuhan-tcm→tianji-jiangjie(51)、tcm,shanghan-lun,jinkui→jinkui-yaolue(78,补 reference)、tcm.clinical→tcm-clinical(8,补)、tcm/wangzhen→tcm-wangzhen(24,补)、tcm,fengshui→fengshui(2,保留参考标)、梅花→meihua(80)、nihaixia→nihaisha(34)、nihaixia-yian→nihaisha-yian(150)、jingui→huangdi-neijing(14,补)、jinkui→jinkui-yaolue(50,补)。归并前全部抽样核实内容归属。
- 【提请裁判定性】①nihaisha_pcs(1,274, 医典§节) vs nihaisha-pcs(80, 梁冬访谈) 同族不同内容未归并；②G24 清单外的医学经典模块存量（qianjin/jinkui-yaolue/mingyi-leian/zhubingyuanhou/rumen-shiqin/wenbing-tiaobian/jiayi-jing/nanjing/wenre-lun/piwei-lun/wenyi-lun/yilin-gaicuo/danxi/maijing/wangzhen 等约 3.2k 非 TCMFWD 条目）未打标，是否纳入参考域请拍板。
- 脚本：scripts/g24-reference-domain.py（幂等，可复跑审计）。

## 2026-09-07 09:10 · KB 资产清单单一真源化：medical-stack/patches/kb-assets.json（sync-kb-assets 与 capability-diff L2.6 同读，新增资产只改一处）

## 2026-09-07 09:05 · 链条周报表上线：chain-weekly-report.py 七环节周报（launchd 周一 06:43），首期对拍 629 PASS/0 FAIL

## 2026-09-07 08:50 · 链 2d 上线：sync-kb-assets.py 七资产哈希幂等自动吸收+8972 重启+金案冒烟，全链 rc=0

## 2026-09-07 08:50 · 检索分叉根修（症状通道资产同步）+ L2.6 KB 资产哈希巡检层 + equiv-set-v2 冻结（36 案 PASS）

## 2026-09-07 08:30 · KB 镜像时效核查：ms=镜像 53,559 精确一致（tcm 活体 +20 待导出）；equiv-dual-run PASS（25/25 zero_diff）

## 2026-09-07 08:20 · AGENT.md 第 7 条：定时任务默认 launchd 纯脚本，agentTurn 仅限需模型判断环节

## 2026-09-06 20:30 · cron 大扫除：历法校准 git add -f 根修（自提交 bf9ec7e）+ 视觉同步迁 launchd+R-VSYNC 巡检规则

## 2026-09-06 20:15 · 名人采集半脚本化：celebrity-ingest.py（校验+排盘+反校上下文+入库），agent 只做搜索

## 2026-09-06 17:00 · health-patrol 新增 R-CHAIN5 规则：tcm 链条退出码非零/差集状态超 1h 未更新即告警（堵「链条哑巴 3 天」盲区）

## 2026-09-06 15:30 · 链5 修复（3.9 兼容）+ 差集清零（whatif/E12-16/lab-interpret）+ r470 迁 launchd

- tcm-capability-diff.py 修 3.9 兼容（str|None 崩退致链条哑巴 3 天）；whatif 端点移植 8972 对拍 MATCH；kb/search E12 繁简桥接+E15+E16 移植，处理器哈希归零；lab-interpret 定性双等价，SLA 基线 53 clean；r470 迁 launchd 日 03:00，试跑晋升 829/829；控制台指引 docs/console-ops-20260906.md。

## 2026-09-06 10:50 · 第三次 WAL 裂脑自动收敛成功（防线首实战）+ wal-inode-watch 秒级哨兵上线

- 10:14 检出 pid 26596 wal 失链（磁盘 MISSING），自动 kickstart 收敛成功；窗口内任务全排除，unlink 方待哨兵取证。
- 新增 launchd com.mingli-baojian.wal-inode-watch（60s）：wal inode/api_pid 变化秒级落 logs/wal-inode-watch.jsonl。
- 新发现：api-v2 三换 pid（62142→74450→75579）疑似内存压力被杀重生，已纳入哨兵监测。

## 2026-09-06 09:55 · AGENT.md 建设规范第 6 条：直连 yidao.db 必须走 yidao_safe.safe_close（R-WALF 纪律固化）

## 2026-09-06 07:35 · R-WALF 预防层：5 处直连 yidao.db 脚本统一「写完 checkpoint 再关闭」

- 新增 scripts/yidao_safe.py 规范助手；改造 import-tcm-kb / feedback-aggregator / evolution-loop / 两个 cron 内联脚本。实测 wal 截断、8920 无感。

## 2026-09-05 22:40 · R-WALF 守卫升级：检出自动收敛 + wal-watch 时间线埋点

- scripts/health-patrol.sh：WAL 裂脑检出即自动 kickstart 收敛 api-v2 并复查，成功不告警、失败才进 ALERTS；每轮巡检落 logs/wal-watch.jsonl 供复发时定位 unlink 方。试跑全绿。
- WAL 裂脑静态排查收口：排除 mv/replace/VACUUM/备份脚本/按请求句柄等嫌疑，机理维持 R772 末连接语义结论，转埋点取证路线。

## 2026-09-05 · 月度互查清单草案 v0.1

- docs/monthly-cross-check-draft-20260905.md（A 能力保鲜 3 项 / B 医学通道 5 项 / C 合规 3 项）；A3 排盘指纹基线 DELIVERY/paipan-fingerprint-202609.json 已生成；已抄送 family 待会签

## 2026-09-05 · G22 漂移巡检本侧上线

- scripts/capability-drift-check.js（三态判定+状态件）挂入 health-patrol.sh；兼容 family .activated 归档目录
- 首跑检出 family 侧 --fix 降级事故（1.2.0→1.1.0，已自愈），通报+根修建议发 family handoff
- 现态 IN_SYNC（1.2.0=1.2.0）

## 2026-09-05 · G21 能力发版

- 新增 scripts/release-capability.js（三类能力打包→sync-bus outbox→registry 登记，rollback_ref 自动链上版）
- 基线对齐首单：paipan v1.2.0 发布（R778 年份 1-9999 + 顶层生肖 + wrapper 契约回灌）；v1.1.0 导入 outbox 作漂移基准；selftest 5/5
- 触发纪律写入 AGENT.md；server 子模块 commit e0c2e6c

## 2026-09-05 · 驳回根修 checklist（DEFECT_PATTERNS 8 类缺陷模式库）

- reject 自动 triage 驳回原因 → checklist 持久化 + reject-triage.jsonl 登记 + retest 回执携带
- 工作台驳回件展示「根修线索」；QIUCE-3 复测命中 R-LY3+R-LY4 双线索，SOP 全程验证通过

## 2026-09-05 · 同案重出 diff 升级区段级对照

- qiuceSectionDiff 按报告结构切段逐段比对（same/changed/added/removed+段内明细）；工作台折叠卡展示
- QIUCE-2 复测：三段修复在 diff 中逐段可见；ann-4da9634aaa21 复核通过，队列清零
- server 子模块 commit 8a7e88a

## 2026-09-05 · 同案重出标准动作固化

- 8974 reject 回执 + retest 代理；8920 /api/internal/qiuce/:id/retest（重出+diff+重新入队）；CSRF 白名单放行
- 命理师工作台驳回件挂「同案重出」按钮与 diff 视图；QIUCE-2 原驳回件全链路复测通过（ann-c424c49260b1，diff +33/−30）
- server 子模块 commit 889c1ed

## 2026-09-05 · QIUCE-2 同案重出闭环销案

- 同案重新求测→AI 初稿→8974 批注队列→命理师 approve→短信 mock→信众端「命理师已核对」全链路验证通过
- 初稿质检三处硬伤零残留（世应爻一致/知识无错配/时效裁剪1年）；队列 backlog 0
- 证据：ann-ea33889552d0 approved；原驳回件 ann-a77c5e8b3fa7 历史留痕

## 2026-09-05 · R-LY5 七模块推广收口

- R-LY3/R-LY4 普查：六模块自动生效，风水专属路径补接 topic 过滤
- 新增 KB_DENY_CONTENT 内容级守卫（六爻专词泄漏拦截）+ KB_DENY_TITLE 分页符垃圾标题
- 七模块复测全绿；server 子模块 commit 3c0c624

## 2026-09-04 · R-LY4 时效意图识别裁剪逐年走势

- paipan-baihua-engine 新增 horizonOf（near/mid/far 三档）；seg3 渲染按档裁剪 forecast/backtest 并加时效说明
- QIUCE-2 三处硬伤全部闭环（R-LY2 世应爻 / R-LY3 知识相关性 / R-LY4 时效）
- server 子模块 commit 2840864

## 2026-09-04 · R-LY3 六爻知识依据用神相关性过滤

- kb-module-filter.js 新增 filterKbHitsByTopic：问事类目↔占书章节类目对齐 + 易经卦名对齐（本/变/互）；失脫章名（附盜賊捕盜捉賊）补入 shiwu 规则
- norm-report-engine：question→questions 归一修复；源头过滤 kb_hits 与 huajie.关联KB，seg2/3/4 及 raw 快照全链路收口
- QIUCE-2 同案复测噪声清零；婚姻问/泛问/八字三组对照回归通过
- server 子模块 commit 3b84316

# mingli-baojian 更新日志

## 2026-09-03 晚 · D9 前端落面 + E5/E6/E7 教学池整链吸收（相似医案空壳修真）
- **lab-interpret.html 内化**：tcm 体检报告解读页落 medical-stack/app，标题品牌补丁 `brand-lab-interpret-title.json`（命理宝鉴·医道），走 G18 重放器产出（不手改）；home-tcm/my-reports 互链磁贴已随链上重放就位；浏览器实测粘贴→解读→总览/模式识别/逐项白话/就诊话术/中医佐证全渲染
- **E5/E6/E7 教学池整链吸收**（溯源 tcm HEAD d33f28c/c45bbfd，契约 v1.4.7）：
  - 数据：`data/teaching-cases.json` 160 例 9 病种（外感36/脾胃48/杂病29/肺系15/神志10/心脑8/肝肾7/妇科5/儿科2）
  - 加载：loadTcmCases + loadTeachingCases + state 双池（tcmCases/teachingCases）
  - **POST /api/tcm/cases 桩修真**：原「TODO 写入数据库」空壳 → state.tcmCases 内存 + data/tcm-cases/ 异步落盘（confirmed-cases 同模式）
  - **GET /api/tcm/cases/similar 桩修真**：原「永远返回空+开发中」空壳 → buildCasePool 三池统一 + scoreCasePool 症状/舌脉/证型重叠评分（Jaccard 归一+证型+3+舌脉各+1）
  - **GET /api/tcm/teaching-cases 新增**：按病种浏览教学案（area 精确/q 模糊/limit），供 disease-kb 页
  - **diagnose 第 5 步挂钩**：report.similar_cases top3 带 teaching 徽标下发——clinic-desk 既有渲染路径（教学 chip/来源标签）直接点亮，此前页面徽标逻辑随重放就位但后端无数据，徽标永远不亮，本轮闭环
- **冒烟全绿**：teaching-cases 全量/病种过滤、similar 症状检索命中教学池、diagnose 相似医案 3 条 teaching=true、POST cases 落盘核验、disease-kb 浏览器端到端渲染 160 池
- **对拍门 PASS**（零差异 + Recall Δ≤0.02）+ 巡检 clean（missing_api 0）+ 漂移守卫 rc=0
- **巡检加固**：seed 监控名单补 teaching-cases.json（教学池扩编防漏跟）
- **口径澄清**：L4 page_gap=53 是「tcm app vs 主栈 app」口径；medical-stack/app 与 tcm 页面层差为 0（66 vs 65，多 1 页为本侧自有）——页面层已全量对齐
- 测试数据已清（冒烟病例落盘件删除）；纪律合规：只移植不训练，教学池只进检索演示面不进签发/孪生

## 2026-09-03 午 · tcm v1.4.3 增量 3 条差集吸收完成（D9-D12 居家检验解读链 + E2 召回升级）
- **背景**：09-03 早巡检新检出 3 条 API 差集（get /api/lab/panel、post /api/lab/interpret、post /api/family/revisits/escalate），按 TCM-ABSORPTION-SPEC 全流程吸收（移植→适配→冒烟→对拍门→留证），溯源 tcm HEAD dc2acb0
- **lab-interpreter.js 整件移植**：56 项指标目录/别名/拼音首字母/文本解析/白话判读，无外部依赖，node --check 过
- **twin-engine.js 整件追平 dc2acb0**（原基线 17dc1ce 滞后）：D11 declining_health 只看临床事件、persistent_lab_abnormal 中危召回、home_lab 快照不注入健康分、latestScored 面板口径、E2 启动回填 skipEscalate、E4 处方/随访不单独复活孪生、回填④居家解读源、lab_trajectory 入 panel——diff 核对仅头部标注差异
- **api-server.js 四块**：① labInterpreter/smsAdapter 依赖引入；② HOME_LAB_FILE + homeLabAdd/homeLabLatest（每患者 20 份落盘 lab-interpretations.json）；③ /api/clinic/session 建档 D10 居家旁证自动并入（90 天窗口、source:'home' 标记、evidence 时间线 🏠 条目、home_lab_merged 防 PUT 重复、响应带 home_labs）；④ /api/lab/panel + /api/lab/interpret 路由 + escalateStaleRevisits + POST /api/family/revisits/escalate + GET revisits 惰性触发
- **适配点**（tcm → 本侧）：reportLink.linkByToken/pushForPatient → family-reflux linkByToken（新导出，凭 lnk_ 令牌反查 reflux_links）/ pushByPhone（自带命理守卫+白名单+本院收件箱）；tcm 自由文本短信 → 本侧模板化 sms_adapter（新增 followup_recheck / revisit_escalate 两模板，品牌按 ADR-009 作【命理宝鉴·医道】，命理守卫内置）；patient_id 由 patientIndex.resolvePatientId(null, patient_name) 解析
- **冒烟全绿**：panel 54 项双侧清单一致；interpret 五入参（labs 数组/text 文本/空 400/不识文本 422/性别年龄）全过；归档链端到端——lnk_ 绑定 → interpret 归档 → lab-interpretations.json 落盘 → twin home_lab 快照（event_id 幂等）→ FU-LAB 复查单（urgency=soon 7 天）→ mock 短信 outbox 落盘 → family hospital_reports 送达；30 天幂等二次不重复建单；命理守卫阴性（八字/日主/排盘标题 MINGLI_STRIPPED_BLOCK 拒发）；escalate 49h 陈旧单升级 channel=sms、二次调用幂等 0；GET revisits 惰性触发验证；D10 建档并入 home_labs 计数正确
- **对拍门 PASS**：`equiv-dual-run.py --gate absorb` 端点零差异 + Recall@K 双侧 0.8333/0.8333 Δ=0.0000（≤0.02），gate_token 已写（TTL 1800s）
- **顺手根修 L2 盲区**：capability-diff.py exports() 原正则只抓两空格缩进方法简写，漏 module.exports 裸标识符列表（twin-engine snapshotFromHomeLab 漏报即实证）——补键值对+裸标识符双形式解析
- **巡检复跑 clean**：missing_api 0、module_diffs 空（smsChannel 已补等价导出）、seed_missing 空、processor_drift 空、js_drift 空；page_gap 53 属 G16 L4 定性表管理范围不阻断
- **测试数据全清**：reflux_links/lab-interpretations/twin 档/FU-LAB 单/RV-SMOKE 双单/phone-vault/consult-session/outbox 测试行/family hospital_reports 测试行/patients.sqlite 冒烟患者 4 行，WAL checkpoint 已做；全程虚构数据，纪律合规（只移植不训练、命理合流仅限批注层）

## 2026-09-03 早 · 防线扩 js 层：js-adapt-registry 单一真源 + L4.5 升级 + 守卫 --staged 扩 js
- **登记册外置**：KNOWN_JS_ADAPT 从 capability-diff.py 内嵌字典迁到 `medical-stack/patches/js-adapt-registry.json`（known_adapt 4 项 + 新增 ms_own 2 项：mingli-annotation-view.js / reflux-badge.js），capability-diff 与 check-tcm-page-drift 共读一源，两处口径永不漂移
- **L4.5 升级**：扫描从顶层 *.js 扩到 rglob（vendor/ 子目录纳管——vendor/qrcode.min.js 双侧哈希一致已备注）；ms 侧多出文件分档：⚪ ms 自有（已登记）/ ⚠ 未登记（提示登记，不破 clean）
- **守卫 --staged 扩 js**：staged 的 medical-stack/app/js/** 逐一核——ms_own 放行 / 与 tcm 同哈希放行 / 有差异须 known_adapt 登记 / 新文件须 ms_own 登记，违规 rc=1 拦截带指引
- **事实勘定**：共享 js 无覆盖式重放器（js 不会被抹，与页面层风险模型不同），js 层真实风险是「未登记适配/自有文件无账可查」，本次按此建模
- **正负向实测**：干净态 rc=0；改 common.js 未登记 → rc=1 拦截；新 js 未登记 ms_own → rc=1；已登记 reflux-badge.js → 放行；capability-diff 复跑报告新口径正确（4 适配+2 自有）
- 旁出：本次复跑巡检新检出 tcm v1.4.3 增量差集 3 条（get /api/lab/panel、post /api/lab/interpret、post /api/family/revisits/escalate），走 TCM-ABSORPTION-SPEC 待吸收

## 2026-09-03 早 · G18 防线上线：tcm 源页面漂移守卫（check-tcm-page-drift.py）
- **动机**：09-02 两起重放吞改动事故（13:21 诊台内联徽标被抹；377a772 提交窗口期 pharmacy/dashboard 被抹成空壳提交）——补丁化解决存量，本守卫解决增量：让「未补丁化本地差异」在提交前和重放前都能被看见
- **守卫脚本** `scripts/check-tcm-page-drift.py` 双模式：
  - 链上审计（挂 tcm-import-and-follow.sh 链 2a，先于重放跑）：全量 --check 漂移逐页判定来源——tcm 基线 24h 有提交**或 tcm 工作区有未提交改动** = 正常追平（rc=0，重放器随后自动抹平）；否则 = 疑似未补丁化本地改动（rc=2 告警转人工），事件落 `DELIVERY/patch-drift-<date>.json`
  - pre-commit（挂 .husky/pre-commit）：staged 的 medical-stack/app/*.html 与漂移页相交即 rc=1 拦截，打印处置指引（补丁化 or 先 reapply 追平）
- **配套**：reapply-patches.py --check 输出补 `replayed_pages` 页名清单（守卫依赖）
- **正负向实测**：干净态双模式 rc=0；手改 acupuncture（未补丁化）→ 链模式 rc=2 + 台账记录、staged 模式 rc=1 带指引拦截；clinic-desk 漂移正确判定为 tcm 未提交基线改动（不误报）；重放自动追平验证
- 注：本仓日常提交走 `--no-verify`（husky 另有 rules-check L1），钩子守护的是不绕过钩子的提交路径；链上审计是兜底主防线

## 2026-09-02 晚 · pharmacy/doctor-dashboard 徽标补丁化 + 提交窗口期重放吞改动事故补记
- **排查结论**：三处接线页中 pharmacy.html、doctor-dashboard.html 为 tcm 源页面（必须补丁化，否则重放即抹）；unified-consultation.html 为 mingli 自有页面（tcm 基线无此页），直接维护即可
- **事故补记（比 13:21 那次更早）**：午后 377a772 提交时，15min OTA 看守在「浏览器验证通过 → git add」的窗口期内重放了 pharmacy/dashboard，提交进去的其实是被抹版本——HEAD 里 pharmacy 只剩脚本标签、dashboard 接线全无。教训：tcm 源页面改动未补丁化之前，任何提交都可能提交到被抹状态
- **补丁化**：新增 `patches/mingli-view/pharmacy-reflux.json`（4 ops）与 `doctor-dashboard-reflux.json`（3 ops），reapply-patches.py 全绿（replayed=2, warns=0, smoke 2/2），重放产物与手改等价
- **实渲终验**：pharmacy 重放版带姓名处方行渲染 🏠○ 未绑定徽标（验证数据已清）；至此 G13 徽标四触点（诊台/药房/候诊/医技开单）全部固化——tcm 源页走补丁，自有页直维护

## 2026-09-02 晚 · 诊台徽标补丁化收敛 + R-REPLAY 事故根修（OTA 重放抹掉未注册改动）
- **事故**：13:21 OTA 补丁重放链按 tcm 基线重放 clinic-desk.html，把 13:15 提交的内联徽标改动整体抹掉（G18 纪律本就不允许手改 tcm 源页面本侧副本——本次属违规直改被机制正确回滚）
- **正规化收敛**：徽标注册为 mingli-view 补丁 `patches/mingli-view/clinic-desk-reflux.json`（4 ops：组件脚本注入 + 徽标容器注入 + 姓名确认核查钩子 + 签发后 2.5s 延迟刷新），clinic-desk 从内联实现收敛到共享 reflux-badge.js 组件（引导模态改组件懒创建单例，页面零模态 HTML）
- **重放验证**：reapply-patches.py 全绿（replayed=1, warns=0, smoke ok）；此后任何 tcm 基线增量重放都会自动重挂徽标，不再丢失
- **实渲回归**：诊台未绑定态徽标+扫码引导模态+QR canvas 全过；patient-portal「我的报告」二维码确认复活（vendor 补齐生效，QRCode function + canvas 渲染）

## 2026-09-02 午后 · 回流徽标全签发触点推广 + R-G13CORS 根修（跨端口 ACAO 缺失）
- **共享组件**：新增 `js/reflux-badge.js`（medical-stack 与主栈 app/js 双落位）——attach 单患者徽标 / decorateRows 列表批量装饰 / guide 扫码引导模态（懒创建单例），统一 mini 态（🏠✓ 已绑定 / 🏠○ 未绑定点击出码）
- **批量接口**：`POST /api/reflux/status-batch`（≤50 名，同 patient-status 口径轻量返回 bound + last_delivery），列表页一次查全
- **三触点接线**：① pharmacy 药房处方列表——患者列改姓名优先（处方记录与列表投影双双补 patient_name 字段，此前列表只带 empi 号人读不友好也核不了绑定）+ 行内 mini 徽标；② doctor-dashboard 候诊队列 10 项全挂 mini 徽标；③ unified-consultation 医技开单——姓名输入/从就诊带入即核查（跨端口直连 8972）
- **R-G13CORS 根修（潜伏 bug）**：family-reflux 路由注册在 CORS 中间件之前（line 87），跨端口页面永远拿不到 ACAO 头——此前同源代理掩盖，问诊台（8900→8972）一接就 "Failed to fetch"。注册移至 CORS 之后，浏览器实测跨端口徽标出数
- **实渲验证**：药房「回流状态测→🏠✓」、候诊队列 10×🏠○、医技开单「已绑定 138\*\*\*\*7777 · 最近送达 💊✓」三页全过；测试数据双侧清零（处方/收件箱/绑定/EMPI/孪生/family 报告行），WAL checkpoint 压实
- 注：clinic-desk 诊台徽标为先行内联版（已验收），后续可收敛到共享组件

## 2026-09-02 午 · 医生诊台「家庭端回流状态」可视标识（G13 运营化收口）
- **后端**：`GET /api/reflux/patient-status?patient_name=`——与 pushForName 同一解析链核绑定（links.patient_name ∪ 历史预约手机号），返回脱敏手机号/绑定时间/最近 10 条送达记录（含 pushed_family 送达标记）/引导绑定 URL（FAMILY_BASE 主机名自动换本机局域网 IP，患者手机扫码可达）
- **前端**（clinic-desk 诊台）：患者信息卡下新增回流徽标——已绑定显绿「已绑定 138****7777 · 最近送达 📋✓💊✓」，未绑定显橙「未绑定」+「📱 扫码绑定」chip；姓名确认即自动核查（挂 scheduleArchiveFetch 同节奏），签发成功后 2.5s 自刷新带上本份病历
- **扫码引导模态**：弹层出 family 绑定页二维码（qrcodejs 180px）+ 三步引导文案，医生诊间扫码即绑，绑定后病历/处方/检验自动推送
- **顺手修真**：`js/vendor/qrcode.min.js` 补齐（qrcodejs 1.0.0 本地 vendor，19.9KB）——patient-portal.html 等 4 页此前引用该路径但文件不存在，我的报告页二维码一直是死引用，一并修复
- **实测**：浏览器实渲双态徽标（已绑定绿态含送达记录 / 未绑定橙态含扫码 chip）+ 模态 QR canvas 渲染确认；接口双态 curl 过；测试数据双侧清零

## 2026-09-02 早 · EMR/处方/检验三类自动回流家庭端（G13 自动触发补全）
- **背景**：家庭端时间线能力覆盖复核发现真缺口——此前仅 revisit 两类事件自动回流，EMR/处方/检验只有 `/api/reflux/push` 手动通道，诊疗主链无任何自动触发
- **身份桥**：reflux_links 表加 `patient_name` 列；新增 `pushForName(name, report)` 解析链——绑定登记的 patient_name 精确匹配 ∪ appointments 该姓名历史预约手机号（须已绑定）→ 去重逐个 pushByPhone；解析不到静默跳过（`not_bound`/`no_name`），绝不阻断诊疗主流程
- **三触发点**（均 fire-and-forget，setImmediate 后异步推送）：
  - 病历定稿（`/api/tcm/case-confirm`）→ `emr`「门诊病历 · {辨证}」（患者/主诉/辨证/症状/方剂组合）
  - 处方签发（`/api/prescription/create`）→ `prescription`「中药处方 · {辨证}」（组成前 20 味+剂数+医嘱）
  - 检验回传（`/api/lab/result`）→ `lab`「检验报告 · {项目}」（指标+数值+单位+参考区间）
- **互操作**：载荷组装全角化尖括号（`＜＞`）——family XSS 清洗拒收半角 `<>`（tcm 移植教训复用）；命理守卫与白名单校验沿用 pushByPhone 既有闸口，医学域内容零命理词
- **E2E 冒烟 11/11 过**：family 绑定（mock 验证码→link_token）→ reflux/link 登记（带 patient_name）→ case-confirm/prescription/lab 三连触发 → family 收件箱实收 emr/prescription/lab 三类；阴性：未绑定患者同链推送静默跳过且 family 零收到
- 测试数据双侧清零（confirmed-cases/records.jsonl/lab-orders/reflux_links/family 报告行+绑定/outbox 测试行），8972 重启重载干净状态

## 2026-09-01 深夜 · 复诊安排回流家庭端（G13 契约扩展 revisit · 双侧同步）
- **契约扩展**：hospital-report report_type 白名单双侧同步加 `revisit`（复诊/召回安排，医学域流程性内容；命理守卫双侧继续生效）
- **mingli 供给侧**：family-reflux 抽出 `pushByPhone` 模块内助手（绑定核查→命理守卫→白名单组装→推 family+落本院收件箱，与 HTTP 路由同逻辑）；from-recall 排期成功即推「复诊安排」、revisit/complete 闭环即推「复诊已完成」（手机号经 appointment recall_id 反查，查不到跳过不阻断）
- **family 消费侧**：hospital_inbox REPORT_TYPES +revisit；reports.html 类型中文标签映射（📋病历/💊处方/🧪检验/📅复诊安排）
- **端到端实测**：family 绑定流（mock 验证码→link_token）→ mingli 登记关联 → 召回排期 → family 收件箱实收「复诊安排 2026-09-02 14:00」→ 复诊闭环 → 实收「复诊已完成」；阴性测试：载荷带「八字/流年」被守卫 422 拒发（MINGLI_STRIPPED_BLOCK）
- 测试数据双侧清零（召回单/预约/绑定/收件箱/family 报告行）

## 2026-09-01 晚 · D7 爽约自动召回链吸收（召回三源闭环收官）
- 移植 tcm 契约 v1.3.6：爽约懒清扫升级——no_show 标记 + 爽约短信通知 + **自动建召回单进医生待办**（source=noshow，appointment_id 判重幂等）；顺带补齐临诊 1 小时提醒（appointments 表加 reminded_at/noshow_at 列）
- 新增短信模板 appointment_noshow（机构版话术，零命理词）
- 端到端实测：建今日已过时段预约 → 读路径触发懒清扫 → no_show + mock 短信落 outbox + RV-NS 召回单自动建 → 二次清扫零重复（幂等过）→ recall-stats 三源分源聚合（twin-risk/noshow）→ 医生工作台召回面板「爽约召回」徽标渲染正常
- 冒烟合成数据已清（预约+召回单），outbox 留证；巡检复跑 clean
- 至此召回三源全部贯通：**孪生风险（D5）/ 随访加重（R719）/ 爽约提级（D7）** → 统一召回单 → D6 排期占号 → D8 成效统计

## 2026-09-01 晚 · 召回面板全链贯通 + R-ISO 代理隔离根修 + L4.5 共享js同源监控
- **召回面板浏览器实测全链过**：医生工作台（8973/doctor-dashboard）召回面板渲染 → 排期 → 选时段占号 → 预约 booked + 召回单 scheduled 双向链接（RV-TWIN-MTI86SPC ↔ appt-3e5832754acb，EMPI 解析患者名）→ pending 面板自动清零
- **R-ISO 根修（重大隐患）**：medical-static（8973）代理默认曾指向 tcm 8932 上游——内化栈页面一直打供体 API，构成运行时越域依赖且掩盖本栈端点缺口。修为默认 8972（MS_API_PORT 环境变量+文件默认值双保险），重启后 8973/api/tcm/health 报「命理宝鉴·医道」
- **隔离修复后暴露的静默失效**：召回面板调 `authFetch` 而 ms common.js 缺 R854 定义——页面同名不代表同源。已补 authFetch 并全量扫描共享 js：对齐 efficacy-page.js（GAP-P2 服务端疗效）、longitudinal-page.js（R866 后端患者档案合并）、seed-loader.js（R864 V2.0 生产不自动注入假数据）、nav.js（补 fhub/consult/insur 条目+角色清单，品牌锚文本改「命理宝鉴·医道」），config-engine/i18n 品牌可见串修正
- **巡检进化 L4.5**：capability-diff 新增共享 js 哈希比对层（KNOWN_JS_ADAPT 登记有意适配），专治「页面重放了、依赖的共享 js 没跟上」类静默失效
- **当日增量当日清**：tcm 契约 v1.3.7（D8 recall-stats 召回成效统计）随访链到达即吸收——路由适配 ms sqlite 预约域（no_show 口径），冒烟实测响应率/闭环率/爽约率/分源聚合正确；finance.html 面板块此前已重放到位，API 一通即活
- 巡检复跑 clean（missing_api=0 / 处理器零漂移 / js 零未登记漂移）

## 2026-09-01 · 孪生召回闭环吸收（tcm 契约 v1.3.4/v1.3.5 · D3+D5+D6 全链）
- **模块**：`twin-engine.js`（417 行原样移植，头部标来源）——真实诊疗事件→快照→健康评分/五脏/体质（ZYYXH/T157-2009 转化分口径）/趋势/风险/证型轨迹；`data/twin/<pid>.json` 原子写
- **三路由**：`GET /api/tcm/twin`（姓名经 EMPI lookupByName 只读解析——patient-index 补此方法）、`POST /api/tcm/twin/snapshot`（医生补录，requireStaffRole 守卫同步移植）、`POST /api/clinic/appointment/from-recall`（D6：召回单→直建预约占号→双向链接→mock 短信；适配 ms sqlite 预约模型，appointments 表加 recall_id/source 列，容量规则=每档 3）
- **三钩子**：病历签发（case-confirm setImmediate）/处方签发（records.jsonl 追加后）/随访完成（followup/complete）→ 自动快照（event_id 幂等）；启动回填 backfillTwins 挂入 listen 回调
- **D5 风险召回**：chronic_condition/declining_health/persistent_tongue_abnormal 高危信号自动建召回单入 revisits.json（14 天去重 + 闭环 7 天静默）；followup_worsened 不重复建（R719 已覆盖）
- **冒烟全过**：2 枚手工快照（评分 51/C 连续 <60）→ 自动建 2 张召回单 → from-recall 排期 2026-09-02 09:00（booked + 双向链接 + mock 短信「模拟外发」落 outbox）→ 重放 409 / 无令牌 401 / event_id 幂等 added:false；冒烟数据已清（合成虚构）
- **对拍门**：equiv-dual-run --gate absorb PASS（端点零差异 + Recall@K 双侧 Δ=0.0000），放行令牌已写
- **巡检收口**：capability-diff 复跑 clean（missing_api=0）；L2 模块比对清单增 twin-engine.js（防后续导出漂移）
- 纪律：医学域只移植不训练；召回链全程无命理字段（R745/R756/R757 不触及）

## 2026-09-01 · L2.5 检索处理器特征哈希巡检（G17R 撤销令采纳项落地）
- `scripts/tcm-capability-diff.py` 新增 L2.5 层：`/api/tcm/kb/search`、`/api/tcm/kb/formula-recall` 两检索处理器函数体规范化哈希双侧比对（花括号配平抽取、跳过字符串/注释；规范化=标识符序列+运算符骨架），漂移/缺失即破坏 clean 态并入 digest
- 动机：G17 L2 红牌教训——路由/导出级 diff 看不见处理器内部排序逻辑漂移（R825/R829 曾漏移植致 21:15 返工）
- 实测：空白/注释扰动不误报 ✅、排序逻辑变更（系数 ×2）必检出 ✅；复跑双侧哈希一致（`4bd0daf0…`/`ac23b246…`），报告新增 L2.5 表格段
- 挂载既有跟随链（tcm-import.plist → tcm-import-and-follow.sh 链 5），无新增定时项
- 顺带检出 tcm 新差集：`get /api/tcm/twin`、`post /api/tcm/twin/snapshot`（D5 风险信号→主动召回闭环，契约 v1.3.4）→ KANBAN 列管待吸收（走 TCM-ABSORPTION-SPEC，医学域禁止二次训练）

## 2026-09-01 · WAL-F 斩草除根：全栈「按请求开关连接」模式清零
- **范围**：继昨夜根修 R772/orchestrator 两处后，本次扫净同类隐患 9 处——wellness-routes（withDb + 4 处直连）、person-hub-routes（openDb 泄漏型）、agent-feedback-engine（_openDB 泄漏型）、ai-stream-engine（openKbDb 只读）、api-server-v2（orchestrate/guide 泄漏型×2、staging/list、staging/reject、kb-fingerprint/integrity、verification 三路由×3）、distillation-routes（/stats）、kb-graph-builder、kb-tiered-matcher
- **统一修法**：yidao.db 连接全部改为进程期单例/复用主句柄，一律不 close；staging/reject 的 better-sqlite3 `.transaction()` 改为 node:sqlite 手工 BEGIN IMMEDIATE/COMMIT
- **安全豁免**：mingli.db 五处（无共享常驻句柄，自闭合无害）与 Python 子进程三处（独立进程）维持原样，已在代码注释说明
- **压测验证**：排盘×2 + 编排 + staging 读写 + 指纹 + 校验语料读写 + 蒸馏统计 + KB检索 + wellness 共 10 端点连续打满，WAL 探针全程零漂移（held=disk=28733602）；mingli/draft 回归草案即时磁盘可见（#13，已清理）；7 个改动文件 node --check 全过
- **模式定论**（写入团队规范）：本服务 yidao.db 句柄只允许两种形态——进程期单例，或独立子进程自闭合；**禁止任何"按请求 open→close"写法**，health-patrol R-WALF 守卫兜底

## 2026-09-01 · ADR-020 终局函执行：G17R 销账 + meta-only 2,637 条删除 + cron 指引交付
- **G17R 终局**：裁判裁定 22:22《撤销令》最终有效（23:47 批复=重复粘贴作废）；我侧按撤销令执行获确认，G17 ADR-019 全签销账
- **meta-only 删除（批准·三条件全落实）**：删除纯元数据占位条目 2,637 条（批复 2,628 + 同源 drift 9）；备份冷存扩展盘 `/Volumes/模型训练数据/cold-storage/kb-meta-only-backup-20260901-060002.json`（1.3MB，本机不留）；Recall 基线 `DELIVERY/kb-recall-baseline-20260901-060002.json`（20 词 FTS/普通双通道）；kb_formal/kb_fts5/kb_formal_fts 三轨同事务删除 75,545→72,908；toc-page 1,215 条按批复保留；删后 20 词检索复测零回归；**30 天观察期至 2026-10-01，无回归方可销备份**
- **cron 连败 2 项（批准转交付）**：控制台操作指引 `DELIVERY/cron-console-fix-guide-20260901.md`——周报 timeoutSeconds 120→300 为用户唯一待操作项；临床经验蒸馏经核验已是单步版（连败为历史计数残留）
- **旧账纪律**：C 类 13 页（08-30 已执行）、G17 L2、周报 300s 三条「待拍板」旧账核销；后续裁判裁决到达 24h 内销账

## 2026-08-31 深夜 · P0 事故：WAL 裂脑根修 + P2.8 问诊台双师全链终验通过
- **事故定性**：8920 主库 yidao.db 发生 WAL 裂脑——主句柄持续写入「失链孤儿 WAL」（磁盘不可见、进程重启即丢），今日 19:34 起全部写入（测试用户/病例 #31-37/处方签名）险遭灭失；并连带挖出 verification_corpus 表存量物理损坏（B-tree 野指针，08-30 备份中已存在，非本次事故造成）
- **真根因（以治法确诊）**：R772「排盘验证联动」在 /api/paipan/calculate 里按请求 `new better-sqlite3` 写连接 + `close()`——跨库（better-sqlite3 ↔ node:sqlite 主句柄）共存时，close 触发 SQLite 末连接语义删除/重建 -wal/-shm，主句柄沦为孤儿。POST /api/paipan/calculate 单发即可 100% 复现；Node fs 钩子打栈排除 JS 层删除，确认为 SQLite C 层行为
- **根修**：R772 改走主句柄（顺带修 ppKey 毫秒级撞键）；agent-orchestrator `_persistRun`/`getRunStats` 同病同修（yidao.db 连接单例化，进程期复用不 close）。修后压测：排盘×3 + 编排×1 + 草案/签名/处方/调剂/归档全链，WAL inode 零漂移，写入即时磁盘可见
- **数据抢救与重建**：幻影视图 14 件证据导出 /tmp/p28-salvage/；全库 `.recover` 重建（113 表行数与原库零差异，lost_and_found 1040 碎片均为失效页残片）；FTS5 双索引重建；integrity_check 转 ok；旧库留档 yidao.db.corrupt-20260831-splitbrain
- **守卫**：health-patrol 新增 R-WALF 规则——主 API 进程持有失链 wal inode 即告警；/tmp/wal-probe.sh 探针脚本留档
- **P2.8 终验（磁盘双视图一致）**：浏览器真实点击跑通 病例#23（批注#11 signed·master#29 → 处方#8 signed·doctor#29 → 调剂 → 归档 → emr_archived）与 病例#25（批注#12 → 处方#9 → 全链）。#24 为幻影世系误记，磁盘实际不存在，已核销。报告数据通路（加密草案解密+批注读取）实测正常
- **遗留观察项**：① sqlite3 CLI 外部打开偶发 CANTOPEN 抖动（重试即过，疑与检查点窗口竞争，记入 KANBAN P3）；② medical_cases.status 字段不随流程流转（日志链完整但状态字段停 pending_master，P3）；③ 裁判 G17R 批复（23:47 到）与 22:22《G17R 撤销令》冲突——撤销令更新且引用 ADR-019 全签结论，本轮按撤销令执行不建隔离，冲突已标记待裁判澄清

## 2026-08-31 · L2 红牌收口：检索内核移植 R825+R829（裁判拍板方案 A，六层验收转全绿）
- **真根因**（比原诊断更深一层）：B075 差案并非导出覆盖缺口——金匮截图证据条目双侧语料都在（精确标题查询双侧 top1 一致）；真因是 ms 检索内核滞后 tcm 三块：R829 切词窗口 6→14 + 二级重排逐字加成、R825 症状通道加权。窗口 6 把「板书实操」高区分度尾词丢弃，蒸馏笔记泛泛命中挤位
- **移植**（TCM-ABSORPTION-SPEC 流程，只适配不训练）：medical-stack/server/api-server.js 检索处理器补齐 R829（cap 14 + top-80 LCS 逐字加成）+ R825（symBoost 加权 + symptom_canon 响应标注）；依赖模块 symptom-index.js/aliases/formula-symptom-index  diff 验证原本就一致，纯接线
- **验收**：B075 双侧 top1 一致（金匮截图证据·金匮要略01）；对拍 PASS（端点零差异 + Recall 双侧 25/30 Δ=0.0000）；**G17 六层复跑全绿 PASS**（证据件 L*-evidence-20260831-211202.json）
- **机制教训**：L1 差集巡检只看路由/导出函数，看不到处理器内部排序逻辑漂移——L2 对拍门正是为此而设，本次实案验证其不可替代；后续可考虑把检索处理器特征哈希纳入巡检（已记 KANBAN P2）
- 边界说明：hits 总数 6744 vs 6733 的 11 条差是 R745 命理关键词过滤的合法边界（天纪等 18 条不回流），语料条数 53,559/53,559 相等

## 2026-08-31 · patrol 修真 + 48h SLA 三级上盘 + 差集 72h SLA 追踪（盘点收尾第一波）
- **patrol 读数失实修真**：① health-check.sh 结果只写日志不回显 stdout → 心跳 cron 看空气，已加回显（实测 ✅ HEALTHY 全文输出）；② 静默误报根因——patrol 监控的 server/kb/mingli-log.jsonl 写入方 mingli-tcm-daily-distill 已停用（08-26 起），改监控活跃产物 training-data/kb-web-distill/distill-*.jsonl 最新文件
- **cron 连败 2 项确诊**：家庭健康周报（模型调用 120s 超时×6 周，端点实测 17ms 健康）+ 临床经验蒸馏（payload 第二步脚本 batch-distill-clinical.py 已被 tmp 清理，agent 仍执行致 5 连败）。修复件已备好（超时 120→300 / payload 改单步），但 AutoClaw 运行时持有 jobs.json 内存态并回写覆盖文件直改（两次实测 mtime 回滚）——需控制台操作，步骤已落 KANBAN
- **48h SLA 三级预警上盘（P1）**：新组件 app/js/sla-tier-badge.js（24h 黄/36h 橙/48h 红四态，8974 旁路只读，60s 自刷）；问诊台 unified-consultation 队列面板升三级色阶+汇总胶囊；monitor-hub 监控总览新增「命理批注队列 SLA」卡（含明细列表）；两页 200 + 内联脚本 6 块 node --check 全过
- **差集吸收 72h SLA（P2）**：新 scripts/diff-sla-track.py——链5 状态条目级键（L1/L2/L3 + L4 超基线增量）首见计时、消失销账、超 72h 未定性 WARN；tcm-capability-diff.py 状态补 missing_api 条目清单；已接入 health-patrol 告警链（超时即上运维看板）；实测 clean rc=0

## 2026-08-31 · G18/G17 裁判任务书（ADR-017）：补丁化机制建成 + 六层验收 5/6（L2 留红待裁判）
- **G18 建成**：patches/ 三要素三类补丁（mingli-view/brand/disclaimer）+ reapply-patches.py 重放器（锚点失配 rc=2 转人工禁静默，台账落 DELIVERY/）；34 页废止整页重打包改补丁追平（page-follow.py 已删）；equiv-dual-run.py 对拍门两处必过（吸收激活门 + OTA publish 412/200 双向实测）
- **G17 验收（复跑 203051）**：L5 十节点冒烟 PASS（新增命理采集首节点：三路特征/授权门负例/医学上下文零泄漏）｜L1 差集 PASS（tcm HEAD 6925efc 新增 ops/contract+ops/kb-baseline 当日移植，契约 v1.1.0 内化）｜L3 知识一致性 PASS（53,559/53,559 条相等，抽样 200 指纹 1.0）｜L4 R745 三阴性 PASS｜L6 旅程 PASS（G10 outbox 落库 + G13 命理词 422 剥离 + 干净内容 inbox）
- **L2 留红待裁判**：端点零差异过、Recall@K Δ=0.0333（差案 B075，根因 tcm 运行时 KB 比权威导出多一批未导出条目 + ms 检索域含自有蒸馏条目）；三选项（tcm 补导出 / ms 检索域隔离 / 裁判调口径）见 DELIVERY/G17-delivery-report-20260831.md §3；未放行无令牌驻留，符合不过不激活
- 对照集冻结 testdata/equiv-set-v1/（30 金案+10 合成帧全虚构，MANIFEST 登记 sha）；十节点已挂 agent-selfcheck 每日节奏
- 交付报告：DELIVERY/G18-delivery-report-20260831.md、DELIVERY/G17-delivery-report-20260831.md；六层证据件 L*-evidence-20260831-203051.json

## 2026-08-31 · 医师工作台命理视图开关（进化建议 P1-① 落地，增量安全架构）
- 新组件 app/js/mingli-annotation-view.js（副本 medical-stack/app/js/）：按角色默认视角（命理师/管理员→全版，医生→简版），右下角 ☯ 开关一键切换并记忆；简版折叠 [data-mingli-detail] 仅留徽标；页面置 window.MINGLI_EMR_ID 时自动从 8974 批注层渲染批注面板（CORS 已验证放行 localhost 域）
- **唯一源头增量匹配**：tcm 源页面不直接改码——page-follow 新增 PAGE_INJECT 可重放补丁规则（treatment-center 医师工作台注入开关+URL emr 参数解析），重打包自动重放，本地增强永不丢；mingli 自有页（review-studio 双师审核台/medical-annotation-workbench）直接引用
- 浏览器实测：开关挂载、全版→简版折叠命理轨出徽标、还原，全过
- 机制说明入 TCM-ABSORPTION-SPEC 增补原则：命理对医学页的增强一律走「可重放补丁」或「独立 JS」，禁止直改 tcm 源页面

## 2026-08-31 · 合流链诊断修复 + 精准保障机制（对拍入看守链）
- **诊断**：合流链六节点全通（采集/诊断/命理草案/批注/签名/患者端一屏三件），唯一断头在采集端——问诊台一帧采集不传 consent，G15 命理并轨永不触发
- **修复**：unified-diagnosis.html 加「命理三相」授权门（ADR-008：本人/监护人互斥勾选、明确标注特征仅入批注层）；consent 随一帧请求传递；渲染层新增命理特征区（金色分域标识）与未授权提示——浏览器实测授权条展开/互斥/状态切换/请求体携带 consent 全过
- **机制**：新增 scripts/medical-stack-parity-check.py（同案对拍 tcm 8932 × medical-stack 8972，5 金案），并入看守包装器为链4c，FAIL 即破窗；首跑基线 PASS 5/5
- **规范**：TCM-ABSORPTION-SPEC 升 v1.1——「精准保障」三条（不训练/同案对拍/持续保真）+ 链路总览补 4b/4c
- **排期**：三条进化建议落 KANBAN（命理视图开关 P1 / 48h SLA 三级上盘 P1 / 差集吸收 72h SLA P2）

## 2026-08-31 · 医学栈每日探针上线（三项目巡检口径拉齐）
- 新增 scripts/medical-stack-daily-probe.sh：三服务在线（8972/8973/8974）+ 8973→8932 代理链真实命中 tcm-agent + 移植页/PWA 五路由 200 + KB 检索功能探针（固定查询词只读幂等，不写库不淤积）
- launchd 任务 com.mingli-baojian.medical-daily-probe 注册在册（每日 07:43，避开整半点），手动触发 10/10 全绿
- 口径与 family 第 12 项 G13 外发探针对齐：固定输入幂等、缺前置记警告不阻塞、失败即非零退出


## 2026-08-31 · 页面层自动跟随并入 G1 看守链（链4扩展）
- scripts/medical-stack-page-follow.py 升级为自动侦察模式：tcm app × medical-stack/app 全部 64 个同名页逐页 transform 比对，内容不等即重打包，幂等秒退；新增页不自动内化，仍走链5差集报告+人工定性（G16-2 纪律）
- 首轮自动侦察补抓 14 页漂移（mtime 法漏网：admin/index/login/patient-portal/pharmacy/report/mobile-interact/monitor-dashboard/realtime-assistant/wuzhen-diagnosis/clinic-stats/family-hub/inhouse-diagnosis/wearable-hub），含品牌残留修复与 seed-loader 补齐；冒烟判据改负向（无 TCM-Agent/tcm-agent 残留），13+1 全过
- 包装器 tcm-import-and-follow.sh 加第 2b 步，15min 轮询自动执行；全链实测 rc=0（import 幂等 / kb-follow lag=0 / page-follow 幂等 / diff clean，tcm HEAD 6090e0c 无新增差集）
- 更正前条记录：8931 系 tcm 自有静态服务端口，本侧 medical-static 由 plist 固定 8973，无端口冲突；冒烟基准 8973 维持

## 2026-08-31 · 页面层重打包：34 页拉齐 tcm HEAD（G16 排期执行）
- 机制：新增 scripts/medical-stack-page-follow.py——tcm HEAD 取页 → 补丁重放（canonical→mingli-medical / 品牌→命理宝鉴·医道 / seed-loader 按需注入）→ 品牌零残留+ADR-009 话术扫描 → 原子写入 → 8973 静态层逐页冒烟
- 结果：34/34 写入零告警，冒烟 34/34 PASS；8972 七能力健康复核正常
- 顺带收益：emr.html 获得 tcm R848 注入修复（escHtml+linkify）；rbac.html 清除 localStorage 演示口令块（admin/admin123 等硬编码）升级为 /api/admin/users 服务端鉴权
- 发现：8931 端口被 tcm-agent 静态服务占用（EADDRINUSE），本侧静态层实际在 8973；watchdog/冒烟基准已统一指向 8973，端口归属冲突待两项目协调
- 状态：medical-stack/page-follow-state.json

## 2026-08-31 · G15 命理视觉采集接线 + G16 差集清零
- **G15 命理采集**：unified-vision-routes 新增命理三相路由（fortune_face 面相三停/fortune_mole 痣相部位/fortune_palm 掌纹主线，mingli 域、结构化特征无断语）；一帧采集医学四诊与命理三相后台并行（Promise.all 并发无感），mingliFeatures 不进医学检索与辨证（R756/R757 实测无泄漏）；ADR-008 授权门（未授权跳过/独立入口 403 MINGLI_CONSENT_REQUIRED）；自检升级为真实 classify 触发懒加载（7/7 通过）；端到端演示：三路特征→8974 批注队列（ann-e0d2398a0d35，48h SLA 计时中）——证据 DELIVERY/g15-vision-wiring-20260831.json
- **G16 差集清零**：/api/public/clinic-links 确认已内化（medical-stack 4995 行，冒烟 200）；L4 页面差集 52 页三分法定性表落盘 DELIVERY/l4-page-triage-20260831.md——真缺口 0、已有等价 52（medical-stack/app 同名页）、架构定位 52（主 app/ 为命理域不放医学页）；另发现 34 页内容滞后于 tcm HEAD（08-27 快照），列 P2 页面层重打包排期；差集复跑 clean:true / missing_api 0「无待吸收增量」

## 2026-08-31 · 医学栈全量对齐 tcm（L4 页面差集清零）+ 能力清单收录
- **L4 真缺口补齐**：移植 my-reports.html（患者报告收件箱）+ family-hub.html（家庭中心）入 medical-stack/app，PWA 资产（pwa/ 六件）随页落地
- **静态服务修真**：medical-stack static-server 补 /pwa-inject.js /sw.js /manifest.json 三路由；launchd 环境下 sendFile/send 库 stat 异常（NotFoundError），改 readFile 直出（X-PWA-Route: readfile-v2 标记实测 200）
- **合作服务入口同步**：两页带 tcm 侧 mingli-entry 入口卡（经 8973→8932 代理取 /api/public/clinic-links，指向 8900 入口大厅），边界文案「命理参考 · 非医学诊断」原样保留
- **能力清单收录**：docs/TCM-MEDICAL-CAPABILITY-MAP.md（tcm 180+ 端点七域契约 v1.0）
- 巡检复核：能力差集 L1/L2/L3 全零（指纹 e7ae6f5b，tcm HEAD 563a1a3→4eba2e3）；两页无头实测 http 200 · 零 JS 报错（family-hub 需登录属正常守卫）

## 2026-08-31 · review-studio 签名链回归留证
- API 七步（两负例）+ UI 五步（一负例）全绿；证据 DELIVERY/review-studio-chain-regression-20260831.json



## 2026-08-31 · tcm 两阶段吸收 + 徽章图标化 + 命理融入链
- 移植层 tcm-ported-api.js 新建：18 路由适配挂载（CORS 后），数据落点与既有台账一致；family-reflux 增患者收件箱（patient-inbox.json）+ /api/my/reports
- auth.js 移植 listAllUsers/setUserEnabled/deleteUser/updateUserRole/loginByPhone + R853 SECRET 持久化；sms_adapter 移植 vault 四函数 + therapy_booked 模板
- 链5 能力差集巡检 scripts/tcm-capability-diff.py + TCM-ABSORPTION-SPEC.md v1.0；follow 脚本心跳修真
- 处方链：e_prescription.mingli_annotation_id（draft/sign/GET 三点），review-studio 定稿次序门
- 全站字符徽章→图标 36 处，text-icon-scan 规则加固（hero-seal/symbol/SVG text）


## 2026-08-31 · 生肖 P1 收尾 + 院内执行台
- 问事生肖语境：api-server-v2 新增 sxAskContext/sxPrependOverview，liunian/lucky/huangli(birthYear)/xingming-analyze 概述前置生肖+贵人白话
- 姓名生肖喜用：shengxiao-engine 新增 namingTips（KB naming 模块按生肖年检索）+ nobleZhis；xingming/analyze 挂 shengxiaoNaming/shengxiaoContext
- 择日贵人日：zeri personal 按 nobleZhis 标 nobleDay 并升 best（实测属马未日命中）
- 家庭流年：family-yearly-huajie 补刑/害/破太岁五态检测（复用 taiSui+taiSuiHuajie compact）
- 院内执行台 app/clinic-ops.html 新建：收费结算/库存台账/排班/随访四页签，API 全走 8972；center-org.html 门诊运营组新增药房台/院内执行台两卡（标题图 c-org-pharmacy/c-org-ops）
- 文字标识红线扫描通过；浏览器实测渲染与数据正常


## 2026-08-31 · 太岁×生肖知识激活 + 太岁工具修真
- 修真：minsu getTaisui 刑/害映射表与传统规则不符（2026 刑误鸡害误鼠），改 fanTaiSuiList 统一判定；新增 taiSuiDirection/suiPoDirection 方位字段
- shengxiao-engine 新增：ZHI_DIR/ZHI_MONTH/TAI_SUI_STATE_ADVICE 五态行事库、parseTaiSuiKb（星君/化解法/关键月份结构化解析）、taiSuiHuajie（plan 七段+compact 精简）、fanTaiSuiList（含 zhi 数组）
- 挂载：buildSection 生肖流年犯太岁年挂【化解方案】compact；/api/minsu/taisui 五类目各挂 huajie、个人化 fanTaisui 挂 huajie+huajieFull
- 实测：taisui 端点五类目正确且各带化解、八字报告 2026 值太岁化解 6 条（星君文烈将军/贵人羊虎狗/方位南北/应期五月子月/古籍四条）


## 2026-08-31 · 生肖知识激活 P0
- 新引擎 shengxiao-engine.js：relZhi/relAnimals（婚配五档 tier）/nobles（六合+三合贵人）/taiSui（值冲刑害破五态）/personality（zodiac 模块性别分述，修正文混排按性别抽行）/taiSuiKb（taisui 模块逐年条目，过滤 markdown 标题）/buildSection（报告段构建）
- norm-report-engine：generateNormReport 对 bazi/ziwei 注入 segSX「生肖关系」段（pillars 三级回退取值）；generateHehunReport 合婚判定切引擎五档，L4 性格适配/L5 相处建议按 tier/type 分支（新增六害/相刑/六破提示文案）
- 实测：bazi report segments 7 段含生肖关系、ziwei 同注入、hehun 三合上婚/六冲下婚判定正确


## 2026-08-31 · 生肖知识应用诊断
- 活体实测四报告：八字 150143 字符生肖仅 4 次且为巧合命中；紫微 144823 字符 0 次；六爻 0 次；合婚 32 次（六合/六冲判定正确但仅二态）
- 知识库盘点：生肖直接相关 251 条、zodiac 模块 60 条（男女分述性格+本命佛）、三合 1268/六合 1375/六冲 217/相刑 227/相害 160、taisui 12 生肖逐年条目——储备充足但解读引擎三中枢零引用
- 交付 DELIVERY/生肖知识应用诊断-20260831.md（实测矩阵+断点定位+七维应用规划+P0/P1/P2 补全方案）


## 2026-08-31 · P0 接口同构 + P1 药房台
- 盘点确认：医学执行段后端 tcm 已有且已全量内化 medical-stack(8972)——prescription 六态流转/inventory/schedule/followup/chronic/efficacy/safety/med-* 全部实测在线；按方案甲无需 tcm 再开发，mingli 直接活化适配
- G12 预约加 tcm 同构别名：/api/clinic/appointment{,/slots,/list,/checkin,/cancel}——checkin/cancel 收 body.id、create 接受 doctor_name（appointments 表加列）、list 支持日期维度（导诊台视角，手机号脱敏）
- G13 回流加 tcm 同构别名：/api/report-link/{bind,unbind,status,push-queue}——bind 兼容 family_token 字段，unbind/status 新增，push-queue 如实回报即时直推无队列
- 新页 app/pharmacy.html（药房台）：待审核队列（安全警示/加急标识）+ 处方全流转表（搜索/过滤/详情弹窗）+ verify 六 action 全流转（审核→调配→发药，药师姓名强制留痕 SEC-001）+ 药名点查条目卡片（/api/tcm/entry/info）+ 真实库存预警（/api/inventory）+ 机构版话术（ADR-009）
- 验证：别名全链 curl PASS；药房台浏览器实机 PASS（3 待审真实渲染、27 药名链接、假单探针正确 404、不改真实数据）；证据 DELIVERY/pharmacy-desk-20260831.png


## 2026-08-31 · 功能体系诊断 + 干支修真（黄历/择日切 lunar_python 权威源）
- 盘点：181 页/547 API，六大角色中心+总枢纽+问事/民俗/身份三专中心全在线；医学 API 对齐 tcm 92%，差集 13 条定性（G12 预约/G13 回流路径未与 tcm 同构 → P0 加别名）
- 修真 P0：黄历年月日干支+生肖由 toy 算法（产出非法「甲酉月」）切 daily-recommendation.py(lunar_python)；择日 v1 整月 subprocess 取权威干支/建除/值神/黄黑道/冲煞——实测 2026-09 嫁娶吉日全部权威（9-3 庚辰·成·金匮·黄道）
- 复核：太岁/流年公式合法无同病；择日 v2 本就走 zeri-engine.py 不受影响
- 交付：DELIVERY/功能体系诊断-20260831.md（全景图+对齐矩阵+流程断点+P0/P1/P2 清单）

## 2026-08-31 · G14 信众（信众服务旅程补全 · 全旅程 mock PASS）
- 发起求测：person-center 信众页新增表单——16 域类目（八字/紫微/六爻/奇门/六壬/梅花/风水/合婚/择日/姓名/手机号/车牌/占卜/人生规划/流年/家庭合盘，生辰依赖项标注）+ 事项 + 手机号 + **未成年双闸**（18 岁声明确认 + 出生年校验，2015 年生实测 422 MINOR_REJECTED）
- 后端 `POST /api/public/qiuce`：入队即调 normReportEngine 生成 AI 初稿（真引擎，实测产出「基于《渊海子平》古法推演」全文）→ 同步推 8974 批注队列（emr_id=QIUCE-N，当值命理师短信提醒自动发出）
- 报告自查：`GET /qiuce/mine`（时间线 + 状态标识 排队中/AI 初稿/命理师已核对，实时回查 8974 升级）+ `GET /qiuce/:id`（手机号归属校验只读详情，带核对人/时间/免责声明）；「再次求测」一键复测
- 信众×患者双身份：medical_cases 增 `patient_phone_hash`（emr-archive 写入时从 patientInfo.phone 落哈希），`GET /api/public/my-emr?phone=` 同手机号关联病历只读列表（实证病历 #30 关联到求测同号 138****0099）
- 话术红线：8974 批注短信按 QIUCE 前缀切信众版（「求测报告已完成命理师核对」/「新求测待核对」），医学话术不外溢到信众域；页面机构版声明 + 不诱导不恐吓
- 验收：求测→排盘→批注核对→短信→报告自查→复测 全旅程 mock 通过（#1 已核对/#2 AI 初稿）；430px 视口零溢出；UI 五节点回归 PASS
- 证据：`DELIVERY/g11-pwa/g14-person-center-believer.png`（信众全旅程整页截图）；脚本 `scripts/g14-person-center-shot.js`

## 2026-08-31 · G11 PWA（移动端双端规范化 · 验收 PASS）
- 双端重切：`mobile-capture.html` 患者采集端（一帧采集/排队状态/报告查看入口）；`mobile-interact.html` 全量重写为「命理师核对台」——批注队列 48h SLA 倒计时 + 核对/驳回 + 批注历史（8974 新增 `GET /api/annotation-history`）+ G10 短信码鉴权门（未验证只读队列）
- PWA 四件套：`app/pwa/pwa-inject.js`（注册 SW + 安装到桌面按钮 + 安全区适配）；manifest/图标复用既有；四页（mobile-capture/mobile-interact/index/unified-consultation）注入完成
- 隐私红线（SW v6）：`SENSITIVE_RE`（emr/annotation/appoint/reflux/sms/patient/clinic/case/inbox）命中即 network-only 不拦截不落缓存；API 请求永不读写缓存；断网仅开壳
- 互链：采集端↔核对台↔桌面问诊台↔首页 全通；首页患者区加「移动采集」、命理师区加「移动核对台」图片卡片
- 验收实测：鉴权→发码（mock outbox 取码）→核对通过→患者完成通知短信 全链过；puppeteer 430px 视口零横向溢出；断网开壳双端通过；缓存 30 条零敏感/API；UI 回归 PASS
- 证据：`DELIVERY/g11-pwa/`（mobile-interact-430.png / mobile-capture-430.png / mobile-interact-offline.png）；脚本 `scripts/g11-mobile-check.js`、`scripts/g11-offline-check.js`

## 2026-08-30 · G13 回流（医院报告回流家庭端 · 供给侧 · 验收 PASS）
- 新增 `medical-stack/server/family-reflux.js`：`/api/reflux/link`（phone↔link_token 绑定，共库 appointments.db `reflux_links` 表）、`/api/reflux/push`（白名单结构组装 + 命理词守卫 422）、`/api/reflux/links`（脱敏核查）
- 推送目标 family 8970 `/api/inbox/hospital-report`；只推医学域（emr/prescription/lab），**命理批注一律剥离**，信众命理报告不回流
- 验收：family bind-code→bind 真 token → link → push emr 报告 family accepted；阴性 A 本院守卫拦（日主/八字/大运 422）；阴性 B 带 annotation 字段被 family 拒 `MINGLI_ANNOTATION_REJECTED`

## 2026-08-30 · G12 预约（轻预约挂号 · 全流程 mock PASS）
- 新增 `medical-stack/server/appointment-api.js`（better-sqlite3，`data/appointments.db`）：appointment 模型 + slots（09:00-11:00/14:00-16:00 每 30min 容量 3）/创建/checkin/cancel 四 API + 爽约自动标记（读路径懒标记 + 15min 轮询）+ G10 短信通知（mock）；不做号源收费
- 实测：创建/防重 409/签到/已签到禁取消 409/取消+短信/我的预约 全过；接口与 tcm 同规格同构

## 2026-08-30 · G10 短信（验证与提醒适配层 · 四场景全验）
- 新增 `medical-stack/server/sms_adapter.js`：send_code（6 位/5 分钟/频控/哈希落库/错 5 锁 10 分钟）+ send_notice；通道配置 `config/carrier-config.local.json`（凭据已 gitignore）
- mock 模式写 `data/sms-outbox/YYYY-MM-DD.jsonl`，标注「模拟外发」；`containsMingli` 守卫保证短信不含命理断语（阴性测试过）
- 四场景接入：①命理师登录验证码（8974 `/api/sms/send-code|verify-code`）②批注待核对提醒当值命理师 ③批注完成通知患者 ④病历/报告出具通知（8920 emr-archive created → report_ready，机构版话术）
- 修复：verifyCode 成功即焚误删 sends 频控状态 → 只清 hash 保留频控
- 提交：主仓 `6022da6`；server 子仓 `cceeff3`

## 2026-08-30 · G5 端到端冒烟复跑（九节点真链路 · PASS）
- 链路：建档叫号 → 一帧四诊诊断(8972) → EMR 生成 → AI 命理批注(8974) → 队列 SLA 核验 → 命理师 approve → 病历+药方 → 队列流转 → **合并报告（8920 归档 + emr-report + 批注签发两态读回，新链路）**
- 冒烟病例：`CASE-1788092387740`（患者 `empi-c2701d184166`，病历号 8920 #22，处方 `rx-4341e044`）
- 守卫全绿：R756 诊断无命理泄漏 ✓ / R757 辨证无命理词 ✓ / SLA 48h 计时 ✓ / 合并报告 mingli 段+免责声明 ✓
- 关键时间戳：20:19:47 全链 9 节点（总耗时 <1s，单节点最长 259ms）；批注 `ann-68d59e73b7e3`/`ann-01f309983cac` 均 pending→approved 水印解除
- 证据：`DELIVERY/g5-smoke-evidence-20260830-201948.json`（脚本 `scripts/g5-smoke-e2e.py` 已扩至九节点，可重复回归）

## 2026-08-16 · v1.0.0（商用就绪基线）
- 新增 LICENSE（专有软件许可 · 商用授权）
- 新增 COMPLIANCE.md（第三方依赖合规清单）
- 新增 DISCLAIMER.md（服务边界免责声明）
- 商用就绪度评分卡首评（详见 check-commercial-readiness.py）

## 2026-09-17 10:20 · R795 AutoClaw 正式接管 + 养生域 KB 建设启动
- 【接管】用户令确认定位边界后接管 Kimi 侧开发（其 G10-G26 任务书全链留证已核验，无未同步产出），接管宣言 docs/AGENT-TAKEOVER-20260917.md（含双智能体对照机制）
- 【养生域启动】夜间蒸馏主题池置入节气养生（module=yangsheng），今日蒸馏 20 条走 R793 五红线入库 9 条（yangsheng 5 + huangli 4，SRC-WEB-DISTILL / trust 0.6 / 指纹幂等跳重 11），fts5 守卫同步对齐（251,237）
- 【待办闭环】G21 验收实查早已闭环（family 9/5、9/7 三次验包留证）；WAL 哨兵收敛；feedback-aggregator 复测通过；faith-deities-detail 核实为结构性消费不删

## 2026-09-20 11:10 · R815 全量诊断+修复批次（网关重启恢复轮）

- **KB 五红线破防修复**：三天增量蒸馏致 fts5 漂移（主表 316783 vs fts5 316359、同文重复组 830、空壳 17、无出处 7）→ kb-sync-guard --purge-empty/--normalize/--full 三连 + 红线4 手工补 src_id（地脉道听课笔记，与既有 SRC-PCS 口径一致）→ **五红线全绿（316783=316783）**。教训：每日 06:10 kb-quality-patrol 正常在岗，但 patrol 告警进后台日志未被人工消费——巡检告警需要「有人看」的闭环，R816 候选：patrol 告警接微信后台号。
- **今早早推 error 根修**：06:30 run 中断于模型自加的 diff 验证（raw vs annotated 必然不同，diff 非零误判失败）；守卫 07:16 已自动补发（messageId 在案）。修真：早推/暮推任务书加 R815 禁令（禁 diff 加戏、禁任务书外自加验证命令，唯一验收=四查+messageId）。10:54 主会话 force 守卫致用户收到两条重复早推——教训：守卫 force 前必须查当日补发记录（push-patrol.log），与 9/15 守卫互斥锁教训同源。
- **推送内容核验**：今早补发版主日期 9月20日 ✅、中秋预告 1 处 ✅（9/24 月光菩萨诞倒计时已挂）。
- **WO-002 轮值推进**：Kimi 活跃执行中（今早 10:50 probe-v90 探针日志），未弃单、48h 时限顺延口径按 R797 24h 复核条款处理；AutoClaw 补根因旁证入 WO 文件（8960 直探实证：v9.0 返回 `B <{/s}> 请编辑`，chat template 停止符泄漏致 harness 解析全空——解析层 bug 非模型问题），修法与证据已写明，driver 可直接落手。
- **主仓 push**：积压 13 commit 本轮补推（含 R800-R813 submodule 指针与 R802 巡检语义分级）。
