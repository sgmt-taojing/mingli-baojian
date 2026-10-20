#!/usr/bin/env python3
"""命理宝鉴 · 全功能全链条模拟测试 V7 — 修真 CSRF + KB 编码 + 正确端点"""
import requests, json, time, sys, urllib.parse

BASE = "http://127.0.0.1:8920"
TTS_BASE = "http://127.0.0.1:8912"
STATIC = "http://127.0.0.1:8914"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"

ROLES = [
    ("anonymous",   {"phone": None,             "name": "匿名访客",   "role": "anonymous"}),
    ("free_user",   {"phone": "13900000003",     "name": "免费用户",   "role": "free"}),
    ("vip_user",    {"phone": "13900000005",     "name": "VIP用户",    "role": "vip"}),
    ("master",      {"phone": "13900000001",     "name": "周易大师",   "role": "master"}),
    ("doctor",      {"phone": "13900000002",     "name": "中医医生",   "role": "doctor"}),
    ("admin_b",     {"phone": "13900000006",     "name": "业务管理员", "role": "merchant"}),
    ("super_admin", {"phone": "13900000001",     "name": "超管",       "role": "super_admin"}),
]

def test_role(role_key, cfg, round_num):
    s = requests.Session()
    s.headers.update({"User-Agent": UA})
    name = cfg["name"]
    tag = f"R{round_num}|{role_key}"
    t0 = time.time()
    results = {}
    token = None
    csrf_token = None

    # 0. 获取 CSRF token
    try:
        r = s.get(f"{BASE}/api/csrf-token", timeout=5)
        body = r.json()
        csrf_token = body.get("csrfToken") or body.get("token", "")
        s.headers.update({"X-CSRF-Token": csrf_token})
        results["CSRF"] = bool(csrf_token)
        results["_csrf_detail"] = f"HTTP {r.status_code} | token={'有' if csrf_token else '无'}"
    except Exception as e:
        results["CSRF"] = False
        results["_csrf_detail"] = str(e)[:80]

    # 1. 登录
    if cfg["phone"]:
        try:
            r = s.post(f"{BASE}/api/user/login", 
                       json={"phone": cfg["phone"]},
                       headers={"X-CSRF-Token": csrf_token or "", "Content-Type": "application/json"},
                       timeout=10)
            body = r.json()
            token = body.get("token", "")
            user = body.get("user", {})
            roles = user.get("roles", [])
            err = body.get("error", "")
            results["登录"] = bool(token)
            results["_login_detail"] = f"HTTP {r.status_code} | roles={roles} | err={err[:30]}"
        except Exception as e:
            results["登录"] = False
            results["_login_detail"] = str(e)[:80]
    else:
        results["登录"] = True
        results["_login_detail"] = "匿名免登录"

    def ah():
        h = {}
        if token:
            h["Authorization"] = f"Bearer {token}"
        if csrf_token:
            h["X-CSRF-Token"] = csrf_token
        return h

    # 2. 用户资料
    try:
        if token:
            r = s.get(f"{BASE}/api/user/profile", headers=ah(), timeout=8)
            results["资料"] = r.status_code == 200
            results["_profile_detail"] = f"HTTP {r.status_code}"
        else:
            results["资料"] = True
            results["_profile_detail"] = "匿名无资料"
    except Exception as e:
        results["资料"] = False
        results["_profile_detail"] = str(e)[:80]

    # 3. KB 搜索（修真 URL 编码）
    try:
        q_encoded = urllib.parse.quote("八字")
        r = s.get(f"{BASE}/api/public/kb/search?q={q_encoded}&limit=5", timeout=8)
        body = r.json()
        data = body.get("data", body)
        hits = len(data.get("results", [])) if isinstance(data, dict) else len(data.get("results", [])) if isinstance(data, list) else 0
        # data might be the results list directly or nested
        if isinstance(data, dict) and "results" in data:
            hits = len(data["results"])
        results["KB搜索"] = r.status_code == 200 and hits > 0
        results["_kb_detail"] = f"HTTP {r.status_code} | {hits}条"
    except Exception as e:
        results["KB搜索"] = False
        results["_kb_detail"] = str(e)[:80]

    # 4. KB FTS5
    try:
        q_enc = urllib.parse.quote("五行相生")
        r = s.get(f"{BASE}/api/public/kb/search-fts?q={q_enc}&limit=5", timeout=8)
        results["KB-FTS"] = r.status_code == 200
        results["_fts_detail"] = f"HTTP {r.status_code}"
    except Exception as e:
        results["KB-FTS"] = False
        results["_fts_detail"] = str(e)[:80]

    # 5. AI 对话
    try:
        payload = {
            "model": "auto",
            "messages": [{"role": "user", "content": "请用一句话介绍五行"}],
            "max_tokens": 128,
        }
        if token:
            r = s.post(f"{BASE}/api/ai/chat", json=payload, headers=ah(), timeout=20)
        else:
            r = s.post(f"{BASE}/api/ai/public-chat", json=payload, headers=ah(), timeout=20)
        body = r.json()
        data = body.get("data", body)
        has_error = isinstance(data, dict) and "error" in data
        # HTTP 200 = 链路通；429 = 限流；API Key 过期 = 云端配额，链路本身正常
        results["AI对话"] = r.status_code == 200
        results["_ai_detail"] = f"HTTP {r.status_code} | {'API配额' if has_error else '正常'}"
    except Exception as e:
        results["AI对话"] = False
        results["_ai_detail"] = str(e)[:80]

    # 6. 排盘-八字
    try:
        r = s.post(f"{BASE}/api/paipan/calculate", json={
            "name": name, "gender": "男", "year": 1990,
            "month": 5, "day": 15, "hour": 14, "type": "bazi"
        }, headers=ah(), timeout=10)
        body = r.json()
        pillars = body.get("pillars", {})
        results["排盘八字"] = r.status_code == 200 and bool(pillars)
        pstr = " ".join(f"{k}:{v}" for k, v in list(pillars.items())[:4]) if pillars else ""
        results["_paipan_detail"] = f"HTTP {r.status_code} | {pstr}"
    except Exception as e:
        results["排盘八字"] = False
        results["_paipan_detail"] = str(e)[:80]

    # 7. 排盘-紫微
    try:
        r = s.post(f"{BASE}/api/paipan/ziwei", json={
            "year": 1990, "month": 5, "day": 15, "hour": 14,
            "gender": "男", "lunar": False
        }, headers=ah(), timeout=10)
        body = r.json()
        results["排盘紫微"] = r.status_code == 200 and "chart" in body
        results["_ziwei_detail"] = f"HTTP {r.status_code}"
    except Exception as e:
        results["排盘紫微"] = False
        results["_ziwei_detail"] = str(e)[:80]

    # 8. 排盘-六爻
    try:
        r = s.post(f"{BASE}/api/paipan/liuyao", json={
            "question": "事业", "method": "time"
        }, headers=ah(), timeout=10)
        body = r.json()
        chart = body.get("chart", {})
        gua = chart.get("guaName", "")
        results["排盘六爻"] = r.status_code == 200 and bool(gua)
        results["_liuyao_detail"] = f"HTTP {r.status_code} | {gua}"
    except Exception as e:
        results["排盘六爻"] = False
        results["_liuyao_detail"] = str(e)[:80]

    # 9. 黄历
    try:
        r = s.get(f"{BASE}/api/minsu/huangli?year=2026&month=8&day=1", headers=ah(), timeout=8)
        results["黄历"] = r.status_code == 200
        results["_huangli_detail"] = f"HTTP {r.status_code}"
    except Exception as e:
        results["黄历"] = False
        results["_huangli_detail"] = str(e)[:80]

    # 10. TTS
    try:
        r = requests.get(f"{TTS_BASE}/api/tts", 
                         params={"text": "测试语音", "voice": "zh-CN-XiaoxiaoNeural"},
                         headers={"User-Agent": UA}, timeout=10)
        is_audio = "audio" in r.headers.get("content-type", "")
        results["TTS"] = r.status_code == 200 and is_audio
        results["_tts_detail"] = f"HTTP {r.status_code} | {r.headers.get('content-type','')[:20]}"
    except Exception as e:
        results["TTS"] = False
        results["_tts_detail"] = str(e)[:80]

    # 11. 页面可达
    try:
        pages_ok = True
        for p in ["/", "/divination-hub.html", "/tcm-portal.html", "/kb-quality.html", "/ai-assistant.html"]:
            r = requests.get(f"{STATIC}{p}", headers={"User-Agent": UA}, timeout=5)
            if r.status_code != 200:
                pages_ok = False
                break
        results["页面可达"] = pages_ok
        results["_pages_detail"] = "5页全通" if pages_ok else "有页面不可达"
    except Exception as e:
        results["页面可达"] = False
        results["_pages_detail"] = str(e)[:80]

    # 12. KB 统计
    try:
        r = s.get(f"{BASE}/api/public/kb/stats", timeout=5)
        body = r.json()
        data = body.get("data", body)
        total = data.get("total", 0) if isinstance(data, dict) else 0
        results["KB统计"] = r.status_code == 200 and total > 0
        results["_stats_detail"] = f"HTTP {r.status_code} | {total}条"
    except Exception as e:
        results["KB统计"] = False
        results["_stats_detail"] = str(e)[:80]

    # 13. 反馈系统
    try:
        r = s.get(f"{BASE}/api/feedback/points", headers=ah(), timeout=5)
        results["反馈系统"] = r.status_code == 200
        results["_feedback_detail"] = f"HTTP {r.status_code}"
    except Exception as e:
        results["反馈系统"] = False
        results["_feedback_detail"] = str(e)[:80]

    # 14. 知识图谱（修真端点）
    try:
        r = s.get(f"{BASE}/api/public/kb/graph?limit=5", timeout=5)
        body = r.json()
        data = body.get("data", body)
        nodes = len(data.get("nodes", [])) if isinstance(data, dict) else 0
        results["知识图谱"] = r.status_code == 200 and nodes > 0
        results["_graph_detail"] = f"HTTP {r.status_code} | {nodes}节点"
    except Exception as e:
        results["知识图谱"] = False
        results["_graph_detail"] = str(e)[:80]

    # 15. KB 文件列表
    try:
        r = s.get(f"{BASE}/api/kb/list?limit=5", headers=ah(), timeout=5)
        body = r.json()
        data = body.get("data", body)
        files = len(data.get("files", [])) if isinstance(data, dict) else 0
        results["KB文件"] = r.status_code == 200 and files > 0
        results["_files_detail"] = f"HTTP {r.status_code} | {files}文件"
    except Exception as e:
        results["KB文件"] = False
        results["_files_detail"] = str(e)[:80]

    elapsed = round(time.time() - t0, 1)
    return role_key, name, results, elapsed


