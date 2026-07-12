#!/usr/bin/env python3
"""易道智鉴文件服务器 — 强制无缓存"""
import http.server
import socketserver
import os

PORT = 8910
DIRECTORY = '/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian'

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        # 强制所有响应不缓存
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        # 禁用ETag
        self.send_header('ETag', '')
        super().end_headers()
    
    def guess_type(self, path):
        mimetype = super().guess_type(path)
        return mimetype

if __name__ == '__main__':
    os.chdir(DIRECTORY)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("0.0.0.0", PORT), NoCacheHandler) as httpd:
        print(f"✅ 易道智鉴服务器运行中: http://127.0.0.1:{PORT}")
        print(f"   强制无缓存模式")
        httpd.serve_forever()
