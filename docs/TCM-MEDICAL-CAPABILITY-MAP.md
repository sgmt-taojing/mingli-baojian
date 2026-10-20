# 命理宝鉴（mingli）医学服务板块 · 能力匹配清单

- 版本：v1.0 · 2026-08-31
- 来源项目：tcm-agent（中医标准智能体，医院端核心服务系统）
- 适用对象：mingli 侧「医学服务板块」的集成方
- 生成依据：仓库路由全量扫描（180+ 端点）+ 缺口表 12 行真实能力审计 + 全链彩排 30/30、自检 16/16 绿

## 边界声明（先行）

1. 两套体系独立：tcm-agent 为医院端医学服务系统，mingli 为独立项目；本清单是**能力复用契约**，不意味数据或内容合并。
2. 命理黑名单过滤（R745）在案：同步链路对命理内容硬过滤，医学域输出天然无命理内容。
3. 复用方式两档：
   - **HTTP 直连**：mingli 以客户端身份调用 tcm-agent API（本机默认 8932 端口，生产按部署地址）。
   - **镜像解包内化**：只读快照（KB 镜像 / 精选集）同步到 mingli 侧自行消费，不依赖在线服务。
4. 鉴权：医师域端点需 `/api/auth/login` 取令牌（或 G10 手机验证码登录 `/api/auth/login-phone`）；标注「公开」的端点免令牌。

---

## 一、诊断引擎（核心资产，镜像内化首选）

| 能力 | 端点 / 资产 | 复用方式 | 说明 |
|---|---|---|---|
| 医学知识库 | `kb-store/`（53,579 条，含蒸馏层）+ SQLite 镜像 | 镜像内化 / HTTP | 证型 782 条（含正名表并入）、方剂、药材、穴位、病种五域 |
| KB 检索 | `GET /api/tcm/kb/search`、`GET /api/public/kb/realtime-search`（公开） | HTTP / 内化 | 首字母/拼音/别名检索，101 例 Recall@K 基线在案 |
| 证型条目 | `GET /api/tcm/entry/info`、`GET /api/tcm/entry/names` | HTTP | 辨证要点/代表方剂/加减法，B 类去证键自动归一 |
| 方剂组成展开 | `GET /api/tcm/formula/herbs`、`GET /api/tcm/formula/search` | HTTP | 经方→药味剂量明细 |
| 穴位检索 | `GET /api/tcm/acupoint/search` | HTTP | 穴位定位/主治/配伍 |
| 多模态诊断 | `POST /api/tcm/diagnose`、`/multi-modal-diagnose`、`/seven-diagnosis`、`/fusion-assess` | HTTP | 望闻问切融合，输出证型+说理+方剂建议 |
| 鉴别诊断说理 | `POST /api/tcm/inhouse-diagnose`、`/inhouse-next-symptom` | HTTP | 首选证型 rationale + 近证鉴别链 + 方证追问（副驾驶） |
| 面/舌/目/唇/手诊 | `POST /api/tcm/face-analyze`、`/tongue-analyze`、`/eye-analyze`、`/lip-analyze`、`/hand-analyze` | HTTP | 影像帧→结构化特征，接摄像头实时流 |
| 处方安全终审 | `POST /api/tcm/safety-check` | HTTP | 十八反十九畏+剂量+既往冲突，签发前硬闸，16 对抗用例全过 |
| 相似病例检索 | `GET /api/tcm/cases/similar` | HTTP | 按证型/症状召回历史确诊病历 |

## 二、处方全周期（签发→结算→发药闭环）

| 环节 | 端点 | 说明 |
|---|---|---|
| 创建/签发 | `POST /api/prescription/create`、`GET /api/prescription/:rxId` | 签发即自动计价 |
| 签发前终审 | 内嵌 safety-check（见上） | 不过终审不允许签发 |
| 结算 | `POST /api/prescription/settle`、`GET /api/prescription/unpaid` | 医保适配层 `server/insurance-adaptor.js` |
| 药房执行 | `POST /api/prescription/verify`（dispense/ready/complete） | 调配联动扣库存（幂等，不足 409 报缺药明细） |
| 审核队列 | `GET /api/prescription/review-queue`、`POST /api/review/create` | 医师审核留痕 |

## 三、病历与病程

