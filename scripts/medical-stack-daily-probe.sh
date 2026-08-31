#!/bin/bash
# medical-stack-daily-probe.sh — 医学栈每日探活（固定输入幂等，不写库不淤积）
# 覆盖：三服务在线 / 8973→8932 代理链 / 移植页与 PWA 路由 / KB 检索功能探针
# 用法：bash scripts/medical-stack-daily-probe.sh   （launchd: com.mingli-baojian.medical-daily-probe）
set -uo pipefail
PASS=0; FAIL=0; WARN=0
ok()   { PASS=$((PASS+1)); echo "  ✅ $1"; }
fail() { FAIL=$((FAIL+1)); echo "  ❌ $1"; }
warn() { WARN=$((WARN+1)); echo "  ⚠️  $1"; }

echo "══ 医学栈每日探针 ($(date '+%F %T')) ══"
code() { curl -s -o /dev/null -w "%{http_code}" -m 5 "$1" 2>/dev/null || echo 000; }

# 1. 三服务在线
[ "$(code http://127.0.0.1:8972/api/tcm/health)" = "200" ] && ok "medical-api :8972" || fail "medical-api :8972 离线"
[ "$(code http://127.0.0.1:8973/health)" = "200" ] && ok "medical-static :8973" || fail "medical-static :8973 离线"
EXTRA=$(code http://127.0.0.1:8974/health)
[ "$EXTRA" = "200" ] && ok "medical-extra :8974" || warn "medical-extra :8974 离线（批注旁路，非阻塞）"

# 2. 8973→8932 代理链（跨项目：医学栈静态代理到 tcm-agent API）
PROXY=$(curl -s -m 8 http://127.0.0.1:8973/api/health 2>/dev/null | python3 -c "import json,sys; print('1' if json.load(sys.stdin).get('ok') else '0')" 2>/dev/null || echo 0)
if [ "$PROXY" = "1" ]; then
  ok "代理链 8973→8932（/api 转发真实命中 tcm-agent）"
else
  fail "代理链 8973→8932 断（医学栈页面将失数据）"
fi

# 3. 移植页与 PWA 路由（2026-08-31 补齐批）
for u in my-reports.html family-hub.html pwa-inject.js sw.js manifest.json; do
  [ "$(code http://127.0.0.1:8973/$u)" = "200" ] && ok "路由 /$u" || fail "路由 /$u 非 200"
done

# 4. KB 检索功能探针（固定查询词，只读幂等）
KB=$(curl -s -m 8 "http://127.0.0.1:8973/api/public/kb/realtime-search?q=%E5%9B%9B%E5%90%9B%E5%AD%90%E6%B1%A4" 2>/dev/null \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d.get('results') or []))" 2>/dev/null || echo -1)
if [ "$KB" -gt 0 ] 2>/dev/null; then
  ok "KB 检索探针（四君子汤 → $KB 条命中）"
else
  fail "KB 检索探针无命中（KB 链或代理异常）"
fi

echo "══ 结果: $PASS 过 / $FAIL 败 / $WARN 警 ══"
[ "$FAIL" -gt 0 ] && exit 1 || exit 0
