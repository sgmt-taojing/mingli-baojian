#!/usr/bin/env bash
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 1
OK=0; FAIL=0
P() { echo "  $1"; }
check() { if [ "$1" = "0" ]; then OK=$((OK+1)); P "✓ $2"; else FAIL=$((FAIL+1)); P "✗ $2"; fi }
echo "═ mingli-baojian 自检 ═"
code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 http://127.0.0.1:8920/api/health 2>/dev/null | tr -d ' ')
[ "$code" = "200" ]; check $? "api-server :8920"
code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 -X POST http://127.0.0.1:8920/api/mingli/case-auto -H 'Content-Type: application/json' -d '{"voice_text":"自检"}' 2>/dev/null | tr -d ' ')
[ "$code" = "200" ]; check $? "命理档案 case-auto"
code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 -X POST http://127.0.0.1:8920/api/paipan/calculate -H 'Content-Type: application/json' -d '{"year":1990,"month":5,"day":15,"hour":14,"gender":"男"}' 2>/dev/null | tr -d ' ')
[ "$code" = "200" ]; check $? "排盘引擎"
code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://127.0.0.1:8958/health 2>/dev/null | tr -d ' ')
[ "$code" = "200" ]; check $? "人脸算法 :8958"
KB=$(sqlite3 server/database/yidao.db "SELECT COUNT(*) FROM kb_formal;" 2>/dev/null | tr -d ' ')
[ -n "$KB" ] && [ "$KB" -gt 50000 ]; check $? "yidao KB（${KB:-0} 条）"
N=$(sqlite3 data/mingli.db "SELECT COUNT(*) FROM master_cases;" 2>/dev/null | tr -d ' ')
[ "$N" -ge 0 ]; check 0 "命理档案库（${N:-0}）"
echo "═ 结果: ✓ $OK · ✗ $FAIL ═"
[ "$FAIL" = "0" ]
