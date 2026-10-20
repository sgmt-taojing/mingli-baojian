#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""tcm-reasoning-paradigm 消费方正式服务入口（每消费方一个实例）。

把 OTA 蒸馏来的中医推理范式运行时暴露为本项目自有 HTTP 服务：
  GET  /health                 健康检查
  POST /v1/paradigm/analyze    入参 MULTIMODAL_STD_INPUT JSON 报文，
                               返回检索命中 + 三段式报告（report=true 时）

设计纪律：
- 推理阶段零依赖源智能体（中医标准）；只调本机后端（local_files 或本机 KB API）。
- 边界按消费方转译：命理主场用 --allow-fate 关闭源端命理拒答；
  家庭端保留默认边界（拒答诊断/处方类请求走安全兜底）。
"""
import argparse
import json
import os
import sys
import urllib.parse
from http.server import BaseHTTPRequestHandler, HTTPServer

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import paradigm_runtime as pr  # noqa: E402

ARGS = None


class Handler(BaseHTTPRequestHandler):
    server_version = "tcm-paradigm-svc/1.0"

    def _send(self, code, obj):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):  # 静默访问日志，走 launchd stdout
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))

    def do_GET(self):
        if self.path.rstrip("/") in ("", "/health"):
            self._send(200, {
                "ok": True, "service": "tcm-paradigm-svc",
                "backend": ARGS.backend,
                "kb_root": ARGS.kb_root, "api_url": ARGS.api_url,
                "allow_fate": ARGS.allow_fate,
                "archive_dir": ARGS.archive_dir,
            })
            return
        # 长期预测：GET /v1/living-report/<member>/trend[?days=N]
        if self.path.startswith("/v1/living-report/"):
            if not ARGS.archive_dir:
                self._send(400, {"ok": False, "error": "本实例未开归档，无活体报告"})
                return
            rest = self.path[len("/v1/living-report/"):]
            member, _, qs = rest.partition("/trend")
            member = urllib.parse.unquote(member.strip("/"))
            days = 30
            if "days=" in qs:
                try:
                    days = int(qs.split("days=")[1].split("&")[0])
                except ValueError:
                    pass
            import trend_engine
            series = trend_engine.load_series(ARGS.archive_dir, member, days)
            self._send(200, trend_engine.render_report(member, series, days))
            return
        self._send(404, {"ok": False, "error": "not found"})

    def do_POST(self):
        if self.path.rstrip("/") != "/v1/paradigm/analyze":
            self._send(404, {"ok": False, "error": "not found"})
            return
        try:
            n = int(self.headers.get("Content-Length") or 0)
            msg = json.loads(self.rfile.read(n).decode("utf-8") or "{}")
        except Exception as e:
            self._send(400, {"ok": False, "error": "报文 JSON 解析失败: %s" % e})
            return
        boundary = None if ARGS.allow_fate else pr.DEFAULT_BOUNDARY
        out = pr.handle(msg, ARGS.backend, kb_root=ARGS.kb_root,
                        api_url=ARGS.api_url, boundary=boundary)
        if out.get("ok"):
            try:
                import back_control
                out["confidence"] = back_control.confidence_of(out)  # 供感知层回控驱动
            except Exception:
                pass
        if ARGS.archive_dir and out.get("report_markdown"):
            archive_report(ARGS.archive_dir, msg, out)
        if ARGS.gate_url and msg.get("level") == "L2":
            # R-J2 口径裁定：命中 0 条/文献无记载的报告不占核定资源——
            # 转记知识缺口台账（knowledge-gap.jsonl，供采集线补知识），不送闸。
            entries = out.get("entries") or []
            if out.get("no_record") or len(entries) == 0:
                _log_knowledge_gap(msg, out)
                out["gate"] = {"submitted": False, "skipped": "no_record",
                               "note": "命中 0 条/文献无记载，已记知识缺口台账，不占用核定闸"}
            else:
                out["gate"] = submit_to_gate(ARGS.gate_url, msg, out)
        self._send(200, out)


def _log_knowledge_gap(msg, out):
    """R-J2：知识缺口台账（与活体报告归档同级的 knowledge-gap.jsonl）。"""
    if not ARGS.archive_dir:
        return
    import datetime
    gap = os.path.join(os.path.dirname(ARGS.archive_dir.rstrip("/")), "knowledge-gap.jsonl")
    rec = {"ts": datetime.datetime.now().isoformat(timespec="seconds"),
           "source": ARGS.source,
           "member_id": msg.get("member_id") or msg.get("subject_id") or "",
           "kind": msg.get("kind") or "diagnosis",
           "query": out.get("query") or msg.get("query"), "no_record": bool(out.get("no_record"))}
    try:
        with open(gap, "a", encoding="utf-8") as f:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")
    except Exception:
        pass


def submit_to_gate(gate_url, msg, out):
    """L2 专业草案自动送核定闸（§3B.3：一律草案态，核定后方可进入服务闭环）。"""
    import urllib.request
    payload = {"level": "L2", "kind": msg.get("kind") or "diagnosis",
               "subject_id": msg.get("member_id") or msg.get("subject_id") or "",
               "source": ARGS.source,
               "draft": {"query": out.get("query"),
                         "entries": out.get("entries"),
                         "report_markdown": out.get("report_markdown")}}
    try:
        req = urllib.request.Request(
            gate_url.rstrip("/") + "/v1/gate/submit",
            data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
            headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=10) as r:
            d = json.loads(r.read().decode("utf-8"))
        return {"submitted": bool(d.get("ok")), "gate_id": d.get("id"),
                "status": d.get("status"), "deadline": d.get("deadline"),
                "dedup": d.get("dedup")}
    except Exception as e:
        return {"submitted": False, "error": str(e)[:120]}


def archive_report(root, msg, out):
    """活体报告归档 v0.1：按成员分目录追加，供持续修正与长期预测打底。"""
    import datetime
    member = str(msg.get("member_id") or "default")
    d = os.path.join(root, member)
    os.makedirs(d, exist_ok=True)
    ts = datetime.datetime.now().strftime("%Y-%m-%dT%H%M%S")
    rec = {"ts": ts, "member_id": member, "query": out.get("query"),
           "entries": out.get("entries"), "no_record": out.get("no_record"),
           "report_markdown": out.get("report_markdown")}
    path = os.path.join(d, ts + ".json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(rec, f, ensure_ascii=False, indent=2)
    idx = os.path.join(d, "index.jsonl")
    with open(idx, "a", encoding="utf-8") as f:
        f.write(json.dumps({"ts": ts, "file": ts + ".json",
                            "query": out.get("query"),
                            "hits": len(out.get("entries") or [])},
                           ensure_ascii=False) + "\n")


def main():
    global ARGS
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, required=True)
    ap.add_argument("--backend", choices=["local_kb_api", "local_files"], required=True)
    ap.add_argument("--kb-root", default=None)
    ap.add_argument("--api-url", default=None)
    ap.add_argument("--allow-fate", action="store_true")
    ap.add_argument("--archive-dir", default=None,
                    help="活体报告归档目录（按 member_id 分目录）")
    ap.add_argument("--gate-url", default=None,
                    help="核定闸服务地址（msg.level=L2 时自动送审）")
    ap.add_argument("--source", default="tcm-paradigm-svc",
                    help="送闸来源标签（按部署项目区分，如 mingli-paradigm-svc）")
    ARGS = ap.parse_args()
    srv = HTTPServer(("127.0.0.1", ARGS.port), Handler)
    sys.stderr.write("tcm-paradigm-svc listening on 127.0.0.1:%d backend=%s\n"
                     % (ARGS.port, ARGS.backend))
    srv.serve_forever()


if __name__ == "__main__":
    main()
