#!/usr/bin/env bash
# R118 KB 修真：清理 mingli 主 KB 中的跨项目污染条目
# 范围：kb_formal + formal_knowledge 中的所有跨项目 module
# 注意：kb_staging 保留（作为历史审计痕迹，已迁回的正式记录安全后再清）
set -euo pipefail

DB=server/database/yidao.db
CROSS_MODULES="'family-life','smart-home-family','epb-assistant','wechat-platform','digital-ecosystem','digital-workshop'"

echo "================================================"
echo "  R118 KB 清理：mingli 主 KB 删除跨项目污染"
echo "================================================"

# 修真前快照
echo ""
echo "▶ 修真前快照："
sqlite3 -batch "${DB}" <<SQL
SELECT 'BEFORE_KB_FORMAL' AS phase, COUNT(*) AS polluted FROM kb_formal WHERE module IN (${CROSS_MODULES});
SELECT 'BEFORE_FORMAL_KNOWLEDGE' AS phase, COUNT(*) AS polluted FROM formal_knowledge WHERE module IN (${CROSS_MODULES});
SELECT 'BEFORE_KB_STAGING' AS phase, COUNT(*) AS polluted FROM kb_staging WHERE module IN (${CROSS_MODULES});
SQL

# 修真：触发器会自动同步 FTS5 索引
echo ""
echo "▶ 执行 DELETE（触发器自动维护 FTS5）..."
sqlite3 -batch "${DB}" <<SQL
DELETE FROM kb_formal WHERE module IN (${CROSS_MODULES});
DELETE FROM formal_knowledge WHERE module IN (${CROSS_MODULES});
SQL

# 修真后快照
echo ""
echo "▶ 修真后快照："
sqlite3 -batch "${DB}" <<SQL
SELECT 'AFTER_KB_FORMAL' AS phase, COUNT(*) AS polluted FROM kb_formal WHERE module IN (${CROSS_MODULES});
SELECT 'AFTER_FORMAL_KNOWLEDGE' AS phase, COUNT(*) AS polluted FROM formal_knowledge WHERE module IN (${CROSS_MODULES});
SELECT 'AFTER_KB_STAGING' AS phase, COUNT(*) AS polluted FROM kb_staging WHERE module IN (${CROSS_MODULES});
SELECT 'TOTAL_AFTER_KB_FORMAL' AS phase, COUNT(*) AS total FROM kb_formal;
SELECT 'TOTAL_AFTER_FORMAL_KNOWLEDGE' AS phase, COUNT(*) AS total FROM formal_knowledge;
SQL

# 健康巡检自验
echo ""
echo "▶ 跑健康巡检验证修真生效..."
if bash scripts/health-patrol.sh 2>&1 | grep -q "R118 KB 污染"; then
  echo "  ❌ 修真后仍有 R118 KB 污染告警！请检查。"
  exit 1
else
  echo "  ✅ 修真后 R118 KB 污染告警消失"
fi

echo ""
echo "================================================"
echo "  ✅ 修真完成"
echo "================================================"