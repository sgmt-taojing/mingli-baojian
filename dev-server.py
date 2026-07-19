#!/usr/bin/env python3
"""命理宝鉴本地开发服务器——静态文件+API反向代理"""
import http.server
import http.client
import os
import urllib.parse

PORT = 8900
ROOT = os.path.dirname(os.path.abspath(__file__))
API_HOST = '127.0.0.1'
API_PORT = 8920

class MingliHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def do_GET(self):
        self._handle_api_or_static('GET')

    def do_POST(self):
        self._handle_api_or_static('POST')

    def do_PUT(self):
        self._handle_api_or_static('PUT')

    def do_DELETE(self):
        self._handle_api_or_static('DELETE')

    def _handle_api_or_static(self, method):
        # API请求转发到8920
        if self.path.startswith('/api/'):
            self._proxy_to_api(method)
        elif method == 'GET':
            super().do_GET()
        else:
            self.send_response(405)
            self.end_headers()

    def _proxy_to_api(self, method):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length) if content_length > 0 else None

        conn = http.client.HTTPConnection(API_HOST, API_PORT, timeout=30)
        headers = dict(self.headers)
        headers['Host'] = f'{API_HOST}:{API_PORT}'
        # 移除可能导致问题的头
        for h in ['Transfer-Encoding', 'Content-Length']:
            headers.pop(h, None)

        try:
            conn.request(method, self.path, body=body, headers=headers)
            resp = conn.getresponse()
            resp_body = resp.read()

            self.send_response(resp.status)
            for key, val in resp.getheaders():
                if key.lower() not in ['transfer-encoding', 'content-length', 'connection']:
                    self.send_header(key, val)
            self.send_header('Content-Length', len(resp_body))
            self.end_headers()
            self.wfile.write(resp_body)
        except Exception as e:
            self.send_response(502)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(f'{{"error":"API服务不可用: {e}"}}'.encode())
        finally:
            conn.close()

if __name__ == '__main__':
    server = http.server.HTTPServer(('0.0.0.0', PORT), MingliHandler)
    print(f'命理宝鉴本地服务启动: http://127.0.0.1:{PORT}')
    print(f'静态文件: {ROOT}')
    print(f'API代理: → http://{API_HOST}:{API_PORT}')
    server.serve_forever()
