# -*- coding: utf-8 -*-
"""受试者授权登记薄（P3-8）：tcm-agent / mingli-baojian 研究与受测场景的授权记录。

家庭端已有 consent_token + consent_policy 完整体系；本模块补齐科研/受测侧
（中医临床受测、命理同参受测）的授权登记、核查、撤销，口径与家庭端对齐。

数据：项目 data/consent-registry.jsonl（追加式，撤销也是一条记录，不回改）。
规则：
  - 采集前必查：scope 有效且未过期未撤销才放行（与采集适配器契约 §3 联动）
  - 儿童/老人须监护人代签（granted_by=guardian:<监护人ID>）
  - 默认有效期 90 天，到期自然失效；撤销即刻生效
"""
import datetime
import json
import os

SCOPES = ("research_capture", "raw_media", "follow_up", "data_research")
ROLES = ("adult", "elderly", "kid")
DEFAULT_DAYS = 90


class Registry:
    def __init__(self, path):
        self.path = path

    def _records(self):
        if not os.path.exists(self.path):
            return []
        with open(self.path, encoding="utf-8") as f:
            return [json.loads(l) for l in f if l.strip()]

    def _append(self, rec):
        os.makedirs(os.path.dirname(self.path), exist_ok=True)
        with open(self.path, "a", encoding="utf-8") as f:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")

    def grant(self, subject_id, scope, granted_by, role="adult",
              days=DEFAULT_DAYS, note=""):
        if scope not in SCOPES:
            raise ValueError("scope 须为 " + "/".join(SCOPES))
        if role not in ROLES:
            raise ValueError("role 须为 " + "/".join(ROLES))
        if role in ("elderly", "kid") and not str(granted_by).startswith("guardian:"):
            raise ValueError("老人/儿童须监护人代签（granted_by=guardian:<ID>）")
        now = datetime.datetime.now()
        rec = {"op": "grant", "subject_id": subject_id, "scope": scope,
               "granted_by": granted_by, "role": role, "note": note,
               "issued_at": now.isoformat(timespec="seconds"),
               "expires_at": (now + datetime.timedelta(days=days)).isoformat(timespec="seconds")}
        self._append(rec)
        return rec

    def revoke(self, subject_id, scope, by, note=""):
        rec = {"op": "revoke", "subject_id": subject_id, "scope": scope,
               "granted_by": by, "note": note,
               "issued_at": datetime.datetime.now().isoformat(timespec="seconds")}
        self._append(rec)
        return rec

    def check(self, subject_id, scope, at=None):
        """采集前核查：最新记录为准；过期/撤销 → False。"""
        at = at or datetime.datetime.now().isoformat(timespec="seconds")
        state = None
        for r in self._records():
            if r["subject_id"] == subject_id and r["scope"] == scope:
                state = r  # 追加式，后者覆盖前者
        if not state or state["op"] != "grant":
            return False
        return state["expires_at"] > at


def consent_verify_from(registry_path, subject_id):
    """给采集适配器的 consent_verify 回调（契约 §2.1 对齐）。"""
    reg = Registry(registry_path)

    def verify(token, scope):
        # token 即 subject_id（受测场景授权主体=受试者本人登记）
        sc = "raw_media" if scope == "raw_media" else "research_capture"
        return reg.check(subject_id or token, sc)
    return verify
