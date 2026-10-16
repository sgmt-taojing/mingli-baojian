#!/bin/bash
# 全体系复扫审计 2026-10-16 晚 · 第二轮（修正版：以服务端真实路由为准）
STATIC=http://127.0.0.1:8900
API=http://127.0.0.1:8920
PASS=0; FAIL=0
ok(){ PASS=$((PASS+1)); echo "PASS  $1"; }
bad(){ FAIL=$((FAIL+1)); echo "FAIL  $1  -> $2"; }

check_get(){
  local body; body=$(curl -s --max-time 15 "$2")
  local code; code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$2")
  if [ "$code" = "200" ] && echo "$body" | grep -q "$3"; then ok "$1"; else bad "$1" "code=$code expect=$3"; fi
}
check_post(){
  local body; body=$(curl -s --max-time 20 -X POST "$2" -H 'Content-Type: application/json' -d "$3")
  if echo "$body" | grep -q "$4"; then ok "$1"; else bad "$1" "expect=$4 got=$(echo "$body" | head -c 120)"; fi
}
check_page(){
  local code; code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$2")
  if [ "$code" = "200" ]; then ok "page:$1"; else bad "page:$1" "code=$code"; fi
}

echo "===== 1. 排盘引擎端点 ====="
check_get "paipan/ziwei"   "$API/api/paipan/ziwei?year=1990&month=5&day=15&hour=10&gender=male" '紫微'
check_get "paipan/liuyao"  "$API/api/paipan/liuyao?question=%E6%B5%8B%E8%AF%95" '卦'
check_get "paipan/meihua"  "$API/api/paipan/meihua?year=2026&month=10&day=16&hour=12" '卦'
check_get "paipan/qimen"   "$API/api/paipan/qimen?year=2026&month=10&day=16&hour=12" '宫'
check_get "paipan/liuren"  "$API/api/paipan/liuren?year=2026&month=10&day=16&hour=12" '课'
check_get "paipan/fengshui" "$API/api/paipan/fengshui?year=1990&month=5&day=15&gender=male" '宅'
check_post "paipan/calculate bazi" "$API/api/paipan/calculate" '{"module":"bazi","year":1990,"month":5,"day":15,"hour":10,"gender":"male"}' '"pillars"'
check_post "paipan/bazi/baihua" "$API/api/paipan/bazi/baihua" '{"year":1990,"month":5,"day":15,"hour":10,"gender":"male"}' '解读'

echo "===== 2. 民俗服务端点（以 api-server-v2.js 实际注册为准） ====="
check_get  "minsu/huangli"  "$API/api/minsu/huangli?year=2026&month=10&day=16" 'baihua'
check_get  "minsu/zeri"     "$API/api/minsu/zeri?year=2026&month=10&event=%E6%90%AC%E5%AE%B6" 'baihua'
check_get  "minsu/zeri/v2"  "$API/api/minsu/zeri/v2?year=2026&month=10&event=%E6%90%AC%E5%AE%B6" ''
check_get  "minsu/taisui"   "$API/api/minsu/taisui?year=2026&birthYear=1990" 'baihua'
check_get  "minsu/jieqi"    "$API/api/minsu/jieqi?year=2026" 'baihua'
check_get  "minsu/holidays" "$API/api/minsu/holidays?year=2026" 'baihua'
check_get  "minsu/mobile"   "$API/api/minsu/mobile?number=13812345678" ''
check_get  "minsu/xingming" "$API/api/minsu/xingming?name=%E7%8E%8B%E6%99%93%E6%98%8E" ''
check_get  "minsu/liunian"  "$API/api/minsu/liunian?birthYear=1990" ''
check_get  "minsu/lucky"    "$API/api/minsu/lucky?year=1990&month=5&day=15" ''
check_get  "minsu/plate"    "$API/api/minsu/plate?number=%E7%B2%A4A66888" ''
check_get  "minsu/shuli81"  "$API/api/minsu/shuli81?n=24&birthYear=1990" 'baihua'
check_get  "minsu/floor"    "$API/api/minsu/floor?n=8&birthYear=1990" 'baihua'
check_get  "minsu/hehun"    "$API/api/minsu/hehun?maleYear=1990&femaleYear=1992" ''
check_post "minsu/hehun/v2" "$API/api/minsu/hehun/v2" '{"male":{"year":1990,"month":5,"day":15},"female":{"year":1992,"month":8,"day":20}}' 'ok'
check_post "minsu/family"   "$API/api/minsu/family" '{"members":[{"role":"爸爸","year":1965},{"role":"我","year":1990}]}' 'ok'
check_post "minsu/xingming/suggest" "$API/api/minsu/xingming/suggest" '{"surname":"王","year":2026,"month":10,"day":16,"gender":"male"}' 'ok'

echo "===== 3. 页面可达性 ====="
for p in ask.html ai-assistant.html minsu-center.html divination-tools.html report-interpret.html paipan-center.html bazi.html ziwei.html ziwei-chart.html liuyao-chart.html meihua-chart.html liuren-chart.html qimen-chart.html fengshui-chart.html yijing-qimen.html daozang-duan.html tongcan.html project-knowledge-graph.html admin-kb-panel.html index.html; do
  check_page "$p" "$STATIC/$p"
done

echo "===== 4. 图标化回归（残留单字占位徽标扫描） ====="
# 真占位徽标特征：单字 span 带 badge/chip 类样式；排除正文/注释中的正常用词
LEFT=$(grep -rn 'class="[^"]*\(badge\|chip\|tag\)[^"]*">[一-龥]<' app/*.html 2>/dev/null | wc -l | tr -d ' ')
echo "残留单字徽标数: $LEFT"
[ "$LEFT" = "0" ] && ok "图标化回归" || bad "图标化回归" "$LEFT 处残留"

echo ""
echo "===== 汇总: PASS=$PASS FAIL=$FAIL ====="
