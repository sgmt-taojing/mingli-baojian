# mingli-baojian 更新日志


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
