#!/bin/bash
# R15 KB 补强验收脚本（2026-07-25）
# 5 大短板模块达标检查 + 关键词 JSON 覆盖率 + entry_id 唯一性

set -e

DB="/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/server/database/yidao.db"

echo "=========================================="
echo "   R15 KB 补强 · 验收脚本 v1"
echo "   $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="
echo ""

echo "[1] KB 总基线"
sqlite3 $DB "SELECT 'total = ' || COUNT(*) FROM kb_formal"
sqlite3 $DB "SELECT 'modules = ' || COUNT(DISTINCT module) FROM kb_formal"
echo ""

echo "[2] 5 大短板模块达标"
echo "  acupuncture    (目标 ≥300):  $(sqlite3 $DB "SELECT COUNT(*) FROM kb_formal WHERE module='acupuncture'")"
echo "  shanghan-lun   (目标 ≥300):  $(sqlite3 $DB "SELECT COUNT(*) FROM kb_formal WHERE module='shanghan-lun'")"
echo "  shuhan         (目标 ≥80):   $(sqlite3 $DB "SELECT COUNT(*) FROM kb_formal WHERE module='shuhan'")"
echo "  tcm            (目标 ≥400):  $(sqlite3 $DB "SELECT COUNT(*) FROM kb_formal WHERE module='tcm'")"
echo "  tcm-fangji     (目标 ≥200):  $(sqlite3 $DB "SELECT COUNT(*) FROM kb_formal WHERE module='tcm-fangji'")"
echo "  tcm-zhongfu    (目标 ≥50):   $(sqlite3 $DB "SELECT COUNT(*) FROM kb_formal WHERE module='tcm-zhongfu'")"
echo ""

echo "[3] 关键词 JSON 覆盖率"
EMPTY_KW=$(sqlite3 $DB "SELECT COUNT(*) FROM kb_formal WHERE keywords IS NULL OR keywords = '' OR keywords = '[]'")
TOTAL=$(sqlite3 $DB "SELECT COUNT(*) FROM kb_formal")
COVERAGE=$(awk "BEGIN {printf \"%.4f\", ($TOTAL - $EMPTY_KW) / $TOTAL * 100}")
echo "  总条数：$TOTAL"
echo "  空关键词：$EMPTY_KW"
echo "  JSON 覆盖率：${COVERAGE}%"
echo ""

echo "[4] entry_id 唯一性"
DUPES=$(sqlite3 $DB "SELECT COUNT(*) FROM (SELECT entry_id FROM kb_formal GROUP BY entry_id HAVING COUNT(*) > 1)")
echo "  重复 entry_id：$DUPES"
echo ""

echo "[5] trust_score 分布"
sqlite3 $DB "SELECT '    ≥0.8 经典：  ' || COUNT(*) FROM kb_formal WHERE trust_score >= 0.8"
sqlite3 $DB "SELECT '    0.6-0.8 实践：' || COUNT(*) FROM kb_formal WHERE trust_score >= 0.6 AND trust_score < 0.8"
sqlite3 $DB "SELECT '    0.4-0.6 争议：' || COUNT(*) FROM kb_formal WHERE trust_score >= 0.4 AND trust_score < 0.6"
sqlite3 $DB "SELECT '    <0.4 待证：  ' || COUNT(*) FROM kb_formal WHERE trust_score < 0.4"
echo ""

echo "[6] R15 标识（entry_id r15-* 前缀）"
R15_TOTAL=$(sqlite3 $DB "SELECT COUNT(*) FROM kb_formal WHERE entry_id LIKE 'r15-%'")
echo "  r15-* 条目：$R15_TOTAL"
echo ""

echo "[7] source_index 总数"
SRC_TOTAL=$(sqlite3 $DB "SELECT COUNT(*) FROM source_index")
echo "  source_index：$SRC_TOTAL"
echo ""

echo "=========================================="
echo "   验收完成"
echo "=========================================="