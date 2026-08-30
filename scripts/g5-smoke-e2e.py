#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
g5-smoke-e2e.py — G5 一次性端到端冒烟（ADR-007 验收）
链路：建档叫号(8972) → 一帧四诊诊断(8972) → EMR 生成(8972) → AI 命理批注(8974)
      → annotation-queue 核验 → 命理师 approve → 病历/药方生成(8972) → 队列流转(8972)
守卫验证：R756（医学内容无命理泄漏）、R757（辨证结果无命理词）、SLA 48h 计时
证据：每节点时间戳 + 关键响应落 DELIVERY/g5-smoke-evidence-<ts>.json
"""
import json, time, urllib.request, urllib.error, sys, re
from pathlib import Path

API = "http://127.0.0.1:8972"
EXTRA = "http://127.0.0.1:8974"
API2 = "http://127.0.0.1:8920"  # 主 API（emr-archive / emr-report 所在）
OUT = Path(__file__).resolve().parent.parent / "DELIVERY"

evidence = {"smoke": "G5-e2e", "started_at": None, "nodes": [], "guards": {}, "verdict": None}

MINGLI_KW = ['日主','天干','地支','八字','紫微','命宫','财帛宫','大运','流年','四柱','纳音',
             '食神','伤官','七杀','正官','偏财','比肩','劫财','排盘','命盘','化忌']

def node(name):
    def deco(fn):
        def wrap(*a, **kw):
            t0 = time.time()
            ts = time.strftime("%Y-%m-%dT%H:%M:%S")
            try:
                out = fn(*a, **kw)
                evidence["nodes"].append({"node": name, "ts": ts, "elapsed_ms": round((time.time()-t0)*1000), "ok": True, "summary": out.get("_summary", "")})
                return out
            except Exception as e:
                evidence["nodes"].append({"node": name, "ts": ts, "elapsed_ms": round((time.time()-t0)*1000), "ok": False, "error": str(e)})
                raise
        return wrap
    return deco

def post(base, path, body, timeout=60):
    req = urllib.request.Request(base + path, data=json.dumps(body).encode(),
                                 headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode())

def get(base, path, timeout=30):
    with urllib.request.urlopen(base + path, timeout=timeout) as r:
        return json.loads(r.read().decode())

# 8920 直连须带拦截器豁免头（X-Skip-Interceptor + 浏览器 UA）
def post2(path, body, timeout=30):
    req = urllib.request.Request(API2 + path, data=json.dumps(body).encode(),
                                 headers={"Content-Type": "application/json",
                                          "X-Skip-Interceptor": "1",
                                          "User-Agent": "Mozilla/5.0"}, method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode())

def get2(path, timeout=30):
    req = urllib.request.Request(API2 + path, headers={"X-Skip-Interceptor": "1", "User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode())

@node("1-患者建档+叫号")
def step1(ctx):
    r = post(API, "/api/clinic/queue/checkin", {
        "patient_name": "冒烟张", "gender": "male", "birthYear": 1990,
        "complaint": "胃脘胀满三日，伴食欲不振"})
    assert r.get("ok"), r
    e = r["entry"]
    return {"patient_id": e.get("patient_id"), "queue_id": e["id"], "session_id": e["session_id"],
            "_summary": f"queue_no={e['queue_no']} pid={e.get('patient_id')}"}

@node("2-一帧采集+四诊诊断")
def step2(ctx):
    r = post(API, "/api/tcm/diagnose", {
        "patient_id": ctx["patient_id"],
        "tongue": {"features": ["舌淡红", "苔白腻"]},
        "face": {"features": ["面色萎黄", "神疲"]},
        "hand": {"features": ["掌色偏白", "指腹不饱满"]},
        "inquiry": {"complaint": "胃脘胀满三日", "symptoms": ["胃脘胀满", "食欲不振", "乏力", "便溏"]}}, timeout=90)
    diag = r.get("inhouse_diagnosis") or {}
    syn = (r.get("suggested_formula") or {})
    text = json.dumps(r, ensure_ascii=False)
    leaked = [k for k in MINGLI_KW if k in text]
    evidence["guards"]["R756_diagnose_no_mingli"] = {"pass": not leaked, "leaked_words": leaked}
    return {"diagnosis": diag, "formula": syn, "_summary": f"urgency={r.get('urgency_level')}"}

@node("3-EMR生成(case-auto)")
def step3(ctx):
    r = post(API, "/api/clinic/case-auto", {
        "member_id": ctx["patient_id"],
        "voice_text": "胃脘胀满三日，食欲不振，乏力，便溏，舌淡红苔白腻",
        "visual_json": {"tcm_diag": {"complexion": "面色萎黄", "tongue": "舌淡红苔白腻", "confidence": 0.82}}})
    assert r.get("ok") or r.get("case_id") or (r.get("case") or {}).get("case_id"), r
    case = r.get("case") or r
    cid = case.get("case_id")
    syn = case.get("syndrome", "")
    hit = [k for k in MINGLI_KW if k in str(syn)]
    evidence["guards"]["R757_syndrome_no_mingli"] = {"pass": not hit, "syndrome": syn, "hit_words": hit,
        "downgrade_triggered": "需人工复核" in str(syn)}
    return {"case_id": cid, "syndrome": syn, "_summary": f"case={cid} syndrome={syn}"}

@node("4-AI命理批注(8974)")
def step4(ctx):
    r = post(EXTRA, f"/api/emr/{ctx['case_id']}/annotate", {
        "type": "ai", "author": "ai-mingli-v1",
        "content": "患者甲木日元偏弱，当前大运土旺克木，脾胃运化受抑，与辨证方向互参。建议配合情志调摄。（冒烟测试批注）"})
    assert r.get("ok"), r
    a = r["annotation"]
    assert a["status"] == "pending_review" and a["watermark"] == "待命理师核对" and a["disclaimer"] == "命理参考，非医学诊断"
    return {"annotation_id": a["id"], "_summary": f"{a['id']} pending+水印+免责声明 ✓"}

@node("5-annotation-queue核验(SLA48h)")
def step5(ctx):
    r = get(EXTRA, "/api/annotation-queue")
    assert r.get("ok"), r
    mine = [q for q in r["queue"] if q["id"] == ctx["annotation_id"]]
    assert mine, "批注未出现在队列"
    q = mine[0]
    evidence["guards"]["SLA_48h"] = {"pass": r["sla_hours"] == 48 and q["overdue"] is False and q["age_hours"] < 48,
        "sla_hours": r["sla_hours"], "age_hours": q["age_hours"], "overdue": q["overdue"], "backlog": r["backlog"]}
    return {"_summary": f"队列命中 sla={r['sla_hours']}h age={q['age_hours']}h overdue={q['overdue']}"}

@node("6-命理师approve")
def step6(ctx):
    r = post(EXTRA, f"/api/annotations/{ctx['annotation_id']}/approve", {"reviewer": "ML-MASTER-001"})
    assert r.get("ok"), r
    a = r["annotation"]
    assert a["status"] == "approved" and a["reviewer"] == "ML-MASTER-001" and a["watermark"] is None
    return {"_summary": f"approved by {a['reviewer']} 水印已解除"}

@node("7-病历+药方生成")
def step7(ctx):
    r = post(API, "/api/prescription/create", {
        "patient_id": ctx["patient_id"], "patient_name": "冒烟张",
        "syndrome": ctx.get("syndrome") or "脾胃气虚",
        "formula": "党参 9g, 白术 9g, 茯苓 9g, 炙甘草 6g, 陈皮 6g",
        "advice": "温服，忌生冷油腻（冒烟测试）"})
    assert r.get("ok"), r
    return {"rx_id": r.get("rx_id") or (r.get("prescription") or {}).get("rx_id"),
            "_summary": f"rx={r.get('rx_id') or (r.get('prescription') or {}).get('rx_id')}"}

@node("8-队列流转(waiting→called→in-consult→done)")
def step8(ctx):
    r1 = post(API, "/api/clinic/queue/call", {"id": ctx["queue_id"]})
    assert r1.get("ok"), r1
    r2 = post(API, "/api/clinic/queue/action", {"id": ctx["queue_id"], "action": "arrive"})
    assert r2.get("ok"), r2
    r3 = post(API, "/api/clinic/queue/action", {"id": ctx["queue_id"], "action": "done"})
    assert r3.get("ok"), r3
    return {"_summary": f"call✓ arrive(in-consult)✓ done✓"}

@node("9-合并报告(8920归档+emr-report+批注签发)")
def step9(ctx):
    sid = ctx["session_id"]
    # 9a 归档进 8920 medical_cases（emr.mingli 走【命理合参】段——R-MERGE-FIX 后真实落库）
    r1 = post2("/api/public/emr-archive", {"sessionId": sid, "role": "doctor", "emr": {
        "complaint": "胃脘胀满三日，伴食欲不振",
        "examination": "舌淡红苔白腻，面色萎黄，脉细弱",
        "syndrome": ctx.get("syndrome") or "脾胃气虚",
        "prescription": "党参 9g, 白术 9g, 茯苓 9g, 炙甘草 6g, 陈皮 6g",
        "mingli": "【AI命理草案 · 待命理师核对】甲木日元偏弱，土旺克木，脾胃运化受抑，与辨证互参（传统易学参考，不构成医学诊断）"}})
    assert r1.get("ok") and r1.get("caseId"), r1
    case_id_8920 = r1["caseId"]
    # 9b 同 sid 在 8974 入一条批注（pending，带水印）
    r2 = post(EXTRA, f"/api/emr/{sid}/annotate", {
        "type": "ai", "author": "ai-mingli-v1",
        "content": "甲木日元偏弱，土旺克木——与脾胃气虚辨证互参。（合并报告链路冒烟）"})
    assert r2.get("ok"), r2
    ann2 = r2["annotation"]["id"]
    # 9c 合并报告读回：病历段 + 命理段 + pending 批注（水印态）
    rep = get2(f"/api/public/emr-report/{sid}")
    assert rep.get("ok") and rep.get("caseId") == case_id_8920, rep
    s = rep.get("sections") or {}
    assert s.get("mingli"), "命理合参段缺失"
    assert s.get("prescription") and s.get("complaint"), "病历段缺失"
    pend = [a for a in rep.get("annotations", []) if a["id"] == ann2 and a["status"] == "pending_review"]
    assert pend, "pending 批注未合并进报告"
    # 9d 命理师签发后再读回：approved + 水印解除
    r3 = post(EXTRA, f"/api/annotations/{ann2}/approve", {"reviewer": "ML-MASTER-001"})
    assert r3.get("ok"), r3
    rep2 = get2(f"/api/public/emr-report/{sid}")
    appr = [a for a in rep2.get("annotations", []) if a["id"] == ann2 and a["status"] == "approved" and not a.get("watermark")]
    assert appr, "签发后报告内批注状态未更新"
    evidence["guards"]["MERGE_REPORT"] = {"pass": True, "case_id_8920": case_id_8920,
        "ann": ann2, "mingli_section": bool(s.get("mingli")), "disclaimer": bool(rep2.get("disclaimer"))}
    return {"_summary": f"8920 case={case_id_8920} 批注{ann2} pending→approved 报告两态读回 ✓"}

def main():
    evidence["started_at"] = time.strftime("%Y-%m-%dT%H:%M:%S")
    ctx = {}
    steps = [step1, step2, step3, step4, step5, step6, step7, step8, step9]
    failed = None
    for s in steps:
        try:
            out = s(ctx)
            ctx.update({k: v for k, v in out.items() if not k.startswith("_")})
        except Exception as e:
            failed = f"{s.__name__}: {e}"
            break
    evidence["case_id"] = ctx.get("case_id")
    evidence["patient_id"] = ctx.get("patient_id")
    evidence["annotation_id"] = ctx.get("annotation_id")
    evidence["rx_id"] = ctx.get("rx_id")
    evidence["finished_at"] = time.strftime("%Y-%m-%dT%H:%M:%S")
    guards_ok = all(g.get("pass") for g in evidence["guards"].values())
    evidence["verdict"] = "PASS" if (not failed and guards_ok) else f"FAIL: {failed or 'guard failed'}"
    OUT.mkdir(exist_ok=True)
    fp = OUT / f"g5-smoke-evidence-{time.strftime('%Y%m%d-%H%M%S')}.json"
    fp.write_text(json.dumps(evidence, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(evidence, ensure_ascii=False, indent=2))
    print(f"\n证据文件: {fp}")
    return 0 if evidence["verdict"] == "PASS" else 1

if __name__ == "__main__":
    sys.exit(main())
