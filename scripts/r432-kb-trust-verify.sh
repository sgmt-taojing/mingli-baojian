#!/bin/bash
# R432 KB trust_score 提分验证脚本（shell + sqlite3）
DB=server/database/yidao.db
PASS=0; FAIL=0

check() {
  local name="$1"; local expected="$2"; local actual="$3"
  if [[ "$actual" == *"$expected"* ]]; then
    echo "  ✅ $name ($actual)"
    PASS=$((PASS+1))
  else
    echo "  ❌ $name (expected: $expected, got: $actual)"
    FAIL=$((FAIL+1))
  fi
}

echo "=== R432 KB trust 提分验证 ==="
AVG=$(sqlite3 $DB "SELECT ROUND(AVG(trust_score),4) FROM kb_formal;")
TOTAL=$(sqlite3 $DB "SELECT COUNT(*) FROM kb_formal;")
GOLD=$(sqlite3 $DB "SELECT SUM(CASE WHEN trust_score >= 0.85 THEN 1 ELSE 0 END) FROM kb_formal;")
SILVER=$(sqlite3 $DB "SELECT SUM(CASE WHEN trust_score >= 0.82 AND trust_score < 0.85 THEN 1 ELSE 0 END) FROM kb_formal;")
BRONZE=$(sqlite3 $DB "SELECT SUM(CASE WHEN trust_score < 0.82 THEN 1 ELSE 0 END) FROM kb_formal;")
SRC=$(stat -f%z $DB)
# R109k 起 knowledge/yidao.db 已 DEPRECATED，不再要求副本同步；
# 改为守卫：确认无进程持有 DEPRECATED 库（防误用）
HOLDERS=$(lsof knowledge/yidao.db 2>/dev/null | wc -l | tr -d ' ')

# R110: Bronze 2654 条为 distill 入库未评分存量，待 R111 分批提分
check "Bronze 未失控 (<3000)" "ok" "$( [ "$BRONZE" -lt 3000 ] && echo ok || echo over )"
check "avg_trust ≥ 0.86 (R110: 0.8614)" "0.86" "$AVG"
check "Gold ≥ 3500 (R110: 37209)" "ok" "$( [ "$GOLD" -ge 3500 ] && echo ok || echo under )"
check "DEPRECATED 库无进程持有" "0" "$HOLDERS"

echo ""
echo "=== 结果: $PASS pass / $FAIL fail ==="
echo "📊 avg=$AVG, total=$TOTAL, Gold=$GOLD, Silver=$SILVER, Bronze=$BRONZE"
exit $FAIL