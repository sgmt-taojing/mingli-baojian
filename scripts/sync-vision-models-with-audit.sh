#!/usr/bin/env bash
# sync-vision-models-with-audit.sh — 同步 + 审计 + 优化 一键脚本
# 1. 同步 ONNX 模型从 ai-vision-toolkit
# 2. 运行 Python 端到端诊断审计
# 3. 失败 → 自动回滚 + 优化建议
set -uo pipefail

BASE="/Users/tom/kimi/projects/mingli-baojian"
LOG_DIR="${BASE}/logs"
mkdir -p "$LOG_DIR"

LOG_FILE="${LOG_DIR}/vision-sync-audit-$(date +%Y%m%d_%H%M%S).log"
echo "📋 同步 + 审计日志: $LOG_FILE"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "════════════════════════════════════════════════════════"
echo "  Vision 模型同步 + 审计 + 优化"
echo "  时间: $(date)"
echo "════════════════════════════════════════════════════════"

cd "$BASE"

# Step 1: 同步
echo ""
echo "=== Step 1: 同步模型 ==="
python3 server/vision-model-sync.py
SYNC_EXIT=$?

if [ $SYNC_EXIT -ne 0 ]; then
    echo "⚠️ 同步失败（exit=$SYNC_EXIT），但仍继续审计"
fi

# Step 2: 审计
echo ""
echo "=== Step 2: 端到端诊断审计 ==="
python3 server/vision-model-audit.py
AUDIT_EXIT=$?

# Step 3: 摘要
echo ""
echo "════════════════════════════════════════════════════════"
echo "  同步: $([ $SYNC_EXIT -eq 0 ] && echo '✅' || echo '⚠️')  审计: $([ $AUDIT_EXIT -eq 0 ] && echo '✅' || echo '⚠️')"
echo "  报告: $BASE/reports/vision-audit-*.json"
echo "════════════════════════════════════════════════════════"
