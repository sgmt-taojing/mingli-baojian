# mingli-baojian 更新日志

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