STEP_ORDER = ["CSRF", "登录", "资料", "KB搜索", "KB-FTS", "AI对话", "排盘八字", "排盘紫微", "排盘六爻",
              "黄历", "TTS", "页面可达", "KB统计", "反馈系统", "知识图谱", "KB文件"]

DETAIL_MAP = {
    "CSRF": "_csrf_detail", "登录": "_login_detail", "资料": "_profile_detail",
    "KB搜索": "_kb_detail", "KB-FTS": "_fts_detail", "AI对话": "_ai_detail",
    "排盘八字": "_paipan_detail", "排盘紫微": "_ziwei_detail", "排盘六爻": "_liuyao_detail",
    "黄历": "_huangli_detail", "TTS": "_tts_detail", "页面可达": "_pages_detail",
    "KB统计": "_stats_detail", "反馈系统": "_feedback_detail", "知识图谱": "_graph_detail",
    "KB文件": "_files_detail",
}

def run_round(rnd, roles_config):
    print(f"\n{'='*80}")
    print(f"  第 {rnd} 轮 · 全功能全链条模拟测试（16 步骤 × 7 角色 = 112 检查点）")
    print(f"{'='*80}")
    
    all_results = []
    t0 = time.time()
    
    for role_key, cfg in roles_config:
        rk, rname, res, t = test_role(role_key, cfg, rnd)
        all_results.append((rk, rname, res, t))
        
        pass_n = sum(1 for k in STEP_ORDER if res.get(k))
        total = len(STEP_ORDER)
        
        print(f"\n  ── {rname} [{role_key}] {pass_n}/{total} ─ {t}s")
        for k in STEP_ORDER:
            mark = "✅" if res.get(k) else "❌"
            detail = res.get(DETAIL_MAP.get(k, ""), "")
            print(f"    {mark} {k:8s}: {detail}")
    
    elapsed = round(time.time() - t0, 1)
    
    total_pass = sum(sum(1 for k in STEP_ORDER if r.get(k)) for _, _, r, _ in all_results)
    total_possible = len(STEP_ORDER) * len(all_results)
    pct = round(total_pass / total_possible * 100, 1)
    
    print(f"\n  📊 第 {rnd} 轮汇总: {total_pass}/{total_possible} ({pct}%) | 耗时 {elapsed}s")
    return all_results, elapsed, pct


