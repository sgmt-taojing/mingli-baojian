#!/usr/bin/env python3
"""
本地API代理服务 - 解决浏览器CORS限制
代理前端请求到 ZhipuAI (AutoClaw) API
端口: 8900
"""

from http.server import HTTPServer, SimpleHTTPRequestHandler
import json
import urllib.request
import urllib.error
import os
import sys

PORT = 8900  # 本地API代理端口，前端通过此端口访问AI模型

# 从 openclaw.runtime.json 读取 API 配置
API_BASE_URL = "https://autoglm-api.zhipuai.cn/autoclaw-proxy/proxy/autoclaw"
API_HEADERS = {}
DEFAULT_MODEL = "openrouter_glm-5.2"

def load_api_config():
    global API_BASE_URL, API_HEADERS, DEFAULT_MODEL
    config_path = os.path.expanduser("~/.openclaw-autoclaw/openclaw.runtime.json")
    if not os.path.exists(config_path):
        config_path = os.path.expanduser("~/.qclaw/openclaw.json")
    if not os.path.exists(config_path):
        print(f"❌ 找不到配置文件")
        return False
    try:
        with open(config_path, 'r') as f:
            config = json.load(f)
        provider = config.get('models', {}).get('providers', {}).get('zai', {})
        API_BASE_URL = provider.get('baseUrl', API_BASE_URL)
        models = provider.get('models', [])
        # 找到默认模型
        target_model = None
        for m in models:
            if m['id'] == 'openrouter_glm-5.2':
                target_model = m
                break
        if not target_model:
            target_model = models[0] if models else {}
        DEFAULT_MODEL = target_model.get('id', 'openrouter_glm-5.2')
        API_HEADERS = target_model.get('headers', {})
        # 确保 Content-Type 在请求时设置
        print(f"✅ 已加载API配置: model={DEFAULT_MODEL}")
        print(f"   API端点: {API_BASE_URL}")
        return True
    except Exception as e:
        print(f"❌ 读取配置失败: {e}")
        return False

class APIProxyHandler(SimpleHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

    def do_POST(self):
        if self.path == '/v1/chat/completions':
            self.handle_chat_completions()
        else:
            self.send_error(404)

    def handle_chat_completions(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body)

            # 使用配置的模型
            data['model'] = DEFAULT_MODEL

            print(f"[API Proxy] 请求: messages={len(data.get('messages', []))}条")

            # 构建请求头
            headers = {
                'Content-Type': 'application/json',
            }
            headers.update(API_HEADERS)

            req = urllib.request.Request(
                API_BASE_URL + '/v1/chat/completions',
                data=json.dumps(data).encode('utf-8'),
                headers=headers,
                method='POST'
            )

            with urllib.request.urlopen(req, timeout=120) as resp:
                result = resp.read()
                self.send_response(200)
                self.send_cors_headers()
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(result)
                print(f"[API Proxy] 完成, 响应={len(result)}字节")

        except urllib.error.HTTPError as e:
            error_body = e.read().decode('utf-8', errors='replace')
            print(f"[API Proxy] 上游错误: {e.code}")
            self.send_response(e.code)
            self.send_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": {"message": f"API错误: {e.code}", "detail": error_body[:500]}}).encode())

        except Exception as e:
            print(f"[API Proxy] 异常: {e}")
            self.send_response(500)
            self.send_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": {"message": str(e)}}).encode())

    def send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Max-Age', '86400')

    def log_message(self, format, *args):
        pass  # 静默日志

def main():
    if not load_api_config():
        print("❌ 无法加载API配置，请检查配置文件")
        sys.exit(1)

    server = HTTPServer(('0.0.0.0', PORT), APIProxyHandler)
    print(f"🚀 API代理服务已启动: http://127.0.0.1:{PORT}")
    print(f"   代理到: {API_BASE_URL}/v1/chat/completions")
    print(f"   模型: {DEFAULT_MODEL}")
    print(f"   按 Ctrl+C 停止")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 服务已停止")
        server.server_close()

if __name__ == '__main__':
    main()
