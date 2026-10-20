#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""双向回控决策器（P2-9，§3A.2）：分析置信度 → BackControlDirective。

消费方范式服务出结果后，感知中枢（PH）按本决策器判断是否补采：
  degraded（后端超时/异常） → retry_later（不打扰用户）
  no_record（无命中）       → followup_question（引导式追问，融入自然对话）
                              + 缺图像标签时补 recapture
  低置信（<DIRECT_SCORE）   → recapture（再拍一张，附质量提示）
  高置信                    → None（无需回控）

无感三原则（§3B.2）：不重复采集、不打断（追问融入对话）、可拒绝。
"""
DIRECT_SCORE = 0.72   # 直答级阈值（与 8920 服务端"近义宽容"口径一致）

FOLLOWUP_QUESTIONS = [
    "您能再说说哪里不舒服吗？比如主要症状和持续多久了",
    "这种情况大概持续多长时间了？有没有加重或缓解的规律",
    "除了刚才说的，还有没有其他不舒服的地方",
]
RECAPTURE_HINTS = {
    "tongue": "请再拍一张舌象：自然光下、伸舌放松、拍到全舌",
    "face": "请再拍一张面象：正面、自然光、不美颜",
    "hand": "请再拍一张手象：掌心向上、自然光",
    "eye": "请再拍一张目象：正对镜头、自然光",
}


def decide(analyze_resp, asked_rounds=0):
    """入参：paradigm analyze 响应。返回 BackControlDirective dict 或 None。
    asked_rounds：本轮会话已追问次数（≥2 不再追问，防打扰）。"""
    if not analyze_resp or not analyze_resp.get("ok"):
        return {"type": "retry_later", "reason": "分析服务异常，稍后自动重试"}
    if analyze_resp.get("degraded"):
        return {"type": "retry_later", "reason": "检索后端降级（%s）" % analyze_resp["degraded"]}
    entries = analyze_resp.get("entries") or []
    top = max((e.get("score_norm", 0) for e in entries), default=0)
    if not entries:
        d = {"type": "followup_question",
             "reason": "知识库暂无匹配记载，补充信息可提高研判质量",
             "question": FOLLOWUP_QUESTIONS[min(asked_rounds, len(FOLLOWUP_QUESTIONS) - 1)]}
        if asked_rounds >= 2:
            return None  # 追问上限，防打扰
        # 无命中且疑似缺图像特征 → 同时建议补拍
        if "舌" not in (analyze_resp.get("query") or "") and "面" not in (analyze_resp.get("query") or ""):
            d["also_recapture"] = {"target": "tongue", "hint": RECAPTURE_HINTS["tongue"]}
        return d
    if top < DIRECT_SCORE:
        return {"type": "recapture", "target": "tongue",
                "reason": "特征置信度 %.2f 低于直答级 %.2f" % (top, DIRECT_SCORE),
                "hint": RECAPTURE_HINTS["tongue"]}
    return None


def confidence_of(analyze_resp):
    """分析响应 → 置信度（供 paradigm_svc 直接嵌入响应）。"""
    entries = (analyze_resp or {}).get("entries") or []
    return round(max((e.get("score_norm", 0) for e in entries), default=0), 3)
