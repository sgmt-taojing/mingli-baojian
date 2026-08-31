# mingli-baojian 更新日志

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
