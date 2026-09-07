#!/bin/bash
# wiki-fill-watch.sh — 维基事件补齐看守（R-WIKI-FILL 接力，2026-09-07）
# 背景：08-30 扩容抓取 603 条名人只有生辰没有导语事件（zh.wikipedia 链路不通）。
# 用户指令「网络通了自动补跑」——纯脚本看守，不占模型额度：
#   每 30min 探活 zh.wikipedia；不通静默退出（rc 0，不惊扰巡检）；
#   通了即跑 fill-wikidata-events.py（幂等断点续跑，rc 2=仍未通）；
#   全部补齐后自卸载（bootout）+ 桌面通知 + 日志留证。
set -uo pipefail
PROJ="/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian"
LOG="$PROJ/logs/wiki-fill-watch.log"
TS=$(date "+%Y-%m-%d %H:%M:%S")
LABEL="com.mingli-baojian.wiki-fill-watch"

# 1. 探活（8s 超时，只探不跑）
if ! curl -s -m 8 -o /dev/null "https://zh.wikipedia.org/w/api.php?action=query&meta=siteinfo&format=json"; then
    exit 0  # 静默等下一轮
fi

echo "[$TS] 链路恢复，启动事件补齐" >> "$LOG"
/usr/bin/python3 "$PROJ/scripts/fill-wikidata-events.py" >> "$LOG" 2>&1
RC=$?

if [ $RC -eq 0 ]; then
    LEFT=$(sqlite3 "file:$PROJ/server/database/yidao.db?mode=ro" "SELECT COUNT(*) FROM verification_corpus WHERE source='Wikidata名人' AND facts_json NOT LIKE '%\"year\"%' AND facts_json NOT LIKE '%events_fetched%';" 2>/dev/null || echo "?")
    if [ "$LEFT" = "0" ]; then
        echo "[$TS] ✅ 全部补齐，看守自卸载" >> "$LOG"
        osascript -e "display notification \"维基名人库导语事件已全部补齐，详见 logs/wiki-fill-watch.log\" with title \"命理宝鉴 · 维基补齐完成\"" 2>/dev/null
        launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null
    else
        echo "[$TS] 本轮完成，剩余 $LEFT 人（下轮继续）" >> "$LOG"
    fi
elif [ $RC -eq 2 ]; then
    echo "[$TS] 补跑中断：链路仍不稳定，保留断点下轮续跑" >> "$LOG"
else
    echo "[$TS] ❌ 补齐脚本异常 rc=$RC（需人工查看）" >> "$LOG"
    osascript -e "display notification \"fill-wikidata-events.py 异常退出 rc=$RC，请查看 logs/wiki-fill-watch.log\" with title \"命理宝鉴 · 维基补齐异常\"" 2>/dev/null
fi
exit 0
