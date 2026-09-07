#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""问事服务中心 21 工具全链路冒烟（按 ask.html 真实载荷打 8920/8900 端点）
用法: /usr/bin/python3 scripts/ask-flow-smoke.py
退出码: 0=全过 1=有失败
"""
import json, urllib.request, sys, time

API = "http://127.0.0.1:8920"
HDR = {"Content-Type": "application/json", "X-Skip-Interceptor": "1", "User-Agent": "Mozilla/5.0"}
NOW = time.localtime()

def call(method, path, body=None, timeout=25):
    url = API + path
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers=HDR)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode())

def judge_baihua(b):
    """白话报告质量门：overview 非空 + 至少 1 张卡或 tips"""
    if not b: return False, "无 baihua"
    ov = (b.get("overview") or "").strip()
    cards = b.get("cards") or []
    tips = b.get("tips") or []
    if len(ov) < 10: return False, f"overview 过短({len(ov)})"
    if not cards and not tips: return False, "无 cards 无 tips"
    return True, f"overview {len(ov)}字 cards {len(cards)} tips {len(tips)}"

BIRTH = {"year": 1990, "month": 5, "day": 15, "hour": 12, "gender": "male", "sex": "male"}
Q = "想看看今年的事业运和财运如何"
NOWBODY = {"question": Q, "year": NOW.tm_year, "month": NOW.tm_mon, "day": NOW.tm_mday, "hour": NOW.tm_hour}

CASES = [
    ("六爻问卦",   "POST", "/api/paipan/liuyao/baihua", dict(NOWBODY), "baihua"),
    ("梅花易数",   "POST", "/api/paipan/meihua/baihua", dict(NOWBODY), "baihua"),
    ("奇门遁甲",   "POST", "/api/paipan/qimen/baihua",  dict(NOWBODY), "baihua"),
    ("大六壬",     "POST", "/api/paipan/liuren/baihua", dict(NOWBODY), "baihua"),
    ("八字命理",   "POST", "/api/paipan/bazi/baihua",   dict(NOWBODY, **BIRTH), "baihua"),
    ("紫微斗数",   "POST", "/api/paipan/ziwei/baihua",  dict(NOWBODY, **BIRTH), "baihua"),
    ("风水堪舆",   "POST", "/api/paipan/fengshui/baihua", {"question": Q, "sittingMountain": "子", "facingMountain": "午", "year": NOW.tm_year}, "baihua"),
    ("命格指数",   "POST", "/api/ai/lifeindex-report",  {**BIRTH, "gender": "male", "concerns": [Q[:30]]}, "lifeindex"),
    ("人生规划",   "POST", "/api/ai/lifeplan-report",   {**BIRTH, "concerns": [Q[:30]]}, "lifeplan"),
    ("流年报告",   "POST", "/api/ai/lifeflow-report",   dict(BIRTH), "lifeflow"),
    ("十年走势",   "POST", "/api/ai/lifeflow-timeline", dict(BIRTH, years=10), "lifetimeline"),
    ("流年运势",   "GET",  f"/api/minsu/liunian?year={NOW.tm_year}&birthYear=1990", None, "minsu"),
    ("幸运数色",   "GET",  "/api/minsu/lucky?birthYear=1990", None, "minsu"),
    ("黄历择日",   "GET",  f"/api/minsu/huangli?year={NOW.tm_year}&month={NOW.tm_mon}&day={NOW.tm_mday}", None, "minsu"),
    ("合婚配对v2", "POST", "/api/minsu/hehun/v2", {"male": [1990, 5, 15, 12], "female": [1992, 8, 20, 9]}, "hehun"),
    ("合婚配对v1", "GET",  "/api/minsu/hehun?maleYear=1990&femaleYear=1992", None, "minsu"),
    ("宝宝起名",   "POST", "/api/minsu/xingming/suggest", {"surname": "王", "gender": "M", **BIRTH}, "qiming"),
    ("改名测评",   "POST", "/api/minsu/xingming/rename", {"fullName": "张伟", "gender": "M", **BIRTH}, "rename"),
    ("公司取名",   "POST", "/api/minsu/gongsi", {"industry": "科技公司", "wishChar": "创", **BIRTH, "gender": "M"}, "gongsi"),
    ("姓名评分",   "POST", "/api/minsu/xingming/analyze", {"fullName": "张伟", "gender": "M", **BIRTH}, "xingming"),
    ("姓名速查",   "GET",  "/api/minsu/xingming?name=%E5%BC%A0%E4%BC%9F", None, "minsu"),
    ("手机号命局", "POST", "/api/minsu/mobile/advise", {"number": "13800138000", **BIRTH, "gender": "M"}, "mobile"),
    ("手机号速查", "GET",  "/api/minsu/mobile?number=13800138000", None, "minsu"),
    ("车牌号吉凶", "GET",  "/api/minsu/plate?number=%E7%B2%A4A6688", None, "minsu"),
    # ── 民俗工具中心内联五件（minsu-center.html showTool 链路，chart 形态）──
    ("择日建议·个人化", "GET", "/api/minsu/zeri?year=2026&month=9&event=%E5%AB%81%E5%A8%B6&birthYear=1990&birthMonth=5&birthDay=15", None, "zeri"),
    ("太岁化解·本命", "GET",  "/api/minsu/taisui?year=2026&birthYear=1990", None, "taisui"),
    ("节气全表",   "GET",  "/api/minsu/jieqi?year=2026", None, "jieqi"),
    ("节日表",     "GET",  "/api/minsu/holidays?year=2026", None, "holidays"),
    ("家庭排盘",   "POST", "/api/minsu/family", {"members": [{"role": "爸爸", "year": 1965}, {"role": "妈妈", "year": 1967}, {"role": "孩子", "year": 2018}]}, "family"),
]

def extract(j, kind):
    """按 ask.html 的取数路径提取白话体"""
    d = j.get("data") if isinstance(j, dict) else None
    if kind == "baihua":
        dd = d if isinstance(d, dict) and d.get("ok") else j
        return dd if dd.get("ok") else None
    if kind == "minsu":
        return j.get("baihua") if j.get("ok") else None
    if kind == "hehun":
        if not j.get("ok"): return None
        return {"overview": j.get("verdict", ""), "cards": j.get("dimensions") or [], "tips": j.get("advice") or []}
    if kind == "qiming":
        res = (d or {}).get("result") or {}
        recs = res.get("recommendations") or []
        ok = len(recs) >= 3 and all(r.get("name") and r.get("score") and r.get("meaning") for r in recs[:5])
        return {"overview": f"候选{res.get('totalCandidates',0)}个·精选{len(recs)}个·首名{recs[0].get('name','')}{recs[0].get('score','')}分" if recs else "", "cards": recs, "tips": ["x"]} if recs else None
    if kind == "rename":
        dd = d or {}
        cur = dd.get("current") or {}
        sugs = dd.get("suggestions") or []
        return {"overview": f"现名「{cur.get('fullName','')}」{cur.get('score','?')}分·备选{len(sugs)}个", "cards": sugs or [1], "tips": ["x"]} if cur.get("score") else None
    if kind == "gongsi":
        dd = d or {}
        recs = dd.get("recommendations") or []
        return {"overview": f"行业「{dd.get('industry','?')}」五行属{dd.get('industryWuxing','?')}·精选{len(recs)}个", "cards": recs or [1], "tips": dd.get("tips") or ["x"]} if dd.get("ok") else None
    if kind == "xingming":
        dd = d or {}
        ana = dd.get("analysis") or ""
        return {"overview": f"「{dd.get('fullName','')}」{dd.get('score','?')}分（{dd.get('rating','')}）·分析{len(ana)}字", "cards": [1], "tips": dd.get("supplements") or ["x"]} if dd.get("fullName") and len(ana) >= 20 else None
    if kind == "mobile":
        dd = d or {}
        base = dd.get("base") or {}
        p = dd.get("personal") or {}
        fit = p.get("fitLevel", "?")
        return {"overview": f"数理{base.get('score','?')}分·命局契合度={fit}·喜用{('、'.join(p.get('xiYong') or [])) or '?'}", "cards": [1], "tips": base.get("improve") or ["x"]} if base.get("score") and p.get("fitLevel") else None
    if kind == "lifeindex":
        rep = (d or {}).get("report") or d or {}
        return {"overview": rep.get("summary", ""), "cards": rep.get("dimensions") or [], "tips": rep.get("suggestions") or ["x"]} if rep.get("dimensions") else None
    if kind == "lifeplan":
        rep = (d or {}).get("report") or {}
        return {"overview": rep.get("summary", ""), "cards": rep.get("domains") or [], "tips": rep.get("actions") or ["x"]} if rep.get("domains") else None
    if kind == "lifeflow":
        dd = d or {}
        cm = dd.get("currentMonth") or {}
        adv = cm.get("advice") or ""
        return {"overview": f"本月「{cm.get('name','')}」{cm.get('score','?')}分·{adv}", "cards": [1], "tips": dd.get("advices") or ["x"]} if cm and len(adv) >= 5 else None
    if kind == "lifetimeline":
        dd = d or {}
        yrs = dd.get("yearBreakdown") or []
        y0 = yrs[0] if yrs else {}
        return {"overview": f"{dd.get('startYear','?')}-{dd.get('endYear','?')}十年·{y0.get('year','?')}年{y0.get('ganzhi','')}{y0.get('avgScore','?')}分", "cards": yrs, "tips": [1]} if len(yrs) >= 10 else None
    if kind == "zeri":
        c = j.get("chart") or {}
        gd = c.get("goodDays") or []
        ok = j.get("ok") and len(gd) >= 3 and all(x.get("day") and x.get("ganZhi") and x.get("chongsha") for x in gd[:5])
        pers = "personal" in gd[0] if gd else False
        return {"overview": f"{c.get('year','?')}年{c.get('month','?')}月{c.get('event','?')}·吉日{len(gd)}天·首荐{c['goodDays'][0].get('day','?')}日{c['goodDays'][0].get('ganZhi','')}·个人化={'有' if pers else '无'}", "cards": gd, "tips": ["x"]} if ok else None
    if kind == "taisui":
        c = j.get("chart") or {}
        bm = c.get("benMing") or {}
        hj = bm.get("huajie") or []
        ok = j.get("ok") and c.get("taisui") and bm.get("shengxiao") and len(hj) >= 2  # 用户红线：本命须给完整化解方案
        return {"overview": f"{c.get('yearGanZhi','?')}年·值太岁{c.get('taisui','?')}·本命{bm.get('shengxiao','?')}·化解{len(hj)}项", "cards": hj, "tips": ["x"]} if ok else None
    if kind == "jieqi":
        c = j.get("chart") or {}
        lst = c.get("list") or []
        ok = j.get("ok") and len(lst) >= 24 and all(x.get("name") and x.get("date") for x in lst[:6])
        return {"overview": f"{c.get('year','?')}年节气{len(lst)}个·当前「{c.get('current','?')}」", "cards": lst, "tips": ["x"]} if ok else None
    if kind == "holidays":
        c = j.get("chart") or {}
        hs = c.get("holidays") or []
        ok = j.get("ok") and (c.get("count") or 0) > 0 and len(hs) > 0
        return {"overview": f"{c.get('year','?')}年节日{c.get('count','?')}个", "cards": hs[:3], "tips": ["x"]} if ok else None
    if kind == "family":
        c = j.get("chart") or {}
        ms = c.get("members") or []
        ok = j.get("ok") and len(ms) == 3 and all(m.get("ganZhi") and m.get("shengxiao") and m.get("wuxing") for m in ms) and c.get("wuxingDistribution") is not None
        return {"overview": f"成员{len(ms)}位·五行分布{json.dumps(c.get('wuxingDistribution') or {}, ensure_ascii=False)}", "cards": ms, "tips": ["x"]} if ok else None
    return None

fails = []
for name, method, path, body, kind in CASES:
    t0 = time.time()
    try:
        j = call(method, path, body)
        b = extract(j, kind)
        okk, msg = judge_baihua(b) if b else (False, "响应结构不符（extract=None）")
        ms = int((time.time() - t0) * 1000)
        print(f"{'✅' if okk else '❌'} {name:8s} {ms:5d}ms  {msg}")
        if not okk: fails.append(name)
    except Exception as e:
        print(f"❌ {name:8s}      异常: {e}")
        fails.append(name)

print(f"\n{'✅ 全过' if not fails else '❌ 失败: ' + '、'.join(fails)}  ({len(CASES)-len(fails)}/{len(CASES)})")
sys.exit(1 if fails else 0)
