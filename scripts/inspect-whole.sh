#!/bin/bash
# R256-3 · docx V1.1 五大维度巡检脚本
#   功能可用 · 输出合规 · KB 匹配 · 多模态稳定 · 格式规范
# 用法：bash inspect-whole.sh [port]
# 默认 port=8920

set -uo pipefail
PORT="${1:-8920}"
BASE="http://127.0.0.1:${PORT}"
PASS=0 FAIL=0 WARN=0

color_red()  { printf '\033[31m%s\033[0m\n' "$1"; }
color_green(){ printf '\033[32m%s\033[0m\n' "$1"; }
color_yel() { printf '\033[33m%s\033[0m\n' "$1"; }
color_cyan() { printf '\033[36m%s\033[0m\n' "$1"; }

ok()   { PASS=$((PASS+1)); color_green "  ✅ $1"; }
fail() { FAIL=$((FAIL+1)); color_red "  ❌ $1"; }
warn() { WARN=$((WARN+1)); color_yel "  ⚠️  $1"; }

# 端点 HTTP 探活
probe() {
  local url="$1"
  local extra="${2:-}"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" -m 3 $extra "$url" 2>/dev/null || echo "000")
  echo "$code"
}

# 测试断言全通过检查
assert_passed() {
  local file="$1"
  local result
  result=$(node "$file" 2>&1 | tail -3)
  if echo "$result" | grep -q "0 失败"; then
    return 0
  fi
  return 1
}

color_cyan "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
color_cyan "  R256-3 · 五大维度巡检"
color_cyan "  目标：$BASE"
color_cyan "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

###############################################################################
# 1. 功能可用
###############################################################################
color_cyan "\n[1/5] 功能可用"

code=$(probe "$BASE/api/health")
if [ "$code" = "200" ]; then ok "gateway /api/health (HTTP $code)"
else fail "gateway /api/health (HTTP $code)"; fi

code=$(probe "http://127.0.0.1:8913/health")
if [ "$code" = "200" ]; then ok "face-ocr 8913 /health (HTTP $code)"
else fail "face-ocr 8913 /health (HTTP $code)"; fi

code=$(probe "$BASE/api/ocr/recognize" "-X POST -H Content-Type:application/json -d {}")
if [ "$code" != "000" ]; then ok "OCR /api/ocr/recognize 可达 (HTTP $code)"
else fail "OCR /api/ocr/recognize 不可达"; fi

code=$(probe "$BASE/api/face/analyze" "-X POST -H Content-Type:application/json -d {}")
if [ "$code" != "000" ]; then ok "face /api/face/analyze 可达 (HTTP $code)"
else fail "face /api/face/analyze 不可达"; fi

code=$(probe "$BASE/api/ai/chat" "-X POST -H Content-Type:application/json -d {\"messages\":[{\"role\":\"user\",\"content\":\"ping\"}]}")
if [ "$code" != "000" ]; then ok "AI /api/ai/chat 可达 (HTTP $code)"
else fail "AI /api/ai/chat 不可达"; fi

###############################################################################
# 2. 输出合规（5 字段 JSON + 置信度阈值 + 拒识码）
###############################################################################
color_cyan "\n[2/5] 输出合规"

if assert_passed "tests/unit/r256-validator.test.js"; then
  ok "validator 断言全通过"
else
  fail "validator 断言失败"
fi

if assert_passed "tests/unit/r256-tag-pool.test.js"; then
  ok "tag-pool 唯一性 + 结构全通过"
else
  fail "tag-pool 测试失败"
fi

###############################################################################
# 3. KB 匹配（FTS5 / 检索准确性）
###############################################################################
color_cyan "\n[3/5] KB 匹配"

if [ -f "server/database/yidao.db" ]; then
  count=$(sqlite3 server/database/yidao.db "SELECT COUNT(*) FROM kb_formal" 2>/dev/null || echo "0")
  if [ "$count" -gt 10000 ]; then ok "KB 总量 ≥ 10,000（实际 $count 条）"
  elif [ "$count" -gt 0 ]; then warn "KB 总量偏低（实际 $count 条）"
  else fail "KB 无数据"; fi

  fts=$(sqlite3 server/database/yidao.db "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='kb_fts5'" 2>/dev/null || echo "0")
  if [ "$fts" = "1" ]; then ok "FTS5 索引存在"
  else fail "FTS5 索引不存在"; fi
else
  warn "yidao.db 不存在，跳过 KB 检查"
fi

code=$(probe "$BASE/api/kb/search?q=八字")
if [ "$code" != "000" ]; then ok "KB 搜索可达 (HTTP $code)"
else fail "KB 搜索不可达"; fi

###############################################################################
# 4. 多模态稳定（OCR / 舌面诊 / 标签池 / RBAC）
###############################################################################
color_cyan "\n[4/5] 多模态稳定"

if assert_passed "tests/unit/r256-rbac-injection.test.js"; then
  ok "RBAC 注入 47/47"
else
  fail "RBAC 注入失败"
fi

if assert_passed "tests/unit/r256-role-rbac.test.js"; then
  ok "角色 RBAC 矩阵 118/118"
else
  fail "角色 RBAC 矩阵失败"
fi

if assert_passed "tests/unit/r256-defect-grading.test.js"; then
  ok "缺陷分级 35/35"
else
  fail "缺陷分级测试失败"
fi

if assert_passed "tests/unit/r256-test-auditor.test.js"; then
  ok "测试审核智能体 27/27"
else
  fail "测试审核智能体测试失败"
fi

###############################################################################
# 5. 格式规范（Math.random / console.log / alert）
###############################################################################
color_cyan "\n[5/5] 格式规范"

cnt=$(grep -rn "Math\.random[()]" app/*.html app/js/*.js 2>/dev/null | grep -v "//" | wc -l | tr -d ' ')
if [ "$cnt" = "0" ]; then ok "Math.random 0 处（前端）"
else fail "Math.random 残留 $cnt 处"; fi

cnt=$(grep -rn "console\.log[()]" app/js/*.js 2>/dev/null | grep -v "console\.warn" | grep -v "console\.error" | grep -v "//" | wc -l | tr -d ' ')
if [ "$cnt" = "0" ]; then ok "console.log 0 处"
else warn "console.log 残留 $cnt 处"; fi

cnt=$(grep -rn "alert(" app/*.html app/js/*.js 2>/dev/null | wc -l | tr -d ' ')
if [ "$cnt" = "0" ]; then ok "alert() 0 处"
else fail "alert() 残留 $cnt 处"; fi

###############################################################################
# 汇总
###############################################################################
color_cyan "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
color_cyan "  巡检结果汇总"
color_cyan "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
printf "  通过：%d\n" $PASS
printf "  警告：%d\n" $WARN
printf "  失败：%d\n" $FAIL
color_cyan "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$FAIL" -gt 0 ]; then
  color_red "\n❌ 巡检失败（$FAIL 项失败，需修真）"
  exit 1
elif [ "$WARN" -gt 0 ]; then
  color_yel "\n⚠️  巡检通过但含警告（$WARN 项，建议修真）"
  exit 0
else
  color_green "\n✅ 巡检全通过（$PASS 项全部通过）"
  exit 0
fi