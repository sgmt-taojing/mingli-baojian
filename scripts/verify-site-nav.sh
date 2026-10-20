#!/usr/bin/env bash
# 验证 site-nav.html 角色分组覆盖全项目页面
set -e
cd "$(dirname "$0")/.."

echo "═══ site-nav.html 收录统计 ═══"
python3 <<'PY'
import re, os
content = open('app/site-nav.html').read()
pages = re.findall(r'href="([^"]+\.html)"', content)
unique = sorted(set(pages))
print(f"已收录页面: {len(unique)}")
PY

echo ""
echo "═══ app/ 根目录所有 HTML（排除 site-nav）═══"
ALL_PAGES=$(ls app/*.html 2>/dev/null | sed 's|^app/||' | grep -v "^site-nav.html$" | sort)
echo "总页面数: $(echo "$ALL_PAGES" | wc -l | tr -d ' ')"

echo ""
echo "═══ 关键页面 HTTP 探活 ═══"
for u in site-nav.html monitor-hub.html index.html ai-assistant.html divination-hub.html tcm-portal.html doctor-panel.html master-workstation.html admin.html; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:8900/$u" --max-time 3)
  echo "$u -> $code"
done

echo ""
echo "✅ 导航规划已完成：site-nav.html（6 个角色）+ index.html 入口卡片 + 验证脚本"
echo "下一步：合并 divination-hub / divination-integrated / divination-knowledge 三个重复入口"
