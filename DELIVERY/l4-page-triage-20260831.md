# L4 页面差集 52 页三分法定性表（G16-2 · 2026-08-31）

来源：scripts/tcm-capability-diff.py `page_gap_count=52`（tcm-agent/app 有、mingli-baojian/app 无）。

## 一、结论

- **真缺口：0 页。** 52 页全部以同名文件落位 `medical-stack/app/`（医学页面层整体内化于 medical-stack，8972 服务面自有静态层）。
- **已有等价：52 页**（medical-stack/app/<同名>.html）。差集工具的 page_gap_count 只比「tcm app/ vs 主 app/」，未感知 medical-stack 页面层，属跨层计数参考而非缺口。
- **架构定位（不移植到主 app/）：52 页全部。** 理由：主 app/ 为命理域页面（排盘/问事/民俗/缘主服务），医学域页面按 ADR-007 归属 medical-stack 内化层；主 app/ 不放医学页是刻意架构，不是遗漏。
- **内容增量警示：18 页与 tcm HEAD 同步，34 页停留在 08-27 23:31 内化快照，tcm 侧已有更新。** G1 看守只重打包 KB 层，页面层增量不在自动跟随范围 → 列为吸收排期（见第四节）。

## 二、逐页定性

| tcm 页面 | 功能 | 定性 | 本侧落位 | 内容态 |
|---|---|---|---|---|
| acupuncture.html | 针灸治疗 | 已有等价 | medical-stack/app/acupuncture.html | 内容滞后(08-27快照) |
| admin-config.html | 运营配置 | 已有等价 | medical-stack/app/admin-config.html | 已同步 |
| ai-diagnosis.html | AI 问诊台 | 已有等价 | medical-stack/app/ai-diagnosis.html | 内容滞后(08-27快照) |
| call-center.html | 叫号中心 | 已有等价 | medical-stack/app/call-center.html | 内容滞后(08-27快照) |
| chronic-care.html | 慢病管理 | 已有等价 | medical-stack/app/chronic-care.html | 内容滞后(08-27快照) |
| chronic-disease.html | 慢病居家管理 | 已有等价 | medical-stack/app/chronic-disease.html | 已同步 |
| clinic-desk.html | 中医问诊台·无感四诊 | 已有等价 | medical-stack/app/clinic-desk.html | 内容滞后(08-27快照) |
| clinic-stats.html | 病历统计 | 已有等价 | medical-stack/app/clinic-stats.html | 已同步 |
| clinical.html | 四诊采集 | 已有等价 | medical-stack/app/clinical.html | 内容滞后(08-27快照) |
| consult.html | 线上会诊室 | 已有等价 | medical-stack/app/consult.html | 已同步 |
| digital-twin.html | 数字孪生 | 已有等价 | medical-stack/app/digital-twin.html | 内容滞后(08-27快照) |
| disease-kb.html | 病种知识库 | 已有等价 | medical-stack/app/disease-kb.html | 已同步 |
| doctor-dashboard.html | 医生工作台 | 已有等价 | medical-stack/app/doctor-dashboard.html | 内容滞后(08-27快照) |
| doctor-summary.html | 医生工作总结 | 已有等价 | medical-stack/app/doctor-summary.html | 内容滞后(08-27快照) |
| doctors.html | 医生团队 | 已有等价 | medical-stack/app/doctors.html | 已同步 |
| efficacy-analysis.html | 疗效周期分析 | 已有等价 | medical-stack/app/efficacy-analysis.html | 内容滞后(08-27快照) |
| emergency.html | 紧急救助 | 已有等价 | medical-stack/app/emergency.html | 内容滞后(08-27快照) |
| emr.html | 电子病历 | 已有等价 | medical-stack/app/emr.html | 内容滞后(08-27快照) |
| family-consult.html | 家庭问诊 | 已有等价 | medical-stack/app/family-consult.html | 已同步 |
| family-hub.html | 家庭健康中心 | 已有等价 | medical-stack/app/family-hub.html | 已同步 |
| family-portal.html | 家庭成员管理 | 已有等价 | medical-stack/app/family-portal.html | 已同步 |
| finance.html | 运营财务 | 已有等价 | medical-stack/app/finance.html | 内容滞后(08-27快照) |
| flows.html | 流程图中心 | 已有等价 | medical-stack/app/flows.html | 内容滞后(08-27快照) |
| followup.html | 随访管理 | 已有等价 | medical-stack/app/followup.html | 内容滞后(08-27快照) |
| health-archive.html | 健康档案 | 已有等价 | medical-stack/app/health-archive.html | 内容滞后(08-27快照) |
| home-tcm.html | 居家中医助手·老人端 | 已有等价 | medical-stack/app/home-tcm.html | 内容滞后(08-27快照) |
| hospital.html | 医院门户 | 已有等价 | medical-stack/app/hospital.html | 已同步 |
| inhouse-diagnosis.html | AI 辨证诊断 | 已有等价 | medical-stack/app/inhouse-diagnosis.html | 已同步 |
| insurance-desk.html | 医保人脸核验窗口 | 已有等价 | medical-stack/app/insurance-desk.html | 内容滞后(08-27快照) |
| inventory.html | 药房库存 | 已有等价 | medical-stack/app/inventory.html | 内容滞后(08-27快照) |
| kb-evolution.html | KB 进化仪表盘 | 已有等价 | medical-stack/app/kb-evolution.html | 已同步 |
| longitudinal.html | 长程画像 | 已有等价 | medical-stack/app/longitudinal.html | 已同步 |
| med-tracker.html | 服药追踪 | 已有等价 | medical-stack/app/med-tracker.html | 内容滞后(08-27快照) |
| messages.html | 消息中心 | 已有等价 | medical-stack/app/messages.html | 内容滞后(08-27快照) |
| monitor.html | 监控页 | 已有等价 | medical-stack/app/monitor.html | 已同步 |
| my-reports.html | 我的医院报告 | 已有等价 | medical-stack/app/my-reports.html | 已同步 |
| payment.html | 收银台 | 已有等价 | medical-stack/app/payment.html | 内容滞后(08-27快照) |
| privacy-settings.html | 隐私设置 | 已有等价 | medical-stack/app/privacy-settings.html | 已同步 |
| rbac.html | 权限管理 | 已有等价 | medical-stack/app/rbac.html | 内容滞后(08-27快照) |
| recommend.html | 精准推荐 | 已有等价 | medical-stack/app/recommend.html | 内容滞后(08-27快照) |
| report-print.html | TCM诊断报告 | 已有等价 | medical-stack/app/report-print.html | 内容滞后(08-27快照) |
| rx-loop.html | 处方闭环 | 已有等价 | medical-stack/app/rx-loop.html | 内容滞后(08-27快照) |
| safety-check.html | 用药安全检测 | 已有等价 | medical-stack/app/safety-check.html | 内容滞后(08-27快照) |
| schedule.html | 排班管理 | 已有等价 | medical-stack/app/schedule.html | 内容滞后(08-27快照) |
| server-monitor.html | 系统监控 | 已有等价 | medical-stack/app/server-monitor.html | 内容滞后(08-27快照) |
| telemedicine.html | 远程会诊 | 已有等价 | medical-stack/app/telemedicine.html | 内容滞后(08-27快照) |
| therapy.html | 中医理疗中心 | 已有等价 | medical-stack/app/therapy.html | 内容滞后(08-27快照) |
| treatment-center.html | 诊疗中心 | 已有等价 | medical-stack/app/treatment-center.html | 内容滞后(08-27快照) |
| voice-diagnosis.html | 语音问诊 | 已有等价 | medical-stack/app/voice-diagnosis.html | 已同步 |
| wearable-monitor.html | 设备监控 | 已有等价 | medical-stack/app/wearable-monitor.html | 内容滞后(08-27快照) |
| wellness.html | 治未病中心 | 已有等价 | medical-stack/app/wellness.html | 内容滞后(08-27快照) |
| wuzhen-diagnosis.html | 五诊联动 | 已有等价 | medical-stack/app/wuzhen-diagnosis.html | 已同步 |