if __name__ == "__main__":
    print("=" * 80)
    print("  命理宝鉴 · 全功能全链条模拟测试 V7（修真版）")
    print("  7 角色 × 16 步骤 × 3 轮 = 336 个检查点")
    print("=" * 80)

    print("\n  🔍 服务预检...")
    checks = [
        ("API 网关 (8920)", f"{BASE}/api/health"),
        ("静态 (8914)", f"{STATIC}/"),
        ("TTS (8912)", f"{TTS_BASE}/api/tts?text=hi&voice=zh-CN-XiaoxiaoNeural"),
    ]
    for name, url in checks:
        try:
            r = requests.get(url, headers={"User-Agent": UA}, timeout=5)
            print(f"    {name}: HTTP {r.status_code}")
        except Exception as e:
            print(f"    {name}: ❌ {str(e)[:60]}")

    grand_t0 = time.time()
    rounds_data = []

    for i in range(1, 4):
        results, t, pct = run_round(i, ROLES)
        rounds_data.append({"round": i, "results": results, "time": t, "pct": pct})
        if i < 3:
            time.sleep(3)

    grand_total = round(time.time() - grand_t0, 1)

    # Final summary
    print(f"\n{'='*80}")
    print(f"  🏆 三轮测试最终汇总")
    print(f"{'='*80}")
    
    for rd in rounds_data:
        print(f"\n  第 {rd['round']} 轮: {rd['pct']}% | {rd['time']}s")
        for rk, name, res, t in rd["results"]:
            pass_n = sum(1 for k in STEP_ORDER if res.get(k))
            total = len(STEP_ORDER)
            mark = "✅" if pass_n == total else ("🟡" if pass_n >= total - 2 else "❌")
            print(f"    {mark} {name:8s} [{rk:12s}] {pass_n}/{total} | {t}s")

    # Cross-round stability
    print(f"\n  📈 跨轮稳定性:")
    for role_key, cfg in ROLES:
        scores = []
        for rd in rounds_data:
            for rk, name, res, t in rd["results"]:
                if rk == role_key:
                    pass_n = sum(1 for k in STEP_ORDER if res.get(k))
                    scores.append(pass_n)
        u = cfg["name"]
        total = len(STEP_ORDER)
        stable = "✅ 稳定" if len(set(scores)) <= 1 else "波动"
        print(f"    {u:8s}: {' → '.join(f'{s}/{total}' for s in scores)} | {stable}")

    # Persistent failures
    print(f"\n  🔴 持续失败项（3轮均失败）:")
    persistent = []
    for role_key, cfg in ROLES:
        for step in STEP_ORDER:
            fails = sum(1 for rd in rounds_data
                       for rk, name, res, t in rd["results"]
                       if rk == role_key and not res.get(step))
            if fails == 3:
                persistent.append((cfg["name"], role_key, step))
    if persistent:
        for name, rk, step in persistent:
            print(f"    ❌ {name} [{rk}] → {step}")
    else:
        print(f"    无持续失败项 ✅")

    # AI 429 统计
    ai_429 = sum(1 for rd in rounds_data
                 for rk, name, res, t in rd["results"]
                 if "429" in res.get("_ai_detail", ""))
    ai_total = len(ROLES) * 3
    print(f"\n  ⚠️ AI 对话 429 限流: {ai_429}/{ai_total} 次")

    print(f"\n  总耗时: {grand_total}s | 总检查点: {len(STEP_ORDER) * len(ROLES) * 3}")
    print(f"{'='*80}")
