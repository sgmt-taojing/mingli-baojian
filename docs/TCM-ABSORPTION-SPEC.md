# TCM-ABSORPTION-SPEC · 中医标准智能体能力吸收规范（两阶段）

版本：v1.1 ｜ 生效：2026-08-31（v1.1 增精准保障与页面层/对拍入链） ｜ 依据：ADR-007（tcm 为医学能力唯一生产方）、能力覆盖审计-20260828、G1 任务书

## 〇、总原则（不可逾越）

1. **医学不训练**：mingli-baojian 不训练任何医学模型、不生产医学知识；医学能力一律移植自 tcm-agent，只做优化与适配。
2. **合流点唯一**：命理与医学的合流仅限 **8974 批注环节**（AI 命理草案 → 命理师审核签名 → 医生定稿随处方归档）。移植 tcm 新能力不得绕过 R745（数据边界）/ R756（医学内容无命理泄漏）/ R757（辨证结果无命理词降级）守卫。
3. **如实回报**：跟随链路每次运行留证据（状态文件 + 报告），停滞即暴露，不许静默。

## 一、一阶段 · 能力对齐（✅ 2026-08-31 完成）

目标：mingli 医学服务能力 = 中医标准智能体。

完成项（全部实测，证据见 KANBAN 2026-08-31 条目）：

| 层 | 内容 | 状态 |
|---|---|---|
| API 路由 | 方法+路径双维 diff 清零：18 条移植（login-phone/patients-phone/my-reports/ops×2/RBAC×4/therapy×4/tele×2/inventory-item/shift-delete/efficacy-records/send-code/admin-users/longitudinal-POST） | ✅ |
| 基础修真 | R853 同源两处：/api/auth/login 签真实 HMAC 令牌；JWT SECRET 落盘 data/.jwt-secret（0600）重启稳定 | ✅ |
| 短信 vault | hashPhone/vaultSet/vaultGet/vaultGetByHash 移植；therapy_booked 机构版模板 | ✅ |
| 种子数据 | doctor-profiles.json（3 医师，与 users.json 同 ID） | ✅ |
| 收件箱 | patient-inbox.json（G13 主落点，白名单载荷，family 拒收也可自查） | ✅ |
| 已知等价 | PWA 三静态（manifest/pwa-inject/sw）登记 KNOWN_EQUIV，勿重复建设 | ✅ |

## 二、二阶段 · 增量吸收（机制已上线，持续运行）

目标：tcm 后续增量成果按规划自动暴露、按流程吸收。

### 链路总览（15min 轮询，launchd com.mingli-baojian.tcm-import）

```
链3  import-tcm-kb.py            主镜像 KB → mingli 自有 yidao.db（mtime 幂等）
链4  medical-stack-kb-follow.py  主镜像 KB → medical-stack 内化快照（mtime 幂等 + 心跳落盘）
链4b medical-stack-page-follow.py tcm 页面增量 → medical-stack 页面层重打包（64 同名页 transform 比对，内容幂等）
链4c medical-stack-parity-check.py 同案对拍 tcm×medical-stack（精准保障，FAIL 即破窗当日处置）
链5  tcm-capability-diff.py      tcm 代码增量 → 四层差集巡检（digest 幂等）
```

### 链5 四层差集

| 层 | 比对内容 | 处置 |
|---|---|---|
| L1 API 路由 | 方法+路径 diff（tcm/server vs medical-stack） | 有差集 → 按「移植流程」吸收；已知等价登记 KNOWN_EQUIV |
| L2 关键模块 | auth.js / sms_adapter.js 导出函数 diff | 缺函数 → 移植适配 |
| L3 种子数据 | doctor-profiles.json 等 tcm/data 种子 | 缺 → 拷贝并核对与 users.json 一致性 |
| L4 页面层 | tcm/app vs mingli/app 页面数差 | 信息量参考，按三分法（真缺口/已有等价/架构定位）人工定性 |

### 移植流程（每条增量都要走完全程）

1. 读 `DELIVERY/tcm-capability-diff-latest.md` 差集明细（含 tcm HEAD，溯源可考）。
2. 移植进 `medical-stack/server/tcm-ported-api.js`（或对应模块），**只适配不改算法**；涉及话术按 ADR-009 机构版。
3. `node --check` → 重启 8972 → 逐端点冒烟（含边界：409/401/404）。
4. 守卫自查：R756 文本守卫、R757 降级触发、批注层不外溢。
5. KANBAN/CHANGELOG 留证（端点清单 + 实测证据 + tcm HEAD 溯源）。

### 监护与暴露

- 链 4 心跳：`medical-stack/kb-follow-state.json` 每轮必写（含 skipped），watchdog 第 4 链 lag ≤60min 可验。
- 链 5 指纹：`medical-stack/capability-diff-state.json` digest 变化才重写报告，防噪音。
- 报告落点：`DELIVERY/tcm-capability-diff-latest.md`（人读）+ state json（机读）。

## 三、精准保障（移植≠失真 · 简单三条）

目标：中医全量能力移植到命理宝鉴后，服务质量不低于生产方；接入命理能力只增维不减质。

1. **不训练**：任何医学模型/知识不二次训练、不蒸馏改写；只允许「移植 + 适配（品牌/话术/端口/鉴权）」。
2. **同案对拍**：每条移植能力入链前必须过 `medical-stack-parity-check.py`——同一输入同时打 tcm(8932) 与 medical-stack(8972)，HTTP 状态与关键字段一致才验收；金案只选确定性读接口，写接口以冒烟+边界码（401/404/409）验证。
3. **持续保真**：对拍随 15min 看守轮询常驻（链4c），verdict=FAIL 即「保真破窗」，当日处置并留证；状态落 `medical-stack/parity-check-state.json`。

首跑基线（2026-08-31 19:33）：PASS 5/5（七能力健康 / clinic-links / 词条即查 / 方反查边界一致性 / 条目名清单）。

## 四、命理内化挂载点（mingli 特有增量，勿回流 tcm）

```
一帧采集（舌/面/手 + 生辰/音视频）
  → 8972 /api/tcm/diagnose（医学诊断，= tcm 能力）
  → 8920 /api/clinic/mingli/draft（AI 命理草案，可 aiEnhance）
  → 命理师审核签名（mingli/sign，仅 master/super_admin）
  → 医生定稿（prescription/draft 挂 mingliAnnotationId → sign 复核已签态）
      · 电子处方随附命理结论归档（e_prescription.mingli_annotation_id）
      · 未附命理结论定稿：前端确认拦截 + 审计日志标注「无命理批注」
  → 调剂 → 归档（医学规范后向流转）
```

红线：命理批注不回流家庭端（reflux 结构性剥离 + 文本守卫）；短信只含流程通知（命理断语守卫）。

## 五、变更管理

- 本规范变更须更新版本号并记 CHANGELOG。
- KNOWN_EQUIV 新增条目必须注明 mingli 侧落点，防止「等价」变成「漏移植」的借口。
- tcm 侧架构性变更（新模块/新引擎）触发 L2 比对升级评审。