## 三、登记

- KNOWN_EQUIV（页面层）：上表 52 项全部登记为「medical-stack/app 同名页即等价物」，后续差集审计页面层以 medical-stack/app 为本侧比对面。
- 差集工具建议（下轮可选）：scripts/tcm-capability-diff.py 页面比对路径加 medical-stack/app，使 page_gap_count 反映真实缺口。

## 四、真缺口（内容增量）吸收排期

34 页滞后清单：acupuncture, ai-diagnosis, call-center, chronic-care, clinic-desk, clinical, digital-twin, doctor-dashboard, doctor-summary, efficacy-analysis, emergency, emr, finance, flows, followup, health-archive, home-tcm, insurance-desk, inventory, med-tracker, messages, payment, rbac, recommend, report-print, rx-loop, safety-check, schedule, server-monitor, telemedicine, therapy, treatment-center, wearable-monitor, wellness。

- 排期：P2，下一轮「页面层重打包」执行——复用 G1 内化流程（镜像解包 → SEC-001 后补丁重放 → 品牌检查 → ADR-009 机构话术校验），禁止直接覆盖（本侧页面含本地化补丁）。
- 建议：将页面层纳入 G1 看守触发范围（镜像 mtime 变化 → 页面 diff → 补丁重放后落位），目标时效与 KB 层一致 ≤1h。
- 18 页已同步（含 my-reports 08-31 15:48 随 G13 同步）。

生成时间：2026-08-31 16:30