| 能力 | 端点 | 说明 |
|---|---|---|
| 电子病历签发 | `POST /api/tcm/case-confirm`、`GET /api/tcm/cases` | 医生审核后成正式病历 |
| 纵向病程 | `GET /api/patient/timeline`、`/api/tcm/longitudinal-profile` | 病历∪处方∪随访主存储聚合，含近 30 天依从率 |
| 患者自查报告 | `GET /api/my/reports`（G13 患者收件箱） | 病历/处方/检验三类 |
| 报告回流 | `POST /api/report-link/bind` + 推送链（`server/report-link.js`） | 患者授权绑定后向家庭端推报告，重试队列+审计 |
| 检验单 | `POST /api/lab/order`、`POST /api/lab/result`、`GET /api/lab/orders` | 西医指标作中医诊断旁证 |

## 四、患者管理与服务闭环

| 能力 | 端点 | 说明 |
|---|---|---|
| 患者主索引 | `GET /api/patients/list`、`/api/patients/:id/history` | EMPI 级去重 |
| 预约挂号 | `POST /api/clinic/appointment`、`/checkin`、`/cancel`、`GET /slots` | 排班联动号源，停诊自动封锁，爽约自动标记 |
| 现场队列 | `POST /api/clinic/queue/checkin`、`/call`、`/action` | 预约到院优先入队 |
| 排班 | `GET /api/schedule`、`POST /api/schedule/shift`（+delete） | off 停诊压当日固定班 |
| 随访调度 | `POST /api/followup/create`、`/dispatch`、`/complete`、`GET /list` | 接 G10 短信 mock 链，逾期批量推送 |
| 家庭随访 | `GET /api/family/followups`、`/overdue`、`POST /followup/complete` | 家属代答、复诊预约 |
| 依从性 | `POST /api/home/med-adherence`、`GET /api/home/med-adherence` | 服药打卡回传入病程 |

## 五、经营与分析

| 能力 | 端点 | 说明 |
|---|---|---|
| 疗效分析 | `GET /api/tcm/efficacy-records`、`POST /api/tcm/efficacy-analysis` | 处方∪随访评分真实源，按病种聚合 |
| 病种追踪 | `GET /api/tcm/disease-track`、`/api/tcm/distill-trend` | 病种知识库沉淀，服务后续患者 |
| 慢病四维 | `POST /api/chronic/{htn,dm,ins,copd}/assess`、生活/用药/中医指导三面板 | 高血压/糖尿病/失眠/慢阻肺 |
| 财务概览 | `GET /api/finance/summary` | 结算侧汇总 |
| 运营质量门 | `GET /api/ops/quality-gates`、`/api/ops/ota-health` | 金标准/安全/走查指标 |

## 六、治疗与会诊

| 能力 | 端点 | 说明 |
|---|---|---|
| 治疗工单 | `GET/POST /api/therapy/orders`、`POST /api/therapy/order/status` | 针灸/推拿执行状态机，G10 短信通知 |
| 远程会诊 | `GET/POST /api/tele/consults`、`/api/consult/*` | 持久化会诊单；视频通道 WebRTC 待接（演示环境如实标注） |
| 急救分诊 | `GET /api/emergency/protocols`、`POST /api/emergency/event` | 院前引导话术（机构版，ADR-009） |

## 七、账户与安全

| 能力 | 端点 | 说明 |
|---|---|---|
| 登录 | `POST /api/auth/login`、`/api/auth/login-phone`（G10 验证码） | JWT 令牌 |
| RBAC | `GET/POST /api/admin/users*`（超管专属） | 角色/启用/删除，审计落盘 |
| 短信适配 | `server/sms_adapter.js` | mock 先行（写 outbox 不伪造成功），运营商通道凭据不进 git |
| 安全闸 | Origin 403 / 匿名 401 / 处方安全 16 对抗用例 | 自检常驻 |

---

## 推荐接入顺序（mingli 侧）

1. **第一批（镜像内化，零依赖）**：KB SQLite 镜像 + 精选集 → mingli 医学板块离线检索即日可用。
2. **第二批（HTTP 直连，高价值）**：`safety-check`（任何开方场景必接）、`kb/search`、`entry/info`、`formula/herbs`。
3. **第三批（场景化）**：纵向病程 / 疗效分析 / 慢病四维 —— mingli 若要承接医学服务闭环再接。

## 验收基线（本清单出具时）

- 全链彩排 30/30 · 自检 16/16 · 浏览器冒烟 64 页 · 诊断金标准 88.5%（阈值 ≥88%）· 处方安全 16/16
