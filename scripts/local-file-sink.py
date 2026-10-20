#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""local-file-sink.py — 一次性本地文件接收器（配合浏览器收割脚本）

监听 127.0.0.1:8931：
  POST /save?name=<filename>   body 原文写入 training/shidian-fetch/inbox/<filename>
  GET  /health                 返回 ok
支持 CORS + Private Network Access 预检（https 页面 -> 127.0.0.1）。
收割完成后应手动关闭（不要在系统里常驻）。
"""
import os
import re
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INBOX = os.path.join(ROOT, "training", "shidian-fetch", "inbox")
os.makedirs(INBOX, exist_ok=True)

SAFE = re.compile(r"^[A-Za-z0-9._\-\u4e00-\u9fff]{1,80}$")


class H(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Private-Network", "true")

    def do_OPTIONS(self):
        self.send_response(200)
        self._cors()
        self.end_headers()

    def do_GET(self):
        if urlparse(self.path).path == "/health":
            body = b"ok"
            self.send_response(200)
            self._cors()
            self.send_header("Content-Type", "text/plain")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        else:
            self.send_response(404)
            self._cors()
            self.end_headers()

    def do_POST(self):
        u = urlparse(self.path)
        if u.path != "/save":
            self.send_response(404)
            self._cors()
            self.end_headers()
            return
        name = (parse_qs(u.query).get("name") or [""])[0]
        if not SAFE.match(name):
            self.send_response(400)
            self._cors()
            self.end_headers()
            return
        n = int(self.headers.get("Content-Length") or 0)
        if n <= 0 or n > 20 * 1024 * 1024:
            self.send_response(400)
            self._cors()
            self.end_headers()
            return
        data = self.rfile.read(n)
        path = os.path.join(INBOX, name)
        with open(path, "wb") as f:
            f.write(data)
        body = ("saved %s %d" % (name, len(data))).encode()
        self.send_response(200)
        self._cors()
        self.send_header("Content-Type", "text/plain")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
        print("saved", name, len(data), flush=True)

    def log_message(self, *a):  # 静默
        pass


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8931
    print("sink listening on 127.0.0.1:%d inbox=%s" % (port, INBOX), flush=True)
    ThreadingHTTPServer(("127.0.0.1", port), H).serve_forever()
