#!/bin/bash
# 易道智鉴完整性检查脚本
# 每次修改后运行，确保文件未损坏

cd /Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian

echo "=== 易道智鉴完整性检查 ==="
ERRORS=0

# 1. 文件大小检查
HTML_SIZE=$(wc -c < app/divination-hub.html)
JS_SIZE=$(wc -c < app/js/divination-core.js)
echo "divination-hub.html: ${HTML_SIZE} bytes"
echo "divination-core.js: ${JS_SIZE} bytes"
if [ $HTML_SIZE -lt 1000000 ]; then echo "❌ HTML文件过小（<1MB），可能损坏"; ERRORS=$((ERRORS+1)); fi
if [ $JS_SIZE -lt 1000000 ]; then echo "❌ JS文件过小（<1MB），可能损坏"; ERRORS=$((ERRORS+1)); fi

# 2. JS语法检查
for f in app/js/*.js; do
  r=$(node -c "$f" 2>&1)
  [ $? -ne 0 ] && echo "❌ 语法错误: $f" && ERRORS=$((ERRORS+1))
done
for f in knowledge/*.js; do
  r=$(node -c "$f" 2>&1)
  [ $? -ne 0 ] && echo "❌ 语法错误: $f" && ERRORS=$((ERRORS+1))
done
echo "JS语法检查: 完成"

# 3. 重复函数定义检查
node -e "
var fs=require('fs');
var code=fs.readFileSync('app/js/divination-core.js','utf8');
var m=code.match(/function (\w+)\s*\(/g)||[];
var c={};m.forEach(function(x){var n=x.match(/function (\w+)/)[1];c[n]=(c[n]||0)+1;});
var d=Object.keys(c).filter(function(k){return c[k]>1;});
if(d.length>0){console.log('❌ 重复函数: '+d.join(','));process.exit(1);}
else console.log('✅ 无重复函数');
" 2>&1 || ERRORS=$((ERRORS+1))

# 4. Section数量检查
SECTION_COUNT=$(grep -c 'class="section"' app/divination-hub.html)
echo "Section数量: $SECTION_COUNT"
[ $SECTION_COUNT -lt 15 ] && echo "❌ Section过少（<15），可能丢失" && ERRORS=$((ERRORS+1))

# 5. JS引用检查
JS_REFS=$(grep -c '<script.*src.*\.js' app/divination-hub.html)
echo "JS引用数量: $JS_REFS"
[ $JS_REFS -lt 40 ] && echo "❌ JS引用过少（<40），可能丢失" && ERRORS=$((ERRORS+1))

# 6. 缺失JS文件检查
MISSING=0
grep -oE 'src="[^"]*\.js[^"]*"' app/divination-hub.html | sed 's/src="//;s/"//' | while read f; do
  f=$(echo "$f" | sed 's/?.*//')
  [ ! -f "app/$f" ] && [ ! -f "$f" ] && echo "❌ 缺失JS文件: $f" 
done

# 7. 服务器状态
curl -s -o /dev/null -w "服务器: %{http_code}\n" http://127.0.0.1:8910/app/divination-hub.html 2>/dev/null || echo "⚠️ 服务器未启动"

echo ""
if [ $ERRORS -eq 0 ]; then
  echo "✅ 完整性检查通过"
else
  echo "❌ 发现 $ERRORS 个问题"
fi
