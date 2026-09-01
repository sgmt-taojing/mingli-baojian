# 管理体系任务书 · G13-REVISIT-TCM（2026-09-02 · mingli 会话窗口起草，报管理体系转发 tcm 会话窗口执行）

> 依据：G13 契约扩展 revisit（2026-09-01 mingli×family 双侧已落地并 E2E 验收）+ ADR-007「唯一源头增量匹配」原则。
> family 消费侧已放行 `revisit` 类型（REPORT_TYPES 白名单+页面中文标签），tcm 供给侧未对齐——**tcm 的召回排期/复诊闭环目前只发短信，不回流家庭端**，同一患者在两家体系体验不一致。

## 背景事实（均已实测）

- 契约现状：family `hospital_inbox` REPORT_TYPES = `emr|prescription|lab|revisit`（2026-09-01 扩展，命理批注二次校验口径不变）。
- mingli 供给侧已对齐：`family-reflux.js` 抽出 `pushByPhone` 助手，from-recall 排期成功推「复诊安排」、revisit/complete 闭环推「复诊已完成」；E2E 实收两笔，命理守卫阴性测试 422 拒发。
- tcm 现状：`server/report-link.js:31` REPORT_TYPES 仅 `['emr','prescription','lab']`；`from-recall`（api-server.js:1863）与 `revisit/complete`（7096）无回流调用。

## 任务内容（tcm 侧，预估 ≤1h）

1. `server/report-link.js`：REPORT_TYPES 加 `'revisit'`（推送队列/审计逻辑无需改动，类型透传即可）。
2. `api-server.js` from-recall 路由：排期成功且取得手机号（`smsAdapter.vaultGet(patient_key)` 或入参 phone）后，调 report-link 推送：
   - `report_type: 'revisit'`，`report_id: revisit_id`
   - title：`复诊安排：{date} {slot}`；summary：机构版话术（参照 tcm 现有 recall-scheduled 短信文案，去掉短信头）
   - 失败不阻断主链（沿用 report-link 既有队列/审计语义——tcm 为队列重推模式，与 mingli 即时直推的差异属已知架构定位，不要求改）。
3. `api-server.js` revisit/complete 路由：闭环后推 `report_type: 'revisit'`、`report_id: revisit_id + '-done'`、title `复诊已完成`；手机号经 appointment `recall_id` 反查（tcm 内存态 appointments 直接查），查不到跳过。
4. 纪律：revisit 载荷只含流程性内容（时间/时段/医师/到诊指引），**禁止含辨证细节以外的任何命理字段**；推送仍过 report-link 既有守卫。

## 验收标准

1. E2E 1 例：family 绑定（mock 验证码）→ tcm /api/report-link/bind 登记 → 召回排期 → family `/api/inbox/reports` 实收 `revisit | 复诊安排`；revisit/complete → 实收 `revisit | 复诊已完成`。
2. 阴性 1 例：载荷带命理词 → 守卫拒发（参照 mingli 侧 MINGLI_STRIPPED_BLOCK 语义）。
3. 冒烟数据双侧清零；tcm CHANGELOG 记「G13 revisit 回流」。
4. 回报：tcm 侧提交哈希 + 验收证据 → 管理体系销账；mingli 侧 KANBAN 本项同步销账。

## 备注

- family 侧无需再动（已放行）；本任务为纯供给侧对齐。
- 若 tcm 排期/闭环路由行号漂移，以 `from-recall`、`revisit/complete` 路由名为锚。
