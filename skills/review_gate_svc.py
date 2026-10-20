#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""核定闸服务（review-gate）：L2 专业草案 → 专业人员核定 → 定稿 状态机。

设计依据：四项目知识同步体系设计 v1.7 §3B.3（人机协同核定闸，法律要求）：
- 输出三级：L0 科普参考 / L1 指导建议（自动服务+抽样复核）/ L2 专业草案（一律草案态，
  医生/命理师核定后方可进入服务闭环，核定期限 24h）
- 核定人实名与资质登记；修正回流校验队列（反哺知识/算法迭代）

状态机：pending → approved / revised / rejected；approved|revised → finalized
修正回流：revise/reject 自动写 calibration-queue.jsonl
定稿留存：finalize 写 finalized.jsonl（病历类长期留存）

端点：
  GET  /health
  POST /v1/gate/submit     {level,kind,subject_id,draft,source}
  GET  /v1/gate/queue?status=pending
  POST /v1/gate/review     {id,reviewer:{name,credential},action,revised_payload?,note}
  POST /v1/gate/finalize   {id}
  GET  /v1/gate/record/<id>
"""
import argparse
import datetime
import json
import os
import sqlite3
import sys
import uuid
from http.server import BaseHTTPRequestHandler, HTTPServer

ARGS = None
L2_DEADLINE_H = 24
LEVELS = ("L0", "L1", "L2")
KINDS = ("diagnosis", "prescription", "record", "fate", "other")
ACTIONS = ("approve", "revise", "reject")


def now_iso():
    return datetime.datetime.now().isoformat(timespec="seconds")


class Store:
    def __init__(self, root):
        os.makedirs(root, exist_ok=True)
        self.root = root
        self.db = sqlite3.connect(os.path.join(root, "review-gate.db"),
                                  check_same_thread=False)
        self.db.execute("""CREATE TABLE IF NOT EXISTS drafts(
            id TEXT PRIMARY KEY, level TEXT, kind TEXT, subject_id TEXT,
            draft TEXT, source TEXT, status TEXT, deadline TEXT,
            reviewer TEXT, revised_payload TEXT, note TEXT,
            created_at TEXT, reviewed_at TEXT, finalized_at TEXT)""")
        self.db.execute("""CREATE TABLE IF NOT EXISTS audit(
            draft_id TEXT, ts TEXT, actor TEXT, action TEXT, note TEXT)""")
        self.db.commit()

    def _log(self, did, actor, action, note=""):
        self.db.execute("INSERT INTO audit VALUES(?,?,?,?,?)",
                        (did, now_iso(), actor, action, note))
        self.db.commit()

    def submit(self, body):
        level = body.get("level")
        kind = body.get("kind", "other")
        if level not in LEVELS:
            raise ValueError("level 须为 L0/L1/L2")
        if kind not in KINDS:
            raise ValueError("kind 须为 " + "/".join(KINDS))
        if not isinstance(body.get("draft"), dict) or not body["draft"]:
            raise ValueError("draft 须为非空对象")
        did = uuid.uuid4().hex[:12]
        if level in ("L0", "L1"):  # 自动服务级，不进核定队列
            return {"id": did, "level": level, "status": "auto_service",
                    "note": "L0/L1 自动服务级，L1 走抽样复核通道"}
        deadline = (datetime.datetime.now()
                    + datetime.timedelta(hours=L2_DEADLINE_H)).isoformat(timespec="seconds")
        # R-J2 幂等去重：同 subject + 同 kind + 同草案内容（规范化哈希）的 pending 件已存在时，
        # 不重复进队，返回既有草案 ID——防桥接/重试/测试重复送闸烧核定资源。
        import hashlib
        subj = str(body.get("subject_id") or "")
        draft_json = json.dumps(body["draft"], ensure_ascii=False, sort_keys=True)
        dhash = hashlib.sha256((kind + "|" + subj + "|" + draft_json).encode("utf-8")).hexdigest()[:16]
        for r in self.db.execute(
                "SELECT id, draft FROM drafts WHERE status='pending' AND kind=? AND subject_id=?",
                (kind, subj)).fetchall():
            try:
                old_norm = json.dumps(json.loads(r[1]), ensure_ascii=False, sort_keys=True)
                old = hashlib.sha256((kind + "|" + subj + "|" + old_norm).encode("utf-8")).hexdigest()[:16]
            except Exception:
                continue
            if old == dhash:
                self._log(r[0], str(body.get("source") or "system"), "dedup_hit")
                return {"id": r[0], "level": level, "status": "pending",
                        "dedup": True, "note": "同内容草案已在核定队列，复用既有条目"}
        self.db.execute(
            "INSERT INTO drafts VALUES(?,?,?,?,?,?,?,?,NULL,NULL,NULL,?,NULL,NULL)",
            (did, level, kind, subj, draft_json,
             str(body.get("source") or ""), "pending", deadline, now_iso()))
        self._log(did, str(body.get("source") or "system"), "submitted")
        return {"id": did, "level": level, "status": "pending", "deadline": deadline}

    def queue(self, status="pending"):
        rows = self.db.execute(
            "SELECT id,level,kind,subject_id,status,deadline,created_at FROM drafts "
            "WHERE status=? ORDER BY created_at", (status,)).fetchall()
        now = datetime.datetime.now().isoformat(timespec="seconds")
        return [{"id": r[0], "level": r[1], "kind": r[2], "subject_id": r[3],
                 "status": r[4], "deadline": r[5], "created_at": r[6],
                 "overdue": bool(r[5] and r[5] < now and r[4] == "pending")}
                for r in rows]

    def _get(self, did):
        r = self.db.execute("SELECT * FROM drafts WHERE id=?", (did,)).fetchone()
        if not r:
            raise KeyError(did)
        keys = ["id", "level", "kind", "subject_id", "draft", "source", "status",
                "deadline", "reviewer", "revised_payload", "note",
                "created_at", "reviewed_at", "finalized_at"]
        d = dict(zip(keys, r))
        d["draft"] = json.loads(d["draft"])
        if d["reviewer"]:
            d["reviewer"] = json.loads(d["reviewer"])
        if d["revised_payload"]:
            d["revised_payload"] = json.loads(d["revised_payload"])
        return d

    def review(self, body):
        did = body.get("id")
        action = body.get("action")
        if action not in ACTIONS:
            raise ValueError("action 须为 " + "/".join(ACTIONS))
        reviewer = body.get("reviewer") or {}
        if not reviewer.get("name") or not reviewer.get("credential"):
            raise ValueError("核定人须实名并登记资质（name + credential）")
        d = self._get(did)
        if d["status"] != "pending":
            raise RuntimeError("当前状态 %s 不可核定（仅 pending）" % d["status"])
        note = str(body.get("note") or "")
        revised = body.get("revised_payload")
        if action == "revise" and not isinstance(revised, dict):
            raise ValueError("revise 须附 revised_payload")
        self.db.execute(
            "UPDATE drafts SET status=?, reviewer=?, revised_payload=?, note=?, reviewed_at=? "
            "WHERE id=?",
            ({"approve": "approved", "revise": "revised", "reject": "rejected"}[action],
             json.dumps(reviewer, ensure_ascii=False),
             json.dumps(revised, ensure_ascii=False) if revised else None,
             note, now_iso(), did))
        self._log(did, reviewer["name"], action, note)
        if action in ("revise", "reject"):  # 修正回流校验队列
            with open(os.path.join(self.root, "calibration-queue.jsonl"), "a",
                      encoding="utf-8") as f:
                f.write(json.dumps({"ts": now_iso(), "draft_id": did, "action": action,
                                    "reviewer": reviewer, "note": note,
                                    "revised_payload": revised},
                                   ensure_ascii=False) + "\n")
        return self._get(did)

    def finalize(self, body):
        did = body.get("id")
        d = self._get(did)
        if d["status"] not in ("approved", "revised"):
            raise RuntimeError("当前状态 %s 不可定稿（须 approved/revised）" % d["status"])
        final_payload = d["revised_payload"] if d["status"] == "revised" else d["draft"]
        self.db.execute("UPDATE drafts SET status='finalized', finalized_at=? WHERE id=?",
                        (now_iso(), did))
        self._log(did, "system", "finalized")
        with open(os.path.join(self.root, "finalized.jsonl"), "a", encoding="utf-8") as f:
            f.write(json.dumps({"ts": now_iso(), "draft_id": did, "level": d["level"],
                                "kind": d["kind"], "subject_id": d["subject_id"],
                                "final_payload": final_payload,
                                "reviewer": d["reviewer"]}, ensure_ascii=False) + "\n")
        return self._get(did)

    def record(self, did):
        d = self._get(did)
        d["audit"] = [{"ts": r[1], "actor": r[2], "action": r[3], "note": r[4]}
                      for r in self.db.execute(
                          "SELECT * FROM audit WHERE draft_id=? ORDER BY ts", (did,))]
        return d


class Handler(BaseHTTPRequestHandler):
    server_version = "review-gate/1.0"
    store = None

    def _send(self, code, obj):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))

    def _body(self):
        n = int(self.headers.get("Content-Length") or 0)
        return json.loads(self.rfile.read(n).decode("utf-8") or "{}")

    def do_GET(self):
        p = self.path.rstrip("/")
        if p in ("", "/health"):
            q = self.store.queue("pending")
            self._send(200, {"ok": True, "service": "review-gate",
                             "pending": len(q),
                             "overdue": sum(1 for x in q if x["overdue"])})
        elif p.startswith("/v1/gate/queue"):
            status = "pending"
            if "status=" in self.path:
                status = self.path.split("status=")[1].split("&")[0]
            self._send(200, {"ok": True, "items": self.store.queue(status)})
        elif p.startswith("/v1/gate/record/"):
            try:
                self._send(200, {"ok": True, "record": self.store.record(p.split("/")[-1])})
            except KeyError:
                self._send(404, {"ok": False, "error": "草案不存在"})
        else:
            self._send(404, {"ok": False, "error": "not found"})

    def do_POST(self):
        p = self.path.rstrip("/")
        try:
            body = self._body()
            if p == "/v1/gate/submit":
                self._send(200, {"ok": True, **self.store.submit(body)})
            elif p == "/v1/gate/review":
                self._send(200, {"ok": True, "record": self.store.review(body)})
            elif p == "/v1/gate/finalize":
                self._send(200, {"ok": True, "record": self.store.finalize(body)})
            else:
                self._send(404, {"ok": False, "error": "not found"})
        except ValueError as e:
            self._send(400, {"ok": False, "error": str(e)})
        except KeyError:
            self._send(404, {"ok": False, "error": "草案不存在"})
        except RuntimeError as e:
            self._send(409, {"ok": False, "error": str(e)})
        except Exception as e:
            self._send(500, {"ok": False, "error": str(e)[:200]})


def main():
    global ARGS
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, required=True)
    ap.add_argument("--data-dir", required=True)
    ARGS = ap.parse_args()
    Handler.store = Store(ARGS.data_dir)
    srv = HTTPServer(("127.0.0.1", ARGS.port), Handler)
    sys.stderr.write("review-gate listening on 127.0.0.1:%d data=%s\n"
                     % (ARGS.port, ARGS.data_dir))
    srv.serve_forever()


if __name__ == "__main__":
    main()
