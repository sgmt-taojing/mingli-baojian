#!/usr/bin/env python3
"""
AI API代理服务 — 命理宝鉴
端口: 8900
支持两种模式:
1. Docker部署: 从环境变量 G2CLAW_API_KEY 读取密钥
2. 本地开发: 从 ~/.openclaw-autoclaw/openclaw.runtime.json 读取配置
"""

from http.server import HTTPServer, SimpleHTTPRequestHandler
import json
import urllib.request
import urllib.error
import os
import sys

PORT = int(os.environ.get('PORT', 8900))

# === API配置 ===
API_BASE_URL = os.environ.get('API_BASE_URL', 'https://api.g2claw.com')
API_KEY = os.environ.get('G2CLAW_API_KEY', '')
DEFAULT_MODEL = os.environ.get('DEFAULT_MODEL', 'auto')

def load_api_config():
    """加载API配置 — 优先环境变量，其次本地配置文件"""
    global API_BASE_URL, API_KEY, DEFAULT_MODEL
    
    # 方式1: 环境变量 (Docker模式)
    if API_KEY:
        print(f"✅ 使用环境变量配置: G2CLAW_API_KEY={API_KEY[:8]}...")
        print(f"   API端点: {API_BASE_URL}")
        print(f"   模型: {DEFAULT_MODEL}")
        return True
    
    # 方式2: 本地配置文件 (开发模式)
    config_path = os.path.expanduser("~/.openclaw-autoclaw/openclaw.runtime.json")
    if not os.path.exists(config_path):
        config_path = os.path.expanduser("~/.qclaw/openclaw.json")
    if not os.path.exists(config_path):
        print(f"⚠️  未找到API配置")
        print(f"   Docker模式: 设置环境变量 G2CLAW_API_KEY")
        print(f"   开发模式: 确保 ~/.openclaw-autoclaw/openclaw.runtime.json 存在")
        return False
    try:
        with open(config_path, 'r') as f:
            config = json.load(f)
        provider = config.get('models', {}).get('providers', {}).get('zai', {})
        API_BASE_URL = provider.get('baseUrl', API_BASE_URL)
        models = provider.get('models', [])
        target_model = None
        for m in models:
            if m['id'] == 'openrouter_glm-5.2':
                target_model = m
                break
        if not target_model:
            target_model = models[0] if models else {}
        DEFAULT_MODEL = target_model.get('id', 'openrouter_glm-5.2')
        # 从headers中提取API key
        headers = target_model.get('headers', {})
        auth = headers.get('Authorization', '')
        if auth.startswith('Bearer '):
            API_KEY = auth[7:]
        API_BASE_URL = API_BASE_URL.rstrip('/')
        print(f"✅ 已加载本地配置: model={DEFAULT_MODEL}")
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

    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok"}).encode())
        else:
            self.send_error(404)

    def handle_chat_completions(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body)

            # 如果请求中没有model或model是auto，使用默认
            if not data.get('model') or data.get('model') == 'auto':
                data['model'] = DEFAULT_MODEL

            print(f"[API Proxy] 请求: messages={len(data.get('messages', []))}条 model={data.get('model')}")

            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {API_KEY}',
            }

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
            print(f"[API Proxy] 上游错误: {e.code} {error_body[:200]}")
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
        pass


def main():
    if not load_api_config():
        print("❌ 无法加载API配置")
        print("   Docker: docker-compose会从.env读取G2CLAW_API_KEY")
        print("   本地: 确保openclaw.runtime.json存在或设置G2CLAW_API_KEY环境变量")
        sys.exit(1)

    server = HTTPServer(('0.0.0.0', PORT), APIProxyHandler)
    print(f"🚀 API代理服务已启动: http://0.0.0.0:{PORT}")
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
