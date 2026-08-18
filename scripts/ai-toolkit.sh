#!/usr/bin/env bash
# ai-toolkit.sh — 能力统一 CLI（R121 · AI 框架工具层）
# 用法：
#   ai-toolkit ask "问题"            → 知识问答（KB 直答/权威库）
#   ai-toolkit search "关键词" [n]   → 知识库检索
#   ai-toolkit pick [n]              → 今日一签（冷知识）
#   ai-toolkit paipan YYYY-MM-DD HH:MM → 排盘
#   ai-toolkit almanac               → 今日黄历
#   ai-toolkit push [--tomorrow]     → 每日推送（public 版）
#   ai-toolkit festival [date]       → 节日祝福
#   ai-toolkit verify img1.b64 img2.b64 → 医保人脸核验
#   ai-toolkit caps                  → 能力清单
set -euo pipefail

BIN="${0##*/}"
MINGLI="http://127.0.0.1:8920"
VIDEO="http://127.0.0.1:8948"

case "${1:-}" in
  ask)
    shift; q="${1:-}"; [ -z "$q" ] && { echo "用法: $BIN ask \"问题\""; exit 1; }
    TOKEN=$(curl -s -m 5 -c /tmp/ai-toolkit.ck "$MINGLI/api/csrf-token" | python3 -c "import sys,json;print(json.load(sys.stdin).get('csrfToken',''))")
    curl -s -m 15 -X POST "$MINGLI/api/ai/knowledge-qa" -H "Content-Type: application/json" -H "x-csrf-token: $TOKEN" -b /tmp/ai-toolkit.ck \
      -d "$(python3 -c "import json,sys;print(json.dumps({'question':sys.argv[1]}))" "$q")" \
      | python3 -c "import sys,json;d=json.load(sys.stdin);print((d.get('data') or d).get('reply',''))"
    ;;
  search)
    shift; q="${1:-}"; n="${2:-3}"
    curl -s -m 8 -G "$MINGLI/api/public/kb-search" --data-urlencode "q=$q" --data-urlencode "limit=$n" \
      | python3 -c "import sys,json;d=json.load(sys.stdin);[print(f\"[{r['module']}] {r['title']} (conf={r.get('conf','-')})\") for r in (d.get('data') or {}).get('results',[])]"
    ;;
  pick)
    n="${2:-3}"
    curl -s -m 8 "$MINGLI/api/kb/today-pick?n=$n" \
      | python3 -c "import sys,json;d=json.load(sys.stdin);[print(f\"[{i['module']}] {i['title']}\n  {i['snippet']}...\") for i in (d.get('data') or {}).get('items',[])]"
    ;;
  paipan)
    d="${2:-}"; t="${3:-12:00}"
    PAYLOAD=$(python3 -c "import sys,json;d=sys.argv[1].split('-');t=sys.argv[2].split(':');print(json.dumps({'year':int(d[0]),'month':int(d[1]),'day':int(d[2]),'hour':int(t[0]),'minute':int(t[1])}))" "$d" "$t")
    curl -s -m 10 -X POST "$MINGLI/api/paipan/calculate" -H "Content-Type: application/json" -d "$PAYLOAD" \
      | python3 -c "import sys,json;d=json.load(sys.stdin);print(json.dumps(d.get('data') or d,ensure_ascii=False)[:600])"
    ;;
  almanac)
    curl -s -m 8 "$MINGLI/api/daily-almanac" | python3 -m json.tool 2>/dev/null | head -20
    ;;
  push)
    cd /Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian
    node daily_push.js public ${2:-} 2>/dev/null
    ;;
  festival)
    cd /Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian
    node festival-wishes.js ${2:-today} 2>/dev/null | head -8
    ;;
  verify)
    i1="${2:-}"; i2="${3:-}"; [ -z "$i1" ] && { echo "用法: $BIN verify img1.b64 img2.b64"; exit 1; }
    curl -s -m 30 -X POST "$VIDEO/api/identity/verify" -H "Content-Type: application/json" \
      -d "{\"image1\":\"$i1\",\"image2\":\"$i2\"}" | python3 -m json.tool 2>/dev/null
    ;;
  vision)
    # 一帧多用视觉：vison tcm|mingli <图片base64>
    t="${2:-}"; img="${3:-}"
    [ -z "$t" ] || [ -z "$img" ] && { echo "用法: $BIN vision tcm|mingli <img.b64>"; exit 1; }
    case "$t" in
      tcm) et="tcm_tongue" ;;
      mingli) et="fortune_reading" ;;
      *) et="tcm_tongue" ;;
    esac
    curl -s -m 30 -X POST "$VIDEO/api/dev/emit-event" -H "Content-Type: application/json" \
      -d "{\"event_type\":\"$et\",\"confidence\":0.9,\"camera_id\":\"toolkit\",\"image\":\"$img\"}" | python3 -m json.tool 2>/dev/null | head -8
    ;;
  ganzhi)
    # 今日干支/五行（一签相关性同源）
    python3 -c "import sys,importlib.util;spec=importlib.util.spec_from_file_location('dr','/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/server/daily-recommendation.py');DR=importlib.util.module_from_spec(spec);spec.loader.exec_module(DR);import datetime;g=DR.get_ganzhi(datetime.date.today().year,datetime.date.today().month,datetime.date.today().day);wx={'甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水'}.get(g['day_gan'],'?');print('干支:',g['year_gz'],g['month_gz'],g['day_gz'],'| 日主五行:',wx)"
    ;;
  medication)
    # shf 开药登记（人脸核验能力入口）
    name="${2:-}"; live="${3:-}"; reg="${4:-}"
    echo "调 shf add_medication（需 face_live/face_registered base64）: python3 -c 'from skill_service.family_medical.main import add_medication; add_medication(...)'"
    ;;
  caps|capabilities)
    curl -s -m 5 "$MINGLI/api/capabilities" | python3 -c "import sys,json;d=json.load(sys.stdin);[print(f\"{c['id']:26s} {c['name']}\") for c in (d.get('data') or {}).get('capabilities',[])]"
    ;;
  *)
    cat <<'USAGE'
能力统一 CLI（AI 框架工具层 · R121）
  ask "问题"         知识问答（KB 直答/权威库）
  search "词" [n]    知识库检索
  pick [n]           今日一签
  paipan 日期 时间   排盘
  almanac            今日黄历
  push [--tomorrow]  每日推送
  festival [date]    节日祝福
  verify img1 img2   医保人脸核验
  caps               能力清单
USAGE
    exit 1
    ;;
esac
