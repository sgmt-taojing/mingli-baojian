# mingli-baojian 更新日志

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
