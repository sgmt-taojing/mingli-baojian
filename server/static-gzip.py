#!/usr/bin/env python3
"""
命理宝鉴 · gzip 静态服务器
替代 Python SimpleHTTP，自动 gzip 压缩 text/html/css/js
节点 5.2.5（性能优化）
"""

import http.server
import socketserver
import os
import sys
import gzip
import io
from pathlib import Path

PORT = int(os.environ.get('PORT', 8914))
DIRECTORY = os.environ.get('STATIC_DIR', os.path.join(os.path.dirname(__file__), '..', 'app'))
GZIP_MIN_SIZE = 1024  # < 1KB 不压缩
GZIP_TYPES = {
    'text/html', 'text/css', 'text/javascript', 'application/javascript',
    'application/json', 'application/xml', 'text/plain', 'image/svg+xml'
}


class GzipHandler(http.server.SimpleHTTPRequestHandler):
    """继承 SimpleHTTPRequestHandler，加上 gzip 支持"""

    server_version = "GzipStatic/1.0"
    sys_version = ""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def guess_type(self, path):
        mimetype = super().guess_type(path)
        # 确保 JS 返回正确 MIME
        if str(path).endswith('.js'):
            return 'application/javascript'
        if str(path).endswith('.mjs'):
            return 'application/javascript'
        return mimetype

    def end_headers(self):
        # 不覆盖已有 Content-Encoding
        if not self.headers.get('Content-Encoding'):
            self.headers['X-Gzip-Ready'] = '1'
        super().end_headers()

    def _can_gzip(self, path):
        """判断是否能 gzip（共享给 GET/HEAD）"""
        accept_encoding = self.headers.get('Accept-Encoding', '')
        if 'gzip' not in accept_encoding.lower():
            return False, None
        if not os.path.isfile(path):
            return False, None
        file_size = os.path.getsize(path)
        if file_size < GZIP_MIN_SIZE:
            return False, None
        mimetype = self.guess_type(path)
        if mimetype not in GZIP_TYPES:
            return False, None
        return True, mimetype

    def _send_gzip(self, path, mimetype):
        """读取并发送 gzip 压缩响应"""
        try:
            with open(path, 'rb') as f:
                content = f.read()
            compressed = gzip.compress(content, compresslevel=6)

            self.send_response(200)
            self.send_header('Content-Type', mimetype)
            self.send_header('Content-Encoding', 'gzip')
            self.send_header('Content-Length', str(len(compressed)))
            self.send_header('Vary', 'Accept-Encoding')
            self.send_header('Cache-Control', 'public, max-age=3600')
            self.end_headers()
            if self.command != 'HEAD':
                self.wfile.write(compressed)
        except Exception as e:
            sys.stderr.write(f'[gzip-error] {self.path}: {e}\n')
            super().do_GET()

    def _send_range(self, path, mimetype, start, end, total_size):
        """发送 206 Partial Content 响应"""
        length = end - start + 1
        try:
            with open(path, 'rb') as f:
                f.seek(start)
                content = f.read(length)

            self.send_response(206)
            self.send_header('Content-Type', mimetype)
            self.send_header('Content-Length', str(length))
            self.send_header('Content-Range', f'bytes {start}-{end}/{total_size}')
            self.send_header('Accept-Ranges', 'bytes')
            self.send_header('Cache-Control', 'public, max-age=3600')
            self.end_headers()
            if self.command != 'HEAD':
                self.wfile.write(content)
        except Exception as e:
            sys.stderr.write(f'[range-error] {self.path}: {e}\n')
            sys.stderr.flush()
            self.send_error(500, f'Range error: {e}')

    def _handle_range_request(self, path, mimetype):
        """处理 Range 请求，支持单段/多段（简单实现：单段）"""
        try:
            total_size = os.path.getsize(path)
            range_header = self.headers.get('Range', '')
            # 格式: bytes=start-end 或 bytes=start-
            if not range_header.startswith('bytes='):
                return False
            range_spec = range_header[6:].split(',')[0].strip()
            if '-' not in range_spec:
                return False
            parts = range_spec.split('-')
            start = int(parts[0]) if parts[0] else 0
            end = int(parts[1]) if parts[1] else (total_size - 1)
            if start >= total_size:
                self.send_response(416)
                self.send_header('Content-Range', f'bytes */{total_size}')
                self.end_headers()
                return True
            end = min(end, total_size - 1)
            self._send_range(path, mimetype, start, end, total_size)
            return True
        except Exception as e:
            sys.stderr.write(f'[range-parse-error] {self.path}: {e}\n')
            sys.stderr.flush()
            return False

    def do_GET(self):
        """处理 GET 请求：Range → 206；文本类 → gzip；其他 → 原样"""
        path = self.translate_path(self.path)
        # Range 请求（无论是否压缩，都支持 Range）
        if 'Range' in self.headers:
            if not os.path.isfile(path):
                return super().do_GET()
            mimetype = self.guess_type(path)
            # Range on gzipped resource is tricky; skip gzip for Range
            if self._handle_range_request(path, mimetype):
                return
            return super().do_GET()
        # 普通请求：自动 gzip
        ok, mimetype = self._can_gzip(path)
        if ok:
            return self._send_gzip(path, mimetype)
        return super().do_GET()

    def do_HEAD(self):
        """HEAD 也走 gzip/Range 路径（只发头不发体）"""
        path = self.translate_path(self.path)
        if 'Range' in self.headers:
            if not os.path.isfile(path):
                return super().do_HEAD()
            mimetype = self.guess_type(path)
            if self._handle_range_request(path, mimetype):
                return
            return super().do_HEAD()
        ok, mimetype = self._can_gzip(path)
        if ok:
            return self._send_gzip(path, mimetype)
        return super().do_HEAD()


class ThreadingServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    """多线程处理"""
    daemon_threads = True
    allow_reuse_address = True


if __name__ == '__main__':
    os.chdir(DIRECTORY)
    server = ThreadingServer(('0.0.0.0', PORT), GzipHandler)
    print(f'═══ 命理宝鉴 gzip 静态服务 ═══')
    print(f'  端口: {PORT}')
    print(f'  目录: {DIRECTORY}')
    print(f'  gzip: 启用（>{GZIP_MIN_SIZE}B 文本类）')
    print(f'═══════════════════════════════')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n服务停止')
        server.shutdown()
