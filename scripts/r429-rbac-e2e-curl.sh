#!/bin/bash
# ═══════════════════════════════════════════
# R429 · RBAC 端到端 curl 审计
# 启动服务 → 生成 token → 逐个端点测试
# ═══════════════════════════════════════════
set -e
cd "$(dirname "$0")/.."

PORT=8920
BASE="http://127.0.0.1:$PORT"
PASSED=0
FAILED=0
ERRORS=()

# 辅助
assert_status() {
  local label="$1"
  local expected="$2"
  local actual="$3"
  if [ "$actual" = "$expected" ]; then
    PASSED=$((PASSED + 1))
    # echo "  ✅ $label → $actual"
  else
    FAILED=$((FAILED + 1))
    ERRORS+=("❌ $label: expected $expected, got $actual")
  fi
}

echo "═══ R429 RBAC 端到端 curl 审计 ═══"

# ── 启动服务（如未运行） ──
if ! curl -s "$BASE/api/health" > /dev/null 2>&1; then
  echo "启动 API 服务 @ $PORT..."
  PORT=$PORT node server/api-server-v2.js &
  API_PID=$!
  sleep 3
  trap "kill $API_PID 2>/dev/null" EXIT
fi

# ── 生成 5 个角色的 token ──
echo "生成测试 token..."
TOKEN_SUPER=$(node -e "
  const sec = require('./server/security-v2.js');
  const t = sec.generateToken('test-sa', 1, ['super_admin']);
  console.log(t);
" 2>/dev/null)

TOKEN_OPS=$(node -e "
  const sec = require('./server/security-v2.js');
  console.log(sec.generateToken('test-ops', 1, ['ops']));
" 2>/dev/null)

TOKEN_ADMIN_A=$(node -e "
  const sec = require('./server/security-v2.js');
  console.log(sec.generateToken('test-aa', 1, ['admin_a']));
" 2>/dev/null)

TOKEN_MASTER=$(node -e "
  const sec = require('./server/security-v2.js');
  console.log(sec.generateToken('test-master', 1, ['master']));
" 2>/dev/null)

TOKEN_FREE=$(node -e "
  const sec = require('./server/security-v2.js');
  console.log(sec.generateToken('test-free', 1, ['free']));
" 2>/dev/null)

TOKEN_GUEST=$(node -e "
  const sec = require('./server/security-v2.js');
  console.log(sec.generateToken('test-guest', 1, ['guest']));
" 2>/dev/null)

echo "token 生成完毕"
echo ""

# ── 1. 无 token → 401 ──
echo "── 1. 无 token → 401"
CODE=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/admin/kb/stats")
assert_status "kb:stats 无token" "401" "$CODE"

CODE=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/admin/tickets/export")
assert_status "tickets:export 无token" "401" "$CODE"

# ── 2. free 角色访问 admin 端点 → 403 ──
echo "── 2. free 访问 admin → 403"
CODE=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: ***$TOKEN_FREE" "$BASE/api/admin/kb/stats")
assert_status "free→kb:stats" "403" "$CODE"

CODE=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: ***$TOKEN_FREE" "$BASE/api/admin/stats")
assert_status "free→system:admin" "403" "$CODE"

CODE=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: ***$TOKEN_FREE" "$BASE/api/admin/config")
assert_status "free→system:config" "403" "$CODE"

# ── 3. guest 访问 admin → 403 ──
echo "── 3. guest 访问 admin → 403"
CODE=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: ***$TOKEN_GUEST" "$BASE/api/merchant/list")
assert_status "guest→shop:manage" "403" "$CODE"

# ── 4. master 访问 KB（允许）和商城（禁止） ──
echo "── 4. master 权限边界"
CODE=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: ***$TOKEN_MASTER" "$BASE/api/admin/kb/stats")
assert_status "master→kb:edit ✓" "200" "$CODE"

CODE=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: ***$TOKEN_MASTER" "$BASE/api/merchant/list")
assert_status "master→shop:manage ✗" "403" "$CODE"

# ── 5. ops 访问监控（允许）和 KB 编辑（禁止） ──
echo "── 5. ops 权限边界"
CODE=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: ***$TOKEN_OPS" "$BASE/api/v1/admin/metrics")
# 可能 200 或 500（取决于 DB 是否就绪），只要不是 403 就行
if [ "$CODE" = "403" ] || [ "$CODE" = "401" ]; then
  FAILED=$((FAILED + 1))
  ERRORS+=("❌ ops→monitor:metrics 应通过但 $CODE")
else
  PASSED=$((PASSED + 1))
fi

CODE=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: ***$TOKEN_OPS" "$BASE/api/admin/kb/stats")
assert_status "ops→kb:edit ✗" "403" "$CODE"

# ── 6. admin_a 访问商城（允许）和 KB 入库（允许） ──
echo "── 6. admin_a 权限"
CODE=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: ***$TOKEN_ADMIN_A" "$BASE/api/merchant/list")
# 可能 200 或 500，只要不是 403 就行
if [ "$CODE" = "403" ] || [ "$CODE" = "401" ]; then
  FAILED=$((FAILED + 1))
  ERRORS+=("❌ admin_a→shop:manage 应通过但 $CODE")
else
  PASSED=$((PASSED + 1))
fi

CODE=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: ***$TOKEN_ADMIN_A" "$BASE/api/admin/kb/ingest" -X POST -H "Content-Type: application/json" -d '{}')
# admin_a 有 kb:ingest 权限，但可能因为参数不对返回 400 — 只要不是 403 就行
if [ "$CODE" = "403" ] || [ "$CODE" = "401" ]; then
  FAILED=$((FAILED + 1))
  ERRORS+=("❌ admin_a→kb:ingest 应通过但 $CODE")
else
  PASSED=$((PASSED + 1))
fi

# ── 7. super_admin 顶层跳闸 ──
echo "── 7. super_admin 全通"
CODE=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: ***$TOKEN_SUPER" "$BASE/api/admin/kb/stats")
assert_status "super→kb:stats" "200" "$CODE"

CODE=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: ***$TOKEN_SUPER" "$BASE/api/admin/stats")
# 可能 200 或 500 — 只要不是 403 就行
if [ "$CODE" = "403" ] || [ "$CODE" = "401" ]; then
  FAILED=$((FAILED + 1))
  ERRORS+=("❌ super→system:admin 应通过但 $CODE")
else
  PASSED=$((PASSED + 1))
fi

# ── 8. 无效 token → 401 ──
echo "── 8. 无效 token"
CODE=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: ***invalid.token.here" "$BASE/api/admin/kb/stats")
assert_status "无效token→401" "401" "$CODE"

# ── 结果 ──
echo ""
echo "══════════════════════════════════"
echo "通过: $PASSED  失败: $FAILED  总数: $((PASSED + FAILED))"
echo "══════════════════════════════════"

if [ $FAILED -gt 0 ]; then
  echo ""
  echo "失败用例:"
  for err in "${ERRORS[@]}"; do
    echo "  $err"
  done
  exit 1
fi

echo ""
echo "✅ 全部通过"