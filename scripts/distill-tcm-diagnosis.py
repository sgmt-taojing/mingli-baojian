#!/usr/bin/env python3
"""
R118-G3 修真（2026-08-16）：反向污染修真

原脚本：tcm-diagnosis 诊疗记录 → 命理宝鉴主 KB
修真原因：违反 KNOWLEDGE_DISTILLATION_SOP 单向流动原则
        - tcm-diagnosis 是医学知识子集，权威源是 tcm-agent
        - 命理宝鉴mingli-baojian 是命理权威源，医学只是其消费侧
        - 反向污染导致 mingli 端混入 210 条 tcm-diagnosis 条目

修真方案：
        1. 旧脚本完全停用（避免后续被错误调度）
        2. 迁移到 tcm-agent 的官方出站链路
           → tcm-agent/scripts/cron-distill-tcm-outbound.sh
           → 已经 source 过滤防回流 + trust ≥ 0.7
        3. tcm-diagnosis 项目自己的数据如需蒸馏到 mingli，须经 tcm-agent 中转
           （按 SOP 三大权威源映射：医学知识权威源 = tcm-agent）

如来在项目移植确有需求，请用：
        tcm-agent/scripts/cron-distill-tcm-outbound.sh
"""

import sys

print("=" * 60)
print("[R118-G3 修真] distill-tcm-diagnosis.py 已停用")
print("=" * 60)
print("原因：违反项目隔离 SOP 单向流动原则")
print()
print("原行为：tcm-diagnosis → mingli-baojian 主 KB（反向污染）")
print("修真行为：完全停用 + 迁移到 tcm-agent 官方出站链路")
print()
print("替代脚本：tcm-agent/scripts/cron-distill-tcm-outbound.sh")
print("  已修真：source 过滤防回流 + trust ≥ 0.7")
print("  调度：每天 03:30（launchd 自动）")
print()
print("=" * 60)
sys.exit(0)
